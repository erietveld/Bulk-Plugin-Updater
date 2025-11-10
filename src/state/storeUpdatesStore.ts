// src/state/storeUpdatesStore.ts
// Architecture.md Section 5: Client State Layer with Zustand (Enhanced)
// Enterprise-grade Zustand store with selective subscriptions and performance optimization
// Pattern 2A/2B Support - Seamless integration with hybrid data architecture
// Following Architecture.md Sections 4.5 and 5 integration
// ENHANCED: Dual-Source Hybrid Statistics Strategy (Pattern 2A + Pattern 2C)
// FIXED: Pattern 2A preferred by default (zero loading states principle)
// UPDATED: Default page size changed from 25 to 10 rows
// SIMPLIFIED: Updated filters to only include batch_level and published_date
// FIXED: Critical count comparison to use actual batch_level values

import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { logger, createLogContext } from '../monitoring/logger';
import type { StoreUpdate } from '../hooks/useStoreUpdatesHybrid';

export interface StoreUpdatesFilters {
  search: string;
  batch_level: string[];
  published_date: string[]; // NEW: Published date filter
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export interface StoreUpdatesPagination {
  page: number;
  pageSize: number;
}

// Dual-Source Hybrid Statistics Interface (Architecture.md Section 4.5)
export interface StoreUpdatesStatistics {
  // Pattern 2A: Immediate Statistics (Zero Loading States)
  immediateStats: {
    totalApplications: number;
    totalMajorUpdates: number;
    totalMinorUpdates: number;
    totalPatchUpdates: number;
    source: 'pattern-2a-immediate';
    timestamp: number;
  };
  
  // Pattern 2C: Calculated Statistics (Real-time Updates)
  calculatedStats: {
    totalApplications: number;
    totalMajorUpdates: number;
    totalMinorUpdates: number;
    totalPatchUpdates: number;
    source: 'pattern-2c-calculated';
    timestamp: number;
  } | null;
  
  // Hybrid Decision Logic
  activeStats: {
    totalApplications: number;
    totalMajorUpdates: number;
    totalMinorUpdates: number;
    totalPatchUpdates: number;
    criticalCount: number;
    currentlyShown: number;
    selectedCount: number;
    source: 'pattern-2a-immediate' | 'pattern-2c-calculated';
    timestamp: number;
    isCalculatedPreferred: boolean;
    hasSignificantDifference: boolean;
    hasStringCorruption: boolean;
  };
}

export interface StoreUpdatesState {
  // Raw server data from TanStack Query (Pattern 2C)
  allRecords: StoreUpdate[];
  loading: boolean;
  error: string | null;
  
  // Client-side filtering and pagination (Section 5)
  filters: StoreUpdatesFilters;
  pagination: StoreUpdatesPagination;
  
  // Computed/derived state (Section 5: Performance Optimization)
  filteredRecords: StoreUpdate[];
  paginatedRecords: StoreUpdate[];
  totalFiltered: number;
  totalPages: number;
  
  // Dual-Source Hybrid Statistics (NEW - Architecture.md Section 4.5)
  statistics: StoreUpdatesStatistics;
  
  // NEW: Track if data-changing actions have been performed
  hasPerformedDataActions: boolean;
  
