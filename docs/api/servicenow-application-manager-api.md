---
title: "ServiceNow Application Manager Internal API Reference"
version: "2025.1.9"
introduced: "2025.1.7"
updated: "2025.1.9"
purpose: "Complete reference for ServiceNow's internal Application Manager REST API endpoints"
readTime: "8 minutes"
complexity: "intermediate"
criticality: "MANDATORY"
prerequisites: ["core-principles", "service-layer-integration"]
audience: ["developers", "architects"]
tags: ["servicenow", "api", "application-manager", "rest", "internal-api"]
concepts: ["application-management", "plugin-management", "batch-operations", "progress-tracking", "store-integration"]
codeExamples: 18
completeness: 100
testability: true
productionReady: true
validationStatus: "REVERSE_ENGINEERED_AND_TESTED"
changelog: "Updated Sync Applications with correct response structure and indeterminate progress patterns"
---

# ServiceNow Application Manager Internal API Reference

**Purpose:** Complete reference for ServiceNow's internal Application Manager REST API endpoints  
**Read time:** ~8 minutes  
**Prerequisites:** [Core Principles](../architecture/core-principles.md) • [Service Layer Integration](../architecture/patterns/service-layer-integration.md)

> **⚠️ INTERNAL API WARNING:** This is ServiceNow's internal Application Manager API. Usage requires proper authentication and may change without notice. Use for reference and integration purposes only.

---

## 🚀 API Overview

The ServiceNow Application Manager Internal API (`/api/sn_appclient/appmanager/*`) provides comprehensive application lifecycle management capabilities including installation, updates, dependency resolution, and progress tracking.

### **Base URL**
```
https://[instance].service-now.com/api/sn_appclient/appmanager/
```

### **Authentication**
- Uses ServiceNow session authentication
- Requires appropriate roles for application management
- Include `X-UserToken` header for CSRF protection

### **Response Formats**
- Primary: `application/json`
- Also supports: `application/xml`, `text/xml`

---

## 📱 Application Management Endpoints

### **App Installation**
Install applications from the ServiceNow Store or platform.

```http
GET /api/sn_appclient/appmanager/app/install
```

**Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `app_id` | string | ✅ | Source app ID of the application | `com.snc.work_management` |
| `version` | string | ✅ | Version of the app to install | `1.0.0` |
| `customization_version` | string | ❌ | Customization version | `1.0.0` |
| `load_demo_data` | boolean | ❌ | Flag to load demo data | `true\|false` |

**Example Usage:**
```typescript
const installApp = async (appId: string, version: string) => {
  const response = await apiService.get('/api/sn_appclient/appmanager/app/install', {
    params: {
      app_id: appId,
      version: version,
      load_demo_data: 'false'
    }
  });
  return response.result;
};
```

### **App Update**
Update existing applications to newer versions.

```http
GET /api/sn_appclient/appmanager/app/update
```

**Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `app_id` | string | ✅ | Source app ID | `com.snc.work_management` |
| `version` | string | ✅ | Target version | `2.0.0` |
| `customization_version` | string | ❌ | Customization version | `1.0.0` |
| `load_demo_data` | boolean | ❌ | Load demo data flag | `false` |

### **App Repair**
Repair corrupted or partially installed applications.

```http
GET /api/sn_appclient/appmanager/app/repair
```

**Parameters:** Same as app/update endpoint

**Example Implementation:**
```typescript
class AppManagerService {
  async repairApp(appId: string, version: string, options = {}) {
    const params = {
      app_id: appId,
      version: version,
      ...options
    };
    
    return await apiService.get('/api/sn_appclient/appmanager/app/repair', { params });
  }
}
```

---

## 📊 Application Discovery Endpoints

### **List Applications**
Retrieve applications based on context (available, installed, updates).

```http
POST /api/sn_appclient/appmanager/apps
```

**Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `tab_context` | string | ✅ | Context filter | `available_for_you\|installed\|updates` |
| `search_key` | string | ❌ | Search criteria | `work management` |
| `sysparm_limit` | number | ❌ | Max results (default: 10,000) | `50` |
| `sysparm_offset` | number | ❌ | Records to skip | `0` |

