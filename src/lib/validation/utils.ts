/**
 * Form Validation Utility Functions
 * Provides helpers for working with React Hook Form and Zod validation
 */

/**
 * Get the first error message for a specific field
 * @param {Object} errors - Errors object from React Hook Form
 * @param {string} fieldName - Name of the field to get error for
 * @returns {string|undefined} - The error message or undefined if no error
 */
export const getFieldError = (errors: any, fieldName: string): string | undefined => {
  const keys = fieldName.split('.');
  let current = errors;

  for (const key of keys) {
    if (current && current[key]) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current?.message || undefined;
};

/**
 * Get all errors for a form
 * @param {Object} errors - Errors object from React Hook Form
 * @returns {Object} - Flattened object with field paths as keys and error messages as values
 */
export const getFormErrors = (errors: any): Record<string, string> => {
  const result: Record<string, string> = {};

  const flatten = (obj: any, prefix = '') => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        const fullKey = prefix ? `${prefix}.${key}` : key;

        if (value?.message) {
          result[fullKey] = value.message;
        } else if (typeof value === 'object' && value !== null) {
          flatten(value, fullKey);
        }
      }
    }
  };

  flatten(errors);
  return result;
};

/**
 * Format validation error for UI display
 * Capitalizes first letter and handles common validation messages
 * @param {string} error - Raw error message from Zod
 * @returns {string} - Formatted error message for display
 */
export const formatValidationError = (error: string): string => {
  // Handle common validation messages
  const messages: Record<string, string> = {
    'Invalid email': 'Please enter a valid email address',
    'String must contain at least': 'This field does not meet minimum length requirements',
    'String must contain at most': 'This field exceeds maximum length',
    'Expected number': 'This field must be a number',
    'Expected string': 'This field must be text',
    'Expected array': 'This field must be an array',
    'Expected boolean': 'This field must be true or false',
  };

  // Check for matching patterns
  for (const [key, value] of Object.entries(messages)) {
    if (error.includes(key)) {
      return value;
    }
  }

  // Default formatting: capitalize first letter
  return error.charAt(0).toUpperCase() + error.slice(1);
};

/**
 * Create async validator for checking uniqueness (e.g., email, username)
 * @param {Function} checkFn - Async function that checks if value exists
 * @param {string} fieldName - Display name of the field
 * @returns {Function} - Zod refine function
 */
export const createAsyncValidator = (
  checkFn: (value: string) => Promise<boolean>,
  fieldName: string
) => {
  return async (value: string) => {
    try {
      const exists = await checkFn(value);
      if (exists) {
        throw new Error(`This ${fieldName} is already in use`);
      }
      return true;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error(`Unable to validate ${fieldName}`);
    }
  };
};

/**
 * Validate a single field against a schema
 * Useful for real-time field validation
 * @param {Object} schema - Zod schema
 * @param {string} fieldName - Field to validate
 * @param {any} value - Value to validate
 * @returns {Promise<Object>} - { valid: boolean, error?: string }
 */
export const validateField = async (
  schema: any,
  fieldName: string,
  value: any
): Promise<{ valid: boolean; error?: string }> => {
  try {
    const shape = schema._def?.shape;
    if (!shape || !shape[fieldName]) {
      return { valid: true };
    }

    const fieldSchema = shape[fieldName];
    await fieldSchema.parseAsync(value);
    return { valid: true };
  } catch (error) {
    if (error instanceof Error) {
      return { valid: false, error: error.message };
    }
    return { valid: false, error: 'Validation failed' };
  }
};

/**
 * Convert Zod error to react-hook-form compatible error format
 * @param {Object} zodError - Error from Zod parsing
 * @returns {Object} - Errors object compatible with react-hook-form
 */
export const zodErrorToFormErrors = (zodError: any): Record<string, any> => {
  const errors: Record<string, any> = {};

  if (zodError?.errors) {
    zodError.errors.forEach((error: any) => {
      const path = error.path.join('.');
      errors[path] = {
        message: error.message,
        type: error.code,
      };
    });
  }

  return errors;
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Check if a string is a valid phone number (basic international format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  // Matches phone numbers with 10-15 digits, allowing common formatting
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Check if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Compare two passwords for matching
 * Useful for password confirmation fields
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {boolean} - True if passwords match
 */
export const passwordsMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};
