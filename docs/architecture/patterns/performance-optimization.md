---
title: "Performance Optimization for ServiceNow React Applications"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Performance optimization strategies for ServiceNow React applications with TanStack Query and atomic components"
readTime: "8 minutes"
complexity: "advanced"
status: "ACTIVE"
criticality: "RECOMMENDED"
prerequisites: ["state-management", "service-layer-integration", "atomic-design-principles"]
tags: ["performance", "optimization", "servicenow", "react", "tanstack-query", "virtualization"]
---

# Performance Optimization for ServiceNow React Applications

**Purpose:** Performance optimization strategies for ServiceNow React applications with TanStack Query and atomic components  
**Read time:** ~8 minutes  
**Prerequisites:** [State Management](state-management.md), [Service Layer Integration](service-layer-integration.md), [Atomic Design Principles](atomic-design-principles.md)

---

## ServiceNow Performance Philosophy

### **Unique ServiceNow Performance Challenges**

ServiceNow applications face distinct performance considerations that require specialized optimization strategies:

```
ServiceNow Performance Challenges
├── Data Volume Challenges 📊
│   ├── Large datasets (100k+ incidents, users)
│   ├── Complex reference field relationships
│   ├── Deep hierarchical data structures
│   └── Real-time data synchronization needs
├── Platform Constraints 🏗️
│   ├── Portal memory limits (Service Portal)
│   ├── Next Experience UI performance budgets
│   ├── Mobile device considerations
│   └── Network latency in enterprise environments
└── Integration Complexity 🔗
    ├── Multiple ServiceNow API calls
    ├── Cross-table reference resolution
    ├── Background workflow processing
    └── Real-time notification handling
```

### **Performance Architecture Strategy**

Our performance approach aligns with ServiceNow's backend-first philosophy:

```
Client-Side Optimization (React)         ServiceNow Optimization (Backend)
├── Atomic component memoization         ├── Query field selection optimization
├── TanStack Query intelligent caching   ├── Pagination and infinite scroll
├── Selective state subscriptions        ├── Background synchronization
├── Code splitting and lazy loading      ├── Request deduplication
├── Virtual scrolling for large lists    ├── ServiceNow encoder query optimization
└── Bundle size optimization             └── API response compression
```

**Integration Point:** React performance optimizations work with ServiceNow's backend performance features, not against them.

---

## React Component Performance

### **Atomic Component Optimization**

Following our [Atomic Design Principles](atomic-design-principles.md), optimize at each component level:

```tsx
// ✅ Optimized Atom - ServiceNow Button
const ServiceNowButton = React.memo<ServiceNowButtonProps>(({ 
  variant = 'primary',
  loading = false,
  disabled = false,
  children,
  onClick,
  ...props 
}) => {
  // Memoize class computation for performance
  const buttonClasses = useMemo(() => {
    return [
      'sn-button',
      `sn-button--${variant}`,
      loading && 'sn-button--loading',
      disabled && 'sn-button--disabled'
    ].filter(Boolean).join(' ');
  }, [variant, loading, disabled]);

  // Memoize click handler to prevent child re-renders
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (!loading && !disabled) {
      onClick?.(event);
    }
  }, [loading, disabled, onClick]);

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && <ServiceNowSpinner size="small" />}
      <span className="sn-button__content">{children}</span>
    </button>
  );
});

// ✅ Optimized Molecule - ServiceNow Field Display
const ServiceNowFieldDisplay = React.memo<ServiceNowFieldDisplayProps>(({ 
  field, 
  type = 'string',
  showEmpty = true 
}) => {
  // Memoize expensive field formatting
  const displayValue = useMemo(() => {
    if (!field || (!field.display_value && !field.value)) {
      return showEmpty ? '—' : null;
    }

    switch (type) {
      case 'date':
        return formatServiceNowDate(field);
      case 'reference':
        return field.display_value || field.value;
      case 'choice':
        return field.display_value || field.value;
      default:
        return field.display_value || field.value;
    }
  }, [field, type, showEmpty]);

  if (!displayValue) return null;

  return (
    <span className={`sn-field-display sn-field-display--${type}`}>
      {displayValue}
    </span>
  );
});

// ✅ Optimized Organism - ServiceNow Incident Card
const ServiceNowIncidentCard = React.memo<IncidentCardProps>(({ 
  incident, 
  onUpdate, 
  onView,
  variant = 'default'
}) => {
  // Memoize callback functions to prevent child re-renders
  const handleView = useCallback(() => {
    onView?.(incident);
  }, [incident, onView]);

  const handleUpdate = useCallback((updates: Partial<Incident>) => {
    onUpdate?.(incident.sys_id.value, updates);
  }, [incident.sys_id.value, onUpdate]);

  // Memoize priority badge props to prevent Badge re-renders
  const priorityBadgeProps = useMemo(() => ({
    variant: getPriorityVariant(incident.priority.value),
    children: incident.priority.display_value
  }), [incident.priority.value, incident.priority.display_value]);

  return (
    <div className={`incident-card incident-card--${variant}`}>
      <div className="incident-card__header">
        <ServiceNowFieldDisplay field={incident.number} type="string" />
        <ServiceNowBadge {...priorityBadgeProps} />
      </div>
      
      <div className="incident-card__content">
        <ServiceNowFieldDisplay 
          field={incident.short_description} 
          type="string" 
        />
      </div>
      
      <div className="incident-card__actions">
        <ServiceNowButton onClick={handleView} variant="secondary" size="small">
          View
        </ServiceNowButton>
        <ServiceNowButton 
          onClick={() => handleUpdate({ state: { value: '2', display_value: 'In Progress' }})}
          variant="primary" 
          size="small"
        >
          Start Work
        </ServiceNowButton>
      </div>
    </div>
  );
});
```

