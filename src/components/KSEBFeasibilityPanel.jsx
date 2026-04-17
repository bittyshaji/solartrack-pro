import React, { useEffect, useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getFeasibility,
  createFeasibility,
  updateFeasibility,
  submitFeasibility,
  updateFeasibilityStatus,
  approveFeasibility,
  rejectFeasibility,
  requestRevision,
  addDocument,
  removeDocument,
  SUBMISSION_STATUSES,
  DOCUMENT_TYPES,
  SYSTEM_TYPES,
  MOUNTING_TYPES
} from '../lib/ksebFeasibilityService';

const STATUS_CONFIG = {
  [SUBMISSION_STATUSES.DRAFT]: {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800',
    icon: FileText,
    step: 1
  },
  [SUBMISSION_STATUSES.SUBMITTED]: {
    label: 'Submitted',
    color: 'bg-blue-100 text-blue-800',
    icon: Send,
    step: 2
  },
  [SUBMISSION_STATUSES.UNDER_REVIEW]: {
    label: 'Under Review',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    step: 3
  },
  [SUBMISSION_STATUSES.APPROVED]: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    step: 4
  },
  [SUBMISSION_STATUSES.REJECTED]: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    step: 4
  },
  [SUBMISSION_STATUSES.REVISION_REQUESTED]: {
    label: 'Revision Requested',
    color: 'bg-orange-100 text-orange-800',
    icon: RefreshCw,
    step: 2.5
  },
  [SUBMISSION_STATUSES.RESUBMITTED]: {
    label: 'Resubmitted',
    color: 'bg-blue-100 text-blue-800',
    icon: Send,
    step: 3
  }
};

const DOCUMENT_TYPE_CONFIG = {
  [DOCUMENT_TYPES.SITE_PLAN]: { label: 'Site Plan', required: true },
  [DOCUMENT_TYPES.ELECTRICAL_DRAWINGS]: { label: 'Electrical Drawings', required: true },
  [DOCUMENT_TYPES.CUSTOMER_DETAILS]: { label: 'Customer Details', required: true },
  [DOCUMENT_TYPES.PROPERTY_DOCS]: { label: 'Property Documents', required: true },
  [DOCUMENT_TYPES.SANCTION_LETTER]: { label: 'Sanction Letter', required: false },
  [DOCUMENT_TYPES.TEST_REPORT]: { label: 'Test Report', required: false },
  [DOCUMENT_TYPES.OTHER]: { label: 'Other Documents', required: false }
};

