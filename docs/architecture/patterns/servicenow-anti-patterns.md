---
title: "ServiceNow Anti-Patterns: What NOT to Do"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Critical mistakes to avoid when implementing ServiceNow's configuration-first development approach"
readTime: "6 minutes"
complexity: "intermediate"
status: "ACTIVE"
criticality: "MANDATORY"
prerequisites: ["servicenow-backend-principles", "core-principles"]
tags: ["servicenow", "anti-patterns", "configuration-first", "builders", "mistakes"]
breaking-changes: ["Replaces scattered anti-pattern guidance", "Consolidates all ServiceNow development mistakes"]
---

# ServiceNow Anti-Patterns: What NOT to Do

**Purpose:** Critical mistakes to avoid when implementing ServiceNow's configuration-first development approach  
**Read time:** ~6 minutes  
**Prerequisites:** [ServiceNow Backend Principles](servicenow-backend-principles.md), [Core Principles](../core-principles.md)

---

## Configuration-First Anti-Patterns

This document identifies critical mistakes that violate ServiceNow's **"Builders Before Code"** principle from [ServiceNow Backend Principles](servicenow-backend-principles.md). Understanding these anti-patterns is essential for maintaining our hybrid development approach.

### **Integration with Backend Principles**
These anti-patterns directly contradict the **configuration-first decision tree** established in [ServiceNow Backend Principles](servicenow-backend-principles.md):

```
❌ ANTI-PATTERN: Skip builders → Go straight to code
✅ CORRECT: ServiceNow UI → Flow Designer → Decision Builder → Fluent DSL → Custom Code
```

---

## ❌ Critical Anti-Pattern #1: Custom Code Over Builders

### **The Mistake**
Writing custom business logic instead of using ServiceNow's native builder tools.

### **Wrong Approach - Priority Calculation in Code**
```tsx
// ❌ BAD: Complex business logic in Business Rules
function calculateIncidentPriority(current) {
  // 100+ lines of hardcoded priority matrix
  if (current.urgency == '1' && current.impact == '1') {
    current.priority = '1';
  } else if (current.urgency == '1' && current.impact == '2') {
    current.priority = '2';
  } else if (current.urgency == '2' && current.impact == '1') {
    current.priority = '2';
  } else if (current.caller_id.vip == true && current.urgency == '2') {
    current.priority = '2';
  }
  // ... 80+ more lines of hardcoded business logic
  
  // Custom assignment logic
  if (current.priority == '1') {
    if (current.category == 'Security') {
      current.assignment_group = getSecurityGroup();
    } else {
      current.assignment_group = getCriticalIncidentGroup();
    }
  }
  
  // Custom SLA logic
  activateCustomSLA(current);
}

// React component trying to handle business logic
function IncidentForm() {
  const calculatePriority = (urgency, impact, vipCaller) => {
    // Business logic belongs in ServiceNow builders!
    if (urgency === '1' && impact === '1') return '1';
    if (vipCaller && (urgency === '2' || impact === '2')) return '2';
    // ... more business logic that should be configurable
    return '4';
  };
  
  return (
    <form>
      {/* Form tries to handle priority calculation */}
      <PriorityCalculator onCalculate={calculatePriority} />
    </form>
  );
}
```

### **Correct Approach - ServiceNow Builders**
```tsx
// ✅ GOOD: Let ServiceNow builders handle business logic
export class IncidentService extends TableService<Incident> {
  async createIncident(data: IncidentData): Promise<Incident> {
    // Simple record creation - Decision Builder handles priority
    // Assignment Rules handle routing  
    // SLA Engine handles service levels
    return await this.createRecord(data);
  }
}

// React focuses only on UI
function IncidentForm() {
  const createIncident = useMutation({
    mutationFn: (data) => incidentService.createIncident(data),
    // ServiceNow configuration automatically handles:
    // - Priority calculation (Decision Builder)
    // - Assignment routing (Assignment Rules)
    // - SLA activation (SLA Engine)
    // - Notifications (Flow Designer)
  });
  
  return (
    <form onSubmit={handleSubmit(createIncident.mutate)}>
      {/* Simple form - builders handle the complexity */}
    </form>
  );
}

/*
SERVICENOW DEVELOPER TODO:
1. Create Decision Builder table: "Incident Priority Matrix"
   - Input: Urgency, Impact, VIP Caller status
   - Output: Calculated Priority
   
2. Configure Assignment Rules: "Incident Assignment Logic"
   - Route based on category, priority, location
   - Include load balancing and skills matching
   
3. Set up SLA definitions with appropriate conditions
   - Different SLAs for different priority levels
   - Escalation rules for missed SLAs
*/
```

