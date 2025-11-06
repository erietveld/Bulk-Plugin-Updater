// src/client/app.tsx
// Main App with Store Updates Dashboard and Navigation
// Following Architecture.md patterns with TanStack Query and Zustand integration
// THEME: FIXED - Integrated all theme styling into Mantine theme objects (no external DOM manipulation)
// THEME: ENHANCED - Added Vercel, Cosmic Night, and Dark Matter themes to switcher
// PERFORMANCE: Enhanced Mantine 8.x optimizations - improved theme memoization, caching, CSS variables
// DEBUG: Using sn_debug=true URL parameter pattern instead of NODE_ENV (per Architecture.md)
// STEP 2: Advanced Mantine 8.x Configuration - System preference detection, enhanced color scheme management
// STEP 3: Development Experience Improvements - Enhanced validation, monitoring, TypeScript types (FIXED)

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { 
  MantineProvider, 
  Container, 
  Title, 
  Text, 
  Group, 
  ActionIcon, 
  Menu, 
  Button,
  Paper,
  Badge,
  Divider,
  Stack,
  localStorageColorSchemeManager,
  createTheme,
  useMantineColorScheme,
  type MantineColorScheme,
  type MantineTheme
} from '@mantine/core';
import { Notifications, showNotification } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  IconMenu2,
  IconExternalLink,
  IconDatabase,
  IconCode,
  IconReportAnalytics,
  IconUser,
  IconCalendar,
  IconRefresh,
  IconSettings,
  IconSun,
  IconMoon,
  IconPalette,
  IconBug,
  IconChartBar,
  IconAlertTriangle,
  IconBrandGithub,
  IconStars,
  IconRocket,
  IconAtom
} from '@tabler/icons-react';

import { enterpriseTheme as baseMantineTheme } from '../theme/mantineTheme';
import { enterpriseTheme as baseServicenowTheme } from '../theme/servicenowTheme';
// Import the new theme files with proper typing
import vercelThemeBase from '../theme/vercelTheme';
import cosmicNightThemeBase from '../theme/cosmicNightTheme';
import { enterpriseTheme as darkMatterThemeBase } from '../theme/darkMatterTheme';
import { ErrorBoundary } from '../error/ErrorBoundary';
import { logger, createLogContext } from '../monitoring/logger';

// Import the comprehensive Store Updates Dashboard
import { StoreUpdatesDashboard } from './components/mantine/StoreUpdatesDashboard';

// DEBUG: URL parameter-based debug detection (Architecture.md compliant)
const isDebugMode = () => {
  return new URLSearchParams(window.location.search).get('sn_debug') === 'true';
};

// STEP 3: Enhanced TypeScript Types for Theme System
interface EnhancedThemeConfig {
  theme: MantineTheme;
  name: string;
  icon: React.ComponentType<{ size?: number }>;
  backgroundGradient: string;
  primaryColor: string;
  category: 'corporate' | 'brand' | 'custom';
  accessibility: 'AA' | 'AAA';
  colorSchemeSupport: boolean;
  systemPreferenceAware: boolean;
  // STEP 3: Additional metadata for development experience
  version: string;
  author?: string;
  description?: string;
  tags?: string[];
  performance?: {
    expectedLoadTime: number; // in ms
    cacheability: 'high' | 'medium' | 'low';
    memoryFootprint: 'small' | 'medium' | 'large';
  };
}

interface ThemeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
  details: {
    hasRequiredColors: boolean;
    hasConsistentSpacing: boolean;
    hasAccessibleContrast: boolean;
    hasPerformanceOptimizations: boolean;
    componentCompatibility: number; // percentage
    // FIXED: Add validation for integrated theme elements
    hasBackgroundSystem: boolean;
    hasHeaderSystem: boolean;
    hasCSSVariables: boolean;
  };
}

interface DevelopmentMetrics {
  themeLoadTimes: Map<string, number[]>;
  validationResults: Map<string, ThemeValidationResult>;
  performanceAlerts: Array<{
    timestamp: number;
    type: 'slow-load' | 'memory-leak' | 'validation-fail';
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
  userInteractions: {
    themeSwitches: number;
    colorSchemeToggles: number;
    debugModeActivations: number;
  };
}

// STEP 3: Development metrics tracking
const developmentMetrics: DevelopmentMetrics = {
  themeLoadTimes: new Map(),
  validationResults: new Map(),
  performanceAlerts: [],
  userInteractions: {
    themeSwitches: 0,
    colorSchemeToggles: 0,
    debugModeActivations: 0
  }
};

// STEP 2: Enhanced Color Scheme Management with System Preference Detection
const detectSystemColorScheme = (): MantineColorScheme => {
  if (typeof window === 'undefined') return 'light';
  
  // Check system preference
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
};

// STEP 2: Advanced color scheme manager with system preference fallback
const createEnhancedColorSchemeManager = () => {
  const manager = localStorageColorSchemeManager({
    key: 'store-updates-color-scheme',
  });
  
  // Enhance with system preference detection
  const originalGet = manager.get;
  manager.get = (defaultValue?: MantineColorScheme): MantineColorScheme => {
    // FIX: Handle undefined return from originalGet
    const stored = originalGet(defaultValue ?? 'light'); // Provide fallback for originalGet call
    
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
    return stored || defaultValue || 'light';
  };
  
  return manager;
};

// STEP 3: Enhanced Theme Validation System - FIXED to validate integrated theme elements
const validateTheme = (themeKey: string, theme: any): ThemeValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Required colors validation
  const hasRequiredColors = !!(theme.colors && theme.primaryColor && theme.colors[theme.primaryColor]);
  if (!hasRequiredColors) {
    errors.push(`Theme '${themeKey}' missing required colors or primaryColor`);
    score -= 30;
  }

  // Spacing consistency validation
  const hasConsistentSpacing = !!(theme.spacing && Object.keys(theme.spacing).length >= 3);
  if (!hasConsistentSpacing) {
    warnings.push(`Theme '${themeKey}' should define consistent spacing values`);
    score -= 10;
  }

