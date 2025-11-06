---
title: "ServiceNow CSS Strategy: Plain CSS Component Classes"
version: "2025.1.3"
introduced: "2025.1.0"
lastUpdated: "2025.1.3"
purpose: "ServiceNow-compatible CSS architecture strategy with complete design system and validated approach options"  
readTime: "8 minutes"
complexity: "intermediate"
prerequisites: ["project-setup-guide", "atomic-design"]
criticality: "MANDATORY"
tags: ["styling", "css", "design-system", "servicenow", "component-classes", "strategy", "chakra-ui", "tailwind-cdn"]
role: "css-strategy-design-system"
---

# ServiceNow CSS Strategy: Plain CSS Component Classes

**Purpose:** ServiceNow-compatible CSS architecture strategy with complete design system and validated approach options  
**Read time:** ~8 minutes  
**Prerequisites:** [Project Setup Guide](project-setup-guide.md), [Atomic Design](patterns/atomic-design.md)

> **⚠️ CRITICAL:** Based on real ServiceNow development experience. **Updated with comprehensive validation findings.**

---

## 🎯 **Document Role: CSS Strategy & Complete Design System**

**This document provides:**
- ✅ **Strategic CSS approach** for ServiceNow React applications
- ✅ **Complete design system** with production-ready CSS classes
- ✅ **Validated approach options** based on comprehensive testing
- ✅ **Design tokens** and component class architecture

**For related CSS guidance:**
- **Step-by-step implementation:** [ServiceNow CSS Implementation Guide](servicenow-css-implementation-guide.md)
- **Pattern context:** [Pattern 3: CSS Implementation](patterns/servicenow-react/03-css-implementation.md)
- **Essential Patterns integration:** [ServiceNow React Essential Patterns](servicenow-react-essential-patterns.md)

---

## 🚨 **UPDATED: ServiceNow CSS Reality - Comprehensive Validation Results**

### **✅ What Works in ServiceNow - VALIDATED**

Based on comprehensive testing in ServiceNow environments, **three CSS approaches have been validated**:

#### **Approach 1: Plain CSS Component Classes (Recommended Primary)**
```css
/* ✅ WORKS: Plain CSS with component classes */
.card-elevated {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  transition: box-shadow 0.3s ease;
}

.card-elevated:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

**Why Plain CSS Works:**
- No build dependencies required
- ServiceNow-native CSS processing
- Predictable styling behavior
- Easy debugging and maintenance

#### **Approach 2: Chakra UI (CSS-in-JS) - NEWLY VALIDATED**
```tsx
/* ✅ WORKS: CSS-in-JS runtime processing validated in ServiceNow */
import { Box, Button } from '@chakra-ui/react';

function Component() {
  return (
    <Box bg="white" borderRadius="xl" shadow="lg" p={6}>
      <Button colorScheme="blue">Working in ServiceNow</Button>
    </Box>
  );
}
```

**Why Chakra UI Works:**
- Runtime CSS-in-JS processing in browser
- No ServiceNow build system conflicts
- Dynamic CSS classes generated: `css-nek2wy`, `chakra-button`
- Zero CSP policy violations

#### **Approach 3: Tailwind CSS via CDN - NEWLY VALIDATED**
```tsx
/* ✅ WORKS: CDN utilities functional in ServiceNow */
function Component() {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        CDN Utilities Working
      </button>
    </div>
  );
}
```

**Why Tailwind CDN Works:**
- All utility classes functional via CDN
- No ServiceNow build processing required
- Responsive and interactive states work perfectly

### **⚠️ CLARIFIED: ServiceNow Development Environment Reality**

**IMPORTANT CONTEXT:** ServiceNow development occurs in a **web-based IDE** (browser interface) with specific constraints:

```typescript
// ServiceNow IDE Environment Reality
interface ServiceNowIDEConstraints {
  environment: "web-based IDE running from ServiceNow instance";
  packageScripts: "not supported - shown in IDE popup message";
  commandLine: "not available in web-based environment";
  buildProcessing: "ServiceNow internal system only";
  
  // What this means for CSS:
  postCSSProcessing: "impossible - no build script execution";
  tailwindApply: "unavailable - requires build-time processing"; 
  cdnResources: "✅ work perfectly at runtime";
  cssInJS: "✅ works perfectly - runtime processing";
}
```

### **❌ What Doesn't Work - CLARIFIED**

```css
/* ❌ FAILS: Build-time Tailwind processing (not CDN utilities) */
@tailwind base;
@tailwind components;
@tailwind utilities;