### **Why This Matters**
- **Upgrade Safety**: Custom code breaks during ServiceNow upgrades
- **Business Maintenance**: Non-developers can't modify hardcoded logic
- **Performance**: Native builders are platform-optimized
- **Auditability**: Configuration changes have built-in approval workflows

---

## ❌ Critical Anti-Pattern #2: React Validation Over Data Policies

### **The Mistake**
Implementing complex validation logic in React components instead of using ServiceNow Data Policies.

### **Wrong Approach - Client-Side Business Validation**
```tsx
// ❌ BAD: Complex validation logic in React
function IncidentForm({ onSubmit }: IncidentFormProps) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (data: IncidentData): ValidationErrors => {
    const errors: ValidationErrors = {};
    
    // Business validation that belongs in ServiceNow
    if (!data.short_description || data.short_description.length < 10) {
      errors.short_description = 'Description must be at least 10 characters';
    }
    
    // Complex business rules in React - WRONG!
    if (data.category === 'security' && !data.security_classification) {
      errors.security_classification = 'Security classification required for security incidents';
    }
    
    if (data.priority === '1' && !data.business_justification) {
      errors.business_justification = 'Business justification required for P1 incidents';
    }
    
    if (data.caller_id?.vip && data.priority === '4') {
      errors.priority = 'VIP callers cannot have P4 incidents';
    }
    
    // Location-based validation
    if (data.location === 'datacenter' && data.category !== 'hardware') {
      errors.category = 'Datacenter incidents must be hardware category';
    }
    
    // Time-based validation
    const now = new Date();
    if (now.getHours() > 17 && data.priority === '1') {
      errors._form = 'P1 incidents after 5 PM require manager approval';
    }
    
    return errors;
  };

  const handleSubmit = (data: IncidentData) => {
    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Complex error handling for business rules */}
      {Object.entries(errors).map(([field, error]) => (
        <div key={field} className="error">{error}</div>
      ))}
    </form>
  );
}
```

### **Correct Approach - ServiceNow Data Policies**
```tsx
// ✅ GOOD: Let ServiceNow Data Policies handle validation
function IncidentForm({ onSubmit }: IncidentFormProps) {
  const [serverErrors, setServerErrors] = useState<string[]>([]);

  const handleSubmit = async (data: IncidentData) => {
    try {
      await onSubmit(data); // ServiceNow validates via Data Policies
      setServerErrors([]);
    } catch (error) {
      // Display ServiceNow validation errors
      if (error.field_errors) {
        setServerErrors(error.field_errors);
      } else {
        setServerErrors([error.message]);
      }
    }
  };

  return (
    <ServiceNowForm onSubmit={handleSubmit}>
      {/* Simple form - Data Policies handle all validation */}
      {serverErrors.length > 0 && (
        <ErrorDisplay errors={serverErrors} />
      )}
    </ServiceNowForm>
  );
}

/*
SERVICENOW DEVELOPER TODO:
Create Data Policies for business validation:

1. "Incident Basic Validation" Data Policy
   - Short description minimum length
   - Required fields based on category
   
2. "Security Incident Validation" Data Policy  
   - Security classification requirement
   - Additional fields for security incidents
   
3. "VIP Caller Validation" Data Policy
   - Priority restrictions for VIP callers
   - Special handling requirements
   
4. "Location-Based Validation" Data Policy
   - Category restrictions by location
   - Equipment validation for datacenter
*/
```

---

## ❌ Critical Anti-Pattern #3: Custom Workflows Over Flow Designer

### **The Mistake**
Creating custom REST APIs or Business Rules to handle complex workflows instead of using Flow Designer.

