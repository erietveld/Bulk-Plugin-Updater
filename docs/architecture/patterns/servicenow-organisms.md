---
title: "ServiceNow Organisms: Complex Business Components"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Implementation guide for organism-level ServiceNow components that handle complex business functionality"
readTime: "8 minutes"
complexity: "advanced"
status: "ACTIVE"
criticality: "RECOMMENDED"
prerequisites: ["servicenow-molecules", "state-management", "custom-hooks"]
tags: ["organisms", "business-logic", "servicenow", "forms", "data"]
---

# ServiceNow Organisms: Complex Business Components

**Purpose:** Implementation guide for organism-level ServiceNow components that handle complex business functionality  
**Read time:** ~8 minutes  
**Prerequisites:** [ServiceNow Molecules](servicenow-molecules.md), [State Management](state-management.md), [Custom Hooks](custom-hooks.md)

---

## ServiceNow Organism Characteristics

Organisms are complex components that combine multiple molecules and atoms to handle complete business functionality. They should:

- **Handle complete business workflows** - End-to-end user experiences
- **Integrate with ServiceNow backend** - API calls, data management, business rules
- **Use custom hooks for logic** - Separate business logic from presentation
- **Manage complex state** - Form state, validation, loading, errors
- **Be domain-specific** - Built for specific ServiceNow use cases

---

## Form Organisms

### **ServiceNow Form Organism**

Complete form handling for ServiceNow records with validation, submission, and error handling.

```tsx
// organisms/ServiceNowForm/ServiceNowForm.tsx
import { ServiceNowFormProps } from './ServiceNowForm.types';
import { FormField, StatusIndicator, ActionButtonGroup } from '@/components/molecules';
import { Input, Button, Icon } from '@/components/atoms';
import { ErrorBoundary } from '@/components/common';
import { useServiceNowForm } from './hooks/useServiceNowForm';
import styles from './ServiceNowForm.module.css';

export function ServiceNowForm({
  table,
  recordId,
  fields,
  onSubmit,
  onCancel,
  readOnly = false,
  layout = 'vertical',
  showProgress = true,
  autoSave = false,
  'data-testid': testId,
  ...props
}: ServiceNowFormProps) {
  const {
    record,
    formState,
    validation,
    loading,
    error,
    isDirty,
    progress,
    updateField,
    handleSubmit,
    handleReset,
    handleAutoSave
  } = useServiceNowForm(table, recordId, {
    fields,
    autoSave,
    onSubmit,
  });

  if (loading.initial) {
    return (
      <div className={styles.loading} data-testid={`${testId}-loading`}>
        <Icon name="loading" size="lg" />
        <span>Loading form...</span>
      </div>
    );
  }

  if (error.form) {
    return (
      <ErrorBoundary
        error={error.form}
        onRetry={() => window.location.reload()}
        className={styles.error}
      />
    );
  }

  const formActions = [
    {
      id: 'submit',
      label: recordId ? 'Update' : 'Create',
      variant: 'primary' as const,
      onClick: () => handleSubmit(),
      disabled: !isDirty || validation.isValidating || readOnly,
      loading: loading.submit,
    },
    ...(onCancel ? [{
      id: 'cancel',
      label: 'Cancel',
      variant: 'secondary' as const,
      onClick: onCancel,
      disabled: loading.submit,
    }] : []),
    ...(isDirty ? [{
      id: 'reset',
      label: 'Reset',
      variant: 'ghost' as const,
      onClick: handleReset,
      disabled: loading.submit || readOnly,
    }] : []),
  ];

  return (
    <ErrorBoundary>
      <form 
        className={`${styles.serviceNowForm} ${styles[`form--${layout}`]}`}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        data-testid={testId}
        {...props}
      >
        {showProgress && progress && (
          <div className={styles.progress}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <span className={styles.progressText}>
              {progress.completed} of {progress.total} fields completed
            </span>
          </div>
        )}

        <div className={styles.fieldGroups}>
          {fields.map((fieldConfig) => {
            const fieldValue = formState[fieldConfig.name];
            const fieldError = validation.errors[fieldConfig.name];
            const isFieldLoading = loading.fields[fieldConfig.name];

            return (
              <FormField
                key={fieldConfig.name}
                label={fieldConfig.label}
                required={fieldConfig.required}
                disabled={readOnly || fieldConfig.disabled || isFieldLoading}
                error={fieldError}
                helpText={fieldConfig.helpText}
                hint={fieldConfig.hint}
                layout={layout}
              >
                {renderFormInput(fieldConfig, {
                  value: fieldValue,
                  onChange: (value) => updateField(fieldConfig.name, value),
                  onBlur: autoSave ? () => handleAutoSave(fieldConfig.name) : undefined,
                  disabled: readOnly || fieldConfig.disabled || isFieldLoading,
                  loading: isFieldLoading,
                })}
              </FormField>
            );
          })}
        </div>

        {!readOnly && (
          <div className={styles.formActions}>
            <ActionButtonGroup
              actions={formActions}
              layout="horizontal"
              alignment="end"
            />
            
            {autoSave && isDirty && (
              <div className={styles.autoSaveStatus}>
                <StatusIndicator
                  status={loading.autoSave ? 'saving' : 'saved'}
                  table="auto_save"
                  size="sm"
                />
              </div>
            )}
          </div>
        )}
      </form>
    </ErrorBoundary>
  );
}
```

