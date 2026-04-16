# Phase 2C: Advanced Analytics Dashboard Setup Guide

## Overview
Phase 2C provides comprehensive analytics and business intelligence for SolarTrack Pro, including:
- Advanced revenue metrics and forecasting
- Project pipeline analytics
- Customer insights and lifetime value (LTV) calculations
- Team performance metrics
- Interactive dashboards with multiple visualizations

---

## Table of Contents
1. [Database Schema Setup](#database-schema-setup)
2. [Service Configuration](#service-configuration)
3. [Dashboard Routes](#dashboard-routes)
4. [Component Integration](#component-integration)
5. [Performance Optimization](#performance-optimization)
6. [Testing & Validation](#testing--validation)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Database Schema Setup

### 1. Create Analytics Cache Table

The analytics cache table stores computed metrics to improve performance.

```sql
CREATE TABLE analytics_cache (
  id BIGSERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);

-- Enable RLS if using Supabase
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY "Users can read analytics cache"
  ON analytics_cache
  FOR SELECT
  TO authenticated
  USING (true);
```

### 2. Ensure Required Tables Exist

The analytics service depends on these tables:
- `projects` - with fields: id, customer_id, customer_name, workflow_status, estimated_value, status, created_at
- `project_invoices` - with fields: id, project_id, customer_id, amount, payment_status, created_at
- `project_updates` - with fields: id, assigned_to, status, created_at, updated_at

Verify these tables exist and have the required columns:

```sql
-- Check projects table structure
SELECT * FROM projects LIMIT 1;

-- Check project_invoices table structure
SELECT * FROM project_invoices LIMIT 1;

-- Check project_updates table structure (if using task tracking)
SELECT * FROM project_updates LIMIT 1;
```

### 3. Add Materialized Views (Optional, for Performance)

For large datasets, create materialized views to pre-compute expensive queries:

```sql
-- Create materialized view for monthly revenue
CREATE MATERIALIZED VIEW mv_monthly_revenue AS
SELECT
  DATE_TRUNC('month', created_at)::DATE as month,
  SUM(amount) as total_revenue,
  COUNT(*) as invoice_count
FROM project_invoices
WHERE payment_status = 'Paid'
GROUP BY DATE_TRUNC('month', created_at);

-- Create index on materialized view
CREATE UNIQUE INDEX idx_mv_monthly_revenue_month
ON mv_monthly_revenue(month);

-- Create materialized view for customer LTV
CREATE MATERIALIZED VIEW mv_customer_ltv AS
SELECT
  c.id as customer_id,
  SUM(pi.amount) as total_spent,
  COUNT(DISTINCT p.id) as project_count,
  COUNT(DISTINCT pi.id) as invoice_count,
  CASE
    WHEN SUM(pi.amount) > 50000 THEN 'High Value'
    WHEN SUM(pi.amount) > 10000 THEN 'Medium Value'
    ELSE 'Low Value'
  END as segment
FROM customers c
LEFT JOIN projects p ON c.id = p.customer_id
LEFT JOIN project_invoices pi ON p.id = pi.project_id AND pi.payment_status = 'Paid'
GROUP BY c.id;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_mv_customer_ltv_id
ON mv_customer_ltv(customer_id);
```

### 4. Refresh Materialized Views

Schedule regular refreshes of materialized views:

```sql
-- Refresh all materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_revenue;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_customer_ltv;
```

---

## Service Configuration

### 1. Deployment Steps

1. **Copy Service File**
   ```bash
   cp src/lib/analyticsService.js src/lib/analyticsService.js
   ```

2. **Verify Dependencies**
   Ensure these packages are installed:
   ```bash
   npm list recharts react-hot-toast lucide-react
   ```

3. **Configure Cache TTL**
   Default cache time-to-live is 3600 seconds (1 hour).
   
   To adjust, modify the service function calls:
   ```javascript
   // In analyticsService.js
   // Change the default ttl parameter:
   export async function cacheAnalyticsMetrics(cacheKey, data, ttl = 7200) // 2 hours
   ```

### 2. Supabase Configuration

Ensure your `.env.local` file contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Authentication & Authorization

The dashboard requires authenticated users with admin or manager role.

Add role-based access control:

```javascript
// In AdvancedAnalyticsDashboard.jsx or ProtectedRoute.jsx
import { useAuth } from '../contexts/AuthContext'

export default function AnalyticsRoute() {
  const { user, profile } = useAuth()
  
  if (!user || !['admin', 'manager'].includes(profile?.role)) {
    return <Navigate to="/login" />
  }
  
  return <AdvancedAnalyticsDashboard />
}
```

---

## Dashboard Routes

### 1. Add Route to Router Configuration

Add the analytics dashboard route to your main routing file (e.g., `App.jsx` or `main.jsx`):

```javascript
import AdvancedAnalyticsDashboard from './pages/AdvancedAnalyticsDashboard'
import ProtectedRoute from './components/ProtectedRoute'

// In your Routes section:
<Route
  path="/analytics"
  element={
    <ProtectedRoute requiredRole={['admin', 'manager']}>
      <AdvancedAnalyticsDashboard />
    </ProtectedRoute>
  }
/>
```

### 2. Navigation Links

Add link to analytics dashboard in your navigation menu:

```javascript
<Link to="/analytics" className="...">
  <BarChart3 className="w-5 h-5" />
  Analytics
</Link>
```

### 3. Default Landing Page

Set the dashboard as the default analytics view by modifying navigation:

```javascript
// In Dashboard.jsx or other entry points
<Link to="/analytics">View Advanced Analytics</Link>
```

---

## Component Integration

### 1. Directory Structure

```
src/
├── components/
│   └── analytics/
│       ├── DateRangeSelector.jsx
│       ├── AdvancedMetricsCard.jsx
│       ├── RevenueChart.jsx
│       ├── ProjectCompletionFunnel.jsx
│       ├── CustomerLifetimeValue.jsx
│       ├── CustomerSegmentationChart.jsx
│       └── MonthlyTrendsChart.jsx
├── lib/
│   └── analyticsService.js
└── pages/
    └── AdvancedAnalyticsDashboard.jsx
```

### 2. Component Props Reference

**DateRangeSelector**
```javascript
<DateRangeSelector
  onSelect={(dates) => setDateRange(dates)}
  initialStartDate={startDate}
  initialEndDate={endDate}
/>
```

**AdvancedMetricsCard**
```javascript
<AdvancedMetricsCard
  title="Total Revenue"
  value={1250000}
  icon={DollarSign}
  change={15.5}
  trend="up" // 'up', 'down', 'flat'
  format="currency" // 'currency', 'percentage', 'number'
  color="orange" // 'orange', 'blue', 'green', 'red', 'purple'
  loading={false}
  onClick={() => console.log('clicked')}
/>
```

**RevenueChart**
```javascript
<RevenueChart
  data={[{ date: '2024-01', revenue: 50000, count: 5 }]}
  forecast={[{ month: '2024-02', revenue: 55000, isForecasted: true }]}
  loading={false}
  onDataClick={(data) => console.log(data)}
/>
```

### 3. Service Functions Usage

```javascript
import * as analyticsService from '../lib/analyticsService'

// Get revenue metrics
const revenue = await analyticsService.getRevenueMetrics(
  '2024-01-01',
  '2024-03-31',
  'monthly'
)

// Get customer insights
const customers = await analyticsService.getCustomerInsights()

// Get conversion rates
const conversions = await analyticsService.getConversionRates('monthly')

// Get pipeline data
const pipeline = await analyticsService.getPipelineData()

// Get revenue forecast
const forecast = await analyticsService.getRevenueForecast(6) // 6 months

// Caching example
await analyticsService.cacheAnalyticsMetrics('revenue_q1_2024', revenueData, 7200)
const cachedData = await analyticsService.getFromCache('revenue_q1_2024')

// Cache invalidation
await analyticsService.invalidateAnalyticsCache('revenue_*')
await analyticsService.cleanupExpiredCache()
```

---

## Performance Optimization

### 1. Query Optimization

- **Use materialized views** for frequently accessed aggregations
- **Add indexes** on commonly filtered columns (customer_id, status, created_at)
- **Limit result sets** using pagination for large datasets
- **Use batch queries** to fetch related data together

Example optimized query:
```sql
-- Add indexes
CREATE INDEX idx_projects_customer_id ON projects(customer_id);
CREATE INDEX idx_projects_workflow_status ON projects(workflow_status);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_invoices_payment_status ON project_invoices(payment_status);
CREATE INDEX idx_invoices_customer_id ON project_invoices(customer_id);
CREATE INDEX idx_invoices_created_at ON project_invoices(created_at);
```

### 2. Caching Strategy

- **Default TTL**: 3600 seconds (1 hour)
- **Expensive queries**: Increase to 7200-14400 seconds (2-4 hours)
- **Real-time data**: Decrease to 300-600 seconds (5-10 minutes)
- **Daily reports**: Cache for 86400 seconds (24 hours)

```javascript
// Example cache strategies
const CACHE_STRATEGIES = {
  revenue: { ttl: 3600 }, // 1 hour - frequently updated
  forecast: { ttl: 86400 }, // 24 hours - calculated daily
  ltv: { ttl: 7200 }, // 2 hours - slower to compute
  pipeline: { ttl: 1800 }, // 30 minutes - semi-real-time
}

// Usage
const cachedKey = `revenue_${startDate}_${endDate}`
const cached = await analyticsService.getFromCache(cachedKey)
if (!cached) {
  const data = await analyticsService.getRevenueMetrics(startDate, endDate)
  await analyticsService.cacheAnalyticsMetrics(
    cachedKey,
    data,
    CACHE_STRATEGIES.revenue.ttl
  )
}
```

### 3. Data Pagination

For large datasets, implement pagination:

```javascript
// In dashboard - load data in chunks
const [currentPage, setCurrentPage] = useState(1)
const pageSize = 50

const pagedCustomers = topCustomers.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
)
```

### 4. Lazy Loading

Load charts only when visible:

```javascript
import { useEffect, useRef } from 'react'

export function LazyChart({ Component, ...props }) {
  const ref = useRef()
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setShouldLoad(true)
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return <div ref={ref}>{shouldLoad && <Component {...props} />}</div>
}
```

---

## Testing & Validation

### 1. Test with Sample Data

Create a test script to verify analytics functions:

```javascript
// tests/analytics.test.js
import * as analyticsService from '../src/lib/analyticsService'

async function testAnalytics() {
  console.log('Testing Revenue Metrics...')
  const revenue = await analyticsService.getRevenueMetrics(
    '2024-01-01',
    '2024-03-31'
  )
  console.assert(revenue.total >= 0, 'Revenue total should be non-negative')
  console.log('✓ Revenue metrics working')

  console.log('Testing Project Metrics...')
  const projects = await analyticsService.getProjectMetrics()
  console.assert(projects.total >= 0, 'Project total should be non-negative')
  console.log('✓ Project metrics working')

  console.log('Testing Conversion Rates...')
  const conversions = await analyticsService.getConversionRates()
  console.assert(conversions.exeToPaid >= 0, 'Conversion rate should be non-negative')
  console.log('✓ Conversion rates working')

  console.log('\nAll tests passed!')
}

testAnalytics().catch(console.error)
```

### 2. Data Accuracy Verification

Manually verify metrics calculations:

```sql
-- Verify revenue total
SELECT
  COUNT(*) as invoice_count,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_invoice
FROM project_invoices
WHERE payment_status = 'Paid'
AND created_at BETWEEN '2024-01-01' AND '2024-03-31';

-- Verify project counts by status
SELECT
  workflow_status,
  COUNT(*) as count
FROM projects
GROUP BY workflow_status;

-- Verify customer LTV
SELECT
  customer_id,
  COUNT(DISTINCT id) as project_count,
  SUM(estimated_value) as total_value
FROM projects
GROUP BY customer_id
ORDER BY total_value DESC
LIMIT 10;
```

### 3. Load Testing

Test dashboard performance under load:

```bash
# Using Apache Bench (ab)
ab -n 100 -c 10 https://yourapp.com/analytics

# Using wrk
wrk -t4 -c100 -d30s https://yourapp.com/analytics
```

### 4. Browser Performance Testing

Use Chrome DevTools:
1. Open DevTools (F12)
2. Go to Performance tab
3. Record page load and interactions
4. Check for bottlenecks in chart rendering

---

## Monitoring & Maintenance

### 1. Performance Monitoring

Monitor query performance in Supabase:

```sql
-- Check slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 2. Cache Management

Set up automated cache cleanup:

```javascript
// Schedule cache cleanup (e.g., every day at 2 AM)
import { cron } from 'node-cron'
import * as analyticsService from './analyticsService'

cron.schedule('0 2 * * *', async () => {
  console.log('Running scheduled cache cleanup...')
  await analyticsService.cleanupExpiredCache()
  console.log('Cache cleanup completed')
})
```

### 3. Monitoring Alerts

Set up alerts for anomalies:

```javascript
// Alert if revenue drops significantly
const prevRevenue = await analyticsService.getRevenueMetrics('2024-02-01', '2024-02-29')
const currRevenue = await analyticsService.getRevenueMetrics('2024-03-01', '2024-03-31')

const changePercent = ((currRevenue.total - prevRevenue.total) / prevRevenue.total) * 100

if (changePercent < -20) {
  console.warn(`Revenue dropped ${Math.abs(changePercent)}%`)
  // Send alert to admin
}
```

### 4. Data Refresh Schedule

Plan when to refresh materialized views:

```
Peak Hours (9 AM - 5 PM): Refresh every 4 hours
Off-Hours (5 PM - 9 AM): Refresh every 8 hours
Weekends: Refresh once daily

Use Supabase Edge Functions or cloud scheduler
```

### 5. Logging

Add comprehensive logging to analytics functions:

```javascript
// Enhanced service function with logging
export async function getRevenueMetrics(startDate, endDate, groupBy = 'monthly') {
  const startTime = performance.now()
  console.log(`[Analytics] Fetching revenue metrics: ${startDate} to ${endDate}`)

  try {
    // ... function body
    const elapsed = performance.now() - startTime
    console.log(`[Analytics] Revenue metrics completed in ${elapsed.toFixed(2)}ms`)
    return data
  } catch (err) {
    console.error(`[Analytics] Revenue metrics error:`, err)
    throw err
  }
}
```

### 6. Maintenance Checklist

- [ ] Verify database indexes are being used (check `EXPLAIN ANALYZE`)
- [ ] Monitor cache hit rates
- [ ] Audit slow query logs weekly
- [ ] Test disaster recovery procedures
- [ ] Review and update forecasting model quarterly
- [ ] Clean up old cache entries monthly
- [ ] Validate data accuracy monthly
- [ ] Review user access logs for security

---

## Troubleshooting

### Common Issues

**1. Dashboard loads slowly**
- Check if queries are hitting indexes
- Increase cache TTL for expensive operations
- Enable query result caching in Supabase

**2. Forecast predictions are inaccurate**
- Ensure sufficient historical data (at least 12 months)
- Check for data anomalies or outliers
- Consider adding seasonal factors

**3. Cache not working**
- Verify `analytics_cache` table exists
- Check RLS policies on cache table
- Ensure TTL values are greater than query execution time

**4. Missing data in charts**
- Verify required table columns exist
- Check for NULL values in key fields
- Confirm date formats are ISO-8601 compatible

---

## Support & Resources

- **Recharts Documentation**: https://recharts.org/
- **Supabase Documentation**: https://supabase.com/docs
- **React Documentation**: https://react.dev/

---

## Version History

- **v1.0** (Phase 2C): Initial release with core analytics functionality
- **v1.1**: Added customer segmentation and forecasting
- **v1.2**: Optimized caching and performance

---

*Last Updated: April 2026*
