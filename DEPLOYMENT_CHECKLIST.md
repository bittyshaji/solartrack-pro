# SolarTrack Pro - Pre-Deployment Checklist

**Project**: SolarTrack Pro v0.1.0  
**Last Updated**: 2026-04-19  
**Target Environment**: Production  

---

## 1. Pre-Deployment Verification Checklist

### Code Quality & Security
- [ ] Run `npm run lint:check` - All linting issues resolved
- [ ] Run `npm run type-check` - No TypeScript errors
- [ ] Run `npm run test:coverage` - Test coverage meets 70% threshold (lines, statements, branches)
- [ ] All test suites passing: `npm run test`
- [ ] No console.log statements in production code (ESLint should catch these with --warn)
- [ ] No debugger statements in code
- [ ] No hardcoded API keys, passwords, or secrets in codebase
- [ ] Security audit passed: `npm audit` - No critical vulnerabilities
- [ ] All dependencies up-to-date (review npm outdated)
- [ ] No dev dependencies in production build
- [ ] Code reviewed by at least one team member
- [ ] No merge conflicts or unresolved branches
- [ ] Git history is clean and meaningful

### Build & Output Verification
- [ ] Fresh build produced: `npm run build`
- [ ] Build completes without errors or warnings
- [ ] Build completes without timeout (< 5 minutes)
- [ ] `dist/` directory created with proper structure:
  - [ ] `dist/index.html` exists
  - [ ] `dist/assets/` directory contains JS bundles
  - [ ] `dist/css/` directory contains CSS files
  - [ ] `dist/assets/images/` contains optimized images
  - [ ] `dist/assets/fonts/` contains web fonts
- [ ] Source maps generated for debugging (if enabled)
- [ ] Bundle analysis generated: `dist/bundle-analysis.html`
- [ ] Review bundle size - no unexpectedly large chunks
- [ ] Vendor chunks properly split (React, routing, charts, forms)
- [ ] Main entry point gzipped size < 500KB

### Environment Configuration
- [ ] `.env.production` file created from `.env.production.example`
- [ ] All required environment variables populated:
  - [ ] `VITE_SUPABASE_URL` - Production Supabase project URL
  - [ ] `VITE_SUPABASE_ANON_KEY` - Production anonymous key (not service_role)
  - [ ] `VITE_RESEND_API_KEY` - Production Resend API key
  - [ ] `VITE_EMAIL_FROM` - Verified sender domain
  - [ ] `VITE_APP_ENV=production`
  - [ ] `VITE_LOG_LEVEL=error` (production should not log debug info)
  - [ ] `VITE_API_TIMEOUT_MS` - Set appropriately for production
- [ ] No empty/placeholder environment variables
- [ ] Environment variables validated for correct values (not staging)
- [ ] `.env.production` is NOT committed to git
- [ ] `.gitignore` includes `.env.*` and `.env.local`
- [ ] Environment configuration documented in DEPLOYMENT_RUNBOOK.md

### Database & Backend Services
- [ ] Supabase production instance verified:
  - [ ] Database migrations applied
  - [ ] Tables created and verified
  - [ ] RLS (Row Level Security) policies configured
  - [ ] Service roles configured correctly
  - [ ] Backups enabled and tested
  - [ ] Database performance baselines recorded
- [ ] Database connection pooling configured (if applicable)
- [ ] Production database credentials secure in vault (AWS Secrets Manager, HashiCorp Vault, etc.)
- [ ] Read replica configured for analytics queries (optional, for scale)
- [ ] Connection monitoring in place
- [ ] Database queries optimized (indexes created on frequently queried columns)

### API & Third-Party Services
- [ ] Supabase authentication configured:
  - [ ] Allowed redirect URLs configured
  - [ ] CORS settings appropriate for production domain
  - [ ] JWT expiration times configured
  - [ ] Password reset flow tested
- [ ] Resend email service validated:
  - [ ] Sender domain verified in Resend dashboard
  - [ ] Production API key confirmed (not test/dev key)
  - [ ] Email templates configured
  - [ ] Bounce and complaint handling configured
  - [ ] Rate limits understood (100 emails/second)
- [ ] CORS headers configured correctly for production domain
- [ ] Rate limiting configured on API endpoints
- [ ] API timeout values appropriate (default 30s)

