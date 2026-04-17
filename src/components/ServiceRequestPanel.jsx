/**
 * Service Request Panel Component
 * Displays and manages service requests for a project
 * Supports creating new requests, viewing details, and updating status
 */

import { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  MessageCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getServiceRequests,
  getServiceRequestById,
  createServiceRequest,
  updateServiceRequestStatus,
  resolveServiceRequest,
  getServiceRequestStats,
  SERVICE_REQUEST_STATUSES,
  SERVICE_REQUEST_SEVERITIES
} from '../lib/serviceRequestService'

export default function ServiceRequestPanel({ projectId }) {
  const [requests, setRequests] = useState([])
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedRequest, setExpandedRequest] = useState(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [showResolutionForm, setShowResolutionForm] = useState(null)

  // New request form state
  const [newRequest, setNewRequest] = useState({
    issue_title: '',
    issue_description: '',
    severity: 'medium',
    warranty_related: false
  })

  // Resolution form state
  const [resolutionData, setResolutionData] = useState({
    notes: '',
    rating: null
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [requestsData, statsData] = await Promise.all([
        getServiceRequests(projectId),
        getServiceRequestStats(projectId)
      ])

      setRequests(requestsData)
      setStats(statsData)
    } catch (err) {
      console.error('Error loading service requests:', err)
      toast.error('Failed to load service requests')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRequest = async () => {
    if (!newRequest.issue_title.trim()) {
      toast.error('Please enter an issue title')
      return
    }

    if (!newRequest.issue_description.trim()) {
      toast.error('Please enter an issue description')
      return
    }

    setSaving(true)
    try {
      const result = await createServiceRequest({
        project_id: projectId,
        issue_title: newRequest.issue_title,
        issue_description: newRequest.issue_description,
        severity: newRequest.severity,
        warranty_related: newRequest.warranty_related
      })

      if (result.success) {
        toast.success('Service request created successfully')
        setNewRequest({
          issue_title: '',
          issue_description: '',
          severity: 'medium',
          warranty_related: false
        })
        setShowNewForm(false)
        await loadData()
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error creating request:', err)
      toast.error('Failed to create service request')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (requestId, newStatus) => {
    setSaving(true)
    try {
      const result = await updateServiceRequestStatus(
        requestId,
        newStatus,
        `Status changed to ${newStatus}`
      )

      if (result.success) {
        toast.success(`Request marked as ${newStatus}`)
        await loadData()
        setExpandedRequest(null)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error updating status:', err)
      toast.error('Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const handleResolveRequest = async (requestId) => {
    if (!resolutionData.notes.trim() && !resolutionData.rating) {
      toast.error('Please enter resolution notes or a satisfaction rating')
      return
    }

    setSaving(true)
    try {
      const result = await resolveServiceRequest(
        requestId,
        resolutionData.notes,
        resolutionData.rating
      )

      if (result.success) {
        toast.success('Service request resolved')
        setResolutionData({ notes: '', rating: null })
        setShowResolutionForm(null)
        await loadData()
        setExpandedRequest(null)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('Error resolving request:', err)
      toast.error('Failed to resolve request')
    } finally {
      setSaving(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4" />
      case 'in_progress':
        return <Clock className="w-4 h-4" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />
      case 'closed':
        return <X className="w-4 h-4" />
      default:
        return null
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading service requests...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 shadow-sm">
          <div className="text-sm text-yellow-700">Open</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.open}</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
          <div className="text-sm text-blue-700">In Progress</div>
          <div className="text-2xl font-bold text-blue-900">{stats.in_progress}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 shadow-sm">
          <div className="text-sm text-green-700">Resolved</div>
          <div className="text-2xl font-bold text-green-900">{stats.resolved}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-sm text-gray-700">Closed</div>
          <div className="text-2xl font-bold text-gray-900">{stats.closed}</div>
        </div>
      </div>

      {/* New Request Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {/* New Request Form */}
      {showNewForm && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Service Request</h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Title *
              </label>
              <input
                type="text"
                value={newRequest.issue_title}
                onChange={(e) => setNewRequest({ ...newRequest, issue_title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the issue"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Description *
              </label>
              <textarea
                value={newRequest.issue_description}
                onChange={(e) =>
                  setNewRequest({ ...newRequest, issue_description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed description of the issue"
                rows="4"
              />
            </div>

            {/* Severity and Warranty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  value={newRequest.severity}
                  onChange={(e) => setNewRequest({ ...newRequest, severity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SERVICE_REQUEST_SEVERITIES.map((sev) => (
                    <option key={sev} value={sev}>
                      {sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRequest.warranty_related}
                    onChange={(e) =>
                      setNewRequest({ ...newRequest, warranty_related: e.target.checked })
                    }
                    className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Warranty Related</span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCreateRequest}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {saving ? 'Creating...' : 'Create Request'}
              </button>
              <button
                onClick={() => setShowNewForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Requests List */}
      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No service requests yet. Create one to get started.
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              {/* Request Header */}
              <button
                onClick={() =>
                  setExpandedRequest(expandedRequest === request.id ? null : request.id)
                }
                className="w-full p-4 hover:bg-gray-50 transition-colors text-left flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900">{request.issue_title}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(
                        request.severity
                      )}`}
                    >
                      {request.severity}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border flex items-center gap-1 ${getStatusColor(
                        request.status
                      )}`}
                    >
                      {getStatusIcon(request.status)}
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {request.issue_description}
                  </p>
                  <div className="text-xs text-gray-500">
                    Created {formatDate(request.created_at)}
                    {request.resolved_at && ` • Resolved ${formatDate(request.resolved_at)}`}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {expandedRequest === request.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Request Details (Expanded) */}
              {expandedRequest === request.id && (
                <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-4">
                  {/* Description */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">Description</h5>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {request.issue_description}
                    </p>
                  </div>

                  {/* Warranty Info */}
                  {request.warranty_related && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                      This request is warranty-related
                    </div>
                  )}

                  {/* Resolution Notes (if resolved) */}
                  {request.resolution_notes && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">
                        Resolution Notes
                      </h5>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {request.resolution_notes}
                      </p>
                    </div>
                  )}

                  {/* Satisfaction Rating */}
                  {request.satisfaction_rating && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">
                        Customer Satisfaction
                      </h5>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-lg ${
                              i < request.satisfaction_rating
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                          ({request.satisfaction_rating}/5)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Status Actions */}
                  {request.status !== 'closed' && request.status !== 'resolved' && (
                    <div className="pt-4 border-t border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-900 mb-3">Update Status</h5>
                      <div className="flex gap-2 flex-wrap">
                        {SERVICE_REQUEST_STATUSES.filter((s) => s !== request.status).map(
                          (status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(request.id, status)}
                              disabled={saving}
                              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 transition-colors font-medium"
                            >
                              Mark as {status.replace('_', ' ')}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resolution Form */}
                  {request.status !== 'resolved' && request.status !== 'closed' && (
                    <div className="pt-4 border-t border-gray-200">
                      {showResolutionForm === request.id ? (
                        <div className="space-y-3 bg-white p-3 rounded border border-gray-200">
                          <h5 className="text-sm font-semibold text-gray-900">Resolve Request</h5>

                          {/* Resolution Notes */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Resolution Notes
                            </label>
                            <textarea
                              value={resolutionData.notes}
                              onChange={(e) =>
                                setResolutionData({ ...resolutionData, notes: e.target.value })
                              }
                              className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Describe how the issue was resolved"
                              rows="3"
                            />
                          </div>

                          {/* Satisfaction Rating */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Customer Satisfaction (optional)
                            </label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  onClick={() =>
                                    setResolutionData({ ...resolutionData, rating })
                                  }
                                  className={`text-2xl transition-colors ${
                                    resolutionData.rating === rating
                                      ? 'text-yellow-400'
                                      : 'text-gray-300 hover:text-yellow-300'
                                  }`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Form Actions */}
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleResolveRequest(request.id)}
                              disabled={saving}
                              className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                            >
                              {saving ? 'Resolving...' : 'Resolve'}
                            </button>
                            <button
                              onClick={() => setShowResolutionForm(null)}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowResolutionForm(request.id)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded transition-colors font-medium border border-green-200"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Resolve Request
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
