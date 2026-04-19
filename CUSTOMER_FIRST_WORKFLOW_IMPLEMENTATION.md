# Customer-First Workflow Implementation Guide
**SolarTrack Pro** - v0.1.0  
**Date:** April 19, 2026  
**Status:** Ready for Implementation

---

## Overview

This document outlines the implementation of a **customer-first workflow** in SolarTrack Pro where:
- ✅ Customers MUST be created before any project can be created
- ✅ Every project MUST be linked to an existing customer
- ✅ The UI enforces this workflow with validation and routing guards
- ✅ Database constraints ensure data integrity

---

## Phase 1: Database & Schema Enhancements

### 1.1 Add NOT NULL Constraint to projects.customer_id

```sql
-- Ensure all new projects require a customer
ALTER TABLE public.projects
ALTER COLUMN customer_id SET NOT NULL;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_projects_customer_id_status 
ON public.projects(customer_id, status);
```

### 1.2 Update RLS Policies for Customer Verification

```sql
-- Projects can only be created if customer exists
CREATE OR REPLACE FUNCTION verify_customer_exists()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer ID is required for project creation';
  END IF;
  
  -- Verify customer exists
  IF NOT EXISTS (
    SELECT 1 FROM project_customers 
    WHERE customer_id = NEW.customer_id
  ) THEN
    RAISE EXCEPTION 'Referenced customer does not exist';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_customer_validation
BEFORE INSERT OR UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION verify_customer_exists();
```

### 1.3 Create Customer-Project Relationship View

```sql
-- Useful view for customer dashboard
CREATE OR REPLACE VIEW customer_project_summary AS
SELECT 
  c.customer_id,
  c.name AS customer_name,
  c.email AS customer_email,
  COUNT(p.id) AS total_projects,
  COUNT(CASE WHEN p.status = 'Completed' THEN 1 END) AS completed_projects,
  COUNT(CASE WHEN p.status = 'In Progress' THEN 1 END) AS active_projects,
  MAX(p.created_at) AS last_project_date
FROM project_customers c
LEFT JOIN projects p ON c.customer_id = p.customer_id
WHERE c.is_active = true
GROUP BY c.customer_id, c.name, c.email;
```

---

## Phase 2: Backend Service Updates

### 2.1 Enhanced customerService.js

**Location:** `src/lib/customerService.js`

**Changes:**
- Add validation for required fields (name, email)
- Add function to get customer with project count
- Add function to validate customer before project creation

```javascript
/**
 * Validate customer exists and is active
 * @param {string} customerId - Customer ID to validate
 * @returns {Promise<boolean>} - True if valid, false otherwise
 */
export async function validateCustomerExists(customerId) {
  try {
    const customer = await getCustomerById(customerId);
    return customer && customer.is_active;
  } catch (err) {
    console.error('Error validating customer:', err);
    return false;
  }
}

/**
 * Get customer with project statistics
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object|null>} - Customer with project count
 */
export async function getCustomerWithStats(customerId) {
  try {
    const customer = await getCustomerById(customerId);
    if (!customer) return null;

    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customerId);

    return {
      ...customer,
      projectCount: count || 0
    };
  } catch (err) {
    console.error('Error fetching customer with stats:', err);
    return null;
  }
}
```

### 2.2 Enhanced projectService.js

**Location:** `src/lib/projectService.js`

**Changes:**
- Make customer_id REQUIRED in createProject()
- Add validation before project creation
- Add function to get projects by customer

