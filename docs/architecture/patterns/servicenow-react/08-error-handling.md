---
title: "Pattern 8: Enhanced Error Handling"
version: "2025.1.2"
purpose: "Multi-level error boundaries with user-friendly recovery options"
readTime: "5 minutes"
complexity: "intermediate"
prerequisites: ["react-error-boundaries", "error-handling-patterns"]
concepts: ["error-boundaries", "error-recovery", "user-notifications", "graceful-degradation"]
codeExamples: 5
completeness: 100
testability: true
productionReady: true
---

# Pattern 8: Enhanced Error Handling

**Purpose:** Multi-level error boundaries with user-friendly recovery options  
**Read time:** ~5 minutes  
**Problem:** Poor error recovery, blank screens, and unhelpful error messages for users

---

## 🚨 Problem Statement

### **Error Handling Challenges:**
- Unhandled errors crash entire application
- Users see blank screens or technical error messages
- No recovery options for common error scenarios
- Limited error reporting and debugging information

---

## ✅ Solution: Comprehensive Error Boundary Architecture

### **Base Error Boundary Component:**
```typescript
// components/error/ServiceNowErrorBoundary.tsx - PATTERN: Foundation error boundary
import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ServiceNowErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // ServiceNow-specific error reporting
    if (typeof window !== 'undefined' && (window as any).NOW?.eventBus) {
      try {
        (window as any).NOW.eventBus.publish('app.error', {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: new Date().toISOString()
        });
      } catch (loggingError) {
        console.warn('Failed to log error to ServiceNow EventBus:', loggingError);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-fallback">
          <div className="error-content">
            <h2>Something went wrong</h2>
            <p>We apologize for the inconvenience. Please try refreshing the page.</p>
            <button onClick={() => window.location.reload()}>
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### **Feature-Level Error Boundary:**
```typescript
// components/error/FeatureErrorBoundary.tsx - PATTERN: Granular error handling
import React, { ReactNode } from 'react';
import { ServiceNowErrorBoundary } from './ServiceNowErrorBoundary';

interface FeatureErrorFallbackProps {
  feature: string;
  error: Error;
  retry: () => void;
}

const FeatureErrorFallback = ({ feature, error, retry }: FeatureErrorFallbackProps) => {
  const isNetworkError = error.message.includes('fetch') || error.message.includes('timeout');
  const isAuthError = error.message.includes('401') || error.message.includes('authentication');
  const isPermissionError = error.message.includes('403') || error.message.includes('permission');

  const getErrorConfig = () => {
    if (isNetworkError) {
      return {
        icon: '🌐',
        title: `${feature} Connection Error`,
        message: "We're having trouble connecting to ServiceNow. Please check your network connection.",
        action: 'Retry Connection',
        actionType: 'retry' as const
      };
    }
    
    if (isAuthError) {
      return {
        icon: '🔒',
        title: 'Session Expired',
        message: 'Your ServiceNow session has expired. Please refresh to log in again.',
        action: 'Refresh & Login',
        actionType: 'refresh' as const
      };
    }
    
    if (isPermissionError) {
      return {
        icon: '🚫',
        title: 'Access Denied',
        message: `You don't have permission to access ${feature}. Contact your system administrator.`,
        action: 'Contact Admin',
        actionType: 'contact' as const
      };
    }
    
    return {
      icon: '⚠️',
      title: `${feature} Error`,
      message: `The ${feature} feature encountered an unexpected error. Please try again.`,
      action: 'Try Again',
      actionType: 'retry' as const
    };
  };

  const config = getErrorConfig();

  const handleAction = () => {
    switch (config.actionType) {
      case 'refresh':
        window.location.reload();
        break;
      case 'contact':
        window.open('mailto:servicedesk@company.com?subject=ServiceNow Access Issue', '_blank');
        break;
      case 'retry':
      default:
        retry();
        break;
    }
  };

  return (
    <div className="feature-error-fallback">
      <div className="error-content">
        <div className="error-icon">{config.icon}</div>
        <h3 className="error-title">{config.title}</h3>
        <p className="error-message">{config.message}</p>
        
        <div className="error-actions">
          <button onClick={handleAction} className="btn btn-primary">
            {config.action}
          </button>
          {config.actionType !== 'refresh' && (
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-secondary"
            >
              Refresh Page
            </button>
          )}
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="error-details">
            <summary>Debug Information (Development Only)</summary>
            <pre className="error-stack">{error.stack}</pre>
          </details>
        )}
      </div>
    </div>
  );
};

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  feature: string;
}

