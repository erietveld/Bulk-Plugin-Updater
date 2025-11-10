// src/hooks/usePerformanceTracking.ts
// Performance tracking custom hook
// Following atomic design principle: Custom Hooks manage business logic and local state

import { useCallback } from 'react';
import { usePerformanceStore } from '../stores/performanceStore';
import { debugService } from '../services/debugService';

export const usePerformanceTracking = () => {
  // Global state from Zustand store
  const metrics = usePerformanceStore(state => state.metrics);
  const developmentMetrics = usePerformanceStore(state => state.developmentMetrics);
  const alerts = usePerformanceStore(state => state.alerts);
  const actions = usePerformanceStore(state => state.actions);
  
  // Performance tracking business logic
  const trackThemeSwitch = useCallback((switchTime: number) => {
    actions.incrementThemeSwitch(switchTime);
  }, [actions]);
  
  const trackCacheHit = useCallback(() => {
    actions.incrementCacheHit();
  }, [actions]);
  
  const trackCacheMiss = useCallback(() => {
    actions.incrementCacheMiss();
  }, [actions]);
  
  const trackColorSchemeChange = useCallback(() => {
    actions.incrementColorSchemeChange();
  }, [actions]);
  
  const addPerformanceAlert = useCallback((
    type: 'slow-load' | 'memory-leak' | 'validation-fail',
    message: string,
    severity: 'info' | 'warning' | 'error' = 'info'
  ) => {
    const alert = {
      timestamp: Date.now(),
      type,
      message,
      severity
    };
    
    actions.addAlert(alert);
    
    if (debugService.isDebugMode()) {
      const logLevel = severity === 'error' ? 'error' : severity === 'warning' ? 'warn' : 'info';
      console[logLevel](`Performance Alert: ${message}`, {
        alertType: type,
        severity,
        totalAlerts: alerts.length + 1
      });
    }
  }, [actions, alerts.length]);
  
  // Computed metrics
  const getCacheHitRatio = useCallback(() => {
    const total = metrics.cacheHits + metrics.cacheMisses;
    return total > 0 ? Math.round((metrics.cacheHits / total) * 100) : 0;
  }, [metrics.cacheHits, metrics.cacheMisses]);
  
  const getRecentAlerts = useCallback((limit: number = 5) => {
    return alerts.slice(-limit).reverse();
  }, [alerts]);
  
  const getPerformanceProfile = useCallback(() => {
    const total = metrics.themeSwitchCount;
    const normal = total - metrics.fastSwitches - metrics.slowSwitches;
    
    return {
      fast: metrics.fastSwitches,
      normal: Math.max(0, normal),
      slow: metrics.slowSwitches
    };
  }, [metrics.themeSwitchCount, metrics.fastSwitches, metrics.slowSwitches]);
  
  return {
    // State
    metrics,
    developmentMetrics,
    alerts,
    
    // Actions
    trackThemeSwitch,
    trackCacheHit,
    trackCacheMiss,
    trackColorSchemeChange,
    addPerformanceAlert,
    updateMemoryUsage: actions.updateMemoryUsage,
    incrementUserInteraction: actions.incrementUserInteraction,
    
    // Computed values
    getCacheHitRatio,
    getRecentAlerts,
    getPerformanceProfile,
    
    // Utilities
    reset: actions.reset,
  };
};