---
title: "Documentation Standards: Frontmatter Specification"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Standardized frontmatter schema for all documentation files"
readTime: "4 minutes"
complexity: "beginner"
criticality: "MANDATORY"
tags: ["documentation", "standards", "frontmatter", "metadata"]
status: "ACTIVE"
deprecates: ["2024.x frontmatter patterns"]
breaking-changes: ["Standardizes all file headers", "Requires migration of existing files"]
---

# Documentation Standards: Frontmatter Specification

**Purpose:** Standardized frontmatter schema for all documentation files  
**Read time:** ~4 minutes  
**Criticality:** MANDATORY

---

## 🎯 Standard Frontmatter Schema

### **Required Fields (All Files)**
```yaml
---
title: "Document Title (User-Friendly)"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Single-sentence description of document purpose"
readTime: "X minutes"
complexity: "beginner|intermediate|advanced"
status: "ACTIVE|DEPRECATED|ARCHIVED"
---
```

### **Conditional Fields (Based on File Type)**
```yaml
# For Pattern Files
criticality: "MANDATORY|RECOMMENDED|OPTIONAL"
prerequisites: ["file-name-1", "file-name-2"]
tags: ["tag1", "tag2", "tag3"]

# For Deprecated Files
deprecates: ["previous-pattern-name"]
replacedBy: "new-pattern-file-name"
migrationGuide: "migration-guide-file-name"

# For Breaking Changes
breaking-changes: ["Description of breaking change 1", "Description of breaking change 2"]
```

---

## 📋 Complete Field Specifications

### **Core Metadata**

| **Field** | **Type** | **Required** | **Description** | **Example** |
|-----------|----------|--------------|-----------------|-------------|
| `title` | string | ✅ | User-friendly document title | `"Service Layer Integration"` |
| `version` | string | ✅ | Current version following semantic versioning | `"2025.1.0"` |
| `introduced` | string | ✅ | Version when document was first introduced | `"2024.3.0"` |
| `purpose` | string | ✅ | Single-sentence purpose description | `"MANDATORY reading before implementing any ServiceNow service layer"` |
| `readTime` | string | ✅ | Estimated reading time | `"5 minutes"` |
| `complexity` | enum | ✅ | Target skill level | `"beginner"` \| `"intermediate"` \| `"advanced"` |
| `status` | enum | ✅ | Document lifecycle status | `"ACTIVE"` \| `"DEPRECATED"` \| `"ARCHIVED"` |

### **Pattern-Specific Fields**

| **Field** | **Type** | **Required** | **Description** | **Example** |
|-----------|----------|--------------|-----------------|-------------|
| `criticality` | enum | Pattern files | Implementation priority | `"MANDATORY"` \| `"RECOMMENDED"` \| `"OPTIONAL"` |
| `prerequisites` | array | When applicable | Files that should be read first | `["core-principles", "service-layer-integration"]` |
| `tags` | array | Recommended | Searchable keywords | `["servicenow", "data", "tanstack-query"]` |

### **Deprecation Fields**

| **Field** | **Type** | **Required** | **Description** | **Example** |
|-----------|----------|--------------|-----------------|-------------|
| `deprecates` | array | Deprecated files | What this replaces | `["2024.x manual data fetching patterns"]` |
| `replacedBy` | string | Deprecated files | New file to use instead | `"service-layer-integration"` |
| `migrationGuide` | string | Breaking changes | Migration instructions file | `"migration-2024-to-2025"` |

### **Change Tracking Fields**

| **Field** | **Type** | **Required** | **Description** | **Example** |
|-----------|----------|--------------|-----------------|-------------|
| `breaking-changes` | array | When applicable | List of breaking changes | `["Replaces v2024.x manual data fetching patterns"]` |
| `lastModified` | string | Auto-generated | ISO date of last modification | `"2025-01-15T10:30:00Z"` |

---

## 📊 File Type Templates

### **Template: Core Architecture File**
```yaml
---
title: "Core Development Principles"
version: "2025.1.0"
introduced: "2024.3.0"
purpose: "Fundamental philosophy and standards for ServiceNow React development"
readTime: "6 minutes"
complexity: "beginner"
status: "ACTIVE"
criticality: "MANDATORY"
prerequisites: ["Basic React and ServiceNow knowledge"]
tags: ["architecture", "principles", "foundation"]
---
```

### **Template: Implementation Pattern**
```yaml
---
title: "ServiceNow Services + TanStack Query Integration"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "MANDATORY reading before implementing any ServiceNow service layer"
readTime: "8 minutes"
complexity: "intermediate"
status: "ACTIVE"
criticality: "MANDATORY"
prerequisites: ["core-principles"]
tags: ["servicenow", "tanstack-query", "data-fetching", "architecture"]
breaking-changes: ["Replaces v2024.x manual data fetching patterns"]
deprecates: ["2024.x service patterns"]
---
```

