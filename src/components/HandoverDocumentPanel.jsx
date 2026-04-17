import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  FileText,
  Send,
  Download,
  PenTool,
  Check,
  Archive,
  Mail,
  Printer,
  Globe,
  Settings,
  AlertCircle,
  Zap,
  Shield,
  Wrench,
  Phone
} from 'lucide-react';
import {
  getHandoverDocument,
  generateHandoverDocument,
  markReadyForDelivery,
  deliverDocument,
  recordSignature,
  archiveDocument,
  DOCUMENT_STATUSES,
  DELIVERY_METHODS
} from '../lib/handoverDocumentService';

const HandoverDocumentPanel = ({ projectId }) => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [delivering, setDelivering] = useState(false);

  // Form states
  const [deliveryMethod, setDeliveryMethod] = useState(DELIVERY_METHODS.EMAIL);
  const [deliveryEmails, setDeliveryEmails] = useState('');
  const [signedByName, setSignedByName] = useState('');
  const [signedByEmail, setSignedByEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Toggle states
  const [includesWarranty, setIncludesWarranty] = useState(true);
  const [includesManual, setIncludesManual] = useState(true);
  const [includesPerformanceMetrics, setIncludesPerformanceMetrics] = useState(true);
  const [includesMaintenance, setIncludesMaintenance] = useState(true);
  const [includesContactInfo, setIncludesContactInfo] = useState(true);

  // Fetch handover document on mount
  useEffect(() => {
    fetchDocument();
  }, [projectId]);

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const doc = await getHandoverDocument(projectId);
      setDocument(doc);
      if (doc) {
        setIncludesWarranty(doc.includes_warranty);
        setIncludesManual(doc.includes_manual);
        setIncludesPerformanceMetrics(doc.includes_performance_metrics);
        setIncludesMaintenance(doc.includes_maintenance_guide);
        setIncludesContactInfo(doc.includes_contact_info);
      }
    } catch (error) {
      toast.error('Failed to load handover document');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDocument = async () => {
    setGenerating(true);
    try {
      const newDoc = await generateHandoverDocument(projectId, {
        includesWarranty,
        includesManual,
        includesPerformanceMetrics,
        includesMaintenance,
        includesContactInfo
      });
      setDocument(newDoc);
      toast.success('Handover document generated successfully');
    } catch (error) {
      toast.error('Failed to generate document');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkReady = async () => {
    if (!document) return;
    try {
      const updated = await markReadyForDelivery(document.id);
      setDocument(updated);
      toast.success('Document marked as ready for delivery');
    } catch (error) {
      toast.error('Failed to mark document as ready');
      console.error(error);
    }
  };

  const handleDeliver = async () => {
    if (!document) return;

    const emails = deliveryEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e);

    if (deliveryMethod === DELIVERY_METHODS.EMAIL && emails.length === 0) {
      toast.error('Please enter at least one email address');
      return;
    }

    setDelivering(true);
    try {
      const updated = await deliverDocument(document.id, deliveryMethod, emails);
      setDocument(updated);
      setDeliveryEmails('');
      toast.success('Document delivered successfully');
    } catch (error) {
      toast.error('Failed to deliver document');
      console.error(error);
    } finally {
      setDelivering(false);
    }
  };

  const handleRecordSignature = async () => {
    if (!document) return;
    if (!signedByName || !signedByEmail) {
      toast.error('Please enter signer name and email');
      return;
    }

    try {
      const updated = await recordSignature(document.id, {
        signatureUrl: 'signature_placeholder', // Would be replaced with actual signature URL
        signedByName,
        signedByEmail
      });
      setDocument(updated);
      setSignedByName('');
      setSignedByEmail('');
      toast.success('Signature recorded successfully');
    } catch (error) {
      toast.error('Failed to record signature');
      console.error(error);
    }
  };

  const handleArchive = async () => {
    if (!document) return;
    try {
      const updated = await archiveDocument(document.id);
      setDocument(updated);
      toast.success('Document archived');
    } catch (error) {
      toast.error('Failed to archive document');
      console.error(error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      [DOCUMENT_STATUSES.PENDING]: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      [DOCUMENT_STATUSES.GENERATED]: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Generated' },
      [DOCUMENT_STATUSES.READY_FOR_DELIVERY]: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Ready' },
      [DOCUMENT_STATUSES.DELIVERED]: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
      [DOCUMENT_STATUSES.SIGNED]: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Signed' },
      [DOCUMENT_STATUSES.ARCHIVED]: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Archived' }
    };

    const config = statusConfig[status] || statusConfig[DOCUMENT_STATUSES.PENDING];

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">
          <FileText className="w-8 h-8 text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Handover Document</h2>
            {document && (
              <p className="text-sm text-gray-500 mt-1">
                Document #{document.document_number}
              </p>
            )}
          </div>
        </div>
        {document && getStatusBadge(document.document_status)}
      </div>

      {/* Generate Document Section */}
      {!document && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Generate Handover Document</h3>
              <p className="text-sm text-blue-800 mt-1">
                Create a comprehensive handover document for your customer with system details, warranty information, and maintenance schedule.
              </p>
            </div>
          </div>

          {/* Inclusion Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includesWarranty}
                onChange={(e) => setIncludesWarranty(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Warranty Information</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includesManual}
                onChange={(e) => setIncludesManual(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">User Manual</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includesPerformanceMetrics}
                onChange={(e) => setIncludesPerformanceMetrics(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Performance Metrics</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includesMaintenance}
                onChange={(e) => setIncludesMaintenance(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Maintenance Guide</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includesContactInfo}
                onChange={(e) => setIncludesContactInfo(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Contact Information</span>
            </label>
          </div>

          <button
            onClick={handleGenerateDocument}
            disabled={generating}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            {generating ? (
              <>
                <div className="animate-spin">
                  <FileText className="w-5 h-5" />
                </div>
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Generate Document
              </>
            )}
          </button>
        </div>
      )}

      {/* Document Details */}
      {document && (
        <>
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Document Number</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{document.document_number}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Issue Date</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {document.issue_date ? new Date(document.issue_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Generated</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {document.generation_date ? new Date(document.generation_date).toLocaleDateString() : 'Not generated'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase">Status</p>
              <div className="mt-1">{getStatusBadge(document.document_status)}</div>
            </div>
          </div>

          {/* System Summary */}
          {document.system_summary_json && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">System Summary</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Project Name</p>
                  <p className="font-medium text-gray-900">{document.system_summary_json.projectName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Address</p>
                  <p className="font-medium text-gray-900">{document.system_summary_json.address}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Capacity</p>
                  <p className="font-medium text-gray-900">{document.system_summary_json.totalCapacity} kW</p>
                </div>
                <div>
                  <p className="text-gray-600">Panel Count</p>
                  <p className="font-medium text-gray-900">{document.system_summary_json.panelCount}</p>
                </div>
                <div>
                  <p className="text-gray-600">Inverter Model</p>
                  <p className="font-medium text-gray-900">{document.system_summary_json.inverterModel}</p>
                </div>
                <div>
                  <p className="text-gray-600">System Type</p>
                  <p className="font-medium text-gray-900">{document.system_summary_json.systemType}</p>
                </div>
              </div>
            </div>
          )}

          {/* Warranty Summary */}
          {document.includes_warranty && document.warranty_summary_json && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Warranty Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Provider</p>
                  <p className="font-medium text-gray-900">{document.warranty_summary_json.provider}</p>
                </div>
                <div>
                  <p className="text-gray-600">Coverage Period</p>
                  <p className="font-medium text-gray-900">{document.warranty_summary_json.periodYears} years</p>
                </div>
                <div>
                  <p className="text-gray-600">Issue Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(document.warranty_summary_json.issueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Expiry Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(document.warranty_summary_json.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Schedule */}
          {document.includes_maintenance_guide && document.maintenance_schedule_json && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Wrench className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Maintenance Schedule</h3>
              </div>
              <div className="space-y-3">
                {document.maintenance_schedule_json.items?.map((item, idx) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                    <p className="font-medium text-gray-900">{item.task}</p>
                    <p className="text-sm text-gray-600">Frequency: {item.frequency}</p>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Workflow Controls */}
          <div className="space-y-4 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Document Workflow
            </h3>

            {/* Ready for Delivery */}
            {document.document_status === DOCUMENT_STATUSES.GENERATED && (
              <button
                onClick={handleMarkReady}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Check className="w-5 h-5" />
                Mark Ready for Delivery
              </button>
            )}

            {/* Delivery Section */}
            {[DOCUMENT_STATUSES.READY_FOR_DELIVERY, DOCUMENT_STATUSES.DELIVERED].includes(document.document_status) && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium text-gray-900">Delivery Settings</h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries({
                      [DELIVERY_METHODS.EMAIL]: { icon: Mail, label: 'Email' },
                      [DELIVERY_METHODS.PRINT]: { icon: Printer, label: 'Print' },
                      [DELIVERY_METHODS.PORTAL]: { icon: Globe, label: 'Portal' },
                      [DELIVERY_METHODS.BOTH]: { icon: Send, label: 'Both' }
                    }).map(([method, { icon: Icon, label }]) => (
                      <button
                        key={method}
                        onClick={() => setDeliveryMethod(method)}
                        className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 font-medium transition ${
                          deliveryMethod === method
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {[DELIVERY_METHODS.EMAIL, DELIVERY_METHODS.BOTH].includes(deliveryMethod) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Addresses</label>
                    <input
                      type="text"
                      placeholder="customer@example.com, another@example.com"
                      value={deliveryEmails}
                      onChange={(e) => setDeliveryEmails(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple addresses with commas</p>
                  </div>
                )}

                {document.document_status === DOCUMENT_STATUSES.READY_FOR_DELIVERY && (
                  <button
                    onClick={handleDeliver}
                    disabled={delivering}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    {delivering ? (
                      <>
                        <div className="animate-spin">
                          <Send className="w-5 h-5" />
                        </div>
                        Delivering...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Deliver Document
                      </>
                    )}
                  </button>
                )}

                {document.delivered_to_emails && document.delivered_to_emails.length > 0 && (
                  <div className="bg-white p-3 rounded border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Delivered To</p>
                    <div className="mt-1 space-y-1">
                      {document.delivered_to_emails.map((email, idx) => (
                        <p key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-blue-500" />
                          {email}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Signature Section */}
            {[DOCUMENT_STATUSES.DELIVERED].includes(document.document_status) && (
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <PenTool className="w-5 h-5" />
                  Customer Signature
                </h4>

                <input
                  type="text"
                  placeholder="Signed by Name"
                  value={signedByName}
                  onChange={(e) => setSignedByName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="email"
                  placeholder="Signed by Email"
                  value={signedByEmail}
                  onChange={(e) => setSignedByEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  onClick={handleRecordSignature}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Check className="w-5 h-5" />
                  Record Signature
                </button>

                {document.signed_by_name && (
                  <div className="bg-white p-3 rounded border border-green-200 bg-green-50">
                    <p className="text-xs font-semibold text-green-800 uppercase">Signed By</p>
                    <p className="text-sm text-green-900 font-medium mt-1">{document.signed_by_name}</p>
                    <p className="text-sm text-green-700 flex items-center gap-2 mt-1">
                      <Phone className="w-4 h-4" />
                      {document.signed_by_email}
                    </p>
                    <p className="text-xs text-green-700 mt-2">
                      {document.customer_signature_timestamp
                        ? `Signed on ${new Date(document.customer_signature_timestamp).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Archive Button */}
            {![DOCUMENT_STATUSES.ARCHIVED].includes(document.document_status) && (
              <button
                onClick={handleArchive}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Archive className="w-5 h-5" />
                Archive Document
              </button>
            )}
          </div>

          {/* PDF Download Placeholder */}
          {document.pdf_url && (
            <div className="border-t pt-4">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition">
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            </div>
          )}

          {/* Notes Section */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              placeholder="Add any additional notes about this handover document..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default HandoverDocumentPanel;
