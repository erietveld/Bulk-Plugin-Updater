# Flow Designer State Machine Patterns

**Purpose:** Complex state machine implementation using Flow Designer (modern alternative to deprecated Workflow Engine)  
**Read time:** ~5 minutes  
**Prerequisites:** [ServiceNow Backend Principles](servicenow-backend-principles.md), [Flow Designer Patterns](flow-designer-patterns.md)

---

## State Machine Architecture with Flow Designer

### **Modern Approach: Flow Designer State Machines**
Flow Designer replaces the deprecated Workflow Engine for complex state machines by providing:
- **Visual state modeling** with branching logic
- **Conditional state transitions** based on Decision Builder
- **Parallel state execution** with subflows
- **State persistence** through record fields
- **Event-driven transitions** via triggers
- **State validation** and rollback capabilities

### **State Machine Design Pattern**
```
State Machine Components
├── State Field → Choice field storing current state
├── Transition Rules → Decision Builder for valid transitions  
├── State Actions → Flow Designer subflows for each state
├── Validation Logic → Data Policies for state constraints
├── Event Triggers → Record updates triggering transitions
└── Audit Trail → Work notes logging state changes
```

---

## Complex State Machine Implementation

### **Pattern 1: Incident Lifecycle State Machine**
```tsx
// ✅ React triggers state transitions, Flow Designer manages state machine
export class IncidentStateMachineService extends TableService<Incident> {
  
  async transitionState(incidentId: string, targetState: string, context: StateContext): Promise<StateTransitionResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow Designer State Machine: "Incident State Machine"
    
    State Machine Design:
    ┌─────────────────────────────────────────────────────────────┐
    │                 Incident State Machine                      │
    │                                                             │
    │  [New] ─────→ [Assigned] ─────→ [In Progress]              │
    │    │             │                    │                     │
    │    │             ↓                    ↓                     │
    │    └────→ [On Hold] ←────────────── [Resolved]             │
    │                │                      │                     │
    │                ↓                      ↓                     │
    │           [Cancelled] ←─────────── [Closed]                │
    └─────────────────────────────────────────────────────────────┘
    
    Flow: "Incident State Transition Controller"
    Trigger: Record Updated (state field changes)
    
    Logic:
    1. Validate Transition (Decision Builder)
       - Check current state vs target state
       - Verify user permissions for transition
       - Validate required fields for target state
    
    2. Execute State Actions (Subflows)
       - "new" → "assigned": Assignment notifications, SLA start
       - "assigned" → "in_progress": Work start notifications
       - "in_progress" → "resolved": Resolution validation, caller notification
       - "resolved" → "closed": Final cleanup, satisfaction survey
       - Any → "on_hold": Hold reason required, SLA pause
       - Any → "cancelled": Cancellation reason, cleanup
    
    3. State Validation
       - Required fields for each state
       - Business rule compliance
       - SLA impact assessment
    
    4. Rollback on Failure
       - Revert to previous state if validation fails
       - Log failure reason
       - Notify user of failure
    
    Expected Flow Name: "Incident State Transition Controller"
    Expected Decision Table: "Valid Incident State Transitions"
    */

    const result = await this.request<StateTransitionResult>(
      '/api/x_your_scope/transition_incident_state',
      {
        method: 'POST',
        body: JSON.stringify({
          incident_id: incidentId,
          target_state: targetState,
          context: context
        })
      }
    );

    return result;
  }

  async getValidTransitions(incidentId: string): Promise<ValidTransition[]> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "Get Valid State Transitions"
    
    Flow Type: REST Endpoint
    REST Path: /api/{scope}/get_valid_transitions
    
    Logic:
    1. Get current incident state
    2. Get user permissions
    3. Call Decision Builder "Valid State Transitions"
    4. Return available transitions with reasons
    
    Decision Builder Input:
    - current_state
    - user_role
    - incident_priority  
    - assignment_group
    - time_in_current_state
    
    Decision Builder Output:
    - valid_transitions (array)
    - transition_requirements (per transition)
    - required_fields (per transition)
    - warnings (per transition)
    */

    const transitions = await this.request<ValidTransition[]>(
      `/api/x_your_scope/get_valid_transitions?incident_id=${incidentId}`
    );

    return transitions;
  }
}
```

