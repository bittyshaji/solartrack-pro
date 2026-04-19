import { supabase } from './supabase';

// Constants
export const DOCUMENT_STATUSES = {
  PENDING: 'pending',
  GENERATED: 'generated',
  READY_FOR_DELIVERY: 'ready_for_delivery',
  DELIVERED: 'delivered',
  SIGNED: 'signed',
  ARCHIVED: 'archived'
};

export const DELIVERY_METHODS = {
  EMAIL: 'email',
  PRINT: 'print',
  PORTAL: 'portal',
  BOTH: 'both'
};

/**
 * Generate document number with format HO-YYYY-NNN
 * @returns {Promise<string>} Generated document number
 */
async function generateDocumentNumber() {
  const now = new Date();
  const year = now.getFullYear();

  try {
    // Get count of documents created this year
    const { data, error } = await supabase
      .from('handover_documents')
      .select('document_number', { count: 'exact' })
      .gte('created_at', `${year}-01-01`)
      .lt('created_at', `${year + 1}-01-01`);

    if (error) throw error;

    const count = (data?.length || 0) + 1;
    const documentNumber = `HO-${year}-${String(count).padStart(3, '0')}`;

    return documentNumber;
  } catch (error) {
    console.error('Error generating document number:', error);
    throw error;
  }
}

/**
 * Get handover document for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} Handover document object
 */
export async function getHandoverDocument(projectId) {
  try {
    const { data, error } = await supabase
      .from('handover_documents')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching handover document:', error);
    throw error;
  }
}

/**
 * Generate a new handover document from project data
 * @param {string} projectId - Project ID
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Created handover document
 */
