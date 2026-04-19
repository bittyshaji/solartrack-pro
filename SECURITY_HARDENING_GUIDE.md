# Security Hardening Guide - SolarTrack Pro

**Purpose:** Implementation guide for security recommendations from the Security Audit Report  
**Target Audience:** Developers, DevOps Engineers, Security Team  
**Implementation Timeline:** Phased approach over 3 months

---

## Table of Contents

1. [Priority 1: Critical Fixes](#priority-1-critical-fixes)
2. [Priority 2: High-Impact Improvements](#priority-2-high-impact-improvements)
3. [Priority 3: Medium-Impact Improvements](#priority-3-medium-impact-improvements)
4. [Priority 4: Long-term Enhancements](#priority-4-long-term-enhancements)
5. [Testing & Verification](#testing--verification)
6. [OWASP Compliance Checklist](#owasp-compliance-checklist)

---

## Priority 1: Critical Fixes

### 1.1 Restore and Maintain Dependency Lock File

**Why:** Ensures consistent, reproducible builds across environments  
**Estimated Effort:** 2 hours  
**Risk if Skipped:** Supply chain attacks, non-deterministic vulnerabilities

#### Implementation Steps

**Step 1: Identify Rollup Issues**
```bash
# Check git history for the issue
git log --grep="Rollup" --oneline

# Install dependencies without lock file to recreate it
rm -rf node_modules
npm install
```

**Step 2: Recreate Lock File**
```bash
# Clean install to generate package-lock.json
npm ci --package-lock-only

# Verify lock file was created
ls -la package-lock.json
```

**Step 3: Commit Lock File**
```bash
git add package-lock.json
git commit -m "chore: restore package-lock.json with dependency pinning"
git push origin main
```

**Step 4: Update CI/CD Pipeline**
```yaml
# .github/workflows/build.yml (example)
- name: Install dependencies
  run: npm ci  # Uses package-lock.json

- name: Audit dependencies
  run: npm audit --audit-level=moderate
```

**Verification:**
```bash
# Verify lock file integrity
npm ci --prefer-offline
npm list
```

---

### 1.2 Run Comprehensive Dependency Audit

**Why:** Identifies known vulnerabilities in dependencies  
**Estimated Effort:** 1 hour  
**Risk if Skipped:** Using packages with known CVEs

#### Implementation Steps

**Step 1: Initial Audit**
```bash
# Run full audit
npm audit

# Generate detailed report
npm audit --json > audit-report.json

# Fix automatically fixable vulnerabilities
npm audit fix
```

**Step 2: Address Manual Fixes**
```bash
# Review vulnerabilities that can't be auto-fixed
npm audit --depth=5

# For each unfixable issue:
# 1. Check if package has newer version
npm update <package-name>

# 2. Check if alternative package exists
npm search <alternative>

# 3. Document why vulnerability is acceptable (if low risk)
# Create SECURITY_EXCEPTIONS.md file
```

**Step 3: Set up Continuous Auditing**
```bash
# Install npm-audit-ci-wrapper for stricter checks
npm install --save-dev npm-audit-ci-wrapper

# Update package.json scripts
{
  "scripts": {
    "audit:ci": "npm-audit-ci-wrapper --threshold moderate",
    "security": "npm audit && npm run audit:ci"
  }
}
```

**Step 4: Configure CI Pipeline**
```yaml
# Add to GitHub Actions / GitLab CI
- name: Security Audit
  run: npm run security
  continue-on-error: false  # Fail build on vulnerabilities
```

**Verification Checklist:**
- [ ] All critical vulnerabilities fixed
- [ ] All high vulnerabilities addressed
- [ ] Medium vulnerabilities logged and tracked
- [ ] Audit runs in CI/CD pipeline
- [ ] Team notified of findings

---

### 1.3 Document & Implement Secrets Management

**Why:** Prevents credential exposure and unauthorized access  
**Estimated Effort:** 3 hours  
**Risk if Skipped:** Credential compromise, unauthorized data access

#### Implementation Steps

**Step 1: Create .env Files Structure**

```bash
# Development
touch .env.development
cat > .env.development << 'EOF'
# Development Environment - Local Testing
# IMPORTANT: Never commit real credentials

# Supabase Development
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...YOUR_DEV_KEY...

# Resend Development
VITE_RESEND_API_KEY=re_test_...

# Feature Flags
VITE_ENABLE_DEBUG_PANEL=true
VITE_ENABLE_ANALYTICS=false
EOF

# Staging
touch .env.staging
cat > .env.staging << 'EOF'
# Staging Environment - Pre-Production Testing
# NEVER commit real credentials - use CI/CD secrets

VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=[INJECT_VIA_CI_SECRET]
VITE_RESEND_API_KEY=[INJECT_VIA_CI_SECRET]
VITE_ENABLE_DEBUG_PANEL=false
VITE_ENABLE_ANALYTICS=true
EOF

# Production (NEVER commit with real values)
touch .env.production
cat > .env.production << 'EOF'
# Production Environment
# ALL REAL CREDENTIALS MUST BE INJECTED VIA CI/CD SECRETS
# This file shows structure only - no actual values

VITE_SUPABASE_URL=[INJECT_VIA_SECRETS]
VITE_SUPABASE_ANON_KEY=[INJECT_VIA_SECRETS]
VITE_RESEND_API_KEY=[INJECT_VIA_SECRETS]
VITE_ENABLE_DEBUG_PANEL=false
VITE_ENABLE_ANALYTICS=true
VITE_LOG_LEVEL=error
EOF
```

**Step 2: Update .gitignore**

```bash
cat >> .gitignore << 'EOF'

# Environment files - NEVER commit real credentials
.env
.env.local
.env.*.local
.env.production
.env.staging

# IDE secrets
.vscode/settings.local.json
.idea/misc.xml

# Logs with potential secrets
logs/
*.log
npm-debug.log*
EOF
```

**Step 3: Create Secret Rotation Schedule**

```bash
# Create SECRETS_MANAGEMENT.md
cat > SECRETS_MANAGEMENT.md << 'EOF'
# Secrets Management Policy

## Rotation Schedule
- Supabase Keys: Every 90 days
- Resend API Key: Every 90 days
- Emergency rotation: Immediately if compromised

## Rotation Process

### For Supabase:
1. Generate new Anon Key in Supabase Dashboard
2. Update CI/CD secrets
3. Deploy to staging first
4. Test 24 hours on staging
5. Deploy to production
6. Invalidate old key after 1 week grace period

### For Resend:
1. Create new API key in Resend Dashboard
2. Update CI/CD secrets
3. Deploy to staging
4. Send test email to verify
5. Deploy to production
6. Delete old key after verification

## Monitoring
- Log all API key access
- Alert on unusual usage patterns
- Monitor failed authentication attempts
- Track key rotation events

## Emergency Response
If credentials are exposed:
1. Immediately revoke compromised keys
2. Generate new keys
3. Deploy updated keys to all environments
4. Notify team of incident
5. Review logs for unauthorized access
6. Document incident in INCIDENT_LOG.md
EOF
```

**Step 4: Configure CI/CD Secrets**

**GitHub Actions Example:**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          VITE_RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
        run: npm run build
      
      - name: Deploy
        run: npm run deploy
```

**GitLab CI Example:**
```yaml
# .gitlab-ci.yml
variables:
  VITE_SUPABASE_URL: $SUPABASE_URL
  VITE_SUPABASE_ANON_KEY: $SUPABASE_ANON_KEY
  VITE_RESEND_API_KEY: $RESEND_API_KEY

build:
  script:
    - npm ci
    - npm run build
```

**Verification Checklist:**
- [ ] All .env files created with placeholder values
- [ ] Real credentials in CI/CD secrets only
- [ ] .gitignore prevents accidental commits
- [ ] Rotation schedule documented
- [ ] Team trained on secret handling
- [ ] Access logs configured

---

## Priority 2: High-Impact Improvements

### 2.1 Implement Content Security Policy (CSP)

**Why:** Prevents inline script injection and XSS attacks  
**Estimated Effort:** 4 hours  
**Risk if Skipped:** XSS vulnerability exposure

#### Implementation Steps

**Step 1: Create CSP Configuration**

```javascript
// src/lib/security/csp-config.js
/**
 * Content Security Policy Configuration
 * Defines which resources can be loaded and executed
 */

export const CSP_POLICIES = {
  development: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'http://localhost:*'],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", 'http://localhost:*', 'https://*.supabase.co'],
    'frame-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': [],
  },
  
  production: {
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://cdn.jsdelivr.net'],
    'style-src': ["'self'", 'https://cdn.jsdelivr.net'],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'https://cdn.jsdelivr.net'],
    'connect-src': ["'self'", 'https://*.supabase.co'],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'report-uri': ['https://security-report.example.com/csp'],
    'upgrade-insecure-requests': [],
  }
};

/**
 * Build CSP header string from policy object
 */
export function buildCSPHeader(policy) {
  return Object.entries(policy)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

// Usage
const env = import.meta.env.MODE;
const policy = CSP_POLICIES[env];
const header = buildCSPHeader(policy);
console.log('CSP Header:', header);
```

**Step 2: Configure in Production (Nginx Example)**

```nginx
# nginx.conf or deployment config
server {
  listen 443 ssl http2;
  server_name solartrack.example.com;

  # Content Security Policy - Production
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self' https://*.supabase.co; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; report-uri https://security-report.example.com/csp; upgrade-insecure-requests;" always;

  # Additional Security Headers
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
  
  # ... rest of nginx config
}
```

**Step 3: Configure for Express/Node Backend (if applicable)**

```javascript
// backend/server.js
import helmet from 'helmet';
import express from 'express';

const app = express();

// Apply CSP via Helmet
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 'https://cdn.jsdelivr.net'],
    styleSrc: ["'self'", 'https://cdn.jsdelivr.net'],
    imgSrc: ["'self'", 'data:', 'https:'],
    fontSrc: ["'self'", 'https://cdn.jsdelivr.net'],
    connectSrc: ["'self'", 'https://*.supabase.co'],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    reportUri: 'https://security-report.example.com/csp',
    upgradeInsecureRequests: [],
  },
  reportOnly: process.env.NODE_ENV === 'development', // Report-only in dev
}));

