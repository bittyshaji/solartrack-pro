/**
 * Project Form Component
 * Modal for creating and editing projects
 * Now includes customer selection (linked to pre-created customers)
 */

import { useState, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { createProject, updateProject, PROJECT_STATUSES, PROJECT_STAGES } from '../../lib/projectService'
import { getAllCustomers, createCustomer } from '../../lib/customerService'
import toast from 'react-hot-toast'

export default function ProjectForm({ isOpen, onClose, onSuccess, project = null }) {
  const [formData, setFormData] = useState({
    name: '',
    status: 'Planning',
    stage: 1,
    start_date: '',
    end_date: '',
    capacity_kw: '',
    customer_id: ''
  })

  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [showCreateCustomer, setShowCreateCustomer] = useState(false)
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
  })
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const isEditMode = !!project

  // Load customers when form opens, and populate form when editing
  useEffect(() => {
    if (isOpen) {
      loadCustomers()
    }

    if (project) {
      setFormData({
        name: project.name || '',
        status: project.status || 'Planning',
        stage: project.stage || 1,
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        end_date: project.end_date ? project.end_date.split('T')[0] : '',
        capacity_kw: project.capacity_kw || '',
        customer_id: project.customer_id_ref || ''
      })
    }
  }, [project, isOpen])

  const loadCustomers = async () => {
    setLoadingCustomers(true)
    try {
      const data = await getAllCustomers()
      setCustomers(data)
    } catch (err) {
      console.error('Error loading customers:', err)
      toast.error('Failed to load customers')
    } finally {
      setLoadingCustomers(false)
    }
  }

  const handleCreateCustomer = async () => {
    // Validation
    if (!newCustomerData.name.trim()) {
      toast.error('Customer name is required')
      return
    }

    if (!newCustomerData.email.trim()) {
      toast.error('Customer email is required')
      return
    }

    setCreatingCustomer(true)
    try {
      const result = await createCustomer(newCustomerData)
      if (result.success) {
        toast.success('Customer created successfully')
        // Set the new customer as selected and close the create form
        setFormData(prev => ({
          ...prev,
          customer_id: result.customer.customer_id
        }))
        setShowCreateCustomer(false)
        // Reload customers list
        await loadCustomers()
      } else {
        toast.error(result.error || 'Failed to create customer')
      }
    } catch (error) {
      toast.error('Error creating customer')
      console.error(error)
    } finally {
      setCreatingCustomer(false)
    }
  }

  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target
    setNewCustomerData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stage' || name === 'capacity_kw' ?
        (name === 'stage' ? parseInt(value) : parseFloat(value)) :
        value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast.error('Project name is required')
      return
    }

    if (!isEditMode && !formData.customer_id) {
      toast.error('Please select a customer')
      return
    }

    setLoading(true)

    try {
      let result

      if (isEditMode) {
        result = await updateProject(project.id, formData)
        if (result.success) {
          toast.success('Project updated successfully')
          onSuccess?.()
          onClose()
        } else {
          toast.error(result.error || 'Failed to update project')
        }
      } else {
        result = await createProject(formData)
        if (result.success) {
          toast.success('Project created successfully')
          onSuccess?.()
          onClose()
        } else {
          toast.error(result.error || 'Failed to create project')
        }
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">
            {isEditMode ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Residential Solar Installation"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
          </div>

          {/* Customer Selection / Creation */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Customer *
              </label>
              {!showCreateCustomer && (
                <button
                  type="button"
                  onClick={() => setShowCreateCustomer(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus size={14} /> New Customer
                </button>
              )}
            </div>

            {!showCreateCustomer ? (
              <>
                <select
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading || loadingCustomers}
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
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newCustomerData.name}
                    onChange={handleNewCustomerChange}
                    placeholder="Customer name"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={creatingCustomer}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newCustomerData.email}
                    onChange={handleNewCustomerChange}
                    placeholder="customer@example.com"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={creatingCustomer}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={newCustomerData.phone}
                    onChange={handleNewCustomerChange}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={creatingCustomer}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={newCustomerData.company}
                    onChange={handleNewCustomerChange}
                    placeholder="Company name"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={creatingCustomer}
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-blue-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateCustomer(false)
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
                      })
                    }}
                    disabled={creatingCustomer}
                    className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCustomer}
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

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {PROJECT_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Stage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage
            </label>
            <select
              name="stage"
              value={formData.stage}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              {PROJECT_STAGES.map(stage => (
                <option key={stage.id} value={stage.id}>
                  {stage.id}. {stage.name}
                </option>
              ))}
            </select>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity (kW)
            </label>
            <input
              type="number"
              name="capacity_kw"
              value={formData.capacity_kw}
              onChange={handleChange}
              placeholder="e.g., 5.5"
              step="0.1"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected End Date
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
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
  )
}
