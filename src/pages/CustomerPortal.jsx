import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
  Sun, CheckCircle2, Clock, MapPin, Zap, Calendar,
  Phone, User, Home, Building2, X, Leaf,
} from 'lucide-react'

// ─── Constants ─────────────────────────────────────────────────

const STAGES = [
  { id: 1,  label: 'Site Survey Done'            },
  { id: 2,  label: 'KSEB Application Submitted'  },
  { id: 3,  label: 'Structure / Mounting Work'   },
  { id: 4,  label: 'Panel Installation'          },
  { id: 5,  label: 'Wiring & Inverter Setup'     },
  { id: 6,  label: 'Earthing & Safety Check'     },
  { id: 7,  label: 'KSEB Inspection Scheduled'   },
  { id: 8,  label: 'Net Meter Installation'      },
  { id: 9,  label: 'System Commissioning'        },
  { id: 10, label: 'Project Handover & Completed'},
]

function fmt(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Main Component ─────────────────────────────────────────────

export default function CustomerPortal() {
  const { user, profile } = useAuth()
  const isCustomer = profile?.role === 'customer' || !profile

  const [project,    setProject]    = useState(null)
  const [team,       setTeam]       = useState(null)
  const [leader,     setLeader]     = useState(null)
  const [stageDates, setStageDates] = useState({})
  const [photos,     setPhotos]     = useState([])
  const [loading,    setLoading]    = useState(true)
  const [lightbox,   setLightbox]   = useState(null)

  useEffect(() => {
    if (user?.email) fetchAll()
  }, [user?.email])

  // ─── Data Fetching ────────────────────────────────────────────

  async function fetchAll() {
    setLoading(true)
    await fetchProject()
    setLoading(false)
  }

  async function fetchProject() {
    // Try new customer linking approach first (via customer_id_ref)
    const { data: projectData, error: newError } = await supabase
      .from('projects')
      .select('*')
      .eq('customer_id_ref', await getCustomerIdByEmail())
      .maybeSingle()

    let data = projectData

    // Fallback to old approach (customer_email field) for backward compatibility
    if (newError || !data) {
      const { data: oldData, error: oldError } = await supabase
        .from('projects')
        .select('*')
        .ilike('customer_email', user.email)
        .maybeSingle()

      if (oldError || !oldData) {
        setProject(null)
        return
      }
      data = oldData
    }

    setProject(data)

    await Promise.all([
      fetchTeam(data.id),
      fetchStageDates(data.id),
      fetchPhotos(data.id),
    ])
  }

  async function getCustomerIdByEmail() {
    const { data } = await supabase
      .from('project_customers')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    return data?.id || null
  }

  async function fetchTeam(projectId) {
    const { data: teamData } = await supabase
      .from('teams')
      .select('id, name, team_leader_id')
      .eq('project_id', projectId)
      .maybeSingle()

    if (!teamData) return
    setTeam(teamData)

    if (teamData.team_leader_id) {
      const { data: ldr } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone')
        .eq('id', teamData.team_leader_id)
        .maybeSingle()
      setLeader(ldr || null)
    }
  }

  async function fetchStageDates(projectId) {
    const { data } = await supabase
      .from('daily_updates')
      .select('stage_at_time_of_update, date, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (!data) return
    const dates = {}
    data.forEach(u => {
      const s = u.stage_at_time_of_update
      if (s && !dates[s]) dates[s] = u.date || u.created_at?.split('T')[0]
    })
    setStageDates(dates)
  }

  async function fetchPhotos(projectId) {
    // Get latest update IDs for this project
    const { data: updates } = await supabase
      .from('daily_updates')
      .select('id')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!updates || updates.length === 0) return

    const ids = updates.map(u => u.id)
    const { data: photoData } = await supabase
      .from('update_photos')
      .select('id, photo_url, caption, uploaded_at')
      .in('update_id', ids)
      .order('uploaded_at', { ascending: false })
      .limit(8)

    setPhotos(photoData || [])
  }

  // ─── Derived State ────────────────────────────────────────────

  const currentStage  = project?.stage || 1
  const progressPct   = Math.round((currentStage / 10) * 100)
  const isCompleted   = project?.status === 'Completed' || currentStage === 10

  // ─── Loading ──────────────────────────────────────────────────

  if (loading) {
    return (
      <Layout title="My Project">
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500" />
          <p className="text-gray-400 text-sm">Loading your project…</p>
        </div>
      </Layout>
    )
  }

  // ─── No Project Found ─────────────────────────────────────────

  if (!project) {
    return (
      <Layout title="Customer Portal">
        <div className="max-w-lg mx-auto text-center py-16">
          <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-6">
            <Sun className="w-10 h-10 text-orange-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Project Found</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            We couldn't find a solar project linked to <strong>{user?.email}</strong>.
            Please contact your installation team.
          </p>
          <div className="mt-8 bg-orange-50 rounded-2xl border border-orange-100 p-5 text-left">
            <p className="text-sm font-semibold text-orange-800 mb-3">Need help? Contact us:</p>
            <div className="flex items-center gap-2 text-sm text-orange-700">
              <Phone className="w-4 h-4" /> +91 98765 43210
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // ─── Portal View ──────────────────────────────────────────────

  return (
    <Layout title="My Solar Project">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* ── HERO CARD ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-300 text-white shadow-lg">
          {/* Background sun decoration */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -right-4 w-56 h-56 rounded-full bg-white/5" />

          <div className="relative p-6">
            {/* Company + Project Code */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sun className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-orange-100 font-medium">SolarTrack Pro</p>
                  <p className="text-xs font-mono font-bold text-white/80">{project.project_code}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur ${
                isCompleted
                  ? 'bg-green-400/30 text-green-50'
                  : project.status === 'On Hold'
                  ? 'bg-yellow-400/30 text-yellow-50'
                  : 'bg-white/20 text-white'
              }`}>
                {project.status || 'Active'}
              </span>
            </div>

            {/* Customer Name */}
            <h1 className="text-2xl font-bold text-white mb-1">{project.client_name}</h1>
            <div className="flex items-center gap-4 text-orange-100 text-sm flex-wrap">
              {project.capacity_kw && (
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> {project.capacity_kw} kW System
                </span>
              )}
              {project.project_type && (
                <span className="flex items-center gap-1">
                  {project.project_type === 'Commercial'
                    ? <Building2 className="w-3.5 h-3.5" />
                    : <Home className="w-3.5 h-3.5" />}
                  {project.project_type}
                </span>
              )}
              {project.district && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {project.district}
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-orange-100">Installation Progress</span>
                <span className="text-sm font-bold text-white">{progressPct}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-white transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-orange-100 mt-1.5">
                Stage {currentStage} of 10 — {STAGES[currentStage - 1]?.label}
              </p>
            </div>
          </div>
        </div>

        {/* ── GRID: Project Info + Team Leader ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Project Details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Project Details</h2>

            {project.site_address && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Site Address</p>
                  <p className="text-sm font-medium text-gray-800 leading-snug">{project.site_address}</p>
                  {project.district && <p className="text-xs text-gray-500">{project.district}, Kerala</p>}
                </div>
              </div>
            )}

            {project.end_date && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Expected Completion</p>
                  <p className="text-sm font-medium text-gray-800">{fmt(project.end_date)}</p>
                </div>
              </div>
            )}

            {project.capacity_kw && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">System Capacity</p>
                  <p className="text-sm font-medium text-gray-800">{project.capacity_kw} kW</p>
                  <p className="text-xs text-gray-400">Est. ~{Math.round(project.capacity_kw * 4)} units/day</p>
                </div>
              </div>
            )}

            {isCompleted && (
              <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3 mt-2">
                <Leaf className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700 font-medium">
                  Your solar system is live! Enjoy clean energy. ☀️
                </p>
              </div>
            )}
          </div>

          {/* Team Leader */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-4">Your Installation Team</h2>

            {team ? (
              <div className="space-y-4">
                {/* Team Name */}
                <div className="bg-orange-50 rounded-xl p-3">
                  <p className="text-xs text-orange-600 font-medium mb-0.5">Assigned Team</p>
                  <p className="text-sm font-bold text-orange-800">{team.name}</p>
                </div>

                {/* Team Leader */}
                {leader ? (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {leader.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">Team Leader</p>
                      <p className="font-semibold text-gray-900 text-sm">{leader.full_name}</p>
                      {leader.phone && (
                        <a
                          href={`tel:${leader.phone}`}
                          className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 font-medium mt-0.5"
                        >
                          <Phone className="w-3 h-3" />
                          {leader.phone}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Team leader not assigned yet</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 text-center">
                <User className="w-8 h-8 text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">Team not assigned yet</p>
              </div>
            )}
          </div>
        </div>

        {/* ── INSTALLATION PROGRESS TIMELINE ── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="text-sm font-bold text-gray-800 mb-5">Installation Timeline</h2>

          <div className="space-y-0">
            {STAGES.map((stage, idx) => {
              const isDone    = currentStage > stage.id
              const isCurrent = currentStage === stage.id
              const isPending = currentStage < stage.id
              const stageDate = stageDates[stage.id]
              const isLast    = idx === STAGES.length - 1

              return (
                <div key={stage.id} className="flex items-start gap-3">
                  {/* Left: icon + connector line */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 transition-all ${
                      isDone
                        ? 'bg-orange-500 border-orange-500'
                        : isCurrent
                        ? 'bg-white border-orange-400 shadow-md shadow-orange-100'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : isCurrent ? (
                        <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
                      ) : (
                        <span className="text-xs font-semibold text-gray-300">{stage.id}</span>
                      )}
                    </div>
                    {!isLast && (
                      <div className={`w-0.5 h-8 mt-1 ${isDone ? 'bg-orange-300' : 'bg-gray-100'}`} />
                    )}
                  </div>

                  {/* Right: label + date */}
                  <div className={`pb-6 flex-1 min-w-0 pt-1 ${isLast ? 'pb-0' : ''}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold leading-tight ${
                        isDone    ? 'text-gray-800' :
                        isCurrent ? 'text-orange-600' :
                                    'text-gray-400'
                      }`}>
                        {stage.label}
                      </p>
                      {isCurrent && (
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                          In Progress
                        </span>
                      )}
                      {isDone && stage.id === 10 && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-semibold">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    {stageDate && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isDone || isCurrent ? '✓ ' : ''}{fmt(stageDate)}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── SITE PHOTOS ── */}
        {photos.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-800 mb-4">
              Latest Site Photos
              <span className="text-xs font-normal text-gray-400 ml-2">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {photos.map(photo => (
                <button
                  key={photo.id}
                  onClick={() => setLightbox(photo)}
                  className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity group"
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || 'Site photo'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 text-orange-500 mb-1">
            <Sun className="w-4 h-4" />
            <span className="text-sm font-semibold">SolarTrack Pro</span>
          </div>
          <p className="text-xs text-gray-400">Powering Kerala, one rooftop at a time ☀️</p>
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div onClick={e => e.stopPropagation()} className="max-w-2xl w-full">
            <img
              src={lightbox.photo_url}
              alt={lightbox.caption || 'Site photo'}
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            {lightbox.caption && (
              <p className="text-center text-white/70 text-sm mt-3">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
