# SolarTrack Pro Logging System Guide

## Overview

The SolarTrack Pro logging system provides comprehensive, production-safe logging with structured data, sensitive data redaction, error tracking, and local storage capabilities.

### Key Features

- **Structured Logging**: Context-aware logging with user, feature, URL, and custom data
- **Log Levels**: DEBUG, INFO, WARN, ERROR with configurable filtering
- **Sensitive Data Redaction**: Automatic redaction of passwords, tokens, API keys, credit cards, and SSNs
- **Error Tracking**: Integration with Sentry (optional) with error categorization
- **Local Storage**: Persistent error/warning logs with rotation policy (keep 50 latest)
- **Non-Intrusive**: Minimal code changes required for integration
- **Production-Safe**: No PII leakage, automatic cleanup, optimized output

## Architecture

```
src/lib/
├── logger.js                 # Main Logger class, log levels, redaction
├── errorTracking.js          # Error categorization, Sentry integration
└── storage/
    └── logStorage.js         # Local storage, log rotation, export
```

## Getting Started

### Basic Usage

```javascript
import { logger } from '@/lib/logger'

// Simple logging
logger.info('User logged in', { userId: 'user123' })
logger.warn('Slow API response', { duration: 5000 })
logger.error('Failed to save project', { error: 'Database error' })

// With context
logger.setContext({
  userId: 'user123',
  feature: 'dashboard',
  url: window.location.pathname
})

logger.info('Dashboard loaded')
// Automatically includes context in the log
```

### Log Levels

| Level | Usage | Storage | Console |
|-------|-------|---------|---------|
| **DEBUG** | Development only | ❌ No | ✅ Dev only |
| **INFO** | General info | ❌ No | ✅ All |
| **WARN** | Warnings, recoverable issues | ✅ Yes | ✅ All |
| **ERROR** | Errors, failures | ✅ Yes | ✅ All |

```javascript
// Set log level
logger.setLevel('DEBUG')  // Development
logger.setLevel('INFO')   // Production (default)
logger.setLevel('ERROR')  // Only errors
```

## Context Management

Context provides consistent metadata across all logs in a session or feature.

### Global Context

```javascript
// Set once, applies to all subsequent logs
logger.setContext({
  userId: 'user123',
  email: 'user@example.com',
  feature: 'projects',
  url: '/dashboard/projects'
})

logger.info('Filters applied')
// Log includes: userId, email, feature, url, timestamp, sessionId
```

### Child Loggers

Create isolated loggers with additional context:

```javascript
const dashboardLogger = logger.child({
  feature: 'dashboard',
  component: 'revenue-chart'
})

dashboardLogger.info('Data loaded', { recordCount: 150 })
// Includes parent context + dashboard + component context
```

### Dynamic Context

```javascript
logger.setContext({
  userId: currentUser.id,
  userEmail: currentUser.email
})

// Later: update without losing other context
logger.setContext({
  projectId: project.id // userId and userEmail preserved
})

// Clear when needed
logger.clearContext()
```

## Sensitive Data Redaction

Automatically redacts:
- Passwords (`password`, `passwd`, `pwd`)
- API Keys (`apiKey`, `api_key`, `apikey`)
- Tokens (`token`, `Bearer tokens`)
- Secrets (`secret`, `secretKey`)
- Credit Cards (`4111-1111-1111-1111`)
- SSNs (`123-45-6789`)

### Examples

```javascript
// Automatic redaction - no special handling needed
logger.error('Login failed', {
  username: 'john@example.com',
  password: 'myPassword123',  // ❌ REDACTED
  token: 'jwt_xyz...'          // ❌ REDACTED
})

// All sensitive patterns are detected
const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  creditCard: '4111-1111-1111-1111',  // ❌ REDACTED
  ssn: '123-45-6789'                   // ❌ REDACTED
}

logger.warn('Payment error', userData)
// Logs only: name, email, [CARD_REDACTED], [SSN_REDACTED]
```

## Error Handling

### Logging Exceptions

```javascript
try {
  await fetchProjectData()
} catch (error) {
  logger.exception(error, {
    feature: 'dashboard',
    action: 'fetchProjectData'
  })
}
// Automatically captures: message, stack, name, context
// Sends to Sentry in production
```

### Error Categorization

Errors are automatically categorized:

