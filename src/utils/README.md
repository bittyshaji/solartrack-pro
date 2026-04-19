# Utilities Module

## Purpose

Reusable utility functions and helpers organized by function. This module provides common operations needed throughout the application.

## File Organization

### common.js
General-purpose utility functions for common operations:
- Debouncing and throttling
- Array and object manipulation
- ID generation
- JSON parsing with error handling
- Deep cloning
- Caching and memoization

### formatting.js
Data formatting utilities for display:
- Date and time formatting
- Currency formatting
- Number formatting
- Phone number formatting
- File size formatting
- String manipulation (truncate, capitalize, slug)

### storage.js
LocalStorage and SessionStorage wrapper utilities:
- Safe localStorage operations
- SessionStorage operations
- JSON serialization/deserialization
- Error handling for quota exceeded

### validation.js
Validation helpers and validators for common data types:
- Email validation
- Phone number validation
- Password validation
- String length validation
- Pattern matching
- URL validation
- Custom validators

## Usage Examples

### Importing Common Utilities

```javascript
import { 
  debounce, 
  throttle, 
  deepClone, 
  generateId,
  sleep
} from '@/utils/common'

// Debounce search input
const debouncedSearch = debounce((query) => {
  performSearch(query)
}, 300)

// Throttle scroll events
const throttledScroll = throttle(() => {
  updateScrollPosition()
}, 100)

// Clone complex objects
const cloned = deepClone(complexObject)

// Generate unique IDs
const id = generateId()

// Delay execution
await sleep(1000)
```

### Importing Formatting Utilities

```javascript
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatPhoneNumber,
  formatFileSize,
  truncateString,
  capitalizeWords,
  slugify
} from '@/utils/formatting'

// Format dates for display
const displayDate = formatDate(new Date())
const displayTime = formatTime(new Date())
const displayDateTime = formatDateTime(new Date())

// Format numbers and currency
const price = formatCurrency(1234.56, 'INR')
const formatted = formatNumber(1000000, 2) // "1,000,000.00"

// Format phone and file info
const phone = formatPhoneNumber('9876543210')
const size = formatFileSize(5242880) // "5 MB"

// String operations
const shortened = truncateString('Long string...', 20)
const titled = capitalizeWords('hello world') // "Hello World"
const slug = slugify('My Project Name') // "my-project-name"
```

### Importing Storage Utilities

```javascript
import {
  getStorage,
  setStorage,
  removeStorage,
  clearStorage,
  getSessionStorage,
  setSessionStorage,
  removeSessionStorage
} from '@/utils/storage'

import { STORAGE_KEYS } from '@/config/constants'

// LocalStorage operations
setStorage(STORAGE_KEYS.USER_PREFERENCES, { theme: 'dark' })
const prefs = getStorage(STORAGE_KEYS.USER_PREFERENCES)
removeStorage(STORAGE_KEYS.AUTH_TOKEN)

// SessionStorage operations
setSessionStorage('temp_filter', filterData)
const filter = getSessionStorage('temp_filter')
removeSessionStorage('temp_filter')

// Clear all
clearStorage() // Clears localStorage
```

### Importing Validation Utilities

```javascript
import {
  validateEmail,
  validatePhone,
  validateProjectName,
  validateCustomerName,
  validatePassword,
  validateUrl,
  validateMinLength,
  validateMaxLength,
  validatePattern
} from '@/utils/validation'

// Email validation
if (!validateEmail(email)) {
  showError('Invalid email address')
}

// Phone validation
if (!validatePhone(phone)) {
  showError('Invalid phone number')
}

// Password validation
const pwdError = validatePassword(password)
if (pwdError) {
  showError(pwdError) // Returns error message if invalid
}

// Custom validation
if (!validateMinLength(name, 3)) {
  showError('Name must be at least 3 characters')
}
```

## Best Practices

### 1. Use Utilities Instead of Reinventing

Good:
```javascript
import { formatDate } from '@/utils/formatting'
const display = formatDate(date)
```

Avoid:
```javascript
const display = date.toLocaleDateString()
```

### 2. Keep Utilities Pure and Simple

