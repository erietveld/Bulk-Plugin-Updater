# API and Integration Layer

## **API and Integration Layer (Enhanced)**

Type-safe API client with advanced error handling and ServiceNow integration.

### **ServiceNow API Client**

```typescript
// Type-safe API client with advanced error handling
export const apiClient = {
  // Base configuration
  baseURL: '/api/now',
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
    'X-UserToken': window.g_ck // CSRF protection
  },

  // Enhanced fetch wrapper with comprehensive error handling
  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ServiceNowResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = performance.now();
    
    try {
      logger.debug('API request started', { 
        method: options.method || 'GET',
        url,
        headers: options.headers
      });

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers
        }
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Log performance metrics
      logger.info('API request completed', {
        method: options.method || 'GET',
        url,
        status: response.status,
        duration,
        ok: response.ok
      });

      // Alert on slow requests
      if (duration > 3000) {
        logger.warn('Slow API request detected', { url, duration });
      }

      if (!response.ok) {
        const errorText = await response.text();
        const error = new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorText,
          url
        );
        
        logger.error('API request failed', error, {
          method: options.method || 'GET',
          url,
          status: response.status,
          duration
        });
        
        throw error;
      }

      const data = await response.json();
      
      // Validate ServiceNow response structure
      if (!data || typeof data !== 'object') {
        throw new APIError('Invalid response format', 500, 'Response is not valid JSON', url);
      }

      return data;
    } catch (error) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      if (error instanceof APIError) {
        throw error;
      }
      
      // Handle network errors
      const networkError = new APIError(
        'Network request failed',
        0,
        error instanceof Error ? error.message : 'Unknown network error',
        url
      );
      
      logger.error('Network error occurred', networkError, {
        method: options.method || 'GET',
        url,
        duration,
        originalError: error
      });
      
      throw networkError;
    }
  },

  // GET request helper
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ServiceNowResponse<T>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<T>(`${endpoint}${queryString}`);
  },

  // POST request helper
  async post<T>(endpoint: string, data?: any): Promise<ServiceNowResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  // PUT request helper
  async put<T>(endpoint: string, data?: any): Promise<ServiceNowResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  // PATCH request helper
  async patch<T>(endpoint: string, data?: any): Promise<ServiceNowResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  },

  // DELETE request helper
  async delete<T>(endpoint: string): Promise<ServiceNowResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE'
    });
  }
};

// Custom API Error class
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public responseText: string,
    public url: string
  ) {
    super(message);
    this.name = 'APIError';
  }

  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }
}
```

### **Request Service**

