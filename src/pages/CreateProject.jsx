/**
 * Create Project Page
 * Standalone page for creating new projects
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { ArrowLeft } from 'lucide-react'
import { createProject } from '../lib/projectService'
import { getAllCustomers } from '../lib/customerService'
import toast from 'react-hot-toast'

export default function CreateProject() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    client_name: '',
    location: '',
    status: 'Planning',
    stage: 1,
    start_date: '',
    end_date: '',
    capacity_kw: '',
    notes: '',
    customer_id: ''
  })
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState([])
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

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

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['stage', 'capacity_kw'].includes(name)
        ? name === 'stage' ? parseInt(value) : parseFloat(value)
        : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Project name is required')
      return
    }

    if (!formData.customer_id) {
      toast.error('Please select a customer')
      return
    }

    setLoading(true)
    try {
      const result = await createProject(formData)
      if (result.success) {
        toast.success('Project created successfully!')
        navigate(`/projects/${result.data.id}`)
      } else {
        toast.error(result.error || 'Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Error creating project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="Create New Project">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Projects
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
          <p className="text-gray-500 mt-2">Start a new solar installation project</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Solar Installation - Mumbai"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
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
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ No customers found. Please create a customer first using the Customer Management section.
                </p>
              )}
            </div>

            {/* Client Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name
              </label>
              <input
                type="text"
                name="client_name"
                value={formData.client_name}
                onChange={handleChange}
                placeholder="e.g., John Doe"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., 123 Main Street, Mumbai"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity (kW)
              </label>
              <input
                type="number"
                step="0.1"
                name="capacity_kw"
                value={formData.capacity_kw}
                onChange={handleChange}
                placeholder="e.g., 5.5"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>Planning</option>
                <option>In Progress</option>
                <option>On Hold</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional project notes..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}
