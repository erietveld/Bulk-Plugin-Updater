---
title: "ServiceNow User Context Patterns"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Access current user information, roles, and permissions in ServiceNow React applications"
readTime: "5 minutes"
complexity: "intermediate"
criticality: "HIGH"
tags: ["servicenow", "user-context", "authentication", "permissions"]
validationStatus: "PRODUCTION_TESTED"
---

# ServiceNow User Context Patterns

**Purpose:** Access current user information, roles, and permissions in ServiceNow React applications  
**Read time:** ~5 minutes  
**Use case:** Applications requiring user-specific functionality, role-based features, personalization

> **Production-tested patterns** from real ServiceNow React applications requiring user context.

---

## Current User Information Access

### **ServiceNow Global User Object**
ServiceNow provides user context through the global `window.NOW.user` object:

```typescript
// types/ServiceNowUser.ts
export interface ServiceNowUser {
  userID: string;
  name: string;
  firstName: string;
  lastName: string;
  roles: string;
  allRoles: string;
  departmentID: string;
  isImpersonating: boolean;
}

// utils/userContext.ts
export function getCurrentUser(): ServiceNowUser | null {
  if (typeof window !== 'undefined' && window.NOW?.user) {
    return {
      userID: window.NOW.user.userID,
      name: window.NOW.user.name,
      firstName: window.NOW.user.firstName,
      lastName: window.NOW.user.lastName,
      roles: window.NOW.user.roles,
      allRoles: window.NOW.user.allRoles,
      departmentID: window.NOW.user.departmentID,
      isImpersonating: window.NOW.user.isImpersonating,
    };
  }
  return null;
}

export function getCurrentUserId(): string | null {
  const user = getCurrentUser();
  return user?.userID || null;
}

export function getUserDisplayName(): string {
  const user = getCurrentUser();
  if (!user) return 'Unknown User';
  return `${user.firstName} ${user.lastName}`.trim() || user.name;
}
```

### **React Hook for User Context**
Create a reusable hook for user information:

```typescript
// hooks/useCurrentUser.ts
import { useMemo } from 'react';
import { getCurrentUser, getCurrentUserId, getUserDisplayName } from '../utils/userContext';

export function useCurrentUser() {
  const user = useMemo(() => getCurrentUser(), []);
  
  return {
    user,
    userId: getCurrentUserId(),
    displayName: getUserDisplayName(),
    isLoggedIn: !!user,
    isImpersonating: user?.isImpersonating || false,
  };
}

// Usage in components
function IncidentAssignment() {
  const { userId, displayName, isLoggedIn } = useCurrentUser();
  
  if (!isLoggedIn) {
    return <div>Please log in to continue</div>;
  }
  
  return (
    <button onClick={() => assignToMe({ incidentId, userId: userId! })}>
      Assign to {displayName}
    </button>
  );
}
```

---

## Role-Based Access Control

### **Role Checking Utilities**
```typescript
// utils/roleUtils.ts
export function hasRole(requiredRole: string): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  const userRoles = user.allRoles.split(',').map(role => role.trim());
  return userRoles.includes(requiredRole);
}

export function hasAnyRole(requiredRoles: string[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  const userRoles = user.allRoles.split(',').map(role => role.trim());
  return requiredRoles.some(role => userRoles.includes(role));
}

export function hasAllRoles(requiredRoles: string[]): boolean {
  const user = getCurrentUser();
  if (!user) return false;
  
  const userRoles = user.allRoles.split(',').map(role => role.trim());
  return requiredRoles.every(role => userRoles.includes(role));
}

// Common ServiceNow roles
export const SERVICENOW_ROLES = {
  ADMIN: 'admin',
  ITIL: 'itil',
  INCIDENT_MANAGER: 'incident_manager',
  PROBLEM_MANAGER: 'problem_manager',
  CHANGE_MANAGER: 'change_manager',
  CATALOG_ADMIN: 'catalog_admin',
  USER_ADMIN: 'user_admin',
} as const;
```

