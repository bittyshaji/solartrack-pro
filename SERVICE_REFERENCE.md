# Service Reference Guide - SolarTrack Pro

Complete reference for all services, utilities, and their methods.

## API Abstraction Layer

**Location**: `/src/lib/api/`

### Core API Client (`/src/lib/api/client.js`)

#### CRUD Operations

**select(table, options)** - Fetch records
```javascript
// Simple fetch
const projects = await select('projects')

// With filters
const active = await select('projects', {
  filters: { status__eq: 'active' }
})

// With pagination
const page1 = await select('projects', {
  pagination: { page: 1, limit: 20 }
})

// Selective columns
const names = await select('projects', {
  columns: ['id', 'name', 'status']
})

// Combined
const results = await select('projects', {
  filters: { status__eq: 'active' },
  orderBy: { column: 'created_at', direction: 'desc' },
  pagination: { page: 1, limit: 10 }
})
```

**insert(table, data)** - Create records
```javascript
// Single record
const project = await insert('projects', {
  name: 'Solar Array Installation',
  capacity_kw: 10,
  status: 'Planning'
})

// Returns created record with generated ID
```

**update(table, updates, filters)** - Modify records
```javascript
// Update by ID
const updated = await update('projects', 
  { status: 'In Progress', updated_at: new Date() },
  { id__eq: projectId }
)

// Update multiple records
const batch = await update('projects',
  { status: 'Completed' },
  { project_state__eq: 'Execution' }
)
```

**delete(table, filters)** - Remove records
```javascript
// Delete by ID
await delete('projects', { id__eq: projectId })

// Soft delete (mark as deleted)
await update('projects',
  { deleted_at: new Date() },
  { id__eq: projectId }
)
```

**upsert(table, data, onConflict)** - Insert or update
```javascript
const result = await upsert('projects', 
  {
    id: projectId,
    name: 'Solar Array',
    status: 'Active'
  },
  'id'  // Conflict column
)
```

#### Utility Operations

**count(table, filters)** - Count matching records
```javascript
const activeCount = await count('projects', {
  status__eq: 'active'
})

const total = await count('projects')
```

**exists(table, filters)** - Check record existence
```javascript
const hasProjects = await exists('projects', {
  customer_id__eq: customerId
})
```

**query(table)** - Build complex queries
```javascript
const results = await query('projects')
  .filter('status', 'eq', 'active')
  .filter('capacity_kw', 'gte', 5)
  .orderBy('created_at', 'desc')
  .paginate(1, 20)
  .execute()
```

#### Batch Operations

**batch.sequence(operations)** - Execute in order
```javascript
const results = await batch.sequence([
  { operation: 'insert', table: 'projects', data: {...} },
  { operation: 'insert', table: 'customers', data: {...} },
  { operation: 'update', table: 'projects', updates: {...}, filters: {...} }
])
```

**batch.parallel(operations)** - Execute simultaneously
```javascript
const results = await batch.parallel([
  { operation: 'select', table: 'projects' },
  { operation: 'select', table: 'customers' },
  { operation: 'select', table: 'invoices' }
])
```

#### Configuration

**configureClient(config)** - Configure API behavior
```javascript
configureClient({
  enableRetry: true,
  retryConfig: {
    maxRetries: 5,
    initialDelay: 100,
    maxDelay: 10000,
    multiplier: 2
  },
  enableLogging: true,
  timeout: 30000
})
```

**getClientConfig()** - Retrieve current configuration
```javascript
const config = getClientConfig()
console.log(config.enableRetry)
```

### Error Handler (`/src/lib/api/errorHandler.js`)

**Error Codes** - All standardized error codes
```javascript
ERROR_CODES = {
  // Authentication
  AUTH_ERROR: 'AUTH_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // Database
  DATABASE_ERROR: 'DATABASE_ERROR',
  DUPLICATE_KEY: 'DUPLICATE_KEY',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',
  
  // Server
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_GATEWAY: 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}
```

**Standardized Error Format**
```javascript
{
  code: 'ERROR_CODE',           // Machine-readable error code
  message: 'User-friendly text', // Display in UI
  details: {                      // Debug information
    originalError: {...},
    timestamp: Date,
    context: {...}
  }
}
```

**Error Handling Example**
```javascript
try {
  const data = await select('projects')
} catch (error) {
  if (error.code === ERROR_CODES.NETWORK_ERROR) {
    console.error('Network unavailable (already retried)')
    // Show offline message
  } else if (error.code === ERROR_CODES.UNAUTHORIZED) {
    console.error('Please log in again')
    // Redirect to login
  } else if (error.code === ERROR_CODES.RECORD_NOT_FOUND) {
    console.error('Project not found')
    // Show 404 page
  }
  // Always has code, message, details
}
```

