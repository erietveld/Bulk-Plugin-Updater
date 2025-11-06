---
title: "ServiceNow UI Page Configuration Reference"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Critical UI Page configuration patterns and error prevention"
readTime: "5 minutes"
complexity: "intermediate"
criticality: "MANDATORY"
tags: ["ui-page", "configuration", "troubleshooting", "imports", "client-script"]
validationStatus: "PRODUCTION_TESTED"
---

# ServiceNow UI Page Configuration Reference

**Purpose:** Critical UI Page configuration patterns and error prevention  
**Read time:** ~5 minutes  
**Use case:** Preventing common UI Page runtime errors and deployment failures

> **⚠️ CRITICAL:** This reference prevents 90% of UI Page runtime errors. Always validate configuration patterns before deployment.

---

## 🚨 Critical Configuration Patterns

### **Two Valid UI Page Patterns (NEVER MIX)**

ServiceNow supports exactly **two distinct patterns** that cannot be combined:

**Pattern A: Server-Side Script Inclusion**
```typescript
UiPage({
  html: Now.include('../../client/index.html'),
  clientScript: Now.include('../../client/main.tsx'),  // Server includes script
  // HTML should NOT have module script tags
});
```

**Pattern B: Client-Side Module Loading (Recommended)**
```typescript
UiPage({
  html: htmlFile,
  direct: true,  // HTML handles its own scripts
  // NO clientScript property
});
```

> **⚡ NEVER combine both patterns** - causes script duplication and import errors.

---

## 🔥 Common Fatal Errors

### **Error 1: Mixed Configuration Patterns**

**❌ FATAL - Causes "Cannot use import statement outside a module"**
```typescript
// WRONG: Mixing both patterns
UiPage({
  html: htmlFile,
  clientScript: Now.include('../../client/main.tsx'),  // Included as regular script
  direct: true  // HTML also includes as module script
});
```

**Root Cause:** Script included twice:
1. Once as regular script (from `clientScript`) → Cannot parse ES6 imports
2. Once as module script (from HTML) → Works but conflicts

**✅ SOLUTION: Use only Pattern B**
```typescript
UiPage({
  html: htmlFile,
  direct: true,  // ONLY this
  description: 'My React application'
});
```

### **Error 2: Import/Export Mismatch**

**❌ FATAL - "Module has no default export"**
```javascript
// App.tsx - Named export
export function App() { ... }

// main.tsx - Default import (WRONG)
import App from './App';
```

**✅ SOLUTION: Match import/export patterns**
```javascript
// App.tsx - Named export
export function App() { ... }

// main.tsx - Named import (CORRECT)
import { App } from './App';
```

### **Error 3: Case-Sensitive File Duplicates**

**❌ FATAL - File system conflicts**
```
src/client/
├── App.tsx     ← Conflict on case-insensitive systems
└── app.tsx     ← Same logical file, different case
```

**✅ SOLUTION: Use consistent PascalCase**
```
src/client/
└── App.tsx     ← Single file, PascalCase
```

### **Error 4: Incorrect HTML Structure**

**❌ WRONG - Standard web HTML**
```html
<!DOCTYPE html>  <!-- Remove DOCTYPE -->
<html lang="en">  <!-- Remove attributes -->
<head>
    <meta charset="UTF-8">  <!-- Remove meta tags -->
    <script type="module" src="./main.tsx"></script>  <!-- Wrong path -->
</head>
```

**✅ CORRECT - ServiceNow UI Page HTML**
```html
<html>  <!-- Simple tag -->
<head>
    <title>My App</title>  <!-- Title only -->
    <sdk:now-ux-globals></sdk:now-ux-globals>  <!-- Required -->
    <script src="main.tsx" type="module"></script>  <!-- Relative path -->
</head>
<body>
    <div id="root"></div>
</body>
</html>
```

---

## ✅ Validated Working Template

### **Use This Exact Pattern**

**UI Page Definition:**
```typescript
// src/fluent/ui-pages/my-page.now.ts
import '@servicenow/sdk/global';
import { UiPage } from '@servicenow/sdk/core';
import pageHtml from '../../client/index.html';

export const my_page = UiPage({
  $id: Now.ID['my-page'],
  endpoint: 'x_app_page.do',
  html: pageHtml,
  direct: true,  // Pattern B: Client-side module loading
  description: 'Description of the page'
});
```

**HTML Structure:**
```html
<!-- src/client/index.html -->
<html>
<head>
  <title>My App</title>
  <sdk:now-ux-globals></sdk:now-ux-globals>
  <script src="main.tsx" type="module"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

**React Bootstrap:**
```jsx
// src/client/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';  // Named import

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

**App Component:**
```jsx
// src/client/App.tsx
import React from 'react';

export function App() {  // Named export
  return <div>Hello World</div>;
}
```

---

## 🔍 Pre-Deployment Validation Checklist

### **MANDATORY Configuration Validation**

