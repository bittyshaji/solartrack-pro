# Phase 3C: Step-by-Step Testing Guide

**Date**: March 26, 2026
**Goal**: Validate all PWA features on real devices before production deployment
**Estimated Time**: 4-6 hours (across multiple devices)
**Tools Needed**: Desktop Chrome, Android phone (Chrome), iPhone (Safari)

---

## 🎯 BEFORE YOU START

### Prerequisites
- [ ] App is running locally (`npm run dev` or `npm run preview`)
- [ ] Service worker is enabled
- [ ] You have test devices available (Android & iOS minimum)
- [ ] Testing checklist spreadsheet open (`PHASE3C_TESTING_CHECKLIST.xlsx`)
- [ ] HTTPS available (can use localhost for basic testing)
- [ ] Your app accessible on local network (for mobile device testing)

### Getting Local Network Access
To test on mobile devices from your computer:

**Option 1: Use Local IP**
```bash
# Find your local IP
ipconfig getifaddr en0  # macOS
# or
hostname -I  # Linux

# Run on specific host
npm run dev -- --host 0.0.0.0

# Access from mobile
# http://YOUR_LOCAL_IP:5173
```

**Option 2: Use ngrok (for real HTTPS)**
```bash
npm install -g ngrok
npm run dev  # Runs on localhost:5173
ngrok http 5173
# Use the ngrok URL (https://xxxx.ngrok.io)
```

---

## 📋 DESKTOP TESTING (Chrome DevTools)

### Section 1: Service Worker Installation
**Time**: 15 minutes
**Device**: Desktop Chrome
**Goal**: Verify service worker is properly registered and caching

#### Step 1.1: Open DevTools
```
1. Open app in Chrome
2. Press F12 (or Right-click → Inspect)
3. Go to "Application" tab
4. Select "Service Workers" in left sidebar
```

#### Step 1.2: Verify Service Worker Status
```
Look for:
✓ "Service Worker registered"
✓ "Status: activated and running"
✓ Green circle indicator
✓ Scope shows your app URL
```

**Expected**: Service worker should be running
**If Failed**:
- [ ] Check browser console for errors
- [ ] Verify service worker file exists at `/public/serviceWorker.js`
- [ ] Clear browser cache and hard refresh (Ctrl+Shift+R)

#### Step 1.3: Check Cache Storage
```
1. Still in Application tab
2. Expand "Cache Storage"
3. Should see 3 caches:
   - app-shell-v1
   - api-cache-v1
   - image-cache-v1
```

**Expected**: Multiple cache storages with files cached
**If Failed**: Service worker may not be installing correctly

#### Step 1.4: Check Offline DB
```
1. Expand "IndexedDB"
2. Find your app entry
3. Check "offlinePhotos" object store
4. Should be empty initially
```

**Note**: This will populate when you test offline photo upload

**Mark in Checklist**: ✓ Desktop Service Worker registered

---

### Section 2: PWA Installation on Desktop
**Time**: 10 minutes
**Device**: Desktop Chrome
**Goal**: Verify app can be installed

#### Step 2.1: Install via Chrome UI
```
1. Look at address bar (right side)
2. Should see install icon (looks like monitor with down arrow)
3. Click the icon
4. Dialog appears: "Install SolarTrack Pro?"
5. Click "Install"
```

**Expected**:
- Install completes
- App icon appears in taskbar (Windows) or Applications (macOS)

**If No Install Button**:
- [ ] HTTPS not available (required for PWA)
- [ ] manifest.json is malformed
- [ ] Meta tags missing from index.html

#### Step 2.2: Launch Installed App
```
1. Click app in taskbar/Applications
2. App opens in full-screen window
3. No address bar visible
4. No back button from browser
```

**Expected**: App looks and feels like native app

#### Step 2.3: Verify App Properties
```
1. Right-click app icon
2. Check "App settings" or similar
3. Verify app name: "SolarTrack Pro"
4. Icon should display correctly
```

**Mark in Checklist**: ✓ Desktop PWA Installation

---