```typescript
// Service for handling parking request operations
export const requestService = {
  // Get all requests with filtering
  async getRequests(query?: string): Promise<Request[]> {
    try {
      const params: Record<string, string> = {
        sysparm_display_value: 'all',
        sysparm_exclude_reference_link: 'true',
        sysparm_limit: '1000'
      };

      if (query) {
        params.sysparm_query = query;
      }

      logger.info('Fetching requests', { query, params });

      const response = await apiClient.get<Request[]>('/table/x_snc_visitor_pa_1_visitor_parking_request', params);
      
      if (!response.result || !Array.isArray(response.result)) {
        throw new Error('Invalid response format: expected array of requests');
      }

      logger.info('Requests fetched successfully', { 
        count: response.result.length,
        query 
      });

      return response.result;
    } catch (error) {
      logger.error('Failed to fetch requests', error, { query });
      throw error;
    }
  },

  // Get requests with pagination
  async getRequestsPaginated(options: {
    query?: string;
    offset?: number;
    limit?: number;
    orderBy?: string;
  }): Promise<Request[]> {
    const { query, offset = 0, limit = 25, orderBy = 'sys_created_on' } = options;
    
    try {
      const params: Record<string, string> = {
        sysparm_display_value: 'all',
        sysparm_exclude_reference_link: 'true',
        sysparm_offset: offset.toString(),
        sysparm_limit: limit.toString(),
        sysparm_orderby: `DESC${orderBy}`
      };

      if (query) {
        params.sysparm_query = query;
      }

      logger.info('Fetching paginated requests', { query, offset, limit, orderBy });

      const response = await apiClient.get<Request[]>('/table/x_snc_visitor_pa_1_visitor_parking_request', params);
      
      if (!response.result || !Array.isArray(response.result)) {
        throw new Error('Invalid response format: expected array of requests');
      }

      return response.result;
    } catch (error) {
      logger.error('Failed to fetch paginated requests', error, options);
      throw error;
    }
  },

  // Get single request by ID
  async getRequest(requestId: string): Promise<Request> {
    try {
      logger.info('Fetching request details', { requestId });

      const response = await apiClient.get<Request[]>(`/table/x_snc_visitor_pa_1_visitor_parking_request/${requestId}`, {
        sysparm_display_value: 'all',
        sysparm_exclude_reference_link: 'true'
      });

      if (!response.result || !Array.isArray(response.result) || response.result.length === 0) {
        throw new APIError('Request not found', 404, 'Request does not exist', `/table/x_snc_visitor_pa_1_visitor_parking_request/${requestId}`);
      }

      logger.info('Request details fetched successfully', { requestId });

      return response.result[0];
    } catch (error) {
      logger.error('Failed to fetch request details', error, { requestId });
      throw error;
    }
  },

  // Create new request
  async createRequest(requestData: Partial<Request>): Promise<Request> {
    try {
      // Validate required fields
      if (!requestData.title || !requestData.description) {
        throw new APIError('Missing required fields', 400, 'Title and description are required', '/table/x_snc_visitor_pa_1_visitor_parking_request');
      }

      logger.info('Creating new request', { 
        title: requestData.title,
        hasDescription: !!requestData.description
      });

      const response = await apiClient.post<Request[]>('/table/x_snc_visitor_pa_1_visitor_parking_request', requestData);

      if (!response.result || !Array.isArray(response.result) || response.result.length === 0) {
        throw new Error('Invalid response format: expected created request');
      }

      const createdRequest = response.result[0];
      
      logger.info('Request created successfully', { 
        requestId: createdRequest.sys_id,
        title: createdRequest.title 
      });

      return createdRequest;
    } catch (error) {
      logger.error('Failed to create request', error, { requestData });
      throw error;
    }
  },

  // Update existing request
  async updateRequest(requestId: string, updates: Partial<Request>): Promise<Request> {
    try {
      logger.info('Updating request', { 
        requestId, 
        updateFields: Object.keys(updates) 
      });

      const response = await apiClient.patch<Request[]>(`/table/x_snc_visitor_pa_1_visitor_parking_request/${requestId}`, updates);

      if (!response.result || !Array.isArray(response.result) || response.result.length === 0) {
        throw new Error('Invalid response format: expected updated request');
      }

      const updatedRequest = response.result[0];
      
      logger.info('Request updated successfully', { 
        requestId,
        updatedFields: Object.keys(updates)
      });

      return updatedRequest;
    } catch (error) {
      logger.error('Failed to update request', error, { requestId, updates });
      throw error;
    }
  },

  // Delete request
  async deleteRequest(requestId: string): Promise<void> {
    try {
      logger.info('Deleting request', { requestId });

      await apiClient.delete(`/table/x_snc_visitor_pa_1_visitor_parking_request/${requestId}`);
      
      logger.info('Request deleted successfully', { requestId });
    } catch (error) {
      logger.error('Failed to delete request', error, { requestId });
      throw error;
    }
  },

  // Get recent requests (last 7 days)
  async getRecentRequests(limit: number = 10): Promise<Request[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateQuery = `sys_created_on>=${sevenDaysAgo.toISOString().split('T')[0]}`;
    
    return this.getRequestsPaginated({
      query: dateQuery,
      limit,
      orderBy: 'sys_created_on'
    });
  }
};
```

### **Statistics Service**

