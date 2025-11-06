---
title: "ServiceNow Query Patterns and Advanced Filtering"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Advanced ServiceNow query patterns for complex business requirements"
readTime: "6 minutes"
complexity: "advanced"
criticality: "HIGH"
tags: ["servicenow", "queries", "filtering", "performance", "patterns"]
validationStatus: "PRODUCTION_TESTED"
---

# ServiceNow Query Patterns and Advanced Filtering

**Purpose:** Advanced ServiceNow query patterns for complex business requirements  
**Read time:** ~6 minutes  
**Use case:** Complex filtering, reporting queries, performance optimization

> **🎯 CRITICAL:** These patterns are essential for building enterprise-grade ServiceNow applications with complex business logic and high-performance data access.

---

## Advanced Encoded Query Patterns

### **Complex Business Logic Queries**
```typescript
// services/AdvancedQueryService.ts
export class AdvancedQueryService extends BaseServiceNowService {
  
  /**
   * Build complex incident queries for different business scenarios
   */
  buildBusinessQueries = {
    
    // High priority incidents needing immediate attention
    criticalIncidents: () => {
      return [
        'priority=1',                    // Critical priority
        'state!=6^state!=7',            // Not resolved or closed
        'assigned_toISEMPTY',           // Unassigned
        'sys_created_on>javascript:gs.daysAgoStart(1)' // Created in last day
      ].join('^');
    },

    // Incidents at risk of SLA breach
    slaRiskIncidents: () => {
      return [
        'priority<=3',                   // High to Critical priority
        'state!=6^state!=7',            // Not resolved or closed
        'due_date<javascript:gs.now()',  // Past due date
        'sla_due!=NULL'                 // Has SLA
      ].join('^');
    },

    // Incidents for specific department with escalation
    departmentEscalated: (departmentId: string) => {
      return [
        `caller_id.department=${departmentId}`,  // Specific department
        'escalation>0',                          // Has been escalated
        'state=2^ORstate=3',                    // In Progress or On Hold
        'priority<=3'                           // High priority or above
      ].join('^');
    },

    // Recent incidents by category for trending analysis
    categoryTrends: (category: string, days: number = 30) => {
      return [
        `category=${category}`,
        `sys_created_on>javascript:gs.daysAgoStart(${days})`,
        'state!=8',  // Not cancelled
        'ORDERBYDESCsys_created_on'
      ].join('^');
    },

    // User workload analysis
    userWorkload: (userId: string) => {
      return [
        `assigned_to=${userId}`,
        'state!=6^state!=7^state!=8',  // Active states only
        'ORDERBYpriority^ORDERBYDESCsys_created_on'
      ].join('^');
    },

    // Performance metrics queries
    performanceMetrics: (startDate: string, endDate: string) => {
      return [
        `sys_created_on>=${startDate}`,
        `sys_created_on<=${endDate}`,
        'state=6^ORstate=7',  // Resolved or Closed
        'ORDERBYclosed_at'
      ].join('^');
    }
  };

  /**
   * Advanced filtering with dynamic conditions
   */
  async getIncidentsWithAdvancedFilter(options: AdvancedFilterOptions): Promise<ServiceNowTableResponse<Incident>> {
    const queryParts: string[] = [];

    // Date range filtering
    if (options.dateRange) {
      const { startDate, endDate, field = 'sys_created_on' } = options.dateRange;
      if (startDate) queryParts.push(`${field}>=${startDate}`);
      if (endDate) queryParts.push(`${field}<=${endDate}`);
    }

    // Multi-value filtering with OR conditions
    if (options.priorities && options.priorities.length > 0) {
      const priorityQuery = options.priorities.map(p => `priority=${p}`).join('^OR');
      queryParts.push(`(${priorityQuery})`);
    }

    // Reference field filtering (joins)
    if (options.assignmentGroup) {
      queryParts.push(`assignment_group.name=${options.assignmentGroup}`);
    }

    // Text search across multiple fields
    if (options.textSearch) {
      const searchQuery = [
        `short_descriptionLIKE${options.textSearch}`,
        `descriptionLIKE${options.textSearch}`,
        `numberLIKE${options.textSearch}`
      ].join('^OR');
      queryParts.push(`(${searchQuery})`);
    }

    // Business hours filtering
    if (options.businessHoursOnly) {
      queryParts.push('sys_created_onDATEPARTbusiness_hours!=null');
    }

    // Custom field conditions
    if (options.customConditions) {
      queryParts.push(...options.customConditions);
    }

    const encodedQuery = queryParts.join('^');
    
    return this.getIncidentsWithQuery(encodedQuery, options);
  }
}

export interface AdvancedFilterOptions {
  dateRange?: {
    startDate?: string;
    endDate?: string;
    field?: string;
  };
  priorities?: string[];
  states?: string[];
  assignmentGroup?: string;
  textSearch?: string;
  businessHoursOnly?: boolean;
  customConditions?: string[];
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}
```

