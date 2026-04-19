/**
 * ProjectForm Fields Component
 * Reusable form field components for project form
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Plus } from 'lucide-react';
import { PROJECT_STATUSES, PROJECT_STAGES } from '../../../lib/projectService';
import './styles.css';

/**
 * FormField - Text input field
 */
export const FormField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  type = 'text'
}) => {
  return (
    <div className="form-field">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="form-input"
        disabled={disabled}
        required={required}
      />
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  type: PropTypes.string
};

FormField.defaultProps = {
  placeholder: '',
  disabled: false,
  required: false,
  type: 'text'
};

/**
 * SelectField - Dropdown select field
 */
export const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  disabled,
  required,
  loading,
  loadingText
}) => {
  return (
    <div className="form-field">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="form-input"
        disabled={disabled || loading}
        required={required}
      >
        <option value="">
          {loading ? loadingText : 'Select...'}
        </option>
        {options.map(option => (
          <option
            key={option.value || option.id}
            value={option.value || option.id}
          >
            {option.label || option.name}
          </option>
        ))}
      </select>
    </div>
  );
};

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
      name: PropTypes.string
    })
  ).isRequired,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  loading: PropTypes.bool,
  loadingText: PropTypes.string
};

SelectField.defaultProps = {
  disabled: false,
  required: false,
  loading: false,
  loadingText: 'Loading...'
};

/**
 * DateField - Date input field
 */
export const DateField = ({
  label,
  name,
  value,
  onChange,
  disabled,
  required
}) => {
  return (
    <div className="form-field">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="date"
        name={name}
        value={value}
        onChange={onChange}
        className="form-input"
        disabled={disabled}
        required={required}
      />
    </div>
  );
};

DateField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  required: PropTypes.bool
};

DateField.defaultProps = {
  disabled: false,
  required: false
};

/**
 * NumberField - Number input field
 */
export const NumberField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  disabled,
  required,
  min,
  step
}) => {
  return (
    <div className="form-field">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="number"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="form-input"
        disabled={disabled}
        required={required}
        min={min}
        step={step}
      />
    </div>
  );
};

NumberField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  min: PropTypes.number,
  step: PropTypes.number
};

NumberField.defaultProps = {
  placeholder: '',
  disabled: false,
  required: false,
  min: 0,
  step: 0.1
};

/**
 * CustomerSelector - Customer selection or creation
 */
export const CustomerSelector = ({
  customers,
  loadingCustomers,
  selectedCustomerId,
  onCustomerChange,
  showCreateForm,
  onToggleCreate,
  creatingCustomer,
  newCustomerData,
  onNewCustomerChange,
  onCreateCustomer,
  isEditMode
}) => {
  return (
    <div className="form-field">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Customer {!isEditMode && <span className="text-red-500">*</span>}
        </label>
        {!showCreateForm && (
          <button
            type="button"
            onClick={onToggleCreate}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus size={14} /> New Customer
          </button>
        )}
      </div>

      {!showCreateForm ? (
        <>
          <select
            value={selectedCustomerId}
            onChange={onCustomerChange}
            className="form-input"
            disabled={creatingCustomer || loadingCustomers}
            required={!isEditMode}
          >
            <option value="">
              {loadingCustomers ? 'Loading customers...' : 'Select a customer'}
            </option>
            {customers.map(customer => (
              <option key={customer.customer_id} value={customer.customer_id}>
                {customer.name} ({customer.customer_id})
              </option>
            ))}
          </select>
          {customers.length === 0 && !loadingCustomers && (
            <p className="text-xs text-yellow-600 mt-1">
              No customers found. Click "New Customer" to create one.
            </p>
          )}
        </>
      ) : (
        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <FormField
            label="Name"
            name="name"
            value={newCustomerData.name}
            onChange={onNewCustomerChange}
            placeholder="Customer name"
            disabled={creatingCustomer}
            required
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            value={newCustomerData.email}
            onChange={onNewCustomerChange}
            placeholder="customer@example.com"
            disabled={creatingCustomer}
            required
          />

          <FormField
            label="Phone"
            name="phone"
            type="tel"
            value={newCustomerData.phone}
            onChange={onNewCustomerChange}
            placeholder="+1 (555) 000-0000"
            disabled={creatingCustomer}
          />

          <FormField
            label="Company"
            name="company"
            value={newCustomerData.company}
            onChange={onNewCustomerChange}
            placeholder="Company name"
            disabled={creatingCustomer}
          />

          <div className="flex gap-2 pt-2 border-t border-blue-200">
            <button
              type="button"
              onClick={onToggleCreate}
              disabled={creatingCustomer}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onCreateCustomer}
              disabled={creatingCustomer}
              className="flex-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {creatingCustomer ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={12} /> Create Customer
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

CustomerSelector.propTypes = {
  customers: PropTypes.arrayOf(PropTypes.object).isRequired,
  loadingCustomers: PropTypes.bool,
  selectedCustomerId: PropTypes.string,
  onCustomerChange: PropTypes.func.isRequired,
  showCreateForm: PropTypes.bool,
  onToggleCreate: PropTypes.func.isRequired,
  creatingCustomer: PropTypes.bool,
  newCustomerData: PropTypes.object,
  onNewCustomerChange: PropTypes.func.isRequired,
  onCreateCustomer: PropTypes.func.isRequired,
  isEditMode: PropTypes.bool
};

CustomerSelector.defaultProps = {
  loadingCustomers: false,
  selectedCustomerId: '',
  showCreateForm: false,
  creatingCustomer: false,
  newCustomerData: {},
  isEditMode: false
};
