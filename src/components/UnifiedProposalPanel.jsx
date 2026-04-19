/**
 * Unified Proposal Panel Component
 * Consolidates EstimationPanel, NegotiationPanel, and ExecutionPanel
 * Single component that handles all three project states: Estimation, Negotiation, Execution
 *
 * Reduces code from 1,500 lines (3 files) to ~800 lines (1 file)
 * Improves maintainability, consistency, and performance
 */

import { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Edit2,
  Save,
  X,
  Plus,
  CheckCircle,
  Link2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useProjectDataCache } from '../contexts/ProjectDataContext'
import { PROJECT_STAGES, getProjectWithCustomer } from '../lib/projectService'
import {
  getAllStageTasksGrouped,
  calculateStageTotalCost,
  updateStageTask,
  updateStageTaskForProject,
  createStageTask,
  deleteStageTask,
} from '../lib/stageTaskService'
import { createEstimate, getLatestEstimate } from '../lib/estimateService'
import { downloadProposalPDF } from '../lib/proposalDownloadService'
import { createProposalReference, getProposalsByProject } from '../lib/proposalReferenceService'
import { loadParentProposalData } from '../lib/proposalDataService'
import { createInvoice, getProjectInvoices, updateInvoicePayment } from '../lib/invoiceService'
import { downloadInvoicePDF } from '../lib/invoiceDownloadService'
import ProposalSelector from './ProposalSelector'

// Configuration objects for each state
const STATE_CONFIG = {
  estimation: {
    label: 'Estimation',
    proposalType: 'Estimation',
    color: 'blue',
    bgGradient: 'from-blue-50 to-blue-100',
    borderColor: 'border-blue-200',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    allowTaskCreation: false,
    allowTaskDeletion: false,
    allowTaskModification: true,
    showProposalSelector: true,
    showInvoices: false,
  },
  negotiation: {
    label: 'Negotiation',
    proposalType: 'Negotiation',
    color: 'orange',
    bgGradient: 'from-orange-50 to-orange-100',
    borderColor: 'border-orange-200',
    buttonColor: 'bg-orange-600 hover:bg-orange-700',
    allowTaskCreation: true,
    allowTaskDeletion: true,
    allowTaskModification: true,
    showProposalSelector: true,
    showInvoices: false,
  },
  execution: {
    label: 'Execution',
    proposalType: 'Execution',
    color: 'green',
    bgGradient: 'from-green-50 to-green-100',
    borderColor: 'border-green-200',
    buttonColor: 'bg-green-600 hover:bg-green-700',
    allowTaskCreation: true,
    allowTaskDeletion: false,
    allowTaskModification: true,
    showProposalSelector: true,
    showInvoices: true,
  },
}

