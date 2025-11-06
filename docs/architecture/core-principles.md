---
title: "Core Development Principles"
version: "2025.1.5"
introduced: "2024.3.0" 
lastUpdated: "2025.1.24"
purpose: "Fundamental philosophy and standards for ServiceNow React development"
readTime: "8 minutes"
complexity: "beginner"
status: "ACTIVE"
criticality: "MANDATORY"
prerequisites: ["Basic React and ServiceNow knowledge"]
tags: ["architecture", "principles", "foundation", "servicenow", "react"]
validationStatus: "PRODUCTION_TESTED"
---

# Core Development Principles

**Purpose:** Fundamental philosophy and standards for ServiceNow React development  
**Read time:** ~8 minutes  
**Prerequisites:** Basic React and ServiceNow knowledge

> **🚨 CRITICAL:** Updated based on real-world ServiceNow development experience. See [validation results](#architecture-validation-status) for what's proven vs theoretical.

---

## 🏗️ **Three-Tier Architecture Foundation**

This foundational guide establishes the "WHY" of ServiceNow React development and forms part of a strategic three-tier architecture:

### **📋 Strategic Foundation** → **Core Principles** *(This Document)*
**"WHY we build this way"** - Architectural foundation, ServiceNow constraints, technology decisions
- Development philosophy and approach
- ServiceNow platform constraints and build system limitations
- Technology stack decisions and compatibility analysis
- Hybrid development approach rationale

### **🎯 Implementation Patterns** → [ServiceNow React Essential Patterns](servicenow-react-essential-patterns.md) *(10 min)*
**"WHAT patterns to implement"** - Complete pattern library and implementation reference
- 8 essential patterns with complete code examples and validation
- Performance monitoring integration with ServiceNow constraints
- Architectural guidance building on these core principles

### **⚡ Rapid Execution** → [Quick Implementation Guide](quick-implementation-guide.md) *(5 min)*
**"HOW to build features fast"** - Time-boxed development workflow
- 25-minute development workflow applying these principles and patterns
- Step-by-step implementation with atomic design
- ServiceNow SDK tool awareness and practical constraints

---

## 🛠️ ServiceNow SDK Tool Dependencies & Limitations

> **⚠️ CRITICAL UPDATE:** When using ServiceNow SDK automated tools (build agents), you have **limited control** over command execution and environment configuration.

### **🤖 ServiceNow SDK Automated Tools Overview**

The ServiceNow SDK provides several automated tools that handle complex operations:

| **Tool** | **Purpose** | **Developer Control** | **Limitations** |
|----------|-------------|----------------------|-----------------|
| **`create_new_servicenow_app`** | Project creation | ❌ **None** | Creates structure, dependencies, configuration automatically |
| **`build`** | Application building | ❌ **None** | Controls NODE_ENV, build flags, optimization settings |
| **`deploy`** | Application deployment | ❌ **None** | Handles build + deployment pipeline internally |
| **`install_dependencies`** | Package management | ❌ **None** | Installs/updates packages per package.json |

### **🚨 Key Limitations When Using Build Agents**

#### **1. Environment Variables (NODE_ENV)**
```bash
# ❌ You CANNOT control these when using ServiceNow SDK tools:
NODE_ENV=development npm run build    # SDK tools ignore this
NODE_ENV=production npm run deploy     # SDK tools override this

# ✅ What actually happens with ServiceNow SDK tools:
# build tool:   Always sets NODE_ENV=production
# deploy tool:  Always sets NODE_ENV=production (includes build)
# This affects all code using: process.env.NODE_ENV
```

**Impact on Your Code:**
```typescript
// ❌ This will ALWAYS be false in deployed ServiceNow apps
if (process.env.NODE_ENV === 'development') {
  // Performance monitoring, debug logs, etc.
  // This code NEVER runs when using deploy tool
}

// ✅ Alternative approach for ServiceNow SDK environments
// See: ServiceNow React Essential Patterns for complete monitoring solution
const isDebugMode = window.location.href.includes('?sn_debug=true');
if (isDebugMode) {
  // Use URL parameters or other runtime flags
}
```

#### **2. Build Script Control**
```json
// ❌ These package.json scripts are BYPASSED by ServiceNow SDK tools:
{
  "scripts": {
    "build": "NODE_ENV=development webpack build",    // Ignored by build tool
    "build:dev": "NODE_ENV=development npm run build", // Ignored by build tool
    "deploy": "NODE_ENV=production npm run build"     // Ignored by deploy tool
  }
}

// ✅ These are controlled by ServiceNow SDK internal processes:
// The tools use their own build pipeline, not your package.json scripts
```

#### **3. Dependency Installation Control**
```bash
# ❌ You CANNOT run these directly when using build agents:
npm install lodash@4.17.21          # Use install_dependencies tool instead
npm update @types/react             # Use install_dependencies tool instead
npm ci                              # Use install_dependencies tool instead

# ✅ What you must do instead:
# 1. Update package.json manually
# 2. Use install_dependencies tool
```

### **🚨 ServiceNow UI Page Platform Limitations**

> **📋 CRITICAL:** These are official ServiceNow platform constraints that cannot be worked around through configuration or tooling.

| **Limitation Category** | **Specific Restrictions** | **Impact on Development** |
|-------------------------|---------------------------|---------------------------|
| **HTML Modification** | HTML must be modified only in source code | ❌ Instance changes not synchronized to source |
| **Media Content** | Audio, video, and WASM not supported | ❌ Rich media features unavailable |
| **File Attachments** | Max size limited by `com.glide.attachment.max_size` | ⚠️ Large file handling constraints |
| **Build Output** | Output paths must be deterministic | ⚠️ Dynamic path generation restricted |
| **HTML Preloading** | `rel="preload"` not supported | ❌ Performance optimization limited |
| **CSS Linking** | Relative stylesheets via HTML not supported | ❌ Must use `@import` in code instead |
| **CSS Imports** | Relative imports in CSS not supported | ❌ Path resolution limitations |
| **CSS Modules** | CSS modules not supported | ❌ Scoped styling approach unavailable |
| **Routing** | Only hash routing supported | ⚠️ Browser routing patterns limited |
| **React SSR** | Server-side rendering not supported | ❌ SSR and React server components unavailable |

#### **Development Impact Examples:**

##### **❌ HTML Stylesheet Linking (Not Supported)**
```html
<!-- ❌ FAILS: Relative stylesheet linking not supported -->
<link rel="stylesheet" href="./styles/app.css">
<link rel="preload" href="./fonts/custom-font.woff2" as="font">
```

```typescript
// ✅ SOLUTION: Import stylesheets in JavaScript/TypeScript
import './styles/app.css';          // CSS imports work
import '@import "styles/theme.css"'; // @import directives work
```

##### **❌ Browser Routing (Limited)**
```typescript
// ❌ FAILS: Browser routing not supported in ServiceNow UI Pages
import { BrowserRouter } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter> {/* Won't work in ServiceNow */}
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
```

```typescript
// ✅ SOLUTION: Use hash routing only
import { HashRouter } from 'react-router-dom';

function App() {
  return (
    <HashRouter> {/* Works in ServiceNow UI Pages */}
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </HashRouter>
  );
}
```

##### **❌ CSS Relative Imports (Not Supported)**
```css
/* ❌ FAILS: Relative imports in CSS not supported */
@import './components/buttons.css';     /* Won't resolve */
@import '../shared/variables.css';     /* Won't resolve */
```

```typescript
// ✅ SOLUTION: Import CSS in JavaScript/TypeScript
import './components/buttons.css';      // Works
import '../shared/variables.css';      // Works
```

##### **⚠️ Instance HTML Changes (Not Synchronized)**
```html
<!-- ⚠️ WARNING: Changes made directly in ServiceNow UI Page [sys_ui_page] -->
<!-- These changes will NOT sync back to source code and may cause conflicts -->
<div id="root">
  <!-- Manual changes here are lost during next deployment -->
</div>
```

```typescript
// ✅ SOLUTION: All HTML changes must be made in source code
// Always modify the UI Page source files, never the instance directly
```

### **📋 Command-Line Guidance with Tool Limitations**

Throughout this documentation, when you see command-line suggestions, understand the context:

#### **🔧 Direct Command Environment (Full Control)**
```bash
# ✅ Full control when NOT using ServiceNow SDK build agents
npm run dev                    # Direct control - works as expected
NODE_ENV=development npm start # Direct control - environment variables work
npm install new-package        # Direct control - immediate installation
```

#### **🤖 ServiceNow SDK Tool Environment (Limited Control)**
```bash
# ⚠️ Limited control when using ServiceNow SDK tools
create_new_servicenow_app     # Tool controls: project structure, dependencies
build                         # Tool controls: NODE_ENV, build flags, optimization
deploy                        # Tool controls: build + deployment pipeline
install_dependencies          # Tool controls: package installation process

# 🚨 These will NOT work as expected:
npm run build                 # Bypassed by build tool
NODE_ENV=development deploy   # Ignored by deploy tool
```

### **🎯 Practical Implications**

#### **Environment-Dependent Features**
```typescript
// ❌ PROBLEM: Development-only features never work in deployed apps
const performanceMonitoring = process.env.NODE_ENV === 'development';

// ✅ SOLUTION: Use runtime detection instead
// Complete implementation in: ServiceNow React Essential Patterns
const performanceMonitoring = window.location.search.includes('sn_debug=true') || 
                              localStorage.getItem('debug-mode') === 'true';
```

#### **Build Configuration**
```typescript
// ❌ PROBLEM: Cannot control build optimization via package.json
{
  "scripts": {
    "build:dev": "webpack --mode=development",  // Ignored by build tool
  }
}

// ✅ SOLUTION: Use runtime configuration
const isOptimized = !window.location.hostname.includes('localhost');
```

#### **Development Workflow**
```typescript
// ❌ PROBLEM: Traditional development commands don't work
npm run dev          // Not available with ServiceNow SDK
npm run build:watch  // Not available with ServiceNow SDK

// ✅ SOLUTION: Use ServiceNow SDK workflow
create_new_servicenow_app  // Initial setup
build                      // Development builds
deploy                     // Deploy to ServiceNow instance for testing
```

#### **Routing Implementation**
```typescript
// ❌ PROBLEM: Browser routing not supported
import { BrowserRouter } from 'react-router-dom';

// ✅ SOLUTION: Hash routing only
import { HashRouter } from 'react-router-dom';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/incidents" element={<IncidentList />} />
        <Route path="/incident/:id" element={<IncidentDetail />} />
      </Routes>
    </HashRouter>
  );
}
```

---

## Development Philosophy

### **Configuration-First Backend + Code-First Frontend**

Our development approach combines ServiceNow platform strengths with modern development practices, **accounting for ServiceNow SDK tool limitations**:

#### **1. Builders Before Code (ServiceNow Backend)** 🏗️
**Priority Order for ServiceNow backend logic:**
1. **ServiceNow UI Configuration** (No-code) - Data policies, field constraints, ACLs
2. **Flow Designer** (Low-code visual) - Workflows, state machines, integrations
3. **Decision Builder** (Low-code rules) - Business logic, routing, calculations
4. **System Properties/Config** (Configuration) - Feature flags, settings
5. **Fluent DSL** (Declarative code) - Tables, business rules when builders insufficient
6. **Custom Scripts** (Last resort) - Only when no other option exists

**See:** [ServiceNow Backend Principles](patterns/servicenow-backend-principles.md) for complete implementation guide

#### **2. Code-First Frontend (React Application)** ⚛️
**All React UI components defined in TypeScript with modern patterns:**
- React 19.x for all UI Pages with modern patterns
- TypeScript for type safety and developer experience  
- **CSS Architecture Decision** - Three validated approaches ✅ **UPDATED**
- Modular architecture with clear separation of concerns
- Component libraries and design systems

### **Why This Hybrid Approach?**

#### **ServiceNow Backend (Configuration-First)** ✅
- **Upgradeable** - Platform upgrades won't break configuration
- **Business-friendly** - Non-developers can modify workflows
- **Performance optimized** - Platform-native execution
- **Audit-friendly** - Built-in change tracking
- **Faster delivery** - Visual tools faster than coding

#### **React Frontend (Code-First)** ✅
- **Type safety** - TypeScript prevents runtime errors
- **Component reusability** - Shared UI libraries
- **Modern UX** - Rich, interactive user interfaces
- **Developer productivity** - Modern tooling and patterns
- **Version control** - Git-based development workflow

### **Quality Standards**
- Atomic/Compound Design principles for maximum reusability
- **Service Layer + TanStack Query integration** (MANDATORY - validated ✅)  
- Strategic state management with Zustand for complex applications
- Comprehensive error handling and user feedback
- Accessibility-first design (WCAG 2.1 AA compliance)
- Performance optimization through proper React patterns

---

## ServiceNow Platform Constraints

> **⚠️ CRITICAL:** These constraints discovered through real ServiceNow development must be understood before choosing technologies.

### **❌ What Doesn't Work in ServiceNow UI Pages**

#### **Build-Time CSS Processing**
```css
/* ❌ FAILS: Build-time Tailwind processing not available */
@tailwind base;
@tailwind components;
@tailwind utilities;

.card-elevated {
  @apply bg-white rounded-xl shadow-lg border border-slate-200 p-6;
  /* ServiceNow build system doesn't process @apply */
}
```

**Why this fails:**
- ServiceNow UI Pages don't run PostCSS processing
- `@apply` directives are not compiled
- `@tailwind` imports fail silently
- Results in unstyled, broken components

#### **Advanced CSS Preprocessors**
- **Sass/SCSS** compilation not available in ServiceNow build system
- **CSS Modules** not supported in ServiceNow UI Pages

### **✅ What Works in ServiceNow UI Pages - VALIDATED**

ServiceNow's web-based IDE and runtime environment supports three validated CSS approaches:

#### **Approach 1: Plain CSS with Component Classes**
```css
/* ✅ WORKS: Plain CSS with component classes */
.card-elevated {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  transition: box-shadow 0.3s ease;
}

.card-elevated:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

**Why this works:**
- No build dependencies required
- ServiceNow-native CSS processing
- Predictable styling behavior
- Easy debugging and maintenance

#### **Approach 2: CSS-in-JS Runtime Processing (Chakra UI)**
```tsx
/* ✅ WORKS: CSS-in-JS runtime processing validated in ServiceNow */
import { Box, Button } from '@chakra-ui/react';

function Component() {
  return (
    <Box bg="white" borderRadius="xl" shadow="lg" p={6}>
      <Button colorScheme="blue">Working in ServiceNow</Button>
    </Box>
  );
}
```

**Why CSS-in-JS works:**
- Runtime CSS processing in browser
- No ServiceNow build system conflicts
- Dynamic CSS classes generated: `css-nek2wy`, `chakra-button`
- Zero CSP policy violations confirmed

> **⚠️ CRITICAL ServiceNow Compatibility Issue:** Chakra UI `<Tooltip>` wrapper components interfere with ServiceNow's Prototype.js library, preventing IconButton click events from functioning properly. Use native HTML `title` attributes or remove tooltips entirely for ServiceNow-compatible functionality.

#### **Approach 3: Utility Classes via CDN (Tailwind CDN)**
```tsx
/* ✅ WORKS: CDN utilities functional in ServiceNow */
function Component() {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all">
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        CDN Utilities Working
      </button>
    </div>
  );
}
```

**Why Tailwind CDN works:**
- All utility classes functional via CDN
- No ServiceNow build processing required
- Responsive and interactive states work perfectly

#### **Modern CSS Features That Work**
- **CSS Custom Properties (Variables)** - Full support ✅
- **Flexbox and Grid** - Complete compatibility ✅
- **CSS Animations** - Works perfectly ✅
- **Media Queries** - Responsive design supported ✅

---

## CSS Strategy: Three Validated Approaches - UPDATED

> **✅ VALIDATED:** Based on comprehensive ServiceNow development testing, **three CSS approaches are confirmed working** with different trade-offs.

### **CSS Approach Decision Framework**

Choose based on project priorities and team capabilities:

| **Priority** | **Best Choice** | **Bundle Size** | **Dev Speed** | **Consistency** |
|--------------|----------------|-----------------|---------------|-----------------|
| **Bundle Size Critical** | Plain CSS | ~0KB | Slower | Manual |
| **Development Speed** | Chakra UI | ~200KB | Fastest | System |
| **Utility Workflow** | Tailwind CDN | ~CDN | Fast | System |
| **Accessibility Critical** | Chakra UI | ~200KB | Fastest | Built-in |
| **Full Control** | Plain CSS | ~0KB | Slower | Manual |

### **Primary Approach: Plain CSS Component Classes**

```css
/* ✅ RECOMMENDED: Plain CSS with component classes */
.card-elevated {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  transition: box-shadow 0.3s ease;
}

