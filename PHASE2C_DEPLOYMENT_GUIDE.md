# Phase 2C Advanced Analytics Dashboard - Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Phase 2C Advanced Analytics Dashboard into the SolarTrack Pro application. The dashboard provides comprehensive analytics, KPI tracking, and advanced reporting capabilities for admin and manager roles.

---

## Part 1: File Deployment Checklist

### Critical Files to Deploy
Before starting integration, ensure all files are copied to their correct locations:

- [ ] **analyticsService.js** → `src/lib/`
  - Core analytics service with all metric calculations
  - Functions: getRevenueMetrics, getPipelineMetrics, getCustomerAnalytics, etc.
  - No modifications needed unless customizing calculations

- [ ] **AdvancedAnalyticsDashboard.jsx** → `src/pages/`
  - Main dashboard component
  - Layout with all analytics cards and charts
  - State management for date selection and filters

### Component Files (Analytics Components)
Deploy all chart and card components to `src/components/analytics/`:

- [ ] **DateRangeSelector.jsx**
  - Date preset buttons (This Month, Last 30 Days, Year to Date, Custom)
  - Custom date range picker
  - Handles date validation

- [ ] **AdvancedMetricsCard.jsx**
  - Reusable KPI card component
  - Displays metric value, label, and % change
  - Shows trend indicator (up/down arrow)

- [ ] **RevenueChart.jsx**
  - Line chart showing monthly revenue trends
  - Includes 3-month forecast projection
  - Interactive hover details

- [ ] **ProjectCompletionFunnel.jsx**
  - Stage-based funnel chart
  - Shows EST → NEG → EXE → Paid progression
  - Displays count and value per stage
  - Conversion percentages between stages

- [ ] **CustomerLifetimeValue.jsx**
  - Bar chart ranking top 10 customers by spending
  - Shows lifetime value and transaction count
  - Drill-down capability to customer details

- [ ] **CustomerSegmentationChart.jsx**
  - Pie chart showing customer distribution
  - Segments: High Value, Medium Value, Low Value, At Risk
  - Click to filter and view segment details

- [ ] **MonthlyTrendsChart.jsx**
  - Multi-series line chart with 12-month history
  - Tracks: Revenue, Projects Completed, Conversion Rate
  - Shows seasonal patterns and trends

- [ ] **TeamPerformanceChart.jsx**
  - Bar chart comparing team members' metrics
  - Metrics: Projects Completed, Revenue Generated, Win Rate
  - Sortable and filterable by metric

- [ ] **PipelineForecastingChart.jsx**
  - Combination chart showing actual vs forecast
  - 6-month forward projection
  - Confidence interval shading

---

## Part 2: Code Integration Steps

### Step 2a: Add Analytics Route

**File: `src/App.jsx`**

1. Import the dashboard component at the top of the file:
```javascript
import AdvancedAnalyticsDashboard from './pages/AdvancedAnalyticsDashboard';
```

2. Add the route inside your Routes component (typically inside a `<Routes>` wrapper):
```javascript
<Route 
  path="/analytics" 
  element={
    <ProtectedRoute requiredRole="admin">
      <AdvancedAnalyticsDashboard />
    </ProtectedRoute>
  } 
/>
```

3. **Important**: This route requires admin role. Managers can view if you modify the protection:
```javascript
<Route 
  path="/analytics" 
  element={
    <ProtectedRoute requiredRole={["admin", "manager"]}>
      <AdvancedAnalyticsDashboard />
    </ProtectedRoute>
  } 
/>
```

4. Verify ProtectedRoute component enforces role-based access control

### Step 2b: Add Navigation Link

**File: Navigation Component** (typically `src/components/Navigation.jsx` or `src/layouts/Sidebar.jsx`)

1. Import the BarChart3 icon:
```javascript
import { BarChart3 } from 'lucide-react';
```

2. Add navigation item (example for sidebar/menu structure):
```javascript
{
  label: 'Analytics',
  path: '/analytics',
  icon: <BarChart3 size={20} />,
  requiredRoles: ['admin', 'manager']  // Optional: add role restriction
}
```

3. For top navigation, add similarly:
```javascript
<NavItem
  to="/analytics"
  icon={<BarChart3 size={20} />}
  label="Analytics"
  requiredRole="admin"
/>
```

4. Add styling for the navigation link to match existing menu items

### Step 2c: Configure Analytics Context

**File: `src/contexts/AnalyticsContext.jsx`** (Create new file)

