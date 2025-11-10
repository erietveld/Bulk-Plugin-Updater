// src/stores/batchProgressStore.ts
// Zustand store for batch operation progress management
// Following Architecture.md separation of concerns - Global state management
// Handles progress tracking for installation operations with ServiceNow progress worker integration

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Batch operation types
export type BatchOperationType = 'install-all' | 'install-critical' | 'install-patches' | string;

export type BatchOperationStatus = 
  | 'idle' 
  | 'preparing' 
  | 'calling-api' 
  | 'started' 
  | 'running' 
  | 'complete' 
  | 'error';

// Batch progress state interface
export interface BatchProgress {
  // Operation identification
  operationId: string | null;
  operationType: BatchOperationType | null;
  
  // Status and progress
  status: BatchOperationStatus;
  progress: number; // 0-100
  message: string;
  
  // ServiceNow integration
  progressWorkerId: string | null; // From subflow response
  selectedIds: string[];
  
  // Timestamps
  startTime: number | null;
  endTime: number | null;
  
  // Error handling
  error: string | null;
  errorDetails: any;
}

// Store actions interface
export interface BatchProgressActions {
  // Operation lifecycle
  startOperation: (operationType: BatchOperationType, selectedIds: string[]) => string;
  updateStatus: (status: BatchOperationStatus, message?: string) => void;
  updateProgress: (progress: number, message?: string) => void;
  setProgressWorkerId: (progressWorkerId: string) => void;
  completeOperation: (message?: string) => void;
  errorOperation: (error: string, details?: any) => void;
  resetOperation: () => void;
  
  // Progress worker polling
  startProgressPolling: (progressWorkerId: string) => void;
  stopProgressPolling: () => void;
  
  // Computed getters
  isActive: () => boolean;
  getDuration: () => number | null;
  getOperationSummary: () => string;
}

// Combined store interface
export interface BatchProgressStore extends BatchProgress, BatchProgressActions {}

// Create the Zustand store with subscribeWithSelector middleware for selective re-renders
export const useBatchProgressStore = create<BatchProgressStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    operationId: null,
    operationType: null,
    status: 'idle',
    progress: 0,
    message: '',
    progressWorkerId: null,
    selectedIds: [],
    startTime: null,
    endTime: null,
    error: null,
    errorDetails: null,

    // Actions
    startOperation: (operationType: BatchOperationType, selectedIds: string[]) => {
      const operationId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = Date.now();
      
      set({
        operationId,
        operationType,
        selectedIds: [...selectedIds],
        status: 'preparing',
        progress: 0,
        message: 'Initializing batch operation...',
        progressWorkerId: null,
        startTime,
        endTime: null,
        error: null,
        errorDetails: null
      });
      
      return operationId;
    },

    updateStatus: (status: BatchOperationStatus, message?: string) => {
      set(state => ({
        status,
        message: message || state.message
      }));
    },

    updateProgress: (progress: number, message?: string) => {
      set(state => ({
        progress: Math.min(100, Math.max(0, progress)),
        message: message || state.message
      }));
    },

    setProgressWorkerId: (progressWorkerId: string) => {
      set({
        progressWorkerId,
        status: 'started',
        message: 'Installation process started - tracking progress...'
      });
    },

    completeOperation: (message?: string) => {
      set({
        status: 'complete',
        progress: 100,
        message: message || 'Operation completed successfully',
        endTime: Date.now()
      });
    },

    errorOperation: (error: string, details?: any) => {
      set({
        status: 'error',
        error,
        errorDetails: details,
        message: `Operation failed: ${error}`,
        endTime: Date.now()
      });
    },

    resetOperation: () => {
      // Stop any active polling first
      get().stopProgressPolling();
      
      set({
        operationId: null,
        operationType: null,
        status: 'idle',
        progress: 0,
        message: '',
        progressWorkerId: null,
        selectedIds: [],
        startTime: null,
        endTime: null,
        error: null,
        errorDetails: null
      });
    },

    // Progress worker polling (will be implemented in custom hook)
    startProgressPolling: (progressWorkerId: string) => {
      // Implementation will be in the custom hook that uses this store
      console.log('Starting progress polling for:', progressWorkerId);
    },

    stopProgressPolling: () => {
      // Implementation will be in the custom hook that uses this store
      console.log('Stopping progress polling');
    },

    // Computed getters
    isActive: () => {
      const state = get();
      return !['idle', 'complete', 'error'].includes(state.status);
    },

    getDuration: () => {
      const state = get();
      if (!state.startTime) return null;
      const endTime = state.endTime || Date.now();
      return endTime - state.startTime;
    },

    getOperationSummary: () => {
      const state = get();
      const duration = state.getDuration();
      const durationText = duration ? ` (${Math.round(duration / 1000)}s)` : '';
      
      return `${state.operationType || 'Operation'}: ${state.selectedIds.length} items${durationText}`;
    }
  }))
);

// Selector hooks for performance optimization
export const useBatchOperationStatus = () => 
  useBatchProgressStore(state => state.status);

export const useBatchOperationProgress = () => 
  useBatchProgressStore(state => ({ 
    progress: state.progress, 
    message: state.message 
  }));

export const useBatchOperationSummary = () => 
  useBatchProgressStore(state => ({
    operationType: state.operationType,
    selectedCount: state.selectedIds.length,
    isActive: state.isActive(),
    summary: state.getOperationSummary()
  }));

export const useBatchOperationError = () =>
  useBatchProgressStore(state => ({
    error: state.error,
    errorDetails: state.errorDetails,
    hasError: state.status === 'error'
  }));