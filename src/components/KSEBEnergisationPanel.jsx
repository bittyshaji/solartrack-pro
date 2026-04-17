import React, { useEffect, useState } from 'react';
import {
  Zap,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Gauge,
  Clock,
  FileText,
  Upload,
  Trash2,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getEnergisation,
  createEnergisation,
  scheduleVisit,
  recordVisit,
  recordInspectionResult,
  markEnergised,
  scheduleFollowUp,
  getActivityLog,
  uploadEnergisationCertificate,
  deleteEnergisationCertificate,
  ENERGISATION_STATUSES,
  INSPECTION_RESULTS
} from '../lib/ksebEnergisationService';

// Status configuration for styling and icons
const STATUS_CONFIG = {
  [ENERGISATION_STATUSES.PENDING]: {
    label: 'Pending',
    color: 'bg-gray-100 text-gray-800',
    borderColor: 'border-gray-300',
    icon: Clock,
    step: 1
  },
  [ENERGISATION_STATUSES.SCHEDULED]: {
    label: 'Visit Scheduled',
    color: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-300',
    icon: Calendar,
    step: 2
  },
  [ENERGISATION_STATUSES.VISITED]: {
    label: 'Visited',
    color: 'bg-purple-100 text-purple-800',
    borderColor: 'border-purple-300',
    icon: CheckCircle,
    step: 3
  },
  [ENERGISATION_STATUSES.INSPECTION_PASSED]: {
    label: 'Inspection Passed',
    color: 'bg-green-100 text-green-800',
    borderColor: 'border-green-300',
    icon: CheckCircle,
    step: 4
  },
  [ENERGISATION_STATUSES.INSPECTION_FAILED]: {
    label: 'Inspection Failed',
    color: 'bg-red-100 text-red-800',
    borderColor: 'border-red-300',
    icon: XCircle,
    step: 3.5
  },
  [ENERGISATION_STATUSES.ENERGISED]: {
    label: 'Energised',
    color: 'bg-emerald-100 text-emerald-800',
    borderColor: 'border-emerald-300',
    icon: Zap,
    step: 5
  },
  [ENERGISATION_STATUSES.FOLLOW_UP_NEEDED]: {
    label: 'Follow-up Needed',
    color: 'bg-orange-100 text-orange-800',
    borderColor: 'border-orange-300',
    icon: AlertTriangle,
    step: 4
  }
};

