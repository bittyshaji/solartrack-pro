# Environment Security & Secrets Management Guide

**Purpose:** Best practices for managing environment variables, secrets, and API keys  
**Target Audience:** All team members with deployment responsibilities

---

## 1. Environment Variable Best Practices

### 1.1 Variable Naming Convention

```
# Format: VITE_[CATEGORY]_[SUBCATEGORY]_[NAME]
# Examples:

# Supabase
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

# Resend Email
VITE_RESEND_API_KEY
VITE_EMAIL_FROM

# API Configuration
VITE_API_BASE_URL
VITE_API_TIMEOUT

# Feature Flags
VITE_ENABLE_DEBUG_PANEL
VITE_ENABLE_ANALYTICS
VITE_ENABLE_OFFLINE_MODE

# Logging & Monitoring
VITE_LOG_LEVEL
VITE_SENTRY_DSN

# Application
VITE_APP_ENV
VITE_APP_URL
VITE_APP_VERSION
VITE_APP_NAME
```

### 1.2 Environment File Structure

```
Development (src/.env.development)
├─ Development credentials (test keys)
├─ Feature flags enabled for testing
├─ Debug mode on
└─ Local API URLs

Staging (src/.env.staging)
├─ Staging credentials via CI/CD secrets
├─ Feature flags partially enabled
├─ Debug mode off
└─ Staging API URLs

Production (src/.env.production)
├─ Production credentials via CI/CD secrets only
├─ Feature flags configured for users
├─ Debug mode off
├─ Production API URLs
└─ Error reporting enabled
```

---

## 2. Secrets Management Strategy

### 2.1 Classification of Secrets

**Level 1: Critical (Immediate Rotation if Exposed)**
- Supabase service role key
- Database admin passwords
- API keys for payment processing
- Master encryption keys

**Level 2: High (Rotation within 24 hours)**
- Supabase anon key (has limited permissions)
- Resend API key
- Third-party service API keys
- Email service credentials

**Level 3: Medium (Rotation within 7 days)**
- Analytics API keys
- Monitoring service tokens
- Non-critical feature API keys

**Level 4: Low (Rotation on schedule)**
- Test credentials
- Development API keys
- Non-sensitive configuration

### 2.2 Storage Locations by Secret Type

```
┌─────────────────────────────────────────────────────────────┐
│           Where to Store Different Secrets                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ NEVER Store in Code:                                          │
│ ├─ .env files with real values (if committed)                │
│ ├─ Comments in code                                           │
│ ├─ Configuration files                                        │
│ ├─ Test fixtures                                              │
│ └─ Git history                                                │
│                                                               │
│ Store in CI/CD Secrets:                                       │
│ ├─ GitHub: Settings → Secrets and variables → Actions       │
│ ├─ GitLab: Settings → CI/CD → Variables                      │
│ ├─ Encrypted with per-secret key                             │
│ ├─ Only accessible during build/deploy                       │
│ └─ Masked in logs                                             │
│                                                               │
│ Store in Secret Manager:                                      │
│ ├─ AWS Secrets Manager                                       │
│ ├─ HashiCorp Vault                                            │
│ ├─ Azure Key Vault                                            │
│ ├─ Google Cloud Secret Manager                                │
│ ├─ 1Password, LastPass, etc.                                 │
│ ├─ Encryption at rest                                         │
│ ├─ Audit logging                                              │
│ └─ Access control                                             │
│                                                               │
│ Store Locally (Development Only):                             │
│ ├─ .env.local (gitignored)                                    │
│ ├─ Never commit                                               │
│ ├─ Local development only                                     │
│ └─ Regenerate for each developer                              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Rotation Schedule

| Secret Type | Rotation Frequency | Process |
|-------------|-------------------|---------|
| API Keys | Every 90 days | Generate new → Deploy to staging → Test 24h → Deploy to prod → Revoke old |
| Database Passwords | Every 180 days | Backup → Change → Update connection → Verify → Schedule old to expire |
| OAuth Client Secrets | Every 90 days | Generate new → Update in all environments → Verify webhooks → Revoke old |
| Encryption Keys | Emergency only | Rotate with encryption rekey procedure |
| SSH Keys | Every 1 year or on compromise | Generate new → Update authorized_keys → Revoke old |

**Emergency Rotation Triggers:**
- Suspected unauthorized access
- Employee departure
- Git history exposure
- Security incident
- Regular audit findings

---

## 3. API Key Management

### 3.1 Supabase Key Strategy

**Anon Key (Public - Client-Side):**
```javascript
// src/lib/supabase.js
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Permissions are limited by Row Level Security (RLS)
// Each user can only access their own data
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Why Anon Key is Safe:**
- Limited to SELECT/INSERT/UPDATE/DELETE on RLS-protected tables
- Users can only modify their own records
- RLS policies enforce row-level access control
- Never used for admin operations

