# Phase 1.5 - Performance Testing & Measurement Procedures

**Date**: 2026-04-19  
**Phase**: Phase 1.5 - Performance Testing & Measurement  
**Status**: Testing Procedures & Guidelines  

---

## Table of Contents

1. [Overview](#overview)
2. [Production Build Procedures](#production-build-procedures)
3. [Bundle Size Measurement](#bundle-size-measurement)
4. [Lighthouse Audit Procedures](#lighthouse-audit-procedures)
5. [Core Web Vitals Measurement](#core-web-vitals-measurement)
6. [Functional Testing](#functional-testing)
7. [Expected Results Reference](#expected-results-reference)

---

## Overview

This document provides detailed procedures for testing and measuring performance improvements made in Phase 1 (Phases 1.1-1.4). The testing suite validates:

- Bundle size reductions from code splitting and lazy loading
- Page load performance improvements (Lighthouse scores)
- Core Web Vitals metrics (FCP, LCP, CLS, TTI)
- Runtime performance (React.memo effectiveness)
- Functional integrity across all features

---

## Production Build Procedures

### Prerequisites

```bash
# Ensure Node.js 18+ and npm 9+ are installed
node --version  # Should be v18+
npm --version   # Should be 9+

# Install dependencies (if not already done)
cd /sessions/inspiring-tender-johnson/mnt/solar_backup
npm ci  # Use 'ci' for reproducible builds
```

### Building Production Bundle

#### Step 1: Clean Previous Build
```bash
npm run clean  # or: rm -rf dist/
```

#### Step 2: Build Production Bundle
```bash
npm run build
```

**Expected Output**:
```
vite v<version> building for production...
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

**Build Verification Checklist**:
- [ ] Build completes without errors
- [ ] Build completes without warnings
- [ ] All assets are created in `dist/` directory
- [ ] Total gzipped size is 666 KB ± 5% (631-701 KB range acceptable)
- [ ] Main JS is 549 KB ± 5% (521-577 KB range acceptable)
- [ ] CSS is 11 KB ± 2 KB (9-13 KB range acceptable)

#### Step 3: Start Development Server
```bash
npm run preview  # For preview mode
# OR
npm run dev      # For development mode with hot reload
```

Server will start on `http://localhost:5173` (or next available port)

---

## Bundle Size Measurement

### Method 1: Vite Build Output (Recommended - Most Accurate)

The build output provides gzipped and uncompressed sizes for all chunks.

#### Procedure:

1. Run production build:
```bash
npm run build 2>&1 | tee build-output.log
```

2. Extract metrics from output:
```bash
# Extract gzipped sizes
grep "gzip:" build-output.log > bundle-sizes.txt

# View file-by-file breakdown
ls -lh dist/assets/
```

#### What to Record:

| Metric | Where Found | Format |
|--------|-------------|--------|
| Total Gzipped | `npm run build` output | `XXX kB` |
| Main JS Gzipped | Build output | `XXX kB` |
| CSS Gzipped | Build output | `XX kB` |
| Individual chunks | `ls -lh dist/assets/` | KB per file |

#### Expected Baseline (Post-Phase 1):
```
Total Bundle: 666 KB gzipped
- Main JS: 549 KB
- ES Module: 50 KB
- HTML2Canvas: 46 KB
- DOMPurify: 8 KB
- CSS: 11 KB
```

### Method 2: Source Map Analysis

For detailed breakdown by dependency:

```bash
# Install bundle analyzer
npm install -D vite-bundle-visualizer

# Add to vite.config.js:
import { visualizer } from "vite-bundle-visualizer";

export default {
  plugins: [visualizer()],
}

# Build with visualization
npm run build

# Open stats.html in browser
open dist/stats.html
```

### Method 3: Manual Measurement

For precise size measurement:

```bash
# Gzipped sizes
gzip -c dist/assets/index-*.js | wc -c      # Main JS
gzip -c dist/assets/index-*.css | wc -c     # CSS

# Total payload
du -sh dist/
tar -czf dist.tar.gz dist/ && ls -lh dist.tar.gz

# Individual files uncompressed
ls -lh dist/assets/ | awk '{print $9, $5}' > asset-sizes.txt
```

---

## Lighthouse Audit Procedures

### Prerequisites

Lighthouse is available in Chrome DevTools or as a standalone CLI tool.

#### Option A: Chrome DevTools (Easiest)

1. Start dev server: `npm run preview`
2. Open Chrome: `http://localhost:5173`
3. Press `F12` to open DevTools
4. Click "Lighthouse" tab
5. Select "Mobile" or "Desktop"
6. Click "Analyze page load"
7. Wait 60-120 seconds for audit to complete

#### Option B: Lighthouse CLI (Reproducible)

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit with consistent settings
lighthouse http://localhost:5173 \
  --chrome-flags="--headless" \
  --emulated-form-factor=mobile \
  --output=json \
  --output-path=./lighthouse-report-mobile.json

lighthouse http://localhost:5173 \
  --chrome-flags="--headless" \
  --emulated-form-factor=desktop \
  --output=json \
  --output-path=./lighthouse-report-desktop.json
```

#### Option C: Lighthouse CI (Advanced)

For automated testing in CI/CD:

```bash
# Create lighthouserc.json
cat > lighthouserc.json << 'EOF'
{
  "ci": {
    "collect": {
      "url": ["http://localhost:5173"],
      "numberOfRuns": 3
    },
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.75 }],
        "categories:accessibility": ["error", { "minScore": 0.80 }],
        "categories:best-practices": ["error", { "minScore": 0.80 }],
        "categories:seo": ["error", { "minScore": 0.80 }]
      }
    }
  }
}
EOF

# Run Lighthouse CI
npm install -g @lhci/cli@latest
lhci autorun
```

### Interpreting Lighthouse Scores

#### Performance Score (0-100)

| Score Range | Rating | Interpretation |
|---|---|---|
| 90-100 | Excellent | Exemplary performance, minimal improvements needed |
| 75-89 | Good | Acceptable performance, some optimization opportunities |
| 50-74 | Needs Work | Performance issues present, optimization recommended |
| 0-49 | Poor | Significant performance problems requiring immediate fixes |

**Phase 1 Target**: 75-88 (Good to Excellent)

### Key Metrics Reported by Lighthouse

| Metric | Description | Target | Source |
|--------|---|---|---|
| **First Contentful Paint (FCP)** | Time until first content appears | < 1.8s | Measured |
| **Largest Contentful Paint (LCP)** | Time until largest element renders | < 2.5s | Measured |
| **Cumulative Layout Shift (CLS)** | Visual stability during page load | < 0.1 | Measured |
| **Speed Index** | How quickly page visually completes | < 3.4s | Measured |
| **Time to Interactive (TTI)** | When page is fully interactive | < 3.8s | Measured |
| **Total Blocking Time (TBT)** | Sum of blocking periods | < 150ms | Measured |

### Recording Lighthouse Results

```json
{
  "audit_date": "2026-04-19",
  "device": "mobile|desktop",
  "url": "http://localhost:5173",
  "lighthouse_version": "X.X.X",
  
  "performance": {
    "score": 85,
    "fcp_ms": 1450,
    "lcp_ms": 1950,
    "cls": 0.08,
    "speed_index_ms": 2100,
    "tti_ms": 1800,
    "tbt_ms": 95
  },
  
  "accessibility": { "score": 92 },
  "best_practices": { "score": 88 },
  "seo": { "score": 95 },
  
  "opportunities": [
    "Reduce unused CSS",
    "Defer off-screen images",
    "Minify CSS"
  ]
}
```

---

## Core Web Vitals Measurement

### What Are Core Web Vitals?

Google's Core Web Vitals are three metrics measuring user experience:

1. **LCP (Largest Contentful Paint)**: Loading performance
2. **FID (First Input Delay)**: Interactivity
3. **CLS (Cumulative Layout Shift)**: Visual stability

Modern replacements:
- **INP (Interaction to Next Paint)**: Replaces FID for better responsiveness measurement

### Method 1: Real User Monitoring (RUM)

Measure actual user experience with custom code:

```javascript
// Add to src/utils/metrics.js

export const measureCoreWebVitals = () => {
  const vitals = {
    fcp: null,
    lcp: null,
    cls: 0,
    inp: null,
    ttfb: null
  };

  // First Contentful Paint (FCP)
  const fcpObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        vitals.fcp = entry.startTime;
        console.log(`FCP: ${vitals.fcp}ms`);
      }
    }
  });
  fcpObserver.observe({ entryTypes: ['paint'] });

  // Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    vitals.lcp = lastEntry.renderTime || lastEntry.loadTime;
    console.log(`LCP: ${vitals.lcp}ms`);
  });
  lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

  // Cumulative Layout Shift (CLS)
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        vitals.cls += entry.value;
      }
    }
    console.log(`CLS: ${vitals.cls.toFixed(3)}`);
  });
  clsObserver.observe({ entryTypes: ['layout-shift'] });

  // Interaction to Next Paint (INP)
  const inpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    vitals.inp = Math.max(...entries.map(e => e.duration));
    console.log(`INP: ${vitals.inp}ms`);
  });
  inpObserver.observe({ entryTypes: ['event'] });

  return vitals;
};

