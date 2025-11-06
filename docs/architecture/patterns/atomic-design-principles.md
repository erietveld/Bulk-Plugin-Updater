---
title: "Atomic Design Principles for ServiceNow Components"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Foundation concepts for building reusable ServiceNow UI components using atomic design methodology"
readTime: "5 minutes"
complexity: "beginner"
status: "ACTIVE"
criticality: "RECOMMENDED"
prerequisites: ["core-principles"]
tags: ["atomic-design", "components", "foundation", "servicenow"]
---

# Atomic Design Principles for ServiceNow Components

**Purpose:** Foundation concepts for building reusable ServiceNow UI components using atomic design methodology  
**Read time:** ~5 minutes  
**Prerequisites:** [Core Principles](../core-principles.md)

---

## Atomic Design Philosophy

Atomic design is a methodology for creating design systems by breaking user interfaces into hierarchical components. For ServiceNow applications, this approach aligns perfectly with React's component-based architecture and ServiceNow's Next Experience UI patterns.

### **The Atomic Hierarchy**

```
Templates     ← Complete page layouts
    ↑
Organisms     ← Complex business components  
    ↑
Molecules     ← Combined functional units
    ↑
Atoms         ← Basic UI elements
```

### **ServiceNow Context**
Atomic design provides structure for building consistent, reusable components that work across different ServiceNow interfaces:
- **Portal widgets** - Service Portal integration
- **Next Experience UI** - Modern ServiceNow interface
- **UI Pages** - Custom ServiceNow pages
- **Embedded components** - Integration with existing ServiceNow forms

---

## Design Principles for ServiceNow

### **1. Stateless-First Architecture**
Align with ServiceNow's backend-handles-logic philosophy by keeping components stateless and presentational.

```tsx
// ✅ GOOD: Stateless component with clear props
interface IncidentCardProps {
  incident: Incident;
  onStatusUpdate: (id: string, status: string) => void;
  onAssignToMe: (id: string) => void;
  isUpdating?: boolean;
}

function IncidentCard({ incident, onStatusUpdate, onAssignToMe, isUpdating }: IncidentCardProps) {
  // No internal state - pure presentation
  // Business logic handled by ServiceNow builders or parent components
  return (
    <div className="incident-card">
      <IncidentHeader incident={incident} />
      <IncidentActions 
        incident={incident}
        onStatusUpdate={onStatusUpdate}
        onAssignToMe={onAssignToMe}
        disabled={isUpdating}
      />
    </div>
  );
}

// ❌ BAD: Stateful component mixing concerns
function IncidentCard({ incident }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [user, setUser] = useState(null);
  
  // Too much responsibility - business logic should be in ServiceNow or hooks
  const handleAssignToMe = async () => {
    setIsUpdating(true);
    // Complex logic that belongs in ServiceNow Flow Designer
    await updateIncident(incident.sys_id, { assigned_to: user.sys_id });
    setIsUpdating(false);
  };
  
  return (/* component with mixed concerns */);
}
```

### **2. Composition Over Configuration**
Build complex interfaces by composing simple, focused components rather than creating monolithic configurable components.

```tsx
// ✅ GOOD: Composable components
function IncidentManagement() {
  return (
    <DashboardLayout>
      <DashboardHeader>
        <h1>Incident Management</h1>
        <CreateIncidentButton />
      </DashboardHeader>
      
      <FilterPanel onFilterChange={handleFilterChange} />
      
      <IncidentList
        incidents={incidents}
        onIncidentClick={handleIncidentClick}
        onIncidentUpdate={handleIncidentUpdate}
      />
    </DashboardLayout>
  );
}

// ❌ BAD: Monolithic configurable component
function IncidentManagement({
  showCreateButton = true,
  showFilters = true,
  showHeader = true,
  headerTitle = "Incidents",
  filterOptions = [],
  listVariant = "default",
  // ... 20+ more configuration props
}) {
  // Complex conditional rendering based on many props
  return (
    <div>
      {showHeader && <Header title={headerTitle} showCreate={showCreateButton} />}
      {showFilters && <Filters options={filterOptions} />}
      <List variant={listVariant} {...manyMoreProps} />
    </div>
  );
}
```

### **3. ServiceNow Design System Alignment**
Components should match ServiceNow's design patterns and be compatible with platform theming.

