/**
 * Date Utilities
 * Functions for date manipulation, parsing, and formatting
 *
 * Usage:
 *   import { formatDate, addDays, getDateRange } from '@/utils/date'
 */

/**
 * Format date to string
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format pattern (default: 'DD/MM/YYYY')
 * @returns {string} Formatted date
 */
export function formatDate(date, format = 'DD/MM/YYYY') {
  const d = parseDate(date)
  if (!d) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  const second = String(d.getSeconds()).padStart(2, '0')

  const patterns = {
    'DD/MM/YYYY': `${day}/${month}/${year}`,
    'DD-MM-YYYY': `${day}-${month}-${year}`,
    'MM/DD/YYYY': `${month}/${day}/${year}`,
    'YYYY-MM-DD': `${year}-${month}-${day}`,
    'YYYY/MM/DD': `${year}/${month}/${day}`,
    'DD MMM YYYY': `${day} ${getMonthName(d.getMonth())} ${year}`,
    'DD MMMM YYYY': `${day} ${getFullMonthName(d.getMonth())} ${year}`,
    'MMM DD, YYYY': `${getMonthName(d.getMonth())} ${day}, ${year}`,
    'MMMM DD, YYYY': `${getFullMonthName(d.getMonth())} ${day}, ${year}`,
    'DD/MM/YYYY HH:mm': `${day}/${month}/${year} ${hour}:${minute}`,
    'DD/MM/YYYY HH:mm:ss': `${day}/${month}/${year} ${hour}:${minute}:${second}`,
  }

  return patterns[format] || patterns['DD/MM/YYYY']
}

/**
 * Format date as relative time (e.g., '2 hours ago')
 * @param {Date|string|number} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  const d = parseDate(date)
  if (!d) return ''

  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
  return `${years} year${years > 1 ? 's' : ''} ago`
}

/**
 * Parse date string or number to Date object
 * @param {Date|string|number} value - Date value to parse
 * @returns {Date|null} Parsed date or null
 */
export function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  const parsed = new Date(value)
  return isValidDate(parsed) ? parsed : null
}

/**
 * Check if date is valid
 * @param {Date|string|number} date - Date to validate
 * @returns {boolean} Whether date is valid
 */
export function isValidDate(date) {
  const d = parseDate(date)
  return d instanceof Date && !isNaN(d)
}

/**
 * Add days to date
 * @param {Date|string|number} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
export function addDays(date, days) {
  const d = parseDate(date)
  if (!d) return null
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Add months to date
 * @param {Date|string|number} date - Base date
 * @param {number} months - Number of months to add
 * @returns {Date} New date
 */
export function addMonths(date, months) {
  const d = parseDate(date)
  if (!d) return null
  d.setMonth(d.getMonth() + months)
  return d
}

/**
 * Add years to date
 * @param {Date|string|number} date - Base date
 * @param {number} years - Number of years to add
 * @returns {Date} New date
 */
export function addYears(date, years) {
  const d = parseDate(date)
  if (!d) return null
  d.setFullYear(d.getFullYear() + years)
  return d
}

/**
 * Get difference between two dates in days
 * @param {Date|string|number} date1 - First date
 * @param {Date|string|number} date2 - Second date
 * @returns {number} Difference in days
 */
