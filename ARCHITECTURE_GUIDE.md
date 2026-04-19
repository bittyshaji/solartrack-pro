# SolarTrack Pro Architecture Guide

Comprehensive guide to the system architecture, design patterns, and component organization.

## System Architecture Overview

### High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│          CLIENT LAYER (React 18 + Vite)                  │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │      UI Components & Pages (Feature-based)         │  │
│  │  Dashboard | Projects | Customers | Reports | Teams│  │
│  └────────────────────────────────────────────────────┘  │
│                           ▲                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │   State Management (Context + Custom Hooks)       │  │
│  │  AuthContext | ProjectContext | Custom Hooks      │  │
│  └────────────────────────────────────────────────────┘  │
│                           ▲                               │
│  ┌────────────────────────────────────────────────────┐  │
│  │      Service & API Layer                          │  │
│  │  • projectService, customerService, etc.          │  │
│  │  • API Abstraction Layer (error, retry, logging)  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
└──────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────┐
│    NETWORK LAYER (HTTP/REST + Real-time WebSockets)     │
│  • Request/Response handling                             │
│  • Authentication token management                        │
│  • Retry logic with exponential backoff                  │
│  • Error recovery                                         │
└──────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────┐
│        BACKEND LAYER (Supabase + PostgreSQL)             │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Authentication (JWT, OAuth, Email Verification)   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │        PostgreSQL Database                        │  │
│  │  Projects | Customers | Invoices | Teams | Tasks  │  │
│  │  Materials | Reports | Proposals | Documents      │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Row Level Security (RLS) Policies                │  │
│  │  • Tenant isolation                                │  │
│  │  • Role-based access control                       │  │
│  │  • Project membership verification                 │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Storage Services (File uploads, Documents)        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

## Architectural Layers

### 1. Presentation Layer

**Location**: `/src/components/`, `/src/pages/`

**Responsibilities**:
- React component rendering
- User interface interactions
- Form display and validation
- Page layout and navigation

**Organization**:
```
src/components/
├── dashboard/        # Dashboard pages and widgets
├── projects/         # Project CRUD and management
├── customers/        # Customer management
├── reports/          # Report generation and display
├── batch/            # CSV import wizard
├── teams/            # Team management
├── common/           # Shared UI components
└── layout/           # Layout components (header, sidebar)
```

**Key Components**:
- `Dashboard.jsx` - Main dashboard with project overview
- `ProjectsList.jsx` - Project listing and filtering
- `ProjectForm.jsx` - Project creation/editing form
- `CSVImportWizard/` - Multi-step CSV import flow
- `ReportGenerator.jsx` - Report creation interface

### 2. State Management Layer

**Location**: `/src/contexts/`, `/src/hooks/`

**Pattern**: React Context API + Custom Hooks

**Global State**:
```javascript
// AuthContext - User authentication and authorization
const { user, isAuthenticated, login, logout, role } = useAuth()

// ProjectContext - Shared project data
const { projects, currentProject, loading } = useProjectContext()
```

**Custom Hooks** (Business Logic Encapsulation):
```javascript
useProjects()           // Fetch and manage multiple projects
useProject()            // Single project with related data
useImportWizard()       // CSV import workflow state
useOfflineStatus()      // Network status detection
useForm()               // Form state management
```

**Benefits**:
- Centralized state management
- Logic reusability across components
- Clear separation of concerns
- Easy to test in isolation

### 3. Service Layer

**Location**: `/src/lib/`

**Responsibilities**:
- Business logic implementation
- Data transformation
- API operation orchestration
- Cross-cutting concerns (logging, error handling)

**Key Services**:

| Service | Purpose | Methods |
|---------|---------|---------|
| **projectService** | Project operations | getProjects(), getProjectById(), createProject(), updateProject(), deleteProject() |
| **customerService** | Customer management | createCustomer(), getAllCustomers(), getCustomerById(), updateCustomer(), searchCustomers() |
| **invoiceService** | Invoice handling | createInvoice(), getProjectInvoices(), getInvoiceById(), updateInvoicePayment() |
| **emailService** | Email notifications | sendEmailViaResend(), queueEmailNotification(), queueInvoiceEmail() |
| **materialService** | Material tracking | addMaterial(), updateMaterial(), deleteMaterial(), getMaterialsByProject() |
| **exportService** | PDF/Excel export | exportProjectAnalyticsPDF(), exportProjectsToExcel(), generateProjectReport() |

