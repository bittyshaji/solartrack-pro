/**
 * Validation Schemas Test Suite
 * Tests for all Zod validation schemas used in SolarTrack Pro
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createProjectSchema,
  updateProjectSchema,
  projectFilterSchema,
} from '../projectSchema';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerFilterSchema,
} from '../customerSchema';
import {
  loginSchema,
  signupSchema,
  passwordResetRequestSchema,
  changePasswordSchema,
} from '../authSchema';
import {
  createInvoiceSchema,
  invoicePaymentSchema,
  invoiceFilterSchema,
} from '../invoiceSchema';
import {
  createEstimateSchema,
  estimateSendSchema,
  estimateFilterSchema,
} from '../estimateSchema';
import {
  createMaterialSchema,
  materialStockAdjustmentSchema,
  materialFilterSchema,
} from '../materialSchema';

describe('Project Schemas', () => {
  describe('createProjectSchema', () => {
    it('should validate a valid project creation', () => {
      const data = {
        projectName: 'Solar Installation',
        customerId: 'cust123',
        description: 'Residential solar installation',
        status: 'site_survey',
        systemSize: 10.5,
        estimatedCost: 500000,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        location: 'Bangalore, Karnataka',
        tags: ['residential', 'grid-connected'],
        notes: 'Some notes',
      };

      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail validation with missing required fields', () => {
      const data = {
        projectName: 'Solar Installation',
        // Missing customerId, status, systemSize, etc.
      };

      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail validation with invalid system size', () => {
      const data = {
        projectName: 'Solar Installation',
        customerId: 'cust123',
        status: 'site_survey',
        systemSize: -5, // Invalid: negative
        estimatedCost: 500000,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        location: 'Bangalore, Karnataka',
      };

      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('greater than 0');
    });

    it('should fail validation when end date is before start date', () => {
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() - 86400000).toISOString();

      const data = {
        projectName: 'Solar Installation',
        customerId: 'cust123',
        status: 'site_survey',
        systemSize: 10.5,
        estimatedCost: 500000,
        startDate,
        endDate,
        location: 'Bangalore, Karnataka',
      };

      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept project name within length constraints', () => {
      const data = {
        projectName: 'AB', // Minimum 2 characters
        customerId: 'cust123',
        status: 'site_survey',
        systemSize: 10.5,
        estimatedCost: 500000,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        location: 'Bangalore, Karnataka',
      };

      const result = createProjectSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('projectFilterSchema', () => {
    it('should validate valid filter parameters', () => {
      const data = {
        status: 'site_survey',
        minCost: 100000,
        maxCost: 1000000,
        searchTerm: 'residential',
        sortBy: 'date',
        sortOrder: 'desc',
      };

      const result = projectFilterSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should use default sort order', () => {
      const data = {
        status: 'site_survey',
      };

      const result = projectFilterSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data?.sortOrder).toBe('desc');
    });
  });
});

describe('Customer Schemas', () => {
  describe('createCustomerSchema', () => {
    it('should validate a valid customer creation', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+91-9999-999999',
        address: {
          street: '123 Main Street',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
        companyName: 'Acme Corp',
        preferredContactMethod: 'email',
        taxExempt: false,
      };

      const result = createCustomerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate email format', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '+91-9999-999999',
        address: {
          street: '123 Main Street',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      };

      const result = createCustomerSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('valid email');
    });

    it('should validate phone number format', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '123', // Invalid phone
        address: {
          street: '123 Main Street',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      };

      const result = createCustomerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate GSTIN format when provided', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+91-9999-999999',
        address: {
          street: '123 Main Street',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
        gstin: 'INVALID', // Invalid GSTIN
      };

      const result = createCustomerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate PAN format when provided', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+91-9999-999999',
        address: {
          street: '123 Main Street',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
        panNumber: 'INVALID', // Invalid PAN
      };

      const result = createCustomerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Authentication Schemas', () => {
  describe('loginSchema', () => {
    it('should validate a valid login', () => {
      const data = {
        email: 'user@example.com',
        password: 'Password123!',
        rememberMe: true,
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail validation with invalid email', () => {
      const data = {
        email: 'not-an-email',
        password: 'Password123!',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail validation with missing password', () => {
      const data = {
        email: 'user@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('signupSchema', () => {
    it('should validate a valid signup', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        companyName: 'Acme Corp',
        phone: '+91-9999-999999',
        acceptTerms: true,
        acceptPrivacy: true,
      };

      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail when passwords do not match', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'DifferentPass123!',
        companyName: 'Acme Corp',
        phone: '+91-9999-999999',
        acceptTerms: true,
        acceptPrivacy: true,
      };

      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toContain('do not match');
    });

    it('should fail when password is too weak', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'weak', // Too weak
        confirmPassword: 'weak',
        companyName: 'Acme Corp',
        phone: '+91-9999-999999',
        acceptTerms: true,
        acceptPrivacy: true,
      };

      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail when terms are not accepted', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        confirmPassword: 'SecurePass123!',
        companyName: 'Acme Corp',
        phone: '+91-9999-999999',
        acceptTerms: false, // Not accepted
        acceptPrivacy: true,
      };

      const result = signupSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate password change with matching new passwords', () => {
      const data = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      };

      const result = changePasswordSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail when new passwords do not match', () => {
      const data = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'DifferentPass123!',
      };

      const result = changePasswordSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Invoice Schemas', () => {
  describe('createInvoiceSchema', () => {
    it('should validate a valid invoice creation', () => {
      const data = {
        projectId: 'proj123',
        customerId: 'cust123',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days later
        lineItems: [
          {
            description: 'Solar Panel Installation',
            quantity: 10,
            unitPrice: 50000,
            taxRate: 18,
          },
        ],
        notes: 'Invoice notes',
        status: 'draft',
      };

      const result = createInvoiceSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail when due date is before invoice date', () => {
      const invoiceDate = new Date().toISOString();
      const dueDate = new Date(Date.now() - 86400000).toISOString();

      const data = {
        projectId: 'proj123',
        customerId: 'cust123',
        invoiceNumber: 'INV-2024-001',
        invoiceDate,
        dueDate,
        lineItems: [
          {
            description: 'Solar Panel Installation',
            quantity: 10,
            unitPrice: 50000,
          },
        ],
      };

      const result = createInvoiceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should fail with empty line items', () => {
      const data = {
        projectId: 'proj123',
        customerId: 'cust123',
        invoiceNumber: 'INV-2024-001',
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 2592000000).toISOString(),
        lineItems: [],
      };

      const result = createInvoiceSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('invoicePaymentSchema', () => {
    it('should validate a valid payment record', () => {
      const data = {
        invoiceId: 'inv123',
        amount: 50000,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'bank_transfer',
        transactionId: 'TXN-2024-001',
      };

      const result = invoicePaymentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail with zero or negative payment', () => {
      const data = {
        invoiceId: 'inv123',
        amount: 0,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'bank_transfer',
      };

      const result = invoicePaymentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Estimate Schemas', () => {
  describe('createEstimateSchema', () => {
    it('should validate a valid estimate creation', () => {
      const data = {
        projectId: 'proj123',
        customerId: 'cust123',
        estimateNumber: 'EST-2024-001',
        title: 'Solar System Estimate',
        estimateDate: new Date().toISOString(),
        validUntilDate: new Date(Date.now() + 2592000000).toISOString(),
        status: 'draft',
        systemDesign: {
          totalCapacityKw: 10,
          panelCount: 25,
          inverterCapacityKw: 10,
          systemType: 'grid_connected',
        },
        equipment: [
          {
            type: 'panel',
            name: 'Sunwatt 400W Panel',
            quantity: 25,
            unitPrice: 12000,
          },
        ],
      };

      const result = createEstimateSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail with invalid system design', () => {
      const data = {
        projectId: 'proj123',
        customerId: 'cust123',
        estimateNumber: 'EST-2024-001',
        title: 'Solar System Estimate',
        estimateDate: new Date().toISOString(),
        validUntilDate: new Date(Date.now() + 2592000000).toISOString(),
        systemDesign: {
          totalCapacityKw: -5, // Invalid: negative
          panelCount: 25,
          inverterCapacityKw: 10,
          systemType: 'grid_connected',
        },
        equipment: [
          {
            type: 'panel',
            name: 'Sunwatt 400W Panel',
            quantity: 25,
            unitPrice: 12000,
          },
        ],
      };

      const result = createEstimateSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Material Schemas', () => {
  describe('createMaterialSchema', () => {
    it('should validate a valid material creation', () => {
      const data = {
        name: 'Sunwatt 400W Solar Panel',
        description: 'High-efficiency monocrystalline panel',
        type: 'solar_panel',
        sku: 'SW400-001',
        unit: 'piece',
        unitPrice: 12000,
        currentStock: 50,
        minimumStock: 10,
        supplier: 'Solar Equipment Ltd',
      };

      const result = createMaterialSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail with negative unit price', () => {
      const data = {
        name: 'Sunwatt 400W Solar Panel',
        type: 'solar_panel',
        sku: 'SW400-001',
        unit: 'piece',
        unitPrice: -100, // Invalid: negative
      };

      const result = createMaterialSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should use default stock values', () => {
      const data = {
        name: 'Sunwatt 400W Solar Panel',
        type: 'solar_panel',
        sku: 'SW400-001',
        unit: 'piece',
        unitPrice: 12000,
      };

      const result = createMaterialSchema.safeParse(data);
      expect(result.success).toBe(true);
      expect(result.data?.currentStock).toBe(0);
      expect(result.data?.minimumStock).toBe(5);
    });
  });

  describe('materialStockAdjustmentSchema', () => {
    it('should validate a valid stock adjustment', () => {
      const data = {
        materialId: 'mat123',
        quantity: 10,
        reason: 'purchase',
        notes: 'Received new shipment',
      };

      const result = materialStockAdjustmentSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail with zero quantity', () => {
      const data = {
        materialId: 'mat123',
        quantity: 0,
        reason: 'usage',
      };

      const result = materialStockAdjustmentSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});

describe('Filter Schemas', () => {
  it('projectFilterSchema should have correct defaults', () => {
    const data = {};
    const result = projectFilterSchema.safeParse(data);
    expect(result.success).toBe(true);
    expect(result.data?.sortBy).toBe('date');
    expect(result.data?.sortOrder).toBe('desc');
  });

  it('customerFilterSchema should have correct defaults', () => {
    const data = {};
    const result = customerFilterSchema.safeParse(data);
    expect(result.success).toBe(true);
    expect(result.data?.sortBy).toBe('name');
    expect(result.data?.sortOrder).toBe('asc');
    expect(result.data?.limit).toBe(50);
  });

  it('invoiceFilterSchema should have correct defaults', () => {
    const data = {};
    const result = invoiceFilterSchema.safeParse(data);
    expect(result.success).toBe(true);
    expect(result.data?.sortBy).toBe('date');
    expect(result.data?.sortOrder).toBe('desc');
  });
});
