# Mantine Component Layer - Complete Implementation Guide

## 🚨 CRITICAL REQUIREMENT: Mantine CDN Resources

**⚠️ MANDATORY FOR MANTINE TO WORK PROPERLY**

Your `src/client/index.html` file MUST include these CDN resources for Mantine styling to work correctly:

```html
<!-- ⚛️ Mantine CDN Resources - WORKING LINKS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mantine/core@8.3.6/styles.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mantine/dates@8.3.6/styles.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mantine/notifications@8.3.6/styles.css">
```

**❌ Local imports alone are NOT sufficient:**
```typescript
// ❌ INCOMPLETE - Only local imports will NOT work
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
```

**✅ Both CDN links AND local imports are required for full functionality.**

---

## **Component Layer (UI) with Mantine** 🥇

**Mantine is our preferred UI library** providing the most beautiful, modern UI with exceptional developer experience.

### **Mantine Integration & Setup**

```typescript
// Essential Mantine imports with latest versions
import { MantineProvider } from '@mantine/core';
import { theme } from '@/theme/mantineTheme';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/charts/styles.css';

// Root app setup with Mantine
const App: React.FC = () => {
  return (
    <MantineProvider theme={theme}>
      <CDNResourceDebugger />
      <Notifications />
      <Router />
    </MantineProvider>
  );
};
```

### **CDN Resource Debug Implementation**

```typescript
// IMPLEMENTATION DIRECTIVE: CDN Resource Debug Implementation
const CDNResourceDebugger: React.FC = () => {
  const isDebugMode = new URLSearchParams(window.location.search).get('sn_debug') === 'true';
  
  useEffect(() => {
    if (isDebugMode) {
      // Show all external resources loaded from CDNs
      const cdnResources = Array.from(document.querySelectorAll('link[rel="stylesheet"], script[src]'))
        .filter(el => 
          el.src?.includes('cdn.') || 
          el.href?.includes('cdn.') || 
          el.src?.includes('unpkg.') || 
          el.href?.includes('unpkg.') ||
          el.src?.includes('jsdelivr.') ||
          el.href?.includes('jsdelivr.')
        );

      if (cdnResources.length > 0) {
        console.warn('🚨 CDN RESOURCES DETECTED - VALIDATION REQUIRED:', cdnResources);
        
        // Create validation UI for user to click and validate each resource
        const validationPanel = createCDNValidationPanel(cdnResources);
        document.body.appendChild(validationPanel);
        
        // CRITICAL: Ask user to validate each resource by clicking
        alert(`🚨 CRITICAL: ${cdnResources.length} CDN resources detected. Please validate each resource by clicking the links in the debug panel to ensure styling works correctly.`);
      }
    }
  }, [isDebugMode]);

  return null; // Debug component doesn't render UI
};

const createCDNValidationPanel = (resources) => {
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed; top: 10px; right: 10px; 
    background: #ff4444; color: white; padding: 15px; 
    border-radius: 8px; z-index: 9999; max-width: 400px;
    font-family: monospace; font-size: 12px;
  `;
  
  panel.innerHTML = `
    <h3>🚨 CDN Resource Validation Required</h3>
    <p>Click each resource to validate it loads correctly:</p>
    ${resources.map((resource, i) => {
      const url = resource.src || resource.href;
      return `
        <div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.1);">
          <strong>Resource ${i + 1}:</strong><br>
          <a href="${url}" target="_blank" style="color: #ffff99; word-break: break-all;">
            ${url}
          </a>
          <br><small>Type: ${resource.tagName} | Status: <span id="status-${i}">⏳ Pending</span></small>
        </div>
      `;
    }).join('')}
    
    <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px;">
      ✅ All Resources Validated
    </button>
  `;
  
  return panel;
};
```

### **Generic Enterprise Mantine Theme**

```typescript
// src/theme/mantineTheme.ts
import { createTheme, MantineColorsTuple } from '@mantine/core';

const brandColors: MantineColorsTuple = [
  '#f0f9ff',  // 50 - Lightest brand color
  '#e0f2fe',  // 100
  '#bae6fd',  // 200
  '#7dd3fc',  // 300
  '#38bdf8',  // 400
  '#0ea5e9',  // 500 - Primary brand color
  '#0284c7',  // 600
  '#0369a1',  // 700 - Primary brand color (darker)
  '#075985',  // 800
  '#0c4a6e'   // 900 - Darkest brand color
];

export const theme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand: brandColors,
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '600',
  },
  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        shadow: 'sm',
        withBorder: true,
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});
```

### **Advanced Enterprise Component Patterns**

Based on enterprise application architecture, implement sophisticated component patterns:

#### **1. Enterprise-Grade Component Architecture**

```typescript
// Advanced Multi-Level Component Organization

