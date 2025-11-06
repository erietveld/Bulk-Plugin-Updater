---
title: "ServiceNow Molecules: Functional Component Combinations"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Implementation guide for molecular-level ServiceNow components that combine atoms into functional units"
readTime: "7 minutes"
complexity: "intermediate"
status: "ACTIVE"
criticality: "RECOMMENDED"
prerequisites: ["servicenow-atoms", "atomic-design-principles"]
tags: ["molecules", "components", "servicenow", "forms", "ui"]
---

# ServiceNow Molecules: Functional Component Combinations

**Purpose:** Implementation guide for molecular-level ServiceNow components that combine atoms into functional units  
**Read time:** ~7 minutes  
**Prerequisites:** [ServiceNow Atoms](servicenow-atoms.md), [Atomic Design Principles](atomic-design-principles.md)

---

## ServiceNow Molecule Characteristics

Molecules combine 2-5 atoms to create functional units that serve specific purposes in ServiceNow applications. They should:

- **Have single functional purpose** - Clear, focused responsibility
- **Be reusable across contexts** - Work in different ServiceNow interfaces
- **Handle simple interactions** - Basic user interactions and validation
- **Remain composable** - Easy to combine into larger components
- **Integrate with ServiceNow patterns** - Align with platform conventions

---

## Form-Related Molecules

### **ServiceNow Form Field Molecule**

The fundamental building block for all ServiceNow forms, combining label, input, help text, and error display.

```tsx
// molecules/FormField/FormField.tsx
import { cloneElement, useId } from 'react';
import { FormFieldProps } from './FormField.types';
import { Icon } from '@/components/atoms';
import styles from './FormField.module.css';

export function FormField({
  label,
  children,
  required = false,
  disabled = false,
  error,
  helpText,
  hint,
  layout = 'vertical',
  'data-testid': testId,
  className,
  ...props
}: FormFieldProps) {
  const fieldId = useId();
  const errorId = error ? `${fieldId}-error` : undefined;
  const helpId = helpText ? `${fieldId}-help` : undefined;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  
  const describedBy = [errorId, helpId, hintId].filter(Boolean).join(' ') || undefined;

  const classNames = [
    styles.formField,
    styles[`formField--${layout}`],
    error && styles['formField--error'],
    disabled && styles['formField--disabled'],
    className
  ].filter(Boolean).join(' ');

  // Clone the input element with proper accessibility attributes
  const inputElement = cloneElement(children, {
    id: fieldId,
    'aria-describedby': describedBy,
    'aria-invalid': error ? 'true' : 'false',
    'aria-required': required,
    disabled: disabled || children.props.disabled,
  });

  return (
    <div className={classNames} data-testid={testId} {...props}>
      <div className={styles.labelSection}>
        <label htmlFor={fieldId} className={styles.label}>
          {label}
          {required && (
            <span className={styles.required} aria-label="required">
              *
            </span>
          )}
        </label>
        
        {hint && (
          <div id={hintId} className={styles.hint}>
            <Icon name="info" size="sm" />
            {hint}
          </div>
        )}
      </div>

      <div className={styles.inputSection}>
        {inputElement}
      </div>

      {helpText && (
        <div id={helpId} className={styles.helpText}>
          {helpText}
        </div>
      )}

      {error && (
        <div id={errorId} className={styles.error} role="alert">
          <Icon name="warning" size="sm" />
          {error}
        </div>
      )}
    </div>
  );
}
```

```tsx
// molecules/FormField/FormField.types.ts
import { HTMLAttributes, ReactElement } from 'react';

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  children: ReactElement; // Single input element
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  hint?: string;
  layout?: 'vertical' | 'horizontal';
  'data-testid'?: string;
}
```

