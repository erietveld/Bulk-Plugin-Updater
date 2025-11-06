---
title: "ServiceNow User Context and Authentication Patterns"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "User context management and authentication patterns for ServiceNow React applications"
readTime: "4 minutes"
complexity: "intermediate"
criticality: "HIGH"
tags: ["authentication", "user-context", "servicenow", "patterns"]
validationStatus: "PRODUCTION_TESTED"
---

# ServiceNow User Context and Authentication Patterns

**Purpose:** User context management and authentication patterns for ServiceNow React applications  
**Read time:** ~4 minutes  
**Use case:** Getting current user information, role-based features, assignment operations

> **🎯 CRITICAL:** These patterns are essential for any ServiceNow React application that needs user-aware features like assignments, approvals, or role-based functionality.

---

## User Context Service Implementation

### **ServiceNow User Context Service**
```typescript
// services/UserContextService.ts
import { BaseServiceNowService } from './BaseServiceNowService';

export interface ServiceNowUser {
  sys_id: string;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  department: string;
  roles: string[];
  groups: string[];
}

export class UserContextService extends BaseServiceNowService {
  private currentUser: ServiceNowUser | null = null;

  /**
   * Get current user context from ServiceNow
   */
  async getCurrentUser(): Promise<ServiceNowUser> {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Get user info from ServiceNow globals (available in UI Pages)
    const userInfo = (window as any).NOW?.user;
    
    if (userInfo?.userID) {
      // Fetch complete user record
      const response = await this.request<{ result: any[] }>(
        `/table/sys_user/${userInfo.userID}?sysparm_display_value=all&sysparm_fields=sys_id,user_name,first_name,last_name,email,department,roles`
      );

      if (response.result) {
        this.currentUser = {
          sys_id: response.result.sys_id?.value || userInfo.userID,
          user_name: response.result.user_name?.display_value || userInfo.name,
          first_name: response.result.first_name?.display_value || userInfo.firstName,
          last_name: response.result.last_name?.display_value || userInfo.lastName,
          email: response.result.email?.display_value || '',
          department: response.result.department?.display_value || '',
          roles: this.parseRoles(userInfo.roles),
          groups: [], // Can be fetched separately if needed
        };

        return this.currentUser;
      }
    }

    throw new Error('Unable to get current user context');
  }

  /**
   * Check if current user has specific role
   */
  async hasRole(roleName: string): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user.roles.includes(roleName);
  }

  /**
   * Check if current user can perform action on incident
   */
  async canAssignIncident(): Promise<boolean> {
    return await this.hasRole('itil') || await this.hasRole('incident_manager');
  }

  async canResolveIncident(): Promise<boolean> {
    return await this.hasRole('itil') || await this.hasRole('resolver');
  }

  /**
   * Get user's display name
   */
  async getDisplayName(): Promise<string> {
    const user = await this.getCurrentUser();
    return `${user.first_name} ${user.last_name}`.trim() || user.user_name;
  }

  private parseRoles(rolesString: string): string[] {
    if (!rolesString) return [];
    return rolesString.split(',').map(role => role.trim());
  }
}

// Singleton instance
export const userContextService = new UserContextService();
```

### **React Hook for User Context**
```typescript
// hooks/useUserContext.ts
import { useQuery } from '@tanstack/react-query';
import { userContextService } from '../services/UserContextService';

export const userQueryKeys = {
  currentUser: ['user', 'current'] as const,
  permissions: (action: string) => ['user', 'permissions', action] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: userQueryKeys.currentUser,
    queryFn: () => userContextService.getCurrentUser(),
    staleTime: 15 * 60 * 1000, // 15 minutes - user info doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useUserPermissions() {
  const { data: user } = useCurrentUser();
  
  return useQuery({
    queryKey: userQueryKeys.permissions('incident'),
    queryFn: async () => {
      const [canAssign, canResolve] = await Promise.all([
        userContextService.canAssignIncident(),
        userContextService.canResolveIncident()
      ]);
      
      return {
        canAssignIncidents: canAssign,
        canResolveIncidents: canResolve,
        isITIL: user?.roles.includes('itil') || false,
        isAdmin: user?.roles.includes('admin') || false,
      };
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDisplayName() {
  return useQuery({
    queryKey: ['user', 'displayName'],
    queryFn: () => userContextService.getDisplayName(),
    staleTime: 15 * 60 * 1000,
  });
}
```

---

## Updated Incident Service with User Context

### **Enhanced Incident Operations**
```typescript
// services/IncidentService.ts - Updated methods
import { userContextService } from './UserContextService';

export class IncidentService extends BaseServiceNowService {
  // ... existing methods ...

  /**
   * Assign incident to current user
   */
  async assignToMe(incidentId: string): Promise<Incident> {
    const currentUser = await userContextService.getCurrentUser();
    
    return this.updateIncident(incidentId, {
      assigned_to: currentUser.sys_id,
      state: '2' // In Progress
    });
  }

  /**
   * Assign incident to specific user
   */
  async assignToUser(incidentId: string, userId: string): Promise<Incident> {
    // Verify current user can assign incidents
    const canAssign = await userContextService.canAssignIncident();
    if (!canAssign) {
      throw new ServiceNowError(403, 'PERMISSION_ERROR', 'You do not have permission to assign incidents');
    }

    return this.updateIncident(incidentId, {
      assigned_to: userId,
      state: '2' // In Progress
    });
  }

  /**
   * Get incidents assigned to current user
   */
  async getMyIncidents(options: IncidentQueryOptions = {}): Promise<ServiceNowTableResponse<Incident>> {
    const currentUser = await userContextService.getCurrentUser();
    
    return this.getIncidents({
      ...options,
      assignedTo: currentUser.sys_id,
    });
  }
}
```

