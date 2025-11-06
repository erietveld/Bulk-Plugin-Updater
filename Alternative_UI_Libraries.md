# Alternative UI Libraries Reference

This document contains implementation guidance for Ant Design and Web Awesome as alternatives to our primary choice of Mantine.

## 🥈 **Ant Design Implementation Guide**

### When to Choose Ant Design
✅ You need maximum stability and reliability
✅ You have large teams with varying skill levels  
✅ Time to market is more important than aesthetics
✅ You need comprehensive enterprise features
✅ You prefer established, proven solutions

### Ant Design Implementation Patterns

#### **Component Layer with Ant Design**
- Use **Ant Design** for comprehensive component library with extensive enterprise features
- Leverage Ant Design's TypeScript support for strongly typed component interfaces
- Apply Dubai Police theming through Ant Design's theme customization API
- Use Ant Design's built-in form validation and data handling

```typescript
// Ant Design TypeScript integration
import { Button, Card, Form, Input } from 'antd';
import type { ButtonProps, FormProps } from 'antd';

// Strongly typed Ant Design theme
interface DubaiPoliceAntTheme {
  token: {
    colorPrimary: '#006641';
    colorBgBase: '#ffffff';
    borderRadius: 8;
    fontFamily: 'Inter, sans-serif';
  };
}

// Type-safe component variants
const PrimaryButton: React.FC<Omit<ButtonProps, 'type'>> = (props) => (
  <Button type="primary" {...props} />
);
```

#### **Ant Design Performance Optimization**
```typescript
// Enhanced Ant Design performance with React 19
import { ConfigProvider } from 'antd';

const AntDesignApp: React.FC = () => {
  const theme = useMemo(() => ({
    token: {
      colorPrimary: '#006641',
      borderRadius: 8,
    }
  }), []);

  return (
    <ConfigProvider theme={theme}>
      <App />
    </ConfigProvider>
  );
};
```

#### **Ant Design + ServiceNow Integration**
```typescript
// ServiceNow-optimized Ant Design configuration
const antdConfig = {
  locale: 'en_US',
  theme: {
    token: {
      colorPrimary: '#006641',    // Dubai Police green
      colorSuccess: '#22c55e',
      colorWarning: '#f59e0b',
      colorError: '#ef4444',
    }
  },
  // ServiceNow-specific optimizations
  componentSize: 'middle',
  direction: 'ltr'
};
```

---

## 🥉 **Web Awesome Implementation Guide**

### When to Choose Web Awesome
✅ You plan to use multiple front-end frameworks
✅ Bundle size is a critical constraint
✅ You want to future-proof with web standards
✅ You can handle CDN setup complexity

### Web Awesome Integration Best Practices

**Critical Rule**: ALWAYS verify actual file structure before importing. Don't make assumptions.

#### **Step 1: Discover Available Components**

```bash
# MANDATORY: Check what's actually available before coding
fs_read_directory node_modules/@awesome.me/webawesome/dist
fs_read_directory node_modules/@awesome.me/webawesome/dist/components
fs_read_directory node_modules/@awesome.me/webawesome/dist/styles
```

**Common Available Components (Verified Pattern):**
```typescript
// ✅ VERIFIED: These components typically exist
node_modules/@awesome.me/webawesome/dist/components/
├── button/button.js & button.d.ts
├── card/card.js & card.d.ts  
├── input/input.js & input.d.ts
├── badge/badge.js & badge.d.ts
├── dropdown/dropdown.js & dropdown.d.ts
├── dialog/dialog.js & dialog.d.ts
├── icon/icon.js & icon.d.ts
├── tooltip/tooltip.js & tooltip.d.ts
├── progress-bar/progress-bar.js & progress-bar.d.ts
└── spinner/spinner.js & spinner.d.ts

// ❌ COMMON MISTAKE: Assuming components exist
// DON'T import './table/table.js' without verifying
// DON'T import './menu/menu.js' without checking
```

#### **Step 2: CDN-Based Web Awesome Integration**

**WE FOUND OUT WE CAN ONLY LOAD COMPONENTS AT RUNTIME FROM THE CDN**

```html
<!-- 🌟 Web Awesome CDN Resources - VERIFIED WORKING ENDPOINTS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.0.0/dist-cdn/styles/themes/default.min.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.0.0/dist-cdn/webawesome.loader.min.js"></script>

<!-- 🔧 Set Base Path for Web Awesome CDN -->
<script type="module">
  import { setBasePath } from "https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.0.0/dist-cdn/webawesome.js";
  setBasePath("https://cdn.jsdelivr.net/npm/@awesome.me/webawesome@3.0.0/dist-cdn/");
</script>
```

#### **Step 3: React 19 Custom Elements Pattern**

```typescript
// React wrapper component following React 19 custom elements support
import React, { forwardRef, useCallback } from 'react';
import { logger } from '../../monitoring/logger';

interface WAButtonProps {
  variant?: 'brand' | 'success' | 'neutral' | 'warning' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
  onClick?: (event: MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
}

export const WAButton = forwardRef<HTMLElement, WAButtonProps>(
  ({ 
    variant = 'neutral',
    size = 'medium', 
    disabled = false,
    loading = false,
    children,
    onClick,
    type = 'button',
    ...otherProps 
  }, ref) => {
    
    const handleClick = useCallback((event: MouseEvent) => {
      try {
        if (disabled || loading) return;
        
        logger.debug('WA Button clicked', { 
          variant, 
          size, 
          component: 'WAButton' 
        });
        
        if (onClick) {
          onClick(event);
        }
      } catch (error) {
        logger.error('WAButton click error', error);
      }
    }, [disabled, loading, onClick, variant, size]);

    // ✅ CORRECT: Using React 19 custom elements support
    return (
      <wa-button
        ref={ref}
        variant={variant}
        size={size}
        disabled={disabled}
        loading={loading}
        type={type}
        onClick={handleClick}
        style={{
          // Dubai Police theming
          '--wa-color-primary': '#006641',
          '--wa-color-success': '#22c55e',
          '--wa-border-radius-md': '8px'
        } as React.CSSProperties}
        {...otherProps}
      >
        {children}
      </wa-button>
    );
  }
);
```

