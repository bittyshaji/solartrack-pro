import { supabase } from './supabase';

// Constants
export const PAYMENT_STAGE_NAMES = {
  ADVANCE: 'advance',
  INTERIM_1: 'interim_1',
  INTERIM_2: 'interim_2',
  FINAL: 'final',
};

export const PAYMENT_STATUSES = {
  PENDING: 'pending',
  DUE: 'due',
  PAID: 'paid',
  OVERDUE: 'overdue',
  WAIVED: 'waived',
};

export const PAYMENT_METHODS = {
  CASH: 'cash',
  CHECK: 'check',
  BANK_TRANSFER: 'bank_transfer',
  UPI: 'upi',
  ONLINE: 'online',
};

// Get all payment stages for a project
export const getPaymentStages = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('payment_stages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching payment stages:', error);
    return { data: null, error: error.message };
  }
};

// Create default payment stages for a new project
export const createDefaultPaymentStages = async (projectId, totalAmount) => {
  try {
    const stages = [
      {
        project_id: projectId,
        stage_name: PAYMENT_STAGE_NAMES.ADVANCE,
        stage_percentage: 30,
        payment_amount: (totalAmount * 0.3).toFixed(2),
        payment_status: PAYMENT_STATUSES.PENDING,
        trigger_condition: 'Project initiation',
        due_date: new Date().toISOString().split('T')[0], // Today
      },
      {
        project_id: projectId,
        stage_name: PAYMENT_STAGE_NAMES.INTERIM_1,
        stage_percentage: 40,
        payment_amount: (totalAmount * 0.4).toFixed(2),
        payment_status: PAYMENT_STATUSES.PENDING,
        trigger_condition: 'Material procurement',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        project_id: projectId,
        stage_name: PAYMENT_STAGE_NAMES.FINAL,
        stage_percentage: 30,
        payment_amount: (totalAmount * 0.3).toFixed(2),
        payment_status: PAYMENT_STATUSES.PENDING,
        trigger_condition: 'Installation completion',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ];

    const { data, error } = await supabase
      .from('payment_stages')
      .insert(stages)
      .select();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error creating default payment stages:', error);
    return { data: null, error: error.message };
  }
};

// Update a payment stage
export const updatePaymentStage = async (stageId, updates) => {
  try {
    const { data, error } = await supabase
      .from('payment_stages')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stageId)
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error('Error updating payment stage:', error);
    return { data: null, error: error.message };
  }
};

