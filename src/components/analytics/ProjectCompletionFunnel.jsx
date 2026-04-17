import { FunnelChart, Funnel, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Loader } from 'lucide-react'

/**
 * ProjectCompletionFunnel Component
 * Displays project progression through pipeline stages
 */
export default function ProjectCompletionFunnel({ data = [], loading = false, onStageClick }) {
  const colors = ['#f97316', '#fb923c', '#fbbf24', '#86efac']

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading pipeline data...</span>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <p className="text-gray-600">No pipeline data available</p>
      </div>
    )
  }

  // Calculate conversion rates between stages
  const withConversion = data.map((stage, index) => {
    let conversion = 100
    if (index < data.length - 1 && stage.value > 0) {
      conversion = (data[index + 1].value / stage.value) * 100
    }
    return {
      ...stage,
      conversionRate: index < data.length - 1 ? conversion : 0,
    }
  })

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Pipeline</h3>
      <ResponsiveContainer width="100%" height={300}>
        <FunnelChart margin={{ top: 20, right: 160, bottom: 20, left: 20 }}>
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
            formatter={(value, name) => {
              if (name === 'value') {
                return [`${value} projects`, 'Count']
              } else if (name === 'amount') {
                return [`$${Number(value).toLocaleString('en-US')}`, 'Value']
              }
              return [value, name]
            }}
          />
          <Funnel data={withConversion} dataKey="value">
            {withConversion.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>

      {/* Stage Details */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {withConversion.map((stage, index) => (
          <div
            key={stage.name}
            onClick={() => onStageClick && onStageClick(stage)}
            className="p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 transition"
          >
            <p className="text-sm font-medium text-gray-700">{stage.name}</p>
            <p className="text-2xl font-bold text-gray-900">{stage.value}</p>
            <p className="text-xs text-gray-600 mt-1">
              ${(stage.amount || 0).toLocaleString('en-US')}
            </p>
            {index < withConversion.length - 1 && stage.conversionRate > 0 && (
              <p className="text-xs text-orange-600 font-medium mt-2">
                {stage.conversionRate.toFixed(0)}% conversion
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