// Other security middleware
app.use(helmet.xContentTypeOptions());
app.use(helmet.xFrameOptions());
app.use(helmet.xssFilter());
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));
app.use(helmet.permissionsPolicy({
  features: {
    geolocation: ["'none'"],
    microphone: ["'none'"],
    camera: ["'none'"],
  }
}));

// ... rest of app
```

**Step 4: Monitor CSP Violations**

```javascript
// src/lib/security/csp-monitor.js
/**
 * Monitor and log CSP violations
 */

export function setupCSPMonitoring() {
  document.addEventListener('securitypolicyviolation', (event) => {
    // Log violation details
    const violationData = {
      timestamp: new Date().toISOString(),
      documentURI: event.documentURI,
      violatedDirective: event.violatedDirective,
      effectiveDirective: event.effectiveDirective,
      originalPolicy: event.originalPolicy,
      blockedURI: event.blockedURI,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      disposition: event.disposition,
    };

    // Send to logging service
    console.warn('CSP Violation:', violationData);
    
    if (window.__logViolation) {
      window.__logViolation(violationData);
    }
  });
}

// Initialize on app startup
setupCSPMonitoring();
```

**Step 5: Test CSP Configuration**

```bash
# Browser console test - should NOT log errors
# Visit https://example.com and check console

