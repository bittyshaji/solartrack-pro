# SolarTrack Pro Phase 1 - Performance Measurement Commands

**Purpose**: Quick reference for all commands needed to measure performance during Phase 1 optimization.

**Categories**: Bundle Size, Lighthouse Audits, Core Web Vitals, React Profiling, System Info

---

## Quick Command Reference

### Essential Commands Chain

```bash
# Complete baseline measurement (run in sequence)
npm run build
npm run perf:baseline    # If available in package.json
lighthouse http://localhost:5173 --output=json > baseline.json
npm run test
npm run type-check

# After each optimization
npm run build
npm run perf:lighthouse:view  # If available
npm run test
```

---

## 1. Build Commands

### Standard Production Build

```bash
# Clean build for fresh measurements
npm run build

# Build with detailed output
npm run build -- --debug

# Build with source maps (for debugging)
npm run build -- --sourcemap

# Build and keep previous dist (to compare)
npm run build -- --base=/staging/
```

**What to Check**:
- Build time in console
- Warnings or errors
- dist/ directory created
- No failed assets

**Expected Output**:
```
✓ built in XXms
dist/index.html                          0.XX kB
dist/assets/index-abc123.js            45.XX kB
dist/assets/index-def456.css           25.XX kB
```

---

## 2. Bundle Size Measurement Commands

### Get File Sizes (Human Readable)

```bash
# List all JavaScript files with sizes
ls -lh dist/js/*.js | awk '{print $9, $5}'

# List all CSS files with sizes
ls -lh dist/css/*.css | awk '{print $9, $5}'

# Total size of dist folder
du -sh dist/

# Total size of dist/js
du -sh dist/js/

# Total size of dist/css
du -sh dist/css/

# Count files in dist
find dist -type f | wc -l
```

**Example Output**:
```
dist/js/main-abc123.js 45K
dist/js/vendor-react-def456.js 38K
dist/js/vendor-charts-ghi789.js 120K
dist/css/main-jkl012.css 25K
```

### Get File Sizes (Exact Bytes)

```bash
# Get exact byte size of a file
wc -c dist/js/main-*.js | tail -1

# Get size of all JS files combined
find dist/js -name "*.js" -exec wc -c {} + | tail -1

# Get size of all CSS files combined
find dist/css -name "*.css" -exec wc -c {} + | tail -1

# Size in KB with precision
find dist/js -name "*.js" -exec wc -c {} + | awk '{sum+=$1} END {printf "%.2f KB\n", sum/1024}'
```

### Gzip Compression Analysis

```bash
# Test gzip compression on main.js
gzip -c dist/js/main-*.js | wc -c | awk '{printf "Gzipped: %.2f KB\n", $1/1024}'

# Test gzip on all JS files
for file in dist/js/*.js; do
  original=$(wc -c < "$file")
  compressed=$(gzip -c "$file" | wc -c)
  ratio=$((100 - (100 * compressed / original)))
  echo "$(basename $file): $(($original/1024))KB → $(($compressed/1024))KB ($ratio%)"
done

# Test all CSS files
for file in dist/css/*.css; do
  original=$(wc -c < "$file")
  compressed=$(gzip -c "$file" | wc -c)
  echo "$(basename $file): $(($original/1024))KB → $(($compressed/1024))KB"
done

# Total gzip size (realistic for CDN delivery)
find dist -type f \( -name "*.js" -o -name "*.css" \) -exec gzip -c {} \; | wc -c | awk '{printf "Total gzipped: %.2f KB\n", $1/1024}'
```

### Brotli Compression (More Modern)

```bash
# Install brotli first (if needed)
npm install -g brotli

# Test brotli compression (better than gzip for modern browsers)
for file in dist/js/*.js; do
  original=$(wc -c < "$file")
  compressed=$(brotli -c "$file" | wc -c)
  echo "$(basename $file): $(($original/1024))KB → $(($compressed/1024))KB"
done
```

### Generate Interactive Bundle Analysis

```bash
# Vite's built-in visualizer (should generate automatically)
# Open this in browser:
open dist/bundle-analysis.html
# or
firefox dist/bundle-analysis.html

# If not generated, install plugin:
npm install -D vite-plugin-visualizer

# Then configure in vite.config.js:
# import { visualizer } from "vite-plugin-visualizer";
# export default {
#   plugins: [visualizer()],
# }
```

### Create Custom Bundle Report

