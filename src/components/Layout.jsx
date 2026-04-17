import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import MobileBottomNav from './MobileBottomNav'
import GlobalSearchBar from './GlobalSearchBar'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ClipboardList,
  Package,
  UserCircle,
  LogOut,
  Sun,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  BarChart3,
  Mail,
  Bell,
  Settings,
  CalendarClock,
  MapPin,
  Phone,
  CreditCard,
  Zap,
  Shield,
  Wrench,
  MessageSquare,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects', subItems: [
    { to: '/projects', icon: FolderKanban, label: 'All Projects' },
    { to: '/projects?section=site-survey', icon: MapPin, label: 'Site Surveys' },
    { to: '/projects?section=followups', icon: Phone, label: 'Follow-ups' },
    { to: '/projects?section=payments', icon: CreditCard, label: 'Payments' },
    { to: '/projects?section=kseb', icon: Zap, label: 'KSEB' },
    { to: '/projects?section=warranties', icon: Wrench, label: 'Warranties' },
    { to: '/projects?section=service', icon: MessageSquare, label: 'Service Requests' },
  ]},
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/updates', icon: ClipboardList, label: 'Daily Updates' },
  { to: '/staff-attendance', icon: CalendarClock, label: 'Attendance', admin: true },
  { to: '/reports', icon: BarChart3, label: 'Reports', admin: true },
  { to: '/customer', icon: UserCircle, label: 'Customer Portal' },
  { to: '/email-log', icon: Mail, label: 'Email Log', admin: true },
  { to: '/notification-queue', icon: Bell, label: 'Notifications', admin: true },
  { to: '/email-preferences', icon: Settings, label: 'Email Preferences' },
]

export default function Layout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedMenu, setExpandedMenu] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut, profile } = useAuth()
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const userRole = profile?.role || user?.user_metadata?.role || 'user'

  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) {
      toast.success('Logged out successfully')
      navigate('/login')
    } else {
      toast.error('Logout failed')
    }
  }

  const roleColor = {
    admin: 'bg-red-100 text-red-700',
    manager: 'bg-blue-100 text-blue-700',
    worker: 'bg-green-100 text-green-700',
    customer: 'bg-purple-100 text-purple-700',
  }[userRole] || 'bg-gray-100 text-gray-700'

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar - Hidden on mobile */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } hidden md:flex flex-shrink-0 bg-gray-900 text-white flex-col transition-all duration-300 ease-in-out`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <div className="w-9 h-9 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
            <Sun className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm leading-tight">SolarTrack Pro</p>
              <p className="text-gray-400 text-xs">Execution Platform</p>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems
            .filter(item => !item.admin || userRole === 'admin')
            .map(({ to, icon: Icon, label, subItems }) => (
            <div key={to}>
              {subItems ? (
                <>
                  <button
                    onClick={() => {
                      if (sidebarOpen) {
                        setExpandedMenu(expandedMenu === label ? null : label)
                      }
                      navigate(to)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                      location.pathname.startsWith(to)
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left">{label}</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedMenu === label ? 'rotate-180' : ''}`} />
                      </>
                    )}
                  </button>
                  {sidebarOpen && expandedMenu === label && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-gray-700 pl-3">
                      {subItems.map(({ to: subTo, icon: SubIcon, label: subLabel }) => (
                        <button
                          key={subTo + subLabel}
                          onClick={() => navigate(subTo)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-xs font-medium text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                        >
                          <SubIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{subLabel}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                      isActive
                        ? 'bg-orange-500 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span>{label}</span>}
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-700 p-3">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColor}`}>
                  {userRole}
                </span>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="text-gray-400 hover:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Logout"
              className="w-full flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors py-1"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar - Mobile friendly */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between md:gap-4 mb-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:block text-gray-500 hover:text-gray-900 transition-colors"
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 flex-1 min-w-0 overflow-hidden">
              <span className="hidden md:inline">SolarTrack Pro</span>
              {title && (
                <>
                  <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="text-gray-900 font-medium truncate">{title}</span>
                </>
              )}
            </div>

            {/* Mobile user menu button */}
            <button
              className="md:hidden text-gray-500 hover:text-gray-900 transition-colors flex items-center justify-center w-10 h-10 rounded-lg"
              title="User menu"
            >
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </div>
            </button>
          </div>

          {/* Global Search Bar */}
          <div className="hidden md:block">
            <GlobalSearchBar userId={user?.id} />
          </div>
        </header>

        {/* Page Content - Responsive padding */}
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
