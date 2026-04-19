# SolarTrack Pro: Folder Reorganization Plan

## Overview

This document outlines a comprehensive, non-breaking migration to reorganize the SolarTrack Pro codebase for improved maintainability, scalability, and developer experience.

**Key Principles:**
- Gradual migration (no forced refactoring)
- Backward compatibility (old imports continue to work)
- Clear conventions and examples
- Minimal disruption to active development

---

## Phase 1: Foundation Setup (Immediate)

### 1.1 Create New Directory Structure

**New directories created:**

```
src/
├── config/                    # Configuration management
│   ├── constants.js          # (Existing) All magic strings
│   ├── environment.js        # (Existing) Environment config
│   └── README.md             # (New) Configuration guide
│
├── utils/                     # Reusable utilities
│   ├── common.js             # (Existing) Common functions
│   ├── formatting.js         # (Existing) Date/number/string formatting
│   ├── storage.js            # (Existing) LocalStorage helpers
│   ├── validation.js         # (New) Validation helpers
│   └── README.md             # (New) Utilities guide
│
├── api/                       # API client and interceptors (via alias)
│   ├── client.js             # (Existing - from lib/api)
│   ├── errorHandler.js       # (Existing - from lib/api)
│   ├── retry.js              # (Existing - from lib/api)
│   ├── interceptors.js       # (Existing - from lib/api)
│   └── README.md             # (New) API usage guide
│
├── lib/
│   ├── services/             # Business logic services
│   │   ├── projects/
│   │   │   ├── projectService.js
│   │   │   ├── projectValidation.js
│   │   │   └── README.md
│   │   ├── customers/
│   │   │   ├── customerService.js
│   │   │   └── README.md
│   │   ├── email/
│   │   │   ├── emailService.js
│   │   │   └── README.md
│   │   ├── invoices/
│   │   │   ├── invoiceService.js
│   │   │   ├── invoiceDownloadService.js
│   │   │   └── README.md
│   │   ├── materials/
│   │   │   ├── materialService.js
│   │   │   └── README.md
│   │   └── README.md
│   │
│   ├── logger/                # Logging and error tracking
│   │   ├── logger.js
│   │   ├── errorTracking.js
│   │   ├── storage/
│   │   │   └── logStorage.js
│   │   └── README.md
│   │
│   └── [existing files]       # To be categorized
│
├── components/
│   ├── common/                # Reusable UI components
│   │   ├── ErrorBoundary/
│   │   │   ├── index.js
│   │   │   └── README.md
│   │   ├── LoadingSpinner/
│   │   │   ├── index.js
│   │   │   └── README.md
│   │   ├── Modal/
│   │   │   ├── index.js
│   │   │   └── README.md
│   │   ├── FormField/
│   │   │   ├── index.js
│   │   │   └── README.md
│   │   └── README.md
│   │
│   └── features/               # Feature-specific components
│       ├── projects/
│       ├── customers/
│       ├── analytics/
│       ├── batch/
│       ├── forms/
│       └── README.md
```

### 1.2 Path Aliases Added to vite.config.js

✓ Added the following aliases:
```javascript
'@/config': './src/config'
'@/utils': './src/utils'
'@/api': './src/lib/api'
'@/services': './src/lib/services'
'@/components': './src/components'
'@/hooks': './src/hooks'
'@/lib': './src/lib'
'@/types': './src/types'
```

---

## Phase 2: Service Layer Organization (Week 1-2)

### 2.1 Migrate Services to Domain-Specific Folders

**Files to move:**

```
src/lib/projectService.js          -> src/lib/services/projects/
src/lib/customerService.js         -> src/lib/services/customers/
src/lib/emailService.js            -> src/lib/services/email/
src/lib/invoiceService.js          -> src/lib/services/invoices/
src/lib/invoiceDownloadService.js  -> src/lib/services/invoices/
src/lib/materialService.js         -> src/lib/services/materials/
```

### 2.2 Create Index Files

Each service folder should have an `index.js`:

```javascript
// src/lib/services/projects/index.js
export { default as projectService } from './projectService.js'
export { default as projectValidation } from './projectValidation.js'

// Usage:
import { projectService, projectValidation } from '@/services/projects'
```

### 2.3 Update All Imports

Search-and-replace pattern:

```javascript
// Old imports
import projectService from '@/lib/projectService'
import customerService from '@/lib/customerService'

// New imports
import { projectService } from '@/services/projects'
import { customerService } from '@/services/customers'
```

---

## Phase 3: Logger Organization (Week 2)

### 3.1 Restructure Logger

**Move:**
```
src/lib/logger.js           -> src/lib/logger/logger.js
src/lib/errorTracking.js    -> src/lib/logger/errorTracking.js
src/lib/storage/logStorage.js -> src/lib/logger/storage/logStorage.js
```

### 3.2 Create Logger Index

```javascript
// src/lib/logger/index.js
export { default as logger } from './logger.js'
export { setupErrorTracking, captureException } from './errorTracking.js'
export { logStorage } from './storage/logStorage.js'
```

---

## Phase 4: API Layer Consolidation (Week 3)

### 4.1 API Files Established

The API layer is in `src/lib/api/`. Now aliased as `@/api`.

### 4.2 Create API Index

```javascript
// src/lib/api/index.js
export { default as apiClient } from './client.js'
export { default as errorHandler } from './errorHandler.js'
export { retryRequest } from './retry.js'
export { setupInterceptors } from './interceptors.js'
```

---

## Phase 5: Utils Layer Completion (Week 3)

