---
title: "ServiceNow Services + TanStack Query Integration"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "MANDATORY reading before implementing any ServiceNow service layer"
readTime: "8 minutes"
criticality: "MANDATORY"
breaking-changes: ["Replaces v2024.x manual data fetching patterns"]
---

# ⚠️ CRITICAL: ServiceNow Services + TanStack Query Integration

**This section is MANDATORY reading before implementing any ServiceNow service layer.**

## The Failed Approach (What Went Wrong)

### **❌ FAILED: Services Without TanStack Query**
```tsx
// ❌ This approach FAILED in production - DO NOT USE
class IncidentService {
  async getIncidents(): Promise<Incident[]> {
    // Service handles API call
    const response = await fetch('/api/now/table/incident');
    return response.json();
  }
}

// Component tries to manage state manually
function IncidentList() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    incidentService.getIncidents()
      .then(setIncidents)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  // PROBLEMS:
  // ❌ No caching - refetches on every mount
  // ❌ No background sync - data goes stale
  // ❌ No optimistic updates - poor UX
  // ❌ Manual error handling - inconsistent
  // ❌ No request deduplication - wasteful
  // ❌ Difficult to test - tightly coupled
}
```

**Why This Failed:**
- Data loading issues due to missing caching
- Poor user experience with blocking operations
- No automatic error recovery
- Redundant API calls
- Manual state management complexity

## The Working Approach (Architecture That Succeeds)

### **✅ SUCCESS: Services + TanStack Query Integration**
```tsx
// ✅ Service provides pure business logic
class EnhancedIncidentService extends BaseServiceNowService {
  async getIncidents(options: IncidentQueryOptions = {}): Promise<ServiceNowTableResponse<Incident>> {
    // Pure function - returns data, doesn't manage React state
    return this.request<ServiceNowTableResponse<Incident>>(`/table/incident?${params}`);
  }

  async assignToMe(incidentId: string, userId: string): Promise<Incident> {
    // Business logic - pure function
    return this.updateIncident(incidentId, {
      assigned_to: { value: userId },
      state: { value: '2' } // In Progress
    });
  }
}

// ✅ TanStack Query hook bridges service to React
export function useIncidents(options: IncidentQueryOptions = {}) {
  return useQuery({
    queryKey: ['incidents', options],
    queryFn: () => enhancedIncidentService.getIncidents(options), // Service call
    staleTime: 2 * 60 * 1000, // Smart caching
    // TanStack Query handles: loading, error, background sync, deduplication
  });
}

export function useIncidentMutations() {
  const queryClient = useQueryClient();

  const assignToMe = useMutation({
    mutationFn: ({ incidentId, userId }) => 
      enhancedIncidentService.assignToMe(incidentId, userId), // Service call
    
    // Optimistic update for instant feedback
    onMutate: async ({ incidentId, userId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['incidents', 'detail', incidentId]);
      
      // Snapshot previous value
      const previousIncident = queryClient.getQueryData(['incidents', 'detail', incidentId]);
      
      // Optimistically update
      queryClient.setQueryData(['incidents', 'detail', incidentId], {
        ...previousIncident,
        assigned_to: { value: userId, display_value: 'Assigning...' }
      });
      
      return { previousIncident };
    },
    
    onSuccess: (updatedIncident) => {
      // Update with real data
      queryClient.setQueryData(['incidents', 'detail', updatedIncident.sys_id], updatedIncident);
      // Invalidate related queries
      queryClient.invalidateQueries(['incidents']);
    },
    
    onError: (error, variables, context) => {
      // Rollback optimistic update
      if (context?.previousIncident) {
        queryClient.setQueryData(
          ['incidents', 'detail', variables.incidentId], 
          context.previousIncident
        );
      }
    }
  });

  return { assignToMe };
}

// ✅ Component uses hooks, never calls services directly
function IncidentList() {
  const { data: incidents, isLoading, error, refetch } = useIncidents();
  const { assignToMe } = useIncidentMutations();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <div>
      {incidents?.result.map(incident => (
        <div key={incident.sys_id?.value}>
          <h3>{incident.short_description?.display_value}</h3>
          <button
            onClick={() => assignToMe.mutate({ 
              incidentId: incident.sys_id?.value, 
              userId: 'current_user' 
            })}
            disabled={assignToMe.isPending}
          >
            {assignToMe.isPending ? 'Assigning...' : 'Assign to Me'}
          </button>
        </div>
      ))}
    </div>
  );

  // BENEFITS:
  // ✅ Smart caching - instant repeat operations
  // ✅ Background sync - data stays fresh
  // ✅ Optimistic updates - instant feedback
  // ✅ Automatic error handling - consistent UX
  // ✅ Request deduplication - efficient
  // ✅ Easy to test - clear separation
}
```

