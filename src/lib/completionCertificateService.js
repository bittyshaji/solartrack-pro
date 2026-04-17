import { supabase } from './supabase';

// Constants
export const CERTIFICATE_STATUSES = [
  'draft',
  'generated',
  'submitted',
  'approved',
  'rejected'
];

const STATUS_VALUES = {
  DRAFT: 'draft',
  GENERATED: 'generated',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

/**
 * Generate certificate number in format CC-YYYY-NNN
 * @returns {Promise<string>} Generated certificate number
 */
async function generateCertificateNumber() {
  const year = new Date().getFullYear();

  // Get the count of certificates generated this year
  const { data: certificates, error } = await supabase
    .from('completion_certificates')
    .select('certificate_number', { count: 'exact' })
    .like('certificate_number', `CC-${year}-%`);

  if (error) {
    console.error('Error fetching certificate count:', error);
    throw error;
  }

  const count = (certificates?.length || 0) + 1;
  const paddedCount = String(count).padStart(3, '0');

  return `CC-${year}-${paddedCount}`;
}

/**
 * Get completion certificate for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Certificate data or null if not found
 */
export async function getCertificate(projectId) {
  try {
    const { data, error } = await supabase
      .from('completion_certificates')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No certificate found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching certificate:', error);
    throw error;
  }
}

/**
 * Generate a new completion certificate
 * @param {string} projectId - Project ID
 * @param {Object} data - Certificate data
 * @returns {Promise<Object>} Created certificate
 */
export async function generateCertificate(projectId, data) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // Generate certificate number
    const certificateNumber = await generateCertificateNumber();

    // Prepare certificate data
    const certificateData = {
      project_id: projectId,
      certificate_number: certificateNumber,
      generation_date: new Date().toISOString(),
      issued_by: userId,
      issued_by_name: data.issued_by_name,
      system_capacity_kw: data.system_capacity_kw,
      inverter_make: data.inverter_make,
      inverter_model: data.inverter_model,
      panel_make: data.panel_make,
      panel_model: data.panel_model,
      total_panels: data.total_panels,
      installation_completion_date: data.installation_completion_date,
      commissioned_by: data.commissioned_by,
      commissioning_date: data.commissioning_date,
      approval_status: STATUS_VALUES.GENERATED,
      notes: data.notes || null
    };

    const { data: certificate, error } = await supabase
      .from('completion_certificates')
      .insert([certificateData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return certificate;
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
}

/**
 * Update completion certificate
 * @param {string} id - Certificate ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated certificate
 */
export async function updateCertificate(id, updates) {
  try {
    // Remove fields that should not be directly updated
    const { certificate_number, generation_date, issued_by, ...allowedUpdates } = updates;

    const { data: certificate, error } = await supabase
      .from('completion_certificates')
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return certificate;
  } catch (error) {
    console.error('Error updating certificate:', error);
    throw error;
  }
}

/**
 * Submit certificate to KSEB
 * @param {string} id - Certificate ID
 * @param {string} submissionDate - Submission date (ISO format)
 * @returns {Promise<Object>} Updated certificate
 */
export async function submitToKSEB(id, submissionDate) {
  try {
    const { data: certificate, error } = await supabase
      .from('completion_certificates')
      .update({
        approval_status: STATUS_VALUES.SUBMITTED,
        kseb_submission_date: submissionDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return certificate;
  } catch (error) {
    console.error('Error submitting to KSEB:', error);
    throw error;
  }
}

/**
 * Approve completion certificate
 * @param {string} id - Certificate ID
 * @param {string} approvalDate - Approval date (ISO format)
 * @param {string} kseRefNumber - KSEB reference number
 * @returns {Promise<Object>} Updated certificate
 */
export async function approveCertificate(id, approvalDate, kseRefNumber) {
  try {
    const { data: certificate, error } = await supabase
      .from('completion_certificates')
      .update({
        approval_status: STATUS_VALUES.APPROVED,
        kseb_approval_date: approvalDate,
        kseb_reference_number: kseRefNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return certificate;
  } catch (error) {
    console.error('Error approving certificate:', error);
    throw error;
  }
}

/**
 * Reject completion certificate
 * @param {string} id - Certificate ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Updated certificate
 */
export async function rejectCertificate(id, reason) {
  try {
    const { data: certificate, error } = await supabase
      .from('completion_certificates')
      .update({
        approval_status: STATUS_VALUES.REJECTED,
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return certificate;
  } catch (error) {
    console.error('Error rejecting certificate:', error);
    throw error;
  }
}

/**
 * Update performance test results
 * @param {string} id - Certificate ID
 * @param {Object} results - Performance test results {voltage, current, power_output, efficiency}
 * @returns {Promise<Object>} Updated certificate
 */
export async function updatePerformanceResults(id, results) {
  try {
    const { data: certificate, error } = await supabase
      .from('completion_certificates')
      .update({
        performance_test_results: results,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return certificate;
  } catch (error) {
    console.error('Error updating performance results:', error);
    throw error;
  }
}

/**
 * Get status color for UI rendering
 * @param {string} status - Certificate status
 * @returns {string} Tailwind CSS classes
 */
export function getStatusColor(status) {
  const statusColors = {
    [STATUS_VALUES.DRAFT]: 'bg-gray-100 text-gray-800 border-gray-300',
    [STATUS_VALUES.GENERATED]: 'bg-blue-100 text-blue-800 border-blue-300',
    [STATUS_VALUES.SUBMITTED]: 'bg-amber-100 text-amber-800 border-amber-300',
    [STATUS_VALUES.APPROVED]: 'bg-green-100 text-green-800 border-green-300',
    [STATUS_VALUES.REJECTED]: 'bg-red-100 text-red-800 border-red-300'
  };
  return statusColors[status] || statusColors[STATUS_VALUES.DRAFT];
}

/**
 * Get status display text
 * @param {string} status - Certificate status
 * @returns {string} Display text
 */
export function getStatusText(status) {
  const statusTexts = {
    [STATUS_VALUES.DRAFT]: 'Draft',
    [STATUS_VALUES.GENERATED]: 'Generated',
    [STATUS_VALUES.SUBMITTED]: 'Submitted to KSEB',
    [STATUS_VALUES.APPROVED]: 'Approved',
    [STATUS_VALUES.REJECTED]: 'Rejected'
  };
  return statusTexts[status] || 'Unknown';
}
