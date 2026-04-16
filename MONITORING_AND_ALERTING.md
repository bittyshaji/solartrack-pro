# Monitoring & Alerting Setup for Email Service

---

## 1. KEY METRICS TO MONITOR

### 1.1 Email Service Metrics

#### Send Performance
| Metric | Target | Warning | Critical | Unit |
|--------|--------|---------|----------|------|
| Email Send Latency (P95) | < 2s | > 2.5s | > 5s | seconds |
| Email Send Latency (P99) | < 3s | > 3.5s | > 7s | seconds |
| Batch Send Time (10 emails) | < 5s | > 6s | > 10s | seconds |
| Successful Send Rate | > 99% | < 99% | < 95% | percentage |
| Failed Email Retry Rate | < 1% | > 2% | > 5% | percentage |

#### Queue Management
| Metric | Target | Warning | Critical | Unit |
|--------|--------|---------|----------|------|
| Pending Email Queue | < 50 | > 100 | > 500 | count |
| Failed Email Queue | < 10 | > 25 | > 100 | count |
| Average Queue Wait Time | < 1m | > 5m | > 30m | seconds |
| Queue Processing Time | < 1h | > 2h | > 4h | hours |

#### API Metrics
| Metric | Target | Warning | Critical | Unit |
|--------|--------|---------|----------|------|
| Resend API Response Time (P95) | < 500ms | > 750ms | > 2s | milliseconds |
| Resend API Error Rate | < 0.1% | > 0.5% | > 2% | percentage |
| Resend API Availability | > 99.9% | < 99.9% | < 99% | percentage |
| Rate Limit Hits | 0 | > 10/day | > 50/day | count |

#### Database Metrics
| Metric | Target | Warning | Critical | Unit |
|--------|--------|---------|----------|------|
| Email Table Query Time (P95) | < 100ms | > 200ms | > 500ms | milliseconds |
| Email Logging Latency | < 50ms | > 100ms | > 300ms | milliseconds |
| Connection Pool Usage | < 70% | > 80% | > 95% | percentage |
| Active Connections | < 20 | > 30 | > 50 | count |

### 1.2 Application Metrics

#### Overall Health
| Metric | Target | Warning | Critical | Unit |
|--------|--------|---------|----------|------|
| Application Uptime | > 99.9% | < 99.9% | < 99% | percentage |
| Error Rate | < 0.1% | > 0.5% | > 1% | percentage |
| Page Load Time (P95) | < 2s | > 2.5s | > 5s | seconds |
| API Response Time (P95) | < 200ms | > 300ms | > 500ms | milliseconds |

#### Infrastructure
| Metric | Target | Warning | Critical | Unit |
|--------|--------|---------|----------|------|
| CPU Usage | < 60% | > 75% | > 90% | percentage |
| Memory Usage | < 70% | > 80% | > 90% | percentage |
| Disk Usage | < 75% | > 85% | > 95% | percentage |
| Network I/O | < 80% | > 90% | > 95% | percentage |

---

## 2. PROMETHEUS CONFIGURATION

### 2.1 Prometheus Rules File

