# Phase 2A: Advanced Search & Filtering Integration Test Plan

**Version**: 1.0  
**Date**: April 15, 2026  
**Test Status**: Ready for Execution  
**Target Application**: SolarTrack Pro v2.0  

---

## Executive Summary

This document defines comprehensive test scenarios for Phase 2A deployment. All tests should pass before production deployment. Tests cover functionality, performance, accessibility, and mobile responsiveness.

**Total Test Scenarios**: 15  
**Estimated Test Duration**: 45-60 minutes (manual testing)  
**Automated Test Coverage**: 8 scenarios  
**Manual Test Coverage**: 7 scenarios  

---

## Pre-Test Requirements

### Environment Setup

- [ ] SolarTrack Pro application deployed with Phase 2A code
- [ ] All service files copied to src/lib/
- [ ] All component files copied to src/components/
- [ ] SearchPage.jsx copied to src/pages/
- [ ] Database tables created (search_logs, saved_filters)
- [ ] Indexes added to projects table
- [ ] .env.local configured with Phase 2A variables
- [ ] Dev server running or application started
- [ ] Test browser has developer tools enabled
- [ ] Test data in projects table (minimum 50 records)
- [ ] Clear test user account created
- [ ] Browser cache cleared

### Test User Account

```
Email: test.phase2a@example.com
Password: TestPhase2APassword123!
Role: Regular User
Projects: Should have access to at least 10 projects
```

### Test Data Preparation

**Required Test Projects**:
```sql
-- Ensure these test projects exist
SELECT COUNT(*) FROM projects;
-- Should return >= 50

-- Verify various statuses
SELECT DISTINCT status FROM projects LIMIT 10;
-- Should include: EXE, DONE, STALLED, CANCELLED

-- Verify various names for search
SELECT name FROM projects LIMIT 20;
-- Should include terms like: "solar", "wind", "battery", "grid"
```

---

## Test Scenario 1: Global Search Bar Display

### Test Objective
Verify that the Global Search Bar is properly integrated into the application layout and is immediately visible to users.

### Test Steps

