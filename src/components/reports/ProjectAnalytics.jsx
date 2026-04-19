import { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader2, RefreshCw, Download, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getProjectStats,
  getProjectStageDistribution,
  getProjectTimeline,
  getCapacityDistribution,
} from '../../lib/reportQueries'
import {
  exportProjectAnalyticsPDF,
  exportProjectAnalyticsExcel,
} from '../../lib/exportService'

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function ProjectAnalytics() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [stages, setStages] = useState([])
  const [timeline, setTimeline] = useState([])
  const [capacity, setCapacity] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [statsData, stagesData, timelineData, capacityData] = await Promise.all([
        getProjectStats(),
        getProjectStageDistribution(),
        getProjectTimeline(),
        getCapacityDistribution(),
      ])

      setStats(statsData)
      setStages(stagesData)
      setTimeline(timelineData)
      setCapacity(capacityData)
    } catch (err) {
      toast.error('Failed to load project analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  // Calculate completion percentage
  const completionPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  async function handleExportPDF() {
    toast.loading('Exporting to PDF...')
    const result = await exportProjectAnalyticsPDF(stats, stages, timeline, capacity)
    toast.dismiss()
    if (result.success) {
      toast.success('PDF downloaded successfully!')
    } else {
      toast.error('Failed to export PDF')
    }
  }

  async function handleExportExcel() {
    toast.loading('Exporting to Excel...')
    const result = await exportProjectAnalyticsExcel(stats, stages, timeline, capacity)
    toast.dismiss()
    if (result.success) {
      toast.success('Excel file downloaded successfully!')
    } else {
      toast.error('Failed to export Excel')
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Projects"
          value={stats.total}
          subtext={`${stats.completed} completed`}
          color="bg-blue-100 text-blue-700"
        />
        <KPICard
          label="Completion Rate"
          value={`${completionPercent}%`}
          subtext={`${stats.completed} of ${stats.total}`}
          color="bg-green-100 text-green-700"
        />
        <KPICard
          label="Active Projects"
          value={stats.inProgress}
          subtext={`In progress`}
          color="bg-orange-100 text-orange-700"
        />
        <KPICard
          label="On Hold"
          value={stats.onHold}
          subtext={`Requires attention`}
          color="bg-red-100 text-red-700"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Project Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Completed', value: stats.completed },
                  { name: 'Active', value: stats.inProgress },
                  { name: 'On Hold', value: stats.onHold },
                  { name: 'Planning', value: stats.planning },
                ].filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip formatter={value => `${value} projects`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stage Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Project Stage Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" name="Projects" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Capacity Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Capacity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={capacity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" name="Projects" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Project Duration Comparison */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Project Timeline (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeline.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="daysPlanned" fill="#9ca3af" name="Planned" />
              <Bar dataKey="daysElapsed" fill="#f97316" name="Elapsed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>
    </div>
  )
}

function KPICard({ label, value, subtext, color }) {
  return (
    <div className={`rounded-lg p-6 ${color}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-xs opacity-75 mt-1">{subtext}</p>
    </div>
  )
}
