// src/hooks/useApplicationManager.ts
// Custom hooks for Application Manager API integration
// Following Architecture.md separation of concerns - Business logic and local state
// Integrates with TanStack Query for data fetching and caching

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { applicationManagerService } from '../services/applicationManagerService';
import type { 
  AppManagerApplication, 
  AppManagerPlugin, 
  AppManagerTabContext,
  AppManagerInstallationProgress 
} from '../services/applicationManagerService';
import { logger, createLogContext } from '../monitoring/logger';
import { useNotifications } from './useNotifications';

// Query key factory for consistent cache keys
const queryKeys = {
  applications: (tabContext: AppManagerTabContext, searchKey?: string) => 
    ['app-manager', 'applications', tabContext, searchKey] as const,
  plugins: (tabContext: AppManagerTabContext, active?: boolean, searchKey?: string) => 
    ['app-manager', 'plugins', tabContext, active, searchKey] as const,
  applicationDetails: (appId: string) => 
    ['app-manager', 'application', appId] as const,
  dependencies: (scope: string) => 
    ['app-manager', 'dependencies', scope] as const,
  installations: () => 
    ['app-manager', 'installations'] as const,
  progress: (trackerId: string) => 
    ['app-manager', 'progress', trackerId] as const,
  pageConfig: () => 
    ['app-manager', 'page-config'] as const,
  filters: () => 
    ['app-manager', 'filters'] as const,
};

// Hook for fetching applications with different tab contexts
export const useApplicationManagerApps = (
  tabContext: AppManagerTabContext = 'available_for_you',
  searchKey?: string,
  options: {
    limit?: number;
    offset?: number;
    enabled?: boolean;
  } = {}
) => {
  const { limit = 100, offset = 0, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.applications(tabContext, searchKey),
    queryFn: () => applicationManagerService.getApplications(tabContext, searchKey, limit, offset),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: `Failed to fetch ${tabContext} applications`
    }
  });
};

// Hook for fetching plugins
export const useApplicationManagerPlugins = (
  tabContext: AppManagerTabContext = 'available_for_you',
  active?: boolean,
  searchKey?: string,
  options: {
    limit?: number;
    offset?: number;
    enabled?: boolean;
  } = {}
) => {
  const { limit = 100, offset = 0, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.plugins(tabContext, active, searchKey),
    queryFn: () => applicationManagerService.getPlugins(tabContext, active, searchKey, limit, offset),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    meta: {
      errorMessage: `Failed to fetch ${tabContext} plugins`
    }
  });
};

// Hook for application details
export const useApplicationDetails = (appId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.applicationDetails(appId),
    queryFn: () => applicationManagerService.getApplicationDetails(appId),
    enabled: enabled && !!appId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    meta: {
      errorMessage: `Failed to fetch application details for ${appId}`
    }
  });
};

// Hook for application dependencies
export const useApplicationDependencies = (scope: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.dependencies(scope),
    queryFn: () => applicationManagerService.getApplicationDependencies(scope),
    enabled: enabled && !!scope,
    staleTime: 10 * 60 * 1000,
    meta: {
      errorMessage: `Failed to fetch dependencies for ${scope}`
    }
  });
};

