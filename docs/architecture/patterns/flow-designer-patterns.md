# Flow Designer Integration Patterns

**Purpose:** Best practices for integrating React applications with ServiceNow Flow Designer  
**Read time:** ~7 minutes  
**Prerequisites:** [ServiceNow Backend Principles](servicenow-backend-principles.md), [Service Layer](service-layer.md)

---

## Flow Designer Architecture

### **Flow Designer as Backend Logic Engine**
Flow Designer serves as the primary business logic layer, handling:
- **Multi-step processes** - Complex workflows with multiple decision points
- **Cross-table operations** - Updates across related records
- **Integration orchestration** - Calling multiple systems in sequence
- **Notification management** - Automated communications
- **Business rule execution** - Complex conditional logic
- **Data synchronization** - Keeping related records in sync

### **React + Flow Designer Integration Model**
```
React Frontend               ServiceNow Backend
├── User Interface          ├── Flow Designer (Business Logic)
├── State Management        ├── Decision Builder (Rules)
├── Service Layer          ├── Notification Engine (Communications)
├── API Calls              ├── Assignment Rules (Routing)
└── UI Updates             └── SLA Engine (Time Management)
```

---

## Flow Trigger Patterns

### **Pattern 1: Record-Based Triggers**
```tsx
// ✅ React creates/updates records, Flow Designer handles business logic
export class FlowTriggeredIncidentService extends TableService<Incident> {
  
  async createIncident(data: IncidentFormData): Promise<Incident> {
    // Simple record creation
    const incident = await this.createRecord({
      short_description: data.shortDescription,
      description: data.description,
      caller_id: data.callerId,
      category: data.category,
      urgency: data.urgency,
      impact: data.impact,
      // Flow Designer will populate priority, assignment_group, etc.
    });

    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "Incident Creation Handler"
    
    Trigger: Record Created
    Table: incident
    
    Flow Actions:
    1. Calculate Priority
       - Use Decision Builder "Priority Matrix"
       - Input: urgency, impact, category, caller VIP status
       - Update incident.priority
    
    2. Determine Assignment
       - Use Decision Builder "Assignment Rules"  
       - Input: category, priority, caller location, time of day
       - Update incident.assignment_group, incident.assigned_to
    
    3. Send Notifications
       - Caller confirmation email
       - Assignment group notification
       - If P1, notify duty manager
    
    4. Activate SLA
       - Based on priority and category
       - Set appropriate breach times
    
    5. Create Work Notes
       - Log incident creation details
       - Record auto-assignment reason
    
    Expected Flow Name: "Incident Creation Handler"
    Expected Flow Scope: x_your_scope
    */

    return incident;
  }

  async updateIncidentStatus(incidentId: string, newState: string, resolution?: string): Promise<Incident> {
    // Trigger state change flow
    const updateData: Partial<Incident> = {
      state: { value: newState } as ServiceNowChoice
    };

    if (resolution && newState === 'resolved') {
      updateData.close_notes = resolution;
      updateData.resolved_at = new Date().toISOString();
    }

    const incident = await this.updateRecord(incidentId, updateData);

    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "Incident State Change Handler"
    
    Trigger: Record Updated
    Table: incident
    Condition: state changes
    
    Flow Logic:
    If state = "assigned":
      - Send assignment notification to assigned user
      - Log assignment work notes
      - Start SLA timer if not already started
    
    If state = "in_progress":  
      - Notify caller that work has begun
      - Update work start timestamp
      - Log progress work notes
    
    If state = "resolved":
      - Send resolution notification to caller
      - Stop SLA timer
      - Create satisfaction survey record
      - Update resolution metrics
      - If related change exists, update change status
    
    If state = "closed":
      - Final closure notifications
      - Archive related documents
      - Update closure metrics
      - Trigger satisfaction survey if not already sent
    
    Expected Flow Name: "Incident State Change Handler"
    Expected Flow Scope: x_your_scope
    */

    return incident;
  }

  async assignIncident(incidentId: string, assigneeId: string, assignmentReason: string): Promise<Incident> {
    // Trigger assignment flow through field update
    const incident = await this.updateRecord(incidentId, {
      assigned_to: { value: assigneeId } as ServiceNowReference,
      assignment_reason: assignmentReason,
      state: { value: 'assigned' } as ServiceNowChoice
    });

    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "Incident Assignment Handler"
    
    Trigger: Record Updated  
    Table: incident
    Condition: assigned_to changes OR assignment_group changes
    
    Flow Actions:
    1. Validate Assignment
       - Check if assignee is in assignment group
       - Verify assignee has necessary skills/permissions
       - If invalid, reassign to group manager
    
    2. Send Notifications
       - Notify new assignee
       - Notify previous assignee if reassignment
       - Notify caller of assignment
    
    3. Update Work Notes
       - Log assignment details
       - Record assignment reason
       - Note skill/workload factors
    
    4. SLA Management
       - Adjust SLA if assignment group changed
       - Reset response time SLA
       - Update escalation timers
    
    Expected Flow Name: "Incident Assignment Handler"
    Expected Flow Scope: x_your_scope
    */

    return incident;
  }
}
```

