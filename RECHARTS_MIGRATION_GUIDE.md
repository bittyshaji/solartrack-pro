# Recharts Lazy Loading Migration Guide

## Quick Start

This guide provides step-by-step instructions for migrating existing Recharts components to use lazy loading.

### TL;DR (30 seconds)

1. Change direct imports to lazy loading:
   ```jsx
   // Before
   import { LineChart, Line, XAxis, YAxis, ... } from 'recharts'
   
   // After
   import { lazy } from 'react'
   import LazyChart from '@components/charts/LazyChart'
   import { createLazyChart } from '@components/charts/LazyChart'
   
   const ChartComponent = lazy(() => 
     createLazyChart({ chartType: 'LineChart' })
   )
   ```

2. Wrap component with LazyChart:
   ```jsx
   // Before
   return <LineChart data={data}>...</LineChart>
   
   // After
   return <LazyChart ChartComponent={ChartComponent} data={data} />
   ```

---

## Detailed Migration Steps

### Step 1: Identify Chart Components to Migrate

Check your component file for these imports:

```javascript
// Look for these patterns:
import { 
  BarChart, LineChart, PieChart, AreaChart, // Chart types
  ScatterChart, RadarChart, ComposedChart,
  Bar, Line, Area, Pie, Scatter, Radar, // Data rendering
  XAxis, YAxis, CartesianGrid, Tooltip, // Axes & interactions
  Legend, ResponsiveContainer, Cell, Reference
} from 'recharts'
```

**High Priority Components** (Used frequently):
- CustomerLifetimeValue.jsx
- RevenueChart.jsx
- CustomerSegmentationChart.jsx
- MonthlyTrendsChart.jsx

### Step 2: Update Component Imports

Replace direct Recharts imports with lazy loading utilities:

**File: src/components/analytics/YourChart.jsx**

```javascript
// BEFORE: Direct imports
import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// AFTER: Lazy loading imports
import React, { lazy } from 'react'
import LazyChart, { ChartLoadingFallback } from '@components/charts/LazyChart'
import { createLazyChart } from '@components/charts/LazyChart'
```

### Step 3: Create Lazy Chart Component

Add chart component definition after imports:

```javascript
// Create a lazy-loaded chart component
const LazyLineChart = lazy(() => 
  createLazyChart({ chartType: 'LineChart' })
)
```

**For different chart types, use these chartType values:**
- `'BarChart'` - Bar charts
- `'LineChart'` - Line charts
- `'PieChart'` - Pie/donut charts
- `'AreaChart'` - Area charts
- `'ScatterChart'` - Scatter plots
- `'RadarChart'` - Radar/spider charts
- `'ComposedChart'` - Multiple chart types

### Step 4: Update Component JSX

Replace direct chart rendering with LazyChart wrapper:

#### Option A: Using LazyChart Wrapper (Recommended)

```jsx
// BEFORE
export default function RevenueChart({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 h-80 flex items-center justify-center">
        <Loader className="w-5 h-5 animate-spin" />
        <span>Loading revenue data...</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#f97316" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// AFTER
const LazyLineChart = lazy(() => 
  createLazyChart({ chartType: 'LineChart' })
)

export default function RevenueChart({ data = [], loading = false }) {
  if (loading) {
    return <ChartLoadingFallback message="Loading revenue data..." />
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <p className="text-gray-600">No revenue data available</p>
      </div>
    )
  }

  return (
    <LazyChart
      ChartComponent={LazyLineChart}
      data={data}
      title="Revenue Trends"
      height={300}
      loadingMessage="Loading chart..."
    />
  )
}
```

#### Option B: Manual Control with Suspense

If you need more control over loading/error states:

```jsx
import { Suspense } from 'react'
import { ChartLoadingFallback, ChartErrorFallback } from '@components/charts/LazyChart'

const LazyLineChart = lazy(() => 
  createLazyChart({ chartType: 'LineChart' })
)

export default function RevenueChart({ data = [] }) {
  return (
    <Suspense fallback={<ChartLoadingFallback message="Loading chart..." />}>
      <ErrorBoundary
        fallback={<ChartErrorFallback />}
        onError={(error) => console.error('Chart error:', error)}
      >
        <div className="bg-white rounded-lg p-6" style={{ height: '300px' }}>
          <LazyLineChart data={data} />
        </div>
      </ErrorBoundary>
    </Suspense>
  )
}
```

### Step 5: Pass Chart Configuration Props

When using LazyChart, pass props specific to your chart:

