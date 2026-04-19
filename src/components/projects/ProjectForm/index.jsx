/**
 * ProjectForm Component
 * Modal for creating and editing projects
 * Refactored with custom hooks and reusable field components
 */

import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { X } from 'lucide-react';
import { PROJECT_STATUSES, PROJECT_STAGES } from '../../../lib/projectService';
import useProjectForm from '../../../hooks/useProjectForm';
import {
  FormField,
  DateField,
  NumberField,
  SelectField,
  CustomerSelector
} from './fields';
import './styles.css';

/**
 * ProjectForm
 * @component
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Callback to close the modal
 * @param {Function} onSuccess - Callback after successful form submission
 * @param {Object} project - Existing project for edit mode
 * @returns {JSX.Element}
 */
export default function ProjectForm({ isOpen, onClose, onSuccess, project = null }) {
  const {
    formData,
    loading,
    isEditMode,
    customers,
    loadingCustomers,
    loadCustomers,
    showCreateCustomer,
    newCustomerData,
    creatingCustomer,
    handleChange,
    handleSubmit,
    handleNewCustomerChange,
    handleCreateCustomer,
    toggleCreateCustomer
  } = useProjectForm(project);

  // Load customers when form opens
  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen, loadCustomers]);

  if (!isOpen) return null;

  /**
   * Handle form submission
   */
  const onFormSubmit = async (e) => {
    const result = await handleSubmit(e);
    if (result?.success) {
      onSuccess?.();
      onClose();
    }
  };

  /**
   * Convert statuses to select options
   */
  const statusOptions = PROJECT_STATUSES.map(status => ({
    value: status,
    label: status
  }));

  /**
   * Convert stages to select options
   */
  const stageOptions = PROJECT_STAGES.map(stage => ({
    id: stage.id,
    label: `${stage.id}. ${stage.name}`
  }));

  return (
    <div className="project-form-modal">
      <div className="project-form-container">
        {/* Header */}
        <div className="form-header">
          <h2>
            {isEditMode ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onFormSubmit} className="project-form">
          {/* Project Name */}
          <FormField
            label="Project Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Residential Solar Installation"
            disabled={loading}
            required
          />

          {/* Customer Selection / Creation */}
          <CustomerSelector
            customers={customers}
            loadingCustomers={loadingCustomers}
            selectedCustomerId={formData.customer_id}
            onCustomerChange={handleChange}
            showCreateForm={showCreateCustomer}
            onToggleCreate={toggleCreateCustomer}
            creatingCustomer={creatingCustomer}
            newCustomerData={newCustomerData}
            onNewCustomerChange={handleNewCustomerChange}
            onCreateCustomer={handleCreateCustomer}
            isEditMode={isEditMode}
          />

          {/* Status */}
          <SelectField
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions}
            disabled={loading}
          />

          {/* Stage */}
          <SelectField
            label="Stage"
            name="stage"
            value={formData.stage}
            onChange={handleChange}
            options={stageOptions}
            disabled={loading}
          />

          {/* Capacity */}
          <NumberField
            label="Capacity (kW)"
            name="capacity_kw"
            value={formData.capacity_kw}
            onChange={handleChange}
            placeholder="e.g., 5.5"
            disabled={loading}
            min={0}
            step={0.1}
          />

          {/* Start Date */}
          <DateField
            label="Start Date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            disabled={loading}
          />

          {/* End Date */}
          <DateField
            label="Expected End Date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            disabled={loading}
          />

          {/* Buttons */}
          <div className="form-buttons">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="form-button form-button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="form-button form-button-primary"
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  Saving...
                </>
              ) : (
                isEditMode ? 'Update Project' : 'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ProjectForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  project: PropTypes.object
};

ProjectForm.defaultProps = {
  onSuccess: null,
  project: null
};
