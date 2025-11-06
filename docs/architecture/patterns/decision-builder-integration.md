# Decision Builder Integration Patterns

**Purpose:** Integrating React applications with ServiceNow Decision Builder for business rules  
**Read time:** ~6 minutes  
**Prerequisites:** [ServiceNow Backend Principles](servicenow-backend-principles.md), [Flow Designer Patterns](flow-designer-patterns.md)

---

## Decision Builder as Rules Engine

### **Decision Builder Philosophy**
Decision Builder serves as the centralized rules engine for:
- **Business logic rules** - Priority calculations, routing decisions
- **Assignment logic** - Who should handle what based on multiple criteria
- **Escalation rules** - When and how to escalate based on conditions
- **Approval routing** - Complex approval chains based on business rules
- **Service mapping** - Which services apply based on request characteristics
- **SLA determination** - Which SLA applies based on multiple factors

### **React + Decision Builder Integration Model**
```
React Frontend              ServiceNow Backend
├── User Input             ├── Decision Builder (Rules)
├── Display Results        ├── Flow Designer (Process)
├── Trigger Evaluations    ├── Business Rules (Triggers)
└── Handle Outcomes        └── Table Operations (Data)
```

---

## Decision Table Integration Patterns

### **Pattern 1: Priority/Urgency Matrix**
```tsx
// ✅ React components consume Decision Builder results
interface PriorityMatrixProps {
  urgency: string;
  impact: string;
  category: string;
  callerVIP: boolean;
  onPriorityCalculated: (result: PriorityResult) => void;
}

function PriorityMatrix({ urgency, impact, category, callerVIP, onPriorityCalculated }: PriorityMatrixProps) {
  /*
  SERVICENOW DEVELOPER TODO:
  Create Decision Table: "Incident Priority Matrix"
  
  Table Name: Incident Priority Determination
  Table Path: x_your_scope_incident_priority_matrix
  
  Input Conditions:
  ┌─────────────┬──────────┬─────────────────────────────────────┐
  │ Field       │ Type     │ Values                              │
  ├─────────────┼──────────┼─────────────────────────────────────┤
  │ urgency     │ Choice   │ 1-Critical, 2-High, 3-Medium, 4-Low│
  │ impact      │ Choice   │ 1-Critical, 2-High, 3-Medium, 4-Low│
  │ category    │ Choice   │ Hardware, Software, Network, Security│
  │ caller_vip  │ Boolean  │ true, false                         │
  │ time_of_day │ Choice   │ business_hours, after_hours         │
  └─────────────┴──────────┴─────────────────────────────────────┘
  
  Output Actions:
  ┌──────────────────────┬──────────┬─────────────────────────┐
  │ Field                │ Type     │ Description             │
  ├──────────────────────┼──────────┼─────────────────────────┤
  │ priority             │ Choice   │ 1-Critical, 2-High, etc│
  │ assignment_group     │ String   │ Target assignment group │  
  │ sla_duration_hours   │ Integer  │ SLA time in hours       │
  │ auto_escalate_hours  │ Integer  │ Auto escalation time    │
  │ requires_approval    │ Boolean  │ Needs management approval│
  └──────────────────────┴──────────┴─────────────────────────┘
  
  Sample Rules:
  ┌─────────┬────────┬──────────┬───────────┬─────────────┬──────────┬─────────┬──────────────┬──────────────────┐
  │ Urgency │ Impact │ Category │ VIP       │ Time        │ Priority │ Group   │ SLA Hours    │ Escalate Hours   │
  ├─────────┼────────┼──────────┼───────────┼─────────────┼──────────┼─────────┼──────────────┼──────────────────┤
  │ 1       │ 1      │ any      │ any       │ any         │ 1        │ L3      │ 2            │ 1                │
  │ 1       │ 2      │ Security │ any       │ any         │ 1        │ Security│ 4            │ 2                │
  │ 2       │ 2      │ any      │ true      │ any         │ 2        │ VIP     │ 8            │ 4                │
  │ 2       │ 2      │ any      │ false     │ business    │ 2        │ L2      │ 12           │ 6                │
  │ 2       │ 2      │ any      │ false     │ after       │ 3        │ L1      │ 24           │ 12               │
  └─────────┴────────┴──────────┴───────────┴─────────────┴──────────┴─────────┴──────────────┴──────────────────┘
  
  Integration: Flow Designer calls this Decision Table during incident creation/update
  */

  const [calculatedPriority, setCalculatedPriority] = useState<PriorityResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urgency && impact && category) {
      calculatePriority();
    }
  }, [urgency, impact, category, callerVIP]);

  const calculatePriority = async () => {
    setLoading(true);
    try {
      // This calls Flow Designer which uses Decision Builder
      const result = await decisionService.evaluatePriorityMatrix({
        urgency,
        impact,
        category,
        caller_vip: callerVIP,
        time_of_day: getTimeOfDay()
      });
      
      setCalculatedPriority(result);
      onPriorityCalculated(result);
    } catch (error) {
      console.error('Priority calculation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="priority-matrix">
      <div className="matrix-inputs">
        <div className="input-summary">
          <span>Urgency: {urgency}</span>
          <span>Impact: {impact}</span>
          <span>Category: {category}</span>
          {callerVIP && <span className="vip-indicator">VIP Caller</span>}
        </div>
      </div>

      <div className="matrix-results">
        {loading ? (
          <LoadingSpinner message="Calculating priority..." />
        ) : calculatedPriority ? (
          <div className="priority-result">
            <PriorityBadge priority={calculatedPriority.priority} />
            <div className="result-details">
              <p>Assignment Group: {calculatedPriority.assignment_group}</p>
              <p>SLA: {calculatedPriority.sla_duration_hours} hours</p>
              <p>Auto-escalate: {calculatedPriority.auto_escalate_hours} hours</p>
              {calculatedPriority.requires_approval && (
                <p className="approval-required">⚠️ Management approval required</p>
              )}
            </div>
          </div>
        ) : (
          <p>Priority will be calculated automatically</p>
        )}
      </div>
    </div>
  );
}

// Service integration with Decision Builder
export class DecisionService extends ServiceNowService {
  
  async evaluatePriorityMatrix(inputs: PriorityInputs): Promise<PriorityResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "Priority Matrix Evaluator"
    
    Flow Type: REST Endpoint
    REST Path: /api/{scope}/evaluate_priority_matrix
    Method: POST
    
    Flow Logic:
    1. Receive input parameters
    2. Call Decision Table "Incident Priority Matrix"
    3. Pass all input conditions to Decision Builder
    4. Receive decision results
    5. Format and return structured response
    
    Decision Builder Integration:
    - Use "Evaluate Decision Table" action in Flow Designer
    - Map input conditions to decision table columns
    - Handle cases where no rules match (default behavior)
    - Log decision rationale for audit purposes
    
    Expected Response Format:
    {
      "priority": "2",
      "assignment_group": "Hardware Support L2",
      "sla_duration_hours": 12,
      "auto_escalate_hours": 6,
      "requires_approval": false,
      "decision_rationale": "High impact, medium urgency, business hours"
    }
    */

    const response = await this.request<PriorityResult>(
      '/api/x_your_scope/evaluate_priority_matrix',
      {
        method: 'POST',
        body: JSON.stringify(inputs)
      }
    );

    return response;
  }
}
```