**Service Role Key (Private - Server-Only):**
- NEVER expose to frontend
- NEVER commit to git
- Only used in backend for admin operations
- Store in secure secrets manager
- Bypass RLS (dangerous, use carefully)

**Key Rotation Process:**
```bash
#!/bin/bash
# scripts/rotate-supabase-keys.sh

# 1. Generate new anon key in Supabase Dashboard
# Settings → API → Generate new key

# 2. Update environment variable
export VITE_SUPABASE_ANON_KEY="new_key_here"

# 3. Commit .env.production change (if applicable)
git add .env.production

# 4. Deploy to staging first
npm run build:staging
npm run deploy:staging

# 5. Run integration tests
npm run test:integration

# 6. Deploy to production
npm run deploy:production

# 7. Verify all API calls working
npm run smoke-tests

# 8. Invalidate old key in Supabase Dashboard
# Settings → API → Revoke old key
```

### 3.2 Resend Email API Key Strategy

**Key Characteristics:**
- Used for sending emails via Resend service
- Can be restricted to specific domains
- Supports rate limiting per key
- Track usage in Resend dashboard

**Security Implementation:**
```javascript
// Email service should be backend-only
// Never expose Resend API key to frontend

// Backend: src/services/emailService.js
const RESEND_API_KEY = process.env.RESEND_API_KEY
const resend = new Resend(RESEND_API_KEY)

// Frontend: Never import or use API key directly
// Always call backend API endpoint
fetch('/api/send-email', {
  method: 'POST',
  body: JSON.stringify({ to, subject, html })
})
```

**Rotation Process:**
```bash
# 1. Create new API key in Resend Dashboard
# 2. Update in secret manager
# 3. Deploy to production
# 4. Send test email to verify
# 5. Revoke old key
```

### 3.3 OAuth Credentials (if used)

**Storage:**
```bash
# Backend environment variables
VITE_GOOGLE_CLIENT_ID=xxxxx
VITE_GOOGLE_CLIENT_SECRET=xxxxx (backend only)

VITE_GITHUB_CLIENT_ID=xxxxx
VITE_GITHUB_CLIENT_SECRET=xxxxx (backend only)
```

**Security:**
- Client ID can be public (Vite exposes it)
- Client Secret MUST be private (backend only)
- Implement authorization code flow (not implicit)
- Validate redirect URIs strictly
- Store refresh tokens securely

---

## 4. Production Environment Hardening

### 4.1 Build-Time Secret Injection

**GitHub Actions Example:**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    environment:
      name: production
      url: https://app.example.com
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security audit
        run: npm audit --audit-level=moderate
      
      - name: Build production bundle
        env:
          # Environment variables injected at build time
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          VITE_RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          VITE_APP_ENV: production
          VITE_LOG_LEVEL: error
          NODE_ENV: production
        run: npm run build
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Deploy to production
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
          DEPLOY_URL: ${{ secrets.DEPLOY_URL }}
        run: npm run deploy:production
      
      - name: Verify deployment
        run: npm run smoke-tests:production
      
      - name: Notify team
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '❌ Production deployment failed'
            })
