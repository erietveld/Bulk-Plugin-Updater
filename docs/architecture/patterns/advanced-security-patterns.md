---
title: "Advanced Security Patterns"
version: "2025.1.0"
introduced: "2024.4.0"
purpose: "Comprehensive security implementation patterns for ServiceNow React applications"
readTime: "8 minutes"
complexity: "advanced"
status: "ACTIVE"
criticality: "MANDATORY"
prerequisites: ["core-principles", "authentication"]
tags: ["security", "zero-trust", "anomaly-detection", "supply-chain", "servicenow"]
breaking-changes: ["Refactored into focused security modules for better LLM optimization"]
---

# Advanced Security Patterns

**Purpose:** Comprehensive security implementation patterns for ServiceNow React applications  
**Read time:** ~8 minutes  
**Prerequisites:** [Core Principles](../core-principles.md), [Authentication](authentication.md)

---

## 🛡️ Security-First Architecture

Modern ServiceNow applications require comprehensive security patterns that go beyond basic authentication. This guide covers advanced security implementations including zero-trust architecture, behavioral anomaly detection, and supply chain security.

### **Security Architecture Overview**
```
┌─────────────────────────────────────────────┐
│ Frontend Security Layer                     │
│ ├── Content Security Policy (CSP)          │
│ ├── XSS Protection                         │
│ ├── CSRF Mitigation                        │
│ └── Input Validation & Sanitization        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ Application Security Layer                  │
│ ├── Zero Trust Authentication              │
│ ├── Role-Based Access Control              │
│ ├── Session Management                     │
│ └── API Security                           │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ ServiceNow Platform Security               │
│ ├── ACL Enforcement                        │
│ ├── Business Rule Security                 │
│ ├── Data Access Controls                   │
│ └── Audit Logging                          │
└─────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Security Implementation

### **Phase 1: Essential Security (15 minutes)**
```tsx
// 1. Content Security Policy (5 min)
// public/index.html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self' *.service-now.com;
  script-src 'self' 'unsafe-inline' *.service-now.com;
  style-src 'self' 'unsafe-inline' *.service-now.com;
  img-src 'self' data: *.service-now.com;
  connect-src 'self' *.service-now.com;
  font-src 'self' *.service-now.com;
  frame-ancestors 'self' *.service-now.com;
">

// 2. XSS Protection Hook (5 min)
function useXSSProtection() {
  const sanitizeHtml = useCallback((dirty: string): string => {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'title'],
      ALLOW_DATA_ATTR: false
    });
  }, []);

  const sanitizeInput = useCallback((input: string): string => {
    return input
      .replace(/[<>\"']/g, '') // Remove dangerous characters
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim();
  }, []);

  return { sanitizeHtml, sanitizeInput };
}

// 3. CSRF Protection (5 min)
function useCSRFProtection() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    // Get CSRF token from ServiceNow
    const token = (window as any).g_ck;
    if (token) {
      setCsrfToken(token);
    }
  }, []);

  const getSecureHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'X-UserToken': csrfToken || '',
      'X-Requested-With': 'XMLHttpRequest'
    };
  }, [csrfToken]);

  return { csrfToken, getSecureHeaders };
}
```

### **Phase 2: Zero Trust Implementation (20 minutes)**
```tsx
// Zero Trust Authentication Store
interface ZeroTrustState {
  // Trust Score (0-100)
  trustScore: number;
  // Risk Factors
  riskFactors: RiskFactor[];
  // Adaptive Controls
  adaptiveControls: AdaptiveControl[];
  // Continuous Verification
  verificationRequired: boolean;
}

interface RiskFactor {
  type: 'location' | 'device' | 'behavior' | 'time' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number; // Impact on trust score
  timestamp: string;
}

