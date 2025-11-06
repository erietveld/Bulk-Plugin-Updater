# TanStack Query - Server State Management

## **Server State Layer with TanStack Query (Enhanced)**

### **Advanced Query Configuration**

```typescript
// Enhanced TanStack Query configuration for ServiceNow
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ServiceNow-optimized settings with advanced retry logic
      retry: (failureCount: number, error: any): boolean => {
        // Don't retry authentication or authorization errors
        if (error?.status === 401 || error?.status === 403) {
          logger.warn('Query retry skipped for auth error', { status: error.status, failureCount });
          return false;
        }
        
        // Retry server errors up to 3 times
        if (error?.status >= 500) {
          const shouldRetry = failureCount < 3;
          logger.info('Query retry decision for server error', { 
            status: error.status, 
            failureCount, 
            shouldRetry 
          });
          return shouldRetry;
        }
        
        // Don't retry client errors (4xx)
        if (error?.status >= 400 && error?.status < 500) {
          logger.warn('Query retry skipped for client error', { status: error.status });
          return false;
        }
        
        // Retry network errors up to 2 times
        const shouldRetry = failureCount < 2;
        logger.info('Query retry decision for network error', { failureCount, shouldRetry });
        return shouldRetry;
      },
      
      // Exponential backoff with maximum delay
      retryDelay: (attemptIndex: number): number => {
        const delay = Math.min(1000 * 2 ** attemptIndex, 30000);
        logger.debug('Query retry delay calculated', { attemptIndex, delay });
        return delay;
      },
      
      // Smart cache settings based on data type
      staleTime: 5 * 60 * 1000,        // 5 minutes - data is fresh for this long
      gcTime: 10 * 60 * 1000,          // 10 minutes - cache garbage collection time
      refetchOnWindowFocus: true,      // Refresh when user returns to tab
      refetchOnReconnect: true,        // Refresh when network reconnects
      refetchOnMount: true             // Refresh when component mounts
    },
    
    mutations: {
      // Global mutation error handling
      onError: (error: any, variables: any, context: any) => {
        logger.error('Mutation failed', error, { variables, context });
        
        // Show user-friendly error notification
        if (error?.status >= 500) {
          showErrorNotification('Server error occurred. Please try again.');
        } else if (error?.status === 401) {
          showErrorNotification('Session expired. Please log in again.');
          // Optionally redirect to login
        } else {
          showErrorNotification(error?.message || 'Operation failed. Please try again.');
        }
      },
      
      // Global mutation success handling
      onSuccess: (data: any, variables: any, context: any) => {
        logger.info('Mutation succeeded', { data, variables, context });
      }
    }
  }
});
```

### **ServiceNow-Optimized Query Hooks**

```typescript
// PATTERN 2C: Optimized API calls for dynamic data
export const useRequests = (filters: RequestFilters = {}) => {
  const appStore = useAppStore();
  
  return useQuery({
    queryKey: ['requests', filters], // Compound key for cache control
    queryFn: async () => {
      const query = appStore.getServiceNowQuery();
      logger.info('PATTERN 2C: Fetching requests with query', { 
        pattern: '2C',
        query,
        filters,
        cacheKey: ['requests', filters]
      });
      
      return requestService.getRequests(query);
    },
    staleTime: 2 * 60 * 1000,              // Data-specific cache timing
    keepPreviousData: true,                 // Smooth user experience
    enabled: !!filters,                     // Only run when filters are available
    
    // ServiceNow-specific error handling
    retry: (failureCount, error) => {
      if (error?.status === 401 || error?.status === 403) return false;
      return failureCount < 3;
    },
    
    // Advanced cache invalidation
    refetchInterval: (data, query) => {
      // More frequent updates for critical data
      if (filters.status === 'pending') return 30 * 1000; // 30 seconds
      if (filters.priority === 'urgent') return 60 * 1000; // 1 minute
      return 5 * 60 * 1000; // 5 minutes default
    }
  });
};

export const useDashboardStats = () => {
  const userContext = useUserContext();
  
  return useQuery({
    queryKey: ['dashboard-stats', userContext.userId],
    queryFn: async () => {
      logger.info('PATTERN 2C: Fetching dashboard statistics', {
        pattern: '2C',
        userId: userContext.userId,
        dataSource: 'tanstack-query-api'
      });
      
      return statisticsService.getDashboardStats();
    },
    staleTime: 10 * 60 * 1000,             // Stats change less frequently
    refetchInterval: 2 * 60 * 1000,        // Auto-refresh every 2 minutes
    retry: 2                               // Fewer retries for statistics
  });
};

export const useRequest = (requestId: string) => {
  return useQuery({
    queryKey: ['request', requestId],
    queryFn: () => requestService.getRequest(requestId),
    enabled: !!requestId,
    staleTime: 30 * 1000,                  // Individual records update more frequently
    
    // Optimistic updates support
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
};
```