```css
/* molecules/FormField/FormField.module.css */
.formField {
  display: flex;
  flex-direction: column;
  gap: var(--sn-spacing-sm);
  margin-bottom: var(--sn-spacing-md);
}

.formField--horizontal {
  flex-direction: row;
  align-items: flex-start;
}

.formField--horizontal .labelSection {
  flex: 0 0 200px;
  padding-top: var(--sn-spacing-sm);
}

.formField--horizontal .inputSection {
  flex: 1;
}

.labelSection {
  display: flex;
  align-items: center;
  gap: var(--sn-spacing-sm);
}

.label {
  font-weight: var(--sn-font-weight-medium);
  color: var(--sn-color-text);
  font-size: var(--sn-font-size-md);
  line-height: var(--sn-line-height-md);
}

.required {
  color: var(--sn-color-danger);
  font-weight: var(--sn-font-weight-bold);
}

.hint {
  display: flex;
  align-items: center;
  gap: var(--sn-spacing-xs);
  color: var(--sn-color-text-secondary);
  font-size: var(--sn-font-size-sm);
}

.helpText {
  color: var(--sn-color-text-secondary);
  font-size: var(--sn-font-size-sm);
  line-height: var(--sn-line-height-sm);
}

.error {
  display: flex;
  align-items: center;
  gap: var(--sn-spacing-xs);
  color: var(--sn-color-danger);
  font-size: var(--sn-font-size-sm);
  font-weight: var(--sn-font-weight-medium);
}

.formField--error .inputSection input,
.formField--error .inputSection select,
.formField--error .inputSection textarea {
  border-color: var(--sn-color-danger);
}

.formField--disabled {
  opacity: 0.6;
}
```

### **ServiceNow Reference Field Molecule**

Specialized molecule for ServiceNow reference fields with search and selection capabilities.

```tsx
// molecules/ReferenceField/ReferenceField.tsx
import { useState, useRef, useEffect } from 'react';
import { Input, Button, Icon, Badge } from '@/components/atoms';
import { ReferenceFieldProps } from './ReferenceField.types';
import { useServiceNowReference } from './hooks/useServiceNowReference';
import styles from './ReferenceField.module.css';

export function ReferenceField({
  table,
  value,
  displayValue,
  onChange,
  onClear,
  placeholder = 'Search...',
  disabled = false,
  required = false,
  maxResults = 10,
  searchFields = ['name'],
  displayFields = ['name'],
  'data-testid': testId,
  ...props
}: ReferenceFieldProps) {
  const [searchTerm, setSearchTerm] = useState(displayValue || '');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const {
    searchResults,
    isLoading,
    error,
    search,
    clearSearch
  } = useServiceNowReference(table, {
    searchFields,
    displayFields,
    maxResults
  });

  // Update search term when displayValue changes externally
  useEffect(() => {
    if (displayValue !== searchTerm) {
      setSearchTerm(displayValue || '');
    }
  }, [displayValue]);

  const handleInputChange = (inputValue: string) => {
    setSearchTerm(inputValue);
    setSelectedIndex(-1);
    
    if (inputValue.length >= 2) {
      search(inputValue);
      setIsOpen(true);
    } else {
      clearSearch();
      setIsOpen(false);
    }
  };

  const handleResultSelect = (result: ServiceNowRecord) => {
    const newDisplayValue = result[displayFields[0]]?.display_value || result[displayFields[0]]?.value || '';
    
    setSearchTerm(newDisplayValue);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    onChange(result.sys_id, newDisplayValue, result);
  };

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
    clearSearch();
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0) {
          handleResultSelect(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className={styles.referenceField} data-testid={testId} {...props}>
      <div className={styles.inputWrapper}>
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          startIcon={<Icon name="search" size="sm" />}
          endIcon={
            searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                tabIndex={-1}
                aria-label="Clear selection"
              >
                <Icon name="close" size="sm" />
              </Button>
            )
          }
        />
      </div>

      {isOpen && (
        <div className={styles.dropdown} role="listbox">
          {isLoading && (
            <div className={styles.loading}>
              <Icon name="loading" size="sm" />
              <span>Searching...</span>
            </div>
          )}

          {error && (
            <div className={styles.error}>
              <Icon name="warning" size="sm" />
              <span>Error loading results</span>
            </div>
          )}

          {searchResults.length > 0 && (
            <ul ref={listRef} className={styles.resultsList}>
              {searchResults.map((result, index) => (
                <li
                  key={result.sys_id}
                  className={`${styles.resultItem} ${index === selectedIndex ? styles.selected : ''}`}
                  onClick={() => handleResultSelect(result)}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div className={styles.resultContent}>
                    <div className={styles.primaryText}>
                      {result[displayFields[0]]?.display_value || result[displayFields[0]]?.value}
                    </div>
                    {displayFields[1] && (
                      <div className={styles.secondaryText}>
                        {result[displayFields[1]]?.display_value || result[displayFields[1]]?.value}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {searchResults.length === 0 && !isLoading && !error && searchTerm.length >= 2 && (
            <div className={styles.noResults}>
              No results found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### **Choice Field Molecule**

For ServiceNow choice fields with proper accessibility and styling.

```tsx
// molecules/ChoiceField/ChoiceField.tsx
import { ChoiceFieldProps } from './ChoiceField.types';
import { Badge, Icon } from '@/components/atoms';
import styles from './ChoiceField.module.css';

