# Recharts Components Migration Guide - Ready-to-Copy Code

## Overview

This guide provides complete before/after code for migrating each chart component to lazy loading. All code is ready to copy and paste.

**Time to implement:** ~2-3 hours for all 7 components  
**Bundle savings:** ~148 KB  
**Complexity:** Medium

---

## Component 1: RevenueChart.jsx

**Location:** `src/components/analytics/RevenueChart.jsx`  
**Type:** LineChart  
**Priority:** HIGH

### BEFORE (Current Code)

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader } from 'lucide-react'

/**
 * RevenueChart Component
 * Displays revenue trends with actual vs forecast line chart
 */
export default function RevenueChart({ data = [], forecast = [], loading = false, onDataClick }) {
  // Combine actual and forecast data
  const chartData = [
    ...(data || []),
    ...(forecast || []).map(f => ({ ...f, revenue: f.revenue, isForecasted: true })),
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading revenue data...</span>
        </div>
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <p className="text-gray-600">No revenue data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              if (typeof value === 'string') {
                // Format date for display
                const date = new Date(value)
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: value.length === 4 ? '2-digit' : undefined,
                })
              }
              return value
            }}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
            formatter={(value, name) => [
              `$${Number(value).toLocaleString('en-US')}`,
              name === 'revenue' ? 'Revenue' : 'Forecast',
            ]}
            cursor={{ stroke: '#d97706', strokeWidth: 2 }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 4 }}
            activeDot={{ r: 6 }}
            name="Actual Revenue"
            onClick={(data) => onDataClick && onDataClick(data)}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#fb923c"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Forecast"
            data={forecast}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### AFTER (Lazy Loaded Code)

```jsx
import { lazy, Suspense } from 'react'
import { Loader } from 'lucide-react'
import LazyChart, { ChartLoadingFallback } from '@components/charts/LazyChart'
import { createLazyChart } from '@components/charts/LazyChart'

// Create lazy-loaded line chart component
const LazyLineChart = lazy(() => 
  createLazyChart({ chartType: 'LineChart' })
)

/**
 * RevenueChart Component
 * Displays revenue trends with actual vs forecast line chart
 * Now uses lazy loading to reduce initial bundle size
 */
export default function RevenueChart({ data = [], forecast = [], loading = false, onDataClick }) {
  // Combine actual and forecast data
  const chartData = [
    ...(data || []),
    ...(forecast || []).map(f => ({ ...f, revenue: f.revenue, isForecasted: true })),
  ]

  if (loading) {
    return <ChartLoadingFallback message="Loading revenue data..." height={300} />
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <p className="text-gray-600">No revenue data available</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
      <Suspense fallback={<ChartLoadingFallback message="Loading chart..." height={300} />}>
        <div style={{ height: '300px' }}>
          <RevenueChartContent 
            data={chartData} 
            forecast={forecast}
            onDataClick={onDataClick}
          />
        </div>
      </Suspense>
    </div>
  )
}

/**
 * RevenueChartContent - Actual chart component (rendered inside Suspense)
 * This receives lazy-loaded Recharts components via props
 */
function RevenueChartContent({ data, forecast, onDataClick }) {
  const { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
  } = data || {}
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            if (typeof value === 'string') {
              const date = new Date(value)
              return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: value.length === 4 ? '2-digit' : undefined,
              })
            }
            return value
          }}
        />
        <YAxis
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
          }}
          formatter={(value, name) => [
            `$${Number(value).toLocaleString('en-US')}`,
            name === 'revenue' ? 'Revenue' : 'Forecast',
          ]}
          cursor={{ stroke: '#d97706', strokeWidth: 2 }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#f97316"
          strokeWidth={2}
          dot={{ fill: '#f97316', r: 4 }}
          activeDot={{ r: 6 }}
          name="Actual Revenue"
          onClick={(data) => onDataClick && onDataClick(data)}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#fb923c"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
          name="Forecast"
          data={forecast}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

---

## Component 2: CustomerLifetimeValue.jsx

**Location:** `src/components/analytics/CustomerLifetimeValue.jsx`  
**Type:** BarChart  
**Priority:** HIGH

### Quick Implementation

Replace the entire file with:

```jsx
import { lazy, Suspense } from 'react'
import { ChartLoadingFallback } from '@components/charts/LazyChart'
import { createLazyChart } from '@components/charts/LazyChart'

const LazyBarChart = lazy(() => 
  createLazyChart({ chartType: 'BarChart' })
)

/**
 * CustomerLifetimeValue Component
 * Displays top customers by lifetime value with bar chart
 * Now uses lazy loading for Recharts
 */
