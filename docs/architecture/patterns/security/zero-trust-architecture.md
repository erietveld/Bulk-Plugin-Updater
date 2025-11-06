---
title: "Zero Trust Architecture for ServiceNow"
purpose: "Implement never-trust-always-verify security model for ServiceNow applications"
readTime: "6 minutes"
complexity: "advanced"
prerequisites: ["security-by-design"]
tags: ["zero-trust", "authentication", "authorization", "security"]
---

# Zero Trust Architecture for ServiceNow

**Purpose:** Implement never-trust-always-verify security model for ServiceNow applications  
**Read time:** ~6 minutes  
**Prerequisites:** [Security-by-Design](../security-by-design.md)

---

## 🎯 Zero Trust Principles (1 minute)

### **Core Philosophy: Never Trust, Always Verify**
```
Traditional Security: "Trust but verify"
├── Assumes internal network is safe
├── Perimeter-based security
└── Static access controls

Zero Trust Security: "Never trust, always verify"  
├── Assume breach has occurred
├── Verify every request, every time
├── Dynamic, context-aware decisions
└── Continuous monitoring and validation
```

### **ServiceNow Zero Trust Implementation**
- **Identity Verification** - Multi-factor authentication + behavioral analysis
- **Device Trust** - Managed device requirements + health assessment
- **Network Context** - Location, IP reputation, geographic analysis
- **Resource Sensitivity** - Data classification + access requirements
- **Continuous Validation** - Real-time risk assessment + adaptive controls

---

## 🏗️ Zero Trust Service Implementation (3 minutes)

