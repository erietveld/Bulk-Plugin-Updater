---
title: "Migration Guide: 2024.x to 2025.1.0"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Complete migration guide from legacy patterns to current standards"
readTime: "12 minutes"
complexity: "intermediate"
status: "ACTIVE"
criticality: "MANDATORY"
tags: ["migration", "upgrade", "breaking-changes", "deprecated"]
breaking-changes: [
  "TanStack Query replaces manual data fetching",
  "Stateless-first component architecture required",
  "Standardized frontmatter schema mandatory",
  "Service layer architecture now required"
]
---

# Migration Guide: 2024.x to 2025.1.0

**Purpose:** Complete migration guide from legacy patterns to current standards  
**Read time:** ~12 minutes  
**Criticality:** MANDATORY for all existing projects

---

## 🚨 Breaking Changes Summary

### **Critical Architecture Changes**

| **Component** | **2024.x (Legacy)** | **2025.1.0 (Current)** | **Impact** |
|---------------|---------------------|-------------------------|------------|
| **Data Fetching** | Manual useState/useEffect | TanStack Query | 🔴 **BREAKING** - All data fetching must migrate |
| **Component Architecture** | Mixed concerns | Stateless-first | 🔴 **BREAKING** - Component refactoring required |
| **Service Layer** | Optional | Mandatory | 🔴 **BREAKING** - Service layer implementation required |
| **Frontmatter** | Inconsistent | Standardized schema | 🔴 **BREAKING** - All documentation must update |
| **Authentication** | Basic patterns | Enhanced security | 🟡 **RECOMMENDED** - Security improvements |

### **Version Support Policy**

| **Version** | **Status** | **Support Until** | **Migration Required** |
|-------------|------------|-------------------|------------------------|
| **2025.1.0** | ✅ **Current** | N/A | N/A |
| **2024.4.x** | ⚠️ **Deprecated** | March 2025 | ✅ **Yes** |
| **2024.3.x** | ❌ **End of Life** | Expired | ✅ **Immediate** |

---

## 📋 Migration Checklist

### **Phase 1: Assessment (1-2 days)**
- [ ] **Audit current patterns** - Identify legacy code usage
- [ ] **Map data fetching** - Find all manual useState/useEffect patterns
- [ ] **Review component architecture** - Identify stateful presentation components
- [ ] **Check documentation** - Inventory frontmatter inconsistencies
- [ ] **Assess timeline** - Plan migration phases based on complexity

### **Phase 2: Service Layer Migration (3-5 days)**
- [ ] **Implement BaseServiceNowService** - Foundation service class
- [ ] **Create business services** - Extend base for each ServiceNow table
- [ ] **Setup TanStack Query** - Query client configuration
- [ ] **Migrate data hooks** - Replace manual fetching with TanStack Query
- [ ] **Test service integration** - Validate API calls and error handling

### **Phase 3: Component Architecture Migration (5-7 days)**
- [ ] **Refactor to stateless** - Move business logic to hooks/containers
- [ ] **Update prop interfaces** - Pass state via props instead of internal state
- [ ] **Implement containers** - Create container components for stateful logic
- [ ] **Update tests** - Adapt tests for new component structure
- [ ] **Performance optimization** - Add React.memo and callback optimization

### **Phase 4: Documentation Standardization (2-3 days)**
- [ ] **Update frontmatter** - Apply standardized schema to all files
- [ ] **Fix version alignment** - Consistent version numbering
- [ ] **Add deprecation tracking** - Mark legacy patterns appropriately
- [ ] **Update cross-references** - Fix broken links and prerequisites
- [ ] **Validate navigation** - Test all documentation paths

### **Phase 5: Quality Assurance (2-3 days)**
- [ ] **Run automated tests** - Ensure all tests pass
- [ ] **Performance testing** - Validate TanStack Query performance
- [ ] **Documentation validation** - Check frontmatter compliance
- [ ] **End-to-end testing** - Full application flow validation
- [ ] **Security audit** - Verify authentication patterns

