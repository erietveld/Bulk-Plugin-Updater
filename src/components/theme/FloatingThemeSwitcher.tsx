// src/components/theme/FloatingThemeSwitcher.tsx
// Floating theme switcher component - UI RENDERING ONLY
// Following atomic design principle: React Components handle UI rendering only
// UPDATED: Fixed to follow proper Mantine v8 styling patterns and theme-aware colors
// STANDARDIZED: Changed to variant="light" to match refresh button styling

import React, { useMemo } from 'react';
import {
  Group,
  Menu,
  ActionIcon,
  Badge,
  Text,
  Divider,
  Box,
  useMantineTheme,
  useMantineColorScheme,
  alpha,
} from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { getActiveThemes, ThemeKey } from '../../config/themes';
import { useThemeManagement } from '../../hooks/useThemeManagement';
import { usePerformanceTracking } from '../../hooks/usePerformanceTracking';
import { debugService } from '../../services/debugService';

export const FloatingThemeSwitcher: React.FC = React.memo(() => {
  // Business logic from custom hooks
  const { currentTheme, switchTheme } = useThemeManagement();
  const { metrics, getCacheHitRatio } = usePerformanceTracking();
  
  // Memoize themes to prevent recreation - UI state only
  const themes = useMemo(() => getActiveThemes(), []);
  const isDebugMode = debugService.isDebugMode();

  // Detect if Vercel theme is active for custom hover styling
  const isVercelTheme = currentTheme === 'vercel';
  
  // SYNC: Use same selected color logic as table
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  
  // Same function as table for consistent selected colors
  const getSelectedBackgroundColor = (isSelected: boolean) => {
    if (!isSelected) {
      return undefined;
    }

    // Use consistent blue across all themes (same as table selected row color)
    if (colorScheme === 'dark') {
      return alpha(theme.colors.blue[8], 0.15);
    } else {
      return alpha(theme.colors.blue[1], 0.3);
    }
  };

  return (
    <Box
      pos="fixed"
      bottom={20}
      right={20}
      style={{ zIndex: 1000 }}
    >
      <Menu shadow="md" width={320} position="top-end">
        <Menu.Target>
          <ActionIcon
            size="xl"
            variant="light"
            radius="xl"
            aria-label="Theme settings menu"
            style={{
              boxShadow: 'var(--mantine-shadow-lg)',
              transition: 'transform 200ms ease, box-shadow 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = 'var(--mantine-shadow-xl)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'var(--mantine-shadow-lg)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
          >
            <IconSettings 
              size={24} 
              style={{
                animation: 'spin 4s linear infinite',
              }}
            />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Theme Selection</Menu.Label>
          
          {Object.entries(themes).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = currentTheme === key;
            
            return (
              <Menu.Item
                key={key}
                leftSection={<Icon size={16} />}
                rightSection={
                  <Group gap="xs">
                    {isActive && <Badge size="xs" variant="light">Active</Badge>}
                  </Group>
                }
                onClick={() => switchTheme(key as ThemeKey)}
                style={{
                  backgroundColor: getSelectedBackgroundColor(isActive),
                }}
              >
                <div>
                  <Text fw={500}>{config.name}</Text>
                  <Text 
                    size="xs" 
                    c="dimmed" 
                    style={{ fontStyle: 'italic' }}
                  >
                    {config.description}
                  </Text>
                </div>
              </Menu.Item>
            );
          })}
          
          <Divider />
          <Menu.Label>Color Scheme</Menu.Label>
          <Menu.Item>
            <Group justify="space-between" align="center">
              <Text size="sm">Toggle Light/Dark Mode</Text>
              <ColorSchemeToggle />
            </Group>
          </Menu.Item>
          <Menu.Item disabled>
            <Text size="xs" c="dimmed">
              Auto-detects system preference on first visit
            </Text>
          </Menu.Item>

          {/* Debug statistics - UI display only */}
          {isDebugMode && (
            <>
              <Divider />
              <Menu.Label>Development Statistics</Menu.Label>
              <Menu.Item disabled>
                <Text size="xs" c="dimmed">
                  Cache: {metrics.cacheHits}H/{metrics.cacheMisses}M ({getCacheHitRatio()}%)
                </Text>
              </Menu.Item>
              <Menu.Item disabled>
                <Text size="xs" c="dimmed">
                  Avg Switch: {Math.round(metrics.averageSwitchTime)}ms
                </Text>
              </Menu.Item>
              <Menu.Item disabled>
                <Text size="xs" c="dimmed">
                  Memory: ~{Math.round(metrics.memoryUsage)}KB
                </Text>
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>
      
      {/* CSS animation using proper CSS-in-JS pattern */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Vercel Theme: Lighter hover colors for better readability */
        ${isVercelTheme ? `
          [data-mantine-color-scheme="light"] .mantine-Menu-item:hover {
            background-color: rgba(100, 100, 100, 0.08) !important;
          }
          
          [data-mantine-color-scheme="dark"] .mantine-Menu-item:hover {
            background-color: rgba(160, 160, 160, 0.12) !important;
          }
        ` : ''}
      `}</style>
    </Box>
  );
});