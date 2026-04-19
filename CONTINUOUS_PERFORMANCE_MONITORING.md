# SolarTrack Pro - Continuous Performance Monitoring Strategy

This document outlines how to set up continuous performance monitoring, automated testing, and regression detection for the SolarTrack Pro project.

---

## Part 1: CI/CD Performance Checks

### Prerequisites for CI/CD Integration

- GitHub Actions (or similar CI/CD platform)
- Lighthouse CI (npm package)
- Bundle analyzer integration
- Performance metrics tracking system

### GitHub Actions Workflow Setup

Create `.github/workflows/performance-check.yml`:

```yaml
name: Performance Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run linter
        run: npm run lint:check
      
      - name: Run tests
        run: npm run test
      
      - name: Build for production
        run: npm run build
      
      - name: Analyze bundle size
        run: npm run perf:bundle-size
      
      - name: Check performance budget
        run: npm run perf:budget-check
      
      - name: Run Lighthouse CI
        run: npm run perf:lighthouse:ci
      
      - name: Upload bundle analysis
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: bundle-analysis
          path: dist/bundle-analysis.html
      
      - name: Upload Lighthouse report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-report
          path: lighthouse-report-ci.json
      
      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('lighthouse-report-ci.json', 'utf8'));
            const performance = (report.categories.performance.score * 100).toFixed(0);
            
            const comment = `## Performance Check Results
            
            **Lighthouse Performance Score**: ${performance}/100
            
            - First Contentful Paint: ${report.audits['first-contentful-paint'].displayValue}
            - Largest Contentful Paint: ${report.audits['largest-contentful-paint'].displayValue}
            - Time to Interactive: ${report.audits.interactive.displayValue}
            - Cumulative Layout Shift: ${report.audits['cumulative-layout-shift'].displayValue}
            - Total Blocking Time: ${report.audits['total-blocking-time'].displayValue}
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

### Lighthouse CI Configuration

Create `.lighthouserc.json` in project root:

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": [
        "http://localhost:5173/"
      ],
      "settings": {
        "configPath": "./.lighthouse/config.js",
        "chromeFlags": "--headless --no-sandbox"
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.75 }],
        "categories:accessibility": ["error", { "minScore": 0.90 }],
        "categories:best-practices": ["error", { "minScore": 0.90 }],
        "categories:seo": ["error", { "minScore": 0.90 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 1500 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "interactive": ["error", { "maxNumericValue": 2000 }]
      }
    }
  }
}
```

---

## Part 2: Bundle Size Monitoring

### Automated Bundle Size Reporting

Create `scripts/report-bundle-size.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PREVIOUS_REPORT = 'dist/bundle-report.json';

function getFileSizes(dir, extension = '.js') {
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(extension))
    .map(file => {
      const fullPath = path.join(dir, file);
      const size = fs.statSync(fullPath).size;
      return { file, size };
    });
  
  return files;
}

