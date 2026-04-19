/**
 * Analytics Service Library
 * Provides advanced analytics and metrics for SolarTrack Pro
 * Includes revenue metrics, project analytics, customer insights, and forecasting
 * Phase 2 Integration: Logger calls for major operations
 */

import { supabase } from './supabase'
import { logger } from './logger'

/**
 * ==================== REVENUE METRICS ====================
 */

/**
 * Get revenue metrics for a date range
 * @param {string} startDate - ISO date string
 * @param {string} endDate - ISO date string
 * @param {string} groupBy - 'daily', 'weekly', 'monthly', 'yearly'
 * @returns {Promise<{data: Array, total: number, average: number, growth: number}>}
 */
export async function getRevenueMetrics(startDate, endDate, groupBy = 'monthly') {
  try {
    logger.info('Fetching revenue metrics', { startDate, endDate, groupBy })

    const { data, error } = await supabase
      .from('project_invoices')
      .select('amount, created_at, payment_status')
      .eq('payment_status', 'Paid')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true })

    if (error) throw error

    if (!data || data.length === 0) {
      logger.info('No revenue data available for period', { startDate, endDate })
      return { data: [], total: 0, average: 0, growth: 0, count: 0 }
    }

    // Group data by period
    const grouped = {}
    data.forEach(invoice => {
      const date = new Date(invoice.created_at)
      let period

      if (groupBy === 'daily') {
        period = date.toISOString().split('T')[0]
      } else if (groupBy === 'weekly') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        period = weekStart.toISOString().split('T')[0]
      } else if (groupBy === 'monthly') {
        period = date.toISOString().substring(0, 7)
      } else if (groupBy === 'yearly') {
        period = date.getFullYear().toString()
      }

      if (!grouped[period]) {
        grouped[period] = { date: period, revenue: 0, count: 0 }
      }
      grouped[period].revenue += invoice.amount || 0
      grouped[period].count += 1
    })

    const groupedData = Object.values(grouped).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    )

    const total = groupedData.reduce((sum, item) => sum + item.revenue, 0)
    const average = groupedData.length > 0 ? total / groupedData.length : 0

    // Calculate growth (% change from first to last period)
    const growth =
      groupedData.length > 1
        ? ((groupedData[groupedData.length - 1].revenue - groupedData[0].revenue) /
            groupedData[0].revenue) *
          100
        : 0

    logger.info('Revenue metrics calculated successfully', { total, average, growth, count: data.length })
    return {
      data: groupedData,
      total,
      average,
      growth,
      count: data.length,
    }
  } catch (err) {
    logger.error('Revenue metrics error', { startDate, endDate, error: err.message })
    return { data: [], total: 0, average: 0, growth: 0, count: 0 }
  }
}

/**
 * ==================== PROJECT METRICS ====================
 */

/**
 * Get project metrics with status breakdown
 * @param {Object} filters - { status, startDate, endDate }
 * @returns {Promise<{total, completed, inProgress, estimates, conversionRate}>}
 */
export async function getProjectMetrics(filters = {}) {
  try {
    logger.info('Fetching project metrics', { filters })
    const { data, error } = await supabase
      .from('projects')
      .select('id, status, workflow_status, created_at')

    if (error) throw error

    if (!data || data.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        estimates: 0,
        conversionRate: 0,
      }
    }

    const metrics = {
      total: data.length,
      completed: 0,
      inProgress: 0,
      estimates: 0,
      negotiation: 0,
      execution: 0,
    }

    data.forEach(p => {
      const status = p.workflow_status?.toLowerCase()
      if (status === 'estimation' || status === 'est') {
        metrics.estimates++
      } else if (status === 'negotiation' || status === 'neg') {
        metrics.negotiation++
      } else if (status === 'execution' || status === 'exe') {
        metrics.execution++
      }

      const projectStatus = p.status?.toLowerCase()
      if (projectStatus === 'completed') {
        metrics.completed++
      } else if (projectStatus === 'in progress' || projectStatus === 'active') {
        metrics.inProgress++
      }
    })

    const conversionRate = metrics.total > 0 ? (metrics.completed / metrics.total) * 100 : 0

    return {
      ...metrics,
      conversionRate,
    }
  } catch (err) {
    console.error('Project metrics error:', err)
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      estimates: 0,
      conversionRate: 0,
    }
  }
}

