// src/hooks/useNotifications.ts
// Notifications custom hook
// Following atomic design principle: Custom Hooks manage business logic and local state

import { useCallback } from 'react';
import { showNotification, hideNotification } from '@mantine/notifications';
import { debugService } from '../services/debugService';

interface NotificationOptions {
  title: string;
  message: string;
  color?: string;
  autoClose?: number | false;
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  icon?: React.ReactNode;
  id?: string;
}

export const useNotifications = () => {
  const showSuccess = useCallback((options: Omit<NotificationOptions, 'color'>) => {
    showNotification({
      ...options,
      color: 'green',
      autoClose: options.autoClose ?? 4000,
      position: options.position ?? 'top-right',
    });
  }, []);
  
  const showError = useCallback((options: Omit<NotificationOptions, 'color'>) => {
    showNotification({
      ...options,
      color: 'red',
      autoClose: options.autoClose ?? 6000,
      position: options.position ?? 'top-right',
    });
  }, []);
  
  const showWarning = useCallback((options: Omit<NotificationOptions, 'color'>) => {
    showNotification({
      ...options,
      color: 'yellow',
      autoClose: options.autoClose ?? 5000,
      position: options.position ?? 'top-right',
    });
  }, []);
  
  const showInfo = useCallback((options: Omit<NotificationOptions, 'color'>) => {
    showNotification({
      ...options,
      color: 'blue',
      autoClose: options.autoClose ?? 4000,
      position: options.position ?? 'top-right',
    });
  }, []);
  
  const showDebug = useCallback((options: Omit<NotificationOptions, 'color'>) => {
    if (debugService.isDebugMode()) {
      showNotification({
        ...options,
        color: 'orange',
        autoClose: options.autoClose ?? 3000,
        position: options.position ?? 'top-right',
      });
    }
  }, []);
  
  const hide = useCallback((id: string) => {
    hideNotification(id);
  }, []);
  
  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showDebug,
    hide,
    show: showNotification, // Raw access for custom notifications
  };
};