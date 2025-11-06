---
title: "Pattern 2: Hybrid Data Patterns"
version: "2025.1.2"
purpose: "Three-pattern approach for immediate, enhanced, and dynamic ServiceNow data"
readTime: "5 minutes"
complexity: "advanced"
prerequisites: ["servicenow-server-scripting", "jelly-templates", "servicenow-table-api"]
concepts: ["data-injection", "server-processing", "client-api", "performance-optimization"]
codeExamples: 6
completeness: 100
testability: true
productionReady: true
---

# Pattern 2: Hybrid Data Patterns

**Purpose:** Three-pattern approach for immediate, enhanced, and dynamic ServiceNow data  
**Read time:** ~5 minutes  
**Problem:** ServiceNow applications need different types of data with varying performance and complexity requirements

---

## 🚨 Problem Statement

### **Data Requirements:**
- **Immediate:** User context, session info - needs instant availability
- **Enhanced:** Analytics, aggregations - requires server-side processing
- **Dynamic:** Live data, user interactions - needs real-time updates

### **Traditional Approach Issues:**
```typescript
// ❌ PROBLEM: Everything as API calls
useEffect(() => {
  // Unnecessary API call for static user data
  fetchUserInfo().then(setUser);
  
  // Complex calculation done on client (slow)
  fetchAllIncidents().then(incidents => {
    const analytics = calculateAnalytics(incidents); // Heavy processing
    setAnalytics(analytics);
  });
}, []);
```

### **Impact:**
- **Slow initial load** - Everything waits for API calls
- **API overload** - Unnecessary requests for static data
- **Client performance** - Complex calculations on frontend
- **Poor UX** - Loading states for data that could be immediate

---

## ✅ Solution: Three-Pattern Hybrid Architecture

### **Pattern Selection Decision Tree:**
```
What type of data do you need?
├── Static/user context → Pattern 2A: Jelly Template Injection
├── Complex calculations → Pattern 2B: G:Evaluate Processing  
└── Dynamic/interactive → Pattern 2C: Client-Side API Calls
```

---

## 🔥 Pattern 2A: Jelly Template Injection (Immediate Data)

### **Use Cases:**
- User information, roles, preferences
- System configuration, instance details
- Session data, CSRF tokens
- Simple boolean flags

### **Complete Implementation:**

```html
<!-- index.html - PATTERN: Immediate data injection -->
<!-- TIMING: Place BEFORE g:ui_form to ensure availability -->
<script>
  // PATTERN 2A: Synchronous data injection for instant availability
  // CONTEXT: This data is available immediately when React loads
  window.snUserContext = {
    // CORE: Essential user identification
    userName: "${gs.getUserName()}",
    userId: "${gs.getUserID()}",
    userDisplayName: "${gs.getUser().getDisplayName()}",
    userEmail: "${gs.getUser().getEmail()}",
    
    // SECURITY: Role-based access control
    isAdmin: "${gs.getUser().hasRole('admin')}" === "true",
    isITIL: "${gs.getUser().hasRole('itil')}" === "true",
    
    // SESSION: Authentication and tracking
    sessionId: "${gs.getSessionID()}",
    systemId: "${gs.getProperty('instance_name')}",
    
    // METADATA: Pattern identification for debugging
    dataSource: "jelly-template-injection",
    timestamp: new Date().toISOString()
  };
  
  // DEVELOPMENT: Log immediate data availability
  console.log('🚀 IMMEDIATE: User context ready:', window.snUserContext);
</script>
```

### **React Integration:**

```typescript
// stores/userStore.ts - PATTERN: Immediate data consumption
import { create } from 'zustand';

interface UserState {
  userName: string;
  userId: string;
  displayName: string;
  isAdmin: boolean;
  isITIL: boolean;
}

// PATTERN: Initialize store with immediate data
const getImmediateUserData = (): UserState => {
  const context = window.snUserContext;
  
  if (!context) {
    // FALLBACK: Default values if data not available
    console.warn('⚠️ snUserContext not available, using defaults');
    return {
      userName: 'unknown',
      userId: '',
      displayName: 'Unknown User',
      isAdmin: false,
      isITIL: false
    };
  }
  
  return {
    userName: context.userName,
    userId: context.userId,
    displayName: context.userDisplayName,
    isAdmin: context.isAdmin,
    isITIL: context.isITIL
  };
};

export const useUserStore = create<UserState>(() => getImmediateUserData());

// PATTERN: Selective hooks for performance
export const useUserName = () => useUserStore(state => state.userName);
export const useIsAdmin = () => useUserStore(state => state.isAdmin);
```

