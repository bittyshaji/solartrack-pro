import { supabase } from './supabase';

// Constants - Energisation Statuses
export const ENERGISATION_STATUSES = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  VISITED: 'visited',
  INSPECTION_PASSED: 'inspection_passed',
  INSPECTION_FAILED: 'inspection_failed',
  ENERGISED: 'energised',
  FOLLOW_UP_NEEDED: 'follow_up_needed'
};

// Constants - Inspection Results
export const INSPECTION_RESULTS = {
  PASS: 'pass',
  FAIL: 'fail',
  CONDITIONAL_PASS: 'conditional_pass'
};

/**
 * Create activity log entry for status changes and actions
 * @param {string} energisationId - Energisation visit record ID
 * @param {string} activityType - Type of activity (e.g., 'status_change', 'visit_recorded')
 * @param {string} description - Human-readable description
 * @param {string} previousStatus - Previous status (optional)
 * @param {string} newStatus - New status (optional)
 */
async function createActivityLog(energisationId, activityType, description, previousStatus = null, newStatus = null) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { error } = await supabase
      .from('kseb_energisation_activity_logs')
      .insert({
        energisation_id: energisationId,
        activity_type: activityType,
        description,
        previous_status: previousStatus,
        new_status: newStatus,
        performed_by: userId
      });

    if (error) {
      console.error('Error creating activity log:', error);
    }
  } catch (err) {
    console.error('Activity log creation failed:', err);
  }
}

/**
 * Get energisation record for a project
 * @param {string} projectId - Project UUID
 * @returns {Object} Energisation record or null
 */
export async function getEnergisation(projectId) {
  try {
    const { data, error } = await supabase
      .from('kseb_energisation_visits')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No record found, return null
        return null;
      }
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error fetching energisation record:', err);
    throw err;
  }
}

/**
 * Create a new energisation record for a project
 * @param {string} projectId - Project UUID
 * @param {Object} data - Initial data
 * @returns {Object} Created energisation record
 */
export async function createEnergisation(projectId, data = {}) {
  try {
    const { data: newRecord, error } = await supabase
      .from('kseb_energisation_visits')
      .insert({
        project_id: projectId,
        energisation_status: ENERGISATION_STATUSES.PENDING,
        ...data
      })
      .select()
      .single();

    if (error) throw error;

    // Create activity log
    await createActivityLog(
      newRecord.id,
      'energisation_created',
      'Energisation record created'
    );

    return newRecord;
  } catch (err) {
    console.error('Error creating energisation record:', err);
    throw err;
  }
}

/**
 * Update energisation record
 * @param {string} projectId - Project UUID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated energisation record
 */
