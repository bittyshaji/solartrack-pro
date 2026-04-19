/**
 * Error Tracking Module for SolarTrack Pro
 * Integrates with Sentry (optional) and provides error categorization
 * Features: error categorization, stack trace parsing, user context, environment tracking
 */

/**
 * Error categories
 */
export const ERROR_CATEGORIES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTH: 'authentication',
  DATABASE: 'database',
  APP_ERROR: 'app_error',
  UNKNOWN: 'unknown'
}

/**
 * Error Tracking Class
 */
class ErrorTracking {
  constructor() {
    this.sentry = null
    this.sentryEnabled = false
    this.userContext = {}
    this.releaseVersion = this.getReleaseVersion()
    this.environment = process.env.NODE_ENV || 'development'
    this.initializeSentry()
  }

  /**
   * Get release version from environment or package
   */
  getReleaseVersion() {
    try {
      return import.meta.env.VITE_APP_VERSION || '0.1.0'
    } catch (e) {
      return '0.1.0'
    }
  }

  /**
   * Initialize Sentry if available and configured
   */
  initializeSentry() {
    // Check if Sentry SDK is available
    if (typeof window !== 'undefined' && window.Sentry) {
      try {
        const sentryDSN = import.meta.env.VITE_SENTRY_DSN
        if (sentryDSN) {
          this.sentry = window.Sentry
          this.sentryEnabled = true

          // Configure Sentry
          this.sentry.init({
            dsn: sentryDSN,
            environment: this.environment,
            release: this.releaseVersion,
            integrations: [
              this.sentry.replayIntegration()
            ],
            tracesSampleRate: 1.0,
            replaysSessionSampleRate: 0.1,
            replaysOnErrorSampleRate: 1.0
          })
        }
      } catch (e) {
        console.warn('Failed to initialize Sentry:', e.message)
        this.sentryEnabled = false
      }
    }
  }

  /**
   * Categorize error based on type and message
   * @param {Error} error - Error object
   * @returns {string} Error category
   */
  categorizeError(error) {
    if (!error) return ERROR_CATEGORIES.UNKNOWN

    const message = (error.message || '').toLowerCase()
    const stack = (error.stack || '').toLowerCase()

    // Network errors
    if (message.includes('network') ||
        message.includes('fetch') ||
        message.includes('timeout') ||
        message.includes('cors') ||
        error.name === 'NetworkError') {
      return ERROR_CATEGORIES.NETWORK
    }

    // Auth errors
    if (message.includes('auth') ||
        message.includes('401') ||
        message.includes('403') ||
        message.includes('unauthorized') ||
        message.includes('permission denied')) {
      return ERROR_CATEGORIES.AUTH
    }

    // Validation errors
    if (message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('required') ||
        error.name === 'ValidationError') {
      return ERROR_CATEGORIES.VALIDATION
    }

    // Database errors
    if (message.includes('database') ||
        message.includes('sql') ||
        message.includes('query') ||
        message.includes('constraint') ||
        stack.includes('supabase')) {
      return ERROR_CATEGORIES.DATABASE
    }

    // Application errors
    if (error.name === 'TypeError' ||
        error.name === 'ReferenceError' ||
        error.name === 'SyntaxError') {
      return ERROR_CATEGORIES.APP_ERROR
    }

    return ERROR_CATEGORIES.UNKNOWN
  }

  /**
   * Parse error stack trace
   * @param {Error} error - Error object
   * @returns {object} Parsed stack trace
   */
  parseStackTrace(error) {
    if (!error || !error.stack) {
      return {
        frames: [],
        message: error?.message || 'Unknown error',
        type: error?.name || 'Error'
      }
    }

    const lines = error.stack.split('\n')
    const frames = []

    // Skip the error message line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const match = line.match(/at\s+(?:(\w+)\s+)?\((.+):(\d+):(\d+)\)|at\s+(.+):(\d+):(\d+)/)
      if (match) {
        frames.push({
          function: match[1] || match[5] || 'anonymous',
          file: match[2] || match[5] || 'unknown',
          line: parseInt(match[3] || match[6], 10),
          column: parseInt(match[4] || match[7], 10)
        })
      }
    }

