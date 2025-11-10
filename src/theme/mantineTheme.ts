// src/theme/mantineTheme.ts
// COMPLIANCE: Step 2 - Updated with nullish coalescing and refined types
import { createTheme, MantineTheme } from '@mantine/core';
import { getThemeKey, getString, type ThemeKey } from '../utils/typeRefinements';

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

// Theme configuration with refined types - no undefined values
interface ThemeConfig {
  readonly themeKey: ThemeKey;
  readonly primaryColorIndex: number;
  readonly backgroundGradient: string;
  readonly headerBackground: string;
  readonly enablePerformanceOptimizations: boolean;
}

// FIXED: Theme factory function with nullish coalescing and refined types
const createEnterpriseTheme = (config: Partial<ThemeConfig> | null | undefined = null): MantineTheme => {
  // Use nullish coalescing for all configuration values
  const themeKey = getThemeKey(config?.themeKey);
  const primaryColorIndex = config?.primaryColorIndex ?? 5;
  const backgroundGradient = getString(
    config?.backgroundGradient,
    'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #e0f2fe 75%, #f0f9ff 100%)'
  );
  const headerBackground = getString(config?.headerBackground, 'rgba(255, 255, 255, 0.8)');
  const enablePerformanceOptimizations = config?.enablePerformanceOptimizations ?? true;
  
  // Ensure array bounds safety with nullish coalescing
  const primaryColor = brandColors[Math.max(0, Math.min(primaryColorIndex, brandColors.length - 1))] ?? brandColors[5];
  const primaryHoverColor = brandColors[Math.max(0, Math.min(primaryColorIndex + 1, brandColors.length - 1))] ?? brandColors[6];
  const primaryLightColor = brandColors[Math.max(0, Math.min(primaryColorIndex - 2, brandColors.length - 1))] ?? brandColors[3];
  
  return createTheme({
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
    // FIXED: Comprehensive theme specification with nullish coalescing
    other: {
      // Background system with defaults
      backgroundGradient,
      backgroundPrimary: brandColors[0] ?? '#f0f9ff',
      backgroundSecondary: brandColors[1] ?? '#e0f2fe',
      
      // Header system with defaults
      headerBackground,
      headerBackdropFilter: 'blur(10px)',
      headerShadow: 'sm',
      headerPadding: 'md',
      headerBorderRadius: 'md',
      
      // Navigation system with defaults
      navMenuBackground: '#ffffff',
      navMenuShadow: 'md',
      navMenuBorder: `1px solid ${brandColors[1] ?? '#e0f2fe'}`,
      
      // Performance metadata with defaults
      performanceOptimized: enablePerformanceOptimizations,
      themeCategory: 'corporate',
      accessibility: 'AA',
      colorSchemeSupport: true,
      systemPreferenceAware: true,
      themeKey, // Store the resolved theme key
      
      // CSS Variables with nullish coalescing for all values
      cssVariables: {
        '--theme-primary': primaryColor,
        '--theme-primary-hover': primaryHoverColor,
        '--theme-primary-light': primaryLightColor,
        '--theme-background': backgroundGradient,
        '--theme-header-bg': headerBackground,
        '--theme-surface': '#ffffff',
        '--theme-border': brandColors[1] ?? '#e0f2fe',
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
      // FIXED: Paper component styling with proper typing and defaults
      Paper: {
        styles: (theme: MantineTheme) => ({
          root: {
            '&[data-theme-header="true"]': {
              backgroundColor: `var(--theme-header-bg, ${headerBackground})`,
              backdropFilter: 'blur(10px)',
              border: `1px solid var(--theme-border, ${brandColors[1] ?? '#e0f2fe'})`,
            }
          }
        })
      },
      // FIXED: Container component styling with proper typing and defaults
      Container: {
        styles: (theme: MantineTheme) => ({
          root: {
            '&[data-theme-background="true"]': {
              background: `var(--theme-background, ${backgroundGradient})`,
              minHeight: '100vh',
            }
          }
        })
      }
    },
  }) as MantineTheme;
};

// COMPREHENSIVE: Create theme with complete visual specification using refined types
export const enterpriseTheme = createEnterpriseTheme();

// Export theme factory for custom configurations
export { createEnterpriseTheme };

// Export theme configuration type for external use
export type { ThemeConfig };

// Utility functions for theme management with refined types
export const getThemeConfiguration = (
  userPreference: string | null | undefined,
  systemDefault: string | null | undefined = 'default'
): ThemeConfig => {
  const themeKey = getThemeKey(userPreference ?? systemDefault);
  
  return {
    themeKey,
    primaryColorIndex: 5,
    backgroundGradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #e0f2fe 75%, #f0f9ff 100%)',
    headerBackground: 'rgba(255, 255, 255, 0.8)',
    enablePerformanceOptimizations: true
  };
};

// Theme switching utility with type safety
export const switchTheme = (newThemeKey: string | null | undefined): MantineTheme => {
  const validThemeKey = getThemeKey(newThemeKey);
  
  const config: ThemeConfig = {
    themeKey: validThemeKey,
    primaryColorIndex: 5,
    backgroundGradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #e0f2fe 75%, #f0f9ff 100%)',
    headerBackground: 'rgba(255, 255, 255, 0.8)',
    enablePerformanceOptimizations: true
  };
  
  return createEnterpriseTheme(config);
};