export async function updateEnergisation(projectId, updates) {
  try {
    const { data, error } = await supabase
      .from('kseb_energisation_visits')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (err) {
    console.error('Error updating energisation record:', err);
    throw err;
  }
}

/**
 * Schedule a visit for KSEB inspection
 * @param {string} projectId - Project UUID
 * @param {string} scheduledDate - Scheduled visit date (YYYY-MM-DD)
 * @returns {Object} Updated energisation record
 */
export async function scheduleVisit(projectId, scheduledDate) {
  try {
    let energisation = await getEnergisation(projectId);

    if (!energisation) {
      energisation = await createEnergisation(projectId);
    }

    const previousStatus = energisation.energisation_status;
    const newStatus = ENERGISATION_STATUSES.SCHEDULED;

    const { data, error } = await supabase
      .from('kseb_energisation_visits')
      .update({
        visit_scheduled_date: scheduledDate,
        energisation_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;

    await createActivityLog(
      data.id,
      'visit_scheduled',
      `Visit scheduled for ${scheduledDate}`,
      previousStatus,
      newStatus
    );

    return data;
  } catch (err) {
    console.error('Error scheduling visit:', err);
    throw err;
  }
}

/**
 * Record actual visit details
 * @param {string} projectId - Project UUID
 * @param {Object} visitData - Visit details (actual_visit_date, inspector_name, inspector_id, inspector_phone, etc.)
 * @returns {Object} Updated energisation record
 */
export async function recordVisit(projectId, visitData) {
  try {
    let energisation = await getEnergisation(projectId);

    if (!energisation) {
      energisation = await createEnergisation(projectId);
    }

    const previousStatus = energisation.energisation_status;
    const newStatus = ENERGISATION_STATUSES.VISITED;

    const { data, error } = await supabase
      .from('kseb_energisation_visits')
      .update({
        ...visitData,
        energisation_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;

    await createActivityLog(
      data.id,
      'visit_recorded',
      `Visit recorded by inspector ${visitData.inspector_name || 'Unknown'}`,
      previousStatus,
      newStatus
    );

    return data;
  } catch (err) {
    console.error('Error recording visit:', err);
    throw err;
  }
}

/**
 * Record inspection result (pass/fail/conditional)
 * @param {string} projectId - Project UUID
 * @param {string} result - 'pass', 'fail', or 'conditional_pass'
 * @param {string} remarks - Inspection remarks/findings
 * @returns {Object} Updated energisation record
 */
export async function recordInspectionResult(projectId, result, remarks) {
  try {
    let energisation = await getEnergisation(projectId);

    if (!energisation) {
      throw new Error('Energisation record not found. Schedule or record visit first.');
    }

    const previousStatus = energisation.energisation_status;
    let newStatus;

    if (result === INSPECTION_RESULTS.PASS) {
      newStatus = ENERGISATION_STATUSES.INSPECTION_PASSED;
    } else if (result === INSPECTION_RESULTS.FAIL) {
      newStatus = ENERGISATION_STATUSES.INSPECTION_FAILED;
    } else if (result === INSPECTION_RESULTS.CONDITIONAL_PASS) {
      newStatus = ENERGISATION_STATUSES.INSPECTION_PASSED; // Treat conditional as passed for now
    } else {
      throw new Error('Invalid inspection result');
    }

    const { data, error } = await supabase
      .from('kseb_energisation_visits')
      .update({
        inspection_result: result,
        inspection_remarks: remarks,
        energisation_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;

    await createActivityLog(
      data.id,
      'inspection_result_recorded',
      `Inspection result: ${result}`,
      previousStatus,
      newStatus
    );

    return data;
  } catch (err) {
    console.error('Error recording inspection result:', err);
    throw err;
  }
}

/**
 * Mark project as energised
 * @param {string} projectId - Project UUID
 * @param {string} energisationDate - Date of energisation (YYYY-MM-DD)
 * @param {Object} meterData - Meter information (meter_number, meter_type, net_meter_installed, net_meter_reading_initial)
 * @returns {Object} Updated energisation record
 */
export async function markEnergised(projectId, energisationDate, meterData = {}) {
  try {
    let energisation = await getEnergisation(projectId);

    if (!energisation) {
      throw new Error('Energisation record not found. Complete inspection first.');
    }

    const previousStatus = energisation.energisation_status;
    const newStatus = ENERGISATION_STATUSES.ENERGISED;

    const { data, error } = await supabase
      .from('kseb_energisation_visits')
      .update({
        energisation_date: energisationDate,
        energisation_status: newStatus,
        ...meterData,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;

    await createActivityLog(
      data.id,
      'energisation_completed',
      `Project energised on ${energisationDate}`,
      previousStatus,
      newStatus
    );

    return data;
  } catch (err) {
    console.error('Error marking as energised:', err);
    throw err;
  }
}

/**
 * Schedule follow-up for failed inspection
 * @param {string} projectId - Project UUID
 * @param {string} followUpDate - Follow-up date (YYYY-MM-DD)
 * @param {string} followUpNotes - Notes about follow-up
 * @returns {Object} Updated energisation record
 */
export async function scheduleFollowUp(projectId, followUpDate, followUpNotes) {
  try {
    let energisation = await getEnergisation(projectId);

    if (!energisation) {
      throw new Error('Energisation record not found.');
    }

    const previousStatus = energisation.energisation_status;
    const newStatus = ENERGISATION_STATUSES.FOLLOW_UP_NEEDED;

    const { data, error } = await supabase
      .from('kseb_energisation_visits')
      .update({
        follow_up_date: followUpDate,
        follow_up_notes: followUpNotes,
        energisation_status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) throw error;

    await createActivityLog(
      data.id,
      'follow_up_scheduled',
      `Follow-up scheduled for ${followUpDate}`,
      previousStatus,
      newStatus
    );

    return data;
  } catch (err) {
    console.error('Error scheduling follow-up:', err);
    throw err;
  }
}

/**
 * Get activity log for an energisation record
 * @param {string} energisationId - Energisation record ID
 * @returns {Array} Activity log entries
 */
export async function getActivityLog(energisationId) {
  try {
    const { data, error } = await supabase
      .from('kseb_energisation_activity_logs')
      .select('*')
      .eq('energisation_id', energisationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error('Error fetching activity log:', err);
    throw err;
  }
}

/**
 * Get all energisation records for filtering/reporting
 * @param {Object} filters - Filter options (status, date_range, etc.)
 * @returns {Array} Energisation records matching filters
 */
export async function getEnergisationsByFilters(filters = {}) {
  try {
    let query = supabase
      .from('kseb_energisation_visits')
      .select('*, projects:project_id(name, customer_name)');

    if (filters.status) {
      query = query.eq('energisation_status', filters.status);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters.inspectionResult) {
      query = query.eq('inspection_result', filters.inspectionResult);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (err) {
    console.error('Error fetching energisations by filters:', err);
    throw err;
  }
}

/**
 * Upload energisation certificate
 * @param {string} projectId - Project UUID
 * @param {File} file - Certificate file
 * @returns {string} File URL
 */
export async function uploadEnergisationCertificate(projectId, file) {
  try {
    const fileName = `energisation-certificate-${projectId}-${Date.now()}.pdf`;
    const filePath = `kseb-energisation-certificates/${projectId}/${fileName}`;

    const { data, error: uploadError } = await supabase.storage
      .from('project-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('project-documents')
      .getPublicUrl(filePath);

    // Update energisation record with certificate URL
    const { data: updatedRecord, error: updateError } = await supabase
      .from('kseb_energisation_visits')
      .update({
        energisation_certificate_url: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .select()
      .single();

    if (updateError) throw updateError;

    return urlData.publicUrl;
  } catch (err) {
    console.error('Error uploading energisation certificate:', err);
    throw err;
  }
}

/**
 * Delete energisation certificate
 * @param {string} projectId - Project UUID
 * @returns {boolean} Success
 */
export async function deleteEnergisationCertificate(projectId) {
  try {
    const energisation = await getEnergisation(projectId);

    if (!energisation || !energisation.energisation_certificate_url) {
      return false;
    }

    // Extract file path from URL
    const urlParts = energisation.energisation_certificate_url.split('/');
    const filePath = `kseb-energisation-certificates/${projectId}/${urlParts[urlParts.length - 1]}`;

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('project-documents')
      .remove([filePath]);

    if (deleteError) throw deleteError;

    // Update record to remove URL
    const { error: updateError } = await supabase
      .from('kseb_energisation_visits')
      .update({
        energisation_certificate_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId);

    if (updateError) throw updateError;

    return true;
  } catch (err) {
    console.error('Error deleting energisation certificate:', err);
    throw err;
  }
}
