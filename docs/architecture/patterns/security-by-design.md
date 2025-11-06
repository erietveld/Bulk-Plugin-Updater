---
title: "Security-by-Design Principles for ServiceNow Applications"
version: "2025.1.0"
introduced: "2025.1.0"
purpose: "Comprehensive security architecture patterns for ServiceNow applications with governance integration"
readTime: "10 minutes"
complexity: "advanced"
status: "ACTIVE"
criticality: "MANDATORY"
prerequisites: ["core-principles", "service-layer-integration", "state-management"]
tags: ["security", "servicenow", "governance", "rbac", "compliance", "architecture"]
---

# Security-by-Design Principles for ServiceNow Applications

**Purpose:** Comprehensive security architecture patterns for ServiceNow applications with governance integration  
**Read time:** ~10 minutes  
**Prerequisites:** [Core Principles](../core-principles.md), [Service Layer Integration](service-layer-integration.md), [State Management](state-management.md)

---

## ServiceNow Security Architecture Integration

### **Security-by-Design Philosophy**

Security-by-design aligns with ServiceNow's backend-first philosophy by leveraging platform security capabilities while implementing comprehensive frontend protection:

```
ServiceNow Security Architecture (Defense in Depth)
├── ServiceNow Platform Security (Configuration-First) 🏗️
│   ├── Role-Based Access Control (RBAC)
│   ├── Access Control Lists (ACLs) 
│   ├── Security Rules and Policies
│   ├── Field-Level Security
│   └── Audit and Compliance Logging
├── React Frontend Security (Code-First) ⚛️
│   ├── Authentication State Management
│   ├── Component-Level Access Control
│   ├── Input Validation and Sanitization
│   ├── XSS and CSRF Protection
│   └── Secure API Communication
└── Integration Security 🔗
    ├── Token Management and Refresh
    ├── Session Security and Monitoring
    ├── API Rate Limiting and Validation
    └── Security Event Correlation
```

**Why Security-by-Design for ServiceNow?**
- **Enterprise Data Protection** - Employee records, financial data, confidential incidents
- **Regulatory Compliance** - GDPR, HIPAA, SOX, industry-specific regulations
- **Multi-tenant Security** - Secure isolation between departments and business units
- **Privileged Access Management** - Administrative and sensitive operational data
- **Audit Trail Requirements** - Complete security event logging and monitoring
- **Platform Integration** - Seamless security with ServiceNow's native capabilities

### **Integration with Security Governance**

Security-by-design works in conjunction with **[Security Governance Overview](security-governance-overview.md)** to provide:
- **Policy Enforcement** - Automated security policy compliance
- **Risk Management** - Continuous risk assessment and mitigation
- **Compliance Validation** - Multi-framework regulatory compliance
- **Security Metrics** - Real-time security posture monitoring

---

## ServiceNow Platform Security Integration

### **Enhanced RBAC Integration Service**

```tsx
// services/security/ServiceNowSecurityService.ts
import { BaseServiceNowService } from '../core/BaseServiceNowService';

export interface ServiceNowUser {
  sys_id: string;
  name: string;
  email: string;
  department: string;
  manager: { value: string; display_value: string };
  roles: string[];
  groups: string[];
  location: string;
  active: boolean;
}

export interface SecurityContext {
  user: ServiceNowUser;
  roles: string[];
  groups: string[];
  permissions: string[];
  tableAccess: Map<string, TableAccess>;
  fieldAccess: Map<string, FieldAccess>;
  isAdmin: boolean;
  lastValidated: number;
}

export interface TableAccess {
  read: boolean;
  write: boolean;
  delete: boolean;
  create: boolean;
}

export interface FieldAccess {
  read: boolean;
  write: boolean;
}

export class ServiceNowSecurityService extends BaseServiceNowService {
  private securityContextCache = new Map<string, SecurityContext>();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  /**
   * Get comprehensive security context for current user
   * Integrates with ServiceNow RBAC, ACLs, and field-level security
   */
  async getCurrentSecurityContext(): Promise<SecurityContext> {
    const userId = await this.getCurrentUserId();
    const cached = this.securityContextCache.get(userId);
    
    if (cached && Date.now() - cached.lastValidated < this.CACHE_TTL) {
      return cached;
    }

    const [user, roles, groups, permissions] = await Promise.all([
      this.getCurrentUser(),
      this.getUserRoles(userId),
      this.getUserGroups(userId),
      this.getUserPermissions(userId)
    ]);

    const [tableAccess, fieldAccess] = await Promise.all([
      this.getTableAccessMap(roles),
      this.getFieldAccessMap(roles)
    ]);

    const context: SecurityContext = {
      user,
      roles: roles.map(r => r.name),
      groups: groups.map(g => g.name),
      permissions,
      tableAccess,
      fieldAccess,
      isAdmin: roles.some(r => r.name === 'admin'),
      lastValidated: Date.now()
    };

    this.securityContextCache.set(userId, context);
    return context;
  }

  /**
   * Validate table access permissions
   * CRITICAL: Always validate before any table operations
   */
  async validateTableAccess(
    table: string, 
    operation: 'read' | 'write' | 'delete' | 'create'
  ): Promise<void> {
    const context = await this.getCurrentSecurityContext();
    const access = context.tableAccess.get(table);
    
    if (!access || !access[operation]) {
      throw new ServiceNowSecurityError(
        403,
        'TABLE_ACCESS_DENIED',
        `No ${operation} access to table: ${table}`,
        { table, operation, userId: context.user.sys_id }
      );
    }
  }

  /**
   * Validate field access permissions
   */
  async validateFieldAccess(
    table: string,
    field: string,
    operation: 'read' | 'write'
  ): Promise<void> {
    const fieldKey = `${table}.${field}`;
    const context = await this.getCurrentSecurityContext();
    const access = context.fieldAccess.get(fieldKey);
    
    if (!access || !access[operation]) {
      throw new ServiceNowSecurityError(
        403,
        'FIELD_ACCESS_DENIED',
        `No ${operation} access to field: ${fieldKey}`,
        { table, field, operation, userId: context.user.sys_id }
      );
    }
  }

  /**
   * Apply row-level security filters
   */
  async applyRowLevelSecurity(
    table: string,
    baseQuery: string = ''
  ): Promise<string> {
    const context = await this.getCurrentSecurityContext();
    
    if (context.isAdmin) {
      return baseQuery; // Admins see all records
    }

    // Get row-level security rules for table
    const rowSecurityRules = await this.getRowSecurityRules(table, context.roles);
    
    if (rowSecurityRules.length === 0) {
      return baseQuery;
    }

    // Build security filter query
    const securityFilters = rowSecurityRules.map(rule => 
      this.processSecurityRuleCondition(rule.condition, context)
    );

    const securityQuery = securityFilters.join('^OR');
    
    return baseQuery ? 
      `${baseQuery}^(${securityQuery})` : 
      `(${securityQuery})`;
  }

  /**
   * Apply field-level security to records
   */
  async applyFieldLevelSecurity<T extends Record<string, any>>(
    table: string,
    records: T[]
  ): Promise<T[]> {
    const context = await this.getCurrentSecurityContext();
    
    if (context.isAdmin) {
      return records; // Admins see all fields
    }

    const tableFields = await this.getTableFields(table);
    const securedRecords = records.map(record => {
      const securedRecord = { ...record };
      
      tableFields.forEach(field => {
        const fieldKey = `${table}.${field.name}`;
        const access = context.fieldAccess.get(fieldKey);
        
        if (!access || !access.read) {
          // Mask restricted fields
          if (securedRecord[field.name]) {
            securedRecord[field.name] = {
              value: '[RESTRICTED]',
              display_value: '[RESTRICTED]'
            };
          }
        }
      });
      
      return securedRecord;
    });

    return securedRecords;
  }

  /**
   * Get table access permissions based on roles
   */
  private async getTableAccessMap(roles: any[]): Promise<Map<string, TableAccess>> {
    const roleNames = roles.map(r => r.name);
    
    const aclResponse = await this.request<ServiceNowTableResponse<any>>(
      `/table/sys_security_acl?sysparm_query=active=true^typeINread,write,delete,create&sysparm_fields=name,operation,type,roles`
    );

    const accessMap = new Map<string, TableAccess>();
    
    // Process ACL records to build access map
    aclResponse.result.forEach(acl => {
      if (!accessMap.has(acl.name)) {
        accessMap.set(acl.name, {
          read: false,
          write: false,
          delete: false,
          create: false
        });
      }
      
      const access = accessMap.get(acl.name)!;
      const hasRole = roleNames.some(role => acl.roles?.includes(role));
      
      if (hasRole) {
        access[acl.operation as keyof TableAccess] = true;
      }
    });

    return accessMap;
  }

  /**
   * Get field access permissions based on roles
   */
  private async getFieldAccessMap(roles: any[]): Promise<Map<string, FieldAccess>> {
    const roleNames = roles.map(r => r.name);
    
    const fieldAclResponse = await this.request<ServiceNowTableResponse<any>>(
      `/table/sys_security_acl_role?sysparm_query=active=true&sysparm_fields=sys_security_acl,role`
    );

    const fieldAccessMap = new Map<string, FieldAccess>();
    
    // Process field ACL records
    fieldAclResponse.result.forEach(fieldAcl => {
      const hasRole = roleNames.includes(fieldAcl.role);
      if (hasRole) {
        // Get field details and set access
        const fieldKey = fieldAcl.sys_security_acl.table + '.' + fieldAcl.sys_security_acl.field;
        fieldAccessMap.set(fieldKey, {
          read: fieldAcl.sys_security_acl.operation === 'read',
          write: fieldAcl.sys_security_acl.operation === 'write'
        });
      }
    });

    return fieldAccessMap;
  }

  private async getCurrentUserId(): Promise<string> {
    const response = await this.request<{ result: { sys_id: string } }>('/table/sys_user/me');
    return response.result.sys_id;
  }

  private async getCurrentUser(): Promise<ServiceNowUser> {
    const response = await this.request<{ result: ServiceNowUser }>('/table/sys_user/me?sysparm_display_value=all');
    return response.result;
  }

  private async getUserRoles(userId: string): Promise<any[]> {
    const response = await this.request<ServiceNowTableResponse<any>>(
      `/table/sys_user_has_role?sysparm_query=user=${userId}&sysparm_fields=role&sysparm_display_value=all`
    );
    return response.result.map(r => r.role);
  }

  private async getUserGroups(userId: string): Promise<any[]> {
    const response = await this.request<ServiceNowTableResponse<any>>(
      `/table/sys_user_grmember?sysparm_query=user=${userId}&sysparm_fields=group&sysparm_display_value=all`
    );
    return response.result.map(g => g.group);
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    // Implementation to get user permissions
    const roleResponse = await this.getUserRoles(userId);
    const permissions: string[] = [];
    
    for (const role of roleResponse) {
      const rolePermissions = await this.getRolePermissions(role.value);
      permissions.push(...rolePermissions);
    }
    
    return [...new Set(permissions)]; // Remove duplicates
  }

  private async getRolePermissions(roleId: string): Promise<string[]> {
    // Get permissions associated with role
    const response = await this.request<ServiceNowTableResponse<any>>(
      `/table/sys_role_contains?sysparm_query=role=${roleId}&sysparm_fields=contains`
    );
    
    return response.result.map(p => p.contains.value);
  }

  private async getRowSecurityRules(table: string, roles: string[]): Promise<any[]> {
    // Get row-level security rules for table based on user roles
    const response = await this.request<ServiceNowTableResponse<any>>(
      `/table/sys_row_level_security?sysparm_query=table=${table}^active=true&sysparm_fields=condition,roles`
    );
    
    return response.result.filter(rule => 
      rule.roles?.some((role: string) => roles.includes(role))
    );
  }

  private processSecurityRuleCondition(condition: string, context: SecurityContext): string {
    // Process security rule conditions, replacing variables with user context
    return condition
      .replace(/\$\{user\.sys_id\}/g, context.user.sys_id)
      .replace(/\$\{user\.department\}/g, context.user.department)
      .replace(/\$\{user\.location\}/g, context.user.location);
  }

  private async getTableFields(table: string): Promise<any[]> {
    const response = await this.request<ServiceNowTableResponse<any>>(
      `/table/sys_dictionary?sysparm_query=name=${table}&sysparm_fields=element,column_label`
    );
    
    return response.result.map(field => ({
      name: field.element,
      label: field.column_label
    }));
  }
}

export class ServiceNowSecurityError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public context?: any
  ) {
    super(message);
    this.name = 'ServiceNowSecurityError';
  }
}

export const serviceNowSecurityService = new ServiceNowSecurityService();
```

