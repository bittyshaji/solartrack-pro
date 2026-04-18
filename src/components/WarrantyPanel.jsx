import React, { useState, useEffect } from 'react';
import {
  Shield,
  Clock,
  AlertTriangle,
  Wrench,
  DollarSign,
  Calendar,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getWarranty,
  createClaim,
  updateClaimStatus,
  resolveClaim,
  requestExtension,
  approveExtension,
  denyExtension,
  getDaysRemaining,
  formatDaysRemaining,
  getWarrantyStatusColor,
  getClaimStatusColor,
  CLAIM_STATUSES,
  ISSUE_TYPES,
  RESOLUTION_TYPES,
} from '../lib/warrantyService';

const WarrantyPanel = ({ projectId }) => {
  const [warranty, setWarranty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, claims, extension
  const [expandedClaimId, setExpandedClaimId] = useState(null);
  const [showNewClaimForm, setShowNewClaimForm] = useState(false);
  const [showExtensionForm, setShowExtensionForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  // Form states
  const [newClaimForm, setNewClaimForm] = useState({
    claimTitle: '',
    claimDescription: '',
    issueType: ISSUE_TYPES.EQUIPMENT_FAILURE,
    affectedComponent: '',
    claimAmount: '',
  });

  const [extensionForm, setExtensionForm] = useState({
    months: '',
    reason: '',
    cost: '',
  });

  // Fetch warranty data
  useEffect(() => {
    const fetchWarranty = async () => {
      try {
        setLoading(true);
        const data = await getWarranty(projectId);
        setWarranty(data);
      } catch (error) {
        console.warn('No warranty data available yet:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) fetchWarranty();
  }, [projectId]);

  // Handle new claim submission
  const handleCreateClaim = async (e) => {
    e.preventDefault();
    if (!warranty) {
      toast.error('No warranty found for this project');
      return;
    }

    try {
      const claim = await createClaim(warranty.id, projectId, newClaimForm);
      setWarranty({
        ...warranty,
        warranty_claims: [...(warranty.warranty_claims || []), claim],
      });
      setNewClaimForm({
        claimTitle: '',
        claimDescription: '',
        issueType: ISSUE_TYPES.EQUIPMENT_FAILURE,
        affectedComponent: '',
        claimAmount: '',
      });
      setShowNewClaimForm(false);
      toast.success(`Claim ${claim.claim_number} created successfully`);
    } catch (error) {
      console.error('Error creating claim:', error);
      toast.error('Failed to create claim');
    }
  };

  // Handle claim status update
  const handleUpdateClaimStatus = async (claimId, newStatus, notes = '') => {
    try {
      const updatedClaim = await updateClaimStatus(claimId, newStatus, notes);
      setWarranty({
        ...warranty,
        warranty_claims: warranty.warranty_claims.map((c) =>
          c.id === claimId ? updatedClaim : c
        ),
      });
      toast.success('Claim status updated');
    } catch (error) {
      console.error('Error updating claim status:', error);
      toast.error('Failed to update claim status');
    }
  };

  // Handle claim resolution
  const handleResolveClaim = async (claimId, resolutionData) => {
    try {
      const updatedClaim = await resolveClaim(claimId, resolutionData);
      setWarranty({
        ...warranty,
        warranty_claims: warranty.warranty_claims.map((c) =>
          c.id === claimId ? updatedClaim : c
        ),
      });
      setExpandedClaimId(null);
      toast.success('Claim resolved');
    } catch (error) {
      console.error('Error resolving claim:', error);
      toast.error('Failed to resolve claim');
    }
  };

  // Handle extension request
  const handleRequestExtension = async (e) => {
    e.preventDefault();
    if (!warranty) {
      toast.error('No warranty found');
      return;
    }

    try {
      const updated = await requestExtension(
        warranty.id,
        parseInt(extensionForm.months),
        extensionForm.reason,
        parseFloat(extensionForm.cost)
      );
      setWarranty(updated);
      setExtensionForm({ months: '', reason: '', cost: '' });
      setShowExtensionForm(false);
      toast.success('Extension request submitted');
    } catch (error) {
      console.error('Error requesting extension:', error);
      toast.error('Failed to submit extension request');
    }
  };

  // Handle extension approval
  const handleApproveExtension = async () => {
    if (!warranty) return;
    try {
      const updated = await approveExtension(warranty.id);
      setWarranty(updated);
      toast.success('Extension approved');
    } catch (error) {
      console.error('Error approving extension:', error);
      toast.error('Failed to approve extension');
    }
  };

  // Handle extension denial
  const handleDenyExtension = async () => {
    if (!warranty) return;
    const reason = window.prompt('Reason for denial:');
    if (!reason) return;

    try {
      const updated = await denyExtension(warranty.id, reason);
      setWarranty(updated);
      toast.success('Extension request denied');
    } catch (error) {
      console.error('Error denying extension:', error);
      toast.error('Failed to deny extension');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">
          <Shield className="w-8 h-8 text-blue-500" />
        </div>
      </div>
    );
  }

  if (!warranty) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900">No Warranty Found</h3>
            <p className="text-sm text-yellow-700 mt-1">
              This project does not have a warranty record. Please create one to
              manage claims and extensions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining(warranty.warranty_end_date);
  const isExpired = daysRemaining < 0;
  const isExpiringSoon = daysRemaining >= 0 && daysRemaining < 90;
  const progressPercent = Math.max(
    0,
    Math.min(
      100,
      ((warranty.default_warranty_months * 30 - Math.abs(daysRemaining)) /
        (warranty.default_warranty_months * 30)) *
        100
    )
  );

  const claims = warranty.warranty_claims || [];
  const filteredClaims =
    filterStatus === 'all'
      ? claims
      : claims.filter((c) => c.claim_status === filterStatus);

  const claimStats = {
    total: claims.length,
    open: claims.filter((c) => c.claim_status === CLAIM_STATUSES.OPEN).length,
    approved: claims.filter((c) => c.claim_status === CLAIM_STATUSES.APPROVED)
      .length,
    closed: claims.filter((c) => c.claim_status === CLAIM_STATUSES.CLOSED)
      .length,
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'claims'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Claims ({claimStats.total})
        </button>
        <button
          onClick={() => setActiveTab('extension')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'extension'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Extension
        </button>
      </div>

      {/* Expiry Warning */}
      {(isExpiringSoon || isExpired) && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            isExpired
              ? 'bg-red-50 border border-red-200'
              : 'bg-orange-50 border border-orange-200'
          }`}
        >
          <AlertTriangle
            className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
              isExpired ? 'text-red-600' : 'text-orange-600'
            }`}
          />
          <div>
            <h4
              className={`font-semibold ${
                isExpired ? 'text-red-900' : 'text-orange-900'
              }`}
            >
              {isExpired
                ? 'Warranty Expired'
                : 'Warranty Expiring Soon'}
            </h4>
            <p
              className={`text-sm mt-1 ${
                isExpired ? 'text-red-700' : 'text-orange-700'
              }`}
            >
              {isExpired
                ? `Warranty expired ${Math.abs(daysRemaining)} days ago on ${warranty.warranty_end_date}`
                : `Your warranty expires in ${daysRemaining} days (${warranty.warranty_end_date}). Consider requesting an extension.`}
            </p>
          </div>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Warranty Card */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {warranty.warranty_provider || 'Standard Warranty'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {warranty.default_warranty_months}-month coverage
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isExpired
                    ? 'bg-red-100 text-red-800'
                    : isExpiringSoon
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {isExpired ? 'Expired' : 'Active'}
              </span>
            </div>

            {/* Warranty Timeline */}
            <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Start Date
                </p>
                <p className="font-semibold text-gray-900 mt-1">
                  {new Date(warranty.warranty_start_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  End Date
                </p>
                <p className="font-semibold text-gray-900 mt-1">
                  {new Date(warranty.warranty_end_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Days Remaining
                </p>
                <p
                  className={`font-semibold mt-1 ${
                    isExpired ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {Math.abs(daysRemaining)} {isExpired ? 'expired' : 'days'}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Warranty Progress
                </span>
                <span className="text-sm text-gray-600">
                  {formatDaysRemaining(daysRemaining)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isExpired
                      ? 'bg-gray-400'
                      : isExpiringSoon
                      ? 'bg-orange-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Coverage Details */}
            {warranty.coverage_details && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Coverage Details
                </h4>
                <p className="text-sm text-gray-700">{warranty.coverage_details}</p>
              </div>
            )}

            {/* Inclusions & Exclusions */}
            <div className="grid grid-cols-2 gap-6">
              {warranty.inclusions && warranty.inclusions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Included
                  </h4>
                  <ul className="space-y-2">
                    {warranty.inclusions.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-700 flex items-start gap-2"
                      >
                        <span className="text-green-600 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {warranty.exclusions && warranty.exclusions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Excluded
                  </h4>
                  <ul className="space-y-2">
                    {warranty.exclusions.map((item, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-gray-700 flex items-start gap-2"
                      >
                        <span className="text-red-600 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Claims Summary */}
          {claims.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {claimStats.total}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {claimStats.open}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {claimStats.approved}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-gray-600 mt-2">
                  {claimStats.closed}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLAIMS TAB */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus(CLAIM_STATUSES.OPEN)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filterStatus === CLAIM_STATUSES.OPEN
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => setFilterStatus(CLAIM_STATUSES.APPROVED)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filterStatus === CLAIM_STATUSES.APPROVED
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setFilterStatus(CLAIM_STATUSES.CLOSED)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filterStatus === CLAIM_STATUSES.CLOSED
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Closed
              </button>
            </div>
            <button
              onClick={() => setShowNewClaimForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Claim
            </button>
          </div>

          {/* New Claim Form */}
          {showNewClaimForm && (
            <form onSubmit={handleCreateClaim} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">New Warranty Claim</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Claim Title
                </label>
                <input
                  type="text"
                  value={newClaimForm.claimTitle}
                  onChange={(e) =>
                    setNewClaimForm({
                      ...newClaimForm,
                      claimTitle: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief title for the claim"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newClaimForm.claimDescription}
                  onChange={(e) =>
                    setNewClaimForm({
                      ...newClaimForm,
                      claimDescription: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed description of the issue"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Type
                  </label>
                  <select
                    value={newClaimForm.issueType}
                    onChange={(e) =>
                      setNewClaimForm({
                        ...newClaimForm,
                        issueType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={ISSUE_TYPES.EQUIPMENT_FAILURE}>
                      Equipment Failure
                    </option>
                    <option value={ISSUE_TYPES.PERFORMANCE_DROP}>
                      Performance Drop
                    </option>
                    <option value={ISSUE_TYPES.DEFECTIVE_PARTS}>
                      Defective Parts
                    </option>
                    <option value={ISSUE_TYPES.INSTALLATION_DEFECT}>
                      Installation Defect
                    </option>
                    <option value={ISSUE_TYPES.OTHER}>Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Affected Component
                  </label>
                  <input
                    type="text"
                    value={newClaimForm.affectedComponent}
                    onChange={(e) =>
                      setNewClaimForm({
                        ...newClaimForm,
                        affectedComponent: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Inverter, Solar Panel"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Claim Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newClaimForm.claimAmount}
                  onChange={(e) =>
                    setNewClaimForm({
                      ...newClaimForm,
                      claimAmount: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Claim
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewClaimForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Claims List */}
          <div className="space-y-3">
            {filteredClaims.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Wrench className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No claims found</p>
              </div>
            ) : (
              filteredClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div
                    onClick={() =>
                      setExpandedClaimId(
                        expandedClaimId === claim.id ? null : claim.id
                      )
                    }
                    className="cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-gray-900">
                            {claim.claim_title}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              claim.claim_status === CLAIM_STATUSES.OPEN
                                ? 'bg-blue-100 text-blue-800'
                                : claim.claim_status === CLAIM_STATUSES.APPROVED
                                ? 'bg-green-100 text-green-800'
                                : claim.claim_status === CLAIM_STATUSES.DENIED
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {claim.claim_status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {claim.claim_number} • {new Date(claim.claim_date).toLocaleDateString()}
                          {claim.affected_component && ` • ${claim.affected_component}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {claim.claim_amount && (
                          <span className="font-semibold text-gray-900">
                            ${claim.claim_amount.toFixed(2)}
                          </span>
                        )}
                        {expandedClaimId === claim.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Claim Details */}
                  {expandedClaimId === claim.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">
                          Description
                        </h5>
                        <p className="text-sm text-gray-700">
                          {claim.claim_description}
                        </p>
                      </div>

                      {claim.assessment_notes && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">
                            Assessment Notes
                          </h5>
                          <p className="text-sm text-gray-700">
                            {claim.assessment_notes}
                          </p>
                        </div>
                      )}

                      {claim.resolution_description && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">
                            Resolution
                          </h5>
                          <p className="text-sm text-gray-700">
                            {claim.resolution_description}
                          </p>
                          {claim.approved_amount && (
                            <p className="text-sm font-medium text-green-600 mt-2">
                              Approved Amount: ${claim.approved_amount.toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {claim.claim_status === CLAIM_STATUSES.OPEN && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleUpdateClaimStatus(
                                claim.id,
                                CLAIM_STATUSES.UNDER_ASSESSMENT
                              )
                            }
                            className="flex-1 px-3 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors text-sm font-medium"
                          >
                            Start Assessment
                          </button>
                          <button
                            onClick={() => {
                              const reason = window.prompt('Reason for denial:');
                              if (reason)
                                handleUpdateClaimStatus(
                                  claim.id,
                                  CLAIM_STATUSES.DENIED,
                                  reason
                                );
                            }}
                            className="flex-1 px-3 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            Deny
                          </button>
                        </div>
                      )}

                      {claim.claim_status === CLAIM_STATUSES.UNDER_ASSESSMENT && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const approvedAmount = window.prompt(
                                'Approved amount:',
                                claim.claim_amount
                              );
                              if (approvedAmount) {
                                handleResolveClaim(claim.id, {
                                  resolutionType: RESOLUTION_TYPES.REPAIR,
                                  resolutionDescription: 'Approved for repair',
                                  approvedAmount: parseFloat(approvedAmount),
                                });
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = window.prompt(
                                'Reason for denial:'
                              );
                              if (reason)
                                handleUpdateClaimStatus(
                                  claim.id,
                                  CLAIM_STATUSES.DENIED,
                                  reason
                                );
                            }}
                            className="flex-1 px-3 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* EXTENSION TAB */}
      {activeTab === 'extension' && (
        <div className="space-y-4">
          {!warranty.extension_requested && !warranty.extension_approved ? (
            <>
              {!showExtensionForm ? (
                <button
                  onClick={() => setShowExtensionForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Request Warranty Extension
                </button>
              ) : (
                <form onSubmit={handleRequestExtension} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                  <h3 className="font-semibold text-gray-900">
                    Request Warranty Extension
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Months
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={extensionForm.months}
                      onChange={(e) =>
                        setExtensionForm({
                          ...extensionForm,
                          months: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 12"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for Extension
                    </label>
                    <textarea
                      value={extensionForm.reason}
                      onChange={(e) =>
                        setExtensionForm({
                          ...extensionForm,
                          reason: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Why are you requesting an extension?"
                      rows="3"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Extension Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={extensionForm.cost}
                      onChange={(e) =>
                        setExtensionForm({
                          ...extensionForm,
                          cost: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Submit Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowExtensionForm(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : null}

          {/* Extension Request Status */}
          {warranty.extension_requested && !warranty.extension_approved && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-900">
                    Extension Pending Review
                  </h4>
                  <div className="mt-3 space-y-2 text-sm text-yellow-700">
                    <p>
                      <span className="font-medium">Requested months:</span>{' '}
                      {warranty.extension_months_requested}
                    </p>
                    <p>
                      <span className="font-medium">Cost:</span> $
                      {warranty.extension_cost?.toFixed(2) || '0.00'}
                    </p>
                    <p>
                      <span className="font-medium">Reason:</span>{' '}
                      {warranty.extension_request_reason}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={handleApproveExtension}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={handleDenyExtension}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Deny
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Extension Approved */}
          {warranty.extension_approved && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">
                    Extension Approved
                  </h4>
                  <div className="mt-3 space-y-2 text-sm text-green-700">
                    <p>
                      <span className="font-medium">Extension months:</span>{' '}
                      {warranty.extended_warranty_months}
                    </p>
                    <p>
                      <span className="font-medium">New end date:</span>{' '}
                      {new Date(warranty.new_warranty_end_date).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Approved on:</span>{' '}
                      {new Date(warranty.extension_approved_date).toLocaleDateString()}
                    </p>
                    {warranty.extension_cost && (
                      <p>
                        <span className="font-medium">Cost:</span> $
                        {warranty.extension_cost.toFixed(2)}
                      </p>
                    )}
                    {warranty.extension_payment_status && (
                      <p>
                        <span className="font-medium">Payment status:</span>{' '}
                        <span
                          className={`ml-1 ${
                            warranty.extension_payment_status === 'paid'
                              ? 'text-green-700'
                              : warranty.extension_payment_status === 'waived'
                              ? 'text-blue-700'
                              : 'text-yellow-700'
                          }`}
                        >
                          {warranty.extension_payment_status}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WarrantyPanel;