export default function UnifiedProposalPanel({ projectId, project, state = 'estimation', onStateChange }) {
  // Get cache context
  const { getOrFetchData, invalidateCache, invalidateCaches } = useProjectDataCache()

  // Normalize state to lowercase
  const normalizedState = state.toLowerCase()
  const config = STATE_CONFIG[normalizedState]

  // ============ SHARED STATE ============
  const [stages, setStages] = useState([])
  const [expandedStage, setExpandedStage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [projectData, setProjectData] = useState(null)
  const [proposals, setProposals] = useState([])
  const [proposalNumber, setProposalNumber] = useState(null)

  // Task editing
  const [editingTask, setEditingTask] = useState(null)
  const [editValues, setEditValues] = useState({})

  // State-specific state
  const [selectedStages, setSelectedStages] = useState(new Set()) // EST only
  const [isInitialLoad, setIsInitialLoad] = useState(true) // EST only
  const [creatingProposal, setCreatingProposal] = useState(false) // All states
  const [showProposalSelector, setShowProposalSelector] = useState(false) // All states
  const [selectedProposalId, setSelectedProposalId] = useState(null) // All states

  // NEG & EXE specific
  const [parentProposal, setParentProposal] = useState(null)
  const [newTaskStage, setNewTaskStage] = useState(null)
  const [newTask, setNewTask] = useState({ task_name: '', quantity: 1, unit_cost: 0, description: '' })
  const [error, setError] = useState(null)
  const [latestEstimate, setLatestEstimate] = useState(null)

  // EXE only
  const [invoices, setInvoices] = useState([])
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [executionProposalId, setExecutionProposalId] = useState(null)

  // ============ DATA LOADING ============
  useEffect(() => {
    loadData()
  }, [normalizedState, projectId])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load common data with caching
      const [fullProjectData, groupedTasks, allProposalsData] = await Promise.all([
        getOrFetchData(`projectWithCustomer_${projectId}`, () => getProjectWithCustomer(projectId)),
        getOrFetchData(`stageTasks_${projectId}`, () => getAllStageTasksGrouped(projectId)),
        getOrFetchData(`proposals_${projectId}`, () => getProposalsByProject(projectId)),
      ])

      setProjectData(fullProjectData)
      setProposals(allProposalsData || [])

      // Load state-specific data
      if (normalizedState !== 'estimation') {
        const parentData = await getOrFetchData(
          `parentProposal_${projectId}_${config.proposalType}`,
          () => loadParentProposalData(projectId, config.proposalType)
        )
        setParentProposal(parentData.parentProposal)
      }

      if (normalizedState === 'execution') {
        try {
          const [invoicesData, estimateData] = await Promise.all([
            getOrFetchData(`invoices_${projectId}`, () => getProjectInvoices(projectId)),
            getOrFetchData(`estimate_${projectId}`, () => getLatestEstimate(projectId)),
          ])
          setInvoices(invoicesData)
          setLatestEstimate(estimateData)
        } catch (err) {
          console.warn('Invoice fetch failed:', err)
          // Continue without invoices
          const estimateData = await getOrFetchData(`estimate_${projectId}`, () => getLatestEstimate(projectId))
          setLatestEstimate(estimateData)
        }
      } else if (normalizedState === 'negotiation') {
        const estimateData = await getOrFetchData(`estimate_${projectId}`, () => getLatestEstimate(projectId))
        setLatestEstimate(estimateData)
      }

      // Set proposal number
      const latestProposal = (allProposalsData || []).find(p => p.proposal_type === config.proposalType)
      if (latestProposal) {
        setProposalNumber(latestProposal.proposal_number)
        if (normalizedState === 'execution') {
          setExecutionProposalId(latestProposal.id)
        }
      } else if (parentProposal?.proposal_number) {
        setProposalNumber(parentProposal.proposal_number)
        if (normalizedState === 'execution') {
          setExecutionProposalId(parentProposal.id)
        }
      }

      // Load stages
      const hasProposalsOfType = (allProposalsData || []).some(p => p.proposal_type === config.proposalType)

      // Check if we should reset quantities on initial load (EST only, no proposals yet)
      const shouldResetQty = normalizedState === 'estimation' && isInitialLoad && !hasProposalsOfType

      const stagesData = PROJECT_STAGES.map(stage => {
        let taskList = groupedTasks[stage.id] || []

        console.log(`[loadData] Stage ${stage.id} (${stage.name}): ${taskList.length} tasks, shouldResetQty: ${shouldResetQty}`)
        if (taskList.length > 0) {
          console.log(`[loadData]   Tasks:`, taskList.map(t => ({ id: t.id, name: t.task_name, qty: t.quantity })))
        }

        // EST only: reset quantities to 0 on initial load of new project
        if (shouldResetQty && taskList.length > 0) {
          console.log(`[loadData] Resetting quantities to 0 for stage ${stage.id}`)
          taskList = taskList.map(task => ({
            ...task,
            quantity: 0,
          }))
        }

        return {
          ...stage,
          tasks: taskList,
          total: calculateStageTotalCost(taskList),
          isFromParent: (taskList?.length || 0) > 0,
        }
      })

      // Set isInitialLoad to false AFTER building stages, not inside the map
      if (shouldResetQty) {
        console.log('[loadData] Setting isInitialLoad to false after reset')
        setIsInitialLoad(false)
      }

      console.log('[loadData] All stages loaded:', stagesData.length)
      setStages(stagesData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load data')
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // ============ SHARED HANDLERS ============
  const toggleStage = (stageId) => {
    setExpandedStage(expandedStage === stageId ? null : stageId)
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

  const calculateStageTotal = (tasks) => {
    return tasks.reduce((sum, task) => sum + (task.quantity * task.unit_cost), 0)
  }

  const calculateGrandTotal = () => {
    return stages.reduce((sum, stage) => sum + calculateStageTotal(stage.tasks), 0)
  }

  const getStageIdsForDownload = () => {
    // Download stages that have tasks with quantity > 0
    // This applies to all states (EST, NEG, EXE) to ensure PDF matches what was in the proposal
    return stages
      .filter(s => s.tasks && s.tasks.some(t => t.quantity > 0))
      .map(s => s.id)
  }

  const handleEditTask = (task) => {
    setEditingTask(task.id)
    setEditValues({
      quantity: task.quantity,
      unit_cost: task.unit_cost,
      description: task.description,
    })
  }

  const handleSaveTask = async (task) => {
    setSaving(true)
    try {
      // Validate inputs before saving
      const quantity = parseInt(editValues.quantity, 10)
      const unit_cost = parseFloat(editValues.unit_cost)

      if (isNaN(quantity) || isNaN(unit_cost)) {
        toast.error('Please enter valid quantity and cost values')
        return
      }

      if (quantity < 0 || unit_cost < 0) {
        toast.error('Quantity and cost must be 0 or greater')
        return
      }

      if (!Number.isInteger(quantity)) {
        toast.error('Quantity must be a whole number')
        return
      }

      // Update with validated values
      const validatedValues = {
        quantity,
        unit_cost,
        description: editValues.description || ''
      }

      console.log('Saving task:', task.id, 'with values:', validatedValues)
      const result = await updateStageTaskForProject(task.id, validatedValues, projectId)
      console.log('Update result:', result)

      if (result.success) {
        console.log('Clearing edit state and reloading data')
        // Reload data FIRST
        invalidateCache(`stageTasks_${projectId}`)
        await loadData()
        // Then clear editing state
        setEditingTask(null)
        setEditValues({})
        toast.success('Task updated successfully')
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Error saving task:', err)
      toast.error('Failed to save task: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAddTask = async (stageId) => {
    if (!newTask.task_name) {
      toast.error('Please enter task name')
      return
    }

    setSaving(true)
    try {
      const result = await createStageTask({
        stage_id: stageId,
        project_id: projectId,
        ...newTask,
      })
      if (result.success) {
        toast.success('Task added successfully')
        // Invalidate stage tasks cache
        invalidateCache(`stageTasks_${projectId}`)
        await loadData()
        setNewTask({ task_name: '', quantity: 1, unit_cost: 0, description: '' })
        setNewTaskStage(null)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error adding task:', err)
      toast.error('Failed to add task')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    setSaving(true)
    try {
      const result = await deleteStageTask(taskId)
      if (result.success) {
        toast.success('Task deleted successfully')
        // Invalidate stage tasks cache
        invalidateCache(`stageTasks_${projectId}`)
        await loadData()
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error deleting task:', err)
      toast.error('Failed to delete task')
    } finally {
      setSaving(false)
    }
  }

  // ============ STATE-SPECIFIC HANDLERS ============
  const handleCreateProposal = async () => {
    if (normalizedState === 'estimation') {
      await handleCreateEstimationProposal()
    } else if (normalizedState === 'negotiation') {
      await handleCreateNegotiationProposal()
    } else if (normalizedState === 'execution') {
      await handleCreateExecutionProposal()
    }
  }

  const handleCreateEstimationProposal = async () => {
    const stagesWithValidTasks = stages.filter(stage =>
      stage.tasks && stage.tasks.some(t => t.quantity > 0)
    )

    if (stagesWithValidTasks.length === 0) {
      toast.error('Please add tasks with quantity > 0 to at least one stage')
      return
    }

    if (!projectData?.customer?.customer_id) {
      toast.error('Customer information not available')
      return
    }

    const stagesWithTasksArray = stagesWithValidTasks.map(stage => stage.id)

    setCreatingProposal(true)
    try {
      const proposalRefResult = await createProposalReference(projectId, 'Estimation')
      if (!proposalRefResult.success) {
        throw new Error('Failed to create proposal reference')
      }

      const proposalRef = proposalRefResult.data
      setProposalNumber(proposalRef.proposal_number)

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
        '',
        projectData.customer.name,
        projectData.customer.phone,
        projectData.customer.customer_id
      )

      if (estimateResult.success) {
        toast.success(`✅ Proposal ${proposalRef.proposal_number} generated successfully!`)
        // Invalidate proposals cache since a new proposal was created
        invalidateCache(`proposals_${projectId}`)
        await loadData()
      } else {
        throw new Error(estimateResult.error)
      }
    } catch (err) {
      console.error('Error generating proposal:', err)
      toast.error('Failed to generate proposal')
      setProposalNumber(null)
    } finally {
      setCreatingProposal(false)
    }
  }

  const handleCreateNegotiationProposal = async () => {
    if (!projectData?.customer?.customer_id) {
      toast.error('Customer information not available')
      return
    }

    setCreatingProposal(true)
    try {
      const grandTotal = calculateGrandTotal()

      const proposalRefResult = await createProposalReference(projectId, 'Negotiation')
      if (!proposalRefResult.success) {
        throw new Error('Failed to create proposal reference')
      }

      const proposalRef = proposalRefResult.data

      const result = await createEstimate(
        projectId,
        'Negotiation',
        grandTotal,
        `Negotiated proposal ${proposalRef.proposal_number} for ${project?.name || 'Solar Project'}`,
        proposalRef.id,
        JSON.stringify([]),
        '',
        projectData.customer.name,
        projectData.customer.phone,
        projectData.customer.customer_id
      )

      if (result.success) {
        toast.success(`✅ Negotiation proposal ${proposalRef.proposal_number} created!`)
        setProposalNumber(proposalRef.proposal_number)
        // Invalidate proposals cache
        invalidateCache(`proposals_${projectId}`)
        await loadData()
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error creating negotiation proposal:', err)
      toast.error('Failed to create negotiation proposal')
    } finally {
      setCreatingProposal(false)
    }
  }

  const handleCreateExecutionProposal = async () => {
    if (!projectData?.customer?.customer_id) {
      toast.error('Customer information not available')
      return
    }

    setCreatingProposal(true)
    try {
      const grandTotal = calculateGrandTotal()

      const proposalRefResult = await createProposalReference(projectId, 'Execution')
      if (!proposalRefResult.success) {
        throw new Error('Failed to create proposal reference')
      }

      const proposalRef = proposalRefResult.data

      const result = await createEstimate(
        projectId,
        'Execution',
        grandTotal,
        `Execution proposal ${proposalRef.proposal_number} for ${project?.name || 'Solar Project'}`,
        proposalRef.id,
        JSON.stringify([]),
        '',
        projectData.customer.name,
        projectData.customer.phone,
        projectData.customer.customer_id
      )

      if (result.success) {
        toast.success(`✅ Execution proposal ${proposalRef.proposal_number} created!`)
        setProposalNumber(proposalRef.proposal_number)
        setExecutionProposalId(proposalRef.id)
        // Invalidate proposals cache
        invalidateCache(`proposals_${projectId}`)
        await loadData()
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error creating execution proposal:', err)
      toast.error('Failed to create execution proposal')
    } finally {
      setCreatingProposal(false)
    }
  }

  const handleGenerateInvoice = async () => {
    if (!executionProposalId) {
      toast.error('Please create an execution proposal first')
      return
    }

    setSaving(true)
    try {
      const grandTotal = calculateGrandTotal()
      const result = await createInvoice(projectId, executionProposalId, grandTotal)

      if (result.success) {
        toast.success('Invoice generated successfully!')
        // Invalidate invoices cache
        invalidateCache(`invoices_${projectId}`)
        await loadData()
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error generating invoice:', err)
      toast.error('Failed to generate invoice')
    } finally {
      setSaving(false)
    }
  }

  // ============ RENDER ============
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Customer Info */}
      {projectData?.customer && (
        <div className={`p-4 rounded-lg bg-gradient-to-r ${config.bgGradient} border ${config.borderColor}`}>
          <h3 className="font-semibold text-gray-900 mb-2">📋 Customer Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Name:</span>
              <p className="font-medium">{projectData.customer.name}</p>
            </div>
            <div>
              <span className="text-gray-600">Phone:</span>
              <p className="font-medium">{projectData.customer.phone || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <p className="font-medium">{projectData.customer.email || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-600">Company:</span>
              <p className="font-medium">{projectData.customer.company || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Proposal Number Display */}
      {proposalNumber && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-gray-700">
            Current Proposal: <span className="text-blue-700 font-bold">{proposalNumber}</span>
          </p>
        </div>
      )}

      {/* Stages */}
      <div className="space-y-3">
        {stages.map(stage => (
          <div key={stage.id} className="border rounded-lg overflow-hidden bg-white">
            {/* Stage Header */}
            <button
              onClick={() => toggleStage(stage.id)}
              className={`w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r ${config.bgGradient} border-b`}
            >
              <div className="flex items-center gap-3">
                {normalizedState === 'estimation' && (
                  <input
                    type="checkbox"
                    checked={selectedStages.has(stage.id)}
                    onChange={() => toggleStageSelection(stage.id)}
                    className="w-5 h-5 cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  />
                )}
                <span className="font-semibold text-gray-900">
                  {stage.name} ({stage.tasks?.length || 0} tasks)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  ${stage.total?.toFixed(2) || '0.00'}
                </span>
                {expandedStage === stage.id ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </button>

            {/* Stage Tasks */}
            {expandedStage === stage.id && (
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {/* Tasks List */}
                {stage.tasks?.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                    {editingTask === task.id ? (
                      <>
                        <input
                          type="number"
                          value={editValues.quantity || ''}
                          onChange={e => setEditValues({ ...editValues, quantity: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
                          placeholder="Qty"
                          className="w-20 px-2 py-1 border rounded text-sm"
                          min="0"
                          step="1"
                        />
                        <input
                          type="number"
                          value={editValues.unit_cost || ''}
                          onChange={e => setEditValues({ ...editValues, unit_cost: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                          placeholder="Cost"
                          className="w-24 px-2 py-1 border rounded text-sm"
                          min="0"
                          step="0.01"
                        />
                        <button
                          onClick={() => handleSaveTask(task)}
                          disabled={saving}
                          className="px-2 py-1 bg-green-600 text-white rounded text-sm disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingTask(null)
                            setEditValues({})
                          }}
                          disabled={saving}
                          className="px-2 py-1 bg-gray-400 text-white rounded text-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{task.task_name}</p>
                          <p className="text-xs text-gray-600">{task.description || 'No description'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            {task.quantity} × ${task.unit_cost?.toFixed(2) || '0.00'} = ${(task.quantity * (task.unit_cost || 0)).toFixed(2)}
                          </p>
                        </div>
                        {config.allowTaskModification && (
                          <>
                            <button
                              onClick={() => handleEditTask(task)}
                              className="ml-2 px-2 py-1 text-orange-600 hover:bg-orange-50 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {config.allowTaskDeletion && (
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {/* Add Task Button (NEG & EXE) */}
                {config.allowTaskCreation && (
                  <>
                    {newTaskStage === stage.id ? (
                      <div className="p-3 bg-blue-50 rounded border border-blue-200 space-y-2">
                        <input
                          type="text"
                          placeholder="Task name"
                          value={newTask.task_name}
                          onChange={e => setNewTask({ ...newTask, task_name: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm"
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={newTask.quantity}
                            onChange={e => setNewTask({ ...newTask, quantity: parseFloat(e.target.value) })}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Cost"
                            value={newTask.unit_cost}
                            onChange={e => setNewTask({ ...newTask, unit_cost: parseFloat(e.target.value) })}
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAddTask(stage.id)}
                            disabled={saving}
                            className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setNewTaskStage(null)}
                            className="flex-1 px-2 py-1 bg-gray-400 text-white rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setNewTaskStage(stage.id)}
                        className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded hover:border-blue-500 hover:text-blue-600 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" /> Add Task
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Grand Total */}
      <div className="p-4 bg-gray-900 text-white rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">Grand Total:</span>
          <span className="text-2xl font-bold">${calculateGrandTotal().toFixed(2)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {normalizedState === 'estimation' && (
          <>
            <button
              onClick={handleCreateProposal}
              disabled={creatingProposal}
              className={`flex-1 px-4 py-2 ${config.buttonColor} text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {creatingProposal ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" /> Generate Proposal
                </>
              )}
            </button>
            {proposalNumber && (
              <button
                onClick={() => downloadProposalPDF(projectData, getStageIdsForDownload(), stages, calculateGrandTotal())}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            )}
            {Object.keys(selectedStages).length > 0 && (
              <button
                onClick={() => onStateChange?.('Negotiation')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Move to Negotiation →
              </button>
            )}
          </>
        )}

        {normalizedState === 'negotiation' && (
          <>
            <button
              onClick={handleCreateProposal}
              disabled={creatingProposal}
              className={`flex-1 px-4 py-2 ${config.buttonColor} text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {creatingProposal ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" /> Create Negotiation Proposal
                </>
              )}
            </button>
            {proposalNumber && (
              <button
                onClick={() => downloadProposalPDF(projectData, getStageIdsForDownload(), stages, calculateGrandTotal())}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            )}
            <button
              onClick={() => onStateChange?.('Execution')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Move to Execution →
            </button>
          </>
        )}

        {normalizedState === 'execution' && (
          <>
            <button
              onClick={handleCreateProposal}
              disabled={creatingProposal}
              className={`flex-1 px-4 py-2 ${config.buttonColor} text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              {creatingProposal ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" /> Create Execution Proposal
                </>
              )}
            </button>
            {proposalNumber && (
              <button
                onClick={() => downloadProposalPDF(projectData, getStageIdsForDownload(), stages, calculateGrandTotal())}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            )}
          </>
        )}

        {/* INVOICE SECTION - EXE ONLY */}
        {normalizedState === 'execution' && (
          <div className="p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
            <h3 className="font-bold text-gray-900 mb-3 text-lg">💵 GENERATE INVOICE</h3>
            <p className="text-sm text-gray-600 mb-3">Select an Execution Proposal to link with the invoice</p>

            {proposals.filter(p => p.proposal_type === 'Execution').length === 0 ? (
              <div className="p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm">
                ⚠️ No Execution proposals found. Please create an Execution proposal first.
              </div>
            ) : (
              <div className="flex gap-3 items-center">
                <label className="font-semibold text-gray-700 min-w-fit">Select Proposal:</label>
                <select
                  value={executionProposalId || ''}
                  onChange={(e) => setExecutionProposalId(e.target.value)}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="">-- Choose EXE Proposal --</option>
                  {proposals
                    .filter(p => p.proposal_type === 'Execution')
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {p.proposal_number}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleGenerateInvoice}
                  disabled={saving || !executionProposalId}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      ✓ Create Invoice
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Invoices Section (EXE only) */}
      {normalizedState === 'execution' && invoices.length > 0 && (
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-gray-900 mb-3">💵 Invoices</h3>
          {invoices.map(invoice => (
            <div key={invoice.id} className="p-3 bg-white rounded border mb-2 flex justify-between items-center">
              <div>
                <p className="font-medium">{invoice.invoice_number || `Invoice ${invoice.id}`}</p>
                <p className="text-sm text-gray-600">
                  {invoice.proposal_id && (
                    <>
                      Linked to: {proposals.find(p => p.id === invoice.proposal_id)?.proposal_number || 'N/A'} |
                    </>
                  )}
                  Amount: ₹{invoice.total_amount?.toLocaleString('en-IN') || '0'} | Paid: ₹{invoice.paid_amount?.toLocaleString('en-IN') || '0'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadInvoicePDF(invoice, projectData, projectData?.customer, stages)}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download
                </button>
                <button
                  onClick={() => setSelectedInvoice(invoice)}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                >
                  Record Payment
                </button>
              </div>
            </div>
          ))}

          {selectedInvoice && (
            <div className="mt-4 p-4 bg-white rounded border border-purple-200">
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Payment amount"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border rounded"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // Handle payment recording (would need to implement)
                      setSelectedInvoice(null)
                      setPaymentAmount(0)
                    }}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Record Payment
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="flex-1 px-3 py-2 bg-gray-400 text-white rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
