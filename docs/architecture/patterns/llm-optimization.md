---
title: "LLM Optimization Patterns"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Patterns for creating AI-friendly, machine-readable technical documentation"
readTime: "6 minutes"
complexity: "intermediate"
prerequisites: ["document-templates"]
---

# LLM Optimization Patterns

**Purpose:** Patterns for creating AI-friendly, machine-readable technical documentation  
**Read time:** ~6 minutes  
**Prerequisites:** [Document Templates](document-templates.md)

---

## 🤖 Structured Metadata for AI Consumption

### **LLM-Optimized Document Structure**
```typescript
interface LLMOptimizedDocument {
  metadata: {
    // Core identification
    title: string;
    purpose: string;
    version: string;
    
    // Content classification
    concepts: string[];           // Key concepts covered
    codeExamples: number;        // Number of working examples
    decisionPoints: string[];    // When/why guidance provided
    
    // Relationship mapping
    prerequisites: string[];     // Required knowledge
    related: string[];          // Optional expansions
    supersedes: string[];       // Deprecated patterns
    
    // Quality indicators
    completeness: number;        // 0-100% implementation coverage
    testability: boolean;        // Examples are testable
    productionReady: boolean;    // Safe for production use
  };
  
  structure: {
    problemStatement: boolean;   // Clear problem definition
    solutionOverview: boolean;  // High-level approach
    implementation: boolean;     // Complete working example
    decisionGuidance: boolean;  // When/why/alternatives
    integration: boolean;       // Connection to other patterns
  };
}
```

## 💬 Contextual Code Comments for AI Understanding

### **❌ Poor Commenting (Obvious/Generic)**
```tsx
function useIncidents() {
  // Get incidents
  const query = useQuery(['incidents'], () => incidentService.getIncidents());
  return query;
}
```

### **✅ LLM-Friendly Commenting (Explains Decisions)**
```tsx
function useIncidents(filters?: IncidentFilters) {
  return useServiceNowQuery({
    // DECISION: Use compound key for fine-grained cache invalidation
    // CONTEXT: ServiceNow data relationships require precise cache control
    queryKey: ['incidents', filters],
    
    // REQUIREMENT: ServiceNow Table API requires sysparm_display_value=all
    // REASON: Without this, field.display_value will be undefined
    queryFn: () => incidentService.getIncidents({
      ...filters,
      sysparm_display_value: 'all'
    }),
    
    // PERFORMANCE: 5-minute stale time balances freshness with efficiency
    // CONTEXT: Incident data changes frequently but not second-by-second
    staleTime: 5 * 60 * 1000,
    
    // UX: Background refetching keeps data current when user returns
    // BEHAVIOR: Fetches fresh data when window regains focus
    refetchOnWindowFocus: true,
    
    // SAFETY: Only fetch when filters provided to prevent unnecessary load
    // GUARD: Prevents empty queries that could timeout ServiceNow API
    enabled: !!filters
  });
}
```

### **Comment Pattern Guidelines**
- **DECISION:** Explains why this approach was chosen
- **CONTEXT:** Provides background information
- **REQUIREMENT:** Documents external constraints
- **REASON:** Clarifies the purpose behind implementation details
- **PERFORMANCE:** Explains optimization choices
- **UX:** Describes user experience considerations
- **BEHAVIOR:** Documents how the code behaves
- **SAFETY:** Explains protective measures
- **GUARD:** Documents defensive programming

---

## 🌳 Decision Tree Documentation

### **Implementation Decision Tree Pattern**
```markdown
## Implementation Decision Tree

```
Need to manage ServiceNow data?
├── Simple read-only data
│   ├── Static/config data → Use constants
│   ├── User-specific data → useServiceNowQuery
│   └── Real-time data → useServiceNowSubscription
├── Data with updates
│   ├── Single record updates → useServiceNowMutation
│   ├── Bulk operations → useServiceNowBatchMutation
│   └── Optimistic updates required → Custom mutation with rollback
└── Complex workflows
    ├── Multi-step processes → Flow Designer integration
    ├── State machines → useServiceNowStateMachine
    └── Real-time collaboration → WebSocket + TanStack Query