### Section 3: Offline Mode Testing
**Time**: 20 minutes
**Device**: Desktop Chrome
**Goal**: Verify offline functionality works correctly

#### Step 3.1: Load Pages Before Going Offline
```
1. Make sure app is fully loaded
2. Navigate to Dashboard
3. Navigate to Projects
4. Go back to Dashboard
5. All pages should have loaded
```

**Why**: Service worker caches pages when visited

#### Step 3.2: Enable Offline Mode
```
1. Open DevTools (F12)
2. Go to "Network" tab
3. Find checkbox labeled "Offline" at top
4. Check the "Offline" box
```

**Expected**: "Offline" indicator appears in Network tab

#### Step 3.3: Test Navigation
```
1. Still in offline mode
2. Click different sections in app
   - Dashboard ✓ (should load instantly)
   - Projects ✓ (should load instantly)
   - Updates ✓ (should load instantly)
3. Notice page loads from cache
```

**Expected**: Pages load instantly (< 100ms)

**If Pages Don't Load**:
- [ ] Pages weren't visited before going offline
- [ ] Service worker didn't cache them properly

#### Step 3.4: Test Offline Banner
```
1. Look at top of app
2. Should see "📡 You're offline" banner in red
3. Banner should be prominent and visible
```

**Expected**: Clear offline indicator visible

#### Step 3.5: Try API Calls (Will Fail Gracefully)
```
1. Try to load data that requires API
   - Projects list
   - Team members
   - Daily updates
2. Should show:
   - Cached data if available, OR
   - Error message if not cached
3. No hard crash
```

**Expected**: Graceful degradation

#### Step 3.6: Go Back Online
```
1. In Network tab, uncheck "Offline"
2. "Offline" indicator disappears
3. App should detect online automatically
4. "Back online" notification appears
```

**Expected**: Seamless transition to online mode

**Mark in Checklist**: ✓ Offline Mode Testing

---

### Section 4: Performance Testing (Desktop)
**Time**: 15 minutes
**Device**: Desktop Chrome
**Goal**: Measure load time improvements

#### Step 4.1: Measure Initial Load Time
```
1. Open fresh browser window
2. Go to Performance tab in DevTools
3. Click "Record" (red dot)
4. Navigate to your app
5. Wait for page to fully load
6. Click "Record" again to stop
```

**Metrics to Check**:
- DOMContentLoaded: Should be < 2s
- Load: Should be < 3s
- Largest Contentful Paint (LCP): < 2.5s

**Expected**: Fast initial load

#### Step 4.2: Measure Repeat Visit
```
1. Refresh the page (F5)
2. Repeat step 4.1
```

**Expected**: Should be significantly faster (75-85% improvement)
- DOMContentLoaded: < 1s
- Load: < 2s

#### Step 4.3: Run Lighthouse Audit
```
1. Go to Lighthouse tab
2. Select:
   ☐ Mobile (simulate mobile environment)
3. Click "Analyze page load"
4. Wait for audit to complete
```

**Check Scores**:
- Performance: Target > 90
- PWA: Target > 95
- Accessibility: Target > 90
- Best Practices: Target > 90

**If Scores Low**:
- Check Performance tab for bottlenecks
- Look for large images or unoptimized bundles
- Check for slow API calls

**Mark in Checklist**: ✓ Desktop Performance

---

## 📱 MOBILE DEVICE TESTING

### Setup for Mobile Testing

#### Option A: Test on Real Network
```
1. Make sure mobile device is on same WiFi as computer
2. Get your computer's local IP:
   ipconfig getifaddr en0  # macOS
   hostname -I              # Linux
3. Run app on your IP:
   npm run dev -- --host 0.0.0.0
4. On mobile, visit:
   http://YOUR_IP:5173
```

#### Option B: Use ngrok for HTTPS
```bash
npm run dev
ngrok http 5173
# Share the ngrok URL with your mobile device
```

---

## 🤖 ANDROID TESTING (Chrome Mobile)

### Section 1: Mobile Layout
**Time**: 15 minutes
**Device**: Android phone in Chrome
**Goal**: Verify responsive design

