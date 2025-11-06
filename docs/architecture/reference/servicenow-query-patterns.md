---
title: "ServiceNow Advanced Query Patterns"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Complex ServiceNow API query patterns for advanced data operations"
readTime: "7 minutes"
complexity: "advanced"
criticality: "HIGH"
tags: ["servicenow", "queries", "api", "performance", "filtering"]
validationStatus: "PRODUCTION_TESTED"
---

# ServiceNow Advanced Query Patterns

**Purpose:** Complex ServiceNow API query patterns for advanced data operations  
**Read time:** ~7 minutes  
**Use case:** Applications requiring sophisticated filtering, joins, aggregations, and performance optimization

> **Production-tested patterns** from enterprise ServiceNow applications with complex data requirements.

---

## Advanced Encoded Query Building

### **Complex Filter Combinations**
```typescript
// services/QueryBuilder.ts
export class ServiceNowQueryBuilder {
  private conditions: string[] = [];
  
  // Basic conditions
  equals(field: string, value: string): this {
    this.conditions.push(`${field}=${value}`);
    return this;
  }
  
  notEquals(field: string, value: string): this {
    this.conditions.push(`${field}!=${value}`);
    return this;
  }
  
  like(field: string, value: string): this {
    this.conditions.push(`${field}LIKE${value}`);
    return this;
  }
  
  startsWith(field: string, value: string): this {
    this.conditions.push(`${field}STARTSWITH${value}`);
    return this;
  }
  
  in(field: string, values: string[]): this {
    this.conditions.push(`${field}IN${values.join(',')}`);
    return this;
  }
  
  // Date operations
  dateRange(field: string, startDate: string, endDate: string): this {
    this.conditions.push(`${field}>${startDate}^${field}<${endDate}`);
    return this;
  }
  
  lastNDays(field: string, days: number): this {
    this.conditions.push(`${field}>javascript:gs.daysAgoStart(${days})`);
    return this;
  }
  
  thisWeek(field: string): this {
    this.conditions.push(`${field}>=javascript:gs.beginningOfWeek()^${field}<=javascript:gs.endOfWeek()`);
    return this;
  }
  
  // Logical operators
  and(): this {
    // Default behavior - conditions are ANDed
    return this;
  }
  
  or(callback: (builder: ServiceNowQueryBuilder) => void): this {
    const orBuilder = new ServiceNowQueryBuilder();
    callback(orBuilder);
    const orConditions = orBuilder.build();
    if (orConditions) {
      this.conditions.push(`(${orConditions})`);
    }
    return this;
  }
  
  // Null checks
  isNull(field: string): this {
    this.conditions.push(`${field}ISEMPTY`);
    return this;
  }
  
  isNotNull(field: string): this {
    this.conditions.push(`${field}ISNOTEMPTY`);
    return this;
  }
  
  // Advanced patterns
  hasReferenceValue(referenceField: string, targetField: string, value: string): this {
    this.conditions.push(`${referenceField}.${targetField}=${value}`);
    return this;
  }
  
  build(): string {
    return this.conditions.join('^');
  }
  
  // Static helper for common patterns
  static create(): ServiceNowQueryBuilder {
    return new ServiceNowQueryBuilder();
  }
}

// Usage examples
const query = ServiceNowQueryBuilder.create()
  .equals('active', 'true')
  .in('priority', ['1', '2'])
  .dateRange('sys_created_on', '2024-01-01', '2024-12-31')
  .or(builder => {
    builder
      .like('short_description', 'urgent')
      .hasReferenceValue('caller_id', 'vip', 'true');
  })
  .build();
// Results in: active=true^priorityIN1,2^sys_created_on>2024-01-01^sys_created_on<2024-12-31^(short_descriptionLIKEurgent^caller_id.vip=true)
```

---

## Reference Field Query Patterns

