# SolarTrack Pro - Form Validation Setup Guide

Complete guide to implementing comprehensive form validation using Zod and React Hook Form.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Quick Start](#quick-start)
3. [Schema Structure](#schema-structure)
4. [Form Implementation](#form-implementation)
5. [Error Handling](#error-handling)
6. [Advanced Features](#advanced-features)
7. [Testing](#testing)
8. [Production Checklist](#production-checklist)

## Installation & Setup

### Dependencies

All required dependencies are already installed in package.json:

```json
{
  "dependencies": {
    "zod": "^4.3.6",
    "react-hook-form": "^7.72.1",
    "@hookform/resolvers": "^5.2.2"
  }
}
```

Verify installation:

```bash
npm list zod react-hook-form @hookform/resolvers
```

### Project Structure

```
src/
├── lib/
│   └── validation/
│       ├── projectSchema.ts
│       ├── customerSchema.ts
│       ├── invoiceSchema.ts
│       ├── estimateSchema.ts
│       ├── materialSchema.ts
│       ├── authSchema.ts
│       ├── emailSchema.ts
│       ├── utils.ts
│       ├── README.md
│       └── __tests__/
│           └── schemas.test.js
└── components/
    └── forms/
        ├── ProjectFormValidated.jsx
        ├── CustomerFormValidated.jsx
        └── LoginFormValidated.jsx
```

## Quick Start

### 1. Basic Form with Validation

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema } from '@/lib/validation/projectSchema';

function SimpleForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createProjectSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('projectName')} />
      {errors.projectName && <p>{errors.projectName.message}</p>}
      <button>Submit</button>
    </form>
  );
}
```

### 2. Using Pre-built Components

```jsx
import { ProjectFormValidated } from '@/components/forms/ProjectFormValidated';

export default function CreateProjectPage() {
  return (
    <ProjectFormValidated
      onSubmit={async (data) => {
        const response = await api.projects.create(data);
        console.log('Project created:', response);
      }}
      onCancel={() => navigate('/projects')}
    />
  );
}
```

### 3. Customer Form with Advanced Fields

```jsx
import { CustomerFormValidated } from '@/components/forms/CustomerFormValidated';

export default function CreateCustomerPage() {
  return (
    <CustomerFormValidated
      isUpdate={false}
      onSubmit={async (data) => {
        const response = await api.customers.create(data);
        notification.success('Customer created successfully');
      }}
      onCancel={() => navigate('/customers')}
    />
  );
}
```

## Schema Structure

### Understanding Zod Schemas

Each validation schema consists of:

```typescript
import { z } from 'zod';

// 1. Define enums (if needed)
export const StatusEnum = z.enum(['draft', 'published', 'archived']);

// 2. Create base schema
export const baseSchema = z.object({
  field1: z.string().min(1, 'Required').max(100),
  field2: z.number().positive('Must be positive'),
  field3: z.boolean().optional(),
  field4: StatusEnum,
  // ... more fields
});

// 3. Extend for specific operations
export const createSchema = baseSchema.extend({
  requiredField: z.string().min(1, 'Required'), // Make optional field required
});

export const updateSchema = baseSchema.partial(); // All optional

// 4. Add cross-field validation
export const createSchemaWithValidation = createSchema.refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: 'End date must be after start date',
    path: ['endDate'], // Field to attach error to
  }
);

// 5. Export types
export type CreateData = z.infer<typeof createSchema>;
export type UpdateData = z.infer<typeof updateSchema>;
```

### Common Validation Patterns

#### Required String Fields

```typescript
z.string()
  .min(1, 'This field is required')
  .max(100, 'Must not exceed 100 characters')
  .describe('Human-readable description')
```

#### Email Validation

```typescript
z.string()
  .email('Please enter a valid email address')
  .describe('Valid email address')
```

#### Phone Number (International)

```typescript
z.string().regex(
  /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
  'Please enter a valid phone number'
)
```

#### Numeric Fields

```typescript
// Positive number (greater than 0)
z.number().positive('Must be greater than 0')

// Non-negative (0 or greater)
z.number().nonnegative('Cannot be negative')

// With constraints
z.number().min(100).max(10000)
```

#### Date/DateTime Fields

```typescript
// ISO 8601 datetime string
z.string().datetime('Must be valid datetime')

// With optional modifier
z.string().datetime().optional()
```

#### Enum Fields

```typescript
z.enum(['option1', 'option2', 'option3'])

// Or with z.union
z.union([
  z.literal('option1'),
  z.literal('option2'),
])
```

#### Arrays

```typescript
// Array of objects
z.array(z.object({
  name: z.string(),
  value: z.number(),
})).min(1, 'At least one item required')

// Array of strings
z.array(z.string()).optional().default([])
```

#### Nested Objects

```typescript
z.object({
  address: z.object({
    street: z.string(),
    city: z.string(),
    postalCode: z.string().regex(/^\d{5,10}$/),
  }),
})
```

## Form Implementation

### Complete Form Example

```jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema } from '@/lib/validation/projectSchema';
import { getFieldError, formatValidationError } from '@/lib/validation/utils';
import toast from 'react-hot-toast';