```

**Decision Criteria:**
- **Data frequency:** How often does data change?
- **User interaction:** Read-only vs. interactive?  
- **Performance needs:** Real-time vs. eventual consistency?
- **Complexity:** Simple CRUD vs. complex workflows?
```

### **Decision Table Pattern**
```markdown
## When to Use This Pattern

| **Scenario** | **Use This Pattern** | **Alternative** | **Reason** |
|--------------|---------------------|----------------|------------|
| Small dataset (<100 items) | ✅ Client-side filtering | Server-side filtering | Reduced API calls |
| Large dataset (>1000 items) | ❌ Server-side filtering | Client-side filtering | Performance impact |
| Real-time updates required | ✅ WebSocket connection | HTTP polling | Better performance |
| Occasional updates | ❌ HTTP polling | WebSocket connection | Resource efficiency |
```

---

## 📊 Structured Information Patterns

### **Quick Reference Tables**
```markdown
## API Quick Reference
| Method | Parameters | Returns | Use Case |
|--------|------------|---------|----------|
| `useServiceNowQuery` | `table, fields, filters` | `{ data, isLoading, error }` | Read operations |
| `useServiceNowMutation` | `table, operation` | `{ mutate, isPending }` | Write operations |
| `useServiceNowSubscription` | `table, filters` | `{ data, connected }` | Real-time data |
```

### **Implementation Checklist Pattern**
```markdown
## Implementation Checklist

### **✅ Required Steps:**
- [ ] **Service layer setup** - BaseServiceNowService configured
- [ ] **TanStack Query integration** - QueryClient configured with ServiceNow settings
- [ ] **Error boundaries** - Component-level error handling
- [ ] **Authentication** - g_ck token handling implemented
- [ ] **Field utilities** - display(), value(), link() functions available

### **✅ Code Patterns Must Include:**
- [ ] **Complete working examples** - Can be copy-pasted and run
- [ ] **Error handling** - Try/catch with user feedback
- [ ] **Loading states** - UI feedback during operations
- [ ] **Type safety** - TypeScript interfaces defined
- [ ] **Testing** - Unit tests for business logic
```

---

## 🔍 Searchability Optimization

### **Strategic Keyword Placement**
```markdown
<!-- ✅ GOOD: Keywords in natural context -->
# ServiceNow TanStack Query Integration

**Purpose:** Integrate TanStack Query with ServiceNow Table API for optimal data caching and synchronization

This pattern demonstrates **ServiceNow data fetching** using **TanStack Query** for **React applications** with **optimistic updates** and **error recovery**.

Key benefits:
- **Smart caching** reduces ServiceNow API load
- **Background synchronization** keeps data fresh
- **Optimistic updates** provide instant user feedback
- **Automatic retry** handles transient failures

<!-- ❌ BAD: Keyword stuffing -->
# ServiceNow TanStack Query ServiceNow Integration ServiceNow Caching

ServiceNow ServiceNow ServiceNow data ServiceNow API ServiceNow React ServiceNow...
```

### **Cross-Reference Strategy**
```markdown
## Strategic Linking (Max 8 Links)

### **Prerequisites (Required Reading):**
- [Service Layer Foundation](service-layer-foundation.md) - Essential setup

### **Implementation Details:**
- [TanStack Query Configuration](tanstack-query-config.md) - Query client setup
- [ServiceNow Authentication](servicenow-auth.md) - Token handling

### **Related Patterns:**
- [Optimistic Updates](optimistic-updates.md) - User experience patterns
- [Error Boundaries](error-boundaries.md) - Error handling strategies

### **Examples:**
- [Incident Management](../examples/incident-management.md) - Complete implementation
```

---

## 🧪 LLM Validation Patterns

