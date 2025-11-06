# ServiceNow Hybrid Data Architecture - Pattern 2A/2B/2C

## **ServiceNow-Optimized Data Architecture (Hybrid Pattern)**

**Use three-tier data strategy** for optimal performance and user experience:

### **Pattern 2A: Immediate Data (Jelly Template Injection)**

This pattern provides instant data availability with zero loading states for critical user context information.

```html
<!-- PATTERN 2A: Immediate data availability -->
<script>
  window.snUserContext = {
    userName: "${gs.getUserName()}",
    userId: "${gs.getUserID()}",
    userDisplayName: "${gs.getUser().getDisplayName()}",
    isAdmin: "${gs.getUser().hasRole('admin')}" === "true",
    isManager: "${gs.getUser().hasRole('manager')}" === "true", 
    isUser: "${gs.getUser().hasRole('user')}" === "true",
    sessionId: "${gs.getSessionID()}",
    userEmail: "${gs.getUser().getEmail()}",
    userDepartment: "${gs.getUser().getDepartment()}",
    userLocation: "${gs.getUser().getLocation()}",
    dataSource: "jelly-template-injection",
    timestamp: new Date().toISOString()
  };
  
  // Debug information for development
  if (new URLSearchParams(window.location.search).get('sn_debug') === 'true') {
    console.log('🔵 PATTERN 2A: User context injected', window.snUserContext);
  }
</script>
```

**TypeScript Integration:**
```typescript
// Advanced user context hook with Pattern 2A integration
export const useUserContext = (): UserContext => {
  const context = useMemo(() => {
    if (!window.snUserContext) {
      logger.warn('PATTERN 2A: snUserContext not available, using development fallback', {
        pattern: '2A',
        dataSource: 'fallback',
        available: false
      });
      return defaultUserContext;
    }
    
    // Structured logging for hybrid data pattern
    logger.info('PATTERN 2A: Using immediate user context', {
      pattern: '2A',
      dataSource: 'jelly-template-injection',
      userId: window.snUserContext.userId,
      userName: window.snUserContext.userName,
      hasPermissions: {
        isAdmin: window.snUserContext.isAdmin,
        hasManagerRole: window.snUserContext.isManager,
        hasUserRole: window.snUserContext.isUser
      },
      timestamp: window.snUserContext.timestamp
    });
    
    return window.snUserContext;
  }, []); // Empty dependency array - data is static after injection

  return context;
};

// Advanced performance-optimized permission hook
export const useUserPermissions = () => {
  const context = useUserContext();
  return useMemo(() => {
    const permissions = {
      isAdmin: context.isAdmin,
      isManager: context.isManager,
      isUser: context.isUser,
      canCreateRequests: context.isUser || context.isManager || context.isAdmin,
      canManageRequests: context.isManager || context.isAdmin,
      canViewAllRequests: context.isManager || context.isAdmin,
      canDeleteRequests: context.isAdmin,
      canApproveRequests: context.isManager || context.isAdmin,
      canViewReports: context.isManager || context.isAdmin
    };

    logger.debug('PATTERN 2A: User permissions calculated', {
      pattern: '2A',
      userId: context.userId,
      permissions
    });

    return permissions;
  }, [context]);
};
```

### **Pattern 2B: Enhanced Data (G:Evaluate Server Processing)**

This pattern provides complex calculated data that requires server-side processing using GlideRecord queries and business logic.

