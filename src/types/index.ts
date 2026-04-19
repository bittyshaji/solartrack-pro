/**
 * Type Definitions Export Index
 * Central export point for all application types
 *
 * Import any type with: import type { TypeName } from '@/types'
 */

// Common types
export type {
  ApiResponse,
  PaginationMeta,
  PaginatedResponse,
  ErrorResponse,
  DateRange,
  PaginationParams,
  SortOrder,
  SortParams,
  FilterOperator,
  FilterCondition,
  StatusIndicator,
  AuditMeta,
  FileMetadata,
  CacheEntry,
  CacheStats,
  NotificationType,
  NotificationPayload,
  AsyncOperationStatus,
  BatchOperationResult,
} from './common'

// User types
export type {
  UserRole,
  ApprovalStatus,
  User,
  UserProfile,
  UserProfileExtended,
  UserPermissions,
  RoleConfig,
  UserSession,
  UserAuthState,
  SignUpData,
  SignInData,
  PasswordResetRequest,
  PasswordResetConfirmation,
  UserInvitation,
  UserActivityLog,
  TeamMember,
  UserSettings,
} from './user'

// Customer types
export type {
  Customer,
  CustomerProfile,
  CustomerContact,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerSearchQuery,
  CustomerStats,
  CustomerWithProjectCount,
  CustomerPortalData,
  CustomerBulkImportItem,
  CustomerBulkImportResult,
  CustomerCommunication,
  CustomerDocument,
  CustomerPreferences,
} from './customer'

// Project types
export type {
  ProjectStatus,
  ProjectState,
  ProjectStage,
  Project,
  ProjectDetail,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectPhoto,
  ProjectTask,
  ProjectDocument,
  ProjectInvoice,
  ProjectFilterCriteria,
  ProjectStats,
  ProjectMilestone,
  StageProgress,
  ProjectTimelineEntry,
  ProjectBulkOperationResult,
  ProjectSearchResult,
  ProjectExportData,
} from './project'

export { DEFAULT_PROJECT_STAGES } from './project'

// Auth types
export type {
  SupabaseUser,
  SupabaseSession,
  AuthContextValue,
  AuthResult,
  AuthState,
  LoginCredentials,
  SignupCredentials,
  PasswordReset,
  PasswordConfirm,
  OAuthProvider,
  MFASetup,
  MFAChallenge,
  AuthEvent,
  AuthProviderProps,
  ProtectedRouteProps,
  UseAuthReturn,
  EmailVerificationState,
  PhoneVerificationState,
  ApprovalWorkflow,
  SessionOptions,
} from './auth'
