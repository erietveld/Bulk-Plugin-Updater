---
title: "Supply Chain Security"
purpose: "Dependency and build pipeline security for ServiceNow applications"
readTime: "5 minutes"
complexity: "intermediate"
prerequisites: ["security-by-design"]
tags: ["supply-chain", "dependencies", "vulnerability-scanning", "security"]
---

# Supply Chain Security

**Purpose:** Dependency and build pipeline security for ServiceNow applications  
**Read time:** ~5 minutes  
**Prerequisites:** [Security-by-Design](../security-by-design.md)

---

## 🎯 Supply Chain Security Principles (1 minute)

### **Core Threats in Software Supply Chain**
```
Supply Chain Attack Vectors:
├── Malicious Dependencies → Compromised packages in npm/registry
├── Typosquatting → Similar names to popular packages
├── Package Hijacking → Legitimate packages taken over
├── Vulnerable Dependencies → Known CVEs in dependencies
├── Build Process Compromise → CI/CD pipeline attacks
└── Source Code Integrity → Unauthorized code changes
```

### **ServiceNow Application Risks**
- **Sensitive Data Access** - ServiceNow apps handle enterprise data
- **Privileged Operations** - Many apps run with elevated permissions
- **Long-lived Dependencies** - Enterprise apps often use older packages
- **Integration Points** - Multiple external service connections
- **Deployment Pipelines** - CI/CD systems with production access

---

## 🔍 Dependency Security Scanner (2 minutes)

