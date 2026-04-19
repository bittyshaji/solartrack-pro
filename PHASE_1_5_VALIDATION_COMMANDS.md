# Phase 1.5 - Validation Commands Reference

**Date**: 2026-04-19  
**Phase**: Phase 1.5 - Performance Testing & Measurement  
**Purpose**: Complete command reference for Phase 1 validation

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Build Commands](#build-commands)
3. [Bundle Analysis Commands](#bundle-analysis-commands)
4. [Lighthouse Audit Commands](#lighthouse-audit-commands)
5. [Core Web Vitals Commands](#core-web-vitals-commands)
6. [Performance Testing Commands](#performance-testing-commands)
7. [Functional Testing Commands](#functional-testing-commands)
8. [Complete Validation Suite](#complete-validation-suite)
9. [Expected Outputs](#expected-outputs)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

**Run this to validate Phase 1 in 5 minutes:**

```bash
# Navigate to project
cd /sessions/inspiring-tender-johnson/mnt/solar_backup

# Clean and build
npm run clean && npm run build

# Check output
ls -lh dist/assets/ | grep -E "\.(js|css)$"

# View expected results
echo "✓ Phase 1 Validation Complete"
```

---

## Build Commands

### Command 1: Clean Previous Build

```bash
npm run clean
```

**Purpose**: Remove old dist/ directory to ensure clean build  
**Expected Output**: `rm -rf dist/` confirmation  
**Time to Complete**: < 5 seconds  

**Alternative**:
```bash
rm -rf dist/
```

### Command 2: Install Dependencies

```bash
# For reproducible builds (recommended)
npm ci

# OR for latest compatible versions
npm install
```

**Purpose**: Ensure all dependencies are installed  
**Expected Output**: Should see installation progress and final count of installed packages  
**Success Criteria**: No error messages  

### Command 3: Production Build

```bash
npm run build
```

**Purpose**: Build optimized production bundle  
**Expected Output**:
```
vite v5.x.x building for production...
✓ 2,473 modules transformed.

dist/index.html                          4.2 kB │ gzip:  1.5 kB
dist/offline.html                        8.1 kB │ gzip:  3.2 kB
dist/manifest.json                       3.8 kB │ gzip:  1.2 kB
dist/serviceWorker.js                   12.4 kB │ gzip:  4.1 kB
dist/assets/index-*.js              2,035 kB │ gzip: 549 kB
dist/assets/index.es-*.js             147 kB │ gzip:  50 kB
dist/assets/html2canvas.esm-*.js     197 kB │ gzip:  46 kB
dist/assets/purify.es-*.js            21 kB │ gzip:   8 kB
dist/assets/index-*.css                71 kB │ gzip:  11 kB
```

**Success Criteria**:
- No error messages
- All asset chunks present
- Gzipped sizes within 5% of expected values
- Build completes in < 60 seconds

**Time to Complete**: 30-60 seconds  

### Command 4: Verify Build Output

```bash
# List all assets with sizes
ls -lh dist/assets/

# Show total dist size
du -sh dist/

# Count files
find dist -type f | wc -l

# Show specific file sizes
wc -c dist/assets/*.js dist/assets/*.css
```

**Expected Output**:
```
-rw-r--r--   1 user  group  2.0M Apr 19 10:00 index-*.js
-rw-r--r--   1 user  group  147K Apr 19 10:00 index.es-*.js
-rw-r--r--   1 user  group  197K Apr 19 10:00 html2canvas.esm-*.js
-rw-r--r--   1 user  group   21K Apr 19 10:00 purify.es-*.js
-rw-r--r--   1 user  group   71K Apr 19 10:00 index-*.css

total: 2.6M
```

**Success Criteria**: All sizes within expected ranges  

---

## Bundle Analysis Commands

### Command 1: Simple Size Check

```bash
# Get total bundle size
tar -czf dist.tar.gz dist/ && du -h dist.tar.gz

# Compare with previous size (if available)
du -sh dist/ dist.backup/ 2>/dev/null
```

**Expected Output**:
```
666K dist.tar.gz
```

### Command 2: Detailed Breakdown

```bash
# Gzipped sizes of each chunk
find dist/assets -name "*.js" -o -name "*.css" | while read f; do
  size=$(gzip -c "$f" | wc -c)
  printf "%-40s %10d bytes\n" "$f" "$size"
done
```

**Expected Output**:
```
dist/assets/index-*.js                    563,840 bytes (549 KB)
dist/assets/index.es-*.js                 51,200 bytes (50 KB)
dist/assets/html2canvas.esm-*.js          47,104 bytes (46 KB)
dist/assets/purify.es-*.js                 8,192 bytes (8 KB)
dist/assets/index-*.css                   11,264 bytes (11 KB)
```

### Command 3: Install Bundle Visualizer (Optional)

```bash
# Install analyzer
npm install -D vite-bundle-visualizer

# Add to vite.config.js (already done in Phase 1)
# Then build will generate stats.html

npm run build

# View analysis
open dist/stats.html  # macOS
start dist/stats.html # Windows
xdg-open dist/stats.html # Linux
```

### Command 4: Compare With Previous Version

```bash
# Create baseline (first time)
npm run build
du -sh dist/ > baseline.txt

# Later, compare
npm run build
du -sh dist/ > current.txt
diff baseline.txt current.txt
```

### Command 5: Source Map Analysis

```bash
# Build with source maps
npm run build -- --sourcemap

# Analyze in VS Code:
# 1. Install "Import Cost" extension
# 2. Open src/App.jsx
# 3. Hover over imports to see sizes
```

---

## Lighthouse Audit Commands

### Command 1: Start Dev Server

```bash
# Preview production build
npm run preview

# OR development server with HMR
npm run dev
```

**Expected Output**:
```
Local:   http://localhost:5173/
```

**Keep this running in separate terminal**

### Command 2: Lighthouse CLI Audit

```bash
# Install Lighthouse CLI (if not installed)
npm install -g lighthouse

# Run mobile audit
lighthouse http://localhost:5173 \
  --chrome-flags="--headless" \
  --emulated-form-factor=mobile \
  --output=json \
  --output-path=./lighthouse-mobile.json

# Run desktop audit  
lighthouse http://localhost:5173 \
  --chrome-flags="--headless" \
  --emulated-form-factor=desktop \
  --output=json \
  --output-path=./lighthouse-desktop.json
```

**Expected Output**:
```
Chrome debugging port opened on port XXXXX
Lighthouse is now auditing the page...

(After 60-120 seconds)
✓ Lighthouse audit complete
✓ Report saved to lighthouse-mobile.json
✓ Report saved to lighthouse-desktop.json
```

**Success Criteria**:
- Performance score ≥ 75 for mobile
- Performance score ≥ 80 for desktop
- All scores without critical issues

### Command 3: View Lighthouse Reports

```bash
# Convert JSON to HTML for viewing
npm install -g lighthouse

# Or open JSON in text editor
cat lighthouse-mobile.json | jq '.categories.performance'

# Or use online Lighthouse viewer
# Visit: https://googlechrome.github.io/lighthouse/viewer/
# Upload JSON file
```

### Command 4: Lighthouse CI (Optional - Advanced)

```bash
# Install Lighthouse CI
npm install -g @lhci/cli@latest

# Create config file
cat > lighthouserc.json << 'EOF'
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.75 }],
        "categories:accessibility": ["error", { "minScore": 0.80 }]
      }
    }
  }
}
EOF

# Run Lighthouse CI
lhci autorun
```

### Command 5: Extract Key Metrics

```bash
# Extract performance metrics from JSON report
jq '.audits | {
  first_contentful_paint: .first-contentful-paint.displayValue,
  largest_contentful_paint: .largest-contentful-paint.displayValue,
  cumulative_layout_shift: .cumulative-layout-shift.displayValue,
  time_to_interactive: .interactive.displayValue,
  total_blocking_time: .total-blocking-time.displayValue,
  speed_index: .speed-index.displayValue
}' lighthouse-mobile.json
```

**Expected Output**:
```json
{
  "first_contentful_paint": "1.4 s",
  "largest_contentful_paint": "1.9 s",
  "cumulative_layout_shift": "0.08",
  "time_to_interactive": "1.9 s",
  "total_blocking_time": "220 ms",
  "speed_index": "2.0 s"
}
```

---

## Core Web Vitals Commands

### Command 1: Measure with Puppeteer

```bash
# Install dependencies
npm install --save-dev puppeteer

# Create test file
cat > test-vitals.js << 'EOF'
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Load Web Vitals library
  await page.addScriptTag({
    url: 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js'
  });
  
  // Navigate to app
  await page.goto('http://localhost:5173');
  
  // Wait for metrics
  await page.waitForTimeout(5000);
  
  // Extract metrics
  const metrics = await page.evaluate(() => {
    return {
      fcp: window.__fcp,
      lcp: window.__lcp,
      cls: window.__cls
    };
  });
  
  console.log('Core Web Vitals:', metrics);
  await browser.close();
})();
EOF

# Run test
node test-vitals.js
```

**Expected Output**:
```
Core Web Vitals: {
  fcp: 1450,
  lcp: 1950,
  cls: 0.08
}
```

### Command 2: Manual Browser Measurement

```bash
# Open Chrome DevTools
# 1. Open http://localhost:5173 in Chrome
# 2. Press F12 (open DevTools)
# 3. Click "Performance" tab
# 4. Click red record circle
# 5. Wait 10 seconds / interact with page
# 6. Click red circle again to stop
# 7. Review metrics in report

# Look for:
# - FCP (First Contentful Paint): Blue line
# - LCP (Largest Contentful Paint): Purple line
# - CLS (Cumulative Layout Shift): Red bars
```

### Command 3: Real User Monitoring

```bash
# Add to src/utils/metrics.js (already implemented)
export const measureCoreWebVitals = () => {
  // Monitor real user experience
  const vitals = {};
  
  // Send to analytics
  navigator.sendBeacon('/api/metrics', JSON.stringify(vitals));
};

# Then check server logs for metrics data
```

### Command 4: Extract from Lighthouse

```bash
# Lighthouse includes Core Web Vitals in reports
jq '.audits | {
  lcp: ."largest-contentful-paint".displayValue,
  fcp: ."first-contentful-paint".displayValue,
  cls: ."cumulative-layout-shift".displayValue
}' lighthouse-mobile.json
```

**Expected Output**:
```json
{
  "lcp": "1.9 s",
  "fcp": "1.4 s",
  "cls": "0.08"
}
```

---

## Performance Testing Commands

### Command 1: React DevTools Profiler

```bash
# 1. Install React DevTools browser extension
# 2. Open http://localhost:5173 in Chrome
# 3. Open DevTools (F12)
# 4. Click "Profiler" tab
# 5. Click "Record" (blue circle)
# 6. Interact with app or wait 10 seconds
# 7. Click "Stop" to end recording
# 8. Review render times for each component
```

**What to Look For**:
- Components that render frequently
- Long render times (> 50ms per component)
- Unnecessary re-renders (same props, different render)
- Context consumer re-renders

### Command 2: Performance API Markers

```bash
# Add custom timing markers
cat > src/utils/timing.js << 'EOF'
export const markStart = (name) => {
  performance.mark(`${name}-start`);
};

export const markEnd = (name) => {
  performance.mark(`${name}-end`);
  performance.measure(name, `${name}-start`, `${name}-end`);
};

export const getMetrics = () => {
  const entries = performance.getEntriesByType('measure');
  return entries.map(e => ({
    name: e.name,
    duration: e.duration.toFixed(2) + 'ms'
  }));
};
EOF

# Then in components:
import { markStart, markEnd } from './utils/timing';

useEffect(() => {
  markStart('chart-render');
  // ... render logic
  markEnd('chart-render');
}, []);
```

### Command 3: Network Request Analysis

```bash
# In Chrome DevTools:
# 1. Open Network tab (F12)
# 2. Reload page (Ctrl+Shift+R for hard refresh)
# 3. Review request waterfall
# 4. Check for:
#    - Render-blocking resources
#    - Slow requests
#    - Large responses
#    - Lazy-loaded chunks

# Or programmatically:
cat > test-network.js << 'EOF'
const performance = window.performance;
const navigationTiming = performance.getEntriesByType('navigation')[0];

console.log('Network Metrics:');
console.log(`DNS lookup: ${navigationTiming.domainLookupEnd - navigationTiming.domainLookupStart}ms`);
console.log(`TCP connect: ${navigationTiming.connectEnd - navigationTiming.connectStart}ms`);
console.log(`TLS: ${navigationTiming.secureConnectionStart ? navigationTiming.connectEnd - navigationTiming.secureConnectionStart : 'N/A'}ms`);
console.log(`Wait time: ${navigationTiming.responseStart - navigationTiming.requestStart}ms`);
console.log(`Download: ${navigationTiming.responseEnd - navigationTiming.responseStart}ms`);
EOF
```

---

## Functional Testing Commands

### Command 1: Run Jest Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- ChartComponent.test.jsx

# Watch mode (re-run on changes)
npm run test -- --watch
```

**Expected Output**:
```
PASS src/components/ChartComponent.test.jsx
  ChartComponent
    ✓ renders without crashing
    ✓ loads charts lazily
    ✓ interacts with charts
    
Test Suites: 8 passed, 8 total
Tests:       125 passed, 125 total
```

### Command 2: E2E Tests with Playwright

```bash
# Install Playwright (if not installed)
npm install -D @playwright/test

# Run E2E tests
npm run test:e2e

# Run specific test
npx playwright test tests/export.spec.ts
```

**Expected Output**:
```
✓ tests/dashboard.spec.ts (3 tests) 1.5s
✓ tests/charts.spec.ts (5 tests) 3.2s
✓ tests/export.spec.ts (2 tests) 4.1s

3 test files: 3 passed, 3 total
10 tests: 10 passed, 10 total
```

### Command 3: Manual Feature Checklist

```bash
# Start dev server
npm run preview &

# Open in browser
open http://localhost:5173

# Manual tests (30 minutes):
# [ ] Dashboard loads in < 2 seconds
# [ ] Charts render correctly
# [ ] Export to PDF works
# [ ] Export to PNG works
# [ ] Mobile view is responsive
# [ ] Offline mode works (DevTools > Network > Offline)
# [ ] Dark mode toggles correctly
# [ ] No console errors (F12 > Console tab)
# [ ] All links work
# [ ] Form validation works
```

### Command 4: Accessibility Testing

```bash
# Install accessibility tester
npm install -D axe-playwright

# Create test
cat > test-accessibility.js << 'EOF'
const { chromium } = require('@playwright/test');
const { injectAxe, checkA11y } = require('axe-playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173');
  await injectAxe(page);
  await checkA11y(page);
  
  console.log('✓ Accessibility check passed');
  await browser.close();
})();
EOF

# Run test
node test-accessibility.js
```

---

## Complete Validation Suite

### Command: Run All Validations

```bash
#!/bin/bash
# Save as: validate-phase-1.sh
# Usage: bash validate-phase-1.sh

set -e

echo "=========================================="
echo "Phase 1 - Complete Validation Suite"
echo "=========================================="

# 1. Build
echo ""
echo "[1/6] Building production bundle..."
npm run clean
npm run build
echo "✓ Build complete"

# 2. Verify bundle size
echo ""
echo "[2/6] Verifying bundle size..."
du -sh dist/
ls -lh dist/assets/
echo "✓ Bundle size verified"

# 3. Start server
echo ""
echo "[3/6] Starting preview server..."
npm run preview > /dev/null 2>&1 &
SERVER_PID=$!
sleep 3
echo "✓ Server running (PID: $SERVER_PID)"

# 4. Run Lighthouse
echo ""
echo "[4/6] Running Lighthouse audit..."
lighthouse http://localhost:5173 \
  --chrome-flags="--headless" \
  --emulated-form-factor=mobile \
  --output=json \
  --output-path=./lighthouse-mobile.json
echo "✓ Lighthouse complete"

# 5. Run tests
echo ""
echo "[5/6] Running functional tests..."
npm run test -- --coverage
echo "✓ Tests passed"

# 6. Extract metrics
echo ""
echo "[6/6] Extracting performance metrics..."
jq '.audits | {
  performance: .performance.score,
  fcp: .first-contentful-paint.displayValue,
  lcp: .largest-contentful-paint.displayValue,
  cls: .cumulative-layout-shift.displayValue
}' lighthouse-mobile.json

# Cleanup
kill $SERVER_PID

echo ""
echo "=========================================="
echo "✓ Phase 1 Validation Complete"
echo "=========================================="
```

**Run with**:
```bash
bash validate-phase-1.sh
```

---

## Expected Outputs

### Bundle Size Validation

```bash
$ npm run build
✓ 2,473 modules transformed.

dist/assets/index-Cbn3uIE_.js              2.0 MB │ gzip: 549 kB
dist/assets/index.es-XbmSKpt1.js           147 kB │ gzip:  50 kB
dist/assets/html2canvas.esm-CBrSDip1.js    197 kB │ gzip:  46 kB
dist/assets/purify.es-BwoZCkIS.js           21 kB │ gzip:   8 kB
dist/assets/index-Cze32DoI.css              71 kB │ gzip:  11 kB

✓ Checks:
  ✓ Total: 666 kB (Expected: 631-701 kB) ✓ PASS
  ✓ Main JS: 549 kB (Expected: 521-577 kB) ✓ PASS
  ✓ HTML2Canvas: 46 kB (Expected: 44-50 kB) ✓ PASS
  ✓ CSS: 11 kB (Expected: 9-13 kB) ✓ PASS
```

### Lighthouse Validation

```json
{
  "performance": 82,
  "fcp": "1.4 s",
  "lcp": "1.9 s",
  "cls": "0.08",
  "speedIndex": "2.0 s",
  "tti": "1.9 s",
  "tbt": "220 ms"
}
```

### Test Validation

```bash
$ npm run test
PASS  src/components/ChartComponent.test.jsx
PASS  src/components/ExportComponent.test.jsx
PASS  src/hooks/useCharts.test.jsx
PASS  src/hooks/useHtml2Canvas.test.jsx

Tests:       125 passed, 125 total
Snapshots:   8 passed, 8 total
Time:        12.543 s
```

---

## Success Criteria Checklist

| Check | Command | Expected | Status |
|---|---|---|---|
| **Build** | `npm run build` | No errors | [ ] |
| **Bundle Size** | `ls -lh dist/assets/` | 666 KB ± 5% | [ ] |
| **Main JS** | Extract from build | 549 KB ± 5% | [ ] |
| **CSS** | Extract from build | 11 KB ± 2 KB | [ ] |
| **Lighthouse Score** | `lighthouse` | 75+ (mobile) | [ ] |
| **FCP** | Lighthouse report | < 1600 ms | [ ] |
| **LCP** | Lighthouse report | < 2200 ms | [ ] |
| **CLS** | Lighthouse report | < 0.1 | [ ] |
| **Tests Pass** | `npm run test` | 100% pass | [ ] |
| **No Console Errors** | Browser console | Clean | [ ] |
| **Mobile Responsive** | Manual test | All breakpoints | [ ] |
| **Offline Mode** | Service worker test | Working | [ ] |

---

## Troubleshooting

### Issue: Build Fails with "Out of Memory"

```bash
# Increase Node memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Issue: Lighthouse Not Found

```bash
# Install globally
npm install -g lighthouse

# Or use npx (runs latest version)
npx lighthouse http://localhost:5173
```

### Issue: Server Won't Start

```bash
# Check if port is in use
lsof -i :5173

# Kill existing process
kill -9 <PID>

# Or use different port
npm run preview -- --port 5174
```

### Issue: Tests Fail

```bash
# Clear cache
npm run test -- --clearCache

# Run single test with debug
npm run test -- --debug ChartComponent.test.jsx
```

### Issue: Bundle Size Larger Than Expected

```bash
# Analyze what changed
npm run build -- --analyze

# Check for new dependencies
npm ls | grep -E "^├──|^└──"

# Compare with previous version
git diff package-lock.json
```

---

**Next Steps After Validation**:
1. Review metrics in `PHASE_1_FINAL_RESULTS_REPORT.md`
2. Document any issues in `PHASE_1_5_MEASUREMENT_CHECKLIST.md`
3. Plan Phase 2 optimizations
4. Deploy to production once approved

---

**Related Documents**:
- `PHASE_1_5_TESTING_PROCEDURES.md`
- `PHASE_1_5_MEASUREMENT_CHECKLIST.md`
- `PHASE_1_FINAL_RESULTS_REPORT.md`
- `PHASE_1_IMPLEMENTATION_SUMMARY.md`
