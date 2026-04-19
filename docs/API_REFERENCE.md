# SolarTrack Pro - API Reference

**Services, hooks, and utilities reference**

## Custom Hooks

### useAuth()

**Purpose**: Access global authentication state

```javascript
import { useAuth } from '@/hooks'

function MyComponent() {
  const {
    user,              // Current authenticated user
    profile,           // User profile from database
    loading,           // Auth loading state
    isAuthenticated,   // Boolean: is user logged in
    isApproved,        // Boolean: is user approved
    isAdmin,           // Boolean: is admin user
    signUp,            // Function: signup user
    signIn,            // Function: login user
    signOut,           // Function: logout user
  } = useAuth()
  
  return <div>{user?.email}</div>
}
```

**Returns**:
```typescript
{
  user: SupabaseUser | null
  profile: UserProfile | null
  loading: boolean
  profileLoading: boolean
  error: string | null
  signUp: (email, password, metadata) => Promise
  signIn: (email, password) => Promise
  signOut: () => Promise
  isAuthenticated: boolean
  isApproved: boolean
  isAdmin: boolean
}
```

### useAsync()

**Purpose**: Manage async operations

```javascript
import { useAsync } from '@/hooks'

function ProjectsList() {
  const { data: projects, loading, error } = useAsync(
    () => ProjectService.list()
  )
  
  if (loading) return <Spinner />
  if (error) return <Error error={error} />
  return <div>{projects.map(p => <ProjectCard key={p.id} project={p} />)}</div>
}
```

**Returns**:
```typescript
{
  data: T | null
  loading: boolean
  error: Error | null
}
```

### useForm()

**Purpose**: Manage form state

```javascript
import { useForm } from '@/hooks'
import { projectSchema } from '@/lib/validation'

function ProjectForm() {
  const { data, errors, isDirty, setFieldValue, validate, submit } = useForm({
    initialValues: { title: '', description: '' },
    schema: projectSchema,
    onSubmit: async (values) => {
      await ProjectService.create(values)
    },
  })
  
  return <form>...</form>
}
```

### useLocalStorage()

**Purpose**: Persist state to localStorage

```javascript
import { useLocalStorage } from '@/hooks'

function ProjectFilter() {
  const [filter, setFilter] = useLocalStorage('projectFilter', 'all')
  
  return (
    <select value={filter} onChange={e => setFilter(e.target.value)}>
      <option value="all">All</option>
      <option value="active">Active</option>
    </select>
  )
}
```

---

## Services

### ProjectService

Project management operations

```javascript
import { ProjectService } from '@/lib/services/projects'

// Get all projects
const projects = await ProjectService.list({
  status: 'active',
  sortBy: 'created_at',
  page: 1,
  limit: 20,
})

// Get single project
const project = await ProjectService.getById('project-id')

// Create project
const newProject = await ProjectService.create({
  title: 'Solar Installation',
  customer_id: 'customer-id',
  contract_value: 50000,
})

// Update project
const updated = await ProjectService.update('project-id', {
  status: 'completed',
})

// Delete project
await ProjectService.delete('project-id')

// Upload photo
const photo = await ProjectService.uploadPhoto('project-id', file)

// Get project with photos
const full = await ProjectService.getProjectFull('project-id')
```

### CustomerService

Customer management

```javascript
import { CustomerService } from '@/lib/services/customers'

// List customers
const customers = await CustomerService.list({ limit: 50 })

// Get customer
const customer = await CustomerService.getById('customer-id')

// Create customer
const newCustomer = await CustomerService.create({
  company_name: 'ABC Solar',
  email: 'contact@abc.com',
  phone: '555-1234',
})

// Update customer
const updated = await CustomerService.update('customer-id', {
  email: 'newemail@abc.com',
})

// Delete customer
await CustomerService.delete('customer-id')
```

### InvoiceService

Invoice management

```javascript
import { InvoiceService } from '@/lib/services/invoices'

// Create invoice
const invoice = await InvoiceService.create({
  project_id: 'project-id',
  invoice_number: 'INV-001',
  total_amount: 5000,
  due_date: new Date(),
})

// Get invoice
const invoice = await InvoiceService.getById('invoice-id')

// Update invoice status
const updated = await InvoiceService.updateStatus('invoice-id', 'paid')

// Generate PDF
const pdf = await InvoiceService.generatePDF('invoice-id')
```

