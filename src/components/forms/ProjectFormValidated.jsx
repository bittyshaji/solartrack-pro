/**
 * ProjectFormValidated Component
 * Form for creating and editing projects with Zod and React Hook Form validation
 *
 * @example
 * <ProjectFormValidated
 *   onSubmit={(data) => console.log(data)}
 *   defaultValues={projectData}
 * />
 */

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProjectSchema, updateProjectSchema } from '../../lib/validation/projectSchema';
import { getFieldError, formatValidationError } from '../../lib/validation/utils';
import toast from 'react-hot-toast';

/**
 * Project Form Component
 * @param {Object} props - Component props
 * @param {Function} props.onSubmit - Callback when form is submitted successfully
 * @param {Object} props.defaultValues - Initial form values
 * @param {Boolean} props.isUpdate - Whether this is an update form
 * @param {Function} props.onCancel - Callback to cancel form editing
 * @returns {JSX.Element} - Form component
 */
export function ProjectFormValidated({
  onSubmit,
  defaultValues = {},
  isUpdate = false,
  onCancel,
}) {
  const schema = isUpdate ? updateProjectSchema : createProjectSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  /**
   * Handle form submission
   * @param {Object} data - Validated form data
   */
  const handleFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      toast.success(isUpdate ? 'Project updated successfully' : 'Project created successfully');
      if (!isUpdate) {
        reset();
      }
    } catch (error) {
      const message = error?.message || 'An error occurred while saving the project';
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
      {/* Project Name */}
      <div>
        <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
          Project Name *
        </label>
        <input
          {...register('projectName')}
          id="projectName"
          type="text"
          placeholder="e.g., Residential Solar Installation"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
            errors.projectName ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {getErrorMessage('projectName') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('projectName')}</p>
        )}
      </div>

      {/* Customer ID */}
      <div>
        <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
          Customer *
        </label>
        <input
          {...register('customerId')}
          id="customerId"
          type="text"
          placeholder="Select a customer"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
            errors.customerId ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {getErrorMessage('customerId') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('customerId')}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('description')}
          id="description"
          rows={4}
          placeholder="Project description..."
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {getErrorMessage('description') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('description')}</p>
        )}
      </div>

      {/* System Size */}
      <div>
        <label htmlFor="systemSize" className="block text-sm font-medium text-gray-700">
          System Size (kW) *
        </label>
        <input
          {...register('systemSize', { valueAsNumber: true })}
          id="systemSize"
          type="number"
          step="0.1"
          placeholder="10.5"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
            errors.systemSize ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {getErrorMessage('systemSize') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('systemSize')}</p>
        )}
      </div>

      {/* Estimated Cost */}
      <div>
        <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700">
          Estimated Cost (INR) *
        </label>
        <input
          {...register('estimatedCost', { valueAsNumber: true })}
          id="estimatedCost"
          type="number"
          step="1000"
          placeholder="500000"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
            errors.estimatedCost ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {getErrorMessage('estimatedCost') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('estimatedCost')}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location *
        </label>
        <input
          {...register('location')}
          id="location"
          type="text"
          placeholder="Physical location of the project"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
            errors.location ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {getErrorMessage('location') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('location')}</p>
        )}
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status *
        </label>
        <select
          {...register('status')}
          id="status"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
            errors.status ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select status</option>
          <option value="site_survey">Site Survey</option>
          <option value="proposal">Proposal</option>
          <option value="customer_approval">Customer Approval</option>
          <option value="advanced_payment">Advanced Payment</option>
          <option value="material_procurement">Material Procurement</option>
          <option value="installation">Installation</option>
          <option value="testing_commissioning">Testing & Commissioning</option>
          <option value="final_approval">Final Approval</option>
          <option value="completed">Completed</option>
          <option value="hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {getErrorMessage('status') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('status')}</p>
        )}
      </div>

      {/* Start Date */}
      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
          Start Date {!isUpdate && '*'}
        </label>
        <input
          {...register('startDate')}
          id="startDate"
          type="datetime-local"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
            errors.startDate ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {getErrorMessage('startDate') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('startDate')}</p>
        )}
      </div>

      {/* End Date */}
      <div>
        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
          End Date {!isUpdate && '*'}
        </label>
        <input
          {...register('endDate')}
          id="endDate"
          type="datetime-local"
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
            errors.endDate ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {getErrorMessage('endDate') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('endDate')}</p>
        )}
        {startDate && endDate && new Date(startDate) >= new Date(endDate) && (
          <p className="mt-1 text-sm text-red-600">End date must be after start date</p>
        )}
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
          placeholder="Additional project notes..."
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 ${
            errors.notes ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {getErrorMessage('notes') && (
          <p className="mt-1 text-sm text-red-600">{getErrorMessage('notes')}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isSubmitting ? 'Saving...' : isUpdate ? 'Update Project' : 'Create Project'}
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

export default ProjectFormValidated;
