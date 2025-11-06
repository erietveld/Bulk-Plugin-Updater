# Clean Code Principles Reference

**Purpose:** Essential clean code principles for ServiceNow React development with emphasis on code cleanup  
**Read time:** ~5 minutes  
**Prerequisites:** [Core Principles](../core-principles.md)

---

## Core Clean Code Philosophy

### **The Golden Rule: Clean As You Go**
Always leave code cleaner than you found it. When implementing new solutions, immediately remove the old, unused, or temporary code they replace.

### **ServiceNow Clean Code Mantra**
1. **Remove before adding** - Clean up deprecated code before implementing new solutions
2. **Builder-first, code-last** - Use ServiceNow builders, minimize custom code
3. **One responsibility per component** - Each piece has a single, clear purpose
4. **Explicit over implicit** - Make intentions clear in code and configuration
5. **Fail fast and clearly** - Surface errors quickly with meaningful messages

---

## Code Cleanup Principles

### **Principle 1: Immediate Deprecation Cleanup**

**✅ Do This:**
```tsx
// ✅ GOOD: Clean up old code immediately when implementing new solution
export class IncidentService extends TableService<Incident> {
  async createIncident(data: IncidentData): Promise<Incident> {
    // New Flow Designer approach - old business rule logic removed
    return await this.createRecord(data);
  }
  
  // REMOVED: Old manual priority calculation (now handled by Decision Builder)
  // REMOVED: Old assignment logic (now handled by Assignment Rules)  
  // REMOVED: Old SLA tracking (now handled by SLA Engine)
}

/*
CLEANUP COMPLETED:
✅ Removed calculatePriority() method
✅ Removed assignIncident() manual logic  
✅ Removed startSLATracking() custom implementation
✅ Deleted related helper functions
✅ Updated tests to reflect new approach
✅ Removed old Business Rules from ServiceNow
✅ Deactivated old Assignment Rules
✅ Archived old SLA definitions
*/
```

**❌ Don't Do This:**
```tsx
// ❌ BAD: Leaving old code "just in case"
export class IncidentService extends TableService<Incident> {
  async createIncident(data: IncidentData): Promise<Incident> {
    // New approach
    return await this.createRecord(data);
  }
  
  // ❌ OLD CODE LEFT BEHIND - DELETE THIS
  // private calculatePriorityOld(urgency: string, impact: string): string {
  //   // Old manual calculation - replaced by Decision Builder
  //   // TODO: Remove this once we're sure new approach works
  //   if (urgency === '1' && impact === '1') return '1';
  //   // ... 50 lines of old logic
  // }
  
  // ❌ COMMENTED OUT CODE - DELETE THIS  
  // async assignIncidentOld(id: string, assignee: string): Promise<void> {
  //   // Old assignment logic - now handled by Assignment Rules
  // }
}
```

### **Principle 2: Remove Test/Debug/Stub Code**

**✅ Do This:**
```tsx
// ✅ GOOD: Clean production code
export class FlowService extends ServiceNowService {
  async executeFlow(flowId: string, data: any): Promise<FlowResult> {
    const result = await this.request<FlowResult>(
      `/api/x_your_scope/execute_flow/${flowId}`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    
    return result;
  }
}
```

**❌ Don't Do This:**
```tsx
// ❌ BAD: Leaving test/debug/stub code in production
export class FlowService extends ServiceNowService {
  async executeFlow(flowId: string, data: any): Promise<FlowResult> {
    // ❌ DEBUG CODE - REMOVE BEFORE PRODUCTION
    console.log('DEBUG: Executing flow', flowId, data);
    debugger; // ❌ REMOVE THIS
    
    // ❌ TEST/MOCK CODE - REMOVE THIS
    if (process.env.NODE_ENV === 'development') {
      return { success: true, data: 'mock result' }; // ❌ REMOVE MOCK
    }
    
    // ❌ STUB CODE - IMPLEMENT OR REMOVE
    // TODO: Implement actual flow execution
    // return Promise.resolve({ success: false }); // ❌ REMOVE STUB
    
    const result = await this.request<FlowResult>(
      `/api/x_your_scope/execute_flow/${flowId}`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    
    // ❌ TEMPORARY CODE - REMOVE AFTER TESTING
    // alert('Flow executed successfully!'); // ❌ REMOVE THIS
    
    return result;
  }
}
```

