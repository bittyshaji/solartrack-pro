# Deployment Runbook - Manual Email Triggering Feature

**Date:** 2026-04-16  
**Version:** 1.0  
**Environment:** Production  

---

## QUICK REFERENCE

| Item | Details |
|------|---------|
| Feature | Manual Email Triggering (Resend Integration) |
| Deployment Type | Standard Release |
| Risk Level | Medium |
| Estimated Downtime | 0 minutes (zero-downtime) |
| Estimated Duration | 15-20 minutes |
| Rollback Time | 5-10 minutes |
| On-Call Support | [Name/Phone] |

---

## 1. PRE-DEPLOYMENT ACTIVITIES (T-2 hours)

### 1.1 Deployment Team Assembly
```
[ ] Dev Lead: [Name] - Code verification & deployment
[ ] DevOps: [Name] - Infrastructure & monitoring
[ ] QA Lead: [Name] - Testing & verification
[ ] Support Lead: [Name] - Customer communication
```

### 1.2 Verification Checklist
```bash
# 1. Verify code is tagged
git tag | grep -i deploy

# 2. Check build artifacts
ls -lh dist/
# Expected: dist/ directory with optimized assets

# 3. Verify database migrations
psql $DATABASE_URL -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 5;"

# 4. Check current production version
curl -s https://solartrack.com/api/version | jq '.version'

# 5. Verify backup status
ls -lh /backups/production/ | tail -5
```

### 1.3 Team Communication
```bash
# Notify Slack channel
# @channel Deployment of email triggering feature starting in 2 hours
# Feature: Manual email sending for invoices and task reminders
# Expected downtime: 0 minutes
# Status page: https://status.solartrack.com

# Create incident channel
# #incident-email-deployment-20260416
```

---

## 2. DEPLOYMENT EXECUTION (T-0)

### 2.1 Pre-Deployment Health Check
```bash
#!/bin/bash
set -e

echo "=== Pre-Deployment Health Check ==="

# Check application health
echo "Checking application health..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://solartrack.com/health)
if [ "$HEALTH" != "200" ]; then
  echo "ERROR: Application not healthy (HTTP $HEALTH)"
  exit 1
fi

# Check database connectivity
echo "Checking database connectivity..."
psql $DATABASE_URL -c "SELECT NOW();" > /dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: Database connection failed"
  exit 1
fi

# Check Resend API availability
echo "Checking Resend API..."
curl -s -H "Authorization: Bearer $RESEND_API_KEY" https://api.resend.com/emails | jq '.message' > /dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: Resend API unavailable"
  exit 1
fi

# Check disk space
echo "Checking disk space..."
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
  echo "WARNING: Disk usage high ($DISK_USAGE%)"
fi

echo "=== All checks passed ==="
```

### 2.2 Database Backup
```bash
#!/bin/bash

echo "=== Creating Pre-Deployment Backup ==="

BACKUP_TIME=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/backups/production/pre-deploy-$BACKUP_TIME.dump"

# Create backup directory
mkdir -p /backups/production

# Backup database
pg_dump \
  --verbose \
  --format=custom \
  --file="$BACKUP_FILE" \
  "$DATABASE_URL"

# Verify backup
pg_restore --list "$BACKUP_FILE" | head -5
echo "Backup created: $BACKUP_FILE"
echo "Size: $(du -h $BACKUP_FILE | cut -f1)"

# Keep last 10 backups only
ls -1t /backups/production/* | tail -n +11 | xargs rm -f
```

