# SolarTrack Pro: Import Conventions Guide

This guide defines how to import from the new folder structure using path aliases.

---

## Available Path Aliases

All imports use `@/` prefix for cleaner, shorter imports:

| Alias | Maps To | Purpose |
|-------|---------|---------|
| `@/config` | `src/config` | Constants, environment config |
| `@/utils` | `src/utils` | Utility functions, helpers |
| `@/api` | `src/lib/api` | API client, interceptors, error handling |
| `@/services` | `src/lib/services` | Domain-specific business logic |
| `@/components` | `src/components` | React components |
| `@/hooks` | `src/hooks` | Custom React hooks |
| `@/lib` | `src/lib` | General library code |
| `@/types` | `src/types` | TypeScript type definitions |

---

## Configuration Imports

### Using Constants

```javascript
import { 
  PROJECT_STATUSES,
  PROJECT_STAGES,
  ROLES,
  APPROVAL_STATUSES,
  EMAIL_TEMPLATE_TYPES,
  EMAIL_STATUS,
  PAGINATION,
  API_CONFIG,
  HTTP_STATUS,
  EMAIL_CONFIG,
  NOTIFICATION_TYPES,
  NOTIFICATION_DURATION,
  FEATURE_FLAGS,
  VALIDATION,
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOG_LEVELS,
  LOG_CATEGORIES,
  TIMING,
  PATTERNS,
  LIMITS,
  FILE_TYPES,
  FILE_EXTENSIONS
} from '@/config/constants'

// Group imports by category
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_OPTIONS,
  APPROVAL_STATUSES,
  EMAIL_STATUS
} from '@/config/constants'

// Use convenience exports
import { STATUS_CONSTANTS, CONFIG_CONSTANTS, MESSAGE_CONSTANTS } from '@/config/constants'
```

### Using Environment Config

```javascript
import { env, isFeatureEnabled, getEnv, getByEnvironment } from '@/config/environment'

// Access environment variables
console.log(env.SUPABASE_URL)
console.log(env.API_BASE_URL)

// Check features
if (isFeatureEnabled('ANALYTICS')) {
  initializeAnalytics()
}

// Get with fallback
const timeout = getEnv('API_TIMEOUT', 30000)

// Get environment-specific values
const apiUrl = getByEnvironment({
  development: 'http://localhost:3000',
  staging: 'https://staging.api.solartrack.com',
  production: 'https://api.solartrack.com'
})

// Check environment
if (env.isDevelopment()) {
  enableDebugMode()
}
```

---

## Utility Function Imports

### Common Utilities

```javascript
// General purpose functions
import { 
  debounce,
  throttle,
  memoize,
  deepClone,
  safeJsonParse,
  generateId,
  sleep
} from '@/utils/common'

// Usage
const debouncedSearch = debounce(handleSearch, 300)
const throttledScroll = throttle(handleScroll, 100)
```

### Formatting Utilities

```javascript
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatPhoneNumber,
  formatFileSize,
  truncateString,
  capitalizeWords,
  slugify
} from '@/utils/formatting'

// Usage
const displayDate = formatDate(new Date())
const displayCurrency = formatCurrency(1234.56, 'INR')
const displaySize = formatFileSize(1024 * 1024) // "1 MB"
```

### Storage Utilities

```javascript
import {
  getStorage,
  setStorage,
  removeStorage,
  clearStorage,
  getSessionStorage,
  setSessionStorage,
  removeSessionStorage
} from '@/utils/storage'

import { STORAGE_KEYS } from '@/config/constants'

// Usage
setStorage(STORAGE_KEYS.USER_PREFERENCES, { theme: 'dark' })
const prefs = getStorage(STORAGE_KEYS.USER_PREFERENCES)
removeStorage(STORAGE_KEYS.AUTH_TOKEN)
```

### Validation Utilities (NEW)

```javascript
import {
  validateEmail,
  validatePhone,
  validateProjectName,
  validateCustomerName,
  validatePassword,
  validateUrl,
  validateMinLength,
  validateMaxLength,
  validatePattern
} from '@/utils/validation'

// Usage
if (!validateEmail(email)) {
  showError('Invalid email address')
}

if (!validatePassword(password)) {
  showError('Password must be at least 8 characters with uppercase, lowercase, number, and special character')
}
```