```bash
# Create a detailed bundle size CSV report
cat > bundle-report.sh << 'EOF'
#!/bin/bash
echo "File,Original KB,Gzipped KB,Ratio %" > bundle-sizes.csv

for file in dist/js/*.js dist/css/*.css; do
  original=$(wc -c < "$file")
  compressed=$(gzip -c "$file" | wc -c)
  original_kb=$((original / 1024))
  compressed_kb=$((compressed / 1024))
  ratio=$((100 - (100 * compressed / original)))
  echo "$(basename $file),$original_kb,$compressed_kb,$ratio%" >> bundle-sizes.csv
done

# Total
total_js=$(find dist/js -type f \( -name "*.js" \) | xargs wc -c | tail -1 | awk '{print $1}')
total_css=$(find dist/css -type f \( -name "*.css" \) | xargs wc -c | tail -1 | awk '{print $1}')
total_combined=$((total_js + total_css))

total_js_gzip=$(find dist/js -type f \( -name "*.js" \) -exec gzip -c {} \; | wc -c)
total_css_gzip=$(find dist/css -type f \( -name "*.css" \) -exec gzip -c {} \; | wc -c)
total_gzip=$((total_js_gzip + total_css_gzip))

echo "TOTAL JS,$((total_js / 1024)),$((total_js_gzip / 1024)),$(( 100 - (100 * total_js_gzip / total_js)))" >> bundle-sizes.csv
echo "TOTAL CSS,$((total_css / 1024)),$((total_css_gzip / 1024)),$(( 100 - (100 * total_css_gzip / total_css)))" >> bundle-sizes.csv
echo "TOTAL ALL,$((total_combined / 1024)),$((total_gzip / 1024)),$(( 100 - (100 * total_gzip / total_combined)))" >> bundle-sizes.csv

cat bundle-sizes.csv
EOF

chmod +x bundle-report.sh
./bundle-report.sh
```

---

## 3. Lighthouse Performance Audits

### Basic Lighthouse Run

```bash
# Install Lighthouse CLI (if not installed)
npm install -g lighthouse

# Verify installation
lighthouse --version
# Output: lighthouse@XX.X.X

# Run basic audit (desktop, full report)
lighthouse http://localhost:5173 --view

# Run and output JSON (for automated analysis)
lighthouse http://localhost:5173 --output=json > lighthouse-report.json

# Run for mobile (important for SolarTrack mobile users)
lighthouse http://localhost:5173 --emulated-form-factor=mobile --view
```

### Advanced Lighthouse Options

```bash
# Run multiple times and average
for i in {1..3}; do
  echo "Running audit $i..."
  lighthouse http://localhost:5173 \
    --output=json \
    --output-path=./lighthouse-$i.json \
    --chrome-flags="--headless"
  sleep 10
done

# Run with throttling simulation (slow 4G)
lighthouse http://localhost:5173 \
  --throttling-method=simulate \
  --throttle-cpu-slowdown=4 \
  --view

# Run with simulated 3G
lighthouse http://localhost:5173 \
  --throttle-cpu-slowdown=20 \
  --view

# Extract specific metrics from JSON
lighthouse http://localhost:5173 \
  --output=json | \
  jq '.categories.performance.score * 100'

# Extract all Core Web Vitals
lighthouse http://localhost:5173 \
  --output=json | \
  jq '{
    performance: .categories.performance.score * 100,
    fcp: .audits["first-contentful-paint"].displayValue,
    lcp: .audits["largest-contentful-paint"].displayValue,
    tti: .audits.interactive.displayValue,
    cls: .audits["cumulative-layout-shift"].displayValue,
    tbt: .audits["total-blocking-time"].displayValue
  }'
```

### Extract Metrics from Existing Reports

```bash
# Extract performance score
jq '.categories.performance.score * 100' lighthouse-report.json

# Extract all categories
jq '.categories | map_values(.score * 100)' lighthouse-report.json

# Extract Core Web Vitals
jq '{
  fcp: .audits."first-contentful-paint".displayValue,
  lcp: .audits."largest-contentful-paint".displayValue,
  tti: .audits.interactive.displayValue,
  cls: .audits."cumulative-layout-shift".displayValue,
  tbt: .audits."total-blocking-time".displayValue
}' lighthouse-report.json

# Create comparison of multiple runs
cat > compare-audits.js << 'EOF'
const fs = require('fs');
const reports = ['lighthouse-1.json', 'lighthouse-2.json', 'lighthouse-3.json'];
const metrics = [];

reports.forEach(file => {
  const report = JSON.parse(fs.readFileSync(file));
  metrics.push({
    file,
    performance: (report.categories.performance.score * 100).toFixed(0),
    fcp: report.audits['first-contentful-paint'].displayValue,
    tti: report.audits.interactive.displayValue
  });
});

console.table(metrics);

// Calculate averages
const avg = {};
Object.keys(metrics[0]).forEach(key => {
  if (key !== 'file') {
    const values = metrics.map(m => parseFloat(m[key]));
    avg[key] = (values.reduce((a,b) => a+b) / values.length).toFixed(2);
  }
});
console.log('Averages:', avg);
EOF

node compare-audits.js
```

