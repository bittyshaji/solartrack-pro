import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Lock,
  Unlock,
  Shield,
  CheckCircle,
  FileText,
  DollarSign,
  PenTool,
  AlertCircle,
  Calendar,
  Upload,
  ChevronRight,
} from 'lucide-react';
import {
  getSecurityStatus,
  updateSecureStatus,
  completeRequirement,
  secureProject,
  unsecureProject,
  checkAllRequirementsMet,
  getRequirementLabel,
  formatCurrency,
  SECURE_STATUSES,
  REQUIREMENT_TYPES,
} from '../lib/projectSecureService';

const ProjectSecurePanel = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [securityData, setSecurityData] = useState({
    status: null,
    requirements: [],
  });
  const [allRequirementsMet, setAllRequirementsMet] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [advancePaymentAmount, setAdvancePaymentAmount] = useState('');
  const [advancePaymentDate, setAdvancePaymentDate] = useState('');
  const [customerSignatureName, setCustomerSignatureName] = useState('');
  const [completingRequirement, setCompletingRequirement] = useState(null);

  // Load security status on mount
  useEffect(() => {
    fetchSecurityStatus();
  }, [projectId]);

  // Check requirements whenever status changes
  useEffect(() => {
    checkRequirements();
  }, [securityData.requirements]);

  const fetchSecurityStatus = async () => {
    try {
      setLoading(true);
      const data = await getSecurityStatus(projectId);
      setSecurityData(data);
      if (data.status) {
        setNotes(data.status.notes || '');
        setAdvancePaymentAmount(data.status.advance_payment_amount || '');
        setAdvancePaymentDate(data.status.advance_payment_date || '');
        setCustomerSignatureName(data.status.signed_by_name || '');
      }
    } catch (error) {
      console.warn('No security data available yet:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRequirements = async () => {
    const met = await checkAllRequirementsMet(projectId);
    setAllRequirementsMet(met);
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'secured' && !allRequirementsMet) {
      toast.error('All requirements must be completed before securing');
      return;
    }

    try {
      setSaving(true);
      await updateSecureStatus(projectId, newStatus);
      toast.success(`Project status changed to ${newStatus}`);
      await fetchSecurityStatus();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Failed to update project status');
    } finally {
      setSaving(false);
    }
  };

  const handleSecureProject = async () => {
    if (!allRequirementsMet) {
      toast.error('All requirements must be completed before securing');
      return;
    }

    try {
      setSaving(true);
      const data = {};
      if (advancePaymentAmount) {
        data.advance_payment_amount = parseFloat(advancePaymentAmount);
      }
      if (advancePaymentDate) {
        data.advance_payment_date = advancePaymentDate;
      }
      if (customerSignatureName) {
        data.signed_by_name = customerSignatureName;
        data.signed_at = new Date().toISOString();
      }
      if (notes) {
        data.notes = notes;
      }

      await secureProject(projectId, data);
      toast.success('Project secured successfully!');
      await fetchSecurityStatus();
    } catch (error) {
      console.error('Error securing project:', error);
      toast.error(error.message || 'Failed to secure project');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsecureProject = async () => {
    if (
      !window.confirm(
        'Are you sure you want to revert this project from secured status? This will unlock any locked changes.'
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      await unsecureProject(projectId, 'Manually reverted to quoted status');
      toast.success('Project reverted to quoted status');
      await fetchSecurityStatus();
    } catch (error) {
      console.error('Error unsecuring project:', error);
      toast.error(error.message || 'Failed to revert project status');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteRequirement = async (requirementId) => {
    try {
      setCompletingRequirement(requirementId);
      const proofUrl = `requirement-${requirementId}-${Date.now()}`;
      await completeRequirement(requirementId, proofUrl);
      toast.success('Requirement marked as complete');
      await fetchSecurityStatus();
    } catch (error) {
      console.error('Error completing requirement:', error);
      toast.error('Failed to complete requirement');
    } finally {
      setCompletingRequirement(null);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSaving(true);
      if (securityData.status) {
        await supabase
          .from('project_security_status')
          .update({ notes })
          .eq('id', securityData.status.id);
        toast.success('Notes saved');
      }
      setEditingNotes(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'lead':
        return 'bg-gray-100 text-gray-800';
      case 'quoted':
        return 'bg-blue-100 text-blue-800';
      case 'secured':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'secured') return <Lock size={20} />;
    if (status === 'cancelled') return <AlertCircle size={20} />;
    return <Shield size={20} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading security details...</div>
      </div>
    );
  }

  const currentStatus = securityData.status?.secure_status || 'lead';
  const isSecured = currentStatus === 'secured';
  const isCancelled = currentStatus === 'cancelled';

  return (
    <div className="space-y-6 bg-white">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-600" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Project Security
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage project security status and requirements
              </p>
            </div>
          </div>
          {isSecured && (
            <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg">
              <Lock size={18} className="text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Project Secured
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Status Stepper */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
          Project Status
        </h3>
        <div className="flex items-center justify-between">
          {['lead', 'quoted', 'secured'].map((status, index) => {
            const isActive = currentStatus === status;
            const isPassed =
              SECURE_STATUSES.indexOf(currentStatus) > index;

            return (
              <React.Fragment key={status}>
                <div
                  className={`flex flex-col items-center flex-1 ${
                    index < 2 ? 'relative' : ''
                  }`}
                >
                  <button
                    onClick={() =>
                      !isCancelled && handleStatusChange(status)
                    }
                    disabled={saving || isCancelled || isSecured}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all mb-2 ${
                      isActive || isPassed
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    } ${
                      !isCancelled && !isSecured
                        ? 'hover:bg-blue-700 cursor-pointer'
                        : 'cursor-not-allowed'
                    }`}
                  >
                    {index + 1}
                  </button>
                  <span
                    className={`text-xs font-medium capitalize ${
                      isActive || isPassed
                        ? 'text-blue-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {status}
                  </span>

                  {/* Stepper Line */}
                  {index < 2 && (
                    <div
                      className={`absolute top-5 left-[50%] w-[calc(100%-2rem)] h-1 ${
                        isPassed ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      style={{
                        transform: 'translateX(-50%)',
                        width: 'calc(100% - 2rem)',
                      }}
                    />
                  )}
                </div>
              </React.Fragment>
            );
          })}
          <div className="flex-1" />
        </div>
      </div>

      {/* Warning if trying to secure without all requirements */}
      {!isSecured && !allRequirementsMet && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">
              Complete all requirements to secure this project
            </p>
            <p className="text-sm text-amber-800 mt-1">
              All 4 requirements must be marked complete before you can secure
              the project.
            </p>
          </div>
        </div>
      )}

      {/* Requirements Checklist */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle size={20} className="text-blue-600" />
          Security Requirements
        </h3>

        <div className="space-y-4">
          {securityData.requirements.map((requirement) => {
            const completed = requirement.is_completed;
            const icon = getRequirementIcon(requirement.requirement_type);
            const IconComponent = {
              FileText,
              DollarSign,
              CheckCircle,
              PenTool,
            }[icon] || FileText;

            return (
              <div
                key={requirement.id}
                className={`border rounded-lg p-4 transition-all ${
                  completed
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <div className="flex-shrink-0 mt-1">
                    <button
                      onClick={() =>
                        !completed &&
                        handleCompleteRequirement(requirement.id)
                      }
                      disabled={
                        saving ||
                        isSecured ||
                        completingRequirement === requirement.id
                      }
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        completed
                          ? 'bg-green-600 text-white'
                          : 'border-2 border-gray-300 hover:border-blue-600'
                      }`}
                    >
                      {completed && <CheckCircle size={16} />}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <IconComponent
                            size={18}
                            className={
                              completed ? 'text-green-600' : 'text-gray-600'
                            }
                          />
                          <h4 className="font-medium text-gray-900">
                            {getRequirementLabel(requirement.requirement_type)}
                          </h4>
                        </div>

                        {completed && requirement.completed_date && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-green-700">
                            <Calendar size={14} />
                            Completed on{' '}
                            {new Date(
                              requirement.completed_date
                            ).toLocaleDateString()}
                          </div>
                        )}

                        {requirement.notes && (
                          <p className="text-sm text-gray-600 mt-2">
                            {requirement.notes}
                          </p>
                        )}
                      </div>

                      {!completed && !isSecured && (
                        <button
                          onClick={() =>
                            handleCompleteRequirement(requirement.id)
                          }
                          disabled={
                            saving || completingRequirement === requirement.id
                          }
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          <Upload size={14} />
                          {completingRequirement === requirement.id
                            ? 'Uploading...'
                            : 'Mark Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress indicator */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Requirements Completed
            </span>
            <span className="text-lg font-bold text-blue-600">
              {securityData.requirements.filter((r) => r.is_completed).length}/
              {securityData.requirements.length}
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (securityData.requirements.filter((r) => r.is_completed)
                    .length /
                    securityData.requirements.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Advance Payment Section */}
      <div className="border rounded-lg p-6 bg-gradient-to-br from-green-50 to-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign size={20} className="text-green-600" />
          Advance Payment
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                type="number"
                value={advancePaymentAmount}
                onChange={(e) => setAdvancePaymentAmount(e.target.value)}
                disabled={isSecured || saving}
                placeholder="0.00"
                step="0.01"
                className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Date
            </label>
            <input
              type="date"
              value={advancePaymentDate}
              onChange={(e) => setAdvancePaymentDate(e.target.value)}
              disabled={isSecured || saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {advancePaymentAmount && (
          <div className="mt-4 bg-white border border-green-200 rounded-lg p-3 flex items-center gap-3">
            <CheckCircle size={18} className="text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Advance payment: {formatCurrency(parseFloat(advancePaymentAmount))}
              {advancePaymentDate &&
                ` on ${new Date(advancePaymentDate).toLocaleDateString()}`}
            </span>
          </div>
        )}
      </div>

      {/* Customer Signature Section */}
      <div className="border rounded-lg p-6 bg-gradient-to-br from-purple-50 to-white">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <PenTool size={20} className="text-purple-600" />
          Customer Signature
        </h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Signed By (Customer Name)
          </label>
          <input
            type="text"
            value={customerSignatureName}
            onChange={(e) => setCustomerSignatureName(e.target.value)}
            disabled={isSecured || saving}
            placeholder="John Doe"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {securityData.status?.signed_at && (
          <div className="mt-4 bg-white border border-purple-200 rounded-lg p-3 flex items-center gap-3">
            <CheckCircle size={18} className="text-purple-600" />
            <div className="text-sm">
              <p className="font-medium text-purple-900">Signed by</p>
              <p className="text-purple-700">
                {securityData.status.signed_by_name} on{' '}
                {new Date(securityData.status.signed_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-3">
          Digital signature capture coming soon
        </p>
      </div>

      {/* Notes Section */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Additional Notes
          </h3>
          {!editingNotes && !isSecured && (
            <button
              onClick={() => setEditingNotes(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Edit
            </button>
          )}
        </div>

        {editingNotes && !isSecured ? (
          <div className="space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes about this project's security..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditingNotes(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-700 whitespace-pre-wrap">
            {notes || (
              <span className="text-gray-400 italic">No notes added yet</span>
            )}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t pt-6 flex gap-3 justify-end">
        {isSecured ? (
          <button
            onClick={handleUnsecureProject}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Unlock size={18} />
            Revert to Quoted
          </button>
        ) : !isCancelled ? (
          <>
            <button
              onClick={() => handleStatusChange('cancelled')}
              disabled={saving}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel Project
            </button>
            <button
              onClick={handleSecureProject}
              disabled={saving || !allRequirementsMet}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium text-white rounded-lg transition-colors ${
                allRequirementsMet
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-300 cursor-not-allowed'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Shield size={18} />
              {saving ? 'Securing...' : 'Secure Project'}
            </button>
          </>
        ) : null}
      </div>

      {/* Locked indicator */}
      {isSecured && securityData.status?.lock_changes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Lock size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Project Changes Locked</p>
            <p className="text-sm text-blue-800 mt-1">
              Changes to this project are locked to maintain data integrity after
              being secured.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSecurePanel;
