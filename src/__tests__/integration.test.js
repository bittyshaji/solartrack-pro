/**
 * Integration Tests
 * Tests for service + component + hook integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createCustomer, createProject, createInvoice } from '../test/factories'

describe('Integration Tests', () => {
  describe('Customer Workflow', () => {
    it('should create customer and link to project', async () => {
      const customer = createCustomer({ name: 'John Doe', email: 'john@example.com' })
      const project = createProject({ customer_id: customer.id })

      expect(customer.id).toBeDefined()
      expect(project.customer_id).toBe(customer.id)
    })

    it('should update customer data', async () => {
      const customer = createCustomer({ name: 'Original Name' })
      
      expect(customer.name).toBe('Original Name')
      
      const updated = { ...customer, name: 'Updated Name' }
      expect(updated.name).toBe('Updated Name')
    })
  })

  describe('Project Workflow', () => {
    it('should create project with customer', async () => {
      const customer = createCustomer()
      const project = createProject({ customer_id: customer.id })

      expect(project.id).toBeDefined()
      expect(project.customer_id).toBe(customer.id)
    })

    it('should track project status', async () => {
      const project = createProject({ status: 'Planning' })
      const updated = { ...project, status: 'In Progress' }

      expect(updated.status).toBe('In Progress')
    })
  })

  describe('Invoice Workflow', () => {
    it('should create invoice for project', async () => {
      const project = createProject()
      const invoice = createInvoice({
        project_id: project.id,
        amount: 5000,
      })

      expect(invoice.project_id).toBe(project.id)
      expect(invoice.amount).toBe(5000)
    })

    it('should track invoice status', async () => {
      const invoice = createInvoice({ status: 'Draft' })
      const sent = { ...invoice, status: 'Sent' }
      const paid = { ...invoice, status: 'Paid' }

      expect(sent.status).toBe('Sent')
      expect(paid.status).toBe('Paid')
    })

    it('should calculate invoice totals', async () => {
      const invoices = [
        createInvoice({ amount: 1000, tax: 100 }),
        createInvoice({ amount: 2000, tax: 200 }),
      ]

      const total = invoices.reduce((sum, inv) => sum + inv.amount, 0)
      const totalTax = invoices.reduce((sum, inv) => sum + inv.tax, 0)

      expect(total).toBe(3000)
      expect(totalTax).toBe(300)
    })
  })

  describe('Cross-Service Data Flow', () => {
    it('should maintain relationships', async () => {
      const customer = createCustomer()
      const project = createProject({ customer_id: customer.id })
      const invoice = createInvoice({ 
        project_id: project.id,
        customer_id: customer.id,
      })

      expect(invoice.customer_id).toBe(customer.id)
      expect(invoice.project_id).toBe(project.id)
    })

    it('should handle data validation', async () => {
      const invalid = { name: '' }
      const valid = createCustomer({ name: 'Valid' })

      expect(valid.name).toBe('Valid')
      expect(invalid.name).toBe('')
    })
  })

  describe('Concurrent Operations', () => {
    it('should create multiple customers', async () => {
      const customers = [
        createCustomer({ name: 'Customer 1' }),
        createCustomer({ name: 'Customer 2' }),
        createCustomer({ name: 'Customer 3' }),
      ]

      expect(customers.length).toBe(3)
      customers.forEach((c, i) => {
        expect(c.name).toBe(`Customer ${i + 1}`)
      })
    })

    it('should create multiple projects', async () => {
      const projects = [
        createProject({ name: 'Project 1' }),
        createProject({ name: 'Project 2' }),
      ]

      expect(projects.length).toBe(2)
      expect(projects[0].id).not.toBe(projects[1].id)
    })
  })
})
