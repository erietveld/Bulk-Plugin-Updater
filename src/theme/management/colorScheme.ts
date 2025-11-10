// src/theme/management/colorScheme.ts
// Color scheme management system
// Extracted from app.tsx for better maintainability

import { 
  MantineColorScheme, 
  MantineTheme,
  localStorageColorSchemeManager 
} from '@mantine/core';
import { logger, createLogContext } from '../../monitoring/logger';
import { performanceMetrics } from './cache';

// Check if debug mode is enabled
const isDebugMode = () => {
  return new URLSearchParams(window.location.search).get('sn_debug') === 'true';
};

// Detect system color scheme
export const detectSystemColorScheme = (): MantineColorScheme => {
  if (typeof window === 'undefined') return 'light';
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
};

// Enhanced color scheme manager with system preference fallback
export const createEnhancedColorSchemeManager = () => {
  const manager = localStorageColorSchemeManager({
    key: 'store-updates-color-scheme',
  });
  
  // Enhance with system preference detection
  const originalGet = manager.get;
  manager.get = (defaultValue?: MantineColorScheme): MantineColorScheme => {
    // Handle undefined return from originalGet
    const stored = originalGet(defaultValue ?? 'light');
    
    // If no stored preference and no default, use system preference
    if (!stored && !defaultValue) {
      const systemPreference = detectSystemColorScheme();
      if (isDebugMode()) {
        logger.info('Using system color scheme preference', createLogContext({
          systemPreference,
          reason: 'No stored preference found'
        }));
      }
      return systemPreference;
    }
    
    // Always return a valid MantineColorScheme, never undefined
    return stored ?? defaultValue ?? 'light';
  };
  
  return manager;
};

// System preference change listener
export const setupSystemPreferenceListener = (callback: (scheme: MantineColorScheme) => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (event: MediaQueryListEvent) => {
    const newScheme: MantineColorScheme = event.matches ? 'dark' : 'light';
    performanceMetrics.systemPreferenceDetections++;
    
    if (isDebugMode()) {
      logger.info('System color scheme changed', createLogContext({
        newScheme,
        timestamp: new Date().toISOString()
      }));
    }
    callback(newScheme);
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
};

// CSS Variables Resolver with null checks
export const cssVariablesResolver = (theme: MantineTheme) => ({
  variables: {
    // Core theme variables with null checks
    '--app-primary-color': theme.colors?.[theme.primaryColor]?.[6] ?? theme.colors?.blue?.[6] ?? '#0ea5e9',
    '--app-primary-hover': theme.colors?.[theme.primaryColor]?.[7] ?? theme.colors?.blue?.[7] ?? '#0284c7',
    '--app-primary-light': theme.colors?.[theme.primaryColor]?.[3] ?? theme.colors?.blue?.[3] ?? '#7dd3fc',
    '--app-primary-dark': theme.colors?.[theme.primaryColor]?.[8] ?? theme.colors?.blue?.[8] ?? '#075985',
    
    // Surface colors
    '--app-surface-primary': theme.white ?? '#ffffff',
    '--app-surface-secondary': theme.colors?.gray?.[0] ?? '#f8f9fa',
    '--app-surface-tertiary': theme.colors?.gray?.[1] ?? '#f1f3f4',
    
    // Text colors
    '--app-text-primary': theme.black ?? '#000000',
    '--app-text-secondary': theme.colors?.gray?.[7] ?? '#495057',
    '--app-text-tertiary': theme.colors?.gray?.[6] ?? '#6c757d',
    '--app-text-disabled': theme.colors?.gray?.[5] ?? '#adb5bd',
    
    // Border and shadows
    '--app-border-color': theme.colors?.gray?.[3] ?? '#dee2e6',
    '--app-border-hover': theme.colors?.gray?.[4] ?? '#ced4da',
    '--app-shadow-color': 'rgba(0, 0, 0, 0.1)',
    '--app-shadow-hover': 'rgba(0, 0, 0, 0.15)',
    
    // Interactive states
    '--app-focus-ring': `0 0 0 2px ${theme.colors?.[theme.primaryColor]?.[3] ?? theme.colors?.blue?.[3] ?? '#7dd3fc'}`,
    '--app-error-color': theme.colors?.red?.[6] ?? '#dc3545',
    '--app-warning-color': theme.colors?.yellow?.[6] ?? '#ffc107',
    '--app-success-color': theme.colors?.green?.[6] ?? '#28a745',
    
    // Layout
    '--app-radius-sm': theme.radius?.sm ?? '4px',
    '--app-radius-md': theme.radius?.md ?? '8px',
    '--app-radius-lg': theme.radius?.lg ?? '12px',
    '--app-spacing-sm': theme.spacing?.sm ?? '12px',
    '--app-spacing-md': theme.spacing?.md ?? '16px',
    '--app-spacing-lg': theme.spacing?.lg ?? '24px',
  },
  light: {
    '--app-surface-primary': theme.white ?? '#ffffff',
    '--app-surface-secondary': theme.colors?.gray?.[0] ?? '#f8f9fa',
    '--app-surface-tertiary': theme.colors?.gray?.[1] ?? '#f1f3f4',
    '--app-text-primary': theme.black ?? '#000000',
    '--app-text-secondary': theme.colors?.gray?.[7] ?? '#495057',
    '--app-text-tertiary': theme.colors?.gray?.[6] ?? '#6c757d',
    '--app-border-color': theme.colors?.gray?.[3] ?? '#dee2e6',
    '--app-shadow-color': 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    '--app-surface-primary': theme.colors?.dark?.[7] ?? '#1a1b1e',
    '--app-surface-secondary': theme.colors?.dark?.[6] ?? '#25262b',
    '--app-surface-tertiary': theme.colors?.dark?.[5] ?? '#2c2e33',
    '--app-text-primary': theme.white ?? '#ffffff',
    '--app-text-secondary': theme.colors?.gray?.[3] ?? '#dee2e6',
    '--app-text-tertiary': theme.colors?.gray?.[4] ?? '#ced4da',
    '--app-border-color': theme.colors?.dark?.[4] ?? '#373a40',
    '--app-shadow-color': 'rgba(0, 0, 0, 0.3)',
  },
});