### **List Performance with Atomic Components**

```tsx
// ✅ Optimized Organism - ServiceNow Incident List
const ServiceNowIncidentList = React.memo<IncidentListProps>(({ 
  incidents,
  loading = false,
  onIncidentUpdate,
  onIncidentView
}) => {
  // Memoize callbacks to prevent all cards from re-rendering
  const handleIncidentUpdate = useCallback((incidentId: string, updates: Partial<Incident>) => {
    onIncidentUpdate?.(incidentId, updates);
  }, [onIncidentUpdate]);

  const handleIncidentView = useCallback((incident: Incident) => {
    onIncidentView?.(incident);
  }, [onIncidentView]);

  // Memoize the rendered list to prevent unnecessary re-renders
  const renderedIncidents = useMemo(() => {
    return incidents.map(incident => (
      <ServiceNowIncidentCard
        key={incident.sys_id.value}
        incident={incident}
        onUpdate={handleIncidentUpdate}
        onView={handleIncidentView}
      />
    ));
  }, [incidents, handleIncidentUpdate, handleIncidentView]);

  if (loading) {
    return <ServiceNowLoadingSpinner message="Loading incidents..." />;
  }

  if (incidents.length === 0) {
    return <ServiceNowEmptyState message="No incidents found" />;
  }

  return (
    <div className="incident-list">
      {renderedIncidents}
    </div>
  );
});
```

---

## TanStack Query Performance Optimization

### **Smart Caching for ServiceNow Data**

Building on [Service Layer Integration](service-layer-integration.md) patterns:

```tsx
// ✅ ServiceNow-optimized query configuration
export const serviceNowQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ServiceNow data stability patterns
      staleTime: 5 * 60 * 1000,        // 5 minutes for dynamic data
      gcTime: 30 * 60 * 1000,          // 30 minutes garbage collection
      
      // Network optimization for ServiceNow APIs
      refetchOnWindowFocus: false,      // Reduce API calls when user returns
      refetchOnMount: 'always',         // Ensure fresh data on component mount
      refetchOnReconnect: true,         // Refresh after network reconnection
      
      // ServiceNow-specific retry logic
      retry: (failureCount, error) => {
        // Don't retry authentication errors
        if (error instanceof ServiceNowError && (error.status === 401 || error.status === 403)) {
          return false;
        }
        // Limited retries for performance
        return failureCount < 2;
      },
      
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    
    mutations: {
      // Aggressive retry for critical ServiceNow operations
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// ✅ ServiceNow data type-specific caching strategies
export const ServiceNowCacheConfig = {
  // Static data - cache for long periods
  choiceLists: {
    staleTime: 60 * 60 * 1000,    // 1 hour
    gcTime: 24 * 60 * 60 * 1000,  // 24 hours
  },
  
  // User data - moderately stable
  userData: {
    staleTime: 15 * 60 * 1000,    // 15 minutes
    gcTime: 60 * 60 * 1000,       // 1 hour
  },
  
  // Incident data - dynamic but cacheable
  incidentData: {
    staleTime: 2 * 60 * 1000,     // 2 minutes
    gcTime: 10 * 60 * 1000,       // 10 minutes
  },
  
  // Real-time data - minimal caching
  realTimeData: {
    staleTime: 30 * 1000,         // 30 seconds
    gcTime: 5 * 60 * 1000,        // 5 minutes
  },
};
```

