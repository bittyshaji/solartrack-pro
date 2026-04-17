# Production Environment Setup Guide

---

## 1. ENVIRONMENT VARIABLES

### .env.production Template
```bash
# Supabase Configuration (Production)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key-here

# Resend Email Service (Production)
VITE_RESEND_API_KEY=re_your_production_api_key_here
VITE_EMAIL_FROM=noreply@solartrack.com
VITE_EMAIL_BATCH_SIZE=10
VITE_MAX_EMAIL_RETRIES=3
VITE_EMAIL_RETRY_DELAY_MS=3600000

# Support Contact (Optional)
VITE_SUPPORT_EMAIL=support@solartrack.com
VITE_SUPPORT_PHONE=+1-800-123-4567

# Application Configuration
VITE_APP_ENV=production
VITE_LOG_LEVEL=error
VITE_API_TIMEOUT_MS=30000
```

### Environment Variables Explanation

#### Supabase Variables
| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes | `https://opzoighusosmxcyneifc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Anon key for client-side auth | Yes | `eyJhbGciOiJIUzI1NiI...` |

**How to obtain:**
1. Go to Supabase Dashboard
2. Select production project
3. Settings → API → Project URL and anon key
4. Copy and paste into .env.production

#### Resend Email Variables
| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_RESEND_API_KEY` | Resend API key | Yes | None |
| `VITE_EMAIL_FROM` | Sender email address | Yes | `noreply@solartrack.com` |
| `VITE_EMAIL_BATCH_SIZE` | Emails per batch | No | `10` |
| `VITE_MAX_EMAIL_RETRIES` | Retry attempts | No | `3` |
| `VITE_EMAIL_RETRY_DELAY_MS` | Delay between retries | No | `3600000` (1 hour) |

