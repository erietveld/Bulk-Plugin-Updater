// src/api/apiService.ts
// Type-safe API client with advanced error handling and comprehensive ServiceNow integration
// Following Architecture.md Section 6 specifications
// DEBUG: Added logging to getTableRecords method
// INSTALL UPDATES: Added installUpdates method for batch operations

import { logger, createLogContext } from '../monitoring/logger';
import type {
  ServiceNowRecord,
  ApiResponse,
  ApiListResponse,
  ApiRequestConfig,
  ApiError,
  PerformanceMetrics,
  RequestInterceptor
} from '../types/api';
import { createApiRequestConfig, createPerformanceMetrics, createRequestInterceptor } from '../types/api';

// Install Updates API types
interface InstallUpdatesRequest {
  apps: string; // Comma-separated sys_ids
}

interface InstallUpdatesResponse {
  success: boolean;
  progress_id: string;
  status_message: string;
  app_count: number;
  apps_requested: string;
  timestamp: string;
}

interface InstallUpdatesErrorResponse {
  success: false;
  error: string;
  message: string;
  timestamp: string;
}

interface InternalRequestConfig extends ApiRequestConfig {
  url: string;
}

class ServiceNowApiService {
  private baseUrl: string;
  private interceptors: RequestInterceptor[] = [];
  private performanceMetrics: PerformanceMetrics[] = [];
  private readonly slowRequestThreshold = 2000; // 2 seconds

  constructor() {
    // ServiceNow instance base URL - will be set dynamically
    this.baseUrl = this.getServiceNowBaseUrl();
    this.setupDefaultInterceptors();
  }