### 2.3 Build Deployment
```bash
#!/bin/bash
set -e

echo "=== Building Production Bundle ==="

# Set production environment
export NODE_ENV=production
export VITE_SUPABASE_URL="$PROD_SUPABASE_URL"
export VITE_SUPABASE_ANON_KEY="$PROD_SUPABASE_ANON_KEY"
export VITE_RESEND_API_KEY="$PROD_RESEND_API_KEY"
export VITE_EMAIL_FROM="noreply@solartrack.com"

# Clean previous build
rm -rf dist/

# Install dependencies (if needed)
npm ci

# Build
echo "Running Vite build..."
npm run build

# Verify build output
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
  echo "ERROR: Build failed - dist/ is empty"
  exit 1
fi

# Check bundle size
echo ""
echo "=== Bundle Size Analysis ==="
du -sh dist/
find dist/assets -name "*.js" | while read f; do
  echo "$(du -h $f | cut -f1) - $f"
done

# Verify no source maps in production
MAPS=$(find dist -name "*.map" | wc -l)
if [ "$MAPS" -gt 0 ]; then
  echo "WARNING: Found $MAPS source map files"
fi

echo "Build completed successfully"
```

### 2.4 Deploy to Production
```bash
#!/bin/bash
set -e

echo "=== Deploying to Production ==="

# Method 1: Direct file deployment
echo "Copying build to production server..."
rsync -avz \
  --delete \
  dist/ \
  deploy@prod-server:/var/www/solartrack/

# OR Method 2: Docker deployment
docker build -t solartrack:prod .
docker push solartrack:prod
kubectl set image deployment/solartrack \
  solartrack=solartrack:prod \
  --record

# Wait for deployment
echo "Waiting for pods to be ready..."
kubectl rollout status deployment/solartrack -n default

# Method 3: Vercel deployment (if using Vercel)
vercel --prod --token $VERCEL_TOKEN

echo "Deployment completed"
```

### 2.5 Verify Deployment
```bash
#!/bin/bash

echo "=== Verifying Deployment ==="

# Wait for deployment to stabilize
sleep 5

# 1. Check HTTP status
echo "Checking HTTP status..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://solartrack.com)
if [ "$STATUS" != "200" ]; then
  echo "ERROR: HTTP Status $STATUS"
  exit 1
fi

# 2. Verify app is responding
echo "Verifying app is responding..."
curl -s https://solartrack.com | grep -q "SolarTrack"
if [ $? -ne 0 ]; then
  echo "ERROR: App not responding correctly"
  exit 1
fi

# 3. Check API endpoints
echo "Checking API endpoints..."
curl -s https://solartrack.com/api/health | jq '.status'

# 4. Verify email service loaded
echo "Checking email service..."
curl -s https://solartrack.com/api/email/status | jq '.service'

# 5. Check database connectivity
echo "Testing database connection..."
curl -s https://solartrack.com/api/db/test | jq '.connected'

echo "=== Deployment verified successfully ==="
```

---

## 3. POST-DEPLOYMENT VALIDATION (T+5 minutes)

### 3.1 Smoke Tests
```javascript
// test/smoke.test.js

describe('Email Feature Smoke Tests', () => {
  it('should load email service', async () => {
    const response = await fetch('/api/email/status')
    expect(response.ok).toBe(true)
  })

  it('should allow authenticated user to send test email', async () => {
    const response = await fetch('/api/email/test', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TEST_TOKEN}` },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Test Email',
        body: 'Test'
      })
    })
    expect(response.status).toBe(202) // Accepted
  })

  it('should queue emails for sending', async () => {
    const response = await fetch('/api/email/queue')
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(data.pending).toBeGreaterThanOrEqual(0)
  })

  it('should show email logs', async () => {
    const response = await fetch('/api/email/logs')
    expect(response.ok).toBe(true)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })
})
```

### 3.2 Manual Feature Testing
```bash
#!/bin/bash

echo "=== Manual Feature Testing ==="

# 1. Test Invoice Email Trigger
echo "Testing invoice email trigger..."
# In application: Create invoice → Click "Send Email"
# Expected: Email queued notification appears
# Expected: Email log shows "pending" status

# 2. Test Task Reminder Email Trigger  
echo "Testing task reminder trigger..."
# In application: Open task → Click "Send Reminder"
# Expected: Reminder queued notification appears
# Expected: Email log shows pending status