### **Advanced Mutation Hooks with Optimistic Updates**

```typescript
// Create request mutation with optimistic updates
export const useCreateRequest = () => {
  const queryClient = useQueryClient();
  const navigate = useEnhancedNavigation();
  
  return useMutation({
    mutationFn: requestService.createRequest,
    
    // Optimistic update
    onMutate: async (newRequest) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['requests'] });
      
      // Snapshot previous value
      const previousRequests = queryClient.getQueryData(['requests']);
      
      // Optimistically update cache
      queryClient.setQueryData(['requests'], (old: any[]) => {
        const optimisticRequest = {
          ...newRequest,
          sys_id: `temp-${Date.now()}`,
          sys_created_on: new Date().toISOString(),
          status: 'draft'
        };
        return [optimisticRequest, ...(old || [])];
      });
      
      // Return context for rollback
      return { previousRequests };
    },
    
    onError: (error, newRequest, context) => {
      // Rollback optimistic update
      if (context?.previousRequests) {
        queryClient.setQueryData(['requests'], context.previousRequests);
      }
      
      logger.error('Create request failed', error, { newRequest });
    },
    
    onSuccess: (data, variables) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      logger.info('Request created successfully', { requestId: data.sys_id });
      showSuccessNotification('Request created successfully!');
      
      // Navigate to the new request
      navigate.navigate(`/request/${data.sys_id}`, {
        trackingData: { action: 'create-success' }
      });
    },
    
    onSettled: () => {
      // Always refetch after mutation settles
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    }
  });
};

// Update request mutation
export const useUpdateRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, updates }: { requestId: string; updates: Partial<Request> }) =>
      requestService.updateRequest(requestId, updates),
    
    onMutate: async ({ requestId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['request', requestId] });
      
      const previousRequest = queryClient.getQueryData(['request', requestId]);
      
      // Optimistic update for individual request
      queryClient.setQueryData(['request', requestId], (old: any) => ({
        ...old,
        ...updates,
        sys_updated_on: new Date().toISOString()
      }));
      
      // Also update in requests list if present
      queryClient.setQueryData(['requests'], (old: any[]) => {
        if (!old) return old;
        return old.map(request => 
          request.sys_id.value === requestId 
            ? { ...request, ...updates }
            : request
        );
      });
      
      return { previousRequest };
    },
    
    onError: (error, { requestId }, context) => {
      if (context?.previousRequest) {
        queryClient.setQueryData(['request', requestId], context.previousRequest);
      }
      logger.error('Update request failed', error, { requestId });
    },
    
    onSuccess: (data, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      
      logger.info('Request updated successfully', { requestId });
      showSuccessNotification('Request updated successfully!');
    }
  });
};

// Delete request mutation
export const useDeleteRequest = () => {
  const queryClient = useQueryClient();
  const navigate = useEnhancedNavigation();
  
  return useMutation({
    mutationFn: requestService.deleteRequest,
    
    onSuccess: (data, requestId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['request', requestId] });
      
      // Update requests list
      queryClient.setQueryData(['requests'], (old: any[]) => {
        if (!old) return old;
        return old.filter(request => request.sys_id.value !== requestId);
      });
      
      // Update dashboard stats
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      
      logger.info('Request deleted successfully', { requestId });
      showSuccessNotification('Request deleted successfully!');
      
      // Navigate away if currently viewing deleted request
      if (window.location.pathname.includes(requestId)) {
        navigate.navigate('/dashboard');
      }
    },
    
    onError: (error, requestId) => {
      logger.error('Delete request failed', error, { requestId });
    }
  });
};
```

### **Background Sync and Offline Support**