---

## API Client Imports

### Using API Client

```javascript
import { default as apiClient } from '@/api/client'

// Or use the index file (once created)
import { apiClient, errorHandler, retryRequest } from '@/api'

// Usage
const response = await apiClient.get('/projects')
const data = await apiClient.post('/projects', { name: 'Solar Project' })
const updated = await apiClient.put('/projects/123', updates)
const deleted = await apiClient.delete('/projects/123')
```

### Error Handling

```javascript
import errorHandler from '@/api/errorHandler'

try {
  const data = await apiClient.get('/projects')
} catch (error) {
  const friendlyError = errorHandler.handle(error)
  showError(friendlyError.message)
}
```

### API Interceptors

```javascript
import { setupInterceptors } from '@/api/interceptors'
import apiClient from '@/api/client'

// Setup on app initialization
setupInterceptors(apiClient)
```

---

## Service Layer Imports

### Project Services

```javascript
// Import from the service module
import { projectService } from '@/services/projects'
import { projectValidation } from '@/services/projects'

// Or use destructuring
import {
  projectService,
  projectValidation
} from '@/services/projects'

// Usage
const projects = await projectService.fetchAll()
const project = await projectService.getById(id)
await projectService.create(projectData)
await projectService.update(id, updates)

// Validation
const errors = projectValidation.validateProject(projectData)
```

### Customer Services

```javascript
import { customerService } from '@/services/customers'

// Usage
const customers = await customerService.fetchAll()
const customer = await customerService.getById(customerId)
const created = await customerService.create(customerData)
```

### Email Services

```javascript
import { emailService } from '@/services/email'

// Usage
await emailService.send({
  to: customer.email,
  subject: 'Project Status Update',
  template: 'statusUpdate',
  data: { project, status: 'completed' }
})
```

### Invoice Services

```javascript
import { invoiceService, invoiceDownloadService } from '@/services/invoices'

// Usage
const invoice = await invoiceService.create(invoiceData)
const pdf = await invoiceDownloadService.generatePDF(invoice)
await invoiceDownloadService.downloadPDF(invoice, 'invoice.pdf')
```

### Material Services

```javascript
import { materialService } from '@/services/materials'

// Usage
const materials = await materialService.fetchAll()
const material = await materialService.getById(materialId)
```

---

## Logger Imports

### Using Logger

```javascript
// Direct import
import logger from '@/lib/logger'

// Or from module (once reorganized)
import { logger } from '@/lib/logger'

import { LOG_LEVELS, LOG_CATEGORIES } from '@/config/constants'

// Usage
logger.info('User logged in', { userId: user.id })
logger.warn('API timeout', { endpoint: '/projects', timeout: 30000 })
logger.error('Failed to create project', { error, projectData })
logger.debug('Component mounted', { componentName: 'ProjectForm' })
```

### Error Tracking

```javascript
import { captureException, setupErrorTracking } from '@/lib/logger'

// Setup on app start
setupErrorTracking(env.SENTRY_DSN)

// Capture errors
try {
  await riskyOperation()
} catch (error) {
  captureException(error, { 
    tags: { feature: 'project-creation' },
    extra: { projectData }
  })
  showUserError('Failed to create project')
}
```

---

## Component Imports

### Common Components

```javascript
import ErrorBoundary from '@/components/common/ErrorBoundary'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import Modal from '@/components/common/Modal'
import FormField from '@/components/common/FormField'

// Usage
<ErrorBoundary>
  <AppContent />
</ErrorBoundary>

<Modal isOpen={isOpen} onClose={handleClose}>
  <Modal.Header>Create Project</Modal.Header>
  <Modal.Body>
    <FormField label="Project Name" value={name} onChange={setName} />
  </Modal.Body>
  <Modal.Footer>
    <button onClick={handleCreate}>Create</button>
  </Modal.Footer>
</Modal>

{isLoading && <LoadingSpinner />}
```

### Feature-Specific Components

