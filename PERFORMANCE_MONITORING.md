# SolarTrack Pro - Performance Monitoring Guide

## Overview

This guide explains the performance monitoring system implemented for SolarTrack Pro. It tracks Core Web Vitals, custom metrics, and bundle loading performance to ensure optimal user experience.

## Performance Monitoring System

### Architecture

The monitoring system (`src/lib/performanceMonitoring.js`) is a singleton that:
1. Observes browser performance APIs
2. Tracks Core Web Vitals
3. Measures custom metrics
4. Sends data to analytics platforms
5. Provides real-time metric access

## Core Web Vitals

### 1. Largest Contentful Paint (LCP)

**Definition:** Time when the largest visible element is rendered

**Measurement:**
- Uses PerformanceObserver API
- Tracks: `renderTime` or `loadTime`

**Thresholds:**
- Good: < 2,500ms (2.5 seconds)
- Needs Improvement: 2,500ms - 4,000ms
- Poor: > 4,000ms

**Optimization Tips:**
- Optimize images (use WebP, lazy loading)
- Minimize JavaScript (code splitting, tree-shaking)
- Defer non-critical CSS
- Use efficient fonts

**SolarTrack Pro Status:**
- Target: < 2.5s
- Expected with optimizations: 1.8-2.2s
- Achievable by: Route-based code splitting + image optimization

### 2. First Input Delay (FID)

**Definition:** Time from user input to browser response

**Measurement:**
- Uses PerformanceObserver API
- Tracks: `processingDuration` of first interaction

**Thresholds:**
- Good: < 100ms
- Needs Improvement: 100ms - 300ms
- Poor: > 300ms

**Optimization Tips:**
- Break up long JavaScript tasks (code splitting)
- Use Web Workers for heavy computations
- Defer non-critical JavaScript
- Optimize event handlers

**SolarTrack Pro Status:**
- Target: < 100ms
- Expected with optimizations: 50-80ms
- Achievable by: Route code splitting + Web Workers

### 3. Cumulative Layout Shift (CLS)

**Definition:** Visual instability from unexpected layout changes

**Measurement:**
- Uses PerformanceObserver API
- Tracks cumulative shift score (ignores user input)

**Thresholds:**
- Good: < 0.1
- Needs Improvement: 0.1 - 0.25
- Poor: > 0.25

**Optimization Tips:**
- Reserve space for dynamic content
- Avoid inserting content above existing content
- Use CSS transforms instead of layout-affecting properties
- Load fonts asynchronously

**SolarTrack Pro Status:**
- Target: < 0.1
- Expected: 0.05-0.08
- Achievable by: CSS optimizations + font loading strategy

## Custom Metrics

### Time to Interactive (TTI)

**Definition:** When page is fully interactive and responsive

**Implementation:**
```javascript
metrics.tti = {
  value: performance.now() - startTime,
  rating: rateTTI(value)
}
```

**Targets:**
- Good: < 2,000ms
- Needs Improvement: 2,000ms - 3,500ms
- Poor: > 3,500ms

### First Contentful Paint (FCP)

**Definition:** When first content is rendered

**Measurement:** Tracks paint timing from PerformanceObserver

**Targets:**
- Good: < 1,800ms
- Needs Improvement: 1,800ms - 3,000ms
- Poor: > 3,000ms

### Navigation Timing Breakdown

Tracks performance phases:
- **DNS:** Domain lookup time
- **TCP:** Connection establishment
- **Request:** Time to first byte
- **Response:** Data transfer time
- **DOM:** DOM processing time
- **Load:** Full page load time

**Example Output:**
```javascript
{
  dns: 45,        // ms
  tcp: 120,       // ms
  request: 200,   // ms
  response: 580,  // ms
  dom: 450,       // ms
  load: 180,      // ms
  total: 1575     // ms
}
```

## Integration with React

### Manual Initialization

```javascript
// In main.jsx or App initialization
import performanceMonitor from './lib/performanceMonitoring'

// Initialize monitoring
performanceMonitor.initialize()
```

### Accessing Metrics

```javascript
// Get specific metric
const lcp = performanceMonitor.metrics.lcp
// { value: 1850, rating: 'good' }

// Get all metrics
const allMetrics = performanceMonitor.getMetrics()

// Get summary
const summary = performanceMonitor.getSummary()
// {
//   coreWebVitals: { lcp, fid, cls },
//   customMetrics: { tti, fcp, navTiming },
//   timestamp: '2026-04-18T21:30:00.000Z'
// }
```

## Analytics Integration

### Google Analytics

The monitoring system automatically sends metrics to Google Analytics if gtag is available:

```javascript
window.gtag('event', `perf_lcp`, {
  value: 1850,
  rating: 'good'
})
```

### Custom Integration

Override `sendMetricToAnalytics` for custom platforms:

```javascript
performanceMonitor.sendMetricToAnalytics = (metricName, data) => {
  fetch('https://your-api.com/metrics', {
    method: 'POST',
    body: JSON.stringify({
      metric: metricName,
      value: data.value,
      rating: data.rating,
      timestamp: new Date().toISOString()
    })
  })
}
```

## Performance Dashboard

### Creating a Performance Dashboard