### **Performance-Optimized Query Patterns**
```typescript
// Performance-focused query implementation
export class PerformanceQueryService extends BaseServiceNowService {
  
  /**
   * Paginated queries with proper indexing
   */
  async getPaginatedIncidents(options: PaginationOptions): Promise<ServiceNowTableResponse<Incident>> {
    const params = this.buildQueryParams({
      fields: this.getOptimalFieldList(), // Only fields needed
      displayValue: 'all',
      excludeReferenceLink: true
    });

    // Use indexed fields for ordering when possible
    const indexedOrderFields = ['sys_created_on', 'number', 'priority', 'state'];
    const orderField = indexedOrderFields.includes(options.orderBy || '') 
      ? options.orderBy 
      : 'sys_created_on';

    // Build efficient encoded query
    const queryParts = [
      'active=true',  // Use indexed field
      options.encodedQuery || '',
      `ORDERBY${options.orderDirection === 'ASC' ? '' : 'DESC'}${orderField}`
    ].filter(Boolean);

    params.set('sysparm_query', queryParts.join('^'));
    params.set('sysparm_limit', (options.limit || 50).toString());
    params.set('sysparm_offset', (options.offset || 0).toString());

    return this.request<ServiceNowTableResponse<Incident>>(
      `/table/incident?${params.toString()}`
    );
  }

  /**
   * Aggregation queries for dashboards
   */
  async getIncidentMetrics(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<IncidentMetrics> {
    const daysBack = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30;
    
    // Use aggregate API for better performance
    const aggregateQuery = [
      `sys_created_on>javascript:gs.daysAgoStart(${daysBack})`,
      'active=true'
    ].join('^');

    const params = new URLSearchParams({
      sysparm_query: aggregateQuery,
      sysparm_group_by: 'priority,state',
      sysparm_count: 'true'
    });

    const response = await this.request<{ result: any[] }>(
      `/stats/incident?${params.toString()}`
    );

    return this.processMetricsResponse(response.result);
  }

  /**
   * Optimized field selection for performance
   */
  private getOptimalFieldList(): string[] {
    return [
      // Core identification
      'sys_id', 'number',
      
      // Display fields
      'short_description', 'priority', 'state',
      
      // Assignment fields
      'assigned_to', 'assignment_group',
      
      // Audit fields (minimal)
      'sys_created_on', 'sys_updated_on'
      
      // Skip: description, long text fields unless specifically needed
    ];
  }
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
  encodedQuery?: string;
}

export interface IncidentMetrics {
  totalCount: number;
  byPriority: Record<string, number>;
  byState: Record<string, number>;
  averageResolutionTime: number;
  slaBreaches: number;
}
```

---

## Specialized Query Hooks