.card-elevated {
  @apply bg-white rounded-xl shadow-lg border border-slate-200 p-6;
  /* @apply directives require PostCSS processing unavailable in ServiceNow web IDE */
}
```

**Why Build-Time Tailwind Fails:**
- ServiceNow web IDE doesn't execute package.json scripts
- PostCSS processing requires command line access
- `@apply` directives need build-time compilation
- Results in unprocessed, broken CSS

**NOTE:** This is different from Tailwind CDN utilities, which work perfectly.

---

## 🎯 **CSS Approach Decision Guide - NEWLY ADDED**

### **Choose Based on Project Priorities:**

| **Priority** | **Best Choice** | **Bundle Size** | **Dev Speed** | **Consistency** |
|--------------|----------------|-----------------|---------------|-----------------|
| **Bundle Size Critical** | Plain CSS | ~0KB | Slower | Manual |
| **Development Speed** | Chakra UI | ~200KB | Fastest | System |
| **Utility Workflow** | Tailwind CDN | ~CDN | Fast | System |
| **Accessibility Critical** | Chakra UI | ~200KB | Fastest | Built-in |
| **Full Control** | Plain CSS | ~0KB | Slower | Manual |

### **Decision Framework:**

```typescript
// Choose Plain CSS if:
const choosePlainCSS = {
  bundleSize: "critical constraint",
  teamSkills: "strong CSS expertise", 
  designNeeds: "simple and static",
  dependencies: "minimal external preferred"
};

// Choose Chakra UI if:
const chooseChakraUI = {
  developmentSpeed: "fastest velocity needed",
  accessibility: "built-in ARIA critical",
  componentLibrary: "pre-built components preferred",
  typescript: "excellent integration important"
};

// Choose Tailwind CDN if:
const chooseTailwindCDN = {
  utilityFirst: "preferred workflow",
  rapidPrototyping: "speed important",
  systemConsistency: "utility-enforced desired",
  buildComplexity: "want to avoid"
};
```

---

## ServiceNow Component-Class Architecture

### **Design System Structure**
```css
/* src/client/styles/globals.css - Complete ServiceNow design system */

/* ===========================================
   DESIGN TOKENS - ServiceNow Aligned
   =========================================== */
:root {
  /* ServiceNow Brand Colors */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-900: #1e3a8a;
  
  /* Neutral Palette */
  --color-slate-50: #f8fafc;
  --color-slate-100: #f1f5f9;
  --color-slate-200: #e2e8f0;
  --color-slate-300: #cbd5e1;
  --color-slate-600: #475569;
  --color-slate-700: #334155;
  --color-slate-800: #1e293b;
  --color-slate-900: #0f172a;
  
  /* Status Colors */
  --color-success-50: #f0fdf4;
  --color-success-500: #22c55e;
  --color-success-600: #16a34a;
  --color-warning-50: #fffbeb;
  --color-warning-500: #f59e0b;
  --color-error-50: #fef2f2;
  --color-error-500: #ef4444;
  
  /* Spacing Scale */
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-sm: 0.5rem;     /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */
  --spacing-2xl: 3rem;      /* 48px */
  
  /* Typography Scale */
  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-base: 1rem;    /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */
  --font-size-2xl: 1.5rem;   /* 24px */
  
  /* Border Radius */
  --radius-sm: 0.25rem;     /* 4px */
  --radius-md: 0.375rem;    /* 6px */
  --radius-lg: 0.5rem;      /* 8px */
  --radius-xl: 0.75rem;     /* 12px */
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: all 0.15s ease;
  --transition-normal: all 0.2s ease;
  --transition-slow: all 0.3s ease;
}

/* ===========================================
   BASE STYLES
   =========================================== */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  font-size: var(--font-size-base);
  line-height: 1.5;
  color: var(--color-slate-900);
  background-color: var(--color-slate-50);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ===========================================
   LAYOUT SYSTEM
   =========================================== */
.app-container {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-slate-50) 0%, var(--color-primary-50) 100%);
}

.page-wrapper {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-slate-900);
  margin: 0 0 var(--spacing-sm) 0;
}

