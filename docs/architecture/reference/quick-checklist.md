---
title: "Quick Implementation Checklist"
version: "2025.1.0"
introduced: "2024.4.0"
purpose: "Fast reference for ensuring standards compliance"
readTime: "3 minutes"
usage: "Use during development and code reviews"
---

# Quick Implementation Checklist

**Purpose:** Fast reference for ensuring standards compliance  
**Read time:** ~3 minutes  
**Usage:** Use during development and code reviews

---

## 🚀 Project Setup Checklist

### **Essential Structure**
- [ ] Atomic design folders (`atoms/`, `molecules/`, `organisms/`, `templates/`)
- [ ] TypeScript configuration with strict mode
- [ ] **Tailwind CSS setup** - ServiceNow design system configuration
- [ ] Testing framework (Jest + Testing Library)
- [ ] **Component colocation** (JS, CSS, tests, stories in same folder)
- [ ] **CHANGELOG.md** in project root

### **Tailwind CSS Configuration**
- [ ] **ServiceNow design tokens** configured (colors, spacing, typography)
- [ ] **JIT mode enabled** for optimal performance
- [ ] **ServiceNow classes safelisted** for dynamic usage
- [ ] **Dark mode configured** (`darkMode: 'class'`)
- [ ] **Utility plugins installed** (@tailwindcss/forms, @tailwindcss/typography)
- [ ] **cn() utility function** (clsx + tailwind-merge) implemented

### **ServiceNow Integration**
- [ ] Secure g_ck token handling pattern
- [ ] Field utility functions (`display()`, `value()`, `link()`)
- [ ] Table API service layer with error handling
- [ ] Use `sysparm_display_value=all` in all queries

---

## 🎯 Component Development Checklist

### **Every Component Must Have:**
- [ ] **Stateless presentation** - UI logic only, no business logic
- [ ] **Single responsibility** - does one thing well
- [ ] **TypeScript interface** with JSDoc comments
- [ ] **Colocated files** - component, styles, tests, stories together
- [ ] **Flexible props** with sensible defaults
- [ ] **Error boundaries** for complex components
- [ ] **Accessibility** attributes (ARIA, labels, keyboard support)
- [ ] **ServiceNow field compatibility** - works with display_value pattern

### **Tailwind Component Pattern:**
```tsx
// ✅ Stateless component with Tailwind CSS
interface ComponentProps {
  // Data props (from parent/hooks)
  data: DataType;
  loading?: boolean;
  error?: string;
  
  // Action props (callbacks to parent)
  onAction: (item: DataType) => void;
  onUpdate?: (id: string, updates: Partial<DataType>) => void;
  
  // Configuration props
  variant?: 'default' | 'compact';
  disabled?: boolean;
  className?: string;
  'data-testid'?: string;
}

function Component({
  data,
  loading = false,
  error,
  onAction,
  onUpdate,
  variant = 'default',
  disabled = false,
  className = '',
  'data-testid': testId,
}: ComponentProps) {
  // No useState, useEffect, or business logic
  // Only UI logic and event handling
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <EmptyState />;

  return (
    <div 
      className={cn(
        // Base styles using ServiceNow design tokens
        'bg-white dark:bg-sn-secondary-800 rounded-sn-lg border border-sn-secondary-200 dark:border-sn-secondary-700 p-sn-lg shadow-sn-card',
        
        // Variant styles
        variant === 'compact' && 'p-sn-md',
        
        // Interactive states
        'hover:shadow-sn-md transition-shadow duration-200',
        
        // Responsive design
        'w-full sm:w-auto',
        
        className
      )}
      data-testid={testId}
    >
      <h3 className="text-sn-lg font-medium text-sn-secondary-900 dark:text-sn-secondary-100 mb-sn-sm">
        {data.title}
      </h3>
      <Button 
        onClick={() => onAction(data)} 
        variant="primary"
        className="mt-sn-md"
      >
        Action
      </Button>
    </div>
  );
}

// State management in parent component or hook
function ComponentContainer() {
  const { data, loading, error, updateData } = useDataHook(); // Custom hook
  
  return (
    <Component
      data={data}
      loading={loading}
      error={error}
      onAction={handleAction}
      onUpdate={updateData}
    />
  );
}

export default React.memo(Component);
```