### **Template: Quick Reference**
```yaml
---
title: "Quick Implementation Checklist"
version: "2025.1.0"
introduced: "2024.4.0"
purpose: "Fast reference for ensuring standards compliance"
readTime: "3 minutes"
complexity: "beginner"
status: "ACTIVE"
criticality: "RECOMMENDED"
tags: ["checklist", "reference", "quality-assurance"]
---
```

### **Template: Deprecated File**
```yaml
---
title: "Legacy ServiceNow Integration (DEPRECATED)"
version: "2024.4.x"
introduced: "2024.3.0"
purpose: "Legacy ServiceNow integration patterns (DO NOT USE)"
readTime: "5 minutes"
complexity: "intermediate"
status: "DEPRECATED"
criticality: "OPTIONAL"
deprecates: ["Manual data fetching patterns"]
replacedBy: "service-layer-integration"
migrationGuide: "migration-2024-to-2025"
tags: ["legacy", "deprecated", "servicenow"]
breaking-changes: ["Replaced by TanStack Query integration"]
---
```

### **Template: Navigation File**
```yaml
---
title: "Documentation Navigation Hub"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Central navigation and documentation discovery"
readTime: "2 minutes"
complexity: "beginner"
status: "ACTIVE"
criticality: "RECOMMENDED"
tags: ["navigation", "index", "discovery"]
---
```

---

## 🚀 Migration Strategy for Existing Files

### **Phase 1: Audit Current State**
```bash
# Files missing frontmatter entirely
docs/architecture/patterns/custom-hooks.md          # ❌ No frontmatter
docs/architecture/patterns/error-boundaries.md     # ❌ No frontmatter  
docs/architecture/patterns/authentication.md       # ❌ No frontmatter

# Files with inconsistent frontmatter
docs/architecture/core-principles.md               # ⚠️ Partial frontmatter
docs/architecture/component-reusability.md         # ⚠️ Partial frontmatter
docs/architecture/quick-implementation-guide.md    # ⚠️ Partial frontmatter
```

### **Phase 2: Standardization Priority**
1. **MANDATORY files first** - Core architecture and patterns
2. **RECOMMENDED files second** - Implementation guides and references  
3. **OPTIONAL files last** - Archive and legacy documentation

### **Phase 3: Automated Validation**
```yaml
# .github/workflows/docs-validation.yml
name: Documentation Standards Validation
on: [push, pull_request]
jobs:
  validate-frontmatter:
    runs-on: ubuntu-latest
    steps:
      - name: Check frontmatter compliance
        run: |
          # Validate all .md files have required frontmatter fields
          # Check version consistency
          # Verify read time accuracy
          # Validate prerequisite chains
```

---

## 🎯 Version Alignment Standards

### **Version Consistency Rules**
- **Current Active Version**: `2025.1.0` (all new and updated files)
- **Legacy Version**: `2024.4.x` (deprecated but supported files)
- **End-of-Life Version**: `2024.3.x` (archived files only)

### **Version Field Standards**
```yaml
# CORRECT: Current active files
version: "2025.1.0"
introduced: "2025.1.0"    # For new files
introduced: "2024.3.0"    # For files updated from previous versions

# CORRECT: Legacy supported files  
version: "2024.4.x"
status: "DEPRECATED"
replacedBy: "new-file-name"

# CORRECT: Archived files
version: "2024.3.x" 
status: "ARCHIVED"
```

### **Breaking Changes Tracking**
```yaml
# Track what changed and why
breaking-changes: [
  "Replaces v2024.x manual data fetching patterns",
  "Requires TanStack Query for all ServiceNow data operations",
  "Updates component architecture to stateless-first approach"
]

# Link to migration guidance
migrationGuide: "migration-2024-to-2025"
```

---

## 📈 Quality Validation Framework

### **Automated Checks**
```typescript
interface FrontmatterValidation {
  // Required field presence
  hasRequiredFields: boolean;
  
  // Version consistency
  versionFormat: 'valid' | 'invalid';
  versionAlignment: 'current' | 'legacy' | 'archived';
  
  // Content accuracy
  readTimeAccurate: boolean;  // ±1 minute of actual content
  purposeClear: boolean;      // Single sentence, actionable
  
  // Relationship integrity  
  prerequisitesExist: boolean;      // All prerequisites are real files
  replacementExists: boolean;       // replacedBy points to real file
  migrationGuideExists: boolean;    // migrationGuide exists if specified
  
  // Status consistency
  statusMatchesContent: boolean;    // DEPRECATED files have replacement
  criticalityAppropriate: boolean;  // MANDATORY files are truly essential
}
```

