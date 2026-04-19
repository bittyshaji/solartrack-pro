/**
 * Logger Tests for SolarTrack Pro
 * Tests logging functionality, error tracking, sensitive data redaction, and storage
 */

import { logger, LOG_LEVELS } from './logger.js'
import { errorTracking, ERROR_CATEGORIES } from './errorTracking.js'
import { logStorage } from './storage/logStorage.js'

/**
 * Test Suite Setup
 */
describe('SolarTrack Pro Logger System', () => {
  beforeEach(() => {
    // Clear logs before each test
    logStorage.clearLogs()
    logger.clearContext()
  })

  /**
   * ==================== LOGGER TESTS ====================
   */
  describe('Logger Class', () => {
    test('should create logger instance with default settings', () => {
      expect(logger).toBeDefined()
      expect(logger.currentLevel).toBeDefined()
      expect(logger.sessionId).toBeDefined()
    })

    test('should set and get log level', () => {
      logger.setLevel('DEBUG')
      expect(logger.currentLevel.name).toBe('DEBUG')

      logger.setLevel('ERROR')
      expect(logger.currentLevel.name).toBe('ERROR')
    })

    test('should set and get context', () => {
      const context = { userId: 'user123', feature: 'dashboard' }
      logger.setContext(context)

      const retrievedContext = logger.getContext()
      expect(retrievedContext.userId).toBe('user123')
      expect(retrievedContext.feature).toBe('dashboard')
      expect(retrievedContext.sessionId).toBe(logger.sessionId)
    })

    test('should merge multiple context calls', () => {
      logger.setContext({ userId: 'user123' })
      logger.setContext({ feature: 'dashboard' })

      const context = logger.getContext()
      expect(context.userId).toBe('user123')
      expect(context.feature).toBe('dashboard')
    })

    test('should clear context', () => {
      logger.setContext({ userId: 'user123' })
      logger.clearContext()

      expect(logger.context).toEqual({})
      expect(logger.userId).toBeNull()
    })
  })

  /**
   * ==================== SENSITIVE DATA REDACTION TESTS ====================
   */
  describe('Sensitive Data Redaction', () => {
    test('should redact passwords from strings', () => {
      const data = 'password="mySecurePass123"'
      const redacted = logger.redactSensitiveData(data)

      expect(redacted).not.toContain('mySecurePass123')
      expect(redacted).toContain('[REDACTED]')
    })

    test('should redact API keys from strings', () => {
      const data = 'apiKey="sk_live_abc123xyz"'
      const redacted = logger.redactSensitiveData(data)

      expect(redacted).not.toContain('sk_live_abc123xyz')
      expect(redacted).toContain('[REDACTED]')
    })

    test('should redact tokens from strings', () => {
      const data = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
      const redacted = logger.redactSensitiveData(data)

      expect(redacted).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')
      expect(redacted).toContain('[REDACTED]')
    })

    test('should redact credit card numbers', () => {
      const data = '4111-1111-1111-1111'
      const redacted = logger.redactSensitiveData(data)

      expect(redacted).not.toContain('4111-1111-1111-1111')
      expect(redacted).toContain('[CARD_REDACTED]')
    })

    test('should redact SSN', () => {
      const data = '123-45-6789'
      const redacted = logger.redactSensitiveData(data)

      expect(redacted).not.toContain('123-45-6789')
      expect(redacted).toContain('[SSN_REDACTED]')
    })

    test('should redact sensitive fields in objects', () => {
      const data = {
        username: 'john_doe',
        password: 'secretPass123',
        apiKey: 'sk_live_abc123',
        email: 'john@example.com'
      }

      const redacted = logger.redactSensitiveData(data)

      expect(redacted.password).toBe('[REDACTED]')
      expect(redacted.apiKey).toBe('[REDACTED]')
      expect(redacted.username).toBe('john_doe')
      expect(redacted.email).toBe('john@example.com')
    })

    test('should redact sensitive fields in nested objects', () => {
      const data = {
        user: {
          name: 'John Doe',
          credentials: {
            password: 'secret123',
            token: 'abc123xyz'
          }
        }
      }

      const redacted = logger.redactSensitiveData(data)

      expect(redacted.user.credentials.password).toBe('[REDACTED]')
      expect(redacted.user.credentials.token).toBe('[REDACTED]')
      expect(redacted.user.name).toBe('John Doe')
    })

    test('should redact sensitive fields in arrays', () => {
      const data = [
        { apiKey: 'key1' },
        { password: 'pass1' },
        { token: 'token1' }
      ]

      const redacted = logger.redactSensitiveData(data)

      expect(redacted[0].apiKey).toBe('[REDACTED]')
      expect(redacted[1].password).toBe('[REDACTED]')
      expect(redacted[2].token).toBe('[REDACTED]')
    })
  })

  /**
   * ==================== LOGGING METHODS TESTS ====================
   */
  describe('Logging Methods', () => {
    test('should log debug messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      logger.setLevel('DEBUG')
      logger.debug('Debug message', { key: 'value' })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    test('should log info messages', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      logger.setLevel('INFO')
      logger.info('Info message', { key: 'value' })

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    test('should log warning messages', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      logger.warn('Warning message', { key: 'value' })

      expect(consoleSpy).toHaveBeenCalled()
      expect(logStorage.getLogs().length).toBeGreaterThan(0)
      consoleSpy.mockRestore()
    })

    test('should log error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      logger.error('Error message', { key: 'value' })

      expect(consoleSpy).toHaveBeenCalled()
      expect(logStorage.getLogs().length).toBeGreaterThan(0)
      consoleSpy.mockRestore()
    })

    test('should respect log level filtering', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      logger.setLevel('ERROR')
      logger.debug('This should not appear')

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  /**
   * ==================== ERROR TRACKING TESTS ====================
   */
  describe('Error Tracking', () => {
    test('should categorize network errors', () => {
      const error = new Error('Network timeout')
      const category = errorTracking.categorizeError(error)

      expect(category).toBe(ERROR_CATEGORIES.NETWORK)
    })

    test('should categorize auth errors', () => {
      const error = new Error('Unauthorized (401)')
      const category = errorTracking.categorizeError(error)

      expect(category).toBe(ERROR_CATEGORIES.AUTH)
    })

    test('should categorize validation errors', () => {
      const error = new Error('Validation failed: email required')
      const category = errorTracking.categorizeError(error)

      expect(category).toBe(ERROR_CATEGORIES.VALIDATION)
    })

    test('should categorize database errors', () => {
      const error = new Error('Database query constraint violation')
      const category = errorTracking.categorizeError(error)

      expect(category).toBe(ERROR_CATEGORIES.DATABASE)
    })

    test('should parse error stack trace', () => {
      try {
        throw new Error('Test error')
      } catch (error) {
        const stackTrace = errorTracking.parseStackTrace(error)

        expect(stackTrace).toBeDefined()
        expect(stackTrace.message).toBe('Test error')
        expect(stackTrace.type).toBe('Error')
        expect(Array.isArray(stackTrace.frames)).toBe(true)
      }
    })

    test('should set and clear user context', () => {
      errorTracking.setUserContext('user123', { email: 'user@example.com' })

      expect(errorTracking.userContext.id).toBe('user123')
      expect(errorTracking.userContext.email).toBe('user@example.com')

      errorTracking.clearUserContext()
      expect(errorTracking.userContext).toEqual({})
    })

    test('should create error report', () => {
      const error = new Error('Test error')
      const report = errorTracking.createErrorReport(error, { feature: 'dashboard' })

      expect(report).toBeDefined()
      expect(report.id).toBeDefined()
      expect(report.message).toBe('Test error')
      expect(report.timestamp).toBeDefined()
      expect(report.context.feature).toBe('dashboard')
    })
  })

  /**
   * ==================== LOG STORAGE TESTS ====================
   */
  describe('Log Storage', () => {
    test('should add logs to storage', () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Test error',
        context: { userId: 'user123' }
      }

      logStorage.addLog(logEntry)

      const logs = logStorage.getLogs()
      expect(logs.length).toBeGreaterThan(0)
    })

    test('should only store WARN and ERROR logs', () => {
      logStorage.addLog({ level: 'DEBUG', message: 'Debug' })
      logStorage.addLog({ level: 'INFO', message: 'Info' })
      logStorage.addLog({ level: 'WARN', message: 'Warn' })
      logStorage.addLog({ level: 'ERROR', message: 'Error' })

      const logs = logStorage.getLogs()
      const levels = logs.map(log => log.level)

      expect(levels).toContain('WARN')
      expect(levels).toContain('ERROR')
      expect(levels).not.toContain('DEBUG')
      expect(levels).not.toContain('INFO')
    })

    test('should enforce max log limit', () => {
      logStorage.setMaxLogs(5)

      for (let i = 0; i < 10; i++) {
        logStorage.addLog({
          timestamp: new Date().toISOString(),
          level: 'ERROR',
          message: `Error ${i}`
        })
      }

      const logs = logStorage.getLogs()
      expect(logs.length).toBeLessThanOrEqual(5)
    })

    test('should query logs by level', () => {
      logStorage.addLog({ level: 'ERROR', message: 'Error 1' })
      logStorage.addLog({ level: 'WARN', message: 'Warn 1' })
      logStorage.addLog({ level: 'ERROR', message: 'Error 2' })

      const errors = logStorage.queryLogs({ level: 'ERROR' })
      expect(errors.every(log => log.level === 'ERROR')).toBe(true)
    })

    test('should query logs by userId', () => {
      logStorage.addLog({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Error 1',
        context: { userId: 'user1' }
      })

      logStorage.addLog({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Error 2',
        context: { userId: 'user2' }
      })

      const user1Logs = logStorage.queryLogs({ userId: 'user1' })
      expect(user1Logs.every(log => log.context.userId === 'user1')).toBe(true)
    })

    test('should export logs as JSON', () => {
      logStorage.addLog({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Test error'
      })

      const logs = logStorage.exportLogs()
      expect(Array.isArray(logs)).toBe(true)
      expect(logs.length).toBeGreaterThan(0)
    })

    test('should export logs as CSV', () => {
      logStorage.addLog({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message: 'Test error',
        context: { userId: 'user123' }
      })

      const csv = logStorage.exportAsCSV()
      expect(csv).toContain('timestamp')
      expect(csv).toContain('ERROR')
      expect(csv).toContain('Test error')
    })

    test('should get log statistics', () => {
      logStorage.addLog({ level: 'ERROR', message: 'Error 1', context: { feature: 'dashboard' } })
      logStorage.addLog({ level: 'WARN', message: 'Warn 1', context: { feature: 'dashboard' } })
      logStorage.addLog({ level: 'ERROR', message: 'Error 2', context: { feature: 'projects' } })

      const stats = logStorage.getStats()

      expect(stats.totalLogs).toBe(3)
      expect(stats.errors).toBe(2)
      expect(stats.warnings).toBe(1)
      expect(stats.byFeature.dashboard).toBe(2)
      expect(stats.byFeature.projects).toBe(1)
    })

    test('should clear logs', () => {
      logStorage.addLog({ level: 'ERROR', message: 'Test error' })
      expect(logStorage.getLogs().length).toBeGreaterThan(0)

      logStorage.clearLogs()
      expect(logStorage.getLogs().length).toBe(0)
    })
  })

  /**
   * ==================== INTEGRATION TESTS ====================
   */
  describe('Logger Integration', () => {
    test('should log with context and store in local storage', () => {
      logger.setContext({ userId: 'user123', feature: 'dashboard' })
      logger.error('Integration test error', { errorCode: 'TEST_001' })

      const logs = logStorage.getLogs()
      expect(logs.length).toBeGreaterThan(0)

      const lastLog = logs[logs.length - 1]
      expect(lastLog.context.userId).toBe('user123')
      expect(lastLog.context.feature).toBe('dashboard')
    })

    test('should create child logger with additional context', () => {
      logger.setContext({ userId: 'user123' })
      const child = logger.child({ feature: 'dashboard' })

      expect(child.context.userId).toBe('user123')
      expect(child.context.feature).toBe('dashboard')
    })

    test('should export logs with proper structure', () => {
      logger.setContext({ userId: 'user123' })
      logger.error('Test error', { errorCode: 'TEST_001' })

      const exported = logger.exportLogs()

      expect(Array.isArray(exported)).toBe(true)
      expect(exported.length).toBeGreaterThan(0)

      const log = exported[0]
      expect(log.message).toBeDefined()
      expect(log.level).toBeDefined()
      expect(log.context).toBeDefined()
      expect(log.timestamp).toBeDefined()
    })
  })

  /**
   * ==================== PERFORMANCE TESTS ====================
   */
  describe('Performance', () => {
    test('should handle high volume of logs without significant slowdown', () => {
      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        logger.warn(`Warning ${i}`, { iteration: i })
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // Should complete in reasonable time (less than 1 second for 100 logs)
      expect(duration).toBeLessThan(1000)
    })

    test('should efficiently redact sensitive data', () => {
      const largeData = {
        users: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          email: `user${i}@example.com`,
          password: `password${i}`,
          apiKey: `key${i}`,
          token: `token${i}`
        }))
      }

      const startTime = performance.now()
      const redacted = logger.redactSensitiveData(largeData)
      const endTime = performance.now()

      const duration = endTime - startTime
      expect(duration).toBeLessThan(500)

      // Verify all passwords are redacted
      expect(JSON.stringify(redacted)).not.toContain('password0')
    })
  })
})