---

## 🧪 Testing Checklist

### **Test Coverage Requirements:**
- [ ] **Rendering tests** - props, classes, content display
- [ ] **Interaction tests** - callbacks, button clicks, form inputs
- [ ] **State tests** - loading, error, empty states (passed as props)
- [ ] **Accessibility tests** - axe-core validation, keyboard navigation
- [ ] **ServiceNow field tests** - display_value handling, field formatting
- [ ] **Error boundary tests** - error recovery scenarios
- [ ] **Responsive tests** - mobile, tablet, desktop layouts
- [ ] **Dark mode tests** - theme switching and class application

### **Stateless Component Test Structure:**
```tsx
describe('StatelessComponent', () => {
  const defaultProps = {
    data: mockData,
    onAction: jest.fn(),
    onUpdate: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Rendering tests
  it('renders with required props', () => {});
  it('handles loading state via props', () => {});
  it('handles error state via props', () => {});
  it('handles empty data via props', () => {});
  
  // Interaction tests  
  it('calls onAction when button clicked', () => {});
  it('calls onUpdate with correct parameters', () => {});
  
  // ServiceNow specific tests
  it('displays ServiceNow fields correctly', () => {});
  it('handles missing display_value gracefully', () => {});
  
  // Tailwind/Styling tests
  it('applies correct variant classes', () => {});
  it('merges custom className prop', () => {});
  it('applies dark mode classes correctly', () => {});
  
  // Accessibility tests
  it('has no accessibility violations', async () => {});
  it('supports keyboard navigation', () => {});
});
```

---

## 🎨 Tailwind CSS Styling Checklist

### **ServiceNow Design System Compliance:**
- [ ] **ServiceNow colors** - Use `sn-primary-*`, `sn-secondary-*`, `sn-priority-*`, `sn-state-*`
- [ ] **ServiceNow spacing** - Use `sn-xs`, `sn-sm`, `sn-md`, `sn-lg`, `sn-xl`, `sn-2xl`
- [ ] **ServiceNow typography** - Use `text-sn-*` sizes and `font-sn-primary`
- [ ] **ServiceNow shadows** - Use `shadow-sn-sm`, `shadow-sn-md`, `shadow-sn-card`
- [ ] **ServiceNow border radius** - Use `rounded-sn-sm`, `rounded-sn-md`, `rounded-sn-lg`

### **Responsive and Accessibility:**
- [ ] **Mobile-first design** - Base styles for mobile, enhance for larger screens
- [ ] **Dark mode support** - Use `dark:` variants for all colors
- [ ] **Focus states** - `focus:ring-2 focus:ring-sn-primary-500` for interactive elements  
- [ ] **High contrast support** - Color combinations meet WCAG AA standards
- [ ] **Portal compatibility** - Works in ServiceNow portal and platform contexts

### **Class Organization Pattern:**
```tsx
<div className={cn(
  // 1. Layout (display, position, flex, grid)
  'flex items-center justify-between',
  
  // 2. Box model (width, height, padding, margin)
  'w-full h-10 px-sn-lg py-sn-md',
  
  // 3. Typography
  'text-sn-base font-medium text-sn-secondary-900',
  
  // 4. Visual (background, border, shadow)
  'bg-white border border-sn-secondary-200 rounded-sn-lg shadow-sn-sm',
  
  // 5. Interactive (hover, focus, active)
  'hover:bg-sn-secondary-50 focus:ring-2 focus:ring-sn-primary-500',
  
  // 6. Responsive (sm:, md:, lg:)
  'sm:w-auto lg:px-sn-xl',
  
  // 7. Dark mode
  'dark:bg-sn-secondary-800 dark:border-sn-secondary-700 dark:text-sn-secondary-100',
  
  // 8. Conditional classes
  variant === 'primary' && 'bg-sn-primary-500 text-white',
  
  // 9. Parent-provided className (always last)
  className
)} />
```

