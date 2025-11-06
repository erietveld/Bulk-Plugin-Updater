// src/hooks/useNotifications.ts
// Simple Mantine notifications hook
// Following Architecture.md patterns for client-state management

import { notifications } from '@mantine/notifications';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  type: NotificationType;
  message: string;
  title?: string;
  autoClose?: number | false;
}

/**
 * Simple notifications hook using Mantine notifications
 * Provides consistent notification styling and behavior
 */
export const useNotifications = () => {
  const addNotification = (options: NotificationOptions) => {
    const { type, message, title, autoClose = 5000 } = options;

    const baseConfig = {
      title,
      message,
      autoClose,
      withCloseButton: true,
    };

    switch (type) {
      case 'success':
        notifications.show({
          ...baseConfig,
          color: 'green',
        });
        break;

      case 'error':
        notifications.show({
          ...baseConfig,
          color: 'red',
          autoClose: false, // Keep error notifications visible
        });
        break;

      case 'warning':
        notifications.show({
          ...baseConfig,
          color: 'orange',
        });
        break;

      case 'info':
      default:
        notifications.show({
          ...baseConfig,
          color: 'blue',
        });
        break;
    }
  };

  const clearNotifications = () => {
    notifications.clean();
  };

  return {
    addNotification,
    clearNotifications
  };
};