# Phase 2A: Advanced Search & Filtering Deployment Guide

**Version**: 2.0  
**Date**: April 15, 2026  
**Status**: Ready for Production Deployment  
**Environment**: SolarTrack Pro v2.0  

---

## Executive Summary

Phase 2A introduces enterprise-grade search and filtering capabilities to SolarTrack Pro. This includes:
- Global search bar with real-time autocomplete
- Advanced multi-criteria filtering
- Saved filter management
- Search history tracking
- Performance-optimized database queries
- Mobile-responsive UI

**Estimated Deployment Time**: 30-45 minutes  
**Database Migration Required**: Yes (search_logs, saved_filters tables)  
**Rollback Risk**: Low (backward compatible)

---

## Part 1: File Deployment Checklist

### Step 1.1: Copy Service Files to src/lib/

```bash
# Service Layer Files (Business Logic)
cp searchService.js src/lib/searchService.js
cp filterService.js src/lib/filterService.js
```

**Files to Copy**:
- [ ] `searchService.js` - Core search logic, database queries
  - `searchProjects(query)` - Main search function
  - `getAutocompleteSuggestions(query)` - Real-time suggestions
  - `logSearchQuery(query)` - Search history tracking
  - `getSearchHistory()` - Retrieve past searches

- [ ] `filterService.js` - Filter management logic
  - `applyFilters(results, filterConfig)` - Filter application
  - `saveFilter(filterObj)` - Persist filter to DB
  - `loadFilter(filterId)` - Retrieve saved filter
  - `getSavedFilters()` - List all user filters
  - `deleteFilter(filterId)` - Remove saved filter

### Step 1.2: Copy Component Files to src/components/

```bash
# UI Component Files (Presentation Layer)
cp GlobalSearchBar.jsx src/components/GlobalSearchBar.jsx
cp AdvancedFilterPanel.jsx src/components/AdvancedFilterPanel.jsx
cp SearchResultsCard.jsx src/components/SearchResultsCard.jsx
cp SavedFiltersList.jsx src/components/SavedFiltersList.jsx
cp SearchSuggestions.jsx src/components/SearchSuggestions.jsx
```

**Files to Copy**:
- [ ] `GlobalSearchBar.jsx` - Reusable search bar component
  - Keyboard shortcut support (/)
  - Debounced autocomplete
  - Enter to search handling
  - Clear button

- [ ] `AdvancedFilterPanel.jsx` - Filter configuration UI
  - Status filter (EXE, DONE, STALLED, CANCELLED)
  - Date range picker
  - Project type selector
  - Apply/Reset buttons
  - Mobile-responsive layout

- [ ] `SearchResultsCard.jsx` - Individual result display
  - Project title, description preview
  - Status badge
  - Date modified indicator
  - Click to navigate

- [ ] `SavedFiltersList.jsx` - Saved filter management
  - List saved filters
  - Quick load button
  - Delete button
  - Edit functionality

- [ ] `SearchSuggestions.jsx` - Autocomplete dropdown
  - Highlight matching text
  - Recent searches section
  - Popular searches section
  - Keyboard navigation (up/down arrows)

### Step 1.3: Copy Page Files to src/pages/

```bash
# Page Component Files (Full Page Views)
cp SearchPage.jsx src/pages/SearchPage.jsx
```

**Files to Copy**:
- [ ] `SearchPage.jsx` - Main search interface
  - Combines search bar, filters, and results
  - State management for search context
  - Results pagination
  - Performance metrics display (dev only)

---

## Part 2: Code Integration Steps

### Step 2.1: Add Search Route to src/App.jsx

**Location**: Add this import at the top of App.jsx with other page imports

```javascript
import SearchPage from './pages/SearchPage';
```

**Location**: Add this route in the Routes section (after ProtectedRoute imports)

```javascript
<Route 
  path="/search" 
  element={
    <ProtectedRoute>
      <SearchPage />
    </ProtectedRoute>
  } 
/>
```

**Verification Checklist**:
- [ ] Import statement added
- [ ] Route path is exactly "/search"
- [ ] Wrapped in ProtectedRoute for authentication
- [ ] No syntax errors after modification