### Retry Handler (`/src/lib/api/retry.js`)

**withRetry(fn, customConfig)** - Execute function with retry
```javascript
const data = await withRetry(async () => {
  return await select('projects')
}, {
  maxRetries: 5,
  initialDelay: 100,
  maxDelay: 15000,
  multiplier: 2,
  enableJitter: true
})
```

**isRetryableError(error)** - Check if error is retryable
```javascript
if (isRetryableError(error)) {
  // Retry will be attempted
} else {
  // Error won't be retried
}
```

Retryable errors:
- TIMEOUT_ERROR
- CONNECTION_ERROR
- NETWORK_ERROR
- SERVICE_UNAVAILABLE
- BAD_GATEWAY

### Interceptors (`/src/lib/api/interceptors.js`)

**addBeforeRequestInterceptor(callback)** - Hook before request
```javascript
addBeforeRequestInterceptor((config) => {
  console.log('Request:', config.operation, config.table)
  // Validate, transform, log
  return config
})
```

**addAfterResponseInterceptor(callback)** - Hook after response
```javascript
addAfterResponseInterceptor((data, context) => {
  console.log('Response from', context.table, ':', data.length, 'records')
  // Transform data, validate, cache
  return data
})
```

**addErrorInterceptor(callback)** - Hook on error
```javascript
addErrorInterceptor((error, context) => {
  console.error('Error in', context.operation, error.code)
  // Log, transform error
  return error
})
```

**createLoggingInterceptors(verbose)** - Setup logging
```javascript
const { before, after, error } = createLoggingInterceptors(true)
addBeforeRequestInterceptor(before)
addAfterResponseInterceptor(after)
addErrorInterceptor(error)
```

---

## Domain Services

**Location**: `/src/lib/`

### Project Service (`projectService.js`)

**getProjects(filters, options)** - Fetch multiple projects
```javascript
const projects = await projectService.getProjects()
const active = await projectService.getProjects({ status: 'active' })
```

**getProjectById(id)** - Fetch single project
```javascript
const project = await projectService.getProjectById(projectId)
// Returns: { id, name, status, customer_id, ... }
```

**createProject(data)** - Create new project
```javascript
const project = await projectService.createProject({
  name: 'Residential Solar Installation',
  customer_id: customerId,
  capacity_kw: 5.5,
  location: 'Mumbai, Maharashtra',
  status: 'Planning',
  notes: 'Rooftop installation'
})
```

**updateProject(id, data)** - Update project
```javascript
await projectService.updateProject(projectId, {
  status: 'In Progress',
  notes: 'Updated notes'
})
```

**deleteProject(id)** - Delete project (soft delete)
```javascript
await projectService.deleteProject(projectId)
```

**getProjectStats(id)** - Get project statistics
```javascript
const stats = await projectService.getProjectStats(projectId)
// Returns: { total_cost, tasks_count, completion_percentage, ... }
```

### Customer Service (`customerService.js`)

**createCustomer(data)** - Create new customer
```javascript
const customer = await customerService.createCustomer({
  first_name: 'Rajesh',
  last_name: 'Kumar',
  email: 'rajesh@example.com',
  phone: '+91-9876543210',
  company: 'ABC Corporation',
  address: 'Mumbai, Maharashtra'
})
```

**getAllCustomers(options)** - Fetch all customers
```javascript
const customers = await customerService.getAllCustomers()
const sorted = await customerService.getAllCustomers({
  orderBy: 'created_at',
  direction: 'desc'
})
```

**getCustomerById(id)** - Fetch single customer
```javascript
const customer = await customerService.getCustomerById(customerId)
```

**updateCustomer(id, data)** - Update customer
```javascript
await customerService.updateCustomer(customerId, {
  email: 'newemail@example.com',
  phone: '+91-9876543211'
})
```

**deactivateCustomer(id)** - Soft delete customer
```javascript
await customerService.deactivateCustomer(customerId)
```

**searchCustomers(query)** - Search by name/email
```javascript
const results = await customerService.searchCustomers('Rajesh')
```

**getCustomerCount()** - Count total customers
```javascript
const total = await customerService.getCustomerCount()
```

### Invoice Service (`invoiceService.js`)

