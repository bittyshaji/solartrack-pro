/**
 * Export Service - PDF and Excel Export Utilities
 * Handles exporting reports to various formats
 * Uses dynamic imports for large libraries (jsPDF, XLSX) to reduce bundle size
 */

import { loadjsPDF, loadXLSX } from './dynamicImports'

/**
 * ==================== PDF EXPORTS ====================
 */

/**
 * Export Project Analytics to PDF
 */
export async function exportProjectAnalyticsPDF(stats, stages, timeline, capacity) {
  try {
    const { jsPDF } = await loadjsPDF()
    const doc = new jsPDF()
    let yPosition = 20

    // Header
    doc.setFontSize(20)
    doc.text('Project Analytics Report', 20, yPosition)
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition + 8)
    doc.setTextColor(0, 0, 0)

    yPosition += 20

    // KPI Summary
    doc.setFontSize(12)
    doc.text('Summary', 20, yPosition)
    yPosition += 8

    const kpiData = [
      ['Metric', 'Value'],
      ['Total Projects', stats.total],
      ['Completed', stats.completed],
      ['In Progress', stats.inProgress],
      ['On Hold', stats.onHold],
      ['Completion Rate', `${Math.round((stats.completed / stats.total) * 100)}%`],
    ]

    doc.autoTable({
      head: [kpiData[0]],
      body: kpiData.slice(1),
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [249, 115, 22] },
      columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 50 } },
    })

    yPosition = doc.lastAutoTable.finalY + 15

    // Stages Table
    if (stages.length > 0) {
      doc.setFontSize(12)
      doc.text('Project Stages', 20, yPosition)
      yPosition += 8

      const stagesData = [['Stage', 'Count'], ...stages.map(s => [s.name, s.count])]

      doc.autoTable({
        head: [stagesData[0]],
        body: stagesData.slice(1),
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] },
      })

      yPosition = doc.lastAutoTable.finalY + 15
    }

    // Capacity Table
    if (capacity.length > 0) {
      doc.setFontSize(12)
      doc.text('Capacity Distribution', 20, yPosition)
      yPosition += 8

      const capacityData = [['Capacity Range', 'Count'], ...capacity.map(c => [c.range, c.count])]

      doc.autoTable({
        head: [capacityData[0]],
        body: capacityData.slice(1),
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] },
      })
    }

    // Save PDF
    doc.save('project-analytics.pdf')
    return { success: true }
  } catch (err) {
    console.error('PDF export error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Export Team Performance to PDF
 */
export async function exportTeamPerformancePDF(productivity, hours, summary) {
  try {
    const { jsPDF } = await loadjsPDF()
    const doc = new jsPDF()
    let yPosition = 20

    // Header
    doc.setFontSize(20)
    doc.text('Team Performance Report', 20, yPosition)
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition + 8)
    doc.setTextColor(0, 0, 0)

    yPosition += 20

    // Summary Stats
    doc.setFontSize(12)
    doc.text('Summary', 20, yPosition)
    yPosition += 8

    const summaryData = [
      ['Metric', 'Value'],
      ['Team Members', productivity.length],
      ['Total Updates', productivity.reduce((sum, p) => sum + p.updatesCount, 0)],
      ['Total Hours', Math.round(productivity.reduce((sum, p) => sum + p.hoursWorked, 0))],
      ['Avg Progress', `${Math.round(productivity.reduce((sum, p) => sum + p.avgProgress, 0) / (productivity.length || 1))}%`],
    ]

    doc.autoTable({
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    })

    yPosition = doc.lastAutoTable.finalY + 15

    // Productivity Table
    if (productivity.length > 0) {
      doc.setFontSize(12)
      doc.text('Worker Productivity', 20, yPosition)
      yPosition += 8

      const productivityData = [
        ['Name', 'Updates', 'Hours', 'Avg %'],
        ...productivity.map(p => [p.name, p.updatesCount, Math.round(p.hoursWorked), p.avgProgress]),
      ]

      doc.autoTable({
        head: [productivityData[0]],
        body: productivityData.slice(1),
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 30, halign: 'center' },
        },
      })
    }

    doc.save('team-performance.pdf')
    return { success: true }
  } catch (err) {
    console.error('PDF export error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Export Financial Dashboard to PDF
 */
export async function exportFinancialDashboardPDF(summary, projectCosts, categories, suppliers) {
  try {
    const { jsPDF } = await loadjsPDF()
    const doc = new jsPDF()
    let yPosition = 20

    // Header
    doc.setFontSize(20)
    doc.text('Financial Report', 20, yPosition)
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition + 8)
    doc.setTextColor(0, 0, 0)

    yPosition += 20

    // Summary
    doc.setFontSize(12)
    doc.text('Financial Summary', 20, yPosition)
    yPosition += 8

    const summaryData = [
      ['Metric', 'Amount'],
      ['Total Material Cost', `₹${summary.totalMaterialCost.toLocaleString()}`],
      ['Total Items', summary.totalMaterialItems],
      ['Projects', summary.totalProjects],
      ['Avg Cost/Project', `₹${summary.avgCostPerProject.toLocaleString()}`],
    ]

    doc.autoTable({
      head: [summaryData[0]],
      body: summaryData.slice(1),
      startY: yPosition,
      theme: 'grid',
      headStyles: { fillColor: [168, 85, 247] },
    })

    yPosition = doc.lastAutoTable.finalY + 15

    // Project Costs
    if (projectCosts.length > 0) {
      doc.setFontSize(12)
      doc.text('Project Costs (Top 10)', 20, yPosition)
      yPosition += 8

      const costsData = [['Project', 'Cost'], ...projectCosts.slice(0, 10).map(c => [c.project, `₹${c.totalCost.toLocaleString()}`])]

      doc.autoTable({
        head: [costsData[0]],
        body: costsData.slice(1),
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [168, 85, 247] },
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 50 } },
      })

      yPosition = doc.lastAutoTable.finalY + 15
    }

    // Categories
    if (categories.length > 0) {
      doc.setFontSize(12)
      doc.text('Material Categories', 20, yPosition)
      yPosition += 8

      const catData = [['Category', 'Items', 'Cost'], ...categories.map(c => [c.name, c.count, `₹${c.totalCost.toLocaleString()}`])]

      doc.autoTable({
        head: [catData[0]],
        body: catData.slice(1),
        startY: yPosition,
        theme: 'grid',
        headStyles: { fillColor: [168, 85, 247] },
      })
    }

    doc.save('financial-report.pdf')
    return { success: true }
  } catch (err) {
    console.error('PDF export error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * ==================== EXCEL EXPORTS ====================
 */

/**
 * Export Project Analytics to Excel
 */
export async function exportProjectAnalyticsExcel(stats, stages, timeline, capacity) {
  try {
    const XLSX = await loadXLSX()
    const workbook = XLSX.utils.book_new()

    // Summary Sheet
    const summaryData = [
      ['Project Analytics Report'],
      ['Generated', new Date().toLocaleDateString()],
      [],
      ['Metric', 'Value'],
      ['Total Projects', stats.total],
      ['Completed', stats.completed],
      ['In Progress', stats.inProgress],
      ['On Hold', stats.onHold],
      ['Completion Rate %', Math.round((stats.completed / stats.total) * 100)],
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

    // Stages Sheet
    if (stages.length > 0) {
      const stagesData = [['Project Stages'], [], ['Stage', 'Count'], ...stages.map(s => [s.name, s.count])]
      const stagesSheet = XLSX.utils.aoa_to_sheet(stagesData)
      XLSX.utils.book_append_sheet(workbook, stagesSheet, 'Stages')
    }

    // Capacity Sheet
    if (capacity.length > 0) {
      const capData = [['Capacity Distribution'], [], ['Range', 'Count'], ...capacity.map(c => [c.range, c.count])]
      const capSheet = XLSX.utils.aoa_to_sheet(capData)
      XLSX.utils.book_append_sheet(workbook, capSheet, 'Capacity')
    }

    // Timeline Sheet
    if (timeline.length > 0) {
      const timeData = [['Project Timeline'], [], ['Project', 'Planned Days', 'Elapsed Days', 'Status'], ...timeline.map(t => [t.name, t.daysPlanned, t.daysElapsed, t.status])]
      const timeSheet = XLSX.utils.aoa_to_sheet(timeData)
      XLSX.utils.book_append_sheet(workbook, timeSheet, 'Timeline')
    }

    XLSX.writeFile(workbook, 'project-analytics.xlsx')
    return { success: true }
  } catch (err) {
    console.error('Excel export error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Export Team Performance to Excel
 */
export async function exportTeamPerformanceExcel(productivity, hours) {
  try {
    const workbook = XLSX.utils.book_new()

    // Summary Sheet
    const summaryData = [
      ['Team Performance Report'],
      ['Generated', new Date().toLocaleDateString()],
      [],
      ['Metric', 'Value'],
      ['Team Members', productivity.length],
      ['Total Updates', productivity.reduce((sum, p) => sum + p.updatesCount, 0)],
      ['Total Hours', Math.round(productivity.reduce((sum, p) => sum + p.hoursWorked, 0))],
      ['Avg Progress %', Math.round(productivity.reduce((sum, p) => sum + p.avgProgress, 0) / (productivity.length || 1))],
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

    // Productivity Sheet
    if (productivity.length > 0) {
      const prodData = [['Worker Productivity'], [], ['Name', 'Updates', 'Hours', 'Avg Progress %'], ...productivity.map(p => [p.name, p.updatesCount, Math.round(p.hoursWorked), p.avgProgress])]
      const prodSheet = XLSX.utils.aoa_to_sheet(prodData)
      XLSX.utils.book_append_sheet(workbook, prodSheet, 'Productivity')
    }

    // Hours Sheet
    if (hours.length > 0) {
      const hoursData = [['Hours by Worker'], [], ['Worker', 'Total Hours'], ...hours.map(h => [h.name, h.totalHours])]
      const hoursSheet = XLSX.utils.aoa_to_sheet(hoursData)
      XLSX.utils.book_append_sheet(workbook, hoursSheet, 'Hours')
    }

    XLSX.writeFile(workbook, 'team-performance.xlsx')
    return { success: true }
  } catch (err) {
    console.error('Excel export error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Export Financial Dashboard to Excel
 */
export async function exportFinancialDashboardExcel(summary, projectCosts, categories, suppliers) {
  try {
    const workbook = XLSX.utils.book_new()

    // Summary Sheet
    const summaryData = [
      ['Financial Report'],
      ['Generated', new Date().toLocaleDateString()],
      [],
      ['Metric', 'Amount (₹)'],
      ['Total Material Cost', summary.totalMaterialCost],
      ['Total Items', summary.totalMaterialItems],
      ['Projects', summary.totalProjects],
      ['Avg Cost Per Project', summary.avgCostPerProject],
    ]
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

    // Project Costs Sheet
    if (projectCosts.length > 0) {
      const costsData = [['Project Costs'], [], ['Project', 'Cost (₹)'], ...projectCosts.map(c => [c.project, c.totalCost])]
      const costsSheet = XLSX.utils.aoa_to_sheet(costsData)
      XLSX.utils.book_append_sheet(workbook, costsSheet, 'ProjectCosts')
    }

    // Categories Sheet
    if (categories.length > 0) {
      const catData = [['Material Categories'], [], ['Category', 'Items', 'Cost (₹)'], ...categories.map(c => [c.name, c.count, c.totalCost])]
      const catSheet = XLSX.utils.aoa_to_sheet(catData)
      XLSX.utils.book_append_sheet(workbook, catSheet, 'Categories')
    }

    // Suppliers Sheet
    if (suppliers.length > 0) {
      const supplierData = [['Supplier Analysis'], [], ['Supplier', 'Items', 'Cost (₹)', 'Avg Cost/Item (₹)'], ...suppliers.map(s => [s.name, s.itemCount, s.totalCost, s.avgCostPerItem])]
      const supplierSheet = XLSX.utils.aoa_to_sheet(supplierData)
      XLSX.utils.book_append_sheet(workbook, supplierSheet, 'Suppliers')
    }

    XLSX.writeFile(workbook, 'financial-report.xlsx')
    return { success: true }
  } catch (err) {
    console.error('Excel export error:', err)
    return { success: false, error: err.message }
  }
}