---

## Enhanced Service Layer with Security

### **Secure ServiceNow Service Implementation**

```tsx
// services/SecureServiceNowService.ts
export class SecureServiceNowService extends EnhancedServiceNowService {
  /**
   * Security-enhanced record retrieval with comprehensive validation
   */
  async getRecords<T>(
    table: string,
    options: ServiceNowQueryOptions = {}
  ): Promise<ServiceNowTableResponse<T>> {
    // SECURITY: Validate table access
    await serviceNowSecurityService.validateTableAccess(table, 'read');
    
    // SECURITY: Apply row-level security
    const secureQuery = await serviceNowSecurityService.applyRowLevelSecurity(
      table,
      options.query
    );
    
    // SECURITY: Audit the access
    await this.auditDataAccess('read', table, { ...options, query: secureQuery });
    
    const response = await super.getRecords<T>(table, {
      ...options,
      query: secureQuery
    });
    
    // SECURITY: Apply field-level security
    const securedRecords = await serviceNowSecurityService.applyFieldLevelSecurity(
      table,
      response.result
    );
    
    return {
      ...response,
      result: securedRecords
    };
  }

  /**
   * Security-enhanced record updates with validation
   */
  async updateRecord<T>(
    table: string,
    sysId: string,
    updates: Partial<T>
  ): Promise<T> {
    // SECURITY: Validate table write access
    await serviceNowSecurityService.validateTableAccess(table, 'write');
    
    // SECURITY: Validate field access for each field being updated
    for (const field of Object.keys(updates)) {
      await serviceNowSecurityService.validateFieldAccess(table, field, 'write');
    }
    
    // SECURITY: Validate record access (row-level)
    await this.validateRecordAccess(table, sysId, 'write');
    
    // SECURITY: Sanitize and validate input
    const sanitizedUpdates = this.sanitizeAndValidateInput(updates);
    
    // SECURITY: Check for sensitive field updates
    await this.validateSensitiveFieldUpdates(table, sysId, sanitizedUpdates);
    
    // SECURITY: Audit the change
    await this.auditDataChange('update', table, sysId, sanitizedUpdates);
    
    const result = await super.updateRecord<T>(table, sysId, sanitizedUpdates);
    
    // SECURITY: Post-update validation
    await this.validateUpdateResult(table, sysId, sanitizedUpdates, result);
    
    return result;
  }

  /**
   * Security-enhanced record creation
   */
  async createRecord<T>(table: string, data: Partial<T>): Promise<T> {
    // SECURITY: Validate table create access
    await serviceNowSecurityService.validateTableAccess(table, 'create');
    
    // SECURITY: Validate field access
    for (const field of Object.keys(data)) {
      await serviceNowSecurityService.validateFieldAccess(table, field, 'write');
    }
    
    // SECURITY: Sanitize and validate input
    const sanitizedData = this.sanitizeAndValidateInput(data);
    
    // SECURITY: Apply business rule validation
    await this.validateBusinessRules(table, 'create', sanitizedData);
    
    // SECURITY: Audit the creation
    await this.auditDataChange('create', table, null, sanitizedData);
    
    const result = await super.createRecord<T>(table, sanitizedData);
    
    return result;
  }

  /**
   * Comprehensive input sanitization and validation
   */
  private sanitizeAndValidateInput<T>(data: Partial<T>): Partial<T> {
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key];
      
      if (typeof value === 'string') {
        // SECURITY: XSS prevention
        sanitized[key] = this.sanitizeString(value) as any;
        
        // SECURITY: SQL injection prevention
        this.validateForSQLInjection(value, key);
        
        // SECURITY: Path traversal prevention
        this.validateForPathTraversal(value, key);
        
      } else if (value && typeof value === 'object' && 'value' in value) {
        // ServiceNow field object
        if (typeof (value as any).value === 'string') {
          (value as any).value = this.sanitizeString((value as any).value);
          this.validateForSQLInjection((value as any).value, key);
        }
      }
    });
    
    // SECURITY: Validate field formats and constraints
    this.validateFieldFormats(sanitized);
    
    // SECURITY: Check for required fields
    this.validateRequiredFields(sanitized);
    
    return sanitized;
  }

  /**
   * XSS prevention through string sanitization
   */
  private sanitizeString(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/\\/g, '&#x5C;')
      .trim();
  }

  /**
   * SQL injection detection and prevention
   */
  private validateForSQLInjection(input: string, fieldName: string): void {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(--|\/\*|\*\/)/,
      /(\b(OR|AND)\b.*=.*)/i,
      /(;|\||&)/,
      /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        throw new ServiceNowSecurityError(
          400,
          'SQL_INJECTION_DETECTED',
          `Potentially malicious input detected in field: ${fieldName}`,
          { field: fieldName, pattern: pattern.source }
        );
      }
    }
  }

  /**
   * Path traversal detection and prevention
   */
  private validateForPathTraversal(input: string, fieldName: string): void {
    const pathTraversalPatterns = [
      /\.\./,
      /\.\.\//,
      /\.\.\\\\,
      /%2e%2e/i,
      /%252e%252e/i
    ];
    
    for (const pattern of pathTraversalPatterns) {
      if (pattern.test(input)) {
        throw new ServiceNowSecurityError(
          400,
          'PATH_TRAVERSAL_DETECTED',
          `Path traversal attempt detected in field: ${fieldName}`,
          { field: fieldName, pattern: pattern.source }
        );
      }
    }
  }

  /**
   * Validate record access at row level
   */
  private async validateRecordAccess(
    table: string,
    sysId: string,
    operation: 'read' | 'write' | 'delete'
  ): Promise<void> {
    const context = await serviceNowSecurityService.getCurrentSecurityContext();
    
    if (context.isAdmin) return; // Admins have full access
    
    // Get record to check access
    const record = await super.getRecord(table, sysId);
    
    // Apply row-level security validation
    const hasAccess = await this.checkRowLevelAccess(record, context, operation);
    
    if (!hasAccess) {
      throw new ServiceNowSecurityError(
        403,
        'ROW_ACCESS_DENIED',
        `No ${operation} access to record ${sysId} in table ${table}`,
        { table, sysId, operation, userId: context.user.sys_id }
      );
    }
  }

  /**
   * Check row-level access based on record data and user context
   */
  private async checkRowLevelAccess(
    record: any,
    context: SecurityContext,
    operation: string
  ): Promise<boolean> {
    // Common row-level security checks
    
    // 1. Check if user owns the record
    if (record.created_by?.value === context.user.sys_id) {
      return true;
    }
    
    // 2. Check if user is assigned to the record
    if (record.assigned_to?.value === context.user.sys_id) {
      return true;
    }
    
    // 3. Check if user is in the assignment group
    if (record.assignment_group?.value && 
        context.groups.includes(record.assignment_group.value)) {
      return true;
    }
    
    // 4. Check department-based access
    if (record.department?.value === context.user.department) {
      return true;
    }
    
    // 5. Check location-based access
    if (record.location?.value === context.user.location) {
      return true;
    }
    
    return false;
  }

  /**
   * Comprehensive audit logging
   */
  private async auditDataAccess(
    operation: string,
    table: string,
    options: any
  ): Promise<void> {
    const context = await serviceNowSecurityService.getCurrentSecurityContext();
    
    await this.request('/table/sys_audit_relation', {
      method: 'POST',
      body: JSON.stringify({
        audit_table: table,
        audit_operation: operation,
        user: context.user.sys_id,
        timestamp: new Date().toISOString(),
        query_params: JSON.stringify(options),
        ip_address: this.getClientIP(),
        user_agent: navigator.userAgent,
        session_id: this.getSessionId()
      })
    });
  }

  private async auditDataChange(
    operation: string,
    table: string,
    sysId: string | null,
    changes: any
  ): Promise<void> {
    const context = await serviceNowSecurityService.getCurrentSecurityContext();
    
    await this.request('/table/sys_audit', {
      method: 'POST',
      body: JSON.stringify({
        tablename: table,
        documentkey: sysId,
        fieldname: 'multiple',
        oldvalue: operation === 'create' ? '' : '[PREVIOUS_STATE]',
        newvalue: JSON.stringify(changes),
        user: context.user.sys_id,
        timestamp: new Date().toISOString(),
        type: operation,
        ip_address: this.getClientIP(),
        user_agent: navigator.userAgent
      })
    });
  }

  private getClientIP(): string {
    return (window as any).g_client_ip || 'unknown';
  }

  private getSessionId(): string {
    return (window as any).g_session_id || 'unknown';
  }

  private validateFieldFormats<T>(data: Partial<T>): void {
    // Email validation
    Object.entries(data).forEach(([key, value]) => {
      if (key.toLowerCase().includes('email') && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new ServiceNowSecurityError(
            400,
            'INVALID_EMAIL_FORMAT',
            `Invalid email format in field: ${key}`
          );
        }
      }
      
      // Phone number validation
      if (key.toLowerCase().includes('phone') && typeof value === 'string') {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/[\s\-\(\)\.]/g, ''))) {
          throw new ServiceNowSecurityError(
            400,
            'INVALID_PHONE_FORMAT',
            `Invalid phone format in field: ${key}`
          );
        }
      }
    });
  }

  private validateRequiredFields<T>(data: Partial<T>): void {
    // This would be enhanced with table-specific required field validation
    // from ServiceNow dictionary
  }

  private async validateBusinessRules(
    table: string,
    operation: string,
    data: any
  ): Promise<void> {
    // Integration with ServiceNow business rules
    // This would validate against configured business rules
  }

  private async validateSensitiveFieldUpdates(
    table: string,
    sysId: string,
    updates: any
  ): Promise<void> {
    const sensitiveFields = await this.getSensitiveFields(table);
    const updateFields = Object.keys(updates);
    const sensitivesBeingUpdated = updateFields.filter(field => 
      sensitiveFields.includes(field)
    );
    
    if (sensitivesBeingUpdated.length > 0) {
      const context = await serviceNowSecurityService.getCurrentSecurityContext();
      
      // Require elevated permissions for sensitive field updates
      const hasElevatedAccess = context.roles.some(role => 
        ['admin', 'security_admin', 'data_steward'].includes(role)
      );
      
      if (!hasElevatedAccess) {
        throw new ServiceNowSecurityError(
          403,
          'SENSITIVE_FIELD_ACCESS_DENIED',
          `Elevated permissions required to update sensitive fields: ${sensitivesBeingUpdated.join(', ')}`,
          { table, sysId, sensitiveFields: sensitivesBeingUpdated }
        );
      }
    }
  }

  private async getSensitiveFields(table: string): Promise<string[]> {
    // Get sensitive fields for table from configuration
    const response = await this.request<ServiceNowTableResponse<any>>(
      `/table/sys_dictionary?sysparm_query=name=${table}^attributes.sensitive=true&sysparm_fields=element`
    );
    
    return response.result.map(field => field.element);
  }

  private async validateUpdateResult<T>(
    table: string,
    sysId: string,
    updates: Partial<T>,
    result: T
  ): Promise<void> {
    // Post-update validation to ensure changes were applied correctly
    // and no unauthorized modifications occurred
  }
}

export const secureServiceNowService = new SecureServiceNowService();
```

