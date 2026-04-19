# Logging System Quick Reference

## Import
```javascript
import { logger } from '@/lib/logger'
import { logStorage } from '@/lib/storage/logStorage'
import { errorTracking } from '@/lib/errorTracking'
```

## Basic Logging

```javascript
// Simple messages
logger.debug('Variable value')      // DEBUG: Dev only
logger.info('Operation complete')   // INFO: Informational
logger.warn('Slow API call')        // WARN: Stored & shown
logger.error('Operation failed')    // ERROR: Stored & shown

// With data
logger.info('User action', {
  userId: 'user123',
  action: 'saveProject',
  duration: 350
})

// With exception
try {
  riskyOperation()
} catch (error) {
  logger.exception(error, {
    operation: 'riskyOperation',
    userId: 'user123'
  })
}
```

## Context Management

```javascript
// Set global context (persists across logs)
logger.setContext({
  userId: currentUser.id,
  feature: 'dashboard',
  url: window.location.pathname
})

// Create feature-specific logger
const featureLogger = logger.child({
  feature: 'projects',
  component: 'ProjectForm'
})

// Child inherits parent context + adds its own
featureLogger.info('Project saved')

// Get current context
const context = logger.getContext()

// Clear context
logger.clearContext()
```

## Log Levels

```javascript
// Set log level
logger.setLevel('DEBUG')   // Show all (dev)
logger.setLevel('INFO')    // Show info+
logger.setLevel('WARN')    // Show warn+
logger.setLevel('ERROR')   // Show error only

// What's stored locally
// DEBUG:  ❌ Not stored
// INFO:   ❌ Not stored
// WARN:   ✅ Stored (last 50)
// ERROR:  ✅ Stored (last 50)
```

## Service Integration Pattern

```javascript
import { logger } from '@/lib/logger'

export async function serviceFunction(params) {
  // 1. Create logger
  const logger = logger.child({
    feature: 'serviceName',
    action: 'functionName'
  })

  // 2. Log entry
  logger.debug('Starting', { param1: params.value })

  try {
    // 3. Do work
    const result = await doWork(params)

    // 4. Log success
    logger.info('Success', {
      resultId: result.id,
      recordCount: result.length
    })

    return result
  } catch (error) {
    // 5. Log exception
    logger.exception(error, {
      param1: params.value,
      errorType: error.name
    })
    throw error
  }
}
```

## Sensitive Data (Auto-Redacted)

```javascript
// These are AUTOMATICALLY redacted, no special handling needed:
logger.warn('Failed login', {
  email: 'user@example.com',           // ✅ Safe
  password: 'myPassword123',           // ❌ REDACTED
  token: 'eyJhbGciOiJIUzI1NiI...',    // ❌ REDACTED
  apiKey: 'sk_live_abc123xyz',         // ❌ REDACTED
  creditCard: '4111-1111-1111-1111',   // ❌ [CARD_REDACTED]
  ssn: '123-45-6789'                   // ❌ [SSN_REDACTED]
})
```

## Storing & Exporting Logs

```javascript
// Get all stored logs
const logs = logger.exportLogs()

// Get statistics
const stats = logger.getStats()
console.log(stats)
// {
//   totalLogs: 42,
//   errors: 15,
//   warnings: 27,
//   byFeature: { dashboard: 20, projects: 22 },
//   byUser: { user123: 30, user456: 12 },
//   oldestLog: {...},
//   newestLog: {...},
//   storageSize: 25000
// }

// Query logs
const errorLogs = logStorage.queryLogs({
  level: 'ERROR'
})

const userLogs = logStorage.queryLogs({
  userId: 'user123',
  startDate: '2024-04-01',
  endDate: '2024-04-30'
})

// Download
logStorage.downloadLogs('json')  // Download as JSON
logStorage.downloadLogs('csv')   // Download as CSV

// Clear
logger.clearLogs()
logStorage.clearLogs()
```

## Error Categorization

```javascript
import { errorTracking, ERROR_CATEGORIES } from '@/lib/errorTracking'

const error = new Error('Network timeout')
const category = errorTracking.categorizeError(error)
// NETWORK | VALIDATION | AUTH | DATABASE | APP_ERROR | UNKNOWN

// Use in logging
logger.exception(error, {
  category: errorTracking.categorizeError(error)
})
```

## Sentry Integration (Optional)

```javascript
import { errorTracking } from '@/lib/errorTracking'

// Check if enabled
if (errorTracking.isSentryEnabled()) {
  console.log('Sentry is active')
}

// Set user for Sentry
errorTracking.setUserContext('user123', {
  email: 'user@example.com',
  role: 'admin'
})

// Add breadcrumbs
errorTracking.addBreadcrumb('User action', {
  action: 'saveProject',
  projectId: 'proj123'
})

// Manual capture (already done by logger.exception)
errorTracking.captureException(error, {
  extra: { context: 'data' }
})
```

## Component Integration

