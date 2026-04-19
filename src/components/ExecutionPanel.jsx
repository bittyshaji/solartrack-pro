/**
 * Execution Panel Component
 * Track actual work and generate final invoices
 * For projects in "Execution" state
 * Supports PDF download and multiple execution proposals
 */

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Plus, CheckCircle, FileText, Edit2, Save, X, Download, Link2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { PROJECT_STAGES, updateProjectState, getProjectWithCustomer } from '../lib/projectService'
import { getStageTasksByStage, createStageTask, updateStageTask, updateStageTaskForProject, getAllStageTasksGrouped } from '../lib/stageTaskService'
import { createInvoice, getProjectInvoices, updateInvoicePayment } from '../lib/invoiceService'
import { createEstimate, getLatestEstimate } from '../lib/estimateService'
import { downloadProposalPDF } from '../lib/proposalDownloadService'
import { createProposalReference, getProposalsByProject } from '../lib/proposalReferenceService'
import { loadParentProposalData } from '../lib/proposalDataService'

export default function ExecutionPanel({ projectId, project, onStateChange }) {
  const [stages, setStages] = useState([])
  const [expandedStage, setExpandedStage] = useState(null)
  const [newTaskStage, setNewTaskStage] = useState(null)
  const [newTask, setNewTask] = useState({ task_name: '', quantity: 1, unit_cost: 0, description: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [invoices, setInvoices] = useState([])
  const [latestEstimate, setLatestEstimate] = useState(null)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [editingTask, setEditingTask] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [proposalNumber, setProposalNumber] = useState(null)
  const [executionProposalId, setExecutionProposalId] = useState(null)
  const [creatingProposal, setCreatingProposal] = useState(false)
  const [parentProposal, setParentProposal] = useState(null)
  const [error, setError] = useState(null)
  const [projectData, setProjectData] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load data in PARALLEL for better performance
      const [parentData, estimate, invoices, groupedTasks, allProposalsData, fullProjectData] = await Promise.all([
        loadParentProposalData(projectId, 'Execution'),
        getLatestEstimate(projectId),
        getProjectInvoices(projectId),
        getAllStageTasksGrouped(projectId),
        getProposalsByProject(projectId), // Also load proposals to get latest EXE proposal number
        getProjectWithCustomer(projectId)
      ])

      setParentProposal(parentData.parentProposal)
      setLatestEstimate(estimate)
      setInvoices(invoices)
      if (fullProjectData) {
        setProjectData(fullProjectData)
      }

      // DEBUG: Log all proposals to understand what's being loaded
      console.log('✅ All Proposals Loaded (EXE):', allProposalsData)
      console.log('📊 Proposal Types:', allProposalsData?.map(p => p.proposal_type))

      // Load the latest EXE proposal number if exists, otherwise use parent NEG proposal
      const latestExeProposal = (allProposalsData || []).find(p => p.proposal_type === 'Execution')
      console.log('🔍 Latest EXE Proposal:', latestExeProposal)
      if (latestExeProposal) {
        setProposalNumber(latestExeProposal.proposal_number)
        setExecutionProposalId(latestExeProposal.id)
      } else if (parentData?.parentProposal?.proposal_number) {
        // Fallback to parent NEG proposal if no EXE proposal exists yet
        setProposalNumber(parentData.parentProposal.proposal_number)
        setExecutionProposalId(parentData.parentProposal.id)
      }

      // Load ALL stages with ALL tasks - no filtering
      // Tasks with quantity > 0 will be included in the execution proposal
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
      unit_cost: task.unit_cost
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

  const handleGenerateInvoice = async () => {
    // Ensure execution proposal has been created
    if (!executionProposalId) {
      toast.error('Please create an execution proposal first')
      return
    }

    setSaving(true)
    try {
      const grandTotal = calculateGrandTotal()
      // Pass proposal ID along with projectId and totalAmount
      const result = await createInvoice(projectId, executionProposalId, grandTotal)

      if (result.success) {
        toast.success('Invoice generated successfully!')
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

  const handleRecordPayment = async (invoice) => {
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }

    setSaving(true)
    try {
      const newPaidAmount = (invoice.paid_amount || 0) + parseFloat(paymentAmount)
      const result = await updateInvoicePayment(invoice.id, newPaidAmount)

      if (result.success) {
        toast.success('Payment recorded successfully!')
        await loadData()
        setSelectedInvoice(null)
        setPaymentAmount(0)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error recording payment:', err)
      toast.error('Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateExecutionProposal = async () => {
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
      // Create execution proposal reference with parent NEG proposal
      const proposalRefResult = await createProposalReference(
        projectId,
        'Execution',
        parentProposal?.id  // Parent is the NEG proposal
      )
      if (!proposalRefResult.success) {
        throw new Error('Failed to create proposal reference')
      }

      const proposalRef = proposalRefResult.data
      setProposalNumber(proposalRef.proposal_number)
      setExecutionProposalId(proposalRef.id)

      // Save execution estimate/invoice with ONLY stages that have tasks with quantity > 0
      const stagesWithValidTasks = stages.filter(s =>
        s.tasks && s.tasks.some(t => t.quantity > 0)
      )
      const stagesWithTasksArray = stagesWithValidTasks.map(s => s.id)

      const estimateResult = await createEstimate(
        projectId,
        'Execution',
        grandTotalAmount,
        `Execution proposal ${proposalRef.proposal_number} - Based on ${parentProposal?.proposal_number || 'Negotiation'}`,
        proposalRef.id,
        JSON.stringify(stagesWithTasksArray),
        '', // createdBy
        projectData.customer.name, // customerName (from linked customer)
        projectData.customer.phone, // customerPhone (from linked customer)
        projectData.customer.customer_id // customerId (from linked customer)
      )

      if (estimateResult.success) {
        toast.success(`✅ Final proposal ${proposalRef.proposal_number} created (based on ${parentProposal?.proposal_number})!`)
        setLatestEstimate(estimateResult.data)
        await loadData()
      } else {
        throw new Error(estimateResult.error)
      }
    } catch (err) {
      console.error('Error creating execution proposal:', err)
      toast.error('Failed to create execution proposal')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading execution data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Work Tracking Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Work Tracking & Execution</h3>
        </div>

        {/* Parent Proposal Info */}
        {parentProposal && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Link2 size={18} className="text-green-600 mt-1" />
              <div>
                <p className="text-sm font-semibold text-green-900">
                  Based on: <span className="font-mono bg-green-100 px-2 py-1 rounded">{parentProposal.proposal_number}</span>
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Created: {new Date(parentProposal.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-green-700">
                  All stages with quantities and values inherited from Negotiation phase
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-6">Track actual work completed. All stages with their quantities and values from {parentProposal?.proposal_number || 'Negotiation'} are loaded. Modifications can be made before finalizing the execution proposal.</p>

        {/* Customer Information (DISPLAY ONLY) */}
        <div className="mb-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg space-y-3">
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
                className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 transition-colors"
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
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{task.task_name}</p>
                            <p className="text-xs text-gray-500">{task.description}</p>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">Quantity</label>
                              <input
                                type="number"
                                value={editValues.quantity}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value)
                                  setEditValues({ ...editValues, quantity: val < 0 ? 0 : val })
                                }}
                                min="0"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">Unit Cost</label>
                              <input
                                type="number"
                                value={editValues.unit_cost}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value)
                                  setEditValues({ ...editValues, unit_cost: val < 0 ? 0 : val })
                                }}
                                min="0"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">Total</label>
                              <div className="px-2 py-1 bg-green-50 rounded text-sm font-semibold text-green-900">
                                ₹{(editValues.quantity * editValues.unit_cost).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleSaveTask(task)}
                              disabled={saving}
                              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-xs font-semibold py-1 rounded flex items-center justify-center gap-1"
                            >
                              <Save className="w-3 h-3" /> Save
                            </button>
                            <button
                              onClick={() => setEditingTask(null)}
                              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white text-xs font-semibold py-1 rounded flex items-center justify-center gap-1"
                            >
                              <X className="w-3 h-3" /> Cancel
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
                          <div className="flex-shrink-0 ml-4 flex items-center gap-2">
                            <button
                              onClick={() => handleEditTask(task)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            <div className="flex items-center gap-2 border-l border-gray-300 pl-2">
                              <input
                                type="checkbox"
                                defaultChecked={false}
                                className="w-5 h-5 rounded border-gray-300 text-green-600 cursor-pointer"
                                title="Mark as completed"
                              />
                              <span className="text-xs text-gray-600">Done</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New Task Button */}
                  {newTaskStage === stage.id ? (
                    <div className="p-3 bg-green-50 rounded border border-green-200 space-y-3">
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
                          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-sm font-semibold py-1 rounded"
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
                      className="w-full py-2 border-2 border-dashed border-green-300 rounded text-green-600 hover:bg-green-50 transition font-medium text-sm flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Add Actual Task
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Work Summary */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-green-700 mb-1">Current Total</p>
              <p className="text-2xl font-bold text-green-900">₹{calculateGrandTotal().toLocaleString()}</p>
            </div>
            {latestEstimate && (
              <div>
                <p className="text-sm text-green-700 mb-1">Negotiated Amount</p>
                <p className="text-2xl font-bold text-green-900">₹{latestEstimate.grand_total.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoicing Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Final Invoice & Billing</h3>
        </div>

        <div className="mb-6">
          <button
            onClick={handleGenerateInvoice}
            disabled={saving || invoices.length > 0}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {invoices.length > 0 ? 'Invoice Already Generated' : 'Generate Final Invoice'}
          </button>
        </div>

        {invoices.length > 0 && (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(invoice.invoice_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    invoice.payment_status === 'Paid' ? 'bg-green-100 text-green-700' :
                    invoice.payment_status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {invoice.payment_status}
                  </span>
                </div>

                <div className="bg-gray-50 p-3 rounded mb-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total Amount</p>
                      <p className="font-semibold text-gray-900">₹{invoice.total_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Paid Amount</p>
                      <p className="font-semibold text-gray-900">₹{invoice.paid_amount.toLocaleString()}</p>
                    </div>
                  </div>
                  {invoice.paid_amount < invoice.total_amount && (
                    <div className="mt-2 text-sm">
                      <p className="text-gray-600">Outstanding</p>
                      <p className="font-semibold text-red-600">₹{(invoice.total_amount - invoice.paid_amount).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {selectedInvoice === invoice.id ? (
                  <div className="space-y-3 border-t pt-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRecordPayment(invoice)}
                        disabled={saving}
                        className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
                      >
                        {saving ? 'Recording...' : 'Record Payment'}
                      </button>
                      <button
                        onClick={() => setSelectedInvoice(null)}
                        className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setSelectedInvoice(invoice.id)}
                    disabled={invoice.payment_status === 'Paid'}
                    className="w-full text-purple-600 hover:bg-purple-50 disabled:text-gray-400 disabled:bg-gray-50 font-semibold py-2 rounded-lg transition text-sm"
                  >
                    {invoice.payment_status === 'Paid' ? 'Payment Complete' : 'Record Payment'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Proposal Creation and Download Section (STICKY) */}
        <div className="sticky bottom-0 left-0 right-0 mt-6 pt-6 border-t border-gray-200 space-y-4 bg-white shadow-lg z-10 p-6 -mx-6 -mb-6">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={async () => {
                setSaving(true)
                try {
                  const result = await updateProjectState(projectId, 'Negotiation')
                  if (result.success) {
                    toast.success('Moved back to Negotiation')
                    onStateChange('Negotiation')
                  } else {
                    throw new Error(result.error)
                  }
                } catch (err) {
                  console.error('Error:', err)
                  toast.error('Failed to go back to Negotiation')
                } finally {
                  setSaving(false)
                }
              }}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
            >
              ← Back to Negotiation
            </button>
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
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition"
            >
              ← Back to Estimation
            </button>
            <button
              onClick={handleCreateExecutionProposal}
              disabled={creatingProposal}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400 transition ml-auto"
            >
              {creatingProposal ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Create Execution Proposal
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
          </div>

        </div>
      </div>
    </div>
  )
}
