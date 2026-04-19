/**
 * Test Data Factories
 * Functions to generate test data with sensible defaults
 */

/**
 * Factory for creating test projects
 */
export function createProject(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: 'proj-' + Math.random().toString(36).substr(2, 9),
    name: 'Solar Installation Project',
    status: 'In Progress',
    stage: 5,
    customer_id: 'cust-001',
    description: 'A test solar installation project',
    estimated_cost: 5000,
    actual_cost: 4500,
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

/**
 * Factory for creating test customers
 */
export function createCustomer(overrides = {}) {
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const now = new Date().toISOString()
  return {
    id: 'cust-' + Math.random().toString(36).substr(2, 9),
    customer_id: `CUST-20260418-${random}`,
    name: 'John Doe',
    email: `customer-${random}@example.com`,
    phone: '+1-555-0100',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    postal_code: '62701',
    company: 'Acme Corp',
    notes: 'Test customer',
    is_active: true,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

/**
 * Factory for creating test invoices
 */
export function createInvoice(overrides = {}) {
  const now = new Date().toISOString()
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  return {
    id: 'inv-' + Math.random().toString(36).substr(2, 9),
    invoice_number: 'INV-2026-' + Math.floor(Math.random() * 1000),
    project_id: 'proj-001',
    customer_id: 'cust-001',
    amount: 5000,
    tax: 500,
    total: 5500,
    status: 'Draft',
    issued_date: now,
    due_date: dueDate,
    notes: 'Test invoice',
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

/**
 * Factory for creating test emails
 */
export function createEmail(overrides = {}) {
  const now = new Date().toISOString()
  return {
    id: 'email-' + Math.random().toString(36).substr(2, 9),
    to: 'customer@example.com',
    subject: 'Project Update',
    body: 'This is a test email body',
    template: 'project_update',
    status: 'draft',
    project_id: 'proj-001',
    sent_at: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

/**
 * Factory for creating test form data (customer form)
 */
export function createCustomerFormData(overrides = {}) {
  return {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0100',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    postal_code: '62701',
    company: 'Acme Corp',
    notes: '',
    ...overrides,
  }
}

/**
 * Factory for creating test form data (project form)
 */
export function createProjectFormData(overrides = {}) {
  return {
    name: 'Solar Installation Project',
    status: 'Planning',
    stage: 1,
    customer_id: 'cust-001',
    description: 'A test project',
    estimated_cost: 5000,
    notes: '',
    ...overrides,
  }
}

/**
 * Factory for creating test form data (invoice form)
 */
export function createInvoiceFormData(overrides = {}) {
  return {
    invoice_number: 'INV-2026-001',
    project_id: 'proj-001',
    customer_id: 'cust-001',
    amount: 5000,
    tax: 500,
    notes: '',
    due_days: 30,
    ...overrides,
  }
}

/**
 * Factory for creating test pagination params
 */
export function createPaginationParams(overrides = {}) {
  return {
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
    ...overrides,
  }
}

/**
 * Factory for creating test filter params
 */
export function createFilterParams(overrides = {}) {
  return {
    status: undefined,
    stage: undefined,
    searchTerm: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    ...overrides,
  }
}

/**
 * Factory for creating test analytics data
 */
export function createAnalyticsData(overrides = {}) {
  return {
    total_projects: 42,
    active_projects: 15,
    completed_projects: 25,
    total_revenue: 125000,
    average_project_value: 2976.19,
    customer_count: 38,
    completion_rate: 0.595,
    ...overrides,
  }
}

/**
 * Generate array of test data
 */
export function createList(factory, count = 5, overrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    factory({ ...overrides, id: `${overrides.id || factory.name}-${i + 1}` })
  )
}
