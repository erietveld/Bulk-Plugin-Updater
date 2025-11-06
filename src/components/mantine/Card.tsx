// src/components/mantine/Card.tsx
// Generic card component with advanced features
// Following Architecture.md enterprise patterns

import React, { forwardRef, useMemo } from 'react';
import { Card, CardProps, Group, Text, ActionIcon, Skeleton, Alert } from '@mantine/core';
import { IconAlertCircle, IconX } from '@tabler/icons-react';
import { logger, createLogContext } from '../../monitoring/logger';

export interface GenericCardProps extends Omit<CardProps, 'onClick'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  dismissible?: boolean;
  onDismiss?: () => void;
  trackInteractions?: boolean;
  trackingContext?: Record<string, any>;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  isEmpty?: boolean;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const GenericCard = React.memo(
  forwardRef<HTMLDivElement, GenericCardProps>(
    ({ 
      title,
      subtitle,
      actions,
      loading = false,
      error = null,
      dismissible = false,
      onDismiss,
      trackInteractions = false,
      trackingContext = {},
      emptyState,
      isEmpty = false,
      children,
      onClick,
      ...props 
    }, ref) => {
      
      // Memoize header content for performance
      const headerContent = useMemo(() => {
        if (!title && !subtitle && !actions) return null;

        return (
          <Group justify="space-between" align="flex-start" mb="md">
            <div style={{ flex: 1 }}>
              {title && (
                <Text fw={600} size="lg" mb={subtitle ? 4 : 0}>
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text size="sm" c="dimmed">
                  {subtitle}
                </Text>
              )}
            </div>
            
            <Group gap="xs" align="flex-start">
              {actions}
              {dismissible && onDismiss && (
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => {
                    if (trackInteractions) {
                      logger.trackUserAction('card-dismissed', createLogContext({
                        cardTitle: typeof title === 'string' ? title : 'card',
                        ...trackingContext
                      }));
                    }
                    onDismiss();
                  }}
                >
                  <IconX size={16} />
                </ActionIcon>
              )}
            </Group>
          </Group>
        );
      }, [title, subtitle, actions, dismissible, onDismiss, trackInteractions, trackingContext]);

      // Memoize loading state
      const loadingContent = useMemo(() => {
        if (!loading) return null;

        return (
          <>
            {headerContent && (
              <Group justify="space-between" align="flex-start" mb="md">
                <div style={{ flex: 1 }}>
                  <Skeleton height={24} width="60%" mb={4} />
                  <Skeleton height={16} width="80%" />
                </div>
              </Group>
            )}
            <Skeleton height={20} mb="xs" />
            <Skeleton height={20} mb="xs" />
            <Skeleton height={20} width="70%" />
          </>
        );
      }, [loading, headerContent]);

      // Memoize error state
      const errorContent = useMemo(() => {
        if (!error) return null;

        return (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            title="Error Loading Content"
            mb="md"
          >
            <Text size="sm">{error}</Text>
          </Alert>
        );
      }, [error]);

      // Memoize empty state
      const emptyStateContent = useMemo(() => {
        if (!isEmpty || !emptyState) return null;

        return (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem 1rem',
            color: 'var(--mantine-color-dimmed)'
          }}>
            {emptyState.icon && (
              <div style={{ marginBottom: '1rem' }}>
                {emptyState.icon}
              </div>
            )}
            <Text fw={500} mb="xs">{emptyState.title}</Text>
            {emptyState.description && (
              <Text size="sm" c="dimmed" mb="md">
                {emptyState.description}
              </Text>
            )}
            {emptyState.action}
          </div>
        );
      }, [isEmpty, emptyState]);

      // Handle card interactions
      const handleCardClick = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (trackInteractions && onClick) {
          logger.trackUserAction('card-clicked', createLogContext({
            cardTitle: typeof title === 'string' ? title : 'card',
            hasActions: !!actions,
            ...trackingContext
          }));
        }
        
        if (onClick) {
          onClick(event);
        }
      }, [trackInteractions, onClick, title, actions, trackingContext]);

      return (
        <Card
          ref={ref}
          padding="lg"
          radius="md"
          withBorder
          {...props}
          onClick={handleCardClick}
        >
          {loading ? (
            loadingContent
          ) : error ? (
            <>
              {headerContent}
              {errorContent}
            </>
          ) : isEmpty && emptyState ? (
            <>
              {headerContent}
              {emptyStateContent}
            </>
          ) : (
            <>
              {headerContent}
              {children}
            </>
          )}
        </Card>
      );
    }
  )
);

GenericCard.displayName = 'GenericCard';

// Specialized card variants
export const MetricCard = React.memo<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: number;
  loading?: boolean;
  onClick?: () => void;
}>(({ title, value, subtitle, icon, color = 'blue', trend, loading, onClick }) => {
  const trendColor = trend && trend > 0 ? 'green' : trend && trend < 0 ? 'red' : 'gray';
  const trendIcon = trend && trend > 0 ? '↗' : trend && trend < 0 ? '↘' : '';

  return (
    <GenericCard
      loading={loading}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
      trackInteractions={!!onClick}
      trackingContext={{ cardType: 'metric', title }}
    >
      <Group justify="space-between" align="flex-start">
        <div style={{ flex: 1 }}>
          <Text size="sm" c="dimmed" fw={500} mb={4}>
            {title}
          </Text>
          <Text size="xl" fw={700} c={color} mb={2}>
            {loading ? '...' : value}
          </Text>
          {subtitle && (
            <Text size="xs" c="dimmed">
              {subtitle}
            </Text>
          )}
          {trend !== undefined && (
            <Group gap="xs" mt="xs">
              <Text size="xs" c={trendColor} fw={500}>
                {trendIcon} {Math.abs(trend)}%
              </Text>
              <Text size="xs" c="dimmed">vs last period</Text>
            </Group>
          )}
        </div>
        {icon && (
          <div style={{ 
            padding: '8px', 
            borderRadius: 'var(--mantine-radius-md)',
            backgroundColor: `var(--mantine-color-${color}-light)`,
            color: `var(--mantine-color-${color}-6)`
          }}>
            {icon}
          </div>
        )}
      </Group>
    </GenericCard>
  );
});

MetricCard.displayName = 'MetricCard';

export const StatusCard = React.memo<{
  title: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: string;
  actions?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}>(({ title, status, message, details, actions, dismissible, onDismiss }) => {
  const statusColors = {
    success: 'green',
    warning: 'yellow', 
    error: 'red',
    info: 'blue'
  };

  return (
    <GenericCard
      title={title}
      actions={actions}
      dismissible={dismissible}
      onDismiss={onDismiss}
      trackInteractions={true}
      trackingContext={{ cardType: 'status', status }}
      style={{ 
        borderLeft: `4px solid var(--mantine-color-${statusColors[status]}-6)` 
      }}
    >
      <Text size="sm" mb={details ? 'xs' : 0}>
        {message}
      </Text>
      {details && (
        <Text size="xs" c="dimmed">
          {details}
        </Text>
      )}
    </GenericCard>
  );
});

StatusCard.displayName = 'StatusCard';