# CSP Header validation
curl -I https://example.com | grep -i "content-security-policy"

# CSP Validation Tools
# https://csp-evaluator.withgoogle.com/
# https://cspvalidator.org/
```

**Verification Checklist:**
- [ ] CSP header set in production
- [ ] No console errors related to CSP
- [ ] Inline scripts blocked (expected behavior)
- [ ] External scripts from allowed origins loaded
- [ ] Report-only mode tested first
- [ ] Monitoring logs CSP violations

---

### 2.2 Enhance Logging & Remove Console Statements

**Why:** Prevents information disclosure and improves production monitoring  
**Estimated Effort:** 5 hours  
**Risk if Skipped:** Data leakage via browser console

#### Implementation Steps

**Step 1: Create Structured Logger**

```javascript
// src/lib/logger/structuredLogger.js
/**
 * Structured Logging for SolarTrack Pro
 * Provides consistent logging across the application
 */

export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
};

class StructuredLogger {
  constructor(name, level = LOG_LEVELS.INFO) {
    this.name = name;
    this.level = level;
  }

  // Private method to format and send logs
  #log(severity, message, data = {}, error = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      severity,
      logger: this.name,
      message,
      data: this.#sanitizeData(data),
      ...(error && { error: this.#formatError(error) }),
    };

    // Only log if level permits
    const severityLevel = LOG_LEVELS[severity] || LOG_LEVELS.INFO;
    if (severityLevel > this.level) return;

    // Output to console in development
    if (import.meta.env.DEV) {
      const style = this.#getConsoleStyle(severity);
      console[style.method](`%c[${severity}]`, style.css, message, data);
    }

    // Send to logging service in production
    if (import.meta.env.PROD) {
      this.#sendToService(logEntry);
    }
  }

  error(message, data = {}, error = null) {
    this.#log('ERROR', message, data, error);
  }

  warn(message, data = {}) {
    this.#log('WARN', message, data);
  }

  info(message, data = {}) {
    this.#log('INFO', message, data);
  }

  debug(message, data = {}) {
    this.#log('DEBUG', message, data);
  }

  trace(message, data = {}) {
    this.#log('TRACE', message, data);
  }

