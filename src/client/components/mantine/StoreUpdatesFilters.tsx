// src/client/components/mantine/StoreUpdatesFilters.tsx
// COMPLIANCE: Step 5 - Updated with nullish coalescing and refined types
// SIMPLIFIED: Only 2 filters - Batch Level and Published Date
// Following Architecture.md patterns with generic component integration
// FIXED: Removed hardcoded colors to match hamburger menu styling

import React, { useCallback, useState, useMemo } from 'react';
import {
  Group,
  MultiSelect,
  Button,
  ActionIcon,
  Tooltip,
  Badge,
  Stack,
  Text,
  Divider,
  Drawer,
  Title,
  ScrollArea
} from '@mantine/core';
import {
  IconFilter,
  IconFilterOff,
  IconX
} from '@tabler/icons-react';

import type { useStoreUpdatesFiltering } from '../../../hooks/useStoreUpdatesHybrid';
import type { StoreUpdate } from '../../../hooks/useStoreUpdatesHybrid';
import { logger } from '../../../monitoring/logger';
import { 
  getString, 
  getArray, 
  getInteger, 
  getBoolean,
  getNonEmptyString 
} from '../../../utils/typeRefinements';

interface StoreUpdatesFiltersProps {
  filteringHook: ReturnType<typeof useStoreUpdatesFiltering>;
  data: readonly StoreUpdate[]; // Refined: readonly array, never undefined
  compactMode: boolean; // Refined: never undefined, explicit default
}

// Refined type for filter options - no undefined values
interface FilterOption {
  readonly value: string;
  readonly label: string;
  readonly count?: number; // Optional count for enhanced UX
}

/**
 * SIMPLIFIED: Clean filter panel with refined types and nullish coalescing
 * 1. Batch Level: Multi-select with Major, Minor, Patch from actual data
 * 2. Published Date: Multi-select with unique published dates from data
 */
