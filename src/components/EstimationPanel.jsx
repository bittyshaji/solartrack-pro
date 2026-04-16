/**
 * Estimation Panel Component - UPDATED
 * Displays stage tasks and generates professional proposals with proposal references
 * Supports multiple estimation proposals per project
 */

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, FileText, Download, Edit2, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { PROJECT_STAGES, updateProjectState, getProjectWithCustomer } from '../lib/projectService'
import { getAllStageTasksGrouped, calculateStageTotalCost, updateStageTask, updateStageTaskForProject } from '../lib/stageTaskService'
import { createEstimate } from '../lib/estimateService'
import { downloadProposalPDF } from '../lib/proposalDownloadService'
import { createProposalReference, getProposalsByProject } from '../lib/proposalReferenceService'
import ProposalSelector from './ProposalSelector'

export default function EstimationPanel({ projectId, project, onStateChange }) {
  const [stages, setStages] = useState([])
  const [expandedStage, setExpandedStage] = useState(null)
  const [selectedStages, setSelectedStages] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [estimate, setEstimate] = useState(null)
  const [proposals, setProposals] = useState([])
  const [creatingEstimate, setCreatingEstimate] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [savingTask, setSavingTask] = useState(false)
  const [proposalNumber, setProposalNumber] = useState(null)
  const [showProposalSelector, setShowProposalSelector] = useState(false)
  const [selectedProposalId, setSelectedProposalId] = useState(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [projectData, setProjectData] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load project with customer data
      const fullProjectData = await getProjectWithCustomer(projectId)
      if (fullProjectData) {
        setProjectData(fullProjectData)
      }

      // Load existing proposals for this project
      const projectProposals = await getProposalsByProject(projectId)
      setProposals(projectProposals)

      // Check if any EST proposals exist for this project
      const hasEstProposals = projectProposals.some(p => p.proposal_type === 'Estimation')

      // Load the latest EST proposal number if exists
      const latestEstProposal = projectProposals.find(p => p.proposal_type === 'Estimation')
      if (latestEstProposal) {
        setProposalNumber(latestEstProposal.proposal_number)
      }

      // Load ALL stages and tasks in a SINGLE BATCHED query for optimal performance
      // This replaces the parallelized individual queries with one efficient batch load
      const groupedTasks = await getAllStageTasksGrouped(projectId)

      const stagesData = PROJECT_STAGES.map(stage => {
        let taskList = groupedTasks[stage.id] || []

        // ONLY reset quantities to 0 on INITIAL LOAD of a NEW project
        if (isInitialLoad && !hasEstProposals && taskList.length > 0) {
          taskList = taskList.map(task => ({
            ...task,
            quantity: 0
          }))
          setIsInitialLoad(false)
        }

        return {
          ...stage,
          tasks: taskList,
          total: calculateStageTotalCost(taskList)
        }
      })

      setStages(stagesData)
    } catch (err) {
      console.error('Error loading data:', err)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const toggleStageSelection = (stageId) => {
    const newSelected = new Set(selectedStages)
    if (newSelected.has(stageId)) {
      newSelected.delete(stageId)
    } else {
      newSelected.add(stageId)
    }
    setSelectedStages(newSelected)
  }

  const calculateTotal = () => {
    return Array.from(selectedStages).reduce((sum, stageId) => {
      const stage = stages.find(s => s.id === stageId)
      return sum + (stage?.total || 0)
    }, 0)
  }

  const handleEditTask = (task) => {
    setEditingTask(task.id)
    setEditValues({
      quantity: task.quantity,
      unit_cost: task.unit_cost
    })
  }

  const handleSaveTask = async (task) => {
    setSavingTask(true)
    try {
      // Use project-aware update that handles legacy task conversion
      const result = await updateStageTaskForProject(task.id, editValues, projectId)
      if (result.success) {
        toast.success('Task updated successfully')
        await loadData()
        setEditingTask(null)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error saving task:', err)
      toast.error('Failed to save task')
    } finally {
      setSavingTask(false)
    }
  }

  const handleGenerateProposal = async () => {
    // AUTO-SELECT stages that have tasks with quantity > 0
    // (only tasks with quantity > 0 go in the proposal)
    const stagesWithValidTasks = stages.filter(stage =>
      stage.tasks && stage.tasks.some(t => t.quantity > 0)
    )

    if (stagesWithValidTasks.length === 0) {
      toast.error('Please add tasks with quantity > 0 to at least one stage')
      return
    }

    if (!projectData?.customer?.customer_id) {
      toast.error('Customer information not available. Please ensure project is linked to a customer.')
      return
    }

    const stagesWithTasksArray = stagesWithValidTasks.map(stage => stage.id)

    setCreatingEstimate(true)
    try {
      // Step 1: Create proposal reference with unique number
      const proposalRefResult = await createProposalReference(projectId, 'Estimation')
      if (!proposalRefResult.success) {
        throw new Error('Failed to create proposal reference')
      }

      const proposalRef = proposalRefResult.data
      setProposalNumber(proposalRef.proposal_number)

      // Step 2: Create estimate with proposal reference and auto-selected stages
      // Only include tasks with quantity > 0 in the grand total
      const grandTotal = stagesWithValidTasks.reduce((sum, stage) => {
        const validTasks = stage.tasks.filter(t => t.quantity > 0)
        const stageTotal = validTasks.reduce((s, task) => s + (task.quantity * task.unit_cost), 0)
        return sum + stageTotal
      }, 0)

      const estimateResult = await createEstimate(
        projectId,
        'Estimation',
        grandTotal,
        `Proposal ${proposalRef.proposal_number} for ${project?.name || 'Solar Project'}`,
        proposalRef.id,
        JSON.stringify(stagesWithTasksArray),
        '', // createdBy
        projectData.customer.name, // customerName (from linked customer)
        projectData.customer.phone, // customerPhone (from linked customer)
        projectData.customer.customer_id // customerId (from linked customer)
      )

      if (estimateResult.success) {
        setEstimate(estimateResult.data)
        toast.success(`✅ Proposal ${proposalRef.proposal_number} generated successfully!`)

        // Reload proposals list
        await loadData()
      } else {
        throw new Error(estimateResult.error)
      }
    } catch (err) {
      console.error('Error generating proposal:', err)
      toast.error('Failed to generate proposal')
      setProposalNumber(null)
    } finally {
      setCreatingEstimate(false)
    }
  }

  const handleDownloadProposal = () => {
    try {
      if (!proposalNumber) {
        toast.error('Generate proposal first before downloading')
        return
      }

      // Use stages with tasks that have quantity > 0
      const stagesWithValidTasks = stages.filter(stage =>
        stage.tasks && stage.tasks.some(t => t.quantity > 0)
      )
      const stageIds = stagesWithValidTasks.map(s => s.id)

      // Calculate grand total including only tasks with quantity > 0
      const grandTotal = stagesWithValidTasks.reduce((sum, stage) => {
        const validTasks = stage.tasks.filter(t => t.quantity > 0)
        const stageTotal = validTasks.reduce((s, task) => s + (task.quantity * task.unit_cost), 0)
        return sum + stageTotal
      }, 0)

      const success = downloadProposalPDF(
        {
          ...project,
          proposal_number: proposalNumber,
          customer_name: projectData?.customer?.name || '',
          customer_phone: projectData?.customer?.phone || ''
        },
        stageIds,
        stagesWithValidTasks,
        grandTotal
      )

      if (success) {
        toast.success('Proposal downloaded successfully!')
      } else {
        toast.error('Failed to download proposal')
      }
    } catch (err) {
      console.error('Error downloading proposal:', err)
      toast.error('Failed to download proposal')
    }
  }

  const handleMoveToNegotiationClick = () => {
    // Get all EST proposals
    const estProposals = proposals.filter(p => p.proposal_type === 'Estimation')

    if (estProposals.length === 0) {
      toast.error('Create an Estimation proposal first')
      return
    }

    if (estProposals.length === 1) {
      // Only one proposal, use it directly
      handleMoveToNegotiation(estProposals[0].id)
    } else {
      // Multiple proposals, show selector
      setSelectedProposalId(estProposals[0].id) // Default to first
      setShowProposalSelector(true)
    }
  }

  const handleMoveToNegotiation = async (selectedEstId) => {
    setCreatingEstimate(true)
    try {
      // Update project state to Negotiation
      const result = await updateProjectState(projectId, 'Negotiation')
      if (result.success) {
        toast.success('Moved to Negotiation phase! ✅')
        setShowProposalSelector(false)
        onStateChange?.('Negotiation')
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error moving to negotiation:', err)
      toast.error('Failed to move to negotiation')
    } finally {
      setCreatingEstimate(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading estimation data...</div>
  }

  return (
    <div className="space-y-6">
      {/* ─── ESTIMATION HEADER ─── */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">📋 Create Professional Proposal</h3>
        {proposalNumber && (
          <div className="text-sm text-blue-700 mb-2">
            <strong>Current Proposal:</strong> {proposalNumber}
          </div>
        )}
        <p className="text-sm text-blue-700">Select stages below and generate a professional proposal for this project</p>
      </div>

      {/* ─── PROPOSAL HISTORY ─── */}
      {proposals.filter(p => p.proposal_type === 'Estimation').length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Previous Estimations</h4>
          <div className="space-y-2">
            {proposals.filter(p => p.proposal_type === 'Estimation').map(prop => (
              <div key={prop.id} className="text-sm text-gray-600 p-2 bg-white rounded border border-gray-100">
                <strong>{prop.proposal_number}</strong> - Created {new Date(prop.created_at).toLocaleDateString('en-IN')}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── CUSTOMER INFORMATION (DISPLAY ONLY) ─── */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👤</span>
          <h4 className="font-bold text-gray-900 text-lg">Customer Information</h4>
        </div>
        {projectData?.customer ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Customer Name</p>
              <p className="text-sm font-medium text-gray-900">{projectData.customer.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Contact Number</p>
              <p className="text-sm font-medium text-gray-900">{projectData.customer.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Email</p>
              <p className="text-sm font-medium text-gray-900">{projectData.customer.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Company</p>
              <p className="text-sm font-medium text-gray-900">{projectData.customer.company || 'N/A'}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-600">⚠️ No customer linked to this project</p>
        )}
      </div>

      {/* ─── STAGES VIEW ─── */}
      <div className="space-y-3">
        {stages.map(stage => (
          <div key={stage.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Stage Header - Click to expand/collapse */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{stage.name}</h4>
                <p className="text-sm text-gray-600">{stage.tasks?.length || 0} tasks</p>
              </div>
              <span className="text-lg font-bold text-gray-900">₹{stage.total.toLocaleString('en-IN')}</span>
              {expandedStage === stage.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {/* Stage Tasks */}
            {expandedStage === stage.id && (
              <div className="p-4 bg-white space-y-3 border-t border-gray-200">
                {stage.tasks && stage.tasks.length > 0 ? (
                  stage.tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{task.task_name}</p>
                        <p className="text-sm text-gray-600">{task.description || 'No description'}</p>
                      </div>

                      {editingTask === task.id ? (
                        <div className="flex items-center gap-2 ml-4">
                          <input
                            type="number"
                            value={editValues.quantity}
                            onChange={e => {
                              const val = parseFloat(e.target.value)
                              setEditValues({ ...editValues, quantity: val < 0 ? 0 : val })
                            }}
                            min="0"
                            className="w-16 px-2 py-1 border rounded text-sm"
                            placeholder="Qty"
                          />
                          <input
                            type="number"
                            value={editValues.unit_cost}
                            onChange={e => {
                              const val = parseFloat(e.target.value)
                              setEditValues({ ...editValues, unit_cost: val < 0 ? 0 : val })
                            }}
                            min="0"
                            className="w-20 px-2 py-1 border rounded text-sm"
                            placeholder="Cost"
                          />
                          <button
                            onClick={() => handleSaveTask(task)}
                            disabled={savingTask}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Save size={18} />
                          </button>
                          <button onClick={() => setEditingTask(null)} className="text-gray-500 hover:text-gray-700">
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 ml-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{task.quantity} × ₹{task.unit_cost.toLocaleString('en-IN')}</p>
                            <p className="font-semibold text-gray-900">₹{(task.quantity * task.unit_cost).toLocaleString('en-IN')}</p>
                          </div>
                          <button onClick={() => handleEditTask(task)} className="text-blue-600 hover:text-blue-700">
                            <Edit2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No tasks defined for this stage</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── SUMMARY & ACTIONS (STICKY) ─── */}
      <div className="sticky bottom-0 left-0 right-0 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4 shadow-lg z-10">
        <div>
          <p className="text-sm text-gray-600">
            {(() => {
              const stagesWithValidTasks = stages.filter(s => s.tasks?.some(t => t.quantity > 0))
              return `Stages with Tasks (qty > 0): ${stagesWithValidTasks.length}`
            })()}
          </p>
          <p className="text-2xl font-bold text-gray-900">
            Estimated Total: ₹{(() => {
              const stagesWithValidTasks = stages.filter(s => s.tasks?.some(t => t.quantity > 0))
              return stagesWithValidTasks.reduce((sum, s) => sum + s.tasks.filter(t => t.quantity > 0).reduce((st, t) => st + (t.quantity * t.unit_cost), 0), 0).toLocaleString('en-IN')
            })()}
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleGenerateProposal}
            disabled={creatingEstimate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <FileText size={18} />
            {creatingEstimate ? 'Generating...' : 'Generate Proposal'}
          </button>

          <button
            onClick={handleDownloadProposal}
            disabled={!proposalNumber}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download size={18} />
            Download PDF
          </button>

          <button
            onClick={handleMoveToNegotiationClick}
            disabled={proposals.filter(p => p.proposal_type === 'Estimation').length === 0 || creatingEstimate}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            Move to Negotiation →
          </button>
        </div>

        {proposalNumber && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            ✅ Proposal {proposalNumber} generated and ready for negotiation
          </div>
        )}
      </div>

      {/* Proposal Selector Modal */}
      <ProposalSelector
        isOpen={showProposalSelector}
        proposals={proposals.filter(p => p.proposal_type === 'Estimation')}
        currentState="Estimation"
        targetState="Negotiation"
        selectedId={selectedProposalId}
        onSelect={(proposalId) => {
          setSelectedProposalId(proposalId)
          handleMoveToNegotiation(proposalId)
        }}
        onCancel={() => {
          setShowProposalSelector(false)
          setSelectedProposalId(null)
        }}
      />
    </div>
  )
}