### **Core Zero Trust Service**
```tsx
// services/security/ZeroTrustSecurityService.ts
export class ZeroTrustSecurityService extends SecurityService {
  private readonly trustScore = new Map<string, number>();
  private readonly riskCache = new Map<string, RiskAssessment>();

  /**
   * Zero Trust validation for every ServiceNow request
   */
  async validateZeroTrustRequest(
    operation: string,
    resource: string, 
    context: SecurityContext
  ): Promise<ZeroTrustValidation> {
    // 1. Identity verification (strong authentication required)
    const identityScore = await this.verifyIdentity(context);
    
    // 2. Device trust assessment (managed devices preferred)
    const deviceScore = await this.assessDeviceTrust(context);
    
    // 3. Network context analysis (corporate networks trusted more)
    const networkScore = await this.analyzeNetworkContext(context);
    
    // 4. Behavioral analysis (detect anomalies)
    const behaviorScore = await this.analyzeBehavior(context, operation);
    
    // 5. Resource sensitivity (classify data sensitivity)
    const resourceSensitivity = await this.assessResourceSensitivity(resource);
    
    // Calculate overall trust score
    const overallTrustScore = this.calculateTrustScore({
      identity: identityScore,
      device: deviceScore,
      network: networkScore,
      behavior: behaviorScore
    });

    // Make access decision based on trust score and resource sensitivity
    return {
      trustScore: overallTrustScore,
      riskLevel: this.calculateRiskLevel(overallTrustScore, resourceSensitivity),
      accessDecision: this.makeAccessDecision(overallTrustScore, resourceSensitivity),
      requiredAdditionalAuth: overallTrustScore < 0.7 && resourceSensitivity > 0.5,
      allowedOperations: this.determineAllowedOperations(overallTrustScore, resourceSensitivity),
      monitoringLevel: this.determineMonitoringLevel(overallTrustScore),
      validUntil: Date.now() + this.calculateValidityPeriod(overallTrustScore)
    };
  }

  private async verifyIdentity(context: SecurityContext): Promise<number> {
    let score = 0.5; // Base score for authenticated user
    
    // Strong authentication methods increase trust
    if (context.authMethods.includes('mfa')) score += 0.3;
    if (context.authMethods.includes('certificate')) score += 0.2;
    if (context.authMethods.includes('biometric')) score += 0.15;
    
    // Recent authentication increases trust
    const sessionAge = Date.now() - context.lastAuthTime;
    if (sessionAge < 30 * 60 * 1000) score += 0.1; // Last 30 minutes
    
    // Check against compromised account databases
    const isCompromised = await this.checkCompromisedAccounts(context.userId);
    if (isCompromised) score = 0.1; // Very low trust for compromised accounts
    
    // Verify with ServiceNow user session
    const serviceNowSession = await this.validateServiceNowSession(context.sessionToken);
    if (!serviceNowSession.valid) score *= 0.5;
    
    return Math.min(score, 1.0);
  }

  private async assessDeviceTrust(context: SecurityContext): Promise<number> {
    let score = 0.3; // Base score for any device
    
    // Managed/corporate devices get higher trust
    if (context.device.isManaged) score += 0.4;
    if (context.device.hasMDM) score += 0.2; // Mobile Device Management
    if (context.device.hasEDR) score += 0.2; // Endpoint Detection & Response
    if (context.device.isCompliant) score += 0.1; // Compliance policies met
    
    // Security software presence
    if (context.device.hasAntivirus) score += 0.1;
    if (context.device.patchLevel === 'current') score += 0.1;
    
    // Device reputation check
    const deviceReputation = await this.checkDeviceReputation(context.device.fingerprint);
    score *= deviceReputation; // Multiply by reputation (0.0 to 1.0)
    
    // Penalize risky devices
    if (context.device.isJailbroken || context.device.isRooted) score *= 0.3;
    if (context.device.hasInfectionIndicators) score = 0.1;
    if (context.device.isNew && !context.device.isManaged) score *= 0.7;
    
    return Math.min(score, 1.0);
  }

  private async analyzeNetworkContext(context: SecurityContext): Promise<number> {
    let score = 0.5; // Base network score
    
    // Corporate networks get higher trust
    if (context.network.isCorporate) score += 0.3;
    if (context.network.isVPN && context.network.vpnProvider === 'corporate') score += 0.2;
    
    // IP reputation analysis
    const ipReputation = await this.checkIPReputation(context.network.sourceIP);
    score *= ipReputation; // Multiply by IP reputation
    
    // Geographic and time-based analysis
    if (context.network.isGeographicAnomaly) score *= 0.6;
    if (context.network.isTimeAnomaly) score *= 0.8;
    
    // High-risk network types
    if (context.network.isTor) score *= 0.2; // Very low trust for Tor
    if (context.network.isProxy && !context.network.isCorporateProxy) score *= 0.4;
    if (context.network.isPublicWifi) score *= 0.6;
    
    return Math.min(score, 1.0);
  }

  private async analyzeBehavior(context: SecurityContext, operation: string): Promise<number> {
    const userId = context.userId;
    let score = this.trustScore.get(userId) || 0.5;
    
    // Get user's behavioral baseline
    const behaviorMetrics = await this.getBehaviorMetrics(userId);
    
    // Positive behavioral indicators (increase trust over time)
    if (behaviorMetrics.isTypicalTime) score += 0.05;
    if (behaviorMetrics.isTypicalResource) score += 0.05;
    if (behaviorMetrics.isTypicalOperation) score += 0.05;
    if (behaviorMetrics.consistentLocation) score += 0.05;
    
    // Negative behavioral indicators (decrease trust)
    if (behaviorMetrics.isVelocityAnomaly) score -= 0.2; // Too many actions too fast
    if (behaviorMetrics.isAccessPatternAnomaly) score -= 0.3; // Unusual access patterns
    if (behaviorMetrics.isDataVolumeAnomaly) score -= 0.2; // Unusual data access volume
    if (behaviorMetrics.isOperationAnomaly) score -= 0.15; // Unusual operations
    
    // Compound suspicious activities
    const suspiciousCount = await this.getSuspiciousActivityCount(userId);
    score -= (suspiciousCount * 0.05);
    
    // Update and store trust score
    score = Math.max(0.1, Math.min(score, 1.0));
    this.trustScore.set(userId, score);
    
    return score;
  }

  private calculateTrustScore(scores: {
    identity: number;
    device: number;
    network: number;
    behavior: number;
  }): number {
    // Weighted scoring - identity and behavior are most important
    const weights = {
      identity: 0.35,  // 35% - Most critical
      behavior: 0.30,  // 30% - Very important
      device: 0.20,    // 20% - Important
      network: 0.15    // 15% - Contextual
    };
    
    return (
      scores.identity * weights.identity +
      scores.behavior * weights.behavior +
      scores.device * weights.device +
      scores.network * weights.network
    );
  }

  private makeAccessDecision(trustScore: number, resourceSensitivity: number): AccessDecision {
    const riskThreshold = 1.0 - resourceSensitivity; // Higher sensitivity = lower threshold
    
    if (trustScore >= riskThreshold) {
      return 'ALLOW';
    } else if (trustScore >= riskThreshold - 0.2) {
      return 'ALLOW_WITH_STEP_UP'; // Require additional authentication
    } else if (trustScore >= riskThreshold - 0.4) {
      return 'ALLOW_WITH_MONITORING'; // Allow but monitor closely
    } else {
      return 'DENY'; // Too risky
    }
  }
}

interface ZeroTrustValidation {
  trustScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  accessDecision: 'ALLOW' | 'ALLOW_WITH_STEP_UP' | 'ALLOW_WITH_MONITORING' | 'DENY';
  requiredAdditionalAuth: boolean;
  allowedOperations: string[];
  monitoringLevel: 'STANDARD' | 'ENHANCED' | 'MAXIMUM';
  validUntil: number;
}
```

