/**
 * Customers Management Page
 * Comprehensive customer management with projects view
 * Searchable, sortable, with inline creation
 */

import React, { useState, useEffect } from 'react'
import { Search, Plus, Trash2, Edit2, Eye, ChevronDown, RefreshCw, AlertCircle } from 'lucide-react'
import { getCustomerProjectSummary, createCustomer, updateCustomer, deactivateCustomer } from '../lib/customerService'
import { CustomerCreationModal } from '../components/customers/CustomerCreationModal'
import toast from 'react-hot-toast'

export function CustomersManagement() {
  // State management
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name') // 'name', 'projects', 'created'
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedCustomer, setExpandedCustomer] = useState(null)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editFormData, setEditFormData] = useState({})

  // Load customers on mount
  useEffect(() => {
    loadCustomers()
  }, [])

  // Filter and sort when data or filters change
  useEffect(() => {
    filterAndSort()
  }, [customers, searchTerm, sortBy])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const data = await getCustomerProjectSummary()
      setCustomers(data)
      toast.success(`Loaded ${data.length} customers`)
    } catch (err) {
      console.error('Error loading customers:', err)
      toast.error('Failed to load customers')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  const filterAndSort = () => {
    let filtered = [...customers]

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term) ||
        c.customer_id?.toLowerCase().includes(term)
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'projects':
          return (b.total_projects || 0) - (a.total_projects || 0)
        case 'created':
          return new Date(b.created_at) - new Date(a.created_at)
        default:
          return 0
      }
    })

    setFilteredCustomers(filtered)
  }

  const handleCreateCustomer = async (customer) => {
    setCustomers(prev => [...prev, customer])
    setShowCreateModal(false)
  }

  const handleEditCustomer = async (customerId) => {
    try {
      const customer = customers.find(c => c.customer_id === customerId)
      if (!customer) return

      const result = await updateCustomer(customerId, editFormData)
      if (result.success) {
        // Update local state
        setCustomers(prev =>
          prev.map(c => c.customer_id === customerId ? { ...c, ...editFormData } : c)
        )
        setEditingCustomer(null)
        setEditFormData({})
        toast.success('Customer updated successfully')
      } else {
        toast.error(result.error || 'Failed to update customer')
      }
    } catch (err) {
      console.error('Error updating customer:', err)
      toast.error('Error updating customer')
    }
  }

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure? Projects will remain but customer will be deactivated.')) {
      return
    }

    try {
      const result = await deactivateCustomer(customerId)
      if (result.success) {
        setCustomers(prev => prev.filter(c => c.customer_id !== customerId))
        toast.success('Customer deactivated')
      } else {
        toast.error(result.error || 'Failed to deactivate customer')
      }
    } catch (err) {
      console.error('Error deleting customer:', err)
      toast.error('Error deleting customer')
    }
  }

  const getProjectStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800'
      case 'In Progress':
        return 'bg-blue-100 text-blue-800'
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'Cancelled':
        return 'bg-red-100 text-red-800'
      case 'Planning':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Render states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600 mt-1">Manage all customers and their projects</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <Plus size={20} />
              New Customer
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, phone, or customer ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="projects">Sort by Projects</option>
              <option value="created">Sort by Created</option>
            </select>

            {/* Refresh */}
            <button
              onClick={loadCustomers}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <RefreshCw size={20} />
              Refresh
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-gray-600 text-sm font-medium">Total Customers</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{customers.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-gray-600 text-sm font-medium">Total Projects</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {customers.reduce((sum, c) => sum + (c.total_projects || 0), 0)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-gray-600 text-sm font-medium">Active Projects</div>
            <div className="text-3xl font-bold text-orange-600 mt-2">
              {customers.reduce((sum, c) => sum + (c.active_projects || 0), 0)}
            </div>
          </div>
        </div>

        {/* Customers List */}
        {filteredCustomers.length > 0 ? (
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div key={customer.customer_id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Customer Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setExpandedCustomer(expandedCustomer === customer.customer_id ? null : customer.customer_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            customer.active_projects > 0 ? 'bg-blue-600' : 'bg-gray-400'
                          }`}
                        >
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{customer.name}</h3>
                          <p className="text-sm text-gray-600">{customer.customer_id}</p>
                        </div>
                      </div>
                    </div>

                    {/* Customer Stats */}
                    <div className="flex items-center gap-6 mr-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{customer.total_projects || 0}</div>
                        <div className="text-xs text-gray-600">Projects</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">{customer.active_projects || 0}</div>
                        <div className="text-xs text-gray-600">Active</div>
                      </div>
                    </div>

                    {/* Expand Icon */}
                    <ChevronDown
                      size={24}
                      className={`text-gray-400 transition ${
                        expandedCustomer === customer.customer_id ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Customer Details - Expanded */}
                {expandedCustomer === customer.customer_id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    {/* Contact Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        {editingCustomer === customer.customer_id ? (
                          <input
                            type="email"
                            value={editFormData.email || customer.email || ''}
                            onChange={(e) =>
                              setEditFormData(prev => ({ ...prev, email: e.target.value }))
                            }
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900 mt-1">{customer.email || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Phone</label>
                        {editingCustomer === customer.customer_id ? (
                          <input
                            type="tel"
                            value={editFormData.phone || customer.phone || ''}
                            onChange={(e) =>
                              setEditFormData(prev => ({ ...prev, phone: e.target.value }))
                            }
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900 mt-1">{customer.phone || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Company</label>
                        {editingCustomer === customer.customer_id ? (
                          <input
                            type="text"
                            value={editFormData.company || customer.company || ''}
                            onChange={(e) =>
                              setEditFormData(prev => ({ ...prev, company: e.target.value }))
                            }
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900 mt-1">{customer.company || 'Not provided'}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">City</label>
                        {editingCustomer === customer.customer_id ? (
                          <input
                            type="text"
                            value={editFormData.city || customer.city || ''}
                            onChange={(e) =>
                              setEditFormData(prev => ({ ...prev, city: e.target.value }))
                            }
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <p className="text-gray-900 mt-1">{customer.city || 'Not provided'}</p>
                        )}
                      </div>
                    </div>

                    {/* Projects Summary */}
                    {customer.total_projects > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Projects Breakdown</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="text-2xl font-bold text-green-600">
                              {customer.completed_projects || 0}
                            </div>
                            <div className="text-xs text-gray-600">Completed</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="text-2xl font-bold text-blue-600">
                              {customer.active_projects || 0}
                            </div>
                            <div className="text-xs text-gray-600">Active</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="text-2xl font-bold text-yellow-600">
                              {customer.on_hold_projects || 0}
                            </div>
                            <div className="text-xs text-gray-600">On Hold</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="text-2xl font-bold text-red-600">
                              {customer.cancelled_projects || 0}
                            </div>
                            <div className="text-xs text-gray-600">Cancelled</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-6 border-t border-gray-200">
                      {editingCustomer === customer.customer_id ? (
                        <>
                          <button
                            onClick={() => handleEditCustomer(customer.customer_id)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditingCustomer(null)
                              setEditFormData({})
                            }}
                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingCustomer(customer.customer_id)
                              setEditFormData({
                                name: customer.name,
                                email: customer.email,
                                phone: customer.phone,
                                company: customer.company,
                                city: customer.city
                              })
                            }}
                            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                          >
                            <Edit2 size={16} />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(customer.customer_id)}
                            className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
                          >
                            <Trash2 size={16} />
                            Deactivate
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Customers Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'No customers match your search. Try a different search term.' : 'Create your first customer to get started!'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <Plus size={20} />
                Create First Customer
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Customer Modal */}
      <CustomerCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCustomerCreated={handleCreateCustomer}
      />
    </div>
  )
}

export default CustomersManagement