---

## 4. Core Web Vitals Measurement

### Using Lighthouse (Preferred)

```bash
# FCP (First Contentful Paint)
lighthouse http://localhost:5173 --output=json | \
  jq '.audits."first-contentful-paint".displayValue'

# LCP (Largest Contentful Paint)
lighthouse http://localhost:5173 --output=json | \
  jq '.audits."largest-contentful-paint".displayValue'

# TTI (Time to Interactive)
lighthouse http://localhost:5173 --output=json | \
  jq '.audits.interactive.displayValue'

# CLS (Cumulative Layout Shift)
lighthouse http://localhost:5173 --output=json | \
  jq '.audits."cumulative-layout-shift".displayValue'

# TBT (Total Blocking Time)
lighthouse http://localhost:5173 --output=json | \
  jq '.audits."total-blocking-time".displayValue'
```

### Using Chrome DevTools (Manual)

```bash
# Start dev server
npm run dev

# Then in Chrome:
# 1. Open DevTools (F12)
# 2. Go to Performance tab
# 3. Click Record
# 4. Reload page (Cmd+R)
# 5. Interact with page for 5-10 seconds
# 6. Click Stop
# 7. Look for metrics in the summary
```

### Using Web Performance API

```bash
# Create a measurement script
cat > measure-performance.js << 'EOF'
// Performance measurement
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  const paintEntries = performance.getEntriesByType('paint');
  
  let fcp = 0;
  paintEntries.forEach(entry => {
    if (entry.name === 'first-contentful-paint') {
      fcp = entry.startTime;
    }
  });
  
  const metrics = {
    fcp: Math.round(fcp),
    dcl: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
    load: Math.round(perfData.loadEventEnd - perfData.fetchStart)
  };
  
  console.log('Performance Metrics:', metrics);
  window.__PERF__ = metrics;
});
EOF

# Add to your page and access via:
# window.__PERF__
```

---

## 5. React Performance Profiling

### Using React DevTools

```bash
# Install React DevTools extension for Chrome
# https://chrome.google.com/webstore/detail/react-developer-tools/...

# Then:
# 1. Open app in browser
# 2. Open DevTools (F12)
# 3. Go to "Profiler" tab (under React DevTools)
# 4. Click Record button
# 5. Interact with the page
# 6. Stop recording
# 7. Analyze which components re-rendered and how many times
```

### Identify Expensive Components

```javascript
// Add to browser console to measure component render time
Performance.mark('component-start');
// ... component code ...
Performance.mark('component-end');
Performance.measure('component', 'component-start', 'component-end');
Performance.getEntriesByName('component')[0].duration // in ms
```

---

## 6. System Information Commands

### Node/npm Versions

```bash
# Check Node version
node --version
# Expected: v18.x.x or higher

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Check Vite version
npm ls vite

# Check React version
npm ls react

# Check all critical dependencies
npm ls recharts html2canvas
```

### System Resource Monitoring

```bash
# Check CPU and memory usage during build
time npm run build

# Monitor system during dev server
npm run dev &
# Then in another terminal:
top -p $(pgrep -f "node")
# Press 'q' to quit

# Disk space
df -h
du -sh .
```

### Environment Information

```bash
# Full system info
cat > system-info.sh << 'EOF'
echo "=== System Information ==="
echo "OS: $(uname -s)"
echo "OS Version: $(uname -r)"
echo "Architecture: $(uname -m)"
echo "Hostname: $(hostname)"
echo ""
echo "=== Node/NPM ==="
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""
echo "=== Disk Space ==="
du -sh dist 2>/dev/null || echo "dist/ not found"
du -sh node_modules
du -sh .
echo ""
echo "=== Network ==="
echo "Public IP: $(curl -s http://ifconfig.me 2>/dev/null || echo 'N/A')"
EOF

chmod +x system-info.sh
./system-info.sh
```

---

## 7. Code Quality Verification

### Type Checking

```bash
# Check TypeScript compilation
npm run type-check

# Watch mode (continuous checking)
npm run type-check:watch
```

### Linting

```bash
# Check for linting errors
npm run lint:check

# Fix linting errors
npm run lint

# Check formatting
npm run format:check

# Auto-format code
npm run format
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm run test -- src/components/Dashboard.test.jsx
```

---

## 8. Complete Testing Scripts

### All-in-One Baseline Script

