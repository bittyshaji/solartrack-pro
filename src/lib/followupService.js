import { supabase } from './supabase';

// Constants
export const FOLLOWUP_TYPES = [
  { value: 'quote', label: 'Quote Request' },
  { value: 'proposal', label: 'Proposal Follow-up' },
  { value: 'customer', label: 'Customer Check-in' },
  { value: 'site_visit', label: 'Site Visit' },
  { value: 'payment', label: 'Payment Reminder' },
  { value: 'general', label: 'General Follow-up' }
];

export const FOLLOWUP_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'rescheduled', label: 'Rescheduled', color: 'blue' },
  { value: 'cancelled', label: 'Cancelled', color: 'gray' },
  { value: 'overdue', label: 'Overdue', color: 'red' }
];

export const COMMUNICATION_METHODS = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'visit', label: 'In-Person Visit' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'message', label: 'Text Message' }
];

/**
 * Get all followups for a specific project, ordered by scheduled_date
 */
export const getFollowups = async (projectId) => {
  try {
    const { data, error } = await supabase
      .from('followups')
      .select('*')
      .eq('project_id', projectId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching followups:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Get a single followup by ID with its history
 */
export const getFollowupById = async (id) => {
  try {
    const { data: followup, error: followupError } = await supabase
      .from('followups')
      .select('*')
      .eq('id', id)
      .single();

    if (followupError) throw followupError;

    const { data: history, error: historyError } = await supabase
      .from('followup_history')
      .select('*')
      .eq('followup_id', id)
      .order('changed_at', { ascending: false });

    if (historyError) throw historyError;

    return {
      data: { ...followup, history: history || [] },
      error: null
    };
  } catch (error) {
    console.error('Error fetching followup:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Create a new followup
 */
export const createFollowup = async (data) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      throw new Error('User not authenticated');
    }

    const followupData = {
      ...data,
      created_by: session.session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: followup, error } = await supabase
      .from('followups')
      .insert([followupData])
      .select()
      .single();

    if (error) throw error;

    // Create initial history entry
    if (followup) {
      await supabase
        .from('followup_history')
        .insert([{
          followup_id: followup.id,
          previous_status: null,
          new_status: 'pending',
          changed_by: session.session.user.id,
          change_reason: 'Created',
          changed_at: new Date().toISOString()
        }]);
    }

    return { data: followup, error: null };
  } catch (error) {
    console.error('Error creating followup:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Update a followup
 */
export const updateFollowup = async (id, updates) => {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('followups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error updating followup:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Mark a followup as completed with outcome
 */
export const completeFollowup = async (id, outcome) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      throw new Error('User not authenticated');
    }

    // Get current followup to track status change
    const { data: currentFollowup, error: fetchError } = await supabase
      .from('followups')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const now = new Date().toISOString();

    // Update followup
    const { data: followup, error: updateError } = await supabase
      .from('followups')
      .update({
        status: 'completed',
        outcome,
        completed_date: now,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Add history entry
    await supabase
      .from('followup_history')
      .insert([{
        followup_id: id,
        previous_status: currentFollowup.status,
        new_status: 'completed',
        changed_by: session.session.user.id,
        change_reason: outcome || 'Completed',
        changed_at: now
      }]);

    return { data: followup, error: null };
  } catch (error) {
    console.error('Error completing followup:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Reschedule a followup to a new date
 */
export const rescheduleFollowup = async (id, newDate, reason) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      throw new Error('User not authenticated');
    }

    // Get current followup to track status change
    const { data: currentFollowup, error: fetchError } = await supabase
      .from('followups')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const now = new Date().toISOString();

    // Update followup
    const { data: followup, error: updateError } = await supabase
      .from('followups')
      .update({
        status: 'rescheduled',
        scheduled_date: newDate,
        rescheduled_to: newDate,
        rescheduled_reason: reason,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Add history entry
    await supabase
      .from('followup_history')
      .insert([{
        followup_id: id,
        previous_status: currentFollowup.status,
        new_status: 'rescheduled',
        changed_by: session.session.user.id,
        change_reason: reason || 'Rescheduled',
        changed_at: now
      }]);

    return { data: followup, error: null };
  } catch (error) {
    console.error('Error rescheduling followup:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Cancel a followup
 */
export const cancelFollowup = async (id, reason) => {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) {
      throw new Error('User not authenticated');
    }

    // Get current followup to track status change
    const { data: currentFollowup, error: fetchError } = await supabase
      .from('followups')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const now = new Date().toISOString();

    // Update followup
    const { data: followup, error: updateError } = await supabase
      .from('followups')
      .update({
        status: 'cancelled',
        rescheduled_reason: reason,
        updated_at: now
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Add history entry
    await supabase
      .from('followup_history')
      .insert([{
        followup_id: id,
        previous_status: currentFollowup.status,
        new_status: 'cancelled',
        changed_by: session.session.user.id,
        change_reason: reason || 'Cancelled',
        changed_at: now
      }]);

    return { data: followup, error: null };
  } catch (error) {
    console.error('Error cancelling followup:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Get all upcoming followups within N days across all accessible projects
 */
export const getUpcomingFollowups = async (daysAhead = 7) => {
  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('followups')
      .select('*, projects(id, customer_name)')
      .eq('status', 'pending')
      .gte('scheduled_date', now.toISOString())
      .lte('scheduled_date', futureDate.toISOString())
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching upcoming followups:', error);
    return { data: [], error: error.message };
  }
};

/**
 * Get all overdue followups (past scheduled_date and still pending)
 */
export const getOverdueFollowups = async () => {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('followups')
      .select('*, projects(id, customer_name)')
      .eq('status', 'pending')
      .lt('scheduled_date', now)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error('Error fetching overdue followups:', error);
    return { data: [], error: error.message };
  }
};