### **Role-Based Component Rendering**
```typescript
// components/atoms/RoleGuard.tsx
import React from 'react';
import { hasRole, hasAnyRole, hasAllRoles } from '../../utils/roleUtils';

interface RoleGuardProps {
  role?: string;
  anyRole?: string[];
  allRoles?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGuard({ 
  role, 
  anyRole, 
  allRoles, 
  fallback = null, 
  children 
}: RoleGuardProps) {
  let hasAccess = false;
  
  if (role) {
    hasAccess = hasRole(role);
  } else if (anyRole) {
    hasAccess = hasAnyRole(anyRole);
  } else if (allRoles) {
    hasAccess = hasAllRoles(allRoles);
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Usage examples
function IncidentActions() {
  return (
    <div className="card-footer">
      {/* Everyone can view */}
      <button className="btn btn-secondary btn-sm">View Details</button>
      
      {/* Only ITIL users can assign */}
      <RoleGuard role="itil">
        <button className="btn btn-primary btn-sm">Assign to Me</button>
      </RoleGuard>
      
      {/* Only incident or problem managers can resolve */}
      <RoleGuard anyRole={['incident_manager', 'problem_manager']}>
        <button className="btn btn-success btn-sm">Resolve</button>
      </RoleGuard>
      
      {/* Only admins can delete */}
      <RoleGuard 
        role="admin" 
        fallback={<span className="text-sm text-slate-500">Admin required</span>}
      >
        <button className="btn btn-error btn-sm">Delete</button>
      </RoleGuard>
    </div>
  );
}
```

---

## Department and Location Context

### **Department-Based Filtering**
```typescript
// utils/departmentUtils.ts
export function getCurrentUserDepartment(): string | null {
  const user = getCurrentUser();
  return user?.departmentID || null;
}

export function isDepartmentMember(departmentId: string): boolean {
  const userDepartment = getCurrentUserDepartment();
  return userDepartment === departmentId;
}

// services/DepartmentService.ts
export class DepartmentService extends BaseServiceNowService {
  async getUserDepartmentInfo(userId: string): Promise<Department> {
    const response = await this.request<{ result: Department }>(
      `/table/cmn_department/${userId}`
    );
    return response.result;
  }
  
  async getDepartmentMembers(departmentId: string): Promise<ServiceNowTableResponse<User>> {
    const params = this.buildQueryParams();
    params.set('sysparm_query', `department=${departmentId}`);
    
    return this.request<ServiceNowTableResponse<User>>(
      `/table/sys_user?${params.toString()}`
    );
  }
}
```

---

## User Preferences and Settings

### **User Preference Management**
```typescript
// services/UserPreferenceService.ts
export class UserPreferenceService extends BaseServiceNowService {
  async getUserPreference(name: string): Promise<string | null> {
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    const params = this.buildQueryParams();
    params.set('sysparm_query', `user=${userId}^name=${name}`);
    
    const response = await this.request<ServiceNowTableResponse<UserPreference>>(
      `/table/sys_user_preference?${params.toString()}`
    );
    
    return response.result[0]?.value?.value || null;
  }
  
  async setUserPreference(name: string, value: string): Promise<void> {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');
    
    await this.request(`/table/sys_user_preference`, {
      method: 'POST',
      body: JSON.stringify({
        user: userId,
        name,
        value
      })
    });
  }
}

// hooks/useUserPreference.ts
export function useUserPreference(preferenceName: string, defaultValue: string = '') {
  const [preference, setPreference] = useState<string>(defaultValue);
  const preferenceService = useMemo(() => new UserPreferenceService(), []);
  
  const { data } = useQuery({
    queryKey: ['user-preference', preferenceName],
    queryFn: () => preferenceService.getUserPreference(preferenceName),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
  
  const updatePreference = useMutation({
    mutationFn: (value: string) => preferenceService.setUserPreference(preferenceName, value),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-preference', preferenceName]);
    }
  });
  
  useEffect(() => {
    if (data !== undefined) {
      setPreference(data || defaultValue);
    }
  }, [data, defaultValue]);
  
  return {
    preference,
    updatePreference: updatePreference.mutate,
    isUpdating: updatePreference.isPending,
  };
}
```

---

## Advanced User Context Patterns

### **Impersonation Detection**
```typescript
// utils/impersonationUtils.ts
export function isUserImpersonating(): boolean {
  const user = getCurrentUser();
  return user?.isImpersonating || false;
}

export function getImpersonationWarning(): React.ReactNode {
  if (!isUserImpersonating()) return null;
  
  return (
    <div className="alert alert-warning">
      ⚠️ You are currently impersonating another user. Actions will be recorded under the impersonated user's account.
    </div>
  );
}

// Component usage
function UserContextBanner() {
  const { displayName } = useCurrentUser();
  const impersonationWarning = getImpersonationWarning();
  
  return (
    <div className="user-context-banner">
      <span>Logged in as: {displayName}</span>
      {impersonationWarning}
    </div>
  );
}
```