```jsx
<LazyChart
  ChartComponent={LazyLineChart}
  data={chartData}
  title="Revenue Trends"           // Optional: chart title
  height={300}                     // Optional: chart height (default: 300)
  loadingMessage="Loading..."      // Optional: custom loading message
  onError={(error) => {            // Optional: error callback
    console.error('Chart failed:', error)
  }}
  // All other props passed to chart component
  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
/>
```

### Step 6: Handle Specific Chart Components

Some chart types may require additional configuration:

#### BarChart Example

```jsx
const LazyBarChart = lazy(() => 
  createLazyChart({ chartType: 'BarChart' })
)

export default function CustomerLifetimeValue({ data = [] }) {
  const chartData = data.slice(0, 10).map((customer, index) => ({
    name: customer.name || `Customer ${index + 1}`,
    value: customer.totalSpent || 0,
  }))

  return (
    <LazyChart
      ChartComponent={LazyBarChart}
      data={chartData}
      title="Top Customers (by Value)"
      height={300}
      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      layout="vertical"
    />
  )
}
```

#### PieChart Example

```jsx
const LazyPieChart = lazy(() => 
  createLazyChart({ chartType: 'PieChart' })
)

export default function SegmentationChart({ data = [] }) {
  return (
    <LazyChart
      ChartComponent={LazyPieChart}
      data={data}
      title="Customer Segments"
      height={300}
      cx="50%"
      cy="50%"
      outerRadius={100}
      dataKey="value"
    />
  )
}
```

---

## How to Use the LazyChart Component

### LazyChart Props

```typescript
interface LazyChartProps {
  // Required
  ChartComponent: React.ComponentType   // Lazy-loaded chart component
  data: any[]                            // Chart data

  // Optional
  title?: string                         // Chart title
  height?: number                        // Height in pixels (default: 300)
  loadingMessage?: string               // Loading message (default: 'Loading chart...')
  fallback?: React.ReactElement         // Custom loading fallback
  errorFallback?: React.ReactElement    // Custom error fallback
  onError?: (error: Error) => void      // Error callback
  showErrorBoundary?: boolean           // Show error UI (default: true)
  
  // Rest: All other props passed to chart component
  [key: string]: any
}
```

### LazyChart Examples

#### Simple Bar Chart
```jsx
const LazyBarChart = lazy(() => createLazyChart({ chartType: 'BarChart' }))

<LazyChart
  ChartComponent={LazyBarChart}
  data={salesData}
  title="Monthly Sales"
  dataKey="sales"
  fill="#f97316"
/>
```

#### Line Chart with Multiple Lines
```jsx
const LazyLineChart = lazy(() => createLazyChart({ chartType: 'LineChart' }))

<LazyChart
  ChartComponent={LazyLineChart}
  data={trendData}
  title="Trends Over Time"
  margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
/>
```

#### Pie Chart with Custom Colors
```jsx
const LazyPieChart = lazy(() => createLazyChart({ chartType: 'PieChart' }))

<LazyChart
  ChartComponent={LazyPieChart}
  data={segmentData}
  title="Market Share"
  cx="50%"
  cy="50%"
  dataKey="value"
/>
```

#### Composed Chart (Multiple Chart Types)
```jsx
const LazyComposedChart = lazy(() => 
  createLazyChart({ chartType: 'ComposedChart' })
)

<LazyChart
  ChartComponent={LazyComposedChart}
  data={complexData}
  title="Revenue vs Growth"
/>
```

---

## How to Use the loadRecharts() Function

For advanced use cases where you need direct control:

### Direct loadRecharts() Usage

```jsx
import { loadRecharts } from '@lib/services/operations/dynamicImports'

export default function CustomChart({ data }) {
  const [chartModule, setChartModule] = React.useState(null)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    loadRecharts({
      LineChart: true,
      Line: true,
      XAxis: true,
      YAxis: true,
      basic: true
    })
    .then(modules => setChartModule(modules))
    .catch(err => setError(err))
  }, [])

  if (error) return <div>Error loading chart</div>
  if (!chartModule) return <div>Loading...</div>

  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = chartModule

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid />
        <XAxis />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#f97316" />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### Preloading Charts

Optional: Preload common charts on app initialization:

```javascript
// In src/main.jsx or App.jsx
import { preloadCommonCharts } from '@lib/services/operations/dynamicImports'
import { useEffect } from 'react'

