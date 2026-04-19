# Form Validation System

Comprehensive form validation for SolarTrack Pro using Zod and React Hook Form.

## Overview

This validation system provides production-ready, type-safe form validation with clear error messages and seamless React integration.

### Key Features

- **Zod Schema Validation**: Type-safe validation with comprehensive constraints
- **React Hook Form Integration**: Efficient form state management with minimal re-renders
- **Custom Error Handling**: User-friendly error messages with formatting
- **Type Safety**: Full TypeScript support with automatic type inference
- **Async Validation**: Support for server-side validation checks
- **Modular Design**: Separate schemas for each entity (projects, customers, etc.)

## Available Schemas

### Authentication (`authSchema.ts`)

- `loginSchema` - User login validation
- `signupSchema` - User registration with password confirmation
- `passwordResetRequestSchema` - Password reset request
- `passwordResetConfirmSchema` - Password reset confirmation with new password
- `changePasswordSchema` - Change password for authenticated users
- `emailVerificationSchema` - Email verification with code
- `setupTwoFactorSchema` - Two-factor authentication setup
- `verifyTwoFactorSchema` - Two-factor authentication verification
- `accountUnlockSchema` - Account unlock with token
- `oauthConnectionSchema` - OAuth/SSO provider connection

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*)

### Project (`projectSchema.ts`)

- `createProjectSchema` - New project creation
- `updateProjectSchema` - Project update (all fields optional)
- `projectFilterSchema` - Project search and filtering
- `projectBulkOperationSchema` - Bulk operations on projects
- `updateProjectStatusSchema` - Project status change

**Status Options:**
- site_survey, proposal, customer_approval, advanced_payment
- material_procurement, installation, testing_commissioning
- final_approval, completed, hold, cancelled

### Customer (`customerSchema.ts`)

- `createCustomerSchema` - New customer creation
- `updateCustomerSchema` - Customer update
- `customerFilterSchema` - Customer search and filtering
- `customerCommunicationSchema` - Communication preferences
- `updateCustomerContactSchema` - Update contact information
- `bulkCustomerImportSchema` - Bulk import customers

**Validation Features:**
- Email format validation
- Phone number format (international)
- GSTIN and PAN format for Indian businesses
- Address validation with postal code constraints

### Invoice (`invoiceSchema.ts`)

- `createInvoiceSchema` - Invoice creation
- `updateInvoiceSchema` - Invoice updates
- `invoicePaymentSchema` - Payment record entry
- `invoiceSendSchema` - Send invoice to customer
- `invoiceFilterSchema` - Invoice search and filtering
- `invoiceBulkOperationSchema` - Bulk invoice operations
- `invoiceTotalsSchema` - Invoice calculation validation

**Line Item Fields:**
- Description, quantity, unit price
- Tax rate (0-100%)
- Discount percentage (0-100%)
- HSN/SAC codes for GST

**Payment Methods:**
- cash, check, bank_transfer, credit_card, upi, other

### Estimate (`estimateSchema.ts`)

- `createEstimateSchema` - Estimate/proposal creation
- `updateEstimateSchema` - Estimate update
- `estimateSendSchema` - Send estimate to customer
- `convertEstimateToInvoiceSchema` - Convert estimate to invoice
- `estimateFilterSchema` - Estimate search and filtering
- `estimateComparisonSchema` - Compare multiple estimates

**System Design Options:**
- System type: grid_connected, off_grid, hybrid
- Equipment types: panel, inverter, battery, mounting, cable, breaker, monitoring
- Warranty period tracking

### Material (`materialSchema.ts`)

- `createMaterialSchema` - Material/inventory creation
- `updateMaterialSchema` - Material update
- `materialStockAdjustmentSchema` - Stock level adjustments
- `materialUsageRecordSchema` - Record material usage
- `materialReorderSchema` - Reorder material
- `bulkMaterialImportSchema` - Bulk import materials
- `materialFilterSchema` - Material search and filtering

