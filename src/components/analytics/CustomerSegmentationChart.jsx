import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Loader } from 'lucide-react'

/**
 * CustomerSegmentationChart Component
 * Displays customer segments by value (high, medium, low)
 */
export default function CustomerSegmentationChart({
  highValue = [],
  mediumValue = [],
  lowValue = [],
  loading = false,
  onSegmentClick,
}) {
  const segments = [
    { name: 'High Value', count: highValue.length, color: '#dc2626' },
    { name: 'Medium Value', count: mediumValue.length, color: '#f97316' },
    { name: 'Low Value', count: lowValue.length, color: '#fbbf24' },
  ]

  const highValueTotal = highValue.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
  const mediumValueTotal = mediumValue.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
  const lowValueTotal = lowValue.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
  const totalRevenue = highValueTotal + mediumValueTotal + lowValueTotal

  const chartData = [
    {
      name: 'High Value',
      value: highValue.length,
      revenue: highValueTotal,
      percentage: totalRevenue > 0 ? ((highValueTotal / totalRevenue) * 100).toFixed(1) : 0,
    },
    {
      name: 'Medium Value',
      value: mediumValue.length,
      revenue: mediumValueTotal,
      percentage: totalRevenue > 0 ? ((mediumValueTotal / totalRevenue) * 100).toFixed(1) : 0,
    },
    {
      name: 'Low Value',
      value: lowValue.length,
      revenue: lowValueTotal,
      percentage: totalRevenue > 0 ? ((lowValueTotal / totalRevenue) * 100).toFixed(1) : 0,
    },
  ]

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading segmentation data...</span>
        </div>
      </div>
    )
  }

  if (highValue.length === 0 && mediumValue.length === 0 && lowValue.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <p className="text-gray-600">No customer segmentation data available</p>
      </div>
    )
  }

  const colors = ['#dc2626', '#f97316', '#fbbf24']

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
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

      {/* Segment Details */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {chartData.map((segment, index) => (
          <div
            key={segment.name}
            onClick={() =>
              onSegmentClick &&
              onSegmentClick({
                segment: segment.name,
                data:
                  index === 0 ? highValue : index === 1 ? mediumValue : lowValue,
              })
            }
            className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition cursor-pointer"
            style={{ borderTopColor: colors[index], borderTopWidth: '3px' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index] }}
              ></div>
              <p className="font-medium text-gray-900">{segment.name}</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{segment.value}</p>
            <p className="text-sm text-gray-600 mt-2">
              ${segment.revenue.toLocaleString('en-US')} ({segment.percentage}% of revenue)
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
