// src/client/components/mantine/ApplicationManagerActions.tsx
// Application Manager Actions component for ServiceNow Application Manager API
// Reuses action patterns from StoreUpdatesActions but with Application Manager API integration
// ARCHITECTURE COMPLIANT: Follows core-principles.md separation of concerns

import React, { useCallback, useMemo } from 'react';
import {
  Group,
  Button,
  Menu,
  ActionIcon,
  Badge,
  Text,
  Tooltip,
  Modal,
  Stack,
  Alert,
  Divider,
  Progress,
  useMantineColorScheme
} from '@mantine/core';
import {
  IconDownload,
  IconRefresh,
  IconEye,
  IconPlayerPlay,
  IconAlertTriangle,
  IconCheck,
  IconDots,
  IconSettings,
  IconTool
} from '@tabler/icons-react';

import { useApplicationInstallation } from '../../../hooks/useApplicationManager';
import type { AppManagerTabContext } from '../../../services/applicationManagerService';
import { logger } from '../../../monitoring/logger';
import { GenericButton } from '../../../components/mantine/Button';

interface ApplicationManagerActionsProps {
  selectionHook: {
    selection: {
      selectedIds: string[];
      isSelected: (id: string) => boolean;
      selectAll: () => void;
      clearSelection: () => void;
      toggleSelection: (id: string) => void;
    };
    stats: {
      totalSelected: number;
      hasSelection: boolean;
      totalItems: number;
      allSelected: boolean;
      levelBreakdown: {
        major: number;
        minor: number;
        patch: number;
      };
    };
    data: any[];
  };
  recordCount: number;
  tabContext: AppManagerTabContext;
  compactMode?: boolean;
}

