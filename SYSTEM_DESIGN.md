# SolarTrack Pro - System Design Documentation

**Version:** 0.1.0  
**Last Updated:** April 2026  
**Status:** Production-Ready

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [Data Models](#data-models)
3. [API Design](#api-design)
4. [Service Layer Architecture](#service-layer-architecture)
5. [State Management](#state-management)
6. [Error Handling](#error-handling)
7. [Database Schema](#database-schema)
8. [Integration Patterns](#integration-patterns)

---

## Authentication Flow

### Overview

SolarTrack Pro uses Supabase Auth for secure authentication with JWT tokens, email verification, and optional OAuth integration.

### Authentication Methods

1. **Email/Password Authentication**
   - Sign up with email, password, company name, phone
   - Login with email/password
   - Optional "Remember Me" functionality
   - Password reset via email link

2. **OAuth Providers**
   - Google, Microsoft, GitHub, LinkedIn

3. **Security Features**
   - JWT token-based authentication
   - Automatic token refresh
   - Email verification on signup
   - Account approval workflow
   - Strong password requirements (8+ chars, mixed case, numbers, special chars)

### Key Components

- **AuthContext**: React Context managing auth state globally
- **useAuth()**: Custom hook for accessing auth state
- **Supabase Auth Client**: Direct interface to authentication service
- **Auth Schemas**: Zod validation for all auth operations

---

## Data Models

### Core Relationships

```
User (Supabase Auth)
  └─> UserProfile
       └─> Projects (as team member)
       └─> Customers (created by)
       └─> Materials (created by)

Customer
  ├─> Projects (multiple)
  └─> Contacts (multiple)

Project
  ├─> Photos (multiple)
  ├─> Tasks (multiple)
  ├─> Estimates (multiple)
  ├─> Invoices (multiple)
  └─> Materials (multiple)

Material
  └─> Pricing/Supplier info
```

### User Profile

```javascript
{
  id: string,                      // UUID from Supabase Auth
  email: string,
  firstName: string,
  lastName: string,
  companyName: string,
  phone: string,
  avatar: string,
  role: 'admin' | 'manager' | 'user',
  approval_status: 'pending' | 'approved' | 'rejected',
  created_at: timestamp,
  updated_at: timestamp,
}
```

### Project

```javascript
{
  id: string,
  customer_id: string,
  title: string,
  description: text,
  status: 'lead' | 'quoted' | 'approved' | 'in_progress' | 'completed',
  stage: string,
  location: string,
  solar_capacity_kw: decimal,
  estimated_savings: decimal,
  contract_value: decimal,
  start_date: date,
  completion_date: date,
  created_by: string,
  created_at: timestamp,
  updated_at: timestamp,
}
```

---

## API Design

### API Abstraction Layer

All database operations flow through centralized Supabase client:

```
Component -> useService Hook -> Service Class -> Supabase Client
                                                     |
                                           Database / Storage
```

### Service Layer Pattern

Services provide business logic abstraction:

- ProjectService: CRUD + related operations
- CustomerService: Customer management
- InvoiceService: Invoice generation & tracking
- MaterialService: Material database
- EmailService: Email communication

### Error Handling

Standard error response format:

```javascript
{
  success: boolean,
  data: any | null,
  error: {
    code: string,
    message: string,
    details: any,
  } | null,
}
```

---

## Service Layer Architecture

### Service Organization

```
src/lib/services/
├── projects/
├── customers/
├── invoices/
├── materials/
└── email/
```

### Base Service Pattern

All services inherit from BaseService:

```javascript
class BaseService {
  async list(filters, pagination)
  async getById(id)
  async create(data)
  async update(id, data)
  async delete(id)
}
```

### Custom Hooks for Services

```javascript
function useService(serviceCall) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Handle async service calls with proper cleanup
}
```

---

## State Management

### React Context Providers

1. **AuthContext**: User authentication and profile
2. **ProjectDataContext**: Shared project state

### Local State Strategy

Use custom hooks for component-level state:

```javascript
function useProjectForm(initialData = {}) {
  const [formData, setFormData] = useState(initialData)
  const [errors, setErrors] = useState({})
  const [isDirty, setIsDirty] = useState(false)
  
  return { formData, errors, isDirty, handleChange, validate, reset }
}
```

### No Redux

Intentional choice for simplicity:
- Easier maintenance
- Better for team collaboration
- Sufficient for app complexity
- Easier debugging

---

## Error Handling

### Error Types

```javascript
class ApiError extends Error { }         // API/Network errors
class ValidationError extends Error { }  // Input validation
class AuthenticationError extends Error { } // Auth failures
class AuthorizationError extends Error { } // Permission denied
```

### Retry Logic

Exponential backoff for transient failures:
- Max 3 retries
- Skip 4xx errors (client errors)
- Double wait time each attempt

### Error UI Components

- ErrorBoundary: Catch React errors
- Toast notifications: User-friendly messages
- Field errors: Validation feedback

---

## Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| user_profiles | User info | id, email, role, approval_status |
| customers | Customer records | id, company_name, email, created_by |
| projects | Solar projects | id, customer_id, title, status, stage |
| project_photos | Project photos | id, project_id, photo_url |
| materials | Material catalog | id, name, unit_price, supplier |
| invoices | Billing records | id, project_id, invoice_number, status |
| estimates | Project quotes | id, project_id, estimate_number, status |

### Row Level Security

Database enforces access control:

```sql
-- Users access projects they created or are members of
-- Users access customers they created
-- Users access materials they created
```

---

## Integration Patterns

### File Upload/Storage

```javascript
// Upload to Supabase Storage
async function uploadProjectPhoto(projectId, file) {
  const fileName = `${projectId}/${Date.now()}_${file.name}`
  const { data, error } = await supabase.storage
    .from('project-photos')
    .upload(fileName, file)
  
  // Create database record
  await PhotoService.create({ project_id: projectId, photo_url: data.path })
}
```

### Real-time Updates

```javascript
// Subscribe to database changes
const subscription = supabase
  .from('projects')
  .on('*', payload => {
    // Handle INSERT, UPDATE, DELETE events
  })
  .subscribe()
```

### Email Integration

```javascript
// Send emails via Supabase functions
await supabase.functions.invoke('send-email', {
  body: { to, template, variables }
})
```

---

## Deployment & Configuration

### Environment Variables

```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
VITE_API_BASE_URL=...
```

### Build Optimization

- Code splitting by route
- Tree-shaking unused code
- Asset minification
- Service worker support
- Offline capability

---

End of System Design Documentation
