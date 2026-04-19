import { useState, useEffect } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Loader2, RefreshCw, AlertCircle, FileText, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getMaterialCostsByProject,
  getMaterialCategoryBreakdown,
  getSupplierAnalysis,
  getFinancialSummary,
} from '../../lib/reportQueries'
import {
  exportFinancialDashboardPDF,
  exportFinancialDashboardExcel,
} from '../../lib/exportService'

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

export default function FinancialDashboard() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [projectCosts, setProjectCosts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [summaryData, costsData, categoriesData, suppliersData] = await Promise.all([
        getFinancialSummary(),
        getMaterialCostsByProject(),
        getMaterialCategoryBreakdown(),
        getSupplierAnalysis(),
      ])

      setSummary(summaryData)
      setProjectCosts(costsData)
      setCategories(categoriesData)
      setSuppliers(suppliersData)
    } catch (err) {
      toast.error('Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  async function handleExportPDF() {
    toast.loading('Exporting to PDF...')
    const result = await exportFinancialDashboardPDF(summary, projectCosts, categories, suppliers)
    toast.dismiss()
    if (result.success) {
      toast.success('PDF downloaded successfully!')
    } else {
      toast.error('Failed to export PDF')
    }
  }

  async function handleExportExcel() {
    toast.loading('Exporting to Excel...')
    const result = await exportFinancialDashboardExcel(summary, projectCosts, categories, suppliers)
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
        <FinanceKPICard
          label="Total Material Cost"
          value={`₹${summary.totalMaterialCost.toLocaleString()}`}
          subtext={`${summary.totalMaterialItems} items`}
          color="bg-blue-100 text-blue-700"
        />
        <FinanceKPICard
          label="Projects"
          value={summary.totalProjects}
          subtext={`Avg ₹${summary.avgCostPerProject.toLocaleString()} per project`}
          color="bg-green-100 text-green-700"
        />
        <FinanceKPICard
          label="Material Items"
          value={summary.totalMaterialItems}
          subtext={`Avg ₹${(summary.totalMaterialCost / (summary.totalMaterialItems || 1)).toLocaleString('en-IN', { maximumFractionDigits: 0 })} per item`}
          color="bg-orange-100 text-orange-700"
        />
        <FinanceKPICard
          label="Avg Cost/Project"
          value={`₹${summary.avgCostPerProject.toLocaleString()}`}
          subtext="Budget per project"
          color="bg-purple-100 text-purple-700"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Costs by Project */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Material Costs by Project (Top 10)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={projectCosts.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="project" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip formatter={value => `₹${value.toLocaleString()}`} />
              <Bar dataKey="totalCost" fill="#f97316" name="Cost" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Material Category Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={categories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, totalCost }) => `${name}: ₹${totalCost}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="totalCost"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip formatter={value => `₹${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Supplier Analysis Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Supplier Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Supplier</th>
                <th className="px-4 py-3 text-center text-gray-600 font-medium">Items</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">Total Cost</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">Avg Cost/Item</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {suppliers.map((supplier, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{supplier.name}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{supplier.itemCount}</td>
                  <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                    ₹{supplier.totalCost.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    ₹{supplier.avgCostPerItem.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Details Table */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Material Categories</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">Category</th>
                <th className="px-4 py-3 text-center text-gray-600 font-medium">Items</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">Total Cost</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((cat, idx) => {
                const percentage = summary.totalMaterialCost > 0 ? ((cat.totalCost / summary.totalMaterialCost) * 100).toFixed(1) : 0
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{cat.count}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                      ₹{cat.totalCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-center w-12 h-8 rounded bg-orange-100 text-orange-700 font-semibold">
                        {percentage}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            ✓ Cost Insights
          </h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Highest cost project: <strong>{projectCosts[0]?.project || 'N/A'}</strong></li>
            <li>• Top category: <strong>{categories[0]?.name || 'N/A'}</strong> (₹{categories[0]?.totalCost.toLocaleString() || '0'})</li>
            <li>• Top supplier: <strong>{suppliers[0]?.name || 'N/A'}</strong> (₹{suppliers[0]?.totalCost.toLocaleString() || '0'})</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            💡 Recommendations
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Monitor projects with high material costs</li>
            <li>• Consider bulk purchasing from top suppliers</li>
            <li>• Review alternative suppliers for cost optimization</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
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

function FinanceKPICard({ label, value, subtext, color }) {
  return (
    <div className={`rounded-lg p-6 ${color}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-2xl font-bold mt-2 break-words">{value}</p>
      <p className="text-xs opacity-75 mt-1">{subtext}</p>
    </div>
  )
}
