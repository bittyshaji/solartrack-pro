/**
 * Estimation Panel Component - UPDATED
 * Displays stage tasks and generates professional proposals with proposal references
 * Supports multiple estimation proposals per project
 */

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, FileText, Download, Edit2, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { PROJECT_STAGES } from '../lib/projectService'
import { getStageTasksByStage, calculateStageTotalCost, updateStageTask } from '../lib/stageTaskService'
import { createEstimate } from '../lib/estimateService'
import { downloadProposalPDF } from '../lib/proposalDownloadService'
import { createProposalReference, getProposalsByProject } from '../lib/proposalReferenceService'

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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load stages and tasks
      const stagesData = []
      for (const stage of PROJECT_STAGES) {
        const tasks = await getStageTasksByStage(stage.id)
        stagesData.push({
          ...stage,
          tasks,
          total: calculateStageTotalCost(tasks)
        })
      }
      setStages(stagesData)

      // Load existing proposals for this project
      const projectProposals = await getProposalsByProject(projectId)
      setProposals(projectProposals)
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
      const result = await updateStageTask(task.id, editValues)
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
    if (selectedStages.size === 0) {
      toast.error('Please select at least one stage')
      return
    }

    setCreatingEstimate(true)
    try {
      // Step 1: Create proposal reference with unique number
      const proposalRefResult = await createProposalReference(projectId, 'Estimation')
      if (!proposalRefResult.success) {
        throw new Error('Failed to create proposal reference')
      }

      const proposalRef = proposalRefResult.data
      setProposalNumber(proposalRef.proposal_number)

      // Step 2: Create estimate with proposal reference and selected stages
      const grandTotal = calculateTotal()
      const selectedStagesArray = Array.from(selectedStages)

      const estimateResult = await createEstimate(
        projectId,
        'Estimation',
        grandTotal,
        `Proposal ${proposalRef.proposal_number} for ${project?.name || 'Solar Project'}`,
        proposalRef.id,
        JSON.stringify(selectedStagesArray)
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

      const selectedStagesData = stages.filter(stage => selectedStages.has(stage.id))
      const success = downloadProposalPDF(
        {
          ...project,
          proposal_number: proposalNumber
        },
        Array.from(selectedStages),
        selectedStagesData,
        calculateTotal()
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

  const handleMoveToNegotiation = async () => {
    if (!estimate || !proposalNumber) {
      toast.error('Generate and save proposal first')
      return
    }

    setCreatingEstimate(true)
    try {
      // Update project state to Negotiation
      const result = await updateProjectState(projectId, 'Negotiation')
      if (result.success) {
        toast.success('Moved to Negotiation phase! ✅')
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

      {/* ─── STAGE SELECTION ─── */}
      <div className="space-y-3">
        {stages.map(stage => (
          <div key={stage.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Stage Header */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}>
              <input
                type="checkbox"
                checked={selectedStages.has(stage.id)}
                onChange={() => toggleStageSelection(stage.id)}
                className="w-5 h-5 text-blue-600 rounded"
                onClick={e => e.stopPropagation()}
              />
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
                            onChange={e => setEditValues({ ...editValues, quantity: parseFloat(e.target.value) })}
                            className="w-16 px-2 py-1 border rounded text-sm"
                            placeholder="Qty"
                          />
                          <input
                            type="number"
                            value={editValues.unit_cost}
                            onChange={e => setEditValues({ ...editValues, unit_cost: parseFloat(e.target.value) })}
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

      {/* ─── SUMMARY & ACTIONS ─── */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
        <div>
          <p className="text-sm text-gray-600">Stages Selected: {selectedStages.size}</p>
          <p className="text-2xl font-bold text-gray-900">Estimated Total: ₹{calculateTotal().toLocaleString('en-IN')}</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleGenerateProposal}
            disabled={creatingEstimate || selectedStages.size === 0}
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
            onClick={handleMoveToNegotiation}
            disabled={!estimate || creatingEstimate}
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
    </div>
  )
}
