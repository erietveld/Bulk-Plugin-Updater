// src/client/components/mantine/StoreUpdatesDataGrid.tsx
// PHASE 5: Enhanced search performance with minimum 3 characters and improved input state
// COLUMN UPDATE: Removed level column, changed Priority to Level (showing batch_level data)
// Advanced DataGrid for Store Updates with CLIENT-SIDE pagination, search, filtering, and multi-select
// Following Architecture.md patterns with generic component integration
// CLEANED: Removed excessive debug logging, kept essential functionality
// UPDATED: Added Published Date and Description columns from available_version dot-walking
// STYLED: Changed Published Date and Description text color to match version subtext (dimmed)
// FIXED: Updated batch_level badge colors to match actual API data values (major/minor/patch)

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Table,
  Checkbox,
  Text,
  Badge,
  Group,
  ActionIcon,
  Tooltip,
  Select,
  TextInput,
  Paper,
  Stack,
  Alert,
  Button,
  Center,
  Loader
} from '@mantine/core';
import {
  IconSearch,
  IconSortAscending,
  IconSortDescending,
  IconEye,
  IconDownload,
  IconAlertCircle,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconX
} from '@tabler/icons-react';

// Import types and hooks - FIXED: Updated imports after cleanup
import type { StoreUpdate } from '../../../hooks/useStoreUpdatesHybrid';
import type { useStoreUpdatesFiltering, useStoreUpdatesPagination } from '../../../hooks/useStoreUpdatesHybrid';
import type { useStoreUpdatesSelection } from '../../../hooks/useStoreUpdatesSelection';
import { logger, createLogContext } from '../../../monitoring/logger';

// Import generic components
import { GenericTable } from '../../../components/mantine/Table';
import { GenericButton } from '../../../components/mantine/Button';

interface StoreUpdatesDataGridProps {
  filteringHook: ReturnType<typeof useStoreUpdatesFiltering>;
  paginationHook: ReturnType<typeof useStoreUpdatesPagination>;
  selectionHook: ReturnType<typeof useStoreUpdatesSelection>;
  data: StoreUpdate[];
  compactMode?: boolean;
  onRowClick?: (record: StoreUpdate) => void;
  onRowDoubleClick?: (record: StoreUpdate) => void;
}

// Column configuration
interface ColumnConfig {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
  render: (record: StoreUpdate) => React.ReactNode;
}

// Helper function to format dates consistently
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid Date';
  }
};

/**
 * Generic pagination component that can be reused across the application
 */
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageClick: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  maxPagesToShow?: number;
}

const GenericPagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageClick,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  maxPagesToShow = 7
}) => {
  if (totalPages <= 1) return null;

  const pages = [];
  
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  // Adjust if we're near the end
  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  // Always show first page
  if (startPage > 1) {
    pages.push(
      <Button
        key={1}
        size="sm"
        variant={1 === currentPage ? "filled" : "subtle"}
        onClick={() => onPageClick(1)}
      >
        1
      </Button>
    );
    
    if (startPage > 2) {
      pages.push(
        <Text key="ellipsis-start" size="sm" c="dimmed">...</Text>
      );
    }
  }

  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <Button
        key={i}
        size="sm"
        variant={i === currentPage ? "filled" : "subtle"}
        onClick={() => onPageClick(i)}
      >
        {i}
      </Button>
    );
  }

  // Always show last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(
        <Text key="ellipsis-end" size="sm" c="dimmed">...</Text>
      );
    }
    
    pages.push(
      <Button
        key={totalPages}
        size="sm"
        variant={totalPages === currentPage ? "filled" : "subtle"}
        onClick={() => onPageClick(totalPages)}
      >
        {totalPages}
      </Button>
    );
  }

  return (
    <Group gap="xs">
      <Button
        size="sm"
        variant="subtle"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        leftSection={<IconChevronLeft size={14} />}
      >
        Previous
      </Button>
      
      {pages}
      
      <Button
        size="sm"
        variant="subtle"
        onClick={onNext}
        disabled={!canGoNext}
        rightSection={<IconChevronRight size={14} />}
      >
        Next
      </Button>
    </Group>
  );
};

/**
 * PHASE 5: Enhanced Search Input Component with controlled state and minimum character requirement
 */