---

## Frontend Security Architecture

### **Secure Authentication Store with Session Management**

```tsx
// stores/secureAuthStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { serviceNowSecurityService, SecurityContext } from '../services/security/ServiceNowSecurityService';

interface SecureAuthState {
  // Authentication State
  user: ServiceNowUser | null;
  token: string | null;
  sessionExpiry: number | null;
  securityContext: SecurityContext | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionWarning: boolean;
  
  // Security Actions
  login: (credentials?: LoginCredentials) => Promise<void>;
  logout: (reason?: string) => void;
  refreshSession: () => Promise<void>;
  validateSession: () => Promise<boolean>;
  extendSession: () => Promise<void>;
  
  // Permission Helpers
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  canAccessTable: (table: string, operation: 'read' | 'write' | 'delete' | 'create') => boolean;
  canAccessField: (table: string, field: string, operation: 'read' | 'write') => boolean;
  
  // Security Event Handlers
  handleSecurityEvent: (event: SecurityEvent) => void;
  clearSecurityWarnings: () => void;
}

interface LoginCredentials {
  username: string;
  password: string;
  mfaToken?: string;
}

interface SecurityEvent {
  type: 'session_warning' | 'session_expired' | 'permission_denied' | 'suspicious_activity';
  message: string;
  data?: any;
}

export const useSecureAuthStore = create<SecureAuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      token: null,
      sessionExpiry: null,
      securityContext: null,
      isAuthenticated: false,
      isLoading: false,
      sessionWarning: false,

      // Authentication Methods
      login: async (credentials) => {
        set({ isLoading: true });
        
        try {
          // SECURITY: ServiceNow session-based authentication or custom OAuth
          const authResponse = await authenticateWithServiceNow(credentials);
          
          // SECURITY: Get comprehensive security context
          const securityContext = await serviceNowSecurityService.getCurrentSecurityContext();
          
          // SECURITY: Set session expiry (ServiceNow session timeout)
          const sessionExpiry = Date.now() + (8 * 60 * 60 * 1000); // 8 hours default
          
          set({
            user: authResponse.user,
            token: authResponse.token,
            sessionExpiry,
            securityContext,
            isAuthenticated: true,
            isLoading: false,
            sessionWarning: false
          });
          
          // SECURITY: Start session monitoring
          startSecurityMonitoring();
          
          // SECURITY: Audit successful login
          await auditSecurityEvent('LOGIN_SUCCESS', {
            userId: authResponse.user.sys_id,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          set({ isLoading: false, isAuthenticated: false });
          
          // SECURITY: Audit failed login attempt
          await auditSecurityEvent('LOGIN_FAILED', {
            username: credentials?.username,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          
          throw error;
        }
      },

      logout: (reason = 'user_initiated') => {
        const { user } = get();
        
        // SECURITY: Audit logout
        if (user) {
          auditSecurityEvent('LOGOUT', {
            userId: user.sys_id,
            reason,
            timestamp: new Date().toISOString()
          });
        }
        
        // SECURITY: Clear all authentication state
        set({
          user: null,
          token: null,
          sessionExpiry: null,
          securityContext: null,
          isAuthenticated: false,
          sessionWarning: false
        });
        
        // SECURITY: Clear sensitive data from other stores
        clearAllSecureStorage();
        
        // SECURITY: Invalidate server session
        invalidateServerSession();
        
        // SECURITY: Stop security monitoring
        stopSecurityMonitoring();
      },

      refreshSession: async () => {
        const { token, user } = get();
        if (!token || !user) {
          throw new Error('No active session to refresh');
        }
        
        try {
          const refreshResponse = await refreshServiceNowSession(token);
          const newExpiry = Date.now() + (8 * 60 * 60 * 1000);
          
          // SECURITY: Update security context
          const securityContext = await serviceNowSecurityService.getCurrentSecurityContext();
          
          set({
            token: refreshResponse.token,
            sessionExpiry: newExpiry,
            securityContext,
            sessionWarning: false
          });
          
          // SECURITY: Audit session refresh
          await auditSecurityEvent('SESSION_REFRESHED', {
            userId: user.sys_id,
            timestamp: new Date().toISOString()
          });
          
        } catch (error) {
          // SECURITY: Session refresh failed, logout user
          get().logout('session_refresh_failed');
          throw error;
        }
      },

      validateSession: async () => {
        const { token, sessionExpiry, user } = get();
        
        // SECURITY: Check token and expiry
        if (!token || !sessionExpiry || !user) {
          get().logout('no_session');
          return false;
        }
        
        if (Date.now() > sessionExpiry) {
          get().logout('session_expired');
          return false;
        }
        
        // SECURITY: Validate with ServiceNow server
        try {
          const isValid = await validateServiceNowSession(token);
          if (!isValid) {
            get().logout('session_invalid');
            return false;
          }
          
          return true;
        } catch (error) {
          get().logout('session_validation_failed');
          return false;
        }
      },

      extendSession: async () => {
        const newExpiry = Date.now() + (8 * 60 * 60 * 1000);
        set({ 
          sessionExpiry: newExpiry,
          sessionWarning: false 
        });
      },

      // Permission Helpers
      hasRole: (role) => {
        const { securityContext } = get();
        return securityContext?.roles.includes(role) || false;
      },

      hasPermission: (permission) => {
        const { securityContext } = get();
        return securityContext?.permissions.includes(permission) || false;
      },

      canAccessTable: (table, operation) => {
        const { securityContext } = get();
        const access = securityContext?.tableAccess.get(table);
        return access ? access[operation] : false;
      },

      canAccessField: (table, field, operation) => {
        const { securityContext } = get();
        const fieldKey = `${table}.${field}`;
        const access = securityContext?.fieldAccess.get(fieldKey);
        return access ? access[operation] : false;
      },

      // Security Event Handling
      handleSecurityEvent: (event) => {
        switch (event.type) {
          case 'session_warning':
            set({ sessionWarning: true });
            break;
          case 'session_expired':
            get().logout('session_expired');
            break;
          case 'permission_denied':
            // Handle permission denied events
            break;
          case 'suspicious_activity':
            // Handle suspicious activity
            get().logout('suspicious_activity');
            break;
        }
      },

      clearSecurityWarnings: () => {
        set({ sessionWarning: false });
      }
    }),
    {
      name: 'secure-servicenow-auth',
      storage: createJSONStorage(() => ({
        getItem: (name) => {
          const item = localStorage.getItem(name);
          return item ? decryptStorageData(item) : null;
        },
        setItem: (name, value) => {
          const encrypted = encryptStorageData(value);
          localStorage.setItem(name, encrypted);
        },
        removeItem: (name) => localStorage.removeItem(name),
      })),
      // SECURITY: Only persist non-sensitive data
      partialize: (state) => ({
        user: state.user,
        sessionExpiry: state.sessionExpiry,
        // Don't persist token or securityContext in storage
      }),
    }
  )
);

// Security monitoring functions
let securityMonitoringInterval: NodeJS.Timeout | null = null;
let lastActivity = Date.now();
let suspiciousActivityCount = 0;

function startSecurityMonitoring(): void {
  // Track user activity
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  const activityHandler = () => {
    lastActivity = Date.now();
    suspiciousActivityCount = 0; // Reset on activity
  };
  
  activityEvents.forEach(event => {
    document.addEventListener(event, activityHandler, { passive: true });
  });
  
  // SECURITY: Periodic security checks
  securityMonitoringInterval = setInterval(async () => {
    const store = useSecureAuthStore.getState();
    const now = Date.now();
    
    // SECURITY: Check for inactivity timeout (30 minutes)
    if (now - lastActivity > 30 * 60 * 1000) {
      store.logout('inactivity_timeout');
      return;
    }
    
    // SECURITY: Session expiry warning (5 minutes before expiry)
    if (store.sessionExpiry && now > store.sessionExpiry - 5 * 60 * 1000) {
      if (!store.sessionWarning) {
        store.handleSecurityEvent({
          type: 'session_warning',
          message: 'Your session will expire in 5 minutes'
        });
      }
    }
    
    // SECURITY: Validate session with server
    const isValid = await store.validateSession();
    if (!isValid) {
      return; // validateSession already handles logout
    }
    
    // SECURITY: Check for suspicious activity patterns
    checkForSuspiciousActivity();
    
  }, 2 * 60 * 1000); // Check every 2 minutes
}

function stopSecurityMonitoring(): void {
  if (securityMonitoringInterval) {
    clearInterval(securityMonitoringInterval);
    securityMonitoringInterval = null;
  }
  
  // Remove activity listeners
  const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  activityEvents.forEach(event => {
    document.removeEventListener(event, () => {});
  });
}

function checkForSuspiciousActivity(): void {
  // SECURITY: Implement suspicious activity detection
  // - Multiple failed requests
  // - Unusual request patterns
  // - Rapid navigation changes
  // - Multiple tabs/windows
  
  const store = useSecureAuthStore.getState();
  
  if (suspiciousActivityCount > 10) {
    store.handleSecurityEvent({
      type: 'suspicious_activity',
      message: 'Suspicious activity detected',
      data: { count: suspiciousActivityCount }
    });
  }
}

// Utility functions
async function authenticateWithServiceNow(credentials?: LoginCredentials) {
  // SECURITY: ServiceNow authentication implementation
  // This would integrate with ServiceNow's authentication system
  const response = await fetch('/api/now/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  
  return response.json();
}

async function refreshServiceNowSession(token: string) {
  const response = await fetch('/api/now/auth/refresh', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Session refresh failed');
  }
  
  return response.json();
}

async function validateServiceNowSession(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/now/auth/validate', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.ok;
  } catch {
    return false;
  }
}

function encryptStorageData(data: string): string {
  // SECURITY: Implement encryption for sensitive data
  // Use Web Crypto API or similar
  return btoa(data); // Simple base64 for demo - use proper encryption
}

function decryptStorageData(data: string): string {
  // SECURITY: Implement decryption
  try {
    return atob(data);
  } catch {
    return data;
  }
}

function clearAllSecureStorage(): void {
  // Clear all security-related storage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('secure-') || key.includes('auth') || key.includes('session')) {
      localStorage.removeItem(key);
    }
  });
}

function invalidateServerSession(): void {
  // SECURITY: Invalidate session on server
  const token = useSecureAuthStore.getState().token;
  if (token) {
    fetch('/api/now/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(() => {}); // Best effort
  }
}

async function auditSecurityEvent(event: string, data: any): Promise<void> {
  try {
    await fetch('/api/now/table/sys_security_event', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-UserToken': (window as any).g_ck
      },
      body: JSON.stringify({
        event_type: event,
        event_data: JSON.stringify(data),
        timestamp: new Date().toISOString(),
        ip_address: (window as any).g_client_ip || 'unknown',
        user_agent: navigator.userAgent
      })
    });
  } catch (error) {
    console.error('Failed to audit security event:', error);
  }
}
```

