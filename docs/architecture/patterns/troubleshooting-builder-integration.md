# Troubleshooting Builder Integration

**Purpose:** Common issues and solutions for ServiceNow builder integration problems  
**Read time:** ~4 minutes  
**Prerequisites:** [ServiceNow Backend Principles](servicenow-backend-principles.md), [ServiceNow Anti-Patterns](servicenow-anti-patterns.md)

---

## Common Integration Issues

### **Issue 1: Flow Designer Not Triggering**

**Symptoms:**
- Flow Designer flows not executing when expected
- Record operations don't trigger flows
- Missing flow execution logs

**Common Causes & Solutions:**

```tsx
// ❌ Problem: Incorrect trigger conditions
/*
Flow Trigger Issue:
- Trigger condition too restrictive
- Field conditions don't match actual data
- User lacks execute permissions
- Flow is inactive or has errors
*/

// ✅ Solution: Debug flow triggers systematically
export class FlowDebuggingService extends ServiceNowService {
  
  async debugFlowTrigger(flowId: string, recordId: string): Promise<FlowDebugInfo> {
    /*
    SERVICENOW DEVELOPER TODO:
    Flow Troubleshooting Checklist:
    
    1. Verify Flow Status
       - Check flow is active (sys_hub_flow.active = true)
       - Verify flow has no validation errors
       - Confirm flow version is published
    
    2. Check Trigger Conditions
       - Review trigger table and conditions
       - Test conditions with actual record data
       - Verify field references are correct
       - Check for typos in field names
    
    3. Validate Permissions
       - Confirm flow execution user has proper permissions
       - Check table access (read/write permissions)
       - Verify role requirements for flow execution
    
    4. Review Flow Logs
       - Check sys_flow_context for execution records
       - Review sys_flow_context_step for step details
       - Look for error messages in logs
    
    5. Test with Simple Record
       - Create minimal test record
       - Verify trigger conditions are met
       - Check if flow executes with test data
    
    Common Issues:
    - Condition uses "=" instead of "equals"
    - Field reference typos (e.g., "urgency" vs "urgency.value")
    - User context lacks permissions
    - Flow disabled due to errors
    
    Debugging Flow: "Flow Trigger Debugger"
    Purpose: Helps diagnose why flows aren't triggering
    */

    const debugInfo = await this.request<FlowDebugInfo>(
      '/api/x_your_scope/debug_flow_trigger',
      {
        method: 'POST',
        body: JSON.stringify({
          flow_id: flowId,
          record_id: recordId
        })
      }
    );

    return debugInfo;
  }
}

// React component for flow debugging
interface FlowDebuggerProps {
  flowId: string;
  recordId: string;
}

function FlowDebugger({ flowId, recordId }: FlowDebuggerProps) {
  const { data: debugInfo } = useQuery(
    ['flow-debug', flowId, recordId],
    () => flowDebuggingService.debugFlowTrigger(flowId, recordId)
  );

  return (
    <div className="flow-debugger">
      <h3>Flow Trigger Debug Information</h3>
      
      <div className="debug-sections">
        <DebugSection title="Flow Status" status={debugInfo?.flow_status} />
        <DebugSection title="Trigger Conditions" status={debugInfo?.trigger_conditions} />
        <DebugSection title="User Permissions" status={debugInfo?.user_permissions} />
        <DebugSection title="Execution Logs" logs={debugInfo?.execution_logs} />
      </div>

      {debugInfo?.recommendations && (
        <div className="debug-recommendations">
          <h4>Recommendations</h4>
          <ul>
            {debugInfo.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

---

### **Issue 2: Decision Builder Rules Not Working**

**Symptoms:**
- Decision tables return unexpected results
- Rules not matching expected conditions
- Default values not applying correctly

**Common Causes & Solutions:**

```tsx
// ❌ Problem: Decision table configuration issues
/*
Decision Builder Issues:
- Input conditions don't match actual data types
- Rule order causes wrong rule to match first
- Missing default rules for unmatched conditions
- Data type mismatches (string vs choice vs boolean)
*/

// ✅ Solution: Decision table validation and testing
export class DecisionBuilderDebuggingService extends ServiceNowService {
  
