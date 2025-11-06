---
title: "Behavioral Anomaly Detection"
purpose: "ML-powered user behavior analysis for ServiceNow security"
readTime: "6 minutes"
complexity: "advanced"
prerequisites: ["zero-trust-architecture"]
tags: ["anomaly-detection", "machine-learning", "behavior-analysis", "security"]
---

# Behavioral Anomaly Detection

**Purpose:** ML-powered user behavior analysis for ServiceNow security  
**Read time:** ~6 minutes  
**Prerequisites:** [Zero Trust Architecture](zero-trust-architecture.md)

---

## 🎯 Behavioral Analysis Principles (1 minute)

### **Core Concept: Establish Normal, Detect Abnormal**
```
Behavioral Security Model:
├── Baseline Learning → Establish normal user patterns
├── Real-time Analysis → Compare current behavior to baseline
├── Anomaly Detection → Identify deviations from normal
├── Risk Scoring → Calculate threat probability
└── Adaptive Response → Adjust security controls dynamically
```

### **ServiceNow Behavioral Indicators**
- **Access Patterns** - Tables accessed, frequency, timing
- **Data Volume** - Amount of data viewed/exported
- **Operation Types** - Create, read, update, delete patterns
- **Geographic Context** - Location consistency, travel patterns
- **Time Patterns** - Working hours, session duration
- **Navigation Flows** - UI interaction patterns

---

## 🧠 Anomaly Detection Service (3 minutes)