export const ApplicationManagerActions: React.FC<ApplicationManagerActionsProps> = ({
  selectionHook,
  recordCount,
  tabContext,
  compactMode = false
}) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  // Application Manager installation hooks
  const { 
    install, 
    update, 
    isInstalling, 
    isUpdating,
    installError,
    updateError 
  } = useApplicationInstallation();

  // Get actions based on tab context
  const availableActions = useMemo(() => {
    const actions: Array<{
      id: string;
      label: string;
      icon: string;
      color: string;
      description: string;
      enabled: boolean;
      requiresConfirmation: boolean;
    }> = [];

    switch (tabContext) {
      case 'available_for_you':
        actions.push({
          id: 'install-selected',
          label: 'Install Selected',
          icon: 'IconDownload',
          color: 'blue',
          description: 'Install selected applications from the store',
          enabled: true,
          requiresConfirmation: true
        });
        break;
        
      case 'installed':
        actions.push({
          id: 'view-details',
          label: 'View Details',
          icon: 'IconEye',
          color: 'gray',
          description: 'View details of selected applications',
          enabled: true,
          requiresConfirmation: false
        });
        break;
        
      case 'updates':
        actions.push({
          id: 'update-selected',
          label: 'Update Selected',
          icon: 'IconRefresh',
          color: 'green',
          description: 'Update selected applications to latest versions',
          enabled: true,
          requiresConfirmation: true
        });
        break;
    }

    return actions;
  }, [tabContext]);

  // Handle batch actions
  const handleBatchAction = useCallback(async (actionId: string) => {
    const selectedIds = selectionHook.selection.selectedIds;
    const selectedApps = selectionHook.data.filter(app => 
      selectedIds.includes(app.sys_id || app.app_id)
    );

    if (selectedIds.length === 0) {
      logger.warn('No items selected for batch action', { actionId, tabContext });
      return;
    }

    logger.info('Application Manager batch action initiated', {
      actionId,
      tabContext,
      selectedCount: selectedIds.length,
      selectedIds: selectedIds.slice(0, 5) // Log first 5 IDs only
    });

    try {
      switch (actionId) {
        case 'install-selected':
          // Install each selected application
          for (const app of selectedApps) {
            install({
              appId: app.app_id,
              version: app.version || app.latest_version,
              options: { loadDemoData: false }
            });
          }
          break;

        case 'update-selected':
          // Update each selected application
          for (const app of selectedApps) {
            update({
              appId: app.app_id,
              version: app.latest_version || app.version,
              options: { loadDemoData: false }
            });
          }
          break;

        case 'view-details':
          // For now, just log the selected apps
          logger.info('Viewing details for selected applications', {
            selectedApps: selectedApps.map(app => ({
              id: app.app_id,
              name: app.name,
              version: app.version
            }))
          });
          break;

        default:
          logger.warn('Unknown batch action', { actionId, tabContext });
      }
    } catch (error) {
      logger.error('Batch action failed',
        error instanceof Error ? error : new Error(String(error)),
        { actionId, tabContext, selectedCount: selectedIds.length }
      );
    }
  }, [selectionHook, tabContext, install, update]);

  // Get action icon
  const getActionIcon = useCallback((iconName: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      IconDownload: <IconDownload size={16} />,
      IconRefresh: <IconRefresh size={16} />,
      IconEye: <IconEye size={16} />,
      IconSettings: <IconSettings size={16} />,
      IconTool: <IconTool size={16} />,
    };
    return icons[iconName] || <IconPlayerPlay size={16} />;
  }, []);

  // Selection summary component
  const SelectionSummary = () => {
    if (!selectionHook.stats.hasSelection) {
      return (
        <Text size="sm" c="dimmed">
          Select items to perform actions
        </Text>
      );
    }

    return (
      <Group gap="xs">
        <Badge variant="filled" color="blue">
          {selectionHook.stats.totalSelected} selected
        </Badge>
        
        {/* Show context-specific info */}
        {tabContext === 'updates' && selectionHook.stats.totalSelected > 0 && (
          <Badge size="sm" color="orange" variant="dot">
            {selectionHook.stats.totalSelected} update{selectionHook.stats.totalSelected !== 1 ? 's' : ''} available
          </Badge>
        )}
      </Group>
    );
  };

  // Check if actions should be enabled
  const hasSelection = selectionHook.stats.hasSelection;
  const isProcessing = isInstalling || isUpdating;

  // Get appropriate styling for disabled buttons
  const getDisabledButtonStyle = (baseColor: string) => {
    if (hasSelection && !isProcessing) {
      return {
        variant: 'filled' as const,
        color: baseColor,
        style: {}
      };
    }
    
    return {
      variant: 'outline' as const,
      color: isDark ? 'gray' : baseColor,
      style: {
        borderColor: isDark ? 'var(--mantine-color-gray-6)' : `var(--mantine-color-${baseColor}-3)`,
        color: isDark ? 'var(--mantine-color-gray-5)' : `var(--mantine-color-${baseColor}-6)`,
        backgroundColor: isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)'
      }
    };
  };

  return (
    <Stack gap={compactMode ? 'xs' : 'sm'}>
      {/* Selection Summary */}
      <SelectionSummary />

      {/* Actions */}
      <Group gap="md" justify="space-between">
        {/* Primary Actions */}
        <Group gap="sm">
          {availableActions.map((action) => {
            const buttonStyle = getDisabledButtonStyle(action.color);
            
            return (
              <Tooltip 
                key={action.id}
                label={hasSelection ? action.description : 'Select items first'}
                disabled={hasSelection}
              >
                <GenericButton
                  size={compactMode ? 'sm' : 'md'}
                  {...buttonStyle}
                  leftSection={getActionIcon(action.icon)}
                  onClick={() => handleBatchAction(action.id)}
                  disabled={!hasSelection || isProcessing || !action.enabled}
                  loading={isProcessing && (
                    (action.id === 'install-selected' && isInstalling) ||
                    (action.id === 'update-selected' && isUpdating)
                  )}
                >
                  {action.label}
                </GenericButton>
              </Tooltip>
            );
          })}

          {/* Additional Actions Menu */}
          {hasSelection && (
            <Menu shadow="md" width={280}>
              <Menu.Target>
                <ActionIcon
                  size={compactMode ? 'sm' : 'lg'}
                  variant="light"
                  disabled={isProcessing}
                >
                  <IconDots size={16} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Additional Actions</Menu.Label>
                <Menu.Item 
                  leftSection={<IconEye size={14} />}
                  onClick={() => handleBatchAction('view-details')}
                >
                  View Selected Details
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item disabled>
                  <Text size="sm" c="dimmed">More actions coming soon...</Text>
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        {/* Selection Management */}
        {hasSelection && (
          <Group gap="sm">
            <Tooltip label="Clear selection">
              <ActionIcon
                variant="light"
                onClick={selectionHook.selection.clearSelection}
                size={compactMode ? 'sm' : 'md'}
                disabled={isProcessing}
              >
                <IconCheck size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
        )}
      </Group>

      {/* Processing Status */}
      {isProcessing && (
        <Alert color="blue" variant="light">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                {isInstalling ? 'Installing Applications...' : 'Updating Applications...'}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              Processing {selectionHook.stats.totalSelected} selected application{selectionHook.stats.totalSelected !== 1 ? 's' : ''}
            </Text>
          </Stack>
        </Alert>
      )}

      {/* Error Display */}
      {(installError || updateError) && (
        <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
          <Text fw={500} mb="xs">Operation Failed</Text>
          <Text size="sm">
            {installError?.message || updateError?.message || 'An error occurred during the operation'}
          </Text>
        </Alert>
      )}

      {/* Tab Context Info */}
      <Group justify="space-between" align="center">
        <Text size="xs" c="dimmed">
          {tabContext === 'available_for_you' && 'Applications available for installation'}
          {tabContext === 'installed' && 'Currently installed applications'}
          {tabContext === 'updates' && 'Applications with available updates'}
        </Text>
        
        <Text size="xs" c="dimmed">
          {recordCount} item{recordCount !== 1 ? 's' : ''} total
        </Text>
      </Group>
    </Stack>
  );
};

export default ApplicationManagerActions;