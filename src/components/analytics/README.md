# Advanced Analytics Components

This directory contains reusable components for the Phase 2C Advanced Analytics Dashboard.

## Components Overview

### DateRangeSelector.jsx
Provides interactive date range selection with preset buttons and custom date picker.

**Usage:**
```javascript
import DateRangeSelector from './DateRangeSelector'

<DateRangeSelector
  onSelect={({ startDate, endDate }) => {
    setDateRange({ startDate, endDate })
  }}
  initialStartDate="2024-01-01"
  initialEndDate="2024-03-31"
/>
```

**Presets:**
- Today
- This Week
- This Month
- Last 3 Months
- Last Year
- Custom (calendar picker)

---

### AdvancedMetricsCard.jsx
KPI card component displaying metric value, change percentage, and trend indicator.

**Usage:**
```javascript
import AdvancedMetricsCard from './AdvancedMetricsCard'

<AdvancedMetricsCard
  title="Total Revenue"
  value={1250000}
  icon={DollarSign}
  change={15.5}
  trend="up"
  format="currency"
  color="orange"
  loading={false}
  onClick={() => handleCardClick()}
/>
```

**Props:**
- `title` (string): Card title
- `value` (number): Metric value
- `icon` (component): Lucide React icon
- `change` (number): Percentage change
- `trend` (string): 'up', 'down', or 'flat'
- `format` (string): 'currency', 'percentage', or 'number'
- `color` (string): 'orange', 'blue', 'green', 'red', or 'purple'
- `loading` (boolean): Show loading state
- `onClick` (function): Click handler

---

### RevenueChart.jsx
Line chart showing revenue trends with optional forecast overlay.

**Usage:**
```javascript
import RevenueChart from './RevenueChart'

<RevenueChart
  data={[
    { date: '2024-01', revenue: 50000, count: 5 },
    { date: '2024-02', revenue: 62000, count: 7 }
  ]}
  forecast={[
    { month: '2024-03', revenue: 68000, isForecasted: true }
  ]}
  loading={false}
  onDataClick={(data) => console.log(data)}
/>
```

**Features:**
- Historical revenue line
- Forecast overlay (dashed line)
- Interactive tooltips
- Responsive design
- Click handling for drill-down

---

### ProjectCompletionFunnel.jsx
Funnel chart displaying project progression through pipeline stages.

**Usage:**
```javascript
import ProjectCompletionFunnel from './ProjectCompletionFunnel'

<ProjectCompletionFunnel
  data={[
    { name: 'Estimation', value: 45, amount: 450000 },
    { name: 'Negotiation', value: 30, amount: 350000 },
    { name: 'Execution', value: 18, amount: 250000 },
    { name: 'Paid', value: 12, amount: 180000 }
  ]}
  loading={false}
  onStageClick={(stage) => filterByStage(stage)}
/>
```

**Features:**
- Stage-by-stage breakdown
- Conversion rate calculations
- Value aggregation
- Interactive stage filtering
- Color-coded stages

---

### CustomerLifetimeValue.jsx
Bar chart ranking customers by total lifetime value spent.

**Usage:**
```javascript
import CustomerLifetimeValue from './CustomerLifetimeValue'

<CustomerLifetimeValue
  data={[
    { customerId: 1, name: 'ABC Solar', totalSpent: 250000, projectCount: 5 },
    { customerId: 2, name: 'XYZ Homes', totalSpent: 180000, projectCount: 3 }
  ]}
  loading={false}
  onCustomerClick={(customer) => navigateToCustomer(customer)}
/>
```

**Features:**
- Top 10 customers ranking
- Project count per customer
- Interactive drill-down
- Detailed list view
- Responsive bar chart

---

### CustomerSegmentationChart.jsx
Pie chart displaying customer segments by value (high, medium, low).

**Usage:**
```javascript
import CustomerSegmentationChart from './CustomerSegmentationChart'

<CustomerSegmentationChart
  highValue={[...]}
  mediumValue={[...]}
  lowValue={[...]}
  loading={false}
  onSegmentClick={(segment) => showSegmentDetails(segment)}
/>
```

**Features:**
- 3-segment pie chart
- Revenue percentage breakdown
- Customer count per segment
- Interactive segment filtering
- Segment detail cards

---

### MonthlyTrendsChart.jsx
Area chart showing 12-month trends for revenue, projects, or customers.