  // Actions (Section 5: ServiceNow Integration)
  actions: {
    // Server data sync (Pattern 2C integration)
    setServerData: (data: StoreUpdate[]) => void;
    clearData: () => void;
    
    // Dual-Source Statistics Management (NEW)
    setImmediateStats: (quickStats: any, userContext?: any) => void;
    updateCalculatedStats: () => void;
    refreshHybridStats: (selectedCount?: number) => void;
    
    // NEW: Mark that data-changing actions have been performed
    markDataActionsPerformed: () => void;
    
    // Client-side filtering (Section 5: Advanced Filtering) - SIMPLIFIED
    setSearch: (search: string) => void;
    setBatchLevelFilter: (batchLevels: string[]) => void;
    setPublishedDateFilter: (dates: string[]) => void; // NEW: Published date filter
    setSorting: (sortBy: string, sortDirection?: 'asc' | 'desc') => void;
    clearFilters: () => void;
    
    // Pagination (Section 5: Performance Optimization)
    setPage: (page: number) => void;
    setPageSize: (pageSize: number) => void;
    nextPage: () => void;
    previousPage: () => void;
    
    // Combined actions (Section 5: Selective Subscriptions)
    applyFiltersAndPagination: () => void;
  };
}

const defaultFilters: StoreUpdatesFilters = {
  search: '',
  batch_level: [],
  published_date: [], // NEW: Published date filter
  sortBy: 'sys_created_on',
  sortDirection: 'desc',
};

const defaultPagination: StoreUpdatesPagination = {
  page: 1,
  pageSize: 10, // UPDATED: Changed from 25 to 10 rows per page
};

// Default statistics state (Pattern 2A baseline)
const createDefaultStatistics = (): StoreUpdatesStatistics => ({
  immediateStats: {
    totalApplications: 0,
    totalMajorUpdates: 0,
    totalMinorUpdates: 0,
    totalPatchUpdates: 0,
    source: 'pattern-2a-immediate',
    timestamp: Date.now()
  },
  calculatedStats: null,
  activeStats: {
    totalApplications: 0,
    totalMajorUpdates: 0,
    totalMinorUpdates: 0,
    totalPatchUpdates: 0,
    criticalCount: 0,
    currentlyShown: 0,
    selectedCount: 0,
    source: 'pattern-2a-immediate',
    timestamp: Date.now(),
    isCalculatedPreferred: false,
    hasSignificantDifference: false,
    hasStringCorruption: false
  }
});

// Dual-Source Hybrid Statistics: String corruption detection
const hasStringCorruption = (stats: any): boolean => {
  const values = [stats.totalMajorUpdates, stats.totalMinorUpdates, stats.totalPatchUpdates];
  return values.some(val => 
    typeof val === 'string' && (val.length > 10 || val.includes('000000'))
  );
};

// Dual-Source Hybrid Statistics: Significant difference detection
const hasSignificantDifference = (immediate: any, calculated: any): boolean => {
  // Check application count difference (primary indicator of ACL issues)
  const appCountDiff = Math.abs(immediate.totalApplications - calculated.totalApplications);
  if (appCountDiff > 0) return true; // Any app count difference is significant
  
  const immediateTotal = immediate.totalMajorUpdates + immediate.totalMinorUpdates + immediate.totalPatchUpdates;
  const calculatedTotal = calculated.totalMajorUpdates + calculated.totalMinorUpdates + calculated.totalPatchUpdates;
  
  // Consider significant if difference is > 10% or > 5 absolute difference
  const percentDiff = Math.abs(immediateTotal - calculatedTotal) / Math.max(immediateTotal, 1);
  const absoluteDiff = Math.abs(immediateTotal - calculatedTotal);
  
  return percentDiff > 0.1 || absoluteDiff > 5;
};

// FIXED: Safe numeric conversion function for ServiceNow API strings
const safeParseInt = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

// Helper function to format dates for comparison
const formatDateForComparison = (dateString?: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '';
  }
};

// Client-side filtering function (Section 5: Advanced Filtering) - SIMPLIFIED
const applyFilters = (records: StoreUpdate[], filters: StoreUpdatesFilters): StoreUpdate[] => {
  let filtered = [...records];

  // Apply search filter
  if (filters.search.trim()) {
    const searchTerm = filters.search.toLowerCase().trim();
    filtered = filtered.filter(record => 
      record.name?.toLowerCase().includes(searchTerm) ||
      record.batch_level?.toLowerCase().includes(searchTerm) ||
      record.installed_version?.toLowerCase().includes(searchTerm) ||
      record.available_version_short_description?.toLowerCase().includes(searchTerm)
    );
  }

  // Apply batch level filter
  if (filters.batch_level.length > 0) {
    filtered = filtered.filter(record => 
      filters.batch_level.includes(record.batch_level)
    );
  }

  // Apply published date filter - NEW
  if (filters.published_date.length > 0) {
    filtered = filtered.filter(record => {
      const recordDate = formatDateForComparison(record.available_version_publish_date);
      return recordDate && filters.published_date.includes(recordDate);
    });
  }

  // Apply sorting
  if (filters.sortBy) {
    filtered.sort((a, b) => {
      const aVal = (a as any)[filters.sortBy];
      const bVal = (b as any)[filters.sortBy];
      
      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;
      
      return filters.sortDirection === 'desc' ? -comparison : comparison;
    });
  }

  return filtered;
};

// Client-side pagination function (Section 5: Performance Optimization)
const applyPagination = (records: StoreUpdate[], pagination: StoreUpdatesPagination): StoreUpdate[] => {
  const validPage = Math.max(1, pagination.page || 1);
  const validPageSize = Math.max(1, pagination.pageSize || 10); // UPDATED: Default fallback changed to 10
  
  const startIndex = (validPage - 1) * validPageSize;
  const endIndex = startIndex + validPageSize;
  
  return records.slice(startIndex, endIndex);
};