// Call on app mount
import { useEffect } from 'react';

export function App() {
  useEffect(() => {
    const vitals = measureCoreWebVitals();
    // Send to analytics
    window.sendAnalytics?.('core-web-vitals', vitals);
  }, []);
  
  return null;
}
```

### Method 2: Chrome DevTools Performance Tab

1. Open DevTools: `F12`
2. Click "Performance" tab
3. Click red circle to start recording
4. Interact with page (click buttons, navigate, etc.)
5. Stop recording (click red circle again)
6. Review metrics in report

**Key areas to check**:
- FCP marker (blue line)
- LCP marker (purple line)
- Layout shifts (red bars)

### Method 3: Automated Testing with Puppeteer

```javascript
// test/performance-test.js
const puppeteer = require('puppeteer');

async function measureCoreWebVitals() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const metrics = {};

  // Inject Web Vitals library
  await page.addScriptTag({
    url: 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js'
  });

  // Extract metrics
  metrics.fcp = await page.evaluate(() => {
    return new Promise(resolve => {
      window.webVitals?.onFCP(metric => resolve(metric.value));
    });
  });

  metrics.lcp = await page.evaluate(() => {
    return new Promise(resolve => {
      window.webVitals?.onLCP(metric => resolve(metric.value));
    });
  });

  metrics.cls = await page.evaluate(() => {
    return new Promise(resolve => {
      window.webVitals?.onCLS(metric => resolve(metric.value));
    });
  });

  await browser.close();
  return metrics;
}

