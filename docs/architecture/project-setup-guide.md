---
title: "ServiceNow React Project Setup Guide"
version: "2025.1.3"
introduced: "2025.1.0"
lastUpdated: "2025.1.3"
purpose: "Complete ServiceNow React project setup with ServiceNow-compatible styling architecture"
readTime: "12 minutes"
complexity: "beginner"
criticality: "MANDATORY"
tags: ["setup", "configuration", "servicenow", "project", "styling", "plain-css", "sdk-tools"]
validationStatus: "PRODUCTION_TESTED"
---

# ServiceNow React Project Setup Guide

**Purpose:** Complete ServiceNow React project setup with ServiceNow-compatible styling architecture  
**Read time:** ~12 minutes  
**Use case:** Setting up new ServiceNow React applications from scratch

> **⚠️ CRITICAL:** This guide establishes the foundation for all ServiceNow React development. Follow completely before building components. Updated based on real ServiceNow development experience.

---

## 🤖 ServiceNow SDK Tool Dependencies Overview

> **🚨 CRITICAL:** This setup guide assumes you're using **ServiceNow SDK automated tools** which provide limited control over command execution. Understand these limitations before proceeding.

### **🛠️ Tool Control Levels**

| **Setup Phase** | **Tool Used** | **Your Control** | **Tool Controls** |
|-----------------|---------------|------------------|-------------------|
| **Project Creation** | `create_new_servicenow_app` | ❌ **None** | Directory structure, dependencies, configuration |
| **Dependency Management** | `install_dependencies` | ❌ **None** | Package installation, version resolution |
| **Building** | `build` | ❌ **None** | NODE_ENV, build flags, optimization settings |
| **Deployment** | `deploy` | ❌ **None** | Build + deployment pipeline |

### **📋 Command Guidance Context**

Throughout this guide, commands are marked with their control level:

#### **🤖 ServiceNow SDK Tool Commands (Limited Control)**
```bash
# ⚠️ These commands are controlled by ServiceNow SDK tools
create_new_servicenow_app     # Tool controls entire project creation
install_dependencies          # Tool controls package management  
build                         # Tool controls NODE_ENV=production, build settings
deploy                        # Tool controls full deployment pipeline
```

#### **🔧 Direct Commands (Full Control - When Available)**
```bash
# ✅ These work when you have direct command access
npm install package-name      # Direct control - works outside SDK tools
npm run dev                   # Direct control - if package.json scripts available
NODE_ENV=development npm run build  # Direct control - environment variables work
```

### **🚨 Key Limitations During Setup**

#### **Environment Variables**
```bash
# ❌ These will NOT work with ServiceNow SDK tools:
NODE_ENV=development create_new_servicenow_app
NODE_ENV=development build
NODE_ENV=production deploy

# ✅ ServiceNow SDK tools always use:
# create_new_servicenow_app: Uses SDK defaults
# build: Always sets NODE_ENV=production  
# deploy: Always sets NODE_ENV=production
```

#### **Package.json Script Control**
```json
// ❌ These package.json scripts are BYPASSED by SDK tools:
{
  "scripts": {
    "build": "NODE_ENV=development webpack build",    // Ignored by build tool
    "postinstall": "npm run setup-custom",          // Ignored by install_dependencies
    "predeploy": "npm run lint"                      // Ignored by deploy tool
  }
}
```

#### **Dependency Installation**
```bash
# ❌ Cannot run directly when using ServiceNow SDK tools:
npm install new-package       # Must update package.json first, then use install_dependencies
npm ci                        # Must use install_dependencies tool instead
```

---

## Prerequisites

### **Required Tools**
- Node.js 18+ (LTS recommended)
- ServiceNow SDK (`npm install -g @servicenow/cli`)
- Git for version control
- VS Code with ServiceNow extension (recommended)

### **ServiceNow Requirements**
- ServiceNow instance (Personal Developer Instance or higher)
- Admin access or appropriate roles
- React UI Pages feature enabled