---

## 🔧 ServiceNow Integration Patterns (2 minutes)

### **Zero Trust Middleware for ServiceNow APIs**
```tsx
// services/core/ZeroTrustServiceNowService.ts
export abstract class ZeroTrustServiceNowService extends BaseServiceNowService {
  private readonly zeroTrustService = new ZeroTrustSecurityService();

  protected async request<T>(
    endpoint: string,
    options: RequestInit & ServiceNowRequestOptions = {}
  ): Promise<T> {
    // Extract operation and resource from endpoint
    const operation = this.extractOperation(endpoint, options.method);
    const resource = this.extractResourceType(endpoint);
    
    // Get current security context
    const context = await this.getCurrentSecurityContext();
    
    // Perform Zero Trust validation
    const validation = await this.zeroTrustService.validateZeroTrustRequest(
      operation,
      resource,
      context
    );

    // Handle access decision
    switch (validation.accessDecision) {
      case 'ALLOW':
        // Proceed with request
        break;
        
      case 'ALLOW_WITH_STEP_UP':
        // Require additional authentication
        await this.requireStepUpAuthentication();
        // Continue after successful step-up
        break;
        
      case 'ALLOW_WITH_MONITORING':
        // Enable enhanced monitoring for this request
        await this.enableEnhancedMonitoring(context.userId, validation.monitoringLevel);
        break;
        
      case 'DENY':
        throw new SecurityError(403, 'ZERO_TRUST_DENIED', 
          'Access denied based on zero trust evaluation');
    }

    // Add zero trust headers to request
    const enhancedOptions = {
      ...options,
      headers: {
        ...options.headers,
        'X-ZeroTrust-Score': validation.trustScore.toString(),
        'X-ZeroTrust-Level': validation.monitoringLevel,
        'X-ZeroTrust-Valid-Until': validation.validUntil.toString()
      }
    };

    return super.request<T>(endpoint, enhancedOptions);
  }

  private async getCurrentSecurityContext(): Promise<SecurityContext> {
    return {
      userId: await this.getCurrentUserId(),
      sessionToken: this.getSessionToken(),
      lastAuthTime: this.getLastAuthTime(),
      authMethods: await this.getAuthMethods(),
      device: await this.getDeviceInfo(),
      network: await this.getNetworkInfo()
    };
  }
}
```

