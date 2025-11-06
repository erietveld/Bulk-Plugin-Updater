---
title: "Pattern 1: ServiceNow Initialization & Timing"
version: "2025.1.2"
purpose: "Solve race conditions with proper ServiceNow loading sequence"
readTime: "3 minutes"
complexity: "intermediate"
prerequisites: ["servicenow-platform-basics", "react-fundamentals"]
concepts: ["timing-control", "race-conditions", "servicenow-globals", "react-initialization"]
codeExamples: 2
completeness: 100
testability: true
productionReady: true
---

# Pattern 1: ServiceNow Initialization & Timing

**Purpose:** Solve race conditions with proper ServiceNow loading sequence  
**Read time:** ~3 minutes  
**Problem:** ServiceNow's `js_includes_doctype.jsx` and `NOW.xperf` create race conditions that break React applications

---

## 🚨 Problem Statement

### **Symptoms:**
- React app initializes before ServiceNow globals are ready
- `window.g_ck` is undefined causing authentication failures
- `window.NOW.xperf` timing data unavailable
- Intermittent failures on page refresh

### **Root Cause:**
```typescript
// ❌ PROBLEM: React initializes immediately without waiting
// ServiceNow scripts may still be loading
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />); // Fails if ServiceNow not ready
```

### **Impact:**
- **High:** Application fails to load correctly
- **Frequency:** Intermittent, hard to debug
- **User Experience:** Blank screens or authentication errors

---

## ✅ Solution: ServiceNow Readiness Pattern

### **Implementation Decision Tree:**
```
ServiceNow React App Initialization?
├── Page refresh scenario → Use window load event + polling
├── Navigation scenario → Check readiness immediately 
└── Development scenario → Add fallback timeout (100 attempts)
```

### **Complete Working Solution:**

```typescript
// main.tsx - PATTERN: ServiceNow-aware React initialization
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app';
import './styles/globals.css';

// REQUIREMENT: ServiceNow global type declarations for type safety
declare global {
  interface Window {
    NOW?: {
      xperf?: {
        now?: number;
        lastDoctypeBegin?: number; // CRITICAL: Timing marker
      };
    };
    g_ck?: string;                   // REQUIRED: CSRF token
    serviceNowDataReady?: boolean;   // CUSTOM: Data injection flag
  }
}

// PATTERN: Comprehensive ServiceNow readiness validation
// DECISION: Check all critical globals to prevent race conditions
function isServiceNowReady(): boolean {
  return !!(
    window.NOW && 
    window.NOW.xperf && 
    window.NOW.xperf.now && 
    window.NOW.xperf.lastDoctypeBegin !== undefined &&  // TIMING: JS includes loaded
    window.g_ck &&                                       // AUTH: CSRF token available
    window.serviceNowDataReady                           // DATA: Custom data ready
  );
}

// PATTERN: Safe React app initialization
// CONTEXT: Clean previous content and create fresh root
function initializeApp() {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('🚨 CRITICAL: Root element not found');
    return;
  }

  // SAFETY: Clear any existing content to prevent memory leaks
  rootElement.innerHTML = '';
  
  // PATTERN: Create React root and render app
  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);
  
  console.log('✅ ServiceNow React app initialized successfully');
}

// PATTERN: Proven timing pattern with multiple fallbacks
// DECISION: Handle both immediate ready state and delayed loading
function waitForServiceNow() {
  const checkAndInit = () => {
    if (isServiceNowReady()) {
      // SUCCESS: ServiceNow is ready, initialize immediately
      console.log('✅ ServiceNow ready, initializing app');
      initializeApp();
    } else {
      // FALLBACK: Poll with timeout protection
      console.log('⏳ ServiceNow not ready, starting polling...');
      let attempts = 0;
      const maxAttempts = 100; // TIMEOUT: 10 seconds max wait
      
      const poll = () => {
        attempts++;
        
        if (isServiceNowReady()) {
          console.log(`✅ ServiceNow ready after ${attempts} attempts`);
          initializeApp();
        } else if (attempts >= maxAttempts) {
          // SAFETY: Initialize anyway to prevent indefinite hanging
          console.warn('⚠️ ServiceNow readiness timeout, initializing anyway');
          initializeApp();
        } else {
          setTimeout(poll, 100); // TIMING: Check every 100ms
        }
      };
      
      setTimeout(poll, 100); // DELAY: Start polling after brief delay
    }
  };

  // TIMING: Handle different loading scenarios
  if (document.readyState === 'complete') {
    // SCENARIO: Page already loaded (navigation)
    setTimeout(checkAndInit, 100); // BUFFER: Small delay for safety
  } else {
    // SCENARIO: Page still loading (refresh)
    // PATTERN: Window load ensures js_includes_doctype.jsx has executed
    window.addEventListener('load', () => {
      setTimeout(checkAndInit, 100); // BUFFER: Allow scripts to settle
    }, { once: true }); // CLEANUP: Remove listener after use
  }
}

// INITIALIZATION: Start the ServiceNow-aware initialization process
waitForServiceNow();
```

