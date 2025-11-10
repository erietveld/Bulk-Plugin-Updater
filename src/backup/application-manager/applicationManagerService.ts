// src/services/applicationManagerService.ts
// ServiceNow Application Manager API service layer
// Following Architecture.md service layer integration patterns
// Integrates with the documented internal Application Manager API

import { apiService } from '../api/apiService';
import { logger, createLogContext } from '../monitoring/logger';
import type { ServiceNowRecord, ApiResponse, ApiListResponse } from '../types/api';

// Application Manager API response interfaces based on documented API
export interface AppManagerApplication extends ServiceNowRecord {
  app_id: string;
  name: string;
  version: string;
  description?: string;
  publisher?: string;
  status?: string;
  installation_status?: string;
  update_available?: boolean;
  latest_version?: string;
  category?: string;
  size?: string;
  last_updated?: string;
  dependencies?: string[];
  source?: 'platform' | 'store';
}

export interface AppManagerPlugin extends ServiceNowRecord {
  plugin_id: string;
  name: string;
  description?: string;
  active: boolean;
  version: string;
  installation_status?: string;
}

export interface AppManagerInstallationProgress {
  tracker_id: string;
  status: string;
  status_label: string;
  progress_percentage: number;
  message: string;
  error?: string;
}

export interface AppManagerDependency {
  id: string;
  name: string;
  version: string;
  type: 'plugin' | 'application';
  is_plugin: boolean;
  required: boolean;
  installed: boolean;
}

// Tab context types for the Application Manager API
export type AppManagerTabContext = 'available_for_you' | 'installed' | 'updates';

// Application Manager Service Class
class ApplicationManagerService {
  private baseEndpoint = '/api/sn_appclient/appmanager';

  /**
   * Get applications based on tab context (available, installed, updates)
   */
  async getApplications(
    tabContext: AppManagerTabContext,
    searchKey?: string,
    limit?: number,
    offset?: number
  ): Promise<ApiListResponse<AppManagerApplication>> {
    logger.info('Fetching applications from Application Manager API', createLogContext({
      tabContext,
      searchKey,
      limit,
      offset,
      endpoint: `${this.baseEndpoint}/apps`
    }));

    try {
      const response = await apiService.post<AppManagerApplication[]>(
        `${this.baseEndpoint}/apps`,
        {}, // Empty body for POST request
        {
          params: {
            tab_context: tabContext,
            search_key: searchKey || '',
            sysparm_limit: limit || 100,
            sysparm_offset: offset || 0
          }
        }
      );

      const applications = Array.isArray(response.result) ? response.result : [];

      logger.info('Applications fetched successfully', createLogContext({
        tabContext,
        count: applications.length,
        hasSearchKey: !!searchKey
      }));

      return {
        result: applications,
        total: applications.length, // API doesn't provide total count
        count: applications.length,
        offset: offset || 0,
        limit: limit || 100
      };

    } catch (error) {
      logger.error('Failed to fetch applications from Application Manager API',
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({
          tabContext,
          searchKey,
          endpoint: `${this.baseEndpoint}/apps`
        })
      );
      throw error;
    }
  }

  /**
   * Get plugins based on tab context and active status
   */
  async getPlugins(
    tabContext: AppManagerTabContext,
    active?: boolean,
    searchKey?: string,
    limit?: number,
    offset?: number
  ): Promise<ApiListResponse<AppManagerPlugin>> {
    logger.info('Fetching plugins from Application Manager API', createLogContext({
      tabContext,
      active,
      searchKey,
      limit,
      offset
    }));

    try {
      const response = await apiService.post<AppManagerPlugin[]>(
        `${this.baseEndpoint}/plugins`,
        {},
        {
          params: {
            tab_context: tabContext,
            active: active?.toString(),
            search_key: searchKey || '',
            sysparm_limit: limit || 100,
            sysparm_offset: offset || 0
          }
        }
      );

      const plugins = Array.isArray(response.result) ? response.result : [];

      return {
        result: plugins,
        total: plugins.length,
        count: plugins.length,
        offset: offset || 0,
        limit: limit || 100
      };

    } catch (error) {
      logger.error('Failed to fetch plugins from Application Manager API',
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({ tabContext, active, searchKey })
      );
      throw error;
    }
  }

  /**
   * Get detailed information for a specific application
   */
  async getApplicationDetails(appId: string): Promise<ApiResponse<AppManagerApplication>> {
    logger.info('Fetching application details', createLogContext({ appId }));

    try {
      const response = await apiService.get<AppManagerApplication>(
        `${this.baseEndpoint}/app/${appId}`
      );

      logger.info('Application details fetched successfully', createLogContext({
        appId,
        appName: response.result.name
      }));

      return response;

    } catch (error) {
      logger.error('Failed to fetch application details',
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({ appId })
      );
      throw error;
    }
  }

