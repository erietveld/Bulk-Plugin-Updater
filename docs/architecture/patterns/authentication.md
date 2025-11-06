---
title: "Authentication Patterns for ServiceNow"
version: "2025.1.0"
introduced: "2024.4.0"
purpose: "Secure authentication patterns and ServiceNow integration best practices"
readTime: "4 minutes"
complexity: "intermediate"
status: "ACTIVE"
criticality: "MANDATORY"
prerequisites: ["core-principles", "custom-hooks"]
tags: ["authentication", "security", "servicenow", "g_ck", "token"]
breaking-changes: ["Enhanced security patterns required for all ServiceNow integrations"]
---

# Authentication Patterns for ServiceNow

**Purpose:** Secure authentication patterns and ServiceNow integration best practices  
**Read time:** ~4 minutes  
**Prerequisites:** [Core Principles](../core-principles.md), [Custom Hooks](custom-hooks.md)

---

## ⚠️ CRITICAL: g_ck Token Security Pattern

**DO NOT REMOVE** - This pattern is essential for safe ServiceNow authentication in React components.

### **Core Authentication Hook**
```tsx
interface UseServiceNowAuthReturn {
  userToken: string | null;
  tokenReady: boolean;
  tokenError: string | null;
  isAuthenticated: boolean;
}

function useServiceNowAuth(): UseServiceNowAuthReturn {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    const initializeToken = () => {
      try {
        // CRITICAL: Only access window.g_ck after component mount
        if (typeof window !== 'undefined') {
          if (window.g_ck) {
            setUserToken(window.g_ck);
            setTokenError(null);
          } else {
            setTokenError('ServiceNow user token (g_ck) not found');
          }
        } else {
          setTokenError('Not running in browser environment');
        }
      } catch (error) {
        setTokenError(`Token initialization error: ${error.message}`);
      } finally {
        setTokenReady(true);
      }
    };

    // Handle both client-side and SSR scenarios
    if (typeof window !== 'undefined') {
      initializeToken();
    } else {
      setTimeout(initializeToken, 100);
    }
  }, []);

  return {
    userToken,
    tokenReady,
    tokenError,
    isAuthenticated: !!userToken && tokenReady && !tokenError
  };
}
```

### **Why This Pattern Is Essential**

1. **Prevents SSR Errors**: `window.g_ck` only exists in browser, not during server-side rendering
2. **Handles Browser Safety**: `typeof window !== 'undefined'` prevents crashes
3. **Manages Authentication State**: Proper React state management for token lifecycle
4. **Provides Error Recovery**: Graceful handling when authentication fails
5. **Ensures Service Integration**: Token must be passed to ServiceNow services

### **Security Requirements Checklist**

- ✅ **MUST** check `typeof window !== 'undefined'` before accessing window
- ✅ **MUST** access `window.g_ck` only inside `useEffect` after mount
- ✅ **MUST** handle undefined `window.g_ck` gracefully
- ✅ **MUST** store token in React state for component lifecycle
- ✅ **MUST** validate `tokenReady` before allowing operations
- ✅ **MUST** show authentication errors to prevent silent failures

---

## Secure ServiceNow Service Hook