export function ChoiceField({
  choices,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  multiple = false,
  showBadges = false,
  'data-testid': testId,
  ...props
}: ChoiceFieldProps) {
  const selectedChoices = multiple && Array.isArray(value) ? value : [value];
  const selectedLabels = selectedChoices
    .map(val => choices.find(choice => choice.value === val)?.label)
    .filter(Boolean);

  const handleSingleSelect = (choiceValue: string) => {
    onChange(choiceValue);
  };

  const handleMultipleSelect = (choiceValue: string) => {
    if (!Array.isArray(value)) return;

    const newSelection = value.includes(choiceValue)
      ? value.filter(val => val !== choiceValue)
      : [...value, choiceValue];
    
    onChange(newSelection);
  };

  const handleSelect = (choiceValue: string) => {
    if (multiple) {
      handleMultipleSelect(choiceValue);
    } else {
      handleSingleSelect(choiceValue);
    }
  };

  if (showBadges && selectedLabels.length > 0) {
    return (
      <div className={styles.badgeContainer} data-testid={testId} {...props}>
        {selectedLabels.map((label, index) => (
          <Badge key={index} variant="info">
            {label}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <select
      className={styles.choiceField}
      value={multiple ? undefined : (value as string) || ''}
      onChange={(e) => !multiple && handleSingleSelect(e.target.value)}
      disabled={disabled}
      multiple={multiple}
      data-testid={testId}
      {...props}
    >
      {!multiple && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      
      {choices.map((choice) => (
        <option
          key={choice.value}
          value={choice.value}
          selected={multiple ? selectedChoices.includes(choice.value) : undefined}
        >
          {choice.label}
        </option>
      ))}
    </select>
  );
}
```

---

## Display Molecules

### **ServiceNow Record Summary Molecule**

Displays key information about a ServiceNow record in a consistent format.

```tsx
// molecules/RecordSummary/RecordSummary.tsx
import { RecordSummaryProps } from './RecordSummary.types';
import { FieldDisplay, Badge, Icon } from '@/components/atoms';
import styles from './RecordSummary.module.css';

export function RecordSummary({
  record,
  fields,
  layout = 'vertical',
  showLabels = true,
  onFieldClick,
  highlightFields = [],
  'data-testid': testId,
  ...props
}: RecordSummaryProps) {
  const classNames = [
    styles.recordSummary,
    styles[`recordSummary--${layout}`]
  ].join(' ');

  return (
    <div className={classNames} data-testid={testId} {...props}>
      {fields.map((fieldConfig) => {
        const fieldValue = record[fieldConfig.name];
        if (!fieldValue && !fieldConfig.showEmpty) return null;

        const isHighlighted = highlightFields.includes(fieldConfig.name);
        const isClickable = onFieldClick && fieldConfig.clickable;

        return (
          <div
            key={fieldConfig.name}
            className={`${styles.field} ${isHighlighted ? styles.highlighted : ''}`}
          >
            {showLabels && (
              <dt className={styles.label}>
                {fieldConfig.label}
                {fieldConfig.required && (
                  <span className={styles.required}>*</span>
                )}
              </dt>
            )}
            
            <dd className={styles.value}>
              <FieldDisplay
                field={fieldValue}
                type={fieldConfig.type}
                format={fieldConfig.format}
                interactive={isClickable}
                onClick={isClickable ? () => onFieldClick(fieldConfig.name, record) : undefined}
              />
              
              {fieldConfig.badge && (
                <Badge variant={fieldConfig.badge.variant} size="sm">
                  {fieldConfig.badge.text}
                </Badge>
              )}
            </dd>
          </div>
        );
      })}
    </div>
  );
}
```

### **Status Indicator Molecule**

Combines status display with icon and color coding for ServiceNow records.

```tsx
// molecules/StatusIndicator/StatusIndicator.tsx
import { StatusIndicatorProps } from './StatusIndicator.types';
import { Icon, Badge } from '@/components/atoms';
import { getStatusConfig } from './utils/statusConfig';
import styles from './StatusIndicator.module.css';

export function StatusIndicator({
  status,
  table,
  size = 'md',
  showText = true,
  showIcon = true,
  variant = 'badge',
  'data-testid': testId,
  ...props
}: StatusIndicatorProps) {
  const statusConfig = getStatusConfig(table, status);
  
  if (!statusConfig) {
    return (
      <span className={styles.unknown} data-testid={testId}>
        {status}
      </span>
    );
  }

  const { icon, color, label, badgeVariant } = statusConfig;

  if (variant === 'badge') {
    return (
      <Badge
        variant={badgeVariant}
        size={size}
        icon={showIcon ? <Icon name={icon} size="sm" /> : undefined}
        data-testid={testId}
        {...props}
      >
        {showText ? label : null}
      </Badge>
    );
  }

  return (
    <span
      className={`${styles.statusIndicator} ${styles[`statusIndicator--${size}`]}`}
      style={{ color }}
      data-testid={testId}
      {...props}
    >
      {showIcon && <Icon name={icon} size={size} />}
      {showText && <span className={styles.text}>{label}</span>}
    </span>
  );
}
```

---

## Action Molecules

### **Action Button Group Molecule**

Groups related actions with consistent spacing and alignment.

```tsx
// molecules/ActionButtonGroup/ActionButtonGroup.tsx
import { ActionButtonGroupProps } from './ActionButtonGroup.types';
import { Button } from '@/components/atoms';
import styles from './ActionButtonGroup.module.css';

export function ActionButtonGroup({
  actions,
  layout = 'horizontal',
  size = 'md',
  alignment = 'start',
  loading = false,
  disabled = false,
  'data-testid': testId,
  ...props
}: ActionButtonGroupProps) {
  const classNames = [
    styles.actionGroup,
    styles[`actionGroup--${layout}`],
    styles[`actionGroup--${alignment}`]
  ].join(' ');

  return (
    <div className={classNames} data-testid={testId} {...props}>
      {actions.map((action, index) => (
        <Button
          key={action.id || index}
          variant={action.variant}
          size={size}
          disabled={disabled || action.disabled}
          loading={loading && action.loading}
          onClick={action.onClick}
          data-testid={action.testId}
        >
          {action.icon && action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
```

### **Quick Actions Molecule**

Compact action menu for common ServiceNow record operations.

```tsx
// molecules/QuickActions/QuickActions.tsx
import { useState } from 'react';
import { QuickActionsProps } from './QuickActions.types';
import { Button, Icon } from '@/components/atoms';
import styles from './QuickActions.module.css';

export function QuickActions({
  actions,
  record,
  trigger = 'button',
  placement = 'bottom-end',
  'data-testid': testId,
  ...props
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleActionClick = (action: QuickAction) => {
    action.onClick(record);
    setIsOpen(false);
  };

  const triggerElement = trigger === 'button' ? (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsOpen(!isOpen)}
      aria-expanded={isOpen}
      aria-haspopup="menu"
    >
      <Icon name="more-vertical" size="sm" />
    </Button>
  ) : (
    <button
      className={styles.iconTrigger}
      onClick={() => setIsOpen(!isOpen)}
      aria-expanded={isOpen}
      aria-haspopup="menu"
    >
      <Icon name="more-vertical" size="sm" />
    </button>
  );

  return (
    <div className={styles.quickActions} data-testid={testId} {...props}>
      {triggerElement}
      
      {isOpen && (
        <div className={`${styles.menu} ${styles[`menu--${placement}`]}`} role="menu">
          {actions.map((action) => (
            <button
              key={action.id}
              className={`${styles.menuItem} ${action.destructive ? styles.destructive : ''}`}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              role="menuitem"
            >
              {action.icon && <Icon name={action.icon} size="sm" />}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Search and Filter Molecules

### **Search Box Molecule**

Advanced search input with filters and suggestions.

```tsx
// molecules/SearchBox/SearchBox.tsx
import { useState, useRef } from 'react';
import { SearchBoxProps } from './SearchBox.types';
import { Input, Button, Icon, Badge } from '@/components/atoms';
import styles from './SearchBox.module.css';

export function SearchBox({
  value = '',
  onChange,
  onSearch,
  onClear,
  placeholder = 'Search...',
  suggestions = [],
  filters = [],
  showFilters = false,
  loading = false,
  'data-testid': testId,
  ...props
}: SearchBoxProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue);
    setShowSuggestions(inputValue.length > 0 && suggestions.length > 0);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    onSearch?.(suggestion);
  };

  const handleFilterToggle = (filterId: string) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(id => id !== filterId)
      : [...activeFilters, filterId];
    
    setActiveFilters(newFilters);
  };

  const handleClear = () => {
    onChange('');
    setActiveFilters([]);
    setShowSuggestions(false);
    onClear?.();
    inputRef.current?.focus();
  };

  return (
    <div className={styles.searchBox} data-testid={testId} {...props}>
      <div className={styles.inputSection}>
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          startIcon={<Icon name="search" size="sm" />}
          endIcon={
            value && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                aria-label="Clear search"
              >
                <Icon name="close" size="sm" />
              </Button>
            )
          }
        />
        
        {loading && (
          <div className={styles.loadingIndicator}>
            <Icon name="loading" size="sm" />
          </div>
        )}
      </div>

      {showFilters && filters.length > 0 && (
        <div className={styles.filters}>
          {filters.map((filter) => (
            <Badge
              key={filter.id}
              variant={activeFilters.includes(filter.id) ? 'info' : 'neutral'}
              size="sm"
              className={styles.filterBadge}
              onClick={() => handleFilterToggle(filter.id)}
            >
              {filter.label}
            </Badge>
          ))}
        </div>
      )}

      {showSuggestions && (
        <div className={styles.suggestions}>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className={styles.suggestionItem}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <Icon name="search" size="sm" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Testing ServiceNow Molecules

### **Testing FormField Molecule**

```tsx
// molecules/FormField/FormField.test.tsx
import { render, screen } from '@testing-library/react';
import { FormField } from './FormField';
import { Input } from '@/components/atoms';

describe('FormField', () => {
  it('renders label and input correctly', () => {
    render(
      <FormField label="Email Address" required>
        <Input type="email" />
      </FormField>
    );

    const label = screen.getByText('Email Address');
    const input = screen.getByRole('textbox');
    
    expect(label).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('displays error message with proper ARIA attributes', () => {
    render(
      <FormField label="Email" error="Invalid email format">
        <Input type="email" />
      </FormField>
    );

    const input = screen.getByRole('textbox');
    const error = screen.getByRole('alert');
    
    expect(error).toHaveTextContent('Invalid email format');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', expect.stringContaining('error'));
  });

  it('handles horizontal layout', () => {
    render(
      <FormField label="Name" layout="horizontal">
        <Input />
      </FormField>
    );

    const formField = screen.getByText('Name').closest('.formField');
    expect(formField).toHaveClass('formField--horizontal');
  });
});
```

---

## File Organization for Molecules

### **Molecule Structure**
```
src/components/molecules/FormField/
├── FormField.tsx           # Main component
├── FormField.types.ts      # TypeScript interfaces
├── FormField.module.css    # Component styles
├── FormField.test.tsx      # Unit tests
├── FormField.stories.tsx   # Storybook stories
├── index.ts                # Export interface
├── hooks/                  # Component-specific hooks
│   └── useFormField.ts
└── utils/                  # Component utilities
    └── validation.ts
```

### **Molecule Exports**
```tsx
// molecules/index.ts
export { FormField } from './FormField';
export { ReferenceField } from './ReferenceField';
export { ChoiceField } from './ChoiceField';
export { RecordSummary } from './RecordSummary';
export { StatusIndicator } from './StatusIndicator';
export { ActionButtonGroup } from './ActionButtonGroup';
export { QuickActions } from './QuickActions';
export { SearchBox } from './SearchBox';

// Export types
export type { FormFieldProps } from './FormField';
export type { ReferenceFieldProps } from './ReferenceField';
export type { ChoiceFieldProps } from './ChoiceField';
export type { RecordSummaryProps } from './RecordSummary';
export type { StatusIndicatorProps } from './StatusIndicator';
export type { ActionButtonGroupProps } from './ActionButtonGroup';
export type { QuickActionsProps } from './QuickActions';
export type { SearchBoxProps } from './SearchBox';
```

---

## Best Practices for ServiceNow Molecules

### **✅ Do This**
- **Combine 2-5 atoms for specific function** - Clear functional purpose
- **Handle simple interactions** - Form validation, selections, basic state
- **Use proper accessibility patterns** - ARIA attributes, keyboard navigation
- **Make components reusable** - Work across different ServiceNow contexts
- **Follow ServiceNow design patterns** - Consistent with platform conventions
- **Include comprehensive testing** - Unit tests and interaction testing
- **Provide clear TypeScript interfaces** - Well-defined props and callbacks

### **❌ Avoid This**
- **Complex business logic** - Keep focused on UI functionality
- **ServiceNow API calls** - Data fetching belongs in hooks/services
- **Too many configuration props** - Prefer composition over configuration
- **Internal state for external data** - Use props for data management
- **Platform-specific assumptions** - Ensure compatibility across contexts

---

## Next Steps

**Molecules completed! Continue building:**

### **Next Level Components:**
- [ServiceNow Organisms](servicenow-organisms.md) - Complex business components
- [Component Composition](compound-components.md) - Advanced composition patterns

### **Integration Patterns:**
- [Custom Hooks](custom-hooks.md) - Business logic for molecules
- [State Management](state-management.md) - Managing molecule state

### **Testing and Quality:**
- [Component Testing](component-testing.md) - Testing strategies for molecules
- [Performance Optimization](performance-optimization.md) - Optimizing molecule performance

---

*ServiceNow molecules provide the functional building blocks for complex interfaces. Focus on single-purpose functionality, proper accessibility, and seamless integration with ServiceNow patterns to create molecules that enhance user productivity.*