// src/hooks/useStoreUpdatesHybrid.ts
// PHASE 5: Enhanced search performance with minimum 3 characters optimization
// Proper Architecture.md Section 4.5: Hybrid Data Architecture Implementation
// Pattern 2A: Immediate Data + Pattern 2C: TanStack Query + Zustand integration
// Following Architecture.md Sections 4, 5, and 4.5 integration
// ENHANCED: Dual-Source Hybrid Statistics Integration
// FIXED: React Error #185 - Infinite loop in useEffect dependencies
// UPDATED: Added dot-walking fields for available_version references
// UPDATED: Reverted API-level filtering, implementing client-side filtering for batch_level=latest_version_level
// FIXED: TypeScript null safety for client-side filtering
// SIMPLIFIED: Updated filtering hooks to support only batch_level and published_date filters

import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useStoreUpdatesStore } from '../state/storeUpdatesStore';
import { useEnhancedUserContext, useQuickStats } from './useUserContext';
import { apiService } from '../api/apiService';
import { logger, createLogContext } from '../monitoring/logger';
import type { ServiceNowRecord } from '../types/api';
import React from 'react';

// Types for Store Updates - MOVED from deleted useStoreUpdates.ts
export interface StoreUpdate extends ServiceNowRecord {
  name: string;
  level: 'major' | 'minor' | 'patch';
  batch_level: 'major' | 'minor' | 'patch'; // UPDATED: Corrected based on actual API data
  installed_version: string;
  latest_version_level: 'major' | 'minor' | 'patch';
  major_count: number;
  minor_count: number;
  patch_count: number;
  // Referenced fields from available_version (sys_app_version table)
  available_version_publish_date?: string;  // FIXED: publish_date not published_date
  available_version_short_description?: string;
}

// Query keys for TanStack Query (Section 4) - UPDATED to force new cache for simplified filters
export const storeUpdatesQueryKeys = {
  all: ['storeUpdates', 'v6'] as const, // Updated v6 to force cache refresh for simplified filters
  lists: () => [...storeUpdatesQueryKeys.all, 'list'] as const,
  stats: () => [...storeUpdatesQueryKeys.all, 'stats'] as const,
};

/**
 * Pattern 2C: TanStack Query for Dynamic Data (Server State)
 * Following Architecture.md Section 4: Server State Layer with TanStack Query (Enhanced)
 * UPDATED: Added dot-walking fields for available_version references
 * REVERTED: Removed API-level filtering (not supported for field comparisons)
 * UPDATED: Will implement client-side filtering in Zustand store
 */
