// src/components/mantine/Table.tsx
import React, { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableProps,
  ScrollArea,
  TextInput,
  Select,
  Group,
  Text,
  ActionIcon,
  Pagination,
  Stack,
  Card,
  Loader,
  Alert,
  ThemeIcon,
  Box,
  Badge,
  Tooltip,
  UnstyledButton
} from '@mantine/core';
import {
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconFilter,
  IconRefresh,
  IconDownload,
  IconAlertCircle,
  IconTable
} from '@tabler/icons-react';
import { logger } from '../../monitoring/logger';

// Base interfaces for table functionality
export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
}

export interface TableAction<T = any> {
  key: string;
  title: string;
  icon?: React.ReactNode;
  onClick: (record: T, index: number) => void;
  disabled?: (record: T) => boolean;
  danger?: boolean;
  tooltip?: string;
}

export interface SortConfig {
  field: string | null;
  direction: 'asc' | 'desc' | null;
}

export interface FilterConfig {
  [key: string]: string | number | boolean | null;
}

export interface PaginationConfig {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
}

// Enhanced table props interface
export interface GenericTableProps<T = any> extends Omit<TableProps, 'data'> {
  // Data and structure
  data: T[];
  columns?: TableColumn<T>[];
  rowKey?: keyof T | ((record: T) => string);
  
  // Loading and error states
  loading?: boolean;
  error?: string | null;
  
  // Pagination
  pagination?: PaginationConfig | false;
  onPaginationChange?: (page: number, pageSize: number) => void;
  
  // Sorting
  sortable?: boolean;
  sortConfig?: SortConfig;
  onSortChange?: (config: SortConfig) => void;
  
  // Filtering
  filterable?: boolean;
  filters?: FilterConfig;
  onFilterChange?: (filters: FilterConfig) => void;
  
  // Selection
  selectable?: boolean;
  selectedRowKeys?: string[];
  onSelectionChange?: (selectedKeys: string[], selectedRows: T[]) => void;
  
  // Actions
  actions?: TableAction<T>[];
  
  // Styling and behavior
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  bordered?: boolean;
  hoverable?: boolean;
  striped?: boolean;
  sticky?: boolean;
  
  // Performance and tracking
  trackInteractions?: boolean;
  trackingContext?: Record<string, any>;
  
  // Export functionality
  exportable?: boolean;
  onExport?: (data: T[], format: 'csv' | 'json' | 'xlsx') => void;
  
  // Empty state
  emptyText?: string;
  emptyIcon?: React.ReactNode;
  
  // Custom rendering
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  
  // Error handling
  onError?: (error: Error) => void;

  // Allow children for manual table structure
  children?: React.ReactNode;
}