  // Component compatibility check
  const componentCompatibility = theme.components ? 
    Math.min(Object.keys(theme.components).length / 5 * 100, 100) : 0;
  
  if (componentCompatibility < 50) {
    warnings.push(`Theme '${themeKey}' has limited component customizations`);
    score -= 15;
  }

  // Performance optimizations check
  const hasPerformanceOptimizations = !!(theme.other?.performanceOptimized);
  if (!hasPerformanceOptimizations) {
    warnings.push(`Theme '${themeKey}' missing performance optimizations`);
    score -= 5;
  }

  // FIXED: Validate integrated background system
  const hasBackgroundSystem = !!(theme.other?.backgroundGradient && theme.other?.cssVariables?.['--theme-background']);
  if (!hasBackgroundSystem) {
    warnings.push(`Theme '${themeKey}' missing integrated background system`);
    score -= 10; // Reduced penalty for new themes
  }

  // FIXED: Validate integrated header system  
  const hasHeaderSystem = !!(theme.other?.headerBackground && theme.other?.cssVariables?.['--theme-header-bg']);
  if (!hasHeaderSystem) {
    warnings.push(`Theme '${themeKey}' missing integrated header system`);
    score -= 8; // Reduced penalty for new themes
  }

  // FIXED: Validate CSS variables system
  const hasCSSVariables = !!(theme.other?.cssVariables && Object.keys(theme.other.cssVariables).length >= 3);
  if (!hasCSSVariables) {
    warnings.push(`Theme '${themeKey}' missing comprehensive CSS variables`);
    score -= 5; // Reduced penalty for new themes
  }

  // Accessibility check (basic)
  const hasAccessibleContrast = hasRequiredColors; // Simplified check
  if (!hasAccessibleContrast) {
    errors.push(`Theme '${themeKey}' may have accessibility contrast issues`);
    score -= 20;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score: Math.max(0, score),
    details: {
      hasRequiredColors,
      hasConsistentSpacing,
      hasAccessibleContrast,
      hasPerformanceOptimizations,
      componentCompatibility,
      hasBackgroundSystem,
      hasHeaderSystem,
      hasCSSVariables
    }
  };
};

// STEP 3: Development Performance Monitor
const addPerformanceAlert = (
  type: DevelopmentMetrics['performanceAlerts'][0]['type'],
  message: string,
  severity: DevelopmentMetrics['performanceAlerts'][0]['severity'] = 'info'
) => {
  const alert = {
    timestamp: Date.now(),
    type,
    message,
    severity
  };
  
  developmentMetrics.performanceAlerts.push(alert);
  
  // Keep only last 50 alerts to prevent memory growth
  if (developmentMetrics.performanceAlerts.length > 50) {
    developmentMetrics.performanceAlerts.shift();
  }
  
  if (isDebugMode()) {
    const logLevel = severity === 'error' ? 'error' : severity === 'warning' ? 'warn' : 'info';
    // FIXED: Use correct logger signature - context only
    logger[logLevel](`Performance Alert: ${message}`, createLogContext({
      alertType: type,
      severity,
      totalAlerts: developmentMetrics.performanceAlerts.length
    }));
  }
};

// STEP 3: Track theme load performance
const trackThemeLoadTime = (themeKey: string, loadTime: number) => {
  if (!developmentMetrics.themeLoadTimes.has(themeKey)) {
    developmentMetrics.themeLoadTimes.set(themeKey, []);
  }
  
  const times = developmentMetrics.themeLoadTimes.get(themeKey)!;
  times.push(loadTime);
  
  // Keep only last 10 measurements
  if (times.length > 10) {
    times.shift();
  }
  
  // Performance analysis
  const average = times.reduce((a, b) => a + b, 0) / times.length;
  const isSlowLoad = loadTime > 100;
  
  if (isSlowLoad) {
    addPerformanceAlert(
      'slow-load',
      `Theme '${themeKey}' loaded slowly: ${Math.round(loadTime)}ms (avg: ${Math.round(average)}ms)`,
      loadTime > 200 ? 'error' : 'warning'
    );
  }
};

