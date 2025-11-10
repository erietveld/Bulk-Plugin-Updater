// src/monitoring/logger.ts
// Advanced logging system following Architecture.md specifications
// FIXED: Updated to check correct Pattern 2A data variables and error handling

interface LogContext {
  [key: string]: any;
  userAgent?: string;
  timestamp?: string;
  url?: string;
  componentStack?: string;
  errorBoundary?: string;
  hybridDataContext?: {
    hasImmediateData: boolean;
    hasEnhancedData: boolean;
  };
  reactVersion?: string;
  mantineVersion?: string;
}

interface Logger {
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string, errorOrContext?: Error | LogContext, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
  trackUserAction: (action: string, context?: LogContext) => void;
  isDebugEnabled: () => boolean;
}

class EnterpriseLogger implements Logger {
  
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${context ? ` | Context: ${JSON.stringify(context, null, 2)}` : ''}`;
  }

  private logToConsole(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: LogContext, error?: Error) {
    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        // FIXED: Single comprehensive error log entry instead of double logging
        if (error) {
          const enhancedContext = {
            ...context,
            errorMessage: error.message,
            errorStack: error.stack,
            errorName: error.name
          };
          const enhancedMessage = this.formatMessage(level, message, enhancedContext);
          console.error(enhancedMessage);
        } else {
          console.error(formattedMessage);
        }
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
    }
  }

  private sendToServiceNow(level: string, message: string, error?: Error, context?: LogContext) {
    // Future implementation: Send to ServiceNow REST API for centralized logging
    // This would integrate with ServiceNow's logging table for enterprise monitoring
  }

  /**
   * Check if debug logging is enabled via URL parameter sn_debug=true
   */
  isDebugEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sn_debug') === 'true';
  }

  info(message: string, context?: LogContext): void {
    this.logToConsole('info', message, context);
    this.sendToServiceNow('info', message, undefined, context);
  }

  warn(message: string, context?: LogContext): void {
    this.logToConsole('warn', message, context);
    this.sendToServiceNow('warn', message, undefined, context);
  }

  // FIXED: Better error method signature handling
  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    let actualError: Error | undefined;
    let actualContext: LogContext | undefined;

    // Handle different call patterns
    if (errorOrContext instanceof Error) {
      actualError = errorOrContext;
      actualContext = context;
    } else {
      actualError = undefined;
      actualContext = errorOrContext;
    }

    this.logToConsole('error', message, actualContext, actualError);
    this.sendToServiceNow('error', message, actualError, actualContext);
  }

  /**
   * Debug logging - only outputs when sn_debug=true URL parameter is present
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDebugEnabled()) {
      this.logToConsole('debug', message, context);
    }
  }

  trackUserAction(action: string, context?: LogContext): void {
    const actionContext = {
      ...context,
      action,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.info(`User action: ${action}`, actionContext);
  }
}

// Export singleton instance
export const logger = new EnterpriseLogger();

// Utility function for creating context - FIXED to check correct Pattern 2A data
export const createLogContext = (additionalContext?: LogContext): LogContext => ({
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href,
  hybridDataContext: {
    hasImmediateData: !!(window as any).snImmediateData,
    hasEnhancedData: !!(window as any).snImmediateData?.quickStats
  },
  reactVersion: '19.2.0',
  mantineVersion: '8.3.6',
  ...additionalContext
});

// Utility function for conditional debug logging
export const debugLog = (message: string, context?: LogContext) => {
  logger.debug(message, context);
};