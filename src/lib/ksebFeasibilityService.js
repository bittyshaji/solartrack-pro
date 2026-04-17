import { supabase } from './supabase';

// Constants
export const SUBMISSION_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REVISION_REQUESTED: 'revision_requested',
  RESUBMITTED: 'resubmitted'
};

export const DOCUMENT_TYPES = {
  SITE_PLAN: 'site_plan',
  ELECTRICAL_DRAWINGS: 'electrical_drawings',
  CUSTOMER_DETAILS: 'customer_details',
  PROPERTY_DOCS: 'property_docs',
  SANCTION_LETTER: 'sanction_letter',
  TEST_REPORT: 'test_report',
  OTHER: 'other'
};

export const SYSTEM_TYPES = {
  RESIDENTIAL: 'residential',
  COMMERCIAL: 'commercial',
  INDUSTRIAL: 'industrial'
};

export const MOUNTING_TYPES = {
  ROOF: 'roof',
  GROUND: 'ground',
  HYBRID: 'hybrid'
};

// Helper function to create activity log
async function createActivityLog(submissionId, activityType, description, previousStatus = null, newStatus = null) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  const { error } = await supabase
    .from('kseb_activity_logs')
    .insert({
      submission_id: submissionId,
      activity_type: activityType,
      description,
      performed_by: userId,
      previous_status: previousStatus,
      new_status: newStatus
    });

  if (error) {
    console.error('Error creating activity log:', error);
    throw error;
  }
}

/**
 * Get feasibility submission with all documents and activity logs
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Feasibility submission object with nested documents and logs
 */
export async function getFeasibility(projectId) {
  try {
    const { data: submission, error: submissionError } = await supabase
      .from('kseb_feasibility_submissions')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (submissionError) {
      if (submissionError.code === 'PGRST116') {
        // No submission found - this is expected for new projects
        return null;
      }
      throw submissionError;
    }

    if (!submission) {
      return null;
    }

    // Fetch documents
    const { data: documents, error: docsError } = await supabase
      .from('kseb_feasibility_documents')
      .select('*')
      .eq('submission_id', submission.id)
      .order('uploaded_at', { ascending: false });

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      throw docsError;
    }

    // Fetch activity logs
    const { data: activityLogs, error: logsError } = await supabase
      .from('kseb_activity_logs')
      .select('*')
      .eq('submission_id', submission.id)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Error fetching activity logs:', logsError);
      throw logsError;
    }

    return {
      ...submission,
      documents: documents || [],
      activityLogs: activityLogs || []
    };
  } catch (error) {
    console.error('Error fetching feasibility:', error);
    throw error;
  }
}

/**
 * Create a new feasibility submission (draft)
 * @param {string} projectId - Project ID
 * @param {Object} data - Submission data
 * @returns {Promise<Object>} Created submission object
 */
export async function createFeasibility(projectId, data) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data: submission, error } = await supabase
      .from('kseb_feasibility_submissions')
      .insert({
        project_id: projectId,
        capacity_kw: data.capacityKw,
        system_type: data.systemType,
        inverter_make: data.inverterMake,
        inverter_model: data.inverterModel,
        panel_make: data.panelMake,
        panel_model: data.panelModel,
        mounting_type: data.mountingType,
        kseb_division: data.ksebDivision,
        submission_status: SUBMISSION_STATUSES.DRAFT,
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await createActivityLog(
      submission.id,
      'submission_created',
      'Feasibility submission draft created'
    );

    return submission;
  } catch (error) {
    console.error('Error creating feasibility:', error);
    throw error;
  }
}

/**
 * Update feasibility submission fields (only draft)
 * @param {string} id - Submission ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated submission object
 */