### **ServiceNow Component Patterns:**
- [ ] **Cards** - `bg-white dark:bg-sn-secondary-800 rounded-sn-lg border border-sn-secondary-200 dark:border-sn-secondary-700 shadow-sn-card`
- [ ] **Buttons** - Primary: `bg-sn-primary-500 hover:bg-sn-primary-600 text-white`
- [ ] **Form fields** - `border border-sn-secondary-300 focus:ring-2 focus:ring-sn-primary-500`
- [ ] **Status badges** - `bg-sn-priority-*/10 text-sn-priority-* border border-sn-priority-*/20`

---

## 🔐 ServiceNow Security Checklist

### **Authentication Pattern:**
- [ ] Check `typeof window !== 'undefined'` before window access
- [ ] Access `window.g_ck` only in `useEffect` after mount
- [ ] Handle undefined `window.g_ck` gracefully
- [ ] Store token in React state, validate `tokenReady`
- [ ] Show authentication errors to users
- [ ] **Pass authentication status to components via props**

### **Field Security:**
- [ ] Use ServiceNow field utilities for consistent display
- [ ] Handle missing field permissions gracefully
- [ ] Respect read-only field states
- [ ] Validate field access before displaying sensitive data

---

## 🛡️ Error Handling Checklist

### **Error Boundary Implementation:**
- [ ] **App-level** error boundary with ServiceNow fallback
- [ ] **Feature-level** boundaries for major sections  
- [ ] **Component-level** boundaries for complex components
- [ ] **Fallback UIs** with retry mechanisms and ServiceNow styling
- [ ] **Error logging** to monitoring service
- [ ] **Pass error states to components via props**

### **Stateless Error Handling:**
```tsx
// ✅ Error passed as prop, not internal state
function Component({ data, error, onRetry }) {
  if (error) {
    return (
      <div className="bg-sn-error-50 border border-sn-error-200 rounded-sn-lg p-sn-lg">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-sn-error-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="ml-sn-sm text-sn-error-700 font-medium">Error occurred</span>
        </div>
        <p className="mt-2 text-sn-error-600 text-sn-sm">{error}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="mt-sn-md bg-sn-error-500 hover:bg-sn-error-600 text-white px-sn-md py-sn-sm rounded-sn-sm text-sn-sm font-medium transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }
  
  return <div>{/* component content */}</div>;
}
```

---

## 🌐 ServiceNow Portal Checklist

### **Portal Compatibility:**
- [ ] **Context awareness** - detect portal vs. platform UI
- [ ] **Responsive design** - works on mobile portal apps
- [ ] **Theme compatibility** - supports different portal themes
- [ ] **Navigation integration** - proper portal navigation patterns
- [ ] **Permission handling** - respects portal user permissions
- [ ] **Performance optimization** - fast loading in portal context

### **Portal Integration Pattern:**
```tsx
function PortalAwareComponent({ embedded = false, portalContext }) {
  return (
    <div className={cn(
      'bg-white rounded-sn-lg border border-sn-secondary-200 p-sn-lg',
      embedded && 'shadow-none border-0 bg-transparent p-sn-md'
    )}>
      {/* Content adapts to portal context */}
    </div>
  );
}
```

---

## 📋 Code Review Checklist

### **Before Submitting:**
- [ ] **Components are stateless** - business logic moved to hooks/containers
- [ ] **Props are well-defined** - clear data flow and callbacks
- [ ] **Tailwind classes organized** - following recommended order pattern
- [ ] **ServiceNow design tokens used** - no arbitrary values
- [ ] **Dark mode implemented** - all colors have dark variants
- [ ] **Responsive design tested** - mobile, tablet, desktop
- [ ] No TypeScript or ESLint errors
- [ ] All tests pass (unit, accessibility, integration)
- [ ] **ServiceNow field utilities used** - consistent field handling
- [ ] **Portal compatibility tested** - works in different contexts
- [ ] **Files properly colocated** in component folders
- [ ] **Documentation** complete (README, Storybook, JSDoc)