---

## 🔄 Code Migration Patterns

### **1. Data Fetching Migration**

#### **❌ Legacy Pattern (2024.x)**
```tsx
// DEPRECATED: Manual data fetching with useState/useEffect
function IncidentListLegacy() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/now/table/incident');
        const data = await response.json();
        setIncidents(data.result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {incidents.map(incident => (
        <IncidentCard key={incident.sys_id} incident={incident} />
      ))}
    </div>
  );
}
```

#### **✅ Current Pattern (2025.1.0)**
```tsx
// CURRENT: TanStack Query + Service Layer
import { useIncidents } from '@/hooks/queries/useIncidentQueries';

function IncidentListCurrent() {
  const { data: incidents, isLoading, error, refetch } = useIncidents({
    query: 'active=true',
    fields: ['number', 'short_description', 'priority', 'state']
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;

  return (
    <div>
      {incidents?.map(incident => (
        <IncidentCard key={incident.sys_id} incident={incident} />
      ))}
    </div>
  );
}

// Supporting hook (automatically generated from service layer)
function useIncidents(options: IncidentQueryOptions = {}) {
  return useQuery({
    queryKey: ['incidents', options],
    queryFn: () => enhancedIncidentService.getIncidents(options),
    staleTime: 5 * 60 * 1000, // Smart caching
    enabled: !!options.query
  });
}
```

### **2. Component Architecture Migration**

#### **❌ Legacy Pattern (2024.x)**
```tsx
// DEPRECATED: Stateful presentation component
function IncidentCardLegacy({ incidentId }: { incidentId: string }) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mixed concerns: data fetching + UI logic
  const updateIncident = async (updates: Partial<Incident>) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/now/table/incident/${incidentId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      const updatedIncident = await response.json();
      setIncident(updatedIncident);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="incident-card">
      {/* UI logic mixed with business logic */}
      <h3>{incident?.short_description}</h3>
      <button onClick={() => updateIncident({ state: 'resolved' })}>
        {updating ? 'Updating...' : 'Resolve'}
      </button>
    </div>
  );
}
```

#### **✅ Current Pattern (2025.1.0)**
```tsx
// CURRENT: Stateless presentation + container pattern
interface IncidentCardProps {
  incident: Incident;
  onUpdate: (updates: Partial<Incident>) => void;
  isUpdating: boolean;
  error?: string | null;
}

// Stateless presentation component
function IncidentCard({ incident, onUpdate, isUpdating, error }: IncidentCardProps) {
  return (
    <div className="incident-card">
      {error && <ErrorMessage error={error} />}
      <h3>{incident.short_description?.display_value}</h3>
      <button 
        onClick={() => onUpdate({ state: 'resolved' })}
        disabled={isUpdating}
      >
        {isUpdating ? 'Updating...' : 'Resolve'}
      </button>
    </div>
  );
}

// Container component handles business logic
function IncidentCardContainer({ incidentId }: { incidentId: string }) {
  const { data: incident, isLoading, error } = useIncident(incidentId);
  const { updateIncident } = useIncidentMutations();

  const handleUpdate = (updates: Partial<Incident>) => {
    updateIncident.mutate({ sysId: incidentId, data: updates });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!incident) return <div>Incident not found</div>;

  return (
    <IncidentCard
      incident={incident}
      onUpdate={handleUpdate}
      isUpdating={updateIncident.isPending}
      error={updateIncident.error?.message}
    />
  );
}
```

### **3. Service Layer Implementation**

#### **❌ Legacy Pattern (2024.x)**
```tsx
// DEPRECATED: Direct API calls in components/hooks
async function fetchIncidents() {
  const response = await fetch('/api/now/table/incident?sysparm_limit=100');
  return response.json();
}

function useIncidentData() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetchIncidents().then(setData);
  }, []);
  
  return data;
}
```

