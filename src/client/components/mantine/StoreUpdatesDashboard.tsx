// src/client/components/mantine/StoreUpdatesDashboard.tsx
// Hybrid statistics: ENHANCED - Using Zustand Store Dual-Source Statistics  
// Following Architecture.md Section 4.5: Dual-Source Hybrid Statistics Strategy
// Phase 1: Pattern 2A immediate + Phase 2: Pattern 2C calculated stats
// FIXED: React Error #185 - Removed infinite loop useEffect
// UI CLEANUP: PHASE 1-4 - Complete UI cleanup with enhanced search performance
// DARK MODE: Fixed header background to match component themes using native Mantine Card
// THEME: Added light/dark color scheme toggle
// SIMPLIFIED: Updated to pass data to simplified filters component
// THEME-COMPLIANT: Removed all style overrides - styling flows from theme only
// ADDED: Automatic data refresh after installation completion
// STATISTICS ALIGNMENT: FIXED - Text badges now properly aligned below numbers for consistent visual hierarchy
// SMART REFRESH: Implemented smart data refresh strategy - no backend refetch for filter clearing

import React, { useEffect, useMemo } from 'react';
import {
  Box,
  Stack,
  Title,
  Text,
  Group,
  Button,
  Card,
  Grid,
  Badge,
  ActionIcon,
  Tooltip,
  Alert,
  Loader,
  Center,
  useMantineColorScheme
} from '@mantine/core';
import {
  IconRefresh,
  IconSettings,
  IconDownload,
  IconFilter,
  IconAlertCircle,
  IconInfoCircle,
  IconChartBar,
  IconUser,
  IconClock,
  IconSun,
  IconMoon
} from '@tabler/icons-react';

import { 
  useStoreUpdatesHybrid,
  useStoreUpdatesFiltering,
  useStoreUpdatesPagination,
  useStoreUpdatesStats
} from '../../../hooks/useStoreUpdatesHybrid';
import { useStoreUpdatesStore } from '../../../state/storeUpdatesStore';
import { useStoreUpdatesSelection } from '../../../hooks/useStoreUpdatesSelection';
import { useNotifications } from '../../../hooks/useNotifications';
import { useEnhancedUserContext } from '../../../hooks/useUserContext'; // NEW: Use local store for admin role
import { logger, createLogContext } from '../../../monitoring/logger';

import { GenericButton } from '../../../components/mantine/Button';
import { GenericCard } from '../../../components/mantine/Card';

import { StoreUpdatesDataGrid } from './StoreUpdatesDataGrid';
import { StoreUpdatesFilters } from './StoreUpdatesFilters';
import { useStoreUpdatesActions } from './StoreUpdatesActions';
import { StatsGridSkeleton, DataGridSkeleton } from '../../../components/skeleton/SkeletonComponents';

interface StoreUpdatesDashboardProps {
  className?: string;
  showHeader?: boolean;
  compactMode?: boolean;
}

// Light/Dark Color Scheme Toggle Component
const ColorSchemeToggle: React.FC = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tooltip label={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
      <ActionIcon
        variant="light"
        size="lg"
        onClick={() => toggleColorScheme()}
        aria-label="Toggle color scheme"
      >
        {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
      </ActionIcon>
    </Tooltip>
  );
};

