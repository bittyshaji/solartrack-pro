import { supabase } from './supabase';

// Constants
export const CLAIM_STATUSES = {
  OPEN: 'open',
  UNDER_ASSESSMENT: 'under_assessment',
  APPROVED: 'approved',
  DENIED: 'denied',
  REPAIR_COMPLETED: 'repair_completed',
  CLOSED: 'closed',
};

export const ISSUE_TYPES = {
  EQUIPMENT_FAILURE: 'equipment_failure',
  PERFORMANCE_DROP: 'performance_drop',
  DEFECTIVE_PARTS: 'defective_parts',
  INSTALLATION_DEFECT: 'installation_defect',
  OTHER: 'other',
};

export const RESOLUTION_TYPES = {
  REPAIR: 'repair',
  REPLACEMENT: 'replacement',
  REFUND: 'refund',
  NONE: 'none',
};

export const REMINDER_TYPES = {
  SIX_MONTHS: '6_months',
  THREE_MONTHS: '3_months',
  ONE_MONTH: '1_month',
  ONE_WEEK: '1_week',
  EXPIRED: 'expired',
};

export const EXTENSION_PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  WAIVED: 'waived',
};

/**
 * Get warranty for a project with all claims
 * @param {string} projectId - Project UUID
 * @returns {Promise<Object>} Warranty data with claims
 */
export async function getWarranty(projectId) {
  try {
    const { data, error } = await supabase
      .from('project_warranties')
      .select(
        `
        *,
        warranty_claims(*)
      `
      )
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching warranty:', error);
    throw error;
  }
}

/**
 * Create a new warranty for a project
 * @param {string} projectId - Project UUID
 * @param {Object} data - Warranty data
 * @returns {Promise<Object>} Created warranty
 */
export async function createWarranty(projectId, data) {
  try {
    const {
      commissioningDate,
      defaultWarrantyMonths = 60,
      warrantyProvider,
      coverageDetails,
      inclusions = [],
      exclusions = [],
      notes,
    } = data;

    // Calculate warranty dates
    const startDate = new Date(commissioningDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + defaultWarrantyMonths);

    const warrantyData = {
      project_id: projectId,
      commissioning_date: commissioningDate,
      default_warranty_months: defaultWarrantyMonths,
      warranty_start_date: commissioningDate,
      warranty_end_date: endDate.toISOString().split('T')[0],
      warranty_provider: warrantyProvider || null,
      coverage_details: coverageDetails || null,
      inclusions: inclusions,
      exclusions: exclusions,
      notes: notes || null,
    };

    const { data: warranty, error } = await supabase
      .from('project_warranties')
      .insert([warrantyData])
      .select()
      .single();

    if (error) throw error;
    return warranty;
  } catch (error) {
    console.error('Error creating warranty:', error);
    throw error;
  }
}

/**
 * Update warranty information
 * @param {string} id - Warranty UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated warranty
 */
export async function updateWarranty(id, updates) {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('project_warranties')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating warranty:', error);
    throw error;
  }
}

/**
 * Request warranty extension
 * @param {string} warrantyId - Warranty UUID
 * @param {number} months - Months to extend
 * @param {string} reason - Reason for extension
 * @param {number} cost - Extension cost
 * @returns {Promise<Object>} Updated warranty
 */
