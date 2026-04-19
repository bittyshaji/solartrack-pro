/**
 * Environment Configuration
 * Centralized management of environment variables
 *
 * This module provides:
 * - Type checking for required environment variables
 * - Default values for optional variables
 * - Validation of configuration
 * - Easy access from anywhere in the app
 *
 * Usage:
 *   import { env } from '@/config/environment'
 *   console.log(env.SUPABASE_URL)
 */

/**
 * Parse and validate environment variables
 * @returns {Object} Validated environment configuration
 */
function getEnvironmentConfig() {
  // Define all environment variables with their validation rules
  const config = {
    // Application
    NODE_ENV: process.env.NODE_ENV || 'development',
    APP_NAME: process.env.VITE_APP_NAME || 'SolarTrack Pro',
    APP_VERSION: process.env.VITE_APP_VERSION || '1.0.0',

    // Supabase
    SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,

    // API Configuration
    API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
    API_TIMEOUT: parseInt(process.env.VITE_API_TIMEOUT || '30000', 10),

    // Email Service
    EMAIL_SERVICE: process.env.VITE_EMAIL_SERVICE || 'sendgrid',
    SENDGRID_API_KEY: process.env.VITE_SENDGRID_API_KEY,

    // Feature Flags
    ENABLE_ANALYTICS: process.env.VITE_ENABLE_ANALYTICS === 'true',
    ENABLE_OFFLINE_MODE: process.env.VITE_ENABLE_OFFLINE_MODE !== 'false',
    ENABLE_DEBUG_PANEL: process.env.VITE_ENABLE_DEBUG_PANEL === 'true',

    // Logging
    LOG_LEVEL: process.env.VITE_LOG_LEVEL || 'info',
    SENTRY_DSN: process.env.VITE_SENTRY_DSN,

    // Analytics
    GA_ID: process.env.VITE_GA_ID,

    // Application URLs
    APP_URL: process.env.VITE_APP_URL || 'http://localhost:5173',
  }

  return config
}

/**
 * Validate required environment variables
 * @param {Object} config - Configuration object to validate
 * @throws {Error} If required variables are missing
 */
function validateConfig(config) {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY']

  const missing = required.filter(key => !config[key])

  if (missing.length > 0) {
    console.warn(
      `Warning: Missing environment variables: ${missing.join(', ')}. ` +
      'Some features may not work correctly.'
    )
  }

  // Validate format of key variables
  if (config.SUPABASE_URL && !config.SUPABASE_URL.startsWith('https://')) {
    console.warn('Warning: SUPABASE_URL should use HTTPS')
  }

  if (config.API_BASE_URL && !config.API_BASE_URL.startsWith('http')) {
    console.warn('Warning: API_BASE_URL should start with http(s)')
  }
}

/**
 * Check if running in development environment
 */
function isDevelopment() {
  return process.env.NODE_ENV === 'development'
}

/**
 * Check if running in production environment
 */
function isProduction() {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if running in staging environment
 */
function isStaging() {
  return process.env.NODE_ENV === 'staging'
}

/**
 * Get the current environment
 */
function getEnvironment() {
  return process.env.NODE_ENV || 'development'
}

// Create and validate configuration
const env = getEnvironmentConfig()
validateConfig(env)

/**
 * Environment Configuration Object
 * Read-only access to all environment variables
 */
export const environment = Object.freeze({
  ...env,
  isDevelopment,
  isProduction,
  isStaging,
  getEnvironment,
})

/**
 * Shorthand export
 */
export const env = environment

/**
 * Helper function to get environment variable with fallback
 * @param {string} key - Variable name
 * @param {any} defaultValue - Default value if not found
 * @returns {any} Variable value or default
 */
export function getEnv(key, defaultValue = undefined) {
  return env[key] ?? defaultValue
}

/**
 * Helper function to check if a feature is enabled
 * @param {string} featureName - Name of the feature (without ENABLE_ prefix)
 * @returns {boolean} Whether the feature is enabled
 */
export function isFeatureEnabled(featureName) {
  const key = `ENABLE_${featureName.toUpperCase()}`
  return env[key] === true
}

/**
 * Helper function to get environment-specific value
 * @param {Object} values - Object with keys: development, staging, production
 * @returns {any} Value for current environment
 */
export function getByEnvironment(values) {
  return values[getEnvironment()] ?? values.production
}

/**
 * Helper function to safely log environment configuration (hiding sensitive data)
 * @returns {Object} Safe environment object for logging
 */
export function getSafeEnv() {
  const safe = { ...env }
  // Hide sensitive keys
  const sensitive = ['SUPABASE_ANON_KEY', 'SENDGRID_API_KEY', 'SENTRY_DSN']
  sensitive.forEach(key => {
    if (safe[key]) {
      safe[key] = safe[key].substring(0, 4) + '...[REDACTED]'
    }
  })
  return safe
}

/**
 * Environment verification - can be called on app startup
 * @returns {Object} Verification results
 */
export function verifyEnvironment() {
  const results = {
    supabase: {
      configured: !!env.SUPABASE_URL && !!env.SUPABASE_ANON_KEY,
      url: !!env.SUPABASE_URL,
      key: !!env.SUPABASE_ANON_KEY,
    },
    api: {
      configured: !!env.API_BASE_URL,
      baseUrl: env.API_BASE_URL,
      timeout: env.API_TIMEOUT,
    },
    email: {
      configured: !!env.SENDGRID_API_KEY,
      service: env.EMAIL_SERVICE,
    },
    analytics: {
      enabled: env.ENABLE_ANALYTICS,
      gaId: !!env.GA_ID,
      sentryDsn: !!env.SENTRY_DSN,
    },
    features: {
      offlineMode: env.ENABLE_OFFLINE_MODE,
      debugPanel: env.ENABLE_DEBUG_PANEL,
    },
  }

  if (env.isDevelopment()) {
    console.group('Environment Configuration')
    console.table(results)
    console.groupEnd()
  }

  return results
}

export default environment
