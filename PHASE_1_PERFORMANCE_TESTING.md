# SolarTrack Pro Phase 1 - Performance Testing & Measurement Guide

## Overview

This guide provides step-by-step instructions for building, testing, and measuring the performance improvements from Phase 1 optimizations. Phase 1 focuses on four key areas:
1. Recharts optimization (tree-shaking, dynamic imports)
2. HTML2Canvas optimization (lazy loading)
3. CSS optimization (critical CSS, unused style removal)
4. React optimization (React.memo for expensive components)

Target performance improvement: **15-20%** overall

---

## Part 1: Building for Testing

### Prerequisites

Ensure you have the following installed:
- Node.js 18+ (check with `node --version`)
- npm 9+ (check with `npm --version`)
- Git
- Lighthouse CLI (will be installed in dependencies)

### Step 1: Clone and Setup

```bash
cd /path/to/solar_backup
npm install
npm install -D lighthouse
npm install -D rollup-plugin-visualizer
npm install -D webpack-bundle-analyzer
```

### Step 2: Create a Baseline Build (Before Optimization)

This should be done BEFORE any Phase 1 optimizations are applied.

```bash
# Build with source maps for debugging
npm run build -- --sourcemap

# The output will be in ./dist/
# Key files to monitor:
# - dist/js/main-[hash].js
# - dist/js/vendor-*.js
# - dist/css/*.css
```

### Step 3: Record Baseline Metrics

After the baseline build completes, capture these metrics in a file called `BASELINE_METRICS.json`:

```json
{
  "timestamp": "2026-04-19T00:00:00Z",
  "phase": "baseline",
  "bundle_sizes": {
    "main_js": "XXXKB",
    "vendor_react_js": "XXXKB",
    "vendor_charts_js": "XXXKB",
    "vendor_forms_js": "XXXKB",
    "vendor_routing_js": "XXXKB",
    "vendor_ui_js": "XXXKB",
    "vendor_supabase_js": "XXXKB",
    "vendor_other_js": "XXXKB",
    "total_css": "XXXKB",
    "total_js": "XXXKB",
    "total_all": "XXXKB"
  },
  "lighthouse": {
    "performance": 0,
    "accessibility": 0,
    "best_practices": 0,
    "seo": 0
  },
  "web_vitals": {
    "tti_seconds": 0.0,
    "fcp_seconds": 0.0,
    "cls_score": 0.0,
    "lcp_seconds": 0.0
  }
}
```

---

## Part 2: Measuring Bundle Sizes

### Method 1: Using Vite's Visualizer Plugin

The project is already configured with `vite-plugin-visualizer`. After building:

```bash
npm run build
# Open dist/bundle-analysis.html in a browser to see interactive visualization
```

This shows:
- Each chunk's size
- Dependencies breakdown
- Gzip and Brotli compressed sizes
- Sunburst chart for visual hierarchy

### Method 2: Using Rollup Bundle Analyzer

Add this script to your npm scripts for detailed analysis:

```bash
npm install -D rollup-plugin-visualizer --save-dev
```

View the HTML report at `dist/bundle-analysis.html` and note:
- **Main bundle size** (should be < 100KB)
- **Each vendor chunk** (vendor-charts.js is critical for optimization)
- **CSS bundle** (should be < 50KB)

### Method 3: Manual Bundle Size Measurement

```bash
# Build and get file sizes
npm run build

# Get exact sizes in bytes
ls -lh dist/js/*.js | awk '{print $9, $5}'

# Get sizes in KB (divide by 1024)
# Example output:
# dist/js/main-abc123.js 45KB
# dist/js/vendor-react-def456.js 38KB
# dist/js/vendor-charts-ghi789.js 120KB  <-- This is the target for optimization
```

### Method 4: Using gzip/brotli compression sizes

