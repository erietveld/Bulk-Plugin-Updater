// src/types/api.ts  
// COMPLIANCE: Step 3 - Fixed TypeScript definitions with refined types and nullish coalescing
// Enhanced type definitions for ServiceNow API integration with better type safety

import { getString, getNumber, getBoolean, getSysId, getServiceNowDateTime, type NonUndefined } from '../utils/typeRefinements';

// Base ServiceNow record with refined types - no undefined in required fields
export interface ServiceNowRecord {
  readonly sys_id: string; // Required, never undefined
  readonly sys_created_on: string; // Required, never undefined  
  readonly sys_created_by: string; // Required, never undefined
  readonly sys_updated_on: string; // Required, never undefined
  readonly sys_updated_by: string; // Required, never undefined
  readonly [key: string]: unknown; // Allow additional properties
}

// Separate error details interface for better type safety
export interface ApiErrorDetails {
  readonly message: string; // Required when error exists
  readonly detail: string; // Default to empty string
  readonly code: string; // Default to 'UNKNOWN'
}

// API Response with refined types and defaults
export interface ApiResponse<T = unknown> {
  readonly result: T;
  readonly status: string; // Default to 'success', never undefined
  readonly error?: ApiErrorDetails; // Optional but typed when present
}

// List response with refined types and pagination
export interface ApiListResponse<T = ServiceNowRecord> {
  readonly result: readonly T[]; // Readonly array, never undefined
  readonly total: number; // Default to 0
  readonly count: number; // Default to 0  
  readonly offset: number; // Default to 0
  readonly limit: number; // Default to 100
}

// Request configuration with refined types and defaults
export interface ApiRequestConfig {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; // Default to 'GET'
  readonly params: Record<string, string | number | boolean>; // Default to empty object
  readonly data?: unknown; // Optional request body
  readonly headers: Record<string, string>; // Default to empty object
  readonly timeout: number; // Default to 5000ms
  readonly retries: number; // Default to 3
  readonly retryDelay: number; // Default to 1000ms
}

export interface ApiErrorResponse {
  readonly data?: unknown;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Record<string, string>;
}

export interface ApiErrorRequest {
  readonly url: string;
  readonly method: string;
  readonly data?: unknown;
  readonly headers: Record<string, string>;
}

// Enhanced API error with refined types - using mutable interface for assignment
export interface ApiError extends Error {
  name: 'ApiError'; // Always 'ApiError', but mutable for assignment
  message: string; // Required error message, mutable
  code: string; // Default to 'UNKNOWN', mutable for assignment
  status: number; // Default to 0, mutable for assignment
  readonly response?: ApiErrorResponse;
  readonly request?: ApiErrorRequest;
  timestamp: string; // ISO timestamp, mutable for assignment
}

// Performance metrics with refined types
export interface PerformanceMetrics {
  readonly requestId: string; // Required unique identifier
  readonly url: string; // Required request URL
  readonly method: string; // Required HTTP method
  readonly startTime: number; // Required start timestamp
  readonly endTime: number; // Required end timestamp  
  readonly duration: number; // Calculated duration, never negative
  readonly success: boolean; // Required success flag
  readonly retryCount: number; // Default to 0
  readonly error: string; // Default to empty string
  readonly cacheHit: boolean; // Default to false
  readonly size: number; // Response size in bytes, default to 0
}

// Request interceptor with refined types
export interface RequestInterceptor {
  readonly id: string; // Required unique identifier
  readonly enabled: boolean; // Default to true
  readonly order: number; // Default to 0 for ordering
  readonly onRequest?: (config: ApiRequestConfig & { url: string }) => ApiRequestConfig & { url: string };
  readonly onResponse?: <T>(response: ApiResponse<T>) => ApiResponse<T>;
  readonly onError?: (error: ApiError) => Promise<ApiError> | ApiError;
}

// Factory functions using nullish coalescing for type safety
export const createServiceNowRecord = (
  data: Partial<ServiceNowRecord> | null | undefined
): ServiceNowRecord => {
  return {
    sys_id: getSysId(data?.sys_id) || '', // Use utility function with default
    sys_created_on: getServiceNowDateTime(data?.sys_created_on) || new Date().toISOString(),
    sys_created_by: getString(data?.sys_created_by, 'system'),
    sys_updated_on: getServiceNowDateTime(data?.sys_updated_on) || new Date().toISOString(),
    sys_updated_by: getString(data?.sys_updated_by, 'system'),
    ...data // Spread remaining properties
  };
};

export const createApiResponse = <T>(
  result: T,
  status: string | null | undefined = null,
  error: Partial<ApiErrorDetails> | null | undefined = null
): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    result,
    status: getString(status, 'success')
  };
  
  // Only add error property if error exists to satisfy exactOptionalPropertyTypes
  if (error) {
    (response as any).error = createApiErrorDetails(error);
  }
  
  return response;
};

export const createApiErrorDetails = (
  error: Partial<ApiErrorDetails> | null | undefined
): ApiErrorDetails => {
  return {
    message: getString(error?.message, 'An error occurred'),
    detail: getString(error?.detail, ''),
    code: getString(error?.code, 'UNKNOWN')
  };
};

