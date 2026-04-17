/**
 * Tasks & Updates Page
 * Manage project tasks and daily updates
 */

import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import HomeButton from '../components/HomeButton'
import { MobilePhotoUpload } from '../components/MobilePhotoUpload'
import { Plus, Edit2, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getTasks, createTask, updateTask, deleteTask, TASK_STATUSES, TASK_PRIORITIES, getProjectTasks } from '../lib/taskService'
import { getProjects } from '../lib/projectService'

export default function Updates() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    status: 'todo',
    priority: 'medium',
    dueDate: ''
  })
  const [editing, setEditing] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [tasksData, projectsData] = await Promise.all([
        getTasks(),
        getProjects()
      ])

      setTasks(tasksData)
      setProjects(projectsData)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrUpdate = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (editing) {
      const result = await updateTask(editing.id, formData)
      if (result.success) {
        setTasks(tasks.map(t => t.id === editing.id ? result.data : t))
        toast.success('Task updated')
      } else {
        toast.error('Failed to update task')
      }
    } else {
      const result = await createTask(formData)
      if (result.success) {
        setTasks([result.data, ...tasks])
        toast.success('Task created')
      } else {
        toast.error('Failed to create task')
      }
    }

    setShowForm(false)
    setEditing(null)
    setFormData({
      title: '',
      description: '',
      projectId: '',
      assignedTo: '',
      status: 'todo',
      priority: 'medium',
      dueDate: ''
    })
  }

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return

    const result = await deleteTask(taskId)
    if (result.success) {
      setTasks(tasks.filter(t => t.id !== taskId))
      toast.success('Task deleted')
    } else {
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

  const filteredTasks = selectedProject
    ? tasks.filter(t => t.project_id === selectedProject)
    : tasks

  const tasksByStatus = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    in_review: filteredTasks.filter(t => t.status === 'in_review'),
    completed: filteredTasks.filter(t => t.status === 'completed')
  }

  if (loading) {
    return (
      <Layout title="Tasks & Updates">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Tasks & Updates">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tasks & Updates</h1>
            <p className="text-gray-500">{filteredTasks.length} tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <HomeButton />
            <button
              onClick={() => { setShowForm(!showForm); setEditing(null) }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              New Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Task' : 'Create Task'}</h2>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
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
              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => { setShowForm(false); setEditing(null) }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrUpdate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editing ? 'Update' : 'Create'} Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kanban View */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold mb-4 text-sm uppercase text-gray-700">
                {status.replace(/_/g, ' ')} ({statusTasks.length})
              </h3>
              <div className="space-y-3">
                {statusTasks.map(task => (
                  <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <h4 className="font-medium text-sm">{task.title}</h4>
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

        {/* Photo Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mt-8">
          <MobilePhotoUpload projectId="daily-updates" taskId="daily-task" />
        </div>
      </div>
    </Layout>
  )
}
