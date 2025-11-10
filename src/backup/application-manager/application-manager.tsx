// src/client/application-manager.tsx
// Application Manager React Application Entry Point
// ARCHITECTURE COMPLIANT: Follows ServiceNow React Essential Patterns
// Uses ServiceNow's internal Application Manager API

import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

// Import the Application Manager dashboard
import { ApplicationManagerDashboard } from './components/mantine/ApplicationManagerDashboard';
import { AppErrorBoundary, FeatureErrorBoundary } from '../error/ErrorBoundary';
import { enterpriseTheme } from '../theme/mantineTheme';
import { logger, createLogContext } from '../monitoring/logger';

// ServiceNow Application Manager specific initialization
function initializeApplicationManager() {
  // Verify ServiceNow context is ready
  if (!window.serviceNowDataReady) {
    throw new Error('ServiceNow context not ready - ensure proper initialization');
  }

  if (!window.snApplicationManagerContext) {
    throw new Error('Application Manager context not available');
  }

  logger.info('Application Manager initializing', createLogContext({
    hasUserContext: !!window.snUserContext,
    hasAppManagerContext: !!window.snApplicationManagerContext,
    hasEnhancedData: !!window.enhancedData,
    apiBase: window.snApplicationManagerContext.apiBase
  }));

  // Create React Query client with Application Manager specific configuration
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error: any) => {
          // Don't retry on authentication errors
          if (error?.status === 401 || error?.status === 403) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      }
    }
  });

  // Application Manager React App
  const ApplicationManagerApp: React.FC = () => {
    return (
      <MantineProvider theme={enterpriseTheme} defaultColorScheme="auto">
        <Notifications position="top-right" zIndex={1000} />
        <QueryClientProvider client={queryClient}>
          <AppErrorBoundary>
            <Suspense fallback={
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div>Loading Application Manager...</div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Connecting to ServiceNow Application Manager API
                </div>
              </div>
            }>
              <FeatureErrorBoundary feature="ApplicationManager">
                <ApplicationManagerDashboard />
              </FeatureErrorBoundary>
            </Suspense>
          </AppErrorBoundary>
        </QueryClientProvider>
      </MantineProvider>
    );
  };

  // Mount the Application Manager
  const container = document.getElementById('application-manager-root');
  if (!container) {
    throw new Error('Application Manager root element not found');
  }

  const root = createRoot(container);
  root.render(<ApplicationManagerApp />);

  logger.info('Application Manager mounted successfully', createLogContext({
    apiBase: window.snApplicationManagerContext.apiBase,
    defaultTab: window.snApplicationManagerContext.defaultTab,
    hasAccess: window.snApplicationManagerContext.hasAppManagerAccess
  }));
}

// ServiceNow-aware initialization
function safeInitialize() {
  try {
    // Check if ServiceNow globals are ready
    if (typeof window.g_ck !== 'string' || !window.serviceNowDataReady) {
      // Wait for ServiceNow initialization
      setTimeout(safeInitialize, 100);
      return;
    }

    initializeApplicationManager();

  } catch (error) {
    logger.error('Application Manager initialization failed',
      error instanceof Error ? error : new Error(String(error)),
      createLogContext({
        hasServiceNowContext: !!window.g_ck,
        hasUserContext: !!window.snUserContext,
        hasAppManagerContext: !!window.snApplicationManagerContext
      })
    );

    // Show error to user
    const container = document.getElementById('application-manager-root');
    if (container) {
      container.innerHTML = `
        <div style="
          display: flex; 
          justify-content: center; 
          align-items: center; 
          height: 100vh; 
          flex-direction: column; 
          gap: 16px;
          color: #d63384;
          font-family: system-ui;
        ">
          <h2>Application Manager Initialization Error</h2>
          <p>Failed to initialize the Application Manager dashboard.</p>
          <p style="font-size: 14px; color: #666;">
            Error: ${error instanceof Error ? error.message : String(error)}
          </p>
          <button onclick="window.location.reload()" style="
            padding: 8px 16px;
            background: #0073e6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">
            Retry
          </button>
        </div>
      `;
    }
  }
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInitialize);
} else {
  safeInitialize();
}

// Export for potential external access
(window as any).applicationManagerApp = {
  initialize: initializeApplicationManager,
  safeInitialize
};

// Prevent the script from being loaded multiple times
if (!(window as any).applicationManagerLoaded) {
  (window as any).applicationManagerLoaded = true;
  console.log('🎯 Application Manager script loaded successfully');
}