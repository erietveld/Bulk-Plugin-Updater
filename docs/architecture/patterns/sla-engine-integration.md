# SLA Engine Integration

**Purpose:** Service Level Agreement management using ServiceNow SLA Engine with Flow Designer integration  
**Read time:** ~4 minutes  
**Prerequisites:** [ServiceNow Backend Principles](servicenow-backend-principles.md), [Flow Designer State Machines](flow-designer-state-machines.md)

---

## SLA Engine Architecture

### **SLA Engine + Flow Designer Integration**
ServiceNow SLA Engine provides native SLA management that integrates with:
- **Flow Designer** for SLA lifecycle management
- **Assignment Rules** for SLA-aware routing
- **Decision Builder** for SLA determination logic
- **Notification Engine** for breach warnings and notifications
- **State machines** for SLA state-based behavior

### **SLA Integration Architecture**
```
SLA Lifecycle Flow
├── SLA Determination → Decision Builder for SLA selection
├── SLA Activation → Flow Designer trigger on record creation
├── Milestone Tracking → Automatic progress monitoring  
├── Breach Warning → Flow Designer notifications
├── SLA Adjustment → Flow Designer for priority changes
└── SLA Completion → Flow Designer cleanup and reporting
```

---

## SLA Integration Patterns

### **Pattern 1: Dynamic SLA Assignment**
```tsx
// ✅ React creates records, SLA Engine handles service levels
export class SLAIntegratedService extends TableService<Incident> {
  
  async createIncidentWithSLA(data: IncidentData): Promise<IncidentWithSLA> {
    /*
    SERVICENOW DEVELOPER TODO:
    Configure SLA Engine Integration:
    
    SLA Definition: "Incident Response SLA"
    Table: Incident
    
    SLA Determination (Decision Builder):
    Input Conditions:
    - Priority (1-Critical, 2-High, 3-Medium, 4-Low)
    - VIP Caller (true/false)
    - Category (Hardware, Software, Network, Security)
    - Business Hours (true/false)
    
    SLA Targets:
    ┌──────────┬─────────┬────────────┬──────────────┬──────────────┐
    │ Priority │ VIP     │ Category   │ Response Time │ Resolution   │
    ├──────────┼─────────┼────────────┼──────────────┼──────────────┤
    │ 1        │ Any     │ Any        │ 30 minutes   │ 4 hours      │
    │ 2        │ true    │ Any        │ 1 hour       │ 8 hours      │
    │ 2        │ false   │ Security   │ 2 hours      │ 12 hours     │
    │ 2        │ false   │ Other      │ 4 hours      │ 24 hours     │
    │ 3        │ true    │ Any        │ 4 hours      │ 48 hours     │
    │ 3        │ false   │ Any        │ 8 hours      │ 72 hours     │
    │ 4        │ Any     │ Any        │ 24 hours     │ 120 hours    │
    └──────────┴─────────┴────────────┴──────────────┴──────────────┘
    
    Flow: "SLA Lifecycle Manager"
    Trigger: SLA Started (task_sla table)
    
    Actions:
    1. SLA Activation Notification
       - Notify assigned group of SLA start
       - Set escalation timers based on SLA
       - Create initial SLA tracking work notes
    
    2. Milestone Monitoring Setup
       - Configure 50% warning notifications
       - Set up 80% critical notifications
       - Schedule breach prevention checks
    
    3. Assignment Integration
       - Ensure appropriate skill level for SLA
       - Escalate assignment if needed
       - Balance workload considering SLA urgency
    
    Expected SLA Name: "Incident Response SLA"
    Expected Flow Name: "SLA Lifecycle Manager"
    */

    const incident = await this.createRecord(data);
    
    // SLA Engine automatically activates based on Decision Builder rules
    // Flow Designer handles SLA lifecycle management
    
    return incident;
  }

  async getSLAStatus(incidentId: string): Promise<SLAStatus[]> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "SLA Status Reporter"
    
    Flow Type: REST Endpoint
    REST Path: /api/{scope}/get_sla_status
    
    SLA Status Information:
    1. Active SLAs
       - SLA definition name
       - Start time and current duration
       - Target breach time
       - Percentage complete
       - Current stage (Response, Resolution, etc.)
    
    2. SLA History
       - Completed SLAs with actual vs target times
       - Met/missed status
       - Breach reasons if applicable
    
    3. Escalation Status
       - Next escalation time
       - Escalation contacts
       - Current escalation level
    
    4. Business Impact
       - Customer impact of potential breach
       - Business priority adjustments
       - Cost of SLA breach
    
    Expected Flow Name: "SLA Status Reporter"
    Expected Data Sources: task_sla, sys_user, incident tables
    */

    const slaStatus = await this.request<SLAStatus[]>(
      `/api/x_your_scope/get_sla_status?incident_id=${incidentId}`
    );

    return slaStatus;
  }

  async adjustSLA(incidentId: string, adjustment: SLAAdjustment): Promise<SLAAdjustmentResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "SLA Adjustment Processor"
    
    Flow Type: REST Endpoint
    REST Path: /api/{scope}/adjust_sla
    
    SLA Adjustment Types:
    1. Priority Change Impact
       - Recalculate SLA targets based on new priority
       - Adjust existing SLA timers
       - Notify stakeholders of changes
    
    2. Scope Change Impact
       - Add/remove SLA milestones
       - Adjust targets for scope changes
       - Document adjustment rationale
    
    3. Business Justification
       - Extend SLA for valid business reasons
       - Require approval for extensions
       - Track extension usage patterns
    
    4. Technical Delays
       - Pause SLA for vendor dependencies
       - External system outage adjustments
       - Resume SLA when issues resolved
    
    Adjustment Logic:
    1. Validate adjustment request
    2. Check approval requirements (Decision Builder)
    3. Apply SLA changes
    4. Notify affected parties
    5. Log adjustment for audit
    
    Expected Flow Name: "SLA Adjustment Processor"
    Expected Decision Table: "SLA Adjustment Rules"
    */

    const result = await this.request<SLAAdjustmentResult>(
      '/api/x_your_scope/adjust_sla',
      {
        method: 'POST',
        body: JSON.stringify({
          incident_id: incidentId,
          adjustment: adjustment
        })
      }
    );

    return result;
  }
}
```