---

## Secure Component Patterns

### **Role-Based Component Access Control**

```tsx
// components/security/SecureServiceNowComponent.tsx
interface SecureServiceNowComponentProps {
  // Role-based access control
  requiredRole?: string | string[];
  requiredPermission?: string | string[];
  
  // Table/field access control
  requiredTableAccess?: {
    table: string;
    operation: 'read' | 'write' | 'delete' | 'create';
  };
  requiredFieldAccess?: {
    table: string;
    field: string;
    operation: 'read' | 'write';
  };
  
  // Fallback components
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  
  // Children
  children: React.ReactNode;
  
  // Security event handlers
  onAccessDenied?: (reason: string) => void;
  onSecurityEvent?: (event: SecurityEvent) => void;
}

export function SecureServiceNowComponent({
  requiredRole,
  requiredPermission,
  requiredTableAccess,
  requiredFieldAccess,
  fallback,
  loadingFallback,
  children,
  onAccessDenied,
  onSecurityEvent
}: SecureServiceNowComponentProps) {
  const { 
    isAuthenticated, 
    isLoading, 
    hasRole, 
    hasPermission, 
    canAccessTable, 
    canAccessField,
    handleSecurityEvent
  } = useSecureAuthStore();

  // SECURITY: Check authentication first
  if (isLoading) {
    return loadingFallback || <SecurityLoadingSpinner />;
  }

  if (!isAuthenticated) {
    const reason = 'User not authenticated';
    onAccessDenied?.(reason);
    handleSecurityEvent({
      type: 'permission_denied',
      message: reason,
      data: { component: 'SecureServiceNowComponent' }
    });
    return fallback || <AuthenticationRequired />;
  }

  // SECURITY: Check role requirements
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = roles.some(role => hasRole(role));
    
    if (!hasRequiredRole) {
      const reason = `Required role(s): ${roles.join(', ')}`;
      onAccessDenied?.(reason);
      handleSecurityEvent({
        type: 'permission_denied',
        message: reason,
        data: { requiredRoles: roles, component: 'SecureServiceNowComponent' }
      });
      return fallback || <AccessDenied reason={reason} />;
    }
  }

  // SECURITY: Check permission requirements
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const hasRequiredPermission = permissions.some(permission => hasPermission(permission));
    
    if (!hasRequiredPermission) {
      const reason = `Required permission(s): ${permissions.join(', ')}`;
      onAccessDenied?.(reason);
      handleSecurityEvent({
        type: 'permission_denied',
        message: reason,
        data: { requiredPermissions: permissions, component: 'SecureServiceNowComponent' }
      });
      return fallback || <AccessDenied reason={reason} />;
    }
  }

  // SECURITY: Check table access requirements
  if (requiredTableAccess) {
    const hasTableAccess = canAccessTable(
      requiredTableAccess.table, 
      requiredTableAccess.operation
    );
    
    if (!hasTableAccess) {
      const reason = `No ${requiredTableAccess.operation} access to table: ${requiredTableAccess.table}`;
      onAccessDenied?.(reason);
      handleSecurityEvent({
        type: 'permission_denied',
        message: reason,
        data: { tableAccess: requiredTableAccess, component: 'SecureServiceNowComponent' }
      });
      return fallback || <AccessDenied reason={reason} />;
    }
  }

  // SECURITY: Check field access requirements
  if (requiredFieldAccess) {
    const hasFieldAccess = canAccessField(
      requiredFieldAccess.table,
      requiredFieldAccess.field,
      requiredFieldAccess.operation
    );
    
    if (!hasFieldAccess) {
      const reason = `No ${requiredFieldAccess.operation} access to field: ${requiredFieldAccess.table}.${requiredFieldAccess.field}`;
      onAccessDenied?.(reason);
      handleSecurityEvent({
        type: 'permission_denied',
        message: reason,
        data: { fieldAccess: requiredFieldAccess, component: 'SecureServiceNowComponent' }
      });
      return fallback || <AccessDenied reason={reason} />;
    }
  }

  return <>{children}</>;
}

// Usage Examples
export function AdminPanel() {
  return (
    <SecureServiceNowComponent 
      requiredRole="admin"
      fallback={<AccessDenied />}
      onAccessDenied={(reason) => console.warn('Admin access denied:', reason)}
    >
      <AdminDashboard />
    </SecureServiceNowComponent>
  );
}

export function IncidentManagement() {
  return (
    <SecureServiceNowComponent 
      requiredTableAccess={{ table: 'incident', operation: 'read' }}
      fallback={<ReadOnlyView />}
    >
      <IncidentList />
    </SecureServiceNowComponent>
  );
}

export function SensitiveIncidentField() {
  return (
    <SecureServiceNowComponent 
      requiredFieldAccess={{ 
        table: 'incident', 
        field: 'work_notes', 
        operation: 'read' 
      }}
      fallback={<span>[RESTRICTED]</span>}
    >
      <IncidentWorkNotes />
    </SecureServiceNowComponent>
  );
}
```

