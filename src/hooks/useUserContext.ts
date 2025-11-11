// src/hooks/useUserContext.ts
// COMPLIANCE: Step 4 - Updated with refined types and nullish coalescing
// Architecture.md Section 4.5: Pattern 2A - Immediate Data Access
// Hook for accessing server-injected user context with zero loading states
// Following ServiceNow-Optimized Data Architecture (Hybrid Pattern)

import { useMemo } from 'react';
import { logger, createLogContext } from '../monitoring/logger';
import { 
  getString, 
  getBoolean, 
  getInteger, 
  getArray, 
  getSysId,
  getServiceNowDateTime,
  type NonUndefined 
} from '../utils/typeRefinements';

// Pattern 2A: Immediate Data Types with refined type safety
export interface UserContext {
  // Required fields - never undefined
  readonly sys_id: string;
  readonly user_name: string;
  readonly display_name: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly is_admin: boolean;
  readonly time_zone: string;
  readonly date_format: string;
  readonly time_format: string;
  readonly language: string;
  readonly session_id: string;
}

export interface SystemContext {
  // Required fields - never undefined
  readonly instance_name: string;
  readonly base_url: string;
  readonly build_date: string;
  readonly version: string;
  readonly instance_version: string;
  readonly instance_patchlevel: string;
  readonly sys_time_zone: string;
  readonly current_time: string;
  readonly current_time_ms: string;
  readonly debug_enabled: string;
}

export interface AppContext {
  // Required fields - never undefined
  readonly app_scope: string;
  readonly app_name: string;
  readonly app_version: string;
  readonly table_name: string;
  readonly has_admin_role: string;
  readonly can_export: string;
  readonly can_bulk_update: string;
  readonly max_export_records: string;
  readonly enable_debug_panel: string;
}

export interface QuickStats {
  // Required fields - never undefined
  readonly totalRecords: number;
  readonly levelDistribution: {
    readonly major: string;
    readonly minor: string;
    readonly patch: string;
  };
  readonly calculatedAt: string;
  readonly source: string;
}

export interface ImmediateData {
  // Required fields - never undefined
  readonly userContext: UserContext;
  readonly systemContext: SystemContext;
  readonly appContext: AppContext;
  readonly quickStats: QuickStats;
  readonly injectionTime: string;
  readonly pattern: string;
}

// Extend window type for Pattern 2A data
declare global {
  interface Window {
    snImmediateData?: ImmediateData;
  }
}

// Factory function to create UserContext with nullish coalescing
const createUserContext = (data: any | null | undefined): UserContext => {
  return {
    sys_id: getSysId(data?.sys_id) ?? '',
    user_name: getString(data?.user_name, ''),
    display_name: getString(data?.display_name, 'User'),
    first_name: getString(data?.first_name, 'User'),
    last_name: getString(data?.last_name, ''),
    email: getString(data?.email, ''),
    roles: getArray(data?.roles, []),
    is_admin: getBoolean(data?.is_admin, false),
    time_zone: getString(data?.time_zone, 'GMT'),
    date_format: getString(data?.date_format, 'yyyy-MM-dd'),
    time_format: getString(data?.time_format, 'HH:mm:ss'),
    language: getString(data?.language, 'en'),
    session_id: getString(data?.session_id, '')
  };
};

// Factory function to create SystemContext with nullish coalescing
const createSystemContext = (data: any | null | undefined): SystemContext => {
  return {
    instance_name: getString(data?.instance_name, 'ServiceNow'),
    base_url: getString(data?.base_url, window?.location?.origin ?? ''),
    build_date: getString(data?.build_date, ''),
    version: getString(data?.version, ''),
    instance_version: getString(data?.instance_version, ''),
    instance_patchlevel: getString(data?.instance_patchlevel, ''),
    sys_time_zone: getString(data?.sys_time_zone, 'GMT'),
    current_time: getServiceNowDateTime(data?.current_time) ?? new Date().toISOString(),
    current_time_ms: getString(data?.current_time_ms, Date.now().toString()),
    debug_enabled: getString(data?.debug_enabled, 'false')
  };
};

// Factory function to create AppContext with nullish coalescing
const createAppContext = (data: any | null | undefined): AppContext => {
  return {
    app_scope: getString(data?.app_scope, 'x_snc_store_upda_1'),
    app_name: getString(data?.app_name, 'Store Updates Manager'),
    app_version: getString(data?.app_version, '1.0.0'),
    table_name: getString(data?.table_name, 'x_snc_store_upda_1_store_updates'),
    has_admin_role: getString(data?.has_admin_role, 'false'),
    can_export: getString(data?.can_export, 'false'),
    can_bulk_update: getString(data?.can_bulk_update, 'false'),
    max_export_records: getString(data?.max_export_records, '1000'),
    enable_debug_panel: getString(data?.enable_debug_panel, 'false')
  };
};