// Mark payment as received
export const markPaymentReceived = async (
  stageId,
  { paymentMethod, paymentReference, paymentDate, notes }
) => {
  try {
    const { data, error } = await supabase
      .from('payment_stages')
      .update({
        payment_status: PAYMENT_STATUSES.PAID,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
        payment_received_date: paymentDate,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stageId)
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error('Error marking payment received:', error);
    return { data: null, error: error.message };
  }
};

// Waive a payment stage
export const waivePayment = async (stageId, reason) => {
  try {
    const { data, error } = await supabase
      .from('payment_stages')
      .update({
        payment_status: PAYMENT_STATUSES.WAIVED,
        notes: reason || 'Payment waived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', stageId)
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error('Error waiving payment:', error);
    return { data: null, error: error.message };
  }
};

// Get payment summary for a project
export const getPaymentSummary = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('payment_stages')
      .select('payment_amount, payment_status, stage_percentage')
      .eq('project_id', projectId);

    if (error) throw error;

    const totalAmount = data.reduce((sum, stage) => sum + (parseFloat(stage.payment_amount) || 0), 0);
    const paidAmount = data
      .filter((stage) => stage.payment_status === PAYMENT_STATUSES.PAID)
      .reduce((sum, stage) => sum + (parseFloat(stage.payment_amount) || 0), 0);

    const waivedAmount = data
      .filter((stage) => stage.payment_status === PAYMENT_STATUSES.WAIVED)
      .reduce((sum, stage) => sum + (parseFloat(stage.payment_amount) || 0), 0);

    const remainingAmount = totalAmount - paidAmount;
    const percentagePaid = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

    return {
      data: {
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        paidAmount: parseFloat(paidAmount.toFixed(2)),
        waivedAmount: parseFloat(waivedAmount.toFixed(2)),
        remainingAmount: parseFloat(remainingAmount.toFixed(2)),
        percentagePaid,
        stageCount: data.length,
        paidStageCount: data.filter((s) => s.payment_status === PAYMENT_STATUSES.PAID).length,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    return { data: null, error: error.message };
  }
};

// Generate receipt number (format: PR-YYYY-NNN)
const generateReceiptNumber = async (projectId) => {
  try {
    // Get current year
    const year = new Date().getFullYear();

    // Get count of receipts for this year
    const { data: receipts, error: countError } = await supabase
      .from('payment_receipts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${year}-01-01`)
      .lte('created_at', `${year}-12-31`);

    if (countError) throw countError;

    const count = (receipts?.length || 0) + 1;
    const paddedCount = String(count).padStart(3, '0');

    return `PR-${year}-${paddedCount}`;
  } catch (error) {
    console.error('Error generating receipt number:', error);
    throw error;
  }
};

// Generate receipt for a payment
export const generateReceipt = async (stageId, receiptData = {}) => {
  try {
    // Fetch the payment stage
    const { data: stage, error: stageError } = await supabase
      .from('payment_stages')
      .select('*')
      .eq('id', stageId)
      .single();

    if (stageError) throw stageError;

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(stage.project_id);

    // Create receipt record
    const { data, error } = await supabase
      .from('payment_receipts')
      .insert({
        payment_stage_id: stageId,
        project_id: stage.project_id,
        receipt_number: receiptNumber,
        receipt_date: receiptData.receipt_date || new Date().toISOString().split('T')[0],
        amount: stage.payment_amount,
        payment_method: stage.payment_method,
        reference_number: stage.payment_reference,
        generated_by: receiptData.generated_by,
        pdf_url: receiptData.pdf_url,
        notes: receiptData.notes,
      })
      .select();

    if (error) throw error;

    // Update payment stage with receipt number
    await supabase
      .from('payment_stages')
      .update({ receipt_number: receiptNumber })
      .eq('id', stageId);

    return { data: data?.[0], error: null };
  } catch (error) {
    console.error('Error generating receipt:', error);
    return { data: null, error: error.message };
  }
};

// Get all receipts for a project
export const getReceipts = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('payment_receipts')
      .select('*')
      .eq('project_id', projectId)
      .order('receipt_date', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return { data: null, error: error.message };
  }
};

// Check final payment eligibility
export const checkFinalPaymentEligibility = async (projectId) => {
  try {
    const { data: stages, error } = await supabase
      .from('payment_stages')
      .select('id, stage_name, payment_status')
      .eq('project_id', projectId);

    if (error) throw error;

    const finalStage = stages.find((s) => s.stage_name === PAYMENT_STAGE_NAMES.FINAL);
    const otherStages = stages.filter((s) => s.stage_name !== PAYMENT_STAGE_NAMES.FINAL);

    // Check if all non-final stages are either paid or waived
    const allOtherStagesPaid = otherStages.every(
      (s) => s.payment_status === PAYMENT_STATUSES.PAID || s.payment_status === PAYMENT_STATUSES.WAIVED
    );

    const eligibilityStatus = {
      eligible: allOtherStagesPaid,
      reasons: [],
      finalStageStatus: finalStage?.payment_status,
    };

    if (!allOtherStagesPaid) {
      const unpaidStages = otherStages.filter(
        (s) => s.payment_status !== PAYMENT_STATUSES.PAID && s.payment_status !== PAYMENT_STATUSES.WAIVED
      );
      eligibilityStatus.reasons.push(
        `${unpaidStages.length} preceding payment stage(s) are not yet completed`
      );
    }

    return { data: eligibilityStatus, error: null };
  } catch (error) {
    console.error('Error checking final payment eligibility:', error);
    return { data: null, error: error.message };
  }
};

// Get all overdue payments
export const getOverduePayments = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('payment_stages')
      .select('*, projects(id, name, estimate_amount)')
      .lt('due_date', today)
      .in('payment_status', [PAYMENT_STATUSES.PENDING, PAYMENT_STATUSES.DUE])
      .order('due_date', { ascending: true });

    if (error) throw error;

    // Calculate days overdue
    const dataWithDaysOverdue = data.map((stage) => ({
      ...stage,
      daysOverdue: Math.floor((new Date(today) - new Date(stage.due_date)) / (1000 * 60 * 60 * 24)),
    }));

    return { data: dataWithDaysOverdue, error: null };
  } catch (error) {
    console.error('Error fetching overdue payments:', error);
    return { data: null, error: error.message };
  }
};

// Update payment status based on due date
export const updatePaymentStatusByDueDate = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Update pending payments past due date to 'overdue'
    const { error: updateError } = await supabase
      .from('payment_stages')
      .update({
        payment_status: PAYMENT_STATUSES.OVERDUE,
        updated_at: new Date().toISOString(),
      })
      .lt('due_date', today)
      .eq('payment_status', PAYMENT_STATUSES.PENDING);

    if (updateError) throw updateError;

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error updating payment status by due date:', error);
    return { data: null, error: error.message };
  }
};

// Get payment history for a project
export const getPaymentHistory = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('payment_stages')
      .select(
        `
        id,
        stage_name,
        payment_amount,
        payment_status,
        payment_received_date,
        payment_method,
        payment_reference,
        receipt_number,
        updated_at
      `
      )
      .eq('project_id', projectId)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return { data: null, error: error.message };
  }
};