export async function requestExtension(warrantyId, months, reason, cost) {
  try {
    const { data, error } = await supabase
      .from('project_warranties')
      .update({
        extension_requested: true,
        extension_request_date: new Date().toISOString().split('T')[0],
        extension_request_reason: reason,
        extension_months_requested: months,
        extension_cost: cost,
        extension_payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', warrantyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error requesting extension:', error);
    throw error;
  }
}

/**
 * Approve warranty extension
 * @param {string} warrantyId - Warranty UUID
 * @param {Object} approvalData - Approval details
 * @returns {Promise<Object>} Updated warranty
 */
export async function approveExtension(warrantyId, approvalData = {}) {
  try {
    // Get current warranty to calculate new end date
    const { data: warranty, error: fetchError } = await supabase
      .from('project_warranties')
      .select('warranty_end_date, extension_months_requested')
      .eq('id', warrantyId)
      .single();

    if (fetchError) throw fetchError;

    // Calculate new end date
    const currentEndDate = new Date(warranty.warranty_end_date);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(
      newEndDate.getMonth() + (warranty.extension_months_requested || 0)
    );

    const { data, error } = await supabase
      .from('project_warranties')
      .update({
        extension_approved: true,
        extension_approved_date: new Date().toISOString().split('T')[0],
        extension_approved_by: approvalData.approvedBy || null,
        extended_warranty_months: warranty.extension_months_requested,
        new_warranty_end_date: newEndDate.toISOString().split('T')[0],
        extension_payment_status: approvalData.paymentStatus || 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', warrantyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error approving extension:', error);
    throw error;
  }
}

/**
 * Deny warranty extension
 * @param {string} warrantyId - Warranty UUID
 * @param {string} reason - Reason for denial
 * @returns {Promise<Object>} Updated warranty
 */
export async function denyExtension(warrantyId, reason) {
  try {
    const { data, error } = await supabase
      .from('project_warranties')
      .update({
        extension_requested: false,
        extension_request_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', warrantyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error denying extension:', error);
    throw error;
  }
}

/**
 * Get all claims for a warranty
 * @param {string} warrantyId - Warranty UUID
 * @returns {Promise<Array>} Array of claims
 */
export async function getWarrantyClaims(warrantyId) {
  try {
    const { data, error } = await supabase
      .from('warranty_claims')
      .select('*')
      .eq('project_warranty_id', warrantyId)
      .order('claim_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching warranty claims:', error);
    throw error;
  }
}

/**
 * Create a new warranty claim
 * @param {string} warrantyId - Warranty UUID
 * @param {string} projectId - Project UUID
 * @param {Object} data - Claim data
 * @returns {Promise<Object>} Created claim
 */
export async function createClaim(warrantyId, projectId, data) {
  try {
    const {
      claimTitle,
      claimDescription,
      issueType,
      affectedComponent,
      claimAmount,
    } = data;

    // Generate claim number (WC-YYYY-NNN)
    const currentYear = new Date().getFullYear();
    const claimNumber = await generateClaimNumber(currentYear);

    const claimData = {
      project_warranty_id: warrantyId,
      project_id: projectId,
      claim_date: new Date().toISOString().split('T')[0],
      claim_number: claimNumber,
      claim_title: claimTitle,
      claim_description: claimDescription,
      issue_type: issueType,
      affected_component: affectedComponent || null,
      claim_amount: claimAmount || null,
      claim_status: CLAIM_STATUSES.OPEN,
    };

    const { data: claim, error } = await supabase
      .from('warranty_claims')
      .insert([claimData])
      .select()
      .single();

    if (error) throw error;
    return claim;
  } catch (error) {
    console.error('Error creating claim:', error);
    throw error;
  }
}

/**
 * Generate unique claim number
 * @param {number} year - Year for claim number
 * @returns {Promise<string>} Claim number (WC-YYYY-NNN)
 */
async function generateClaimNumber(year) {
  try {
    // Get the count of claims for this year
    const { data, error } = await supabase
      .from('warranty_claims')
      .select('claim_number', { count: 'exact' })
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    if (error) throw error;

    const count = (data?.length || 0) + 1;
    const paddedCount = String(count).padStart(3, '0');
    return `WC-${year}-${paddedCount}`;
  } catch (error) {
    console.error('Error generating claim number:', error);
    // Fallback claim number
    return `WC-${year}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;
  }
}

/**
 * Update claim status
 * @param {string} claimId - Claim UUID
 * @param {string} status - New status
 * @param {string} notes - Assessment/status notes
 * @returns {Promise<Object>} Updated claim
 */
export async function updateClaimStatus(claimId, status, notes = '') {
  try {
    const { data, error } = await supabase
      .from('warranty_claims')
      .update({
        claim_status: status,
        assessment_notes: notes || null,
        assessment_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating claim status:', error);
    throw error;
  }
}

/**
 * Resolve a warranty claim
 * @param {string} claimId - Claim UUID
 * @param {Object} resolutionData - Resolution details
 * @returns {Promise<Object>} Updated claim
 */
export async function resolveClaim(claimId, resolutionData) {
  try {
    const {
      resolutionType,
      resolutionDescription,
      approvedAmount,
      resolvedBy,
    } = resolutionData;

    const { data, error } = await supabase
      .from('warranty_claims')
      .update({
        claim_status: CLAIM_STATUSES.CLOSED,
        resolution_type: resolutionType,
        resolution_description: resolutionDescription,
        resolution_date: new Date().toISOString().split('T')[0],
        resolved_by: resolvedBy || null,
        approved_amount: approvedAmount || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', claimId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error resolving claim:', error);
    throw error;
  }
}

/**
 * Get warranties expiring within X days
 * @param {number} daysWithin - Days to look ahead
 * @returns {Promise<Array>} Array of expiring warranties
 */
export async function getExpiringWarranties(daysWithin = 90) {
  try {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysWithin);

    const { data, error } = await supabase
      .from('project_warranties')
      .select(
        `
        *,
        projects(id, customer_name, installation_address)
      `
      )
      .gte('warranty_end_date', today.toISOString().split('T')[0])
      .lte('warranty_end_date', futureDate.toISOString().split('T')[0])
      .order('warranty_end_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching expiring warranties:', error);
    throw error;
  }
}

/**
 * Calculate days remaining on warranty
 * @param {string} warrantyEndDate - End date in YYYY-MM-DD format
 * @returns {number} Days remaining (negative if expired)
 */
export function getDaysRemaining(warrantyEndDate) {
  if (!warrantyEndDate) return null;

  const endDate = new Date(warrantyEndDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const timeDiff = endDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Format days remaining as human readable string
 * @param {number} days - Days remaining
 * @returns {string} Formatted string
 */
export function formatDaysRemaining(days) {
  if (days === null || days === undefined) return 'Unknown';
  if (days < 0) return `Expired ${Math.abs(days)} days ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= 30) return `${days} days remaining`;
  const months = Math.floor(days / 30);
  return `${months} months remaining`;
}

/**
 * Get warranty status color for UI
 * @param {number} daysRemaining - Days remaining
 * @returns {string} Color class name
 */
export function getWarrantyStatusColor(daysRemaining) {
  if (daysRemaining === null) return 'gray';
  if (daysRemaining < 0) return 'red';
  if (daysRemaining < 30) return 'orange';
  if (daysRemaining < 90) return 'yellow';
  return 'green';
}

/**
 * Get claim status color for UI
 * @param {string} status - Claim status
 * @returns {string} Color name
 */
export function getClaimStatusColor(status) {
  const colors = {
    [CLAIM_STATUSES.OPEN]: 'blue',
    [CLAIM_STATUSES.UNDER_ASSESSMENT]: 'yellow',
    [CLAIM_STATUSES.APPROVED]: 'green',
    [CLAIM_STATUSES.DENIED]: 'red',
    [CLAIM_STATUSES.REPAIR_COMPLETED]: 'indigo',
    [CLAIM_STATUSES.CLOSED]: 'gray',
  };
  return colors[status] || 'gray';
}
