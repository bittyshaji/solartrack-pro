/**
 * Proposal Download Service
 * Generate and download project proposals as PDF with professional formatting
 */

import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

/**
 * Professional manual table creation with proper formatting
 */
function createProfessionalTable(doc, selectedStageIds, stages, grandTotal, margin, startY, pageWidth, pageHeight) {
  const cellHeight = 7
  let yPos = startY
  const tableStartX = margin
  const tableWidth = pageWidth - 2 * margin

  // ─── TABLE HEADER ───
  doc.setFillColor(59, 130, 246)
  doc.setTextColor(255, 255, 255)
  doc.setFont(undefined, 'bold')
  doc.setFontSize(10)

  // Draw header background
  doc.rect(tableStartX, yPos, tableWidth, cellHeight, 'F')

  // Header text with proper alignment
  doc.text('Description', tableStartX + 3, yPos + 5)
  doc.text('Qty', tableStartX + 115, yPos + 5)
  doc.text('Unit Cost', tableStartX + 135, yPos + 5)
  doc.text('Total', tableStartX + 175, yPos + 5)

  yPos += cellHeight
  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(9)

  let rowCount = 0

  // ─── TABLE BODY ───
  selectedStageIds.forEach((stageId) => {
    const stage = stages.find(s => s.id === stageId)
    if (!stage) return

    // Filter tasks to only include those with quantity > 0
    const stageTasks = (stage.tasks || []).filter(task => task.quantity > 0)
    if (stageTasks.length === 0) return // Skip stage if no tasks with quantity

    const stageTotal = stageTasks.reduce((sum, task) => sum + (task.quantity * task.unit_cost), 0)

    // ─── STAGE HEADER ROW ───
    if (yPos + cellHeight > pageHeight - 30) {
      doc.addPage()
      yPos = margin
    }

    doc.setFillColor(226, 232, 240)
    doc.setTextColor(30, 41, 59)
    doc.setFont(undefined, 'bold')
    doc.setFontSize(10)
    doc.rect(tableStartX, yPos, tableWidth, cellHeight, 'F')

    doc.text(stage.name, tableStartX + 3, yPos + 5)
    doc.text(`₹${stageTotal.toLocaleString('en-IN')}`, tableStartX + tableWidth - 5, yPos + 5, { align: 'right' })

    yPos += cellHeight

    // ─── TASK ROWS ───
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)

    stageTasks.forEach((task) => {
      if (yPos + cellHeight > pageHeight - 30) {
        doc.addPage()
        yPos = margin
      }

      const taskTotal = task.quantity * task.unit_cost

      // Alternate row background
      if (rowCount % 2 === 0) {
        doc.setFillColor(249, 250, 251)
        doc.rect(tableStartX, yPos, tableWidth, cellHeight, 'F')
      }

      // Row borders
      doc.setDrawColor(229, 231, 235)
      doc.rect(tableStartX, yPos, tableWidth, cellHeight)

      // Row content
      doc.text(`  ${task.task_name}`, tableStartX + 3, yPos + 5)
      doc.text(String(task.quantity), tableStartX + 115, yPos + 5, { align: 'center' })
      doc.text(`₹${task.unit_cost.toLocaleString('en-IN')}`, tableStartX + 160, yPos + 5, { align: 'right' })
      doc.text(`₹${taskTotal.toLocaleString('en-IN')}`, tableStartX + tableWidth - 5, yPos + 5, { align: 'right' })

      yPos += cellHeight
      rowCount++
    })

    yPos += 2 // Spacing between stages
  })

  // ─── TOTAL ROW ───
  if (yPos + cellHeight + 2 > pageHeight - 30) {
    doc.addPage()
    yPos = margin
  }

  doc.setFillColor(249, 115, 22)
  doc.setTextColor(255, 255, 255)
  doc.setFont(undefined, 'bold')
  doc.setFontSize(11)
  doc.rect(tableStartX, yPos, tableWidth, cellHeight + 2, 'F')

  doc.text('ESTIMATED TOTAL', tableStartX + 3, yPos + 6)
  doc.text(`₹${grandTotal.toLocaleString('en-IN')}`, tableStartX + tableWidth - 5, yPos + 6, { align: 'right' })

  return yPos + cellHeight + 8
}

/**
 * Generate and download proposal PDF
 * @param {Object} project - Project object
 * @param {Array} selectedStageIds - Array of selected stage IDs
 * @param {Array} stages - All stages with tasks
 * @param {number} grandTotal - Total estimate amount
 */