### **Pattern 2: Assignment Rules Engine**
```tsx
// ✅ Complex assignment logic via Decision Builder
interface AssignmentEngineProps {
  incident: Incident;
  onAssignmentCalculated: (assignment: AssignmentResult) => void;
}

function AssignmentEngine({ incident, onAssignmentCalculated }: AssignmentEngineProps) {
  /*
  SERVICENOW DEVELOPER TODO:
  Create Decision Table: "Incident Assignment Rules"
  
  Table Name: Incident Assignment Logic
  Table Path: x_your_scope_incident_assignment_rules
  
  Input Conditions:
  ┌──────────────────┬──────────┬─────────────────────────────────────┐
  │ Field            │ Type     │ Values                              │
  ├──────────────────┼──────────┼─────────────────────────────────────┤
  │ category         │ Choice   │ Hardware, Software, Network, etc    │
  │ subcategory      │ Choice   │ Server, Desktop, Laptop, etc        │
  │ priority         │ Choice   │ 1-Critical, 2-High, 3-Medium, 4-Low│
  │ caller_location  │ Choice   │ NYC, LAX, LON, etc                  │
  │ caller_department│ Choice   │ IT, Finance, HR, Sales, etc         │
  │ time_of_day      │ Choice   │ business_hours, after_hours         │
  │ day_of_week      │ Choice   │ weekday, weekend                    │
  │ current_workload │ Choice   │ low, medium, high, critical         │
  │ skill_required   │ Choice   │ basic, intermediate, advanced, expert│
  └──────────────────┴──────────┴─────────────────────────────────────┘
  
  Output Actions:
  ┌─────────────────────┬──────────┬──────────────────────────────┐
  │ Field               │ Type     │ Description                  │
  ├─────────────────────┼──────────┼──────────────────────────────┤
  │ assignment_group    │ String   │ Primary assignment group     │
  │ backup_group        │ String   │ Fallback if primary busy     │
  │ specific_assignee   │ String   │ Individual if skill required │
  │ escalation_group    │ String   │ Next level for escalation    │
  │ assignment_reason   │ String   │ Why this assignment chosen   │
  │ assignment_priority │ Integer  │ Queue priority (1-10)        │
  └─────────────────────┴──────────┴──────────────────────────────┘
  
  Complex Rules Examples:
  1. Hardware + Server + Critical + Business Hours + NYC = "Server Team NYC"
  2. Security + Any + Any + Any + Any = "Security Response Team"  
  3. Software + Email + Medium + After Hours + Any = "After Hours L1"
  4. Network + Router + High + Any + Expert Required = "Network Engineering"
  
  Workload Balancing:
  - Check current group workload
  - Route to backup group if primary overloaded
  - Consider individual assignments for critical issues
  
  Integration: Flow Designer evaluates assignment rules when incident created/reassigned
  */

  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (incident.sys_id && incident.category && incident.priority) {
      evaluateAssignment();
    }
  }, [incident]);

  const evaluateAssignment = async () => {
    setLoading(true);
    try {
      const assignment = await decisionService.evaluateAssignmentRules({
        category: incident.category.value,
        subcategory: incident.subcategory?.value,
        priority: incident.priority.value,
        caller_location: incident.caller_id?.location,
        caller_department: incident.caller_id?.department,
        time_of_day: getTimeOfDay(),
        day_of_week: getDayOfWeek(),
        skill_required: determineSkillLevel(incident)
      });
      
      setAssignmentResult(assignment);
      onAssignmentCalculated(assignment);
    } catch (error) {
      console.error('Assignment evaluation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assignment-engine">
      <h3>Assignment Recommendation</h3>
      
      {loading ? (
        <LoadingSpinner message="Evaluating assignment rules..." />
      ) : assignmentResult ? (
        <div className="assignment-result">
          <div className="primary-assignment">
            <h4>Recommended Assignment</h4>
            <p><strong>Group:</strong> {assignmentResult.assignment_group}</p>
            {assignmentResult.specific_assignee && (
              <p><strong>Assignee:</strong> {assignmentResult.specific_assignee}</p>
            )}
            <p><strong>Reason:</strong> {assignmentResult.assignment_reason}</p>
            <p><strong>Queue Priority:</strong> {assignmentResult.assignment_priority}/10</p>
          </div>
          
          {assignmentResult.backup_group && (
            <div className="backup-assignment">
              <h4>Backup Assignment</h4>
              <p><strong>Backup Group:</strong> {assignmentResult.backup_group}</p>
            </div>
          )}
          
          <div className="escalation-path">
            <h4>Escalation Path</h4>
            <p><strong>Escalation Group:</strong> {assignmentResult.escalation_group}</p>
          </div>
        </div>
      ) : (
        <p>Assignment will be determined automatically</p>
      )}
    </div>
  );
}
```