```bash
# Install tools
npm install -g brotli gzip

# Check gzip compression
gzip -c dist/js/main-*.js | wc -c  # Size in bytes, divide by 1024 for KB

# Check brotli compression (more realistic for modern browsers)
brotli -c dist/js/main-*.js | wc -c  # Size in bytes, divide by 1024 for KB
```

### Expected Bundle Targets for Phase 1

| Metric | Baseline | Target | Status |
|--------|----------|--------|--------|
| main.js | ~60KB | <50KB | - |
| vendor-charts.js | ~120KB | <90KB | - |
| vendor-react.js | ~45KB | <45KB | - |
| Total JS (gzipped) | ~150KB | <130KB | - |
| Total CSS | ~30KB | <25KB | - |
| **Total Bundle (gzipped)** | **~200KB** | **<170KB** | - |

---

## Part 3: Lighthouse Performance Audit

### Method 1: Using Lighthouse CLI

```bash
# Install if not already done
npm install -g lighthouse

# Start dev server in another terminal
npm run dev

# Run Lighthouse audit (use localhost URL)
lighthouse http://localhost:5173 --view

# This opens a detailed report in your browser
```

### Method 2: Using Chrome DevTools (Browser-based)

1. Open your app in Chrome: `npm run dev`
2. Open Chrome DevTools (F12 or Cmd+Shift+I)
3. Go to "Lighthouse" tab
4. Click "Analyze page load"
5. Wait for report (takes 30-60 seconds)
6. Export report as JSON

### Method 3: Run Multiple Audits for Consistency

```bash
# Run 3 audits and average the results
for i in {1..3}; do
  echo "Running audit $i..."
  lighthouse http://localhost:5173 --output=json > audit-$i.json
  sleep 10  # Wait between audits
done

# Use the script in PERFORMANCE_MEASUREMENT_SCRIPTS.md to average results
```

### Key Metrics to Track

| Metric | Baseline | Target Phase 1 | Improvement |
|--------|----------|---|---|
| **Performance Score** | /100 | +5-10 points | - |
| **First Contentful Paint (FCP)** | Xs | <2s | - |
| **Largest Contentful Paint (LCP)** | Xs | <2.5s | - |
| **Time to Interactive (TTI)** | Xs | <2s | - |
| **Cumulative Layout Shift (CLS)** | 0.X | <0.1 | - |
| **Total Blocking Time (TBT)** | Xms | <300ms | - |

---

## Part 4: Measuring Time to Interactive (TTI)

### What is TTI?

Time to Interactive is the point at which the page becomes fully interactive. All JavaScript must be parsed and executed, and the main thread must be idle.

### Method 1: Lighthouse (Automated)

Lighthouse automatically measures TTI:

```bash
lighthouse http://localhost:5173 --output=json | jq '.audits.interactive.displayValue'
```

### Method 2: Using Chrome DevTools Performance Tab

1. Open DevTools (F12)
2. Go to "Performance" tab
3. Click record button (red circle)
4. Interact with the page normally for 5-10 seconds
5. Stop recording
6. Look for "Interactive" marker in the timeline
7. Note the time in milliseconds

### Method 3: Using Web Performance API

Add this script to your HTML (remove after testing):

```javascript
// Add to public/index.html temporarily
<script>
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  const tti = performance.timing.loadEventEnd - performance.timing.navigationStart;
  
  console.log('=== Web Performance Metrics ===');
  console.log(`Time to Interactive: ${tti}ms`);
  console.log(`First Contentful Paint: ${perfData.responseStart - perfData.fetchStart}ms`);
  console.log(`DOM Content Loaded: ${performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart}ms`);
});
</script>
```

### TTI Target for Phase 1

- **Baseline**: Measure current TTI
- **Target**: < 2000ms (2 seconds)
- **Phase 1 Goal**: Reduce TTI by 15-20%

---

## Part 5: Measuring First Contentful Paint (FCP)

### What is FCP?

FCP is the time when the browser first renders any content from the DOM (text, image, canvas, etc.).