---

## Phase 1: ServiceNow Application Foundation (5 minutes)

### **Step 1: Create ServiceNow Application**

> **🤖 ServiceNow SDK Tool:** `create_new_servicenow_app` - **Limited Control**

```bash
# ⚠️ LIMITED CONTROL: ServiceNow SDK controls entire project creation process
create_new_servicenow_app

# Tool will prompt for:
# - Application name: "Your App Name"
# - Scope: x_company_your_app  
# - Template selection: React TypeScript (recommended)

# Tool automatically creates:
# - Directory structure (you cannot modify during creation)
# - Dependencies (versions chosen by SDK)
# - Configuration files (SDK defaults)
# - Build scripts (SDK-controlled)
```

**Alternative for Direct Control:**
```bash
# ✅ FULL CONTROL: If you have direct command access (not using build agents)
npx @servicenow/cli project create
# Then follow prompts with full control over configuration
```

### **Step 2: Verify ServiceNow Configuration**

> **🤖 ServiceNow SDK Tool:** `build` - **Limited Control**

```bash
# ⚠️ LIMITED CONTROL: ServiceNow SDK controls build environment
build

# Tool automatically:
# - Sets NODE_ENV=production (cannot override)
# - Uses SDK build flags (cannot modify)
# - Applies SDK optimizations (cannot disable)

# Verify files created
ls -la src/
# Should see: fluent/, client/ directories
```

**Alternative for Direct Control:**
```bash
# ✅ FULL CONTROL: If package.json scripts are available
npm run build    # Uses your package.json scripts
# Or direct webpack/vite commands if configured
```

> **⚠️ CRITICAL UI PAGE CONFIGURATION:** Before proceeding to development, you MUST understand the correct UI Page configuration patterns to avoid runtime errors. **Read [UI Page Configuration Reference](reference/ui-page-configuration.md)** - this prevents 90% of deployment failures.

---

## Phase 2: ServiceNow-Compatible Styling Architecture (6 minutes)

> **🎯 CRITICAL SECTION:** This styling setup is **mandatory** for scalable ServiceNow applications and is the **only approach that works** in ServiceNow UI Pages.

### **Step 3: Install Essential Dependencies**

> **🤖 ServiceNow SDK Tool:** `install_dependencies` - **Limited Control**

```bash
# Step 3a: Update package.json manually first
# ⚠️ IMPORTANT: You must edit package.json manually before using the tool

# Edit package.json to add:
# "clsx": "2.0.0"                    # Utility for class name management
# "@tanstack/react-query": "4.32.6"  # Optional: Data management (recommended)
# "@types/react": "18.0.21"          # Optional: TypeScript utilities
# "@types/react-dom": "18.0.6"       # Optional: TypeScript utilities

# Step 3b: Install using ServiceNow SDK tool
install_dependencies

# ⚠️ LIMITED CONTROL: Tool controls:
# - Installation process (cannot use npm install directly)
# - Version resolution (uses package.json versions)
# - Package manager choice (SDK decides npm/yarn)
```

**Alternative for Direct Control:**
```bash
# ✅ FULL CONTROL: If you can run npm directly
npm install clsx @tanstack/react-query
npm install -D @types/react @types/react-dom
```

### **Step 4: Environment-Aware Development Setup**

> **🚨 CRITICAL:** Due to ServiceNow SDK tool limitations, environment-dependent code needs special handling.

```typescript
// ❌ PROBLEM: This will ALWAYS be false in deployed ServiceNow apps
if (process.env.NODE_ENV === 'development') {
  // Development-only code NEVER runs with deploy tool
  enableDevTools();
}

// ✅ SOLUTION: Use runtime detection for ServiceNow SDK environments
const isDebugMode = window.location.search.includes('debug=true') || 
                    localStorage.getItem('debug-mode') === 'true';

if (isDebugMode) {
  // This will work in deployed ServiceNow apps when ?debug=true is added to URL
  enableDevTools();
}
```

