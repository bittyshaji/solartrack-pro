/**
 * Negotiation Panel Component
 * Allows modification of tasks and costs during negotiation phase
 * For projects in "Negotiation" state
 * Supports PDF download and multiple proposal versions
 */

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Edit2, Save, X, Plus, Download, FileText, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { PROJECT_STAGES, updateProjectState, getProjectWithCustomer } from '../lib/projectService'
import { getStageTasksByStage, updateStageTask, updateStageTaskForProject, createStageTask, deleteStageTask, getAllStageTasksGrouped } from '../lib/stageTaskService'
import { createEstimate, getLatestEstimate } from '../lib/estimateService'
import { downloadProposalPDF } from '../lib/proposalDownloadService'
import { createProposalReference, getProposalsByProject } from '../lib/proposalReferenceService'
import { loadParentProposalData } from '../lib/proposalDataService'
import ProposalSelector from './ProposalSelector'

export default function NegotiationPanel({ projectId, project, onStateChange }) {
  const [stages, setStages] = useState([])
  const [expandedStage, setExpandedStage] = useState(null)
  const [editingTask, setEditingTask] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [newTaskStage, setNewTaskStage] = useState(null)
  const [newTask, setNewTask] = useState({ task_name: '', quantity: 1, unit_cost: 0, description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [latestEstimate, setLatestEstimate] = useState(null)
  const [proposalNumber, setProposalNumber] = useState(null)
  const [creatingProposal, setCreatingProposal] = useState(false)
  const [parentProposal, setParentProposal] = useState(null)
  const [error, setError] = useState(null)
  const [allProposals, setAllProposals] = useState([])
  const [showProposalSelector, setShowProposalSelector] = useState(false)
  const [selectedProposalId, setSelectedProposalId] = useState(null)
  const [projectData, setProjectData] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load data in PARALLEL for better performance
      const [parentData, estimate, allProposalsData, groupedTasks, fullProjectData] = await Promise.all([
        loadParentProposalData(projectId, 'Negotiation'),
        getLatestEstimate(projectId),
        getProposalsByProject(projectId),
        getAllStageTasksGrouped(projectId),
        getProjectWithCustomer(projectId)
      ])

      setParentProposal(parentData.parentProposal)
      setLatestEstimate(estimate)
      setAllProposals(allProposalsData || [])
      if (fullProjectData) {
        setProjectData(fullProjectData)
      }

      // DEBUG: Log all proposals to understand what's being loaded
      console.log('✅ All Proposals Loaded:', allProposalsData)
      console.log('📊 Proposal Types:', allProposalsData?.map(p => p.proposal_type))

      // Load the latest NEG proposal number if exists, otherwise use parent EST proposal
      const latestNegProposal = (allProposalsData || []).find(p => p.proposal_type === 'Negotiation')
      console.log('🔍 Latest NEG Proposal:', latestNegProposal)
      if (latestNegProposal) {
        setProposalNumber(latestNegProposal.proposal_number)
      } else if (parentData?.parentProposal?.proposal_number) {
        // Fallback to parent EST proposal if no NEG proposal exists yet
        setProposalNumber(parentData.parentProposal.proposal_number)
      }

      // Load ALL stages with ALL tasks - no filtering
      // User can modify quantities; only tasks with quantity > 0 go in the proposal
      const stagesData = PROJECT_STAGES.map(stage => ({
        ...stage,
        tasks: groupedTasks[stage.id] || [],
        isFromParent: (groupedTasks[stage.id]?.length || 0) > 0
      }))

      setStages(stagesData)
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message || 'Failed to load data')
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const calculateStageTotal = (tasks) => {
    return tasks.reduce((sum, task) => sum + (task.quantity * task.unit_cost), 0)
  }

  const calculateGrandTotal = () => {
    return stages.reduce((sum, stage) => sum + calculateStageTotal(stage.tasks), 0)
  }

  const handleEditTask = (task) => {
    setEditingTask(task.id)
    setEditValues({
      quantity: task.quantity,
      unit_cost: task.unit_cost,
      description: task.description
    })
  }

  const handleSaveTask = async (task) => {
    setSaving(true)
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

  const handleAddTask = async (stageId) => {
    if (!newTask.task_name) {
      toast.error('Please enter task name')
      return
    }

    setSaving(true)
    try {
      const result = await createStageTask({
        stage_id: stageId,
        project_id: projectId,  // ✅ ADDED: Include project_id
        ...newTask
      })
      if (result.success) {
        toast.success('Task added successfully')
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

  const handleSaveNegotiation = async () => {
    setSaving(true)
    try {
      const grandTotal = calculateGrandTotal()
      const result = await createEstimate(
        projectId,
        'Negotiation',
        grandTotal,
        `Negotiated proposal for ${project?.name || 'Solar Project'}`
      )

      if (result.success) {
        toast.success('Negotiated proposal saved successfully!')
        setLatestEstimate(result.data)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error saving negotiation:', err)
      toast.error('Failed to save negotiated proposal')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateNegotiationProposal = async () => {
    // VALIDATION: Check for customer
    if (!projectData?.customer?.customer_id) {
      toast.error('Customer information not available. Please ensure project is linked to a customer.')
      return
    }

    // VALIDATION: Check for tasks with quantity > 0 (only these go in proposal)
    const tasksWithQuantity = stages.flatMap(stage =>
      stage.tasks?.filter(t => t.quantity > 0) || []
    )

    if (tasksWithQuantity.length === 0) {
      toast.error('Cannot create proposal without tasks. Set quantity > 0 for at least one task.')
      return
    }

    // VALIDATION: Check grand total is not zero
    const grandTotalAmount = calculateGrandTotal()
    if (grandTotalAmount === 0) {
      toast.error('Grand total cannot be zero. Check all task quantities and costs.')
      return
    }

    setCreatingProposal(true)
    try {
      // Create negotiation proposal reference with parent EST proposal
      const proposalRefResult = await createProposalReference(
        projectId,
        'Negotiation',
        parentProposal?.id  // Parent is the EST proposal
      )
      if (!proposalRefResult.success) {
        throw new Error('Failed to create proposal reference')
      }

      const proposalRef = proposalRefResult.data
      setProposalNumber(proposalRef.proposal_number)

      // Save negotiation estimate with ONLY stages that have tasks with quantity > 0
      const stagesWithValidTasks = stages.filter(s =>
        s.tasks && s.tasks.some(t => t.quantity > 0)
      )
      const stagesWithTasksArray = stagesWithValidTasks.map(s => s.id)

      const estimateResult = await createEstimate(
        projectId,
        'Negotiation',
        grandTotalAmount,
        `Negotiation proposal ${proposalRef.proposal_number} - Based on ${parentProposal?.proposal_number || 'Estimation'}`,
        proposalRef.id,
        JSON.stringify(stagesWithTasksArray),
        '', // createdBy
        projectData.customer.name, // customerName (from linked customer)
        projectData.customer.phone, // customerPhone (from linked customer)
        projectData.customer.customer_id // customerId (from linked customer)
      )

      if (estimateResult.success) {
        toast.success(`✅ Proposal ${proposalRef.proposal_number} created (based on ${parentProposal?.proposal_number})!`)
        setLatestEstimate(estimateResult.data)
        await loadData()
      } else {
        throw new Error(estimateResult.error)
      }
    } catch (err) {
      console.error('Error creating negotiation proposal:', err)
      toast.error('Failed to create negotiation proposal')
      setProposalNumber(null)
    } finally {
      setCreatingProposal(false)
    }
  }

  const handleDownloadProposal = () => {
    try {
      if (!proposalNumber) {
        toast.error('Create proposal first before downloading')
        return
      }

      const selectedStagesData = stages.filter(stage => stage.tasks && stage.tasks.length > 0)
      const stageIds = selectedStagesData.map(s => s.id)

      const success = downloadProposalPDF(
        {
          ...project,
          proposal_number: proposalNumber,
          customer_name: projectData?.customer?.name || '',
          customer_phone: projectData?.customer?.phone || ''
        },
        stageIds,
        selectedStagesData,
        calculateGrandTotal()
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

  const handleMoveToExecutionClick = () => {
    // Get all NEG proposals
    const negProposals = allProposals.filter(p => p.proposal_type === 'Negotiation')

    if (negProposals.length === 0) {
      toast.error('Create a Negotiation proposal first')
      return
    }

    if (negProposals.length === 1) {
      // Only one proposal, use it directly
      handleMoveToExecution(negProposals[0].id)
    } else {
      // Multiple proposals, show selector
      setSelectedProposalId(negProposals[0].id) // Default to first
      setShowProposalSelector(true)
    }
  }

  const handleMoveToExecution = async (selectedNegId) => {
    setSaving(true)
    try {
      const result = await updateProjectState(projectId, 'Execution')
      if (result.success) {
        toast.success('Project moved to Execution state')
        setShowProposalSelector(false)
        onStateChange('Execution')
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error moving to execution:', err)
      toast.error('Failed to move to execution')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading negotiation data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-900 font-bold text-lg mb-2">Failed to Load Data</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Edit2 className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Negotiate Proposal</h3>
      </div>

      {/* Parent Proposal Info */}
      {parentProposal && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Link2 size={18} className="text-blue-600 mt-1" />
            <div>
              <p className="text-sm font-semibold text-blue-900">
                Based on: <span className="font-mono bg-blue-100 px-2 py-1 rounded">{parentProposal.proposal_number}</span>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Created: {new Date(parentProposal.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-blue-700">
                All stages with quantities and values inherited and ready for modification
              </p>
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 mb-6">Modify tasks and costs as per customer requirements. All stages with their quantities and values from {parentProposal?.proposal_number || 'Estimation'} are loaded. All changes will be carried forward to Execution.</p>

      {/* Customer Information (DISPLAY ONLY) */}
      <div className="mb-6 p-5 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-lg space-y-3">
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

      <div className="space-y-4">
        {stages.map((stage) => (
          <div key={stage.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Stage Header */}
            <button
              onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
              className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="text-left">
                <p className="font-semibold text-gray-900">{stage.name}</p>
                <p className="text-sm text-gray-500">{stage.tasks.length} tasks</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">₹{calculateStageTotal(stage.tasks).toLocaleString()}</span>
                {expandedStage === stage.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Stage Tasks */}
            {expandedStage === stage.id && (
              <div className="p-4 bg-white border-t border-gray-200 space-y-3">
                {stage.tasks.map((task) => (
                  <div key={task.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                    {editingTask === task.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editValues.description || ''}
                          onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                          placeholder="Description"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={editValues.quantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value)
                              setEditValues({ ...editValues, quantity: val < 0 ? 0 : val })
                            }}
                            min="0"
                            placeholder="Quantity"
                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="number"
                            value={editValues.unit_cost}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value)
                              setEditValues({ ...editValues, unit_cost: val < 0 ? 0 : val })
                            }}
                            min="0"
                            placeholder="Unit Cost"
                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveTask(task)}
                            disabled={saving}
                            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-sm font-semibold py-1 rounded flex items-center justify-center gap-1"
                          >
                            <Save className="w-4 h-4" /> Save
                          </button>
                          <button
                            onClick={() => setEditingTask(null)}
                            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white text-sm font-semibold py-1 rounded flex items-center justify-center gap-1"
                          >
                            <X className="w-4 h-4" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{task.task_name}</p>
                          <p className="text-xs text-gray-500">{task.description}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {task.quantity} × ₹{task.unit_cost.toLocaleString()} = ₹{(task.quantity * task.unit_cost).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="p-2 hover:bg-blue-100 rounded transition"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-2 hover:bg-red-100 rounded transition"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add New Task Button */}
                {newTaskStage === stage.id ? (
                  <div className="p-3 bg-blue-50 rounded border border-blue-200 space-y-3">
                    <input
                      type="text"
                      value={newTask.task_name}
                      onChange={(e) => setNewTask({ ...newTask, task_name: e.target.value })}
                      placeholder="Task Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      placeholder="Description"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={newTask.quantity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          setNewTask({ ...newTask, quantity: val < 0 ? 0 : val })
                        }}
                        min="0"
                        placeholder="Quantity"
                        className="px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        value={newTask.unit_cost}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          setNewTask({ ...newTask, unit_cost: val < 0 ? 0 : val })
                        }}
                        min="0"
                        placeholder="Unit Cost"
                        className="px-3 py-2 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddTask(stage.id)}
                        disabled={saving}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-sm font-semibold py-1 rounded"
                      >
                        Add Task
                      </button>
                      <button
                        onClick={() => setNewTaskStage(null)}
                        className="flex-1 bg-gray-400 hover:bg-gray-500 text-white text-sm font-semibold py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewTaskStage(stage.id)}
                    className="w-full py-2 border-2 border-dashed border-blue-300 rounded text-blue-600 hover:bg-blue-50 transition font-medium text-sm flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add New Task
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Card (STICKY) */}
      <div className="sticky bottom-0 left-0 right-0 mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 shadow-lg z-10">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-blue-700 mb-1">Negotiated Total</p>
            <p className="text-2xl font-bold text-blue-900">₹{calculateGrandTotal().toLocaleString()}</p>
          </div>
          {latestEstimate && (
            <div>
              <p className="text-sm text-blue-700 mb-1">Original Estimate</p>
              <p className="text-2xl font-bold text-blue-900">₹{latestEstimate.grand_total.toLocaleString()}</p>
            </div>
          )}
        </div>

        {latestEstimate && calculateGrandTotal() !== latestEstimate.grand_total && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p className="text-yellow-700">
              Difference: ₹{Math.abs(calculateGrandTotal() - latestEstimate.grand_total).toLocaleString()}
              {calculateGrandTotal() < latestEstimate.grand_total ? ' (Discount)' : ' (Increase)'}
            </p>
          </div>
        )}

        <div className="space-y-4 pt-6 border-t border-gray-200">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleCreateNegotiationProposal}
              disabled={creatingProposal}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 transition"
            >
              {creatingProposal ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Create Negotiation Proposal
                </>
              )}
            </button>
            {proposalNumber && (
              <button
                onClick={handleDownloadProposal}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Download size={18} />
                Download {proposalNumber}
              </button>
            )}
            <button
              onClick={async () => {
                setSaving(true)
                try {
                  const result = await updateProjectState(projectId, 'Estimation')
                  if (result.success) {
                    toast.success('Moved back to Estimation')
                    onStateChange('Estimation')
                  } else {
                    throw new Error(result.error)
                  }
                } catch (err) {
                  console.error('Error:', err)
                  toast.error('Failed to go back to Estimation')
                } finally {
                  setSaving(false)
                }
              }}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
            >
              ← Back to Estimation
            </button>
            <button
              onClick={handleMoveToExecutionClick}
              disabled={saving || allProposals.filter(p => p.proposal_type === 'Negotiation').length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition ml-auto"
            >
              Move to Execution →
            </button>
          </div>

        </div>
      </div>

      {/* Proposal Selector Modal */}
      <ProposalSelector
        isOpen={showProposalSelector}
        proposals={allProposals.filter(p => p.proposal_type === 'Negotiation')}
        currentState="Negotiation"
        targetState="Execution"
        selectedId={selectedProposalId}
        onSelect={(proposalId) => {
          setSelectedProposalId(proposalId)
          handleMoveToExecution(proposalId)
        }}
        onCancel={() => {
          setShowProposalSelector(false)
          setSelectedProposalId(null)
        }}
      />
    </div>
  )
}
