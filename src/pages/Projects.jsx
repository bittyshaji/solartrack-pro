/**
 * Projects Page
 * Project Management Interface
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import HomeButton from '../components/HomeButton'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

// Export for ProjectDetail.jsx
export const PROJECT_STAGES = [
  { id: 1, label: 'Site Survey Done', color: 'bg-slate-100 text-slate-600' },
  { id: 2, label: 'KSEB Application Submitted', color: 'bg-violet-100 text-violet-700' },
  { id: 3, label: 'Structure / Mounting Work', color: 'bg-amber-100 text-amber-700' },
  { id: 4, label: 'Panel Installation', color: 'bg-orange-100 text-orange-700' },
  { id: 5, label: 'Wiring & Inverter Setup', color: 'bg-blue-100 text-blue-700' },
  { id: 6, label: 'Earthing & Safety Check', color: 'bg-red-100 text-red-700' },
  { id: 7, label: 'KSEB Inspection Scheduled', color: 'bg-indigo-100 text-indigo-700' },
  { id: 8, label: 'Net Meter Installation', color: 'bg-cyan-100 text-cyan-700' },
  { id: 9, label: 'System Commissioning', color: 'bg-teal-100 text-teal-700' },
  { id: 10, label: 'Project Handover & Completed', color: 'bg-green-100 text-green-700' },
]

const STATUS_COLORS = {
  'In Progress': 'bg-blue-100 text-blue-700',
  'On Hold': 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-green-100 text-green-700',
  Planning: 'bg-purple-100 text-purple-800',
  Cancelled: 'bg-red-100 text-red-800',
}

const STATUSES = ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled']

export default function Projects() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(null)

  const canEdit = profile?.role === 'admin' || profile?.role === 'manager'

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const filtered = projects.filter(p => {
    const matchesSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.project_code?.toLowerCase().includes(search.toLowerCase())

    const matchesStatus = !selectedStatus || p.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const getStatusCount = (status) => {
    return projects.filter(p => p.status === status).length
  }

  const getStageName = (stageId) => {
    const stage = PROJECT_STAGES.find(s => s.id === parseInt(stageId))
    return stage ? stage.label : `Stage ${stageId}`
  }

  return (
    <Layout title="Projects">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-500 text-sm mt-1">{projects.length} total projects</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/projects/create')}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
            >
              <Plus size={20} />
              New Project
            </button>
            <HomeButton />
          </div>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus(null)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedStatus === null
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({projects.length})
            </button>

            {STATUSES.map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedStatus === status
                    ? `${STATUS_COLORS[status]} ring-2 ring-offset-2 ring-orange-500`
                    : `${STATUS_COLORS[status]} hover:opacity-80`
                }`}
              >
                {status} ({getStatusCount(status)})
              </button>
            ))}
          </div>
        </div>

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No projects found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(project => (
              <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{project.name}</h3>
                    {project.project_code && (
                      <p className="text-sm text-gray-500">{project.project_code}</p>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                {project.status && (
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[project.status] || 'bg-gray-100'} mb-4`}>
                    {project.status}
                  </span>
                )}

                {/* Details */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {project.stage && (
                    <div><span className="font-medium">Stage:</span> {getStageName(project.stage)}</div>
                  )}
                  {project.capacity_kw && (
                    <div><span className="font-medium">Capacity:</span> {project.capacity_kw} kW</div>
                  )}
                </div>

                {/* Actions */}
                {canEdit && (
                  <div className="flex gap-2 pt-4 border-t">
                    <button
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border border-orange-500 text-orange-500 rounded hover:bg-orange-50 transition"
                    >
                      <Edit2 size={16} />
                      View
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