### **Optimized ServiceNow Query Patterns**

```tsx
// ✅ Field selection optimization for ServiceNow queries
export function useOptimizedIncidents(options: IncidentQueryOptions = {}) {
  return useQuery({
    queryKey: ['incidents', 'optimized', options],
    queryFn: async () => {
      // Only fetch fields needed for the current view
      const fields = options.detailed ? [
        'sys_id', 'number', 'short_description', 'description', 
        'priority', 'state', 'assigned_to', 'caller_id',
        'sys_created_on', 'sys_updated_on', 'urgency', 'impact',
        'category', 'subcategory', 'close_notes', 'resolution_code'
      ] : [
        'sys_id', 'number', 'short_description', 
        'priority', 'state', 'assigned_to'
      ];

      return enhancedIncidentService.getIncidents({
        ...options,
        fields,
        limit: options.limit || 25,
      });
    },
    ...ServiceNowCacheConfig.incidentData,
  });
}

// ✅ Intelligent pagination for large ServiceNow datasets
export function useInfiniteServiceNowIncidents(filters: IncidentFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['incidents', 'infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      const result = await enhancedIncidentService.getIncidents({
        ...filters,
        offset: pageParam,
        limit: 25,
        fields: ['sys_id', 'number', 'short_description', 'priority', 'state', 'assigned_to'],
      });

      return {
        incidents: result.result,
        nextOffset: result.result.length === 25 ? pageParam + 25 : undefined,
        hasMore: result.result.length === 25,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    ...ServiceNowCacheConfig.incidentData,
  });
}

// ✅ Strategic prefetching for ServiceNow workflows
export function useServiceNowIncidentWithPrefetch(incidentId: string) {
  const queryClient = useQueryClient();
  
  // Main incident query
  const incidentQuery = useQuery({
    queryKey: ['incidents', 'detail', incidentId],
    queryFn: () => enhancedIncidentService.getIncident(incidentId),
    ...ServiceNowCacheConfig.incidentData,
  });

  // Strategic prefetching based on incident data
  useEffect(() => {
    if (incidentQuery.data) {
      const incident = incidentQuery.data;
      
      // Prefetch assigned user data (high probability of being viewed)
      if (incident.assigned_to?.value) {
        queryClient.prefetchQuery({
          queryKey: ['users', incident.assigned_to.value],
          queryFn: () => userService.getUser(incident.assigned_to.value),
          ...ServiceNowCacheConfig.userData,
        });
      }
      
      // Prefetch related incidents (moderate probability)
      if (incident.caller_id?.value) {
        queryClient.prefetchQuery({
          queryKey: ['incidents', 'by-caller', incident.caller_id.value],
          queryFn: () => enhancedIncidentService.getIncidents({
            query: `caller_id=${incident.caller_id.value}`,
            limit: 10,
          }),
          staleTime: 2 * 60 * 1000,
        });
      }
      
      // Prefetch choice list data (static, high reuse)
      queryClient.prefetchQuery({
        queryKey: ['choices', 'incident', 'priority'],
        queryFn: () => choiceService.getChoices('incident', 'priority'),
        ...ServiceNowCacheConfig.choiceLists,
      });
    }
  }, [incidentQuery.data, queryClient, incidentId]);

  return incidentQuery;
}
```

### **Optimistic Updates with Error Recovery**