### **Step 5: Create ServiceNow Design System Foundation**

> **⚠️ CRITICAL:** Tailwind CSS doesn't work in ServiceNow UI Pages. Use plain CSS with component classes.

**Complete CSS design system implementation available in [Styling Practices Guide](styling-practices.md)**

---

## Phase 3: ServiceNow Integration Layer (3 minutes)

### **Step 6: ServiceNow Data Integration**

> **🎯 MANDATORY READING:** Before implementing any ServiceNow service layer, read **[Service Layer Integration Guide](patterns/service-layer-integration.md)** - this architecture is essential for professional applications.

**Basic ServiceNow service setup:**
```typescript
// src/client/services/BaseServiceNowService.ts
export abstract class BaseServiceNowService {
  protected readonly baseURL = '/api/now';
  
  protected getAuthToken(): string {
    const token = (window as any).g_ck;
    if (!token) {
      throw new Error('No ServiceNow authentication token available');
    }
    return token;
  }
  
  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Implementation details in Service Layer Integration Guide
  }
}
```

### **Step 7: Advanced ServiceNow Patterns**

For complex applications, reference these additional patterns:

- **[ServiceNow User Context Patterns](reference/servicenow-user-context.md)** - Get current user, roles, permissions
- **[Advanced Query Patterns](reference/servicenow-query-patterns.md)** - Complex filtering, joins, aggregations
- **[Implementation Troubleshooting](reference/implementation-troubleshooting.md)** - Common setup issues and solutions

---

## Phase 4: Component Foundation (2 minutes)

### **Step 8: Create Atomic Design Directory Structure**
```bash
# ✅ FULL CONTROL: Directory creation works normally
mkdir -p src/client/components/{atoms,molecules,organisms,templates}
mkdir -p src/client/hooks
mkdir -p src/client/services
mkdir -p src/client/types
```

### **Step 9: Foundation Components**

**Follow atomic design patterns with the complete design system from [Styling Practices Guide](styling-practices.md)**

---

## Development Workflow with ServiceNow SDK Tools

### **🔄 Typical Development Cycle**

> **⚠️ All commands below use ServiceNow SDK tools with limited control**

```bash
# 1. Create new feature branch
git checkout -b feature/new-component

# 2. Edit code files (full control)
# - Add components in src/client/components/
# - Update styles in src/client/styles/
# - Add services in src/client/services/

# 3. Install new dependencies (if needed)
# Edit package.json manually first, then:
install_dependencies                    # ⚠️ LIMITED CONTROL

# 4. Build application
build                                   # ⚠️ LIMITED CONTROL (NODE_ENV=production)

# 5. Deploy to ServiceNow instance  
deploy                                  # ⚠️ LIMITED CONTROL (includes build)

# 6. Test in ServiceNow environment
# Navigate to your UI Page URL

# 7. Debug if needed (runtime debugging only)
# Add ?debug=true to URL for debug features
# Use browser DevTools for debugging
```

### **🎯 Working Within Tool Limitations**

#### **Development vs Production Behavior**
```typescript
// ❌ This approach doesn't work with ServiceNow SDK tools
const isDevelopment = process.env.NODE_ENV === 'development'; // Always false

// ✅ Use runtime flags instead
const isDebugMode = new URLSearchParams(window.location.search).get('debug') === 'true';
const isDevelopment = isDebugMode || window.location.hostname.includes('localhost');
```

#### **Feature Flags for Development**
```typescript
// ✅ Use localStorage or URL parameters for development features
const debugFeatures = {
  performanceMonitoring: localStorage.getItem('debug-performance') === 'true',
  verboseLogging: new URLSearchParams(window.location.search).get('verbose') === 'true',
  devTools: window.location.search.includes('devtools=true')
};

if (debugFeatures.performanceMonitoring) {
  // Enable performance monitoring in production if needed
}
```

---

## Validation Checklist