### **Pattern 2: Change Request State Machine**
```tsx
// ✅ Multi-path state machine with parallel approval states
export class ChangeRequestStateMachine extends TableService<ChangeRequest> {
  
  async initiateChangeProcess(changeId: string): Promise<ChangeProcessResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Complex Flow Designer State Machine: "Change Request Lifecycle"
    
    State Machine Design:
    ┌─────────────────────────────────────────────────────────────────────┐
    │                    Change Request State Machine                     │
    │                                                                     │
    │  [Draft] ──→ [Assessment] ──→ [Approval] ─────→ [Scheduled]        │
    │     │             │              │                   │              │
    │     │             │              ├─→ [CAB Review] ──→│              │
    │     │             │              ├─→ [Risk Review] ──→│              │
    │     │             │              └─→ [Finance] ──────→│              │
    │     │             │                                   │              │
    │     │             ↓                                   ↓              │
    │     └─────→ [Rejected] ←─────────────────────── [Implementation]    │
    │                                                       │              │
    │                                              [Review & Close]       │
    │                                                       │              │
    │                                               [Closed] ←─────────    │
    └─────────────────────────────────────────────────────────────────────┘
    
    Parallel Approval States:
    - Multiple approval flows can run simultaneously
    - All must complete before proceeding to Scheduled
    - Any rejection moves to Rejected state
    
    Flow: "Change Request State Controller"
    
    Complex Logic:
    1. State Transition Validation
       - Use Decision Builder for complex transition rules
       - Consider change type, risk, impact, timing
    
    2. Parallel Approval Management
       - Trigger multiple approval subflows
       - Track completion status of each
       - Handle partial approvals and rejections
    
    3. Risk-based Routing
       - High-risk changes require additional approvals
       - Emergency changes have expedited paths
       - Standard changes may auto-approve
    
    4. Implementation Scheduling
       - Integration with Change Calendar
       - Conflict detection with other changes
       - Maintenance window alignment
    */

    const result = await this.request<ChangeProcessResult>(
      '/api/x_your_scope/initiate_change_process',
      {
        method: 'POST',
        body: JSON.stringify({ change_id: changeId })
      }
    );

    return result;
  }

  async handleParallelApprovals(changeId: string, approvalType: string): Promise<ApprovalResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Subflow: "Parallel Approval Manager"
    
    Subflow Logic:
    1. Determine Required Approvals (Decision Builder)
       - Based on change type, risk, impact, cost
       - Different approval chains for different criteria
    
    2. Launch Parallel Approvals
       - CAB approval for high-risk changes
       - Finance approval for high-cost changes  
       - Security review for security-related changes
       - Business unit approval for business-critical changes
    
    3. Monitor Approval Progress
       - Track completion status
       - Handle timeouts and escalations
       - Manage approval dependencies
    
    4. Consolidate Results
       - All approvals must complete successfully
       - Any rejection triggers rejection flow
       - Timeout triggers escalation flow
    
    Expected Subflow Name: "Parallel Approval Manager"
    Expected Decision Table: "Change Approval Requirements"
    */

    const result = await this.request<ApprovalResult>(
      '/api/x_your_scope/handle_parallel_approvals',
      {
        method: 'POST',
        body: JSON.stringify({
          change_id: changeId,
          approval_type: approvalType
        })
      }
    );

    return result;
  }
}
```

