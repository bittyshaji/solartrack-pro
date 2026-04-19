# SolarTrack Pro - System Architecture Documentation

## Overview

SolarTrack Pro is a comprehensive solar project management platform built with modern web technologies. It provides tools for managing solar installations, customer relationships, project workflows, and team collaboration.

**Version:** 0.1.0  
**Status:** Production-Ready  
**Last Updated:** April 2026

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Data Flow](#data-flow)
4. [Architectural Patterns](#architectural-patterns)
5. [Performance Considerations](#performance-considerations)
6. [Security Considerations](#security-considerations)

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React + Vite)                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           UI Components & Pages                         │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ Dashboard | Projects | Customers | Reports | Teams│ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ▲                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    State Management & Routing                          │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ React Context | React Router | Custom Hooks       │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ▲                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    API & Service Layer                                │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ Supabase Client | Error Handling | Retry Logic    │ │   │
│  │  │ API Interceptors | Logging                         │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         NETWORK LAYER (HTTP/REST)                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Authentication | Data Sync | Real-time Updates           │  │
│  │ Offline Queue Management | Error Recovery                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│         BACKEND LAYER (Supabase/PostgreSQL)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    Authentication Service                              │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ JWT Tokens | OAuth | Email Verification          │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    PostgreSQL Database                                │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ Projects | Customers | Teams | Materials | Tasks  │ │   │
│  │  │ Invoices | Proposals | Reports | Attachments      │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    Row Level Security (RLS) Policies                   │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ Tenant Isolation | Role-based Access               │ │   │
│  │  │ Project Membership Verification                     │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │    Storage Services                                   │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │ Document Storage | Photo Uploads | File Management│ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Architectural Layers

#### 1. Presentation Layer
- **React Components**: Feature-based organization
- **Pages**: Route-mapped pages for major sections
- **UI Components**: Reusable component library
- **Styling**: Tailwind CSS for responsive design

#### 2. State Management Layer
- **React Context API**: Global authentication state
- **Project Data Context**: Shared project information
- **Custom Hooks**: Business logic encapsulation
- **Local Component State**: UI-specific state

#### 3. Service Layer
- **API Client**: Centralized Supabase communication
- **Domain Services**: Business logic for each domain
- **Error Handling**: Consistent error processing
- **Logging & Monitoring**: Application observability

#### 4. Data Access Layer
- **API Abstraction Layer**: Query builder and client
- **Retry Logic**: Automatic retry on failures
- **Interceptors**: Request/response processing
- **Cache Management**: Client-side data caching

#### 5. Backend Layer
- **Supabase**: PostgreSQL + Auth + Storage
- **Database Schema**: Normalized relational model
- **RLS Policies**: Fine-grained access control
- **Webhooks**: Real-time event triggers

---

## Technology Stack

### Frontend Technologies

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Framework** | React | 18.2.0 | UI component library |
| **Build Tool** | Vite | 5.1.0 | Fast module bundler |
| **Type System** | TypeScript | 5.3.3 | Type safety |
| **Routing** | React Router | 6.22.0 | Client-side routing |
| **Styling** | Tailwind CSS | 3.4.1 | Utility-first CSS |
| **State Mgmt** | React Context | Built-in | Global state |
| **HTTP Client** | Supabase JS | 2.39.0 | Backend communication |
| **UI Components** | Lucide React | 0.577.0 | Icon library |
| **Charts** | Recharts | 2.15.4 | Data visualization |
| **Notifications** | React Hot Toast | 2.6.0 | Toast messages |
| **PDF Export** | jsPDF | 2.5.1 | PDF generation |
| **Excel Export** | XLSX | 0.18.5 | Spreadsheet generation |
| **Testing** | Vitest | 4.1.4 | Unit testing |
| **DOM Testing** | Testing Library | 16.3.2 | Component testing |

### Backend Technologies

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Database** | PostgreSQL | Relational data storage |
| **Auth** | Supabase Auth | User authentication |
| **API** | Supabase PostgREST | RESTful API |
| **Real-time** | Supabase Realtime | Live subscriptions |
| **Storage** | Supabase Storage | File uploads & management |
| **Hosting** | Vercel | Deployment platform |

### Development Tools

| Tool | Purpose |
|------|---------|
| Node.js | JavaScript runtime |
| npm | Package manager |
| Git | Version control |
| VSCode | Code editor |
| Vitest | Test runner |
| TypeScript Compiler | Type checking |

---

## Data Flow

### Authentication Flow

```
┌─────────────────┐
│  Login Page     │
│  (user input)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  AuthContext.login()                │
│  - Validate input                   │
│  - Call supabase.auth.signInWithPassword()
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Supabase Auth Service              │
│  - Verify credentials                │
│  - Generate JWT token               │
│  - Store in localStorage            │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Update AuthContext State            │
│  - user object                        │
│  - isAuthenticated flag               │
│  - Trigger re-render                 │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Redirect to Dashboard               │
│  Protected Routes active             │
└──────────────────────────────────────┘
```

### Project Data Flow

```
Components
    ▲
    │ (subscribe to state)
    │
    ▼
Custom Hooks (useProjects, useProject)
    ▲
    │ (call functions)
    │
    ▼
Service Layer (projectService, stageTaskService)
    ▲
    │ (execute queries)
    │
    ▼
API Client Layer (apiClient.select, apiClient.update)
    ▲
    │ (with retry, logging, error handling)
    │
    ▼
Supabase Client
    ▲
    │ (HTTP requests)
    │
    ▼
PostgreSQL Database
```

### Error Handling Flow

```
User Action
    ▼
Service Layer Call
    ▼
API Client
    ▼
Supabase
    ▼
Error Occurs
    ▼
Retry Logic (if applicable)
    ▼
Error Handler
    ├─ Log error
    ├─ Map to error code
    ├─ Generate user message
    ├─ Track in error system
    └─ Return structured error
    ▼
Component/Service
    ├─ Show toast notification
    ├─ Update UI state
    └─ Log for debugging
```

---

## Architectural Patterns

### 1. Context API Pattern
Used for global state management:
```javascript
// AuthContext provides:
// - user object
// - isAuthenticated flag
// - login/logout functions
// - role-based access control

const { user, isAuthenticated, login, logout } = useAuth()
```

### 2. Custom Hooks Pattern
Encapsulate business logic:
```javascript
// useProjects - manages project fetching and mutations
// useProject - manages single project with related data
// useImportWizard - manages CSV import workflow
// useOfflineStatus - manages offline detection
```

### 3. Service Layer Pattern
Separate concerns between API calls and business logic:
```javascript
// projectService.js - project operations
// customerService.js - customer operations
// emailService.js - email operations
```

### 4. API Client Abstraction Pattern
Centralized API communication:
```javascript
const apiClient = {
  select: (table, filters, options) => Promise
  insert: (table, data) => Promise
  update: (table, data, filters) => Promise
  delete: (table, filters) => Promise
  upsert: (table, data) => Promise
}
```

### 5. Error Handler Pattern
Consistent error processing:
```javascript
// Structured error codes (PROJECT_NOT_FOUND, AUTH_REQUIRED, etc.)
// Error tracking integration
// User-friendly messages
// Developer-friendly debugging info
```

### 6. Interceptor Pattern
Request/response processing:
```javascript
// Before request: Add auth headers, logging
// After response: Process data, caching
// On error: Logging, retry decisions
```

### 7. Retry Strategy Pattern
Automatic failure recovery:
```javascript
// Exponential backoff
// Configurable max retries
// Specific error code handling
// Timeout management
```

### 8. Feature-Based Folder Organization
Organize code by features:
```
src/
├── components/
│   ├── projects/        # Project feature
│   ├── customers/       # Customer feature
│   ├── teams/          # Team feature
│   └── dashboard/      # Dashboard feature
```

---

## Performance Considerations

### 1. Code Splitting
- **Route-based**: Each page lazy-loaded
- **Component-based**: Heavy components loaded on demand
- Implementation: React.lazy() and Suspense

### 2. Bundle Optimization
- **Tree shaking**: Unused code removed
- **Minification**: Production builds minified
- **Compression**: GZIP enabled on Vercel
- **Analysis**: Build analysis available via npm run build

### 3. Data Fetching Optimization
- **Pagination**: Large datasets paginated
- **Selective columns**: Query only needed columns
- **Caching**: Response caching in service layer
- **Batch operations**: Multiple records in single request

### 4. Image & File Optimization
- **Lazy loading**: Images load on intersection
- **Compression**: Files compressed on upload
- **CDN**: Supabase Storage with CDN
- **Format selection**: Appropriate formats for content

### 5. Rendering Performance
- **Memoization**: useMemo for expensive calculations
- **Component optimization**: React.memo for pure components
- **Virtual scrolling**: Large lists virtualized
- **Debouncing**: Search and filter operations debounced

### 6. Caching Strategy
- **HTTP cache**: Browser caching headers
- **LocalStorage**: Offline support and quick load
- **Service Worker**: PWA caching
- **Query cache**: API response caching

---

## Security Considerations

### 1. Authentication & Authorization
- **JWT Tokens**: Supabase Auth handles token generation
- **Protected Routes**: ProtectedRoute component wraps sensitive routes
- **Role-based Access**: Admin, contractor, customer roles
- **Token Refresh**: Automatic token refresh on expiry
- **Logout Cleanup**: Tokens cleared on logout

### 2. Data Protection
- **Row Level Security**: PostgreSQL RLS policies enforce access
- **Tenant Isolation**: Multi-tenant data segregation
- **Encryption**: Supabase handles data encryption at rest
- **HTTPS**: All communication over HTTPS
- **CORS**: Supabase handles CORS configuration

### 3. Input Validation
- **Client-side**: Form validation before submission
- **Server-side**: Supabase RLS policies enforce rules
- **Type checking**: TypeScript types catch errors
- **Sanitization**: HTML sanitization for user inputs

### 4. API Security
- **Rate limiting**: Supabase rate limiting
- **Query validation**: Strict filter and column validation
- **Error handling**: Sensitive info not exposed in errors
- **Logging**: Security events logged and monitored

### 5. Storage Security
- **File uploads**: Validated for type and size
- **Access control**: Supabase Storage RLS policies
- **Deletion**: Secure file deletion on removal
- **Virus scanning**: Optional antivirus scanning

### 6. Sensitive Data Handling
- **API keys**: Environment variables, never exposed
- **Passwords**: Never stored or logged
- **Personal info**: Minimal collection and secure storage
- **PII**: Excluded from logging systems

### 7. Session Management
- **Session timeout**: Auto-logout after inactivity
- **Concurrent sessions**: One session per device
- **Session data**: Stored securely in browser
- **CSRF protection**: Supabase handles CSRF

### 8. Monitoring & Alerting
- **Error tracking**: Integration with error tracking service
- **Suspicious activity**: Logged for security review
- **Access logs**: User activity tracked
- **Audit trail**: Important actions logged

---

## Integration Points

### External Services
- **Supabase**: Backend, Auth, Database, Storage
- **Vercel**: Deployment and hosting
- **Email Service**: Transactional emails
- **PDF Libraries**: Report generation

### APIs
- **Supabase REST API**: Data operations
- **Supabase Auth API**: Authentication
- **Supabase Storage API**: File operations

---

## Deployment Architecture

### Development
- **Local dev server**: Vite dev server (localhost:5173)
- **Database**: Supabase development instance
- **Environment**: .env.local with dev credentials

### Production
- **Hosting**: Vercel edge functions
- **Database**: Supabase production instance
- **Environment**: Environment variables from Vercel
- **Build**: Automated CI/CD on git push

### Environment Configuration
```
Development: .env.local (dev credentials)
Production: Vercel env vars (prod credentials)
```

---

## Key Metrics & Monitoring

### Performance Metrics
- **First Contentful Paint (FCP)**: < 2s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.5s

### Reliability Metrics
- **Uptime**: 99.9% target
- **Error Rate**: < 0.1%
- **Availability**: Zero-downtime deployments

### User Experience Metrics
- **Page Load Time**: < 2s
- **Response Time**: < 500ms for actions
- **Offline Functionality**: Critical features work offline

---

## Related Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development setup and workflow
- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) - Detailed design decisions
- [Architecture Decision Records](./docs/adr/) - Specific technical decisions
- [API Documentation](./src/lib/api/README.md) - API client usage
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Folder organization

---

**Last Updated:** April 18, 2026  
**Maintained By:** Development Team  
**Review Cycle:** Quarterly
