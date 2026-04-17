import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader2, RefreshCw, TrendingUp, FileText, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { getTeamProductivity, getTeamHours, getUpdatesTrend } from '../../lib/reportQueries'
import {
  exportTeamPerformancePDF,
  exportTeamPerformanceExcel,
} from '../../lib/exportService'

export default function TeamPerformance() {
  const [loading, setLoading] = useState(true)
  const [productivity, setProductivity] = useState([])
  const [hours, setHours] = useState([])
  const [trend, setTrend] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [productivityData, hoursData, trendData] = await Promise.all([
        getTeamProductivity(),
        getTeamHours(),
        getUpdatesTrend(30),
      ])

      setProductivity(productivityData)
      setHours(hoursData)
      setTrend(trendData)
    } catch (err) {
      toast.error('Failed to load team performance data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  // Calculate team metrics
  const totalUpdates = productivity.reduce((sum, p) => sum + p.updatesCount, 0)
  const totalHours = productivity.reduce((sum, p) => sum + p.hoursWorked, 0)
  const avgProgressAll = productivity.length > 0 ? Math.round(productivity.reduce((sum, p) => sum + p.avgProgress, 0) / productivity.length) : 0

  const summary = {
    totalUpdates,
    totalHours,
    avgProgressAll,
    teamMembers: productivity.length,
  }

  async function handleExportPDF() {
    toast.loading('Exporting to PDF...')
    const result = await exportTeamPerformancePDF(productivity, hours, summary)
    toast.dismiss()
    if (result.success) {
      toast.success('PDF downloaded successfully!')
    } else {
      toast.error('Failed to export PDF')
    }
  }

  async function handleExportExcel() {
    toast.loading('Exporting to Excel...')
    const result = await exportTeamPerformanceExcel(productivity, hours)
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
          label="Team Members"
          value={productivity.length}
          subtext="Active workers"
          color="bg-blue-100 text-blue-700"
        />
        <KPICard
          label="Total Updates"
          value={totalUpdates}
          subtext="Daily reports"
          color="bg-orange-100 text-orange-700"
        />
        <KPICard
          label="Total Hours"
          value={Math.round(totalHours)}
          subtext={`Avg ${(totalHours / (productivity.length || 1)).toFixed(1)} per member`}
          color="bg-green-100 text-green-700"
        />
        <KPICard
          label="Avg Progress"
          value={`${avgProgressAll}%`}
          subtext="Overall completion"
          color="bg-purple-100 text-purple-700"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Productivity Table */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Worker Productivity</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-600 font-medium">Name</th>
                  <th className="px-4 py-2 text-center text-gray-600 font-medium">Updates</th>
                  <th className="px-4 py-2 text-center text-gray-600 font-medium">Hours</th>
                  <th className="px-4 py-2 text-center text-gray-600 font-medium">Avg %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {productivity.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{p.updatesCount}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{Math.round(p.hoursWorked)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-semibold">
                        {p.avgProgress}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Hours by Team Member */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Hours Logged by Worker</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hours} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="totalHours" fill="#3b82f6" name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Updates Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            Daily Updates Trend (Last 30 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 4 }}
                activeDot={{ r: 6 }}
                name="Daily Updates"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Team Insights</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Most productive team member: <strong>{productivity[0]?.name || 'N/A'}</strong> with {productivity[0]?.updatesCount} updates</li>
          <li>✓ Average productivity: <strong>{avgProgressAll}%</strong> project completion</li>
          <li>✓ Total team hours this month: <strong>{Math.round(totalHours)} hours</strong></li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
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