### Method 1: Using Lighthouse

```bash
lighthouse http://localhost:5173 --output=json | jq '.audits."first-contentful-paint".displayValue'
```

### Method 2: Chrome DevTools (Performance Tab)

1. Open Performance tab (F12 → Performance)
2. Record page load
3. Look for "First Contentful Paint" marker (vertical blue line)
4. Note the time shown

### Method 3: Using Web Performance API

```javascript
// Add to monitor FCP
<script>
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name === 'first-contentful-paint') {
      console.log(`First Contentful Paint: ${entry.startTime}ms`);
    }
  }
});
observer.observe({type: 'paint', buffered: true});
</script>
```

### FCP Target for Phase 1

- **Baseline**: Measure current FCP
- **Target**: < 1500ms (1.5 seconds)
- **Optimizations that improve FCP**:
  - Critical CSS inlining (Phase 1)
  - Lazy loading of charts (Phase 1)
  - Code splitting (already done)

---

## Part 6: Measuring Cumulative Layout Shift (CLS)

### What is CLS?

CLS measures visual stability. It's the sum of all layout shift scores for unexpected layout shifts. Lower is better (target < 0.1).

### Method 1: Using Lighthouse

```bash
lighthouse http://localhost:5173 --output=json | jq '.audits.cumulative-layout-shift.displayValue'
```

### Method 2: Chrome DevTools

1. Performance tab → Record page load
2. Look for unexpected layout shifts (visualized as red blocks)
3. Score is displayed in the metrics
4. Hover over shifts to see what moved

### Method 3: Using Web Performance API

```javascript
<script>
let cls = 0;
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      cls += entry.value;
      console.log(`Layout shift detected: ${entry.value}, Total CLS: ${cls}`);
    }
  }
});
observer.observe({type: 'layout-shift', buffered: true});
</script>
```

### Common CLS Issues

- **Chart containers shifting size**: Fixed height/width
- **Images without dimensions**: Add width/height attributes
- **Dynamic content loading**: Reserve space before loading
- **Font loading delays**: Use font-display: swap

### CLS Target for Phase 1

- **Baseline**: Measure current CLS
- **Target**: < 0.1
- **Phase 1 improvements**: React.memo prevents unnecessary re-renders that cause layout shifts

---

## Part 7: Complete Testing Workflow

### Day 1: Baseline Measurement

```bash
# 1. Ensure clean state
npm clean-install
rm -rf dist/

# 2. Build baseline (before Phase 1 changes)
npm run build

# 3. Run Lighthouse 3 times and average
lighthouse http://localhost:5173 --output=json > baseline-1.json
# Wait 30 seconds
lighthouse http://localhost:5173 --output=json > baseline-2.json
# Wait 30 seconds
lighthouse http://localhost:5173 --output=json > baseline-3.json

# 4. Capture bundle sizes
npm run build -- --sourcemap
# Manual review of dist/bundle-analysis.html
# Record sizes in BASELINE_METRICS.json
```

### Day 2+: Apply Phase 1 Optimizations

Apply each optimization while measuring:

1. **Recharts Optimization**
   - Implement tree-shaking configuration
   - Add dynamic imports for chart types
   - Measure bundle size change
   - Run Lighthouse audit

2. **HTML2Canvas Lazy Loading**
   - Implement lazy loading in export features
   - Measure impact on main bundle
   - Run Lighthouse audit

3. **CSS Optimization**
   - Extract critical CSS
   - Remove unused styles
   - Measure CSS file size
   - Run Lighthouse audit

4. **React.memo Optimization**
   - Wrap expensive components
   - Measure re-render performance
   - Run Lighthouse audit

### After Each Optimization

```bash
# 1. Build
npm run build

# 2. Measure bundle (capture screenshot of bundle-analysis.html)
# 3. Run Lighthouse
lighthouse http://localhost:5173 --output=json > phase1-step-X.json

# 4. Record metrics
# Update PHASE_1_PERFORMANCE_REPORT_TEMPLATE.md with results
```

