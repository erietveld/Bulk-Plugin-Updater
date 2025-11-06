---
title: "Pattern 4: State Management"
version: "2025.1.2"
purpose: "Zustand with hybrid data optimization and performance patterns"
readTime: "4 minutes"
complexity: "intermediate"
prerequisites: ["zustand-basics", "react-state-management"]
concepts: ["state-optimization", "selective-hooks", "pagination-state", "filter-management"]
codeExamples: 3
completeness: 100
testability: true
productionReady: true
---

# Pattern 4: State Management

**Purpose:** Zustand with hybrid data optimization and performance patterns  
**Read time:** ~4 minutes  
**Problem:** Complex state management with performance bottlenecks and re-render issues

---

## 🚨 Problem Statement

### **State Management Challenges:**
- Multiple components re-rendering unnecessarily
- Complex filter and pagination state
- Integration with ServiceNow hybrid data patterns
- Performance issues with large datasets

---

## ✅ Solution: Performance-Optimized Zustand

### **Complete Store Implementation:**
```typescript
// stores/filtersStore.ts - PATTERN: Optimized state management
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface FilterState {
  filters: IncidentFilters;
  quickFilters: {
    myIncidents: boolean;
    highPriority: boolean;
    unassigned: boolean;
  };
  pagination: PaginationState;
  
  // Actions
  setFilter: (key: keyof IncidentFilters, value: any) => void;
  toggleQuickFilter: (filter: keyof FilterState['quickFilters']) => void;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  getServiceNowQuery: (currentUserSysId?: string) => string;
}

export const useFiltersStore = create<FilterState>()(
  subscribeWithSelector((set, get) => ({
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
    },

    setFilter: (key, value) => {
      set((state) => ({
        filters: { ...state.filters, [key]: value },
        pagination: { ...state.pagination, currentPage: 1 }
      }));
    },

    toggleQuickFilter: (filter) => {
      set((state) => ({
        quickFilters: {
          ...state.quickFilters,
          [filter]: !state.quickFilters[filter]
        },
        pagination: { ...state.pagination, currentPage: 1 }
      }));
    },

    setCurrentPage: (page) => {
      set((state) => ({
        pagination: { ...state.pagination, currentPage: page }
      }));
    },

    getServiceNowQuery: (currentUserSysId) => {
      const { filters, quickFilters } = get();
      const queryParts: string[] = [];

      if (filters.search?.trim()) {
        queryParts.push(`short_descriptionLIKE${filters.search}`);
      }

      if (quickFilters.myIncidents && currentUserSysId) {
        queryParts.push(`assigned_to=${currentUserSysId}`);
      }

      if (quickFilters.highPriority) {
        queryParts.push(`priorityIN1,2`);
      }

      if (quickFilters.unassigned) {
        queryParts.push(`assigned_toISEMPTY`);
      }

      return queryParts.join('^');
    },
  }))
);

// PERFORMANCE: Selective hooks to prevent unnecessary re-renders
export const useActiveFilters = () => useFiltersStore(state => state.filters);
export const useQuickFilters = () => useFiltersStore(state => state.quickFilters);
export const usePagination = () => useFiltersStore(state => state.pagination);
```

### **Hybrid Data Integration:**
```typescript
// stores/appStore.ts - PATTERN: Hybrid data consumption
import { create } from 'zustand';

interface AppState {
  // Pattern 2A: Immediate data from window.snUserContext
  user: {
    userName: string;
    userId: string;
    displayName: string;
    isAdmin: boolean;
  };
  
  // Pattern 2B: Enhanced data from window.enhancedUserData
  analytics: {
    totalIncidents: number;
    openIncidents: number;
    resolutionRate: number;
  };
  
  // Initialization
  isInitialized: boolean;
}

const getInitialState = (): Omit<AppState, 'isInitialized'> => {
  const userContext = window.snUserContext;
  const enhancedData = window.enhancedUserData;
  
  return {
    user: {
      userName: userContext?.userName || 'unknown',
      userId: userContext?.userId || '',
      displayName: userContext?.userDisplayName || 'Unknown User',
      isAdmin: userContext?.isAdmin || false,
    },
    analytics: {
      totalIncidents: enhancedData?.incidentAnalytics?.totalIncidents || 0,
      openIncidents: enhancedData?.incidentAnalytics?.openIncidents || 0,
      resolutionRate: enhancedData?.incidentAnalytics?.resolutionRate || 0,
    },
  };
};

export const useAppStore = create<AppState>(() => ({
  ...getInitialState(),
  isInitialized: true,
}));

// Selective hooks for performance
export const useUserName = () => useAppStore(state => state.user.displayName);
export const useIsAdmin = () => useAppStore(state => state.user.isAdmin);
export const useUserAnalytics = () => useAppStore(state => state.analytics);
```

---

## 🧪 Validation & Testing

### **Performance Testing:**
```typescript
// Test selective hook performance
describe('State Management Performance', () => {
  it('should only re-render when specific state changes', () => {
    const renderCount = jest.fn();
    
    function TestComponent() {
      const userName = useUserName();
      renderCount();
      return <div>{userName}</div>;
    }
    
    render(<TestComponent />);
    
    // Change unrelated state
    act(() => {
      useFiltersStore.getState().setCurrentPage(2);
    });
    
    // Should not trigger re-render
    expect(renderCount).toHaveBeenCalledTimes(1);
  });
});
```

---

*State management pattern provides optimal performance through selective subscriptions and hybrid data integration.*