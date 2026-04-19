/**
 * User and Authentication-related Type Definitions
 */

/**
 * User roles in the system
 */
export type UserRole = 'admin' | 'manager' | 'technician' | 'customer' | 'guest'

/**
 * Approval status for users
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

/**
 * Basic user data from Supabase Auth
 */
export interface User {
  id: string
  email: string
  phone?: string | null
  email_confirmed_at?: string | null
  created_at: string
  updated_at?: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

/**
 * User profile stored in database
 */
export interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string | null
  avatar_url?: string | null
  role: UserRole
  approval_status: ApprovalStatus
  department?: string | null
  position?: string | null
  company?: string | null
  bio?: string | null
  skills?: string[] | null
  is_active: boolean
  last_login?: string | null
  created_at: string
  updated_at: string
}

/**
 * Extended user profile with additional metadata
 */
export interface UserProfileExtended extends UserProfile {
  metadata?: {
    preferences?: Record<string, any>
    settings?: Record<string, any>
    customFields?: Record<string, any>
  }
  stats?: {
    projectsCompleted?: number
    totalRevenue?: number
    averageRating?: number
  }
}

/**
 * User permissions object
 */
export interface UserPermissions {
  canCreateProject: boolean
  canEditProject: boolean
  canDeleteProject: boolean
  canManageTeam: boolean
  canViewReports: boolean
  canManageCustomers: boolean
  canExportData: boolean
  canApproveUsers: boolean
  canAccessAdmin: boolean
  [key: string]: boolean
}

/**
 * User role configuration
 */
export interface RoleConfig {
  role: UserRole
  displayName: string
  permissions: UserPermissions
  description: string
}

/**
 * User session
 */
export interface UserSession {
  user: User
  session: {
    access_token: string
    refresh_token?: string
    expires_in: number
    expires_at?: number
    token_type: string
  }
}

/**
 * User authentication state
 */
export interface UserAuthState {
  user: User | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isApproved: boolean
  isAdmin: boolean
  permissions: UserPermissions | null
  loading: boolean
  profileLoading: boolean
  error: string | null
}

/**
 * Sign up data
 */
export interface SignUpData {
  email: string
  password: string
  name?: string
  phone?: string
  company?: string
  metadata?: Record<string, any>
}

/**
 * Sign in data
 */
export interface SignInData {
  email: string
  password: string
  rememberMe?: boolean
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string
}

/**
 * Password reset confirmation
 */
export interface PasswordResetConfirmation {
  password: string
  token: string
}

/**
 * User invitation
 */
export interface UserInvitation {
  id: string
  email: string
  role: UserRole
  invitedBy: string
  invitedAt: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  acceptedAt?: string
}

/**
 * User activity log entry
 */
export interface UserActivityLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

/**
 * Team member info
 */
export interface TeamMember extends UserProfile {
  projects?: string[]
  tasksAssigned?: number
  tasksCompleted?: number
  joinedAt: string
}

/**
 * User settings
 */
export interface UserSettings {
  userId: string
  theme?: 'light' | 'dark' | 'auto'
  language?: string
  timezone?: string
  emailNotifications?: boolean
  pushNotifications?: boolean
  twoFactorEnabled?: boolean
  preferences?: Record<string, any>
  updatedAt: string
}