```javascript
import React, { createContext, useState, useCallback, useEffect } from 'react';

const AnalyticsContext = createContext();

export const AnalyticsProvider = ({ children }) => {
  const [cachedMetrics, setCachedMetrics] = useState({});
  const [cacheTimestamp, setCacheTimestamp] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const CACHE_TTL = parseInt(import.meta.env.VITE_ANALYTICS_CACHE_TTL || '3600'); // 1 hour default

  // Check if cache is still valid
  const isCacheValid = useCallback(() => {
    if (!cacheTimestamp) return false;
    const age = (Date.now() - cacheTimestamp) / 1000;
    return age < CACHE_TTL;
  }, [cacheTimestamp, CACHE_TTL]);

  // Get cached metrics or fetch new ones
  const getMetrics = useCallback(async (fetchFunction, dependencies) => {
    const cacheKey = JSON.stringify(dependencies);
    
    if (cachedMetrics[cacheKey] && isCacheValid()) {
      return cachedMetrics[cacheKey];
    }

    setIsLoading(true);
    try {
      const data = await fetchFunction();
      setCachedMetrics(prev => ({
        ...prev,
        [cacheKey]: data
      }));
      setCacheTimestamp(Date.now());
      return data;
    } finally {
      setIsLoading(false);
    }
  }, [cachedMetrics, isCacheValid]);

  // Invalidate specific cache entries
  const invalidateCache = useCallback((pattern) => {
    if (pattern) {
      setCachedMetrics(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (key.includes(pattern)) delete updated[key];
        });
        return updated;
      });
    } else {
      setCachedMetrics({});
    }
    setCacheTimestamp(null);
  }, []);

  const value = {
    cachedMetrics,
    isLoading,
    getMetrics,
    invalidateCache,
    isCacheValid
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = React.useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
};
```

5. Wrap your app or dashboard with the provider:
```javascript
// In App.jsx
<AnalyticsProvider>
  {/* Your routes */}
</AnalyticsProvider>
```

### Step 2d: Import analyticsService

**File: `src/pages/AdvancedAnalyticsDashboard.jsx`**

The dashboard should already have these imports at the top:

```javascript
import { 
  getRevenueMetrics,
  getPipelineMetrics,
  getCustomerAnalytics,
  getTeamPerformance,
  getMonthlyTrends,
  getPipelineForecast,
  exportDashboardToCSV
} from '../lib/analyticsService';
```

No additional setup needed - the service functions are ready to use.

---

## Part 3: Environment Configuration (Optional)

Create or update your `.env` file with these analytics configuration variables:

```env
# Phase 2C - Advanced Analytics Configuration
VITE_ANALYTICS_CACHE_TTL=3600
VITE_ANALYTICS_REFRESH_INTERVAL=300000
VITE_ANALYTICS_DATE_PRESETS=true
VITE_ANALYTICS_ENABLE_EXPORT=true
VITE_ANALYTICS_MAX_CHART_DATA_POINTS=12
```

**Configuration Details:**

- **VITE_ANALYTICS_CACHE_TTL** (seconds)
  - Default: 3600 (1 hour)
  - How long metrics are cached before refresh
  - Lower values = more frequent updates, higher server load
  - Recommended: 1800-3600

- **VITE_ANALYTICS_REFRESH_INTERVAL** (milliseconds)
  - Default: 300000 (5 minutes)
  - How often to check for cache expiration
  - Recommended: 300000-600000

- **VITE_ANALYTICS_DATE_PRESETS** (boolean)
  - Enable/disable date preset buttons
  - Default: true

- **VITE_ANALYTICS_ENABLE_EXPORT** (boolean)
  - Enable CSV export functionality
  - Default: true

- **VITE_ANALYTICS_MAX_CHART_DATA_POINTS** (number)
  - Maximum data points to show in charts
  - Default: 12 (12 months)
  - Increase for more granular data, decrease for better performance

---

## Part 4: Database Performance Optimization

### Step 4a: Create Required Indexes

Execute these SQL commands on your database to optimize analytics queries. Run these in your database migration tool or PostgreSQL client:

```sql
-- Speed up revenue analytics queries
CREATE INDEX IF NOT EXISTS idx_project_invoices_payment_status 
  ON project_invoices(payment_status);

-- Speed up project stage queries
CREATE INDEX IF NOT EXISTS idx_projects_state 
  ON projects(state);

-- Speed up date range queries
CREATE INDEX IF NOT EXISTS idx_projects_created_at 
  ON projects(created_at DESC);

-- Speed up task completion analytics
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at 
  ON tasks(completed_at);

-- Composite index for common filtering combinations
CREATE INDEX IF NOT EXISTS idx_project_invoices_status_date 
  ON project_invoices(payment_status, created_at DESC);

-- Index for customer analytics
CREATE INDEX IF NOT EXISTS idx_project_invoices_customer 
  ON project_invoices(project_id, total_amount);

-- Index for trend analysis
CREATE INDEX IF NOT EXISTS idx_projects_state_date 
  ON projects(state, created_at DESC);
```

**Verification**: After creating indexes, verify they're being used:
```sql
-- List all indexes on analytics-heavy tables
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('projects', 'project_invoices', 'tasks')
ORDER BY tablename;
```

### Step 4b: Create Materialized View (Optional - For Scale)

For applications with large datasets (100K+ invoices), create this materialized view to significantly improve dashboard performance:

```sql
-- Create materialized view for analytics summary
CREATE MATERIALIZED VIEW analytics_summary AS
SELECT 
  DATE_TRUNC('month', project_invoices.created_at)::DATE as month,
  COUNT(DISTINCT projects.id) as total_projects,
  COUNT(DISTINCT project_invoices.id) as total_invoices,
  SUM(CASE WHEN project_invoices.payment_status = 'Paid' 
      THEN project_invoices.total_amount ELSE 0 END) as paid_revenue,
  SUM(CASE WHEN project_invoices.payment_status = 'Pending' 
      THEN project_invoices.total_amount ELSE 0 END) as pending_revenue,
  SUM(project_invoices.total_amount) as total_revenue,
  COUNT(DISTINCT CASE WHEN projects.state = 'Completed' THEN projects.id END) as completed_projects,
  COUNT(DISTINCT CASE WHEN projects.state = 'Estimated' THEN projects.id END) as estimated_projects,
  COUNT(DISTINCT CASE WHEN projects.state = 'Negotiation' THEN projects.id END) as negotiation_projects,
  COUNT(DISTINCT CASE WHEN projects.state = 'Executing' THEN projects.id END) as executing_projects
FROM projects
LEFT JOIN project_invoices ON projects.id = project_invoices.project_id
GROUP BY DATE_TRUNC('month', project_invoices.created_at)
ORDER BY month DESC;

-- Create index on materialized view
CREATE INDEX idx_analytics_summary_month ON analytics_summary(month DESC);

-- Refresh materialized view (run nightly via cron job or scheduled task)
REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_summary;
```

**Maintenance**: Set up a nightly refresh job:
```sql
-- PostgreSQL: Use pg_cron extension (if installed)
SELECT cron.schedule('refresh_analytics_summary', '0 2 * * *', 
  'REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_summary');
```

---

## Part 5: Testing Checklist

Before deploying to production, verify all functionality:

### Accessibility & Permission Tests
- [ ] Navigate to `/analytics` and verify page loads
- [ ] Non-admin users cannot access `/analytics` (404 or redirect)
- [ ] Admin users can access `/analytics`
- [ ] Manager users can access `/analytics` (if configured)
- [ ] Dashboard displays without console errors

### Dashboard Load & Rendering Tests
- [ ] All 5 KPI cards display values (Revenue, Conversion Rate, Avg Project Value, Active Projects, Customer Lifetime Value)
- [ ] All 7 charts render without errors:
  - [ ] Revenue Chart (line chart with forecast)
  - [ ] Project Completion Funnel (funnel with stages)
  - [ ] Customer Lifetime Value (bar chart)
  - [ ] Customer Segmentation Pie Chart
  - [ ] Monthly Trends (multi-line chart)
  - [ ] Team Performance Chart
  - [ ] Pipeline Forecasting Chart
- [ ] Loading spinner appears during data fetch
- [ ] No data message appears if database is empty

### Date Range Functionality Tests
- [ ] "This Month" preset loads current month data
- [ ] "Last 30 Days" preset loads last 30 days
- [ ] "Year to Date" preset loads Jan 1 to today
- [ ] "Last Year" preset loads previous 12 months
- [ ] Custom date range picker opens on "Custom Range" click
- [ ] Custom dates validate correctly (end date >= start date)
- [ ] Metrics update immediately after date selection
- [ ] Date selection persists in URL (if implemented)

### KPI Card Tests
- [ ] Revenue KPI shows formatted currency ($ symbol, thousand separators)
- [ ] Conversion Rate shows percentage (% symbol)
- [ ] Avg Project Value shows currency
- [ ] Active Projects shows count
- [ ] Customer Lifetime Value shows currency
- [ ] % change displays with correct color (green up, red down)
- [ ] Trend arrows display correctly (↑ for positive, ↓ for negative)
- [ ] KPI values update when date range changes

### Revenue Analytics Tests
- [ ] Revenue chart shows 12 months of data (or selected range)
- [ ] Forecast line extends 3 months into future
- [ ] Forecast line is visually distinct (dashed line, different color)
- [ ] Hover tooltip shows exact values
- [ ] Y-axis shows currency formatting
- [ ] X-axis shows month labels
- [ ] Chart responsive on mobile (no horizontal scroll)

### Pipeline Funnel Tests
- [ ] Funnel shows 4 stages: EST → NEG → EXE → Paid
- [ ] Each stage displays count of projects
- [ ] Each stage displays total value of projects
- [ ] Conversion % shows correct calculation: (Next Stage Count / Current Stage Count) * 100
- [ ] Clicking stage filters project list (if drill-down implemented)
- [ ] Stage sizing proportional to project count
- [ ] Colors distinguish between stages

### Customer Analytics Tests
- [ ] Customer LTV chart shows top 10 customers
- [ ] Customers ranked by total spend (descending)
- [ ] Bar height proportional to customer value
- [ ] Hover shows customer name and total spend
- [ ] X-axis labels don't overlap on desktop
- [ ] Segmentation pie chart shows 4 segments: High, Medium, Low, At Risk
- [ ] Pie chart colors are distinct and accessible
- [ ] Segment labels show count and percentage
- [ ] Clicking pie segment filters to show that segment's customers (if drill-down)