```
NETWORK      - Network failures, timeouts, CORS
VALIDATION   - Input validation failures
AUTH         - Authentication/authorization issues
DATABASE     - Database queries, constraints
APP_ERROR    - JavaScript errors (TypeError, ReferenceError)
UNKNOWN      - Other errors
```

### Creating Error Context

```javascript
errorTracking.setUserContext(userId, {
  email: user.email,
  role: user.role
})

try {
  // risky operation
} catch (error) {
  errorTracking.captureException(error, {
    extra: { projectId, estimateId },
    contexts: { feature: 'estimates' }
  })
}
```

## Log Storage & Export

### Local Storage

Error and warning logs are stored locally (last 50 entries):

```javascript
// Get all stored logs
const logs = logger.exportLogs()
// Returns array of log objects with timestamps

// Get statistics
const stats = logger.getStats()
// { totalLogs, errors, warnings, byFeature, byUser, storageSize }

// Clear logs
logger.clearLogs()
```

### Querying Logs

```javascript
// Query by filters
const errorLogs = logStorage.queryLogs({
  level: 'ERROR'
})

const userLogs = logStorage.queryLogs({
  userId: 'user123',
  startDate: '2024-04-01',
  endDate: '2024-04-30'
})

const featureLogs = logStorage.queryLogs({
  feature: 'dashboard',
  search: 'failed'
})
```

### Exporting Data

```javascript
// Export as JSON
const logs = logStorage.exportLogs()
console.log(JSON.stringify(logs, null, 2))

// Export as CSV (for Excel)
const csv = logStorage.exportAsCSV()

// Download to computer
logStorage.downloadLogs('json')  // JSON file
logStorage.downloadLogs('csv')   // CSV file
```

## Sentry Integration (Optional)

### Setup

1. Install Sentry SDK:
```bash
npm install @sentry/react @sentry/tracing
```

2. Add Sentry DSN to environment:
```env
VITE_SENTRY_DSN=https://your-key@sentry.io/123456
VITE_APP_VERSION=0.1.0
```

3. Include Sentry script in HTML:
```html
<script src="https://browser.sentry-cdn.com/7.x/bundle.min.js"></script>
```

### Features

- Automatic error capture in production
- User context tracking
- Breadcrumb recording
- Release version tracking
- Environment labeling

### Usage

```javascript
import { errorTracking } from '@/lib/errorTracking'

// Track user
errorTracking.setUserContext('user123', {
  email: 'user@example.com',
  role: 'admin'
})

// Add breadcrumbs for context
errorTracking.addBreadcrumb('User clicked save button', { 
  projectId: 'proj123' 
})

// Capture errors
errorTracking.captureError('Failed to save', {
  extra: { projectId: 'proj123' }
})
```

## Integration Patterns

### Service Integration

When integrating logger into a service:

```javascript
import { logger } from '@/lib/logger'

export async function fetchProjectData(projectId) {
  const serviceLogger = logger.child({ feature: 'projects' })
  
  try {
    serviceLogger.debug('Fetching project data', { projectId })
    
    const response = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
    
    if (response.error) throw response.error
    
    serviceLogger.info('Project data fetched', {
      projectId,
      recordCount: response.data.length
    })
    
    return response.data
  } catch (error) {
    serviceLogger.exception(error, {
      projectId,
      action: 'fetchProjectData'
    })
    throw error
  }
}
```

### React Component Integration

```javascript
import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

export function DashboardComponent({ userId, feature }) {
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    // Set context for component
    logger.setContext({
      userId,
      feature,
      component: 'DashboardComponent',
      url: window.location.pathname
    })
    
    logger.info('Component mounted')
    
    return () => {
      logger.info('Component unmounted')
    }
  }, [userId, feature])
  
  const handleAction = async () => {
    try {
      setLoading(true)
      logger.debug('Action started')
      
      // perform action
      
      logger.info('Action completed successfully')
    } catch (error) {
      logger.exception(error, { action: 'handleAction' })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <button onClick={handleAction} disabled={loading}>
      Perform Action
    </button>
  )
}
```

### API Call Integration