## Mandatory Integration Pattern

### **The Three-Layer Architecture**
```
┌─────────────────────────────────────────┐
│ React Components                        │
│ ├── Use TanStack Query hooks only      │
│ ├── Never call services directly       │
│ ├── Handle UI rendering and events     │
│ └── Get loading/error states from hooks│
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ TanStack Query Hooks                    │
│ ├── Bridge services to React           │
│ ├── Manage caching and background sync │
│ ├── Handle optimistic updates          │
│ ├── Provide loading/error states       │
│ └── Invalidate related queries         │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Service Layer                           │
│ ├── Pure functions (no React hooks)    │
│ ├── Handle ServiceNow API calls        │
│ ├── Business logic and validation      │
│ ├── Data transformation                │
│ └── Error handling and retry logic     │
└─────────────────────────────────────────┘
```

### **Critical Rules**
1. **Services NEVER manage React state** - They return promises
2. **Components NEVER call services directly** - They use hooks
3. **TanStack Query ALWAYS bridges** - Services to React integration
4. **Query keys MUST be centralized** - For consistent cache management
5. **Mutations MUST include optimistic updates** - For good UX

## Enhanced Base ServiceNow Service Implementation

### **Foundation Service with Complete Error Handling**
```tsx
// services/core/BaseServiceNowService.ts
export interface ServiceNowRequestOptions {
  timeout?: number;
  retries?: number;
  fields?: string[];
  displayValue?: 'true' | 'false' | 'all';
  excludeReferenceLink?: boolean;
}

export interface ServiceNowTableResponse<T> {
  result: T[];
  total?: number;
  links?: {
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
}

export abstract class BaseServiceNowService {
  protected readonly baseURL = '/api/now';
  protected readonly timeout = 30000;
  protected readonly maxRetries = 3;

  /**
   * Get ServiceNow authentication token
   */
  protected getAuthToken(): string {
    const token = (window as any).g_ck;
    if (!token) {
      throw new ServiceNowError(401, 'AUTH_ERROR', 'No authentication token available');
    }
    return token;
  }

  /**
   * Enhanced request method with comprehensive error handling
   * CRITICAL: This is pure - no React state management
   */
  protected async request<T>(
    endpoint: string,
    options: RequestInit & ServiceNowRequestOptions = {}
  ): Promise<T> {
    const { timeout = this.timeout, retries = this.maxRetries, ...requestOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestConfig: RequestInit = {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-UserToken': this.getAuthToken(),
        ...requestOptions.headers,
      },
      ...requestOptions,
    };

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

    try {
      const response = await this.executeWithRetry(
        () => fetch(url, requestConfig),
        retries
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new ServiceNowError(408, 'TIMEOUT_ERROR', `Request timeout after ${timeout}ms`);
      }
      
      if (error instanceof ServiceNowError) {
        throw error;
      }
      
      throw parseServiceNowError(error);
    }
  }

  /**
   * Execute with exponential backoff retry
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries: number
  ): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === retries) throw error;
        
        // Don't retry auth errors or client errors
        if (error.status && error.status >= 400 && error.status < 500) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await this.delay(delay);
      }
    }
    
    throw new ServiceNowError(500, 'RETRY_EXHAUSTED', 'Maximum retry attempts exceeded');
  }

  /**
   * Handle ServiceNow API errors
   */
  private async handleErrorResponse(response: Response): Promise<ServiceNowError> {
    try {
      const errorData = await response.json();
      const message = errorData.error?.message || errorData.error || response.statusText || 'Unknown error';
      const detail = errorData.error?.detail;
      
      return new ServiceNowError(response.status, this.getErrorType(response.status), message, detail);
    } catch {
      return new ServiceNowError(
        response.status, 
        this.getErrorType(response.status), 
        response.statusText || 'Unknown error'
      );
    }
  }

  /**
   * Build ServiceNow query parameters
   */
  protected buildQueryParams(options: ServiceNowRequestOptions = {}): URLSearchParams {
    const params = new URLSearchParams();
    
    if (options.fields && options.fields.length > 0) {
      params.set('sysparm_fields', options.fields.join(','));
    }
    
    params.set('sysparm_display_value', options.displayValue || 'all');
    
    if (options.excludeReferenceLink !== false) {
      params.set('sysparm_exclude_reference_link', 'true');
    }
    
    return params;
  }

  /**
   * Build ServiceNow encoded query
   */
  protected buildEncodedQuery(filters: Record<string, any>): string {
    const queryParts: string[] = [];

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'search') {
          queryParts.push(`short_descriptionLIKE${value}^ORdescriptionLIKE${value}`);
        } else if (Array.isArray(value)) {
          queryParts.push(`${key}IN${value.join(',')}`);
        } else {
          queryParts.push(`${key}=${value}`);
        }
      }
    });

    return queryParts.join('^');
  }

  private getErrorType(status: number): string {
    if (status === 401) return 'AUTH_ERROR';
    if (status === 403) return 'PERMISSION_ERROR';
    if (status === 404) return 'NOT_FOUND';
    if (status >= 500) return 'SERVER_ERROR';
    if (status >= 400) return 'CLIENT_ERROR';
    return 'API_ERROR';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Complete Business Service Implementation

### **Enhanced Incident Service (Production-Ready)**
```tsx
// services/EnhancedIncidentService.ts
export interface IncidentQueryOptions {
  assignedToMe?: boolean;
  assignedTo?: string;
  priority?: string[];
  state?: string[];
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export class EnhancedIncidentService extends BaseServiceNowService {
  /**
   * Get incidents with advanced filtering
   * CRITICAL: Returns raw data - TanStack Query handles caching/state
   */
  async getIncidents(options: IncidentQueryOptions = {}): Promise<ServiceNowTableResponse<Incident>> {
    const {
      limit = 100,
      offset = 0,
      orderBy = 'sys_created_on',
      orderDirection = 'DESC',
      ...filters
    } = options;

    const params = this.buildQueryParams({
      fields: [
        'sys_id', 'number', 'short_description', 'description',
        'priority', 'state', 'assigned_to', 'caller_id',
        'sys_created_on', 'sys_updated_on', 'urgency', 'impact'
      ],
      displayValue: 'all',
      excludeReferenceLink: true
    });

    const encodedQuery = this.buildIncidentQuery(filters);
    if (encodedQuery) {
      params.set('sysparm_query', encodedQuery);
    }

    const orderPrefix = orderDirection === 'DESC' ? 'ORDERBYDESC' : 'ORDERBY';
    const existingQuery = params.get('sysparm_query') || '';
    params.set('sysparm_query', `${existingQuery}^${orderPrefix}${orderBy}`);

    params.set('sysparm_limit', limit.toString());
    params.set('sysparm_offset', offset.toString());

    return this.request<ServiceNowTableResponse<Incident>>(
      `/table/incident?${params.toString()}`
    );
  }

  /**
   * Get single incident
   */
  async getIncident(sysId: string): Promise<Incident> {
    const params = this.buildQueryParams({
      displayValue: 'all',
      excludeReferenceLink: true
    });

    const response = await this.request<{ result: Incident }>(
      `/table/incident/${sysId}?${params.toString()}`
    );

    return response.result;
  }

  /**
   * Business operations - pure functions returning promises
   */
  async assignToMe(incidentId: string, userId: string): Promise<Incident> {
    return this.updateIncident(incidentId, {
      assigned_to: { value: userId, display_value: '' } as any,
      state: { value: '2', display_value: 'In Progress' } as any
    });
  }

  async resolveIncident(incidentId: string, resolution: string, resolutionCode?: string): Promise<Incident> {
    const updates: Partial<Incident> = {
      state: { value: '6', display_value: 'Resolved' } as any,
      close_notes: resolution as any
    };

    if (resolutionCode) {
      updates.close_code = { value: resolutionCode, display_value: '' } as any;
    }

    return this.updateIncident(incidentId, updates);
  }

  /**
   * Update incident - private helper
   */
  private async updateIncident(sysId: string, updates: Partial<Incident>): Promise<Incident> {
    const response = await this.request<{ result: Incident }>(
      `/table/incident/${sysId}`,
      {
        method: 'PUT',
        body: JSON.stringify(this.sanitizeUpdateData(updates))
      }
    );

    return response.result;
  }

  /**
   * Data transformation utilities
   */
  private buildIncidentQuery(filters: IncidentQueryOptions): string {
    const conditions: Record<string, any> = {};

    if (filters.assignedTo) {
      conditions.assigned_to = filters.assignedTo;
    }

    if (filters.priority && filters.priority.length > 0) {
      conditions.priority = filters.priority;
    }

    if (filters.state && filters.state.length > 0) {
      conditions.state = filters.state;
    }

    if (filters.active !== undefined) {
      conditions.active = filters.active;
    }

    if (filters.search) {
      conditions.search = filters.search;
    }

    return this.buildEncodedQuery(conditions);
  }

  private sanitizeUpdateData(data: Partial<Incident>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value === 'object' && 'value' in value) {
        sanitized[key] = (value as any).value;
      } else {
        sanitized[key] = value;
      }
    });

    return sanitized;
  }
}