### Trends Analysis Tests
- [ ] Monthly Trends chart shows 3 series: Revenue, Projects, Conversion Rate
- [ ] 12-month historical data displays
- [ ] Legend shows and toggles series on/off
- [ ] Different colors for each series
- [ ] Y-axis formatting appropriate for each metric
- [ ] Seasonal patterns visible in data

### Team Performance Tests
- [ ] Team Performance chart shows all team members
- [ ] Default metric: Projects Completed
- [ ] Dropdown allows switching metrics: Revenue, Win Rate, Avg Project Value
- [ ] Sort ascending/descending works
- [ ] Bar colors consistent
- [ ] No horizontal scroll on mobile

### Forecast Tests
- [ ] Pipeline Forecast shows actual vs projected
- [ ] 6-month forward projection visible
- [ ] Confidence interval shading shows margin of error
- [ ] Actual data is solid line, forecast is dashed
- [ ] Legend explains actual vs forecast

### Export Functionality Tests
- [ ] "Export to CSV" button visible and clickable
- [ ] CSV file downloads to local machine
- [ ] File naming: `analytics_export_YYYY-MM-DD.csv`
- [ ] CSV contains all metrics and charts data
- [ ] CSV headers: Date, Metric, Value, Unit
- [ ] CSV properly formatted (comma-separated, proper escaping)
- [ ] CSV opens correctly in Excel/Google Sheets

### Performance Tests
- [ ] Initial dashboard load: < 2 seconds
- [ ] Date range change: < 500ms
- [ ] Chart animation smooth (60 FPS)
- [ ] No memory leaks (check DevTools Memory tab)
- [ ] Scrolling smooth without jank
- [ ] Mobile load time: < 3 seconds

### Mobile Responsiveness Tests
- [ ] Test on iPhone 12 (390px width)
- [ ] Test on iPad (768px width)
- [ ] Test on Android phone (360px width)
- [ ] Dashboard stacks single column on mobile
- [ ] KPI cards full width on mobile
- [ ] Charts responsive (no horizontal scroll)
- [ ] Date selector usable on touch
- [ ] Menu accessible on mobile
- [ ] Text readable (no tiny fonts)

### Chart Interactivity Tests
- [ ] Hover on chart shows tooltip
- [ ] Hover tooltip displays all relevant data
- [ ] Legend items clickable to toggle series
- [ ] Legend visually updates when series toggled
- [ ] No errors on chart interactions
- [ ] Zoom/pan works (if implemented)
- [ ] Click drill-down works (if implemented)

### Error Handling Tests
- [ ] No data: "No data available" message displays
- [ ] Database error: Friendly error message shown
- [ ] Network error: Retry button appears
- [ ] Invalid date range: Error message shown
- [ ] Permission denied: Redirect to login/dashboard
- [ ] Console has no JavaScript errors

### Data Accuracy Tests
- [ ] Spot-check: Verify 3 metrics against raw database
- [ ] Revenue total matches sum of paid invoices
- [ ] Project counts match database project_state values
- [ ] Conversion rate calculation correct
- [ ] Customer LTV calculation correct
- [ ] Forecast projections reasonable

### Browser Compatibility Tests
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Part 6: Performance Tuning Guide

### 6a: Analytics Cache Strategy

Implement a tiered caching approach for optimal performance:

**Cache Configuration:**

```javascript
// In analyticsService.js or separate config file
const CACHE_CONFIG = {
  // Daily metrics cache (refresh daily at 2 AM)
  daily: {
    ttl: 86400, // 24 hours
    refreshTime: '02:00', // 2 AM
    keys: ['dailyRevenue', 'dailyProjects', 'dailyConversion']
  },
  
  // Monthly metrics cache (refresh weekly)
  monthly: {
    ttl: 604800, // 7 days
    refreshTime: '03:00', // 3 AM
    keys: ['monthlyRevenue', 'monthlyFunnel', 'monthlyTrends']
  },
  
  // Yearly metrics cache (refresh monthly)
  yearly: {
    ttl: 2592000, // 30 days
    refreshTime: '04:00', // 4 AM
    keys: ['yearlyRevenue', 'yearlyGrowth']
  }
};
```

**Cache Invalidation Strategy:**

1. **Automatic Invalidation**: Cache expires after TTL
2. **Event-Based Invalidation**: Clear cache when data changes
   - New invoice created → invalidate revenue cache
   - Project state changed → invalidate pipeline cache
   - Customer updated → invalidate customer analytics cache

3. **Manual Invalidation**: Admin button to force refresh

```javascript
// Example: Invalidate cache on invoice creation
const handleInvoiceCreated = (invoice) => {
  analyticsContext.invalidateCache('revenue');
  analyticsContext.invalidateCache('customer');
};
```

### 6b: Query Optimization

**1. Use EXPLAIN ANALYZE to review query performance:**

```sql
-- Check if your query uses the indexes
EXPLAIN ANALYZE
SELECT DATE_TRUNC('month', created_at)::DATE as month,
       SUM(total_amount) as revenue
FROM project_invoices
WHERE payment_status = 'Paid'
  AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

Look for "Seq Scan" (bad) vs "Index Scan" (good) in the output. If you see Seq Scan, the index isn't being used.

**2. Add indexes for slow queries:**

```sql
-- Monitor slow queries (PostgreSQL)
-- Edit postgresql.conf and set:
-- log_min_duration_statement = 500  -- Log queries > 500ms

