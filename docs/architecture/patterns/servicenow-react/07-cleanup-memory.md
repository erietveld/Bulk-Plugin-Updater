---
title: "Pattern 7: Cleanup & Memory Management"
version: "2025.1.2"
purpose: "Essential patterns for preventing memory leaks and resource management"
readTime: "4 minutes"
complexity: "intermediate"
prerequisites: ["react-effects", "javascript-memory-management"]
concepts: ["abort-controller", "effect-cleanup", "cache-management", "resource-cleanup"]
codeExamples: 4
completeness: 100
testability: true
productionReady: true
---

# Pattern 7: Cleanup & Memory Management

**Purpose:** Essential patterns for preventing memory leaks and resource management  
**Read time:** ~4 minutes  
**Problem:** Memory leaks from event listeners, timers, API requests, and cache accumulation

---

## 🚨 Problem Statement

### **Memory Management Issues:**
- Unaborted API requests continuing after component unmount
- Event listeners not being cleaned up
- Timers and intervals running indefinitely
- Query cache growing without bounds
- State subscriptions persisting after unmount

---

## ✅ Solution: Comprehensive Cleanup Patterns

### **Effect Cleanup with AbortController:**
```typescript
// hooks/useApiCleanup.ts - PATTERN: Proper API request cleanup
import { useEffect, useRef, useCallback } from 'react';

export function useIncidentsWithCleanup() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CLEANUP: API calls with abort controller
  const fetchIncidents = useCallback(async (filters?: IncidentFilters) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/now/table/incident', {
        signal: abortControllerRef.current.signal,
        headers: {
          'Accept': 'application/json',
          'X-UserToken': window.g_ck
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIncidents(data.result);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // CLEANUP: Effect with comprehensive cleanup
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        await fetchIncidents();
      } catch (error) {
        if (mounted) {
          setError(error.message);
        }
      }
    };

    loadData();

    // CRITICAL: Cleanup function
    return () => {
      mounted = false;
      
      // Cancel ongoing API request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clear any timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fetchIncidents]);

  // CLEANUP: Component unmount cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { incidents, loading, error, refetch: fetchIncidents };
}
```

### **Event Listener Cleanup:**
```typescript
// hooks/useEventCleanup.ts - PATTERN: Event listener management
import { useEffect } from 'react';

export function useServiceNowEvents() {
  useEffect(() => {
    const handleServiceNowUpdate = (event: CustomEvent) => {
      console.log('ServiceNow update received:', event.detail);
    };

    const handleWindowResize = () => {
      // Handle resize for responsive components
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause expensive operations when tab is hidden
      } else {
        // Resume operations when tab becomes visible
      }
    };

    const handleBeforeUnload = () => {
      // Clean up sensitive data before page unload
      if (window.useFiltersStore) {
        window.useFiltersStore.getState().clearSensitiveData?.();
      }
    };

    // Add event listeners
    window.addEventListener('servicenow:update', handleServiceNowUpdate as EventListener);
    window.addEventListener('resize', handleWindowResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // CRITICAL: Remove event listeners
    return () => {
      window.removeEventListener('servicenow:update', handleServiceNowUpdate as EventListener);
      window.removeEventListener('resize', handleWindowResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}
```

