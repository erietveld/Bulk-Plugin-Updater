---
title: "Compound Components for Complex ServiceNow Interactions"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Advanced React composition patterns for complex ServiceNow UI interactions using context and parent-child configuration"
readTime: "7 minutes"
complexity: "advanced"
status: "ACTIVE"
criticality: "RECOMMENDED"
prerequisites: ["atomic-design-principles", "component-reusability", "core-principles"]
tags: ["compound-components", "react", "context", "composition", "servicenow", "complex-interactions"]
---

# Compound Components for Complex ServiceNow Interactions

**Purpose:** Advanced React composition patterns for complex ServiceNow UI interactions using context and parent-child configuration  
**Read time:** ~7 minutes  
**Prerequisites:** [Atomic Design Principles](atomic-design-principles.md), [Component Reusability](../component-reusability.md), [Core Principles](../core-principles.md)

---

## Compound Components in ServiceNow Component Architecture

### **Role in Atomic Design Hierarchy**

Compound components represent the **advanced composition layer** in our ServiceNow atomic design system:

```
ServiceNow Component Architecture Integration
├── Templates 🏗️ → Complete page layouts (Dashboard, Form Pages)
├── Organisms 🧬 → Complex business components (DataTable, FormWizard)
├── Compound Components 🔗 ← This Document
│   ├── Modal Systems → Complex dialog interactions
│   ├── Tab Interfaces → Multi-section content organization  
│   ├── Accordion Panels → Collapsible content management
│   └── Data Tables → Advanced grid interactions
├── Molecules ⚛️ → Functional combinations (FormField, SearchBox)
└── Atoms ⚗️ → Basic UI elements (Button, Input, Badge)
```

**Compound components bridge the gap between organisms and templates** by providing flexible, context-aware composition patterns for complex ServiceNow business workflows.

### **When to Use Compound Components**

**✅ Perfect for:**
- **Complex ServiceNow forms** with multiple sections and dynamic behavior
- **Data presentation** requiring flexible layouts (tables, lists, cards)
- **Multi-step workflows** common in ServiceNow processes
- **Dialog systems** for ServiceNow record interactions
- **Dashboard widgets** with configurable content areas

**❌ Avoid for:**
- **Simple, single-purpose components** → Use atoms or molecules instead
- **Static layouts** → Use templates or organisms
- **Heavy business logic** → Logic belongs in ServiceNow builders (see [Core Principles](../core-principles.md))

### **Integration with ServiceNow Backend-First Philosophy**

Compound components handle **presentation and user interaction**, while ServiceNow builders handle the business logic:

```tsx
// ✅ GOOD: Compound component handles UI composition
function ServiceNowRecordModal({ record, isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>Edit {record.table_label}</Modal.Header>
      <Modal.Body>
        <ServiceNowForm 
          record={record}
          onSubmit={handleSubmit} // Triggers ServiceNow Flow Designer
        />
      </Modal.Body>
      <Modal.Footer>
        <Button type="submit">Save</Button>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
      </Modal.Footer>
    </Modal>
  );
  // ServiceNow Flow Designer handles:
  // - Field validation and business rules
  // - Assignment rule processing 
  // - SLA calculations and notifications
  // - Approval workflow initiation
}
```

---

## Core Compound Component Pattern

### **Basic Architecture with TypeScript**

```tsx
import { createContext, useContext, useMemo, useState } from 'react';

// 1. Define context with proper TypeScript types
interface ComponentContextValue {
  state: ComponentState;
  actions: ComponentActions;
}

const ComponentContext = createContext<ComponentContextValue | null>(null);

// 2. Custom hook for context access with validation
function useComponentContext() {
  const context = useContext(ComponentContext);
  if (!context) {
    throw new Error('Component children must be used within Component parent');
  }
  return context;
}

// 3. Parent component with context provider
interface ComponentProps {
  children: React.ReactNode;
  onStateChange?: (state: ComponentState) => void;
  className?: string;
  'data-testid'?: string;
}

function Component({ children, onStateChange, className = '', ...props }: ComponentProps) {
  const [state, setState] = useState<ComponentState>(initialState);
  
  // Memoize context value for performance
  const contextValue = useMemo(() => ({
    state,
    actions: {
      updateState: (newState: Partial<ComponentState>) => {
        setState(prev => ({ ...prev, ...newState }));
        onStateChange?.(newState);
      }
    }
  }), [state, onStateChange]);

  return (
    <ComponentContext.Provider value={contextValue}>
      <div className={`component ${className}`} {...props}>
        {children}
      </div>
    </ComponentContext.Provider>
  );
}

// 4. Child components as static properties
Component.Child = function ComponentChild({ children, ...props }: ComponentChildProps) {
  const { state, actions } = useComponentContext();
  
  return (
    <div className="component__child" {...props}>
      {children}
    </div>
  );
};

export default Component;
```