```tsx
// ✅ High-performance mutations with optimistic updates
export function useOptimizedIncidentMutations() {
  const queryClient = useQueryClient();

  const assignIncident = useMutation({
    mutationFn: async ({ incidentId, userId }: { incidentId: string; userId: string }) => {
      return enhancedIncidentService.assignToMe(incidentId, userId);
    },
    
    // Optimistic update for instant UI feedback
    onMutate: async ({ incidentId, userId }) => {
      // Cancel outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ 
        queryKey: ['incidents', 'detail', incidentId] 
      });

      // Snapshot previous value for rollback
      const previousIncident = queryClient.getQueryData<Incident>([
        'incidents', 'detail', incidentId
      ]);

      // Optimistically update the UI
      if (previousIncident) {
        queryClient.setQueryData<Incident>(
          ['incidents', 'detail', incidentId],
          {
            ...previousIncident,
            assigned_to: { 
              value: userId, 
              display_value: 'Assigning...',
              link: '' 
            },
            state: { 
              value: '2', 
              display_value: 'In Progress',
              link: '' 
            },
          }
        );
      }

      return { previousIncident };
    },

    onSuccess: (updatedIncident, { incidentId }) => {
      // Update with real ServiceNow data
      queryClient.setQueryData(
        ['incidents', 'detail', incidentId],
        updatedIncident
      );

      // Selectively invalidate related queries for performance
      queryClient.invalidateQueries({
        queryKey: ['incidents', 'optimized'],
        exact: false,
        refetchType: 'active', // Only refetch currently active queries
      });

      // Update infinite queries in place for better performance
      queryClient.setQueriesData(
        { queryKey: ['incidents', 'infinite'] },
        (oldData: any) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              incidents: page.incidents.map((incident: Incident) =>
                incident.sys_id.value === incidentId ? updatedIncident : incident
              ),
            })),
          };
        }
      );
    },

    onError: (error, { incidentId }, context) => {
      // Rollback optimistic update on error
      if (context?.previousIncident) {
        queryClient.setQueryData(
          ['incidents', 'detail', incidentId],
          context.previousIncident
        );
      }
    },
  });

  return { assignIncident };
}
```

---

## Virtual Scrolling for Large ServiceNow Datasets

### **Optimized Virtual Lists**

```tsx
// ✅ Virtual scrolling for large ServiceNow incident lists
import { FixedSizeList as List } from 'react-window';
import { memo, useCallback, useMemo } from 'react';

interface VirtualServiceNowIncidentListProps {
  incidents: Incident[];
  onIncidentClick: (incident: Incident) => void;
  onIncidentUpdate: (id: string, updates: Partial<Incident>) => void;
}

const VirtualServiceNowIncidentList = memo<VirtualServiceNowIncidentListProps>(({ 
  incidents, 
  onIncidentClick, 
  onIncidentUpdate 
}) => {
  // Memoize row renderer to prevent unnecessary re-renders
  const IncidentRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const incident = incidents[index];
    
    return (
      <div style={style} className="virtual-incident-row">
        <ServiceNowIncidentCard
          incident={incident}
          onView={onIncidentClick}
          onUpdate={onIncidentUpdate}
          variant="compact"
        />
      </div>
    );
  }, [incidents, onIncidentClick, onIncidentUpdate]);

  // Memoize list configuration
  const listConfig = useMemo(() => ({
    height: 600,
    itemCount: incidents.length,
    itemSize: 120, // Height of each incident card
    width: '100%',
  }), [incidents.length]);

  return (
    <List {...listConfig}>
      {IncidentRow}
    </List>
  );
});

// ✅ Infinite virtual scrolling with ServiceNow data
const InfiniteVirtualServiceNowIncidentList = memo(() => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteServiceNowIncidents({
    query: 'active=true',
    orderBy: 'sys_created_on',
  });

  // Flatten paginated data
  const allIncidents = useMemo(() => 
    data?.pages.flatMap(page => page.incidents) ?? []
  , [data]);

  // Optimized load more function
  const loadMoreItems = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Row renderer with load more trigger
  const IncidentRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const incident = allIncidents[index];
    
    // Trigger load more when approaching the end
    if (index === allIncidents.length - 5 && hasNextPage && !isFetchingNextPage) {
      loadMoreItems();
    }
    
    if (!incident) {
      return (
        <div style={style} className="virtual-incident-row">
          <ServiceNowSkeletonCard />
        </div>
      );
    }

    return (
      <div style={style} className="virtual-incident-row">
        <ServiceNowIncidentCard
          incident={incident}
          variant="compact"
        />
      </div>
    );
  }, [allIncidents, hasNextPage, isFetchingNextPage, loadMoreItems]);

  return (
    <List
      height={600}
      itemCount={allIncidents.length + (hasNextPage ? 10 : 0)} // Add placeholder items
      itemSize={120}
      width="100%"
    >
      {IncidentRow}
    </List>
  );
});
```