```html
<!-- PATTERN 2B: Server-side processing with safe injection -->
<g:evaluate>
  // Complex server-side calculations using ServiceNow APIs
  var totalRequests = 0;
  var pendingRequests = 0;
  var approvedRequests = 0;
  var availableItems = 0;
  var totalItems = 0;
  var userDepartmentStats = {};
  var recentActivity = [];
  
  try {
    // Get request statistics
    var requestGR = new GlideRecord('x_snc_visitor_pa_1_visitor_parking_request');
    requestGR.query();
    while (requestGR.next()) {
      totalRequests++;
      var status = requestGR.getValue('status');
      if (status === 'pending') pendingRequests++;
      if (status === 'approved') approvedRequests++;
    }
    
    // Get parking location statistics
    var locationGR = new GlideRecord('x_snc_visitor_pa_1_parking_location');
    locationGR.query();
    while (locationGR.next()) {
      totalItems++;
      if (locationGR.getValue('status') === 'available') {
        availableItems++;
      }
    }
    
    // Get department-specific statistics
    var deptGR = new GlideRecord('x_snc_visitor_pa_1_visitor_parking_request');
    deptGR.addQuery('sys_created_by.department', gs.getUser().getDepartment());
    deptGR.query();
    var deptRequests = deptGR.getRowCount();
    
    // Recent activity (last 7 days)
    var activityGR = new GlideRecord('x_snc_visitor_pa_1_visitor_parking_request');
    var sevenDaysAgo = new GlideDateTime();
    sevenDaysAgo.addDaysUTC(-7);
    activityGR.addQuery('sys_created_on', '>=', sevenDaysAgo);
    activityGR.orderByDesc('sys_created_on');
    activityGR.setLimit(5);
    activityGR.query();
    
    var activityArray = [];
    while (activityGR.next()) {
      activityArray.push({
        id: activityGR.getValue('sys_id'),
        title: activityGR.getValue('title'),
        status: activityGR.getValue('status'),
        created: activityGR.getValue('sys_created_on'),
        createdBy: activityGR.getDisplayValue('sys_created_by')
      });
    }
    
    // CRITICAL: Use individual variables for safe injection
    var enhancedTotalRequests = totalRequests;
    var enhancedPendingRequests = pendingRequests;
    var enhancedApprovedRequests = approvedRequests;
    var enhancedAvailableItems = availableItems;
    var enhancedTotalItems = totalItems;
    var enhancedDepartmentRequests = deptRequests;
    var enhancedRecentActivity = JSON.stringify(activityArray);
    
  } catch (ex) {
    // Error handling - provide safe defaults
    gs.log('Enhanced data calculation error: ' + ex.message, 'VisitorParkingApp');
    var enhancedTotalRequests = 0;
    var enhancedPendingRequests = 0;
    var enhancedApprovedRequests = 0;
    var enhancedAvailableItems = 0;
    var enhancedTotalItems = 100;
    var enhancedDepartmentRequests = 0;
    var enhancedRecentActivity = '[]';
  }
</g:evaluate>

<script>
  window.enhancedApplicationData = {
    analytics: {
      totalRequests: ${enhancedTotalRequests},
      pendingRequests: ${enhancedPendingRequests},
      approvedRequests: ${enhancedApprovedRequests},
      availableItems: ${enhancedAvailableItems},
      totalItems: ${enhancedTotalItems},
      departmentRequests: ${enhancedDepartmentRequests},
      occupancyRate: ${enhancedTotalItems > 0 ? ((enhancedTotalItems - enhancedAvailableItems) / enhancedTotalItems * 100).toFixed(1) : 0},
      approvalRate: ${enhancedTotalRequests > 0 ? (enhancedApprovedRequests / enhancedTotalRequests * 100).toFixed(1) : 0}
    },
    recentActivity: ${enhancedRecentActivity},
    dataSource: "g-evaluate-server-processing",
    generatedAt: "${new GlideDateTime().toString()}"
  };
  
  // Debug information
  if (new URLSearchParams(window.location.search).get('sn_debug') === 'true') {
    console.log('🟡 PATTERN 2B: Enhanced data injected', window.enhancedApplicationData);
  }
</script>
```

**TypeScript Integration:**
```typescript
// Hook for accessing Pattern 2B enhanced data
export const useEnhancedData = () => {
  const data = useMemo(() => {
    if (!window.enhancedApplicationData) {
      logger.warn('PATTERN 2B: Enhanced data not available', {
        pattern: '2B',
        dataSource: 'not-available'
      });
      return null;
    }
    
    logger.info('PATTERN 2B: Using enhanced server-processed data', {
      pattern: '2B',
      dataSource: 'g-evaluate-server-processing',
      generatedAt: window.enhancedApplicationData.generatedAt,
      analytics: window.enhancedApplicationData.analytics
    });
    
    return window.enhancedApplicationData;
  }, []);
  
  return data;
};

// Combined hook that merges Pattern 2A and 2B data
export const useInitialData = () => {
  const userContext = useUserContext();
  const enhancedData = useEnhancedData();
  
  return useMemo(() => {
    const combined = {
      user: userContext,
      analytics: enhancedData?.analytics || {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        availableItems: 0,
        totalItems: 100,
        occupancyRate: 0,
        approvalRate: 0
      },
      recentActivity: enhancedData?.recentActivity || [],
      hasEnhancedData: !!enhancedData,
      dataAge: enhancedData ? new Date().getTime() - new Date(enhancedData.generatedAt).getTime() : null
    };
    
    logger.debug('Combined Pattern 2A+2B data', {
      hasUserContext: !!userContext.userId,
      hasEnhancedData: !!enhancedData,
      dataAge: combined.dataAge
    });
    
    return combined;
  }, [userContext, enhancedData]);
};
```