```javascript
// Project components
import ProjectList from '@/components/features/projects/ProjectList'
import ProjectForm from '@/components/features/projects/ProjectForm'
import ProjectCard from '@/components/features/projects/ProjectCard'

// Customer components
import CustomerDirectory from '@/components/features/customers/CustomerDirectory'
import CustomerForm from '@/components/features/customers/CustomerForm'

// Analytics components
import DashboardMetrics from '@/components/features/analytics/DashboardMetrics'
import ProjectChart from '@/components/features/analytics/ProjectChart'

// Batch operations
import BatchImport from '@/components/features/batch/BatchImport'
import BatchExport from '@/components/features/batch/BatchExport'

// Forms
import ProjectFormComponent from '@/components/features/forms/ProjectForm'
import CustomerFormComponent from '@/components/features/forms/CustomerForm'
```

---

## Hook Imports

```javascript
import useAsync from '@/hooks/useAsync'
import useForm from '@/hooks/useForm'
import useImportWizard from '@/hooks/useImportWizard'
import useMobileDetect from '@/hooks/useMobileDetect'
import usePagination from '@/hooks/usePagination'
import useProjectForm from '@/hooks/useProjectForm'

// Usage
const { data, loading, error } = useAsync(() => fetchProjects())
const { values, errors, handleChange } = useForm(initialValues)
const isMobile = useMobileDetect()
const { page, pageSize, goToPage } = usePagination()
```

---

## Type Imports

```javascript
// Import type definitions
import type { Project, Customer, Invoice } from '@/types'

// Usage in function signatures
function createProject(data: Project): Promise<Project> {
  // ...
}

interface ProjectListProps {
  projects: Project[]
  onSelect: (project: Project) => void
}
```

---

## Complete Examples

### Example 1: Project Creation Form

```javascript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Configuration
import { PROJECT_STATUSES, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/config/constants'
import { env } from '@/config/environment'

// Utils
import { validateProjectName } from '@/utils/validation'
import { setStorage, STORAGE_KEYS } from '@/utils/storage'

// Services
import { projectService, projectValidation } from '@/services/projects'

// Components
import Modal from '@/components/common/Modal'
import FormField from '@/components/common/FormField'
import ProjectForm from '@/components/features/forms/ProjectForm'

// Logger
import logger from '@/lib/logger'

export function CreateProjectModal({ isOpen, onClose }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (formData) => {
    // Validate
    const errors = projectValidation.validateProject(formData)
    if (errors.length > 0) {
      setError(errors[0])
      return
    }

    setLoading(true)
    try {
      const created = await projectService.create({
        ...formData,
        status: PROJECT_STATUSES.PLANNING
      })

      // Log success
      logger.info('Project created', { projectId: created.id })

      // Save to recent projects
      const recent = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.RECENT_PROJECTS) || '[]'
      )
      recent.unshift(created.id)
      setStorage(STORAGE_KEYS.RECENT_PROJECTS, recent.slice(0, 10))

      // Show success
      showSuccess(SUCCESS_MESSAGES.PROJECT_CREATED)
      
      // Close and navigate
      onClose()
      navigate(`/projects/${created.id}`)
    } catch (err) {
      logger.error('Failed to create project', { error: err })
      setError(ERROR_MESSAGES.GENERIC)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>New Project</Modal.Header>
      <Modal.Body>
        <ProjectForm onSubmit={handleSubmit} loading={loading} />
        {error && <div className="error">{error}</div>}
      </Modal.Body>
    </Modal>
  )
}
```

### Example 2: Service Usage in a Hook

```javascript
// src/hooks/useProjects.js
import { useState, useEffect } from 'react'

import { projectService } from '@/services/projects'
import logger from '@/lib/logger'
import { ERROR_MESSAGES } from '@/config/constants'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const data = await projectService.fetchAll()
      setProjects(data)
      setError(null)
    } catch (err) {
      logger.error('Failed to load projects', { error: err })
      setError(ERROR_MESSAGES.GENERIC)
    } finally {
      setLoading(false)
    }
  }

  return { projects, loading, error, refetch: loadProjects }
}
```

### Example 3: API Request with Error Handling

