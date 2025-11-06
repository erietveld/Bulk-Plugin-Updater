# ServiceNow React Application Architectural Guidance

## 🏆 **UI Library Decision Criteria**

### 🥇 Choose Mantine If:
✅ You want the most beautiful, modern UI
✅ Your team appreciates great developer experience
✅ You're comfortable with TypeScript-first development
✅ Design quality is important for user adoption
✅ You can handle occasional breaking changes

### 🥈 Choose Ant Design If:
✅ You need maximum stability and reliability
✅ You have large teams with varying skill levels
✅ Time to market is more important than aesthetics
✅ You need comprehensive enterprise features
✅ You prefer established, proven solutions

### 🥉 Choose Web Awesome If:
✅ You plan to use multiple front-end frameworks
✅ Bundle size is a critical constraint
✅ You want to future-proof with web standards
✅ You can handle CDN setup complexity

**📚 Reference**: For Ant Design and Web Awesome implementation details, see [Alternative_UI_Libraries.md](./Alternative_UI_Libraries.md)

---

## **Architectural Overview: React 19 with TypeScript-First & Mantine**

### 0. Implementation Directive

**PATTERN:** Apply changes in small, atomic, reversible increments during development. Be ambitious with functionality, conservative with implementation approach.

**PACKAGE MANAGEMENT:** Always add packages with '^version' where version is the latest stable build to ensure maximum compatibility and feature access.

**IMPORT USING RELATIVE PATH:** Don't use '@/api/' imports for components, utilies, hooks etc. Configure correct relative imports to succesfully run a build.

**CDN RESOURCE VALIDATION:** When using external resources from a CDN (like stylesheets), ALWAYS show the resources used in debug version (debug implemented using URL parameter sn_debug=true) and ask the user to VALIDATE by clicking the resource. This is CRITICAL to prevent styling problems with incorrect resources.

**DEBUG SWITCH:** NEVER use NODE_ENV as this is not set on ServiceNow. We ALWAYS have to use a URL paramter based debug setup. NEVER use ?DEBUG=true or ?debug=true, this conflicts with standard ServiceNow parameters. We use ?sn_debug=true, stick to that.

```json
{
  "dependencies": {
    "@mantine/core": "^8.3.6",
    "@mantine/hooks": "^8.3.6",
    "@mantine/form": "^8.3.6",
    "@mantine/notifications": "^8.3.6",
    "@mantine/dates": "^8.3.6",
    "@mantine/charts": "^8.3.6",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "typescript": "^5.7.2",
    "@tanstack/react-query": "^5.62.9",
    "zustand": "^5.0.2",
    "react-router-dom": "^7.1.3"
  }
}
```

```typescript
// IMPLEMENTATION DIRECTIVE: All changes must follow this process
interface BuildAgentDirective {
  // CORE PRINCIPLES
  incrementalDevelopment: {
    approach: "small-atomic-changes";           // Each change is minimal and focused
    reversibility: "always-possible";          // Must be easy to revert any change
    functionality: "ambitious-but-tested";     // Don't limit features, limit risk
    imports: "relative-only";                  // Only use relative path import statements
  };
  
  // MANDATORY WORKFLOW
  changeProcess: {
    step01: "explicit-get-approval";            // All changes EXPLICITELY need approval first
    step02: "implement-atomically";             // Make one focused change
    step03: "run-diagnostics";                  // validate the source
    step04: "focus-single-issue";               // IF received list of typescript errors: FIRST focus on the top 1 or top 2 when related
    step05: "explain-changes-and-reasoning";    // Tell the user what was changed and why
    step06: "confirm-build";                    // Ask user approval before starting build
    step07: "validate-build";                   // npm run build must succeed
    step08: "validate-deployment";              // Deploy to test environment
    step09: "user-review";                      // User acceptance required by in-browser review
    step10: "proceed-or-rollback";              // Continue or revert based on results
  };
  
  // VALIDATION GATES
  qualityGates: {
    buildValidation: "zero-errors";            // Build must complete without errors
    typeValidation: "strict-typescript";       // All types must be correct
    patternCompliance: "follow-guide";        // Must follow Advice.md
    testability: "user-testable";             // Changes must be user-verified by in-browser review
    rollbackPlan: "always-defined";           // Clear rollback path required
  };

  // CDN RESOURCE VALIDATION (CRITICAL)
  cdnValidation: {
    debugMode: "sn_debug=true";                // URL parameter to enable resource debugging
    showResources: "always-in-debug";         // Display all CDN resources when debugging
    userValidation: "click-to-validate";      // User must click each resource to validate
    preventStylingIssues: "mandatory-check";  // Prevent styling problems with validation
    failureHandling: "immediate-notification"; // Show errors immediately if resource fails
  };
}
```

---

### 1. **TypeScript-First Foundation**

Use TypeScript extensively across your entire codebase to enable static typing, better autocomplete, and early bug detection.