### **Comprehensive Security Scanner**
```typescript
// scripts/security/DependencySecurityScanner.ts
export class DependencySecurityScanner {
  private readonly vulnerabilityDatabases = [
    'https://api.osv.dev/v1/query',           // Google OSV Database
    'https://api.snyk.io/v1/test',           // Snyk Vulnerability Database
    'https://api.deps.dev/v3alpha/query',     // Google Deps.dev
    'https://api.security.npm.org/audit'     // npm Security Advisory
  ];

  /**
   * Comprehensive dependency security analysis
   */
  async scanDependencies(): Promise<SecurityScanReport> {
    console.log('🔍 Starting comprehensive dependency security scan...');
    
    const packageJson = await this.loadPackageJson();
    const lockFile = await this.loadLockFile();
    
    const results: SecurityScanReport = {
      scanTimestamp: new Date().toISOString(),
      totalPackages: 0,
      vulnerabilities: [],
      licenses: [],
      outdatedPackages: [],
      supplyChainRisks: [],
      recommendations: [],
      overallRiskScore: 0
    };

    // 1. Vulnerability scanning across multiple databases
    console.log('🛡️  Scanning for known vulnerabilities...');
    const vulnerabilities = await this.scanForVulnerabilities(packageJson, lockFile);
    results.vulnerabilities = vulnerabilities;
    
    // 2. License compliance analysis
    console.log('📜 Analyzing license compliance...');
    const licenseIssues = await this.checkLicenseCompliance(packageJson);
    results.licenses = licenseIssues;
    
    // 3. Outdated package detection
    console.log('📅 Checking for outdated packages...');
    const outdatedPackages = await this.checkOutdatedPackages(packageJson);
    results.outdatedPackages = outdatedPackages;
    
    // 4. Supply chain attack detection
    console.log('🕵️  Detecting supply chain risks...');
    const supplyChainRisks = await this.detectSupplyChainRisks(packageJson, lockFile);
    results.supplyChainRisks = supplyChainRisks;
    
    // 5. Calculate overall risk and generate recommendations
    results.overallRiskScore = this.calculateOverallRisk(results);
    results.recommendations = this.generateSecurityRecommendations(results);
    
    return results;
  }

  private async detectSupplyChainRisks(
    packageJson: PackageJson,
    lockFile: LockFile
  ): Promise<SupplyChainRisk[]> {
    const risks: SupplyChainRisk[] = [];
    
    // 1. Typosquatting detection
    const typosquattingRisks = await this.detectTyposquatting(packageJson.dependencies);
    risks.push(...typosquattingRisks);
    
    // 2. Package hijacking detection
    const hijackingRisks = await this.detectPackageHijacking(lockFile);
    risks.push(...hijackingRisks);
    
    // 3. Suspicious package behavior
    const suspiciousRisks = await this.detectSuspiciousPackages(packageJson.dependencies);
    risks.push(...suspiciousRisks);
    
    // 4. Maintainer change detection
    const maintainerRisks = await this.detectMaintainerChanges(packageJson.dependencies);
    risks.push(...maintainerRisks);
    
    // 5. Dependency confusion attacks
    const confusionRisks = await this.detectDependencyConfusion(packageJson);
    risks.push(...confusionRisks);
    
    return risks;
  }

  private async detectTyposquatting(
    dependencies: Record<string, string>
  ): Promise<SupplyChainRisk[]> {
    const risks: SupplyChainRisk[] = [];
    
    // Load popular package names for comparison
    const popularPackages = await this.getPopularPackageNames();
    
    Object.keys(dependencies).forEach(packageName => {
      // Find packages with similar names (Levenshtein distance <= 2)
      const similarPackages = popularPackages.filter(popular => 
        this.calculateLevenshteinDistance(packageName, popular) <= 2 &&
        packageName !== popular &&
        packageName.length > 3 // Avoid flagging very short names
      );
      
      if (similarPackages.length > 0) {
        risks.push({
          type: 'TYPOSQUATTING',
          severity: 'HIGH',
          packageName,
          description: `Package '${packageName}' is suspiciously similar to popular packages: ${similarPackages.join(', ')}`,
          evidence: {
            similarPackages,
            editDistance: Math.min(...similarPackages.map(p => 
              this.calculateLevenshteinDistance(packageName, p)
            ))
          },
          recommendedAction: 'VERIFY_PACKAGE_LEGITIMACY',
          remediation: `Verify this is the correct package name. Popular alternatives: ${similarPackages.join(', ')}`
        });
      }
    });
    
    return risks;
  }

  private async detectPackageHijacking(lockFile: LockFile): Promise<SupplyChainRisk[]> {
    const risks: SupplyChainRisk[] = [];
    
    for (const [packageName, packageInfo] of Object.entries(lockFile.packages || {})) {
      if (!packageName || packageName === '') continue;
      
      try {
        // Check if package has had recent maintainer changes
        const packageHistory = await this.getPackageHistory(packageName);
        
        // Look for suspicious maintainer changes
        if (packageHistory.recentMaintainerChanges > 0) {
          const recentVersions = packageHistory.versions.slice(-5); // Last 5 versions
          const hasVersionSpike = recentVersions.length >= 3 &&
            recentVersions.some(v => v.publishedBy !== recentVersions[0].publishedBy);
          
          if (hasVersionSpike) {
            risks.push({
              type: 'PACKAGE_HIJACKING',
              severity: 'CRITICAL',
              packageName,
              description: `Package '${packageName}' shows signs of potential hijacking: recent maintainer changes`,
              evidence: {
                recentMaintainerChanges: packageHistory.recentMaintainerChanges,
                recentVersions: recentVersions.map(v => ({
                  version: v.version,
                  publishedBy: v.publishedBy,
                  publishDate: v.publishDate
                }))
              },
              recommendedAction: 'INVESTIGATE_PACKAGE_HISTORY',
              remediation: 'Review package history and consider pinning to trusted version'
            });
          }
        }
      } catch (error) {
        // Package history check failed - could be suspicious
        console.warn(`Failed to check history for ${packageName}:`, error.message);
      }
    }
    
    return risks;
  }

  private async detectSuspiciousPackages(
    dependencies: Record<string, string>
  ): Promise<SupplyChainRisk[]> {
    const risks: SupplyChainRisk[] = [];
    
    const suspiciousPatterns = [
      /bitcoin|crypto|mining/i,         // Cryptocurrency mining
      /eval|exec|child_process/i,       // Code execution
      /\.env|password|secret/i,         // Credential harvesting
      /telemetry|analytics|tracking/i   // Data collection
    ];
    
    for (const packageName of Object.keys(dependencies)) {
      try {
        const packageInfo = await this.getPackageInfo(packageName);
        
        // Check package description and keywords for suspicious content
        const content = `${packageInfo.description} ${packageInfo.keywords?.join(' ') || ''}`;
        
        const matchedPatterns = suspiciousPatterns.filter(pattern => 
          pattern.test(content)
        );
        
        if (matchedPatterns.length > 0) {
          risks.push({
            type: 'SUSPICIOUS_PACKAGE',
            severity: 'MEDIUM',
            packageName,
            description: `Package '${packageName}' contains suspicious keywords or functionality`,
            evidence: {
              suspiciousContent: content,
              matchedPatterns: matchedPatterns.map(p => p.source),
              packageDescription: packageInfo.description
            },
            recommendedAction: 'REVIEW_PACKAGE_FUNCTIONALITY',
            remediation: 'Review package source code and functionality before use'
          });
        }
        
        // Check for packages with very few downloads (potential supply chain attack)
        if (packageInfo.downloads && packageInfo.downloads.weekly < 100) {
          risks.push({
            type: 'LOW_ADOPTION_PACKAGE',
            severity: 'LOW',
            packageName,
            description: `Package '${packageName}' has very low adoption (${packageInfo.downloads.weekly} weekly downloads)`,
            evidence: {
              weeklyDownloads: packageInfo.downloads.weekly,
              monthlyDownloads: packageInfo.downloads.monthly
            },
            recommendedAction: 'VERIFY_PACKAGE_NECESSITY',
            remediation: 'Consider using more established alternatives with higher adoption'
          });
        }
      } catch (error) {
        // Failed to get package info - could indicate deleted/suspicious package
        risks.push({
          type: 'PACKAGE_INFO_UNAVAILABLE',
          severity: 'MEDIUM',
          packageName,
          description: `Unable to retrieve information for package '${packageName}'`,
          evidence: { error: error.message },
          recommendedAction: 'INVESTIGATE_PACKAGE_AVAILABILITY',
          remediation: 'Package may have been removed or is hosted on untrusted registry'
        });
      }
    }
    
    return risks;
  }

  private calculateOverallRisk(results: SecurityScanReport): number {
    let riskScore = 0;
    
    // Weight vulnerabilities by severity
    results.vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'CRITICAL': riskScore += 10; break;
        case 'HIGH': riskScore += 7; break;
        case 'MEDIUM': riskScore += 4; break;
        case 'LOW': riskScore += 1; break;
      }
    });
    
    // Weight supply chain risks
    results.supplyChainRisks.forEach(risk => {
      switch (risk.severity) {
        case 'CRITICAL': riskScore += 8; break;
        case 'HIGH': riskScore += 5; break;
        case 'MEDIUM': riskScore += 2; break;
        case 'LOW': riskScore += 0.5; break;
      }
    });
    
    // Normalize to 0-100 scale
    return Math.min(riskScore * 2, 100);
  }
}
```

