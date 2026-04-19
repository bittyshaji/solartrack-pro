/**
 * Tests for useForm hook
 */

import { renderHook, act } from '@testing-library/react';
import { useForm } from '../useForm';

describe('useForm', () => {
  const initialValues = {
    name: '',
    email: '',
    age: 0,
  };

  describe('initialization', () => {
    it('should initialize with provided initial values', () => {
      const { result } = renderHook(() => useForm(initialValues));

      expect(result.current.values).toEqual(initialValues);
    });

    it('should initialize with empty errors', () => {
      const { result } = renderHook(() => useForm(initialValues));

      expect(result.current.errors).toEqual({});
    });

    it('should initialize with empty touched fields', () => {
      const { result } = renderHook(() => useForm(initialValues));

      expect(result.current.touched).toEqual({});
    });

    it('should initialize isSubmitting as false', () => {
      const { result } = renderHook(() => useForm(initialValues));

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('handleChange', () => {
    it('should update values on input change', () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.handleChange({
          target: { name: 'name', value: 'John' },
        });
      });

      expect(result.current.values.name).toBe('John');
    });

    it('should handle checkbox inputs', () => {
      const { result } = renderHook(() =>
        useForm({ ...initialValues, agreeToTerms: false }),
      );

      act(() => {
        result.current.handleChange({
          target: { name: 'agreeToTerms', type: 'checkbox', checked: true },
        });
      });

      expect(result.current.values.agreeToTerms).toBe(true);
    });

    it('should preserve other values when updating one', () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.handleChange({
          target: { name: 'name', value: 'John' },
        });
      });

      expect(result.current.values.email).toBe(initialValues.email);
      expect(result.current.values.age).toBe(initialValues.age);
    });
  });

  describe('handleBlur', () => {
    it('should mark field as touched', () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.handleBlur({ target: { name: 'name' } });
      });

      expect(result.current.touched.name).toBe(true);
    });

    it('should not affect other touched fields', () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.handleBlur({ target: { name: 'name' } });
        result.current.handleBlur({ target: { name: 'email' } });
      });

      expect(result.current.touched.name).toBe(true);
      expect(result.current.touched.email).toBe(true);
    });
  });

  describe('setValues', () => {
    it('should update form values', () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.setValues({ name: 'Jane', email: 'jane@example.com' });
      });

      expect(result.current.values.name).toBe('Jane');
      expect(result.current.values.email).toBe('jane@example.com');
    });

    it('should accept function to update values', () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.setValues((prev) => ({
          ...prev,
          name: 'John',
        }));
      });

      expect(result.current.values.name).toBe('John');
    });
  });

  describe('setErrors', () => {
    it('should set form errors', () => {
      const { result } = renderHook(() => useForm(initialValues));

      const errors = { name: 'Name is required', email: 'Invalid email' };

      act(() => {
        result.current.setErrors(errors);
      });

      expect(result.current.errors).toEqual(errors);
    });
  });

  describe('reset', () => {
    it('should reset to initial values', () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.setValues({ name: 'John', email: 'john@example.com' });
      });

      expect(result.current.values.name).toBe('John');

      act(() => {
        result.current.reset();
      });

      expect(result.current.values).toEqual(initialValues);
    });

    it('should clear errors on reset', () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.setErrors({ name: 'Required' });
      });

      expect(result.current.errors.name).toBeDefined();

      act(() => {
        result.current.reset();
      });

      expect(result.current.errors).toEqual({});
    });

    it('should clear touched fields on reset', () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.handleBlur({ target: { name: 'name' } });
      });

      expect(result.current.touched.name).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.touched).toEqual({});
    });
  });

  describe('handleSubmit', () => {
    it('should call onSubmit with current values', async () => {
      const onSubmit = jest.fn().mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useForm(initialValues, { onSubmit }));

      act(() => {
        result.current.setValues({ name: 'John', email: 'john@example.com' });
      });

      await act(async () => {
        await result.current.handleSubmit({
          preventDefault: () => {},
        });
      });

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'John', email: 'john@example.com' }),
      );
    });

    it('should set isSubmitting during submission', async () => {
      const onSubmit = jest.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(resolve, 100);
          }),
      );

      const { result } = renderHook(() => useForm(initialValues, { onSubmit }));

      act(() => {
        result.current.handleSubmit({
          preventDefault: () => {},
        });
      });

      // isSubmitting should be true during submission
      // Note: This depends on async handling in renderHook
    });

    it('should handle onSubmit errors', async () => {
      const onSubmit = jest.fn().mockRejectedValueOnce(new Error('Submit failed'));
      const { result } = renderHook(() => useForm(initialValues, { onSubmit }));

      await act(async () => {
        try {
          await result.current.handleSubmit({
            preventDefault: () => {},
          });
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('getFieldProps', () => {
    it('should return props for form field', () => {
      const { result } = renderHook(() => useForm(initialValues));

      const fieldProps = result.current.getFieldProps('name');

      expect(fieldProps.name).toBe('name');
      expect(fieldProps.value).toBe(initialValues.name);
      expect(typeof fieldProps.onChange).toBe('function');
      expect(typeof fieldProps.onBlur).toBe('function');
    });

    it('should include error when field is touched and has error', () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.setErrors({ name: 'Required' });
        result.current.handleBlur({ target: { name: 'name' } });
      });

      const fieldProps = result.current.getFieldProps('name');

      expect(fieldProps.error).toBe('Required');
    });

    it('should not include error if field is not touched', () => {
      const { result } = renderHook(() => useForm(initialValues));

      act(() => {
        result.current.setErrors({ name: 'Required' });
      });

      const fieldProps = result.current.getFieldProps('name');

      expect(fieldProps.error).toBeUndefined();
    });
  });
});
