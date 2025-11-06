---
title: "ServiceNow Atoms: Basic UI Elements"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Implementation guide for atomic-level ServiceNow UI components with design system alignment"
readTime: "6 minutes"
complexity: "intermediate"
status: "ACTIVE"
criticality: "RECOMMENDED"
prerequisites: ["atomic-design-principles", "core-principles"]
tags: ["atoms", "ui-components", "servicenow", "design-system"]
---

# ServiceNow Atoms: Basic UI Elements

**Purpose:** Implementation guide for atomic-level ServiceNow UI components with design system alignment  
**Read time:** ~6 minutes  
**Prerequisites:** [Atomic Design Principles](atomic-design-principles.md), [Core Principles](../core-principles.md)

---

## ServiceNow Atom Characteristics

Atoms are the foundational building blocks of ServiceNow interfaces. They should:

- **Align with ServiceNow design system** - Use platform design tokens and patterns
- **Be completely stateless** - No internal state management
- **Handle one responsibility** - Single, focused purpose
- **Support accessibility** - WCAG 2.1 AA compliance by default
- **Work across contexts** - Portal, Next Experience, embedded UI

---

## Core ServiceNow Atoms

### **Button Atom**

The foundation of all interactive elements in ServiceNow applications.

```tsx
// atoms/Button/Button.tsx
import { forwardRef } from 'react';
import { ButtonProps } from './Button.types';
import styles from './Button.module.css';

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  'data-testid': testId,
  ...props
}, ref) => {
  const classNames = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    loading && styles['button--loading'],
    disabled && styles['button--disabled']
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={ref}
      className={classNames}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-describedby={loading ? 'loading-indicator' : undefined}
      data-testid={testId}
      {...props}
    >
      {loading && (
        <span 
          id="loading-indicator" 
          className={styles.spinner}
          aria-label="Loading"
          role="status"
        >
          <SpinnerIcon />
        </span>
      )}
      <span className={styles.content}>
        {children}
      </span>
    </button>
  );
});

Button.displayName = 'Button';
```

```tsx
// atoms/Button/Button.types.ts
import { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
  'data-testid'?: string;
}
```

```css
/* atoms/Button/Button.module.css */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sn-spacing-sm);
  font-family: var(--sn-font-family);
  font-weight: var(--sn-font-weight-medium);
  border: var(--sn-border-width) solid transparent;
  border-radius: var(--sn-border-radius-md);
  cursor: pointer;
  transition: var(--sn-transition-default);
  text-decoration: none;
  outline: none;
}

.button:focus-visible {
  outline: 2px solid var(--sn-color-focus);
  outline-offset: 2px;
}

.button--sm {
  padding: var(--sn-spacing-sm) var(--sn-spacing-md);
  font-size: var(--sn-font-size-sm);
  min-height: 2rem;
}

.button--md {
  padding: var(--sn-spacing-md) var(--sn-spacing-lg);
  font-size: var(--sn-font-size-md);
  min-height: 2.5rem;
}

.button--lg {
  padding: var(--sn-spacing-lg) var(--sn-spacing-xl);
  font-size: var(--sn-font-size-lg);
  min-height: 3rem;
}

/* Variants */
.button--primary {
  background-color: var(--sn-color-primary);
  color: var(--sn-color-primary-contrast);
  border-color: var(--sn-color-primary);
}

.button--primary:hover:not(:disabled) {
  background-color: var(--sn-color-primary-hover);
  border-color: var(--sn-color-primary-hover);
}

.button--secondary {
  background-color: var(--sn-color-secondary);
  color: var(--sn-color-secondary-contrast);
  border-color: var(--sn-color-border);
}

.button--destructive {
  background-color: var(--sn-color-danger);
  color: var(--sn-color-danger-contrast);
  border-color: var(--sn-color-danger);
}

/* States */
.button--loading {
  pointer-events: none;
}

.button--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### **Input Atom**

Foundation for all text input controls in ServiceNow.

```tsx
// atoms/Input/Input.tsx
import { forwardRef } from 'react';
import { InputProps } from './Input.types';
import styles from './Input.module.css';

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  size = 'md',
  error = false,
  disabled = false,
  fullWidth = false,
  startIcon,
  endIcon,
  'data-testid': testId,
  className,
  ...props
}, ref) => {
  const classNames = [
    styles.input,
    styles[`input--${variant}`],
    styles[`input--${size}`],
    error && styles['input--error'],
    disabled && styles['input--disabled'],
    fullWidth && styles['input--full-width'],
    className
  ].filter(Boolean).join(' ');

  const inputElement = (
    <input
      ref={ref}
      className={classNames}
      disabled={disabled}
      aria-invalid={error}
      data-testid={testId}
      {...props}
    />
  );

  if (startIcon || endIcon) {
    return (
      <div className={styles.inputWrapper}>
        {startIcon && (
          <span className={styles.startIcon} aria-hidden="true">
            {startIcon}
          </span>
        )}
        {inputElement}
        {endIcon && (
          <span className={styles.endIcon} aria-hidden="true">
            {endIcon}
          </span>
        )}
      </div>
    );
  }

  return inputElement;
});