### **Advanced TanStack Query Patterns**
```typescript
// hooks/useAdvancedIncidentQueries.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { advancedQueryService, AdvancedFilterOptions } from '../services/AdvancedQueryService';

export const advancedIncidentQueryKeys = {
  filtered: (filters: AdvancedFilterOptions) => ['incidents', 'advanced', filters] as const,
  metrics: (timeframe: string) => ['incidents', 'metrics', timeframe] as const,
  trends: (category: string, days: number) => ['incidents', 'trends', category, days] as const,
  userWorkload: (userId: string) => ['incidents', 'workload', userId] as const,
};

/**
 * Advanced filtering with complex business logic
 */
export function useAdvancedIncidentFilter(filters: AdvancedFilterOptions) {
  return useQuery({
    queryKey: advancedIncidentQueryKeys.filtered(filters),
    queryFn: () => advancedQueryService.getIncidentsWithAdvancedFilter(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes for filtered data
    enabled: Object.keys(filters).length > 0, // Only run if filters provided
  });
}

/**
 * Infinite scrolling for large datasets
 */
export function useInfiniteIncidents(baseFilters: AdvancedFilterOptions) {
  return useInfiniteQuery({
    queryKey: ['incidents', 'infinite', baseFilters],
    queryFn: ({ pageParam = 0 }) =>
      advancedQueryService.getPaginatedIncidents({
        ...baseFilters,
        offset: pageParam,
        limit: 20,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.length * 20;
      return lastPage.result.length === 20 ? totalLoaded : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for paginated data
  });
}

/**
 * Real-time metrics for dashboards
 */
export function useIncidentMetrics(timeframe: 'day' | 'week' | 'month' = 'week') {
  return useQuery({
    queryKey: advancedIncidentQueryKeys.metrics(timeframe),
    queryFn: () => advancedQueryService.getIncidentMetrics(timeframe),
    staleTime: 10 * 60 * 1000, // 10 minutes for metrics
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

/**
 * Category trend analysis
 */
export function useCategoryTrends(category: string, days: number = 30) {
  return useQuery({
    queryKey: advancedIncidentQueryKeys.trends(category, days),
    queryFn: () => {
      const encodedQuery = advancedQueryService.buildBusinessQueries.categoryTrends(category, days);
      return advancedQueryService.getIncidentsWithQuery(encodedQuery);
    },
    staleTime: 15 * 60 * 1000, // 15 minutes for trends
    enabled: !!category,
  });
}

/**
 * User workload analysis
 */
export function useUserWorkload(userId: string) {
  return useQuery({
    queryKey: advancedIncidentQueryKeys.userWorkload(userId),
    queryFn: () => {
      const encodedQuery = advancedQueryService.buildBusinessQueries.userWorkload(userId);
      return advancedQueryService.getIncidentsWithQuery(encodedQuery);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes for workload
    enabled: !!userId,
  });
}
```

---

## Complex Filter Components