-- Check slow query log
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 500
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**3. Query Optimization Checklist:**

- [ ] All WHERE clauses use indexed columns
- [ ] Join columns are indexed
- [ ] GROUP BY columns are indexed
- [ ] ORDER BY uses indexed columns when possible
- [ ] Subqueries are optimized (consider JOINs instead)
- [ ] LIMIT is used to restrict result set
- [ ] Avoid SELECT * (select only needed columns)
- [ ] Use LIMIT 1 when checking existence

**Example optimized query:**

```sql
-- SLOW (full table scan)
SELECT * FROM project_invoices WHERE payment_status = 'Paid';

-- FAST (uses index)
SELECT id, project_id, total_amount, created_at 
FROM project_invoices 
WHERE payment_status = 'Paid'
  AND created_at >= NOW() - INTERVAL '12 months'
LIMIT 10000;
```

### 6c: Frontend Optimization

**1. Lazy Load Charts:**

```javascript
// Use React.lazy for chart components
const RevenueChartLazy = React.lazy(() => import('./charts/RevenueChart'));

// In dashboard:
<Suspense fallback={<ChartSkeleton />}>
  <RevenueChartLazy data={revenueData} />
</Suspense>
```

**2. Memoize Chart Components:**

```javascript
const RevenueChart = React.memo(({ data, dateRange }) => {
  return <LineChart data={data} />;
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if data or date range actually changed
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
});
```

**3. Virtualize Large Lists:**

```javascript
// For Customer LTV chart with 1000+ customers
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={customers.length}
  itemSize={50}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {customers[index].name} - ${customers[index].ltv}
    </div>
  )}
</FixedSizeList>
```

**4. Pagination for Large Datasets:**

```javascript
// Instead of loading all 10,000 customers
const [page, setPage] = useState(1);
const pageSize = 20;
const customers = allCustomers.slice(
  (page - 1) * pageSize, 
  page * pageSize
);

// Add pagination controls
<Pagination 
  currentPage={page} 
  totalPages={Math.ceil(allCustomers.length / pageSize)}
  onPageChange={setPage}
/>
```

**5. Debounce Date Range Changes:**

```javascript
import { debounce } from 'lodash';

const debouncedUpdateMetrics = debounce((startDate, endDate) => {
  fetchMetrics(startDate, endDate);
}, 500); // Wait 500ms after user stops typing/selecting

const handleDateChange = (newDateRange) => {
  debouncedUpdateMetrics(newDateRange.start, newDateRange.end);
};
```

**6. Performance Monitoring:**

```javascript
// Log page load time
window.addEventListener('load', () => {
  const perfData = performance.timing;
  const loadTime = perfData.loadEventEnd - perfData.navigationStart;
  console.log('Dashboard load time:', loadTime, 'ms');
  
  // Send to analytics
  logMetric('dashboard_load_time', loadTime);
});

// Monitor chart render time
console.time('ChartRender');
// ... render chart ...
console.timeEnd('ChartRender');
```

### 6d: Production Performance Targets

| Metric | Target | Warning |
|--------|--------|---------|
| Initial Load Time | < 2s | > 3s |
| Date Range Change | < 500ms | > 1s |
| Chart Interaction | < 100ms | > 200ms |
| Database Query | < 500ms | > 1s |
| API Response | < 1s | > 2s |
| Memory Usage | < 100MB | > 200MB |

---

## Part 7: Customization Options

### 7a: Metric Calculations

**Customize Revenue Calculation:**

In `analyticsService.js`, locate `getRevenueMetrics()` and adjust:

```javascript
// Current: Only counts Paid invoices
const paidRevenue = invoices
  .filter(inv => inv.payment_status === 'Paid')
  .reduce((sum, inv) => sum + inv.total_amount, 0);

// To include Pending: Add this line
const paidRevenue = invoices
  .filter(inv => ['Paid', 'Pending'].includes(inv.payment_status))
  .reduce((sum, inv) => sum + inv.total_amount, 0);

// To subtract tax:
const taxRate = 0.1; // 10%
const netRevenue = paidRevenue * (1 - taxRate);

// To apply discount:
const grossRevenue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
const discountAmount = invoices.reduce((sum, inv) => sum + (inv.discount || 0), 0);
const netRevenue = grossRevenue - discountAmount;
```

**Customize Conversion Rate:**

```javascript
// Current: NEG / EST
const conversionRate = (negProjects / estProjects) * 100;

// To track through full pipeline: Paid / EST
const conversionRate = (paidProjects / estProjects) * 100;

// To weight by value instead of count:
const estValue = estProjects.reduce((sum, p) => sum + p.estimated_value, 0);
const paidValue = paidProjects.reduce((sum, p) => sum + p.total_revenue, 0);
const conversionRate = (paidValue / estValue) * 100;
```

**Customize Customer Segments:**

