/**
 * Proposal Selector Modal
 * Allows users to select which parent proposal to use when moving between states
 * Example: Select which EST proposal to base NEG on
 */

import { X, CheckCircle } from 'lucide-react'

export default function ProposalSelector({
  isOpen,
  proposals,
  currentState,
  targetState,
  onSelect,
  onCancel,
  selectedId
}) {
  if (!isOpen) return null

  const stateDescriptions = {
    'Estimation': 'Estimation Proposal',
    'Negotiation': 'Negotiation Proposal',
    'Execution': 'Execution Proposal'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Select Parent Proposal</h2>
            <p className="text-sm text-blue-100">
              Choose which {stateDescriptions[currentState]} to base the new {stateDescriptions[targetState]} on
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-white hover:bg-blue-700 p-1 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Proposals List */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-2">
          {proposals && proposals.length > 0 ? (
            proposals.map(proposal => (
              <button
                key={proposal.id}
                onClick={() => onSelect(proposal.id, proposal)}
                className={`w-full text-left p-3 rounded-lg border-2 transition ${
                  selectedId === proposal.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 flex items-center gap-2">
                      {proposal.proposal_number}
                      {selectedId === proposal.id && (
                        <CheckCircle size={16} className="text-blue-600" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      Created: {new Date(proposal.created_at).toLocaleDateString('en-IN')}
                    </div>
                    <div className="text-sm font-medium text-gray-800 mt-1">
                      ₹{proposal.grand_total?.toLocaleString('en-IN') || '0'}
                    </div>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No {stateDescriptions[currentState]} available
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(selectedId)}
            disabled={!selectedId}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
          >
            Use Selected
          </button>
        </div>
      </div>
    </div>
  )
}