**Usage:**
```javascript
import MonthlyTrendsChart from './MonthlyTrendsChart'

<MonthlyTrendsChart
  data={[
    { month: 'Jan 2024', value: 50000 },
    { month: 'Feb 2024', value: 62000 }
  ]}
  metric="revenue"
  loading={false}
  onDataClick={(data) => drillDown(data)}
/>
```

**Metric Options:**
- `revenue`: Dollar amounts, formatted as $Xk
- `projects`: Count of projects
- `customers`: Unique customers

**Features:**
- 12-month visualization
- Multiple metric support
- Summary statistics (average, peak, total)
- Interactive data points

---

### TeamPerformanceChart.jsx
Bar chart displaying team member task completion and on-time metrics.

**Usage:**
```javascript
import TeamPerformanceChart from './TeamPerformanceChart'

<TeamPerformanceChart
  data={[
    { id: 1, name: 'John Doe', tasksCompleted: 25, tasksAssigned: 30, completionRate: 83 },
    { id: 2, name: 'Jane Smith', tasksCompleted: 28, tasksAssigned: 30, completionRate: 93 }
  ]}
  loading={false}
  onMemberClick={(member) => showMemberDetails(member)}
/>
```

**Features:**
- Completion rate comparison
- Assigned vs completed visualization
- Progress bars per team member
- Top 10 performers
- Click-through to member details

---

### PipelineForecastingChart.jsx
Composed chart with historical data, forecast line, and confidence intervals.

**Usage:**
```javascript
import PipelineForecastingChart from './PipelineForecastingChart'

<PipelineForecastingChart
  forecast={[...]}
  historical={[...]}
  goal={250000}
  loading={false}
/>
```

**Features:**
- 6-month forecast visualization
- Confidence interval shading (±10%)
- Goal line comparison
- Summary statistics
- Forecast detail table

---

## Common Props Across All Components

### Loading State
```javascript
{loading && (
  <div className="flex items-center justify-center h-80">
    <Loader className="w-5 h-5 animate-spin" />
  </div>
)}
```

### Error Handling
All components gracefully handle empty data:
```javascript
if (!data || data.length === 0) {
  return <div>No data available</div>
}
```

### Responsive Design
All charts use Recharts' ResponsiveContainer:
```javascript
<ResponsiveContainer width="100%" height={300}>
  {/* Chart component */}
</ResponsiveContainer>
```

---

## Styling & Theming

### Color Palette
- Orange: #f97316 (primary action/revenue)
- Blue: #3b82f6 (secondary)
- Green: #22c55e (success/positive trends)
- Red: #dc2626 (negative/high value)
- Yellow: #fbbc04 (warning/forecast)
- Purple: #8b5cf6 (accent)

### Tailwind Classes
All components use Tailwind CSS with:
- Gray color scheme (gray-50 to gray-900)
- Border: gray-200 (primary), gray-300 (secondary)
- Hover states with `transition` class
- Responsive grid layouts

---

## Integration with Analytics Service

All components work with `analyticsService.js`:

```javascript
import * as analyticsService from '../../lib/analyticsService'

// Example: Load data and pass to component
const [revenueData, setRevenueData] = useState([])

useEffect(() => {
  const loadData = async () => {
    const metrics = await analyticsService.getRevenueMetrics(startDate, endDate)
    setRevenueData(metrics.data)
  }
  loadData()
}, [startDate, endDate])

// Render component
<RevenueChart data={revenueData} loading={loading} />
```

---

## Performance Optimization

### Memoization
For large datasets, memoize components:
```javascript
import { memo } from 'react'

export default memo(function RevenueChart(props) {
  // Component code
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.data === nextProps.data
})
```

### Lazy Loading
Load charts only when visible:
```javascript
const LazyChart = lazy(() => import('./RevenueChart'))

<Suspense fallback={<Loader />}>
  <LazyChart {...props} />
</Suspense>
```

---

## Accessibility

All components follow WCAG guidelines:
- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- High contrast colors
- Clear, descriptive text

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 12+, Android 8+)

---

## Version History

- **v1.0**: Initial component release
- **v1.1**: Added accessibility improvements
- **v1.2**: Performance optimizations

---

## Contributing

When adding new components:
1. Follow existing naming conventions
2. Include loading and empty states
3. Use Recharts for visualizations
4. Add responsive design
5. Document props clearly
6. Include usage examples

---

*Last Updated: April 2026*
