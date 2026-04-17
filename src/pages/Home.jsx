import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        navigate('/dashboard')
      } else {
        navigate('/login')
      }
    }
  }, [isAuthenticated, loading, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="text-center">
        <div className="mb-8">
          <svg className="w-24 h-24 mx-auto text-orange-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m6.364 1.636l-.707.707M21 12h-1m-1.636-6.364l-.707-.707M12 21v-1m-6.364-1.636l.707-.707M3 12h1m1.636 6.364l.707.707" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">SolarTrack Pro</h1>
        <p className="text-2xl text-orange-600 font-semibold mb-8">Loading...</p>
        <div className="space-y-2 text-gray-600">
          <p>🔧 Initializing Project Execution Management</p>
          <p>☀️ Kerala Solar Installation Platform</p>
        </div>
      </div>
    </div>
  )
}
