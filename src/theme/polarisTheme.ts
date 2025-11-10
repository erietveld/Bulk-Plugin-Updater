// src/theme/polarisTheme.ts
// POLARIS THEME: Comprehensive ServiceNow Coral theme reconstructed from ServiceNow instance data
// Based on sys_id: 31bf91ae07203010e03948f78ad30095 from sn_themes scope
import { MantineThemeOverride, virtualColor } from '@mantine/core';

const polarisTheme: MantineThemeOverride = {
  colors: {
    primary: [
      '#e1f0f8',
      '#b7d9ef',
      '#91c3e5',
      '#6caedc',
      '#4899d2',
      '#2582c7',
      '#1b65a1',
      '#124a75',
      '#0a2f49',
      '#03161d'
    ],
    secondary: [
      '#d2edf7',
      '#a1d7f0',
      '#70c3e9',
      '#43b0e2',
      '#219eda',
      '#0d89cd',
      '#08609c',
      '#05456a',
      '#022a39',
      '#01141d'
    ],
    neutral: [
      '#f9fafb',
      '#f0f1f2',
      '#d9dce0',
      '#bfc3ca',
      '#a6abb5',
      '#8b91a0',
      '#6d7390',
      '#525871',
      '#3b3f57',
      '#282c3f'
    ],
    red: [
      '#fcf0f2',
      '#f7d4d8',
      '#f1b5bc',
      '#ea979f',
      '#e67883',
      '#df535f',
      '#b93e44',
      '#8a2b30',
      '#5c1b1f',
      '#2f0c0f'
    ],
    yellow: [
      '#fff9e1',
      '#f9e8a0',
      '#f5d56f',
      '#f3c434',
      '#efb703',
      '#d09903',
      '#a57102',
      '#704d01',
      '#3e2a00',
      '#1a1300'
    ],
    green: [
      '#e9f6e4',
      '#c5e5bf',
      '#9fd99a',
      '#7bcd76',
      '#58c350',
      '#35ac29',
      '#2b8720',
      '#20631a',
      '#154215',
      '#0c2b13'
    ],
    blue: [
      '#e5f1f6',
      '#bfe1ec',
      '#99d0e3',
      '#77c1d9',
      '#51b4cf',
      '#2da8c6',
      '#217d92',
      '#155a67',
      '#0a3538',
      '#051b1c'
    ],
    dark: [
      '#C9C9C9',
      '#b8b8b8',
      '#828282',
      '#696969',
      '#424242',
      '#3b3b3b',
      '#2e2e2e',
      '#242424',
      '#1f1f1f',
      '#141414'
    ],
    gray: [
      '#f8f9fa',
      '#f1f3f5',
      '#e9ecef',
      '#dee2e6',
      '#ced4da',
      '#adb5bd',
      '#868e96',
      '#495057',
      '#343a40',
      '#212529'
    ],
    pink: [
      '#fff0f6',
      '#ffdeeb',
      '#fcc2d7',
      '#faa2c1',
      '#f783ac',
      '#f06595',
      '#e64980',
      '#d6336c',
      '#c2255c',
      '#a61e4d'
    ],
    grape: [
      '#f8f0fc',
      '#f3d9fa',
      '#eebefa',
      '#e599f7',
      '#da77f2',
      '#cc5de8',
      '#be4bdb',
      '#ae3ec9',
      '#9c36b5',
      '#862e9c'
    ],
    violet: [
      '#f3f0ff',
      '#e5dbff',
      '#d0bfff',
      '#b197fc',
      '#9775fa',
      '#845ef7',
      '#7950f2',
      '#7048e8',
      '#6741d9',
      '#5f3dc4'
    ],
    indigo: [
      '#edf2ff',
      '#dbe4ff',
      '#bac8ff',
      '#91a7ff',
      '#748ffc',
      '#5c7cfa',
      '#4c6ef5',
      '#4263eb',
      '#3b5bdb',
      '#364fc7'
    ],
    cyan: [
      '#e3fafc',
      '#c5f6fa',
      '#99e9f2',
      '#66d9e8',
      '#3bc9db',
      '#22b8cf',
      '#15aabf',
      '#1098ad',
      '#0c8599',
      '#0b7285'
    ],
    teal: [
      '#e6fcf5',
      '#c3fae8',
      '#96f2d7',
      '#63e6be',
      '#38d9a9',
      '#20c997',
      '#12b886',
      '#0ca678',
      '#099268',
      '#087f5b'
    ],
    lime: [
      '#f4fce3',
      '#e9fac8',
      '#d8f5a2',
      '#c0eb75',
      '#a9e34b',
      '#94d82d',
      '#82c91e',
      '#74b816',
      '#66a80f',
      '#5c940d'
    ],
    orange: [
      '#fff4e6',
      '#ffe8cc',
      '#ffd8a8',
      '#ffc078',
      '#ffa94d',
      '#ff922b',
      '#fd7e14',
      '#f76707',
      '#e8590c',
      '#d9480f'
    ]
  },
  primaryColor: 'primary',
  primaryShade: {
    light: 6,
    dark: 8
  },
  white: '#fff',
  black: '#000',
  isThemeDependentPrimaryShade: true,
  defaultGradient: {
    from: 'primary',
    to: 'secondary',
    deg: 45
  },
  fontFamily: 'Roboto',
  fontFamilyMonospace: 'Roboto Mono',
  headings: {
    fontFamily: 'Roboto',
    fontWeight: '700',
    sizes: {
      h1: {
        fontSize: 'calc(2.125rem * var(--mantine-scale))',
        lineHeight: '1.3',
        fontWeight: '700'
      },
      h2: {
        fontSize: 'calc(1.625rem * var(--mantine-scale))',
        lineHeight: '1.35',
        fontWeight: '700'
      },
      h3: {
        fontSize: 'calc(1.375rem * var(--mantine-scale))',
        lineHeight: '1.4',
        fontWeight: '700'
      },
      h4: {
        fontSize: 'calc(1.125rem * var(--mantine-scale))',
        lineHeight: '1.45',
        fontWeight: '700'
      },
      h5: {
        fontSize: 'calc(1rem * var(--mantine-scale))',
        lineHeight: '1.5',
        fontWeight: '700'
      },
      h6: {
        fontSize: 'calc(0.875rem * var(--mantine-scale))',
        lineHeight: '1.5',
        fontWeight: '700'
      }
    }
  },
  scale: 1,
  radius: {
    xs: 'calc(0.125rem * var(--mantine-scale))',
    sm: 'calc(0.25rem * var(--mantine-scale))',
    md: 'calc(0.5rem * var(--mantine-scale))',
    lg: 'calc(1rem * var(--mantine-scale))',
    xl: 'calc(2rem * var(--mantine-scale))'
  },
  spacing: {
    xs: 'calc(0.625rem * var(--mantine-scale))',
    sm: 'calc(0.75rem * var(--mantine-scale))',
    md: 'calc(1rem * var(--mantine-scale))',
    lg: 'calc(1.25rem * var(--mantine-scale))',
    xl: 'calc(2rem * var(--mantine-scale))'
  },
  defaultRadius: 'md',
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em'
  },
  fontSmoothing: true,
  focusRing: 'auto'
};

// Named export
export { polarisTheme };

// Default export
export default polarisTheme;