export async function generateHandoverDocument(projectId, options = {}) {
  const {
    includesWarranty = true,
    includesManual = true,
    includesPerformanceMetrics = true,
    includesMaintenance = true,
    includesContactInfo = true
  } = options;

  try {
    // Fetch project and related data
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        systems (
          id,
          system_type,
          total_capacity,
          panel_count,
          inverter_model,
          installation_date,
          warranty_provider,
          warranty_period_years,
          performance_ratio
        ),
        customers (
          id,
          name,
          email,
          phone,
          address
        )
      `)
      .eq('id', projectId)
      .single();

    if (projectError) throw projectError;
    if (!project) throw new Error('Project not found');

    // Get current user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) throw userError;

    // Build system summary
    const systemSummary = {
      projectName: project.project_name || 'N/A',
      address: project.installation_address || 'N/A',
      totalCapacity: project.systems?.[0]?.total_capacity || 0,
      panelCount: project.systems?.[0]?.panel_count || 0,
      inverterModel: project.systems?.[0]?.inverter_model || 'N/A',
      systemType: project.systems?.[0]?.system_type || 'N/A',
      installationDate: project.systems?.[0]?.installation_date || null,
      performanceRatio: project.systems?.[0]?.performance_ratio || null
    };

    // Build warranty summary
    const warrantySummary = {
      provider: project.systems?.[0]?.warranty_provider || 'N/A',
      periodYears: project.systems?.[0]?.warranty_period_years || 10,
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * (project.systems?.[0]?.warranty_period_years || 10)).toISOString().split('T')[0]
    };

    // Build maintenance schedule
    const maintenanceSchedule = {
      items: [
        {
          task: 'Visual Inspection',
          frequency: 'Quarterly',
          description: 'Inspect panels and mounting hardware for damage or debris'
        },
        {
          task: 'Cleaning',
          frequency: 'Semi-annually',
          description: 'Clean panels to maintain optimal performance'
        },
        {
          task: 'Inverter Check',
          frequency: 'Annually',
          description: 'Verify inverter operation and update firmware if needed'
        },
        {
          task: 'Professional Maintenance',
          frequency: 'Every 2 years',
          description: 'Schedule professional inspection and maintenance'
        }
      ]
    };

    // Generate document number
    const documentNumber = await generateDocumentNumber();

    // Create handover document
    const { data: newDocument, error: insertError } = await supabase
      .from('handover_documents')
      .insert([
        {
          project_id: projectId,
          document_number: documentNumber,
          document_status: DOCUMENT_STATUSES.GENERATED,
          generation_date: new Date().toISOString(),
          generated_by: user?.id,
          issue_date: new Date().toISOString().split('T')[0],
          includes_warranty: includesWarranty,
          includes_manual: includesManual,
          includes_performance_metrics: includesPerformanceMetrics,
          includes_maintenance_guide: includesMaintenance,
          includes_contact_info: includesContactInfo,
          system_summary_json: systemSummary,
          warranty_summary_json: warrantySummary,
          maintenance_schedule_json: maintenanceSchedule
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return newDocument;
  } catch (error) {
    console.error('Error generating handover document:', error);
    throw error;
  }
}

/**
 * Update handover document
 * @param {string} id - Document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated document
 */
export async function updateHandoverDocument(id, updates) {
  try {
    const { data, error } = await supabase
      .from('handover_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating handover document:', error);
    throw error;
  }
}

/**
 * Mark document as ready for delivery
 * @param {string} id - Document ID
 * @returns {Promise<Object>} Updated document
 */
export async function markReadyForDelivery(id) {
  try {
    return await updateHandoverDocument(id, {
      document_status: DOCUMENT_STATUSES.READY_FOR_DELIVERY
    });
  } catch (error) {
    console.error('Error marking document as ready for delivery:', error);
    throw error;
  }
}

/**
 * Deliver document to customer
 * @param {string} id - Document ID
 * @param {string} method - Delivery method ('email', 'print', 'portal', 'both')
 * @param {Array<string>} emails - Email addresses for delivery
 * @returns {Promise<Object>} Updated document
 */
export async function deliverDocument(id, method, emails = []) {
  try {
    const updates = {
      document_status: DOCUMENT_STATUSES.DELIVERED,
      delivery_method: method,
      delivered_date: new Date().toISOString()
    };

    if (emails && emails.length > 0) {
      updates.delivered_to_emails = emails;
    }

    return await updateHandoverDocument(id, updates);
  } catch (error) {
    console.error('Error delivering document:', error);
    throw error;
  }
}

/**
 * Record customer signature
 * @param {string} id - Document ID
 * @param {Object} signatureData - Signature information
 * @returns {Promise<Object>} Updated document
 */
export async function recordSignature(id, signatureData) {
  const { signatureUrl, signedByName, signedByEmail } = signatureData;

  try {
    const updates = {
      document_status: DOCUMENT_STATUSES.SIGNED,
      customer_signature_url: signatureUrl,
      customer_signature_timestamp: new Date().toISOString(),
      signed_by_name: signedByName,
      signed_by_email: signedByEmail
    };

    return await updateHandoverDocument(id, updates);
  } catch (error) {
    console.error('Error recording signature:', error);
    throw error;
  }
}

/**
 * Archive document
 * @param {string} id - Document ID
 * @returns {Promise<Object>} Updated document
 */
export async function archiveDocument(id) {
  try {
    return await updateHandoverDocument(id, {
      document_status: DOCUMENT_STATUSES.ARCHIVED
    });
  } catch (error) {
    console.error('Error archiving document:', error);
    throw error;
  }
}

/**
 * Delete handover document
 * @param {string} id - Document ID
 * @returns {Promise<void>}
 */
export async function deleteHandoverDocument(id) {
  try {
    const { error } = await supabase
      .from('handover_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting handover document:', error);
    throw error;
  }
}

/**
 * Get all handover documents (admin)
 * @returns {Promise<Array>} List of handover documents
 */
export async function getAllHandoverDocuments() {
  try {
    const { data, error } = await supabase
      .from('handover_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching all handover documents:', error);
    throw error;
  }
}

/**
 * Search handover documents
 * @param {Object} filters - Filter criteria
 * @returns {Promise<Array>} Filtered documents
 */
export async function searchHandoverDocuments(filters = {}) {
  const { status, projectId, documentNumber } = filters;

  try {
    let query = supabase.from('handover_documents').select('*');

    if (status) {
      query = query.eq('document_status', status);
    }

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (documentNumber) {
      query = query.ilike('document_number', `%${documentNumber}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error searching handover documents:', error);
    throw error;
  }
}
