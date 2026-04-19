# SolarTrack Pro - Troubleshooting Guide

**Solutions to common issues**

## Setup & Environment

### Port 5173 Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::5173`

**Solution**:
```bash
# Use different port
npm run dev -- --port 3001

# Or kill process using port 5173
lsof -ti:5173 | xargs kill -9  # Linux/Mac
netstat -ano | findstr :5173    # Windows
```

### Module Not Found

**Error**: `Cannot find module '@/components/ProjectForm'`

**Solution**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check path is correct
# Verify import uses @ alias (configured in vite.config.js)
```

### .env.local Not Being Read

**Error**: Environment variables showing as undefined

**Solution**:
```bash
# Restart dev server
npm run dev

# Verify .env.local exists and has VITE_ prefix
# Variables without VITE_ prefix not accessible in client

# Check file has correct values:
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

---

## Supabase & Authentication

### Cannot Connect to Supabase

**Error**: `FetchError: fetch failed` or connection timeout

**Solution**:
```bash
# 1. Check internet connection
ping google.com

# 2. Verify Supabase credentials in .env.local
# Visit: https://app.supabase.com/
# Get correct URL and API key

# 3. Verify Supabase project is active
# Check dashboard - project should show as active

# 4. Check credentials format
VITE_SUPABASE_URL=https://xxxxx.supabase.co  # Must have https://
VITE_SUPABASE_ANON_KEY=eyJhbGc...            # Must be complete key
```

### Email Verification Not Working

**Error**: Confirmation email not received

**Solution**:
1. Check spam/junk folder
2. Wait 5 minutes (emails can be slow)
3. Try different email address
4. Check Supabase dashboard > Auth > Users
5. Try resending via "Forgot Password"

### Token Expired After Login

**Error**: Logged out after short period or `Session expired`

**Solution**:
```bash
# Tokens refresh automatically
# Check localStorage for auth token:
localStorage.getItem('supabase.auth.token')

# If missing, try:
# 1. Clear localStorage: localStorage.clear()
# 2. Restart dev server
# 3. Login again

# Check Supabase session settings in dashboard
```

---

## TypeScript & Linting

### TypeScript Errors

**Error**: `Type 'X' is not assignable to type 'Y'`

**Solution**:
```bash
# Run type checker to see all errors
npm run type-check

# Fix type issues:
# - Check variable initialization
// Bad
const data = null
data.name // Error: Object is possibly 'null'

// Good
const data = null
data?.name // Optional chaining

// Or use type assertion (use sparingly)
const data = null as ProjectData
```

### ESLint Errors

**Error**: `Expected an object, array or primitive value to be returned by the function`

**Solution**:
```bash
# See all lint errors
npm run lint:check

# Fix auto-fixable issues
npm run lint

# Common issues:
// Bad: async on useEffect
useEffect(async () => { }, [])

// Good
useEffect(() => {
  const load = async () => { }
  load()
}, [])
```

### Prettier Formatting Issues

**Error**: Code doesn't format or formats wrong

**Solution**:
```bash
# Reformat entire project
npm run format

# VS Code: Set default formatter
# Settings > Editor Default Formatter > Prettier

# Check .prettierrc for rules
```

---

## React & Component Issues

### Component Not Rendering

**Error**: Blank page or missing component

**Solution**:
1. Check browser console for errors (F12)
2. Check that component is imported correctly
3. Check that component name is PascalCase
4. Check that routes are set up correctly
5. Use React DevTools to inspect component tree

### Infinite Loops / Infinite Renders

**Error**: `maximum call stack size exceeded` or app freezes

**Causes & Solutions**:

```javascript
// Bad: useEffect without dependencies causes infinite loop
useEffect(() => {
  setState(something)
  // setState triggers useEffect again!
})

// Good: Add dependencies
useEffect(() => {
  setState(something)
}, []) // Empty deps = run once

// Bad: Function as dependency changes every render
const handleClick = () => { }
useEffect(() => {
  element.addEventListener('click', handleClick)
}, [handleClick]) // handleClick changes every render!

// Good: Use useCallback
const handleClick = useCallback(() => { }, [])
useEffect(() => {
  element.addEventListener('click', handleClick)
}, [handleClick])
```

### Blank Pages / 404

**Error**: Page shows nothing or "Not Found"

**Solution**:
1. Check URL is correct
2. Check route is defined in routing configuration
3. Check component file exists
4. Check import path is correct
5. Run `npm run dev` and check console for errors

