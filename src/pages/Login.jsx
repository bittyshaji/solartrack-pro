import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Mail, Lock, LogIn, ArrowLeft, KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, loading } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Forgot password state
  const [showForgot, setShowForgot]       = useState(false)
  const [resetEmail, setResetEmail]       = useState('')
  const [resetSending, setResetSending]   = useState(false)
  const [resetSent, setResetSent]         = useState(false)
  const [cooldown, setCooldown]           = useState(0)

  // ── Login ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { toast.error('Please fill in all fields'); return }
    setIsLoading(true)
    const { error } = await signIn(email, password)
    setIsLoading(false)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Login successful!')
      navigate('/dashboard')
    }
  }

  // ── Cooldown Timer ────────────────────────────────────────────
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  // ── Forgot Password ──────────────────────────────────────────
  const handleForgotPassword = async (e) => {
    e.preventDefault()
    if (!resetEmail.trim()) { toast.error('Please enter your email address'); return }
    setResetSending(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetSending(false)
    if (error) {
      toast.error(error.message)
      // Set cooldown on error (rate limit exceeded)
      setCooldown(60)
    } else {
      setResetSent(true)
      // Set cooldown on success
      setCooldown(60)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // ── Forgot Password View ─────────────────────────────────────
  if (showForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 py-12 px-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">

          {/* Back button */}
          <button
            onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail('') }}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          {!resetSent ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-4">
                  <KeyRound className="w-6 h-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
                <p className="text-gray-500 text-sm mt-2">
                  Enter your email and we'll send you a link to reset your password.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetSending || cooldown > 0}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {resetSending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Sending...
                    </>
                  ) : cooldown > 0 ? (
                    `Try again in ${cooldown}s`
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Check your inbox</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                We've sent a password reset link to<br />
                <span className="font-semibold text-gray-700">{resetEmail}</span>
              </p>
              <p className="text-gray-400 text-xs mt-3">
                Didn't receive it? Check your spam folder.
                {cooldown > 0 && (
                  <span className="block mt-1 text-orange-500 font-medium">
                    You can request another in {cooldown}s
                  </span>
                )}
              </p>
              <button
                onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail('') }}
                className="mt-6 w-full border border-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Login View ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50 py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 mb-4">
            <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SolarTrack Pro</h1>
          <p className="text-gray-600 mt-2">Project Execution Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <button
                type="button"
                onClick={() => { setShowForgot(true); setResetEmail(email) }}
                className="text-xs text-orange-500 hover:text-orange-600 font-medium transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="my-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm font-medium text-blue-900 mb-2">Demo Credentials</p>
          <p className="text-xs text-blue-700">Email: demo@solar.com</p>
          <p className="text-xs text-blue-700">Password: demo123456</p>
        </div>

        <p className="text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-orange-600 hover:text-orange-700 font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
