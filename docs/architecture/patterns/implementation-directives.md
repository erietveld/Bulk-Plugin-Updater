---
title: "Implementation Directives for ServiceNow Development"
version: "2025.1.5"
introduced: "2025.1.5"
purpose: "Build agent workflow and quality gates for ServiceNow React development"
readTime: "4 minutes"
complexity: "intermediate"
prerequisites: ["core-principles"]
criticality: "MANDATORY"
tags: ["implementation", "workflow", "quality", "servicenow"]
---

# Implementation Directives for ServiceNow Development

**Purpose:** Build agent workflow and quality gates for ServiceNow React development  
**Read time:** ~4 minutes  
**Prerequisites:** [Core Principles](../core-principles.md)

---

## Implementation Philosophy (1 minute)

**PATTERN:** Apply changes in small, atomic, reversible increments during development. Be ambitious with functionality, conservative with implementation approach.

**PACKAGE MANAGEMENT:** Always add packages with '^version' where version is the latest stable build to ensure maximum compatibility and feature access.

**IMPORT USING RELATIVE PATH:** Don't use '@/api/' imports for components, utilies, hooks etc. Configure correct relative imports to succesfully run a build.

**CDN RESOURCE VALIDATION:** When using external resources from a CDN (like stylesheets), ALWAYS show the resources used in debug version (debug implemented using URL parameter sn_debug=true) and ask the user to VALIDATE by clicking the resource. This is CRITICAL to prevent styling problems with incorrect resources.

**DEBUG SWITCH:** NEVER use NODE_ENV as this is not set on ServiceNow. We ALWAYS have to use a URL paramter based debug setup. NEVER use ?DEBUG=true or ?debug=true, this conflicts with standard ServiceNow parameters. We use ?sn_debug=true, stick to that.

### **Core Principles**
- **Incremental Development** - Small, focused changes only
- **Reversibility** - Every change must be easily revertable
- **Functionality** - Don't limit features, limit implementation risk
- **Validation** - Every change must be validated before proceeding

## Mandatory Workflow Process (2 minutes)

### **10-Step Change Process**
```typescript
interface BuildAgentDirective {
  changeProcess: {
    step01: "explicit-get-approval";            // All changes EXPLICITELY need approval first
    step02: "implement-atomically";             // Make one focused and atomic change
    step03: "run-diagnostics";                  // validate the source
    step04: "focus-single-issue";               // IF received list of typescript errors: FIRST focus on the top 1 or top 2 when related
    step05: "explain-changes-and-reasoning";    // Tell the user what was changed and why
    step06: "confirm-build";                    // Ask user approval before starting build or do another focused and atomic change
      step06_Option1: "another-atomic-change";  // user agreed to another change, restart workflow from step01
      step06_Option2: "build-confirmed";        // user agreed move to build, continue
    step07: "validate-build";                   // npm run build must succeed
    step08: "validate-deployment";              // Deploy to test environment
    step09: "user-review";                      // User acceptance required by in-browser review
    step10: "proceed-or-rollback";              // Continue or revert based on results
  };
}
```

### **Quality Gates (All Must Pass)**
- ✅ **Build Validation** - Zero errors in build process
- ✅ **Type Validation** - Strict TypeScript compliance
- ✅ **Pattern Compliance** - Follow architectural guidelines
- ✅ **User Testing** - In-browser review required
- ✅ **Rollback Plan** - Clear reversion path defined

## CDN Resource Validation (1 minute)

### **Critical ServiceNow Requirement**
When using external CDN resources (stylesheets, fonts, etc.), validation is MANDATORY.

```typescript
interface CDNValidation {
  debugMode: "sn_debug=true";                // URL parameter to enable resource debugging
  showResources: "always-in-debug";         // Display all CDN resources when debugging
  userValidation: "click-to-validate";      // User must click each resource to validate
  preventStylingIssues: "mandatory-check";  // Prevent styling problems with validation
  failureHandling: "immediate-notification"; // Show errors immediately if resource fails
}
```

### **Implementation Pattern**
```tsx
// ✅ GOOD: CDN resource validation in debug mode
function CDNResourceDebugger() {
  const isDebug = new URLSearchParams(window.location.search).get('sn_debug') === 'true';
  
  if (!isDebug) return null;
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, background: 'yellow', padding: '10px' }}>
      <h4>🚨 CDN Resources - Click to Validate:</h4>
      {cdnResources.map(resource => (
        <a key={resource.url} href={resource.url} target="_blank" rel="noopener noreferrer">
          📋 {resource.name}
        </a>
      ))}
    </div>
  );
}
```

## Package Management Standards (30 seconds)

### **Dependency Strategy**
```json
{
  "dependencies": {
    "@mantine/core": "^8.3.6",        // ✅ Use latest stable with caret
    "react": "^19.2.0",               // ✅ Latest stable React
    "typescript": "^5.7.2"            // ✅ Latest stable TypeScript
  }
}
```

**Rules:**
- ✅ **Always use `^version`** - Latest stable build for compatibility
- ✅ **Relative imports only** - No `@/` imports, use relative paths
- ❌ **Never use `latest`** - Use specific version numbers

## Debug Switch Implementation (30 seconds)

### **ServiceNow-Compatible Debug Pattern**
```typescript
// ✅ GOOD: ServiceNow-compatible debug detection
const isDebugMode = () => {
  return new URLSearchParams(window.location.search).get('sn_debug') === 'true';
};

// ❌ WRONG: NODE_ENV not available in ServiceNow
// const isDebugMode = process.env.NODE_ENV === 'development';

// ❌ WRONG: Conflicts with ServiceNow parameters
// const isDebugMode = searchParams.get('debug') === 'true';
```

**Why `sn_debug=true`:**
- ✅ **ServiceNow Compatible** - No conflicts with platform parameters
- ✅ **Consistent** - Same pattern across all ServiceNow apps
- ✅ **Reliable** - Works in all ServiceNow environments
- ❌ **NODE_ENV unavailable** - ServiceNow doesn't set this variable

## Decision Guidance (30 seconds)

### **When to Use This Directive**
- ✅ **All ServiceNow development** - MANDATORY for platform compatibility
- ✅ **Enterprise applications** - Quality gates prevent production issues
- ✅ **Team development** - Consistent workflow across developers
- ✅ **CI/CD integration** - Automated validation in pipelines

### **Key Benefits**
- **Risk Reduction** - Small changes minimize impact of errors
- **Quality Assurance** - Multiple validation gates catch issues early
- **ServiceNow Compatibility** - Tested patterns for platform constraints
- **Team Consistency** - Standardized workflow across all developers

---

## 📚 Related Implementation Patterns

### **Foundation:**
- [Core Principles](../core-principles.md) - Architectural foundation
- [Project Setup Guide](../project-setup-guide.md) - Initial project configuration

### **Advanced Patterns:**
- [TypeScript Configuration](typescript-configuration.md) - Enterprise TypeScript setup
- [Mantine Integration Advanced](mantine-integration-advanced.md) - UI component patterns
- [Quick Implementation Guide](../quick-implementation-guide.md) - Rapid development workflow

---

*Conservative implementation approach with ambitious functionality - reduce risk, maximize value delivery in ServiceNow environments.*