### **Content Quality Gates**
- **Read Time Accuracy**: Must be within ±1 minute of actual reading time
- **Purpose Clarity**: Single sentence, actionable purpose statement
- **Prerequisite Validation**: All listed prerequisites must exist as files
- **Migration Path Integrity**: Deprecated files must specify replacement
- **Tag Consistency**: Tags must align with content and be searchable

---

## 🔧 Implementation Tools

### **Frontmatter Update Script**
```typescript
// scripts/update-frontmatter.ts
interface FrontmatterUpdate {
  filePath: string;
  currentFrontmatter: Record<string, any>;
  standardizedFrontmatter: Record<string, any>;
  migrationNeeded: boolean;
}

async function standardizeFrontmatter(filePath: string): Promise<FrontmatterUpdate> {
  const content = await fs.readFile(filePath, 'utf-8');
  const { data: currentFrontmatter, content: bodyContent } = matter(content);
  
  const standardizedFrontmatter = {
    title: currentFrontmatter.title || extractTitleFromContent(bodyContent),
    version: "2025.1.0",
    introduced: currentFrontmatter.introduced || "2025.1.0",
    purpose: currentFrontmatter.purpose || extractPurposeFromContent(bodyContent),
    readTime: calculateReadTime(bodyContent),
    complexity: currentFrontmatter.complexity || inferComplexity(bodyContent),
    status: currentFrontmatter.status || "ACTIVE",
    ...conditionalFields(filePath, currentFrontmatter)
  };
  
  return {
    filePath,
    currentFrontmatter,
    standardizedFrontmatter,
    migrationNeeded: !isEqual(currentFrontmatter, standardizedFrontmatter)
  };
}
```

### **Validation Commands**
```bash
# Check frontmatter compliance
npm run docs:validate-frontmatter

# Update all frontmatter to standards
npm run docs:standardize-frontmatter

# Generate migration report
npm run docs:migration-report

# Validate prerequisite chains  
npm run docs:validate-prerequisites
```

---

## 📋 Migration Checklist

### **For Each File**
- [ ] **Add required frontmatter fields** - title, version, introduced, purpose, readTime, complexity, status
- [ ] **Verify version alignment** - Use 2025.1.0 for current, appropriate legacy versions for deprecated
- [ ] **Check read time accuracy** - Test with actual reading and adjust
- [ ] **Validate prerequisites** - Ensure all listed files exist and are appropriate
- [ ] **Add appropriate tags** - Searchable, relevant keywords
- [ ] **Set correct criticality** - MANDATORY for essential patterns, RECOMMENDED for important ones
- [ ] **Handle deprecation properly** - Add deprecates, replacedBy, migrationGuide for deprecated content

### **For File Relationships**
- [ ] **Verify prerequisite chains** - No circular dependencies, logical progression
- [ ] **Check replacement links** - All replacedBy fields point to existing files
- [ ] **Validate migration guides** - Migration guidance exists for breaking changes
- [ ] **Test navigation paths** - All cross-references work correctly

---

## 🎯 Success Metrics

### **Quantitative Goals**
- **100% frontmatter compliance** - All files have required fields
- **95% version alignment** - Consistent version usage across files
- **±1 minute read time accuracy** - Reliable time estimates
- **Zero broken prerequisites** - All prerequisite chains valid
- **100% migration path coverage** - All deprecated files have replacements

### **Qualitative Goals**
- **Improved discoverability** - Better tagging and categorization
- **Clear learning paths** - Logical prerequisite progression
- **Reduced maintenance overhead** - Consistent, automated validation
- **Better AI consumption** - Structured metadata for LLM optimization

---

## 🔗 Related Documentation

**Implementation Tools:**
- [Documentation Workflow](../reference/documentation-workflow.md) - Step-by-step update process
- [Quality Validation](../reference/documentation-quality-validation.md) - Automated checking tools
- [Migration Scripts](../reference/frontmatter-migration-scripts.md) - Automated frontmatter updates

**Standards Reference:**
- [Documentation Standards Overview](../documentation-standards.md) - High-level principles  
- [LLM Optimization](llm-optimization.md) - AI-friendly formatting patterns
- [Version Management](../reference/version-management.md) - Semantic versioning guidelines

---

*Standardized frontmatter is the foundation of discoverable, maintainable, and AI-friendly documentation. Consistent metadata enables automated validation, improved navigation, and reliable content management at scale.*