**Example Context**:
```javascript
// src/App.jsx
import SearchPage from './pages/SearchPage';
import ProjectsPage from './pages/ProjectsPage';
// ... other imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Step 2.2: Add GlobalSearchBar to Layout.jsx

**Location**: Add import at top of Layout.jsx

```javascript
import GlobalSearchBar from '../components/GlobalSearchBar';
```

**Location**: Add component to header section (usually top-right or top-center)

```javascript
<header className="app-header">
  <div className="header-left">
    {/* Logo and menu items */}
  </div>
  
  <div className="header-center">
    <GlobalSearchBar onSearch={handleSearchNavigation} />
  </div>
  
  <div className="header-right">
    {/* User menu, notifications, etc. */}
  </div>
</header>
```

**Handler Implementation**:
```javascript
const handleSearchNavigation = (query) => {
  // Navigate to search page with query parameter
  navigate(`/search?q=${encodeURIComponent(query)}`);
};
```

**Styling Notes**:
- Search bar width: 300px on desktop, 100% on mobile
- Z-index: 1000 (must be above other elements)
- Autocomplete dropdown should appear below
- Mobile: Consider collapsible or drawer-based search

**Verification Checklist**:
- [ ] Import statement added
- [ ] Component added to header
- [ ] onSearch handler wired correctly
- [ ] Search bar visible in browser
- [ ] No layout shift or overflow issues

### Step 2.3: Add Navigation Link to Menu

**Location**: Main navigation component (typically Navigation.jsx or Sidebar.jsx)

```javascript
<nav className="main-navigation">
  <Link to="/dashboard" className="nav-link">Dashboard</Link>
  <Link to="/projects" className="nav-link">Projects</Link>
  <Link to="/search" className="nav-link">
    <SearchIcon /> Search
  </Link>
  {/* Other nav items */}
</nav>
```

**Mobile Considerations**:
- Include search icon (magnifying glass)
- Add to mobile menu
- Consider search-specific mobile drawer

**Verification Checklist**:
- [ ] "Search" link appears in navigation
- [ ] Link points to /search
- [ ] Clickable and functional
- [ ] Works on mobile navigation

### Step 2.4: Update .env.local Configuration

**Location**: Create or update .env.local file in project root

```bash
# ========================================
# Phase 2A - Search & Filtering Configuration
# ========================================

# Maximum number of search results to display per page
VITE_SEARCH_RESULT_LIMIT=20

# Maximum number of autocomplete suggestions to show
VITE_SEARCH_AUTOCOMPLETE_LIMIT=5

# Search query timeout in milliseconds (prevent hanging queries)
VITE_SEARCH_TIMEOUT_MS=5000

# How many days to keep search history
VITE_SEARCH_HISTORY_DAYS=90

# Debounce delay for autocomplete (milliseconds)
VITE_SEARCH_DEBOUNCE_MS=300

# Enable search performance monitoring
VITE_SEARCH_PERFORMANCE_DEBUG=false