**How to obtain Resend API Key:**
1. Go to Resend Dashboard (https://resend.com)
2. Click "API Keys" in sidebar
3. Create new production API key
4. Copy and paste into .env.production

**How to verify sender email:**
1. In Resend Dashboard, go to Senders
2. Add domain: solartrack.com
3. Follow DNS verification steps
4. Once verified, use noreply@solartrack.com

### Setting Environment Variables

#### Docker Deployment
```bash
# Create .env file
cat > /prod/.env.production << EOF
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
VITE_RESEND_API_KEY=re_your-key-here
VITE_EMAIL_FROM=noreply@solartrack.com
EOF

# In docker-compose.yml
services:
  app:
    env_file: /prod/.env.production
```

#### Traditional Server
```bash
# Create .env file in app root
export VITE_SUPABASE_URL="https://prod-project.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-key-here"
export VITE_RESEND_API_KEY="re_your-key-here"
export VITE_EMAIL_FROM="noreply@solartrack.com"

# Verify variables loaded
echo $VITE_SUPABASE_URL
```

#### Vercel Deployment
1. Go to Project Settings → Environment Variables
2. Add each variable with "Production" scope
3. Redeploy for variables to take effect

---

## 2. RESEND API CONFIGURATION

### API Key Management
```javascript
// src/config/resend.js
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY

if (!RESEND_API_KEY) {
  throw new Error(
    'VITE_RESEND_API_KEY not configured. ' +
    'Add to .env.production and restart server.'
  )
}

// Validate key format (should start with re_)
if (!RESEND_API_KEY.startsWith('re_')) {
  throw new Error('Invalid VITE_RESEND_API_KEY format')
}

export { RESEND_API_KEY }
```

### Resend Webhook Setup (Optional)
Resend can send webhooks for email events:

1. Go to Resend Dashboard → Webhooks
2. Create webhook endpoint: `https://solartrack.com/api/webhooks/resend`
3. Subscribe to events:
   - `email.sent`
   - `email.delivered`
   - `email.bounced`
   - `email.complained`

4. Webhook handler:
```javascript
// src/lib/resendWebhookHandler.js
export async function handleResendWebhook(event) {
  const { type, data } = event

  if (type === 'email.sent') {
    await markEmailSent(data.messageId)
  } else if (type === 'email.bounced') {
    await markEmailFailed(data.messageId, 'Email bounced')
  } else if (type === 'email.complained') {
    await unsubscribeEmail(data.email)
  }
}
```

### Rate Limiting Considerations
- Resend free tier: 100 emails/day
- Production tier: Unlimited
- Implement client-side throttling: max 1 email/second
- Queue system handles batch operations

---

## 3. SUPABASE PRODUCTION SETUP

### Database Connection Pooling

#### Pgbouncer Configuration
```ini
# /etc/pgbouncer/pgbouncer.ini
[databases]
prod_db = host=prod-db.supabase.co port=6543 dbname=solartrack

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 100
max_user_connections = 100
```

#### Connection String
```
postgresql://user:password@prod-db.supabase.co:6543/solartrack?sslmode=require&application_name=solartrack_prod
```

### Row Level Security (RLS) Configuration

Verify RLS policies in production:

```sql
-- Check RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'email%';

-- Expected output:
-- tablename          | rowsecurity
-- email_notifications | t

-- Check specific policies
SELECT * FROM pg_policies 
WHERE tablename = 'email_notifications';
```

### Recommended RLS Policies
```sql
-- Only users can see their own email notifications
CREATE POLICY "Users see own emails"
ON email_notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only authenticated users can insert
CREATE POLICY "Users create emails"
ON email_notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY "Users update own emails"
ON email_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
```

### Backup Strategy
```bash
# Daily backup (Supabase handles automatic backups)
# But also set up manual backups:

# Export data weekly
pg_dump \
  postgres://user:password@db.supabase.co/solartrack \
  --format=custom \
  > backup-$(date +%Y%m%d).dump

# Restore from backup
pg_restore \
  --host=localhost \
  --username=postgres \
  --dbname=solartrack_local \
  backup-20260416.dump
```

---

## 4. SSL/TLS CONFIGURATION

### Certificate Setup
```bash
# Using Let's Encrypt with Certbot
sudo certbot certonly \
  --standalone \
  -d solartrack.com \
  -d app.solartrack.com \
  -d api.solartrack.com

# Certificate location
# /etc/letsencrypt/live/solartrack.com/fullchain.pem
# /etc/letsencrypt/live/solartrack.com/privkey.pem
```

### NGINX SSL Configuration
```nginx
upstream app {
  server localhost:3000;
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name solartrack.com app.solartrack.com;
  return 301 https://$server_name$request_uri;
}

# HTTPS configuration
server {
  listen 443 ssl http2;
  server_name solartrack.com app.solartrack.com;

  # SSL certificates
  ssl_certificate /etc/letsencrypt/live/solartrack.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/solartrack.com/privkey.pem;

  # SSL configuration (A+ rating)
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;
  ssl_session_cache shared:SSL:10m;
  ssl_session_timeout 10m;

  # HSTS header
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  # Proxy to application
  location / {
    proxy_pass http://app;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

### Certificate Renewal
```bash
# Automatic renewal with cron
0 3 * * * certbot renew --quiet

# Or use certbot timer (systemd)
systemctl enable certbot-renew.timer
systemctl start certbot-renew.timer
```

---

## 5. CORS CONFIGURATION

### API CORS Setup
```javascript
// src/lib/corsConfig.js
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? [
      'https://solartrack.com',
      'https://app.solartrack.com',
      'https://api.solartrack.com'
    ]
  : ['http://localhost:5173', 'http://localhost:3000']

export function setCORSHeaders(request) {
  const origin = request.headers.origin
  
  if (ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '3600'
    }
  }
  
  return {}
}
```

### Supabase CORS Configuration
In Supabase Dashboard:
1. Settings → API Configuration
2. Add allowed origins:
   - https://solartrack.com
   - https://app.solartrack.com

### Third-party Service CORS
- **Resend API**: CORS not required (server-to-server)
- **Supabase**: CORS configured automatically
- **CDN**: Configure CORS headers on static assets

---

## 6. DATABASE INITIALIZATION

### Create Email Notifications Table
```sql
-- Create table
CREATE TABLE email_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  template_vars JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  message_id TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX idx_email_notifications_project_id ON email_notifications(project_id);
CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_recipient ON email_notifications(recipient_email);
CREATE INDEX idx_email_notifications_created_at ON email_notifications(created_at DESC);
CREATE INDEX idx_email_notifications_scheduled_at ON email_notifications(scheduled_at);