---

## Component Integration with User Context

### **Updated IncidentList with Permissions**
```typescript
// components/organisms/IncidentList.tsx - Enhanced version
import React from 'react';
import { useIncidents, useIncidentMutations } from '../../hooks/useIncidentQueries';
import { useCurrentUser, useUserPermissions } from '../../hooks/useUserContext';
import { IncidentCard } from '../molecules/IncidentCard';

export function IncidentList({ showAssignedToMe = false }: IncidentListProps) {
  const { data: currentUser } = useCurrentUser();
  const { data: permissions } = useUserPermissions();
  
  const { data: incidentsResponse, isLoading, error, refetch } = useIncidents({
    active: true,
    limit: 20,
    assignedTo: showAssignedToMe ? currentUser?.sys_id : undefined,
  });

  const { assignToMe, resolveIncident } = useIncidentMutations();

  const handleAssignToMe = (incidentId: string) => {
    if (!currentUser || !permissions?.canAssignIncidents) {
      alert('You do not have permission to assign incidents');
      return;
    }

    assignToMe.mutate({ 
      incidentId, 
      userId: currentUser.sys_id  // Real user ID
    });
  };

  const handleResolve = (incidentId: string) => {
    if (!permissions?.canResolveIncidents) {
      alert('You do not have permission to resolve incidents');
      return;
    }

    const resolution = 'Resolved by user action';
    resolveIncident.mutate({ incidentId, resolution });
  };

  // ... rest of component with permission-aware buttons
  
  return (
    <div>
      {/* Show user context info */}
      {currentUser && (
        <div className="mb-4 text-sm text-slate-600">
          Logged in as: <strong>{currentUser.first_name} {currentUser.last_name}</strong>
          {permissions?.isITIL && <span className="badge badge-info ml-2">ITIL</span>}
          {permissions?.isAdmin && <span className="badge badge-success ml-2">Admin</span>}
        </div>
      )}
      
      {/* Incident grid with permission-aware actions */}
      <div className="grid-responsive">
        {incidents.map((incident) => (
          <IncidentCard
            key={incident.sys_id?.value}
            incident={incident}
            onAssignToMe={permissions?.canAssignIncidents ? handleAssignToMe : undefined}
            onResolve={permissions?.canResolveIncidents ? handleResolve : undefined}
            showAssignButton={!assignedTo && permissions?.canAssignIncidents}
            showResolveButton={state !== 'Resolved' && permissions?.canResolveIncidents}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Authentication Error Handling

### **Enhanced Error Handling Patterns**
```typescript
// Enhanced error handling in QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ServiceNowError) {
          // Handle auth-specific errors
          if (error.status === 401) {
            // Redirect to login or show auth error
            window.location.href = '/login.do';
            return false;
          }
          
          if (error.status === 403) {
            // Show permission error, don't retry
            console.error('Permission denied:', error.message);
            return false;
          }
        }
        
        return failureCount < 3;
      },
    },
  },
});

// Global error handler for user context issues
queryClient.getQueryCache().subscribe((event) => {
  if (event.type === 'updated' && event.query.state.status === 'error') {
    const error = event.query.state.error;
    
    if (error instanceof ServiceNowError) {
      if (error.status === 401) {
        // Handle session timeout
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login.do';
      } else if (error.status === 403) {
        // Handle permission issues
        console.warn('Access denied. Check user permissions.');
      }
    }
  }
});
```

---

## Testing User Context

### **Mock User Context for Testing**
```typescript
// __mocks__/UserContextService.ts
export const mockUserContextService = {
  getCurrentUser: jest.fn().mockResolvedValue({
    sys_id: 'test-user-123',
    user_name: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    roles: ['itil', 'incident_manager'],
    groups: [],
  }),
  
  hasRole: jest.fn().mockImplementation((role: string) => {
    return Promise.resolve(['itil', 'incident_manager'].includes(role));
  }),
  
  canAssignIncident: jest.fn().mockResolvedValue(true),
  canResolveIncident: jest.fn().mockResolvedValue(true),
};

// Test example
describe('IncidentList with User Context', () => {
  it('shows assign button for users with permission', async () => {
    mockUserContextService.canAssignIncident.mockResolvedValue(true);
    
    render(<IncidentList />);
    
    await waitFor(() => {
      expect(screen.getByText('Assign to Me')).toBeInTheDocument();
    });
  });
  
  it('hides assign button for users without permission', async () => {
    mockUserContextService.canAssignIncident.mockResolvedValue(false);
    
    render(<IncidentList />);
    
    await waitFor(() => {
      expect(screen.queryByText('Assign to Me')).not.toBeInTheDocument();
    });
  });
});
```

---

## Implementation Checklist

### **✅ User Context Integration**
- [ ] UserContextService implemented with getCurrentUser()
- [ ] Role checking methods (hasRole, canAssignIncident, etc.)
- [ ] React hooks for user context (useCurrentUser, useUserPermissions)
- [ ] Permission-aware component rendering
- [ ] Authentication error handling in QueryClient

### **✅ ServiceNow Integration**
- [ ] Using NOW.user globals from ServiceNow UI Pages
- [ ] Proper sys_user table queries for complete user data
- [ ] Role-based permission checking
- [ ] Session timeout and auth error handling

### **✅ Component Updates**
- [ ] Permission-aware button rendering
- [ ] User context display in UI
- [ ] Real user IDs in assignment operations
- [ ] Error messages for permission denials

---

*This pattern enables production-ready user context management in ServiceNow React applications with proper authentication, permissions, and error handling.*