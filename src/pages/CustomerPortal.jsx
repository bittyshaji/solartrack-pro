import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  Sun,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  Zap,
  Calendar,
  ClipboardList,
  Package,
  Phone,
  Mail,
  MessageSquare,
} from 'lucide-react'

const STATUS_ICONS = {
  Completed: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  'In Progress': <Clock className="w-5 h-5 text-blue-500" />,
  Planning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
  'On Hold': <AlertCircle className="w-5 h-5 text-gray-400" />,
}

const TIMELINE_STEPS = [
  { key: 'site_survey', label: 'Site Survey', icon: MapPin },
  { key: 'design_approval', label: 'Design & Approval', icon: ClipboardList },
  { key: 'equipment_delivery', label: 'Equipment Delivery', icon: Package },
  { key: 'installation', label: 'Installation', icon: Zap },
  { key: 'inspection', label: 'Inspection', icon: CheckCircle2 },
  { key: 'commissioning', label: 'Commissioning & Go-Live', icon: Sun },
]

export default function CustomerPortal() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: projectsData }, { data: updatesData }] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('daily_updates').select('*').order('date', { ascending: false }).limit(10),
    ])
    const proj = projectsData || []
    setProjects(proj)
    setUpdates(updatesData || [])
    if (proj.length > 0 && !selectedProject) setSelectedProject(proj[0])
    setLoading(false)
  }

  const projectUpdates = selectedProject
    ? updates.filter((u) => u.project_id === selectedProject?.id)
    : []

  // Derive timeline step completion from project status
  const getCompletedSteps = (status) => {
    const map = {
      Planning: 1,
      'In Progress': 3,
      Completed: TIMELINE_STEPS.length,
      'On Hold': 2,
      Cancelled: 0,
    }
    return map[status] || 0
  }

  const completedSteps = selectedProject ? getCompletedSteps(selectedProject.status) : 0

  return (
    <Layout title="Customer Portal">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
          <p className="text-gray-500 text-sm mt-1">View your solar project status and updates</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading your projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <Sun className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No projects assigned yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Contact your solar installation team to get started.
            </p>
            <div className="mt-8 p-5 bg-orange-50 rounded-xl border border-orange-100 max-w-sm mx-auto text-left">
              <p className="text-sm font-semibold text-orange-800 mb-3">Need help? Reach out to us:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <Phone className="w-4 h-4" /> +1 (555) 123-4567
                </div>
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <Mail className="w-4 h-4" /> support@solartrackpro.com
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Selector (left) */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Your Projects</h3>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    selectedProject?.id === p.id
                      ? 'border-orange-400 bg-orange-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {STATUS_ICONS[p.status] || <Clock className="w-5 h-5 text-gray-400" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{p.name}</p>
                      {p.location && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {p.location}
                        </p>
                      )}
                      <span
                        className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                          {
                            Planning: 'bg-yellow-100 text-yellow-800',
                            'In Progress': 'bg-blue-100 text-blue-800',
                            Completed: 'bg-green-100 text-green-800',
                            'On Hold': 'bg-gray-100 text-gray-600',
                            Cancelled: 'bg-red-100 text-red-700',
                          }[p.status] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}

              {/* Support Card */}
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  <p className="text-sm font-semibold text-gray-700">Need Help?</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="w-3.5 h-3.5" /> +1 (555) 123-4567
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="w-3.5 h-3.5" /> support@solartrackpro.com
                  </div>
                </div>
              </div>
            </div>

            {/* Project Detail (right) */}
            {selectedProject && (
              <div className="lg:col-span-2 space-y-5">
                {/* Project Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">{selectedProject.name}</h2>
                  {selectedProject.client_name && (
                    <p className="text-sm text-gray-500 mb-3">For: {selectedProject.client_name}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProject.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        {selectedProject.location}
                      </div>
                    )}
                    {selectedProject.capacity_kw && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Zap className="w-4 h-4 text-orange-500" />
                        {selectedProject.capacity_kw} kW system
                      </div>
                    )}
                    {selectedProject.start_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-orange-500" />
                        Started: {selectedProject.start_date}
                      </div>
                    )}
                    {selectedProject.end_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-green-500" />
                        Target: {selectedProject.end_date}
                      </div>
                    )}
                  </div>
                  {selectedProject.notes && (
                    <p className="mt-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedProject.notes}</p>
                  )}
                </div>

                {/* Installation Timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Installation Progress</h3>
                  <div className="relative">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const isDone = idx < completedSteps
                      const isActive = idx === completedSteps - 1 && selectedProject.status !== 'Completed'
                      const Icon = step.icon
                      return (
                        <div key={step.key} className="flex items-start gap-3 pb-4 relative">
                          {/* Line */}
                          {idx < TIMELINE_STEPS.length - 1 && (
                            <div
                              className={`absolute left-[14px] top-7 w-0.5 h-full ${
                                isDone ? 'bg-orange-400' : 'bg-gray-200'
                              }`}
                            />
                          )}
                          {/* Circle */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                              isDone
                                ? 'bg-orange-500 text-white'
                                : isActive
                                ? 'bg-orange-100 border-2 border-orange-400 text-orange-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          {/* Label */}
                          <div className="pt-0.5">
                            <p
                              className={`text-sm font-medium ${
                                isDone ? 'text-gray-900' : isActive ? 'text-orange-700' : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </p>
                            {isDone && (
                              <p className="text-xs text-green-600 font-medium mt-0.5">Completed</p>
                            )}
                            {isActive && (
                              <p className="text-xs text-orange-600 font-medium mt-0.5">In progress</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Recent Updates */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Site Updates</h3>
                  {projectUpdates.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No updates for this project yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {projectUpdates.slice(0, 5).map((u) => (
                        <div key={u.id} className="border-l-2 border-orange-300 pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-500">
                              {new Date(u.date + 'T00:00:00').toLocaleDateString('en-US', {
                                weekday: 'short', month: 'short', day: 'numeric',
                              })}
                            </span>
                            {u.progress_pct != null && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                {u.progress_pct}% complete
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{u.summary}</p>
                          {u.author_name && (
                            <p className="text-xs text-gray-400 mt-1">— {u.author_name}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}
