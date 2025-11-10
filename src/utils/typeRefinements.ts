// src/utils/typeRefinements.ts
// COMPLIANCE: Fixed - TypeScript type refinements and nullish coalescing utilities
// These utilities help eliminate undefined from function signatures and provide safe defaults

/**
 * Nullish coalescing utilities for type safety and default values
 * These utilities help eliminate undefined from function signatures and provide safe defaults
 */

// String type refinements - eliminate undefined
export type NonEmptyString = string & { readonly __brand: unique symbol };
export type ThemeKey = 'default' | 'cosmic' | 'dark-matter' | 'polaris' | 'servicenow' | 'vercel';
export type SortDirection = 'asc' | 'desc';
export type FilterOperator = 'equals' | 'contains' | 'startsWith' | 'endsWith';

// Utility type to ensure non-undefined values
export type NonUndefined<T> = T extends undefined ? never : T;

// Utility type to make specific properties required and non-undefined
export type RequireNonUndefined<T, K extends keyof T> = T & {
  [P in K]-?: NonUndefined<T[P]>;
};

// Theme key utilities with nullish coalescing
export const getThemeKey = (themeKey: string | null | undefined): ThemeKey => {
  return (themeKey ?? 'default') as ThemeKey;
};

export const getValidThemeKey = (themeKey: unknown): ThemeKey => {
  const validKeys: ThemeKey[] = ['default', 'cosmic', 'dark-matter', 'polaris', 'servicenow', 'vercel'];
  
  if (typeof themeKey === 'string' && validKeys.includes(themeKey as ThemeKey)) {
    return themeKey as ThemeKey;
  }
  
  return 'default';
};

// String utilities with nullish coalescing
export const getString = (value: string | null | undefined, defaultValue = ''): string => {
  return value ?? defaultValue;
};

export const getNonEmptyString = (value: string | null | undefined, defaultValue: string): string => {
  const result = value ?? defaultValue;
  return result.trim() || defaultValue;
};

// Number utilities with nullish coalescing
export const getNumber = (value: number | string | null | undefined, defaultValue = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  return defaultValue;
};

export const getInteger = (value: number | string | null | undefined, defaultValue = 0): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return Math.floor(value);
  }
  
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  return defaultValue;
};

// Boolean utilities with nullish coalescing
export const getBoolean = (value: boolean | string | null | undefined, defaultValue = false): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false;
    }
  }
  
  return defaultValue;
};

// Array utilities with nullish coalescing - FIXED: Handle readonly arrays
export const getArray = <T>(value: readonly T[] | T[] | null | undefined, defaultValue: T[] = []): T[] => {
  if (Array.isArray(value)) {
    // Convert readonly array to mutable array if needed
    return value.slice(); // Creates a mutable copy
  }
  return defaultValue;
};

export const getReadonlyArray = <T>(value: readonly T[] | T[] | null | undefined, defaultValue: readonly T[] = []): readonly T[] => {
  return Array.isArray(value) ? value : defaultValue;
};

export const getNonEmptyArray = <T>(value: readonly T[] | T[] | null | undefined, defaultValue: T[]): T[] => {
  const result = getArray(value);
  return result.length > 0 ? result : defaultValue;
};

// Object utilities with nullish coalescing
export const getObject = <T extends Record<string, any>>(
  value: T | null | undefined,
  defaultValue: T
): T => {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : defaultValue;
};

// Date utilities with nullish coalescing
export const getDate = (value: string | Date | null | undefined, defaultValue?: Date): Date => {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }
  
  if (typeof value === 'string' && value.trim()) {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  
  return defaultValue ?? new Date();
};

export const getDateString = (
  value: string | Date | null | undefined,
  format: 'iso' | 'date' | 'datetime' = 'iso'
): string => {
  const date = getDate(value);
  
  switch (format) {
    case 'date':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    case 'datetime':
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'iso':
    default:
      return date.toISOString();
  }
};

// Sorting utilities with type safety
export const getSortDirection = (value: string | null | undefined): SortDirection => {
  return value === 'desc' ? 'desc' : 'asc';
};

// Filter utilities with type safety
export const getFilterOperator = (value: string | null | undefined): FilterOperator => {
  const validOperators: FilterOperator[] = ['equals', 'contains', 'startsWith', 'endsWith'];
  return validOperators.includes(value as FilterOperator) ? (value as FilterOperator) : 'contains';
};

// ServiceNow-specific utilities
export const getSysId = (value: string | null | undefined): string => {
  const sysId = getString(value);
  // Basic validation for ServiceNow sys_id format (32 character hex string)
  return /^[a-f0-9]{32}$/.test(sysId) ? sysId : '';
};

export const getServiceNowDateTime = (value: string | null | undefined): string => {
  const dateStr = getString(value);
  if (!dateStr) return '';
  
  // ServiceNow datetime format validation
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) ? date.toISOString() : '';
};

// Performance optimization utilities
export const memoizeWithNullishCoalescing = <Args extends any[], Return>(
  fn: (...args: Args) => Return,
  keyGenerator?: (...args: Args) => string
): ((...args: Args) => Return) => {
  const cache = new Map<string, Return>();
  
  return (...args: Args): Return => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!; // Safe to use ! because we checked has()
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Type guards for better type narrowing
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const isValidNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
};

export const isValidArray = <T>(value: unknown): value is T[] => {
  return Array.isArray(value);
};

export const isValidObject = (value: unknown): value is Record<string, any> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

// Configuration with defaults using nullish coalescing
export interface AppConfig {
  theme: ThemeKey;
  pageSize: number;
  enableDebug: boolean;
  maxRetries: number;
  timeout: number;
  enableCache: boolean;
}

export const getAppConfig = (config: Partial<AppConfig> | null | undefined): AppConfig => {
  const defaultConfig: AppConfig = {
    theme: 'default',
    pageSize: 25,
    enableDebug: false,
    maxRetries: 3,
    timeout: 5000,
    enableCache: true
  };
  
  return {
    theme: getValidThemeKey(config?.theme) ?? defaultConfig.theme,
    pageSize: getInteger(config?.pageSize, defaultConfig.pageSize),
    enableDebug: getBoolean(config?.enableDebug, defaultConfig.enableDebug),
    maxRetries: getInteger(config?.maxRetries, defaultConfig.maxRetries),
    timeout: getInteger(config?.timeout, defaultConfig.timeout),
    enableCache: getBoolean(config?.enableCache, defaultConfig.enableCache)
  };
};

// React Hook utilities for better type safety
export const useNullishCoalescing = <T>(
  value: T | null | undefined,
  defaultValue: T
): T => {
  return React.useMemo(() => value ?? defaultValue, [value, defaultValue]);
};

// Re-export React for the hook utility
import React from 'react';