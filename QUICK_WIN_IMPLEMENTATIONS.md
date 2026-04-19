# SolarTrack Pro - Quick Win Code Examples

These are ready-to-use code snippets you can implement immediately (1-2 weeks) with minimal effort but significant impact.

---

## Quick Win #1: ESLint + Prettier Setup (1 day)

### Step 1: Install dependencies
```bash
npm install --save-dev \
  eslint \
  prettier \
  eslint-config-prettier \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-import
```

### Step 2: Create `.eslintrc.cjs`
```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', 'react-hooks', 'import'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
        alphabeticalOrder: true,
      },
    ],
  },
}
```

### Step 3: Create `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Step 4: Add to `package.json`
```json
{
  "scripts": {
    "lint": "eslint src --ext .js,.jsx",
    "lint:fix": "eslint src --ext .js,.jsx --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,css,md}\""
  }
}
```

### Usage
```bash
npm run lint              # Check for lint errors
npm run lint:fix         # Fix auto-fixable errors
npm run format           # Format code with Prettier
npm run format:check     # Check if code needs formatting
```

---

## Quick Win #2: Centralized Constants File (1 day)

### Create `src/config/constants.js`
```javascript
/**
 * Application Constants
 * Single source of truth for all magic strings and configuration values
 */

// Project status values
export const PROJECT_STATUSES = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const PROJECT_STATUS_OPTIONS = Object.values(PROJECT_STATUSES)

// Project stages
export const PROJECT_STAGES = [
  { id: 1, name: 'Site Survey' },
  { id: 2, name: 'KSEB Application' },
  { id: 3, name: 'Mounting Work' },
  { id: 4, name: 'Panel Installation' },
  { id: 5, name: 'Wiring & Inverter' },
  { id: 6, name: 'Earthing & Safety' },
  { id: 7, name: 'KSEB Inspection' },
  { id: 8, name: 'Net Meter' },
  { id: 9, name: 'Commissioning' },
  { id: 10, name: 'Completed' },
]

export const STAGE_NAMES = Object.fromEntries(
  PROJECT_STAGES.map(s => [s.id, s.name])
)

// User roles
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
}

// Approval status
export const APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

// Email templates
export const EMAIL_TEMPLATE_TYPES = {
  INVOICE: 'invoice',
  REMINDER: 'reminder',
  STATUS_UPDATE: 'statusUpdate',
  WELCOME: 'welcome',
}

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
}

// API Configuration
export const API_CONFIG = {
  BASE_TIMEOUT: 30000, // ms
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // ms
  RETRY_BACKOFF_MULTIPLIER: 2,
}

// Email Configuration
export const EMAIL_CONFIG = {
  BATCH_SIZE: 10,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 3600000, // 1 hour
  DEFAULT_FROM: 'noreply@solartrack.com',
}

// Feature flags (can be toggled without code changes)
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: true,
  ENABLE_BATCH_OPERATIONS: true,
  ENABLE_EMAIL_NOTIFICATIONS: true,
  ENABLE_PHOTO_UPLOADS: true,
  ENABLE_OFFLINE_MODE: true,
}

// Validation rules
export const VALIDATION = {
  PROJECT_NAME_MIN_LENGTH: 3,
  PROJECT_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  PHONE_PATTERN: /^\+?[\d\s\-()]+$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
}

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'st_auth_token',
  USER_PREFERENCES: 'st_user_preferences',
  FILTER_PRESETS: 'st_filter_presets',
  RECENT_PROJECTS: 'st_recent_projects',
}

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An error occurred. Please try again later.',
  NETWORK: 'Network error. Please check your connection.',
  AUTH_REQUIRED: 'You must be logged in to perform this action.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_FAILED: 'Please check your input and try again.',
  DUPLICATE_EMAIL: 'This email is already registered.',
}

// Success messages
export const SUCCESS_MESSAGES = {
  PROJECT_CREATED: 'Project created successfully.',
  PROJECT_UPDATED: 'Project updated successfully.',
  PROJECT_DELETED: 'Project deleted successfully.',
  CUSTOMER_CREATED: 'Customer created successfully.',
  EMAIL_SENT: 'Email sent successfully.',
  IMPORT_COMPLETE: 'Import completed successfully.',
}
```