### 4. API Abstraction Layer

**Location**: `/src/lib/api/`

**Components**:
- `client.js` - Core CRUD operations and query builder
- `errorHandler.js` - Standardized error handling
- `retry.js` - Automatic retry with exponential backoff
- `interceptors.js` - Request/response hooks

**Features**:
```javascript
// CRUD Operations
select(table, options)           // Fetch records
insert(table, data)              // Create records
update(table, updates, filters)  // Modify records
delete(table, filters)           // Remove records
upsert(table, data)              // Insert or update

// Query Builder
query('projects')
  .filter('status', 'eq', 'active')
  .orderBy('created_at', 'desc')
  .paginate(1, 20)
  .execute()

// Batch Operations
batch.sequence([...operations])  // Sequential execution
batch.parallel([...operations])  // Parallel execution

// Configuration
configureClient({
  enableRetry: true,
  enableLogging: true,
  retryConfig: { maxRetries: 3 }
})
```

**Error Handling**:
```javascript
try {
  const data = await select('projects')
} catch (error) {
  // Standardized error format
  console.error(error.code)      // e.g., 'NETWORK_ERROR'
  console.error(error.message)   // User-friendly message
  console.error(error.details)   // Debugging information
}
```

### 5. Backend Layer

**Technology**: Supabase (PostgreSQL + Auth + Storage)

**Components**:
- **Authentication**: JWT tokens, OAuth integration, email verification
- **Database**: Relational PostgreSQL with normalized schema
- **Row Level Security**: Fine-grained access control policies
- **Storage**: File uploads and document management
- **Real-time**: WebSocket subscriptions for live updates

**Database Tables**:
- `users` - User accounts and profiles
- `projects` - Solar project records
- `customers` - Customer information
- `invoices` - Invoice records
- `materials` - Material inventory
- `tasks` - Project tasks and stages
- `teams` - Team membership and roles

## Data Flow Patterns

### User Authentication Flow

```
Login Form
    ▼
useAuth() Hook
    ▼
AuthContext.login()
    ▼
supabase.auth.signInWithPassword()
    ▼
Supabase Auth Service (JWT generation)
    ▼
AuthContext State Update
    ▼
Protected Routes Active
    ▼
Dashboard/Protected Pages
```

### Data Fetching Flow

```
Component
    ▼
Custom Hook (useProjects, useProject)
    ▼
Service Layer (projectService.getProjects())
    ▼
API Client Layer (select, query)
    ▼
API Abstraction (error handling, retry)
    ▼
Supabase Client
    ▼
PostgreSQL Database
    ▼
Response (with caching)
    ▼
Component State Update
    ▼
UI Render
```

### Error Handling Flow

```
API Call
    ▼
Error Occurs (Network, DB, Auth, etc.)
    ▼
Error Handler (standardize error)
    ▼
Retry Logic (if transient error)
    ▼
Component Error Handler
    ▼
Show Toast Notification
    ▼
Log for Debugging
```

### Form Submission Flow

```
Form Submit
    ▼
React Hook Form Validation
    ▼
Schema Validation (Zod)
    ▼
Service Call (insert/update)
    ▼
API Abstraction Layer
    ▼
Supabase Database Operation
    ▼
Success/Error Response
    ▼
Toast Notification
    ▼
Component State Update
    ▼
UI Update or Redirect
```

## Design Patterns Used

### 1. Context API Pattern
Global state management for authentication and project data:
```javascript
<AuthProvider>
  <ProjectProvider>
    <App />
  </ProjectProvider>
</AuthProvider>
```

### 2. Custom Hooks Pattern
Business logic encapsulation and reusability:
```javascript
const { projects, loading, error, refresh } = useProjects()
```

### 3. Service Layer Pattern
Separation of business logic from UI:
```javascript
// Service handles all database operations
const project = await projectService.getProjectById(id)
// Component uses service result
```

### 4. API Client Abstraction Pattern
Centralized, consistent API communication:
```javascript
// Consistent interface for all database operations
await select('projects', { filters: { status__eq: 'active' } })
```

### 5. Error Handler Pattern
Standardized error processing:
```javascript
// All errors have consistent structure
{ code: 'NETWORK_ERROR', message: '...', details: {...} }
```

