---
title: "Component Reusability Principles"
version: "2025.1.0"
introduced: "2024.3.0"
purpose: "Fundamental principles for building reusable, maintainable React components"
readTime: "5 minutes"
complexity: "beginner"
status: "ACTIVE"
criticality: "RECOMMENDED"
prerequisites: ["core-principles"]
tags: ["components", "reusability", "architecture", "patterns", "servicenow"]
---

# Component Reusability Principles

**Purpose:** Fundamental principles for building reusable, maintainable React components  
**Read time:** ~5 minutes  
**Prerequisites:** [Core Principles](core-principles.md)

---

## The Seven Core Principles

Building reusable components follows seven essential principles. Master these for consistent, maintainable ServiceNow applications aligned with Next Experience UI patterns.

### **1. Keep Components Small & Focused**
Each component should have a single responsibility and be stateless where possible. Avoid mixing UI concerns with business logic.

```tsx
// ❌ BAD: Stateful component with mixed concerns
function IncidentDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  // Data fetching, filtering, rendering all mixed together
  // 200+ lines of mixed logic...
}

// ✅ GOOD: Stateless component with single responsibility
function IncidentList({ incidents, loading, onItemClick, onRefresh }) {
  // Only UI logic - no business logic or state
  if (loading) return <LoadingSpinner />;
  if (incidents.length === 0) return <EmptyState onRefresh={onRefresh} />;
  
  return (
    <div className="incident-list">
      {incidents.map(incident => (
        <IncidentCard 
          key={incident.sys_id} 
          incident={incident} 
          onClick={onItemClick} 
        />
      ))}
    </div>
  );
}

// ✅ Business logic in container/hook
function IncidentListContainer() {
  const { incidents, loading, error, refetch } = useIncidents();
  
  return (
    <IncidentList
      incidents={incidents}
      loading={loading}
      onItemClick={handleItemClick}
      onRefresh={refetch}
    />
  );
}
```

### **2. Group Component-Related Files**
Store all related files together: component, styles, tests, stories, and utilities. This colocation improves maintainability and team collaboration.

```
src/components/atoms/Button/
├── Button.tsx              // Main component (stateless)
├── Button.module.css       // Component styles
├── Button.test.tsx         // Unit tests
├── Button.stories.tsx      // Storybook documentation
├── Button.types.ts         // Type definitions
└── index.ts                // Clean exports
```

**Benefits:**
- Easy to find everything related to a component
- Clear ownership and responsibility
- Faster development and debugging
- Better team collaboration
- Aligned with ServiceNow's modular approach

### **3. Use Props for Flexibility**
Design comprehensive prop interfaces that support multiple use cases. Components should receive all data and callbacks via props for maximum reusability.

```tsx
// ✅ Flexible, stateless component with comprehensive props
interface ButtonProps {
  /** Button styling variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Shows loading spinner and disables interaction */
  loading?: boolean;
  /** Disables the button */
  disabled?: boolean;
  /** Icon to show at start of button content */
  startIcon?: React.ReactNode;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Button content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Test identifier */
  'data-testid'?: string;
}

function Button({ 
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  startIcon,
  onClick,
  children,
  className = '',
  'data-testid': testId,
  ...rest
}: ButtonProps) {
  // No internal state - everything via props
  return (
    <button
      className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      data-testid={testId}
      {...rest}
    >
      {loading && <Spinner size="small" />}
      {!loading && startIcon && <span className="btn__start-icon">{startIcon}</span>}
      <span className="btn__content">{children}</span>
    </button>
  );
}
```

### **4. Separate Logic and Presentation**
Use custom hooks to encapsulate business logic, leaving components focused purely on UI rendering. This aligns with ServiceNow's Next Experience approach.

```tsx
// ✅ Custom hook handles all business logic
function useIncidentManagement(initialFilters = {}) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { service, tokenReady } = useSecureServiceNowService('incident');

  const fetchIncidents = useCallback(async () => {
    if (!service || !tokenReady) return;
    
    try {
      setLoading(true);
      const result = await service.list({ 
        sysparm_query: buildQuery(initialFilters),
        sysparm_display_value: 'all' // ServiceNow field compatibility
      });
      setIncidents(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [service, tokenReady, initialFilters]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return { 
    incidents, 
    loading, 
    error, 
    refetch: fetchIncidents 
  };
}

// ✅ Stateless component focuses only on UI
function IncidentList({ 
  incidents, 
  loading, 
  error, 
  onItemClick, 
  onRefresh 
}) {
  // No business logic - pure presentation
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={onRefresh} />;
  if (incidents.length === 0) return <EmptyState message="No incidents found" />;

  return (
    <div className="incident-list">
      {incidents.map(incident => (
        <IncidentCard
          key={incident.sys_id}
          incident={incident}
          onClick={onItemClick}
        />
      ))}
    </div>
  );
}
```

### **5. Adopt Atomic Design**
Structure components in a hierarchy: atoms (basic elements), molecules (combined atoms), organisms (complex components), and templates (page layouts). Keep components stateless where possible.