### **Secure Form Components**

```tsx
// components/forms/SecureServiceNowForm.tsx
interface SecureServiceNowFormProps<T> {
  table: string;
  record?: T;
  onSubmit: (data: Partial<T>) => Promise<void>;
  onCancel?: () => void;
  children: React.ReactNode;
  validateOnBlur?: boolean;
  auditChanges?: boolean;
}

export function SecureServiceNowForm<T extends Record<string, any>>({
  table,
  record,
  onSubmit,
  onCancel,
  children,
  validateOnBlur = true,
  auditChanges = true
}: SecureServiceNowFormProps<T>) {
  const [formData, setFormData] = useState<Partial<T>>(record || {});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData] = useState<Partial<T>>(record || {});
  
  const { canAccessTable, canAccessField } = useSecureAuthStore();

  // SECURITY: Validate table access on mount
  useEffect(() => {
    const operation = record ? 'write' : 'create';
    if (!canAccessTable(table, operation)) {
      throw new ServiceNowSecurityError(
        403,
        'TABLE_ACCESS_DENIED',
        `No ${operation} access to table: ${table}`
      );
    }
  }, [table, record, canAccessTable]);

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    // SECURITY: Validate field access before allowing changes
    if (!canAccessField(table, fieldName, 'write')) {
      console.warn(`No write access to field: ${table}.${fieldName}`);
      return;
    }

    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // SECURITY: Real-time validation on blur
    if (validateOnBlur) {
      validateField(fieldName, value);
    }
  }, [table, canAccessField, validateOnBlur]);

  const validateField = useCallback(async (fieldName: string, value: any): Promise<boolean> => {
    try {
      // SECURITY: Client-side validation (not a security boundary)
      const fieldErrors = validateFieldInput(fieldName, value);
      
      if (fieldErrors.length > 0) {
        setValidationErrors(prev => ({ 
          ...prev, 
          [fieldName]: fieldErrors.join(', ') 
        }));
        return false;
      }
      
      // SECURITY: Clear field errors if validation passes
      setValidationErrors(prev => {
        const { [fieldName]: removed, ...rest } = prev;
        return rest;
      });
      
      return true;
    } catch (error) {
      setValidationErrors(prev => ({ 
        ...prev, 
        [fieldName]: 'Validation error occurred' 
      }));
      return false;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setValidationErrors({});
      
      // SECURITY: Comprehensive client-side validation
      const validationResult = await validateFormData(formData);
      if (!validationResult.isValid) {
        setValidationErrors(validationResult.errors);
        return;
      }
      
      // SECURITY: Sanitize form data
      const sanitizedData = sanitizeFormData(formData);
      
      // SECURITY: Audit form submission attempt
      if (auditChanges) {
        await auditFormSubmission(table, record?.sys_id, sanitizedData, originalData);
      }
      
      // SECURITY: Server-side validation and security checks handled by service layer
      await onSubmit(sanitizedData);
      
    } catch (error) {
      if (error instanceof ServiceNowSecurityError) {
        handleSecurityError(error);
      } else {
        setValidationErrors({ 
          _form: 'An error occurred while saving. Please try again.' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecurityError = (error: ServiceNowSecurityError) => {
    switch (error.code) {
      case 'TABLE_ACCESS_DENIED':
      case 'FIELD_ACCESS_DENIED':
        setValidationErrors({ 
          _form: 'Access denied. You do not have permission to perform this action.' 
        });
        break;
      case 'INVALID_INPUT':
      case 'SQL_INJECTION_DETECTED':
      case 'XSS_DETECTED':
        setValidationErrors({ 
          _form: 'Invalid input detected. Please check your data and try again.' 
        });
        break;
      case 'SENSITIVE_FIELD_ACCESS_DENIED':
        setValidationErrors({ 
          _form: 'Elevated permissions required to modify sensitive fields.' 
        });
        break;
      default:
        setValidationErrors({ 
          _form: 'Security validation failed. Please contact your administrator.' 
        });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="secure-servicenow-form">
      <FormDataProvider 
        value={{ 
          formData, 
          validationErrors, 
          isSubmitting, 
          onFieldChange: handleFieldChange,
          canAccessField: (field: string, operation: 'read' | 'write') => 
            canAccessField(table, field, operation)
        }}
      >
        {children}
      </FormDataProvider>
      
      {/* SECURITY: Display form-level security errors */}
      {validationErrors._form && (
        <div className="form-error" role="alert" aria-live="polite">
          <SecurityIcon />
          <span>{escapeHtml(validationErrors._form)}</span>
        </div>
      )}
      
      <div className="form-actions">
        <button 
          type="submit" 
          disabled={isSubmitting || Object.keys(validationErrors).length > 0}
          className="submit-button"
        >
          {isSubmitting ? <LoadingSpinner /> : (record ? 'Update' : 'Create')}
        </button>
        
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="cancel-button"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// Security utility functions for forms
function validateFieldInput(fieldName: string, value: any): string[] {
  const errors: string[] = [];
  
  if (typeof value !== 'string') return errors;
  
  // SECURITY: XSS detection
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i
  ];
  
  for (const pattern of xssPatterns) {
    if (pattern.test(value)) {
      errors.push('Potentially unsafe content detected');
      break;
    }
  }
  
  // SECURITY: SQL injection detection
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(--|\/\*|\*\/)/,
    /(\b(OR|AND)\b.*=.*)/i,
    /(;|\||&)/
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(value)) {
      errors.push('Invalid characters detected');
      break;
    }
  }
  
  // Field-specific validation
  if (fieldName.toLowerCase().includes('email')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      errors.push('Invalid email format');
    }
  }
  
  return errors;
}

async function validateFormData<T>(data: Partial<T>): Promise<{
  isValid: boolean;
  errors: Record<string, string>;
}> {
  const errors: Record<string, string> = {};
  
  // Validate all fields
  for (const [key, value] of Object.entries(data)) {
    const fieldErrors = validateFieldInput(key, value);
    if (fieldErrors.length > 0) {
      errors[key] = fieldErrors.join(', ');
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

function sanitizeFormData<T>(data: Partial<T>): Partial<T> {
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value) as any;
    } else if (value && typeof value === 'object' && 'value' in value) {
      if (typeof (value as any).value === 'string') {
        (value as any).value = sanitizeString((value as any).value);
      }
    }
  });
  
  return sanitized;
}

function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function auditFormSubmission<T>(
  table: string,
  recordId: string | undefined,
  newData: Partial<T>,
  originalData: Partial<T>
): Promise<void> {
  try {
    const changes = Object.keys(newData).reduce((acc, key) => {
      if (newData[key] !== originalData[key]) {
        acc[key] = {
          old: originalData[key],
          new: newData[key]
        };
      }
      return acc;
    }, {} as Record<string, any>);

    if (Object.keys(changes).length > 0) {
      await auditSecurityEvent('FORM_SUBMISSION', {
        table,
        recordId,
        changes,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to audit form submission:', error);
  }
}
```