---

## ServiceNow Modal Compound Component

### **Complete Modal System for ServiceNow Records**

```tsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ServiceNowError } from '@/errors/ServiceNowError';

interface ModalContextValue {
  isOpen: boolean;
  onClose: () => void;
  size: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnBackdrop: boolean;
  closeOnEscape: boolean;
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal components must be used within Modal');
  }
  return context;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  children: React.ReactNode;
  'data-testid'?: string;
}

function Modal({ 
  isOpen, 
  onClose, 
  size = 'medium', 
  closeOnBackdrop = true,
  closeOnEscape = true,
  className = '',
  children,
  ...props
}: ModalProps) {
  const contextValue = useMemo(() => ({
    isOpen,
    onClose,
    size,
    closeOnBackdrop,
    closeOnEscape
  }), [isOpen, onClose, size, closeOnBackdrop, closeOnEscape]);

  // Handle keyboard interactions
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnEscape]);

  // Manage body scroll lock
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  return createPortal(
    <ModalContext.Provider value={contextValue}>
      <div 
        className="modal-overlay" 
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        data-testid="modal-overlay"
      >
        <div 
          className={`modal modal--${size} ${className}`}
          role="document"
          {...props}
        >
          {children}
        </div>
      </div>
    </ModalContext.Provider>,
    document.body
  );
}

// Modal Header with ServiceNow integration
interface ModalHeaderProps {
  children: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

Modal.Header = function ModalHeader({ 
  children, 
  showCloseButton = true,
  className = '',
  icon,
  subtitle
}: ModalHeaderProps) {
  const { onClose } = useModalContext();

  return (
    <header className={`modal__header ${className}`}>
      <div className="modal__header-content">
        {icon && <div className="modal__header-icon">{icon}</div>}
        <div className="modal__header-text">
          <h2 className="modal__title">{children}</h2>
          {subtitle && <p className="modal__subtitle">{subtitle}</p>}
        </div>
      </div>
      {showCloseButton && (
        <button 
          className="modal__close-button"
          onClick={onClose}
          aria-label="Close modal"
          type="button"
          data-testid="modal-close-button"
        >
          <CloseIcon size={24} />
        </button>
      )}
    </header>
  );
};

// Modal Body with scroll management
interface ModalBodyProps {
  children: React.ReactNode;
  padding?: boolean;
  scrollable?: boolean;
  className?: string;
}

Modal.Body = function ModalBody({ 
  children, 
  padding = true,
  scrollable = true,
  className = ''
}: ModalBodyProps) {
  const bodyClasses = [
    'modal__body',
    padding && 'modal__body--padded',
    scrollable && 'modal__body--scrollable',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={bodyClasses}>
      {children}
    </div>
  );
};

// Modal Footer with action alignment
interface ModalFooterProps {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'space-between';
  className?: string;
}

Modal.Footer = function ModalFooter({ 
  children, 
  align = 'right',
  className = ''
}: ModalFooterProps) {
  return (
    <footer className={`modal__footer modal__footer--${align} ${className}`}>
      {children}
    </footer>
  );
};

// ServiceNow-specific usage example
interface ServiceNowRecordModalProps {
  record: ServiceNowRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (recordId: string, updates: Partial<ServiceNowRecord>) => Promise<void>;
  mode: 'view' | 'edit';
}

function ServiceNowRecordModal({ 
  record, 
  isOpen, 
  onClose, 
  onSave, 
  mode 
}: ServiceNowRecordModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ServiceNowError | null>(null);

  const handleSave = async (formData: Partial<ServiceNowRecord>) => {
    setSaving(true);
    setError(null);
    
    try {
      await onSave(record.sys_id, formData);
      onClose();
      // ServiceNow Flow Designer handles:
      // - Field validation and business rules
      // - Assignment rule processing
      // - SLA calculations and notifications  
      // - Audit logging and change tracking
    } catch (err) {
      setError(err instanceof ServiceNowError ? err : new ServiceNowError('Save failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large" data-testid="servicenow-record-modal">
      <Modal.Header 
        icon={<RecordTypeIcon type={record.sys_class_name} />}
        subtitle={record.number?.display_value}
      >
        {mode === 'edit' ? 'Edit' : 'View'} {record.sys_class_name?.display_value}
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <ErrorAlert 
            error={error} 
            onDismiss={() => setError(null)}
            className="modal__error"
          />
        )}
        
        <ServiceNowRecordForm
          record={record}
          mode={mode}
          onSubmit={handleSave}
          loading={saving}
        />
      </Modal.Body>
      
      {mode === 'edit' && (
        <Modal.Footer>
          <Button 
            type="submit"
            form="servicenow-record-form"
            loading={saving}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button 
            variant="secondary" 
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
}
```

