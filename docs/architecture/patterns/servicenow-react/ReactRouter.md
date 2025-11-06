# React Router v7 - Advanced Routing Patterns

## **Routing Layer with React Router v7**

Use **React Router v7** for client-side routing, fully compatible with React 19's concurrency features.

**🚨 CRITICAL: ServiceNow requires hash-based routing (`createHashRouter`) due to platform constraints. Browser routing will not work properly in ServiceNow UI Pages.**

### **Hash Router Configuration**

```typescript
import { createHashRouter, RouterProvider } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';

// CRITICAL: Use createHashRouter for ServiceNow compatibility
const router = createHashRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/dashboard",
    element: <ApplicationDashboard />,
  },
  {
    path: "/request",
    element: <RequestForm />,
  },
  {
    path: "/request/:id",
    element: <RequestDetail />,
  },
  {
    path: "/request/:id/edit",
    element: <RequestForm mode="edit" />,
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

// Root App component with hash router
const App: React.FC = () => {
  return (
    <MantineProvider theme={enterpriseTheme}>
      <ModalsProvider>
        <Notifications />
        <RouterProvider router={router} />
      </ModalsProvider>
    </MantineProvider>
  );
};
```

### **Enhanced Route Loading Components**

```typescript
// Loading component for route transitions
const RouteLoading: React.FC = () => {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="md">
        <Loader size="md" />
        <Text c="dimmed" size="sm">Loading page...</Text>
      </Stack>
    </Container>
  );
};

// App-level loading for initial application load
const AppLoading: React.FC = () => {
  return (
    <Container size="sm" py="xl">
      <Stack align="center" gap="md">
        <Loader size="lg" />
        <Text c="dimmed">Initializing application...</Text>
        <Text size="sm" c="dimmed">
          Pattern 2A: {window.snUserContext ? '✅' : '⏳'} User Context
        </Text>
        <Text size="sm" c="dimmed">
          Pattern 2B: {window.enhancedApplicationData ? '✅' : '⏳'} Enhanced Data
        </Text>
      </Stack>
    </Container>
  );
};
```

### **Advanced Route Protection**

```typescript
// Protected route component with user context integration
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'user';
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'user',
  fallback 
}) => {
  const userContext = useUserContext();
  const permissions = useUserPermissions();
  const navigate = useNavigate();
  
  const hasAccess = useMemo(() => {
    switch (requiredRole) {
      case 'admin':
        return permissions.isAdmin;
      case 'manager':
        return permissions.isManager || permissions.isAdmin;
      case 'user':
      default:
        return permissions.isUser || permissions.isManager || permissions.isAdmin;
    }
  }, [permissions, requiredRole]);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <Container size="sm" py="xl">
        <Alert 
          color="red" 
          title="Access Denied" 
          icon={<IconLock size={16} />}
        >
          <Text mb="md">
            You don't have permission to access this page.
          </Text>
          <Button 
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
};
```

### **Enhanced Route Configuration with Lazy Loading**

```typescript
// Lazy loaded route components with error boundaries
const LazyDashboard = lazy(() => 
  import('../client/components/ApplicationDashboard').catch(() => ({
    default: () => <ErrorFallback message="Failed to load Dashboard" />
  }))
);

const LazyRequestForm = lazy(() => 
  import('../client/components/RequestForm').catch(() => ({
    default: () => <ErrorFallback message="Failed to load Request Form" />
  }))
);

const LazyRequestDetail = lazy(() => 
  import('../client/components/RequestDetail').catch(() => ({
    default: () => <ErrorFallback message="Failed to load Request Detail" />
  }))
);

// Enhanced hash router with lazy loading and error handling
const createEnhancedHashRouter = () => createHashRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/dashboard",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <LazyDashboard />
      </Suspense>
    ),
  },
  {
    path: "/request",
    element: (
      <ProtectedRoute requiredRole="user">
        <Suspense fallback={<RouteLoading />}>
          <LazyRequestForm />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/request/:id",
    element: (
      <Suspense fallback={<RouteLoading />}>
        <LazyRequestDetail />
      </Suspense>
    ),
  },
  {
    path: "/request/:id/edit",
    element: (
      <ProtectedRoute requiredRole="user">
        <Suspense fallback={<RouteLoading />}>
          <LazyRequestForm mode="edit" />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/*",
    element: (
      <ProtectedRoute requiredRole="admin">
        <AdminRoutes />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

// Main App component
const App: React.FC = () => {
  const router = useMemo(() => createEnhancedHashRouter(), []);
  
  return (
    <EnhancedErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={enterpriseTheme}>
          <ModalsProvider>
            <Notifications />
            <RouterProvider router={router} />
          </ModalsProvider>
        </MantineProvider>
      </QueryClientProvider>
    </EnhancedErrorBoundary>
  );
};
```

