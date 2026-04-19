# SolarTrack Pro - Project Structure

**Purpose:** Understand the organization and purpose of each folder and file.

## Directory Tree

```
solartrack-pro/
├── src/                          # Source code
│   ├── components/               # React components (feature-based organization)
│   │   ├── common/               # Reusable UI components
│   │   │   ├── ErrorBoundary/
│   │   │   ├── FormField/
│   │   │   ├── LoadingSpinner/
│   │   │   ├── Modal/
│   │   │   └── ...
│   │   ├── auth/                 # Authentication components
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignupForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── features/             # Feature-specific components
│   │   │   ├── projects/         # Projects feature
│   │   │   │   ├── ProjectForm/
│   │   │   │   ├── ProjectList/
│   │   │   │   └── ProjectDetail/
│   │   │   ├── customers/        # Customers feature
│   │   │   ├── invoices/         # Invoices feature
│   │   │   ├── materials/        # Materials feature
│   │   │   ├── reports/          # Reports feature
│   │   │   ├── analytics/        # Analytics feature
│   │   │   └── ...
│   │   ├── dashboard/            # Dashboard page
│   │   ├── forms/                # Form components
│   │   └── ...
│   ├── contexts/                 # React Context providers
│   │   ├── AuthContext.jsx       # User authentication state
│   │   └── ProjectDataContext.jsx # Shared project data
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.js            # Auth state hook
│   │   ├── useAsync.js           # Async operation hook
│   │   ├── useForm.js            # Form state hook
│   │   ├── useService.js         # Service call hook
│   │   ├── usePagination.js      # Pagination logic
│   │   └── __tests__/            # Hook tests
│   ├── lib/                      # Utilities and services
│   │   ├── api/                  # API client layer
│   │   │   ├── client.js         # Supabase client wrapper
│   │   │   ├── errorHandler.js   # Error handling
│   │   │   ├── interceptors.js   # Request/response interceptors
│   │   │   └── retry.js          # Retry logic
│   │   ├── services/             # Domain-specific services
│   │   │   ├── projects/
│   │   │   ├── customers/
│   │   │   ├── invoices/
│   │   │   ├── materials/
│   │   │   └── email/
│   │   ├── validation/           # Zod schemas
│   │   │   ├── authSchema.ts
│   │   │   ├── projectSchema.ts
│   │   │   ├── customerSchema.ts
│   │   │   └── ...
│   │   ├── storage/              # File storage utilities
│   │   ├── logger/               # Logging utilities
│   │   ├── supabase.js           # Supabase client init
│   │   └── __tests__/
│   ├── pages/                    # Page components (routes)
│   │   ├── DashboardPage.jsx
│   │   ├── ProjectsPage.jsx
│   │   ├── CustomersPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── types/                    # TypeScript type definitions
│   │   ├── index.ts
│   │   ├── auth.d.ts
│   │   ├── project.d.ts
│   │   ├── customer.d.ts
│   │   └── ...
│   ├── utils/                    # Utility functions
│   │   ├── formatters.js         # Format dates, numbers, etc.
│   │   ├── validators.js         # Validation helpers
│   │   ├── date.js               # Date utilities
│   │   └── ...
│   ├── config/                   # Configuration
│   │   └── constants.js          # App-wide constants
│   ├── test/                     # Test utilities
│   │   ├── setup.js              # Test configuration
│   │   ├── mocks.js              # Mock data
│   │   └── fixtures/
│   ├── App.jsx                   # Root component
│   ├── App.css                   # Global styles
│   ├── main.jsx                  # Application entry point
│   └── index.css                 # Base styles
├── docs/                         # Documentation
│   ├── adr/                      # Architecture Decision Records
│   │   ├── ADR-001-TypeScript-Adoption.md
│   │   ├── ADR-002-API-Abstraction-Layer.md
│   │   └── ...
│   └── PROJECT_STRUCTURE.md      # This file
├── .github/                      # GitHub configuration
│   ├── workflows/                # CI/CD workflows
│   └── ISSUE_TEMPLATE/
├── dist/                         # Build output (generated)
├── node_modules/                 # Dependencies (git-ignored)
├── public/                       # Static assets
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
├── .env.example                  # Environment variables template
├── .env.local                    # Local environment (git-ignored)
├── .eslintrc.cjs                 # ESLint configuration
├── .prettierrc                   # Prettier configuration
├── .gitignore                    # Git ignore rules
├── vite.config.js                # Vite build configuration
├── vitest.config.js              # Vitest test configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
├── package-lock.json             # Dependency lock file
├── ARCHITECTURE.md               # System architecture
├── SYSTEM_DESIGN.md              # Detailed design
├── ONBOARDING.md                 # New developer guide
├── CONTRIBUTING.md               # Contribution guidelines
├── README.md                     # Project overview
└── LICENSE                       # License information
```

---

## Key Directories Explained

### `/src/components`

**Purpose:** All React UI components

**Organization:**
- Grouped by feature (projects, customers, etc.)
- Common components in `/common`
- Co-locate related files (JSX, CSS, tests, hooks)