```yaml
# /etc/prometheus/rules/email-service.yml

groups:
  - name: email_service
    interval: 30s
    rules:
      
      # Email Send Latency Alerts
      - alert: HighEmailLatency_P95
        expr: histogram_quantile(0.95, rate(email_send_duration_seconds_bucket[5m])) > 2.5
        for: 5m
        labels:
          severity: warning
          service: email
        annotations:
          summary: "High email send latency (P95: > 2.5s)"
          description: "Email service latency is {{ $value }}s (threshold: 2.5s)"
          runbook_url: "https://wiki.solartrack.com/runbooks/email_latency"

      - alert: CriticalEmailLatency_P95
        expr: histogram_quantile(0.95, rate(email_send_duration_seconds_bucket[5m])) > 5
        for: 3m
        labels:
          severity: critical
          service: email
        annotations:
          summary: "CRITICAL: Email send latency exceeding threshold"
          description: "Email service latency is {{ $value }}s (threshold: 5s)"
          action: "Check Resend API status and database connections"

      # Email Success Rate Alerts
      - alert: LowEmailSuccessRate
        expr: |
          (
            rate(email_sent_total[5m]) / 
            (rate(email_sent_total[5m]) + rate(email_failed_total[5m]))
          ) < 0.99
        for: 10m
        labels:
          severity: warning
          service: email
        annotations:
          summary: "Email success rate below 99%"
          description: "Success rate: {{ $value | humanizePercentage }}"
          runbook_url: "https://wiki.solartrack.com/runbooks/email_failures"

      - alert: CriticalEmailSuccessRate
        expr: |
          (
            rate(email_sent_total[5m]) / 
            (rate(email_sent_total[5m]) + rate(email_failed_total[5m]))
          ) < 0.95
        for: 5m
        labels:
          severity: critical
          service: email
        annotations:
          summary: "CRITICAL: Email success rate < 95%"
          description: "Success rate: {{ $value | humanizePercentage }}"
          action: "Page on-call engineer immediately"

      # Email Queue Alerts
      - alert: EmailQueueBacklog
        expr: email_queue_pending > 100
        for: 10m
        labels:
          severity: warning
          service: email
        annotations:
          summary: "Email queue has significant backlog"
          description: "Pending emails: {{ $value }}"
          action: "Monitor queue processing or investigate delays"

      - alert: CriticalEmailQueueBacklog
        expr: email_queue_pending > 500
        for: 5m
        labels:
          severity: critical
          service: email
        annotations:
          summary: "CRITICAL: Email queue backlog"
          description: "Pending emails: {{ $value }}"
          action: "Investigate email processing immediately"

      - alert: FailedEmailQueueBacklog
        expr: email_queue_failed > 25
        for: 15m
        labels:
          severity: warning
          service: email
        annotations:
          summary: "Failed email queue accumulating"
          description: "Failed emails awaiting retry: {{ $value }}"
          action: "Review failed email logs and investigate root causes"

      # Resend API Alerts
      - alert: ResendAPIErrors
        expr: rate(resend_api_errors_total[5m]) > 0.005
        for: 5m
        labels:
          severity: warning
          service: email
          component: resend
        annotations:
          summary: "Resend API returning errors"
          description: "Error rate: {{ $value | humanizePercentage }}"
          runbook_url: "https://wiki.solartrack.com/runbooks/resend_api"

      - alert: ResendAPIUnavailable
        expr: up{job="resend-api"} == 0
        for: 2m
        labels:
          severity: critical
          service: email
          component: resend
        annotations:
          summary: "CRITICAL: Resend API unavailable"
          action: "Check Resend service status and API key validity"

      - alert: ResendRateLimitApproach
        expr: resend_api_rate_limit_remaining < 10
        for: 5m
        labels:
          severity: warning
          service: email
          component: resend
        annotations:
          summary: "Approaching Resend API rate limit"
          description: "Remaining requests: {{ $value }}"
          action: "Review email sending patterns or upgrade rate limit"

      # Database Alerts
      - alert: EmailTableQueryLatency
        expr: histogram_quantile(0.95, rate(database_query_duration_seconds_bucket{table="email_notifications"}[5m])) > 0.2
        for: 5m
        labels:
          severity: warning
          service: database
        annotations:
          summary: "Email table queries slow"
          description: "Query latency (P95): {{ $value }}s"
          action: "Review email_notifications table indexes and query plans"

      - alert: DatabaseConnectionPoolExhausted
        expr: pg_connections_total > 45
        for: 3m
        labels:
          severity: critical
          service: database
        annotations:
          summary: "CRITICAL: Database connection pool near exhaustion"
          description: "Active connections: {{ $value }}"
          action: "Kill idle connections or increase pool size"

      # Application Health Alerts
      - alert: ApplicationHighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.005
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Application error rate elevated"
          description: "Error rate: {{ $value | humanizePercentage }}"

      - alert: ApplicationDowntime
        expr: up{job="solartrack"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "CRITICAL: Application down"
          action: "Page on-call engineer immediately"

      # Infrastructure Alerts
      - alert: HighCPUUsage
        expr: (100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)) > 75
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"
          description: "CPU usage: {{ $value }}%"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 80
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage: {{ $value }}%"

      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100 < 15
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Low disk space"
          description: "Available space: {{ $value }}%"
          action: "Immediately investigate disk usage"
```

