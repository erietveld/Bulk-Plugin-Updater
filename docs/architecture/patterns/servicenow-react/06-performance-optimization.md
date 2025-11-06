---
title: "Pattern 6: Performance Optimization"
version: "2025.1.2"
purpose: "React.memo, useMemo, useCallback, and debouncing for optimal performance"
readTime: "4 minutes"
complexity: "intermediate"
prerequisites: ["react-performance", "usememo-usecallback"]
concepts: ["memoization", "debouncing", "render-optimization", "performance-monitoring"]
codeExamples: 4
completeness: 100
testability: true
productionReady: true
---

# Pattern 6: Performance Optimization

**Purpose:** React.memo, useMemo, useCallback, and debouncing for optimal performance  
**Read time:** ~4 minutes  
**Problem:** Unnecessary re-renders, expensive calculations, and slow user interactions

---

## 🚨 Problem Statement

### **Performance Issues:**
- Components re-rendering on every state change
- Expensive calculations running repeatedly
- Slow filter/search responses
- Memory leaks and performance degradation over time

---

## ✅ Solution: Comprehensive Performance Optimization

### **React.memo for Component Optimization:**
```typescript
// components/DataGrid.tsx - PATTERN: Memoized expensive components
import React, { memo, useMemo, useCallback } from 'react';

interface DataGridProps {
  incidents: Incident[];
  loading?: boolean;
  onIncidentSelect?: (incident: Incident) => void;
}

export const DataGrid = memo<DataGridProps>(({
  incidents,
  loading,
  onIncidentSelect
}) => {
  // PERFORMANCE: Memoize expensive calculations
  const summaryStats = useMemo(() => {
    if (!incidents?.length) return null;

    return incidents.reduce((stats, incident) => {
      const priority = value(incident.priority);
      const state = value(incident.state);
      
      if (priority === '1' || priority === '2') stats.highPriority++;
      if (!value(incident.assigned_to)) stats.unassigned++;
      if (state === '2') stats.inProgress++;
      
      return stats;
    }, { highPriority: 0, unassigned: 0, inProgress: 0 });
  }, [incidents]);

  // PERFORMANCE: Memoize event handlers
  const handleIncidentClick = useCallback((incident: Incident) => {
    onIncidentSelect?.(incident);
  }, [onIncidentSelect]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="data-grid-container">
      {summaryStats && (
        <div className="data-grid-summary">
          <span>High Priority: {summaryStats.highPriority}</span>
          <span>Unassigned: {summaryStats.unassigned}</span>
          <span>In Progress: {summaryStats.inProgress}</span>
        </div>
      )}

      <table className="data-grid">
        <tbody>
          {incidents.map((incident) => (
            <IncidentRow
              key={value(incident.sys_id)}
              incident={incident}
              onClick={handleIncidentClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});

// PERFORMANCE: Separate memoized row component
const IncidentRow = memo<{
  incident: Incident;
  onClick: (incident: Incident) => void;
}>(({ incident, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(incident);
  }, [incident, onClick]);

  return (
    <tr className="data-grid-row" onClick={handleClick}>
      <td>{display(incident.number)}</td>
      <td>{display(incident.short_description)}</td>
      <td>{display(incident.priority)}</td>
      <td>{display(incident.state)}</td>
    </tr>
  );
});

DataGrid.displayName = 'DataGrid';
IncidentRow.displayName = 'IncidentRow';
```

