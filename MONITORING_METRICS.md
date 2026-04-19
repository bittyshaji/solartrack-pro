# Monitoring Metrics for SolarTrack Pro

**Version**: 1.0  
**Last Updated**: April 19, 2026  
**Status**: Production-Ready

---

## Overview

This document defines the Key Performance Indicators (KPIs), critical error types, performance budgets, and SLA targets for SolarTrack Pro production monitoring.

---

## Table of Contents

1. [Key Performance Indicators (KPIs)](#key-performance-indicators-kpis)
2. [Critical Error Types and Thresholds](#critical-error-types-and-thresholds)
3. [Performance Budgets](#performance-budgets)
4. [SLA Targets](#sla-targets)
5. [Metrics Collection](#metrics-collection)
6. [Reporting](#reporting)

---

## Key Performance Indicators (KPIs)

### 1.1 User Experience KPIs

#### Core Web Vitals

| Metric | Target | Warning | Critical | Impact |
|--------|--------|---------|----------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | > 2.5s | > 4.0s | Page feels slow to load |
| **FID** (First Input Delay) | < 100ms | > 100ms | > 300ms | Page feels unresponsive |
| **CLS** (Cumulative Layout Shift) | < 0.1 | > 0.1 | > 0.25 | Visual instability |
| **TTFB** (Time to First Byte) | < 600ms | > 600ms | > 1500ms | Server response slow |
| **TTI** (Time to Interactive) | < 2s | > 2.5s | > 5s | Page not interactive |

#### Tracking Web Vitals

```javascript
import performanceMonitoring from '@/lib/performanceMonitoring'

// Get current metrics
const vitals = performanceMonitoring.getMetrics()

// Rating scale:
// 'good': Meets target
// 'needs-improvement': Between target and critical
// 'poor': Exceeds critical threshold

console.log({
  lcp: {
    value: vitals.lcp?.value,     // milliseconds
    rating: vitals.lcp?.rating,   // 'good', 'needs-improvement', 'poor'
    target: 2500
  },
  fid: {
    value: vitals.fid?.value,
    rating: vitals.fid?.rating,
    target: 100
  },
  cls: {
    value: vitals.cls?.value,
    rating: vitals.cls?.rating,
    target: 0.1
  }
})
```

### 1.2 Application Performance KPIs

| Metric | Target | Warning | Critical | Unit |
|--------|--------|---------|----------|------|
| API Response Time (P50) | < 200ms | > 300ms | > 1000ms | milliseconds |
| API Response Time (P95) | < 500ms | > 750ms | > 2000ms | milliseconds |
| API Response Time (P99) | < 1s | > 1.5s | > 3s | seconds |
| Page Load Time | < 2s | > 2.5s | > 5s | seconds |
| Time to Interactive | < 2s | > 2.5s | > 5s | seconds |
| JavaScript Bundle Size | < 200KB | > 250KB | > 400KB | kilobytes |
| CSS Bundle Size | < 50KB | > 75KB | > 150KB | kilobytes |

#### Implementation

```javascript
// src/lib/monitoring/apiMetrics.js

export class APIMetrics {
  static recordRequest(endpoint, duration, statusCode) {
    const metric = {
      endpoint,
      duration,
      statusCode,
      timestamp: Date.now(),
      p50: 200,
      p95: 500,
      p99: 1000
    }

    // Assess status
    if (duration > metric.p99) {
      return { status: 'critical', ...metric }
    } else if (duration > metric.p95) {
      return { status: 'warning', ...metric }
    } else {
      return { status: 'good', ...metric }
    }
  }

  static monitorEndpoint(endpoint) {
    const requests = []
    
    return {
      record(duration, statusCode) {
        requests.push({ duration, statusCode, timestamp: Date.now() })
        
        // Keep last 100 requests
        if (requests.length > 100) {
          requests.shift()
        }
      },

      getStats() {
        const sorted = requests
          .map(r => r.duration)
          .sort((a, b) => a - b)

        return {
          count: requests.length,
          p50: sorted[Math.floor(sorted.length * 0.50)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)],
          avg: sorted.reduce((a, b) => a + b, 0) / sorted.length,
          min: sorted[0],
          max: sorted[sorted.length - 1]
        }
      }
    }
  }
}
```

### 1.3 Business KPIs

| Metric | Target | Warning | Critical | Unit |
|--------|--------|---------|----------|------|
| Feature Success Rate | > 99% | < 99% | < 95% | percentage |
| Transaction Success Rate | > 99.9% | < 99.9% | < 99% | percentage |
| Error Rate | < 0.1% | > 0.5% | > 1% | percentage |
| Availability | > 99.9% | < 99.9% | < 99% | percentage |
| Daily Active Users | Baseline | -10% | -20% | percentage change |

---

## Critical Error Types and Thresholds

### 2.1 Error Categories and Severity

| Error Type | Category | Severity | Action | Examples |
|-----------|----------|----------|--------|----------|
| **Authentication Failure** | Auth | Critical | Page immediately | JWT expired, invalid token, unauthorized access |
| **Database Connection** | Database | Critical | Page immediately | Connection refused, timeout, pool exhausted |
| **API Timeout** | Network | High | Alert team | Request > 30 seconds |
| **Payment Processing Failure** | Business | Critical | Immediate action | Failed transactions |
| **Data Corruption** | Data | Critical | Incident response | Invalid state, data mismatch |
| **Rate Limit Exceeded** | Rate Limiting | Warning | Monitor | API rate limit hit |
| **Validation Error** | Validation | Low | Log only | Missing fields, invalid format |
| **Resource Exhaustion** | Infrastructure | High | Alert ops | Memory > 90%, CPU > 90% |

### 2.2 Error Threshold Rules

```javascript
// src/lib/monitoring/errorThresholds.js

export const ERROR_THRESHOLDS = {
  // Authentication errors - any failure is critical
  AUTH_ERROR: {
    threshold: 1,
    window: '5m',
    severity: 'critical',
    action: 'immediate'
  },

  // Database errors - more than 5 in 5 minutes is warning
  DATABASE_ERROR: {
    threshold: 5,
    window: '5m',
    severity: 'critical',
    action: 'page_on_call'
  },

  // Network errors - more than 10% of requests
  NETWORK_ERROR: {
    threshold: 0.10,
    window: '5m',
    severity: 'high',
    action: 'alert_team'
  },

  // Validation errors - only logged
  VALIDATION_ERROR: {
    threshold: 100,
    window: '5m',
    severity: 'low',
    action: 'log_only'
  },

  // Rate limiting - warning if exceeded
  RATE_LIMIT_EXCEEDED: {
    threshold: 10,
    window: '1h',
    severity: 'warning',
    action: 'alert_team'
  }
}

// Usage
export function evaluateErrorThreshold(errorType, count, window) {
  const rule = ERROR_THRESHOLDS[errorType]
  
  if (!rule) return { alert: false }

  const isThresholdExceeded = count >= rule.threshold
  
  return {
    alert: isThresholdExceeded,
    severity: rule.severity,
    action: rule.action,
    message: `${errorType}: ${count} occurrences in ${window}`
  }
}
```

### 2.3 Error Rate Calculation

```javascript
// src/lib/monitoring/errorRate.js

export class ErrorRateMonitor {
  constructor(windowMs = 300000) { // 5 minutes
    this.windowMs = windowMs
    this.errors = []
    this.totalRequests = 0
  }

  recordRequest(success = true) {
    this.totalRequests++
    
    if (!success) {
      this.errors.push({
        timestamp: Date.now(),
        type: 'request_error'
      })
    }

    this.cleanup()
  }

  cleanup() {
    const now = Date.now()
    this.errors = this.errors.filter(e => now - e.timestamp < this.windowMs)
  }

  getErrorRate() {
    const recentRequests = this.countRecentRequests()
    
    if (recentRequests === 0) return 0
    
    return this.errors.length / recentRequests
  }

  countRecentRequests() {
    // In production, use actual metrics
    return this.totalRequests
  }

  evaluate() {
    const rate = this.getErrorRate()
    
    if (rate > 0.01) { // > 1%
      return { severity: 'critical', rate, threshold: 0.01 }
    } else if (rate > 0.005) { // > 0.5%
      return { severity: 'warning', rate, threshold: 0.005 }
    } else {
      return { severity: 'ok', rate, threshold: 0.005 }
    }
  }
}
```

---

## Performance Budgets

### 3.1 Bundle Size Budget

```javascript
// scripts/bundleSize.js

const BUNDLE_BUDGETS = {
  javascript: {
    main: 150000,      // 150 KB
    vendors: 300000,   // 300 KB
    total: 400000      // 400 KB
  },
  css: {
    main: 50000,       // 50 KB
    total: 75000       // 75 KB
  },
  images: {
    total: 500000      // 500 KB
  },
  fonts: {
    total: 100000      // 100 KB
  }
}

// Check bundle size in build process
function checkBundleSize(buildResults) {
  const issues = []

  for (const [bundle, size] of Object.entries(buildResults.bundles)) {
    const budget = BUNDLE_BUDGETS.javascript[bundle]
    
    if (size > budget) {
      issues.push({
        bundle,
        size,
        budget,
        exceeded: size - budget,
        severity: size > budget * 1.2 ? 'error' : 'warning'
      })
    }
  }

  return issues
}
```

### 3.2 Runtime Performance Budget

| Metric | Budget | Action |
|--------|--------|--------|
| **First Contentful Paint** | < 1.5s | Block release if exceeded |
| **Largest Contentful Paint** | < 2.5s | Block release if exceeded |
| **Time to Interactive** | < 3s | Warn if exceeded |
| **Memory Usage** | < 50MB | Warn if exceeded |
| **CPU Usage** | < 60% average | Investigate if exceeded |

---

## SLA Targets

### 4.1 Service Level Agreements

```yaml
# Service Level Objectives (SLOs)

availability:
  target: 99.9%                    # 43 minutes downtime per month
  measurement: uptime minutes / total minutes
  reporting: monthly

performance:
  api_response_p99:
    target: 1000ms
    measurement: 99th percentile of all API requests
    reporting: daily

  page_load:
    target: 3000ms
    measurement: 99th percentile of page loads
    reporting: daily

reliability:
  error_rate:
    target: < 0.1%                # Less than 1 error per 1000 requests
    measurement: (errors / total_requests) * 100
    reporting: real-time

  transaction_success:
    target: > 99.9%                # Less than 1 failed transaction per 1000
    measurement: successful_transactions / total_transactions
    reporting: daily

incident_response:
  p1_response_time: < 15 minutes   # Critical outage
  p1_resolution_time: < 1 hour
  p2_response_time: < 1 hour       # Significant degradation
  p2_resolution_time: < 4 hours
  p3_response_time: < 4 hours      # Minor issues
  p3_resolution_time: < 24 hours
```

### 4.2 SLA Calculation

```javascript
// src/lib/monitoring/slaCalculator.js

export class SLACalculator {
  static calculateAvailability(uptime, total) {
    return (uptime / total) * 100
  }

  static calculateErrorRate(errors, total) {
    return (errors / total) * 100
  }

  static getThisMonthSLA() {
    const daysInMonth = new Date().getDate()
    const allowedDowntimeMinutes = (1 - 0.999) * 24 * 60 * daysInMonth
    
    return {
      targetAvailability: 99.9,
      allowedDowntimeMinutes: allowedDowntimeMinutes.toFixed(2),
      daysRemaining: daysInMonth
    }
  }

  static reportSLA(metrics) {
    return {
      availability: this.calculateAvailability(metrics.uptime, metrics.total),
      errorRate: this.calculateErrorRate(metrics.errors, metrics.totalRequests),
      sloMet: {
        availability: metrics.availability >= 99.9,
        errorRate: metrics.errorRate <= 0.1,
        performance: metrics.p99ResponseTime <= 1000
      },
      reportDate: new Date().toISOString()
    }
  }
}
```

---

## Metrics Collection

### 5.1 Automated Collection

```javascript
// src/lib/monitoring/metricsCollector.js

export class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: [],
      errors: [],
      performance: [],
      custom: []
    }
    this.startAutoCollection()
  }

  startAutoCollection() {
    // Collect performance metrics every 5 seconds
    setInterval(() => {
      this.collectPerformanceMetrics()
      this.collectErrorMetrics()
      this.collectCustomMetrics()
    }, 5000)

    // Send to backend every minute
    setInterval(() => {
      this.sendMetrics()
    }, 60000)
  }

  collectPerformanceMetrics() {
    const metrics = performanceMonitoring.getMetrics()
    
    this.metrics.performance.push({
      timestamp: Date.now(),
      lcp: metrics.lcp?.value,
      fid: metrics.fid?.value,
      cls: metrics.cls?.value,
      ttfb: metrics.ttfb?.value
    })

    // Keep only last 100 samples
    if (this.metrics.performance.length > 100) {
      this.metrics.performance.shift()
    }
  }

  collectErrorMetrics() {
    const stats = logger.getStats()
    
    this.metrics.errors.push({
      timestamp: Date.now(),
      errorCount: stats.errors,
      totalRequests: stats.total,
      errorRate: (stats.errors / stats.total * 100).toFixed(2)
    })
  }

  collectCustomMetrics() {
    // Application-specific metrics
    this.metrics.custom.push({
      timestamp: Date.now(),
      activeUsers: this.countActiveUsers(),
      memoryUsage: performance.memory?.usedJSHeapSize / 1e6, // MB
      navigationTiming: this.getNavigationTiming()
    })
  }

  async sendMetrics() {
    try {
      await fetch('/api/analytics/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: this.metrics,
          timestamp: new Date().toISOString(),
          sessionId: logger.sessionId
        })
      })

      // Clear sent metrics
      this.metrics = {
        requests: [],
        errors: [],
        performance: [],
        custom: []
      }
    } catch (error) {
      console.error('Failed to send metrics:', error)
    }
  }

  getNavigationTiming() {
    const nav = performance.getEntriesByType('navigation')[0]
    return nav ? {
      dns: nav.domainLookupEnd - nav.domainLookupStart,
      tcp: nav.connectEnd - nav.connectStart,
      request: nav.responseStart - nav.requestStart,
      response: nav.responseEnd - nav.responseStart,
      dom: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart
    } : null
  }

  countActiveUsers() {
    // Implement based on your session tracking
    return document.querySelectorAll('[data-session]').length
  }
}

export const metricsCollector = new MetricsCollector()
```

---

## Reporting

### 6.1 Daily Report Template

```javascript
// src/lib/monitoring/reporter.js

export class MetricsReporter {
  static generateDailyReport(metrics) {
    return {
      date: new Date().toISOString().split('T')[0],
      summary: {
        uptime: metrics.uptime.toFixed(2) + '%',
        errorRate: metrics.errorRate.toFixed(3) + '%',
        avgResponseTime: metrics.avgResponseTime.toFixed(0) + 'ms'
      },
      coreWebVitals: {
        lcp: {
          value: metrics.lcp.avg.toFixed(0),
          rating: this.getRating(metrics.lcp.avg, 2500),
          p95: metrics.lcp.p95.toFixed(0)
        },
        fid: {
          value: metrics.fid.avg.toFixed(0),
          rating: this.getRating(metrics.fid.avg, 100),
          p95: metrics.fid.p95.toFixed(0)
        },
        cls: {
          value: metrics.cls.avg.toFixed(3),
          rating: this.getRating(metrics.cls.avg, 0.1),
          p95: metrics.cls.p95.toFixed(3)
        }
      },
      topErrors: metrics.errorsByType.slice(0, 5),
      sloStatus: {
        availability: metrics.uptime >= 99.9 ? 'MET' : 'MISSED',
        errorRate: metrics.errorRate <= 0.1 ? 'MET' : 'MISSED',
        performance: metrics.p99ResponseTime <= 1000 ? 'MET' : 'MISSED'
      },
      recommendations: this.generateRecommendations(metrics)
    }
  }

  static getRating(value, threshold) {
    if (value <= threshold) return 'good'
    if (value <= threshold * 1.5) return 'needs-improvement'
    return 'poor'
  }

  static generateRecommendations(metrics) {
    const recommendations = []

    if (metrics.lcp.avg > 2500) {
      recommendations.push('Optimize image loading and lazy-loading strategy')
    }

    if (metrics.errorRate > 0.1) {
      recommendations.push('Investigate increased error rate')
    }

    if (metrics.avgResponseTime > 500) {
      recommendations.push('Profile API endpoints and optimize database queries')
    }

    return recommendations
  }
}
```

### 6.2 Weekly Executive Summary

```javascript
// Generate weekly report
async function generateWeeklyReport() {
  const metrics = await fetchWeekMetrics()
  
  return {
    week: getWeekNumber(),
    highlights: {
      bestDay: findBestPerformanceDay(metrics),
      worstDay: findWorstPerformanceDay(metrics),
      incidents: getIncidentCount(metrics),
      sloAchievement: calculateSLOAchievement(metrics)
    },
    trends: {
      performanceTrend: calculateTrend(metrics, 'performance'),
      reliabilityTrend: calculateTrend(metrics, 'reliability'),
      errorTrend: calculateTrend(metrics, 'errors')
    },
    forecast: {
      projectedUptime: projectMetric(metrics, 'uptime'),
      riskFactors: identifyRisks(metrics)
    }
  }
}
```

---

## Integration with Monitoring Tools

### 6.3 Export Metrics to External Services

```javascript
// src/lib/monitoring/exporters.js

export async function exportToDatadog(metrics) {
  if (!window.DD_RUM) return

  window.DD_RUM.addUserAction('metrics_report', {
    availability: metrics.uptime,
    error_rate: metrics.errorRate,
    response_time_p99: metrics.p99ResponseTime
  })
}

export async function exportToSentry(metrics) {
  if (!window.Sentry) return

  window.Sentry.captureMessage('Daily Metrics Report', 'info', {
    extra: {
      uptime: metrics.uptime,
      errorRate: metrics.errorRate,
      coreWebVitals: {
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls
      }
    }
  })
}

export async function exportToGrafana(metrics) {
  // Push custom metrics via Grafana API
  await fetch(import.meta.env.VITE_GRAFANA_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_GRAFANA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      metrics: convertToPrometheus(metrics),
      timestamp: Date.now()
    })
  })
}
```

---

**Last Updated**: April 19, 2026  
**Maintained By**: DevOps & Monitoring Team