### 2.2 Prometheus Scrape Configuration

```yaml
# /etc/prometheus/prometheus.yml

global:
  scrape_interval: 30s
  evaluation_interval: 30s
  external_labels:
    environment: production
    service: solartrack

scrape_configs:
  # Application metrics
  - job_name: 'solartrack'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scheme: https

  # Email service metrics
  - job_name: 'email-service'
    static_configs:
      - targets: ['localhost:3001']
    metrics_path: '/metrics/email'
    scheme: https
    interval: 15s  # More frequent for email metrics

  # Database metrics
  - job_name: 'postgres'
    static_configs:
      - targets: ['localhost:9187']
    metrics_path: '/metrics'

  # Node exporter (system metrics)
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  # Resend API health (external)
  - job_name: 'resend-api'
    metrics_path: '/api/emails'
    static_configs:
      - targets: ['api.resend.com']
    scheme: https
    bearer_token: '{{ env "RESEND_API_KEY" }}'
    interval: 5m
```

---

## 3. ALERTMANAGER CONFIGURATION

### 3.1 Alertmanager Config

```yaml
# /etc/alertmanager/config.yml

global:
  resolve_timeout: 5m
  slack_api_url: '{{ env "SLACK_WEBHOOK_URL" }}'

templates:
  - '/etc/alertmanager/templates/*.tmpl'

route:
  # Default receiver
  receiver: 'email-team'
  
  # Group alerts
  group_by: ['alertname', 'service', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  
  # Sub-routes
  routes:
    # Critical alerts - immediate notification
    - match:
        severity: critical
      receiver: 'email-critical'
      group_wait: 0s
      group_interval: 2m
      repeat_interval: 1h
      continue: true

    # Email service alerts
    - match:
        service: email
      receiver: 'email-team'
      group_wait: 30s
      group_interval: 5m

    # Database alerts
    - match:
        service: database
      receiver: 'dba-team'
      group_wait: 1m
      group_interval: 10m

receivers:
  # Email team slack channel
  - name: 'email-team'
    slack_configs:
      - channel: '#alerts-email'
        title: 'Email Service Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}\n{{ end }}'
        send_resolved: true
        color: '{{ if eq .GroupLabels.severity "critical" }}danger{{ else }}warning{{ end }}'

  # Critical alerts - PagerDuty
  - name: 'email-critical'
    pagerduty_configs:
      - service_key: '{{ env "PAGERDUTY_SERVICE_KEY" }}'
        description: '{{ .GroupLabels.alertname }}'
        details:
          firing: '{{ template "pagerduty.default.instances" .Alerts.Firing }}'
    slack_configs:
      - channel: '#incident-email'
        title: 'CRITICAL: {{ .GroupLabels.alertname }}'
        text: '@channel CRITICAL ALERT\n{{ range .Alerts }}{{ .Annotations.summary }}\n{{ .Annotations.description }}\n{{ end }}'
        send_resolved: false
        color: 'danger'

  # DBA team
  - name: 'dba-team'
    slack_configs:
      - channel: '#alerts-database'
        title: 'Database Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}\n{{ end }}'
        send_resolved: true

inhibit_rules:
  # Inhibit warning if critical is firing
  - source_match:
      severity: critical
    target_match:
      severity: warning
    equal: ['service', 'alertname']
```

