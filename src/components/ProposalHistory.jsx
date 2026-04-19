/**
 * Proposal History Component
 * Displays all proposals (Estimation, Negotiation, Execution) for a project
 * Allows viewing proposal details and downloading PDFs
 */

import { useState, useEffect } from 'react'
import { Download, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProposalsByProject, getProposalHierarchy, formatProposalNumber, getProposalTypeLabel, getProposalWithDetails } from '../lib/proposalReferenceService'
import { PROJECT_STAGES } from '../lib/projectService'
import { downloadProposalPDF } from '../lib/proposalDownloadService'

export default function ProposalHistory({ projectId, project }) {
  const [hierarchy, setHierarchy] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedProposal, setExpandedProposal] = useState(null)
  const [downloadingProposalId, setDownloadingProposalId] = useState(null)

  useEffect(() => {
    loadProposals()
  }, [projectId])

  const loadProposals = async () => {
    setLoading(true)
    try {
      const data = await getProposalHierarchy(projectId)
      setHierarchy(data)
    } catch (err) {
      console.error('Error loading proposals:', err)
      toast.error('Failed to load proposals')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadProposal = async (proposal) => {
    if (!project) {
      toast.error('Project data not available')
      return
    }

    setDownloadingProposalId(proposal.id)
    try {
      // Fetch complete proposal details with estimate
      const proposalData = await getProposalWithDetails(proposal.id)

      if (!proposalData || !proposalData.estimate) {
        toast.error('No estimate data found for this proposal')
        return
      }

      // Parse selected stages
      const selectedStageIds = JSON.parse(proposalData.estimate.selected_stage_ids || '[]')

      if (selectedStageIds.length === 0) {
        toast.error('No stages selected in this proposal')
        return
      }

      // Get stage objects with their IDs
      const stagesWithTasks = PROJECT_STAGES.filter(s => selectedStageIds.includes(s.id))

      // Generate and download PDF
      downloadProposalPDF(
        project,
        selectedStageIds,
        stagesWithTasks,
        proposalData.estimate.grand_total || 0
      )

      toast.success('PDF downloaded successfully')
    } catch (err) {
      console.error('Error downloading proposal:', err)
      toast.error('Failed to download proposal: ' + (err.message || 'Unknown error'))
    } finally {
      setDownloadingProposalId(null)
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading proposals...</div>
  }

  // Flatten all proposals for easier display
  const allProposals = []
  hierarchy.forEach(item => {
    if (item.estimation) allProposals.push({ ...item.estimation, level: 0 })
    item.negotiations?.forEach(neg => allProposals.push({ ...neg, level: 1, parentId: item.estimation.id }))
    item.executions?.forEach(exec => allProposals.push({ ...exec, level: 2 }))
  })

  if (allProposals.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <FileText className="mx-auto text-gray-400 mb-3" size={40} />
        <p className="text-gray-600">No proposals yet. Create an estimation proposal to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📋 Proposal History</h3>
        <span className="text-sm text-gray-600">{allProposals.length} proposal(s)</span>
      </div>

      {/* Proposal Timeline */}
      <div className="space-y-3">
        {allProposals.map(proposal => (
          <div
            key={proposal.id}
            className={`rounded-lg border transition cursor-pointer ${
              expandedProposal === proposal.id
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setExpandedProposal(expandedProposal === proposal.id ? null : proposal.id)}
          >
            {/* Proposal Header */}
            <div className={`p-4 flex items-center gap-4 ${proposal.level > 0 ? 'ml-' + proposal.level * 4 : ''}`}>
              {/* Type Badge */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                  proposal.proposal_type === 'Estimation'
                    ? 'bg-blue-100 text-blue-700'
                    : proposal.proposal_type === 'Negotiation'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {proposal.proposal_type}
              </div>

              {/* Proposal Number */}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{formatProposalNumber(proposal.proposal_number)}</h4>
                <p className="text-sm text-gray-600">
                  Created {new Date(proposal.created_at).toLocaleDateString('en-IN')} at{' '}
                  {new Date(proposal.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Status Badge */}
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  proposal.status === 'Draft'
                    ? 'bg-yellow-100 text-yellow-700'
                    : proposal.status === 'Approved'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {proposal.status}
              </span>

              {/* Expand Icon */}
              <div className="text-gray-400">
                {expandedProposal === proposal.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {/* Proposal Details (Expanded) */}
            {expandedProposal === proposal.id && (
              <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-3">
                {/* Related Estimate */}
                {proposal.estimate && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Estimate Details</h5>
                    <div className="bg-white p-3 rounded border border-gray-200 space-y-2">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Grand Total:</span>
                          <span className="font-semibold text-gray-900">₹{proposal.estimate.grand_total?.toLocaleString('en-IN') || '0'}</span>
                        </div>
                        {proposal.estimate.selected_stage_ids && (
                          <div className="text-xs text-gray-600 mt-2">
                            Selected Stages: {JSON.parse(proposal.estimate.selected_stage_ids).join(', ')}
                          </div>
                        )}
                        {proposal.estimate.notes && (
                          <div className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded">
                            <strong>Notes:</strong> {proposal.estimate.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Related Invoice */}
                {proposal.invoice && (
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Invoice Details</h5>
                    <div className="bg-white p-3 rounded border border-gray-200 space-y-2">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Invoice Number:</span>
                          <span className="font-semibold text-gray-900">{proposal.invoice.invoice_number}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Amount:</span>
                          <span className="font-semibold text-gray-900">₹{proposal.invoice.total_amount?.toLocaleString('en-IN') || '0'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              proposal.invoice.payment_status === 'Paid'
                                ? 'bg-green-100 text-green-700'
                                : proposal.invoice.payment_status === 'Partial'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {proposal.invoice.payment_status}
                          </span>
                        </div>
                        {proposal.invoice.paid_amount > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Paid Amount:</span>
                            <span className="font-semibold text-gray-900">₹{proposal.invoice.paid_amount?.toLocaleString('en-IN') || '0'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Download Button */}
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownloadProposal(proposal)
                    }}
                    disabled={downloadingProposalId === proposal.id}
                    className="flex items-center gap-2 px-4 py-2 w-full text-center justify-center bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition text-sm"
                  >
                    <Download size={16} />
                    {downloadingProposalId === proposal.id ? 'Generating...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadProposals}
        className="w-full px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition"
      >
        Refresh Proposals
      </button>
    </div>
  )
}