### **Pattern 2: REST-Triggered Flows**
```tsx
// ✅ Use REST-triggered flows for complex operations
export class FlowRESTService extends ServiceNowService {

  async processBulkIncidentUpdate(updates: BulkIncidentUpdate[]): Promise<BulkOperationResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "Bulk Incident Update Processor"
    
    Flow Type: REST Endpoint
    REST Path: /api/{scope}/bulk_incident_update
    Method: POST
    
    Input Schema:
    {
      "updates": [
        {
          "incident_id": "string",
          "action": "assign|escalate|resolve|close",
          "data": {
            "assigned_to": "string",
            "resolution": "string",
            "escalation_reason": "string"
          }
        }
      ]
    }
    
    Flow Logic:
    1. Validate Input
       - Check incident IDs exist
       - Validate user permissions for each action
       - Verify required fields for each action type
    
    2. Process Each Update
       - Loop through updates array
       - For each update:
         a. Get incident record
         b. Perform action based on type
         c. Trigger appropriate subflow (assignment, escalation, etc.)
         d. Log results
    
    3. Return Summary
       - Count successful updates
       - List failed updates with reasons  
       - Provide operation summary
    
    Output Schema:
    {
      "success_count": number,
      "failed_count": number,
      "results": [
        {
          "incident_id": "string",
          "status": "success|failed",
          "message": "string"
        }
      ]
    }
    
    Expected Flow Name: "Bulk Incident Update Processor"
    Expected REST Endpoint: /api/x_your_scope/bulk_incident_update
    */

    const response = await this.request<BulkOperationResult>(
      '/api/x_your_scope/bulk_incident_update',
      {
        method: 'POST',
        body: JSON.stringify({ updates })
      }
    );

    return response;
  }

  async generateIncidentAnalytics(filters: AnalyticsFilters): Promise<AnalyticsData> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "Incident Analytics Generator"
    
    Flow Type: REST Endpoint
    REST Path: /api/{scope}/incident_analytics
    Method: POST
    
    Input Schema:
    {
      "date_range": {
        "start": "ISO date string",
        "end": "ISO date string"
      },
      "filters": {
        "priority": ["1", "2", "3", "4"],
        "state": ["new", "assigned", "resolved"],
        "category": ["hardware", "software"],
        "assignment_group": ["group_ids"]
      },
      "metrics": ["count", "avg_resolution_time", "sla_performance"]
    }
    
    Flow Logic:
    1. Build Dynamic Query
       - Construct incident query based on filters
       - Apply date range constraints
       - Handle multiple filter combinations
    
    2. Calculate Metrics
       - Count incidents by various dimensions
       - Calculate average resolution times
       - Compute SLA performance percentages
       - Generate trend data
    
    3. Format Results
       - Structure data for charting
       - Calculate percentages and ratios
       - Generate summary statistics
    
    4. Performance Optimization
       - Use aggregate tables where possible
       - Cache results for common queries
       - Implement query limits
    
    Output Schema:
    {
      "summary": {
        "total_incidents": number,
        "avg_resolution_hours": number,
        "sla_performance_percent": number
      },
      "trends": [
        {
          "date": "string",
          "count": number,
          "avg_resolution": number
        }
      ],
      "breakdown": {
        "by_priority": [{"priority": "1", "count": 50}],
        "by_category": [{"category": "hardware", "count": 30}]
      }
    }
    
    Expected Flow Name: "Incident Analytics Generator"
    Expected REST Endpoint: /api/x_your_scope/incident_analytics
    */

    const response = await this.request<AnalyticsData>(
      '/api/x_your_scope/incident_analytics',
      {
        method: 'POST',
        body: JSON.stringify(filters)
      }
    );

    return response;
  }

  async executeIncidentWorkflow(incidentId: string, workflowAction: WorkflowAction): Promise<WorkflowResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "Incident Workflow Executor"
    
    Flow Type: REST Endpoint
    REST Path: /api/{scope}/execute_incident_workflow
    Method: POST
    
    Input Schema:
    {
      "incident_id": "string",
      "action": {
        "type": "escalate|approve|reject|transfer|merge",
        "data": {
          "escalation_level": number,
          "approval_reason": "string",
          "transfer_to_group": "string",
          "merge_with_incident": "string"
        },
        "comments": "string"
      }
    }
    
    Flow Logic:
    1. Validate Action
       - Check incident exists and is in valid state
       - Verify user has permission for action
       - Validate action-specific requirements
    
    2. Execute Workflow Step
       Switch on action.type:
       
       "escalate":
         - Update priority/urgency
         - Reassign to escalation group
         - Notify management
         - Update SLA targets
         - Create escalation work notes
       
       "approve":
         - Update approval status
         - Proceed to next workflow step
         - Send approval notifications
         - Log approval decision
       
       "transfer":
         - Change assignment group
         - Send transfer notifications
         - Update work notes with transfer reason
         - Adjust SLA as needed
       
       "merge":
         - Link incidents
         - Update related incident
         - Notify affected parties
         - Consolidate work notes
    
    3. Update Audit Trail
       - Log all workflow actions
       - Record decision rationale
       - Track approval chain
    
    Output Schema:
    {
      "status": "success|failed",
      "message": "string",
      "workflow_state": "string",
      "next_actions": ["array of possible next actions"]
    }
    
    Expected Flow Name: "Incident Workflow Executor"
    Expected REST Endpoint: /api/x_your_scope/execute_incident_workflow
    */

    const response = await this.request<WorkflowResult>(
      '/api/x_your_scope/execute_incident_workflow',
      {
        method: 'POST',
        body: JSON.stringify({
          incident_id: incidentId,
          action: workflowAction
        })
      }
    );

    return response;
  }
}
```