```bash
#!/bin/bash
# baseline.sh - Capture complete baseline metrics

set -e  # Exit on error

echo "=========================================="
echo "SolarTrack Pro Phase 1 - Baseline Capture"
echo "=========================================="
echo ""

# Create results directory
mkdir -p performance-results/{baseline,lighthouse,bundle}

# 1. Build
echo "1. Creating production build..."
npm run build

# 2. Bundle sizes
echo "2. Measuring bundle sizes..."
ls -lh dist/js/*.js | awk '{print $9, $5}' > performance-results/baseline/js-sizes.txt
ls -lh dist/css/*.css | awk '{print $9, $5}' > performance-results/baseline/css-sizes.txt

echo "   JavaScript files:"
cat performance-results/baseline/js-sizes.txt

echo "   CSS files:"
cat performance-results/baseline/css-sizes.txt

# 3. Copy bundle analysis
echo "3. Copying bundle analysis visualization..."
cp dist/bundle-analysis.html performance-results/bundle/baseline.html

# 4. Run Lighthouse audits
echo "4. Starting development server..."
npm run dev &
DEV_PID=$!
sleep 5

echo "5. Running Lighthouse audits (3x)..."
for i in {1..3}; do
  echo "   Audit $i/3..."
  lighthouse http://localhost:5173 \
    --output=json \
    --output-path=./performance-results/lighthouse/baseline-$i.json \
    --chrome-flags="--headless"
  [ $i -lt 3 ] && sleep 10
done

# Stop dev server
kill $DEV_PID

echo ""
echo "=========================================="
echo "Baseline Capture Complete!"
echo "=========================================="
echo "Results saved to: performance-results/"
echo ""
echo "Next steps:"
echo "1. Implement optimization"
echo "2. Run: npm run build"
echo "3. Run: npm run perf:lighthouse:view"
echo "4. Compare metrics to baseline"
```

### Save as Executable

```bash
# Save the script
cat > baseline.sh << 'EOF'
#!/bin/bash
# [script content above]
EOF

# Make executable
chmod +x baseline.sh

# Run it
./baseline.sh
```

---

## 9. Measurement Templates

### CSV Template for Bundle Sizes

```csv
Timestamp,Main.js KB,Vendor-Charts KB,Total JS KB,CSS KB,Total Gzipped KB,Status
2026-04-19-baseline,45,120,346,25,123,baseline
2026-04-19-recharts,45,95,321,25,113,-18KB recharts
2026-04-19-html2canvas,42,95,299,25,104,-22KB h2c
2026-04-19-css,42,95,299,20,99,-15KB css
2026-04-19-react.memo,42,95,299,20,99,0KB (runtime only)
2026-04-19-final,42,95,291,20,101,COMPLETE
```

### JSON Template for Results

```json
{
  "baseline": {
    "timestamp": "2026-04-19T10:30:00Z",
    "bundleSize": { "total": 123, "unit": "KB gzipped" },
    "lighthouse": { "performance": 72, "accessibility": 85 },
    "coreWebVitals": { "fcp": 1800, "tti": 2500 }
  },
  "afterOptimization": {
    "timestamp": "2026-04-19T11:45:00Z",
    "bundleSize": { "total": 101, "unit": "KB gzipped" },
    "lighthouse": { "performance": 85, "accessibility": 87 },
    "coreWebVitals": { "fcp": 1450, "tti": 1700 }
  },
  "improvement": {
    "bundleSizeReduction": { "absolute": -22, "percentage": -18 },
    "performanceGain": { "absolute": 13, "percentage": 18 },
    "coreWebVitalsImprovement": { "fcp": -350, "tti": -800 }
  }
}
```

---

## Summary of Key Commands

| Task | Command |
|------|---------|
| Clean build | `npm run build` |
| List JS files | `ls -lh dist/js/*.js` |
| Gzip analysis | `gzip -c dist/js/*.js \| wc -c` |
| Lighthouse audit | `lighthouse http://localhost:5173 --view` |
| Get FCP | `lighthouse http://localhost:5173 --output=json \| jq '.audits."first-contentful-paint"'` |
| React profiling | Open DevTools → Profiler tab → Record |
| Type check | `npm run type-check` |
| Lint check | `npm run lint:check` |
| Run tests | `npm run test` |
| Coverage report | `npm run test:coverage` |

---

## Quick Start

1. **Build**: `npm run build`
2. **Measure bundle**: `ls -lh dist/js/*.js`
3. **Lighthouse**: `lighthouse http://localhost:5173 --view`
4. **Record results**: Save to CSV or JSON
5. **Compare**: Check improvement vs baseline

Expected Phase 1 Results:
- Bundle size: 18-25% reduction
- Lighthouse: +10-15 points
- TTI: 15-30% improvement
- Overall: 15-20% performance gain
