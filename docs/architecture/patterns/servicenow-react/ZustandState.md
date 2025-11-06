# Client State Layer with Zustand

## **Client State Layer with Zustand (Enhanced)**

Advanced Zustand store patterns with selective subscriptions and performance optimization.

### **Advanced Zustand Store with Selective Subscriptions**

```typescript
// Enterprise-grade Zustand store with advanced patterns
export const useAppStore = createWithEqualityFn<AppStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // PATTERN 2A: Initialize user context immediately from window.snUserContext
        user: initializeUserContext(),
        // PATTERN 2B: Initialize enhanced data (when available)
        enhancedData: initializeEnhancedData(),
        
        ui: {
          isRefreshing: false,
          currentPath: '/',
          activeModal: null,
          sidebarCollapsed: false,
          theme: 'light',
          designSystem: 'mantine'
        },
        
        // Advanced filter state with compound query generation
        filters: {
          search: '',
          status: '',
          category: '',
          priority: '',
          dateRange: { from: '', to: '' },
          quickFilters: {
            myItems: false,
            pendingApproval: false,
            recentItems: false,
            urgentItems: false
          }
        },
        
        // Advanced pagination with metadata
        pagination: {
          currentPage: 1,
          pageSize: 25,
          totalRecords: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        },
        
        // Cache management
        cache: {
          lastRefresh: null,
          invalidatedKeys: [],
          backgroundSync: false
        },
        
        // User preferences
        preferences: {
          autoRefresh: true,
          refreshInterval: 5 * 60 * 1000, // 5 minutes
          notifications: true,
          compactView: false,
          defaultView: 'dashboard'
        },

        // Enhanced actions with error handling
        startRefresh: () => {
          set((state) => ({
            ui: { ...state.ui, isRefreshing: true },
            cache: { ...state.cache, lastRefresh: new Date().toISOString() }
          }));
          logger.trackUserAction('refresh-started');
        },

        completeRefresh: () => {
          set((state) => ({
            ui: { ...state.ui, isRefreshing: false }
          }));
          logger.trackUserAction('refresh-completed');
        },

        // Advanced filter management
        setFilter: (key: keyof FilterState, value: any) => {
          set((state) => {
            const newFilters = { ...state.filters, [key]: value };
            
            logger.debug('Filter updated', { 
              key, 
              value, 
              previousValue: state.filters[key],
              allFilters: newFilters 
            });
            
            return {
              filters: newFilters,
              pagination: { ...state.pagination, currentPage: 1 } // Reset pagination
            };
          });
        },

        toggleQuickFilter: (filterKey: keyof QuickFilters) => {
          set((state) => {
            const newValue = !state.filters.quickFilters[filterKey];
            const newQuickFilters = { 
              ...state.filters.quickFilters, 
              [filterKey]: newValue 
            };
            
            logger.debug('Quick filter toggled', { 
              filterKey, 
              newValue,
              quickFilters: newQuickFilters 
            });
            
            return {
              filters: { 
                ...state.filters, 
                quickFilters: newQuickFilters 
              },
              pagination: { ...state.pagination, currentPage: 1 }
            };
          });
        },

        clearFilters: () => {
          set((state) => {
            logger.trackUserAction('filters-cleared');
            
            return {
              filters: {
                search: '',
                status: '',
                category: '',
                priority: '',
                dateRange: { from: '', to: '' },
                quickFilters: {
                  myItems: false,
                  pendingApproval: false,
                  recentItems: false,
                  urgentItems: false
                }
              },
              pagination: { ...state.pagination, currentPage: 1 }
            };
          });
        },

        // Advanced ServiceNow query generation
        getServiceNowQuery: () => {
          const { filters, user } = get();
          const queryParts: string[] = [];

          if (filters.search?.trim()) {
            queryParts.push(`titleLIKE${filters.search}^ORdescriptionLIKE${filters.search}`);
          }

          if (filters.status) {
            queryParts.push(`status=${filters.status}`);
          }

          if (filters.category) {
            queryParts.push(`category=${filters.category}`);
          }

          if (filters.priority) {
            queryParts.push(`priority=${filters.priority}`);
          }

          if (filters.dateRange.from) {
            queryParts.push(`sys_created_on>=${filters.dateRange.from}`);
          }

          if (filters.dateRange.to) {
            queryParts.push(`sys_created_on<=${filters.dateRange.to}`);
          }

          // Quick filters with advanced logic
          if (filters.quickFilters.myItems && user.userId) {
            queryParts.push(`sys_created_by=${user.userId}`);
          }

          if (filters.quickFilters.pendingApproval) {
            queryParts.push(`status=pending`);
          }

          if (filters.quickFilters.recentItems) {
            const recentDate = new Date();
            recentDate.setDate(recentDate.getDate() - 7);
            queryParts.push(`sys_created_on>=${recentDate.toISOString().split('T')[0]}`);
          }

          if (filters.quickFilters.urgentItems) {
            queryParts.push(`priority=urgent`);
          }

          const query = queryParts.join('^');
          logger.debug('ServiceNow query generated', { 
            query, 
            filtersApplied: queryParts.length,
            filterBreakdown: {
              search: !!filters.search,
              status: !!filters.status,
              category: !!filters.category,
              priority: !!filters.priority,
              dateRange: !!(filters.dateRange.from || filters.dateRange.to),
              quickFilters: Object.values(filters.quickFilters).some(Boolean)
            }
          });
          return query;
        },

        // Pagination management
        setPage: (page: number) => {
          set((state) => ({
            pagination: { 
              ...state.pagination, 
              currentPage: Math.max(1, Math.min(page, state.pagination.totalPages))
            }
          }));
        },

        setPageSize: (size: number) => {
          set((state) => ({
            pagination: { 
              ...state.pagination, 
              pageSize: size,
              currentPage: 1 // Reset to first page
            }
          }));
        },

        updatePaginationMetadata: (totalRecords: number) => {
          set((state) => {
            const totalPages = Math.ceil(totalRecords / state.pagination.pageSize);
            const currentPage = Math.min(state.pagination.currentPage, totalPages);
            
            return {
              pagination: {
                ...state.pagination,
                totalRecords,
                totalPages,
                currentPage: Math.max(1, currentPage),
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1
              }
            };
          });
        },

        // UI state management
        setModal: (modal: string | null) => {
          set((state) => ({
            ui: { ...state.ui, activeModal: modal }
          }));
        },

        toggleSidebar: () => {
          set((state) => ({
            ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed }
          }));
        },

        setTheme: (theme: 'light' | 'dark') => {
          set((state) => ({
            ui: { ...state.ui, theme }
          }));
        },

        setDesignSystem: (designSystem: DesignSystem) => {
          set((state) => ({
            ui: { ...state.ui, designSystem }
          }));
        },

        // Preferences management
        updatePreferences: (updates: Partial<UserPreferences>) => {
          set((state) => ({
            preferences: { ...state.preferences, ...updates }
          }));
        },

        // Cache management
        invalidateCache: (keys: string[]) => {
          set((state) => ({
            cache: {
              ...state.cache,
              invalidatedKeys: [...state.cache.invalidatedKeys, ...keys]
            }
          }));
        },

        clearCache: () => {
          set((state) => ({
            cache: {
              ...state.cache,
              invalidatedKeys: [],
              lastRefresh: new Date().toISOString()
            }
          }));
        },

        // Background sync
        setBackgroundSync: (enabled: boolean) => {
          set((state) => ({
            cache: { ...state.cache, backgroundSync: enabled }
          }));
        }
      }),
      {
        name: 'enterprise-application-store',
        partialize: (state) => ({
          preferences: state.preferences,
          cache: {
            lastRefresh: state.cache.lastRefresh,
            backgroundSync: state.cache.backgroundSync
          },
          filters: state.filters,
          pagination: state.pagination,
          ui: {
            theme: state.ui.theme,
            designSystem: state.ui.designSystem,
            sidebarCollapsed: state.ui.sidebarCollapsed
          }
          // Don't persist user context or enhanced data - provided fresh on page load
        }),
      }
    )
  ),
  shallow
);
```

