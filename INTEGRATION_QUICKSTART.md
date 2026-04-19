# Form Validation - Integration Quick Start

Get up and running with form validation in 5 minutes.

## Step 1: Import the Form Component

```jsx
import { ProjectFormValidated } from '@/components/forms';
```

## Step 2: Use in Your Page

```jsx
export default function CreateProjectPage() {
  const navigate = useNavigate();

  const handleSubmit = async (data) => {
    try {
      const response = await api.projects.create(data);
      toast.success('Project created successfully');
      navigate('/projects');
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  return (
    <div className="page">
      <h1>Create New Project</h1>
      <ProjectFormValidated
        onSubmit={handleSubmit}
        onCancel={() => navigate(-1)}
      />
    </div>
  );
}
```

## Step 3: Build Custom Form (If Needed)

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, getFieldError } from '@/lib/validation';

function CustomProjectForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createProjectSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('projectName')} />
      {getFieldError(errors, 'projectName') && (
        <p className="error">{getFieldError(errors, 'projectName')}</p>
      )}
      <button type="submit" disabled={isSubmitting}>
        Create
      </button>
    </form>
  );
}
```

## Available Pre-built Components

### 1. ProjectFormValidated
```jsx
<ProjectFormValidated
  onSubmit={async (data) => { /* data: CreateProjectData */ }}
  defaultValues={{}} // Optional
  isUpdate={false}   // true for update form
  onCancel={() => {}} // Optional
/>
```

### 2. CustomerFormValidated
```jsx
<CustomerFormValidated
  onSubmit={async (data) => { /* data: CreateCustomerData */ }}
  defaultValues={{}} // Optional
  isUpdate={false}
  onCancel={() => {}}
/>
```

### 3. LoginFormValidated
```jsx
<LoginFormValidated
  onSubmit={async (data) => { /* data: LoginData */ }}
  onSignupClick={() => navigate('/signup')}
  onForgotPasswordClick={() => navigate('/forgot-password')}
/>
```

## Available Schemas

```typescript
// Import schemas
import {
  createProjectSchema,
  createCustomerSchema,
  createInvoiceSchema,
  createEstimateSchema,
  createMaterialSchema,
  loginSchema,
  // ... and many more
} from '@/lib/validation';

// Use in useForm
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(createProjectSchema),
});
```

## Common Patterns

### Form with Dynamic Fields

```jsx
import { useFieldArray } from 'react-hook-form';

function InvoiceForm() {
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
          <input {...register(`lineItems.${index}.quantity`)} />
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => append({})}>Add Item</button>
    </div>
  );
}
```

### Type-Safe Form Data

```typescript
import type { CreateProjectData } from '@/lib/validation';

async function handleCreateProject(data: CreateProjectData) {
  // 'data' is fully typed with autocomplete
  const response = await api.projects.create(data);
  return response;
}
```

### Real-time Field Validation

```jsx
import { validateField } from '@/lib/validation';

async function handleEmailChange(e) {
  const email = e.target.value;
  const result = await validateField(createCustomerSchema, 'email', email);
  if (!result.valid) {
    setEmailError(result.error);
  }
}
```

## Error Handling

```jsx
import { getFieldError, getFormErrors } from '@/lib/validation';

// Single field error
{getFieldError(errors, 'projectName') && (
  <p className="error">{getFieldError(errors, 'projectName')}</p>
)}

// All errors at once
{Object.keys(errors).length > 0 && (
  <div className="alert-error">
    Please fix these errors:
    <ul>
      {Object.entries(getFormErrors(errors)).map(([field, msg]) => (
        <li key={field}>{msg}</li>
      ))}
    </ul>
  </div>
)}
```

## Form Modes

Choose validation mode based on UX needs:

```jsx
// Best for most forms - validate when user leaves field
<form {...useForm({ mode: 'onBlur' })}>

// Real-time feedback while typing
<form {...useForm({ mode: 'onChange' })}>

// Only validate on submit
<form {...useForm({ mode: 'onSubmit' })}>
```

## Input Types

### Text Fields
```jsx
<input {...register('projectName')} type="text" />
```

### Email
```jsx
<input {...register('email')} type="email" />
```

### Phone
```jsx
<input {...register('phone')} type="tel" />
```

### Number (Important: valueAsNumber)
```jsx
<input 
  {...register('systemSize', { valueAsNumber: true })} 
  type="number" 
