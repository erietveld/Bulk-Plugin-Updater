// STEP 2: Enhanced CSS Variables Resolver with better performance and color scheme awareness
const cssVariablesResolver = (theme: MantineTheme) => ({
  variables: {
    // Core theme variables with comprehensive null checks
    '--app-primary-color': theme.colors?.[theme.primaryColor as keyof typeof theme.colors]?.[6] || theme.colors?.blue?.[6] || '#0ea5e9',
    '--app-primary-hover': theme.colors?.[theme.primaryColor as keyof typeof theme.colors]?.[7] || theme.colors?.blue?.[7] || '#0284c7',
    '--app-primary-light': theme.colors?.[theme.primaryColor as keyof typeof theme.colors]?.[3] || theme.colors?.blue?.[3] || '#7dd3fc',
    '--app-primary-dark': theme.colors?.[theme.primaryColor as keyof typeof theme.colors]?.[8] || theme.colors?.blue?.[8] || '#075985',
    
    // Surface colors - enhanced for better color scheme transitions
    '--app-surface-primary': theme.white || '#ffffff',
    '--app-surface-secondary': theme.colors?.gray?.[0] || '#f8f9fa',
    '--app-surface-tertiary': theme.colors?.gray?.[1] || '#f1f3f4',
    
    // Text colors - enhanced hierarchy
    '--app-text-primary': theme.black || '#000000',
    '--app-text-secondary': theme.colors?.gray?.[7] || '#495057',
    '--app-text-tertiary': theme.colors?.gray?.[6] || '#6c757d',
    '--app-text-disabled': theme.colors?.gray?.[5] || '#adb5bd',
    
    // Border and shadows - enhanced for color scheme support
    '--app-border-color': theme.colors?.gray?.[3] || '#dee2e6',
    '--app-border-hover': theme.colors?.gray?.[4] || '#ced4da',
    '--app-shadow-color': 'rgba(0, 0, 0, 0.1)',
    '--app-shadow-hover': 'rgba(0, 0, 0, 0.15)',
    
    // Interactive states - with improved type safety
    '--app-focus-ring': `0 0 0 2px ${theme.colors?.[theme.primaryColor as keyof typeof theme.colors]?.[3] || theme.colors?.blue?.[3] || '#7dd3fc'}`,
    '--app-error-color': theme.colors?.red?.[6] || '#dc3545',
    '--app-warning-color': theme.colors?.yellow?.[6] || '#ffc107',
    '--app-success-color': theme.colors?.green?.[6] || '#28a745',
    
    // Layout with proper string conversion
    '--app-radius-sm': typeof theme.radius?.sm === 'string' ? theme.radius.sm : '4px',
    '--app-radius-md': typeof theme.radius?.md === 'string' ? theme.radius.md : '8px',
    '--app-radius-lg': typeof theme.radius?.lg === 'string' ? theme.radius.lg : '12px',
    '--app-spacing-sm': typeof theme.spacing?.sm === 'string' ? theme.spacing.sm : '12px',
    '--app-spacing-md': typeof theme.spacing?.md === 'string' ? theme.spacing.md : '16px',
    '--app-spacing-lg': typeof theme.spacing?.lg === 'string' ? theme.spacing.lg : '24px',
  },
  light: {
    '--app-surface-primary': theme.white || '#ffffff',
    '--app-surface-secondary': theme.colors?.gray?.[0] || '#f8f9fa',
    '--app-surface-tertiary': theme.colors?.gray?.[1] || '#f1f3f4',
    '--app-text-primary': theme.black || '#000000',
    '--app-text-secondary': theme.colors?.gray?.[7] || '#495057',
    '--app-text-tertiary': theme.colors?.gray?.[6] || '#6c757d',
    '--app-border-color': theme.colors?.gray?.[3] || '#dee2e6',
    '--app-shadow-color': 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    '--app-surface-primary': theme.colors?.dark?.[7] || '#1a1b1e',
    '--app-surface-secondary': theme.colors?.dark?.[6] || '#25262b',
    '--app-surface-tertiary': theme.colors?.dark?.[5] || '#2c2e33',
    '--app-text-primary': theme.white || '#ffffff',
    '--app-text-secondary': theme.colors?.gray?.[3] || '#dee2e6',
    '--app-text-tertiary': theme.colors?.gray?.[4] || '#ced4da',
    '--app-border-color': theme.colors?.dark?.[4] || '#373a40',
    '--app-shadow-color': 'rgba(0, 0, 0, 0.3)',
  },
});