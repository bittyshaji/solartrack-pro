import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Receipt,
  Calendar,
  Plus,
  Download,
  Eye,
  X,
  Zap,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getPaymentStages,
  createDefaultPaymentStages,
  markPaymentReceived,
  waivePayment,
  getPaymentSummary,
  generateReceipt,
  getReceipts,
  checkFinalPaymentEligibility,
  getOverduePayments,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STAGE_NAMES,
} from '../lib/paymentWorkflowService';

const PaymentWorkflowPanel = ({ projectId, totalAmount }) => {
  const [stages, setStages] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(null);
  const [showReceiptList, setShowReceiptList] = useState(false);
  const [showFinalPaymentSection, setShowFinalPaymentSection] = useState(false);
  const [finalPaymentEligibility, setFinalPaymentEligibility] = useState(null);
  const [overduePayments, setOverduePayments] = useState([]);

  // Payment form state
  const [paymentFormData, setPaymentFormData] = useState({
    paymentMethod: '',
    paymentReference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Fetch payment stages and summary
  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const stagesResult = await getPaymentStages(projectId);
      if (stagesResult.error) {
        toast.error('Failed to load payment stages');
        return;
      }

      if (!stagesResult.data || stagesResult.data.length === 0) {
        // Create default payment stages if none exist
        const createResult = await createDefaultPaymentStages(projectId, totalAmount);
        if (createResult.error) {
          toast.error('Failed to create payment stages');
          return;
        }
        setStages(createResult.data);
      } else {
        setStages(stagesResult.data);
      }

      // Get payment summary
      const summaryResult = await getPaymentSummary(projectId);
      if (!summaryResult.error) {
        setSummary(summaryResult.data);
      }

      // Get receipts
      const receiptsResult = await getReceipts(projectId);
      if (!receiptsResult.error) {
        setReceipts(receiptsResult.data);
      }

      // Check final payment eligibility
      const eligibilityResult = await checkFinalPaymentEligibility(projectId);
      if (!eligibilityResult.error) {
        setFinalPaymentEligibility(eligibilityResult.data);
      }
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast.error('Error loading payment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, [projectId, totalAmount]);

  // Handle payment submission
  const handlePaymentSubmit = async (stageId) => {
    if (!paymentFormData.paymentMethod || !paymentFormData.paymentDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const result = await markPaymentReceived(stageId, paymentFormData);
      if (result.error) {
        toast.error('Failed to record payment');
        return;
      }

      // Generate receipt
      const receiptResult = await generateReceipt(stageId, {
        receipt_date: paymentFormData.paymentDate,
      });

      if (!receiptResult.error) {
        toast.success('Payment recorded and receipt generated');
      } else {
        toast.success('Payment recorded successfully');
      }

      // Reset form
      setPaymentFormData({
        paymentMethod: '',
        paymentReference: '',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setShowPaymentForm(null);

      // Refresh data
      await fetchPaymentData();
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Error recording payment');
    }
  };

  // Handle waive payment
  const handleWaivePayment = async (stageId) => {
    if (confirm('Are you sure you want to waive this payment?')) {
      try {
        const result = await waivePayment(stageId, 'Payment waived by user');
        if (result.error) {
          toast.error('Failed to waive payment');
          return;
        }

        toast.success('Payment waived successfully');
        await fetchPaymentData();
      } catch (error) {
        console.error('Error waiving payment:', error);
        toast.error('Error waiving payment');
      }
    }
  };

  // Get status badge styling
  const getStatusStyles = (status) => {
    const baseClasses = 'px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1';
    switch (status) {
      case PAYMENT_STATUSES.PENDING:
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case PAYMENT_STATUSES.DUE:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case PAYMENT_STATUSES.PAID:
        return `${baseClasses} bg-green-100 text-green-800`;
      case PAYMENT_STATUSES.OVERDUE:
        return `${baseClasses} bg-red-100 text-red-800`;
      case PAYMENT_STATUSES.WAIVED:
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return baseClasses;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case PAYMENT_STATUSES.PAID:
        return <CheckCircle size={16} />;
      case PAYMENT_STATUSES.OVERDUE:
        return <AlertCircle size={16} />;
      case PAYMENT_STATUSES.WAIVED:
        return <X size={16} />;
      default:
        return <Calendar size={16} />;
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(value);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Get stage display name
  const getStageDisplayName = (stageName) => {
    const names = {
      [PAYMENT_STAGE_NAMES.ADVANCE]: 'Advance Payment',
      [PAYMENT_STAGE_NAMES.INTERIM_1]: 'Interim Payment 1',
      [PAYMENT_STAGE_NAMES.INTERIM_2]: 'Interim Payment 2',
      [PAYMENT_STAGE_NAMES.FINAL]: 'Final Payment',
    };
    return names[stageName] || stageName;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">
          <Zap className="text-orange-500" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 rounded-lg">
      {/* Payment Summary Card */}
      {summary && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="text-orange-500" size={24} />
              Payment Summary
            </h3>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(summary.paidAmount)}
              </p>
              <p className="text-sm text-gray-600">
                of {formatCurrency(summary.totalAmount)}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Payment Progress</span>
              <span className="text-sm font-semibold text-orange-600">{summary.percentagePaid}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${summary.percentagePaid}%` }}
              />
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Total Amount</p>
              <p className="text-lg font-bold text-gray-900">
                {formatCurrency(summary.totalAmount)}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Paid</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(summary.paidAmount)}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Remaining</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(summary.remainingAmount)}
              </p>
            </div>
          </div>

          {summary.waivedAmount > 0 && (
            <div className="mt-3 p-2 bg-purple-50 rounded text-sm text-purple-700">
              Waived: {formatCurrency(summary.waivedAmount)}
            </div>
          )}
        </div>
      )}

      {/* Payment Stages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="text-blue-500" size={24} />
            Payment Stages
          </h3>
          <button
            onClick={() => fetchPaymentData()}
            className="text-sm text-gray-600 hover:text-gray-900 transition"
          >
            ↻ Refresh
          </button>
        </div>

        {stages.map((stage) => {
          const isOverdue =
            stage.payment_status === PAYMENT_STATUSES.OVERDUE ||
            (stage.due_date && new Date(stage.due_date) < new Date() && stage.payment_status === PAYMENT_STATUSES.PENDING);
          const daysOverdue = isOverdue
            ? Math.floor((new Date() - new Date(stage.due_date)) / (1000 * 60 * 60 * 24))
            : 0;

          return (
            <div key={stage.id} className="bg-white rounded-lg shadow-md p-5 border-l-4 border-orange-500">
              {/* Stage Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {getStageDisplayName(stage.stage_name)}
                  </h4>
                  {stage.trigger_condition && (
                    <p className="text-sm text-gray-600 mt-1">
                      Trigger: {stage.trigger_condition}
                    </p>
                  )}
                </div>
                <div className={getStatusStyles(stage.payment_status)}>
                  {getStatusIcon(stage.payment_status)}
                  <span>{stage.payment_status.charAt(0).toUpperCase() + stage.payment_status.slice(1)}</span>
                </div>
              </div>

              {/* Overdue Alert */}
              {isOverdue && daysOverdue > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-semibold text-red-900 text-sm">
                      {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
                    </p>
                    <p className="text-xs text-red-700">
                      Due date was {formatDate(stage.due_date)}
                    </p>
                  </div>
                </div>
              )}

              {/* Amount and Percentage */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stage.payment_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Percentage</p>
                  <p className="text-2xl font-bold text-orange-600">{stage.stage_percentage}%</p>
                </div>
              </div>

              {/* Due Date */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                <Calendar size={18} className="text-gray-500" />
                <div>
                  <p className="text-xs text-gray-600">Due Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(stage.due_date)}
                  </p>
                </div>
              </div>

              {/* Payment Details (if paid) */}
              {stage.payment_status === PAYMENT_STATUSES.PAID && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-semibold text-gray-900">
                      {stage.payment_method?.toUpperCase() || '-'}
                    </span>
                  </div>
                  {stage.payment_reference && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-semibold text-gray-900">
                        {stage.payment_reference}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Received Date:</span>
                    <span className="font-semibold text-gray-900">
                      {formatDate(stage.payment_received_date)}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {stage.notes && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Notes</p>
                  <p className="text-sm text-gray-900">{stage.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {stage.payment_status !== PAYMENT_STATUSES.PAID &&
                  stage.payment_status !== PAYMENT_STATUSES.WAIVED && (
                    <>
                      <button
                        onClick={() => setShowPaymentForm(stage.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition text-sm font-medium"
                      >
                        <Plus size={16} />
                        Record Payment
                      </button>
                      <button
                        onClick={() => handleWaivePayment(stage.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition text-sm font-medium"
                      >
                        <X size={16} />
                        Waive
                      </button>
                    </>
                  )}

                {stage.payment_status === PAYMENT_STATUSES.PAID && stage.receipt_number && (
                  <button
                    onClick={() => setShowReceiptList(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium"
                  >
                    <Receipt size={16} />
                    View Receipt ({stage.receipt_number})
                  </button>
                )}
              </div>

              {/* Payment Form */}
              {showPaymentForm === stage.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-4">Record Payment</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Method *
                      </label>
                      <select
                        value={paymentFormData.paymentMethod}
                        onChange={(e) =>
                          setPaymentFormData({
                            ...paymentFormData,
                            paymentMethod: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Select payment method</option>
                        <option value={PAYMENT_METHODS.CASH}>Cash</option>
                        <option value={PAYMENT_METHODS.CHECK}>Check</option>
                        <option value={PAYMENT_METHODS.BANK_TRANSFER}>Bank Transfer</option>
                        <option value={PAYMENT_METHODS.UPI}>UPI</option>
                        <option value={PAYMENT_METHODS.ONLINE}>Online</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Reference
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Check No., Transaction ID"
                        value={paymentFormData.paymentReference}
                        onChange={(e) =>
                          setPaymentFormData({
                            ...paymentFormData,
                            paymentReference: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Payment Date *
                      </label>
                      <input
                        type="date"
                        value={paymentFormData.paymentDate}
                        onChange={(e) =>
                          setPaymentFormData({
                            ...paymentFormData,
                            paymentDate: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        placeholder="Additional notes (optional)"
                        value={paymentFormData.notes}
                        onChange={(e) =>
                          setPaymentFormData({
                            ...paymentFormData,
                            notes: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        rows="2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePaymentSubmit(stage.id)}
                        className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm font-medium"
                      >
                        <CheckCircle size={16} className="inline mr-2" />
                        Confirm Payment
                      </button>
                      <button
                        onClick={() => setShowPaymentForm(null)}
                        className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Receipt List Modal */}
      {showReceiptList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="text-blue-500" size={24} />
                Payment Receipts
              </h3>
              <button
                onClick={() => setShowReceiptList(false)}
                className="text-gray-500 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {receipts.length === 0 ? (
                <p className="text-center text-gray-600 py-8">No receipts generated yet</p>
              ) : (
                receipts.map((receipt) => (
                  <div key={receipt.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {receipt.receipt_number}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Date: {formatDate(receipt.receipt_date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Amount: {formatCurrency(receipt.amount)}
                        </p>
                        {receipt.payment_method && (
                          <p className="text-sm text-gray-600">
                            Method: {receipt.payment_method.toUpperCase()}
                          </p>
                        )}
                        {receipt.reference_number && (
                          <p className="text-sm text-gray-600">
                            Reference: {receipt.reference_number}
                          </p>
                        )}
                      </div>
                      {receipt.pdf_url && (
                        <button
                          onClick={() => window.open(receipt.pdf_url, '_blank')}
                          className="text-blue-500 hover:text-blue-700 transition"
                        >
                          <Download size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Final Payment Section */}
      {finalPaymentEligibility && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="text-green-500" size={24} />
            Final Payment
          </h3>

          {finalPaymentEligibility.eligible ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-900 font-semibold flex items-center gap-2">
                <CheckCircle size={20} />
                All preceding payments completed
              </p>
              <p className="text-sm text-green-700 mt-2">
                Final payment is eligible for processing
              </p>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-900 font-semibold flex items-center gap-2">
                <AlertCircle size={20} />
                Not eligible for final payment
              </p>
              <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                {finalPaymentEligibility.reasons.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Final Payment Status:</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {finalPaymentEligibility.finalStageStatus?.toUpperCase() || 'NOT FOUND'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentWorkflowPanel;
