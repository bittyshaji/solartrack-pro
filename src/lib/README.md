# SolarTrack Pro Logging System

Comprehensive, production-safe logging infrastructure for SolarTrack Pro application.

## Quick Start

```javascript
import { logger } from '@/lib/logger'

// Set context once
logger.setContext({
  userId: 'user123',
  feature: 'dashboard'
})

// Log messages
logger.info('User action', { projectId: 'proj123' })
logger.warn('Slow operation', { duration: 5000 })
logger.error('Operation failed', { error: 'Database error' })

// Catch exceptions
try {
  await riskOperation()
} catch (error) {
  logger.exception(error, { context: 'operation' })
}
```

## System Architecture

```
Logger System
├── Core Logger (logger.js)
│   ├── Log levels (DEBUG, INFO, WARN, ERROR)
│   ├── Context management
│   ├── Sensitive data redaction
│   └── Console output
│
├── Error Tracking (errorTracking.js)
│   ├── Error categorization
│   ├── Stack trace parsing
│   ├── Sentry integration (optional)
│   └── Breadcrumb tracking
│
└── Storage (storage/logStorage.js)
    ├── Local storage persistence
    ├── Log rotation (max 50)
    ├── Cleanup policies
    ├── Export (JSON/CSV)
    └── Query & filtering
```

## Features

### Structured Logging
- Context-aware logging with automatic data attachment
- Child loggers with inherited context
- Timestamp and session tracking

### Security
- Automatic redaction of passwords, tokens, API keys
- Credit card and SSN detection
- No PII leakage in production logs
- Domain extraction instead of full email logging

### Error Management
- Error categorization (network, validation, auth, database, app)
- Stack trace parsing
- Sentry integration for production monitoring
- User context attachment

### Local Storage
- Persistent WARN/ERROR logs (last 50 entries)
- Automatic rotation and cleanup
- 24-hour expiry policy
- Export to JSON or CSV

### Performance
- Minimal overhead
- Efficient redaction
- Non-blocking Sentry sends
- Smart console output in dev mode

## Log Levels

| Level | Usage | Stored | Example |
|-------|-------|--------|---------|
| DEBUG | Development details | ❌ | Variable values, flow tracking |
| INFO | General information | ❌ | Success messages, metrics |
| WARN | Warnings, recoverable issues | ✅ | Validation failures, fallbacks |
| ERROR | Errors, failures | ✅ | Exceptions, critical issues |

## Configuration

### Set Log Level

```javascript
import { logger } from '@/lib/logger'

// Development
logger.setLevel('DEBUG')

// Production
logger.setLevel('INFO')

// Debug specific issues
logger.setLevel('ERROR')
```

### Environment Variables

```env
# .env.local
NODE_ENV=development
VITE_APP_VERSION=0.1.0

# .env.production
VITE_SENTRY_DSN=https://your-key@sentry.io/123456
VITE_APP_VERSION=0.1.0
```

## Usage Examples

### Basic Logging

```javascript
import { logger } from '@/lib/logger'

// Simple log
logger.info('User logged in')

// With data
logger.warn('Rate limit approaching', {
  requests: 450,
  limit: 500,
  window: '1 minute'
})

// With context
logger.setContext({
  userId: currentUser.id,
  email: currentUser.email
})

logger.error('Payment failed', {
  invoiceId: 'inv123',
  amount: 1500,
  reason: 'Card declined'
})
```

### Error Handling

```javascript
try {
  await performRiskyOperation()
} catch (error) {
  logger.exception(error, {
    operationName: 'performRiskyOperation',
    userId: currentUser.id,
    attemptNumber: 1
  })
}
```

### Feature Specific Logging

```javascript
// Create child logger for feature
const dashboardLogger = logger.child({
  feature: 'dashboard',
  component: 'RevenueChart'
})

// Logs automatically include feature context
dashboardLogger.info('Chart rendered', {
  dataPoints: 12,
  duration: 350
})
```

### Sensitive Data Handling