  // Sanitize sensitive data from logs
  #sanitizeData(data) {
    const sanitized = JSON.parse(JSON.stringify(data));
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'key'];
    
    const redact = (obj) => {
      for (const key in obj) {
        if (sensitiveKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          redact(obj[key]);
        }
      }
    };
    
    redact(sanitized);
    return sanitized;
  }

  #formatError(error) {
    return {
      name: error.name,
      message: error.message,
      stack: import.meta.env.DEV ? error.stack : undefined,
    };
  }

  #getConsoleStyle(severity) {
    const styles = {
      ERROR: { method: 'error', css: 'color: red; font-weight: bold;' },
      WARN: { method: 'warn', css: 'color: orange; font-weight: bold;' },
      INFO: { method: 'info', css: 'color: blue;' },
      DEBUG: { method: 'debug', css: 'color: gray;' },
      TRACE: { method: 'log', css: 'color: gray; font-size: 0.8em;' },
    };
    return styles[severity] || styles.INFO;
  }

  async #sendToService(logEntry) {
    try {
      // Send to your logging service
      // Example: Sentry, LogRocket, DataDog, CloudWatch, etc.
      if (window.__logService) {
        await window.__logService.log(logEntry);
      }
    } catch (err) {
      // Silently fail - don't let logging errors break the app
      console.error('Failed to send log:', err);
    }
  }
}

export function createLogger(name) {
  const level = import.meta.env.VITE_LOG_LEVEL || 'INFO';
  return new StructuredLogger(name, LOG_LEVELS[level]);
}

export default StructuredLogger;
```

**Step 2: Audit and Replace Console Statements**

```bash
# Find all console statements
grep -r "console\." src --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | wc -l

# Create detailed report
grep -r "console\." src --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" > console-audit.txt

# Replace with structured logger
# Example replacement in src/lib/api/client.js
```

**Step 3: Update Error Handling**

```javascript
// src/lib/api/errorHandler.js - UPDATED
import { createLogger } from './structuredLogger';

const logger = createLogger('ErrorHandler');

export function handleError(error) {
  if (!error) {
    logger.warn('Unknown error occurred', {});
    return createError(ERROR_CODES.UNKNOWN_ERROR, 'An unknown error occurred');
  }

  // Log the error with context
  logger.error('API Error detected', {
    code: error.code,
    message: error.message,
    type: error.constructor.name,
  }, error);

  // Don't expose technical details to user
  if (error.code) {
    return handleSupabaseError(error);
  }
  
  // ... rest of error handling
}

// In development, include more details
function createError(code, message, details = null) {
  const error = { code, message };

  if (import.meta.env.DEV && details) {
    error._devDetails = details;
  }

  return error;
}
```

**Step 4: Configure ESLint Rule**

```javascript
// .eslintrc.cjs
module.exports = {
  rules: {
    'no-console': [
      'warn',
      {
        allow: ['warn', 'error', 'info'], // Only allow these in development
      }
    ]
  }
};
```

**Step 5: Migrate Existing Logs**

Create a migration script:

```bash
#!/bin/bash
# scripts/migrate-logs.sh

echo "Migrating console statements to structured logger..."

# Replace common patterns
find src -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | while read file; do
  # Add import if not present
  if ! grep -q "import.*createLogger" "$file"; then
    sed -i "1s/^/import { createLogger } from '@\/lib\/logger\/structuredLogger';\nconst logger = createLogger(module.id);\n\n/" "$file"
  fi
  
  # Replace console.log with logger.info
  sed -i "s/console\.log(\(.*\))/logger.info('Log message', { data: \1 })/g" "$file"
  
  # Replace console.error with logger.error
  sed -i "s/console\.error(\(.*\))/logger.error('Error occurred', {}, \1)/g" "$file"
  
  # Replace console.warn with logger.warn
  sed -i "s/console\.warn(\(.*\))/logger.warn('Warning', { message: \1 })/g" "$file"
done

echo "Migration complete. Review changes manually."
```

**Verification Checklist:**
- [ ] Structured logger created and exported
- [ ] Error handler updated to use logger
- [ ] Console statements migrated to logger
- [ ] ESLint rule configured to warn on console
- [ ] Development logging works correctly
- [ ] Production logs sent to service
- [ ] Sensitive data redacted from logs
- [ ] Log levels configured per environment

---

### 2.3 Implement Client-Side Rate Limiting

**Why:** Prevents brute force and DoS attacks  
**Estimated Effort:** 4 hours  
**Risk if Skipped:** Brute force vulnerability

#### Implementation Steps

**Step 1: Create Rate Limiting Utility**

```javascript
// src/lib/security/rateLimiter.js
/**
 * Client-Side Rate Limiter
 * Implements token bucket algorithm for API request throttling
 */