```javascript
// src/lib/services/projects/projectService.js
import apiClient from '@/api/client'
import errorHandler from '@/api/errorHandler'
import logger from '@/lib/logger'
import { ERROR_MESSAGES } from '@/config/constants'

export const projectService = {
  async fetchAll(filters = {}) {
    try {
      const response = await apiClient.get('/projects', { params: filters })
      return response.data
    } catch (error) {
      const friendly = errorHandler.handle(error)
      logger.error('Failed to fetch projects', { error, filters })
      throw new Error(friendly.message || ERROR_MESSAGES.GENERIC)
    }
  },

  async getById(id) {
    try {
      const response = await apiClient.get(`/projects/${id}`)
      return response.data
    } catch (error) {
      logger.error('Failed to fetch project', { error, projectId: id })
      throw error
    }
  }
}
```

---

## Migration Checklist for Existing Code

When refactoring existing code to use new imports:

1. **Identify imports to update**
   - Old: `import { func } from '@/lib/utils/formatting'`
   - New: `import { func } from '@/utils/formatting'`

2. **Use find/replace in IDE**
   - Search: `from '@/lib/([^/]+)'`
   - Replace: `from '@/$1'` (where applicable)

3. **Test after changes**
   - Run tests: `npm test`
   - Check for build errors: `npm run build`
   - Verify imports resolve correctly

4. **Verify bundle size**
   - No significant changes expected
   - Check with: `npm run analyze`

5. **Commit changes**
   - Separate commits for different modules
   - Use descriptive messages: "refactor: update imports to use new aliases"

---

## Common Patterns

### Pattern: Loading Data

```javascript
import { useAsync } from '@/hooks'
import { projectService } from '@/services/projects'
import { ERROR_MESSAGES } from '@/config/constants'

function ProjectList() {
  const { data: projects, loading, error } = useAsync(
    () => projectService.fetchAll()
  )

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage>{ERROR_MESSAGES.GENERIC}</ErrorMessage>
  return <div>{/* render projects */}</div>
}
```

### Pattern: Form Submission

```javascript
import { useForm } from '@/hooks'
import { projectService, projectValidation } from '@/services/projects'
import { SUCCESS_MESSAGES } from '@/config/constants'

function ProjectForm() {
  const { values, errors, handleChange, handleSubmit } = useForm(
    initialValues,
    async (formData) => {
      const validationErrors = projectValidation.validateProject(formData)
      if (validationErrors.length > 0) throw validationErrors[0]

      const created = await projectService.create(formData)
      showSuccess(SUCCESS_MESSAGES.PROJECT_CREATED)
      return created
    }
  )

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>
}
```

### Pattern: Environment-Based Config

```javascript
import { getByEnvironment, env } from '@/config/environment'

const API_CONFIG = getByEnvironment({
  development: {
    baseUrl: 'http://localhost:3000',
    logging: true
  },
  staging: {
    baseUrl: 'https://staging.api.solartrack.com',
    logging: true
  },
  production: {
    baseUrl: 'https://api.solartrack.com',
    logging: false
  }
})

if (env.isDevelopment()) {
  console.log('Running in development mode')
}
```

---

## Troubleshooting

### Import not found

```
Error: Cannot find module '@/services/projects'
```

Solution: Ensure the path alias is correct in `vite.config.js` and the file exists.

### Circular dependencies

If you get circular import errors:
1. Check for files importing from parent modules
2. Use index files to control exports
3. Consider moving shared logic to utils

### TypeScript not recognizing imports

Add to `tsconfig.json` (if using TypeScript):
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/config/*": ["./src/config/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
```

---

## Summary

| Use | For |
|-----|-----|
| `@/config` | Constants, environment variables |
| `@/utils` | Helper functions, formatting, validation |
| `@/api` | API client, error handling, interceptors |
| `@/services` | Business logic (projects, customers, email, etc.) |
| `@/components` | React components (common and feature-specific) |
| `@/hooks` | Custom React hooks |
| `@/lib` | General library code |
| `@/types` | Type definitions |

New code should use these aliases. Existing code will be migrated gradually over the coming weeks.
