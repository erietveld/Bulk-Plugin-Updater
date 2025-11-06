// src/client/components/mantine/StoreUpdatesActions.tsx
// PHASE 4: Show action buttons initially (greyed out), activate on selection
// DARK MODE: Fixed greyed button visibility for both light and dark themes
// Batch actions component for Store Updates
// Following Architecture.md patterns with comprehensive action handling

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
  IconClock,
  IconFileExport,
  IconEye,
  IconPlayerPlay,
  IconAlertTriangle,
  IconCheck,
  IconDots,
  IconUrgent,
  IconBandage
} from '@tabler/icons-react';

import type { useStoreUpdatesSelection } from '../../../hooks/useStoreUpdatesSelection';
import { logger } from '../../../monitoring/logger';
import { GenericButton } from '../../../components/mantine/Button';

interface StoreUpdatesActionsProps {
  selectionHook: ReturnType<typeof useStoreUpdatesSelection>;
  recordCount: number;
  compactMode?: boolean;
  onBatchAction?: (actionId: string, selectedIds: string[]) => void;
}

/**
 * PHASE 4: Always show action buttons, greyed out initially, activated on selection
 * DARK MODE: Enhanced button visibility with proper color variants for both themes
 * Batch actions component for Store Updates
 * Provides comprehensive batch operations based on selection
 */