  /**
   * Get application dependencies
   */
  async getApplicationDependencies(
    scope: string,
    firstLevelOnly = true
  ): Promise<ApiResponse<AppManagerDependency[]>> {
    logger.info('Fetching application dependencies', createLogContext({
      scope,
      firstLevelOnly
    }));

    try {
      const response = await apiService.post<AppManagerDependency[]>(
        `${this.baseEndpoint}/dependencies`,
        {},
        {
          params: {
            scope,
            first_level_only: firstLevelOnly.toString()
          }
        }
      );

      const dependencies = Array.isArray(response.result) ? response.result : [];

      logger.info('Dependencies fetched successfully', createLogContext({
        scope,
        dependencyCount: dependencies.length
      }));

      return {
        ...response,
        result: dependencies
      };

    } catch (error) {
      logger.error('Failed to fetch application dependencies',
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({ scope, firstLevelOnly })
      );
      throw error;
    }
  }

  /**
   * Install an application
   */
  async installApplication(
    appId: string,
    version: string,
    options: {
      customizationVersion?: string;
      loadDemoData?: boolean;
    } = {}
  ): Promise<ApiResponse<{ tracker_id: string; status: string; message: string }>> {
    logger.info('Installing application via Application Manager API', createLogContext({
      appId,
      version,
      options
    }));

    try {
      const response = await apiService.get(
        `${this.baseEndpoint}/app/install`,
        {
          params: {
            app_id: appId,
            version: version,
            customization_version: options.customizationVersion,
            load_demo_data: options.loadDemoData?.toString() || 'false'
          }
        }
      );

      logger.info('Application installation started', createLogContext({
        appId,
        version,
        trackerId: response.result?.tracker_id
      }));

      return response;

    } catch (error) {
      logger.error('Failed to install application',
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({ appId, version, options })
      );
      throw error;
    }
  }

  /**
   * Update an application
   */
  async updateApplication(
    appId: string,
    version: string,
    options: {
      customizationVersion?: string;
      loadDemoData?: boolean;
    } = {}
  ): Promise<ApiResponse<{ tracker_id: string; status: string; message: string }>> {
    logger.info('Updating application via Application Manager API', createLogContext({
      appId,
      version,
      options
    }));

    try {
      const response = await apiService.get(
        `${this.baseEndpoint}/app/update`,
        {
          params: {
            app_id: appId,
            version: version,
            customization_version: options.customizationVersion,
            load_demo_data: options.loadDemoData?.toString() || 'false'
          }
        }
      );

      logger.info('Application update started', createLogContext({
        appId,
        version,
        trackerId: response.result?.tracker_id
      }));

      return response;

    } catch (error) {
      logger.error('Failed to update application',
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({ appId, version, options })
      );
      throw error;
    }
  }

  /**
   * Track installation/update progress
   */
  async getInstallationProgress(trackerId: string): Promise<ApiResponse<AppManagerInstallationProgress>> {
    logger.info('Fetching installation progress', createLogContext({ trackerId }));

    try {
      const response = await apiService.get<AppManagerInstallationProgress>(
        `${this.baseEndpoint}/progress/${trackerId}`
      );

      logger.info('Installation progress fetched', createLogContext({
        trackerId,
        status: response.result.status,
        progress: response.result.progress_percentage
      }));

      return response;

    } catch (error) {
      logger.error('Failed to fetch installation progress',
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({ trackerId })
      );
      throw error;
    }
  }

  /**
   * Get all in-progress installations
   */
  async getInProgressInstallations(
    limit?: number,
    offset?: number
  ): Promise<ApiListResponse<AppManagerInstallationProgress>> {
    logger.info('Fetching in-progress installations', createLogContext({ limit, offset }));

    try {
      const response = await apiService.get<AppManagerInstallationProgress[]>(
        `${this.baseEndpoint}/installations`,
        {
          params: {
            sysparm_limit: limit || 100,
            sysparm_offset: offset || 0
          }
        }
      );

      const installations = Array.isArray(response.result) ? response.result : [];

      return {
        result: installations,
        total: installations.length,
        count: installations.length,
        offset: offset || 0,
        limit: limit || 100
      };

    } catch (error) {
      logger.error('Failed to fetch in-progress installations',
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({ limit, offset })
      );
      throw error;
    }
  }

  /**
   * Get application manifest
   */
  async getApplicationManifest(
    sourceAppId: string,
    version: string
  ): Promise<ApiResponse<any>> {
    logger.info('Fetching application manifest', createLogContext({
      sourceAppId,
      version
    }));

    try {
      const response = await apiService.get(
        `${this.baseEndpoint}/manifest`,
        {
          params: {
            source_app_id: sourceAppId,
            version: version
          }
        }
      );

      return response;

    } catch (error) {
      logger.error('Failed to fetch application manifest',
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({ sourceAppId, version })
      );
      throw error;
    }
  }

  /**
   * Get page configuration for the Application Manager
   */
  async getPageConfiguration(): Promise<ApiResponse<any>> {
    logger.info('Fetching Application Manager page configuration');

    try {
      const response = await apiService.get(`${this.baseEndpoint}/get_page_config`);
      
      logger.info('Page configuration fetched successfully');
      
      return response;

    } catch (error) {
      logger.error('Failed to fetch page configuration',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Get available filters
   */
  async getFilters(): Promise<ApiResponse<any>> {
    logger.info('Fetching Application Manager filters');

    try {
      const response = await apiService.get(`${this.baseEndpoint}/filters`);
      
      logger.info('Filters fetched successfully');
      
      return response;

    } catch (error) {
      logger.error('Failed to fetch filters',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}

// Export singleton instance
export const applicationManagerService = new ApplicationManagerService();
export default applicationManagerService;