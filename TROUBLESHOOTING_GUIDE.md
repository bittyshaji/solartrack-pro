# Troubleshooting Guide - SolarTrack Pro

Comprehensive guide for debugging issues, solving common problems, and optimizing performance.

## Common Issues & Solutions

### Authentication Issues

#### Problem: "Invalid email or password" error on login

**Possible Causes:**
1. Incorrect credentials
2. User account doesn't exist
3. User account is deactivated
4. Supabase connection issue

**Solutions:**
1. Double-check email and password
2. Verify account exists in Supabase Dashboard
3. Check user status - should be active
4. Test Supabase connection

**Debug Steps:**
```javascript
// Check browser console for detailed error
console.log(error.code)  // Should be AUTH_ERROR
console.log(error.details)  // Contains underlying error

// Check network tab for API requests
// Verify Supabase URL in .env.local
```

#### Problem: "Token expired" or auto-logout

**Possible Causes:**
1. Session timeout
2. Token refresh failed
3. Network disconnection during refresh

**Solutions:**
1. Log in again
2. Check .env.local has correct Supabase credentials
3. Ensure network connection is stable

**Prevention:**
```javascript
// Token refresh is automatic, but ensure:
// 1. Supabase JS client is properly initialized
// 2. Network is stable
// 3. Browser allows localStorage (not in private mode)
```

#### Problem: "You do not have permission" when accessing data

**Possible Causes:**
1. Row Level Security (RLS) policy blocking access
2. User doesn't have required role
3. Data belongs to different tenant/customer

