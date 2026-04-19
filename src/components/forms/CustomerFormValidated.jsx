/**
 * CustomerFormValidated Component
 * Form for creating and editing customers with comprehensive validation
 *
 * @example
 * <CustomerFormValidated
 *   onSubmit={(data) => console.log(data)}
 *   defaultValues={customerData}
 * />
 */

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCustomerSchema, updateCustomerSchema } from '../../lib/validation/customerSchema';
import { getFieldError, formatValidationError } from '../../lib/validation/utils';
import toast from 'react-hot-toast';

/**
 * Customer Form Component
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Callback when form is submitted
 * @param {Object} props.defaultValues - Initial form values
 * @param {Boolean} props.isUpdate - Whether this is an update form
 * @param {Function} props.onCancel - Callback to cancel
 * @returns {JSX.Element} - Form component
 */
export function CustomerFormValidated({
  onSubmit,
  defaultValues = {},
  isUpdate = false,
  onCancel,
}) {
  const schema = isUpdate ? updateCustomerSchema : createCustomerSchema;
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      toast.success(isUpdate ? 'Customer updated successfully' : 'Customer created successfully');
      if (!isUpdate) {
        reset();
      }
    } catch (error) {
      const message = error?.message || 'An error occurred while saving the customer';
      toast.error(message);
      console.error('Form submission error:', error);
    }
  };

  const getErrorMessage = (fieldName) => {
    const error = getFieldError(errors, fieldName);
    return error ? formatValidationError(error) : '';
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl mx-auto">
      {/* Basic Information Section */}
      <fieldset className="border-b pb-6">
        <legend className="text-lg font-semibold text-gray-900 mb-4">Basic Information</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name *
            </label>
            <input
              {...register('firstName')}
              id="firstName"
              type="text"
              placeholder="John"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {getErrorMessage('firstName') && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage('firstName')}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name *
            </label>
            <input
              {...register('lastName')}
              id="lastName"
              type="text"
              placeholder="Doe"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {getErrorMessage('lastName') && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage('lastName')}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="mt-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <input
            {...register('email')}
            id="email"
            type="email"
            placeholder="john@example.com"
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {getErrorMessage('email') && (
            <p className="mt-1 text-sm text-red-600">{getErrorMessage('email')}</p>
          )}
        </div>

        {/* Company Name */}
        <div className="mt-4">
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            {...register('companyName')}
            id="companyName"
            type="text"
            placeholder="Acme Corp"
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
              errors.companyName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {getErrorMessage('companyName') && (
            <p className="mt-1 text-sm text-red-600">{getErrorMessage('companyName')}</p>
          )}
        </div>
      </fieldset>

      {/* Contact Information Section */}
      <fieldset className="border-b pb-6">
        <legend className="text-lg font-semibold text-gray-900 mb-4">Contact Information</legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number *
            </label>
            <input
              {...register('phone')}
              id="phone"
              type="tel"
              placeholder="+91-9999-999999"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {getErrorMessage('phone') && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage('phone')}</p>
            )}
          </div>

          {/* Alternate Phone */}
          <div>
            <label htmlFor="alternatePhone" className="block text-sm font-medium text-gray-700">
              Alternate Phone
            </label>
            <input
              {...register('alternatePhone')}
              id="alternatePhone"
              type="tel"
              placeholder="+91-9999-999998"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
                errors.alternatePhone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {getErrorMessage('alternatePhone') && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage('alternatePhone')}</p>
            )}
          </div>
        </div>

        {/* Preferred Contact Method */}
        <div className="mt-4">
          <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-gray-700">
            Preferred Contact Method
          </label>
          <select
            {...register('preferredContactMethod')}
            id="preferredContactMethod"
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
              errors.preferredContactMethod ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="sms">SMS</option>
          </select>
          {getErrorMessage('preferredContactMethod') && (
            <p className="mt-1 text-sm text-red-600">{getErrorMessage('preferredContactMethod')}</p>
          )}
        </div>
      </fieldset>

      {/* Address Section */}
      <fieldset className="border-b pb-6">
        <legend className="text-lg font-semibold text-gray-900 mb-4">Address</legend>

        {/* Street */}
        <div>
          <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
            Street Address *
          </label>
          <input
            {...register('address.street')}
            id="address.street"
            type="text"
            placeholder="123 Main St"
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
              errors.address?.street ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {getErrorMessage('address.street') && (
            <p className="mt-1 text-sm text-red-600">{getErrorMessage('address.street')}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* City */}
          <div>
            <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
              City *
            </label>
            <input
              {...register('address.city')}
              id="address.city"
              type="text"
              placeholder="Bangalore"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
                errors.address?.city ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {getErrorMessage('address.city') && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage('address.city')}</p>
            )}
          </div>

          {/* State */}
          <div>
            <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
              State *
            </label>
            <input
              {...register('address.state')}
              id="address.state"
              type="text"
              placeholder="Karnataka"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
                errors.address?.state ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {getErrorMessage('address.state') && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage('address.state')}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Postal Code */}
          <div>
            <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700">
              Postal Code *
            </label>
            <input
              {...register('address.postalCode')}
              id="address.postalCode"
              type="text"
              placeholder="560001"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
                errors.address?.postalCode ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {getErrorMessage('address.postalCode') && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage('address.postalCode')}</p>
            )}
          </div>

          {/* Country */}
          <div>
            <label htmlFor="address.country" className="block text-sm font-medium text-gray-700">
              Country *
            </label>
            <input
              {...register('address.country')}
              id="address.country"
              type="text"
              placeholder="India"
              className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
                errors.address?.country ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {getErrorMessage('address.country') && (
              <p className="mt-1 text-sm text-red-600">{getErrorMessage('address.country')}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Advanced Section - Tax & Preferences */}
      <fieldset className="border-b pb-6">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <legend className="text-lg font-semibold text-gray-900">
            Tax & Additional Information
          </legend>
          <span className="text-gray-400">{showAdvanced ? '▼' : '▶'}</span>
        </div>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            {/* GSTIN */}
            <div>
              <label htmlFor="gstin" className="block text-sm font-medium text-gray-700">
                GSTIN
              </label>
              <input
                {...register('gstin')}
                id="gstin"
                type="text"
                placeholder="27AAPFU0123GSTIN"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
                  errors.gstin ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {getErrorMessage('gstin') && (
                <p className="mt-1 text-sm text-red-600">{getErrorMessage('gstin')}</p>
              )}
            </div>

            {/* PAN Number */}
            <div>
              <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700">
                PAN Number
              </label>
              <input
                {...register('panNumber')}
                id="panNumber"
                type="text"
                placeholder="AAAAA0000A"
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
                  errors.panNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {getErrorMessage('panNumber') && (
                <p className="mt-1 text-sm text-red-600">{getErrorMessage('panNumber')}</p>
              )}
            </div>

            {/* Tax Exempt Checkbox */}
            <div className="flex items-center">
              <input
                {...register('taxExempt')}
                id="taxExempt"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="taxExempt" className="ml-2 block text-sm text-gray-700">
                Tax Exempt
              </label>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                {...register('notes')}
                id="notes"
                rows={3}
                placeholder="Additional notes..."
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
                  errors.notes ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {getErrorMessage('notes') && (
                <p className="mt-1 text-sm text-red-600">{getErrorMessage('notes')}</p>
              )}
            </div>
          </div>
        )}
      </fieldset>

      {/* Form Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isSubmitting ? 'Saving...' : isUpdate ? 'Update Customer' : 'Create Customer'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default CustomerFormValidated;