**When to add here:**
- New UI component
- Visual element
- User interface

### `/src/lib/services`

**Purpose:** Business logic and data operations

**Organization:**
- One folder per domain (projects, customers, etc.)
- Services handle CRUD operations
- Connect components to database

**When to add here:**
- Data fetching logic
- Business rules
- Database operations

### `/src/lib/api`

**Purpose:** API communication abstraction

**Files:**
- `client.js` - Supabase client wrapper
- `errorHandler.js` - Error handling
- `interceptors.js` - Request/response middleware
- `retry.js` - Retry logic

**When to modify:**
- Adding API features
- Changing error handling
- Adding logging

### `/src/lib/validation`

**Purpose:** Input validation schemas (Zod)

**Organization:**
- One schema file per entity (auth, projects, etc.)
- Reusable validator functions
- Type inference from schemas

**When to add here:**
- New form validation
- API input validation
- Data transformation

### `/src/contexts`

**Purpose:** Global state management (React Context)

**Currently:**
- `AuthContext` - User and authentication
- `ProjectDataContext` - Shared project data

**When to add:**
- New global state needed
- State shared by many components
- Avoid for feature-specific state

### `/src/hooks`

**Purpose:** Custom React hooks

**Categories:**
- `useAuth()` - Authentication
- `useAsync()` - Async operations
- `useForm()` - Form state
- `useService()` - Service integration

**When to add:**
- Reusable component logic
- State management
- Side effects

### `/docs/adr`

**Purpose:** Architecture Decision Records

**Includes:** Why decisions were made, rationale, consequences

**When to add:**
- Major architectural decision
- Technical solution to problem
- Document decisions for posterity

---

## Typical Data Flow

```
User Action (Button Click)
         |
         v
Component Handler
         |
         v
Custom Hook (useService, useForm)
         |
         v
Service Class (ProjectService)
         |
         v
API Layer (/lib/api/client.js)
         |
         v
Supabase Database
         |
         v
Response -> Error Handler -> Component Update
```

---

## Common Patterns

### Adding a New Feature

1. Create folder in `/src/components/features/`
2. Add component(s)
3. Create service in `/src/lib/services/` if needed
4. Add validation schema in `/src/lib/validation/` if forms
5. Add types in `/src/types/` if using TypeScript
6. Add tests alongside code
7. Create page in `/src/pages/` if needed

### Typical File Structure for Feature

```
src/components/features/projects/
├── ProjectForm/
│   ├── ProjectForm.jsx
│   ├── ProjectForm.module.css
│   ├── ProjectForm.test.jsx
│   └── useProjectForm.js
├── ProjectList/
│   ├── ProjectList.jsx
│   ├── ProjectCard.jsx
│   └── ProjectList.test.jsx
├── ProjectDetail/
│   ├── ProjectDetail.jsx
│   └── ProjectDetail.test.jsx
└── index.js (barrel export)
```

---

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `ProjectForm.jsx` |
| Hooks | camelCase, `use` prefix | `useProjectForm.js` |
| Utils | camelCase | `formatDate.js` |
| Services | PascalCase, `Service` suffix | `ProjectService.js` |
| Styles | kebab-case | `project-form.module.css` |
| Tests | Original name + `.test` | `ProjectForm.test.jsx` |
| Types | PascalCase | `ProjectData.ts` |

---

## Import Paths

Use absolute imports with `@/` alias:

```javascript
// Good
import { ProjectForm } from '@/components/features/projects'
import { ProjectService } from '@/lib/services/projects'
import { useAuth } from '@/hooks'

// Avoid
import ProjectForm from '../../../../components/features/projects'
```

Configured in `vite.config.js`

---

## Code Organization Principles

1. **Co-location**: Related code lives together
2. **Feature-based**: Group by feature, not type
3. **Scalability**: Easy to add new features
4. **Discoverability**: Easy to find code
5. **Modularity**: Reusable, self-contained pieces
6. **Separation**: Clear boundaries between features

---

## Git-Ignored Files

These are NOT tracked (see `.gitignore`):

- `node_modules/` - Dependencies
- `dist/` - Build output
- `.env.local` - Local environment variables
- `*.log` - Log files
- `.DS_Store` - macOS files
- Other OS-specific files

---

## Dependency Tree

```
React Components
    ├── React Hooks
    ├── React Router
    └── External Libraries
         └── React Context (Auth, Project Data)
              ├── Custom Hooks
              └── Services
                   └── Supabase Client
                        └── Database
```

---

## Best Practices

1. **Keep components focused** - One responsibility
2. **Reuse common components** - `/common` folder
3. **Put logic in services** - Not in components
4. **Co-locate tests** - With tested code
5. **Use consistent naming** - Follow conventions
6. **Document complex code** - Comments/JSDoc
7. **Keep files small** - Under 500 lines
8. **Avoid deep nesting** - Max 3-4 levels
9. **Use barrel exports** - Simplify imports
10. **Test-driven development** - Write tests first

---

For detailed architectural information, see [ARCHITECTURE.md](../ARCHITECTURE.md).
