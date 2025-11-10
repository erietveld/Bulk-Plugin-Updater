// src/client/components/mantine/SelectedItemsOverlay.tsx
// Selected Items Overlay component for detailed view of selected applications
// Styled to match expanded row appearance with deselection functionality
// ARCHITECTURE COMPLIANT: Pure UI component with selection integration
// FIXED: Proper Mantine color props that respect dark/light theme, no hardcoded styles
// FIXED: Scrollbar visibility - increased height and padding for complete description visibility
// FIXED: TypeScript return types for ReactNode compatibility

import React from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Card,
  ActionIcon,
  Badge,
  ScrollArea,
  Divider,
  Tooltip,
  useMantineTheme,
  useMantineColorScheme,
  alpha
} from '@mantine/core';
import {
  IconX,
  IconArrowRight
} from '@tabler/icons-react';

import type { useStoreUpdatesSelection } from '../../../hooks/useStoreUpdatesSelection';

interface SelectedItemsOverlayProps {
  opened: boolean;
  onClose: () => void;
  selectionHook: ReturnType<typeof useStoreUpdatesSelection>;
}

// Helper to get selected items with details
const getSelectedItemsWithDetails = (selectionHook: ReturnType<typeof useStoreUpdatesSelection>) => {
  const selectedIds = selectionHook.selection.selectedIds;
  return selectionHook.selection.selectedRecords.filter(item => selectedIds.includes(item.sys_id));
};

export const SelectedItemsOverlay: React.FC<SelectedItemsOverlayProps> = ({
  opened,
  onClose,
  selectionHook
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  
  const selectedItems = getSelectedItemsWithDetails(selectionHook);
  const totalSelected = selectedItems.length;

  // Handle deselection
  const handleDeselect = (itemId: string) => {
    selectionHook.selectRecord(
      selectedItems.find(item => item.sys_id === itemId)!,
      'toggle'
    );
    
    // Auto-close overlay if all items are deselected
    if (selectionHook.stats.totalSelected === 1) {
      onClose();
    }
  };

  // Helper to format version information - FIXED: Return type for ReactNode compatibility
  const formatVersionInfo = (item: any): React.ReactNode => {
    const currentVersion = item['application.version'] || item.application_version || item.version || 'Unknown';
    const latestVersion = item['available_version.version'] || item.available_version_version || item.latest_version || currentVersion;
    
    if (currentVersion === latestVersion) {
      return <Text size="sm">Version: {String(currentVersion)}</Text>;
    }
    
    return (
      <Group gap="xs" align="center">
        <Text size="sm" c="dimmed">Installed: {String(currentVersion)}</Text>
        <IconArrowRight size={12} />
        <Text size="sm" fw={500} c="blue">Update: {String(latestVersion)}</Text>
      </Group>
    );
  };

  // Helper to get update level badge
  const getUpdateLevelBadge = (item: any) => {
    // Use the level field from the data
    const level = item.level || 'patch';
    
    if (level === 'major') {
      return <Badge size="sm" color="red" variant="light">Major</Badge>;
    } else if (level === 'minor') {
      return <Badge size="sm" color="yellow" variant="light">Minor</Badge>;
    } else {
      return <Badge size="sm" color="green" variant="light">Patch</Badge>;
    }
  };

  // FIXED: Get proper expanded row background color (same as DataGrid)
  const getExpandedBackgroundColor = () => {
    return colorScheme === 'dark' 
      ? alpha(theme.colors.blue[8], 0.15)
      : alpha(theme.colors.blue[1], 0.3);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group justify="space-between" w="100%">
          <Text fw={600} size="lg">
            Selected Applications ({totalSelected} items)
          </Text>
        </Group>
      }
      size="lg"
      padding="md"
      overlayProps={{
        backgroundOpacity: 0.7,
        blur: 3
      }}
      styles={{
        content: {
          maxHeight: '85vh'
        }
      }}
    >
      {/* FIXED: Further increased ScrollArea height and bottom padding for complete description visibility */}
      <ScrollArea style={{ maxHeight: 'calc(85vh - 140px)' }} scrollbarSize={8}>
        <Stack gap="sm" pb="3xl">
          {selectedItems.map((item) => (
            <Card
              key={item.sys_id}
              withBorder
              padding="md"
              radius="md"
              style={{
                // FIXED: Use same background color as expanded rows in DataGrid
                backgroundColor: getExpandedBackgroundColor(),
                borderRadius: '4px'
              }}
            >
              <Group justify="space-between" align="flex-start" mb="sm">
                <Group gap="sm" align="center">
                  <Text fw={600} size="md">
                    {String(item['application.name'] || item.application_name || item.display_name || item.name || 'Unknown Application')}
                  </Text>
                  {getUpdateLevelBadge(item)}
                </Group>
                
                <Tooltip label="Remove from selection">
                  <ActionIcon
                    variant="light"
                    size="sm"
                    onClick={() => handleDeselect(item.sys_id)}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                </Tooltip>
              </Group>

              <Stack gap="sm">
                {/* Version Information */}
                <Stack gap={2}>
                  <Text size="xs" fw={500} c="dimmed">Version Information</Text>
                  {formatVersionInfo(item)}
                </Stack>

                {/* Short Description */}
                {(item['available_version.short_description'] || item.available_version_short_description || item['application.short_description'] || item.application_short_description || item.short_description || item.description) && (
                  <Stack gap={2}>
                    <Text size="xs" fw={500} c="dimmed">Description</Text>
                    <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {String(item['available_version.short_description'] || item.available_version_short_description || item['application.short_description'] || item.application_short_description || item.short_description || item.description)}
                    </Text>
                  </Stack>
                )}

                {/* Additional Details */}
                {((item.u_category || item.category) || (item.u_publisher || item.publisher)) && (
                  <Group gap="md" mt="xs">
                    {(item.u_category || item.category) && (
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">Category:</Text>
                        <Text size="xs">{String(item.u_category || item.category)}</Text>
                      </Group>
                    )}
                    
                    {(item.u_publisher || item.publisher) && (
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">Publisher:</Text>
                        <Text size="xs">{String(item.u_publisher || item.publisher)}</Text>
                      </Group>
                    )}
                  </Group>
                )}
              </Stack>
            </Card>
          ))}

          {selectedItems.length === 0 && (
            <Card withBorder padding="xl" ta="center">
              <Text c="dimmed">No items selected</Text>
            </Card>
          )}
        </Stack>
      </ScrollArea>

      {/* Summary Footer */}
      {totalSelected > 0 && (
        <>
          <Divider my="md" />
          <Group justify="space-between" align="center">
            <Text size="sm" c="dimmed">
              {totalSelected} application{totalSelected !== 1 ? 's' : ''} selected
            </Text>
            
            <Group gap="xs">
              {Object.entries(selectionHook.stats.levelBreakdown).map(([level, count]) => (
                <Badge
                  key={level}
                  size="sm"
                  color={level === 'major' ? 'red' : level === 'minor' ? 'yellow' : 'green'}
                  variant="light"
                >
                  {Number(count || 0)} {level}
                </Badge>
              ))}
            </Group>
          </Group>
        </>
      )}
    </Modal>
  );
};

export default SelectedItemsOverlay;