// Singleton instance
export const enhancedIncidentService = new EnhancedIncidentService();
```

## ServiceNow-Optimized Query Client Configuration

### **Production Query Client Setup**
```tsx
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { ServiceNowError } from '../errors/ServiceNowError';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ServiceNow data caching strategy
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      
      // ServiceNow-specific retry logic
      retry: (failureCount, error) => {
        if (error instanceof ServiceNowError) {
          // Don't retry auth errors
          if (error.status === 401 || error.status === 403) {
            return false;
          }
        }
        
        // Don't retry 4xx client errors
        if (error instanceof ServiceNowError && error.status >= 400 && error.status < 500 && error.status !== 429) {
          return false;
        }
        
        return failureCount < 3;
      },
      
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Background refetching for ServiceNow data
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    
    mutations: {
      retry: (failureCount, error) => {
        if (error instanceof ServiceNowError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});

// Global error handling
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.query.state.status === 'error') {
    const error = event.query.state.error;
    
    if (error instanceof ServiceNowError) {
      if (error.status === 401) {
        console.error('Authentication error - user needs to log in');
      } else if (error.status === 403) {
        console.error('Permission denied - user lacks required access');
      }
    }
  }
});
```

## Complete TanStack Query Integration

### **Centralized Query Hooks with Optimistic Updates**
```tsx
// hooks/useIncidentQueries.ts
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { enhancedIncidentService, IncidentQueryOptions } from '../services/EnhancedIncidentService';

