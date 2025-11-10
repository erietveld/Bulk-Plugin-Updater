// src/stores/performanceStore.ts
// Performance metrics global state
// Following atomic design principle: Zustand Stores handle global state

import { create } from 'zustand';

interface PerformanceMetrics {
  themeSwitchCount: number;
  averageSwitchTime: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsage: number;
  slowSwitches: number;
  fastSwitches: number;
  colorSchemeChanges: number;
  systemPreferenceDetections: number;
  validationFailures: number;
  performanceAlertCount: number;
  developmentModeActivations: number;
}

interface DevelopmentMetrics {
  userInteractions: {
    themeSwitches: number;
    colorSchemeToggles: number;
    debugModeActivations: number;
  };
}

interface PerformanceState {
  metrics: PerformanceMetrics;
  developmentMetrics: DevelopmentMetrics;
  alerts: Array<{
    timestamp: number;
    type: 'slow-load' | 'memory-leak' | 'validation-fail';
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
}

interface PerformanceActions {
  incrementThemeSwitch: (switchTime: number) => void;
  incrementCacheHit: () => void;
  incrementCacheMiss: () => void;
  incrementColorSchemeChange: () => void;
  incrementSystemPreferenceDetection: () => void;
  incrementValidationFailure: () => void;
  incrementUserInteraction: (type: keyof DevelopmentMetrics['userInteractions']) => void;
  addAlert: (alert: PerformanceState['alerts'][0]) => void;
  updateMemoryUsage: (memoryKB: number) => void;
  reset: () => void;
}

interface PerformanceStore extends PerformanceState {
  actions: PerformanceActions;
}

const initialState: PerformanceState = {
  metrics: {
    themeSwitchCount: 0,
    averageSwitchTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    memoryUsage: 0,
    slowSwitches: 0,
    fastSwitches: 0,
    colorSchemeChanges: 0,
    systemPreferenceDetections: 0,
    validationFailures: 0,
    performanceAlertCount: 0,
    developmentModeActivations: 0,
  },
  developmentMetrics: {
    userInteractions: {
      themeSwitches: 0,
      colorSchemeToggles: 0,
      debugModeActivations: 0,
    },
  },
  alerts: [],
};

export const usePerformanceStore = create<PerformanceStore>((set, get) => ({
  ...initialState,
  
  actions: {
    incrementThemeSwitch: (switchTime: number) => {
      set((state) => {
        const newCount = state.metrics.themeSwitchCount + 1;
        const newAverage = 
          (state.metrics.averageSwitchTime * (newCount - 1) + switchTime) / newCount;
        
        const performanceCategory = switchTime > 100 ? 'slowSwitches' : 
                                  switchTime < 50 ? 'fastSwitches' : null;
        
        return {
          metrics: {
            ...state.metrics,
            themeSwitchCount: newCount,
            averageSwitchTime: newAverage,
            ...(performanceCategory && {
              [performanceCategory]: state.metrics[performanceCategory] + 1
            }),
          },
          developmentMetrics: {
            ...state.developmentMetrics,
            userInteractions: {
              ...state.developmentMetrics.userInteractions,
              themeSwitches: state.developmentMetrics.userInteractions.themeSwitches + 1,
            },
          },
        };
      });
    },
    
    incrementCacheHit: () => {
      set((state) => ({
        metrics: {
          ...state.metrics,
          cacheHits: state.metrics.cacheHits + 1,
        },
      }));
    },
    
    incrementCacheMiss: () => {
      set((state) => ({
        metrics: {
          ...state.metrics,
          cacheMisses: state.metrics.cacheMisses + 1,
        },
      }));
    },
    
    incrementColorSchemeChange: () => {
      set((state) => ({
        metrics: {
          ...state.metrics,
          colorSchemeChanges: state.metrics.colorSchemeChanges + 1,
        },
        developmentMetrics: {
          ...state.developmentMetrics,
          userInteractions: {
            ...state.developmentMetrics.userInteractions,
            colorSchemeToggles: state.developmentMetrics.userInteractions.colorSchemeToggles + 1,
          },
        },
      }));
    },
    
    incrementSystemPreferenceDetection: () => {
      set((state) => ({
        metrics: {
          ...state.metrics,
          systemPreferenceDetections: state.metrics.systemPreferenceDetections + 1,
        },
      }));
    },
    
    incrementValidationFailure: () => {
      set((state) => ({
        metrics: {
          ...state.metrics,
          validationFailures: state.metrics.validationFailures + 1,
        },
      }));
    },
    
    incrementUserInteraction: (type: keyof DevelopmentMetrics['userInteractions']) => {
      set((state) => ({
        developmentMetrics: {
          ...state.developmentMetrics,
          userInteractions: {
            ...state.developmentMetrics.userInteractions,
            [type]: state.developmentMetrics.userInteractions[type] + 1,
          },
        },
      }));
    },
    
    addAlert: (alert) => {
      set((state) => ({
        alerts: [...state.alerts.slice(-49), alert], // Keep last 50 alerts
        metrics: {
          ...state.metrics,
          performanceAlertCount: state.metrics.performanceAlertCount + 1,
        },
      }));
    },
    
    updateMemoryUsage: (memoryKB: number) => {
      set((state) => ({
        metrics: {
          ...state.metrics,
          memoryUsage: memoryKB,
        },
      }));
    },
    
    reset: () => {
      set(initialState);
    },
  },
}));