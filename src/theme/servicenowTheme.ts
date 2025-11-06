// src/theme/servicenowTheme.ts
// ENHANCED: Complete ServiceNow theme with full dark mode support and rich visual styling
import { createTheme, MantineTheme } from '@mantine/core';

const brandColors = [
  '#e6f4ea', // 50 - Lightest green background
  '#b1d8bb', // 100
  '#7acb86', // 200
  '#47be51', // 300 - Primary brand green lighter
  '#2fa937', // 400 - Primary brand green
  '#208823', // 500 - Primary brand green darker
  '#1b7220', // 600
  '#155a18', // 700 - Darker green
  '#104213', // 800
  '#0b2d0d', // 900 - Darkest green
] as const;

const grayColors = [
  '#f9fafb', // 50 - Light background gray
  '#f3f4f6', // 100
  '#e5e7eb', // 200 - Border and surface gray lighter
  '#d1d5db', // 300
  '#9ca3af', // 400 - Text gray lighter
  '#6b7280', // 500 - Text gray (default)
  '#4b5563', // 600 - Text gray darker
  '#374151', // 700
  '#1f2937', // 800 - Headings and strong text
  '#111827', // 900 - Dark background gray
] as const;

// ENHANCED: Create theme with complete visual specification including rich styling and full dark mode
export const enterpriseTheme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand: brandColors,
    gray: grayColors,
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '32px', lineHeight: '1.2', fontWeight: '700' },
      h2: { fontSize: '28px', lineHeight: '1.25', fontWeight: '600' },
      h3: { fontSize: '24px', lineHeight: '1.3', fontWeight: '600' },
      h4: { fontSize: '20px', lineHeight: '1.35', fontWeight: '600' },
    },
  },
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '20px',
    lg: '28px',
    xl: '36px',
  },
  shadows: {
    xs: '0 1px 3px rgba(32, 136, 35, 0.12), 0 1px 2px rgba(32, 136, 35, 0.06)',
    sm: '0 4px 6px rgba(32, 136, 35, 0.15), 0 2px 4px rgba(32, 136, 35, 0.06)',
    md: '0 10px 15px rgba(32, 136, 35, 0.1), 0 4px 6px rgba(32, 136, 35, 0.05)',
    lg: '0 20px 25px rgba(32, 136, 35, 0.1), 0 10px 10px rgba(32, 136, 35, 0.04)',
    xl: '0 25px 50px rgba(32, 136, 35, 0.25)',
  },
  // ENHANCED: Complete theme specification with rich visual styling and full dark mode support
  other: {
    // Background system - ENHANCED with rich gradients and shading
    backgroundGradient: 'linear-gradient(135deg, #f0fdf4 0%, #e6f4ea 15%, #dcfce7 30%, #f0fdf9 45%, #e6f4ea 60%, #dcfce7 75%, #f0fdf4 100%)',
    backgroundPrimary: '#f0fdf4',
    backgroundSecondary: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 50%, #f0fdf4 100%)',
    backgroundTertiary: 'radial-gradient(circle at 50% 50%, #e6f4ea 0%, #f0fdf4 100%)',
    
    // Header system - ENHANCED with rich styling
    headerBackground: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 244, 0.9) 100%)',
    headerBackdropFilter: 'blur(20px) saturate(180%)',
    headerShadow: '0 8px 32px rgba(32, 136, 35, 0.12), 0 2px 16px rgba(32, 136, 35, 0.08)',
    headerBorder: '1px solid rgba(230, 244, 234, 0.5)',
    headerPadding: 'lg',
    headerBorderRadius: 'lg',
    
    // Card system - ENHANCED with layered backgrounds
    cardBackground: 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)',
    cardShadow: '0 4px 20px rgba(32, 136, 35, 0.08), 0 1px 3px rgba(32, 136, 35, 0.06)',
    cardBorder: '1px solid rgba(230, 244, 234, 0.8)',
    cardHoverShadow: '0 8px 30px rgba(32, 136, 35, 0.15), 0 2px 6px rgba(32, 136, 35, 0.1)',
    
    // Navigation system - ENHANCED
    navMenuBackground: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(249, 250, 251, 0.95) 100%)',
    navMenuShadow: '0 10px 40px rgba(32, 136, 35, 0.15), 0 4px 16px rgba(32, 136, 35, 0.1)',
    navMenuBorder: '1px solid rgba(230, 244, 234, 0.6)',
    navMenuBackdropFilter: 'blur(16px)',
    
    // Performance metadata
    performanceOptimized: true,
    themeCategory: 'brand',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    hasBackgroundSystem: true,
    hasHeaderSystem: true,
    hasCSSVariables: true,
    
    // ENHANCED: Comprehensive CSS Variables for both light and dark modes
    cssVariables: {
      // Light mode variables
      '--theme-primary': brandColors[4],
      '--theme-primary-hover': brandColors[5],
      '--theme-primary-light': brandColors[2],
      '--theme-primary-dark': brandColors[6],
      
      // Background system - Light mode with rich gradients
      '--theme-background': 'linear-gradient(135deg, #f0fdf4 0%, #e6f4ea 15%, #dcfce7 30%, #f0fdf9 45%, #e6f4ea 60%, #dcfce7 75%, #f0fdf4 100%)',
      '--theme-background-secondary': 'linear-gradient(180deg, #ffffff 0%, #f9fafb 50%, #f0fdf4 100%)',
      '--theme-background-tertiary': 'radial-gradient(circle at 50% 50%, #e6f4ea 0%, #f0fdf4 100%)',
      
      // Header system - Light mode with enhanced styling
      '--theme-header-bg': 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 253, 244, 0.9) 100%)',
      '--theme-header-backdrop': 'blur(20px) saturate(180%)',
      '--theme-header-shadow': '0 8px 32px rgba(32, 136, 35, 0.12), 0 2px 16px rgba(32, 136, 35, 0.08)',
      '--theme-header-border': '1px solid rgba(230, 244, 234, 0.5)',
      
      // Surface system - Light mode
      '--theme-surface': 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)',
      '--theme-surface-hover': '#f0fdf4',
      '--theme-surface-active': '#e6f4ea',
      
      // Border and shadow system - Light mode
      '--theme-border': 'rgba(230, 244, 234, 0.8)',
      '--theme-border-hover': 'rgba(71, 190, 81, 0.3)',
      '--theme-shadow-sm': '0 4px 20px rgba(32, 136, 35, 0.08), 0 1px 3px rgba(32, 136, 35, 0.06)',
      '--theme-shadow-md': '0 8px 30px rgba(32, 136, 35, 0.15), 0 2px 6px rgba(32, 136, 35, 0.1)',
      '--theme-shadow-lg': '0 20px 40px rgba(32, 136, 35, 0.2), 0 8px 16px rgba(32, 136, 35, 0.1)',
      
      // Text system - Light mode
      '--theme-text': grayColors[8],
      '--theme-text-secondary': grayColors[6],
      '--theme-text-tertiary': grayColors[5],
      '--theme-text-disabled': grayColors[4]
    },
    
    // FIXED: Add complete dark mode CSS variables
    cssVariablesDark: {
      // Dark mode variables
      '--theme-primary': brandColors[3],
      '--theme-primary-hover': brandColors[2],
      '--theme-primary-light': brandColors[1],
      '--theme-primary-dark': brandColors[5],
      
      // Background system - Dark mode with rich gradients
      '--theme-background': 'linear-gradient(135deg, #0b2d0d 0%, #104213 15%, #155a18 30%, #1b7220 45%, #104213 60%, #0b2d0d 75%, #111827 100%)',
      '--theme-background-secondary': 'linear-gradient(180deg, #1f2937 0%, #374151 50%, #1b7220 100%)',
      '--theme-background-tertiary': 'radial-gradient(circle at 50% 50%, #155a18 0%, #0b2d0d 100%)',
      
      // Header system - Dark mode with enhanced styling
      '--theme-header-bg': 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(16, 66, 19, 0.9) 100%)',
      '--theme-header-backdrop': 'blur(20px) saturate(180%)',
      '--theme-header-shadow': '0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 16px rgba(16, 66, 19, 0.2)',
      '--theme-header-border': '1px solid rgba(71, 190, 81, 0.2)',
      
      // Surface system - Dark mode
      '--theme-surface': 'linear-gradient(145deg, #1f2937 0%, #374151 100%)',
      '--theme-surface-hover': '#2c3e33',
      '--theme-surface-active': '#225a28',
      
      // Border and shadow system - Dark mode
      '--theme-border': 'rgba(71, 190, 81, 0.2)',
      '--theme-border-hover': 'rgba(71, 190, 81, 0.4)',
      '--theme-shadow-sm': '0 4px 20px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(16, 66, 19, 0.2)',
      '--theme-shadow-md': '0 8px 30px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(16, 66, 19, 0.3)',
      '--theme-shadow-lg': '0 20px 40px rgba(0, 0, 0, 0.5), 0 8px 16px rgba(16, 66, 19, 0.4)',
      
      // Text system - Dark mode
      '--theme-text': grayColors[1],
      '--theme-text-secondary': grayColors[3],
      '--theme-text-tertiary': grayColors[4],
      '--theme-text-disabled': grayColors[5]
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
          fontWeight: 600,
          background: `linear-gradient(135deg, ${brandColors[4]} 0%, ${brandColors[5]} 100%)`,
          boxShadow: 'var(--theme-shadow-sm)',
          border: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            background: `linear-gradient(135deg, ${brandColors[5]} 0%, ${brandColors[6]} 100%)`,
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
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:focus': {
            borderColor: 'var(--theme-primary)',
            boxShadow: `0 0 0 3px rgba(71, 190, 81, 0.2), var(--theme-shadow-sm)`,
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
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    Text: {
      styles: (theme: MantineTheme) => ({
        root: {
          color: 'var(--theme-text-secondary)',
        },
      }),
    },
    // ENHANCED: Paper component styling for headers with rich visual effects
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
    // ENHANCED: Container component styling for backgrounds with rich gradients
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
    // ENHANCED: Add ActionIcon styling
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
    // ENHANCED: Add Menu styling
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