/**
 * ==================== CUSTOMER INSIGHTS ====================
 */

/**
 * Get customer insights and lifetime value metrics
 * @param {string} customerId - Optional: specific customer ID
 * @returns {Promise<{count, totalSpent, avgValue, ltv, projectCount, topCustomers}>}
 */
export async function getCustomerInsights(customerId = null) {
  try {
    let query = supabase.from('project_invoices').select('customer_id, amount, id')

    if (customerId) {
      query = query.eq('customer_id', customerId)
    }

    const { data: invoices, error } = await query

    if (error) throw error

    if (!invoices || invoices.length === 0) {
      return {
        count: 0,
        totalSpent: 0,
        avgValue: 0,
        ltv: 0,
        projectCount: 0,
        topCustomers: [],
      }
    }

    // Get unique customers
    const customers = {}
    invoices.forEach(inv => {
      const customerId = inv.customer_id
      if (!customers[customerId]) {
        customers[customerId] = { id: customerId, totalSpent: 0, invoiceCount: 0 }
      }
      customers[customerId].totalSpent += inv.amount || 0
      customers[customerId].invoiceCount += 1
    })

    const customerList = Object.values(customers)
    const totalSpent = customerList.reduce((sum, c) => sum + c.totalSpent, 0)

    // Get project count per customer
    const { data: projects } = await supabase
      .from('projects')
      .select('customer_id')

    const projectsPerCustomer = {}
    if (projects) {
      projects.forEach(p => {
        projectsPerCustomer[p.customer_id] = (projectsPerCustomer[p.customer_id] || 0) + 1
      })
    }

    // Calculate LTV and averages
    customerList.forEach(c => {
      c.projectCount = projectsPerCustomer[c.id] || 0
    })

    const count = customerList.length
    const avgValue = count > 0 ? totalSpent / count : 0

    // LTV = average value * average number of projects per customer
    const avgProjects = customerList.reduce((sum, c) => sum + c.projectCount, 0) / (count || 1)
    const ltv = avgValue * (avgProjects || 1)

    return {
      count,
      totalSpent,
      avgValue,
      ltv,
      projectCount: customerList.reduce((sum, c) => sum + c.projectCount, 0),
      topCustomers: customerList.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10),
    }
  } catch (err) {
    console.error('Customer insights error:', err)
    return {
      count: 0,
      totalSpent: 0,
      avgValue: 0,
      ltv: 0,
      projectCount: 0,
      topCustomers: [],
    }
  }
}

/**
 * ==================== CONVERSION RATES ====================
 */

/**
 * Get conversion rates between project stages
 * @param {string} period - 'daily', 'weekly', 'monthly', 'all'
 * @returns {Promise<{estToNeg: number, negToExe: number, exeToPaid: number}>}
 */
export async function getConversionRates(period = 'monthly') {
  try {
    // Get all projects with workflow status
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, workflow_status, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (!projects || projects.length === 0) {
      return { estToNeg: 0, negToExe: 0, exeToPaid: 0 }
    }

    // Count projects at each stage
    const stages = {
      est: 0,
      neg: 0,
      exe: 0,
      paid: 0,
    }

    projects.forEach(p => {
      const status = p.workflow_status?.toLowerCase()
      if (status?.includes('est')) stages.est++
      else if (status?.includes('neg')) stages.neg++
      else if (status?.includes('exe')) stages.exe++

      // Check if paid (has paid invoice)
    })

    // Get paid projects count
    const { data: paidInvoices } = await supabase
      .from('project_invoices')
      .select('project_id')
      .eq('payment_status', 'Paid')

    const paidProjectIds = new Set(paidInvoices?.map(i => i.project_id) || [])
    stages.paid = paidProjectIds.size

    // Calculate conversion rates
    const estToNeg = stages.est > 0 ? (stages.neg / stages.est) * 100 : 0
    const negToExe = stages.neg > 0 ? (stages.exe / stages.neg) * 100 : 0
    const exeToPaid = stages.exe > 0 ? (stages.paid / stages.exe) * 100 : 0

    return {
      estToNeg: Math.round(estToNeg),
      negToExe: Math.round(negToExe),
      exeToPaid: Math.round(exeToPaid),
      stageCounts: stages,
    }
  } catch (err) {
    console.error('Conversion rates error:', err)
    return { estToNeg: 0, negToExe: 0, exeToPaid: 0 }
  }
}