.card-elevated:hover {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.btn-primary {
  background-color: #2563eb;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.btn-primary:hover {
  background-color: #1d4ed8;
}
```

**Primary Benefits:**
- Zero bundle size impact
- ServiceNow-native compatibility
- Team-friendly CSS skills
- Full design control

### **Alternative Approach 1: Chakra UI (CSS-in-JS)**

```tsx
// ✅ VALIDATED: For teams prioritizing development speed
import { ChakraProvider, Box, Button } from '@chakra-ui/react';

export function App() {
  return (
    <ChakraProvider>
      <Box bg="white" borderRadius="xl" shadow="lg" p={6}>
        <Button colorScheme="blue" size="md">
          Fastest Development
        </Button>
      </Box>
    </ChakraProvider>
  );
}
```

**When to Choose Chakra UI:**
- Development speed is critical (~4min/component vs 25min Plain CSS)
- Built-in accessibility requirements
- Component library benefits desired
- TypeScript integration important

> **⚠️ CRITICAL ServiceNow Compatibility Issue:** Chakra UI `<Tooltip>` wrapper components interfere with ServiceNow's Prototype.js library, preventing IconButton click events from functioning properly. Use native HTML `title` attributes or remove tooltips entirely for ServiceNow-compatible functionality.

### **Alternative Approach 2: Tailwind CDN**

```tsx
// ✅ VALIDATED: For teams preferring utility-first workflow
useEffect(() => {
  const link = document.createElement('link');
  link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@3.4.1/tailwind.min.css';
  link.rel = 'stylesheet';
  document.head.appendChild(link);
}, []);

function Component() {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
        Utility Classes
      </button>
    </div>
  );
}
```

**When to Choose Tailwind CDN:**
- Utility-first workflow preferred
- Rapid prototyping needs
- System consistency via utilities desired
- Don't want build complexity

### **Component Usage Pattern (All Approaches)**
```tsx
// ✅ GOOD: Component classes + conditional utilities (works with all approaches)
function PropertyCard({ featured, className }) {
  return (
    <div className={cn(
      'card-elevated',           // Component class (consistent)
      featured && 'ring-2 ring-blue-500',  // Conditional styling
      className                  // Overrides
    )}>
      <button className="btn-primary">
        View Details
      </button>
    </div>
  );
}
```

**See:** [Styling Practices](styling-practices.md) for complete CSS architecture guide with all three approaches

---

## Backend-Frontend Integration Strategy

### **The Integration Boundary**
```
┌─────────────────────────────────────────────┐
│ React Frontend (Code-First)                 │
│ ├── TypeScript components                   │
│ ├── TanStack Query for data fetching        │
│ ├── CSS architecture (3 validated options)  │
│ └── Service layer for API calls             │
└─────────────────────────────────────────────┘
                    ↓ HTTP/REST API
