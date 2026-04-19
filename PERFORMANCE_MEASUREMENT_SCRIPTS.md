# SolarTrack Pro - Performance Measurement Scripts

This document provides ready-to-use npm scripts, commands, and tools for measuring Phase 1 performance improvements.

---

## Part 1: Adding npm Scripts to package.json

Add these scripts to your `package.json` for easy execution:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch",
    "lint": "eslint src --ext .js,.jsx --fix",
    "lint:check": "eslint src --ext .js,.jsx",
    "format": "prettier --write \"src/**/*.{js,jsx,json,md,css}\"",
    "format:check": "prettier --check \"src/**/*.{js,jsx,json,md,css}\"",
    
    "build:analyze": "vite build && npm run analyze",
    "analyze": "node scripts/analyze-bundle.js",
    "analyze:gzip": "node scripts/analyze-gzip.js",
    
    "perf:lighthouse": "lighthouse http://localhost:5173 --output=json --output-path=lighthouse-report.json",
    "perf:lighthouse:view": "lighthouse http://localhost:5173 --view",
    "perf:lighthouse:ci": "lighthouse http://localhost:5173 --output=json --output-path=lighthouse-report-ci.json --chrome-flags='--headless'",
    
    "perf:metrics": "node scripts/measure-metrics.js",
    "perf:baseline": "npm run build && npm run analyze && npm run perf:metrics && npm run perf:lighthouse",
    "perf:compare": "node scripts/compare-metrics.js",
    
    "perf:bundle-size": "node scripts/bundle-size.js",
    "perf:bundle-report": "node scripts/bundle-report.js",
    
    "perf:measure-all": "npm run build && npm run perf:baseline && npm run perf:compare",
    "perf:watch": "npm run perf:measure-all -- --watch"
  }
}
```

---

## Part 2: Bundle Analysis Commands

### Quick Bundle Size Check

```bash
npm run build
ls -lh dist/js/*.js dist/css/*.css
```

**Output format:**
```
-rw-r--r--  1 user  group   45K Apr 19 10:30 dist/js/main-abc123.js
-rw-r--r--  1 user  group  120K Apr 19 10:30 dist/js/vendor-charts-def456.js
-rw-r--r--  1 user  group   38K Apr 19 10:30 dist/js/vendor-react-ghi789.js
...
```

### Interactive Bundle Visualization

```bash
# Build and open interactive analysis (configured in vite.config.js)
npm run build

# Open in browser
open dist/bundle-analysis.html
# or use: firefox dist/bundle-analysis.html
```

This shows:
- Sunburst chart of all dependencies
- File sizes (raw and compressed)
- Gzip and Brotli sizes
- Module breakdown

### Gzip/Brotli Compression Analysis

```bash
# Install compression tools (macOS/Linux)
# macOS
brew install brotli

# Linux
sudo apt-get install brotli

# Analyze all JS files
for file in dist/js/*.js; do
  original=$(wc -c < "$file")
  gzip=$(gzip -c "$file" | wc -c)
  brotli=$(brotli -c "$file" | wc -c)
  
  orig_kb=$(echo "scale=2; $original / 1024" | bc)
  gzip_kb=$(echo "scale=2; $gzip / 1024" | bc)
  brotli_kb=$(echo "scale=2; $brotli / 1024" | bc)
  
  echo "$file"
  echo "  Original: ${orig_kb}KB"
  echo "  Gzip: ${gzip_kb}KB"
  echo "  Brotli: ${brotli_kb}KB"
done
```

### Creating a Bundle Size Report Script

Create `scripts/bundle-size.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const distDir = path.join(process.cwd(), 'dist');

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  return require('zlib').gzipSync(content).length;
}

function analyzeDirectory(dir, extension = '.js') {
  const files = fs.readdirSync(dir).filter(f => f.endsWith(extension));
  
  let total = 0;
  let totalGzip = 0;
  
  console.log(`\n📦 ${extension.toUpperCase()} FILES:`);
  console.log('─'.repeat(60));
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const size = getFileSize(fullPath);
    const gzipSize = getGzipSize(fullPath);
    
    const sizeKb = (size / 1024).toFixed(2);
    const gzipKb = (gzipSize / 1024).toFixed(2);
    const savings = ((1 - gzipSize / size) * 100).toFixed(1);
    
    console.log(`${file}`);
    console.log(`  Raw: ${sizeKb}KB | Gzip: ${gzipKb}KB | Savings: ${savings}%`);
    
    total += size;
    totalGzip += gzipSize;
  });
  
  console.log('─'.repeat(60));
  const totalKb = (total / 1024).toFixed(2);
  const totalGzipKb = (totalGzip / 1024).toFixed(2);
  console.log(`TOTAL: ${totalKb}KB (${totalGzipKb}KB gzipped)`);
  
  return { total, totalGzip };
}

// Main execution
console.log('🔍 Bundle Size Analysis');
console.log('═'.repeat(60));

const jsDir = path.join(distDir, 'js');
const cssDir = path.join(distDir, 'css');

if (fs.existsSync(jsDir)) {
  analyzeDirectory(jsDir, '.js');
}

if (fs.existsSync(cssDir)) {
  analyzeDirectory(cssDir, '.css');
}

console.log('\n✅ Analysis complete');
```

---

## Part 3: Lighthouse Performance Testing

### Single Lighthouse Audit

```bash
# Requires dev server running: npm run dev (in another terminal)

# View report in browser
npm run perf:lighthouse:view

# Or save JSON report
npm run perf:lighthouse
cat lighthouse-report.json | jq '.categories'
```

### Multiple Audits (for consistency)

Create `scripts/lighthouse-multiple.sh`:

```bash
#!/bin/bash

ITERATIONS=${1:-3}
OUTPUT_DIR="lighthouse-reports"

mkdir -p $OUTPUT_DIR

echo "Running $ITERATIONS Lighthouse audits..."

for i in $(seq 1 $ITERATIONS); do
  echo "Audit $i of $ITERATIONS..."
  
  npx lighthouse http://localhost:5173 \
    --output=json \
    --output-path="$OUTPUT_DIR/audit-$i.json" \
    --chrome-flags="--headless"
  
  if [ $i -lt $ITERATIONS ]; then
    echo "Waiting 30 seconds before next audit..."
    sleep 30
  fi
done

echo "✅ All audits complete. Results in $OUTPUT_DIR/"
```

Usage:
```bash
chmod +x scripts/lighthouse-multiple.sh

# Run 3 audits
./scripts/lighthouse-multiple.sh 3

# Run 5 audits
./scripts/lighthouse-multiple.sh 5
```

### Extracting Lighthouse Metrics

Create `scripts/extract-lighthouse-metrics.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function extractMetrics(jsonFile) {
  const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  
  const categories = data.categories;
  const audits = data.audits;
  
  return {
    timestamp: new Date().toISOString(),
    performance: categories.performance.score * 100,
    accessibility: categories.accessibility.score * 100,
    best_practices: categories['best-practices'].score * 100,
    seo: categories.seo.score * 100,
    metrics: {
      'first-contentful-paint': audits['first-contentful-paint'].displayValue,
      'largest-contentful-paint': audits['largest-contentful-paint'].displayValue,
      'cumulative-layout-shift': audits['cumulative-layout-shift'].displayValue,
      'time-to-interactive': audits.interactive.displayValue,
      'total-blocking-time': audits['total-blocking-time'].displayValue,
    }
  };
}

// Main
const reportsDir = 'lighthouse-reports';
if (!fs.existsSync(reportsDir)) {
  console.error('No lighthouse-reports directory found');
  process.exit(1);
}

const files = fs.readdirSync(reportsDir)
  .filter(f => f.endsWith('.json'))
  .sort();

console.log('Lighthouse Metrics Comparison');
console.log('═'.repeat(80));

const allMetrics = files.map(file => {
  const metrics = extractMetrics(path.join(reportsDir, file));
  console.log(`\n${file}:`);
  console.log(`  Performance: ${metrics.performance.toFixed(1)}/100`);
  console.log(`  FCP: ${metrics.metrics['first-contentful-paint']}`);
  console.log(`  LCP: ${metrics.metrics['largest-contentful-paint']}`);
  console.log(`  CLS: ${metrics.metrics['cumulative-layout-shift']}`);
  console.log(`  TTI: ${metrics.metrics['time-to-interactive']}`);
  
  return metrics;
});

// Calculate averages
const avgPerformance = (allMetrics.reduce((sum, m) => sum + m.performance, 0) / allMetrics.length).toFixed(1);
console.log(`\nAverage Performance Score: ${avgPerformance}/100`);
```

---

## Part 4: Real User Metrics Measurement

### Performance API Monitoring Script

Create `src/lib/performance-monitor.js`:

```javascript
/**
 * Performance monitoring utility for tracking Web Vitals
 */

