// src/hooks/useThemeManagement.ts
// Theme management custom hook
// Following atomic design principle: Custom Hooks manage business logic and local state

import { useCallback, useMemo } from 'react';
import { showNotification } from '@mantine/notifications';
import { useThemeStore } from '../stores/themeStore';
import { usePerformanceStore } from '../stores/performanceStore';
import { createThemeConfig, getActiveThemes, ThemeKey, DEFAULT_THEME } from '../config/themes';
import { getCachedTheme } from '../theme/management/cache';
import { debugService } from '../services/debugService';
import { logger, createLogContext } from '../monitoring/logger';
import { getString } from '../utils/typeRefinements';

export const useThemeManagement = () => {
  // Global state from Zustand stores
  const currentTheme = useThemeStore(state => state.currentTheme);
  const isChanging = useThemeStore(state => state.isChanging);
  const error = useThemeStore(state => state.error);
  const themeActions = useThemeStore(state => state.actions);
  const performanceActions = usePerformanceStore(state => state.actions);
  
  // Memoized active theme configurations (only 3 themes shown in switcher)
  const themes = useMemo(() => getActiveThemes(), []);
  
  // All themes including inactive ones (for internal use)
  const allThemes = useMemo(() => createThemeConfig(), []);
  
  // Theme switching business logic
  const switchTheme = useCallback((themeKey: ThemeKey) => {
    const startTime = performance.now();
    
    try {
      themeActions.setChanging(true);
      themeActions.setTheme(themeKey);
      
      const switchTime = performance.now() - startTime;
      
      // Update performance metrics in store
      performanceActions.incrementThemeSwitch(switchTime);
      
      // Get theme configuration for notification
      const themeConfig = allThemes[themeKey]; // Use all themes for switching
      
      // Log debug information via service
      debugService.logThemeSwitch(currentTheme, themeKey, {
        switchTime,
        averageSwitchTime: 0, // Will be calculated in store
        totalSwitches: 0, // Will be calculated in store
      });
      
      // Log application-level theme change
      logger.info('Base theme changed', createLogContext({
        newTheme: themeKey,
        themeName: themeConfig?.name ?? 'Unknown',
        backgroundGradient: getString(themeConfig?.backgroundGradient) ?? 'N/A',
        switchTime: Math.round(switchTime),
        debugMode: debugService.isDebugMode(),
        totalThemes: Object.keys(themes).length // Only active themes count
      }));

      // Theme switched successfully - no notification needed (removed as redundant)
      
      themeActions.setChanging(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown theme switching error';
      themeActions.setError(errorMessage);
      logger.error('Theme switching failed', error instanceof Error ? error : undefined, createLogContext({
        themeKey,
        errorMessage
      }));
    }
  }, [currentTheme, themeActions, performanceActions, themes]);
  
  // Get current enhanced theme - with proper error handling
  const getCurrentTheme = useCallback(() => {
    try {
      // Try active themes first, fallback to all themes for backward compatibility
      const themeConfig = themes[currentTheme] || allThemes[currentTheme];
      if (!themeConfig) {
        logger.warn('Current theme not found, falling back to default', createLogContext({
          currentTheme,
          availableActiveThemes: Object.keys(themes),
          availableAllThemes: Object.keys(allThemes),
          fallbackTheme: DEFAULT_THEME
        }));
        
        // Safe fallback to default theme
        const defaultConfig = allThemes[DEFAULT_THEME];
        if (!defaultConfig) {
          throw new Error(`Default theme '${DEFAULT_THEME}' not found in theme configurations`);
        }
        return getCachedTheme(DEFAULT_THEME, defaultConfig.theme);
      }
      
      return getCachedTheme(currentTheme, themeConfig.theme);
    } catch (error) {
      logger.error('Failed to get current theme', error instanceof Error ? error : undefined, createLogContext({
        currentTheme,
        availableActiveThemes: Object.keys(themes),
        availableAllThemes: Object.keys(allThemes),
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      
      // Set error in store
      const errorMessage = error instanceof Error ? error.message : 'Failed to get current theme';
      themeActions.setError(errorMessage);
      
      throw error;
    }
  }, [currentTheme, themes, allThemes, themeActions]);
  
  // Get current theme configuration (metadata) - check active themes first
  const getCurrentThemeConfig = useCallback(() => {
    const themeConfig = themes[currentTheme] || allThemes[currentTheme];
    if (!themeConfig) {
      return allThemes[DEFAULT_THEME];
    }
    return themeConfig;
  }, [currentTheme, themes, allThemes]);
  
  return {
    // State
    currentTheme,
    isChanging,
    error,
    
    // Computed values
    themes,
    currentThemeConfig: getCurrentThemeConfig(),
    
    // Actions
    switchTheme,
    getCurrentTheme,
    
    // Utilities
    clearError: () => themeActions.setError(null),
    reset: themeActions.reset,
  };
};