**Solutions:**
1. Check user role: Admin, Contractor, or Customer
2. Verify RLS policies in Supabase
3. Ensure accessing own data (not another user's)

**Debug:**
```javascript
// Check current user permissions
const { user } = useAuth()
console.log(user.role)  // Should match required role

// Check which data you're accessing
// RLS policies enforce tenant isolation
```

---

### Data Fetching Issues

#### Problem: Empty list when data should exist

**Possible Causes:**
1. Data not yet loaded (async issue)
2. Filters are too restrictive
3. Database query failed silently
4. RLS policy blocking read access

**Solutions:**

```javascript
// 1. Verify data is loading
const { projects, loading, error } = useProjects()

useEffect(() => {
  if (error) console.error('Load error:', error)
}, [error])

if (loading) return <Spinner />
if (projects.length === 0) return <EmptyState />

// 2. Check filters
console.log('Filters applied:', filters)

// 3. Inspect network request
// Open DevTools > Network tab > XHR/Fetch
// Look for API request to /rest/v1/projects

// 4. Check browser console for detailed errors
```

**Verification Checklist:**
- [ ] Data exists in Supabase dashboard
- [ ] No console errors logged
- [ ] Network request shows 200 status
- [ ] Response contains data
- [ ] Component is re-rendering after data loads

#### Problem: API requests very slow or timing out

**Possible Causes:**
1. Large dataset being fetched
2. Network latency
3. Supabase server overload
4. Complex query with joins

**Solutions:**

```javascript
// 1. Use pagination for large datasets
const { projects } = useProjects({
  pagination: { page: 1, limit: 20 }  // Limit to 20
})

// 2. Select only needed columns
const results = await select('projects', {
  columns: ['id', 'name', 'status']  // Not all columns
})

// 3. Add timeout configuration
configureClient({
  timeout: 15000  // 15 second timeout
})

// 4. Check network conditions
// DevTools > Network > Slow 3G to test poor connection
```

#### Problem: Duplicate requests being sent

**Possible Causes:**
1. React StrictMode in development
2. useEffect running multiple times
3. Manual retry buttons being clicked
4. Loading state not being checked

**Solutions:**

```javascript
// 1. Add dependency array to useEffect
useEffect(() => {
  loadData()
}, [projectId])  // Not []

// 2. Prevent multiple clicks
const [loading, setLoading] = useState(false)

const handleClick = async () => {
  if (loading) return  // Prevent if already loading
  setLoading(true)
  try {
    await doSomething()
  } finally {
    setLoading(false)
  }
}

// 3. Check for React StrictMode in development
// StrictMode intentionally double-invokes effects to find issues
```

---

### Form & Validation Issues

#### Problem: Form validation not working

**Possible Causes:**
1. Schema not properly defined
2. Field names don't match schema
3. Error messages not being displayed
4. Validation running on wrong trigger

**Solutions:**

```javascript
// 1. Verify schema definition
const schema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Invalid email')
})

// 2. Check field names match
<input {...register('name')} />  // Must match schema

// 3. Display error messages
{errors.name && (
  <span className="error">{errors.name.message}</span>
)}

// 4. Verify validation trigger
const { register, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
  mode: 'onChange'  // Validate on change
})
```

#### Problem: Form submission fails

**Possible Causes:**
1. Validation errors (check error messages)
2. Required fields missing
3. API call failed (check error code)
4. Supabase RLS policy blocking insert

**Debug:**

```javascript
const handleSubmit = async (data) => {
  try {
    console.log('Form data:', data)  // Verify data
    const result = await insert('projects', data)
    console.log('Success:', result)
  } catch (error) {
    console.error('Submit error:', error)
    console.error('Error code:', error.code)
    console.error('Error details:', error.details)
    toast.error(error.message)
  }
}
```

---

### Performance Issues

#### Problem: App feels slow or sluggish

**Possible Causes:**
1. Large components not memoized
2. Frequent re-renders
3. Heavy computations not optimized
4. Large bundle size

**Debug & Solutions:**

```javascript
// 1. Identify slow renders
// DevTools > Performance tab > Record > Interact > Stop

// 2. Check component render count
// Add console.log in component body
function MyComponent() {
  console.log('Render count')  // Check DevTools
}

// 3. Memoize expensive components
const MyComponent = memo(({ data }) => {
  return <div>{data}</div>
})

// 4. Use useMemo for expensive calculations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.name.localeCompare(b.name))
}, [data])

// 5. Check bundle size
npm run build  // See dist size
// Look at vite build output for large modules
```

#### Problem: Long lists take time to scroll

**Possible Causes:**
1. Rendering all items (not virtual scrolling)
2. Complex item components
3. Re-rendering on every scroll event

**Solutions:**

```javascript
// 1. Use pagination instead of rendering all
const { projects } = useProjects({
  pagination: { page: currentPage, limit: 20 }
})

// 2. Simplify item component
const ProjectItem = memo(({ project }) => (
  <div>{project.name}</div>
))

// 3. Use debounced scroll handler if custom scroll
const handleScroll = useMemo(
  () => debounce((e) => {
    // Handle scroll
  }, 200),
  []
)
```

#### Problem: Memory leaks or increasing memory usage

**Possible Causes:**
1. Event listeners not cleaned up
2. Intervals/timeouts not cleared
3. Subscriptions not unsubscribed
4. DOM nodes being held in memory

**Solutions:**

```javascript
// 1. Clean up event listeners
useEffect(() => {
  const handleResize = () => { /* ... */ }
  window.addEventListener('resize', handleResize)
  
  return () => {
    window.removeEventListener('resize', handleResize)
  }
}, [])

// 2. Clear intervals and timeouts
useEffect(() => {
  const timer = setTimeout(() => { /* ... */ }, 1000)
  
  return () => clearTimeout(timer)
}, [])

// 3. Monitor in DevTools
// DevTools > Memory > Heap snapshots > Compare before/after
```

---

### Offline & Network Issues

#### Problem: App doesn't work offline

**Possible Causes:**
1. Service Worker not registered
2. Data not cached locally
3. Offline detection not working
4. Feature requires real-time data

**Solutions:**

```javascript
// 1. Check offline status
const { isOnline } = useOfflineStatus()

if (!isOnline) {
  return <OfflineMessage />
}

// 2. Show offline banner
{!isOnline && (
  <div className="offline-banner">
    Working offline - Limited functionality
  </div>
)}

// 3. Implement local cache
const [cachedData, setCachedData] = useState(
  JSON.parse(localStorage.getItem('projects')) || []
)

// 4. Test offline mode
// DevTools > Application > Service Workers > Offline
```

#### Problem: Reconnection doesn't sync data

**Possible Causes:**
1. Sync logic not implemented
2. Offline queue not being processed
3. Stale data not being refreshed

**Solutions:**

```javascript
// 1. Refresh data on reconnection
const { isOnline } = useOfflineStatus()

useEffect(() => {
  if (isOnline) {
    // Refresh all data
    refreshProjects()
    refreshCustomers()
    refreshInvoices()
  }
}, [isOnline])

// 2. Implement offline queue
// Queue operations while offline
// Execute queue when online
const offlineQueue = useRef([])

// 3. Show sync status
{isOnline ? 'Synced' : 'Syncing...'}
```

---

## Debug Techniques

### Browser DevTools

#### Console Tab
```javascript
// Check for JavaScript errors
// Check API errors and details
console.error('Error:', error)

// Log API responses
console.log('Response:', data)

// Monitor performance
console.time('operation')
// ... do something ...
console.timeEnd('operation')
```

#### Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Interact with app
4. Look for failed requests (4xx, 5xx status)
5. Click request to see details:
   - Headers (auth token, content-type)
   - Request body (what you sent)
   - Response (what you got back)
   - Timing (how long it took)

#### Application Tab
1. Go to Application tab
2. Check localStorage:
   - Auth tokens
   - Cached data
   - User preferences
3. Check Cookies:
   - Session data
4. Check Service Workers:
   - Registration status
   - Cache storage

#### Performance Tab
1. Click "Record"
2. Interact with app (click buttons, scroll, etc.)
3. Click "Stop"
4. Analyze:
   - Yellow: JavaScript execution
   - Purple: Rendering
   - Green: Painting
5. Look for long tasks (>50ms)

### React DevTools Extension

1. Install [React DevTools](https://react-devtools-tutorial.vercel.app/)
2. In DevTools > Components tab:
   - Inspect component props
   - Inspect component state
   - Track component renders
   - Search for components

### Logging Strategies

#### API Layer Logging
```javascript
// Enable logging in client
configureClient({
  enableLogging: true
})

// Or add custom logging
addBeforeRequestInterceptor((config) => {
  console.log('API Request:', {
    operation: config.operation,
    table: config.table,
    timestamp: new Date().toISOString()
  })
  return config
})
```

#### Component Logging
```javascript
// Log component lifecycle
useEffect(() => {
  console.log('Component mounted', { id, data })
  return () => console.log('Component unmounted')
}, [])

// Log state changes
useEffect(() => {
  console.log('Projects updated:', projects)
}, [projects])
```

#### Error Logging
```javascript
try {
  // Do something
} catch (error) {
  console.error('Operation failed:', {
    code: error.code,
    message: error.message,
    details: error.details,
    timestamp: new Date().toISOString()
  })
}
```

---

## Testing & Validation

### Manual Testing Checklist

**Before Deployment:**
- [ ] Create new project works
- [ ] Edit project works
- [ ] Delete project works
- [ ] List shows all projects
- [ ] Search/filter works
- [ ] CSV import works
- [ ] Form validation shows errors
- [ ] Error messages are clear
- [ ] Offline mode works (turn off WiFi)
- [ ] Back online syncs correctly
- [ ] Mobile view works
- [ ] No console errors or warnings

### Running Tests
```bash
# Run all tests
npm test

# Run specific file
npm test ProjectForm.test.js

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Writing Test Cases
```javascript
import { render, screen, fireEvent } from '@testing-library/react'

test('should create project', async () => {
  // 1. Render component
  render(<ProjectForm onSubmit={mockSubmit} />)
  
  // 2. Find elements
  const input = screen.getByLabelText('Project Name')
  const button = screen.getByText('Create')
  
  // 3. Interact
  fireEvent.change(input, { target: { value: 'Test' } })
  fireEvent.click(button)
  
  // 4. Verify
  expect(mockSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'Test' })
  )
})
```

---

## Performance Optimization Tips

### Data Fetching Optimization
```javascript
// 1. Use pagination
const results = await select('projects', {
  pagination: { page: 1, limit: 20 }
})