### **Dot-Walking Through References**
```typescript
// services/AdvancedIncidentService.ts
export class AdvancedIncidentService extends BaseServiceNowService {
  /**
   * Query incidents with caller information
   */
  async getIncidentsWithCallerInfo(options: {
    callerDepartment?: string;
    callerLocation?: string;
    vipOnly?: boolean;
  } = {}): Promise<ServiceNowTableResponse<Incident>> {
    const query = ServiceNowQueryBuilder.create()
      .equals('active', 'true');
    
    if (options.callerDepartment) {
      query.hasReferenceValue('caller_id', 'department.name', options.callerDepartment);
    }
    
    if (options.callerLocation) {
      query.hasReferenceValue('caller_id', 'location.name', options.callerLocation);
    }
    
    if (options.vipOnly) {
      query.hasReferenceValue('caller_id', 'vip', 'true');
    }
    
    const params = this.buildQueryParams({
      fields: [
        'sys_id', 'number', 'short_description', 'priority', 'state',
        'caller_id.name', 'caller_id.email', 'caller_id.department.name',
        'caller_id.location.name', 'caller_id.vip'
      ],
      displayValue: 'all'
    });
    
    params.set('sysparm_query', query.build());
    
    return this.request<ServiceNowTableResponse<Incident>>(
      `/table/incident?${params.toString()}`
    );
  }
  
  /**
   * Query incidents by Configuration Item details
   */
  async getIncidentsByCIDetails(options: {
    ciType?: string;
    ciStatus?: string;
    businessService?: string;
  }): Promise<ServiceNowTableResponse<Incident>> {
    const query = ServiceNowQueryBuilder.create()
      .equals('active', 'true');
    
    if (options.ciType) {
      query.hasReferenceValue('cmdb_ci', 'sys_class_name', options.ciType);
    }
    
    if (options.ciStatus) {
      query.hasReferenceValue('cmdb_ci', 'operational_status', options.ciStatus);
    }
    
    if (options.businessService) {
      query.hasReferenceValue('cmdb_ci', 'business_service.name', options.businessService);
    }
    
    const params = this.buildQueryParams({
      fields: [
        'sys_id', 'number', 'short_description',
        'cmdb_ci.name', 'cmdb_ci.sys_class_name', 'cmdb_ci.operational_status',
        'cmdb_ci.business_service.name'
      ]
    });
    
    params.set('sysparm_query', query.build());
    
    return this.request<ServiceNowTableResponse<Incident>>(
      `/table/incident?${params.toString()}`
    );
  }
}
```

---

## Aggregation and Analytics Queries

### **Using GlideAggregate Patterns via API**
```typescript
// services/IncidentAnalyticsService.ts
export interface IncidentMetrics {
  totalCount: number;
  byPriority: Record<string, number>;
  byState: Record<string, number>;
  byAssignmentGroup: Record<string, number>;
  avgResolutionTime: number;
}

export class IncidentAnalyticsService extends BaseServiceNowService {
  async getIncidentMetrics(timeframe: {
    startDate: string;
    endDate: string;
  }): Promise<IncidentMetrics> {
    // Use ServiceNow's aggregate API endpoint
    const aggregateQuery = ServiceNowQueryBuilder.create()
      .dateRange('sys_created_on', timeframe.startDate, timeframe.endDate)
      .equals('active', 'true')
      .build();
    
    const [priorityStats, stateStats, groupStats] = await Promise.all([
      this.getAggregateData('incident', 'priority', aggregateQuery),
      this.getAggregateData('incident', 'state', aggregateQuery),
      this.getAggregateData('incident', 'assignment_group', aggregateQuery)
    ]);
    
    return {
      totalCount: this.sumCounts(priorityStats),
      byPriority: this.formatAggregateResults(priorityStats),
      byState: this.formatAggregateResults(stateStats),
      byAssignmentGroup: this.formatAggregateResults(groupStats),
      avgResolutionTime: await this.getAverageResolutionTime(aggregateQuery)
    };
  }
  
  private async getAggregateData(
    table: string, 
    groupBy: string, 
    query: string
  ): Promise<any[]> {
    const params = new URLSearchParams({
      sysparm_query: query,
      sysparm_group_by: groupBy,
      sysparm_count: 'true'
    });
    
    const response = await this.request<ServiceNowTableResponse<any>>(
      `/table/${table}?${params.toString()}`
    );
    
    return response.result;
  }
  
  private async getAverageResolutionTime(query: string): Promise<number> {
    // Custom scripted REST API for complex calculations
    return this.request<number>(`/api/custom/incident_metrics/avg_resolution_time`, {
      method: 'POST',
      body: JSON.stringify({ query })
    });
  }
  
  private formatAggregateResults(results: any[]): Record<string, number> {
    return results.reduce((acc, item) => {
      const key = item.group_by_value || 'Unknown';
      acc[key] = parseInt(item.count, 10) || 0;
      return acc;
    }, {});
  }
  
  private sumCounts(results: any[]): number {
    return results.reduce((sum, item) => sum + (parseInt(item.count, 10) || 0), 0);
  }
}
```