#### Step 1.1: Basic Layout Check
```
1. Open app on Android Chrome
2. Look at bottom of screen
3. Bottom navigation bar should be visible with icons:
   - Home, Projects, Updates, Team, Reports, Profile
4. Sidebar should NOT be visible
5. Content should be full width
```

**Expected**: Clean mobile layout with bottom nav

#### Step 1.2: Tap Navigation
```
1. Tap "Projects" in bottom nav
2. Should navigate to Projects page
3. Bottom nav stays visible
4. Active item highlighted in orange
5. Tap "Dashboard"
6. Should navigate back
```

**Expected**: Smooth navigation, no page reloads

#### Step 1.3: Scroll Content
```
1. Try to scroll main content up/down
2. Should be smooth and responsive
3. Bottom nav stays fixed
4. No jank or stuttering
```

**Expected**: Smooth 60fps scrolling

**Mark in Checklist**: ✓ Android Mobile Layout

---

### Section 2: Android - Photo Upload (Online)
**Time**: 20 minutes
**Device**: Android phone in Chrome
**Goal**: Test photo capture online

#### Step 2.1: Navigate to Task with Photos
```
1. Go to Projects
2. Select a project
3. Select a task
4. Scroll to "Upload Photos" section
5. Should see two buttons:
   - "Take Photo"
   - "Choose File"
```

**Expected**: Photo section visible and buttons accessible

#### Step 2.2: Take Photo
```
1. Tap "Take Photo" button
2. Camera app opens
3. Take a photo
4. Confirm/Done
5. Return to app
```

**Expected**: Photo captured successfully

#### Step 2.3: Verify Photo Preview
```
1. Should see preview of photo taken
2. Photo shows with correct orientation
3. Can see filename and file size
4. Can remove photo with X button
```

**Expected**: Clear preview with action buttons

#### Step 2.4: View Queued Photos
```
1. Scroll down in photo section
2. Should see "1 Photo Pending"
3. Shows:
   - Filename
   - File size (KB)
   - Timestamp
   - Status badge (should say "Queued")
```

**Expected**: Photo shows with metadata and status

#### Step 2.5: Take Multiple Photos
```
1. Take 2-3 more photos
2. Each should appear in queue
3. All should show "Queued" status
4. List shows all photos with correct count
```

**Expected**: Queue grows with each photo

**Mark in Checklist**: ✓ Android Photo Upload (Online)

---

### Section 3: Android - Offline Mode
**Time**: 20 minutes
**Device**: Android phone
**Goal**: Test offline functionality

#### Step 3.1: Enable Airplane Mode
```
1. Go to Settings
2. Enable "Airplane Mode"
3. OR: Toggle WiFi off
4. Return to app
5. Should see "📡 You're offline" banner
```

**Expected**: App detects offline immediately

#### Step 3.2: Take Photos Offline
```
1. With airplane mode ON
2. Navigate to task
3. Tap "Take Photo"
4. Take a photo
5. Confirm
6. Photo should queue successfully
```

**Expected**: Photo uploads offline without error

#### Step 3.3: Verify Offline Status
```
1. In photo queue
2. Offline status message should show:
   "📡 You're offline - photos will upload when you go online"
3. Photo should still show "Queued" status
4. Can continue taking photos
```

**Expected**: Clear user communication

#### Step 3.4: Continue Working Offline
```
1. Navigate between pages
2. All cached pages load
3. Can view projects, tasks, updates
4. No page shows "Error loading"
5. Graceful fallback for API data
```

**Expected**: App is fully functional offline

#### Step 3.5: Go Back Online
```
1. Disable Airplane Mode
2. Turn WiFi back on
3. Return to app
4. Should see connection restored
5. "Back online" notification appears
```

**Expected**: Connection detected automatically

#### Step 3.6: Verify Auto-Upload
```
1. Photos should auto-upload
2. Status changes: Queued → Uploading → Completed
3. Watch queue empty as photos upload
4. Check main view - photos now visible
```

**Expected**: Seamless sync when online

**Mark in Checklist**: ✓ Android Offline Mode