### **Performance-Optimized Selective Hooks**

```typescript
// Advanced performance-optimized selective hooks
export const useRefreshState = () => useAppStore(
  state => ({ 
    isRefreshing: state.ui.isRefreshing, 
    startRefresh: state.startRefresh, 
    completeRefresh: state.completeRefresh 
  }),
  shallow
);

export const useFilterActions = () => useAppStore(
  state => ({ 
    setFilter: state.setFilter, 
    toggleQuickFilter: state.toggleQuickFilter, 
    clearFilters: state.clearFilters,
    getServiceNowQuery: state.getServiceNowQuery
  }),
  shallow
);

export const useFilterState = () => useAppStore(
  state => state.filters,
  (a, b) => {
    // Custom equality check for filter state
    return JSON.stringify(a) === JSON.stringify(b);
  }
);

export const usePaginationState = () => useAppStore(
  state => ({
    pagination: state.pagination,
    setPage: state.setPage,
    setPageSize: state.setPageSize,
    updatePaginationMetadata: state.updatePaginationMetadata
  }),
  shallow
);

export const useUIState = () => useAppStore(
  state => ({
    ui: state.ui,
    setModal: state.setModal,
    toggleSidebar: state.toggleSidebar,
    setTheme: state.setTheme,
    setDesignSystem: state.setDesignSystem
  }),
  shallow
);

export const usePreferences = () => useAppStore(
  state => ({
    preferences: state.preferences,
    updatePreferences: state.updatePreferences
  }),
  shallow
);

export const useCacheState = () => useAppStore(
  state => ({
    cache: state.cache,
    invalidateCache: state.invalidateCache,
    clearCache: state.clearCache,
    setBackgroundSync: state.setBackgroundSync
  }),
  shallow
);
```

