---
title: "State Management for ServiceNow Applications"
version: "2025.1.0"
introduced: "2024.4.0"
purpose: "State management patterns for ServiceNow React applications with TanStack Query + Zustand"
readTime: "5 minutes"
complexity: "intermediate"
prerequisites: ["service-layer-integration", "custom-hooks"]
criticality: "MANDATORY"
tags: ["state-management", "tanstack-query", "zustand", "servicenow"]
---

# State Management for ServiceNow Applications

**Purpose:** State management patterns for ServiceNow React applications with TanStack Query + Zustand  
**Read time:** ~5 minutes  
**Prerequisites:** [Service Layer Integration](service-layer-integration.md), [Custom Hooks](custom-hooks.md)

---

## Modern ServiceNow State Architecture

Our recommended state management combines **TanStack Query** for server state with **Zustand** for application state, providing the optimal balance for ServiceNow applications.

### **Why This Combination?**
- **TanStack Query** - Perfect for ServiceNow API data, caching, and synchronization
- **Zustand** - Excellent for authentication, UI state, and user preferences
- **Local State** - Form inputs, component interactions, temporary state

### **State Architecture Overview**
```
Server State (TanStack Query)           Application State (Zustand)
├── ServiceNow API data                 ├── Authentication (user, token, roles)
├── Caching & invalidation              ├── UI state (modals, notifications, theme)  
├── Background synchronization          ├── User preferences & settings
├── Optimistic updates                  └── Global workflow state
└── Request deduplication              

Local State (useState/useReducer)
├── Form data & validation
├── Component interactions (hover, focus)
└── Temporary UI state
```

---

## Authentication State (Zustand)

### **Authentication Store**
```tsx
// stores/authStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AuthService } from '@/services/AuthService';

interface User {
  sys_id: string;
  name: string;
  email: string;
  roles: string[];
}

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: () => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    // Actions
    login: async () => {
      set({ isLoading: true, error: null });
      
      try {
        // ServiceNow g_ck token extraction
        const token = await AuthService.getGlideToken();
        const user = await AuthService.getCurrentUser();
        
        set({
          token,
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        set({
          error: error.message,
          isLoading: false,
          isAuthenticated: false
        });
      }
    },

    logout: () => {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null
      });
    },

    refreshToken: async () => {
      const { token } = get();
      if (!token) return;

      try {
        const newToken = await AuthService.refreshToken(token);
        set({ token: newToken });
      } catch (error) {
        // Token refresh failed, logout user
        get().logout();
      }
    },

    clearError: () => set({ error: null })
  }))
);

// Authentication hook with TanStack Query integration
export function useAuth() {
  const auth = useAuthStore();
  
  useEffect(() => {
    // Auto-login on mount
    if (!auth.isAuthenticated && !auth.isLoading) {
      auth.login();
    }
  }, []);

  return auth;
}
```

---

## Server State Management (TanStack Query)

### **ServiceNow Data with TanStack Query**
```tsx
// hooks/queries/useServiceNowTable.ts
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { serviceNowQueryService } from '@/services/ServiceNowQueryService';

export function useServiceNowTable<T = ServiceNowRecord>(
  table: string,
  options: {
    query?: string;
    fields?: string[];
    orderBy?: string;
    limit?: number;
    enabled?: boolean;
  } = {}
) {
  // Get auth state from Zustand
  const { token, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['servicenow', 'table', table, options],
    queryFn: async () => {
      const params: ServiceNowTableParams = {};
      
      if (options.query) params.sysparm_query = options.query;
      if (options.fields) params.sysparm_fields = options.fields.join(',');
      if (options.orderBy) params.syspram_order_by = options.orderBy;
      if (options.limit) params.syspram_limit = options.limit.toString();

      const response = await serviceNowQueryService.getTableRecords<T>(table, params);
      return response.result;
    },
    // Only fetch when authenticated
    enabled: isAuthenticated && options.enabled !== false,
    // ServiceNow data caching strategy
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Usage in components
function IncidentList() {
  const { 
    data: incidents, 
    isLoading, 
    error, 
    refetch 
  } = useServiceNowTable<Incident>('incident', {
    query: 'active=true',
    fields: ['number', 'short_description', 'priority', 'state'],
    orderBy: 'sys_created_on DESC',
    limit: 50
  });

  // TanStack Query handles all loading, error, and data states
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <div className="incident-list">
      {incidents?.map(incident => (
        <IncidentCard key={incident.sys_id} incident={incident} />
      ))}
    </div>
  );
}
```