```tsx
// ✅ GOOD: ServiceNow design system aligned
function ServiceNowButton({
  variant = 'primary',
  size = 'md', 
  disabled = false,
  loading = false,
  children,
  ...props
}: ServiceNowButtonProps) {
  return (
    <button
      className={`sn-button sn-button--${variant} sn-button--${size}`}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading && <SpinnerIcon className="sn-button__spinner" />}
      <span className="sn-button__content">{children}</span>
    </button>
  );
}

// CSS follows ServiceNow design tokens
.sn-button {
  padding: var(--sn-spacing-md);
  border-radius: var(--sn-border-radius-md);
  font-family: var(--sn-font-family);
  font-size: var(--sn-font-size-md);
  transition: var(--sn-transition-default);
}

.sn-button--primary {
  background-color: var(--sn-color-primary);
  color: var(--sn-color-primary-contrast);
}

.sn-button--secondary {
  background-color: var(--sn-color-secondary);
  color: var(--sn-color-secondary-contrast);
}
```

### **4. Accessibility-First Design**
Every component must be accessible by default, supporting ServiceNow's commitment to inclusive design.

```tsx
// ✅ GOOD: Accessible component with proper ARIA
interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  ariaLabel?: string;
}

function StatusBadge({ status, variant = 'default', ariaLabel }: StatusBadgeProps) {
  return (
    <span
      className={`sn-badge sn-badge--${variant}`}
      role="status"
      aria-label={ariaLabel || `Status: ${status}`}
    >
      <span aria-hidden="true">{status}</span>
    </span>
  );
}

// Usage with proper context
<StatusBadge 
  status="In Progress" 
  variant="warning"
  ariaLabel="Incident status: In Progress, requires attention"
/>
```

---

## Component Hierarchy Guidelines

### **Atoms: Pure UI Elements**
**Characteristics:**
- Single responsibility
- No business logic
- Highly reusable
- Platform-agnostic styling

**Examples:** Button, Input, Badge, Icon, Spinner

```tsx
// ✅ Good atom: Pure UI element
function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <span className={`sn-badge sn-badge--${variant} sn-badge--${size}`}>
      {children}
    </span>
  );
}
```

### **Molecules: Functional Combinations**
**Characteristics:**
- Combine 2-5 atoms
- Single functional purpose  
- Reusable across contexts
- May include simple interaction logic

**Examples:** FormField, SearchBox, StatusCard

```tsx
// ✅ Good molecule: Functional combination
function FormField({ 
  label, 
  children, 
  error, 
  required = false, 
  helpText 
}: FormFieldProps) {
  const fieldId = `field-${useId()}`;
  
  return (
    <div className="sn-form-field">
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>
      
      <div className="sn-form-field__input">
        {cloneElement(children, { id: fieldId, 'aria-describedby': error ? `${fieldId}-error` : undefined })}
      </div>
      
      {helpText && (
        <div className="sn-form-field__help">{helpText}</div>
      )}
      
      {error && (
        <div 
          id={`${fieldId}-error`}
          className="sn-form-field__error" 
          role="alert"
        >
          {error}
        </div>
      )}
    </div>
  );
}
```

### **Organisms: Business Components**
**Characteristics:**
- Complex business functionality
- Combine multiple molecules
- May include state management via hooks
- Domain-specific (e.g., ServiceNow-focused)

**Examples:** IncidentForm, UserList, DashboardWidget

```tsx
// ✅ Good organism: Business component with hook-based state
function IncidentForm({ incidentId, onSuccess }: IncidentFormProps) {
  // Business logic handled by custom hook
  const {
    incident,
    formState,
    validation,
    updateField,
    handleSubmit,
    isLoading
  } = useIncidentForm(incidentId);

  if (isLoading) return <LoadingSpinner />;

  return (
    <form onSubmit={handleSubmit(onSuccess)} className="incident-form">
      <FormField 
        label="Short Description" 
        required
        error={validation.errors.short_description}
      >
        <Input 
          value={formState.short_description}
          onChange={(value) => updateField('short_description', value)}
        />
      </FormField>
      
      <FormField 
        label="Priority"
        error={validation.errors.priority}
      >
        <Select
          value={formState.priority}
          onChange={(value) => updateField('priority', value)}
          options={priorityOptions}
        />
      </FormField>
      
      <FormActions>
        <Button type="submit" loading={validation.isSubmitting}>
          {incidentId ? 'Update' : 'Create'} Incident
        </Button>
      </FormActions>
    </form>
  );
}
```

### **Templates: Layout Structures**
**Characteristics:**
- Define page structure
- No specific content
- Provide consistent layouts
- Handle responsive behavior

**Examples:** DashboardLayout, ModalLayout, FormLayout

```tsx
// ✅ Good template: Structural layout without specific content
function DashboardLayout({ 
  header, 
  sidebar, 
  children, 
  footer 
}: DashboardLayoutProps) {
  return (
    <div className="sn-dashboard-layout">
      <header className="sn-dashboard-layout__header">
        {header}
      </header>
      
      <div className="sn-dashboard-layout__content">
        {sidebar && (
          <aside className="sn-dashboard-layout__sidebar">
            {sidebar}
          </aside>
        )}
        
        <main className="sn-dashboard-layout__main">
          {children}
        </main>
      </div>
      
      {footer && (
        <footer className="sn-dashboard-layout__footer">
          {footer}
        </footer>
      )}
    </div>
  );
}
```

