// src/config/themes.ts
// Theme configuration and metadata
// Extracted from app.tsx for better maintainability

import { MantineTheme } from '@mantine/core';
import {
  IconPalette,
  IconSun,
  IconBuildingStore,
  IconRocket,
  IconStars,
  IconAtom
} from '@tabler/icons-react';

import { enterpriseTheme as baseMantineTheme } from '../theme/mantineTheme';
import { enterpriseTheme as baseServicenowTheme } from '../theme/servicenowTheme';
import { polarisTheme as basePolarisTheme } from '../theme/polarisTheme';
import vercelThemeBase from '../theme/vercelTheme';
import cosmicNightThemeBase from '../theme/cosmicNightTheme';
import { enterpriseTheme as darkMatterThemeBase } from '../theme/darkMatterTheme';
import { getString } from '../utils/typeRefinements';

export interface EnhancedThemeConfig {
  theme: MantineTheme;
  name: string;
  icon: React.ComponentType<{ size?: number }>;
  backgroundGradient: string;
  primaryColor: string;
  category: 'corporate' | 'brand' | 'custom';
  accessibility: 'AA' | 'AAA';
  colorSchemeSupport: boolean;
  systemPreferenceAware: boolean;
  version: string;
  author?: string;
  description?: string;
  tags?: string[];
  performance?: {
    expectedLoadTime: number;
    cacheability: 'high' | 'medium' | 'low';
    memoryFootprint: 'small' | 'medium' | 'large';
  };
}

export const createThemeConfig = (): Record<string, EnhancedThemeConfig> => ({
  mantine: { 
    theme: baseMantineTheme, 
    name: 'Corporate Blue', 
    icon: IconPalette,
    backgroundGradient: getString(baseMantineTheme.other?.backgroundGradient) ?? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 25%, #bae6fd 50%, #e0f2fe 75%, #f0f9ff 100%)',
    primaryColor: '#0ea5e9',
    category: 'corporate',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    version: '1.0.0',
    description: 'Professional corporate theme with blue accent colors',
    tags: ['corporate', 'professional', 'blue'],
    performance: {
      expectedLoadTime: 50,
      cacheability: 'high',
      memoryFootprint: 'medium'
    }
  },
  vercel: {
    theme: vercelThemeBase as MantineTheme,
    name: 'Vercel Modern',
    icon: IconRocket,
    backgroundGradient: getString((vercelThemeBase as any)?.other?.backgroundGradient) ?? 'linear-gradient(135deg, oklch(0.99 0 0) 0%, oklch(0.94 0 0) 25%, oklch(0.97 0 0) 50%, oklch(0.94 0 0) 75%, oklch(0.99 0 0) 100%)',
    primaryColor: 'oklch(0 0 0)',
    category: 'custom',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    version: '1.0.0',
    author: 'Vercel',
    description: 'Modern minimalist theme inspired by Vercel design system',
    tags: ['modern', 'minimalist', 'vercel', 'clean'],
    performance: {
      expectedLoadTime: 60,
      cacheability: 'high',
      memoryFootprint: 'medium'
    }
  },
  cosmic: {
    theme: cosmicNightThemeBase as MantineTheme,
    name: 'Cosmic Night',
    icon: IconStars,
    backgroundGradient: getString((cosmicNightThemeBase as any)?.other?.backgroundGradient) ?? 'linear-gradient(135deg, #f5f5ff 0%, #e4dfff 25%, #f0f0fa 50%, #e0e0f0 75%, #f5f5ff 100%)',
    primaryColor: '#6e56cf',
    category: 'custom',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    version: '1.0.0',
    description: 'Cosmic-inspired theme with purple accents and starry aesthetics',
    tags: ['cosmic', 'purple', 'night', 'space', 'elegant'],
    performance: {
      expectedLoadTime: 65,
      cacheability: 'high',
      memoryFootprint: 'medium'
    }
  },
  
  // INACTIVE THEMES: Kept for future use but not shown in theme switcher
  servicenow: { 
    theme: baseServicenowTheme, 
    name: 'ServiceNow Green', 
    icon: IconSun,
    backgroundGradient: getString(baseServicenowTheme.other?.backgroundGradient) ?? 'linear-gradient(135deg, #f0fdf4 0%, #e6f4ea 25%, #dcfce7 50%, #e6f4ea 75%, #f0fdf4 100%)',
    primaryColor: '#2fa937',
    category: 'brand',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    version: '1.0.0',
    description: 'Official ServiceNow brand theme with green accent colors',
    tags: ['servicenow', 'brand', 'green', 'inactive'],
    performance: {
      expectedLoadTime: 45,
      cacheability: 'high',
      memoryFootprint: 'medium'
    }
  },
  polaris: {
    theme: basePolarisTheme,
    name: 'ServiceNow Polaris',
    icon: IconBuildingStore,
    backgroundGradient: getString(basePolarisTheme?.other?.backgroundGradient) ?? 'linear-gradient(135deg, rgb(255,255,255) 0%, rgb(246,247,247) 25%, rgb(236,244,241) 50%, rgb(246,247,247) 75%, rgb(255,255,255) 100%)',
    primaryColor: 'rgb(30,133,109)',
    category: 'brand',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    version: '1.0.0',
    author: 'ServiceNow',
    description: 'Official ServiceNow Polaris theme with teal design system',
    tags: ['servicenow', 'polaris', 'teal', 'professional', 'official', 'inactive'],
    performance: {
      expectedLoadTime: 55,
      cacheability: 'high',
      memoryFootprint: 'medium'
    }
  },
  darkmatter: {
    theme: darkMatterThemeBase,
    name: 'Dark Matter',
    icon: IconAtom,
    backgroundGradient: getString(darkMatterThemeBase?.other?.backgroundGradient) ?? 'radial-gradient(ellipse at center, oklch(0.1822 0 0) 0%, oklch(0.1797 0.0043 308.1928) 40%, oklch(0.1500 0.0050 308.1928) 100%)',
    primaryColor: 'oklch(0.7214 0.1337 49.9802)',
    category: 'custom',
    accessibility: 'AA',
    colorSchemeSupport: true,
    systemPreferenceAware: true,
    version: '1.0.0',
    description: 'Professional cosmic theme with OKLCH color space and dark matter aesthetics',
    tags: ['dark', 'cosmic', 'professional', 'monospace', 'oklch', 'inactive'],
    performance: {
      expectedLoadTime: 70,
      cacheability: 'high',
      memoryFootprint: 'medium'
    }
  }
});

export type ThemeKey = keyof ReturnType<typeof createThemeConfig>;

export const DEFAULT_THEME: ThemeKey = 'mantine';

// Get only active themes for the theme switcher (excludes inactive themes)
export const getActiveThemes = (): Record<string, EnhancedThemeConfig> => {
  const allThemes = createThemeConfig();
  const activeThemeKeys = ['mantine', 'vercel', 'cosmic']; // Only these 3 themes are active
  
  return Object.entries(allThemes)
    .filter(([key]) => activeThemeKeys.includes(key))
    .reduce((acc, [key, config]) => {
      acc[key] = config;
      return acc;
    }, {} as Record<string, EnhancedThemeConfig>);
};