```typescript
// Background sync service for offline support
export const backgroundSyncService = {
  // Queue mutations for when online
  queueMutation: (mutationKey: string, variables: any) => {
    const queue = JSON.parse(localStorage.getItem('mutation-queue') || '[]');
    queue.push({
      id: `${mutationKey}-${Date.now()}`,
      mutationKey,
      variables,
      timestamp: Date.now()
    });
    localStorage.setItem('mutation-queue', JSON.stringify(queue));
  },
  
  // Process queued mutations when back online
  processQueue: async (queryClient: QueryClient) => {
    const queue = JSON.parse(localStorage.getItem('mutation-queue') || '[]');
    
    for (const item of queue) {
      try {
        if (item.mutationKey === 'createRequest') {
          await requestService.createRequest(item.variables);
        } else if (item.mutationKey === 'updateRequest') {
          await requestService.updateRequest(item.variables.requestId, item.variables.updates);
        }
        
        logger.info('Queued mutation processed', { mutationKey: item.mutationKey });
      } catch (error) {
        logger.error('Failed to process queued mutation', error, { item });
      }
    }
    
    // Clear queue after processing
    localStorage.removeItem('mutation-queue');
    
    // Invalidate all queries to refresh data
    queryClient.invalidateQueries();
  }
};

// Hook for online/offline handling
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logger.info('Network connection restored');
      
      // Process any queued mutations
      backgroundSyncService.processQueue(queryClient);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      logger.warn('Network connection lost');
      showWarningNotification('You are offline. Changes will be synced when connection is restored.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient]);
  
  return isOnline;
};
```

### **Advanced Query Patterns**

```typescript
// Infinite query for large datasets
export const useInfiniteRequests = (filters: RequestFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ['infinite-requests', filters],
    queryFn: ({ pageParam = 0 }) => 
      requestService.getRequestsPaginated({
        ...filters,
        offset: pageParam * 25,
        limit: 25
      }),
    
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < 25) return undefined;
      return pages.length;
    },
    
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true
  });
};

// Dependent queries
export const useRequestWithComments = (requestId: string) => {
  // First, get the request
  const requestQuery = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => requestService.getRequest(requestId),
    enabled: !!requestId
  });
  
  // Then, get comments (depends on request data)
  const commentsQuery = useQuery({
    queryKey: ['comments', requestId],
    queryFn: () => commentService.getComments(requestId),
    enabled: !!requestQuery.data?.sys_id, // Only run when request is loaded
    staleTime: 2 * 60 * 1000
  });
  
  return {
    request: requestQuery.data,
    comments: commentsQuery.data,
    isLoading: requestQuery.isLoading || commentsQuery.isLoading,
    error: requestQuery.error || commentsQuery.error
  };
};

// Parallel queries with error handling
export const useDashboardData = () => {
  const results = useQueries({
    queries: [
      {
        queryKey: ['recent-requests'],
        queryFn: () => requestService.getRecentRequests(),
        staleTime: 2 * 60 * 1000
      },
      {
        queryKey: ['dashboard-stats'],
        queryFn: () => statisticsService.getDashboardStats(),
        staleTime: 5 * 60 * 1000
      },
      {
        queryKey: ['user-notifications'],
        queryFn: () => notificationService.getUserNotifications(),
        staleTime: 30 * 1000
      }
    ]
  });
  
  return {
    recentRequests: results[0].data,
    stats: results[1].data,
    notifications: results[2].data,
    isLoading: results.some(result => result.isLoading),
    errors: results.map(result => result.error).filter(Boolean)
  };
};
```

### **Query Devtools Integration**

```typescript
// Enhanced development experience
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={theme}>
        {/* Your app components */}
        <Router />
        
        {/* Development tools */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools 
            initialIsOpen={false}
            position="bottom-right"
          />
        )}
      </MantineProvider>
    </QueryClientProvider>
  );
};
```

### **Performance Monitoring**

```typescript
// Query performance monitoring
export const queryPerformanceLogger = {
  onQueryStart: (query: any) => {
    const startTime = performance.now();
    return { startTime };
  },
  
  onQueryEnd: (query: any, context: any) => {
    const endTime = performance.now();
    const duration = endTime - context.startTime;
    
    logger.info('Query performance', {
      queryKey: query.queryKey,
      duration: Math.round(duration),
      status: query.state.status,
      dataUpdatedAt: query.state.dataUpdatedAt
    });
    
    // Alert on slow queries
    if (duration > 5000) {
      logger.warn('Slow query detected', {
        queryKey: query.queryKey,
        duration: Math.round(duration)
      });
    }
  }
};

// Integrate with query client
queryClient.getQueryCache().subscribe(queryPerformanceLogger.onQueryEnd);
```

### **Benefits of Advanced TanStack Query Patterns**

✅ **ServiceNow Optimization** - Tailored retry logic and error handling for ServiceNow APIs
✅ **Optimistic Updates** - Immediate UI feedback with automatic rollback on errors
✅ **Background Sync** - Offline support with mutation queuing
✅ **Performance Monitoring** - Query performance tracking and slow query detection
✅ **Advanced Caching** - Intelligent cache invalidation and data synchronization
✅ **Error Resilience** - Comprehensive error handling with user-friendly notifications
✅ **TypeScript Safety** - Full type safety for all query and mutation operations
✅ **Development Experience** - Integrated devtools and debugging capabilities

[← Back to Main Advice](../Advice.md)