#### **✅ Current Pattern (2025.1.0)**
```tsx
// CURRENT: Service layer + TanStack Query integration
class EnhancedIncidentService extends BaseServiceNowService {
  async getIncidents(options: IncidentQueryOptions = {}): Promise<ServiceNowTableResponse<Incident>> {
    const params = this.buildQueryParams({
      fields: ['sys_id', 'number', 'short_description', 'priority', 'state'],
      displayValue: 'all'
    });

    if (options.query) params.set('sysparm_query', options.query);
    if (options.limit) params.set('sysparm_limit', options.limit.toString());

    return this.request<ServiceNowTableResponse<Incident>>(
      `/table/incident?${params.toString()}`
    );
  }
}

// TanStack Query hook bridges service to React
function useIncidents(options: IncidentQueryOptions = {}) {
  return useQuery({
    queryKey: ['incidents', options],
    queryFn: () => enhancedIncidentService.getIncidents(options),
    staleTime: 5 * 60 * 1000
  });
}
```

---

## 📄 Documentation Migration

### **Frontmatter Standardization**

#### **❌ Legacy Frontmatter (2024.x)**
```yaml
# Inconsistent or missing frontmatter
# Some files had no frontmatter at all
# Others had partial or non-standard fields
```

#### **✅ Current Frontmatter (2025.1.0)**
```yaml
---
title: "ServiceNow Services + TanStack Query Integration"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "MANDATORY reading before implementing any ServiceNow service layer"
readTime: "8 minutes"
complexity: "intermediate"
status: "ACTIVE"
criticality: "MANDATORY"
prerequisites: ["core-principles"]
tags: ["servicenow", "tanstack-query", "data-fetching", "architecture"]
breaking-changes: ["Replaces v2024.x manual data fetching patterns"]
---
```

### **Deprecation Tracking**

#### **Mark Legacy Files**
```yaml
---
title: "Legacy ServiceNow Integration (DEPRECATED)"
version: "2024.4.x"
introduced: "2024.3.0"
purpose: "Legacy ServiceNow integration patterns (DO NOT USE)"
readTime: "5 minutes"
complexity: "intermediate"
status: "DEPRECATED"
criticality: "OPTIONAL"
deprecates: ["Manual data fetching patterns"]
replacedBy: "service-layer-integration"
migrationGuide: "migration-2024-to-2025"
tags: ["legacy", "deprecated", "servicenow"]
breaking-changes: ["Replaced by TanStack Query integration"]
---

# ⚠️ DEPRECATED: Legacy ServiceNow Integration

**This pattern is DEPRECATED and will be removed in March 2025.**

**✅ Use instead:** [Service Layer Integration](service-layer-integration.md)  
**📋 Migration:** [Migration Guide](../reference/migration-2024-to-2025.md)

---

## Why This Pattern Was Deprecated

1. **No caching** - Every component mount triggered API calls
2. **No error recovery** - Manual error handling was inconsistent
3. **Performance issues** - Redundant requests and blocking operations
4. **Maintenance overhead** - Complex state management in every component

## Migration Path

Replace this legacy pattern:

```tsx
// ❌ DON'T USE - This pattern is deprecated
function LegacyIncidentList() {
  const [incidents, setIncidents] = useState([]);
  // ... manual data fetching
}
```

With the current approach:

```tsx
// ✅ USE THIS - Current pattern
function CurrentIncidentList() {
  const { data: incidents } = useIncidents();
  // TanStack Query handles caching, loading, errors
}
```

**See:** [Complete Migration Guide](../reference/migration-2024-to-2025.md)
```

---

## 🛠 Migration Tools

### **Automated Migration Scripts**

#### **Service Layer Generator**
```typescript
// scripts/generate-service-layer.ts
interface ServiceConfig {
  tableName: string;
  baseUrl: string;
  fields: string[];
}

async function generateServiceLayer(config: ServiceConfig) {
  const serviceTemplate = `