```javascript
async function apiCall(endpoint, method = 'GET', body = null) {
  const apiLogger = logger.child({ feature: 'api' })
  
  const startTime = performance.now()
  
  try {
    apiLogger.debug('API call started', {
      endpoint,
      method,
      bodySize: body ? JSON.stringify(body).length : 0
    })
    
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : null
    })
    
    const duration = performance.now() - startTime
    
    if (!response.ok) {
      apiLogger.warn('API call failed', {
        endpoint,
        status: response.status,
        duration
      })
      throw new Error(`API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    apiLogger.debug('API call succeeded', {
      endpoint,
      duration,
      responseSize: JSON.stringify(data).length
    })
    
    return data
  } catch (error) {
    const duration = performance.now() - startTime
    apiLogger.exception(error, {
      endpoint,
      duration
    })
    throw error
  }
}
```

## Best Practices

### ✅ Do's

- Set context at session/feature start
- Use child loggers for feature-specific logging
- Log at appropriate levels (WARN/ERROR stored)
- Include relevant IDs (userId, projectId, etc.)
- Log important transitions (start, success, failure)
- Redaction happens automatically

### ❌ Don'ts

- Don't log sensitive data directly - it's auto-redacted
- Don't log passwords, tokens, or API keys
- Don't add PII outside what's needed for debugging
- Don't log every single operation (use DEBUG level)
- Don't ignore exceptions

### Context Guidelines

```javascript
// GOOD: Relevant context
logger.setContext({
  userId: currentUser.id,
  feature: 'estimates',
  projectId: project.id
})

// TOO MUCH: Excessive context
logger.setContext({
  userId: currentUser.id,
  firstName: currentUser.firstName,
  lastName: currentUser.lastName,
  email: currentUser.email,
  phone: currentUser.phone,
  // ... way too much personal info
})

// BAD: Missing context
logger.info('Saved')  // What was saved? By whom?

// GOOD: Contextual message
logger.info('Estimate saved', {
  estimateId: estimate.id,
  itemCount: estimate.items.length
})
```

## Monitoring in Production

### Accessing Logs

1. **Browser DevTools**:
   - Open Console tab
   - Logs appear with color coding
   - Search functionality available

2. **Local Storage**:
   - Logs stored in browser's local storage
   - Key: `solartrack_logs`
   - Download via `logStorage.downloadLogs('json')`

3. **Sentry Dashboard** (if configured):
   - Real-time error monitoring
   - User tracking
   - Release tracking
   - Performance monitoring

### Debugging Workflows

```javascript
// 1. Check recent logs
const recentLogs = logStorage.exportLogs()
console.table(recentLogs)

// 2. Get statistics
const stats = logStorage.getStats()
console.log('Log Statistics:', stats)

// 3. Query specific errors
const errors = logStorage.queryLogs({
  level: 'ERROR',
  feature: 'dashboard'
})
console.table(errors)

// 4. Download for analysis
logStorage.downloadLogs('csv')
```

## Performance Considerations

- **Log Level Filtering**: Prevents unnecessary processing
- **Automatic Cleanup**: Removes old logs after 24 hours
- **Storage Limit**: Keeps only last 50 logs to prevent bloat
- **Async Sentry**: Won't block application
- **Efficient Redaction**: Uses regex caching

## Security

- Passwords and tokens are redacted automatically
- No sensitive data sent to client-side logging
- Sentry integration respects privacy settings
- Local storage is isolated per domain
- Logs cleared on logout recommended

## Troubleshooting

### Logs not appearing in console

```javascript
// Check current log level
console.log(logger.currentLevel)

// Set to DEBUG to see all logs
logger.setLevel('DEBUG')
```

### Storage quota exceeded

```javascript
// Check storage size
const stats = logStorage.getStats()
console.log(stats.storageSize)

// Clear old logs
logStorage.clearLogs()

// Reduce max logs
logStorage.setMaxLogs(20)
```

### Sensitive data appearing in logs

- Redaction patterns are checked automatically
- Verify data is using expected field names (password, token, apiKey, etc.)
- For custom sensitive fields, implement custom redaction

## Testing

Run tests with:

```bash
npm test -- src/lib/logger.test.js
```

Tests cover:
- Log level filtering
- Context management
- Sensitive data redaction
- Error categorization
- Local storage
- Integration scenarios

## Maintenance

- Review logs weekly for patterns
- Monitor storage usage
- Update redaction patterns for new sensitive fields
- Keep Sentry SDK updated
- Archive logs periodically
