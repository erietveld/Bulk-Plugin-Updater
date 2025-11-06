// src/client/components/mantine/StoreUpdatesFilters.tsx
// SIMPLIFIED: Only 2 filters - Batch Level and Published Date
// Following Architecture.md patterns with generic component integration
// UPDATED: Simplified filter panel with only Batch Level and Published Date filters
// UPDATED: Dynamic options from actual data

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

interface StoreUpdatesFiltersProps {
  filteringHook: ReturnType<typeof useStoreUpdatesFiltering>;
  data: StoreUpdate[]; // Data to generate filter options from
  compactMode?: boolean;
}

/**
 * SIMPLIFIED: Clean filter panel with only 2 filters
 * 1. Batch Level: Multi-select with Major, Minor, Patch from actual data
 * 2. Published Date: Multi-select with unique published dates from data
 */
export const StoreUpdatesFilters: React.FC<StoreUpdatesFiltersProps> = ({
  filteringHook,
  data,
  compactMode = false
}) => {
  const [drawerOpened, setDrawerOpened] = useState(false);

  // Generate batch level options from actual data
  const batchLevelOptions = useMemo(() => {
    const uniqueBatchLevels = [...new Set(data.map(record => record.batch_level).filter(Boolean))];
    return uniqueBatchLevels.map(level => ({
      value: level,
      label: level.charAt(0).toUpperCase() + level.slice(1) // Capitalize first letter
    }));
  }, [data]);

  // Generate published date options from actual data
  const publishedDateOptions = useMemo(() => {
    const uniqueDates = [...new Set(
      data.map(record => record.available_version_publish_date)
        .filter(Boolean) // Remove null/undefined values
        .map(dateStr => {
          // Format dates consistently
          try {
            const date = new Date(dateStr!); // FIXED: Added non-null assertion
            return date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          } catch {
            return dateStr; // Return original if parsing fails
          }
        })
    )].sort(); // Sort dates

    return uniqueDates.map(date => ({
      value: date!,
      label: date!
    }));
  }, [data]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filteringHook.filters.batch_level.length > 0) count++;
    if (filteringHook.filters.published_date && filteringHook.filters.published_date.length > 0) count++;
    return count;
  }, [filteringHook.filters.batch_level, filteringHook.filters.published_date]);

  return (
    <>
      {/* Floating Filter Button Trigger */}
      <Group gap="xs">
        <Tooltip label="Open Filters Panel">
          <ActionIcon
            variant={activeFilterCount > 0 ? 'filled' : 'light'}
            color="blue"
            size="lg"
            onClick={() => setDrawerOpened(true)}
          >
            <IconFilter size={18} />
          </ActionIcon>
        </Tooltip>

        {/* Active Filters Count Badge */}
        {activeFilterCount > 0 && (
          <Badge variant="filled" color="blue" size="sm">
            {activeFilterCount} active
          </Badge>
        )}

        {/* Quick Clear All Filters */}
        {activeFilterCount > 0 && (
          <Tooltip label="Clear all filters">
            <ActionIcon
              variant="light"
              color="gray"
              onClick={filteringHook.clearFilters}
              size="lg"
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
                value={filteringHook.filters.batch_level}
                onChange={(value) => filteringHook.setBatchLevelFilter(value)}
                clearable
                searchable
                description={`${batchLevelOptions.length} unique levels available`}
              />
            </div>

            {/* Published Date Filter */}
            <div>
              <Text size="sm" fw={600} mb="xs">Published Date</Text>
              <MultiSelect
                placeholder="Select published dates"
                data={publishedDateOptions}
                value={filteringHook.filters.published_date || []}
                onChange={(value) => filteringHook.setPublishedDateFilter(value)}
                clearable
                searchable
                description={`${publishedDateOptions.length} unique dates available`}
                maxDropdownHeight={200}
              />
            </div>

            <Divider />

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div>
                <Text size="sm" fw={600} mb="xs">Active Filters</Text>
                <Stack gap="xs">

                  {filteringHook.filters.batch_level.map((level: string) => (
                    <Badge
                      key={level}
                      variant="light"
                      color="blue"
                      rightSection={
                        <ActionIcon
                          size="xs"
                          variant="transparent"
                          onClick={() => {
                            const newLevels = filteringHook.filters.batch_level.filter((l: string) => l !== level);
                            filteringHook.setBatchLevelFilter(newLevels);
                          }}
                        >
                          <IconX size={10} />
                        </ActionIcon>
                      }
                      style={{ justifyContent: 'space-between', width: '100%' }}
                    >
                      Batch: {level}
                    </Badge>
                  ))}

                  {(filteringHook.filters.published_date || []).map((date: string) => (
                    <Badge
                      key={date}
                      variant="light"
                      color="green"
                      rightSection={
                        <ActionIcon
                          size="xs"
                          variant="transparent"
                          onClick={() => {
                            const currentDates = filteringHook.filters.published_date || [];
                            const newDates = currentDates.filter((d: string) => d !== date);
                            filteringHook.setPublishedDateFilter(newDates);
                          }}
                        >
                          <IconX size={10} />
                        </ActionIcon>
                      }
                      style={{ justifyContent: 'space-between', width: '100%' }}
                    >
                      Date: {date}
                    </Badge>
                  ))}
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
                    Showing {filteringHook.insights.totalFiltered} of {filteringHook.insights.allRecordsCount} records
                    {filteringHook.insights.isFiltered && ' (filtered)'}
                  </Text>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <Divider />
            <Group justify="space-between">
              <Button
                variant="light"
                color="gray"
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

export default StoreUpdatesFilters;