/**
 * ==================== TEAM PERFORMANCE ====================
 */

/**
 * Get team member performance metrics
 * @param {string} teamMemberId - Optional: specific team member ID
 * @returns {Promise<{tasksCompleted, onTimePercentage, avgCompletionTime, teamMembers}>}
 */
export async function getTeamPerformance(teamMemberId = null) {
  try {
    // Get project updates (tasks)
    let query = supabase
      .from('project_updates')
      .select('id, assigned_to, status, created_at, updated_at')

    if (teamMemberId) {
      query = query.eq('assigned_to', teamMemberId)
    }

    const { data: updates, error } = await query

    if (error) throw error

    if (!updates || updates.length === 0) {
      return {
        tasksCompleted: 0,
        onTimePercentage: 0,
        avgCompletionTime: 0,
        teamMembers: [],
      }
    }

    // Aggregate by team member
    const teamMembers = {}

    updates.forEach(update => {
      const memberId = update.assigned_to
      if (!teamMembers[memberId]) {
        teamMembers[memberId] = {
          id: memberId,
          tasksCompleted: 0,
          tasksAssigned: 0,
          onTimeCount: 0,
          totalCompletionTime: 0,
        }
      }

      teamMembers[memberId].tasksAssigned += 1

      if (update.status === 'completed') {
        teamMembers[memberId].tasksCompleted += 1

        // Calculate completion time
        const createdDate = new Date(update.created_at)
        const updatedDate = new Date(update.updated_at)
        const daysToComplete = Math.floor((updatedDate - createdDate) / (1000 * 60 * 60 * 24))
        teamMembers[memberId].totalCompletionTime += daysToComplete
      }
    })

    // Calculate metrics
    const members = Object.values(teamMembers).map(m => ({
      ...m,
      completionRate: m.tasksAssigned > 0 ? (m.tasksCompleted / m.tasksAssigned) * 100 : 0,
      avgCompletionTime:
        m.tasksCompleted > 0 ? Math.round(m.totalCompletionTime / m.tasksCompleted) : 0,
    }))

    const totalCompleted = members.reduce((sum, m) => sum + m.tasksCompleted, 0)
    const totalAssigned = members.reduce((sum, m) => sum + m.tasksAssigned, 0)
    const avgCompletionTime =
      totalCompleted > 0
        ? Math.round(members.reduce((sum, m) => sum + m.totalCompletionTime, 0) / totalCompleted)
        : 0

    return {
      tasksCompleted: totalCompleted,
      onTimePercentage: totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0,
      avgCompletionTime,
      teamMembers: members.sort((a, b) => b.tasksCompleted - a.tasksCompleted),
    }
  } catch (err) {
    console.error('Team performance error:', err)
    return {
      tasksCompleted: 0,
      onTimePercentage: 0,
      avgCompletionTime: 0,
      teamMembers: [],
    }
  }
}

/**
 * ==================== PIPELINE DATA ====================
 */

/**
 * Get pipeline funnel data showing project progression
 * @returns {Promise<Array>}
 */