```tsx
// organisms/ServiceNowForm/hooks/useServiceNowForm.ts
import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/stores/uiStore';
import { serviceNowFormService } from '@/services/ServiceNowFormService';

export function useServiceNowForm(
  table: string,
  recordId?: string,
  options: ServiceNowFormOptions = {}
) {
  const { fields, autoSave = false, onSubmit } = options;
  
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [validation, setValidation] = useState<FormValidation>({
    errors: {},
    isValidating: false,
  });
  const [loading, setLoading] = useState<FormLoading>({
    initial: false,
    submit: false,
    autoSave: false,
    fields: {},
  });
  const [error, setError] = useState<FormError>({
    form: null,
    fields: {},
  });

  const queryClient = useQueryClient();
  const { showNotification } = useUIStore();

  // Load existing record if recordId provided
  const { data: record } = useQuery({
    queryKey: ['servicenow', 'record', table, recordId],
    queryFn: () => serviceNowFormService.getRecord(table, recordId!),
    enabled: !!recordId,
  });

  // Initialize form state when record loads
  useEffect(() => {
    if (record) {
      const initialState = fields.reduce((state, field) => {
        const fieldData = record[field.name];
        state[field.name] = fieldData?.display_value || fieldData?.value || field.defaultValue || '';
        return state;
      }, {} as Record<string, any>);
      
      setFormState(initialState);
    } else if (!recordId) {
      // Initialize empty form for new records
      const initialState = fields.reduce((state, field) => {
        state[field.name] = field.defaultValue || '';
        return state;
      }, {} as Record<string, any>);
      
      setFormState(initialState);
    }
  }, [record, fields, recordId]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      if (recordId) {
        return serviceNowFormService.updateRecord(table, recordId, data);
      } else {
        return serviceNowFormService.createRecord(table, data);
      }
    },
    onMutate: () => {
      setLoading(prev => ({ ...prev, submit: true }));
      setError(prev => ({ ...prev, form: null }));
    },
    onSuccess: (updatedRecord) => {
      // Update cache
      queryClient.setQueryData(
        ['servicenow', 'record', table, updatedRecord.sys_id],
        updatedRecord
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['servicenow', 'table', table],
        exact: false,
      });

      showNotification({
        type: 'success',
        message: `${table} ${recordId ? 'updated' : 'created'} successfully`,
      });

      onSubmit?.(updatedRecord);
    },
    onError: (error: any) => {
      setError(prev => ({ ...prev, form: error.message }));
      showNotification({
        type: 'error',
        message: `Failed to ${recordId ? 'update' : 'create'} ${table}`,
      });
    },
    onSettled: () => {
      setLoading(prev => ({ ...prev, submit: false }));
    },
  });

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (data: { field: string; value: any }) => {
      if (!recordId) return; // Only auto-save existing records
      
      return serviceNowFormService.updateRecord(table, recordId, {
        [data.field]: data.value,
      });
    },
    onMutate: () => {
      setLoading(prev => ({ ...prev, autoSave: true }));
    },
    onSuccess: () => {
      // Update cache silently
      queryClient.invalidateQueries({
        queryKey: ['servicenow', 'record', table, recordId],
      });
    },
    onError: (error: any) => {
      showNotification({
        type: 'warning',
        message: 'Auto-save failed',
        duration: 3000,
      });
    },
    onSettled: () => {
      setLoading(prev => ({ ...prev, autoSave: false }));
    },
  });

  // Field validation
  const validateField = useCallback(async (fieldName: string, value: any) => {
    const fieldConfig = fields.find(f => f.name === fieldName);
    if (!fieldConfig || !fieldConfig.validation) return;

    setValidation(prev => ({ ...prev, isValidating: true }));

    try {
      await fieldConfig.validation(value, formState);
      setValidation(prev => ({
        ...prev,
        errors: { ...prev.errors, [fieldName]: undefined },
      }));
    } catch (error: any) {
      setValidation(prev => ({
        ...prev,
        errors: { ...prev.errors, [fieldName]: error.message },
      }));
    } finally {
      setValidation(prev => ({ ...prev, isValidating: false }));
    }
  }, [fields, formState]);

  // Update field value
  const updateField = useCallback((fieldName: string, value: any) => {
    setFormState(prev => ({ ...prev, [fieldName]: value }));
    
    // Validate field after update
    validateField(fieldName, value);
  }, [validateField]);

  // Auto-save field
  const handleAutoSave = useCallback((fieldName: string) => {
    if (!autoSave || !recordId) return;
    
    const value = formState[fieldName];
    autoSaveMutation.mutate({ field: fieldName, value });
  }, [autoSave, recordId, formState, autoSaveMutation]);

  // Submit form
  const handleSubmit = useCallback(() => {
    // Validate all fields first
    const hasErrors = Object.values(validation.errors).some(error => error);
    if (hasErrors) return;

    submitMutation.mutate(formState);
  }, [formState, validation.errors, submitMutation]);

  // Reset form
  const handleReset = useCallback(() => {
    if (record) {
      const resetState = fields.reduce((state, field) => {
        const fieldData = record[field.name];
        state[field.name] = fieldData?.display_value || fieldData?.value || field.defaultValue || '';
        return state;
      }, {} as Record<string, any>);
      
      setFormState(resetState);
    }
    
    setValidation({ errors: {}, isValidating: false });
    setError({ form: null, fields: {} });
  }, [record, fields]);

  // Calculate progress
  const progress = useMemo(() => {
    const requiredFields = fields.filter(f => f.required);
    const completed = requiredFields.filter(f => {
      const value = formState[f.name];
      return value && value.toString().trim() !== '';
    }).length;

    return {
      total: requiredFields.length,
      completed,
      percentage: requiredFields.length > 0 ? (completed / requiredFields.length) * 100 : 100,
    };
  }, [fields, formState]);

  // Check if form is dirty
  const isDirty = useMemo(() => {
    if (!record) return Object.values(formState).some(value => value && value.toString().trim() !== '');
    
    return fields.some(field => {
      const currentValue = formState[field.name];
      const originalValue = record[field.name]?.display_value || record[field.name]?.value || '';
      return currentValue !== originalValue;
    });
  }, [formState, record, fields]);

  return {
    record,
    formState,
    validation,
    loading,
    error,
    isDirty,
    progress,
    updateField,
    handleSubmit,
    handleReset,
    handleAutoSave,
  };
}
```

