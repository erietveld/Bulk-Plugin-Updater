---
title: "Frontmatter Validation & Migration Tools"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Automated tools for validating and migrating documentation frontmatter"
readTime: "6 minutes"
complexity: "advanced"
status: "ACTIVE"
criticality: "RECOMMENDED"
tags: ["automation", "validation", "migration", "frontmatter", "tools"]
---

# Frontmatter Validation & Migration Tools

**Purpose:** Automated tools for validating and migrating documentation frontmatter  
**Read time:** ~6 minutes  
**For:** Documentation maintainers and automation engineers

---

## 🔍 Frontmatter Validation Report

### **Current Status Summary**

| **Status** | **Files** | **Percentage** | **Action Required** |
|------------|-----------|----------------|---------------------|
| ✅ **Compliant** | 8 files | 60% | None |
| ⚠️ **Needs Update** | 5 files | 30% | Frontmatter standardization |
| ❌ **Missing Frontmatter** | 2 files | 10% | Complete frontmatter addition |

### **Recently Standardized Files**
- ✅ `docs/architecture/README.md` - Complete standardization
- ✅ `docs/architecture/core-principles.md` - Full frontmatter compliance
- ✅ `docs/architecture/patterns/service-layer-integration.md` - Already compliant
- ✅ `docs/architecture/patterns/custom-hooks.md` - Standardized
- ✅ `docs/architecture/patterns/error-boundaries.md` - Standardized  
- ✅ `docs/architecture/patterns/authentication.md` - Standardized
- ✅ `docs/architecture/patterns/documentation-standards-frontmatter.md` - New standard
- ✅ `docs/architecture/reference/migration-2024-to-2025.md` - Complete migration guide

### **Files Requiring Updates**
- ⚠️ `docs/architecture/component-reusability.md` - Needs standardized frontmatter
- ⚠️ `docs/architecture/quick-implementation-guide.md` - Needs version alignment
- ⚠️ `docs/architecture/documentation-standards.md` - Needs complete frontmatter
- ⚠️ `docs/architecture/patterns/atomic-design.md` - Needs standardization
- ⚠️ `docs/architecture/patterns/state-management.md` - Needs frontmatter update

---

## 🛠 Automated Validation Script

