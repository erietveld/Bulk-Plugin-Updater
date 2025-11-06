---
title: "Pattern 3: CSS Implementation"
version: "2025.1.3"
lastUpdated: "2025.1.3"
purpose: "Plain CSS with component classes for ServiceNow compatibility"
readTime: "3 minutes"
complexity: "beginner"
prerequisites: ["css-fundamentals", "servicenow-ui-basics"]
concepts: ["css-import-order", "component-classes", "design-tokens", "responsive-design"]
codeExamples: 4
completeness: 100
testability: true
productionReady: true
role: "essential-pattern-css"
---

# Pattern 3: CSS Implementation

**Purpose:** Plain CSS with component classes for ServiceNow compatibility  
**Read time:** ~3 minutes  
**Problem:** CSS conflicts, loading order issues, and ServiceNow UI inconsistencies

---

## 🎯 **Pattern Role: CSS Architecture within Essential Patterns**

**This pattern provides:**
- ✅ **CSS pattern implementation** as part of the 8 Essential Patterns
- ✅ **ServiceNow compatibility** requirements and constraints
- ✅ **Integration guidance** with other Essential Patterns
- ✅ **Pattern validation** and testing approach

**For comprehensive CSS guidance:**
- **Complete CSS strategy & design system:** [ServiceNow CSS Strategy](../../styling-practices.md)
- **Step-by-step implementation:** [ServiceNow CSS Implementation Guide](../../servicenow-css-implementation-guide.md)
- **All Essential Patterns:** [ServiceNow React Essential Patterns](../../servicenow-react-essential-patterns.md)

---

## 🚨 Problem Statement

### **Common CSS Issues:**
- External frameworks conflict with ServiceNow UI
- CSS loading order causes styling inconsistencies
- Responsive design breaks in ServiceNow frames
- Component styles leak to other parts of the platform

### **Impact:**
- **Visual Inconsistency** - Broken layouts and styling conflicts
- **Performance Issues** - Large CSS bundles and unused styles
- **Maintenance Complexity** - Hard to debug styling issues

---

## ✅ Solution: Component-Based CSS Architecture

### **File Structure & Import Order:**
```
src/client/styles/
├── globals.css           # 🥇 FIRST: Core design system
├── user-context.css      # 🥈 SECOND: Context-specific styles  
├── incidents-overview.css # 🥉 THIRD: Page-specific styles
├── error-boundary.css    # 🛡️ FOURTH: Error boundary styles
└── components/           # Component-specific CSS
    ├── data-grid.css
    ├── filter-panel.css
    └── pagination.css
```

### **Critical Import Order in App:**
```typescript
// app.tsx - CRITICAL: CSS imports in exact order
import './styles/globals.css';           // 🥇 FIRST: Base design system
import './styles/user-context.css';      // 🥈 SECOND: Context styles
import './styles/incidents-overview.css'; // 🥉 THIRD: Page-specific styles
import './styles/error-boundary.css';    // 🛡️ FOURTH: Error boundary styles
```

---

## 🎨 Complete CSS Implementation

### **globals.css - Foundation Design System:**
```css
/* globals.css - Core design system with ServiceNow compatibility */

:root {
  /* DESIGN TOKENS: ServiceNow-compatible color palette */
  --color-primary: #0073e6;
  --color-primary-hover: #005bb5;
  --color-success: #28a745;
  --color-warning: #ffc107;
  --color-danger: #dc3545;
  --color-info: #17a2b8;
  
  /* NEUTRAL COLORS: Gray scale for text and backgrounds */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-900: #111827;
  
  /* SPACING: Consistent spacing scale */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  
  /* TYPOGRAPHY: ServiceNow-compatible font stack */
  --font-family: system-ui, -apple-system, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  
  /* BORDERS & SHADOWS */
  --border-radius: 0.375rem;
  --border-color: var(--color-gray-200);
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* RESET: Minimal reset for consistency */
*, *::before, *::after {
  box-sizing: border-box;
}

/* BASE STYLES: Foundation typography and layout */
.app-container {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: 1.5;
  color: var(--color-gray-700);
  background-color: var(--color-gray-50);
  min-height: 100vh;
}

/* COMPONENT CLASSES: Reusable UI components */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}

.card {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-sm);
}

.card-elevated {
  box-shadow: var(--shadow-md);
}

/* LAYOUT UTILITIES: Flexbox and grid helpers */
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }

/* RESPONSIVE: Mobile-first breakpoints */
@media (min-width: 768px) {
  .md\:flex-row { flex-direction: row; }
  .md\:gap-lg { gap: var(--spacing-lg); }
}
```