### **Pattern 2: SLA Breach Prevention**
```tsx
// ✅ Proactive SLA management with Flow Designer
export class SLABreachPreventionService extends ServiceNowService {
  
  async checkBreachRisk(recordIds: string[]): Promise<BreachRiskAssessment[]> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "SLA Breach Risk Analyzer"
    
    Flow Type: REST Endpoint (Scheduled execution every 15 minutes)
    REST Path: /api/{scope}/check_breach_risk
    
    Risk Analysis Factors:
    1. Time Remaining Analysis
       - Calculate percentage of SLA time consumed
       - Identify records at 50%, 75%, 90% thresholds
       - Factor in business hours vs elapsed time
    
    2. Progress Assessment
       - Compare expected vs actual progress
       - Analyze historical resolution patterns
       - Consider complexity indicators
    
    3. Resource Availability
       - Check assigned agent availability
       - Assess current workload impact
       - Evaluate skill match for complexity
    
    4. External Dependencies
       - Identify vendor or third-party dependencies
       - Check external system status
       - Assess dependency impact on timeline
    
    Risk Scoring (Decision Builder):
    - High Risk (90%+): Immediate escalation needed
    - Medium Risk (75-89%): Manager notification required
    - Low Risk (50-74%): Agent reminder sufficient
    - On Track (<50%): Normal monitoring
    
    Preventive Actions:
    1. High Risk: Automatic escalation, management notification
    2. Medium Risk: Supervisor notification, resource check
    3. Low Risk: Agent notification, progress reminder
    
    Expected Flow Name: "SLA Breach Risk Analyzer"
    Expected Decision Table: "SLA Risk Scoring Matrix"
    */

    const assessments = await this.request<BreachRiskAssessment[]>(
      '/api/x_your_scope/check_breach_risk',
      {
        method: 'POST',
        body: JSON.stringify({ record_ids: recordIds })
      }
    );

    return assessments;
  }

  async executeBre preventionActions(recordId: string, riskLevel: string): Promise<PreventionResult> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "SLA Breach Prevention Actions"
    
    Flow Type: REST Endpoint
    REST Path: /api/{scope}/execute_prevention_actions
    
    Prevention Actions by Risk Level:
    
    High Risk (Imminent Breach):
    1. Immediate Escalation
       - Escalate to next tier support
       - Notify duty manager immediately
       - Page on-call expert if critical
    
    2. Resource Reallocation
       - Check for available experts
       - Consider reassignment to specialist
       - Authorize overtime if needed
    
    3. Stakeholder Communication
       - Proactive customer notification
       - Management status update
       - Vendor engagement if applicable
    
    Medium Risk (Potential Breach):
    1. Supervisor Notification
       - Alert team lead of potential issue
       - Request progress update from agent
       - Offer additional resources
    
    2. Process Acceleration
       - Streamline approval processes
       - Fast-track vendor communications
       - Prioritize in agent queue
    
    Low Risk (Early Warning):
    1. Agent Notification
       - Gentle reminder of SLA status
       - Provide progress tracking tools
       - Offer assistance if needed
    
    Expected Flow Name: "SLA Breach Prevention Actions"
    Expected Subflows: Escalation, Notification, Resource Allocation
    */

    const result = await this.request<PreventionResult>(
      '/api/x_your_scope/execute_prevention_actions',
      {
        method: 'POST',
        body: JSON.stringify({
          record_id: recordId,
          risk_level: riskLevel
        })
      }
    );

    return result;
  }
}
```

