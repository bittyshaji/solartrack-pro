/**
 * Mock API Responses
 * Used for testing API layer interactions
 */

import { vi } from 'vitest'

/**
 * Mock successful response
 */
export function mockSuccessResponse(data) {
  return Promise.resolve({
    data,
    error: null,
    status: 200,
    statusText: 'OK',
  })
}

/**
 * Mock error response
 */
export function mockErrorResponse(error, status = 400) {
  return Promise.resolve({
    data: null,
    error: typeof error === 'string' ? new Error(error) : error,
    status,
    statusText: 'Error',
  })
}

/**
 * Create mock API client
 */
export function createMockApiClient() {
  return {
    get: vi.fn().mockResolvedValue(mockSuccessResponse({})),
    post: vi.fn().mockResolvedValue(mockSuccessResponse({})),
    put: vi.fn().mockResolvedValue(mockSuccessResponse({})),
    patch: vi.fn().mockResolvedValue(mockSuccessResponse({})),
    delete: vi.fn().mockResolvedValue(mockSuccessResponse({})),
  }
}

/**
 * Mock API responses for projects
 */
export const mockProjectResponses = {
  single: {
    id: 'proj-001',
    name: 'Solar Installation Project',
    status: 'In Progress',
    stage: 5,
    customer_id: 'cust-001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  list: [
    {
      id: 'proj-001',
      name: 'Solar Installation Project',
      status: 'In Progress',
      stage: 5,
      customer_id: 'cust-001',
      created_at: new Date().toISOString(),
    },
    {
      id: 'proj-002',
      name: 'Rooftop Solar',
      status: 'Planning',
      stage: 1,
      customer_id: 'cust-002',
      created_at: new Date().toISOString(),
    },
  ],
}

/**
 * Mock API responses for customers
 */
export const mockCustomerResponses = {
  single: {
    id: 'cust-001',
    customer_id: 'CUST-20260418-0001',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-0100',
    address: '123 Main St',
    city: 'Springfield',
    state: 'IL',
    postal_code: '62701',
    company: 'Acme Corp',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  list: [
    {
      id: 'cust-001',
      customer_id: 'CUST-20260418-0001',
      name: 'John Doe',
      email: 'john@example.com',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'cust-002',
      customer_id: 'CUST-20260418-0002',
      name: 'Jane Smith',
      email: 'jane@example.com',
      is_active: true,
      created_at: new Date().toISOString(),
    },
  ],
}

/**
 * Mock API responses for invoices
 */
export const mockInvoiceResponses = {
  single: {
    id: 'inv-001',
    invoice_number: 'INV-2026-001',
    project_id: 'proj-001',
    customer_id: 'cust-001',
    amount: 5000,
    tax: 500,
    total: 5500,
    status: 'Draft',
    issued_date: new Date().toISOString(),
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  list: [
    {
      id: 'inv-001',
      invoice_number: 'INV-2026-001',
      amount: 5000,
      status: 'Draft',
      issued_date: new Date().toISOString(),
    },
    {
      id: 'inv-002',
      invoice_number: 'INV-2026-002',
      amount: 3500,
      status: 'Sent',
      issued_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
}

/**
 * Mock API responses for emails
 */
export const mockEmailResponses = {
  sent: {
    id: 'email-001',
    to: 'john@example.com',
    subject: 'Project Update',
    status: 'sent',
    sent_at: new Date().toISOString(),
  },
  queued: {
    id: 'email-queue-001',
    to: 'jane@example.com',
    subject: 'Invoice Reminder',
    status: 'queued',
    created_at: new Date().toISOString(),
  },
}

/**
 * Mock API responses for analytics
 */
export const mockAnalyticsResponses = {
  summary: {
    total_projects: 42,
    active_projects: 15,
    completed_projects: 25,
    total_revenue: 125000,
    average_project_value: 2976.19,
    customer_count: 38,
  },
  trends: [
    { month: 'Jan', projects: 5, revenue: 15000 },
    { month: 'Feb', projects: 8, revenue: 22000 },
    { month: 'Mar', projects: 6, revenue: 18000 },
  ],
}
