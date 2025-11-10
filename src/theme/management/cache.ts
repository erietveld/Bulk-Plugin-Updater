// src/theme/management/cache.ts
// Theme caching system
// Extracted from app.tsx for better maintainability

import { createTheme, MantineTheme } from '@mantine/core';
import { ThemeValidationResult, validateTheme } from './validation';
import { logger, createLogContext } from '../../monitoring/logger';
import { getString, getNumber } from '../../utils/typeRefinements';

export interface CachedTheme {
  theme: MantineTheme;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  cacheKey: string;
  colorSchemeSupport: 'auto' | 'manual';
  validationResult: ThemeValidationResult;
  loadTime: number;
  memoryEstimate: number;
}

export interface PerformanceMetrics {
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

// Cache configuration
const CACHE_MAX_SIZE = 10;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Global cache and metrics
const themeCache = new Map<string, CachedTheme>();
export const performanceMetrics: PerformanceMetrics = {
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
  developmentModeActivations: 0
};

// Check if debug mode is enabled
const isDebugMode = () => {
  return new URLSearchParams(window.location.search).get('sn_debug') === 'true';
};

// Track theme load performance
const trackThemeLoadTime = (themeKey: string, loadTime: number) => {
  // This would be implemented with a more sophisticated tracking system
  // For now, just basic performance categorization
  if (loadTime > 100) performanceMetrics.slowSwitches++;
  else if (loadTime < 50) performanceMetrics.fastSwitches++;
};

// Cache cleanup utility
export const cleanupThemeCache = () => {
  const now = Date.now();
  const entries = Array.from(themeCache.entries());
  
  // Remove expired entries
  const expiredCount = entries.filter(([key, cached]) => {
    if (now - cached.createdAt > CACHE_TTL) {
      themeCache.delete(key);
      return true;
    }
    return false;
  }).length;

  // If still over limit, remove least recently used
  if (themeCache.size > CACHE_MAX_SIZE) {
    const sortedByAccess = entries
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)
      .slice(0, themeCache.size - CACHE_MAX_SIZE);
    
    sortedByAccess.forEach(([key]) => themeCache.delete(key));
  }

  // Update memory usage estimate
  performanceMetrics.memoryUsage = themeCache.size * 50; // Rough estimate in KB

  if (expiredCount > 0 && isDebugMode()) {
    logger.info('Theme cache cleanup completed', createLogContext({
      expiredEntries: expiredCount,
      currentCacheSize: themeCache.size,
      estimatedMemoryKB: performanceMetrics.memoryUsage
    }));
  }
};

// Setup automatic cache cleanup
let cleanupInterval: NodeJS.Timeout;
if (typeof window !== 'undefined') {
  cleanupInterval = setInterval(cleanupThemeCache, CLEANUP_INTERVAL);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(cleanupInterval);
    themeCache.clear();
  });
}

// CSS Variables Resolver for enhanced theme support
export const cssVariablesResolver = (theme: MantineTheme) => ({
  variables: {
    // Core theme variables with null checks
    '--app-primary-color': theme.colors?.[theme.primaryColor]?.[6] || theme.colors?.blue?.[6] || '#0ea5e9',
    '--app-primary-hover': theme.colors?.[theme.primaryColor]?.[7] || theme.colors?.blue?.[7] || '#0284c7',
    '--app-primary-light': theme.colors?.[theme.primaryColor]?.[3] || theme.colors?.blue?.[3] || '#7dd3fc',
    '--app-primary-dark': theme.colors?.[theme.primaryColor]?.[8] || theme.colors?.blue?.[8] || '#075985',
    
    // Surface colors - enhanced for better color scheme transitions
    '--app-surface-primary': theme.white || '#ffffff',
    '--app-surface-secondary': theme.colors?.gray?.[0] || '#f8f9fa',
    '--app-surface-tertiary': theme.colors?.gray?.[1] || '#f1f3f4',
    
    // Text colors - enhanced hierarchy
    '--app-text-primary': theme.black || '#000000',
    '--app-text-secondary': theme.colors?.gray?.[7] || '#495057',
    '--app-text-tertiary': theme.colors?.gray?.[6] || '#6c757d',
    '--app-text-disabled': theme.colors?.gray?.[5] || '#adb5bd',
    
    // Border and shadows - enhanced for color scheme support
    '--app-border-color': theme.colors?.gray?.[3] || '#dee2e6',
    '--app-border-hover': theme.colors?.gray?.[4] || '#ced4da',
    '--app-shadow-color': 'rgba(0, 0, 0, 0.1)',
    '--app-shadow-hover': 'rgba(0, 0, 0, 0.15)',
    
    // Interactive states
    '--app-focus-ring': `0 0 0 2px ${theme.colors?.[theme.primaryColor]?.[3] || theme.colors?.blue?.[3] || '#7dd3fc'}`,
    '--app-error-color': theme.colors?.red?.[6] || '#dc3545',
    '--app-warning-color': theme.colors?.yellow?.[6] || '#ffc107',
    '--app-success-color': theme.colors?.green?.[6] || '#28a745',
    
    // Layout
    '--app-radius-sm': theme.radius?.sm || '4px',
    '--app-radius-md': theme.radius?.md || '8px',
    '--app-radius-lg': theme.radius?.lg || '12px',
    '--app-spacing-sm': theme.spacing?.sm || '12px',
    '--app-spacing-md': theme.spacing?.md || '16px',
    '--app-spacing-lg': theme.spacing?.lg || '24px',
  },
  light: {
    '--app-surface-primary': theme.white || '#ffffff',
    '--app-surface-secondary': theme.colors?.gray?.[0] || '#f8f9fa',
    '--app-surface-tertiary': theme.colors?.gray?.[1] || '#f1f3f4',
    '--app-text-primary': theme.black || '#000000',
    '--app-text-secondary': theme.colors?.gray?.[7] || '#495057',
    '--app-text-tertiary': theme.colors?.gray?.[6] || '#6c757d',
    '--app-border-color': theme.colors?.gray?.[3] || '#dee2e6',
    '--app-shadow-color': 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    '--app-surface-primary': theme.colors?.dark?.[7] || '#1a1b1e',
    '--app-surface-secondary': theme.colors?.dark?.[6] || '#25262b',
    '--app-surface-tertiary': theme.colors?.dark?.[5] || '#2c2e33',
    '--app-text-primary': theme.white || '#ffffff',
    '--app-text-secondary': theme.colors?.gray?.[3] || '#dee2e6',
    '--app-text-tertiary': theme.colors?.gray?.[4] || '#ced4da',
    '--app-border-color': theme.colors?.dark?.[4] || '#373a40',
    '--app-shadow-color': 'rgba(0, 0, 0, 0.3)',
  },
});