### **Pattern 3: Service Request Fulfillment State Machine**
```tsx
// ✅ Dynamic state machine based on catalog item
export class ServiceRequestStateMachine extends TableService<ServiceRequest> {
  
  async processServiceRequest(requestId: string): Promise<FulfillmentResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Dynamic Flow Designer State Machine: "Service Request Fulfillment"
    
    Dynamic State Machine Design:
    - State machine varies based on catalog item
    - Different fulfillment paths for different services
    - Integration with external systems for provisioning
    
    Example State Machines by Catalog Item:
    
    Hardware Request:
    [Submitted] → [Approval] → [Procurement] → [Shipping] → [Delivered] → [Closed]
    
    Access Request:
    [Submitted] → [Manager Approval] → [Security Review] → [Provisioning] → [Verification] → [Closed]
    
    Software Request:
    [Submitted] → [License Check] → [Approval] → [Installation] → [Testing] → [Closed]
    
    Flow: "Dynamic Service Request Processor"
    Trigger: Record Inserted (sc_req_item table)
    
    Logic:
    1. Identify Catalog Item Type (Decision Builder)
       - Map catalog item to fulfillment workflow
       - Determine required approvals and steps
       - Set initial state and next steps
    
    2. Configure State Machine
       - Create custom state progression
       - Set up state-specific validation rules
       - Configure notifications per state
    
    3. Execute State-Specific Actions
       - Each state has specific subflows
       - Integration with fulfillment systems
       - Progress tracking and notifications
    
    4. Handle Exceptions
       - Failed provisioning attempts
       - Approval rejections
       - External system failures
    
    Expected Flow Name: "Dynamic Service Request Processor"
    Expected Decision Table: "Catalog Item Fulfillment Rules"
    */

    const result = await this.request<FulfillmentResult>(
      '/api/x_your_scope/process_service_request',
      {
        method: 'POST',
        body: JSON.stringify({ request_id: requestId })
      }
    );

    return result;
  }

  async handleFulfillmentStep(requestId: string, stepType: string, stepData: any): Promise<StepResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Subflow: "Fulfillment Step Handler"
    
    Subflow handles different fulfillment steps:
    - Approval steps (routing to appropriate approvers)
    - Provisioning steps (integration with external systems)
    - Verification steps (testing and validation)
    - Notification steps (user and stakeholder updates)
    
    Step Types:
    - "approval": Route for approval based on criteria
    - "provision": Create/configure resources
    - "integrate": Call external systems
    - "verify": Test and validate fulfillment
    - "notify": Send status updates
    - "close": Complete the request
    
    Expected Subflow Name: "Fulfillment Step Handler"
    Expected Integration: External provisioning systems
    */

    const result = await this.request<StepResult>(
      '/api/x_your_scope/handle_fulfillment_step',
      {
        method: 'POST',
        body: JSON.stringify({
          request_id: requestId,
          step_type: stepType,
          step_data: stepData
        })
      }
    );

    return result;
  }
}
```

---

## React State Machine Components

### **Pattern 4: State Machine Visualization**
```tsx
// ✅ React component showing state machine progress
interface StateMachineProgressProps {
  recordId: string;
  recordType: 'incident' | 'change' | 'service_request';
  currentState: string;
  onStateTransition: (newState: string) => void;
}

function StateMachineProgress({ recordId, recordType, currentState, onStateTransition }: StateMachineProgressProps) {
  const { data: validTransitions } = useQuery(
    ['valid-transitions', recordId],
    () => stateMachineService.getValidTransitions(recordId, recordType)
  );

  const { data: stateHistory } = useQuery(
    ['state-history', recordId],
    () => stateMachineService.getStateHistory(recordId)
  );

  return (
    <div className="state-machine-progress">
      <div className="current-state">
        <StateBadge state={currentState} type={recordType} />
        <span className="state-duration">
          {calculateStateDuration(stateHistory, currentState)}
        </span>
      </div>

      <div className="state-timeline">
        {stateHistory?.map((entry, index) => (
          <StateTimelineItem
            key={index}
            state={entry.state}
            timestamp={entry.timestamp}
            duration={entry.duration}
            user={entry.user}
            isActive={entry.state === currentState}
          />
        ))}
      </div>

      <div className="available-transitions">
        <h4>Available Actions</h4>
        {validTransitions?.map(transition => (
          <TransitionButton
            key={transition.target_state}
            transition={transition}
            onClick={() => onStateTransition(transition.target_state)}
            disabled={!transition.allowed}
          />
        ))}
      </div>

      {validTransitions?.some(t => t.warnings) && (
        <div className="transition-warnings">
          <h4>Warnings</h4>
          {validTransitions
            .filter(t => t.warnings)
            .map(t => (
              <div key={t.target_state} className="warning">
                <strong>{t.target_state}:</strong> {t.warnings}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
```

---

## State Machine Testing

