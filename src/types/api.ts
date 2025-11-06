// src/types/api.ts
// TypeScript definitions for ServiceNow API integration

export interface ServiceNowRecord {
  sys_id: string;
  sys_created_on: string;
  sys_created_by: string;
  sys_updated_on: string;
  sys_updated_by: string;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  result: T;
  status?: string;
  error?: {
    message: string;
    detail?: string;
    code?: string;
  };
}

export interface ApiListResponse<T = ServiceNowRecord> {
  result: T[];
  total?: number;
  count?: number;
  offset?: number;
  limit?: number;
}

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  params?: Record<string, string | number | boolean>;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ApiError extends Error {
  code?: string;
  status?: number;
  response?: {
    data?: any;
    status: number;
    statusText: string;
  };
  request?: {
    url: string;
    method: string;
    data?: any;
  };
}

export interface PerformanceMetrics {
  requestId: string;
  url: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  retryCount: number;
  error?: string;
}

export interface RequestInterceptor {
  id: string;
  onRequest?: (config: ApiRequestConfig & { url: string }) => ApiRequestConfig & { url: string };
  onResponse?: <T>(response: ApiResponse<T>) => ApiResponse<T>;
  onError?: (error: ApiError) => Promise<ApiError> | ApiError;
}