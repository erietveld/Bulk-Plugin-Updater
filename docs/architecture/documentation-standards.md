---
title: "Documentation Standards Overview"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Core principles for granular, LLM-optimized technical documentation"
readTime: "4 minutes"
complexity: "beginner"
criticality: "MANDATORY"
---

# Documentation Standards Overview

**Purpose:** Core principles for granular, LLM-optimized technical documentation  
**Read time:** ~4 minutes  
**Prerequisites:** None

---

## 🎯 The 10 Essential Principles

| **Principle** | **Standard** | **Validation** |
|---------------|--------------|----------------|
| **1. Granular** | One concept per document | Single responsibility test |
| **2. Performant** | 3-5 minute optimal read time | 200 words/minute × time limit |
| **3. Bite-sized** | Cognitive load optimized | Max 1200 words per file |
| **4. Self-contained** | Complete value standalone | No dependency chains >2 deep |
| **5. Well-structured** | Consistent formatting | Template compliance check |
| **6. Sanitized** | Zero redundancy | Cross-reference audit |
| **7. Consistent** | Uniform patterns | Style guide compliance |
| **8. Complete** | Comprehensive coverage | Gap analysis validation |
| **9. LLM-optimized** | AI consumption ready | Structured metadata + context |
| **10. Versioned** | Lean change tracking | Version metadata + changelog |

## Quick Decision Tree

```
Creating documentation?
├── Single concept (3-8 min) → Use standard template
├── Multiple concepts → Split into focused documents
├── Quick reference → Use reference template
└── Complex implementation → Create step-by-step guide
```

## Document Type Selection

### **When to Use Each Type:**
- **Pattern (5-8 min)** - Implementation approaches and best practices
- **Guide (4-6 min)** - Step-by-step instructions for specific tasks
- **Reference (2-4 min)** - Quick lookup information and checklists
- **Overview (3-5 min)** - High-level concepts and navigation

## Quality Gates (Every Document Must Pass)

```typescript
interface DocumentQuality {
  structure: {
    hasVersionedHeader: boolean;     // ✅ Lean version metadata
    hasSinglePurpose: boolean;       // ✅ One concept only
    hasReadTime: boolean;            // ✅ Accurate time estimate
    hasWorkingExamples: boolean;     // ✅ Complete, tested code
    hasDecisionGuidance: boolean;    // ✅ When/why to use
  };
  
  performance: {
    readTimeMinutes: number;         // ✅ 3-8 minutes optimal
    wordCount: number;               // ✅ 800-1600 words ideal
    cognitiveLoad: 'low' | 'medium'; // ✅ Easy to process
    scannable: boolean;              // ✅ Headers, bullets, code blocks
  };
}
```

---

## 📚 Related Documentation Standards

### **Implementation Details:**
- [Document Templates](patterns/document-templates.md) - Standard structures and frontmatter
- [LLM Optimization](patterns/llm-optimization.md) - AI-friendly formatting patterns
- [Quality Validation](patterns/documentation-quality.md) - Automated quality checks

### **Creation Process:**
- [Documentation Workflow](reference/documentation-workflow.md) - Step-by-step creation process
- [Quality Checklist](reference/documentation-checklist.md) - Pre-publication validation

---

*Transform technical documentation from monolithic resources into granular, AI-friendly knowledge systems that 10x developer productivity.*