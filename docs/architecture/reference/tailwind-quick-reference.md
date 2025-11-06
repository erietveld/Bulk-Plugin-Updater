# Tailwind CSS Quick Reference for ServiceNow

**Purpose:** Fast reference for Tailwind CSS patterns and ServiceNow design system alignment  
**Read time:** ~4 minutes  
**Prerequisites:** [Styling Practices](../styling-practices.md)

---

## 🎨 ServiceNow Design System Classes

### **Quick Color Reference**
```tsx
// ServiceNow Primary Colors
'text-sn-primary-500'     // ServiceNow blue
'bg-sn-primary-500'       // Primary button background
'border-sn-primary-500'   // Primary borders

// ServiceNow Status Colors  
'text-sn-success-500'     // Success green
'text-sn-warning-500'     // Warning orange
'text-sn-error-500'       // Error red

// ServiceNow Priority Colors
'text-sn-priority-critical'  // Priority 1 - Critical
'text-sn-priority-high'      // Priority 2 - High
'text-sn-priority-medium'    // Priority 3 - Medium
'text-sn-priority-low'       // Priority 4 - Low

// ServiceNow State Colors
'text-sn-state-new'        // New state
'text-sn-state-assigned'   // Assigned state  
'text-sn-state-progress'   // In Progress
'text-sn-state-resolved'   // Resolved state
```

### **ServiceNow Spacing Scale**
```tsx
// ServiceNow Spacing (based on 8px grid)
'p-sn-xs'    // 4px padding
'p-sn-sm'    // 8px padding
'p-sn-md'    // 16px padding
'p-sn-lg'    // 24px padding
'p-sn-xl'    // 32px padding
'p-sn-2xl'   // 48px padding

// Same pattern for margin (m-), gap (gap-), etc.
'gap-sn-md'  // 16px gap
'm-sn-lg'    // 24px margin
```

### **ServiceNow Typography**
```tsx
// ServiceNow Font Sizes
'text-sn-xs'    // 12px
'text-sn-sm'    // 14px
'text-sn-base'  // 16px (default)
'text-sn-lg'    // 18px
'text-sn-xl'    // 20px
'text-sn-2xl'   // 24px

// ServiceNow Fonts
'font-sn-primary'  // Source Sans Pro
'font-sn-mono'     // Source Code Pro (for code/timestamps)
```

---

## 🧩 Common ServiceNow Component Patterns

### **ServiceNow Card Pattern**
```tsx
// Standard ServiceNow card
<div className="bg-white rounded-sn-lg border border-sn-secondary-200 shadow-sn-card p-sn-lg">
  {/* Card content */}
</div>

// Dark mode aware card
<div className="bg-white dark:bg-sn-secondary-800 border border-sn-secondary-200 dark:border-sn-secondary-700 rounded-sn-lg shadow-sn-card p-sn-lg">
  {/* Card content */}
</div>
```

### **ServiceNow Button Patterns**
```tsx
// Primary button
<button className="bg-sn-primary-500 hover:bg-sn-primary-600 text-white px-sn-lg py-sn-md rounded-sn-md font-medium transition-colors">
  Primary Action
</button>

// Secondary button  
<button className="bg-sn-secondary-100 hover:bg-sn-secondary-200 text-sn-secondary-900 px-sn-lg py-sn-md rounded-sn-md font-medium transition-colors">
  Secondary Action
</button>

// Outline button
<button className="border border-sn-secondary-300 hover:bg-sn-secondary-50 text-sn-secondary-900 px-sn-lg py-sn-md rounded-sn-md font-medium transition-colors">
  Outline Action
</button>
```

### **ServiceNow Form Patterns**
```tsx
// Form field container
<div className="space-y-2">
  <label className="block text-sn-sm font-medium text-sn-secondary-900">
    Field Label
  </label>
  <input className="w-full px-sn-md py-sn-sm border border-sn-secondary-300 rounded-sn-md focus:ring-2 focus:ring-sn-primary-500 focus:border-sn-primary-500" />
  <p className="text-sn-xs text-sn-secondary-500">Help text</p>
</div>
```

