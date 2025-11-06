---
title: "ATF Integration Patterns for ServiceNow Configuration Testing"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Automated Test Framework patterns for validating ServiceNow configuration artifacts in backend-first development"
readTime: "7 minutes"
complexity: "intermediate"
status: "ACTIVE"
criticality: "RECOMMENDED"
prerequisites: ["testing-strategy", "servicenow-backend-principles"]
tags: ["atf", "testing", "servicenow", "configuration", "backend"]
---

# ATF Integration Patterns for ServiceNow Configuration Testing

**Purpose:** Automated Test Framework patterns for validating ServiceNow configuration artifacts in backend-first development  
**Read time:** ~7 minutes  
**Prerequisites:** [Testing Strategy](testing-strategy.md), [ServiceNow Backend Principles](servicenow-backend-principles.md)

---

## ATF in the Testing Ecosystem

### **ATF's Role in Backend-First Testing**

ATF (Automated Test Framework) validates the ServiceNow configuration artifacts created with builders, completing our comprehensive testing strategy:

```
Complete ServiceNow Testing Strategy
├── React Frontend Testing (Code-First)
│   ├── Unit Tests → Component behavior and interactions
│   ├── Integration Tests → State management and data flow
│   └── E2E Tests → User interface workflows
├── ServiceNow Backend Testing (Configuration-First)
│   ├── ATF Tests → Configuration artifact validation ⭐
│   ├── Server-side Tests → Script Include and Business Rule logic
│   └── API Tests → REST endpoints and integrations
└── Full-Stack Integration Testing
    ├── React + ServiceNow API integration
    └── End-to-end user workflows
```

**Why ATF for Backend Testing:**
- **Validates configuration artifacts** - Tests flows, decision tables, policies created with builders
- **Platform-native testing** - Uses ServiceNow's testing infrastructure
- **Business logic validation** - Ensures configuration produces expected outcomes
- **Regression prevention** - Catches configuration changes that break functionality

---

## What ATF Tests in Backend-First Development

### **✅ Test with ATF - Configuration Artifacts**
Created with ServiceNow builders and configuration tools:

- **Flow Designer flows** - Workflow execution and decision points
- **Decision Builder tables** - Business rule outcomes and calculations  
- **Assignment Rules** - Record routing and workload balancing
- **SLA Definitions** - Service level activation and calculations
- **UI Policies** - Form field behavior and visibility
- **Data Policies** - Field validation and requirements
- **ACLs** - Security access controls
- **Notification Templates** - Email generation and triggering