const useZeroTrustStore = create<ZeroTrustState>()((set, get) => ({
  trustScore: 100,
  riskFactors: [],
  adaptiveControls: [],
  verificationRequired: false,

  // Continuous trust evaluation
  evaluateTrust: () => {
    const { riskFactors } = get();
    let score = 100;

    riskFactors.forEach(factor => {
      switch (factor.severity) {
        case 'critical': score -= 30; break;
        case 'high': score -= 20; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    const finalScore = Math.max(0, score);
    set({ 
      trustScore: finalScore,
      verificationRequired: finalScore < 70 // Require re-auth below 70
    });

    return finalScore;
  },

  addRiskFactor: (factor: RiskFactor) => {
    set(state => ({
      riskFactors: [...state.riskFactors, factor]
    }));
    get().evaluateTrust();
  },

  removeRiskFactor: (type: RiskFactor['type']) => {
    set(state => ({
      riskFactors: state.riskFactors.filter(f => f.type !== type)
    }));
    get().evaluateTrust();
  }
}));

// Zero Trust Hook
function useZeroTrust() {
  const { 
    trustScore, 
    riskFactors, 
    verificationRequired,
    evaluateTrust,
    addRiskFactor,
    removeRiskFactor
  } = useZeroTrustStore();

  // Device fingerprinting
  useEffect(() => {
    const deviceFingerprint = generateDeviceFingerprint();
    const storedFingerprint = localStorage.getItem('device_fingerprint');

    if (storedFingerprint !== deviceFingerprint) {
      addRiskFactor({
        type: 'device',
        severity: 'medium',
        score: 15,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('device_fingerprint', deviceFingerprint);
    }
  }, [addRiskFactor]);

  // Location monitoring
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        const location = `${latitude},${longitude}`;
        const lastLocation = localStorage.getItem('last_location');

        if (lastLocation && calculateDistance(lastLocation, location) > 100) {
          addRiskFactor({
            type: 'location',
            severity: 'high',
            score: 25,
            timestamp: new Date().toISOString()
          });
        }
        localStorage.setItem('last_location', location);
      });
    }
  }, [addRiskFactor]);

  // Time-based risk assessment
  useEffect(() => {
    const hour = new Date().getHours();
    const isOffHours = hour < 6 || hour > 22; // Outside 6 AM - 10 PM

    if (isOffHours) {
      addRiskFactor({
        type: 'time',
        severity: 'low',
        score: 5,
        timestamp: new Date().toISOString()
      });
    } else {
      removeRiskFactor('time');
    }
  }, [addRiskFactor, removeRiskFactor]);

  return {
    trustScore,
    riskFactors,
    verificationRequired,
    isHighRisk: trustScore < 50,
    isMediumRisk: trustScore >= 50 && trustScore < 70,
    isLowRisk: trustScore >= 70,
    evaluateTrust
  };
}

function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx?.fillText('Device fingerprint', 10, 10);
  
  return btoa(JSON.stringify({
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: canvas.toDataURL()
  }));
}
```

### **Phase 3: Behavioral Anomaly Detection (15 minutes)**
```tsx
// Behavioral Analytics Store
interface BehaviorPattern {
  action: string;
  timestamp: string;
  context: Record<string, any>;
  location: string;
  duration: number;
}

interface AnomalyAlert {
  type: 'unusual_location' | 'off_hours_access' | 'rapid_actions' | 'data_exfiltration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
  timestamp: string;
  details: string;
}

const useBehaviorStore = create<{
  patterns: BehaviorPattern[];
  anomalies: AnomalyAlert[];
  baseline: Record<string, any>;
}>()((set, get) => ({
  patterns: [],
  anomalies: [],
  baseline: {},

  recordAction: (action: string, context: Record<string, any> = {}) => {
    const pattern: BehaviorPattern = {
      action,
      timestamp: new Date().toISOString(),
      context,
      location: window.location.pathname,
      duration: context.duration || 0
    };

    set(state => ({
      patterns: [...state.patterns.slice(-999), pattern] // Keep last 1000 actions
    }));

    // Check for anomalies
    get().detectAnomalies(pattern);
  },

  detectAnomalies: (newPattern: BehaviorPattern) => {
    const { patterns, baseline } = get();
    const anomalies: AnomalyAlert[] = [];

    // Rapid action detection
    const recentActions = patterns.filter(p => 
      Date.now() - new Date(p.timestamp).getTime() < 60000 // Last minute
    );
    
    if (recentActions.length > 20) {
      anomalies.push({
        type: 'rapid_actions',
        severity: 'high',
        confidence: 0.9,
        timestamp: new Date().toISOString(),
        details: `${recentActions.length} actions in the last minute`
      });
    }

    // Unusual time access
    const hour = new Date().getHours();
    const userHours = patterns.map(p => new Date(p.timestamp).getHours());
    const avgHour = userHours.reduce((a, b) => a + b, 0) / userHours.length;
    
    if (Math.abs(hour - avgHour) > 4) {
      anomalies.push({
        type: 'off_hours_access',
        severity: 'medium',
        confidence: 0.7,
        timestamp: new Date().toISOString(),
        details: `Access at ${hour}:00, usual time is around ${Math.round(avgHour)}:00`
      });
    }

    // Data exfiltration detection
    if (newPattern.action === 'data_export' || newPattern.action === 'bulk_download') {
      const exportActions = patterns.filter(p => 
        p.action.includes('export') || p.action.includes('download')
      );
      
      if (exportActions.length > 5) {
        anomalies.push({
          type: 'data_exfiltration',
          severity: 'critical',
          confidence: 0.95,
          timestamp: new Date().toISOString(),
          details: `${exportActions.length} data export actions detected`
        });
      }
    }

    if (anomalies.length > 0) {
      set(state => ({
        anomalies: [...state.anomalies, ...anomalies]
      }));

      // Trigger security response
      anomalies.forEach(anomaly => {
        if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
          triggerSecurityResponse(anomaly);
        }
      });
    }
  }
}));