```javascript
/**
 * Create a new project (CUSTOMER REQUIRED)
 * @param {Object} projectData - { name, customer_id, description, ... }
 * @returns {Promise<Object>} - { success: boolean, data: project, error: string }
 */
export async function createProject(projectData = {}) {
  try {
    // Validate required fields
    if (!projectData.name) {
      throw new Error('Project name is required');
    }
    
    // ENFORCE: customer_id is REQUIRED
    if (!projectData.customer_id) {
      throw new Error('Customer selection is required. Please create or select a customer first.');
    }

    // Validate customer exists
    const { data: customerExists, error: customerError } = await supabase
      .from('project_customers')
      .select('id')
      .eq('customer_id', projectData.customer_id)
      .single();

    if (customerError || !customerExists) {
      throw new Error(`Selected customer (${projectData.customer_id}) does not exist`);
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name: projectData.name,
          customer_id: projectData.customer_id,
          description: projectData.description || null,
          status: projectData.status || 'Planning',
          stage: projectData.stage || 'Site Survey',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    console.log('✅ Project created for customer:', projectData.customer_id);
    return { success: true, data };
  } catch (err) {
    console.error('Error creating project:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all projects for a customer
 * @param {string} customerId - Customer ID
 * @returns {Promise<Array>} - List of customer's projects
 */
export async function getProjectsByCustomer(customerId) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching projects by customer:', err);
    return [];
  }
}

/**
 * Get projects with customer information
 * @param {Object} filters - { status, stage, customer_id }
 * @returns {Promise<Array>} - Projects with customer details
 */
export async function getProjectsWithCustomers(filters = {}) {
  try {
    let query = supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        stage,
        created_at,
        updated_at,
        customer_id,
        project_customers!inner(*)
      `);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.stage) {
      query = query.eq('stage', filters.stage);
    }
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching projects with customers:', err);
    return [];
  }
}
```

---

## Phase 3: Frontend UI Components

### 3.1 CustomerSelector Component

**Location:** `src/components/customers/CustomerSelector.jsx`

**Purpose:** Reusable dropdown/search component for selecting or creating customers

```javascript
import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { getAllCustomers, searchCustomers } from '../../lib/customerService';

