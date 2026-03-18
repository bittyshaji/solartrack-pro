import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function ProtectedRoute({ children, requiredRole = null }) {
  const { user, profile, loading, isAuthenticated, isApproved } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Account rejected
  if (profile?.approval_status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
        <div className="text-center max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Rejected</h2>
          <p className="text-gray-600 mb-6">
            Your account request has been rejected by the admin. Please contact your administrator for more information.
          </p>
          <a
            href="/login"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            Back to Login
          </a>
        </div>
      </div>
    )
  }

  // Account pending approval
  if (!isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 px-4">
        <div className="text-center max-w-md bg-white rounded-xl shadow-lg p-8">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Awaiting Admin Approval</h2>
          <p className="text-gray-600 mb-2">
            Hi <strong>{profile?.full_name || user?.email}</strong>, your account is under review.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            You will be able to log in once an admin approves your request. Please check back later.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-orange-700">
              📧 Registered as: <strong>{user?.email}</strong><br />
              🔖 Requested role: <strong className="capitalize">{profile?.role}</strong>
            </p>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // Role-based access check
  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