function triggerSecurityResponse(anomaly: AnomalyAlert) {
  // Log to security system
  console.warn('Security Anomaly Detected:', anomaly);
  
  // Could trigger:
  // - Additional authentication requirements
  // - Session termination
  // - Administrator alerts
  // - Automated incident creation in ServiceNow
}

// Behavioral Monitoring Hook
function useBehaviorMonitoring() {
  const { recordAction, patterns, anomalies } = useBehaviorStore();

  // Track user interactions
  useEffect(() => {
    const trackInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      const action = `${event.type}_${target.tagName.toLowerCase()}`;
      
      recordAction(action, {
        elementId: target.id,
        className: target.className,
        path: window.location.pathname
      });
    };

    const events = ['click', 'submit', 'change'];
    events.forEach(event => {
      document.addEventListener(event, trackInteraction);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackInteraction);
      });
    };
  }, [recordAction]);

  return {
    recordAction,
    patterns: patterns.slice(-50), // Return last 50 actions
    anomalies: anomalies.filter(a => 
      Date.now() - new Date(a.timestamp).getTime() < 3600000 // Last hour
    ),
    hasHighRiskAnomalies: anomalies.some(a => 
      a.severity === 'critical' || a.severity === 'high'
    )
  };
}
```

---

## 🔒 Supply Chain Security

### **Dependency Security Monitoring**
```tsx
// package.json security configuration
{
  "scripts": {
    "security:audit": "npm audit --audit-level moderate",
    "security:fix": "npm audit fix",
    "security:check": "npm run security:audit && npx retire --exitwith 1",
    "security:report": "npm audit --json > audit-report.json"
  },
  "devDependencies": {
    "retire": "^3.0.0",
    "audit-ci": "^6.6.1",
    "snyk": "^1.1000.0"
  }
}

// Security scanning in CI/CD
// .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run security:check
      - run: npx audit-ci --config audit-ci.json
```

### **Runtime Security Monitoring**
```tsx
// Security monitoring service
class SecurityMonitoringService {
  private static instance: SecurityMonitoringService;
  private violations: SecurityViolation[] = [];

  static getInstance(): SecurityMonitoringService {
    if (!this.instance) {
      this.instance = new SecurityMonitoringService();
    }
    return this.instance;
  }

  monitorCSPViolations() {
    document.addEventListener('securitypolicyviolation', (event) => {
      const violation: SecurityViolation = {
        type: 'csp_violation',
        severity: 'high',
        timestamp: new Date().toISOString(),
        details: {
          directive: event.violatedDirective,
          blocked: event.blockedURI,
          source: event.sourceFile,
          line: event.lineNumber
        }
      };

      this.reportViolation(violation);
    });
  }

  monitorXSSAttempts() {
    // Monitor for common XSS patterns in inputs
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi
    ];

    const checkInput = (value: string) => {
      dangerousPatterns.forEach(pattern => {
        if (pattern.test(value)) {
          this.reportViolation({
            type: 'xss_attempt',
            severity: 'critical',
            timestamp: new Date().toISOString(),
            details: { pattern: pattern.source, value }
          });
        }
      });
    };