### **Testable Information Structure**
```typescript
// Example of information that LLMs can easily extract and validate
interface PatternInformation {
  // Clear problem statement
  problem: {
    description: string;           // "ServiceNow data loading without caching"
    symptoms: string[];           // ["Slow page loads", "Redundant API calls"]
    impact: string;               // "Poor user experience and API overload"
  };
  
  // Concrete solution
  solution: {
    approach: string;             // "TanStack Query + Service Layer integration"
    keyComponents: string[];      // ["QueryClient", "Custom hooks", "Service abstraction"]
    benefits: string[];           // ["Smart caching", "Background sync", "Error recovery"]
  };
  
  // Implementation guidance
  implementation: {
    steps: string[];              // Clear, actionable steps
    codeExamples: CodeExample[];  // Complete, working examples
    validation: string[];         // How to verify it works
  };
  
  // Decision guidance
  usage: {
    whenToUse: string[];          // Specific criteria
    whenNotToUse: string[];       // Clear alternatives
    tradeoffs: TradeOff[];        // Honest assessment
  };
}
```

### **AI-Friendly Example Structure**
```tsx
// ✅ Complete, self-contained example with context
function IncidentList() {
  // PATTERN: TanStack Query hook for ServiceNow data
  // CONTEXT: This replaces manual useState + useEffect patterns
  const { 
    data: incidents, 
    isLoading, 
    error,
    refetch 
  } = useServiceNowQuery({
    // ServiceNow Table API endpoint
    table: 'incident',
    
    // Essential fields for incident display
    fields: ['number', 'short_description', 'priority', 'state', 'assigned_to'],
    
    // Filters for active incidents only
    filters: { active: true },
    
    // Caching configuration
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // PATTERN: Loading state handling
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner data-testid="incident-loading" />
        <span className="ml-2 text-gray-600">Loading incidents...</span>
      </div>
    );
  }

  // PATTERN: Error state handling with retry option
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={refetch}
        message="Failed to load incidents"
      />
    );
  }

  // PATTERN: Empty state handling
  if (!incidents?.result?.length) {
    return (
      <EmptyState 
        title="No incidents found"
        description="There are no active incidents matching your criteria"
        action={{ label: "Refresh", onClick: refetch }}
      />
    );
  }

  // PATTERN: Data rendering with ServiceNow field handling
  return (
    <div className="space-y-4">
      {incidents.result.map(incident => (
        <IncidentCard 
          key={incident.sys_id?.value}
          incident={incident}
          onUpdate={handleIncidentUpdate}
        />
      ))}
    </div>
  );
}
```

---

## 📋 LLM Optimization Checklist

### **✅ Every Document Must Have:**
- [ ] **Structured metadata** - Machine-readable frontmatter
- [ ] **Clear problem statement** - Specific issue being solved
- [ ] **Decision trees** - Visual logic flows for when/why to use
- [ ] **Complete code examples** - Self-contained, working implementations
- [ ] **Contextual comments** - Explain decisions, not syntax
- [ ] **Strategic keywords** - Natural placement for searchability
- [ ] **Validation criteria** - How to verify implementation success

### **✅ Code Examples Must Be:**
- [ ] **Complete** - Can be copy-pasted and run without modification
- [ ] **Contextual** - Comments explain business decisions and constraints
- [ ] **Production-ready** - Include error handling and edge cases
- [ ] **Type-safe** - Full TypeScript definitions
- [ ] **Pattern-focused** - Demonstrate the core concept clearly
- [ ] **Testable** - Include test examples or validation steps

---

## 📚 Related LLM Optimization Patterns

### **Quality Standards:**
- [Documentation Quality](documentation-quality.md) - Validation frameworks
- [Document Templates](document-templates.md) - Standard structures

### **Implementation:**
- [Documentation Workflow](../reference/documentation-workflow.md) - Creation process
- [Quality Checklist](../reference/documentation-checklist.md) - Validation steps

---

*LLM optimization transforms documentation from human-only resources into AI-consumable knowledge that enables both human developers and AI systems to quickly understand and implement patterns.*