---

## List Organisms

### **ServiceNow Table List Organism**

Complete data table with filtering, sorting, pagination, and actions.

```tsx
// organisms/ServiceNowTableList/ServiceNowTableList.tsx
import { ServiceNowTableListProps } from './ServiceNowTableList.types';
import { SearchBox, RecordSummary, QuickActions, ActionButtonGroup } from '@/components/molecules';
import { Button, Icon, Badge } from '@/components/atoms';
import { ErrorBoundary, LoadingSpinner, EmptyState } from '@/components/common';
import { useServiceNowTableList } from './hooks/useServiceNowTableList';
import styles from './ServiceNowTableList.module.css';

export function ServiceNowTableList({
  table,
  fields,
  filters: initialFilters,
  pageSize = 25,
  sortable = true,
  searchable = true,
  selectable = false,
  actions = [],
  onRecordClick,
  onRecordUpdate,
  onSelectionChange,
  layout = 'table',
  'data-testid': testId,
  ...props
}: ServiceNowTableListProps) {
  const {
    records,
    loading,
    error,
    pagination,
    filters,
    sorting,
    selection,
    searchTerm,
    updateFilters,
    updateSearch,
    updateSorting,
    toggleSelection,
    selectAll,
    clearSelection,
    refresh,
    loadMore,
  } = useServiceNowTableList(table, {
    fields,
    initialFilters,
    pageSize,
    searchable,
    selectable,
  });

  // Handle record actions
  const handleRecordAction = (action: TableAction, record: ServiceNowRecord) => {
    action.onClick(record);
    
    if (action.refreshAfter) {
      refresh();
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action: TableAction) => {
    const selectedRecords = records.filter(record => selection.includes(record.sys_id));
    action.onClick(selectedRecords);
    
    if (action.refreshAfter) {
      refresh();
    }
    
    clearSelection();
  };

  const bulkActions = actions
    .filter(action => action.bulk)
    .map(action => ({
      id: action.id,
      label: `${action.label} (${selection.length})`,
      variant: action.variant,
      onClick: () => handleBulkAction(action),
      disabled: selection.length === 0,
    }));

  if (loading.initial) {
    return (
      <div className={styles.loading} data-testid={`${testId}-loading`}>
        <LoadingSpinner size="lg" message={`Loading ${table} records...`} />
      </div>
    );
  }

  if (error.list) {
    return (
      <ErrorBoundary
        error={error.list}
        onRetry={refresh}
        className={styles.error}
      />
    );
  }

  if (records.length === 0 && !loading.list) {
    return (
      <EmptyState
        title={`No ${table} records found`}
        description="Try adjusting your search or filters"
        action={searchTerm || Object.keys(filters).length > 0 ? (
          <Button onClick={() => { updateSearch(''); updateFilters({}); }}>
            Clear Filters
          </Button>
        ) : undefined}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className={styles.tableList} data-testid={testId} {...props}>
        {/* Header with search and actions */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.title}>
              {table} Records
              <Badge variant="neutral" size="sm">
                {pagination.total}
              </Badge>
            </h2>
            
            {searchable && (
              <SearchBox
                value={searchTerm}
                onChange={updateSearch}
                placeholder={`Search ${table}...`}
                loading={loading.search}
              />
            )}
          </div>

          <div className={styles.headerRight}>
            {bulkActions.length > 0 && (
              <ActionButtonGroup actions={bulkActions} size="sm" />
            )}
            
            <Button
              variant="secondary"
              size="sm"
              onClick={refresh}
              loading={loading.refresh}
            >
              <Icon name="refresh" size="sm" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Table content */}
        <div className={styles.content}>
          {layout === 'table' ? (
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                {selectable && (
                  <div className={styles.selectColumn}>
                    <input
                      type="checkbox"
                      checked={selection.length === records.length}
                      onChange={() => selection.length === records.length ? clearSelection() : selectAll()}
                      aria-label="Select all records"
                    />
                  </div>
                )}
                
                {fields.map((field) => (
                  <div
                    key={field.name}
                    className={`${styles.headerCell} ${field.sortable && sortable ? styles.sortable : ''}`}
                    onClick={field.sortable && sortable ? () => updateSorting(field.name) : undefined}
                  >
                    {field.label}
                    {sorting.field === field.name && (
                      <Icon
                        name={sorting.direction === 'asc' ? 'chevron-up' : 'chevron-down'}
                        size="sm"
                      />
                    )}
                  </div>
                ))}
                
                {actions.filter(a => !a.bulk).length > 0 && (
                  <div className={styles.actionsColumn}>Actions</div>
                )}
              </div>

              <div className={styles.tableBody}>
                {records.map((record) => (
                  <div
                    key={record.sys_id}
                    className={`${styles.tableRow} ${selection.includes(record.sys_id) ? styles.selected : ''}`}
                    onClick={onRecordClick ? () => onRecordClick(record) : undefined}
                  >
                    {selectable && (
                      <div className={styles.selectColumn}>
                        <input
                          type="checkbox"
                          checked={selection.includes(record.sys_id)}
                          onChange={() => toggleSelection(record.sys_id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                    
                    {fields.map((field) => (
                      <div key={field.name} className={styles.tableCell}>
                        <FieldDisplay
                          field={record[field.name]}
                          type={field.type}
                          format={field.format}
                        />
                      </div>
                    ))}
                    
                    {actions.filter(a => !a.bulk).length > 0 && (
                      <div className={styles.actionsColumn}>
                        <QuickActions
                          actions={actions.filter(a => !a.bulk)}
                          record={record}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.cardGrid}>
              {records.map((record) => (
                <div
                  key={record.sys_id}
                  className={`${styles.recordCard} ${selection.includes(record.sys_id) ? styles.selected : ''}`}
                  onClick={onRecordClick ? () => onRecordClick(record) : undefined}
                >
                  {selectable && (
                    <input
                      type="checkbox"
                      className={styles.cardCheckbox}
                      checked={selection.includes(record.sys_id)}
                      onChange={() => toggleSelection(record.sys_id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  
                  <RecordSummary
                    record={record}
                    fields={fields}
                    layout="vertical"
                  />
                  
                  {actions.filter(a => !a.bulk).length > 0 && (
                    <QuickActions
                      actions={actions.filter(a => !a.bulk)}
                      record={record}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.hasMore && (
          <div className={styles.pagination}>
            <Button
              variant="secondary"
              onClick={loadMore}
              loading={loading.loadMore}
            >
              Load More ({pagination.total - records.length} remaining)
            </Button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
```