### **Wrong Approach - Custom Workflow Logic**
```tsx
// ❌ BAD: Custom Scripted REST API doing workflow logic
// Scripted REST API: Incident Resolution Workflow
(function process(request, response) {
  var incidentId = request.pathParams.incident_id;
  var resolutionData = request.body;
  
  try {
    // Manual workflow that Flow Designer should handle
    var incident = new GlideRecord('incident');
    if (incident.get(incidentId)) {
      // Manual state management
      incident.state = '6'; // Resolved
      incident.resolution_code = resolutionData.resolution_code;
      incident.close_notes = resolutionData.close_notes;
      incident.resolved_by = gs.getUserID();
      incident.resolved_at = gs.nowDateTime();
      
      // Manual satisfaction survey creation
      createSatisfactionSurvey(incident);
      
      // Manual notification logic
      sendResolutionNotification(incident);
      
      // Manual SLA completion
      completeSLAs(incident);
      
      // Manual knowledge base updates
      if (resolutionData.create_knowledge) {
        createKnowledgeArticle(incident, resolutionData);
      }
      
      // Manual related record updates
      updateRelatedRecords(incident);
      
      incident.update();
      
      response.setStatus(200);
      response.setBody({ success: true, incident_id: incidentId });
    }
  } catch (error) {
    response.setStatus(500);
    response.setBody({ error: error.message });
  }
})();

// React calling custom API
function IncidentResolution() {
  const resolveIncident = async (incidentId, resolutionData) => {
    // Custom API call that should use Flow Designer
    const response = await fetch(`/api/custom/incident/${incidentId}/resolve`, {
      method: 'POST',
      body: JSON.stringify(resolutionData)
    });
    return response.json();
  };
}
```

### **Correct Approach - Flow Designer Workflows**
```tsx
// ✅ GOOD: Use Flow Designer for complex workflows
export class IncidentWorkflowService extends TableService<Incident> {
  async resolveIncident(incidentId: string, resolutionData: ResolutionData): Promise<Incident> {
    // Simple record update triggers Flow Designer workflow
    return await this.updateRecord(incidentId, {
      state: '6', // Resolved
      resolution_code: resolutionData.resolution_code,
      close_notes: resolutionData.close_notes,
      resolved_by: 'current_user'
    });
    
    /*
    Flow Designer "Incident Resolution Workflow" automatically handles:
    1. SLA completion and calculations
    2. Satisfaction survey creation
    3. Resolution notifications to stakeholders
    4. Knowledge article creation (if requested)
    5. Related record updates
    6. Escalation chain notifications
    7. Management reporting
    8. Asset updates (if hardware-related)
    */
  }
}

// React focuses on UI
function IncidentResolution() {
  const resolveIncident = useMutation({
    mutationFn: ({ incidentId, resolutionData }) => 
      incidentWorkflowService.resolveIncident(incidentId, resolutionData),
    
    onSuccess: () => {
      // Flow Designer handles all the complex workflow logic
      showNotification('Incident resolved successfully');
    }
  });
  
  return (
    <ResolutionForm 
      onSubmit={(data) => resolveIncident.mutate({ 
        incidentId: incident.sys_id, 
        resolutionData: data 
      })}
    />
  );
}

/*
SERVICENOW DEVELOPER TODO:
Create Flow Designer flow: "Incident Resolution Workflow"

Trigger: Record Updated (state field changes to 'Resolved')

Flow Steps:
1. Complete all active SLAs
2. Create satisfaction survey (conditional)
3. Send resolution notifications (subflow)
4. Update related records (subflow)
5. Create knowledge article (conditional)
6. Generate resolution metrics
7. Close child records (if applicable)

Benefits:
- Visual workflow design
- Reusable subflows
- Built-in error handling
- Business user maintainable
- Comprehensive audit trail
*/
```

---

## ❌ Critical Anti-Pattern #4: Hardcoded Configuration

### **The Mistake**
Hardcoding business configuration in React components or custom scripts instead of using ServiceNow System Properties.