export const useStoreUpdatesServerState = () => {
  return useQuery({
    queryKey: storeUpdatesQueryKeys.lists(),
    queryFn: async (): Promise<StoreUpdate[]> => {
      const startTime = performance.now();
      
      logger.info('Fetching Store Updates (all records) - client-side filtering for batch_level=latest_version_level (Pattern 2C)', createLogContext({
        pattern: '2C-dynamic-data',
        queryKey: storeUpdatesQueryKeys.lists(),
        filterType: 'client-side',
        filterCondition: 'batch_level=latest_version_level'
      }));

      try {
        // UPDATED: Added dot-walking fields and debug logging
        const fieldsArray = [
          'sys_id', 'name', 'level', 'batch_level', 'installed_version', 
          'latest_version_level', 'major_count', 'minor_count', 'patch_count',
          // Dot-walking fields from available_version reference
          'available_version.publish_date',      // ADDED: referenced publish date
          'available_version.short_description'  // ADDED: referenced description
        ];

        console.log('🔍 HYBRID: Fields being sent to API:', fieldsArray);
        console.log('🔍 HYBRID: Dot-walked fields:', fieldsArray.filter(f => f.includes('.')));
        console.log('🔍 HYBRID: Client-side filtering will be applied for batch_level=latest_version_level');

        // REVERTED: Removed sysparm_query - ServiceNow API doesn't support field-to-field comparisons
        const response = await apiService.get<{
          result: StoreUpdate[];
        }>('/api/now/table/x_snc_store_upda_1_store_updates', {
          params: {
            sysparm_fields: fieldsArray.join(',')
            // REMOVED: sysparm_query - will filter client-side instead
          }
        });

        // Extract records from response properly
        const responseData = response as any; // Handle apiService typing
        const rawRecords: any[] = responseData?.result || [];
        
        // DEBUG: Log response structure before client-side filtering
        console.log('🔍 HYBRID: API Response (before client filtering):', {
          totalRecords: rawRecords.length,
          filterType: 'client-side',
          filterCondition: 'batch_level=latest_version_level'
        });
        
        if (rawRecords.length > 0) {
          const firstRecord = rawRecords[0];
          if (firstRecord) {
            const recordKeys = Object.keys(firstRecord);
            
            console.log('🔍 HYBRID: First record keys:', recordKeys);
            console.log('🔍 HYBRID: Dot-walked keys found:', recordKeys.filter(k => k.includes('.')));
            console.log('🔍 HYBRID: Sample record (pre-filter):', {
              name: firstRecord.name || 'N/A',
              batch_level: firstRecord.batch_level || 'N/A',
              latest_version_level: firstRecord.latest_version_level || 'N/A',
              willMatch: (firstRecord.batch_level && firstRecord.latest_version_level) ? 
                        firstRecord.batch_level === firstRecord.latest_version_level : false
            });
            console.log('🔍 HYBRID: Sample dot-walked values:', {
              'available_version.publish_date': firstRecord['available_version.publish_date'] || 'N/A',
              'available_version.short_description': firstRecord['available_version.short_description'] || 'N/A'
            });
          }
        }

        // Transform records with dot-walked field flattening
        const allRecords: StoreUpdate[] = rawRecords.map((record: any) => ({
          ...record,
          // Flatten dot-walked fields for easier access
          available_version_publish_date: record['available_version.publish_date'] || record.available_version_publish_date,
          available_version_short_description: record['available_version.short_description'] || record.available_version_short_description,
        }));

        // CLIENT-SIDE FILTERING: Apply batch_level=latest_version_level filter with null safety
        const filteredRecords = allRecords.filter(record => {
          // FIXED: Added null safety checks
          const batchLevel = record.batch_level;
          const latestVersionLevel = record.latest_version_level;
          
          // Only include records where both fields exist and match (case insensitive)
          return batchLevel && latestVersionLevel && 
                 batchLevel.toLowerCase() === latestVersionLevel.toLowerCase();
        });

        const duration = performance.now() - startTime;

        // DEBUG: Log filtering results with null safety
        const recordsWithReferencedData = filteredRecords.filter(r => r.available_version_publish_date || r.available_version_short_description);
        
        logger.info('TanStack Query fetch completed with client-side filtering', createLogContext({
          pattern: '2C-dynamic-data',
          totalRecordsFromAPI: allRecords.length,
          filteredRecords: filteredRecords.length,
          filterReduction: allRecords.length > 0 ? Math.round(((allRecords.length - filteredRecords.length) / allRecords.length) * 100) : 0,
          duration: Math.round(duration),
          cacheStatus: 'fresh',
          hasReferencedData: recordsWithReferencedData.length > 0,
          referencedFieldsCount: recordsWithReferencedData.length,
          filterType: 'client-side',
          filterCondition: 'batch_level=latest_version_level'
        }));

        console.log('🔍 HYBRID: Client-side filtering results:', {
          totalFromAPI: allRecords.length,
          afterFiltering: filteredRecords.length,
          filterReduction: allRecords.length > 0 ? `${Math.round(((allRecords.length - filteredRecords.length) / allRecords.length) * 100)}%` : '0%',
          recordsWithReferencedData: recordsWithReferencedData.length
        });
        
        if (filteredRecords.length > 0) {
          const firstFiltered = filteredRecords[0];
          if (firstFiltered) {
            console.log('🔍 HYBRID: Sample filtered record:', {
              name: firstFiltered.name || 'N/A',
              batch_level: firstFiltered.batch_level || 'N/A',
              latest_version_level: firstFiltered.latest_version_level || 'N/A',
              matches: (firstFiltered.batch_level && firstFiltered.latest_version_level) ?
                      firstFiltered.batch_level === firstFiltered.latest_version_level : false
            });
          }
        }

        // Return filtered records instead of all records
        return filteredRecords;

      } catch (error) {
        const duration = performance.now() - startTime;
        
        logger.error('TanStack Query fetch failed with client-side filter', error instanceof Error ? error : undefined, createLogContext({
          pattern: '2C-dynamic-data',
          duration: Math.round(duration),
          queryKey: storeUpdatesQueryKeys.lists(),
          filterType: 'client-side'
        }));

        console.error('🔍 HYBRID: API Error with client filter:', error);
        throw error;
      }
    },
    
    // FORCE FRESH QUERY for debugging
    staleTime: 0, // Always consider data stale
    gcTime: 0, // Immediately garbage collect
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
  });
};