function generateReport() {
  const distDir = path.join(process.cwd(), 'dist');
  const jsDir = path.join(distDir, 'js');
  const cssDir = path.join(distDir, 'css');
  
  const jsFiles = getFileSizes(jsDir, '.js');
  const cssFiles = getFileSizes(cssDir, '.css');
  
  const report = {
    timestamp: new Date().toISOString(),
    js: jsFiles,
    css: cssFiles,
    totalJs: jsFiles.reduce((sum, f) => sum + f.size, 0),
    totalCss: cssFiles.reduce((sum, f) => sum + f.size, 0),
  };
  
  report.total = report.totalJs + report.totalCss;
  
  // Compare to previous if exists
  if (fs.existsSync(PREVIOUS_REPORT)) {
    const previous = JSON.parse(fs.readFileSync(PREVIOUS_REPORT, 'utf8'));
    report.changes = {
      js: report.totalJs - previous.totalJs,
      css: report.totalCss - previous.totalCss,
      total: report.total - previous.total,
    };
  }
  
  // Save report
  fs.writeFileSync(
    PREVIOUS_REPORT,
    JSON.stringify(report, null, 2)
  );
  
  // Print summary
  console.log('\n📊 Bundle Size Report');
  console.log('═'.repeat(60));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`\nJavaScript: ${(report.totalJs / 1024).toFixed(2)} KB`);
  console.log(`CSS: ${(report.totalCss / 1024).toFixed(2)} KB`);
  console.log(`Total: ${(report.total / 1024).toFixed(2)} KB`);
  
  if (report.changes) {
    const jsChange = (report.changes.js / 1024).toFixed(2);
    const cssChange = (report.changes.css / 1024).toFixed(2);
    const totalChange = (report.changes.total / 1024).toFixed(2);
    
    console.log('\nChanges from previous:');
    console.log(`  JS: ${jsChange > 0 ? '+' : ''}${jsChange} KB`);
    console.log(`  CSS: ${cssChange > 0 ? '+' : ''}${cssChange} KB`);
    console.log(`  Total: ${totalChange > 0 ? '+' : ''}${totalChange} KB`);
    
    if (Math.abs(report.changes.total) > 10 * 1024) {
      console.warn('⚠️  WARNING: Bundle size changed by more than 10 KB');
      process.exit(1);
    }
  }
}

generateReport();
```

Add to package.json:

```json
{
  "scripts": {
    "perf:bundle-report": "npm run build && node scripts/report-bundle-size.js"
  }
}
```

### Bundle Size Trend Tracking

Create `scripts/track-bundle-trends.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const TRENDS_DIR = 'performance-trends';
const TRENDS_FILE = path.join(TRENDS_DIR, 'bundle-sizes.json');

function ensureTrendsDir() {
  if (!fs.existsSync(TRENDS_DIR)) {
    fs.mkdirSync(TRENDS_DIR, { recursive: true });
  }
}

function recordTrend() {
  ensureTrendsDir();
  
  const reportPath = 'dist/bundle-report.json';
  if (!fs.existsSync(reportPath)) {
    console.error('No bundle report found. Run npm run perf:bundle-report first.');
    process.exit(1);
  }
  
  const currentReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  
  let trends = [];
  if (fs.existsSync(TRENDS_FILE)) {
    trends = JSON.parse(fs.readFileSync(TRENDS_FILE, 'utf8'));
  }
  
  // Record this measurement
  trends.push({
    timestamp: currentReport.timestamp,
    date: new Date(currentReport.timestamp).toLocaleDateString(),
    totalJs: currentReport.totalJs,
    totalCss: currentReport.totalCss,
    total: currentReport.total,
  });
  
  // Keep last 30 measurements
  trends = trends.slice(-30);
  
  fs.writeFileSync(TRENDS_FILE, JSON.stringify(trends, null, 2));
  
  // Print trend
  console.log('\n📈 Bundle Size Trend');
  console.log('═'.repeat(60));
  
  const last5 = trends.slice(-5);
  last5.forEach((trend, idx) => {
    const totalKb = (trend.total / 1024).toFixed(2);
    const bar = '█'.repeat(Math.round(trend.total / 5000));
    console.log(`${trend.date} | ${totalKb}KB | ${bar}`);
  });
  
  // Check for degradation
  if (trends.length > 1) {
    const current = trends[trends.length - 1];
    const previous = trends[trends.length - 2];
    const increase = current.total - previous.total;
    
    if (increase > 10 * 1024) {
      console.warn('\n⚠️  Bundle size increased significantly!');
      console.warn(`   Increase: ${(increase / 1024).toFixed(2)} KB`);
    }
  }
}

recordTrend();
```

---

## Part 3: Performance Metric Tracking

### Metrics Database Setup

Create `scripts/init-metrics-db.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DB_FILE = 'performance-metrics.json';

function initializeDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const db = {
      version: '1.0',
      created: new Date().toISOString(),
      measurements: []
    };
    
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    console.log(`✅ Performance metrics database initialized: ${DB_FILE}`);
  } else {
    console.log(`ℹ️  Performance metrics database already exists: ${DB_FILE}`);
  }
}

initializeDatabase();
```

### Record Metrics Script

Create `scripts/record-metrics.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

const DB_FILE = 'performance-metrics.json';
const LIGHTHOUSE_REPORT = 'lighthouse-report-ci.json';

function recordMetrics() {
  if (!fs.existsSync(LIGHTHOUSE_REPORT)) {
    console.error('Lighthouse report not found. Run Lighthouse audit first.');
    process.exit(1);
  }
  
  const lighthouseData = JSON.parse(
    fs.readFileSync(LIGHTHOUSE_REPORT, 'utf8')
  );
  
  const bundleReport = fs.existsSync('dist/bundle-report.json')
    ? JSON.parse(fs.readFileSync('dist/bundle-report.json', 'utf8'))
    : null;
  
  const measurement = {
    timestamp: new Date().toISOString(),
    git: {
      commit: execSync('git rev-parse HEAD').toString().trim(),
      branch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim(),
      message: execSync('git log -1 --pretty=%B').toString().trim(),
    },
    lighthouse: {
      performance: lighthouseData.categories.performance.score * 100,
      accessibility: lighthouseData.categories.accessibility.score * 100,
      best_practices: lighthouseData.categories['best-practices'].score * 100,
      seo: lighthouseData.categories.seo.score * 100,
    },
    metrics: {
      fcp: parseFloat(lighthouseData.audits['first-contentful-paint'].displayValue),
      lcp: parseFloat(lighthouseData.audits['largest-contentful-paint'].displayValue),
      tti: parseFloat(lighthouseData.audits.interactive.displayValue),
      cls: parseFloat(lighthouseData.audits['cumulative-layout-shift'].displayValue),
      tbt: parseFloat(lighthouseData.audits['total-blocking-time'].displayValue),
    },
    bundle: bundleReport ? {
      totalJs: bundleReport.totalJs,
      totalCss: bundleReport.totalCss,
      total: bundleReport.total,
    } : null,
  };
  
  // Load existing database
  let db = { version: '1.0', measurements: [] };
  if (fs.existsSync(DB_FILE)) {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
  
  // Add new measurement
  db.measurements.push(measurement);
  
  // Keep last 100 measurements
  db.measurements = db.measurements.slice(-100);
  
  // Save database
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  
  console.log('✅ Metrics recorded successfully');
  console.log(`   Commit: ${measurement.git.commit.substring(0, 7)}`);
  console.log(`   Performance Score: ${measurement.lighthouse.performance.toFixed(1)}/100`);
  console.log(`   Bundle Size: ${(measurement.bundle?.total / 1024).toFixed(2)} KB`);
}

recordMetrics();
```

### Metrics Analysis & Reporting

Create `scripts/analyze-metrics.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');

const DB_FILE = 'performance-metrics.json';

function analyzeMetrics() {
  if (!fs.existsSync(DB_FILE)) {
    console.error('No metrics database found. Run metrics recording first.');
    process.exit(1);
  }
  
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  
  if (db.measurements.length < 2) {
    console.log('Not enough measurements for analysis yet.');
    return;
  }
  
  const measurements = db.measurements;
  const current = measurements[measurements.length - 1];
  const previous = measurements[measurements.length - 2];
  const baseline = measurements[0];
  
  console.log('\n📊 Performance Metrics Analysis');
  console.log('═'.repeat(80));
  
  // Performance Score
  console.log('\nPerformance Score:');
  console.log(`  Current: ${current.lighthouse.performance.toFixed(1)}/100`);
  console.log(`  Previous: ${previous.lighthouse.performance.toFixed(1)}/100`);
  console.log(`  Baseline: ${baseline.lighthouse.performance.toFixed(1)}/100`);
  console.log(`  Change: ${(current.lighthouse.performance - previous.lighthouse.performance).toFixed(1)} points`);
  
  // Bundle Size
  if (current.bundle) {
    console.log('\nBundle Size:');
    const currentSize = (current.bundle.total / 1024).toFixed(2);
    const previousSize = (previous.bundle?.total / 1024).toFixed(2);
    const baselineSize = (baseline.bundle?.total / 1024).toFixed(2);
    const change = current.bundle.total - (previous.bundle?.total || 0);
    
    console.log(`  Current: ${currentSize} KB`);
    console.log(`  Previous: ${previousSize} KB`);
    console.log(`  Baseline: ${baselineSize} KB`);
    console.log(`  Change: ${change > 0 ? '+' : ''}${(change / 1024).toFixed(2)} KB`);
  }
  
  // Core Web Vitals
  console.log('\nCore Web Vitals (Current):');
  console.log(`  FCP: ${current.metrics.fcp} ms`);
  console.log(`  LCP: ${current.metrics.lcp} ms`);
  console.log(`  TTI: ${current.metrics.tti} ms`);
  console.log(`  CLS: ${current.metrics.cls.toFixed(3)}`);
  
  // Regression Detection
  console.log('\nRegression Detection:');
  let hasRegressions = false;
  
  if (current.lighthouse.performance < previous.lighthouse.performance - 5) {
    console.warn('⚠️  Performance score decreased by more than 5 points');
    hasRegressions = true;
  }
  
  if (current.bundle && previous.bundle && 
      current.bundle.total > previous.bundle.total + 10 * 1024) {
    console.warn('⚠️  Bundle size increased by more than 10 KB');
    hasRegressions = true;
  }
  
  if (current.metrics.tti > previous.metrics.tti + 100) {
    console.warn('⚠️  TTI increased by more than 100ms');
    hasRegressions = true;
  }
  
  if (!hasRegressions) {
    console.log('✅ No significant regressions detected');
  }
}

analyzeMetrics();
```

---

## Part 4: Performance Budget Alerts

### Budget Configuration

Create `performance-budgets.json`:

```json
{
  "budgets": [
    {
      "type": "bundle",
      "name": "JavaScript (total, gzipped)",
      "size": "170KB",
      "warning": "160KB"
    },
    {
      "type": "bundle",
      "name": "main.js",
      "size": "50KB",
      "warning": "45KB"
    },
    {
      "type": "bundle",
      "name": "vendor-charts.js",
      "size": "90KB",
      "warning": "85KB"
    },
    {
      "type": "lighthouse",
      "name": "Performance Score",
      "minimum": 75,
      "warning": 80
    },
    {
      "type": "metric",
      "name": "Time to Interactive",
      "max": "2000ms",
      "warning": "1900ms"
    },
    {
      "type": "metric",
      "name": "First Contentful Paint",
      "max": "1500ms",
      "warning": "1400ms"
    },
    {
      "type": "metric",
      "name": "Cumulative Layout Shift",
      "max": 0.1,
      "warning": 0.08
    }
  ]
}
```

### Budget Validation Script

Create `scripts/validate-budgets.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');

const BUDGETS = 'performance-budgets.json';
const LIGHTHOUSE_REPORT = 'lighthouse-report-ci.json';
const BUNDLE_REPORT = 'dist/bundle-report.json';

function validateBudgets() {
  if (!fs.existsSync(BUDGETS)) {
    console.error('Budget configuration not found.');
    process.exit(1);
  }
  
  const budgets = JSON.parse(fs.readFileSync(BUDGETS, 'utf8'));
  let violations = [];
  let warnings = [];
  
  console.log('\n🎯 Performance Budget Validation');
  console.log('═'.repeat(60));
  
  // Validate bundle budgets
  if (fs.existsSync(BUNDLE_REPORT)) {
    const bundle = JSON.parse(fs.readFileSync(BUNDLE_REPORT, 'utf8'));
    
    budgets.budgets.forEach(budget => {
      if (budget.type === 'bundle') {
        let actual = 0;
        
        if (budget.name.includes('JavaScript (total')) {
          actual = bundle.totalJs;
        } else if (budget.name === 'main.js') {
          const mainFile = bundle.js.find(f => f.file.startsWith('main'));
          actual = mainFile ? mainFile.size : 0;
        }
        
        const budgetSize = parseFloat(budget.size) * 1024;
        const warningSize = budget.warning ? parseFloat(budget.warning) * 1024 : budgetSize * 0.9;
        
        const actualKb = (actual / 1024).toFixed(2);
        const budgetKb = (budgetSize / 1024).toFixed(2);
        
        if (actual > budgetSize) {
          violations.push(`${budget.name}: ${actualKb}KB exceeds budget ${budgetKb}KB`);
          console.log(`❌ ${budget.name}: ${actualKb}KB (budget: ${budgetKb}KB)`);
        } else if (actual > warningSize) {
          warnings.push(`${budget.name}: ${actualKb}KB approaching budget ${budgetKb}KB`);
          console.log(`⚠️  ${budget.name}: ${actualKb}KB (budget: ${budgetKb}KB)`);
        } else {
          console.log(`✅ ${budget.name}: ${actualKb}KB (budget: ${budgetKb}KB)`);
        }
      }
    });
  }
  
  // Validate Lighthouse budgets
  if (fs.existsSync(LIGHTHOUSE_REPORT)) {
    const lighthouse = JSON.parse(fs.readFileSync(LIGHTHOUSE_REPORT, 'utf8'));
    
    budgets.budgets.forEach(budget => {
      if (budget.type === 'lighthouse') {
        const score = lighthouse.categories.performance.score * 100;
        
        if (score < budget.minimum) {
          violations.push(`${budget.name}: ${score.toFixed(0)} below minimum ${budget.minimum}`);
          console.log(`❌ ${budget.name}: ${score.toFixed(0)} (minimum: ${budget.minimum})`);
        } else if (score < budget.warning) {
          warnings.push(`${budget.name}: ${score.toFixed(0)} below warning ${budget.warning}`);
          console.log(`⚠️  ${budget.name}: ${score.toFixed(0)} (warning: ${budget.warning})`);
        } else {
          console.log(`✅ ${budget.name}: ${score.toFixed(0)}`);
        }
      }
    });
  }
  
  console.log('\n' + '═'.repeat(60));
  
  if (violations.length > 0) {
    console.error(`\n❌ ${violations.length} budget violation(s):`);
    violations.forEach(v => console.error(`   - ${v}`));
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn(`\n⚠️  ${warnings.length} budget warning(s):`);
    warnings.forEach(w => console.warn(`   - ${w}`));
  }
  
  if (violations.length === 0 && warnings.length === 0) {
    console.log('✅ All performance budgets met!\n');
  }
}

validateBudgets();
```

---

## Part 5: Regression Detection

### Performance Regression Detector

Create `scripts/detect-regressions.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');

const DB_FILE = 'performance-metrics.json';
const REGRESSION_THRESHOLD = {
  performance: -5,        // 5 point drop
  bundle: 10 * 1024,      // 10 KB increase
  tti: 100,               // 100ms increase
  fcp: 100,               // 100ms increase
  lcp: 200,               // 200ms increase
};

function detectRegressions() {
  if (!fs.existsSync(DB_FILE)) {
    console.log('No metrics history. Baseline measurement.');
    return;
  }
  
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  
  if (db.measurements.length < 2) {
    console.log('Not enough history for regression detection.');
    return;
  }
  
  const current = db.measurements[db.measurements.length - 1];
  const previous = db.measurements[db.measurements.length - 2];
  
  const regressions = [];
  
  console.log('\n🔍 Performance Regression Detection');
  console.log('═'.repeat(60));
  
  // Check Lighthouse score
  const perfDrop = current.lighthouse.performance - previous.lighthouse.performance;
  if (perfDrop < REGRESSION_THRESHOLD.performance) {
    regressions.push({
      type: 'Performance Score',
      previous: previous.lighthouse.performance.toFixed(1),
      current: current.lighthouse.performance.toFixed(1),
      change: perfDrop.toFixed(1),
      threshold: REGRESSION_THRESHOLD.performance
    });
  }
  
  // Check bundle size
  if (current.bundle && previous.bundle) {
    const bundleIncrease = current.bundle.total - previous.bundle.total;
    if (bundleIncrease > REGRESSION_THRESHOLD.bundle) {
      regressions.push({
        type: 'Bundle Size',
        previous: (previous.bundle.total / 1024).toFixed(2) + ' KB',
        current: (current.bundle.total / 1024).toFixed(2) + ' KB',
        change: (bundleIncrease / 1024).toFixed(2) + ' KB',
        threshold: (REGRESSION_THRESHOLD.bundle / 1024).toFixed(2) + ' KB'
      });
    }
  }
  
  // Check TTI
  const ttiIncrease = current.metrics.tti - previous.metrics.tti;
  if (ttiIncrease > REGRESSION_THRESHOLD.tti) {
    regressions.push({
      type: 'Time to Interactive',
      previous: previous.metrics.tti + ' ms',
      current: current.metrics.tti + ' ms',
      change: ttiIncrease.toFixed(0) + ' ms',
      threshold: REGRESSION_THRESHOLD.tti + ' ms'
    });
  }
  
  // Check FCP
  const fcpIncrease = current.metrics.fcp - previous.metrics.fcp;
  if (fcpIncrease > REGRESSION_THRESHOLD.fcp) {
    regressions.push({
      type: 'First Contentful Paint',
      previous: previous.metrics.fcp + ' ms',
      current: current.metrics.fcp + ' ms',
      change: fcpIncrease.toFixed(0) + ' ms',
      threshold: REGRESSION_THRESHOLD.fcp + ' ms'
    });
  }
  
  if (regressions.length === 0) {
    console.log('✅ No regressions detected\n');
    return;
  }
  
  console.log(`❌ ${regressions.length} regression(s) detected:\n`);
  
  regressions.forEach(r => {
    console.log(`${r.type}:`);
    console.log(`  Previous: ${r.previous}`);
    console.log(`  Current: ${r.current}`);
    console.log(`  Change: ${r.change} (threshold: ${r.threshold})`);
    console.log('');
  });
  
  process.exit(1);
}

detectRegressions();
```

---

## Part 6: Monitoring Dashboard

### Simple Performance Dashboard Generator

Create `scripts/generate-dashboard.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DB_FILE = 'performance-metrics.json';

function generateDashboard() {
  if (!fs.existsSync(DB_FILE)) {
    console.error('No metrics database found.');
    process.exit(1);
  }
  
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const measurements = db.measurements.slice(-30); // Last 30 measurements
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SolarTrack Pro - Performance Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      color: #333;
      margin-bottom: 30px;
      text-align: center;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .metric-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .metric-card h3 {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    
    .metric-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }
    
    .metric-card .change {
      font-size: 14px;
      margin-top: 10px;
      color: #666;
    }
    
    .chart-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
      position: relative;
      height: 300px;
    }
    
    .chart-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 SolarTrack Pro - Performance Dashboard</h1>
    
    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Performance Score</h3>
        <div class="value">${measurements[measurements.length - 1].lighthouse.performance.toFixed(0)}</div>
        <div class="change">/100</div>
      </div>
      
      <div class="metric-card">
        <h3>Bundle Size</h3>
        <div class="value">${(measurements[measurements.length - 1].bundle?.total / 1024).toFixed(0)}</div>
        <div class="change">KB (gzipped)</div>
      </div>
      
      <div class="metric-card">
        <h3>Time to Interactive</h3>
        <div class="value">${measurements[measurements.length - 1].metrics.tti.toFixed(0)}</div>
        <div class="change">ms</div>
      </div>
      
      <div class="metric-card">
        <h3>First Contentful Paint</h3>
        <div class="value">${measurements[measurements.length - 1].metrics.fcp.toFixed(0)}</div>
        <div class="change">ms</div>
      </div>
    </div>
    
    <div class="chart-container">
      <div class="chart-title">Performance Score Over Time</div>
      <canvas id="performanceChart"></canvas>
    </div>
    
    <div class="chart-container">
      <div class="chart-title">Bundle Size Over Time</div>
      <canvas id="bundleChart"></canvas>
    </div>
    
    <div class="chart-container">
      <div class="chart-title">Core Web Vitals Over Time</div>
      <canvas id="metricsChart"></canvas>
    </div>
  </div>
  
  <script>
    const measurements = ${JSON.stringify(measurements)};
    
    // Performance Score Chart
    new Chart(document.getElementById('performanceChart'), {
      type: 'line',
      data: {
        labels: measurements.map(m => new Date(m.timestamp).toLocaleDateString()),
        datasets: [{
          label: 'Performance Score',
          data: measurements.map(m => m.lighthouse.performance),
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100 }
        }
      }
    });
    
    // Bundle Size Chart
    new Chart(document.getElementById('bundleChart'), {
      type: 'line',
      data: {
        labels: measurements.map(m => new Date(m.timestamp).toLocaleDateString()),
        datasets: [{
          label: 'Bundle Size (KB)',
          data: measurements.map(m => (m.bundle?.total / 1024) || 0),
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
    
    // Core Web Vitals Chart
    new Chart(document.getElementById('metricsChart'), {
      type: 'line',
      data: {
        labels: measurements.map(m => new Date(m.timestamp).toLocaleDateString()),
        datasets: [
          {
            label: 'TTI (ms)',
            data: measurements.map(m => m.metrics.tti),
            borderColor: '#2196F3',
            yAxisID: 'y'
          },
          {
            label: 'FCP (ms)',
            data: measurements.map(m => m.metrics.fcp),
            borderColor: '#4CAF50',
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync('performance-dashboard.html', html);
  console.log('✅ Dashboard generated: performance-dashboard.html');
}

generateDashboard();
```

Add to package.json:

```json
{
  "scripts": {
    "perf:dashboard": "node scripts/generate-dashboard.js && open performance-dashboard.html"
  }
}
```

---

## Part 7: Performance Monitoring Checklist

### Monthly Performance Review

- [ ] Review performance-metrics.json for trends
- [ ] Generate performance dashboard: `npm run perf:dashboard`
- [ ] Check for regressions: `npm run perf:regression-check`
- [ ] Validate all budgets: `npm run perf:budget-check`
- [ ] Document findings in performance log
- [ ] Share metrics with team
- [ ] Plan optimizations if needed

### Quarterly Performance Audit

- [ ] Full Lighthouse audit (3 runs, averaged)
- [ ] Bundle analysis comparison
- [ ] Core Web Vitals assessment
- [ ] Recommend next Phase optimizations
- [ ] Update performance targets
- [ ] Review Phase 2/3 roadmap

### Post-Deployment Monitoring

After Phase 1 or any major changes:

- [ ] Monitor Lighthouse scores daily for 1 week
- [ ] Track bundle size changes
- [ ] Monitor real user metrics (RUM) if available
- [ ] Be ready to rollback if regressions detected
- [ ] Celebrate improvements with team

---

## Summary: CI/CD Integration

```bash
# Add to CI pipeline:

# 1. Build and measure baseline
npm run build
npm run perf:bundle-report

# 2. Record metrics
npm run perf:lighthouse:ci
node scripts/record-metrics.js

# 3. Detect regressions
node scripts/detect-regressions.js

# 4. Validate budgets
npm run perf:budget-check

# 5. Generate reports
npm run perf:dashboard
node scripts/analyze-metrics.js
```

This continuous monitoring ensures performance improvements from Phase 1 are maintained and tracked over time.
