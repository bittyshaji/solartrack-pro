import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { LogOut, Users, Settings, BarChart3, Home, CheckCircle, XCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) { toast.success('Logged out successfully'); navigate('/login') }
    else toast.error('Logout failed')
  }

  const tabs = [
    { id: 'overview', label: 'Overview',  icon: Home },
    { id: 'users',    label: 'Users',     icon: Users },
    { id: 'settings', label: 'Settings',  icon: Settings },
    { id: 'reports',  label: 'Reports',   icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SolarTrack Pro</h1>
            <p className="text-sm text-gray-600">Admin Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.email}! 👋</h2>
          <p className="text-gray-600 mt-1">System Administration Panel</p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                activeTab === id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" /> {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users'    && <UsersTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'reports'  && <ReportsTab />}
        </div>
      </div>
    </div>
  )
}

// ─── Overview ────────────────────────────────────────────────
function OverviewTab() {
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })

  useEffect(() => {
    supabase.from('user_profiles').select('approval_status').then(({ data }) => {
      if (!data) return
      setCounts({
        total:    data.length,
        pending:  data.filter(u => u.approval_status === 'pending').length,
        approved: data.filter(u => u.approval_status === 'approved').length,
        rejected: data.filter(u => u.approval_status === 'rejected').length,
      })
    })
  }, [])

  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">System Overview</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Users"      value={counts.total}    color="blue"   />
        <StatCard title="Approved"         value={counts.approved} color="green"  />
        <StatCard title="Pending Approval" value={counts.pending}  color="yellow" />
        <StatCard title="Rejected"         value={counts.rejected} color="red"    />
      </div>
      {counts.pending > 0 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-yellow-800 font-medium">
            {counts.pending} user{counts.pending > 1 ? 's are' : ' is'} waiting for approval.{' '}
            <button
              onClick={() => document.querySelector('[data-tab="users"]')?.click()}
              className="underline hover:no-underline"
            >
              Go to Users tab →
            </button>
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Users ───────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('pending')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateUser = async (id, updates) => {
    const { error } = await supabase.from('user_profiles').update(updates).eq('id', id)
    if (error) { toast.error('Update failed: ' + error.message); return }
    toast.success('User updated!')
    load()
  }

  const filtered = filter === 'all' ? users : users.filter(u => u.approval_status === filter)

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h3 className="text-xl font-bold text-gray-900">User Management</h3>
        <div className="flex gap-2 flex-wrap">
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition ${
                filter === f
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f} {f !== 'all' && `(${users.filter(u => u.approval_status === f).length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-3 text-gray-500">Loading users...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No {filter === 'all' ? '' : filter} users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="py-3 px-4 font-semibold text-gray-700">Name</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Email</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Role</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="py-3 px-4 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <UserRow key={u.id} user={u} onUpdate={updateUser} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function UserRow({ user, onUpdate }) {
  const [role, setRole] = useState(user.role)

  const statusBadge = {
    pending:  'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100  text-green-800',
    rejected: 'bg-red-100    text-red-800',
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="py-3 px-4 font-medium text-gray-900">{user.full_name || '—'}</td>
      <td className="py-3 px-4 text-gray-600">{user.email}</td>
      <td className="py-3 px-4">
        <select
          value={role}
          onChange={e => { setRole(e.target.value); onUpdate(user.id, { role: e.target.value }) }}
          className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-orange-400 outline-none"
        >
          <option value="worker">Field Worker</option>
          <option value="manager">Project Manager</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
        </select>
      </td>
      <td className="py-3 px-4">
        <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${statusBadge[user.approval_status]}`}>
          {user.approval_status}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex gap-2">
          {user.approval_status !== 'approved' && (
            <button
              onClick={() => onUpdate(user.id, { approval_status: 'approved' })}
              className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded transition"
            >
              <CheckCircle className="w-3 h-3" /> Approve
            </button>
          )}
          {user.approval_status !== 'rejected' && (
            <button
              onClick={() => onUpdate(user.id, { approval_status: 'rejected' })}
              className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded transition"
            >
              <XCircle className="w-3 h-3" /> Reject
            </button>
          )}
          {user.approval_status === 'rejected' && (
            <button
              onClick={() => onUpdate(user.id, { approval_status: 'pending' })}
              className="flex items-center gap-1 bg-gray-400 hover:bg-gray-500 text-white text-xs px-3 py-1 rounded transition"
            >
              <Clock className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── Settings ────────────────────────────────────────────────
function SettingsTab() {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">System Settings</h3>
      <div className="space-y-4">
        <SettingCard title="Email Notifications" description="Configure email alerts for project updates" enabled={true} />
        <SettingCard title="Two-Factor Authentication" description="Enforce 2FA for all users" enabled={false} />
        <SettingCard title="Auto Logout" description="Automatically log out inactive users after 30 min" enabled={true} />
      </div>
    </div>
  )
}

// ─── Reports ─────────────────────────────────────────────────
function ReportsTab() {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">Reports & Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">User Growth</h4>
          <div className="h-32 bg-gradient-to-r from-orange-200 to-orange-400 rounded flex items-center justify-center text-gray-700">
            Chart Placeholder
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Project Status</h4>
          <div className="h-32 bg-gradient-to-r from-blue-200 to-blue-400 rounded flex items-center justify-center text-gray-700">
            Chart Placeholder
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Shared components ───────────────────────────────────────
function StatCard({ title, value, color }) {
  const colors = {
    blue:   'bg-blue-50   text-blue-800   border-blue-200',
    green:  'bg-green-50  text-green-800  border-green-200',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    red:    'bg-red-50    text-red-800    border-red-200',
  }
  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-4xl font-bold mt-2">{value}</p>
    </div>
  )
}

function SettingCard({ title, description, enabled }) {
  const [on, setOn] = useState(enabled)
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`px-4 py-2 rounded-lg font-medium transition ${on ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'}`}
      >
        {on ? 'On' : 'Off'}
      </button>
    </div>
  )
}