.page-subtitle {
  font-size: var(--font-size-lg);
  color: var(--color-slate-600);
  margin: 0;
}

/* ===========================================
   CARD SYSTEM - Core Component Classes
   =========================================== */
.card {
  background-color: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-slate-200);
  padding: var(--spacing-lg);
  transition: var(--transition-slow);
}

.card-elevated {
  background-color: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-slate-200);
  padding: var(--spacing-lg);
  transition: var(--transition-slow);
}

.card-elevated:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}

.card-interactive {
  background-color: white;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-slate-200);
  padding: var(--spacing-lg);
  transition: var(--transition-normal);
  cursor: pointer;
}

.card-interactive:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-300);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-slate-900);
  margin: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.card-footer {
  display: flex;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-slate-100);
}

/* ===========================================
   BUTTON SYSTEM - Essential Interactions
   =========================================== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-lg);
  font-weight: 500;
  transition: var(--transition-normal);
  cursor: pointer;
  border: none;
  text-decoration: none;
  font-family: inherit;
}

.btn:focus {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Button Sizes */
.btn-sm {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.btn-md {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
}

.btn-lg {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-base);
}

/* Button Variants */
.btn-primary {
  background-color: var(--color-primary-600);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-700);
}

.btn-secondary {
  background-color: var(--color-slate-100);
  color: var(--color-slate-900);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-slate-200);
}

.btn-success {
  background-color: var(--color-success-600);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: var(--color-success-700);
}

.btn-outline {
  background-color: transparent;
  border: 1px solid var(--color-slate-300);
  color: var(--color-slate-700);
}

.btn-outline:hover:not(:disabled) {
  background-color: var(--color-slate-50);
}

/* ===========================================
   FORM SYSTEM - Data Input
   =========================================== */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-slate-700);
}

.input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-slate-300);
  border-radius: var(--radius-lg);
  background-color: white;
  font-size: var(--font-size-sm);
  transition: var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input:disabled {
  background-color: var(--color-slate-50);
  color: var(--color-slate-500);
  cursor: not-allowed;
}

.input-error {
  border-color: var(--color-error-500);
}

.input-error:focus {
  border-color: var(--color-error-500);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.textarea {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-slate-300);
  border-radius: var(--radius-lg);
  background-color: white;
  font-size: var(--font-size-sm);
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: var(--transition-fast);
}

.textarea:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-slate-300);
  border-radius: var(--radius-lg);
  background-color: white;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.select:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* ===========================================
   STATUS SYSTEM - Feedback and Badges
   =========================================== */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 9999px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  border: 1px solid transparent;
  transition: var(--transition-fast);
}

.badge-success {
  background-color: var(--color-success-50);
  color: var(--color-success-800);
  border-color: var(--color-success-200);
}

.badge-warning {
  background-color: var(--color-warning-50);
  color: var(--color-warning-800);
  border-color: var(--color-warning-200);
}

.badge-error {
  background-color: var(--color-error-50);
  color: var(--color-error-800);
  border-color: var(--color-error-200);
}

.badge-info {
  background-color: var(--color-primary-50);
  color: var(--color-primary-800);
  border-color: var(--color-primary-200);
}

.badge-default {
  background-color: var(--color-slate-100);
  color: var(--color-slate-800);
  border-color: var(--color-slate-200);
}

/* ===========================================
   LOADING SYSTEM
   =========================================== */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  text-align: center;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--color-slate-200);
  border-top: 3px solid var(--color-primary-600);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-message {
  margin-top: var(--spacing-md);
  color: var(--color-slate-600);
  font-size: var(--font-size-sm);
}

/* ===========================================
   ERROR HANDLING
   =========================================== */
.error-container {
  padding: var(--spacing-lg);
  background-color: var(--color-error-50);
  border: 1px solid var(--color-error-200);
  border-radius: var(--radius-lg);
  text-align: center;
}

.error-title {
  color: var(--color-error-800);
  font-weight: 600;
  margin: 0 0 var(--spacing-sm) 0;
}

.error-message {
  color: var(--color-error-700);
  margin: 0;
}

/* ===========================================
   RESPONSIVE GRID SYSTEM
   =========================================== */
.grid-responsive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.grid-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.grid-wide {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-lg);
}