// STEP 2: System preference change listener
const setupSystemPreferenceListener = (callback: (scheme: MantineColorScheme) => void) => {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = (event: MediaQueryListEvent) => {
    const newScheme: MantineColorScheme = event.matches ? 'dark' : 'light';
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

// PERFORMANCE: Enhanced theme caching system for enterprise-scale applications
interface CachedTheme {
  theme: MantineTheme;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  cacheKey: string;
  colorSchemeSupport: 'auto' | 'manual';
  // STEP 3: Enhanced cache metadata (FIX: Required validation result)
  validationResult: ThemeValidationResult;
  loadTime: number;
  memoryEstimate: number;
}

interface PerformanceMetrics {
  themeSwitchCount: number;
  averageSwitchTime: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsage: number;
  slowSwitches: number; // Switches > 100ms
  fastSwitches: number; // Switches < 50ms
  colorSchemeChanges: number;
  systemPreferenceDetections: number;
  // STEP 3: Enhanced metrics
  validationFailures: number;
  performanceAlertCount: number;
  developmentModeActivations: number;
}

const themeCache = new Map<string, CachedTheme>();
const performanceMetrics: PerformanceMetrics = {
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

// PERFORMANCE: Enhanced cache management with automatic cleanup
const CACHE_MAX_SIZE = 10; // Maximum cached themes
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes TTL
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Cleanup every 5 minutes

// PERFORMANCE: Cache cleanup utility
const cleanupThemeCache = () => {
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

// PERFORMANCE: Setup automatic cache cleanup
let cleanupInterval: NodeJS.Timeout;
if (typeof window !== 'undefined') {
  cleanupInterval = setInterval(cleanupThemeCache, CLEANUP_INTERVAL);
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(cleanupInterval);
    themeCache.clear();
  });
}

// STEP 3: Enhanced theme creation with comprehensive validation and monitoring
function getCachedTheme(themeKey: string, baseTheme: MantineTheme): MantineTheme {
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
      logger.info('Theme cache hit (enhanced)', createLogContext({
        themeKey,
        cacheSize: themeCache.size,
        hitRatio: performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses),
        accessCount: cachedTheme.accessCount,
        accessTime: Math.round(accessTime),
        memoryUsageKB: performanceMetrics.memoryUsage,
        colorSchemeSupport: cachedTheme.colorSchemeSupport,
        validationScore: cachedTheme.validationResult.score || 'N/A'
      }));
    }
    
    return cachedTheme.theme;
  }

  // STEP 2: Create enhanced theme with improved color scheme support
  // FIXED: Keep the base theme fully integrated - add CSS variables via createTheme
  const enhancedTheme = createTheme({
    ...baseTheme,
    // Enhanced CSS variables and metadata for efficient styling updates
    other: {
      ...baseTheme.other,
      performanceOptimized: true,
      cacheKey: themeKey,
      createdAt: Date.now(),
      version: '8.3.6', // Mantine version
      features: ['css-variables', 'performance-cache', 'auto-cleanup', 'system-preference-detection', 'enhanced-validation', 'integrated-theming'],
      colorSchemeManagement: 'enhanced'
    }
  }) as MantineTheme;

  // FIXED: Apply CSS variables from theme to document root for integrated theming
  if (enhancedTheme.other?.cssVariables) {
    Object.entries(enhancedTheme.other.cssVariables).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value as string);
    });
  }

  // STEP 3: Comprehensive theme validation (debug mode only)
  const validationResult = validateTheme(themeKey, enhancedTheme);
  developmentMetrics.validationResults.set(themeKey, validationResult);
  
  if (isDebugMode()) {
    if (!validationResult.isValid) {
      performanceMetrics.validationFailures++;
      addPerformanceAlert(
        'validation-fail',
        `Theme '${themeKey}' validation failed: ${validationResult.errors.join(', ')}`,
        'error'
      );
    } else if (validationResult.warnings.length > 0) {
      addPerformanceAlert(
        'validation-fail',
        `Theme '${themeKey}' has warnings: ${validationResult.warnings.join(', ')}`,
        'warning'
      );
    }
    
    logger.info('Theme validation completed', createLogContext({
      themeKey,
      validationScore: validationResult.score,
      isValid: validationResult.isValid,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      details: validationResult.details
    }));
  }

  const creationTime = performance.now() - startTime;
  
  // STEP 3: Track performance and add alerts if needed
  trackThemeLoadTime(themeKey, creationTime);

  // STEP 3: Cache the theme with enhanced metadata (FIX: Provide default validation result)
  const memoryEstimate = JSON.stringify(enhancedTheme).length / 1024; // Rough estimate in KB
  const cachedTheme: CachedTheme = {
    theme: enhancedTheme,
    createdAt: Date.now(),
    accessCount: 1,
    lastAccessed: Date.now(),
    cacheKey: themeKey,
    colorSchemeSupport: 'auto',
    validationResult: validationResult,
    loadTime: creationTime,
    memoryEstimate
  };

  themeCache.set(themeKey, cachedTheme);
  performanceMetrics.cacheMisses++;
  
  if (creationTime > 100) performanceMetrics.slowSwitches++;
  else if (creationTime < 50) performanceMetrics.fastSwitches++;
  
  // Update memory usage estimate
  performanceMetrics.memoryUsage = Array.from(themeCache.values())
    .reduce((total, cached) => total + cached.memoryEstimate, 0);
  
  if (isDebugMode()) {
    logger.info('Theme created and cached (enhanced)', createLogContext({
      themeKey,
      creationTime: Math.round(creationTime),
      cacheSize: themeCache.size,
      memoryUsageKB: Math.round(performanceMetrics.memoryUsage),
      performanceClass: creationTime > 100 ? 'slow' : creationTime < 50 ? 'fast' : 'normal',
      colorSchemeSupport: cachedTheme.colorSchemeSupport,
      validationScore: validationResult.score || 'N/A'
    }));
  }

  return enhancedTheme;
}