```typescript
// Service for dashboard statistics
export const statisticsService = {
  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      logger.info('Fetching dashboard statistics');

      // Fetch multiple statistics in parallel
      const [requestStats, locationStats] = await Promise.all([
        this.getRequestStatistics(),
        this.getLocationStatistics()
      ]);

      const stats: DashboardStats = {
        totalRequests: requestStats.total,
        pendingRequests: requestStats.pending,
        approvedRequests: requestStats.approved,
        rejectedRequests: requestStats.rejected,
        availableItems: locationStats.available,
        totalItems: locationStats.total,
        occupancyRate: locationStats.total > 0 ? 
          ((locationStats.total - locationStats.available) / locationStats.total) * 100 : 0,
        approvalRate: requestStats.total > 0 ? 
          (requestStats.approved / requestStats.total) * 100 : 0,
        lastUpdated: new Date().toISOString()
      };

      logger.info('Dashboard statistics calculated', stats);

      return stats;
    } catch (error) {
      logger.error('Failed to fetch dashboard statistics', error);
      throw error;
    }
  },

  // Get request statistics
  async getRequestStatistics(): Promise<RequestStats> {
    try {
      const response = await apiClient.get<Request[]>('/table/x_snc_visitor_pa_1_visitor_parking_request', {
        sysparm_fields: 'status',
        sysparm_display_value: 'false',
        sysparm_limit: '10000'
      });

      if (!response.result || !Array.isArray(response.result)) {
        throw new Error('Invalid response format');
      }

      const stats = response.result.reduce((acc, request) => {
        acc.total++;
        const status = request.status?.value || request.status;
        switch (status) {
          case 'pending':
            acc.pending++;
            break;
          case 'approved':
            acc.approved++;
            break;
          case 'rejected':
            acc.rejected++;
            break;
        }
        return acc;
      }, { total: 0, pending: 0, approved: 0, rejected: 0 });

      logger.debug('Request statistics calculated', stats);

      return stats;
    } catch (error) {
      logger.error('Failed to get request statistics', error);
      throw error;
    }
  },

  // Get location statistics
  async getLocationStatistics(): Promise<LocationStats> {
    try {
      const response = await apiClient.get<ParkingLocation[]>('/table/x_snc_visitor_pa_1_parking_location', {
        sysparm_fields: 'status',
        sysparm_display_value: 'false',
        sysparm_limit: '10000'
      });

      if (!response.result || !Array.isArray(response.result)) {
        throw new Error('Invalid response format');
      }

      const stats = response.result.reduce((acc, location) => {
        acc.total++;
        const status = location.status?.value || location.status;
        if (status === 'available') {
          acc.available++;
        }
        return acc;
      }, { total: 0, available: 0 });

      logger.debug('Location statistics calculated', stats);

      return stats;
    } catch (error) {
      logger.error('Failed to get location statistics', error);
      throw error;
    }
  }
};
```

### **Notification Service**

```typescript
// Service for user notifications
export const notificationService = {
  // Get user notifications
  async getUserNotifications(): Promise<UserNotification[]> {
    try {
      const userContext = window.snUserContext;
      if (!userContext) {
        logger.warn('User context not available for notifications');
        return [];
      }

      logger.info('Fetching user notifications', { userId: userContext.userId });

      // In a real implementation, this would fetch from a notifications table
      // For now, we'll simulate based on recent requests
      const recentRequests = await requestService.getRecentRequests(5);
      
      const notifications: UserNotification[] = recentRequests.map(request => ({
        id: `notif-${request.sys_id}`,
        title: 'Request Update',
        message: `Your request "${request.title}" status is ${request.status}`,
        type: request.status === 'approved' ? 'success' : 
              request.status === 'rejected' ? 'error' : 'info',
        timestamp: request.sys_updated_on || request.sys_created_on,
        read: false,
        actionUrl: `/request/${request.sys_id}`
      }));

      logger.info('User notifications fetched', { count: notifications.length });

      return notifications;
    } catch (error) {
      logger.error('Failed to fetch user notifications', error);
      return []; // Return empty array on error to prevent UI breaking
    }
  },

  // Mark notification as read
  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      logger.info('Marking notification as read', { notificationId });
      
      // In a real implementation, this would update the notification record
      // For now, we'll just log the action
      
      logger.info('Notification marked as read', { notificationId });
    } catch (error) {
      logger.error('Failed to mark notification as read', error, { notificationId });
      throw error;
    }
  }
};
```

### **Error Handler Integration**

