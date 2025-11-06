// src/hooks/useUserContext.ts
// Architecture.md Section 4.5: Pattern 2A - Immediate Data Access
// Hook for accessing server-injected user context with zero loading states
// Following ServiceNow-Optimized Data Architecture (Hybrid Pattern)
// FIXED: Updated to match actual injected data structure

import { useMemo } from 'react';
import { logger, createLogContext } from '../monitoring/logger';

// Pattern 2A: Immediate Data Types
export interface UserContext {
  sys_id: string;
  user_name: string;
  display_name: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  is_admin: boolean;
  time_zone: string;
  date_format: string;
  time_format: string;
  language: string;
  session_id: string;
}

export interface SystemContext {
  instance_name: string;
  base_url: string;
  build_date: string;
  version: string;
  sys_time_zone: string; // FIXED: Match injected property name
  current_time: string;
  current_time_ms: string; // FIXED: Injected as string
  debug_enabled: string; // FIXED: Injected as string
}

export interface AppContext {
  app_scope: string;
  app_name: string;
  app_version: string;
  table_name: string;
  has_admin_role: string; // FIXED: Injected as string
  can_export: string; // FIXED: Injected as string
  can_bulk_update: string; // FIXED: Injected as string
  max_export_records: string; // FIXED: Injected as string
  enable_debug_panel: string; // FIXED: Injected as string
}

export interface QuickStats {
  totalRecords: number; // FIXED: Match injected property name
  levelDistribution: { // FIXED: Match injected property name
    major: string; // FIXED: Injected as string
    minor: string; // FIXED: Injected as string
    patch: string; // FIXED: Injected as string
  };
  batchLevelDistribution: { // FIXED: Match injected property name
    critical: string; // FIXED: Injected as string
    high: string; // FIXED: Injected as string
    medium: string; // FIXED: Injected as string
    low: string; // FIXED: Injected as string
  };
  calculatedAt: string;
  source: string;
}

export interface ImmediateData {
  userContext: UserContext;
  systemContext: SystemContext;
  appContext: AppContext;
  quickStats: QuickStats;
  injectionTime: string; // FIXED: Injected as string
  pattern: string;
}

// Extend window type for Pattern 2A data
declare global {
  interface Window {
    snImmediateData?: ImmediateData;
  }
}

/**
 * Pattern 2A: Immediate Data Access Hook
 * Following Architecture.md Section 4.5: Zero loading states through server injection
 * 
 * This hook provides instant access to user context and system information
 * that was injected server-side via Jelly templates in the UI Page.
 */
export const useUserContext = () => {
  const immediateData = useMemo(() => {
    const data = (window as any).snImmediateData as ImmediateData | undefined;
    
    if (!data) {
      logger.warn('Pattern 2A immediate data not found', createLogContext({
        pattern: '2A-missing-data',
        windowSnImmediateData: !!(window as any).snImmediateData,
        fallbackMode: true
      }));
      
      // Fallback to traditional g_user if Pattern 2A data is missing
      const fallbackUser = (window as any).g_user;
      return {
        userContext: {
          sys_id: fallbackUser?.userID || '',
          user_name: fallbackUser?.userName || '',
          display_name: fallbackUser?.getDisplayName?.() || 'User',
          first_name: fallbackUser?.firstName || 'User',
          last_name: fallbackUser?.lastName || '',
          email: fallbackUser?.email || '',
          roles: fallbackUser?.roles || [],
          is_admin: false,
          time_zone: 'GMT',
          date_format: 'yyyy-MM-dd',
          time_format: 'HH:mm:ss',
          language: 'en',
          session_id: ''
        },
        systemContext: {
          instance_name: 'ServiceNow',
          base_url: window.location.origin,
          build_date: '',
          version: '',
          sys_time_zone: 'GMT',
          current_time: new Date().toISOString(),
          current_time_ms: Date.now().toString(),
          debug_enabled: 'false'
        },
        appContext: {
          app_scope: 'unknown',
          app_name: 'Store Updates Manager',
          app_version: '1.0.0',
          table_name: 'x_snc_store_upda_1_store_updates',
          has_admin_role: 'false',
          can_export: 'false',
          can_bulk_update: 'false',
          max_export_records: '1000',
          enable_debug_panel: 'false'
        },
        quickStats: {
          totalRecords: 0,
          levelDistribution: { major: '0', minor: '0', patch: '0' },
          batchLevelDistribution: { critical: '0', high: '0', medium: '0', low: '0' },
          calculatedAt: new Date().toISOString(),
          source: 'fallback'
        },
        injectionTime: new Date().toISOString(),
        pattern: '2A-immediate-data-fallback',
        isPattern2A: false
      };
    }

    logger.info('Pattern 2A immediate data accessed', createLogContext({
      pattern: '2A-immediate-access',
      userFirstName: data.userContext.first_name,
      totalRecords: data.quickStats.totalRecords,
      injectionAge: data.injectionTime,
      hasAdminRole: data.appContext.has_admin_role
    }));

    return {
      ...data,
      isPattern2A: true
    };
  }, []);

  return immediateData;
};

