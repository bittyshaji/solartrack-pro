import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  RefreshCw,
  Download,
  Settings,
  LogOut,
  Home,
} from 'lucide-react'
import toast from 'react-hot-toast'

import DateRangeSelector from '../components/analytics/DateRangeSelector'
import AdvancedMetricsCard from '../components/analytics/AdvancedMetricsCard'
import RevenueChart from '../components/analytics/RevenueChart'
import ProjectCompletionFunnel from '../components/analytics/ProjectCompletionFunnel'
import CustomerLifetimeValue from '../components/analytics/CustomerLifetimeValue'
import CustomerSegmentationChart from '../components/analytics/CustomerSegmentationChart'
import MonthlyTrendsChart from '../components/analytics/MonthlyTrendsChart'

import * as analyticsService from '../lib/analyticsService'

export default function AdvancedAnalyticsDashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  // State Management
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3))
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  // KPI Data
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [revenueChange, setRevenueChange] = useState(0)
  const [conversionRate, setConversionRate] = useState(0)
  const [customerLTV, setCustomerLTV] = useState(0)
  const [pipelineValue, setPipelineValue] = useState(0)

  // Chart Data
  const [revenueData, setRevenueData] = useState([])
  const [forecastData, setForecastData] = useState([])
  const [pipelineData, setPipelineData] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [monthlyTrends, setMonthlyTrends] = useState([])
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [customerSegmentation, setCustomerSegmentation] = useState({
    highValue: [],
    mediumValue: [],
    lowValue: [],
  })

  // Filter State
  const [statusFilter, setStatusFilter] = useState('all')
  const [exportFormat, setExportFormat] = useState('csv')

  // Load Dashboard Data
  const loadDashboard = async () => {
    try {
      setLoading(true)

      // Load KPI metrics
      const [
        revenueMetrics,
        projectMetrics,
        customerInsights,
        conversionRates,
        pipelineData,
        forecast,
        topCustomersData,
        trends,
        segmentation,
      ] = await Promise.all([
        analyticsService.getRevenueMetrics(dateRange.startDate, dateRange.endDate, 'monthly'),
        analyticsService.getProjectMetrics(),
        analyticsService.getCustomerInsights(),
        analyticsService.getConversionRates(),
        analyticsService.getPipelineData(),
        analyticsService.getRevenueForecast(6),
        analyticsService.getTopCustomers(10),
        analyticsService.getMonthlyTrends(selectedMetric),
        analyticsService.getCustomerSegmentation(),
      ])

      // Set KPI data
      setTotalRevenue(revenueMetrics.total)
      setRevenueChange(revenueMetrics.growth)
      setConversionRate(conversionRates.exeToPaid)
      setCustomerLTV(customerInsights.ltv)
      setPipelineValue(pipelineData.reduce((sum, stage) => sum + stage.amount, 0))

      // Set chart data
      setRevenueData(revenueMetrics.data)
      setForecastData(forecast)
      setPipelineData(pipelineData)
      setTopCustomers(topCustomersData)
      setMonthlyTrends(trends)
      setCustomerSegmentation(segmentation)

      toast.success('Dashboard refreshed')
    } catch (err) {
      console.error('Dashboard error:', err)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Initial Load
  useEffect(() => {
    loadDashboard()
  }, [dateRange, selectedMetric])

  // Handle Logout
  const handleLogout = async () => {
    const { error } = await signOut()
    if (!error) {
      toast.success('Logged out successfully')
      navigate('/login')
    } else {
      toast.error('Logout failed')
    }
  }

  // Export Data
  const handleExport = async () => {
    try {
      const data = {
        dateRange,
        kpis: {
          totalRevenue,
          revenueChange,
          conversionRate,
          customerLTV,
          pipelineValue,
        },
        charts: {
          revenue: revenueData,
          forecast: forecastData,
          pipeline: pipelineData,
          customers: topCustomers,
          trends: monthlyTrends,
        },
      }

      if (exportFormat === 'csv') {
        // Simple CSV export
        const csv = convertToCSV(data)
        downloadFile(csv, 'analytics-export.csv', 'text/csv')
      } else {
        // JSON export
        downloadFile(JSON.stringify(data, null, 2), 'analytics-export.json', 'application/json')
      }

      toast.success(`Exported as ${exportFormat.toUpperCase()}`)
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Export failed')
    }
  }

  const convertToCSV = (data) => {
    let csv = 'Analytics Export Report\n\n'
    csv += `Generated: ${new Date().toLocaleString()}\n`
    csv += `Period: ${data.dateRange.startDate} to ${data.dateRange.endDate}\n\n`
    csv += 'KPI Metrics\n'
    csv += `Total Revenue,${data.kpis.totalRevenue}\n`
    csv += `Revenue Change %,${data.kpis.revenueChange}\n`
    csv += `Conversion Rate %,${data.kpis.conversionRate}\n`
    csv += `Customer LTV,${data.kpis.customerLTV}\n`
    csv += `Pipeline Value,${data.kpis.pipelineValue}\n`
    return csv
  }

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const getTrendIndicator = (value) => {
    if (value > 0) return 'up'
    if (value < 0) return 'down'
    return 'flat'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600">Advanced Business Insights</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Go to home"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {user?.email || 'User'}
          </h2>
          <p className="text-gray-600">
            Track key business metrics and insights across your solar installation business.
          </p>
        </div>

        {/* Date Range Selector & Controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <DateRangeSelector
            onSelect={setDateRange}
            initialStartDate={dateRange.startDate}
            initialEndDate={dateRange.endDate}
          />

          {/* Filter and Export Controls */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">All Statuses</option>
                <option value="est">Estimation</option>
                <option value="neg">Negotiation</option>
                <option value="exe">Execution</option>
              </select>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Export Format
                </label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition h-fit"
              >
                <Download className="w-5 h-5" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdvancedMetricsCard
            title="Total Revenue"
            value={totalRevenue}
            icon={DollarSign}
            change={revenueChange}
            trend={getTrendIndicator(revenueChange)}
            format="currency"
            color="orange"
            loading={loading}
          />
          <AdvancedMetricsCard
            title="Conversion Rate"
            value={conversionRate}
            icon={TrendingUp}
            change={0}
            format="percentage"
            color="blue"
            loading={loading}
          />
          <AdvancedMetricsCard
            title="Customer LTV"
            value={customerLTV}
            icon={Users}
            change={0}
            format="currency"
            color="green"
            loading={loading}
          />
          <AdvancedMetricsCard
            title="Pipeline Value"
            value={pipelineValue}
            icon={BarChart3}
            change={0}
            format="currency"
            color="purple"
            loading={loading}
          />
        </div>

        {/* Charts Grid - Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RevenueChart data={revenueData} forecast={forecastData} loading={loading} />
          <ProjectCompletionFunnel data={pipelineData} loading={loading} />
        </div>

        {/* Charts Grid - Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <CustomerLifetimeValue data={topCustomers} loading={loading} />
          <CustomerSegmentationChart
            highValue={customerSegmentation.highValue}
            mediumValue={customerSegmentation.mediumValue}
            lowValue={customerSegmentation.lowValue}
            loading={loading}
          />
        </div>

        {/* Monthly Trends */}
        <div className="mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Metric for Trends</h3>
            <div className="flex flex-wrap gap-3">
              {['revenue', 'projects', 'customers'].map(metric => (
                <button
                  key={metric}
                  onClick={() => setSelectedMetric(metric)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    selectedMetric === metric
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {metric.charAt(0).toUpperCase() + metric.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <MonthlyTrendsChart data={monthlyTrends} metric={selectedMetric} loading={loading} />
        </div>

        {/* Detailed Metrics Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Metrics Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Metric</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Value</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900 font-medium">Total Revenue</td>
                  <td className="text-right py-3 px-4 text-gray-900">
                    ${totalRevenue.toLocaleString('en-US')}
                  </td>
                  <td
                    className={`text-right py-3 px-4 font-medium ${
                      revenueChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                  </td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900 font-medium">Conversion Rate</td>
                  <td className="text-right py-3 px-4 text-gray-900">{conversionRate.toFixed(1)}%</td>
                  <td className="text-right py-3 px-4 text-gray-600">-</td>
                </tr>
                <tr className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900 font-medium">Customer LTV</td>
                  <td className="text-right py-3 px-4 text-gray-900">
                    ${customerLTV.toLocaleString('en-US')}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-600">-</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-900 font-medium">Pipeline Value</td>
                  <td className="text-right py-3 px-4 text-gray-900">
                    ${pipelineValue.toLocaleString('en-US')}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-600">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-gray-100 rounded-lg border border-gray-300 p-6 text-center text-gray-700">
          <p className="text-sm">
            Last updated: {new Date().toLocaleString()} | Data period:{' '}
            <strong>
              {dateRange.startDate} to {dateRange.endDate}
            </strong>
          </p>
        </div>
      </main>
    </div>
  )
}
