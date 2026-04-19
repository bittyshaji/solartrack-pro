/**
 * Authentication and Auth Context Type Definitions
 */

import { User, UserProfile, UserAuthState } from './user'

/**
 * Supabase auth user (from supabase-js library)
 */
export interface SupabaseUser {
  id: string
  aud: string
  role: string
  email?: string
  email_confirmed_at?: string
  phone?: string
  phone_confirmed_at?: string
  confirmed_at?: string
  last_sign_in_at?: string
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  created_at: string
  updated_at?: string
}

/**
 * Supabase auth session
 */
export interface SupabaseSession {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  user: SupabaseUser
}

/**
 * Auth context value
 */
export interface AuthContextValue {
  // User data
  user: User | null
  profile: UserProfile | null

  // Loading states
  loading: boolean
  profileLoading: boolean

  // Error state
  error: string | null

  // Auth methods
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
  resetPassword?: (email: string) => Promise<AuthResult>
  confirmPasswordReset?: (token: string, password: string) => Promise<AuthResult>

  // Status flags
  isAuthenticated: boolean
  isApproved: boolean
  isAdmin: boolean

  // Optional extended fields
  session?: SupabaseSession | null
}

/**
 * Standard auth result
 */
export interface AuthResult {
  data?: any
  error: string | null
  success?: boolean
  message?: string
}

/**
 * Authentication state slice for Redux/Zustand
 */
export interface AuthState {
  user: User | null
  profile: UserProfile | null
  session: SupabaseSession | null
  isAuthenticated: boolean
  isApproved: boolean
  isAdmin: boolean
  loading: boolean
  profileLoading: boolean
  error: string | null
  lastUpdated?: number
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string
  password: string
}

/**
 * Signup credentials
 */
export interface SignupCredentials {
  email: string
  password: string
  passwordConfirm: string
  name?: string
  phone?: string
  company?: string
  acceptTerms?: boolean
}

/**
 * Password reset request
 */
export interface PasswordReset {
  email: string
}

/**
 * Password confirmation
 */
export interface PasswordConfirm {
  token: string
  password: string
  passwordConfirm: string
}

/**
 * OAuth provider config
 */
export interface OAuthProvider {
  name: string
  clientId: string
  redirectUri: string
  scope?: string[]
}

/**
 * MFA/2FA setup
 */
export interface MFASetup {
  enabled: boolean
  method: 'totp' | 'sms' | 'email'
  verified: boolean
  backupCodes?: string[]
}

/**
 * MFA challenge
 */
export interface MFAChallenge {
  code: string
}

/**
 * Auth event
 */
export interface AuthEvent {
  event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'MFA_CHALLENGE_REQUESTED'
  session: SupabaseSession | null
  user: SupabaseUser | null
}

/**
 * Auth provider props
 */
export interface AuthProviderProps {
  children: React.ReactNode
  initialState?: Partial<AuthState>
  onAuthStateChange?: (event: AuthEvent) => void
}

/**
 * Protected route props
 */
export interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string | string[]
  fallback?: React.ReactNode
  onUnauthorized?: () => void
}

/**
 * Auth hook return type
 */
export interface UseAuthReturn extends AuthContextValue {
  updateProfile: (updates: Partial<UserProfile>) => Promise<AuthResult>
  updateSettings: (settings: Record<string, any>) => Promise<AuthResult>
  refreshSession: () => Promise<AuthResult>
  getTokens: () => { accessToken: string; refreshToken?: string } | null
}

/**
 * Email verification state
 */
export interface EmailVerificationState {
  email: string
  isVerified: boolean
  verificationSentAt?: string
  verificationExpiresAt?: string
}

/**
 * Phone verification state
 */
export interface PhoneVerificationState {
  phone: string
  isVerified: boolean
  verificationSentAt?: string
  verificationExpiresAt?: string
}

/**
 * User approval workflow
 */
export interface ApprovalWorkflow {
  userId: string
  status: 'pending' | 'approved' | 'rejected'
  requestedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}

/**
 * Session options
 */
export interface SessionOptions {
  refreshTokenRotationEnabled?: boolean
  absoluteSessionTimeout?: number
  idleSessionTimeout?: number
  persistSession?: boolean
}