**createInvoice(data)** - Create new invoice
```javascript
const invoice = await invoiceService.createInvoice({
  project_id: projectId,
  invoice_number: 'INV-2026-001',
  total_amount: 50000,
  status: 'pending',
  due_date: new Date('2026-05-15')
})
```

**getProjectInvoices(projectId)** - Fetch project invoices
```javascript
const invoices = await invoiceService.getProjectInvoices(projectId)
```

**getInvoiceById(id)** - Fetch single invoice
```javascript
const invoice = await invoiceService.getInvoiceById(invoiceId)
```

**updateInvoicePayment(id, paymentData)** - Record payment
```javascript
await invoiceService.updateInvoicePayment(invoiceId, {
  status: 'paid',
  paid_amount: 50000,
  payment_date: new Date()
})
```

### Email Service (`emailService.js`)

**sendEmailViaResend(emailData)** - Send email
```javascript
await emailService.sendEmailViaResend({
  to: 'customer@example.com',
  subject: 'Project Update',
  template: 'project_notification',
  data: { projectName: 'Solar Array' }
})
```

**queueEmailNotification(data)** - Queue email for sending
```javascript
await emailService.queueEmailNotification({
  recipient_id: customerId,
  email_type: 'project_notification',
  data: { projectId: projectId }
})
```

**queueInvoiceEmail(invoiceId, recipientEmail)** - Queue invoice email
```javascript
await emailService.queueInvoiceEmail(invoiceId, 'customer@example.com')
```

### Material Service (`materialService.js`)

**addMaterial(data)** - Add material to project
```javascript
const material = await materialService.addMaterial({
  project_id: projectId,
  name: 'Solar Panel (400W)',
  quantity: 10,
  unit_cost: 25000,
  supplier: 'Solar Tech Inc.'
})
```

**updateMaterial(id, data)** - Update material
```javascript
await materialService.updateMaterial(materialId, {
  quantity: 12,
  unit_cost: 24000
})
```

**deleteMaterial(id)** - Delete material
```javascript
await materialService.deleteMaterial(materialId)
```

**getMaterialsByProject(projectId)** - Fetch project materials
```javascript
const materials = await materialService.getMaterialsByProject(projectId)
```

### Export Service (`exportService.js`)

**exportProjectAnalyticsPDF(projectId, options)** - Generate project PDF
```javascript
const pdfBlob = await exportService.exportProjectAnalyticsPDF(projectId, {
  includeChart: true,
  includeTimeline: true
})
// Triggers download
```

**exportProjectsToExcel(projects, options)** - Generate Excel file
```javascript
const excelBlob = await exportService.exportProjectsToExcel(projectList, {
  columns: ['name', 'status', 'capacity_kw', 'customer']
})
// Triggers download
```

**generateProjectReport(projectId, format)** - Generate report
```javascript
const report = await exportService.generateProjectReport(projectId, 'pdf')
// Returns: { html, pdf, excel }
```

### Batch Export Service (`batchExportService.js`)

**formatXLSXWorkbook(data, headers, options)** - Format Excel workbook
```javascript
const workbook = await batchExportService.formatXLSXWorkbook(
  projectsArray,
  ['name', 'status', 'total_cost'],
  { headerStyle: 'bold' }
)
```

**downloadMultipleReports(reportIds)** - Download multiple reports
```javascript
const zip = await batchExportService.downloadMultipleReports([
  reportId1, reportId2, reportId3
])
// Returns ZIP file
```

---

## Custom Hooks

**Location**: `/src/hooks/`

### useAuth

**Purpose**: Authentication state and operations

```javascript
const {
  user,              // Current user object
  isAuthenticated,   // Boolean - user logged in?
  role,              // User role (admin, contractor, customer)
  login,             // Function: (email, password) => Promise
  logout,            // Function: () => Promise
  signup,            // Function: (email, password) => Promise
  updateProfile,     // Function: (data) => Promise
  isLoading          // Boolean - request in progress?
} = useAuth()
```

**Example**:
```javascript
function LoginForm() {
  const { login, isLoading } = useAuth()
  
  const handleLogin = async (email, password) => {
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.message)
    }
  }
}
```

### useProjects

**Purpose**: Fetch and manage multiple projects

```javascript
const {
  projects,         // Array of projects
  loading,          // Boolean - loading?
  error,            // Error object or null
  totalCount,       // Total projects in database
  refresh,          // Function: () => Promise - refetch
  createProject,    // Function: (data) => Promise
  updateProject,    // Function: (id, data) => Promise
  deleteProject     // Function: (id) => Promise
} = useProjects(filters, options)
```

