---
title: "Implementation Troubleshooting Guide"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Quick solutions for common ServiceNow React development issues"
readTime: "6 minutes"
complexity: "beginner"
criticality: "HIGH"
tags: ["troubleshooting", "servicenow", "react", "errors", "debugging"]
validationStatus: "PRODUCTION_TESTED"
---

# Implementation Troubleshooting Guide

**Purpose:** Quick solutions for common ServiceNow React development issues  
**Read time:** ~6 minutes  
**Use case:** Rapid problem resolution during development and deployment

> **Real-world solutions** from ServiceNow React implementations - tested fixes for common issues.

---

## Build and Deployment Issues

### **Problem: ServiceNow Build Fails**

**Symptoms:**
```bash
Error executing the build command for app xxx:
Could not resolve import "..." from "..."
```

**Solutions:**

```typescript
// ✅ Fix 1: Check import paths are correct
// ❌ Wrong
import { Component } from '../../../types/ServiceNow';
// ✅ Correct
import { Component } from '../../types/ServiceNow';

// ✅ Fix 2: Ensure all imported files exist
import { IncidentService } from '../services/IncidentService'; // File must exist

// ✅ Fix 3: Check file extensions in imports
import { queryClient } from './lib/queryClient'; // .ts/.js extension not needed
```

**Build Configuration Issues:**
```bash
# ✅ Clear build cache
rm -rf dist/ node_modules/.cache
npm run build

# ✅ Verify ServiceNow SDK version
npm ls @servicenow/sdk
# Should be 4.0.2 or higher

# ✅ Check package.json scripts
{
  "scripts": {
    "build": "now-sdk build", // Must be exactly this
    "dev": "now-sdk watch"
  }
}
```

---

### **Problem: UI Page Not Loading**

**Symptoms:**
- Blank page in ServiceNow
- "Page not found" error
- JavaScript errors in browser console

**Solutions:**

```typescript
// ✅ Fix 1: Verify UI Page configuration
// Check docs/architecture/reference/ui-page-configuration.md

// ✅ Fix 2: Ensure HTML structure is correct
// src/client/index.html
<html>
<head>
  <title>Your App</title>
  <sdk:now-ux-globals></sdk:now-ux-globals>
  <script src="main.tsx" type="module"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>

// ✅ Fix 3: Check UI Page Fluent definition
export const my_page = UiPage({
  $id: Now.ID['my-page'],
  endpoint: 'x_scope_app.do',
  html: pageHtml,
  direct: true, // ONLY this property for React apps
  description: 'My React application'
});
```

---

## Import/Export Errors

### **Problem: "Module has no default export"**

**Symptoms:**
```typescript
Module '"/path/to/App"' has no default export.
Did you mean to use 'import { App } from "/path/to/App"' instead?
```

**Solutions:**

```typescript
// ✅ Match export with import style

// Option 1: Named export + Named import
// App.tsx
export function App() { return <div>App</div>; }
// main.tsx
import { App } from './App';

// Option 2: Default export + Default import  
// App.tsx
export default function App() { return <div>App</div>; }
// main.tsx
import App from './App';

// ❌ Don't mix them
// App.tsx - Named export
export function App() { return <div>App</div>; }
// main.tsx - Default import (WRONG)
import App from './App'; // This fails
```

---

## Styling Issues

### **Problem: Styles Not Applying**

**Symptoms:**
- Components render without styling
- CSS classes don't work
- Design system not visible

**Solutions:**

```typescript
// ✅ Fix 1: Verify CSS import in main.tsx
// src/client/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css'; // Must be imported FIRST
import { App } from './App';

// ✅ Fix 2: Check CSS file location
// File must be at: src/client/styles/globals.css

// ✅ Fix 3: Verify CSS content (no Tailwind)
// ❌ Wrong - Tailwind directives don't work
@tailwind base;
@tailwind components;

// ✅ Correct - Plain CSS with variables
:root {
  --color-primary-600: #2563eb;
}
.btn-primary {
  background-color: var(--color-primary-600);
}
```

