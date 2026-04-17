import React, { useState, useEffect } from 'react';
import {
  Award,
  FileCheck,
  Send,
  CheckCircle,
  XCircle,
  Download,
  Edit2,
  Save,
  X,
  AlertCircle,
  ZapOff,
  Zap,
  Gauge,
  Percent,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getCertificate,
  generateCertificate,
  updateCertificate,
  submitToKSEB,
  approveCertificate,
  rejectCertificate,
  updatePerformanceResults,
  CERTIFICATE_STATUSES,
  getStatusColor,
  getStatusText
} from '../lib/completionCertificateService';

const CompletionCertificatePanel = ({ projectId }) => {
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPerformanceSection, setShowPerformanceSection] = useState(false);

  const [formData, setFormData] = useState({
    issued_by_name: '',
    system_capacity_kw: '',
    inverter_make: '',
    inverter_model: '',
    panel_make: '',
    panel_model: '',
    total_panels: '',
    installation_completion_date: '',
    commissioned_by: '',
    commissioning_date: '',
    notes: ''
  });

  const [performanceData, setPerformanceData] = useState({
    voltage: '',
    current: '',
    power_output: '',
    efficiency: ''
  });

  const [submissionData, setSubmissionData] = useState({
    submission_date: new Date().toISOString().split('T')[0]
  });

  const [approvalData, setApprovalData] = useState({
    approval_date: new Date().toISOString().split('T')[0],
    kseb_reference_number: ''
  });

  const [rejectionData, setRejectionData] = useState({
    reason: ''
  });

  // Fetch certificate on component mount
  useEffect(() => {
    loadCertificate();
  }, [projectId]);

  const loadCertificate = async () => {
    setLoading(true);
    try {
      const data = await getCertificate(projectId);
      setCertificate(data);

      if (data) {
        setFormData({
          issued_by_name: data.issued_by_name || '',
          system_capacity_kw: data.system_capacity_kw || '',
          inverter_make: data.inverter_make || '',
          inverter_model: data.inverter_model || '',
          panel_make: data.panel_make || '',
          panel_model: data.panel_model || '',
          total_panels: data.total_panels || '',
          installation_completion_date: data.installation_completion_date || '',
          commissioned_by: data.commissioned_by || '',
          commissioning_date: data.commissioning_date || '',
          notes: data.notes || ''
        });

        if (data.performance_test_results) {
          setPerformanceData(data.performance_test_results);
        }
      }
    } catch (error) {
      toast.error('Failed to load certificate');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePerformanceChange = (e) => {
    const { name, value } = e.target;
    setPerformanceData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateCertificate = async (e) => {
    e.preventDefault();

    if (!formData.system_capacity_kw || !formData.inverter_make || !formData.panel_make) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const newCertificate = await generateCertificate(projectId, formData);
      setCertificate(newCertificate);
      setShowGenerateForm(false);
      toast.success('Certificate generated successfully');
      setFormData({
        issued_by_name: '',
        system_capacity_kw: '',
        inverter_make: '',
        inverter_model: '',
        panel_make: '',
        panel_model: '',
        total_panels: '',
        installation_completion_date: '',
        commissioned_by: '',
        commissioning_date: '',
        notes: ''
      });
    } catch (error) {
      toast.error('Failed to generate certificate');
      console.error(error);
    }
  };

  const handleUpdateCertificate = async (e) => {
    e.preventDefault();

    try {
      const updates = {
        ...formData
      };

      const updated = await updateCertificate(certificate.id, updates);
      setCertificate(updated);
      setIsEditMode(false);
      toast.success('Certificate updated successfully');
    } catch (error) {
      toast.error('Failed to update certificate');
      console.error(error);
    }
  };

  const handleSubmitToKSEB = async () => {
    if (!submissionData.submission_date) {
      toast.error('Please select a submission date');
      return;
    }

    try {
      const updated = await submitToKSEB(certificate.id, submissionData.submission_date);
      setCertificate(updated);
      setShowSubmitModal(false);
      toast.success('Certificate submitted to KSEB');
      setSubmissionData({
        submission_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      toast.error('Failed to submit to KSEB');
      console.error(error);
    }
  };

  const handleApproveCertificate = async () => {
    if (!approvalData.approval_date || !approvalData.kseb_reference_number) {
      toast.error('Please fill in all approval details');
      return;
    }

    try {
      const updated = await approveCertificate(
        certificate.id,
        approvalData.approval_date,
        approvalData.kseb_reference_number
      );
      setCertificate(updated);
      setShowApprovalModal(false);
      toast.success('Certificate approved');
      setApprovalData({
        approval_date: new Date().toISOString().split('T')[0],
        kseb_reference_number: ''
      });
    } catch (error) {
      toast.error('Failed to approve certificate');
      console.error(error);
    }
  };

  const handleRejectCertificate = async () => {
    if (!rejectionData.reason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const updated = await rejectCertificate(certificate.id, rejectionData.reason);
      setCertificate(updated);
      setShowRejectModal(false);
      toast.success('Certificate rejected');
      setRejectionData({ reason: '' });
    } catch (error) {
      toast.error('Failed to reject certificate');
      console.error(error);
    }
  };

  const handleUpdatePerformance = async () => {
    if (
      !performanceData.voltage ||
      !performanceData.current ||
      !performanceData.power_output ||
      !performanceData.efficiency
    ) {
      toast.error('Please fill in all performance fields');
      return;
    }

    try {
      const updated = await updatePerformanceResults(certificate.id, performanceData);
      setCertificate(updated);
      setShowPerformanceSection(false);
      toast.success('Performance test results updated');
    } catch (error) {
      toast.error('Failed to update performance results');
      console.error(error);
    }
  };

  const canGenerateCertificate = !certificate;
  const canSubmit = certificate && certificate.approval_status === 'generated';
  const canApprove = certificate && certificate.approval_status === 'submitted';
  const canReject = certificate && ['draft', 'generated', 'submitted'].includes(certificate.approval_status);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Loading certificate...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-blue-200 pb-4">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Completion Certificate</h2>
        </div>
        {certificate && (
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Edit2 className="w-4 h-4" />
            {isEditMode ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>

      {/* Certificate Status Section */}
      {certificate && (
        <div className="bg-white rounded-lg p-6 border border-blue-200">
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Certificate Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Certificate Number</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <span className="font-mono font-semibold text-gray-800">{certificate.certificate_number}</span>
              </div>
            </div>

            {/* Status Badge */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border font-semibold ${getStatusColor(certificate.approval_status)}`}>
                {certificate.approval_status === 'approved' && <CheckCircle className="w-5 h-5" />}
                {certificate.approval_status === 'rejected' && <XCircle className="w-5 h-5" />}
                {certificate.approval_status === 'submitted' && <Send className="w-5 h-5" />}
                {certificate.approval_status === 'generated' && <FileCheck className="w-5 h-5" />}
                {getStatusText(certificate.approval_status)}
              </div>
            </div>
          </div>

          {/* Generation Date */}
          {certificate.generation_date && (
            <div className="text-sm text-gray-600 mb-4">
              Generated on {new Date(certificate.generation_date).toLocaleDateString()}
            </div>
          )}

          {/* Rejection Reason */}
          {certificate.rejection_reason && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Rejection Reason</p>
                <p className="text-red-700 text-sm">{certificate.rejection_reason}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Certificate Form */}
      {!certificate && (
        <div className="bg-white rounded-lg p-6 border border-blue-200">
          {!showGenerateForm ? (
            <button
              onClick={() => setShowGenerateForm(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold"
            >
              <FileCheck className="w-5 h-5" />
              Generate Completion Certificate
            </button>
          ) : (
            <form onSubmit={handleGenerateCertificate} className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Certificate Details</h3>

              {/* System Specs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">System Capacity (kW) *</label>
                  <input
                    type="number"
                    name="system_capacity_kw"
                    value={formData.system_capacity_kw}
                    onChange={handleFormChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Panels</label>
                  <input
                    type="number"
                    name="total_panels"
                    value={formData.total_panels}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inverter Make *</label>
                  <input
                    type="text"
                    name="inverter_make"
                    value={formData.inverter_make}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Inverter Model</label>
                  <input
                    type="text"
                    name="inverter_model"
                    value={formData.inverter_model}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Panel Make *</label>
                  <input
                    type="text"
                    name="panel_make"
                    value={formData.panel_make}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Panel Model</label>
                  <input
                    type="text"
                    name="panel_model"
                    value={formData.panel_model}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Dates and Personnel */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Installation Completion Date</label>
                  <input
                    type="date"
                    name="installation_completion_date"
                    value={formData.installation_completion_date}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commissioning Date</label>
                  <input
                    type="date"
                    name="commissioning_date"
                    value={formData.commissioning_date}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Issued By Name</label>
                  <input
                    type="text"
                    name="issued_by_name"
                    value={formData.issued_by_name}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commissioned By</label>
                  <input
                    type="text"
                    name="commissioned_by"
                    value={formData.commissioned_by}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowGenerateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  Generate Certificate
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Certificate Details */}
      {certificate && !isEditMode && (
        <div className="bg-white rounded-lg p-6 border border-blue-200 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">System Specifications</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">System Capacity</p>
                  <p className="font-semibold text-gray-800">{certificate.system_capacity_kw} kW</p>
                </div>
              </div>

              {certificate.total_panels && (
                <div className="flex items-center gap-2">
                  <ZapOff className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Panels</p>
                    <p className="font-semibold text-gray-800">{certificate.total_panels}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600">Inverter</p>
                <p className="font-semibold text-gray-800">
                  {certificate.inverter_make} {certificate.inverter_model || ''}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Panels</p>
                <p className="font-semibold text-gray-800">
                  {certificate.panel_make} {certificate.panel_model || ''}
                </p>
              </div>
            </div>
          </div>

          {/* Important Dates */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Key Dates
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {certificate.installation_completion_date && (
                <div>
                  <p className="text-sm text-gray-600">Installation Completed</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(certificate.installation_completion_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              {certificate.commissioning_date && (
                <div>
                  <p className="text-sm text-gray-600">Commissioned</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(certificate.commissioning_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              {certificate.kseb_submission_date && (
                <div>
                  <p className="text-sm text-gray-600">KSEB Submission</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(certificate.kseb_submission_date).toLocaleDateString()}
                  </p>
                </div>
              )}

              {certificate.kseb_approval_date && (
                <div>
                  <p className="text-sm text-gray-600">KSEB Approval</p>
                  <p className="font-semibold text-gray-800">
                    {new Date(certificate.kseb_approval_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Personnel */}
          {(certificate.issued_by_name || certificate.commissioned_by) && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personnel
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {certificate.issued_by_name && (
                  <div>
                    <p className="text-sm text-gray-600">Issued By</p>
                    <p className="font-semibold text-gray-800">{certificate.issued_by_name}</p>
                  </div>
                )}

                {certificate.commissioned_by && (
                  <div>
                    <p className="text-sm text-gray-600">Commissioned By</p>
                    <p className="font-semibold text-gray-800">{certificate.commissioned_by}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* KSEB Details */}
          {certificate.kseb_reference_number && (
            <div className="border-t border-gray-200 pt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">KSEB Approval Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Reference Number</p>
                  <p className="font-mono font-semibold text-green-800">{certificate.kseb_reference_number}</p>
                </div>
              </div>
            </div>
          )}

          {/* Performance Test Results */}
          {certificate.performance_test_results && (
            <div className="border-t border-gray-200 pt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                Performance Test Results
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {certificate.performance_test_results.voltage && (
                  <div>
                    <p className="text-sm text-gray-600">Voltage</p>
                    <p className="font-semibold text-gray-800">{certificate.performance_test_results.voltage} V</p>
                  </div>
                )}

                {certificate.performance_test_results.current && (
                  <div>
                    <p className="text-sm text-gray-600">Current</p>
                    <p className="font-semibold text-gray-800">{certificate.performance_test_results.current} A</p>
                  </div>
                )}

                {certificate.performance_test_results.power_output && (
                  <div>
                    <p className="text-sm text-gray-600">Power Output</p>
                    <p className="font-semibold text-gray-800">{certificate.performance_test_results.power_output} kW</p>
                  </div>
                )}

                {certificate.performance_test_results.efficiency && (
                  <div>
                    <p className="text-sm text-gray-600">Efficiency</p>
                    <p className="font-semibold text-gray-800">{certificate.performance_test_results.efficiency}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {certificate.notes && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Notes
              </h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{certificate.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Mode */}
      {certificate && isEditMode && (
        <div className="bg-white rounded-lg p-6 border border-blue-200">
          <form onSubmit={handleUpdateCertificate} className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Edit Certificate Details</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">System Capacity (kW)</label>
                <input
                  type="number"
                  name="system_capacity_kw"
                  value={formData.system_capacity_kw}
                  onChange={handleFormChange}
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Panels</label>
                <input
                  type="number"
                  name="total_panels"
                  value={formData.total_panels}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Inverter Make</label>
                <input
                  type="text"
                  name="inverter_make"
                  value={formData.inverter_make}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Inverter Model</label>
                <input
                  type="text"
                  name="inverter_model"
                  value={formData.inverter_model}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Panel Make</label>
                <input
                  type="text"
                  name="panel_make"
                  value={formData.panel_make}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Panel Model</label>
                <input
                  type="text"
                  name="panel_model"
                  value={formData.panel_model}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Installation Completion Date</label>
                <input
                  type="date"
                  name="installation_completion_date"
                  value={formData.installation_completion_date}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commissioning Date</label>
                <input
                  type="date"
                  name="commissioning_date"
                  value={formData.commissioning_date}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Issued By Name</label>
                <input
                  type="text"
                  name="issued_by_name"
                  value={formData.issued_by_name}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commissioned By</label>
                <input
                  type="text"
                  name="commissioned_by"
                  value={formData.commissioned_by}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Performance Test Section */}
      {certificate && (
        <div className="bg-white rounded-lg p-6 border border-blue-200">
          <button
            onClick={() => setShowPerformanceSection(!showPerformanceSection)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition rounded-lg"
          >
            <div className="flex items-center gap-3">
              <Gauge className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-800">Performance Test Results</h3>
            </div>
            <span className="text-2xl text-gray-400">{showPerformanceSection ? '−' : '+'}</span>
          </button>

          {showPerformanceSection && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voltage (V)</label>
                  <input
                    type="number"
                    name="voltage"
                    value={performanceData.voltage}
                    onChange={handlePerformanceChange}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current (A)</label>
                  <input
                    type="number"
                    name="current"
                    value={performanceData.current}
                    onChange={handlePerformanceChange}
                    step="0.1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Power Output (kW)</label>
                  <input
                    type="number"
                    name="power_output"
                    value={performanceData.power_output}
                    onChange={handlePerformanceChange}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Efficiency (%)</label>
                  <input
                    type="number"
                    name="efficiency"
                    value={performanceData.efficiency}
                    onChange={handlePerformanceChange}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <button
                onClick={handleUpdatePerformance}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Performance Results
              </button>
            </div>
          )}
        </div>
      )}

      {/* KSEB Workflow Buttons */}
      {certificate && (
        <div className="bg-white rounded-lg p-6 border border-blue-200 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">KSEB Workflow</h3>

          {canSubmit && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold"
            >
              <Send className="w-5 h-5" />
              Submit to KSEB
            </button>
          )}

          {canApprove && (
            <button
              onClick={() => setShowApprovalModal(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
            >
              <CheckCircle className="w-5 h-5" />
              Approve Certificate
            </button>
          )}

          {canReject && (
            <button
              onClick={() => setShowRejectModal(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
            >
              <XCircle className="w-5 h-5" />
              Reject Certificate
            </button>
          )}

          {certificate.approval_status === 'approved' && (
            <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-lg border border-green-300 font-semibold cursor-default">
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          )}
        </div>
      )}

      {/* Submit to KSEB Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Submit to KSEB</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Submission Date</label>
                <input
                  type="date"
                  value={submissionData.submission_date}
                  onChange={(e) =>
                    setSubmissionData({ ...submissionData, submission_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitToKSEB}
                className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-semibold flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Approve Certificate</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Approval Date</label>
                <input
                  type="date"
                  value={approvalData.approval_date}
                  onChange={(e) =>
                    setApprovalData({ ...approvalData, approval_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">KSEB Reference Number</label>
                <input
                  type="text"
                  value={approvalData.kseb_reference_number}
                  onChange={(e) =>
                    setApprovalData({ ...approvalData, kseb_reference_number: e.target.value })
                  }
                  placeholder="e.g., KSEB/2026/12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveCertificate}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Reject Certificate</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
                <textarea
                  value={rejectionData.reason}
                  onChange={(e) => setRejectionData({ reason: e.target.value })}
                  placeholder="Enter the reason for rejection..."
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectCertificate}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletionCertificatePanel;