-- Enable RLS
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users see own email notifications"
ON email_notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users create email notifications"
ON email_notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own email notifications"
ON email_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
```

### Verify Table Creation
```bash
# Connect to production database
psql postgres://user:password@prod-db.supabase.co/solartrack

# Verify table exists
\dt email_notifications

# Verify indexes
\di email_notifications*

# Verify RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'email_notifications';
```

---

## 7. MONITORING & LOGGING SETUP

### Application Logging
```javascript
// src/lib/logger.js
const LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'info'

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
}

export function log(level, message, data = {}) {
  if (levels[level] <= levels[LOG_LEVEL]) {
    const timestamp = new Date().toISOString()
    const logEntry = { timestamp, level, message, data }
    
    if (level === 'error') {
      console.error(logEntry)
      // Send to error tracking service
      sendToSentry(logEntry)
    } else {
      console.log(logEntry)
    }
  }
}
```

### Email Service Logging
```javascript
// src/lib/emailService.js
export async function sendEmailViaResend(to, subject, htmlBody, emailType) {
  try {
    log('info', `Sending ${emailType} email to ${to}`)
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html: htmlBody })
    })

    const data = await response.json()
    log('info', `Email sent: ${data.id}`)
    
    return { success: true, messageId: data.id }
  } catch (error) {
    log('error', `Failed to send email: ${error.message}`)
    return { success: false, error: error.message }
  }
}
```

---

## 8. SECURITY HARDENING

### Environment Variable Security
```bash
# Never commit .env files
echo ".env.production" >> .gitignore

# File permissions (production server)
chmod 600 /prod/.env.production
chmod 700 /prod/

# No read permission for others
ls -la /prod/.env.production
# -rw------- 1 app app 512 Apr 16 10:00 .env.production
```

### API Key Rotation
```bash
# Resend key rotation schedule: every 90 days
# Supabase key rotation: every 6 months

# Steps to rotate Resend key:
1. Generate new API key in Resend Dashboard
2. Update VITE_RESEND_API_KEY in production env
3. Verify old key still works (for 24 hours)
4. Disable old key
5. Monitor for errors

# Verify key usage
curl -H "Authorization: Bearer $VITE_RESEND_API_KEY" \
  https://api.resend.com/emails
```

---

## 9. CONFIGURATION VALIDATION

### Pre-Production Checklist
```bash
#!/bin/bash

echo "=== Production Configuration Validation ==="

# Check environment variables
check_env() {
  if [ -z "${!1}" ]; then
    echo "ERROR: $1 not set"
    return 1
  fi
  echo "OK: $1 configured"
  return 0
}

check_env VITE_SUPABASE_URL
check_env VITE_SUPABASE_ANON_KEY
check_env VITE_RESEND_API_KEY
check_env VITE_EMAIL_FROM

# Test Supabase connection
echo ""
echo "Testing Supabase connection..."
curl -s https://${SUPABASE_URL}/rest/v1/ \
  -H "Authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" | jq '.'

# Test Resend API
echo ""
echo "Testing Resend API..."
curl -s https://api.resend.com/emails \
  -H "Authorization: Bearer ${VITE_RESEND_API_KEY}" \
  -X GET | jq '.message'

echo ""
echo "=== Validation Complete ==="
```

---

**Last Updated:** 2026-04-16
