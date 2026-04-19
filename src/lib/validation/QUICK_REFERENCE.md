# Form Validation - Quick Reference

Fast lookup guide for common validation tasks.

## Import Everything at Once

```typescript
import {
  // Schemas
  createProjectSchema,
  createCustomerSchema,
  loginSchema,
  createInvoiceSchema,
  createEstimateSchema,
  createMaterialSchema,
  // Utilities
  getFieldError,
  formatValidationError,
  sanitizeInput,
  // Types
  type CreateProjectData,
  type CreateCustomerData,
  type LoginData,
} from '@/lib/validation';
```

## Basic Form Setup

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, getFieldError } from '@/lib/validation';

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createProjectSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('projectName')} />
      {getFieldError(errors, 'projectName') && (
        <p>{getFieldError(errors, 'projectName')}</p>
      )}
      <button>Submit</button>
    </form>
  );
}
```

## Schema Selection by Use Case

### Creating New Records

```typescript
// Projects
import { createProjectSchema } from '@/lib/validation';

// Customers
import { createCustomerSchema } from '@/lib/validation';

// Invoices
import { createInvoiceSchema } from '@/lib/validation';

// Estimates
import { createEstimateSchema } from '@/lib/validation';

// Materials
import { createMaterialSchema } from '@/lib/validation';
```

### Updating Records

```typescript
// All resources use the same pattern:
// Use updateXxxSchema for updates (all fields optional)

import {
  updateProjectSchema,
  updateCustomerSchema,
  updateInvoiceSchema,
  updateEstimateSchema,
  updateMaterialSchema,
} from '@/lib/validation';
```

### Filtering & Searching

```typescript
import {
  projectFilterSchema,
  customerFilterSchema,
  invoiceFilterSchema,
  estimateFilterSchema,
  materialFilterSchema,
} from '@/lib/validation';

// Usage
const filterData = {
  status: 'completed',
  sortBy: 'date',
  sortOrder: 'desc',
};

const result = projectFilterSchema.safeParse(filterData);
```

### Authentication

```typescript
import {
  loginSchema,
  signupSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  changePasswordSchema,
  emailVerificationSchema,
} from '@/lib/validation';
```

## Common Validation Patterns

### Email Input

```jsx
<input 
  {...register('email')} 
  type="email" 
  placeholder="user@example.com"
/>
{getFieldError(errors, 'email') && (
  <p className="error">{getFieldError(errors, 'email')}</p>
)}
```

### Phone Input

```jsx
<input 
  {...register('phone')} 
  type="tel" 
  placeholder="+91-9999-999999"
/>
{getFieldError(errors, 'phone') && (
  <p className="error">{getFieldError(errors, 'phone')}</p>
)}
```

### Number Input

```jsx
// System Size
<input 
  {...register('systemSize', { valueAsNumber: true })} 
  type="number" 
  step="0.1"
/>

// Quantity
<input 
  {...register('quantity', { valueAsNumber: true })} 
  type="number" 
  step="1"
/>
```

### Date/DateTime Input

```jsx
{/* Start Date */}
<input 
  {...register('startDate')} 
  type="datetime-local"
/>

{/* Date validation occurs automatically */}
{getFieldError(errors, 'startDate') && (
  <p>{getFieldError(errors, 'startDate')}</p>
)}
```

### Dropdown/Select

```jsx
<select {...register('status')}>
  <option value="">Select status</option>
  <option value="draft">Draft</option>
  <option value="sent">Sent</option>
  <option value="paid">Paid</option>
</select>
```

### Checkbox

```jsx
<input 
  {...register('acceptTerms')} 
  type="checkbox"
/>
<label>I accept terms and conditions</label>
```

### Textarea

```jsx
<textarea 
  {...register('description')} 
  rows={4}
  placeholder="Enter description..."
/>
```

### Nested Fields (Objects)

```jsx
{/* Address fields */}
<input {...register('address.street')} placeholder="Street" />
<input {...register('address.city')} placeholder="City" />
<input {...register('address.state')} placeholder="State" />
<input {...register('address.postalCode')} placeholder="ZIP" />
<input {...register('address.country')} placeholder="Country" />
```

### Array Fields (Multiple Items)

```jsx
import { useFieldArray } from 'react-hook-form';

function LineItemsForm() {
  const { control, register } = useForm();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`lineItems.${index}.description`)} />
          <input {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })} />
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => append({})}>Add Item</button>
    </div>
  );
}
```

## Error Handling Cheatsheet

### Get Single Field Error

```typescript
const error = getFieldError(errors, 'projectName');
// Returns: string | undefined
```

### Get All Errors

```typescript
const allErrors = getFormErrors(errors);
// Returns: { fieldName: 'error message', ... }
```

### Format Error Message

```typescript
const formatted = formatValidationError('String must contain at least 1 character');
// Returns: 'This field does not meet minimum length requirements'
```

### Display Errors in UI

```jsx
// Single field
{errors.projectName && (
  <p className="error-text">{errors.projectName.message}</p>
)}

// All fields at top
{Object.keys(errors).length > 0 && (
  <div className="alert-danger">
    <strong>Please fix these errors:</strong>
    <ul>
      {getFormErrors(errors).map(([field, msg]) => (
        <li key={field}>{msg}</li>
      ))}
    </ul>
  </div>
)}
```

## Real-time Validation

```jsx
import { validateField } from '@/lib/validation';

async function validateEmail(email) {
  const result = await validateField(createCustomerSchema, 'email', email);
  if (!result.valid) {
    setError(result.error);
  }
}
```

## Type Safety

```typescript
import type { CreateProjectData, UpdateProjectData } from '@/lib/validation';

