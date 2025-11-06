---
title: "Document Templates and Frontmatter Standards"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Standard templates and metadata requirements for all documentation"
readTime: "5 minutes"
complexity: "beginner"
prerequisites: ["documentation-standards"]
---

# Document Templates and Frontmatter Standards

**Purpose:** Standard templates and metadata requirements for all documentation  
**Read time:** ~5 minutes  
**Prerequisites:** [Documentation Standards](../documentation-standards.md)

---

## 📋 Mandatory Document Template

### **File Structure Standard**
```markdown
---
title: "[Specific, Searchable Title]"
version: "2025.1.0"
introduced: "2024.x.x"
purpose: "[Single sentence describing exact purpose]"
readTime: "[X minutes]"
complexity: "beginner|intermediate|advanced"
prerequisites: ["file-id-1", "file-id-2"]  # Max 3
criticality: "optional|recommended|MANDATORY"
audience: ["developers", "architects", "ai-systems"]
breaking-changes: ["v2024.x pattern deprecated"]  # If applicable
---

# [Title]

**Purpose:** [Single, specific purpose in 10-15 words]  
**Read time:** ~[X] minutes  
**Prerequisites:** [Linked dependencies, max 3]

---

## Problem/Context (30 seconds)
[What problem this solves, with concrete example]

## Solution Overview (1 minute)
[High-level approach with key principles]

## Implementation (3-5 minutes)
```tsx
// Complete, working example
// Inline comments explaining decisions
// Focus on core concept only
```

## Decision Guidance (1-2 minutes)
- **When to use:** [Specific criteria]
- **When not to use:** [Clear alternatives]  
- **Trade-offs:** [Honest assessment]

## Integration (1-2 minutes)
[How this connects to related concepts with strategic links]

---

*[One sentence summary of key takeaway]*
```

### **Frontmatter Standards**
```yaml
# REQUIRED FIELDS
title: "Descriptive, searchable title"
version: "2025.1.0"                    # Current architecture version
purpose: "Single sentence purpose"     # What this document accomplishes
readTime: "5 minutes"                  # Accurate estimate

# CONTEXT FIELDS
introduced: "2024.3.0"                 # When this document was first created
complexity: "intermediate"             # beginner|intermediate|advanced
prerequisites: ["core-principles"]     # Max 3 dependencies
audience: ["developers"]               # Who should read this

# CLASSIFICATION FIELDS  
criticality: "MANDATORY"               # optional|recommended|MANDATORY
breaking-changes: ["v2024.x deprecated"] # If this replaces older patterns
tags: ["react", "servicenow", "data"]  # Searchable keywords
---
```

## 📊 Template Variations by Document Type

### **Pattern Template (5-8 minutes)**
```markdown
---
title: "[Pattern Name] Implementation Pattern"
purpose: "How to implement [specific pattern] in ServiceNow applications"
readTime: "6 minutes"
complexity: "intermediate"
---

# [Pattern Name] Implementation Pattern

## Problem Statement (1 minute)
[Specific problem this pattern solves]

## Pattern Overview (1 minute)
[High-level approach and key principles]

## Implementation (4 minutes)
[Complete working example with detailed comments]

## Validation (1 minute)
[How to verify pattern is working correctly]

## Common Pitfalls (1 minute)
[What goes wrong and how to avoid it]
```

### **Guide Template (4-6 minutes)**
```markdown
---
title: "[Task] Step-by-Step Guide"
purpose: "Complete instructions for [specific task]"
readTime: "5 minutes"
complexity: "beginner"
---

# [Task] Step-by-Step Guide

## Prerequisites (30 seconds)
[What you need before starting]

## Step-by-Step Process (4 minutes)
### Step 1: [Action]
[Detailed instructions with expected outcomes]

### Step 2: [Action]
[Detailed instructions with expected outcomes]

### Step 3: [Action]
[Detailed instructions with expected outcomes]

## Verification (30 seconds)
[How to confirm success]

## Troubleshooting (1 minute)
[Common issues and solutions]
```

### **Reference Template (2-4 minutes)**
```markdown
---
title: "[Topic] Quick Reference"
purpose: "Fast lookup for [specific information]"
readTime: "3 minutes"
complexity: "beginner"
---

# [Topic] Quick Reference

## Quick Lookup Table
| Item | Usage | Example |
|------|-------|---------|
| X    | When  | Code    |

## Common Patterns
```tsx
// Most common usage pattern
```

## Checklists
- [ ] Item 1
- [ ] Item 2
- [ ] Item 3
```

---

## ⚡ Reading Time Optimization

### **Reading Time Standards**
```typescript
interface ReadingTimeStandards {
  optimal: {
    minutes: 3-8;
    words: 800-1600;
    sections: 3-6;
    codeExamples: 2-5;
    crossLinks: 3-8;
  };
  
  acceptable: {
    minutes: 2-10;
    words: 400-2000;
    sections: 2-8;
    codeExamples: 1-8;
    crossLinks: 1-12;
  };
  
  problematic: {
    minutes: 15+;        // ❌ Too long - split document
    words: 3000+;       // ❌ Cognitive overload
    sections: 10+;      // ❌ Too many concepts
    crossLinks: 20+;    // ❌ Link overload
  };
}
```

### **Cognitive Load Management**
```markdown
# ✅ GOOD: Scannable structure with clear hierarchy
## Problem Statement (30 seconds)
Brief, focused problem definition

### **Key Challenge**
- Specific issue #1
- Specific issue #2  
- Specific issue #3

## Solution (2 minutes)
### **Approach Overview**
High-level strategy

### **Implementation Steps**
1. **Step 1** - Clear action with rationale
2. **Step 2** - Clear action with rationale
3. **Step 3** - Clear action with rationale

## Code Example (3 minutes)
```tsx
// ✅ Complete, working example
// Comments explain WHY not just WHAT
function ExampleComponent() {
  // Business decision: Use TanStack Query for caching
  const { data, isLoading } = useQuery(...);
  return <div>{/* implementation */}</div>;
}
```

## Decision Points (1 minute)
| **Scenario** | **Recommendation** | **Alternative** |
|--------------|-------------------|-----------------|
| Simple data | Use this pattern | Consider X instead |
| Complex data | Modify approach | Use Y pattern |
```

---

## 🔧 Template Usage Guidelines

### **Choosing the Right Template**
```
What are you documenting?
├── Implementation approach → Pattern template
├── Step-by-step process → Guide template  
├── Quick lookup info → Reference template
├── High-level overview → Overview template
└── Multiple concepts → Split into focused documents
```

### **Customization Rules**
- ✅ **Add sections** specific to your content type
- ✅ **Adjust time allocations** based on complexity
- ✅ **Include domain-specific examples**
- ❌ **Don't remove required frontmatter fields**
- ❌ **Don't exceed 10-minute reading time**
- ❌ **Don't mix multiple concepts in one document**

---

## 📚 Related Documentation Standards

### **Quality Standards:**
- [LLM Optimization](llm-optimization.md) - AI-friendly formatting
- [Documentation Quality](documentation-quality.md) - Validation frameworks

### **Process Standards:**
- [Documentation Workflow](../reference/documentation-workflow.md) - Creation process
- [Quality Checklist](../reference/documentation-checklist.md) - Pre-publication checks

---

*Standard templates ensure consistent structure, optimal reading times, and LLM compatibility across all documentation.*