┌─────────────────────────────────────────────┐
│ ServiceNow Backend (Configuration-First)    │
│ ├── Flow Designer workflows                 │
│ ├── Decision Builder business rules         │
│ ├── Assignment Rules routing                │
│ ├── Data Policies validation                │
│ ├── Fluent DSL (tables, ACLs)              │
│ └── Custom scripts (minimal)                │
└─────────────────────────────────────────────┘
```

### **When to Use Each Approach**

#### **Use ServiceNow Builders (Configuration-First)** 🏗️
```tsx
// ✅ React triggers, ServiceNow builders handle logic
async function updateIncidentPriority(incidentId: string, priority: string) {
  // Simple update triggers:
  await incidentService.update(incidentId, { priority });
  
  /*
  ServiceNow builders automatically handle:
  - SLA recalculation (SLA Engine)
  - Assignment changes (Assignment Rules + Decision Builder)
  - Notifications (Flow Designer + Notification Engine)
  - Escalation rules (Flow Designer state machines)
  - Approval requirements (Flow Designer + Approval Engine)
  
  No custom code needed for complex business logic!
  */
}
```

#### **Use React TypeScript (Modern Frontend)** ⚛️
```tsx
// ✅ Rich, interactive UI components
interface IncidentDashboardProps {
  incidents: Incident[];
  filters: IncidentFilters;
  onFilterChange: (filters: IncidentFilters) => void;
  onIncidentUpdate: (id: string, updates: Partial<Incident>) => void;
}