```javascript
import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export function MyComponent({ userId }) {
  useEffect(() => {
    // Set context on mount
    logger.setContext({
      userId,
      feature: 'myComponent',
      url: window.location.pathname
    })

    logger.info('Component mounted')

    // Cleanup
    return () => {
      logger.info('Component unmounted')
    }
  }, [userId])

  const handleClick = async () => {
    try {
      logger.debug('Action started')
      await doAction()
      logger.info('Action succeeded')
    } catch (error) {
      logger.exception(error, { action: 'handleClick' })
    }
  }

  return <button onClick={handleClick}>Action</button>
}
```

## Debugging in Browser

```javascript
// In DevTools Console:

// View logs
logger.exportLogs()
// -> [{ timestamp, level, message, context, ... }, ...]

// View in table
console.table(logger.exportLogs())

// Get stats
logger.getStats()

// Query specific
logStorage.queryLogs({ level: 'ERROR' })

// Download
logStorage.downloadLogs('json')
```

## Common Mistakes

❌ **DON'T:**
```javascript
// Don't log passwords directly
logger.info('Login', { password: 'secret' })  // ❌ Redacted

// Don't ignore errors
try {
  riskyOp()
} catch (e) {
  // ❌ No logging
}

// Don't use string concat
logger.info('User ' + userId + ' saved')  // ❌

// Don't log everything
logger.debug('Variable is', var)  // ❌ Too verbose
logger.info('tick')  // ❌ Every loop
```

✅ **DO:**
```javascript
// Redaction is automatic
logger.warn('Login failed', {
  email: 'user@example.com',
  password: 'secret'  // ✅ Auto-redacted
})

// Always log exceptions
try {
  riskyOp()
} catch (error) {
  logger.exception(error, { op: 'riskyOp' })  // ✅
}

// Use object parameters
logger.info('User saved', {  // ✅
  userId: user.id,
  timestamp: new Date()
})

// Log meaningful events
logger.info('Project created', {  // ✅
  projectId: proj.id,
  estimateCount: 5
})
```

## Redacted Fields

Automatically redacted:
- `password`, `passwd`, `pwd`
- `token`, `bearer`
- `apikey`, `api_key`, `apiKey`
- `secret`, `secretkey`
- `4111-1111-1111-1111` (credit cards)
- `123-45-6789` (SSN)
- Objects with these keys

## Log Level Defaults

| Env | Default | Dev/Prod |
|-----|---------|----------|
| development | DEBUG | Dev |
| production | INFO | Prod |

## Storage Limits

- **Max logs**: 50 (configurable)
- **Expiry**: 24 hours (configurable)
- **Storage size**: ~10-50KB
- **Key**: `solartrack_logs`

## Performance

- Logging: < 1ms per call
- Redaction: < 50μs
- Query: < 5ms
- Sentry: Non-blocking

## Files

| File | Purpose |
|------|---------|
| logger.js | Main Logger class |
| errorTracking.js | Error tracking & Sentry |
| logStorage.js | Local storage |
| logger.test.js | Tests (run: `npm test`) |
| README.md | API reference |
| LOGGING_GUIDE.md | Complete guide |

## Cheat Sheet

```javascript
// 1. Import
import { logger } from '@/lib/logger'

// 2. Set context
logger.setContext({ userId, feature })

// 3. Use in code
logger.info('Msg', { key: val })

// 4. Handle errors
try { op() } catch (e) { logger.exception(e) }

// 5. Access logs
logger.exportLogs()
logStorage.downloadLogs('json')
```

## Troubleshooting

**Logs not appearing?**
```javascript
logger.setLevel('DEBUG')
console.log(logger.currentLevel)
```

**Storage full?**
```javascript
logger.getStats()
logger.clearLogs()
logStorage.setMaxLogs(20)
```

**Sensitive data showing?**
```javascript
// Check field names - must match patterns
const redacted = logger.redactSensitiveData(data)
```

**Sentry not working?**
```javascript
if (errorTracking.isSentryEnabled()) {
  console.log('Enabled')
} else {
  console.log('Check DSN and SDK')
}
```

## API at a Glance

```javascript
logger.debug(msg, data)
logger.info(msg, data)
logger.warn(msg, data)
logger.error(msg, data)
logger.exception(error, context)
logger.setLevel(level)
logger.setContext(ctx)
logger.getContext()
logger.clearContext()
logger.child(ctx)
logger.redactSensitiveData(data)
logger.exportLogs()
logger.getStats()
logger.clearLogs()

logStorage.addLog(entry)
logStorage.getLogs()
logStorage.exportLogs()
logStorage.queryLogs(filters)
logStorage.exportAsCSV()
logStorage.exportAsJSON()
logStorage.downloadLogs(format)
logStorage.getStats()
logStorage.clearLogs()

errorTracking.setUserContext(id, data)
errorTracking.categorizeError(error)
errorTracking.parseStackTrace(error)
errorTracking.captureException(error, opts)
errorTracking.captureError(msg, opts)
errorTracking.addBreadcrumb(msg, data)
errorTracking.isSentryEnabled()
```

## See Also

- LOGGING_GUIDE.md - Complete documentation
- README.md - API reference and examples
- LOGGING_INTEGRATION_EXAMPLES.md - Service examples
- logger.test.js - Test patterns
- IMPLEMENTATION_CHECKLIST.md - Integration steps
