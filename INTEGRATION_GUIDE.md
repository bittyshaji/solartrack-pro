# Phase 2C Analytics - Integration Guide

## Quick Start: Adding Analytics to Your App

### Step 1: Add Route (5 minutes)

Edit your main routing file (typically `App.jsx` or `main.jsx`):

```javascript
import AdvancedAnalyticsDashboard from './pages/AdvancedAnalyticsDashboard'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      {/* ... existing routes ... */}
      
      {/* Add this route */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute requiredRole={['admin', 'manager']}>
            <AdvancedAnalyticsDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
```

### Step 2: Add Navigation Link (3 minutes)

Add link to your main navigation (e.g., `Layout.jsx` or `MobileBottomNav.jsx`):

```javascript
import { BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'

<Link
  to="/analytics"
  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg"
>
  <BarChart3 className="w-5 h-5" />
  Analytics
</Link>
```

### Step 3: Create Analytics Cache Table (5 minutes)

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS analytics_cache (
  id BIGSERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_cache_key ON analytics_cache(cache_key);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);

ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read analytics cache"
  ON analytics_cache
  FOR SELECT
  TO authenticated
  USING (true);
```

### Step 4: Verify Dependencies (2 minutes)

Check that these packages are already installed:

```bash
npm list recharts react-hot-toast lucide-react
```

All should be listed in `package.json`. If not:

```bash
npm install recharts react-hot-toast lucide-react
```

### Step 5: Test the Dashboard (5 minutes)

1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:5173/analytics`
3. If you see the dashboard with KPI cards and charts, you're ready!

---

## File Structure

After integration, your project should have:

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
│       ├── MonthlyTrendsChart.jsx
│       ├── TeamPerformanceChart.jsx
│       ├── PipelineForecastingChart.jsx
│       └── README.md
├── lib/
│   └── analyticsService.js
└── pages/
    └── AdvancedAnalyticsDashboard.jsx
```

---

## Common Customizations

### 1. Change Default Date Range

In `AdvancedAnalyticsDashboard.jsx`:

```javascript
// Current: Last 3 months
const [dateRange, setDateRange] = useState({
  startDate: new Date(new Date().setMonth(new Date().getMonth() - 3))
    .toISOString()
    .split('T')[0],
  endDate: new Date().toISOString().split('T')[0],
})

// To change to last year, use:
// new Date().setMonth(new Date().getMonth() - 12)
```

### 2. Restrict Access to Specific Roles

Modify the `ProtectedRoute` check:

```javascript
<Route
  path="/analytics"
  element={
    <ProtectedRoute requiredRole={['admin']}>
      <AdvancedAnalyticsDashboard />
    </ProtectedRoute>
  }
/>
```

### 3. Change Cache Duration

In `analyticsService.js`, modify the `cacheAnalyticsMetrics` function calls.

Default is 3600 seconds (1 hour). To change all caching:

```javascript
// In AdvancedAnalyticsDashboard.jsx, after loading data:
await analyticsService.cacheAnalyticsMetrics(
  'dashboard_data',
  data,
  7200 // 2 hours instead of 1
)
```

### 4. Add Custom Metrics

Extend `analyticsService.js`:

```javascript
export async function getCustomMetric(filters = {}) {
  try {
    const { data, error } = await supabase
      .from('your_table')
      .select('...')
    
    if (error) throw error
    
    // Process and return data
    return processedData
  } catch (err) {
    console.error('Custom metric error:', err)
    return null
  }
}
```

Then use in dashboard:

```javascript
const customMetric = await analyticsService.getCustomMetric()
```

### 5. Style Customization

All components use Tailwind CSS. Modify colors in the component files:

```javascript
// Change primary color from orange to blue
className="bg-orange-500" // Change to "bg-blue-500"
```

---

## Database Requirements

Ensure these tables exist with columns:

**projects**
- id (uuid)
- customer_id (uuid)
- customer_name (text)
- workflow_status (text) - 'Estimation', 'Negotiation', 'Execution'
- estimated_value (numeric)
- status (text)
- created_at (timestamp)

**project_invoices**
- id (uuid)
- project_id (uuid)
- customer_id (uuid)
- amount (numeric)
- payment_status (text) - 'Paid', 'Pending', etc.
- created_at (timestamp)

**project_updates** (optional, for team performance)
- id (uuid)
- assigned_to (uuid)
- status (text)
- created_at (timestamp)
- updated_at (timestamp)

---

## Troubleshooting

### Dashboard shows "No data available"

1. Check that you have data in your database:
   ```sql
   SELECT COUNT(*) FROM projects;
   SELECT COUNT(*) FROM project_invoices WHERE payment_status = 'Paid';
   ```

2. Verify date range includes data:
   ```sql
   SELECT MIN(created_at), MAX(created_at) FROM project_invoices;
   ```

3. Check browser console for errors (F12 → Console tab)

### "Failed to load dashboard data" error

1. Open browser console (F12)
2. Check for auth errors or permission issues
3. Verify Supabase credentials in `.env.local`
4. Check RLS policies on `analytics_cache` table

### Charts not rendering

1. Verify Recharts is installed: `npm list recharts`
2. Check browser console for JavaScript errors
3. Ensure chart data has correct format:
   ```javascript
   [
     { name: 'Jan', value: 100 },
     { name: 'Feb', value: 150 }
   ]
   ```

### Slow dashboard performance

1. Increase cache TTL in `analyticsService.js`
2. Add database indexes on frequently queried columns
3. Enable materialized views (see PHASE2C_SETUP.md)
4. Reduce date range to load less data

---

## Next Steps

### Immediate (Today)
- [ ] Complete integration steps 1-5
- [ ] Test dashboard loads without errors
- [ ] Verify KPI cards show data

### Short Term (This Week)
- [ ] Review data accuracy
- [ ] Customize for your branding
- [ ] Add to user documentation

### Medium Term (This Month)
- [ ] Set up automated cache cleanup
- [ ] Monitor performance metrics
- [ ] Gather user feedback

### Long Term (This Quarter)
- [ ] Implement real-time updates
- [ ] Add custom reports
- [ ] Advanced forecasting models

---

## Support Resources

- **Recharts Docs**: https://recharts.org/api
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **React Docs**: https://react.dev

---

## Performance Tips

1. **Use Chrome DevTools Performance Tab**
   - Ctrl+Shift+I → Performance tab
   - Record page load
   - Identify bottlenecks

2. **Monitor Database Queries**
   - Supabase dashboard → SQL Editor
   - Run: `SELECT * FROM pg_stat_statements ORDER BY mean_time DESC`

3. **Cache Effectively**
   - Expensive queries: 3600-7200 seconds
   - Real-time metrics: 300-600 seconds
   - Reports: 86400 seconds (daily)

4. **Optimize Data**
   - Filter by date range
   - Limit result sets
   - Pre-compute common aggregations

---

## Checklist for Production

- [ ] Database tables created with proper indexes
- [ ] RLS policies configured correctly
- [ ] Cache table created and working
- [ ] Route protected with role-based access
- [ ] Navigation link added
- [ ] Dependencies installed
- [ ] Tested with sample data
- [ ] Performance acceptable (<3 seconds load)
- [ ] Error handling in place
- [ ] Monitoring/alerts configured
- [ ] Documentation reviewed
- [ ] Team trained on dashboard

---

*Estimated setup time: 20-30 minutes*

*Last Updated: April 2026*
