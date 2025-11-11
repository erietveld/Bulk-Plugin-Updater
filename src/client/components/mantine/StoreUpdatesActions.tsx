// src/client/components/mantine/StoreUpdatesActions.tsx
// ARCHITECTURE COMPLIANT: Follows core-principles.md separation of concerns
// React Components: Handle UI rendering only
// Custom Hooks: Manage business logic and local state (useInstallUpdates)
// Zustand Stores: Handle global state (useBatchProgressStore)
// ServiceNow Services: Handle API communication (apiService.installUpdates)
// TanStack Query: Data fetching with proper caching (useMutation)
// ENHANCED: Added Install Minor button and proper admin role requirements
// SMART REFRESH: Differentiate between client-side clearing and data-changing operations
// LAYOUT FIX: Moved action icons to top-right, always visible, no layout shifts
// SYNC FIX: Fixed sync operation to follow same refresh pattern as install operations

import React, { useCallback, useMemo, useState } from 'react';
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
  useMantineColorScheme,
  Box
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
  IconBandage,
  IconInfoCircle,
  IconSelectAll,
  IconRefresh
} from '@tabler/icons-react';

import { useQueryClient } from '@tanstack/react-query'; // NEW: For sync cache invalidation
import type { useStoreUpdatesSelection } from '../../../hooks/useStoreUpdatesSelection';
import type { useStoreUpdatesFiltering, StoreUpdate } from '../../../hooks/useStoreUpdatesHybrid';
import { useInstallUpdates } from '../../../hooks/useInstallUpdates';
import { useBatchProgressStore } from '../../../stores/batchProgressStore';
import { useEnhancedUserContext } from '../../../hooks/useUserContext'; // FIXED: Use proper admin role detection
import { logger } from '../../../monitoring/logger';
import { GenericButton } from '../../../components/mantine/Button';
import { SelectedItemsOverlay } from './SelectedItemsOverlay';
import { apiService } from '../../../api/apiService';
import { storeUpdatesQueryKeys } from '../../../hooks/useStoreUpdatesHybrid'; // NEW: For cache invalidation

interface StoreUpdatesActionsProps {
  selectionHook: ReturnType<typeof useStoreUpdatesSelection>;
  recordCount: number;
  compactMode?: boolean;
  onBatchAction?: (actionId: string, selectedIds: string[]) => void;
  onDataRefresh?: () => Promise<void>; // NEW: For data-changing operations
  onClearState?: () => void; // NEW: For client-side clearing only
  filteringHook?: ReturnType<typeof useStoreUpdatesFiltering>; // NEW: For clearing filters
  allRecords?: StoreUpdate[]; // All available records for level-specific selections
}

/**
 * Hook that provides StoreUpdatesActions components for flexible positioning
 * ARCHITECTURE COMPLIANT: Pure UI component following core-principles.md
 * - React Components: Handle UI rendering only
 * - Custom Hooks: Business logic managed by useInstallUpdates
 * - Zustand Stores: Global state managed by useBatchProgressStore
 * - Service Layer: API calls handled by apiService
 * - TanStack Query: Mutations handled in custom hook
 * ENHANCED: Proper admin role detection and smart refresh strategy
 * LAYOUT FIX: Returns separate components for flexible positioning
 * SYNC FIX: Fixed sync refresh to match install refresh pattern
 */