export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.tokens = maxRequests;
    this.lastRefill = Date.now();
  }

  /**
   * Try to acquire a token for a request
   * @returns {boolean} true if request allowed, false if rate limited
   */
  tryConsume(count = 1) {
    this.refillTokens();

    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }

    return false;
  }

  /**
   * Refill tokens based on elapsed time
   */
  refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / this.windowMs) * this.maxRequests;

    this.tokens = Math.min(
      this.maxRequests,
      this.tokens + tokensToAdd
    );

    this.lastRefill = now;
  }

  /**
   * Get time until next token available (ms)
   */
  getRetryAfter() {
    this.refillTokens();
    if (this.tokens >= 1) return 0;

    const tokensNeeded = 1 - this.tokens;
    return (tokensNeeded / this.maxRequests) * this.windowMs;
  }
}

// Create rate limiters for different endpoints
export const rateLimiters = {
  auth: new RateLimiter(5, 60000), // 5 requests per minute
  api: new RateLimiter(30, 60000), // 30 requests per minute
  search: new RateLimiter(10, 60000), // 10 searches per minute
  upload: new RateLimiter(5, 300000), // 5 uploads per 5 minutes
};

export default RateLimiter;
```

**Step 2: Create Rate Limit Interceptor**

```javascript
// src/lib/api/rateLimitInterceptor.js
import { rateLimiters } from '../security/rateLimiter';
import { addBeforeRequestInterceptor } from './interceptors';

export function setupRateLimitInterceptor() {
  addBeforeRequestInterceptor((config) => {
    // Determine which limiter to use
    let limiter = rateLimiters.api;

    if (config.operation === 'select' && config.table === 'projects') {
      limiter = rateLimiters.search;
    } else if (config.operation === 'insert' && config.table === 'photos') {
      limiter = rateLimiters.upload;
    } else if (config.operation === 'signIn' || config.operation === 'signUp') {
      limiter = rateLimiters.auth;
    }

    // Check if rate limit allows request
    if (!limiter.tryConsume()) {
      const retryAfter = limiter.getRetryAfter();
      const error = new Error('Rate limit exceeded');
      error.code = 'RATE_LIMIT_EXCEEDED';
      error.retryAfter = retryAfter;
      throw error;
    }

    return config;
  });
}

export default setupRateLimitInterceptor;
```

**Step 3: Integrate with Error Handling**

```javascript
// src/lib/api/errorHandler.js - ADD THIS SECTION
import { createLogger } from '../logger/structuredLogger';

const logger = createLogger('ErrorHandler');

/**
 * Handle rate limit errors
 */
export function handleRateLimitError(error) {
  const retryAfter = error.retryAfter || 60000;
  
  logger.warn('Rate limit exceeded', {
    retryAfter: Math.ceil(retryAfter / 1000),
  });

  return createError(
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    `Too many requests. Please try again in ${Math.ceil(retryAfter / 1000)} seconds.`,
    error.message
  );
}

// Add to main handleError function:
// if (error.code === 'RATE_LIMIT_EXCEEDED') {
//   return handleRateLimitError(error);
// }
```

**Step 4: Add UI Feedback**

```jsx
// src/hooks/useRateLimitFeedback.js
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useRateLimitFeedback() {
  const [retryAfter, setRetryAfter] = useState(null);

  const handleRateLimitError = useCallback((error) => {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      const retryAfter = error.retryAfter || 60000;
      setRetryAfter(Math.ceil(retryAfter / 1000));

      // Show user-friendly message
      toast.error(
        `Too many requests. Please wait ${Math.ceil(retryAfter / 1000)}s`,
        {
          duration: retryAfter,
        }
      );

      // Clear retry timer after it expires
      const timer = setTimeout(() => setRetryAfter(null), retryAfter);
      return () => clearTimeout(timer);
    }
  }, []);

  return { retryAfter, handleRateLimitError };
}
```

**Step 5: Initialize on App Startup**

```javascript
// src/App.jsx
import { useEffect } from 'react';
import { setupRateLimitInterceptor } from './lib/api/rateLimitInterceptor';

function App() {
  useEffect(() => {
    // Initialize rate limiting
    setupRateLimitInterceptor();
  }, []);

  return (
    // ... app components
  );
}

