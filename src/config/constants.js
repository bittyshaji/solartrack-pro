/**
 * Application Constants
 * Single source of truth for all magic strings and configuration values
 *
 * This file eliminates magic strings throughout the codebase and provides
 * a centralized location for all application constants.
 *
 * Usage:
 *   import { PROJECT_STATUSES, API_CONFIG } from '@/config/constants'
 */

// ============================================================================
// PROJECT & WORKFLOW CONSTANTS
// ============================================================================

/**
 * Project Status Values
 * Used to track the overall state of a project
 */
export const PROJECT_STATUSES = {
  PLANNING: 'Planning',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const PROJECT_STATUS_OPTIONS = Object.values(PROJECT_STATUSES)

/**
 * Project Stages
 * Sequential stages of a solar project from survey to commissioning
 */
export const PROJECT_STAGES = [
  { id: 1, name: 'Site Survey' },
  { id: 2, name: 'KSEB Application' },
  { id: 3, name: 'Mounting Work' },
  { id: 4, name: 'Panel Installation' },
  { id: 5, name: 'Wiring & Inverter' },
  { id: 6, name: 'Earthing & Safety' },
  { id: 7, name: 'KSEB Inspection' },
  { id: 8, name: 'Net Meter' },
  { id: 9, name: 'Commissioning' },
  { id: 10, name: 'Completed' },
]

/**
 * Stage name lookup by ID
 */
export const STAGE_NAMES = Object.fromEntries(
  PROJECT_STAGES.map(s => [s.id, s.name])
)

/**
 * User Roles
 * Defines access levels in the application
 */
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer',
}

/**
 * Approval Status
 * Used for document approvals, expense approvals, etc.
 */
export const APPROVAL_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
}

// ============================================================================
// EMAIL & COMMUNICATION CONSTANTS
// ============================================================================

/**
 * Email Template Types
 * Used to identify which template to use for email generation
 */
export const EMAIL_TEMPLATE_TYPES = {
  INVOICE: 'invoice',
  REMINDER: 'reminder',
  STATUS_UPDATE: 'statusUpdate',
  WELCOME: 'welcome',
  HANDOVER: 'handover',
  COMPLETION: 'completion',
  PROPOSAL: 'proposal',
}

/**
 * Email Status
 * Tracks the delivery status of emails
 */
export const EMAIL_STATUS = {
  DRAFT: 'draft',
  QUEUED: 'queued',
  SENT: 'sent',
  FAILED: 'failed',
  BOUNCED: 'bounced',
  OPENED: 'opened',
  CLICKED: 'clicked',
}

// ============================================================================
// PAGINATION & DATA CONSTANTS
// ============================================================================

/**
 * Pagination Configuration
 * Default page sizes for list views
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 500,
}

/**
 * Date Range Presets
 * Quick selections for analytics date ranges
 */
export const DATE_RANGE_PRESETS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last7days',
  LAST_30_DAYS: 'last30days',
  THIS_MONTH: 'thisMonth',
  LAST_MONTH: 'lastMonth',
  LAST_QUARTER: 'lastQuarter',
  LAST_YEAR: 'lastYear',
  CUSTOM: 'custom',
}

// ============================================================================
// API & NETWORK CONSTANTS
// ============================================================================

/**
 * API Configuration
 * Network timeouts, retry policies, and request settings
 */
export const API_CONFIG = {
  BASE_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second initial delay
  RETRY_BACKOFF_MULTIPLIER: 2,
  RETRY_MAX_DELAY: 30000, // 30 seconds max
  RATE_LIMIT_DELAY: 100, // 100ms between requests when rate limited
}

/**
 * HTTP Methods
 * Standard HTTP verbs
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
}

/**
 * HTTP Status Codes
 * Common status codes used for error handling
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
}

// ============================================================================
// EMAIL & COMMUNICATION CONFIGURATION
// ============================================================================

/**
 * Email Configuration
 * Settings for bulk email operations and retries
 */
export const EMAIL_CONFIG = {
  BATCH_SIZE: 10,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 3600000, // 1 hour
  DEFAULT_FROM: 'noreply@solartrack.com',
  SUPPORT_EMAIL: 'support@solartrack.com',
  ADMIN_EMAIL: 'admin@solartrack.com',
  THROTTLE_DELAY: 100, // 100ms between emails
}

/**
 * Notification Types
 * Different kinds of in-app notifications
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
}

/**
 * Notification Duration (ms)
 * How long to display notifications
 */