import { BaseServiceNowService } from './BaseServiceNowService';

export class Enhanced${pascalCase(config.tableName)}Service extends BaseServiceNowService {
  async get${pascalCase(config.tableName)}s(options: ${pascalCase(config.tableName)}QueryOptions = {}) {
    const params = this.buildQueryParams({
      fields: ${JSON.stringify(config.fields)},
      displayValue: 'all'
    });

    return this.request<ServiceNowTableResponse<${pascalCase(config.tableName)}>>(
      '/table/${config.tableName}?' + params.toString()
    );
  }
}

export const enhanced${pascalCase(config.tableName)}Service = new Enhanced${pascalCase(config.tableName)}Service();
`;

  await fs.writeFile(`src/services/Enhanced${pascalCase(config.tableName)}Service.ts`, serviceTemplate);
}
```

#### **Component Migration Script**
```typescript
// scripts/migrate-components.ts
async function migrateComponent(filePath: string) {
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Detect legacy patterns
  const hasManualDataFetching = /useState.*\[\]/.test(content) && /useEffect.*fetch/.test(content);
  const hasInlineBusinessLogic = /fetch\(/.test(content) && !/service\./.test(content);
  
  if (hasManualDataFetching) {
    console.log(`⚠️  ${filePath} - Contains manual data fetching (needs TanStack Query)`);
  }
  
  if (hasInlineBusinessLogic) {
    console.log(`⚠️  ${filePath} - Contains inline business logic (needs service layer)`);
  }
  
  // Generate migration suggestions
  const suggestions = generateMigrationSuggestions(content);
  return suggestions;
}
```

#### **Frontmatter Migration Script**
```typescript
// scripts/migrate-frontmatter.ts
import matter from 'gray-matter';

async function migrateFrontmatter(filePath: string) {
  const content = await fs.readFile(filePath, 'utf-8');
  const { data, content: body } = matter(content);
  
  const standardizedFrontmatter = {
    title: data.title || extractTitleFromContent(body),
    version: "2025.1.0",
    introduced: data.introduced || "2025.1.0",
    purpose: data.purpose || extractPurposeFromContent(body),
    readTime: calculateReadTime(body),
    complexity: data.complexity || inferComplexity(body),
    status: data.status || "ACTIVE",
    ...conditionalFields(filePath, data)
  };
  
  const newContent = matter.stringify(body, standardizedFrontmatter);
  await fs.writeFile(filePath, newContent);
}
```

### **Validation Commands**
```bash
# Run migration assessment
npm run migrate:assess

# Migrate service layer
npm run migrate:services

# Migrate components  
npm run migrate:components

# Migrate documentation
npm run migrate:docs

# Validate migration
npm run migrate:validate
```

---

## 🎯 Success Criteria

### **Technical Validation**
- [ ] **All API calls** use service layer (no direct fetch in components)
- [ ] **All data fetching** uses TanStack Query (no manual useState/useEffect)
- [ ] **All components** are stateless or properly separated (presentation vs. container)
- [ ] **All tests pass** with new architecture
- [ ] **Performance improvements** verified (caching, request deduplication)

### **Documentation Validation**
- [ ] **All files** have standardized frontmatter
- [ ] **Version alignment** is consistent (2025.1.0 for current, appropriate legacy versions)
- [ ] **Deprecation tracking** is complete (all legacy patterns marked)
- [ ] **Migration guides** are linked from deprecated files
- [ ] **Cross-references** are validated and working

### **Quality Assurance**
- [ ] **No breaking changes** for end users (same functionality, better architecture)
- [ ] **Improved error handling** (service layer + TanStack Query error states)
- [ ] **Better performance** (caching, optimistic updates)
- [ ] **Maintainable codebase** (clear separation of concerns)
- [ ] **Comprehensive documentation** (migration paths, examples, best practices)

---

## 🚨 Common Migration Issues