export function CustomerSelector({ 
  value, 
  onChange, 
  onCreateNew,
  required = false,
  error = null 
}) {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const data = await getAllCustomers();
    setCustomers(data);
    setFilteredCustomers(data);
    setLoading(false);
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredCustomers(customers);
    } else {
      const results = await searchCustomers(term);
      setFilteredCustomers(results);
    }
  };

  const selectedCustomer = customers.find(c => c.customer_id === value);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Customer {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm || selectedCustomer?.name || ''}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-80 overflow-y-auto">
            <div className="p-2 border-b bg-gray-50 flex gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onCreateNew?.();
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg w-full"
              >
                <Plus size={16} /> Create New Customer
              </button>
            </div>
            
            {loading ? (
              <div className="p-4 text-gray-500">Loading...</div>
            ) : filteredCustomers.length > 0 ? (
              filteredCustomers.map(customer => (
                <button
                  key={customer.customer_id}
                  onClick={() => {
                    onChange(customer.customer_id);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${
                    value === customer.customer_id ? 'bg-blue-100' : ''
                  }`}
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-sm text-gray-600">{customer.email}</div>
                </button>
              ))
            ) : (
              <div className="p-4 text-gray-500 text-center">No customers found</div>
            )}
          </div>
        )}
      </div>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
```

### 3.2 CustomerCreationModal Component

**Location:** `src/components/customers/CustomerCreationModal.jsx`

```javascript
import React, { useState } from 'react';
import { createCustomer } from '../../lib/customerService';
import toast from 'react-hot-toast';

export function CustomerCreationModal({ isOpen, onClose, onCustomerCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    company: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    setLoading(true);
    const result = await createCustomer(formData);
    
    if (result.success) {
      toast.success('Customer created successfully!');
      onCustomerCreated(result.data);
      setFormData({
        name: '', email: '', phone: '', address: '', 
        city: '', state: '', postal_code: '', company: '', notes: ''
      });
      onClose();
    } else {
      toast.error(result.error || 'Failed to create customer');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <div className="p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <h2 className="text-xl font-bold">Create New Customer</h2>
          <p className="text-blue-100">Create a customer before creating a project</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name * <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Customer name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="customer@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Company name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes"
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 3.3 Updated ProjectForm Component

**Location:** `src/components/projects/ProjectForm/index.jsx`

**Changes:** Add CustomerSelector as required field at top of form

```javascript
// Add to imports
import { CustomerSelector } from '../../customers/CustomerSelector';
import { CustomerCreationModal } from '../../customers/CustomerCreationModal';

// Add to component state
const [showCustomerModal, setShowCustomerModal] = useState(false);

// Add to form validation
if (!formData.customer_id) {
  errors.customer_id = 'Please select or create a customer first';
  isValid = false;
}

// Add to JSX (before other project fields)
<CustomerSelector
  value={formData.customer_id}
  onChange={(customerId) => setFormData(prev => ({ 
    ...prev, 
    customer_id: customerId 
  }))}
  onCreateNew={() => setShowCustomerModal(true)}
  required={true}
  error={errors.customer_id}
/>

<CustomerCreationModal
  isOpen={showCustomerModal}
  onClose={() => setShowCustomerModal(false)}
  onCustomerCreated={(customer) => {
    setFormData(prev => ({ 
      ...prev, 
      customer_id: customer.customer_id 
    }));
  }}
/>
```

---

## Phase 4: Routing Guards & Workflow Enforcement

### 4.1 Create ProjectCreationGuard Component

**Location:** `src/components/guards/ProjectCreationGuard.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomerCount } from '../../lib/customerService';
import { AlertCircle } from 'lucide-react';

export function ProjectCreationGuard({ children }) {
  const navigate = useNavigate();
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCustomers = async () => {
      const count = await getCustomerCount();
      setCustomerCount(count);
      setLoading(false);
    };
    checkCustomers();
  }, []);

  if (loading) {
    return <div className="p-4">Checking customer requirements...</div>;
  }

  if (customerCount === 0) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex gap-4">
            <AlertCircle className="text-yellow-600" size={24} />
            <div>
              <h3 className="font-bold text-yellow-900 mb-2">
                Create a Customer First
              </h3>
              <p className="text-yellow-800 mb-4">
                Every project must be linked to a customer. Please create a customer before creating a project.
              </p>
              <button
                onClick={() => navigate('/customers')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Go to Customers
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
```

### 4.2 Update App Routing

**Location:** `src/App.jsx` (relevant route section)

```javascript
import { ProjectCreationGuard } from './components/guards/ProjectCreationGuard';

// In routes:
{
  path: '/projects/new',
  element: (
    <ProtectedRoute>
      <ProjectCreationGuard>
        <CreateProject />
      </ProjectCreationGuard>
    </ProtectedRoute>
  )
}
```

---

## Phase 5: Testing & Validation Checklist

### Unit Tests

- [ ] `createProject()` requires customer_id
- [ ] `validateCustomerExists()` returns correct boolean
- [ ] `getProjectsByCustomer()` returns only matching projects
- [ ] Customer deletion is prevented if projects exist

### Integration Tests

- [ ] Customer creation form works
- [ ] Project form requires customer selection
- [ ] Projects page shows customer info
- [ ] Customers page shows project counts

### User Workflow Tests

- [ ] New user cannot create project without customer
- [ ] User can create customer and immediately create project
- [ ] User can search and select existing customer
- [ ] Project-customer relationship persists

---

## Migration Guide

### For Existing Projects

If there are existing projects without a customer_id:

```sql
-- Review projects without customers
SELECT * FROM projects WHERE customer_id IS NULL;

-- Create a default/legacy customer if needed
INSERT INTO project_customers (customer_id, name, is_active)
VALUES ('CUST-LEGACY-0000', 'Legacy Projects', true);

-- Associate orphaned projects
UPDATE projects 
SET customer_id = 'CUST-LEGACY-0000' 
WHERE customer_id IS NULL;

-- Then apply NOT NULL constraint
ALTER TABLE public.projects
ALTER COLUMN customer_id SET NOT NULL;
```

---

## File Checklist

### New Files to Create

- ✅ `src/components/customers/CustomerSelector.jsx`
- ✅ `src/components/customers/CustomerCreationModal.jsx`
- ✅ `src/components/guards/ProjectCreationGuard.jsx`

### Files to Modify

- ✅ `src/lib/customerService.js` - Add validation functions
- ✅ `src/lib/projectService.js` - Enforce customer_id requirement
- ✅ `src/components/projects/ProjectForm/index.jsx` - Add customer selector
- ✅ `src/App.jsx` - Add routing guards
- ✅ `src/pages/CreateProject.jsx` - Update form handling

### Database Files

- ✅ `CUSTOMER_FIRST_WORKFLOW_SCHEMA.sql` - All SQL changes

---

## Summary

This implementation ensures that:
1. ✅ Customers are created FIRST, independent of projects
2. ✅ Projects REQUIRE a valid customer_id
3. ✅ UI guides users through the proper workflow
4. ✅ Database constraints prevent invalid data
5. ✅ No orphaned projects can exist

The workflow is now **customer-centric** and **validated at all layers** (DB, Service, UI).
