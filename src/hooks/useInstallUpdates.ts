// src/hooks/useInstallUpdates.ts
// Custom hook for install updates business logic
// Following Architecture.md separation of concerns - Business logic and local state
// Integrates with service layer, TanStack Query, and Zustand store
// ADDED: Automatic data refresh after successful installation completion

import { useCallback, useRef, useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../api/apiService';
import { useBatchProgressStore } from '../stores/batchProgressStore';
import { logger, createLogContext } from '../monitoring/logger';
import { useNotifications } from './useNotifications';
import type { useStoreUpdatesSelection } from './useStoreUpdatesSelection';
import { storeUpdatesQueryKeys } from './useStoreUpdatesHybrid'; // NEW: For correct cache invalidation

// Install updates response interface
export interface InstallUpdatesResponse {
  success: boolean;
  progress_id: string;
  status_message: string;
  app_count: number;
  apps_requested: string;
  timestamp: string;
}

// Install updates error interface
export interface InstallUpdatesError {
  success: false;
  error: string;
  message: string;
  timestamp: string;
}

// ServiceNow CI/CD Progress API response interface
export interface CICDProgressResponse {
  status: string; // "0" = running, "2" = successful, "3" = failed, etc.
  status_label: string; // "Running", "Successful", "Failed", etc.
  status_message: string;
  status_detail: string;
  error: string;
  links: {
    progress: {
      id: string;
      url: string;
    };
  };
  percent_complete: number; // 0-100
}

// Confirmation modal state interface
export interface ConfirmationModalState {
  open: boolean;
  actionLabel: string;
  selectedCount: number;
}

// Hook configuration
interface UseInstallUpdatesConfig {
  onSuccess?: (response: InstallUpdatesResponse) => void;
  onError?: (error: any) => void;
  onInstallationComplete?: () => Promise<void>; // NEW: Callback for data refresh after installation
  enableProgressPolling?: boolean;
  pollingInterval?: number;
}

export const useInstallUpdates = (
  selectionHook: ReturnType<typeof useStoreUpdatesSelection>,
  config: UseInstallUpdatesConfig = {}
) => {
  const {
    onSuccess,
    onError,
    onInstallationComplete, // NEW: Data refresh callback
    enableProgressPolling = true,
    pollingInterval = 5000 // 5 seconds as requested
  } = config;

  // Dependencies
  const queryClient = useQueryClient();
  const batchProgressStore = useBatchProgressStore();
  const { showSuccess, showError, showInfo } = useNotifications();
  
  // Progress polling ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>({
    open: false,
    actionLabel: '',
    selectedCount: 0
  });

  // Service layer method for install updates API call
  const callInstallUpdatesApi = useCallback(async (selectedIds: string[]): Promise<InstallUpdatesResponse> => {
    logger.info('Calling install updates API', createLogContext({
      selectedCount: selectedIds.length,
      selectedIds: selectedIds.slice(0, 5) // Log first 5 IDs only
    }));

    const response = await apiService.installUpdates(selectedIds);
    return response;
  }, []);

  // ServiceNow CI/CD Progress API polling method
  const pollCICDProgress = useCallback(async (progressId: string): Promise<CICDProgressResponse> => {
    logger.info('Polling CI/CD progress API', createLogContext({
      progressId,
      endpoint: `/api/sn_cicd/progress/${progressId}`
    }));

    const response = await apiService.get<CICDProgressResponse>(
      `/api/sn_cicd/progress/${progressId}`
    );

    return response.result;
  }, []);

  // Start progress polling using ServiceNow CI/CD Progress API
  const startProgressPolling = useCallback((progressId: string) => {
    if (!enableProgressPolling) return;

    // Clear any existing polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    logger.info('Starting CI/CD progress polling', createLogContext({
      progressId,
      pollingInterval,
      endpoint: `/api/sn_cicd/progress/${progressId}`
    }));

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const progressState = await pollCICDProgress(progressId);
        
        logger.info('CI/CD progress update received', createLogContext({
          progressId,
          status: progressState.status,
          statusLabel: progressState.status_label,
          percentComplete: progressState.percent_complete,
          statusMessage: progressState.status_message
        }));

        // UX IMPROVEMENT: Override progress and status message for better user experience
        const rawProgress = progressState.percent_complete || 0;
        const rawStatusMessage = progressState.status_message || progressState.status_label || 'Processing...';
        
        // Override 0% progress to show 5% to indicate activity
        const displayProgress = rawProgress === 0 ? 5 : rawProgress;
        
        // Enhance status message for long-running queued operations and finishing stages
        const displayStatusMessage = rawStatusMessage === 'Executing queued operation' 
          ? 'Executing queued operation -- This may take a long time.'
          : (rawStatusMessage === 'Running' && rawProgress >= 90)
            ? 'Running -- Finishing up, this may take a longer time.'
            : rawStatusMessage;

        // Update store with enhanced progress values
        batchProgressStore.updateProgress(displayProgress, displayStatusMessage);

        // Handle completion states
        if (progressState.status_label === 'Successful' && progressState.percent_complete === 100) {
          batchProgressStore.completeOperation('Installation completed successfully');
          stopProgressPolling();
          
          // INSTALL FIX: Follow exact same pattern as sync operations
          try {
            logger.info('Installation completed - starting data refresh like sync operations', {
              progressId,
              refreshPattern: 'sync-like-refresh',
              step: '1-clear-selections'
            });

            // Step 1: Clear selections (like sync operations)
            selectionHook.clearSelection();
            
            // Step 2: Invalidate TanStack Query cache (like sync operations)
            logger.info('Install refresh - invalidating TanStack Query cache', {
              progressId,
              refreshPattern: 'sync-like-refresh',
              step: '2-invalidate-cache'
            });
            
            await queryClient.invalidateQueries({ 
              queryKey: storeUpdatesQueryKeys.lists(),
              exact: true 
            });
            
            // Step 3: Trigger stale-while-revalidate refresh (like sync operations)
            logger.info('Install refresh - triggering stale-while-revalidate refresh', {
              progressId,
              refreshPattern: 'sync-like-refresh',
              step: '3-stale-while-revalidate'
            });
            
            if (onInstallationComplete) {
              await onInstallationComplete(); // Uses stale-while-revalidate pattern
            }
            
            // Step 4: Single success notification
            showSuccess({
              title: 'Installation Complete',
              message: `Installation of ${batchProgressStore.selectedIds.length} updates completed successfully.`
            });
            
            logger.info('Install refresh completed successfully', {
              progressId,
              refreshPattern: 'sync-like-refresh',
              step: '4-completed'
            });
            
          } catch (refreshError) {
            logger.error('Install data refresh failed', 
              refreshError instanceof Error ? refreshError : new Error(String(refreshError)),
              createLogContext({ progressId, refreshPattern: 'sync-like-refresh' })
            );
            
            showError({
              title: 'Installation Complete',
              message: `Installation completed, but data refresh failed. Please refresh the page manually.`
            });
          }
          
        } else if (progressState.status_label === 'Failed' || progressState.error) {
          const errorMessage = progressState.error || progressState.status_message || 'Installation failed';
          batchProgressStore.errorOperation('Installation failed', progressState);
          stopProgressPolling();
          
          showError({
            title: 'Installation Failed',
            message: errorMessage
          });

          logger.error('Installation failed', 
            new Error(errorMessage),
            createLogContext({
              progressId,
              status: progressState.status,
              statusLabel: progressState.status_label,
              error: progressState.error,
              statusDetail: progressState.status_detail
            })
          );
        }
        // If status is still running or in progress, continue polling

      } catch (error) {
        logger.error('CI/CD progress polling failed', 
          error instanceof Error ? error : new Error(String(error)),
          createLogContext({ progressId })
        );
        
        // Don't stop polling on single error - ServiceNow might be temporarily unavailable
        // But if we get multiple consecutive errors, we should consider stopping
      }
    }, pollingInterval);

  }, [enableProgressPolling, pollingInterval, pollCICDProgress, batchProgressStore, queryClient, showSuccess, showError, showInfo, onInstallationComplete, selectionHook.clearSelection]);

  // Stop progress polling
  const stopProgressPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      
      logger.info('Stopped CI/CD progress polling', createLogContext({}));
    }
  }, []);

  // TanStack Query mutation for install updates
  const installUpdatesMutation = useMutation({
    mutationFn: callInstallUpdatesApi,
    onMutate: (selectedIds: string[]) => {
      // Start operation in store
      const operationId = batchProgressStore.startOperation('install-all', selectedIds);
      
      logger.info('Install updates mutation started', createLogContext({
        operationId,
        selectedCount: selectedIds.length
      }));
      
      return { operationId };
    },
    onSuccess: (response: InstallUpdatesResponse, selectedIds: string[]) => {
      logger.info('Install updates API call successful', createLogContext({
        progressId: response.progress_id,
        appCount: response.app_count,
        statusMessage: response.status_message
      }));

      // Update store with progress worker ID
      batchProgressStore.setProgressWorkerId(response.progress_id);
      
      // Start progress polling using CI/CD Progress API
      startProgressPolling(response.progress_id);
      
      showInfo({
        title: 'Installation Started',
        message: `Started installation of ${response.app_count} updates. Tracking progress...`
      });

      // Call custom success handler
      onSuccess?.(response);
    },
    onError: (error: any, selectedIds: string[]) => {
      logger.error('Install updates mutation failed',
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({
          selectedCount: selectedIds.length,
          errorMessage: error.message
        })
      );

      // Update store with error
      batchProgressStore.errorOperation(
        error.message || 'Installation failed',
        error
      );

      showError({
        title: 'Installation Failed',
        message: error.message || 'Failed to start installation process'
      });

      // Call custom error handler
      onError?.(error);
    }
  });

  // Modal management functions
  const showConfirmationModal = useCallback((actionLabel: string, selectedCount: number) => {
    setConfirmationModal({
      open: true,
      actionLabel,
      selectedCount
    });
  }, []);

  const hideConfirmationModal = useCallback(() => {
    setConfirmationModal(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  const handleConfirmInstallation = useCallback(() => {
    const selectedIds = selectionHook.selection.selectedIds;
    
    if (selectedIds.length === 0) {
      logger.warn('No items selected for installation');
      hideConfirmationModal();
      return;
    }

    // Hide modal and start installation
    hideConfirmationModal();
    installUpdatesMutation.mutate(selectedIds);
  }, [selectionHook.selection.selectedIds, hideConfirmationModal, installUpdatesMutation.mutate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgressPolling();
    };
  }, [stopProgressPolling]);

  // Public interface
  return {
    // Mutation
    installUpdates: installUpdatesMutation.mutate,
    installUpdatesAsync: installUpdatesMutation.mutateAsync,
    installAllMutation: installUpdatesMutation, // Legacy alias for backward compatibility
    
    // Mutation state
    isLoading: installUpdatesMutation.isPending,
    error: installUpdatesMutation.error,
    data: installUpdatesMutation.data,
    isError: installUpdatesMutation.isError,
    isSuccess: installUpdatesMutation.isSuccess,
    
    // Modal state and actions
    confirmationModal,
    showConfirmationModal,
    hideConfirmationModal,
    handleConfirmInstallation,
    
    // Progress state (from Zustand store)
    batchProgress: batchProgressStore,
    
    // Progress control
    startProgressPolling,
    stopProgressPolling,
    
    // Actions
    reset: useCallback(() => {
      installUpdatesMutation.reset();
      batchProgressStore.resetOperation();
      stopProgressPolling();
      hideConfirmationModal();
    }, [installUpdatesMutation.reset, batchProgressStore.resetOperation, stopProgressPolling, hideConfirmationModal])
  };
};