export async function updateFeasibility(id, updates) {
  try {
    // Check submission status first
    const { data: existing } = await supabase
      .from('kseb_feasibility_submissions')
      .select('submission_status')
      .eq('id', id)
      .single();

    if (existing && ![SUBMISSION_STATUSES.DRAFT, SUBMISSION_STATUSES.REVISION_REQUESTED].includes(existing.submission_status)) {
      throw new Error('Can only update draft or revision_requested submissions');
    }

    const updatePayload = {};

    // Map camelCase to snake_case
    if (updates.capacityKw !== undefined) updatePayload.capacity_kw = updates.capacityKw;
    if (updates.systemType !== undefined) updatePayload.system_type = updates.systemType;
    if (updates.inverterMake !== undefined) updatePayload.inverter_make = updates.inverterMake;
    if (updates.inverterModel !== undefined) updatePayload.inverter_model = updates.inverterModel;
    if (updates.panelMake !== undefined) updatePayload.panel_make = updates.panelMake;
    if (updates.panelModel !== undefined) updatePayload.panel_model = updates.panelModel;
    if (updates.mountingType !== undefined) updatePayload.mounting_type = updates.mountingType;
    if (updates.ksebDivision !== undefined) updatePayload.kseb_division = updates.ksebDivision;
    if (updates.referenceNumber !== undefined) updatePayload.reference_number = updates.referenceNumber;

    updatePayload.updated_at = new Date().toISOString();

    const { data: submission, error } = await supabase
      .from('kseb_feasibility_submissions')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await createActivityLog(
      id,
      'submission_updated',
      'Feasibility submission details updated'
    );

    return submission;
  } catch (error) {
    console.error('Error updating feasibility:', error);
    throw error;
  }
}

/**
 * Submit feasibility (transition from draft to submitted)
 * @param {string} id - Submission ID
 * @returns {Promise<Object>} Updated submission object
 */
export async function submitFeasibility(id) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data: submission, error } = await supabase
      .from('kseb_feasibility_submissions')
      .update({
        submission_status: SUBMISSION_STATUSES.SUBMITTED,
        submitted_by: userId,
        submitted_at: new Date().toISOString(),
        submission_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await createActivityLog(
      id,
      'submission_submitted',
      'Feasibility submission submitted to KSEB',
      SUBMISSION_STATUSES.DRAFT,
      SUBMISSION_STATUSES.SUBMITTED
    );

    return submission;
  } catch (error) {
    console.error('Error submitting feasibility:', error);
    throw error;
  }
}

/**
 * Update feasibility submission status with activity log
 * @param {string} id - Submission ID
 * @param {string} newStatus - New status
 * @param {string} comments - Optional comments
 * @returns {Promise<Object>} Updated submission object
 */
export async function updateFeasibilityStatus(id, newStatus, comments = null) {
  try {
    const { data: existing } = await supabase
      .from('kseb_feasibility_submissions')
      .select('submission_status')
      .eq('id', id)
      .single();

    if (!existing) {
      throw new Error('Submission not found');
    }

    const previousStatus = existing.submission_status;

    const updatePayload = {
      submission_status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (comments) {
      updatePayload.reviewer_comments = comments;
    }

    const { data: submission, error } = await supabase
      .from('kseb_feasibility_submissions')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await createActivityLog(
      id,
      'status_changed',
      `Status changed to ${newStatus}${comments ? ': ' + comments : ''}`,
      previousStatus,
      newStatus
    );

    return submission;
  } catch (error) {
    console.error('Error updating feasibility status:', error);
    throw error;
  }
}

/**
 * Approve feasibility submission
 * @param {string} id - Submission ID
 * @param {string} approvalDate - Approval date (ISO format)
 * @param {string} sanctionLetterUrl - URL to sanction letter
 * @returns {Promise<Object>} Updated submission object
 */
export async function approveFeasibility(id, approvalDate, sanctionLetterUrl) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data: submission, error } = await supabase
      .from('kseb_feasibility_submissions')
      .update({
        submission_status: SUBMISSION_STATUSES.APPROVED,
        approval_date: approvalDate,
        sanction_letter_url: sanctionLetterUrl,
        reviewer_name: userData?.user?.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await createActivityLog(
      id,
      'feasibility_approved',
      `Feasibility approved on ${approvalDate}`,
      SUBMISSION_STATUSES.UNDER_REVIEW,
      SUBMISSION_STATUSES.APPROVED
    );

    return submission;
  } catch (error) {
    console.error('Error approving feasibility:', error);
    throw error;
  }
}

/**
 * Reject feasibility submission
 * @param {string} id - Submission ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Updated submission object
 */