async function createProject(data: CreateProjectData) {
  // data is fully typed
  const response = await api.projects.create(data);
}

async function updateProject(id: string, data: UpdateProjectData) {
  // data is fully typed
  const response = await api.projects.update(id, data);
}
```

## Input Sanitization

```typescript
import { sanitizeInput } from '@/lib/validation';

function handleUserInput(input: string) {
  const clean = sanitizeInput(input);
  // Prevents XSS attacks
}
```

## Pre-built Components

### Login Form
```jsx
import { LoginFormValidated } from '@/components/forms/LoginFormValidated';

<LoginFormValidated
  onSubmit={handleLogin}
  onSignupClick={() => navigate('/signup')}
  onForgotPasswordClick={() => navigate('/forgot-password')}
/>
```

### Project Form
```jsx
import { ProjectFormValidated } from '@/components/forms/ProjectFormValidated';

<ProjectFormValidated
  onSubmit={handleCreateProject}
  isUpdate={false}
  onCancel={() => navigate(-1)}
/>
```

### Customer Form
```jsx
import { CustomerFormValidated } from '@/components/forms/CustomerFormValidated';

<CustomerFormValidated
  onSubmit={handleCreateCustomer}
  isUpdate={false}
  onCancel={() => navigate(-1)}
/>
```

## Validation Rules at a Glance

| Field Type | Min | Max | Format |
|------------|-----|-----|--------|
| Name | 1 | 50 | Letters, spaces, hyphens |
| Email | - | - | Valid email format |
| Phone | - | - | 10-15 digits |
| Project Name | 2 | 100 | Any |
| Description | - | 1000 | Any |
| System Size | 0.01 | 1000 | Number |
| Price | 0 | ∞ | Number |
| Quantity | > 0 | - | Integer |
| Tax Rate | 0 | 100 | Percentage |
| Discount | 0 | 100 | Percentage |
| GSTIN | 15 | 15 | Format: 27AAPFU0123G1Z5 |
| PAN | 10 | 10 | Format: AAAAA0000A |
| Password | 8 | - | Special chars required |

## Mode Selection

```typescript
// onBlur - Validate when user leaves field (recommended for UX)
useForm({
  mode: 'onBlur',
})

// onChange - Real-time validation (for quick feedback)
useForm({
  mode: 'onChange',
})

// onSubmit - Only validate on form submit (conservative)
useForm({
  mode: 'onSubmit',
})

// onTouched - Validate when field is touched and blurred
useForm({
  mode: 'onTouched',
})
```

## Common Status/Enum Values

### Project Status
```
'site_survey' | 'proposal' | 'customer_approval' | 'advanced_payment' |
'material_procurement' | 'installation' | 'testing_commissioning' |
'final_approval' | 'completed' | 'hold' | 'cancelled'
```

### Invoice Status
```
'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled'
```

### Estimate Status
```
'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted_to_invoice'
```

### Payment Methods
```
'cash' | 'check' | 'bank_transfer' | 'credit_card' | 'upi' | 'other'
```

### System Types
```
'grid_connected' | 'off_grid' | 'hybrid'
```

### Material Types
```
'solar_panel' | 'inverter' | 'battery' | 'mounting_structure' |
'cable' | 'connector' | 'breaker' | 'fuse' | 'monitoring_device' | 'labor' | 'other'
```

## Testing Quick Examples

```typescript
import { createProjectSchema } from '@/lib/validation';

// Valid data
const valid = createProjectSchema.safeParse({
  projectName: 'Solar Installation',
  customerId: 'cust123',
  status: 'site_survey',
  systemSize: 10,
  estimatedCost: 500000,
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 86400000).toISOString(),
  location: 'Bangalore',
});

// Invalid data
const invalid = createProjectSchema.safeParse({
  projectName: 'A', // Too short
  systemSize: -5, // Negative
});

console.log(valid.success); // true
console.log(invalid.success); // false
console.log(invalid.error?.issues[0]?.message); // Error details
```

## Debugging

```typescript
// Enable detailed error output
const result = schema.safeParse(data);
if (!result.success) {
  console.table(result.error.issues);
  // Shows: path, message, code, expected, received
}

// Get all errors formatted
const errors = getFormErrors(formErrors);
console.log(errors); // { field: 'message', ... }

// Log form state
console.log('Form errors:', errors);
console.log('Form values:', watch()); // See current form values
console.log('Form state:', formState); // isSubmitting, isDirty, etc.
```

## Performance Tips

1. Use `mode: 'onBlur'` to reduce validation calls
2. Debounce async validation for email/username checks
3. Use `shouldUnregister: false` to keep unregistered fields in data
4. Memoize expensive validators
5. Use `shallow` comparison for nested objects in validation

## Common Mistakes to Avoid

❌ **Wrong:**
```jsx
<input {...register('systemSize')} type="number" /> // Will be string
```

✅ **Correct:**
```jsx
<input {...register('systemSize', { valueAsNumber: true })} type="number" />
```

---

❌ **Wrong:**
```jsx
const error = errors.projectName; // Could be undefined
<p>{error.message}</p> // Error!
```

✅ **Correct:**
```jsx
const error = getFieldError(errors, 'projectName');
{error && <p>{error}</p>}
```

---

❌ **Wrong:**
```typescript
const result = schema.parse(data); // Throws on error
```

✅ **Correct:**
```typescript
const result = schema.safeParse(data); // Returns {success, data/error}
```

## Quick Links

- [Full Documentation](./README.md)
- [Setup Guide](../../../VALIDATION_SETUP_GUIDE.md)
- [Tests](.//__tests__/schemas.test.js)
- [Zod Docs](https://zod.dev)
- [React Hook Form Docs](https://react-hook-form.com)
