---
title: "Pattern 5: API Integration"
version: "2025.1.2"
purpose: "TanStack Query with ServiceNow-specific caching and mutations"
readTime: "4 minutes"
complexity: "intermediate"
prerequisites: ["tanstack-query-basics", "servicenow-table-api"]
concepts: ["query-optimization", "cache-management", "servicenow-integration", "error-handling"]
codeExamples: 3
completeness: 100
testability: true
productionReady: true
---

# Pattern 5: API Integration

**Purpose:** TanStack Query with ServiceNow-specific caching and mutations  
**Read time:** ~4 minutes  
**Problem:** Inefficient API calls, poor caching, and ServiceNow-specific requirements

---

## 🚨 Problem Statement

### **API Integration Challenges:**
- Multiple redundant API calls
- Poor caching strategies
- ServiceNow-specific authentication and formatting
- No optimistic updates for better UX

---

## ✅ Solution: ServiceNow-Optimized TanStack Query

### **ServiceNow Query Service:**
```typescript
// services/ServiceNowQueryService.ts - PATTERN: Optimized API service
export class ServiceNowQueryService {
  private baseURL: string;
  private token: string;

  constructor(token: string, baseURL?: string) {
    this.token = token;
    this.baseURL = baseURL || window.location.origin;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-UserToken': this.token, // CSRF protection
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new ServiceNowError(`API Error: ${response.status}`, response.status);
    }

    const data = await response.json();
    
    // Extract pagination info from headers
    const total = response.headers.get('X-Total-Count');
    if (total && Array.isArray(data.result)) {
      (data as any).total = parseInt(total, 10);
    }
    
    return data;
  }

  async getIncidents(params: IncidentQueryParams = {}): Promise<ServiceNowResponse<Incident>> {
    const searchParams = new URLSearchParams({
      sysparm_fields: [
        'sys_id', 'number', 'short_description', 'state', 'priority', 
        'assigned_to', 'caller_id', 'sys_created_on'
      ].join(','),
      sysparm_limit: params.limit?.toString() || '25',
      sysparm_offset: params.offset?.toString() || '0',
      sysparm_display_value: 'all',
      sysparm_no_count: 'false',
      ...(params.query && { sysparm_query: params.query })
    });

    return this.makeRequest<ServiceNowResponse<Incident>>(
      `/api/now/table/incident?${searchParams.toString()}`
    );
  }

  async updateIncident(sysId: string, data: Partial<Incident>): Promise<Incident> {
    return this.makeRequest<Incident>(`/api/now/table/incident/${sysId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}
```

### **Optimized Query Hooks:**
```typescript
// hooks/useIncidentQueries.ts - PATTERN: Performance-optimized queries
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useIncidents(params: IncidentQueryParams = {}) {
  return useQuery({
    queryKey: ['incidents', params],
    queryFn: () => getServiceNowQueryService().getIncidents(params),
    
    // Performance optimizations
    staleTime: 2 * 60 * 1000,     // 2 minutes
    gcTime: 5 * 60 * 1000,        // 5 minutes cache retention
    keepPreviousData: true,       // Smooth pagination
    
    // Smart retry logic
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.status === 403) return false;
      if (error?.message?.includes('timeout')) return false;
      return failureCount < 3;
    },
    
    // UX optimizations
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

// Optimistic mutation with rollback
export function useUpdateIncident() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sysId, data }: { sysId: string; data: Partial<Incident> }) =>
      getServiceNowQueryService().updateIncident(sysId, data),
    
    // Optimistic update for instant UI feedback
    onMutate: async ({ sysId, data }) => {
      await queryClient.cancelQueries(['incidents']);
      
      const previousIncidents = queryClient.getQueryData(['incidents']);
      
      queryClient.setQueryData(['incidents'], (old: any) => {
        if (!old?.result) return old;
        
        return {
          ...old,
          result: old.result.map((incident: Incident) =>
            incident.sys_id.value === sysId
              ? { ...incident, ...data }
              : incident
          ),
        };
      });
      
      return { previousIncidents };
    },
    
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previousIncidents) {
        queryClient.setQueryData(['incidents'], context.previousIncidents);
      }
    },
    
    // Refetch on success to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries(['incidents']);
    },
  });
}

// Specialized hooks for common use cases
export function useMyIncidents() {
  const currentUser = window.SN_USER;
  
  return useIncidents({
    query: `assigned_to=${currentUser?.sys_id}^active=true`,
    limit: 50
  });
}
```

### **Query Client Configuration:**
```typescript
// lib/queryClient.ts - PATTERN: ServiceNow-optimized configuration
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ServiceNow-specific defaults
      staleTime: 5 * 60 * 1000,  // 5 minutes
      gcTime: 10 * 60 * 1000,    // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      
      // Error handling
      onError: (error) => {
        console.error('Query Error:', error);
        // Could integrate with notification system
      },
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation Error:', error);
        // Could show user-friendly error message
      },
    },
  },
});
```

---

## 🧪 Validation & Testing

### **API Integration Testing:**
```typescript
describe('API Integration', () => {
  it('should cache incident queries correctly', async () => {
    const { result } = renderHook(() => useIncidents({ limit: 10 }));
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
    
    // Second call should use cache
    const { result: result2 } = renderHook(() => useIncidents({ limit: 10 }));
    expect(result2.current.data).toBe(result.current.data);
  });
  
  it('should handle optimistic updates correctly', async () => {
    const { result } = renderHook(() => useUpdateIncident());
    
    act(() => {
      result.current.mutate({
        sysId: 'test-id',
        data: { short_description: 'Updated description' }
      });
    });
    
    // Should immediately show optimistic update
    const incidents = queryClient.getQueryData(['incidents']);
    expect(incidents).toContain({ short_description: 'Updated description' });
  });
});
```

---

*API integration pattern provides efficient data fetching with ServiceNow-specific optimizations and excellent user experience through caching and optimistic updates.*