/**
 * Hybrid Pattern Integration: Pattern 2A + TanStack Query + Zustand + Dual-Source Statistics
 * Following Architecture.md Section 4.5: ServiceNow-Optimized Data Architecture
 * 
 * This hook combines:
 * - Pattern 2A: Immediate user context and quick stats (zero loading states)
 * - Pattern 2C: TanStack Query for dynamic server data
 * - Zustand: Client-side state management with selective subscriptions
 * - Dual-Source Statistics: Centralized hybrid statistics management
 */
export const useStoreUpdatesHybrid = () => {
  // Pattern 2A: Immediate data (zero loading states)
  const userContext = useEnhancedUserContext();
  const quickStats = useQuickStats();
  
  // Pattern 2C: Server state via TanStack Query (Section 4)
  const serverQuery = useStoreUpdatesServerState();
  
  // Client state via Zustand (Section 5) - Selective subscriptions
  const filteredRecords = useStoreUpdatesStore(state => state.filteredRecords);
  const paginatedRecords = useStoreUpdatesStore(state => state.paginatedRecords);
  const totalFiltered = useStoreUpdatesStore(state => state.totalFiltered);
  const totalPages = useStoreUpdatesStore(state => state.totalPages);
  const pagination = useStoreUpdatesStore(state => state.pagination);
  const filters = useStoreUpdatesStore(state => state.filters);
  
  // Dual-Source Statistics (NEW) - Single source of truth
  const statistics = useStoreUpdatesStore(state => state.statistics);
  
  // Actions - Get stable references
  const setServerData = useStoreUpdatesStore(state => state.actions.setServerData);
  const clearData = useStoreUpdatesStore(state => state.actions.clearData);
  const setImmediateStats = useStoreUpdatesStore(state => state.actions.setImmediateStats);
  const updateCalculatedStats = useStoreUpdatesStore(state => state.actions.updateCalculatedStats);
  const refreshHybridStats = useStoreUpdatesStore(state => state.actions.refreshHybridStats);

  // FIXED: Stable references to prevent infinite loops
  const userFirstName = userContext.firstName;
  const totalRecords = quickStats.totalRecords;
  const isPattern2A = quickStats.isImmediate;
  
  // Sync Pattern 2A immediate stats to store - FIXED: Use stable dependencies
  React.useEffect(() => {
    if (quickStats && isPattern2A) {
      logger.info('Syncing Pattern 2A quickStats to Zustand store (with client-side filter)', createLogContext({
        pattern: '2a-immediate-sync',
        totalRecords: quickStats.totalRecords,
        majorUpdates: quickStats.levelDistribution?.major,
        minorUpdates: quickStats.levelDistribution?.minor,
        patchUpdates: quickStats.levelDistribution?.patch,
        userContext: userFirstName,
        filterType: 'client-side'
      }));
      
      setImmediateStats(quickStats, userContext);
    }
  }, [totalRecords, userFirstName, isPattern2A]); // FIXED: Stable dependencies only

  // Sync server data to client store when TanStack Query data changes
  React.useEffect(() => {
    if (serverQuery.data) {
      logger.info('Syncing TanStack Query filtered data to Zustand store', createLogContext({
        pattern: 'hybrid-sync',
        serverRecords: serverQuery.data.length,
        syncDirection: 'tanstack-to-zustand',
        pattern2ARecords: totalRecords,
        recordsMatch: serverQuery.data.length === totalRecords,
        filterType: 'client-side'
      }));
      
      setServerData(serverQuery.data);
      // setServerData automatically calls updateCalculatedStats
    }
  }, [serverQuery.data]); // FIXED: Only depend on server data, not totalRecords

  // Manual refresh function
  const refresh = useCallback(async () => {
    logger.info('Manual refresh requested (Hybrid Pattern with client-side filter)', createLogContext({
      pattern: 'hybrid-refresh',
      currentCacheStatus: serverQuery.isStale ? 'stale' : 'fresh',
      userContext: userFirstName,
      filterType: 'client-side'
    }));
    
    clearData();
    await serverQuery.refetch();
  }, [clearData, serverQuery, userFirstName]);

  return {
    // Pattern 2A: Immediate data (zero loading states)
    userContext,
    quickStats,
    
    // Server state (Pattern 2C - TanStack Query)
    isLoading: serverQuery.isLoading,
    isError: serverQuery.isError,
    error: serverQuery.error?.message,
    isFetching: serverQuery.isFetching,
    
    // Client state (Zustand with selective subscriptions)
    data: {
      records: paginatedRecords,
      total: totalFiltered,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages,
      allRecordsCount: serverQuery.data?.length || quickStats.totalRecords || 0,
      rawServerData: serverQuery.data || [] // Access to filtered TanStack Query data
    },
    
    filters,
    
    // Dual-Source Statistics (NEW) - Single source of truth from store
    statistics,
    
    refresh,
    clearData,
    
    // Statistics actions for external use (installation operations, etc.)
    updateStatistics: {
      refreshHybridStats,
      updateCalculatedStats,
      setImmediateStats
    },
    
    // Hybrid pattern status (Architecture.md compliance)
    hybridStatus: {
      serverState: serverQuery.status,
      clientRecords: paginatedRecords.length,
      isHybridSynced: !!(serverQuery.data && paginatedRecords.length > 0),
      pattern2AAvailable: userContext.pattern2A.isAvailable,
      pattern2CActive: serverQuery.status === 'success',
      statisticsSource: statistics.activeStats.source,
      isCalculatedPreferred: statistics.activeStats.isCalculatedPreferred,
      dataConsistency: {
        pattern2ARecords: quickStats.totalRecords,
        pattern2CRecords: serverQuery.data?.length || 0,
        zustandRecords: paginatedRecords.length,
        recordsMatch: quickStats.totalRecords === (serverQuery.data?.length || 0)
      }
    }
  };
};