function IncidentDashboard({ 
  incidents, 
  filters, 
  onFilterChange, 
  onIncidentUpdate 
}: IncidentDashboardProps) {
  // Modern React patterns for complex UI interactions
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  return (
    <div className="incident-dashboard">
      <FilterPanel 
        filters={filters}
        onFiltersChange={onFilterChange}
      />
      
      <ViewToggle 
        mode={viewMode}
        onModeChange={setViewMode}
      />
      
      <IncidentGrid
        incidents={incidents}
        viewMode={viewMode}
        onIncidentSelect={setSelectedIncident}
        onIncidentUpdate={onIncidentUpdate}
      />
      
      {selectedIncident && (
        <IncidentDetailsModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdate={onIncidentUpdate}
        />
      )}
    </div>
  );
}
```

---

## Core Principles

### **1. Component-First Development**
Build applications as collections of reusable, composable components with colocated files for maintainability.

```tsx
// ✅ GOOD: Composable components with organized file structure
// src/components/organisms/IncidentDashboard/
// ├── IncidentDashboard.tsx
// ├── IncidentDashboard.css (Plain CSS) OR use Chakra UI components OR Tailwind classes
// ├── IncidentDashboard.test.tsx
// └── index.ts

function IncidentDashboard() {
  return (
    <DashboardLayout>
      <DashboardHeader title="Incidents" />
      <FilterPanel onFilterChange={handleFilterChange} />
      <IncidentList incidents={incidents} />
    </DashboardLayout>
  );
}
```

### **2. Separation of Concerns** 
> **📋 Note:** *Validated in simple applications ✅. Recommended for larger applications but not yet validated at scale.*

- **React Components:** Handle UI rendering only
- **Custom Hooks:** Manage business logic and local state
- **Zustand Stores:** Handle global state (auth, data cache, UI state)
- **ServiceNow Services:** Handle API communication ✅ **(Validated)**
- **ServiceNow Builders:** Handle backend business logic
- **Utilities:** Provide helper functions

```tsx
// ✅ GOOD: Clear separation with strategic state management
function IncidentList({ incidents, onItemClick }) {
  // Only UI logic here - ServiceNow builders handle business logic
  return (
    <div className="incident-list">
      {incidents.map(incident => (
        <IncidentCard key={incident.sys_id} incident={incident} onClick={onItemClick} />
      ))}
    </div>
  );
}