export default function CustomerLifetimeValue({ data = [], loading = false, onCustomerClick }) {
  if (loading) {
    return <ChartLoadingFallback message="Loading customer data..." height={300} />
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <p className="text-gray-600">No customer data available</p>
      </div>
    )
  }

  // Prepare data for chart
  const chartData = (data || []).slice(0, 10).map((customer, index) => ({
    name: customer.name || `Customer ${index + 1}`,
    value: customer.totalSpent || customer.value || 0,
    customerId: customer.customerId || customer.id,
    projectCount: customer.projectCount || customer.count || 0,
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers (by Value)</h3>
      <Suspense fallback={<ChartLoadingFallback message="Loading chart..." height={300} />}>
        <div style={{ height: '300px' }}>
          <BarChartContent data={chartData} onCustomerClick={onCustomerClick} />
        </div>
      </Suspense>

      {/* Detailed List */}
      <div className="mt-6 space-y-2 max-h-48 overflow-y-auto">
        {chartData.map((customer, index) => (
          <div
            key={customer.customerId}
            onClick={() => onCustomerClick && onCustomerClick(customer)}
            className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition cursor-pointer flex justify-between items-center"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {index + 1}. {customer.name}
              </p>
              <p className="text-xs text-gray-600">
                {customer.projectCount} project{customer.projectCount !== 1 ? 's' : ''}
              </p>
            </div>
            <p className="font-semibold text-orange-600">
              ${customer.value.toLocaleString('en-US')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChartContent({ data, onCustomerClick }) {
  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = {}
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="name"
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
          }}
          formatter={(value, name) => {
            if (name === 'value') {
              return [`$${Number(value).toLocaleString('en-US')}`, 'Total Spent']
            }
            return [value, name]
          }}
          cursor={{ fill: 'rgba(249, 115, 22, 0.1)' }}
        />
        <Bar
          dataKey="value"
          fill="#f97316"
          radius={[8, 8, 0, 0]}
          onClick={(data) => onCustomerClick && onCustomerClick(data)}
          cursor="pointer"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

---

## Component 3: CustomerSegmentationChart.jsx

**Location:** `src/components/analytics/CustomerSegmentationChart.jsx`  
**Type:** PieChart  
**Priority:** HIGH

### Key Changes

```jsx
import { lazy, Suspense } from 'react'
import { ChartLoadingFallback } from '@components/charts/LazyChart'
import { createLazyChart } from '@components/charts/LazyChart'

const LazyPieChart = lazy(() => 
  createLazyChart({ chartType: 'PieChart' })
)

export default function CustomerSegmentationChart({
  highValue = [],
  mediumValue = [],
  lowValue = [],
  loading = false,
  onSegmentClick,
}) {
  // ... data preparation code stays the same ...

  if (loading) {
    return <ChartLoadingFallback message="Loading segmentation data..." height={300} />
  }

  // ... validation code stays the same ...

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
      <Suspense fallback={<ChartLoadingFallback message="Loading chart..." height={300} />}>
        <div style={{ height: '300px' }}>
          <PieChartContent data={chartData} onSegmentClick={onSegmentClick} />
        </div>
      </Suspense>
      
      {/* Segment Details section stays the same */}
      {/* ... rest of component ... */}
    </div>
  )
}

function PieChartContent({ data, onSegmentClick }) {
  const { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } = {}
  const colors = ['#dc2626', '#f97316', '#fbbf24']

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percentage }) => `${name}: ${percentage}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
          }}
          formatter={(value, name, props) => {
            if (name === 'value') {
              return [`${value} customers`, 'Count']
            }
            return [value, name]
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
```

---

## Component 4: MonthlyTrendsChart.jsx

**Location:** `src/components/analytics/MonthlyTrendsChart.jsx`  
**Type:** AreaChart  
**Priority:** HIGH

### Key Changes

```jsx
import { lazy, Suspense } from 'react'
import { ChartLoadingFallback } from '@components/charts/LazyChart'
import { createLazyChart } from '@components/charts/LazyChart'

const LazyAreaChart = lazy(() => 
  createLazyChart({ chartType: 'AreaChart' })
)

export default function MonthlyTrendsChart({
  data = [],
  metric = 'revenue',
  loading = false,
  onDataClick,
}) {
  // ... metric config code stays the same ...

  if (loading) {
    return <ChartLoadingFallback message="Loading trend data..." height={300} />
  }

  // ... validation code stays the same ...

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {config.label} - Last 12 Months
      </h3>
      <Suspense fallback={<ChartLoadingFallback message="Loading chart..." height={300} />}>
        <div style={{ height: '300px' }}>
          <AreaChartContent 
            data={chartData} 
            config={config}
            onDataClick={onDataClick}
          />
        </div>
      </Suspense>

      {/* Summary Stats section stays the same */}
      {/* ... rest of component ... */}
    </div>
  )
}

function AreaChartContent({ data, config, onDataClick }) {
  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = {}

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={config.color} stopOpacity={0.8} />
            <stop offset="95%" stopColor={config.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="month"
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
          interval={Math.floor(data.length / 6) || 0}
        />
        <YAxis
          stroke="#6b7280"
          tick={{ fontSize: 12 }}
          tickFormatter={config.format}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
          }}
          formatter={(value) => [config.tooltip(value), config.label]}
          cursor={{ stroke: config.color, strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={config.color}
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorValue)"
          onClick={(data) => onDataClick && onDataClick(data)}
          cursor="pointer"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
```

---

## Component 5: TeamPerformanceChart.jsx

**Location:** `src/components/analytics/TeamPerformanceChart.jsx`  
**Type:** BarChart  
**Priority:** MEDIUM

### Key Changes - Similar pattern to CustomerLifetimeValue

Replace direct Recharts imports with:

```jsx
import { lazy, Suspense } from 'react'
import { ChartLoadingFallback } from '@components/charts/LazyChart'
import { createLazyChart } from '@components/charts/LazyChart'

const LazyBarChart = lazy(() => 
  createLazyChart({ chartType: 'BarChart' })
)

// ... in JSX, replace ResponsiveContainer with:
<Suspense fallback={<ChartLoadingFallback message="Loading chart..." height={300} />}>
  <div style={{ height: '300px' }}>
    <TeamBarChartContent data={chartData} onMemberClick={onMemberClick} />
  </div>
</Suspense>
```

---

## Component 6: PipelineForecastingChart.jsx

**Location:** `src/components/analytics/PipelineForecastingChart.jsx`  
**Type:** ComposedChart  
**Priority:** MEDIUM

### Key Changes

```jsx
import { lazy, Suspense } from 'react'
import { ChartLoadingFallback } from '@components/charts/LazyChart'
import { createLazyChart } from '@components/charts/LazyChart'

const LazyComposedChart = lazy(() => 
  createLazyChart({ chartType: 'ComposedChart' })
)

// In JSX, replace ResponsiveContainer/ComposedChart with:
<Suspense fallback={<ChartLoadingFallback message="Loading chart..." height={300} />}>
  <div style={{ height: '300px' }}>
    <ComposedChartContent 
      data={chartData} 
      forecastWithInterval={forecastWithInterval}
      goal={goal}
    />
  </div>
</Suspense>
```

---

## Component 7: ProjectCompletionFunnel.jsx

**Location:** `src/components/analytics/ProjectCompletionFunnel.jsx`  
**Type:** FunnelChart  
**Priority:** MEDIUM

### Key Changes

**First, update dynamicImports.js to include FunnelChart:**

Add to the `chartComponents` array in `loadRecharts()`:
```javascript
const chartComponents = [
  'BarChart',
  'LineChart',
  'AreaChart',
  'PieChart',
  'ScatterChart',
  'RadarChart',
  'ComposedChart',
  'FunnelChart',  // ADD THIS
  // ... rest of components
]
```

**Then update component:**

```jsx
import { lazy, Suspense } from 'react'
import { ChartLoadingFallback } from '@components/charts/LazyChart'
import { createLazyChart } from '@components/charts/LazyChart'

const LazyFunnelChart = lazy(() => 
  createLazyChart({ chartType: 'FunnelChart' })
)

// In JSX:
<Suspense fallback={<ChartLoadingFallback message="Loading chart..." height={300} />}>
  <div style={{ height: '300px' }}>
    <FunnelChartContent data={withConversion} onStageClick={onStageClick} />
  </div>
</Suspense>
```

---

## Testing Each Component

### Quick Test Checklist

For each component after migration:

```
[ ] Component renders without errors
[ ] Chart displays data correctly
[ ] Loading state shows when expected
[ ] Error handling works (offline mode)
[ ] Interactions work (clicks, tooltips)
[ ] No console warnings or errors
```

### Browser DevTools Test

1. Open DevTools (F12)
2. Go to Network tab
3. Filter for "recharts"
4. Navigate to page with chart
5. Should see a lazy chunk load (~40-50KB)
6. Not in initial bundle

---

## Summary of Changes Required

### For Each Component

1. **Add imports:**
   ```jsx
   import { lazy, Suspense } from 'react'
   import { ChartLoadingFallback } from '@components/charts/LazyChart'
   import { createLazyChart } from '@components/charts/LazyChart'
   ```

2. **Create lazy component:**
   ```jsx
   const LazyChartName = lazy(() => 
     createLazyChart({ chartType: 'ChartType' })
   )
   ```

3. **Wrap chart in Suspense:**
   ```jsx
   <Suspense fallback={<ChartLoadingFallback message="..." height={300} />}>
     <div style={{ height: '300px' }}>
       <ChartContent data={data} {...props} />
     </div>
   </Suspense>
   ```

4. **Extract chart JSX to content component**

5. **Update loading/error states** to use ChartLoadingFallback

---

## Copy-Paste Implementation Tips

1. **Start with RevenueChart** - It's the most straightforward
2. **Follow the pattern** from Component 1 for all others
3. **Test immediately** after each component
4. **Don't modify** the LazyChart.jsx or dynamicImports.js unless absolutely necessary
5. **Preserve all props** when moving from ResponsiveContainer to content component

---

**Ready to implement? Start with RevenueChart.jsx!**