### **Principle 3: ServiceNow Builder Cleanup**

**✅ Do This:**
```tsx
/*
SERVICENOW DEVELOPER TODO - CLEANUP CHECKLIST:

When implementing new Flow Designer solution:
✅ Deactivate old Business Rules that are replaced
✅ Remove old Client Scripts made obsolete  
✅ Archive old Scripted REST APIs replaced by REST-triggered flows
✅ Delete old Script Includes no longer needed
✅ Remove old UI Actions replaced by Flow Designer
✅ Clean up old Assignment Rules superseded by new ones
✅ Archive old SLA Definitions replaced by new ones
✅ Remove old Decision Tables that are obsolete
✅ Update documentation to reflect changes
✅ Notify team of deprecated components

NEVER LEAVE:
❌ Inactive but not deleted old configurations
❌ Commented-out flow steps "for reference"
❌ Unused subflows that were experiments
❌ Test flows in production instance
❌ Old versions of Decision Builder tables
❌ Superseded Assignment Rules (causes conflicts)
*/
```

---

## Clean Code Principles

### **Principle 4: Single Responsibility**

**✅ Do This:**
```tsx
// ✅ GOOD: Each component has one clear responsibility
interface User {
  sys_id: string;
  name: string;
  email: string;
}

interface UserCardProps {
  user: User;
  onClick?: (user: User) => void;
}

// Single responsibility: Display user information
function UserCard({ user, onClick }: UserCardProps) {
  return (
    <div className="user-card" onClick={() => onClick?.(user)}>
      <UserAvatar userId={user.sys_id} />
      <div className="user-info">
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    </div>
  );
}

// Single responsibility: Manage user data
export class UserService extends TableService<User> {
  constructor() {
    super('sys_user');
  }
  
  async getActiveUsers(): Promise<User[]> {
    return await this.getRecords({ active: true });
  }
}

// Single responsibility: User selection logic
export const useUserSelection = () => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  
  const toggleUser = useCallback((user: User) => {
    setSelectedUsers(prev => 
      prev.find(u => u.sys_id === user.sys_id)
        ? prev.filter(u => u.sys_id !== user.sys_id)
        : [...prev, user]
    );
  }, []);
  
  return { selectedUsers, toggleUser };
};
```

**❌ Don't Do This:**
```tsx
// ❌ BAD: Component doing too many things
function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // ❌ Data fetching mixed with UI logic
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const userData = await response.json();
      setUsers(userData);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };
  
  // ❌ Business logic mixed with UI logic
  const filteredUsers = users
    .filter(user => user.name.includes(searchTerm))
    .sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
  
  // ❌ Too much rendering logic in one component
  return (
    <div>
      {/* 100+ lines of mixed UI, business logic, and data management */}
    </div>
  );
}
```

### **Principle 5: Meaningful Names**

**✅ Do This:**
```tsx
// ✅ GOOD: Clear, descriptive names
interface IncidentPriorityCalculationInput {
  urgency: ServiceNowChoice;
  impact: ServiceNowChoice;
  category: ServiceNowChoice;
  isVIPCaller: boolean;
  businessHours: boolean;
}

interface IncidentPriorityCalculationResult {
  calculatedPriority: ServiceNowChoice;
  assignmentGroup: string;
  slaHours: number;
  autoEscalationHours: number;
  requiresManagementApproval: boolean;
  calculationReasoning: string;
}

export class IncidentPriorityCalculationService extends ServiceNowService {
  async calculateIncidentPriority(
    input: IncidentPriorityCalculationInput
  ): Promise<IncidentPriorityCalculationResult> {
    const result = await this.request<IncidentPriorityCalculationResult>(
      '/api/x_your_scope/calculate_incident_priority',
      {
        method: 'POST',
        body: JSON.stringify(input)
      }
    );
    
    return result;
  }
}

// ServiceNow Flow Designer integration
/*
SERVICENOW DEVELOPER TODO:
Flow Name: "Calculate Incident Priority with Business Rules"
REST Endpoint: /api/x_your_scope/calculate_incident_priority
Decision Builder Table: "Incident Priority Calculation Matrix"

Clear naming throughout:
- Flow steps have descriptive names
- Decision table columns are self-documenting  
- Variables use business terminology
- Error messages are user-friendly
*/
```