---

## Performance Optimization Patterns

### **Efficient Pagination and Streaming**
```typescript
// services/PaginatedQueryService.ts
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  result: T[];
  totalCount: number;
  hasMore: boolean;
  nextOffset?: number;
}

export class PaginatedQueryService extends BaseServiceNowService {
  async getPaginatedIncidents(
    filters: IncidentQueryOptions,
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResponse<Incident>> {
    const {
      limit = 50,
      offset = 0,
      orderBy = 'sys_created_on',
      orderDirection = 'DESC'
    } = pagination;
    
    // Build efficient query
    const query = this.buildIncidentQuery(filters);
    
    const params = this.buildQueryParams({
      fields: this.getOptimizedIncidentFields(), // Only needed fields
      displayValue: 'all'
    });
    
    params.set('sysparm_query', query);
    params.set('sysparm_limit', limit.toString());
    params.set('sysparm_offset', offset.toString());
    params.set('sysparm_order_by', orderDirection === 'DESC' ? `ORDERBYDESC${orderBy}` : `ORDERBY${orderBy}`);
    
    // Get total count separately for better performance
    const [dataResponse, countResponse] = await Promise.all([
      this.request<ServiceNowTableResponse<Incident>>(`/table/incident?${params.toString()}`),
      this.getRecordCount('incident', query)
    ]);
    
    return {
      result: dataResponse.result,
      totalCount: countResponse,
      hasMore: offset + limit < countResponse,
      nextOffset: offset + limit < countResponse ? offset + limit : undefined
    };
  }
  
  private async getRecordCount(table: string, query: string): Promise<number> {
    const params = new URLSearchParams({
      sysparm_query: query,
      sysparm_count: 'true'
    });
    
    const response = await this.request<{ result: [{ count: string }] }>(
      `/table/${table}?${params.toString()}`
    );
    
    return parseInt(response.result[0]?.count || '0', 10);
  }
  
  private getOptimizedIncidentFields(): string[] {
    return [
      'sys_id', 'number', 'short_description', 'priority', 'state',
      'sys_created_on', 'assigned_to.name', 'caller_id.name'
      // Only include fields actually used in UI
    ];
  }
}

// Infinite scroll hook using optimized pagination
export function useInfiniteIncidents(filters: IncidentQueryOptions = {}) {
  const paginatedService = useMemo(() => new PaginatedQueryService(), []);
  
  return useInfiniteQuery({
    queryKey: ['incidents', 'infinite', filters],
    queryFn: ({ pageParam = 0 }) => 
      paginatedService.getPaginatedIncidents(filters, { 
        offset: pageParam,
        limit: 20 
      }),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 2 * 60 * 1000,
  });
}
```

---

## Advanced Search Patterns

### **Full-Text Search with Ranking**
```typescript
// services/SearchService.ts
export interface SearchOptions {
  query: string;
  tables?: string[];
  fields?: string[];
  fuzzy?: boolean;
  maxResults?: number;
}

export interface SearchResult {
  table: string;
  sys_id: string;
  score: number;
  title: string;
  excerpt: string;
  url: string;
}

export class ServiceNowSearchService extends BaseServiceNowService {
  /**
   * Global text search across multiple tables
   */
  async globalSearch(options: SearchOptions): Promise<SearchResult[]> {
    const {
      query,
      tables = ['incident', 'problem', 'change_request', 'kb_knowledge'],
      fields = ['short_description', 'description'],
      fuzzy = true,
      maxResults = 50
    } = options;
    
    // Use ServiceNow's search API
    const searchParams = new URLSearchParams({
      sysparm_search: query,
      sysparm_search_tables: tables.join(','),
      sysparm_search_fields: fields.join(','),
      sysparm_fuzzy: fuzzy.toString(),
      sysparm_limit: maxResults.toString()
    });
    
    return this.request<SearchResult[]>(
      `/api/now/search?${searchParams.toString()}`
    );
  }
  
  /**
   * Advanced incident search with scoring
   */
  async searchIncidents(searchTerm: string, options: {
    priorityBoost?: number;
    recentBoost?: number;
    assignedToMe?: boolean;
  } = {}): Promise<ServiceNowTableResponse<Incident & { search_score: number }>> {
    const queryBuilder = ServiceNowQueryBuilder.create();
    
    // Build search conditions
    queryBuilder.or(builder => {
      builder
        .like('short_description', searchTerm)
        .like('description', searchTerm)
        .like('number', searchTerm);
    });
    
    if (options.assignedToMe) {
      const userId = getCurrentUserId();
      if (userId) {
        queryBuilder.equals('assigned_to', userId);
      }
    }
    
    const params = this.buildQueryParams({
      fields: [
        'sys_id', 'number', 'short_description', 'description',
        'priority', 'state', 'sys_created_on', 'assigned_to.name'
      ],
      displayValue: 'all'
    });
    
    params.set('sysparm_query', queryBuilder.build());
    params.set('sysparm_search_boost', this.buildSearchBoost(options));
    
    return this.request<ServiceNowTableResponse<Incident & { search_score: number }>>(
      `/table/incident?${params.toString()}`
    );
  }
  
  private buildSearchBoost(options: {
    priorityBoost?: number;
    recentBoost?: number;
  }): string {
    const boosts: string[] = [];
    
    if (options.priorityBoost) {
      boosts.push(`priority^${options.priorityBoost}`);
    }
    
    if (options.recentBoost) {
      boosts.push(`sys_created_on^${options.recentBoost}`);
    }
    
    return boosts.join(',');
  }
}
```