export const useStoreUpdatesActions = ({
  selectionHook,
  recordCount,
  compactMode = false,
  onBatchAction,
  onDataRefresh, // Data-changing operations
  onClearState, // Client-side clearing only
  filteringHook,
  allRecords = []
}: StoreUpdatesActionsProps) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

  // NEW: TanStack Query client for sync cache invalidation
  const queryClient = useQueryClient();

  // FIXED: Use proper admin role detection from local store
  const userContext = useEnhancedUserContext();
  const isAdmin = userContext.isAdmin;

  // Local state for overlay and sync
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // ARCHITECTURE: Custom hook handles all business logic with smart refresh
  const { 
    installAllMutation,
    confirmationModal,
    showConfirmationModal,
    hideConfirmationModal,
    handleConfirmInstallation
  } = useInstallUpdates(selectionHook, {
    // FIXED: Only pass onInstallationComplete if onDataRefresh is defined
    ...(onDataRefresh && { onInstallationComplete: onDataRefresh })
  });

  // ARCHITECTURE: Zustand store handles global state
  const batchProgressStore = useBatchProgressStore();
  const isInstalling = batchProgressStore.isActive();
  const progress = batchProgressStore.progress;
  const message = batchProgressStore.message;

  // Handle overlay open/close
  const handleOpenOverlay = useCallback(() => {
    setIsOverlayOpen(true);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setIsOverlayOpen(false);
  }, []);

  // Auto-close overlay when all items are deselected
  React.useEffect(() => {
    if (isOverlayOpen && !selectionHook.stats.hasSelection) {
      setIsOverlayOpen(false);
    }
  }, [isOverlayOpen, selectionHook.stats.hasSelection]);

  // FIXED: Install Major - Use same working pattern as Install All but with filtering
  const handleInstallMajor = useCallback(async () => {
    if (!isAdmin) {
      logger.warn('Install Major attempted without admin privileges');
      return;
    }

    const majorRecords = allRecords.filter(record => record.level === 'major');
    
    if (majorRecords.length === 0) {
      logger.info('No major updates available');
      return;
    }

    // FIXED: Use same pattern as Install All - clear selection first, then select filtered records
    selectionHook.clearSelection();
    selectionHook.selectRecords(majorRecords, 'replace');
    
    // Show confirmation
    showConfirmationModal('Install Major Updates', majorRecords.length);
    
    logger.info('Install Major initiated (FIXED: Using Install All pattern)', {
      majorRecords: majorRecords.length,
      totalRecords: allRecords.length,
      autoSelected: true,
      pattern: 'install-all-with-filter'
    });
  }, [isAdmin, allRecords, selectionHook, showConfirmationModal]);

  // FIXED: Install Minor - Use same working pattern as Install All but with filtering
  const handleInstallMinor = useCallback(async () => {
    if (!isAdmin) {
      logger.warn('Install Minor attempted without admin privileges');
      return;
    }

    const minorRecords = allRecords.filter(record => record.level === 'minor');
    
    if (minorRecords.length === 0) {
      logger.info('No minor updates available');
      return;
    }

    // FIXED: Use same pattern as Install All - clear selection first, then select filtered records
    selectionHook.clearSelection();
    selectionHook.selectRecords(minorRecords, 'replace');
    
    // Show confirmation
    showConfirmationModal('Install Minor Updates', minorRecords.length);
    
    logger.info('Install Minor initiated (FIXED: Using Install All pattern)', {
      minorRecords: minorRecords.length,
      totalRecords: allRecords.length,
      autoSelected: true,
      pattern: 'install-all-with-filter'
    });
  }, [isAdmin, allRecords, selectionHook, showConfirmationModal]);

  // FIXED: Install Patches - Use same working pattern as Install All but with filtering
  const handleInstallPatches = useCallback(async () => {
    if (!isAdmin) {
      logger.warn('Install Patches attempted without admin privileges');
      return;
    }

    const patchRecords = allRecords.filter(record => record.level === 'patch');
    
    if (patchRecords.length === 0) {
      logger.info('No patch updates available');
      return;
    }

    // FIXED: Use same pattern as Install All - clear selection first, then select filtered records
    selectionHook.clearSelection();
    selectionHook.selectRecords(patchRecords, 'replace');
    
    // Show confirmation
    showConfirmationModal('Install Patch Updates', patchRecords.length);
    
    logger.info('Install Patches initiated (FIXED: Using Install All pattern)', {
      patchRecords: patchRecords.length,
      totalRecords: allRecords.length,
      autoSelected: true,
      pattern: 'install-all-with-filter'
    });
  }, [isAdmin, allRecords, selectionHook, showConfirmationModal]);

  // NEW: Install All - Auto-select all records and install (admin only)
  const handleInstallAll = useCallback(async () => {
    if (!isAdmin) {
      logger.warn('Install All attempted without admin privileges');
      return;
    }

    if (allRecords.length === 0) {
      logger.info('No updates available for Install All');
      return;
    }

    // Auto-select all records
    selectionHook.selectAllVisible();
    
    // Show confirmation
    showConfirmationModal('Install All Updates', allRecords.length);
    
    logger.info('Install All initiated', {
      totalRecords: allRecords.length,
      autoSelected: true
    });
  }, [isAdmin, allRecords, selectionHook, showConfirmationModal]);

  // SYNC FIX: Handle sync applications with same refresh pattern as install operations
  const handleSyncApplications = useCallback(async () => {
    setIsSyncing(true);
    
    try {
      logger.info('Starting sync applications process', {
        pattern: 'sync-applications',
        step: '1-trigger-sync'
      });

      // Step 1: Trigger sync
      const triggerResponse = await apiService.get('/api/sn_appclient/appmanager/sync_apps', {
        params: { request_type: 'trigger_apps_sync' }
      });
      
      const trackerId = triggerResponse.result?.trackerId;
      if (!trackerId) {
        throw new Error('No tracker ID received from sync trigger');
      }

      logger.info('Sync triggered successfully', {
        trackerId,
        step: '2-polling-status'
      });

      // Step 2: Poll for completion with indeterminate progress
      let attempts = 0;
      const maxAttempts = 150; // 5 minutes max (150 * 2s)
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second intervals
        attempts++;
        
        try {
          const statusResponse = await apiService.get('/api/sn_appclient/appmanager/sync_apps', {
            params: { 
              request_type: 'get_apps_sync_status',
              tracker_id: trackerId 
            }
          });
          
          const isComplete = statusResponse.result?.isComplete;
          
          if (isComplete) {
            logger.info('Sync completed successfully', {
              trackerId,
              attempts,
              duration: attempts * 2,
              appsLastSyncTime: statusResponse.result?.appsLastSyncTime
            });

            // SYNC FIX: Follow same pattern as install operations
            try {
              logger.info('Sync completed - starting data refresh like install operations', {
                trackerId,
                refreshPattern: 'install-like-refresh',
                step: '1-clear-selections'
              });

              // Step 1: Clear selections (like install operations)
              if (onClearState) {
                onClearState(); // Clear selections + filters client-side
              }
              
              // Step 2: Invalidate TanStack Query cache (like install operations)  
              logger.info('Sync refresh - invalidating TanStack Query cache', {
                trackerId,
                refreshPattern: 'install-like-refresh',
                step: '2-invalidate-cache'
              });
              
              await queryClient.invalidateQueries({ 
                queryKey: storeUpdatesQueryKeys.lists(),
                exact: true 
              });
              
              // Step 3: Trigger stale-while-revalidate refresh (like install operations)
              logger.info('Sync refresh - triggering stale-while-revalidate refresh', {
                trackerId,
                refreshPattern: 'install-like-refresh',
                step: '3-stale-while-revalidate'
              });
              
              if (onDataRefresh) {
                await onDataRefresh(); // Uses stale-while-revalidate pattern
              }
              
              logger.info('Sync refresh completed successfully', {
                trackerId,
                refreshPattern: 'install-like-refresh',
                step: '4-completed'
              });
              
            } catch (refreshError) {
              logger.error('Sync data refresh failed', 
                refreshError instanceof Error ? refreshError : new Error(String(refreshError)),
                { trackerId, refreshPattern: 'install-like-refresh' }
              );
            }
            
            break;
          }
          
          // Still in progress - continue polling
          logger.info('Sync in progress', {
            trackerId,
            attempts,
            estimatedProgress: Math.min(95, 25 + (attempts * 2)) // Indeterminate progress
          });
          
        } catch (pollError) {
          logger.warn('Sync status polling error (continuing)', {
            trackerId,
            attempts,
            error: pollError instanceof Error ? pollError.message : String(pollError)
          });
          // Continue polling on single error
        }
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Sync operation timed out after 5 minutes');
      }
      
    } catch (error) {
      logger.error('Sync applications failed', 
        error instanceof Error ? error : new Error(String(error)), {
        step: 'sync-process',
        errorType: error instanceof Error ? error.name : 'unknown'
      });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient, onDataRefresh, onClearState]); // SYNC FIX: Added queryClient dependency

  // Handle batch action execution - UI coordination only
  const handleBatchAction = useCallback(async (actionId: string) => {
    logger.info('Batch action initiated', {
      actionId,
      currentSelectedCount: selectionHook.selection.selectedIds.length
    });

    // Route to appropriate action handler - they handle their own selection logic
    switch (actionId) {
      case 'install-selected':
        // Only check selection for install-selected since user must manually select
        const selectedIds = selectionHook.selection.selectedIds;
        if (selectedIds.length === 0) {
          logger.warn('No items selected for install-selected action');
          return;
        }
        if (!isAdmin) {
          logger.warn('Install Selected attempted without admin privileges');
          return;
        }
        showConfirmationModal('Install Selected', selectedIds.length);
        break;
      case 'install-all':
        await handleInstallAll();
        break;
      case 'install-major':
        await handleInstallMajor();
        break;
      case 'install-minor':
        await handleInstallMinor();
        break;
      case 'install-patches':
        await handleInstallPatches();
        break;
      case 'sync-applications':
        await handleSyncApplications();
        break;
      default:
        logger.warn('Unknown batch action', { actionId });
    }
  }, [selectionHook.selection.selectedIds, isAdmin, showConfirmationModal, handleInstallAll, handleInstallMajor, handleInstallMinor, handleInstallPatches, handleSyncApplications]);

  // Primary batch actions with admin role requirements
  const primaryActions = useMemo(() => {
    const actions = [
      {
        id: 'install-selected',
        label: 'Install Selected',
        icon: 'IconDownload',
        color: 'blue',
        applicableCount: selectionHook.stats.totalSelected,
        requiresConfirmation: true,
        requiresAdmin: true,
        requiresSelection: true,
        description: 'Install selected updates using ServiceNow subflow'
      },
      {
        id: 'install-all',
        label: 'Install All',
        icon: 'IconSelectAll',
        color: 'blue',
        applicableCount: allRecords.length,
        requiresConfirmation: true,
        requiresAdmin: true,
        requiresSelection: false,
        description: 'Select all updates and install using ServiceNow subflow'
      },
      {
        id: 'install-major',
        label: 'Install Major',
        icon: 'IconUrgent',
        color: 'red',
        applicableCount: allRecords.filter(r => r.level === 'major').length,
        requiresConfirmation: true,
        requiresAdmin: true,
        requiresSelection: false,
        description: 'Install only major-level updates'
      },
      {
        id: 'install-minor',
        label: 'Install Minor',
        icon: 'IconInfoCircle',
        color: 'yellow',
        applicableCount: allRecords.filter(r => r.level === 'minor').length,
        requiresConfirmation: true,
        requiresAdmin: true,
        requiresSelection: false,
        description: 'Install only minor-level updates'
      },
      {
        id: 'install-patches',
        label: 'Install Patch',
        icon: 'IconBandage',
        color: 'green',
        applicableCount: allRecords.filter(r => r.level === 'patch').length,
        requiresConfirmation: true,
        requiresAdmin: true,
        requiresSelection: false,
        description: 'Install patch updates only'
      },
    ];

    return actions;
  }, [selectionHook.stats.totalSelected, allRecords]);

  // LAYOUT FIX: Menu actions for the three-dots menu - always available with enable/disable logic
  const menuActions = useMemo(() => {
    return primaryActions.map(action => ({
      ...action,
      // Determine if this menu action should be enabled
      isEnabled: () => {
        const hasRequiredRole = !action.requiresAdmin || isAdmin;
        const hasRequiredSelection = !action.requiresSelection || selectionHook.stats.hasSelection;
        const hasApplicableRecords = action.id === 'sync-applications' || action.applicableCount > 0; // Sync always enabled
        return hasRequiredRole && hasRequiredSelection && hasApplicableRecords && !isInstalling && !isSyncing;
      },
      // Get disabled reason for tooltip
      getDisabledReason: () => {
        if (!action.requiresAdmin || isAdmin) {
          if (action.requiresSelection && !selectionHook.stats.hasSelection) {
            return 'Select items first';
          }
          if (action.id !== 'sync-applications' && action.applicableCount === 0) {
            return `No ${action.label.toLowerCase()} available`;
          }
          if (isInstalling || isSyncing) {
            return 'Please wait for current operation to complete';
          }
        }
        if (action.requiresAdmin && !isAdmin) {
          return 'Administrator privileges required for installation operations';
        }
        return action.description;
      }
    }));
  }, [primaryActions, isAdmin, selectionHook.stats.hasSelection, isInstalling, isSyncing]);

  // Get action icon - UI utility function
  const getActionIcon = useCallback((iconName: string): React.ReactNode => {
    const icons: Record<string, React.ReactNode> = {
      IconDownload: <IconDownload size={16} />,
      IconSelectAll: <IconSelectAll size={16} />,
      IconUrgent: <IconUrgent size={16} />,
      IconInfoCircle: <IconInfoCircle size={16} />,
      IconBandage: <IconBandage size={16} />,
      IconRefresh: <IconRefresh size={16} />,
      IconClock: <IconClock size={16} />,
      IconFileExport: <IconFileExport size={16} />,
      IconEye: <IconEye size={16} />,
    };
    return icons[iconName] || <IconPlayerPlay size={16} />;
  }, []);

  // Enhanced Selection summary component - Shows app names and View All
  const SelectionSummary = () => {
    if (!selectionHook.stats.hasSelection) {
      return (
        <Text size="sm" c="dimmed">
          Select items to perform bulk actions
        </Text>
      );
    }

    const { levelBreakdown } = selectionHook.stats;
    const selectedRecords = selectionHook.selection.selectedRecords;
    const totalSelected = selectionHook.stats.totalSelected;

    // Get up to 5 application names using correct field access
    const displayNames = selectedRecords
      .slice(0, 5)
      .map((item: any) => 
        item['application.name'] || 
        item.application_name || 
        item.display_name || 
        item.name || 
        'Unknown App'
      )
      .join(', ');
    const hasMore = totalSelected > 5;

    return (
      <Stack gap="xs">
        {/* Application Names with View All */}
        <Group gap="xs" align="center">
          <Text size="sm" fw={500}>
            {totalSelected} selected:
          </Text>
          <Text size="sm" c="dimmed" style={{ flex: 1 }}>
            {displayNames}
            {hasMore && '...'}
          </Text>
          <Button
            variant="subtle"
            size="xs"
            onClick={handleOpenOverlay}
            c="blue"
          >
            View All
          </Button>
        </Group>

        {/* Level Breakdown Badges */}
        <Group gap="xs">
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
      </Stack>
    );
  };

  // Get button styling based on admin role and requirements
  const getButtonState = (action: any) => {
    const hasRequiredRole = !action.requiresAdmin || isAdmin;
    const hasRequiredSelection = !action.requiresSelection || selectionHook.stats.hasSelection;
    const hasApplicableRecords = action.id === 'sync-applications' || action.applicableCount > 0; // Sync always enabled
    const isEnabled = hasRequiredRole && hasRequiredSelection && hasApplicableRecords && !isInstalling && !isSyncing;

    if (isEnabled) {
      return {
        variant: 'filled' as const,
        color: action.color,
        disabled: false,
        tooltip: action.description
      };
    }

    // Determine why it's disabled
    let disabledReason = 'Unknown reason';
    if (!hasRequiredRole) {
      disabledReason = 'Administrator privileges required for installation operations';
    } else if (!hasRequiredSelection) {
      disabledReason = 'Select items first';
    } else if (!hasApplicableRecords) {
      disabledReason = `No ${action.label.toLowerCase()} available`;
    } else if (isInstalling || isSyncing) {
      disabledReason = 'Please wait for current operation to complete';
    }

    // FIXED: Return default Mantine styling for disabled buttons - no custom overrides
    return {
      variant: 'filled' as const,
      color: action.color,
      disabled: true,
      tooltip: disabledReason
      // Removed custom style overrides - let Mantine handle disabled styling
    };
  };

  // Filter-aligned action icons (positioned next to filter icon)
  const FilterAlignedIcons = () => (
    <Group gap="xs">
      {/* Clear Selection Icon - Styled exactly like filter icon */}
      <Tooltip label={selectionHook.stats.hasSelection ? "Clear selection" : "No items selected"}>
        <ActionIcon
          variant={selectionHook.stats.hasSelection ? 'filled' : 'light'}
          onClick={selectionHook.clearSelection}
          size="lg"
          disabled={!selectionHook.stats.hasSelection || isInstalling || isSyncing}
          aria-label={selectionHook.stats.hasSelection ? "Clear selection" : "No items selected"}
        >
          <IconCheck size={18} />
        </ActionIcon>
      </Tooltip>

      {/* Three-Dots Menu - Styled exactly like filter icon */}
      <Menu shadow="md" width={320}>
        <Menu.Target>
          <Tooltip label="Installation actions">
            <ActionIcon
              variant="light"
              size="lg"
              disabled={isInstalling || isSyncing}
              aria-label="Installation actions menu"
            >
              <IconDots size={18} />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Installation Actions</Menu.Label>
          {menuActions.map((action) => {
            const isEnabled = action.isEnabled();
            const disabledReason = action.getDisabledReason();
            
            return (
              <Tooltip key={action.id} label={disabledReason} disabled={isEnabled}>
                <div>
                  <Menu.Item
                    leftSection={getActionIcon(action.icon)}
                    onClick={() => isEnabled ? handleBatchAction(action.id) : undefined}
                    disabled={!isEnabled}
                    style={{
                      opacity: isEnabled ? 1 : 0.6,
                      cursor: isEnabled ? 'pointer' : 'not-allowed'
                    }}
                  >
                    <Group justify="space-between" w="100%">
                      <div>
                        <Text size="sm" fw={500}>
                          {action.label}
                        </Text>
                        <Text size="xs" c="dimmed" style={{ whiteSpace: 'normal' }}>
                          {action.description}
                        </Text>
                      </div>
                      {isEnabled && action.applicableCount > 0 && (
                        <Badge size="xs" color={action.color} variant="light">
                          {action.applicableCount}
                        </Badge>
                      )}
                    </Group>
                  </Menu.Item>
                </div>
              </Tooltip>
            );
          })}
          
          <Menu.Divider />
          <Menu.Label>Additional Actions</Menu.Label>
          <Menu.Item
            leftSection={<IconRefresh size={16} />}
            onClick={handleSyncApplications}
            disabled={isInstalling || isSyncing}
          >
            <Group justify="space-between" w="100%">
              <div>
                <Text size="sm" fw={500}>
                  Sync Applications
                </Text>
                <Text size="xs" c="dimmed" style={{ whiteSpace: 'normal' }}>
                  Synchronize applications from the store
                </Text>
              </div>
            </Group>
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );

  // Main actions component (install/sync buttons)
  const ActionsComponent = () => (
    <Box w="100%" maw="100%">
      <Stack gap={compactMode ? 'xs' : 'sm'}>
        {/* Enhanced Selection Summary */}
        <SelectionSummary />

        {/* Primary Install/Sync Actions */}
        <Group gap="sm" w="100%">
          {primaryActions.map((action) => {
            const buttonState = getButtonState(action);
            
            return (
              <Tooltip 
                key={action.id}
                label={buttonState.tooltip}
              >
                <GenericButton
                  size={compactMode ? 'sm' : 'md'}
                  variant={buttonState.variant}
                  color={buttonState.color}
                  leftSection={getActionIcon(action.icon)}
                  onClick={() => handleBatchAction(action.id)}
                  disabled={buttonState.disabled}
                  loading={isInstalling && action.id.includes('install')}
                >
                  {action.label}
                  {!buttonState.disabled && action.applicableCount > 0 && (
                    <Badge 
                      size="xs" 
                      ml="xs"
                      variant="transparent"
                      style={{ 
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'inherit'
                      }}
                    >
                      {action.applicableCount}
                    </Badge>
                  )}
                </GenericButton>
              </Tooltip>
            );
          })}

          {/* Sync Applications Button */}
          <Tooltip label="Synchronize applications from the store">
            <GenericButton
              size={compactMode ? 'sm' : 'md'}
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={handleSyncApplications}
              disabled={isInstalling || isSyncing}
              loading={isSyncing}
            >
              Sync Applications
            </GenericButton>
          </Tooltip>
        </Group>

        {/* Batch/Sync Progress */}
        {(isInstalling || isSyncing) && (
          <Alert color="blue" variant="light">
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  {isSyncing ? 'Sync in Progress' : 'Installation in Progress'}
                </Text>
                {!isSyncing && (
                  <Text size="xs" c="dimmed">
                    {Math.round(progress)}%
                  </Text>
                )}
              </Group>
              <Progress 
                value={isSyncing ? 100 : progress} 
                size="sm" 
                animated={isSyncing || isInstalling}
              />
              <Text size="xs" c="dimmed">
                {isSyncing ? 'Syncing applications from store...' : message}
              </Text>
            </Stack>
          </Alert>
        )}
      </Stack>

      {/* Selected Items Overlay */}
      <SelectedItemsOverlay
        opened={isOverlayOpen}
        onClose={handleCloseOverlay}
        selectionHook={selectionHook}
      />

      {/* Confirmation Modal - ARCHITECTURE: State from custom hook */}
      <Modal
        opened={confirmationModal.open}
        onClose={hideConfirmationModal}
        title="Confirm Installation"
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconAlertTriangle size={16} />} color="yellow" variant="light">
            <Text fw={500} mb="xs">
              Are you sure you want to {confirmationModal.actionLabel.toLowerCase()}?
            </Text>
            <Text size="sm">
              This will install {confirmationModal.selectedCount} selected update{confirmationModal.selectedCount !== 1 ? 's' : ''} using the ServiceNow subflow.
            </Text>
          </Alert>

          {/* Selection breakdown */}
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
              variant="light"
              onClick={hideConfirmationModal}
              disabled={isInstalling}
            >
              Cancel
            </Button>
            <Button
              color="blue"
              onClick={handleConfirmInstallation}
              loading={isInstalling}
              leftSection={<IconDownload size={16} />}
            >
              Start Installation
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );

  return {
    ActionsComponent,
    FilterAlignedIcons
  };
};

export default useStoreUpdatesActions;

// Legacy component export for backward compatibility
export const StoreUpdatesActions: React.FC<StoreUpdatesActionsProps> = (props) => {
  const { ActionsComponent } = useStoreUpdatesActions(props);
  return <ActionsComponent />;
};