---

## Testing Issues

### Tests Not Running

**Error**: `Command not found: vitest`

**Solution**:
```bash
npm install  # Reinstall dependencies

# Or run through npm
npm run test
```

### Tests Failing

**Error**: Test fails but code works

**Common causes**:
```javascript
// Bad: Async operation without await
it('loads data', () => {
  loadData()
  expect(data).toBeDefined() // Runs before loadData completes!
})

// Good: Use async/await
it('loads data', async () => {
  await loadData()
  expect(data).toBeDefined()
})

// Bad: Timing dependent
it('shows message', () => {
  showMessage()
  expect(screen.getByText('Message')).toBeInTheDocument()
})

// Good: Wait for element
it('shows message', async () => {
  showMessage()
  await waitFor(() => {
    expect(screen.getByText('Message')).toBeInTheDocument()
  })
})
```

---

## Build & Performance Issues

### Build Fails

**Error**: `npm run build` fails

**Solution**:
```bash
# Check for TypeScript errors
npm run type-check

# Check for lint errors
npm run lint:check

# Clear cache and rebuild
rm -rf dist .vite node_modules
npm install
npm run build
```

### Build Output Too Large

**Error**: Bundle size warning or slow page load

**Solution**:
```bash
# Analyze bundle size
npm run build
npx vite-plugin-visualizer

# Then:
# 1. Check what's large
# 2. Split into separate chunks
# 3. Lazy load routes
# 4. Remove unused dependencies
```

### Development Server Slow

**Error**: Hot reload takes long time

**Solution**:
```bash
# Clear Vite cache
rm -rf .vite

# Restart dev server
npm run dev

# Check for large files in src/
# Consider splitting components
```

---

## Git & Version Control Issues

### Git Merge Conflicts

**Error**: `conflict (content)` or merge stops

**Solution**:
```bash
# View conflicted files
git status

# Edit files, look for:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> branch-name

# After fixing:
git add .
git commit -m "Resolve merge conflicts"

# Or abort merge
git merge --abort
```

### Accidentally Committed Something

**Error**: Committed `.env.local` or large file

**Solution**:
```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Or discard changes in last commit
git reset --hard HEAD~1

# For already pushed commits:
git revert commit-hash
git push origin main
```

---

## Network & CORS Issues

### CORS Error in Browser

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**:
- Supabase handles CORS for their endpoints
- For custom backends, configure CORS headers
- Check that request headers are correct
- Verify request is to correct domain

### Request Timeouts

**Error**: `Timeout waiting for server`

**Solution**:
1. Check internet connection
2. Verify backend is running
3. Check Supabase status at status.supabase.com
4. Try disabling VPN or proxy
5. Check request isn't too large

---

## Browser Issues

### Local Storage Full

**Error**: `QuotaExceededError`

**Solution**:
```javascript
// Clear local storage
localStorage.clear()

// Or specific items
localStorage.removeItem('key')

// Check storage size
Object.keys(localStorage).reduce((sum, key) => sum + localStorage[key].length, 0)
```

### Browser Cache Issues

**Error**: Old code being loaded

**Solution**:
```bash
# Hard refresh (clear cache for current site)
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or open DevTools > Settings > Disable cache
```

---

## Getting More Help

### Check Logs

```bash
# Browser console (F12 or Cmd+Option+I)
# Look for error messages

# Dev server console
# Where you ran npm run dev

# Supabase logs
# Dashboard > Logs
```

### Debug Mode

```javascript
// Add debug logging
console.log('State:', { data, loading, error })

// Use browser DevTools debugger
debugger // Pauses execution
```

### Ask for Help

If stuck:
1. Check this guide first
2. Check [CONTRIBUTING.md](../CONTRIBUTING.md)
3. Check console errors
4. Ask in #dev-help Slack channel
5. Escalate to tech lead

---

## Useful Developer Tools

- **React DevTools**: Browser extension for inspecting React
- **Redux DevTools**: Works with some state management
- **VS Code Debugger**: Built-in debugging
- **Thunder Client**: REST API testing
- **Network Tab**: View API requests (F12)
- **Supabase Dashboard**: View database and logs

---

## Still Stuck?

Before asking for help, provide:

1. **Error message** (complete)
2. **Steps to reproduce**
3. **What you've tried**
4. **System info** (Node version, OS, etc.)
5. **Screenshots if relevant**

Good luck debugging!