### Performance & Optimization
- [ ] Code splitting verified - all chunks load correctly
- [ ] CSS minification enabled (lightningcss)
- [ ] JavaScript minified with Terser:
  - [ ] Console drops enabled (`drop_console: true`)
  - [ ] Debugger removed (`drop_debugger: true`)
  - [ ] Multiple compression passes (2+)
  - [ ] Comments removed in production build
- [ ] Image optimization completed:
  - [ ] Images compressed (consider WEBP format)
  - [ ] Responsive images configured
  - [ ] Lazy loading implemented for below-fold images
- [ ] Font loading optimized (preload critical fonts)
- [ ] Service Worker caching strategy reviewed
- [ ] Cache busting via hash-based filenames confirmed
- [ ] Core Web Vitals measured and acceptable

### Security Headers & HTTPS
- [ ] HTTPS/TLS configured on production domain
- [ ] SSL/TLS certificate valid (check expiration date)
- [ ] SSL/TLS certificate from trusted CA (not self-signed)
- [ ] HSTS header configured (`Strict-Transport-Security: max-age=31536000`)
- [ ] CSP (Content Security Policy) header configured to prevent injection attacks
- [ ] X-Frame-Options header set to prevent clickjacking
- [ ] X-Content-Type-Options set to `nosniff`
- [ ] X-XSS-Protection header configured
- [ ] Referrer-Policy configured (recommend: `strict-origin-when-cross-origin`)
- [ ] Permissions-Policy configured to restrict browser features
- [ ] Security headers tested with online tools (securityheaders.com)

### Data Protection & Privacy
- [ ] GDPR compliance reviewed (if applicable):
  - [ ] Privacy policy updated
  - [ ] Cookie consent banner configured
  - [ ] Data retention policies documented
- [ ] Sensitive data not logged (passwords, tokens, PII)
- [ ] Authentication tokens handled securely:
  - [ ] Tokens stored in secure, httpOnly cookies (not localStorage for sensitive data)
  - [ ] Token rotation configured
  - [ ] Logout properly clears all tokens
- [ ] Session timeout configured (recommend: 30 minutes of inactivity)
- [ ] CSRF protection enabled (if applicable)
- [ ] Input validation & sanitization on all forms
- [ ] File upload validation:
  - [ ] File type whitelist enforced
  - [ ] File size limits enforced (10MB max)
  - [ ] File scanning for malware (optional but recommended)

### Monitoring & Logging Setup
- [ ] Error tracking configured (Sentry, Rollbar, or similar):
  - [ ] Production environment configured
  - [ ] Alert thresholds set
  - [ ] Team members added to alerts
- [ ] Application monitoring configured (optional):
  - [ ] User analytics enabled (privacy-compliant)
  - [ ] Performance metrics tracked
  - [ ] Session recording (privacy-compliant, with user consent)
- [ ] Server logs monitored and aggregated
- [ ] Database query performance logs enabled
- [ ] Email delivery logs monitored
- [ ] Uptime monitoring configured (StatusPage, UptimeRobot, etc.)
- [ ] Log retention policies set appropriately

### Backup & Disaster Recovery
- [ ] Database backups verified:
  - [ ] Automated daily backups enabled
  - [ ] Test restore from backup completed successfully
  - [ ] Backup retention policy set (recommend: 30 days)
  - [ ] Backup location documented (separate geographic region)
- [ ] Static assets backed up (if stored in object storage)
- [ ] Configuration backups documented
- [ ] Disaster recovery plan documented
- [ ] RTO (Recovery Time Objective) and RPO (Recovery Point Objective) defined
- [ ] Failover procedures tested

### CDN & Cache Configuration
- [ ] CDN enabled for static assets (Cloudflare, AWS CloudFront, etc.):
  - [ ] Cache rules configured for assets (long TTL: 1 year+)
  - [ ] Cache rules configured for HTML (short TTL: 5 minutes)
  - [ ] Cache rules configured for API responses (no cache)
- [ ] Compression enabled (gzip and brotli)
- [ ] Browser caching headers configured:
  - [ ] Cache-Control headers set appropriately
  - [ ] ETag or Last-Modified headers enabled