@media (min-width: 1024px) {
  .grid-wide {
    grid-template-columns: 1fr 1fr;
  }
}

/* ===========================================
   UTILITY CLASSES
   =========================================== */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }

.gap-xs { gap: var(--spacing-xs); }
.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }
.gap-lg { gap: var(--spacing-lg); }

.mb-xs { margin-bottom: var(--spacing-xs); }
.mb-sm { margin-bottom: var(--spacing-sm); }
.mb-md { margin-bottom: var(--spacing-md); }
.mb-lg { margin-bottom: var(--spacing-lg); }

.mt-xs { margin-top: var(--spacing-xs); }
.mt-sm { margin-top: var(--spacing-sm); }
.mt-md { margin-top: var(--spacing-md); }
.mt-lg { margin-top: var(--spacing-lg); }
```

---

## Component Usage Patterns

### **✅ Component Classes for Consistency**
```tsx
// Base styling with component classes
function PropertyCard({ property }) {
  return (
    <div className="card-elevated">
      <div className="card-header">
        <h3 className="card-title">{property.name}</h3>
      </div>
      <div className="card-content">
        <p>{property.description}</p>
      </div>
      <div className="card-footer">
        <button className="btn btn-primary btn-md">
          View Details
        </button>
      </div>
    </div>
  );
}
```

### **✅ Utility Classes for Flexibility**
```tsx
// Conditional styling with utilities + component classes
function PropertyCard({ property, featured, className }) {
  return (
    <div 
      className={cn(
        'card-elevated',                    // Component class (consistent)
        featured && 'ring-2 ring-blue-500', // Utility (conditional)
        'hover:scale-105',                  // Utility (enhancement)
        className                           // Override (flexible)
      )}
    >
      <div className="card-header">
        <h3 className="card-title">{property.name}</h3>
        {featured && (
          <span className="badge badge-info">Featured</span>
        )}
      </div>
    </div>
  );
}
```

### **✅ Form Components**
```tsx
function IncidentForm() {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Create Incident</h2>
      </div>
      
      <div className="card-content">
        <div className="form-group">
          <label className="label" htmlFor="title">
            Short Description *
          </label>
          <input
            id="title"
            className="input"
            type="text"
            placeholder="Brief description of the incident"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="label" htmlFor="priority">
            Priority
          </label>
          <select id="priority" className="select">
            <option value="4">4 - Low</option>
            <option value="3">3 - Moderate</option>
            <option value="2">2 - High</option>
            <option value="1">1 - Critical</option>
          </select>
        </div>
      </div>
      
      <div className="card-footer">
        <button className="btn btn-outline btn-md">
          Cancel
        </button>
        <button className="btn btn-primary btn-md">
          Create Incident
        </button>
      </div>
    </div>
  );
}
```

---

## Design System Benefits

### **✅ What This Approach Provides**

#### **Consistency Without Framework Lock-in**
- **Component classes** ensure consistent styling (`card-elevated`, `btn-primary`)
- **Design tokens** centralize colors, spacing, typography
- **No external dependencies** - pure CSS that works everywhere

#### **Maintainable and Scalable**
- **Easy updates** - Change design tokens, update entire system
- **Team-friendly** - Clear class names, easy to understand
- **Debug-friendly** - Standard CSS, works with all dev tools

#### **ServiceNow Compatible**
- **No build dependencies** - Works with ServiceNow's build system
- **Predictable behavior** - No surprises from framework processing
- **Performance optimized** - Small CSS bundle, fast loading

#### **Modern Design Capabilities**
- **CSS custom properties** for dynamic theming
- **Flexbox and Grid** for modern layouts  
- **CSS animations** for smooth interactions
- **Responsive design** with media queries

---

## Alternative Validated Approaches - NEWLY ADDED

### **For Teams Wanting Component Libraries**

#### **Chakra UI Integration:**
```tsx
// Install: npm install @chakra-ui/react @emotion/react @emotion/styled
import { ChakraProvider } from '@chakra-ui/react';
import { Box, Button, Text } from '@chakra-ui/react';

export function App() {
  return (
    <ChakraProvider>
      {/* Your app with pre-built accessible components */}
    </ChakraProvider>
  );
}