export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  // Measure Time to Interactive
  measureTTI() {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-input') {
              const tti = entry.processingStart;
              this.metrics.tti = tti;
              observer.disconnect();
              resolve(tti);
            }
          }
        });
        
        observer.observe({ entryTypes: ['first-input'] });
      } else {
        resolve(null);
      }
    });
  }

  // Measure First Contentful Paint
  measureFCP() {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime;
              observer.disconnect();
              resolve(entry.startTime);
            }
          }
        });
        
        observer.observe({ type: 'paint', buffered: true });
      } else {
        resolve(null);
      }
    });
  }

  // Measure Cumulative Layout Shift
  measureCLS() {
    return new Promise((resolve) => {
      if ('PerformanceObserver' in window) {
        let cls = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
              this.metrics.cls = cls;
            }
          }
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
        
        // Report after 5 seconds of no changes
        setTimeout(() => {
          observer.disconnect();
          resolve(cls);
        }, 5000);
      } else {
        resolve(null);
      }
    });
  }

  // Get all metrics
  getAllMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.metrics
    };
  }

  // Log metrics to console
  logMetrics() {
    const metrics = this.getAllMetrics();
    console.table(metrics);
  }

  // Send metrics to server
  async sendMetrics(endpoint = '/api/metrics') {
    const metrics = this.getAllMetrics();
    
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }
}