**✅ File Structure Validation**
- [ ] No duplicate files with different casing (`App.tsx` vs `app.tsx`)
- [ ] React components use PascalCase naming
- [ ] All imports match their corresponding exports (named ↔ named, default ↔ default)

**✅ UI Page Pattern Validation**  
- [ ] Choose ONLY one pattern: `clientScript` XOR `direct: true`
- [ ] If using `direct: true`, HTML must have `<script type="module">`
- [ ] If using `clientScript`, HTML must NOT have script tags
- [ ] Never use both `clientScript` and `direct: true` together

**✅ HTML Structure Validation**
- [ ] No DOCTYPE declaration
- [ ] No HTML attributes (`lang`, `charset`, etc.)
- [ ] Include `<sdk:now-ux-globals></sdk:now-ux-globals>`  
- [ ] Script src uses relative path (`main.tsx`, not `./main.tsx`)

**✅ Import/Export Validation**
- [ ] Named exports use named imports: `export function` → `import {}`
- [ ] Default exports use default imports: `export default` → `import`
- [ ] All file references use correct case sensitivity

---

## 🛠️ Error Diagnosis Quick Reference

| **Error Message** | **Root Cause** | **Solution** |
|-------------------|----------------|--------------|
| "Cannot use import statement outside a module" | Mixed UI Page patterns | Remove `clientScript`, use only `direct: true` |
| "Module has no default export" | Import/export mismatch | Change to named import: `import { App }` |
| "Failed to load module script" | Wrong HTML structure | Add `<sdk:now-ux-globals>` and fix script path |
| Build fails with duplicate modules | Case-sensitive file duplicates | Remove duplicate files, use PascalCase |
| "Page not found" | HTML script tag missing | Add `<script src="main.tsx" type="module">` to HTML |

---

## 🎯 Pattern Decision Matrix

| **Scenario** | **Recommended Pattern** | **Reasoning** |
|--------------|------------------------|---------------|
| **React Applications** | Pattern B (`direct: true`) | Full ES6 module support, better debugging |
| **Simple HTML + vanilla JS** | Pattern A (`clientScript`) | Server-side script inclusion, no modules needed |
| **TypeScript/JSX** | Pattern B (`direct: true`) | Requires module system for proper compilation |
| **Third-party libraries** | Pattern B (`direct: true`) | NPM packages expect ES6 module resolution |

> **💡 RECOMMENDATION:** Always use Pattern B (`direct: true`) for React applications - it provides the most flexibility and debugging capabilities.

---

## 🚫 Anti-Patterns to Avoid

### **Never Do These**

**❌ Script Duplication**
```typescript
// WRONG: Including script twice
UiPage({
  html: htmlWithScriptTag,      // HTML has <script> tag
  clientScript: scriptFile,     // AND server includes script
  direct: true                  // AND direct mode enabled
});
```

**❌ Import/Export Mismatches**
```javascript
// WRONG: Mixed patterns
export default function App() {}  // Default export
import { App } from './App';      // Named import
```

**❌ Case-Sensitive Conflicts**
```
// WRONG: Multiple files with same name, different case
App.tsx
app.tsx  
APP.tsx
```

**❌ Standard Web HTML in ServiceNow**
```html
<!-- WRONG: Web standards don't apply -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <link rel="stylesheet" href="styles.css">
</head>
```

---

## 🔄 Migration Patterns

### **From Pattern A to Pattern B**

**Before (Pattern A):**
```typescript
UiPage({
  html: Now.include('../../client/index.html'),
  clientScript: Now.include('../../client/main.tsx'),
});
```

**After (Pattern B):**
```typescript
UiPage({
  html: htmlFile,  // Import HTML as module
  direct: true,    // Enable client-side loading
});
```

**Update HTML:**
```html
<!-- Add script tag to HTML -->
<script src="main.tsx" type="module"></script>
```

### **From Mixed Patterns (Broken) to Pattern B**

**Before (Broken):**
```typescript
UiPage({
  html: htmlFile,
  clientScript: Now.include('../../client/main.tsx'),  // Remove this
  direct: true,
});
```

**After (Fixed):**
```typescript
UiPage({
  html: htmlFile,
  direct: true,    // Keep only this
});
```

---

## 📝 Quick Implementation Steps

### **For New UI Pages**

1. **Choose Pattern B** (`direct: true`) for React applications
2. **Create HTML** with `<sdk:now-ux-globals>` and module script tag
3. **Define UI Page** with only `html` and `direct: true` properties
4. **Validate imports/exports** match between files
5. **Build and test** before deployment

### **For Debugging Existing Pages**

1. **Check error message** against diagnosis table
2. **Identify pattern** currently being used
3. **Validate configuration** matches chosen pattern exactly
4. **Fix any mixed patterns** by choosing one approach
5. **Verify file naming** has no case-sensitive conflicts

---

*Configuration validation prevents 90% of UI Page runtime errors. Always follow exact patterns and validate before deployment.*