  async testDecisionTable(tableId: string, testInputs: any): Promise<DecisionTestResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Decision Builder Troubleshooting:
    
    1. Validate Input Data Types
       - Ensure input data matches table column types
       - Check choice values match exactly (case-sensitive)
       - Verify boolean values are true/false, not "true"/"false"
    
    2. Test Rule Matching
       - Use Decision Builder test feature
       - Test with known good data
       - Verify rule order is correct (most specific first)
    
    3. Check Default Behavior
       - Ensure default rule exists for unmatched cases
       - Test with edge case data
       - Verify error handling for invalid inputs
    
    4. Data Transformation Issues
       - Check if data needs transformation before evaluation
       - Verify field references are correct
       - Handle null/empty values appropriately
    
    5. Performance Considerations
       - Large decision tables may timeout
       - Consider splitting complex tables
       - Monitor execution performance
    
    Common Issues:
    - Input "1" (string) vs 1 (integer) mismatch
    - Choice value "high" vs display value "High"
    - Missing null value handling
    - Rule order causes early exit with wrong rule
    
    Test Flow: "Decision Table Tester"
    Purpose: Validate decision table logic with test data
    */

    const testResult = await this.request<DecisionTestResult>(
      '/api/x_your_scope/test_decision_table',
      {
        method: 'POST',
        body: JSON.stringify({
          table_id: tableId,
          test_inputs: testInputs
        })
      }
    );

    return testResult;
  }

  async validateDecisionTableData(tableId: string): Promise<ValidationResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Decision Table Validator:
    
    Validation Checks:
    1. Data Consistency
       - All required columns have values
       - Data types match column definitions
       - Choice values are valid
    
    2. Rule Coverage
       - Check for overlapping rules
       - Identify gaps in rule coverage
       - Validate rule precedence
    
    3. Performance Analysis
       - Identify inefficient rule structures
       - Check for unnecessary complexity
       - Recommend optimization opportunities
    
    4. Best Practices Compliance
       - Naming conventions
       - Documentation completeness
       - Maintainability factors
    
    Validation Flow: "Decision Table Validator"
    Purpose: Comprehensive decision table health check
    */

    const validation = await this.request<ValidationResult>(
      '/api/x_your_scope/validate_decision_table',
      {
        method: 'POST',
        body: JSON.stringify({ table_id: tableId })
      }
    );

    return validation;
  }
}
```

---

### **Issue 3: Assignment Rules Not Working**

**Symptoms:**
- Records not getting assigned automatically
- Wrong assignments being made
- Assignment rules not executing in order

**Common Causes & Solutions:**

```tsx
// ❌ Problem: Assignment rule configuration issues
/*
Assignment Rule Issues:
- Rule conditions not matching record data
- Rule order incorrect (wrong priority)
- Assignment targets don't exist or are inactive
- User lacks assignment permissions
*/

// ✅ Solution: Assignment rule troubleshooting
export class AssignmentRuleDebuggingService extends ServiceNowService {
  
  async debugAssignmentRules(recordId: string): Promise<AssignmentDebugResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Assignment Rules Troubleshooting:
    
    1. Check Rule Evaluation
       - Verify rules are active
       - Check rule conditions match record data
       - Validate rule order (lower order = higher priority)
    
    2. Validate Assignment Targets
       - Confirm assignment groups exist and are active
       - Check user assignments are valid
       - Verify assignment targets have proper permissions
    
    3. Check Rule Execution Context
       - Verify user has permission to assign
       - Check if assignment is happening in correct context
       - Validate role requirements
    
    4. Test Assignment Logic
       - Use assignment rule debug tools
       - Test with known good data
       - Verify assignment flow execution
    
    5. Check Integration Points
       - Verify Flow Designer integration works
       - Check notification integrations
       - Validate work notes and audit trails
    
    Common Issues:
    - Inactive assignment group selected
    - Rule condition typos or wrong operators
    - Assignment happens before record fully created
    - Circular assignment rule dependencies
    
    Debug Flow: "Assignment Rule Debugger"
    Purpose: Diagnose assignment rule execution issues
    */

