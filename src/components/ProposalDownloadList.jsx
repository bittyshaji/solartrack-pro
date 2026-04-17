/**
 * Proposal Download List Component
 * Displays all proposals for a project with download links
 * Shows proposal number, type, date, and download button
 */

import { useState, useEffect } from 'react'
import { Download, FileText, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProposalsByProject } from '../lib/proposalReferenceService'
import { downloadProposalPDF } from '../lib/proposalDownloadService'
import { loadParentProposalData } from '../lib/proposalDataService'
import { getAllStageTasksGrouped, calculateStageTotalCost } from '../lib/stageTaskService'
import { PROJECT_STAGES } from '../lib/projectService'

export default function ProposalDownloadList({ projectId, project, currentProposalNumber }) {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState({})

  useEffect(() => {
    loadProposals()
  }, [projectId])

  const loadProposals = async () => {
    setLoading(true)
    try {
      const data = await getProposalsByProject(projectId)
      setProposals(data || [])
    } catch (err) {
      console.error('Error loading proposals:', err)
      toast.error('Failed to load proposals')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (proposal) => {
    setDownloading(prev => ({ ...prev, [proposal.id]: true }))
    try {
      // Load the proposal data with stages and total
      const proposalData = await loadParentProposalData(projectId, proposal.proposal_type)

      if (!proposalData?.parentProposal) {
        toast.error('Could not load proposal data')
        return
      }

      // Load all stages for the project
      const groupedTasks = await getAllStageTasksGrouped(projectId)

      // Build stages array with tasks
      const stagesWithTasks = PROJECT_STAGES.map(stage => ({
        ...stage,
        tasks: groupedTasks[stage.id] || [],
        total: calculateStageTotalCost(groupedTasks[stage.id] || [])
      }))

      // Calculate grand total
      const grandTotal = stagesWithTasks.reduce((sum, stage) => {
        const stageTotal = (stage.tasks || []).reduce((s, task) => s + (task.quantity * task.unit_cost), 0)
        return sum + stageTotal
      }, 0)

      // Get stage IDs that have tasks
      const stageIdsWithTasks = stagesWithTasks
        .filter(s => s.tasks && s.tasks.length > 0)
        .map(s => s.id)

      const success = downloadProposalPDF(
        {
          ...project,
          proposal_number: proposal.proposal_number
        },
        stageIdsWithTasks,
        stagesWithTasks,
        grandTotal
      )

      if (success) {
        toast.success(`Downloaded ${proposal.proposal_number}`)
      } else {
        toast.error('Failed to download proposal')
      }
    } catch (err) {
      console.error('Error downloading proposal:', err)
      toast.error('Error downloading proposal')
    } finally {
      setDownloading(prev => ({ ...prev, [proposal.id]: false }))
    }
  }

  const getProposalTypeColor = (type) => {
    switch (type) {
      case 'Estimation':
        return 'bg-blue-100 text-blue-800'
      case 'Negotiation':
        return 'bg-orange-100 text-orange-800'
      case 'Execution':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (proposals.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <FileText size={32} className="mx-auto mb-2 opacity-30" />
        <p>No proposals yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900 mb-4">All Proposals</h3>
      {proposals.map((proposal) => (
        <div
          key={proposal.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-1 rounded text-sm font-medium ${getProposalTypeColor(proposal.proposal_type)}`}>
                {proposal.proposal_type}
              </span>
              <span className="font-mono font-semibold text-gray-900">{proposal.proposal_number}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar size={14} />
              {new Date(proposal.created_at).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
              {proposal.status && (
                <>
                  <span className="mx-1">•</span>
                  <span className="capitalize">{proposal.status}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => handleDownload(proposal)}
            disabled={downloading[proposal.id]}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition ml-4"
            title={`Download ${proposal.proposal_number}`}
          >
            <Download size={16} />
            {downloading[proposal.id] ? 'Downloading...' : 'Download'}
          </button>
        </div>
      ))}
    </div>
  )
}