export function getDaysDifference(date1, date2) {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  if (!d1 || !d2) return 0
  const diff = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Get start of day
 * @param {Date|string|number} date - Date to process
 * @returns {Date} Start of day
 */
export function getStartOfDay(date) {
  const d = parseDate(date)
  if (!d) return null
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of day
 * @param {Date|string|number} date - Date to process
 * @returns {Date} End of day
 */
export function getEndOfDay(date) {
  const d = parseDate(date)
  if (!d) return null
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Get start of month
 * @param {Date|string|number} date - Date to process
 * @returns {Date} Start of month
 */
export function getStartOfMonth(date) {
  const d = parseDate(date)
  if (!d) return null
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of month
 * @param {Date|string|number} date - Date to process
 * @returns {Date} End of month
 */
export function getEndOfMonth(date) {
  const d = parseDate(date)
  if (!d) return null
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Get start of year
 * @param {Date|string|number} date - Date to process
 * @returns {Date} Start of year
 */
export function getStartOfYear(date) {
  const d = parseDate(date)
  if (!d) return null
  d.setMonth(0, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of year
 * @param {Date|string|number} date - Date to process
 * @returns {Date} End of year
 */
export function getEndOfYear(date) {
  const d = parseDate(date)
  if (!d) return null
  d.setMonth(11, 31)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Get date range for preset
 * @param {string} preset - Preset name (today, lastWeek, lastMonth, etc.)
 * @returns {Object} Object with startDate and endDate
 */
export function getDateRange(preset) {
  const today = new Date()
  const ranges = {
    today: {
      startDate: getStartOfDay(today),
      endDate: getEndOfDay(today),
    },
    yesterday: {
      startDate: getStartOfDay(addDays(today, -1)),
      endDate: getEndOfDay(addDays(today, -1)),
    },
    last7days: {
      startDate: getStartOfDay(addDays(today, -6)),
      endDate: getEndOfDay(today),
    },
    last30days: {
      startDate: getStartOfDay(addDays(today, -29)),
      endDate: getEndOfDay(today),
    },
    thisMonth: {
      startDate: getStartOfMonth(today),
      endDate: getEndOfDay(today),
    },
    lastMonth: {
      startDate: getStartOfMonth(addMonths(today, -1)),
      endDate: getEndOfMonth(addMonths(today, -1)),
    },
    last3months: {
      startDate: getStartOfDay(addMonths(today, -3)),
      endDate: getEndOfDay(today),
    },
    thisYear: {
      startDate: getStartOfYear(today),
      endDate: getEndOfDay(today),
    },
    lastYear: {
      startDate: getStartOfYear(addYears(today, -1)),
      endDate: getEndOfYear(addYears(today, -1)),
    },
  }
  return ranges[preset] || { startDate: null, endDate: null }
}

/**
 * Get month name (short)
 * @param {number} monthIndex - Month index (0-11)
 * @returns {string} Month name (Jan, Feb, etc.)
 */
export function getMonthName(monthIndex) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[monthIndex] || ''
}

/**
 * Get full month name
 * @param {number} monthIndex - Month index (0-11)
 * @returns {string} Full month name
 */
export function getFullMonthName(monthIndex) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return months[monthIndex] || ''
}

/**
 * Get day name
 * @param {number} dayIndex - Day index (0-6, Sunday-Saturday)
 * @returns {string} Day name
 */
export function getDayName(dayIndex) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayIndex] || ''
}

/**
 * Get short day name
 * @param {number} dayIndex - Day index (0-6)
 * @returns {string} Short day name (Sun, Mon, etc.)
 */
export function getShortDayName(dayIndex) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[dayIndex] || ''
}

/**
 * Check if date is today
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} Whether date is today
 */
export function isToday(date) {
  const d = parseDate(date)
  const today = new Date()
  return d && d.toDateString() === today.toDateString()
}

/**
 * Check if date is in the past
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} Whether date is in the past
 */
export function isPast(date) {
  const d = parseDate(date)
  return d && d < new Date()
}

/**
 * Check if date is in the future
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} Whether date is in the future
 */
export function isFuture(date) {
  const d = parseDate(date)
  return d && d > new Date()
}

/**
 * Check if date is between two dates
 * @param {Date|string|number} date - Date to check
 * @param {Date|string|number} startDate - Start date
 * @param {Date|string|number} endDate - End date
 * @returns {boolean} Whether date is between start and end
 */
export function isBetween(date, startDate, endDate) {
  const d = parseDate(date)
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  return d && start && end && d >= start && d <= end
}

/**
 * Get ISO string for date
 * @param {Date|string|number} date - Date to convert
 * @returns {string} ISO string
 */
export function toISOString(date) {
  const d = parseDate(date)
  return d ? d.toISOString() : ''
}

/**
 * Convert date to local date string
 * @param {Date|string|number} date - Date to convert
 * @returns {string} Local date string
 */
export function toLocaleDateString(date) {
  const d = parseDate(date)
  return d ? d.toLocaleDateString('en-IN') : ''
}

/**
 * Convert date to local time string
 * @param {Date|string|number} date - Date to convert
 * @returns {string} Local time string
 */
export function toLocaleTimeString(date) {
  const d = parseDate(date)
  return d ? d.toLocaleTimeString('en-IN') : ''
}

/**
 * Get age from birth date
 * @param {Date|string|number} birthDate - Birth date
 * @returns {number} Age in years
 */
export function getAge(birthDate) {
  const d = parseDate(birthDate)
  if (!d) return 0
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const monthDiff = today.getMonth() - d.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d.getDate())) {
    age--
  }
  return age
}