### **Pattern 3: Approval Routing Decision Tables**
```tsx
// ✅ Complex approval chains via Decision Builder
interface ApprovalRoutingProps {
  requestType: string;
  requestValue: number;
  requester: User;
  department: string;
  onApprovalChainDetermined: (chain: ApprovalChain) => void;
}

function ApprovalRouting({ requestType, requestValue, requester, department, onApprovalChainDetermined }: ApprovalRoutingProps) {
  /*
  SERVICENOW DEVELOPER TODO:
  Create Decision Table: "Approval Routing Rules"
  
  Table Name: Request Approval Routing
  Table Path: x_your_scope_approval_routing_rules
  
  Input Conditions:
  ┌─────────────────┬──────────┬─────────────────────────────────────┐
  │ Field           │ Type     │ Values                              │
  ├─────────────────┼──────────┼─────────────────────────────────────┤
  │ request_type    │ Choice   │ Purchase, Travel, Access, Change    │
  │ request_value   │ Currency │ 0-50000+ (dollar amounts)           │
  │ requester_level │ Choice   │ Employee, Manager, Director, VP     │
  │ department      │ Choice   │ IT, Finance, HR, Sales, Marketing   │
  │ risk_level      │ Choice   │ Low, Medium, High, Critical         │
  │ compliance_req  │ Boolean  │ true, false                         │
  │ budget_impact   │ Choice   │ None, Minor, Major, Significant     │
  └─────────────────┴──────────┴─────────────────────────────────────┘
  
  Output Actions:
  ┌──────────────────────┬──────────┬─────────────────────────────┐
  │ Field                │ Type     │ Description                 │
  ├──────────────────────┼──────────┼─────────────────────────────┤
  │ approval_level_1     │ String   │ First approver role         │
  │ approval_level_2     │ String   │ Second approver role        │
  │ approval_level_3     │ String   │ Third approver role         │
  │ requires_finance     │ Boolean  │ Finance team approval needed│
  │ requires_security    │ Boolean  │ Security team approval      │
  │ requires_compliance  │ Boolean  │ Compliance approval needed  │
  │ auto_approve_limit   │ Currency │ Amount for auto-approval    │
  │ approval_timeout_days│ Integer  │ Days before escalation      │
  └──────────────────────┴──────────┴─────────────────────────────┘
  
  Complex Approval Rules:
  1. Purchase < $1000 + Employee = Manager Only
  2. Purchase $1000-$5000 + Any = Manager + Finance
  3. Purchase > $5000 + Any = Manager + Finance + Director
  4. Access Request + High Risk = Manager + Security + Compliance
  5. Travel > $2000 + International = Manager + Finance + VP
  
  Parallel vs Sequential:
  - Define which approvals can run in parallel
  - Which require sequential completion
  - How to handle rejection at different levels
  
  Integration: Flow Designer creates approval records based on Decision Builder results
  */

  const [approvalChain, setApprovalChain] = useState<ApprovalChain | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (requestType && requestValue && requester && department) {
      determineApprovalChain();
    }
  }, [requestType, requestValue, requester, department]);

  const determineApprovalChain = async () => {
    setLoading(true);
    try {
      const chain = await decisionService.evaluateApprovalRouting({
        request_type: requestType,
        request_value: requestValue,
        requester_level: requester.user_level,
        department: department,
        risk_level: calculateRiskLevel(requestType, requestValue),
        compliance_req: hasComplianceRequirement(requestType),
        budget_impact: calculateBudgetImpact(requestValue, department)
      });
      
      setApprovalChain(chain);
      onApprovalChainDetermined(chain);
    } catch (error) {
      console.error('Approval routing failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="approval-routing">
      <h3>Approval Requirements</h3>
      
      <div className="request-summary">
        <p><strong>Type:</strong> {requestType}</p>
        <p><strong>Value:</strong> ${requestValue.toLocaleString()}</p>
        <p><strong>Requester:</strong> {requester.name} ({requester.user_level})</p>
        <p><strong>Department:</strong> {department}</p>
      </div>

      {loading ? (
        <LoadingSpinner message="Determining approval requirements..." />
      ) : approvalChain ? (
        <div className="approval-chain">
          <div className="approval-levels">
            <h4>Required Approvals</h4>
            {approvalChain.levels.map((level, index) => (
              <div key={index} className="approval-level">
                <span className="level-number">{index + 1}</span>
                <span className="level-role">{level.role}</span>
                <span className="level-type">{level.parallel ? '(Parallel)' : '(Sequential)'}</span>
              </div>
            ))}
          </div>

          {(approvalChain.requires_finance || approvalChain.requires_security || approvalChain.requires_compliance) && (
            <div className="additional-approvals">
              <h4>Additional Approvals Required</h4>
              {approvalChain.requires_finance && <p>✓ Finance Team Approval</p>}
              {approvalChain.requires_security && <p>✓ Security Team Approval</p>}
              {approvalChain.requires_compliance && <p>✓ Compliance Approval</p>}
            </div>
          )}

          <div className="approval-timeline">
            <p><strong>Expected Timeline:</strong> {approvalChain.estimated_days} business days</p>
            <p><strong>Auto-escalation:</strong> {approvalChain.timeout_days} days</p>
          </div>
        </div>
      ) : (
        <p>Approval requirements will be determined automatically</p>
      )}
    </div>
  );
}
```

