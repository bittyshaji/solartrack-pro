/**
 * Mobile Bottom Navigation
 * Provides touch-friendly navigation for mobile devices
 * Appears at bottom of screen on mobile, hidden on desktop
 */

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  ClipboardList,
  UserCircle,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const mobileNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/updates', icon: ClipboardList, label: 'Updates' },
  { to: '/team', icon: Users, label: 'Team', admin: false },
  { to: '/reports', icon: BarChart3, label: 'Reports', admin: true },
  { to: '/customer', icon: UserCircle, label: 'Profile' },
]

export default function MobileBottomNav() {
  const { profile, user } = useAuth()
  const userRole = profile?.role || user?.user_metadata?.role || 'user'

  const visibleItems = mobileNavItems.filter(item => {
    if (item.admin === true && userRole !== 'admin') return false
    return true
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="flex justify-around items-center h-16">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 text-xs transition-colors ${
                isActive
                  ? 'text-orange-500 border-t-2 border-orange-500'
                  : 'text-gray-500'
              }`
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
