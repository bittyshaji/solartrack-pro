/**
 * Customer Management Component
 * Manage customers (create, edit, view, search)
 * Customers are created separately before linking to projects
 */

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createCustomer, getAllCustomers, updateCustomer, deactivateCustomer, searchCustomers } from '../lib/customerService'

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    company: '',
    notes: ''
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    if (searchTerm.trim()) {
      filterCustomers()
    } else {
      setFilteredCustomers(customers)
    }
  }, [searchTerm, customers])

  const loadCustomers = async () => {
    setLoading(true)
    try {
      const data = await getAllCustomers()
      setCustomers(data)
      setFilteredCustomers(data)
    } catch (err) {
      console.error('Error loading customers:', err)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const filterCustomers = async () => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers)
      return
    }
    const results = await searchCustomers(searchTerm)
    setFilteredCustomers(results)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postal_code: '',
      company: '',
      notes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Customer name is required')
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        // Update existing customer
        const result = await updateCustomer(editingId, formData)
        if (result.success) {
          toast.success('Customer updated successfully')
          await loadCustomers()
          resetForm()
        } else {
          throw new Error(result.error)
        }
      } else {
        // Create new customer
        const result = await createCustomer(formData)
        if (result.success) {
          toast.success(`✅ Customer created: ${result.customerId}`)
          await loadCustomers()
          resetForm()
        } else {
          throw new Error(result.error)
        }
      }
    } catch (err) {
      console.error('Error saving customer:', err)
      toast.error('Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (customer) => {
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      postal_code: customer.postal_code || '',
      company: customer.company || '',
      notes: customer.notes || ''
    })
    setEditingId(customer.customer_id)
    setShowForm(true)
  }

  const handleDelete = async (customerId) => {
    if (!confirm('Are you sure you want to deactivate this customer?')) return

    setSaving(true)
    try {
      const result = await deactivateCustomer(customerId)
      if (result.success) {
        toast.success('Customer deactivated')
        await loadCustomers()
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error deleting customer:', err)
      toast.error('Failed to deactivate customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">👥 Customer Management</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Add Customer
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">{editingId ? 'Edit' : 'Add New'} Customer</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Customer name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="123456"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                <Check size={18} />
                {editingId ? 'Update' : 'Create'} Customer
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      {!showForm && (
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Customer List */}
      {!showForm && (
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-4">No customers found</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} />
                Create First Customer
              </button>
            </div>
          ) : (
            filteredCustomers.map(customer => (
              <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{customer.name}</p>
                  <p className="text-sm text-gray-500">{customer.customer_id}</p>
                  <div className="text-xs text-gray-600 mt-1">
                    {customer.email && <span className="mr-3">📧 {customer.email}</span>}
                    {customer.phone && <span>📱 {customer.phone}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(customer)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.customer_id)}
                    disabled={saving}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stats */}
      {!showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            📊 Total Customers: <strong>{customers.length}</strong>
          </p>
        </div>
      )}
    </div>
  )
}