    // Monitor all input fields
    document.addEventListener('input', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.type === 'text' || target.tagName === 'TEXTAREA') {
        checkInput(target.value);
      }
    });
  }

  private reportViolation(violation: SecurityViolation) {
    this.violations.push(violation);
    
    // Report to ServiceNow security incident table
    fetch('/api/now/table/incident', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-UserToken': (window as any).g_ck
      },
      body: JSON.stringify({
        category: 'Security',
        subcategory: 'Web Application Security',
        short_description: `Security Violation: ${violation.type}`,
        description: JSON.stringify(violation, null, 2),
        priority: violation.severity === 'critical' ? '1' : '2',
        state: '1' // New
      })
    });

    console.error('Security Violation:', violation);
  }

  getViolations(): SecurityViolation[] {
    return this.violations;
  }
}

interface SecurityViolation {
  type: 'csp_violation' | 'xss_attempt' | 'data_exfiltration' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  details: Record<string, any>;
}

// Initialize security monitoring
const securityMonitor = SecurityMonitoringService.getInstance();
securityMonitor.monitorCSPViolations();
securityMonitor.monitorXSSAttempts();
```

---

## 🛡️ Security Implementation Checklist

### **Frontend Security** ✅
- [ ] **Content Security Policy** - Restrictive CSP headers implemented
- [ ] **XSS Protection** - Input sanitization and output encoding
- [ ] **CSRF Protection** - Anti-CSRF tokens on all forms
- [ ] **Input Validation** - Client and server-side validation
- [ ] **Secure Headers** - Security headers configured
- [ ] **Dependency Scanning** - Regular security audits

### **Authentication & Authorization** ✅
- [ ] **Zero Trust Model** - Never trust, always verify
- [ ] **Multi-Factor Authentication** - Required for sensitive operations
- [ ] **Session Management** - Secure session handling
- [ ] **Role-Based Access** - Granular permissions
- [ ] **Continuous Verification** - Dynamic trust scoring
- [ ] **Adaptive Controls** - Risk-based security measures

### **Monitoring & Response** ✅
- [ ] **Behavioral Analytics** - Anomaly detection
- [ ] **Security Logging** - Comprehensive audit trails
- [ ] **Incident Response** - Automated security responses
- [ ] **Threat Detection** - Real-time monitoring
- [ ] **Vulnerability Management** - Regular security assessments
- [ ] **Compliance Monitoring** - Regulatory compliance tracking

---

## 🚨 Security Response Automation

### **Automated Incident Response**
```tsx
// Automated security response system
interface SecurityIncident {
  id: string;
  type: 'anomaly' | 'violation' | 'breach' | 'threat';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  userId: string;
  details: Record<string, any>;
  actions: SecurityAction[];
}

interface SecurityAction {
  type: 'terminate_session' | 'require_mfa' | 'block_user' | 'alert_admin' | 'log_incident';
  executed: boolean;
  timestamp: string;
}

class SecurityResponseService {
  async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    const actions = this.determineActions(incident);
    
    for (const action of actions) {
      await this.executeAction(action, incident);
    }

    // Create ServiceNow security incident
    await this.createServiceNowIncident(incident);
  }

  private determineActions(incident: SecurityIncident): SecurityAction[] {
    const actions: SecurityAction[] = [];

    switch (incident.severity) {
      case 'critical':
        actions.push(
          { type: 'terminate_session', executed: false, timestamp: new Date().toISOString() },
          { type: 'block_user', executed: false, timestamp: new Date().toISOString() },
          { type: 'alert_admin', executed: false, timestamp: new Date().toISOString() },
          { type: 'log_incident', executed: false, timestamp: new Date().toISOString() }
        );
        break;

      case 'high':
        actions.push(
          { type: 'require_mfa', executed: false, timestamp: new Date().toISOString() },
          { type: 'alert_admin', executed: false, timestamp: new Date().toISOString() },
          { type: 'log_incident', executed: false, timestamp: new Date().toISOString() }
        );
        break;

      case 'medium':
        actions.push(
          { type: 'require_mfa', executed: false, timestamp: new Date().toISOString() },
          { type: 'log_incident', executed: false, timestamp: new Date().toISOString() }
        );
        break;

      case 'low':
        actions.push(
          { type: 'log_incident', executed: false, timestamp: new Date().toISOString() }
        );
        break;
    }

    return actions;
  }

  private async executeAction(action: SecurityAction, incident: SecurityIncident): Promise<void> {
    try {
      switch (action.type) {
        case 'terminate_session':
          await this.terminateUserSession(incident.userId);
          break;

        case 'require_mfa':
          await this.requireMultiFactorAuth(incident.userId);
          break;

        case 'block_user':
          await this.blockUser(incident.userId);
          break;

        case 'alert_admin':
          await this.alertAdministrators(incident);
          break;

        case 'log_incident':
          await this.logSecurityIncident(incident);
          break;
      }

      action.executed = true;
    } catch (error) {
      console.error(`Failed to execute security action ${action.type}:`, error);
    }
  }

  private async terminateUserSession(userId: string): Promise<void> {
    // Terminate user session through ServiceNow API
    await fetch(`/api/now/user/session/${userId}/terminate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-UserToken': (window as any).g_ck
      }
    });
  }

  private async requireMultiFactorAuth(userId: string): Promise<void> {
    // Set MFA requirement flag
    const { useZeroTrustStore } = await import('./useZeroTrustStore');
    useZeroTrustStore.getState().setVerificationRequired(true);
  }

  private async blockUser(userId: string): Promise<void> {
    // Block user through ServiceNow API
    await fetch(`/api/now/table/sys_user/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-UserToken': (window as any).g_ck
      },
      body: JSON.stringify({
        locked_out: true,
        active: false
      })
    });
  }

  private async createServiceNowIncident(incident: SecurityIncident): Promise<void> {
    await fetch('/api/now/table/incident', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-UserToken': (window as any).g_ck
      },
      body: JSON.stringify({
        category: 'Security',
        subcategory: 'Security Incident',
        short_description: `Security Incident: ${incident.type}`,
        description: JSON.stringify(incident, null, 2),
        priority: incident.severity === 'critical' ? '1' : incident.severity === 'high' ? '2' : '3',
        state: '1', // New
        caller_id: incident.userId
      })
    });
  }
}