    const debugResult = await this.request<AssignmentDebugResult>(
      '/api/x_your_scope/debug_assignment_rules',
      {
        method: 'POST',
        body: JSON.stringify({ record_id: recordId })
      }
    );

    return debugResult;
  }

  async testAssignmentRule(ruleId: string, testRecord: any): Promise<AssignmentTestResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Assignment Rule Tester:
    
    Test Process:
    1. Create test record with specified data
    2. Execute assignment rule evaluation
    3. Check which rules matched
    4. Verify assignment result
    5. Clean up test data
    
    Test Results:
    - Rules that matched conditions
    - Final assignment result
    - Assignment reasoning
    - Any errors or warnings
    
    Test Flow: "Assignment Rule Tester"
    Purpose: Validate assignment rule logic
    */

    const testResult = await this.request<AssignmentTestResult>(
      '/api/x_your_scope/test_assignment_rule',
      {
        method: 'POST',
        body: JSON.stringify({
          rule_id: ruleId,
          test_record: testRecord
        })
      }
    );

    return testResult;
  }
}
```

---

### **Issue 4: SLA Engine Problems**

**Symptoms:**
- SLAs not activating automatically
- Incorrect SLA calculations
- SLA breach notifications not working

**Common Causes & Solutions:**

```tsx
// ❌ Problem: SLA configuration issues
/*
SLA Engine Issues:
- SLA conditions don't match record criteria
- Business hours not configured correctly
- SLA definitions inactive or have errors
- Milestone configuration problems
*/

// ✅ Solution: SLA troubleshooting and validation
export class SLADebuggingService extends ServiceNowService {
  
  async debugSLAActivation(recordId: string): Promise<SLADebugResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    SLA Engine Troubleshooting:
    
    1. Check SLA Definition Status
       - Verify SLA definition is active
       - Check condition logic matches record
       - Validate business hours configuration
    
    2. Validate SLA Activation
       - Check if record meets SLA conditions
       - Verify no conflicting SLA definitions
       - Confirm SLA table permissions
    
    3. Check Business Hours
       - Validate business hours schedule exists
       - Check timezone configuration
       - Verify holiday schedule if applicable
    
    4. Milestone Configuration
       - Check milestone definitions are correct
       - Verify milestone conditions and timing
       - Validate escalation configurations
    
    5. Integration Points
       - Check Flow Designer SLA integrations
       - Verify notification configurations
       - Validate assignment integrations
    
    Common Issues:
    - SLA condition uses wrong field references
    - Business hours schedule not found
    - Timezone mismatches causing calculation errors
    - Multiple SLA definitions conflicting
    
    Debug Flow: "SLA Activation Debugger"
    Purpose: Diagnose SLA activation and calculation issues
    */

    const debugResult = await this.request<SLADebugResult>(
      '/api/x_your_scope/debug_sla_activation',
      {
        method: 'POST',
        body: JSON.stringify({ record_id: recordId })
      }
    );

    return debugResult;
  }

  async validateSLACalculations(slaId: string): Promise<SLAValidationResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    SLA Calculation Validator:
    
    Validation Process:
    1. Check calculation accuracy
    2. Verify business hours application
    3. Validate milestone timing
    4. Check escalation timing
    5. Verify breach calculations
    
    Common Calculation Issues:
    - Business hours not applied correctly
    - Timezone conversions incorrect
    - Milestone timing overlaps
    - Pause/resume logic errors
    
    Validation Flow: "SLA Calculation Validator"
    Purpose: Ensure SLA calculations are accurate
    */

    const validation = await this.request<SLAValidationResult>(
      '/api/x_your_scope/validate_sla_calculations',
      {
        method: 'POST',
        body: JSON.stringify({ sla_id: slaId })
      }
    );

    return validation;
  }
}
```

---

### **Issue 5: React + ServiceNow Integration Problems**

**Symptoms:**
- React components not reflecting ServiceNow data changes
- API calls failing or returning unexpected data
- Authentication or permission errors

**Common Causes & Solutions:**

```tsx
// ❌ Problem: Integration and synchronization issues
/*
React Integration Issues:
- Stale data in React components
- API authentication problems
- Incorrect API endpoints or parameters
- Data format mismatches between React and ServiceNow
*/

