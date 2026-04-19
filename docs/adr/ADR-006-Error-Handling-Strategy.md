# ADR-006: Structured Error Handling Strategy

**Status:** Accepted  
**Date:** March 2024

## Context

Error handling was scattered throughout the codebase:

- Inconsistent error formats
- Poor user-facing error messages
- Difficult error tracking and debugging
- Network errors not differentiated from validation errors
- No centralized error recovery logic

## Decision

Implement structured error handling with typed error classes, centralized error handlers, and consistent user communication.

## Rationale

### Error Type Hierarchy

```
Error
├── ApiError              // Network/API failures
│   ├── NetworkError      // No connectivity
│   └── AuthError         // Auth-specific
├── ValidationError       // Input validation
├── AuthorizationError    // Permission denied
├── NotFoundError         // Resource missing
└── ConflictError         // Resource conflict
```

### Error Implementation

```javascript
// Base error class
class ApiError extends Error {
  constructor(message, code, status, details = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
    this.timestamp = new Date().toISOString()
    this.requestId = generateRequestId()
  }
}

// Specific error types
class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message)
    this.name = 'ValidationError'
    this.fields = fields
  }
}

class AuthenticationError extends ApiError {
  constructor(message = 'Please log in again') {
    super(message, 'AUTH_001', 401)
    this.name = 'AuthenticationError'
  }
}

class AuthorizationError extends ApiError {
  constructor(message = 'You do not have permission') {
    super(message, 'PERMISSION_001', 403)
    this.name = 'AuthorizationError'
  }
}
```

### Centralized Error Handler

```javascript
// /src/lib/api/errorHandler.js
export function handleApiError(error) {
  if (error instanceof ValidationError) {
    return {
      type: 'validation',
      message: error.message,
      fields: error.fields,
    }
  }
  
  if (error instanceof AuthenticationError) {
    return {
      type: 'auth',
      message: 'Session expired. Please log in again.',
      action: 'redirect_to_login',
    }
  }
  
  if (error instanceof AuthorizationError) {
    return {
      type: 'permission',
      message: 'You do not have access to this resource.',
    }
  }
  
  if (error instanceof ApiError) {
    if (error.status >= 500) {
      logger.error('Server error', { error, requestId: error.requestId })
      return {
        type: 'server',
        message: 'A server error occurred. Please try again later.',
      }
    }
    
    return {
      type: 'api',
      message: error.message,
      code: error.code,
    }
  }
  
  // Unknown error
  logger.error('Unknown error', { error })
  return {
    type: 'unknown',
    message: 'An unexpected error occurred.',
  }
}
```

### Error Display Pattern

```javascript
function ErrorDisplay({ error }) {
  if (!error) return null
  
  const { type, message, fields } = error
  
  return (
    <div className={`error-${type}`}>
      <h3>Error</h3>
      <p>{message}</p>
      
      {type === 'validation' && fields && (
        <ul>
          {Object.entries(fields).map(([field, messages]) => (
            <li key={field}>
              <strong>{field}:</strong> {messages.join(', ')}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

### Retry Logic with Exponential Backoff

```javascript
export async function withRetry(
  fn,
  maxRetries = 3,
  baseDelay = 1000,
  retryableStatusCodes = [408, 429, 500, 502, 503, 504]
) {
  let lastError
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry client errors (4xx) except specific ones
      if (error.status >= 400 && error.status < 500) {
        if (!retryableStatusCodes.includes(error.status)) {
          throw error
        }
      }
      
      // Wait before retry with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}
```

### Error Boundary Component

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  componentDidCatch(error, errorInfo) {
    logger.error('React Error Boundary caught error', {
      error,
      errorInfo,
    })
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Something went wrong</h1>
          <p>{this.state.error.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      )
    }
    
    return this.props.children
  }
}
```

## Consequences

### Positive

- Consistent error handling across app
- Better user-facing messages
- Easier debugging with error tracking
- Type-safe error handling
- Clear error recovery paths
- Centralized error logging

### Negative

- Additional error class definitions
- Learning curve for error patterns
- Slightly more code initially

## Error Codes Reference

```
AUTH_001: Invalid credentials
AUTH_002: Account not approved
AUTH_003: Session expired
VALIDATION_001: Invalid input
VALIDATION_002: Field required
PERMISSION_001: Access denied
NOT_FOUND_001: Resource not found
CONFLICT_001: Resource already exists
RATE_LIMIT_001: Too many requests
SERVER_ERROR_001: Internal server error
NETWORK_001: No internet connection
```

## Usage Examples

```javascript
// Throwing errors
throw new ValidationError('Invalid project data', {
  title: ['Title is required'],
  customer_id: ['Customer must be selected'],
})

// Handling errors
try {
  await ProjectService.create(data)
} catch (error) {
  const handled = handleApiError(error)
  showErrorNotification(handled)
}

// With retry
const projects = await withRetry(() =>
  ProjectService.list({ status: 'active' })
)
```

## Related ADRs

- ADR-002: API Abstraction Layer
- ADR-007: Logging Approach
- ADR-004: Testing Strategy

## Monitoring Integration

Errors are sent to monitoring service:

```javascript
if (error.status >= 500) {
  sentry.captureException(error, {
    tags: { requestId: error.requestId },
    level: 'error',
  })
}
```
