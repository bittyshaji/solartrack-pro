/**
 * Formatting Utilities
 * Functions for formatting numbers, dates, strings, and other data types
 *
 * Usage:
 *   import { formatCurrency, formatDate, formatPhone } from '@/utils/formatting'
 */

/**
 * Format number as currency
 * @param {number} value - Value to format
 * @param {string} currency - Currency code (default: INR)
 * @param {number} decimals - Number of decimals (default: 2)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'INR', decimals = 2) {
  if (value === null || value === undefined) return '₹0.00'
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
  return formatted
}

/**
 * Format number as percentage
 * @param {number} value - Value to format (e.g., 0.85 for 85%)
 * @param {number} decimals - Number of decimals (default: 1)
 * @returns {string} Formatted percentage string
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined) return '0%'
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * Format large numbers with K, M, B suffix
 * @param {number} value - Value to format
 * @param {number} decimals - Number of decimals
 * @returns {string} Formatted number
 */
export function formatCompactNumber(value, decimals = 1) {
  if (value === null || value === undefined) return '0'
  const suffixes = ['', 'K', 'M', 'B', 'T']
  let index = 0
  let num = Math.abs(value)

  while (num >= 1000 && index < suffixes.length - 1) {
    num /= 1000
    index++
  }

  const sign = value < 0 ? '-' : ''
  return `${sign}${num.toFixed(decimals)}${suffixes[index]}`
}

/**
 * Format number with thousand separators
 * @param {number} value - Value to format
 * @param {string} separator - Separator to use (default: ',')
 * @returns {string} Formatted number
 */
export function formatNumber(value, separator = ',') {
  if (value === null || value === undefined) return '0'
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator)
}

/**
 * Format phone number
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export function formatPhone(phone) {
  if (!phone) return ''
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  // Format as +91-XXXXX-XXXXX or similar
  if (cleaned.length >= 10) {
    return `+91-${cleaned.slice(-10, -5)}-${cleaned.slice(-5)}`
  }
  return phone
}

/**
 * Format string as email (validate basic format)
 * @param {string} email - Email to format
 * @returns {string} Lowercase email
 */
export function formatEmail(email) {
  return email ? email.toLowerCase().trim() : ''
}

/**
 * Truncate string
 * @param {string} str - String to truncate
 * @param {number} length - Max length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
export function truncate(str, length, suffix = '...') {
  if (!str || str.length <= length) return str
  return str.substring(0, length - suffix.length) + suffix
}

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Convert to title case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
export function titleCase(str) {
  if (!str) return ''
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1))
}

/**
 * Convert to sentence case
 * @param {string} str - String to convert
 * @returns {string} Sentence case string
 */
export function sentenceCase(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert to kebab case
 * @param {string} str - String to convert
 * @returns {string} Kebab case string
 */
export function kebabCase(str) {
  if (!str) return ''
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * Convert to snake case
 * @param {string} str - String to convert
 * @returns {string} Snake case string
 */
export function snakeCase(str) {
  if (!str) return ''
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1_$2')
    .toLowerCase()
}

/**
 * Convert to camel case
 * @param {string} str - String to convert
 * @returns {string} Camel case string
 */
export function camelCase(str) {
  if (!str) return ''
  return str
    .replace(/[-_\s](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, c => c.toLowerCase())
}

/**
 * Pluralize word
 * @param {string} word - Word to pluralize
 * @param {number} count - Count to determine plurality
 * @returns {string} Singular or plural word
 */
export function pluralize(word, count) {
  if (count === 1) return word
  // Simple pluralization - can be enhanced with library
  return word.endsWith('y') ? word.slice(0, -1) + 'ies' : word + 's'
}

/**
 * Format bytes to human readable size
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimals
 * @returns {string} Formatted size
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Format duration in milliseconds
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted duration (e.g., '2h 30m')
 */
export function formatDuration(ms) {
  if (ms < 0) return ''
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

/**
 * Format time remaining
 * @param {number} ms - Milliseconds remaining
 * @returns {string} Formatted time (e.g., '2h 30m remaining')
 */
export function formatTimeRemaining(ms) {
  return formatDuration(ms) + ' remaining'
}

/**
 * Format array as readable string
 * @param {Array} arr - Array to format
 * @param {string} separator - Separator (default: ', ')
 * @param {string} lastSeparator - Last separator (default: ', ')
 * @returns {string} Formatted string
 */
export function formatList(arr, separator = ', ', lastSeparator = ' and ') {
  if (!Array.isArray(arr)) return ''
  if (arr.length === 0) return ''
  if (arr.length === 1) return String(arr[0])
  if (arr.length === 2) return arr.join(lastSeparator)
  return arr.slice(0, -1).join(separator) + lastSeparator + arr[arr.length - 1]
}

/**
 * Format range (e.g., price range)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {Function} formatter - Formatting function (default: formatCurrency)
 * @returns {string} Formatted range
 */
export function formatRange(min, max, formatter = formatCurrency) {
  return `${formatter(min)} - ${formatter(max)}`
}

/**
 * Strip HTML tags from string
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').trim()
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (!str) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return str.replace(/[&<>"']/g, char => map[char])
}

/**
 * Highlight search terms in text
 * @param {string} text - Text to highlight in
 * @param {string|Array} terms - Search term(s)
 * @returns {string} HTML with highlighted terms
 */
export function highlightTerms(text, terms) {
  if (!text || !terms) return text
  const termArray = Array.isArray(terms) ? terms : [terms]
  const pattern = new RegExp(`(${termArray.join('|')})`, 'gi')
  return text.replace(pattern, '<mark>$1</mark>')
}

/**
 * Format code (add syntax highlighting markup)
 * @param {string} code - Code to format
 * @param {string} language - Programming language
 * @returns {string} Formatted code
 */
export function formatCode(code, language = 'javascript') {
  // This is a placeholder - integrate with a real syntax highlighter
  return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`
}