### 5.1 Utils Structure

```
src/utils/
├── common.js         (existing)
├── formatting.js     (existing)
├── storage.js        (existing)
├── validation.js     (NEW - extract validation logic)
└── README.md
```

### 5.2 Create Validation Utilities

Extract validation logic from constants:

```javascript
// src/utils/validation.js
import { VALIDATION, PATTERNS } from '@/config/constants'

export function validateEmail(email) {
  return PATTERNS.EMAIL.test(email)
}

export function validatePhone(phone) {
  return PATTERNS.PHONE.test(phone) && 
         phone.length >= VALIDATION.PHONE_MIN_LENGTH
}

export function validateProjectName(name) {
  return name.length >= VALIDATION.PROJECT_NAME_MIN_LENGTH &&
         name.length <= VALIDATION.PROJECT_NAME_MAX_LENGTH
}
```

---

## Phase 6: Component Organization (Week 4)

### 6.1 Common Components

Reusable components in `src/components/common/`:

```
src/components/common/
├── ErrorBoundary/
│   ├── index.js
│   ├── ErrorBoundary.jsx
│   └── README.md
├── LoadingSpinner/
│   ├── index.js
│   ├── LoadingSpinner.jsx
│   └── README.md
├── Modal/
│   ├── index.js
│   ├── Modal.jsx
│   └── README.md
├── FormField/
│   ├── index.js
│   ├── FormField.jsx
│   └── README.md
└── README.md
```

### 6.2 Feature Components

Organized by feature in `src/components/features/`:

```
src/components/features/
├── projects/     (Project-related components)
├── customers/    (Customer-related components)
├── analytics/    (Analytics dashboard components)
├── batch/        (Batch operations components)
├── forms/        (Form-related components)
└── README.md
```

---

## Phase 7: Config & Constants Refinement (Week 4)

### 7.1 Constants Usage

The `src/config/constants.js` file is comprehensive and should be used throughout:

```javascript
import { 
  PROJECT_STATUSES, 
  API_CONFIG, 
  STORAGE_KEYS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
} from '@/config/constants'
```

### 7.2 Environment Configuration

Use `src/config/environment.js` for all config:

```javascript
import { env, isFeatureEnabled } from '@/config/environment'

console.log(env.SUPABASE_URL)
if (isFeatureEnabled('ANALYTICS')) {
  // Setup analytics
}
```

---

## Migration Timeline

| Week | Phase | Key Activities |
|------|-------|-----------------|
| Now | 1 | ✓ Create directories, update vite.config.js, create documentation |
| Week 1-2 | 2 | Migrate services, update imports, test thoroughly |
| Week 2 | 3 | Reorganize logger, create index files |
| Week 3 | 4-5 | Move API files, complete utils layer |
| Week 4 | 6-7 | Move components, verify constants usage |
| Week 5 | 8 | Create final docs, conduct code review |

---

## Backward Compatibility Strategy

### Phase 1: Create New Structure
✓ Done. New files exist alongside old ones.

### Phase 2: Update Imports Gradually

1. Update one module at a time
2. Test after each change
3. Use TypeScript/JSDoc for better IDE support
4. Run unit tests

### Phase 3: Deprecate Old Imports

Add deprecation wrappers:

```javascript
// src/lib/projectService.js (deprecated)
import projectService from './services/projects/projectService.js'
console.warn('Importing from src/lib/projectService is deprecated. Use @/services/projects instead.')
export default projectService
```

### Phase 4: Complete Migration

Once all imports updated, remove deprecation wrappers and old files.

---

## Best Practices During Migration

### 1. Test Thoroughly

- Run unit tests after each change
- Check bundle size: `npm run build`
- Test in development mode

### 2. Use Version Control

- Create feature branches for each phase
- Keep commits small and focused
- Use descriptive commit messages

### 3. Document Changes

- Update this plan as you progress
- Create examples in each README
- Comment code explaining organization

### 4. Code Review

- Get team review on each PR
- Discuss naming and organization
- Ensure consistency

### 5. No Breaking Changes

- Old imports should still work
- Redirect old imports to new locations
- Provide migration guide

---

## Verification Checklist

Before considering migration complete:

- [ ] All new directories created ✓
- [ ] vite.config.js updated with aliases ✓
- [ ] All services moved to `src/lib/services/`
- [ ] Index files created for each service
- [ ] API files have proper index
- [ ] Logger properly organized
- [ ] Utils consolidated
- [ ] Common components moved
- [ ] Feature components organized
- [ ] All imports updated
- [ ] Unit tests passing
- [ ] Bundle size acceptable
- [ ] No console warnings
- [ ] Documentation complete ✓
- [ ] Team trained on new structure

---

## FAQ

**Q: Can I use old imports while migrating?**
A: Yes! We're providing deprecation wrappers so old imports continue to work during the transition.

**Q: When do I have to migrate?**
A: Gradual. New code uses the new structure. Old code migrates incrementally.

**Q: What if I need to import from multiple folders?**
A: Path aliases make this clean:
```javascript
import { projectService } from '@/services/projects'
import { env } from '@/config/environment'
import { formatDate } from '@/utils/formatting'
```

**Q: How does this affect testing?**
A: Makes it easier! Test by domain/feature rather than file type.

**Q: Will this slow down the app?**
A: No. This is purely organizational. Bundle size and performance unchanged.

---

## Next Steps

1. Review this plan with the team
2. Create individual folder READMEs (see separate guides)
3. Begin Phase 2: Service layer migration
4. Update documentation as you progress
5. Conduct team review when complete
