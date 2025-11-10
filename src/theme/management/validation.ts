// src/theme/management/validation.ts
// Theme validation system
// Extracted from app.tsx for better maintainability

import { MantineTheme } from '@mantine/core';
import { getString } from '../../utils/typeRefinements';

export interface ThemeValidationResult {
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
    hasBackgroundSystem: boolean;
    hasHeaderSystem: boolean;
    hasCSSVariables: boolean;
  };
}

export const validateTheme = (themeKey: string, theme: MantineTheme): ThemeValidationResult => {
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

  // Validate integrated background system
  const hasBackgroundSystem = !!(
    theme.other?.backgroundGradient && 
    (theme.other?.cssVariables?.['--theme-background'] || theme.other?.cssVariables?.['--polaris-background'])
  );
  if (!hasBackgroundSystem) {
    warnings.push(`Theme '${themeKey}' missing integrated background system`);
    score -= 10;
  }

  // Validate integrated header system
  const hasHeaderSystem = !!(
    theme.other?.headerBackground && 
    (theme.other?.cssVariables?.['--theme-header-bg'] || theme.other?.cssVariables?.['--polaris-header-bg'])
  );
  if (!hasHeaderSystem) {
    warnings.push(`Theme '${themeKey}' missing integrated header system`);
    score -= 8;
  }

  // Validate CSS variables system
  const hasCSSVariables = !!(theme.other?.cssVariables && Object.keys(theme.other.cssVariables).length >= 3);
  if (!hasCSSVariables) {
    warnings.push(`Theme '${themeKey}' missing comprehensive CSS variables`);
    score -= 5;
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