### **Pattern 2C: Dynamic Data (TanStack Query API Calls)**

This pattern handles dynamic, frequently-changing data through optimized API calls with caching and error handling.

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
        cacheKey: ['requests', filters],
        dataSource: 'tanstack-query-api'
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
    
    // Advanced cache invalidation based on data importance
    refetchInterval: (data, query) => {
      // More frequent updates for critical data
      if (filters.status === 'pending') return 30 * 1000; // 30 seconds
      if (filters.priority === 'urgent') return 60 * 1000; // 1 minute
      return 5 * 60 * 1000; // 5 minutes default
    }
  });
};

// Real-time data hook that combines all patterns
export const useRealTimeData = (filters: RequestFilters = {}) => {
  const initialData = useInitialData(); // Pattern 2A + 2B
  const dynamicData = useRequests(filters); // Pattern 2C
  
  return useMemo(() => {
    const result = {
      // Immediate data (always available)
      user: initialData.user,
      analytics: initialData.analytics,
      
      // Dynamic data (may be loading)
      requests: dynamicData.data || [],
      isLoadingRequests: dynamicData.isLoading,
      requestsError: dynamicData.error,
      
      // Combined state
      isLoading: dynamicData.isLoading && !initialData.hasEnhancedData,
      hasImmediateData: !!initialData.user.userId,
      hasEnhancedData: initialData.hasEnhancedData,
      hasDynamicData: !!dynamicData.data,
      
      // Data freshness indicators
      enhancedDataAge: initialData.dataAge,
      dynamicDataUpdatedAt: dynamicData.dataUpdatedAt,
      
      // Pattern tracking for debugging
      patterns: {
        '2A': !!initialData.user.userId,
        '2B': initialData.hasEnhancedData,
        '2C': !!dynamicData.data
      }
    };
    
    logger.debug('Real-time data combined', {
      patterns: result.patterns,
      isLoading: result.isLoading,
      requestCount: result.requests.length
    });
    
    return result;
  }, [initialData, dynamicData]);
};
```

### **Smart Data Loading Strategy**

```typescript
// Smart hybrid data component that eliminates loading states where possible
export const SmartDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const initialData = useInitialData();
  const [isEnhanced, setIsEnhanced] = useState(false);
  
  useEffect(() => {
    // Check if we have enhanced data to eliminate loading states
    if (initialData.hasEnhancedData) {
      setIsEnhanced(true);
      logger.info('Smart data provider: Enhanced mode activated', {
        hasPatternA: !!initialData.user.userId,
        hasPatternB: initialData.hasEnhancedData,
        analyticsAvailable: !!initialData.analytics.totalRequests
      });
    }
  }, [initialData]);
  
  // Provide loading fallback only when we don't have Pattern 2B data
  if (!isEnhanced && !initialData.hasEnhancedData) {
    return (
      <Container py="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Initializing application...</Text>
          <Text size="sm" c="dimmed">
            Pattern 2A: {initialData.user.userId ? '✅' : '⏳'} User Context
          </Text>
          <Text size="sm" c="dimmed">
            Pattern 2B: {initialData.hasEnhancedData ? '✅' : '⏳'} Enhanced Data
          </Text>
        </Stack>
      </Container>
    );
  }
  
  return <>{children}</>;
};
```

### **Pattern Performance Monitoring**

```typescript
// Monitor and report on hybrid data pattern performance
export const usePatternPerformance = () => {
  const [metrics, setMetrics] = useState<PatternMetrics>({
    pattern2A: { available: false, loadTime: 0 },
    pattern2B: { available: false, loadTime: 0 },
    pattern2C: { available: false, loadTime: 0 }
  });
  
  useEffect(() => {
    const startTime = performance.now();
    
    // Check Pattern 2A availability
    const pattern2ATime = window.snUserContext ? performance.now() - startTime : -1;
    
    // Check Pattern 2B availability  
    const pattern2BTime = window.enhancedApplicationData ? performance.now() - startTime : -1;
    
    setMetrics({
      pattern2A: { 
        available: !!window.snUserContext, 
        loadTime: pattern2ATime 
      },
      pattern2B: { 
        available: !!window.enhancedApplicationData, 
        loadTime: pattern2BTime 
      },
      pattern2C: { 
        available: true, // Always available via TanStack Query
        loadTime: 0 // Measured separately by TanStack Query
      }
    });
    
    // Log performance metrics
    logger.info('Hybrid data pattern performance', {
      pattern2A: metrics.pattern2A,
      pattern2B: metrics.pattern2B,
      totalInitTime: performance.now() - startTime
    });
  }, []);
  
  return metrics;
};
```

### **Error Boundaries for Pattern Failures**

```typescript
// Specialized error boundary for data pattern failures
export const HybridDataErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => {
        const patternStatus = {
          pattern2A: !!window.snUserContext,
          pattern2B: !!window.enhancedApplicationData,
          pattern2C: 'unknown'
        };
        
        return (
          <Container size="sm" py="xl">
            <Alert color="red" title="Data Loading Error" icon={<IconAlertCircle size={16} />}>
              <Text mb="md">
                There was an error loading application data. Here's what we know:
              </Text>
              
              <Stack gap="xs" mb="md">
                <Group gap="xs">
                  <Text size="sm">Pattern 2A (User Context):</Text>
                  <Badge color={patternStatus.pattern2A ? 'green' : 'red'}>
                    {patternStatus.pattern2A ? 'Available' : 'Failed'}
                  </Badge>
                </Group>
                
                <Group gap="xs">
                  <Text size="sm">Pattern 2B (Enhanced Data):</Text>
                  <Badge color={patternStatus.pattern2B ? 'green' : 'red'}>
                    {patternStatus.pattern2B ? 'Available' : 'Failed'}
                  </Badge>
                </Group>
                
                <Group gap="xs">
                  <Text size="sm">Pattern 2C (Dynamic Data):</Text>
                  <Badge color="yellow">Loading...</Badge>
                </Group>
              </Stack>
              
              <Group gap="sm">
                <Button onClick={resetErrorBoundary} leftSection={<IconRefresh size={16} />}>
                  Retry
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Reload Page
                </Button>
              </Group>
            </Alert>
          </Container>
        );
      }}
      onError={(error, errorInfo) => {
        logger.error('Hybrid data pattern error', error, {
          errorInfo,
          patternStatus: {
            pattern2A: !!window.snUserContext,
            pattern2B: !!window.enhancedApplicationData
          }
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### **Benefits of Hybrid Data Architecture**

✅ **Zero Loading States** - Pattern 2A provides immediate user context  
✅ **Server-Side Optimization** - Pattern 2B pre-calculates complex data
✅ **Dynamic Updates** - Pattern 2C handles real-time data changes
✅ **Performance Monitoring** - Track pattern availability and performance
✅ **Error Resilience** - Graceful degradation when patterns fail
✅ **TypeScript Integration** - Full type safety across all data patterns
✅ **Development Experience** - Debug information and pattern visibility
✅ **ServiceNow Optimization** - Leverages platform capabilities effectively

### **Implementation Checklist**

- [ ] **Pattern 2A**: User context injected via Jelly template in UI Page
- [ ] **Pattern 2B**: Enhanced data calculated with `<g:evaluate>` server processing  
- [ ] **Pattern 2C**: Dynamic data handled by TanStack Query with caching
- [ ] **TypeScript Hooks**: Implemented for each pattern with proper typing
- [ ] **Error Handling**: Boundaries and fallbacks for pattern failures
- [ ] **Performance Monitoring**: Metrics tracking for pattern availability
- [ ] **Debug Support**: Console logging when `sn_debug=true` URL parameter
- [ ] **Smart Loading**: Eliminate loading states where Pattern 2B data available

[← Back to Main Advice](../Advice.md)