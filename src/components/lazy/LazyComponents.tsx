// src/components/lazy/LazyComponents.tsx  
// Code splitting implementation for performance optimization
// Following Performance by Default principle: "Implement code splitting for large features"

import { lazy, Suspense } from 'react';
import { Center, Loader, Text, Stack } from '@mantine/core';

// Loading fallback component
export const ComponentLoadingFallback = () => (
  <Center h={200}>
    <Stack align="center" gap="xs">
      <Loader size="md" />
      <Text size="sm" c="dimmed">Loading component...</Text>
    </Stack>
  </Center>
);

// Lazy load major components for better performance
export const StoreUpdatesDashboard = lazy(() => 
  import('../../client/components/mantine/StoreUpdatesDashboard')
);

export const DevelopmentDebugPanel = lazy(() => 
  import('../debug/DevelopmentDebugPanel').then(module => ({ 
    default: module.DevelopmentDebugPanel 
  }))
);

export const NavigationHeader = lazy(() => 
  import('../navigation/NavigationHeader').then(module => ({ 
    default: module.NavigationHeader 
  }))
);

export const FloatingThemeSwitcher = lazy(() => 
  import('../theme/FloatingThemeSwitcher').then(module => ({ 
    default: module.FloatingThemeSwitcher 
  }))
);

export const CDNResourceDebugger = lazy(() => 
  import('../debug/CDNResourceDebugger').then(module => ({ 
    default: module.CDNResourceDebugger 
  }))
);

// Higher-order component for consistent loading states
export const withLazyLoading = <T extends object>(
  LazyComponent: React.LazyExoticComponent<React.ComponentType<T>>,
  fallback?: React.ReactNode
) => {
  return (props: T) => (
    <Suspense fallback={fallback || <ComponentLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};