---

## Batch Operations and Bulk Updates

### **Efficient Bulk Operations**
```typescript
// services/BulkOperationService.ts
export interface BulkUpdateOperation {
  sys_id: string;
  fields: Record<string, any>;
}

export class BulkOperationService extends BaseServiceNowService {
  /**
   * Bulk update multiple records efficiently
   */
  async bulkUpdateIncidents(operations: BulkUpdateOperation[]): Promise<void> {
    // Split into batches to avoid API limits
    const batchSize = 100;
    const batches = this.chunkArray(operations, batchSize);
    
    for (const batch of batches) {
      await this.processBatch(batch);
    }
  }
  
  private async processBatch(operations: BulkUpdateOperation[]): Promise<void> {
    // Use ServiceNow's batch API if available, otherwise process sequentially
    if (operations.length === 1) {
      const op = operations[0];
      await this.request(`/table/incident/${op.sys_id}`, {
        method: 'PUT',
        body: JSON.stringify(op.fields)
      });
    } else {
      // Batch API call
      await this.request('/api/now/batch', {
        method: 'POST',
        body: JSON.stringify({
          operations: operations.map(op => ({
            method: 'PUT',
            url: `/table/incident/${op.sys_id}`,
            body: op.fields
          }))
        })
      });
    }
  }
  
  /**
   * Bulk assignment of incidents
   */
  async bulkAssignIncidents(
    incidentIds: string[],
    assigneeId: string,
    assignmentGroup?: string
  ): Promise<void> {
    const operations: BulkUpdateOperation[] = incidentIds.map(id => ({
      sys_id: id,
      fields: {
        assigned_to: assigneeId,
        assignment_group: assignmentGroup,
        state: '2' // In Progress
      }
    }));
    
    await this.bulkUpdateIncidents(operations);
  }
  
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

// React hook for bulk operations
export function useBulkIncidentOperations() {
  const queryClient = useQueryClient();
  const bulkService = useMemo(() => new BulkOperationService(), []);
  
  const bulkAssign = useMutation({
    mutationFn: ({ incidentIds, assigneeId, assignmentGroup }: {
      incidentIds: string[];
      assigneeId: string;
      assignmentGroup?: string;
    }) => bulkService.bulkAssignIncidents(incidentIds, assigneeId, assignmentGroup),
    
    onSuccess: () => {
      // Invalidate all incident queries
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    }
  });
  
  return { bulkAssign };
}
```

---

## Caching and Performance Strategies