export const securityResponseService = new SecurityResponseService();
```

---

## 📊 Security Metrics & Monitoring

### **Security Dashboard Component**
```tsx
function SecurityDashboard() {
  const { trustScore, riskFactors } = useZeroTrust();
  const { anomalies, hasHighRiskAnomalies } = useBehaviorMonitoring();
  const [violations, setViolations] = useState<SecurityViolation[]>([]);

  useEffect(() => {
    const monitor = SecurityMonitoringService.getInstance();
    const interval = setInterval(() => {
      setViolations(monitor.getViolations());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="security-dashboard">
      <div className="security-metrics">
        <div className={`trust-score ${trustScore < 50 ? 'critical' : trustScore < 70 ? 'warning' : 'good'}`}>
          <h3>Trust Score</h3>
          <div className="score">{trustScore}/100</div>
        </div>

        <div className="risk-factors">
          <h3>Active Risk Factors</h3>
          <ul>
            {riskFactors.map((factor, index) => (
              <li key={index} className={`risk-factor risk-factor--${factor.severity}`}>
                {factor.type}: {factor.severity}
              </li>
            ))}
          </ul>
        </div>

        <div className="anomaly-alerts">
          <h3>Anomaly Alerts</h3>
          {hasHighRiskAnomalies && (
            <div className="alert alert--critical">
              High-risk anomalies detected!
            </div>
          )}
          <ul>
            {anomalies.slice(0, 5).map((anomaly, index) => (
              <li key={index} className={`anomaly anomaly--${anomaly.severity}`}>
                {anomaly.type}: {anomaly.details}
              </li>
            ))}
          </ul>
        </div>

        <div className="security-violations">
          <h3>Security Violations</h3>
          <ul>
            {violations.slice(0, 5).map((violation, index) => (
              <li key={index} className={`violation violation--${violation.severity}`}>
                {violation.type}: {new Date(violation.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 Implementation Priority

### **Critical (Implement First)**
1. **Content Security Policy** - Prevent XSS attacks
2. **Input Sanitization** - Validate all user inputs
3. **CSRF Protection** - Secure form submissions
4. **Authentication Security** - Proper token handling

### **High Priority (Next)**
1. **Zero Trust Architecture** - Continuous verification
2. **Behavioral Monitoring** - Anomaly detection
3. **Security Monitoring** - Real-time threat detection
4. **Incident Response** - Automated security responses

### **Medium Priority (Later)**
1. **Supply Chain Security** - Dependency monitoring
2. **Advanced Analytics** - ML-powered threat detection
3. **Compliance Monitoring** - Regulatory compliance
4. **Security Metrics** - Comprehensive reporting

---

*Security is not optional in modern ServiceNow applications. Implement these patterns progressively, starting with the critical security controls and building toward a comprehensive security posture.*