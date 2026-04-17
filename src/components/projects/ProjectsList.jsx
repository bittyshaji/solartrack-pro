/**
 * Projects List Component
 * Displays projects in card and table format with filtering
 */

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { getProjects, deleteProject, PROJECT_STATUSES, PROJECT_STAGES } from '../../lib/projectService'
import toast from 'react-hot-toast'
import ProjectForm from './ProjectForm'

export default function ProjectsList({ userRole = 'user' }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [viewMode, setViewMode] = useState('cards') // 'cards' or 'table'

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    stage: '',
    searchTerm: ''
  })

  const isAdmin = userRole === 'admin'

  // Fetch projects on mount and when filters change
  useEffect(() => {
    loadProjects()
  }, [filters])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const data = await getProjects(filters)
      setProjects(data)
    } catch (error) {
      toast.error('Failed to load projects')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClick = () => {
    setSelectedProject(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (project) => {
    setSelectedProject(project)
    setIsFormOpen(true)
  }

  const handleDeleteClick = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return

    try {
      const result = await deleteProject(projectId)
      if (result.success) {
        toast.success('Project deleted successfully')
        loadProjects()
      } else {
        toast.error(result.error || 'Failed to delete project')
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error(error)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setSelectedProject(null)
  }

  const handleFormSuccess = () => {
    loadProjects()
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      searchTerm: e.target.value
    }))
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'active':
      case 'in progress':
        return 'bg-blue-100 text-blue-800'
      case 'on hold':
        return 'bg-yellow-100 text-yellow-800'
      case 'planning':
        return 'bg-purple-100 text-purple-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStageName = (stageId) => {
    const stage = PROJECT_STAGES.find(s => s.id === parseInt(stageId))
    return stage ? stage.name : `Stage ${stageId}`
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
        {isAdmin && (
          <button
            onClick={handleCreateClick}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            New Project
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search projects..."
            value={filters.searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {PROJECT_STATUSES.map(status => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stage
            </label>
            <select
              name="stage"
              value={filters.stage}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Stages</option>
              {PROJECT_STAGES.map(stage => (
                <option key={stage.id} value={stage.id}>
                  {stage.id}. {stage.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              View
            </label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cards">Card View</option>
              <option value="table">Table View</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg">
          <p className="text-gray-500 text-lg">No projects found</p>
          {isAdmin && (
            <button
              onClick={handleCreateClick}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              Create First Project
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <div key={project.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {project.name}
                  </h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Stage:</span> {getStageName(project.stage)}
                </div>
                {project.capacity_kw > 0 && (
                  <div>
                    <span className="font-medium">Capacity:</span> {project.capacity_kw} kW
                  </div>
                )}
                {project.start_date && (
                  <div>
                    <span className="font-medium">Start:</span> {new Date(project.start_date).toLocaleDateString()}
                  </div>
                )}
                {project.end_date && (
                  <div>
                    <span className="font-medium">End:</span> {new Date(project.end_date).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Actions */}
              {isAdmin && (
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => handleEditClick(project)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(project.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // Table View
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stage</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Capacity</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Start Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">End Date</th>
                  {isAdmin && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y">
                {projects.map(project => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {project.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getStageName(project.stage)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {project.capacity_kw ? `${project.capacity_kw} kW` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {project.start_date ? new Date(project.start_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {project.end_date ? new Date(project.end_date).toLocaleDateString() : '—'}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button
                          onClick={() => handleEditClick(project)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(project.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Form Modal */}
      <ProjectForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        project={selectedProject}
      />
    </div>
  )
}