### **Quality Standards:**
- [ ] **Components under 100 lines** (split if larger)
- [ ] **Clear separation of concerns** (presentation vs. business logic)
- [ ] **Consistent naming conventions** - ServiceNow-aligned
- [ ] **No hardcoded values** (use ServiceNow design tokens)
- [ ] **Performance optimized** - React.memo, useCallback, useMemo where appropriate
- [ ] **cn() utility used** - proper class merging and conditional classes

---

## 📦 Release Checklist

### **Version Control:**
- [ ] **CHANGELOG.md updated** with all changes
- [ ] Semantic versioning (MAJOR.MINOR.PATCH)
- [ ] Breaking changes documented with migration guides
- [ ] Version number updated in package.json

### **ServiceNow Deployment:**
- [ ] Build succeeds without warnings
- [ ] **Tailwind CSS optimized** - unused classes purged
- [ ] All tests pass in CI/CD pipeline
- [ ] **Portal integration tested** - works in Service Portal and Next Experience
- [ ] **ServiceNow permissions verified** - appropriate role access
- [ ] **Performance tested** - loading times within ServiceNow limits
- [ ] **Accessibility audit passes** - WCAG 2.1 AA compliance
- [ ] **Error boundaries tested** with error scenarios
- [ ] **Dark mode tested** - theme switching works correctly

---

## 🚨 Common Pitfalls

### **❌ Avoid These:**
- **Stateful presentation components** - mixing UI and business logic
- **Direct ServiceNow API calls in components** - use service layers and hooks
- **Ignoring portal context** - assuming platform UI only
- **Hardcoded ServiceNow endpoints** - use configuration
- **Skipping accessibility** - all users must be supported
- **Missing field utilities** - inconsistent ServiceNow field handling
- **Scattering related files** across directories
- **Forgetting CHANGELOG.md** updates
- **Arbitrary Tailwind values** - `p-[13px]` instead of design tokens
- **Missing dark mode** - components break in dark themes
- **No responsive design** - fixed desktop-only layouts

### **✅ Do This Instead:**
- **Keep components stateless** - pass everything via props
- **Use custom hooks for business logic** - clear separation of concerns
- **Test in multiple ServiceNow contexts** - portal, platform, mobile
- **Use ServiceNow field utilities** - display(), value(), link()
- **Include comprehensive accessibility** - WCAG 2.1 AA compliance
- **Implement proper error boundaries** - resilient applications
- **Keep related files colocated** in component folders
- **Maintain comprehensive version history**
- **Use ServiceNow design tokens** - `p-sn-md`, `text-sn-primary-500`
- **Implement dark mode variants** - `dark:bg-sn-secondary-800`
- **Design mobile-first** - responsive utilities `sm:`, `lg:`

---

## 🔗 Quick Reference Links

**Core Documentation:**
- [Atomic Design](patterns/atomic-design.md) - ServiceNow Next Experience UI patterns
- [Component Reusability](component-reusability.md) - Seven core principles
- [Styling Practices](styling-practices.md) - Complete Tailwind CSS guide
- [Tailwind Quick Reference](reference/tailwind-quick-reference.md) - Fast Tailwind lookup
- [State Management](patterns/state-management.md) - Zustand for global state
- [Error Boundaries](patterns/error-boundaries.md) - Error handling patterns
- [ServiceNow Integration](servicenow-integration.md) - API and authentication

**Specialized Patterns:**
- [Custom Hooks](patterns/custom-hooks.md) - Logic separation
- [Authentication](patterns/authentication.md) - ServiceNow security
- [File Organization](patterns/file-organization.md) - Component structure

---

*Build stateless, reusable components using Tailwind CSS with ServiceNow design tokens. Prioritize mobile-first responsive design and comprehensive dark mode support for complete ServiceNow portal compatibility.*