export function downloadProposalPDF(project, selectedStageIds, stages, grandTotal) {
  try {
    // If selectedStageIds is empty but stages are provided, use all stages with tasks
    if ((!selectedStageIds || selectedStageIds.length === 0) && (!stages || stages.length === 0)) {
      console.error('No stages selected for PDF')
      return false
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    let yPosition = margin

    // ═══════════════════════════════════════════════════════════
    // HEADER SECTION WITH BACKGROUND
    // ═══════════════════════════════════════════════════════════
    // Colored header background
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, pageWidth, 40, 'F')

    // Company name in header
    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, 'bold')
    doc.text('SOLAR PROJECT PROPOSAL', margin, 12)

    doc.setFontSize(10)
    doc.setTextColor(226, 232, 240)
    doc.setFont(undefined, 'normal')
    doc.text('Professional Solar Installation Services', margin, 22)

    // Proposal badge
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, 'bold')
    doc.text(`Proposal #: ${project?.proposal_number || 'N/A'}`, pageWidth - margin - 80, 15)
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    doc.text(new Date().toLocaleDateString('en-IN'), pageWidth - margin - 80, 22)

    yPosition = 48

    // ═══════════════════════════════════════════════════════════
    // PROJECT INFORMATION SECTION
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11)
    doc.setTextColor(31, 41, 55)
    doc.setFont(undefined, 'bold')
    doc.text('PROJECT INFORMATION', margin, yPosition)
    yPosition += 6

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(55, 65, 81)

    const infoFields = [
      { label: 'Project Name:', value: project?.name || 'N/A' },
      { label: 'Project ID:', value: project?.id ? project.id.substring(0, 8).toUpperCase() : 'N/A' },
      { label: 'Project Code:', value: project?.project_code || 'N/A' },
      { label: 'Capacity:', value: project?.capacity_kw ? `${project.capacity_kw} kW` : 'N/A' },
      { label: 'Proposal #:', value: project?.proposal_number || 'N/A' },
      { label: 'Customer Name:', value: project?.customer_name || 'N/A' },
      { label: 'Contact Number:', value: project?.customer_phone || 'N/A' },
      { label: 'Generated on:', value: new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
    ]

    infoFields.forEach(({ label, value }) => {
      doc.setFont(undefined, 'bold')
      doc.setTextColor(55, 65, 81)
      doc.text(label, margin, yPosition)

      doc.setFont(undefined, 'normal')
      doc.setTextColor(107, 114, 128)
      doc.text(value, margin + 50, yPosition)

      yPosition += 6
    })

    yPosition += 5

    // ═══════════════════════════════════════════════════════════
    // PROPOSAL DETAILS HEADING
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11)
    doc.setTextColor(31, 41, 55)
    doc.setFont(undefined, 'bold')
    doc.text('PROPOSED STAGES & SERVICES', margin, yPosition)
    yPosition += 8

    // ═══════════════════════════════════════════════════════════
    // PROFESSIONAL TABLE
    // ═══════════════════════════════════════════════════════════
    yPosition = createProfessionalTable(doc, selectedStageIds, stages, grandTotal, margin, yPosition, pageWidth, pageHeight)

    // ═══════════════════════════════════════════════════════════
    // PROJECT SUMMARY SECTION
    // ═══════════════════════════════════════════════════════════
    if (yPosition + 30 > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    yPosition += 5
    doc.setFillColor(240, 253, 250)
    doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 24, 'F')
    doc.setDrawColor(16, 185, 129)
    doc.setLineWidth(0.5)
    doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 24)

    doc.setFontSize(10)
    doc.setTextColor(31, 41, 55)
    doc.setFont(undefined, 'bold')
    doc.text('PROJECT OVERVIEW', margin + 5, yPosition + 3)

    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(107, 114, 128)
    const summaryText = `This proposal details the scope, services, and investment required for ${project?.name || 'your solar installation project'}.
All services include professional installation by certified technicians with quality assurance and warranty support.`
    doc.text(summaryText, margin + 5, yPosition + 10, { maxWidth: pageWidth - 2 * margin - 10 })
    yPosition += 30

    // ═══════════════════════════════════════════════════════════
    // TERMS & CONDITIONS SECTION
    // ═══════════════════════════════════════════════════════════

    doc.setFontSize(10)
    doc.setTextColor(31, 41, 55)
    doc.setFont(undefined, 'bold')
    doc.text('TERMS & CONDITIONS', margin, yPosition)
    yPosition += 5

    doc.setFontSize(9)
    doc.setTextColor(107, 114, 128)
    doc.setFont(undefined, 'normal')

    const terms = [
      'Valid for 30 days from the date of issue.',
      '50% advance payment required to begin work.',
      '25% due at mid-point completion, 25% at final handover.',
      'All labor, materials, and equipment are included.',
      'Timeline: 15-30 days depending on system size and weather.',
      'Full warranty on equipment (10 years) and labor (5 years).',
      'Final contract will detail specific terms and conditions.'
    ]

    terms.forEach((term) => {
      if (yPosition + 5 > pageHeight - 30) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(`• ${term}`, margin + 3, yPosition, { maxWidth: pageWidth - 2 * margin - 3 })
      yPosition += 5
    })

    yPosition += 5

    // ═══════════════════════════════════════════════════════════
    // NEXT STEPS SECTION
    // ═══════════════════════════════════════════════════════════
    if (yPosition + 25 > pageHeight - 30) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(10)
    doc.setTextColor(31, 41, 55)
    doc.setFont(undefined, 'bold')
    doc.text('NEXT STEPS', margin, yPosition)
    yPosition += 6

    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(107, 114, 128)

    const nextSteps = [
      '1. Review this proposal and contact us with any questions',
      '2. Provide approval and signed agreement to proceed',
      '3. Site inspection and final technical approval',
      '4. Schedule installation and begin project execution'
    ]

    nextSteps.forEach((step) => {
      if (yPosition + 5 > pageHeight - 30) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(step, margin + 3, yPosition)
      yPosition += 5
    })

    // ═══════════════════════════════════════════════════════════
    // SUMMARY & CLOSING SECTION
    // ═══════════════════════════════════════════════════════════
    if (yPosition + 25 > pageHeight - 40) {
      doc.addPage()
      yPosition = margin
    }

    yPosition += 5
    doc.setFillColor(239, 246, 255)
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(0.5)
    doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 22, 'FD')

    doc.setFontSize(9)
    doc.setTextColor(31, 41, 55)
    doc.setFont(undefined, 'bold')
    doc.text('PROPOSAL SUMMARY', margin + 5, yPosition + 3)

    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(`Total Investment: ₹${grandTotal.toLocaleString('en-IN')}`, margin + 5, yPosition + 9)
    doc.text(`Customer: ${project?.customer_name || 'To Be Confirmed'}`, margin + 5, yPosition + 14)

    yPosition += 28

    // ═══════════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.setFont(undefined, 'normal')

    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18)

    // Left side: Company info
    doc.text('SolarTrack Pro © 2024', margin, pageHeight - 13)
    doc.setFontSize(7)
    doc.text('Professional Solar Installation Management', margin, pageHeight - 10)

    // Center: Document reference
    doc.setFontSize(8)
    const docRefText = `Ref: ${project?.project_code || 'PRJ'}-${project?.proposal_number || 'N/A'}`
    const docRefX = (pageWidth / 2) - (doc.getStringUnitWidth(docRefText) * 8 / 2 / 25.4 * 72 / 72)
    doc.text(docRefText, pageWidth / 2, pageHeight - 13, { align: 'center' })

    // Right side: Generation info
    doc.setFontSize(7)
    const generatedText = `Generated: ${new Date().toLocaleDateString('en-IN')}`
    doc.text(generatedText, pageWidth - margin, pageHeight - 13, { align: 'right' })

    // ═══════════════════════════════════════════════════════════
    // SAVE & DOWNLOAD
    // ═══════════════════════════════════════════════════════════
    const timestamp = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`
    const projectName = project?.name?.replace(/\s+/g, '_') || 'Proposal'
    const filename = `Proposal_${projectName}_${timestamp}.pdf`

    doc.save(filename)
    console.log('PDF downloaded successfully:', filename)

    return true
  } catch (error) {
    console.error('Error generating PDF:', error)
    return false
  }
}

/**
 * Generate proposal summary text
 * @param {Object} project - Project object
 * @param {Array} selectedStageIds - Array of selected stage IDs
 * @param {Array} stages - All stages with tasks
 * @param {number} grandTotal - Total estimate amount
 * @returns {string} - Formatted proposal text
 */
export function generateProposalText(project, selectedStageIds, stages, grandTotal) {
  let text = `SOLAR PROJECT PROPOSAL\n`
  text += `${'='.repeat(60)}\n\n`
  text += `Project: ${project?.name || 'N/A'}\n`
  text += `Code: ${project?.project_code || 'N/A'}\n`
  text += `Capacity: ${project?.capacity_kw || 'N/A'} kW\n`
  text += `Date: ${new Date().toLocaleDateString('en-IN')}\n\n`

  text += `PROPOSED STAGES\n`
  text += `${'-'.repeat(60)}\n`

  selectedStageIds.forEach((stageId) => {
    const stage = stages.find(s => s.id === stageId)
    if (!stage) return

    // Filter tasks to only include those with quantity > 0
    const stageTasks = (stage.tasks || []).filter(task => task.quantity > 0)
    if (stageTasks.length === 0) return // Skip stage if no tasks with quantity

    const stageTotal = stageTasks.reduce((sum, task) => sum + (task.quantity * task.unit_cost), 0)

    text += `\n${stage.name}\n`
    stageTasks.forEach((task) => {
      const taskTotal = task.quantity * task.unit_cost
      text += `  • ${task.task_name}: ${task.quantity} × ₹${task.unit_cost.toLocaleString('en-IN')} = ₹${taskTotal.toLocaleString('en-IN')}\n`
    })
    text += `  Stage Total: ₹${stageTotal.toLocaleString('en-IN')}\n`
  })

  text += `\n${'='.repeat(60)}\n`
  text += `TOTAL ESTIMATE: ₹${grandTotal.toLocaleString('en-IN')}\n`
  text += `${'='.repeat(60)}\n`

  return text
}