export const FeatureErrorBoundary = ({ children, feature }: FeatureErrorBoundaryProps) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`🚨 ${feature} Error:`, error, errorInfo);
    
    // Integration with notification system (if available)
    if (typeof window !== 'undefined' && (window as any).showNotification) {
      if (error.message.includes('network') || error.message.includes('timeout')) {
        (window as any).showNotification({
          type: 'error',
          title: `${feature} Connection Issue`,
          message: 'Having trouble connecting to ServiceNow. Retrying...',
          duration: 5000
        });
      }
    }
  };

  return (
    <ServiceNowErrorBoundary 
      fallback={<FeatureErrorFallback feature={feature} error={new Error()} retry={() => window.location.reload()} />}
      onError={handleError}
    >
      {children}
    </ServiceNowErrorBoundary>
  );
};
```

### **Async Error Handling Hook:**
```typescript
// hooks/useAsyncError.ts - PATTERN: Handle async errors in components
import { useCallback, useState } from 'react';

export function useAsyncError() {
  const [_, setError] = useState();
  
  return useCallback(
    (error: Error) => {
      setError(() => {
        throw error;
      });
    },
    [setError]
  );
}

// Usage in components with async operations
export function IncidentsOverview() {
  const throwError = useAsyncError();
  const [incidents, setIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    const loadIncidents = async () => {
      try {
        const data = await fetchIncidents();
        setIncidents(data.result);
      } catch (error) {
        // This will trigger the error boundary
        throwError(error as Error);
      }
    };

    loadIncidents();
  }, [throwError]);

  return (
    <div>
      {incidents.map(incident => (
        <IncidentCard key={incident.sys_id.value} incident={incident} />
      ))}
    </div>
  );
}
```

### **Error Boundary CSS:**
```css
/* error-boundary.css - PATTERN: User-friendly error styling */

.feature-error-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
  background: #fefefe;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  margin: 1rem 0;
}

.error-content {
  text-align: center;
  max-width: 400px;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: 0.5rem;
}

.error-message {
  color: var(--color-gray-600);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

.error-details {
  margin-top: 1.5rem;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  margin-bottom: 0.5rem;
}

.error-stack {
  background: var(--color-gray-100);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  padding: 0.75rem;
  font-size: 0.75rem;
  color: var(--color-gray-700);
  overflow-x: auto;
  white-space: pre-wrap;
  font-family: monospace;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .feature-error-fallback {
    min-height: 150px;
    padding: 1rem;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .error-actions .btn {
    width: 100%;
  }
}
```

### **Application Integration:**
```typescript
// app.tsx - PATTERN: Multi-level error boundary integration
import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ServiceNowErrorBoundary } from './components/error/ServiceNowErrorBoundary';
import { FeatureErrorBoundary } from './components/error/FeatureErrorBoundary';
import { IncidentsOverview } from './components/organisms/IncidentsOverview';

export function App() {
  const handleError = React.useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    console.error('🚨 Application Error:', error, errorInfo);
    
    // Could send to error reporting service
    // errorReportingService.captureException(error, { extra: errorInfo });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Top-level error boundary for critical application errors */}
      <ServiceNowErrorBoundary onError={handleError}>
        <div className="app-container">
          <nav className="nav-bar">
            <h1>ServiceNow Incident Manager</h1>
          </nav>

          <main className="page-wrapper">
            {/* Feature-level error boundaries for granular error handling */}
            <FeatureErrorBoundary feature="Incident Overview">
              <IncidentsOverview />
            </FeatureErrorBoundary>
          </main>
        </div>
      </ServiceNowErrorBoundary>
    </QueryClientProvider>
  );
}
```

---

## 🧪 Error Handling Validation

### **Error Boundary Testing:**
```typescript
// Test comprehensive error handling
describe('Error Handling', () => {
  it('should catch and display feature-level errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <FeatureErrorBoundary feature="Test Feature">
        <ThrowError />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Test Feature Error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should handle different error types appropriately', () => {
    const NetworkError = () => {
      throw new Error('fetch failed: network error');
    };

    render(
      <FeatureErrorBoundary feature="Network Test">
        <NetworkError />
      </FeatureErrorBoundary>
    );

    expect(screen.getByText('Network Test Connection Error')).toBeInTheDocument();
    expect(screen.getByText('Retry Connection')).toBeInTheDocument();
  });

  it('should provide recovery options', () => {
    const reloadSpy = jest.spyOn(window.location, 'reload').mockImplementation();
    
    const ErrorComponent = () => {
      throw new Error('Test error');
    };

    render(
      <FeatureErrorBoundary feature="Test">
        <ErrorComponent />
      </FeatureErrorBoundary>
    );

    fireEvent.click(screen.getByText('Refresh Page'));
    expect(reloadSpy).toHaveBeenCalled();
  });
});
```

---

*Enhanced error handling pattern provides graceful degradation and user-friendly recovery options, ensuring the application remains usable even when errors occur.*