### **Pattern 3: SLA Reporting and Analytics**
```tsx
// ✅ SLA performance monitoring and reporting
export class SLAAnalyticsService extends ServiceNowService {
  
  async generateSLAReport(filters: SLAReportFilters): Promise<SLAReportData> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "SLA Performance Report Generator"
    
    Flow Type: REST Endpoint
    REST Path: /api/{scope}/generate_sla_report
    
    Report Metrics:
    1. SLA Performance Summary
       - Overall SLA achievement percentage
       - Breakdown by priority and category
       - Trend analysis over time periods
    
    2. Breach Analysis
       - Number and percentage of breaches
       - Common breach reasons
       - Average breach duration
       - Cost impact of breaches
    
    3. Team Performance
       - SLA performance by assignment group
       - Individual agent performance
       - Best performing teams/agents
    
    4. Trend Analysis
       - Month-over-month improvements
       - Seasonal patterns in performance
       - Impact of process changes
    
    Data Sources:
    - task_sla table for SLA records
    - incident table for incident details
    - sys_user_group for team analysis
    - Historical data for trending
    
    Report Formats:
    - Executive summary dashboard
    - Detailed performance metrics
    - Team-specific reports
    - Agent performance scorecards
    
    Expected Flow Name: "SLA Performance Report Generator"
    Expected Output: Structured JSON for dashboard rendering
    */

    const reportData = await this.request<SLAReportData>(
      '/api/x_your_scope/generate_sla_report',
      {
        method: 'POST',
        body: JSON.stringify(filters)
      }
    );

    return reportData;
  }

  async getSLATrends(timeRange: TimeRange): Promise<SLATrendData> {
    /*
    SERVICENOW DEVELOPER TODO:
    Create Flow: "SLA Trend Analyzer"
    
    Flow Type: REST Endpoint
    REST Path: /api/{scope}/get_sla_trends
    
    Trend Analysis:
    1. Performance Trends
       - SLA achievement rates over time
       - Improvement or degradation patterns
       - Seasonal variations in performance
    
    2. Volume Impact Analysis
       - Correlation between volume and SLA performance
       - Resource planning insights
       - Capacity planning recommendations
    
    3. Process Improvement Tracking
       - Impact of process changes on SLA performance
       - Training effectiveness measurement
       - Tool adoption impact
    
    4. Predictive Analytics
       - Forecast future SLA performance
       - Identify potential problem areas
       - Resource requirement predictions
    
    Trend Visualization Data:
    - Time series data for charts
       - Daily, weekly, monthly aggregations
    - Comparative analysis data
       - Year-over-year comparisons
       - Team performance comparisons
    - Benchmark data
       - Industry standard comparisons
       - Internal goal tracking
    
    Expected Flow Name: "SLA Trend Analyzer"
    Expected Integration: Analytics and reporting tables
    */

    const trendData = await this.request<SLATrendData>(
      `/api/x_your_scope/get_sla_trends?start_date=${timeRange.start}&end_date=${timeRange.end}`
    );

    return trendData;
  }
}
```

---

## React SLA Components