function useIncidents(filters) {
  // Data fetching logic - ServiceNow builders handle the rest ✅ VALIDATED
  const { data: incidents, refetch } = useQuery(
    ['incidents', filters],
    () => incidentService.getIncidents(filters)
    // ServiceNow Flow Designer handles: assignments, SLAs, notifications
    // Decision Builder handles: priority calculations, routing rules
    // Assignment Rules handle: workload balancing, skills matching
  );
  
  return { incidents, refetch };
}
```

### **3. Strategic State Management**
> **📋 Note:** *Recommended for complex applications. Simple applications can use React state directly.*

Use the right state management tool for each concern:
- **Local state** (useState, useReducer) - Component-specific state ✅ **(Validated)**
- **Shared logic** (Custom hooks) - Reusable business logic
- **Global state** (Zustand) - Authentication, data cache, shared UI state
- **ServiceNow state** (Flow Designer) - Backend workflows and business processes

```tsx
// ✅ VALIDATED: Simple state management for basic applications
function IncidentForm() {
  const [formData, setFormData] = useState(initialData);
  const { createIncident } = useIncidentMutations();
  
  // For simple applications, local state works perfectly
  return (
    <form onSubmit={() => createIncident.mutate(formData)}>
      {/* form fields */}
    </form>
  );
}

