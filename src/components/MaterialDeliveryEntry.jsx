/**
 * Material Delivery Entry Component
 * Allows users to add/edit/delete materials in a project
 * Available across all project states (EST, NEG, EXE)
 */

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { addMaterial, updateMaterial, deleteMaterial, getMaterialsByProject } from '../lib/materialService'

export default function MaterialDeliveryEntry({ projectId }) {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    unit_cost: 0,
    category: 'General'
  })

  useEffect(() => {
    fetchMaterials()
  }, [projectId])

  const fetchMaterials = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMaterialsByProject(projectId)
      setMaterials(data || [])
    } catch (err) {
      console.error('Error fetching materials:', err)
      setError(err.message || 'Failed to load materials')
      toast.error('Failed to load materials')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      quantity: 1,
      unit_cost: 0,
      category: 'General'
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Material name is required')
      return
    }

    setSaving(true)
    try {
      let result
      if (editingId) {
        result = await updateMaterial(editingId, formData)
      } else {
        result = await addMaterial(projectId, formData)
      }

      if (result.success) {
        toast.success(result.message)
        await fetchMaterials()
        resetForm()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Operation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (material) => {
    setFormData({
      name: material.name,
      quantity: material.quantity,
      unit_cost: material.unit_cost,
      category: material.category || 'General'
    })
    setEditingId(material.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return

    try {
      const result = await deleteMaterial(id)
      if (result.success) {
        toast.success('Material deleted')
        await fetchMaterials()
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Failed to delete material')
    }
  }

  const calculateTotal = () => {
    return materials.reduce((sum, m) => sum + (m.quantity * m.unit_cost), 0)
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <p className="text-red-700 font-medium">Error loading materials</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">📦 Material Delivery</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Material
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6 border-2 border-blue-200">
          <h4 className="font-semibold mb-4 text-sm">
            {editingId ? 'Edit Material' : 'Add New Material'}
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Solar Panel 400W"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>General</option>
                  <option>Panels</option>
                  <option>Inverter</option>
                  <option>Mounting</option>
                  <option>Wiring</option>
                  <option>Labor</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost (₹)
                </label>
                <input
                  type="number"
                  value={formData.unit_cost}
                  onChange={(e) => setFormData({ ...formData, unit_cost: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-200">
              <button
                onClick={resetForm}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Save size={16} />
                {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Materials List */}
      {materials.length > 0 ? (
        <div className="space-y-2">
          {materials.map((material) => (
            <div
              key={material.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{material.name}</p>
                    <p className="text-sm text-gray-500">
                      {material.category} • {material.quantity} × ₹{material.unit_cost.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-3">
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    ₹{(material.quantity * material.unit_cost).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {material.quantity} items
                  </p>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(material)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(material.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Total Summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total Material Cost</span>
              <span className="text-xl font-bold text-blue-600">
                ₹{calculateTotal().toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {materials.length} item{materials.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No materials added yet</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Add first material →
            </button>
          )}
        </div>
      )}
    </div>
  )
}