export const useStoreUpdatesStore = create<StoreUpdatesState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      allRecords: [],
      loading: false,
      error: null,
      filters: { ...defaultFilters },
      pagination: { ...defaultPagination },
      filteredRecords: [],
      paginatedRecords: [],
      totalFiltered: 0,
      totalPages: 1,
      statistics: createDefaultStatistics(),
      hasPerformedDataActions: false, // NEW: Track data-changing actions

      actions: {
        // Pattern 2C: Sync server data from TanStack Query
        setServerData: (data: StoreUpdate[]) => {
          logger.info('Syncing server data to Zustand store', createLogContext({
            pattern: 'hybrid-data-sync',
            serverRecords: data.length,
            syncDirection: 'server-to-client',
            defaultPageSize: 10 // UPDATED: Log new default page size
          }));

          set({ 
            allRecords: data, 
            loading: false, 
            error: null 
          });

          // Apply filters and pagination to new server data
          get().actions.applyFiltersAndPagination();
          
          // Update calculated statistics from fresh server data
          get().actions.updateCalculatedStats();
        },

        clearData: () => {
          logger.info('Clearing Zustand store data', createLogContext({
            pattern: 'data-clear',
            previousRecordCount: get().allRecords.length
          }));
          
          set({
            allRecords: [],
            filteredRecords: [],
            paginatedRecords: [],
            totalFiltered: 0,
            totalPages: 1,
            error: null
          });
          
          // Reset calculated stats but keep immediate stats
          const currentStats = get().statistics;
          set({
            statistics: {
              ...currentStats,
              calculatedStats: null,
              activeStats: {
                ...currentStats.immediateStats,
                criticalCount: 0,
                currentlyShown: 0,
                selectedCount: 0,
                source: 'pattern-2a-immediate',
                isCalculatedPreferred: false,
                hasSignificantDifference: false,
                hasStringCorruption: false
              }
            }
          });
        },

        // Dual-Source Statistics: Set Pattern 2A immediate stats
        setImmediateStats: (quickStats: any, userContext?: any) => {
          const immediateStats = {
            totalApplications: parseInt(quickStats.totalRecords?.toString() || '0'),
            totalMajorUpdates: parseInt(quickStats.levelDistribution?.major || '0'),
            totalMinorUpdates: parseInt(quickStats.levelDistribution?.minor || '0'),
            totalPatchUpdates: parseInt(quickStats.levelDistribution?.patch || '0'),
            source: 'pattern-2a-immediate' as const,
            timestamp: Date.now()
          };

          logger.info('Setting Pattern 2A immediate statistics', createLogContext({
            pattern: '2a-immediate-stats',
            totalApplications: immediateStats.totalApplications,
            totalMajorUpdates: immediateStats.totalMajorUpdates,
            totalMinorUpdates: immediateStats.totalMinorUpdates,
            totalPatchUpdates: immediateStats.totalPatchUpdates,
            userContext: userContext?.firstName || 'Unknown'
          }));

          set(state => ({
            statistics: {
              ...state.statistics,
              immediateStats,
              activeStats: {
                ...immediateStats,
                criticalCount: state.statistics.activeStats.criticalCount,
                currentlyShown: state.statistics.activeStats.currentlyShown,
                selectedCount: state.statistics.activeStats.selectedCount,
                isCalculatedPreferred: false,
                hasSignificantDifference: false,
                hasStringCorruption: false
              }
            }
          }));

          // Refresh hybrid logic
          get().actions.refreshHybridStats();
        },

        // Pattern 2C: Calculate statistics from server data  
        updateCalculatedStats: () => {
          const state = get();
          const records = state.allRecords;

          if (records.length === 0) {
            return; // No data to calculate from
          }

          // FIXED: Calculate the same way as Pattern 2A - count applications by level, not sum update counts
          const calculatedStats = {
            totalApplications: records.length,
            // Count applications by their 'level' field (same as Pattern 2A)
            totalMajorUpdates: records.filter(record => record.level === 'major').length,
            totalMinorUpdates: records.filter(record => record.level === 'minor').length,
            totalPatchUpdates: records.filter(record => record.level === 'patch').length,
            source: 'pattern-2c-calculated' as const,
            timestamp: Date.now()
          };

          logger.info('Updating Pattern 2C calculated statistics (FIXED: Count by level, not sum counts)', createLogContext({
            pattern: '2c-calculated-stats-fixed',
            totalApplications: calculatedStats.totalApplications,
            totalMajorUpdates: calculatedStats.totalMajorUpdates,
            totalMinorUpdates: calculatedStats.totalMinorUpdates,
            totalPatchUpdates: calculatedStats.totalPatchUpdates,
            sourceRecords: records.length,
            calculationMethod: 'count-by-level-field',
            fixApplied: 'match-pattern-2a-calculation'
          }));

          set(state => ({
            statistics: {
              ...state.statistics,
              calculatedStats
            }
          }));

          // Refresh hybrid logic
          get().actions.refreshHybridStats();
        },

        // CORRECTED: Context-aware hybrid logic - Pattern 2A until data actions, then Pattern 2C
        refreshHybridStats: (selectedCount?: number) => {
          const state = get();
          const { immediateStats, calculatedStats } = state.statistics;

          // Calculate critical count using actual batch_level values
          const criticalCount = state.filteredRecords.filter(record => 
            record.batch_level === 'major'
          ).length;
          
          const currentlyShown = state.paginatedRecords.length;
          const finalSelectedCount = selectedCount ?? state.statistics.activeStats.selectedCount;

          // Hybrid decision logic variables
          const isCalculatedAvailable = calculatedStats !== null;
          const calculatedCorruption = isCalculatedAvailable ? hasStringCorruption(calculatedStats) : true;
          const significantDiff = isCalculatedAvailable ? 
            hasSignificantDifference(immediateStats, calculatedStats) : false;

          // CORRECTED: Context-aware hybrid logic
          let useCalculated = false;
          let reason = 'initial-load-prefer-2a';

          if (state.hasPerformedDataActions) {
            // After data actions: prefer Pattern 2C (API data reflects changes)
            if (isCalculatedAvailable && !calculatedCorruption) {
              useCalculated = true;
              reason = 'post-action-prefer-2c';
            } else {
              reason = 'post-action-fallback-to-2a';
            }
          } else {
            // Initial load: prefer Pattern 2A (server-injected data is correct)
            // Only use Pattern 2C if Pattern 2A data is invalid
            if (!immediateStats || immediateStats.totalApplications === 0) {
              if (isCalculatedAvailable && !calculatedCorruption) {
                useCalculated = true;
                reason = 'initial-2a-unavailable-use-2c';
              } else {
                reason = 'initial-2a-unavailable-no-fallback';
              }
            } else {
              reason = 'initial-load-prefer-2a';
            }
          }

          const sourceStats = useCalculated ? calculatedStats : immediateStats;

          const activeStats = {
            totalApplications: sourceStats.totalApplications,
            totalMajorUpdates: sourceStats.totalMajorUpdates,
            totalMinorUpdates: sourceStats.totalMinorUpdates,
            totalPatchUpdates: sourceStats.totalPatchUpdates,
            criticalCount,
            currentlyShown,
            selectedCount: finalSelectedCount,
            source: sourceStats.source,
            timestamp: Date.now(),
            isCalculatedPreferred: useCalculated,
            hasSignificantDifference: significantDiff,
            hasStringCorruption: calculatedCorruption
          } as const;

          logger.info('Context-aware hybrid statistics decision', createLogContext({
            pattern: 'hybrid-stats-context-aware',
            sourceUsed: activeStats.source,
            isCalculatedPreferred: activeStats.isCalculatedPreferred,
            hasPerformedDataActions: state.hasPerformedDataActions,
            decisionReason: reason,
            hasSignificantDifference: activeStats.hasSignificantDifference,
            hasStringCorruption: activeStats.hasStringCorruption,
            criticalCount: activeStats.criticalCount,
            finalStats: {
              major: activeStats.totalMajorUpdates,
              minor: activeStats.totalMinorUpdates,
              patch: activeStats.totalPatchUpdates,
              applications: activeStats.totalApplications
            },
            pattern2AData: immediateStats ? {
              total: immediateStats.totalApplications,
              major: immediateStats.totalMajorUpdates,
              minor: immediateStats.totalMinorUpdates,
              patch: immediateStats.totalPatchUpdates
            } : null,
            pattern2CData: calculatedStats ? {
              total: calculatedStats.totalApplications,
              major: calculatedStats.totalMajorUpdates,
              minor: calculatedStats.totalMinorUpdates,
              patch: calculatedStats.totalPatchUpdates
            } : null
          }));

          set(state => ({
            statistics: {
              ...state.statistics,
              activeStats
            }
          }));
        },

        // SIMPLIFIED: Advanced Filtering with ServiceNow Integration
        setSearch: (search: string) => {
          set(state => ({
            filters: { ...state.filters, search },
            pagination: { ...state.pagination, page: 1 } // Reset to first page
          }));
          
          get().actions.applyFiltersAndPagination();
          get().actions.refreshHybridStats(); // Update stats after filtering
        },

        setBatchLevelFilter: (batchLevels: string[]) => {
          set(state => ({
            filters: { ...state.filters, batch_level: batchLevels },
            pagination: { ...state.pagination, page: 1 }
          }));
          get().actions.applyFiltersAndPagination();
          get().actions.refreshHybridStats(); // Update stats after filtering
        },

        // NEW: Published date filter
        setPublishedDateFilter: (dates: string[]) => {
          set(state => ({
            filters: { ...state.filters, published_date: dates },
            pagination: { ...state.pagination, page: 1 }
          }));
          get().actions.applyFiltersAndPagination();
          get().actions.refreshHybridStats(); // Update stats after filtering
        },

        setSorting: (sortBy: string, sortDirection?: 'asc' | 'desc') => {
          const state = get();
          const newDirection = sortDirection || 
            (state.filters.sortBy === sortBy && state.filters.sortDirection === 'asc' ? 'desc' : 'asc');
          
          set(state => ({
            filters: { ...state.filters, sortBy, sortDirection: newDirection }
          }));
          get().actions.applyFiltersAndPagination();
          get().actions.refreshHybridStats(); // Update stats after sorting
        },

        clearFilters: () => {
          logger.info('Clearing all filters', createLogContext({
            pattern: 'filter-clear',
            previousFilters: get().filters
          }));
          
          set({
            filters: { ...defaultFilters },
            pagination: { ...defaultPagination }
          });
          get().actions.applyFiltersAndPagination();
          get().actions.refreshHybridStats(); // Update stats after clearing filters
        },

        // NEW: Mark that data-changing actions have been performed
        markDataActionsPerformed: () => {
          logger.info('Marking data actions as performed - Pattern 2C will now be preferred', createLogContext({
            pattern: 'data-actions-performed',
            previousState: get().hasPerformedDataActions
          }));
          
          set({ hasPerformedDataActions: true });
          
          // Refresh hybrid stats to switch to Pattern 2C
          get().actions.refreshHybridStats();
        },

        // Section 5: Performance Optimization with proper validation
        setPage: (requestedPage: number) => {
          const state = get();
          const pageNumber = typeof requestedPage === 'number' && !isNaN(requestedPage) 
            ? requestedPage 
            : 1;
          
          const validPage = Math.max(1, Math.min(pageNumber, state.totalPages || 1));
          
          if (validPage !== state.pagination.page) {
            set(state => ({
              pagination: { ...state.pagination, page: validPage }
            }));
            get().actions.applyFiltersAndPagination();
            get().actions.refreshHybridStats(); // Update stats after pagination
          }
        },

        setPageSize: (pageSize: number) => {
          const validPageSize = Math.max(1, pageSize);
          
          set(state => ({
            pagination: { page: 1, pageSize: validPageSize }
          }));
          get().actions.applyFiltersAndPagination();
          get().actions.refreshHybridStats(); // Update stats after page size change
        },

        nextPage: () => {
          const state = get();
          if (state.pagination.page < state.totalPages) {
            get().actions.setPage(state.pagination.page + 1);
          }
        },

        previousPage: () => {
          const state = get();
          if (state.pagination.page > 1) {
            get().actions.setPage(state.pagination.page - 1);
          }
        },

        // Section 5: Selective Subscriptions - Core computation function
        applyFiltersAndPagination: () => {
          const state = get();
          
          // Apply filters to all records
          const filteredRecords = applyFilters(state.allRecords, state.filters);
          
          // Calculate pagination values
          const totalFiltered = filteredRecords.length;
          const totalPages = Math.max(1, Math.ceil(totalFiltered / state.pagination.pageSize));
          
          // Ensure current page is valid for filtered results
          const finalPage = Math.min(state.pagination.page, totalPages);
          const finalPagination = { ...state.pagination, page: finalPage };
          
          // Apply pagination to filtered records
          const paginatedRecords = applyPagination(filteredRecords, finalPagination);

          // Update state with computed values
          set({
            filteredRecords,
            paginatedRecords,
            totalFiltered,
            totalPages,
            pagination: finalPagination
          });
        }
      }
    })),
    {
      name: 'store-updates-simplified-filters',
      // Only persist pagination preferences (Section 5: Development Experience)
      partialize: (state: StoreUpdatesState) => ({
        pagination: {
          pageSize: state.pagination.pageSize
        }
      })
    }
  )
);

// ✅ FIXED: Removed problematic setTimeout initialization that caused MantineProvider timing issues
// The store will initialize naturally when first accessed by components after MantineProvider is ready