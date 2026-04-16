# Pre-Deployment Checklist - Manual Email Triggering Feature

Date: 2026-04-16
Environment: Production
Feature: Manual Email Triggering with Resend Integration

---

## 1. CODE REVIEW CHECKLIST

- [ ] All email service functions have error handling
- [ ] Template variables are properly escaped to prevent XSS
- [ ] No API keys hardcoded in source code
- [ ] All Resend API calls use environment variables
- [ ] Email addresses are validated before sending
- [ ] Retry logic implemented with exponential backoff
- [ ] Rate limiting considerations documented
- [ ] No console.log statements in production code
- [ ] All dependencies have known, fixed versions
- [ ] Bundle size analyzed and optimized

**Verification Command:**
```bash
npm list | grep -E "resend|supabase"
```

---

## 2. TESTING CHECKLIST

### Unit Testing
- [ ] Email service functions tested in isolation
- [ ] Template rendering with various variable sets
- [ ] Error handling and retry scenarios
- [ ] Database logging functions

### Integration Testing
- [ ] Invoice email trigger to real Resend API (staging)
- [ ] Task reminder email trigger to real Resend API (staging)
- [ ] Email logs correctly recorded in Supabase
- [ ] Failed emails marked for retry
- [ ] Success notifications displayed to users

### End-to-End Testing
- [ ] Complete invoice email flow (create invoice → send email)
- [ ] Complete task reminder flow (create task → send reminder)
- [ ] Email preferences and unsubscribe links
- [ ] User authentication required for sending emails
- [ ] Batch email operations

### Manual Testing Checklist
- [ ] Send test invoice email to staging recipient
- [ ] Verify email arrives within 2 minutes
- [ ] Check email formatting and links
- [ ] Send task reminder email
- [ ] Verify task reminder email format
- [ ] Check email log entries in admin panel
- [ ] Test resend failed emails functionality
- [ ] Verify error messages display correctly

### Performance Testing
- [ ] Single email send latency < 2s
- [ ] Batch email send (10) latency < 5s
- [ ] Email logging doesn't block UI
- [ ] No memory leaks in email service

---

## 3. SECURITY REVIEW CHECKLIST

### API Security
- [ ] Resend API key only accessible in environment variables
- [ ] No API key in error messages or logs
- [ ] Email addresses validated and sanitized
- [ ] HTML templates escape all user input
- [ ] Rate limiting configured for email endpoints

### Authentication & Authorization
- [ ] Only authenticated users can send emails
- [ ] Only project owners can send invoice emails
- [ ] Only task assignees can receive task reminders
- [ ] Email preferences endpoint requires authentication
- [ ] Email logs accessible only to authorized users

### Data Protection
- [ ] Email addresses encrypted at rest in Supabase
- [ ] Email logs retention policy enforced (90 days)
- [ ] Unsubscribe mechanism working
- [ ] GDPR compliance (email preference tracking)
- [ ] No PII in email subject lines

### Environment Security
- [ ] Production secrets in secure vault
- [ ] No staging credentials in production
- [ ] HTTPS enforced for all API calls
- [ ] CORS properly configured

**Security Scan Command:**
```bash
npm audit
```

---

## 4. DATABASE MIGRATION CHECKLIST

### Migration Verification
- [ ] email_notifications table exists and properly indexed
- [ ] All required columns present
- [ ] Default values set correctly
- [ ] Foreign keys configured
- [ ] Indexes on status, recipient_email, created_at, user_id

### Data Integrity
- [ ] No orphaned email notification records
- [ ] Email notification history backed up
- [ ] Rollback migration tested locally
- [ ] Migration tested on staging first

**Migration Verification SQL:**
```sql
-- Verify table structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'email_notifications' ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'email_notifications';

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'email_notifications';
```

---

## 5. ENVIRONMENT VARIABLES CHECKLIST

### Required Variables (Production)
- [ ] `VITE_SUPABASE_URL` - Set to production Supabase URL
- [ ] `VITE_SUPABASE_ANON_KEY` - Set to production anonymous key
- [ ] `VITE_RESEND_API_KEY` - Set to production Resend API key
- [ ] `VITE_EMAIL_FROM` - Set to verified sender email
- [ ] `VITE_EMAIL_BATCH_SIZE` - Set to 10 (default)
- [ ] `VITE_MAX_EMAIL_RETRIES` - Set to 3 (default)
- [ ] `VITE_EMAIL_RETRY_DELAY_MS` - Set to 3600000 (1 hour)

### Optional Variables
- [ ] `VITE_EMAIL_LOG_RETENTION_DAYS` - Default 90
- [ ] `VITE_SUPPORT_EMAIL` - For support references