```javascript
// Current thresholds in getCustomerAnalytics()
const segments = {
  'High Value': customers.filter(c => c.lifetime_value > 50000),
  'Medium Value': customers.filter(c => c.lifetime_value > 10000 && c.lifetime_value <= 50000),
  'Low Value': customers.filter(c => c.lifetime_value > 1000 && c.lifetime_value <= 10000),
  'At Risk': customers.filter(c => c.lifetime_value <= 1000 || c.last_purchase < 180days)
};

// To customize thresholds:
const segments = {
  'VIP': customers.filter(c => c.lifetime_value > 100000),
  'Premium': customers.filter(c => c.lifetime_value > 25000),
  'Standard': customers.filter(c => c.lifetime_value > 5000),
  'Inactive': customers.filter(c => c.last_purchase > 365 days)
};
```

**Customize Forecast Algorithm:**

```javascript
// Current: Simple linear regression
// To use exponential smoothing (better for trending data):
const alpha = 0.3; // Smoothing factor (0-1)
let forecast = lastValue;
const forecasts = [];

for (let i = 0; i < 6; i++) {
  forecast = alpha * lastValue + (1 - alpha) * forecast;
  forecasts.push(forecast);
}

// To add seasonal adjustment:
const seasonalFactor = monthlyAverage / yearlyAverage;
const seasonalForecast = forecast * seasonalFactor;
```

### 7b: Chart Customization

**Change Chart Colors:**

```javascript
// In each chart component, update color scheme:

// Current colors
const colors = {
  primary: '#3b82f6',    // Blue
  success: '#10b981',    // Green
  warning: '#f59e0b',    // Amber
  danger: '#ef4444'      // Red
};

// To match brand colors:
const colors = {
  primary: '#FF6B35',    // Brand Orange
  success: '#004E89',    // Brand Blue
  warning: '#F7B801',    // Brand Yellow
  danger: '#D62828'      // Brand Red
};

// Apply to charts:
<LineChart data={data} stroke={colors.primary} strokeWidth={2} />
<BarChart data={data} fill={colors.success} />
```

**Adjust Chart Heights:**

```javascript
// In component files, update height prop:
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    {/* chart config */}
  </LineChart>
</ResponsiveContainer>

// To make taller:
<ResponsiveContainer width="100%" height={500}>
```

**Toggle Legend Display:**

```javascript
// Add to chart:
<Legend 
  visible={true}  // Set to false to hide legend
  align="right"
  verticalAlign="top"
/>
```

**Change Animation Duration:**

```javascript
// In Recharts components:
<LineChart data={data} isAnimationActive={true}>
  <Line 
    type="monotone" 
    dataKey="value" 
    isAnimationActive={true}
    animationDuration={1000}  // 1 second (increase for slower)
  />
</LineChart>

// To disable animations for performance:
<LineChart data={data} isAnimationActive={false}>
```

### 7c: Date Presets

**Add Custom Presets:**

In `DateRangeSelector.jsx`:

```javascript
const presets = [
  { label: 'Today', getValue: () => [today, today] },
  { label: 'This Week', getValue: () => [weekStart, today] },
  { label: 'This Month', getValue: () => [monthStart, today] },
  { label: 'Last 30 Days', getValue: () => [thirtyDaysAgo, today] },
  { label: 'This Quarter', getValue: () => [quarterStart, today] },
  { label: 'This Year', getValue: () => [yearStart, today] },
  { label: 'Last 90 Days', getValue: () => [ninetyDaysAgo, today] },
  { label: 'Custom', showPicker: true }
];

// To add "Last Quarter":
{ 
  label: 'Last Quarter', 
  getValue: () => {
    const q = Math.floor(new Date().getMonth() / 3);
    const quarterStart = new Date(new Date().getFullYear(), q * 3 - 3, 1);
    const quarterEnd = new Date(new Date().getFullYear(), q * 3, 0);
    return [quarterStart, quarterEnd];
  }
}
```

**Change Default Preset:**

```javascript
const [selectedRange, setSelectedRange] = useState(
  presets[2].getValue()  // Change index (0-based) to change default
); 
// Index 2 = "This Month", change to 1 for "This Week", etc.
```

---

## Part 8: Troubleshooting Guide

### Dashboard Access Issues

**Problem: "404 Not Found" when accessing /analytics**
- Solution: Verify route is added in `App.jsx`
- Check: Route path is exactly `/analytics`
- Check: Component is imported correctly

**Problem: Redirect to login when accessing /analytics**
- Solution: Verify user has admin role
- Check: User.role === 'admin' in database
- Check: ProtectedRoute component logic is correct

**Problem: Permission denied error**
- Solution: Grant admin role to test user
- Check: Role-based access control configuration
- Check: User session is still valid

### Dashboard Load Issues

**Problem: "No data showing" on all charts**
- Solution 1: Verify database has sample data
  ```sql
  SELECT COUNT(*) FROM projects;
  SELECT COUNT(*) FROM project_invoices;
  SELECT COUNT(*) FROM tasks;
  ```
- Solution 2: Check date range - may be outside data date range
- Solution 3: Verify database connection is working