---

## ⚙️ Pattern 2B: G:Evaluate Server Processing (Enhanced Data)

### **Use Cases:**
- Complex analytics and aggregations
- Multi-table calculations
- Business rule processing
- Performance-sensitive computations

### **Critical Implementation Rules:**
```typescript
// 🚨 CRITICAL RULES for G:Evaluate:
// ✅ DO: Use individual variables
var enhancedTotal = totalIncidents;

// ❌ DON'T: Inject complex objects (breaks!)
var badData = ${complexObject}; // This will fail!

// ✅ DO: Convert boolean strings
var isAdmin = "${user.hasRole('admin')}" === "true";

// ✅ DO: Provide fallbacks
var safeTotal = totalIncidents || 0;
```

### **Complete Server-Side Processing:**

```html
<!-- PATTERN 2B: Server-side calculation with individual variable injection -->
<g:evaluate>
  try {
    // SETUP: Get current user context
    var currentUser = gs.getUser();
    var currentUserSysId = gs.getUserID();
    
    // ANALYTICS: Complex incident analysis
    var incidentGR = new GlideRecord('incident');
    incidentGR.addQuery('assigned_to', currentUserSysId);
    incidentGR.query();
    
    // CALCULATION: Process incidents for analytics
    var totalIncidents = 0;
    var openIncidents = 0;
    var highPriorityIncidents = 0;
    var avgResolutionTime = 0;
    var totalResolutionTime = 0;
    var resolvedCount = 0;
    
    while (incidentGR.next()) {
      totalIncidents++;
      var state = incidentGR.getValue('state');
      var priority = incidentGR.getValue('priority');
      
      // STATE ANALYSIS: Count open incidents
      if (state === '1' || state === '2' || state === '3') {
        openIncidents++;
      }
      
      // PRIORITY ANALYSIS: Count high priority
      if (priority === '1' || priority === '2') {
        highPriorityIncidents++;
      }
      
      // PERFORMANCE ANALYSIS: Resolution time calculation
      if (state === '6' || state === '7') { // Resolved/Closed
        var opened = incidentGR.opened_at.getGlideObject();
        var resolved = incidentGR.resolved_at.getGlideObject();
        if (opened && resolved) {
          var resolutionTime = resolved.getNumericValue() - opened.getNumericValue();
          totalResolutionTime += resolutionTime;
          resolvedCount++;
        }
      }
    }
    
    // FINALIZE: Calculate averages and rates
    avgResolutionTime = resolvedCount > 0 ? Math.round(totalResolutionTime / resolvedCount / (1000 * 60 * 60)) : 0; // Hours
    var resolutionRate = totalIncidents > 0 ? Math.round(((totalIncidents - openIncidents) / totalIncidents) * 100) : 0;
    var activityScore = totalIncidents * 10 + (currentUser.hasRole('admin') ? 50 : 0);
    
    // STORE: Individual variables for safe injection (CRITICAL!)
    var enhancedTotalIncidents = totalIncidents;
    var enhancedOpenIncidents = openIncidents;
    var enhancedHighPriorityIncidents = highPriorityIncidents;
    var enhancedAvgResolutionTime = avgResolutionTime;
    var enhancedResolutionRate = resolutionRate;
    var enhancedActivityScore = activityScore;
    var enhancedRoleCount = currentUser.getRoles().toString().split(',').length;
    var enhancedIsAdmin = currentUser.hasRole('admin').toString();
    
  } catch (error) {
    // SAFETY: Always provide fallback values
    gs.error('SERVER: Enhanced data processing error - ' + error.message);
    var enhancedTotalIncidents = 0;
    var enhancedOpenIncidents = 0;
    var enhancedHighPriorityIncidents = 0;
    var enhancedAvgResolutionTime = 0;
    var enhancedResolutionRate = 0;
    var enhancedActivityScore = 0;
    var enhancedRoleCount = 0;
    var enhancedIsAdmin = 'false';
  }
</g:evaluate>

<script>
  // PATTERN: Build enhanced data object from individual variables
  window.enhancedUserData = {
    incidentAnalytics: {
      totalIncidents: ${enhancedTotalIncidents},
      openIncidents: ${enhancedOpenIncidents},
      highPriorityIncidents: ${enhancedHighPriorityIncidents},
      avgResolutionTime: ${enhancedAvgResolutionTime}, // Hours
      resolutionRate: ${enhancedResolutionRate}        // Percentage
    },
    roleAnalysis: {
      totalRoles: ${enhancedRoleCount},
      isAdmin: "${enhancedIsAdmin}" === "true",
      canManageIncidents: "${enhancedIsAdmin}" === "true",
      canViewReports: "${enhancedIsAdmin}" === "true"
    },
    activityMetrics: {
      activityScore: ${enhancedActivityScore},
      processingTime: new Date().toISOString()
    },
    dataSource: "g-evaluate-server-processing"
  };
  
  // PERFORMANCE: Store user sys_id separately for quick access
  window.SN_USER = {
    sys_id: "${gs.getUserID()}",
    user_name: "${gs.getUserName()}",
    full_name: "${gs.getUser().getDisplayName()}",
    hasAdminRole: "${enhancedIsAdmin}" === "true",
    hasIncidentRole: true
  };
  
  console.log('⚙️ ENHANCED: Server-processed data ready:', window.enhancedUserData);
  console.log('👤 USER: Quick access data ready:', window.SN_USER);
  
  // CRITICAL: Flag that ServiceNow data is ready (required by Pattern 1)
  window.serviceNowDataReady = true;
</script>
```