### Usage in Services
```javascript
// Before
export async function getProjects(filters = {}) {
  let query = supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  
  return query
}

// After
import { PROJECT_STATUSES } from '../config/constants'
import { logger } from '../lib/logger'

export async function getProjects(filters = {}) {
  try {
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (filters.status && Object.values(PROJECT_STATUSES).includes(filters.status)) {
      query = query.eq('status', filters.status)
    }
    
    logger.info('Fetching projects', { filters })
    const { data, error } = await query
    
    if (error) throw error
    return data
  } catch (error) {
    logger.error('Failed to fetch projects', error)
    throw error
  }
}
```

### Usage in Components
```jsx
import { PROJECT_STATUSES, PROJECT_STATUS_OPTIONS } from '../config/constants'

export function ProjectStatusSelect() {
  return (
    <select defaultValue={PROJECT_STATUSES.PLANNING}>
      {PROJECT_STATUS_OPTIONS.map(status => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
  )
}
```

---

## Quick Win #3: Logger Utility (1-2 days)

### Create `src/lib/logger.js`
```javascript
/**
 * Structured Logging Utility
 * Provides consistent logging across the application
 * Can be integrated with error tracking services (Sentry, etc.)
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
}

const LOG_COLORS = {
  DEBUG: '\x1b[36m', // cyan
  INFO: '\x1b[32m',  // green
  WARN: '\x1b[33m',  // yellow
  ERROR: '\x1b[31m', // red
  RESET: '\x1b[0m',  // reset
}

class Logger {
  constructor(options = {}) {
    this.level = options.level || LOG_LEVELS.INFO
    this.isDev = import.meta.env.DEV
    this.isProd = import.meta.env.PROD
    this.context = options.context || {}
  }

  log(level, message, data = {}) {
    if (LOG_LEVELS[level] < this.level) {
      return
    }

    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      data: this.sanitizeData(data),
      url: window.location.pathname,
      userAgent: navigator.userAgent.slice(0, 100),
      ...this.context,
    }

    // Log to console in development
    if (this.isDev) {
      const color = LOG_COLORS[level]
      const reset = LOG_COLORS.RESET
      console.log(
        `${color}[${timestamp}] [${level}] ${message}${reset}`,
        data,
      )
    }

    // Send to error tracking in production
    if (this.isProd && level === 'ERROR') {
      this.sendToErrorTracking(logEntry)
    }

    // Store critical logs in local storage for debugging
    if (level === 'ERROR' && typeof window !== 'undefined') {
      this.storeLog(logEntry)
    }
  }

  debug(message, data) {
    this.log('DEBUG', message, data)
  }

  info(message, data) {
    this.log('INFO', message, data)
  }

  warn(message, data) {
    this.log('WARN', message, data)
  }

  error(message, error, data = {}) {
    this.log('ERROR', message, {
      errorMessage: error?.message,
      errorStack: error?.stack?.split('\n').slice(0, 3).join('|'),
      ...data,
    })
  }

  setContext(context) {
    this.context = { ...this.context, ...context }
  }

  clearContext() {
    this.context = {}
  }

  sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data
    }

    const SENSITIVE_KEYS = [
      'password',
      'token',
      'apiKey',
      'secret',
      'creditCard',
      'ssn',
    ]

    const sanitized = { ...data }

    Object.keys(sanitized).forEach(key => {
      if (SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]'
      }
    })

    return sanitized
  }

  sendToErrorTracking(logEntry) {
    // Integrate with Sentry or similar service
    // Example: Sentry.captureMessage(logEntry.message, 'error')
    if (typeof window.Sentry !== 'undefined') {
      window.Sentry.captureException(new Error(logEntry.message), {
        contexts: { custom: logEntry },
      })
    }
  }

  storeLog(logEntry) {
    try {
      const key = 'st_error_logs'
      const logs = JSON.parse(localStorage.getItem(key) || '[]')
      logs.push(logEntry)
      
      // Keep only last 50 logs
      if (logs.length > 50) {
        logs.shift()
      }
      
      localStorage.setItem(key, JSON.stringify(logs))
    } catch (e) {
      // Silently fail if localStorage is full
      console.warn('Failed to store log:', e)
    }
  }

  // Helper to get stored logs for debugging
  static getStoredLogs() {
    try {
      return JSON.parse(localStorage.getItem('st_error_logs') || '[]')
    } catch {
      return []
    }
  }

  static clearStoredLogs() {
    localStorage.removeItem('st_error_logs')
  }
}

// Export singleton instance
export const logger = new Logger({
  level: import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO,
})
```

