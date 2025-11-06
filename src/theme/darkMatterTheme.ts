// src/theme/darkMatterTheme.ts
// Dark Matter Theme - Professional cosmic theme with OKLCH color space
// FIXED: Proper Mantine theme structure with color tuples and comprehensive styling

import { createTheme, MantineTheme } from '@mantine/core';

// Convert OKLCH colors to proper Mantine color tuples
const primaryColors = [
  'oklch(0.9500 0.0200 48.5130)', // 50 - Lightest primary
  'oklch(0.9000 0.0400 48.5130)', // 100
  'oklch(0.8500 0.0680 48.5130)', // 200
  'oklch(0.8000 0.0900 48.5130)', // 300
  'oklch(0.7500 0.1120 48.5130)', // 400
  'oklch(0.7214 0.1337 49.9802)', // 500 - Primary color (from original)
  'oklch(0.6716 0.1368 48.5130)', // 600 - Primary from light theme
  'oklch(0.6200 0.1400 48.5130)', // 700
  'oklch(0.5700 0.1500 48.5130)', // 800
  'oklch(0.5200 0.1600 48.5130)', // 900 - Darkest primary
] as const;

const secondaryColors = [
  'oklch(0.9200 0.0100 196.0280)', // 50 - Lightest secondary
  'oklch(0.8800 0.0200 196.0280)', // 100
  'oklch(0.8400 0.0250 196.0280)', // 200
  'oklch(0.8000 0.0300 196.0280)', // 300
  'oklch(0.7500 0.0350 196.0280)', // 400
  'oklch(0.5940 0.0443 196.0233)', // 500 - Secondary from dark theme
  'oklch(0.5360 0.0398 196.0280)', // 600 - Secondary from light theme
  'oklch(0.4800 0.0450 196.0280)', // 700
  'oklch(0.4300 0.0500 196.0280)', // 800
  'oklch(0.3800 0.0550 196.0280)', // 900 - Darkest secondary
] as const;

const grayColors = [
  'oklch(0.9670 0.0029 264.5419)', // 50 - Very light gray (from light theme)
  'oklch(0.9276 0.0058 264.5313)', // 100 - Light gray border
  'oklch(0.8800 0.0100 264.0000)', // 200
  'oklch(0.8300 0.0150 264.0000)', // 300
  'oklch(0.7800 0.0200 264.0000)', // 400
  'oklch(0.6268 0.0000 0.0000)',   // 500 - Mid gray (from dark theme)
  'oklch(0.5510 0.0234 264.3637)', // 600 - Muted foreground (from light theme)
  'oklch(0.3211 0.0000 0.0000)',   // 700 - Accent (from dark theme)
  'oklch(0.2520 0.0000 0.0000)',   // 800 - Muted/border (from dark theme)
  'oklch(0.1822 0.0000 0.0000)',   // 900 - Card dark (from dark theme)
] as const;

const darkColors = [
  'oklch(0.8109 0.0000 0.0000)',   // 50 - Foreground light
  'oklch(0.7500 0.0000 0.0000)',   // 100
  'oklch(0.7000 0.0000 0.0000)',   // 200
  'oklch(0.6500 0.0000 0.0000)',   // 300
  'oklch(0.6000 0.0000 0.0000)',   // 400
  'oklch(0.3211 0.0000 0.0000)',   // 500 - Accent (from dark theme)
  'oklch(0.2520 0.0000 0.0000)',   // 600 - Muted/border (from dark theme)
  'oklch(0.1822 0.0000 0.0000)',   // 700 - Card (from dark theme)
  'oklch(0.1797 0.0043 308.1928)', // 800 - Background (from dark theme)
  'oklch(0.1500 0.0050 308.1928)', // 900 - Darkest background
] as const;