### 3.2 Notification Templates

```
# /etc/alertmanager/templates/email.tmpl

{{ define "email.html" }}
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .alert { margin: 20px 0; padding: 15px; border-left: 4px solid #f5576c; background: #fff5f5; }
    .alert.warning { border-color: #f5a623; background: #fffaf0; }
    .alert.resolved { border-color: #4caf50; background: #f1f8f5; }
    .header { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
    .detail { margin: 5px 0; }
  </style>
</head>
<body>
  <h2>{{ .GroupLabels.alertname }}</h2>
  <p>{{ .GroupLabels.severity | toUpper }} Alert from {{ .GroupLabels.service }}</p>

  {{ if .Alerts.Firing }}
  <h3>Firing Alerts ({{ len .Alerts.Firing }})</h3>
  {{ range .Alerts.Firing }}
  <div class="alert">
    <div class="header">{{ .Labels.alertname }}</div>
    <div class="detail"><strong>Summary:</strong> {{ .Annotations.summary }}</div>
    <div class="detail"><strong>Description:</strong> {{ .Annotations.description }}</div>
    <div class="detail"><strong>Action:</strong> {{ .Annotations.action }}</div>
    <div class="detail"><strong>Runbook:</strong> <a href="{{ .Annotations.runbook_url }}">View runbook</a></div>
    <div class="detail"><strong>Started:</strong> {{ .StartsAt }}</div>
  </div>
  {{ end }}
  {{ end }}

  {{ if .Alerts.Resolved }}
  <h3>Resolved Alerts ({{ len .Alerts.Resolved }})</h3>
  {{ range .Alerts.Resolved }}
  <div class="alert resolved">
    <div class="header">{{ .Labels.alertname }}</div>
    <div class="detail"><strong>Summary:</strong> {{ .Annotations.summary }}</div>
    <div class="detail"><strong>Resolved At:</strong> {{ .EndsAt }}</div>
  </div>
  {{ end }}
  {{ end }}

  <hr>
  <footer>
    <small>Sent at {{ now.Format "2006-01-02 15:04:05" }}</small>
  </footer>
</body>
</html>
{{ end }}
```

---

## 4. GRAFANA DASHBOARDS

### 4.1 Email Service Dashboard

```json
{
  "dashboard": {
    "title": "Email Service Monitoring",
    "tags": ["email", "production"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Email Send Success Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(email_sent_total[5m]) / (rate(email_sent_total[5m]) + rate(email_failed_total[5m]))"
          }
        ],
        "alert": {
          "conditions": [
            {
              "evaluator": { "params": [0.99], "type": "lt" },
              "operator": { "type": "and" },
              "query": { "params": ["A", "5m", "now"] },
              "type": "query"
            }
          ]
        }
      },
      {
        "id": 2,
        "title": "Email Send Latency (P95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(email_send_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "id": 3,
        "title": "Email Queue Size",
        "type": "gauge",
        "targets": [
          {
            "expr": "email_queue_pending"
          }
        ]
      },
      {
        "id": 4,
        "title": "Failed Emails Retry Queue",
        "type": "gauge",
        "targets": [
          {
            "expr": "email_queue_failed"
          }
        ]
      },
      {
        "id": 5,
        "title": "Resend API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(resend_api_duration_seconds_bucket[5m]))"
          }
        ]
      },
      {
        "id": 6,
        "title": "Email Table Query Latency",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(database_query_duration_seconds_bucket{table=\"email_notifications\"}[5m]))"
          }
        ]
      },
      {
        "id": 7,
        "title": "Emails Sent (Last 24h)",
        "type": "stat",
        "targets": [
          {
            "expr": "increase(email_sent_total[24h])"
          }
        ]
      },
      {
        "id": 8,
        "title": "Emails Failed (Last 24h)",
        "type": "stat",
        "targets": [
          {
            "expr": "increase(email_failed_total[24h])"
          }
        ]
      }
    ]
  }
}
```

