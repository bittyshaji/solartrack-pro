# Performance Monitoring Guide
## SolarTrack Pro - Phase 4 Optimization

**Purpose**: Quick reference for using performance monitoring and dynamic imports  
**Audience**: Developers  
**Updated**: April 18, 2026

---

## Quick Start

### Accessing Performance Metrics

```javascript
// In your React component or service
import performanceMonitoring from '@/lib/performanceMonitoring'

// Get current metrics
const metrics = performanceMonitoring.getMetrics()
console.log('LCP:', metrics.lcp?.value)
console.log('FID:', metrics.fid?.value)
console.log('CLS:', metrics.cls?.value)

// Get summary
const summary = performanceMonitoring.getSummary()
console.log('Performance Summary:', summary)

// Export for analytics
const exported = performanceMonitoring.exportMetrics()
// Send to your analytics platform
```

---

## Dynamic Imports

### Using Dynamic Imports

#### PDF Export
```javascript
import { loadjsPDF } from '@/services/operations'

async function generateReport(data) {
  try {
    const { jsPDF } = await loadjsPDF()
    const doc = new jsPDF()
    // ... generate PDF
    doc.save('report.pdf')
  } catch (error) {
    console.error('PDF generation failed:', error)
  }
}
```

#### Excel Export
```javascript
import { loadXLSX } from '@/services/operations'

async function exportToExcel(data) {
  try {
    const XLSX = await loadXLSX()
    const sheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet)
    XLSX.writeFile(workbook, 'data.xlsx')
  } catch (error) {
    console.error('Excel export failed:', error)
  }
}
```

### Preloading Libraries

#### Single Library
```javascript
import { preloadLibrary } from '@/services/operations'

useEffect(() => {
  // Preload PDF library before user needs it
  preloadLibrary('jspdf')
}, [])
```

#### Multiple Libraries
```javascript
import { preloadLibraries } from '@/services/operations'

useEffect(() => {
  // Preload multiple libraries in parallel
  preloadLibraries(['jspdf', 'xlsx'])
}, [])
```

---

## Performance Metrics

### Core Web Vitals

#### Largest Contentful Paint (LCP)
**What**: How quickly does the main content appear?

```javascript
// Access LCP metric
const lcp = performanceMonitoring.getMetrics().lcp
// { value: 1850, rating: 'good' }

// Ratings:
// 'good': < 2500ms
// 'needs-improvement': 2500-4000ms
// 'poor': > 4000ms
```

**Target**: < 2.5 seconds  
**How to improve**: Optimize images, lazy load off-screen content

#### First Input Delay (FID)
**What**: How responsive is the page to user clicks?

```javascript
const fid = performanceMonitoring.getMetrics().fid
// { value: 45, rating: 'good' }

// Ratings:
// 'good': < 100ms
// 'needs-improvement': 100-300ms
// 'poor': > 300ms
```

**Target**: < 100 milliseconds  
**How to improve**: Reduce JavaScript execution, use Web Workers

#### Cumulative Layout Shift (CLS)
**What**: Does the page layout shift unexpectedly?

```javascript
const cls = performanceMonitoring.getMetrics().cls
// { value: 0.08, rating: 'good' }

// Ratings:
// 'good': < 0.1
// 'needs-improvement': 0.1-0.25
// 'poor': > 0.25
```

**Target**: < 0.1  
**How to improve**: Set image/video dimensions, avoid inserting content above existing content

### Custom Metrics

#### Time to Interactive (TTI)
**What**: When can the user interact with the page?

```javascript
const tti = performanceMonitoring.getMetrics().tti
// { value: 2400, rating: 'good' }

// Ratings:
// 'good': < 2000ms
// 'needs-improvement': 2000-3500ms
// 'poor': > 3500ms
```

#### Route Performance
**What**: How long do individual routes take to load?

```javascript
const summary = performanceMonitoring.getSummary()
// Routes in summary.routeMetrics

// Example:
// '/dashboard': { count: 5, avg: 245, min: 200, max: 320 }
// Tells you the dashboard averaged 245ms to load
```

#### Dynamic Import Performance
**What**: How long does it take to load jsPDF, XLSX?

```javascript
const dynamicMetrics = performanceMonitoring.getMetrics().dynamicImportMetrics
// {
//   'jsPDF': { loadTime: 380, timestamp: '2026-04-18T...' },
//   'XLSX': { loadTime: 340, timestamp: '2026-04-18T...' }
// }
```

---

## Tracking Custom Metrics

### Track Route Performance

```javascript
import performanceMonitoring from '@/lib/performanceMonitoring'

export function ReportsPage() {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      performanceMonitoring.trackRouteMetric('/reports', endTime - startTime)
    }
  }, [])
  
  return <ReportsContent />
}
```

### Track Dynamic Import Performance

```javascript
import { trackDynamicImportLoad } from '@/lib/performanceMonitoring'

async function exportPDF() {
  const startTime = performance.now()
  const { jsPDF } = await loadjsPDF()
  const loadTime = performance.now() - startTime
  
  performanceMonitoring.trackDynamicImportLoad('jsPDF', loadTime)
  // Now you can track jsPDF load times
}
```

---

## Analytics Integration

### Google Analytics

```javascript
// Already integrated in performanceMonitoring.js
// Metrics automatically sent if window.gtag exists

// Verify it's working:
window.gtag?.('event', 'perf_lcp', {
  value: 1850,
  rating: 'good'
})
```

