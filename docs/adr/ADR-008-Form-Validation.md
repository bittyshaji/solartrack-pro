# ADR-008: Form Validation with Zod and React Hook Form

**Status:** Accepted  
**Date:** March 2024

## Context

Form validation across the application was inconsistent:

- Validation logic duplicated in multiple places
- No single source of truth for validation rules
- Difficult to maintain and update rules
- Poor type safety
- Inconsistent error messages

## Decision

Use **Zod** for schema validation and **React Hook Form** for form state management.

## Rationale

### Technology Choice

**Zod Benefits:**
- TypeScript-first schema validation
- Composable validators
- Clear error messages
- Type inference (zod.infer)
- No separate type definitions needed

**React Hook Form Benefits:**
- Minimal re-renders (uncontrolled components)
- Small bundle size (8KB)
- Easy form state management
- Built-in validation integration
- Great DX with hooks

### Architecture

```
Zod Schema (validation rules)
         |
         v
React Hook Form (form state)
         |
         v
Form Component (UI)
```

### Validation Schema Example

```javascript
// /src/lib/validation/projectSchema.ts
import { z } from 'zod'

export const projectSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters'),
  
  customer_id: z
    .string()
    .uuid('Invalid customer ID'),
  
  description: z
    .string()
    .max(5000, 'Description must not exceed 5000 characters')
    .optional(),
  
  solar_capacity_kw: z
    .number()
    .positive('Solar capacity must be positive')
    .max(500, 'Solar capacity unrealistic'),
  
  contract_value: z
    .number()
    .positive('Contract value must be positive'),
  
  start_date: z
    .coerce.date()
    .optional(),
  
  completion_date: z
    .coerce.date()
    .optional(),
}).refine(
  (data) => !data.start_date || !data.completion_date || data.start_date < data.completion_date,
  {
    message: 'Start date must be before completion date',
    path: ['completion_date'],
  }
)

// Type inference
export type ProjectFormData = z.infer<typeof projectSchema>
```

### Form Component Usage

```javascript
// /src/components/features/projects/ProjectForm/ProjectForm.jsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectSchema, type ProjectFormData } from '@/lib/validation'

export function ProjectForm({ initialData, onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData,
    mode: 'onBlur', // Validate on blur
  })
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('title')}
        placeholder="Project title"
      />
      {errors.title && (
        <span className="error">{errors.title.message}</span>
      )}
      
      <input
        {...register('solar_capacity_kw', { valueAsNumber: true })}
        type="number"
        placeholder="Solar capacity (kW)"
      />
      {errors.solar_capacity_kw && (
        <span className="error">{errors.solar_capacity_kw.message}</span>
      )}
      
      <button type="submit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? 'Saving...' : 'Save Project'}
      </button>
    </form>
  )
}
```

### Custom Field Component

```javascript
// /src/components/common/FormField/FormField.jsx
import { Controller, useFormContext } from 'react-hook-form'

export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  required,
  children,
  ...props
}) {
  const {
    register,
    formState: { errors },
    control,
  } = useFormContext()
  
  const error = errors[name]
  
  return (
    <div className="form-field">
      {label && (
        <label htmlFor={name}>
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      
      {children ? (
        <Controller
          name={name}
          control={control}
          render={({ field }) => children(field)}
        />
      ) : (
        <input
          id={name}
          {...register(name)}
          type={type}
          placeholder={placeholder}
          {...props}
        />
      )}
      
      {error && (
        <p className="error">{error.message}</p>
      )}
    </div>
  )
}

// Usage
<FormField
  name="title"
  label="Project Title"
  placeholder="Enter project title"
  required
/>
```

### Composite Validation

```javascript
// Authentication schema
export const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[!@#$%^&*]/, 'Must contain special character'),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(v => v === true, 'Must accept terms'),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
)
```

### Dynamic Validation

```javascript
// Conditional validation based on field values
export const invoiceSchema = z.object({
  type: z.enum(['standard', 'installment']),
  dueDate: z.date(),
  installmentCount: z.number().optional(),
}).refine(
  (data) => {
    if (data.type === 'installment' && !data.installmentCount) {
      return false
    }
    return true
  },
  {
    message: 'Installment count required for installment invoices',
    path: ['installmentCount'],
  }
)
```

## Consequences

### Positive

- Single source of truth for validation
- Type-safe forms with TypeScript
- Excellent error messages
- Easy to maintain and update
- Reusable validation schemas
- Small bundle size
- Great developer experience
- Easy testing of validation logic

### Negative

- Learning curve (Zod + React Hook Form)
- Additional dependencies
- Slightly more code initially

## Validation Strategies

### Validation Timing

```javascript
// Validate on blur (default)
useForm({
  mode: 'onBlur',
})

// Validate as you type (aggressive)
useForm({
  mode: 'onChange',
})

// Validate on submit only
useForm({
  mode: 'onSubmit',
})
```

### Server-Side Validation

```javascript
async function handleSubmit(data) {
  try {
    // Client-side validation already passed
    const result = await ProjectService.create(data)
    return result
  } catch (error) {
    // Handle server validation errors
    if (error.code === 'VALIDATION_ERROR') {
      setFormErrors(error.fields)
    }
  }
}
```

### Field-Level Validators

```javascript
// Custom async validator
const projectSchema = z.object({
  title: z.string(),
  customer_id: z.string()
    .refine(
      async (id) => {
        const exists = await CustomerService.exists(id)
        return exists
      },
      { message: 'Customer not found' }
    ),
})
```

## Organization

```
src/lib/validation/
├── authSchema.ts
├── projectSchema.ts
├── customerSchema.ts
├── invoiceSchema.ts
├── materialSchema.ts
├── estimateSchema.ts
├── utils.ts           # Common validators
└── __tests__/
```

## Testing Validation

```javascript
describe('projectSchema', () => {
  it('validates valid project data', () => {
    const data = {
      title: 'Solar Installation',
      customer_id: 'cust-123',
      solar_capacity_kw: 10,
    }
    expect(() => projectSchema.parse(data)).not.toThrow()
  })
  
  it('rejects missing title', () => {
    const data = {
      customer_id: 'cust-123',
      solar_capacity_kw: 10,
    }
    expect(() => projectSchema.parse(data)).toThrow()
  })
})
```

## Related ADRs

- ADR-001: TypeScript Adoption
- ADR-005: Folder Organization
- ADR-004: Testing Strategy

## Best Practices

1. **Schemas as single source of truth**
   - Define once, use everywhere
   - No duplicate validation

2. **Type inference**
   - Use `z.infer<typeof schema>` for types
   - Never duplicate type definitions

3. **Error messages**
   - Clear, user-friendly messages
   - i18n for internationalization

4. **Composition**
   - Break large schemas into smaller pieces
   - Combine with `.extend()` or `.merge()`

```javascript
// Compose schemas
const baseSchema = z.object({ title: z.string() })
const extendedSchema = baseSchema.extend({
  description: z.string().optional(),
})
```

5. **Async validation sparingly**
   - Use only when necessary
   - Can impact form responsiveness
   - Debounce for better UX