    return {
      frames,
      message: error.message,
      type: error.name
    }
  }

  /**
   * Set user context for error tracking
   * @param {string|object} userId - User ID or user object
   * @param {object} additionalData - Additional user data
   */
  setUserContext(userId, additionalData = {}) {
    this.userContext = {
      id: typeof userId === 'string' ? userId : userId.id,
      ...(typeof userId === 'object' && userId),
      ...additionalData
    }

    if (this.sentryEnabled && this.sentry) {
      this.sentry.setUser({
        id: this.userContext.id,
        email: this.userContext.email,
        username: this.userContext.username
      })
    }
  }

  /**
   * Clear user context
   */
  clearUserContext() {
    this.userContext = {}
    if (this.sentryEnabled && this.sentry) {
      this.sentry.setUser(null)
    }
  }

  /**
   * Add breadcrumb for error context
   * @param {string} message - Breadcrumb message
   * @param {object} data - Breadcrumb data
   * @param {string} level - Breadcrumb level
   */
  addBreadcrumb(message, data = {}, level = 'info') {
    if (this.sentryEnabled && this.sentry) {
      this.sentry.addBreadcrumb({
        message,
        level,
        data,
        timestamp: Date.now() / 1000
      })
    }
  }

  /**
   * Capture exception
   * @param {Error} error - Error to capture
   * @param {object} options - Capture options
   */
  captureException(error, options = {}) {
    const category = this.categorizeError(error)
    const stackTrace = this.parseStackTrace(error)

    const errorInfo = {
      message: error.message,
      category,
      stackTrace,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      ...options
    }

    // Add user context
    if (this.userContext.id) {
      errorInfo.userId = this.userContext.id
    }

    // Send to Sentry if enabled
    if (this.sentryEnabled && this.sentry) {
      this.sentry.captureException(error, {
        level: 'error',
        tags: {
          category,
          version: this.releaseVersion
        },
        extra: {
          stackTrace,
          ...options.extra
        },
        contexts: {
          error: errorInfo,
          ...options.contexts
        }
      })
    }

    return errorInfo
  }

  /**
   * Capture error message
   * @param {string} message - Error message
   * @param {object} options - Capture options
   */
  captureError(message, options = {}) {
    const errorInfo = {
      message,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : null,
      ...options
    }

    if (this.userContext.id) {
      errorInfo.userId = this.userContext.id
    }

    if (this.sentryEnabled && this.sentry) {
      this.sentry.captureMessage(message, {
        level: options.level || 'error',
        tags: {
          version: this.releaseVersion
        },
        extra: options.extra,
        contexts: {
          error: errorInfo,
          ...options.contexts
        }
      })
    }

    return errorInfo
  }

  /**
   * Capture warning
   * @param {string} message - Warning message
   * @param {object} options - Capture options
   */
  captureWarning(message, options = {}) {
    if (this.sentryEnabled && this.sentry) {
      this.sentry.captureMessage(message, {
        level: 'warning',
        tags: {
          version: this.releaseVersion
        },
        extra: options.extra
      })
    }
  }

  /**
   * Create error report
   * @param {Error} error - Error object
   * @param {object} context - Error context
   * @returns {object} Error report
   */
  createErrorReport(error, context = {}) {
    return {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      message: error.message,
      category: this.categorizeError(error),
      stackTrace: this.parseStackTrace(error),
      url: typeof window !== 'undefined' ? window.location.href : null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      userId: this.userContext.id,
      environment: this.environment,
      version: this.releaseVersion,
      context
    }
  }

  /**
   * Check if Sentry is enabled
   */
  isSentryEnabled() {
    return this.sentryEnabled
  }

  /**
   * Get Sentry instance
   */
  getSentry() {
    return this.sentry
  }
}

// Create and export singleton instance
export const errorTracking = new ErrorTracking()

export default errorTracking
