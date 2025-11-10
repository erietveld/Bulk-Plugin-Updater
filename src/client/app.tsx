// src/client/app.tsx
// Full featured app component following atomic design principles
// Implements: Performance by Default, Strategic Error Boundaries, Code Splitting
// RESTORED: Full version with theme switcher and all features
// UPDATED: Reduced Stack gap from "lg" to "xs" for consistent spacing with cards
// FIXED: Removed props from FloatingThemeSwitcher as it uses its own hooks

import React, { useMemo, Suspense } from 'react';
import { MantineProvider, Container, Stack, Center, Loader } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useThemeManagement } from '../hooks/useThemeManagement';
import { usePerformanceTracking } from '../hooks/usePerformanceTracking';
import { createEnhancedColorSchemeManager } from '../theme/management/colorScheme';
import { cssVariablesResolver } from '../theme/management/cache';
import { logger, createLogContext } from '../monitoring/logger';

// Import lazy components and loading fallback
import {
  StoreUpdatesDashboard,
  DevelopmentDebugPanel,
  NavigationHeader,
  FloatingThemeSwitcher,
  CDNResourceDebugger,
  ComponentLoadingFallback
} from '../components/lazy/LazyComponents';

// Import error boundaries
import { 
  AppErrorBoundary, 
  FeatureErrorBoundary 
} from '../error/ErrorBoundary';

// Enhanced color scheme manager with system preference detection
const colorSchemeManager = createEnhancedColorSchemeManager();

// Check if debug mode is enabled
const isDebugMode = () => {
  return new URLSearchParams(window.location.search).get('sn_debug') === 'true';
};

// Loading fallback for components
const ComponentLoadingSpinner = () => <ComponentLoadingFallback />;

// Main App Content with proper error boundaries and code splitting
const AppContent: React.FC = () => {
  const { currentTheme, switchTheme, isChanging } = useThemeManagement();
  const performanceMetrics = usePerformanceTracking();
  const debugMode = isDebugMode();

  // Create query client with memoization to prevent recreation
  const queryClient = useMemo(() => {
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
          retry: (failureCount: number, error: any) => {
            // ServiceNow-specific retry logic
            if (failureCount >= 3) return false;
            if (error instanceof Error && error.message.includes('authentication')) return false;
            return true;
          },
          retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
        mutations: {
          retry: 1,
          retryDelay: 1000,
        }
      }
    });
  }, []);

  // Log successful initialization
  React.useEffect(() => {
    logger.info('App content initialized with full features', createLogContext({
      currentTheme,
      isChanging,
      debugMode,
      hasPerformanceTracking: !!performanceMetrics
    }));
  }, [currentTheme, isChanging, debugMode, performanceMetrics]);

  return (
    <QueryClientProvider client={queryClient}>
      <Notifications />
      
      {/* CDN Resource Debugger (debug mode only) */}
      <Suspense fallback={null}>
        <CDNResourceDebugger />
      </Suspense>
      
      {/* Floating Theme Switcher */}
      <Suspense fallback={null}>
        <FloatingThemeSwitcher />
      </Suspense>
      
      {/* Main Application Content with Error Boundaries */}
      <Container 
        size="xl" 
        py="md"
        data-theme-background="true"
      >
        <Stack gap="xs">
          {/* Development Debug Panel (debug mode only) */}
          {debugMode && (
            <FeatureErrorBoundary featureName="DebugPanel">
              <Suspense fallback={<ComponentLoadingSpinner />}>
                <DevelopmentDebugPanel />
              </Suspense>
            </FeatureErrorBoundary>
          )}
          
          {/* Navigation Header */}
          <FeatureErrorBoundary featureName="Navigation">
            <Suspense fallback={<ComponentLoadingSpinner />}>
              <NavigationHeader />
            </Suspense>
          </FeatureErrorBoundary>
          
          {/* Main Dashboard */}
          <FeatureErrorBoundary featureName="StoreUpdatesDashboard">
            <Suspense fallback={<ComponentLoadingSpinner />}>
              <StoreUpdatesDashboard 
                showHeader={false}
                compactMode={false}
              />
            </Suspense>
          </FeatureErrorBoundary>
        </Stack>
      </Container>
    </QueryClientProvider>
  );
};