---

## 🛠️ CI/CD Pipeline Integration (1 minute)

### **Automated Security Checks**
```typescript
// scripts/security/pipelineSecurityChecks.ts
export async function runPipelineSecurityChecks(): Promise<void> {
  console.log('🔒 Starting pipeline security checks...');
  
  const scanner = new DependencySecurityScanner();
  const report = await scanner.scanDependencies();
  
  // Define failure criteria
  const criticalVulns = report.vulnerabilities.filter(v => v.severity === 'CRITICAL');
  const highRiskSupplyChain = report.supplyChainRisks.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH');
  const licenseViolations = report.licenses.filter(l => l.isBlocking);
  
  // Generate security report
  await generateSecurityReport(report);
  
  // Fail build on critical security issues
  if (criticalVulns.length > 0) {
    console.error(`❌ Build failed: ${criticalVulns.length} critical vulnerabilities found`);
    console.error('Critical vulnerabilities:');
    criticalVulns.forEach(vuln => {
      console.error(`  - ${vuln.packageName}: ${vuln.title} (${vuln.id})`);
    });
    process.exit(1);
  }
  
  if (highRiskSupplyChain.length > 0) {
    console.error(`❌ Build failed: ${highRiskSupplyChain.length} high-risk supply chain issues found`);
    console.error('High-risk supply chain issues:');
    highRiskSupplyChain.forEach(risk => {
      console.error(`  - ${risk.packageName}: ${risk.description}`);
    });
    process.exit(1);
  }
  
  if (licenseViolations.length > 0) {
    console.error(`❌ Build failed: ${licenseViolations.length} license violations found`);
    console.error('License violations:');
    licenseViolations.forEach(license => {
      console.error(`  - ${license.packageName}: ${license.license} (${license.issue})`);
    });
    process.exit(1);
  }
  
  // Warn on medium-risk issues
  const mediumRiskIssues = [
    ...report.vulnerabilities.filter(v => v.severity === 'HIGH'),
    ...report.supplyChainRisks.filter(r => r.severity === 'MEDIUM'),
    ...report.outdatedPackages.filter(p => p.severity === 'HIGH')
  ];
  
  if (mediumRiskIssues.length > 0) {
    console.warn(`⚠️  Warning: ${mediumRiskIssues.length} medium-risk security issues found`);
    console.warn('Consider addressing these issues in future releases');
  }
  
  // Report overall security posture
  if (report.overallRiskScore < 20) {
    console.log('✅ Excellent security posture');
  } else if (report.overallRiskScore < 40) {
    console.log('⚠️  Good security posture with some areas for improvement');
  } else {
    console.warn('🚨 Security posture needs attention');
  }
  
  console.log(`📊 Overall security score: ${report.overallRiskScore}/100`);
}

// GitHub Actions workflow integration
export function generateGitHubSecurityWorkflow(): string {
  return `