// Auto-initialize on page load
export function initializePerformanceMonitoring() {
  const monitor = new PerformanceMonitor();
  
  window.addEventListener('load', async () => {
    await Promise.all([
      monitor.measureFCP(),
      monitor.measureTTI(),
      monitor.measureCLS()
    ]);
    
    monitor.logMetrics();
  });
  
  return monitor;
}
```

### Usage in App.jsx

```javascript
import { initializePerformanceMonitoring } from '@/lib/performance-monitor';

// In your main App component or entry point
if (process.env.NODE_ENV === 'development') {
  initializePerformanceMonitoring();
}
```

---

## Part 5: Chrome DevTools Performance Profiling

### Recording a Performance Profile

```javascript
// DevTools approach (manual)
1. Open Chrome DevTools (F12)
2. Go to Performance tab
3. Click red record button
4. Interact with page for 5-10 seconds
5. Stop recording
6. Analysis appears automatically

// Programmatic approach (for automated testing)
const startMeasure = () => {
  performance.mark('measure-start');
};

const endMeasure = (label) => {
  performance.mark('measure-end');
  performance.measure(label, 'measure-start', 'measure-end');
  const measure = performance.getEntriesByName(label)[0];
  console.log(`${label}: ${measure.duration.toFixed(2)}ms`);
};
```

### Analyzing Profile Data

```bash
# Save DevTools profile and use Node.js to analyze
node scripts/analyze-profile.js lighthouse-report.json
```

---

## Part 6: WebPageTest Setup

### Remote Testing with WebPageTest

WebPageTest provides real-world testing from multiple locations and devices.

```bash
# 1. Go to webpagetest.org
# 2. Enter your URL: https://your-solartrack-instance.com
# 3. Select Advanced Settings:
#    - Browser: Chrome
#    - Connection: 4G LTE
#    - Location: Default
#    - Number of test runs: 3
# 4. Submit and wait for results