// ✅ Solution: Integration debugging and monitoring
export class ReactServiceNowIntegrationDebugging {
  
  // Debug API integration issues
  async debugAPIIntegration(endpoint: string, requestData: any): Promise<APIDebugResult> {
    /*
    Integration Debugging Steps:
    
    1. Check API Endpoint
       - Verify endpoint URL is correct
       - Check HTTP method (GET, POST, PUT, DELETE)
       - Validate API version compatibility
    
    2. Authentication Validation
       - Check g_ck token validity
       - Verify user permissions for API call
       - Check session expiry
    
    3. Request/Response Analysis
       - Log request headers and body
       - Check response status codes
       - Validate response data format
    
    4. Data Synchronization
       - Check if React state updates after API calls
       - Verify TanStack Query cache invalidation
       - Check for race conditions in data updates
    
    5. Error Handling
       - Check error response handling
       - Verify user feedback on errors
       - Check retry logic for failed requests
    */

    console.group(`🔍 API Debug: ${endpoint}`);
    
    try {
      const startTime = performance.now();
      
      // Log request details
      console.log('📤 Request:', {
        endpoint,
        data: requestData,
        headers: this.getRequestHeaders()
      });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getRequestHeaders(),
        body: JSON.stringify(requestData)
      });
      
      const responseData = await response.json();
      const endTime = performance.now();
      
      // Log response details
      console.log('📥 Response:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        duration: `${(endTime - startTime).toFixed(2)}ms`
      });
      
      if (!response.ok) {
        console.error('❌ API Error:', responseData);
        return {
          success: false,
          error: responseData,
          suggestions: this.getErrorSuggestions(response.status, responseData)
        };
      }
      
      console.log('✅ API Success');
      return {
        success: true,
        data: responseData,
        performance: {
          duration: endTime - startTime,
          endpoint
        }
      };
      
    } catch (error) {
      console.error('💥 Network Error:', error);
      return {
        success: false,
        error: error.message,
        suggestions: [
          'Check network connectivity',
          'Verify ServiceNow instance is running',
          'Check CORS configuration',
          'Validate authentication token'
        ]
      };
    } finally {
      console.groupEnd();
    }
  }

  private getErrorSuggestions(status: number, errorData: any): string[] {
    const suggestions: string[] = [];
    
    switch (status) {
      case 401:
        suggestions.push(
          'Check authentication token (g_ck)',
          'Verify user session is active',
          'Check user permissions for the API'
        );
        break;
      case 403:
        suggestions.push(
          'Verify user has required roles',
          'Check table/field ACLs',
          'Validate API access permissions'
        );
        break;
      case 404:
        suggestions.push(
          'Check API endpoint URL',
          'Verify record exists',
          'Check table name spelling'
        );
        break;
      case 422:
        suggestions.push(
          'Check request data format',
          'Verify required fields are provided',
          'Check field validation rules'
        );
        break;
      case 500:
        suggestions.push(
          'Check ServiceNow logs for server errors',
          'Verify Flow Designer flows are working',
          'Check Decision Builder tables'
        );
        break;
      default:
        suggestions.push('Check ServiceNow documentation for error details');
    }
    
    return suggestions;
  }

  private getRequestHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-UserToken': this.getCurrentUserToken(),
      // Add other required headers
    };
  }

  private getCurrentUserToken(): string {
    // Get current g_ck token from ServiceNow
    return (window as any).g_ck || '';
  }
}

// React hook for integration debugging
export const useIntegrationDebugger = () => {
  const debugger = new ReactServiceNowIntegrationDebugging();
  
  const debugAPI = useCallback(async (endpoint: string, data: any) => {
    return await debugger.debugAPIIntegration(endpoint, data);
  }, []);
  
  return { debugAPI };
};