export async function getPipelineData() {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, workflow_status, estimated_value')

    if (error) throw error

    if (!projects || projects.length === 0) {
      return []
    }

    // Count and sum value by stage
    const stages = {
      Est: { count: 0, value: 0, percentage: 0 },
      Neg: { count: 0, value: 0, percentage: 0 },
      Exe: { count: 0, value: 0, percentage: 0 },
      Paid: { count: 0, value: 0, percentage: 0 },
    }

    projects.forEach(p => {
      const status = p.workflow_status?.toLowerCase() || ''
      const value = p.estimated_value || 0

      if (status.includes('est')) {
        stages.Est.count++
        stages.Est.value += value
      } else if (status.includes('neg')) {
        stages.Neg.count++
        stages.Neg.value += value
      } else if (status.includes('exe')) {
        stages.Exe.count++
        stages.Exe.value += value
      }
    })

    // Get paid invoices
    const { data: paidInvoices } = await supabase
      .from('project_invoices')
      .select('amount')
      .eq('payment_status', 'Paid')

    if (paidInvoices) {
      stages.Paid.count = paidInvoices.length
      stages.Paid.value = paidInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0)
    }

    // Calculate percentages
    const totalCount = projects.length
    Object.keys(stages).forEach(stage => {
      stages[stage].percentage = totalCount > 0 ? (stages[stage].count / totalCount) * 100 : 0
    })

    // Format for funnel chart
    return [
      { name: 'Estimation', value: stages.Est.count, amount: stages.Est.value },
      { name: 'Negotiation', value: stages.Neg.count, amount: stages.Neg.value },
      { name: 'Execution', value: stages.Exe.count, amount: stages.Exe.value },
      { name: 'Paid', value: stages.Paid.count, amount: stages.Paid.value },
    ]
  } catch (err) {
    console.error('Pipeline data error:', err)
    return []
  }
}

/**
 * ==================== FORECASTING ====================
 */

/**
 * Get revenue forecast using simple linear regression
 * @param {number} months - Number of months to forecast
 * @returns {Promise<Array>}
 */
export async function getRevenueForecast(months = 6) {
  try {
    // Get last 12 months of revenue data
    const today = new Date()
    const thirteenMonthsAgo = new Date(today)
    thirteenMonthsAgo.setMonth(today.getMonth() - 13)

    const { data: invoices, error } = await supabase
      .from('project_invoices')
      .select('amount, created_at')
      .eq('payment_status', 'Paid')
      .gte('created_at', thirteenMonthsAgo.toISOString())
      .order('created_at', { ascending: true })

    if (error) throw error

    if (!invoices || invoices.length === 0) {
      return []
    }

    // Group by month
    const monthlyData = {}
    invoices.forEach(inv => {
      const date = new Date(inv.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (inv.amount || 0)
    })

    const sortedMonths = Object.keys(monthlyData).sort()
    const values = sortedMonths.map(m => monthlyData[m])

    if (values.length < 2) {
      return []
    }

    // Simple linear regression
    const n = values.length
    const x = Array.from({ length: n }, (_, i) => i)
    const y = values

    const xMean = x.reduce((a, b) => a + b) / n
    const yMean = y.reduce((a, b) => a + b) / n

    const slope =
      x.reduce((sum, xi, i) => sum + (xi - xMean) * (y[i] - yMean), 0) /
      x.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0)

    const intercept = yMean - slope * xMean

    // Generate forecast
    const forecast = []
    const lastDate = new Date(sortedMonths[sortedMonths.length - 1])

    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(lastDate)
      forecastDate.setMonth(forecastDate.getMonth() + i)
      const monthKey = `${forecastDate.getFullYear()}-${String(
        forecastDate.getMonth() + 1
      ).padStart(2, '0')}`

      const predictedValue = Math.max(0, slope * (n + i - 1) + intercept)

      forecast.push({
        month: monthKey,
        revenue: Math.round(predictedValue),
        isForecasted: true,
      })
    }

    return forecast
  } catch (err) {
    console.error('Revenue forecast error:', err)
    return []
  }
}

/**
 * ==================== CUSTOMER SEGMENTATION ====================
 */