---

## 5. LOGGING CONFIGURATION

### 5.1 Structured Logging

```javascript
// src/lib/logger.js

import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'solartrack-email' },
  transports: [
    // File transport for all logs
    new winston.transports.File({ 
      filename: '/var/log/solartrack/email.log',
      maxsize: 104857600, // 100MB
      maxFiles: 10
    }),
    // File transport for errors only
    new winston.transports.File({ 
      filename: '/var/log/solartrack/email-error.log',
      level: 'error',
      maxsize: 104857600,
      maxFiles: 20
    })
  ]
})

// Console in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}

export default logger
```

### 5.2 Email Service Logging

```javascript
// src/lib/emailService.js

export async function sendEmailViaResend(to, subject, htmlBody, emailType) {
  try {
    logger.info('Sending email', {
      to,
      emailType,
      timestamp: new Date().toISOString()
    })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html: htmlBody })
    })

    const data = await response.json()
    
    logger.info('Email sent successfully', {
      to,
      messageId: data.id,
      emailType,
      responseTime: response.headers['x-response-time']
    })

    return { success: true, messageId: data.id }
  } catch (error) {
    logger.error('Failed to send email', {
      to,
      emailType,
      error: error.message,
      stack: error.stack
    })
    
    return { success: false, error: error.message }
  }
}
```

### 5.3 Log Rotation with Logrotate

```
# /etc/logrotate.d/solartrack

/var/log/solartrack/*.log {
  daily
  rotate 30
  compress
  delaycompress
  missingok
  notifempty
  create 0640 app app
  sharedscripts
  postrotate
    systemctl reload solartrack > /dev/null 2>&1 || true
  endscript
}
```

---

## 6. UPTIME MONITORING

### 6.1 Uptime Robot Configuration

```
Service: SolarTrack Email API
URL: https://solartrack.com/api/health
Method: GET
Timeout: 30 seconds
Interval: 5 minutes
Expected: HTTP 200 with {"status": "ok"}
Alerts: Email, SMS, Slack
```

### 6.2 Health Check Endpoint

```javascript
// src/api/health.js

app.get('/api/health', async (req, res) => {
  try {
    // Check Supabase connection
    const { data, error: dbError } = await supabase.from('email_notifications').select('count', { count: 'exact', head: true })
    if (dbError) throw new Error('Database connection failed')

    // Check Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}` }
    })
    if (!resendResponse.ok) throw new Error('Resend API unavailable')

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok',
        resend: 'ok',
        application: 'ok'
      }
    })
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})
```

---

## 7. INCIDENT RESPONSE PLAYBOOK

### 7.1 Alert Response Levels

**P1 - Critical (Page immediately)**
- Email service completely down
- Success rate < 95%
- Database unavailable
- Resend API errors > 50%

**P2 - Warning (Address within 1 hour)**
- Email latency > 5s
- Queue backlog > 500
- Success rate < 99% but > 95%

**P3 - Info (Address within business hours)**
- Non-critical email failures
- Minor performance degradation
- Log file size issues

### 7.2 Debug Checklist

```bash
# 1. Check service status
systemctl status solartrack-email

# 2. Check recent logs
tail -50 /var/log/solartrack/email-error.log

# 3. Check Resend API
curl -H "Authorization: Bearer $RESEND_API_KEY" https://api.resend.com/emails | jq '.'

# 4. Check database
psql $DATABASE_URL -c "SELECT status, COUNT(*) FROM email_notifications GROUP BY status;"

# 5. Check queue
curl https://solartrack.com/api/email/queue | jq '.'

# 6. Monitor in real-time
tail -f /var/log/solartrack/email.log | grep -E "ERROR|WARN"
```

---

**Last Updated:** 2026-04-16