// Generic table component with comprehensive functionality
export const GenericTable = <T extends Record<string, any>>({
  data,
  columns = [],
  rowKey = 'id',
  loading = false,
  error = null,
  pagination = false,
  onPaginationChange,
  sortable = true,
  sortConfig,
  onSortChange,
  filterable = true,
  filters = {},
  onFilterChange,
  selectable = false,
  selectedRowKeys = [],
  onSelectionChange,
  actions = [],
  size = 'md',
  bordered = true,
  hoverable = true,
  striped = false,
  sticky = false,
  trackInteractions = true,
  trackingContext = {},
  exportable = false,
  onExport,
  emptyText = 'No data available',
  emptyIcon = <IconTable size={48} />,
  renderHeader,
  renderFooter,
  onError,
  children,
  ...tableProps
}: GenericTableProps<T>) => {
  // If children are provided, render a simple wrapper table
  if (children) {
    return (
      <Card>
        <ScrollArea>
          <Table
            striped={striped}
            highlightOnHover={hoverable}
            {...tableProps}
          >
            {children}
          </Table>
        </ScrollArea>
      </Card>
    );
  }

  // State management
  const [internalSort, setInternalSort] = useState<SortConfig>({ field: null, direction: null });
  const [internalFilters, setInternalFilters] = useState<FilterConfig>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination ? pagination.pageSize || 10 : 10);

  // Use controlled or internal state
  const currentSort = sortConfig || internalSort;
  const currentFilters = Object.keys(filters).length > 0 ? filters : internalFilters;

  // Error handling wrapper
  const handleError = useCallback((error: Error, context: string) => {
    logger.error(`GenericTable error in ${context}`, error, {
      trackingContext,
      dataLength: data.length,
      columnsCount: columns.length
    });
    
    if (onError) {
      onError(error);
    }
  }, [onError, trackingContext, data.length, columns.length]);

  // Get row key function
  const getRowKey = useCallback((record: T, index: number): string => {
    try {
      if (typeof rowKey === 'function') {
        return rowKey(record);
      }
      return String(record[rowKey] || index);
    } catch (error) {
      handleError(error as Error, 'getRowKey');
      return String(index);
    }
  }, [rowKey, handleError]);

  // Sort handler
  const handleSort = useCallback((field: string) => {
    try {
      if (!sortable) return;

      const newDirection = 
        currentSort.field === field && currentSort.direction === 'asc' 
          ? 'desc' 
          : currentSort.field === field && currentSort.direction === 'desc'
          ? null
          : 'asc';

      const newSort = { field: newDirection ? field : null, direction: newDirection };

      if (onSortChange) {
        onSortChange(newSort);
      } else {
        setInternalSort(newSort);
      }

      if (trackInteractions) {
        logger.info('Table sort changed', {
          field,
          direction: newDirection,
          ...trackingContext
        });
      }
    } catch (error) {
      handleError(error as Error, 'handleSort');
    }
  }, [sortable, currentSort, onSortChange, trackInteractions, trackingContext, handleError]);

  // Filter handler
  const handleFilterChange = useCallback((field: string, value: string | number | boolean | null) => {
    try {
      const newFilters = { ...currentFilters, [field]: value };
      
      if (onFilterChange) {
        onFilterChange(newFilters);
      } else {
        setInternalFilters(newFilters);
      }

      // Reset to first page when filtering
      setCurrentPage(1);

      if (trackInteractions) {
        logger.info('Table filter changed', {
          field,
          value,
          ...trackingContext
        });
      }
    } catch (error) {
      handleError(error as Error, 'handleFilterChange');
    }
  }, [currentFilters, onFilterChange, trackInteractions, trackingContext, handleError]);

  // Processed data (filtered, sorted, paginated)
  const processedData = useMemo(() => {
    try {
      let result = [...data];

      // Apply search
      if (searchTerm) {
        result = result.filter(record => {
          return columns.some(column => {
            const value = column.dataIndex ? record[column.dataIndex] : null;
            return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
          });
        });
      }

      // Apply column filters
      Object.entries(currentFilters).forEach(([field, filterValue]) => {
        if (filterValue !== null && filterValue !== '') {
          result = result.filter(record => {
            const recordValue = record[field];
            if (typeof filterValue === 'string') {
              return String(recordValue || '').toLowerCase().includes(filterValue.toLowerCase());
            }
            return recordValue === filterValue;
          });
        }
      });

      // Apply sorting
      if (currentSort.field && currentSort.direction) {
        result.sort((a, b) => {
          const aVal = a[currentSort.field!];
          const bVal = b[currentSort.field!];
          
          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          if (aVal > bVal) comparison = 1;
          
          return currentSort.direction === 'desc' ? -comparison : comparison;
        });
      }

      return result;
    } catch (error) {
      handleError(error as Error, 'processedData');
      return data;
    }
  }, [data, searchTerm, currentFilters, currentSort, columns, handleError]);

  // Paginated data
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;
    
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return processedData.slice(start, end);
  }, [processedData, pagination, currentPage, pageSize]);

  // Selection handlers
  const handleRowSelect = useCallback((recordKey: string, record: T) => {
    if (!selectable || !onSelectionChange) return;

    try {
      const newSelectedKeys = selectedRowKeys.includes(recordKey)
        ? selectedRowKeys.filter(key => key !== recordKey)
        : [...selectedRowKeys, recordKey];

      const newSelectedRows = data.filter(item => 
        newSelectedKeys.includes(getRowKey(item, data.indexOf(item)))
      );

      onSelectionChange(newSelectedKeys, newSelectedRows);

      if (trackInteractions) {
        logger.info('Table row selection changed', {
          recordKey,
          selected: !selectedRowKeys.includes(recordKey),
          totalSelected: newSelectedKeys.length,
          ...trackingContext
        });
      }
    } catch (error) {
      handleError(error as Error, 'handleRowSelect');
    }
  }, [selectable, onSelectionChange, selectedRowKeys, data, getRowKey, trackInteractions, trackingContext, handleError]);

  // Export handler
  const handleExport = useCallback((format: 'csv' | 'json' | 'xlsx') => {
    try {
      if (onExport) {
        onExport(processedData, format);
      }

      if (trackInteractions) {
        logger.info('Table data exported', {
          format,
          recordCount: processedData.length,
          ...trackingContext
        });
      }
    } catch (error) {
      handleError(error as Error, 'handleExport');
    }
  }, [onExport, processedData, trackInteractions, trackingContext, handleError]);

  // Render sort icon
  const renderSortIcon = (field: string) => {
    if (currentSort.field !== field) {
      return <IconSortAscending size={14} style={{ opacity: 0.3 }} />;
    }
    return currentSort.direction === 'asc' 
      ? <IconSortAscending size={14} />
      : <IconSortDescending size={14} />;
  };

  // Render table header
  const renderTableHeader = () => (
    <Table.Thead>
      <Table.Tr>
        {selectable && (
          <Table.Th width={40}>
            <input 
              type="checkbox" 
              checked={selectedRowKeys.length === paginatedData.length && paginatedData.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  const allKeys = paginatedData.map((record, index) => getRowKey(record, index));
                  onSelectionChange?.(allKeys, paginatedData);
                } else {
                  onSelectionChange?.([], []);
                }
              }}
            />
          </Table.Th>
        )}
        {columns.map((column) => (
          <Table.Th
            key={column.key}
            style={{
              width: column.width,
              textAlign: column.align || 'left',
            }}
          >
            <Group gap="xs" justify="space-between">
              <Text fw={600}>{column.title}</Text>
              {column.sortable !== false && sortable && (
                <UnstyledButton onClick={() => handleSort(column.dataIndex as string || column.key)}>
                  {renderSortIcon(column.dataIndex as string || column.key)}
                </UnstyledButton>
              )}
            </Group>
          </Table.Th>
        ))}
        {actions.length > 0 && (
          <Table.Th width={100}>Actions</Table.Th>
        )}
      </Table.Tr>
    </Table.Thead>
  );

  // Render table body
  const renderTableBody = () => (
    <Table.Tbody>
      {paginatedData.map((record, index) => {
        const recordKey = getRowKey(record, index);
        const isSelected = selectedRowKeys.includes(recordKey);

        return (
          <Table.Tr
            key={recordKey}
            style={{
              backgroundColor: isSelected ? 'var(--mantine-color-blue-0)' : undefined,
            }}
          >
            {selectable && (
              <Table.Td>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleRowSelect(recordKey, record)}
                />
              </Table.Td>
            )}
            {columns.map((column) => {
              const value = column.dataIndex ? record[column.dataIndex] : null;
              const cellContent = column.render ? column.render(value, record, index) : String(value || '');

              return (
                <Table.Td
                  key={column.key}
                  style={{
                    textAlign: column.align || 'left',
                  }}
                >
                  {cellContent}
                </Table.Td>
              );
            })}
            {actions.length > 0 && (
              <Table.Td>
                <Group gap="xs">
                  {actions.map((action) => {
                    const isDisabled = action.disabled ? action.disabled(record) : false;
                    
                    return (
                      <Tooltip key={action.key} label={action.tooltip || action.title}>
                        <ActionIcon
                          size="sm"
                          variant={action.danger ? 'light' : 'subtle'}
                          color={action.danger ? 'red' : 'blue'}
                          disabled={isDisabled}
                          onClick={() => action.onClick(record, index)}
                        >
                          {action.icon}
                        </ActionIcon>
                      </Tooltip>
                    );
                  })}
                </Group>
              </Table.Td>
            )}
          </Table.Tr>
        );
      })}
    </Table.Tbody>
  );

  // Loading state
  if (loading) {
    return (
      <Card p="xl">
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">Loading table data...</Text>
        </Stack>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert color="red" icon={<IconAlertCircle size={16} />}>
        <Group justify="space-between">
          <div>
            <Text fw={600}>Error loading table data</Text>
            <Text size="sm">{error}</Text>
          </div>
          <ActionIcon
            variant="light"
            color="red"
            onClick={() => window.location.reload()}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
      </Alert>
    );
  }

  // Empty state
  if (processedData.length === 0) {
    return (
      <Card p="xl">
        <Stack align="center" gap="md">
          <ThemeIcon size={64} color="gray">
            {emptyIcon}
          </ThemeIcon>
          <Text c="dimmed" ta="center">{emptyText}</Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      {/* Table Header Controls */}
      {(filterable || exportable || renderHeader) && (
        <Card p="md">
          <Group justify="space-between">
            <Group gap="md">
              {filterable && (
                <TextInput
                  placeholder="Search all columns..."
                  leftSection={<IconSearch size={16} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ minWidth: 200 }}
                />
              )}
              {Object.keys(currentFilters).length > 0 && (
                <Badge variant="light" color="blue">
                  {Object.values(currentFilters).filter(v => v).length} filters active
                </Badge>
              )}
            </Group>
            
            <Group gap="sm">
              {exportable && (
                <Select
                  placeholder="Export"
                  data={[
                    { value: 'csv', label: 'Export CSV' },
                    { value: 'json', label: 'Export JSON' },
                    { value: 'xlsx', label: 'Export Excel' }
                  ]}
                  onChange={(value) => value && handleExport(value as any)}
                  leftSection={<IconDownload size={16} />}
                  clearable
                />
              )}
              {renderHeader && renderHeader()}
            </Group>
          </Group>
        </Card>
      )}

      {/* Main Table */}
      <Card>
        <ScrollArea>
          <Table
            striped={striped}
            highlightOnHover={hoverable}
            {...tableProps}
          >
            {renderTableHeader()}
            {renderTableBody()}
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {pagination && (
          <Group justify="space-between" p="md">
            <Text size="sm" c="dimmed">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} entries
            </Text>
            <Pagination
              total={Math.ceil(processedData.length / pageSize)}
              value={currentPage}
              onChange={(page) => {
                setCurrentPage(page);
                onPaginationChange?.(page, pageSize);
              }}
              size="sm"
            />
          </Group>
        )}

        {renderFooter && renderFooter()}
      </Card>
    </Stack>
  );
};

// Export component with memo for performance
export default React.memo(GenericTable) as typeof GenericTable;