---

## Bundle Size and Code Splitting

### **ServiceNow Feature-Based Code Splitting**

```tsx
// ✅ ServiceNow feature-based lazy loading
import { lazy, Suspense } from 'react';

// Lazy load ServiceNow feature modules
const ServiceNowIncidentManagement = lazy(() => 
  import('@/features/incidents/IncidentManagement')
    .then(module => ({ default: module.IncidentManagement }))
);

const ServiceNowUserManagement = lazy(() => 
  import('@/features/users/UserManagement')
    .then(module => ({ default: module.UserManagement }))
);

const ServiceNowReporting = lazy(() => 
  import('@/features/reporting/ReportingDashboard')
    .then(module => ({ default: module.ReportingDashboard }))
);

function ServiceNowApp() {
  return (
    <BrowserRouter>
      <ServiceNowAuthProvider>
        <Routes>
          <Route 
            path="/incidents/*" 
            element={
              <Suspense fallback={<ServiceNowPageLoadingSpinner feature="Incident Management" />}>
                <ServiceNowIncidentManagement />
              </Suspense>
            } 
          />
          
          <Route 
            path="/users/*" 
            element={
              <Suspense fallback={<ServiceNowPageLoadingSpinner feature="User Management" />}>
                <ServiceNowUserManagement />
              </Suspense>
            } 
          />
          
          <Route 
            path="/reports/*" 
            element={
              <Suspense fallback={<ServiceNowPageLoadingSpinner feature="Reporting" />}>
                <ServiceNowReporting />
              </Suspense>
            }
          />
        </Routes>
      </ServiceNowAuthProvider>
    </BrowserRouter>
  );
}

// ✅ Component-level code splitting for expensive ServiceNow components
const ServiceNowAdvancedChart = lazy(() => 
  import('@/components/charts/ServiceNowAdvancedChart')
);

function ServiceNowDashboard() {
  const [showAdvancedCharts, setShowAdvancedCharts] = useState(false);
  
  return (
    <div className="servicenow-dashboard">
      <ServiceNowDashboardSummary />
      
      {showAdvancedCharts && (
        <Suspense fallback={<ServiceNowChartSkeleton />}>
          <ServiceNowAdvancedChart />
        </Suspense>
      )}
      
      <ServiceNowButton onClick={() => setShowAdvancedCharts(true)}>
        Load Advanced Analytics
      </ServiceNowButton>
    </div>
  );
}
```

### **Optimized ServiceNow Imports**

```tsx
// ✅ Tree-shaking friendly ServiceNow utility imports
import { formatServiceNowDate } from '@/utils/serviceNowFormatting/dateUtils';
import { buildServiceNowQuery } from '@/utils/serviceNowFormatting/queryUtils';
import { validateIncidentData } from '@/utils/serviceNowValidation/incidentValidation';

// ❌ Avoid barrel imports that hurt bundle size
import * as serviceNowUtils from '@/utils/serviceNowUtils'; // Imports entire utility library

// ✅ Optimized ServiceNow date library usage
import { format, parseISO, isValid } from 'date-fns';

// ❌ Avoid importing entire date library
import * as dateFns from 'date-fns'; // Imports full library

// ✅ ServiceNow-specific utility organization for tree shaking
// utils/serviceNowFormatting/index.ts
export { formatServiceNowDate } from './dateUtils';
export { formatServiceNowReference } from './referenceUtils';
export { formatServiceNowChoice } from './choiceUtils';

// Individual utility files enable tree shaking
// utils/serviceNowFormatting/dateUtils.ts
export function formatServiceNowDate(field: ServiceNowField, format: string = 'relative'): string {
  // Implementation
}
```

---

## Memory Management and Cleanup

### **ServiceNow Event Source Cleanup**

```tsx
// ✅ Proper cleanup for ServiceNow real-time updates
function useServiceNowRealTimeIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    // ServiceNow real-time event source
    const eventSource = new EventSource('/api/now/events/incident');
    
    eventSource.onmessage = (event) => {
      const updateData = JSON.parse(event.data);
      
      // Update TanStack Query cache
      queryClient.setQueryData(
        ['incidents', 'detail', updateData.sys_id],
        updateData
      );
      
      // Update local state if needed
      setIncidents(prev => 
        prev.map(incident => 
          incident.sys_id.value === updateData.sys_id ? updateData : incident
        )
      );
    };

    eventSource.onerror = (error) => {
      console.error('ServiceNow real-time connection error:', error);
    };
    
    // Critical: cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [queryClient]);

  return incidents;
}

// ✅ Debounced ServiceNow search to prevent excessive API calls
function useServiceNowSearchDebounced(searchTerm: string, delay: number = 300) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  // Only search when term is long enough to be meaningful
  return useOptimizedIncidents({
    search: debouncedSearchTerm,
    enabled: debouncedSearchTerm.length > 2,
  });
}
```