// PHASE 5: Enhanced debouncing function with performance optimizations
function enhancedDebounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
  options: {
    minLength?: number;
    immediate?: boolean;
  } = {}
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  const { minLength = 0, immediate = false } = options;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const since = now - lastCallTime;
    lastCallTime = now;
    
    // Clear previous timeout
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // For search terms, check minimum length requirement
    if (minLength > 0 && args.length > 0) {
      const searchTerm = args[0] as string;
      if (searchTerm.length > 0 && searchTerm.length < minLength) {
        // Don't execute function if under minimum but not empty
        return;
      }
    }
    
    // Execute immediately if requested and it's been long enough
    if (immediate && since >= wait) {
      func(...args);
      return;
    }
    
    // Otherwise, debounce normally
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// SIMPLIFIED: Rest of the hooks with only required filtering functionality
export const useStoreUpdatesFiltering = () => {
  const filters = useStoreUpdatesStore(state => state.filters);
  const totalFiltered = useStoreUpdatesStore(state => state.totalFiltered);
  const serverDataCount = useStoreUpdatesStore(state => state.allRecords.length);
  
  const setSearch = useStoreUpdatesStore(state => state.actions.setSearch);
  const setBatchLevelFilter = useStoreUpdatesStore(state => state.actions.setBatchLevelFilter);
  const setPublishedDateFilter = useStoreUpdatesStore(state => state.actions.setPublishedDateFilter); // NEW
  const setSorting = useStoreUpdatesStore(state => state.actions.setSorting);
  const clearFilters = useStoreUpdatesStore(state => state.actions.clearFilters);

  // PHASE 5: Enhanced debounced search with minimum character requirement
  const debouncedSearch = useCallback(
    enhancedDebounce((searchTerm: string) => {
      // Additional validation: only set search if meets criteria
      if (searchTerm.length === 0 || searchTerm.length >= 3) {
        setSearch(searchTerm);
        
        logger.info('Enhanced debounced search executed', createLogContext({
          pattern: 'enhanced-search-debounce',
          searchTerm: searchTerm.substring(0, 20), // Log first 20 chars only
          searchLength: searchTerm.length,
          triggered: true,
          performance: 'minimum-3-chars-optimization'
        }));
      } else {
        logger.info('Search skipped - under minimum characters', createLogContext({
          pattern: 'enhanced-search-debounce',
          searchLength: searchTerm.length,
          triggered: false,
          reason: 'under-minimum-length'
        }));
      }
    }, 300, { minLength: 3 }),
    [setSearch]
  );

  // PHASE 5: Direct search setter (for programmatic use)
  const setSearchDirect = useCallback((searchTerm: string) => {
    setSearch(searchTerm);
    
    logger.info('Direct search set', createLogContext({
      pattern: 'direct-search',
      searchLength: searchTerm.length,
      searchTerm: searchTerm.substring(0, 20)
    }));
  }, [setSearch]);

  // SIMPLIFIED: Updated insights for only 2 filters
  const insights = {
    hasActiveFilters: !!(
      filters.search ||
      filters.batch_level.length > 0 ||
      (filters.published_date && filters.published_date.length > 0)
    ),
    activeFiltersCount: [
      filters.search ? 1 : 0,
      filters.batch_level.length > 0 ? 1 : 0,
      (filters.published_date && filters.published_date.length > 0) ? 1 : 0,
    ].reduce((sum, count) => sum + count, 0),
    totalFiltered,
    allRecordsCount: serverDataCount,
    isFiltered: totalFiltered !== serverDataCount,
    // PHASE 5: Enhanced search insights
    searchInsights: {
      hasSearch: filters.search.length > 0,
      searchLength: filters.search.length,
      isValidSearch: filters.search.length === 0 || filters.search.length >= 3,
      searchTerm: filters.search
    }
  };

  return {
    filters,
    insights,
    setSearch: setSearchDirect, // PHASE 5: Use direct setter for programmatic calls
    debouncedSearch, // PHASE 5: Enhanced debounced search for user input
    setBatchLevelFilter, 
    setPublishedDateFilter, // NEW: Published date filter
    setSorting,
    clearFilters,
    updateSorting: useCallback((sortBy: string) => {
      setSorting(sortBy);
    }, [setSorting]),
    resetFilters: clearFilters
  };
};