---

## Part 8: Performance Budget Validation

### What is a Performance Budget?

A performance budget is a target limit for performance metrics. The team commits to not exceeding these limits.

### SolarTrack Pro Phase 1 Budgets

```json
{
  "budgets": [
    {
      "type": "bundle",
      "name": "main.js",
      "baseline": "60KB",
      "target": "50KB",
      "threshold": "5KB"
    },
    {
      "type": "bundle",
      "name": "vendor-charts.js",
      "baseline": "120KB",
      "target": "90KB",
      "threshold": "10KB"
    },
    {
      "type": "bundle",
      "name": "CSS files",
      "baseline": "30KB",
      "target": "25KB",
      "threshold": "5KB"
    },
    {
      "type": "lighthouse",
      "name": "performance",
      "baseline": 65,
      "target": 75,
      "threshold": 5
    },
    {
      "type": "metric",
      "name": "TTI",
      "baseline": "2500ms",
      "target": "2000ms",
      "threshold": "300ms"
    },
    {
      "type": "metric",
      "name": "FCP",
      "baseline": "1800ms",
      "target": "1500ms",
      "threshold": "200ms"
    },
    {
      "type": "metric",
      "name": "CLS",
      "baseline": 0.15,
      "target": 0.10,
      "threshold": 0.02
    }
  ]
}
```

### Validating Against Budget

```bash
# After each build
npm run build

# Check bundle sizes
ls -lh dist/js/*.js | awk '{print $9, $5}'

# Compare against targets:
# If any file exceeds budget, it's a failure
# If performance decreases, investigate
```

---

## Part 9: Before/After Comparison Template

Use this template to document your findings:

```markdown
## Phase 1 Optimization: [Optimization Name]

### Baseline (Before)
- **Bundle Size**: XXX KB
- **Lighthouse Performance**: XX/100
- **TTI**: XXX ms
- **FCP**: XXX ms
- **CLS**: 0.XX

### Optimized (After)
- **Bundle Size**: XXX KB
- **Lighthouse Performance**: XX/100
- **TTI**: XXX ms
- **FCP**: XXX ms
- **CLS**: 0.XX

### Improvement
- **Bundle Size**: -XX KB (-X%)
- **Lighthouse Performance**: +X points
- **TTI**: -XX ms (-X%)
- **FCP**: -XX ms (-X%)
- **CLS**: -0.XX (-X%)

### Cumulative Phase 1 Impact
- **Total Bundle Reduction**: -XXX KB (-X%)
- **Total Performance Gain**: +XX points
- **Target Achievement**: XX% of 15-20% goal
```

---

## Part 10: Troubleshooting

### Common Issues

**Issue**: Bundle size didn't change after optimization
- Check that optimized code is actually being used
- Verify tree-shaking is enabled in vite.config.js
- Check for duplicate imports
- Review output in bundle-analysis.html

**Issue**: Lighthouse scores are inconsistent
- Network conditions vary; run multiple audits
- Close other browser tabs
- Use consistent device/conditions
- Run in incognito mode to avoid extensions

**Issue**: TTI not improving despite smaller bundle
- JavaScript execution time may be the bottleneck
- Profile with DevTools Performance tab
- Check for large synchronous operations
- Consider reducing main bundle imports

**Issue**: CLS score worsening
- Check for images without dimensions
- Verify font-loading strategy
- Look for dynamic content without reserved space
- Profile with DevTools to find layout shifts

---

## Summary

This guide provides the tools and methods to comprehensively measure Phase 1 optimizations. The key steps are:

1. **Establish baseline** before any changes
2. **Apply optimizations** methodically
3. **Measure after each change** to isolate impact
4. **Validate against budgets** to ensure targets are met
5. **Document findings** for the final report

Expected Phase 1 result: **15-20% overall performance improvement**