**Example Usage:**
```typescript
const getAvailableApps = async (searchTerm?: string, limit = 50) => {
  const response = await apiService.post('/api/sn_appclient/appmanager/apps', {}, {
    params: {
      tab_context: 'available_for_you',
      search_key: searchTerm || '',
      sysparm_limit: limit,
      sysparm_offset: 0
    }
  });
  return response.result;
};

const getInstalledApps = async () => {
  return await apiService.post('/api/sn_appclient/appmanager/apps', {}, {
    params: { tab_context: 'installed' }
  });
};

const getAppUpdates = async () => {
  return await apiService.post('/api/sn_appclient/appmanager/apps', {}, {
    params: { tab_context: 'updates' }
  });
};
```

### **Get Application Details**
Retrieve detailed information for a specific application.

```http
GET /api/sn_appclient/appmanager/app/{appID}
```

### **Get Store Application Info**
Get application information from the ServiceNow Store.

```http
GET /api/sn_appclient/appmanager/app_info_from_store/{sourceAppId}/{version}
```

---

## 🔧 Plugin Management Endpoints

### **Plugin Activation**
Activate ServiceNow plugins.

```http
GET /api/sn_appclient/appmanager/plugin/activate
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `plugin_id` | string | ✅ | ID of the plugin |
| `customization_version` | string | ❌ | Customization version |

### **List Plugins**
Get plugins based on installation state and context.

```http
POST /api/sn_appclient/appmanager/plugins
```

**Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `tab_context` | string | ✅ | Context filter | `available_for_you\|installed\|updates` |
| `active` | boolean | ❌ | Filter by installation state | `true\|false` |
| `search_key` | string | ❌ | Search criteria | |
| `sysparm_limit` | number | ❌ | Max results | `50` |
| `sysparm_offset` | number | ❌ | Records to skip | `0` |

---

## 🔄 Batch Operations & Dependencies

### **Batch Dependencies**
Get dependency information for multiple applications.

```http
POST /api/sn_appclient/appmanager/batch/dependencies
```

**Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `sysparam_data` | string | ❌ | JSON data with app info | Complex JSON structure |

**Example Data Structure:**
```json
{
  "name": "Governance, Risk, and Compliance",
  "product_id": "grc_core",
  "packages": [
    {
      "id": "com.snc.grc_profile_dep",
      "is_plugin": true,
      "type": "plugin",
      "load_demo_data": false
    }
  ]
}
```

### **Single App Dependencies**
Get dependencies for a single application.

```http
POST /api/sn_appclient/appmanager/dependencies
```

**Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `scope` | string | ✅ | Scope of the app | `sn_clin_core` |
| `first_level_only` | boolean | ❌ | First level deps only (default: true) | `true` |

### **Product Installation**
Install complete products with all dependencies.

```http
POST /api/sn_appclient/appmanager/product/install
```

---

## 🔄 **Sync Applications (Two-Step Process)** - UPDATED

### **Step 1: Trigger Applications Sync**
Initiate synchronization of applications from the ServiceNow Store.

```http
GET /api/sn_appclient/appmanager/sync_apps?request_type=trigger_apps_sync
```

**Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `request_type` | string | ✅ | Must be `trigger_apps_sync` | `trigger_apps_sync` |

**Response:**
```json
{
  "result": {
    "trackerId": "9b151362fb49b254e80bf602beefdc03"
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `trackerId` | string | Unique identifier for tracking sync progress |

### **Step 2: Monitor Sync Progress**
Poll the sync status using the trackerId from Step 1.

```http
GET /api/sn_appclient/appmanager/sync_apps?request_type=get_apps_sync_status&tracker_id={trackerId}
```

**Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `request_type` | string | ✅ | Must be `get_apps_sync_status` | `get_apps_sync_status` |
| `tracker_id` | string | ✅ | Tracker ID from Step 1 | `9b151362fb49b254e80bf602beefdc03` |

**Response (In Progress):**
```json
{
  "result": {
    "isComplete": false,
    "userDateFormat": "yyyy-MM-dd"
  }
}
```

**Response (Completed):**
```json
{
  "result": {
    "isComplete": true,
    "repoTime": {
      "storeUpdatesTime": 45000
    },
    "errorMessage": "",
    "appsLastSyncTime": "Nov 09, 2025 08:57 PM",
    "userDateFormat": "yyyy-MM-dd"
  },
  "session": {
    "notifications": []
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `isComplete` | boolean | `false` during sync, `true` when finished |
| `userDateFormat` | string | Date format preference for the user |
| `repoTime.storeUpdatesTime` | number | Time taken for sync in milliseconds (when complete) |
| `errorMessage` | string | Error message if sync failed (when complete) |
| `appsLastSyncTime` | string | Formatted timestamp of completion (when complete) |

### **Complete Implementation Example**

```typescript
interface SyncTriggerResponse {
  result: {
    trackerId: string;
  };
}

interface SyncStatusResponse {
  result: {
    isComplete: boolean;
    userDateFormat: string;
    repoTime?: {
      storeUpdatesTime: number;
    };
    errorMessage?: string;
    appsLastSyncTime?: string;
  };
  session?: {
    notifications: any[];
  };
}

class SyncApplicationsService {
  private readonly POLL_INTERVAL = 2000; // 2 seconds
  private readonly MAX_POLLS = 150; // 5 minutes maximum
  
  async syncApplications(): Promise<SyncStatusResponse> {
    // Step 1: Trigger sync
    const triggerResponse = await this.triggerSync();
    const trackerId = triggerResponse.result.trackerId;
    
    if (!trackerId) {
      throw new Error('No tracker ID received from sync trigger');
    }
    
    // Step 2: Poll for completion
    return await this.pollSyncStatus(trackerId);
  }
  
  private async triggerSync(): Promise<SyncTriggerResponse> {
    const response = await apiService.get('/api/sn_appclient/appmanager/sync_apps', {
      params: { request_type: 'trigger_apps_sync' }
    });
    
    return response as SyncTriggerResponse;
  }
  
  private async pollSyncStatus(trackerId: string): Promise<SyncStatusResponse> {
    let pollCount = 0;
    
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          pollCount++;
          
          const response = await apiService.get('/api/sn_appclient/appmanager/sync_apps', {
            params: {
              request_type: 'get_apps_sync_status',
              tracker_id: trackerId
            }
          }) as SyncStatusResponse;
          
          if (response.result.isComplete) {
            // Sync completed successfully
            if (response.result.errorMessage) {
              reject(new Error(response.result.errorMessage));
            } else {
              resolve(response);
            }
          } else if (pollCount >= this.MAX_POLLS) {
            // Timeout reached
            reject(new Error('Sync operation timed out after 5 minutes'));
          } else {
            // Continue polling
            setTimeout(poll, this.POLL_INTERVAL);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }
}
```

### **React Hook Implementation**

```typescript
import { useState, useCallback } from 'react';
import { useNotifications } from '../hooks/useNotifications';

interface UseSyncApplicationsOptions {
  onSuccess?: (result: SyncStatusResponse) => void;
  onError?: (error: Error) => void;
  onProgress?: (message: string) => void;
}

export const useSyncApplications = (options: UseSyncApplicationsOptions = {}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const { showSuccess, showError, showInfo } = useNotifications();
  
  const syncApplications = useCallback(async () => {
    setIsSyncing(true);
    setSyncProgress(100); // Indeterminate progress - full bar with animation
    
    try {
      showInfo({
        title: 'Sync Started',
        message: 'Synchronizing applications from ServiceNow Store...'
      });
      
      // Step 1: Trigger sync and get tracker ID
      const triggerResponse = await apiService.get('/api/sn_appclient/appmanager/sync_apps', {
        params: { request_type: 'trigger_apps_sync' }
      }) as SyncTriggerResponse;
      
      const trackerId = triggerResponse.result.trackerId;
      if (!trackerId) {
        throw new Error('No tracker ID received from sync trigger');
      }
      
      options.onProgress?.('Sync initiated, monitoring progress...');
      
      // Step 2: Poll for completion
      let pollCount = 0;
      const MAX_POLLS = 150; // 5 minutes
      const POLL_INTERVAL = 2000; // 2 seconds
      
      const pollForCompletion = (): Promise<SyncStatusResponse> => {
        return new Promise((resolve, reject) => {
          const poll = async () => {
            try {
              pollCount++;
              
              const statusResponse = await apiService.get('/api/sn_appclient/appmanager/sync_apps', {
                params: {
                  request_type: 'get_apps_sync_status',
                  tracker_id: trackerId
                }
              }) as SyncStatusResponse;
              
              if (statusResponse.result.isComplete) {
                if (statusResponse.result.errorMessage) {
                  reject(new Error(statusResponse.result.errorMessage));
                } else {
                  resolve(statusResponse);
                }
              } else if (pollCount >= MAX_POLLS) {
                reject(new Error('Sync operation timed out after 5 minutes'));
              } else {
                options.onProgress?.(`Syncing... (${Math.round(pollCount * 2 / 60)} min)`);
                setTimeout(poll, POLL_INTERVAL);
              }
            } catch (error) {
              reject(error instanceof Error ? error : new Error(String(error)));
            }
          };
          
          poll();
        });
      };
      
      const result = await pollForCompletion();
      
      showSuccess({
        title: 'Sync Complete',
        message: `Applications synchronized successfully. Last sync: ${result.result.appsLastSyncTime}`
      });
      
      options.onSuccess?.(result);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      
      showError({
        title: 'Sync Failed',
        message: errorMessage
      });
      
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [options, showSuccess, showError, showInfo]);
  
  return {
    syncApplications,
    isSyncing,
    syncProgress: syncProgress, // Always 100 for indeterminate progress
  };
};
```

### **Progress Display Best Practices**

Since the API doesn't provide incremental progress data, implement indeterminate progress:

```typescript
// ❌ DON'T: Fake progress based on time or poll count
const fakeProgress = (pollCount / maxPolls) * 100;

// ✅ DO: Use indeterminate progress with full bar and animation
<Progress 
  value={100}           // Full width
  animated              // Moving animation
  size="sm"
  color="blue"
  label="Syncing applications..."
/>

// ✅ DO: Show time-based progress messages
const getProgressMessage = (pollCount: number) => {
  const minutes = Math.round(pollCount * 2 / 60);
  return `Syncing applications... (${minutes} min)`;
};
```

---

## 📈 Progress Tracking & Installations

### **Installation Progress**
Track the progress of ongoing installations.

```http
GET /api/sn_appclient/appmanager/progress/{trackerId}
```

**Example Implementation:**
```typescript
class InstallationTracker {
  async trackInstallation(trackerId: string) {
    const response = await apiService.get(`/api/sn_appclient/appmanager/progress/${trackerId}`);
    return response.result;
  }
  
  async pollInstallationProgress(trackerId: string, interval = 5000) {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const progress = await this.trackInstallation(trackerId);
          
          if (progress.status === 'complete') {
            resolve(progress);
          } else if (progress.status === 'error') {
            reject(new Error(progress.error || 'Installation failed'));
          } else {
            setTimeout(poll, interval);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }
}
```

### **List In-Progress Installations**
Get all currently running installations.

```http
GET /api/sn_appclient/appmanager/installations
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sysparm_limit` | number | ❌ | Max results (default: 10,000) |
| `sysparm_offset` | number | ❌ | Records to skip |

### **Get Installation Details**
Get detailed information for a specific installation.

```http
GET /api/sn_appclient/appmanager/installations/{trackerId}
```

---

## 📅 Scheduling & Configuration

### **Schedule Management**
Manage installation schedules.

```http
POST /api/sn_appclient/appmanager/schedule
```

**Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `action` | string | ✅ | Schedule action type | `create_schedule\|update_schedule\|delete_schedule` |
| `scheduled_time` | string | ❌ | Schedule datetime | `2022-02-02 02:20:00` |
| `source_app_id` | string | ❌ | App source ID | |
| `appCount` | number | ❌ | Number of apps | `2` |
| `schedule_id` | string | ❌ | Current schedule ID | |

**Example Usage:**
```typescript
const scheduleInstallation = async (appId: string, scheduledTime: string) => {
  return await apiService.post('/api/sn_appclient/appmanager/schedule', {}, {
    params: {
      action: 'create_schedule',
      source_app_id: appId,
      scheduled_time: scheduledTime,
      appCount: 1
    }
  });
};
```

### **Get Page Configuration**
Retrieve configuration for the Application Manager interface.

```http
GET /api/sn_appclient/appmanager/get_page_config
```

### **Get Filters**
Retrieve available filter options.

```http
GET /api/sn_appclient/appmanager/filters
```

---

## 🔍 Utility Endpoints

### **Application Manifest**
Get the manifest for a specific application version.

```http
GET /api/sn_appclient/appmanager/manifest
```

**Parameters:**
| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `source_app_id` | string | ✅ | Source App ID | `com.snc.work_management` |
| `version` | string | ✅ | App version | `1.0.0` |

### **Register Tracker Info**
Register tracking information for installations.

```http
POST /api/sn_appclient/appmanager/register_tracker_info
```

---

## 🛠️ Integration Examples

### **Complete Application Installation Flow**
```typescript
class ServiceNowAppManager {
  async installApplication(appId: string, version: string, options = {}) {
    try {
      // 1. Get application info
      const appInfo = await this.getAppInfo(appId, version);
      
      // 2. Check dependencies
      const dependencies = await this.getAppDependencies(appId);
      
      // 3. Start installation
      const installResponse = await apiService.get('/api/sn_appclient/appmanager/app/install', {
        params: {
          app_id: appId,
          version: version,
          load_demo_data: 'false',
          ...options
        }
      });
      
      // 4. Track progress
      if (installResponse.result.tracker_id) {
        return await this.trackInstallation(installResponse.result.tracker_id);
      }
      
      return installResponse.result;
    } catch (error) {
      logger.error('Application installation failed', error);
      throw error;
    }
  }
  
  private async getAppInfo(appId: string, version: string) {
    return await apiService.get(`/api/sn_appclient/appmanager/app_info_from_store/${appId}/${version}`);
  }
  
  private async getAppDependencies(scope: string) {
    return await apiService.post('/api/sn_appclient/appmanager/dependencies', {}, {
      params: { scope, first_level_only: 'true' }
    });
  }
}
```

### **Batch Update Operations**
```typescript
class BatchUpdateManager {
  async updateMultipleApps(apps: Array<{id: string, version: string}>) {
    const results = [];
    
    for (const app of apps) {
      try {
        const result = await apiService.get('/api/sn_appclient/appmanager/app/update', {
          params: {
            app_id: app.id,
            version: app.version
          }
        });
        
        results.push({ app, result: result.result, success: true });
      } catch (error) {
        results.push({ app, error: error.message, success: false });
      }
    }
    
    return results;
  }
}
```

---

## ⚠️ Important Considerations

### **Rate Limiting**
- Internal API may have rate limits
- Implement proper retry logic with exponential backoff
- Monitor for HTTP 429 responses

### **Error Handling**
```typescript
const handleAppManagerError = (error: any) => {
  if (error.status === 403) {
    throw new Error('Insufficient permissions for application management');
  } else if (error.status === 404) {
    throw new Error('Application or endpoint not found');
  } else if (error.status === 429) {
    throw new Error('Rate limit exceeded - retry after delay');
  } else {
    throw new Error(`Application Manager API error: ${error.message}`);
  }
};
```

### **Authentication Requirements**
- Requires valid ServiceNow session
- Must have appropriate roles (e.g., `admin`, `app_manager`)
- Include CSRF token in requests

### **API Stability**
- Internal API - subject to change without notice
- Test thoroughly before production use
- Monitor ServiceNow release notes for changes

### **Sync Applications Best Practices**
- **Indeterminate Progress**: Use animated progress bars since incremental progress isn't available
- **Timeout Protection**: Implement 5-minute maximum polling duration
- **Error Handling**: Check `errorMessage` field in completion response
- **Polling Interval**: Use 2-second intervals to balance responsiveness with server load
- **User Feedback**: Provide time-based progress messages during long-running syncs

---

## 📚 Related Documentation

### **ServiceNow Integration:**
- [Service Layer Integration](../architecture/patterns/service-layer-integration.md) - How to integrate with ServiceNow APIs
- [Core Principles](../architecture/core-principles.md) - Architectural foundation

### **Implementation Patterns:**
- [API Integration](../architecture/patterns/servicenow-react/05-api-integration.md) - TanStack Query integration patterns
- [Error Handling](../architecture/patterns/servicenow-react/08-error-handling.md) - Comprehensive error handling

---

*The ServiceNow Application Manager Internal API provides comprehensive application lifecycle management capabilities. Use with appropriate authentication and error handling for production applications. The Sync Applications endpoint requires a two-step process with indeterminate progress monitoring.*