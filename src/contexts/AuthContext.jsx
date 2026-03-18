import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // Fetch the user_profiles row for a given auth user
  const fetchProfile = async (authUser) => {
    if (!authUser) { setProfile(null); return }
    const { data, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()
    if (!profileError && data) setProfile(data)
    else setProfile(null)
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
        await fetchProfile(session?.user || null)
      } catch (err) {
        console.error('Auth check failed:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        await fetchProfile(session?.user || null)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const signUp = async (email, password, metadata = {}) => {
    try {
      setError(null)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      })
      if (signUpError) throw signUpError

      // Insert profile row with pending status
      if (data?.user) {
        await supabase.from('user_profiles').insert({
          id: data.user.id,
          full_name: metadata.full_name || '',
          email,
          role: metadata.role || 'worker',
          approval_status: 'pending',
        })
      }
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err.message }
    }
  }

  const signIn = async (email, password) => {
    try {
      setError(null)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err.message }
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      setUser(null)
      setProfile(null)
      return { error: null }
    } catch (err) {
      setError(err.message)
      return { error: err.message }
    }
  }

  const value = {
    user,
    profile,
    loading,
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
