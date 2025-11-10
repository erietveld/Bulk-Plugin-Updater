// src/client/components/mantine/ApplicationManagerDashboard.tsx
// Application Manager Dashboard using ServiceNow's internal Application Manager API
// Reuses existing components with new data source
// ARCHITECTURE COMPLIANT: Follows core-principles.md separation of concerns

import React, { useMemo, useState } from 'react';
import {
  Container,
  Stack,
  Title,
  Text,
  Group,
  Badge,
  Tabs,
  Card,
  Alert,
  LoadingOverlay,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconApps,
  IconDownload,
  IconRefresh,
  IconSettings,
  IconAlertCircle,
  IconInfoCircle
} from '@tabler/icons-react';

import { useApplicationManagerData, useApplicationManagerConfig } from '../../../hooks/useApplicationManager';
import { StoreUpdatesDataGrid } from './StoreUpdatesDataGrid';
import { StoreUpdatesFilters } from './StoreUpdatesFilters';
import { ApplicationManagerActions } from './ApplicationManagerActions';
import { logger, createLogContext } from '../../../monitoring/logger';

// Transform Application Manager data to match existing component interface
const transformAppManagerDataForGrid = (apps: any[]) => {
  return apps.map(app => ({
    sys_id: app.sys_id || app.app_id,
    app_id: app.app_id,
    name: app.name,
    version: app.version,
    latest_version: app.latest_version || app.version,
    description: app.description || '',
    publisher: app.publisher || 'ServiceNow',
    category: app.category || 'Application',
    status: app.status || app.installation_status || 'available',
    update_available: app.update_available || false,
    size: app.size || 'Unknown',
    last_updated: app.last_updated || app.sys_updated_on,
    // Additional fields for compatibility
    display_name: app.name,
    short_description: app.description || '',
    u_category: app.category || 'Application',
    u_publisher: app.publisher || 'ServiceNow',
    u_version: app.version,
    u_latest_version: app.latest_version || app.version,
    u_update_available: app.update_available || false
  }));
};

// Selection hook adapter to work with existing components
const useAppManagerSelectionAdapter = (appManagerHook: ReturnType<typeof useApplicationManagerData>) => {
  const transformedData = useMemo(() => {
    if (!appManagerHook.data?.result) return [];
    return transformAppManagerDataForGrid(appManagerHook.data.result);
  }, [appManagerHook.data]);

  return {
    // Data
    data: transformedData,
    isLoading: appManagerHook.isLoading,
    error: appManagerHook.error,
    
    // Selection interface compatible with existing components
    selection: {
      selectedIds: appManagerHook.selectionStats.selectedIds,
      isSelected: (id: string) => appManagerHook.selectedItems.has(id),
      selectAll: appManagerHook.selectAll,
      clearSelection: appManagerHook.clearSelection,
      toggleSelection: appManagerHook.toggleSelection
    },
    
    // Stats interface compatible with existing components
    stats: {
      totalSelected: appManagerHook.selectionStats.totalSelected,
      hasSelection: appManagerHook.selectionStats.hasSelection,
      totalItems: appManagerHook.selectionStats.totalItems,
      allSelected: appManagerHook.selectionStats.allSelected,
      // Add level breakdown for compatibility (mock data since AM API doesn't provide this)
      levelBreakdown: {
        major: Math.floor(appManagerHook.selectionStats.totalSelected * 0.3),
        minor: Math.floor(appManagerHook.selectionStats.totalSelected * 0.5),
        patch: Math.floor(appManagerHook.selectionStats.totalSelected * 0.2)
      }
    },
    
    // Available batch operations (mock for now)
    availableBatchOperations: ['install', 'update', 'details'],
    
    // Refresh function
    refetch: appManagerHook.refetch
  };
};

