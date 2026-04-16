import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import { initializePWA } from './lib/pwaService'
import { OfflineIndicator } from './hooks/useOfflineStatus'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import Projects from './pages/Projects'
import CreateProject from './pages/CreateProject'
import ProjectDetail from './pages/ProjectDetail'
import Customers from './pages/Customers'
import Team from './pages/Team'
import Updates from './pages/Updates'
import Materials from './pages/Materials'
import Reports from './pages/Reports'
import CustomerPortal from './pages/CustomerPortal'
import SearchPage from './pages/SearchPage'

// Phase 2B: Email & Notifications
import EmailLog from './components/EmailLog'
import NotificationQueue from './components/NotificationQueue'
import EmailPreferences from './components/EmailPreferences'

function App() {
  // Initialize PWA features on mount
  useEffect(() => {
    initializePWA()
  }, [])

  return (
    <Router>
      <AuthProvider>
        <OfflineIndicator position="top" />
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/create" element={<ProtectedRoute><CreateProject /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
          <Route path="/updates" element={<ProtectedRoute><Updates /></ProtectedRoute>} />
          <Route path="/materials" element={<ProtectedRoute><Materials /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute requiredRole="admin"><Reports /></ProtectedRoute>} />
          <Route path="/customer" element={<ProtectedRoute><CustomerPortal /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />

          {/* Phase 2B: Email & Notifications Routes */}
          <Route path="/email-log" element={<ProtectedRoute><EmailLog /></ProtectedRoute>} />
          <Route path="/notification-queue" element={<ProtectedRoute><NotificationQueue /></ProtectedRoute>} />
          <Route path="/email-preferences" element={<ProtectedRoute><EmailPreferences /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App