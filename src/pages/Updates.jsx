import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Plus, X, ClipboardList, Calendar, Clock, ChevronDown, Trash2 } from 'lucide-react'

const EMPTY_FORM = {
  project_id: '',
  date: new Date().toISOString().split('T')[0],
  hours_worked: '',
  summary: '',
  blockers: '',
  progress_pct: '',
}

export default function Updates() {
  const { user } = useAuth()
  const [updates, setUpdates] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [filterProject, setFilterProject] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    fetchProjects()
    fetchUpdates()
  }, [])

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('id, name').order('name')
    setProjects(data || [])
  }

  async function fetchUpdates() {
    setLoading(true)
    const { data, error } = await supabase
      .from('daily_updates')
      .select('*, projects(name)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    setUpdates(error ? [] : data || [])
    setLoading(false)
  }

  async function handleSave() {
    if (!form.summary.trim()) return toast.error('Summary is required')
    setSaving(true)
    const payload = {
      ...form,
      hours_worked: form.hours_worked ? parseFloat(form.hours_worked) : null,
      progress_pct: form.progress_pct ? parseInt(form.progress_pct) : null,
      project_id: form.project_id || null,
      author_id: user?.id,
      author_name: user?.user_metadata?.full_name || user?.email,
    }
    const { error } = await supabase.from('daily_updates').insert([payload])
    setSaving(false)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Update logged!')
      setShowModal(false)
      setForm(EMPTY_FORM)
      fetchUpdates()
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('daily_updates').delete().eq('id', id)
    if (error) toast.error(error.message)
    else {
      toast.success('Update deleted')
      setDeleteId(null)
      fetchUpdates()
    }
  }

  const filtered = filterProject
    ? updates.filter((u) => u.project_id === filterProject)
    : updates

  const formatDate = (d) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <Layout title="Daily Updates">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Updates</h1>
            <p className="text-gray-500 text-sm mt-1">{updates.length} updates logged</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Update
          </button>
        </div>

        {/* Filter */}
        {projects.length > 0 && (
          <div className="mb-5">
            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Updates List */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading updates...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No updates logged yet</p>
            <p className="text-gray-400 text-sm mt-1">Log your first daily update</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Log Update
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((u) => (
              <div key={u.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium text-gray-900">{formatDate(u.date)}</span>
                    </div>
                    {u.projects?.name && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                        {u.projects.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {u.hours_worked && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {u.hours_worked}h
                      </div>
                    )}
                    {u.progress_pct != null && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {u.progress_pct}% done
                      </span>
                    )}
                    <button onClick={() => setDeleteId(u.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-800 text-sm leading-relaxed">{u.summary}</p>

                {u.blockers && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-xs font-semibold text-red-700 mb-1">Blockers</p>
                    <p className="text-sm text-red-600">{u.blockers}</p>
                  </div>
                )}

                {u.author_name && (
                  <p className="text-xs text-gray-400 mt-3">by {u.author_name}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Update Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Log Daily Update</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                  <select
                    value={form.project_id}
                    onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={form.hours_worked}
                    onChange={(e) => setForm({ ...form, hours_worked: e.target.value })}
                    placeholder="e.g. 8"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.progress_pct}
                    onChange={(e) => setForm({ ...form, progress_pct: e.target.value })}
                    placeholder="e.g. 75"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Summary <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="What was completed today? What tasks were worked on?"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blockers / Issues</label>
                <textarea
                  value={form.blockers}
                  onChange={(e) => setForm({ ...form, blockers: e.target.value })}
                  placeholder="Any blockers or issues encountered? (optional)"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Log Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Update?</h3>
            <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