### **Wrong Approach - Hardcoded Values**
```tsx
// ❌ BAD: Hardcoded configuration scattered throughout code
function IncidentDashboard() {
  // Hardcoded feature flags
  const ENABLE_AI_SUGGESTIONS = true;
  const ENABLE_PREDICTIVE_ASSIGNMENT = false;
  const SHOW_SLA_WARNINGS = true;
  
  // Hardcoded business rules
  const MAX_INCIDENTS_PER_PAGE = 25;
  const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds
  const ESCALATION_THRESHOLD_HOURS = 4;
  const VIP_PRIORITY_BOOST = true;
  
  // Hardcoded styling configurations
  const PRIORITY_COLORS = {
    '1': '#d73027', // Critical - Red
    '2': '#fc8d59', // High - Orange
    '3': '#fee08b', // Medium - Yellow
    '4': '#91bfdb'  // Low - Blue
  };
  
  // Hardcoded business logic
  const shouldShowWarning = (incident) => {
    return incident.priority === '1' && 
           incident.state !== '6' && 
           getHoursSinceCreated(incident) > ESCALATION_THRESHOLD_HOURS;
  };
  
  return (
    <div>
      {ENABLE_AI_SUGGESTIONS && <AISuggestions />}
      {ENABLE_PREDICTIVE_ASSIGNMENT && <PredictiveAssignment />}
      <IncidentList 
        pageSize={MAX_INCIDENTS_PER_PAGE}
        refreshInterval={AUTO_REFRESH_INTERVAL}
        priorityColors={PRIORITY_COLORS}
        showWarnings={shouldShowWarning}
      />
    </div>
  );
}

// ❌ BAD: Business Rule with hardcoded values
function escalationBusinessRule(current, previous) {
  // Hardcoded escalation rules
  var ESCALATION_HOURS = 4;
  var CRITICAL_ESCALATION_HOURS = 1;
  var VIP_ESCALATION_HOURS = 2;
  
  if (current.state.changes() && current.state != '6') {
    var hoursOpen = getHoursSinceCreated(current);
    var escalationThreshold = ESCALATION_HOURS;
    
    if (current.priority == '1') {
      escalationThreshold = CRITICAL_ESCALATION_HOURS;
    } else if (current.caller_id.vip) {
      escalationThreshold = VIP_ESCALATION_HOURS;
    }
    
    if (hoursOpen > escalationThreshold) {
      // Hardcoded escalation logic
      notifyManager(current);
    }
  }
}
```

### **Correct Approach - ServiceNow System Properties**
```tsx
// ✅ GOOD: Use ServiceNow System Properties for configuration
function IncidentDashboard() {
  const { data: config, isLoading } = useQuery(
    ['system-config'], 
    () => configService.getSystemProperties([
      'x_your_scope.ui.enable_ai_suggestions',
      'x_your_scope.ui.enable_predictive_assignment', 
      'x_your_scope.ui.max_incidents_per_page',
      'x_your_scope.ui.auto_refresh_interval',
      'x_your_scope.escalation.threshold_hours',
      'x_your_scope.ui.show_sla_warnings'
    ])
  );

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {config?.enable_ai_suggestions && <AISuggestions />}
      {config?.enable_predictive_assignment && <PredictiveAssignment />}
      <IncidentList 
        pageSize={config?.max_incidents_per_page || 25}
        refreshInterval={config?.auto_refresh_interval || 30000}
        showSlaWarnings={config?.show_sla_warnings}
      />
    </div>
  );
}

/*
SERVICENOW DEVELOPER TODO:
Create System Properties for configuration management:

UI Configuration:
- x_your_scope.ui.enable_ai_suggestions (true/false)
- x_your_scope.ui.enable_predictive_assignment (true/false)
- x_your_scope.ui.max_incidents_per_page (integer, default: 25)
- x_your_scope.ui.auto_refresh_interval (integer, default: 30000)
- x_your_scope.ui.show_sla_warnings (true/false)

Business Configuration:
- x_your_scope.escalation.threshold_hours (integer, default: 4)
- x_your_scope.escalation.critical_threshold_hours (integer, default: 1)
- x_your_scope.escalation.vip_threshold_hours (integer, default: 2)

Benefits:
- Business users can modify configuration
- No code changes required for adjustments
- Environment-specific configuration
- Audit trail for configuration changes
- Role-based configuration access
*/

// ✅ GOOD: Flow Designer handles escalation with configurable properties
export class EscalationService extends TableService<Incident> {
  async checkEscalation(incidentId: string): Promise<void> {
    // Simple trigger - Flow Designer handles escalation logic using System Properties
    await this.updateRecord(incidentId, { 
      last_escalation_check: new Date().toISOString() 
    });
    
    /*
    Flow Designer "Escalation Check Flow" uses System Properties:
    - Reads escalation thresholds from System Properties
    - Applies business rules from Decision Builder
    - Sends notifications based on configuration
    - Logs escalation actions for audit
    */
  }
}
```

---

## ❌ Critical Anti-Pattern #5: Not Using ServiceNow's Native Engines