measureCoreWebVitals().then(metrics => {
  console.table(metrics);
});
```

Run with:
```bash
node test/performance-test.js
```

### Recording Core Web Vitals

| Metric | Target | Acceptable | Poor |
|--------|--------|-----------|------|
| **LCP** | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **FCP** | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| **CLS** | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **INP** | ≤ 200ms | 200ms - 500ms | > 500ms |
| **TTFB** | ≤ 600ms | 600ms - 1.2s | > 1.2s |

**Phase 1 Targets**:
- LCP: 1800-2200 ms
- FCP: 1400-1600 ms
- CLS: < 0.1
- TTI: 1700-2000 ms

---

## Functional Testing

### Feature Completeness Checklist

#### Dashboard & Navigation
- [ ] Dashboard loads without errors
- [ ] All navigation links work
- [ ] Lazy-loaded components load on interaction
- [ ] Page transitions are smooth

#### Charts & Visualization (Recharts Optimization)
- [ ] All charts render correctly
- [ ] Charts don't block page rendering (lazy loading)
- [ ] Charts are interactive (zoom, hover, etc.)
- [ ] Performance improves on second visit (caching)

#### Export Functionality (HTML2Canvas Optimization)
- [ ] Export to PDF works
- [ ] Export to PNG works
- [ ] Export doesn't freeze UI (lazy loading)
- [ ] Exported files have correct content
- [ ] File sizes are reasonable

#### CSS Performance (CSS Optimization)
- [ ] Styles load correctly
- [ ] No layout shift after CSS loads
- [ ] Mobile responsive design works
- [ ] Print styles work correctly

#### React.memo Optimization
- [ ] Component updates are performant
- [ ] Unnecessary re-renders are prevented
- [ ] Props comparison works correctly
- [ ] Memoized components display correctly

#### PWA & Service Worker
- [ ] Service worker registers successfully
- [ ] Offline mode works
- [ ] Cache invalidation works
- [ ] App icon displays correctly

### Manual Testing Procedure

```bash
# Start server
npm run preview