```

**GitLab CI Example:**
```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_ENV: production

build_production:
  stage: build
  environment:
    name: production
    url: https://app.example.com
  script:
    - npm ci
    - npm audit --audit-level=moderate
    - npm run build
    - npm run test:ci
  artifacts:
    paths:
      - dist/
    expire_in: 1 day
  only:
    - main

deploy_production:
  stage: deploy
  environment:
    name: production
  script:
    - npm run deploy:production
  dependencies:
    - build_production
  only:
    - main
  when: manual  # Require manual approval
```

### 4.2 Environment Variable Validation

**Create validation script:**
```javascript
// scripts/validate-env.js
import { environment, verifyEnvironment } from './src/config/environment.js'

const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_APP_ENV',
]

const errors = []

for (const variable of requiredVars) {
  if (!environment[variable]) {
    errors.push(`Missing required environment variable: ${variable}`)
  }
}

if (process.env.NODE_ENV === 'production') {
  // Production-specific validations
  if (!environment.VITE_SUPABASE_URL.startsWith('https://')) {
    errors.push('SUPABASE_URL must use HTTPS in production')
  }
  
  if (environment.VITE_LOG_LEVEL !== 'error') {
    errors.push('LOG_LEVEL must be "error" in production')
  }
}

if (errors.length > 0) {
  console.error('Environment validation failed:')
  errors.forEach(err => console.error(`  ✗ ${err}`))
  process.exit(1)
}

// Display verification results
const verification = verifyEnvironment()
console.log('✓ Environment validation successful')
console.log(JSON.stringify(verification, null, 2))
```

**Run in CI/CD:**
```json
{
  "scripts": {
    "validate:env": "node scripts/validate-env.js",
    "build": "npm run validate:env && vite build"
  }
}
```

### 4.3 Secret Scanning Prevention

**Pre-commit Hook to Prevent Accidental Commits:**
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for secrets in staged files
if git diff --cached | grep -E "SUPABASE_ANON_KEY|RESEND_API_KEY|SENTRY_DSN" | grep -v "^-"; then
  echo "❌ Error: Attempting to commit secrets to git!"
  echo "Secrets found in staged changes:"
  git diff --cached | grep -E "SUPABASE_ANON_KEY|RESEND_API_KEY|SENTRY_DSN"
  echo ""
  echo "How to fix:"
  echo "1. Reset the staging area: git reset HEAD ."
  echo "2. Edit .env files locally only"
  echo "3. Make sure they're in .gitignore"
  echo "4. Stage again without secrets: git add ."
  exit 1
fi

exit 0
```

**Install hook:**
```bash
chmod +x .git/hooks/pre-commit
```

**Alternative: Use npm package:**
```bash
npm install --save-dev husky lint-staged

# Configure in package.json
{
  "lint-staged": {
    "*.{js,json,env*}": [
      "scripts/check-secrets.js"
    ]
  }
}
```

### 4.4 Secret Scanning Tools

**Install and configure Detect Secrets:**
```bash
pip install detect-secrets

# Scan repository
detect-secrets scan > .secrets.baseline

# Configure in CI/CD to fail if new secrets detected
detect-secrets audit .secrets.baseline
```

**GitHub Secret Scanning:**
- Automatically enabled for public repos
- Scans for patterns of known secrets
- Alerts on detection
- No configuration needed

---

## 5. Accessing Secrets During Development

### 5.1 Safe Local Development Setup

