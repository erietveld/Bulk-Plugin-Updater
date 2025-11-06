---
title: "Error Boundaries for ServiceNow Applications"
version: "2025.1.0"
introduced: "2024.4.0"
purpose: "Comprehensive error handling patterns for resilient React applications"
readTime: "4 minutes"
complexity: "intermediate"
status: "ACTIVE"
criticality: "RECOMMENDED"
prerequisites: ["component-reusability"]
tags: ["error-handling", "resilience", "boundaries", "servicenow"]
---

# Error Boundaries for ServiceNow Applications

**Purpose:** Comprehensive error handling patterns for resilient React applications  
**Read time:** ~4 minutes  
**Prerequisites:** [Component Reusability](../component-reusability.md)

---

## Why Error Boundaries Matter

Error boundaries prevent a single component error from crashing your entire ServiceNow application. They're especially important for:

- **ServiceNow API integrations** - Network failures, authentication issues
- **Dynamic data rendering** - Malformed or unexpected data structures  
- **Complex forms** - Validation errors and submission failures
- **Third-party integrations** - External service failures

---

## Base Error Boundary Implementation

```tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log to console in development
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Custom error handler
    this.props.onError?.(error, errorInfo);
    
    // Production error reporting
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToServiceNow(error, errorInfo);
    }
  }

  logErrorToServiceNow = async (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: getCurrentUser()?.sys_id
      };
      
      await fetch('/api/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      });
    } catch (logError) {
      console.error('Failed to log error to ServiceNow:', logError);
    }
  };

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}
```

---

## ServiceNow-Specific Error Fallbacks

### **Generic ServiceNow Error Fallback**
```tsx
interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
}

function ServiceNowErrorFallback({ error, retry }: ErrorFallbackProps) {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network');
  const isAuthError = error.message.includes('authentication') || error.message.includes('401');
  const isPermissionError = error.message.includes('403') || error.message.includes('permission');

  const getErrorConfig = () => {
    if (isNetworkError) {
      return {
        icon: '🌐',
        title: 'Connection Problem',
        message: 'Unable to connect to ServiceNow. Please check your connection.',
        action: 'Retry Connection'
      };
    }
    
    if (isAuthError) {
      return {
        icon: '🔒',
        title: 'Authentication Required',
        message: 'Your session may have expired. Please refresh to log in again.',
        action: 'Refresh & Login'
      };
    }
    
    if (isPermissionError) {
      return {
        icon: '🚫',
        title: 'Access Denied',
        message: 'You don\'t have permission to perform this action.',
        action: 'Contact Administrator'
      };
    }
    
    return {
      icon: '⚠️',
      title: 'ServiceNow Error',
      message: 'An unexpected error occurred while processing your request.',
      action: 'Try Again'
    };
  };

  const config = getErrorConfig();

  return (
    <div className="servicenow-error-fallback">
      <div className="error-icon">{config.icon}</div>
      <h2 className="error-title">{config.title}</h2>
      <p className="error-message">{config.message}</p>
      
      <div className="error-actions">
        <Button 
          variant="primary" 
          onClick={isAuthError ? () => window.location.reload() : retry}
        >
          {config.action}
        </Button>
        
        {!isPermissionError && (
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        )}
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="error-details">
          <summary>Error Details (Dev Only)</summary>
          <pre>{error.message}</pre>
        </details>
      )}
    </div>
  );
}
```

### **Feature-Specific Error Fallbacks**
```tsx
// For incident management features
function IncidentErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="feature-error-fallback">
      <h3>Incident Management Unavailable</h3>
      <p>We're having trouble loading incident data. You can:</p>
      <ul>
        <li>Try refreshing the incident list</li>
        <li>Check your ServiceNow permissions</li>
        <li>Contact your system administrator</li>
      </ul>
      <Button variant="primary" onClick={retry}>
        Retry Loading Incidents
      </Button>
    </div>
  );
}

// For form components
function FormErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="form-error-fallback">
      <h3>Form Error</h3>
      <p>Something went wrong with the form. Your data has been preserved.</p>
      <Button variant="primary" onClick={retry}>
        Restore Form
      </Button>
      <Button variant="secondary" onClick={() => window.location.reload()}>
        Refresh Page
      </Button>
    </div>
  );
}
```

---

## Strategic Error Boundary Placement

### **Application Level**
```tsx
function ServiceNowApp() {
  return (
    <ErrorBoundary 
      fallback={ServiceNowErrorFallback}
      onError={(error, errorInfo) => {
        // Log critical application errors
        logCriticalError('APP_ERROR', error, errorInfo);
      }}
    >
      <Router>
        <AppHeader />
        <AppContent />
        <AppFooter />
      </Router>
    </ErrorBoundary>
  );
}
```

### **Page Level**
```tsx
function IncidentManagementPage() {
  return (
    <DashboardLayout>
      <ErrorBoundary fallback={IncidentErrorFallback}>
        <IncidentDashboard />
      </ErrorBoundary>
    </DashboardLayout>
  );
}
```

### **Feature Level**
```tsx
function IncidentDashboard() {
  return (
    <div className="incident-dashboard">
      <ErrorBoundary fallback={ComponentErrorFallback}>
        <IncidentFilters onFilterChange={handleFilterChange} />
      </ErrorBoundary>
      
      <ErrorBoundary fallback={ComponentErrorFallback}>
        <IncidentList incidents={incidents} loading={loading} />
      </ErrorBoundary>
      
      <ErrorBoundary fallback={FormErrorFallback}>
        <IncidentCreateModal isOpen={isCreateOpen} />
      </ErrorBoundary>
    </div>
  );
}
```

### **ServiceNow Integration Level**
```tsx
function ServiceNowDataProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary 
      fallback={ServiceNowConnectionError}
      onError={(error, errorInfo) => {
        // Log ServiceNow-specific errors
        logServiceNowError(error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

---

## Best Practices

### **Do ✅**
- Place error boundaries at strategic levels (app, page, feature)
- Provide specific fallback UIs for different error types
- Log errors to monitoring services in production
- Include retry mechanisms for recoverable errors
- Test error boundaries with intentional errors
- Preserve user data when possible during errors

### **Don't ❌**
- Wrap every single component with error boundaries
- Show technical error messages to end users
- Ignore error boundaries in component testing
- Forget to handle async errors in event handlers
- Skip error logging in production
- Make error fallbacks inaccessible or unusable

---

*Error boundaries are your safety net. Use them strategically to create resilient ServiceNow applications that gracefully handle failures.*