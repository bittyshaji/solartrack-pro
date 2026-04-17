/**
 * Report Queries Library
 * Fetches aggregated data for reports and analytics dashboards
 */

import { supabase } from './supabase'

/**
 * ==================== PROJECT ANALYTICS ====================
 */

/**
 * Get project completion statistics
 * @returns {Promise<{total, completed, inProgress, onHold, planning}>}
 */
export async function getProjectStats() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('status', { count: 'exact' })

    if (error) throw error

    const stats = {
      total: 0,
      completed: 0,
      inProgress: 0,
      onHold: 0,
      planning: 0,
      cancelled: 0,
    }

    ;(data || []).forEach(p => {
      stats.total++
      const status = p.status?.toLowerCase()
      if (status === 'completed') stats.completed++
      else if (status === 'in progress' || status === 'active') stats.inProgress++
      else if (status === 'on hold') stats.onHold++
      else if (status === 'planning') stats.planning++
      else if (status === 'cancelled') stats.cancelled++
    })

    return stats
  } catch (err) {
    console.error('Project stats error:', err)
    return { total: 0, completed: 0, inProgress: 0, onHold: 0, planning: 0, cancelled: 0 }
  }
}

/**
 * Get project stage distribution
 * @returns {Promise<Array>}
 */
export async function getProjectStageDistribution() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, stage')

    if (error) throw error

    const stageMap = {
      1: 'Site Survey',
      2: 'KSEB Application',
      3: 'Mounting Work',
      4: 'Panel Installation',
      5: 'Wiring & Inverter',
      6: 'Earthing & Safety',
      7: 'KSEB Inspection',
      8: 'Net Meter',
      9: 'Commissioning',
      10: 'Completed',
    }

    const stages = {}
    ;(data || []).forEach(p => {
      const stageName = stageMap[p.stage] || `Stage ${p.stage}`
      stages[stageName] = (stages[stageName] || 0) + 1
    })

    return Object.entries(stages).map(([name, count]) => ({ name, count }))
  } catch (err) {
    console.error('Stage distribution error:', err)
    return []
  }
}

/**
 * Get project timeline data (planned vs actual)
 * @returns {Promise<Array>}
 */
export async function getProjectTimeline() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, start_date, end_date, created_at, status')

    if (error) throw error

    return (data || []).map(p => {
      const planned = p.end_date ? new Date(p.end_date) : null
      const actual = p.created_at ? new Date(p.created_at) : null
      const daysPlanned = planned && p.start_date ? Math.floor((planned - new Date(p.start_date)) / (1000 * 60 * 60 * 24)) : 0
      const daysElapsed = actual ? Math.floor((new Date() - actual) / (1000 * 60 * 60 * 24)) : 0

      return {
        id: p.id,
        name: p.name,
        daysPlanned,
        daysElapsed,
        status: p.status,
        startDate: p.start_date,
        endDate: p.end_date,
      }
    })
  } catch (err) {
    console.error('Timeline data error:', err)
    return []
  }
}

/**
 * Get capacity distribution across projects
 * @returns {Promise<Array>}
 */
export async function getCapacityDistribution() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('capacity_kw')

    if (error) throw error

    const capacityRanges = {
      '1-3 kW': 0,
      '3-7 kW': 0,
      '7-15 kW': 0,
      '15+ kW': 0,
    }

    ;(data || []).forEach(p => {
      const kw = p.capacity_kw || 0
      if (kw <= 3) capacityRanges['1-3 kW']++
      else if (kw <= 7) capacityRanges['3-7 kW']++
      else if (kw <= 15) capacityRanges['7-15 kW']++
      else capacityRanges['15+ kW']++
    })

    return Object.entries(capacityRanges).map(([range, count]) => ({ range, count }))
  } catch (err) {
    console.error('Capacity distribution error:', err)
    return []
  }
}

/**
 * ==================== TEAM PERFORMANCE ====================
 */

/**
 * Get team member productivity stats
 * @returns {Promise<Array>}
 */
export async function getTeamProductivity() {
  try {
    const { data: updates, error } = await supabase
      .from('daily_updates')
      .select('author_id, author_name, date, hours_worked, progress_pct')

    if (error) throw error

    const teamStats = {}

    ;(updates || []).forEach(u => {
      if (!teamStats[u.author_id]) {
        teamStats[u.author_id] = {
          id: u.author_id,
          name: u.author_name || 'Unknown',
          updatesCount: 0,
          hoursWorked: 0,
          avgProgress: 0,
          totalProgress: 0,
        }
      }
      teamStats[u.author_id].updatesCount++
      teamStats[u.author_id].hoursWorked += u.hours_worked || 0
      teamStats[u.author_id].totalProgress += u.progress_pct || 0
    })

    return Object.values(teamStats).map(t => ({
      ...t,
      avgProgress: t.updatesCount > 0 ? Math.round(t.totalProgress / t.updatesCount) : 0,
      avgHoursPerUpdate: t.updatesCount > 0 ? (t.hoursWorked / t.updatesCount).toFixed(1) : 0,
    }))
  } catch (err) {
    console.error('Team productivity error:', err)
    return []
  }
}

/**
 * Get hourly distribution by team member
 * @returns {Promise<Array>}
 */