export const StoreUpdatesActions: React.FC<StoreUpdatesActionsProps> = ({
  selectionHook,
  recordCount,
  compactMode = false,
  onBatchAction
}) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  // State for confirmation modals
  const [confirmationModal, setConfirmationModal] = React.useState<{
    open: boolean;
    actionId: string;
    actionLabel: string;
    selectedCount: number;
  }>({
    open: false,
    actionId: '',
    actionLabel: '',
    selectedCount: 0
  });

  // State for batch operation progress
  const [batchProgress, setBatchProgress] = React.useState<{
    active: boolean;
    actionId: string;
    progress: number;
    message: string;
  }>({
    active: false,
    actionId: '',
    progress: 0,
    message: ''
  });

  // Handle batch action execution
  const handleBatchAction = useCallback(async (actionId: string) => {
    const action = selectionHook.availableBatchOperations.find(op => op.id === actionId);
    if (!action) {
      const errorMessage = `Batch action not found: ${actionId}`;
      logger.error(errorMessage, new Error(errorMessage));
      return;
    }

    const selectedIds = selectionHook.selection.selectedIds;
    
    logger.info('Batch action initiated', {
      actionId,
      actionLabel: action.label,
      selectedCount: selectedIds.length,
      selectedIds
    });

    // Show confirmation modal for actions that require it
    if (action.requiresConfirmation) {
      setConfirmationModal({
        open: true,
        actionId,
        actionLabel: action.label,
        selectedCount: selectedIds.length
      });
      return;
    }

    // Execute action directly
    await executeBatchAction(actionId, selectedIds);
  }, [selectionHook]);

  // Execute batch action
  const executeBatchAction = useCallback(async (actionId: string, selectedIds: string[]) => {
    setBatchProgress({
      active: true,
      actionId,
      progress: 0,
      message: 'Initializing batch operation...'
    });

    try {
      // Simulate batch operation progress
      const progressSteps = [
        'Validating selection...',
        'Preparing batch operation...',
        'Processing updates...',
        'Finalizing changes...',
        'Complete!'
      ];

      for (let i = 0; i < progressSteps.length; i++) {
        setBatchProgress(prev => ({
          ...prev,
          progress: ((i + 1) / progressSteps.length) * 100,
          message: progressSteps[i] || 'Processing...'
        }));

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Call external handler if provided
      if (onBatchAction) {
        await onBatchAction(actionId, selectedIds);
      }

      logger.info('Batch action completed successfully', {
        actionId,
        selectedCount: selectedIds.length
      });

      // Clear selection after successful batch operation
      selectionHook.clearSelection();

    } catch (error) {
      const errorMessage = `Batch action failed: ${actionId}`;
      const batchError = error instanceof Error ? error : new Error(errorMessage);
      
      logger.error('Batch action failed', batchError, {
        actionId,
        selectedCount: selectedIds.length,
        errorDetails: error
      });
    } finally {
      setBatchProgress({
        active: false,
        actionId: '',
        progress: 0,
        message: ''
      });
    }
  }, [onBatchAction, selectionHook]);

  // Handle confirmation modal confirmation
  const handleConfirmAction = useCallback(async () => {
    const { actionId } = confirmationModal;
    const selectedIds = selectionHook.selection.selectedIds;
    
    setConfirmationModal(prev => ({ ...prev, open: false }));
    await executeBatchAction(actionId, selectedIds);
  }, [confirmationModal, selectionHook.selection.selectedIds, executeBatchAction]);

  // Primary batch actions (most common) - Always show these
  const primaryActions = useMemo(() => {
    const defaultActions = [
      {
        id: 'install-all',
        label: 'Install All',
        icon: 'IconDownload',
        color: 'blue',
        applicableCount: selectionHook.stats.totalSelected,
        requiresConfirmation: true,
        description: 'Install all selected updates'
      },
      {
        id: 'install-critical',
        label: 'Install Critical',
        icon: 'IconUrgent',
        color: 'red',
        applicableCount: selectionHook.stats.totalSelected,
        requiresConfirmation: true,
        description: 'Install only critical updates'
      },
      {
        id: 'install-patches',
        label: 'Install Patches',
        icon: 'IconBandage',
        color: 'green',
        applicableCount: selectionHook.stats.totalSelected,
        requiresConfirmation: false,
        description: 'Install patch updates only'
      }
    ];

    // If we have selection hook operations, use those, otherwise show defaults
    const availableActions = selectionHook.availableBatchOperations.length > 0 
      ? selectionHook.availableBatchOperations 
      : defaultActions;

    return availableActions.filter(action =>
      ['install-all', 'install-critical', 'install-patches'].includes(action.id)
    );
  }, [selectionHook.availableBatchOperations, selectionHook.stats.totalSelected]);

  // Secondary batch actions (less common) - Only show when selections exist
  const secondaryActions = useMemo(() => {
    return selectionHook.availableBatchOperations.filter(action =>
      !['install-all', 'install-critical', 'install-patches'].includes(action.id)
    );
  }, [selectionHook.availableBatchOperations]);

  // Get action icon
  const getActionIcon = useCallback((iconName: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      IconDownload: <IconDownload size={16} />,
      IconUrgent: <IconUrgent size={16} />,
      IconBandage: <IconBandage size={16} />,
      IconClock: <IconClock size={16} />,
      IconFileExport: <IconFileExport size={16} />,
      IconEye: <IconEye size={16} />,
    };
    return icons[iconName] || <IconPlayerPlay size={16} />;
  }, []);

  // Selection summary component - PHASE 4: Simplified messaging
  const SelectionSummary = () => {
    if (!selectionHook.stats.hasSelection) {
      return (
        <Text size="sm" c="dimmed">
          Select items to perform bulk actions
        </Text>
      );
    }

    const { levelBreakdown } = selectionHook.stats;

    return (
      <Group gap="xs">
        <Badge variant="filled" color="blue">
          {selectionHook.stats.totalSelected} selected
        </Badge>
        {(levelBreakdown.major || 0) > 0 && (
          <Badge size="sm" color="red" variant="dot">
            {levelBreakdown.major || 0} major
          </Badge>
        )}
        {(levelBreakdown.minor || 0) > 0 && (
          <Badge size="sm" color="yellow" variant="dot">
            {levelBreakdown.minor || 0} minor
          </Badge>
        )}
        {(levelBreakdown.patch || 0) > 0 && (
          <Badge size="sm" color="green" variant="dot">
            {levelBreakdown.patch || 0} patch
          </Badge>
        )}
      </Group>
    );
  };

  // PHASE 4: Check if actions should be enabled
  const hasSelection = selectionHook.stats.hasSelection;

  // DARK MODE: Get appropriate styling for disabled buttons
  const getDisabledButtonStyle = (baseColor: string) => {
    if (hasSelection) {
      return {
        variant: 'filled' as const,
        color: baseColor,
        style: {}
      };
    }
    
    // DARK MODE: Use outline variant with subtle color for better visibility
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
    <>
      <Stack gap={compactMode ? 'xs' : 'sm'}>
        {/* Selection Summary */}
        <SelectionSummary />

        {/* Actions */}
        <Group gap="md" justify="space-between">
          {/* Primary Actions - DARK MODE: Enhanced visibility for disabled state */}
          <Group gap="sm">
            {primaryActions.map((action) => {
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
                    disabled={!hasSelection || batchProgress.active}
                    loading={batchProgress.active && batchProgress.actionId === action.id}
                  >
                    {action.label}
                    {hasSelection && action.applicableCount !== selectionHook.stats.totalSelected && (
                      <Badge size="xs" color="white" ml="xs">
                        {action.applicableCount}
                      </Badge>
                    )}
                  </GenericButton>
                </Tooltip>
              );
            })}

            {/* Secondary Actions Menu - PHASE 4: Only show when selections exist */}
            {hasSelection && secondaryActions.length > 0 && (
              <Menu shadow="md" width={280}>
                <Menu.Target>
                  <ActionIcon
                    size={compactMode ? 'sm' : 'lg'}
                    variant="light"
                    color="gray"
                    disabled={batchProgress.active}
                  >
                    <IconDots size={16} />
                  </ActionIcon>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Additional Actions</Menu.Label>
                  {secondaryActions.map((action) => (
                    <Menu.Item
                      key={action.id}
                      leftSection={getActionIcon(action.icon)}
                      onClick={() => handleBatchAction(action.id)}
                    >
                      <div>
                        <Text fw={500}>{action.label}</Text>
                        <Text size="xs" c="dimmed">{action.description}</Text>
                        {action.applicableCount !== selectionHook.stats.totalSelected && (
                          <Badge size="xs" color={action.color} mt={2}>
                            {action.applicableCount} applicable
                          </Badge>
                        )}
                      </div>
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>

          {/* Selection Actions - Only show when selection exists */}
          {hasSelection && (
            <Group gap="sm">
              <Tooltip label="Clear selection">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={selectionHook.clearSelection}
                  size={compactMode ? 'sm' : 'md'}
                >
                  <IconCheck size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </Group>

        {/* Batch Progress */}
        {batchProgress.active && (
          <Alert color="blue" variant="light">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Batch Operation in Progress</Text>
                <Text size="xs" c="dimmed">{Math.round(batchProgress.progress)}%</Text>
              </Group>
              <Progress value={batchProgress.progress} size="sm" animated />
              <Text size="xs" c="dimmed">{batchProgress.message}</Text>
            </Stack>
          </Alert>
        )}
      </Stack>

      {/* Confirmation Modal */}
      <Modal
        opened={confirmationModal.open}
        onClose={() => setConfirmationModal(prev => ({ ...prev, open: false }))}
        title="Confirm Batch Action"
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconAlertTriangle size={16} />} color="yellow" variant="light">
            <Text fw={500} mb="xs">
              Are you sure you want to {confirmationModal.actionLabel.toLowerCase()}?
            </Text>
            <Text size="sm">
              This action will affect {confirmationModal.selectedCount} selected update{confirmationModal.selectedCount !== 1 ? 's' : ''}.
            </Text>
          </Alert>

          {/* Selection breakdown - FIXED: Safe null access with fallbacks */}
          <div>
            <Text size="sm" fw={500} mb="xs">Selection Summary:</Text>
            <Group gap="xs">
              {Object.entries(selectionHook.stats.levelBreakdown).map(([level, count]) => (
                <Badge
                  key={level}
                  color={level === 'major' ? 'red' : level === 'minor' ? 'yellow' : 'green'}
                  variant="light"
                >
                  {Number(count || 0)} {level}
                </Badge>
              ))}
            </Group>
          </div>

          <Divider />

          <Group justify="flex-end" gap="sm">
            <Button
              variant="subtle"
              onClick={() => setConfirmationModal(prev => ({ ...prev, open: false }))}
            >
              Cancel
            </Button>
            <Button
              color="blue"
              onClick={handleConfirmAction}
              loading={batchProgress.active}
            >
              Confirm Action
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
};

export default StoreUpdatesActions;