1. **Navigate to Application**
   - Open browser to application root URL (http://localhost:3000)
   - You should be redirected to login if not authenticated
   - Log in with test user account

2. **Verify Search Bar Presence**
   - After login, you should be on the Dashboard
   - Look at the header section (top of page)
   - The search bar should be visible and prominent

3. **Check Search Bar Properties**
   - Search bar should be accessible (not hidden behind other elements)
   - Search bar should have placeholder text (e.g., "Search projects...")
   - Search bar should have a clear/reset button (X icon)
   - Search bar should not overflow or cause layout issues

4. **Test Search Bar Visibility on Different Pages**
   - Click on "Projects" in navigation
   - Search bar should still be visible
   - Click on "Dashboard"
   - Search bar should still be visible
   - Click on "Settings" (if available)
   - Search bar should still be visible

5. **Responsive Design Check**
   - Open browser DevTools (F12)
   - Toggle Device Toolbar (Ctrl+Shift+M)
   - Set viewport to 320px (mobile)
   - Search bar should still be visible and usable
   - Set viewport to 1920px
   - Search bar should scale appropriately

### Expected Results

- [ ] Search bar appears in header on all pages
- [ ] Search bar is not overlapped by other elements
- [ ] Search bar is visible on mobile (320px) and desktop (1920px)
- [ ] Placeholder text is clear and helpful
- [ ] No console errors when page loads
- [ ] Search bar receives focus when clicked
- [ ] Layout does not shift when search bar is focused

### Pass/Fail Criteria

**PASS**: All checkpoints are met and search bar is functional  
**FAIL**: Search bar is missing, hidden, or causes layout issues  

### Notes for Tester
- Take a screenshot showing search bar in header for documentation
- Test on at least 2 different browsers (Chrome and Firefox recommended)
- Note any CSS issues or visual glitches

---

## Test Scenario 2: Autocomplete Suggestions Display

### Test Objective
Verify that typing in the search bar displays real-time autocomplete suggestions from recent searches and project names.

### Test Steps

1. **Click on Search Bar**
   - Navigate to any page with search bar visible
   - Click on search input field
   - Autocomplete dropdown should appear below search bar

2. **Display Initial Suggestions**
   - Before typing, dropdown should show:
     - "Recent Searches" section (if any previous searches)
     - "Popular Searches" section (if data available)
     - "Tips" or help text
   - Dropdown should not show search results (only suggestions)

3. **Type Single Character**
   - Type "s" in search field
   - Autocomplete suggestions should appear
   - Should include project names or suggestions starting with "s"
   - Should show maximum 5 suggestions (configurable)

4. **Type Multiple Characters**
   - Clear field and type "sol"
   - Suggestions should filter to match "sol"
   - Should show projects with "sol" in name (e.g., "solar", "solace")
   - Suggestions should update in real-time (debounced ~300ms)

5. **Test Autocomplete Selection**
   - With suggestions visible, click on one suggestion
   - Search bar should populate with that suggestion
   - Page should navigate to search results

6. **Test Keyboard Navigation**
   - Clear field and type "test"
   - Press Down arrow key
   - First suggestion should be highlighted
   - Press Down arrow again
   - Second suggestion should be highlighted
   - Press Up arrow
   - Previous suggestion should be highlighted
   - Press Enter
   - That suggestion should be selected

7. **Test Escape Key**
   - With dropdown visible, press Escape
   - Dropdown should close
   - Text in search field should remain

### Expected Results

- [ ] Autocomplete dropdown appears when search bar is focused
- [ ] Suggestions appear as user types
- [ ] Suggestions are relevant to search term
- [ ] Maximum 5 suggestions shown (or configured limit)
- [ ] Suggestions update in real-time
- [ ] Keyboard navigation works (arrow keys, Enter)
- [ ] Escape key closes dropdown
- [ ] Clicking suggestion navigates to search page
- [ ] No console errors during autocomplete

### Pass/Fail Criteria

**PASS**: Autocomplete displays correctly and is fully functional  
**FAIL**: Autocomplete doesn't appear, suggestions are irrelevant, or keyboard navigation doesn't work  

### Performance Requirement
- Suggestions should appear within 300ms of user stopping typing
- Autocomplete API calls should complete within 100ms

### Notes for Tester
- Test with both keyboard and mouse input
- Verify that first search query populates history for future tests
- Test with special characters (e.g., "@", "#", spaces)

---

## Test Scenario 3: Search Navigation to Results Page

### Test Objective
Verify that pressing Enter in search bar navigates to search results page with correct query parameter.

### Test Steps

1. **Prepare for Search**
   - From any page, click on search bar
   - Type "solar" in search field
   - Verify autocomplete shows suggestions

2. **Submit Search Query**
   - Press Enter key
   - Page should navigate to /search route
   - URL should include query parameter: /search?q=solar
   - Page should show search results

3. **Verify URL**
   - Check browser address bar
   - URL should be: http://localhost:3000/search?q=solar
   - Special characters should be URL-encoded
   - Multiple word queries should be encoded (spaces as %20)

4. **Test Different Search Terms**
   - Go back to search bar
   - Search for "battery"
   - URL should update to /search?q=battery
   - Results should show projects with "battery"
   - Go back and search for "grid power"
   - URL should show /search?q=grid%20power
   - Results should show projects matching both terms

5. **Test Empty Search**
   - Clear search bar
   - Press Enter
   - Should either show all projects or "no results" message
   - Should not crash or show error

### Expected Results

- [ ] Pressing Enter navigates to /search page
- [ ] URL includes query parameter
- [ ] Query parameter is properly URL-encoded
- [ ] Search results display for the query
- [ ] Results are relevant to search term
- [ ] Navigating back and re-searching works
- [ ] No console errors

### Pass/Fail Criteria

**PASS**: Search navigation works correctly with proper URL encoding  
**FAIL**: Navigation fails, URL is incorrect, or results are irrelevant  

### Notes for Tester
- Test with 3-5 different search terms
- Verify URL encoding for special characters
- Check that browser back button returns to previous page

---

## Test Scenario 4: Search Results Display

### Test Objective
Verify that the search results page correctly displays projects matching the search query.

### Test Steps

1. **Navigate to Search Results**
   - Follow Test Scenario 3 to reach search page with query
   - Page should load successfully
   - Should display "Results for: solar" or similar

2. **Verify Results Layout**
   - Results should display as cards or list items
   - Each result should show:
     - Project name/title
     - Brief description or summary
     - Project status (EXE, DONE, etc.)
     - Last modified date
     - Click to navigate link

3. **Verify Result Relevance**
   - Search for "solar"
   - All displayed results should contain "solar" in name or description
   - Results should be sorted by relevance (best matches first)
   - No unrelated projects should appear

4. **Test Result Count Display**
   - Search results should show count: "23 results found"
   - Count should be accurate
   - When no results match, display "No projects found for 'xyz'"

5. **Test Result Pagination**
   - If results > 20 (limit), pagination controls should appear
   - "Next" button should show next page
   - "Previous" button should show previous page
   - Current page number should be displayed
   - Clicking page number should load that page

6. **Test Result Click Navigation**
   - Click on a result card
   - Should navigate to project details page
   - URL should be /projects/[id]
   - Project details should display correct project

7. **Test Loading State**
   - Search for a new term
   - Loading spinner should briefly appear
   - Results should then display
   - Should complete within 2 seconds

### Expected Results

- [ ] Search results display correctly
- [ ] Each result shows name, description, status, date
- [ ] Results are relevant to search query
- [ ] Result count is accurate
- [ ] Pagination works if needed
- [ ] Clicking result navigates to project
- [ ] No console errors
- [ ] Loading state shows during search

### Performance Requirement
- Search results should display within 1-2 seconds
- Each page load should complete within 100ms

### Pass/Fail Criteria

**PASS**: Search results display correctly with accurate, relevant matches  
**FAIL**: Results are missing, irrelevant, or page fails to load  

### Notes for Tester
- Verify at least 3 different search terms
- Test pagination with search term that returns > 20 results
- Test clicking multiple results

---

## Test Scenario 5: Advanced Filter Panel Display

### Test Objective
Verify that the Advanced Filter Panel opens, displays filter options, and is properly positioned.

### Test Steps

1. **Navigate to Search Page**
   - Go to /search (with any query or without)
   - Search page should display

2. **Locate Filters Button**
   - Look for "Filters" button or icon
   - Button should be clearly visible
   - Button should be near search bar or results

3. **Click Filters Button**
   - Click on Filters button
   - Filter panel should appear
   - Panel should slide in from left or appear as modal
   - Should not cover search results

4. **Verify Filter Options**
   - Filter panel should show:
     - [ ] Status filter (checkboxes for EXE, DONE, STALLED, CANCELLED)
     - [ ] Date range picker (From date - To date)
     - [ ] Project type selector
     - [ ] Additional custom filters (if configured)

5. **Check Filter Panel Layout**
   - Filter panel should be scrollable if many options
   - Filter panel should have clear section headers
   - Filter panel should have Apply and Reset buttons
   - Filter panel should close when clicking outside (if modal)

6. **Test Responsive Design**
   - On desktop (1920px), filter panel should appear as sidebar
   - On tablet (768px), filter panel should appear as drawer or modal
   - On mobile (320px), filter panel should be full-width modal
   - Should not obstruct search functionality

### Expected Results

- [ ] Filter panel opens when Filters button is clicked
- [ ] Filter panel shows all expected filter options
- [ ] Filter panel is properly positioned (sidebar or modal)
- [ ] Filter panel is scrollable if needed
- [ ] Apply and Reset buttons are visible
- [ ] Filter panel closes when clicking outside
- [ ] No console errors

### Pass/Fail Criteria

**PASS**: Filter panel opens and displays all filter options correctly  
**FAIL**: Filter panel doesn't open, options missing, or poor layout  

### Notes for Tester
- Check appearance on mobile and desktop
- Verify that filter panel doesn't cover important UI elements
- Test scroll functionality if many filters

---

## Test Scenario 6: Apply Advanced Filters

### Test Objective
Verify that applying filters to search results correctly filters the displayed projects.

### Test Steps

1. **Open Filter Panel**
   - Navigate to /search with a broad query (e.g., "solar" or "project")
   - Click Filters button
   - Filter panel should open

2. **Select Status Filter**
   - In filter panel, find Status section
   - Check "EXE" checkbox
   - Leave other status options unchecked

3. **Apply Filters**
   - Click "Apply" button
   - Filter panel should close
   - Results should reload
   - Only projects with status="EXE" should display
   - Result count should update (likely smaller number)

4. **Test Multiple Filters**
   - Click Filters again
   - Check "EXE" and "DONE" statuses
   - Set date range: Last 30 days
   - Click Apply
   - Results should only show EXE or DONE projects from last 30 days
   - This tests AND/OR logic

5. **Test Filter Clearing**
   - With filters applied, click Filters
   - Click "Reset" button
   - All checkboxes should uncheck
   - Click Apply
   - Results should show all projects again (no filters)

6. **Test Filter Persistence During Search**
   - Apply a filter (e.g., status="EXE")
   - With filter still applied, type new search term in search bar
   - Press Enter
   - New search results should still have the filter applied
   - Only EXE projects matching new search should show

7. **Test Complex Filter Combinations**
   - Apply: Status = EXE, Date = Last 90 days, Type = Solar
   - Click Apply
   - Results should match all three criteria
   - Manually verify a result matches all criteria

### Expected Results

- [ ] Filter is applied when Apply button is clicked
- [ ] Results update to show only filtered projects
- [ ] Result count decreases when filters applied
- [ ] Multiple filters work together (AND logic)
- [ ] Reset button clears all filters
- [ ] Filters persist during new searches
- [ ] No console errors
- [ ] Loading state shows while filtering

### Performance Requirement
- Filters should apply within 200ms
- Results should update within 1 second

### Pass/Fail Criteria

**PASS**: Filters apply correctly and results update as expected  
**FAIL**: Filters don't apply, results don't update, or logic is wrong  

### Notes for Tester
- Test at least 3 different filter combinations
- Verify result count changes appropriately
- Check that unfiltered results include more items than filtered

---

## Test Scenario 7: Save and Load Filter

### Test Objective
Verify that users can save filter configurations and load them later.

### Test Steps

1. **Apply a Filter**
   - Navigate to /search
   - Open filter panel
   - Select: Status = "EXE"
   - Set date range: Last 30 days
   - Click Apply

2. **Save Filter**
   - Results should now be filtered
   - Look for "Save Filter" button
   - Button should appear on results page
   - Click "Save Filter"

3. **Name the Filter**
   - Dialog box should appear asking for filter name
   - Enter name: "Active Recent Projects"
   - Click "Save" in dialog

4. **Verify Filter Saved**
   - Filter should be saved
   - Dialog should close
   - "Saved Filters" list should appear or update
   - "Active Recent Projects" should appear in the list

5. **Clear Current Filters**
   - Click Filters
   - Click Reset
   - Click Apply
   - Results should show all projects again

6. **Load Saved Filter**
   - In "Saved Filters" section, click on "Active Recent Projects"
   - Filter should apply immediately
   - Results should show only EXE projects from last 30 days
   - Same filtered results as before should appear

7. **Test Multiple Saved Filters**
   - Save current filter as "Active Projects"
   - Clear filters and apply different ones
   - Save as "Stalled Projects"
   - Verify both filters appear in list
   - Click each to verify they load correctly

8. **Test Saved Filters Persistence**
   - Save a filter
   - Close browser tab completely
   - Open application again
   - Navigate to /search
   - Saved filter should still appear in list
   - Click to load it
   - Should work as expected

9. **Test Delete Saved Filter**
   - Open "Saved Filters" list
   - Find a saved filter
   - Look for delete/remove button
   - Click to delete
   - Filter should be removed from list
   - Confirm delete if prompted

### Expected Results

- [ ] "Save Filter" button appears after filtering
- [ ] Filter name dialog is clear and user-friendly
- [ ] Saved filter appears in "Saved Filters" list
- [ ] Clicking saved filter applies it immediately
- [ ] Multiple filters can be saved
- [ ] Saved filters persist across sessions
- [ ] Delete button removes filter from list
- [ ] No console errors

### Pass/Fail Criteria

**PASS**: Filters can be saved, loaded, and deleted correctly  
**FAIL**: Saving fails, filters don't load, or persistence is broken  

### Notes for Tester
- Test with at least 2 different filter combinations
- Verify persistence by closing and reopening browser
- Try to save filter with duplicate name (should error)
- Test on different browser/device if possible

---

## Test Scenario 8: Search History

### Test Objective
Verify that search queries are logged and accessible in search history dropdown.

### Test Steps

1. **Perform Initial Search**
   - Click search bar
   - Type "solar"
   - Press Enter
   - Page should navigate to search results

2. **View Search History After First Search**
   - Click search bar again
   - Dropdown should appear
   - May not show search yet (depends on implementation)

3. **Perform Multiple Searches**
   - Search for "wind"
   - Return to search bar, search for "battery"
   - Return to search bar, search for "grid"
   - Return to search bar, search for "power"

4. **View Complete Search History**
   - Click search bar
   - Dropdown should show section "Recent Searches"
   - Should list: "power", "grid", "battery", "wind", "solar" (in reverse order)
   - Should show up to 10 recent searches

5. **Click History Item**
   - In search history, click on "battery"
   - Search bar should populate with "battery"
   - Should navigate to search results for "battery"
   - URL should show /search?q=battery

6. **Test History Limit**
   - Perform 15 more searches with different terms
   - View search history
   - Should show maximum 10 items (oldest removed)
   - Very old searches should not appear

7. **Test History Persistence**
   - Close browser entirely
   - Reopen application
   - Click search bar
   - Search history should be preserved
   - Recent searches should still show

### Expected Results

- [ ] Searches are logged to history
- [ ] Search history appears in dropdown
- [ ] Recent searches listed in reverse chronological order
- [ ] Maximum 10 searches shown
- [ ] Clicking history item repeats search
- [ ] History persists across sessions
- [ ] Very old searches removed automatically
- [ ] No console errors

### Pass/Fail Criteria

**PASS**: Search history displays correctly and is persistent  
**FAIL**: History doesn't appear, doesn't persist, or is limited incorrectly  

### Notes for Tester
- Perform at least 5 searches before checking history
- Test persistence by closing browser
- Verify old searches are eventually removed (may check next day)

---

## Test Scenario 9: Keyboard Shortcuts

### Test Objective
Verify that keyboard shortcuts enhance user experience for quick search access.

### Test Steps

1. **Test Forward Slash Shortcut**
   - From any page in application (e.g., Dashboard)
   - Press "/" key
   - Search bar should receive focus
   - Cursor should be in search input field
   - Typing should immediately show suggestions

2. **Test Forward Slash on Multiple Pages**
   - Navigate to /projects page
   - Press "/"
   - Search bar should focus
   - Navigate to a project details page
   - Press "/"
   - Search bar should focus (if visible)

3. **Test Escape to Unfocus**
   - Focus search bar by pressing "/"
   - Type something
   - Press Escape
   - Search bar should unfocus
   - Text should remain in search bar

4. **Test Enter to Submit**
   - Focus search bar using "/"
   - Type "test"
   - Press Enter
   - Should navigate to /search?q=test

5. **Test Keyboard Navigation in Autocomplete**
   - Press "/" to focus search
   - Type "a"
   - Press Down arrow
   - First suggestion should highlight
   - Press Down again
   - Second suggestion should highlight
   - Press Up arrow
   - Return to first suggestion
   - Press Enter
   - That suggestion should be selected

6. **Test Tab Navigation**
   - Press Tab to navigate through page elements
   - Search bar should be in tab order (not skipped)
   - When search bar has focus, Tab should move to next element
   - Shift+Tab should move to previous element

### Expected Results

- [ ] "/" key focuses search bar from any page
- [ ] Keyboard navigation works (arrows, Enter, Escape, Tab)
- [ ] No conflicts with other keyboard shortcuts
- [ ] Keyboard shortcuts work on desktop
- [ ] No console errors

### Pass/Fail Criteria

**PASS**: Keyboard shortcuts function correctly and enhance usability  
**FAIL**: Shortcuts don't work, cause errors, or conflict with other functionality  

### Notes for Tester
- Test on different pages and with different content loaded
- Verify no conflicts with browser shortcuts (Ctrl+F, etc.)
- Test on different browsers (may behave differently)

---

## Test Scenario 10: Mobile Responsiveness

### Test Objective
Verify that Phase 2A search functionality works properly on mobile devices and tablets.

### Test Steps

### Mobile (320px width - iPhone SE)

1. **Open App on Mobile Size**
   - Open DevTools (F12)
   - Toggle device toolbar (Ctrl+Shift+M)
   - Set to iPhone SE (375px) or similar
   - Load application

2. **Test Mobile Search Bar**
   - Search bar should be visible
   - Should not cause overflow
   - Should be full-width or nearly full-width
   - Should be easily tappable (at least 44px tall)

3. **Test Mobile Autocomplete**
   - Tap search bar
   - Type search term
   - Autocomplete should appear below
   - Should not overlay keyboard
   - Should be scrollable if many results

4. **Test Mobile Filter Panel**
   - Navigate to /search
   - Tap "Filters" button
   - Filter panel should appear
   - Should be full-width or nearly full-width
   - Should be modal (overlay on results)
   - Should have close button
   - Should be scrollable

5. **Test Mobile Results**
   - Search for something
   - Results should display
   - Each result card should fit screen width
   - Should scroll smoothly
   - Should not require horizontal scroll

6. **Test Mobile Keyboard**
   - When search bar focused, mobile keyboard should appear
   - Keyboard should not block too much content
   - Should be able to see suggestions while typing

### Tablet (768px width - iPad)

1. **Set Viewport to Tablet Size**
   - Toggle device toolbar
   - Set to iPad (768px width)

2. **Test Tablet Layout**
   - Search bar should display nicely
   - Filter panel could be sidebar or modal
   - Results should display in columns if possible
   - Layout should adapt from mobile

3. **Test Tablet Interaction**
   - All tap targets should be >= 44px
   - No hover-only interactions
   - Keyboard should be usable

### Desktop (1920px width - Large Monitor)

1. **Set Viewport to Large Desktop**
   - Toggle device toolbar
   - Set to 1920px width

2. **Test Desktop Layout**
   - Search bar should display at reasonable width
   - Filter panel should appear as sidebar
   - Results should display in optimal columns
   - No excessive whitespace

### Expected Results

- [ ] Search functionality works on mobile (320px)
- [ ] Search bar is accessible and easily tappable
- [ ] Autocomplete displays properly on mobile
- [ ] Filter panel is usable on mobile
- [ ] Results display and scroll smoothly
- [ ] No horizontal scrolling needed
- [ ] Layout adapts from mobile to tablet to desktop
- [ ] Keyboard interaction works on all sizes
- [ ] No console errors across all sizes

### Pass/Fail Criteria

**PASS**: Application is fully responsive and usable on all device sizes  
**FAIL**: Layout breaks on any device size or interactions fail  

### Performance Requirement
- Mobile page should load within 3 seconds
- Results should display within 2 seconds
- Filtering should complete within 500ms

### Notes for Tester
- Test on actual mobile device if possible
- Test both portrait and landscape orientations
- Check touch interactions work (no hover states only)
- Verify no horizontal scrolling needed

---

## Test Scenario 11: Accessibility Testing

### Test Objective
Verify that Phase 2A features are accessible to users with disabilities.

### Test Steps

### Keyboard Navigation

1. **Tab Through Elements**
   - Load application
   - Press Tab repeatedly
   - Should navigate through:
     - Search bar
     - Navigation menu items
     - Filters button
     - Result cards
     - Pagination controls
   - All interactive elements should be reachable

2. **Focus Indicators**
   - Tab to each element
   - Each should have visible focus indicator
   - Focus should not be invisible or unclear
   - Color contrast should meet WCAG AA standard

3. **Keyboard Submit**
   - Focus on search bar (Tab or "/")
   - Type query
   - Press Enter
   - Should navigate to results (not require mouse)

### Screen Reader Testing

1. **Setup Screen Reader**
   - Use NVDA (Windows) or JAWS (if available)
   - Enable screen reader
   - Reload application

2. **Navigate with Screen Reader**
   - Listen to page announcement
   - Should announce page title/purpose
   - Navigate with arrow keys
   - Search bar should be announced
   - All form labels should be announced
   - Buttons should be announced with purpose

3. **Read Search Results**
   - Search for something
   - Use screen reader to navigate results
   - Each result should be readable
   - Project name should be announced
   - Description should be available
   - Status should be announced

### Color Contrast

1. **Check Text Contrast**
   - Use Chrome DevTools accessibility panel
   - Inspect search bar text
   - Inspect filter labels
   - Inspect result cards
   - All text should meet WCAG AA (4.5:1 ratio)

2. **Check for Color-Only Information**
   - Look at status badges
   - Status should not be indicated by color alone
   - Should have text or icon indicator too

### Form Labels and Instructions

1. **Verify Form Labels**
   - Search bar should have associated label
   - Filter inputs should have labels
   - Labels should be visible or have aria-label

2. **Check Instructions**
   - Autocomplete behavior should be explained
   - Filter logic should be clear
   - Error messages should be clear and actionable

### Expected Results

- [ ] All elements reachable via keyboard Tab
- [ ] All elements have visible focus indicators
- [ ] Screen reader announces all content
- [ ] Form labels present and associated
- [ ] Text color contrast meets WCAG AA
- [ ] No color-only information indicators
- [ ] Error messages are clear and helpful
- [ ] No accessibility errors in DevTools

### Pass/Fail Criteria

**PASS**: All accessibility requirements met  
**FAIL**: Any WCAG AA violations or keyboard navigation failures  

### Accessibility Standards
- WCAG 2.1 Level AA compliance required
- Keyboard navigation essential for all features
- Screen reader support for core functionality

### Notes for Tester
- May require accessibility testing specialist
- Use Chrome DevTools Lighthouse audit
- Consider user with screen reader
- Test with keyboard-only (no mouse)

---

## Test Scenario 12: Performance Testing

### Test Objective
Verify that Phase 2A features perform within acceptable time limits.

### Test Steps

### Search Query Performance

1. **Measure Search Time**
   - Open DevTools (F12)
   - Go to Performance or Network tab
   - Click in search bar
   - Type "solar"
   - Press Enter
   - Note time from press to results displayed
   - Should be < 2 seconds

2. **Measure Autocomplete Response**
   - Open Performance tab
   - Click search bar
   - Start recording
   - Type "s"
   - Stop recording
   - Check time from keystroke to suggestions shown
   - Should be < 300ms (debounce time)

3. **Measure Filter Application**
   - Open Performance tab
   - Start recording
   - Click Filters, apply a filter
   - Stop recording
   - Check time from click to results updated
   - Should be < 500ms

4. **Measure Page Load**
   - Clear browser cache
   - Go to /search
   - Note time to fully loaded
   - Should be < 3 seconds

### Database Query Performance

1. **Monitor Network Requests**
   - Open Network tab in DevTools
   - Search for a query
   - Click on API request (/api/search or similar)
   - Check request size and response time
   - Response should be < 100ms

2. **Check Query in Database**
   - Access database directly (if possible)
   - Run search query manually
   - Check EXPLAIN plan
   - Should use indexes (not full table scans)
   - Query should complete < 100ms

### Memory Performance

1. **Check Memory Usage**
   - Open Memory tab in DevTools
   - Take heap snapshot before searching
   - Perform 10 searches
   - Take another heap snapshot
   - Memory should not increase significantly
   - No memory leaks (memory should stabilize)

2. **Check Component Rendering**
   - Open React DevTools (if available)
   - Perform search
   - Check component renders
   - Should not have excessive re-renders
   - Results should update efficiently

### Load Testing

1. **Simulate Multiple Users**
   - If load testing tool available (Apache JMeter, etc.)
   - Simulate 10 concurrent users searching
   - Application should remain responsive
   - No errors should occur
   - Response times should stay under limits

### Expected Results

- [ ] Search query completes < 2 seconds
- [ ] Autocomplete suggestions appear < 300ms
- [ ] Filter application completes < 500ms
- [ ] Page load completes < 3 seconds
- [ ] API responses < 100ms
- [ ] No memory leaks detected
- [ ] Stable memory usage with multiple searches
- [ ] No console warnings or errors

### Pass/Fail Criteria

**PASS**: All performance metrics within acceptable limits  
**FAIL**: Any metric exceeds limit or performance degrades  

### Performance Baselines

| Metric | Target | Acceptable | Warning |
|--------|--------|-----------|---------|
| Search Query | < 100ms | < 1s | < 2s |
| Autocomplete | < 50ms | < 300ms | < 500ms |
| Filter Apply | < 200ms | < 500ms | < 1s |
| Page Load | < 1s | < 2s | < 3s |
| API Response | < 100ms | < 300ms | < 500ms |

### Notes for Tester
- Use Chrome DevTools Performance tab for detailed analysis
- Test on slower network (Chrome > Network > Throttling)
- Test on mid-range device to identify bottlenecks
- Monitor browser console for warnings

---

## Test Scenario 13: Browser Compatibility

### Test Objective
Verify that Phase 2A works across different browsers and versions.

### Test Steps

**Test Matrix**:

| Browser | Versions | Status |
|---------|----------|--------|
| Chrome | Latest, -1 | Required |
| Firefox | Latest, -1 | Required |
| Safari | Latest, -1 | Required |
| Edge | Latest, -1 | Required |
| Mobile Safari | iOS 14+ | Required |
| Chrome Mobile | Android 10+ | Required |

### Chrome (Latest and Previous Version)

1. **Install Test Versions**
   - Have latest Chrome installed
   - Install previous version if possible

2. **Test Phase 2A Features**
   - [ ] Global search bar appears
   - [ ] Autocomplete works
   - [ ] Search navigation works
   - [ ] Filters apply correctly
   - [ ] Saved filters work
   - [ ] Search history displays
   - [ ] No console errors
   - [ ] No visual glitches

### Firefox (Latest and Previous Version)

Repeat Chrome tests in Firefox

### Safari (Latest and Previous Version)

Repeat Chrome tests in Safari  
Special attention to:
- [ ] Date picker works (can be tricky)
- [ ] Autocomplete dropdown positions correctly
- [ ] CSS animations/transitions smooth

### Edge (Latest)

Repeat Chrome tests in Edge

### Mobile Safari (iOS)

1. **Test on iPhone or iPad Simulator**
   - Xcode simulator or BrowserStack
   - [ ] Touch interactions work
   - [ ] Keyboard input works
   - [ ] Layout is responsive
   - [ ] Autocomplete displays properly
   - [ ] Filters work with touch

### Chrome Mobile (Android)

1. **Test on Android Simulator or Device**
   - Android Emulator or real device
   - [ ] All features work
   - [ ] Touch interactions responsive
   - [ ] Keyboard works
   - [ ] Layout appropriate for screen

### Expected Results

- [ ] All features work in all tested browsers
- [ ] No major visual differences
- [ ] No console errors in any browser
- [ ] Performance acceptable in all browsers
- [ ] Mobile browsers fully functional

### Pass/Fail Criteria

**PASS**: Core functionality works in all tested browsers  
**FAIL**: Features broken or unusable in any browser  

### Known Issues

Document any browser-specific issues:
```
Browser: Safari 14
Issue: Date picker doesn't show in filter
Workaround: Use text input for date
Status: Will fix in v2.1
```

### Notes for Tester
- Use BrowserStack or similar for cross-browser testing
- Test actual devices if possible (simulators not perfect)
- Document any subtle differences

---

## Test Scenario 14: Error Handling

### Test Objective
Verify that Phase 2A handles errors gracefully and provides helpful messages.

### Test Steps

### Network Error Handling

1. **Test Search with Network Error**
   - Open DevTools Network tab
   - Check "Offline" mode
   - Try to search
   - Should show friendly error message
   - Error message should suggest action (try again, check connection)

2. **Test Autocomplete Network Failure**
   - Go offline in DevTools
   - Click search bar
   - Type something
   - Should handle error gracefully
   - Should not show technical error to user

### Database Error Handling

1. **Test Missing Database Tables** (if possible)
   - Drop search_logs table temporarily
   - Try to search
   - Should show user-friendly error
   - Should suggest checking database
   - Should not crash

2. **Test Slow Database**
   - In .env.local, reduce VITE_SEARCH_TIMEOUT_MS to 500
   - Perform search
   - Should timeout gracefully
   - Should show "Search took too long" message
   - Should not hang indefinitely

### Input Validation

1. **Test Special Characters**
   - Search for: `<script>alert('xss')</script>`
   - Should be handled safely (not executed)
   - Results should be empty or handle gracefully

2. **Test Very Long Query**
   - Search for: 500 character string
   - Should handle gracefully
   - Should either truncate or handle in DB

3. **Test Empty Query**
   - Clear search bar
   - Press Enter
   - Should either show all projects or friendly "no results"
   - Should not crash

### Missing or Invalid Data

1. **Test Missing Project Fields**
   - If project name is null (shouldn't happen)
   - Result card should still display
   - Should show placeholder or default value

2. **Test Invalid Filter Values**
   - Directly edit filter config in URL
   - Example: /search?filter=invalid_status
   - Should handle gracefully
   - Should not apply invalid filter

### Expected Results

- [ ] Network errors show friendly messages
- [ ] Database errors handled gracefully
- [ ] Special characters handled safely (no XSS)
- [ ] Long queries don't crash
- [ ] Empty queries don't crash
- [ ] Missing data doesn't break display
- [ ] Invalid data handled appropriately
- [ ] No technical error messages shown to user

### Pass/Fail Criteria

**PASS**: All errors handled gracefully with helpful messages  
**FAIL**: Technical errors shown, application crashes, or user confused  

### Notes for Tester
- Test both happy path and error scenarios
- Verify error messages are helpful (not "Error 500")
- Check that errors don't block other functionality

---

## Test Scenario 15: Integration Testing

### Test Objective
Verify that Phase 2A integrates properly with existing SolarTrack Pro features.

### Test Steps

### Integration with Dashboard

1. **From Dashboard, Access Search**
   - Load Dashboard
   - Click search bar
   - Search for a project
   - Should navigate to search results
   - Return to Dashboard (should work)
   - Dashboard should not be affected

### Integration with Projects Page

1. **From Projects, Switch to Search**
   - Load Projects page (showing all projects)
   - Click search bar
   - Search for specific term
   - Search results should show subset
   - Return to Projects
   - Projects page should still work

2. **From Projects Detail, Search for Related**
   - Open a specific project
   - Use search bar to find similar projects
   - Click on search result
   - Open related project
   - Should work smoothly

### Integration with User Settings

1. **Search with Different Users**
   - Log out
   - Log in as different user
   - Search for projects
   - Should only see their projects (permissions respected)
   - Search history should be separate per user

2. **Search Preferences Persist**
   - As User A, save a filter
   - Save a search customization
   - Log out
   - Log in as User B
   - User B should not see User A's filters
   - User B can create their own filters

### Integration with Project Permissions

1. **Search Respects Permissions**
   - As User A (with limited projects)
   - Search for all projects
   - Results should only show projects User A has access to
   - Inaccessible projects should not appear

### Expected Results

- [ ] Search integrates seamlessly with Dashboard
- [ ] Search integrates seamlessly with Projects page
- [ ] Navigation between features is smooth
- [ ] Search respects user permissions
- [ ] Filters and history are per-user
- [ ] No conflicts with existing features
- [ ] No console errors

### Pass/Fail Criteria

**PASS**: Phase 2A integrates smoothly with existing features  
**FAIL**: Conflicts with existing features or breaks functionality  

### Notes for Tester
- Test workflows that span multiple pages
- Verify permissions are respected
- Check that search doesn't interfere with other features

---

## Test Execution Summary

### Recommended Test Order

1. Scenario 1: Global Search Bar Display (5 min)
2. Scenario 2: Autocomplete Suggestions (5 min)
3. Scenario 3: Search Navigation (5 min)
4. Scenario 4: Search Results Display (5 min)
5. Scenario 5: Filter Panel Display (5 min)
6. Scenario 6: Apply Filters (5 min)
7. Scenario 7: Save and Load Filters (10 min)
8. Scenario 8: Search History (10 min)
9. Scenario 9: Keyboard Shortcuts (5 min)
10. Scenario 10: Mobile Responsiveness (10 min)
11. Scenario 11: Accessibility (15 min - optional specialist)
12. Scenario 12: Performance Testing (10 min)
13. Scenario 13: Browser Compatibility (20 min)
14. Scenario 14: Error Handling (10 min)
15. Scenario 15: Integration Testing (15 min)

**Total Time**: 120-150 minutes (2-2.5 hours)

### Test Report Template

```markdown
# Phase 2A Test Execution Report

**Date**: April 15, 2026
**Tester**: [Name]
**Environment**: [Dev/Staging/Production]
**Browser**: [Name and Version]

## Test Summary

| Scenario | Status | Notes | Issue Count |
|----------|--------|-------|-------------|
| 1. Global Search Bar | ✅ PASS | Works as expected | 0 |
| 2. Autocomplete | ✅ PASS | Responsive and accurate | 0 |
| 3. Search Navigation | ✅ PASS | URL encoding correct | 0 |
| ... | ... | ... | ... |

## Issues Found

### Critical Issues
1. Issue #1: [Title]
   - Severity: CRITICAL
   - Steps to reproduce
   - Impact on users
   - Recommendation

### High Priority Issues
1. Issue #2: [Title]
   - Severity: HIGH
   - Impact: Minor feature affected
   - Can be fixed post-launch

### Low Priority Issues
1. Issue #3: [Title]
   - Severity: LOW
   - Nice to have fix

## Overall Status

- [ ] All critical issues resolved
- [ ] All high priority issues resolved
- [ ] Ready for production deployment
- [ ] Approved by: [Manager/QA Lead]

## Sign-Off

Tester: _______________________ Date: _______
Manager: ______________________ Date: _______
```

---

## Quick Reference: Common Test Issues

### Issue: Search bar doesn't appear
**Debug Steps**: 
1. Check GlobalSearchBar imported in Layout.jsx
2. Check component added to JSX
3. Check CSS not hiding component
4. Check console for errors

### Issue: Autocomplete not showing
**Debug Steps**:
1. Check search_logs table has data
2. Check API endpoint is correct
3. Check network tab for failed requests
4. Increase VITE_SEARCH_TIMEOUT_MS

### Issue: Filters not applying
**Debug Steps**:
1. Check filter panel opens
2. Check Apply button triggers function
3. Check filter logic in filterService.js
4. Check component state updating

### Issue: Saved filters not persisting
**Debug Steps**:
1. Check database tables created
2. Check user_id being set correctly
3. Check localStorage for temporary storage
4. Check browser database access permissions

---

## Sign-Off and Approval

**Testing Completed By**: _________________________ Date: _________

**QA Manager Approval**: _________________________ Date: _________

**Ready for Production**: [ ] YES [ ] NO

**Deployment Approved By**: _____________________ Date: _________

---

**Document Version**: 1.0  
**Last Updated**: April 15, 2026  
**Next Review**: After Phase 2A Production Deployment