function IncidentCard({ incident }) {
  return (
    <Box bg="white" borderRadius="xl" shadow="lg" p={6}>
      <Text fontSize="lg" fontWeight="semibold">{incident.number}</Text>
      <Button colorScheme="blue">View Details</Button>
    </Box>
  );
}
```

### **For Teams Wanting Utility Classes**

#### **Tailwind CDN Integration:**
```tsx
// Add CDN link to your app
useEffect(() => {
  const link = document.createElement('link');
  link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@3.4.1/tailwind.min.css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}, []);

function IncidentCard({ incident }) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900">{incident.number}</h3>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        View Details
      </button>
    </div>
  );
}
```

**Note:** Use utility classes directly - `@apply` directives require build processing not available in ServiceNow web IDE.

---

## Migration from Tailwind

### **If You Were Using Tailwind**
```tsx
// ❌ OLD: Tailwind utilities everywhere
<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Title</h3>
  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
    Action
  </button>
</div>

// ✅ NEW: Component classes + selective utilities
<div className="card-elevated">
  <h3 className="card-title">Title</h3>
  <button className="btn btn-primary btn-md">
    Action
  </button>
</div>
```

### **Conversion Strategy**
1. **Identify repeated patterns** - Look for duplicate utility combinations
2. **Create component classes** - Extract to semantic CSS classes
3. **Keep utilities for exceptions** - Responsive, conditional, one-off styling
4. **Test in ServiceNow** - Verify styles work in UI Pages
5. **Refactor gradually** - Component by component migration

---

## Performance and Maintenance

### **CSS Bundle Optimization**
- **Component classes reduce duplication** - `.btn-primary` vs repeated utilities
- **Design tokens enable theming** - Change variables, update entire system
- **Minimal CSS footprint** - Only styles you actually use
- **Fast loading** - No framework overhead, pure CSS

### **Development Experience**
- **Familiar CSS** - Standard properties, no learning curve
- **Great tooling** - Works with all CSS dev tools
- **Easy debugging** - Inspect element shows actual CSS
- **Team onboarding** - CSS knowledge transfers directly

---

## Troubleshooting

### **Common Issues and Solutions**

#### **🔧 Styles Not Applying**
```bash
# Check CSS file is loaded
# Verify no conflicting ServiceNow styles
# Test with browser dev tools
```

#### **🔧 Component Classes Not Working**
```css
/* Make sure CSS is properly structured */
.card-elevated {
  /* All properties must be standard CSS */
  background-color: white; /* ✅ */
  @apply bg-white;         /* ❌ Won't work */
}
```

#### **🔧 Responsive Design Issues**
```css
/* Use standard media queries */
@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## Implementation Strategy

> **🔗 For detailed implementation steps:** See [ServiceNow CSS Implementation Guide](servicenow-css-implementation-guide.md)  
> **🔗 For pattern context:** See [Pattern 3: CSS Implementation](patterns/servicenow-react/03-css-implementation.md)

**Key Implementation Requirements:**
- CSS files must be imported in the correct order (globals.css first)
- Page-specific CSS files need explicit imports in app.tsx or component files
- ServiceNow field types require proper TypeScript handling with helper functions
- Build process must be tested with `npm run build` before deployment

---

## Next Steps

### **✅ Implementation Ready**
1. **Choose your approach** - Plain CSS (primary), Chakra UI, or Tailwind CDN
2. **Copy the complete CSS** from this guide (for Plain CSS approach)
3. **Create component classes** for your design patterns  
4. **Build atomic components** using the class system
5. **Test in ServiceNow** to verify compatibility
6. **Scale gradually** - Add classes as you build components

### **📚 Related Documentation**
- **[ServiceNow CSS Implementation Guide](servicenow-css-implementation-guide.md)** - Step-by-step implementation
- **[Pattern 3: CSS Implementation](patterns/servicenow-react/03-css-implementation.md)** - Pattern context within Essential Patterns
- **[Project Setup Guide](project-setup-guide.md)** - Complete setup with CSS
- **[Atomic Design](patterns/atomic-design.md)** - Component hierarchy
- **[Component Reusability](component-reusability.md)** - Building with classes

---

*This CSS approach provides a production-ready, ServiceNow-compatible styling system that delivers consistency, maintainability, and modern design capabilities. Choose Plain CSS for maximum control, Chakra UI for fastest development, or Tailwind CDN for utility-first workflow - all validated in ServiceNow environments.*