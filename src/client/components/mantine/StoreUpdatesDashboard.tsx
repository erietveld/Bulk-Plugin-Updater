// src/client/components/mantine/StoreUpdatesDashboard.tsx
// Hybrid statistics: ENHANCED - Using Zustand Store Dual-Source Statistics  
// Following Architecture.md Section 4.5: Dual-Source Hybrid Statistics Strategy
// Phase 1: Pattern 2A immediate + Phase 2: Pattern 2C calculated stats
// FIXED: React Error #185 - Removed infinite loop useEffect
// UI CLEANUP: PHASE 1-4 - Complete UI cleanup with enhanced search performance
// DARK MODE: Fixed header background to match component themes using native Mantine Card
// THEME: Added light/dark color scheme toggle
// SIMPLIFIED: Updated to pass data to simplified filters component

import React, { useEffect, useMemo } from 'react';
import {
  Container,
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
import { useStoreUpdatesSelection } from '../../../hooks/useStoreUpdatesSelection';
import { useNotifications } from '../../../hooks/useNotifications';
import { logger, createLogContext } from '../../../monitoring/logger';

import { GenericButton } from '../../../components/mantine/Button';
import { GenericCard } from '../../../components/mantine/Card';

import { StoreUpdatesDataGrid } from './StoreUpdatesDataGrid';
import { StoreUpdatesFilters } from './StoreUpdatesFilters';
import { StoreUpdatesActions } from './StoreUpdatesActions';
import { DebugPanel } from '../debug/DebugPanel';

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
        color="gray"
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
  const { addNotification } = useNotifications();

  const storeUpdatesData = useStoreUpdatesHybrid();
  const filteringHook = useStoreUpdatesFiltering();
  const paginationHook = useStoreUpdatesPagination();
  
  // NEW: Use store-based dual-source statistics (single source of truth)
  const statsHook = useStoreUpdatesStats();

  const selectionHook = useStoreUpdatesSelection(storeUpdatesData.data.records || []);

  // Get Pattern 2A user context and quickStats (still available for fallback)
  const userContext = storeUpdatesData.userContext || { 
    firstName: 'User', 
    displayName: 'User', 
    isAdmin: false 
  };

  const handleRefresh = React.useCallback(async () => {
    try {
      await storeUpdatesData.refresh();
      addNotification({
        type: 'success',
        message: `Data refreshed successfully, ${userContext.firstName}!`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to refresh store updates data.'
      });
    }
  }, [storeUpdatesData.refresh, userContext.firstName, addNotification]);

  const handleExport = React.useCallback(() => {
    const exportCount = selectionHook.stats.totalSelected || paginationHook.totalRecords || 0;
    addNotification({
      type: 'info',
      message: `Exporting ${exportCount} store updates...`
    });
  }, [selectionHook.stats.totalSelected, paginationHook.totalRecords, addNotification]);

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

  if (storeUpdatesData.isError) {
    return (
      <Container py={compactMode ? 'xs' : 'sm'}>
        <Alert icon={<IconAlertCircle size={16} />} title="Failed to Load Store Updates" color="red">
          <Text mb="md">Unable to fetch store updates data: {storeUpdatesData.error}</Text>
          <Button leftSection={<IconRefresh size={16} />} onClick={handleRefresh} size="sm">
            Try Again
          </Button>
        </Alert>
        <DebugPanel />
      </Container>
    );
  }

  if (storeUpdatesData.isLoading) {
    return (
      <Container py={compactMode ? 'xs' : 'sm'}>
        <Center h={400}>
          <Stack align="center" gap="xs">
            <Loader size="lg" />
            <Text c="dimmed">Loading store updates for {userContext.firstName}...</Text>
          </Stack>
        </Center>
        <DebugPanel />
      </Container>
    );
  }

  return (
    <Container py={compactMode ? 'xs' : 'sm'} size="xl">
      <Stack gap="xs">
        
        {showHeader && (
          <Card padding="md" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <div>
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
                <ActionIcon variant="light" color="blue" size="lg" onClick={handleRefresh}>
                  <IconRefresh size={20} />
                </ActionIcon>
                <ActionIcon variant="light" color="blue" size="lg" onClick={handleExport}>
                  <IconDownload size={20} />
                </ActionIcon>
              </Group>
            </Group>
          </Card>
        )}

        {dashboardStats && (
          <Grid gutter="xs">
            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <GenericCard padding="sm">
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" size="sm" fw={600}>Total Applications</Text>
                    <Text size="xl" fw={700}>{dashboardStats.totalApplications}</Text>
                    <Text size="xs" c="dimmed">Available for updates</Text>
                    {logger.isDebugEnabled() && (
                      <Text size="xs" c="dimmed" mt={2}>
                        Source: {dashboardStats.source === 'pattern-2a-immediate' ? '2A' : '2C'}
                      </Text>
                    )}
                  </div>
                  <IconChartBar size={32} style={{ color: 'var(--mantine-color-blue-6)' }} />
                </Group>
              </GenericCard>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <GenericCard padding="sm">
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" size="sm" fw={600}>Critical Updates</Text>
                    <Text size="xl" fw={700} c="red">{dashboardStats.criticalCount}</Text>
                    <Text size="xs" c="dimmed">Requiring attention</Text>
                    {logger.isDebugEnabled() && dashboardStats.hasStringCorruption && (
                      <Badge size="xs" color="red" mt={2}>Corruption Detected</Badge>
                    )}
                  </div>
                  <IconAlertCircle size={32} style={{ color: 'var(--mantine-color-red-6)' }} />
                </Group>
              </GenericCard>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <GenericCard padding="sm">
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" size="sm" fw={600}>Selected Items</Text>
                    <Text size="xl" fw={700} c="teal">{dashboardStats.selectedCount}</Text>
                    <Text size="xs" c="dimmed">Ready for processing</Text>
                    {logger.isDebugEnabled() && dashboardStats.hasSignificantDifference && (
                      <Badge size="xs" color="orange" mt={2}>Significant Diff</Badge>
                    )}
                  </div>
                  <Badge size="lg" circle color="teal">{dashboardStats.selectedCount}</Badge>
                </Group>
              </GenericCard>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
              <GenericCard padding="sm">
                <Group justify="space-between">
                  <div>
                    <Text c="dimmed" size="sm" fw={600}>Total Updates</Text>
                    <Text size="xl" fw={700}>
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
                  <IconInfoCircle size={32} style={{ color: 'var(--mantine-color-gray-6)' }} />
                </Group>
              </GenericCard>
            </Grid.Col>
          </Grid>
        )}

        <Card padding="xs">
          <Group justify="space-between" mb="xs">
            <Group gap="xs">
              {/* UPDATED: Pass data to simplified filters component */}
              <StoreUpdatesFilters 
                filteringHook={filteringHook} 
                data={storeUpdatesData.data.rawServerData || []} // Pass raw server data for unique values
                compactMode={compactMode} 
              />
            </Group>
            <StoreUpdatesActions 
              selectionHook={selectionHook} 
              recordCount={paginationHook.totalRecords || 0} 
              compactMode={compactMode} 
            />
          </Group>
        </Card>

        <StoreUpdatesDataGrid
          data={storeUpdatesData.data.records || []}
          filteringHook={filteringHook}
          paginationHook={paginationHook}
          selectionHook={selectionHook}
          compactMode={compactMode}
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

      <DebugPanel />
    </Container>
  );
};

export default StoreUpdatesDashboard;