// ServiceNow-specific error fallback for app level
const AppErrorFallback: React.FC<{ error?: Error; onRetry: () => void }> = ({ 
  error, 
  onRetry 
}) => {
  const errorMessage = error?.message ?? 'Unknown error occurred';
  const isAuthError = errorMessage.includes('authentication') || errorMessage.includes('401');
  
  return (
    <div style={{ 
      padding: '3rem', 
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <h1 style={{ color: '#d63031', marginBottom: '1rem' }}>
        {isAuthError ? '🔐 Authentication Error' : '⚠️ Application Error'}
      </h1>
      
      <p style={{ color: '#636e72', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
        {isAuthError 
          ? 'Your ServiceNow session has expired. Please refresh the page to log in again.'
          : 'The ServiceNow application encountered an unexpected error. Please try refreshing the page.'
        }
      </p>
      
      <button
        onClick={onRetry}
        style={{
          backgroundColor: '#0984e3',
          color: 'white',
          border: 'none',
          padding: '1rem 2rem',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '1.1rem',
          maxWidth: '200px',
          margin: '0 auto'
        }}
      >
        🔄 Refresh Application
      </button>
    </div>
  );
};

// Main App Component following atomic design principles
const App: React.FC = () => {
  const { getCurrentTheme, currentTheme, error, currentThemeConfig } = useThemeManagement();

  // Get theme configuration safely with the fixes from minimal version
  const themeConfig = useMemo(() => {
    try {
      const theme = getCurrentTheme();
      logger.info('Theme initialized successfully (full version)', createLogContext({
        currentTheme,
        hasTheme: !!theme,
        themeName: currentThemeConfig?.name ?? 'Unknown',
        version: 'full-featured'
      }));
      return theme;
    } catch (error) {
      logger.error('Failed to initialize theme (full version)', error instanceof Error ? error : undefined, createLogContext({
        currentTheme,
        error: error instanceof Error ? error.message : 'Unknown theme error',
        themeName: currentThemeConfig?.name ?? 'Unknown',
        version: 'full-featured'
      }));
      
      // For debugging, let's show the error but still try to continue
      console.error('Theme initialization failed:', error);
      return null;
    }
  }, [getCurrentTheme, currentTheme, currentThemeConfig]);

  // If we have a theme error, show detailed error message
  if (error) {
    return (
      <div style={{ 
        padding: '3rem', 
        textAlign: 'center',
        backgroundColor: '#fff5f5',
        border: '2px solid #ff6b6b',
        borderRadius: '8px',
        margin: '2rem'
      }}>
        <h2 style={{ color: '#d63031' }}>🎨 Theme Loading Error</h2>
        <p style={{ color: '#636e72' }}>Failed to load theme: {error}</p>
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '0.875rem' }}>
          <p><strong>Current theme:</strong> {currentTheme}</p>
          <p><strong>Theme config:</strong> {currentThemeConfig ? 'Available' : 'Missing'}</p>
          <p><strong>Theme name:</strong> {currentThemeConfig?.name ?? 'Unknown'}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#0984e3',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          🔄 Reload Application
        </button>
      </div>
    );
  }

  // If no theme config yet, show enhanced loading with debugging info
  if (!themeConfig) {
    return (
      <div style={{ 
        padding: '3rem', 
        textAlign: 'center',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ marginBottom: '1rem', fontSize: '2rem' }}>⚙️</div>
        <h2 style={{ color: '#495057', fontFamily: 'system-ui, sans-serif' }}>
          Initializing ServiceNow application...
        </h2>
        <p style={{ color: '#6c757d', marginTop: '1rem' }}>
          Loading theme configuration for: <strong>{currentTheme}</strong>
        </p>
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '4px', maxWidth: '400px', margin: '1rem auto' }}>
          <p style={{ fontSize: '0.875rem', color: '#495057', margin: '0.25rem 0' }}>
            <strong>Theme config:</strong> {currentThemeConfig ? '✅ Available' : '❌ Missing'}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#495057', margin: '0.25rem 0' }}>
            <strong>Theme name:</strong> {currentThemeConfig?.name ?? 'Unknown'}
          </p>
          <p style={{ fontSize: '0.875rem', color: '#495057', margin: '0.25rem 0' }}>
            <strong>Debug mode:</strong> {isDebugMode() ? '✅ Enabled' : '❌ Disabled'}
          </p>
        </div>
        
        {/* Show a loading spinner */}
        <div style={{ marginTop: '2rem' }}>
          <Center>
            <Loader size="lg" />
          </Center>
        </div>
        
        {/* Debug info */}
        <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#9ca3af' }}>
          Check browser console for detailed theme loading information
        </div>
        
        {/* Manual retry button */}
        <button 
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            marginTop: '2rem'
          }}
        >
          🔄 Retry Loading
        </button>
      </div>
    );
  }

  logger.info('Rendering full-featured app with theme', createLogContext({
    currentTheme,
    hasThemeConfig: !!themeConfig,
    themeName: currentThemeConfig?.name ?? 'Unknown',
    version: 'full-featured',
    debugMode: isDebugMode()
  }));

  return (
    <AppErrorBoundary>
      <MantineProvider 
        theme={themeConfig}
        defaultColorScheme="auto"
        colorSchemeManager={colorSchemeManager}
        cssVariablesResolver={cssVariablesResolver}
      >
        <AppContent />
      </MantineProvider>
    </AppErrorBoundary>
  );
};

export default App;