### **React Integration:**

```typescript
// stores/analyticsStore.ts - PATTERN: Enhanced data consumption
import { create } from 'zustand';

interface AnalyticsState {
  incidentAnalytics: {
    totalIncidents: number;
    openIncidents: number;
    highPriorityIncidents: number;
    avgResolutionTime: number;
    resolutionRate: number;
  };
  activityScore: number;
  isLoaded: boolean;
}

const getEnhancedData = (): AnalyticsState => {
  const enhanced = window.enhancedUserData;
  
  if (!enhanced) {
    return {
      incidentAnalytics: {
        totalIncidents: 0,
        openIncidents: 0,
        highPriorityIncidents: 0,
        avgResolutionTime: 0,
        resolutionRate: 0
      },
      activityScore: 0,
      isLoaded: false
    };
  }
  
  return {
    incidentAnalytics: enhanced.incidentAnalytics,
    activityScore: enhanced.activityMetrics.activityScore,
    isLoaded: true
  };
};

export const useAnalyticsStore = create<AnalyticsState>(() => getEnhancedData());
```

---

## 🌐 Pattern 2C: Client-Side API Calls (Dynamic Data)

### **Use Cases:**
- Live incident data with filters
- User interactions and updates
- Real-time search and pagination
- Data that changes frequently

### **Performance-Optimized API Service:**

```typescript
// services/ServiceNowQueryService.ts - PATTERN: Dynamic data with optimization
export class ServiceNowQueryService {
  private baseURL: string;
  private token: string;

  constructor(token: string, baseURL?: string) {
    this.token = token;
    this.baseURL = baseURL || window.location.origin;
  }

  // PATTERN: Enhanced request with pagination and error handling
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    // DEVELOPMENT: API call logging
    console.log(`🔗 API: ${options.method || 'GET'} ${endpoint}`);
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-UserToken': this.token, // SECURITY: CSRF protection
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new ServiceNowError(`API Error: ${response.status}`, response.status);
      }

      const data = await response.json();
      
      // PERFORMANCE: Extract pagination metadata
      const total = response.headers.get('X-Total-Count');
      if (total && Array.isArray(data.result)) {
        (data as any).total = parseInt(total, 10);
        console.log(`✅ API Success: ${data.result.length} of ${total} records`);
      }
      
      return data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  }

  // PATTERN: Optimized incident fetching with advanced parameters
  async getIncidents(params: {
    active?: boolean;
    caller_id?: string;
    assigned_to?: string;
    state?: string;
    priority?: string;
    limit?: number;
    offset?: number;
    query?: string;
  } = {}): Promise<ServiceNowResponse<Incident>> {
    
    const tableParams: ServiceNowTableParams = {
      // REQUIREMENT: Essential fields for incident display
      sysparm_fields: [
        'sys_id', 'number', 'short_description', 'description',
        'state', 'priority', 'urgency', 'impact', 'category',
        'caller_id', 'assigned_to', 'assignment_group',
        'opened_at', 'sys_created_on', 'sys_updated_on'
      ].join(','),
      
      // PERFORMANCE: Pagination settings
      sysparm_limit: params.limit?.toString() || '25',
      sysparm_offset: params.offset?.toString() || '0',
      sysparm_order_by: 'sys_created_on',
      sysparm_order_direction: 'desc',
      
      // CRITICAL: Get both value and display_value
      sysparm_display_value: 'all',
      sysparm_no_count: 'false', // Include total count for pagination
      
      // OPTIONAL: Custom query
      sysparm_query: params.query
    };

    return this.makeRequest<ServiceNowResponse<Incident>>(
      `/api/now/table/incident?${new URLSearchParams(tableParams).toString()}`
    );
  }
}
```

