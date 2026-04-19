/**
 * Logger Module for SolarTrack Pro
 * Provides structured, production-safe logging with sensitive data redaction
 * Features: log levels, context tracking, Sentry integration, local storage
 */

import { logStorage } from './storage/logStorage.js'
import { errorTracking } from './errorTracking.js'

/**
 * Log levels configuration
 */
export const LOG_LEVELS = {
  DEBUG: { level: 0, name: 'DEBUG', color: '#7F8B8F' },
  INFO: { level: 1, name: 'INFO', color: '#1E90FF' },
  WARN: { level: 2, name: 'WARN', color: '#FFA500' },
  ERROR: { level: 3, name: 'ERROR', color: '#FF4444' }
}

/**
 * Patterns for sensitive data redaction
 */
const SENSITIVE_PATTERNS = [
  { pattern: /password\s*[=:]\s*["']?([^"'\s,}]+)/gi, replacement: 'password=[REDACTED]' },
  { pattern: /token\s*[=:]\s*["']?([^"'\s,}]+)/gi, replacement: 'token=[REDACTED]' },
  { pattern: /apikey\s*[=:]\s*["']?([^"'\s,}]+)/gi, replacement: 'apikey=[REDACTED]' },
  { pattern: /api_key\s*[=:]\s*["']?([^"'\s,}]+)/gi, replacement: 'api_key=[REDACTED]' },
  { pattern: /secret\s*[=:]\s*["']?([^"'\s,}]+)/gi, replacement: 'secret=[REDACTED]' },
  { pattern: /bearer\s+[a-zA-Z0-9._\-]+/gi, replacement: 'bearer [REDACTED]' },
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD_REDACTED]' },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
  { pattern: /"password"\s*:\s*"[^"]+"/gi, replacement: '"password":"[REDACTED]"' },
  { pattern: /"token"\s*:\s*"[^"]+"/gi, replacement: '"token":"[REDACTED]"' },
  { pattern: /"apiKey"\s*:\s*"[^"]+"/gi, replacement: '"apiKey":"[REDACTED]"' }
]

/**
 * Logger Class
 * Central logging system with multiple output targets
 */
class Logger {
  constructor() {
    this.currentLevel = LOG_LEVELS.INFO
    this.context = {}
    this.isDevelopment = process.env.NODE_ENV !== 'production'
    this.isProduction = process.env.NODE_ENV === 'production'
    this.appVersion = this.getAppVersion()
    this.userId = null
    this.sessionId = this.generateSessionId()
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get app version from package.json
   */
  getAppVersion() {
    try {
      // In a real app, this would be injected at build time
      return import.meta.env.VITE_APP_VERSION || '0.1.0'
    } catch (e) {
      return '0.1.0'
    }
  }

  /**
   * Set the logging level
   * @param {string} level - Log level name (DEBUG, INFO, WARN, ERROR)
   */
  setLevel(level) {
    const logLevel = LOG_LEVELS[level]
    if (logLevel) {
      this.currentLevel = logLevel
    }
  }

  /**
   * Set global context for all logs
   * @param {object} context - Context object (user, url, feature, etc.)
   */
  setContext(context) {
    this.context = {
      ...this.context,
      ...context
    }
    if (context.userId) {
      this.userId = context.userId
      errorTracking.setUserContext(context.userId)
    }
  }

  /**
   * Clear context
   */
  clearContext() {
    this.context = {}
    this.userId = null
  }

  /**
   * Get current context
   */
  getContext() {
    return {
      ...this.context,
      sessionId: this.sessionId,
      version: this.appVersion,
      timestamp: new Date().toISOString(),
      environment: this.isProduction ? 'production' : 'development'
    }
  }

  /**
   * Redact sensitive data from strings and objects
   * @param {any} data - Data to redact
   * @returns {any} Redacted data
   */
  redactSensitiveData(data) {
    if (typeof data === 'string') {
      let redacted = data
      for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
        redacted = redacted.replace(pattern, replacement)
      }
      return redacted
    }

    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map(item => this.redactSensitiveData(item))
      }

      const redacted = {}
      for (const [key, value] of Object.entries(data)) {
        // Check if key itself is sensitive
        if (/password|token|secret|apikey|api_key|credential/i.test(key)) {
          redacted[key] = '[REDACTED]'
        } else {
          redacted[key] = this.redactSensitiveData(value)
        }
      }
      return redacted
    }

    return data
  }

  /**
   * Format log output with color coding
   * @param {string} level - Log level name
   * @param {string} message - Log message
   * @param {object} context - Log context
   * @returns {object} Formatted log entry
   */
  formatLog(level, message, context) {
    const logLevel = LOG_LEVELS[level]
    const timestamp = new Date().toISOString()

    return {
      timestamp,
      level: logLevel.name,
      message,
      context: {
        ...this.getContext(),
        ...context
      },
      sessionId: this.sessionId
    }
  }

  /**
   * Output log to console
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {object} data - Log data
   */
  outputToConsole(level, message, data) {
    const logLevel = LOG_LEVELS[level]
    const timestamp = new Date().toISOString()

    if (this.isDevelopment) {
      const style = `color: ${logLevel.color}; font-weight: bold;`
      console.log(
        `%c[${timestamp}] ${logLevel.name}:`,
        style,
        message,
        data
      )
    } else {
      // Minimal console output in production
      const consoleFn = level === 'ERROR' || level === 'WARN' ? console[level.toLowerCase()] : console.log
      consoleFn(`[${logLevel.name}] ${message}`, data)
    }
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {object} data - Additional data
   * @param {object} context - Log context
   */
  debug(message, data = {}, context = {}) {
    if (this.currentLevel.level > LOG_LEVELS.DEBUG.level) return

    const redactedData = this.redactSensitiveData(data)
    this.outputToConsole('DEBUG', message, redactedData)
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {object} data - Additional data
   * @param {object} context - Log context
   */
  info(message, data = {}, context = {}) {
    if (this.currentLevel.level > LOG_LEVELS.INFO.level) return

    const redactedData = this.redactSensitiveData(data)
    this.outputToConsole('INFO', message, redactedData)
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {object} data - Additional data
   * @param {object} context - Log context
   */
  warn(message, data = {}, context = {}) {
    if (this.currentLevel.level > LOG_LEVELS.WARN.level) return

    const redactedData = this.redactSensitiveData(data)
    this.outputToConsole('WARN', message, redactedData)

    const logEntry = this.formatLog('WARN', message, { ...context, data: redactedData })
    logStorage.addLog(logEntry)
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {object} data - Additional data
   * @param {object} context - Log context
   */
  error(message, data = {}, context = {}) {
    const redactedData = this.redactSensitiveData(data)
    this.outputToConsole('ERROR', message, redactedData)

    const logEntry = this.formatLog('ERROR', message, { ...context, data: redactedData })

    // Store locally
    logStorage.addLog(logEntry)

    // Send to Sentry if available
    if (this.isProduction) {
      errorTracking.captureError(logEntry.message, {
        level: 'error',
        extra: redactedData,
        contexts: logEntry.context
      })
    }
  }

  /**
   * Log with exception handling
   * @param {Error} error - Error object
   * @param {object} context - Error context
   */
  exception(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name
    }

    const logEntry = this.formatLog('ERROR', error.message, { ...context, error: errorData })

    // Store locally
    logStorage.addLog(logEntry)

    // Send to Sentry
    errorTracking.captureException(error, {
      extra: context,
      contexts: logEntry.context
    })

    this.outputToConsole('ERROR', error.message, error)
  }

  /**
   * Create a child logger with additional context
   * @param {object} context - Additional context
   * @returns {Logger} Child logger instance
   */
  child(context = {}) {
    const child = Object.create(this)
    child.context = {
      ...this.context,
      ...context
    }
    return child
  }

  /**
   * Export logs as JSON
   * @returns {Array} Array of log entries
   */
  exportLogs() {
    return logStorage.exportLogs()
  }

  /**
   * Clear logs
   */
  clearLogs() {
    logStorage.clearLogs()
  }

  /**
   * Get log statistics
   * @returns {object} Log statistics
   */
  getStats() {
    return logStorage.getStats()
  }
}

// Create and export singleton instance
export const logger = new Logger()

// Set initial log level based on environment
if (process.env.NODE_ENV === 'production') {
  logger.setLevel('INFO')
} else {
  logger.setLevel('DEBUG')
}

export default logger