---

## Content Security Policy (CSP) Implementation

### **ServiceNow-Optimized CSP Configuration**

```html
<!-- Enhanced CSP for ServiceNow applications -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 
    *.service-now.com 
    *.servicenow.com 
    'nonce-{{NONCE_VALUE}}';
  style-src 'self' 'unsafe-inline' 
    *.service-now.com 
    *.servicenow.com 
    fonts.googleapis.com;
  img-src 'self' data: blob: 
    *.service-now.com 
    *.servicenow.com 
    *.gravatar.com;
  connect-src 'self' 
    *.service-now.com 
    *.servicenow.com 
    wss: ws:;
  font-src 'self' 
    *.service-now.com 
    *.servicenow.com 
    fonts.gstatic.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' *.service-now.com *.servicenow.com;
  frame-ancestors 'self' *.service-now.com *.servicenow.com;
  block-all-mixed-content;
  upgrade-insecure-requests;
">

<!-- Additional security headers -->
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
<meta http-equiv="X-XSS-Protection" content="1; mode=block">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
<meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()">
```

### **CSP Violation Monitoring**

```tsx
// utils/cspSecurityMonitoring.ts
export function setupCSPSecurityMonitoring(): void {
  document.addEventListener('securitypolicyviolation', handleCSPViolation);
  
  // Setup reporting observer for additional security monitoring
  if ('ReportingObserver' in window) {
    const observer = new ReportingObserver((reports) => {
      reports.forEach(report => {
        if (report.type === 'csp-violation') {
          handleCSPViolation(report.body as any);
        }
      });
    });
    observer.observe();
  }
}

function handleCSPViolation(violation: SecurityPolicyViolationEvent): void {
  const violationData = {
    blockedURI: violation.blockedURI,
    documentURI: violation.documentURI,
    effectiveDirective: violation.effectiveDirective,
    originalPolicy: violation.originalPolicy,
    referrer: violation.referrer,
    violatedDirective: violation.violatedDirective,
    sourceFile: violation.sourceFile,
    lineNumber: violation.lineNumber,
    columnNumber: violation.columnNumber,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  };
  
  // SECURITY: Log CSP violation to ServiceNow
  auditSecurityEvent('CSP_VIOLATION', violationData);
  
  // SECURITY: Check for potential attack patterns
  analyzeCSPViolation(violationData);
}

function analyzeCSPViolation(violation: any): void {
  const suspiciousPatterns = [
    'eval',
    'javascript:',
    '<script',
    'data:text/html',
    'vbscript:',
    '.js',
    'inline'
  ];
  
  const blockedContent = violation.blockedURI.toLowerCase();
  const isSuspicious = suspiciousPatterns.some(pattern => 
    blockedContent.includes(pattern)
  );
  
  if (isSuspicious) {
    // SECURITY: Potential XSS attempt detected
    auditSecurityEvent('POTENTIAL_XSS_ATTEMPT', {
      ...violation,
      severity: 'HIGH',
      suspiciousContent: blockedContent
    });
    
    // SECURITY: Consider additional protective measures
    const store = useSecureAuthStore.getState();
    store.handleSecurityEvent({
      type: 'suspicious_activity',
      message: 'Potential XSS attempt detected',
      data: violation
    });
  }
}
```

