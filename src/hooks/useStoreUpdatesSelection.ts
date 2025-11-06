// src/hooks/useStoreUpdatesSelection.ts
// Multi-select state management for Store Updates batch operations
// Following Architecture.md Section 5 - Zustand selective subscriptions

import React, { useCallback, useMemo } from 'react';
import { logger } from '../monitoring/logger';
import type { StoreUpdate } from './useStoreUpdatesHybrid';

export interface StoreUpdatesSelection {
  selectedIds: string[];
  selectedRecords: StoreUpdate[];
  selectionMode: 'none' | 'single' | 'multiple';
  lastSelectedId: string | null;
}

export interface BatchOperation {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  requiresConfirmation: boolean;
  minSelection: number;
  maxSelection?: number;
  allowedLevels?: Array<'major' | 'minor' | 'patch'>;
  allowedBatchLevels?: Array<'critical' | 'high' | 'medium' | 'low'>;
  applicableCount?: number;
}

// Available batch operations
export const batchOperations: BatchOperation[] = [
  {
    id: 'install-all',
    label: 'Install All Selected',
    description: 'Install all selected updates using CI/CD batch installer',
    icon: 'IconDownload',
    color: 'blue',
    requiresConfirmation: true,
    minSelection: 1,
    maxSelection: 50,
  },
  {
    id: 'install-critical',
    label: 'Install Critical Only',
    description: 'Install only critical priority updates from selection',
    icon: 'IconUrgent',
    color: 'red',
    requiresConfirmation: true,
    minSelection: 1,
    allowedBatchLevels: ['critical'],
  },
  {
    id: 'install-patches',
    label: 'Install Patches Only',
    description: 'Install only patch-level updates from selection',
    icon: 'IconBandage',
    color: 'green',
    requiresConfirmation: false,
    minSelection: 1,
    allowedLevels: ['patch'],
  },
  {
    id: 'schedule-installation',
    label: 'Schedule Installation',
    description: 'Schedule selected updates for later installation',
    icon: 'IconClock',
    color: 'yellow',
    requiresConfirmation: false,
    minSelection: 1,
  },
  {
    id: 'export-selection',
    label: 'Export Selection',
    description: 'Export selected updates to CSV for review',
    icon: 'IconFileExport',
    color: 'gray',
    requiresConfirmation: false,
    minSelection: 1,
  },
  {
    id: 'mark-reviewed',
    label: 'Mark as Reviewed',
    description: 'Mark selected updates as reviewed by administrator',
    icon: 'IconEye',
    color: 'teal',
    requiresConfirmation: false,
    minSelection: 1,
  },
];

/**
 * Hook for managing Store Updates selection state and batch operations
 * Implements selective subscriptions and performance optimization
 */