**❌ Don't Do This:**
```tsx
// ❌ BAD: Unclear, abbreviated names
interface PrioCalcInput {
  urg: any;
  imp: any;
  cat: any;
  vip: boolean;
  bh: boolean;
}

interface PrioResult {
  prio: any;
  grp: string;
  sla: number;
  esc: number;
  appr: boolean;
  reason: string;
}

export class PrioSvc extends ServiceNowService {
  async calcPrio(input: PrioCalcInput): Promise<PrioResult> {
    // ❌ Meaningless variable names
    const resp = await this.request<PrioResult>('/api/x_your_scope/calc', {
      method: 'POST',
      body: JSON.stringify(input)
    });
    
    return resp;
  }
}
```

### **Principle 6: Functions Should Be Small**

**✅ Do This:**
```tsx
// ✅ GOOD: Small, focused functions
export class IncidentService extends TableService<Incident> {
  
  async createIncident(data: IncidentFormData): Promise<Incident> {
    const validatedData = this.validateIncidentData(data);
    const incident = await this.createRecord(validatedData);
    return incident;
  }
  
  private validateIncidentData(data: IncidentFormData): Partial<Incident> {
    if (!data.shortDescription?.trim()) {
      throw new ValidationError('Short description is required');
    }
    
    if (!data.callerId) {
      throw new ValidationError('Caller is required');
    }
    
    return {
      short_description: data.shortDescription.trim(),
      caller_id: data.callerId,
      urgency: data.urgency,
      impact: data.impact,
      category: data.category
    };
  }
}

// React component - small and focused
interface IncidentFormProps {
  onSubmit: (data: IncidentFormData) => Promise<void>;
  initialData?: Partial<IncidentFormData>;
}

function IncidentForm({ onSubmit, initialData }: IncidentFormProps) {
  const { formData, handleChange, handleSubmit, errors } = useIncidentForm({
    initialData,
    onSubmit
  });
  
  return (
    <form onSubmit={handleSubmit}>
      <IncidentFormFields 
        data={formData} 
        onChange={handleChange} 
        errors={errors} 
      />
      <IncidentFormActions />
    </form>
  );
}
```

**❌ Don't Do This:**
```tsx
// ❌ BAD: Large, multi-purpose functions
export class IncidentService extends TableService<Incident> {
  
  async createIncident(data: IncidentFormData): Promise<Incident> {
    // ❌ 200+ lines doing everything in one function
    
    // Validation logic (should be separate function)
    if (!data.shortDescription || data.shortDescription.trim().length === 0) {
      throw new Error('Short description is required');
    }
    if (!data.callerId) {
      throw new Error('Caller is required');
    }
    // ... 50 more validation lines
    
    // Priority calculation logic (should be in Decision Builder)
    let priority = '4';
    if (data.urgency === '1' && data.impact === '1') {
      priority = '1';
    } else if (data.urgency === '1' || data.impact === '1') {
      priority = '2';
    }
    // ... 30 more priority calculation lines
    
    // Assignment logic (should be Assignment Rules)
    let assignmentGroup = '';
    if (data.category === 'hardware') {
      assignmentGroup = 'hardware_support';
    } else if (data.category === 'software') {
      assignmentGroup = 'software_support';
    }
    // ... 40 more assignment lines
    
    // SLA logic (should be SLA Engine)
    let slaHours = 72;
    if (priority === '1') {
      slaHours = 4;
    } else if (priority === '2') {
      slaHours = 12;
    }
    // ... 30 more SLA lines
    
    // Notification logic (should be Flow Designer)
    if (priority === '1') {
      await this.notifyManagement(data);
    }
    await this.notifyCaller(data);
    await this.notifyAssignmentGroup(assignmentGroup);
    // ... 40 more notification lines
    
    // Finally create the record
    const incident = await this.createRecord({
      short_description: data.shortDescription,
      caller_id: data.callerId,
      urgency: data.urgency,
      impact: data.impact,
      priority: priority,
      assignment_group: assignmentGroup
    });
    
    return incident;
  }
}
```