---

## Security Testing Integration

### **Comprehensive Security Test Suite**

```tsx
// __tests__/security/SecurityIntegration.test.ts
describe('ServiceNow Security Integration', () => {
  describe('Authentication and Authorization', () => {
    it('should enforce RBAC for ServiceNow table access', async () => {
      // Mock user with limited permissions
      mockSecurityContext({
        roles: ['basic_user'],
        tableAccess: new Map([['incident', { read: false, write: false, delete: false, create: false }]])
      });

      await expect(
        secureServiceNowService.getRecords('incident')
      ).rejects.toThrow(ServiceNowSecurityError);
      
      expect(mockAuditSecurityEvent).toHaveBeenCalledWith('TABLE_ACCESS_DENIED', 
        expect.objectContaining({ table: 'incident' })
      );
    });

    it('should allow access with proper roles', async () => {
      mockSecurityContext({
        roles: ['incident_manager'],
        tableAccess: new Map([['incident', { read: true, write: true, delete: false, create: true }]])
      });

      const records = await secureServiceNowService.getRecords('incident');
      expect(records).toBeDefined();
    });

    it('should apply row-level security filters', async () => {
      mockSecurityContext({
        user: { sys_id: 'user123', department: 'IT' },
        roles: ['basic_user'],
        isAdmin: false
      });

      await secureServiceNowService.getRecords('incident');
      
      expect(mockServiceNowRequest).toHaveBeenCalledWith(
        expect.stringContaining('caller_id=user123^ORassigned_to=user123')
      );
    });

    it('should mask sensitive fields for unauthorized users', async () => {
      mockSecurityContext({
        roles: ['basic_user'],
        fieldAccess: new Map([['incident.work_notes', { read: false, write: false }]])
      });

      const records = await secureServiceNowService.getRecords('incident');
      
      expect(records.result[0].work_notes.display_value).toBe('[RESTRICTED]');
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should prevent XSS attacks', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      await expect(
        secureServiceNowService.updateRecord('incident', 'inc123', {
          short_description: maliciousInput
        })
      ).rejects.toThrow('Invalid characters detected');
    });

    it('should prevent SQL injection', async () => {
      const sqlInjection = "'; DROP TABLE incidents; --";
      
      await expect(
        secureServiceNowService.getRecords('incident', {
          query: `short_descriptionLIKE${sqlInjection}`
        })
      ).rejects.toThrow(ServiceNowSecurityError);
    });

    it('should sanitize string inputs', () => {
      const input = '<script>alert("test")</script>';
      const sanitized = sanitizeString(input);
      
      expect(sanitized).toBe('&lt;script&gt;alert("test")&lt;/script&gt;');
      expect(sanitized).not.toContain('<script');
    });

    it('should validate field formats', async () => {
      await expect(
        secureServiceNowService.updateRecord('sys_user', 'user123', {
          email: 'invalid-email-format'
        })
      ).rejects.toThrow('INVALID_EMAIL_FORMAT');
    });
  });

  describe('Session Management', () => {
    it('should validate session before operations', async () => {
      mockExpiredSession();
      
      await expect(
        secureServiceNowService.getRecords('incident')
      ).rejects.toThrow('SESSION_INVALID');
    });

    it('should handle session refresh automatically', async () => {
      mockSessionNearExpiry();
      
      const store = useSecureAuthStore.getState();
      await store.refreshSession();
      
      expect(mockRefreshServiceNowSession).toHaveBeenCalled();
    });

    it('should log out user on suspicious activity', async () => {
      const store = useSecureAuthStore.getState();
      
      // Simulate suspicious activity
      store.handleSecurityEvent({
        type: 'suspicious_activity',
        message: 'Multiple failed requests detected'
      });
      
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('API Security', () => {
    it('should enforce rate limiting', async () => {
      // Make requests beyond rate limit
      const requests = Array.from({ length: 61 }, () => 
        secureServiceNowService.getRecords('incident', { limit: 1 })
      );
      
      await expect(Promise.all(requests)).rejects.toThrow('RATE_LIMIT_EXCEEDED');
    });

    it('should validate request endpoints', async () => {
      await expect(
        secureServiceNowService.request('/api/malicious/endpoint')
      ).rejects.toThrow('INVALID_ENDPOINT');
    });

    it('should prevent path traversal attacks', async () => {
      await expect(
        secureServiceNowService.request('/api/now/table/../../../etc/passwd')
      ).rejects.toThrow('INVALID_PATH');
    });
  });

  describe('Audit Logging', () => {
    it('should audit successful data access', async () => {
      mockSecurityContext({ roles: ['incident_manager'] });
      
      await secureServiceNowService.getRecords('incident');
      
      expect(mockAuditSecurityEvent).toHaveBeenCalledWith('DATA_ACCESS', 
        expect.objectContaining({
          table: 'incident',
          operation: 'read'
        })
      );
    });

    it('should audit failed security events', async () => {
      mockSecurityContext({ roles: ['basic_user'] });
      
      try {
        await secureServiceNowService.updateRecord('incident', 'inc123', {});
      } catch (error) {
        // Expected error
      }
      
      expect(mockAuditSecurityEvent).toHaveBeenCalledWith('SECURITY_VIOLATION', 
        expect.objectContaining({
          error: 'TABLE_ACCESS_DENIED'
        })
      );
    });
  });

  describe('Component Security', () => {
    it('should enforce component-level access control', () => {
      mockSecurityContext({ roles: ['basic_user'] });
      
      render(
        <SecureServiceNowComponent requiredRole="admin">
          <AdminPanel />
        </SecureServiceNowComponent>
      );
      
      expect(screen.getByText(/access denied/i)).toBeInTheDocument();
      expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
    });

    it('should validate form field access', async () => {
      mockSecurityContext({
        fieldAccess: new Map([['incident.work_notes', { read: false, write: false }]])
      });
      
      const onSubmit = jest.fn();
      
      render(
        <SecureServiceNowForm table="incident" onSubmit={onSubmit}>
          <FormField name="work_notes" />
        </SecureServiceNowForm>
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });
  });

  describe('CSP and XSS Protection', () => {
    it('should detect CSP violations', () => {
      const mockViolation = {
        blockedURI: 'https://malicious.com/script.js',
        violatedDirective: 'script-src',
        effectiveDirective: 'script-src'
      };
      
      handleCSPViolation(mockViolation as any);
      
      expect(mockAuditSecurityEvent).toHaveBeenCalledWith('CSP_VIOLATION', 
        expect.objectContaining({
          blockedURI: 'https://malicious.com/script.js'
        })
      );
    });

    it('should identify potential XSS attempts', () => {
      const xssViolation = {
        blockedURI: 'javascript:alert("xss")',
        violatedDirective: 'script-src'
      };
      
      analyzeCSPViolation(xssViolation);
      
      expect(mockAuditSecurityEvent).toHaveBeenCalledWith('POTENTIAL_XSS_ATTEMPT', 
        expect.objectContaining({
          severity: 'HIGH'
        })
      );
    });
  });
});

// Security test utilities
function mockSecurityContext(context: Partial<SecurityContext>): void {
  const defaultContext: SecurityContext = {
    user: { sys_id: 'user123', name: 'Test User', roles: [], groups: [] },
    roles: [],
    groups: [],
    permissions: [],
    tableAccess: new Map(),
    fieldAccess: new Map(),
    isAdmin: false,
    lastValidated: Date.now(),
    ...context
  };
  
  jest.spyOn(serviceNowSecurityService, 'getCurrentSecurityContext')
    .mockResolvedValue(defaultContext);
}

function mockExpiredSession(): void {
  useSecureAuthStore.setState({
    sessionExpiry: Date.now() - 1000 // Expired 1 second ago
  });
}

function mockSessionNearExpiry(): void {
  useSecureAuthStore.setState({
    sessionExpiry: Date.now() + 2 * 60 * 1000 // Expires in 2 minutes
  });
}
```