**Example**:
```javascript
function ProjectsList() {
  const { projects, loading, refresh } = useProjects()
  
  useEffect(() => {
    refresh()
  }, [])
  
  if (loading) return <Spinner />
  return projects.map(p => <ProjectCard key={p.id} project={p} />)
}
```

### useProject

**Purpose**: Fetch single project with related data

```javascript
const {
  project,          // Single project object
  tasks,            // Project tasks/stages
  materials,        // Project materials
  invoices,         // Project invoices
  loading,          // Boolean - loading?
  error,            // Error object or null
  refresh,          // Function: () => Promise
  updateProject,    // Function: (data) => Promise
  addTask,          // Function: (task) => Promise
  removeTask        // Function: (taskId) => Promise
} = useProject(projectId)
```

### useImportWizard

**Purpose**: Manage CSV import workflow

```javascript
const {
  currentStep,       // Current wizard step number
  file,              // Selected file object
  importType,        // 'projects' or 'customers'
  parsedData,        // Parsed CSV data
  headers,           // CSV headers
  headerMapping,     // Field mapping
  validationResults, // Validation errors/warnings
  processingProgress,// Import progress (%)
  error,             // Error message
  isLoading,         // Boolean - processing?
  
  handleFileSelect,   // Function: (file) => void
  parseFile,          // Function: () => Promise
  updateHeaderMapping,// Function: (mapping) => void
  performValidation,  // Function: () => Promise
  startImport,        // Function: () => Promise
  nextStep,           // Function: () => void
  prevStep,           // Function: () => void
  reset               // Function: () => void
} = useImportWizard()
```

### useOfflineStatus

**Purpose**: Detect network connectivity

```javascript
const {
  isOnline,         // Boolean - connected?
  wasOffline,       // Boolean - was offline recently?
  reconnectTime     // Timestamp of last reconnection
} = useOfflineStatus()
```

**Example**:
```javascript
function App() {
  const { isOnline } = useOfflineStatus()
  
  return (
    <>
      {!isOnline && <OfflineBanner />}
      <MainContent />
    </>
  )
}
```

---

## Filter Operators

Used in `select()`, `query().filter()`, and service methods

| Operator | Syntax | Example | Meaning |
|----------|--------|---------|---------|
| **eq** | `field__eq` | `status__eq: 'active'` | Equals |
| **neq** | `field__neq` | `status__neq: 'deleted'` | Not equals |
| **gt** | `field__gt` | `capacity_kw__gt: 5` | Greater than |
| **gte** | `field__gte` | `capacity_kw__gte: 5` | Greater than or equal |
| **lt** | `field__lt` | `cost__lt: 100000` | Less than |
| **lte** | `field__lte` | `cost__lte: 100000` | Less than or equal |
| **in** | `field__in` | `status__in: ['active', 'pending']` | In array |
| **contains** | `field__contains` | `name__contains: 'Solar'` | Contains substring |
| **like** | `field__like` | `email__like: '%@gmail.com'` | Pattern match |
| **ilike** | `field__ilike` | `name__ilike: 'solar'` | Case-insensitive match |

---

## Common Usage Patterns

### Fetching Data with Error Handling
```javascript
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true)
      const data = await select('projects', {
        filters: { status__eq: 'active' },
        pagination: { page: 1, limit: 20 }
      })
      setProjects(data)
    } catch (error) {
      if (error.code === 'NETWORK_ERROR') {
        toast.error('Network connection lost')
      } else {
        toast.error(error.message)
      }
    } finally {
      setLoading(false)
    }
  }
  
  loadData()
}, [])
```

### Creating Records with Validation
```javascript
const handleCreateProject = async (formData) => {
  try {
    const project = await insert('projects', {
      name: formData.name,
      customer_id: formData.customerId,
      capacity_kw: parseFloat(formData.capacity),
      status: 'Planning'
    })
    
    toast.success('Project created successfully')
    navigate(`/projects/${project.id}`)
  } catch (error) {
    if (error.code === 'VALIDATION_ERROR') {
      toast.error('Please check your input')
    } else {
      toast.error(error.message)
    }
  }
}
```

### Batch Operations
```javascript
const importMultipleRecords = async (records) => {
  try {
    const results = await batch.sequence(
      records.map(record => ({
        operation: 'insert',
        table: 'projects',
        data: record
      }))
    )
    toast.success(`${results.length} projects imported`)
  } catch (error) {
    toast.error('Import failed: ' + error.message)
  }
}
```

---

**Last Updated:** April 2026  
**Version:** 0.1.0
