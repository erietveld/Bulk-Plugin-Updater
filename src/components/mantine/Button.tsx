// src/components/mantine/Button.tsx
// Generic button component with variants and error handling
// Following Architecture.md enterprise patterns

import React, { forwardRef, useCallback } from 'react';
import { Button, ButtonProps, Loader } from '@mantine/core';
import { logger, createLogContext } from '../../monitoring/logger';

export interface GenericButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  loading?: boolean;
  errorBoundary?: boolean;
  trackClick?: boolean;
  trackingContext?: Record<string, any>;
}

export const GenericButton = React.memo(
  forwardRef<HTMLButtonElement, GenericButtonProps>(
    ({ 
      onClick, 
      loading = false, 
      errorBoundary = true, 
      trackClick = true,
      trackingContext = {},
      children,
      disabled,
      ...props 
    }, ref) => {
      const handleClick = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
        if (!onClick || loading || disabled) return;

        try {
          // Track click if enabled
          if (trackClick) {
            logger.trackUserAction('button-clicked', createLogContext({
              buttonText: typeof children === 'string' ? children : 'button',
              variant: props.variant || 'filled',
              ...trackingContext
            }));
          }

          const startTime = performance.now();
          await onClick(event);
          const duration = performance.now() - startTime;

          // Log slow button operations
          if (duration > 500) {
            logger.warn('Slow button operation detected', createLogContext({
              buttonText: typeof children === 'string' ? children : 'button',
              duration: Math.round(duration),
              threshold: 500
            }));
          }

        } catch (error) {
          if (errorBoundary) {
            logger.error('Button click handler failed', error as Error, createLogContext({
              buttonText: typeof children === 'string' ? children : 'button',
              variant: props.variant || 'filled',
              ...trackingContext
            }));
          } else {
            throw error; // Re-throw if error boundary is disabled
          }
        }
      }, [onClick, loading, disabled, trackClick, trackingContext, children, props.variant, errorBoundary]);

      return (
        <Button
          ref={ref}
          onClick={handleClick}
          disabled={disabled || loading}
          leftSection={loading ? <Loader size="sm" /> : props.leftSection}
          {...props}
        >
          {children}
        </Button>
      );
    }
  )
);

GenericButton.displayName = 'GenericButton';

// Specialized button variants
export const PrimaryButton = React.memo(
  forwardRef<HTMLButtonElement, GenericButtonProps>(
    (props, ref) => (
      <GenericButton 
        ref={ref} 
        variant="filled" 
        color="brand" 
        {...props} 
      />
    )
  )
);

PrimaryButton.displayName = 'PrimaryButton';

export const SecondaryButton = React.memo(
  forwardRef<HTMLButtonElement, GenericButtonProps>(
    (props, ref) => (
      <GenericButton 
        ref={ref} 
        variant="outline" 
        color="brand" 
        {...props} 
      />
    )
  )
);

SecondaryButton.displayName = 'SecondaryButton';

export const DangerButton = React.memo(
  forwardRef<HTMLButtonElement, GenericButtonProps>(
    (props, ref) => (
      <GenericButton 
        ref={ref} 
        variant="filled" 
        color="red" 
        {...props} 
      />
    )
  )
);

DangerButton.displayName = 'DangerButton';

export const SuccessButton = React.memo(
  forwardRef<HTMLButtonElement, GenericButtonProps>(
    (props, ref) => (
      <GenericButton 
        ref={ref} 
        variant="filled" 
        color="green" 
        {...props} 
      />
    )
  )
);

SuccessButton.displayName = 'SuccessButton';