export const createApiListResponse = <T>(
  result: T[] | null | undefined,
  pagination: {
    total?: number | null | undefined;
    count?: number | null | undefined;
    offset?: number | null | undefined;
    limit?: number | null | undefined;
  } | null | undefined = null
): ApiListResponse<T> => {
  const resultArray = Array.isArray(result) ? result : [];
  
  return {
    result: resultArray,
    total: getNumber(pagination?.total, resultArray.length),
    count: getNumber(pagination?.count, resultArray.length),
    offset: getNumber(pagination?.offset, 0),
    limit: getNumber(pagination?.limit, 100)
  };
};

export const createApiRequestConfig = (
  config: Partial<ApiRequestConfig> | null | undefined = null
): ApiRequestConfig => {
  return {
    method: config?.method ?? 'GET',
    params: config?.params ?? {},
    data: config?.data,
    headers: config?.headers ?? {},
    timeout: getNumber(config?.timeout, 5000),
    retries: getNumber(config?.retries, 3),
    retryDelay: getNumber(config?.retryDelay, 1000)
  };
};

export const createApiError = (
  message: string | null | undefined,
  options: {
    code?: string | null | undefined;
    status?: number | null | undefined;
    response?: Partial<ApiErrorResponse> | null | undefined;
    request?: Partial<ApiErrorRequest> | null | undefined;
  } | null | undefined = null
): ApiError => {
  const error = new Error(getString(message, 'Unknown API error')) as ApiError;
  
  // These assignments are now allowed because the interface uses mutable properties
  error.name = 'ApiError';
  error.code = getString(options?.code, 'UNKNOWN');
  error.status = getNumber(options?.status, 0);
  error.timestamp = new Date().toISOString();
  
  if (options?.response) {
    (error as any).response = {
      data: options.response.data,
      status: getNumber(options.response.status, 0),
      statusText: getString(options.response.statusText, 'Unknown'),
      headers: options.response.headers ?? {}
    };
  }
  
  if (options?.request) {
    (error as any).request = {
      url: getString(options.request.url, ''),
      method: getString(options.request.method, 'GET'),
      data: options.request.data,
      headers: options.request.headers ?? {}
    };
  }
  
  return error;
};

export const createPerformanceMetrics = (
  requestId: string,
  url: string,
  method: string,
  startTime: number,
  endTime: number | null | undefined = null,
  options: {
    success?: boolean | null | undefined;
    retryCount?: number | null | undefined;
    error?: string | null | undefined;
    cacheHit?: boolean | null | undefined;
    size?: number | null | undefined;
  } | null | undefined = null
): PerformanceMetrics => {
  const resolvedEndTime = endTime ?? performance.now();
  const duration = Math.max(0, resolvedEndTime - startTime); // Ensure non-negative
  
  return {
    requestId: getString(requestId, crypto.randomUUID?.() ?? `req_${Date.now()}`),
    url: getString(url, ''),
    method: getString(method, 'GET').toUpperCase(),
    startTime,
    endTime: resolvedEndTime,
    duration,
    success: getBoolean(options?.success, true),
    retryCount: getNumber(options?.retryCount, 0),
    error: getString(options?.error, ''),
    cacheHit: getBoolean(options?.cacheHit, false),
    size: getNumber(options?.size, 0)
  };
};

export const createRequestInterceptor = (
  id: string,
  options: {
    enabled?: boolean | null | undefined;
    order?: number | null | undefined;
    onRequest?: RequestInterceptor['onRequest'];
    onResponse?: RequestInterceptor['onResponse'];
    onError?: RequestInterceptor['onError'];
  } | null | undefined = null
): RequestInterceptor => {
  const interceptor: RequestInterceptor = {
    id: getString(id, crypto.randomUUID?.() ?? `interceptor_${Date.now()}`),
    enabled: getBoolean(options?.enabled, true),
    order: getNumber(options?.order, 0)
  };
  
  // Only add optional properties if they exist to satisfy exactOptionalPropertyTypes
  if (options?.onRequest) {
    (interceptor as any).onRequest = options.onRequest;
  }
  if (options?.onResponse) {
    (interceptor as any).onResponse = options.onResponse;
  }
  if (options?.onError) {
    (interceptor as any).onError = options.onError;
  }
  
  return interceptor;
};

// Type guards for runtime type checking
export const isServiceNowRecord = (value: unknown): value is ServiceNowRecord => {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).sys_id === 'string' &&
    typeof (value as any).sys_created_on === 'string' &&
    typeof (value as any).sys_created_by === 'string' &&
    typeof (value as any).sys_updated_on === 'string' &&
    typeof (value as any).sys_updated_by === 'string'
  );
};

export const isApiResponse = <T>(value: unknown): value is ApiResponse<T> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'result' in value &&
    typeof (value as any).status === 'string'
  );
};

export const isApiError = (value: unknown): value is ApiError => {
  return (
    value instanceof Error &&
    (value as any).name === 'ApiError' &&
    typeof (value as any).code === 'string' &&
    typeof (value as any).status === 'number' &&
    typeof (value as any).timestamp === 'string'
  );
};

// Utility type for making API responses type-safe
export type SafeApiResponse<T> = NonUndefined<ApiResponse<NonUndefined<T>>>;
export type SafeApiListResponse<T> = NonUndefined<ApiListResponse<NonUndefined<T>>>;

// Re-export refined types for convenience
export type {
  NonUndefined
} from '../utils/typeRefinements';