---

## Real-time Decision Evaluation

### **Pattern 4: Dynamic Rule Evaluation**
```tsx
// ✅ Real-time decision evaluation as user inputs change
export class RealTimeDecisionService extends ServiceNowService {

  async evaluateRulesInRealTime(
    decisionTable: string, 
    inputs: Record<string, any>,
    debounceMs: number = 500
  ): Promise<DecisionResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "Real-time Decision Evaluator"
    
    Flow Type: REST Endpoint
    REST Path: /api/{scope}/evaluate_decision_real_time
    Method: POST
    
    Performance Requirements:
    - Response time < 200ms for simple decisions
    - Support multiple concurrent evaluations
    - Cache decision results for identical inputs
    - Handle partial inputs gracefully
    
    Input Schema:
    {
      "decision_table": "table_name",
      "inputs": {
        "field_name": "value",
        "another_field": "another_value"
      },
      "partial": true // indicates not all inputs provided yet
    }
    
    Flow Logic:
    1. Validate decision table exists
    2. Check cache for identical inputs
    3. Evaluate decision table with provided inputs
    4. Handle missing inputs with defaults or partial results
    5. Cache result for future use
    6. Return structured decision result
    
    Output Schema:
    {
      "result": {
        "output_field": "calculated_value"
      },
      "confidence": 0.95, // confidence in result (0-1)
      "missing_inputs": ["field1", "field2"], // if partial
      "decision_path": "description of rule matched",
      "cached": false
    }
    */

    // Debounce rapid-fire requests
    await this.delay(debounceMs);
    
    const response = await this.request<DecisionResult>(
      '/api/x_your_scope/evaluate_decision_real_time',
      {
        method: 'POST',
        body: JSON.stringify({
          decision_table: decisionTable,
          inputs,
          partial: !this.allRequiredInputsProvided(inputs)
        })
      }
    );

    return response;
  }

  private allRequiredInputsProvided(inputs: Record<string, any>): boolean {
    // Define which inputs are required for each decision table
    const requiredFields = this.getRequiredFields(inputs.decision_table);
    return requiredFields.every(field => inputs[field] !== undefined && inputs[field] !== '');
  }
}

// React hook for real-time decision evaluation
export const useRealTimeDecision = (
  decisionTable: string,
  inputs: Record<string, any>,
  enabled: boolean = true
) => {
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedInputs = useDebounce(inputs, 500);

  useEffect(() => {
    if (!enabled || !decisionTable) return;

    const evaluateDecision = async () => {
      setLoading(true);
      setError(null);

      try {
        const decision = await realTimeDecisionService.evaluateRulesInRealTime(
          decisionTable,
          debouncedInputs
        );
        setResult(decision);
      } catch (err) {
        setError(err.message);
        setResult(null);
      } finally {
        setLoading(false);
      }
    };

    evaluateDecision();
  }, [decisionTable, debouncedInputs, enabled]);

  return { result, loading, error };
};

// Usage in form component
function DynamicPricingForm() {
  const [formData, setFormData] = useState({
    product_type: '',
    quantity: 0,
    customer_tier: '',
    region: '',
    discount_eligible: false
  });

  const { result: pricingResult, loading } = useRealTimeDecision(
    'dynamic_pricing_rules',
    formData,
    formData.product_type && formData.quantity > 0
  );

  return (
    <form className="dynamic-pricing-form">
      <FormField
        label="Product Type"
        value={formData.product_type}
        onChange={(value) => setFormData(prev => ({ ...prev, product_type: value }))}
      />
      
      <FormField
        label="Quantity"
        type="number"
        value={formData.quantity}
        onChange={(value) => setFormData(prev => ({ ...prev, quantity: parseInt(value) }))}
      />
      
      <FormField
        label="Customer Tier"
        value={formData.customer_tier}
        onChange={(value) => setFormData(prev => ({ ...prev, customer_tier: value }))}
      />

      {pricingResult && (
        <div className="pricing-result">
          <h3>Dynamic Pricing Result</h3>
          <p><strong>Unit Price:</strong> ${pricingResult.result.unit_price}</p>
          <p><strong>Total Price:</strong> ${pricingResult.result.total_price}</p>
          <p><strong>Applied Discount:</strong> {pricingResult.result.discount_percent}%</p>
          <p><strong>Confidence:</strong> {(pricingResult.confidence * 100).toFixed(1)}%</p>
          
          {pricingResult.missing_inputs?.length > 0 && (
            <p className="incomplete-warning">
              ⚠️ Pricing estimate - missing: {pricingResult.missing_inputs.join(', ')}
            </p>
          )}
        </div>
      )}

      {loading && (
        <div className="pricing-loading">
          <LoadingSpinner size="sm" />
          <span>Calculating pricing...</span>
        </div>
      )}
    </form>
  );
}
```