```bash
#!/bin/bash
# scripts/setup-dev-env.sh

echo "Setting up development environment..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "Creating .env.local from template..."
  cp .env.example .env.local
  echo "⚠ Please update .env.local with your local development credentials"
  exit 1
fi

# Verify .env.local is in .gitignore
if grep -q ".env.local" .gitignore; then
  echo "✓ .env.local is properly gitignored"
else
  echo "❌ .env.local is NOT in .gitignore!"
  echo "Add this line to .gitignore:"
  echo ".env.local"
  exit 1
fi

# Verify file is not world-readable
if [ -f .env.local ]; then
  permissions=$(stat -f%OLp .env.local 2>/dev/null || stat -c%a .env.local 2>/dev/null)
  if [[ $permissions == *"644"* ]] || [[ $permissions == *"rw-r--r--"* ]]; then
    echo "⚠ Warning: .env.local is readable by other users"
    echo "Run: chmod 600 .env.local"
  fi
fi

echo "✓ Development environment ready"
echo ""
echo "Next steps:"
echo "1. Get development credentials from team lead"
echo "2. Update .env.local with your credentials"
echo "3. Run: npm install && npm run dev"
```

### 5.2 Credential Distribution Process

**For New Team Members:**

```markdown
## Getting Development Credentials

1. **Request credentials from team lead**
   - Email: security@example.com
   - Include: Your GitHub username, start date

2. **Receive credentials via secure channel**
   - 1Password shared vault OR
   - LastPass shared folder OR
   - Encrypted email from tech lead

3. **Add to .env.local**
   ```
   # .env.local (never commit)
   VITE_SUPABASE_URL=https://your-dev-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-dev-key-here
   VITE_RESEND_API_KEY=re_test_your_key
   ```

4. **Test your setup**
   ```bash
   npm install
   npm run dev
   ```

5. **Verify connection**
   - Open browser to http://localhost:5173
   - Try logging in with test account
   - Check browser console for errors

6. **Report any issues**
   - Slack: #engineering-support
   - Include: Error messages, environment info
```

---

## 6. Incident Response

### 6.1 Suspected Secret Exposure

**If you suspect a secret has been exposed:**

1. **Immediate Actions (0-1 hour)**
   ```bash
   # 1. Alert the team immediately
   # Slack: #security-incidents (private channel)
   
   # 2. Identify which secret was exposed
   # Search git history: git log -p -S "secret_value"
   
   # 3. Assess severity
   # - Critical: Database access, payment keys
   # - High: API keys, service tokens
   # - Medium: Feature flags, test keys
   
   # 4. Notify team lead and security
   ```

2. **Containment (1-4 hours)**
   ```bash
   # 1. Revoke the exposed secret
   # - Supabase: Dashboard → Settings → API → Revoke
   # - Resend: Dashboard → API Keys → Delete
   # - Others: Service-specific revocation
   
   # 2. Generate new secret
   
   # 3. Update in secret manager
   
   # 4. Start deployment of new secret
   ```

3. **Recovery (4-24 hours)**
   ```bash
   # 1. Deploy new secret to all environments
   # 2. Verify all services working
   # 3. Monitor for unauthorized access
   # 4. Review logs for suspicious activity
   # 5. Update incident report
   ```

4. **Post-Incident (24+ hours)**
   ```bash
   # 1. Complete incident report
   # 2. Identify root cause
   # 3. Implement preventive measures
   # 4. Update team on findings
   # 5. Schedule follow-up security review
   ```

### 6.2 Incident Report Template

```markdown
# Security Incident Report

## Incident Details
- **Date Discovered:** YYYY-MM-DD HH:MM UTC
- **Secret Type:** [API Key / Password / Token]
- **Secret Scope:** [Supabase / Resend / Other]
- **Severity:** [Critical / High / Medium / Low]
- **Detection Method:** [Automated / Manual / External Report]

## Timeline
- **T+0h:** Secret exposure detected
- **T+1h:** Team notified, severity assessed
- **T+2h:** Secret revoked
- **T+3h:** New secret deployed to staging
- **T+6h:** New secret deployed to production
- **T+12h:** All systems verified working

## Impact Assessment
- **Affected Systems:** [List services using the secret]
- **Potential Exposure:** [What data could be accessed]
- **Unauthorized Access Detected:** [Yes/No]
- **Data Compromised:** [Yes/No, specific details]

## Root Cause
[Explanation of how the exposure occurred]

## Preventive Measures
1. [Action item to prevent recurrence]
2. [Action item to prevent recurrence]
3. [Action item to prevent recurrence]

## Follow-up
- Security review scheduled: [Date]
- All team members trained: [Yes/No]
- Documentation updated: [Yes/No]
```