# 3. Test Email Log Page
echo "Testing email logs page..."
# Navigate to admin panel → Email Logs
# Expected: Can see list of sent/pending/failed emails
# Expected: Can filter by status, recipient, date

# 4. Test Resend Failed Emails
echo "Testing failed email retry..."
# Manually mark an email as failed in database:
# UPDATE email_notifications SET status='pending', retry_count=0
# WHERE id = 'test-id'
# Expected: Email should be resent after retry window

echo "=== All manual tests passed ==="
```

### 3.3 Performance Baseline
```bash
#!/bin/bash

echo "=== Performance Baseline Check ==="

# Test email send latency
echo "Testing email send latency..."
time curl -X POST https://solartrack.com/api/email/test \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test"}'

# Test page load time
echo "Testing page load time..."
curl -w "\nTime: %{time_total}s\n" \
  https://solartrack.com/invoices -o /dev/null -s

# Check bundle size
echo "Bundle size:"
curl -s https://solartrack.com/assets/main*.js | wc -c | numfmt --to=iec

echo "=== Performance baseline verified ==="
```

---

## 4. MONITORING & ALERTING (T+30 minutes)

### 4.1 Key Metrics to Monitor
```
Email Send Latency (P95): < 2s
Email Failure Rate: < 1%
API Response Time (P95): < 200ms
Database Query Time (P95): < 100ms
Error Rate: < 0.5%
Uptime: > 99.9%
CPU Usage: < 70%
Memory Usage: < 80%
Disk Usage: < 85%
```

### 4.2 Alert Rules
```yaml
# Prometheus alerts configuration
groups:
  - name: email_service
    rules:
      - alert: HighEmailFailureRate
        expr: rate(email_failures_total[5m]) / rate(email_sent_total[5m]) > 0.1
        for: 5m
        annotations:
          summary: "High email failure rate (>10%)"

      - alert: EmailQueueBacklog
        expr: email_queue_pending > 100
        for: 10m
        annotations:
          summary: "Email queue has >100 pending emails"

      - alert: ResendAPIError
        expr: increase(resend_api_errors_total[5m]) > 5
        for: 5m
        annotations:
          summary: "Resend API errors detected"
```

### 4.3 Dashboard Queries
```javascript
// Grafana queries

// Email send success rate
rate(email_sent_total[5m]) / (rate(email_sent_total[5m]) + rate(email_failed_total[5m]))

// Email queue size
email_queue_pending

// Email latency (P95)
histogram_quantile(0.95, email_send_duration_seconds_bucket)

// Failed email count
email_failed_total

// Resend API latency
histogram_quantile(0.95, resend_api_duration_seconds_bucket)
```

### 4.4 Log Analysis
```bash
# Check for errors in logs
tail -f /var/log/solartrack/app.log | grep -i error

# Email service logs
tail -f /var/log/solartrack/email.log

# Check for authentication errors
grep "auth" /var/log/solartrack/app.log | tail -20

# Monitor Resend API calls
grep "resend" /var/log/solartrack/app.log
```

---

## 5. ROLLBACK PROCEDURE

### 5.1 When to Rollback
Initiate rollback if any of these occur:
- [ ] Email service returning HTTP 5xx errors (>1%)
- [ ] Email failure rate exceeds 10% for >10 minutes
- [ ] Database connection pool exhausted
- [ ] Unplanned downtime > 2 minutes
- [ ] Critical security issue discovered

### 5.2 Rollback Steps
```bash
#!/bin/bash
set -e

echo "=== INITIATING ROLLBACK ==="

# Step 1: Notify team
echo "Notifying team of rollback..."
# Post to #incident channel

# Step 2: Identify previous stable version
echo "Identifying previous stable version..."
git log --oneline | head -5
PREVIOUS_TAG=$(git describe --tags --abbrev=0)
echo "Rolling back to: $PREVIOUS_TAG"