  private getServiceNowBaseUrl(): string {
    // Extract base URL from current window location for ServiceNow instance
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}`;
    }
    return '';
  }

  private setupDefaultInterceptors(): void {
    // Request interceptor for authentication and tracking
    this.addInterceptor(createRequestInterceptor('default-request', {
      enabled: true,
      order: 0,
      onRequest: (config) => {
        // Add ServiceNow session authentication
        const headers = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserToken': this.getSessionToken(),
          ...config.headers
        };

        // DEBUG: Enhanced logging for API requests
        logger.info(`🔍 API Request: ${config.method} ${config.url}`, createLogContext({
          method: config.method,
          url: config.url,
          headers: Object.keys(headers)
        }));

        console.log('🔍 API Request Details:', {
          method: config.method,
          url: config.url,
          params: config.params
        });

        return { ...config, headers };
      },
      onResponse: (response) => {
        logger.info('API Response received', createLogContext({
          hasResult: !!response.result,
          hasError: !!response.error
        }));
        return response;
      },
      onError: (error) => {
        // FIX: TypeScript error - logger.error expects (message, error, context)
        logger.error('API Request failed', 
          error instanceof Error ? error : new Error(String(error)), 
          createLogContext({
            url: error.request?.url || 'unknown',
            method: error.request?.method || 'unknown',
            status: error.status || 0,
            code: error.code || 'unknown'
          })
        );
        return error;
      }
    }));
  }

  private getSessionToken(): string {
    // ServiceNow session token from global context
    return (window as any).g_ck || '';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Build URL with query parameters from config.params
   */
  private buildUrlWithParams(baseUrl: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return baseUrl;
    }

    // Filter out undefined/null values and convert to strings
    const validParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        validParams[key] = String(value);
      }
    });

    if (Object.keys(validParams).length === 0) {
      return baseUrl;
    }

    const queryString = new URLSearchParams(validParams).toString();
    const separator = baseUrl.includes('?') ? '&' : '?';
    
    const finalUrl = `${baseUrl}${separator}${queryString}`;
    
    // DEBUG: Log URL construction
    console.log('🔍 URL Construction:', {
      baseUrl,
      params,
      validParams,
      queryString,
      finalUrl
    });
    
    return finalUrl;
  }

  private async performRequest<T = any>(
    url: string,
    config: Partial<ApiRequestConfig> = {}
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = performance.now();
    
    // Build full URL with base URL and query parameters
    let fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    fullUrl = this.buildUrlWithParams(fullUrl, config.params);
    
    // Create complete config with defaults
    const baseConfig = createApiRequestConfig(config);
    const requestConfig: InternalRequestConfig = {
      ...baseConfig,
      url: fullUrl
    };

    // Apply request interceptors
    let processedConfig = requestConfig;
    for (const interceptor of this.interceptors) {
      if (interceptor.enabled && interceptor.onRequest) {
        processedConfig = interceptor.onRequest(processedConfig) as InternalRequestConfig;
      }
    }

    let lastError: ApiError | null = null;
    let retryCount = 0;

    // Retry logic with exponential backoff
    while (retryCount <= requestConfig.retries) {
      try {
        const response = await this.executeRequest<T>(processedConfig);
        
        // Apply response interceptors
        let processedResponse = response;
        for (const interceptor of this.interceptors) {
          if (interceptor.enabled && interceptor.onResponse) {
            processedResponse = interceptor.onResponse(processedResponse);
          }
        }

        // Record performance metrics
        const endTime = performance.now();
        const duration = endTime - startTime;
        this.recordPerformanceMetric(createPerformanceMetrics(
          requestId,
          fullUrl,
          processedConfig.method,
          startTime,
          endTime,
          {
            success: true,
            retryCount,
            cacheHit: false,
            size: 0 // Could be calculated from response
          }
        ));

        // Check for slow requests
        if (duration > this.slowRequestThreshold) {
          logger.warn('Slow API request detected', createLogContext({
            requestId,
            url: fullUrl,
            method: processedConfig.method,
            duration: Math.round(duration),
            threshold: this.slowRequestThreshold
          }));
        }

        return processedResponse;

      } catch (error) {
        lastError = this.createApiError(error, processedConfig);
        
        // Apply error interceptors
        for (const interceptor of this.interceptors) {
          if (interceptor.enabled && interceptor.onError) {
            lastError = await Promise.resolve(interceptor.onError(lastError));
          }
        }

        if (retryCount < requestConfig.retries) {
          retryCount++;
          const delay = requestConfig.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
          
          logger.warn(`API request retry ${retryCount}/${requestConfig.retries}`, createLogContext({
            requestId,
            url: fullUrl,
            method: processedConfig.method,
            error: lastError.message,
            delay
          }));

          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          break;
        }
      }
    }

    // Record failed request metrics
    const endTime = performance.now();
    const duration = endTime - startTime;
    this.recordPerformanceMetric(createPerformanceMetrics(
      requestId,
      fullUrl,
      processedConfig.method,
      startTime,
      endTime,
      {
        success: false,
        retryCount,
        error: lastError?.message || 'Unknown error',
        cacheHit: false,
        size: 0
      }
    ));

    throw lastError;
  }

  private async executeRequest<T>(config: InternalRequestConfig): Promise<ApiResponse<T>> {
    const { url, method, data, headers, timeout } = config;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        method,
        signal: controller.signal,
      };

      // Only add headers if they exist
      if (headers) {
        fetchOptions.headers = headers;
      }

      if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      // ServiceNow API response format
      return {
        result: responseData.result || responseData,
        status: 'success'
      };

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private createApiError(error: any, config: InternalRequestConfig): ApiError {
    const apiError = new Error(error.message || 'API request failed') as ApiError;
    apiError.name = 'ApiError';
    apiError.code = error.code || 'UNKNOWN_ERROR';
    apiError.status = error.status || 0;
    apiError.timestamp = new Date().toISOString();

    // Create immutable copies for the readonly properties
    const requestCopy = {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers
    };

    if (error.response) {
      const responseCopy = {
        data: error.response.data,
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers || {}
      };
      // Assign to the error after creating immutable copy
      (apiError as any).response = responseCopy;
    }

    // Assign request after creating immutable copy
    (apiError as any).request = requestCopy;

    return apiError;
  }

  private recordPerformanceMetric(metric: PerformanceMetrics): void {
    this.performanceMetrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.performanceMetrics.length > 100) {
      this.performanceMetrics = this.performanceMetrics.slice(-100);
    }
  }

  // Public API methods

  public addInterceptor(interceptor: RequestInterceptor): void {
    this.interceptors.push(interceptor);
  }

  public removeInterceptor(id: string): void {
    this.interceptors = this.interceptors.filter(i => i.id !== id);
  }

  public async get<T = any>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.performRequest<T>(url, { ...config, method: 'GET' });
  }

  public async post<T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.performRequest<T>(url, { ...config, method: 'POST', data });
  }

  public async put<T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.performRequest<T>(url, { ...config, method: 'PUT', data });
  }

  public async patch<T = any>(url: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.performRequest<T>(url, { ...config, method: 'PATCH', data });
  }

  public async delete<T = any>(url: string, config?: Partial<ApiRequestConfig>): Promise<ApiResponse<T>> {
    return this.performRequest<T>(url, { ...config, method: 'DELETE' });
  }

  // ServiceNow-specific methods - ENHANCED WITH DEBUG LOGGING

  public async getTableRecords<T extends ServiceNowRecord = ServiceNowRecord>(
    table: string,
    query?: string,
    fields?: string[],
    limit?: number,
    offset?: number
  ): Promise<ApiListResponse<T>> {
    // DEBUG: Log exactly what parameters we received
    console.log('🔍 getTableRecords called with:', {
      table,
      query,
      fields,
      fieldsLength: fields?.length,
      limit,
      offset
    });

    const params: Record<string, string | number> = {};
    
    if (query) params.sysparm_query = query;
    if (fields?.length) {
      params.sysparm_fields = fields.join(',');
      
      // DEBUG: Log the fields processing
      console.log('🔍 Fields processing:', {
        originalFields: fields,
        joinedFields: fields.join(','),
        hasDotWalkFields: fields.some(f => f.includes('.')),
        dotWalkFields: fields.filter(f => f.includes('.'))
      });
    }
    if (limit) params.sysparm_limit = limit;
    if (offset) params.sysparm_offset = offset;

    // DEBUG: Log final params object
    console.log('🔍 Final params object:', params);

    // Now use the generic params handling instead of manual URL building
    const response = await this.get<T[]>(`/api/now/table/${table}`, { params });
    
    return {
      result: response.result || [],
      total: 0,
      count: (response.result || []).length,
      offset: offset || 0,
      limit: limit || 100
    };
  }

  public async getRecord<T extends ServiceNowRecord = ServiceNowRecord>(
    table: string,
    sysId: string,
    fields?: string[]
  ): Promise<ApiResponse<T>> {
    const params: Record<string, string> = {};
    if (fields?.length) params.sysparm_fields = fields.join(',');

    return this.get<T>(`/api/now/table/${table}/${sysId}`, { params });
  }

  public async createRecord<T extends ServiceNowRecord = ServiceNowRecord>(
    table: string,
    data: Partial<T>
  ): Promise<ApiResponse<T>> {
    const url = `/api/now/table/${table}`;
    return this.post<T>(url, data);
  }

  public async updateRecord<T extends ServiceNowRecord = ServiceNowRecord>(
    table: string,
    sysId: string,
    data: Partial<T>
  ): Promise<ApiResponse<T>> {
    const url = `/api/now/table/${table}/${sysId}`;
    return this.patch<T>(url, data);
  }

  public async deleteRecord(table: string, sysId: string): Promise<ApiResponse<void>> {
    const url = `/api/now/table/${table}/${sysId}`;
    return this.delete(url);
  }

  // INSTALL UPDATES: ServiceNow Store Updates specific method
  public async installUpdates(apps: string[]): Promise<InstallUpdatesResponse> {
    const startTime = performance.now();
    
    logger.info('Installing updates via service layer', createLogContext({
      appCount: apps.length,
      apps: apps.join(',')
    }));

    try {
      const requestData: InstallUpdatesRequest = {
        apps: apps.join(',')
      };

      const response = await this.post<InstallUpdatesResponse | InstallUpdatesErrorResponse>(
        `/api/x_snc_store_upda_1/install_updates`,
        requestData
      );

      const result = response.result;
      
      if (!result.success) {
        const errorResult = result as InstallUpdatesErrorResponse;
        throw new Error(`Install Updates API error: ${errorResult.error} - ${errorResult.message}`);
      }

      const successResult = result as InstallUpdatesResponse;
      const duration = performance.now() - startTime;

      logger.info('Install updates completed successfully', createLogContext({
        progressId: successResult.progress_id,
        appCount: successResult.app_count,
        statusMessage: successResult.status_message,
        duration: Math.round(duration)
      }));

      return successResult;

    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.error('Install updates failed', 
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({
          appCount: apps.length,
          apps: apps.join(','),
          duration: Math.round(duration)
        })
      );

      throw error;
    }
  }

  // Parallel processing utilities

  public async parallel<T>(requests: Promise<ApiResponse<T>>[]): Promise<ApiResponse<T>[]> {
    const startTime = performance.now();
    
    try {
      const results = await Promise.all(requests);
      const duration = performance.now() - startTime;
      
      logger.info(`Parallel API requests completed`, createLogContext({
        requestCount: requests.length,
        duration: Math.round(duration),
        successCount: results.filter(r => !r.error).length,
        errorCount: results.filter(r => !!r.error).length
      }));
      
      return results;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      logger.error('Parallel API requests failed', 
        error instanceof Error ? error : new Error(String(error)),
        createLogContext({
          requestCount: requests.length,
          duration: Math.round(duration)
        })
      );
      
      throw error;
    }
  }

  // Performance monitoring

  public getPerformanceMetrics(): PerformanceMetrics[] {
    return [...this.performanceMetrics];
  }

  public getSlowRequests(threshold: number = this.slowRequestThreshold): PerformanceMetrics[] {
    return this.performanceMetrics.filter(metric => metric.duration > threshold);
  }

  public clearPerformanceMetrics(): void {
    this.performanceMetrics = [];
  }
}

// Export singleton instance
export const apiService = new ServiceNowApiService();
export default apiService;