- [ ] Cache invalidation strategy documented
- [ ] DDoS protection enabled at CDN layer

### Documentation & Knowledge Transfer
- [ ] Deployment runbook created and tested (see DEPLOYMENT_RUNBOOK.md)
- [ ] Rollback procedures documented
- [ ] Known issues documented with workarounds
- [ ] Team documentation updated
- [ ] On-call runbook prepared
- [ ] Key contacts/escalation path defined
- [ ] Change log updated with deployment notes

### Final Pre-Deployment Review
- [ ] Change control approval obtained (if required)
- [ ] Maintenance window scheduled (if applicable)
- [ ] Communication plan prepared (status page, team notification)
- [ ] Stakeholders notified of deployment schedule
- [ ] Deployment verified on staging environment first
- [ ] Production database backed up immediately before deployment
- [ ] Team available for immediate troubleshooting during/after deployment
- [ ] Rollback plan tested (restore from backup, revert to previous version)

---

## 2. Environment Variable Setup Guide

### Location
- **File**: `.env.production` (in project root)
- **Important**: Never commit this file to git. Add to `.gitignore`.
- **Storage**: Use secure vault (AWS Secrets Manager, HashiCorp Vault, 1Password)

### Required Variables

#### Supabase Configuration
```env
# Production Supabase project URL
# Get from: Supabase Dashboard → Settings → API → Project URL
VITE_SUPABASE_URL=https://your-prod-project.supabase.co

# Production anonymous key
# Get from: Supabase Dashboard → Settings → API → Project Keys → anon/public
# IMPORTANT: Use the 'anon' key, NOT the 'service_role' key
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Email Service (Resend)
```env
# Production API key from Resend
# Get from: https://resend.com → API Keys → Create Production Key
# Key format: re_xxxxxxxxxxxxx
VITE_RESEND_API_KEY=re_your_production_key_here

# Verified sender domain in Resend
# Domain must be verified in Resend dashboard
VITE_EMAIL_FROM=noreply@yourdomain.com

# Email configuration
VITE_EMAIL_BATCH_SIZE=10        # Emails per batch
VITE_MAX_EMAIL_RETRIES=3        # Retry attempts
VITE_EMAIL_RETRY_DELAY_MS=3600000 # 1 hour between retries
VITE_EMAIL_LOG_RETENTION_DAYS=90  # Keep logs 90 days
```

#### Application Configuration
```env
# Environment identifier
VITE_APP_ENV=production

# Logging level - use 'error' for production (not 'debug' or 'info')
# Options: error, warn, info, debug
VITE_LOG_LEVEL=error

# API timeout in milliseconds (default: 30000 = 30 seconds)
VITE_API_TIMEOUT_MS=30000

# Support contact information (optional)
VITE_SUPPORT_EMAIL=support@yourdomain.com
VITE_SUPPORT_PHONE=+1-800-XXX-XXXX
```

### Environment Variable Validation Checklist
- [ ] `VITE_SUPABASE_URL` matches production project (contains .supabase.co)
- [ ] `VITE_SUPABASE_ANON_KEY` is production key (not staging or dev)
- [ ] `VITE_SUPABASE_ANON_KEY` starts with eyJ (valid JWT format)
- [ ] `VITE_RESEND_API_KEY` starts with `re_` (production format)
- [ ] `VITE_RESEND_API_KEY` is not a test key
- [ ] `VITE_EMAIL_FROM` is a verified sender in Resend
- [ ] `VITE_APP_ENV` equals `production` (case-sensitive)
- [ ] `VITE_LOG_LEVEL` is set to `error` for production
- [ ] No empty/undefined values
- [ ] No test/dummy values left

### Key Rotation Schedule
- **Resend API Key**: Rotate every 90 days
- **Supabase Keys**: Rotate every 6 months
- **Document rotation dates**: Store in your vault

---

## 3. Build Process Verification

### Pre-Build Checks
```bash
# Run linter
npm run lint:check

# Run type check
npm run type-check

# Run all tests
npm run test

# Check test coverage
npm run test:coverage
```

All checks must pass before proceeding to build.

### Build Command
```bash
# Clean build
npm run build