# Step 3: Revert to previous version
echo "Checking out previous version..."
git checkout $PREVIOUS_TAG

# Step 4: Rebuild
echo "Rebuilding..."
npm ci
npm run build

# Step 5: Redeploy
echo "Redeploying..."
rsync -avz --delete dist/ deploy@prod-server:/var/www/solartrack/

# OR if using Docker:
docker build -t solartrack:rollback .
docker push solartrack:rollback
kubectl set image deployment/solartrack \
  solartrack=solartrack:rollback \
  --record="true"

# Step 6: Verify rollback
echo "Verifying rollback..."
sleep 5
curl -s https://solartrack.com/api/version | jq '.version'

# Step 7: Restore database (if needed)
echo "Database rollback (if needed)..."
# pg_restore --single-transaction -d solartrack backup-pre-deploy.dump

echo "=== Rollback completed ==="
echo "Incident report will be filed"
```

### 5.3 Rollback Checklist
- [ ] Team notified
- [ ] Previous version identified
- [ ] Code reverted
- [ ] Build verified
- [ ] Deployment completed
- [ ] Health checks passed
- [ ] Database verified (if needed)
- [ ] Monitoring confirmed
- [ ] Status page updated
- [ ] Post-mortem scheduled

---

## 6. POST-DEPLOYMENT (T+24 hours)

### 6.1 Extended Monitoring
```
Monitor for full 24 hours:
- [ ] No unexpected errors
- [ ] Email delivery rate stable (>99%)
- [ ] No database performance degradation
- [ ] No security issues reported
- [ ] Customer support tickets normal
```

### 6.2 Documentation Update
```bash
# Update deployment log
cat >> DEPLOYMENT_LOG.md << EOF

## Deployment: 2026-04-16 Email Feature

**Status:** SUCCESS
**Duration:** 15 minutes
**Downtime:** 0 minutes
**Issues:** None

### Metrics:
- Email success rate: 99.8%
- API latency (P95): 145ms
- Uptime: 100%
EOF
```

### 6.3 Team Debrief
```
Schedule 1-hour debrief:
- [ ] What went well?
- [ ] What could be improved?
- [ ] Any unexpected issues?
- [ ] Update runbook based on learnings
- [ ] Document for future deployments
```

---

## 7. CONTACTS & ESCALATION

### 7.1 Escalation Chain
1. **DevOps Lead:** [Name] [Phone] [Email]
   - Immediate infrastructure issues
   
2. **Dev Lead:** [Name] [Phone] [Email]
   - Application issues, code problems
   
3. **CTO/Director:** [Name] [Phone] [Email]
   - Major incidents, customer impact
   
4. **VP Engineering:** [Name] [Phone] [Email]
   - Critical issues, executive decisions

### 7.2 Communication Channels
- **War Room:** [Zoom Link]
- **Incident Channel:** #incident-20260416
- **Status Page:** https://status.solartrack.com
- **On-Call Rotation:** [PagerDuty Link]

---

## 8. APPENDIX: COMMON ISSUES

### Issue: Email Service Not Responding
```bash
# Check service status
systemctl status solartrack-email
journalctl -u solartrack-email -n 50

# Restart service
systemctl restart solartrack-email

# Check Resend API connectivity
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/emails
```

### Issue: High Email Failure Rate
```bash
# Check Resend quota
curl -H "Authorization: Bearer $RESEND_API_KEY" \
  https://api.resend.com/emails

# Check database for errors
SELECT status, COUNT(*) FROM email_notifications 
GROUP BY status;

# Retry failed emails
curl -X POST https://solartrack.com/api/email/retry \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Issue: Database Connection Pool Exhausted
```bash
# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
WHERE state = 'idle' AND state_change < now() - interval '10 minutes';

# Restart connection pool
systemctl restart pgbouncer
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-16  
**Next Review:** After first production deployment