### 6. Interceptor Pattern
Cross-cutting concerns (logging, validation, transformation):
```javascript
addBeforeRequestInterceptor((config) => {
  console.log('Request:', config)
  return config
})

addAfterResponseInterceptor((data, context) => {
  console.log('Response:', data)
  return data
})
```

### 7. Retry Strategy Pattern
Automatic failure recovery:
```javascript
// Exponential backoff with jitter
// Attempt 1: delay 100ms
// Attempt 2: delay 200ms
// Attempt 3: delay 400ms (max 10s)
```

### 8. Feature-Based Organization
Code organized by feature, not layer:
```
src/components/projects/     # All project-related components
src/components/customers/    # All customer-related components
```

## Technology Stack Details

### Frontend Stack
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.2.0 | UI library |
| Vite | 5.1.0 | Build tool |
| TypeScript | 5.3.3 | Type safety |
| React Router | 6.22.0 | Routing |
| Tailwind CSS | 3.4.1 | Styling |
| React Context | Built-in | State management |
| Supabase JS | 2.39.0 | Backend client |
| Lucide React | 0.577.0 | Icons |
| Recharts | 2.15.4 | Charts |
| React Hot Toast | 2.6.0 | Notifications |
| jsPDF | 2.5.1 | PDF export |
| XLSX | 0.18.5 | Excel export |
| React Hook Form | 7.72.1 | Forms |
| Zod | 4.3.6 | Validation |
| Vitest | 4.1.4 | Testing |

### Backend Stack
| Technology | Purpose |
|-----------|---------|
| Supabase | Backend services |
| PostgreSQL | Database |
| JWT | Authentication |
| PostgREST | REST API |
| Realtime | WebSocket subscriptions |
| Storage | File management |
| Vercel | Deployment |

## Performance Considerations

### Code Splitting
- Route-based splitting with React.lazy()
- Component-based splitting for heavy components
- Separate chunk for dependencies

### Bundle Optimization
- Tree shaking removes unused code
- Minification in production
- Dynamic imports for large libraries (jsPDF, XLSX)
- GZIP compression on Vercel

### Data Fetching
- Pagination for large datasets
- Selective column queries
- Response caching
- Batch operations support

### Rendering Performance
- React.memo for pure components
- useMemo for expensive calculations
- Virtual scrolling for long lists
- Debouncing for search/filter

### Caching Strategy
- Browser cache headers
- LocalStorage for offline support
- Service Worker for PWA
- API response caching

## Security Architecture

### Authentication & Authorization
- JWT tokens from Supabase Auth
- Protected route components
- Role-based access (Admin, Contractor, Customer)
- Automatic token refresh

### Data Protection
- Row Level Security (RLS) policies
- Tenant isolation by user_id
- HTTPS for all communication
- Data encryption at rest

### Input Validation
- Client-side form validation (Zod)
- Server-side RLS policy enforcement
- TypeScript type checking
- HTML sanitization

### API Security
- Rate limiting from Supabase
- Query validation and filtering
- Error messages don't expose sensitive info
- Security event logging

## Deployment Architecture

### Development Environment
- Local Vite dev server (`npm run dev`)
- Supabase development database
- Environment variables from `.env.local`

### Production Environment
- Vercel edge functions
- Supabase production database
- Environment variables from Vercel config
- Automated CI/CD on git push

## Component Refactoring Patterns

### Before: Monolithic Components
- Single 600+ line component
- Mixed concerns (state, rendering, logic)
- Hard to test
- Low reusability

### After: Modular Components
- Custom hook for business logic
- Feature-specific sub-components
- Clear separation of concerns
- High reusability and testability

**Example: CSV Import Wizard**
```
CSVImportWizard/
├── index.jsx             # Orchestrator (100 lines)
├── FileUploadStep.jsx    # Step component (60 lines)
├── PreviewStep.jsx       # Step component (70 lines)
├── MappingStep.jsx       # Step component (80 lines)
├── ConfirmStep.jsx       # Step component (70 lines)
├── ResultsStep.jsx       # Step component (80 lines)
└── styles.css

hooks/
└── useImportWizard.js    # Business logic (240 lines)
```

## Related Architecture Documents

- **Detailed Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Component Structure**: See [COMPONENT_STRUCTURE.md](./COMPONENT_STRUCTURE.md)
- **API Layer**: See [API_LAYER_SUMMARY.md](./API_LAYER_SUMMARY.md)
- **API Reference**: See `/src/lib/api/README.md`

---

**Last Updated:** April 2026  
**Version:** 0.1.0