### **State Management Memory Optimization**

```tsx
// ✅ Memory-efficient Zustand store for ServiceNow data
const useServiceNowUIStore = create<ServiceNowUIState>()(
  persist(
    (set, get) => ({
      // Keep only essential UI state
      theme: 'auto',
      sidebarCollapsed: false,
      recentlyViewedIncidents: [],
      
      // Limit recently viewed to prevent memory growth
      addRecentlyViewed: (incident: Incident) => set(state => {
        const updated = [
          incident,
          ...state.recentlyViewedIncidents.filter(inc => 
            inc.sys_id.value !== incident.sys_id.value
          )
        ].slice(0, 10); // Keep only 10 most recent
        
        return { recentlyViewedIncidents: updated };
      }),
      
      // Periodic cleanup for performance
      cleanup: () => set(state => {
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        
        return {
          ...state,
          recentlyViewedIncidents: state.recentlyViewedIncidents.filter(
            incident => (incident as any).viewedAt > oneHourAgo
          )
        };
      }),
    }),
    {
      name: 'servicenow-ui-state',
      // Only persist essential data, not large datasets
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        // Don't persist large arrays
      }),
    }
  )
);

// ✅ Automatic cleanup interval
export function useServiceNowMemoryManagement() {
  const cleanup = useServiceNowUIStore(state => state.cleanup);
  
  useEffect(() => {
    // Cleanup every 10 minutes
    const interval = setInterval(cleanup, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [cleanup]);
}
```

---

## Performance Monitoring and Metrics

### **ServiceNow-Specific Performance Tracking**

```tsx
// ✅ ServiceNow application performance monitoring
function useServiceNowPerformanceMonitoring() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Monitor ServiceNow API query performance
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.state.status === 'success') {
        const queryKey = event.query.queryKey;
        const duration = event.query.state.dataUpdatedAt - (event.query.state as any).fetchStartTime;
        
        // Track slow ServiceNow queries
        if (duration > 3000) { // 3 second threshold
          console.warn('Slow ServiceNow query detected:', {
            queryKey: JSON.stringify(queryKey),
            duration: `${duration}ms`,
            dataSize: JSON.stringify(event.query.state.data).length
          });
          
          // Send to analytics service
          analytics.track('performance.slow_servicenow_query', {
            queryKey: JSON.stringify(queryKey),
            duration,
            table: queryKey[1], // Assuming [prefix, table, ...] structure
          });
        }
      }
    });

    return unsubscribe;
  }, [queryClient]);

  useEffect(() => {
    // Monitor ServiceNow-specific performance metrics
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach(entry => {
        if (entry.name.includes('/api/now/')) {
          console.log('ServiceNow API Performance:', {
            url: entry.name,
            duration: entry.duration,
            transferSize: (entry as any).transferSize,
          });
          
          // Track ServiceNow API performance
          analytics.track('performance.servicenow_api', {
            endpoint: entry.name,
            duration: entry.duration,
            size: (entry as any).transferSize,
          });
        }
      });
    });

    observer.observe({ entryTypes: ['resource'] });
    
    return () => observer.disconnect();
  }, []);
}

// ✅ Component render performance tracking
function useServiceNowRenderTracking(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef<number>();

  useEffect(() => {
    startTime.current = performance.now();
  });

  useLayoutEffect(() => {
    if (startTime.current) {
      const renderTime = performance.now() - startTime.current;
      renderCount.current += 1;
      
      // Track expensive ServiceNow component renders
      if (renderTime > 16) { // 16ms = 60fps budget
        console.warn(`Slow ServiceNow component render: ${componentName}`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          renderCount: renderCount.current
        });
        
        analytics.track('performance.slow_component_render', {
          component: componentName,
          renderTime,
          renderCount: renderCount.current,
        });
      }
    }
  });
}
```