export const useStoreUpdatesSelection = (allRecords: StoreUpdate[] = []) => {
  // Get current selection state - simplified for now
  const currentSelection: StoreUpdatesSelection = useMemo(() => {
    // For now, create a simple in-memory selection state
    // In production, this would be integrated with Zustand store
    return {
      selectedIds: [],
      selectedRecords: [],
      selectionMode: 'multiple' as const,
      lastSelectedId: null,
    };
  }, []);

  // Internal state for managing selections (temporary implementation)
  const [internalSelection, setInternalSelection] = React.useState<StoreUpdatesSelection>(currentSelection);

  // Update selection state
  const updateSelection = useCallback((updates: Partial<StoreUpdatesSelection>) => {
    const newSelection = { ...internalSelection, ...updates };
    setInternalSelection(newSelection);
    
    logger.info('Store Updates selection updated', {
      selectedCount: newSelection.selectedIds.length,
      selectionMode: newSelection.selectionMode,
      updates
    });
  }, [internalSelection]);

  // Select single record
  const selectRecord = useCallback((record: StoreUpdate, mode: 'add' | 'replace' | 'toggle' = 'add') => {
    const recordId = record.sys_id;
    let newSelectedIds: string[];
    let newSelectedRecords: StoreUpdate[];

    switch (mode) {
      case 'replace':
        newSelectedIds = [recordId];
        newSelectedRecords = [record];
        break;
      
      case 'toggle':
        if (internalSelection.selectedIds.includes(recordId)) {
          newSelectedIds = internalSelection.selectedIds.filter(id => id !== recordId);
          newSelectedRecords = internalSelection.selectedRecords.filter(r => r.sys_id !== recordId);
        } else {
          newSelectedIds = [...internalSelection.selectedIds, recordId];
          newSelectedRecords = [...internalSelection.selectedRecords, record];
        }
        break;
      
      case 'add':
      default:
        if (!internalSelection.selectedIds.includes(recordId)) {
          newSelectedIds = [...internalSelection.selectedIds, recordId];
          newSelectedRecords = [...internalSelection.selectedRecords, record];
        } else {
          newSelectedIds = internalSelection.selectedIds;
          newSelectedRecords = internalSelection.selectedRecords;
        }
        break;
    }

    updateSelection({
      selectedIds: newSelectedIds,
      selectedRecords: newSelectedRecords,
      lastSelectedId: recordId,
    });
  }, [internalSelection, updateSelection]);

  // Select multiple records
  const selectRecords = useCallback((records: StoreUpdate[], mode: 'add' | 'replace' = 'add') => {
    const recordIds = records.map(r => r.sys_id);
    
    let newSelectedIds: string[];
    let newSelectedRecords: StoreUpdate[];

    if (mode === 'replace') {
      newSelectedIds = recordIds;
      newSelectedRecords = records;
    } else {
      // Add mode - merge with existing selection
      const existingIds = new Set(internalSelection.selectedIds);
      const existingRecordsMap = new Map(internalSelection.selectedRecords.map(r => [r.sys_id, r]));
      
      records.forEach(record => {
        if (!existingIds.has(record.sys_id)) {
          existingIds.add(record.sys_id);
          existingRecordsMap.set(record.sys_id, record);
        }
      });
      
      newSelectedIds = Array.from(existingIds);
      newSelectedRecords = Array.from(existingRecordsMap.values());
    }

    updateSelection({
      selectedIds: newSelectedIds,
      selectedRecords: newSelectedRecords,
      lastSelectedId: recordIds[recordIds.length - 1] || null,
    });
  }, [internalSelection, updateSelection]);

  // Deselect records
  const deselectRecords = useCallback((recordIds: string[]) => {
    const idsToRemove = new Set(recordIds);
    
    const newSelectedIds = internalSelection.selectedIds.filter(id => !idsToRemove.has(id));
    const newSelectedRecords = internalSelection.selectedRecords.filter(r => !idsToRemove.has(r.sys_id));

    updateSelection({
      selectedIds: newSelectedIds,
      selectedRecords: newSelectedRecords,
      lastSelectedId: newSelectedIds[newSelectedIds.length - 1] || null,
    });
  }, [internalSelection, updateSelection]);

  // Select all visible records
  const selectAllVisible = useCallback(() => {
    selectRecords(allRecords, 'replace');
    logger.info('Selected all visible Store Updates', { count: allRecords.length });
  }, [allRecords, selectRecords]);

  // Clear all selection
  const clearSelection = useCallback(() => {
    updateSelection({
      selectedIds: [],
      selectedRecords: [],
      lastSelectedId: null,
    });
    logger.info('Cleared Store Updates selection');
  }, [updateSelection]);

  // Toggle select all
  const toggleSelectAll = useCallback(() => {
    if (internalSelection.selectedIds.length === allRecords.length && allRecords.length > 0) {
      clearSelection();
    } else {
      selectAllVisible();
    }
  }, [internalSelection.selectedIds.length, allRecords.length, clearSelection, selectAllVisible]);

  // Range selection (shift-click)
  const selectRange = useCallback((endRecord: StoreUpdate) => {
    if (!internalSelection.lastSelectedId || allRecords.length === 0) {
      selectRecord(endRecord);
      return;
    }

    const startIndex = allRecords.findIndex(r => r.sys_id === internalSelection.lastSelectedId);
    const endIndex = allRecords.findIndex(r => r.sys_id === endRecord.sys_id);

    if (startIndex === -1 || endIndex === -1) {
      selectRecord(endRecord);
      return;
    }

    const rangeStart = Math.min(startIndex, endIndex);
    const rangeEnd = Math.max(startIndex, endIndex);
    const rangeRecords = allRecords.slice(rangeStart, rangeEnd + 1);

    selectRecords(rangeRecords, 'add');
    
    logger.info('Selected range of Store Updates', {
      startIndex,
      endIndex,
      count: rangeRecords.length
    });
  }, [internalSelection.lastSelectedId, allRecords, selectRecord, selectRecords]);

  // Check if record is selected
  const isRecordSelected = useCallback((recordId: string) => {
    return internalSelection.selectedIds.includes(recordId);
  }, [internalSelection.selectedIds]);

  // Get available batch operations based on current selection
  const availableBatchOperations = useMemo(() => {
    const selectedCount = internalSelection.selectedIds.length;
    const selectedRecords = internalSelection.selectedRecords;

    if (selectedCount === 0) {
      return [];
    }

    return batchOperations.filter(operation => {
      // Check minimum selection
      if (selectedCount < operation.minSelection) {
        return false;
      }

      // Check maximum selection
      if (operation.maxSelection && selectedCount > operation.maxSelection) {
        return false;
      }

      // Check allowed levels
      if (operation.allowedLevels) {
        const hasAllowedLevel = selectedRecords.some(record => 
          operation.allowedLevels!.includes(record.level)
        );
        if (!hasAllowedLevel) {
          return false;
        }
      }

      // Check allowed batch levels
      if (operation.allowedBatchLevels) {
        const hasAllowedBatchLevel = selectedRecords.some(record =>
          operation.allowedBatchLevels!.includes(record.batch_level)
        );
        if (!hasAllowedBatchLevel) {
          return false;
        }
      }

      return true;
    }).map(operation => ({
      ...operation,
      applicableCount: operation.allowedLevels 
        ? selectedRecords.filter(r => operation.allowedLevels!.includes(r.level)).length
        : operation.allowedBatchLevels
        ? selectedRecords.filter(r => operation.allowedBatchLevels!.includes(r.batch_level)).length
        : selectedCount
    }));
  }, [internalSelection]);

  // Selection statistics and insights
  const selectionStats = useMemo(() => {
    const selectedRecords = internalSelection.selectedRecords;
    const totalSelected = selectedRecords.length;

    if (totalSelected === 0) {
      return {
        totalSelected: 0,
        levelBreakdown: {},
        batchLevelBreakdown: {},
        totalUpdates: { major: 0, minor: 0, patch: 0 },
        allRecordsSelected: false,
        hasSelection: false,
      };
    }

    // Level breakdown
    const levelBreakdown = selectedRecords.reduce((acc, record) => {
      acc[record.level] = (acc[record.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Batch level breakdown
    const batchLevelBreakdown = selectedRecords.reduce((acc, record) => {
      acc[record.batch_level] = (acc[record.batch_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Total updates
    const totalUpdates = selectedRecords.reduce(
      (acc, record) => ({
        major: acc.major + (record.major_count || 0),
        minor: acc.minor + (record.minor_count || 0),
        patch: acc.patch + (record.patch_count || 0),
      }),
      { major: 0, minor: 0, patch: 0 }
    );

    return {
      totalSelected,
      levelBreakdown,
      batchLevelBreakdown,
      totalUpdates,
      allRecordsSelected: totalSelected === allRecords.length && allRecords.length > 0,
      hasSelection: totalSelected > 0,
    };
  }, [internalSelection.selectedRecords, allRecords.length]);

  return {
    // Current state
    selection: internalSelection,
    stats: selectionStats,
    
    // Selection actions
    selectRecord,
    selectRecords,
    deselectRecords,
    selectAllVisible,
    clearSelection,
    toggleSelectAll,
    selectRange,
    
    // Utilities
    isRecordSelected,
    
    // Batch operations
    availableBatchOperations,
    batchOperations,
    
    // Configuration
    selectionMode: internalSelection.selectionMode,
  };
};

/**
 * Hook for handling keyboard shortcuts and bulk selection interactions
 */
export const useStoreUpdatesSelectionKeyboard = (
  selection: ReturnType<typeof useStoreUpdatesSelection>,
  allRecords: StoreUpdate[]
) => {
  // Handle record click with keyboard modifiers
  const handleRecordClick = useCallback((
    record: StoreUpdate,
    event: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean }
  ) => {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;

    if (isShift) {
      // Range selection
      selection.selectRange(record);
    } else if (isCtrlOrCmd) {
      // Toggle selection
      selection.selectRecord(record, 'toggle');
    } else {
      // Single selection (replace)
      selection.selectRecord(record, 'replace');
    }

    logger.info('Record click handled', {
      recordId: record.sys_id,
      isCtrlOrCmd,
      isShift,
      selectedCount: selection.selection.selectedIds.length
    });
  }, [selection]);

  // Handle keyboard shortcuts
  const handleKeyboard = useCallback((event: KeyboardEvent) => {
    // Ctrl/Cmd + A - Select all
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      event.preventDefault();
      selection.toggleSelectAll();
    }
    
    // Escape - Clear selection
    if (event.key === 'Escape') {
      selection.clearSelection();
    }
    
    // Delete - Could trigger batch delete operation
    if (event.key === 'Delete' && selection.stats.hasSelection) {
      event.preventDefault();
      logger.info('Delete key pressed with selection', {
        selectedCount: selection.stats.totalSelected
      });
      // This would trigger a batch delete confirmation
    }
  }, [selection]);

  return {
    handleRecordClick,
    handleKeyboard,
  };
};