### **React Component Integration**
```tsx
// hooks/useZeroTrustSecurity.ts
export function useZeroTrustSecurity(resource: string) {
  const [securityStatus, setSecurityStatus] = useState<ZeroTrustStatus>('EVALUATING');
  const [trustScore, setTrustScore] = useState<number>(0);
  const [requiredActions, setRequiredActions] = useState<string[]>([]);

  useEffect(() => {
    const evaluateSecurity = async () => {
      try {
        const validation = await zeroTrustService.validateZeroTrustRequest(
          'read',
          resource,
          await getCurrentSecurityContext()
        );

        setTrustScore(validation.trustScore);
        setSecurityStatus(validation.accessDecision === 'ALLOW' ? 'ALLOWED' : 'RESTRICTED');
        
        if (validation.requiredAdditionalAuth) {
          setRequiredActions(['STEP_UP_AUTH']);
        }
      } catch (error) {
        setSecurityStatus('DENIED');
      }
    };

    evaluateSecurity();
    
    // Re-evaluate periodically
    const interval = setInterval(evaluateSecurity, 60000); // Every minute
    return () => clearInterval(interval);
  }, [resource]);

  const performStepUpAuth = useCallback(async () => {
    // Trigger step-up authentication
    await triggerStepUpAuthentication();
    // Re-evaluate after step-up
    const validation = await zeroTrustService.validateZeroTrustRequest(
      'read',
      resource,
      await getCurrentSecurityContext()
    );
    setSecurityStatus(validation.accessDecision === 'ALLOW' ? 'ALLOWED' : 'RESTRICTED');
  }, [resource]);

  return {
    securityStatus,
    trustScore,
    requiredActions,
    performStepUpAuth,
    isSecure: securityStatus === 'ALLOWED'
  };
}

// Component usage
function SecureIncidentForm({ incidentId }: { incidentId: string }) {
  const { 
    securityStatus, 
    trustScore, 
    requiredActions, 
    performStepUpAuth, 
    isSecure 
  } = useZeroTrustSecurity('incident');

  if (securityStatus === 'EVALUATING') {
    return <SecurityEvaluatingSpinner />;
  }

  if (securityStatus === 'DENIED') {
    return (
      <AccessDeniedMessage 
        message="Zero Trust evaluation failed. Access denied."
        trustScore={trustScore}
      />
    );
  }

  if (requiredActions.includes('STEP_UP_AUTH')) {
    return (
      <StepUpAuthRequired 
        onStepUp={performStepUpAuth}
        trustScore={trustScore}
      />
    );
  }

  return (
    <div className="zero-trust-secured">
      <SecurityIndicator trustScore={trustScore} />
      <IncidentForm incidentId={incidentId} />
    </div>
  );
}
```

---

## 📊 Implementation Checklist

### **Zero Trust Foundation**
- [ ] **Identity verification** - Multi-factor authentication implemented
- [ ] **Device trust assessment** - Device management and compliance checking
- [ ] **Network context analysis** - IP reputation and geographic validation
- [ ] **Behavioral analysis** - User behavior baseline and anomaly detection
- [ ] **Resource classification** - Data sensitivity and access requirements

### **ServiceNow Integration**
- [ ] **Zero Trust middleware** - Integrated with ServiceNow API calls
- [ ] **Session validation** - Continuous session security assessment
- [ ] **ACL enhancement** - Zero Trust scores inform ServiceNow ACLs
- [ ] **Audit integration** - Zero Trust decisions logged in ServiceNow

### **User Experience**
- [ ] **Transparent operation** - Security doesn't impede legitimate users
- [ ] **Step-up authentication** - Smooth additional auth when needed
- [ ] **Security indicators** - Users understand their security status
- [ ] **Graceful degradation** - Reduced functionality rather than complete denial

---

*Zero Trust architecture provides comprehensive security without sacrificing user experience - every request is validated, but legitimate users experience minimal friction! 🛡️*