### **Performance Testing for ServiceNow Components**

```tsx
// performance/__tests__/ServiceNowIncidentList.perf.test.tsx
import { render, waitFor, screen } from '@testing-library/react';
import { ServiceNowIncidentList } from '@/components/organisms/ServiceNowIncidentList';
import { createMockServiceNowIncidents } from '@/test-utils/serviceNowMocks';

describe('ServiceNow Incident List Performance', () => {
  it('renders 1000 ServiceNow incidents within performance budget', async () => {
    const manyIncidents = createMockServiceNowIncidents(1000);
    
    const startTime = performance.now();
    
    render(<ServiceNowIncidentList incidents={manyIncidents} />);
    
    await waitFor(() => {
      expect(screen.getAllByTestId('incident-card')).toHaveLength(1000);
    });
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Performance budget: under 100ms for 1000 ServiceNow records
    expect(renderTime).toBeLessThan(100);
  });

  it('handles frequent ServiceNow data updates efficiently', async () => {
    const baseIncidents = createMockServiceNowIncidents(100);
    const { rerender } = render(<ServiceNowIncidentList incidents={baseIncidents} />);
    
    const updates = Array.from({ length: 10 }, (_, i) => 
      baseIncidents.map(incident => ({
        ...incident,
        priority: { value: String((i + 1) % 4 + 1), display_value: `Priority ${(i + 1) % 4 + 1}` },
        updated: i,
      }))
    );
    
    const startTime = performance.now();
    
    for (const update of updates) {
      rerender(<ServiceNowIncidentList incidents={update} />);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Should handle 10 ServiceNow data updates in under 200ms
    expect(totalTime).toBeLessThan(200);
  });

  it('maintains performance with ServiceNow field formatting', () => {
    const incidentsWithComplexFields = createMockServiceNowIncidents(500, {
      includeComplexFields: true,
      includeReferences: true,
      includeChoices: true,
    });
    
    const startTime = performance.now();
    
    render(<ServiceNowIncidentList incidents={incidentsWithComplexFields} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Complex ServiceNow field formatting should still be fast
    expect(renderTime).toBeLessThan(150);
  });
});
```

---

## ServiceNow Portal and Next Experience Optimization

### **Portal-Specific Performance Tuning**

```tsx
// ✅ ServiceNow Portal performance detection and optimization
function useServiceNowPortalOptimization() {
  const [isPortal, setIsPortal] = useState(false);
  const [isNextExperience, setIsNextExperience] = useState(false);
  
  useEffect(() => {
    // Detect ServiceNow environment
    const portalDetected = 
      window.location.pathname.includes('/sp/') ||
      document.body.classList.contains('service-portal') ||
      (window as any).g_service_portal;
    
    const nextExperienceDetected = 
      document.body.classList.contains('next-experience') ||
      (window as any).NOW?.experience === 'next';
    
    setIsPortal(portalDetected);
    setIsNextExperience(nextExperienceDetected);
    
    // Adjust TanStack Query settings for Portal constraints
    if (portalDetected) {
      queryClient.setDefaultOptions({
        queries: {
          staleTime: 10 * 60 * 1000, // Longer stale time in Portal
          refetchOnWindowFocus: false,
          refetchInterval: false,     // Disable automatic refetching
        },
      });
    }
  }, []);
  
  return { isPortal, isNextExperience };
}

// ✅ Adaptive ServiceNow component rendering
const AdaptiveServiceNowIncidentList = memo(() => {
  const { isPortal, isNextExperience } = useServiceNowPortalOptimization();
  
  // Adjust query parameters based on environment
  const { data: incidents, isLoading } = useOptimizedIncidents({
    limit: isPortal ? 10 : 25,              // Fewer items in Portal
    detailed: !isPortal,                    // Less detail in Portal
    fields: isPortal ? 
      ['sys_id', 'number', 'short_description', 'priority'] : // Essential fields only
      ['sys_id', 'number', 'short_description', 'priority', 'state', 'assigned_to'], // Full fields
  });
  
  if (isLoading) {
    return <ServiceNowLoadingSpinner size={isPortal ? "small" : "medium"} />;
  }
  
  return (
    <ServiceNowIncidentList
      incidents={incidents?.result || []}
      variant={isPortal ? 'compact' : isNextExperience ? 'next-experience' : 'default'}
      virtualScrolling={!isPortal} // Disable virtualization in Portal
    />
  );
});
```