### **The Mistake**
Recreating functionality that ServiceNow provides out-of-the-box through native engines.

### **Wrong Approach - Custom Engines**
```tsx
// ❌ BAD: Custom approval engine instead of using ServiceNow Approval Engine
class CustomApprovalEngine {
  async createApproval(requestId: string, approvers: string[], approvalType: string): Promise<void> {
    // Reinventing the wheel - ServiceNow has this built-in!
    for (const approver of approvers) {
      const approvalRecord = await this.createApprovalRecord({
        document_id: requestId,
        approver: approver,
        state: 'requested',
        due_date: this.calculateDueDate(approvalType)
      });
      
      await this.sendApprovalNotification(approver, approvalRecord);
    }
  }
  
  async processApprovalResponse(approvalId: string, decision: string, comments: string): Promise<void> {
    // Custom approval processing
    const approval = await this.getApproval(approvalId);
    approval.state = decision;
    approval.comments = comments;
    approval.approved = decision === 'approved' ? new Date() : null;
    
    await this.updateApproval(approval);
    
    // Check if all approvals complete
    const allApprovals = await this.getApprovalsForRequest(approval.document_id);
    if (this.areAllApprovalsComplete(allApprovals)) {
      await this.processRequestCompletion(approval.document_id);
    }
  }
}

// ❌ BAD: Custom SLA tracking instead of SLA Engine
class CustomSLATracker {
  async startSLA(recordId: string, slaType: string): Promise<void> {
    const slaDefinition = await this.getSLADefinition(slaType);
    const breachTime = new Date(Date.now() + slaDefinition.duration * 60000);
    
    await this.createSLARecord({
      task: recordId,
      definition: slaDefinition.sys_id,
      start_time: new Date(),
      planned_end_time: breachTime,
      percentage: 0,
      stage: 'in_progress'
    });
    
    // Schedule breach notifications
    this.scheduleSLAWarnings(recordId, breachTime);
  }
  
  async updateSLAProgress(recordId: string, percentage: number): Promise<void> {
    // Custom SLA percentage calculation
    const slaRecord = await this.getSLARecord(recordId);
    slaRecord.percentage = percentage;
    
    if (percentage >= 80) {
      await this.sendSLAWarning(slaRecord);
    }
    
    await this.updateSLARecord(slaRecord);
  }
}
```

### **Correct Approach - Use ServiceNow Native Engines**
```tsx
// ✅ GOOD: Use ServiceNow's built-in engines
export class ServiceNowNativeEnginesService extends TableService<Record> {
  async createRecord(data: any): Promise<Record> {
    // ServiceNow engines handle everything automatically:
    const record = await super.createRecord(data);
    
    /*
    ServiceNow automatically handles:
    
    APPROVAL ENGINE:
    - Creates approvals based on approval rules
    - Routes to appropriate approvers  
    - Manages approval workflows
    - Handles delegation and escalation
    - Tracks approval history
    
    SLA ENGINE:
    - Activates SLAs based on SLA definitions
    - Calculates breach times
    - Tracks SLA percentages
    - Sends breach notifications
    - Handles pause/resume conditions
    
    ASSIGNMENT RULES:
    - Routes records to appropriate groups
    - Handles load balancing
    - Manages skills-based routing
    - Supports escalation chains
    
    NOTIFICATION ENGINE:
    - Sends configured notifications
    - Handles notification preferences
    - Manages delivery methods
    - Tracks notification history
    */
    
    return record;
  }
}

/*
SERVICENOW DEVELOPER TODO:
Configure native ServiceNow engines instead of custom code:

1. APPROVAL ENGINE SETUP:
   - Create approval rules for different record types
   - Configure approval workflows in Flow Designer  
   - Set up approval notifications
   - Define escalation policies

2. SLA ENGINE SETUP:
   - Create SLA definitions with conditions
   - Configure SLA workflows and notifications
   - Set up pause conditions and escalation
   - Define SLA reporting

3. ASSIGNMENT RULES SETUP:
   - Create assignment rules for automatic routing
   - Configure load balancing and skills matching
   - Set up escalation and overflow rules
   - Define assignment notifications

Benefits:
- Platform-native performance and reliability
- Upgrade-safe implementation
- Business user maintainable configuration
- Built-in reporting and analytics
- Comprehensive audit trails
- Integration with other ServiceNow capabilities
*/
```

---

## State Management Anti-Patterns

