# SolarTrack Pro: Migration Checklist

Step-by-step guide for migrating code to the new folder structure. Use this checklist when refactoring existing code.

---

## Pre-Migration Setup

- [ ] Read FOLDER_REORGANIZATION_PLAN.md
- [ ] Read IMPORT_CONVENTIONS.md
- [ ] Ensure vite.config.js has all path aliases (already done)
- [ ] Check that new directories exist
- [ ] Create a new git branch: `git checkout -b refactor/reorganize-folders`

---

## Phase 1: Config & Constants Migration

### Step 1.1: Verify Config Files

- [ ] Check that `src/config/constants.js` exists and is comprehensive
- [ ] Check that `src/config/environment.js` exists and is validated
- [ ] Create `src/config/README.md` with:
  - [ ] Purpose of the folder
  - [ ] What constants to add/modify
  - [ ] How to import from config
  - [ ] Examples

**README template:**
```markdown
# Configuration Module

## Purpose
Centralized management of application configuration, constants, and environment variables.

## Files
- `constants.js` - All magic strings and application constants
- `environment.js` - Environment-specific configuration

## Usage Examples
```javascript
import { PROJECT_STATUSES, API_CONFIG } from '@/config/constants'
import { env, isFeatureEnabled } from '@/config/environment'
```

## Adding New Constants
1. Add to appropriate section in constants.js
2. Export from constants.js
3. Import in your modules

## Environment Variables
Use @/config/environment for:
- Database URLs
- API endpoints
- Feature flags
- Service credentials
```

### Step 1.2: Update Imports Throughout Codebase

- [ ] Search for imports of constants in all files
- [ ] Replace old paths with new ones:
  - Old: `import { X } from '@/constants'`
  - New: `import { X } from '@/config/constants'`
- [ ] Test: `npm test`
- [ ] Commit: `git commit -m "refactor: update config imports"`

---

## Phase 2: Utilities Migration

### Step 2.1: Create Utils Index and READMEs

- [ ] Verify utils folder structure:
  ```
  src/utils/
  ├── common.js
  ├── formatting.js
  ├── storage.js
  ├── validation.js
  └── README.md
  ```

- [ ] Create `src/utils/README.md`:
  - [ ] Purpose of each utility file
  - [ ] What goes where
  - [ ] Import examples
  - [ ] Common patterns