### **TypeScript Validation Tool**
```typescript
// scripts/validate-frontmatter.ts
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import glob from 'glob';

interface FrontmatterSchema {
  title: string;
  version: string;
  introduced: string;
  purpose: string;
  readTime: string;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  status: 'ACTIVE' | 'DEPRECATED' | 'ARCHIVED';
  criticality?: 'MANDATORY' | 'RECOMMENDED' | 'OPTIONAL';
  prerequisites?: string[];
  tags?: string[];
  'breaking-changes'?: string[];
  deprecates?: string[];
  replacedBy?: string;
  migrationGuide?: string;
}

interface ValidationResult {
  filePath: string;
  isValid: boolean;
  missingFields: string[];
  invalidFields: string[];
  warnings: string[];
  suggestions: string[];
}

class FrontmatterValidator {
  private readonly requiredFields = [
    'title', 'version', 'introduced', 'purpose', 
    'readTime', 'complexity', 'status'
  ];

  private readonly validComplexity = ['beginner', 'intermediate', 'advanced'];
  private readonly validStatus = ['ACTIVE', 'DEPRECATED', 'ARCHIVED'];
  private readonly validCriticality = ['MANDATORY', 'RECOMMENDED', 'OPTIONAL'];
  private readonly currentVersion = '2025.1.0';

  async validateFile(filePath: string): Promise<ValidationResult> {
    const result: ValidationResult = {
      filePath,
      isValid: true,
      missingFields: [],
      invalidFields: [],
      warnings: [],
      suggestions: []
    };

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const { data: frontmatter } = matter(content);

      // Check required fields
      for (const field of this.requiredFields) {
        if (!(field in frontmatter) || !frontmatter[field]) {
          result.missingFields.push(field);
          result.isValid = false;
        }
      }

      // Validate field values
      if (frontmatter.complexity && !this.validComplexity.includes(frontmatter.complexity)) {
        result.invalidFields.push(`complexity: "${frontmatter.complexity}" not in ${this.validComplexity.join(', ')}`);
        result.isValid = false;
      }

      if (frontmatter.status && !this.validStatus.includes(frontmatter.status)) {
        result.invalidFields.push(`status: "${frontmatter.status}" not in ${this.validStatus.join(', ')}`);
        result.isValid = false;
      }

      if (frontmatter.criticality && !this.validCriticality.includes(frontmatter.criticality)) {
        result.invalidFields.push(`criticality: "${frontmatter.criticality}" not in ${this.validCriticality.join(', ')}`);
        result.isValid = false;
      }

      // Version consistency checks
      if (frontmatter.version !== this.currentVersion && frontmatter.status === 'ACTIVE') {
        result.warnings.push(`Active file has version "${frontmatter.version}" but current is "${this.currentVersion}"`);
      }

      // Read time validation
      if (frontmatter.readTime && !frontmatter.readTime.includes('minutes')) {
        result.warnings.push(`readTime "${frontmatter.readTime}" should include "minutes"`);
      }

      // Prerequisites validation
      if (frontmatter.prerequisites) {
        for (const prereq of frontmatter.prerequisites) {
          if (typeof prereq === 'string' && prereq !== 'Basic React and ServiceNow knowledge') {
            const prereqPath = this.resolvePrerequisitePath(filePath, prereq);
            try {
              await fs.access(prereqPath);
            } catch {
              result.warnings.push(`Prerequisite "${prereq}" file not found at ${prereqPath}`);
            }
          }
        }
      }

      // Deprecation checks
      if (frontmatter.status === 'DEPRECATED') {
        if (!frontmatter.replacedBy) {
          result.invalidFields.push('DEPRECATED files must have "replacedBy" field');
          result.isValid = false;
        }
        if (!frontmatter.migrationGuide) {
          result.suggestions.push('DEPRECATED files should have "migrationGuide" field');
        }
      }

      // Pattern file checks
      if (filePath.includes('/patterns/')) {
        if (!frontmatter.criticality) {
          result.suggestions.push('Pattern files should have "criticality" field');
        }
        if (!frontmatter.tags || frontmatter.tags.length === 0) {
          result.suggestions.push('Pattern files should have "tags" for searchability');
        }
      }

    } catch (error) {
      result.isValid = false;
      result.invalidFields.push(`File read error: ${error.message}`);
    }

    return result;
  }

  private resolvePrerequisitePath(currentPath: string, prerequisite: string): string {
    const dir = path.dirname(currentPath);
    const baseName = prerequisite.replace(/\.md$/, '');
    
    // Try same directory first
    let resolvedPath = path.join(dir, `${baseName}.md`);
    if (fs.access(resolvedPath).then(() => true).catch(() => false)) {
      return resolvedPath;
    }
    
    // Try parent directory
    resolvedPath = path.join(path.dirname(dir), `${baseName}.md`);
    return resolvedPath;
  }

  async validateAllFiles(pattern: string = 'docs/**/*.md'): Promise<ValidationResult[]> {
    const files = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/archive/**'] });
    const results: ValidationResult[] = [];

    for (const file of files) {
      const result = await this.validateFile(file);
      results.push(result);
    }

    return results;
  }

  generateReport(results: ValidationResult[]): string {
    const validFiles = results.filter(r => r.isValid);
    const invalidFiles = results.filter(r => !r.isValid);
    const filesWithWarnings = results.filter(r => r.warnings.length > 0);

    let report = `# Frontmatter Validation Report\\n\\n`;
    report += `**Generated:** ${new Date().toISOString()}\\n`;
    report += `**Total Files:** ${results.length}\\n`;
    report += `**Valid Files:** ${validFiles.length} (${Math.round(validFiles.length / results.length * 100)}%)\\n`;
    report += `**Invalid Files:** ${invalidFiles.length} (${Math.round(invalidFiles.length / results.length * 100)}%)\\n`;
    report += `**Files with Warnings:** ${filesWithWarnings.length}\\n\\n`;

    if (invalidFiles.length > 0) {
      report += `## ❌ Invalid Files\\n\\n`;
      for (const result of invalidFiles) {
        report += `### ${result.filePath}\\n`;
        if (result.missingFields.length > 0) {
          report += `**Missing Fields:** ${result.missingFields.join(', ')}\\n`;
        }
        if (result.invalidFields.length > 0) {
          report += `**Invalid Fields:**\\n`;
          for (const field of result.invalidFields) {
            report += `- ${field}\\n`;
          }
        }
        report += `\\n`;
      }
    }

    if (filesWithWarnings.length > 0) {
      report += `## ⚠️ Files with Warnings\\n\\n`;
      for (const result of filesWithWarnings) {
        if (result.warnings.length > 0) {
          report += `### ${result.filePath}\\n`;
          for (const warning of result.warnings) {
            report += `- ${warning}\\n`;
          }
          report += `\\n`;
        }
      }
    }

    report += `## ✅ Valid Files\\n\\n`;
    for (const result of validFiles) {
      report += `- ${result.filePath}\\n`;
    }

    return report;
  }
}

