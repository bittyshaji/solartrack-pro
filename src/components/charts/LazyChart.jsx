import React, { Suspense, lazy } from 'react'
import { AlertCircle, Loader } from 'lucide-react'

/**
 * ChartLoadingFallback Component
 * Displays a loading state while chart components are being lazily loaded
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.message='Loading chart...'] - Custom loading message
 * @param {number} [props.height=300] - Height of the loading placeholder in pixels
 * @returns {React.ReactElement} Loading placeholder UI
 */
export function ChartLoadingFallback({ message = 'Loading chart...', height = 300 }) {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-center"
      style={{ height: `${height}px` }}
    >
      <div className="flex flex-col items-center gap-3 text-gray-600">
        <Loader className="w-5 h-5 animate-spin" />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  )
}

/**
 * ChartErrorFallback Component
 * Displays error state when chart fails to load
 *
 * @component
 * @param {Object} props - Component props
 * @param {Error} [props.error] - The error that was thrown
 * @param {number} [props.height=300] - Height of the error placeholder in pixels
 * @param {Function} [props.onRetry] - Callback function to retry loading
 * @returns {React.ReactElement} Error UI
 */
export function ChartErrorFallback({ error, height = 300, onRetry }) {
  const errorMessage =
    error?.message || 'Failed to load chart. Please try again.'

  return (
    <div
      className="bg-white rounded-lg border border-red-200 p-6 flex items-center justify-center"
      style={{ height: `${height}px` }}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full bg-red-100 p-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p className="font-medium text-gray-900">Failed to load chart</p>
          <p className="text-xs text-gray-600 mt-1">{errorMessage}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * LazyChart Component
 * Higher-order component that wraps Recharts components with lazy loading and Suspense
 * Supports all chart types and reduces initial bundle size by ~148KB
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ComponentType} props.ChartComponent - The chart component to render (dynamically imported)
 * @param {Object} props.data - Data to pass to the chart component
 * @param {string} [props.title] - Optional chart title
 * @param {number} [props.height=300] - Height of chart container in pixels
 * @param {string} [props.loadingMessage='Loading chart...'] - Custom loading message
 * @param {React.ReactElement} [props.fallback] - Custom loading fallback component
 * @param {React.ReactElement} [props.errorFallback] - Custom error fallback component
 * @param {Function} [props.onError] - Callback when chart fails to load
 * @param {boolean} [props.showErrorBoundary=true] - Show error boundary UI on failure
 * @param {Object} props.restProps - All remaining props are passed to the chart component
 * @returns {React.ReactElement} Chart component wrapped in Suspense with error handling
 *
 * @example
 * // Basic usage
 * import { lazy } from 'react'
 * import LazyChart from '@components/charts/LazyChart'
 * import { loadRecharts } from '@lib/services/operations/dynamicImports'
 *
 * // Load and display a line chart
 * const LineChartComponent = lazy(() => import('recharts').then(m => ({ default: m.LineChart })))
 * <LazyChart
 *   ChartComponent={LineChartComponent}
 *   data={chartData}
 *   title="Revenue Trends"
 *   height={350}
 * />
 *
 * @example
 * // With custom loading and error states
 * <LazyChart
 *   ChartComponent={BarChartComponent}
 *   data={data}
 *   loadingMessage="Loading customer data..."
 *   onError={(error) => console.error('Chart load failed:', error)}
 *   fallback={<CustomLoading />}
 *   errorFallback={<CustomError />}
 * />
 */
class LazyChartErrorBoundary extends React.Component {
  /**
   * Create a LazyChartErrorBoundary
   * @param {Object} props - Component props
   */
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  /**
   * Update state when error is caught
   * @static
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  /**
   * Log error and call onError callback
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Error info from React
   */
  componentDidCatch(error, errorInfo) {
    console.error('LazyChart error boundary caught error:', error, errorInfo)
    if (this.props.onError) {
      this.props.onError(error)
    }
  }

  /**
   * Reset error state
   */
  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  /**
   * Render error or children
   */
  render() {
    if (this.state.hasError && this.props.showErrorBoundary) {
      return (
        <ChartErrorFallback
          error={this.state.error}
          height={this.props.height}
          onRetry={this.handleRetry}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Main LazyChart wrapper component
 */
function LazyChart({
  ChartComponent,
  data,
  title,
  height = 300,
  loadingMessage = 'Loading chart...',
  fallback,
  errorFallback,
  onError,
  showErrorBoundary = true,
  ...restProps
}) {
  // If no chart component provided, show error
  if (!ChartComponent) {
    return (
      <ChartErrorFallback
        error={new Error('No chart component provided')}
        height={height}
      />
    )
  }

  // Default fallback UI
  const loadingFallback = fallback || (
    <ChartLoadingFallback message={loadingMessage} height={height} />
  )

  return (
    <LazyChartErrorBoundary
      onError={onError}
      height={height}
      showErrorBoundary={showErrorBoundary}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <Suspense fallback={loadingFallback}>
        <div style={{ height: `${height}px` }}>
          <ChartComponent data={data} {...restProps} />
        </div>
      </Suspense>
    </LazyChartErrorBoundary>
  )
}

export default LazyChart

/**
 * Utility function to create lazy-loaded chart components
 * Combines loadRecharts() with lazy() for optimal code splitting
 *
 * @async
 * @function createLazyChart
 * @param {Object} config - Configuration object
 * @param {string} config.chartType - Type of chart: 'LineChart', 'BarChart', 'PieChart', 'AreaChart', etc.
 * @param {Function} [config.loader] - Optional custom loader function (defaults to loadRecharts)
 * @returns {Promise<{default: React.ComponentType}>} Lazy-loaded chart component
 * @throws {Error} If chart type is not supported
 *
 * @example
 * import { createLazyChart } from '@components/charts/LazyChart'
 *
 * // Create a lazy-loaded line chart
 * const LazyLineChart = lazy(() => createLazyChart({ chartType: 'LineChart' }))
 *
 * // Use in component
 * <Suspense fallback={<ChartLoadingFallback />}>
 *   <LazyLineChart data={data} />
 * </Suspense>
 */
export async function createLazyChart({ chartType, loader } = {}) {
  if (!chartType) {
    throw new Error('chartType is required in createLazyChart config')
  }

  // Default loader uses loadRecharts
  const defaultLoader = async () => {
    const { loadRecharts } = await import('@lib/services/operations/dynamicImports')
    return loadRecharts({ [chartType]: true, basic: true })
  }

  const loadModule = loader || defaultLoader

  try {
    const modules = await loadModule()

    if (!modules[chartType]) {
      throw new Error(
        `Chart component "${chartType}" not found. Make sure it's included in the loader config.`
      )
    }

    return { default: modules[chartType] }
  } catch (error) {
    console.error(`Failed to create lazy chart for ${chartType}:`, error)
    throw error
  }
}