# Open in browser
open http://localhost:5173

# Test workflow:
# 1. Navigate all major pages
# 2. Interact with charts (zoom, pan, hover)
# 3. Export a chart to PDF
# 4. Go offline (DevTools > Network > Offline)
# 5. Verify offline page still loads
# 6. Go online and verify service worker updates
# 7. Check browser DevTools for console errors
```

### Automated Testing

```bash
# Run test suite
npm run test

# Run e2e tests
npm run test:e2e

# Check for console errors
npm run test:lighthouse
```

---

## Expected Results Reference

### Bundle Size Targets (Post-Phase 1)

| Component | Expected | Acceptable Range | Status |
|-----------|----------|------------------|--------|
| **Total Gzipped** | 666 KB | 631-701 KB | ✓ Target |
| **Main JS** | 549 KB | 521-577 KB | ✓ Target |
| **HTML2Canvas** | 46 KB | 44-50 KB | ✓ Target |
| **ES Module** | 50 KB | 47-55 KB | ✓ Target |
| **DOMPurify** | 8 KB | 7-10 KB | ✓ Target |
| **CSS** | 11 KB | 9-13 KB | ✓ Target |

### Lighthouse Score Targets

| Category | Target | Acceptable | Phase 1 Goal |
|----------|--------|-----------|--------------|
| **Performance** | 80-88 | 75+ | 80 |
| **Accessibility** | 90+ | 85+ | 92 |
| **Best Practices** | 85-90 | 80+ | 88 |
| **SEO** | 90+ | 85+ | 95 |

### Core Web Vitals Targets

| Metric | Phase 1 Target | Method |
|--------|----------------|--------|
| **FCP** | 1400-1600 ms | Lighthouse + RUM |
| **LCP** | 1800-2200 ms | Lighthouse + RUM |
| **CLS** | < 0.1 | Lighthouse + RUM |
| **TTI** | 1700-2000 ms | Lighthouse + RUM |
| **INP** | < 200 ms | Lighthouse + RUM |

### Performance Improvements (Phase 1 Total)

| Optimization | Expected Improvement | Measurement Method |
|---|---|---|
| **Recharts Lazy Loading** | 148 KB bundle reduction | Build analysis |
| **HTML2Canvas Lazy Loading** | 198 KB bundle reduction | Build analysis |
| **CSS Optimization** | 72 KB bundle reduction | Build analysis |
| **React.memo Memoization** | 3-6% runtime improvement | DevTools profiler |
| **Total** | 418 KB reduction (-21%) | Combined analysis |

---

## Command Reference

```bash
# Clean previous build
npm run clean

# Build production bundle
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Analyze bundle size
npm run build -- --analyze

# Measure Core Web Vitals
npm run measure:vitals

# Generate Lighthouse report
lighthouse http://localhost:5173 --output=json

# Full measurement suite
npm run measure:all
```

---

## Success Criteria

✓ Production build completes without errors
✓ Bundle size is within 5% of targets
✓ Lighthouse score ≥ 75 (Performance)
✓ Core Web Vitals all within acceptable ranges
✓ All functional tests pass
✓ No console errors or warnings during testing
✓ App works offline (service worker functional)
✓ Exported files (PDF/PNG) generate correctly

---

**Next Document**: `PHASE_1_5_MEASUREMENT_CHECKLIST.md`  
**Related**: `PHASE_1_VALIDATION_COMMANDS.md`
