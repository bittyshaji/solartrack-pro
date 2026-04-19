/**
 * Custom Hook: useProjectForm
 * Manages state and logic for project form
 */

import { useState, useEffect, useCallback } from 'react';
import { createProject, updateProject } from '@/lib/projectService';
import { getAllCustomers, createCustomer } from '@/lib/customerService';
import toast from 'react-hot-toast';

/**
 * useProjectForm hook
 * Manages project form state, customer management, and validation
 *
 * @param {Object} project - Existing project for edit mode
 * @returns {Object} Form state and handlers
 */
export const useProjectForm = (project = null) => {
  const isEditMode = !!project;

  // Project form state
  const [formData, setFormData] = useState({
    name: '',
    status: 'Planning',
    stage: 1,
    start_date: '',
    end_date: '',
    capacity_kw: '',
    customer_id: ''
  });

  // Customer management state
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // New customer form state
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    notes: ''
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  /**
   * Load customers from server
   */
  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
      toast.error('Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  /**
   * Initialize form on mount or when project changes
   */
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        status: project.status || 'Planning',
        stage: project.stage || 1,
        start_date: project.start_date
          ? project.start_date.split('T')[0]
          : '',
        end_date: project.end_date ? project.end_date.split('T')[0] : '',
        capacity_kw: project.capacity_kw || '',
        customer_id: project.customer_id_ref || ''
      });
    }
  }, [project]);

  /**
   * Validate form data
   */
  const validateForm = useCallback(() => {
    const errors = [];

    if (!formData.name.trim()) {
      errors.push('Project name is required');
    }

    if (!isEditMode && !formData.customer_id) {
      errors.push('Please select a customer');
    }

    return errors;
  }, [formData, isEditMode]);

  /**
   * Handle project form submission
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    setLoading(true);

    try {
      let result;

      if (isEditMode) {
        result = await updateProject(project.id, formData);
        if (result.success) {
          toast.success('Project updated successfully');
          return { success: true };
        } else {
          toast.error(result.error || 'Failed to update project');
          return { success: false };
        }
      } else {
        result = await createProject(formData);
        if (result.success) {
          toast.success('Project created successfully');
          return { success: true };
        } else {
          toast.error(result.error || 'Failed to create project');
          return { success: false };
        }
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error(error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [formData, isEditMode, project, validateForm]);

  /**
   * Handle form field changes
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === 'stage' || name === 'capacity_kw'
          ? name === 'stage'
            ? parseInt(value)
            : parseFloat(value)
          : value
    }));
  }, []);

  /**
   * Handle new customer form field changes
   */
  const handleNewCustomerChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewCustomerData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  /**
   * Create new customer
   */
  const handleCreateCustomer = useCallback(async () => {
    // Validation
    if (!newCustomerData.name.trim()) {
      toast.error('Customer name is required');
      return;
    }

    if (!newCustomerData.email.trim()) {
      toast.error('Customer email is required');
      return;
    }

    setCreatingCustomer(true);
    try {
      const result = await createCustomer(newCustomerData);
      if (result.success) {
        toast.success('Customer created successfully');
        // Set the new customer as selected
        setFormData(prev => ({
          ...prev,
          customer_id: result.customer.customer_id
        }));
        setShowCreateCustomer(false);
        // Reset new customer form
        setNewCustomerData({
          name: '',
          email: '',
          phone: '',
          company: '',
          address: '',
          city: '',
          state: '',
          postal_code: '',
          notes: ''
        });
        // Reload customers list
        await loadCustomers();
      } else {
        toast.error(result.error || 'Failed to create customer');
      }
    } catch (error) {
      toast.error('Error creating customer');
      console.error(error);
    } finally {
      setCreatingCustomer(false);
    }
  }, [newCustomerData, loadCustomers]);

  /**
   * Toggle create customer form
   */
  const toggleCreateCustomer = useCallback(() => {
    if (showCreateCustomer) {
      // Reset form when closing
      setNewCustomerData({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        notes: ''
      });
    }
    setShowCreateCustomer(!showCreateCustomer);
  }, [showCreateCustomer]);

  return {
    // Form state
    formData,
    setFormData,
    loading,
    isEditMode,

    // Customer state
    customers,
    loadingCustomers,
    loadCustomers,

    // New customer form state
    showCreateCustomer,
    newCustomerData,
    creatingCustomer,

    // Handlers
    handleChange,
    handleSubmit,
    handleNewCustomerChange,
    handleCreateCustomer,
    toggleCreateCustomer,
    validateForm
  };
};

export default useProjectForm;