---

## 7. Monitoring & Auditing

### 7.1 Environment Configuration Audit

```javascript
// scripts/audit-environment.js
import { environment } from './src/config/environment.js'

export function auditEnvironment() {
  const audit = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    issues: [],
    warnings: [],
    success: [],
  }

  // Check critical variables
  const critical = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
  for (const variable of critical) {
    if (!environment[variable]) {
      audit.issues.push(`Missing critical: ${variable}`)
    } else {
      audit.success.push(`Found: ${variable}`)
    }
  }

  // Check production-specific
  if (process.env.NODE_ENV === 'production') {
    if (environment.VITE_ENABLE_DEBUG_PANEL) {
      audit.issues.push('Debug panel enabled in production!')
    }
    if (environment.VITE_LOG_LEVEL !== 'error') {
      audit.warnings.push('Log level not set to error in production')
    }
    if (!environment.VITE_SUPABASE_URL.startsWith('https://')) {
      audit.issues.push('Supabase URL not HTTPS')
    }
  }

  // Report findings
  if (audit.issues.length > 0) {
    console.error('❌ Critical issues found:')
    audit.issues.forEach(i => console.error(`  - ${i}`))
  }
  if (audit.warnings.length > 0) {
    console.warn('⚠ Warnings:')
    audit.warnings.forEach(w => console.warn(`  - ${w}`))
  }
  if (audit.success.length > 0) {
    console.log('✓ Checks passed:')
    audit.success.forEach(s => console.log(`  - ${s}`))
  }

  return audit
}
```

### 7.2 Key Usage Monitoring

```javascript
// Backend: Monitor API key usage
const keyUsageLog = {
  timestamp: new Date().toISOString(),
  supabaseApiCalls: metrics.supabase.totalRequests,
  resendApiCalls: metrics.resend.emailsSent,
  failedAuthAttempts: metrics.auth.failures,
  rateLimitViolations: metrics.rateLimit.violations,
}

// Alert on unusual patterns:
if (metrics.supabase.totalRequests > 10000 / 60) {
  // More than 10k requests per minute
  logger.warn('Unusual Supabase API usage detected')
  // Send alert to security team
}

if (metrics.auth.failures > 10) {
  // More than 10 failed auth in short period
  logger.warn('Potential brute force attempt detected')
  // Trigger account lockout mechanisms
}
```

---

## 8. Compliance Checklist

- [ ] All secrets stored in CI/CD secrets, not in code
- [ ] .env files with real values never committed
- [ ] .gitignore includes all env files
- [ ] Rotation schedule documented
- [ ] Key rotation process documented
- [ ] Team trained on secret handling
- [ ] Pre-commit hooks prevent accidental commits
- [ ] Secret scanning enabled in CI/CD
- [ ] Incident response plan in place
- [ ] Audit logs for secret access
- [ ] Regular security audits scheduled
- [ ] All developers have secure local setup

---

## 9. Quick Reference

### Emergency Contacts
- **Security Issue:** security@example.com
- **Team Lead:** tech-lead@example.com
- **DevOps:** devops@example.com

### Useful Commands
```bash
# Validate environment
npm run validate:env

# Rotate API keys
./scripts/rotate-supabase-keys.sh

# Audit environment
npm run audit:environment

# Check for exposed secrets
detect-secrets scan

# Setup development
./scripts/setup-dev-env.sh
```

### Tools
- **Secrets Manager:** 1Password / LastPass
- **Secret Scanning:** GitHub Secret Scanning
- **Monitoring:** Sentry / DataDog
- **Logging:** CloudWatch / Stackdriver

---

**End of Environment Security Guide**
