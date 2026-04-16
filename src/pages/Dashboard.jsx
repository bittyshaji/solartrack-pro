import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import {
  FolderKanban,
  Users,
  ClipboardList,
  Package,
  UserCircle,
  BarChart3,
  ArrowRight,
} from 'lucide-react'

const ROLE_CARDS = {
  admin: [
    { icon: FolderKanban, label: 'Projects', to: '/projects', color: 'bg-blue-100 text-blue-600', desc: 'Manage all solar projects' },
    { icon: Users, label: 'Team', to: '/team', color: 'bg-green-100 text-green-600', desc: 'Manage team members & roles' },
    { icon: ClipboardList, label: 'Daily Updates', to: '/updates', color: 'bg-orange-100 text-orange-600', desc: 'View field updates' },
    { icon: Package, label: 'Materials', to: '/materials', color: 'bg-purple-100 text-purple-600', desc: 'Track material inventory' },
    { icon: UserCircle, label: 'Customer Portal', to: '/customer', color: 'bg-pink-100 text-pink-600', desc: 'Customer project views' },
    { icon: BarChart3, label: 'Admin Panel', to: '/admin', color: 'bg-red-100 text-red-600', desc: 'System management' },
  ],
  manager: [
    { icon: FolderKanban, label: 'Projects', to: '/projects', color: 'bg-blue-100 text-blue-600', desc: 'Track active solar projects' },
    { icon: Users, label: 'Team', to: '/team', color: 'bg-green-100 text-green-600', desc: 'Coordinate your team' },
    { icon: ClipboardList, label: 'Daily Updates', to: '/updates', color: 'bg-orange-100 text-orange-600', desc: 'Review field reports' },
    { icon: Package, label: 'Materials', to: '/materials', color: 'bg-purple-100 text-purple-600', desc: 'Monitor materials & costs' },
  ],
  worker: [
    { icon: FolderKanban, label: 'My Projects', to: '/projects', color: 'bg-blue-100 text-blue-600', desc: 'View assigned projects' },
    { icon: ClipboardList, label: 'Log Update', to: '/updates', color: 'bg-orange-100 text-orange-600', desc: 'Submit your daily report' },
    { icon: Package, label: 'Materials', to: '/materials', color: 'bg-purple-100 text-purple-600', desc: 'Log material usage' },
  ],
  customer: [
    { icon: UserCircle, label: 'My Project', to: '/customer', color: 'bg-orange-100 text-orange-600', desc: 'View your installation status' },
  ],
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const userRole = user?.user_metadata?.role || 'worker'
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  const cards = ROLE_CARDS[userRole] || ROLE_CARDS.worker

  const ROLE_WELCOME = {
    admin: 'System management and user control',
    manager: 'Project tracking and team coordination',
    worker: 'Daily tasks and project updates',
    customer: 'Your solar project status',
  }

  const roleColor = {
    admin: 'bg-red-100 text-red-700',
    manager: 'bg-blue-100 text-blue-700',
    worker: 'bg-green-100 text-green-700',
    customer: 'bg-purple-100 text-purple-700',
  }[userRole] || 'bg-gray-100 text-gray-700'

  return (
    <Layout title="Dashboard">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 rounded-2xl p-6 mb-8 text-white shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Welcome back, {userName}!</h2>
            <p className="text-orange-100 text-sm">{ROLE_WELCOME[userRole]}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white`}>
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </span>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-700 mb-4">Quick Access</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ icon: Icon, label, to, color, desc }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md hover:border-orange-300 transition-all group"
            >
              <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-orange-500 transition-colors flex-shrink-0 ml-2" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Account Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Email</p>
            <p className="text-sm font-medium text-gray-900">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Role</p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColor}`}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">User ID</p>
            <p className="text-xs text-gray-500 font-mono">{user?.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Status</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-sm text-green-600 font-medium">Active</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