```typescript
// Global error handler for API responses
export const handleAPIError = (error: unknown, context: string = 'API call') => {
  if (error instanceof APIError) {
    // Handle different types of API errors
    if (error.isAuthError) {
      logger.error('Authentication error', error, { context });
      showErrorNotification('Session expired. Please log in again.');
      // Optionally redirect to login
      window.location.href = '/login.do';
      return;
    }
    
    if (error.isServerError) {
      logger.error('Server error', error, { context });
      showErrorNotification('Server error occurred. Please try again later.');
      return;
    }
    
    if (error.isClientError) {
      logger.error('Client error', error, { context });
      showErrorNotification(error.message || 'Request failed. Please check your input.');
      return;
    }
    
    if (error.isNetworkError) {
      logger.error('Network error', error, { context });
      showErrorNotification('Network error. Please check your connection.');
      return;
    }
  }
  
  // Handle generic errors
  logger.error('Unexpected error', error, { context });
  showErrorNotification('An unexpected error occurred. Please try again.');
};

// Retry utility for failed requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug('Attempting request', { attempt, maxRetries });
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      logger.warn('Request attempt failed', error, { attempt, maxRetries });
      
      // Don't retry on certain errors
      if (error instanceof APIError && (error.isAuthError || error.isClientError)) {
        throw error;
      }
      
      // Don't wait after the last attempt
      if (attempt < maxRetries) {
        const waitTime = delay * Math.pow(2, attempt - 1); // Exponential backoff
        logger.debug('Waiting before retry', { waitTime, attempt });
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  logger.error('All retry attempts failed', lastError, { maxRetries });
  throw lastError;
};
```

### **Request Interceptors**

```typescript
// Request interceptor for adding authentication and logging
export const setupRequestInterceptors = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    const method = init?.method || 'GET';
    
    // Add authentication headers if needed
    const headers = new Headers(init?.headers);
    
    // Add session token if available
    const userContext = window.snUserContext;
    if (userContext?.sessionId) {
      headers.set('X-UserToken', userContext.sessionId);
    }
    
    // Add request ID for tracking
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    headers.set('X-Request-ID', requestId);
    
    logger.debug('Request intercepted', {
      requestId,
      method,
      url,
      headers: Object.fromEntries(headers.entries())
    });
    
    const startTime = performance.now();
    
    try {
      const response = await originalFetch(input, {
        ...init,
        headers
      });
      
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      logger.debug('Request completed', {
        requestId,
        method,
        url,
        status: response.status,
        duration
      });
      
      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      
      logger.error('Request failed', error, {
        requestId,
        method,
        url,
        duration
      });
      
      throw error;
    }
  };
  
  logger.info('Request interceptors setup complete');
};
```

### **Type Definitions**

```typescript
// ServiceNow response wrapper
export interface ServiceNowResponse<T> {
  result: T;
}

// Request interface
export interface Request {
  sys_id: string | { value: string };
  title: string | { value: string };
  description: string | { value: string };
  status: string | { value: string };
  priority: string | { value: string };
  category: string | { value: string };
  sys_created_on: string;
  sys_updated_on: string;
  sys_created_by: string | { value: string; display_value: string };
}

// Dashboard statistics
export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  availableItems: number;
  totalItems: number;
  occupancyRate: number;
  approvalRate: number;
  lastUpdated: string;
}

// Request statistics
export interface RequestStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// Location statistics
export interface LocationStats {
  total: number;
  available: number;
}

// User notification
export interface UserNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Parking location
export interface ParkingLocation {
  sys_id: string | { value: string };
  name: string | { value: string };
  status: string | { value: string };
  location: string | { value: string };
}
```

### **Benefits of Enhanced API Integration**

✅ **Type Safety** - Full TypeScript support with proper error handling
✅ **Performance Monitoring** - Request duration tracking and slow request detection
✅ **Error Resilience** - Comprehensive error handling with retry logic
✅ **ServiceNow Integration** - Optimized for ServiceNow REST API patterns
✅ **Request Interceptors** - Automatic authentication and request tracking
✅ **Parallel Processing** - Efficient data fetching with Promise.all
✅ **Caching Support** - Works seamlessly with TanStack Query caching
✅ **Development Experience** - Detailed logging and debugging capabilities

[← Back to Main Advice](../Advice.md)