# API endpoint for search (if using backend API)
VITE_SEARCH_API_URL=http://localhost:3000/api/search
```

**Configuration Guide**:

| Variable | Default | Range | Notes |
|----------|---------|-------|-------|
| VITE_SEARCH_RESULT_LIMIT | 20 | 10-100 | Higher = more results, slower rendering |
| VITE_SEARCH_AUTOCOMPLETE_LIMIT | 5 | 3-10 | More suggestions = more API calls |
| VITE_SEARCH_TIMEOUT_MS | 5000 | 1000-10000 | Lower = timeout sooner, higher = wait longer |
| VITE_SEARCH_HISTORY_DAYS | 90 | 30-365 | Balance storage and history length |
| VITE_SEARCH_DEBOUNCE_MS | 300 | 100-500 | Lower = more responsive, higher = less API load |
| VITE_SEARCH_PERFORMANCE_DEBUG | false | true/false | Set true to see timing in console |

**Verification Checklist**:
- [ ] .env.local file exists in project root
- [ ] All variables are added
- [ ] No syntax errors (no trailing commas)
- [ ] Values are appropriate for your environment
- [ ] Dev server restarted after changes

---

## Part 3: Database Setup

### Step 3.1: Create Required Tables

These tables must exist before Phase 2A deployment. Create them in your database:

**Table 1: search_logs**
```sql
CREATE TABLE search_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  query VARCHAR(255) NOT NULL,
  result_count INT DEFAULT 0,
  execution_time_ms INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_query (user_id, created_at),
  INDEX idx_created_at (created_at)
);
```

**Table 2: saved_filters**
```sql
CREATE TABLE saved_filters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  filter_name VARCHAR(100) NOT NULL,
  filter_config JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  UNIQUE KEY unique_user_filter (user_id, filter_name)
);
```

**Table 3: Add Indexes to projects Table**
```sql
ALTER TABLE projects ADD INDEX idx_name (name);
ALTER TABLE projects ADD INDEX idx_status (status);
ALTER TABLE projects ADD INDEX idx_description (description);
ALTER TABLE projects ADD FULLTEXT INDEX ft_name_description (name, description);
```

**Verification Checklist**:
- [ ] search_logs table created
- [ ] saved_filters table created
- [ ] Indexes added to projects table
- [ ] FULLTEXT index created for search
- [ ] Foreign keys properly configured

### Step 3.2: Verify Database Connectivity

```javascript
// Quick test in browser console after deployment
async function testSearchDB() {
  try {
    const results = await fetch('/api/search?q=test');
    const data = await results.json();
    console.log('✅ Search API working:', data);
  } catch (err) {
    console.error('❌ Search API error:', err);
  }
}
```

---

## Part 4: Testing Checklist

### Pre-Deployment Testing (Development Environment)

**Functional Tests**:
- [ ] Global search bar appears in header
- [ ] Search bar is accessible (not hidden or overlapped)
- [ ] Click on search bar focuses input and shows autocomplete
- [ ] Type text shows real-time suggestions
- [ ] Pressing Enter navigates to /search with query parameter
- [ ] Escape key closes autocomplete dropdown
- [ ] Keyboard shortcut "/" focuses search bar from any page
- [ ] Clear button (X) empties search field

**Search Page Tests**:
- [ ] /search page loads without errors
- [ ] Recent search history displays
- [ ] Typing in search box filters projects
- [ ] Results update without page reload
- [ ] Click result navigates to project details
- [ ] Search counts display (e.g., "23 results found")
- [ ] No results state displays properly
- [ ] Loading spinner shows during search

**Filter Tests**:
- [ ] Click "Filters" button shows filter panel
- [ ] Status filter checkbox toggles properly
- [ ] Date range picker works (start and end dates)
- [ ] Type selector shows all project types
- [ ] Apply button updates results with filters
- [ ] Reset button clears all filters
- [ ] Multiple filters combine correctly (AND logic)
- [ ] Filter panel closes after apply

**Saved Filters Tests**:
- [ ] "Save Filter" button appears after filtering
- [ ] Filter name input accepts text
- [ ] Save button creates filter and closes dialog
- [ ] Saved filter appears in "Saved Filters" list
- [ ] Click saved filter applies it immediately
- [ ] Delete button removes saved filter
- [ ] Saved filters persist after page refresh
- [ ] Can't save filter with duplicate name (error shows)

**Search History Tests**:
- [ ] First search is logged
- [ ] Search history appears in dropdown
- [ ] Maximum 10 recent searches shown
- [ ] Searches older than 90 days are hidden
- [ ] Click history item repeats search
- [ ] History persists across sessions

**Performance Tests**:
- [ ] Initial page load < 2 seconds
- [ ] Search query execution < 100ms
- [ ] Autocomplete suggestions appear < 300ms
- [ ] Filter application < 200ms
- [ ] No memory leaks in console
- [ ] No console errors or warnings

**Mobile Responsiveness Tests**:
- [ ] Test at 320px width (iPhone SE)
- [ ] Test at 768px width (iPad)
- [ ] Test at 1024px width (desktop)
- [ ] Search bar is usable on mobile
- [ ] Filter panel fits on mobile screen
- [ ] Results scroll smoothly
- [ ] Touch interactions work (no hover states only)

**Browser Compatibility Tests**:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Accessibility Tests**:
- [ ] Keyboard navigation: Tab through all interactive elements
- [ ] Screen reader: Test with VoiceOver or NVDA
- [ ] Color contrast: Check filter and result text
- [ ] Focus indicators: All buttons have visible focus state
- [ ] ARIA labels: Search inputs have proper labels

### Test Results Template

```markdown
## Phase 2A Testing Results - [Date]

