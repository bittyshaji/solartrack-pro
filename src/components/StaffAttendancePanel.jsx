import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  LogIn,
  LogOut,
  Check,
  X,
  DollarSign,
  Calendar,
  Clock,
  Users,
  Save,
  XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getStaffMembers,
  createStaffMember,
  updateStaffMember,
  deactivateStaffMember,
  checkIn,
  checkOut,
  getAttendanceLogs,
  getTeamAttendance,
  updateAttendanceStatus,
  generatePayroll,
  getMonthlyPayroll,
  approveWage,
  markWagePaid,
  getMonthlyPayrollSummary,
  EMPLOYMENT_TYPES,
  WORK_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS
} from '../lib/staffAttendanceService';

export default function StaffAttendancePanel() {
  const [activeTab, setActiveTab] = useState('staff');
  const [staffList, setStaffList] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeFilter, setActiveFilter] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form states
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffFormData, setStaffFormData] = useState({
    staff_name: '',
    staff_phone: '',
    staff_email: '',
    role: '',
    hourly_rate: '',
    daily_wage: '',
    employment_type: 'full_time',
    start_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Load staff
  useEffect(() => {
    loadStaffMembers();
  }, [activeFilter]);

  // Load attendance when date changes
  useEffect(() => {
    if (activeTab === 'attendance') {
      loadTeamAttendance();
    }
  }, [selectedDate, activeTab]);

  // Load payroll when month changes
  useEffect(() => {
    if (activeTab === 'payroll') {
      loadPayroll();
    }
  }, [selectedMonth, activeTab]);

  const loadStaffMembers = async () => {
    try {
      setLoading(true);
      const data = await getStaffMembers(activeFilter);
      setStaffList(data);
    } catch (error) {
      toast.error('Failed to load staff members');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamAttendance = async () => {
    try {
      setLoading(true);
      const data = await getTeamAttendance(selectedDate);
      setAttendanceData(data);
    } catch (error) {
      toast.error('Failed to load attendance data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayroll = async () => {
    try {
      setLoading(true);
      const data = await getMonthlyPayroll(selectedMonth);
      setPayrollData(data);
    } catch (error) {
      toast.error('Failed to load payroll data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ============== STAFF MANAGEMENT ==============

  const handleStaffFormChange = (e) => {
    const { name, value } = e.target;
    setStaffFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveStaff = async () => {
    try {
      if (!staffFormData.staff_name || !staffFormData.role) {
        toast.error('Name and role are required');
        return;
      }

      if (!staffFormData.hourly_rate && !staffFormData.daily_wage) {
        toast.error('Either hourly rate or daily wage is required');
        return;
      }

      setLoading(true);

      if (editingStaff) {
        await updateStaffMember(editingStaff.id, {
          staff_name: staffFormData.staff_name,
          staff_phone: staffFormData.staff_phone,
          staff_email: staffFormData.staff_email,
          role: staffFormData.role,
          hourly_rate: staffFormData.hourly_rate ? parseFloat(staffFormData.hourly_rate) : null,
          daily_wage: staffFormData.daily_wage ? parseFloat(staffFormData.daily_wage) : null,
          employment_type: staffFormData.employment_type,
          notes: staffFormData.notes
        });
        toast.success('Staff member updated successfully');
      } else {
        await createStaffMember({
          staff_name: staffFormData.staff_name,
          staff_phone: staffFormData.staff_phone,
          staff_email: staffFormData.staff_email,
          role: staffFormData.role,
          hourly_rate: staffFormData.hourly_rate ? parseFloat(staffFormData.hourly_rate) : null,
          daily_wage: staffFormData.daily_wage ? parseFloat(staffFormData.daily_wage) : null,
          employment_type: staffFormData.employment_type,
          start_date: staffFormData.start_date,
          notes: staffFormData.notes
        });
        toast.success('Staff member added successfully');
      }

      resetStaffForm();
      loadStaffMembers();
    } catch (error) {
      toast.error(editingStaff ? 'Failed to update staff member' : 'Failed to add staff member');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStaff = (staff) => {
    setEditingStaff(staff);
    setStaffFormData({
      staff_name: staff.staff_name,
      staff_phone: staff.staff_phone || '',
      staff_email: staff.staff_email || '',
      role: staff.role,
      hourly_rate: staff.hourly_rate || '',
      daily_wage: staff.daily_wage || '',
      employment_type: staff.employment_type,
      start_date: staff.start_date,
      notes: staff.notes || ''
    });
    setShowStaffForm(true);
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this staff member?')) {
      try {
        setLoading(true);
        await deactivateStaffMember(id);
        toast.success('Staff member deactivated');
        loadStaffMembers();
      } catch (error) {
        toast.error('Failed to deactivate staff member');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetStaffForm = () => {
    setShowStaffForm(false);
    setEditingStaff(null);
    setStaffFormData({
      staff_name: '',
      staff_phone: '',
      staff_email: '',
      role: '',
      hourly_rate: '',
      daily_wage: '',
      employment_type: 'full_time',
      start_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  // ============== ATTENDANCE MANAGEMENT ==============

  const handleCheckIn = async (staffMemberId) => {
    try {
      setLoading(true);
      await checkIn(staffMemberId);
      toast.success('Check-in recorded');
      loadTeamAttendance();
    } catch (error) {
      toast.error(error.message || 'Failed to check in');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (logId) => {
    try {
      setLoading(true);
      await checkOut(logId);
      toast.success('Check-out recorded');
      loadTeamAttendance();
    } catch (error) {
      toast.error('Failed to check out');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAttendanceStatus = async (logId, status, leaveType = null) => {
    try {
      setLoading(true);
      await updateAttendanceStatus(logId, status, leaveType);
      toast.success('Attendance updated');
      loadTeamAttendance();
    } catch (error) {
      toast.error('Failed to update attendance');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ============== PAYROLL MANAGEMENT ==============

  const handleGeneratePayroll = async () => {
    if (window.confirm(`Generate payroll for ${selectedMonth}? This will create wage records for all active staff.`)) {
      try {
        setLoading(true);
        await generatePayroll(selectedMonth);
        toast.success('Payroll generated successfully');
        loadPayroll();
      } catch (error) {
        toast.error('Failed to generate payroll');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleApproveWage = async (wageId) => {
    try {
      setLoading(true);
      await approveWage(wageId);
      toast.success('Wage approved');
      loadPayroll();
    } catch (error) {
      toast.error('Failed to approve wage');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (wageId) => {
    try {
      setLoading(true);
      await markWagePaid(wageId, 'cash');
      toast.success('Wage marked as paid');
      loadPayroll();
    } catch (error) {
      toast.error('Failed to mark wage as paid');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ============== HELPERS ==============

  const getStatusBadge = (status) => {
    const statusConfig = {
      present: { bg: 'bg-green-100', text: 'text-green-800', label: 'Present' },
      absent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Absent' },
      half_day: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Half Day' },
      leave: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Leave' },
      holiday: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Holiday' },
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending' },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Approved' },
      paid: { bg: 'bg-green-100', text: 'text-green-800', label: 'Paid' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatTime = (time) => {
    if (!time) return '-';
    return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  };

  // ============== TAB: STAFF LIST ==============

  const StaffListTab = () => (
    <div className="space-y-6">
      {/* Filter and Add Button */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter(true)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeFilter ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveFilter(false)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              !activeFilter ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
        </div>
        <button
          onClick={() => {
            resetStaffForm();
            setShowStaffForm(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      {/* Staff Form */}
      {showStaffForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">
            {editingStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Staff Name"
              name="staff_name"
              value={staffFormData.staff_name}
              onChange={handleStaffFormChange}
              className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="email"
              placeholder="Email"
              name="staff_email"
              value={staffFormData.staff_email}
              onChange={handleStaffFormChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              placeholder="Phone"
              name="staff_phone"
              value={staffFormData.staff_phone}
              onChange={handleStaffFormChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Role"
              name="role"
              value={staffFormData.role}
              onChange={handleStaffFormChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              name="employment_type"
              value={staffFormData.employment_type}
              onChange={handleStaffFormChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {EMPLOYMENT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Hourly Rate"
              name="hourly_rate"
              step="0.01"
              value={staffFormData.hourly_rate}
              onChange={handleStaffFormChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Daily Wage"
              name="daily_wage"
              step="0.01"
              value={staffFormData.daily_wage}
              onChange={handleStaffFormChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              name="start_date"
              value={staffFormData.start_date}
              onChange={handleStaffFormChange}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Notes"
              name="notes"
              value={staffFormData.notes}
              onChange={handleStaffFormChange}
              className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="2"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSaveStaff}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Save size={18} />
              Save
            </button>
            <button
              onClick={resetStaffForm}
              className="flex items-center gap-2 bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition"
            >
              <XCircle size={18} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Employment</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Hourly Rate</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Daily Wage</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Contact</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map(staff => (
              <tr key={staff.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{staff.staff_name}</td>
                <td className="px-4 py-3">{staff.role}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {staff.employment_type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">{staff.hourly_rate ? formatCurrency(staff.hourly_rate) : '-'}</td>
                <td className="px-4 py-3">{staff.daily_wage ? formatCurrency(staff.daily_wage) : '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <div>{staff.staff_email}</div>
                  <div className="text-gray-500">{staff.staff_phone}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleEditStaff(staff)}
                    className="text-blue-600 hover:text-blue-800 inline-block mr-3"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteStaff(staff.id)}
                    className="text-red-600 hover:text-red-800 inline-block"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {staffList.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No staff members found
          </div>
        )}
      </div>
    </div>
  );

  // ============== TAB: ATTENDANCE ==============

  const AttendanceTab = () => {
    const todayAttendance = attendanceData.map(log => {
      const staff = log.staff_members;
      return {
        ...log,
        staff_name: staff?.staff_name,
        staff_id: staff?.id
      };
    });

    return (
      <div className="space-y-6">
        {/* Date Picker */}
        <div className="flex gap-4 items-center">
          <label className="font-semibold">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Staff Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Check-In</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Check-Out</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Hours</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {todayAttendance.map(log => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{log.staff_name || 'Unknown'}</td>
                  <td className="px-4 py-3">{formatTime(log.check_in_time)}</td>
                  <td className="px-4 py-3">{formatTime(log.check_out_time)}</td>
                  <td className="px-4 py-3">{log.total_hours_worked || 0} hrs</td>
                  <td className="px-4 py-3">{getStatusBadge(log.work_status)}</td>
                  <td className="px-4 py-3 text-center">
                    {!log.check_out_time && (
                      <button
                        onClick={() => handleCheckOut(log.id)}
                        className="text-green-600 hover:text-green-800 inline-block"
                        title="Check Out"
                      >
                        <LogOut size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {todayAttendance.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No attendance records for this date
            </div>
          )}
        </div>

        {/* Quick Check-In */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <LogIn size={20} />
            Quick Check-In
          </h3>
          <div className="grid grid-cols-auto gap-2 max-h-64 overflow-y-auto">
            {staffList.filter(s => s.is_active).map(staff => {
              const hasCheckedIn = todayAttendance.some(log => log.staff_member_id === staff.id);
              return (
                <button
                  key={staff.id}
                  onClick={() => handleCheckIn(staff.id)}
                  disabled={hasCheckedIn || loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  {hasCheckedIn ? 'Checked In' : staff.staff_name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ============== TAB: PAYROLL ==============

  const PayrollTab = () => {
    return (
      <div className="space-y-6">
        {/* Month Picker and Generate Button */}
        <div className="flex gap-4 items-center">
          <label className="font-semibold">Select Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleGeneratePayroll}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            <DollarSign size={18} />
            Generate Payroll
          </button>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Staff Name</th>
                <th className="px-4 py-3 text-left font-semibold">Days</th>
                <th className="px-4 py-3 text-left font-semibold">Hours</th>
                <th className="px-4 py-3 text-left font-semibold">Base</th>
                <th className="px-4 py-3 text-left font-semibold">Overtime</th>
                <th className="px-4 py-3 text-left font-semibold">Total</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.map(payment => (
                <tr key={payment.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{payment.staff_members?.staff_name}</td>
                  <td className="px-4 py-3">{payment.total_days_worked}</td>
                  <td className="px-4 py-3">{payment.total_hours_worked}</td>
                  <td className="px-4 py-3">{formatCurrency(payment.base_amount)}</td>
                  <td className="px-4 py-3">{formatCurrency(payment.overtime_amount)}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(payment.total_amount)}</td>
                  <td className="px-4 py-3">{getStatusBadge(payment.payment_status)}</td>
                  <td className="px-4 py-3 text-center">
                    {payment.payment_status === 'pending' && (
                      <button
                        onClick={() => handleApproveWage(payment.id)}
                        disabled={loading}
                        className="text-blue-600 hover:text-blue-800 inline-block mr-2"
                        title="Approve"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    {payment.payment_status === 'approved' && (
                      <button
                        onClick={() => handleMarkPaid(payment.id)}
                        disabled={loading}
                        className="text-green-600 hover:text-green-800 inline-block"
                        title="Mark as Paid"
                      >
                        <DollarSign size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {payrollData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No payroll records for this month
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============== RENDER ==============

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-6 py-3 font-medium transition border-b-2 ${
            activeTab === 'staff'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users size={18} className="inline mr-2" />
          Staff List
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-6 py-3 font-medium transition border-b-2 ${
            activeTab === 'attendance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock size={18} className="inline mr-2" />
          Daily Attendance
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-6 py-3 font-medium transition border-b-2 ${
            activeTab === 'payroll'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <DollarSign size={18} className="inline mr-2" />
          Payroll
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <>
          {activeTab === 'staff' && <StaffListTab />}
          {activeTab === 'attendance' && <AttendanceTab />}
          {activeTab === 'payroll' && <PayrollTab />}
        </>
      )}
    </div>
  );
}