/>
```

### Date/Time
```jsx
<input {...register('startDate')} type="datetime-local" />
```

### Select/Dropdown
```jsx
<select {...register('status')}>
  <option value="draft">Draft</option>
  <option value="published">Published</option>
</select>
```

### Checkbox
```jsx
<input {...register('acceptTerms')} type="checkbox" />
```

### Textarea
```jsx
<textarea {...register('description')} rows={4} />
```

### Nested Objects
```jsx
<input {...register('address.street')} />
<input {...register('address.city')} />
```

## API Integration

```typescript
// Define your API client
const api = {
  projects: {
    create: async (data: CreateProjectData) => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create');
      return response.json();
    },
  },
  customers: {
    create: async (data: CreateCustomerData) => {
      // ...
    },
  },
};

// Use in form
const handleSubmit = async (data: CreateProjectData) => {
  try {
    const result = await api.projects.create(data);
    toast.success('Success!');
  } catch (error) {
    toast.error(error.message);
  }
};
```

## Styling Examples

### Tailwind CSS

```jsx
<input
  {...register('projectName')}
  className={`px-4 py-2 border rounded-lg ${
    errors.projectName ? 'border-red-500 bg-red-50' : 'border-gray-300'
  }`}
/>
{errors.projectName && (
  <p className="mt-1 text-sm text-red-600">{errors.projectName.message}</p>
)}
```

### CSS Modules

```jsx
<input
  {...register('projectName')}
  className={errors.projectName ? styles.inputError : styles.input}
/>
{errors.projectName && (
  <p className={styles.errorMessage}>{errors.projectName.message}</p>
)}
```

### Custom CSS

```jsx
<input
  {...register('projectName')}
  style={{
    borderColor: errors.projectName ? '#ef4444' : '#d1d5db',
    backgroundColor: errors.projectName ? '#fef2f2' : '#fff',
  }}
/>
{errors.projectName && (
  <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>
    {errors.projectName.message}
  </p>
)}
```

## Form States

```jsx
const { formState: { isSubmitting, isDirty, isValid, errors } } = useForm();

// Show loading state
<button disabled={isSubmitting}>
  {isSubmitting ? 'Creating...' : 'Create'}
</button>

// Show submit button only if form has changes
<button disabled={!isDirty}>
  Submit
</button>

// Show error summary
{!isValid && (
  <div className="alert-error">
    Please fix the errors below
  </div>
)}
```

## Testing Your Form

```bash
# Run all validation tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

## Documentation

- **Full Guide**: [VALIDATION_SETUP_GUIDE.md](./VALIDATION_SETUP_GUIDE.md)
- **Schema Reference**: [src/lib/validation/README.md](./src/lib/validation/README.md)
- **Quick Reference**: [src/lib/validation/QUICK_REFERENCE.md](./src/lib/validation/QUICK_REFERENCE.md)

## Troubleshooting

### Issue: Numbers coming as strings
**Solution:** Use `valueAsNumber`:
```jsx
{...register('systemSize', { valueAsNumber: true })}
```

### Issue: Date validation failing
**Solution:** Use ISO 8601 format:
```jsx
{...register('startDate')} // Works with datetime-local input
```

### Issue: Nested field errors not showing
**Solution:** Use dot notation in error checking:
```jsx
getFieldError(errors, 'address.street')
```

### Issue: Can't get validation errors
**Solution:** Use `safeParse()` instead of `parse()`:
```typescript
const result = schema.safeParse(data);
if (!result.success) {
  console.log(result.error.issues);
}
```

## Next Steps

1. ✅ Replace existing forms with validated components
2. ✅ Update API integration endpoints
3. ✅ Test all forms thoroughly
4. ✅ Customize error messages for your domain
5. ✅ Style components to match your design
6. ✅ Add additional schemas for new features

## Support

- Check [Quick Reference](./src/lib/validation/QUICK_REFERENCE.md) for quick answers
- See [Full Documentation](./VALIDATION_SETUP_GUIDE.md) for detailed explanations
- Review [Test Suite](./src/lib/validation/__tests__/schemas.test.js) for examples

---

**Ready to start?** Pick a form to convert and follow the patterns above!
