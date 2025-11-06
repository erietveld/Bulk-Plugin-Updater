// src/client/components/debug/DebugPanel.tsx
// Debug panel with PURE TanStack Query DevTools - Only visible in debug mode
// SIMPLIFIED: Removed custom tabs, showing native DevTools directly

import React, { useState } from 'react';
import {
  ActionIcon,
  Drawer,
  Stack,
  Title,
  Badge,
  Group
} from '@mantine/core';
import { IconSettings, IconX } from '@tabler/icons-react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { logger } from '../../../monitoring/logger';

interface DebugPanelProps {
  className?: string;
}

/**
 * Debug Panel Component - Only renders when sn_debug=true
 * SIMPLIFIED: Pure TanStack Query DevTools without custom tabs
 */
export const DebugPanel: React.FC<DebugPanelProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Only render in debug mode
  if (!logger.isDebugEnabled()) {
    return null;
  }

  return (
    <>
      {/* Floating Settings Wheel - Bottom Right */}
      <div
        className={className}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000
        }}
      >
        <ActionIcon
          size="xl"
          variant="filled"
          color="blue"
          onClick={() => setIsOpen(true)}
          style={{
            borderRadius: '50%',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <IconSettings 
            size={24} 
            style={{
              animation: isOpen ? 'none' : 'spin 4s linear infinite',
            }}
          />
        </ActionIcon>
      </div>

      {/* Debug Tools Drawer - PURE DevTools */}
      <Drawer
        opened={isOpen}
        onClose={() => setIsOpen(false)}
        position="right"
        size="xl"
        title={
          <Group justify="space-between" w="100%">
            <Group gap="md">
              <IconSettings size={20} />
              <Title order={3}>TanStack Query DevTools</Title>
              <Badge color="green" variant="light" size="sm">
                Active
              </Badge>
            </Group>
            <ActionIcon
              variant="subtle"
              onClick={() => setIsOpen(false)}
            >
              <IconX size={16} />
            </ActionIcon>
          </Group>
        }
        overlayProps={{
          backgroundOpacity: 0.3,
          blur: 2
        }}
        styles={{
          content: {
            background: 'var(--mantine-color-gray-0)',
          },
          header: {
            borderBottom: '1px solid var(--mantine-color-gray-3)',
            padding: '1rem',
          },
          body: {
            padding: 0,
          }
        }}
      >
        {/* PURE TanStack Query DevTools - Full Height, No Containers */}
        <div style={{ height: '100%', width: '100%' }}>
          <ReactQueryDevtools 
            initialIsOpen={true}
          />
        </div>
      </Drawer>

      {/* CSS for spinning animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default DebugPanel;