export async function getTeamHours() {
  try {
    const { data: updates, error } = await supabase
      .from('daily_updates')
      .select('author_name, hours_worked')

    if (error) throw error

    const hours = {}
    ;(updates || []).forEach(u => {
      const name = u.author_name || 'Unknown'
      hours[name] = (hours[name] || 0) + (u.hours_worked || 0)
    })

    return Object.entries(hours)
      .map(([name, totalHours]) => ({ name, totalHours: Math.round(totalHours * 10) / 10 }))
      .sort((a, b) => b.totalHours - a.totalHours)
  } catch (err) {
    console.error('Team hours error:', err)
    return []
  }
}

/**
 * Get daily updates trend over time
 * @param {number} days - Number of days to look back (default 30)
 * @returns {Promise<Array>}
 */
export async function getUpdatesTrend(days = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from('daily_updates')
      .select('date')
      .gte('date', cutoffDate.toISOString().split('T')[0])

    if (error) throw error

    const trend = {}
    ;(data || []).forEach(u => {
      const dateKey = new Date(u.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      trend[dateKey] = (trend[dateKey] || 0) + 1
    })

    return Object.entries(trend).map(([date, count]) => ({ date, count }))
  } catch (err) {
    console.error('Updates trend error:', err)
    return []
  }
}

/**
 * ==================== FINANCIAL ANALYTICS ====================
 */

/**
 * Get material costs breakdown by project
 * @returns {Promise<Array>}
 */
export async function getMaterialCostsByProject() {
  try {
    const { data: materials, error } = await supabase
      .from('materials')
      .select('project_id, name, quantity, unit_cost')

    if (error) throw error

    const { data: projects } = await supabase
      .from('projects')
      .select('id, name')

    const projectMap = Object.fromEntries((projects || []).map(p => [p.id, p.name]))
    const costs = {}

    ;(materials || []).forEach(m => {
      const projectName = projectMap[m.project_id] || `Project ${m.project_id}`
      const materialCost = (m.quantity || 0) * (m.unit_cost || 0)

      if (!costs[projectName]) {
        costs[projectName] = 0
      }
      costs[projectName] += materialCost
    })

    return Object.entries(costs)
      .map(([project, totalCost]) => ({ project, totalCost: Math.round(totalCost * 100) / 100 }))
      .sort((a, b) => b.totalCost - a.totalCost)
  } catch (err) {
    console.error('Material costs error:', err)
    return []
  }
}

/**
 * Get material category breakdown
 * @returns {Promise<Array>}
 */
export async function getMaterialCategoryBreakdown() {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('category, quantity, unit_cost')

    if (error) throw error

    const categories = {}
    ;(data || []).forEach(m => {
      const cat = m.category || 'Other'
      const cost = (m.quantity || 0) * (m.unit_cost || 0)
      if (!categories[cat]) {
        categories[cat] = { count: 0, totalCost: 0 }
      }
      categories[cat].count++
      categories[cat].totalCost += cost
    })

    return Object.entries(categories).map(([name, { count, totalCost }]) => ({
      name,
      count,
      totalCost: Math.round(totalCost * 100) / 100,
    }))
  } catch (err) {
    console.error('Category breakdown error:', err)
    return []
  }
}

/**
 * Get supplier analysis
 * @returns {Promise<Array>}
 */
export async function getSupplierAnalysis() {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('supplier, quantity, unit_cost')

    if (error) throw error

    const suppliers = {}
    ;(data || []).forEach(m => {
      const supplier = m.supplier || 'Unknown'
      const cost = (m.quantity || 0) * (m.unit_cost || 0)
      if (!suppliers[supplier]) {
        suppliers[supplier] = { itemCount: 0, totalCost: 0 }
      }
      suppliers[supplier].itemCount++
      suppliers[supplier].totalCost += cost
    })

    return Object.entries(suppliers)
      .map(([name, { itemCount, totalCost }]) => ({
        name,
        itemCount,
        totalCost: Math.round(totalCost * 100) / 100,
        avgCostPerItem: Math.round((totalCost / itemCount) * 100) / 100,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
  } catch (err) {
    console.error('Supplier analysis error:', err)
    return []
  }
}

/**
 * Get total financial summary
 * @returns {Promise<Object>}
 */
export async function getFinancialSummary() {
  try {
    const { data: materials, error } = await supabase
      .from('materials')
      .select('quantity, unit_cost')

    if (error) throw error

    let totalCost = 0
    let itemCount = 0

    ;(materials || []).forEach(m => {
      totalCost += (m.quantity || 0) * (m.unit_cost || 0)
      itemCount++
    })

    const { data: projects } = await supabase
      .from('projects')
      .select('id', { count: 'exact' })

    return {
      totalMaterialCost: Math.round(totalCost * 100) / 100,
      totalMaterialItems: itemCount,
      totalProjects: projects?.length || 0,
      avgCostPerProject: projects && projects.length > 0 ? Math.round((totalCost / projects.length) * 100) / 100 : 0,
    }
  } catch (err) {
    console.error('Financial summary error:', err)
    return {
      totalMaterialCost: 0,
      totalMaterialItems: 0,
      totalProjects: 0,
      avgCostPerProject: 0,
    }
  }
}