name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1' # Weekly scan on Mondays at 2 AM

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run security scan
      run: npm run security:scan
    
    - name: Upload security report
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: security-report
        path: security-report.json
        
    - name: Create security issue
      if: failure()
      uses: actions/github-script@v6
      with:
        script: |
          github.rest.issues.create({
            owner: context.repo.owner,
            repo: context.repo.repo,
            title: 'Security Scan Failed',
            body: 'Critical security vulnerabilities detected. Review security report.',
            labels: ['security', 'critical']
          })
`;
}
```

---

## 📋 Package Management Best Practices (1 minute)

### **Secure Package Configuration**
```json
// package.json - Security-focused configuration
{
  "name": "@company/servicenow-app",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0"
  },
  "scripts": {
    "security:audit": "npm audit --audit-level=moderate",
    "security:scan": "node scripts/security/pipelineSecurityChecks.js",
    "security:update": "npm update && npm audit fix",
    "preinstall": "npx check-audit"
  },
  "dependencies": {
    "@tanstack/react-query": "5.8.4",
    "zustand": "4.4.7",
    "clsx": "2.0.0"
  },
  "devDependencies": {
    "@types/node": "20.9.0",
    "typescript": "5.2.2"
  },
  "overrides": {
    "semver": "7.5.4"
  },
  "audit": {
    "allowlist": [],
    "report": true,
    "advisories": []
  }
}
```

### **Dependency Lock File Management**
```bash
# Security-focused npm commands
npm ci                    # Use exact versions from lock file
npm audit --audit-level=moderate  # Check for moderate+ vulnerabilities
npm audit fix            # Auto-fix vulnerabilities
npm outdated             # Check for outdated packages
npm ls --depth=0         # List top-level dependencies
```

### **Supply Chain Security Checklist**
```typescript
// Security checklist for new dependencies
interface DependencySecurityChecklist {
  beforeAdding: [
    'Check package popularity and adoption',
    'Review package maintainers and history', 
    'Scan for known vulnerabilities',
    'Verify package license compatibility',
    'Check for suspicious patterns or functionality',
    'Validate package registry source'
  ];
  
  afterAdding: [
    'Pin exact versions in package.json',
    'Update lock file (package-lock.json)',
    'Run security scan',
    'Test functionality thoroughly',
    'Monitor for security updates'
  ];
  
  ongoing: [
    'Regular dependency updates',
    'Automated vulnerability scanning',
    'Monitor security advisories',
    'Review dependency changes in PRs',
    'Maintain security documentation'
  ];
}
```

---

## 🎯 Implementation Checklist

### **Scanner Setup**
- [ ] **Dependency scanner** - Automated vulnerability scanning
- [ ] **Multiple databases** - Cross-reference vulnerability sources
- [ ] **Supply chain detection** - Typosquatting and hijacking detection
- [ ] **License compliance** - Automated license checking
- [ ] **CI/CD integration** - Fail builds on critical issues

### **Security Policies**
- [ ] **Dependency approval** - Review process for new packages
- [ ] **Version pinning** - Use exact versions for reproducible builds
- [ ] **Regular updates** - Scheduled dependency maintenance
- [ ] **Security monitoring** - Continuous vulnerability tracking
- [ ] **Incident response** - Process for handling security findings

---

*Supply chain security protects your ServiceNow application from compromised dependencies and build pipeline attacks - trust but verify every component in your software supply chain! 🔒*