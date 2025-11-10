// src/components/debug/DevelopmentDebugPanel.tsx
// Development debug panel component - UI RENDERING ONLY
// Following atomic design principle: React Components handle UI rendering only

import React, { useMemo } from 'react';
import {
  Paper,
  Group,
  Title,
  Badge,
  Text,
  Stack
} from '@mantine/core';
import { IconBug, IconChartBar, IconAlertTriangle } from '@tabler/icons-react';
import { usePerformanceTracking } from '../../hooks/usePerformanceTracking';
import { debugService } from '../../services/debugService';

export const DevelopmentDebugPanel: React.FC = React.memo(() => {
  // Business logic from custom hooks
  const { metrics, getRecentAlerts } = usePerformanceTracking();
  
  const recentAlerts = useMemo(() => getRecentAlerts(5), [getRecentAlerts]);

  const validationSummary = useMemo(() => {
    // Mock validation summary since we don't have the full validation results here
    return {
      totalThemes: 6,
      averageScore: 85,
      validThemes: 6,
      themesWithWarnings: 2
    };
  }, []);

  if (!debugService.isDebugMode()) return null;

  return (
    <Paper p="md" shadow="sm" mb="md" style={{ backgroundColor: 'rgba(255, 248, 220, 0.9)', border: '2px solid #ffd700' }}>
      <Group justify="space-between" mb="sm">
        <Group gap="xs">
          <IconBug size={20} color="#ff6b35" />
          <Title order={4} c="orange">Development Debug Panel</Title>
          <Badge size="sm" variant="light" color="orange">sn_debug=true</Badge>
        </Group>
        <Group gap="xs">
          <IconChartBar size={16} />
          <Text size="sm" c="dimmed">Real-time Monitoring</Text>
        </Group>
      </Group>

      <Group gap="xl" align="flex-start">
        {/* Performance Metrics */}
        <div>
          <Text fw={600} size="sm" mb="xs">Performance</Text>
          <Stack gap="xs">
            <Text size="xs">Cache Hit Ratio: {Math.round(metrics.cacheHits / Math.max(metrics.cacheHits + metrics.cacheMisses, 1) * 100)}%</Text>
            <Text size="xs">Avg Switch Time: {Math.round(metrics.averageSwitchTime)}ms</Text>
            <Text size="xs">Memory Usage: ~{Math.round(metrics.memoryUsage)}KB</Text>
            <Text size="xs">Theme Switches: {metrics.themeSwitchCount}</Text>
          </Stack>
        </div>

        {/* Validation Summary */}
        <div>
          <Text fw={600} size="sm" mb="xs">Theme Validation</Text>
          <Stack gap="xs">
            <Text size="xs">Themes Analyzed: {validationSummary.totalThemes}</Text>
            <Text size="xs">Average Score: {validationSummary.averageScore}/100</Text>
            <Text size="xs">Valid Themes: {validationSummary.validThemes}/{validationSummary.totalThemes}</Text>
            <Text size="xs">With Warnings: {validationSummary.themesWithWarnings}</Text>
          </Stack>
        </div>

        {/* Recent Alerts */}
        <div style={{ minWidth: '300px' }}>
          <Text fw={600} size="sm" mb="xs">Recent Alerts ({recentAlerts.length})</Text>
          <Stack gap="xs">
            {recentAlerts.length > 0 ? recentAlerts.map((alert, index) => (
              <Group key={index} gap="xs">
                <IconAlertTriangle 
                  size={12} 
                  color={alert.severity === 'error' ? '#ff4757' : alert.severity === 'warning' ? '#ffa502' : '#3742fa'} 
                />
                <Text size="xs" style={{ 
                  color: alert.severity === 'error' ? '#ff4757' : alert.severity === 'warning' ? '#ffa502' : '#3742fa' 
                }}>
                  {alert.message}
                </Text>
              </Group>
            )) : (
              <Text size="xs" c="dimmed">No recent alerts</Text>
            )}
          </Stack>
        </div>
      </Group>
    </Paper>
  );
});