---

## Subflow Patterns

### **Pattern 3: Reusable Subflows**
```tsx
// ✅ Design services to leverage reusable subflows
export class SubflowIntegratedService extends ServiceNowService {

  async sendNotificationWithEscalation(
    recipientId: string, 
    message: string, 
    priority: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<NotificationResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Subflow: "Smart Notification Sender"
    
    Subflow Inputs:
    - recipient_id (string)
    - message (string)  
    - priority (choice: low, medium, high, critical)
    - escalation_enabled (boolean, default: true)
    
    Subflow Logic:
    1. Get Recipient Preferences
       - Check notification preferences table
       - Determine preferred channels (email, SMS, push)
       - Get escalation contacts
    
    2. Send Initial Notification
       - Send via preferred channel
       - Log notification attempt
       - Set delivery confirmation flag
    
    3. Handle Escalation (if enabled)
       - If priority = critical, also notify manager
       - If no response in X minutes, escalate
       - Track escalation chain
    
    4. Return Status
       - Delivery confirmation
       - Escalation actions taken
       - Next escalation scheduled
    
    Subflow Outputs:
    - notification_sent (boolean)
    - delivery_status (string)
    - escalation_triggered (boolean)  
    - next_escalation_time (datetime)
    
    Expected Subflow Name: "Smart Notification Sender"
    Expected Scope: x_your_scope
    */

    // This would be called by other flows, not directly via REST
    // But React can trigger flows that use this subflow
    const response = await this.request<NotificationResult>(
      '/api/x_your_scope/send_smart_notification',
      {
        method: 'POST',
        body: JSON.stringify({
          recipient_id: recipientId,
          message,
          priority,
          escalation_enabled: true
        })
      }
    );

    return response;
  }

  async updateRelatedRecords(primaryRecordId: string, updates: RelatedRecordUpdate[]): Promise<UpdateResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Subflow: "Related Records Updater"
    
    Subflow Inputs:
    - primary_record_id (string)
    - updates (array of update objects)
    
    Update Object Schema:
    {
      "table": "string",
      "filter": "string", // encoded query to find related records
      "updates": {
        "field_name": "new_value"
      }
    }
    
    Subflow Logic:
    1. Validate Primary Record
       - Ensure primary record exists
       - Check user permissions
    
    2. Process Each Update
       - Find related records using filter
       - Validate each record before update
       - Apply updates in batch where possible
       - Handle errors gracefully
    
    3. Maintain Referential Integrity
       - Check for circular references
       - Validate foreign key constraints
       - Handle cascade requirements
    
    4. Log All Changes  
       - Create audit trail
       - Link changes to primary record
       - Track success/failure rates
    
    Common Usage Patterns:
    - Update all child incidents when parent changes
    - Sync configuration items when incident resolves
    - Update related change requests
    - Cascade assignment group changes
    
    Expected Subflow Name: "Related Records Updater"
    Expected Scope: x_your_scope
    */

    const response = await this.request<UpdateResult>(
      '/api/x_your_scope/update_related_records',
      {
        method: 'POST', 
        body: JSON.stringify({
          primary_record_id: primaryRecordId,
          updates
        })
      }
    );

    return response;
  }
}
```