### **incidents-overview.css - Page-Specific Styles:**
```css
/* incidents-overview.css - Complete page implementation */

/* PAGE LAYOUT: Main container and sections */
.incidents-overview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  max-width: 1200px;
  margin: 0 auto;
}

/* FILTER PANEL: Search and filter interface */
.filter-panel {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
}

.filter-section {
  margin-bottom: var(--spacing-lg);
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-section-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-sm);
}

.quick-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.quick-filter-button {
  padding: 0.375rem 0.75rem;
  background: var(--color-gray-100);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-filter-button:hover {
  background: var(--color-gray-200);
}

.quick-filter-button.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

/* DATA GRID: Table layout with performance optimization */
.data-grid-container {
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.data-grid {
  width: 100%;
  border-collapse: collapse;
}

.data-grid th,
.data-grid td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--color-gray-200);
}

.data-grid th {
  background: var(--color-gray-50);
  font-weight: 600;
  color: var(--color-gray-900);
  font-size: var(--font-size-sm);
}

.data-grid-row {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.data-grid-row:hover {
  background: var(--color-gray-50);
}

/* PAGINATION: Complete pagination implementation */
.pagination-container {
  padding: var(--spacing-lg);
  background: var(--color-gray-50);
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

@media (min-width: 768px) {
  .pagination-container {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.pagination-info {
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  align-items: center;
}

@media (min-width: 768px) {
  .pagination-controls {
    flex-direction: row;
    gap: var(--spacing-lg);
  }
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid var(--border-color);
  background: white;
  color: var(--color-gray-700);
  font-size: var(--font-size-sm);
  font-weight: 500;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-page:hover {
  background: var(--color-gray-100);
}

.pagination-page.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.pagination-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* RESPONSIVE: Mobile optimizations */
@media (max-width: 768px) {
  .incidents-overview {
    padding: var(--spacing-md);
    gap: var(--spacing-md);
  }
  
  .filter-panel {
    padding: var(--spacing-md);
  }
  
  .quick-filters {
    flex-direction: column;
  }
  
  .quick-filter-button {
    width: 100%;
    justify-content: center;
  }
  
  .data-grid th,
  .data-grid td {
    padding: 0.5rem;
    font-size: var(--font-size-sm);
  }
  
  .pagination-buttons {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
}
```

---

## 🔗 **Essential Patterns Integration**

### **Pattern Dependencies:**
- **Pattern 1: Initialization** → Ensures CSS loads after ServiceNow globals
- **Pattern 2: Data Patterns** → CSS classes for data display states
- **Pattern 4: State Management** → CSS classes for UI state changes
- **Pattern 8: Error Handling** → CSS for error boundary styling

### **Component Integration:**
```tsx
// Pattern 3 integrates with other Essential Patterns
import { memo } from 'react'; // Pattern 6: Performance
import { cn } from '../../../utils/cn';

export const DataGrid = memo<DataGridProps>(({ incidents, className }) => {
  return (
    <div className={cn('data-grid-container', className)}>
      <table className="data-grid">
        <thead>
          <tr>
            <th>Number</th>
            <th>Priority</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map(incident => (
            <tr key={incident.sys_id} className="data-grid-row">
              <td>{incident.number}</td>
              <td>
                <span className={`badge badge-${getPriorityColor(incident.priority)}`}>
                  {incident.priority}
                </span>
              </td>
              <td>{incident.state}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
```

---

## 🧪 Validation & Testing

### **CSS Architecture Checklist:**
- [ ] **Import order correct** - globals.css first, page-specific last
- [ ] **Component classes used** - No inline styles
- [ ] **Design tokens consistent** - CSS custom properties throughout
- [ ] **Responsive design working** - Mobile-first breakpoints
- [ ] **No external dependencies** - Pure CSS only
- [ ] **ServiceNow compatibility** - No conflicts with platform UI

### **Pattern Integration Testing:**
```typescript
// Test CSS loading and component rendering
describe('Pattern 3: CSS Implementation', () => {
  it('should load styles in correct order', () => {
    const styleSheets = Array.from(document.styleSheets);
    const globalsIndex = styleSheets.findIndex(sheet => 
      sheet.href?.includes('globals.css')
    );
    const componentIndex = styleSheets.findIndex(sheet => 
      sheet.href?.includes('incidents-overview.css')
    );
    
    expect(globalsIndex).toBeLessThan(componentIndex);
  });
  
  it('should apply component classes correctly', () => {
    render(<button className="btn btn-primary">Test</button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('btn', 'btn-primary');
    expect(getComputedStyle(button).backgroundColor).toBe('rgb(0, 115, 230)');
  });
  
  it('should integrate with other Essential Patterns', () => {
    // Test Pattern 6 (Performance) integration
    const DataGridComponent = memo(() => <div className="data-grid" />);
    render(<DataGridComponent />);
    
    expect(screen.getByRole('generic')).toHaveClass('data-grid');
  });
});
```

### **Production Validation:**
```bash
# Essential Patterns CSS validation
npm run build                    # Must complete without errors
npm run deploy                   # Test in ServiceNow environment

# Verify CSS pattern implementation
# 1. Check import order in deployed app
# 2. Verify component classes render correctly
# 3. Test responsive design in ServiceNow frame
# 4. Confirm no styling conflicts with ServiceNow UI
```

---

## 📊 Pattern Benefits

### **ServiceNow Compatibility:**
- **No conflicts** - Isolated component styles work within ServiceNow UI
- **Frame-friendly** - CSS works properly in ServiceNow UI Pages context
- **Platform consistency** - Follows ServiceNow design principles

### **Essential Patterns Integration:**
- **Performance optimized** - Works with Pattern 6 memoization
- **Error boundary ready** - Styling for Pattern 8 error states
- **State management compatible** - CSS classes for Pattern 4 UI states

### **Maintainability:**
- **Clear separation** - Each CSS file has specific purpose within pattern system
- **Component classes** - Reusable styles across Essential Patterns implementation
- **Design tokens** - Consistent visual language supporting all patterns

---

## 📚 **Related Essential Patterns**

### **Direct Dependencies:**
- **[Pattern 1: Initialization](01-initialization-timing.md)** - CSS loads after ServiceNow ready
- **[Pattern 8: Error Handling](08-error-handling.md)** - Error boundary styling

### **Integration Partners:**
- **[Pattern 4: State Management](04-state-management.md)** - UI state classes
- **[Pattern 6: Performance](06-performance-optimization.md)** - Memoized components with CSS

### **Complete Pattern System:**
- **[ServiceNow React Essential Patterns](../../servicenow-react-essential-patterns.md)** - All 8 patterns with CSS integration

---

*Pattern 3 provides the visual foundation for ServiceNow React applications with optimal performance, maintainability, and seamless integration with all other Essential Patterns.*