interface EnhancedSearchInputProps {
  onSearch: (value: string) => void;
  currentFilter: string;
  placeholder?: string;
  minCharacters?: number;
}

const EnhancedSearchInput: React.FC<EnhancedSearchInputProps> = ({
  onSearch,
  currentFilter,
  placeholder = "Search applications...",
  minCharacters = 3
}) => {
  // PHASE 5: Local controlled state to prevent value loss on rerenders
  const [inputValue, setInputValue] = useState(currentFilter);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Sync with external filter changes (like clear filters)
  useEffect(() => {
    if (currentFilter !== inputValue) {
      setInputValue(currentFilter);
    }
  }, [currentFilter]);

  // PHASE 5: Enhanced debounced search with minimum character requirement
  const debouncedSearch = useCallback(
    React.useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      
      return (value: string) => {
        clearTimeout(timeoutId);
        setIsSearchActive(true);
        
        timeoutId = setTimeout(() => {
          // PHASE 5: Only search if meets minimum character requirement or is empty (for clearing)
          if (value.length >= minCharacters || value.length === 0) {
            onSearch(value);
            logger.info('Enhanced search triggered', createLogContext({
              searchTerm: value,
              searchLength: value.length,
              minRequired: minCharacters,
              searchType: value.length === 0 ? 'clear' : 'filter'
            }));
          } else if (value.length > 0) {
            // Clear search if under minimum but not empty
            onSearch('');
            logger.info('Search cleared - under minimum characters', createLogContext({
              searchTerm: value,
              searchLength: value.length,
              minRequired: minCharacters
            }));
          }
          setIsSearchActive(false);
        }, 300);
      };
    }, [onSearch, minCharacters]),
    [onSearch, minCharacters]
  );

  // Handle input changes
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // Handle clear button
  const handleClear = useCallback(() => {
    setInputValue('');
    onSearch('');
    setIsSearchActive(false);
  }, [onSearch]);

  // PHASE 5: Dynamic placeholder based on input state
  const getPlaceholder = () => {
    if (inputValue.length > 0 && inputValue.length < minCharacters) {
      return `Type ${minCharacters - inputValue.length} more character${minCharacters - inputValue.length !== 1 ? 's' : ''}...`;
    }
    return placeholder;
  };

  // PHASE 5: Dynamic input styling based on state
  const getInputColor = () => {
    if (inputValue.length > 0 && inputValue.length < minCharacters) {
      return 'orange'; // Warning state
    }
    if (currentFilter && currentFilter.length >= minCharacters) {
      return 'blue'; // Active search state
    }
    return undefined; // Default state
  };

  return (
    <TextInput
      placeholder={getPlaceholder()}
      leftSection={<IconSearch size={16} />}
      value={inputValue}
      onChange={handleInputChange}
      style={{ minWidth: 300 }}
      color={getInputColor()}
      rightSection={
        inputValue && (
          <ActionIcon
            size="sm"
            variant="subtle"
            onClick={handleClear}
          >
            <IconX size={14} />
          </ActionIcon>
        )
      }
      description={
        inputValue.length > 0 && inputValue.length < minCharacters ? (
          <Text size="xs" c="orange">
            Minimum {minCharacters} characters required for search
          </Text>
        ) : undefined
      }
    />
  );
};

/**
 * Advanced DataGrid component for Store Updates
 * COLUMN UPDATE: Removed level column, Priority renamed to Level showing batch_level
 * STYLED: Changed Published Date and Description text color to match version subtext
 * FIXED: Updated batch_level badge colors to match actual API data values
 */