export function CompleteProjectForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(createProjectSchema),
    mode: 'onBlur', // Validate on blur
    defaultValues: {
      projectName: '',
      customerId: '',
      status: 'site_survey',
      systemSize: 10,
    },
  });

  const projectName = watch('projectName');

  const onSubmit = async (data) => {
    try {
      console.log('Submitting:', data);
      // Send to API
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create project');

      toast.success('Project created successfully');
      reset(); // Clear form
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getError = (fieldName) => {
    const error = getFieldError(errors, fieldName);
    return error ? formatValidationError(error) : '';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Text Input */}
      <div>
        <label htmlFor="projectName">Project Name *</label>
        <input
          {...register('projectName')}
          id="projectName"
          type="text"
          placeholder="Enter project name"
          className={errors.projectName ? 'error' : ''}
        />
        {getError('projectName') && (
          <span className="error-message">{getError('projectName')}</span>
        )}
      </div>

      {/* Number Input */}
      <div>
        <label htmlFor="systemSize">System Size (kW) *</label>
        <input
          {...register('systemSize', { valueAsNumber: true })}
          id="systemSize"
          type="number"
          step="0.1"
          placeholder="10.5"
          className={errors.systemSize ? 'error' : ''}
        />
        {getError('systemSize') && (
          <span className="error-message">{getError('systemSize')}</span>
        )}
      </div>

      {/* Select Dropdown */}
      <div>
        <label htmlFor="status">Status *</label>
        <select {...register('status')} id="status">
          <option value="">Select status</option>
          <option value="site_survey">Site Survey</option>
          <option value="proposal">Proposal</option>
          <option value="completed">Completed</option>
        </select>
        {getError('status') && (
          <span className="error-message">{getError('status')}</span>
        )}
      </div>

      {/* Textarea */}
      <div>
        <label htmlFor="description">Description</label>
        <textarea
          {...register('description')}
          id="description"
          rows={4}
          placeholder="Project description..."
          className={errors.description ? 'error' : ''}
        />
        {getError('description') && (
          <span className="error-message">{getError('description')}</span>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-4">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Project'}
        </button>
        <button type="reset" onClick={() => reset()}>
          Clear Form
        </button>
      </div>

      {/* Debug Info (remove in production) */}
      <div className="debug">
        <p>Project Name: {projectName}</p>
      </div>
    </form>
  );
}
```

### Form with Dynamic Fields

```jsx
import { useFieldArray } from 'react-hook-form';

export function InvoiceFormWithItems() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      invoiceNumber: '',
      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lineItems',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Basic fields */}
      <input {...register('invoiceNumber')} />

      {/* Dynamic fields array */}
      <div className="line-items">
        {fields.map((field, index) => (
          <div key={field.id} className="line-item">
            <input {...register(`lineItems.${index}.description`)} />
            <input
              {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
              type="number"
            />
            <input
              {...register(`lineItems.${index}.unitPrice`, { valueAsNumber: true })}
              type="number"
            />
            <button type="button" onClick={() => remove(index)}>
              Remove
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => append({})}>
        Add Line Item
      </button>

      <button type="submit">Submit</button>
    </form>
  );
}
```

## Error Handling

### Displaying Errors

```jsx
// Single field error
{errors.projectName && (
  <p className="error">{errors.projectName.message}</p>
)}

// All field errors
{Object.keys(errors).length > 0 && (
  <div className="error-summary">
    <h3>Please fix the following errors:</h3>
    <ul>
      {Object.entries(errors).map(([field, error]) => (
        <li key={field}>{error.message}</li>
      ))}
    </ul>
  </div>
)}

// With custom formatting
{getFieldError(errors, 'email') && (
  <p className="error">
    {formatValidationError(getFieldError(errors, 'email'))}
  </p>
)}
```

### Custom Error Messages

```typescript
// In your schema
export const customSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .refine(
      async (email) => !(await checkEmailExists(email)),
      'This email is already registered'
    ),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[!@#$%^&*]/, 'Must contain special character'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'], // This sets which field the error appears on
  }
);
```

### Toast Notifications

```jsx
import toast from 'react-hot-toast';

const onSubmit = async (data) => {
  try {
    await api.createProject(data);
    toast.success('Project created successfully');
  } catch (error) {
    if (error.response?.status === 400) {
      toast.error('Invalid form data');
    } else if (error.response?.status === 409) {
      toast.error('Project already exists');
    } else {
      toast.error('An error occurred');
    }
  }
};
```

## Advanced Features

### Async Validation

```jsx
import { createAsyncValidator } from '@/lib/validation/utils';

// Option 1: Using createAsyncValidator utility
const checkEmailExists = async (email) => {
  const response = await api.checkEmail(email);
  return response.exists; // true if exists, false if not
};

const extendedSchema = createCustomerSchema.extend({
  email: createCustomerSchema.shape.email.refine(
    async (email) => {
      const exists = await checkEmailExists(email);
      return !exists; // Valid if email doesn't exist
    },
    'Email is already registered'
  ),
});

// Option 2: Manual async validation
const form = useForm({
  resolver: zodResolver(schema),
  mode: 'onBlur',
});

// Real-time validation
const handleEmailChange = async (email) => {
  const result = await validateField(createCustomerSchema, 'email', email);
  if (!result.valid) {
    setEmailError(result.error);
  }
};
```

### Conditional Validation

```typescript
// Schema with conditional validation
export const systemSchema = z.object({
  systemType: z.enum(['grid_connected', 'off_grid', 'hybrid']),
  batteryCapacity: z.number().optional(),
}).refine(
  (data) => {
    // If off-grid or hybrid, battery capacity is required
    if (data.systemType !== 'grid_connected' && !data.batteryCapacity) {
      return false;
    }
    return true;
  },
  {
    message: 'Battery capacity required for this system type',
    path: ['batteryCapacity'],
  }
);
```

### Multi-step Form

```jsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function MultiStepForm() {
  const [step, setStep] = useState(1);

  // Separate schemas for each step
  const step1Schema = z.object({
    projectName: z.string().min(1),
    customerId: z.string().min(1),
  });

  const step2Schema = z.object({
    systemSize: z.number().positive(),
    location: z.string().min(2),
  });

  const form = useForm({
    mode: 'onChange',
  });

  const handleNext = async () => {
    const schema = step === 1 ? step1Schema : step2Schema;
    const isValid = await form.trigger(schema);
    if (isValid) {
      setStep(step + 1);
    }
  };

  return (
    <div>
      {step === 1 && (
        <div>
          {/* Step 1 fields */}
          <input {...form.register('projectName')} />
          <input {...form.register('customerId')} />
          <button onClick={handleNext}>Next</button>
        </div>
      )}

      {step === 2 && (
        <div>
          {/* Step 2 fields */}
          <input {...form.register('systemSize')} />
          <input {...form.register('location')} />
          <button onClick={() => setStep(1)}>Back</button>
          <button onClick={form.handleSubmit(onSubmit)}>Submit</button>
        </div>
      )}
    </div>
  );
}
```

### File Upload Validation

```typescript
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, 'File must be less than 5MB')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type),
      'File must be an image or PDF'
    ),
  description: z.string().optional(),
});
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test -- schemas.test.js
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';
import { createProjectSchema } from '@/lib/validation/projectSchema';