**Material Types:**
- solar_panel, inverter, battery, mounting_structure
- cable, connector, breaker, fuse, monitoring_device, labor, other

**Units:**
- piece, meter, kilogram, liter, box, set, hour, day

## Utility Functions

All utility functions are in `utils.ts`:

### Field-Level Utilities

```typescript
// Get error message for a specific field
getFieldError(errors: any, fieldName: string): string | undefined

// Get all form errors as flat object
getFormErrors(errors: any): Record<string, string>

// Format error message for UI display
formatValidationError(error: string): string

// Validate a single field in real-time
validateField(schema, fieldName, value): Promise<{ valid: boolean; error?: string }>
```

### Custom Validators

```typescript
// Create async validator for uniqueness checks
createAsyncValidator(checkFn, fieldName): Function

// Check phone number validity
isValidPhoneNumber(phone: string): boolean

// Check URL validity
isValidUrl(url: string): boolean

// Compare passwords
passwordsMatch(password: string, confirmPassword: string): boolean

// Sanitize user input (XSS prevention)
sanitizeInput(input: string): string
```

### Error Handling

```typescript
// Convert Zod errors to React Hook Form format
zodErrorToFormErrors(zodError: any): Record<string, any>
```

## Usage Examples

### Basic Form with Project Schema

```jsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema } from '@/lib/validation/projectSchema';
import { getFieldError } from '@/lib/validation/utils';

function ProjectForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(createProjectSchema),
    mode: 'onBlur',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('projectName')} />
      {getFieldError(errors, 'projectName') && (
        <p className="error">{getFieldError(errors, 'projectName')}</p>
      )}
      <button type="submit">Create Project</button>
    </form>
  );
}
```

### Using Pre-built Form Components

```jsx
import { ProjectFormValidated } from '@/components/forms/ProjectFormValidated';
import { CustomerFormValidated } from '@/components/forms/CustomerFormValidated';
import { LoginFormValidated } from '@/components/forms/LoginFormValidated';

// Create project
<ProjectFormValidated
  onSubmit={async (data) => {
    await api.createProject(data);
  }}
  onCancel={() => navigate(-1)}
/>

// Create customer
<CustomerFormValidated
  onSubmit={async (data) => {
    await api.createCustomer(data);
  }}
  isUpdate={false}
/>

// Login
<LoginFormValidated
  onSubmit={async (data) => {
    await auth.login(data);
  }}
  onSignupClick={() => navigate('/signup')}
  onForgotPasswordClick={() => navigate('/forgot-password')}
/>
```

### Real-time Field Validation

```jsx
import { validateField } from '@/lib/validation/utils';
import { createCustomerSchema } from '@/lib/validation/customerSchema';

async function handleEmailChange(email) {
  const result = await validateField(createCustomerSchema, 'email', email);
  if (!result.valid) {
    setEmailError(result.error);
  }
}
```

### Custom Async Validation

```jsx
import { createAsyncValidator } from '@/lib/validation/utils';

// Check if email exists in database
const checkEmailExists = async (email) => {
  const response = await api.checkEmailExists(email);
  return response.exists;
};

// Create custom schema with async validation
const customSchema = createCustomerSchema.extend({
  email: createCustomerSchema.shape.email
    .refine(
      async (email) => {
        const exists = await checkEmailExists(email);
        return !exists; // Valid if doesn't exist
      },
      'Email already registered'
    ),
});
```

### Handling Validation Errors

```jsx
import { getFormErrors, formatValidationError } from '@/lib/validation/utils';

function handleErrors(errors) {
  // Get all errors as flat object
  const allErrors = getFormErrors(errors);
  
  // Log formatted errors
  Object.entries(allErrors).forEach(([field, message]) => {
    console.log(`${field}: ${formatValidationError(message)}`);
  });
  
  // Display to user
  toast.error('Please fix the validation errors');
}
```

### Type Inference

All schemas export TypeScript types that can be used for form data:

