# Production Monitoring Setup for SolarTrack Pro

**Version**: 1.0  
**Last Updated**: April 19, 2026  
**Status**: Production-Ready

---

## Overview

This guide provides comprehensive monitoring setup for SolarTrack Pro in production environments. It covers error tracking, performance monitoring, log aggregation, alerting, and health check implementation.

---

## Table of Contents

1. [Error Tracking Integration](#error-tracking-integration)
2. [Performance Monitoring Setup](#performance-monitoring-setup)
3. [Log Aggregation Strategy](#log-aggregation-strategy)
4. [Alerting Rules and Thresholds](#alerting-rules-and-thresholds)
5. [Dashboard Configuration](#dashboard-configuration)
6. [Health Check Endpoint](#health-check-endpoint)
7. [Implementation Checklist](#implementation-checklist)

---

## Error Tracking Integration

### 1.1 Sentry Setup (Recommended)

Sentry is pre-integrated in the application's `errorTracking.js` module.

#### Environment Configuration

```bash
# .env.production
VITE_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project-id]
VITE_APP_VERSION=1.0.0
```

#### Sentry Initialization

The application automatically initializes Sentry when the SDK is available:

```javascript
// src/lib/logger/errorTracking.js
import { errorTracking } from '@/lib/logger'

// Sentry is automatically configured on app start
// No additional setup needed if VITE_SENTRY_DSN is set
```

#### Capturing Errors

```javascript
import { logger } from '@/lib/logger'
import { errorTracking } from '@/lib/logger'

// Method 1: Using logger (automatic Sentry capture in production)
logger.error('Payment processing failed', {
  orderId: '12345',
  amount: 99.99,
  status: 'failed'
})

// Method 2: Direct exception capture
try {
  // risky operation
} catch (error) {
  logger.exception(error, {
    operation: 'payment_processing',
    userId: currentUser.id,
    orderId: '12345'
  })
}

// Method 3: Manual error capture
errorTracking.captureException(error, {
  extra: {
    customData: 'value'
  }
})

// Method 4: Capture message without exception
errorTracking.captureError('Payment API rate limit exceeded', {
  level: 'warning',
  extra: {
    rateLimitRemaining: 5,
    resetTime: '2026-04-19T15:30:00Z'
  }
})
```

#### Setting User Context

```javascript
import { errorTracking } from '@/lib/logger'

// When user logs in
errorTracking.setUserContext({
  id: user.id,
  email: user.email,
  username: user.username
}, {
  subscription: user.plan,
  team: user.team_id
})

// Clear on logout
errorTracking.clearUserContext()
```

#### Adding Breadcrumbs

```javascript
// Breadcrumbs help track user action flow before an error
errorTracking.addBreadcrumb('User clicked Export PDF', {
  page: '/reports',
  action: 'export_pdf'
}, 'info')

// Error occurs next
errorTracking.captureException(error, {
  extra: { context: 'pdf_export' }
})
// Sentry will show the breadcrumb trail
```

### 1.2 Alternative: Rollbar Integration

If using Rollbar instead:

```bash
# .env.production
VITE_ROLLBAR_ACCESS_TOKEN=post_server_item_[token]
VITE_ROLLBAR_ENVIRONMENT=production
```

```javascript
// src/lib/monitoring/rollbar.js
import { logger } from '@/lib/logger'

class RollbarIntegration {
  constructor() {
    this.rollbar = window.Rollbar
  }

  captureError(message, level = 'error', data = {}) {
    if (this.rollbar) {
      this.rollbar.log(level, message, data)
    }
  }

  captureException(error, data = {}) {
    if (this.rollbar) {
      this.rollbar.error(error, data)
    }
  }
}

export default new RollbarIntegration()
```

### 1.3 Error Categories

The system automatically categorizes errors:

| Category | Detection | Priority |
|----------|-----------|----------|
| Network | Fetch, CORS, timeout errors | High |
| Authentication | 401, 403, JWT errors | Critical |
| Validation | Invalid input, missing fields | Medium |
| Database | SQL, constraint errors | Critical |
| Application | TypeError, ReferenceError | High |

---

## Performance Monitoring Setup

### 2.1 Core Web Vitals Monitoring

The application tracks Core Web Vitals automatically:

```javascript
import performanceMonitoring from '@/lib/performanceMonitoring'

// Access metrics
const metrics = performanceMonitoring.getMetrics()
console.log({
  lcp: metrics.lcp?.value,  // Largest Contentful Paint
  fid: metrics.fid?.value,  // First Input Delay
  cls: metrics.cls?.value   // Cumulative Layout Shift
})
```

#### Send to Analytics Backend

```javascript
// POST /api/analytics/metrics
fetch('/api/analytics/metrics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    metrics: performanceMonitoring.exportMetrics(),
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
    userId: getCurrentUserId(),
    sessionId: getSessionId()
  })
})
```

### 2.2 API Response Time Monitoring

```javascript
// src/lib/monitoring/apiMonitor.js

export class APIMonitor {
  static trackRequest(endpoint, startTime) {
    const duration = performance.now() - startTime
    
    // Send to monitoring service
    navigator.sendBeacon('/api/metrics/request', JSON.stringify({
      endpoint,
      duration,
      timestamp: new Date().toISOString(),
      success: duration < 5000
    }))
  }
}

// Usage in API calls
const startTime = performance.now()
const response = await fetch('/api/data')
APIMonitor.trackRequest('/api/data', startTime)
```

### 2.3 Custom Performance Metrics

```javascript
import performanceMonitoring from '@/lib/performanceMonitoring'

// Track route navigation
export function ReportsPage() {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const duration = performance.now() - startTime
      performanceMonitoring.trackRouteMetric('/reports', duration)
    }
  }, [])
}

// Track data loading
async function loadProjectData(projectId) {
  const startTime = performance.now()
  const data = await fetch(`/api/projects/${projectId}`)
  const duration = performance.now() - startTime
  
  performanceMonitoring.trackRouteMetric(`/api/projects/${projectId}`, duration)
  return data
}
```

---

## Log Aggregation Strategy

### 3.1 Local Log Storage

Logs are automatically stored locally for debugging:

```javascript
import { logger } from '@/lib/logger'

// Access stored logs
const logs = logger.exportLogs()
console.log('Stored logs:', logs)

// Get statistics
const stats = logger.getStats()
console.log('Log stats:', stats)
```

### 3.2 ELK Stack Integration (Elasticsearch, Logstash, Kibana)

For production deployments:

```javascript
// src/lib/monitoring/elkLogger.js

export class ELKLogger {
  constructor(logstashUrl) {
    this.logstashUrl = logstashUrl
  }

  async sendLog(logEntry) {
    try {
      await fetch(this.logstashUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: logEntry.timestamp,
          level: logEntry.level,
          message: logEntry.message,
          context: logEntry.context,
          sessionId: logEntry.sessionId,
          userId: logEntry.context?.userId,
          environment: logEntry.context?.environment,
          version: logEntry.context?.version
        })
      })
    } catch (error) {
      console.error('Failed to send log to ELK:', error)
    }
  }
}

export default new ELKLogger(import.meta.env.VITE_LOGSTASH_URL)
```

### 3.3 Datadog Integration

```javascript
// src/lib/monitoring/datadog.js

import { logger } from '@/lib/logger'

export class DatadogLogger {
  constructor() {
    this.initializeDatadog()
  }

  initializeDatadog() {
    if (window.DD_RUM) {
      window.DD_RUM.init({
        applicationId: import.meta.env.VITE_DATADOG_APP_ID,
        clientToken: import.meta.env.VITE_DATADOG_CLIENT_TOKEN,
        site: 'datadoghq.com',
        service: 'solartrack-pro',
        env: import.meta.env.MODE,
        version: import.meta.env.VITE_APP_VERSION,
        sessionSampleRate: 100,
        sessionReplaySampleRate: 20,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask-user-input'
      })
      
      window.DD_RUM.startSessionReplayRecording()
    }
  }

  addBreadcrumb(action, data = {}) {
    if (window.DD_RUM) {
      window.DD_RUM.addUserAction(action, data)
    }
  }

  captureError(error) {
    if (window.DD_RUM) {
      window.DD_RUM.addError(error)
    }
  }
}

export default new DatadogLogger()
```

### 3.4 CloudWatch Integration (AWS)

```javascript
// src/lib/monitoring/cloudwatch.js

import { CloudWatchLogs } from '@aws-sdk/client-cloudwatch-logs'

export class CloudWatchLogger {
  constructor() {
    this.client = new CloudWatchLogs({
      region: import.meta.env.VITE_AWS_REGION
    })
    this.logGroupName = '/solartrack/app'
    this.logStreamName = `stream-${Date.now()}`
  }

  async sendLog(logEntry) {
    try {
      await this.client.putLogEvents({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [{
          timestamp: new Date(logEntry.timestamp).getTime(),
          message: JSON.stringify({
            level: logEntry.level,
            message: logEntry.message,
            context: logEntry.context,
            sessionId: logEntry.sessionId
          })
        }]
      })
    } catch (error) {
      console.error('Failed to send log to CloudWatch:', error)
    }
  }
}

export default new CloudWatchLogger()
```

---

## Alerting Rules and Thresholds

### 4.1 Error Rate Alerts

```javascript
// src/lib/monitoring/alerts.js

export const ALERT_RULES = {
  // Error rate thresholds
  errorRate: {
    warning: 0.005,  // > 0.5% error rate
    critical: 0.01,  // > 1% error rate
    window: '5m'     // Evaluate over 5 minutes
  },

  // Response time thresholds
  responseTime: {
    warning: 2000,   // > 2 seconds
    critical: 5000,  // > 5 seconds
    percentile: 'p95' // 95th percentile
  },

  // Resource exhaustion
  resources: {
    memory: {
      warning: 80,     // > 80% memory usage
      critical: 90     // > 90% memory usage
    },
    cpu: {
      warning: 75,     // > 75% CPU usage
      critical: 90     // > 90% CPU usage
    }
  }
}
```

### 4.2 Alert Implementation

```javascript
import { logger } from '@/lib/logger'
import { errorTracking } from '@/lib/logger'

export class AlertManager {
  checkErrorRate(errorCount, totalRequests, threshold) {
    const rate = errorCount / totalRequests
    
    if (rate > threshold.critical) {
      this.raiseAlert('CRITICAL', 'High error rate', {
        errorRate: (rate * 100).toFixed(2) + '%',
        threshold: (threshold.critical * 100) + '%'
      })
    } else if (rate > threshold.warning) {
      this.raiseAlert('WARNING', 'Elevated error rate', {
        errorRate: (rate * 100).toFixed(2) + '%',
        threshold: (threshold.warning * 100) + '%'
      })
    }
  }

  checkResponseTime(duration, threshold) {
    if (duration > threshold.critical) {
      this.raiseAlert('CRITICAL', 'Slow API response', {
        duration: duration.toFixed(0) + 'ms',
        threshold: threshold.critical + 'ms'
      })
    } else if (duration > threshold.warning) {
      logger.warn('Slow API response detected', {
        duration,
        threshold: threshold.warning
      })
    }
  }

  raiseAlert(severity, message, data = {}) {
    logger.error(`[${severity}] ${message}`, data)
    
    // Send to alerting service
    fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        severity,
        message,
        data,
        timestamp: new Date().toISOString(),
        source: 'frontend'
      })
    }).catch(err => console.error('Alert send failed:', err))
  }
}

export default new AlertManager()
```

### 4.3 Alert Notification Configuration

```javascript
// src/lib/monitoring/notifications.js

export const NOTIFICATION_CHANNELS = {
  slack: {
    enabled: true,
    webhookUrl: import.meta.env.VITE_SLACK_WEBHOOK_URL,
    channel: '#alerts-solartrack',
    mentionOnCritical: '@solartrack-team'
  },

  email: {
    enabled: true,
    recipients: ['ops@company.com'],
    criticalOnly: false
  },

  pagerduty: {
    enabled: true,
    integrationKey: import.meta.env.VITE_PAGERDUTY_KEY,
    severityMap: {
      'critical': 'critical',
      'warning': 'warning',
      'info': 'info'
    }
  }
}

// Send alert to multiple channels
async function notifyAlert(severity, title, body) {
  // Slack
  if (NOTIFICATION_CHANNELS.slack.enabled) {
    await fetch(NOTIFICATION_CHANNELS.slack.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${severity}: ${title}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${severity}*: ${title}\n${body}`
            }
          }
        ]
      })
    })
  }

  // PagerDuty (critical only)
  if (NOTIFICATION_CHANNELS.pagerduty.enabled && severity === 'critical') {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: NOTIFICATION_CHANNELS.pagerduty.integrationKey,
        event_action: 'trigger',
        payload: {
          summary: title,
          severity: NOTIFICATION_CHANNELS.pagerduty.severityMap[severity],
          source: 'SolarTrack Pro',
          custom_details: { details: body }
        }
      })
    })
  }
}
```

---

## Dashboard Configuration

### 5.1 Grafana Dashboard Setup

```json
{
  "dashboard": {
    "title": "SolarTrack Pro - Production Monitoring",
    "tags": ["solartrack", "production"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(errors_total[5m]) / rate(requests_total[5m])"
          }
        ],
        "alert": {
          "conditions": [
            {
              "evaluator": { "params": [0.01], "type": "gt" },
              "operator": { "type": "and" },
              "query": { "params": ["A", "5m", "now"] },
              "type": "query"
            }
          ]
        }
      },
      {
        "id": 2,
        "title": "API Response Time (P95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(api_request_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "id": 3,
        "title": "Core Web Vitals",
        "type": "stat",
        "targets": [
          {
            "expr": "avg(core_web_vitals_lcp)",
            "refId": "LCP"
          },
          {
            "expr": "avg(core_web_vitals_fid)",
            "refId": "FID"
          },
          {
            "expr": "avg(core_web_vitals_cls)",
            "refId": "CLS"
          }
        ]
      },
      {
        "id": 4,
        "title": "Active Users",
        "type": "gauge",
        "targets": [
          {
            "expr": "active_users_count"
          }
        ]
      }
    ]
  }
}
```

### 5.2 Custom Dashboard

```javascript
// src/components/monitoring/MonitoringDashboard.jsx