/**
 * Segment customers by value
 * @returns {Promise<{highValue, mediumValue, lowValue}>}
 */
export async function getCustomerSegmentation() {
  try {
    const { data: invoices, error } = await supabase
      .from('project_invoices')
      .select('customer_id, amount')

    if (error) throw error

    if (!invoices || invoices.length === 0) {
      return { highValue: [], mediumValue: [], lowValue: [] }
    }

    // Calculate total spent per customer
    const customers = {}
    invoices.forEach(inv => {
      const customerId = inv.customer_id
      if (!customers[customerId]) {
        customers[customerId] = { id: customerId, totalSpent: 0 }
      }
      customers[customerId].totalSpent += inv.amount || 0
    })

    const customerList = Object.values(customers)
    const values = customerList.map(c => c.totalSpent).sort((a, b) => b - a)

    // Segment into thirds
    const thirdPoint = Math.ceil(customerList.length / 3)
    const twoThirdPoint = Math.ceil((customerList.length * 2) / 3)

    const highValue = customerList
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, thirdPoint)
    const mediumValue = customerList
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(thirdPoint, twoThirdPoint)
    const lowValue = customerList
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(twoThirdPoint)

    return { highValue, mediumValue, lowValue }
  } catch (err) {
    console.error('Customer segmentation error:', err)
    return { highValue: [], mediumValue: [], lowValue: [] }
  }
}

/**
 * ==================== MONTHLY TRENDS ====================
 */

/**
 * Get monthly trends for specified metric
 * @param {string} metric - 'revenue', 'projects', 'customers'
 * @returns {Promise<Array>}
 */
export async function getMonthlyTrends(metric = 'revenue') {
  try {
    const today = new Date()
    const twelveMonthsAgo = new Date(today)
    twelveMonthsAgo.setMonth(today.getMonth() - 12)

    let data = []

    if (metric === 'revenue') {
      const { data: invoices, error } = await supabase
        .from('project_invoices')
        .select('amount, created_at')
        .eq('payment_status', 'Paid')
        .gte('created_at', twelveMonthsAgo.toISOString())

      if (error) throw error

      const monthlyRevenue = {}
      if (invoices) {
        invoices.forEach(inv => {
          const date = new Date(inv.created_at)
          const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
          monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (inv.amount || 0)
        })
      }

      data = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        month,
        value: Math.round(revenue),
      }))
    } else if (metric === 'projects') {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('created_at')
        .gte('created_at', twelveMonthsAgo.toISOString())

      if (error) throw error

      const monthlyProjects = {}
      if (projects) {
        projects.forEach(p => {
          const date = new Date(p.created_at)
          const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
          monthlyProjects[monthKey] = (monthlyProjects[monthKey] || 0) + 1
        })
      }

      data = Object.entries(monthlyProjects).map(([month, count]) => ({
        month,
        value: count,
      }))
    } else if (metric === 'customers') {
      const { data: invoices, error } = await supabase
        .from('project_invoices')
        .select('customer_id, created_at')
        .gte('created_at', twelveMonthsAgo.toISOString())

      if (error) throw error

      const monthlyCustomers = {}
      if (invoices) {
        invoices.forEach(inv => {
          const date = new Date(inv.created_at)
          const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
          if (!monthlyCustomers[monthKey]) monthlyCustomers[monthKey] = new Set()
          monthlyCustomers[monthKey].add(inv.customer_id)
        })
      }

      data = Object.entries(monthlyCustomers).map(([month, customers]) => ({
        month,
        value: customers.size,
      }))
    }

    return data
  } catch (err) {
    console.error('Monthly trends error:', err)
    return []
  }
}

/**
 * ==================== TOP CUSTOMERS ====================
 */

/**
 * Get top customers ranked by total spent
 * @param {number} limit - Number of top customers to return
 * @returns {Promise<Array>}
 */
