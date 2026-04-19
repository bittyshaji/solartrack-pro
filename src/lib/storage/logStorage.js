/**
 * Log Storage Module for SolarTrack Pro
 * Handles local storage of error logs with rotation policy
 * Features: automatic cleanup, log export, storage limits
 */

const STORAGE_KEY = 'solartrack_logs'
const MAX_LOGS = 50
const LOG_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Log Storage Class
 */
class LogStorage {
  constructor() {
    this.maxLogs = MAX_LOGS
    this.logExpiry = LOG_EXPIRY_MS
    this.initializeStorage()
  }

  /**
   * Initialize storage, clean up old logs
   */
  initializeStorage() {
    this.cleanup()
  }

  /**
   * Get all logs from storage
   * @returns {Array} Array of log entries
   */
  getLogs() {
    try {
      if (typeof localStorage === 'undefined') {
        return []
      }

      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) {
        return []
      }

      const logs = JSON.parse(data)
      return Array.isArray(logs) ? logs : []
    } catch (e) {
      console.error('Error reading logs from storage:', e)
      return []
    }
  }

  /**
   * Add a new log entry
   * @param {object} logEntry - Log entry to add
   */
  addLog(logEntry) {
    try {
      if (typeof localStorage === 'undefined') {
        return
      }

      // Only store WARN and ERROR level logs
      if (!logEntry.level || !['WARN', 'ERROR'].includes(logEntry.level)) {
        return
      }

      const logs = this.getLogs()

      // Add new log entry
      const newLog = {
        ...logEntry,
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        storedAt: new Date().toISOString()
      }

      logs.push(newLog)

      // Apply rotation policy (keep only latest MAX_LOGS)
      if (logs.length > this.maxLogs) {
        logs.splice(0, logs.length - this.maxLogs)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
    } catch (e) {
      // Silently fail if storage is full or unavailable
      console.warn('Failed to store log:', e.message)
    }
  }

  /**
   * Remove expired logs
   */
  cleanup() {
    try {
      if (typeof localStorage === 'undefined') {
        return
      }

      const logs = this.getLogs()
      const now = Date.now()
      const validLogs = logs.filter(log => {
        const logTime = new Date(log.storedAt || log.timestamp).getTime()
        return (now - logTime) < this.logExpiry
      })

      if (validLogs.length < logs.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validLogs))
      }
    } catch (e) {
      console.error('Error during log cleanup:', e)
    }
  }

  /**
   * Export all logs as JSON
   * @returns {Array} Array of log entries
   */
  exportLogs() {
    this.cleanup()
    return this.getLogs()
  }

  /**
   * Export logs as CSV string
   * @returns {string} CSV formatted logs
   */
  exportAsCSV() {
    const logs = this.exportLogs()

    if (logs.length === 0) {
      return ''
    }

    // CSV Headers
    const headers = [
      'timestamp',
      'id',
      'level',
      'message',
      'userId',
      'feature',
      'url',
      'errorType',
      'errorMessage'
    ]

    // CSV Rows
    const rows = logs.map(log => [
      log.timestamp || '',
      log.id || '',
      log.level || '',
      this.escapeCsv(log.message || ''),
      log.context?.userId || '',
      log.context?.feature || '',
      log.context?.url || '',
      log.context?.data?.name || '',
      log.context?.data?.message || ''
    ])

    // Combine
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => this.escapeCsv(cell)).join(','))
    ].join('\n')

    return csv
  }

  /**
   * Escape CSV special characters
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  escapeCsv(str) {
    if (!str) return ''
    str = String(str)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  /**
   * Export logs as JSON file
   * @returns {Blob} Blob of JSON data
   */
  exportAsJSON() {
    const logs = this.exportLogs()
    const jsonString = JSON.stringify(logs, null, 2)
    return new Blob([jsonString], { type: 'application/json' })
  }

  /**
   * Download logs to user's computer
   * @param {string} format - Format: 'json' or 'csv'
   */
  downloadLogs(format = 'json') {
    try {
      let content, filename, type

      if (format === 'csv') {
        content = this.exportAsCSV()
        filename = `solartrack-logs-${new Date().toISOString().split('T')[0]}.csv`
        type = 'text/csv'
      } else {
        content = this.exportAsJSON()
        filename = `solartrack-logs-${new Date().toISOString().split('T')[0]}.json`
        type = 'application/json'
      }

      const blob = format === 'csv'
        ? new Blob([content], { type })
        : content

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Error downloading logs:', e)
    }
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    try {
      if (typeof localStorage === 'undefined') {
        return
      }

      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {
      console.error('Error clearing logs:', e)
    }
  }

  /**
   * Get log statistics
   * @returns {object} Log statistics
   */
  getStats() {
    const logs = this.getLogs()

    const stats = {
      totalLogs: logs.length,
      errors: 0,
      warnings: 0,
      byFeature: {},
      byUser: {},
      oldestLog: null,
      newestLog: null,
      storageSize: this.getStorageSize()
    }

    logs.forEach(log => {
      // Count by level
      if (log.level === 'ERROR') stats.errors++
      if (log.level === 'WARN') stats.warnings++

      // Count by feature
      const feature = log.context?.feature || 'unknown'
      stats.byFeature[feature] = (stats.byFeature[feature] || 0) + 1

      // Count by user
      const userId = log.context?.userId || 'anonymous'
      stats.byUser[userId] = (stats.byUser[userId] || 0) + 1

      // Track oldest/newest
      if (!stats.oldestLog || new Date(log.timestamp) < new Date(stats.oldestLog.timestamp)) {
        stats.oldestLog = log
      }
      if (!stats.newestLog || new Date(log.timestamp) > new Date(stats.newestLog.timestamp)) {
        stats.newestLog = log
      }
    })

    return stats
  }

  /**
   * Get approximate storage size in bytes
   * @returns {number} Size in bytes
   */
  getStorageSize() {
    try {
      if (typeof localStorage === 'undefined') {
        return 0
      }

      const data = localStorage.getItem(STORAGE_KEY)
      return data ? data.length : 0
    } catch (e) {
      return 0
    }
  }

  /**
   * Query logs by filter
   * @param {object} filters - Filter options
   * @returns {Array} Filtered logs
   */
  queryLogs(filters = {}) {
    let logs = this.getLogs()

    if (filters.level) {
      logs = logs.filter(log => log.level === filters.level)
    }

    if (filters.userId) {
      logs = logs.filter(log => log.context?.userId === filters.userId)
    }

    if (filters.feature) {
      logs = logs.filter(log => log.context?.feature === filters.feature)
    }

    if (filters.startDate) {
      const startTime = new Date(filters.startDate).getTime()
      logs = logs.filter(log => new Date(log.timestamp).getTime() >= startTime)
    }

    if (filters.endDate) {
      const endTime = new Date(filters.endDate).getTime()
      logs = logs.filter(log => new Date(log.timestamp).getTime() <= endTime)
    }

    if (filters.search) {
      const search = filters.search.toLowerCase()
      logs = logs.filter(log =>
        log.message.toLowerCase().includes(search) ||
        JSON.stringify(log.context).toLowerCase().includes(search)
      )
    }

    return logs
  }

  /**
   * Set max logs before rotation
   * @param {number} max - Maximum number of logs
   */
  setMaxLogs(max) {
    this.maxLogs = max
  }

  /**
   * Set log expiry time
   * @param {number} ms - Expiry time in milliseconds
   */
  setLogExpiry(ms) {
    this.logExpiry = ms
  }
}

// Create and export singleton instance
export const logStorage = new LogStorage()

export default logStorage