**Tester**: [Name]  
**Environment**: [Dev/Staging/Production]  
**Browser**: [Name and Version]  

### Functional Tests
- [x] Global search bar appears in header
- [x] Autocomplete shows suggestions
- [x] Search navigates to /search
- [ ] <Any failed tests noted here>

### Performance Tests
- [x] Search < 100ms
- [x] Page load < 2s
- [ ] <Any performance issues noted>

### Issues Found
1. Issue #1: [Description and severity]
   - Steps to reproduce
   - Expected result
   - Actual result

### Sign-off
- [ ] All critical tests passed
- [ ] All high-priority issues resolved
- [ ] Ready for deployment
```

---

## Part 5: Customization Options

### Search Configuration

**1. Search Field Weights**

Adjust how heavily different fields are weighted in search relevance:

```javascript
// In searchService.js
const SEARCH_WEIGHTS = {
  name: 3.0,           // Project name matches count heavily
  description: 1.5,    // Description matches less so
  status: 1.0,         // Status matches neutral
  tags: 2.0,           // Tags matches more relevant
};
```

Higher weight = matches in that field appear higher in results.

**2. Autocomplete Result Count**

```javascript
// In .env.local
VITE_SEARCH_AUTOCOMPLETE_LIMIT=5  # Default, increase to 10 for more suggestions
```

**3. Filter Panel Position**

```javascript
// In AdvancedFilterPanel.jsx
// Change position from left sidebar to right sidebar or modal

<div className="filter-panel filter-panel--right">
  {/* Filter controls */}
</div>
```

**4. Search Timeout Configuration**

```javascript
// In .env.local
VITE_SEARCH_TIMEOUT_MS=5000  # Increase to 10000 if searches are timing out
```

**5. Search History Retention**

```javascript
// In .env.local
VITE_SEARCH_HISTORY_DAYS=90  # Change to 30 for shorter history, 180 for longer
```

**6. Debounce Timing**

```javascript
// In .env.local
VITE_SEARCH_DEBOUNCE_MS=300  # Lower for snappier response, higher for less API calls
```

### UI Customization

**Dark Mode Support**

```css
/* In GlobalSearchBar.jsx styles */
.search-bar {
  background-color: light-mode-color;
}

@media (prefers-color-scheme: dark) {
  .search-bar {
    background-color: dark-mode-color;
  }
}
```

**Custom Styling**

The components use CSS classes that can be customized:
- `.search-bar` - Main search input
- `.search-dropdown` - Autocomplete suggestions
- `.filter-panel` - Filter controls
- `.search-results` - Results container
- `.result-card` - Individual result item

---

## Part 6: Troubleshooting Guide

### Issue: "Search bar not appearing in header"

**Possible Causes**:
1. GlobalSearchBar component not imported
2. Component not added to Layout.jsx
3. CSS not loaded
4. Component has rendering error

**Solution**:
```bash
# Check import
grep "GlobalSearchBar" src/components/Layout.jsx

# Check console for errors
# Browser DevTools > Console tab

# Verify component file exists
ls -la src/components/GlobalSearchBar.jsx

# Check for syntax errors
npm run build  # This will show any syntax issues
```

**Verification**:
- [ ] Component renders in browser
- [ ] No console errors
- [ ] Component is visible (not display:none)

---

### Issue: "Autocomplete not showing suggestions"

**Possible Causes**:
1. search_logs table is empty (no search history)
2. Search query timeout is too short
3. Autocomplete debounce is preventing calls
4. API endpoint is returning errors

**Solution**:
```javascript
// Check in browser DevTools Console:
console.log(localStorage.getItem('searchHistory'));  // Should show recent searches