**CSS Build Issues:**
```bash
# ✅ Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

# ✅ Rebuild and redeploy
npm run build
npm run deploy
```

---

## ServiceNow API Issues

### **Problem: Authentication Errors**

**Symptoms:**
```javascript
Error: No ServiceNow authentication token available
ServiceNow API error: 401
```

**Solutions:**

```typescript
// ✅ Fix 1: Check auth token access
protected getAuthToken(): string {
  const token = (window as any).g_ck;
  console.log('Token available:', !!token); // Debug line
  
  if (!token) {
    throw new ServiceNowError(401, 'AUTH_ERROR', 'No authentication token available');
  }
  return token;
}

// ✅ Fix 2: Verify ServiceNow session
// In browser console, check:
console.log(window.g_ck); // Should show token string
console.log(window.NOW.user); // Should show user object

// ✅ Fix 3: Ensure proper headers
headers: {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-UserToken': this.getAuthToken(), // Correct header name
}
```

---

### **Problem: API Data Not Loading**

**Symptoms:**
- Loading spinner never disappears
- No data returned from ServiceNow
- Network errors in browser

**Solutions:**

```typescript
// ✅ Fix 1: Check API endpoint format
// ❌ Wrong
const response = await fetch('/table/incident'); 
// ✅ Correct  
const response = await fetch('/api/now/table/incident');

// ✅ Fix 2: Verify query parameters
const params = new URLSearchParams({
  sysparm_display_value: 'all', // Important for reference fields
  sysparm_exclude_reference_link: 'true', // Performance optimization
  sysparm_limit: '100'
});

// ✅ Fix 3: Add error logging
try {
  const response = await fetch(url, options);
  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers);
  
  if (!response.ok) {
    console.error('API Error:', response.statusText);
    throw new Error(`API error: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Data received:', data);
  return data;
} catch (error) {
  console.error('Fetch error:', error);
  throw error;
}
```

---

## TanStack Query Issues

### **Problem: Queries Not Updating**

**Symptoms:**
- Data doesn't refresh
- Stale data shown
- Cache not invalidating

**Solutions:**

```typescript
// ✅ Fix 1: Check query key consistency
// All uses of the same data should use identical query keys
const queryKeys = {
  incidents: ['incidents'] as const,
  incident: (id: string) => ['incidents', 'detail', id] as const,
};

// ✅ Fix 2: Invalidate queries after mutations
const assignMutation = useMutation({
  mutationFn: assignIncident,
  onSuccess: () => {
    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
  }
});

// ✅ Fix 3: Check stale time configuration
useQuery({
  queryKey: ['incidents'],
  queryFn: fetchIncidents,
  staleTime: 2 * 60 * 1000, // 2 minutes
  // Data considered fresh for 2 minutes
});
```

---

## Component Rendering Issues

### **Problem: Component Not Rendering**

**Symptoms:**
- Blank screen
- Component missing from UI
- React errors in console

**Solutions:**

```typescript
// ✅ Fix 1: Check component export/import
// Component.tsx
export function MyComponent() {
  return <div>Hello</div>;
}

// App.tsx
import { MyComponent } from './components/MyComponent';

// ✅ Fix 2: Verify JSX syntax
// ❌ Wrong
function MyComponent() {
  return (
    <div>
      <h1>Title</h1>
      <p>Content</p> // Missing closing tag
  );
}

// ✅ Correct
function MyComponent() {
  return (
    <div>
      <h1>Title</h1>
      <p>Content</p>
    </div>
  );
}