// 📋 RECOMMENDED: Strategic global state for complex applications
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
}));

const useDataStore = create((set) => ({
  incidents: [],
  updateIncident: (id, updates) => set((state) => ({
    incidents: state.incidents.map(i => i.id === id ? { ...i, ...updates } : i)
  })),
}));
```

### **4. TypeScript-First with Progressive Adoption** 
> **⚠️ Updated:** *Start simple, add strictness gradually based on real-world experience.*

All components, hooks, services, and stores use proper TypeScript typing, but **start flexible and refine**.

```tsx
// ✅ GOOD: Start with flexible interfaces
interface IncidentListProps {
  incidents?: Incident[];
  loading?: boolean;
  onItemClick?: (incident: Incident) => void;
  className?: string;
}

// 📋 EVOLVE: Add strictness as application matures
interface StrictIncidentListProps {
  incidents: Incident[];          // Required when data flow is established
  loading: boolean;               // Required when loading patterns are clear
  onItemClick: (incident: Incident) => void;  // Required for interactions
  className?: string;             // Optional for flexibility
}
```

### **5. Performance by Default**
- Memoize expensive calculations with `useMemo`
- Memoize callback functions with `useCallback`
- Use `React.memo` for pure components
- Use selective Zustand subscriptions to prevent unnecessary re-renders (for complex apps)
- Implement code splitting for large features
- **Let ServiceNow builders handle backend performance** (platform-optimized)

### **6. Accessibility-First**
Every component must be accessible from the start.

```tsx
function Button({ children, onClick, disabled, loading, ...props }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-describedby={loading ? "loading-status" : undefined}
      {...props}
    >
      {loading && <span id="loading-status" className="sr-only">Loading...</span>}
      {children}
    </button>
  );
}
```

### **7. Resilient Error Handling**
Use Error Boundaries to catch and handle errors gracefully, preventing application crashes.

```tsx
// ✅ GOOD: Strategic error boundary placement
function ServiceNowApp() {
  return (
    <ErrorBoundary fallback={AppErrorFallback}>
      <DashboardLayout>
        
        <ErrorBoundary fallback={FeatureErrorFallback}>
          <IncidentManagement />
        </ErrorBoundary>
        
        <ErrorBoundary fallback={FeatureErrorFallback}>
          <ServiceRequestManagement />
        </ErrorBoundary>
        
      </DashboardLayout>
    </ErrorBoundary>
  );
}
```

---

## Development Workflow

### **1. Plan Architecture Strategy**
Before coding, determine the appropriate implementation approach:

#### **Backend Planning** 🏗️
```
New backend requirement?
├── Can ServiceNow UI handle it? → Use native configuration
├── Complex workflow needed? → Flow Designer
├── Business rules required? → Decision Builder
├── New table/metadata? → Fluent DSL
└── Complex custom logic? → Script Include (last resort)
```

#### **Frontend Planning** ⚛️
```
New frontend requirement?
├── Simple UI components? → Atomic design with TypeScript
├── Complex state management? → Zustand + custom hooks (for large apps)
├── Data fetching needed? → TanStack Query + service layer ✅ MANDATORY
├── Styling needed? → Choose CSS approach (Plain CSS, Chakra UI, or Tailwind CDN) ✅ VALIDATED
└── User interactions? → React hooks and event handlers
```

### **2. Start with Types and Configuration**
Define both TypeScript interfaces and ServiceNow configuration requirements:

```tsx
// Frontend: Start with flexible TypeScript interfaces
interface Incident {
  sys_id?: string;
  short_description?: string;
  priority?: string;
  state?: string;
  assigned_to?: ServiceNowReference;
}