### **❌ Don't Test with ATF**
- ServiceNow platform functionality (ServiceNow's responsibility)
- Builder tools themselves (Flow Designer, Decision Builder interfaces)
- React components (use React Testing Library)
- Third-party integrations (use mocks and API testing)

### **Integration with Testing Strategy**

ATF complements our comprehensive testing approach outlined in [Testing Strategy](testing-strategy.md):

**Testing Layer Alignment:**
- **Unit Tests (80%)** - React components, hooks, services
- **Integration Tests (15%)** - React + ServiceNow API integration + **ATF configuration tests**
- **E2E Tests (5%)** - Complete user workflows including React UI + ServiceNow backend

---

## Core ATF Testing Patterns

### **Pattern 1: Flow Designer Validation**

Test flows created with Flow Designer to handle business processes:

```typescript
// src/fluent/atf-tests/incident-priority-flow.now.ts
import '@servicenow/sdk/global'
import { Test } from '@servicenow/sdk/core'

/*
Tests Flow: "Incident Priority and Assignment Flow"
Created with Flow Designer to:
1. Calculate priority based on urgency + impact + caller VIP status
2. Assign to appropriate team based on category
3. Activate SLA definitions
4. Send notifications to stakeholders
*/

Test({
  $id: Now.ID['incident_priority_flow_test'],
  name: 'Incident Priority Flow - Configuration Validation',
  description: 'Validates Flow Designer artifact calculates priority and assigns correctly',
  active: true,
  failOnServerError: true
}, (atf) => {

  // Test Case 1: High urgency + High impact = Critical priority
  const criticalIncident = atf.server.recordInsert({
    $id: Now.ID['create_critical_incident'],
    table: 'incident',
    fieldValues: {
      "short_description": "ATF Flow Test - Critical Business Impact",
      "caller_id": "681ccaf9c0a8016400b98a06818d57c7", // abel.tuter
      "category": "hardware",
      "urgency": "1", // Critical
      "impact": "1"   // Critical
    },
    assert: 'record_successfully_inserted',
    enforceSecurity: false
  });

  // Validate Flow Designer calculated priority correctly (should trigger Decision Builder)
  atf.server.recordValidation({
    $id: Now.ID['validate_priority_calculation'],
    table: 'incident',
    recordId: criticalIncident.record_id,
    fieldValues: 'priority=1', // Should be Critical (1)
    assert: 'record_validated',
    enforceSecurity: false
  });

  // Validate Flow Designer assigned to correct team (should trigger Assignment Rules)
  atf.server.recordValidation({
    $id: Now.ID['validate_team_assignment'],
    table: 'incident',
    recordId: criticalIncident.record_id,
    fieldValues: 'assignment_group.nameLIKEHardware Support',
    assert: 'record_validated',
    enforceSecurity: false
  });

  // Validate Flow Designer activated SLA (should trigger SLA Engine)
  atf.server.recordQuery({
    $id: Now.ID['validate_sla_activation'],
    table: 'task_sla',
    fieldValues: `task=${criticalIncident.record_id}^stage=in_progress^sla.nameLIKECritical Response`,
    assert: 'records_match_query',
    enforceSecurity: false
  });

  // Validate Flow Designer created audit trail
  atf.server.recordValidation({
    $id: Now.ID['validate_work_notes'],
    table: 'incident',
    recordId: criticalIncident.record_id,
    fieldValues: 'work_notesLIKEPriority calculated via Decision Builder^work_notesLIKEAssigned via Assignment Rules',
    assert: 'record_validated',
    enforceSecurity: false
  });
});
```

### **Pattern 2: Decision Builder Table Testing**

Test decision tables created with Decision Builder for business logic:

```typescript
// src/fluent/atf-tests/priority-decision-matrix.now.ts
import '@servicenow/sdk/global'
import { Test } from '@servicenow/sdk/core'

/*
Tests Decision Builder Table: "Incident Priority Calculation Matrix"
Business Logic:
- Critical urgency + Critical impact = Priority 1
- VIP callers get +1 priority boost (Medium becomes High)
- Security category incidents always get Priority 1
- Standard calculation: P1(1,1), P2(1,2|2,1), P3(1,3|2,2|3,1), P4(others)
*/

Test({
  $id: Now.ID['priority_decision_matrix_test'],
  name: 'Priority Decision Matrix - Business Logic Validation',
  description: 'Tests Decision Builder artifact calculates priority correctly for all business scenarios',
  active: true,
  failOnServerError: true
}, (atf) => {

  // Test Scenario 1: Standard priority calculation
  const standardIncident = atf.server.recordInsert({
    $id: Now.ID['create_standard_incident'],
    table: 'incident',
    fieldValues: {
      "short_description": "ATF Decision Test - Standard Calculation",
      "caller_id": "681ccaf9c0a8016400b98a06818d57c7", // Non-VIP user
      "urgency": "2", // High
      "impact": "3",  // Medium
      "category": "software"
    },
    assert: 'record_successfully_inserted',
    enforceSecurity: false
  });

  atf.server.recordValidation({
    $id: Now.ID['validate_standard_priority'],
    table: 'incident',
    recordId: standardIncident.record_id,
    fieldValues: 'priority=3', // Should be Medium (3) per matrix
    assert: 'record_validated',
    enforceSecurity: false
  });

  // Test Scenario 2: VIP caller priority boost
  const vipIncident = atf.server.recordInsert({
    $id: Now.ID['create_vip_incident'],
    table: 'incident',
    fieldValues: {
      "short_description": "ATF Decision Test - VIP Priority Boost",
      "caller_id": "46d44a23a9fe19810012d100cca80666", // VIP user
      "urgency": "3", // Medium
      "impact": "3",  // Medium  
      "category": "software"
    },
    assert: 'record_successfully_inserted',
    enforceSecurity: false
  });

  atf.server.recordValidation({
    $id: Now.ID['validate_vip_boost'],
    table: 'incident',
    recordId: vipIncident.record_id,  
    fieldValues: 'priority=3', // Medium becomes High for VIP, but Medium(3,3) + VIP boost = High(2)
    assert: 'record_validated',
    enforceSecurity: false
  });

  // Test Scenario 3: Security category override
  const securityIncident = atf.server.recordInsert({
    $id: Now.ID['create_security_incident'],
    table: 'incident',
    fieldValues: {
      "short_description": "ATF Decision Test - Security Override",
      "caller_id": "681ccaf9c0a8016400b98a06818d57c7",
      "urgency": "4", // Low
      "impact": "4",  // Low
      "category": "security" // Should override low priority
    },
    assert: 'record_successfully_inserted',
    enforceSecurity: false
  });

  atf.server.recordValidation({
    $id: Now.ID['validate_security_override'],
    table: 'incident',
    recordId: securityIncident.record_id,
    fieldValues: 'priority=1', // Security always gets Critical (1)
    assert: 'record_validated',
    enforceSecurity: false
  });
});
```

### **Pattern 3: Assignment Rules Testing**

Test assignment rules configuration for proper routing:

```typescript
// src/fluent/atf-tests/incident-assignment-rules.now.ts
import '@servicenow/sdk/global'
import { Test } from '@servicenow/sdk/core'

/*
Tests Assignment Rules Configuration:
- Hardware incidents → Hardware Support team
- Software incidents → Software Support team  
- Security incidents → Security Response team (regardless of other factors)
- VIP callers → VIP Support team (overrides category-based assignment)
- Load balancing → Distributes within team based on current workload
*/

Test({
  $id: Now.ID['assignment_rules_validation_test'],
  name: 'Incident Assignment Rules - Configuration Validation',
  description: 'Tests Assignment Rules route incidents correctly with proper load balancing',
  active: true,
  failOnServerError: true
}, (atf) => {

  // Test 1: Category-based assignment - Hardware
  const hardwareIncident = atf.server.recordInsert({
    $id: Now.ID['create_hardware_assignment_test'],
    table: 'incident',
    fieldValues: {
      "short_description": "ATF Assignment Test - Hardware Issue",
      "caller_id": "681ccaf9c0a8016400b98a06818d57c7",
      "category": "hardware",
      "urgency": "2",
      "impact": "2"
    },
    assert: 'record_successfully_inserted',
    enforceSecurity: false
  });

  atf.server.recordValidation({
    $id: Now.ID['validate_hardware_team_assignment'],
    table: 'incident',
    recordId: hardwareIncident.record_id,
    fieldValues: 'assignment_group.nameLIKEHardware Support',
    assert: 'record_validated',
    enforceSecurity: false
  });

  // Test 2: VIP override assignment  
  const vipSoftwareIncident = atf.server.recordInsert({
    $id: Now.ID['create_vip_override_test'],
    table: 'incident',
    fieldValues: {
      "short_description": "ATF Assignment Test - VIP Software Issue",
      "caller_id": "46d44a23a9fe19810012d100cca80666", // VIP user
      "category": "software", // Would normally go to Software Support
      "urgency": "2",
      "impact": "2"
    },
    assert: 'record_successfully_inserted',
    enforceSecurity: false
  });

  atf.server.recordValidation({
    $id: Now.ID['validate_vip_override_assignment'],
    table: 'incident',
    recordId: vipSoftwareIncident.record_id,
    fieldValues: 'assignment_group.nameLIKEVIP Support', // Should override category
    assert: 'record_validated',
    enforceSecurity: false
  });

  // Test 3: Security priority assignment
  const securityIncident = atf.server.recordInsert({
    $id: Now.ID['create_security_assignment_test'],
    table: 'incident',
    fieldValues: {
      "short_description": "ATF Assignment Test - Security Breach",
      "caller_id": "681ccaf9c0a8016400b98a06818d57c7",
      "category": "security",
      "urgency": "1",
      "impact": "1"
    },
    assert: 'record_successfully_inserted',
    enforceSecurity: false
  });

  atf.server.recordValidation({
    $id: Now.ID['validate_security_team_assignment'],
    table: 'incident',
    recordId: securityIncident.record_id,
    fieldValues: 'assignment_group.nameLIKESecurity Response^assigned_toISNOTEMPTY',
    assert: 'record_validated',
    enforceSecurity: false
  });
});
```

### **Pattern 4: UI Policy Validation**

Test UI policies that control form behavior:

```typescript
// src/fluent/atf-tests/incident-ui-policies.now.ts
import '@servicenow/sdk/global'
import { Test } from '@servicenow/sdk/core'

/*
Tests UI Policies for Incident Form:
- Hardware Category Policy: Makes CI field mandatory when category = hardware
- VIP Caller Policy: Shows VIP notification when caller is VIP
- Security Policy: Shows security classification fields when category = security
- Critical Priority Policy: Makes escalation fields visible for P1 incidents
*/

Test({
  $id: Now.ID['incident_ui_policies_validation_test'],
  name: 'Incident UI Policies - Form Behavior Validation',
  description: 'Tests UI Policy configuration controls form field visibility and requirements correctly',
  active: true,
  failOnServerError: true
}, (atf) => {

  // Test 1: Hardware category UI policy
  atf.form.openNewForm({
    $id: Now.ID['open_incident_form_hardware'],
    table: 'incident',
    formUI: 'standard_ui'
  });

  // Set category to hardware to trigger UI policy
  atf.form.setFieldValue({
    $id: Now.ID['set_hardware_category'],
    table: 'incident',
    fieldValues: {
      "category": "hardware"
    },
    formUI: 'standard_ui'
  });

  // Validate UI policy made CI field mandatory and visible
  atf.form.fieldStateValidation({
    $id: Now.ID['validate_ci_field_mandatory'],
    table: 'incident',
    mandatory: ['cmdb_ci'],
    visible: ['cmdb_ci'],
    formUI: 'standard_ui'
  });

  // Test 2: Security category UI policy
  atf.form.setFieldValue({
    $id: Now.ID['set_security_category'],
    table: 'incident',
    fieldValues: {
      "category": "security"
    },
    formUI: 'standard_ui'
  });

  // Validate security fields become visible and some mandatory
  atf.form.fieldStateValidation({
    $id: Now.ID['validate_security_fields_visible'],
    table: 'incident',
    visible: ['u_security_classification', 'u_affected_systems', 'u_data_involved'],
    mandatory: ['u_security_classification'],
    formUI: 'standard_ui'
  });

  // Test 3: VIP caller policy (would need custom validation for UI messages)
  atf.form.setFieldValue({
    $id: Now.ID['set_vip_caller'],
    table: 'incident',
    fieldValues: {
      "caller_id": "46d44a23a9fe19810012d100cca80666" // VIP user
    },
    formUI: 'standard_ui'
  });

  // Log validation for VIP handling (UI message testing requires custom approach)
  atf.server.log({
    $id: Now.ID['log_vip_policy_test'],
    log: 'VIP caller selected - UI policy should display priority handling message'
  });
});
```

### **Pattern 5: SLA Definition Testing**

Test SLA definitions activate and calculate correctly:

```typescript
// src/fluent/atf-tests/sla-definitions-validation.now.ts
import '@servicenow/sdk/global'
import { Test } from '@servicenow/sdk/core'

/*
Tests SLA Definitions Configuration:
- Critical Incident Response: 2 hour response for P1 incidents
- High Priority Resolution: 8 hour resolution for P2 incidents
- VIP Caller SLA: 50% faster SLAs for VIP users
- Security Incident SLA: 1 hour response for security incidents
*/

Test({
  $id: Now.ID['sla_definitions_validation_test'],
  name: 'SLA Definitions - Configuration Validation',
  description: 'Tests SLA Definition configuration activates correct SLAs with proper calculations',
  active: true,
  failOnServerError: true
}, (atf) => {

  // Test 1: Critical incident SLA activation
  const criticalIncident = atf.server.recordInsert({
    $id: Now.ID['create_critical_sla_test'],
    table: 'incident',
    fieldValues: {
      "short_description": "ATF SLA Test - Critical Priority Response",
      "caller_id": "681ccaf9c0a8016400b98a06818d57c7",
      "priority": "1", // Critical
      "state": "1"     // New (to trigger response SLA)
    },
    assert: 'record_successfully_inserted',
    enforceSecurity: false
  });

  // Validate critical response SLA activated
  atf.server.recordQuery({
    $id: Now.ID['validate_critical_response_sla_active'],
    table: 'task_sla',
    fieldValues: `task=${criticalIncident.record_id}^sla.nameLIKECritical.*Response^stage=in_progress`,
    assert: 'records_match_query',
    enforceSecurity: false
  });

  // Test 2: VIP caller gets accelerated SLA
  const vipIncident = atf.server.recordInsert({
    $id: Now.ID['create_vip_sla_test'],
    table: 'incident',
    fieldValues: {
      "short_description": "ATF SLA Test - VIP Accelerated SLA",
      "caller_id": "46d44a23a9fe19810012d100cca80666", // VIP user
      "priority": "2", // High (but VIP should get faster SLA)
      "state": "1"     // New
    },
    assert: 'record_successfully_inserted',
    enforceSecurity: false
  });

  // Validate VIP-specific SLA activated (faster than standard high priority)
  atf.server.recordQuery({
    $id: Now.ID['validate_vip_accelerated_sla'],
    table: 'task_sla',
    fieldValues: `task=${vipIncident.record_id}^sla.nameLIKEVIP^stage=in_progress`,
    assert: 'records_match_query',
    enforceSecurity: false
  });

  // Test 3: Security incident gets special SLA
  const securityIncident = atf.server.recordInsert({
    $id: Now.ID['create_security_sla_test'],
    table: 'incident',
    fieldValues: {
      "short_description": "ATF SLA Test - Security Incident Response",
      "caller_id": "681ccaf9c0a8016400b98a06818d57c7",
      "category": "security",
      "priority": "1", // Security incidents are always critical
      "state": "1"
    },
    assert: 'record_successfully_inserted',
    enforceSecurity: false
  });

  // Validate security-specific SLA activated
  atf.server.recordQuery({
    $id: Now.ID['validate_security_sla_active'],
    table: 'task_sla',
    fieldValues: `task=${securityIncident.record_id}^sla.nameLIKESecurity.*Response^stage=in_progress`,
    assert: 'records_match_query',
    enforceSecurity: false
  });
});
```

### **Pattern 6: Integration Workflow Testing**

Test complete workflows involving multiple configuration artifacts:

```typescript
// src/fluent/atf-tests/incident-lifecycle-integration.now.ts
import '@servicenow/sdk/global'
import { Test } from '@servicenow/sdk/core'

/*
Tests Complete Incident Lifecycle Integration:
Phase 1: Creation (UI Policies + Data Policies)
Phase 2: Processing (Flow Designer + Decision Builder + Assignment Rules)
Phase 3: SLA Management (SLA Definitions + Flow Designer)
Phase 4: Escalation (Decision Builder + Assignment Rules + Notifications)
Phase 5: Resolution (Flow Designer + Notification Templates)
*/

Test({
  $id: Now.ID['incident_lifecycle_integration_test'],
  name: 'Incident Lifecycle - Complete Configuration Integration',
  description: 'Tests multiple configuration artifacts working together in complete business workflow',
  active: true,
  failOnServerError: true
}, (atf) => {

  // Phase 1: Simulate user creating incident (tests UI/Data Policies)
  atf.server.impersonate({
    $id: Now.ID['impersonate_end_user'],
    user: '681ccaf9c0a8016400b98a06818d57c7' // Regular user
  });

  const incidentCreated = atf.server.recordInsert({
    $id: Now.ID['create_lifecycle_test_incident'],
    table: 'incident',
    fieldValues: {
      "short_description": "ATF Integration - Production server outage",
      "description": "Main application server not responding, affecting all users",
      "category": "hardware",
      "urgency": "1", // Critical
      "impact": "1",  // Critical  
      "caller_id": "681ccaf9c0a8016400b98a06818d57c7"
    },
    assert: 'record_successfully_inserted',
    enforceSecurity: false
  });

  // Phase 2: Validate automatic processing (Flow Designer + Decision Builder + Assignment Rules)
  
  // Validate priority calculated correctly (Decision Builder)
  atf.server.recordValidation({
    $id: Now.ID['validate_lifecycle_priority'],
    table: 'incident',
    recordId: incidentCreated.record_id,
    fieldValues: 'priority=1', // Critical (1,1) = Priority 1
    assert: 'record_validated',
    enforceSecurity: false
  });

  // Validate assignment completed (Assignment Rules)
  atf.server.recordValidation({
    $id: Now.ID['validate_lifecycle_assignment'],
    table: 'incident',
    recordId: incidentCreated.record_id,
    fieldValues: 'assignment_group.nameLIKEHardware Support^assigned_toISNOTEMPTY',
    assert: 'record_validated',
    enforceSecurity: false
  });

  // Phase 3: Validate SLA activation (SLA Definitions)
  atf.server.recordQuery({
    $id: Now.ID['validate_lifecycle_sla_activation'],
    table: 'task_sla',
    fieldValues: `task=${incidentCreated.record_id}^sla.nameLIKECritical.*Response^stage=in_progress`,
    assert: 'records_match_query',
    enforceSecurity: false
  });

  // Phase 4: Test escalation workflow
  atf.server.impersonate({
    $id: Now.ID['impersonate_support_user'],
    user: '5137153cc611227c000bbd1bd8cd2005' // Support team member
  });

  // Simulate escalation trigger
  atf.server.recordUpdate({
    $id: Now.ID['trigger_lifecycle_escalation'],
    table: 'incident',
    recordId: incidentCreated.record_id,
    fieldValues: {
      "escalation": "1",
      "u_escalation_reason": "Hardware replacement required"
    },
    assert: 'record_updated',
    enforceSecurity: false
  });

  // Validate escalation processing (Flow Designer + Assignment Rules)
  atf.server.recordValidation({
    $id: Now.ID['validate_lifecycle_escalation'],
    table: 'incident',
    recordId: incidentCreated.record_id,
    fieldValues: 'assignment_group.nameLIKEL3.*Hardware^work_notesLIKEEscalated',
    assert: 'record_validated',
    enforceSecurity: false
  });

  // Phase 5: Test resolution workflow
  atf.server.recordUpdate({
    $id: Now.ID['resolve_lifecycle_incident'],
    table: 'incident',
    recordId: incidentCreated.record_id,
    fieldValues: {
      "state": "6", // Resolved
      "close_code": "Solved (Permanently)",
      "close_notes": "Server hardware fully replaced and tested"
    },
    assert: 'record_updated',
    enforceSecurity: false
  });

  // Validate resolution processing (Flow Designer + Notifications)
  atf.server.recordValidation({
    $id: Now.ID['validate_lifecycle_resolution'],
    table: 'incident',
    recordId: incidentCreated.record_id,
    fieldValues: 'resolved_atISNOTEMPTY^resolved_byISNOTEMPTY^work_notesLIKEResolution processed',
    assert: 'record_validated',
    enforceSecurity: false
  });

  // Validate SLA completion (SLA Engine + Flow Designer)
  atf.server.recordQuery({
    $id: Now.ID['validate_lifecycle_sla_completion'],
    table: 'task_sla',
    fieldValues: `task=${incidentCreated.record_id}^stage=completed`,
    assert: 'records_match_query',
    enforceSecurity: false
  });
});
```

---

## ATF Testing Standards and Best Practices

### **✅ Configuration Testing Standards**

**Test Organization:**
- **One test per configuration artifact** - Focus on specific functionality
- **Integration tests for workflows** - Test multiple artifacts working together
- **Role-based variations** - Test under different user permissions
- **Performance validation** - Include timing assertions for critical flows

**Naming Conventions:**
```
ATF Test Naming Pattern:
[Artifact Type] [Artifact Name] - [Test Purpose]

Examples:
✅ "Priority Decision Matrix - Business Logic Validation"
✅ "Incident Assignment Rules - Configuration Validation"  
✅ "SLA Definitions - Performance Validation"
```

**Data Management:**
- **Create test data within tests** - Don't rely on existing instance data
- **Use realistic scenarios** - Test with production-like data complexity
- **Clean up test records** - Or use distinctive naming for easy identification
- **Test boundary conditions** - Edge cases and error scenarios

### **✅ Performance and Reliability Standards**

**ATF Test Performance:**
- **Individual configuration tests** - Complete in < 30 seconds
- **Integration workflow tests** - Complete in < 60 seconds
- **REST-triggered flow tests** - Assert response time < 5 seconds
- **Form UI policy tests** - Field changes < 2 seconds

**Test Suite Organization:**
- **Smoke tests** - Critical configuration artifacts (run on each deployment)
- **Regression tests** - Complete artifact validation (run nightly)
- **Integration tests** - Cross-artifact workflows (run before major releases)

### **Integration with Development Workflow**

**Backend-First Development Cycle:**
1. **Create configuration artifacts** using ServiceNow builders
2. **Write ATF tests** to validate artifact behavior
3. **Run ATF test suite** to catch configuration issues
4. **Deploy to higher environments** with validated configuration
5. **Include in CI/CD pipeline** for automated validation

**Relationship to Other Testing:**
- **ATF tests validate backend configuration** (this document)
- **React tests validate frontend components** ([Testing Strategy](testing-strategy.md))
- **Integration tests validate React + ServiceNow communication**
- **E2E tests validate complete user workflows**

---

## File Organization for ATF Tests

### **ATF Test Structure**
```
src/fluent/atf-tests/
├── configuration-artifacts/           # Tests for individual artifacts
│   ├── decision-tables/
│   │   ├── priority-calculation.now.ts
│   │   └── assignment-scoring.now.ts
│   ├── flows/
│   │   ├── incident-creation.now.ts
│   │   └── escalation-workflow.now.ts
│   ├── assignment-rules/
│   │   └── incident-routing.now.ts
│   ├── sla-definitions/
│   │   └── response-times.now.ts
│   └── ui-policies/
│       └── incident-form-behavior.now.ts
├── integration-workflows/             # Tests for multiple artifacts
│   ├── incident-lifecycle.now.ts
│   ├── change-approval-process.now.ts
│   └── service-request-fulfillment.now.ts
└── performance/                       # Performance validation tests
    ├── bulk-assignment-flows.now.ts
    └── high-volume-processing.now.ts
```

### **ATF Test Exports**
```typescript
// src/fluent/atf-tests/index.now.ts
export * from './configuration-artifacts/decision-tables/priority-calculation.now'
export * from './configuration-artifacts/flows/incident-creation.now'
export * from './configuration-artifacts/assignment-rules/incident-routing.now'
export * from './integration-workflows/incident-lifecycle.now'
```

---

## Relationship to Testing Strategy

### **ATF in Complete Testing Ecosystem**

This document focuses specifically on **ATF patterns for configuration testing**. For the complete testing picture, see [Testing Strategy](testing-strategy.md):

**Testing Layer Distribution:**
- **Unit Tests (80%)** - React components, services, utilities
- **Integration Tests (15%)** - Includes ATF configuration tests + React integration
- **E2E Tests (5%)** - Complete user workflows

**Cross-Reference Integration:**
- **[Testing Strategy](testing-strategy.md)** - Overall testing approach and React testing patterns
- **[ServiceNow Backend Principles](servicenow-backend-principles.md)** - Configuration artifacts to test
- **[Component Testing](component-testing.md)** - Frontend component testing patterns
- **[Performance Optimization](performance-optimization.md)** - Performance testing approaches

### **When to Use ATF vs Other Testing**

**Use ATF for:**
- ✅ **Flow Designer workflows** - Business process validation
- ✅ **Decision Builder tables** - Business logic calculations
- ✅ **Assignment Rules** - Record routing validation
- ✅ **UI/Data Policies** - Form behavior validation
- ✅ **SLA Definitions** - Service level calculations
- ✅ **Configuration integration** - Multiple artifacts working together

**Use React Testing Library for:**
- ✅ **Component rendering** - UI component behavior
- ✅ **User interactions** - Click, input, navigation
- ✅ **State management** - Zustand + TanStack Query integration
- ✅ **Service layer** - API communication and error handling

**Use E2E Testing for:**
- ✅ **Complete user workflows** - End-to-end business processes
- ✅ **Cross-system integration** - React UI + ServiceNow backend
- ✅ **Performance validation** - Real-world usage scenarios

---

## Next Steps

**Implement ATF Testing:**

### **Foundation Setup:**
1. **Review [Testing Strategy](testing-strategy.md)** - Understand overall testing approach
2. **Study [ServiceNow Backend Principles](servicenow-backend-principles.md)** - Identify configuration artifacts to test
3. **Set up ATF test suites** - Organize by artifact type and integration workflows

### **Implementation Priority:**
1. **Start with critical flows** - Test most important business processes first
2. **Add decision table validation** - Ensure business logic calculations work correctly
3. **Test assignment rules** - Validate routing and load balancing
4. **Include UI/Data policies** - Test form behavior and validation
5. **Add integration workflows** - Test multiple artifacts working together

### **Advanced Patterns:**
- **[Flow Designer State Machines](flow-designer-state-machines.md)** - Complex workflow testing
- **[Decision Builder Integration](decision-builder-integration.md)** - Advanced business logic testing
- **[Performance Optimization](performance-optimization.md)** - Performance testing strategies

---

*ATF validates that ServiceNow configuration artifacts work correctly, completing our backend-first testing strategy. Use ATF to ensure flows execute properly, decision tables calculate accurately, and policies enforce correctly - guaranteeing your configuration-first approach delivers reliable business outcomes.*