// Factory function to create QuickStats with nullish coalescing
const createQuickStats = (data: any | null | undefined): QuickStats => {
  return {
    totalRecords: getInteger(data?.totalRecords, 0),
    levelDistribution: {
      major: getString(data?.levelDistribution?.major, '0'),
      minor: getString(data?.levelDistribution?.minor, '0'),
      patch: getString(data?.levelDistribution?.patch, '0')
    },
    calculatedAt: getServiceNowDateTime(data?.calculatedAt) ?? new Date().toISOString(),
    source: getString(data?.source, 'fallback')
  };
};

/**
 * Pattern 2A: Immediate Data Access Hook with refined types
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
      
      // Create fallback data using factory functions and nullish coalescing
      const fallbackData: ImmediateData & { isPattern2A: boolean } = {
        userContext: createUserContext({
          sys_id: fallbackUser?.userID,
          user_name: fallbackUser?.userName,
          display_name: fallbackUser?.getDisplayName?.(),
          first_name: fallbackUser?.firstName ?? 'User',
          last_name: fallbackUser?.lastName,
          email: fallbackUser?.email,
          roles: fallbackUser?.roles,
          is_admin: false
        }),
        systemContext: createSystemContext({
          current_time: new Date().toISOString(),
          current_time_ms: Date.now().toString(),
          debug_enabled: 'false'
        }),
        appContext: createAppContext({}),
        quickStats: createQuickStats({}),
        injectionTime: new Date().toISOString(),
        pattern: '2A-immediate-data-fallback',
        isPattern2A: false
      };
      
      return fallbackData;
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
 * Pattern 2A: Enhanced User Context Hook with refined types and nullish coalescing
 * Provides user-friendly access to immediate user data
 */
export const useEnhancedUserContext = () => {
  const immediateData = useUserContext();
  
  const enhancedContext = useMemo(() => {
    const { userContext, appContext, systemContext } = immediateData;
    
    // Enhanced fullName with nullish coalescing
    const fullName = `${userContext.first_name} ${userContext.last_name}`.trim() || userContext.display_name || 'User';
    
    return {
      // User information (zero loading state) with refined types
      displayName: userContext.display_name,
      firstName: userContext.first_name,
      fullName,
      email: userContext.email,
      isAdmin: getBoolean(userContext.is_admin, false),
      
      // Capabilities (immediate access) with safe type conversion
      capabilities: {
        canExport: getBoolean(appContext.can_export, false),
        canBulkUpdate: getBoolean(appContext.can_bulk_update, false),
        canAccessDebugPanel: getBoolean(appContext.enable_debug_panel, false),
        maxExportRecords: getInteger(appContext.max_export_records, 1000)
      },
      
      // Application context with defaults
      app: {
        name: appContext.app_name,
        version: appContext.app_version,
        scope: appContext.app_scope
      },
      
      // System information with defaults
      system: {
        instanceName: systemContext.instance_name,
        version: systemContext.version,
        instanceVersion: systemContext.instance_version,
        instancePatchlevel: systemContext.instance_patchlevel,
        currentTime: systemContext.current_time,
        baseUrl: systemContext.base_url
      },
      
      // Pattern 2A metadata with safe data access
      pattern2A: {
        isAvailable: immediateData.isPattern2A,
        injectionTime: immediateData.injectionTime,
        dataAge: immediateData.injectionTime ? 
          Math.max(0, new Date().getTime() - new Date(immediateData.injectionTime).getTime()) : 0
      }
    };
  }, [immediateData]);
  
  return enhancedContext;
};

/**
 * Pattern 2A: Quick Stats Hook with refined types and nullish coalescing
 * Provides immediate access to pre-calculated statistics
 */
export const useQuickStats = () => {
  const immediateData = useUserContext();
  
  const quickStats = useMemo(() => {
    const { quickStats } = immediateData;
    
    return {
      // Basic stats with safe integer conversion
      totalRecords: quickStats.totalRecords,
      levelDistribution: {
        major: getInteger(quickStats.levelDistribution.major, 0),
        minor: getInteger(quickStats.levelDistribution.minor, 0),
        patch: getInteger(quickStats.levelDistribution.patch, 0)
      },
      
      // Computed stats with nullish coalescing - using level distribution for critical count
      totalMajorUpdates: getInteger(quickStats.levelDistribution.major, 0),
      totalMinorUpdates: getInteger(quickStats.levelDistribution.minor, 0),
      totalPatchUpdates: getInteger(quickStats.levelDistribution.patch, 0),
      totalCriticalUpdates: getInteger(quickStats.levelDistribution.major, 0), // Major = Critical
      
      // Pattern 2A metadata with defaults
      isImmediate: immediateData.isPattern2A,
      lastUpdated: immediateData.injectionTime,
      source: quickStats.source,
      calculatedAt: quickStats.calculatedAt
    };
  }, [immediateData]);
  
  return quickStats;
};

// Type exports for external use
export type EnhancedUserContext = ReturnType<typeof useEnhancedUserContext>;
export type QuickStatsData = ReturnType<typeof useQuickStats>;

// Factory function exports for creating contexts elsewhere
export { 
  createUserContext, 
  createSystemContext, 
  createAppContext, 
  createQuickStats 
};