---

## Dashboard Organisms

### **ServiceNow Widget Organism**

Reusable dashboard widget for displaying ServiceNow data with configuration options.

```tsx
// organisms/ServiceNowWidget/ServiceNowWidget.tsx
import { ServiceNowWidgetProps } from './ServiceNowWidget.types';
import { StatusIndicator, ActionButtonGroup } from '@/components/molecules';
import { Icon, Badge } from '@/components/atoms';
import { ErrorBoundary, LoadingSpinner } from '@/components/common';
import { useServiceNowWidget } from './hooks/useServiceNowWidget';
import styles from './ServiceNowWidget.module.css';

export function ServiceNowWidget({
  title,
  table,
  query,
  fields,
  visualization = 'list',
  refreshInterval,
  maxItems = 10,
  showHeader = true,
  showRefresh = true,
  actions = [],
  onItemClick,
  className,
  'data-testid': testId,
  ...props
}: ServiceNowWidgetProps) {
  const {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
  } = useServiceNowWidget(table, {
    query,
    fields,
    maxItems,
    refreshInterval,
  });

  const renderVisualization = () => {
    switch (visualization) {
      case 'count':
        return (
          <div className={styles.countVisualization}>
            <div className={styles.count}>{data.length}</div>
            <div className={styles.countLabel}>{title}</div>
          </div>
        );
      
      case 'chart':
        return (
          <div className={styles.chartVisualization}>
            {/* Chart implementation would go here */}
            <div className={styles.chartPlaceholder}>
              Chart visualization for {data.length} items
            </div>
          </div>
        );
      
      case 'list':
      default:
        return (
          <div className={styles.listVisualization}>
            {data.map((record) => (
              <div
                key={record.sys_id}
                className={styles.listItem}
                onClick={onItemClick ? () => onItemClick(record) : undefined}
              >
                <RecordSummary
                  record={record}
                  fields={fields}
                  layout="horizontal"
                  showLabels={false}
                />
              </div>
            ))}
          </div>
        );
    }
  };

  const widgetActions = [
    ...(showRefresh ? [{
      id: 'refresh',
      label: 'Refresh',
      variant: 'ghost' as const,
      onClick: refresh,
      loading: loading,
      icon: <Icon name="refresh" size="sm" />,
    }] : []),
    ...actions,
  ];

  return (
    <ErrorBoundary>
      <div
        className={`${styles.widget} ${className || ''}`}
        data-testid={testId}
        {...props}
      >
        {showHeader && (
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <h3 className={styles.title}>{title}</h3>
              {data.length > 0 && (
                <Badge variant="neutral" size="sm">
                  {data.length}
                </Badge>
              )}
            </div>
            
            <div className={styles.headerRight}>
              {lastUpdate && (
                <div className={styles.lastUpdate}>
                  Updated {lastUpdate.toLocaleTimeString()}
                </div>
              )}
              
              {widgetActions.length > 0 && (
                <ActionButtonGroup
                  actions={widgetActions}
                  size="sm"
                  layout="horizontal"
                />
              )}
            </div>
          </div>
        )}

        <div className={styles.content}>
          {loading && !data.length ? (
            <LoadingSpinner message="Loading widget data..." />
          ) : error ? (
            <div className={styles.error}>
              <Icon name="warning" size="md" />
              <span>Failed to load data</span>
            </div>
          ) : data.length === 0 ? (
            <div className={styles.empty}>
              <Icon name="info" size="md" />
              <span>No data available</span>
            </div>
          ) : (
            renderVisualization()
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
```

