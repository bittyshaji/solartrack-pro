/**
 * Invoice Download Service
 * Generate and download invoices as PDF with professional formatting
 * Includes project specifications and stage-wise task breakdown
 */

import { jsPDF } from 'jspdf'

/**
 * Generate and download invoice PDF
 * @param {Object} invoice - Invoice object
 * @param {Object} project - Project object with specs
 * @param {Object} customer - Customer object
 * @param {Array} stages - Stages with tasks for breakdown
 */
export function downloadInvoicePDF(invoice, project, customer, stages) {
  try {
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
    // HEADER SECTION
    // ═══════════════════════════════════════════════════════════
    doc.setFillColor(59, 130, 246)
    doc.rect(0, 0, pageWidth, 40, 'F')

    doc.setFontSize(24)
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, 'bold')
    doc.text('INVOICE', margin, 12)

    doc.setFontSize(10)
    doc.setTextColor(226, 232, 240)
    doc.setFont(undefined, 'normal')
    doc.text('SolarTrack Pro - Professional Solar Services', margin, 22)

    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    doc.setFont(undefined, 'bold')
    doc.text(`Invoice #: ${invoice?.invoice_number || 'N/A'}`, pageWidth - margin - 80, 15)
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    doc.text(new Date().toLocaleDateString('en-IN'), pageWidth - margin - 80, 22)

    yPosition = 48

    // ═══════════════════════════════════════════════════════════
    // PROJECT INFORMATION & SPECS
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11)
    doc.setTextColor(31, 41, 55)
    doc.setFont(undefined, 'bold')
    doc.text('PROJECT INFORMATION', margin, yPosition)
    yPosition += 6

    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(55, 65, 81)

    const projectInfo = [
      { label: 'Project Name:', value: project?.name || 'N/A' },
      { label: 'Project Code:', value: project?.project_code || 'N/A' },
      { label: 'Capacity:', value: project?.capacity_kw ? `${project.capacity_kw} kW` : 'N/A' },
      { label: 'Location:', value: project?.location || 'N/A' },
      { label: 'Description:', value: project?.description || 'Solar installation project' }
    ]

    projectInfo.forEach(({ label, value }) => {
      doc.setFont(undefined, 'bold')
      doc.setTextColor(55, 65, 81)
      doc.text(label, margin, yPosition)

      doc.setFont(undefined, 'normal')
      doc.setTextColor(107, 114, 128)
      const maxWidth = pageWidth - margin - 70
      doc.text(value.toString(), margin + 50, yPosition, { maxWidth })

      yPosition += 6
    })

    yPosition += 3

    // ═══════════════════════════════════════════════════════════
    // CUSTOMER INFORMATION
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11)
    doc.setTextColor(31, 41, 55)
    doc.setFont(undefined, 'bold')
    doc.text('BILL TO', margin, yPosition)
    yPosition += 6

    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(55, 65, 81)

    const customerInfo = [
      { label: 'Name:', value: customer?.customer_name || 'N/A' },
      { label: 'Contact:', value: customer?.contact_number || 'N/A' },
      { label: 'Email:', value: customer?.email || 'N/A' }
    ]

    customerInfo.forEach(({ label, value }) => {
      doc.setFont(undefined, 'bold')
      doc.text(label, margin, yPosition)
      doc.setFont(undefined, 'normal')
      doc.text(value, margin + 30, yPosition)
      yPosition += 5
    })

    yPosition += 5

    // ═══════════════════════════════════════════════════════════
    // STAGE-WISE BREAKDOWN
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(11)
    doc.setTextColor(31, 41, 55)
    doc.setFont(undefined, 'bold')
    doc.text('PROJECT STAGES & SERVICES BREAKDOWN', margin, yPosition)
    yPosition += 8

    // Process each stage
    if (stages && stages.length > 0) {
      stages.forEach((stage) => {
        const stageTasks = (stage.tasks || []).filter(task => task.quantity > 0)
        if (stageTasks.length === 0) return // Skip empty stages

        // Check if we need a new page
        if (yPosition + 20 > pageHeight - 30) {
          doc.addPage()
          yPosition = margin
        }

        // Stage header with light background
        doc.setFillColor(226, 232, 240)
        doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 7, 'F')

        doc.setFontSize(10)
        doc.setFont(undefined, 'bold')
        doc.setTextColor(30, 41, 59)
        doc.text(`${stage.name}`, margin + 3, yPosition + 2)

        yPosition += 8

        // Stage tasks
        doc.setFontSize(8)
        doc.setFont(undefined, 'normal')
        doc.setTextColor(107, 114, 128)

        stageTasks.forEach((task) => {
          if (yPosition + 4 > pageHeight - 30) {
            doc.addPage()
            yPosition = margin
          }

          const taskTotal = task.quantity * task.unit_cost

          // Task details
          doc.text(`  • ${task.task_name}`, margin + 5, yPosition)
          doc.text(`${task.quantity} × ₹${task.unit_cost.toLocaleString('en-IN')}`, pageWidth - margin - 50, yPosition, { align: 'right' })
          doc.text(`₹${taskTotal.toLocaleString('en-IN')}`, pageWidth - margin - 5, yPosition, { align: 'right' })

          yPosition += 4
        })

        // Stage total
        const stageTotal = stageTasks.reduce((sum, task) => sum + (task.quantity * task.unit_cost), 0)
        doc.setFont(undefined, 'bold')
        doc.setTextColor(55, 65, 81)
        doc.text(`Stage Total:`, margin + 5, yPosition)
        doc.text(`₹${stageTotal.toLocaleString('en-IN')}`, pageWidth - margin - 5, yPosition, { align: 'right' })

        yPosition += 6
      })
    }

    // ═══════════════════════════════════════════════════════════
    // PAYMENT SUMMARY
    // ═══════════════════════════════════════════════════════════
    if (yPosition + 30 > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    yPosition += 5
    doc.setFillColor(240, 253, 250)
    doc.setDrawColor(16, 185, 129)
    doc.setLineWidth(0.5)
    doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 30, 'FD')

    doc.setFontSize(11)
    doc.setTextColor(31, 41, 55)
    doc.setFont(undefined, 'bold')
    doc.text('PAYMENT SUMMARY', margin + 5, yPosition + 3)

    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')

    let summaryY = yPosition + 10
    const summaryLines = [
      { label: 'Total Amount:', value: `₹${(invoice?.total_amount || 0).toLocaleString('en-IN')}` },
      { label: 'Paid Amount:', value: `₹${(invoice?.paid_amount || 0).toLocaleString('en-IN')}` },
      { label: 'Outstanding:', value: `₹${((invoice?.total_amount || 0) - (invoice?.paid_amount || 0)).toLocaleString('en-IN')}` }
    ]

    summaryLines.forEach(({ label, value }) => {
      doc.setTextColor(55, 65, 81)
      doc.setFont(undefined, 'bold')
      doc.text(label, margin + 5, summaryY)

      doc.setTextColor(31, 41, 55)
      doc.setFont(undefined, 'bold')
      doc.text(value, pageWidth - margin - 20, summaryY, { align: 'right' })

      summaryY += 6
    })

    yPosition = yPosition + 35

    // ═══════════════════════════════════════════════════════════
    // PAYMENT TERMS
    // ═══════════════════════════════════════════════════════════
    if (yPosition + 20 > pageHeight - 60) {
      doc.addPage()
      yPosition = margin
    }

    doc.setFontSize(10)
    doc.setTextColor(31, 41, 55)
    doc.setFont(undefined, 'bold')
    doc.text('PAYMENT TERMS & CONDITIONS', margin, yPosition)
    yPosition += 5

    doc.setFontSize(8)
    doc.setTextColor(107, 114, 128)
    doc.setFont(undefined, 'normal')

    const terms = [
      'Payment must be made within 7 days from invoice date.',
      'Bank transfer details will be provided separately.',
      'Late payments may incur additional charges.',
      'GST (if applicable) has been included in the total amount.',
      'Please include invoice number in payment reference.'
    ]

    terms.forEach((term) => {
      if (yPosition + 4 > pageHeight - 30) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(`• ${term}`, margin + 3, yPosition, { maxWidth: pageWidth - 2 * margin - 3 })
      yPosition += 4
    })

    // ═══════════════════════════════════════════════════════════
    // FOOTER
    // ═══════════════════════════════════════════════════════════
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.setFont(undefined, 'normal')

    doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18)

    doc.text('SolarTrack Pro © 2024', margin, pageHeight - 13)
    doc.setFontSize(7)
    doc.text('Professional Solar Installation Management', margin, pageHeight - 10)

    doc.setFontSize(8)
    doc.text(`Invoice: ${invoice?.invoice_number || 'N/A'}`, pageWidth / 2, pageHeight - 13, { align: 'center' })

    doc.setFontSize(7)
    const generatedText = `Generated: ${new Date().toLocaleDateString('en-IN')}`
    doc.text(generatedText, pageWidth - margin, pageHeight - 13, { align: 'right' })

    // ═══════════════════════════════════════════════════════════
    // SAVE & DOWNLOAD
    // ═══════════════════════════════════════════════════════════
    const timestamp = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`
    const projectName = project?.name?.replace(/\s+/g, '_') || 'Invoice'
    const filename = `Invoice_${invoice?.invoice_number || 'N/A'}_${timestamp}.pdf`

    doc.save(filename)
    console.log('Invoice PDF downloaded successfully:', filename)

    return true
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return false
  }
}