### Usage in Services
```javascript
import { logger } from '../lib/logger'
import { PROJECT_STATUSES } from '../config/constants'

export async function getProjects(filters = {}) {
  try {
    logger.info('Fetching projects', { filters })
    
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (filters.status && Object.values(PROJECT_STATUSES).includes(filters.status)) {
      query = query.eq('status', filters.status)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    logger.info('Projects fetched successfully', { count: data?.length || 0 })
    return data
  } catch (error) {
    logger.error('Failed to fetch projects', error, { filters })
    throw error
  }
}
```

---

## Quick Win #4: Error Boundary Component (1-2 days)

### Create `src/components/common/ErrorBoundary.jsx`
```jsx
import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { logger } from '../../lib/logger'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    const errorCount = this.state.errorCount + 1
    
    this.setState({
      error,
      errorInfo,
      errorCount,
    })

    // Log error
    logger.error(
      `Error Boundary caught error (${errorCount}x)`,
      error,
      { errorInfo }
    )

    // Reset after 30 seconds (avoid infinite loops)
    if (errorCount < 3) {
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null })
      }, 30000)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV
      const errorMessage = this.state.error?.message || 'An unexpected error occurred'

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="text-red-600" size={48} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 text-center mb-4">
              We're sorry for the inconvenience. Our team has been notified of the error.
            </p>

            {isDev && (
              <details className="mb-4 p-3 bg-gray-100 rounded text-sm">
                <summary className="font-semibold cursor-pointer">Error Details (Dev Only)</summary>
                <pre className="mt-2 overflow-auto text-xs text-red-600">
                  {errorMessage}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
              >
                <RefreshCw size={18} />
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Usage in App.jsx
```jsx
import { ErrorBoundary } from './components/common/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          {/* ... routes ... */}
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}
```

---

## Quick Win #5: Custom Hooks (2-3 days)

### Create `src/hooks/useAsync.js`
```javascript
import { useEffect, useState, useCallback, useRef } from 'react'
import { logger } from '../lib/logger'

/**
 * Custom hook for handling async operations
 * Manages loading, error, and data states automatically
 * 
 * @param {Function} asyncFunction - Async function to execute
 * @param {boolean} immediate - Execute immediately on mount
 * @returns {Object} { data, loading, error, execute }
 */
export function useAsync(asyncFunction, immediate = true) {
  const [state, setState] = useState({
    data: null,
    loading: immediate,
    error: null,
  })

  const isMounted = useRef(true)

  const execute = useCallback(
    async (...args) => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        const result = await asyncFunction(...args)
        
        if (isMounted.current) {
          setState(prev => ({
            ...prev,
            data: result,
            loading: false,
          }))
        }
        
        return result
      } catch (error) {
        logger.error('useAsync error', error)
        
        if (isMounted.current) {
          setState(prev => ({
            ...prev,
            error,
            loading: false,
          }))
        }
        
        throw error
      }
    },
    [asyncFunction]
  )

  useEffect(() => {
    isMounted.current = true
    
    if (immediate) {
      execute()
    }
    
    return () => {
      isMounted.current = false
    }
  }, [execute, immediate])

  return { ...state, execute }
}
```

### Create `src/hooks/useForm.js`
```javascript
import { useState, useCallback } from 'react'

/**
 * Custom hook for form state management
 * 
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Submit handler
 * @returns {Object} Form state and handlers
 */
export function useForm(initialValues = {}, onSubmit = null) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback(e => {
    const { name, value, type, checked } = e.target
    setValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }, [errors])

  const handleBlur = useCallback(e => {
    const { name } = e.target
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }))
  }, [])

  const handleSubmit = useCallback(
    async e => {
      e.preventDefault()
      
      if (!onSubmit) return
      
      setIsSubmitting(true)
      try {
        await onSubmit(values)
      } catch (error) {
        if (error.field) {
          setErrors(prev => ({
            ...prev,
            [error.field]: error.message,
          }))
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [values, onSubmit]
  )

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }))
  }, [])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
  }
}
```

### Usage in Components
```jsx
import { useAsync } from '../hooks/useAsync'
import { useForm } from '../hooks/useForm'
import { getProjects } from '../lib/projectService'