### **Pattern 4: SLA Dashboard Components**
```tsx
// ✅ Real-time SLA monitoring dashboard
interface SLADashboardProps {
  recordId: string;
  recordType: string;
}

function SLADashboard({ recordId, recordType }: SLADashboardProps) {
  const { data: slaStatus } = useQuery(
    ['sla-status', recordId],
    () => slaService.getSLAStatus(recordId),
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  const { data: breachRisk } = useQuery(
    ['breach-risk', recordId],
    () => breachPreventionService.checkBreachRisk([recordId])
  );

  return (
    <div className="sla-dashboard">
      <div className="sla-overview">
        <h3>SLA Status</h3>
        {slaStatus?.map(sla => (
          <SLAStatusCard
            key={sla.sla_id}
            sla={sla}
            riskLevel={breachRisk?.find(r => r.record_id === recordId)?.risk_level}
          />
        ))}
      </div>

      <div className="sla-timeline">
        <h3>SLA Timeline</h3>
        <SLATimeline slaStatus={slaStatus} />
      </div>

      <div className="breach-prevention">
        <h3>Breach Prevention</h3>
        <BreachRiskIndicator 
          riskAssessment={breachRisk?.find(r => r.record_id === recordId)}
        />
      </div>
    </div>
  );
}

interface SLAStatusCardProps {
  sla: SLAStatus;
  riskLevel?: string;
}

function SLAStatusCard({ sla, riskLevel }: SLAStatusCardProps) {
  const percentComplete = (sla.elapsed_time / sla.target_time) * 100;
  const isAtRisk = percentComplete > 75;
  const isCritical = percentComplete > 90;

  return (
    <div className={`sla-status-card ${isAtRisk ? 'at-risk' : ''} ${isCritical ? 'critical' : ''}`}>
      <div className="sla-header">
        <h4>{sla.sla_name}</h4>
        <SLAStatusBadge status={sla.status} />
      </div>

      <div className="sla-progress">
        <ProgressBar 
          percentage={percentComplete}
          variant={isCritical ? 'danger' : isAtRisk ? 'warning' : 'success'}
        />
        <div className="progress-details">
          <span>{formatDuration(sla.elapsed_time)} elapsed</span>
          <span>{formatDuration(sla.remaining_time)} remaining</span>
        </div>
      </div>

      <div className="sla-targets">
        {sla.milestones.map(milestone => (
          <MilestoneIndicator
            key={milestone.name}
            milestone={milestone}
            isCompleted={milestone.actual_time !== null}
            isOverdue={milestone.actual_time > milestone.target_time}
          />
        ))}
      </div>

      {riskLevel && (
        <div className="risk-indicator">
          <RiskBadge level={riskLevel} />
          <span>Breach prevention actions may be needed</span>
        </div>
      )}
    </div>
  );
}

function SLATimeline({ slaStatus }: { slaStatus: SLAStatus[] }) {
  return (
    <div className="sla-timeline">
      {slaStatus?.map(sla => (
        <div key={sla.sla_id} className="timeline-sla">
          <div className="timeline-header">
            <h4>{sla.sla_name}</h4>
            <TimeRemaining targetTime={sla.target_breach_time} />
          </div>
          
          <div className="timeline-track">
            <div className="timeline-progress" style={{ width: `${(sla.elapsed_time / sla.target_time) * 100}%` }} />
            
            {sla.milestones.map(milestone => (
              <div
                key={milestone.name}
                className="timeline-milestone"
                style={{ left: `${(milestone.target_time / sla.target_time) * 100}%` }}
              >
                <MilestoneMarker
                  milestone={milestone}
                  isCompleted={milestone.actual_time !== null}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Best Practices

### **✅ SLA Engine Integration Best Practices**
- **Use Decision Builder** for dynamic SLA determination
- **Configure milestone tracking** for complex SLAs
- **Implement proactive breach prevention** with Flow Designer
- **Integrate with Assignment Rules** for SLA-aware routing
- **Monitor SLA performance** and adjust targets based on data
- **Automate escalation** based on SLA status and risk

### **✅ Performance Optimization**
- **Use SLA Engine native features** instead of custom SLA tracking
- **Configure efficient SLA conditions** to avoid unnecessary activations
- **Implement smart notifications** to reduce noise
- **Use scheduled flows** for batch SLA analysis
- **Cache SLA status** for frequently accessed records

### **❌ Avoid These Anti-Patterns**
- Building custom SLA tracking instead of using SLA Engine
- Not integrating SLA status with assignment and escalation
- Ignoring business hours in SLA calculations
- Missing proactive breach prevention mechanisms
- Not tracking SLA performance for continuous improvement

---

## Next Steps

**Related patterns:**
- [Flow Designer State Machines](flow-designer-state-machines.md) - SLA state-based behavior
- [Assignment Rules Integration](assignment-rules-integration.md) - SLA-aware assignment
- [Decision Builder Integration](decision-builder-integration.md) - SLA determination rules
- [ServiceNow Anti-Patterns](servicenow-anti-patterns.md) - SLA mistakes to avoid

**Implementation guides:**
- [Configuration Governance](configuration-governance.md) - Managing SLA definitions
- [Troubleshooting Builder Integration](troubleshooting-builder-integration.md) - SLA issues

---

*SLA Engine provides comprehensive service level management that integrates seamlessly with Flow Designer, Assignment Rules, and Decision Builder for automated, intelligent SLA governance.*