### **TanStack Query Integration:**

```typescript
// hooks/useIncidentQueries.ts - PATTERN: Optimized queries with caching
import { useQuery } from '@tanstack/react-query';

export function useIncidents(params: IncidentQueryParams = {}) {
  return useQuery({
    // CACHING: Compound key for fine-grained cache control
    queryKey: ['incidents', params],
    
    // SERVICE: Use optimized service method
    queryFn: () => getServiceNowQueryService().getIncidents(params),
    
    // PERFORMANCE: Optimized cache settings
    staleTime: 2 * 60 * 1000,     // 2 minutes (incidents change frequently)
    gcTime: 5 * 60 * 1000,        // 5 minutes cache retention
    keepPreviousData: true,       // UX: Smooth pagination transitions
    
    // RELIABILITY: Smart retry logic
    retry: (failureCount, error: any) => {
      // DON'T RETRY: Authentication/permission errors
      if (error?.status === 401 || error?.status === 403) return false;
      if (error?.message?.includes('timeout')) return false;
      return failureCount < 3;
    },
    
    // UX: Prevent unnecessary refetches
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}

// PATTERN: Specialized hooks for common use cases
export function useMyIncidents() {
  const currentUser = window.SN_USER; // From Pattern 2B
  
  return useIncidents({
    assigned_to: currentUser?.sys_id,
    active: true
  });
}

export function useHighPriorityIncidents() {
  return useIncidents({
    query: 'priorityIN1,2^active=true',
    limit: 50
  });
}
```

---

## 🧪 Validation & Testing

### **Pattern Selection Validation:**
```typescript
// Test: Verify correct pattern usage
describe('Hybrid Data Patterns', () => {
  it('should use immediate data for user context', () => {
    // Pattern 2A: Immediate availability
    expect(window.snUserContext).toBeDefined();
    expect(window.snUserContext.userName).toBeTruthy();
  });
  
  it('should use enhanced data for analytics', () => {
    // Pattern 2B: Server-processed calculations
    expect(window.enhancedUserData.incidentAnalytics).toBeDefined();
    expect(typeof window.enhancedUserData.incidentAnalytics.totalIncidents).toBe('number');
  });
  
  it('should use API calls for dynamic data', async () => {
    // Pattern 2C: Live data fetching
    const { result } = renderHook(() => useIncidents({ limit: 10 }));
    
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### **Performance Validation:**
```typescript
// Measure data availability timing
console.time('immediate-data');
console.log('User:', window.snUserContext.userName);
console.timeEnd('immediate-data'); // Should be ~0ms

console.time('enhanced-data');
console.log('Analytics:', window.enhancedUserData.incidentAnalytics);
console.timeEnd('enhanced-data'); // Should be ~0ms

console.time('dynamic-data');
// API call timing measured by TanStack Query DevTools
```

---

## 📊 Pattern Benefits & Trade-offs

### **Benefits:**
- **Instant UX** - No loading states for user context
- **Optimal Performance** - Heavy processing on server
- **Smart Caching** - API data cached intelligently
- **Scalable Architecture** - Each pattern optimized for its use case

### **Trade-offs:**
| **Pattern** | **Pros** | **Cons** | **Best For** |
|-------------|----------|----------|--------------|
| 2A: Jelly Template | Instant availability | Static data only | User context, config |
| 2B: G:Evaluate | Server power, complex logic | Slower page load | Analytics, calculations |
| 2C: API Calls | Real-time, flexible | Network dependent | Interactive data |

---

*Hybrid data patterns optimize for different data requirements, providing the best user experience by using the right approach for each type of data.*