**Problem: Charts render but show "undefined" values**
- Solution 1: Check analyticsService functions return correct data format
- Solution 2: Verify data transformations in analytics service
- Solution 3: Check console for errors during data fetch

**Problem: "Error loading data" message appears**
- Solution 1: Check API/database connection
- Solution 2: Review browser console for specific error
- Solution 3: Verify analyticsService file is deployed correctly

### Performance Issues

**Problem: Dashboard loads very slowly (> 5 seconds)**
- Solution 1: Create database indexes (see Part 4a)
  ```bash
  # Check if indexes exist
  psql -U postgres -d solartrack -c "\d project_invoices"
  ```
- Solution 2: Reduce date range in initial load
- Solution 3: Implement materialized view (see Part 4b)
- Solution 4: Check database query performance: `EXPLAIN ANALYZE`

**Problem: Charts render very slowly or animation is jittery**
- Solution 1: Enable React.memo on chart components
- Solution 2: Reduce animation duration (set animationDuration={0})
- Solution 3: Use virtualization for large datasets
- Solution 4: Reduce chart data points using pagination

**Problem: Frequent "cache expired" messages**
- Solution: Increase VITE_ANALYTICS_CACHE_TTL (default 1 hour)
- Current: 3600 seconds
- Try: 7200 seconds (2 hours)

### Data Accuracy Issues

**Problem: Revenue total doesn't match expected amount**
- Solution 1: Verify calculation logic in `getRevenueMetrics()`
- Solution 2: Check payment_status filter (Paid vs Pending vs Draft)
- Solution 3: Run audit query:
  ```sql
  SELECT SUM(total_amount) FROM project_invoices 
  WHERE payment_status = 'Paid';
  ```
- Solution 4: Check for date filtering logic errors

**Problem: Conversion rate seems incorrect**
- Solution 1: Verify formula: (NEG / EST) * 100
- Solution 2: Check filtering logic for project states
- Solution 3: Count projects by state:
  ```sql
  SELECT state, COUNT(*) FROM projects GROUP BY state;
  ```

**Problem: Customer LTV doesn't match manual calculation**
- Solution 1: Verify customer identification (duplicate customers?)
- Solution 2: Check invoice customer grouping logic
- Solution 3: Ensure all invoices have customer_id

### Mobile/Responsive Issues

**Problem: Charts have horizontal scrollbar on mobile**
- Solution: Add `responsive={true}` to ResponsiveContainer
- Check: Chart width is set to 100%
- Reduce: Chart height to fit smaller screens

**Problem: KPI cards overlap on mobile**
- Solution: Use CSS Grid with responsive columns
  ```css
  @media (max-width: 640px) {
    .kpi-grid {
      grid-template-columns: 1fr;
    }
  }
  ```

**Problem: Date picker not usable on touch devices**
- Solution: Ensure date picker has adequate touch targets (44px minimum)
- Check: Mobile-optimized date picker library

### Export Issues

**Problem: CSV export button not visible**
- Solution: Verify VITE_ANALYTICS_ENABLE_EXPORT=true in .env
- Check: exportDashboardToCSV function exists in analyticsService

**Problem: CSV file downloads but is empty or corrupted**
- Solution 1: Verify CSV headers are created
- Solution 2: Check data is properly formatted (escape quotes, commas)
- Solution 3: Verify file encoding is UTF-8

**Problem: CSV opens with scrambled characters in Excel**
- Solution: Save CSV with UTF-8 BOM (Byte Order Mark)
  ```javascript
  const BOM = '\uFEFF';
  const csvContent = BOM + csvData;
  ```

---

## Part 9: Monitoring & Maintenance

### 9a: Monitor Performance

**Track Page Load Time:**

```javascript
// Add performance monitoring
const measureDashboardLoad = () => {
  const perfData = performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  const apiCallTime = perfData.responseEnd - perfData.requestStart;
  const renderTime = perfData.domInteractive - perfData.domLoading;
  
  console.log({
    pageLoadTime: `${pageLoadTime}ms`,
    apiCallTime: `${apiCallTime}ms`,
    renderTime: `${renderTime}ms`
  });
  
  // Alert if load time exceeds threshold
  if (pageLoadTime > 2000) {
    console.warn('Dashboard load time exceeds 2 seconds');
  }
};

// Call after dashboard loads
window.addEventListener('load', measureDashboardLoad);
```

**Monitor Database Query Times:**

Enable query logging in PostgreSQL:

```sql
-- Edit postgresql.conf
log_min_duration_statement = 500  -- Log queries > 500ms

-- View slow queries
SELECT query, mean_exec_time, max_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 500
ORDER BY mean_exec_time DESC
LIMIT 20;
```

**Monitor Memory Usage:**

```javascript
// In browser DevTools
// 1. Open DevTools (F12)
// 2. Go to Memory tab
// 3. Take heap snapshot before and after dashboard load
// 4. Compare snapshots to find leaks
// 5. Target: < 100MB memory usage
```

**Watch for N+1 Query Problems:**

