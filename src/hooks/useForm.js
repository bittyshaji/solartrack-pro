import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for form state management
 * Handles form values, errors, touched state, and submission
 *
 * @param {Object} initialValues - Initial form values
 * @param {Function} onSubmit - Async submit handler
 * @param {Function} validate - Optional validation function
 * @returns {Object} Form state and handlers
 *
 * @example
 * const form = useForm(
 *   { name: '', email: '' },
 *   async (values) => {
 *     await submitForm(values);
 *   }
 * );
 *
 * <input
 *   name="name"
 *   value={form.values.name}
 *   onChange={form.handleChange}
 *   onBlur={form.handleBlur}
 * />
 * {form.errors.name && <span>{form.errors.name}</span>}
 */
export function useForm(initialValues = {}, onSubmit = null, validate = null) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const isDirty = useRef(false);

  /**
   * Mark form as dirty when values change
   */
  const markDirty = useCallback(() => {
    isDirty.current = true;
  }, []);

  /**
   * Handle field value change
   */
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const fieldValue = type === 'checkbox' ? checked : value;

      setValues((prev) => ({
        ...prev,
        [name]: fieldValue,
      }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }

      markDirty();
    },
    [errors],
  );

  /**
   * Handle field blur
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate field if custom validation provided
    if (validate) {
      const fieldErrors = validate({ [name]: values[name] });
      if (fieldErrors && fieldErrors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: fieldErrors[name],
        }));
      }
    }
  }, [values, validate]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e) => {
      if (e && e.preventDefault) {
        e.preventDefault();
      }

      if (!onSubmit) return;

      // Run validation if provided
      if (validate) {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          setTouched(
            Object.keys(values).reduce((acc, key) => {
              acc[key] = true;
              return acc;
            }, {}),
          );
          return;
        }
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        await onSubmit(values);
      } catch (error) {
        setSubmitError(error.message || 'An error occurred');

        // If error has field-specific errors
        if (error.field) {
          setErrors((prev) => ({
            ...prev,
            [error.field]: error.message,
          }));
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit, validate],
  );

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitError(null);
    isDirty.current = false;
  }, [initialValues]);

  /**
   * Set a single field value
   */
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    markDirty();
  }, []);

  /**
   * Set a single field error
   */
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  /**
   * Set multiple field errors
   */
  const setFieldErrors = useCallback((fieldErrors) => {
    setErrors(fieldErrors);
  }, []);

  /**
   * Mark fields as touched
   */
  const setFieldTouched = useCallback((name, touched = true) => {
    setTouched((prev) => ({
      ...prev,
      [name]: touched,
    }));
  }, []);

  /**
   * Get field props for input elements
   */
  const getFieldProps = useCallback(
    (name) => ({
      name,
      value: values[name] ?? '',
      onChange: handleChange,
      onBlur: handleBlur,
    }),
    [values, handleChange, handleBlur],
  );

  return {
    // State
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    isDirty: isDirty.current,

    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,

    // Methods
    reset,
    setFieldValue,
    setFieldError,
    setFieldErrors,
    setFieldTouched,
    getFieldProps,
  };
}

export default useForm;