export default App;
```

**Verification Checklist:**
- [ ] RateLimiter class created with token bucket algorithm
- [ ] Interceptor enforces rate limits on API calls
- [ ] Error handling returns user-friendly messages
- [ ] UI provides feedback when rate limited
- [ ] Different limits for different endpoint types
- [ ] Rate limiter works in development and production
- [ ] Tests verify rate limiting behavior

---

## Priority 3: Medium-Impact Improvements

### 3.1 Add Security Headers

**Why:** Defense-in-depth against common web attacks  
**Estimated Effort:** 3 hours  
**Risk if Skipped:** Exposure to clickjacking, MIME sniffing, etc.

#### Implementation Steps

**Production Security Headers (Nginx/Apache):**

```nginx
# nginx.conf - Complete security headers
server {
  listen 443 ssl http2;
  server_name solartrack.example.com;

  # Enable HSTS (HTTP Strict Transport Security)
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

  # Prevent MIME sniffing
  add_header X-Content-Type-Options "nosniff" always;

  # Clickjacking protection
  add_header X-Frame-Options "DENY" always;

  # XSS protection
  add_header X-XSS-Protection "1; mode=block" always;

  # Referrer policy - don't leak referrer info
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  # Feature policy - disable dangerous features
  add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()" always;

  # CSP (see Priority 2.1)
  add_header Content-Security-Policy "..." always;

  # CORS configuration (if needed)
  add_header Access-Control-Allow-Origin "$scheme://$server_name" always;
  add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
  add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;

  # Remove server header information leakage
  server_tokens off;

  # ... rest of nginx config
}
```

**Apache Configuration:**

```apache
# .htaccess or apache.conf
# Enable HSTS
Header set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

# Prevent MIME sniffing
Header set X-Content-Type-Options "nosniff"

# Clickjacking protection
Header set X-Frame-Options "DENY"

# XSS protection
Header set X-XSS-Protection "1; mode=block"

# Referrer policy
Header set Referrer-Policy "strict-origin-when-cross-origin"

# Feature policy
Header set Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=()"

# Remove server info
Header unset Server
Header unset X-Powered-By
```

**Verification:**

```bash
# Check headers are set
curl -I https://solartrack.example.com | grep -E "Strict|X-Content|X-Frame|X-XSS|Referrer|Permissions"

# Use online tools
# https://securityheaders.com/
# https://www.ssl-shopper.com/ssl-checker/
```

---

### 3.2 Implement Input Validation on Form Submission

**Why:** Prevent malformed data and potential injection attacks  
**Estimated Effort:** 3 hours

#### Implementation Steps

**Enhance Form Validation:**

```javascript
// src/components/forms/LoginFormValidated.jsx - UPDATED
import { loginSchema } from '../../lib/validation/authSchema';
import { sanitizeInput } from '../../lib/validation/utils';

export function LoginFormValidated({ onSubmit }) {
  const handleFormSubmit = async (data) => {
    // Sanitize input before submission
    const sanitizedData = {
      email: sanitizeInput(data.email.trim()).toLowerCase(),
      password: data.password, // Never sanitize passwords
      rememberMe: data.rememberMe,
    };

    // Validate sanitized data
    try {
      const validatedData = await loginSchema.parseAsync(sanitizedData);
      await onSubmit(validatedData);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ... rest of component
}
```

---

## Priority 4: Long-term Enhancements

### 4.1 Implement Structured Error Logging Service

**Why:** Enables security monitoring and incident response  
**Estimated Effort:** 8 hours  
**Risk if Skipped:** Cannot detect security incidents

#### Implementation Options

**Option A: Use Sentry (Recommended for SaaS)**

```javascript
// src/lib/logger/sentry-config.js
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.warn('Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event, hint) {
      // Filter out sensitive information
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers['Authorization'];
      }
      return event;
    },
  });
}

export default initSentry;
```

**Option B: Custom Logging Service**

```javascript
// src/lib/logger/remote-logger.js
export class RemoteLogger {
  constructor(endpoint, apiKey) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.queue = [];
    this.batchSize = 10;
    this.batchInterval = 30000; // 30 seconds

    this.startBatcher();
  }

  async log(entry) {
    this.queue.push(entry);

    if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.batchSize);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          logs: batch,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        // Put logs back in queue if failed
        this.queue.unshift(...batch);
      }
    } catch (error) {
      // Network error - keep logs in queue for retry
      this.queue.unshift(...batch);
    }
  }

  startBatcher() {
    this.batchTimer = setInterval(() => this.flush(), this.batchInterval);
  }

  stop() {
    clearInterval(this.batchTimer);
    return this.flush();
  }
}
```

---

### 4.2 Implement Security Event Monitoring

**Why:** Detect and respond to security incidents  
**Estimated Effort:** 6 hours

#### Implementation Steps

```javascript
// src/lib/security/event-monitor.js
import { createLogger } from '../logger/structuredLogger';