### **Advanced Store Middleware**

```typescript
// Logger middleware for development
const logger = (config) => (set, get, api) =>
  config(
    (...args) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🏪 Store Update:', args);
      }
      set(...args);
    },
    get,
    api
  );

// Persistence middleware with error handling
const persistenceMiddleware = (config) => (set, get, api) =>
  config(
    (...args) => {
      try {
        set(...args);
        
        // Save to localStorage with error handling
        const state = get();
        const serialized = JSON.stringify(state);
        localStorage.setItem('app-state', serialized);
      } catch (error) {
        console.error('Failed to persist state:', error);
        // Continue without persistence
        set(...args);
      }
    },
    get,
    api
  );

// Performance monitoring middleware
const performanceMiddleware = (config) => (set, get, api) => {
  let updateCount = 0;
  let lastUpdate = performance.now();
  
  return config(
    (...args) => {
      const start = performance.now();
      set(...args);
      const end = performance.now();
      
      updateCount++;
      const timeSinceLastUpdate = start - lastUpdate;
      lastUpdate = end;
      
      // Log performance metrics
      if (process.env.NODE_ENV === 'development') {
        console.log(`🏪 Store Performance:`, {
          updateDuration: Math.round(end - start),
          timeSinceLastUpdate: Math.round(timeSinceLastUpdate),
          totalUpdates: updateCount
        });
      }
      
      // Alert on performance issues
      if (end - start > 100) {
        console.warn('🐌 Slow store update detected:', Math.round(end - start), 'ms');
      }
    },
    get,
    api
  );
};
```

### **Store Initialization Utilities**

```typescript
// Initialize user context from Pattern 2A
const initializeUserContext = (): UserContext => {
  if (window.snUserContext) {
    logger.info('Initializing user context from Pattern 2A', {
      userId: window.snUserContext.userId,
      userName: window.snUserContext.userName
    });
    return window.snUserContext;
  }
  
  // Development fallback
  const fallback = {
    userId: 'dev-user-123',
    userName: 'developer',
    userDisplayName: 'Development User',
    isAdmin: true,
    isManager: true,
    isUser: true,
    sessionId: 'dev-session',
    userEmail: 'dev@example.com',
    userDepartment: 'IT',
    userLocation: 'Development',
    dataSource: 'development-fallback',
    timestamp: new Date().toISOString()
  };
  
  logger.warn('Using development fallback for user context', fallback);
  return fallback;
};

// Initialize enhanced data from Pattern 2B
const initializeEnhancedData = () => {
  if (window.enhancedApplicationData) {
    logger.info('Initializing enhanced data from Pattern 2B', {
      analytics: window.enhancedApplicationData.analytics,
      generatedAt: window.enhancedApplicationData.generatedAt
    });
    return window.enhancedApplicationData;
  }
  
  logger.info('Enhanced data not available, will use Pattern 2C for dynamic loading');
  return null;
};
```

### **Store Developer Tools Integration**

```typescript
// Redux DevTools integration for Zustand (development only)
const storeWithDevtools = process.env.NODE_ENV === 'development'
  ? devtools(useAppStore, {
      name: 'Enterprise Application Store',
      serialize: {
        options: true
      }
    })
  : useAppStore;

// Store inspector hook for debugging
export const useStoreInspector = () => {
  const store = useAppStore();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Expose store to window for debugging
      (window as any).__APP_STORE__ = store;
      
      // Log store state changes
      const unsubscribe = useAppStore.subscribe(
        (state) => state,
        (state, previousState) => {
          console.log('🏪 Store State Changed:', {
            previous: previousState,
            current: state,
            timestamp: new Date().toISOString()
          });
        }
      );
      
      return unsubscribe;
    }
  }, [store]);
  
  return store;
};
```