### **Principle 7: Error Handling Should Be Clean**

**✅ Do This:**
```tsx
// ✅ GOOD: Clean error handling with specific error types
export class ServiceNowValidationError extends Error {
  constructor(
    public field: string,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ServiceNowValidationError';
  }
}

export class ServiceNowPermissionError extends Error {
  constructor(
    public operation: string,
    public table: string,
    message: string
  ) {
    super(message);
    this.name = 'ServiceNowPermissionError';
  }
}

export class IncidentService extends TableService<Incident> {
  async createIncident(data: IncidentFormData): Promise<Incident> {
    try {
      return await this.createRecord(data);
    } catch (error) {
      if (error.status === 400) {
        throw new ServiceNowValidationError(
          error.field_errors?.[0]?.field || 'unknown',
          'validation_failed',
          `Validation failed: ${error.message}`
        );
      }
      
      if (error.status === 403) {
        throw new ServiceNowPermissionError(
          'create',
          'incident',
          'You do not have permission to create incidents'
        );
      }
      
      // Re-throw unexpected errors
      throw error;
    }
  }
}

// React error handling
function IncidentForm({ onSubmit }: IncidentFormProps) {
  const [error, setError] = useState<string>('');
  
  const handleSubmit = async (data: IncidentFormData) => {
    try {
      setError('');
      await onSubmit(data);
    } catch (error) {
      if (error instanceof ServiceNowValidationError) {
        setError(`Validation error in ${error.field}: ${error.message}`);
      } else if (error instanceof ServiceNowPermissionError) {
        setError('You do not have permission to perform this action');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };
  
  return (
    <form>
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      {/* Form fields */}
    </form>
  );
}
```

**❌ Don't Do This:**
```tsx
// ❌ BAD: Poor error handling
export class IncidentService extends TableService<Incident> {
  async createIncident(data: IncidentFormData): Promise<Incident> {
    try {
      return await this.createRecord(data);
    } catch (error) {
      // ❌ Swallowing errors
      console.log('Error creating incident:', error);
      return null; // ❌ Returning null instead of handling error
    }
  }
  
  async getIncident(id: string): Promise<Incident> {
    try {
      return await this.getRecord(id);
    } catch (error) {
      // ❌ Generic error handling
      throw new Error('Something went wrong'); // ❌ Lost original error context
    }
  }
  
  async updateIncident(id: string, data: Partial<Incident>): Promise<Incident> {
    // ❌ No error handling at all
    return await this.updateRecord(id, data);
  }
}
```

---

## ServiceNow-Specific Clean Code Principles

### **Principle 8: Configuration Over Code**

**✅ Do This:**
```tsx
// ✅ GOOD: Minimal code, maximum configuration
export class IncidentService extends TableService<Incident> {
  async createIncident(data: IncidentFormData): Promise<Incident> {
    // Clean: Just create record, let ServiceNow builders handle logic
    return await this.createRecord(data);
  }
}

/*
SERVICENOW DEVELOPER TODO:
Clean ServiceNow Configuration:

✅ Flow Designer: "Incident Creation Workflow"
   - Clear step names: "Calculate Priority", "Assign to Group", "Send Notifications"
   - Proper error handling at each step
   - Documented business logic in flow description

✅ Decision Builder: "Incident Priority Matrix"
   - Self-documenting column names
   - Complete rule coverage
   - Clear default behavior

✅ Assignment Rules: "Incident Assignment"
   - Logical rule order (10, 20, 30...)
   - Clear rule names and conditions
   - Proper fallback assignments

REMOVE OLD CODE:
❌ Delete old Business Rules that duplicate Flow Designer logic
❌ Remove old Client Scripts replaced by UI Policies
❌ Archive old Script Includes made obsolete by builders
*/
```

