/**
 * Project Updates Component
 * Project-specific daily updates and task management
 * Integrated into ProjectDetail page
 */

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProjectTasks, createTask, updateTask, deleteTask, TASK_STATUSES, TASK_PRIORITIES } from '../lib/taskService'
import { MobilePhotoUpload } from './MobilePhotoUpload'

export default function ProjectUpdates({ projectId, projectName }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projectId,
    assignedTo: '',
    status: 'todo',
    priority: 'medium',
    dueDate: ''
  })
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchProjectTasks()
  }, [projectId])

  const fetchProjectTasks = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getProjectTasks(projectId)
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setError(error.message || 'Failed to load tasks')
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    setSaving(true)
    try {
      let result
      if (editing) {
        result = await updateTask(editing.id, formData)
        if (result.success) {
          setTasks(tasks.map(t => t.id === editing.id ? result.data : t))
          toast.success('Task updated')
        }
      } else {
        result = await createTask(formData)
        if (result.success) {
          setTasks([result.data, ...tasks])
          toast.success('Task created')
        }
      }

      if (!result.success) {
        toast.error(result.error || 'Operation failed')
      } else {
        resetForm()
      }
    } catch (error) {
      toast.error('Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return

    try {
      const result = await deleteTask(taskId)
      if (result.success) {
        setTasks(tasks.filter(t => t.id !== taskId))
        toast.success('Task deleted')
      } else {
        toast.error('Failed to delete task')
      }
    } catch (error) {
      toast.error('Failed to delete task')
    }
  }

  const handleEdit = (task) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      projectId: task.project_id,
      assignedTo: task.assigned_to || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date ? task.due_date.split('T')[0] : ''
    })
    setEditing(task)
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      projectId: projectId,
      assignedTo: '',
      status: 'todo',
      priority: 'medium',
      dueDate: ''
    })
    setEditing(null)
    setShowForm(false)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-600" size={20} />
      case 'in_progress': return <Clock className="text-blue-600" size={20} />
      default: return <AlertCircle className="text-gray-400" size={20} />
    }
  }

  const tasksByStatus = {
    todo: Array.isArray(tasks) ? tasks.filter(t => t.status === 'todo') : [],
    in_progress: Array.isArray(tasks) ? tasks.filter(t => t.status === 'in_progress') : [],
    in_review: Array.isArray(tasks) ? tasks.filter(t => t.status === 'in_review') : [],
    completed: Array.isArray(tasks) ? tasks.filter(t => t.status === 'completed') : []
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg p-6 border border-red-200">
        <p className="text-red-700 font-medium">Error loading tasks</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">📋 Daily Updates & Tasks</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            New Task
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-bold mb-4">{editing ? 'Edit Task' : 'Create Task for ' + projectName}</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task description"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {TASK_PRIORITIES.map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {TASK_STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={resetForm}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrUpdate}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : editing ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kanban View */}
      {tasks.length > 0 ? (
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <h5 className="font-bold mb-4 text-sm uppercase text-gray-700">
                {status.replace(/_/g, ' ')} ({statusTasks.length})
              </h5>
              <div className="space-y-3">
                {statusTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <h6 className="font-medium text-sm">{task.title}</h6>
                      </div>
                    </div>
                    <span className={`inline-block text-xs px-2 py-1 rounded-full mb-2 ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <p className="text-xs text-gray-500 mb-3">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(task)}
                        className="flex-1 text-blue-600 hover:text-blue-800 text-xs font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="flex-1 text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No tasks yet for this project</p>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Create first task →
            </button>
          )}
        </div>
      )}

      {/* Photo Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <MobilePhotoUpload projectId={projectId} taskId={`project-${projectId}`} />
      </div>
    </div>
  )
}
