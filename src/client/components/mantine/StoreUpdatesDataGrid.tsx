// src/client/components/mantine/StoreUpdatesDataGrid.tsx
// UPDATED: Added expandable rows functionality with sys_store_app details
// COLUMNS: Application Name (from application.name), Latest (actual version), Published Date, Description, Level
// EXPANDABLE: Click rows to show application details with Application Manager link
// Following Architecture.md patterns with generic component integration
// PHASE 5: Enhanced search performance with minimum 3 characters and improved input state
// COLORS: Fixed theme-agnostic selected and expanded row colors using consistent blue across all themes
// HOVER: Removed hover effect from expanded row details
// BUTTONS: Standardized all button color/hover properties to match Refresh button variant="light"
// SMART CLEAR: Header checkbox implements smart clearing strategy (no backend refetch for filter clearing)

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
  Loader,
  Box,
  Anchor,
  Divider,
  Collapse,
  useMantineTheme,
  useMantineColorScheme,
  alpha,
  rgba
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
  IconX,
  IconChevronDown,
  IconChevronRight as IconChevronRightCollapsed,
  IconExternalLink
} from '@tabler/icons-react';

// Import types and hooks
import type { StoreUpdate } from '../../../hooks/useStoreUpdatesHybrid';
import type { useStoreUpdatesFiltering, useStoreUpdatesPagination } from '../../../hooks/useStoreUpdatesHybrid';
import type { useStoreUpdatesSelection } from '../../../hooks/useStoreUpdatesSelection';
import { logger, createLogContext } from '../../../monitoring/logger';
import { useThemeManagement } from '../../../hooks/useThemeManagement';

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
  onDataRefresh?: () => Promise<void>; // For data-changing operations only
  onClearState?: () => void; // NEW: For smart client-side clearing only
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

// Helper function to build Application Manager URL
const buildAppManagerUrl = (sourceAppId?: string, version?: string): string => {
  if (!sourceAppId) return '#';
  const safeVersion = version || 'latest';
  return `./now/app-manager/home/app/id/${sourceAppId}/v/${safeVersion}/details`;
};

/**
 * Expandable Row Details Component
 * Shows sys_store_app information with layout: Version (top-left), Install Date (top-right), 
 * Description (multi-line below), and Application Manager link
 * UPDATED: Uses consistent blue background across all themes
 */
interface ExpandableRowDetailsProps {
  record: StoreUpdate;
}

const ExpandableRowDetails: React.FC<ExpandableRowDetailsProps> = ({ record }) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  
  // Use consistent blue background across all themes (same as selected rows)
  const expandedBackgroundColor = colorScheme === 'dark' 
    ? alpha(theme.colors.blue[8], 0.15)
    : alpha(theme.colors.blue[1], 0.3);

  const appManagerUrl = buildAppManagerUrl(
    record.available_version_source_app_id, 
    record.available_version_version
  );

  return (
    <Box p="md" style={{ backgroundColor: expandedBackgroundColor, borderRadius: '4px' }}>
      <Stack gap="sm">
        {/* Top row: Version (left) and Install Date (right) */}
        <Group justify="space-between" align="flex-start">
          <Stack gap={2}>
            <Text size="xs" fw={500} c="dimmed">Installed Version</Text>
            <Text size="sm" fw={600}>
              {record.application_version || 'N/A'}
            </Text>
          </Stack>
          
          <Stack gap={2} align="flex-end">
            <Text size="xs" fw={500} c="dimmed">Install Date</Text>
            <Text size="sm" fw={600}>
              {formatDate(record.application_install_date)}
            </Text>
          </Stack>
        </Group>

        {/* Description section */}
        <Stack gap={2}>
          <Text size="xs" fw={500} c="dimmed">Description</Text>
          <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
            {record.application_short_description || 'No description available'}
          </Text>
        </Stack>

        {/* Application Manager link */}
        {record.available_version_source_app_id && (
          <Box>
            <Divider my="xs" />
            <Anchor
              href={appManagerUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              fw={500}
              style={{ textDecoration: 'none' }}
            >
              <Group gap={4} align="center">
                <IconExternalLink size={14} />
                <Text>View in Application Manager</Text>
              </Group>
            </Anchor>
          </Box>
        )}
      </Stack>
    </Box>
  );
};

