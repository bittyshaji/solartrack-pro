import { supabase } from './supabase';

// Constants
export const ROOF_TYPES = ['flat', 'sloped', 'metal_sheet', 'concrete', 'tile', 'other'];

export const ROOF_ORIENTATIONS = [
  'north',
  'south',
  'east',
  'west',
  'northeast',
  'northwest',
  'southeast',
  'southwest',
  'mixed'
];

export const STRUCTURAL_ASSESSMENTS = ['suitable', 'needs_reinforcement', 'not_suitable', 'pending'];

/**
 * Fetch site survey for a specific project
 * @param {string} projectId - Project ID
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function getSiteSurvey(projectId) {
  try {
    if (!projectId) {
      return { success: false, data: null, error: 'Project ID is required' };
    }

    const { data, error } = await supabase
      .from('site_surveys')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (error) {
      // Handle case where no survey exists yet (not an actual error)
      if (error.code === 'PGRST116') {
        return { success: true, data: null, error: null };
      }
      throw error;
    }

    return { success: true, data, error: null };
  } catch (err) {
    console.error('Error fetching site survey:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Create a new site survey for a project
 * @param {string} projectId - Project ID
 * @param {object} data - Survey data
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function createSiteSurvey(projectId, data) {
  try {
    if (!projectId) {
      return { success: false, data: null, error: 'Project ID is required' };
    }

    // Get current user for auth check
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, data: null, error: 'User not authenticated' };
    }

    // Prepare survey data with project_id
    const surveyData = {
      project_id: projectId,
      ...data,
      // Ensure arrays are properly formatted
      site_photos_urls: data.site_photos_urls || null
    };

    const { data: newSurvey, error } = await supabase
      .from('site_surveys')
      .insert([surveyData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data: newSurvey, error: null };
  } catch (err) {
    console.error('Error creating site survey:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Update an existing site survey
 * @param {string} projectId - Project ID
 * @param {object} updates - Data to update
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function updateSiteSurvey(projectId, updates) {
  try {
    if (!projectId) {
      return { success: false, data: null, error: 'Project ID is required' };
    }

    // Get current user for auth check
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, data: null, error: 'User not authenticated' };
    }

    const { data: updatedSurvey, error } = await supabase
      .from('site_surveys')
      .update(updates)
      .eq('project_id', projectId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data: updatedSurvey, error: null };
  } catch (err) {
    console.error('Error updating site survey:', err);
    return { success: false, data: null, error: err.message };
  }
}

/**
 * Delete a site survey
 * @param {string} projectId - Project ID
 * @returns {Promise<{success: boolean, data: null, error: string|null}>}
 */
export async function deleteSiteSurvey(projectId) {
  try {
    if (!projectId) {
      return { success: false, data: null, error: 'Project ID is required' };
    }

    // Get current user for auth check
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, data: null, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('site_surveys')
      .delete()
      .eq('project_id', projectId);

    if (error) {
      throw error;
    }

    return { success: true, data: null, error: null };
  } catch (err) {
    console.error('Error deleting site survey:', err);
    return { success: false, data: null, error: err.message };
  }
}