---

## Decision Builder Testing

### **Pattern 5: Decision Table Testing**
```tsx
// ✅ Test Decision Builder integration
describe('Decision Builder Integration', () => {
  beforeEach(() => {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Test Decision Tables:
    
    Test Table: "Priority Matrix - Test"
    - Use simplified rules for predictable testing
    - Cover edge cases and boundary conditions
    - Include invalid input handling
    - Test default behaviors when no rules match
    
    Test Data Requirements:
    1. Normal cases - standard priority calculations
    2. Edge cases - boundary values, null inputs
    3. VIP scenarios - special handling for VIP users
    4. Time-based rules - business hours vs after hours
    5. Category-specific rules - security, hardware, etc.
    
    Test Decision Logic:
    - Urgency 1 + Impact 1 = Priority 1 (always)
    - VIP caller = minimum Priority 2
    - Security category = special assignment group
    - After hours = different SLA timing
    */
    
    global.fetch = jest.fn();
  });

  it('calculates priority correctly for standard inputs', async () => {
    const mockDecisionResult = {
      result: {
        priority: '2',
        assignment_group: 'Hardware Support L2',
        sla_duration_hours: 12,
        auto_escalate_hours: 6,
        requires_approval: false
      },
      confidence: 1.0,
      decision_path: 'High urgency, medium impact, hardware category, business hours',
      cached: false
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockDecisionResult)
    });

    const decisionService = new DecisionService();
    const result = await decisionService.evaluatePriorityMatrix({
      urgency: '2',
      impact: '3',
      category: 'hardware',
      caller_vip: false,
      time_of_day: 'business_hours'
    });

    expect(result.priority).toBe('2');
    expect(result.assignment_group).toBe('Hardware Support L2');
    expect(result.sla_duration_hours).toBe(12);
  });

  it('handles VIP caller special rules', async () => {
    const mockVIPResult = {
      result: {
        priority: '2', // Elevated from normal priority 3
        assignment_group: 'VIP Support Team',
        sla_duration_hours: 8, // Faster SLA
        auto_escalate_hours: 4,
        requires_approval: false
      },
      confidence: 1.0,
      decision_path: 'VIP caller - elevated priority and specialized team',
      cached: false
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockVIPResult)
    });

    const result = await decisionService.evaluatePriorityMatrix({
      urgency: '3',
      impact: '3',
      category: 'software',
      caller_vip: true,
      time_of_day: 'business_hours'
    });

    expect(result.priority).toBe('2'); // Elevated from normal 3
    expect(result.assignment_group).toBe('VIP Support Team');
    expect(result.sla_duration_hours).toBe(8); // Faster SLA
  });

  it('handles security category special rules', async () => {
    const mockSecurityResult = {
      result: {
        priority: '1', // Security always high priority
        assignment_group: 'Security Response Team',
        sla_duration_hours: 4,
        auto_escalate_hours: 2,
        requires_approval: true // Security requires approval
      },
      confidence: 1.0,
      decision_path: 'Security category - immediate response required',
      cached: false
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockSecurityResult)
    });

    const result = await decisionService.evaluatePriorityMatrix({
      urgency: '3',
      impact: '3',
      category: 'security',
      caller_vip: false,
      time_of_day: 'after_hours'
    });

    expect(result.priority).toBe('1');
    expect(result.assignment_group).toBe('Security Response Team');
    expect(result.requires_approval).toBe(true);
  });

  it('handles missing or invalid inputs gracefully', async () => {
    const mockErrorResult = {
      error: {
        code: 'DECISION_INVALID_INPUT',
        message: 'Required field missing: urgency',
        details: 'Decision table requires urgency value to evaluate rules'
      }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve(mockErrorResult)
    });

    await expect(
      decisionService.evaluatePriorityMatrix({
        urgency: '', // Missing required field
        impact: '2',
        category: 'hardware',
        caller_vip: false,
        time_of_day: 'business_hours'
      })
    ).rejects.toMatchObject({
      message: 'Required field missing: urgency'
    });
  });
});
```