---

## Security Implementation Checklist

### **✅ MANDATORY Security Implementation Checklist**

**Authentication & Session Management:**
- [ ] **ServiceNow RBAC integration** - Roles, groups, and permissions validation
- [ ] **Secure session management** - Token validation, refresh, and expiry
- [ ] **Multi-factor authentication** - Integration with ServiceNow MFA
- [ ] **Session monitoring** - Inactivity timeout and suspicious activity detection
- [ ] **Secure logout** - Complete session cleanup and server invalidation

**Authorization & Access Control:**
- [ ] **Table-level access control** - CRUD operations based on ServiceNow ACLs
- [ ] **Field-level security** - Read/write permissions per field
- [ ] **Row-level security** - Record access based on user context
- [ ] **Component-level protection** - Role-based UI component rendering
- [ ] **API endpoint validation** - Whitelist allowed endpoints and operations

**Input Validation & Sanitization:**
- [ ] **XSS prevention** - Input sanitization and output encoding
- [ ] **SQL injection protection** - Query parameterization and validation
- [ ] **Path traversal prevention** - File path validation and restriction
- [ ] **Data format validation** - Email, phone, URL format checking
- [ ] **Business rule validation** - Integration with ServiceNow validation rules

**API Security:**
- [ ] **Rate limiting** - Request throttling per user/session
- [ ] **Request validation** - Header, parameter, and payload validation
- [ ] **CSRF protection** - Token-based cross-site request forgery prevention
- [ ] **Secure headers** - Security-related HTTP headers
- [ ] **Error handling** - No sensitive information leakage in errors

**Data Protection:**
- [ ] **Sensitive data masking** - Field-level data protection
- [ ] **Encryption in transit** - HTTPS/TLS for all communications
- [ ] **Secure storage** - Encrypted local storage for sensitive data
- [ ] **Audit logging** - Comprehensive security event logging
- [ ] **Data retention policies** - Automatic cleanup of sensitive data

**Frontend Security:**
- [ ] **Content Security Policy** - CSP headers and violation monitoring
- [ ] **Secure component patterns** - Security-aware React components
- [ ] **Safe rendering** - XSS protection in dynamic content
- [ ] **Secure state management** - Protected authentication and session state
- [ ] **Third-party security** - Validation of external dependencies

**Monitoring & Compliance:**
- [ ] **Security event monitoring** - Real-time threat detection
- [ ] **Failed authentication tracking** - Brute force attack detection
- [ ] **Suspicious activity alerts** - Anomaly detection and response
- [ ] **Compliance reporting** - GDPR, HIPAA, SOX compliance validation
- [ ] **Security metrics dashboard** - Key security indicators and trends

**Testing & Validation:**
- [ ] **Security unit tests** - Comprehensive security scenario testing
- [ ] **Penetration testing** - Regular security vulnerability assessment
- [ ] **Accessibility security** - WCAG compliance with security considerations
- [ ] **Performance security** - Security measures impact on performance
- [ ] **Integration testing** - End-to-end security workflow validation

---

## Integration with Security Governance

This security-by-design implementation integrates seamlessly with **[Security Governance Overview](security-governance-overview.md)** to provide:

### **Policy Enforcement Integration**
```tsx
// Automatic policy enforcement in security service
const governanceDecision = await securityGovernanceService.enforceSecurityGovernance(
  { type: 'DATA_ACCESS', table: 'incident', operation: 'read' },
  securityContext
);

if (governanceDecision.action === 'DENY') {
  throw new ServiceNowSecurityError(403, 'POLICY_VIOLATION', governanceDecision.reasons.join(', '));
}
```

### **Risk Assessment Integration**
- **Automatic risk scoring** - Based on user behavior and data sensitivity
- **Dynamic access control** - Risk-based access decisions
- **Threat intelligence** - Integration with security threat feeds

### **Compliance Validation**
- **Real-time compliance checking** - GDPR, HIPAA, SOX validation
- **Automated reporting** - Compliance dashboard and audit reports
- **Policy management** - Dynamic security policy updates

---

## Advanced Security Patterns

### **🛡️ Extended Security Architecture**

For advanced security implementations beyond basic security-by-design, explore these specialized patterns:

**📁 [Advanced Security Patterns](security/)**
- **[Zero Trust Architecture](security/zero-trust-architecture.md)** *(6 min)* - Never trust, always verify approach
- **[Behavioral Anomaly Detection](security/behavioral-anomaly-detection.md)** *(6 min)* - ML-powered user behavior analysis  
- **[Supply Chain Security](security/supply-chain-security.md)** *(5 min)* - Dependency and build pipeline security

These advanced patterns build upon the security-by-design foundation to provide enterprise-grade threat detection, zero trust architecture, and supply chain security for mission-critical ServiceNow applications.

---

*Security-by-design ensures comprehensive protection for ServiceNow applications through multi-layered defense strategies, from platform integration to frontend protection. Combined with Security Governance Overview, this provides enterprise-grade security architecture for handling sensitive business data and meeting regulatory compliance requirements.* 🛡️