---

## Flow Error Handling

### **Pattern 4: Error Handling Integration**
```tsx
// ✅ Handle Flow Designer errors gracefully in React
export class FlowErrorHandlingService extends ServiceNowService {

  async executeFlowWithRetry<T>(
    flowEndpoint: string, 
    data: any, 
    maxRetries: number = 3
  ): Promise<T> {
    /*
    SERVICENOW DEVELOPER TODO:
    Implement Error Handling in All Flows:
    
    Standard Error Handling Pattern:
    1. Input Validation Errors
       - Return HTTP 400 with specific field errors
       - Include field names and validation messages
       - Use consistent error response format
    
    2. Permission Errors
       - Return HTTP 403 with clear permission requirements
       - Log access attempts for security audit
       - Provide helpful error messages
    
    3. Business Logic Errors
       - Return HTTP 422 with business rule violations
       - Include context about why operation failed
       - Suggest corrective actions where possible
    
    4. System Errors
       - Return HTTP 500 for unexpected errors
       - Log full error details for debugging
       - Provide user-friendly error messages
       - Include correlation ID for support
    
    5. Timeout Errors
       - Return HTTP 408 for long-running operations
       - Provide status check endpoint if applicable
       - Include estimated completion time
    
    Error Response Format:
    {
      "error": {
        "code": "string",
        "message": "string", 
        "details": "string",
        "field_errors": {
          "field_name": "error_message"
        },
        "correlation_id": "string"
      }
    }
    
    All flows should use consistent error handling subflow
    */

    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.request<T>(flowEndpoint, {
          method: 'POST',
          body: JSON.stringify(data)
        });
        
        return response;
        
      } catch (error) {
        lastError = error;
        
        // Don't retry certain error types
        if (error.status === 400 || error.status === 403 || error.status === 422) {
          throw error;
        }
        
        // Only retry on server errors or timeouts
        if (attempt < maxRetries && (error.status >= 500 || error.status === 408)) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
          continue;
        }
        
        throw error;
      }
    }
    
    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// React error handling for flow operations
export const useFlowOperation = <T>(flowEndpoint: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FlowError | null>(null);

  const execute = useCallback(async (data: any): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await flowService.executeFlowWithRetry<T>(flowEndpoint, data);
      return result;
    } catch (err) {
      const flowError: FlowError = {
        message: err.message,
        code: err.status,
        details: err.detail,
        fieldErrors: err.field_errors,
        correlationId: err.correlation_id,
        retryable: err.status >= 500 || err.status === 408
      };
      
      setError(flowError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [flowEndpoint]);

  const retry = useCallback(() => {
    if (error?.retryable) {
      // Re-execute with last used data
      // This would need to be tracked separately
    }
  }, [error]);

  return { execute, loading, error, retry };
};
```

---

## Flow Testing Patterns

### **Pattern 5: Flow Integration Testing**
```tsx
// ✅ Test React + Flow Designer integration
describe('Flow Designer Integration', () => {
  beforeEach(() => {
    // Mock Flow Designer REST endpoints
    global.fetch = jest.fn();
  });

  it('handles incident creation flow integration', async () => {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Test Data for Flow Testing:
    
    Test Flow: "Incident Creation Handler - Test Version"
    - Use test assignment groups
    - Send notifications to test users only
    - Use shortened SLA times for testing
    - Log all actions for verification
    
    Test Decision Tables:
    - Priority Matrix with known test cases
    - Assignment Rules with predictable outputs
    - Use test data that covers edge cases
    
    Test Notifications:
    - Configure test notification settings
    - Use test email addresses
    - Capture notification content for verification
    */

    const mockFlowResponse = {
      result: {
        incident_id: 'INC0000123',
        priority: '2',
        assignment_group: 'Test Hardware Support',
        notifications_sent: ['caller', 'assignment_group'],
        sla_activated: true
      }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFlowResponse)
    });

    const incidentService = new FlowTriggeredIncidentService();
    const result = await incidentService.createIncident({
      shortDescription: 'Test incident',
      urgency: 'high',
      impact: 'medium',
      category: 'hardware',
      callerId: 'test_user_123'
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/now/table/incident'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('short_description')
      })
    );

    // Verify flow would have been triggered
    expect(result.sys_id).toBe('INC0000123');
  });

  it('handles flow errors gracefully', async () => {
    const mockErrorResponse = {
      error: {
        code: 'FLOW_VALIDATION_ERROR',
        message: 'Assignment group not found',
        details: 'The specified assignment group does not exist or is inactive',
        field_errors: {
          assignment_group: 'Invalid assignment group'
        },
        correlation_id: 'test-correlation-123'
      }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve(mockErrorResponse)
    });

    const { execute, error } = useFlowOperation('/api/x_test/test_flow');
    
    await execute({ test: 'data' });

    expect(error).toMatchObject({
      message: 'Assignment group not found',
      code: 422,
      fieldErrors: {
        assignment_group: 'Invalid assignment group'
      }
    });
  });
});
```