# Or use API (requires API key)
curl -X POST https://www.webpagetest.org/api/runtest \
  -d "url=https://your-solartrack-instance.com" \
  -d "key=YOUR_API_KEY" \
  -d "f=json"
```

### Interpreting WebPageTest Results

Key metrics:
- **First Byte Time (TTFB)**: Server response time
- **First Paint**: When page starts rendering
- **Visually Complete**: When page appears loaded
- **Fully Loaded**: All resources loaded

---

## Part 7: Continuous Performance Monitoring

### Package.json Performance Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "perf:ci": "npm run build && npm run perf:lighthouse:ci && npm run perf:bundle-report",
    "perf:regression-check": "npm run build && node scripts/check-performance-regression.js",
    "perf:budget-check": "npm run build && node scripts/check-performance-budget.js"
  }
}
```

### Performance Budget Validation Script

Create `scripts/check-performance-budget.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const BUDGET = {
  'main.js': 50 * 1024,           // 50KB
  'vendor-charts.js': 90 * 1024,   // 90KB
  'vendor-react.js': 45 * 1024,    // 45KB
  'total-js': 170 * 1024,          // 170KB gzipped
  'css': 25 * 1024,                 // 25KB
};

function checkBudget() {
  const distDir = path.join(process.cwd(), 'dist');
  const jsDir = path.join(distDir, 'js');
  
  console.log('🎯 Performance Budget Check');
  console.log('═'.repeat(60));
  
  let passed = true;
  
  if (!fs.existsSync(jsDir)) {
    console.error('❌ dist/js not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  const files = fs.readdirSync(jsDir);
  
  files.forEach(file => {
    const filePath = path.join(jsDir, file);
    const size = fs.statSync(filePath).size;
    const sizeKb = size / 1024;
    
    // Check if file matches a budget
    for (const [budgetName, budgetSize] of Object.entries(BUDGET)) {
      if (file.includes(budgetName.replace('.js', ''))) {
        const budgetKb = budgetSize / 1024;
        const status = size <= budgetSize ? '✅' : '❌';
        
        console.log(`${status} ${file}`);
        console.log(`   Size: ${sizeKb.toFixed(2)}KB / Budget: ${budgetKb.toFixed(2)}KB`);
        
        if (size > budgetSize) {
          passed = false;
        }
      }
    }
  });
  
  console.log('═'.repeat(60));
  
  if (passed) {
    console.log('✅ All budgets passed!');
    process.exit(0);
  } else {
    console.log('❌ Budget exceeded! See above for details.');
    process.exit(1);
  }
}

checkBudget();
```

Usage:
```bash
npm run perf:budget-check
```

---

## Summary of Commands

| Task | Command |
|------|---------|
| Quick bundle analysis | `npm run build && npm run perf:bundle-size` |
| Visual bundle analysis | `npm run build && open dist/bundle-analysis.html` |
| Lighthouse audit | `npm run perf:lighthouse:view` |
| Multiple Lighthouse audits | `./scripts/lighthouse-multiple.sh 5` |
| Full baseline measurement | `npm run perf:baseline` |
| Compare metrics | `npm run perf:compare` |
| Budget validation | `npm run perf:budget-check` |
| CI performance check | `npm run perf:ci` |

All scripts are ready to use and can be integrated into your CI/CD pipeline for automated performance monitoring.