---

## Best Practices

### **✅ Decision Builder Integration Best Practices**
- **Design comprehensive decision tables** covering all business scenarios
- **Use clear, business-friendly field names** in decision tables
- **Implement default rules** for cases where no specific rules match
- **Test edge cases thoroughly** including missing and invalid inputs
- **Cache decision results** for frequently evaluated scenarios
- **Document decision rationale** for audit and debugging purposes
- **Version control decision tables** with clear change management

### **✅ React Integration Patterns**
- **Real-time evaluation** as users input data
- **Debounce rapid inputs** to avoid excessive API calls
- **Show decision confidence** when available
- **Handle partial results** gracefully
- **Display decision reasoning** to help users understand outcomes
- **Provide fallback behavior** when decision service unavailable

### **❌ Avoid These Anti-Patterns**
- Implementing complex business rules in React instead of Decision Builder
- Creating decision logic in multiple places (inconsistency)
- Not testing decision tables with realistic data
- Ignoring decision confidence scores
- Not handling missing inputs gracefully
- Bypassing decision tables for "simple" rules that might grow complex

---

## Next Steps

**Related patterns:**
- [ServiceNow Backend Principles](servicenow-backend-principles.md) - Configuration-first approach
- [Flow Designer Patterns](flow-designer-patterns.md) - Process orchestration
- [Service Layer](service-layer.md) - Service integration patterns
- [Configuration Management](configuration-management.md) - Managing decision table configurations

**Implementation guides:**
- [Testing Strategy](testing-strategy.md) - Testing decision integrations
- [Performance Optimization](performance-optimization.md) - Optimizing decision evaluation

---

*Decision Builder serves as your centralized rules engine. Design React components to consume and display decision results rather than implementing business rules directly in code.*