### **Navigation Hook with Analytics**

```typescript
// Enhanced navigation hook with user tracking
export const useEnhancedNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userContext = useUserContext();

  const navigateWithTracking = useCallback((
    path: string, 
    options?: { 
      replace?: boolean; 
      state?: any; 
      trackingData?: Record<string, any> 
    }
  ) => {
    try {
      // Track navigation event
      logger.trackUserAction('navigation', {
        from: location.pathname,
        to: path,
        userId: userContext.userId,
        timestamp: new Date().toISOString(),
        routingMode: 'hash', // ServiceNow uses hash routing
        ...options?.trackingData
      });

      navigate(path, {
        replace: options?.replace,
        state: options?.state
      });
    } catch (error) {
      logger.error('Navigation error', error, {
        path,
        currentLocation: location.pathname,
        userId: userContext.userId
      });
      
      // Fallback navigation using hash routing
      window.location.hash = `#${path}`;
    }
  }, [navigate, location, userContext]);

  const goBack = useCallback(() => {
    try {
      logger.trackUserAction('navigation-back', {
        from: location.pathname,
        userId: userContext.userId
      });
      
      navigate(-1);
    } catch (error) {
      logger.error('Back navigation error', error);
      navigateWithTracking('/dashboard');
    }
  }, [navigate, location, userContext, navigateWithTracking]);

  return {
    navigate: navigateWithTracking,
    goBack,
    currentPath: location.pathname,
    currentSearch: location.search,
    currentState: location.state,
    currentHash: location.hash
  };
};
```

### **Hash Route State Management**

```typescript
// Hash-aware state management with URL synchronization
export const useHashRouteState = <T>(
  key: string, 
  defaultValue: T,
  serialize?: (value: T) => string,
  deserialize?: (value: string) => T
) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const value = useMemo(() => {
    const urlValue = searchParams.get(key);
    if (!urlValue) return defaultValue;
    
    try {
      return deserialize ? deserialize(urlValue) : JSON.parse(urlValue);
    } catch {
      return defaultValue;
    }
  }, [searchParams, key, defaultValue, deserialize]);

  const setValue = useCallback((newValue: T) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (newValue === defaultValue) {
      newParams.delete(key);
    } else {
      const serialized = serialize ? serialize(newValue) : JSON.stringify(newValue);
      newParams.set(key, serialized);
    }
    
    // Update hash-based URL
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams, key, defaultValue, serialize]);

  return [value, setValue] as const;
};

// Usage example in components
const RequestList: React.FC = () => {
  const [filters, setFilters] = useHashRouteState('filters', {
    search: '',
    status: '',
    category: ''
  });
  
  const [currentPage, setCurrentPage] = useHashRouteState('page', 1);
  
  // Filters and page are now synchronized with hash URL
  // Users can bookmark, share, or refresh with state preserved
  // URLs will look like: #/dashboard?filters=%7B%22search%22%3A%22test%22%7D&page=2
};
```

### **ServiceNow Hash Router Utility**

```typescript
// Utility functions for hash-based routing in ServiceNow
export const hashRouterUtils = {
  // Get current hash path
  getCurrentHashPath: (): string => {
    const hash = window.location.hash;
    return hash.startsWith('#') ? hash.substring(1) : hash;
  },

  // Navigate using hash without React Router (for edge cases)
  navigateToHash: (path: string, params?: Record<string, string>) => {
    let url = `#${path}`;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }
    
    logger.debug('Hash navigation', { from: window.location.hash, to: url });
    window.location.hash = url;
  },

  // Check if current route matches pattern
  matchesHashRoute: (pattern: string): boolean => {
    const currentPath = hashRouterUtils.getCurrentHashPath().split('?')[0];
    
    // Simple pattern matching (can be enhanced)
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(currentPath);
    }
    
    return currentPath === pattern;
  },

  // Extract route parameters from hash
  extractHashParams: (pattern: string): Record<string, string> => {
    const currentPath = hashRouterUtils.getCurrentHashPath().split('?')[0];
    const params: Record<string, string> = {};
    
    // Simple parameter extraction (e.g., /request/:id)
    const patternParts = pattern.split('/');
    const pathParts = currentPath.split('/');
    
    patternParts.forEach((part, index) => {
      if (part.startsWith(':') && pathParts[index]) {
        const paramName = part.substring(1);
        params[paramName] = pathParts[index];
      }
    });
    
    return params;
  }
};
```

### **Router Performance Optimization**

```typescript
// Preload critical routes for better performance
const preloadCriticalRoutes = () => {
  // Preload dashboard component (most common landing page)
  import('../client/components/ApplicationDashboard');
  
  // Preload request form (common user action)
  import('../client/components/RequestForm');
};