### Sentry

```javascript
// Add to your Sentry setup
import * as Sentry from '@sentry/react'

const metrics = performanceMonitoring.getSummary()
Sentry.captureMessage('Performance Metrics', 'info', {
  extra: metrics
})
```

### Custom Endpoint

```javascript
// Modify sendMetricToAnalytics in performanceMonitoring.js
sendMetricToAnalytics(metricName, data) {
  fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metric: metricName,
      value: data.value,
      rating: data.rating,
      timestamp: new Date().toISOString()
    })
  }).catch(err => console.warn('Metrics send failed:', err))
}
```

---

## Development Tips

### View Metrics in Console

```javascript
// In your browser console
performanceMonitoring.getMetrics()
performanceMonitoring.getSummary()
performanceMonitoring.exportMetrics()
```

### Monitor Dynamic Imports

```javascript
// Check if library is cached
const XLSX = await loadXLSX()
// If this is fast (< 5ms), the module was already cached
```

### Debug Performance Issues

```javascript
// Long LCP? Check what's being rendered
// Long FID? Check for long JavaScript tasks
// High CLS? Check for images without dimensions

// Use Chrome DevTools:
// 1. Open DevTools (F12)
// 2. Go to Performance tab
// 3. Record a page load
// 4. Analyze the timeline
```

---

## Best Practices

### For PDF/Excel Features

1. **Preload on Route Mount**
   ```javascript
   useEffect(() => {
     preloadLibrary('jspdf')  // On Reports page mount
   }, [])
   ```

2. **Show Loading State**
   ```javascript
   const [loading, setLoading] = useState(false)
   
   async function handleExport() {
     setLoading(true)
     try {
       const { jsPDF } = await loadjsPDF()
       // Generate PDF
     } finally {
       setLoading(false)
     }
   }
   ```

3. **Handle Errors Gracefully**
   ```javascript
   async function exportPDF() {
     try {
       const { jsPDF } = await loadjsPDF()
       // ...
     } catch (error) {
       console.error('Failed to generate PDF:', error)
       toast.error('PDF generation failed. Please try again.')
     }
   }
   ```

### For Monitoring

1. **Track Important Routes**
   - Add metrics to key user flows
   - Focus on routes users visit most

2. **Monitor Regularly**
   - Set up daily metrics collection
   - Watch for regressions
   - Celebrate improvements

3. **Act on Data**
   - If LCP > 3s: Optimize images, lazy load
   - If FID > 200ms: Profile and optimize JS
   - If CLS > 0.1: Add image dimensions, prevent content shifts

---

## Common Issues & Solutions

### Issue: Library not loading
```javascript
// Error: Failed to load PDF library
// Solution: Check internet connection, browser supports dynamic imports
try {
  const { jsPDF } = await loadjsPDF()
} catch (error) {
  console.error('Fallback to static import or show error')
}
```

### Issue: Metrics not updating
```javascript
// Check if initialized:
performanceMonitoring.getMetrics()  // Should return object with data

// Reinitialize if needed:
performanceMonitoring.initialize()
```

### Issue: High LCP
```javascript
// LCP > 2.5s
// Check:
// 1. Image sizes and loading
// 2. JavaScript blocking rendering
// 3. Fonts loading delays
// 4. Network requests blocking rendering
```

---

## Monitoring Dashboard Example

```javascript
// Create a performance dashboard
export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState({})
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceMonitoring.getSummary())
    }, 5000)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div>
      <h3>Core Web Vitals</h3>
      <p>LCP: {metrics.coreWebVitals?.lcp?.value}ms ({metrics.coreWebVitals?.lcp?.rating})</p>
      <p>FID: {metrics.coreWebVitals?.fid?.value}ms ({metrics.coreWebVitals?.fid?.rating})</p>
      <p>CLS: {metrics.coreWebVitals?.cls?.value} ({metrics.coreWebVitals?.cls?.rating})</p>
      
      <h3>Route Performance</h3>
      {Object.entries(metrics.routeMetrics || {}).map(([route, stats]) => (
        <p key={route}>{route}: {stats.avg}ms avg</p>
      ))}
    </div>
  )
}
```

---

## API Reference

### performanceMonitoring

```javascript
// Initialize (automatic in main.jsx)
performanceMonitoring.initialize()

// Get all metrics
performanceMonitoring.getMetrics()

// Get summary
performanceMonitoring.getSummary()

// Export for analytics
performanceMonitoring.exportMetrics()

// Track custom metrics
performanceMonitoring.trackRouteMetric(routeName, duration)
performanceMonitoring.trackDynamicImportLoad(libraryName, loadTime)

// Reset metrics
performanceMonitoring.reset()
```

### dynamicImports

```javascript
import { 
  loadjsPDF, 
  loadXLSX, 
  loadXLSXPopulate,
  preloadLibrary,
  preloadLibraries,
  clearModuleCache
} from '@/services/operations'

// Load single library
const { jsPDF } = await loadjsPDF()

// Preload for better UX
await preloadLibrary('jspdf')
await preloadLibraries(['jspdf', 'xlsx'])

// Clear cache (for testing)
clearModuleCache('jspdf')
```

---

## Useful Resources

- [Core Web Vitals Guide](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Vite Bundle Analysis](https://vitejs.dev/)
- [Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance)

---

**Last Updated**: April 18, 2026  
**Questions**: See PHASE_4_OPTIMIZATION_REPORT.md for detailed documentation