// Main theme caching function
export const getCachedTheme = (themeKey: string, baseTheme: MantineTheme): MantineTheme => {
  const startTime = performance.now();
  
  // Check cache first
  if (themeCache.has(themeKey)) {
    const cachedTheme = themeCache.get(themeKey)!;
    cachedTheme.accessCount++;
    cachedTheme.lastAccessed = Date.now();
    performanceMetrics.cacheHits++;
    
    const accessTime = performance.now() - startTime;
    if (accessTime < 5) performanceMetrics.fastSwitches++;
    
    if (isDebugMode()) {
      logger.info('Theme cache hit', createLogContext({
        themeKey,
        cacheSize: themeCache.size,
        hitRatio: performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses),
        accessCount: cachedTheme.accessCount,
        accessTime: Math.round(accessTime),
        memoryUsageKB: performanceMetrics.memoryUsage
      }));
    }
    
    return cachedTheme.theme;
  }

  // Create enhanced theme
  const enhancedTheme = createTheme({
    ...baseTheme,
    other: {
      ...baseTheme.other,
      performanceOptimized: true,
      cacheKey: themeKey,
      createdAt: Date.now(),
      version: '8.3.6',
      features: ['css-variables', 'performance-cache', 'auto-cleanup'],
      colorSchemeManagement: 'enhanced'
    }
  }) as MantineTheme;

  // Apply CSS variables to document root with null safety
  if (enhancedTheme.other?.cssVariables) {
    Object.entries(enhancedTheme.other.cssVariables).forEach(([property, value]) => {
      // Use getString utility to safely handle the value
      const cssValue = getString(value as string | null | undefined) ?? '';
      if (cssValue) {
        document.documentElement.style.setProperty(property, cssValue);
      }
    });
  }

  // Validate theme
  const validationResult = validateTheme(themeKey, enhancedTheme);
  
  if (isDebugMode()) {
    if (!validationResult.isValid) {
      performanceMetrics.validationFailures++;
    }
    
    logger.info('Theme validation completed', createLogContext({
      themeKey,
      validationScore: validationResult.score,
      isValid: validationResult.isValid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length
    }));
  }

  const creationTime = performance.now() - startTime;
  trackThemeLoadTime(themeKey, creationTime);

  // Cache the theme
  const memoryEstimate = JSON.stringify(enhancedTheme).length / 1024;
  const cachedTheme: CachedTheme = {
    theme: enhancedTheme,
    createdAt: Date.now(),
    accessCount: 1,
    lastAccessed: Date.now(),
    cacheKey: themeKey,
    colorSchemeSupport: 'auto',
    validationResult,
    loadTime: creationTime,
    memoryEstimate
  };

  themeCache.set(themeKey, cachedTheme);
  performanceMetrics.cacheMisses++;
  
  // Update memory usage estimate
  performanceMetrics.memoryUsage = Array.from(themeCache.values())
    .reduce((total, cached) => total + cached.memoryEstimate, 0);
  
  if (isDebugMode()) {
    logger.info('Theme created and cached', createLogContext({
      themeKey,
      creationTime: Math.round(creationTime),
      cacheSize: themeCache.size,
      memoryUsageKB: Math.round(performanceMetrics.memoryUsage),
      performanceClass: creationTime > 100 ? 'slow' : creationTime < 50 ? 'fast' : 'normal'
    }));
  }

  return enhancedTheme;
};