---

## Modal Organisms

### **ServiceNow Modal Form Organism**

Complete modal dialog for creating/editing ServiceNow records.

```tsx
// organisms/ServiceNowModalForm/ServiceNowModalForm.tsx
import { ServiceNowModalFormProps } from './ServiceNowModalForm.types';
import { ServiceNowForm } from '../ServiceNowForm';
import { Modal } from '@/components/common';
import { Button, Icon } from '@/components/atoms';
import styles from './ServiceNowModalForm.module.css';

export function ServiceNowModalForm({
  isOpen,
  onClose,
  table,
  recordId,
  fields,
  title,
  size = 'md',
  onSuccess,
  onError,
  'data-testid': testId,
  ...props
}: ServiceNowModalFormProps) {
  const modalTitle = title || (recordId ? `Edit ${table}` : `Create ${table}`);

  const handleFormSubmit = (record: ServiceNowRecord) => {
    onSuccess?.(record);
    onClose();
  };

  const handleFormError = (error: Error) => {
    onError?.(error);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      title={modalTitle}
      data-testid={testId}
      {...props}
    >
      <div className={styles.modalContent}>
        <ServiceNowForm
          table={table}
          recordId={recordId}
          fields={fields}
          onSubmit={handleFormSubmit}
          onCancel={onClose}
          layout="vertical"
          showProgress={true}
        />
      </div>
    </Modal>
  );
}
```