export default function KSEBFeasibilityPanel({ projectId }) {
  const [feasibility, setFeasibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    systemSpecs: true,
    documents: true,
    activity: false
  });

  const [formData, setFormData] = useState({
    capacityKw: '',
    systemType: SYSTEM_TYPES.RESIDENTIAL,
    inverterMake: '',
    inverterModel: '',
    panelMake: '',
    panelModel: '',
    mountingType: MOUNTING_TYPES.ROOF,
    ksebDivision: '',
    referenceNumber: ''
  });

  const [documentUpload, setDocumentUpload] = useState({
    documentType: DOCUMENT_TYPES.SITE_PLAN,
    file: null
  });

  const [statusAction, setStatusAction] = useState({
    type: null,
    reason: '',
    approvalDate: '',
    sanctionLetterFile: null
  });

  useEffect(() => {
    fetchFeasibility();
  }, [projectId]);

  const fetchFeasibility = async () => {
    try {
      setLoading(true);
      const data = await getFeasibility(projectId);

      if (data) {
        setFeasibility(data);
        setFormData({
          capacityKw: data.capacity_kw || '',
          systemType: data.system_type || SYSTEM_TYPES.RESIDENTIAL,
          inverterMake: data.inverter_make || '',
          inverterModel: data.inverter_model || '',
          panelMake: data.panel_make || '',
          panelModel: data.panel_model || '',
          mountingType: data.mounting_type || MOUNTING_TYPES.ROOF,
          ksebDivision: data.kseb_division || '',
          referenceNumber: data.reference_number || ''
        });
      }
    } catch (error) {
      console.error('Error fetching feasibility:', error);
      toast.error('Failed to load feasibility data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeasibility = async () => {
    try {
      setSubmitting(true);
      const newFeasibility = await createFeasibility(projectId, formData);
      setFeasibility(newFeasibility);
      toast.success('Feasibility submission created');
    } catch (error) {
      console.error('Error creating feasibility:', error);
      toast.error('Failed to create feasibility submission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateField = async (field, value) => {
    try {
      const updates = { [field]: value };
      const updated = await updateFeasibility(feasibility.id, updates);
      setFeasibility(updated);
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      toast.success('Updated successfully');
    } catch (error) {
      console.error('Error updating field:', error);
      toast.error('Failed to update field');
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.capacityKw || !formData.inverterMake || !formData.panelMake) {
        toast.error('Please fill in all required fields');
        return;
      }

      setSubmitting(true);
      const updated = await submitFeasibility(feasibility.id);
      setFeasibility(updated);
      toast.success('Feasibility submitted successfully');
    } catch (error) {
      console.error('Error submitting feasibility:', error);
      toast.error('Failed to submit feasibility');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      if (!statusAction.type) {
        toast.error('Please select an action');
        return;
      }

      setSubmitting(true);

      let updated;
      switch (statusAction.type) {
        case 'approve':
          if (!statusAction.approvalDate) {
            toast.error('Please enter approval date');
            setSubmitting(false);
            return;
          }
          updated = await approveFeasibility(
            feasibility.id,
            statusAction.approvalDate,
            feasibility.sanction_letter_url
          );
          toast.success('Feasibility approved');
          break;

        case 'reject':
          if (!statusAction.reason) {
            toast.error('Please enter rejection reason');
            setSubmitting(false);
            return;
          }
          updated = await rejectFeasibility(feasibility.id, statusAction.reason);
          toast.success('Feasibility rejected');
          break;

        case 'revision':
          if (!statusAction.reason) {
            toast.error('Please enter revision reason');
            setSubmitting(false);
            return;
          }
          updated = await requestRevision(feasibility.id, statusAction.reason);
          toast.success('Revision requested');
          break;

        case 'resubmit':
          updated = await submitFeasibility(feasibility.id);
          toast.success('Feasibility resubmitted');
          break;

        default:
          throw new Error('Unknown action');
      }

      setFeasibility(updated);
      setStatusAction({ type: null, reason: '', approvalDate: '', sanctionLetterFile: null });
    } catch (error) {
      console.error('Error changing status:', error);
      toast.error('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDocumentUpload = async () => {
    try {
      if (!documentUpload.file) {
        toast.error('Please select a file');
        return;
      }

      setSubmitting(true);

      // Simulate file upload - in production, use Supabase Storage
      const fileUrl = `/documents/${feasibility.id}/${documentUpload.file.name}`;

      const newDocument = await addDocument(feasibility.id, {
        documentType: documentUpload.documentType,
        fileName: documentUpload.file.name,
        fileUrl
      });

      setFeasibility(prev => ({
        ...prev,
        documents: [newDocument, ...prev.documents]
      }));

      setDocumentUpload({ documentType: DOCUMENT_TYPES.SITE_PLAN, file: null });
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveDocument = async (docId) => {
    try {
      await removeDocument(docId);
      setFeasibility(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d.id !== docId)
      }));
      toast.success('Document removed');
    } catch (error) {
      console.error('Error removing document:', error);
      toast.error('Failed to remove document');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin">
          <Clock className="w-8 h-8 text-blue-600" />
        </div>
      </div>
    );
  }

  if (!feasibility) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">KSEB Feasibility Submission</h3>
        <p className="text-gray-600 mb-6">No feasibility submission found. Create one to get started.</p>
        <button
          onClick={handleCreateFeasibility}
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Create Feasibility Submission
        </button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[feasibility.submission_status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Status Workflow */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Submission Status</h3>

        <div className="flex items-center gap-4 mb-6">
          <div className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 ${statusConfig.color}`}>
            <StatusIcon className="w-5 h-5" />
            {statusConfig.label}
          </div>
          {feasibility.submission_date && (
            <div className="text-sm text-gray-600">
              Submitted: {new Date(feasibility.submission_date).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Status Workflow Visualization */}
        <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
          {[
            { status: SUBMISSION_STATUSES.DRAFT, label: 'Draft' },
            { status: SUBMISSION_STATUSES.SUBMITTED, label: 'Submitted' },
            { status: SUBMISSION_STATUSES.UNDER_REVIEW, label: 'Review' },
            { status: SUBMISSION_STATUSES.APPROVED, label: 'Approved' }
          ].map((step, index) => {
            const isActive = STATUS_CONFIG[feasibility.submission_status].step >= STATUS_CONFIG[step.status].step;
            const StepIcon = STATUS_CONFIG[step.status].icon;

            return (
              <div key={step.status} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-gray-300 bg-gray-100'
                  }`}
                >
                  <StepIcon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <div className="px-2 text-sm font-medium text-gray-700">{step.label}</div>
                {index < 3 && (
                  <div className={`flex-1 h-0.5 ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Approval Details */}
        {feasibility.submission_status === SUBMISSION_STATUSES.APPROVED && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Approved</p>
                {feasibility.approval_date && (
                  <p className="text-sm text-green-700 mt-1">
                    Approval Date: {new Date(feasibility.approval_date).toLocaleDateString()}
                  </p>
                )}
                {feasibility.reviewer_name && (
                  <p className="text-sm text-green-700">
                    Approved By: {feasibility.reviewer_name}
                  </p>
                )}
                {feasibility.sanction_letter_url && (
                  <a
                    href={feasibility.sanction_letter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-green-600 hover:text-green-700 mt-2 inline-flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Sanction Letter
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejection Details */}
        {feasibility.submission_status === SUBMISSION_STATUSES.REJECTED && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Rejected</p>
                {feasibility.reviewer_comments && (
                  <p className="text-sm text-red-700 mt-1">{feasibility.reviewer_comments}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Revision Requested */}
        {feasibility.submission_status === SUBMISSION_STATUSES.REVISION_REQUESTED && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-orange-900">Revision Required</p>
                {feasibility.revision_reason && (
                  <p className="text-sm text-orange-700 mt-1">{feasibility.revision_reason}</p>
                )}
                <p className="text-sm text-orange-700 mt-2">
                  Revisions Requested: {feasibility.revision_count}
                </p>
                {[SUBMISSION_STATUSES.DRAFT, SUBMISSION_STATUSES.REVISION_REQUESTED].includes(
                  feasibility.submission_status
                ) && (
                  <button
                    onClick={() => setStatusAction({ ...statusAction, type: 'resubmit' })}
                    disabled={submitting}
                    className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                  >
                    Resubmit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* System Specifications */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => toggleSection('systemSpecs')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold">System Specifications</h3>
          {expandedSections.systemSpecs ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {expandedSections.systemSpecs && (
          <div className="px-6 pb-6 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Capacity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity (kW) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.capacityKw}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, capacityKw: e.target.value }));
                    if (feasibility && e.target.value) {
                      handleUpdateField('capacityKw', parseFloat(e.target.value));
                    }
                  }}
                  disabled={![SUBMISSION_STATUSES.DRAFT, SUBMISSION_STATUSES.REVISION_REQUESTED].includes(feasibility.submission_status)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>

              {/* System Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Type *
                </label>
                <select
                  value={formData.systemType}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, systemType: e.target.value }));
                    if (feasibility) {
                      handleUpdateField('systemType', e.target.value);
                    }
                  }}
                  disabled={![SUBMISSION_STATUSES.DRAFT, SUBMISSION_STATUSES.REVISION_REQUESTED].includes(feasibility.submission_status)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  <option value={SYSTEM_TYPES.RESIDENTIAL}>Residential</option>
                  <option value={SYSTEM_TYPES.COMMERCIAL}>Commercial</option>
                  <option value={SYSTEM_TYPES.INDUSTRIAL}>Industrial</option>
                </select>
              </div>

              {/* Inverter Make */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inverter Make *
                </label>
                <input
                  type="text"
                  value={formData.inverterMake}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, inverterMake: e.target.value }));
                    if (feasibility && e.target.value) {
                      handleUpdateField('inverterMake', e.target.value);
                    }
                  }}
                  disabled={![SUBMISSION_STATUSES.DRAFT, SUBMISSION_STATUSES.REVISION_REQUESTED].includes(feasibility.submission_status)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>

              {/* Inverter Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inverter Model
                </label>
                <input
                  type="text"
                  value={formData.inverterModel}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, inverterModel: e.target.value }));
                    if (feasibility && e.target.value) {
                      handleUpdateField('inverterModel', e.target.value);
                    }
                  }}
                  disabled={![SUBMISSION_STATUSES.DRAFT, SUBMISSION_STATUSES.REVISION_REQUESTED].includes(feasibility.submission_status)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>

              {/* Panel Make */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Panel Make *
                </label>
                <input
                  type="text"
                  value={formData.panelMake}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, panelMake: e.target.value }));
                    if (feasibility && e.target.value) {
                      handleUpdateField('panelMake', e.target.value);
                    }
                  }}
                  disabled={![SUBMISSION_STATUSES.DRAFT, SUBMISSION_STATUSES.REVISION_REQUESTED].includes(feasibility.submission_status)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>

              {/* Panel Model */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Panel Model
                </label>
                <input
                  type="text"
                  value={formData.panelModel}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, panelModel: e.target.value }));
                    if (feasibility && e.target.value) {
                      handleUpdateField('panelModel', e.target.value);
                    }
                  }}
                  disabled={![SUBMISSION_STATUSES.DRAFT, SUBMISSION_STATUSES.REVISION_REQUESTED].includes(feasibility.submission_status)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                />
              </div>

              {/* Mounting Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mounting Type
                </label>
                <select
                  value={formData.mountingType}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, mountingType: e.target.value }));
                    if (feasibility) {
                      handleUpdateField('mountingType', e.target.value);
                    }
                  }}
                  disabled={![SUBMISSION_STATUSES.DRAFT, SUBMISSION_STATUSES.REVISION_REQUESTED].includes(feasibility.submission_status)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                >
                  <option value={MOUNTING_TYPES.ROOF}>Roof</option>
                  <option value={MOUNTING_TYPES.GROUND}>Ground</option>
                  <option value={MOUNTING_TYPES.HYBRID}>Hybrid</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KSEB Details */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => toggleSection('ksebDetails')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold">KSEB Details</h3>
          {expandedSections.ksebDetails ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {expandedSections.ksebDetails && (
          <div className="px-6 pb-6 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* KSEB Division */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  KSEB Division
                </label>
                <input
                  type="text"
                  value={formData.ksebDivision}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, ksebDivision: e.target.value }));
                    if (feasibility && e.target.value) {
                      handleUpdateField('ksebDivision', e.target.value);
                    }
                  }}
                  disabled={![SUBMISSION_STATUSES.DRAFT, SUBMISSION_STATUSES.REVISION_REQUESTED].includes(feasibility.submission_status)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="e.g., Kannur, Kottayam"
                />
              </div>

              {/* Reference Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={e => {
                    setFormData(prev => ({ ...prev, referenceNumber: e.target.value }));
                    if (feasibility && e.target.value) {
                      handleUpdateField('referenceNumber', e.target.value);
                    }
                  }}
                  disabled={![SUBMISSION_STATUSES.DRAFT, SUBMISSION_STATUSES.REVISION_REQUESTED].includes(feasibility.submission_status)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                  placeholder="KSEB reference number"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Document Management */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => toggleSection('documents')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold">Documents</h3>
          {expandedSections.documents ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {expandedSections.documents && (
          <div className="px-6 pb-6 border-t space-y-6">
            {/* Document Upload Form */}
            {[SUBMISSION_STATUSES.DRAFT, SUBMISSION_STATUSES.REVISION_REQUESTED].includes(
              feasibility.submission_status
            ) && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <h4 className="font-semibold text-gray-900">Upload Document</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Type
                    </label>
                    <select
                      value={documentUpload.documentType}
                      onChange={e => setDocumentUpload(prev => ({ ...prev, documentType: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(DOCUMENT_TYPE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label} {config.required ? '*' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select File
                    </label>
                    <input
                      type="file"
                      onChange={e => setDocumentUpload(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleDocumentUpload}
                  disabled={submitting || !documentUpload.file}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Document
                </button>
              </div>
            )}

            {/* Document List */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
              {feasibility.documents && feasibility.documents.length > 0 ? (
                <div className="space-y-3">
                  {feasibility.documents.map(doc => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {DOCUMENT_TYPE_CONFIG[doc.document_type]?.label || doc.document_type}
                          </p>
                          <p className="text-sm text-gray-600 truncate">{doc.file_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">v{doc.version_number}</span>
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded ${
                                doc.document_status === 'verified'
                                  ? 'bg-green-100 text-green-800'
                                  : doc.document_status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {doc.document_status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 hover:text-blue-600"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                        {[SUBMISSION_STATUSES.DRAFT, SUBMISSION_STATUSES.REVISION_REQUESTED].includes(
                          feasibility.submission_status
                        ) && (
                          <button
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="p-2 text-gray-600 hover:text-red-600"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No documents uploaded yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Status Actions</h3>

        {feasibility.submission_status === SUBMISSION_STATUSES.DRAFT && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            Submit for Review
          </button>
        )}

        {feasibility.submission_status === SUBMISSION_STATUSES.REVISION_REQUESTED && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Resubmit
          </button>
        )}

        {feasibility.submission_status === SUBMISSION_STATUSES.UNDER_REVIEW && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Approval Date
                </label>
                <input
                  type="date"
                  value={statusAction.approvalDate}
                  onChange={e => setStatusAction(prev => ({ ...prev, approvalDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection/Revision Reason
                </label>
                <input
                  type="text"
                  value={statusAction.reason}
                  onChange={e => setStatusAction(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reason if applicable"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStatusAction(prev => ({ ...prev, type: 'approve' }));
                  handleStatusChange();
                }}
                disabled={submitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  setStatusAction(prev => ({ ...prev, type: 'revision' }));
                  handleStatusChange();
                }}
                disabled={submitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                Request Revision
              </button>
              <button
                onClick={() => {
                  setStatusAction(prev => ({ ...prev, type: 'reject' }));
                  handleStatusChange();
                }}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-lg shadow">
        <button
          onClick={() => toggleSection('activity')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50"
        >
          <h3 className="text-lg font-semibold">Activity Log</h3>
          {expandedSections.activity ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {expandedSections.activity && (
          <div className="px-6 pb-6 border-t">
            {feasibility.activityLogs && feasibility.activityLogs.length > 0 ? (
              <div className="space-y-4">
                {feasibility.activityLogs.map((log, index) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-blue-600 rounded-full mt-2" />
                      {index < feasibility.activityLogs.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-semibold text-gray-900">{log.activity_type}</p>
                      {log.description && (
                        <p className="text-gray-600 text-sm mt-1">{log.description}</p>
                      )}
                      {log.previous_status && log.new_status && (
                        <p className="text-gray-500 text-xs mt-1">
                          {log.previous_status} → {log.new_status}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs mt-2">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No activity recorded yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
