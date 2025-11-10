// src/hooks/useDebugMode.ts
// Custom hook for debug mode functionality
// Following atomic design principle: Custom Hooks handle business logic

import { useMemo } from 'react';
import { usePerformanceStore } from '../stores/performanceStore';
import { debugService } from '../services/debugService';

export interface DebugMetrics {
  userInteractions: {
    themeSwitches: number;
    colorSchemeToggles: number;
    debugModeActivations: number;
  };
  performanceAlerts: Array<{
    timestamp: number;
    type: 'slow-load' | 'memory-leak' | 'validation-fail';
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
  validationResults: number;
  themeLoadTimes: Map<string, number[]>;
}

export const useDebugMode = () => {
  // Get debug state from performance store
  const developmentModeActivations = usePerformanceStore(state => state.developmentModeActivations);
  const performanceAlerts = usePerformanceStore(state => state.performanceAlerts);
  
  // Check if debug mode is enabled
  const isDebugMode = useMemo(() => {
    return debugService.isDebugMode();
  }, []);

  // Debug metrics from various sources
  const debugMetrics: DebugMetrics = useMemo(() => ({
    userInteractions: {
      themeSwitches: 0, // This would come from theme store
      colorSchemeToggles: 0, // This would come from theme store  
      debugModeActivations: developmentModeActivations
    },
    performanceAlerts: performanceAlerts || [],
    validationResults: 0, // This would come from validation store
    themeLoadTimes: new Map() // This would come from theme store
  }), [developmentModeActivations, performanceAlerts]);

  // Enable debug mode
  const enableDebugMode = () => {
    debugService.enableDebugMode();
    usePerformanceStore.getState().actions.incrementDevelopmentModeActivations();
  };

  // Disable debug mode
  const disableDebugMode = () => {
    debugService.disableDebugMode();
  };

  return {
    isDebugMode,
    debugMetrics,
    enableDebugMode,
    disableDebugMode
  };
};