### **Debounced Filter Implementation:**
```typescript
// components/FilterPanel.tsx - PATTERN: Debounced user input
import React, { useMemo, useCallback } from 'react';

// UTILITY: Debounce function for performance
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export const FilterPanel = memo<FilterPanelProps>(({ 
  incidents = [], 
  onApplyFilters 
}) => {
  const { setFilter, toggleQuickFilter } = useFiltersStore();

  // PERFORMANCE: Memoized user extraction from incidents
  const assignedToOptions = useMemo((): UserOption[] => {
    const userMap = new Map<string, string>();
    
    incidents.forEach(incident => {
      const assignedToValue = value(incident.assigned_to);
      const assignedToDisplay = display(incident.assigned_to);
      
      if (assignedToValue && assignedToDisplay) {
        userMap.set(assignedToValue, assignedToDisplay);
      }
    });
    
    return Array.from(userMap.entries())
      .map(([sysId, displayName]) => ({ value: sysId, label: displayName }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [incidents]);

  // PERFORMANCE: Debounced filter application (300ms delay)
  const debouncedApplyFilters = useMemo(
    () => debounce(onApplyFilters || (() => {}), 300),
    [onApplyFilters]
  );

  // PERFORMANCE: Optimized quick filter handler
  const handleQuickFilterClick = useCallback((
    filterKey: string, 
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();
    
    toggleQuickFilter(filterKey as any);
    
    // Auto-apply with debounce
    setTimeout(() => debouncedApplyFilters(), 100);
  }, [toggleQuickFilter, debouncedApplyFilters]);

  // PERFORMANCE: Debounced search input
  const handleSearchChange = useCallback((
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    setFilter('search', value || undefined);
    debouncedApplyFilters();
  }, [setFilter, debouncedApplyFilters]);

  return (
    <div className="filter-panel">
      {/* Quick filters with optimized handlers */}
      <div className="quick-filters">
        <button
          type="button"
          className="quick-filter-button"
          onClick={(e) => handleQuickFilterClick('highPriority', e)}
        >
          🚨 High Priority
        </button>
        <button
          type="button"
          className="quick-filter-button"
          onClick={(e) => handleQuickFilterClick('unassigned', e)}
        >
          ❓ Unassigned
        </button>
      </div>

      {/* Search with debounced input */}
      <div className="form-group">
        <input
          type="text"
          placeholder="Search incidents..."
          onChange={handleSearchChange}
          className="input"
        />
      </div>

      {/* User dropdown with memoized options */}
      <div className="form-group">
        <select
          onChange={(e) => {
            setFilter('assigned_to', e.target.value || undefined);
            debouncedApplyFilters();
          }}
          className="select"
        >
          <option value="">All Users ({assignedToOptions.length})</option>
          {assignedToOptions.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
});

FilterPanel.displayName = 'FilterPanel';
```

### **Performance Monitoring Hook:**
```typescript
// hooks/usePerformanceMonitor.ts - PATTERN: Development performance tracking
import { useEffect, useRef, useCallback } from 'react';

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const slowRenders = useRef(0);

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const renderTime = now - lastRenderTime.current;
    
    // Track slow renders (>100ms)
    if (renderTime > 100) {
      slowRenders.current++;
      console.warn(`🐌 Slow render in ${componentName}: ${renderTime}ms`);
    }
    
    lastRenderTime.current = now;
    
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} render #${renderCount.current} (${renderTime}ms)`);
    }
  });

  const measureOperation = useCallback(async <T>(
    operationName: string,
    operation: () => Promise<T> | T
  ): Promise<T> => {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    
    if (duration > 50) {
      console.warn(`⏱️ Slow operation in ${componentName}.${operationName}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    slowRenders: slowRenders.current,
    measureOperation,
    isPerformant: slowRenders.current === 0
  };
}
```

---

## 🧪 Performance Validation

### **Performance Testing:**
```typescript
// Test performance optimizations
describe('Performance Optimization', () => {
  it('should not re-render when unrelated props change', () => {
    const renderSpy = jest.fn();
    
    function TestComponent({ incidents }: { incidents: Incident[] }) {
      usePerformanceMonitor('TestComponent');
      renderSpy();
      return <DataGrid incidents={incidents} />;
    }
    
    const { rerender } = render(<TestComponent incidents={mockIncidents} />);
    
    // Change unrelated prop
    rerender(<TestComponent incidents={mockIncidents} />);
    
    // Should not trigger additional renders due to memoization
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
  
  it('should debounce filter changes', async () => {
    const applySpy = jest.fn();
    
    render(<FilterPanel onApplyFilters={applySpy} />);
    
    const input = screen.getByPlaceholderText('Search incidents...');
    
    // Rapid typing
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });
    
    // Should only call once after debounce
    await waitFor(() => expect(applySpy).toHaveBeenCalledTimes(1), { timeout: 500 });
  });
});
```

---

*Performance optimization pattern ensures smooth user interactions and efficient resource usage through strategic memoization and debouncing.*