export const StoreUpdatesFilters: React.FC<StoreUpdatesFiltersProps> = ({
  filteringHook,
  data = [], // Default value using nullish coalescing
  compactMode = false // Default value using nullish coalescing
}) => {
  const [drawerOpened, setDrawerOpened] = useState(false);

  // Generate batch level options from actual data with nullish coalescing
  const batchLevelOptions = useMemo((): FilterOption[] => {
    // Use refined utility functions for safe data processing
    const dataArray = getArray(data, []);
    
    // Count occurrences for better UX
    const levelCounts = new Map<string, number>();
    
    dataArray.forEach(record => {
      const batchLevel = getString(record?.batch_level, '').trim();
      if (batchLevel) {
        levelCounts.set(batchLevel, (levelCounts.get(batchLevel) ?? 0) + 1);
      }
    });
    
    // Convert to options with counts using nullish coalescing
    return Array.from(levelCounts.entries()).map(([level, count]): FilterOption => ({
      value: level,
      label: `${getNonEmptyString(level, 'Unknown').charAt(0).toUpperCase()}${level.slice(1)} (${count})`,
      count
    })).sort((a, b) => getString(a.value, '').localeCompare(getString(b.value, '')));
  }, [data]);

  // Generate published date options from actual data with nullish coalescing
  const publishedDateOptions = useMemo((): FilterOption[] => {
    const dataArray = getArray(data, []);
    
    // Count occurrences and format dates consistently
    const dateCounts = new Map<string, number>();
    
    dataArray.forEach(record => {
      const dateStr = getString(record?.available_version_publish_date, '').trim();
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            const formatted = date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
            dateCounts.set(formatted, (dateCounts.get(formatted) ?? 0) + 1);
          }
        } catch {
          // If date parsing fails, use original string
          const fallback = getNonEmptyString(dateStr, 'Invalid Date');
          dateCounts.set(fallback, (dateCounts.get(fallback) ?? 0) + 1);
        }
      }
    });

    // Convert to options with counts using nullish coalescing
    return Array.from(dateCounts.entries())
      .map(([date, count]): FilterOption => ({
        value: date,
        label: `${date} (${count})`,
        count
      }))
      .sort((a, b) => {
        // Sort by date (newest first)
        try {
          const dateA = new Date(getString(a.value, ''));
          const dateB = new Date(getString(b.value, ''));
          return dateB.getTime() - dateA.getTime();
        } catch {
          return getString(a.value, '').localeCompare(getString(b.value, ''));
        }
      });
  }, [data]);

  // Count active filters with nullish coalescing
  const activeFilterCount = useMemo((): number => {
    const batchLevelCount = getArray(filteringHook.filters.batch_level, []).length;
    const publishedDateCount = getArray(filteringHook.filters.published_date, []).length;
    
    return (batchLevelCount > 0 ? 1 : 0) + (publishedDateCount > 0 ? 1 : 0);
  }, [filteringHook.filters.batch_level, filteringHook.filters.published_date]);

  // Safe filter removal handlers with nullish coalescing
  const removeBatchLevelFilter = useCallback((levelToRemove: string) => {
    const currentLevels = getArray(filteringHook.filters.batch_level, []);
    const newLevels = currentLevels.filter(level => getString(level, '') !== getString(levelToRemove, ''));
    filteringHook.setBatchLevelFilter(newLevels);
  }, [filteringHook]);

  const removePublishedDateFilter = useCallback((dateToRemove: string) => {
    const currentDates = getArray(filteringHook.filters.published_date, []);
    const newDates = currentDates.filter(date => getString(date, '') !== getString(dateToRemove, ''));
    filteringHook.setPublishedDateFilter(newDates);
  }, [filteringHook]);

  return (
    <>
      {/* Floating Filter Button Trigger */}
      <Group gap="xs">
        <Tooltip label="Open Filters Panel">
          <ActionIcon
            variant={activeFilterCount > 0 ? 'filled' : 'light'}
            size="lg"
            onClick={() => setDrawerOpened(true)}
            aria-label="Open filters panel"
          >
            <IconFilter size={18} />
          </ActionIcon>
        </Tooltip>

        {/* Active Filters Count Badge */}
        {activeFilterCount > 0 && (
          <Badge variant="filled" size="sm">
            {activeFilterCount} active
          </Badge>
        )}

        {/* Quick Clear All Filters */}
        {activeFilterCount > 0 && (
          <Tooltip label="Clear all filters">
            <ActionIcon
              variant="light"
              onClick={filteringHook.clearFilters}
              size="lg"
              aria-label="Clear all filters"
            >
              <IconFilterOff size={18} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      {/* Left-Side Filter Panel Drawer */}
      <Drawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        title={
          <Group gap="xs">
            <IconFilter size={20} />
            <Title order={4}>Filter Store Updates</Title>
          </Group>
        }
        position="left"
        size="md"
        overlayProps={{ backgroundOpacity: 0.5, blur: 4 }}
        transitionProps={{ transition: 'slide-right', duration: 200 }}
      >
        <ScrollArea h="calc(100vh - 120px)">
          <Stack gap="md" p="xs">

            {/* Batch Level Filter */}
            <div>
              <Text size="sm" fw={600} mb="xs">Batch Level</Text>
              <MultiSelect
                placeholder="Select batch levels"
                data={batchLevelOptions}
                value={getArray(filteringHook.filters.batch_level, [])}
                onChange={(value) => filteringHook.setBatchLevelFilter(getArray(value, []))}
                clearable
                searchable
                description={`${getInteger(batchLevelOptions.length, 0)} unique levels available`}
              />
            </div>

            {/* Published Date Filter */}
            <div>
              <Text size="sm" fw={600} mb="xs">Published Date</Text>
              <MultiSelect
                placeholder="Select published dates"
                data={publishedDateOptions}
                value={getArray(filteringHook.filters.published_date, [])}
                onChange={(value) => filteringHook.setPublishedDateFilter(getArray(value, []))}
                clearable
                searchable
                description={`${getInteger(publishedDateOptions.length, 0)} unique dates available`}
                maxDropdownHeight={200}
              />
            </div>

            <Divider />

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div>
                <Text size="sm" fw={600} mb="xs">Active Filters</Text>
                <Stack gap="xs">

                  {getArray(filteringHook.filters.batch_level, []).map((level: string) => {
                    const safeLevel = getString(level, 'Unknown');
                    return (
                      <Badge
                        key={safeLevel}
                        variant="light"
                        rightSection={
                          <ActionIcon
                            size="xs"
                            variant="transparent"
                            onClick={() => removeBatchLevelFilter(safeLevel)}
                            aria-label={`Remove ${safeLevel} filter`}
                          >
                            <IconX size={10} />
                          </ActionIcon>
                        }
                        style={{ justifyContent: 'space-between', width: '100%' }}
                      >
                        Batch: {safeLevel}
                      </Badge>
                    );
                  })}

                  {getArray(filteringHook.filters.published_date, []).map((date: string) => {
                    const safeDate = getString(date, 'Unknown Date');
                    return (
                      <Badge
                        key={safeDate}
                        variant="light"
                        color="green"
                        rightSection={
                          <ActionIcon
                            size="xs"
                            variant="transparent"
                            onClick={() => removePublishedDateFilter(safeDate)}
                            aria-label={`Remove ${safeDate} filter`}
                          >
                            <IconX size={10} />
                          </ActionIcon>
                        }
                        style={{ justifyContent: 'space-between', width: '100%' }}
                      >
                        Date: {safeDate}
                      </Badge>
                    );
                  })}
                </Stack>
              </div>
            )}

            {/* Filter Summary */}
            {activeFilterCount > 0 && (
              <>
                <Divider />
                <div>
                  <Text size="sm" fw={600} mb="xs">Filter Summary</Text>
                  <Text size="xs" c="dimmed">
                    {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''} • 
                    Showing {getInteger(filteringHook.insights.totalFiltered, 0)} of {getInteger(filteringHook.insights.allRecordsCount, 0)} records
                    {getBoolean(filteringHook.insights.isFiltered, false) && ' (filtered)'}
                  </Text>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <Divider />
            <Group justify="space-between">
              <Button
                variant="light"
                onClick={filteringHook.clearFilters}
                leftSection={<IconFilterOff size={16} />}
                size="sm"
              >
                Reset All Filters
              </Button>
              <Button
                variant="filled"
                onClick={() => setDrawerOpened(false)}
                size="sm"
              >
                Apply Filters
              </Button>
            </Group>

          </Stack>
        </ScrollArea>
      </Drawer>
    </>
  );
};

// Export with refined prop types
export default StoreUpdatesFilters;