// Check network tab:
// Look for API calls to /api/search or similar
// Verify responses are 200 OK

// Check .env.local:
console.log(import.meta.env.VITE_SEARCH_TIMEOUT_MS);
```

**Debug Steps**:
1. Open DevTools (F12)
2. Go to Network tab
3. Type in search bar
4. Look for API requests
5. Check response status and data

**Verification**:
- [ ] API calls are being made
- [ ] Responses have results
- [ ] No 400/500 errors

---

### Issue: "Search results very slow"

**Possible Causes**:
1. No indexes on projects table
2. FULLTEXT index not created
3. Database has millions of records
4. Search timeout too long (waits for stragglers)

**Solution**:
```bash
# Check if indexes exist
mysql -u root -p yourdb -e "SHOW INDEXES FROM projects;"

# Create missing indexes
mysql -u root -p yourdb < phase2a_indexes.sql

# Check query performance
mysql -u root -p yourdb -e "EXPLAIN SELECT * FROM projects WHERE MATCH(name, description) AGAINST('solar');"
```

**Performance Optimization**:
```javascript
// In .env.local, reduce timeout
VITE_SEARCH_TIMEOUT_MS=3000  # Faster failure instead of waiting

// Reduce result limit
VITE_SEARCH_RESULT_LIMIT=10  # Render faster

// Increase debounce
VITE_SEARCH_DEBOUNCE_MS=500  # Less API calls
```

**Verification**:
- [ ] Indexes are present
- [ ] EXPLAIN shows index usage
- [ ] Query time < 100ms

---

### Issue: "Filters not applying to results"

**Possible Causes**:
1. Filter component not wired to results
2. Filter config not being passed correctly
3. filterService.js has logic errors
4. State not updating properly

**Solution**:
```javascript
// Check filter state is updating
console.log('Filter config:', filterConfig);

// Check if results are being filtered
console.log('Before filter:', allResults.length);
console.log('After filter:', filteredResults.length);

// Verify filter logic
// In filterService.js, check applyFilters function
```

**Common Filter Issues**:

| Issue | Cause | Fix |
|-------|-------|-----|
| Filter button doesn't show panel | Panel hidden by default | Check CSS display property |
| Apply button doesn't update results | onApply handler not wired | Check SearchPage.jsx |
| Filters reset after reload | Not persisted to DB | Check saveFilter logic |
| Status filter doesn't work | Status field name mismatch | Verify DB column name |

**Verification**:
- [ ] Filter panel opens
- [ ] Apply button triggers function
- [ ] Results update in UI
- [ ] No console errors

---

### Issue: "Keyboard shortcut (/) not working"

**Possible Causes**:
1. Keyboard event listener not attached
2. Search bar ref is null
3. Global event listener removed
4. Input field consuming event

**Solution**:
```javascript
// Check if listener is attached
console.log('Keyboard listener active:', window.searchListenerActive);

// Test manually
// Press "/" key while viewing page
// Search bar should be focused

// Check for conflicts
// Other scripts consuming "/" key
// Text input fields preventing event bubbling
```

**Debug**:
```javascript
// Add to browser console
document.addEventListener('keydown', (e) => {
  console.log('Key pressed:', e.key);
  if (e.key === '/') console.log('Slash key detected!');
});
```

**Verification**:
- [ ] "/" key logs in console
- [ ] Search bar focuses
- [ ] Works from any page

---

## Part 7: Performance Optimization

### Query Optimization

```sql
-- Profile slow queries
SET PROFILING = 1;
SELECT * FROM projects WHERE MATCH(name, description) AGAINST('solar');
SHOW PROFILES;

-- Check execution plan
EXPLAIN SELECT * FROM projects 
  WHERE status = 'EXE' 
    AND MATCH(name, description) AGAINST('solar')
  LIMIT 20;