```javascript
// Good - no side effects
export function formatCurrency(amount) {
  return `$${amount.toFixed(2)}`
}

// Avoid - side effects
export function logAndFormat(amount) {
  console.log(amount) // Side effect!
  return `$${amount.toFixed(2)}`
}
```

### 3. Add TypeScript/JSDoc Comments

```javascript
/**
 * Validate email address format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email format
 */
export function validateEmail(email) {
  return PATTERNS.EMAIL.test(email)
}
```

### 4. Handle Edge Cases

```javascript
// Good - handles edge cases
export function truncateString(str, length) {
  if (!str || typeof str !== 'string') return ''
  if (str.length <= length) return str
  return str.substring(0, length - 3) + '...'
}
```

### 5. Export Single Responsibility

Each utility should do one thing well:

```javascript
// Good - specific functions
export function formatDate(date) { ... }
export function formatTime(date) { ... }
export function formatDateTime(date) { ... }

// Avoid - doing too much
export function format(date, type) { ... }
```

## Common Patterns

### Pattern: Debouncing User Input

```javascript
import { debounce } from '@/utils/common'
import { searchService } from '@/services/search'

function SearchComponent() {
  const [query, setQuery] = useState('')

  const handleSearch = debounce(async (searchTerm) => {
    const results = await searchService.search(searchTerm)
    setResults(results)
  }, 300)

  return (
    <input 
      value={query}
      onChange={(e) => {
        setQuery(e.target.value)
        handleSearch(e.target.value)
      }}
    />
  )
}
```

### Pattern: Safe Storage Operations

```javascript
import { getStorage, setStorage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/constants'

export function usePersistentPreferences() {
  const [prefs, setPrefs] = useState(() => {
    return getStorage(STORAGE_KEYS.USER_PREFERENCES) || {}
  })

  const updatePrefs = (newPrefs) => {
    const updated = { ...prefs, ...newPrefs }
    setPrefs(updated)
    setStorage(STORAGE_KEYS.USER_PREFERENCES, updated)
  }

  return { prefs, updatePrefs }
}
```

### Pattern: Form Validation

```javascript
import {
  validateEmail,
  validatePassword,
  validateMinLength,
  validatePattern
} from '@/utils/validation'

export function validateLoginForm(data) {
  const errors = {}

  if (!validateEmail(data.email)) {
    errors.email = 'Invalid email address'
  }

  const pwdError = validatePassword(data.password)
  if (pwdError) {
    errors.password = pwdError
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
```

### Pattern: Async with Delay

```javascript
import { sleep } from '@/utils/common'

async function loadDataWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url)
      return await response.json()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      // Exponential backoff
      await sleep(Math.pow(2, i) * 1000)
    }
  }
}
```

## Testing Utilities

Test utilities in isolation:

```javascript
import { formatCurrency } from '@/utils/formatting'

describe('formatCurrency', () => {
  it('formats numbers as currency', () => {
    expect(formatCurrency(1234.56)).toBe('INR 1,234.56')
  })

  it('handles edge cases', () => {
    expect(formatCurrency(0)).toBe('INR 0.00')
    expect(formatCurrency(null)).toBe('INR 0.00')
  })
})
```

## Adding New Utilities

### 1. Choose the Right File

- **common.js**: General operations, functions without clear category
- **formatting.js**: Data display formatting
- **storage.js**: localStorage/sessionStorage operations
- **validation.js**: Data validation functions
- **New file**: If category doesn't fit above

### 2. Write the Function

```javascript
/**
 * Brief description
 * @param {type} param - Parameter description
 * @returns {type} Return description
 */
export function myUtil(param) {
  // Implementation
}
```

### 3. Document in This README

Add usage example in appropriate section.

### 4. Use in Code

```javascript
import { myUtil } from '@/utils/filename'
```

## Performance Considerations

- Utilities should be lightweight
- Use debounce/throttle for frequent operations
- Consider caching for expensive operations
- Avoid unnecessary re-renders in React components

## Related

- See IMPORT_CONVENTIONS.md for how to import utilities
- See FOLDER_REORGANIZATION_PLAN.md for migration details
- See config/README.md for constants these utilities use