# Expected output:
# ✓ built in X.XXs
# dist/index.html               X.XX kB │ gzip: X.XX kB
# dist/css/[name]-[hash].css    X.XX kB │ gzip: X.XX kB
# dist/js/[name]-[hash].js      X.XX kB │ gzip: X.XX kB
```

### Build Artifacts Verification
- [ ] `dist/index.html` - Main entry point (should be ~1-2KB)
- [ ] `dist/js/vendor-react-*.js` - React bundle
- [ ] `dist/js/vendor-routing-*.js` - React Router
- [ ] `dist/js/vendor-charts-*.js` - Recharts
- [ ] `dist/js/vendor-forms-*.js` - React Hook Form
- [ ] `dist/js/vendor-supabase-*.js` - Supabase client
- [ ] `dist/js/index-*.js` - Main application code
- [ ] CSS files in `dist/css/` directory
- [ ] Assets in `dist/assets/` (images, fonts)
- [ ] Manifest in `dist/manifest.json`
- [ ] Service worker in `dist/serviceWorker.js`

### Build Size Analysis
```bash
# View bundle analysis
open dist/bundle-analysis.html
```

Expected sizes (gzipped):
- Vendor React: ~40KB
- Vendor Routing: ~10KB
- Vendor Charts: ~50KB
- Vendor Forms: ~15KB
- Vendor Supabase: ~20KB
- Main JS: ~50-80KB
- CSS: ~10-20KB

Total main bundle should be under 500KB gzipped.

### Production Build Optimization Checklist
- [ ] Minification enabled (`minify: 'terser'`)
- [ ] Tree-shaking removes unused code
- [ ] Code splitting creates separate vendor chunks
- [ ] Console logs removed in production build
- [ ] Source maps excluded from build (optional for production)
- [ ] Assets optimized (images, fonts compressed)
- [ ] CSS split and minimized

---

## 4. Security Headers Configuration

### Web Server Configuration (Nginx Example)
```nginx
# Add to nginx server block for your domain

# HSTS - Force HTTPS (1 year)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Content Security Policy - Prevent injection attacks
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://opzoighusosmxcyneifc.supabase.co https://api.resend.com; frame-ancestors 'none';" always;

# Prevent clickjacking
add_header X-Frame-Options "DENY" always;

# Prevent MIME type sniffing
add_header X-Content-Type-Options "nosniff" always;

# XSS Protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer Policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Permissions Policy (formerly Feature Policy)
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Enable compression
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
gzip_comp_level 6;
gzip_vary on;
gzip_min_length 1000;

# Brotli compression (if available)
brotli on;
brotli_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Browser caching for static assets
location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# HTML caching - short TTL for dynamic content
location ~* \.html$ {
    expires 5m;
    add_header Cache-Control "public, must-revalidate";
}

# Deny access to sensitive files
location ~ /\.env {
    deny all;
}

location ~ /\.git {
    deny all;
}
```

### Web Server Configuration (Apache Example)
```apache
# Add to .htaccess or VirtualHost

<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://opzoighusosmxcyneifc.supabase.co https://api.resend.com; frame-ancestors 'none';"
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
</IfModule>

<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain text/css application/json application/javascript text/xml application/xml
</IfModule>

<FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "max-age=31536000, public, immutable"
</FilesMatch>

<FilesMatch "\.html$">
    Header set Cache-Control "max-age=300, public, must-revalidate"
</FilesMatch>

# Deny access to sensitive files
<Files ".env*">
    Deny from all
</Files>

<DirectoryMatch "\.git">
    Deny from all
