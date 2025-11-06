// src/error/ErrorBoundary.tsx
// Enterprise-grade error boundary following Architecture.md specifications
// FIXED: No Mantine dependencies to avoid provider timing issues

import * as React from 'react';
import { logger, createLogContext } from '../monitoring/logger';

interface Props {
  children: React.ReactNode;
  fallback?: (error: Error, resetErrorBoundary: () => void) => React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class EnterpriseErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorInfo: null 
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error with comprehensive context
    logger.error('Enhanced error boundary triggered', error, createLogContext({
      componentStack: errorInfo.componentStack,
      errorBoundary: 'EnterpriseErrorBoundary',
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    }));

    this.setState({
      error,
      errorInfo
    });
  }

  private resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  private reportError = (): void => {
    const { error } = this.state;
    if (error) {
      logger.error('User reported error', error, createLogContext({
        userReported: true,
        reportedAt: new Date().toISOString()
      }));

      // Simple alert since we can't use Mantine notifications here
      alert('Error reported! Thank you. The development team has been notified.');
    }
  };

  public render(): React.ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.resetErrorBoundary);
      }

      // Default enterprise error UI using plain HTML/CSS (no Mantine dependencies)
      const containerStyle: React.CSSProperties = {
        maxWidth: '600px',
        margin: '2rem auto',
        padding: '2rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#fff',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      };

      const alertStyle: React.CSSProperties = {
        padding: '1rem',
        backgroundColor: '#ffebee',
        border: '1px solid #ffcdd2',
        borderRadius: '4px',
        marginBottom: '1rem'
      };

      const buttonStyle: React.CSSProperties = {
        padding: '0.5rem 1rem',
        margin: '0.25rem',
        border: '1px solid #228be6',
        borderRadius: '4px',
        backgroundColor: '#228be6',
        color: 'white',
        cursor: 'pointer',
        fontSize: '14px',
        fontFamily: 'inherit'
      };

      const outlineButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        backgroundColor: 'transparent',
        color: '#228be6'
      };

      return (
        <div style={containerStyle}>
          <div style={alertStyle}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#d32f2f' }}>🐛 Application Error</h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '14px' }}>
              An unexpected error occurred in the application. Our development team has been automatically notified.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div style={{ marginTop: '1rem' }}>
                <strong style={{ fontSize: '12px', color: '#d32f2f' }}>Development Details:</strong>
                <pre style={{ 
                  fontSize: '11px', 
                  color: '#d32f2f', 
                  backgroundColor: '#fafafa', 
                  padding: '0.5rem',
                  borderRadius: '2px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {this.state.error.message}
                  {this.state.error.stack && `\n${this.state.error.stack.slice(0, 500)}...`}
                </pre>
              </div>
            )}
            
            <div style={{ marginTop: '1rem' }}>
              <button 
                style={buttonStyle}
                onClick={this.resetErrorBoundary}
              >
                🔄 Try Again
              </button>
              
              <button 
                style={outlineButtonStyle}
                onClick={this.reportError}
              >
                📋 Report Issue
              </button>
              
              <button 
                style={{...outlineButtonStyle, color: '#666', borderColor: '#666'}}
                onClick={() => window.location.reload()}
              >
                🔃 Reload Page
              </button>
            </div>
          </div>

          <div style={{ ...alertStyle, backgroundColor: '#e3f2fd', borderColor: '#bbdefb' }}>
            <strong style={{ fontSize: '14px' }}>What happened?</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px' }}>
              A component in the application encountered an unexpected error. 
              This could be due to a network issue, browser compatibility, or a temporary system problem.
            </p>
          </div>

          <div style={{ ...alertStyle, backgroundColor: '#fff3e0', borderColor: '#ffcc02' }}>
            <strong style={{ fontSize: '14px' }}>What to try:</strong>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '20px', fontSize: '14px' }}>
              <li>Click "Try Again" to attempt recovery</li>
              <li>Refresh your browser if the problem persists</li>
              <li>Report the issue if you continue experiencing problems</li>
            </ul>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced Error Boundary with custom fallback support
export const ErrorBoundary: React.FC<{ 
  children: React.ReactNode;
  fallbackRender?: (props: { error: Error; resetErrorBoundary: () => void }) => React.ReactNode;
}> = ({ children, fallbackRender }) => {
  return (
    <EnterpriseErrorBoundary
      fallback={fallbackRender ? (error, reset) => fallbackRender({ error, resetErrorBoundary: reset }) : undefined}
    >
      {children}
    </EnterpriseErrorBoundary>
  );
};

// Utility function for manually triggering error boundary
export const triggerErrorBoundary = (error: Error): void => {
  throw error;
};

export default EnterpriseErrorBoundary;