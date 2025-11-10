// src/components/theme/ColorSchemeToggle.tsx
// Color scheme toggle component - UI RENDERING ONLY
// Following atomic design principle: React Components handle UI rendering only

import React, { useCallback } from 'react';
import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { usePerformanceTracking } from '../../hooks/usePerformanceTracking';
import { debugService } from '../../services/debugService';

export const ColorSchemeToggle: React.FC = React.memo(() => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  
  // Business logic from custom hooks
  const { trackColorSchemeChange } = usePerformanceTracking();
  
  // Ensure colorScheme is never undefined
  const currentScheme = colorScheme ?? 'light';
  const isDark = currentScheme === 'dark';

  const handleToggle = useCallback(() => {
    const startTime = performance.now();
    
    // Track performance metrics via hook
    trackColorSchemeChange();
    
    // Toggle the color scheme
    toggleColorScheme();
    
    const toggleTime = performance.now() - startTime;
    
    // Log debug information via service
    debugService.logColorSchemeToggle(
      currentScheme,
      isDark ? 'light' : 'dark',
      toggleTime,
      0 // Will be tracked in store
    );

    // Visual feedback is provided by the theme change itself - no notification needed
  }, [currentScheme, isDark, toggleColorScheme, trackColorSchemeChange]);

  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="lg"
      onClick={handleToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
    </ActionIcon>
  );
});