export const NOTIFICATION_DURATION = {
  SHORT: 3000,
  MEDIUM: 5000,
  LONG: 8000,
  PERSISTENT: 0, // Requires manual close
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

/**
 * Feature Flags
 * Toggle features without code changes
 * Can be replaced with dynamic feature flag service
 */
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: true,
  ENABLE_BATCH_OPERATIONS: true,
  ENABLE_EMAIL_NOTIFICATIONS: true,
  ENABLE_PHOTO_UPLOADS: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_ADVANCED_FILTERING: true,
  ENABLE_EXPORT_PDF: true,
  ENABLE_CSV_IMPORT: true,
  ENABLE_MOBILE_APP: true,
  ENABLE_API_V2: false, // Coming soon
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Validation Configuration
 * String lengths, patterns, and validation rules
 */
export const VALIDATION = {
  // Project
  PROJECT_NAME_MIN_LENGTH: 3,
  PROJECT_NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,

  // Customer
  CUSTOMER_NAME_MIN_LENGTH: 2,
  CUSTOMER_NAME_MAX_LENGTH: 100,
  CUSTOMER_EMAIL_MIN_LENGTH: 5,
  CUSTOMER_EMAIL_MAX_LENGTH: 254,

  // Phone/Email patterns
  PHONE_PATTERN: /^\+?[\d\s\-()]+$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,

  // Address
  ADDRESS_MAX_LENGTH: 255,

  // Password
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_PATTERN: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * Storage Keys
 * Keys for localStorage and sessionStorage
 * Prefixed with 'st_' to avoid conflicts
 */
export const STORAGE_KEYS = {
  // Authentication
  AUTH_TOKEN: 'st_auth_token',
  USER_ID: 'st_user_id',
  USER_ROLE: 'st_user_role',
  SESSION_EXPIRES: 'st_session_expires',

  // User Preferences
  USER_PREFERENCES: 'st_user_preferences',
  THEME: 'st_theme',
  LANGUAGE: 'st_language',
  TIMEZONE: 'st_timezone',

  // Filters & Search
  FILTER_PRESETS: 'st_filter_presets',
  SAVED_SEARCHES: 'st_saved_searches',
  RECENT_PROJECTS: 'st_recent_projects',

  // Offline Data
  OFFLINE_PROJECTS: 'st_offline_projects',
  OFFLINE_CUSTOMERS: 'st_offline_customers',
  OFFLINE_QUEUE: 'st_offline_queue',

  // UI State
  SIDEBAR_EXPANDED: 'st_sidebar_expanded',
  LAST_ACTIVE_TAB: 'st_last_active_tab',
  SORT_PREFERENCES: 'st_sort_preferences',
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * Error Messages
 * User-friendly error messages
 */
export const ERROR_MESSAGES = {
  // Generic
  GENERIC: 'An error occurred. Please try again later.',
  UNKNOWN: 'Something went wrong. Please contact support.',

  // Network
  NETWORK: 'Network error. Please check your connection.',
  NETWORK_TIMEOUT: 'The request took too long. Please try again.',
  OFFLINE: 'You are currently offline. Some features may not be available.',

  // Authentication
  AUTH_REQUIRED: 'You must be logged in to perform this action.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_CREDENTIALS: 'Invalid email or password.',

  // Validation
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_FAILED: 'Please check your input and try again.',
  DUPLICATE_EMAIL: 'This email is already registered.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',

  // Database
  DATABASE_ERROR: 'Database error. Please try again later.',
  RECORD_NOT_FOUND: 'Record not found.',
  DUPLICATE_RECORD: 'This record already exists.',

  // File Operations
  FILE_UPLOAD_FAILED: 'File upload failed. Please try again.',
  FILE_TOO_LARGE: 'File is too large. Maximum size is 10MB.',
  INVALID_FILE_TYPE: 'Invalid file type. Please check the file and try again.',

  // Email
  EMAIL_SEND_FAILED: 'Failed to send email. Please try again later.',
  INVALID_EMAIL_ADDRESS: 'Invalid email address.',

  // Import/Export
  IMPORT_FAILED: 'Import failed. Please check your file and try again.',
  EXPORT_FAILED: 'Export failed. Please try again later.',
  CSV_PARSE_ERROR: 'Error parsing CSV file. Please check the format.',

  // Payment
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  PAYMENT_DECLINED: 'Your payment was declined.',
  INVALID_PAYMENT_METHOD: 'Invalid payment method.',
}

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

/**
 * Success Messages
 * User feedback for successful operations
 */
export const SUCCESS_MESSAGES = {
  // Projects
  PROJECT_CREATED: 'Project created successfully.',
  PROJECT_UPDATED: 'Project updated successfully.',
  PROJECT_DELETED: 'Project deleted successfully.',
  PROJECT_DUPLICATED: 'Project duplicated successfully.',

  // Customers
  CUSTOMER_CREATED: 'Customer created successfully.',
  CUSTOMER_UPDATED: 'Customer updated successfully.',
  CUSTOMER_DELETED: 'Customer deleted successfully.',

  // Documents
  EMAIL_SENT: 'Email sent successfully.',
  EMAIL_QUEUED: 'Email queued for sending.',
  INVOICE_GENERATED: 'Invoice generated successfully.',
  PROPOSAL_CREATED: 'Proposal created successfully.',
  CERTIFICATE_GENERATED: 'Certificate generated successfully.',

  // Operations
  IMPORT_COMPLETE: 'Import completed successfully.',
  EXPORT_COMPLETE: 'Export completed successfully.',
  BATCH_OPERATION_COMPLETE: 'Batch operation completed successfully.',

  // Authentication
  LOGIN_SUCCESS: 'Logged in successfully.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  PASSWORD_RESET: 'Password reset successfully. Please check your email.',
  PROFILE_UPDATED: 'Profile updated successfully.',

  // File Operations
  FILE_UPLOADED: 'File uploaded successfully.',
  PHOTO_UPLOADED: 'Photo uploaded successfully.',
  DOCUMENT_UPLOADED: 'Document uploaded successfully.',
}

// ============================================================================
// LOGGING CONSTANTS
// ============================================================================

/**
 * Log Levels
 * Severity levels for logging
 */
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
}

/**
 * Log Categories
 * Types of logs for filtering
 */
export const LOG_CATEGORIES = {
  API: 'api',
  AUTH: 'auth',
  DATABASE: 'database',
  EMAIL: 'email',
  FILE: 'file',
  PERFORMANCE: 'performance',
  USER_ACTION: 'user_action',
  SYSTEM: 'system',
  ERROR: 'error',
}

// ============================================================================
// TIMING & DELAYS
// ============================================================================

/**
 * Timing Configuration
 * Delays for debouncing, throttling, and animations
 */
export const TIMING = {
  // Debounce delays
  SEARCH_DEBOUNCE: 300,
  INPUT_DEBOUNCE: 500,
  WINDOW_RESIZE_DEBOUNCE: 300,

  // Throttle delays
  SCROLL_THROTTLE: 100,
  CLICK_THROTTLE: 300,

  // Animation durations
  ANIMATION_SHORT: 200,
  ANIMATION_MEDIUM: 300,
  ANIMATION_LONG: 500,

  // API delays
  RETRY_INITIAL_DELAY: 1000,
  RATE_LIMIT_DELAY: 100,

  // UI feedback
  TOAST_DURATION: 5000,
  SKELETON_LOAD_TIME: 800,
}

// ============================================================================
// REGEX PATTERNS
// ============================================================================

/**
 * Common Regex Patterns
 * Used for validation throughout the app
 */
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-()]+$/,
  URL: /^https?:\/\/[^\s]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  DIGIT: /\d/,
  SPECIAL_CHAR: /[@$!%*?&]/,
}

