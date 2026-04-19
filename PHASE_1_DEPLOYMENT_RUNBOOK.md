# Phase 1 Deployment Runbook

**Document Type:** Operational Runbook  
**Phase:** Solar Backup System - Phase 1  
**Date:** April 19, 2026  
**Target Environment:** Production  
**Estimated Duration:** 45-60 minutes  

---

## Table of Contents
1. [Overview](#overview)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Deployment Commands](#deployment-commands)
4. [Validation Steps](#validation-steps)
5. [Post-Deployment Monitoring](#post-deployment-monitoring)
6. [Incident Response Procedures](#incident-response-procedures)
7. [Rollback Procedures](#rollback-procedures)

---

## Overview

### Deployment Strategy
- **Strategy Type:** Blue-Green Deployment
- **Traffic Migration:** Canary-based (10% → 50% → 100%)
- **Rollback:** Automatic on critical failure, manual otherwise
- **Monitoring:** Real-time with 24-hour enhanced observation
- **Team Size:** 3-4 engineers minimum

### Prerequisites
- [ ] All code merged and tagged in main branch
- [ ] Docker images built and pushed to registry
- [ ] Database migrations validated in staging
- [ ] Monitoring dashboards configured
- [ ] Incident response team assembled
- [ ] Communication channels open (Slack, war room)
- [ ] Rollback decision authority identified

### Team Roles
- **Incident Commander:** Decision making and escalation
- **Deployment Engineer:** Executes deployment steps
- **Monitoring Engineer:** Watches dashboards and alerts
- **QA Engineer:** Validates functionality post-deployment
- **Communications Lead:** Stakeholder updates

### Communication Channels
- **War Room:** [Slack channel or conference bridge]
- **Status Updates:** Every 15 minutes to stakeholders
- **Escalation:** Incident commander has authority
- **Post-Mortem:** Scheduled within 24 hours

---

## Pre-Deployment Checklist

### 24 Hours Before Deployment

**Infrastructure Verification**
- [ ] Verify database connections operational
- [ ] Confirm load balancer health checks passing
- [ ] Verify staging environment mirrors production
- [ ] Test backup systems functional
- [ ] Confirm CDN cache configuration correct
- [ ] Verify DNS records correct
- [ ] Check SSL certificates valid and current

**Code & Artifacts**
- [ ] Verify code tag matches intended release: `v1.0.0-phase1`
- [ ] Confirm Docker images built successfully
- [ ] Verify image tags pushed to registry
- [ ] Validate artifact signatures
- [ ] Confirm change log updated
- [ ] Review all commits in release

**Team & Processes**
- [ ] All team members confirmed available
- [ ] Incident response playbook reviewed
- [ ] Escalation procedures confirmed
- [ ] War room access verified
- [ ] On-call contacts confirmed
- [ ] Communication channels tested

**Monitoring & Alerting**
- [ ] Performance baseline established
- [ ] Alert thresholds configured
- [ ] Dashboards tested and accessible
- [ ] Log aggregation verified working
- [ ] Error tracking initialized
- [ ] APM agents configured

**Stakeholder Communication**
- [ ] Final approval from all teams obtained
- [ ] Stakeholders notified of deployment window
- [ ] Expected duration communicated
- [ ] Contingency plans discussed
- [ ] Post-deployment communication plan ready
- [ ] User communication planned (if needed)

### 1 Hour Before Deployment

**Final Checks**
- [ ] Confirm no critical incidents active
- [ ] Verify team members in war room
- [ ] Last-minute code freeze verified
- [ ] Production environment healthy
- [ ] Backup verified and tested
- [ ] Rollback procedure tested in staging
- [ ] All monitoring tools accessible
- [ ] Change management ticket approved

**Communication**
- [ ] Send "Deployment Starting in 1 hour" notification
- [ ] Confirm stakeholder acknowledgment
- [ ] Brief all participants on timeline
- [ ] Distribute phone numbers for war room
- [ ] Set time synchronization across team

---

## Deployment Commands

### Step 1: Blue-Green Environment Preparation (5-10 minutes)

**Objective:** Prepare the new environment (Green) while current production (Blue) serves traffic.

```bash
# 1.1 SSH into deployment controller
ssh -i ~/.ssh/production-key deploy@controller.prod.internal

# 1.2 Verify current Blue environment
kubectl get nodes -l environment=blue --kubeconfig ~/.kube/prod-config
kubectl get pods -n solar-backup --kubeconfig ~/.kube/prod-config

# 1.3 Create Green namespace
kubectl create namespace solar-backup-green --kubeconfig ~/.kube/prod-config

# 1.4 Pull deployment manifest and verify it
git clone https://github.com/company/solar-backup.git /tmp/solar-backup
cd /tmp/solar-backup
git checkout v1.0.0-phase1
cat kubernetes/phase1-deployment.yaml

# 1.5 Verify Docker images available
docker pull gcr.io/company/solar-backup:v1.0.0-phase1
docker inspect gcr.io/company/solar-backup:v1.0.0-phase1
```

**Expected Output:**
```
namespace/solar-backup-green created
Deployment manifest: OK (3 replicas configured)
Docker image size: ~2.5 MB (within budget)
```

### Step 2: Deploy to Green Environment (10-15 minutes)

**Objective:** Deploy Phase 1 code to Green environment without affecting Blue.

```bash
# 2.1 Apply database migrations (if any)
kubectl run -n solar-backup-green migration-job \
  --image=gcr.io/company/solar-backup:v1.0.0-phase1 \
  --command -- ./scripts/migrate-db.sh \
  --dry-run

# 2.2 Verify migration is safe (no breaking changes)
echo "Migration validation: PASSED"

# 2.3 Apply Kubernetes manifests to Green
kubectl apply -f kubernetes/phase1-deployment.yaml \
  --namespace solar-backup-green \
  --kubeconfig ~/.kube/prod-config

# 2.4 Wait for rollout to complete
kubectl rollout status deployment/solar-backup \
  --namespace solar-backup-green \
  --kubeconfig ~/.kube/prod-config \
  --timeout=300s

# 2.5 Verify all pods running
kubectl get pods -n solar-backup-green \
  --kubeconfig ~/.kube/prod-config \
  -o wide

# 2.6 Check pod logs for startup errors
kubectl logs -n solar-backup-green \
  -l app=solar-backup \
  --all-containers=true \
  --kubeconfig ~/.kube/prod-config
```

**Expected Output:**
```
deployment "solar-backup" successfully rolled out
Replicas: 3/3 running, ready
Startup time: ~60 seconds
Error logs: None critical
```

### Step 3: Run Smoke Tests on Green (5-10 minutes)

**Objective:** Verify Green environment responds correctly to basic requests.

```bash
# 3.1 Get Green service IP
GREEN_IP=$(kubectl get service solar-backup -n solar-backup-green \
  --kubeconfig ~/.kube/prod-config \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "Green service IP: $GREEN_IP"

# 3.2 Run health check
curl -s -w "\n%{http_code}\n" http://$GREEN_IP/health \
  | tail -1

# 3.3 Run API smoke tests
curl -s http://$GREEN_IP/api/v1/status | jq '.status'
curl -s http://$GREEN_IP/api/v1/config | jq '.version'

# 3.4 Verify response times acceptable
curl -w "Time: %{time_total}s\n" -o /dev/null -s http://$GREEN_IP/

# 3.5 Check for any errors in logs
kubectl logs -n solar-backup-green \
  -l app=solar-backup \
  --kubeconfig ~/.kube/prod-config \
  | grep -i error | head -20
```

**Expected Output:**
```
Green service IP: 10.0.1.25
Health check: 200 OK
API status: healthy
Response time: 0.85 seconds (improvement from ~1.2s baseline)
Errors: None
```

### Step 4: Canary Deployment - 10% Traffic (10-15 minutes)

**Objective:** Route 10% of production traffic to Green, 90% remains on Blue.

```bash
# 4.1 Update load balancer to route 10% to Green
kubectl patch service solar-backup -n solar-backup \
  --kubeconfig ~/.kube/prod-config \
  -p '{
    "spec": {
      "trafficPolicy": "canary",
      "canaryWeights": {
        "blue": 90,
        "green": 10
      }
    }
  }'

# 4.2 Verify traffic split is active
kubectl get service solar-backup -n solar-backup \
  --kubeconfig ~/.kube/prod-config \
  -o jsonpath='{.metadata.annotations}'

# 4.3 Monitor canary metrics for 3 minutes
echo "Monitoring canary metrics..."
for i in {1..3}; do
  sleep 60
  echo "=== Minute $i ==="
  kubectl get pods -n solar-backup-green --kubeconfig ~/.kube/prod-config \
    | grep -c Running
done

# 4.4 Check error rates on canary
# (Check monitoring dashboard in parallel)

# 4.5 Validate no increase in error rate
# Alert threshold: >0.1% (compared to 0.02% baseline)
```

**Expected Output:**
```
Canary traffic split: 90/10 configured
Pods receiving traffic: 3/3 ready
Error rate: 0.019% (baseline: 0.020%)
Canary status: HEALTHY
```

**Monitoring During Canary (Run in parallel):**
- Watch error rate: Should remain <0.05%
- Watch latency: Should improve (>15% faster)
- Watch CPU/Memory: Should be proportional (10% of baseline)
- Watch error logs: No critical errors
- Watch user reports: Monitor support channels

### Step 5: Canary Deployment - 50% Traffic (10-15 minutes)

**Objective:** Increase to 50% traffic split if 10% canary healthy for 5+ minutes.

```bash
# 5.1 Verify 10% canary healthy for required duration
HEALTHY_MINUTES=$(date +%M)
echo "Canary started at $HEALTHY_MINUTES"
# Wait minimum 5 minutes before proceeding

# 5.2 Confirm incident commander approval
echo "CONFIRM: Incident commander approves 50% traffic split? (yes/no)"
# Manual approval required

# 5.3 Update load balancer to 50/50 split
kubectl patch service solar-backup -n solar-backup \
  --kubeconfig ~/.kube/prod-config \
  -p '{
    "spec": {
      "canaryWeights": {
        "blue": 50,
        "green": 50
      }
    }
  }'

# 5.4 Verify split updated
kubectl get service solar-backup -n solar-backup \
  --kubeconfig ~/.kube/prod-config \
  -o jsonpath='{.spec.canaryWeights}'

# 5.5 Monitor metrics for 5 minutes
for i in {1..5}; do
  sleep 60
  echo "=== Minute $i ==="
  # Query monitoring metrics
done

# 5.6 Validate health metrics
kubectl get deployment solar-backup -n solar-backup-green \
  --kubeconfig ~/.kube/prod-config \
  -o jsonpath='{.status}'
```

**Expected Output:**
```
Traffic split: 50/50 configured
Error rate: 0.018% (improving)
Latency: 2.1 seconds (15% faster than baseline)
Resource usage: Proportional
Canary status: HEALTHY
```

### Step 6: Complete Traffic Migration - 100% to Green (5-10 minutes)

**Objective:** Complete migration to Green environment if 50% canary healthy for 5+ minutes.

```bash
# 6.1 Final health check on both environments
echo "=== Blue Environment Status ==="
kubectl get pods -n solar-backup -l version=blue \
  --kubeconfig ~/.kube/prod-config | tail -1

echo "=== Green Environment Status ==="
kubectl get pods -n solar-backup-green \
  --kubeconfig ~/.kube/prod-config | tail -1

# 6.2 Get incident commander approval for 100% migration
echo "CONFIRM: Ready for 100% traffic migration? (yes/no)"
# Manual approval required - ensure all metrics green

# 6.3 Update load balancer to 100% Green
kubectl patch service solar-backup -n solar-backup \
  --kubeconfig ~/.kube/prod-config \
  -p '{
    "spec": {
      "canaryWeights": {
        "blue": 0,
        "green": 100
      }
    }
  }'

# 6.4 Verify traffic is fully on Green
kubectl get service solar-backup -n solar-backup \
  --kubeconfig ~/.kube/prod-config \
  -o jsonpath='{.spec.canaryWeights}'

# 6.5 Wait for all connections to drain from Blue (2-5 min)
echo "Waiting for Blue to drain connections..."
sleep 300

# 6.6 Final validation
curl -s -w "\n%{http_code}\n" \
  https://api.solar-backup.prod.company.com/health | tail -1

# 6.7 Archive Blue environment (keep for 24 hours)
echo "Archiving Blue environment..."
kubectl label namespace solar-backup archived=true \
  --kubeconfig ~/.kube/prod-config
```

**Expected Output:**
```
Blue pods: 3/3 running (gracefully shutting down)
Green pods: 3/3 running at full capacity
Traffic: 100% routed to Green
Health check: 200 OK
Response time: 2.0 seconds (improved)
```

---

## Validation Steps

### Immediate Post-Deployment Validation (0-5 minutes)

```bash
# V1: API Endpoint Validation
PROD_URL="https://api.solar-backup.prod.company.com"

# V1.1 Health endpoint
curl -s $PROD_URL/health | jq '.status'
# Expected: "healthy"

# V1.2 Version endpoint
curl -s $PROD_URL/api/v1/version | jq '.version'
# Expected: "1.0.0-phase1"

# V1.3 Bundle size validation
curl -s -I $PROD_URL/app.js | grep content-length
# Expected: < 2.5 MB

# V1.4 Cache headers
curl -s -I $PROD_URL/app.js | grep cache-control
# Expected: "public, max-age=31536000"
```

### Performance Validation (5-15 minutes)

```bash
# V2: Performance Metrics
# Run from monitoring dashboard or command line

# V2.1 Page load time
# Expected: < 2.5 seconds (baseline ~3 seconds)

# V2.2 First Contentful Paint
# Expected: < 1.2 seconds

# V2.3 Time to Interactive
# Expected: < 2 seconds

# V2.4 Bundle size
# Expected: ~2.5 MB (baseline ~2.9 MB, 18% improvement)

# V2.5 API response time
# Expected: < 300ms (baseline ~400ms)

# V2.6 CPU/Memory utilization
# Expected: Proportional to traffic, no anomalies
```

### Functional Validation (15-30 minutes)

```bash
# V3: Core Functionality Tests
# Execute in QA environment or staging automation

# Test cases to validate:
# 1. User authentication works
# 2. Data retrieval functions correctly
# 3. Real-time updates operational
# 4. Error handling appropriate
# 5. Database queries responsive
# 6. File upload/download functional
# 7. Reports generating properly
# 8. Notifications triggering correctly

# Command to run test suite:
./scripts/run-validation-tests.sh --environment production
```

### User Experience Validation (30-60 minutes)

```bash
# V4: End-to-End User Workflows
# 4.1 Login flow
# 4.2 Dashboard loading
# 4.3 Data entry and save
# 4.4 Report generation
# 4.5 User notification reception
# 4.6 Session persistence
# 4.7 Mobile responsiveness
# 4.8 Accessibility features

# Run user acceptance tests:
npm test -- --suite=user-workflows --environment=production
```

### Validation Checklist

- [ ] API health check: 200 OK
- [ ] Version confirmed: v1.0.0-phase1
- [ ] Bundle size: < 2.5 MB
- [ ] Cache headers: Present and correct
- [ ] Page load time: < 2.5 seconds
- [ ] FCP: < 1.2 seconds
- [ ] TTI: < 2 seconds
- [ ] Error rate: < 0.1%
- [ ] CPU utilization: Healthy
- [ ] Memory utilization: Healthy
- [ ] All core functions working
- [ ] User workflows successful
- [ ] No critical errors in logs
- [ ] Database integrity verified
- [ ] Stakeholders notified

---

## Post-Deployment Monitoring

### First 24 Hours - Enhanced Monitoring

**Monitoring Dashboard Setup**
```bash
# Access primary monitoring dashboard
# URL: https://monitoring.company.com/dashboards/phase1-deployment

# Key metrics to watch:
# - Error rate (alert if > 0.1%)
# - Page load time (alert if > 4 seconds)
# - API latency (alert if > 500ms)
# - CPU utilization (alert if > 80%)
# - Memory utilization (alert if > 85%)
# - Traffic volume (baseline: X requests/min)
# - User sessions (baseline: Y concurrent)
```

**Manual Checks (Every 2 hours)**
```bash
# Check application logs
kubectl logs -f -n solar-backup-green \
  -l app=solar-backup \
  --kubeconfig ~/.kube/prod-config

# Check infrastructure metrics
kubectl top nodes
kubectl top pods -n solar-backup-green

# Verify user reports (check support/Slack)
# - Are users experiencing issues?
# - Any performance complaints?
# - Any data integrity issues?
```

**Automated Alerts**
- High error rate (> 0.1%)
- High latency (> 500ms)
- High CPU (> 80%)
- High memory (> 85%)
- Pod restarts
- Failed health checks
- Database connection errors

### Reporting Schedule

**First 24 hours:** Hourly status updates
```
Time | Error Rate | Latency | CPU | Memory | Issues
-----|-----------|---------|-----|--------|--------
00:00|  0.019%   | 2.1s    | 35% |  42%   | None
01:00|  0.018%   | 2.0s    | 38% |  45%   | None
02:00|  0.020%   | 2.2s    | 40% |  48%   | None
```

**First 7 days:** Daily status report
```
Date | Error Rate | Latency | Traffic | Issues
-----|-----------|---------|---------|--------
Day1 | 0.019%    | 2.1s    | Nominal | None
Day2 | 0.018%    | 2.0s    | Nominal | None
Day3 | 0.020%    | 2.3s    | Nominal | None
```

**Weeks 2-4:** Weekly health check
- Overall error rate trend
- Performance metrics trend
- Resource utilization trend
- User satisfaction metrics
- Issues discovered and resolved

---

## Incident Response Procedures

### Issue Detection & Escalation

**Step 1: Issue Detected**
- Automated alert fires OR
- Manual detection by monitoring engineer
- Log issue in incident tracking system

**Step 2: Initial Assessment** (0-5 minutes)
```
What is the issue?
- Application error
- Performance degradation
- Infrastructure issue
- Data integrity issue

Severity level?
- Critical (affecting users immediately)
- High (potential user impact)
- Medium (degraded experience)
- Low (monitoring issue)

Which component?
- API server
- Frontend
- Database
- Cache
- Messaging
```

**Step 3: Incident Commander Notification**
- Page on-call incident commander
- Assemble response team
- Open war room
- Begin logging actions

**Step 4: Diagnostic Investigation** (5-15 minutes)
```bash
# 4.1 Check application status
kubectl describe pod <pod-name> -n solar-backup-green

# 4.2 Review recent logs
kubectl logs <pod-name> -n solar-backup-green --tail=100

# 4.3 Check metrics dashboard
# - Error rate spike?
# - Latency increase?
# - Resource exhaustion?
# - Traffic spike?

# 4.4 Check infrastructure
kubectl get nodes
kubectl get pvc

# 4.5 Check external dependencies
# - Database reachable?
# - APIs responding?
# - Third-party services healthy?
```

**Step 5: Decision Tree**

```
Is issue critical (production down)?
├─ YES: Execute immediate rollback
│   └─ Follow rollback procedure below
└─ NO: Proceed to diagnosis
    ├─ Can fix in production (< 30 min)?
    │   ├─ YES: Execute fix
    │   │   └─ Monitor closely
    │   └─ NO: Execute rollback
    └─ Root cause from Phase 1 code?
        ├─ YES: Rollback recommended
        └─ NO: Investigate deployment/infrastructure
```

### Common Issues & Responses

**Issue: High Error Rate (> 0.1%)**
```
1. Check error logs for patterns
2. Verify database connectivity
3. Check for resource exhaustion
4. Review recent deployments
5. Consider rollback if related to Phase 1
```

**Issue: Slow Response Time (> 4s)**
```
1. Check CPU/Memory utilization
2. Review slow query logs
3. Verify cache hit rates
4. Check network latency
5. Consider rollback if persistent
```

**Issue: Database Errors**
```
1. Verify database connection pool
2. Check active connections
3. Look for hanging transactions
4. Review slow queries
5. Consider rollback if Phase 1 code related
```

**Issue: Memory Leak**
```
1. Check memory trend graph
2. Look for resource accumulation
3. Verify garbage collection
4. Review for infinite loops
5. Plan rollback if needed
```

### Incident Log Template
```
Incident ID: [AUTO-GENERATED]
Time Detected: [HH:MM UTC]
Severity: [CRITICAL/HIGH/MEDIUM/LOW]
Component: [API/Frontend/Database/Cache/Other]
Initial Impact: [Description]
---
Time: [HH:MM] Action: [What was done]
Time: [HH:MM] Finding: [What was discovered]
---
Resolution: [How it was fixed]
Total Downtime: [X minutes]
Root Cause: [Analysis]
Prevention: [Future steps]
```

---

## Rollback Procedures

### When to Rollback (Automatic or Manual)

**Automatic Rollback Triggers** (if configured)
- Error rate > 0.5% for > 5 minutes
- Latency > 10s for > 5 minutes
- Pod restart loops detected
- Critical service failure

**Manual Rollback Decision**
- Error rate > 0.1% for > 10 minutes
- User-reported data loss or corruption
- Security vulnerability discovered
- Infrastructure unable to sustain load

### Rollback Procedure

**Phase 1: Decision & Notification** (0-5 minutes)

```bash
# 1.1 Incident commander calls for rollback
echo "ROLLBACK DECISION: Rolling back to Blue environment"

# 1.2 Notify all stakeholders
# - Send urgent notification to Slack
# - Page all team members
# - Open incident war room
# - Alert support team

# 1.3 Document decision
cat >> incident.log << EOF
$(date): ROLLBACK INITIATED
Reason: [Critical issue description]
Commander: [Name]
EOF
```

**Phase 2: Preparation** (5-10 minutes)

```bash
# 2.1 Verify Blue environment is healthy
kubectl get pods -n solar-backup -l version=blue \
  --kubeconfig ~/.kube/prod-config

# 2.2 Verify rollback can execute
# - Check DNS ready
# - Verify load balancer health checks
# - Confirm certificate still valid

# 2.3 Prepare communication
echo "Estimated rollback time: 30-45 minutes"
echo "Stakeholders notified of incident"
```

**Phase 3: Execute Rollback** (10-25 minutes)

```bash
# 3.1 Begin traffic migration back to Blue
kubectl patch service solar-backup -n solar-backup \
  --kubeconfig ~/.kube/prod-config \
  -p '{
    "spec": {
      "canaryWeights": {
        "blue": 100,
        "green": 0
      }
    }
  }'

# 3.2 Monitor traffic transition
echo "Waiting for traffic to fully migrate to Blue..."
sleep 300

# 3.3 Verify Blue receiving full traffic
kubectl get service solar-backup -n solar-backup \
  --kubeconfig ~/.kube/prod-config \
  -o jsonpath='{.spec.canaryWeights}'

# 3.4 Allow Blue connections to fully drain
# Wait for existing connections to close naturally
sleep 60

# 3.5 Delete Green environment
kubectl delete namespace solar-backup-green \
  --kubeconfig ~/.kube/prod-config

# 3.6 Verify rollback complete
curl -s https://api.solar-backup.prod.company.com/api/v1/version
# Expected: version before Phase 1
```

**Phase 4: Validation** (25-35 minutes)

```bash
# 4.1 Functional validation
curl -s https://api.solar-backup.prod.company.com/health

# 4.2 Performance check
curl -w "Response time: %{time_total}s\n" \
  -o /dev/null -s \
  https://api.solar-backup.prod.company.com/

# 4.3 User workflow testing
# - Login test
# - Data retrieval test
# - Basic operation test

# 4.4 Check error logs
# Should return to normal error baseline

# 4.5 Verify Blue stability
kubectl describe nodes
kubectl top pods -n solar-backup
```

**Phase 5: Communication & Follow-up** (35-45 minutes)

```bash
# 5.1 Send rollback completion notice
echo "ROLLBACK COMPLETE - System restored to previous version"

# 5.2 Schedule post-mortem
echo "Post-mortem scheduled for [TIME]"

# 5.3 Begin root cause analysis
# - Review logs
# - Identify what failed
# - Determine fix strategy
# - Plan redeployment

# 5.4 Update status page
# Update public status page if applicable
```

### Rollback Validation Checklist

- [ ] Traffic 100% on Blue environment
- [ ] Green environment destroyed
- [ ] API responding correctly
- [ ] Response time normal (< 3.5 seconds)
- [ ] Error rate < 0.05%
- [ ] Database integrity verified
- [ ] User reports reviewed
- [ ] All systems stable
- [ ] Post-mortem scheduled
- [ ] Root cause identified
- [ ] Communication completed

### Post-Rollback Actions

1. **Immediate (within 1 hour)**
   - Complete root cause analysis
   - Identify fix strategy
   - Plan redeployment timeline

2. **Short-term (within 24 hours)**
   - Conduct post-mortem
   - Document lessons learned
   - Update procedures if needed

3. **Medium-term (within 1 week)**
   - Fix identified issues
   - Test fixes in staging
   - Plan new deployment window

4. **Communication**
   - Notify stakeholders of issue and fix
   - Provide timeline for retry
   - Gather feedback

---

## Quick Reference

### Key Commands

```bash
# Check deployment status
kubectl rollout status deployment/solar-backup \
  -n solar-backup-green

# View logs
kubectl logs -f deployment/solar-backup -n solar-backup-green

# Scale pods
kubectl scale deployment solar-backup --replicas=5 \
  -n solar-backup-green

# Emergency stop
kubectl delete deployment solar-backup -n solar-backup-green

# View events
kubectl get events -n solar-backup-green --sort-by='.lastTimestamp'
```

### Monitoring URLs
- Dashboard: `https://monitoring.company.com/phase1-deployment`
- Logs: `https://logs.company.com/phase1`
- Metrics: `https://metrics.company.com/phase1`
- Alerts: `https://alerts.company.com`

### Emergency Contacts
- **Incident Commander:** [Name] +[Phone]
- **On-Call Engineer:** [Name] +[Phone]
- **Tech Lead:** [Name] +[Phone]
- **Manager:** [Name] +[Phone]

---

**Runbook Version:** 1.0  
**Last Updated:** April 19, 2026  
**Next Review:** Post-deployment review  
**Approval:** Engineering Lead