**README template:**
```markdown
# Utilities Module

## Purpose
Reusable utility functions and helpers.

## Files

### common.js
General purpose utilities: debounce, throttle, memoize, deepClone, etc.

### formatting.js
Data formatting: dates, currency, phone numbers, file sizes, etc.

### storage.js
LocalStorage and SessionStorage helpers.

### validation.js
Validation helpers and validators.

## Usage Examples

### Formatting
```javascript
import { formatDate, formatCurrency } from '@/utils/formatting'
const date = formatDate(new Date())
const price = formatCurrency(1234.56)
```

### Validation
```javascript
import { validateEmail, validatePhone } from '@/utils/validation'
if (!validateEmail(email)) showError('Invalid email')
```

### Storage
```javascript
import { setStorage, getStorage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/constants'

setStorage(STORAGE_KEYS.USER_PREFERENCES, data)
const data = getStorage(STORAGE_KEYS.USER_PREFERENCES)
```
```

### Step 2.2: Create Validation Utilities (NEW)

- [ ] Create `src/utils/validation.js`:
  - [ ] Extract validation functions from services
  - [ ] Create validators using patterns from constants
  - [ ] Add JSDoc comments
  - [ ] Export all validators

**Example:**
```javascript
import { VALIDATION, PATTERNS } from '@/config/constants'

/**
 * Validate email address
 * @param {string} email
 * @returns {boolean}
 */
export function validateEmail(email) {
  return PATTERNS.EMAIL.test(email) &&
         email.length >= VALIDATION.CUSTOMER_EMAIL_MIN_LENGTH &&
         email.length <= VALIDATION.CUSTOMER_EMAIL_MAX_LENGTH
}

// ... more validators
```

### Step 2.3: Update Utils Imports

- [ ] Search codebase for utils imports
- [ ] Update paths:
  - Old: `import { func } from '@/lib/utils/formatting'`
  - New: `import { func } from '@/utils/formatting'`
- [ ] Search and update any direct relative imports
- [ ] Test: `npm test`
- [ ] Commit: `git commit -m "refactor: update utils imports"`

---

## Phase 3: API Layer Migration

### Step 3.1: Create API Index File

- [ ] Create `src/lib/api/index.js`:
```javascript
// src/lib/api/index.js
export { default as apiClient } from './client.js'
export { default as errorHandler } from './errorHandler.js'
export { retryRequest } from './retry.js'
export { setupInterceptors } from './interceptors.js'
```

### Step 3.2: Create API README

- [ ] Create `src/lib/api/README.md`:
```markdown
# API Client Module

## Files
- `client.js` - Main API client (axios instance)
- `errorHandler.js` - Error handling and transformation
- `retry.js` - Retry logic for failed requests
- `interceptors.js` - Request/response interceptors

## Usage

### Basic Requests
```javascript
import apiClient from '@/api/client'

const data = await apiClient.get('/projects')
const created = await apiClient.post('/projects', payload)
const updated = await apiClient.put('/projects/1', payload)
await apiClient.delete('/projects/1')
```

### Error Handling
```javascript
import errorHandler from '@/api/errorHandler'

try {
  const data = await apiClient.get('/projects')
} catch (error) {
  const friendly = errorHandler.handle(error)
  showError(friendly.message)
}
```

### Setup Interceptors
```javascript
import { setupInterceptors } from '@/api/interceptors'
import apiClient from '@/api/client'

setupInterceptors(apiClient)
```
```

### Step 3.3: Update API Imports

- [ ] Search for API imports
- [ ] Update to use `@/api` alias
- [ ] Test: `npm test`
- [ ] Commit: `git commit -m "refactor: update API imports to use alias"`

---

## Phase 4: Service Layer Migration

### Step 4.1: Move Service Files

For each service type (projects, customers, email, invoices, materials):

- [ ] Create service folder: `src/lib/services/{service-type}/`
- [ ] Move service file: `src/lib/{serviceName}.js` → `src/lib/services/{service-type}/`
- [ ] Create `index.js` in service folder
- [ ] Create `README.md` in service folder

**Example for projects:**

```bash
# Create directory
mkdir -p src/lib/services/projects

# Move files
mv src/lib/projectService.js src/lib/services/projects/

# Create index.js
cat > src/lib/services/projects/index.js << 'INNER_EOF'
export { default as projectService } from './projectService.js'
export { projectValidation } from './projectValidation.js'
INNER_EOF
```

### Step 4.2: Create Service Index Files

- [ ] Create `src/lib/services/{type}/index.js` for each service
- [ ] Export all service functions and validations
- [ ] Allow both named and default imports

### Step 4.3: Create Service READMEs

- [ ] Create `src/lib/services/{type}/README.md` with:
  - [ ] Purpose of the service
  - [ ] Available functions
  - [ ] Usage examples
  - [ ] Error handling patterns

**Template:**
```markdown
# {Service} Service

## Purpose
Business logic for {domain} operations.

## Available Functions

### projectService.fetchAll(filters)
Fetch all projects with optional filters.

### projectService.getById(id)
Get a single project by ID.

### projectService.create(data)
Create a new project.

## Usage Example
```javascript
import { projectService, projectValidation } from '@/services/projects'

const projects = await projectService.fetchAll()
const errors = projectValidation.validateProject(formData)
```
```

### Step 4.4: Create Service Wrapper Index (Optional)

- [ ] Create `src/lib/services/index.js`:
```javascript
export * from './projects/index.js'
export * from './customers/index.js'
export * from './email/index.js'
export * from './invoices/index.js'
export * from './materials/index.js'
```

This allows: `import { projectService } from '@/services'`

### Step 4.5: Update Service Imports

For each service type:

- [ ] Find all imports of that service
- [ ] Update import paths:
  - Old: `import projectService from '@/lib/projectService'`
  - New: `import { projectService } from '@/services/projects'`
- [ ] Update all usages to match new import
- [ ] Test: `npm test`
- [ ] Commit: `git commit -m "refactor: migrate {service} service to new structure"`

---

## Phase 5: Logger Migration

### Step 5.1: Reorganize Logger

- [ ] Create folder structure:
  ```bash
  mkdir -p src/lib/logger/storage
  ```

- [ ] Move files:
  ```bash
  mv src/lib/logger.js src/lib/logger/logger.js
  mv src/lib/errorTracking.js src/lib/logger/errorTracking.js
  mv src/lib/storage/logStorage.js src/lib/logger/storage/logStorage.js
  ```

### Step 5.2: Create Logger Index

- [ ] Create `src/lib/logger/index.js`:
```javascript
export { default as logger } from './logger.js'
export { setupErrorTracking, captureException } from './errorTracking.js'
export { logStorage } from './storage/logStorage.js'
```

### Step 5.3: Create Logger README

- [ ] Create `src/lib/logger/README.md`:
```markdown
# Logger Module

## Purpose
Application logging and error tracking.

## Files
- `logger.js` - Main logging interface
- `errorTracking.js` - Error tracking integration (Sentry)
- `storage/logStorage.js` - Persistent log storage

## Usage

### Basic Logging
```javascript
import logger from '@/lib/logger'

logger.info('User logged in', { userId: user.id })
logger.warn('API timeout', { endpoint: '/projects' })
logger.error('Failed to create project', { error })
logger.debug('Component state', { state })
```

### Error Tracking
```javascript
import { captureException } from '@/lib/logger'

try {
  await riskyOperation()
} catch (error) {
  captureException(error, { 
    tags: { feature: 'project-creation' }
  })
}
```

## Log Levels
- `debug` - Development only
- `info` - General information
- `warn` - Warning conditions
- `error` - Error conditions
```

### Step 5.4: Update Logger Imports

- [ ] Search for logger imports
- [ ] Update paths:
  - Old: `import logger from '@/lib/logger'` (if pointing to file)
  - New: `import logger from '@/lib/logger'` (now points to folder/index)
- [ ] Update error tracking imports
- [ ] Test: `npm test`
- [ ] Commit: `git commit -m "refactor: reorganize logger module"`

---

## Phase 6: Component Migration

### Step 6.1: Move Common Components

For each common component (ErrorBoundary, Modal, etc.):

- [ ] Create folder: `src/components/common/{ComponentName}/`
- [ ] Move component files
- [ ] Create `index.js`:
  ```javascript
  export { default } from './{ComponentName}.jsx'
  // or
  export { ErrorBoundary as default } from './{ComponentName}.jsx'
  ```
- [ ] Create `README.md` with usage

### Step 6.2: Organize Feature Components

- [ ] Move feature-specific components to `src/components/features/{feature}/`
- [ ] Group by feature:
  - Projects: ProjectForm, ProjectList, ProjectCard, etc.
  - Customers: CustomerForm, CustomerDirectory, etc.
  - Analytics: DashboardMetrics, ProjectChart, etc.
  - Batch: BatchImport, BatchExport, etc.
  - Forms: Form components, field components, etc.

### Step 6.3: Create Component READMEs

- [ ] Create `src/components/common/README.md`
- [ ] Create `src/components/features/README.md`
- [ ] Document each component's props and usage

### Step 6.4: Update Component Imports

- [ ] Update imports throughout codebase
- [ ] Change to new paths:
  - Old: `import ProjectForm from '@/components/ProjectForm'`
  - New: `import ProjectForm from '@/components/features/forms/ProjectForm'`
- [ ] Test: `npm test`
- [ ] Verify: `npm run build`
- [ ] Commit: `git commit -m "refactor: reorganize components"`

---

## Phase 7: Final Validation

### Step 7.1: Run Tests

- [ ] Run unit tests: `npm test`
- [ ] All tests should pass
- [ ] Fix any failing tests
- [ ] Commit: `git commit -m "fix: resolve test failures after refactoring"`

### Step 7.2: Check Build

- [ ] Build project: `npm run build`
- [ ] No build errors
- [ ] No build warnings (except expected ones)
- [ ] Check bundle size hasn't increased significantly

### Step 7.3: Verify Imports

- [ ] Search codebase for old import patterns
- [ ] Ensure no `'src/lib/'` imports remain (should use aliases)
- [ ] Verify circular dependencies resolved

**Search patterns to check:**
- `from '@/lib/utils/` (should be `@/utils/`)
- `from '@/lib/api/` (should be `@/api/`)
- `from '@/lib/services/` (should use specific alias)
- `from '@/lib/logger'` (should still work via index)

### Step 7.4: Documentation Check

- [ ] All folder READMEs created
- [ ] IMPORT_CONVENTIONS.md reviewed and accurate
- [ ] FOLDER_REORGANIZATION_PLAN.md updated with completion status
- [ ] Examples in READMEs match actual code

---

## Phase 8: Code Review & Cleanup

### Step 8.1: Prepare for Review

- [ ] Ensure commits are focused and logical
- [ ] Write descriptive commit messages
- [ ] Create pull request with description:
  - [ ] What was reorganized
  - [ ] Why (benefits)
  - [ ] Breaking changes (none expected)
  - [ ] Testing approach
  - [ ] Migration guide link

### Step 8.2: Address Review Comments

- [ ] Respond to all comments
- [ ] Make requested changes
- [ ] Re-run tests after changes
- [ ] Update commit messages if needed

### Step 8.3: Merge and Cleanup

- [ ] Get approval from reviewer
- [ ] Merge pull request
- [ ] Delete feature branch
- [ ] Update team on changes

### Step 8.4: Post-Merge Verification

- [ ] Verify main branch builds: `npm run build`
- [ ] Run tests on main: `npm test`
- [ ] Check deployed version (if applicable)

---

## Quick Reference: File Movements

```
OLD LOCATION                          NEW LOCATION
============================================================
src/lib/utils/                     => src/utils/
src/lib/api/                       => src/lib/api/ (alias: @/api)
src/lib/projectService.js          => src/lib/services/projects/
src/lib/customerService.js         => src/lib/services/customers/
src/lib/emailService.js            => src/lib/services/email/
src/lib/invoiceService.js          => src/lib/services/invoices/
src/lib/invoiceDownloadService.js  => src/lib/services/invoices/
src/lib/materialService.js         => src/lib/services/materials/
src/lib/logger.js                  => src/lib/logger/logger.js
src/lib/errorTracking.js           => src/lib/logger/errorTracking.js
src/lib/storage/logStorage.js      => src/lib/logger/storage/logStorage.js
```

---

## Troubleshooting

### Import errors after migration

**Problem:** `Cannot find module '@/services/projects'`

**Solution:**
1. Verify the file exists: `ls src/lib/services/projects/projectService.js`
2. Check index.js exports: `cat src/lib/services/projects/index.js`
3. Verify vite.config.js has the alias
4. Try: `npm run build` to see detailed error

### Tests failing

**Problem:** Tests still use old import paths

**Solution:**
1. Update test file imports to use new paths
2. Ensure mocks/stubs point to new locations
3. Run: `npm test -- --no-coverage` for faster feedback

### Circular dependency warnings

**Problem:** Webpack/Vite warnings about circular deps

**Solution:**
1. Identify the circular imports in error
2. Move shared code to utils or config
3. Consider breaking imports into separate functions
4. Use lazy imports for heavy modules

### Bundle size increased

**Problem:** Bundle size grew after refactoring

**Solution:**
1. This shouldn't happen as it's organizational only
2. Check if any unnecessary files were added
3. Verify no duplicate exports
4. Run: `npm run analyze` to see breakdown

---

## Success Criteria

Before marking migration as complete:

- [ ] All directories created and organized
- [ ] All files moved to new locations
- [ ] Index files created for service modules
- [ ] READMEs created for all major folders
- [ ] Path aliases working correctly
- [ ] All imports updated to use new paths
- [ ] No old import patterns remain
- [ ] All tests passing
- [ ] Build succeeds with no errors
- [ ] Bundle size unchanged (or smaller)
- [ ] No console warnings about imports
- [ ] Documentation complete and accurate
- [ ] Team trained on new structure
- [ ] Code review approved
- [ ] Changes merged to main

---

## Next Steps After Migration

1. **Monitor for issues**
   - Watch for any import errors in production
   - Monitor performance metrics
   - Gather team feedback

2. **Update onboarding**
   - Update new developer setup docs
   - Include import conventions guide
   - Update code style guide

3. **Remove deprecation wrappers** (if added)
   - Once confident all imports updated
   - Remove old file wrappers
   - Delete old files

4. **Celebrate!**
   - Cleaner codebase
   - Better organization
   - Improved maintainability
   - Happy developers!