```javascript
// Automatic redaction - no special handling needed
logger.warn('User signup failed', {
  email: 'user@example.com',
  password: 'myPassword123',      // ❌ REDACTED
  apiKey: 'sk_live_abc123xyz',    // ❌ REDACTED
  creditCard: '4111-1111-1111-1111' // ❌ REDACTED
})

// Logs show: [REDACTED] for sensitive values
```

### Accessing Stored Logs

```javascript
import { logStorage } from '@/lib/storage/logStorage'

// Get all logs
const logs = logStorage.exportLogs()

// Get statistics
const stats = logStorage.getStats()
console.log(`Total errors: ${stats.errors}`)
console.log(`Total warnings: ${stats.warnings}`)

// Query with filters
const errorLogs = logStorage.queryLogs({
  level: 'ERROR',
  feature: 'dashboard',
  startDate: '2024-04-01',
  endDate: '2024-04-30'
})

// Download
logStorage.downloadLogs('json')
logStorage.downloadLogs('csv')

// Clear
logStorage.clearLogs()
```

## Integration Guide

### Service Integration

```javascript
import { logger } from '@/lib/logger'
import { errorTracking } from '@/lib/errorTracking'

export async function fetchData(userId, params) {
  // Create feature-specific logger
  const featureLogger = logger.child({
    feature: 'dataFetch',
    userId
  })

  featureLogger.debug('Starting fetch', params)

  try {
    const startTime = performance.now()
    const result = await performFetch(params)
    const duration = performance.now() - startTime

    featureLogger.info('Fetch succeeded', {
      recordCount: result.length,
      duration: Math.round(duration)
    })

    return result
  } catch (error) {
    featureLogger.exception(error, {
      userId,
      params: safeParams(params),
      errorCategory: errorTracking.categorizeError(error)
    })
    throw error
  }
}
```

### React Component Integration

```javascript
import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export function MyComponent({ userId, feature }) {
  useEffect(() => {
    logger.setContext({
      userId,
      feature,
      url: window.location.pathname
    })

    logger.debug('Component mounted')

    return () => {
      logger.debug('Component unmounted')
    }
  }, [userId, feature])

  const handleAction = async () => {
    try {
      logger.debug('Action started')
      await performAction()
      logger.info('Action completed')
    } catch (error) {
      logger.exception(error, { action: 'handleAction' })
    }
  }

  return <button onClick={handleAction}>Action</button>
}
```

## Monitoring & Debugging

### Browser DevTools

```javascript
// View logs in console
logger.debug('This appears colored in dev mode')

// Search console
// Filter by log level, feature, userId, etc.
```

### Local Storage Inspection

```javascript
// Check storage key
localStorage.getItem('solartrack_logs')

// View with logger
const logs = logger.exportLogs()
console.table(logs)
```

### Log Export for Analysis

```javascript
// Export as JSON
const exported = logger.exportLogs()
const json = JSON.stringify(exported, null, 2)

// Export as CSV
const csv = logStorage.exportAsCSV()

// Download
logStorage.downloadLogs('json')
```

### Sentry Integration

If Sentry is configured:

```javascript
import { errorTracking } from '@/lib/errorTracking'

// Check if enabled
if (errorTracking.isSentryEnabled()) {
  console.log('Sentry is active')
}

// Set user for Sentry
errorTracking.setUserContext(userId, {
  email: user.email,
  role: user.role
})

// Add breadcrumbs
errorTracking.addBreadcrumb('User action', {
  action: 'saveProject',
  projectId: 'proj123'
})
```

## Best Practices

### ✅ Recommended

1. **Set context early** - At app/page/component load
2. **Use child loggers** - For feature-specific logging
3. **Include IDs** - userId, projectId, customerId for auditing
4. **Log metrics** - Record counts, durations, amounts
5. **Handle exceptions** - Use logger.exception() for errors
6. **Redaction automatic** - Trust the system with sensitive data

### ❌ Avoid

1. **Logging every operation** - Use DEBUG level for verbose logs
2. **Excessive context** - Only relevant fields
3. **Passwords/tokens** - Automatically redacted
4. **PII outside context** - Phone numbers, addresses in logs
5. **Silent failures** - Always log exceptions
6. **String concatenation** - Use object parameters

## Testing