export const StoreUpdatesDashboard: React.FC<StoreUpdatesDashboardProps> = ({
  className,
  showHeader = true,
  compactMode = false
}) => {
  const { showSuccess, showError, showInfo } = useNotifications();

  const storeUpdatesData = useStoreUpdatesHybrid();
  const filteringHook = useStoreUpdatesFiltering();
  const paginationHook = useStoreUpdatesPagination();
  
  // NEW: Use store-based dual-source statistics (single source of truth)
  const statsHook = useStoreUpdatesStats();

  const selectionHook = useStoreUpdatesSelection(storeUpdatesData.data.rawServerData || []);

  // NEW: Use local store for user context with admin role
  const userContext = useEnhancedUserContext();

  // Get the markDataActionsPerformed action from the store
  const markDataActionsPerformed = useStoreUpdatesStore(state => state.actions.markDataActionsPerformed);

  // SMART REFRESH: Define callbacks before hook usage for stable dependencies
  const handleDataRefresh = React.useCallback(async () => {
    // BACKEND REFETCH: For data-changing operations (install, sync, manual refresh)
    try {
      await storeUpdatesData.refresh();
      
      // NEW: Mark that data-changing actions have been performed
      // This will switch statistics to Pattern 2C (API-calculated) since server-injected data is now stale
      markDataActionsPerformed();
      
      showSuccess({
        title: 'Data Refreshed',
        message: `Data refreshed successfully, ${userContext.firstName}! Filters and selections have been cleared.`
      });
      
      logger.info('Dashboard: Backend data refresh completed', createLogContext({
        action: 'backend-refetch',
        reason: 'data-changing-operation',
        userContext: userContext.firstName,
        switchedToPattern2C: true
      }));
    } catch (error) {
      showError({
        title: 'Refresh Failed',
        message: 'Failed to refresh store updates data.'
      });
      
      logger.error('Dashboard: Backend data refresh failed', error instanceof Error ? error : new Error(String(error)));
    }
  }, [storeUpdatesData.refresh, userContext.firstName, showSuccess, showError, markDataActionsPerformed]);

  const handleSmartClearState = React.useCallback(() => {
    // SMART CLEAR: Client-side only clearing (no backend refetch)
    logger.info('Dashboard: Smart client-side clearing initiated', createLogContext({
      action: 'smart-client-clear',
      reason: 'filter-selection-clear',
      backendRefetch: false
    }));
    
    // Clear selections
    selectionHook.clearSelection();
    
    // Clear all filters
    filteringHook.clearFilters();
    
    logger.info('Dashboard: Smart client-side clearing completed', createLogContext({
      selectionsCleared: true,
      filtersCleared: true,
      backendRefetch: false
    }));
  }, [selectionHook.clearSelection, filteringHook.clearFilters]);

  // FIXED: Initialize useStoreUpdatesActions at top level with stable dependencies
  // CORRECTED: Use rawServerData (all records) instead of paginated records for proper selection
  const storeUpdatesActions = useStoreUpdatesActions({
    selectionHook,
    recordCount: paginationHook.totalRecords || 0,
    compactMode,
    allRecords: storeUpdatesData.data.rawServerData || [], // Full dataset for proper "Install All" behavior
    onDataRefresh: handleDataRefresh,
    onClearState: handleSmartClearState, // FIXED: Pass the smart clear state function
    filteringHook
  });



  const handleExport = React.useCallback(() => {
    const exportCount = selectionHook.stats.totalSelected || paginationHook.totalRecords || 0;
    showInfo({
      title: 'Export Started',
      message: `Exporting ${exportCount} store updates...`
    });
  }, [selectionHook.stats.totalSelected, paginationHook.totalRecords, showInfo]);

  // ENHANCED: Dashboard Statistics from Zustand Store (Single Source of Truth)
  const dashboardStats = useMemo(() => {
    const activeStats = statsHook.data;
    
    logger.info('Dashboard using store-based dual-source statistics', createLogContext({
      pattern: 'dashboard-stats-consumption',
      source: activeStats.hybridMetadata?.source || 'unknown',
      isCalculatedPreferred: activeStats.hybridMetadata?.isCalculatedPreferred || false,
      hasSignificantDifference: activeStats.hybridMetadata?.hasSignificantDifference || false,
      hasStringCorruption: activeStats.hybridMetadata?.hasStringCorruption || false,
      totalUpdates: activeStats.totalMajorUpdates + activeStats.totalMinorUpdates + activeStats.totalPatchUpdates
    }));

    return {
      // Primary statistics from hybrid dual-source approach
      totalApplications: activeStats.totalApplications,
      totalMajorUpdates: activeStats.totalMajorUpdates,
      totalMinorUpdates: activeStats.totalMinorUpdates,
      totalPatchUpdates: activeStats.totalPatchUpdates,
      
      // Context-specific statistics - Use actual selection count instead of store
      criticalCount: activeStats.criticalCount,
      currentlyShown: activeStats.currentlyShown,
      selectedCount: selectionHook.stats.totalSelected, // FIXED: Direct from selection hook
      
      // Metadata for debugging and insights
      source: activeStats.hybridMetadata?.source || 'pattern-2a-immediate',
      isCalculatedPreferred: activeStats.hybridMetadata?.isCalculatedPreferred || false,
      hasSignificantDifference: activeStats.hybridMetadata?.hasSignificantDifference || false,
      hasStringCorruption: activeStats.hybridMetadata?.hasStringCorruption || false,
      timestamp: activeStats.hybridMetadata?.timestamp || Date.now(),
      
      // For debugging comparison
      immediateStats: activeStats.hybridMetadata?.immediateStats,
      calculatedStats: activeStats.hybridMetadata?.calculatedStats
    };
  }, [statsHook.data, selectionHook.stats.totalSelected]); // FIXED: Include selection count directly

  // PATTERN 2A: Show immediate UI with server-injected data, progressive enhancement
  if (storeUpdatesData.isError) {
    return (
      <Box py={compactMode ? 'xs' : 'sm'} w="100%" maw="100%">
        <Alert icon={<IconAlertCircle size={16} />} title="Failed to Load Store Updates" color="red">
          <Text mb="md">Unable to fetch store updates data: {storeUpdatesData.error}</Text>
          <Button leftSection={<IconRefresh size={16} />} onClick={handleDataRefresh} size="sm">
            Try Again
          </Button>
        </Alert>
      </Box>
    );
  }

  // PATTERN 2A: Show UI immediately with server-injected data, load table progressively
  const hasServerData = storeUpdatesData.data.rawServerData && storeUpdatesData.data.rawServerData.length > 0;
  const isInitialLoad = storeUpdatesData.isLoading && !hasServerData;

  return (
    <Box py={compactMode ? 'xs' : 'sm'} w="100%" maw="100%">
      <Stack gap="xs" w="100%">
        
        {showHeader && (
          <Card padding="md" radius="md" withBorder w="100%">
            <Group justify="space-between" align="center" w="100%">
              <div style={{ flex: 1 }}>
                <Group gap="xs" mb="xs">
                  <IconUser size={24} />
                  <Title order={1}>
                    Welcome back, {userContext.firstName}!
                  </Title>
                  {userContext.isAdmin && (
                    <Badge color="yellow" variant="filled" size="sm">Admin</Badge>
                  )}
                </Group>
                <Text size="lg" fw={500}>
                  ServiceNow Store Updates Manager
                </Text>
                <Text size="sm" c="dimmed" mt={4}>
                  Records: {storeUpdatesData.data.allRecordsCount} • 
                  Filtered: {paginationHook.totalRecords} • 
                  Page: {paginationHook.page}/{paginationHook.totalPages}
                  {logger.isDebugEnabled() && (
                    <> • Debug Mode • Stats Source: {dashboardStats.source}</>
                  )}
                </Text>
              </div>
              <Group gap="xs">
                <ColorSchemeToggle />
                <ActionIcon variant="light" size="lg" onClick={handleDataRefresh} aria-label="Refresh data">
                  <IconRefresh size={20} />
                </ActionIcon>
                <ActionIcon variant="light" size="lg" onClick={handleExport} aria-label="Export data">
                  <IconDownload size={20} />
                </ActionIcon>
              </Group>
            </Group>
          </Card>
        )}

        {/* PATTERN 2A: Show stats immediately, or skeleton during initial load */}
        {dashboardStats ? (
          <Grid gutter="xs" w="100%">
            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <GenericCard padding="sm" w="100%">
                <Group justify="space-between" w="100%">
                  <div style={{ flex: 1 }}>
                    <Text c="dimmed" size="sm" fw={600}>Total Applications</Text>
                    <Text size="xl" fw={700} c="inherit">
                      {dashboardStats.totalApplications}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      Available for updates
                    </Text>
                    {logger.isDebugEnabled() && (
                      <Text size="xs" c="dimmed" mt={2}>
                        Source: {dashboardStats.source === 'pattern-2a-immediate' ? '2A' : '2C'}
                      </Text>
                    )}
                  </div>
                  <IconChartBar size={32} />
                </Group>
              </GenericCard>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <GenericCard padding="sm" w="100%">
                <Group justify="space-between" w="100%">
                  <div style={{ flex: 1 }}>
                    <Text c="dimmed" size="sm" fw={600}>Critical Updates</Text>
                    <Text size="xl" fw={700} c="red">
                      {dashboardStats.criticalCount}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      Requiring attention
                    </Text>
                    {logger.isDebugEnabled() && dashboardStats.hasStringCorruption && (
                      <Badge size="xs" color="red" mt={2}>Corruption Detected</Badge>
                    )}
                  </div>
                  <IconAlertCircle size={32} />
                </Group>
              </GenericCard>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <GenericCard padding="sm" w="100%">
                <Group justify="space-between" w="100%">
                  <div style={{ flex: 1 }}>
                    <Text c="dimmed" size="sm" fw={600}>Selected Items</Text>
                    <Text size="xl" fw={700} c="teal">
                      {dashboardStats.selectedCount}
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      Ready for processing
                    </Text>
                    {logger.isDebugEnabled() && dashboardStats.hasSignificantDifference && (
                      <Badge size="xs" color="orange" mt={2}>Significant Diff</Badge>
                    )}
                  </div>
                  <Badge size="lg" circle color="teal">{dashboardStats.selectedCount}</Badge>
                </Group>
              </GenericCard>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <GenericCard padding="sm" w="100%">
                <Group justify="space-between" w="100%">
                  <div style={{ flex: 1 }}>
                    <Text c="dimmed" size="sm" fw={600}>Total Updates</Text>
                    <Text size="xl" fw={700} c="inherit">
                      {dashboardStats.totalMajorUpdates + dashboardStats.totalMinorUpdates + dashboardStats.totalPatchUpdates}
                    </Text>
                    <Group gap={2} mt={4}>
                      <Badge size="xs" color="red">{dashboardStats.totalMajorUpdates} Major</Badge>
                      <Badge size="xs" color="yellow">{dashboardStats.totalMinorUpdates} Minor</Badge>
                      <Badge size="xs" color="green">{dashboardStats.totalPatchUpdates} Patch</Badge>
                    </Group>
                    {logger.isDebugEnabled() && (
                      <Group gap={2} mt={2}>
                        <Badge 
                          size="xs" 
                          color={dashboardStats.isCalculatedPreferred ? 'blue' : 'gray'}
                          variant={dashboardStats.isCalculatedPreferred ? 'filled' : 'outline'}
                        >
                          {dashboardStats.source === 'pattern-2a-immediate' ? 'Pattern 2A' : 'Pattern 2C'}
                        </Badge>
                        {dashboardStats.isCalculatedPreferred && (
                          <Badge size="xs" color="green">Calculated</Badge>
                        )}
                      </Group>
                    )}
                  </div>
                  <IconInfoCircle size={32} />
                </Group>
              </GenericCard>
            </Grid.Col>
          </Grid>
        ) : (
          <StatsGridSkeleton />
        )}

        <Card padding="lg" radius="md" withBorder w="100%">
          <Group justify="space-between" mb="xs" w="100%">
            <Group gap="xs">
              {/* LAYOUT FIX: Filters with filter-aligned action icons positioned together */}
              <StoreUpdatesFilters 
                filteringHook={filteringHook} 
                data={storeUpdatesData.data.rawServerData || []} // Pass raw server data for unique values
                compactMode={compactMode} 
              />
              
              {/* LAYOUT FIX: Action icons positioned next to filter icon with consistent styling */}
              {storeUpdatesActions.FilterAlignedIcons()}
            </Group>
            
            {/* LAYOUT FIX: Main actions component on the right */}
            {storeUpdatesActions.ActionsComponent()}
          </Group>
        </Card>

        <StoreUpdatesDataGrid
          data={storeUpdatesData.data.records || []}
          filteringHook={filteringHook}
          paginationHook={paginationHook}
          selectionHook={selectionHook}
          compactMode={compactMode}
          onDataRefresh={handleDataRefresh} // Backend refetch for data-changing operations
          onClearState={handleSmartClearState} // Smart client-side clearing only
        />

        {/* Debug information for development */}
        {logger.isDebugEnabled() && (
          <Alert icon={<IconInfoCircle size={16} />} color="indigo" variant="light">
            <Stack gap="xs">
              <Text size="sm" fw={600}>Dual-Source Statistics Debug Info:</Text>
              <Group gap="xs">
                <Text size="xs">Source: {dashboardStats.source}</Text>
                <Text size="xs">Calculated Preferred: {dashboardStats.isCalculatedPreferred ? 'Yes' : 'No'}</Text>
                <Text size="xs">Has Difference: {dashboardStats.hasSignificantDifference ? 'Yes' : 'No'}</Text>
                <Text size="xs">Has Corruption: {dashboardStats.hasStringCorruption ? 'Yes' : 'No'}</Text>
                <Text size="xs">Admin Role: {userContext.isAdmin ? 'Yes' : 'No'}</Text>
              </Group>
              {dashboardStats.immediateStats && dashboardStats.calculatedStats && (
                <Group gap="xs">
                  <Text size="xs">
                    Pattern 2A: {dashboardStats.immediateStats.totalMajorUpdates + dashboardStats.immediateStats.totalMinorUpdates + dashboardStats.immediateStats.totalPatchUpdates} total
                  </Text>
                  <Text size="xs">
                    Pattern 2C: {dashboardStats.calculatedStats.totalMajorUpdates + dashboardStats.calculatedStats.totalMinorUpdates + dashboardStats.calculatedStats.totalPatchUpdates} total
                  </Text>
                </Group>
              )}
            </Stack>
          </Alert>
        )}
      </Stack>
    </Box>
  );
};

export default StoreUpdatesDashboard;