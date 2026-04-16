import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * AdvancedMetricsCard Component
 * Displays a metric with icon, value, trend, and change percentage
 */
export default function AdvancedMetricsCard({
  title,
  value,
  icon: Icon,
  change = 0,
  trend = 'flat',
  format = 'number',
  color = 'orange',
  loading = false,
  onClick,
}) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600'
    if (trend === 'down') return 'text-red-600'
    return 'text-gray-600'
  }

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const colorClasses = {
    orange: 'border-orange-200 bg-orange-50',
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    red: 'border-red-200 bg-red-50',
    purple: 'border-purple-200 bg-purple-50',
  }

  const iconColorClasses = {
    orange: 'text-orange-500',
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500',
    purple: 'text-purple-500',
  }

  const formatValue = () => {
    if (loading) return '...'

    switch (format) {
      case 'currency':
        return `$${Number(value || 0).toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`
      case 'percentage':
        return `${Number(value || 0).toFixed(1)}%`
      case 'number':
        return Number(value || 0).toLocaleString('en-US')
      default:
        return value
    }
  }

  return (
    <div
      onClick={onClick}
      className={`border-2 rounded-lg p-6 ${colorClasses[color]} ${
        onClick ? 'cursor-pointer hover:shadow-md transition' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        {Icon && <Icon className={`w-5 h-5 ${iconColorClasses[color]}`} />}
      </div>

      <div className="mb-4">
        <p className="text-3xl font-bold text-gray-900">{formatValue()}</p>
      </div>

      {change !== 0 && (
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
          <span className="text-xs text-gray-600">vs previous period</span>
        </div>
      )}

      {change === 0 && trend !== 'flat' && (
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-600 flex items-center gap-1">
            {getTrendIcon()}
            <span>No change</span>
          </div>
        </div>
      )}
    </div>
  )
}