### **✅ ServiceNow Foundation**
- [ ] `create_new_servicenow_app` completed successfully
- [ ] `build` completes without errors (NODE_ENV will be production)
- [ ] **[UI Page Configuration Reference](reference/ui-page-configuration.md)** patterns validated

### **✅ ServiceNow Integration**
- [ ] **[Service Layer Integration](patterns/service-layer-integration.md)** architecture implemented
- [ ] **[User Context Patterns](reference/servicenow-user-context.md)** configured (if needed)
- [ ] **[Advanced Query Patterns](reference/servicenow-query-patterns.md)** understood (for complex data)

### **✅ Development Workflow**
- [ ] **[Implementation Troubleshooting](reference/implementation-troubleshooting.md)** consulted for any issues
- [ ] `deploy` successful (includes production build)
- [ ] Runtime debugging approach established (URL params, localStorage)

### **✅ Tool Limitations Understood**
- [ ] NODE_ENV will always be 'production' in deployed apps
- [ ] Environment-dependent code uses runtime detection
- [ ] Package.json changes require `install_dependencies` tool
- [ ] Debug features use URL parameters or localStorage

---

## Next Steps

### **📚 Essential Reading for Development**
**MANDATORY before proceeding:**
- **[UI Page Configuration Reference](reference/ui-page-configuration.md)** - Configuration patterns ✅ **CRITICAL**
- **[Service Layer Integration](patterns/service-layer-integration.md)** - Data architecture ✅ **MANDATORY**  
- **[Styling Practices](styling-practices.md)** - Design system usage ✅ **MANDATORY**

**As needed for complex features:**
- [ServiceNow User Context Patterns](reference/servicenow-user-context.md) - User data integration
- [Advanced Query Patterns](reference/servicenow-query-patterns.md) - Complex data operations
- [Implementation Troubleshooting](reference/implementation-troubleshooting.md) - Problem solving

### **🏗️ Development Workflow with Tool Constraints**
1. **Read mandatory documentation** - Prevents major architectural issues
2. **Follow three-layer architecture** - Service → TanStack Query → Components  
3. **Use design system classes** - Consistent, ServiceNow-compatible styling
4. **Plan for production environment** - All deployed apps use NODE_ENV=production
5. **Use runtime debugging** - URL parameters and localStorage for debug features
6. **Test incrementally** - `build` → `deploy` → Validate cycle

---

## Troubleshooting

### **🔧 Most Common Issues**
- **UI Page runtime errors** → See [UI Page Configuration Reference](reference/ui-page-configuration.md)
- **Service integration issues** → See [Service Layer Integration](patterns/service-layer-integration.md)
- **User context problems** → See [ServiceNow User Context Patterns](reference/servicenow-user-context.md)
- **Complex query failures** → See [Advanced Query Patterns](reference/servicenow-query-patterns.md)
- **Build/deployment errors** → See [Implementation Troubleshooting](reference/implementation-troubleshooting.md)
- **Environment variable issues** → Use runtime detection instead of NODE_ENV
- **Development feature not working** → Check if using URL parameters or localStorage

### **🤖 ServiceNow SDK Tool Issues**
- **`create_new_servicenow_app` fails** → Check ServiceNow CLI installation and permissions
- **`build` fails** → Check for TypeScript errors, missing dependencies
- **`deploy` fails** → Verify ServiceNow instance connection, check error logs
- **`install_dependencies` fails** → Verify package.json syntax, check network connection

### **📞 Getting Help**
1. **Check error message** against troubleshooting guides
2. **Validate configuration** using reference checklists  
3. **Review architecture patterns** in service layer guide
4. **Test with minimal examples** from documentation
5. **Verify tool limitations** - ensure you're not trying to override ServiceNow SDK behavior

---

*This setup provides a production-ready foundation for scalable ServiceNow React applications with full awareness of ServiceNow SDK tool limitations. The referenced documentation prevents common pitfalls and ensures enterprise-grade architecture that works within ServiceNow's automated build and deployment pipeline.*