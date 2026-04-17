import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Loader } from 'lucide-react'

/**
 * CustomerLifetimeValue Component
 * Displays top customers by lifetime value with bar chart
 */
export default function CustomerLifetimeValue({ data = [], loading = false, onCustomerClick }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading customer data...</span>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <p className="text-gray-600">No customer data available</p>
      </div>
    )
  }

  // Prepare data for chart - use customer name or ID
  const chartData = (data || []).slice(0, 10).map((customer, index) => ({
    name: customer.name || `Customer ${index + 1}`,
    value: customer.totalSpent || customer.value || 0,
    customerId: customer.customerId || customer.id,
    projectCount: customer.projectCount || customer.count || 0,
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers (by Value)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
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