### **Principle 9: Clean ServiceNow Naming Conventions**

**✅ Do This:**
```tsx
/*
SERVICENOW DEVELOPER TODO:
Clean Naming Conventions:

Flow Designer:
✅ "Calculate Incident Priority" (not "calc_inc_prio")
✅ "Send Assignment Notification" (not "notify_assign")
✅ "Escalate to Management" (not "escalate_mgmt")

Decision Builder Tables:
✅ "Incident Priority Matrix" (not "inc_priority_table")
✅ "Assignment Rules Logic" (not "assign_logic")
✅ "SLA Determination Rules" (not "sla_rules")

REST Endpoints:
✅ /api/x_your_scope/calculate_incident_priority
✅ /api/x_your_scope/bulk_assign_incidents
✅ /api/x_your_scope/generate_sla_report

System Properties:
✅ x_your_scope.incident.enable_ai_suggestions
✅ x_your_scope.ui.max_incidents_per_page
✅ x_your_scope.sla.escalation_threshold_hours
*/
```

---

## Clean Code Checklist

### **Before Every Commit**
- [ ] **Remove all commented-out code**
- [ ] **Delete unused imports and variables**
- [ ] **Remove debug statements and console.logs**
- [ ] **Clean up TODO comments or convert to tickets**
- [ ] **Remove test/mock data from production code**
- [ ] **Delete unused functions and components**
- [ ] **Verify all functions have single responsibility**
- [ ] **Check that names are meaningful and clear**
- [ ] **Ensure error handling is specific and helpful**
- [ ] **Validate that ServiceNow builders are used appropriately**

### **Before Every ServiceNow Deployment**
- [ ] **Deactivate old Business Rules replaced by Flow Designer**
- [ ] **Remove old Client Scripts made obsolete by UI Policies**
- [ ] **Delete old Script Includes replaced by builders**
- [ ] **Archive old Assignment Rules superseded by new ones**
- [ ] **Clean up old SLA Definitions replaced by new ones**
- [ ] **Remove test flows from production instance**
- [ ] **Delete unused Decision Builder tables**
- [ ] **Clean up old System Properties**
- [ ] **Remove old REST API endpoints**
- [ ] **Update documentation to reflect changes**

### **Monthly Cleanup Review**
- [ ] **Audit and remove unused ServiceNow builders**
- [ ] **Review and clean up old React components**
- [ ] **Remove deprecated dependencies**
- [ ] **Clean up old test files**
- [ ] **Archive completed TODO items**
- [ ] **Remove unused utility functions**
- [ ] **Clean up old style definitions**
- [ ] **Remove unused type definitions**
- [ ] **Clean up old configuration files**
- [ ] **Update and clean documentation**

---

## Clean Code Quotes to Remember

> **"Clean code always looks like it was written by someone who cares."** - Robert C. Martin

> **"Any fool can write code that a computer can understand. Good programmers write code that humans can understand."** - Martin Fowler

> **"Code is read much more often than it is written."** - Guido van Rossum

> **"The first rule of functions is that they should be small. The second rule of functions is that they should be smaller than that."** - Robert C. Martin

> **"Clean code is not written by following a set of rules. You don't become a software craftsman by learning a list of heuristics. Professionalism and craftsmanship come from values and discipline."** - Robert C. Martin

---

## Next Steps

**Apply clean code principles:**
- [Core Principles](../core-principles.md) - Fundamental development philosophy
- [Component Reusability](../component-reusability.md) - Clean component design
- [ServiceNow Backend Principles](servicenow-backend-principles.md) - Clean configuration approach

**Maintain code quality:**
- [Testing Strategy](testing-strategy.md) - Test clean code thoroughly
- [Configuration Governance](configuration-governance.md) - Govern clean configurations
- [Quick Checklist](../reference/quick-checklist.md) - Quality gates for deployment

---

*Clean code is not just about following rules—it's about caring for the codebase, your teammates, and future maintainers. Always clean up deprecated, unused, or temporary code when implementing new solutions.*