```javascript
// BAD: N+1 queries (1 query for customers + 1 query per customer)
const customers = await getCustomers();
for (let customer of customers) {
  customer.invoices = await getInvoicesByCustomer(customer.id);
}

// GOOD: Single query with JOIN
const customersWithInvoices = await query(`
  SELECT c.*, i.* FROM customers c
  LEFT JOIN invoices i ON c.id = i.customer_id
`);
```

### 9b: Monitor Data Accuracy

**Spot-Check Metrics:**

Monthly, pick 3 random metrics and verify against raw data:

```javascript
// Example: Verify July revenue
const julyInvoices = await db.query(`
  SELECT SUM(total_amount) as revenue
  FROM project_invoices
  WHERE payment_status = 'Paid'
    AND DATE_TRUNC('month', created_at) = '2024-07-01'
`);

const dashboardRevenue = await analyticsService.getRevenueMetrics(
  new Date('2024-07-01'),
  new Date('2024-07-31')
);

// Compare: Should match
console.assert(
  julyInvoices[0].revenue === dashboardRevenue.total,
  'July revenue mismatch'
);
```

**Alert on Unexpected Changes:**

```javascript
// Track day-over-day changes
const yesterdayMetrics = await getMetricsForDate(yesterday);
const todayMetrics = await getMetricsForDate(today);

const revenueChange = (
  (todayMetrics.revenue - yesterdayMetrics.revenue) / 
  yesterdayMetrics.revenue
) * 100;

// Alert if change > 20% (likely data issue)
if (Math.abs(revenueChange) > 20) {
  sendAlert(`Revenue changed ${revenueChange}% - possible data issue`);
}
```

**Regular Audit of Calculations:**

Quarterly, audit each metric calculation:

- [ ] Revenue calculation matches business rules
- [ ] Conversion rate formula correct
- [ ] Customer LTV logic accurate
- [ ] Segment thresholds appropriate
- [ ] Forecast algorithm realistic

### 9c: Maintenance Tasks

**Daily:**
- Monitor dashboard error logs
- Check for slow queries (> 1 second)
- Verify cache is functioning

**Weekly:**
- Review performance metrics
- Check database disk space
- Verify backup completion

**Monthly:**
- Refresh materialized views (if using)
- Archive old cache entries
- Spot-check 3 metrics against raw data
- Update forecast model with new data

**Quarterly:**
- Review and update customer segments
- Audit metric calculations
- Performance optimization review
- Update documentation

**Yearly:**
- Full performance audit
- Archive historical data
- Plan for next year's enhancements
- Capacity planning for growth

---

## Part 10: Key Insights to Track

The following KPIs are critical for business decision-making. Monitor these monthly:

### Financial Metrics
- **Monthly Revenue Trend**: Should show consistent growth (5-10% MoM typical)
- **Revenue by Customer Segment**: Identify high-value customers
- **Revenue Forecast Accuracy**: Compare actual vs forecast (target: ±10%)

### Pipeline Metrics
- **Conversion Rate (EST → Paid)**: Target: 20-30% typical for service businesses
- **Average Deal Value**: Should be stable or increasing
- **Deal Velocity**: Days from EST to Paid (shorter is better)

### Customer Metrics
- **Customer Lifetime Value**: Increasing = healthy business
- **Customer Acquisition Cost**: Should be < 30% of CLV
- **Customer Concentration**: % revenue from top 10 customers (risk if > 50%)

### Operational Metrics
- **Project Completion Rate**: % of projects reaching Paid stage
- **Team Productivity**: Revenue per team member (should increase over time)
- **Time-to-Close**: Average days from Estimate to Paid

### Risk Indicators
- **Stalled Deals**: Projects stuck in Negotiation > 90 days
- **Customer Churn**: Customers with no activity > 180 days
- **Forecast Accuracy**: If forecast consistently misses, refine algorithm

---

## Deployment Checklist Summary

### Pre-Deployment
- [ ] All files copied to correct locations
- [ ] Database indexes created
- [ ] Environment variables configured
- [ ] AnalyticsContext created and configured
- [ ] Routes and navigation added
- [ ] All tests passing

### Deployment
- [ ] Deploy code to staging environment
- [ ] Run staging test suite
- [ ] Deploy to production
- [ ] Verify /analytics route is live
- [ ] Check admin can access dashboard
- [ ] Verify data loads correctly

### Post-Deployment
- [ ] Monitor error logs for 24 hours
- [ ] Check performance metrics (target: < 2s load)
- [ ] Spot-check 3 metrics against raw data
- [ ] Train team on dashboard features
- [ ] Set up monitoring and alerts
- [ ] Schedule weekly maintenance tasks

---

## Support & Next Steps

### Getting Help
- Check troubleshooting section (Part 8)
- Review error logs in browser DevTools console
- Run EXPLAIN ANALYZE on slow queries
- Spot-check data against raw database

### Next Phase
- Phase 2D: Real-time alerts and notifications
- Phase 2E: Custom report builder
- Phase 3: Mobile app analytics

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-15  
**Phase**: 2C Advanced Analytics Dashboard Deployment
