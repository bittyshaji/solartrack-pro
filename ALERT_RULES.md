# Alert Rules for SolarTrack Pro

**Version**: 1.0  
**Last Updated**: April 19, 2026  
**Status**: Production-Ready

---

## Overview

This document defines specific alert configurations for SolarTrack Pro monitoring. It covers error rates, response time degradation, resource exhaustion, and dependency failures.

---

## Table of Contents

1. [Error Rate Alerts](#error-rate-alerts)
2. [Response Time Alerts](#response-time-alerts)
3. [Resource Exhaustion Alerts](#resource-exhaustion-alerts)
4. [Dependency Failure Alerts](#dependency-failure-alerts)
5. [Business Logic Alerts](#business-logic-alerts)
6. [Alert Implementation](#alert-implementation)
7. [Escalation Policies](#escalation-policies)

---

## Error Rate Alerts

### 1.1 General Application Error Rate

```yaml
Alert: HighApplicationErrorRate
Severity: WARNING
Condition: |
  rate(errors_total[5m]) / rate(requests_total[5m]) > 0.005
Duration: 5 minutes
Threshold: > 0.5% (0.5 errors per 100 requests)
Action: Alert engineering team
Runbook: /docs/runbooks/high_error_rate

Alert: CriticalApplicationErrorRate
Severity: CRITICAL
Condition: |
  rate(errors_total[5m]) / rate(requests_total[5m]) > 0.01
Duration: 3 minutes
Threshold: > 1% (1 error per 100 requests)
Action: Page on-call engineer immediately
Runbook: /docs/runbooks/critical_error_rate
```

### 1.2 Error Rate by Type

```yaml
Alert: HighAuthenticationFailures
Severity: CRITICAL
Condition: |
  rate(auth_errors_total[5m]) > 10
Duration: 2 minutes
Threshold: > 10 auth failures in 5 minutes
Impact: Users cannot log in
Action: Immediate investigation required
Details:
  - Check authentication service
  - Verify database connectivity
  - Check API key validity

Alert: HighDatabaseErrors
Severity: CRITICAL
Condition: |
  rate(database_errors_total[5m]) > 5
Duration: 3 minutes
Threshold: > 5 database errors in 5 minutes
Impact: Data operations failing
Action: Database team investigation
Details:
  - Query database logs
  - Check connection pool
  - Verify index health

Alert: HighNetworkErrors
Severity: WARNING
Condition: |
  rate(network_errors_total[5m]) / rate(requests_total[5m]) > 0.05
Duration: 5 minutes
Threshold: > 5% network errors
Impact: Intermittent connectivity issues
Action: Monitor external dependencies
Details:
  - Check API connectivity
  - Verify DNS resolution
  - Check CDN status

Alert: HighValidationErrors
Severity: INFO
Condition: |
  rate(validation_errors_total[5m]) > 50
Duration: 10 minutes
Threshold: > 50 validation errors in 5 minutes
Impact: Data quality issue
Action: Review recent changes
Details:
  - Check form validation
  - Verify data migration
  - Review API contract changes
```

### 1.3 Implementation in Code

```javascript
// src/lib/monitoring/errorAlerts.js

import { logger } from '@/lib/logger'
import { errorTracking } from '@/lib/logger'

export class ErrorRateMonitor {
  constructor() {
    this.errorCounts = {
      total: 0,
      auth: 0,
      database: 0,
      network: 0,
      validation: 0
    }
    this.window = 300000 // 5 minutes
    this.windowStart = Date.now()
  }

  recordError(type, error) {
    this.errorCounts.total++
    this.errorCounts[type] = (this.errorCounts[type] || 0) + 1

    // Reset window every 5 minutes
    if (Date.now() - this.windowStart > this.window) {
      this.evaluateAndAlert()
      this.reset()
    }
  }

  evaluateAndAlert() {
    const errorRate = this.errorCounts.total / this.getTotalRequests()

    // Check critical thresholds
    if (this.errorCounts.auth > 10) {
      this.alertCritical('HighAuthenticationFailures', {
        count: this.errorCounts.auth,
        threshold: 10,
        window: '5m'
      })
    }

    if (this.errorCounts.database > 5) {
      this.alertCritical('HighDatabaseErrors', {
        count: this.errorCounts.database,
        threshold: 5,
        window: '5m'
      })
    }

    if (errorRate > 0.01) {
      this.alertCritical('CriticalApplicationErrorRate', {
        rate: (errorRate * 100).toFixed(2) + '%',
        threshold: '1%',
        window: '5m'
      })
    } else if (errorRate > 0.005) {
      this.alertWarning('HighApplicationErrorRate', {
        rate: (errorRate * 100).toFixed(2) + '%',
        threshold: '0.5%',
        window: '5m'
      })
    }
  }

  alertCritical(name, data) {
    logger.error(`[CRITICAL] ${name}`, data)
    errorTracking.captureError(name, {
      level: 'error',
      extra: data
    })
  }

  alertWarning(name, data) {
    logger.warn(`[WARNING] ${name}`, data)
  }

  reset() {
    this.errorCounts = {
      total: 0,
      auth: 0,
      database: 0,
      network: 0,
      validation: 0
    }
    this.windowStart = Date.now()
  }

  getTotalRequests() {
    // Return actual request count from metrics
    return 1000 // Placeholder
  }
}

export const errorRateMonitor = new ErrorRateMonitor()
```

---

## Response Time Alerts

### 2.1 Overall Response Time

```yaml
Alert: SlowAPIResponse
Severity: WARNING
Condition: |
  histogram_quantile(0.95, rate(api_duration_seconds_bucket[5m])) > 0.75
Duration: 5 minutes
Threshold: P95 response time > 750ms
Target: < 500ms
Action: Investigate slow endpoints
Impact: User experience degradation

Alert: VerySlowAPIResponse
Severity: CRITICAL
Condition: |
  histogram_quantile(0.95, rate(api_duration_seconds_bucket[5m])) > 2.0
Duration: 3 minutes
Threshold: P95 response time > 2 seconds
Target: < 1 second
Action: Immediate investigation required
Impact: Service may be unresponsive

Alert: HighResponseTimeVariance
Severity: WARNING
Condition: |
  (P99 - P50) > (P50 * 2)
Duration: 10 minutes
Threshold: > 2x variance between P50 and P99
Cause: Some requests significantly slower
Action: Identify outlier endpoints
```

### 2.2 Endpoint-Specific Alerts

```yaml
Alert: SlowDashboardEndpoint
Severity: WARNING
Condition: |
  histogram_quantile(0.95, rate(api_duration_seconds_bucket{endpoint="/api/dashboard"}[5m])) > 1.0
Duration: 5 minutes
Threshold: Dashboard endpoint > 1 second
Target: < 500ms
Action: Check dashboard data aggregation
SLO: 99% of requests < 1s

Alert: SlowReportExport
Severity: WARNING
Condition: |
  histogram_quantile(0.95, rate(export_duration_seconds_bucket[5m])) > 3.0
Duration: 5 minutes
Threshold: Report export > 3 seconds
Target: < 2 seconds
Action: Optimize report generation
SLO: 95% of exports < 3s
```

### 2.3 Implementation

```javascript
// src/lib/monitoring/responseTimeAlerts.js

export class ResponseTimeMonitor {
  constructor() {
    this.requests = []
  }

  recordRequest(endpoint, duration) {
    this.requests.push({
      endpoint,
      duration,
      timestamp: Date.now()
    })

    // Keep only last 5 minutes of data
    const fiveMinutesAgo = Date.now() - 300000
    this.requests = this.requests.filter(r => r.timestamp > fiveMinutesAgo)

    // Evaluate immediately
    this.evaluateThresholds(endpoint)
  }

  evaluateThresholds(endpoint) {
    const endpointRequests = this.requests.filter(r => r.endpoint === endpoint)
    
    if (endpointRequests.length === 0) return

    const sorted = endpointRequests
      .map(r => r.duration)
      .sort((a, b) => a - b)

    const p50 = sorted[Math.floor(sorted.length * 0.50)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]

    // Check thresholds
    if (p95 > 2000) {
      this.alertCritical('VerySlowAPIResponse', {
        endpoint,
        p95: p95.toFixed(0) + 'ms',
        p99: p99.toFixed(0) + 'ms',
        threshold: '2000ms'
      })
    } else if (p95 > 750) {
      this.alertWarning('SlowAPIResponse', {
        endpoint,
        p95: p95.toFixed(0) + 'ms',
        threshold: '750ms'
      })
    }

    // Check variance
    const variance = p99 - p50
    if (variance > p50 * 2) {
      this.alertWarning('HighResponseTimeVariance', {
        endpoint,
        p50: p50.toFixed(0) + 'ms',
        p99: p99.toFixed(0) + 'ms',
        variance: variance.toFixed(0) + 'ms'
      })
    }
  }

  getStats(endpoint) {
    const requests = this.requests.filter(r => r.endpoint === endpoint)
    const durations = requests.map(r => r.duration).sort((a, b) => a - b)

    return {
      count: requests.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      p50: durations[Math.floor(durations.length * 0.50)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      min: durations[0],
      max: durations[durations.length - 1]
    }
  }

  alertWarning(name, data) {
    logger.warn(`[WARNING] ${name}`, data)
  }

  alertCritical(name, data) {
    logger.error(`[CRITICAL] ${name}`, data)
  }
}

export const responseTimeMonitor = new ResponseTimeMonitor()
```

---

## Resource Exhaustion Alerts

### 3.1 Memory Alerts

```yaml
Alert: HighMemoryUsage
Severity: WARNING
Condition: |
  (memory_used_bytes / memory_total_bytes) * 100 > 80
Duration: 10 minutes
Threshold: > 80% memory usage
Action: Monitor and log memory usage
Details:
  - Check for memory leaks
  - Review large data structures
  - Consider cache cleanup

Alert: CriticalMemoryUsage
Severity: CRITICAL
Condition: |
  (memory_used_bytes / memory_total_bytes) * 100 > 90
Duration: 3 minutes
Threshold: > 90% memory usage
Action: Immediate action required
Details:
  - Restart service if needed
  - Kill non-essential processes
  - Increase memory allocation
```

### 3.2 CPU Alerts

```yaml
Alert: HighCPUUsage
Severity: WARNING
Condition: |
  rate(cpu_usage[5m]) > 0.75
Duration: 10 minutes
Threshold: > 75% CPU usage
Action: Investigate heavy workloads
Details:
  - Profile CPU usage
  - Check for runaway processes
  - Review batch jobs

Alert: CriticalCPUUsage
Severity: CRITICAL
Condition: |
  rate(cpu_usage[5m]) > 0.90
Duration: 5 minutes
Threshold: > 90% CPU usage
Action: Immediate investigation
Details:
  - Identify CPU-intensive operations
  - Consider load balancing
  - Throttle non-critical tasks
```

### 3.3 Browser-Level Resource Monitoring

```javascript
// src/lib/monitoring/resourceAlerts.js

export class ResourceMonitor {
  constructor() {
    this.initMonitoring()
  }

  initMonitoring() {
    // Monitor JavaScript heap size
    setInterval(() => {
      if (performance.memory) {
        this.checkMemoryUsage()
      }
    }, 10000) // Every 10 seconds
  }

  checkMemoryUsage() {
    const memory = performance.memory
    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100

    if (usagePercent > 90) {
      this.alertCritical('CriticalMemoryUsage', {
        used: (memory.usedJSHeapSize / 1e6).toFixed(2) + ' MB',
        limit: (memory.jsHeapSizeLimit / 1e6).toFixed(2) + ' MB',
        percentage: usagePercent.toFixed(2) + '%'
      })
    } else if (usagePercent > 80) {
      this.alertWarning('HighMemoryUsage', {
        used: (memory.usedJSHeapSize / 1e6).toFixed(2) + ' MB',
        percentage: usagePercent.toFixed(2) + '%'
      })
    }
  }

  alertCritical(name, data) {
    logger.error(`[CRITICAL] ${name}`, data)
  }

  alertWarning(name, data) {
    logger.warn(`[WARNING] ${name}`, data)
  }
}

export const resourceMonitor = new ResourceMonitor()
```

---

## Dependency Failure Alerts

### 4.1 External Service Alerts

```yaml
Alert: DatabaseConnectionFailure
Severity: CRITICAL
Condition: |
  up{service="database"} == 0
Duration: 1 minute
Threshold: Database not responding
Impact: All data operations fail
Action: Page database team immediately
Details:
  - Check database logs
  - Verify network connectivity
  - Check connection pool

Alert: ExternalAPIUnavailable
Severity: CRITICAL
Condition: |
  up{service="external_api"} == 0
Duration: 2 minutes
Threshold: External API not responding
Impact: Dependent features unavailable
Action: Investigate API status
Details:
  - Check API provider status page
  - Verify API keys
  - Check firewall rules

Alert: AuthenticationServiceFailure
Severity: CRITICAL
Condition: |
  up{service="auth"} == 0
Duration: 1 minute
Threshold: Auth service unreachable
Impact: Users cannot log in
Action: Immediate incident response
Details:
  - Check auth service health
  - Verify database connectivity
  - Review recent deployments
```

### 4.2 Implementation

```javascript
// src/lib/monitoring/dependencyAlerts.js

export class DependencyMonitor {
  constructor() {
    this.services = {
      database: { lastCheck: null, status: 'unknown' },
      api: { lastCheck: null, status: 'unknown' },
      auth: { lastCheck: null, status: 'unknown' },
      cache: { lastCheck: null, status: 'unknown' }
    }
  }

  async checkService(serviceName, checkFn) {
    try {
      const startTime = Date.now()
      await checkFn()
      const duration = Date.now() - startTime

      this.services[serviceName] = {
        lastCheck: new Date().toISOString(),
        status: 'healthy',
        duration
      }
    } catch (error) {
      this.services[serviceName] = {
        lastCheck: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message
      }

      this.alertServiceFailure(serviceName, error)
    }
  }

  async checkAllServices() {
    await Promise.all([
      this.checkService('database', () => this.checkDatabase()),
      this.checkService('auth', () => this.checkAuth()),
      this.checkService('api', () => this.checkExternalAPI()),
      this.checkService('cache', () => this.checkCache())
    ])
  }

  async checkDatabase() {
    const response = await fetch('/api/health/database', { timeout: 5000 })
    if (!response.ok) throw new Error('Database check failed')
  }

  async checkAuth() {
    const response = await fetch('/api/health/auth', { timeout: 5000 })
    if (!response.ok) throw new Error('Auth service check failed')
  }

  async checkExternalAPI() {
    const response = await fetch(import.meta.env.VITE_EXTERNAL_API_URL, {
      timeout: 10000
    })
    if (!response.ok) throw new Error('External API check failed')
  }

  async checkCache() {
    // Implementation depends on cache system
  }

  alertServiceFailure(service, error) {
    logger.error(`[CRITICAL] ${service}ConnectionFailure`, {
      service,
      error: error.message,
      timestamp: new Date().toISOString()
    })

    // Notify ops team
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        severity: 'critical',
        message: `${service} service unavailable`,
        error: error.message,
        service
      })
    })
  }

  getStatus() {
    return this.services
  }
}

export const dependencyMonitor = new DependencyMonitor()

// Start checking every 5 minutes
setInterval(() => {
  dependencyMonitor.checkAllServices()
}, 300000)
```

---

## Business Logic Alerts

### 5.1 Transaction/Payment Alerts

```yaml
Alert: HighPaymentFailureRate
Severity: CRITICAL
Condition: |
  rate(payment_failures_total[5m]) / rate(payment_attempts_total[5m]) > 0.05
Duration: 3 minutes
Threshold: > 5% payment failure rate
Impact: Lost revenue
Action: Immediate payment system investigation
Details:
  - Check payment processor status
  - Verify payment credentials
  - Review transaction logs

Alert: LargeTransactionFailure
Severity: CRITICAL
Condition: |
  transaction_amount > 10000 AND payment_status = "failed"
Duration: Immediate
Threshold: Any failure of large transaction
Impact: Potential customer loss
Action: Immediate notification and remediation

Alert: PaymentProcessingTimeout
Severity: WARNING
Condition: |
  payment_processing_duration > 30000
Duration: 5 minutes
Threshold: Payment processing > 30 seconds
Impact: Poor user experience
Action: Optimize payment processing
```

### 5.2 Data Quality Alerts

```yaml
Alert: UnusualDataPattern
Severity: WARNING
Condition: |
  stddev(daily_records) > baseline * 3
Duration: Variable
Threshold: Significant deviation from baseline
Impact: Data quality concern
Action: Investigate anomaly

Alert: MissingRequiredFields
Severity: WARNING
Condition: |
  records_with_missing_fields > 10
Duration: 5 minutes
Threshold: > 10 records with missing data
Impact: Data incompleteness
Action: Review data validation
```

---

## Alert Implementation

### 6.1 Alert Manager

```javascript
// src/lib/monitoring/alertManager.js

export class AlertManager {
  constructor() {
    this.alerts = []
    this.alertHistory = []
  }

  createAlert(config) {
    const alert = {
      id: this.generateAlertId(),
      name: config.name,
      severity: config.severity,
      condition: config.condition,
      duration: config.duration,
      threshold: config.threshold,
      createdAt: Date.now(),
      status: 'firing'
    }

    this.alerts.push(alert)
    this.notifyAlert(alert)

    return alert
  }

  resolveAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.status = 'resolved'
      alert.resolvedAt = Date.now()
      this.alertHistory.push(alert)
      this.alerts = this.alerts.filter(a => a.id !== alertId)
    }
  }

  async notifyAlert(alert) {
    // Send to notification channels
    if (alert.severity === 'critical') {
      await this.notifySlack(alert)
      await this.notifyPagerDuty(alert)
      await this.notifyEmail(alert)
    } else if (alert.severity === 'warning') {
      await this.notifySlack(alert)
    }
  }

  async notifySlack(alert) {
    const message = this.formatSlackMessage(alert)
    await fetch(import.meta.env.VITE_SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })
  }

  formatSlackMessage(alert) {
    const colorMap = {
      critical: 'danger',
      warning: 'warning',
      info: 'good'
    }

    return {
      text: `${alert.severity.toUpperCase()}: ${alert.name}`,
      attachments: [{
        color: colorMap[alert.severity],
        fields: [
          { title: 'Severity', value: alert.severity, short: true },
          { title: 'Threshold', value: alert.threshold, short: true },
          { title: 'Condition', value: alert.condition, short: false },
          { title: 'Time', value: new Date(alert.createdAt).toISOString(), short: true }
        ]
      }]
    }
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getActiveAlerts() {
    return this.alerts.filter(a => a.status === 'firing')
  }

  getAlertHistory(limit = 100) {
    return this.alertHistory.slice(-limit)
  }
}

export const alertManager = new AlertManager()
```

---

## Escalation Policies

### 7.1 Escalation Rules

```yaml
P1 - CRITICAL (Page immediately)
Severity: Critical
Response Time: < 5 minutes
Resolution SLA: < 1 hour
Escalate To:
  - Primary on-call engineer
  - Team lead
  - VP Engineering (if > 15 min unresolved)

Examples:
  - Application completely down
  - Database unavailable
  - Authentication service down
  - Payment processing failure
  - Data corruption detected

---

P2 - WARNING (Address within 1 hour)
Severity: High
Response Time: < 15 minutes
Resolution SLA: < 4 hours
Escalate To:
  - On-call engineer
  - Team lead (if > 30 min unresolved)

Examples:
  - Error rate > 1%
  - Response time > 5 seconds
  - Database connection issues
  - Memory usage > 80%

---

P3 - INFO (Address in next business day)
Severity: Low
Response Time: < 4 hours
Resolution SLA: < 24 hours
Escalate To:
  - Engineering team
  - Backlog for sprint planning

Examples:
  - Validation errors
  - Minor performance degradation
  - Log file rotation issues
  - Documentation needs update
```

### 7.2 On-Call Escalation

```javascript
// src/lib/monitoring/escalation.js

export const ESCALATION_POLICY = {
  critical: {
    page: ['primary_engineer', 'team_lead', 'vp_engineering'],
    delay: [0, 15 * 60 * 1000, 30 * 60 * 1000],
    resolutionSLA: 60 * 60 * 1000 // 1 hour
  },
  warning: {
    page: ['on_call_engineer', 'team_lead'],
    delay: [0, 30 * 60 * 1000],
    resolutionSLA: 4 * 60 * 60 * 1000 // 4 hours
  },
  info: {
    page: ['team_email'],
    delay: [0],
    resolutionSLA: 24 * 60 * 60 * 1000 // 24 hours
  }
}

export async function escalateAlert(alert) {
  const policy = ESCALATION_POLICY[alert.severity]
  
  for (let i = 0; i < policy.page.length; i++) {
    const contact = policy.page[i]
    const delay = policy.delay[i]

    setTimeout(async () => {
      await notifyContact(contact, alert)
    }, delay)
  }

  // Check if not resolved by SLA
  setTimeout(async () => {
    if (!alert.resolved) {
      await notifyExecutive(alert)
    }
  }, policy.resolutionSLA)
}
```

---

## Alert Dashboard

```javascript
// src/components/monitoring/AlertDashboard.jsx

export function AlertDashboard() {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      setAlerts(alertManager.getActiveAlerts())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const criticalCount = alerts.filter(a => a.severity === 'critical').length
  const warningCount = alerts.filter(a => a.severity === 'warning').length

  return (
    <div className="alert-dashboard">
      <div className="alert-summary">
        <div className={`critical-count ${criticalCount > 0 ? 'active' : ''}`}>
          Critical: {criticalCount}
        </div>
        <div className={`warning-count ${warningCount > 0 ? 'active' : ''}`}>
          Warnings: {warningCount}
        </div>
      </div>

      <div className="active-alerts">
        {alerts.map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  )
}
```

---

**Last Updated**: April 19, 2026  
**Maintained By**: SRE & Monitoring Team