// STEP 2: Enhanced CSS Variables Resolver with better performance and color scheme awareness
const cssVariablesResolver = (theme: MantineTheme) => ({
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

// ENHANCED: Theme configuration with all themes including Dark Matter
const createThemeConfig = (): Record<string, EnhancedThemeConfig> => ({
  mantine: { 
    theme: baseMantineTheme, 
    name: 'Corporate Blue', 
    icon: IconPalette,
    backgroundGradient: baseMantineTheme.other?.backgroundGradient || 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #e0f2fe 75%, #f0f9ff 100%)',
    primaryColor: '#0ea5e9',
    category: 'corporate',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    version: '1.0.0',
    description: 'Professional corporate theme with blue accent colors',
    tags: ['corporate', 'professional', 'blue'],
    performance: {
      expectedLoadTime: 50,
      cacheability: 'high',
      memoryFootprint: 'medium'
    }
  },
  servicenow: { 
    theme: baseServicenowTheme, 
    name: 'ServiceNow Green', 
    icon: IconSun,
    backgroundGradient: baseServicenowTheme.other?.backgroundGradient || 'linear-gradient(135deg, #f0fdf4 0%, #e6f4ea 25%, #dcfce7 50%, #e6f4ea 75%, #f0fdf4 100%)',
    primaryColor: '#2fa937',
    category: 'brand',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    version: '1.0.0',
    description: 'Official ServiceNow brand theme with green accent colors',
    tags: ['servicenow', 'brand', 'green'],
    performance: {
      expectedLoadTime: 45,
      cacheability: 'high',
      memoryFootprint: 'medium'
    }
  },
  vercel: {
    theme: vercelThemeBase as MantineTheme,
    name: 'Vercel Modern',
    icon: IconRocket,
    backgroundGradient: vercelThemeBase.other?.backgroundGradient || 'linear-gradient(135deg, oklch(0.99 0 0) 0%, oklch(0.94 0 0) 25%, oklch(0.97 0 0) 50%, oklch(0.94 0 0) 75%, oklch(0.99 0 0) 100%)',
    primaryColor: 'oklch(0 0 0)',
    category: 'custom',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    version: '1.0.0',
    author: 'Vercel',
    description: 'Modern minimalist theme inspired by Vercel design system',
    tags: ['modern', 'minimalist', 'vercel', 'clean'],
    performance: {
      expectedLoadTime: 60,
      cacheability: 'high',
      memoryFootprint: 'medium'
    }
  },
  cosmic: {
    theme: cosmicNightThemeBase as MantineTheme,
    name: 'Cosmic Night',
    icon: IconStars,
    backgroundGradient: cosmicNightThemeBase.other?.backgroundGradient || 'linear-gradient(135deg, #f5f5ff 0%, #e4dfff 25%, #f0f0fa 50%, #e0e0f0 75%, #f5f5ff 100%)',
    primaryColor: '#6e56cf',
    category: 'custom',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    version: '1.0.0',
    description: 'Cosmic-inspired theme with purple accents and starry aesthetics',
    tags: ['cosmic', 'purple', 'night', 'space', 'elegant'],
    performance: {
      expectedLoadTime: 65,
      cacheability: 'high',
      memoryFootprint: 'medium'
    }
  },
  darkmatter: {
    theme: darkMatterThemeBase,
    name: 'Dark Matter',
    icon: IconAtom,
    backgroundGradient: darkMatterThemeBase.other?.backgroundGradient || 'radial-gradient(ellipse at center, oklch(0.1822 0 0) 0%, oklch(0.1797 0.0043 308.1928) 40%, oklch(0.1500 0.0050 308.1928) 100%)',
    primaryColor: 'oklch(0.7214 0.1337 49.9802)',
    category: 'custom',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    version: '1.0.0',
    description: 'Professional cosmic theme with OKLCH color space and dark matter aesthetics',
    tags: ['dark', 'cosmic', 'professional', 'monospace', 'oklch'],
    performance: {
      expectedLoadTime: 70,
      cacheability: 'high',
      memoryFootprint: 'medium'
    }
  }
});

type ThemeKey = keyof ReturnType<typeof createThemeConfig>;

// STEP 2: Enhanced Color Scheme Toggle Component with proper undefined handling
const ColorSchemeToggle: React.FC = React.memo(() => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  
  // FIX: Ensure colorScheme is never undefined
  const currentScheme = colorScheme ?? 'light';
  const isDark = currentScheme === 'dark';

  const handleToggle = useCallback(() => {
    const startTime = performance.now();
    performanceMetrics.colorSchemeChanges++;
    developmentMetrics.userInteractions.colorSchemeToggles++;
    
    toggleColorScheme();
    
    const toggleTime = performance.now() - startTime;
    
    if (isDebugMode()) {
      logger.info('Color scheme toggled', createLogContext({
        from: currentScheme,
        to: isDark ? 'light' : 'dark',
        toggleTime: Math.round(toggleTime),
        totalToggles: performanceMetrics.colorSchemeChanges
      }));
    }

    showNotification({
      title: `${isDark ? '☀️' : '🌙'} ${isDark ? 'Light' : 'Dark'} Mode`,
      message: `Switched to ${isDark ? 'light' : 'dark'} mode`,
      color: isDark ? 'yellow' : 'blue',
      autoClose: 2000,
      position: 'top-right'
    });
  }, [currentScheme, isDark, toggleColorScheme]);

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="lg"
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
    </ActionIcon>
  );
});

// STEP 3: Development Debug Panel Component
const DevelopmentDebugPanel: React.FC = React.memo(() => {
  const themes = useMemo(() => createThemeConfig(), []);
  
  const recentAlerts = useMemo(() => {
    return developmentMetrics.performanceAlerts
      .slice(-5)
      .reverse();
  }, []);

  const validationSummary = useMemo(() => {
    const results = Array.from(developmentMetrics.validationResults.values());
    const totalScore = results.reduce((sum, result) => sum + result.score, 0);
    const averageScore = results.length > 0 ? totalScore / results.length : 0;
    
    return {
      totalThemes: results.length,
      averageScore: Math.round(averageScore),
      validThemes: results.filter(r => r.isValid).length,
      themesWithWarnings: results.filter(r => r.warnings.length > 0).length
    };
  }, []);

  if (!isDebugMode()) return null;

  return (
    <Paper p="md" shadow="sm" mb="md" style={{ backgroundColor: 'rgba(255, 248, 220, 0.9)', border: '2px solid #ffd700' }}>
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <IconBug size={20} color="#ff6b35" />
          <Title order={4} c="orange">Development Debug Panel</Title>
          <Badge size="sm" variant="light" color="orange">sn_debug=true</Badge>
        </Group>
        <Group gap="xs">
          <IconChartBar size={16} />
          <Text size="sm" c="dimmed">Real-time Monitoring</Text>
        </Group>
      </Group>

      <Group gap="xl" align="flex-start">
        {/* Performance Metrics */}
        <div>
          <Text fw={600} size="sm" mb="xs">Performance</Text>
          <Stack gap="xs">
            <Text size="xs">Cache Hit Ratio: {Math.round(performanceMetrics.cacheHits / Math.max(performanceMetrics.cacheHits + performanceMetrics.cacheMisses, 1) * 100)}%</Text>
            <Text size="xs">Avg Switch Time: {Math.round(performanceMetrics.averageSwitchTime)}ms</Text>
            <Text size="xs">Memory Usage: ~{Math.round(performanceMetrics.memoryUsage)}KB</Text>
            <Text size="xs">Theme Switches: {performanceMetrics.themeSwitchCount}</Text>
          </Stack>
        </div>

        {/* Validation Summary */}
        <div>
          <Text fw={600} size="sm" mb="xs">Theme Validation</Text>
          <Stack gap="xs">
            <Text size="xs">Themes Analyzed: {validationSummary.totalThemes}</Text>
            <Text size="xs">Average Score: {validationSummary.averageScore}/100</Text>
            <Text size="xs">Valid Themes: {validationSummary.validThemes}/{validationSummary.totalThemes}</Text>
            <Text size="xs">With Warnings: {validationSummary.themesWithWarnings}</Text>
          </Stack>
        </div>

        {/* Recent Alerts */}
        <div style={{ minWidth: '300px' }}>
          <Text fw={600} size="sm" mb="xs">Recent Alerts ({recentAlerts.length})</Text>
          <Stack gap="xs">
            {recentAlerts.length > 0 ? recentAlerts.map((alert, index) => (
              <Group key={index} gap="xs">
                <IconAlertTriangle 
                  size={12} 
                  color={alert.severity === 'error' ? '#ff4757' : alert.severity === 'warning' ? '#ffa502' : '#3742fa'} 
                />
                <Text size="xs" style={{ 
                  color: alert.severity === 'error' ? '#ff4757' : alert.severity === 'warning' ? '#ffa502' : '#3742fa' 
                }}>
                  {alert.message}
                </Text>
              </Group>
            )) : (
              <Text size="xs" c="dimmed">No recent alerts</Text>
            )}
          </Stack>
        </div>
      </Group>
    </Paper>
  );
});