---

## ServiceNow Data Table Compound Component

### **Advanced Table with ServiceNow Field Support**

```tsx
import { createContext, useContext, useCallback, useMemo, useState } from 'react';
import { ServiceNowField, ServiceNowRecord } from '@/types/ServiceNow';

interface DataTableContextValue<T extends ServiceNowRecord> {
  data: T[];
  loading: boolean;
  selectedRows: Set<string>;
  sortConfig: { key: keyof T; direction: 'asc' | 'desc' } | null;
  toggleRow: (id: string) => void;
  toggleAll: () => void;
  setSortConfig: (config: { key: keyof T; direction: 'asc' | 'desc' } | null) => void;
  formatField: (field: ServiceNowField) => string;
}

const DataTableContext = createContext<DataTableContextValue<any> | null>(null);

function useDataTableContext<T extends ServiceNowRecord>() {
  const context = useContext(DataTableContext);
  if (!context) {
    throw new Error('DataTable components must be used within DataTable');
  }
  return context as DataTableContextValue<T>;
}

interface DataTableProps<T extends ServiceNowRecord> {
  data: T[];
  loading?: boolean;
  keyField: keyof T;
  selectable?: boolean;
  sortable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
  className?: string;
  children: React.ReactNode;
  'data-testid'?: string;
}

function DataTable<T extends ServiceNowRecord>({ 
  data, 
  loading = false,
  keyField,
  selectable = false,
  sortable = false,
  onSelectionChange,
  onSort,
  className = '',
  children,
  ...props
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);

  const toggleRow = useCallback((id: string) => {
    if (!selectable) return;
    
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      onSelectionChange?.(Array.from(newSet));
      return newSet;
    });
  }, [selectable, onSelectionChange]);

  const toggleAll = useCallback(() => {
    if (!selectable) return;
    
    const allIds = data.map(item => String(item[keyField]));
    setSelectedRows(prev => {
      const newSet = prev.size === allIds.length ? new Set() : new Set(allIds);
      onSelectionChange?.(Array.from(newSet));
      return newSet;
    });
  }, [data, keyField, selectable, onSelectionChange]);

  const handleSort = useCallback((key: keyof T, direction: 'asc' | 'desc') => {
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  }, [onSort]);

  // ServiceNow field formatting utility
  const formatField = useCallback((field: ServiceNowField) => {
    if (!field) return '';
    return field.display_value || field.value || '';
  }, []);

  const contextValue = useMemo(() => ({
    data,
    loading,
    selectedRows,
    sortConfig,
    toggleRow,
    toggleAll,
    setSortConfig: handleSort,
    formatField
  }), [data, loading, selectedRows, sortConfig, toggleRow, toggleAll, handleSort, formatField]);

  return (
    <DataTableContext.Provider value={contextValue}>
      <div className={`data-table ${className}`} {...props}>
        {children}
      </div>
    </DataTableContext.Provider>
  );
}

// Table Header with selection support
interface DataTableHeaderProps {
  children: React.ReactNode;
  selectable?: boolean;
}

DataTable.Header = function DataTableHeader({ children, selectable }: DataTableHeaderProps) {
  const { toggleAll, selectedRows, data } = useDataTableContext();
  
  const isAllSelected = selectedRows.size > 0 && selectedRows.size === data.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < data.length;

  return (
    <thead className="data-table__header">
      <tr className="data-table__header-row">
        {selectable && (
          <th className="data-table__select-column">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={input => {
                if (input) input.indeterminate = isIndeterminate;
              }}
              onChange={toggleAll}
              aria-label="Select all rows"
            />
          </th>
        )}
        {children}
      </tr>
    </thead>
  );
};

// Sortable column header
interface DataTableColumnHeaderProps<T> {
  sortKey?: keyof T;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

DataTable.ColumnHeader = function DataTableColumnHeader<T extends ServiceNowRecord>({ 
  sortKey, 
  children,
  className = '',
  align = 'left'
}: DataTableColumnHeaderProps<T>) {
  const { sortConfig, setSortConfig } = useDataTableContext<T>();
  
  const isSorted = sortConfig?.key === sortKey;
  const sortDirection = isSorted ? sortConfig.direction : null;

  const handleSort = () => {
    if (!sortKey) return;
    
    const newDirection = 
      !isSorted ? 'asc' 
      : sortDirection === 'asc' ? 'desc' 
      : 'asc'; // Changed to always have a sort direction
    
    setSortConfig(sortKey, newDirection);
  };

  const headerClasses = [
    'data-table__column-header',
    `data-table__column-header--${align}`,
    sortKey && 'data-table__column-header--sortable',
    isSorted && `data-table__column-header--sorted-${sortDirection}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <th 
      className={headerClasses}
      onClick={sortKey ? handleSort : undefined}
      role={sortKey ? 'button' : undefined}
      tabIndex={sortKey ? 0 : undefined}
      aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <div className="data-table__column-header-content">
        <span>{children}</span>
        {sortKey && (
          <span className="data-table__sort-indicator">
            {!isSorted && <SortIcon />}
            {isSorted && sortDirection === 'asc' && <SortAscIcon />}
            {isSorted && sortDirection === 'desc' && <SortDescIcon />}
          </span>
        )}
      </div>
    </th>
  );
};