---

## Performance Best Practices Summary

### **✅ ServiceNow Performance Optimization Checklist**

**React Component Level:**
- [ ] Memoize atomic components with React.memo
- [ ] Use useCallback for event handlers to prevent child re-renders
- [ ] Implement useMemo for expensive ServiceNow field computations
- [ ] Apply virtual scrolling for large ServiceNow datasets (>100 items)
- [ ] Lazy load ServiceNow feature modules and expensive components

**TanStack Query Level:**
- [ ] Configure ServiceNow-appropriate stale times (5min dynamic, 1hr static)
- [ ] Implement optimistic updates for ServiceNow mutations
- [ ] Use selective field fetching in ServiceNow queries
- [ ] Set up strategic prefetching for related ServiceNow data
- [ ] Enable request deduplication and background sync

**State Management Level:**
- [ ] Use selective Zustand subscriptions to prevent unnecessary re-renders
- [ ] Keep large ServiceNow datasets in TanStack Query, not Zustand
- [ ] Implement periodic cleanup for memory-intensive UI state
- [ ] Persist only essential data, not large ServiceNow result sets

**Bundle and Network Level:**
- [ ] Implement code splitting by ServiceNow feature areas
- [ ] Use tree-shaking friendly imports for ServiceNow utilities
- [ ] Configure compression for ServiceNow API responses
- [ ] Optimize ServiceNow query parameters (fields, limits, encoding)

**Monitoring and Testing:**
- [ ] Track ServiceNow API query performance metrics
- [ ] Monitor component render times for expensive operations
- [ ] Test performance with realistic ServiceNow data volumes
- [ ] Implement performance budgets for ServiceNow operations

### **❌ ServiceNow Performance Anti-Patterns to Avoid**
- Fetching all ServiceNow fields when only few are needed
- No memoization for complex ServiceNow field formatting
- Missing cleanup for ServiceNow event sources and timers
- Storing large ServiceNow datasets in global state
- No virtual scrolling for lists with >100 ServiceNow records
- Ignoring ServiceNow Portal and Next Experience constraints
- Missing performance monitoring for ServiceNow operations

---

## Integration with ServiceNow Architecture

### **Performance in Component Hierarchy:**
- **[Atomic Design Principles](atomic-design-principles.md)** ⭐ - Performance optimizations at each atomic level
- **[ServiceNow Atoms](servicenow-atoms.md)** - Memoized basic elements for reuse
- **[ServiceNow Molecules](servicenow-molecules.md)** - Optimized functional combinations
- **[ServiceNow Organisms](servicenow-organisms.md)** - Complex components with virtual scrolling

### **Performance in Data Management:**
- **[Service Layer Integration](service-layer-integration.md)** ⭐ - TanStack Query optimization strategies
- **[State Management](state-management.md)** ⭐ - Efficient state patterns with selective subscriptions
- **[Custom Hooks](custom-hooks.md)** - Performance-optimized business logic patterns

### **Performance in Development Workflow:**
- **[Component Testing](component-testing.md)** - Performance testing strategies
- **[File Organization](file-organization.md)** - Bundle optimization through proper organization

---

## Implementation Priority

### **Phase 1: Foundation (Week 1-2)**
1. **Component memoization** - Apply React.memo to atomic components
2. **TanStack Query optimization** - Configure ServiceNow-appropriate caching
3. **Performance monitoring setup** - Track ServiceNow query performance
4. **Bundle analysis** - Identify optimization opportunities

### **Phase 2: Advanced Optimization (Week 3-4)**
1. **Virtual scrolling** - Implement for large ServiceNow lists
2. **Code splitting** - ServiceNow feature-based lazy loading
3. **Optimistic updates** - Enhance mutation performance
4. **Memory management** - Cleanup and garbage collection

### **Phase 3: Platform Optimization (Week 5-6)**
1. **Portal optimization** - ServiceNow Portal-specific tuning
2. **Next Experience optimization** - Modern ServiceNow UI performance
3. **Real-time optimization** - Event source and live data performance
4. **Performance testing** - Comprehensive performance validation

---

*Performance optimization for ServiceNow applications requires a holistic approach combining React best practices with ServiceNow-specific optimization strategies. Focus on atomic component memoization, intelligent TanStack Query caching, and ServiceNow platform-aware optimizations for the best results.*