### **Authenticated API Service Hook**
```tsx
interface ServiceNowService {
  baseUrl: string;
  headers: Record<string, string>;
  list: (params?: Record<string, any>) => Promise<any[]>;
  get: (sysId: string) => Promise<any>;
  create: (data: Record<string, any>) => Promise<any>;
  update: (sysId: string, data: Record<string, any>) => Promise<any>;
  delete: (sysId: string) => Promise<boolean>;
}

interface UseSecureServiceNowServiceReturn {
  service: ServiceNowService | null;
  tokenReady: boolean;
  tokenError: string | null;
  isAuthenticated: boolean;
}

function useSecureServiceNowService(tableName: string): UseSecureServiceNowServiceReturn {
  const { userToken, tokenReady, tokenError } = useServiceNowAuth();

  const service = useMemo(() => {
    if (!userToken || !tokenReady) return null;
    
    return {
      baseUrl: `/api/now/table/${tableName}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserToken': userToken  // Secure token from state
      },
      
      async list(params: Record<string, any> = {}) {
        const query = new URLSearchParams({
          sysparm_display_value: 'all',  // MANDATORY for readable values
          sysparm_limit: '100',
          ...params
        });
        
        const response = await fetch(`${this.baseUrl}?${query}`, {
          headers: this.headers
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Request failed');
        }
        
        const data = await response.json();
        return data.result || [];
      },

      async get(sysId: string) {
        const response = await fetch(`${this.baseUrl}/${sysId}?sysparm_display_value=all`, {
          headers: this.headers
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Get failed');
        }
        
        const data = await response.json();
        return data.result;
      },

      async create(data: Record<string, any>) {
        const response = await fetch(`${this.baseUrl}?sysparm_display_value=all`, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Create failed');
        }
        
        return response.json();
      },

      async update(sysId: string, data: Record<string, any>) {
        const response = await fetch(`${this.baseUrl}/${sysId}?sysparm_display_value=all`, {
          method: 'PATCH',
          headers: this.headers,
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || 'Update failed');
        }
        
        return response.json();
      },

      async delete(sysId: string) {
        const response = await fetch(`${this.baseUrl}/${sysId}`, {
          method: 'DELETE',
          headers: this.headers
        });
        
        return response.ok;
      }
    };
  }, [tableName, userToken, tokenReady]);

  return {
    service,
    tokenReady,
    tokenError,
    isAuthenticated: tokenReady && !!userToken && !tokenError
  };
}
```

---

## Authentication Guard Components

### **Route Protection**
```tsx
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

function AuthGuard({ children, fallback, redirectTo }: AuthGuardProps) {
  const { isAuthenticated, tokenReady, tokenError } = useServiceNowAuth();

  // Show loading while checking authentication
  if (!tokenReady) {
    return (
      <div className="auth-guard__loading">
        <LoadingSpinner message="Initializing authentication..." />
      </div>
    );
  }

  // Show error if authentication failed
  if (tokenError) {
    return (
      <div className="auth-guard__error">
        <ErrorMessage 
          message={tokenError}
          title="Authentication Error"
          actions={
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          }
        />
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated && redirectTo) {
    window.location.href = redirectTo;
    return null;
  }

  // Show fallback if not authenticated
  if (!isAuthenticated) {
    return fallback || (
      <div className="auth-guard__unauthorized">
        <h2>Authentication Required</h2>
        <p>Please log in to access this page.</p>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

// Usage
function App() {
  return (
    <AuthGuard>
      <IncidentManagementApp />
    </AuthGuard>
  );
}
```

---

## Common Anti-Patterns to Avoid

### **❌ Don't Do This:**
```tsx
// BAD: Direct window access without safety checks
function BadComponent() {
  const token = window.g_ck; // Crashes during SSR
  return <div>Token: {token}</div>;
}

// BAD: Removing authentication logic
function SimplifiedComponent() {
  // "Cleaned up" by removing "complex" auth code
  const data = fetch('/api/incidents'); // Unauthenticated request
  return <div>{data}</div>;
}

// BAD: Inline token access
function InlineTokenComponent() {
  return (
    <div>
      {window.g_ck && <IncidentList />} {/* Unsafe */}
    </div>
  );
}
```

### **✅ Do This Instead:**
```tsx
// GOOD: Safe, reusable authentication patterns
function GoodComponent() {
  const { isAuthenticated, tokenReady } = useServiceNowAuth();
  
  if (!tokenReady) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPrompt />;
  
  return <IncidentList />;
}
```

---

*Security is not optional. Always preserve authentication patterns and never expose ServiceNow APIs without proper token validation.*