### **❌ Anti-Pattern: Everything in Global State**

**Wrong Approach:**
```tsx
// ❌ BAD: Putting everything in Zustand global store
const useGlobalStore = create((set, get) => ({
  // Should be local component state
  formData: {},
  currentStep: 1,
  showModal: false,
  validationErrors: {},
  
  // Should be TanStack Query server state  
  incidents: [],
  users: [],
  groups: [],
  priorities: [],
  
  // Actually belongs in global state
  authUser: null,
  authToken: null,
  theme: 'light',
  
  // Unnecessary global actions
  setFormData: (data) => set({ formData: data }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setShowModal: (show) => set({ showModal: show }),
}));
```

**Correct Approach:**
```tsx
// ✅ GOOD: Strategic state placement following our architecture
// Global state - only for truly global concerns
const useAuthStore = create((set) => ({
  authUser: null,
  authToken: null,
  theme: 'light',
  login: () => { /* auth logic */ },
  logout: () => { /* auth logic */ }
}));

// Server state - TanStack Query for ServiceNow data
const useIncidents = (filters) => 
  useQuery(['incidents', filters], () => incidentService.getIncidents(filters));

// Local state - component-specific
function IncidentForm() {
  const [formData, setFormData] = useState({}); // Local form state
  const [currentStep, setCurrentStep] = useState(1); // Local wizard state
  const [showModal, setShowModal] = useState(false); // Local UI state
}
```

---

## Testing Anti-Patterns

### **❌ Anti-Pattern: Not Testing ServiceNow Integration**

**Wrong Approach:**
```tsx
// ❌ BAD: Testing only React logic, ignoring ServiceNow integration
describe('IncidentService', () => {
  it('should format incident data', () => {
    const formatted = formatIncidentData(rawData);
    expect(formatted.priority).toBe('High');
  });
  
  // Missing: Tests for ServiceNow builder integration
  // Missing: Tests for Flow Designer workflows
  // Missing: Tests for Decision Builder logic
  // Missing: Tests for Data Policy validation
});
```

**Correct Approach:**
```tsx
// ✅ GOOD: Test both React logic AND ServiceNow integration
describe('IncidentService Integration', () => {
  it('should create incident and trigger ServiceNow workflows', async () => {
    const incidentData = createMockIncidentData();
    
    // Test the React service call
    const result = await incidentService.createIncident(incidentData);
    
    // Verify ServiceNow builders were triggered
    expect(result.priority).toBeDefined(); // Decision Builder calculated
    expect(result.assignment_group).toBeDefined(); // Assignment Rules applied
    expect(result.sla_due).toBeDefined(); // SLA Engine activated
    
    // Verify workflow execution
    await waitFor(() => {
      expect(mockNotificationService.send).toHaveBeenCalled(); // Flow Designer notifications
    });
  });
  
  it('should handle ServiceNow validation errors', async () => {
    const invalidData = { /* missing required fields */ };
    
    // Should fail due to Data Policy validation
    await expect(
      incidentService.createIncident(invalidData)
    ).rejects.toThrow('Field validation failed');
  });
});
```

---

## Performance Anti-Patterns

### **❌ Anti-Pattern: Ignoring ServiceNow Query Optimization**

**Wrong Approach:**
```tsx
// ❌ BAD: Inefficient ServiceNow queries
function IncidentDashboard() {
  // Fetching all fields for all incidents - inefficient!
  const { data: incidents } = useQuery(['incidents'], () =>
    incidentService.getAllIncidents() // No field selection, no pagination
  );
  
  // Separate queries for related data - should be joined
  const { data: users } = useQuery(['users'], () =>
    userService.getAllUsers() // Loading all users unnecessarily
  );
  
  const { data: groups } = useQuery(['groups'], () =>
    groupService.getAllGroups() // Loading all groups unnecessarily
  );
  
  return (
    <div>
      {incidents?.map(incident => (
        <IncidentCard 
          key={incident.sys_id}
          incident={incident}
          assignedUser={users?.find(u => u.sys_id === incident.assigned_to)}
          assignmentGroup={groups?.find(g => g.sys_id === incident.assignment_group)}
        />
      ))}
    </div>
  );
}
```

