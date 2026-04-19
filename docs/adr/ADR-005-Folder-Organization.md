# ADR-005: Feature-Based Folder Organization

**Status:** Accepted  
**Date:** March 2024

## Context

SolarTrack Pro grew in complexity with multiple features (projects, customers, invoices, materials, analytics). We needed a clear folder structure that:

- Groups related code together
- Scales with the app
- Makes navigation intuitive
- Supports team organization
- Enables feature teams

## Decision

Organize source code by feature rather than by type.

## Rationale

### Feature-Based Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components (Button, Modal, etc.)
│   ├── auth/            # Auth-related components
│   ├── features/        # Feature-specific component groups
│   │   ├── projects/
│   │   ├── customers/
│   │   ├── invoices/
│   │   ├── materials/
│   │   ├── reports/
│   │   └── analytics/
│   ├── dashboard/
│   ├── forms/
│   └── updates/
├── contexts/            # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utilities and services
│   ├── api/            # API client and interceptors
│   ├── services/       # Domain-specific services
│   │   ├── projects/
│   │   ├── customers/
│   │   ├── invoices/
│   │   └── materials/
│   ├── validation/     # Zod schemas
│   ├── storage/        # Local storage utilities
│   ├── logger/         # Logging utilities
│   └── __tests__/
├── pages/              # Page components (routed)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── config/             # Configuration files
└── test/               # Test utilities and setup
```

## Advantages

### 1. Feature Team Autonomy

Each feature team owns:
- Components
- Services
- Hooks
- Tests
- Types

Example: Project team modifies `/src/components/features/projects/` without touching other features.

### 2. Co-location

Related code lives together:
- Easier to find related code
- Clear dependencies
- Self-contained features
- Reduced context switching

### 3. Scalability

Easy to add new features:
- New feature = new folder
- Follows established pattern
- Clear guidelines

### 4. Code Splitting

Vite naturally code-splits by feature:
- Load features on demand
- Smaller initial bundle
- Better performance

### 5. Maintainability

- Find code faster
- Easier refactoring within feature
- Clear responsibility boundaries

## Component Organization Example

```
src/components/features/projects/
├── ProjectForm/              # Feature component
│   ├── ProjectForm.jsx
│   ├── ProjectForm.test.jsx
│   ├── useProjectForm.js
│   └── validation.js
├── ProjectList/
│   ├── ProjectList.jsx
│   ├── ProjectCard.jsx
│   └── ProjectList.test.jsx
├── ProjectDetail/
│   ├── ProjectDetail.jsx
│   ├── ProjectTabs.jsx
│   ├── useProjectDetail.js
│   └── ProjectDetail.test.jsx
└── index.js              # Barrel export
```

## Service Organization Example

```
src/lib/services/projects/
├── ProjectService.js     # Main service class
├── ProjectService.test.js
├── ProjectPhotoService.js
├── constants.js
├── types.ts
└── index.js             # Barrel export
```

## Shared Code Organization

Code used across features lives in:

```
src/components/common/     # Reusable UI components
src/lib/api/              # API client abstraction
src/hooks/                # Generic hooks (useAsync, useForm, etc.)
src/utils/                # Utility functions
src/types/                # Type definitions
```

## Barrel Exports

Each feature exports clean public API:

```javascript
// src/components/features/projects/index.js
export { ProjectForm } from './ProjectForm/ProjectForm'
export { ProjectList } from './ProjectList/ProjectList'
export { ProjectDetail } from './ProjectDetail/ProjectDetail'

// Usage in other components
import { ProjectForm, ProjectList } from '@/components/features/projects'
```

## Consequences

### Positive

- Clear code organization
- Easy navigation
- Feature team autonomy
- Natural code splitting
- Reduced merge conflicts
- Self-documenting structure

### Negative

- Some cross-feature duplication possible
- Requires discipline to maintain
- Shared components must be in right place

### Mitigation

- Shared components live in `/components/common`
- Services only in `/lib/services`
- Clear guidelines in CONTRIBUTING.md

## Alternatives Considered

### Type-Based (old structure)

```
src/
├── components/
├── hooks/
├── services/
└── types/
```

Rejected: Doesn't scale; difficult navigation; poor for teams.

### Domain-Driven Design (more complex)

Rejected: Overkill for current scale; better for very large systems.

## Import Paths

Use absolute imports with `@/` alias:

```javascript
// Instead of
import Form from '../../../../components/features/projects/ProjectForm'

// Use
import { ProjectForm } from '@/components/features/projects'
```

Configured in `vite.config.js`:

```javascript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src')
  }
}
```

## Migration Path

Existing code gradually migrated to feature-based structure:
- [x] Create feature folders
- [x] Move components
- [x] Move services
- [ ] Complete refactoring (ongoing)

## Related ADRs

- ADR-002: API Abstraction Layer
- ADR-008: Form Validation

## File Naming Conventions

- Components: PascalCase (ProjectForm.jsx)
- Hooks: camelCase, prefixed with 'use' (useProjectForm.js)
- Services: PascalCase with 'Service' suffix (ProjectService.js)
- Utils: camelCase (formatDate.js)
- Tests: .test.js or .spec.js suffix
