# SolarTrack Pro Phase 1 - Performance Measurement Procedures

**Purpose**: Provide step-by-step, developer-friendly instructions to measure and document performance improvements across Phase 1 optimizations.

**Last Updated**: 2026-04-19  
**Target Audience**: Development Team, QA, Performance Engineers

---

## Table of Contents

1. [Pre-Implementation Setup](#pre-implementation-setup)
2. [Bundle Size Measurement](#bundle-size-measurement)
3. [Lighthouse Performance Audits](#lighthouse-performance-audits)
4. [Core Web Vitals Measurement](#core-web-vitals-measurement)
5. [Functional Testing](#functional-testing)
6. [Performance Profiling](#performance-profiling)
7. [Results Documentation](#results-documentation)

---

## Pre-Implementation Setup

### Step 1: Prepare Your Testing Environment

```bash
# 1. Navigate to project directory
cd /path/to/solar_backup

# 2. Verify Node.js version (18+ required)
node --version
# Expected: v18.x.x or higher

# 3. Verify npm version (9+ required)
npm --version
# Expected: 9.x.x or higher

# 4. Clean install dependencies
npm clean-install

# 5. Verify TypeScript compiles
npm run type-check
# Expected: No errors

# 6. Verify linting passes
npm run lint:check
# Expected: No errors

# 7. Verify tests pass
npm run test
# Expected: All tests passing
```

### Step 2: Create a Baseline Measurements Directory

```bash
# Create directory for baseline metrics
mkdir -p ./performance-results/baseline/
mkdir -p ./performance-results/optimized/
mkdir -p ./performance-results/lighthouse-reports/
mkdir -p ./performance-results/bundle-analysis/
```

### Step 3: Document System Information

Create a file `performance-results/SYSTEM_INFO.md`:

```markdown
# System Information

**Test Date**: [Current Date]
**Tester Name**: [Your Name]

## System Specs
- **OS**: [Windows/Mac/Linux]
- **OS Version**: [e.g., Windows 11 22H2]
- **Node.js Version**: [e.g., 18.19.0]
- **npm Version**: [e.g., 10.2.4]

## Browser Info (for Lighthouse testing)
- **Chrome Version**: [e.g., 123.0.6312.0]
- **Lighthouse Version**: [Installed via npm]

## Network Conditions
- **Broadband Speed**: [Document if testing on throttled network]
- **Test Location**: [Office/Home/Cloud]

## System State
- **Other Applications**: [List any running apps that might affect performance]
- **Browser Extensions**: [List active extensions]
- **Background Processes**: [Note anything that might impact testing]
```

---

## Bundle Size Measurement

### Method 1: Production Build Analysis

#### Step 1: Create a Clean Production Build

```bash
# 1. Remove previous build
rm -rf dist/

# 2. Build for production
npm run build

# 3. Verify build succeeded
# Look for: "dist/index.html" in output
# Check for any warnings or errors
```

#### Step 2: Analyze Bundle Sizes

```bash
# Get human-readable file sizes
ls -lh dist/js/*.js | awk '{print $9, $5}' > performance-results/baseline/js-sizes.txt

# Get human-readable CSS sizes
ls -lh dist/css/*.css | awk '{print $9, $5}' > performance-results/baseline/css-sizes.txt

# Display for verification
echo "=== JavaScript Files ==="
cat performance-results/baseline/js-sizes.txt

echo ""
echo "=== CSS Files ==="
cat performance-results/baseline/css-sizes.txt
```

#### Step 3: Measure Gzipped Sizes

```bash
# Function to measure gzip compression
measure_gzip() {
  local file=$1
  local gzipped_size=$(gzip -c "$file" | wc -c)
  local original_size=$(wc -c < "$file")
  local gzip_kb=$((gzipped_size / 1024))
  local original_kb=$((original_size / 1024))
  echo "File: $(basename $file)"
  echo "  Original: ${original_kb}KB"
  echo "  Gzipped: ${gzip_kb}KB"
  echo "  Compression ratio: $(echo "scale=1; 100 - (100 * $gzipped_size / $original_size)" | bc)%"
}

# Measure main.js
for file in dist/js/*.js; do
  measure_gzip "$file" >> performance-results/baseline/gzip-sizes.txt
done

# Display results
cat performance-results/baseline/gzip-sizes.txt
```

#### Step 4: Create Bundle Analysis Report

```bash
# The build automatically creates bundle-analysis.html
# Copy it to your results folder
cp dist/bundle-analysis.html performance-results/bundle-analysis/baseline-bundle.html

echo "Bundle analysis available at: performance-results/bundle-analysis/baseline-bundle.html"
echo "Open in browser to view interactive visualization"
```

#### Step 5: Document in Spreadsheet Format

Create `performance-results/baseline/BUNDLE_METRICS.csv`:

```csv
File,Original KB,Gzipped KB,Gzip Ratio %
main-abc123.js,45,18,60
vendor-react-def456.js,38,12,68
vendor-charts-ghi789.js,120,42,65
vendor-forms-jkl012.js,28,10,64
vendor-routing-mno345.js,15,6,60
vendor-ui-pqr678.js,22,8,64
vendor-supabase-stu901.js,35,12,66
vendor-other-vwx234.js,18,7,61
main.css,25,8,68
TOTAL,346,123,64
```

---

## Lighthouse Performance Audits

### Prerequisites

```bash
# Install Lighthouse CLI globally
npm install -g lighthouse

# Verify installation
lighthouse --version
# Expected: Should show version number
```

### Baseline Lighthouse Audit

#### Step 1: Start Development Server

```bash
# Terminal 1: Start the development server
npm run dev

# Wait for output showing:
# "Local: http://localhost:5173/"
# Note the port number (usually 5173 or 5174)
```

#### Step 2: Run First Baseline Audit

```bash
# Terminal 2: Run Lighthouse audit
lighthouse http://localhost:5173 \
  --output-path=./performance-results/lighthouse-reports/baseline-1.json \
  --output=json \
  --chrome-flags="--headless"

# When complete, displays HTML report path
```

#### Step 3: Extract Key Metrics from JSON

Create a script `extract-lighthouse-metrics.js`:

```javascript
const fs = require('fs');
const reportPath = process.argv[2];
const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

const metrics = {
  timestamp: new Date().toISOString(),
  performanceScore: report.categories.performance.score * 100,
  fcp: report.audits['first-contentful-paint'].displayValue,
  lcp: report.audits['largest-contentful-paint'].displayValue,
  tti: report.audits.interactive.displayValue,
  cls: report.audits['cumulative-layout-shift'].displayValue,
  tbt: report.audits['total-blocking-time'].displayValue,
  accessibility: report.categories.accessibility.score * 100,
  bestPractices: report.categories['best-practices'].score * 100,
  seo: report.categories.seo.score * 100
};

console.log(JSON.stringify(metrics, null, 2));
```

Run it:

```bash
node extract-lighthouse-metrics.js \
  ./performance-results/lighthouse-reports/baseline-1.json \
  > ./performance-results/baseline/LIGHTHOUSE_METRICS_1.json
```

#### Step 4: Run Second and Third Audits

Wait 30 seconds, then repeat:

```bash
# Wait 30 seconds
sleep 30

# Run second audit
lighthouse http://localhost:5173 \
  --output-path=./performance-results/lighthouse-reports/baseline-2.json \
  --output=json \
  --chrome-flags="--headless"

# Extract metrics
node extract-lighthouse-metrics.js \
  ./performance-results/lighthouse-reports/baseline-2.json \
  > ./performance-results/baseline/LIGHTHOUSE_METRICS_2.json

# Wait 30 seconds
sleep 30

# Run third audit
lighthouse http://localhost:5173 \
  --output-path=./performance-results/lighthouse-reports/baseline-3.json \
  --output=json \
  --chrome-flags="--headless"

# Extract metrics
node extract-lighthouse-metrics.js \
  ./performance-results/lighthouse-reports/baseline-3.json \
  > ./performance-results/baseline/LIGHTHOUSE_METRICS_3.json
```

#### Step 5: Calculate Averages

Create `performance-results/baseline/CALCULATE_AVERAGES.js`:

```javascript
const fs = require('fs');

function calculateAverage(values) {
  const numbers = values.map(v => parseFloat(v.replace(/[^0-9.]/g, '')));
  const sum = numbers.reduce((a, b) => a + b, 0);
  return (sum / numbers.length).toFixed(2);
}

// Load the three metrics files
const metrics1 = JSON.parse(fs.readFileSync('./LIGHTHOUSE_METRICS_1.json', 'utf-8'));
const metrics2 = JSON.parse(fs.readFileSync('./LIGHTHOUSE_METRICS_2.json', 'utf-8'));
const metrics3 = JSON.parse(fs.readFileSync('./LIGHTHOUSE_METRICS_3.json', 'utf-8'));

const averages = {
  timestamp: new Date().toISOString(),
  performanceScore: calculateAverage([
    metrics1.performanceScore,
    metrics2.performanceScore,
    metrics3.performanceScore
  ]),
  fcp: calculateAverage([
    metrics1.fcp,
    metrics2.fcp,
    metrics3.fcp
  ]),
  lcp: calculateAverage([
    metrics1.lcp,
    metrics2.lcp,
    metrics3.lcp
  ]),
  tti: calculateAverage([
    metrics1.tti,
    metrics2.tti,
    metrics3.tti
  ]),
  cls: calculateAverage([
    metrics1.cls,
    metrics2.cls,
    metrics3.cls
  ]),
  tbt: calculateAverage([
    metrics1.tbt,
    metrics2.tbt,
    metrics3.tbt
  ]),
  accessibility: calculateAverage([
    metrics1.accessibility,
    metrics2.accessibility,
    metrics3.accessibility
  ]),
  bestPractices: calculateAverage([
    metrics1.bestPractices,
    metrics2.bestPractices,
    metrics3.bestPractices
  ]),
  seo: calculateAverage([
    metrics1.seo,
    metrics2.seo,
    metrics3.seo
  ])
};

fs.writeFileSync('./LIGHTHOUSE_AVERAGES.json', JSON.stringify(averages, null, 2));
console.log(JSON.stringify(averages, null, 2));
```

Run it:

```bash
cd performance-results/baseline
node CALCULATE_AVERAGES.js
```

---

## Core Web Vitals Measurement

### Method 1: Chrome DevTools (Manual)

#### Step 1: Open DevTools Performance Tab

```
1. Open application: npm run dev
2. Open Chrome (or Chromium-based browser)
3. Navigate to http://localhost:5173
4. Press F12 to open DevTools
5. Go to "Performance" tab
```

#### Step 2: Record Page Load Performance

```
1. In Performance tab, click the record button (red circle)
2. Reload the page (Cmd+R or Ctrl+R)
3. Let page fully load (wait 5-10 seconds)
4. Stop recording
5. Analyze the timeline
```

#### Step 3: Extract Key Metrics

```
1. Look for vertical blue line labeled "FCP" (First Contentful Paint)
2. Look for vertical line labeled "LCP" (Largest Contentful Paint)
3. Look for red blocks indicating "Layout Shifts" (CLS)
4. Total height of profile = Time to Interactive (TTI)
5. Note all timings in milliseconds
```

### Method 2: Web Performance API (Code-based)

Add this temporary script to `public/index.html`:

```html
<script>
// Performance measurement script
window.addEventListener('load', () => {
  // Get navigation timing
  const navTiming = performance.getEntriesByType('navigation')[0];
  
  // Get paint entries
  const paintEntries = performance.getEntriesByType('paint');
  let fcp = 0;
  paintEntries.forEach(entry => {
    if (entry.name === 'first-contentful-paint') {
      fcp = entry.startTime;
    }
  });
  
  // Get LCP from all entries
  let lcp = 0;
  const perfEntries = performance.getEntries();
  perfEntries.forEach(entry => {
    if (entry.entryType === 'largest-contentful-paint') {
      lcp = entry.startTime;
    }
  });
  
  // Get CLS
  let cls = 0;
  const clsEntries = performance.getEntriesByType('layout-shift');
  clsEntries.forEach(entry => {
    if (!entry.hadRecentInput) {
      cls += entry.value;
    }
  });
  
  const tti = navTiming.loadEventEnd - navTiming.fetchStart;
  
  const metrics = {
    fcp: Math.round(fcp),
    lcp: Math.round(lcp),
    tti: Math.round(tti),
    cls: cls.toFixed(3),
    dcl: Math.round(navTiming.domContentLoadedEventEnd - navTiming.fetchStart)
  };
  
  console.log('=== Core Web Vitals ===');
  console.log('FCP (First Contentful Paint):', metrics.fcp + 'ms');
  console.log('LCP (Largest Contentful Paint):', metrics.lcp + 'ms');
  console.log('TTI (Time to Interactive):', metrics.tti + 'ms');
  console.log('CLS (Cumulative Layout Shift):', metrics.cls);
  console.log('DCL (DOM Content Loaded):', metrics.dcl + 'ms');
  
  // Store in window for access
  window.__PERFORMANCE_METRICS__ = metrics;
});
</script>
```

Open DevTools console and reference: `window.__PERFORMANCE_METRICS__`

---

## Functional Testing

### Dashboard Test Suite

```javascript
// Tests to perform manually or via automation

// 1. Chart Rendering
✓ Dashboard loads without errors
✓ All charts render immediately
✓ Charts display correct data
✓ Chart animations smooth

// 2. Interactive Elements
✓ Hover effects work on charts
✓ Click handlers respond
✓ Tooltips appear correctly
✓ Zoom/pan works if enabled

// 3. Responsive Design
✓ Layout looks correct at 1920x1080 (desktop)
✓ Layout looks correct at 1366x768 (laptop)
✓ Layout looks correct at 768x1024 (tablet)
✓ Layout looks correct at 375x667 (mobile)

// 4. Performance Interactions
✓ Page scrolls smoothly (60fps target)
✓ No jank or stuttering during interactions
✓ React DevTools shows reasonable re-renders
```

### Export Features Testing

```bash
# Test PDF Export
✓ PDF export button visible and clickable
✓ PDF generates without errors
✓ PDF file downloads successfully
✓ PDF contains all expected content
✓ PDF file size reasonable
✓ First export takes ~100-200ms
✓ Subsequent exports instant (cached)

# Test Image Export
✓ Image export button visible and clickable
✓ Image generates without errors
✓ Image downloads successfully
✓ Image quality acceptable
✓ File size reasonable
```

---

## Performance Profiling

### Using React DevTools Profiler

```
1. Install React DevTools extension for Chrome
2. Open application
3. Go to React DevTools → Profiler tab
4. Click Record button
5. Perform user interactions (click, scroll, filter)
6. Stop recording
7. Analyze:
   - Which components re-rendered?
   - How many times did each re-render?
   - How much time did each take?
8. Compare before/after optimization
```

### Using Chrome DevTools CPU Profiler

```
1. Open DevTools → Performance tab
2. Click record
3. Perform interactions
4. Stop recording
5. Analyze call tree:
   - Which functions took most time?
   - Which are optimization targets?
   - Are there unnecessary re-renders?
```

### Memory Profiling

```
1. Open DevTools → Memory tab
2. Take heap snapshot (before interaction)
3. Perform interactions
4. Take another heap snapshot (after)
5. Compare snapshots:
   - Did memory increase significantly?
   - Are there memory leaks?
   - Check for detached DOM nodes
```

---

## Results Documentation

### Create Summary CSV

Create `performance-results/PHASE_1_RESULTS_SUMMARY.csv`:

```csv
Optimization Step,Bundle Size (KB),Gzipped (KB),FCP (ms),TTI (ms),Lighthouse Score
Baseline,346,123,1800,2500,72
After Recharts,-18,-8,-100,-200,+5
After HTML2Canvas,-22,-9,-80,-150,+3
After CSS,-15,-5,-50,-100,+2
After React.memo,0,0,-120,-350,+3
TOTAL OPTIMIZATION,-55,-22,-350,-800,+13
Final Results,291,101,1450,1700,85
```

### Create Performance Report JSON

Create `performance-results/PHASE_1_FINAL_RESULTS.json`:

```json
{
  "phase": "Phase 1 - Performance Optimization",
  "testDate": "2026-04-19",
  "testerName": "Your Name",
  "baseline": {
    "bundleSize": {
      "totalJs": 346,
      "totalCss": 25,
      "totalGzipped": 123,
      "main": 45,
      "vendorCharts": 120
    },
    "lighthouse": {
      "performanceScore": 72,
      "accessibility": 85,
      "bestPractices": 88,
      "seo": 90
    },
    "coreWebVitals": {
      "fcp": 1800,
      "lcp": 2400,
      "tti": 2500,
      "cls": 0.12,
      "tbt": 350
    }
  },
  "optimizations": [
    {
      "name": "Recharts Optimization",
      "bundleSizeReduction": 18,
      "bundleGzipReduction": 8,
      "performanceImprovement": {
        "fcp": -100,
        "tti": -200,
        "score": 5
      }
    }
  ],
  "final": {
    "bundleSize": {
      "totalJs": 291,
      "totalCss": 20,
      "totalGzipped": 101,
      "main": 40,
      "vendorCharts": 95
    },
    "lighthouse": {
      "performanceScore": 85,
      "accessibility": 88,
      "bestPractices": 91,
      "seo": 92
    },
    "coreWebVitals": {
      "fcp": 1450,
      "lcp": 1950,
      "tti": 1700,
      "cls": 0.10,
      "tbt": 250
    }
  },
  "improvements": {
    "bundleSize": {
      "absolute": -55,
      "percentage": -16,
      "gzipAbsolute": -22,
      "gzipPercentage": -18
    },
    "lighthouse": {
      "performanceAbsolute": 13,
      "performancePercentage": 18
    },
    "coreWebVitals": {
      "fcp": -350,
      "fcpPercentage": -19,
      "tti": -800,
      "ttiPercentage": -32,
      "cls": -0.02,
      "clsPercentage": -17
    },
    "overall": "15-32% improvement across metrics"
  }
}
```

---

## Complete Testing Workflow

### Baseline Phase (Before Optimization)

```bash
# Day 1: Capture Baseline
1. Prepare environment (Step 1 from Pre-Implementation Setup)
2. Document system info (Step 3)
3. Create clean build (Bundle Size Step 1)
4. Measure all bundle sizes (Bundle Size Steps 2-5)
5. Run 3 Lighthouse audits (Lighthouse Steps 1-5)
6. Record in CSV format (Results Documentation)
7. Commit results with tag: git tag baseline-phase-1
```

### Post-Optimization Phase (After Each Change)

```bash
# After each optimization:
1. Build with: npm run build
2. Measure bundle sizes
3. Run 1 Lighthouse audit (quick check)
4. Update results spreadsheet
5. Compare to previous step
6. If regression, investigate before continuing
```

### Final Validation Phase (After All Optimizations)

```bash
# Final comprehensive testing:
1. Clean build: rm -rf dist && npm run build
2. Measure bundle sizes (all metrics)
3. Run 3 Lighthouse audits and average
4. Run all functional tests
5. Run browser compatibility tests
6. Profile with React DevTools
7. Create final comparison report
8. Sign-off and commit with tag
```

---

## Troubleshooting

### Inconsistent Lighthouse Scores

**Problem**: Lighthouse scores vary significantly between runs

**Solutions**:
- Close other browser tabs
- Run in incognito mode
- Run on consistent hardware
- Run 3 times and average results
- Same time of day (reduce system variance)
- Check system CPU/memory (background processes)

### Bundle Size Not Changing

**Problem**: Bundle size unchanged despite optimization

**Solutions**:
- Verify code was actually changed
- Check tree-shaking is enabled in vite.config.js
- Run `npm run build` with no cache
- Verify imports are removed (not just commented)
- Check bundle-analysis.html to see what's included

### Slow First Lighthouse Audit

**Problem**: First Lighthouse audit much slower than subsequent ones

**Solutions**:
- This is normal (cold cache)
- Run multiple audits and average
- Focus on relative improvements, not absolute numbers

---

## Summary

This procedure guide provides:
- Clear step-by-step measurement instructions
- Reproducible baseline capture process
- Multiple measurement methods (Lighthouse, DevTools, API)
- CSV documentation formats
- JSON result structures
- Troubleshooting guidance

**Expected Timeline**:
- Baseline capture: 30-45 minutes
- Per-optimization testing: 15-20 minutes
- Final validation: 45-60 minutes
- Total Phase 1: 2-3 hours

**Key Success Criteria**:
- All baseline metrics documented
- All optimizations measured incrementally
- Final improvement: 15-20% overall
- No functional regressions
- All tests passing
