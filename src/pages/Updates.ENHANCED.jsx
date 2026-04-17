import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import PhotoUploader from '../components/PhotoUploader'
import PhotoGallery from '../components/PhotoGallery'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getPhotosForUpdate } from '../lib/photoService'
import toast from 'react-hot-toast'
import {
  Plus, X, ClipboardList, Calendar, Users, AlertTriangle,
  CheckCircle2, Loader2, Eye, ChevronDown, Trash2,
} from 'lucide-react'

const PROJECT_STAGES = [
  { value: 1,  label: 'Site Survey Done',             color: 'bg-blue-100 text-blue-700' },
  { value: 2,  label: 'KSEB Application Submitted',   color: 'bg-blue-100 text-blue-700' },
  { value: 3,  label: 'Structure / Mounting Work',    color: 'bg-amber-100 text-amber-700' },
  { value: 4,  label: 'Panel Installation',           color: 'bg-amber-100 text-amber-700' },
  { value: 5,  label: 'Wiring & Inverter Setup',      color: 'bg-amber-100 text-amber-700' },
  { value: 6,  label: 'Earthing & Safety Check',      color: 'bg-orange-100 text-orange-700' },
  { value: 7,  label: 'KSEB Inspection Scheduled',    color: 'bg-orange-100 text-orange-700' },
  { value: 8,  label: 'Net Meter Installation',       color: 'bg-purple-100 text-purple-700' },
  { value: 9,  label: 'System Commissioning',         color: 'bg-purple-100 text-purple-700' },
  { value: 10, label: 'Project Handover & Completed', color: 'bg-green-100 text-green-700' },
]

const EMPTY_FORM = {
  project_id: '',
  summary: '',
  blockers: '',
  progress_pct: 50,
  hours_worked: '',
}