```typescript
import type { CreateProjectData } from '@/lib/validation/projectSchema';
import type { CreateCustomerData } from '@/lib/validation/customerSchema';
import type { LoginData } from '@/lib/validation/authSchema';

async function handleProjectSubmit(data: CreateProjectData) {
  // data is fully typed and autocompleted
  const response = await api.createProject(data);
}
```

## Validation Rules Reference

### Length Constraints

| Field | Min | Max |
|-------|-----|-----|
| projectName | 2 | 100 |
| description | - | 1000 |
| firstName/lastName | 1 | 50 |
| email | - | (standard) |
| phone | - | (international) |
| GSTIN | 15 | 15 |
| PAN | 10 | 10 |
| invoiceNumber | 1 | 50 |
| materialName | 2 | 200 |

### Numeric Constraints

| Field | Min | Max |
|-------|-----|-----|
| systemSize | 0 | 1000 |
| quantity | > 0 | - |
| taxRate | 0 | 100 |
| discount | 0 | 100 |
| stock | >= 0 | - |

### Date/Time Validation

- Dates must be valid ISO 8601 format
- End dates must be after start dates (when both provided)
- Due dates must be on or after invoice dates

### Format Validation

| Field | Pattern |
|-------|---------|
| Email | Standard email format |
| Phone | International format (10-15 digits) |
| GSTIN | 15-character Indian GST format |
| PAN | 10-character Indian PAN format |
| postalCode | 5-10 digits |
| URL | Valid URL format |
| Password | Min 8 chars, uppercase, lowercase, number, special char |

## Testing

Run validation tests:

```bash
npm run test -- src/lib/validation/__tests__/schemas.test.js
npm run test:watch -- src/lib/validation/__tests__/
npm run test:coverage
```

Test coverage includes:
- Schema validation success cases
- Error validation with invalid data
- Length constraints
- Format validation
- Cross-field validation (date ranges, password matching)
- Default value application
- Type exports

## Best Practices

1. **Always use appropriate mode**: Use `onBlur` for immediate feedback, `onChange` for real-time feedback
2. **Custom error messages**: Add context-specific error messages in schemas
3. **Async validation**: Perform expensive checks (database lookups) asynchronously
4. **XSS prevention**: Use `sanitizeInput()` before storing user data
5. **Type safety**: Leverage TypeScript types from schema inference
6. **Error handling**: Always catch and log validation errors
7. **User experience**: Display errors near fields, not in alerts
8. **Accessibility**: Include proper labels and ARIA attributes

## Troubleshooting

### "Schema validation failed"
- Check that all required fields are provided
- Verify field types match schema expectations
- Use `safeParse()` to get detailed error information

### "Type 'X' is not assignable to type 'Y'"
- Ensure form data types match schema types
- Use type inference: `type FormData = z.infer<typeof schema>`

### "Field error not displaying"
- Verify field names match between register and validation
- Check that mode is set correctly ('onBlur', 'onChange', or 'onSubmit')
- Ensure resolver is properly configured

### "Async validation not working"
- Confirm async function returns Promise
- Check network requests in browser devtools
- Add error handling for failed validations

## Additional Resources

- [Zod Documentation](https://zod.dev)
- [React Hook Form Docs](https://react-hook-form.com)
- [Form Validation Guide](./VALIDATION_SETUP_GUIDE.md)

## Related Files

- `projectSchema.ts` - Project validation
- `customerSchema.ts` - Customer validation
- `invoiceSchema.ts` - Invoice validation
- `estimateSchema.ts` - Estimate validation
- `materialSchema.ts` - Material validation
- `authSchema.ts` - Authentication validation
- `utils.ts` - Utility functions
- `__tests__/schemas.test.js` - Test suite

## Version History

### v1.0.0 (Current)
- Initial implementation with all schemas
- React Hook Form integration
- Utility functions and helpers
- Form components
- Test suite
- Complete documentation