---

### Section 4: Android - Touch Interaction
**Time**: 10 minutes
**Device**: Android phone
**Goal**: Verify touch-friendly interface

#### Step 4.1: Test Button Sizing
```
1. Tap different buttons:
   - Bottom nav icons
   - Form action buttons
   - Modal buttons
2. Each should:
   - Be at least 44px tall
   - Show clear tap feedback
   - Register tap instantly
3. No accidental taps on adjacent elements
```

**Expected**: Comfortable touch interaction

#### Step 4.2: Test Form Inputs
```
1. Go to create new project/task
2. Tap input field
3. Input should be at least 48px tall
4. Keyboard appears
5. Text size readable (not too small)
6. Focus ring visible
```

**Expected**: Comfortable form filling on mobile

#### Step 4.3: Test Scrolling
```
1. Scroll through long lists
2. Scrolling smooth (60fps)
3. No lag or jank
4. Can reach bottom of content
5. Bottom nav doesn't interfere
```

**Expected**: Smooth scrolling experience

**Mark in Checklist**: ✓ Android Touch Interaction

---

## 🍎 iOS TESTING (Safari)

### Section 1: Install to Home Screen
**Time**: 10 minutes
**Device**: iPhone in Safari
**Goal**: Verify PWA installation on iOS

#### Step 1.1: Add to Home Screen
```
1. Open app in Safari
2. Tap Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name appears: "SolarTrack Pro"
5. Tap "Add" in top-right
6. Home screen shows new app icon
```

**Expected**: App added to home screen successfully

#### Step 1.2: Launch from Home Screen
```
1. Close Safari
2. Tap the new app icon on home screen
3. App launches in full-screen
4. No Safari controls visible
5. App runs in standalone mode
```

**Expected**: App feels like native app

#### Step 1.3: Verify Display
```
1. App icon is correct size and quality
2. App name displays correctly
3. Splash screen appears (if implemented)
4. Status bar color matches theme
5. App fully loads
```

**Expected**: Professional appearance

**Note**: iOS has limited PWA support compared to Android. This is expected.

**Mark in Checklist**: ✓ iOS Installation

---

### Section 2: iOS - Photo Upload (Online)
**Time**: 15 minutes
**Device**: iPhone in Safari
**Goal**: Test photo features on iOS

#### Step 2.1: Navigate to Photo Section
```
1. Open app from home screen
2. Navigate to a task
3. Scroll to "Upload Photos"
4. Should see buttons:
   - "Take Photo"
   - "Choose File"
```

**Expected**: Photo section visible

#### Step 2.2: Take Photo with Camera
```
1. Tap "Take Photo"
2. Camera app opens
3. Take a photo
4. Confirm
5. Return to app
```

**Expected**: Photo captured and preview shown

#### Step 2.3: Choose from Photo Library
```
1. Tap "Choose File"
2. Photo library opens
3. Select an existing photo
4. Return to app
5. Photo preview displayed
```

**Expected**: Can select from library

#### Step 2.4: Verify Queue
```
1. Scroll to photo queue
2. Both photos should be listed
3. Show filename and size
4. Show timestamp
5. Status badge shows "Queued"
```

**Expected**: All photos in queue with metadata

**Mark in Checklist**: ✓ iOS Photo Upload

---

### Section 3: iOS - Offline Mode
**Time**: 15 minutes
**Device**: iPhone
**Goal**: Test offline on iOS

#### Step 3.1: Enable Airplane Mode
```
1. Swipe down from top-right
2. Tap Airplane Mode icon
3. Return to app
4. Should see "📡 You're offline"
```

**Expected**: App detects offline

#### Step 3.2: Test Offline Functions
```
1. Take a photo (uses device camera)
2. Photo queues successfully
3. Navigate between cached pages
4. Content loads from cache
```

**Expected**: Offline functionality works

#### Step 3.3: Go Back Online
```
1. Swipe down, tap Airplane Mode off
2. Return to app
3. "Back online" notification appears
```

**Expected**: Connection restored