---

## Testing ServiceNow Organisms

### **Integration Testing for Forms**

```tsx
// organisms/ServiceNowForm/ServiceNowForm.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ServiceNowForm } from './ServiceNowForm';
import { mockServiceNowFormService } from '@/services/__mocks__/ServiceNowFormService';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={createTestQueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('ServiceNowForm', () => {
  const mockFields = [
    {
      name: 'short_description',
      label: 'Short Description',
      type: 'string',
      required: true,
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'choice',
      choices: [
        { value: '1', label: 'High' },
        { value: '2', label: 'Medium' },
        { value: '3', label: 'Low' },
      ],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(
      <TestWrapper>
        <ServiceNowForm
          table="incident"
          fields={mockFields}
          onSubmit={jest.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Short Description *')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
  });

  it('handles form submission correctly', async () => {
    const onSubmit = jest.fn();
    mockServiceNowFormService.createRecord.mockResolvedValue({
      sys_id: 'new-record-id',
      short_description: 'Test incident',
      priority: '1',
    });

    render(
      <TestWrapper>
        <ServiceNowForm
          table="incident"
          fields={mockFields}
          onSubmit={onSubmit}
        />
      </TestWrapper>
    );

    // Fill out form
    fireEvent.change(screen.getByLabelText('Short Description *'), {
      target: { value: 'Test incident' },
    });
    fireEvent.change(screen.getByLabelText('Priority'), {
      target: { value: '1' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mockServiceNowFormService.createRecord).toHaveBeenCalledWith(
        'incident',
        {
          short_description: 'Test incident',
          priority: '1',
        }
      );
    });

    expect(onSubmit).toHaveBeenCalledWith({
      sys_id: 'new-record-id',
      short_description: 'Test incident',
      priority: '1',
    });
  });

  it('displays validation errors', async () => {
    render(
      <TestWrapper>
        <ServiceNowForm
          table="incident"
          fields={mockFields}
          onSubmit={jest.fn()}
        />
      </TestWrapper>
    );

    // Try to submit without filling required field
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Short description is required');
    });
  });

  it('loads existing record for editing', async () => {
    const existingRecord = {
      sys_id: 'existing-id',
      short_description: { display_value: 'Existing incident', value: 'Existing incident' },
      priority: { display_value: 'High', value: '1' },
    };

    mockServiceNowFormService.getRecord.mockResolvedValue(existingRecord);

    render(
      <TestWrapper>
        <ServiceNowForm
          table="incident"
          recordId="existing-id"
          fields={mockFields}
          onSubmit={jest.fn()}
        />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing incident')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });
});
```