**Essential**: Create a comprehensive `tsconfig.json` in the project root for optimal TypeScript experience:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/client/*": ["src/client/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/state/*": ["src/state/*"],
      "@/types/*": ["src/types/*"],
      "@/monitoring/*": ["src/monitoring/*"],
      "@/design-system/*": ["src/design-system/*"]
    },
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true
  },
  "include": ["src/**/*", "*.d.ts"],
  "exclude": ["node_modules", "dist", "build"]
}
```

**TypeScript Configuration Benefits:**
- **React 19.2 Support**: Automatic JSX transform and modern ES2022 features
- **Path Mapping**: Clean imports with `@/` aliases instead of relative paths
- **Enhanced Type Safety**: Strict mode with unchecked access prevention
- **ServiceNow SDK Compatibility**: No emit mode lets SDK handle builds
- **Development Experience**: Incremental compilation and better IntelliSense
- **Mantine Integration**: Full TypeScript support for all Mantine components

Define strict types for all:
- ServiceNow API responses and request payloads
- Route parameters and loader data
- React component props, states, and hooks
- Zustand state slices and actions
- Leverage TypeScript utility types and interfaces for safer refactoring and maintainability

---

### 2. **Component Layer (UI) with Mantine** 🥇

**Mantine is our preferred UI library** providing the most beautiful, modern UI with exceptional developer experience.

🚨 **CRITICAL REQUIREMENT: Your `src/client/index.html` file MUST include Mantine CDN resources for styling to work correctly.**

**Key Features:**
- **Enterprise-Grade Component Architecture** - Multi-level organization with generic and application-specific components
- **Advanced Error Handling** - Comprehensive error boundaries with user reporting
- **Performance Optimization** - Strategic memoization and React 19 compiler integration
- **TypeScript Excellence** - Full type safety with IntelliSense support
- **Hybrid Data Integration** - Seamless Pattern 2A/2B/2C data access

**📚 Complete Guide**: [Mantine Components Documentation](./docs/architecture/patterns/servicenow-react/MantineComponents.md)

---

### 3. **Routing Layer with React Router v7**

Use **React Router v7** for client-side routing, fully compatible with React 19's concurrency features.

**Key Features:**
- **Design System Aware Routing** - Multi-design system support with lazy loading
- **Advanced Route Protection** - Role-based access control with user context integration
- **Performance Optimization** - Strategic preloading and lazy loading patterns
- **State Synchronization** - URL state management for bookmarkable filters
- **Analytics Integration** - Navigation tracking for user insights

**📚 Complete Guide**: [React Router Documentation](./docs/architecture/patterns/servicenow-react/ReactRouter.md)

---

### 4. **Server State Layer with TanStack Query (Enhanced)**

Advanced TanStack Query configuration optimized for ServiceNow APIs with intelligent caching and error handling.

**Key Features:**
- **ServiceNow Optimization** - Tailored retry logic and error handling for ServiceNow APIs
- **Optimistic Updates** - Immediate UI feedback with automatic rollback on errors
- **Background Sync** - Offline support with mutation queuing
- **Performance Monitoring** - Query performance tracking and slow query detection
- **Advanced Caching** - Intelligent cache invalidation and data synchronization

**📚 Complete Guide**: [TanStack Query Documentation](./docs/architecture/patterns/servicenow-react/TanStackQuery.md)

---

### 4.5 **ServiceNow-Optimized Data Architecture (Hybrid Pattern)**

**Use three-tier data strategy** for optimal performance and user experience with minimal loading states.

**Pattern Architecture:**

- **Pattern 2A: Immediate Data** - Jelly template injection for instant user context (zero loading states)
- **Pattern 2B: Enhanced Data** - Server-side calculations using `<g:evaluate>` for complex analytics
- **Pattern 2C: Dynamic Data** - TanStack Query for real-time data with caching and optimistic updates

**Key Benefits:**
- **Zero Loading States** - Pattern 2A provides immediate user context
- **Server-Side Optimization** - Pattern 2B pre-calculates complex data
- **Dynamic Updates** - Pattern 2C handles real-time data changes
- **Error Resilience** - Graceful degradation when patterns fail

**📚 Complete Guide**: [Hybrid Data Architecture Documentation](./docs/architecture/patterns/servicenow-react/HybridDataArchitecture.md)

---

### 5. **Client State Layer with Zustand (Enhanced)**

Enterprise-grade Zustand store with selective subscriptions and performance optimization patterns.

**Key Features:**
- **Performance Optimization** - Selective subscriptions prevent unnecessary re-renders
- **ServiceNow Integration** - Built-in query generation and user context handling
- **Pattern 2A/2B Support** - Seamless integration with hybrid data architecture
- **Advanced Filtering** - Compound queries with ServiceNow syntax generation
- **Development Experience** - Redux DevTools integration and debugging utilities

**📚 Complete Guide**: [Zustand State Management Documentation](./docs/architecture/patterns/servicenow-react/ZustandState.md)

---

### 6. **API and Integration Layer (Enhanced)**

Type-safe API client with advanced error handling and comprehensive ServiceNow integration.

**Key Features:**
- **Type Safety** - Full TypeScript support with proper error handling
- **Performance Monitoring** - Request duration tracking and slow request detection
- **Error Resilience** - Comprehensive error handling with retry logic
- **ServiceNow Integration** - Optimized for ServiceNow REST API patterns
- **Request Interceptors** - Automatic authentication and request tracking
- **Parallel Processing** - Efficient data fetching with Promise.all

**📚 Complete Guide**: [API Integration Documentation](./docs/architecture/patterns/servicenow-react/APIIntegration.md)

---

### 7-9. **Monitoring, Error Handling & Performance**

```typescript
// Essential monitoring and error handling setup
import { logger } from '@/monitoring/logger';
import { ErrorBoundary } from '@/error/ErrorBoundary';

