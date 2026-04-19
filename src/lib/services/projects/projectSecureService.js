import { supabase } from './supabase';

// Export status and requirement constants
export const SECURE_STATUSES = ['lead', 'quoted', 'secured', 'cancelled'];
export const REQUIREMENT_TYPES = [
  'signed_quote',
  'advance_payment',
  'written_confirmation',
  'customer_signature',
];

/**
 * Get security status for a project with all its requirements
 * @param {string} projectId - The project UUID
 * @returns {Promise<object>} Security status with requirements array
 */
export async function getSecurityStatus(projectId) {
  try {
    const { data: status, error: statusError } = await supabase
      .from('project_security_status')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (statusError && statusError.code !== 'PGRST116') {
      throw statusError;
    }

    const { data: requirements, error: reqError } = await supabase
      .from('project_security_requirements')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (reqError) throw reqError;

    return {
      status: status || null,
      requirements: requirements || [],
    };
  } catch (error) {
    console.error('Error fetching security status:', error);
    throw error;
  }
}

/**
 * Create initial security status with 4 default requirements
 * @param {string} projectId - The project UUID
 * @returns {Promise<object>} Created security status
 */
export async function createSecurityStatus(projectId) {
  try {
    // Create the security status record
    const { data: status, error: statusError } = await supabase
      .from('project_security_status')
      .insert({
        project_id: projectId,
        secure_status: 'lead',
      })
      .select()
      .single();

    if (statusError) throw statusError;

    // Create default requirements
    const defaultRequirements = REQUIREMENT_TYPES.map((type) => ({
      project_id: projectId,
      requirement_type: type,
      is_completed: false,
    }));

    const { data: requirements, error: reqError } = await supabase
      .from('project_security_requirements')
      .insert(defaultRequirements)
      .select();

    if (reqError) throw reqError;

    return {
      status,
      requirements,
    };
  } catch (error) {
    console.error('Error creating security status:', error);
    throw error;
  }
}

/**
 * Update secure status with validation
 * @param {string} projectId - The project UUID
 * @param {string} newStatus - New status ('lead', 'quoted', 'secured', 'cancelled')
 * @returns {Promise<object>} Updated status
 */
export async function updateSecureStatus(projectId, newStatus) {
  try {
    if (!SECURE_STATUSES.includes(newStatus)) {
      throw new Error(
        `Invalid status: ${newStatus}. Must be one of: ${SECURE_STATUSES.join(', ')}`
      );
    }

    // If transitioning to 'secured', check that all requirements are met
    if (newStatus === 'secured') {
      const allMet = await checkAllRequirementsMet(projectId);
      if (!allMet) {
        throw new Error(
          'Cannot secure project: not all requirements have been completed'
        );
      }
    }

    const updateData = {
      secure_status: newStatus,
    };

    // If securing, add secured_date and user info
    if (newStatus === 'secured') {
      updateData.secured_date = new Date().toISOString();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        updateData.secured_by = user.id;
      }
    }

    const { data, error } = await supabase
      .from('project_security_status')
      .update(updateData)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating secure status:', error);
    throw error;
  }
}

/**
 * Mark a requirement as completed with proof document
 * @param {string} requirementId - The requirement UUID
 * @param {string} proofUrl - URL to the proof document
 * @returns {Promise<object>} Updated requirement
 */
export async function completeRequirement(requirementId, proofUrl) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('project_security_requirements')
      .update({
        is_completed: true,
        completed_date: new Date().toISOString(),
        completed_by: user?.id || null,
        proof_document_url: proofUrl,
      })
      .eq('id', requirementId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error completing requirement:', error);
    throw error;
  }
}

/**
 * Secure a project with all metadata
 * @param {string} projectId - The project UUID
 * @param {object} data - Additional data (advancePaymentAmount, advancePaymentDate, customerSignatureUrl, notes, etc.)
 * @returns {Promise<object>} Updated security status
 */
export async function secureProject(projectId, data = {}) {
  try {
    const allMet = await checkAllRequirementsMet(projectId);
    if (!allMet) {
      throw new Error(
        'Cannot secure project: not all requirements have been completed'
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const updateData = {
      secure_status: 'secured',
      secured_date: new Date().toISOString(),
      secured_by: user?.id || null,
      lock_changes: true,
      ...data,
    };

    const { data: result, error } = await supabase
      .from('project_security_status')
      .update(updateData)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;

    return result;
  } catch (error) {
    console.error('Error securing project:', error);
    throw error;
  }
}

/**
 * Unsecure a project (admin/owner only)
 * @param {string} projectId - The project UUID
 * @param {string} reason - Reason for unsecuring
 * @returns {Promise<object>} Updated security status
 */
export async function unsecureProject(projectId, reason = '') {
  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user.id !== project.user_id) {
      throw new Error('Only project owner can unsecure a project');
    }

    const { data, error } = await supabase
      .from('project_security_status')
      .update({
        secure_status: 'quoted',
        lock_changes: false,
        notes: reason ? `Unsecured: ${reason}` : 'Unsecured',
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error unsecuring project:', error);
    throw error;
  }
}

/**
 * Check if all requirements for a project are completed
 * @param {string} projectId - The project UUID
 * @returns {Promise<boolean>} True if all requirements are completed
 */
export async function checkAllRequirementsMet(projectId) {
  try {
    const { data: requirements, error } = await supabase
      .from('project_security_requirements')
      .select('is_completed')
      .eq('project_id', projectId);

    if (error) throw error;

    if (!requirements || requirements.length === 0) {
      return false;
    }

    return requirements.every((req) => req.is_completed === true);
  } catch (error) {
    console.error('Error checking requirements:', error);
    return false;
  }
}

/**
 * Get a human-readable label for requirement type
 * @param {string} requirementType - The requirement type
 * @returns {string} Human-readable label
 */
export function getRequirementLabel(requirementType) {
  const labels = {
    signed_quote: 'Signed Quote',
    advance_payment: 'Advance Payment',
    written_confirmation: 'Written Confirmation',
    customer_signature: 'Customer Signature',
  };
  return labels[requirementType] || requirementType;
}

/**
 * Get icon name for requirement type (lucide-react)
 * @param {string} requirementType - The requirement type
 * @returns {string} Icon name
 */
export function getRequirementIcon(requirementType) {
  const icons = {
    signed_quote: 'FileText',
    advance_payment: 'DollarSign',
    written_confirmation: 'CheckCircle',
    customer_signature: 'PenTool',
  };
  return icons[requirementType] || 'FileText';
}

/**
 * Format advance payment amount to currency
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (!amount) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
