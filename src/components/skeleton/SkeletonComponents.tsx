// src/components/skeleton/SkeletonComponents.tsx
// Skeleton loading components for progressive loading experience
// Following Pattern 2A + C: Immediate structure with progressive content loading

import React from 'react';
import {
  Box,
  Stack,
  Group,
  Card,
  Grid,
  Skeleton,
  Table,
  useMantineColorScheme
} from '@mantine/core';

// Stats Card Skeleton - shows immediate structure while data loads
export const StatsCardSkeleton: React.FC = () => {
  return (
    <Card padding="sm" withBorder>
      <Group justify="space-between" w="100%">
        <div style={{ flex: 1 }}>
          <Skeleton height={14} width="60%" mb="xs" />
          <Skeleton height={32} width="40%" mb="xs" />
          <Skeleton height={12} width="80%" />
        </div>
        <Skeleton height={32} width={32} radius="sm" />
      </Group>
    </Card>
  );
};

// Table Row Skeleton - progressive table loading
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 6 }) => {
  return (
    <Table.Tr>
      {Array.from({ length: columns }).map((_, index) => (
        <Table.Td key={index}>
          <Skeleton height={16} width={index === 0 ? "100%" : "60%"} />
        </Table.Td>
      ))}
    </Table.Tr>
  );
};

// Data Grid Skeleton - shows table structure immediately
export const DataGridSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 10, 
  columns = 6 
}) => {
  const { colorScheme } = useMantineColorScheme();
  
  return (
    <Card padding="lg" radius="md" withBorder>
      {/* Table Header Skeleton */}
      <Box mb="md">
        <Group justify="space-between" mb="sm">
          <Skeleton height={16} width="30%" />
          <Group gap="xs">
            <Skeleton height={32} width={120} />
            <Skeleton height={32} width={32} radius="sm" />
          </Group>
        </Group>
      </Box>
      
      {/* Table Content Skeleton */}
      <Table striped={colorScheme === 'light'} highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {Array.from({ length: columns }).map((_, index) => (
              <Table.Th key={index}>
                <Skeleton height={14} width={index === 0 ? "100%" : "70%"} />
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <TableRowSkeleton key={index} columns={columns} />
          ))}
        </Table.Tbody>
      </Table>
      
      {/* Pagination Skeleton */}
      <Group justify="space-between" mt="md">
        <Skeleton height={14} width="30%" />
        <Group gap="xs">
          <Skeleton height={32} width={32} radius="sm" />
          <Skeleton height={32} width={60} />
          <Skeleton height={32} width={32} radius="sm" />
        </Group>
      </Group>
    </Card>
  );
};

// Actions Section Skeleton - immediate action structure
export const ActionsSkeleton: React.FC = () => {
  return (
    <Box w="100%">
      <Stack gap="sm">
        {/* Selection Summary Skeleton */}
        <Group gap="xs" align="center">
          <Skeleton height={14} width="20%" />
          <Skeleton height={14} width="40%" />
          <Skeleton height={24} width={60} />
        </Group>
        
        {/* Action Buttons Skeleton */}
        <Group gap="sm">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} height={36} width={120} radius="md" />
          ))}
        </Group>
      </Stack>
    </Box>
  );
};

// Dashboard Stats Grid Skeleton - immediate stats structure
export const StatsGridSkeleton: React.FC = () => {
  return (
    <Grid gutter="xs" w="100%">
      {Array.from({ length: 4 }).map((_, index) => (
        <Grid.Col key={index} span={{ base: 12, sm: 6, lg: 3 }}>
          <StatsCardSkeleton />
        </Grid.Col>
      ))}
    </Grid>
  );
};

// Header Skeleton - immediate header structure
export const HeaderSkeleton: React.FC = () => {
  return (
    <Card padding="md" radius="md" withBorder w="100%">
      <Group justify="space-between" align="center" w="100%">
        <div style={{ flex: 1 }}>
          <Group gap="xs" mb="xs">
            <Skeleton height={24} width={24} radius="sm" />
            <Skeleton height={28} width="60%" />
          </Group>
          <Skeleton height={20} width="40%" mb="xs" />
          <Skeleton height={14} width="80%" />
        </div>
        <Group gap="xs">
          <Skeleton height={36} width={36} radius="sm" />
          <Skeleton height={36} width={36} radius="sm" />
          <Skeleton height={36} width={36} radius="sm" />
        </Group>
      </Group>
    </Card>
  );
};

// Progressive Dashboard Skeleton - shows complete structure immediately
export const DashboardSkeleton: React.FC = () => {
  return (
    <Box py="sm" w="100%" maw="100%">
      <Stack gap="xs" w="100%">
        <HeaderSkeleton />
        <StatsGridSkeleton />
        
        <Card padding="lg" radius="md" withBorder w="100%">
          <Group justify="space-between" mb="xs" w="100%">
            <Group gap="xs">
              <Skeleton height={36} width={120} />
              <Skeleton height={36} width={36} radius="sm" />
              <Skeleton height={36} width={36} radius="sm" />
            </Group>
            <ActionsSkeleton />
          </Group>
        </Card>
        
        <DataGridSkeleton />
      </Stack>
    </Box>
  );
};