#### Step 3.4: Verify Photo Sync
```
1. Photos auto-upload
2. Status: Queued → Uploading → Completed
3. Can see photos in project view
4. Sync completes without errors
```

**Expected**: Photos successfully synced

**Mark in Checklist**: ✓ iOS Offline Mode

---

### Section 4: iOS - Input Handling
**Time**: 10 minutes
**Device**: iPhone
**Goal**: Test text input on iOS

#### Step 4.1: Test Input Focus
```
1. Go to form (create project/task)
2. Tap text input
3. Input should NOT zoom
4. Keyboard appears
5. Text is readable
```

**Expected**: No zoom on input (achieved with `text-base`)

#### Step 4.2: Test Keyboard
```
1. Type some text
2. Keyboard responsive
3. Autocomplete offers suggestions
4. Backspace works correctly
5. Can dismiss keyboard by tapping outside
```

**Expected**: Standard iOS keyboard behavior

#### Step 4.3: Test Select/Dropdown
```
1. Find a select element
2. Tap to open
3. Standard iOS picker appears
4. Can select option
5. Closes when done
```

**Expected**: Native iOS picker used

**Mark in Checklist**: ✓ iOS Input Handling

---

## 🔍 EDGE CASE TESTING

### Section 1: Network Interruption
**Time**: 15 minutes
**Goal**: Test graceful handling of network issues

#### Step 1.1: Start Photo Upload, Then Disconnect
```
1. Queue a photo while online
2. Watch it start uploading
3. Turn off WiFi mid-upload
4. Observe app behavior
5. Photo should pause, not crash
6. Turn WiFi back on
7. Upload resumes/retries
```

**Expected**: Graceful error handling

#### Step 1.2: Flaky Network
```
1. Simulate slow network
2. Try to upload large photo
3. App should:
   - Show progress
   - Allow cancellation
   - Retry on failure
   - Not timeout abruptly
```

**Expected**: Robust upload handling

**Mark in Checklist**: ✓ Edge Case Testing

---

## ✅ FINAL VERIFICATION CHECKLIST

### Summary Check
- [ ] All desktop tests pass
- [ ] All Android tests pass
- [ ] All iOS tests pass
- [ ] No console errors
- [ ] No network errors
- [ ] Photos upload correctly
- [ ] Offline mode works
- [ ] Performance is good

### Before Deployment
- [ ] Testing spreadsheet complete and saved
- [ ] All major issues resolved
- [ ] No critical bugs found
- [ ] Performance meets targets
- [ ] Ready to deploy

---

## 🐛 TROUBLESHOOTING

### Issue: Service Worker Not Registering
```
Solution:
1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R)
3. Check console for errors
4. Verify service worker path
5. Check manifest.json syntax
```

### Issue: Photos Not Uploading
```
Solution:
1. Check Network tab for failed requests
2. Verify API endpoint is correct
3. Check IndexedDB for stored photos
4. Try hard refresh
5. Check server logs for errors
```

### Issue: App Won't Go Offline
```
Solution:
1. Service worker must be active
2. Page must be cached first
3. Check IndexedDB is available
4. Try different browser
5. Verify offline.js is loaded
```

### Issue: Photos Missing on Desktop After Mobile Upload
```
Solution:
1. Check photos uploaded completely
2. Refresh desktop browser
3. Check server database
4. Verify sync completed
5. Check browser console
```

---

## 📊 Testing Results

After you complete testing, summarize:

**Test Environment**:
- Desktop Browser: Chrome v??
- Android: Phone model, Chrome v??
- iOS: iPhone model, iOS v??

**Issues Found**:
1. [Issue description] - Severity: [High/Medium/Low]
2. [Issue description] - Severity: [High/Medium/Low]

**Performance**:
- Initial Load: __ seconds
- Repeat Load: __ seconds
- Offline Access: __ ms

**Recommendation**:
- [ ] Ready for production
- [ ] Fix issues, then re-test
- [ ] Needs performance optimization

---

**Total Testing Time**: 4-6 hours across all devices

**When Complete**: Save the testing spreadsheet and share results before proceeding to production deployment!