export async function rejectFeasibility(id, reason) {
  try {
    const { data: userData } = await supabase.auth.getUser();

    const { data: submission, error } = await supabase
      .from('kseb_feasibility_submissions')
      .update({
        submission_status: SUBMISSION_STATUSES.REJECTED,
        reviewer_comments: reason,
        reviewer_name: userData?.user?.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await createActivityLog(
      id,
      'feasibility_rejected',
      `Feasibility rejected: ${reason}`,
      SUBMISSION_STATUSES.UNDER_REVIEW,
      SUBMISSION_STATUSES.REJECTED
    );

    return submission;
  } catch (error) {
    console.error('Error rejecting feasibility:', error);
    throw error;
  }
}

/**
 * Request revision on feasibility submission
 * @param {string} id - Submission ID
 * @param {string} reason - Revision reason
 * @returns {Promise<Object>} Updated submission object
 */
export async function requestRevision(id, reason) {
  try {
    const { data: userData } = await supabase.auth.getUser();

    const { data: existing } = await supabase
      .from('kseb_feasibility_submissions')
      .select('revision_count')
      .eq('id', id)
      .single();

    const { data: submission, error } = await supabase
      .from('kseb_feasibility_submissions')
      .update({
        submission_status: SUBMISSION_STATUSES.REVISION_REQUESTED,
        revision_reason: reason,
        revision_count: (existing?.revision_count || 0) + 1,
        reviewer_comments: reason,
        reviewer_name: userData?.user?.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await createActivityLog(
      id,
      'revision_requested',
      `Revision requested: ${reason}`,
      SUBMISSION_STATUSES.UNDER_REVIEW,
      SUBMISSION_STATUSES.REVISION_REQUESTED
    );

    return submission;
  } catch (error) {
    console.error('Error requesting revision:', error);
    throw error;
  }
}

/**
 * Add document to feasibility submission
 * @param {string} submissionId - Submission ID
 * @param {Object} docData - Document data
 * @returns {Promise<Object>} Created document object
 */
export async function addDocument(submissionId, docData) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // Check if document type already exists and increment version
    const { data: existing } = await supabase
      .from('kseb_feasibility_documents')
      .select('version_number')
      .eq('submission_id', submissionId)
      .eq('document_type', docData.documentType)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    const versionNumber = existing ? existing.version_number + 1 : 1;

    const { data: document, error } = await supabase
      .from('kseb_feasibility_documents')
      .insert({
        submission_id: submissionId,
        document_type: docData.documentType,
        file_name: docData.fileName,
        file_url: docData.fileUrl,
        version_number: versionNumber,
        document_status: 'pending',
        uploaded_by: userId
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update submission with document URLs based on type
    const updatePayload = {};
    switch (docData.documentType) {
      case DOCUMENT_TYPES.SITE_PLAN:
        updatePayload.site_plan_url = docData.fileUrl;
        break;
      case DOCUMENT_TYPES.ELECTRICAL_DRAWINGS:
        updatePayload.electrical_drawings_url = docData.fileUrl;
        break;
      case DOCUMENT_TYPES.PROPERTY_DOCS:
        updatePayload.property_documents_url = docData.fileUrl;
        break;
      case DOCUMENT_TYPES.SANCTION_LETTER:
        updatePayload.sanction_letter_url = docData.fileUrl;
        break;
    }

    if (Object.keys(updatePayload).length > 0) {
      updatePayload.updated_at = new Date().toISOString();
      await supabase
        .from('kseb_feasibility_submissions')
        .update(updatePayload)
        .eq('id', submissionId);
    }

    await createActivityLog(
      submissionId,
      'document_uploaded',
      `${docData.documentType} document uploaded (v${versionNumber})`
    );

    return document;
  } catch (error) {
    console.error('Error adding document:', error);
    throw error;
  }
}

/**
 * Remove document from feasibility submission
 * @param {string} documentId - Document ID
 * @returns {Promise<boolean>} Success status
 */
export async function removeDocument(documentId) {
  try {
    const { data: document } = await supabase
      .from('kseb_feasibility_documents')
      .select('submission_id, document_type')
      .eq('id', documentId)
      .single();

    const { error } = await supabase
      .from('kseb_feasibility_documents')
      .delete()
      .eq('id', documentId);

    if (error) {
      throw error;
    }

    await createActivityLog(
      document.submission_id,
      'document_deleted',
      `${document.document_type} document removed`
    );

    return true;
  } catch (error) {
    console.error('Error removing document:', error);
    throw error;
  }
}

/**
 * Get activity log for a submission
 * @param {string} submissionId - Submission ID
 * @returns {Promise<Array>} Array of activity log entries
 */
export async function getActivityLog(submissionId) {
  try {
    const { data: logs, error } = await supabase
      .from('kseb_activity_logs')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return logs || [];
  } catch (error) {
    console.error('Error fetching activity log:', error);
    throw error;
  }
}