/**
 * Pattern 2A: Enhanced User Context Hook
 * Provides user-friendly access to immediate user data
 */
export const useEnhancedUserContext = () => {
  const immediateData = useUserContext();
  
  const enhancedContext = useMemo(() => {
    const { userContext, appContext, systemContext } = immediateData;
    
    // HELPER: Safe boolean conversion for string/boolean values
    const toBool = (value: any): boolean => {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.toLowerCase() === 'true';
      return Boolean(value);
    };
    
    return {
      // User information (zero loading state)
      displayName: userContext.display_name,
      firstName: userContext.first_name,
      fullName: `${userContext.first_name} ${userContext.last_name}`.trim(),
      email: userContext.email,
      isAdmin: toBool(userContext.is_admin),
      
      // Capabilities (immediate access) - FIXED: Safe conversion of strings to booleans
      capabilities: {
        canExport: toBool(appContext.can_export),
        canBulkUpdate: toBool(appContext.can_bulk_update),
        canAccessDebugPanel: toBool(appContext.enable_debug_panel),
        maxExportRecords: parseInt(appContext.max_export_records || '1000')
      },
      
      // Application context
      app: {
        name: appContext.app_name,
        version: appContext.app_version,
        scope: appContext.app_scope
      },
      
      // System information
      system: {
        instanceName: systemContext.instance_name,
        version: systemContext.version,
        currentTime: systemContext.current_time,
        baseUrl: systemContext.base_url
      },
      
      // Pattern 2A metadata
      pattern2A: {
        isAvailable: immediateData.isPattern2A,
        injectionTime: immediateData.injectionTime,
        dataAge: immediateData.injectionTime ? new Date().getTime() - new Date(immediateData.injectionTime).getTime() : 0
      }
    };
  }, [immediateData]);
  
  return enhancedContext;
};

/**
 * Pattern 2A: Quick Stats Hook
 * Provides immediate access to pre-calculated statistics
 */
export const useQuickStats = () => {
  const immediateData = useUserContext();
  
  const quickStats = useMemo(() => {
    const { quickStats } = immediateData;
    
    return {
      totalRecords: quickStats.totalRecords,
      levelDistribution: {
        major: parseInt(quickStats.levelDistribution.major || '0'),
        minor: parseInt(quickStats.levelDistribution.minor || '0'),
        patch: parseInt(quickStats.levelDistribution.patch || '0')
      },
      batchLevelDistribution: {
        critical: parseInt(quickStats.batchLevelDistribution.critical || '0'),
        high: parseInt(quickStats.batchLevelDistribution.high || '0'),
        medium: parseInt(quickStats.batchLevelDistribution.medium || '0'),
        low: parseInt(quickStats.batchLevelDistribution.low || '0')
      },
      
      // Computed stats
      totalMajorUpdates: parseInt(quickStats.levelDistribution.major || '0'),
      totalMinorUpdates: parseInt(quickStats.levelDistribution.minor || '0'),
      totalPatchUpdates: parseInt(quickStats.levelDistribution.patch || '0'),
      totalCriticalUpdates: parseInt(quickStats.batchLevelDistribution.critical || '0'),
      
      // Pattern 2A metadata
      isImmediate: immediateData.isPattern2A,
      lastUpdated: immediateData.injectionTime,
      source: quickStats.source,
      calculatedAt: quickStats.calculatedAt
    };
  }, [immediateData]);
  
  return quickStats;
};