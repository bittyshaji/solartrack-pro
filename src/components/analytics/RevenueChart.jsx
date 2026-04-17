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