### **Core Behavioral Analysis Engine**
```tsx
// services/security/BehavioralAnomalyDetectionService.ts
export class BehavioralAnomalyDetectionService {
  private readonly userModels = new Map<string, UserBehaviorModel>();
  private readonly realtimeMetrics = new Map<string, RealtimeUserMetrics>();
  private readonly anomalyThresholds = new AnomalyThresholds();

  /**
   * Real-time anomaly detection for user behavior
   */
  async detectBehavioralAnomalies(
    userId: string, 
    currentActivity: UserActivity
  ): Promise<BehaviorAnalysisResult> {
    // Get or create user behavioral model
    const userModel = await this.getUserBehaviorModel(userId);
    
    // Update real-time metrics
    const currentMetrics = this.updateRealtimeMetrics(userId, currentActivity);
    
    // Detect different types of anomalies
    const anomalies: BehaviorAnomaly[] = [];
    
    // 1. Velocity anomalies (too fast, too many actions)
    const velocityAnomaly = this.detectVelocityAnomaly(userModel, currentMetrics);
    if (velocityAnomaly) anomalies.push(velocityAnomaly);
    
    // 2. Access pattern anomalies (unusual tables/data)
    const accessAnomaly = this.detectAccessPatternAnomaly(userModel, currentActivity);
    if (accessAnomaly) anomalies.push(accessAnomaly);
    
    // 3. Data volume anomalies (too much data accessed)
    const volumeAnomaly = this.detectDataVolumeAnomaly(userModel, currentActivity);
    if (volumeAnomaly) anomalies.push(volumeAnomaly);
    
    // 4. Temporal anomalies (unusual times)
    const timeAnomaly = this.detectTemporalAnomaly(userModel, currentActivity);
    if (timeAnomaly) anomalies.push(timeAnomaly);
    
    // 5. Geographic anomalies (unusual locations)
    const geoAnomaly = this.detectGeographicAnomaly(userModel, currentActivity);
    if (geoAnomaly) anomalies.push(geoAnomaly);
    
    // 6. Navigation anomalies (unusual UI patterns)
    const navAnomaly = this.detectNavigationAnomaly(userModel, currentActivity);
    if (navAnomaly) anomalies.push(navAnomaly);

    // Calculate overall risk score
    const riskScore = this.calculateBehaviorRiskScore(anomalies);
    
    // Trigger security response for high-risk behavior
    if (riskScore > 0.7) {
      await this.triggerBehaviorSecurityResponse(userId, anomalies, riskScore);
    }
    
    // Update user model with new data
    await this.updateUserBehaviorModel(userId, currentActivity, anomalies);

    return {
      userId,
      timestamp: Date.now(),
      riskScore,
      anomalies,
      recommendedActions: this.getRecommendedSecurityActions(riskScore, anomalies),
      confidenceLevel: this.calculateConfidence(anomalies, userModel.dataPoints)
    };
  }

  private detectVelocityAnomaly(
    model: UserBehaviorModel, 
    metrics: RealtimeUserMetrics
  ): BehaviorAnomaly | null {
    const currentRate = metrics.actionsPerMinute;
    const normalRate = model.baseline.avgActionsPerMinute;
    const threshold = model.thresholds.velocityMultiplier;
    
    // Check if current velocity exceeds normal by threshold
    if (currentRate > normalRate * threshold) {
      const severity = this.calculateAnomalySeverity(currentRate / normalRate);
      
      return {
        type: 'VELOCITY_ANOMALY',
        severity,
        confidence: this.calculateVelocityConfidence(currentRate, normalRate, model.dataPoints),
        description: `Action rate ${currentRate}/min exceeds baseline ${normalRate}/min by ${(currentRate/normalRate).toFixed(1)}x`,
        evidence: {
          currentRate,
          normalRate,
          threshold,
          deviation: currentRate / normalRate,
          timeWindow: metrics.timeWindowMinutes
        },
        riskFactors: [
          'Potential automated/bot activity',
          'Data exfiltration attempt',
          'Account compromise'
        ]
      };
    }
    
    return null;
  }

  private detectAccessPatternAnomaly(
    model: UserBehaviorModel,
    activity: UserActivity
  ): BehaviorAnomaly | null {
    const accessedTables = new Set(activity.accessedTables);
    const normalTables = new Set(model.baseline.commonTables);
    
    // Find tables accessed that are unusual for this user
    const unusualTables = Array.from(accessedTables).filter(table => 
      !normalTables.has(table)
    );
    
    // Check if user is accessing sensitive data they don't normally access
    const sensitiveTables = unusualTables.filter(table =>
      this.isSensitiveTable(table)
    );
    
    if (unusualTables.length > 0) {
      const severity = sensitiveTables.length > 0 ? 'HIGH' : 
                     unusualTables.length > 3 ? 'MEDIUM' : 'LOW';
      
      return {
        type: 'ACCESS_PATTERN_ANOMALY',
        severity,
        confidence: this.calculateAccessPatternConfidence(unusualTables, model.baseline),
        description: `Access to ${unusualTables.length} unusual tables: ${unusualTables.slice(0, 3).join(', ')}${unusualTables.length > 3 ? '...' : ''}`,
        evidence: {
          unusualTables,
          sensitiveTables,
          normalTables: Array.from(normalTables),
          totalUnusualAccess: unusualTables.length,
          accessFrequency: activity.tableAccessFrequency
        },
        riskFactors: [
          'Data reconnaissance',
          'Privilege escalation attempt',
          'Lateral movement'
        ]
      };
    }
    
    return null;
  }

  private detectDataVolumeAnomaly(
    model: UserBehaviorModel,
    activity: UserActivity
  ): BehaviorAnomaly | null {
    const currentVolume = activity.dataVolumeAccessed;
    const normalVolume = model.baseline.avgDataVolume;
    const threshold = model.thresholds.dataVolumeMultiplier;
    
    if (currentVolume > normalVolume * threshold) {
      const severity = currentVolume > normalVolume * 10 ? 'CRITICAL' :
                     currentVolume > normalVolume * 5 ? 'HIGH' : 'MEDIUM';
      
      return {
        type: 'DATA_VOLUME_ANOMALY',
        severity,
        confidence: this.calculateVolumeConfidence(currentVolume, normalVolume),
        description: `Data volume ${this.formatBytes(currentVolume)} exceeds baseline ${this.formatBytes(normalVolume)} by ${(currentVolume/normalVolume).toFixed(1)}x`,
        evidence: {
          currentVolume,
          normalVolume,
          threshold,
          deviation: currentVolume / normalVolume,
          affectedTables: activity.highVolumeTableAccess,
          accessMethods: activity.accessMethods
        },
        riskFactors: [
          'Mass data exfiltration',
          'Data harvesting',
          'Insider threat activity'
        ]
      };
    }
    
    return null;
  }

  private detectTemporalAnomaly(
    model: UserBehaviorModel,
    activity: UserActivity
  ): BehaviorAnomaly | null {
    const currentHour = new Date(activity.timestamp).getHours();
    const normalHours = model.baseline.typicalWorkingHours;
    
    // Check if accessing outside normal hours
    const isOutsideNormalHours = !normalHours.includes(currentHour);
    
    // Check for weekend/holiday access if user doesn't normally work then
    const isWeekend = this.isWeekend(activity.timestamp);
    const normallyWorksWeekends = model.baseline.worksWeekends;
    
    if (isOutsideNormalHours || (isWeekend && !normallyWorksWeekends)) {
      return {
        type: 'TEMPORAL_ANOMALY',
        severity: 'MEDIUM',
        confidence: 0.8,
        description: `Access at unusual time: ${new Date(activity.timestamp).toLocaleString()}`,
        evidence: {
          accessTime: activity.timestamp,
          currentHour,
          normalHours,
          isWeekend,
          normallyWorksWeekends,
          previousOffHoursActivity: model.baseline.offHoursActivityCount
        },
        riskFactors: [
          'After-hours unauthorized access',
          'Account compromise',
          'Insider threat'
        ]
      };
    }
    
    return null;
  }

  private detectGeographicAnomaly(
    model: UserBehaviorModel,
    activity: UserActivity
  ): BehaviorAnomaly | null {
    const currentLocation = activity.geolocation;
    const normalLocations = model.baseline.commonLocations;
    
    // Check if location is significantly different from normal
    const isUnusualLocation = !normalLocations.some(loc =>
      this.isNearLocation(currentLocation, loc, 50) // Within 50km
    );
    
    // Check for impossible travel (too fast between locations)
    const lastLocation = model.lastKnownLocation;
    const impossibleTravel = lastLocation ? 
      this.isImpossibleTravel(lastLocation, currentLocation, model.lastActivityTime, activity.timestamp) :
      false;
    
    if (isUnusualLocation || impossibleTravel) {
      const severity = impossibleTravel ? 'HIGH' : 'MEDIUM';
      
      return {
        type: 'GEOGRAPHIC_ANOMALY',
        severity,
        confidence: impossibleTravel ? 0.95 : 0.7,
        description: impossibleTravel ? 
          'Impossible travel detected between locations' :
          `Access from unusual location: ${currentLocation.city}, ${currentLocation.country}`,
        evidence: {
          currentLocation,
          normalLocations,
          lastLocation,
          travelDistance: lastLocation ? this.calculateDistance(lastLocation, currentLocation) : 0,
          travelTime: lastLocation ? activity.timestamp - model.lastActivityTime : 0,
          impossibleTravel
        },
        riskFactors: [
          'Account compromise',
          'Credential theft',
          'Shared account usage'
        ]
      };
    }
    
    return null;
  }

  private async triggerBehaviorSecurityResponse(
    userId: string,
    anomalies: BehaviorAnomaly[],
    riskScore: number
  ): Promise<void> {
    const response: BehaviorSecurityResponse = {
      userId,
      anomalies,
      riskScore,
      timestamp: Date.now(),
      actions: []
    };

    // Determine response actions based on risk score and anomaly types
    if (riskScore > 0.9 || anomalies.some(a => a.severity === 'CRITICAL')) {
      // Critical risk: Immediate session termination
      response.actions.push('TERMINATE_SESSION');
      await this.terminateActiveSession(userId);
      
      // Lock account for security review
      response.actions.push('LOCK_ACCOUNT');
      await this.lockUserAccount(userId, 'SECURITY_REVIEW');
      
      // Notify security team immediately
      await this.notifySecurityTeam('CRITICAL_BEHAVIOR_ANOMALY', response);
      
    } else if (riskScore > 0.8) {
      // High risk: Step-up authentication required
      response.actions.push('REQUIRE_STEP_UP_AUTH');
      await this.requireStepUpAuthentication(userId);
      
      // Restrict sensitive operations
      response.actions.push('RESTRICT_SENSITIVE_OPERATIONS');
      await this.restrictSensitiveOperations(userId);
      
      // Enhanced monitoring
      response.actions.push('ENHANCED_MONITORING');
      await this.enableEnhancedMonitoring(userId, 'MAXIMUM');
      
    } else if (riskScore > 0.7) {
      // Medium risk: Enhanced monitoring and confirmation
      response.actions.push('ENHANCED_MONITORING');
      await this.enableEnhancedMonitoring(userId, 'ENHANCED');
      
      // Require confirmation for sensitive actions
      response.actions.push('REQUIRE_ACTION_CONFIRMATION');
      await this.requireActionConfirmation(userId);
      
      // Log detailed activity
      response.actions.push('DETAILED_ACTIVITY_LOGGING');
      await this.enableDetailedActivityLogging(userId);
    }

    // Log security event
    await this.logSecurityEvent('BEHAVIORAL_ANOMALY', response);
  }
}

interface BehaviorAnomaly {
  type: 'VELOCITY_ANOMALY' | 'ACCESS_PATTERN_ANOMALY' | 'DATA_VOLUME_ANOMALY' | 
        'TEMPORAL_ANOMALY' | 'GEOGRAPHIC_ANOMALY' | 'NAVIGATION_ANOMALY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  description: string;
  evidence: Record<string, any>;
  riskFactors: string[];
}
```