### **ServiceNow Status Badge Patterns**
```tsx
// Priority badge
<span className="inline-flex items-center px-sn-sm py-1 rounded-full text-sn-xs font-medium bg-sn-priority-critical/10 text-sn-priority-critical border border-sn-priority-critical/20">
  Critical
</span>

// State badge
<span className="inline-flex items-center px-sn-sm py-1 rounded-full text-sn-xs font-medium bg-sn-state-new/10 text-sn-state-new border border-sn-state-new/20">
  New
</span>
```

---

## 📱 Responsive ServiceNow Patterns

### **ServiceNow Grid Layouts**
```tsx
// Responsive card grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sn-lg">
  {items.map(item => <Card key={item.id} />)}
</div>

// ServiceNow portal layout
<div className="max-w-7xl mx-auto px-sn-lg py-sn-lg">
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-sn-lg">
    <aside className="lg:col-span-1">
      {/* Sidebar */}
    </aside>
    <main className="lg:col-span-3">
      {/* Main content */}
    </main>
  </div>
</div>
```

### **ServiceNow Mobile Patterns**
```tsx
// Mobile-first navigation
<nav className="block sm:hidden">
  {/* Mobile nav */}
</nav>
<nav className="hidden sm:block">
  {/* Desktop nav */}
</nav>

// Mobile-optimized cards
<div className="block sm:hidden space-y-sn-sm">
  {/* Mobile: stacked cards */}
</div>
<div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-sn-md">
  {/* Desktop: grid layout */}
</div>
```

---

## 🌓 Dark Mode Patterns

### **Theme-Aware Classes**
```tsx
// Text colors
'text-sn-secondary-900 dark:text-sn-secondary-100'

// Background colors
'bg-white dark:bg-sn-secondary-800'

// Border colors
'border-sn-secondary-200 dark:border-sn-secondary-700'

// Interactive states
'hover:bg-sn-secondary-50 dark:hover:bg-sn-secondary-700'
```

### **ServiceNow Theme Detection**
```tsx
// Theme provider usage
function ComponentWithTheme() {
  const { isDark } = useServiceNowTheme();
  
  return (
    <div className={cn(
      'rounded-sn-lg p-sn-lg',
      isDark 
        ? 'bg-sn-secondary-800 text-sn-secondary-100' 
        : 'bg-white text-sn-secondary-900'
    )}>
      Content adapts to ServiceNow theme
    </div>
  );
}
```

---

## 🛠️ Tailwind Utility Functions

### **className Merger (Required)**
```tsx
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage in components
<div className={cn(
  'base-classes',
  conditionalClasses && 'conditional-classes',
  variant === 'primary' && 'variant-classes',
  className // Allow parent override
)} />
```

### **ServiceNow Class Helpers**
```tsx
// ServiceNow-specific utilities
export function getServiceNowPriorityClasses(priority: string) {
  const baseClasses = 'inline-flex items-center px-sn-sm py-1 rounded-full text-sn-xs font-medium border';
  
  switch (priority) {
    case '1':
      return cn(baseClasses, 'bg-sn-priority-critical/10 text-sn-priority-critical border-sn-priority-critical/20');
    case '2': 
      return cn(baseClasses, 'bg-sn-priority-high/10 text-sn-priority-high border-sn-priority-high/20');
    case '3':
      return cn(baseClasses, 'bg-sn-priority-medium/10 text-sn-priority-medium border-sn-priority-medium/20');
    case '4':
      return cn(baseClasses, 'bg-sn-priority-low/10 text-sn-priority-low border-sn-priority-low/20');
    default:
      return cn(baseClasses, 'bg-sn-secondary-100 text-sn-secondary-700 border-sn-secondary-200');
  }
}

// Usage
<span className={getServiceNowPriorityClasses(incident.priority?.value || '3')}>
  Priority {incident.priority?.display_value}
</span>
```