// Backend: ServiceNow configuration requirements
/*
SERVICENOW DEVELOPER TODO:
1. Flow Designer: "Incident Priority Handler"
   - Trigger: Priority field changes
   - Logic: Recalculate SLA, reassign if needed, notify stakeholders

2. Decision Builder: "Priority Calculation Matrix"
   - Input: Impact, Urgency, VIP status
   - Output: Priority level (1-4)

3. Assignment Rules: "Priority-Based Assignment"
   - P1/P2 → Senior team members
   - P3/P4 → General assignment pool
*/
```

### **3. Build Bottom-Up with Hybrid Strategy**
> **⚠️ ServiceNow SDK Tool Workflow:** All commands below assume ServiceNow SDK tool usage

1. **Configure ServiceNow builders** for backend logic (Flow Designer, Decision Builder)
2. **Create React atoms** with local state and chosen CSS approach (Button, Input, Badge)
3. **Combine into molecules** with service integration (FormField, StatusBadge)
4. **Build organisms** with full state management (IncidentForm, IncidentList)
5. **Compose into pages** with complete backend integration

**Development Commands (ServiceNow SDK):**
```bash
# ⚠️ LIMITED CONTROL: ServiceNow SDK handles these internally
build                          # SDK controls NODE_ENV, build flags
deploy                         # SDK controls build + deployment
install_dependencies           # SDK controls package installation
```

### **4. Test Both Layers**
- **Frontend:** Unit tests for React components and hooks
- **Backend:** Test ServiceNow flows and decision tables
- **Integration:** End-to-end tests for complete workflows
- **Performance:** Test both React rendering and ServiceNow execution

### **5. Organize Files Strategically**
Keep related files together and separate concerns:

```
src/
├── components/                    # React frontend (Code-First)
│   ├── atoms/Button/
│   ├── molecules/FormField/
│   ├── organisms/IncidentForm/
│   └── templates/DashboardLayout/
├── services/                      # API integration layer ✅ VALIDATED
│   ├── IncidentService.ts
│   └── BaseServiceNowService.ts
├── stores/                        # React state management (for complex apps)
│   ├── authStore.ts
│   ├── dataStore.ts
│   └── uiStore.ts
├── styles/                        # CSS approach files ✅ VALIDATED
│   └── globals.css               # Plain CSS OR Chakra UI setup OR Tailwind CDN
└── fluent/                        # ServiceNow metadata (Declarative)
    ├── tables/
    ├── business-rules/
    └── acls/