import React, { useState, useEffect } from 'react'
import performanceMonitoring from '@/lib/performanceMonitoring'
import { logger } from '@/lib/logger'

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState({
    coreWebVitals: {},
    errorStats: {},
    responseTime: {}
  })

  useEffect(() => {
    const interval = setInterval(() => {
      const summary = performanceMonitoring.getSummary()
      const logs = logger.exportLogs()
      const stats = logger.getStats()

      setMetrics({
        coreWebVitals: summary.coreWebVitals || {},
        errorStats: {
          total: stats.total,
          errors: stats.errors,
          rate: (stats.errors / stats.total * 100).toFixed(2) + '%'
        },
        responseTime: summary.routeMetrics || {}
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="monitoring-dashboard">
      <div className="card">
        <h3>Core Web Vitals</h3>
        <div className="metrics-grid">
          <MetricCard
            label="LCP"
            value={metrics.coreWebVitals.lcp?.value}
            unit="ms"
            status={metrics.coreWebVitals.lcp?.rating}
          />
          <MetricCard
            label="FID"
            value={metrics.coreWebVitals.fid?.value}
            unit="ms"
            status={metrics.coreWebVitals.fid?.rating}
          />
          <MetricCard
            label="CLS"
            value={metrics.coreWebVitals.cls?.value}
            unit=""
            status={metrics.coreWebVitals.cls?.rating}
          />
        </div>
      </div>

      <div className="card">
        <h3>Error Statistics</h3>
        <p>Error Rate: {metrics.errorStats.rate}</p>
        <p>Total Errors: {metrics.errorStats.errors}</p>
      </div>

      <div className="card">
        <h3>API Response Times</h3>
        {Object.entries(metrics.responseTime).map(([route, data]) => (
          <div key={route}>
            <span>{route}</span>
            <span>{data.avg?.toFixed(0)}ms avg</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricCard({ label, value, unit, status }) {
  return (
    <div className={`metric-card status-${status}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}{unit}</div>
      <div className="metric-status">{status}</div>
    </div>
  )
}
```

---

## Health Check Endpoint

### 6.1 Backend Health Check Implementation

```javascript
// src/api/health.js

import { logger } from '@/lib/logger'
import supabase from '@/lib/supabase'

export async function handleHealthCheck(req, res) {
  const startTime = Date.now()
  const checks = {
    database: false,
    api: true,
    timestamp: new Date().toISOString()
  }

  try {
    // Check database connectivity
    const { data, error: dbError } = await supabase
      .from('projects')
      .select('count', { count: 'exact', head: true })

    if (!dbError && data !== null) {
      checks.database = true
    } else {
      throw new Error('Database check failed')
    }

    // Check cache/Redis if available
    if (process.env.REDIS_URL) {
      // Add Redis health check
      checks.cache = true
    }

    const responseTime = Date.now() - startTime

    return res.status(200).json({
      status: 'healthy',
      checks,
      responseTime: responseTime + 'ms',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0'
    })
  } catch (error) {
    logger.error('Health check failed', {
      error: error.message,
      checks
    })

    return res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      checks,
      timestamp: new Date().toISOString()
    })
  }
}
```

### 6.2 Frontend Health Check

```javascript
// src/lib/monitoring/healthCheck.js

export class HealthMonitor {
  static async checkHealth(endpoint = '/api/health') {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        timeout: 5000
      })

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`)
      }

      const health = await response.json()
      return {
        healthy: health.status === 'healthy',
        data: health
      }
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      }
    }
  }

  static async monitorContinuously(interval = 30000) {
    setInterval(async () => {
      const result = await this.checkHealth()

      if (!result.healthy) {
        logger.warn('Application health degraded', {
          error: result.error,
          timestamp: new Date().toISOString()
        })
      }
    }, interval)
  }
}

// Start monitoring on app initialization
export function initializeHealthMonitoring() {
  HealthMonitor.monitorContinuously(30000) // Check every 30 seconds
}
```

### 6.3 External Uptime Monitoring

```bash
# Uptime Robot Configuration
Service: SolarTrack Pro
URL: https://solartrack.com/api/health
Method: GET
Timeout: 10 seconds
Check Interval: 5 minutes
Expected Status: 200
Expected Response: {"status":"healthy"}
Notifications: Email, Slack, SMS
```

---

## Implementation Checklist

- [ ] **Error Tracking**
  - [ ] Configure Sentry DSN in environment
  - [ ] Test error capture in development
  - [ ] Set up Sentry alerts in dashboard
  - [ ] Configure error grouping rules
  - [ ] Set up release tracking

- [ ] **Performance Monitoring**
  - [ ] Enable Core Web Vitals monitoring
  - [ ] Configure analytics endpoint
  - [ ] Set performance budgets
  - [ ] Create performance dashboard
  - [ ] Set up performance alerts

- [ ] **Log Aggregation**
  - [ ] Choose aggregation service (ELK/Datadog/CloudWatch)
  - [ ] Configure log shipper
  - [ ] Set up log retention policies
  - [ ] Create log search dashboards
  - [ ] Test log sampling

- [ ] **Alerting**
  - [ ] Configure Slack webhook
  - [ ] Set up PagerDuty integration
  - [ ] Define alert rules
  - [ ] Create runbooks for common alerts
  - [ ] Test alert delivery

- [ ] **Dashboards**
  - [ ] Create Grafana dashboards
  - [ ] Set up custom monitoring views
  - [ ] Configure dashboard sharing
  - [ ] Add dashboard documentation

- [ ] **Health Checks**
  - [ ] Implement health check endpoint
  - [ ] Set up external uptime monitoring
  - [ ] Test failover scenarios
  - [ ] Document recovery procedures

- [ ] **Documentation**
  - [ ] Document alert escalation procedures
  - [ ] Create runbooks for major alerts
  - [ ] Document dashboard metrics
  - [ ] Train team on monitoring tools

---

## Support and Resources

- **Sentry Documentation**: https://docs.sentry.io
- **Grafana Guide**: https://grafana.com/docs/grafana/latest/
- **ELK Stack**: https://www.elastic.co/what-is/elk-stack
- **Datadog**: https://www.datadoghq.com
- **Monitoring Best Practices**: https://landing.google.com/sre/sre-book/

---

**Last Updated**: April 19, 2026  
**Maintained By**: DevOps Team
