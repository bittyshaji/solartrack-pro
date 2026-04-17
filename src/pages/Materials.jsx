import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import HomeButton from '../components/HomeButton'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import {
  Plus, Edit2, Trash2, X, Package, AlertTriangle,
  ChevronDown, BookOpen, ClipboardList, CheckCircle2, Ruler,
} from 'lucide-react'

// ─── Constants ────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'panels',    label: 'Solar Panels',   color: 'bg-yellow-100 text-yellow-700' },
  { value: 'inverter',  label: 'Inverter',        color: 'bg-blue-100 text-blue-700'    },
  { value: 'structure', label: 'Structure',       color: 'bg-orange-100 text-orange-700'},
  { value: 'wiring',    label: 'Wiring',          color: 'bg-purple-100 text-purple-700'},
  { value: 'other',     label: 'Other',           color: 'bg-gray-100 text-gray-600'   },
]

const UNITS = ['units', 'panels', 'meters', 'sets', 'pairs', 'rolls', 'kg', 'boxes', 'liters']

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400'

function CatBadge({ category }) {
  const cat = CATEGORIES.find(c => c.value === category) || CATEGORIES[4]
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>
      {cat.label}
    </span>
  )
}

// ─── Main Component ───────────────────────────────────────────

export default function Materials() {
  const { profile } = useAuth()
  const canManage     = profile?.role === 'admin' || profile?.role === 'manager'
  const isTeamLeader  = profile?.role === 'team_leader'

  const [tab, setTab] = useState('allocations') // 'allocations' | 'catalog'

  // Data
  const [catalog,     setCatalog]     = useState([])
  const [allocations, setAllocations] = useState([])
  const [projects,    setProjects]    = useState([])
  const [loading,     setLoading]     = useState(true)

  // Filters
  const [filterProject, setFilterProject] = useState('')

  // Allocation modal
  const [showAllocModal,  setShowAllocModal]  = useState(false)
  const [editAlloc,       setEditAlloc]       = useState(null)
  const [allocForm,       setAllocForm]       = useState({
    project_id: '', material_id: '', quantity_allocated: '', allocation_date: today(), notes: '',
  })
  const [savingAlloc, setSavingAlloc] = useState(false)

  // Mark Used modal
  const [showUsedModal, setShowUsedModal] = useState(false)
  const [usedAlloc,     setUsedAlloc]     = useState(null)
  const [usedQty,       setUsedQty]       = useState('')
  const [savingUsed,    setSavingUsed]    = useState(false)

  // Catalog modal
  const [showCatalogModal, setShowCatalogModal] = useState(false)
  const [editCatalog,      setEditCatalog]      = useState(null)
  const [catalogForm,      setCatalogForm]      = useState({ material_name: '', unit: 'units', category: 'other' })
  const [savingCatalog,    setSavingCatalog]    = useState(false)

  // Site distances (per project)
  const [distances,     setDistances]     = useState({ dist_panel_to_elec: '', dist_elec_to_kseb: '', dist_arrester_to_earth: '' })
  const [savingDist,    setSavingDist]    = useState(false)
  const [editingDist,   setEditingDist]   = useState(false)

  // Delete confirm
  const [deleteAllocId,   setDeleteAllocId]   = useState(null)
  const [deleteCatalogId, setDeleteCatalogId] = useState(null)

  function today() {
    return new Date().toISOString().split('T')[0]
  }

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    fetchDistances(filterProject)
    setEditingDist(false)
  }, [filterProject])

  // ─── Fetch ──────────────────────────────────────────────────

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchCatalog(), fetchAllocations(), fetchProjects()])
    setLoading(false)
  }

  async function fetchCatalog() {
    const { data } = await supabase
      .from('material_catalog')
      .select('*')
      .order('category')
      .order('material_name')
    setCatalog(data || [])
  }

  async function fetchAllocations() {
    const { data, error } = await supabase
      .from('material_allocations')
      .select(`
        id, project_id, quantity_allocated, quantity_used,
        allocation_date, notes, created_at,
        material:material_catalog(id, material_name, unit, category),
        project:projects(id, project_code, client_name),
        allocator:user_profiles!material_allocations_allocated_by_fkey(id, full_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      // Fallback without joins if FK names differ
      const { data: raw } = await supabase
        .from('material_allocations')
        .select('*')
        .order('created_at', { ascending: false })
      setAllocations(raw || [])
    } else {
      setAllocations(data || [])
    }
  }

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('id, project_code, client_name')
      .order('project_code', { ascending: false })
    setProjects(data || [])
  }

  async function fetchDistances(projectId) {
    if (!projectId) { setDistances({ dist_panel_to_elec: '', dist_elec_to_kseb: '', dist_arrester_to_earth: '' }); return }
    const { data } = await supabase
      .from('projects')
      .select('dist_panel_to_elec, dist_elec_to_kseb, dist_arrester_to_earth')
      .eq('id', projectId)
      .single()
    if (data) {
      setDistances({
        dist_panel_to_elec:      data.dist_panel_to_elec     ?? '',
        dist_elec_to_kseb:       data.dist_elec_to_kseb      ?? '',
        dist_arrester_to_earth:  data.dist_arrester_to_earth ?? '',
      })
    }
    setEditingDist(false)
  }

  async function handleSaveDistances() {
    if (!filterProject) return
    setSavingDist(true)
    const { error } = await supabase
      .from('projects')
      .update({
        dist_panel_to_elec:      distances.dist_panel_to_elec     !== '' ? parseFloat(distances.dist_panel_to_elec)     : null,
        dist_elec_to_kseb:       distances.dist_elec_to_kseb      !== '' ? parseFloat(distances.dist_elec_to_kseb)      : null,
        dist_arrester_to_earth:  distances.dist_arrester_to_earth !== '' ? parseFloat(distances.dist_arrester_to_earth) : null,
      })
      .eq('id', filterProject)
    setSavingDist(false)
    if (error) { toast.error(error.message); return }
    toast.success('Distances saved')
    setEditingDist(false)
  }

  // ─── Allocation CRUD ─────────────────────────────────────────

  function openCreateAlloc() {
    setEditAlloc(null)
    setAllocForm({
      project_id: filterProject || '',
      material_id: '',
      quantity_allocated: '',
      allocation_date: today(),
      notes: '',
    })
    setShowAllocModal(true)
  }

  function openEditAlloc(a) {
    setEditAlloc(a)
    setAllocForm({
      project_id:        a.project_id || a.project?.id || '',
      material_id:       a.material_id || a.material?.id || '',
      quantity_allocated: a.quantity_allocated ?? '',
      allocation_date:   a.allocation_date || today(),
      notes:             a.notes || '',
    })
    setShowAllocModal(true)
  }

  async function handleSaveAlloc() {
    if (!allocForm.project_id)         return toast.error('Select a project')
    if (!allocForm.material_id)        return toast.error('Select a material')
    if (!allocForm.quantity_allocated) return toast.error('Enter quantity to allocate')

    setSavingAlloc(true)
    const payload = {
      project_id:        allocForm.project_id,
      material_id:       allocForm.material_id,
      quantity_allocated: parseFloat(allocForm.quantity_allocated),
      allocation_date:   allocForm.allocation_date || today(),
      notes:             allocForm.notes.trim() || null,
      allocated_by:      profile?.id || null,
    }

    let error
    if (editAlloc) {
      ;({ error } = await supabase.from('material_allocations').update(payload).eq('id', editAlloc.id))
    } else {
      ;({ error } = await supabase.from('material_allocations').insert(payload))
    }

    setSavingAlloc(false)
    if (error) { toast.error(error.message); return }
    toast.success(editAlloc ? 'Allocation updated' : 'Material allocated')
    setShowAllocModal(false)
    fetchAllocations()
  }

  async function handleDeleteAlloc() {
    const { error } = await supabase.from('material_allocations').delete().eq('id', deleteAllocId)
    if (error) { toast.error(error.message); return }
    toast.success('Allocation removed')
    setDeleteAllocId(null)
    fetchAllocations()
  }

  // ─── Mark Used ───────────────────────────────────────────────

  function openMarkUsed(alloc) {
    setUsedAlloc(alloc)
    setUsedQty(alloc.quantity_used ?? '')
    setShowUsedModal(true)
  }

  async function handleMarkUsed() {
    if (usedQty === '') return toast.error('Enter quantity used')
    setSavingUsed(true)
    const { error } = await supabase
      .from('material_allocations')
      .update({ quantity_used: parseFloat(usedQty) })
      .eq('id', usedAlloc.id)
    setSavingUsed(false)
    if (error) { toast.error(error.message); return }

    const over = parseFloat(usedQty) > usedAlloc.quantity_allocated
    toast.success(over
      ? '⚠️ Marked used — quantity exceeds allocation!'
      : 'Quantity used updated')
    setShowUsedModal(false)
    fetchAllocations()
  }

  // ─── Catalog CRUD ─────────────────────────────────────────────

  function openCreateCatalog() {
    setEditCatalog(null)
    setCatalogForm({ material_name: '', unit: 'units', category: 'other' })
    setShowCatalogModal(true)
  }

  function openEditCatalog(item) {
    setEditCatalog(item)
    setCatalogForm({ material_name: item.material_name, unit: item.unit, category: item.category })
    setShowCatalogModal(true)
  }

  async function handleSaveCatalog() {
    if (!catalogForm.material_name.trim()) return toast.error('Material name is required')
    setSavingCatalog(true)
    const payload = {
      material_name: catalogForm.material_name.trim(),
      unit:          catalogForm.unit,
      category:      catalogForm.category,
    }
    let error
    if (editCatalog) {
      ;({ error } = await supabase.from('material_catalog').update(payload).eq('id', editCatalog.id))
    } else {
      ;({ error } = await supabase.from('material_catalog').insert(payload))
    }
    setSavingCatalog(false)
    if (error) { toast.error(error.message); return }
    toast.success(editCatalog ? 'Material updated' : 'Material added to catalog')
    setShowCatalogModal(false)
    fetchCatalog()
  }

  async function handleDeleteCatalog() {
    const { error } = await supabase.from('material_catalog').delete().eq('id', deleteCatalogId)
    if (error) { toast.error(error.message); return }
    toast.success('Material removed from catalog')
    setDeleteCatalogId(null)
    fetchCatalog()
  }

  // ─── Derived Data ─────────────────────────────────────────────

  const filteredAllocs = filterProject
    ? allocations.filter(a => (a.project?.id || a.project_id) === filterProject)
    : allocations

  const overAllocations = filteredAllocs.filter(a => a.quantity_used > a.quantity_allocated)

  // Per-project summary stats
  const totalAllocated = filteredAllocs.reduce((s, a) => s + (a.quantity_allocated || 0), 0)
  const totalUsed      = filteredAllocs.reduce((s, a) => s + (a.quantity_used || 0), 0)

  // ─── Render ───────────────────────────────────────────────────

  return (
    <Layout title="Materials">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Material Allocation</h1>
            <p className="text-sm text-gray-500 mt-0.5">{allocations.length} allocation{allocations.length !== 1 ? 's' : ''} · {catalog.length} materials in catalog</p>
          </div>
          <div className="flex items-center gap-2">
            <HomeButton />
            {canManage && tab === 'allocations' && (
              <button
                onClick={openCreateAlloc}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Allocate Material
              </button>
            )}
            {canManage && tab === 'catalog' && (
              <button
                onClick={openCreateCatalog}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Material
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-5">
          <button
            onClick={() => setTab('allocations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'allocations' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Allocations
          </button>
          <button
            onClick={() => setTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'catalog' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Material Catalog
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : tab === 'allocations' ? (

          /* ── ALLOCATIONS TAB ── */
          <div className="space-y-4">

            {/* Filters + Summary */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <select
                  value={filterProject}
                  onChange={e => setFilterProject(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                >
                  <option value="">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_code} — {p.client_name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              {filterProject && (
                <div className="flex gap-3 text-sm">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 text-blue-700 font-medium">
                    Allocated: <span className="font-bold">{totalAllocated}</span> units
                  </div>
                  <div className={`border rounded-lg px-3 py-1.5 font-medium ${
                    totalUsed > totalAllocated
                      ? 'bg-red-50 border-red-100 text-red-700'
                      : 'bg-green-50 border-green-100 text-green-700'
                  }`}>
                    Used: <span className="font-bold">{totalUsed}</span> units
                  </div>
                </div>
              )}

              {overAllocations.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-red-600 font-medium bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  {overAllocations.length} item{overAllocations.length > 1 ? 's' : ''} exceeding allocation!
                </div>
              )}
            </div>

            {/* Site Distances Card — shown only when a project is selected */}
            {filterProject && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-orange-500" />
                    <p className="text-sm font-semibold text-gray-700">Site Distances</p>
                    <span className="text-xs text-gray-400">(metres)</span>
                  </div>
                  {canManage && !editingDist && (
                    <button
                      onClick={() => setEditingDist(true)}
                      className="text-xs text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  )}
                </div>

                {editingDist ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { key: 'dist_panel_to_elec',     label: 'Solar Panels → Electrical Panel' },
                        { key: 'dist_elec_to_kseb',      label: 'Electrical Panel → KSEB Tapping' },
                        { key: 'dist_arrester_to_earth', label: 'Lightning Arrester → Earthing'   },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-xs text-gray-500 mb-1">{label}</label>
                          <div className="relative">
                            <input
                              type="number" min="0" step="0.1"
                              value={distances[key]}
                              onChange={e => setDistances(p => ({ ...p, [key]: e.target.value }))}
                              placeholder="0.0"
                              className="w-full px-3 py-2 pr-8 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">m</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => { setEditingDist(false); fetchDistances(filterProject) }} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
                      <button onClick={handleSaveDistances} disabled={savingDist} className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg font-medium disabled:opacity-50">
                        {savingDist ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'dist_panel_to_elec',     label: 'Solar Panels → Electrical Panel' },
                      { key: 'dist_elec_to_kseb',      label: 'Electrical Panel → KSEB Tapping' },
                      { key: 'dist_arrester_to_earth', label: 'Lightning Arrester → Earthing'   },
                    ].map(({ key, label }) => (
                      <div key={key} className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {distances[key] !== '' && distances[key] != null ? `${distances[key]} m` : <span className="text-gray-400 font-normal">Not set</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Allocations List */}
            {filteredAllocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Package className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">No allocations yet</p>
                {canManage && (
                  <button
                    onClick={openCreateAlloc}
                    className="mt-3 text-sm text-orange-500 hover:text-orange-600 font-medium"
                  >
                    Allocate first material
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Material</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Project</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Allocated</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Used</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAllocs.map(alloc => {
                      const isOver = alloc.quantity_used > alloc.quantity_allocated
                      const usedPct = alloc.quantity_allocated > 0
                        ? Math.min(100, Math.round((alloc.quantity_used / alloc.quantity_allocated) * 100))
                        : 0
                      const matName = alloc.material?.material_name || '—'
                      const matUnit = alloc.material?.unit || 'units'
                      const matCat  = alloc.material?.category || 'other'
                      const projCode = alloc.project?.project_code || '—'
                      const projName = alloc.project?.client_name || ''

                      return (
                        <tr key={alloc.id} className={`hover:bg-gray-50 transition-colors ${isOver ? 'bg-red-50/40' : ''}`}>
                          {/* Material */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {isOver && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                              <div>
                                <p className="font-medium text-gray-900">{matName}</p>
                                <CatBadge category={matCat} />
                              </div>
                            </div>
                          </td>
                          {/* Project */}
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="font-mono text-xs font-semibold text-orange-600">{projCode}</p>
                            <p className="text-xs text-gray-500">{projName}</p>
                          </td>
                          {/* Allocated */}
                          <td className="px-4 py-3">
                            <span className="font-semibold text-gray-900">{alloc.quantity_allocated}</span>
                            <span className="text-xs text-gray-400 ml-1">{matUnit}</span>
                          </td>
                          {/* Used + progress bar */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
                                {alloc.quantity_used}
                              </span>
                              <span className="text-xs text-gray-400">{matUnit}</span>
                            </div>
                            <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${usedPct}%` }}
                              />
                            </div>
                          </td>
                          {/* Date */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-xs text-gray-500">
                              {alloc.allocation_date
                                ? new Date(alloc.allocation_date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                : '—'}
                            </span>
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              {(canManage || isTeamLeader) && (
                                <button
                                  onClick={() => openMarkUsed(alloc)}
                                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium px-2 py-1 rounded hover:bg-green-50 transition-colors"
                                  title="Mark quantity used"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Used
                                </button>
                              )}
                              {canManage && (
                                <>
                                  <button
                                    onClick={() => openEditAlloc(alloc)}
                                    className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                                    title="Edit allocation"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteAllocId(alloc.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="Delete allocation"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        ) : (

          /* ── CATALOG TAB ── */
          <div>
            {catalog.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <BookOpen className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">No materials in catalog</p>
                {canManage && (
                  <button onClick={openCreateCatalog} className="mt-3 text-sm text-orange-500 hover:text-orange-600 font-medium">
                    Add first material
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {CATEGORIES.map(cat => {
                  const items = catalog.filter(c => c.category === cat.value)
                  if (items.length === 0) return null
                  return (
                    <div key={cat.value}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cat.color}`}>{cat.label}</span>
                        <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                        {items.map(item => (
                          <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                                <Package className="w-4 h-4 text-orange-500" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{item.material_name}</p>
                                <p className="text-xs text-gray-400">Unit: {item.unit}</p>
                              </div>
                            </div>
                            {canManage && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditCatalog(item)}
                                  className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteCatalogId(item.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ALLOCATE MATERIAL MODAL ── */}
      {showAllocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editAlloc ? 'Edit Allocation' : 'Allocate Material'}</h2>
              <button onClick={() => setShowAllocModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project <span className="text-red-500">*</span></label>
                <select
                  value={allocForm.project_id}
                  onChange={e => setAllocForm(p => ({ ...p, project_id: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">— Select Project —</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_code} — {p.client_name}</option>
                  ))}
                </select>
              </div>
              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material <span className="text-red-500">*</span></label>
                <select
                  value={allocForm.material_id}
                  onChange={e => setAllocForm(p => ({ ...p, material_id: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">— Select Material —</option>
                  {CATEGORIES.map(cat => {
                    const items = catalog.filter(c => c.category === cat.value)
                    if (!items.length) return null
                    return (
                      <optgroup key={cat.value} label={cat.label}>
                        {items.map(m => (
                          <option key={m.id} value={m.id}>{m.material_name} ({m.unit})</option>
                        ))}
                      </optgroup>
                    )
                  })}
                </select>
              </div>
              {/* Qty + Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Qty Allocated <span className="text-red-500">*</span></label>
                  <input
                    type="number" min="0" step="0.01"
                    value={allocForm.quantity_allocated}
                    onChange={e => setAllocForm(p => ({ ...p, quantity_allocated: e.target.value }))}
                    placeholder="e.g. 20"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allocation Date</label>
                  <input
                    type="date"
                    value={allocForm.allocation_date}
                    onChange={e => setAllocForm(p => ({ ...p, allocation_date: e.target.value }))}
                    className={inputCls}
                  />
                </div>
              </div>
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={allocForm.notes}
                  onChange={e => setAllocForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional notes…"
                  rows={2}
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowAllocModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSaveAlloc} disabled={savingAlloc} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {savingAlloc ? 'Saving…' : editAlloc ? 'Update' : 'Allocate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MARK USED MODAL ── */}
      {showUsedModal && usedAlloc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Mark Quantity Used</h2>
              <button onClick={() => setShowUsedModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-800">{usedAlloc.material?.material_name || '—'}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Allocated: <strong>{usedAlloc.quantity_allocated} {usedAlloc.material?.unit || 'units'}</strong>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Actually Used <span className="text-red-500">*</span>
                </label>
                <input
                  type="number" min="0" step="0.01"
                  value={usedQty}
                  onChange={e => setUsedQty(e.target.value)}
                  placeholder={`Max allocated: ${usedAlloc.quantity_allocated}`}
                  className={inputCls}
                  autoFocus
                />
                {parseFloat(usedQty) > usedAlloc.quantity_allocated && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Exceeds allocated quantity — Admin will be alerted
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowUsedModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleMarkUsed} disabled={savingUsed} className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {savingUsed ? 'Saving…' : 'Save Used Qty'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT CATALOG MODAL ── */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editCatalog ? 'Edit Material' : 'Add Material'}</h2>
              <button onClick={() => setShowCatalogModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={catalogForm.material_name}
                  onChange={e => setCatalogForm(p => ({ ...p, material_name: e.target.value }))}
                  placeholder="e.g. 400W Mono Solar Panel"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={catalogForm.category}
                    onChange={e => setCatalogForm(p => ({ ...p, category: e.target.value }))}
                    className={inputCls}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select
                    value={catalogForm.unit}
                    onChange={e => setCatalogForm(p => ({ ...p, unit: e.target.value }))}
                    className={inputCls}
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowCatalogModal(false)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSaveCatalog} disabled={savingCatalog} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
                {savingCatalog ? 'Saving…' : editCatalog ? 'Update' : 'Add Material'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE ALLOC CONFIRM ── */}
      {deleteAllocId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Allocation?</h3>
            <p className="text-sm text-gray-500 mb-6">This allocation record will be permanently deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteAllocId(null)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleDeleteAlloc} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CATALOG CONFIRM ── */}
      {deleteCatalogId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove from Catalog?</h3>
            <p className="text-sm text-gray-500 mb-6">This material will be removed. Existing allocations using it cannot be deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCatalogId(null)} className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleDeleteCatalog} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