export default function KSEBEnergisationPanel({ projectId }) {
  const [energisation, setEnergisation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityLog, setActivityLog] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    schedule: true,
    visit: false,
    inspection: false,
    energisation: false,
    timeline: false
  });

  // Form states
  const [scheduledDate, setScheduledDate] = useState('');
  const [visitData, setVisitData] = useState({
    actual_visit_date: '',
    inspector_name: '',
    inspector_id: '',
    inspector_phone: '',
    meter_number: '',
    meter_type: ''
  });
  const [inspectionData, setInspectionData] = useState({
    result: '',
    remarks: ''
  });
  const [meterData, setMeterData] = useState({
    meter_number: '',
    meter_type: '',
    net_meter_installed: false,
    net_meter_reading_initial: ''
  });
  const [energisationDate, setEnergisationDate] = useState('');
  const [followUpData, setFollowUpData] = useState({
    date: '',
    notes: ''
  });
  const [certificateFile, setCertificateFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Load energisation data on mount
  useEffect(() => {
    loadEnergisationData();
  }, [projectId]);

  const loadEnergisationData = async () => {
    try {
      setLoading(true);
      let data = await getEnergisation(projectId);

      if (!data) {
        data = await createEnergisation(projectId);
      }

      setEnergisation(data);

      if (data.id) {
        const logs = await getActivityLog(data.id);
        setActivityLog(logs);
      }
    } catch (error) {
      console.error('Error loading energisation data:', error);
      toast.error('Failed to load energisation data');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleVisit = async () => {
    if (!scheduledDate) {
      toast.error('Please select a scheduled date');
      return;
    }

    try {
      const updated = await scheduleVisit(projectId, scheduledDate);
      setEnergisation(updated);
      setScheduledDate('');
      toast.success('Visit scheduled successfully');

      // Reload activity log
      const logs = await getActivityLog(updated.id);
      setActivityLog(logs);
    } catch (error) {
      console.error('Error scheduling visit:', error);
      toast.error('Failed to schedule visit');
    }
  };

  const handleRecordVisit = async () => {
    if (!visitData.actual_visit_date || !visitData.inspector_name) {
      toast.error('Please fill in visit date and inspector name');
      return;
    }

    try {
      const updated = await recordVisit(projectId, visitData);
      setEnergisation(updated);
      setVisitData({
        actual_visit_date: '',
        inspector_name: '',
        inspector_id: '',
        inspector_phone: '',
        meter_number: '',
        meter_type: ''
      });
      toast.success('Visit recorded successfully');

      const logs = await getActivityLog(updated.id);
      setActivityLog(logs);
    } catch (error) {
      console.error('Error recording visit:', error);
      toast.error('Failed to record visit');
    }
  };

  const handleRecordInspection = async (result) => {
    if (!inspectionData.remarks) {
      toast.error('Please add inspection remarks');
      return;
    }

    try {
      const updated = await recordInspectionResult(
        projectId,
        result,
        inspectionData.remarks
      );
      setEnergisation(updated);
      setInspectionData({ result: '', remarks: '' });
      toast.success(`Inspection marked as ${result}`);

      const logs = await getActivityLog(updated.id);
      setActivityLog(logs);
    } catch (error) {
      console.error('Error recording inspection:', error);
      toast.error('Failed to record inspection result');
    }
  };

  const handleScheduleFollowUp = async () => {
    if (!followUpData.date) {
      toast.error('Please select a follow-up date');
      return;
    }

    try {
      const updated = await scheduleFollowUp(
        projectId,
        followUpData.date,
        followUpData.notes
      );
      setEnergisation(updated);
      setFollowUpData({ date: '', notes: '' });
      toast.success('Follow-up scheduled');

      const logs = await getActivityLog(updated.id);
      setActivityLog(logs);
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      toast.error('Failed to schedule follow-up');
    }
  };

  const handleMarkEnergised = async () => {
    if (!energisationDate) {
      toast.error('Please select energisation date');
      return;
    }

    try {
      const updated = await markEnergised(projectId, energisationDate, meterData);
      setEnergisation(updated);
      setEnergisationDate('');
      setMeterData({
        meter_number: '',
        meter_type: '',
        net_meter_installed: false,
        net_meter_reading_initial: ''
      });
      toast.success('Project marked as energised');

      const logs = await getActivityLog(updated.id);
      setActivityLog(logs);
    } catch (error) {
      console.error('Error marking energised:', error);
      toast.error('Failed to mark as energised');
    }
  };

  const handleUploadCertificate = async () => {
    if (!certificateFile) {
      toast.error('Please select a certificate file');
      return;
    }

    try {
      setUploading(true);
      const url = await uploadEnergisationCertificate(projectId, certificateFile);
      const updated = await getEnergisation(projectId);
      setEnergisation(updated);
      setCertificateFile(null);
      toast.success('Certificate uploaded successfully');
    } catch (error) {
      console.error('Error uploading certificate:', error);
      toast.error('Failed to upload certificate');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCertificate = async () => {
    try {
      await deleteEnergisationCertificate(projectId);
      const updated = await getEnergisation(projectId);
      setEnergisation(updated);
      toast.success('Certificate deleted');
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast.error('Failed to delete certificate');
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Zap className="h-12 w-12 text-blue-500 mx-auto mb-2 animate-spin" />
          <p className="text-gray-600">Loading energisation data...</p>
        </div>
      </div>
    );
  }

  if (!energisation) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p>Failed to load energisation record</p>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[energisation.energisation_status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header with Status Badge */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${statusConfig.color}`}>
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">KSEB Energisation</h2>
              <p className="text-gray-600">Manage installation energisation process</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${statusConfig.color} flex items-center space-x-2`}>
            <StatusIcon className="h-5 w-5" />
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6 flex justify-between items-center">
          {Object.entries(STATUS_CONFIG).map(([key, config], index) => {
            const isCompleted = config.step <= statusConfig.step;
            const isCurrent = config.step === statusConfig.step;
            const Icon = config.icon;

            return (
              <div key={key} className="flex flex-col items-center">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center border-2 mb-2 ${
                    isCompleted
                      ? config.color + ' border-opacity-50'
                      : 'bg-gray-100 text-gray-400 border-gray-300'
                  } ${isCurrent ? 'ring-4 ring-yellow-300' : ''}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs text-gray-600 text-center max-w-16">
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visit Scheduling Section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('schedule')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Schedule Visit</h3>
          </div>
          {expandedSections.schedule ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.schedule && (
          <div className="border-t border-gray-200 p-6 space-y-4">
            {energisation.visit_scheduled_date && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Scheduled Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(energisation.visit_scheduled_date).toLocaleDateString()}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Scheduled Date
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleScheduleVisit}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Schedule Visit
            </button>
          </div>
        )}
      </div>

      {/* Visit Recording Section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('visit')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Record Visit Details</h3>
          </div>
          {expandedSections.visit ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.visit && (
          <div className="border-t border-gray-200 p-6 space-y-4">
            {energisation.actual_visit_date && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Actual Visit Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(energisation.actual_visit_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Inspector</p>
                    <p className="font-semibold text-gray-900">{energisation.inspector_name}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Visit Date
                </label>
                <input
                  type="date"
                  value={visitData.actual_visit_date}
                  onChange={(e) =>
                    setVisitData({ ...visitData, actual_visit_date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspector Name
                </label>
                <input
                  type="text"
                  value={visitData.inspector_name}
                  onChange={(e) =>
                    setVisitData({ ...visitData, inspector_name: e.target.value })
                  }
                  placeholder="Name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspector ID
                </label>
                <input
                  type="text"
                  value={visitData.inspector_id}
                  onChange={(e) =>
                    setVisitData({ ...visitData, inspector_id: e.target.value })
                  }
                  placeholder="ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspector Phone
                </label>
                <input
                  type="tel"
                  value={visitData.inspector_phone}
                  onChange={(e) =>
                    setVisitData({ ...visitData, inspector_phone: e.target.value })
                  }
                  placeholder="Phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meter Number
                </label>
                <input
                  type="text"
                  value={visitData.meter_number}
                  onChange={(e) =>
                    setVisitData({ ...visitData, meter_number: e.target.value })
                  }
                  placeholder="Meter number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meter Type
                </label>
                <select
                  value={visitData.meter_type}
                  onChange={(e) =>
                    setVisitData({ ...visitData, meter_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select type</option>
                  <option value="single_phase">Single Phase</option>
                  <option value="three_phase">Three Phase</option>
                  <option value="digital">Digital</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleRecordVisit}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Record Visit
            </button>
          </div>
        )}
      </div>

      {/* Inspection Result Section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('inspection')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Inspection Result</h3>
          </div>
          {expandedSections.inspection ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.inspection && (
          <div className="border-t border-gray-200 p-6 space-y-4">
            {energisation.inspection_result && (
              <div className={`border rounded-lg p-4 ${
                energisation.inspection_result === 'pass'
                  ? 'bg-green-50 border-green-200'
                  : energisation.inspection_result === 'fail'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <p className="text-sm text-gray-600">Result</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {energisation.inspection_result.replace('_', ' ')}
                </p>
                {energisation.inspection_remarks && (
                  <p className="text-sm text-gray-700 mt-2">{energisation.inspection_remarks}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inspection Remarks
              </label>
              <textarea
                value={inspectionData.remarks}
                onChange={(e) =>
                  setInspectionData({ ...inspectionData, remarks: e.target.value })
                }
                placeholder="Enter detailed inspection remarks..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 h-24"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                onClick={() => handleRecordInspection('pass')}
                className="bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2"
              >
                <CheckCircle className="h-5 w-5" />
                <span>Pass</span>
              </button>
              <button
                onClick={() => handleRecordInspection('conditional_pass')}
                className="bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition flex items-center justify-center space-x-2"
              >
                <AlertTriangle className="h-5 w-5" />
                <span>Conditional</span>
              </button>
              <button
                onClick={() => handleRecordInspection('fail')}
                className="bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition flex items-center justify-center space-x-2"
              >
                <XCircle className="h-5 w-5" />
                <span>Fail</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Failure Handling - Follow Up */}
      {energisation.energisation_status === ENERGISATION_STATUSES.INSPECTION_FAILED && (
        <div className="bg-white border border-red-200 rounded-lg">
          <button
            onClick={() => toggleSection('followup')}
            className="w-full p-6 flex items-center justify-between hover:bg-red-50"
          >
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-gray-900">Schedule Follow-up</h3>
            </div>
            {expandedSections.followup ? <ChevronUp /> : <ChevronDown />}
          </button>

          {expandedSections.followup && (
            <div className="border-t border-red-200 p-6 space-y-4 bg-red-50">
              {energisation.follow_up_date && (
                <div className="bg-white border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">Follow-up Scheduled</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(energisation.follow_up_date).toLocaleDateString()}
                  </p>
                  {energisation.follow_up_notes && (
                    <p className="text-sm text-gray-700 mt-2">{energisation.follow_up_notes}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Failure Reason
                </label>
                <input
                  type="text"
                  value={energisation.failure_reason || ''}
                  readOnly
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700"
                  placeholder="Reason for failure"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={followUpData.date}
                    onChange={(e) =>
                      setFollowUpData({ ...followUpData, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Notes
                </label>
                <textarea
                  value={followUpData.notes}
                  onChange={(e) =>
                    setFollowUpData({ ...followUpData, notes: e.target.value })
                  }
                  placeholder="Notes for follow-up..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 h-20"
                />
              </div>

              <button
                onClick={handleScheduleFollowUp}
                className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Schedule Follow-up
              </button>
            </div>
          )}
        </div>
      )}

      {/* Energisation Section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('energisation')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <Zap className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Mark Energised</h3>
          </div>
          {expandedSections.energisation ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.energisation && (
          <div className="border-t border-gray-200 p-6 space-y-4">
            {energisation.energisation_date && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Energisation Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(energisation.energisation_date).toLocaleDateString()}
                    </p>
                  </div>
                  {energisation.meter_number && (
                    <div>
                      <p className="text-sm text-gray-600">Meter Number</p>
                      <p className="font-semibold text-gray-900">{energisation.meter_number}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Energisation Date
                </label>
                <input
                  type="date"
                  value={energisationDate}
                  onChange={(e) => setEnergisationDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meter Number
                </label>
                <input
                  type="text"
                  value={meterData.meter_number}
                  onChange={(e) =>
                    setMeterData({ ...meterData, meter_number: e.target.value })
                  }
                  placeholder="Meter number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meter Type
                </label>
                <select
                  value={meterData.meter_type}
                  onChange={(e) =>
                    setMeterData({ ...meterData, meter_type: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select type</option>
                  <option value="single_phase">Single Phase</option>
                  <option value="three_phase">Three Phase</option>
                  <option value="digital">Digital</option>
                </select>
              </div>
              <div className="flex items-center space-x-4 pt-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={meterData.net_meter_installed}
                    onChange={(e) =>
                      setMeterData({
                        ...meterData,
                        net_meter_installed: e.target.checked
                      })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Net Meter Installed
                  </span>
                </label>
              </div>
            </div>

            {meterData.net_meter_installed && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Net Meter Initial Reading (kWh)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={meterData.net_meter_reading_initial}
                  onChange={(e) =>
                    setMeterData({
                      ...meterData,
                      net_meter_reading_initial: parseFloat(e.target.value)
                    })
                  }
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <button
              onClick={handleMarkEnergised}
              className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition flex items-center justify-center space-x-2"
            >
              <Zap className="h-5 w-5" />
              <span>Mark as Energised</span>
            </button>
          </div>
        )}
      </div>

      {/* Certificate Upload Section */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('certificate')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Energisation Certificate</h3>
          </div>
          {expandedSections.certificate ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.certificate && (
          <div className="border-t border-gray-200 p-6 space-y-4">
            {energisation.energisation_certificate_url && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Certificate Uploaded
                    </span>
                  </div>
                  <a
                    href={energisation.energisation_certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                  >
                    View
                  </a>
                </div>
                <button
                  onClick={handleDeleteCertificate}
                  className="mt-3 text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            )}

            {!energisation.energisation_certificate_url && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-4">
                  Upload the KSEB energisation certificate
                </p>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setCertificateFile(e.target.files?.[0])}
                  className="hidden"
                  id="cert-upload"
                />
                <label
                  htmlFor="cert-upload"
                  className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 cursor-pointer transition"
                >
                  Choose File
                </label>
              </div>
            )}

            {certificateFile && !energisation.energisation_certificate_url && (
              <button
                onClick={handleUploadCertificate}
                disabled={uploading}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
              >
                {uploading ? 'Uploading...' : 'Upload Certificate'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <button
          onClick={() => toggleSection('timeline')}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Activity Timeline</h3>
          </div>
          {expandedSections.timeline ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections.timeline && (
          <div className="border-t border-gray-200 p-6">
            {activityLog.length > 0 ? (
              <div className="space-y-4">
                {activityLog.map((log, index) => (
                  <div key={log.id} className="flex space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 bg-gray-400 rounded-full mt-2" />
                      {index < activityLog.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-300 my-2" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-gray-900">
                        {log.description}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(log.created_at).toLocaleDateString()} at{' '}
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                      {log.new_status && (
                        <p className="text-xs text-gray-500 mt-1">
                          Status: {log.previous_status} → {log.new_status}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No activity recorded yet
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
