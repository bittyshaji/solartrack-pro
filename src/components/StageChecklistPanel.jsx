/**
 * Stage Checklist Panel Component
 * Track construction stage progress with checklists and metrics
 * Shows all 10 stages with current stage highlighted
 */

import { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Check,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Circle,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import {
  getStageMetrics,
  getStageChecklist,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  updateStageMetrics,
  getStageCompletionSummary,
  initializeDefaultChecklists,
  DEFAULT_CHECKLIST_ITEMS
} from '../lib/stageChecklistService'

const STAGES = [
  { id: 1, name: 'Site Survey' },
  { id: 2, name: 'KSEB Application' },
  { id: 3, name: 'Mounting Work' },
  { id: 4, name: 'Panel Installation' },
  { id: 5, name: 'Wiring & Inverter' },
  { id: 6, name: 'Earthing & Safety' },
  { id: 7, name: 'KSEB Inspection' },
  { id: 8, name: 'Net Meter' },
  { id: 9, name: 'Commissioning' },
  { id: 10, name: 'Completed' }
]

export default function StageChecklistPanel({ projectId, currentStage = 1 }) {
  const [metrics, setMetrics] = useState([])
  const [checklists, setChecklists] = useState({})
  const [expandedStage, setExpandedStage] = useState(currentStage)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newItems, setNewItems] = useState({})

  // Date and time tracking state
  const [editingMetrics, setEditingMetrics] = useState({})

  useEffect(() => {
    loadStageData()
  }, [projectId])

  const loadStageData = async () => {
    setLoading(true)
    try {
      // Initialize default checklists if not already done
      await initializeDefaultChecklists(projectId)

      // Load metrics for all stages
      const metricsData = await getStageMetrics(projectId)
      setMetrics(metricsData)

      // Load checklists for all stages
      const allChecklists = {}
      for (const stage of STAGES) {
        const checklistData = await getStageChecklist(projectId, stage.name)
        allChecklists[stage.name] = checklistData
      }
      setChecklists(allChecklists)
    } catch (err) {
      console.warn('No stage checklist data available yet:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStageMetric = (stageName) => {
    return metrics.find(m => m.stage_name === stageName)
  }

  const getProgressColor = (stageId) => {
    if (stageId < currentStage) return 'bg-green-500'
    if (stageId === currentStage) return 'bg-blue-500'
    return 'bg-gray-300'
  }

  const getStageStyle = (stageId) => {
    if (stageId < currentStage) return 'bg-green-50 border-green-200'
    if (stageId === currentStage) return 'bg-blue-50 border-blue-200'
    return 'bg-gray-50 border-gray-200'
  }

  const handleAddChecklistItem = async (stageName) => {
    const description = newItems[stageName]?.trim()
    if (!description) {
      toast.error('Please enter an item description')
      return
    }

    setSaving(true)
    try {
      const newItem = await addChecklistItem(projectId, stageName, description)
      if (newItem) {
        // Reload checklist
        const updatedChecklist = await getStageChecklist(projectId, stageName)
        setChecklists(prev => ({
          ...prev,
          [stageName]: updatedChecklist
        }))
        setNewItems(prev => ({
          ...prev,
          [stageName]: ''
        }))
        toast.success('Item added successfully')
      }
    } catch (err) {
      console.error('Error adding checklist item:', err)
      toast.error('Failed to add item')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleChecklistItem = async (itemId, currentStatus, stageName) => {
    setSaving(true)
    try {
      const session = await supabase.auth.getSession()
      const userId = session?.data?.session?.user?.id

      await toggleChecklistItem(itemId, !currentStatus, userId)

      // Reload metrics and checklist
      const updatedMetrics = await getStageMetrics(projectId)
      setMetrics(updatedMetrics)

      const updatedChecklist = await getStageChecklist(projectId, stageName)
      setChecklists(prev => ({
        ...prev,
        [stageName]: updatedChecklist
      }))

      toast.success('Item status updated')
    } catch (err) {
      console.error('Error toggling checklist item:', err)
      toast.error('Failed to update item')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteChecklistItem = async (itemId, stageName) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return

    setSaving(true)
    try {
      const success = await deleteChecklistItem(itemId)
      if (success) {
        // Reload metrics and checklist
        const updatedMetrics = await getStageMetrics(projectId)
        setMetrics(updatedMetrics)

        const updatedChecklist = await getStageChecklist(projectId, stageName)
        setChecklists(prev => ({
          ...prev,
          [stageName]: updatedChecklist
        }))

        toast.success('Item deleted successfully')
      }
    } catch (err) {
      console.error('Error deleting checklist item:', err)
      toast.error('Failed to delete item')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateMetrics = async (stageName, field, value) => {
    setSaving(true)
    try {
      await updateStageMetrics(projectId, stageName, {
        [field]: value
      })

      // Reload metrics
      const updatedMetrics = await getStageMetrics(projectId)
      setMetrics(updatedMetrics)

      toast.success('Stage updated')
    } catch (err) {
      console.error('Error updating metrics:', err)
      toast.error('Failed to update stage')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow-md">
      {/* Stage Progress Overview */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Construction Stages</h2>
        <div className="flex overflow-x-auto gap-2 pb-4">
          {STAGES.map((stage, idx) => (
            <div key={stage.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm ${getProgressColor(
                  stage.id
                )}`}
              >
                {stage.id}
              </div>
              {idx < STAGES.length - 1 && (
                <div className={`w-8 h-1 mx-1 ${getProgressColor(stage.id + 1)}`}></div>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Current Stage: <span className="font-semibold text-blue-600">{STAGES[currentStage - 1]?.name}</span>
        </p>
      </div>

      {/* Stages List */}
      <div className="space-y-3">
        {STAGES.map((stage) => {
          const metric = getStageMetric(stage.name)
          const checklist = checklists[stage.name] || []
          const isCurrentStage = stage.id === currentStage
          const isCompleted = stage.id < currentStage
          const completionPercentage = metric?.completion_percentage || 0

          return (
            <div
              key={stage.id}
              className={`border-2 rounded-lg transition-all ${getStageStyle(stage.id)}`}
            >
              {/* Stage Header */}
              <button
                onClick={() =>
                  setExpandedStage(expandedStage === stage.id ? null : stage.id)
                }
                className="w-full p-4 flex items-center justify-between hover:bg-opacity-75 transition"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : isCurrentStage ? (
                      <Circle className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-bold text-gray-800">{stage.name}</h3>
                      <p className="text-xs text-gray-600">Stage {stage.id} of 10</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Progress Ring */}
                  <div className="relative w-12 h-12">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-gray-300"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${(completionPercentage / 100) * 282.6} 282.6`}
                        className={
                          completionPercentage === 100
                            ? 'text-green-500'
                            : 'text-blue-500'
                        }
                        strokeLinecap="round"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-700">
                        {completionPercentage}%
                      </span>
                    </div>
                  </div>

                  {expandedStage === stage.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </button>

              {/* Stage Details - Expandable */}
              {expandedStage === stage.id && (
                <div className="border-t p-4 bg-opacity-50 space-y-4">
                  {/* Date and Time Tracking */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Planned Start
                      </label>
                      <input
                        type="date"
                        value={metric?.planned_start_date || ''}
                        onChange={(e) =>
                          handleUpdateMetrics(stage.name, 'planned_start_date', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Actual Start
                      </label>
                      <input
                        type="date"
                        value={metric?.actual_start_date || ''}
                        onChange={(e) =>
                          handleUpdateMetrics(stage.name, 'actual_start_date', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Planned End
                      </label>
                      <input
                        type="date"
                        value={metric?.planned_end_date || ''}
                        onChange={(e) =>
                          handleUpdateMetrics(stage.name, 'planned_end_date', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Actual End
                      </label>
                      <input
                        type="date"
                        value={metric?.actual_end_date || ''}
                        onChange={(e) =>
                          handleUpdateMetrics(stage.name, 'actual_end_date', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Time and Resources */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Time Spent (hours)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={metric?.time_spent_hours || ''}
                        onChange={(e) =>
                          handleUpdateMetrics(stage.name, 'time_spent_hours', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <Users className="w-4 h-4 inline mr-2" />
                        Team Members
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={metric?.team_members_assigned || ''}
                        onChange={(e) =>
                          handleUpdateMetrics(stage.name, 'team_members_assigned', parseInt(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      rows="2"
                      value={metric?.notes || ''}
                      onChange={(e) =>
                        handleUpdateMetrics(stage.name, 'notes', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add stage-specific notes..."
                    />
                  </div>

                  {/* Checklist Items */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-gray-800 mb-3">Checklist Items</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {checklist.length > 0 ? (
                        checklist.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-start gap-3 p-2 bg-white rounded border hover:bg-gray-50 transition"
                          >
                            <button
                              onClick={() =>
                                handleToggleChecklistItem(item.id, item.is_completed, stage.name)
                              }
                              disabled={saving}
                              className="mt-1 focus:outline-none"
                            >
                              {item.is_completed ? (
                                <Check className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-300 hover:text-blue-500" />
                              )}
                            </button>
                            <div className="flex-1">
                              <p
                                className={`text-sm ${
                                  item.is_completed
                                    ? 'line-through text-gray-400'
                                    : 'text-gray-700'
                                }`}
                              >
                                {item.item_description}
                              </p>
                              {item.notes && (
                                <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                handleDeleteChecklistItem(item.id, stage.name)
                              }
                              disabled={saving}
                              className="p-1 hover:bg-red-100 rounded transition"
                              title="Delete item"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No checklist items yet</p>
                      )}
                    </div>

                    {/* Add New Item */}
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={newItems[stage.name] || ''}
                        onChange={(e) =>
                          setNewItems(prev => ({
                            ...prev,
                            [stage.name]: e.target.value
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddChecklistItem(stage.name)
                          }
                        }}
                        placeholder="Add new item..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={saving}
                      />
                      <button
                        onClick={() => handleAddChecklistItem(stage.name)}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
