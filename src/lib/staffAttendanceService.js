import { supabase } from './supabase';

// Constants
export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract'];
export const WORK_STATUSES = ['present', 'absent', 'half_day', 'leave', 'holiday'];
export const PAYMENT_STATUSES = ['pending', 'approved', 'paid'];
export const PAYMENT_METHODS = ['cash', 'check', 'bank_transfer'];

const LEAVE_TYPES = ['sick', 'annual', 'personal', 'unpaid', 'other'];

// ============== STAFF MEMBER OPERATIONS ==============

/**
 * Get all staff members or only active ones
 * @param {boolean} activeOnly - Return only active staff
 * @returns {Promise<Array>} Array of staff members
 */
export async function getStaffMembers(activeOnly = false) {
  try {
    let query = supabase.from('staff_members').select('*');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('staff_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching staff members:', error);
    throw error;
  }
}

/**
 * Create a new staff member
 * @param {Object} staffData - Staff member data
 * @returns {Promise<Object>} Created staff member
 */
export async function createStaffMember(staffData) {
  try {
    const { data, error } = await supabase
      .from('staff_members')
      .insert([{
        staff_name: staffData.staff_name,
        staff_phone: staffData.staff_phone || null,
        staff_email: staffData.staff_email || null,
        role: staffData.role,
        hourly_rate: staffData.hourly_rate || null,
        daily_wage: staffData.daily_wage || null,
        employment_type: staffData.employment_type,
        start_date: staffData.start_date,
        end_date: staffData.end_date || null,
        is_active: true,
        notes: staffData.notes || null,
        user_id: staffData.user_id || null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating staff member:', error);
    throw error;
  }
}

/**
 * Update a staff member
 * @param {string} id - Staff member ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated staff member
 */
export async function updateStaffMember(id, updates) {
  try {
    const { data, error } = await supabase
      .from('staff_members')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating staff member:', error);
    throw error;
  }
}

/**
 * Deactivate a staff member (soft delete)
 * @param {string} id - Staff member ID
 * @returns {Promise<Object>} Deactivated staff member
 */
export async function deactivateStaffMember(id) {
  try {
    return await updateStaffMember(id, { is_active: false });
  } catch (error) {
    console.error('Error deactivating staff member:', error);
    throw error;
  }
}

// ============== ATTENDANCE OPERATIONS ==============

/**
 * Check in a staff member
 * @param {string} staffMemberId - Staff member ID
 * @param {string} projectId - Project ID (optional)
 * @returns {Promise<Object>} Attendance log entry
 */
export async function checkIn(staffMemberId, projectId = null) {
  try {
    const logDate = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const { data: existing } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('staff_member_id', staffMemberId)
      .eq('log_date', logDate)
      .single();

    if (existing) {
      throw new Error('Staff member already checked in for today');
    }

    const { data, error } = await supabase
      .from('attendance_logs')
      .insert([{
        staff_member_id: staffMemberId,
        project_id: projectId,
        log_date: logDate,
        check_in_time: new Date().toISOString(),
        work_status: 'present'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error checking in:', error);
    throw error;
  }
}

/**
 * Check out a staff member and calculate hours worked
 * @param {string} attendanceLogId - Attendance log ID
 * @returns {Promise<Object>} Updated attendance log
 */
export async function checkOut(attendanceLogId) {
  try {
    const checkOutTime = new Date().toISOString();

    // Get existing log to calculate hours
    const { data: log } = await supabase
      .from('attendance_logs')
      .select('check_in_time')
      .eq('id', attendanceLogId)
      .single();

    if (!log || !log.check_in_time) {
      throw new Error('Attendance log not found or not checked in');
    }

    const checkInTime = new Date(log.check_in_time);
    const checkOutTimeDate = new Date(checkOutTime);
    const hoursWorked = parseFloat(((checkOutTimeDate - checkInTime) / (1000 * 60 * 60)).toFixed(2));

    const { data, error } = await supabase
      .from('attendance_logs')
      .update({
        check_out_time: checkOutTime,
        total_hours_worked: hoursWorked
      })
      .eq('id', attendanceLogId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error checking out:', error);
    throw error;
  }
}

/**
 * Get attendance logs for a staff member in a specific month
 * @param {string} staffMemberId - Staff member ID
 * @param {string} month - Month in format YYYY-MM
 * @returns {Promise<Array>} Attendance logs
 */
export async function getAttendanceLogs(staffMemberId, month) {
  try {
    const startDate = `${month}-01`;
    const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
      .toISOString()
      .split('T')[0];

    const { data, error } = await supabase
      .from('attendance_logs')
      .select('*')
      .eq('staff_member_id', staffMemberId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    throw error;
  }
}

/**
 * Get all staff attendance for a specific date
 * @param {string} date - Date in format YYYY-MM-DD
 * @returns {Promise<Array>} Attendance logs with staff details
 */
export async function getTeamAttendance(date) {
  try {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        *,
        staff_members(id, staff_name, role, hourly_rate, daily_wage)
      `)
      .eq('log_date', date)
      .order('staff_members(staff_name)', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching team attendance:', error);
    throw error;
  }
}

/**
 * Update attendance status manually
 * @param {string} logId - Attendance log ID
 * @param {string} status - Work status
 * @param {string} leaveType - Leave type (if applicable)
 * @returns {Promise<Object>} Updated attendance log
 */
export async function updateAttendanceStatus(logId, status, leaveType = null) {
  try {
    const updates = { work_status: status };

    if (leaveType && status === 'leave') {
      updates.leave_type = leaveType;
    }

    const { data, error } = await supabase
      .from('attendance_logs')
      .update(updates)
      .eq('id', logId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating attendance status:', error);
    throw error;
  }
}

// ============== PAYROLL OPERATIONS ==============

/**
 * Generate payroll for all active staff for a specific month
 * @param {string} month - Month in format YYYY-MM
 * @returns {Promise<Array>} Created wage payments
 */
export async function generatePayroll(month) {
  try {
    // Get all active staff
    const staffList = await getStaffMembers(true);
    const createdPayments = [];

    for (const staff of staffList) {
      // Check if payroll already exists for this month
      const { data: existing } = await supabase
        .from('wage_payments')
        .select('id')
        .eq('staff_member_id', staff.id)
        .eq('payment_month', `${month}-01`)
        .single();

      if (existing) {
        console.log(`Payroll already exists for ${staff.staff_name} in ${month}`);
        continue;
      }

      // Get attendance logs for the month
      const logs = await getAttendanceLogs(staff.id, month);

      // Calculate metrics
      const presentDays = logs.filter(l => l.work_status === 'present').length;
      const halfDays = logs.filter(l => l.work_status === 'half_day').length;
      const totalDaysWorked = presentDays + (halfDays * 0.5);
      const totalHoursWorked = logs.reduce((sum, l) => sum + (l.total_hours_worked || 0), 0);

      // Determine overtime (hours beyond 8 per day)
      const overtime = Math.max(0, totalHoursWorked - (totalDaysWorked * 8));

      // Calculate amounts
      let baseAmount = 0;
      let overtimeAmount = 0;

      if (staff.daily_wage) {
        baseAmount = parseFloat((totalDaysWorked * staff.daily_wage).toFixed(2));
      } else if (staff.hourly_rate) {
        baseAmount = parseFloat((totalHoursWorked * staff.hourly_rate).toFixed(2));
        overtimeAmount = parseFloat((overtime * staff.hourly_rate * 1.5).toFixed(2));
      }

      const totalAmount = parseFloat((baseAmount + overtimeAmount).toFixed(2));

      // Create wage payment
      const { data, error } = await supabase
        .from('wage_payments')
        .insert([{
          staff_member_id: staff.id,
          payment_month: `${month}-01`,
          total_days_worked: Math.round(totalDaysWorked),
          total_hours_worked: parseFloat(totalHoursWorked.toFixed(2)),
          overtime_hours: parseFloat(overtime.toFixed(2)),
          hourly_rate: staff.hourly_rate || null,
          daily_rate: staff.daily_wage || null,
          base_amount: baseAmount,
          overtime_amount: overtimeAmount,
          total_amount: totalAmount,
          payment_status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      createdPayments.push(data);
    }

    return createdPayments;
  } catch (error) {
    console.error('Error generating payroll:', error);
    throw error;
  }
}

/**
 * Get a single wage payment record
 * @param {string} staffMemberId - Staff member ID
 * @param {string} month - Month in format YYYY-MM
 * @returns {Promise<Object>} Wage payment
 */
export async function getWagePayment(staffMemberId, month) {
  try {
    const { data, error } = await supabase
      .from('wage_payments')
      .select(`
        *,
        staff_members(staff_name, role)
      `)
      .eq('staff_member_id', staffMemberId)
      .eq('payment_month', `${month}-01`)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching wage payment:', error);
    throw error;
  }
}

/**
 * Get all wage payments for a month
 * @param {string} month - Month in format YYYY-MM
 * @returns {Promise<Array>} Wage payments with staff details
 */
export async function getMonthlyPayroll(month) {
  try {
    const { data, error } = await supabase
      .from('wage_payments')
      .select(`
        *,
        staff_members(id, staff_name, role)
      `)
      .eq('payment_month', `${month}-01`)
      .order('staff_members(staff_name)', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching monthly payroll:', error);
    throw error;
  }
}

/**
 * Approve a wage payment
 * @param {string} wageId - Wage payment ID
 * @param {string} userId - Approver user ID (optional)
 * @returns {Promise<Object>} Updated wage payment
 */
export async function approveWage(wageId, userId = null) {
  try {
    const { data, error } = await supabase
      .from('wage_payments')
      .update({
        payment_status: 'approved',
        approved_by: userId
      })
      .eq('id', wageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error approving wage:', error);
    throw error;
  }
}

/**
 * Mark a wage payment as paid
 * @param {string} wageId - Wage payment ID
 * @param {string} method - Payment method
 * @param {string} userId - Paid by user ID (optional)
 * @returns {Promise<Object>} Updated wage payment
 */
export async function markWagePaid(wageId, method = 'cash', userId = null) {
  try {
    const { data, error } = await supabase
      .from('wage_payments')
      .update({
        payment_status: 'paid',
        payment_method: method,
        payment_date: new Date().toISOString().split('T')[0],
        paid_by: userId
      })
      .eq('id', wageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error marking wage as paid:', error);
    throw error;
  }
}

/**
 * Get monthly payroll summary
 * @param {string} month - Month in format YYYY-MM
 * @returns {Promise<Object>} Summary with totals
 */
export async function getMonthlyPayrollSummary(month) {
  try {
    const payroll = await getMonthlyPayroll(month);

    const summary = {
      month,
      totalStaff: payroll.length,
      totalBaseSalaries: 0,
      totalOvertime: 0,
      totalDeductions: 0,
      totalPayable: 0,
      byStatus: {
        pending: 0,
        approved: 0,
        paid: 0
      },
      details: payroll
    };

    payroll.forEach(payment => {
      summary.totalBaseSalaries += payment.base_amount || 0;
      summary.totalOvertime += payment.overtime_amount || 0;
      summary.totalDeductions += payment.deductions || 0;
      summary.totalPayable += payment.total_amount || 0;
      summary.byStatus[payment.payment_status] = (summary.byStatus[payment.payment_status] || 0) + 1;
    });

    return summary;
  } catch (error) {
    console.error('Error fetching payroll summary:', error);
    throw error;
  }
}