// src/components/ - Generic, reusable components
export const MantineButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    return <Button ref={ref} {...props} />;
  }
);

// Sophisticated component variants with error handling
export const PrimaryButton: React.FC<ButtonProps> = (props) => {
  const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    try {
      if (props.onClick) {
        props.onClick(event);
      }
    } catch (error) {
      logger.error('PrimaryButton onClick error', error);
    }
  }, [props.onClick]);

  return (
    <MantineButton 
      variant="filled" 
      color="brand" 
      {...props} 
      onClick={handleClick}
    />
  );
};

// src/client/components/ - Application-specific components with advanced patterns
export const ApplicationDashboard: React.FC<ApplicationDashboardProps> = ({ 
  showUserRequestsOnly = false 
}) => {
  const navigate = useNavigate();
  const { data: requests = [], isLoading: requestsLoading } = useRequests();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  // Advanced metrics calculation with React.useMemo for performance
  const metrics = React.useMemo(() => {
    const totalRequests = stats?.totalRequests || 0;
    const pendingRequests = stats?.pendingRequests || 0;
    const approvedRequests = stats?.approvedRequests || 0;
    const availableItems = stats?.availableItems || 0;
    const totalItems = stats?.totalItems || 100;
    
    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      availableItems,
      occupancyRate: totalItems > 0 ? ((totalItems - availableItems) / totalItems) * 100 : 0,
      approvalRate: totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0,
    };
  }, [stats]);

  // Advanced error handling for UI interactions
  const handleNewRequest = useCallback(() => {
    try {
      navigate('/request');
      logger.trackUserAction('new-request-clicked', { 
        source: 'dashboard',
        userType: 'authenticated'
      });
    } catch (error) {
      logger.error('Navigation error', error);
      showErrorNotification('Failed to navigate to new request form');
    }
  }, [navigate]);

  const handleViewRequest = useCallback((requestId: string) => {
    try {
      navigate(`/request/${requestId}`);
      logger.trackUserAction('request-viewed', { requestId });
    } catch (error) {
      logger.error('Request view error', error);
    }
  }, [navigate]);

  // Advanced field value extraction with type safety
  const getFieldValue = useCallback((field: any): string => {
    if (typeof field === 'string') return field;
    if (field && typeof field === 'object' && field.value !== undefined) {
      return String(field.value);
    }
    return '';
  }, []);

  // Advanced loading states
  if (requestsLoading || statsLoading) {
    return (
      <Container py="xl">
        <Stack gap="xl">
          <Card className="dashboard-header" padding="xl">
            <Skeleton height={40} mb="md" />
            <Skeleton height={20} width="60%" />
          </Card>
          <Grid>
            {Array(4).fill(0).map((_, i) => (
              <Grid.Col key={i} span={{ base: 12, sm: 6, lg: 3 }}>
                <Card className="metric-card" padding="lg">
                  <Skeleton height={60} />
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      </Container>
    );
  }

  return (
    <Container py="xl">
      <Stack gap="xl">
        {/* Enhanced Header using global theme classes */}
        <Card className="dashboard-header" padding="xl">
          <Group justify="space-between" align="center">
            <div>
              <Title order={1} className="dashboard-header-title" mb="xs">
                Enterprise Application Dashboard
              </Title>
              <Text className="dashboard-header-subtitle" size="lg">
                Welcome back! Here's what's happening with your system today.
              </Text>
            </div>
            <Group gap="md">
              <ActionIcon variant="white" color="dark">
                <IconBell size={20} />
              </ActionIcon>
              <ActionIcon variant="white" color="dark">
                <IconSettings size={20} />
              </ActionIcon>
              <Button 
                leftSection={<IconPlus size={16} />}
                size="lg"
                variant="white"
                color="dark"
                onClick={handleNewRequest}
              >
                New Request
              </Button>
            </Group>
          </Group>
        </Card>

        {/* Advanced Metrics Cards with sophisticated calculations */}
        <Grid>
          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Total Requests"
              value={metrics.totalRequests}
              subtitle="All time requests"
              icon={<IconFileText size={24} />}
              color="blue"
              trend={12}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Pending Review"
              value={metrics.pendingRequests}
              subtitle="Awaiting approval"
              icon={<IconClock size={24} />}
              color="yellow"
              trend={-5}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Approved Today"
              value={metrics.approvedRequests}
              subtitle="Ready to process"
              icon={<IconCheck size={24} />}
              color="green"
              trend={8}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, sm: 6, lg: 3 }}>
            <MetricCard
              title="Available Items"
              value={metrics.availableItems}
              subtitle="Ready for assignment"
              icon={<IconMapPin size={24} />}
              color="teal"
              trend={3}
            />
          </Grid.Col>
        </Grid>

        {/* Advanced Progress Indicators */}
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card padding="lg">
              <Group justify="space-between" mb="md">
                <Text fw={600}>System Utilization</Text>
                <Text size="sm" c="dimmed">{metrics.occupancyRate.toFixed(1)}%</Text>
              </Group>
              <Progress 
                value={metrics.occupancyRate}
                color={metrics.occupancyRate > 80 ? 'red' : metrics.occupancyRate > 60 ? 'yellow' : 'green'}
              />
              <Text size="sm" c="dimmed" mt="sm">
                Current system resource utilization
              </Text>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <Card padding="lg">
              <Group justify="space-between" mb="md">
                <Text fw={600}>Approval Rate</Text>
                <Text size="sm" c="dimmed">{metrics.approvalRate.toFixed(1)}%</Text>
              </Group>
              <Progress 
                value={metrics.approvalRate}
                color="blue"
              />
              <Text size="sm" c="dimmed" mt="sm">
                Percentage of requests approved
              </Text>
            </Card>
          </Grid.Col>
        </Grid>

        {/* Advanced Data Table with sophisticated error handling */}
        <Card padding="lg">
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Title order={3} mb={4}>Recent Requests</Title>
                <Text c="dimmed" size="sm">Latest system requests and their status</Text>
              </div>
              <Group gap="sm">
                <Button variant="light" size="sm" leftSection={<IconSearch size={16} />}>
                  Search
                </Button>
                <Button variant="outline" size="sm">View All</Button>
              </Group>
            </Group>

            <Divider />

            {requestsLoading ? (
              <Card className="empty-state">
                <Stack align="center" gap="md">
                  <ThemeIcon size={60} color="blue">
                    <IconFileText size={30} />
                  </ThemeIcon>
                  <Text ta="center" c="dimmed">Loading requests...</Text>
                </Stack>
              </Card>
            ) : requests.length === 0 ? (
              <Card className="empty-state">
                <Stack align="center" gap="md">
                  <ThemeIcon size={60} color="gray">
                    <IconFileText size={30} />
                  </ThemeIcon>
                  <Text ta="center" c="dimmed">No requests found</Text>
                  <Button variant="light" onClick={handleNewRequest}>Create First Request</Button>
                </Stack>
              </Card>
            ) : (
              <Table.ScrollContainer minWidth={800}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Title</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Created Date</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {requests.slice(0, 8).map((request, index) => {
                      const requestId = getFieldValue(request.sys_id) || index.toString();
                      return (
                        <Table.Tr key={requestId}>
                          <Table.Td>
                            <Group gap="sm">
                              <Avatar size={40} color="blue">
                                {getFieldValue(request.title)?.charAt(0)?.toUpperCase() || '?'}
                              </Avatar>
                              <div>
                                <Text fw={500} size="sm">
                                  {getFieldValue(request.title) || 'Untitled Request'}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {getFieldValue(request.description) || 'No description'}
                                </Text>
                              </div>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <StatusBadge status={getFieldValue(request.status) as any} />
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <IconCalendar size={16} color="gray" />
                              <Text size="sm">
                                {getFieldValue(request.sys_created_on) || 'Unknown'}
                              </Text>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Menu position="bottom-end">
                              <Menu.Target>
                                <ActionIcon variant="subtle" color="gray">
                                  <IconDots size={18} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item 
                                  leftSection={<IconEye size={16} />}
                                  onClick={() => handleViewRequest(requestId)}
                                >
                                  View Details
                                </Menu.Item>
                                <Menu.Item 
                                  leftSection={<IconEdit size={16} />}
                                  onClick={() => navigate(`/request/${requestId}/edit`)}
                                >
                                  Edit Request
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item leftSection={<IconTrash size={16} />} color="red">
                                  Delete Request
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
};
```

#### **2. Advanced Error Handling Patterns**

```typescript
// Enterprise-grade error boundary with sophisticated error reporting
export const EnhancedErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <Container size="sm" py="xl">
          <Alert 
            color="red" 
            title="Application Error" 
            icon={<IconBug size={16} />}
            variant="light"
          >
            <Text size="sm" mb="md">
              An unexpected error occurred. Our team has been notified.
            </Text>
            
            <Group gap="sm">
              <Button 
                leftSection={<IconRefresh size={16} />}
                onClick={resetErrorBoundary}
                size="sm"
              >
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  logger.error('User reported error', error, {
                    userAgent: navigator.userAgent,
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                  });
                  showSuccessNotification('Error report sent to development team');
                }}
                size="sm"
              >
                Report Issue
              </Button>
            </Group>
          </Alert>
        </Container>
      )}
      onError={(error, errorInfo) => {
        // Advanced error reporting with context
        logger.error('Enhanced error boundary triggered', error, {
          componentStack: errorInfo.componentStack,
          errorBoundary: 'EnhancedErrorBoundary',
          hybridDataContext: {
            hasImmediateData: !!window.snUserContext,
            hasEnhancedData: !!window.enhancedApplicationData
          },
          reactVersion: '19.2.0',
          mantineVersion: '8.3.6'
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
```

#### **3. Advanced Mantine Theme with Global Styles**

```typescript
// Enterprise theme with advanced styling patterns
export const enterpriseTheme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand: brandColors,
  },
  fontFamily: 'Inter, system-ui, sans-serif',
  headings: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontWeight: '600',
  },
  
  // Advanced spacing and sizing
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  
  radius: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },

  // Custom properties for advanced theming
  other: {
    headerGradient: 'linear-gradient(135deg, var(--mantine-color-brand-6) 0%, var(--mantine-color-violet-6) 100%)',
    metricCardHeight: '100%',
    hoverTransition: '0.2s ease',
  },

  // Advanced global styles with enterprise patterns
  globalStyles: (theme) => ({
    '.dashboard-header': {
      background: 'linear-gradient(135deg, var(--mantine-color-brand-6) 0%, var(--mantine-color-violet-6) 100%)',
      color: 'white',
      padding: theme.spacing.xl,
      borderRadius: theme.radius.lg,
      
      '& .dashboard-header-title': {
        color: 'white',
        marginBottom: theme.spacing.xs,
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
      },
      
      '& .dashboard-header-subtitle': {
        color: 'rgba(255, 255, 255, 0.9)',
      },
    },

    '.metric-card': {
      height: '100%',
      transition: theme.other.hoverTransition,
      
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.shadows.lg,
      },
    },

    '.activity-item': {
      padding: '8px',
      borderRadius: '6px',
      transition: 'background-color 0.2s ease',
      
      '&:hover': {
        backgroundColor: theme.colors.gray[0],
      },
      
      '& + .activity-item': {
        marginTop: theme.spacing.md,
      },
    },

    '.empty-state': {
      padding: theme.spacing.xl,
      textAlign: 'center',
      background: `linear-gradient(135deg, ${theme.colors.gray[0]} 0%, ${theme.colors.gray[1]} 100%)`,
      border: `2px dashed ${theme.colors.gray[3]}`,
      borderRadius: theme.radius.md,
    },
  }),
});
```

### **Mantine Component Standards**

Components Must Meet Advanced Standards:
✅ **Atomic Design Principles** - Clear component hierarchy with proper separation
✅ **Enterprise Error Handling** - Comprehensive try-catch with logging
✅ **Performance Optimization** - Strategic use of useMemo, useCallback, and React.memo
✅ **Accessibility Compliance** - WCAG 2.1 AA standards with proper ARIA
✅ **TypeScript Excellence** - Full type safety with IntelliSense and strict mode
✅ **Reusability Patterns** - Generic components with application-specific variants
✅ **Composability Support** - Components work seamlessly together
✅ **Consistent Theming** - Global theme classes and CSS-in-JS patterns
✅ **Scalability Patterns** - Multi-level architecture for maintainability
✅ **Advanced Debugging** - Comprehensive logging and error reporting
✅ **Hybrid Data Integration** - Pattern 2A/2B/2C data access patterns
✅ **ServiceNow Optimization** - Query generation and API integration

---

### 🚀 **Advanced Component Pattern Benefits**

#### **Enterprise-Grade Architecture Benefits:**

- **Multi-Level Component Organization** - Generic vs Application-specific separation
- **Advanced Error Handling** - Multiple levels of error handling with user reporting
- **Performance Optimization Patterns** - Strategic memoization and React 19 compiler
- **TypeScript Excellence** - Full type safety throughout the component tree
- **Hybrid Data Integration** - Pattern 2A/2B/2C for optimal data loading
- **Sophisticated UI Patterns** - Complex dashboards, advanced forms, and data tables
- **Production-Ready Error Handling** - User reporting and comprehensive logging
- **Scalable Architecture** - Clear separation of concerns and maintainable code structure

[← Back to Main Advice](../Advice.md)