import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContextValue } from '../types/auth'

/**
 * Auth Context Type
 * Phase 2 TypeScript Migration
 */
const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode
}

/**
 * Auth Provider Component
 * Manages authentication state and provides auth methods
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch user profile from user_profiles table
   */
  const fetchProfile = async (authUser: any) => {
    if (!authUser) {
      setProfile(null)
      return
    }

    setProfileLoading(true)
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle()
      setProfile(data || null)
    } catch (err: any) {
      console.error('Profile fetch error:', err)
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }

  /**
   * Initialize auth session and listen for changes
   */
  useEffect(() => {
    // 1. Get session first — set loading false immediately after
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null)
      setLoading(false)
      // Fetch profile separately — does NOT block loading
      fetchProfile(session?.user || null)
    }).catch((err: any) => {
      console.error('Session error:', err)
      setLoading(false)
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
        fetchProfile(session?.user || null)
      }
    )
    return () => subscription?.unsubscribe()
  }, [])

  /**
   * Sign up with email and password
   */
  const signUp = async (email: string, password: string, metadata: Record<string, any> = {}) => {
    try {
      setError(null)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      })
      if (signUpError) throw signUpError
      return { data, error: null }
    } catch (err: any) {
      setError(err.message)
      return { data: null, error: err.message }
    }
  }

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      setError(null)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      return { data, error: null }
    } catch (err: any) {
      setError(err.message)
      return { data: null, error: err.message }
    }
  }

  /**
   * Sign out current user
   */
  const signOut = async () => {
    try {
      setError(null)
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      return { error: null }
    } catch (err: any) {
      setError(err.message)
      return { error: err.message }
    }
  }

  /**
   * Build context value
   */
  const value: AuthContextValue = {
    user,
    profile,
    loading,
    profileLoading,
    error,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isApproved: profile?.approval_status === 'approved',
    isAdmin: profile?.role === 'admin' && profile?.approval_status === 'approved',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * useAuth Hook
 * Access auth context value
 * Throws error if used outside AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export default AuthProvider