### **Issue 1: Authentication Breaks**
**Problem:** Legacy authentication patterns stop working  
**Solution:** Ensure service layer uses proper authentication headers
```tsx
// ✅ Fix authentication in service layer
class BaseServiceNowService {
  protected getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-UserToken': token // Proper token handling
    };
  }
}
```

### **Issue 2: State Management Confusion**
**Problem:** Components don't know where to get data  
**Solution:** Clear container/presentation separation
```tsx
// ✅ Clear separation pattern
function IncidentManagementPage() {
  return (
    <div>
      {/* Container handles data */}
      <IncidentListContainer />
      
      {/* Presentation components receive props */}
      <IncidentStats incidents={incidents} />
    </div>
  );
}
```

### **Issue 3: Performance Regression**
**Problem:** New architecture seems slower  
**Solution:** Proper TanStack Query configuration
```tsx
// ✅ Optimize TanStack Query settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false, // Don't refetch on focus
      retry: 1 // Limited retries
    }
  }
});
```

### **Issue 4: Testing Problems**
**Problem:** Tests break with new architecture  
**Solution:** Update test patterns for new structure
```tsx
// ✅ Test container and presentation separately
describe('IncidentListContainer', () => {
  it('passes correct props to presentation component', () => {
    // Test container logic
  });
});

describe('IncidentList', () => {
  it('renders incidents correctly', () => {
    // Test presentation component with mock props
  });
});
```

---

## 📅 Migration Timeline

### **Small Projects (< 10 components)**
- **Week 1:** Assessment and service layer implementation
- **Week 2:** Component migration and testing
- **Week 3:** Documentation updates and validation

### **Medium Projects (10-50 components)**
- **Week 1-2:** Assessment and service layer implementation
- **Week 3-4:** Component migration (batch by feature)
- **Week 5:** Testing and performance optimization
- **Week 6:** Documentation updates and validation

### **Large Projects (50+ components)**
- **Week 1-2:** Assessment and architecture planning
- **Week 3-4:** Service layer implementation
- **Week 5-8:** Component migration (feature by feature)
- **Week 9-10:** Performance optimization and testing
- **Week 11-12:** Documentation updates and final validation

---

## 🎉 Post-Migration Benefits

### **Developer Experience**
- **Faster development** - Less boilerplate, more reusable patterns
- **Better debugging** - Clear separation of concerns, better error messages
- **Easier testing** - Testable hooks and stateless components
- **Consistent patterns** - Same architecture across all features

### **Application Performance**
- **Smart caching** - TanStack Query eliminates redundant requests
- **Optimistic updates** - Instant user feedback with rollback on error
- **Request deduplication** - Multiple components share single API call
- **Background synchronization** - Data stays fresh automatically

### **Maintenance**
- **Centralized business logic** - Service layer handles all API communication
- **Reusable components** - Stateless components work in any context
- **Consistent error handling** - Service layer provides uniform error patterns
- **Documentation quality** - Standardized, discoverable, maintainable docs

---

## 🔗 Additional Resources

**Implementation Guides:**
- [Service Layer Integration](../patterns/service-layer-integration.md) - Complete TanStack Query setup
- [Component Reusability](../component-reusability.md) - Stateless component patterns
- [State Management](../patterns/state-management.md) - Modern state management

**Reference Materials:**
- [Frontmatter Standards](../patterns/documentation-standards-frontmatter.md) - Complete schema reference
- [Quick Checklist](../reference/quick-checklist.md) - Development quality gates
- [Clean Code Principles](../reference/clean-code-principles.md) - Code quality standards

**Migration Tools:**
- [Migration Scripts Repository](https://github.com/servicenow-react/migration-tools) - Automated migration tools
- [Validation Scripts](../reference/validation-scripts.md) - Quality assurance automation

---

*Migration to 2025.1.0 represents a significant architectural improvement. While the initial effort is substantial, the long-term benefits in maintainability, performance, and developer experience make this migration essential for all ServiceNow React projects.*