// ✅ Fix 3: Check for JavaScript errors
// Add error boundary for debugging
function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = (error) => {
      console.error('Component error:', error);
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return <div>Something went wrong. Check console for details.</div>;
  }
  
  return children;
}
```

---

## Performance Issues

### **Problem: Slow Loading/Poor Performance**

**Symptoms:**
- Page takes long to load
- UI feels sluggish
- Multiple API calls visible in network tab

**Solutions:**

```typescript
// ✅ Fix 1: Optimize API calls
// Use proper field selection
const params = this.buildQueryParams({
  fields: ['sys_id', 'number', 'short_description'], // Only needed fields
  displayValue: 'all'
});

// ✅ Fix 2: Implement proper caching
useQuery({
  queryKey: ['incidents', filters],
  queryFn: () => fetchIncidents(filters),
  staleTime: 5 * 60 * 1000, // Don't refetch for 5 minutes
  gcTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
});

// ✅ Fix 3: Use React.memo for expensive components
const IncidentCard = React.memo(({ incident }) => {
  return (
    <div className="card">
      {/* Component content */}
    </div>
  );
});

// ✅ Fix 4: Implement virtual scrolling for large lists
import { useVirtualizer } from '@tanstack/react-virtual';

function LargeIncidentList({ incidents }) {
  const virtualizer = useVirtualizer({
    count: incidents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map((virtualItem) => (
        <div key={virtualItem.key} style={virtualItem.style}>
          <IncidentCard incident={incidents[virtualItem.index]} />
        </div>
      ))}
    </div>
  );
}
```

---

## Development Workflow Issues

### **Problem: Watch Mode Not Working**

**Symptoms:**
```bash
npm run dev
# No file watching
# Changes not reflected
```

**Solutions:**

```bash
# ✅ Fix 1: Check correct script
# package.json should have:
{
  "scripts": {
    "dev": "now-sdk watch"  // Not "snc watch"
  }
}

# ✅ Fix 2: Clear cache and restart
rm -rf node_modules/.cache
npm run dev

# ✅ Fix 3: Check file permissions
ls -la src/client/
# Ensure files are readable

# ✅ Fix 4: Use build + deploy cycle for testing
npm run build && npm run deploy
```

---

## Debugging Tools and Techniques

### **Browser Developer Tools**

```javascript
// ✅ Debug ServiceNow context
console.log('ServiceNow User:', window.NOW.user);
console.log('Auth Token:', window.g_ck);
console.log('ServiceNow Version:', window.NOW);

// ✅ Debug TanStack Query
// Install React Query DevTools for development
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// ✅ Debug API calls
// Add to BaseServiceNowService
protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  console.log('API Call:', { endpoint, options });
  
  const response = await fetch(url, requestConfig);
  
  console.log('API Response:', {
    status: response.status,
    statusText: response.statusText,
    url: response.url
  });
  
  const data = await response.json();
  console.log('API Data:', data);
  
  return data;
}
```

---

## Quick Diagnostic Checklist

### **When Something Doesn't Work:**

1. **Check Browser Console** for JavaScript errors
2. **Verify Import Paths** are correct and files exist
3. **Confirm UI Page Configuration** matches documented patterns
4. **Test API Endpoints** directly in browser/Postman
5. **Validate CSS Import** in main.tsx
6. **Check ServiceNow Authentication** with `window.g_ck`
7. **Review TanStack Query** configuration and keys
8. **Clear Build Cache** and rebuild
9. **Check Network Tab** for failed requests
10. **Validate Component Export/Import** patterns

### **Emergency Fixes:**

```bash
# Nuclear option - reset everything
rm -rf node_modules dist .cache
npm install
npm run build
npm run deploy
```

---

## Getting Additional Help

### **Information to Gather:**
- Exact error message (copy full text)
- Browser console output
- Network tab showing failed requests
- ServiceNow version and instance type
- React/Node versions (`npm ls react @servicenow/sdk`)

### **Best Places to Look:**
- Browser Developer Tools Console
- Network tab for API call failures  
- React Query DevTools for query state
- ServiceNow instance logs (if accessible)

---

*Keep this guide handy during development - most issues have quick fixes once you know where to look.*