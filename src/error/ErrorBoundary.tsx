// src/error/ErrorBoundary.tsx
// Enhanced error boundary following your documented patterns
// Implements strategic error boundary placement from core-principles.md

import React, { Component, ReactNode } from 'react';
import { logger, createLogContext } from '../monitoring/logger';
import { getString } from '../utils/typeRefinements';

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryState & { onRetry: () => void }>;
  level?: 'app' | 'feature' | 'component';
  name?: string;
}

// ServiceNow-specific error fallback component
const ServiceNowErrorFallback: React.FC<ErrorBoundaryState & { onRetry: () => void }> = ({ 
  error, 
  onRetry, 
  errorId 
}) => {
  const errorMessage = error?.message ?? '';
  const isAuthError = errorMessage.includes('authentication') || errorMessage.includes('401');
  const isPermissionError = errorMessage.includes('403') || errorMessage.includes('permission');
  const isNetworkError = errorMessage.includes('network') || errorMessage.includes('fetch');

  return (
    <div className="error-boundary-fallback" style={{ 
      padding: '2rem', 
      textAlign: 'center',
      border: '2px solid #ff6b6b',
      borderRadius: '8px',
      backgroundColor: '#fff5f5',
      margin: '1rem'
    }}>
      <h2 style={{ color: '#d63031', marginBottom: '1rem' }}>
        {isAuthError ? '🔐 Authentication Required' : 
         isPermissionError ? '🚫 Access Denied' : 
         isNetworkError ? '🌐 Network Error' :
         '⚠️ Something went wrong'}
      </h2>
      
      <p style={{ color: '#636e72', marginBottom: '1.5rem' }}>
        {isAuthError ? 'Your session may have expired. Please refresh to log in again.' :
         isPermissionError ? 'You don\'t have permission to perform this action.' :
         isNetworkError ? 'Unable to connect to ServiceNow. Please check your connection.' :
         'An unexpected error occurred. Our team has been notified.'}
      </p>
      
      {errorId && (
        <p style={{ fontSize: '0.875rem', color: '#636e72', marginBottom: '1rem' }}>
          Error ID: {errorId}
        </p>
      )}
      
      <button
        onClick={onRetry}
        style={{
          backgroundColor: '#0984e3',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#74b9ff'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0984e3'}
      >
        {isAuthError ? '🔄 Refresh & Login' : 
         isNetworkError ? '🔄 Retry Connection' :
         '🔄 Try Again'}
      </button>
    </div>
  );
};

export class ErrorBoundary extends Component<Props, ErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId ?? `ERR_${Date.now()}`;
    const componentStack = getString(errorInfo?.componentStack, '');
    
    // Log error with ServiceNow context
    logger.error('Error Boundary caught error', error, createLogContext({
      errorBoundary: this.props.name ?? 'Unknown',
      level: this.props.level ?? 'component',
      errorId,
      componentStack,
      errorInfo: componentStack.split('\n').slice(0, 5).join('\n') // First 5 lines only
    }));

    this.setState({
      hasError: true,
      error,
      errorInfo,
      errorId
    });
  }

  handleRetry = () => {
    logger.info('Error boundary retry attempted', createLogContext({
      errorBoundary: this.props.name ?? 'Unknown',
      level: this.props.level ?? 'component',
      errorId: this.state.errorId ?? 'unknown'
    }));

    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined, 
      errorId: undefined 
    });
  };

  override render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback ?? ServiceNowErrorFallback;
      
      return (
        <FallbackComponent 
          {...this.state}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different app levels
export const AppErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    level="app" 
    name="ApplicationRoot"
    fallback={ServiceNowErrorFallback}
  >
    {children}
  </ErrorBoundary>
);

export const FeatureErrorBoundary: React.FC<{ 
  children: ReactNode; 
  featureName?: string;
}> = ({ children, featureName }) => (
  <ErrorBoundary 
    level="feature" 
    name={featureName ?? 'Feature'}
    fallback={ServiceNowErrorFallback}
  >
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ 
  children: ReactNode; 
  componentName?: string;
}> = ({ children, componentName }) => (
  <ErrorBoundary 
    level="component" 
    name={componentName ?? 'Component'}
    fallback={ServiceNowErrorFallback}
  >
    {children}
  </ErrorBoundary>
);