// Advanced logging with structured data
logger.info('Application initialized', {
  version: '1.0.0',
  environment: process.env.NODE_ENV,
  userAgent: navigator.userAgent,
  patterns: {
    hasPattern2A: !!window.snUserContext,
    hasPattern2B: !!window.enhancedApplicationData
  }
});

// Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.duration > 100) {
      logger.warn('Slow operation detected', {
        name: entry.name,
        duration: Math.round(entry.duration),
        type: entry.entryType
      });
    }
  });
});

performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
```

---

## 🚀 **Advanced Component Pattern Benefits**

### **Enterprise-Grade Architecture Benefits:**

#### **Multi-Level Component Organization**
- **Generic Components** (`/src/components/`) - Reusable across applications
- **Application Components** (`/src/client/components/`) - Domain-specific implementations
- **Clear Separation** - Better maintainability and testing
- **Reusability** - Generic components can be shared across projects

#### **Advanced Error Handling**
- **Comprehensive Error Boundaries** - Multiple levels of error handling
- **User-Friendly Fallbacks** - Graceful degradation with actionable options
- **Error Reporting** - Automatic logging and user reporting capabilities
- **Development vs Production** - Different error displays for different environments

#### **Performance Optimization Patterns**
- **Strategic Memoization** - useMemo for expensive calculations only
- **Selective Subscriptions** - Prevent unnecessary re-renders with shallow equality
- **React 19 Compiler** - Automatic optimization for 80% of cases
- **Hybrid Data Patterns** - Eliminate loading states where possible

#### **TypeScript Excellence**
- **Strict Type Safety** - Full typing throughout the component tree
- **IntelliSense Support** - Better developer experience with autocomplete
- **Refactoring Safety** - Catch errors at compile time
- **Interface Consistency** - Standardized prop interfaces across components

---

### Suggested Code Structure

```
/src
  /api
    apiService.ts              // Typed ServiceNow API wrappers (Pattern 2C only)
  /components
    /mantine                  // Generic Mantine React components with TypeScript
      Button.tsx              // Generic button with variants
      Card.tsx                // Generic card component
      Form.tsx                // Generic form components
      Table.tsx               // Generic table component
  /client
    /components              // Application-specific components
      /mantine               // App-specific Mantine components
        ApplicationDashboard.tsx  // Sophisticated dashboard with metrics
        RequestForm.tsx           // Advanced form with validation
        RequestTable.tsx          // Advanced table with actions
  /hooks
    useUserContext.ts          // Pattern 2A - Immediate data access
    useEnhancedData.ts         // Pattern 2B - Server-processed data
    useDynamicData.ts          // Pattern 2C - TanStack Query hooks
  /state
    store.ts                   // Advanced Zustand store with selective subscriptions
  /theme
    mantineTheme.ts            // Enterprise theme with global styles
  /design-system
    DesignSystemProvider.tsx   // Multi-design system support
  /error
    ErrorBoundary.tsx          // Advanced error boundary with reporting
  App.tsx                      // Root component with providers and routing
tsconfig.json                 // Essential TypeScript configuration
```

---

### Summary

- **Advanced Component Patterns** enable enterprise-grade applications with sophisticated error handling, performance optimization, and maintainability
- **Multi-Level Architecture** separates generic reusable components from application-specific implementations
- **Enterprise Error Handling** provides comprehensive error boundaries with user reporting and graceful fallbacks
- **Performance Optimization** uses strategic memoization, selective subscriptions, and React 19 compiler for optimal performance
- **TypeScript Excellence** ensures full type safety throughout the component tree with strict mode and enhanced IntelliSense
- **Hybrid Data Integration** leverages Pattern 2A/2B/2C for optimal data loading with minimal loading states
- **Advanced State Management** uses sophisticated Zustand patterns with selective subscriptions and performance optimization
- **Sophisticated UI Patterns** implement complex dashboard layouts, advanced forms, and data tables with comprehensive functionality
- **Production-Ready Error Handling** includes user reporting, development vs production error displays, and comprehensive logging
- **Scalable Architecture** supports large enterprise applications with clear separation of concerns and maintainable code structure