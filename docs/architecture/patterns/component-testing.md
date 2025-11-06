---
title: "Component Testing Patterns for ServiceNow React Applications"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Comprehensive testing patterns for ServiceNow React components using React Testing Library"
readTime: "6 minutes"
complexity: "intermediate"
status: "ACTIVE"
criticality: "RECOMMENDED"
prerequisites: ["testing-strategy", "component-reusability"]
tags: ["testing", "react", "components", "servicenow", "accessibility"]
---

# Component Testing Patterns for ServiceNow React Applications

**Purpose:** Comprehensive testing patterns for ServiceNow React components using React Testing Library  
**Read time:** ~6 minutes  
**Prerequisites:** [Testing Strategy](testing-strategy.md), [Component Reusability](../component-reusability.md)

---

## Component Testing in ServiceNow Testing Ecosystem

### **Role in Backend-First Testing Strategy**

Component testing focuses on the **React frontend layer** of our comprehensive testing approach:

```
ServiceNow Testing Ecosystem Integration
├── ServiceNow Backend Testing (Configuration-First) 🏗️
│   └── ATF Tests → Configuration artifacts (see ATF Integration Patterns)
├── React Frontend Testing (Code-First) ⚛️ ← This Document
│   ├── Component Tests → UI behavior and interactions
│   ├── Hook Tests → Custom hooks and state logic
│   └── Service Tests → API communication patterns
└── Integration Testing 🔗
    ├── React + ServiceNow API integration
    └── E2E workflows → Complete user experiences
```

**Component testing validates:**
- ✅ **React component behavior** - Rendering, state, interactions
- ✅ **ServiceNow field handling** - display_value, reference fields, choice lists
- ✅ **User interactions** - Clicks, form inputs, keyboard navigation
- ✅ **Accessibility** - WCAG compliance and screen reader support
- ✅ **Error handling** - Component-level error states

**See:** [Testing Strategy](testing-strategy.md) for the complete testing approach and how component testing integrates with ATF and E2E testing.

---

## Testing Philosophy for ServiceNow Components

### **Test What Users Experience**

Focus on testing behavior that users interact with, not implementation details:

```tsx
// ✅ GOOD: Test user-visible behavior
it('assigns incident when user clicks assign button', async () => {
  const user = userEvent.setup();
  const onAssign = jest.fn();
  
  render(<IncidentCard incident={mockIncident} onAssign={onAssign} />);
  
  await user.click(screen.getByRole('button', { name: /assign to me/i }));
  
  expect(onAssign).toHaveBeenCalledWith(mockIncident.sys_id);
});

// ❌ BAD: Test implementation details
it('sets internal state when button is clicked', () => {
  const wrapper = shallow(<IncidentCard />);
  
  wrapper.find('button').simulate('click');
  
  expect(wrapper.state('isAssigning')).toBe(true); // Testing internal state
});
```

### **ServiceNow Component Testing Standards**

Every ServiceNow component should be tested for:
- **Functionality** - Does it work as expected with ServiceNow data?
- **Accessibility** - Can all users interact with it?
- **Error states** - How does it handle ServiceNow API failures?
- **User interactions** - Does it respond correctly to user actions?
- **ServiceNow field handling** - Does it display ServiceNow field structures correctly?

---

## Atomic Design Component Testing Patterns

### **Testing Atoms - Basic UI Elements**

Test fundamental building blocks that work with ServiceNow data:

```tsx
// atoms/Button/Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from './Button';

expect.extend(toHaveNoViolations);

describe('Button Atom', () => {
  // Basic rendering
  it('renders with required props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  // ServiceNow variant handling
  it('applies ServiceNow design system variants', () => {
    render(<Button variant="primary">Primary Action</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('sn-button--primary');
  });

  // User interactions
  it('handles click events correctly', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Action</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Loading states (common in ServiceNow operations)
  it('shows loading state for ServiceNow operations', () => {
    render(<Button loading loadingText="Updating...">Save Changes</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(screen.getByText('Updating...')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-describedby');
  });

  // Accessibility validation
  it('meets accessibility standards', async () => {
    const { container } = render(<Button>Accessible Button</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // Keyboard navigation
  it('supports keyboard navigation', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Keyboard Accessible</Button>);
    
    const button = screen.getByRole('button');
    await user.tab(); // Focus the button
    expect(button).toHaveFocus();
    
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### **Testing Molecules - ServiceNow Field Components**

Test functional combinations that handle ServiceNow data structures:

```tsx
// molecules/ServiceNowFormField/ServiceNowFormField.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceNowFormField } from './ServiceNowFormField';
import { Input } from '@/components/atoms';