### **User-Specific Data Filtering**
```typescript
// hooks/useUserIncidents.ts
export function useUserIncidents() {
  const { userId } = useCurrentUser();
  
  return useQuery({
    queryKey: ['incidents', 'user', userId],
    queryFn: () => incidentService.getIncidents({
      assignedTo: userId,
      active: true
    }),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

// Usage in components
function MyIncidentsPage() {
  const { data: incidents, isLoading, error } = useUserIncidents();
  const { displayName } = useCurrentUser();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">My Incidents</h1>
        <p className="page-subtitle">Incidents assigned to {displayName}</p>
      </div>
      
      <IncidentList incidents={incidents?.result || []} />
    </div>
  );
}
```

---

## Testing User Context

### **Mock User Context for Testing**
```typescript
// __tests__/utils/mockUserContext.ts
export const createMockUser = (overrides: Partial<ServiceNowUser> = {}): ServiceNowUser => ({
  userID: 'test-user-123',
  name: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  roles: 'itil,user',
  allRoles: 'itil,user,snc_internal',
  departmentID: 'dept-123',
  isImpersonating: false,
  ...overrides,
});

export function mockUserContext(user: ServiceNowUser) {
  (global as any).window = {
    ...global.window,
    NOW: {
      user
    }
  };
}

// Test examples
describe('User Context', () => {
  beforeEach(() => {
    mockUserContext(createMockUser());
  });
  
  it('should return current user ID', () => {
    expect(getCurrentUserId()).toBe('test-user-123');
  });
  
  it('should check roles correctly', () => {
    expect(hasRole('itil')).toBe(true);
    expect(hasRole('admin')).toBe(false);
  });
  
  it('should render role-guarded content', () => {
    const { getByText, queryByText } = render(
      <RoleGuard role="itil">
        <button>Admin Action</button>
      </RoleGuard>
    );
    
    expect(getByText('Admin Action')).toBeInTheDocument();
  });
});
```

---

## Common Use Cases

### **Quick Reference Patterns**

```typescript
// 1. Get current user for assignment
const { userId } = useCurrentUser();
assignToMe.mutate({ incidentId, userId: userId! });

// 2. Role-based UI rendering
<RoleGuard role="admin">
  <AdminPanel />
</RoleGuard>

// 3. User-specific data fetching
const { data } = useQuery({
  queryKey: ['my-data', userId],
  queryFn: () => service.getUserData(userId),
  enabled: !!userId
});

// 4. Department-based filtering
const isDeptMember = isDepartmentMember(selectedDepartment);

// 5. Impersonation warning
const impersonationWarning = getImpersonationWarning();
```

### **Performance Considerations**

```typescript
// ✅ GOOD: Cache user context
const user = useMemo(() => getCurrentUser(), []);

// ✅ GOOD: Enable queries conditionally
const { data } = useQuery({
  queryKey: ['user-data'],
  queryFn: fetchUserData,
  enabled: !!userId, // Don't run without user ID
});

// ❌ BAD: Fetch user on every render
function BadComponent() {
  const user = getCurrentUser(); // Called on every render
  // ...
}
```

---

## Security Considerations

### **Best Practices**
- **Never trust client-side role checks** for security - always validate on server
- **Use role guards for UI only** - backend must enforce permissions
- **Validate user context** before making sensitive API calls
- **Handle impersonation scenarios** appropriately in business logic

### **Security Validation**
```typescript
// Client-side (UI only)
function AdminButton() {
  if (!hasRole('admin')) return null;
  return <button>Admin Action</button>;
}

// Server-side validation (required)
// Business Rule or Script Include
function validateAdminAction(userId) {
  var user = new GlideRecord('sys_user');
  user.get(userId);
  
  if (!user.hasRole('admin')) {
    throw new Error('Access denied: Admin role required');
  }
  
  // Proceed with admin action
}
```

---

*Use these patterns to build user-aware ServiceNow React applications with proper role-based access control and personalized experiences.*