Input.displayName = 'Input';
```

```tsx
// atoms/Input/Input.types.ts
import { InputHTMLAttributes } from 'react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'search' | 'number';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  'data-testid'?: string;
}
```

### **Badge Atom**

For displaying status, labels, and categorical information.

```tsx
// atoms/Badge/Badge.tsx
import { BadgeProps } from './Badge.types';
import styles from './Badge.module.css';

export function Badge({
  variant = 'default',
  size = 'md',
  icon,
  children,
  'data-testid': testId,
  className,
  ...props
}: BadgeProps) {
  const classNames = [
    styles.badge,
    styles[`badge--${variant}`],
    styles[`badge--${size}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <span
      className={classNames}
      role="status"
      data-testid={testId}
      {...props}
    >
      {icon && (
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className={styles.text}>
        {children}
      </span>
    </span>
  );
}
```

```tsx
// atoms/Badge/Badge.types.ts
import { HTMLAttributes } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  'data-testid'?: string;
}
```

### **ServiceNow Field Display Atom**

Specialized atom for displaying ServiceNow field values with proper formatting.

```tsx
// atoms/FieldDisplay/FieldDisplay.tsx
import { FieldDisplayProps } from './FieldDisplay.types';
import { formatServiceNowField } from './utils/formatting';
import styles from './FieldDisplay.module.css';

export function FieldDisplay({
  field,
  type = 'string',
  format,
  placeholder = '--',
  interactive = false,
  onClick,
  'data-testid': testId,
  className,
  ...props
}: FieldDisplayProps) {
  // Handle empty or null fields
  if (!field || (!field.display_value && !field.value)) {
    return (
      <span 
        className={`${styles.fieldDisplay} ${styles.empty} ${className || ''}`}
        data-testid={testId}
        {...props}
      >
        {placeholder}
      </span>
    );
  }

  const formattedValue = formatServiceNowField(field, type, format);
  const isClickable = interactive && onClick;

  const classNames = [
    styles.fieldDisplay,
    styles[`fieldDisplay--${type}`],
    isClickable && styles['fieldDisplay--interactive'],
    className
  ].filter(Boolean).join(' ');

  if (isClickable) {
    return (
      <button
        type="button"
        className={classNames}
        onClick={() => onClick(field)}
        data-testid={testId}
        {...props}
      >
        {formattedValue}
      </button>
    );
  }

  if (type === 'datetime' && field.value) {
    return (
      <time
        className={classNames}
        dateTime={field.value}
        data-testid={testId}
        {...props}
      >
        {formattedValue}
      </time>
    );
  }

  return (
    <span
      className={classNames}
      data-testid={testId}
      {...props}
    >
      {formattedValue}
    </span>
  );
}
```

```tsx
// atoms/FieldDisplay/FieldDisplay.types.ts
export interface ServiceNowField {
  value: string | null;
  display_value?: string | null;
  link?: string | null;
}

export interface FieldDisplayProps extends HTMLAttributes<HTMLElement> {
  field: ServiceNowField;
  type?: 'string' | 'reference' | 'datetime' | 'choice' | 'boolean' | 'number';
  format?: string; // For custom formatting
  placeholder?: string;
  interactive?: boolean;
  onClick?: (field: ServiceNowField) => void;
  'data-testid'?: string;
}
```

```tsx
// atoms/FieldDisplay/utils/formatting.ts
import { ServiceNowField } from '../FieldDisplay.types';

export function formatServiceNowField(
  field: ServiceNowField,
  type: string,
  format?: string
): string {
  const displayValue = field.display_value || field.value || '';

  switch (type) {
    case 'datetime':
      return formatDateTime(field.value, format);
    
    case 'boolean':
      return field.value === 'true' ? 'Yes' : 'No';
    
    case 'number':
      return formatNumber(field.value, format);
    
    case 'reference':
      return displayValue;
    
    case 'choice':
      return displayValue;
    
    default:
      return displayValue;
  }
}

function formatDateTime(value: string | null, format?: string): string {
  if (!value) return '';
  
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;

  if (format === 'short') {
    return date.toLocaleDateString();
  }
  if (format === 'time') {
    return date.toLocaleTimeString();
  }
  
  return date.toLocaleString();
}

function formatNumber(value: string | null, format?: string): string {
  if (!value) return '';
  
  const num = parseFloat(value);
  if (isNaN(num)) return value;

  if (format === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  }
  
  return num.toLocaleString();
}
```

---

## Icon System Integration

### **ServiceNow Icon Atom**

```tsx
// atoms/Icon/Icon.tsx
import { IconProps } from './Icon.types';
import { getServiceNowIcon } from './utils/iconMap';
import styles from './Icon.module.css';

export function Icon({
  name,
  size = 'md',
  color,
  'data-testid': testId,
  className,
  ...props
}: IconProps) {
  const IconComponent = getServiceNowIcon(name);
  
  const classNames = [
    styles.icon,
    styles[`icon--${size}`],
    className
  ].filter(Boolean).join(' ');

  const style = color ? { color } : undefined;

  return (
    <span
      className={classNames}
      style={style}
      aria-hidden="true"
      data-testid={testId}
      {...props}
    >
      <IconComponent />
    </span>
  );
}
```

```tsx
// atoms/Icon/Icon.types.ts
export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: ServiceNowIconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  'data-testid'?: string;
}

export type ServiceNowIconName = 
  | 'incident'
  | 'user'
  | 'priority-high'
  | 'priority-low'
  | 'status-new'
  | 'status-in-progress'
  | 'status-resolved'
  | 'chevron-down'
  | 'search'
  | 'close'
  | 'check'
  | 'warning'
  | 'info'
  | 'loading';
```

---

## Accessibility Implementation

### **Focus Management**

```tsx
// atoms/FocusableElement/FocusableElement.tsx
import { forwardRef } from 'react';
import styles from './FocusableElement.module.css';

export const FocusableElement = forwardRef<HTMLElement, FocusableElementProps>(({
  as: Component = 'div',
  focusable = true,
  onFocus,
  onBlur,
  children,
  className,
  ...props
}, ref) => {
  const classNames = [
    styles.focusable,
    focusable && styles['focusable--enabled'],
    className
  ].filter(Boolean).join(' ');

  return (
    <Component
      ref={ref}
      className={classNames}
      tabIndex={focusable ? 0 : -1}
      onFocus={onFocus}
      onBlur={onBlur}
      {...props}
    >
      {children}
    </Component>
  );
});
```

### **Screen Reader Support**

```tsx
// atoms/ScreenReaderOnly/ScreenReaderOnly.tsx
export function ScreenReaderOnly({ 
  children, 
  as: Component = 'span' 
}: ScreenReaderOnlyProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}

/* CSS */
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
```

---

## Testing ServiceNow Atoms

### **Unit Test Example**

```tsx
// atoms/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with correct variant classes', () => {
    render(<Button variant="primary">Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toHaveClass('button--primary');
  });

  it('shows loading state correctly', () => {
    render(<Button loading>Submit</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-describedby', 'loading-indicator');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is accessible with keyboard navigation', () => {
    render(<Button>Accessible button</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    expect(button).toHaveFocus();
    
    fireEvent.keyDown(button, { key: 'Enter' });
    // Add assertions for Enter key handling
  });
});
```

### **Storybook Integration**

```tsx
// atoms/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'tertiary', 'destructive', 'ghost'],
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};
```

---

## File Organization

### **Atom Structure**
```
src/components/atoms/Button/
├── Button.tsx              # Main component
├── Button.types.ts         # TypeScript interfaces
├── Button.module.css       # Component styles
├── Button.test.tsx         # Unit tests
├── Button.stories.tsx      # Storybook stories
├── index.ts                # Export interface
└── utils/                  # Component utilities
    └── buttonHelpers.ts
```

### **Barrel Exports**
```tsx
// atoms/index.ts
export { Button } from './Button';
export { Input } from './Input';
export { Badge } from './Badge';
export { Icon } from './Icon';
export { FieldDisplay } from './FieldDisplay';

export type { ButtonProps } from './Button';
export type { InputProps } from './Input';
export type { BadgeProps } from './Badge';
export type { IconProps } from './Icon';
export type { FieldDisplayProps } from './FieldDisplay';
```

---

## Best Practices for ServiceNow Atoms

### **✅ Do This**
- **Use ServiceNow design tokens** - Consistent with platform styling
- **Include proper TypeScript types** - Full type safety
- **Implement accessibility by default** - WCAG 2.1 AA compliance
- **Test thoroughly** - Unit tests and Storybook documentation
- **Keep components stateless** - Pure presentation components
- **Use forwardRef for interactive elements** - Proper ref handling
- **Include proper ARIA attributes** - Screen reader support

### **❌ Avoid This**
- **Internal state management** - Keep atoms stateless
- **Business logic** - Pure presentation only
- **ServiceNow API calls** - No data fetching in atoms
- **Complex prop configurations** - Keep interfaces simple
- **Platform-specific styling without fallbacks** - Ensure compatibility
- **Missing accessibility features** - Always include ARIA support

---

## Next Steps

**Atoms completed! Continue building:**

### **Next Level Components:**
- [ServiceNow Molecules](servicenow-molecules.md) - Combining atoms into functional units
- [ServiceNow Organisms](servicenow-organisms.md) - Complex business components

### **Integration Patterns:**
- [File Organization](file-organization.md) - Organizing atomic components
- [Component Testing](component-testing.md) - Testing strategies for atoms

### **Related Concepts:**
- [State Management](state-management.md) - Managing state above atoms
- [Styling Practices](../styling-practices.md) - CSS organization for components

---

*ServiceNow atoms form the foundation of consistent, accessible, and reusable UI components. Focus on single responsibility, accessibility, and platform alignment to create atoms that work seamlessly across all ServiceNow interfaces.*