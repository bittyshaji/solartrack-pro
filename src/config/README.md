# Configuration Module

## Purpose

Centralized management of application configuration, constants, and environment variables. This module serves as the single source of truth for all application-wide constants and settings.

## Files

### constants.js
Comprehensive collection of all magic strings, configuration values, and constants used throughout the application.

**Contents:**
- Project and workflow constants (statuses, stages, roles)
- Email and communication constants
- Pagination and data defaults
- API configuration
- Validation rules and patterns
- Storage keys for localStorage
- Error and success messages
- Feature flags
- File type definitions
- Timing and delay constants

### environment.js
Environment-specific configuration loaded from environment variables at runtime.

**Contents:**
- Application name and version
- Database URLs and credentials
- API base URL and timeouts
- Email service configuration
- Feature flags from environment
- Logging and analytics setup
- Helper functions (isDevelopment, isProduction, etc.)

## Usage Examples

### Using Constants

```javascript
import { 
  PROJECT_STATUSES,
  API_CONFIG,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION
} from '@/config/constants'

// Using project statuses
const newStatus = PROJECT_STATUSES.IN_PROGRESS

// Using validation rules
const minLength = VALIDATION.PROJECT_NAME_MIN_LENGTH

// Using error messages
showError(ERROR_MESSAGES.NETWORK_TIMEOUT)

// Using storage keys
localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(prefs))

// Using API config
const timeout = API_CONFIG.BASE_TIMEOUT
```

### Using Environment Configuration

```javascript
import { env, isFeatureEnabled, getEnv, getByEnvironment } from '@/config/environment'

// Access environment variables
const apiUrl = env.API_BASE_URL
const supabaseUrl = env.SUPABASE_URL

// Check if feature is enabled
if (isFeatureEnabled('ANALYTICS')) {
  initializeAnalytics()
}

// Get environment variable with fallback
const timeout = getEnv('API_TIMEOUT', 30000)

// Get environment-specific value
const apiEndpoint = getByEnvironment({
  development: 'http://localhost:3000',
  staging: 'https://staging.api.solartrack.com',
  production: 'https://api.solartrack.com'
})

// Check current environment
if (env.isDevelopment()) {
  enableDebugTools()
}

// Get safe environment (hides sensitive data)
const safeEnv = getSafeEnv()
console.log(safeEnv) // Safe to log
```

## Adding New Constants

### 1. Identify the Category

Choose the right section in `constants.js` or create a new one:
- Statuses and workflow states
- API and network config
- Validation rules
- Messages (error/success)
- Feature flags
- etc.

### 2. Add the Constant

```javascript
// In constants.js
export const NEW_FEATURE_STATUSES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
}
```

### 3. Export if Needed

For groupings, add to convenience exports:

```javascript
export const MY_GROUP_CONSTANTS = {
  NEW_FEATURE_STATUSES,
  OTHER_CONSTANT,
}
```

### 4. Use in Code

```javascript
import { NEW_FEATURE_STATUSES } from '@/config/constants'

const status = NEW_FEATURE_STATUSES.ACTIVE
```

## Adding New Environment Variables

### 1. Define in Environment File

```javascript
// In getEnvironmentConfig()
config.MY_NEW_VAR = process.env.VITE_MY_NEW_VAR
```

### 2. Use in Code

```javascript
import { env } from '@/config/environment'

const value = env.MY_NEW_VAR
```

### 3. Create .env.example

Document in `.env.example`:
```
VITE_MY_NEW_VAR=default_value
```

## Best Practices

### Constants

1. **Use UPPERCASE_WITH_UNDERSCORES** for constant names
2. **Group related constants** together
3. **Use objects for related values**
   ```javascript
   // Good
   const PROJECT_STATUSES = { PLANNING: 'Planning', ... }
   
   // Avoid
   const PROJECT_STATUS_PLANNING = 'Planning'
   const PROJECT_STATUS_IN_PROGRESS = 'In Progress'
   ```

4. **Add JSDoc comments** for complex constants
5. **Use string values** rather than numbers/symbols when possible
6. **Avoid hardcoding** throughout app - use constants instead

### Environment Variables

1. **Prefix with VITE_** for client-side variables
2. **Provide defaults** for optional variables
3. **Validate on startup** - call `verifyEnvironment()`
4. **Document required vars** in .env.example
5. **Never commit credentials** - use .env.local

## Common Patterns

### Pattern: Conditional Behavior Based on Environment

```javascript
import { env } from '@/config/environment'

if (env.isProduction()) {
  // Production-only setup
  setupErrorReporting()
} else if (env.isDevelopment()) {
  // Development-only setup
  enableDebugPanel()
}
```

### Pattern: Feature Flag Checks

```javascript
import { isFeatureEnabled } from '@/config/environment'
import { FEATURE_FLAGS } from '@/config/constants'

// Using environment-based feature flags
if (isFeatureEnabled('ANALYTICS')) {
  initializeAnalytics()
}

// Using static feature flags
if (FEATURE_FLAGS.ENABLE_BATCH_OPERATIONS) {
  showBatchOperationsUI()
}
```

### Pattern: Validation Configuration

```javascript
import { VALIDATION, PATTERNS } from '@/config/constants'

function validateInput(value, type) {
  if (type === 'email') {
    if (!PATTERNS.EMAIL.test(value)) return false
    if (value.length > VALIDATION.CUSTOMER_EMAIL_MAX_LENGTH) return false
    return true
  }
  // ... more types
}
```

### Pattern: Error Handling with Messages

```javascript
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants'

try {
  await operation()
  showSuccess(SUCCESS_MESSAGES.OPERATION_COMPLETE)
} catch (error) {
  if (error.code === 'NETWORK_ERROR') {
    showError(ERROR_MESSAGES.NETWORK)
  } else {
    showError(ERROR_MESSAGES.GENERIC)
  }
}
```

## Migration Notes

- All constants should be imported from `@/config/constants`
- Environment variables accessed via `@/config/environment`
- Old constant files have been deprecated
- No hardcoded strings should exist in component code
- All new code must use constants from this module

## Testing

When testing code that uses config:

```javascript
import { PROJECT_STATUSES } from '@/config/constants'
import { env } from '@/config/environment'

// Mock if needed
jest.mock('@/config/environment', () => ({
  env: { isDevelopment: () => false }
}))

test('shows production behavior', () => {
  expect(env.isDevelopment()).toBe(false)
})
```

## Related

- See IMPORT_CONVENTIONS.md for import patterns
- See FOLDER_REORGANIZATION_PLAN.md for migration timeline