export const ApplicationManagerDashboard: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Application Manager data hook
  const appManagerData = useApplicationManagerData();
  
  // Configuration hook
  const configQuery = useApplicationManagerConfig();
  
  // Transform data for existing components
  const selectionHook = useAppManagerSelectionAdapter(appManagerData);

  // Handle tab changes
  const handleTabChange = (tabValue: string | null) => {
    if (tabValue && ['available_for_you', 'installed', 'updates'].includes(tabValue)) {
      appManagerData.setActiveTab(tabValue as any);
      appManagerData.clearSelection();
      
      logger.info('Application Manager tab changed', createLogContext({
        previousTab: appManagerData.activeTab,
        newTab: tabValue
      }));
    }
  };

  // Handle search
  const handleSearchChange = (searchTerm: string) => {
    appManagerData.setSearchKey(searchTerm);
    
    logger.info('Application Manager search changed', createLogContext({
      searchTerm,
      tab: appManagerData.activeTab
    }));
  };

  // Handle refresh
  const handleRefresh = () => {
    appManagerData.refetch();
    setRefreshKey(prev => prev + 1);
    
    logger.info('Application Manager data refreshed', createLogContext({
      tab: appManagerData.activeTab,
      searchKey: appManagerData.searchKey
    }));
  };

  // Tab statistics
  const tabStats = useMemo(() => {
    const availableCount = appManagerData.queries.available.data?.result.length || 0;
    const installedCount = appManagerData.queries.installed.data?.result.length || 0;
    const updatesCount = appManagerData.queries.updates.data?.result.length || 0;

    return {
      available_for_you: availableCount,
      installed: installedCount,
      updates: updatesCount
    };
  }, [
    appManagerData.queries.available.data,
    appManagerData.queries.installed.data,
    appManagerData.queries.updates.data
  ]);

  // Tab configuration
  const tabs = [
    {
      value: 'available_for_you',
      label: 'Available',
      icon: <IconApps size={16} />,
      count: tabStats.available_for_you,
      color: 'blue'
    },
    {
      value: 'installed',
      label: 'Installed', 
      icon: <IconDownload size={16} />,
      count: tabStats.installed,
      color: 'green'
    },
    {
      value: 'updates',
      label: 'Updates',
      icon: <IconRefresh size={16} />,
      count: tabStats.updates,
      color: 'orange'
    }
  ];

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1} size="h2" mb="xs">
              Application Manager
            </Title>
            <Text c="dimmed" size="sm">
              Manage applications using ServiceNow's internal Application Manager API
            </Text>
          </div>
          
          <Group gap="sm">
            <Tooltip label="Refresh data">
              <ActionIcon
                variant="light"
                onClick={handleRefresh}
                loading={appManagerData.isLoading}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
            
            {configQuery.data && (
              <Tooltip label="Configuration loaded">
                <ActionIcon variant="light" color="green">
                  <IconSettings size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        {/* Configuration Status */}
        {configQuery.error && (
          <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light">
            <Text size="sm" fw={500} mb="xs">Configuration Warning</Text>
            <Text size="sm">
              Could not load Application Manager configuration. Some features may not work correctly.
            </Text>
          </Alert>
        )}

        {/* API Info */}
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text size="sm" fw={500} mb="xs">Application Manager API Integration</Text>
          <Text size="sm">
            This dashboard uses ServiceNow's internal Application Manager API 
            (<code>/api/sn_appclient/appmanager/*</code>) to provide comprehensive application lifecycle management.
          </Text>
        </Alert>

        {/* Tabs */}
        <Tabs value={appManagerData.activeTab} onChange={handleTabChange}>
          <Tabs.List>
            {tabs.map(tab => (
              <Tabs.Tab
                key={tab.value}
                value={tab.value}
                leftSection={tab.icon}
                rightSection={
                  tab.count > 0 ? (
                    <Badge size="sm" variant="light" color={tab.color}>
                      {tab.count}
                    </Badge>
                  ) : null
                }
              >
                {tab.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {tabs.map(tab => (
            <Tabs.Panel key={tab.value} value={tab.value} pt="lg">
              <Card withBorder>
                <LoadingOverlay visible={appManagerData.isLoading} />
                
                <Stack gap="md">
                  {/* Filters - Reusing existing component */}
                  <StoreUpdatesFilters
                    searchTerm={appManagerData.searchKey}
                    onSearchChange={handleSearchChange}
                    totalRecords={selectionHook.stats.totalItems}
                    // Disable filters not supported by Application Manager API
                    showCategoryFilter={false}
                    showStatusFilter={false}
                    showDateFilter={false}
                  />

                  {/* Actions - Using new Application Manager Actions component */}
                  <ApplicationManagerActions
                    selectionHook={selectionHook}
                    recordCount={selectionHook.stats.totalItems}
                    tabContext={appManagerData.activeTab}
                  />

                  {/* Data Grid - Reusing existing component */}
                  <StoreUpdatesDataGrid
                    key={`${appManagerData.activeTab}-${refreshKey}`}
                    data={selectionHook.data}
                    isLoading={appManagerData.isLoading}
                    error={appManagerData.error}
                    selectionHook={selectionHook}
                    onRefresh={handleRefresh}
                    // Customize columns for Application Manager
                    visibleColumns={[
                      'selection',
                      'name', 
                      'version',
                      'publisher',
                      'category',
                      'status',
                      'actions'
                    ]}
                  />
                </Stack>
              </Card>
            </Tabs.Panel>
          ))}
        </Tabs>

        {/* Debug Info (only in debug mode) */}
        {typeof window !== 'undefined' && window.location.search.includes('sn_debug=true') && (
          <Card withBorder bg="gray.0" style={{ fontSize: '12px' }}>
            <Text fw={500} mb="xs">Debug Information</Text>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify({
                activeTab: appManagerData.activeTab,
                searchKey: appManagerData.searchKey,
                selectedCount: appManagerData.selectionStats.totalSelected,
                dataCount: appManagerData.data?.result.length || 0,
                isLoading: appManagerData.isLoading,
                hasConfig: !!configQuery.data,
                hasError: !!appManagerData.error
              }, null, 2)}
            </pre>
          </Card>
        )}
      </Stack>
    </Container>
  );
};

export default ApplicationManagerDashboard;