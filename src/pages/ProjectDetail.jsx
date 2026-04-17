/**
 * Project Detail Page
 * Displays comprehensive project information with photos, materials, timeline
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import HomeButton from '../components/HomeButton'
import { ArrowLeft, Edit2, Save, X, Calendar, Zap, MapPin, Users, Package, ClipboardCheck, FileText, Shield, CreditCard, Award, Wrench, Phone, Camera, Truck, MessageSquare, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProjectDetail, updateProjectDetail, getProjectMaterials, getProjectProgress } from '../lib/projectDetailService'
import { PROJECT_STAGES, PROJECT_STATES, updateProjectState } from '../lib/projectService'
import { getProjectWithState } from '../lib/estimateService'
import { getCustomerById } from '../lib/customerService'
import { ProjectDataProvider } from '../contexts/ProjectDataContext'
import UnifiedProposalPanel from '../components/UnifiedProposalPanel'
import ProposalHistory from '../components/ProposalHistory'
import MaterialDeliveryEntry from '../components/MaterialDeliveryEntry'
import CustomerInfoBanner from '../components/CustomerInfoBanner'
import PhotoUploadSection from '../components/PhotoUploadSection'
import ProjectUpdates from '../components/ProjectUpdates'

// Phase 3 & 4: Contractor Requirement Panels
import SiteSurveyPanel from '../components/SiteSurveyPanel'
import StageChecklistPanel from '../components/StageChecklistPanel'
import FollowupPanel from '../components/FollowupPanel'
import ProjectSecurePanel from '../components/ProjectSecurePanel'
import KSEBFeasibilityPanel from '../components/KSEBFeasibilityPanel'
import KSEBEnergisationPanel from '../components/KSEBEnergisationPanel'
import CompletionCertificatePanel from '../components/CompletionCertificatePanel'
import HandoverDocumentPanel from '../components/HandoverDocumentPanel'
import WarrantyPanel from '../components/WarrantyPanel'
import ServiceRequestPanel from '../components/ServiceRequestPanel'
import PaymentWorkflowPanel from '../components/PaymentWorkflowPanel'

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [project, setProject] = useState(null)
  const [projectState, setProjectState] = useState('Estimation')
  const [photos, setPhotos] = useState([])
  const [materials, setMaterials] = useState(null)
  const [progress, setProgress] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  useEffect(() => {
    fetchProjectData()
  }, [id])

  const fetchProjectData = async () => {
    setLoading(true)
    try {
      const [detailRes, materialsRes, progressRes, projectWithState] = await Promise.all([
        getProjectDetail(id),
        getProjectMaterials(id),
        getProjectProgress(id),
        getProjectWithState(id)
      ])

      if (detailRes.success) {
        setProject(detailRes.project)
        setPhotos(detailRes.photos)
        setEditData(detailRes.project)

        // Load customer data if project has customer_id
        if (detailRes.project?.customer_id) {
          try {
            const customerData = await getCustomerById(detailRes.project.customer_id)
            if (customerData) {
              setCustomer(customerData)
            }
          } catch (err) {
            console.warn('Failed to load customer:', err)
            // Don't fail entire page load if customer fetch fails
          }
        }
      } else {
        toast.error('Failed to load project')
      }

      if (materialsRes.success) setMaterials(materialsRes)
      if (progressRes.success) setProgress(progressRes)
      if (projectWithState) {
        setProjectState(projectWithState.project_state || 'Estimation')
      }

      // Trigger ProposalHistory refresh
      setHistoryRefreshKey(k => k + 1)
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to load project details')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const result = await updateProjectDetail(id, editData)
      if (result.success) {
        setProject(result.data)
        setIsEditing(false)
        toast.success('Project updated successfully')
      } else {
        toast.error('Failed to update project')
      }
    } catch (error) {
      toast.error('Error saving project')
    }
  }

  const handleStateTransition = async (newState) => {
    try {
      const result = await updateProjectState(id, newState)
      if (result.success) {
        setProjectState(newState)
        toast.success(`Project moved to ${newState}`)
        // Refresh project data
        fetchProjectData()
      } else {
        toast.error(result.error || 'Failed to update project state')
      }
    } catch (error) {
      console.error('Error updating state:', error)
      toast.error('Error updating project state')
    }
  }

  const getStageName = (stageId) => {
    const stage = PROJECT_STAGES.find(s => s.id === parseInt(stageId))
    return stage ? stage.label : `Stage ${stageId}`
  }

  if (loading) {
    return (
      <Layout title="Project Details">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    )
  }

  if (!project) {
    return (
      <Layout title="Project Not Found">
        <div className="max-w-7xl mx-auto p-6">
          <p className="text-gray-500">Project not found</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            ← Back to Projects
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={project.name || 'Project Details'}>
      <ProjectDataProvider projectId={id}>
        <div className="max-w-7xl mx-auto">
        {/* Sleek Banner Header - Project Title */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-xl shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/projects')}
                className="flex items-center gap-2 text-blue-100 hover:text-white transition"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-2xl font-bold">{project.name}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-400 text-white">
                {project.status || 'Planning'}
              </span>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg transition"
                >
                  <Edit2 size={18} />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Customer Information Banner */}
        <CustomerInfoBanner customer={customer} />

        {/* Main Content */}
        <div className="px-6">
          <div className="grid grid-cols-3 gap-6">
          {/* Left: Project Info & Details */}
          <div className="col-span-2 space-y-6">
            {/* Project Details - Compact */}
            {isEditing && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={editData.status || 'Planning'}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option>Planning</option>
                      <option>In Progress</option>
                      <option>On Hold</option>
                      <option>Completed</option>
                      <option>Cancelled</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4 border-t">
                    <button
                      onClick={() => { setIsEditing(false); setEditData(project) }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Save size={18} />
                      Save
                    </button>
                  </div>
                </div>
            )}

            {/* Quick Info Grid */}
            {!isEditing && (
              <div className="grid grid-cols-3 gap-3">
                {project.capacity_kw && (
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <p className="text-xs text-yellow-700 font-medium mb-1">Capacity</p>
                    <p className="text-xl font-bold text-yellow-900">{project.capacity_kw} kW</p>
                  </div>
                )}
                {project.project_code && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <p className="text-xs text-green-700 font-medium mb-1">Project Code</p>
                    <p className="text-lg font-bold text-green-900">{project.project_code}</p>
                  </div>
                )}
              </div>
            )}


            {/* Photos Section */}
            {photos.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Project Photos ({photos.length})</h2>
                <div className="grid grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="aspect-square rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={photo.photo_url || photo.url}
                        alt={photo.caption || 'Project photo'}
                        className="w-full h-full object-cover hover:scale-105 transition"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Materials Section */}
            {materials && materials.materials.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Materials & Equipment</h2>
                <div className="space-y-3">
                  {materials.materials.slice(0, 10).map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{m.name}</p>
                        <p className="text-sm text-gray-500">{m.category || 'General'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{((m.quantity || 0) * (m.unit_cost || 0)).toLocaleString()}</p>
                        <p className="text-sm text-gray-500">{m.quantity} × ₹{m.unit_cost}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {materials.materials.length > 10 && (
                  <p className="text-sm text-gray-500 mt-4">
                    +{materials.materials.length - 10} more materials
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right: Summary & Progress - Compressed */}
          <div className="space-y-3">
            {/* Summary Card - Compact */}
            <div className="bg-white rounded-lg shadow p-3">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Summary</h3>
              <div className="space-y-1 text-xs">
                {project.start_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start:</span>
                    <span className="font-medium">{new Date(project.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
                {project.end_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">End:</span>
                    <span className="font-medium">{new Date(project.end_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                  </div>
                )}
                {materials && (
                  <div className="flex justify-between pt-1 border-t border-gray-200">
                    <span className="text-gray-600">Material:</span>
                    <span className="font-bold text-blue-600">₹{materials.summary.totalCost.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Card - Compact */}
            {progress && (
              <div className="bg-white rounded-lg shadow p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Progress</h3>
                <div className="space-y-1.5">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">Overall</span>
                      <span className="text-xs font-bold text-blue-600">{progress.avgProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress.avgProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Updates:</span>
                    <span className="font-bold">{progress.totalUpdates}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Project State & Workflow Panels */}
        <div className="px-6">
          <div className="mt-12 pt-8 border-t border-gray-200">
          {/* State Indicator with Transition Buttons - All in One Line */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Project Workflow</h2>
            <div className="flex items-center justify-between gap-4">
              {/* State Indicators */}
              <div className="flex items-center gap-2">
                {PROJECT_STATES.map((state, index) => (
                  <div key={state} className="flex items-center">
                    <div
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        projectState === state
                          ? 'bg-blue-500 text-white'
                          : projectState === PROJECT_STATES[index - 1] || index < PROJECT_STATES.indexOf(projectState)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {state}
                    </div>
                    {index < PROJECT_STATES.length - 1 && (
                      <div className="mx-1.5 w-6 h-0.5 bg-gray-300"></div>
                    )}
                  </div>
                ))}
              </div>

              {/* State Transition Buttons - Right Side */}
              <div className="flex gap-2 ml-auto">
                {projectState === 'Negotiation' && (
                  <button
                    onClick={() => handleStateTransition('Estimation')}
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                  >
                    ← Back
                  </button>
                )}
                {projectState === 'Execution' && (
                  <button
                    onClick={() => handleStateTransition('Negotiation')}
                    className="px-4 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
                  >
                    ← Back
                  </button>
                )}
                {projectState === 'Estimation' && (
                  <button
                    onClick={() => handleStateTransition('Negotiation')}
                    className="px-4 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium transition-colors"
                  >
                    → Next
                  </button>
                )}
                {projectState === 'Negotiation' && (
                  <button
                    onClick={() => handleStateTransition('Execution')}
                    className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                  >
                    → Next
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* IN-PAGE SECTION NAVIGATION                                  */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {id && (
            <div className="mb-8 bg-white rounded-lg shadow p-4 sticky top-0 z-10">
              <div className="flex items-center gap-2 mb-3">
                <ChevronDown className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Jump to Section</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'sec-followups', label: 'Follow-ups', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
                  { id: 'sec-site-survey', label: 'Site Survey', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                  { id: 'sec-estimation', label: 'Estimation & Proposal', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                  { id: 'sec-order-confirm', label: 'Order Confirmation', color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' },
                  { id: 'sec-payments', label: 'Payments', color: 'bg-green-50 text-green-700 hover:bg-green-100' },
                  { id: 'sec-kseb-feasibility', label: 'KSEB Feasibility', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
                  { id: 'sec-checklists', label: 'Stage Checklists', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
                  { id: 'sec-materials', label: 'Materials', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                  { id: 'sec-photos', label: 'Photos', color: 'bg-pink-50 text-pink-700 hover:bg-pink-100' },
                  { id: 'sec-daily-updates', label: 'Daily Updates', color: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100' },
                  { id: 'sec-kseb-energisation', label: 'KSEB Energisation', color: 'bg-red-50 text-red-700 hover:bg-red-100' },
                  { id: 'sec-certificate', label: 'Completion Certificate', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                  { id: 'sec-handover', label: 'Handover', color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
                  { id: 'sec-warranty', label: 'Warranty', color: 'bg-sky-50 text-sky-700 hover:bg-sky-100' },
                  { id: 'sec-service', label: 'Service Requests', color: 'bg-rose-50 text-rose-700 hover:bg-rose-100' },
                ].map(section => (
                  <button
                    key={section.id}
                    onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${section.color} border border-transparent`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* PHASE 1: PRE-SALES                                        */}
          {/* Follow-ups → Site Survey → Estimation/Proposal → Secure   */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="mb-4 mt-8">
            <h2 className="text-base font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">1</span>
              Pre-Sales
            </h2>
            <p className="text-xs text-gray-400 ml-10">Lead management, site assessment, and proposal</p>
          </div>

          {/* Follow-up Tracker */}
          {id && (
            <div id="sec-followups" className="mt-4 mb-6 bg-white rounded-lg shadow p-6 scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-orange-600" />
                Follow-up Tracker
              </h2>
              <FollowupPanel projectId={id} />
            </div>
          )}

          {/* Site Survey */}
          {id && (
            <div id="sec-site-survey" className="mt-4 mb-6 bg-white rounded-lg shadow p-6 scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Site Survey
              </h2>
              <SiteSurveyPanel projectId={id} />
            </div>
          )}

          {/* Estimation & Proposal (Unified State-Based Panel) */}
          <div id="sec-estimation" className="scroll-mt-24">
            <UnifiedProposalPanel
              state={projectState}
              projectId={id}
              project={project}
              onStateChange={(newState) => {
                handleStateTransition(newState)
              }}
            />
          </div>

          {/* Proposal History */}
          <div className="mt-4 bg-white rounded-lg shadow p-6">
            <ProposalHistory
              key={historyRefreshKey}
              projectId={id}
              project={project}
            />
          </div>

          {/* Order Confirmation / Project Security */}
          {id && (
            <div id="sec-order-confirm" className="mt-4 mb-6 bg-white rounded-lg shadow p-6 scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Order Confirmation
              </h2>
              <ProjectSecurePanel projectId={id} />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* PHASE 2: PRE-EXECUTION                                    */}
          {/* Payment (Advance) → KSEB Feasibility                      */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="mb-4 mt-10">
            <h2 className="text-base font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-bold">2</span>
              Pre-Execution
            </h2>
            <p className="text-xs text-gray-400 ml-10">Advance payment and regulatory approvals</p>
          </div>

          {/* Payment Stages */}
          {id && (
            <div id="sec-payments" className="mt-4 mb-6 bg-white rounded-lg shadow p-6 scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Payment Stages
              </h2>
              <PaymentWorkflowPanel projectId={id} totalAmount={project?.total_amount || 0} />
            </div>
          )}

          {/* KSEB Feasibility */}
          {id && (
            <div id="sec-kseb-feasibility" className="mt-4 mb-6 bg-white rounded-lg shadow p-6 scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                KSEB Feasibility Submission
              </h2>
              <KSEBFeasibilityPanel projectId={id} />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* PHASE 3: EXECUTION                                        */}
          {/* Checklists → Materials → Photos → Updates → Energisation  */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="mb-4 mt-10">
            <h2 className="text-base font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">3</span>
              Execution
            </h2>
            <p className="text-xs text-gray-400 ml-10">Construction, installation, and KSEB inspection</p>
          </div>

          {/* Construction Stage Checklists */}
          {id && (
            <div id="sec-checklists" className="mt-4 mb-6 bg-white rounded-lg shadow p-6 scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-teal-600" />
                Construction Stage Checklists
              </h2>
              <StageChecklistPanel projectId={id} currentStage={project?.stage || 1} />
            </div>
          )}

          {/* Material Delivery Entry */}
          {id && (
            <div id="sec-materials" className="mt-4 mb-6 scroll-mt-24">
              <MaterialDeliveryEntry projectId={id} />
            </div>
          )}

          {/* Photo Upload Section */}
          {id && (
            <div id="sec-photos" className="mt-4 mb-6 scroll-mt-24">
              <PhotoUploadSection projectId={id} onPhotoUploaded={fetchProjectData} />
            </div>
          )}

          {/* Daily Updates & Project Timeline */}
          {id && (
            <div id="sec-daily-updates" className="mt-4 mb-6 scroll-mt-24">
              <ProjectUpdates projectId={id} projectName={project?.name} />
            </div>
          )}

          {/* KSEB Energisation & Inspection */}
          {id && (
            <div id="sec-kseb-energisation" className="mt-4 mb-6 bg-white rounded-lg shadow p-6 scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-red-600" />
                KSEB Energisation & Inspection
              </h2>
              <KSEBEnergisationPanel projectId={id} />
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* PHASE 4: POST-COMPLETION                                  */}
          {/* Certificate → Handover → Warranty → Service Requests      */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="mb-4 mt-10">
            <h2 className="text-base font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">4</span>
              Post-Completion
            </h2>
            <p className="text-xs text-gray-400 ml-10">Certification, handover, and ongoing support</p>
          </div>

          {/* Completion Certificate */}
          {id && (
            <div id="sec-certificate" className="mt-4 mb-6 bg-white rounded-lg shadow p-6 scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                Completion Certificate
              </h2>
              <CompletionCertificatePanel projectId={id} />
            </div>
          )}

          {/* Handover Document */}
          {id && (
            <div id="sec-handover" className="mt-4 mb-6 bg-white rounded-lg shadow p-6 scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-600" />
                Handover Document
              </h2>
              <HandoverDocumentPanel projectId={id} />
            </div>
          )}

          {/* Warranty Management */}
          {id && (
            <div id="sec-warranty" className="mt-4 mb-6 bg-white rounded-lg shadow p-6 scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-sky-600" />
                Warranty Management
              </h2>
              <WarrantyPanel projectId={id} />
            </div>
          )}

          {/* Service Requests */}
          {id && (
            <div id="sec-service" className="mt-4 mb-8 bg-white rounded-lg shadow p-6 scroll-mt-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-600" />
                Service Requests
              </h2>
              <ServiceRequestPanel projectId={id} />
            </div>
          )}
          </div>
        </div>
      </div>
      </ProjectDataProvider>
    </Layout>
  )
}