### Variable Verification
```bash
# Verify required vars are set (run in production environment)
: ${VITE_SUPABASE_URL?VITE_SUPABASE_URL not set}
: ${VITE_SUPABASE_ANON_KEY?VITE_SUPABASE_ANON_KEY not set}
: ${VITE_RESEND_API_KEY?VITE_RESEND_API_KEY not set}
: ${VITE_EMAIL_FROM?VITE_EMAIL_FROM not set}
```

---

## 6. ROLLBACK PROCEDURE CHECKLIST

### Pre-Deployment Rollback Plan
- [ ] Previous production version tagged in git
- [ ] Database schema backup created
- [ ] Email logs backup created
- [ ] Rollback procedure documented
- [ ] Rollback tested in staging environment

### Rollback Scenarios
- [ ] Resend API key invalid → Disable email feature, deploy without email components
- [ ] Database connection fails → Use previous schema version
- [ ] High email failure rate (>10%) → Pause email sending, investigate
- [ ] Performance degradation → Profile and identify bottleneck

### Rollback Execution Steps
1. Notify all stakeholders
2. Stop email processing
3. Revert to previous build: `git checkout [previous-tag]`
4. Rebuild and deploy: `npm run build && deploy production`
5. Verify application stability
6. Investigate and document issues
7. Plan remediation

---

## 7. PRE-DEPLOYMENT SIGN-OFF

### Sign-Off Checklist
- [ ] Code review approved by 2 developers
- [ ] Security review passed
- [ ] All tests passing (local)
- [ ] Staging environment verified
- [ ] Performance baselines met
- [ ] Rollback plan documented
- [ ] Deployment window scheduled
- [ ] On-call support assigned
- [ ] Stakeholders notified

### Sign-Off Approval
- [ ] Development Lead: _________________ Date: _______
- [ ] Security Lead: _________________ Date: _______
- [ ] DevOps Lead: _________________ Date: _______

---

## 8. DEPLOYMENT DAY CHECKLIST

### Pre-Deployment (2 hours before)
- [ ] Verify all team members available
- [ ] Review deployment runbook
- [ ] Confirm rollback procedure
- [ ] Check system resources (disk, memory)
- [ ] Verify backup systems operational

### During Deployment
- [ ] Build verification: `npm run build`
- [ ] Bundle size check: `ls -lh dist/`
- [ ] Deploy to production
- [ ] Verify deployment completed
- [ ] Run smoke tests
- [ ] Monitor error rates (5 minutes)
- [ ] Check email service health

### Post-Deployment (30 minutes)
- [ ] Verify feature working in production
- [ ] Check application stability
- [ ] Monitor error logs
- [ ] Review performance metrics
- [ ] Confirm email logs appearing
- [ ] Test manual email triggers

### Post-Deployment (2 hours)
- [ ] Review all metrics and logs
- [ ] Conduct team standup
- [ ] Document any issues
- [ ] Update deployment log

---

## 9. PERFORMANCE BASELINE CHECKLIST

### Metrics to Monitor
- [ ] Page load time: < 2s (95th percentile)
- [ ] Email send latency: < 2s (95th percentile)
- [ ] Batch email (10): < 5s (95th percentile)
- [ ] Database query performance: < 100ms (avg)
- [ ] Error rate: < 0.1%
- [ ] Uptime: > 99.9%

### Baseline Verification
```bash
# Build and analyze bundle size
npm run build
npm install -g webpack-bundle-analyzer
```

---

## 10. COMMUNICATION PLAN

### Pre-Deployment Announcement (24 hours)
- [ ] Email to all stakeholders
- [ ] Slack notification to #engineering
- [ ] Status page update
- [ ] Documentation updates published

### Deployment Window Announcement (1 hour)
- [ ] Final status update
- [ ] Confirm support team ready
- [ ] Notify business team

### Post-Deployment Announcement (30 minutes)
- [ ] Deployment success confirmation
- [ ] Feature availability confirmation
- [ ] Any issues or mitigations
- [ ] Monitoring status

---

## 11. SUCCESS CRITERIA

The deployment is considered successful if:
1. No P1 or P2 incidents during or after deployment
2. All critical features functioning normally
3. Email service operational (send/log/retry)
4. Error rate below 0.1%
5. Performance metrics within baselines
6. All team members can confirm via dashboard

---

## 12. CONTACT & ESCALATION

**Deployment Lead:** [Name]  
**On-Call Support:** [Phone/Email]  
**Escalation:** [Manager Name]  
**War Room:** [Slack Channel/Zoom Link]  

---

**Last Updated:** 2026-04-16  
**Next Review:** Before next major deployment