---

## 🔧 ServiceNow Integration (1 minute)

### **Behavioral Monitoring Hook**
```tsx
// hooks/useBehaviorMonitoring.ts
export function useBehaviorMonitoring() {
  const [behaviorStatus, setBehaviorStatus] = useState<BehaviorStatus>('NORMAL');
  const [riskScore, setRiskScore] = useState<number>(0);
  const [detectedAnomalies, setDetectedAnomalies] = useState<BehaviorAnomaly[]>([]);

  // Track user activity
  const trackActivity = useCallback(async (activity: UserActivity) => {
    try {
      const result = await behaviorDetectionService.detectBehavioralAnomalies(
        getCurrentUserId(),
        activity
      );
      
      setRiskScore(result.riskScore);
      setDetectedAnomalies(result.anomalies);
      
      if (result.riskScore > 0.7) {
        setBehaviorStatus('HIGH_RISK');
      } else if (result.riskScore > 0.4) {
        setBehaviorStatus('ELEVATED_RISK');
      } else {
        setBehaviorStatus('NORMAL');
      }
    } catch (error) {
      console.error('Behavior monitoring error:', error);
    }
  }, []);

  // Auto-track common activities
  useEffect(() => {
    const trackPageActivity = () => {
      trackActivity({
        type: 'PAGE_ACCESS',
        timestamp: Date.now(),
        resource: window.location.pathname,
        // Additional context
      });
    };

    // Track page changes
    window.addEventListener('popstate', trackPageActivity);
    trackPageActivity(); // Track initial page

    return () => {
      window.removeEventListener('popstate', trackPageActivity);
    };
  }, [trackActivity]);

  return {
    behaviorStatus,
    riskScore,
    detectedAnomalies,
    trackActivity
  };
}

// Component usage
function SecureDataTable({ data, onRowClick }: SecureDataTableProps) {
  const { behaviorStatus, trackActivity } = useBehaviorMonitoring();

  const handleRowClick = useCallback((row: any) => {
    // Track data access activity
    trackActivity({
      type: 'DATA_ACCESS',
      timestamp: Date.now(),
      resource: 'incident',
      recordId: row.sys_id,
      sensitiveData: true
    });
    
    onRowClick(row);
  }, [onRowClick, trackActivity]);

  return (
    <div className={`data-table behavior-status-${behaviorStatus.toLowerCase()}`}>
      {behaviorStatus === 'HIGH_RISK' && (
        <SecurityAlert>
          High-risk behavior detected. Enhanced monitoring active.
        </SecurityAlert>
      )}
      
      <table>
        {data.map(row => (
          <tr key={row.sys_id} onClick={() => handleRowClick(row)}>
            {/* Table content */}
          </tr>
        ))}
      </table>
    </div>
  );
}
```

---

## 📊 Implementation Checklist (1 minute)

### **Behavioral Model Setup**
- [ ] **User baseline creation** - Establish normal behavior patterns
- [ ] **Anomaly thresholds** - Configure detection sensitivity
- [ ] **Risk scoring** - Weight different anomaly types appropriately
- [ ] **Model updates** - Continuous learning from new data

### **Detection Capabilities**
- [ ] **Velocity anomalies** - Detect unusually fast/high activity
- [ ] **Access patterns** - Identify unusual data access
- [ ] **Data volume** - Monitor large data access/export
- [ ] **Temporal patterns** - Detect off-hours activity
- [ ] **Geographic patterns** - Monitor location changes
- [ ] **Navigation flows** - Unusual UI interaction patterns

### **Response Actions**
- [ ] **Risk-based responses** - Graduated response to anomalies
- [ ] **Session management** - Terminate high-risk sessions
- [ ] **Enhanced monitoring** - Increase logging for suspicious users
- [ ] **Step-up authentication** - Require additional verification
- [ ] **Security notifications** - Alert security team to threats

---

*Behavioral anomaly detection provides early warning of security threats by identifying when users deviate from their normal patterns - catching insider threats and account compromises before major damage occurs! 🕵️*