export async function getTopCustomers(limit = 10) {
  try {
    const { data: invoices, error } = await supabase
      .from('project_invoices')
      .select('customer_id, amount')

    if (error) throw error

    if (!invoices || invoices.length === 0) {
      return []
    }

    // Aggregate by customer
    const customers = {}
    invoices.forEach(inv => {
      const customerId = inv.customer_id
      if (!customers[customerId]) {
        customers[customerId] = { id: customerId, totalSpent: 0, invoiceCount: 0 }
      }
      customers[customerId].totalSpent += inv.amount || 0
      customers[customerId].invoiceCount += 1
    })

    // Get customer names and project count
    const { data: projects } = await supabase.from('projects').select('customer_id, customer_name')

    const customerMap = {}
    if (projects) {
      projects.forEach(p => {
        if (!customerMap[p.customer_id]) {
          customerMap[p.customer_id] = p.customer_name || 'Unknown'
        }
      })
    }

    const topCustomers = Object.values(customers)
      .map(c => ({
        customerId: c.id,
        name: customerMap[c.id] || 'Unknown',
        totalSpent: Math.round(c.totalSpent),
        projectCount: c.invoiceCount,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit)

    return topCustomers
  } catch (err) {
    console.error('Top customers error:', err)
    return []
  }
}

/**
 * ==================== CACHING FUNCTIONS ====================
 */

/**
 * Cache analytics metrics in database
 * @param {string} cacheKey - Unique cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default 3600)
 * @returns {Promise<boolean>}
 */
export async function cacheAnalyticsMetrics(cacheKey, data, ttl = 3600) {
  try {
    const expiresAt = new Date(Date.now() + ttl * 1000)

    const { error } = await supabase.from('analytics_cache').upsert(
      {
        cache_key: cacheKey,
        data: JSON.stringify(data),
        expires_at: expiresAt,
        created_at: new Date(),
      },
      { onConflict: 'cache_key' }
    )

    if (error) throw error
    return true
  } catch (err) {
    console.error('Cache error:', err)
    return false
  }
}

/**
 * Get cached analytics data
 * @param {string} cacheKey - Cache key to retrieve
 * @returns {Promise<any|null>}
 */
export async function getFromCache(cacheKey) {
  try {
    const { data, error } = await supabase
      .from('analytics_cache')
      .select('data, expires_at')
      .eq('cache_key', cacheKey)
      .single()

    if (error || !data) return null

    // Check expiration
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      // Cache expired, delete it
      await supabase.from('analytics_cache').delete().eq('cache_key', cacheKey)
      return null
    }

    return JSON.parse(data.data)
  } catch (err) {
    console.error('Get from cache error:', err)
    return null
  }
}

/**
 * Invalidate analytics cache
 * @param {string} pattern - Cache key pattern ('*' for all, 'revenue_*' for specific)
 * @returns {Promise<boolean>}
 */
export async function invalidateAnalyticsCache(pattern = '*') {
  try {
    if (pattern === '*') {
      const { error } = await supabase.from('analytics_cache').delete().gte('created_at', '1900-01-01')
      if (error) throw error
    } else {
      // Simple pattern matching for keys like 'revenue_*'
      const prefix = pattern.replace('*', '')
      const { data: cacheEntries } = await supabase
        .from('analytics_cache')
        .select('cache_key')

      if (cacheEntries) {
        const keysToDelete = cacheEntries
          .filter(entry => entry.cache_key.startsWith(prefix))
          .map(entry => entry.cache_key)

        for (const key of keysToDelete) {
          await supabase.from('analytics_cache').delete().eq('cache_key', key)
        }
      }
    }
    return true
  } catch (err) {
    console.error('Cache invalidation error:', err)
    return false
  }
}

/**
 * Clean up expired cache entries
 * @returns {Promise<boolean>}
 */
export async function cleanupExpiredCache() {
  try {
    const now = new Date()
    const { error } = await supabase
      .from('analytics_cache')
      .delete()
      .lt('expires_at', now.toISOString())

    if (error) throw error
    return true
  } catch (err) {
    console.error('Cache cleanup error:', err)
    return false
  }
}