describe('ServiceNowFormField Molecule', () => {
  // ServiceNow field structure handling
  it('displays ServiceNow field with proper labels', () => {
    render(
      <ServiceNowFormField label="Short Description" required>
        <Input defaultValue="Test incident description" />
      </ServiceNowFormField>
    );
    
    expect(screen.getByLabelText('Short Description *')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test incident description')).toBeInTheDocument();
  });

  // Validation error display
  it('shows validation errors for ServiceNow fields', () => {
    render(
      <ServiceNowFormField 
        label="Priority" 
        error="Priority is required for incidents"
      >
        <Input />
      </ServiceNowFormField>
    );
    
    const errorMessage = screen.getByText('Priority is required for incidents');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  // Help text for ServiceNow fields
  it('provides help text for complex ServiceNow fields', () => {
    render(
      <ServiceNowFormField 
        label="Configuration Item" 
        helpText="Select the affected CI from the CMDB"
      >
        <Input />
      </ServiceNowFormField>
    );
    
    expect(screen.getByText('Select the affected CI from the CMDB')).toBeInTheDocument();
  });

  // Accessibility with proper ARIA relationships
  it('creates proper ARIA relationships', () => {
    render(
      <ServiceNowFormField 
        label="Assignment Group" 
        error="Invalid assignment group"
        helpText="Choose from available support groups"
      >
        <Input data-testid="assignment-input" />
      </ServiceNowFormField>
    );
    
    const input = screen.getByTestId('assignment-input');
    const describedBy = input.getAttribute('aria-describedby');
    
    expect(describedBy).toContain('error');
    expect(describedBy).toContain('help');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
```

### **Testing Organisms - Complex ServiceNow Components**

Test complete business components that integrate with ServiceNow:

```tsx
// organisms/IncidentCard/IncidentCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncidentCard } from './IncidentCard';
import { createMockIncident } from '@/test-utils';

describe('IncidentCard Organism', () => {
  const mockIncident = createMockIncident({
    sys_id: 'inc123',
    number: { display_value: 'INC0000123', value: 'INC0000123' },
    short_description: { 
      display_value: 'Production server outage', 
      value: 'Production server outage' 
    },
    priority: { display_value: 'High', value: '2' },
    state: { display_value: 'New', value: '1' },
    assigned_to: { display_value: '', value: '' }
  });

  // ServiceNow data display
  it('displays ServiceNow incident data correctly', () => {
    render(<IncidentCard incident={mockIncident} />);
    
    // Test ServiceNow field display_value rendering
    expect(screen.getByText('INC0000123')).toBeInTheDocument();
    expect(screen.getByText('Production server outage')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  // Empty ServiceNow field handling
  it('handles empty ServiceNow field values', () => {
    const incidentWithEmptyFields = createMockIncident({
      assigned_to: { display_value: '', value: '' },
      category: { display_value: null, value: null }
    });
    
    render(<IncidentCard incident={incidentWithEmptyFields} />);
    
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
  });

  // ServiceNow reference field handling
  it('displays ServiceNow reference fields correctly', () => {
    const incidentWithAssignment = createMockIncident({
      assigned_to: {
        display_value: 'John Doe',
        value: 'user123',
        link: 'https://instance.servicenow.com/sys_user.do?sys_id=user123'
      }
    });
    
    render(<IncidentCard incident={incidentWithAssignment} />);
    
    // Should show display_value, not raw value
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('user123')).not.toBeInTheDocument();
  });

  // ServiceNow choice field handling
  it('displays ServiceNow choice fields with proper styling', () => {
    const criticalIncident = createMockIncident({
      priority: { display_value: 'Critical', value: '1' },
      state: { display_value: 'In Progress', value: '2' }
    });
    
    render(<IncidentCard incident={criticalIncident} />);
    
    const priorityBadge = screen.getByText('Critical');
    expect(priorityBadge).toHaveClass('priority-badge--critical');
    
    const stateBadge = screen.getByText('In Progress');
    expect(stateBadge).toHaveClass('state-badge--in-progress');
  });

  // User interactions with ServiceNow data
  it('handles incident selection with ServiceNow data', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();
    
    render(<IncidentCard incident={mockIncident} onSelect={onSelect} />);
    
    await user.click(screen.getByRole('button', { name: /view incident/i }));
    
    expect(onSelect).toHaveBeenCalledWith(mockIncident);
  });

  // ServiceNow operations (assign, update)
  it('handles ServiceNow assignment operations', async () => {
    const onAssign = jest.fn();
    const user = userEvent.setup();
    
    render(<IncidentCard incident={mockIncident} onAssign={onAssign} />);
    
    await user.click(screen.getByRole('button', { name: /assign to me/i }));
    
    expect(onAssign).toHaveBeenCalledWith(mockIncident.sys_id);
  });

  // Loading states during ServiceNow operations
  it('shows loading state during ServiceNow operations', () => {
    render(<IncidentCard incident={mockIncident} isUpdating={true} />);
    
    expect(screen.getByText(/updating/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /assign to me/i })).toBeDisabled();
  });
});
```

---

## ServiceNow-Specific Testing Patterns

### **ServiceNow Field Structure Testing**

```tsx
// utils/ServiceNowFieldUtils.test.ts
import { formatServiceNowField, isEmptyField } from './ServiceNowFieldUtils';

describe('ServiceNow Field Utilities', () => {
  it('formats ServiceNow date fields correctly', () => {
    const dateField = {
      value: '2025-01-15 14:30:00',
      display_value: '2025-01-15 14:30:00'
    };
    
    const formatted = formatServiceNowField(dateField, 'datetime');
    expect(formatted).toBe('Jan 15, 2025 2:30 PM');
  });

  it('handles ServiceNow reference fields', () => {
    const referenceField = {
      value: 'user123',
      display_value: 'John Doe',
      link: 'https://instance.servicenow.com/sys_user.do?sys_id=user123'
    };
    
    expect(isEmptyField(referenceField)).toBe(false);
    expect(formatServiceNowField(referenceField, 'reference')).toBe('John Doe');
  });

  it('identifies empty ServiceNow fields', () => {
    expect(isEmptyField({ value: '', display_value: '' })).toBe(true);
    expect(isEmptyField({ value: null, display_value: null })).toBe(true);
    expect(isEmptyField({ value: 'value', display_value: 'Display' })).toBe(false);
  });
});
```

### **ServiceNow Hook Testing**

```tsx
// hooks/useServiceNowIncidents.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useServiceNowIncidents } from './useServiceNowIncidents';
import { incidentService } from '@/services';
import { createTestProviders } from '@/test-utils';

jest.mock('@/services/incidentService');
const mockIncidentService = incidentService as jest.Mocked<typeof incidentService>;

describe('useServiceNowIncidents Hook', () => {
  it('fetches ServiceNow incidents with proper query parameters', async () => {
    const mockIncidents = [createMockIncident()];
    mockIncidentService.getIncidents.mockResolvedValue({
      result: mockIncidents,
      total: 1
    });

    const { result } = renderHook(
      () => useServiceNowIncidents({ assignedTo: 'current_user' }),
      { wrapper: createTestProviders() }
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.incidents).toEqual(mockIncidents);
    expect(mockIncidentService.getIncidents).toHaveBeenCalledWith({
      sysparm_query: 'assigned_to=javascript:gs.getUserID()',
      sysparm_display_value: 'all'
    });
  });

  it('handles ServiceNow authentication errors', async () => {
    mockIncidentService.getIncidents.mockRejectedValue(
      new ServiceNowError('Authentication failed', 401)
    );

    const { result } = renderHook(
      () => useServiceNowIncidents(),
      { wrapper: createTestProviders() }
    );

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(ServiceNowError);
      expect(result.current.error.status).toBe(401);
    });
  });

  it('handles ServiceNow query building correctly', async () => {
    const filters = {
      priority: ['1', '2'],
      state: 'active',
      category: 'hardware'
    };

    renderHook(
      () => useServiceNowIncidents(filters),
      { wrapper: createTestProviders() }
    );

    await waitFor(() => {
      expect(mockIncidentService.getIncidents).toHaveBeenCalledWith({
        sysparm_query: 'priorityIN1,2^state=1^category=hardware',
        sysparm_display_value: 'all'
      });
    });
  });
});
```

---

## Error Boundary Testing

### **ServiceNow Error Boundary Testing**

```tsx
// components/ErrorBoundary/ServiceNowErrorBoundary.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServiceNowErrorBoundary } from './ServiceNowErrorBoundary';
import { ServiceNowError } from '@/errors';

// Component that throws specific ServiceNow errors
function ServiceNowErrorThrower({ errorType }: { errorType: 'auth' | 'permission' | 'network' }) {
  if (errorType === 'auth') {
    throw new ServiceNowError('Authentication failed', 401);
  }
  if (errorType === 'permission') {
    throw new ServiceNowError('Access denied', 403);
  }
  if (errorType === 'network') {
    throw new ServiceNowError('Network error', 500);
  }
  return <div>No error</div>;
}

describe('ServiceNowErrorBoundary', () => {
  let consoleSpy: jest.SpyInstance;
  
  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders children when no error occurs', () => {
    render(
      <ServiceNowErrorBoundary>
        <div>Working component</div>
      </ServiceNowErrorBoundary>
    );
    
    expect(screen.getByText('Working component')).toBeInTheDocument();
  });

  it('handles ServiceNow authentication errors', () => {
    render(
      <ServiceNowErrorBoundary>
        <ServiceNowErrorThrower errorType="auth" />
      </ServiceNowErrorBoundary>
    );
    
    expect(screen.getByText(/authentication required/i)).toBeInTheDocument();
    expect(screen.getByText(/your session may have expired/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh & login/i })).toBeInTheDocument();
  });

  it('handles ServiceNow permission errors', () => {
    render(
      <ServiceNowErrorBoundary>
        <ServiceNowErrorThrower errorType="permission" />
      </ServiceNowErrorBoundary>
    );
    
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have permission/i)).toBeInTheDocument();
  });

  it('provides retry functionality for network errors', async () => {
    const user = userEvent.setup();
    const onRetry = jest.fn();
    
    render(
      <ServiceNowErrorBoundary onRetry={onRetry}>
        <ServiceNowErrorThrower errorType="network" />
      </ServiceNowErrorBoundary>
    );
    
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
```

---

## Test Utilities for ServiceNow Components

### **ServiceNow Mock Data Factory**

```tsx
// test-utils/serviceNowMocks.ts
export interface ServiceNowField<T = string> {
  value: T;
  display_value: string;
  link?: string;
}

export interface ServiceNowIncident {
  sys_id: string;
  number: ServiceNowField;
  short_description: ServiceNowField;
  description: ServiceNowField;
  priority: ServiceNowField;
  state: ServiceNowField;
  assigned_to: ServiceNowField;
  caller_id: ServiceNowField;
  category: ServiceNowField;
  sys_created_on: ServiceNowField;
  sys_updated_on: ServiceNowField;
}

export const createMockServiceNowField = <T = string>(
  value: T, 
  displayValue?: string,
  link?: string
): ServiceNowField<T> => ({
  value,
  display_value: displayValue || String(value),
  ...(link && { link })
});

export const createMockIncident = (overrides: Partial<ServiceNowIncident> = {}): ServiceNowIncident => ({
  sys_id: 'incident-123',
  number: createMockServiceNowField('INC0000123'),
  short_description: createMockServiceNowField('Test incident description'),
  description: createMockServiceNowField('Detailed description of the test incident'),
  priority: createMockServiceNowField('3', 'Medium'),
  state: createMockServiceNowField('1', 'New'),
  assigned_to: createMockServiceNowField('', ''),
  caller_id: createMockServiceNowField('user123', 'John Doe'),
  category: createMockServiceNowField('software', 'Software'),
  sys_created_on: createMockServiceNowField('2025-01-15 10:00:00'),
  sys_updated_on: createMockServiceNowField('2025-01-15 10:00:00'),
  ...overrides
});

export const createMockServiceNowResponse = <T>(data: T[], total?: number) => ({
  result: data,
  total: total || data.length
});
```

### **Test Providers for ServiceNow Context**

```tsx
// test-utils/TestProviders.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceNowAuthProvider } from '@/providers/ServiceNowAuthProvider';

export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export const createTestProviders = (options: {
  authenticated?: boolean;
  user?: ServiceNowUser;
} = {}) => {
  const queryClient = createTestQueryClient();
  const { authenticated = true, user = createMockUser() } = options;
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ServiceNowAuthProvider 
        value={{ 
          user: authenticated ? user : null,
          isAuthenticated: authenticated,
          token: authenticated ? 'mock-token' : null
        }}
      >
        {children}
      </ServiceNowAuthProvider>
    </QueryClientProvider>
  );
};

// Usage in tests
const renderWithServiceNow = (ui: React.ReactElement, options = {}) => 
  render(ui, { wrapper: createTestProviders(options) });
```

---

## Integration with Testing Strategy

### **Component Testing in Development Workflow**

Component testing is part of our comprehensive testing approach:

1. **Component Tests (this document)** - Test React UI behavior and interactions
2. **[ATF Tests](atf-integration-patterns.md)** - Test ServiceNow configuration artifacts
3. **[Integration Tests](testing-strategy.md)** - Test React + ServiceNow API integration
4. **[E2E Tests](testing-strategy.md)** - Test complete user workflows

### **Quality Gates for Components**

```javascript
// jest.config.js - Component-specific coverage requirements
module.exports = {
  collectCoverageFrom: [
    'src/components/**/*.{ts,tsx}',
    '!src/components/**/*.stories.{ts,tsx}',
    '!src/components/**/*.d.ts',
  ],
  coverageThreshold: {
    // Component testing standards
    './src/components/atoms/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/components/molecules/': {
      branches: 80,
      functions: 80,
      lines: 80, 
      statements: 80,
    },
    './src/components/organisms/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};
```

---

## Best Practices for ServiceNow Component Testing

### **✅ Do This**
- **Test user behavior, not implementation** - Focus on what users see and do
- **Use realistic ServiceNow mock data** - Match actual field structures
- **Include accessibility tests** - Ensure WCAG compliance
- **Test error states** - Handle ServiceNow API failures gracefully
- **Test loading states** - ServiceNow operations take time
- **Use proper ARIA queries** - screen.getByRole, screen.getByLabelText
- **Test keyboard navigation** - Ensure components are keyboard accessible

### **❌ Avoid This**
- **Testing internal state** - Focus on outputs, not implementation
- **Shallow rendering** - Use React Testing Library, not Enzyme
- **Ignoring ServiceNow field structures** - Test with realistic data
- **Skipping accessibility tests** - Accessibility is not optional
- **Over-mocking** - Mock only what's necessary
- **Testing React internals** - Don't test React itself

---

## Relationship to Component Architecture

### **Integration with Atomic Design:**
- **[Atomic Design Principles](atomic-design-principles.md)** - Foundation for component hierarchy
- **[ServiceNow Atoms](servicenow-atoms.md)** - Basic UI elements with ServiceNow integration
- **[ServiceNow Molecules](servicenow-molecules.md)** - Functional combinations
- **[ServiceNow Organisms](servicenow-organisms.md)** - Complex business components

### **Integration with Testing Strategy:**
- **[Testing Strategy](testing-strategy.md)** - Overall testing approach and React + ATF integration
- **[ATF Integration Patterns](atf-integration-patterns.md)** - ServiceNow configuration testing
- **[Performance Optimization](performance-optimization.md)** - Performance testing patterns

### **Supporting Patterns:**
- **[Component Reusability](../component-reusability.md)** - Why testing supports reusability
- **[Error Boundaries](error-boundaries.md)** - Testing error handling patterns
- **[File Organization](file-organization.md)** - Where to place test files

---

## Next Steps

### **Implementation Priority:**
1. **Set up testing infrastructure** - React Testing Library, Jest, test utilities
2. **Create ServiceNow mock factories** - Realistic test data patterns
3. **Test atomic components first** - Build testing foundation
4. **Add molecule and organism tests** - Test complex interactions
5. **Integrate with CI/CD pipeline** - Automated testing and quality gates

### **Advanced Testing:**
- **Visual regression testing** - Storybook + Chromatic integration
- **Performance testing** - Component rendering performance
- **Cross-browser testing** - Ensure compatibility across browsers

---

*Component testing is essential for reliable ServiceNow React applications. Focus on user behavior, include accessibility testing, and use realistic ServiceNow data structures to build confidence in your components.*