export default function Updates() {
  const { user, profile } = useAuth()
  const isAdminOrManager = profile?.role === 'admin' || profile?.role === 'manager'

  const [projects, setProjects]             = useState([])
  const [updates,  setUpdates]              = useState([])
  const [updatePhotos, setUpdatePhotos]     = useState({})  // { update_id: [photo, ...] }
  const [loading,  setLoading]              = useState(true)

  // Form state
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [saving,    setSaving]    = useState(false)

  // Modal states
  const [viewingUpdate, setViewingUpdate]   = useState(null)
  const [deleteId, setDeleteId]             = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    await Promise.all([fetchProjects(), fetchUpdates()])
    setLoading(false)
  }

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('id, name, client_name, capacity_kw')
      .order('name', { ascending: true })
    setProjects(data || [])
  }

  async function fetchUpdates() {
    let query = supabase
      .from('daily_updates')
      .select('*')
      .order('date', { ascending: false })

    if (profile?.role === 'worker') {
      query = query.eq('author_id', user.id)
    }

    const { data, error } = await query
    if (error) {
      toast.error('Failed to load updates')
      return
    }

    setUpdates(data || [])

    // Fetch photos for all updates
    if (data && data.length > 0) {
      const photoMap = {}
      for (const update of data) {
        const photos = await getPhotosForUpdate(update.id)
        photoMap[update.id] = photos
      }
      setUpdatePhotos(photoMap)
    }
  }

  function openForm() {
    const defaultProject = projects.length === 1 ? projects[0].id : ''
    setForm({
      ...EMPTY_FORM,
      project_id: defaultProject,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.project_id)         return toast.error('Select a project')
    if (!form.summary.trim())      return toast.error('Work summary is required')
    if (form.progress_pct === '')  return toast.error('Progress percentage is required')

    setSaving(true)
    try {
      const payload = {
        project_id:    form.project_id,
        author_id:     user.id,
        author_name:   profile?.full_name || user.email,
        date:          new Date().toISOString().split('T')[0],
        summary:       form.summary.trim(),
        blockers:      form.blockers.trim() || null,
        progress_pct:  Number(form.progress_pct),
        hours_worked:  form.hours_worked ? Number(form.hours_worked) : null,
      }

      const { data: newUpdate, error: insertError } = await supabase
        .from('daily_updates')
        .insert(payload)
        .select()
        .single()

      if (insertError) throw insertError

      toast.success('Update logged successfully!')
      setShowForm(false)
      setForm(EMPTY_FORM)
      await fetchData()
    } catch (err) {
      toast.error(err.message || 'Failed to save update')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    try {
      const { error } = await supabase
        .from('daily_updates')
        .delete()
        .eq('id', deleteId)

      if (error) throw error

      toast.success('Update deleted')
      setDeleteId(null)
      await fetchData()
    } catch (err) {
      toast.error(err.message || 'Failed to delete update')
    }
  }

  const stageLabel = (stageId) => {
    const stage = PROJECT_STAGES.find(s => s.value === stageId)
    return stage ? stage.label : `Stage ${stageId}`
  }

  if (loading) {
    return (
      <Layout title="Daily Updates">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Daily Updates">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-orange-500" />
            Daily Updates
          </h1>
          {(isAdminOrManager || profile?.role === 'worker') && (
            <button
              onClick={openForm}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Log Update
            </button>
          )}
        </div>

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Log Daily Update</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project *</label>
                  <select
                    value={form.project_id}
                    onChange={(e) => setForm(f => ({ ...f, project_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select a project...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.client_name})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Work Done Today */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Work Summary *</label>
                  <textarea
                    value={form.summary}
                    onChange={(e) => setForm(f => ({ ...f, summary: e.target.value }))}
                    placeholder="Describe what work was completed today..."
                    rows="4"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Progress and Hours */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Progress % *</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={form.progress_pct}
                        onChange={(e) => setForm(f => ({ ...f, progress_pct: Number(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="text-sm font-bold text-orange-500 w-12">{form.progress_pct}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hours Worked</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="16"
                      value={form.hours_worked}
                      onChange={(e) => setForm(f => ({ ...f, hours_worked: e.target.value }))}
                      placeholder="e.g., 8.5"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* Blockers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Blockers/Issues</label>
                  <textarea
                    value={form.blockers}
                    onChange={(e) => setForm(f => ({ ...f, blockers: e.target.value }))}
                    placeholder="Any issues or blockers faced..."
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>

                {/* Photo Upload */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    📸 Add Photos (Optional)
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Photos will be uploaded after you save the update. You can add them immediately after.
                  </p>
                  <p className="text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded">
                    💡 Create the update first, then upload photos to attach them.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Updates List */}
        <div className="space-y-4">
          {updates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No updates yet</p>
              {(isAdminOrManager || profile?.role === 'worker') && (
                <p className="text-sm text-gray-500 mt-1">Click "Log Update" to add your first entry</p>
              )}
            </div>
          ) : (
            updates.map(update => (
              <div key={update.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-orange-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {projects.find(p => p.id === update.project_id)?.name || 'Project'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        by <strong>{update.author_name}</strong> on {new Date(update.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold">
                        {update.progress_pct || 0}% Complete
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="px-6 py-4 space-y-4">
                  {/* Summary */}
                  <div>
                    <h4 className="font-medium text-gray-700 text-sm mb-1">Work Done</h4>
                    <p className="text-gray-700">{update.summary}</p>
                  </div>

                  {/* Stats Row */}
                  <div className="flex gap-6 flex-wrap pt-2 border-t border-gray-200">
                    {update.hours_worked && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-600">{update.hours_worked}h worked</span>
                      </div>
                    )}
                    {update.blockers && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-gray-600">Issues reported</span>
                      </div>
                    )}
                  </div>

                  {/* Blockers if any */}
                  {update.blockers && (
                    <div className="bg-red-50 border border-red-200 rounded px-3 py-2">
                      <p className="text-sm text-red-700"><strong>Issues:</strong> {update.blockers}</p>
                    </div>
                  )}

                  {/* Photos Section */}
                  {updatePhotos[update.id]?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 text-sm mb-3">Photos ({updatePhotos[update.id].length})</h4>
                      <PhotoGallery
                        photos={updatePhotos[update.id]}
                        userId={user.id}
                        readOnly={user.id !== update.author_id && !isAdminOrManager}
                        onPhotoDeleted={() => fetchData()}
                      />
                    </div>
                  )}

                  {/* Photo Uploader - only for own updates or admins */}
                  {(user.id === update.author_id || isAdminOrManager) && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-700 text-sm mb-3">Add Photos</h4>
                      <PhotoUploader
                        updateId={update.id}
                        userId={user.id}
                        onPhotoUploaded={() => fetchData()}
                      />
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex gap-2 justify-end">
                  {(user.id === update.author_id || isAdminOrManager) && (
                    <button
                      onClick={() => setDeleteId(update.id)}
                      className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Delete Update?</h3>
                <p className="text-sm text-gray-600">This action cannot be undone. Associated photos will also be deleted.</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