---

## Performance Optimization

### **Pattern 6: Flow Performance Best Practices**
```tsx
// ✅ Optimize React + Flow Designer performance
export class OptimizedFlowService extends ServiceNowService {

  // Batch operations to reduce flow executions
  async batchProcessRecords(records: any[], batchSize: number = 10): Promise<BatchResult[]> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "Batch Record Processor"
    
    Performance Optimizations:
    1. Batch Processing
       - Process up to 100 records per flow execution
       - Use For Each loops with batch commits
       - Implement checkpoint/restart for large batches
    
    2. Database Optimization
       - Use efficient queries in flows
       - Minimize database round trips
       - Use batch table operations where possible
       - Index fields used in flow conditions
    
    3. Notification Optimization
       - Batch notifications where possible
       - Use digest emails for multiple updates
       - Avoid real-time notifications for bulk operations
    
    4. Subflow Optimization
       - Cache frequently accessed data
       - Use lightweight subflows for simple operations
       - Avoid deep subflow nesting (max 3 levels)
    
    5. Error Handling
       - Fail gracefully on individual record errors
       - Continue processing remaining records
       - Provide detailed error reporting
    
    Expected Flow Name: "Batch Record Processor"
    Expected Performance: <5 seconds for 100 records
    */

    const batches = this.chunkArray(records, batchSize);
    const results: BatchResult[] = [];
    
    for (const batch of batches) {
      const batchResult = await this.request<BatchResult>(
        '/api/x_your_scope/batch_process_records',
        {
          method: 'POST',
          body: JSON.stringify({ records: batch })
        }
      );
      
      results.push(batchResult);
      
      // Small delay between batches to prevent overwhelming the system
      if (batches.length > 1) {
        await this.delay(100);
      }
    }
    
    return results;
  }

  // Cache flow results for expensive operations
  private flowCache = new Map<string, { data: any; timestamp: number }>();
  
  async executeFlowWithCache<T>(
    flowEndpoint: string, 
    data: any, 
    cacheTTL: number = 300000 // 5 minutes
  ): Promise<T> {
    const cacheKey = `${flowEndpoint}_${JSON.stringify(data)}`;
    const cached = this.flowCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cacheTTL) {
      return cached.data;
    }
    
    const result = await this.request<T>(flowEndpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    this.flowCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
```

---

## Best Practices

### **✅ Flow Designer Integration Best Practices**
- **Use record triggers** for automatic business logic execution
- **Design REST flows** for complex operations that need immediate response
- **Create reusable subflows** for common operations
- **Implement consistent error handling** across all flows
- **Optimize for performance** with batching and caching
- **Test flows thoroughly** with realistic data volumes
- **Document flow requirements** clearly in service code

### **✅ React Integration Patterns**
- **Simple service calls** - Let flows handle complexity
- **Proper error handling** - Handle flow-specific error patterns
- **Loading states** - Show progress for long-running flows
- **Optimistic updates** - Update UI before flow completes where appropriate
- **Batch operations** - Group related operations for efficiency

### **❌ Avoid These Anti-Patterns**
- Writing complex business logic in React instead of flows
- Creating custom REST APIs when REST-triggered flows work
- Ignoring flow error responses in React components
- Not handling flow timeouts and retries
- Bypassing flows for operations they should handle
- Creating flows that duplicate existing ServiceNow functionality

---

## Next Steps

**Related patterns:**
- [ServiceNow Backend Principles](servicenow-backend-principles.md) - Overall configuration-first approach
- [Decision Builder Integration](decision-builder-integration.md) - Rules engine integration
- [Service Layer](service-layer.md) - How services integrate with flows
- [Testing Strategy](testing-strategy.md) - Testing flow integrations

**Implementation guides:**
- [Configuration Management](configuration-management.md) - Managing flow configurations
- [Performance Optimization](performance-optimization.md) - Optimizing flow performance

---

*Flow Designer serves as your primary business logic engine. Design React services to trigger and consume flows rather than implementing business logic directly in code.*