### **Query Cache Management:**
```typescript
// hooks/useServiceNowCacheCleanup.ts - PATTERN: TanStack Query cache management
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';

export function useServiceNowCacheCleanup() {
  const queryClient = useQueryClient();

  const clearIncidentCache = useCallback(() => {
    queryClient.removeQueries(['incidents']);
    console.log('🧹 Cleared incident cache');
  }, [queryClient]);

  const clearAllServiceNowCache = useCallback(() => {
    queryClient.removeQueries(['servicenow']);
    console.log('🧹 Cleared all ServiceNow cache');
  }, [queryClient]);

  // CLEANUP: Auto-cleanup stale queries
  useEffect(() => {
    const cleanup = setInterval(() => {
      // Remove queries older than 30 minutes
      queryClient.getQueryCache().getAll().forEach(query => {
        const dataUpdatedAt = query.state.dataUpdatedAt;
        const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
        
        if (dataUpdatedAt < thirtyMinutesAgo) {
          queryClient.removeQueries(query.queryKey);
          console.log('🧹 Cleaned up stale query:', query.queryKey);
        }
      });
    }, 10 * 60 * 1000); // Run every 10 minutes

    return () => clearInterval(cleanup);
  }, [queryClient]);

  // CLEANUP: Cache size monitoring (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const monitor = setInterval(() => {
        const cacheSize = queryClient.getQueryCache().getAll().length;
        if (cacheSize > 50) {
          console.warn(`📊 Large query cache detected: ${cacheSize} queries`);
        }
      }, 60 * 1000); // Check every minute

      return () => clearInterval(monitor);
    }
  }, [queryClient]);

  return {
    clearIncidentCache,
    clearAllServiceNowCache,
  };
}
```

### **Store Cleanup with Zustand:**
```typescript
// stores/filtersStore.ts - PATTERN: Enhanced store with cleanup
export const useFiltersStore = create<FilterState>()(
  subscribeWithSelector((set, get) => ({
    // ... existing store implementation

    // CLEANUP: Reset store to defaults
    resetStore: () => {
      console.log('🧹 Resetting filters store');
      set({
        filters: {},
        quickFilters: {
          myIncidents: false,
          highPriority: false,
          unassigned: false,
        },
        pagination: {
          currentPage: 1,
          pageSize: 25,
          totalRecords: 0,
          totalPages: 0,
        }
      });
    },

    // CLEANUP: Clear sensitive data
    clearSensitiveData: () => {
      console.log('🧹 Clearing sensitive filter data');
      set((state) => ({
        ...state,
        filters: {
          ...state.filters,
          assigned_to: undefined,
          caller_id: undefined,
        }
      }));
    },

    // CLEANUP: Memory usage validation (development)
    validateMemoryUsage: () => {
      if (process.env.NODE_ENV === 'development') {
        const state = get();
        const stateSize = JSON.stringify(state).length;
        
        if (stateSize > 10000) { // 10KB threshold
          console.warn('⚠️ Large store state detected:', stateSize, 'bytes');
        }
      }
    }
  }))
);

// CLEANUP: Hook for store cleanup
export function useStoreCleanup() {
  const resetStore = useFiltersStore(state => state.resetStore);
  const clearSensitiveData = useFiltersStore(state => state.clearSensitiveData);

  useEffect(() => {
    // Cleanup on page unload
    const handleBeforeUnload = () => {
      clearSensitiveData();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [clearSensitiveData]);

  return { resetStore, clearSensitiveData };
}
```

---

## 🧪 Cleanup Validation

### **Memory Leak Testing:**
```typescript
// Test cleanup effectiveness
describe('Cleanup & Memory Management', () => {
  it('should abort API requests on component unmount', () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    
    const { unmount } = render(<ComponentWithAPI />);
    
    unmount();
    
    expect(abortSpy).toHaveBeenCalled();
  });
  
  it('should remove event listeners on cleanup', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(<ComponentWithEvents />);
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
  
  it('should clear query cache when requested', () => {
    const { result } = renderHook(() => useServiceNowCacheCleanup(), {
      wrapper: QueryClientProvider
    });
    
    act(() => {
      result.current.clearIncidentCache();
    });
    
    const cache = queryClient.getQueryData(['incidents']);
    expect(cache).toBeUndefined();
  });
});
```

### **Memory Usage Monitoring:**
```typescript
// Development utility for memory monitoring
export function useMemoryMonitor(componentName: string) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && performance.memory) {
      const logMemory = () => {
        const memory = performance.memory;
        console.log(`📊 ${componentName} Memory:`, {
          used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
          total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
        });
      };

      const interval = setInterval(logMemory, 30000); // Every 30 seconds

      return () => clearInterval(interval);
    }
  }, [componentName]);
}
```

---

*Cleanup and memory management patterns ensure production stability by preventing memory leaks and properly managing resources throughout the application lifecycle.*