</DirectoryMatch>
```

### Content Security Policy (CSP) Explanation
The CSP header restricts:
- **default-src 'self'**: Only scripts/styles from same origin by default
- **script-src 'self' 'wasm-unsafe-eval'**: Allows scripts from same origin + WASM
- **style-src 'self' 'unsafe-inline'**: Allows inline styles (Tailwind uses this)
- **img-src 'self' data: https:**: Allows images from same origin, data URIs, and HTTPS URLs
- **font-src 'self'**: Fonts from same origin only
- **connect-src 'self' https://...**: API calls allowed to Supabase and Resend
- **frame-ancestors 'none'**: Prevents embedding in iframes

Adjust CSP based on your actual third-party service dependencies.

### HSTS Preload (Optional)
Submit your domain to HSTS preload list for added security:
https://hstspreload.org/

---

## 5. Database Considerations

### Supabase Database Setup
- [ ] Production database created in Supabase
- [ ] Database version: PostgreSQL 14+ (check in Supabase settings)
- [ ] Region selected (closest to users for lowest latency)

### Schema & Migrations
- [ ] All migrations applied to production database
- [ ] Tables created with appropriate columns and constraints
- [ ] Primary keys defined on all tables
- [ ] Foreign key relationships established
- [ ] Indexes created on frequently queried columns:
  - [ ] Indexes on foreign key columns
  - [ ] Indexes on commonly filtered columns
  - [ ] Indexes on sort columns
  - [ ] Composite indexes for multi-column queries
- [ ] Unique constraints defined (e.g., email addresses)
- [ ] Check constraints for data integrity

### Row Level Security (RLS)
- [ ] RLS enabled on all tables containing sensitive data
- [ ] Policies configured for different user roles:
  - [ ] Users can read their own data
  - [ ] Users cannot modify other users' data
  - [ ] Admin users have appropriate elevated access
  - [ ] Public data readable by all (if applicable)
- [ ] Policies tested thoroughly
- [ ] Service role policies configured for backend operations (if needed)

### Performance Optimization
- [ ] Analyze slow queries using Supabase query inspector
- [ ] Create indexes for query hotspots
- [ ] Optimize JOIN queries
- [ ] Use EXPLAIN ANALYZE for query optimization
- [ ] Connection pooling configured (PgBouncer)
- [ ] Connection limit set appropriately

### Data Integrity
- [ ] Constraints defined (NOT NULL, UNIQUE, CHECK, FOREIGN KEY)
- [ ] Cascade delete rules configured appropriately
- [ ] Audit logging configured for sensitive tables (optional)
- [ ] Data validation rules implemented

### Backup & Recovery
- [ ] Automated backups enabled (Supabase default)
- [ ] Backup frequency: Daily minimum
- [ ] Backup retention: 30 days minimum
- [ ] Test restore procedure from backup
- [ ] Backup location in separate region (Supabase default: multi-region)
- [ ] Point-in-time recovery capability verified

### Monitoring
- [ ] Database connection monitoring enabled
- [ ] Query performance alerts configured
- [ ] Storage usage alerts configured
- [ ] Replication lag monitoring (if read replicas used)
- [ ] Error rate monitoring configured

---

## 6. CDN/Cache Setup

### Static Asset CDN (Recommended: Cloudflare, AWS CloudFront, etc.)

#### Configuration
- [ ] CDN enabled for your domain
- [ ] Origin set to your web server
- [ ] SSL/TLS between CDN and origin enabled (HTTPS)

#### Cache Rules - Static Assets (1 year TTL)
```
Path: /assets/*
Path: /dist/assets/*
Cache TTL: 31536000 seconds (1 year)
Cache Key: Include query string
Compression: gzip, brotli
```

#### Cache Rules - CSS/JS (1 year TTL with hash)
```
Path: /js/*
Path: /css/*
Cache TTL: 31536000 seconds (1 year)
Cache Key: Include query string + hash
Compression: gzip, brotli
```

#### Cache Rules - HTML (5 minute TTL)
```
Path: /index.html
Path: /offline.html
Cache TTL: 300 seconds (5 minutes)
Cache Key: Ignore query string
Compression: gzip, brotli
By-pass Cache: Never (must refresh periodically for updates)
```

#### Cache Rules - API (No Cache)
```
Path: /api/*
Cache TTL: 0 (disabled)
```

### Browser Caching Headers
These are handled by Vite build output:

**Static Assets** (index.html includes correct paths):
- `Cache-Control: public, immutable, max-age=31536000`
- `ETag` headers for cache validation

**HTML**:
- `Cache-Control: public, must-revalidate, max-age=300`

### Cache Invalidation Strategy
- [ ] Vite generates unique hashes for bundles on each build
- [ ] URLs change when content changes (automatic invalidation)
- [ ] CDN purge script prepared for emergency cache clearing
- [ ] Purge cache as part of deployment procedure

### Performance Monitoring
- [ ] CDN cache hit rate monitored (target: 90%+)
- [ ] Time to First Byte (TTFB) measured
- [ ] Page load times monitored (target: < 2 seconds)
- [ ] Core Web Vitals monitored (LCP, FID, CLS)

---

## 7. SSL/TLS Requirements

### Certificate Setup
- [ ] SSL/TLS certificate obtained from trusted CA:
  - [ ] DigiCert, Let's Encrypt, GlobalSign, etc.
  - [ ] Wildcard certificate (covers all subdomains) or multi-domain SAN
- [ ] Certificate type: SHA-256 signed (not SHA-1)
- [ ] Key size: 2048-bit RSA minimum (4096-bit recommended) or ECDSA P-256
- [ ] Certificate installed on web server
- [ ] Intermediate certificates installed (chain of trust)
- [ ] Certificate expiration date documented (auto-renewal configured)

### Certificate Validation
- [ ] Certificate valid for your production domain
- [ ] Certificate not expired (check with: `openssl x509 -in cert.pem -noout -dates`)
- [ ] Certificate chain complete (all intermediates included)
- [ ] Self-signed certificates NOT used in production
- [ ] Certificate matches server hostname (no hostname mismatch errors)

### TLS Configuration
- [ ] TLS version: 1.2 minimum (TLS 1.3 preferred)
- [ ] TLS 1.0 and 1.1 disabled (deprecated and insecure)
- [ ] Strong cipher suites configured (disable weak ciphers)
- [ ] Perfect Forward Secrecy (PFS) enabled
- [ ] OCSP stapling enabled for faster cert validation

### Nginx TLS Configuration Example
```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;

    # SSL Certificate
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;

    # TLS Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Session Configuration
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/ssl/certs/ca-bundle.crt;

    # Your site configuration...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### Certificate Monitoring
- [ ] Certificate expiration monitored (alerts 30 days before expiry)
- [ ] Certificate renewal process automated
- [ ] CertBot or similar auto-renewal tool installed (for Let's Encrypt)
- [ ] Renewal logs monitored for failures

---

## 8. Pre-Deployment Testing Checklist

### Functional Testing
- [ ] All user authentication flows tested (login, logout, password reset)
- [ ] Main dashboard loads and displays data correctly
- [ ] All major features functional:
  - [ ] Project creation and editing
  - [ ] Customer management
  - [ ] Email sending (test mode first)
  - [ ] Document generation (invoices, proposals)
  - [ ] Data export (CSV, PDF)
  - [ ] Filtering and searching
- [ ] Forms validate input correctly
- [ ] Error handling displays user-friendly messages
- [ ] Mobile responsive design verified

### Performance Testing
- [ ] Page load time < 2 seconds (first contentful paint)
- [ ] Interaction to next paint < 100ms
- [ ] Cumulative layout shift < 0.1
- [ ] Build bundle size acceptable (< 500KB gzipped)
- [ ] Large lists paginate correctly (not loading 10,000 items at once)

### Browser Compatibility
- [ ] Tested on Chrome (latest 2 versions)
- [ ] Tested on Firefox (latest 2 versions)
- [ ] Tested on Safari (latest 2 versions)
- [ ] Tested on Edge (latest 2 versions)
- [ ] Mobile browsers tested (iOS Safari, Chrome)

### Security Testing
- [ ] SQL injection attempts blocked
- [ ] XSS injection attempts blocked
- [ ] CSRF protection working
- [ ] Authentication tokens not exposed in URLs
- [ ] Sensitive data not visible in browser cache/localStorage inappropriately
- [ ] Security headers present (use securityheaders.com)
- [ ] API endpoints require authentication where appropriate

---

## Deployment Sign-Off

**Prepared By**: _________________  
**Date**: _________________  
**Reviewed By**: _________________  
**Approved By**: _________________  

**Notes/Issues**:  
```
_________________________________________________
_________________________________________________
_________________________________________________
```

---

## Emergency Contact Information

**On-Call Engineer**: _________________ | Phone: _________________  
**DevOps Team Lead**: _________________ | Phone: _________________  
**CTO/Technical Lead**: _________________ | Phone: _________________  

---

## Related Documentation

- See DEPLOYMENT_RUNBOOK.md for step-by-step deployment instructions
- See .env.production.example for environment variable reference
- See vite.config.js for build configuration details
- See package.json for available npm scripts