---

## Validation Schemas (Zod)

### Project Schema

```javascript
import { projectSchema } from '@/lib/validation'

// Validate data
const result = projectSchema.safeParse(data)
if (!result.success) {
  console.error(result.error.flatten())
}

// Or throw on error
const valid = projectSchema.parse(data)

// Get type from schema
type ProjectData = z.infer<typeof projectSchema>
```

**Validates**:
- title: required, max 200 chars
- customer_id: required UUID
- solar_capacity_kw: positive number
- contract_value: positive number
- dates: valid dates, start before completion

### Auth Schema

```javascript
import { loginSchema, signupSchema } from '@/lib/validation'

// Login validation
const loginData = loginSchema.parse({
  email: 'user@example.com',
  password: 'SecurePass123!',
})

// Signup validation
const signupData = signupSchema.parse({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  companyName: 'ABC Solar',
  phone: '555-1234',
  acceptTerms: true,
  acceptPrivacy: true,
})
```

---

## Utility Functions

### formatDate()

```javascript
import { formatDate } from '@/utils/formatters'

formatDate(new Date())  // '04/18/2026'
formatDate(new Date(), 'YYYY-MM-DD')  // '2026-04-18'
```

### formatCurrency()

```javascript
import { formatCurrency } from '@/utils/formatters'

formatCurrency(50000)  // '$50,000.00'
formatCurrency(50000, 'EUR')  // '€50,000.00'
```

### calculateSavings()

```javascript
import { calculateSavings } from '@/utils/projectCalculations'

const savings = calculateSavings({
  capacity: 10,  // kW
  rate: 0.15,    // $/kWh
  years: 25,
})
// Returns annual savings
```

---

## API Client

Low-level API operations (usually through services)

```javascript
import { supabaseClient } from '@/lib/api/client'

// Select data
const { data } = await supabaseClient
  .from('projects')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(10)

// Insert
const { data } = await supabaseClient
  .from('projects')
  .insert([{ title: 'New Project' }])
  .select()

// Update
const { data } = await supabaseClient
  .from('projects')
  .update({ status: 'completed' })
  .eq('id', 'project-id')
  .select()

// Delete
const { error } = await supabaseClient
  .from('projects')
  .delete()
  .eq('id', 'project-id')
```

---

## Storage Operations

```javascript
import { uploadPhoto, getSignedUrl } from '@/lib/storage'

// Upload file
const { path } = await uploadPhoto('project-photos', file)

// Get signed download URL
const url = await getSignedUrl('project-photos', path, 3600)

// Delete file
await deleteFile('project-photos', path)
```

---

## Logger

```javascript
import { createLogger } from '@/lib/logger'

const logger = createLogger('MyComponent')

logger.info('User created', { userId: user.id })
logger.warn('Cache miss', { key: 'projects' })
logger.error('Save failed', { error: err, projectId })
logger.debug('Debug info', { state })  // Dev only
```

---

## Error Handling

```javascript
import { ApiError, ValidationError } from '@/lib/api/errorHandler'

try {
  await service.save(data)
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation: error.fields = { title: ['Required'] }
  } else if (error instanceof ApiError) {
    // Handle API error: error.code, error.status
  }
}
```

---

## Response Types

All API responses follow pattern:

```typescript
{
  success: boolean,
  data: T | null,
  error: {
    code: string,
    message: string,
  } | null,
  meta: {
    timestamp: string,
    requestId: string,
  }
}
```

---

## Pagination

```javascript
// Services accept pagination options
const result = await ProjectService.list({}, {
  page: 1,        // 1-indexed
  limit: 20,      // Items per page
})

// Returns
{
  data: Project[],
  pagination: {
    page: 1,
    limit: 20,
    total: 100,
  }
}
```

---

For more details, see:
- [SYSTEM_DESIGN.md](../SYSTEM_DESIGN.md) - Design patterns
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architecture overview
