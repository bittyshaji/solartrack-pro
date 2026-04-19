import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import ProjectAnalytics from '../components/reports/ProjectAnalytics'
import TeamPerformance from '../components/reports/TeamPerformance'
import FinancialDashboard from '../components/reports/FinancialDashboard'
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react'

export default function Reports() {
  const { profile } = useAuth()
  const canViewReports = profile?.role === 'admin' || profile?.role === 'manager'

  const [activeTab, setActiveTab] = useState('projects')

  if (!canViewReports) {
    return (
      <Layout title="Reports">
        <div className="flex items-center justify-center h-64 bg-yellow-50 rounded-lg border-2 border-yellow-200">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Access Restricted</h3>
            <p className="text-sm text-gray-600 mt-1">Only admins and managers can view reports</p>
          </div>
        </div>
      </Layout>
    )
  }

  const tabs = [
    { id: 'projects', label: 'Project Analytics', icon: BarChart3 },
    { id: 'team', label: 'Team Performance', icon: Users },
    { id: 'financial', label: 'Financial Dashboard', icon: DollarSign },
  ]

  return (
    <Layout title="Reports & Analytics">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-orange-500" />
            Reports & Analytics
          </h1>
          <div className="text-sm text-gray-600">
            Real-time insights and performance metrics
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'projects' && <ProjectAnalytics />}
          {activeTab === 'team' && <TeamPerformance />}
          {activeTab === 'financial' && <FinancialDashboard />}
        </div>
      </div>
    </Layout>
  )
}