```bash
# Run logger tests
npm test -- src/lib/logger.test.js

# Test coverage
npm test -- --coverage src/lib/logger.test.js
```

### Test Coverage
- Log level filtering
- Context management
- Sensitive data redaction
- Error categorization
- Storage persistence
- Query filtering
- Export functionality
- Integration scenarios

## Performance Metrics

- **Logging overhead**: < 1ms per log
- **Redaction cost**: < 50μs for typical data
- **Storage query**: < 5ms for 50 logs
- **Sentry send**: Non-blocking, async

## Troubleshooting

### Logs not appearing

```javascript
// Check log level
console.log(logger.currentLevel)

// Set to DEBUG
logger.setLevel('DEBUG')

// Check localStorage
console.log(localStorage.getItem('solartrack_logs'))
```

### Storage quota exceeded

```javascript
// Check size
const stats = logStorage.getStats()
console.log(stats.storageSize)

// Clear old logs
logStorage.clearLogs()

// Reduce limit
logStorage.setMaxLogs(20)
```

### Sensitive data in logs

```javascript
// Redaction happens automatically
// Check field names match patterns:
// - password, token, apiKey, secret, etc.

// For custom fields, verify:
const redacted = logger.redactSensitiveData({
  customField: 'sensitive_value'
})
```

## Security Considerations

- **Auto-redaction**: Passwords, tokens, API keys, SSNs, credit cards
- **Context control**: Don't add unnecessary PII
- **Local storage**: Browser-specific, not synced
- **Sentry**: Only in production with proper DSN
- **Export**: Ensure recipients are trusted

## Files

```
src/lib/
├── logger.js              # Main Logger class
├── errorTracking.js       # Error categorization & Sentry
├── logger.test.js         # Comprehensive test suite
├── storage/
│   └── logStorage.js      # Local persistence
├── README.md              # This file
└── LOGGING_INTEGRATION_EXAMPLES.md  # Service examples

docs/
└── LOGGING_GUIDE.md       # Detailed documentation
```

## API Reference

### Logger

```javascript
import { logger, LOG_LEVELS } from '@/lib/logger'

logger.setLevel(level)              // Set log level
logger.setContext(context)          // Set global context
logger.getContext()                 // Get current context
logger.clearContext()               // Clear context
logger.child(context)               // Create child logger

logger.debug(msg, data, context)    // DEBUG level
logger.info(msg, data, context)     // INFO level
logger.warn(msg, data, context)     // WARN level
logger.error(msg, data, context)    // ERROR level
logger.exception(error, context)    // Exception handling

logger.redactSensitiveData(data)    // Manual redaction
logger.formatLog(level, msg, context)  // Format log entry
logger.exportLogs()                 // Get all stored logs
logger.getStats()                   // Get statistics
logger.clearLogs()                  // Clear all logs
```

### Error Tracking

```javascript
import { errorTracking, ERROR_CATEGORIES } from '@/lib/errorTracking'

errorTracking.setUserContext(userId, data)
errorTracking.clearUserContext()
errorTracking.categorizeError(error)
errorTracking.parseStackTrace(error)
errorTracking.addBreadcrumb(msg, data, level)
errorTracking.captureException(error, options)
errorTracking.captureError(message, options)
errorTracking.captureWarning(message, options)
errorTracking.createErrorReport(error, context)
errorTracking.isSentryEnabled()
errorTracking.getSentry()
```

### Log Storage

```javascript
import { logStorage } from '@/lib/storage/logStorage'

logStorage.addLog(logEntry)
logStorage.getLogs()
logStorage.exportLogs()
logStorage.exportAsCSV()
logStorage.exportAsJSON()
logStorage.downloadLogs(format)
logStorage.clearLogs()
logStorage.queryLogs(filters)
logStorage.getStats()
logStorage.getStorageSize()
logStorage.cleanup()
logStorage.setMaxLogs(max)
logStorage.setLogExpiry(ms)
```

## Contributing

When adding logging to services:

1. Import logger at module top
2. Create child logger at function start
3. Log entry with parameters
4. Log success with metrics
5. Use exception for error handling
6. Avoid logging sensitive data
7. Write tests for error paths

## License

Part of SolarTrack Pro