// Table body with loading and empty states
DataTable.Body = function DataTableBody({ children }: { children: React.ReactNode }) {
  const { loading, data } = useDataTableContext();

  if (loading) {
    return (
      <tbody className="data-table__body">
        <tr>
          <td colSpan={100} className="data-table__loading">
            <div className="data-table__loading-content">
              <LoadingSpinner size="medium" />
              <span>Loading ServiceNow data...</span>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (data.length === 0) {
    return (
      <tbody className="data-table__body">
        <tr>
          <td colSpan={100} className="data-table__empty">
            <div className="data-table__empty-content">
              <EmptyStateIcon />
              <span>No records found</span>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="data-table__body">
      {children}
    </tbody>
  );
};

// Table row with selection support
interface DataTableRowProps<T extends ServiceNowRecord> {
  record: T;
  children: React.ReactNode;
  className?: string;
  selectable?: boolean;
  onClick?: (record: T) => void;
}

DataTable.Row = function DataTableRow<T extends ServiceNowRecord>({ 
  record, 
  children,
  className = '',
  selectable,
  onClick
}: DataTableRowProps<T>) {
  const { selectedRows, toggleRow } = useDataTableContext<T>();
  
  const recordId = String(record.sys_id);
  const isSelected = selectedRows.has(recordId);

  const handleRowClick = () => {
    onClick?.(record);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    toggleRow(recordId);
  };

  const rowClasses = [
    'data-table__row',
    isSelected && 'data-table__row--selected',
    onClick && 'data-table__row--clickable',
    className
  ].filter(Boolean).join(' ');

  return (
    <tr 
      className={rowClasses}
      onClick={onClick ? handleRowClick : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {selectable && (
        <td className="data-table__select-cell" onClick={e => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectChange}
            aria-label={`Select ${record.number?.display_value || record.sys_id}`}
          />
        </td>
      )}
      {children}
    </tr>
  );
};

// ServiceNow-specific field cell
interface DataTableFieldCellProps {
  field: ServiceNowField;
  type?: 'text' | 'date' | 'reference' | 'choice' | 'boolean';
  className?: string;
}

DataTable.FieldCell = function DataTableFieldCell({ 
  field, 
  type = 'text',
  className = ''
}: DataTableFieldCellProps) {
  const { formatField } = useDataTableContext();

  const renderFieldContent = () => {
    if (!field || (!field.display_value && !field.value)) {
      return <span className="data-table__empty-field">—</span>;
    }

    switch (type) {
      case 'date':
        return <DateTimeField value={field} format="relative" />;
      case 'reference':
        return field.link ? (
          <a href={field.link} className="data-table__reference-link">
            {formatField(field)}
          </a>
        ) : (
          formatField(field)
        );
      case 'choice':
        return <ChoiceBadge field={field} />;
      case 'boolean':
        return <BooleanIndicator value={field.value === 'true'} />;
      default:
        return formatField(field);
    }
  };

  return (
    <td className={`data-table__field-cell data-table__field-cell--${type} ${className}`}>
      {renderFieldContent()}
    </td>
  );
};

// Usage example for ServiceNow incidents
function ServiceNowIncidentsTable({ 
  incidents, 
  loading, 
  onRecordClick,
  onSelectionChange 
}: {
  incidents: ServiceNowIncident[];
  loading: boolean;
  onRecordClick: (incident: ServiceNowIncident) => void;
  onSelectionChange: (selectedIds: string[]) => void;
}) {
  return (
    <DataTable
      data={incidents}
      loading={loading}
      keyField="sys_id"
      selectable
      sortable
      onSelectionChange={onSelectionChange}
      data-testid="incidents-table"
    >
      <table className="data-table__table">
        <DataTable.Header selectable>
          <DataTable.ColumnHeader sortKey="number">Number</DataTable.ColumnHeader>
          <DataTable.ColumnHeader sortKey="short_description">Description</DataTable.ColumnHeader>
          <DataTable.ColumnHeader sortKey="priority">Priority</DataTable.ColumnHeader>
          <DataTable.ColumnHeader sortKey="state">State</DataTable.ColumnHeader>
          <DataTable.ColumnHeader sortKey="assigned_to">Assigned To</DataTable.ColumnHeader>
          <DataTable.ColumnHeader sortKey="sys_created_on">Created</DataTable.ColumnHeader>
        </DataTable.Header>
        
        <DataTable.Body>
          {incidents.map(incident => (
            <DataTable.Row 
              key={incident.sys_id} 
              record={incident}
              selectable
              onClick={onRecordClick}
            >
              <DataTable.FieldCell field={incident.number} />
              <DataTable.FieldCell field={incident.short_description} />
              <DataTable.FieldCell field={incident.priority} type="choice" />
              <DataTable.FieldCell field={incident.state} type="choice" />
              <DataTable.FieldCell field={incident.assigned_to} type="reference" />
              <DataTable.FieldCell field={incident.sys_created_on} type="date" />
            </DataTable.Row>
          ))}
        </DataTable.Body>
      </table>
    </DataTable>
  );
}
```

---

## Tab Interface Compound Component

### **ServiceNow Multi-Section Content Organization**

```tsx
import { createContext, useContext, useCallback, useMemo, useState } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  orientation: 'horizontal' | 'vertical';
  tabs: Map<string, { label: string; disabled?: boolean }>;
  registerTab: (id: string, label: string, disabled?: boolean) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within Tabs');
  }
  return context;
}

interface TabsProps {
  defaultActiveTab: string;
  orientation?: 'horizontal' | 'vertical';
  onTabChange?: (tabId: string) => void;
  className?: string;
  children: React.ReactNode;
  'data-testid'?: string;
}

function Tabs({ 
  defaultActiveTab, 
  orientation = 'horizontal',
  onTabChange,
  className = '',
  children,
  ...props
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);
  const [tabs, setTabs] = useState<Map<string, { label: string; disabled?: boolean }>>(new Map());

  const handleTabChange = useCallback((tabId: string) => {
    const tab = tabs.get(tabId);
    if (tab?.disabled) return;
    
    setActiveTab(tabId);
    onTabChange?.(tabId);
  }, [tabs, onTabChange]);

  const registerTab = useCallback((id: string, label: string, disabled = false) => {
    setTabs(prev => new Map(prev).set(id, { label, disabled }));
  }, []);

  const contextValue = useMemo(() => ({
    activeTab,
    setActiveTab: handleTabChange,
    orientation,
    tabs,
    registerTab
  }), [activeTab, handleTabChange, orientation, tabs, registerTab]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div 
        className={`tabs tabs--${orientation} ${className}`}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// Tab list container
Tabs.List = function TabsList({ 
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { orientation } = useTabsContext();

  return (
    <div 
      className={`tabs__list tabs__list--${orientation} ${className}`}
      role="tablist"
      aria-orientation={orientation}
    >
      {children}
    </div>
  );
};

// Individual tab button
interface TabProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

Tabs.Tab = function Tab({ 
  id, 
  children, 
  disabled = false,
  className = '',
  icon,
  badge
}: TabProps) {
  const { activeTab, setActiveTab, registerTab } = useTabsContext();

  // Register tab on mount
  React.useEffect(() => {
    registerTab(id, String(children), disabled);
  }, [id, children, disabled, registerTab]);

  const isActive = activeTab === id;

  const handleClick = () => {
    if (!disabled) {
      setActiveTab(id);
    }
  };

  const tabClasses = [
    'tabs__tab',
    isActive && 'tabs__tab--active',
    disabled && 'tabs__tab--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={tabClasses}
      onClick={handleClick}
      disabled={disabled}
      role="tab"
      aria-selected={isActive}
      aria-controls={`panel-${id}`}
      id={`tab-${id}`}
      tabIndex={isActive ? 0 : -1}
      type="button"
    >
      <span className="tabs__tab-content">
        {icon && <span className="tabs__tab-icon">{icon}</span>}
        <span className="tabs__tab-label">{children}</span>
        {badge && <span className="tabs__tab-badge">{badge}</span>}
      </span>
    </button>
  );
};

// Tab panel content
interface TabPanelProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  lazy?: boolean;
}

Tabs.Panel = function TabPanel({ 
  id, 
  children,
  className = '',
  lazy = false
}: TabPanelProps) {
  const { activeTab } = useTabsContext();
  const [hasBeenActive, setHasBeenActive] = useState(!lazy);

  const isActive = activeTab === id;

  React.useEffect(() => {
    if (isActive && !hasBeenActive) {
      setHasBeenActive(true);
    }
  }, [isActive, hasBeenActive]);

  if (lazy && !hasBeenActive) {
    return null;
  }

  return (
    <div
      className={`tabs__panel ${isActive ? 'tabs__panel--active' : ''} ${className}`}
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      hidden={!isActive}
    >
      {children}
    </div>
  );
};

// ServiceNow record details tab example
function ServiceNowRecordDetailTabs({ 
  record, 
  onTabChange 
}: { 
  record: ServiceNowRecord;
  onTabChange?: (tabId: string) => void;
}) {
  const [commentCount, setCommentCount] = useState(0);
  const [attachmentCount, setAttachmentCount] = useState(0);

  return (
    <Tabs 
      defaultActiveTab="details" 
      onTabChange={onTabChange}
      data-testid="record-detail-tabs"
    >
      <Tabs.List>
        <Tabs.Tab 
          id="details" 
          icon={<DetailsIcon />}
        >
          Details
        </Tabs.Tab>
        
        <Tabs.Tab 
          id="history" 
          icon={<HistoryIcon />}
        >
          History
        </Tabs.Tab>
        
        <Tabs.Tab 
          id="attachments" 
          icon={<AttachmentIcon />}
          badge={attachmentCount || undefined}
        >
          Attachments
        </Tabs.Tab>
        
        <Tabs.Tab 
          id="related" 
          icon={<RelatedIcon />}
        >
          Related Records
        </Tabs.Tab>
        
        <Tabs.Tab 
          id="comments" 
          icon={<CommentIcon />}
          badge={commentCount || undefined}
        >
          Comments
        </Tabs.Tab>
      </Tabs.List>
      
      <Tabs.Panel id="details">
        <ServiceNowRecordDetailsForm record={record} />
      </Tabs.Panel>
      
      <Tabs.Panel id="history" lazy>
        <ServiceNowRecordHistory recordId={record.sys_id} />
      </Tabs.Panel>
      
      <Tabs.Panel id="attachments" lazy>
        <ServiceNowAttachmentsList 
          tableName={record.sys_class_name}
          recordId={record.sys_id}
          onCountChange={setAttachmentCount}
        />
      </Tabs.Panel>
      
      <Tabs.Panel id="related" lazy>
        <ServiceNowRelatedRecordsList record={record} />
      </Tabs.Panel>
      
      <Tabs.Panel id="comments" lazy>
        <ServiceNowCommentsList 
          tableName={record.sys_class_name}
          recordId={record.sys_id}
          onCountChange={setCommentCount}
        />
      </Tabs.Panel>
    </Tabs>
  );
}
```

---

## Testing Compound Components

### **Comprehensive Testing Strategy**

```tsx
// Modal.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal Compound Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with all compound components', () => {
    render(
      <Modal {...defaultProps}>
        <Modal.Header>Test Title</Modal.Header>
        <Modal.Body>Test Content</Modal.Body>
        <Modal.Footer>Test Footer</Modal.Footer>
      </Modal>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Test Footer')).toBeInTheDocument();
  });

  it('handles keyboard interactions correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <Modal {...defaultProps}>
        <Modal.Header>Test</Modal.Header>
        <Modal.Body>Content</Modal.Body>
      </Modal>
    );

    await user.keyboard('{Escape}');
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('prevents context usage outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<Modal.Header>Invalid Usage</Modal.Header>);
    }).toThrow('Modal components must be used within Modal');
    
    consoleSpy.mockRestore();
  });

  it('manages focus correctly', async () => {
    render(
      <Modal {...defaultProps}>
        <Modal.Header>Test</Modal.Header>
        <Modal.Body>
          <button>First Button</button>
          <button>Second Button</button>
        </Modal.Body>
      </Modal>
    );

    const modal = screen.getByRole('dialog');
    expect(modal).toHaveFocus();
  });
});