```tsx
// ATOMS: Stateless building blocks
function Badge({ variant = 'default', children }) {
  return <span className={`badge badge--${variant}`}>{children}</span>;
}

function FieldDisplay({ field, type = 'string' }) {
  // ServiceNow field handling
  const displayValue = field?.display_value || field?.value || '--';
  return <span className={`field-display field-display--${type}`}>{displayValue}</span>;
}

// MOLECULES: Combined atoms (still stateless)
function StatusBadge({ priority, state }) {
  const getVariant = () => {
    if (priority === '1' || priority === '2') return 'danger';
    if (state === 'resolved') return 'success';
    return 'default';
  };

  return <Badge variant={getVariant()}>{state} - P{priority}</Badge>;
}

// ORGANISMS: Complex components (stateless, props-driven)
function IncidentCard({ incident, onClick, onUpdate }) {
  // No internal state - receives everything via props
  return (
    <div className="incident-card" onClick={() => onClick?.(incident)}>
      <h3><FieldDisplay field={incident.short_description} /></h3>
      <StatusBadge priority={incident.priority.value} state={incident.state.value} />
      
      <div className="incident-card__actions">
        <Button size="small" onClick={() => onUpdate?.(incident.sys_id, { state: 'in_progress' })}>
          Start Work
        </Button>
      </div>
    </div>
  );
}
```

### **6. Validate Props with TypeScript**
Use comprehensive TypeScript interfaces with JSDoc comments to create self-documenting, type-safe components compatible with ServiceNow field structures.

```tsx
/**
 * ServiceNow Incident Card Component
 * 
 * Displays incident information in a card format aligned with Next Experience UI.
 * Optimized for ServiceNow portal and platform contexts.
 * 
 * @example
 * ```tsx
 * <IncidentCard 
 *   incident={incident}
 *   onClick={handleViewIncident}
 *   onUpdate={handleUpdateIncident}
 * />
 * ```
 */
interface IncidentCardProps {
  /** ServiceNow incident record with display_value fields */
  incident: ServiceNowIncident;
  /** Callback when card is clicked for navigation */
  onClick?: (incident: ServiceNowIncident) => void;
  /** Callback for inline status updates */
  onUpdate?: (sysId: string, updates: Partial<ServiceNowIncident>) => void;
  /** Display variant for different contexts */
  variant?: 'default' | 'compact' | 'portal';
  /** Whether component is in portal context */
  embedded?: boolean;
  /** Loading state (passed from parent) */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

function IncidentCard({
  incident,
  onClick,
  onUpdate,
  variant = 'default',
  embedded = false,
  loading = false,
  className
}: IncidentCardProps) {
  // Full type safety with ServiceNow field structure
  const shortDescription = incident.short_description?.display_value || 'No description';
  const priority = incident.priority?.value || '4';
  const state = incident.state?.value || 'new';
  
  return (
    <div className={`incident-card incident-card--${variant} ${embedded ? 'incident-card--portal' : ''} ${className}`}>
      {/* Implementation with full type safety */}
    </div>
  );
}
```

### **7. Use Error Boundaries**
Implement error boundaries to catch errors and prevent application crashes. Pass error states to components via props when possible.

```tsx
// ✅ Error boundary with ServiceNow-specific fallbacks
function ServiceNowErrorBoundary({ children, fallback: FallbackComponent }) {
  return (
    <ErrorBoundary
      fallback={FallbackComponent || ServiceNowErrorFallback}
      onError={(error, errorInfo) => {
        // Log ServiceNow-specific error context
        logServiceNowError(error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// ✅ Stateless error display component
function ServiceNowErrorFallback({ error, retry }) {
  const isAuthError = error.message.includes('authentication');
  const isPermissionError = error.message.includes('403');
  
  return (
    <div className="servicenow-error-fallback">
      <h2>
        {isAuthError ? 'Authentication Required' : 
         isPermissionError ? 'Access Denied' : 
         'ServiceNow Error'}
      </h2>
      <p>
        {isAuthError ? 'Your session may have expired. Please refresh to log in again.' :
         isPermissionError ? 'You don\'t have permission to perform this action.' :
         'An error occurred while processing your ServiceNow request.'}
      </p>
      <Button variant="primary" onClick={retry}>
        {isAuthError ? 'Refresh & Login' : 'Try Again'}
      </Button>
    </div>
  );
}

// ✅ Error state passed as prop to stateless component
function IncidentList({ incidents, loading, error, onRetry }) {
  if (error) {
    return <ServiceNowErrorFallback error={error} retry={onRetry} />;
  }
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="incident-list">
      {incidents.map(incident => (
        <IncidentCard key={incident.sys_id} incident={incident} />
      ))}
    </div>
  );
}
```

---

*Master these seven principles to build stateless, reusable components that align with ServiceNow's Next Experience UI and work seamlessly in portal and platform contexts.*