---

## 🎯 Component Class Organization

### **Recommended Order**
```tsx
<div className={cn(
  // 1. Layout (display, position, flex, grid)
  'flex items-center justify-between',
  
  // 2. Box model (width, height, padding, margin)
  'w-full h-10 px-sn-lg py-sn-md',
  
  // 3. Typography
  'text-sn-base font-medium',
  
  // 4. Visual (background, border, shadow)
  'bg-white border border-sn-secondary-200 rounded-sn-lg shadow-sn-sm',
  
  // 5. Interactive (hover, focus, active)
  'hover:bg-sn-secondary-50 focus:ring-2 focus:ring-sn-primary-500',
  
  // 6. Responsive (sm:, md:, lg:)
  'sm:w-auto lg:px-sn-xl',
  
  // 7. Dark mode
  'dark:bg-sn-secondary-800 dark:border-sn-secondary-700',
  
  // 8. Conditional classes
  variant === 'primary' && 'bg-sn-primary-500 text-white',
  
  // 9. Parent-provided className (always last)
  className
)} />
```

---

## 🚀 Performance Tips

### **JIT Mode Configuration**
```javascript
// tailwind.config.js
module.exports = {
  mode: 'jit', // Just-in-time compilation
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  // ... rest of config
}
```

### **Safelist Critical ServiceNow Classes**
```javascript
// tailwind.config.js
module.exports = {
  safelist: [
    // Dynamic ServiceNow classes that might not be detected
    'text-sn-priority-critical',
    'text-sn-priority-high',
    'text-sn-priority-medium', 
    'text-sn-priority-low',
    'bg-sn-priority-critical/10',
    'bg-sn-priority-high/10',
    'bg-sn-priority-medium/10',
    'bg-sn-priority-low/10',
    // Add patterns that are generated dynamically
    {
      pattern: /^(text|bg|border)-sn-(priority|state)-.*/
    }
  ]
}
```

---

## ❌ Common Pitfalls

### **Don't Do This:**
```tsx
// ❌ BAD: Arbitrary values instead of design system
<div className="p-[13px] text-[#1f2937] bg-[#f8fafc]" />

// ❌ BAD: Inconsistent spacing
<div className="p-3 mb-5 gap-2" />

// ❌ BAD: Missing dark mode
<div className="bg-white text-black" />

// ❌ BAD: No responsive design
<div className="w-64 p-8" />
```

### **Do This Instead:**
```tsx
// ✅ GOOD: ServiceNow design system tokens
<div className="p-sn-md text-sn-secondary-900 bg-sn-secondary-50" />

// ✅ GOOD: Consistent ServiceNow spacing
<div className="p-sn-md mb-sn-lg gap-sn-sm" />

// ✅ GOOD: Dark mode support
<div className="bg-white dark:bg-sn-secondary-800 text-sn-secondary-900 dark:text-sn-secondary-100" />

// ✅ GOOD: Mobile-first responsive
<div className="w-full sm:w-64 p-sn-md sm:p-sn-lg" />
```

---

## 🔗 Quick Links

**Essential Reading:**
- [Styling Practices](../styling-practices.md) - Complete Tailwind CSS guide
- [Component Reusability](../component-reusability.md) - How styling fits into components

**Related Patterns:**
- [Atomic Design](../patterns/atomic-design.md) - Styling atomic components
- [File Organization](../patterns/file-organization.md) - Where to put Tailwind configs

**ServiceNow Integration:**
- [ServiceNow Integration](../servicenow-integration.md) - Portal theming considerations

---

*Use ServiceNow design system tokens consistently across all components. Prioritize mobile-first responsive design and dark mode support for complete ServiceNow portal compatibility.*