#### **Common Integration Mistakes to Avoid**

```typescript
// ❌ MISTAKE 1: Importing non-existent components
import '@awesome.me/webawesome/dist/components/menu/menu.js'; 
// REASON: menu.js might not exist - ALWAYS verify first

// ❌ MISTAKE 2: Assuming component structure
import { Table } from '@awesome.me/webawesome';
// REASON: Web Awesome uses custom elements, not React components

// ❌ MISTAKE 3: Missing CSS imports
import '@awesome.me/webawesome/dist/components/button/button.js';
// MISSING: CSS styles are separate and required

// ❌ MISTAKE 4: Wrong TypeScript integration
// Missing JSX namespace extension

// ❌ MISTAKE 5: Path alias issues in ServiceNow SDK
import { logger } from '@/monitoring/logger';
// ISSUE: Path aliases might not resolve in ServiceNow builds
// SOLUTION: Use relative imports for build compatibility
```

#### **Web Awesome Component Standards**

```typescript
// Enhanced component typing with path aliases
import { WAButton, WACard } from '@/components/webawesome';
import type { WAButtonProps } from '@/components/webawesome';

// Strongly typed Web Awesome theme tokens
interface WebAwesomeTheme {
  '--wa-color-primary': string;
  '--wa-color-success': string;
  '--wa-border-radius-md': string;
  '--wa-font-size-base': string;
}

// Type-safe component variants
const PrimaryButton: React.FC<Omit<WAButtonProps, 'variant'>> = (props) => (
  <WAButton variant="primary" {...props} />
);
```

#### **Web Awesome Debugging**

```typescript
// Systematic debugging approach
const checkWebAwesomeComponents = () => {
  console.log('Available custom elements:', 
    Array.from(customElements.getRegistry().keys())
      .filter(name => name.startsWith('wa-'))
  );
};

const ensureComponentReady = async (tagName: string) => {
  try {
    await customElements.whenDefined(tagName);
    console.log(`✅ ${tagName} is ready`);
  } catch (error) {
    console.error(`❌ ${tagName} failed to load:`, error);
  }
};
```

#### **Web Awesome Integration Checklist**

```typescript
interface WebAwesomeIntegrationChecklist {
  // ✅ PRE-INTEGRATION VERIFICATION
  verifyFileStructure: boolean;          // Check node_modules structure
  checkComponentAvailability: boolean;   // Verify component exists
  reviewOfficialDocs: boolean;          // Follow Web Awesome guide
  
  // ✅ SETUP REQUIREMENTS
  installWebAwesome: boolean;           // npm install @awesome.me/webawesome
  configureTsConfig: boolean;           // Add custom elements types
  extendJSXNamespace: boolean;         // React JSX extension
  importRequiredCSS: boolean;          // webawesome.css + theme.css
  
  // ✅ COMPONENT DEVELOPMENT
  importVerifiedComponents: boolean;    // Only import existing components
  createReactWrappers: boolean;        // React 19 custom elements
  implementErrorHandling: boolean;     // Try-catch in all handlers
  addTypeScriptTypes: boolean;         // Strongly typed props
  
  // ✅ BUILD COMPATIBILITY
  useRelativeImports: boolean;         // Avoid path alias issues
  testServiceNowBuild: boolean;       // now-sdk build success
  verifyDeployment: boolean;          // Deploy and test
  
  // ✅ QUALITY ASSURANCE  
  componentFunctionality: boolean;     // All components work
  themeApplication: boolean;          // Dubai Police theme applied
  accessibilityCompliance: boolean;   // ARIA attributes present
  performanceOptimization: boolean;   // Memoized where needed
}
```

---

## Design System Switching Implementation

### URL-Based Design System Control
```typescript
// Design system URL parameters for testing alternatives
?design=mantine      // Switch to Mantine (primary)
?design=antd         // Switch to Ant Design
?design=webawesome   // Switch to Web Awesome
?ui=mantine         // Mantine shorthand
?ui=antd            // Ant Design shorthand  
?ui=wa              // Web Awesome shorthand
```

### Implementation Pattern
```typescript
const App: React.FC = () => {
  const [designSystem, setDesignSystem] = useState<'mantine' | 'antd' | 'webawesome'>('mantine');
  
  useEffect(() => {
    // Check URL parameters for design system preference
    const params = new URLSearchParams(window.location.search);
    const design = params.get('design') || params.get('ui');
    
    switch (design) {
      case 'antd':
        setDesignSystem('antd');
        break;
      case 'webawesome':  
      case 'wa':
        setDesignSystem('webawesome');
        break;
      default:
        setDesignSystem('mantine'); // Default to Mantine
    }
    
    // Save preference
    localStorage.setItem('design-system', designSystem);
  }, []);
  
  return (
    <DesignSystemProvider system={designSystem}>
      {designSystem === 'mantine' && <MantineApp />}
      {designSystem === 'antd' && <AntDesignApp />}
      {designSystem === 'webawesome' && <WebAwesomeApp />}
    </DesignSystemProvider>
  );
};
```

This reference document provides complete implementation guidance for Ant Design and Web Awesome when Mantine is not suitable for your specific requirements.