```javascript
// Create a component to display metrics
import performanceMonitor from '@/lib/performanceMonitoring'

export function PerformanceDashboard() {
  const metrics = performanceMonitor.getSummary()
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Performance Metrics</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="LCP"
          value={metrics.coreWebVitals.lcp?.value}
          rating={metrics.coreWebVitals.lcp?.rating}
          target="2.5s"
        />
        <MetricCard
          label="FID"
          value={metrics.coreWebVitals.fid?.value}
          rating={metrics.coreWebVitals.fid?.rating}
          target="100ms"
        />
        <MetricCard
          label="CLS"
          value={metrics.coreWebVitals.cls?.value}
          rating={metrics.coreWebVitals.cls?.rating}
          target="0.1"
        />
      </div>
    </div>
  )
}

function MetricCard({ label, value, rating, target }) {
  const ratingColor = {
    'good': 'text-green-600',
    'needs-improvement': 'text-yellow-600',
    'poor': 'text-red-600'
  }[rating]
  
  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold">{label}</h3>
      <p className={`text-2xl ${ratingColor}`}>{value?.toFixed(0)}ms</p>
      <p className="text-sm text-gray-500">Target: {target}</p>
    </div>
  )
}
```

## Performance Budget

### Setting Thresholds

```javascript
// In vite.config.js (future implementation)
const performanceBudget = {
  bundles: [
    {
      name: 'app',
      maxSize: '800kb'
    },
    {
      name: 'vendor-react',
      maxSize: '200kb'
    },
    {
      name: 'vendor-charts',
      maxSize: '150kb'
    }
  ]
}
```

## Development Monitoring

### Console Logging

In development mode, metrics are logged to console:

```
[Performance] lcp: { value: 1850, rating: 'good' }
[Performance] fid: { value: 45, rating: 'good' }
[Performance] cls: { value: 0.05, rating: 'good' }
```

### Chrome DevTools

1. **Performance Tab:**
   - Run performance recording
   - Review filmstrip
   - Check CPU/Memory usage

2. **Lighthouse:**
   - Run audit (npm run build then preview)
   - Review Performance, Accessibility, SEO scores
   - Follow recommendations

3. **Network Tab:**
   - Check bundle sizes
   - Verify code splitting
   - Monitor lazy loading

## Production Monitoring

### Real User Monitoring (RUM)

Collect metrics from actual users:

```javascript
// Send metrics to analytics
const summary = performanceMonitor.getSummary()
analytics.track('performance_summary', summary)
```

### Error Tracking

Monitor performance-related errors:

```javascript
try {
  const metrics = performanceMonitor.getMetrics()
} catch (error) {
  errorTracking.reportError('PerformanceMonitorError', error)
}
```

## Performance Targets by Page

### Dashboard Page
- LCP: < 2.0s
- FCP: < 1.5s
- TTI: < 2.5s

### Analytics Pages
- LCP: < 2.5s (charts take time to render)
- FCP: < 1.8s
- TTI: < 3.0s

### Admin Pages
- LCP: < 2.0s
- FCP: < 1.5s
- TTI: < 2.5s

### PDF Export
- Load time: < 3.0s
- Chunk size: < 500KB

### Excel Export
- Load time: < 3.0s
- Chunk size: < 600KB

## Optimization Strategies

### For LCP Improvement
1. Route code splitting (already implemented)
2. Image optimization
3. Font optimization
4. CSS optimization
5. Server-side rendering (future)

### For FID Improvement
1. Code splitting (already implemented)
2. Web Workers for heavy tasks
3. Defer non-critical scripts
4. Optimize event handlers

### For CLS Improvement
1. CSS containment
2. Font display: swap
3. Reserve space for images
4. Avoid dynamic height changes

## Troubleshooting

### Metrics Not Appearing

```javascript
// Check if PerformanceObserver is supported
if ('PerformanceObserver' in window) {
  console.log('Performance monitoring is supported')
} else {
  console.warn('Performance monitoring not supported in this browser')
}
```

### High LCP Values

1. Check bundle size: `npm run build && open dist/bundle-analysis.html`
2. Review largest assets
3. Check for render-blocking resources
4. Optimize image loading

### High FID Values

1. Check for long JavaScript tasks
2. Profile CPU usage in DevTools
3. Review event handlers
4. Consider Web Workers

### High CLS Values

1. Review CSS transitions
2. Check for dynamic content insertion
3. Verify font loading
4. Test on slower connections

## Reporting

### Weekly Performance Report

```javascript
const weeklyReport = {
  dateRange: '2026-04-18 to 2026-04-25',
  avgMetrics: {
    lcp: 1850,
    fid: 45,
    cls: 0.05,
    tti: 1950
  },
  passRate: {
    lcp: 95,  // % of sessions < 2.5s
    fid: 98,
    cls: 99
  },
  topIssues: [
    'Materials page LCP = 2.8s',
    'PDF export FID = 150ms'
  ],
  recommendations: [
    'Optimize Materials page images',
    'Defer PDF loading'
  ]
}
```

## References

- [Web Vitals Documentation](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [React Code Splitting](https://react.dev/reference/react/lazy)
- [PerformanceObserver API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver)