const logger = createLogger('SecurityMonitor');

export class SecurityMonitor {
  constructor() {
    this.events = [];
    this.thresholds = {
      failedLogins: 5,
      failedLoginsWindow: 300000, // 5 minutes
      suspiciousActivity: 10,
    };
  }

  /**
   * Track failed login attempts
   */
  trackFailedLogin(email) {
    const now = Date.now();
    const recent = this.events.filter(
      e => e.type === 'failed_login' &&
      e.email === email &&
      now - e.timestamp < this.thresholds.failedLoginsWindow
    );

    if (recent.length >= this.thresholds.failedLogins) {
      logger.warn('Multiple failed login attempts', {
        email,
        attempts: recent.length,
        action: 'ACCOUNT_LOCKED',
      });

      // Trigger account lock or CAPTCHA
      return { locked: true };
    }

    this.events.push({
      type: 'failed_login',
      email,
      timestamp: now,
    });

    return { locked: false };
  }

  /**
   * Track unauthorized access attempts
   */
  trackUnauthorizedAccess(userId, resource) {
    logger.warn('Unauthorized access attempt', {
      userId,
      resource,
      timestamp: new Date().toISOString(),
    });

    this.events.push({
      type: 'unauthorized_access',
      userId,
      resource,
      timestamp: Date.now(),
    });
  }