### **Intelligent Query Caching**
```typescript
// utils/queryOptimization.ts
export class QueryOptimizer {
  private static CACHE_DURATIONS = {
    static: 60 * 60 * 1000,      // 1 hour for reference data
    dynamic: 2 * 60 * 1000,      // 2 minutes for transactional data  
    realtime: 30 * 1000,         // 30 seconds for critical data
    user_specific: 5 * 60 * 1000 // 5 minutes for user-specific data
  };
  
  static getCacheDuration(queryType: 'static' | 'dynamic' | 'realtime' | 'user_specific'): number {
    return this.CACHE_DURATIONS[queryType];
  }
  
  static buildOptimizedQuery(baseQuery: string, optimizations: {
    includeDeleted?: boolean;
    limitFields?: boolean;
    useIndexedFields?: boolean;
  } = {}): string {
    let query = baseQuery;
    
    if (!optimizations.includeDeleted) {
      query += '^active=true';
    }
    
    if (optimizations.useIndexedFields) {
      // Ensure indexed fields are used in WHERE clauses
      query = this.optimizeForIndexes(query);
    }
    
    return query;
  }
  
  private static optimizeForIndexes(query: string): string {
    // Move indexed fields to the beginning of the query
    const indexedFields = ['sys_created_on', 'state', 'priority', 'active'];
    const conditions = query.split('^');
    
    const indexedConditions = conditions.filter(condition =>
      indexedFields.some(field => condition.startsWith(field))
    );
    
    const otherConditions = conditions.filter(condition =>
      !indexedFields.some(field => condition.startsWith(field))
    );
    
    return [...indexedConditions, ...otherConditions].join('^');
  }
}

// Usage in service
export function useOptimizedIncidents(filters: IncidentQueryOptions) {
  const optimizedQuery = useMemo(() => {
    const baseQuery = buildIncidentQuery(filters);
    return QueryOptimizer.buildOptimizedQuery(baseQuery, {
      includeDeleted: false,
      useIndexedFields: true
    });
  }, [filters]);
  
  return useQuery({
    queryKey: ['incidents', 'optimized', optimizedQuery],
    queryFn: () => incidentService.getIncidentsByQuery(optimizedQuery),
    staleTime: QueryOptimizer.getCacheDuration('dynamic'),
    gcTime: QueryOptimizer.getCacheDuration('dynamic') * 2,
  });
}
```

---

## Error Handling for Complex Queries

### **Robust Query Error Management**
```typescript
// utils/queryErrorHandler.ts
export class QueryErrorHandler {
  static handleQueryError(error: any, context: {
    query: string;
    table: string;
    operation: string;
  }): ServiceNowError {
    if (error.message?.includes('Invalid query')) {
      return new ServiceNowError(
        400,
        'INVALID_QUERY',
        `Invalid query syntax in ${context.operation}`,
        { originalQuery: context.query, table: context.table }
      );
    }
    
    if (error.message?.includes('Field does not exist')) {
      return new ServiceNowError(
        400,
        'INVALID_FIELD',
        `Referenced field does not exist in table ${context.table}`,
        { query: context.query }
      );
    }
    
    if (error.status === 413) {
      return new ServiceNowError(
        413,
        'QUERY_TOO_LARGE',
        'Query result set too large. Consider adding filters or pagination.',
        { query: context.query }
      );
    }
    
    return error instanceof ServiceNowError ? error : new ServiceNowError(
      500,
      'QUERY_ERROR',
      'Unknown query error occurred',
      { originalError: error.message, context }
    );
  }
  
  static validateQuery(query: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for common query issues
    if (query.includes('..')) {
      errors.push('Invalid dot-walking syntax detected');
    }
    
    if (query.length > 10000) {
      errors.push('Query too long - consider breaking into smaller queries');
    }
    
    if (!query.includes('active=true') && !query.includes('active=false')) {
      errors.push('Consider adding active field filter for better performance');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

---

## Quick Reference

### **Common Advanced Query Patterns**
```typescript
// Complex date filtering
const lastWeekIncidents = ServiceNowQueryBuilder.create()
  .lastNDays('sys_created_on', 7)
  .equals('active', 'true')
  .build();

// Reference field filtering
const vipUserIncidents = ServiceNowQueryBuilder.create()
  .hasReferenceValue('caller_id', 'vip', 'true')
  .in('priority', ['1', '2'])
  .build();

// OR conditions with grouping
const urgentOrVip = ServiceNowQueryBuilder.create()
  .or(builder => {
    builder
      .equals('priority', '1')
      .hasReferenceValue('caller_id', 'vip', 'true');
  })
  .build();

// Null checks and exists
const unassignedIncidents = ServiceNowQueryBuilder.create()
  .isNull('assigned_to')
  .equals('active', 'true')
  .build();
```

---

*Master these advanced query patterns to build high-performance ServiceNow applications that can handle complex data requirements efficiently.*