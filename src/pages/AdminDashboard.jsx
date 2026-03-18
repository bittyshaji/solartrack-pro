import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Users, Settings, BarChart3, LogsIcon, Home } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) {
      toast.success('Logged out successfully')
      navigate('/login')
    } else {
      toast.error('Logout failed')
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'logs', label: 'Audit Logs', icon: LogsIcon },
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
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.email}! 👋</h2>
          <p className="text-gray-600 mt-2">System Administration Panel</p>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'logs' && <AuditLogsTab />}
        </div>
      </div>
    </div>
  )
}

function OverviewTab() {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">System Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value="24" change="+5 this month" color="blue" />
        <StatCard title="Active Projects" value="12" change="8 in progress" color="green" />
        <StatCard title="System Health" value="99.8%" change="Excellent" color="emerald" />
        <StatCard title="Uptime" value="99.9%" change="Last 30 days" color="purple" />
      </div>
      <div className="mt-8">
        <h4 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h4>
        <div className="space-y-3">
          <ActivityItem action="User registered" user="john.doe@example.com" time="2 hours ago" />
          <ActivityItem action="Project created" user="manager@example.com" time="5 hours ago" />
          <ActivityItem action="User role updated" user="admin@example.com" time="1 day ago" />
        </div>
      </div>
    </div>
  )
}

function UsersTab() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">User Management</h3>
        <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">
          + Add User
        </button>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
        <p className="text-sm text-blue-800">User management features: View all users, edit roles, deactivate accounts, reset passwords</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            <UserRow email="admin@example.com" role="Admin" status="Active" />
            <UserRow email="manager@example.com" role="Manager" status="Active" />
            <UserRow email="worker@example.com" role="Worker" status="Active" />
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SettingsTab() {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">System Settings</h3>
      <div className="space-y-6">
        <SettingCard title="Email Notifications" description="Configure email alerts" enabled={true} />
        <SettingCard title="Two-Factor Authentication" description="Enable 2FA for all users" enabled={false} />
        <SettingCard title="Auto Logout" description="Automatically logout inactive users" enabled={true} />
        <SettingCard title="Data Backup" description="Schedule automatic backups" enabled={true} />
      </div>
    </div>
  )
}

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

function AuditLogsTab() {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-6">Audit Logs</h3>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <input
          type="text"
          placeholder="Search logs..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
        />
      </div>
      <div className="space-y-3">
        <AuditLogEntry action="User Login" user="admin@example.com" time="2 minutes ago" status="success" />
        <AuditLogEntry action="User Modified" user="manager@example.com" time="1 hour ago" status="success" />
        <AuditLogEntry action="Settings Changed" user="admin@example.com" time="3 hours ago" status="warning" />
        <AuditLogEntry action="Failed Login Attempt" user="unknown@example.com" time="5 hours ago" status="error" />
      </div>
    </div>
  )
}

function StatCard({ title, value, change, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    green: 'bg-green-50 text-green-800 border-green-200',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    purple: 'bg-purple-50 text-purple-800 border-purple-200',
  }

  return (
    <div className={`p-4 rounded-lg border ${colors[color] || colors.blue}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs mt-1 opacity-75">{change}</p>
    </div>
  )
}

function ActivityItem({ action, user, time }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
      <div>
        <p className="font-medium text-gray-900">{action}</p>
        <p className="text-sm text-gray-600">{user}</p>
      </div>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  )
}

function UserRow({ email, role, status }) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="py-3 px-4">{email}</td>
      <td className="py-3 px-4">
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">{role}</span>
      </td>
      <td className="py-3 px-4">
        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">{status}</span>
      </td>
      <td className="py-3 px-4">
        <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">Edit</button>
      </td>
    </tr>
  )
}

function SettingCard({ title, description, enabled }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button className={`px-4 py-2 rounded-lg font-medium transition ${
        enabled 
          ? 'bg-green-500 hover:bg-green-600 text-white' 
          : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
      }`}>
        {enabled ? 'On' : 'Off'}
      </button>
    </div>
  )
}

function AuditLogEntry({ action, user, time, status }) {
  const statusColors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{action}</p>
          <p className="text-sm opacity-75">{user}</p>
        </div>
        <p className="text-xs">{time}</p>
      </div>
    </div>
  )
}