### **Store Testing Utilities**

```typescript
// Store reset utility for testing
export const resetStore = () => {
  useAppStore.setState({
    user: initializeUserContext(),
    enhancedData: initializeEnhancedData(),
    ui: {
      isRefreshing: false,
      currentPath: '/',
      activeModal: null,
      sidebarCollapsed: false,
      theme: 'light',
      designSystem: 'mantine'
    },
    filters: {
      search: '',
      status: '',
      category: '',
      priority: '',
      dateRange: { from: '', to: '' },
      quickFilters: {
        myItems: false,
        pendingApproval: false,
        recentItems: false,
        urgentItems: false
      }
    },
    pagination: {
      currentPage: 1,
      pageSize: 25,
      totalRecords: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    },
    cache: {
      lastRefresh: null,
      invalidatedKeys: [],
      backgroundSync: false
    },
    preferences: {
      autoRefresh: true,
      refreshInterval: 5 * 60 * 1000,
      notifications: true,
      compactView: false,
      defaultView: 'dashboard'
    }
  });
};

// Store state snapshot for testing
export const getStoreSnapshot = () => {
  return JSON.parse(JSON.stringify(useAppStore.getState()));
};

// Store state comparison for testing
export const compareStoreStates = (state1: any, state2: any) => {
  const differences = [];
  
  const compare = (obj1: any, obj2: any, path = '') => {
    for (const key in obj1) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (obj1[key] !== obj2[key]) {
        if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
          compare(obj1[key], obj2[key], currentPath);
        } else {
          differences.push({
            path: currentPath,
            before: obj1[key],
            after: obj2[key]
          });
        }
      }
    }
  };
  
  compare(state1, state2);
  return differences;
};
```

### **Store Integration Examples**

```typescript
// Example component using selective subscriptions
const FilterPanel: React.FC = () => {
  const filters = useFilterState();
  const { setFilter, toggleQuickFilter, clearFilters } = useFilterActions();
  
  // This component only re-renders when filter state changes
  return (
    <Stack gap="md">
      <TextInput
        label="Search"
        value={filters.search}
        onChange={(e) => setFilter('search', e.target.value)}
        placeholder="Search requests..."
      />
      
      <Select
        label="Status"
        value={filters.status}
        onChange={(value) => setFilter('status', value)}
        data={[
          { value: '', label: 'All Statuses' },
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'rejected', label: 'Rejected' }
        ]}
      />
      
      <Group gap="xs">
        <Switch
          label="My Items Only"
          checked={filters.quickFilters.myItems}
          onChange={() => toggleQuickFilter('myItems')}
        />
        <Switch
          label="Pending Approval"
          checked={filters.quickFilters.pendingApproval}
          onChange={() => toggleQuickFilter('pendingApproval')}
        />
      </Group>
      
      <Button variant="outline" onClick={clearFilters}>
        Clear Filters
      </Button>
    </Stack>
  );
};

// Example component using pagination state
const DataTable: React.FC = () => {
  const { pagination, setPage, setPageSize } = usePaginationState();
  const filters = useFilterState();
  const { data } = useRequests(filters);
  
  // This component only re-renders when pagination state changes
  return (
    <Stack gap="md">
      <Table>
        {/* Table content */}
      </Table>
      
      <Group justify="space-between">
        <Select
          value={pagination.pageSize.toString()}
          onChange={(value) => setPageSize(parseInt(value!))}
          data={[
            { value: '10', label: '10 per page' },
            { value: '25', label: '25 per page' },
            { value: '50', label: '50 per page' }
          ]}
        />
        
        <Pagination
          value={pagination.currentPage}
          onChange={setPage}
          total={pagination.totalPages}
        />
      </Group>
    </Stack>
  );
};
```

### **Benefits of Advanced Zustand Patterns**

✅ **Performance Optimization** - Selective subscriptions prevent unnecessary re-renders
✅ **ServiceNow Integration** - Built-in query generation and user context handling
✅ **Pattern 2A/2B Support** - Seamless integration with hybrid data architecture
✅ **Advanced Filtering** - Compound queries with ServiceNow syntax generation
✅ **Persistence Management** - Smart caching with error handling
✅ **Development Experience** - Redux DevTools integration and debugging utilities
✅ **Type Safety** - Full TypeScript support with strict typing
✅ **Testing Support** - Utilities for store testing and state management
✅ **Middleware Support** - Performance monitoring and logging capabilities
✅ **Error Resilience** - Graceful handling of persistence and state errors

[← Back to Main Advice](../Advice.md)