// Centralized query keys for consistency
export const incidentQueryKeys = {
  all: ['incidents'] as const,
  lists: () => [...incidentQueryKeys.all, 'list'] as const,
  list: (filters: IncidentQueryOptions) => [...incidentQueryKeys.lists(), filters] as const,
  details: () => [...incidentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...incidentQueryKeys.details(), id] as const,
  users: ['users'] as const,
  priorities: ['priorities'] as const,
  states: ['states'] as const,
};

/**
 * CRITICAL: This is where services meet React
 * Service provides data, TanStack Query provides React integration
 */
export function useIncidents(
  options: IncidentQueryOptions = {},
  queryOptions?: Partial<UseQueryOptions<any, Error>>
) {
  return useQuery({
    queryKey: incidentQueryKeys.list(options),
    queryFn: () => enhancedIncidentService.getIncidents(options), // Service call
    staleTime: 2 * 60 * 1000, // TanStack Query caching
    gcTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

export function useIncident(
  incidentId: string | undefined,
  queryOptions?: Partial<UseQueryOptions<Incident, Error>>
) {
  return useQuery({
    queryKey: incidentQueryKeys.detail(incidentId || ''),
    queryFn: () => enhancedIncidentService.getIncident(incidentId!), // Service call
    enabled: !!incidentId,
    staleTime: 1 * 60 * 1000,
    ...queryOptions,
  });
}

/**
 * Mutation hooks with optimistic updates
 */
export function useIncidentMutations() {
  const queryClient = useQueryClient();

  const assignToMe = useMutation({
    mutationFn: ({ incidentId, userId }: { incidentId: string; userId: string }) =>
      enhancedIncidentService.assignToMe(incidentId, userId), // Service call
    
    // TanStack Query optimistic update
    onMutate: async ({ incidentId, userId }) => {
      await queryClient.cancelQueries({ queryKey: incidentQueryKeys.detail(incidentId) });

      const previousIncident = queryClient.getQueryData<Incident>(
        incidentQueryKeys.detail(incidentId)
      );

      if (previousIncident) {
        queryClient.setQueryData<Incident>(
          incidentQueryKeys.detail(incidentId),
          {
            ...previousIncident,
            assigned_to: { value: userId, display_value: 'Assigning...' } as any,
            state: { value: '2', display_value: 'In Progress' } as any
          }
        );
      }

      return { previousIncident };
    },

    onSuccess: (updatedIncident) => {
      // Update cache with real data
      queryClient.setQueryData(
        incidentQueryKeys.detail(updatedIncident.sys_id?.value || ''),
        updatedIncident
      );

      // Invalidate list queries
      queryClient.invalidateQueries({
        queryKey: incidentQueryKeys.lists(),
        exact: false
      });
    },

    onError: (error, { incidentId }, context) => {
      // Rollback optimistic update
      if (context?.previousIncident) {
        queryClient.setQueryData(
          incidentQueryKeys.detail(incidentId),
          context.previousIncident
        );
      }
    },
  });

  const resolveIncident = useMutation({
    mutationFn: ({ 
      incidentId, 
      resolution, 
      resolutionCode 
    }: { 
      incidentId: string; 
      resolution: string; 
      resolutionCode?: string;
    }) => enhancedIncidentService.resolveIncident(incidentId, resolution, resolutionCode),
    
    onSuccess: (updatedIncident) => {
      queryClient.setQueryData(
        incidentQueryKeys.detail(updatedIncident.sys_id?.value || ''),
        updatedIncident
      );
      
      queryClient.invalidateQueries({
        queryKey: incidentQueryKeys.lists()
      });
    },
  });

  return {
    assignToMe,
    resolveIncident,
  };
}
```

## Implementation Checklist

### **✅ Phase 1: Service Foundation**
- [ ] BaseServiceNowService with error handling and retry logic
- [ ] ServiceNow-specific error classes
- [ ] Authentication token management
- [ ] Request timeout and abort handling

### **✅ Phase 2: Business Services**
- [ ] Services extend BaseServiceNowService
- [ ] Pure functions that return promises
- [ ] No React hooks or state management in services
- [ ] Comprehensive data transformation utilities

### **✅ Phase 3: TanStack Query Integration**
- [ ] Query hooks that call service methods
- [ ] Centralized query key management
- [ ] Mutations with optimistic updates
- [ ] Error handling and rollback logic

### **✅ Phase 4: Query Client Configuration**
- [ ] ServiceNow-specific retry strategies
- [ ] Appropriate stale times for different data types
- [ ] Background refetching enabled
- [ ] Global error handling for auth issues

### **✅ Phase 5: Component Integration**
- [ ] Components use hooks, never services directly
- [ ] Loading states from isLoading, not local state
- [ ] Error handling from query error state
- [ ] Proper query invalidation on mutations

## Validation Tests

### **Architecture Working:**
```tsx
// ✅ These patterns indicate success
const { data, isLoading, error } = useIncidents(); // TanStack Query hook
const { assignToMe } = useIncidentMutations(); // Mutation hook with optimistic updates

// Component only handles UI
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

// Mutation provides instant feedback
onClick={() => assignToMe.mutate({ incidentId, userId })}
disabled={assignToMe.isPending} // Immediate UI feedback
```

### **Architecture Failing:**
```tsx
// ❌ These patterns indicate failure
const [loading, setLoading] = useState(true); // Manual state management
const [error, setError] = useState(null); // Manual error handling

useEffect(() => {
  service.getIncidents() // Direct service call
    .then(setData) // Manual state updates
    .catch(setError); // Manual error handling
}, []); // No caching, refetches every time
```

## Performance Benefits

### **With TanStack Query Integration:**
- **Smart Caching** - Incidents list cached for 2 minutes, static data (priorities, states) cached indefinitely
- **Request Deduplication** - Multiple components requesting same data share single API call
- **Background Synchronization** - Data updates automatically when user returns to tab
- **Optimistic Updates** - Assignment operations show instant feedback, rollback on error
- **Intelligent Retry** - Failed requests retry with exponential backoff, auth errors don't retry
- **Memory Management** - Unused data garbage collected automatically

### **Without TanStack Query (Failed Approach):**
- **No Caching** - Every component mount triggers API call
- **Duplicate Requests** - Multiple components make redundant API calls
- **Stale Data** - No automatic refresh, data becomes outdated
- **Poor UX** - Blocking operations, no optimistic updates
- **Manual Retry** - Must implement retry logic manually
- **Memory Leaks** - Manual cleanup required

## Migration from Failed Pattern

### **Step 1: Identify Direct Service Calls**
```tsx
// ❌ Find and replace these patterns
useEffect(() => {
  incidentService.getIncidents().then(setIncidents);
}, []);

// ✅ With TanStack Query hooks
const { data: incidents } = useIncidents();
```

### **Step 2: Replace Manual State Management**
```tsx
// ❌ Remove manual loading/error state
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// ✅ Use TanStack Query state
const { isLoading, error } = useIncidents();
```

### **Step 3: Add Optimistic Updates**
```tsx
// ❌ Simple mutation without feedback
const handleAssign = () => {
  incidentService.assignToMe(incidentId);
};

// ✅ Optimistic mutation with instant feedback
const { assignToMe } = useIncidentMutations();
const handleAssign = () => {
  assignToMe.mutate({ incidentId, userId });
};
```

## Architecture Validation Checklist

### **✅ MANDATORY: Verify This Architecture**

**Service Layer:**
- [ ] Services extend BaseServiceNowService
- [ ] Services are pure functions (no React hooks, no state management)
- [ ] Services handle ServiceNow API calls and business logic
- [ ] Services return raw data, not React state

**TanStack Query Integration:**
- [ ] All data fetching uses TanStack Query hooks
- [ ] Query keys are centralized and consistent
- [ ] Mutations include optimistic updates
- [ ] Query client is configured for ServiceNow patterns

**Component Layer:**
- [ ] Components never call services directly
- [ ] Components only use TanStack Query hooks
- [ ] Loading states come from isLoading, not local state
- [ ] Error handling uses TanStack Query error state

**Query Client:**
- [ ] Configured with ServiceNow-specific retry logic
- [ ] Has appropriate stale times for different data types
- [ ] Handles ServiceNow authentication errors
- [ ] Includes background refetching

### **❌ ANTI-PATTERNS TO AVOID**
- Services managing React state
- Components calling services directly
- Manual loading state management
- Missing TanStack Query integration
- No optimistic updates for mutations
- Inconsistent query key patterns

This integration pattern is **mandatory** for ServiceNow applications. The service layer provides business logic, TanStack Query provides React integration, and the combination delivers enterprise-grade user experience with smart caching, optimistic updates, and robust error handling.