### **Advanced Filter Interface**
```typescript
// components/organisms/AdvancedIncidentFilter.tsx
import React, { useState } from 'react';
import { useAdvancedIncidentFilter } from '../../hooks/useAdvancedIncidentQueries';
import { AdvancedFilterOptions } from '../../services/AdvancedQueryService';

export function AdvancedIncidentFilter() {
  const [filters, setFilters] = useState<AdvancedFilterOptions>({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { data: incidents, isLoading, error } = useAdvancedIncidentFilter(filters);

  const handleDateRangeChange = (startDate: string, endDate: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { startDate, endDate }
    }));
  };

  const handlePriorityChange = (priorities: string[]) => {
    setFilters(prev => ({
      ...prev,
      priorities: priorities.length > 0 ? priorities : undefined
    }));
  };

  const handleTextSearch = (searchText: string) => {
    setFilters(prev => ({
      ...prev,
      textSearch: searchText || undefined
    }));
  };

  const handleAdvancedFilters = (customConditions: string[]) => {
    setFilters(prev => ({
      ...prev,
      customConditions: customConditions.length > 0 ? customConditions : undefined
    }));
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Advanced Incident Filtering</h3>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </button>
      </div>

      <div className="card-content">
        {/* Basic Filters */}
        <div className="grid-wide gap-md">
          <div className="form-group">
            <label className="label">Text Search</label>
            <input
              className="input"
              type="text"
              placeholder="Search number, description..."
              onChange={(e) => handleTextSearch(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="label">Priority</label>
            <select
              className="select"
              multiple
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                handlePriorityChange(selected);
              }}
            >
              <option value="1">1 - Critical</option>
              <option value="2">2 - High</option>
              <option value="3">3 - Moderate</option>
              <option value="4">4 - Low</option>
            </select>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid-wide gap-md mt-4">
          <div className="form-group">
            <label className="label">Start Date</label>
            <input
              className="input"
              type="date"
              onChange={(e) => handleDateRangeChange(e.target.value, filters.dateRange?.endDate || '')}
            />
          </div>

          <div className="form-group">
            <label className="label">End Date</label>
            <input
              className="input"
              type="date"
              onChange={(e) => handleDateRangeChange(filters.dateRange?.startDate || '', e.target.value)}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="mt-6 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold mb-4">Advanced Conditions</h4>
            
            <div className="form-group">
              <label className="label">Assignment Group</label>
              <input
                className="input"
                type="text"
                placeholder="e.g., Network Support"
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  assignmentGroup: e.target.value || undefined
                }))}
              />
            </div>

            <div className="form-group mt-4">
              <label className="label">
                <input
                  type="checkbox"
                  className="mr-2"
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    businessHoursOnly: e.target.checked || undefined
                  }))}
                />
                Business Hours Only
              </label>
            </div>

            <div className="form-group mt-4">
              <label className="label">Custom Encoded Query Conditions</label>
              <textarea
                className="textarea"
                placeholder="e.g., caller_id.department=HR^escalation>0"
                onChange={(e) => {
                  const conditions = e.target.value.split('\n').filter(c => c.trim());
                  handleAdvancedFilters(conditions);
                }}
              />
              <p className="text-xs text-slate-600 mt-1">
                Enter one condition per line. Use ServiceNow encoded query syntax.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="card-footer">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">
            {isLoading ? 'Loading...' : 
             error ? 'Error loading results' :
             incidents ? `${incidents.result.length} incidents found` : 'No filters applied'}
          </span>
          
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setFilters({})}
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Query Performance Optimization

### **Best Practices for ServiceNow Queries**
```typescript
// Performance optimization patterns
export const queryOptimizationPatterns = {
  
  // ✅ GOOD: Use indexed fields for filtering and ordering
  efficientQuery: {
    // Indexed fields: sys_created_on, number, priority, state, active
    encodedQuery: 'active=true^priority<=3^ORDERBYDESCsys_created_on',
    fields: ['sys_id', 'number', 'short_description', 'priority', 'state'], // Minimal fields
    limit: 50, // Reasonable page size
  },

  // ❌ BAD: Full table scan with non-indexed fields
  inefficientQuery: {
    encodedQuery: 'descriptionLIKE%network%^caller_id.email=test@example.com', // Non-indexed
    // fields: undefined, // All fields (expensive)
    limit: 1000, // Too large
  },

  // ✅ GOOD: Batch processing for large datasets
  batchProcessing: async function<T>(
    queryFn: (offset: number, limit: number) => Promise<ServiceNowTableResponse<T>>,
    totalLimit: number = 1000
  ): Promise<T[]> {
    const batchSize = 100;
    const results: T[] = [];
    
    for (let offset = 0; offset < totalLimit; offset += batchSize) {
      const response = await queryFn(offset, batchSize);
      results.push(...response.result);
      
      // Stop if we got fewer results than requested (end of data)
      if (response.result.length < batchSize) break;
    }
    
    return results;
  },

  // ✅ GOOD: Cache expensive queries with longer stale times
  cacheStrategy: {
    realTimeData: { staleTime: 30 * 1000 },      // 30 seconds
    userData: { staleTime: 5 * 60 * 1000 },      // 5 minutes  
    referenceData: { staleTime: 60 * 60 * 1000 }, // 1 hour
    reports: { staleTime: 15 * 60 * 1000 },       // 15 minutes
  }
};
```

---

## Implementation Checklist

### **✅ Advanced Query Implementation**
- [ ] Complex encoded query builders for business scenarios
- [ ] Performance-optimized queries with indexed fields
- [ ] Advanced filtering service with dynamic conditions
- [ ] Infinite scrolling for large datasets
- [ ] Metrics and aggregation queries
- [ ] Proper field selection for performance

### **✅ TanStack Query Integration**
- [ ] Specialized hooks for different query types
- [ ] Proper cache key management for complex filters
- [ ] Appropriate stale times for different data types
- [ ] Infinite query implementation for pagination
- [ ] Real-time metric queries with auto-refresh

### **✅ UI Components**
- [ ] Advanced filter interface with multiple criteria
- [ ] Date range pickers and multi-select controls
- [ ] Custom encoded query input for power users
- [ ] Results display with loading and error states
- [ ] Filter management (save, load, clear)

---

*These patterns enable enterprise-grade ServiceNow query capabilities with optimal performance and user experience.*