describe('Project Validation', () => {
  it('should validate a valid project', () => {
    const data = {
      projectName: 'Solar Installation',
      customerId: 'cust123',
      status: 'site_survey',
      systemSize: 10,
      estimatedCost: 500000,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 86400000).toISOString(),
      location: 'Bangalore',
    };

    const result = createProjectSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should reject invalid system size', () => {
    const data = {
      // ... other fields
      systemSize: -5, // Invalid
    };

    const result = createProjectSchema.safeParse(data);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toContain('greater than 0');
  });
});
```

## Production Checklist

Before deploying to production:

- [ ] All validation schemas are complete and tested
- [ ] Error messages are user-friendly and clear
- [ ] Async validation handles network errors gracefully
- [ ] Forms sanitize user input (use `sanitizeInput()` utility)
- [ ] XSS protection is implemented
- [ ] CSRF tokens are included where applicable
- [ ] Rate limiting is in place for sensitive operations
- [ ] Error handling is comprehensive
- [ ] Logging is configured for debugging
- [ ] Performance is optimized (debounce async validation)
- [ ] Accessibility requirements are met
- [ ] Mobile responsiveness is tested
- [ ] Form validation tests have good coverage
- [ ] Documentation is complete and up-to-date
- [ ] Code review completed
- [ ] Security audit completed

## Common Issues & Solutions

### Issue: "Schema validation failed"
**Solution:** Use `safeParse()` instead of `parse()` to get detailed errors:
```typescript
const result = schema.safeParse(data);
if (!result.success) {
  console.log(result.error.issues);
}
```

### Issue: Numbers coming as strings from form
**Solution:** Use `valueAsNumber` in register:
```typescript
{...register('systemSize', { valueAsNumber: true })}
```

### Issue: Date validation failing
**Solution:** Ensure dates are in ISO 8601 format:
```typescript
const isoDate = new Date().toISOString();
register('startDate'); // Will work with datetime-local input
```

### Issue: Async validation too slow
**Solution:** Add debounce:
```typescript
const debouncedValidate = debounce(validateField, 500);
```

## Support & Resources

- [Zod Docs](https://zod.dev)
- [React Hook Form Docs](https://react-hook-form.com)
- [Validation README](./src/lib/validation/README.md)
- [GitHub Issues](https://github.com/colinhacks/zod/issues)