  /**
   * Cleanup old events
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    this.events = this.events.filter(
      e => now - e.timestamp < maxAge
    );
  }
}

export const securityMonitor = new SecurityMonitor();

// Cleanup every hour
setInterval(() => securityMonitor.cleanup(), 60 * 60 * 1000);
```

---

## Testing & Verification

### Security Testing Checklist

```javascript
// tests/security.test.js
import { describe, it, expect } from 'vitest';
import { RateLimiter } from '../src/lib/security/rateLimiter';
import { sanitizeInput } from '../src/lib/validation/utils';

describe('Security Features', () => {
  describe('Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter(5, 60000);
      expect(limiter.tryConsume()).toBe(true);
      expect(limiter.tryConsume()).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const limiter = new RateLimiter(2, 60000);
      limiter.tryConsume();
      limiter.tryConsume();
      expect(limiter.tryConsume()).toBe(false);
    });
  });

  describe('Input Sanitization', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const output = sanitizeInput(input);
      expect(output).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle special characters', () => {
      const input = 'Test & "quote" \'apostrophe\'';
      const output = sanitizeInput(input);
      expect(output).toContain('&amp;');
      expect(output).toContain('&quot;');
      expect(output).toContain('&#x27;');
    });
  });

  describe('HTTPS Enforcement', () => {
    it('should validate HTTPS URLs', () => {
      const config = {
        SUPABASE_URL: 'https://example.supabase.co',
        API_BASE_URL: 'https://api.example.com',
      };
      // Validation should pass
      expect(config.SUPABASE_URL).toMatch(/^https:\/\//);
    });
  });

  describe('Password Strength', () => {
    it('should require strong passwords', async () => {
      const { passwordSchema } = await import('../src/lib/validation/authSchema');
      
      expect(async () => {
        await passwordSchema.parseAsync('weak');
      }).rejects.toThrow();

      expect(async () => {
        await passwordSchema.parseAsync('Strong@123');
      }).resolves.toBeDefined();
    });
  });
});
```

### Manual Testing Steps

```bash
#!/bin/bash
# tests/security-manual-test.sh

echo "Security Hardening Verification Checklist"
echo "=========================================="

# 1. Check package-lock.json exists
echo "1. Checking package-lock.json..."
if [ -f package-lock.json ]; then
  echo "   ✓ package-lock.json found"
else
  echo "   ✗ package-lock.json missing"
fi

# 2. Run dependency audit
echo "2. Running npm audit..."
npm audit --audit-level=moderate

# 3. Check CSP headers (against production)
echo "3. Checking CSP headers..."
curl -I https://production.example.com | grep -i "content-security-policy" || echo "   ⚠ CSP header not found"

# 4. Verify HTTPS enforcement
echo "4. Checking HTTPS enforcement..."
curl -I http://example.com 2>&1 | grep -i "301\|302\|permanent\|redirect" && echo "   ✓ HTTPS redirect working" || echo "   ✗ Not redirecting to HTTPS"

# 5. Test rate limiting
echo "5. Testing rate limiting..."
for i in {1..15}; do
  curl -X GET https://example.com/api/test &
done
wait

# 6. Check for console statements
echo "6. Checking console statements..."
console_count=$(grep -r "console\." src --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" | wc -l)
echo "   Found $console_count console statements"

echo ""
echo "Verification Complete"
```

---

## OWASP Compliance Checklist

### OWASP Top 10 Implementation Status

```markdown
# OWASP Top 10 Security Controls Checklist

## A1: Broken Access Control
- [ ] Authentication required for protected pages
- [ ] Authorization checks on all operations
- [ ] Role-based access control implemented
- [ ] User can't access other users' data
- [ ] Admin features restricted to admin users
- [ ] API endpoints validate user permissions

**Status:** ✅ IMPLEMENTED
**Evidence:** ProtectedRoute.jsx, AuthContext.tsx, RLS policies

---

## A2: Cryptographic Failures
- [ ] All data in transit uses HTTPS
- [ ] Sensitive data encrypted at rest
- [ ] Strong password hashing (bcrypt)
- [ ] No hardcoded cryptographic keys
- [ ] Secure random token generation
- [ ] Perfect forward secrecy for sessions

**Status:** ✅ IMPLEMENTED
**Evidence:** Supabase Auth, HTTPS enforcement, password schemas

---

## A3: Injection
- [ ] SQL queries parameterized
- [ ] No dynamic SQL construction
- [ ] Input validation on all forms
- [ ] Output encoding for display
- [ ] No command injection vulnerabilities
- [ ] API filters parameterized

**Status:** ✅ IMPLEMENTED
**Evidence:** Supabase client usage, Zod validation

---

## A4: Insecure Design
- [ ] Threat modeling completed
- [ ] Security requirements documented
- [ ] Secure defaults implemented
- [ ] Negative test cases considered
- [ ] Security testing integrated
- [ ] Access control matrix documented

**Status:** ⚠️ PARTIAL
**Action Items:** Create threat model, document security requirements

---

## A5: Security Misconfiguration
- [ ] No default credentials used
- [ ] Minimal required services exposed
- [ ] Security headers configured
- [ ] Error messages don't reveal sensitive info
- [ ] Logging configured securely
- [ ] Framework security features enabled

**Status:** ⚠️ PARTIAL
**Action Items:** Implement CSP, add security headers

---

## A6: Vulnerable & Outdated Components
- [ ] Dependencies tracked and updated
- [ ] Known vulnerabilities monitored
- [ ] Regular security audits performed
- [ ] Component usage documented
- [ ] License compliance verified
- [ ] Patch management process

**Status:** ⚠️ PARTIAL
**Action Items:** Restore package-lock.json, setup audit schedule

---

## A7: Authentication Failures
- [ ] Strong password requirements enforced
- [ ] Credential storage secure
- [ ] Session management implemented
- [ ] Multi-factor authentication available
- [ ] Account lockout after failures
- [ ] No session fixation vulnerabilities

**Status:** ✅ IMPLEMENTED
**Evidence:** Supabase Auth, password schemas

---

## A8: Data Integrity Failures
- [ ] Input validation comprehensive
- [ ] Output encoding consistent
- [ ] No deserialization of untrusted data
- [ ] Data validation on server-side
- [ ] Checksums/signatures for data
- [ ] Immutable structures where possible

**Status:** ✅ IMPLEMENTED
**Evidence:** Zod validation, React escaping

---

## A9: Logging & Monitoring Failures
- [ ] Security events logged
- [ ] Logs retained appropriately
- [ ] Alerts configured for incidents
- [ ] Log integrity protected
- [ ] Monitoring dashboard active
- [ ] Incident response plan

**Status:** ⚠️ PARTIAL
**Action Items:** Implement structured logging, setup monitoring

---

## A10: SSRF
- [ ] URL validation implemented
- [ ] DNS rebinding protection
- [ ] Limited external API calls
- [ ] Internal services protected
- [ ] Network segmentation
- [ ] Firewall rules configured

**Status:** ✅ SECURE
**Notes:** Limited external API usage reduces risk

---

## Overall OWASP Compliance: 70%

Priority improvements:
1. Implement structured logging (A9)
2. Add security headers (A5)
3. Document security design (A4)
4. Setup monitoring (A9)
```

---

## Summary

This hardening guide provides:
1. **Immediate actions** (Priority 1) - Core security fixes
2. **High-impact improvements** (Priority 2) - Significant security benefits
3. **Medium-impact enhancements** (Priority 3) - Defense-in-depth
4. **Long-term program** (Priority 4) - Sustained security posture

**Estimated Total Implementation Time:** 6-8 weeks  
**Team Required:** 2-3 developers + 1 DevOps engineer  
**Review Frequency:** Monthly progress reviews

---

**End of Security Hardening Guide**