### **Mutations with Optimistic Updates**
```tsx
// hooks/mutations/useServiceNowMutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/uiStore';

export function useUpdateServiceNowRecord<T = ServiceNowRecord>(table: string) {
  const queryClient = useQueryClient();
  const { showNotification } = useUIStore(); // Zustand UI state

  return useMutation({
    mutationFn: async ({ sysId, data }: { sysId: string; data: Partial<T> }) => {
      return serviceNowQueryService.updateRecord<T>(table, sysId, data);
    },
    
    // Optimistic update for better UX
    onMutate: async ({ sysId, data }) => {
      await queryClient.cancelQueries({ 
        queryKey: ['servicenow', 'record', table, sysId] 
      });

      const previousRecord = queryClient.getQueryData<T>([
        'servicenow', 'record', table, sysId
      ]);

      if (previousRecord) {
        queryClient.setQueryData<T>(
          ['servicenow', 'record', table, sysId],
          { ...previousRecord, ...data }
        );
      }

      return { previousRecord };
    },

    onSuccess: (updatedRecord, { sysId }) => {
      // Update caches
      queryClient.setQueryData(
        ['servicenow', 'record', table, sysId],
        updatedRecord
      );

      queryClient.invalidateQueries({
        queryKey: ['servicenow', 'table', table],
        exact: false
      });

      // Use Zustand for notifications
      showNotification({
        type: 'success',
        message: `${table} record updated successfully`
      });
    },

    onError: (error, { sysId }, context) => {
      // Revert optimistic update
      if (context?.previousRecord) {
        queryClient.setQueryData(
          ['servicenow', 'record', table, sysId],
          context.previousRecord
        );
      }

      showNotification({
        type: 'error',
        message: `Failed to update ${table} record: ${error.message}`
      });
    },
  });
}
```

---

## UI State Management (Zustand)

### **UI State Store**
```tsx
// stores/uiStore.ts
import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  // Modals
  modals: Record<string, boolean>;
  
  // Notifications
  notifications: Notification[];
  
  // Theme
  theme: 'light' | 'dark' | 'auto';
  
  // Loading states
  globalLoading: boolean;

  // Actions
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  setGlobalLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>()((set, get) => ({
  modals: {},
  notifications: [],
  theme: 'auto',
  globalLoading: false,

  openModal: (modalId: string) =>
    set((state) => ({
      modals: { ...state.modals, [modalId]: true }
    })),

  closeModal: (modalId: string) =>
    set((state) => ({
      modals: { ...state.modals, [modalId]: false }
    })),

  showNotification: (notification) => {
    const id = crypto.randomUUID();
    const newNotification = { ...notification, id };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }));

    // Auto-remove after duration
    if (notification.duration !== 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, notification.duration || 5000);
    }
  },

  removeNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    })),

  setTheme: (theme) => set({ theme }),

  setGlobalLoading: (globalLoading) => set({ globalLoading })
}));
```

---

## Form State Integration

