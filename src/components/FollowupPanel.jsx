import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  MapPin,
  MessageCircle,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getFollowups,
  createFollowup,
  completeFollowup,
  rescheduleFollowup,
  cancelFollowup,
  FOLLOWUP_TYPES,
  FOLLOWUP_STATUSES,
  COMMUNICATION_METHODS
} from '../lib/followupService';

const FollowupPanel = ({ projectId }) => {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    followup_type: 'general',
    scheduled_date: '',
    communication_method: 'phone',
    contact_person: '',
    notes: ''
  });

  // Fetch followups on component mount
  useEffect(() => {
    loadFollowups();
  }, [projectId]);

  const loadFollowups = async () => {
    setLoading(true);
    const { data, error } = await getFollowups(projectId);
    if (error) {
      toast.error('Failed to load followups');
      console.error(error);
    } else {
      setFollowups(data);
    }
    setLoading(false);
  };

  const isOverdue = (scheduledDate, status) => {
    if (status !== 'pending') return false;
    return new Date(scheduledDate) < new Date();
  };

  const getStatusColor = (status) => {
    const statusMap = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      rescheduled: 'bg-blue-100 text-blue-800 border-blue-300',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-300',
      overdue: 'bg-red-100 text-red-800 border-red-300'
    };
    return statusMap[status] || statusMap.pending;
  };

  const getCommunicationIcon = (method) => {
    const iconMap = {
      phone: <Phone className="w-4 h-4" />,
      email: <Mail className="w-4 h-4" />,
      visit: <MapPin className="w-4 h-4" />,
      whatsapp: <MessageCircle className="w-4 h-4" />,
      message: <MessageSquare className="w-4 h-4" />
    };
    return iconMap[method] || <Clock className="w-4 h-4" />;
  };

  const handleSubmitFollowup = async (e) => {
    e.preventDefault();

    if (!formData.scheduled_date) {
      toast.error('Please select a date and time');
      return;
    }

    const data = {
      project_id: projectId,
      followup_type: formData.followup_type,
      scheduled_date: new Date(formData.scheduled_date).toISOString(),
      communication_method: formData.communication_method,
      contact_person: formData.contact_person || null,
      notes: formData.notes || null,
      status: 'pending'
    };

    const { error } = await createFollowup(data);
    if (error) {
      toast.error('Failed to create followup');
      console.error(error);
    } else {
      toast.success('Followup scheduled successfully');
      setFormData({
        followup_type: 'general',
        scheduled_date: '',
        communication_method: 'phone',
        contact_person: '',
        notes: ''
      });
      setShowForm(false);
      loadFollowups();
    }
  };

  const handleCompleteFollowup = async (id, outcome) => {
    const { error } = await completeFollowup(id, outcome);
    if (error) {
      toast.error('Failed to complete followup');
      console.error(error);
    } else {
      toast.success('Followup completed');
      loadFollowups();
      setExpandedId(null);
    }
  };

  const handleRescheduleFollowup = async (id, newDate, reason) => {
    if (!newDate) {
      toast.error('Please select a new date');
      return;
    }

    const { error } = await rescheduleFollowup(
      id,
      new Date(newDate).toISOString(),
      reason
    );
    if (error) {
      toast.error('Failed to reschedule followup');
      console.error(error);
    } else {
      toast.success('Followup rescheduled');
      loadFollowups();
      setExpandedId(null);
    }
  };

  const handleCancelFollowup = async (id, reason) => {
    const { error } = await cancelFollowup(id, reason);
    if (error) {
      toast.error('Failed to cancel followup');
      console.error(error);
    } else {
      toast.success('Followup cancelled');
      loadFollowups();
      setExpandedId(null);
    }
  };

  // Separate and sort followups
  const overdueFollowups = followups.filter(
    f => isOverdue(f.scheduled_date, f.status)
  );
  const filteredFollowups = followups.filter(f => {
    const statusMatch = filterStatus === 'all' || f.status === filterStatus;
    const typeMatch = filterType === 'all' || f.followup_type === filterType;
    return statusMatch && typeMatch;
  });

  const getTypeLabel = (type) => {
    const found = FOLLOWUP_TYPES.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getMethodLabel = (method) => {
    const found = COMMUNICATION_METHODS.find(m => m.value === method);
    return found ? found.label : method;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Clock className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Follow-ups</h2>
          <p className="text-sm text-gray-600 mt-1">
            {followups.length} total follow-ups
            {overdueFollowups.length > 0 && (
              <span className="ml-2 text-red-600 font-semibold">
                ({overdueFollowups.length} overdue)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Schedule Followup
        </button>
      </div>

      {/* Overdue Section */}
      {overdueFollowups.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">
                {overdueFollowups.length} Overdue Follow-up{overdueFollowups.length !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-red-700 mt-1">
                These follow-ups are past their scheduled date and still pending.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Followup Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Schedule New Follow-up</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFollowup} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Type
                  </label>
                  <select
                    value={formData.followup_type}
                    onChange={(e) =>
                      setFormData({ ...formData, followup_type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {FOLLOWUP_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Communication Method
                  </label>
                  <select
                    value={formData.communication_method}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        communication_method: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {COMMUNICATION_METHODS.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  placeholder="Name or title"
                  value={formData.contact_person}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_person: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  placeholder="Additional details..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Filter by Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            {FOLLOWUP_STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Filter by Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            {FOLLOWUP_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline View */}
      <div className="space-y-3">
        {filteredFollowups.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No follow-ups match your filters</p>
          </div>
        ) : (
          filteredFollowups.map((followup) => {
            const isOverdueItem = isOverdue(followup.scheduled_date, followup.status);
            const displayStatus = isOverdueItem && followup.status === 'pending' ? 'overdue' : followup.status;

            return (
              <div
                key={followup.id}
                className={`border rounded-lg overflow-hidden transition ${
                  isOverdueItem
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:shadow-md'
                }`}
              >
                <button
                  onClick={() =>
                    setExpandedId(expandedId === followup.id ? null : followup.id)
                  }
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    {/* Status Badge */}
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        displayStatus
                      )}`}
                    >
                      {displayStatus === 'overdue' ? 'Overdue' : displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">
                          {getTypeLabel(followup.followup_type)}
                        </h4>
                        {followup.communication_method && (
                          <span className="text-gray-500">
                            {getCommunicationIcon(followup.communication_method)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        <Calendar className="w-3 h-3 inline mr-1" />
                        {formatDate(followup.scheduled_date)}
                      </p>
                      {followup.contact_person && (
                        <p className="text-sm text-gray-600">
                          Contact: {followup.contact_person}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Expand Icon */}
                  {expandedId === followup.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* Expanded Details */}
                {expandedId === followup.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                    {/* Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 font-medium">Type</p>
                        <p className="text-gray-900">
                          {getTypeLabel(followup.followup_type)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Method</p>
                        <p className="text-gray-900">
                          {followup.communication_method
                            ? getMethodLabel(followup.communication_method)
                            : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Contact Person</p>
                        <p className="text-gray-900">
                          {followup.contact_person || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 font-medium">Assigned To</p>
                        <p className="text-gray-900">
                          {followup.assigned_to ? 'User ID: ' + followup.assigned_to : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Notes */}
                    {followup.notes && (
                      <div>
                        <p className="text-gray-600 font-medium text-sm mb-2">
                          Notes
                        </p>
                        <p className="text-gray-900 text-sm bg-white p-3 rounded border border-gray-200">
                          {followup.notes}
                        </p>
                      </div>
                    )}

                    {/* Outcome */}
                    {followup.outcome && (
                      <div>
                        <p className="text-gray-600 font-medium text-sm mb-2">
                          Outcome
                        </p>
                        <p className="text-gray-900 text-sm bg-white p-3 rounded border border-gray-200">
                          {followup.outcome}
                        </p>
                      </div>
                    )}

                    {/* Completed Date */}
                    {followup.completed_date && (
                      <p className="text-xs text-gray-600">
                        Completed: {formatDate(followup.completed_date)}
                      </p>
                    )}

                    {/* Actions */}
                    {followup.status !== 'completed' && followup.status !== 'cancelled' && (
                      <div className="space-y-3 pt-4 border-t">
                        {displayStatus === 'pending' && (
                          <>
                            <CompleteFollowupForm
                              followup={followup}
                              onComplete={(outcome) =>
                                handleCompleteFollowup(followup.id, outcome)
                              }
                            />
                            <RescheduleFollowupForm
                              followup={followup}
                              onReschedule={(newDate, reason) =>
                                handleRescheduleFollowup(followup.id, newDate, reason)
                              }
                            />
                          </>
                        )}
                        <CancelFollowupForm
                          followup={followup}
                          onCancel={(reason) =>
                            handleCancelFollowup(followup.id, reason)
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Complete Followup Form Component
const CompleteFollowupForm = ({ followup, onComplete }) => {
  const [showForm, setShowForm] = useState(false);
  const [outcome, setOutcome] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(outcome);
    setOutcome('');
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded hover:bg-green-200 transition text-sm font-medium"
      >
        <CheckCircle className="w-4 h-4" />
        Mark Complete
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-3 rounded border border-green-200">
      <textarea
        placeholder="What was the outcome?"
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        rows="2"
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          Complete
        </button>
      </div>
    </form>
  );
};

// Reschedule Followup Form Component
const RescheduleFollowupForm = ({ followup, onReschedule }) => {
  const [showForm, setShowForm] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onReschedule(newDate, reason);
    setNewDate('');
    setReason('');
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200 transition text-sm font-medium"
      >
        <Edit2 className="w-4 h-4" />
        Reschedule
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-3 rounded border border-blue-200">
      <input
        type="datetime-local"
        value={newDate}
        onChange={(e) => setNewDate(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      />
      <input
        type="text"
        placeholder="Reason for rescheduling"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Reschedule
        </button>
      </div>
    </form>
  );
};

// Cancel Followup Form Component
const CancelFollowupForm = ({ followup, onCancel }) => {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCancel(reason);
    setReason('');
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition text-sm font-medium"
      >
        <Trash2 className="w-4 h-4" />
        Cancel Followup
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white p-3 rounded border border-gray-200">
      <input
        type="text"
        placeholder="Reason for cancellation"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition"
        >
          Close
        </button>
        <button
          type="submit"
          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default FollowupPanel;
