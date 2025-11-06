---
title: "Custom Hooks for ServiceNow Applications"
version: "2025.1.0"
introduced: "2024.4.0"
purpose: "Reusable logic patterns using custom hooks for ServiceNow integration"
readTime: "5 minutes"
complexity: "intermediate"
status: "ACTIVE"
criticality: "RECOMMENDED"
prerequisites: ["core-principles", "service-layer-integration"]
tags: ["hooks", "reusability", "servicenow", "logic-separation"]
breaking-changes: ["Hooks should now integrate with TanStack Query for data operations"]
---

# Custom Hooks for ServiceNow Applications

**Purpose:** Reusable logic patterns using custom hooks for ServiceNow integration  
**Read time:** ~5 minutes  
**Prerequisites:** [Core Principles](../core-principles.md), [Service Layer Integration](service-layer-integration.md)

---

## Using Custom Hooks for Reusable Logic & UI Separation

Custom hooks are the key to DRY, maintainable React apps—they let you move **business logic** out of UI components, increasing reuse and clarity.

### **How to Use Custom Hooks**

1. **Extract Logic:**
   - Identify repeated logic (data fetching, form handling, etc.) or business rules in components.
   - Move this logic into a custom hook (a function starting with `use`).

2. **Parameterize as Needed:**
   - Pass options or callbacks into your hook for flexibility.

3. **Return Only What the UI Needs:**
   - Return data, loading state, handlers, etc. from the hook—just what the UI layer needs to render.

#### **Example: Separating Business Logic from UI**

Suppose you fetch and display user data. Instead of mixing data-fetching in the UI:

```tsx
// ✅ Custom hook for business logic
function useUser(id: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetch(`/api/users/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then(userData => {
        setUser(userData);
        setError(null);
      })
      .catch(err => {
        setError(err.message);
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return { user, loading, error };
}

// ✅ Presentational component: focuses on rendering UI
function UserCard({ userId }: { userId: string }) {
  const { user, loading, error } = useUser(userId); // Fetching logic is hidden in the hook
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;
  
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```

### **Benefits**
- **Reusable Logic:** `useUser` can be used in multiple places, keeping code DRY and business rules easy to update.
- **Easy to Test:** Hooks can be unit tested separately from rendering logic.
- **Separation of Concerns:** UI focuses only on display; hooks manage data and business logic.

#### **Best Practice**
- For every complex component, ask yourself: "Can the business/data logic move to a hook?"
- Document your hooks: overview, arguments, what they return, expected usage.

---

## ServiceNow Data Hooks

### **useServiceNowTable - Core Data Fetching Hook**
```tsx
interface UseServiceNowTableOptions {
  tableName: string;
  initialFilters?: Record<string, any>;
  autoFetch?: boolean;
  pageSize?: number;
}

interface UseServiceNowTableReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  filters: Record<string, any>;
  setFilters: (filters: Record<string, any>) => void;
  refetch: () => Promise<void>;
  create: (data: Partial<T>) => Promise<T>;
  update: (sysId: string, updates: Partial<T>) => Promise<T>;
  delete: (sysId: string) => Promise<boolean>;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/**
 * Custom hook for ServiceNow table operations
 * 
 * Encapsulates all business logic for fetching, creating, updating, and deleting
 * ServiceNow records. UI components only need to handle rendering.
 * 
 * @param options - Configuration options
 * @returns Object with data, loading state, and CRUD operations
 * 
 * @example
 * ```tsx
 * function IncidentListContainer() {
 *   const { data: incidents, loading, create, update } = useServiceNowTable({
 *     tableName: 'incident',
 *     initialFilters: { priority: '1,2' }
 *   });
 *   
 *   return (
 *     <IncidentList 
 *       incidents={incidents} 
 *       loading={loading}
 *       onCreateIncident={create}
 *       onUpdateIncident={update}
 *     />
 *   );
 * }
 * ```
 */
function useServiceNowTable<T = any>(options: UseServiceNowTableOptions): UseServiceNowTableReturn<T> {
  const { tableName, initialFilters = {}, autoFetch = true, pageSize = 100 } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrevious: false
  });

  const { service, tokenReady, tokenError } = useSecureServiceNowService(tableName);

  const fetchData = useCallback(async (page = 1) => {
    if (!service || !tokenReady) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const query = Object.entries(filters)
        .filter(([_, value]) => value !== '' && value != null)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('^');
        
      const offset = (page - 1) * pageSize;
      const params = {
        sysparm_query: query,
        sysparm_limit: pageSize.toString(),
        sysparm_offset: offset.toString()
      };
      
      const result = await service.list(params);
      setData(result);
      
      // Update pagination info (if your API provides total count)
      setPagination(prev => ({
        currentPage: page,
        totalPages: Math.ceil(result.length / pageSize),
        totalCount: result.length,
        hasNext: result.length === pageSize,
        hasPrevious: page > 1
      }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [service, tokenReady, filters, pageSize]);

  const create = useCallback(async (newData: Partial<T>): Promise<T> => {
    if (!service) throw new Error('Service not available');
    
    try {
      const result = await service.create(newData);
      await fetchData(); // Refresh data
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Create failed';
      setError(message);
      throw new Error(message);
    }
  }, [service, fetchData]);

  const update = useCallback(async (sysId: string, updates: Partial<T>): Promise<T> => {
    if (!service) throw new Error('Service not available');
    
    try {
      const result = await service.update(sysId, updates);
      await fetchData(); // Refresh data
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed';
      setError(message);
      throw new Error(message);
    }
  }, [service, fetchData]);

  const deleteRecord = useCallback(async (sysId: string): Promise<boolean> => {
    if (!service) throw new Error('Service not available');
    
    try {
      const success = await service.delete(sysId);
      if (success) {
        await fetchData(); // Refresh data
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setError(message);
      throw new Error(message);
    }
  }, [service, fetchData]);

  // Effect for auto-fetching and filter changes
  useEffect(() => {
    if (tokenError) {
      setError(tokenError);
      setLoading(false);
      return;
    }
    
    if (autoFetch) {
      fetchData();
    }
  }, [filters, tokenError, autoFetch, fetchData]);

  return {
    data,
    loading,
    error,
    filters,
    setFilters,
    refetch: () => fetchData(),
    create,
    update,
    delete: deleteRecord,
    pagination
  };
}

// ✅ Usage Example: Complete separation of concerns
function IncidentListContainer() {
  const { 
    data: incidents, 
    loading, 
    error, 
    setFilters, 
    refetch,
    update 
  } = useServiceNowTable<Incident>({
    tableName: 'incident',
    initialFilters: { priority: '1,2', state: 'new,in_progress' }
  });

  const handlePriorityFilter = (priority: string) => {
    setFilters(prev => ({ ...prev, priority }));
  };

  const handleUpdateIncident = async (sysId: string, updates: Partial<Incident>) => {
    try {
      await update(sysId, updates);
      // Data automatically refreshes
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  return (
    <IncidentList
      incidents={incidents}
      loading={loading}
      error={error}
      onRefresh={refetch}
      onItemUpdate={handleUpdateIncident}
      onFilterChange={handlePriorityFilter}
    />
  );
}
```

### **useServiceNowRecord - Single Record Management**
```tsx
interface UseServiceNowRecordOptions {
  tableName: string;
  sysId: string;
  autoFetch?: boolean;
}

/**
 * Custom hook for managing a single ServiceNow record
 * 
 * Handles fetching, updating, and error states for individual records.
 * Perfect for detail views and edit forms.
 * 
 * @param options - Configuration with table name and record ID
 * @returns Record data, loading state, and update function
 * 
 * @example
 * ```tsx
 * function IncidentDetailView({ incidentId }: { incidentId: string }) {
 *   const { record: incident, loading, update } = useServiceNowRecord({
 *     tableName: 'incident',
 *     sysId: incidentId
 *   });
 *   
 *   if (loading) return <LoadingSpinner />;
 *   
 *   return (
 *     <IncidentForm 
 *       incident={incident}
 *       onSave={(updates) => update(updates)}
 *     />
 *   );
 * }
 * ```
 */
function useServiceNowRecord<T = any>(options: UseServiceNowRecordOptions) {
  const { tableName, sysId, autoFetch = true } = options;
  
  const [record, setRecord] = useState<T | null>(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const { service, tokenReady, tokenError } = useSecureServiceNowService(tableName);

  const fetchRecord = useCallback(async () => {
    if (!service || !tokenReady || !sysId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await service.get(sysId);
      setRecord(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch record');
      setRecord(null);
    } finally {
      setLoading(false);
    }
  }, [service, tokenReady, sysId]);

  const updateRecord = useCallback(async (updates: Partial<T>): Promise<T> => {
    if (!service || !sysId) throw new Error('Service or sysId not available');
    
    try {
      const result = await service.update(sysId, updates);
      setRecord(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed';
      setError(message);
      throw new Error(message);
    }
  }, [service, sysId]);

  useEffect(() => {
    if (tokenError) {
      setError(tokenError);
      setLoading(false);
      return;
    }
    
    if (autoFetch) {
      fetchRecord();
    }
  }, [sysId, tokenError, autoFetch, fetchRecord]);

  return {
    record,
    loading,
    error,
    refetch: fetchRecord,
    update: updateRecord
  };
}
```

---

*Custom hooks are the foundation of reusable React applications. They encapsulate business logic, enable easy testing, and keep UI components focused on rendering. Master this pattern for cleaner, more maintainable ServiceNow applications.*