### **Combining TanStack Query with Local Form State**
```tsx
// components/IncidentForm.tsx
import { useForm } from 'react-hook-form';
import { useCreateServiceNowRecord, useUpdateServiceNowRecord } from '@/hooks/mutations';
import { useUIStore } from '@/stores/uiStore';

interface IncidentFormProps {
  incidentId?: string;
  onSuccess?: (incident: Incident) => void;
}

export function IncidentForm({ incidentId, onSuccess }: IncidentFormProps) {
  // TanStack Query mutations
  const createIncident = useCreateServiceNowRecord<Incident>('incident');
  const updateIncident = useUpdateServiceNowRecord<Incident>('incident');
  
  // Zustand UI state
  const { showNotification } = useUIStore();
  
  // Local form state
  const { register, handleSubmit, formState: { errors } } = useForm<IncidentData>();

  const onSubmit = async (data: IncidentData) => {
    try {
      const incident = incidentId 
        ? await updateIncident.mutateAsync({ sysId: incidentId, data })
        : await createIncident.mutateAsync(data);

      // TanStack Query handles success notifications via mutations
      onSuccess?.(incident);
    } catch (error) {
      // Error notifications handled by mutation error handlers
      console.error('Form submission failed:', error);
    }
  };

  const isSubmitting = createIncident.isPending || updateIncident.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField
        label="Short Description"
        error={errors.short_description?.message}
      >
        <Input
          {...register('short_description', { required: 'Short description is required' })}
          placeholder="Brief description of the incident"
        />
      </FormField>

      <Button type="submit" loading={isSubmitting}>
        {incidentId ? 'Update' : 'Create'} Incident
      </Button>
    </form>
  );
}
```

---

## Integration Patterns

### **Stateless Components with Combined State**
```tsx
// ✅ Stateless component receives state from multiple sources
function IncidentDashboard({ 
  incidents,        // From TanStack Query
  isLoading,        // From TanStack Query
  error,            // From TanStack Query
  user,             // From Zustand auth
  notifications,    // From Zustand UI
  onIncidentUpdate, // Callback to mutation
  onRefresh         // Callback to refetch
}) {
  return (
    <div className="incident-dashboard">
      <header>
        <h1>Welcome, {user?.name}</h1>
        <NotificationList notifications={notifications} />
      </header>
      
      <main>
        {isLoading && <LoadingSpinner />}
        {error && <ErrorMessage error={error} onRetry={onRefresh} />}
        {incidents && (
          <IncidentList 
            incidents={incidents} 
            onUpdate={onIncidentUpdate}
          />
        )}
      </main>
    </div>
  );
}

// ✅ Container combines state from different sources
function IncidentDashboardContainer() {
  // TanStack Query - server state
  const { 
    data: incidents, 
    isLoading, 
    error, 
    refetch 
  } = useServiceNowTable<Incident>('incident');
  
  // Zustand - application state
  const { user } = useAuthStore();
  const { notifications } = useUIStore();
  
  // TanStack Query - mutations
  const { updateIncident } = useUpdateServiceNowRecord<Incident>('incident');

  return (
    <IncidentDashboard
      incidents={incidents}
      isLoading={isLoading}
      error={error}
      user={user}
      notifications={notifications}
      onIncidentUpdate={(sysId, data) => updateIncident.mutate({ sysId, data })}
      onRefresh={refetch}
    />
  );
}
```

### **Cross-State Reactivity**
```tsx
// Authentication changes affect TanStack Query
function useServiceNowQueries() {
  const { isAuthenticated, token } = useAuthStore();
  
  // Queries automatically disabled when not authenticated
  const incidents = useServiceNowTable('incident', {
    enabled: isAuthenticated
  });
  
  const users = useServiceNowTable('sys_user', {
    enabled: isAuthenticated
  });

  // Clear queries on logout
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isAuthenticated) {
      queryClient.clear(); // Clear all cached data on logout
    }
  }, [isAuthenticated, queryClient]);

  return { incidents, users };
}
```

---

## Performance Optimization

### **Selective Subscriptions**
```tsx
// Only subscribe to specific Zustand state slices
function UserProfile() {
  // Only re-renders when user changes, not other auth state
  const user = useAuthStore(state => state.user);
  
  return <div>Welcome, {user?.name}</div>;
}

// Combine multiple related values efficiently
function AuthStatus() {
  const { user, isAuthenticated, isLoading } = useAuthStore(state => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading
  }));

  if (isLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPrompt />;
  
  return <UserProfile user={user} />;
}
```