**Correct Approach:**
```tsx
// ✅ GOOD: Optimized ServiceNow queries
function IncidentDashboard() {
  // Efficient query with field selection and pagination
  const { data: incidents } = useQuery(
    ['incidents', 'dashboard'],
    () => incidentService.getIncidents({
      fields: [
        'sys_id', 'number', 'short_description', 
        'priority', 'state', 'assigned_to', 'assignment_group'
      ], // Only needed fields
      limit: 50,
      displayValue: 'all' // Gets display_value for reference fields
    })
  );
  
  return (
    <div>
      {incidents?.result.map(incident => (
        <IncidentCard 
          key={incident.sys_id}
          incident={incident}
          // Reference field display_values already included
        />
      ))}
    </div>
  );
}
```

---

## Best Practices Summary

### **✅ Follow ServiceNow Backend Principles**
Always use the **configuration-first decision tree** from [ServiceNow Backend Principles](servicenow-backend-principles.md):

1. **ServiceNow UI Configuration** - Field behavior, validation, access control
2. **Flow Designer** - Workflows, state machines, complex processes
3. **Decision Builder** - Business rules, calculations, routing logic
4. **System Properties** - Configuration and feature flags
5. **Fluent DSL** - ServiceNow metadata when builders don't support
6. **Custom Scripts** - Only as absolute last resort

### **✅ React's Proper Role**
- **UI rendering and user interaction**
- **Form data collection and submission** 
- **Display of ServiceNow data**
- **User experience optimization**
- **Client-side performance**

### **✅ ServiceNow's Proper Role**
- **All business logic execution**
- **Data validation and constraints**
- **Workflow orchestration and automation**
- **Service level management**
- **Security and access control**
- **Audit trails and compliance**

### **❌ Critical Mistakes to Avoid**
- Writing custom code instead of using ServiceNow builders
- Implementing business logic in React components
- Creating custom engines instead of using native ServiceNow capabilities
- Hardcoding configuration that should be in System Properties
- Skipping ServiceNow integration testing
- Ignoring ServiceNow query optimization best practices

---

## Integration with Architecture

### **Related Patterns:**
- **[ServiceNow Backend Principles](servicenow-backend-principles.md)** ⭐ - The correct configuration-first approach
- **[Core Principles](../core-principles.md)** - Foundation hybrid development philosophy
- **[Flow Designer State Machines](flow-designer-state-machines.md)** - Proper workflow implementation
- **[Decision Builder Integration](decision-builder-integration.md)** - Business rules done right

### **Quality Assurance:**
- **[Configuration Governance](configuration-governance.md)** - Managing ServiceNow configurations
- **[Testing Strategy](testing-strategy.md)** - Testing both React and ServiceNow layers
- **[Performance Optimization](performance-optimization.md)** - ServiceNow query optimization

### **Problem Solving:**
- **[Troubleshooting Builder Integration](troubleshooting-builder-integration.md)** - Fix common integration issues

---

## Implementation Roadmap

### **Phase 1: Audit Current Code (Week 1)**
- [ ] **Identify anti-patterns** - Scan codebase for violations
- [ ] **Document current state** - List all custom scripts and complex React logic
- [ ] **Prioritize refactoring** - Critical business logic first
- [ ] **Plan ServiceNow configuration** - Design builder implementations

### **Phase 2: Implement ServiceNow Builders (Week 2-3)**
- [ ] **Create Decision Builder tables** - Replace hardcoded business logic
- [ ] **Configure Flow Designer workflows** - Replace custom workflow code
- [ ] **Set up Data Policies** - Replace React validation logic
- [ ] **Configure System Properties** - Replace hardcoded configuration

### **Phase 3: Refactor React Components (Week 4)**
- [ ] **Simplify React components** - Remove business logic
- [ ] **Update service layer** - Use ServiceNow builders properly
- [ ] **Fix state management** - Strategic state placement
- [ ] **Optimize ServiceNow queries** - Field selection and pagination

### **Phase 4: Testing and Validation (Week 5)**
- [ ] **Test ServiceNow integration** - Verify builder functionality
- [ ] **Performance testing** - Query optimization validation
- [ ] **User acceptance testing** - Business user configuration testing
- [ ] **Documentation updates** - Update configuration documentation

---

*Avoiding these anti-patterns is critical for building maintainable, upgrade-safe ServiceNow applications. Always follow the configuration-first approach from [ServiceNow Backend Principles](servicenow-backend-principles.md) and leverage ServiceNow's platform strengths rather than working against them.*