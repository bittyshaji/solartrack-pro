import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader } from 'lucide-react'

/**
 * TeamPerformanceChart Component
 * Displays team member performance metrics
 */
export default function TeamPerformanceChart({ data = [], loading = false, onMemberClick }) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Loading team data...</span>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 h-80 flex items-center justify-center">
        <p className="text-gray-600">No team data available</p>
      </div>
    )
  }

  const chartData = (data || []).slice(0, 10).map(member => ({
    name: member.name || `Team Member ${member.id}`,
    completed: member.tasksCompleted || 0,
    assigned: member.tasksAssigned || 0,
    completionRate: member.completionRate || 0,
  }))

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
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
          <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          <Bar dataKey="completed" fill="#22c55e" name="Tasks Completed" radius={[8, 8, 0, 0]} />
          <Bar dataKey="assigned" fill="#f97316" name="Tasks Assigned" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {/* Performance Summary */}
      <div className="mt-6 space-y-2 max-h-48 overflow-y-auto">
        {chartData.map((member, index) => (
          <div
            key={member.name}
            onClick={() => onMemberClick && onMemberClick(member)}
            className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition cursor-pointer"
          >
            <div className="flex justify-between items-center mb-2">
              <p className="font-medium text-gray-900">
                {index + 1}. {member.name}
              </p>
              <span className="text-sm font-semibold text-green-600">
                {member.completionRate.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${member.completionRate}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {member.completed} / {member.assigned} tasks completed
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