// 2. Select only needed columns
const results = await select('projects', {
  columns: ['id', 'name', 'status']
})

// 3. Use caching
const cachedProjects = useMemo(() => projects, [projects])

// 4. Batch operations
await batch.parallel([
  { operation: 'select', table: 'projects' },
  { operation: 'select', table: 'customers' }
])
```

### Component Optimization
```javascript
// 1. Memoize components
const ProjectCard = memo(({ project }) => (
  <div>{project.name}</div>
), (prev, next) => prev.project.id === next.project.id)

// 2. Use useMemo for calculations
const total = useMemo(
  () => projects.reduce((sum, p) => sum + p.cost, 0),
  [projects]
)

// 3. Lazy load routes
const Dashboard = lazy(() => import('./Dashboard'))

// 4. Code split by feature
const Reports = lazy(() => import('./Reports'))
```

### Bundle Optimization
```bash
# Check bundle size
npm run build

# Analyze what's included
# Look at dist/bundle-analysis.html

# Dynamic imports for large libraries
const jsPDF = await import('jspdf')
```

---

## Error Code Reference

| Code | Meaning | Solution |
|------|---------|----------|
| `AUTH_ERROR` | Authentication failed | Check login credentials |
| `UNAUTHORIZED` | Not authenticated | Log in again |
| `FORBIDDEN` | No permission | Check user role/access |
| `VALIDATION_ERROR` | Invalid input | Check form fields |
| `NETWORK_ERROR` | No connection | Check internet |
| `TIMEOUT_ERROR` | Request took too long | Retry or check network |
| `RECORD_NOT_FOUND` | Data doesn't exist | Verify ID/filters |
| `DUPLICATE_KEY` | Duplicate entry | Check for existing record |
| `DATABASE_ERROR` | Database operation failed | Check data format |
| `INTERNAL_SERVER_ERROR` | Server error | Try again or contact support |

---

## Getting Help

1. **Check this guide** - Most common issues covered
2. **Check browser console** - Detailed error messages
3. **Check network tab** - See actual API responses
4. **Review error details** - `error.details` has debugging info
5. **Check Supabase logs** - Backend errors logged there
6. **Ask team** - Share error code and steps to reproduce

---

**Last Updated:** April 2026  
**Version:** 0.1.0