### **Pattern 5: State Machine Integration Testing**
```tsx
// ✅ Test state machine transitions
describe('Flow Designer State Machine Integration', () => {
  beforeEach(() => {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Test State Machine Flows:
    
    Test Flow: "Incident State Machine - Test"
    - Use test data and shortened timers
    - Mock external integrations
    - Log all state transitions for verification
    - Use test users and groups
    
    Test Decision Tables:
    - Simple, predictable state transition rules
    - Cover all valid and invalid transitions
    - Test edge cases and error conditions
    
    Test Data Setup:
    - Create test incidents in various states
    - Set up test users with different permissions
    - Configure test assignment groups
    */
    
    global.fetch = jest.fn();
  });

  it('handles valid state transitions', async () => {
    const mockTransitionResult = {
      success: true,
      previous_state: 'new',
      current_state: 'assigned',
      transition_time: '2023-01-01T10:00:00Z',
      actions_executed: ['assignment_notification', 'sla_start'],
      next_valid_states: ['in_progress', 'on_hold']
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTransitionResult)
    });

    const result = await stateMachineService.transitionState(
      'INC0000123',
      'assigned',
      { assigned_to: 'test_user' }
    );

    expect(result.success).toBe(true);
    expect(result.current_state).toBe('assigned');
    expect(result.actions_executed).toContain('assignment_notification');
  });

  it('rejects invalid state transitions', async () => {
    const mockErrorResult = {
      error: {
        code: 'INVALID_STATE_TRANSITION',
        message: 'Cannot transition from "closed" to "in_progress"',
        details: 'Closed incidents cannot be reopened without manager approval'
      }
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve(mockErrorResult)
    });

    await expect(
      stateMachineService.transitionState('INC0000123', 'in_progress', {})
    ).rejects.toMatchObject({
      message: 'Cannot transition from "closed" to "in_progress"'
    });
  });

  it('handles parallel approval states', async () => {
    const mockParallelResult = {
      approvals_launched: ['cab_approval', 'finance_approval', 'security_review'],
      pending_approvals: 3,
      estimated_completion: '2023-01-03T17:00:00Z',
      status: 'parallel_approvals_in_progress'
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockParallelResult)
    });

    const result = await changeStateMachine.handleParallelApprovals(
      'CHG0000456',
      'high_risk_change'
    );

    expect(result.approvals_launched).toHaveLength(3);
    expect(result.status).toBe('parallel_approvals_in_progress');
  });
});
```

---

## Best Practices

### **✅ State Machine Design Best Practices**
- **Use Flow Designer** instead of deprecated Workflow Engine
- **Model states explicitly** in choice fields with clear naming
- **Use Decision Builder** for complex transition logic
- **Implement rollback mechanisms** for failed transitions
- **Log all state changes** for audit and debugging
- **Validate state transitions** before execution
- **Handle parallel states** when multiple processes run simultaneously

### **✅ Performance Optimization**
- **Cache valid transitions** to avoid repeated Decision Builder calls
- **Use efficient triggers** - avoid overly broad record update triggers
- **Implement timeouts** for long-running state actions
- **Monitor flow performance** and optimize bottlenecks
- **Use subflows** to break down complex state actions

### **❌ Avoid These Anti-Patterns**
- Using deprecated Workflow Engine for new state machines
- Implementing state logic in business rules instead of Flow Designer
- Hard-coding state transitions without using Decision Builder
- Not validating state transitions before execution
- Missing rollback mechanisms for failed transitions
- Not logging state changes for audit purposes

---

## Next Steps

**Related patterns:**
- [Flow Designer Patterns](flow-designer-patterns.md) - General Flow Designer integration
- [Decision Builder Integration](decision-builder-integration.md) - Rules engine for transitions
- [Assignment Rules Integration](assignment-rules-integration.md) - State-based assignment
- [SLA Engine Integration](sla-engine-integration.md) - State-based SLA management

**Implementation guides:**
- [Configuration Governance](configuration-governance.md) - Managing state machine changes
- [Troubleshooting Builder Integration](troubleshooting-builder-integration.md) - Common state machine issues

---

*Flow Designer provides powerful state machine capabilities that replace the deprecated Workflow Engine. Design your state machines visually with proper validation and rollback mechanisms.*