// DataTable.test.tsx  
describe('DataTable Compound Component', () => {
  const mockData = [
    { sys_id: '1', number: { display_value: 'INC001' }, priority: { display_value: 'High' } },
    { sys_id: '2', number: { display_value: 'INC002' }, priority: { display_value: 'Medium' } }
  ];

  it('handles ServiceNow field formatting correctly', () => {
    render(
      <DataTable data={mockData} keyField="sys_id">
        <table>
          <DataTable.Header>
            <DataTable.ColumnHeader>Number</DataTable.ColumnHeader>
          </DataTable.Header>
          <DataTable.Body>
            {mockData.map(record => (
              <DataTable.Row key={record.sys_id} record={record}>
                <DataTable.FieldCell field={record.number} />
              </DataTable.Row>
            ))}
          </DataTable.Body>
        </table>
      </DataTable>
    );

    expect(screen.getByText('INC001')).toBeInTheDocument();
    expect(screen.getByText('INC002')).toBeInTheDocument();
  });

  it('handles selection correctly', async () => {
    const onSelectionChange = jest.fn();
    const user = userEvent.setup();
    
    render(
      <DataTable 
        data={mockData} 
        keyField="sys_id" 
        selectable
        onSelectionChange={onSelectionChange}
      >
        <table>
          <DataTable.Header selectable>
            <DataTable.ColumnHeader>Number</DataTable.ColumnHeader>
          </DataTable.Header>
          <DataTable.Body>
            {mockData.map(record => (
              <DataTable.Row key={record.sys_id} record={record} selectable>
                <DataTable.FieldCell field={record.number} />
              </DataTable.Row>
            ))}
          </DataTable.Body>
        </table>
      </DataTable>
    );

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // Select first row
    
    expect(onSelectionChange).toHaveBeenCalledWith(['1']);
  });
});
```

---

## Best Practices for ServiceNow Compound Components

### **✅ Do This**
- **Always validate context usage** - Throw clear errors when components are used outside their provider
- **Memoize context values** - Use `useMemo` to prevent unnecessary re-renders
- **Support keyboard navigation** - Implement proper ARIA attributes and keyboard handlers
- **Handle ServiceNow field structures** - Support `display_value` and `value` properties correctly
- **Provide flexible APIs** - Allow customization while maintaining simplicity
- **Include comprehensive TypeScript types** - Full type safety for all props and context values
- **Test context boundaries** - Ensure child components can't be used outside parent
- **Support accessibility requirements** - WCAG 2.1 AA compliance for all interactions

### **❌ Avoid This**
- **Complex business logic in components** - Use ServiceNow builders for business logic
- **Direct DOM manipulation** - Use React patterns and refs appropriately
- **Missing error boundaries** - Provide graceful fallbacks for component failures
- **Heavy context values** - Keep context lean to prevent performance issues
- **Overly complex APIs** - Prefer composition over configuration
- **Missing keyboard support** - All interactive elements must be keyboard accessible
- **Poor ServiceNow integration** - Handle ServiceNow field structures consistently

---

## Integration with Component Architecture

### **Atomic Design Integration:**
- **[Atomic Design Principles](atomic-design-principles.md)** ⭐ - Foundation concepts for component hierarchy
- **[ServiceNow Atoms](servicenow-atoms.md)** - Basic elements used in compound components
- **[ServiceNow Molecules](servicenow-molecules.md)** - Functional combinations that compose into compounds
- **[ServiceNow Organisms](servicenow-organisms.md)** - Complete business components that may use compound patterns

### **Development Philosophy:**
- **[Core Principles](../core-principles.md)** ⭐ - Backend-first philosophy that guides compound component design
- **[Component Reusability](../component-reusability.md)** - How compound components enhance reusability
- **[State Management](state-management.md)** - Integration with global state patterns

### **Testing and Quality:**
- **[Component Testing](component-testing.md)** - Testing strategies for compound components
- **[Testing Strategy](testing-strategy.md)** - How compound components fit in comprehensive testing
- **[Performance Optimization](performance-optimization.md)** - Performance considerations for complex components

---

## Implementation Priority

### **Phase 1: Foundation (Week 1-2)**
1. **Modal system** - Essential for ServiceNow record interactions
2. **Basic compound patterns** - Context creation and validation utilities
3. **TypeScript interfaces** - Type safety for all compound components
4. **Testing setup** - Testing utilities for compound component patterns

### **Phase 2: Core Components (Week 3-4)**
1. **Data table compound** - Advanced ServiceNow record display
2. **Tab interface system** - Multi-section content organization
3. **Form wizard compound** - Multi-step ServiceNow processes
4. **Comprehensive testing** - Full test coverage for all patterns

### **Phase 3: Advanced Patterns (Week 5-6)**
1. **Accordion system** - Collapsible content management
2. **Multi-select components** - Complex selection interfaces
3. **Dashboard widgets** - Configurable content areas
4. **Performance optimization** - Memoization and render optimization

### **Phase 4: Integration (Week 7-8)**
1. **ServiceNow integration** - Complete backend workflow integration
2. **Documentation and examples** - Comprehensive usage guides
3. **Team training** - Best practices and implementation patterns
4. **Quality gates** - Automated testing and validation

---

*Compound components provide powerful composition patterns for complex ServiceNow interactions while maintaining the flexibility and reusability principles of atomic design. They bridge the gap between simple molecules and complete organisms, enabling sophisticated user interfaces that integrate seamlessly with ServiceNow's backend-first development philosophy.*