// src/client/main.tsx
// Main application entry point with full TypeScript support
// ENHANCED: Proper loading state management and React initialization

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import { logger, createLogContext } from '../monitoring/logger';

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element not found. Make sure the HTML file contains a div with id="root".');
}

// Log React initialization
logger.info('Initializing React application', createLogContext({
  reactVersion: React.version,
  rootElement: rootElement.id,
  hasImmediateData: !!(window as any).snImmediateData,
  pattern2AAvailable: !!((window as any).snImmediateData?.userContext?.pattern2A?.isAvailable)
}));

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mark React as ready (hide loading state)
setTimeout(() => {
  rootElement.classList.add('react-ready');
  logger.info('React application fully mounted', createLogContext({
    loadTime: performance.now(),
    pattern2AData: (window as any).snImmediateData ? 'available' : 'not-available'
  }));
}, 100);