---

## File Organization for Organisms

### **Organism Structure**
```
src/components/organisms/ServiceNowForm/
├── ServiceNowForm.tsx          # Main component
├── ServiceNowForm.types.ts     # TypeScript interfaces  
├── ServiceNowForm.module.css   # Component styles
├── ServiceNowForm.test.tsx     # Unit/integration tests
├── ServiceNowForm.stories.tsx  # Storybook stories
├── index.ts                    # Export interface
├── hooks/                      # Component-specific hooks
│   ├── useServiceNowForm.ts
│   └── useFormValidation.ts
├── utils/                      # Component utilities
│   ├── fieldRenderer.tsx
│   ├── validation.ts
│   └── formatting.ts
└── components/                 # Sub-components
    ├── FormProgress.tsx
    ├── FieldGroup.tsx
    └── index.ts
```

---

## Best Practices for ServiceNow Organisms

### **✅ Do This**
- **Use custom hooks for business logic** - Separate concerns effectively
- **Handle complete workflows** - End-to-end user experiences
- **Integrate with ServiceNow APIs** - Proper data fetching and caching
- **Include comprehensive error handling** - Network errors, validation, permissions
- **Provide loading states** - Clear feedback during operations
- **Support accessibility** - Keyboard navigation, screen readers
- **Test integration scenarios** - Real-world usage patterns

### **❌ Avoid This**
- **Direct API calls in components** - Use hooks and services
- **Complex prop drilling** - Use composition and context
- **Hardcoded ServiceNow endpoints** - Use configuration
- **Missing error boundaries** - Always handle component errors
- **Ignoring loading states** - Provide user feedback
- **Skipping integration tests** - Test complete workflows

---

## Next Steps

**Organisms completed! Continue with advanced patterns:**

### **Advanced Composition:**
- [Compound Components](compound-components.md) - Advanced component composition
- [Component Testing](component-testing.md) - Testing strategies for organisms

### **Integration Patterns:**
- [Service Layer Integration](service-layer-integration.md) - API integration patterns
- [Performance Optimization](performance-optimization.md) - Optimizing complex components

### **ServiceNow Specific:**
- [Portal Integration](portal-integration-patterns.md) - ServiceNow portal patterns
- [Next Experience Integration](next-experience-patterns.md) - Modern ServiceNow UI

---

*ServiceNow organisms handle complex business functionality by combining atoms and molecules with custom hooks for state management. Focus on complete user workflows, proper error handling, and seamless integration with ServiceNow's backend capabilities.*