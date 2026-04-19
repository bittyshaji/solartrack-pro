# ADR-007: Structured Logging Strategy

**Status:** Accepted  
**Date:** March 2024

## Context

Debugging production issues was difficult due to:

- Inconsistent console.log statements
- No structured logging format
- No log levels or filtering
- No context/correlation IDs for tracing
- Difficulty tracking user actions
- No centralized logging destination

## Decision

Implement structured logging with:
- Standardized log format
- Multiple log levels
- Request correlation IDs
- Contextual metadata
- Centralized logging service

## Rationale

### Logger Implementation

```javascript
// /src/lib/logger/index.js
class Logger {
  constructor(name) {
    this.name = name
    this.context = {}
  }
  
  setContext(context) {
    this.context = { ...this.context, ...context }
  }
  
  log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      logger: this.name,
      message,
      ...this.context,
      ...data,
    }
    
    // Console output in development
    if (import.meta.env.DEV) {
      console[level === 'error' ? 'error' : 'log'](logEntry)
    }
    
    // Send to monitoring service in production
    if (import.meta.env.PROD && level === 'error') {
      this.sendToMonitoring(logEntry)
    }
  }
  
  info(message, data) {
    this.log('info', message, data)
  }
  
  warn(message, data) {
    this.log('warn', message, data)
  }
  
  error(message, data) {
    this.log('error', message, data)
  }
  
  debug(message, data) {
    if (import.meta.env.DEV) {
      this.log('debug', message, data)
    }
  }
  
  sendToMonitoring(logEntry) {
    fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry),
    }).catch(() => {}) // Silently fail
  }
}

// Create logger instance
export const createLogger = (name) => new Logger(name)
```

### Usage Pattern

```javascript
// In modules
const logger = createLogger('ProjectService')

export class ProjectService {
  static async getProjects(filters) {
    logger.info('Fetching projects', { filters })
    
    try {
      const projects = await supabase
        .from('projects')
        .select('*')
        .match(filters)
      
      logger.info('Projects fetched successfully', {
        count: projects.length,
        duration: Date.now() - startTime,
      })
      
      return projects
    } catch (error) {
      logger.error('Failed to fetch projects', {
        error: error.message,
        filters,
      })
      throw error
    }
  }
}

// In components
function ProjectList() {
  const logger = useLogger('ProjectList')
  const [projects, setProjects] = useState([])
  
  useEffect(() => {
    logger.info('Component mounted')
    
    return () => {
      logger.info('Component unmounted')
    }
  }, [])
  
  async function handleFilterChange(newFilters) {
    logger.info('Filters changed', { newFilters })
    // ... fetch with new filters
  }
}
```

### Request Correlation IDs

```javascript
// Middleware to add correlation ID to all requests
export function addCorrelationId(config) {
  const correlationId = generateId()
  config.headers['X-Correlation-ID'] = correlationId
  
  // Add to all logger context
  globalLoggerContext.correlationId = correlationId
  
  return config
}

// Logger automatically includes correlation ID
logger.info('API call', { endpoint: '/projects' })
// Output: { ..., correlationId: 'abc123', endpoint: '/projects' }
```

### Log Levels

| Level | Use Case | Environment |
|-------|----------|-------------|
| DEBUG | Detailed debugging info | Dev only |
| INFO | General info, state changes | Dev + Prod |
| WARN | Warnings, deprecated usage | Dev + Prod |
| ERROR | Errors, exceptions | Dev + Prod |

### Performance Timing

```javascript
// Log performance metrics
const startTime = performance.now()

const projects = await ProjectService.getProjects()

const duration = performance.now() - startTime
logger.info('Projects loaded', {
  duration,
  count: projects.length,
  slow: duration > 1000, // Flag slow operations
})
```

### User Action Tracking

```javascript
// Log user actions for analytics
function useUserAction(actionName) {
  const { user } = useAuth()
  const logger = useLogger('UserActions')
  
  return (data) => {
    logger.info('User action', {
      action: actionName,
      userId: user.id,
      ...data,
    })
  }
}

// Usage
function ProjectForm() {
  const trackAction = useUserAction('project_created')
  
  async function handleSubmit(formData) {
    try {
      const project = await ProjectService.create(formData)
      trackAction({ projectId: project.id, success: true })
    } catch (error) {
      trackAction({ success: false, error: error.message })
      throw error
    }
  }
}
```

### Log Destinations

**Development:**
- Browser console
- VS Code integrated terminal

**Production:**
- Application Performance Monitoring (APM) service
- Centralized logging service (e.g., ELK, Datadog)
- Error tracking (Sentry)

### Log Retention Policy

```
Console logs (dev):     Not stored
Info/Warn (prod):       30 days
Error (prod):           90 days
Performance metrics:    7 days
User actions:           30 days
```

## Consequences

### Positive

- Easy debugging in production
- Track user actions and behavior
- Performance monitoring
- Error pattern identification
- Audit trail for compliance
- Correlation ID helps with distributed tracing

### Negative

- Additional code in modules
- Performance overhead of logging
- Privacy concerns with user data logging
- Storage costs for logs

## Best Practices

1. **Don't log sensitive data**
   - Never log passwords, tokens, SSNs
   - Sanitize PII (email addresses, phone numbers)

2. **Use appropriate log levels**
   - DEBUG: Detailed state info
   - INFO: Important events
   - WARN: Unexpected but recoverable
   - ERROR: Failures that need attention

3. **Include context**
   - Log related IDs (userId, projectId, etc.)
   - Include relevant metrics
   - Add timing information

4. **Performance consideration**
   - Don't log in tight loops
   - Log aggregated results instead
   - Use conditional logging (if (debug))

## Examples

```javascript
// Good
logger.info('User created', {
  userId: user.id,
  email: user.email.substring(0, 5) + '***', // Sanitized
})

// Bad
logger.info('User created', {
  password: user.password, // Never log passwords
  fullEmail: user.email,   // PII logging
})

// Good
logger.info('API response time', {
  endpoint: '/api/projects',
  method: 'GET',
  duration: 250,
  status: 200,
})

// Bad
logger.info('API call completed')
```

## Related ADRs

- ADR-006: Error Handling Strategy
- ADR-002: API Abstraction Layer