// ENHANCED: Create theme with complete dark matter styling
export const enterpriseTheme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand: primaryColors,
    secondary: secondaryColors,
    gray: grayColors,
    dark: darkColors,
  },
  fontFamily: '"Geist Mono", ui-monospace, "SF Mono", Consolas, "Liberation Mono", Menlo, Monaco, "Courier New", monospace',
  headings: {
    fontFamily: '"Geist Mono", ui-monospace, "SF Mono", Consolas, "Liberation Mono", Menlo, Monaco, "Courier New", monospace',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '34px', lineHeight: '1.2', fontWeight: '700' },
      h2: { fontSize: '28px', lineHeight: '1.3', fontWeight: '700' },
      h3: { fontSize: '22px', lineHeight: '1.4', fontWeight: '700' },
      h4: { fontSize: '18px', lineHeight: '1.5', fontWeight: '700' },
      h5: { fontSize: '16px', lineHeight: '1.6', fontWeight: '700' },
      h6: { fontSize: '14px', lineHeight: '1.6', fontWeight: '700' },
    },
  },
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },
  shadows: {
    xs: '0px 1px 4px 0px rgba(0, 0, 0, 0.03)',
    sm: '0px 1px 4px 0px rgba(0, 0, 0, 0.05), 0px 1px 2px -1px rgba(0, 0, 0, 0.05)',
    md: '0px 1px 4px 0px rgba(0, 0, 0, 0.05), 0px 2px 4px -1px rgba(0, 0, 0, 0.05)',
    lg: '0px 1px 4px 0px rgba(0, 0, 0, 0.05), 0px 4px 6px -1px rgba(0, 0, 0, 0.05)',
    xl: '0px 1px 4px 0px rgba(0, 0, 0, 0.05), 0px 8px 10px -1px rgba(0, 0, 0, 0.05)',
  },
  // ENHANCED: Complete theme specification with cosmic styling
  other: {
    // Background system - Dark matter cosmic theme
    backgroundGradient: 'radial-gradient(ellipse at center, oklch(0.1822 0 0) 0%, oklch(0.1797 0.0043 308.1928) 40%, oklch(0.1500 0.0050 308.1928) 100%)',
    backgroundPrimary: 'oklch(0.1797 0.0043 308.1928)',
    backgroundSecondary: 'radial-gradient(circle at 30% 70%, oklch(0.1822 0 0) 0%, oklch(0.1797 0.0043 308.1928) 60%)',
    backgroundTertiary: 'linear-gradient(135deg, oklch(0.1797 0.0043 308.1928) 0%, oklch(0.1822 0 0) 50%, oklch(0.2520 0 0) 100%)',
    
    // Header system - Cosmic header styling
    headerBackground: 'linear-gradient(135deg, oklch(0.1822 0 0) 0%, oklch(0.2520 0 0) 100%)',
    headerBackdropFilter: 'blur(20px) saturate(150%)',
    headerShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 16px oklch(0.7214 0.1337 49.9802 / 0.1)',
    headerBorder: '1px solid oklch(0.3211 0 0)',
    headerPadding: 'lg',
    headerBorderRadius: 'lg',
    
    // Card system - Dark matter card styling
    cardBackground: 'linear-gradient(145deg, oklch(0.1822 0 0) 0%, oklch(0.2520 0 0) 100%)',
    cardShadow: '0 4px 20px rgba(0, 0, 0, 0.3), 0 1px 3px oklch(0.7214 0.1337 49.9802 / 0.1)',
    cardBorder: '1px solid oklch(0.3211 0 0)',
    cardHoverShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 2px 6px oklch(0.7214 0.1337 49.9802 / 0.2)',
    
    // Navigation system
    navMenuBackground: 'linear-gradient(135deg, oklch(0.1822 0 0) 0%, oklch(0.2520 0 0) 100%)',
    navMenuShadow: '0 10px 40px rgba(0, 0, 0, 0.5), 0 4px 16px oklch(0.7214 0.1337 49.9802 / 0.15)',
    navMenuBorder: '1px solid oklch(0.3211 0 0)',
    navMenuBackdropFilter: 'blur(16px)',
    
    // Performance metadata
    performanceOptimized: true,
    themeCategory: 'custom',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    hasBackgroundSystem: true,
    hasHeaderSystem: true,
    hasCSSVariables: true,
    
    // ENHANCED: Comprehensive CSS Variables for both light and dark modes
    cssVariables: {
      // Primary colors
      '--theme-primary': primaryColors[6],
      '--theme-primary-hover': primaryColors[7],
      '--theme-primary-light': primaryColors[3],
      '--theme-primary-dark': primaryColors[8],
      
      // Background system - Dark matter cosmic theme
      '--theme-background': 'radial-gradient(ellipse at center, oklch(0.1822 0 0) 0%, oklch(0.1797 0.0043 308.1928) 40%, oklch(0.1500 0.0050 308.1928) 100%)',
      '--theme-background-secondary': 'radial-gradient(circle at 30% 70%, oklch(0.1822 0 0) 0%, oklch(0.1797 0.0043 308.1928) 60%)',
      '--theme-background-tertiary': 'linear-gradient(135deg, oklch(0.1797 0.0043 308.1928) 0%, oklch(0.1822 0 0) 50%, oklch(0.2520 0 0) 100%)',
      
      // Header system - Cosmic styling
      '--theme-header-bg': 'linear-gradient(135deg, oklch(0.1822 0 0) 0%, oklch(0.2520 0 0) 100%)',
      '--theme-header-backdrop': 'blur(20px) saturate(150%)',
      '--theme-header-shadow': '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 16px oklch(0.7214 0.1337 49.9802 / 0.1)',
      '--theme-header-border': '1px solid oklch(0.3211 0 0)',
      
      // Surface system
      '--theme-surface': 'linear-gradient(145deg, oklch(0.1822 0 0) 0%, oklch(0.2520 0 0) 100%)',
      '--theme-surface-hover': 'oklch(0.2520 0 0)',
      '--theme-surface-active': 'oklch(0.3211 0 0)',
      
      // Border and shadow system
      '--theme-border': 'oklch(0.3211 0 0)',
      '--theme-border-hover': 'oklch(0.7214 0.1337 49.9802)',
      '--theme-shadow-sm': '0 4px 20px rgba(0, 0, 0, 0.3), 0 1px 3px oklch(0.7214 0.1337 49.9802 / 0.1)',
      '--theme-shadow-md': '0 8px 30px rgba(0, 0, 0, 0.4), 0 2px 6px oklch(0.7214 0.1337 49.9802 / 0.2)',
      '--theme-shadow-lg': '0 20px 40px rgba(0, 0, 0, 0.6), 0 8px 16px oklch(0.7214 0.1337 49.9802 / 0.3)',
      
      // Text system
      '--theme-text': 'oklch(0.8109 0 0)',
      '--theme-text-secondary': 'oklch(0.6268 0 0)',
      '--theme-text-tertiary': grayColors[5],
      '--theme-text-disabled': grayColors[4]
    },
    
    // Dark mode CSS variables (same as light for this dark theme)
    cssVariablesDark: {
      '--theme-primary': primaryColors[5],
      '--theme-primary-hover': primaryColors[4],
      '--theme-primary-light': primaryColors[2],
      '--theme-primary-dark': primaryColors[7],
      
      // Keep same dark cosmic background in both modes
      '--theme-background': 'radial-gradient(ellipse at center, oklch(0.1822 0 0) 0%, oklch(0.1797 0.0043 308.1928) 40%, oklch(0.1500 0.0050 308.1928) 100%)',
      '--theme-background-secondary': 'radial-gradient(circle at 30% 70%, oklch(0.1822 0 0) 0%, oklch(0.1797 0.0043 308.1928) 60%)',
      '--theme-background-tertiary': 'linear-gradient(135deg, oklch(0.1797 0.0043 308.1928) 0%, oklch(0.1822 0 0) 50%, oklch(0.2520 0 0) 100%)',
      
      '--theme-header-bg': 'linear-gradient(135deg, oklch(0.1822 0 0) 0%, oklch(0.2520 0 0) 100%)',
      '--theme-header-backdrop': 'blur(20px) saturate(150%)',
      '--theme-header-shadow': '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 16px oklch(0.7214 0.1337 49.9802 / 0.1)',
      '--theme-header-border': '1px solid oklch(0.3211 0 0)',
      
      '--theme-surface': 'linear-gradient(145deg, oklch(0.1822 0 0) 0%, oklch(0.2520 0 0) 100%)',
      '--theme-surface-hover': 'oklch(0.2520 0 0)',
      '--theme-surface-active': 'oklch(0.3211 0 0)',
      
      '--theme-border': 'oklch(0.3211 0 0)',
      '--theme-border-hover': 'oklch(0.7214 0.1337 49.9802)',
      '--theme-shadow-sm': '0 4px 20px rgba(0, 0, 0, 0.3), 0 1px 3px oklch(0.7214 0.1337 49.9802 / 0.1)',
      '--theme-shadow-md': '0 8px 30px rgba(0, 0, 0, 0.4), 0 2px 6px oklch(0.7214 0.1337 49.9802 / 0.2)',
      '--theme-shadow-lg': '0 20px 40px rgba(0, 0, 0, 0.6), 0 8px 16px oklch(0.7214 0.1337 49.9802 / 0.3)',
      
      '--theme-text': 'oklch(0.8109 0 0)',
      '--theme-text-secondary': 'oklch(0.6268 0 0)',
      '--theme-text-tertiary': grayColors[4],
      '--theme-text-disabled': grayColors[3]
    }
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        variant: 'filled',
        color: 'brand',
      },
      styles: (theme: MantineTheme) => ({
        root: {
          fontWeight: 700,
          fontFamily: theme.headings?.fontFamily,
          background: `linear-gradient(135deg, ${primaryColors[5]} 0%, ${primaryColors[6]} 100%)`,
          boxShadow: 'var(--theme-shadow-sm)',
          border: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: `linear-gradient(135deg, ${primaryColors[4]} 0%, ${primaryColors[5]} 100%)`,
            boxShadow: 'var(--theme-shadow-md)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0px)',
            boxShadow: 'var(--theme-shadow-sm)',
          }
        },
      }),
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        shadow: 'sm',
        withBorder: true,
        padding: 'lg',
      },
      styles: (theme: MantineTheme) => ({
        root: {
          background: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)',
          boxShadow: 'var(--theme-shadow-sm)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 'var(--theme-shadow-md)',
            borderColor: 'var(--theme-border-hover)',
            transform: 'translateY(-2px)',
          }
        },
      }),
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
      styles: (theme: MantineTheme) => ({
        input: {
          borderColor: 'var(--theme-border)',
          backgroundColor: 'var(--theme-surface)',
          color: 'var(--theme-text)',
          fontFamily: theme.fontFamily,
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          '&:focus': {
            borderColor: 'var(--theme-primary)',
            boxShadow: `0 0 0 3px oklch(0.7214 0.1337 49.9802 / 0.3), var(--theme-shadow-sm)`,
            backgroundColor: 'var(--theme-surface-hover)',
          },
          '&:hover:not(:focus)': {
            borderColor: 'var(--theme-border-hover)',
            backgroundColor: 'var(--theme-surface-hover)',
          }
        },
      }),
    },
    Title: {
      defaultProps: {
        order: 3,
      },
      styles: (theme: MantineTheme) => ({
        root: {
          color: 'var(--theme-text)',
          fontFamily: theme.headings?.fontFamily,
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
        },
      }),
    },
    Text: {
      styles: (theme: MantineTheme) => ({
        root: {
          color: 'var(--theme-text-secondary)',
          fontFamily: theme.fontFamily,
        },
      }),
    },
    // Paper component styling for headers
    Paper: {
      styles: (theme: MantineTheme) => ({
        root: {
          '&[data-theme-header="true"]': {
            background: 'var(--theme-header-bg)',
            backdropFilter: 'var(--theme-header-backdrop)',
            border: 'var(--theme-header-border)',
            boxShadow: 'var(--theme-header-shadow)',
            borderRadius: theme.radius?.lg || '16px',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: 'var(--theme-shadow-lg)',
            }
          }
        }
      })
    },
    // Container component styling for backgrounds
    Container: {
      styles: (theme: MantineTheme) => ({
        root: {
          '&[data-theme-background="true"]': {
            background: 'var(--theme-background)',
            minHeight: '100vh',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'var(--theme-background-secondary)',
              opacity: 0.3,
              pointerEvents: 'none',
              zIndex: -1,
            }
          }
        }
      })
    },
    // ActionIcon styling
    ActionIcon: {
      styles: (theme: MantineTheme) => ({
        root: {
          boxShadow: 'var(--theme-shadow-sm)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: 'var(--theme-shadow-md)',
            transform: 'translateY(-1px)',
          }
        }
      })
    },
    // Menu styling
    Menu: {
      styles: (theme: MantineTheme) => ({
        dropdown: {
          background: 'var(--theme-surface)',
          border: 'var(--theme-border)',
          boxShadow: 'var(--theme-shadow-lg)',
          backdropFilter: 'blur(16px)',
        },
        item: {
          '&:hover': {
            backgroundColor: 'var(--theme-surface-hover)',
          }
        }
      })
    }
  },
}) as MantineTheme;

// Export default theme for easy importing
export default enterpriseTheme;