// React component for integration monitoring
function IntegrationMonitor() {
  const [debugResults, setDebugResults] = useState<APIDebugResult[]>([]);
  const { debugAPI } = useIntegrationDebugger();
  
  const handleDebugAPI = async (endpoint: string, data: any) => {
    const result = await debugAPI(endpoint, data);
    setDebugResults(prev => [...prev, result]);
  };
  
  return (
    <div className="integration-monitor">
      <h3>ServiceNow Integration Monitor</h3>
      
      <div className="debug-results">
        {debugResults.map((result, index) => (
          <div key={index} className={`debug-result ${result.success ? 'success' : 'error'}`}>
            <div className="result-header">
              <span className="status">{result.success ? '✅' : '❌'}</span>
              <span className="endpoint">{result.performance?.endpoint}</span>
              {result.performance && (
                <span className="duration">{result.performance.duration.toFixed(2)}ms</span>
              )}
            </div>
            
            {!result.success && result.suggestions && (
              <div className="suggestions">
                <h4>Suggestions:</h4>
                <ul>
                  {result.suggestions.map((suggestion, i) => (
                    <li key={i}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## General Troubleshooting Tools

### **React Component for Builder Troubleshooting**
```tsx
// ✅ Comprehensive troubleshooting dashboard
interface BuilderTroubleshootingDashboardProps {
  recordId?: string;
  builderType?: string;
}

function BuilderTroubleshootingDashboard({ recordId, builderType }: BuilderTroubleshootingDashboardProps) {
  const [activeTab, setActiveTab] = useState('flows');
  
  return (
    <div className="builder-troubleshooting-dashboard">
      <div className="troubleshooting-tabs">
        <TabButton 
          active={activeTab === 'flows'} 
          onClick={() => setActiveTab('flows')}
        >
          Flow Designer
        </TabButton>
        <TabButton 
          active={activeTab === 'decisions'} 
          onClick={() => setActiveTab('decisions')}
        >
          Decision Builder
        </TabButton>
        <TabButton 
          active={activeTab === 'assignments'} 
          onClick={() => setActiveTab('assignments')}
        >
          Assignment Rules
        </TabButton>
        <TabButton 
          active={activeTab === 'slas'} 
          onClick={() => setActiveTab('slas')}
        >
          SLA Engine
        </TabButton>
        <TabButton 
          active={activeTab === 'integration'} 
          onClick={() => setActiveTab('integration')}
        >
          React Integration
        </TabButton>
      </div>
      
      <div className="troubleshooting-content">
        {activeTab === 'flows' && <FlowDebugger flowId={builderType} recordId={recordId} />}
        {activeTab === 'decisions' && <DecisionBuilderDebugger tableId={builderType} />}
        {activeTab === 'assignments' && <AssignmentRuleDebugger recordId={recordId} />}
        {activeTab === 'slas' && <SLADebugger recordId={recordId} />}
        {activeTab === 'integration' && <IntegrationMonitor />}
      </div>
    </div>
  );
}
```

---

## Best Practices

### **✅ Troubleshooting Best Practices**
- **Enable debug logging** for all builder integrations
- **Test configurations** in development environments first
- **Use ServiceNow debug tools** (Flow Designer test, Decision Builder test)
- **Monitor performance** of builder executions
- **Document common issues** and their solutions
- **Create test cases** for all builder configurations

### **✅ Prevention Strategies**
- **Validate configurations** before deployment
- **Use consistent naming conventions** for builders
- **Implement proper error handling** in all integrations
- **Monitor builder performance** continuously
- **Train team members** on troubleshooting techniques

### **❌ Avoid These Troubleshooting Mistakes**
- Making changes directly in production when troubleshooting
- Not checking ServiceNow logs when builders aren't working
- Ignoring permission and role requirements
- Not testing with realistic data volumes
- Skipping validation of builder configurations

---

## Next Steps

**Fix common issues:**
- [ServiceNow Anti-Patterns](servicenow-anti-patterns.md) - Avoid these mistakes
- [Configuration Governance](configuration-governance.md) - Prevent issues through governance

**Related patterns:**
- [Flow Designer State Machines](flow-designer-state-machines.md) - Debug state machine issues
- [Assignment Rules Integration](assignment-rules-integration.md) - Fix assignment problems
- [SLA Engine Integration](sla-engine-integration.md) - Resolve SLA issues
- [Decision Builder Integration](decision-builder-integration.md) - Debug decision tables

---

*Effective troubleshooting of ServiceNow builder integrations requires systematic debugging, proper tooling, and understanding of both ServiceNow platform behavior and React integration patterns.*