```

**Expected Performance**:
- Search query: < 100ms for 10,000 records
- Autocomplete: < 50ms
- Filter application: < 200ms

### React Performance Tips

**1. Memoize Components**
```javascript
export const SearchResults = React.memo(({ results }) => {
  return (
    <div>
      {results.map(r => <ResultCard key={r.id} result={r} />)}
    </div>
  );
});
```

**2. Debounce Search Input**
```javascript
const debouncedSearch = useCallback(
  debounce((query) => performSearch(query), 300),
  []
);
```

**3. Virtualize Long Lists**
```javascript
// For 1000+ results, use virtual scrolling
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={results.length}
  itemSize={80}
>
  {({ index, style }) => (
    <ResultCard style={style} result={results[index]} />
  )}
</FixedSizeList>
```

**4. Cache Search Results**
```javascript
const [searchCache, setSearchCache] = useState({});

// Before fetching
if (searchCache[query]) {
  return setResults(searchCache[query]);
}

// After fetching
setSearchCache(prev => ({
  ...prev,
  [query]: results
}));
```

### Database Performance Tips

**1. Add Strategic Indexes**
```sql
-- Already created, but ensure they exist:
CREATE INDEX idx_status ON projects(status);
CREATE INDEX idx_created_at ON projects(created_at);
CREATE INDEX idx_user_id ON projects(user_id);
CREATE FULLTEXT INDEX ft_search ON projects(name, description);
```

**2. Archive Old Search Logs**
```sql
-- Run monthly to keep table lean
DELETE FROM search_logs 
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

**3. Monitor Table Sizes**
```sql
SELECT 
  TABLE_NAME,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'yourdb'
ORDER BY size_mb DESC;
```

---

## Part 8: Monitoring & Maintenance

### Set Up Performance Monitoring

**Browser Console Logging**:
```javascript
// In searchService.js, log performance
const startTime = performance.now();
const results = await searchProjects(query);
const endTime = performance.now();
console.log(`Search took ${endTime - startTime}ms`);
```

**Monitor Search Logs Table Growth**:
```bash
# Check size weekly
SELECT COUNT(*) as search_count FROM search_logs;

# If > 1 million rows, consider archiving
```

**Error Tracking Integration**:
```javascript
// Wire up to error tracking service (Sentry, etc.)
try {
  const results = await searchProjects(query);
} catch (err) {
  Sentry.captureException(err, {
    tags: { feature: 'phase2a_search' }
  });
}
```

### Alerts to Set Up

**High Priority Alerts**:
1. Search API response time > 500ms
2. Search API error rate > 1%
3. Database search_logs table > 50GB
4. Autocomplete timeout frequency > 10/hour

**Medium Priority Alerts**:
1. Search API response time > 200ms
2. Saved filters count > 10,000 per user
3. Average autocomplete results < 1

### Maintenance Schedule

**Daily**:
- Monitor API logs for errors
- Check error tracking dashboard

**Weekly**:
- Review search performance metrics
- Check search_logs table growth
- Look for slow queries in logs

**Monthly**:
- Archive old search logs (> 90 days)
- Optimize indexes if needed
- Review most popular searches
- Update performance baseline

**Quarterly**:
- Review customization opportunities
- Consider UI/UX improvements
- Plan next phase features

---

## Part 9: Rollback Instructions

### Emergency Rollback Procedure

If Phase 2A causes issues, follow these steps to roll back:

**Step 1: Stop the Application**
```bash
# Stop dev server or application
npm stop
# or
systemctl stop solartrack-pro
```

**Step 2: Revert Code Changes**

Remove search-related code from main files:

**Option A: Quick Rollback (Minimal)**
```bash
# Comment out search route in App.jsx
# Comment out GlobalSearchBar in Layout.jsx
# Remove import statements

# Restart
npm start
```

**Option B: Full Rollback (Git)**
```bash
# If using git (recommended)
git revert HEAD~N  # N = number of commits to revert

# Or reset to previous commit
git reset --hard <previous-commit-hash>
```

**Step 3: Keep Database Tables**

**DO NOT DELETE** these tables (they are backward compatible):
- search_logs
- saved_filters

These tables will not cause issues if left in place.

**Step 4: Restart Application**
```bash
npm start
# or
systemctl start solartrack-pro
```

**Verification Steps**:
- [ ] Application starts without errors
- [ ] No search functionality visible
- [ ] Other features work normally
- [ ] No console errors