/**
 * Generic pagination component that can be reused across the application
 * UPDATED: Standardized button styling to variant="light"
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
        variant={1 === currentPage ? "outline" : "light"}
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
        variant={i === currentPage ? "outline" : "light"}
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
        variant={totalPages === currentPage ? "outline" : "light"}
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
        variant="light"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        leftSection={<IconChevronLeft size={14} />}
      >
        Previous
      </Button>
      
      {pages}
      
      <Button
        size="sm"
        variant="light"
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
 * Enhanced Search Input Component with controlled state and minimum character requirement
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
  const [inputValue, setInputValue] = useState(currentFilter);
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Sync with external filter changes (like clear filters)
  useEffect(() => {
    if (currentFilter !== inputValue) {
      setInputValue(currentFilter);
    }
  }, [currentFilter]);

  // Enhanced debounced search with minimum character requirement
  const debouncedSearch = useCallback(
    React.useMemo(() => {
      let timeoutId: NodeJS.Timeout;
      
      return (value: string) => {
        clearTimeout(timeoutId);
        setIsSearchActive(true);
        
        timeoutId = setTimeout(() => {
          if (value.length >= minCharacters || value.length === 0) {
            onSearch(value);
            logger.info('Enhanced search triggered', createLogContext({
              searchTerm: value,
              searchLength: value.length,
              minRequired: minCharacters,
              searchType: value.length === 0 ? 'clear' : 'filter'
            }));
          } else if (value.length > 0) {
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

  // Dynamic placeholder based on input state
  const getPlaceholder = () => {
    if (inputValue.length > 0 && inputValue.length < minCharacters) {
      return `Type ${minCharacters - inputValue.length} more character${minCharacters - inputValue.length !== 1 ? 's' : ''}...`;
    }
    return placeholder;
  };

  // Dynamic input styling based on state
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
 * Helper function to get consistent row background colors across all themes
 * Uses consistent blue colors for selected rows (same as MantineTheme)
 */
const getRowBackgroundColor = (
  isSelected: boolean,
  isExpanded: boolean,
  theme: any,
  colorScheme: string
) => {
  if (!isSelected && !isExpanded) {
    return undefined; // Standard state - transparent
  }

  // Use consistent blue across all themes (same as MantineTheme selected row color)
  if (colorScheme === 'dark') {
    return alpha(theme.colors.blue[8], 0.15);
  } else {
    return alpha(theme.colors.blue[1], 0.3);
  }
};

/**
 * UPDATED DataGrid component with EXPANDABLE ROWS:
 * 1. Application Name (using application_name from dot-walked application.name)
 * 2. Latest (actual version number from available_version.version) 
 * 3. Published Date
 * 4. Description
 * 5. Level (latest version level)
 * 
 * EXPANDABLE: Click rows to show sys_store_app details below the selected row
 * COLORS: Consistent blue theme-agnostic colors for selected and expanded rows
 * BUTTONS: Standardized to variant="light" styling
 * SMART CLEAR: Implements smart clearing strategy - no backend refetch for filter clearing
 */