// Hash router with performance optimizations
export const createOptimizedHashRouter = () => {
  // Initialize preloading after router creation
  setTimeout(preloadCriticalRoutes, 2000);
  
  return createHashRouter([
    // ... routes configuration
  ]);
};

// Performance monitoring for hash routing
export const useHashRouterPerformance = () => {
  const location = useLocation();
  
  useEffect(() => {
    const startTime = performance.now();
    
    // Mark route change start
    performance.mark('route-change-start');
    
    return () => {
      // Mark route change end and measure
      performance.mark('route-change-end');
      performance.measure('route-change', 'route-change-start', 'route-change-end');
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      logger.info('Hash route performance', {
        path: location.pathname,
        hash: location.hash,
        duration: Math.round(duration),
        routingMode: 'hash'
      });
      
      // Alert on slow route changes
      if (duration > 1000) {
        logger.warn('Slow hash route change detected', {
          path: location.pathname,
          duration: Math.round(duration)
        });
      }
    };
  }, [location]);
};
```

### **Error Fallback Component**

```typescript
// Error fallback for failed route loads
const ErrorFallback: React.FC<{ message: string }> = ({ message }) => {
  const navigate = useNavigate();
  
  return (
    <Container size="sm" py="xl">
      <Alert 
        color="red" 
        title="Route Loading Error" 
        icon={<IconAlertCircle size={16} />}
      >
        <Text mb="md">{message}</Text>
        
        <Group gap="sm">
          <Button 
            leftSection={<IconRefresh size={16} />}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </Group>
      </Alert>
    </Container>
  );
};
```

### **Hash Routing Best Practices for ServiceNow**

```typescript
// Best practices configuration for ServiceNow hash routing
export const serviceNowHashRouterConfig = {
  // Always use hash routing in ServiceNow
  routerType: 'hash' as const,
  
  // Handle ServiceNow-specific navigation constraints
  navigationConstraints: {
    // Prevent navigation outside of the application
    preventExternalNavigation: true,
    
    // Handle ServiceNow iframe navigation
    handleIframeNavigation: true,
    
    // Support ServiceNow back button behavior
    handleBackButton: true
  },
  
  // Performance optimizations for ServiceNow
  performance: {
    preloadRoutes: ['dashboard', 'request'],
    lazyLoadNonCritical: true,
    cacheRouteComponents: true
  },
  
  // Error handling specific to ServiceNow environment
  errorHandling: {
    fallbackRoute: '/dashboard',
    logNavigationErrors: true,
    showUserFriendlyErrors: true
  }
};
```

### **Benefits of Hash-Based Routing Patterns**

✅ **ServiceNow Compatibility** - Hash routing works properly within ServiceNow UI Pages
✅ **Enhanced Error Handling** - Graceful fallbacks for route loading failures  
✅ **Performance Optimization** - Lazy loading with strategic preloading
✅ **User Permission Integration** - Route protection with role-based access
✅ **State Synchronization** - URL state management for bookmarkable filters
✅ **Analytics Integration** - Navigation tracking for user insights
✅ **TypeScript Safety** - Full type safety for routes and navigation
✅ **React 19 Compatibility** - Leverages concurrent features and Suspense
✅ **ServiceNow Integration** - User context and permission-aware routing
✅ **Hash URL Support** - Proper handling of ServiceNow's routing constraints

### **Hash Routing Implementation Checklist**

- [ ] **Use `createHashRouter`** instead of `createBrowserRouter`
- [ ] **Test navigation** within ServiceNow UI Page environment
- [ ] **Implement route protection** with user permission checks
- [ ] **Add performance monitoring** for hash route changes
- [ ] **Configure error boundaries** for route loading failures
- [ ] **Setup analytics tracking** for navigation events
- [ ] **Test state synchronization** with hash-based URLs
- [ ] **Verify bookmark functionality** with hash parameters

[← Back to Main Advice](../Advice.md)