```

---

## Technology Stack

### **Frontend (Code-First)** ⚛️
- React 18.2+
- TypeScript 4.9+ (progressive adoption)
- TanStack Query (data fetching) ✅ **VALIDATED**
- Zustand (state management) - *for complex applications*
- **CSS Architecture** - Three validated approaches ✅ **UPDATED**
  - Plain CSS with component classes (recommended primary)
  - Chakra UI (CSS-in-JS) for development speed
  - Tailwind CDN for utility-first workflow

> **⚠️ CRITICAL ServiceNow Compatibility Issue:** Chakra UI `<Tooltip>` wrapper components interfere with ServiceNow's Prototype.js library, preventing IconButton click events from functioning properly. Use native HTML `title` attributes or remove tooltips entirely for ServiceNow-compatible functionality.

### **Backend (Configuration-First)** 🏗️
- Flow Designer (workflows, state machines)
- Decision Builder (business rules)
- Assignment Rules (routing)
- SLA Engine (service levels)
- Fluent DSL (ServiceNow metadata) ✅ **VALIDATED**
- Script Includes (minimal custom code)

### **Integration Layer** 🔗
- ServiceNow Now SDK ✅ **VALIDATED**
- REST API services ✅ **VALIDATED**
- Error handling patterns ✅ **VALIDATED**
- Authentication management ✅ **VALIDATED**

---

## Architecture Validation Status

### **✅ Validated in Real ServiceNow Development**
- **Service Layer + TanStack Query** - Works perfectly, provides all promised benefits
- **CSS Architecture - Three Approaches** - Plain CSS, Chakra UI, Tailwind CDN all validated ✅ **UPDATED**
- **Atomic design structure** - Clear organization, promotes reusability
- **ServiceNow SDK integration** - UI Pages, build system, authentication all working
- **TypeScript (flexible)** - Progressive adoption approach is practical
- **React patterns** - useState, useEffect, custom hooks all working as expected

### **📋 Recommended but Not Yet Validated at Scale**
- **Zustand for global state** - Logical for complex applications, not tested at scale
- **Custom hooks for business logic** - Good pattern, needs validation in larger apps
- **Error boundaries** - Theoretical benefit, not tested in complex scenarios
- **Flow Designer integration** - Backend pattern is sound, needs real workflow testing

### **❌ Removed/Modified Based on Experience** 
- **Build-time Tailwind CSS** - Build processing incompatible with ServiceNow web IDE, replaced with CDN approach ✅ **UPDATED**
- **Strict TypeScript upfront** - Too rigid for development, use progressive approach
- **Complex component interfaces** - Start simple, add complexity as needed

---

## ServiceNow-Specific Development Constraints

### **Build System Limitations**
- **No PostCSS processing** - Build-time Tailwind @apply directives don't work
- **No Sass/SCSS** - Must use plain CSS or runtime CSS processing
- **Limited CSS preprocessing** - Stick to native CSS features or runtime solutions
- **CSP compatibility** - CSS-in-JS libraries like Chakra UI work fine ✅ **UPDATED**

### **Runtime Environment**
- **ServiceNow UI Framework** - Must work within ServiceNow's UI container
- **Authentication integration** - Must use ServiceNow's auth tokens
- **API access patterns** - Must follow ServiceNow REST API conventions
- **Performance constraints** - ServiceNow's rendering engine requirements

### **Development Workflow Adaptations**
- **CSS approach flexibility** - Three validated options for different priorities ✅ **UPDATED**
- **Service layer abstraction** - Handle ServiceNow API specifics
- **Progressive TypeScript** - Start flexible, add strictness as needed
- **Build validation** - Always test in ServiceNow environment

---

## Implementation Guidance

**Ready to implement these core principles?**

### **Next Step: Complete Pattern Implementation**

**🎯 [ServiceNow React Essential Patterns](servicenow-react-essential-patterns.md)** *(10 minutes)*

This comprehensive pattern guide implements these core principles with:
- **8 essential patterns** with complete code examples
- **Performance monitoring integration** respecting ServiceNow constraints
- **Production-ready implementations** validated in live environments
- **Cross-references** showing how patterns apply these principles

### **For Rapid Implementation**

**⚡ [Quick Implementation Guide](quick-implementation-guide.md)** *(5 minutes)*

25-minute development workflow that applies these principles:
- **Step-by-step implementation** with atomic design
- **ServiceNow SDK constraint awareness** from these core principles
- **Practical code examples** demonstrating the hybrid approach

### **ServiceNow Backend (Configuration-First)** 🏗️
- Read **[ServiceNow Backend Principles](patterns/servicenow-backend-principles.md)** - Complete configuration-first guide
- Review [Flow Designer State Machines](patterns/flow-designer-state-machines.md)
- Check [Decision Builder Integration](patterns/decision-builder-integration.md)

### **React Frontend (Code-First)** ⚛️
- Read **[Styling Practices](styling-practices.md)** ✅ **MANDATORY** - Complete CSS architecture guide with all three validated approaches
- Review [Component Reusability](component-reusability.md)
- Plan [State Management](patterns/state-management.md)

### **Integration Layer** 🔗
- Start with **[Service Layer Integration](patterns/service-layer-integration.md)** ✅ **VALIDATED**
- Check [Authentication Patterns](patterns/authentication.md)

---

*These principles form the strategic foundation of all ServiceNow React development. The hybrid approach leverages ServiceNow's platform strengths for backend logic while providing modern React patterns for rich user interfaces. All principles marked as ✅ VALIDATED have been proven in real ServiceNow development, while ServiceNow-specific constraints ensure compatibility with the platform's build system and runtime environment.*