// Floating Theme Switcher Component - ENHANCED with Dark Matter theme
const FloatingThemeSwitcher: React.FC<{
  currentTheme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
}> = React.memo(({ currentTheme, onThemeChange }) => {
  // PERFORMANCE: Memoize themes to prevent recreation
  const themes = useMemo(() => createThemeConfig(), []);

  // PERFORMANCE: Memoized callback to prevent unnecessary re-renders
  const handleThemeChange = useCallback((themeKey: ThemeKey) => {
    const startTime = performance.now();
    
    performanceMetrics.themeSwitchCount++;
    developmentMetrics.userInteractions.themeSwitches++;
    onThemeChange(themeKey);
    
    const switchTime = performance.now() - startTime;
    performanceMetrics.averageSwitchTime = 
      (performanceMetrics.averageSwitchTime * (performanceMetrics.themeSwitchCount - 1) + switchTime) / 
      performanceMetrics.themeSwitchCount;

    // Track performance categories
    if (switchTime > 100) performanceMetrics.slowSwitches++;
    else if (switchTime < 50) performanceMetrics.fastSwitches++;

    if (isDebugMode()) {
      const validationResult = developmentMetrics.validationResults.get(themeKey);
      logger.info('Theme switch performance (enhanced)', createLogContext({
        from: currentTheme,
        to: themeKey,
        switchTime: Math.round(switchTime),
        averageSwitchTime: Math.round(performanceMetrics.averageSwitchTime),
        totalSwitches: performanceMetrics.themeSwitchCount,
        performanceProfile: {
          fast: performanceMetrics.fastSwitches,
          normal: performanceMetrics.themeSwitchCount - performanceMetrics.fastSwitches - performanceMetrics.slowSwitches,
          slow: performanceMetrics.slowSwitches
        },
        themeMetadata: {
          colorSchemeSupport: themes[themeKey].colorSchemeSupport,
          systemPreferenceAware: themes[themeKey].systemPreferenceAware,
          expectedLoadTime: themes[themeKey].performance?.expectedLoadTime || 'N/A'
        },
        validationScore: validationResult?.score || 'N/A'
      }));
    }
  }, [currentTheme, onThemeChange, themes]);

  return (
    <>
      {/* Floating Settings Wheel - Bottom Right */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}
      >
        <Menu shadow="md" width={320} position="top-end">
          <Menu.Target>
            <ActionIcon
              size="xl"
              variant="filled"
              color="blue"
              style={{
                borderRadius: '50%',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <IconSettings 
                size={24} 
                style={{
                  animation: 'spin 4s linear infinite',
                }}
              />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Theme Selection ({Object.keys(themes).length} themes)</Menu.Label>
            
            {Object.entries(themes).map(([key, config]) => {
              const Icon = config.icon;
              const isActive = currentTheme === key;
              const validationResult = developmentMetrics.validationResults.get(key);
              const isNewTheme = ['vercel', 'cosmic', 'darkmatter'].includes(key);
              
              return (
                <Menu.Item
                  key={key}
                  leftSection={<Icon size={16} />}
                  rightSection={
                    <Group gap="xs">
                      {isActive && <Badge size="xs" variant="light">Active</Badge>}
                      {isNewTheme && <Badge size="xs" variant="outline" color="purple">New</Badge>}
                      {key === 'darkmatter' && <Badge size="xs" variant="filled" color="dark">FIXED</Badge>}
                      {isDebugMode() && validationResult && (
                        <Badge 
                          size="xs" 
                          variant="light" 
                          color={validationResult.score >= 80 ? 'green' : validationResult.score >= 60 ? 'yellow' : 'red'}
                        >
                          {validationResult.score}
                        </Badge>
                      )}
                    </Group>
                  }
                  onClick={() => handleThemeChange(key as ThemeKey)}
                  style={{ 
                    backgroundColor: isActive ? 'var(--mantine-color-blue-light)' : undefined 
                  }}
                >
                  <div>
                    <Text fw={500}>{config.name}</Text>
                    <Text size="xs" c="dimmed">
                      {config.category} • {config.accessibility}
                      {config.systemPreferenceAware && ' • System Aware'}
                      {config.author && ` • by ${config.author}`}
                    </Text>
                    <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
                      {config.description}
                    </Text>
                    {isDebugMode() && config.performance && (
                      <Text size="xs" c="dimmed">
                        Expected: {config.performance.expectedLoadTime}ms • {config.performance.cacheability} cache
                      </Text>
                    )}
                  </div>
                </Menu.Item>
              );
            })}
            
            <Divider />
            <Menu.Label>Color Scheme</Menu.Label>
            <Menu.Item>
              <Group justify="space-between" align="center">
                <Text size="sm">Toggle Light/Dark Mode</Text>
                <ColorSchemeToggle />
              </Group>
            </Menu.Item>
            <Menu.Item disabled>
              <Text size="xs" c="dimmed">
                Auto-detects system preference on first visit
              </Text>
            </Menu.Item>

            {/* DEBUG: Enhanced development statistics */}
            {isDebugMode() && (
              <>
                <Divider />
                <Menu.Label>Development Statistics</Menu.Label>
                <Menu.Item disabled>
                  <Text size="xs" c="dimmed">
                    Cache: {performanceMetrics.cacheHits}H/{performanceMetrics.cacheMisses}M 
                    ({Math.round(performanceMetrics.cacheHits / Math.max(performanceMetrics.cacheHits + performanceMetrics.cacheMisses, 1) * 100)}%)
                  </Text>
                </Menu.Item>
                <Menu.Item disabled>
                  <Text size="xs" c="dimmed">
                    Avg Switch: {Math.round(performanceMetrics.averageSwitchTime)}ms
                  </Text>
                </Menu.Item>
                <Menu.Item disabled>
                  <Text size="xs" c="dimmed">
                    Memory: ~{Math.round(performanceMetrics.memoryUsage)}KB
                  </Text>
                </Menu.Item>
                <Menu.Item disabled>
                  <Text size="xs" c="dimmed">
                    Validation Failures: {performanceMetrics.validationFailures}
                  </Text>
                </Menu.Item>
                <Menu.Item disabled>
                  <Text size="xs" c="dimmed">
                    Performance Alerts: {developmentMetrics.performanceAlerts.length}
                  </Text>
                </Menu.Item>
                <Menu.Item disabled>
                  <Text size="xs" c="dimmed">
                    User Actions: {developmentMetrics.userInteractions.themeSwitches}S / {developmentMetrics.userInteractions.colorSchemeToggles}C
                  </Text>
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      </div>

      {/* CSS for spinning animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
});

// CDN Resource Debug Implementation (CRITICAL for Architecture.md compliance)
const CDNResourceDebugger: React.FC = () => {
  useEffect(() => {
    if (isDebugMode()) {
      performanceMetrics.developmentModeActivations++;
      developmentMetrics.userInteractions.debugModeActivations++;
      
      // Show all external resources loaded from CDNs - with proper type handling
      const cdnResources = Array.from(document.querySelectorAll('link[rel="stylesheet"], script[src]'))
        .filter(el => {
          // Properly handle different element types
          const url = (el as HTMLLinkElement).href || (el as HTMLScriptElement).src || '';
          return url.includes('cdn.') || 
                 url.includes('unpkg.') ||
                 url.includes('jsdelivr.');
        });

      if (cdnResources.length > 0) {
        // Log CDN resources to console via logger system
        const resourceDetails = cdnResources.map((resource, i) => {
          // Type-safe URL extraction (FIX: Fixed variable reference)
          const url = (resource as HTMLLinkElement).href || (resource as HTMLScriptElement).src || '';
          return {
            index: i + 1,
            url,
            type: resource.tagName,
            element: resource
          };
        });

        logger.warn('🚨 CDN RESOURCES DETECTED - VALIDATION RECOMMENDED', createLogContext({
          cdnResourceCount: cdnResources.length,
          resources: resourceDetails,
          debugMode: true,
          validationNote: 'Click each URL in the console to validate resources load correctly'
        }));

        // Log each resource individually for easy clicking
        resourceDetails.forEach((resource) => {
          logger.info(`CDN Resource ${resource.index}: ${resource.url}`, createLogContext({
            resourceType: resource.type,
            resourceUrl: resource.url,
            clickToValidate: true
          }));
        });

        // Show brief, non-intrusive notification
        showNotification({
          title: '🔍 CDN Debug Mode Active',
          message: `${cdnResources.length} CDN resources detected. Check console for validation URLs.`,
          color: 'blue',
          icon: <IconExternalLink size={16} />,
          autoClose: 5000, // Disappears after 5 seconds
          position: 'top-right'
        });
      } else {
        logger.info('CDN Debug Mode: No CDN resources detected', createLogContext({
          debugMode: true,
          cdnResourceCount: 0
        }));

        showNotification({
          title: '✅ CDN Debug Complete',
          message: 'No external CDN resources detected.',
          color: 'green',
          autoClose: 3000,
          position: 'top-right'
        });
      }
    }
  }, []);

  return null; // Debug component doesn't render UI
};

// FIXED: Navigation Header Component - Now uses theme-aware styling instead of inline styles
const NavigationHeader: React.FC = React.memo(() => {
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const currentUser = useMemo(() => {
    // Try to get user from ServiceNow context (Pattern 2A - immediate data)
    const snUser = (window as any).g_user;
    const snImmediateData = (window as any).snImmediateData;
    
    if (snImmediateData?.userContext) {
      return {
        name: snImmediateData.userContext.display_name || 'User',
        firstName: snImmediateData.userContext.first_name || 'User'
      };
    }
    
    return snUser ? {
      name: snUser.getDisplayName?.() || snUser.userName || 'User',
      firstName: snUser.firstName || 'User'
    } : {
      name: 'ServiceNow User',
      firstName: 'User'
    };
  }, []);

  const handleNavigation = useCallback((url: string, label: string) => {
    logger.info('Navigation link clicked', createLogContext({
      destination: label,
      url,
      user: currentUser.name
    }));
    
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [currentUser.name]);

  const handleRefresh = useCallback(() => {
    logger.info('Dashboard refresh requested', createLogContext({
      user: currentUser.name,
      timestamp: new Date().toISOString()
    }));
    
    showNotification({
      title: 'Refreshing Dashboard',
      message: 'Updating store updates data...',
      color: 'blue',
      icon: <IconRefresh size={16} />,
      autoClose: 3000
    });
    
    // This would trigger a refresh of the dashboard data
    window.location.reload();
  }, [currentUser.name]);

  return (
    <Paper 
      p="md" 
      shadow="sm" 
      mb="lg" 
      data-theme-header="true"
    >
      <Group justify="space-between" align="center">
        {/* Welcome Section */}
        <Group gap="md">
          <div>
            <Group gap="xs" align="center">
              <IconUser size={20} color="var(--theme-primary)" />
              <Title order={3} c="blue">
                Welcome back, {currentUser.firstName}!
              </Title>
              {isDebugMode() && (
                <Badge size="sm" variant="light" color="orange">DEBUG</Badge>
              )}
            </Group>
            <Group gap="xs" align="center" mt={4}>
              <IconCalendar size={16} />
              <Text size="sm" c="dimmed">
                {currentDate}
              </Text>
            </Group>
          </div>
        </Group>

        {/* Navigation Menu - STEP 2: Added color scheme toggle */}
        <Group gap="md">
          <ColorSchemeToggle />
          
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>

          <Menu shadow="md" width={280} position="bottom-end">
            <Menu.Target>
              <ActionIcon
                variant="filled"
                color="blue"
                size="lg"
                aria-label="Navigation menu"
              >
                <IconMenu2 size={20} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>ServiceNow Direct Links</Menu.Label>
              
              <Menu.Item
                leftSection={<IconDatabase size={16} />}
                rightSection={<IconExternalLink size={14} />}
                onClick={() => handleNavigation(
                  '/x_snc_store_upda_1_store_updates_list.do?sysparm_clear_stack=true',
                  'Store Updates Table'
                )}
              >
                <div>
                  <Text fw={500}>Store Updates Table</Text>
                  <Text size="xs" c="dimmed">View remote table data directly</Text>
                </div>
              </Menu.Item>

              <Menu.Item
                leftSection={<IconCode size={16} />}
                rightSection={<IconExternalLink size={14} />}
                onClick={() => handleNavigation(
                  '/sys_script_include_list.do?sysparm_query=name=StoreUpdatesProcessor^api_nameLIKEx_snc_store_upda_1',
                  'Script Include'
                )}
              >
                <div>
                  <Text fw={500}>Store Updates Processor</Text>
                  <Text size="xs" c="dimmed">Script Include for data processing</Text>
                </div>
              </Menu.Item>

              <Menu.Item
                leftSection={<IconReportAnalytics size={16} />}
                rightSection={<IconExternalLink size={14} />}
                onClick={() => handleNavigation(
                  '/sys_log_list.do?sysparm_query=sourceLIKEStoreUpdatesProcessor^ORmessageLIKEstore_updates^ORDERBYDESCsys_created_on',
                  'System Log'
                )}
              >
                <div>
                  <Text fw={500}>System Log</Text>
                  <Text size="xs" c="dimmed">View application logs and errors</Text>
                </div>
              </Menu.Item>

              <Divider />
              
              <Menu.Label>Application Info</Menu.Label>
              
              <Menu.Item disabled>
                <Group justify="space-between">
                  <Text size="xs">Version</Text>
                  <Badge size="xs" variant="light">1.0.0</Badge>
                </Group>
              </Menu.Item>
              
              <Menu.Item disabled>
                <Group justify="space-between">
                  <Text size="xs">Scope</Text>
                  <Badge size="xs" variant="light" color="blue">x_snc_store_upda_1</Badge>
                </Group>
              </Menu.Item>

              <Menu.Item disabled>
                <Group justify="space-between">
                  <Text size="xs">Architecture</Text>
                  <Badge size="xs" variant="light" color="green">React 19 + Mantine 8.x</Badge>
                </Group>
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Paper>
  );
});

// FIXED: App Content Component - Uses theme-aware background instead of direct DOM manipulation
const AppContent: React.FC<{
  currentTheme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
}> = ({ currentTheme, onThemeChange }) => {
  // PERFORMANCE: Memoized theme configurations
  const themes = useMemo(() => createThemeConfig(), []);
  
  // PERFORMANCE: Memoized enhanced theme with improved caching
  const enhancedTheme = useMemo(() => {
    return getCachedTheme(currentTheme, themes[currentTheme].theme);
  }, [currentTheme, themes]);

  // Create query client with memoization to prevent recreation
  const queryClient = useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
          retry: (failureCount, error) => {
            // ServiceNow-specific retry logic
            if (failureCount >= 3) return false;
            if (error instanceof Error && error.message.includes('authentication')) return false;
            return true;
          },
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
        mutations: {
          retry: 1,
          retryDelay: 1000,
        }
      }
    });
  }, []);

  // REMOVED: Direct DOM manipulation for background - now handled by theme-aware Container

  // STEP 2: Setup system preference listener
  useEffect(() => {
    performanceMetrics.systemPreferenceDetections++;
    
    const cleanup = setupSystemPreferenceListener((newScheme) => {
      // This could be used to react to system preference changes
      // For now, we just log it when in debug mode
      if (isDebugMode()) {
        logger.info('System preference changed, but user preference takes precedence', createLogContext({
          systemPreference: newScheme,
          note: 'User can manually toggle if desired'
        }));
      }
    });

    return cleanup;
  }, []);

  useEffect(() => {
    // Initialize application logging with enhanced performance metrics
    const initContext = createLogContext({
      version: '1.0.0',
      architecture: 'React 19 + TypeScript + Mantine 8.x + TanStack Query + Zustand',
      scope: 'x_snc_store_upda_1',
      features: [
        'INTEGRATED Theme Architecture (No External DOM Manipulation)',
        'Enhanced Performance-Optimized Theme Switching',
        'Advanced Theme Caching System with TTL',
        'Improved CSS Variables Integration',
        'System Preference Detection',
        'Enhanced Color Scheme Management',
        'Comprehensive Theme Validation System',
        'Real-time Performance Monitoring',
        'Development Experience Improvements',
        'Enhanced TypeScript Types',
        'Performance Alert System',
        'Development Debug Panel',
        'Light/Dark Color Scheme Toggle',
        'Automatic Cache Cleanup',
        'Performance Category Tracking',
        'Memory Usage Monitoring',
        'DEBUG Mode: sn_debug=true URL Parameter',
        'Proper Undefined Handling for Color Schemes',
        'TypeScript Error Resolution',
        'Dual-Source Hybrid Statistics',
        'Advanced DataGrid',
        'Multi-select',
        'Batch Operations',
        'Real-time Search',
        'Advanced Filtering',
        'CI/CD Integration Ready',
        'NEW: Dark Matter Theme Added and Fixed'
      ],
      performance: {
        themeCache: themeCache.size,
        cacheHitRatio: performanceMetrics.cacheHits / Math.max(performanceMetrics.cacheHits + performanceMetrics.cacheMisses, 1),
        averageSwitchTime: Math.round(performanceMetrics.averageSwitchTime),
        memoryUsageKB: Math.round(performanceMetrics.memoryUsage),
        performanceProfile: {
          fast: performanceMetrics.fastSwitches,
          normal: performanceMetrics.themeSwitchCount - performanceMetrics.fastSwitches - performanceMetrics.slowSwitches,
          slow: performanceMetrics.slowSwitches
        },
        colorSchemeChanges: performanceMetrics.colorSchemeChanges,
        systemPreferenceDetections: performanceMetrics.systemPreferenceDetections,
        validationFailures: performanceMetrics.validationFailures,
        performanceAlerts: developmentMetrics.performanceAlerts.length,
        developmentModeActivations: performanceMetrics.developmentModeActivations
      },
      pattern2AData: !!(window as any).snImmediateData,
      currentTheme,
      availableThemes: Object.keys(themes),
      totalThemes: Object.keys(themes).length,
      newThemes: ['vercel', 'cosmic', 'darkmatter'],
      fixedThemes: ['darkmatter'],
      cacheConfig: {
        maxSize: CACHE_MAX_SIZE,
        ttlMinutes: CACHE_TTL / (60 * 1000),
        cleanupIntervalMinutes: CLEANUP_INTERVAL / (60 * 1000)
      },
      debugMode: isDebugMode(),
      systemColorScheme: detectSystemColorScheme(),
      themeEnhancements: {
        systemPreferenceDetection: true,
        enhancedColorSchemeManager: true,
        improvedCSSVariables: true,
        properUndefinedHandling: true,
        comprehensiveValidation: true,
        realTimeMonitoring: true,
        developmentDebugPanel: true,
        enhancedTypeScript: true,
        typeScriptErrorResolution: true,
        integratedThemeArchitecture: true,
        darkMatterThemeFixed: true
      },
      developmentMetrics: isDebugMode() ? {
        userInteractions: developmentMetrics.userInteractions,
        themeValidationResults: developmentMetrics.validationResults.size,
        recentAlerts: developmentMetrics.performanceAlerts.slice(-3).map(a => a.message)
      } : undefined
    });

    logger.info('Store Updates Dashboard Application initialized (DARK MATTER THEME FIXED)', initContext);

    // Track application load performance
    const loadTime = performance.now();
    if (loadTime > 1000) {
      logger.warn('Slow application load detected', createLogContext({
        loadTime: Math.round(loadTime),
        threshold: 1000,
        debugMode: isDebugMode()
      }));
      
      addPerformanceAlert(
        'slow-load',
        `Application loaded slowly: ${Math.round(loadTime)}ms`,
        loadTime > 2000 ? 'error' : 'warning'
      );
    }
  }, [currentTheme, themes]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <CDNResourceDebugger />
        <Notifications />
        
        {/* Floating Theme Switcher - Now inside MantineProvider */}
        <FloatingThemeSwitcher 
          currentTheme={currentTheme}
          onThemeChange={onThemeChange}
        />
        
        {/* FIXED: Container now uses theme-aware background styling */}
        <Container 
          size="xl" 
          py="md"
          data-theme-background="true"
        >
          <Stack gap="lg">
            {/* STEP 3: Development Debug Panel (only shown in debug mode) */}
            <DevelopmentDebugPanel />
            
            {/* Navigation Header */}
            <NavigationHeader />
            
            {/* Main Dashboard */}
            <StoreUpdatesDashboard 
              showHeader={false} // We have our own header now
              compactMode={false}
            />
          </Stack>
        </Container>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

// STEP 2: Enhanced color scheme manager with system preference detection
const colorSchemeManager = createEnhancedColorSchemeManager();

// Main App Component following Architecture.md patterns with ENHANCED theme support
const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('mantine');

  // PERFORMANCE: Memoized theme configurations to prevent recreation
  const themes = useMemo(() => createThemeConfig(), []);
  
  // PERFORMANCE: Memoized enhanced theme with improved caching
  const enhancedTheme = useMemo(() => {
    return getCachedTheme(currentTheme, themes[currentTheme].theme);
  }, [currentTheme, themes]);

  const handleThemeChange = useCallback((themeKey: ThemeKey) => {
    const startTime = performance.now();
    setCurrentTheme(themeKey);
    
    const switchTime = performance.now() - startTime;
    
    logger.info('Base theme changed with Dark Matter theme support', createLogContext({
      newTheme: themeKey,
      themeName: themes[themeKey].name,
      backgroundGradient: themes[themeKey].backgroundGradient,
      colorSchemeNote: 'Light/dark mode available via header toggle',
      switchTime: Math.round(switchTime),
      cacheStatus: themeCache.has(themeKey) ? 'hit' : 'miss',
      themesCached: themeCache.size,
      memoryUsageKB: Math.round(performanceMetrics.memoryUsage),
      debugMode: isDebugMode(),
      systemPreferenceAware: themes[themeKey].systemPreferenceAware,
      validationScore: developmentMetrics.validationResults.get(themeKey)?.score || 'N/A',
      architectureType: 'integrated',
      isNewTheme: ['vercel', 'cosmic', 'darkmatter'].includes(themeKey),
      isFixedTheme: themeKey === 'darkmatter',
      totalThemes: Object.keys(themes).length
    }));

    showNotification({
      title: `🎨 ${themeKey === 'darkmatter' ? '🔧 FIXED' : ['vercel', 'cosmic'].includes(themeKey) ? '✨ NEW' : ''} Theme Changed`,
      message: `Switched to ${themes[themeKey].name}${themes[themeKey].author ? ` by ${themes[themeKey].author}` : ''}`,
      color: themeKey === 'darkmatter' ? 'indigo' : themeKey === 'cosmic' ? 'purple' : themeKey === 'vercel' ? 'dark' : 'blue',
      autoClose: 4000,
      position: 'top-right'
    });
  }, [themes]);

  return (
    <MantineProvider 
      theme={enhancedTheme}
      defaultColorScheme="auto"
      colorSchemeManager={colorSchemeManager}
      cssVariablesResolver={cssVariablesResolver}
    >
      <AppContent 
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
    </MantineProvider>
  );
};

export default App;