// src/theme/mantineTheme.ts
import { createTheme, MantineTheme } from '@mantine/core';

const brandColors = [
  '#f0f9ff',  // 50 - Lightest brand color
  '#e0f2fe',  // 100
  '#bae6fd',  // 200
  '#7dd3fc',  // 300
  '#38bdf8',  // 400
  '#0ea5e9',  // 500 - Primary brand color
  '#0284c7',  // 600
  '#0369a1',  // 700 - Primary brand color (darker)
  '#075985',  // 800
  '#0c4a6e'   // 900 - Darkest brand color
] as const;

// COMPREHENSIVE: Create theme with complete visual specification including backgrounds and headers
export const enterpriseTheme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand: brandColors,
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '600',
  },
  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  // FIXED: Add comprehensive theme specification in 'other' property
  other: {
    // Background system
    backgroundGradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #e0f2fe 75%, #f0f9ff 100%)',
    backgroundPrimary: '#f0f9ff',
    backgroundSecondary: '#e0f2fe',
    
    // Header system
    headerBackground: 'rgba(255, 255, 255, 0.8)',
    headerBackdropFilter: 'blur(10px)',
    headerShadow: 'sm',
    headerPadding: 'md',
    headerBorderRadius: 'md',
    
    // Navigation system
    navMenuBackground: '#ffffff',
    navMenuShadow: 'md',
    navMenuBorder: '1px solid #e0f2fe',
    
    // Performance metadata
    performanceOptimized: true,
    themeCategory: 'corporate',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    
    // CSS Variables for consistent theming
    cssVariables: {
      '--theme-primary': brandColors[5],
      '--theme-primary-hover': brandColors[6],
      '--theme-primary-light': brandColors[3],
      '--theme-background': 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #e0f2fe 75%, #f0f9ff 100%)',
      '--theme-header-bg': 'rgba(255, 255, 255, 0.8)',
      '--theme-surface': '#ffffff',
      '--theme-border': '#e0f2fe',
      '--theme-text': '#1f2937',
      '--theme-text-secondary': '#6b7280'
    }
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        shadow: 'sm',
        withBorder: true,
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    // FIXED: Add Paper component styling for headers with proper typing
    Paper: {
      styles: (theme: MantineTheme) => ({
        root: {
          '&[data-theme-header="true"]': {
            backgroundColor: 'var(--theme-header-bg)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--theme-border)',
          }
        }
      })
    },
    // FIXED: Add Container component styling for backgrounds with proper typing
    Container: {
      styles: (theme: MantineTheme) => ({
        root: {
          '&[data-theme-background="true"]': {
            background: 'var(--theme-background)',
            minHeight: '100vh',
          }
        }
      })
    }
  },
}) as MantineTheme;