export const StoreUpdatesDataGrid: React.FC<StoreUpdatesDataGridProps> = ({
  filteringHook,
  paginationHook,
  selectionHook,
  data,
  compactMode = false,
  onRowClick,
  onRowDoubleClick,
  onDataRefresh, // For data-changing operations (install, sync)
  onClearState   // NEW: For smart client-side clearing only
}) => {
  // EXPANDABLE ROWS STATE: Track which row is expanded (only one at a time)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Theme and color scheme for consistent styling
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const { currentTheme } = useThemeManagement();
  
  // FIXED: Check if Vercel theme is active for custom hover colors
  const isVercelTheme = currentTheme === 'vercel';

  // Create unique row key generator for duplicate sys_ids
  const generateRowKey = useCallback((record: StoreUpdate, index: number) => {
    return `${record.sys_id}-${index}-${record.level}-${record.batch_level}`;
  }, []);

  // SIMPLIFIED columns configuration - using dot-walked application.name, no string manipulation
  // UPDATED: Removed "Installed" column, increased Application Name and Description widths
  const columns: ColumnConfig[] = useMemo(() => [
    {
      key: 'application_name',
      label: 'Application Name',
      sortable: true,
      width: compactMode ? '300px' : '350px',
      render: (record) => (
        <Group gap={4} align="center">
          <ActionIcon
            size="xs"
            variant="subtle"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand(record.sys_id);
            }}
          >
            {expandedRowId === record.sys_id ? (
              <IconChevronDown size={12} />
            ) : (
              <IconChevronRightCollapsed size={12} />
            )}
          </ActionIcon>
          <Text fw={600} size="sm" lineClamp={1}>
            {record.application_name || record.name}
          </Text>
        </Group>
      )
    },
    {
      key: 'available_version_version',
      label: 'Latest',
      sortable: true,
      width: '100px',
      render: (record) => (
        <Text size="sm" c="blue" fw={500}>
          {record.available_version_version || 'N/A'}
        </Text>
      )
    },
    {
      key: 'available_version_publish_date',
      label: 'Published Date',
      sortable: true,
      width: '120px',
      render: (record) => (
        <Text size="sm" c="dimmed">
          {formatDate(record.available_version_publish_date)}
        </Text>
      )
    },
    {
      key: 'available_version_short_description',
      label: 'Description',
      sortable: false,
      width: compactMode ? '200px' : '250px',
      render: (record) => (
        <Tooltip 
          label={record.available_version_short_description || 'No description available'}
          multiline
          maw={300}
          position="top-start"
        >
          <Text size="sm" c="dimmed" lineClamp={1}>
            {record.available_version_short_description || 'No description available'}
          </Text>
        </Tooltip>
      )
    },
    {
      key: 'latest_version_level',
      label: 'Level',
      sortable: true,
      width: '80px',
      render: (record) => (
        <Badge
          color={
            record.latest_version_level === 'major' ? 'red' :
            record.latest_version_level === 'minor' ? 'yellow' : 'green'
          }
          variant="filled"
          size="sm"
        >
          {record.latest_version_level || 'unknown'}
        </Badge>
      )
    }
  ], [compactMode, expandedRowId]);

  // Handle expand/collapse toggle
  const handleToggleExpand = useCallback((recordId: string) => {
    setExpandedRowId(prevId => prevId === recordId ? null : recordId);
    
    logger.trackUserAction('toggle-expand-row', createLogContext({
      recordId,
      expanded: expandedRowId !== recordId,
      previouslyExpanded: expandedRowId
    }));
  }, [expandedRowId]);

  // Handle sorting
  const handleSort = useCallback((columnKey: string) => {
    filteringHook.updateSorting(columnKey);
  }, [filteringHook]);

  // UPDATED: Handle row interactions with expand functionality
  const handleRowClick = useCallback((record: StoreUpdate) => {
    if (onRowClick) {
      onRowClick(record);
    } else {
      // Default behavior: toggle expand
      handleToggleExpand(record.sys_id);
    }
  }, [onRowClick, handleToggleExpand]);

  const handleRowDoubleClick = useCallback((record: StoreUpdate) => {
    if (onRowDoubleClick) {
      onRowDoubleClick(record);
    } else {
      selectionHook.selectRecord(record, 'toggle');
    }
  }, [onRowDoubleClick, selectionHook]);

  // Handle actions (kept for legacy compatibility)
  const handleViewDetails = useCallback((record: StoreUpdate) => {
    logger.trackUserAction('view-details', createLogContext({
      recordId: record.sys_id,
      appName: record.application_name || record.name
    }));
  }, []);

  const handleDownloadUpdate = useCallback((record: StoreUpdate) => {
    logger.trackUserAction('download-update', createLogContext({
      recordId: record.sys_id,
      appName: record.application_name || record.name
    }));
  }, []);

  // SMART CLEAR: Header checkbox with intelligent clearing strategy
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      selectionHook.selectAllVisible();
      
      logger.trackUserAction('select-all-toggle', createLogContext({
        selectAll: checked,
        visibleRecords: data.length,
        action: 'select-all'
      }));
    } else {
      // SMART CLEAR: Header checkbox deselect only clears client-side state (no backend refetch)
      logger.info('Header checkbox deselect: Starting smart client-side clearing', createLogContext({
        selectAll: checked,
        visibleRecords: data.length,
        action: 'smart-client-clear',
        reason: 'header-checkbox-deselect',
        backendRefetch: false
      }));
      
      // Clear selections
      selectionHook.clearSelection();
      
      // Smart clear state (filters + client-side reset only)
      if (onClearState) {
        onClearState(); // Clear filters + selections client-side only
      }
      
      logger.trackUserAction('select-all-toggle', createLogContext({
        selectAll: checked,
        visibleRecords: data.length,
        action: 'smart-client-clear-completed',
        backendRefetch: false
      }));
    }
  }, [selectionHook, onClearState, data.length]);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: string | null) => {
    if (newPageSize) {
      const size = parseInt(newPageSize, 10);
      paginationHook.setPageSize(size);
    }
  }, [paginationHook]);

  // Enhanced search handler with performance logging
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

  // Enhanced search status for better UX
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

  // SMART REFRESH: Empty state with intelligent refresh button
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
                <Button 
                  variant="light" 
                  onClick={() => {
                    // Smart clear: client-side only
                    if (onClearState) {
                      onClearState();
                    } else {
                      filteringHook.clearFilters();
                    }
                  }}
                >
                  Clear Filters
                </Button>
              )}
              <Button
                variant="light"
                leftSection={<IconRefresh size={16} />}
                onClick={() => {
                  if (onDataRefresh) {
                    // Smart refresh: backend refetch for data-changing operations
                    onDataRefresh();
                  } else {
                    logger.info('Refresh clicked from empty state (no callback provided)');
                  }
                }}
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
      {/* Enhanced Search and Controls */}
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

      {/* Data Table with Expandable Rows */}
      <GenericTable
        data={data}
        loading={false}
        highlightOnHover
        onError={(error) => logger.error('DataGrid error', error)}
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Tooltip label="Select all visible records (deselect to clear filters - smart clear, no server reload)">
                <Checkbox
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected && !allVisibleSelected}
                  onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                  aria-label="Select all visible records (deselect to clear filters - smart clear, no server reload)"
                />
              </Tooltip>
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
            const isExpanded = expandedRowId === record.sys_id;
            const isSelected = selectionHook.isRecordSelected(record.sys_id);
            
            return (
              <React.Fragment key={uniqueRowKey}>
                {/* Main Data Row */}
                <Table.Tr
                  style={{
                    cursor: 'pointer',
                    backgroundColor: getRowBackgroundColor(isSelected, isExpanded, theme, colorScheme)
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
                      checked={isSelected}
                      onChange={() => selectionHook.selectRecord(record, 'toggle')}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${record.application_name || record.name}`}
                    />
                  </Table.Td>
                  {columns.map((column) => (
                    <Table.Td key={column.key}>
                      {column.render(record)}
                    </Table.Td>
                  ))}
                </Table.Tr>

                {/* Expandable Details Row - NO HOVER EFFECT */}
                {isExpanded && (
                  <Table.Tr style={{ 
                    backgroundColor: 'transparent',
                    cursor: 'default'
                  }}>
                    <Table.Td colSpan={columns.length + 1} p={0} style={{ 
                      backgroundColor: 'transparent',
                      cursor: 'default'
                    }}>
                      <Collapse in={isExpanded}>
                        <ExpandableRowDetails record={record} />
                      </Collapse>
                    </Table.Td>
                  </Table.Tr>
                )}
              </React.Fragment>
            );
          })}
        </Table.Tbody>
      </GenericTable>

      {/* Pagination - UPDATED: Standardized button styling */}
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
              variant="light"
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
              variant="light"
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
                variant="light"
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
      {/* FIXED: Custom CSS for Vercel theme hover effects (30% lighter) */}
      {isVercelTheme && (
        <style>{`
          /* Table row hover effects for Vercel theme - 30% lighter */
          [data-mantine-color-scheme="light"] .mantine-Table-tr:hover {
            background-color: rgba(120, 120, 120, 0.08) !important;
          }
          [data-mantine-color-scheme="dark"] .mantine-Table-tr:hover {
            background-color: rgba(180, 180, 180, 0.12) !important;
          }
          
          /* Menu item hover effects for Vercel theme - 30% lighter */
          [data-mantine-color-scheme="light"] .mantine-Menu-item:hover {
            background-color: rgba(100, 100, 100, 0.06) !important;
          }
          [data-mantine-color-scheme="dark"] .mantine-Menu-item:hover {
            background-color: rgba(160, 160, 160, 0.1) !important;
          }
        `}</style>
      )}
    </Stack>
  );
};

export default StoreUpdatesDataGrid;