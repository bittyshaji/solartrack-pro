import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Loader } from 'lucide-react'

/**
 * MonthlyTrendsChart Component
 * Displays monthly trends for revenue, projects, or customers
 */
export default function MonthlyTrendsChart({
  data = [],
  metric = 'revenue',
  loading = false,
  onDataClick,
}) {
  const metricConfig = {
    revenue: {
      label: 'Revenue',
      color: '#f97316',
      format: (value) => `$${(value / 1000).toFixed(0)}k`,
      tooltip: (value) => `$${Number(value).toLocaleString('en-US')}`,
    },
    projects: {
      label: 'Projects',
      color: '#3b82f6',
      format: (value) => value,
      tooltip: (value) => `${value} projects`,
    },
    customers: {
      label: 'Customers',
      color: '#8b5cf6',
      format: (value) => value,
      tooltip: (value) => `${value} customers`,
    },
  }

  const config = metricConfig[metric] || metricConfig.revenue

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading trend data...</span>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <p className="text-gray-600">No trend data available</p>
      </div>
    )
  }

  // Transform data to use 'value' key
  const chartData = (data || []).map(item => ({
    month: item.month,
    value: item.value,
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {config.label} - Last 12 Months
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
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
            interval={Math.floor(chartData.length / 6) || 0}
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

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">Average</p>
          <p className="text-lg font-bold text-gray-900">
            {config.format(
              chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length || 0
            )}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">Peak</p>
          <p className="text-lg font-bold text-gray-900">
            {config.format(Math.max(...chartData.map(item => item.value), 0))}
          </p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-lg font-bold text-gray-900">
            {config.format(chartData.reduce((sum, item) => sum + item.value, 0))}
          </p>
        </div>
      </div>
    </div>
  )
}