export const useStoreUpdatesPagination = () => {
  const pagination = useStoreUpdatesStore(state => state.pagination);
  const totalPages = useStoreUpdatesStore(state => state.totalPages);
  const totalFiltered = useStoreUpdatesStore(state => state.totalFiltered);
  
  const setPage = useStoreUpdatesStore(state => state.actions.setPage);
  const setPageSize = useStoreUpdatesStore(state => state.actions.setPageSize);
  const nextPage = useStoreUpdatesStore(state => state.actions.nextPage);
  const previousPage = useStoreUpdatesStore(state => state.actions.previousPage);

  const goToFirstPage = useCallback(() => setPage(1), [setPage]);
  const goToLastPage = useCallback(() => setPage(totalPages), [setPage, totalPages]);
  
  const canGoNext = pagination.page < totalPages;
  const canGoPrevious = pagination.page > 1;

  const startRecord = (pagination.page - 1) * pagination.pageSize + 1;
  const endRecord = Math.min(pagination.page * pagination.pageSize, totalFiltered);

  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages,
    totalRecords: totalFiltered,
    canGoNext,
    canGoPrevious,
    startRecord,
    endRecord,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage
  };
};

export const useStoreUpdatesStats = () => {
  const statistics = useStoreUpdatesStore(state => state.statistics);
  const isLoading = useStoreUpdatesStore(state => state.loading);
  const error = useStoreUpdatesStore(state => state.error);
  
  const filteredRecords = useStoreUpdatesStore(state => state.filteredRecords);
  const allRecords = useStoreUpdatesStore(state => state.allRecords);

  const insights = React.useMemo(() => ({
    levelDistribution: filteredRecords.reduce((acc, record) => {
      acc[record.level] = (acc[record.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    batchLevelDistribution: filteredRecords.reduce((acc, record) => {
      acc[record.batch_level] = (acc[record.batch_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    
    averageMajorUpdates: allRecords.length > 0 
      ? allRecords.reduce((sum, record) => sum + (record.major_count || 0), 0) / allRecords.length 
      : 0,
    averageMinorUpdates: allRecords.length > 0
      ? allRecords.reduce((sum, record) => sum + (record.minor_count || 0), 0) / allRecords.length
      : 0,
    averagePatchUpdates: allRecords.length > 0
      ? allRecords.reduce((sum, record) => sum + (record.patch_count || 0), 0) / allRecords.length
      : 0,
  }), [filteredRecords, allRecords]);

  return {
    data: {
      ...statistics.activeStats,
      ...insights,
      
      hybridMetadata: {
        source: statistics.activeStats.source,
        isCalculatedPreferred: statistics.activeStats.isCalculatedPreferred,
        hasSignificantDifference: statistics.activeStats.hasSignificantDifference,
        hasStringCorruption: statistics.activeStats.hasStringCorruption,
        timestamp: statistics.activeStats.timestamp,
        
        immediateStats: statistics.immediateStats,
        calculatedStats: statistics.calculatedStats
      }
    },
    
    isLoading,
    isError: !!error,
    error,
    
    statistics
  };
};

// PHASE 5: Legacy debounce function maintained for compatibility
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}