### **ServiceNow Global Validation Helper:**

```typescript
// utils/servicenow-readiness.ts - PATTERN: Reusable readiness utilities
export interface ServiceNowGlobals {
  NOW: {
    xperf: {
      now: number;
      lastDoctypeBegin: number;
    };
  };
  g_ck: string;
  serviceNowDataReady: boolean;
}

// UTILITY: Detailed readiness check with diagnostic info
export function validateServiceNowGlobals(): {
  ready: boolean;
  missing: string[];
  diagnostics: Record<string, any>;
} {
  const missing: string[] = [];
  const diagnostics: Record<string, any> = {};

  // CHECK: NOW object structure
  if (!window.NOW?.xperf?.now) {
    missing.push('window.NOW.xperf.now');
  }
  diagnostics['NOW.xperf'] = window.NOW?.xperf;

  // CHECK: CSRF token availability
  if (!window.g_ck) {
    missing.push('window.g_ck');
  }
  diagnostics['g_ck'] = !!window.g_ck;

  // CHECK: Custom data ready flag
  if (!window.serviceNowDataReady) {
    missing.push('window.serviceNowDataReady');
  }
  diagnostics['serviceNowDataReady'] = window.serviceNowDataReady;

  return {
    ready: missing.length === 0,
    missing,
    diagnostics
  };
}

// DEVELOPMENT: Enhanced logging for debugging
export function logServiceNowReadiness() {
  const { ready, missing, diagnostics } = validateServiceNowGlobals();
  
  if (ready) {
    console.log('✅ ServiceNow globals ready:', diagnostics);
  } else {
    console.warn('⚠️ ServiceNow globals missing:', missing);
    console.log('📊 Current state:', diagnostics);
  }
  
  return ready;
}
```

---

## 🧪 Validation & Testing

### **Implementation Checklist:**
- [ ] **ServiceNow globals checked** - All required globals validated
- [ ] **Fallback timeout implemented** - Prevents indefinite hanging
- [ ] **Multiple loading scenarios handled** - Works on refresh and navigation
- [ ] **Type safety added** - Global interfaces defined
- [ ] **Development logging** - Clear diagnostic information
- [ ] **Memory leak prevention** - Root element cleaned before render

### **Testing Scenarios:**
```typescript
// Test different initialization scenarios
describe('ServiceNow Initialization', () => {
  it('should initialize when ServiceNow is immediately ready', () => {
    // Setup ready state
    window.NOW = { xperf: { now: Date.now(), lastDoctypeBegin: 123 } };
    window.g_ck = 'test-token';
    window.serviceNowDataReady = true;
    
    waitForServiceNow();
    
    expect(document.querySelector('#root')).toHaveTextContent('App loaded');
  });
  
  it('should poll and initialize when ServiceNow becomes ready', async () => {
    // Setup delayed ready state
    setTimeout(() => {
      window.serviceNowDataReady = true;
    }, 200);
    
    waitForServiceNow();
    
    await waitFor(() => {
      expect(document.querySelector('#root')).toHaveTextContent('App loaded');
    });
  });
});
```

---

## 🔧 Troubleshooting Guide

### **Common Issues:**

| **Problem** | **Cause** | **Solution** |
|-------------|-----------|--------------|
| App never loads | Missing `serviceNowDataReady` flag | Add `window.serviceNowDataReady = true` in data injection |
| Intermittent failures | Race condition timing | Increase polling timeout or add more delay |
| Authentication errors | `g_ck` not available | Ensure proper ServiceNow session before app load |
| TypeScript errors | Missing global declarations | Add `declare global` interface extensions |

### **Debug Commands:**
```javascript
// Browser console debugging
window.snDebug = true;
logServiceNowReadiness(); // Check current state
validateServiceNowGlobals(); // Detailed diagnostics
```

---

## 📊 Pattern Benefits

### **Reliability:**
- **Eliminates race conditions** - Proper initialization order
- **Handles all scenarios** - Refresh, navigation, slow loading
- **Fail-safe behavior** - Timeout prevents hanging

### **Developer Experience:**
- **Type safety** - Global interfaces prevent runtime errors
- **Clear diagnostics** - Easy debugging with detailed logging
- **Reusable utilities** - Shared readiness validation

### **Performance:**
- **Minimal overhead** - Efficient polling with reasonable timeouts
- **Memory efficient** - Proper cleanup and event listener management

---

*This pattern is the foundation for all ServiceNow React applications and must be implemented before any other patterns.*