// ============================================================================
// LIMITS & CONSTRAINTS
// ============================================================================

/**
 * Application Limits
 * Boundaries for various operations
 */
export const LIMITS = {
  // File uploads
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_BATCH_SIZE: 100,
  MAX_EXPORT_RECORDS: 10000,

  // Display
  MAX_DISPLAYED_ITEMS: 1000,
  ITEMS_PER_PAGE: 25,

  // Strings
  MAX_PROJECT_NAME: 100,
  MAX_DESCRIPTION: 1000,
  MAX_NOTES: 5000,

  // Performance
  CACHE_TTL: 3600000, // 1 hour
  SESSION_TIMEOUT: 1800000, // 30 minutes
}

// ============================================================================
// DOCUMENT TYPES & FORMATS
// ============================================================================

/**
 * Supported File Types
 */
export const FILE_TYPES = {
  PDF: 'application/pdf',
  CSV: 'text/csv',
  EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
  IMAGE_WEBP: 'image/webp',
}

/**
 * File Extensions
 */
export const FILE_EXTENSIONS = {
  PDF: 'pdf',
  CSV: 'csv',
  EXCEL: 'xlsx',
  JPG: 'jpg',
  PNG: 'png',
  WEBP: 'webp',
}

// ============================================================================
// ENVIRONMENT & DEPLOYMENT
// ============================================================================

/**
 * Environment Names
 */
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
}

/**
 * Feature Availability by Environment
 */
export const FEATURES_BY_ENV = {
  development: ['ENABLE_ADVANCED_FILTERING', 'ENABLE_API_V2'],
  staging: ['ENABLE_ADVANCED_FILTERING'],
  production: [],
}

// ============================================================================
// EXPORT GROUPS (for convenience)
// ============================================================================

/**
 * All validation constants
 */
export const VALIDATION_CONSTANTS = {
  PATTERNS,
  VALIDATION,
  LIMITS,
}

/**
 * All status/option constants
 */
export const STATUS_CONSTANTS = {
  PROJECT_STATUSES,
  PROJECT_STATUS_OPTIONS,
  APPROVAL_STATUSES,
  EMAIL_STATUS,
  NOTIFICATION_TYPES,
}

/**
 * All message constants
 */
export const MESSAGE_CONSTANTS = {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
}

/**
 * All configuration constants
 */
export const CONFIG_CONSTANTS = {
  API_CONFIG,
  EMAIL_CONFIG,
  PAGINATION,
}
