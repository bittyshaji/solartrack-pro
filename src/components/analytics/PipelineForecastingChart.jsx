import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader } from 'lucide-react'

/**
 * PipelineForecastingChart Component
 * Displays revenue forecast with confidence intervals
 */
export default function PipelineForecastingChart({
  forecast = [],
  historical = [],
  loading = false,
  goal = null,
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading forecast data...</span>
        </div>
      </div>
    )
  }

  if (!forecast || forecast.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <p className="text-gray-600">No forecast data available</p>
      </div>
    )
  }

  // Combine historical and forecast data
  const chartData = [
    ...(historical || []).map(item => ({
      ...item,
      type: 'historical',
    })),
    ...(forecast || []).map(item => ({
      ...item,
      type: 'forecast',
    })),
  ]

  // Calculate confidence interval (simplified: +/- 10%)
  const forecastWithInterval = (forecast || []).map(item => ({
    ...item,
    upper: item.revenue * 1.1,
    lower: Math.max(0, item.revenue * 0.9),
  }))

  // Get max value for goal comparison
  const maxRevenue = Math.max(...chartData.map(item => item.revenue || 0), goal || 0)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Forecast (6 Months)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#fbbc04" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#fbbc04" stopOpacity={0} />
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
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
            formatter={(value) => `$${Number(value).toLocaleString('en-US')}`}
          />
          <Legend />
          {/* Historical data */}
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 4 }}
            name="Historical Revenue"
            data={historical}
          />
          {/* Forecast data with confidence area */}
          <Area
            type="monotone"
            dataKey="upper"
            fill="url(#colorForecast)"
            stroke="#fbbc04"
            fillOpacity={0.3}
            name="Confidence Range"
            data={forecastWithInterval}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="lower"
            fill="url(#colorForecast)"
            stroke="#fbbc04"
            fillOpacity={0.3}
            data={forecastWithInterval}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#fbbc04"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#fbbc04', r: 4 }}
            name="Forecast"
            data={forecastWithInterval}
          />
          {/* Goal line */}
          {goal && (
            <Line
              type="linear"
              dataKey={() => goal}
              stroke="#ef4444"
              strokeDasharray="10 5"
              strokeWidth={2}
              name={`Target Goal ($${(goal / 1000).toFixed(0)}k)`}
              dot={false}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Forecast Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-gray-600 mb-1">Average Forecast</p>
          <p className="text-2xl font-bold text-orange-600">
            ${(
              forecastWithInterval.reduce((sum, item) => sum + item.revenue, 0) /
              forecastWithInterval.length
            ).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-600 mb-1">6-Month Total</p>
          <p className="text-2xl font-bold text-yellow-600">
            ${forecastWithInterval
              .reduce((sum, item) => sum + item.revenue, 0)
              .toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>
        {goal && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">vs. Target Goal</p>
            <p className="text-2xl font-bold text-blue-600">
              {(
                ((forecastWithInterval.reduce((sum, item) => sum + item.revenue, 0) - goal) /
                  goal) *
                100
              ).toFixed(1)}
              %
            </p>
          </div>
        )}
      </div>

      {/* Forecast Details Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-4 font-medium text-gray-700">Month</th>
              <th className="text-right py-2 px-4 font-medium text-gray-700">Forecast</th>
              <th className="text-right py-2 px-4 font-medium text-gray-700">Lower Bound</th>
              <th className="text-right py-2 px-4 font-medium text-gray-700">Upper Bound</th>
            </tr>
          </thead>
          <tbody>
            {forecastWithInterval.slice(0, 6).map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-4 text-gray-900 font-medium">{item.month}</td>
                <td className="text-right py-2 px-4 text-gray-900">
                  ${item.revenue.toLocaleString('en-US')}
                </td>
                <td className="text-right py-2 px-4 text-gray-600">
                  ${item.lower.toLocaleString('en-US')}
                </td>
                <td className="text-right py-2 px-4 text-gray-600">
                  ${item.upper.toLocaleString('en-US')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