---

## Design System Integration

### **ServiceNow Design Tokens**
Components should use ServiceNow design tokens for consistency across the platform.

```css
/* ServiceNow design tokens */
:root {
  /* Colors */
  --sn-color-primary: #0073e7;
  --sn-color-primary-contrast: #ffffff;
  --sn-color-secondary: #f5f5f5; 
  --sn-color-text: #2e2e2e;
  --sn-color-text-secondary: #666666;
  
  /* Spacing */
  --sn-spacing-xs: 0.25rem;
  --sn-spacing-sm: 0.5rem;
  --sn-spacing-md: 1rem;
  --sn-spacing-lg: 1.5rem;
  --sn-spacing-xl: 2rem;
  
  /* Typography */
  --sn-font-family: 'SourceSansPro', Arial, sans-serif;
  --sn-font-size-sm: 0.875rem;
  --sn-font-size-md: 1rem;
  --sn-font-size-lg: 1.125rem;
  
  /* Borders */
  --sn-border-radius-sm: 0.25rem;
  --sn-border-radius-md: 0.375rem;
  --sn-border-width: 1px;
  
  /* Transitions */
  --sn-transition-default: all 0.2s ease-in-out;
}
```

### **Component Theming**
```tsx
// Components automatically adapt to ServiceNow theming
function ThemedButton({ children, ...props }: ButtonProps) {
  return (
    <button
      className="sn-button"
      style={{
        backgroundColor: 'var(--sn-color-primary)',
        color: 'var(--sn-color-primary-contrast)',
        padding: 'var(--sn-spacing-md)',
        borderRadius: 'var(--sn-border-radius-md)',
        fontFamily: 'var(--sn-font-family)',
        transition: 'var(--sn-transition-default)'
      }}
      {...props}
    >
      {children}
    </button>
  );
}
```

---

## Decision Framework

### **When to Create Each Level**

#### **Create an Atom When:**
- ✅ Element has single responsibility
- ✅ Needed across multiple components
- ✅ Has consistent styling requirements
- ✅ No complex business logic needed

#### **Create a Molecule When:**
- ✅ Combining 2-5 atoms for specific function
- ✅ Pattern appears in multiple places
- ✅ Simple interaction logic required
- ✅ Maintains single functional purpose

#### **Create an Organism When:**
- ✅ Complex business functionality needed
- ✅ Combines multiple molecules/atoms
- ✅ Domain-specific requirements
- ✅ State management required

#### **Create a Template When:**
- ✅ Defining page structure
- ✅ Multiple pages need same layout
- ✅ Responsive behavior required
- ✅ No specific content dependencies

---

## Integration with ServiceNow Backend

### **Backend-Frontend Separation**
Atomic components focus on presentation while ServiceNow handles business logic:

```tsx
// ✅ Component handles UI, ServiceNow handles logic
function IncidentPrioritySelector({ 
  currentPriority, 
  onPriorityChange, 
  disabled 
}: PriorityProps) {
  return (
    <Select
      value={currentPriority}
      onChange={onPriorityChange}  // Triggers ServiceNow Flow Designer
      disabled={disabled}
      options={[
        { value: '1', label: 'Critical' },
        { value: '2', label: 'High' },
        { value: '3', label: 'Medium' },
        { value: '4', label: 'Low' }
      ]}
    />
  );
  
  // ServiceNow Flow Designer automatically:
  // - Recalculates SLA deadlines
  // - Updates assignment rules
  // - Sends notifications
  // - Triggers escalation workflows
}
```

---

## Next Steps

**Foundation established! Continue with:**

### **Implementation Guides:**
- [ServiceNow Atoms](servicenow-atoms.md) - Building basic ServiceNow UI elements
- [ServiceNow Molecules](servicenow-molecules.md) - Creating functional combinations
- [ServiceNow Organisms](servicenow-organisms.md) - Complex business components

### **Integration Patterns:**
- [State Management](state-management.md) - Managing state in atomic components
- [File Organization](file-organization.md) - Organizing atomic design files

### **Related Concepts:**
- [Component Reusability](../component-reusability.md) - Why atomic design works
- [ServiceNow Backend Principles](servicenow-backend-principles.md) - Backend integration

---

*Atomic design provides the foundation for building consistent, reusable ServiceNow components. Start with atoms, compose into molecules, and build complex organisms that integrate seamlessly with ServiceNow's backend capabilities.*