### **TanStack Query + Zustand Performance**
```tsx
// TanStack Query handles request deduplication automatically
function IncidentPage() {
  return (
    <div>
      <IncidentSummary />    {/* Uses useServiceNowTable('incident') */}
      <IncidentList />       {/* Uses useServiceNowTable('incident') */}
      <IncidentStats />      {/* Uses useServiceNowTable('incident') */}
    </div>
  );
  // Only one API call made, shared across all components
}

// Zustand state updates are efficient
function useNotifications() {
  const { notifications, removeNotification } = useUIStore();
  
  // Optimized notification cleanup
  useEffect(() => {
    const cleanup = () => {
      notifications
        .filter(n => n.createdAt < Date.now() - 30000) // 30 seconds old
        .forEach(n => removeNotification(n.id));
    };
    
    const interval = setInterval(cleanup, 5000);
    return () => clearInterval(interval);
  }, [notifications, removeNotification]);
  
  return notifications;
}
```

---

## Testing Combined State Management

### **Testing TanStack Query + Zustand**
```tsx
// test-utils/stateProviders.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function TestStateProvider({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Component test with both states
describe('IncidentDashboard', () => {
  beforeEach(() => {
    // Reset Zustand store
    useAuthStore.setState({
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true
    });
  });

  it('renders incidents when authenticated', async () => {
    // Mock TanStack Query response
    serviceNowQueryService.getTableRecords.mockResolvedValue({
      result: [mockIncident]
    });

    render(
      <TestStateProvider>
        <IncidentDashboardContainer />
      </TestStateProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(mockIncident.short_description.display_value)).toBeInTheDocument();
    });
  });
});
```

---

## Migration Strategy

### **Phase 1: Introduce TanStack Query**
```tsx
// Keep existing Zustand patterns, add TanStack Query for data fetching
function IncidentManagement() {
  // Existing auth state (keep)
  const { user } = useAuthStore();
  
  // New data fetching (TanStack Query)
  const { data: incidents } = useServiceNowTable('incident');
  
  // Existing UI state (keep)
  const { showNotification } = useUIStore();
  
  return <IncidentList incidents={incidents} />;
}
```

### **Phase 2: Optimize Integration**
```tsx
// Remove data from Zustand, keep only application state
const useAppStore = create((set) => ({
  // Remove: incidents, users (now in TanStack Query)
  // Keep: auth, UI state, preferences
  theme: 'light',
  sidebarOpen: false,
  // ...
}));
```

---

## Best Practices

### **✅ State Management Boundaries**
- **TanStack Query** - ServiceNow API data, caching, synchronization
- **Zustand** - Authentication, UI state, user preferences
- **Local State** - Form inputs, component interactions, temporary state

### **✅ Integration Patterns**
- Use Zustand auth state to control TanStack Query enabled state
- Use TanStack Query success/error callbacks to update Zustand UI state
- Pass state to stateless components via props
- Test both state systems together

### **❌ Avoid Anti-Patterns**
- Don't duplicate server data in Zustand (use TanStack Query)
- Don't put temporary form state in global stores
- Don't ignore TanStack Query's built-in loading/error states
- Don't forget to clear TanStack Query cache on logout

---

## Next Steps

**Implementation order:**
1. **Set up TanStack Query** - See [Service Layer Integration](service-layer-integration.md)
2. **Integrate with existing Zustand auth** - Use auth state to control queries  
3. **Migrate data fetching gradually** - Replace custom hooks with TanStack Query
4. **Optimize performance** - Selective subscriptions and smart caching
5. **Test integration** - Both state systems working together

**Related patterns:**
- [Service Layer Integration](service-layer-integration.md) - Complete TanStack Query implementation
- [Custom Hooks](custom-hooks.md) - Migrating existing data hooks
- [Data Fetching](data-fetching.md) - Advanced TanStack Query patterns

---

*The combination of Zustand + TanStack Query provides the perfect state management solution for ServiceNow applications: simple application state with powerful server state management.*