function App() {
  useEffect(() => {
    // Preload common charts for better performance
    preloadCommonCharts().catch(err => 
      console.warn('Chart preload failed (non-fatal):', err.message)
    )
  }, [])

  return (
    // Your app content
  )
}
```

---

## Testing & Verification

### 1. Verify Lazy Loading Works

**DevTools Network Tab:**
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "recharts"
4. Navigate to page with chart
5. Verify lazy chunk appears only when chart loads

**Expected:**
- No recharts bundle in main chunk
- Separate lazy chunk (~40-50KB) loaded on demand
- Chunk only loads once (cached on subsequent loads)

### 2. Test Loading States

**To see loading UI:**
1. Open DevTools Network tab
2. Set throttling to "Slow 3G"
3. Navigate to chart
4. Verify ChartLoadingFallback displays
5. Spinner should animate smoothly

### 3. Test Error Handling

**To simulate network error:**
1. Open DevTools Network tab
2. Go offline (check "Offline" checkbox)
3. Try to load chart
4. Verify ChartErrorFallback displays
5. Try "Retry" button functionality

### 4. Verify Performance Improvement

**Using Lighthouse:**
1. Run Lighthouse audit (DevTools > Lighthouse)
2. Note "First Contentful Paint" and "Largest Contentful Paint"
3. Compare before/after migration
4. Should see ~5-10% improvement in initial paint

**Using Web Vitals:**
```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
```

### 5. Check for Console Errors

- No console errors or warnings
- Charts render correctly
- Data displays accurately
- Interactions work smoothly

---

## Common Migration Issues & Solutions

### Issue: "Cannot find module 'recharts'"

**Cause:** Recharts not installed  
**Solution:** Verify recharts is in package.json and run `npm install`
```bash
npm list recharts
npm install recharts@^2.15.4
```

### Issue: Chart displays as blank/white

**Cause:** Data not passed or wrong data format  
**Solution:** 
- Verify data prop is passed to LazyChart
- Check data format matches expected shape
- Add height style to container div

### Issue: Loading spinner never stops

**Cause:** Module import failed silently  
**Solution:**
- Check browser console for errors
- Verify network requests in DevTools
- Check Recharts package is properly installed
- Try clearing cache: `clearModuleCache('recharts')`

### Issue: "LazyChart is not a valid React component"

**Cause:** Missing import or wrong import path  
**Solution:**
```javascript
// Correct import
import LazyChart from '@components/charts/LazyChart'
import { ChartLoadingFallback } from '@components/charts/LazyChart'
import { createLazyChart } from '@components/charts/LazyChart'
```

### Issue: Type errors with TypeScript

**Cause:** Missing JSDoc types  
**Solution:** LazyChart uses JSDoc comments. For TypeScript support:
```typescript
import type { ComponentType } from 'react'

interface ChartProps {
  ChartComponent: ComponentType<any>
  data: any[]
  [key: string]: any
}
```

---

## Reverting Changes (If Needed)

If you need to revert to direct imports:

```javascript
// 1. Change imports back
import { LineChart, Line, XAxis, YAxis, ... } from 'recharts'

// 2. Remove lazy chart wrapper
// Remove: const LazyLineChart = lazy(...)
// Remove: <LazyChart ChartComponent={...} />

// 3. Use direct component
return (
  <LineChart data={data}>
    {/* ... chart config ... */}
  </LineChart>
)

// 4. Clear cache if needed
import { clearModuleCache } from '@lib/services/operations/dynamicImports'
clearModuleCache('recharts')
```

---

## Implementation Checklist

- [ ] Identified all components using Recharts
- [ ] Reviewed LazyChart component documentation
- [ ] Created lazy-loaded chart components
- [ ] Updated imports in each file
- [ ] Tested loading states with throttling
- [ ] Tested error handling
- [ ] Verified data displays correctly
- [ ] Checked console for warnings/errors
- [ ] Ran Lighthouse audit
- [ ] Measured bundle size reduction
- [ ] Deployed to staging/production
- [ ] Monitored performance metrics
- [ ] Updated relevant documentation

---

## Performance Benchmarks

**Expected Results:**
- Initial bundle size reduction: **~148 KB**
- First Contentful Paint improvement: **5-10%**
- Largest Contentful Paint improvement: **3-7%**
- Time to Interactive improvement: **2-5%**
- First chart load: **100-300ms** (acceptable trade-off)

---

## Additional Resources

- [React.lazy Documentation](https://react.dev/reference/react/lazy)
- [React Suspense Documentation](https://react.dev/reference/react/Suspense)
- [Recharts API Reference](https://recharts.org/api)
- [Code Splitting Guide](https://webpack.js.org/guides/code-splitting/)
- [Web Performance Best Practices](https://web.dev/performance/)

## Support

For questions or issues:

1. Check the "Common Issues" section above
2. Review examples in existing components
3. Check browser console for specific error messages
4. Contact the development team

---

**Last Updated:** 2024-04-19  
**Difficulty Level:** Intermediate  
**Estimated Time:** 15-30 minutes per component  
**Rollback Difficulty:** Easy (revert to direct imports)