### Partial Rollback (Keep Some Features)

If only certain features are problematic:

**Keep Search, Remove Filters**:
```javascript
// In App.jsx, keep SearchPage route
// In AdvancedFilterPanel.jsx, disable filter application
// Keep databases tables
```

**Keep Filters, Remove Search**:
```javascript
// In App.jsx, remove SearchPage route
// In Layout.jsx, remove GlobalSearchBar
// Keep database tables for future use
```

**Timeline**:
- Rollback decision: < 5 minutes
- Code changes: < 5 minutes
- Server restart: < 2 minutes
- Verification: < 5 minutes
- **Total**: ~15 minutes for full rollback

---

## Part 10: Post-Deployment Checklist

### Immediate (Within 1 hour)
- [ ] All deployment files copied correctly
- [ ] No console errors in browser
- [ ] Search bar visible and clickable
- [ ] Search page accessible at /search
- [ ] Database tables created
- [ ] Environment variables configured
- [ ] Dev server restarted (if using dev mode)

### First Day
- [ ] Basic search functionality works
- [ ] Autocomplete showing suggestions
- [ ] Filters applying correctly
- [ ] Save filter functionality works
- [ ] Search history logging
- [ ] No performance degradation noted
- [ ] Mobile view tested

### First Week
- [ ] Monitor error logs daily
- [ ] Performance metrics within acceptable range
- [ ] User feedback collected
- [ ] Any bugs logged and prioritized
- [ ] Performance baseline established

### One Month
- [ ] Archive old search logs
- [ ] Review usage statistics
- [ ] Optimize slow queries if needed
- [ ] Plan for Phase 2B features
- [ ] Document any customizations made

---

## Part 11: Support & Contact

**Issues or Questions?**

1. **Technical Issues**: Check troubleshooting section above
2. **Performance Problems**: Enable VITE_SEARCH_PERFORMANCE_DEBUG=true
3. **Database Issues**: Run database verification queries
4. **Component Errors**: Check browser console for detailed error messages

**Common Issues Quick Reference**:
```
Search not working?
  → Check .env.local configuration
  → Verify database tables exist
  → Check browser console for errors

Slow performance?
  → Check database indexes
  → Reduce VITE_SEARCH_RESULT_LIMIT
  → Increase VITE_SEARCH_DEBOUNCE_MS

Autocomplete not showing?
  → Check search_logs table has data
  → Verify API endpoint
  → Check network tab in DevTools
```

---

## Appendix: Configuration Reference

### Environment Variables Reference
```bash
VITE_SEARCH_RESULT_LIMIT=20                 # Results per page
VITE_SEARCH_AUTOCOMPLETE_LIMIT=5            # Suggestions shown
VITE_SEARCH_TIMEOUT_MS=5000                 # Query timeout
VITE_SEARCH_HISTORY_DAYS=90                 # History retention
VITE_SEARCH_DEBOUNCE_MS=300                 # Input debounce
VITE_SEARCH_PERFORMANCE_DEBUG=false         # Enable logging
VITE_SEARCH_API_URL=http://localhost:3000/api/search
```

### Database Schema Reference

**search_logs**:
- id (INT, PK)
- user_id (INT, FK)
- query (VARCHAR 255)
- result_count (INT)
- execution_time_ms (INT)
- created_at (TIMESTAMP)

**saved_filters**:
- id (INT, PK)
- user_id (INT, FK)
- filter_name (VARCHAR 100)
- filter_config (JSON)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Component File Reference

| File | Purpose | Key Props |
|------|---------|-----------|
| GlobalSearchBar | Search input in header | onSearch, placeholder |
| SearchPage | Main search interface | N/A (uses route params) |
| AdvancedFilterPanel | Filter configuration | onApply, onReset |
| SearchResultsCard | Individual result item | result, onClick |
| SavedFiltersList | Saved filter display | filters, onLoad, onDelete |
| SearchSuggestions | Autocomplete dropdown | suggestions, onSelect |

---

**Document Version**: 2.0  
**Last Updated**: April 15, 2026  
**Next Review**: May 15, 2026  
**Status**: Production Ready