// CLI Usage
async function main() {
  const validator = new FrontmatterValidator();
  const results = await validator.validateAllFiles();
  const report = validator.generateReport(results);
  
  console.log(report);
  
  // Write report to file
  await fs.writeFile('frontmatter-validation-report.md', report);
  
  // Exit with error code if validation failed
  const hasErrors = results.some(r => !r.isValid);
  process.exit(hasErrors ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}

export { FrontmatterValidator, ValidationResult, FrontmatterSchema };
```

---

## 🔄 Automated Migration Script

### **Frontmatter Migration Tool**
```typescript
// scripts/migrate-frontmatter.ts
import fs from 'fs/promises';
import matter from 'gray-matter';
import { FrontmatterValidator, FrontmatterSchema } from './validate-frontmatter';

interface MigrationOptions {
  dryRun?: boolean;
  backupOriginal?: boolean;
  forceUpdate?: boolean;
}

class FrontmatterMigrator {
  private validator = new FrontmatterValidator();

  async migrateFile(filePath: string, options: MigrationOptions = {}): Promise<boolean> {
    const { dryRun = false, backupOriginal = true, forceUpdate = false } = options;

    try {
      // Read current file
      const content = await fs.readFile(filePath, 'utf-8');
      const { data: currentFrontmatter, content: bodyContent } = matter(content);

      // Check if migration is needed
      const validationResult = await this.validator.validateFile(filePath);
      if (validationResult.isValid && !forceUpdate) {
        console.log(`✅ ${filePath} - Already valid, skipping`);
        return false;
      }

      // Create backup if requested
      if (backupOriginal && !dryRun) {
        await fs.copyFile(filePath, `${filePath}.backup`);
      }

      // Generate standardized frontmatter
      const standardizedFrontmatter = await this.generateStandardFrontmatter(
        filePath, 
        currentFrontmatter, 
        bodyContent
      );

      // Create new content
      const newContent = matter.stringify(bodyContent, standardizedFrontmatter);

      if (dryRun) {
        console.log(`🔍 ${filePath} - Would update frontmatter:`);
        console.log(JSON.stringify(standardizedFrontmatter, null, 2));
        return true;
      }

      // Write updated file
      await fs.writeFile(filePath, newContent);
      console.log(`✅ ${filePath} - Frontmatter updated`);
      return true;

    } catch (error) {
      console.error(`❌ ${filePath} - Migration failed: ${error.message}`);
      return false;
    }
  }

  private async generateStandardFrontmatter(
    filePath: string, 
    current: any, 
    bodyContent: string
  ): Promise<FrontmatterSchema> {
    const standardized: any = {
      title: current.title || this.extractTitleFromContent(bodyContent) || path.basename(filePath, '.md'),
      version: current.version || "2025.1.0",
      introduced: current.introduced || current.version || "2025.1.0",
      purpose: current.purpose || this.extractPurposeFromContent(bodyContent) || "Documentation purpose",
      readTime: current.readTime || this.calculateReadTime(bodyContent),
      complexity: current.complexity || this.inferComplexity(filePath, bodyContent),
      status: current.status || (current.version?.startsWith('2024') ? 'DEPRECATED' : 'ACTIVE')
    };

    // Add conditional fields based on file type and existing data
    if (filePath.includes('/patterns/')) {
      standardized.criticality = current.criticality || this.inferCriticality(bodyContent);
      standardized.tags = current.tags || this.inferTags(filePath, bodyContent);
    }

    if (current.prerequisites) {
      standardized.prerequisites = current.prerequisites;
    }

    if (current['breaking-changes']) {
      standardized['breaking-changes'] = current['breaking-changes'];
    }

    if (standardized.status === 'DEPRECATED') {
      standardized.deprecates = current.deprecates || ['Legacy patterns'];
      if (!current.replacedBy) {
        standardized.replacedBy = this.suggestReplacement(filePath);
      }
      standardized.migrationGuide = current.migrationGuide || 'migration-2024-to-2025';
    }

    return standardized;
  }

  private extractTitleFromContent(content: string): string | null {
    const titleMatch = content.match(/^#\\s+(.+)/m);
    return titleMatch ? titleMatch[1].trim() : null;
  }

  private extractPurposeFromContent(content: string): string | null {
    const purposeMatch = content.match(/\\*\\*Purpose:\\*\\*\\s+(.+)/);
    return purposeMatch ? purposeMatch[1].trim() : null;
  }

  private calculateReadTime(content: string): string {
    const words = content.split(/\\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200)); // 200 words per minute
    return `${minutes} minutes`;
  }

  private inferComplexity(filePath: string, content: string): 'beginner' | 'intermediate' | 'advanced' {
    if (content.includes('CRITICAL') || content.includes('MANDATORY')) {
      return 'intermediate';
    }
    if (filePath.includes('core-principles') || filePath.includes('quick-')) {
      return 'beginner';
    }
    if (content.includes('TypeScript') || content.includes('advanced')) {
      return 'advanced';
    }
    return 'intermediate';
  }

  private inferCriticality(content: string): 'MANDATORY' | 'RECOMMENDED' | 'OPTIONAL' {
    if (content.includes('CRITICAL') || content.includes('MANDATORY')) {
      return 'MANDATORY';
    }
    if (content.includes('essential') || content.includes('important')) {
      return 'RECOMMENDED';
    }
    return 'OPTIONAL';
  }

  private inferTags(filePath: string, content: string): string[] {
    const tags: string[] = [];
    
    if (content.includes('ServiceNow')) tags.push('servicenow');
    if (content.includes('React')) tags.push('react');
    if (content.includes('TypeScript')) tags.push('typescript');
    if (content.includes('TanStack Query')) tags.push('tanstack-query');
    if (content.includes('component')) tags.push('components');
    if (content.includes('hook')) tags.push('hooks');
    if (content.includes('authentication')) tags.push('authentication');
    if (content.includes('error')) tags.push('error-handling');
    if (filePath.includes('patterns')) tags.push('patterns');
    if (filePath.includes('reference')) tags.push('reference');
    
    return tags.slice(0, 5); // Limit to 5 tags
  }

  private suggestReplacement(filePath: string): string {
    if (filePath.includes('legacy') || filePath.includes('old')) {
      return 'service-layer-integration';
    }
    if (filePath.includes('data-fetch')) {
      return 'service-layer-integration';
    }
    return 'core-principles';
  }

  async migrateAllFiles(pattern: string = 'docs/**/*.md', options: MigrationOptions = {}): Promise<void> {
    const validator = new FrontmatterValidator();
    const results = await validator.validateAllFiles(pattern);
    const filesToMigrate = results.filter(r => !r.isValid || options.forceUpdate);

    console.log(`Found ${filesToMigrate.length} files that need migration`);

    let successCount = 0;
    for (const result of filesToMigrate) {
      const success = await this.migrateFile(result.filePath, options);
      if (success) successCount++;
    }

    console.log(`\\n✅ Migration complete: ${successCount}/${filesToMigrate.length} files updated`);
  }
}

// CLI Usage
async function main() {
  const args = process.argv.slice(2);
  const options: MigrationOptions = {
    dryRun: args.includes('--dry-run'),
    backupOriginal: !args.includes('--no-backup'),
    forceUpdate: args.includes('--force')
  };

  const migrator = new FrontmatterMigrator();
  await migrator.migrateAllFiles('docs/**/*.md', options);
}

if (require.main === module) {
  main().catch(console.error);
}

export { FrontmatterMigrator };
```

---

## 📋 Package.json Scripts

### **Add to package.json**
```json
{
  "scripts": {
    "docs:validate": "ts-node scripts/validate-frontmatter.ts",
    "docs:migrate": "ts-node scripts/migrate-frontmatter.ts",
    "docs:migrate:dry-run": "ts-node scripts/migrate-frontmatter.ts --dry-run",
    "docs:migrate:force": "ts-node scripts/migrate-frontmatter.ts --force",
    "docs:report": "ts-node scripts/validate-frontmatter.ts > frontmatter-report.md",
    "docs:check": "npm run docs:validate && echo 'All documentation frontmatter is valid'",
    "lint:docs": "npm run docs:validate"
  },
  "devDependencies": {
    "gray-matter": "^4.0.3",
    "glob": "^8.0.3",
    "@types/glob": "^8.0.0",
    "ts-node": "^10.9.1"
  }
}
```

---

## 🚀 Usage Examples

### **Validate All Documentation**
```bash
# Check all documentation for frontmatter compliance
npm run docs:validate

# Generate detailed report
npm run docs:report

# Quick validation check (exits with error if invalid)
npm run docs:check
```

### **Migrate Documentation**
```bash
# Dry run - see what would be changed
npm run docs:migrate:dry-run

# Migrate all invalid files (with backup)
npm run docs:migrate

# Force update all files (even valid ones)
npm run docs:migrate:force

# Migrate without creating backups
npm run docs:migrate -- --no-backup
```

### **CI/CD Integration**
```yaml
# .github/workflows/docs-validation.yml
name: Documentation Quality
on: [push, pull_request]
jobs:
  validate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run docs:validate
      - name: Upload validation report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: frontmatter-validation-report
          path: frontmatter-validation-report.md
```

---

## 📊 Current Migration Status

### **Completed ✅**
- [x] Core architecture files standardized
- [x] Key pattern files updated with full frontmatter
- [x] Migration guide created with comprehensive frontmatter
- [x] Validation tools implemented
- [x] Deprecation tracking system established

### **Remaining Tasks ⚠️**
- [ ] Update remaining pattern files with standardized frontmatter
- [ ] Validate all prerequisite chains are working
- [ ] Complete tag standardization across all files
- [ ] Implement automated read time validation
- [ ] Setup CI/CD pipeline for continuous validation

### **Quality Metrics Target**
- **100% frontmatter compliance** - All required fields present
- **95% version consistency** - Proper version alignment
- **Zero broken prerequisites** - All prerequisite links valid
- **±1 minute read time accuracy** - Reliable time estimates

---

*These tools ensure consistent, high-quality documentation metadata that enables better discovery, navigation, and maintenance of the ServiceNow React architecture documentation.*