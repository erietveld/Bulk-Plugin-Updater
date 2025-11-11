// src/components/navigation/NavigationHeader.tsx
// Navigation header component - SIMPLIFIED to let Mantine handle ALL theming
// Following Architecture.md: Let Mantine handle theming automatically
// UPDATED: Removed shadow to blend seamlessly with dashboard content

import React, { useCallback, useMemo } from 'react';
import {
  Paper,
  Group,
  Title,
  Text,
  Button,
  ActionIcon,
  Menu,
  Badge
} from '@mantine/core';
import {
  IconUser,
  IconCalendar,
  IconRefresh,
  IconMenu2,
  IconDatabase,
  IconCode,
  IconReportAnalytics,
  IconExternalLink
} from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { ColorSchemeToggle } from '../theme/ColorSchemeToggle';
import { logger, createLogContext } from '../../monitoring/logger';
import { useEnhancedUserContext } from '../../hooks/useUserContext';

// Check if debug mode is enabled
const isDebugMode = () => {
  return new URLSearchParams(window.location.search).get('sn_debug') === 'true';
};

export const NavigationHeader: React.FC = React.memo(() => {
  const userContext = useEnhancedUserContext();
  
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  const currentUser = useMemo(() => {
    // Try to get user from ServiceNow context (Pattern 2A - immediate data)
    const snUser = (window as any).g_user;
    const snImmediateData = (window as any).snImmediateData;
    
    if (snImmediateData?.userContext) {
      return {
        name: snImmediateData.userContext.display_name || 'User',
        firstName: snImmediateData.userContext.first_name || 'User'
      };
    }
    
    return snUser ? {
      name: snUser.getDisplayName?.() || snUser.userName || 'User',
      firstName: snUser.firstName || 'User'
    } : {
      name: 'ServiceNow User',
      firstName: 'User'
    };
  }, []);

  const handleNavigation = useCallback((url: string, label: string) => {
    logger.info('Navigation link clicked', createLogContext({
      destination: label,
      url,
      user: currentUser.name
    }));
    
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [currentUser.name]);

  const handleRefresh = useCallback(() => {
    logger.info('Dashboard refresh requested', createLogContext({
      user: currentUser.name,
      timestamp: new Date().toISOString()
    }));
    
    showNotification({
      title: 'Refreshing Dashboard',
      message: 'Updating store updates data...',
      icon: <IconRefresh size={16} />,
      autoClose: 3000
    });
    
    window.location.reload();
  }, [currentUser.name]);

  return (
    <Paper 
      p="md" 
      mb="xs"
      radius="md"
    >
      <Group justify="space-between" align="center">
        {/* Welcome Section */}
        <Group gap="md">
          <div>
            <Group gap="xs" align="center">
              <IconUser size={20} />
              <Title order={3}>
                Welcome back, {currentUser.firstName}!
              </Title>
              {isDebugMode() && (
                <Badge size="sm" variant="light" color="orange">DEBUG</Badge>
              )}
            </Group>
            <Group gap="xs" align="center" mt={4}>
              <IconCalendar size={16} />
              <Text size="sm" c="dimmed">
                {currentDate}
              </Text>
            </Group>
          </div>
        </Group>

        {/* Navigation Menu */}
        <Group gap="md">
          <ColorSchemeToggle />
          
          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>

          <Menu shadow="md" width={280} position="bottom-end">
            <Menu.Target>
              <ActionIcon
                variant="light"
                size="lg"
                aria-label="Navigation menu"
              >
                <IconMenu2 size={20} />
              </ActionIcon>
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Label>ServiceNow Direct Links</Menu.Label>
              
              <Menu.Item
                leftSection={<IconDatabase size={16} />}
                rightSection={<IconExternalLink size={14} />}
                onClick={() => handleNavigation(
                  '/x_snc_store_upda_1_store_updates_list.do?sysparm_clear_stack=true',
                  'Store Updates Table'
                )}
              >
                <div>
                  <Text fw={500}>Store Updates Table</Text>
                  <Text size="xs" c="dimmed">View remote table data directly</Text>
                </div>
              </Menu.Item>

              <Menu.Item
                leftSection={<IconCode size={16} />}
                rightSection={<IconExternalLink size={14} />}
                onClick={() => handleNavigation(
                  '/sys_script_include_list.do?sysparm_query=name=StoreUpdatesProcessor^api_nameLIKEx_snc_store_upda_1',
                  'Script Include'
                )}
              >
                <div>
                  <Text fw={500}>Store Updates Processor</Text>
                  <Text size="xs" c="dimmed">Script Include for data processing</Text>
                </div>
              </Menu.Item>

              <Menu.Item
                leftSection={<IconReportAnalytics size={16} />}
                rightSection={<IconExternalLink size={14} />}
                onClick={() => handleNavigation(
                  '/sys_log_list.do?sysparm_query=sourceLIKEStoreUpdatesProcessor^ORmessageLIKEstore_updates^ORDERBYDESCsys_created_on',
                  'System Log'
                )}
              >
                <div>
                  <Text fw={500}>System Log</Text>
                  <Text size="xs" c="dimmed">View application logs and errors</Text>
                </div>
              </Menu.Item>

              <Menu.Divider />
              
              <Menu.Label>System Info</Menu.Label>
              
              <Menu.Item disabled>
                <Group justify="space-between">
                  <Text size="xs">Instance Version</Text>
                  <Badge size="xs" variant="light">{userContext.system.instanceVersion || 'Unknown'}</Badge>
                </Group>
              </Menu.Item>
              
              <Menu.Item disabled>
                <Group justify="space-between">
                  <Text size="xs">Patch Level</Text>
                  <Badge size="xs" variant="light">{userContext.system.instancePatchlevel || 'Unknown'}</Badge>
                </Group>
              </Menu.Item>

              <Menu.Divider />
              
              <Menu.Label>Application Info</Menu.Label>
              
              <Menu.Item disabled>
                <Group justify="space-between">
                  <Text size="xs">Version</Text>
                  <Badge size="xs" variant="light">1.0.0</Badge>
                </Group>
              </Menu.Item>
              
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>
    </Paper>
  );
});