export function ProjectsList() {
  const { data: projects, loading, error } = useAsync(
    () => getProjects(),
    true
  )

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {projects?.map(project => (
        <li key={project.id}>{project.name}</li>
      ))}
    </ul>
  )
}

export function ProjectForm() {
  const form = useForm(
    { name: '', description: '' },
    async (values) => {
      await createProject(values)
      form.reset()
    }
  )

  return (
    <form onSubmit={form.handleSubmit}>
      <input
        name="name"
        value={form.values.name}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
      />
      {form.errors.name && form.touched.name && (
        <span>{form.errors.name}</span>
      )}
      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
```

---

## Quick Win #6: Input Validation (1-2 days)

### Step 1: Install
```bash
npm install zod react-hook-form @hookform/resolvers
npm install --save-dev @types/react-hook-form
```

### Create `src/lib/validation/project.js`
```javascript
import { z } from 'zod'
import { VALIDATION } from '../config/constants'

export const projectSchema = z.object({
  name: z.string()
    .min(VALIDATION.PROJECT_NAME_MIN_LENGTH, 
         `Name must be at least ${VALIDATION.PROJECT_NAME_MIN_LENGTH} characters`)
    .max(VALIDATION.PROJECT_NAME_MAX_LENGTH,
         `Name must be less than ${VALIDATION.PROJECT_NAME_MAX_LENGTH} characters`),
  
  description: z.string()
    .max(VALIDATION.DESCRIPTION_MAX_LENGTH,
         `Description must be less than ${VALIDATION.DESCRIPTION_MAX_LENGTH} characters`)
    .optional(),
  
  customerId: z.string()
    .uuid('Invalid customer ID'),
  
  estimatedCost: z.number()
    .min(0, 'Cost must be positive')
    .max(1000000, 'Cost exceeds maximum'),
  
  status: z.enum(['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled']),
  
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

export type Project = z.infer<typeof projectSchema>
```

### Usage in Components
```jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema } from '../lib/validation/project'

export function ProjectForm({ onSuccess }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'Planning',
      estimatedCost: 0,
    }
  })

  const onSubmit = async (data) => {
    try {
      await createProject(data)
      onSuccess()
    } catch (error) {
      logger.error('Failed to create project', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name')}
        placeholder="Project name"
      />
      {errors.name && <span className="text-red-600">{errors.name.message}</span>}

      <input
        {...register('estimatedCost', { valueAsNumber: true })}
        type="number"
        placeholder="Estimated cost"
      />
      {errors.estimatedCost && (
        <span className="text-red-600">{errors.estimatedCost.message}</span>
      )}

      <button type="submit">Create Project</button>
    </form>
  )
}
```

---

## Implementation Checklist

- [ ] ESLint + Prettier (1 day)
  - [ ] Install dependencies
  - [ ] Create config files
  - [ ] Run linter and formatter
  - [ ] Add scripts to package.json

- [ ] Constants File (1 day)
  - [ ] Create `src/config/constants.js`
  - [ ] Update imports in 5-10 files
  - [ ] Test that app still works

- [ ] Logger Utility (1-2 days)
  - [ ] Create `src/lib/logger.js`
  - [ ] Integrate into 3-5 key services
  - [ ] Test in browser console

- [ ] Error Boundary (1-2 days)
  - [ ] Create `src/components/common/ErrorBoundary.jsx`
  - [ ] Add to App.jsx
  - [ ] Test error handling

- [ ] Custom Hooks (2-3 days)
  - [ ] Create `useAsync.js`
  - [ ] Create `useForm.js`
  - [ ] Refactor 2-3 components to use them

- [ ] Form Validation (1-2 days)
  - [ ] Install Zod + React Hook Form
  - [ ] Create validation schemas
  - [ ] Add to 2-3 forms
  - [ ] Test validation

**Total Time: 1-2 weeks of focused work**

---

## Next Steps

1. **Pick one quick win** to start with this week
2. **Create a branch** for your changes
3. **Implement the code** using examples above
4. **Test thoroughly** before merging
5. **Move to next quick win**

After these 2 weeks, you'll have:
- ✅ Consistent code style
- ✅ Centralized configuration
- ✅ Structured logging
- ✅ Better error handling
- ✅ Reusable hooks
- ✅ Input validation

This foundation will make all future improvements easier!