export const StoreUpdatesDataGrid: React.FC<StoreUpdatesDataGridProps> = ({
  filteringHook,
  paginationHook,
  selectionHook,
  data,
  compactMode = false,
  onRowClick,
  onRowDoubleClick
}) => {
  // Create unique row key generator for duplicate sys_ids
  const generateRowKey = useCallback((record: StoreUpdate, index: number) => {
    return `${record.sys_id}-${index}-${record.level}-${record.batch_level}`;
  }, []);

  // COLUMN UPDATE: Removed old 'level' column, renamed 'Priority' to 'Level'
  // STYLED: Updated Published Date and Description columns to use 'dimmed' color
  // FIXED: Updated batch_level badge colors to match actual API values (major/minor/patch)
  const columns: ColumnConfig[] = useMemo(() => [
    {
      key: 'name',
      label: 'Application Name',
      sortable: true,
      width: compactMode ? '200px' : '300px',
      render: (record) => (
        <Stack gap={2}>
          <Text fw={600} size="sm" lineClamp={1}>
            {record.name}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={1}>
            Version: {record.installed_version}
          </Text>
        </Stack>
      )
    },
    {
      key: 'batch_level',
      label: 'Level', // CHANGED: From 'Priority' to 'Level'
      sortable: true,
      width: '100px',
      render: (record) => (
        <Badge
          color={
            // FIXED: Updated colors to match actual API data values (major/minor/patch)
            record.batch_level === 'major' ? 'red' :
            record.batch_level === 'minor' ? 'yellow' : 'green'
          }
          variant="filled"
          size="sm"
        >
          {record.batch_level}
        </Badge>
      )
    },
    {
      key: 'available_version_publish_date',
      label: 'Published Date',
      sortable: true,
      width: '120px',
      render: (record) => (
        <Text 
          size="xs" 
          c="dimmed" // CHANGED: From conditional color to always 'dimmed' to match version subtext
        >
          {formatDate(record.available_version_publish_date)}
        </Text>
      )
    },
    {
      key: 'available_version_short_description',
      label: 'Description',
      sortable: false,
      width: compactMode ? '150px' : '200px',
      render: (record) => (
        <Tooltip 
          label={record.available_version_short_description || 'No description available'}
          multiline
          maw={300}
          position="top-start"
        >
          <Text 
            size="xs" 
            c="dimmed" // CHANGED: From conditional color to always 'dimmed' to match version subtext
            lineClamp={1}
          >
            {record.available_version_short_description || 'No description available'}
          </Text>
        </Tooltip>
      )
    },
    {
      key: 'update_counts',
      label: 'Updates Available',
      sortable: false,
      width: compactMode ? '120px' : '150px',
      render: (record) => (
        <Group gap={4}>
          {record.major_count > 0 && (
            <Badge size="xs" color="red" variant="dot">
              {record.major_count}M
            </Badge>
          )}
          {record.minor_count > 0 && (
            <Badge size="xs" color="yellow" variant="dot">
              {record.minor_count}m
            </Badge>
          )}
          {record.patch_count > 0 && (
            <Badge size="xs" color="green" variant="dot">
              {record.patch_count}p
            </Badge>
          )}
        </Group>
      )
    },
    {
      key: 'latest_version_level',
      label: 'Latest',
      sortable: true,
      width: '80px',
      render: (record) => (
        <Badge
          color={
            record.latest_version_level === 'major' ? 'red' :
            record.latest_version_level === 'minor' ? 'yellow' : 'green'
          }
          size="xs"
          variant="outline"
        >
          {record.latest_version_level}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      width: '100px',
      render: (record) => (
        <Group gap={4}>
          <Tooltip label="View Details">
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(record);
              }}
            >
              <IconEye size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Download Update">
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadUpdate(record);
              }}
            >
              <IconDownload size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      )
    }
  ], [compactMode]);

  // Handle sorting
  const handleSort = useCallback((columnKey: string) => {
    filteringHook.updateSorting(columnKey);
  }, [filteringHook]);

  // Handle row interactions
  const handleRowClick = useCallback((record: StoreUpdate) => {
    if (onRowClick) {
      onRowClick(record);
    } else {
      handleViewDetails(record);
    }
  }, [onRowClick]);

  const handleRowDoubleClick = useCallback((record: StoreUpdate) => {
    if (onRowDoubleClick) {
      onRowDoubleClick(record);
    } else {
      selectionHook.selectRecord(record, 'toggle');
    }
  }, [onRowDoubleClick, selectionHook]);

  // Handle actions
  const handleViewDetails = useCallback((record: StoreUpdate) => {
    logger.trackUserAction('view-details', createLogContext({
      recordId: record.sys_id,
      appName: record.name
    }));
  }, []);

  const handleDownloadUpdate = useCallback((record: StoreUpdate) => {
    logger.trackUserAction('download-update', createLogContext({
      recordId: record.sys_id,
      appName: record.name
    }));
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      selectionHook.selectAllVisible();
    } else {
      selectionHook.clearSelection();
    }
    
    logger.trackUserAction('select-all-toggle', createLogContext({
      selectAll: checked,
      visibleRecords: data.length
    }));
  }, [selectionHook, data.length]);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: string | null) => {
    if (newPageSize) {
      const size = parseInt(newPageSize, 10);
      paginationHook.setPageSize(size);
    }
  }, [paginationHook]);

  // PHASE 5: Enhanced search handler with performance logging
  const handleEnhancedSearch = useCallback((value: string) => {
    filteringHook.setSearch(value);
    
    logger.info('Enhanced search applied', createLogContext({
      pattern: 'enhanced-search',
      searchLength: value.length,
      hasFilter: value.length > 0,
      performance: 'optimized-minimum-3-chars'
    }));
  }, [filteringHook]);

  // Render sort icon
  const renderSortIcon = useCallback((columnKey: string) => {
    if (filteringHook.filters.sortBy !== columnKey) {
      return null;
    }
    
    return filteringHook.filters.sortDirection === 'asc' ? (
      <IconSortAscending size={14} />
    ) : (
      <IconSortDescending size={14} />
    );
  }, [filteringHook.filters.sortBy, filteringHook.filters.sortDirection]);

  // Selection states
  const allVisibleSelected = useMemo(() => {
    return data.length > 0 && data.every(record => 
      selectionHook.isRecordSelected(record.sys_id)
    );
  }, [data, selectionHook]);

  const someVisibleSelected = useMemo(() => {
    return data.some(record => selectionHook.isRecordSelected(record.sys_id));
  }, [data, selectionHook]);

  // PHASE 5: Enhanced search status for better UX
  const searchStatus = useMemo(() => {
    const hasSearch = filteringHook.filters.search.length > 0;
    const searchLength = filteringHook.filters.search.length;
    
    if (hasSearch && searchLength >= 3) {
      return {
        type: 'active' as const,
        message: `Searching for "${filteringHook.filters.search}"`
      };
    }
    
    return null;
  }, [filteringHook.filters.search]);

  // Empty state
  if (data.length === 0) {
    return (
      <Paper p="xl">
        <Center>
          <Stack align="center" gap="md">
            <IconAlertCircle size={48} color="gray" />
            <Text size="lg" fw={600} c="dimmed">No Store Updates Found</Text>
            <Text c="dimmed" ta="center">
              {filteringHook.insights.hasActiveFilters
                ? 'No updates match your current filters. Try adjusting your search criteria.'
                : 'No store updates are currently available. Check back later or refresh to scan for new updates.'
              }
            </Text>
            <Group gap="md">
              {filteringHook.insights.hasActiveFilters && (
                <Button variant="light" onClick={filteringHook.clearFilters}>
                  Clear Filters
                </Button>
              )}
              <Button
                leftSection={<IconRefresh size={16} />}
                onClick={() => logger.info('Refresh clicked from empty state')}
              >
                Refresh
              </Button>
            </Group>
          </Stack>
        </Center>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      {/* PHASE 5: Enhanced Search and Controls */}
      <Paper p="md">
        <Group justify="space-between">
          <Group gap="md">
            <EnhancedSearchInput
              onSearch={handleEnhancedSearch}
              currentFilter={filteringHook.filters.search}
              placeholder="Search applications (min 3 chars)..."
              minCharacters={3}
            />
            
            <Text size="sm" c="dimmed">
              {data.length} of {paginationHook.totalRecords} updates
              {filteringHook.insights.isFiltered && (
                <> (from {filteringHook.insights.allRecordsCount} total)</>
              )}
            </Text>
            
            {filteringHook.insights.hasActiveFilters && (
              <Badge color="blue" variant="light" size="sm">
                {filteringHook.insights.activeFiltersCount} filter{filteringHook.insights.activeFiltersCount !== 1 ? 's' : ''} active
              </Badge>
            )}
            
            {/* PHASE 5: Enhanced search status feedback */}
            {searchStatus && (
              <Badge color="blue" variant="filled" size="sm">
                {searchStatus.message}
              </Badge>
            )}
          </Group>
          
          <Group gap="md">
            <Select
              data={[
                { value: '10', label: '10 per page' },
                { value: '25', label: '25 per page' },
                { value: '50', label: '50 per page' },
                { value: '100', label: '100 per page' },
              ]}
              value={paginationHook.pageSize.toString()}
              onChange={handlePageSizeChange}
              size="sm"
              w={130}
            />
          </Group>
        </Group>
      </Paper>

      {/* Data Table */}
      <GenericTable
        data={data}
        loading={false}
        striped
        highlightOnHover
        onError={(error) => logger.error('DataGrid error', error)}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Checkbox
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected && !allVisibleSelected}
                onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                aria-label="Select all visible records"
              />
            </Table.Th>
            {columns.map((column) => (
              <Table.Th
                key={column.key}
                style={{ 
                  cursor: column.sortable ? 'pointer' : 'default',
                  width: column.width
                }}
                onClick={column.sortable ? () => handleSort(column.key) : undefined}
              >
                <Group gap={4} justify="space-between">
                  <Text fw={600} size="sm">{column.label}</Text>
                  {column.sortable && renderSortIcon(column.key)}
                </Group>
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        
        <Table.Tbody>
          {data.map((record, index) => {
            const uniqueRowKey = generateRowKey(record, index);
            
            return (
              <Table.Tr
                key={uniqueRowKey}
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectionHook.isRecordSelected(record.sys_id) 
                    ? 'var(--mantine-color-blue-0)' : undefined
                }}
                onClick={(e) => {
                  if (e.detail === 1) {
                    handleRowClick(record);
                  } else if (e.detail === 2) {
                    handleRowDoubleClick(record);
                  }
                }}
              >
                <Table.Td>
                  <Checkbox
                    checked={selectionHook.isRecordSelected(record.sys_id)}
                    onChange={() => selectionHook.selectRecord(record, 'toggle')}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${record.name}`}
                  />
                </Table.Td>
                {columns.map((column) => (
                  <Table.Td key={column.key}>
                    {column.render(record)}
                  </Table.Td>
                ))}
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </GenericTable>

      {/* Pagination */}
      {paginationHook.totalPages > 1 && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Page {paginationHook.page} of {paginationHook.totalPages} • 
            Showing {paginationHook.startRecord} to {paginationHook.endRecord} of {paginationHook.totalRecords} records
            {filteringHook.insights.isFiltered && (
              <> (filtered from {filteringHook.insights.allRecordsCount} total)</>
            )}
          </Text>
          
          <Group gap="sm">
            <Button
              variant="subtle"
              size="xs"
              onClick={paginationHook.goToFirstPage}
              disabled={!paginationHook.canGoPrevious}
            >
              First
            </Button>
            
            <GenericPagination
              currentPage={paginationHook.page}
              totalPages={paginationHook.totalPages}
              onPageClick={paginationHook.setPage}
              onPrevious={paginationHook.previousPage}
              onNext={paginationHook.nextPage}
              canGoPrevious={paginationHook.canGoPrevious}
              canGoNext={paginationHook.canGoNext}
            />
            
            <Button
              variant="subtle"
              size="xs"
              onClick={paginationHook.goToLastPage}
              disabled={!paginationHook.canGoNext}
            >
              Last
            </Button>
          </Group>
        </Group>
      )}

      {/* Selection Summary */}
      {selectionHook.stats.hasSelection && (
        <Alert color="blue" variant="light">
          <Group justify="space-between">
            <Text size="sm">
              {selectionHook.stats.totalSelected} item{selectionHook.stats.totalSelected !== 1 ? 's' : ''} selected
              {selectionHook.stats.totalSelected > 0 && (
                <>
                  {' '}({selectionHook.stats.levelBreakdown.major || 0} major, {selectionHook.stats.levelBreakdown.minor || 0} minor, {selectionHook.stats.levelBreakdown.patch || 0} patch)
                </>
              )}
            </Text>
            <Group gap="sm">
              <GenericButton
                size="xs"
                variant="subtle"
                onClick={selectionHook.clearSelection}
              >
                Clear Selection
              </GenericButton>
              {selectionHook.availableBatchOperations.length > 0 && (
                <Text size="xs" c="blue">
                  {selectionHook.availableBatchOperations.length} action{selectionHook.availableBatchOperations.length !== 1 ? 's' : ''} available
                </Text>
              )}
            </Group>
          </Group>
        </Alert>
      )}
    </Stack>
  );
};

export default StoreUpdatesDataGrid;