// Hook for page configuration
export const useApplicationManagerConfig = () => {
  return useQuery({
    queryKey: queryKeys.pageConfig(),
    queryFn: () => applicationManagerService.getPageConfiguration(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    meta: {
      errorMessage: 'Failed to fetch Application Manager configuration'
    }
  });
};

// Hook for filters
export const useApplicationManagerFilters = () => {
  return useQuery({
    queryKey: queryKeys.filters(),
    queryFn: () => applicationManagerService.getFilters(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    meta: {
      errorMessage: 'Failed to fetch Application Manager filters'
    }
  });
};

// Hook for installation operations
export const useApplicationInstallation = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError, showInfo } = useNotifications();

  const installMutation = useMutation({
    mutationFn: ({ 
      appId, 
      version, 
      options = {} 
    }: { 
      appId: string; 
      version: string; 
      options?: { customizationVersion?: string; loadDemoData?: boolean; }
    }) => {
      return applicationManagerService.installApplication(appId, version, options);
    },
    onSuccess: (data, variables) => {
      showInfo({
        title: 'Installation Started',
        message: `Installation of ${variables.appId} (${variables.version}) has been started`
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['app-manager', 'applications', 'installed'] });
      queryClient.invalidateQueries({ queryKey: ['app-manager', 'installations'] });

      logger.info('Application installation started successfully', createLogContext({
        appId: variables.appId,
        version: variables.version,
        trackerId: data.result?.tracker_id
      }));
    },
    onError: (error: any, variables) => {
      showError({
        title: 'Installation Failed',
        message: `Failed to start installation of ${variables.appId}: ${error.message}`
      });

      logger.error('Application installation failed',
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({
          appId: variables.appId,
          version: variables.version
        })
      );
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ 
      appId, 
      version, 
      options = {} 
    }: { 
      appId: string; 
      version: string; 
      options?: { customizationVersion?: string; loadDemoData?: boolean; }
    }) => {
      return applicationManagerService.updateApplication(appId, version, options);
    },
    onSuccess: (data, variables) => {
      showInfo({
        title: 'Update Started',
        message: `Update of ${variables.appId} to ${variables.version} has been started`
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['app-manager', 'applications'] });
      queryClient.invalidateQueries({ queryKey: ['app-manager', 'installations'] });

      logger.info('Application update started successfully', createLogContext({
        appId: variables.appId,
        version: variables.version,
        trackerId: data.result?.tracker_id
      }));
    },
    onError: (error: any, variables) => {
      showError({
        title: 'Update Failed',
        message: `Failed to start update of ${variables.appId}: ${error.message}`
      });

      logger.error('Application update failed',
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({
          appId: variables.appId,
          version: variables.version
        })
      );
    }
  });

  return {
    install: installMutation.mutate,
    installAsync: installMutation.mutateAsync,
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isInstalling: installMutation.isPending,
    isUpdating: updateMutation.isPending,
    installError: installMutation.error,
    updateError: updateMutation.error
  };
};

// Hook for progress tracking
export const useInstallationProgress = (trackerId: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.progress(trackerId),
    queryFn: () => applicationManagerService.getInstallationProgress(trackerId),
    enabled: enabled && !!trackerId,
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 0, // Always refetch
    meta: {
      errorMessage: `Failed to fetch progress for tracker ${trackerId}`
    }
  });
};

// Hook for managing Application Manager data with selection and filtering
export const useApplicationManagerData = () => {
  const [activeTab, setActiveTab] = useState<AppManagerTabContext>('available_for_you');
  const [searchKey, setSearchKey] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Queries for different tabs
  const availableApps = useApplicationManagerApps('available_for_you', searchKey, {
    enabled: activeTab === 'available_for_you'
  });
  
  const installedApps = useApplicationManagerApps('installed', searchKey, {
    enabled: activeTab === 'installed'
  });
  
  const updateApps = useApplicationManagerApps('updates', searchKey, {
    enabled: activeTab === 'updates'
  });

  // Current query based on active tab
  const currentQuery = useMemo(() => {
    switch (activeTab) {
      case 'available_for_you':
        return availableApps;
      case 'installed':
        return installedApps;
      case 'updates':
        return updateApps;
      default:
        return availableApps;
    }
  }, [activeTab, availableApps, installedApps, updateApps]);

  // Selection management
  const selectItem = useCallback((id: string) => {
    setSelectedItems(prev => new Set(prev).add(id));
  }, []);

  const deselectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (currentQuery.data?.result) {
      setSelectedItems(new Set(currentQuery.data.result.map(app => app.sys_id || app.app_id)));
    }
  }, [currentQuery.data]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // Selection stats
  const selectionStats = useMemo(() => {
    const totalSelected = selectedItems.size;
    const hasSelection = totalSelected > 0;
    const totalItems = currentQuery.data?.result.length || 0;
    const allSelected = totalSelected === totalItems && totalItems > 0;

    return {
      totalSelected,
      hasSelection,
      totalItems,
      allSelected,
      selectedIds: Array.from(selectedItems)
    };
  }, [selectedItems, currentQuery.data]);

  return {
    // Tab management
    activeTab,
    setActiveTab,
    
    // Search
    searchKey,
    setSearchKey,
    
    // Data
    data: currentQuery.data,
    isLoading: currentQuery.isLoading,
    error: currentQuery.error,
    refetch: currentQuery.refetch,
    
    // Selection
    selectedItems,
    selectItem,
    deselectItem,
    toggleSelection,
    selectAll,
    clearSelection,
    selectionStats,
    
    // Queries for all tabs
    queries: {
      available: availableApps,
      installed: installedApps,
      updates: updateApps
    }
  };
};