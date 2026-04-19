# Phase 1.2: Export Component Migration Guide

**Status**: Ready for Implementation
**Date**: April 19, 2026
**Scope**: Migration of export components to use `useExportManager` hook

---

## Overview

This document provides step-by-step instructions for migrating existing export components in SolarTrack Pro to use the new `useExportManager` hook, which provides lazy-loaded HTML2Canvas, jsPDF, and XLSX functionality with automatic error handling and progress tracking.

---

## Quick Reference: Before and After

### Pattern 1: Simple Image Export

**BEFORE** (Old Pattern):
```javascript
import html2canvas from 'html2canvas'
import { useRef } from 'react'

export function ChartExport() {
  const chartRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    try {
      const canvas = await html2canvas(chartRef.current)
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = 'chart.png'
      link.click()
      setExporting(false)
    } catch (err) {
      setError(err.message)
      setExporting(false)
    }
  }

  return (
    <div>
      <div ref={chartRef}>Chart here</div>
      <button onClick={handleExport} disabled={exporting}>
        {exporting ? 'Exporting...' : 'Export'}
      </button>
      {error && <p>{error}</p>}
    </div>
  )
}
```

**AFTER** (New Pattern with Hook):
```javascript
import { useExportManager } from '@/hooks/useExportManager'
import { useRef } from 'react'

export function ChartExport() {
  const chartRef = useRef(null)
  const { exportToImage, isExporting, exportError } = useExportManager()

  const handleExport = async () => {
    await exportToImage(chartRef.current, 'chart', 'png')
  }

  return (
    <div>
      <div ref={chartRef}>Chart here</div>
      <button onClick={handleExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export'}
      </button>
      {exportError && <p>{exportError.message}</p>}
    </div>
  )
}
```

### Pattern 2: PDF Export with Options

**BEFORE** (Old Pattern):
```javascript
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { useRef, useState } from 'react'

export function ReportExport() {
  const reportRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    setProgress(0)

    try {
      // Step 1: Convert to canvas
      setProgress(50)
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true
      })

      // Step 2: Create PDF
      setProgress(75)
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pdfWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)

      // Step 3: Save
      setProgress(100)
      pdf.save('report.pdf')
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
      setProgress(0)
    }
  }

  return (
    <div>
      {exporting && <div>{progress}%</div>}
      <div ref={reportRef}>Report content</div>
      <button onClick={handleExport} disabled={exporting}>
        Export PDF
      </button>
      {error && <p>{error}</p>}
    </div>
  )
}
```

**AFTER** (New Pattern with Hook):
```javascript
import { useExportManager } from '@/hooks/useExportManager'
import { useRef } from 'react'

export function ReportExport() {
  const reportRef = useRef(null)
  const { exportToPDF, isExporting, progress, exportError } = useExportManager()

  const handleExport = async () => {
    await exportToPDF(reportRef.current, 'report', {
      pdfOptions: {
        orientation: 'landscape',
        format: 'a4'
      },
      canvasOptions: {
        scale: 2,
        useCORS: true
      }
    })
  }

  return (
    <div>
      {isExporting && <div>{progress}%</div>}
      <div ref={reportRef}>Report content</div>
      <button onClick={handleExport} disabled={isExporting}>
        Export PDF
      </button>
      {exportError && <p>{exportError.message}</p>}
    </div>
  )
}
```

### Pattern 3: Excel Export

**BEFORE** (Old Pattern):
```javascript
import XLSX from 'xlsx'
import { useState } from 'react'

export function DataExport({ data }) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState(null)

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    try {
      // Transform data
      const exportData = [
        ['Name', 'Department', 'Salary'],
        ...data.map(row => [row.name, row.department, row.salary])
      ]

      // Create workbook
      const workbook = XLSX.utils.book_new()
      const sheet = XLSX.utils.aoa_to_sheet(exportData)
      XLSX.utils.book_append_sheet(workbook, sheet, 'Employees')

      // Save
      XLSX.writeFile(workbook, 'employees.xlsx')
    } catch (err) {
      setError(err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <button onClick={handleExport} disabled={exporting}>
        {exporting ? 'Exporting...' : 'Export Excel'}
      </button>
      {error && <p>{error}</p>}
    </div>
  )
}
```

**AFTER** (New Pattern with Hook):
```javascript
import { useExportManager } from '@/hooks/useExportManager'

export function DataExport({ data }) {
  const { exportToExcel, isExporting, exportError } = useExportManager()

  const handleExport = async () => {
    // Transform data
    const exportData = [
      ['Name', 'Department', 'Salary'],
      ...data.map(row => [row.name, row.department, row.salary])
    ]

    // Export
    await exportToExcel(exportData, 'employees', 'Employees')
  }

  return (
    <div>
      <button onClick={handleExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export Excel'}
      </button>
      {exportError && <p>{exportError.message}</p>}
    </div>
  )
}
```

---

## Migration Step-by-Step

### Step 1: Identify Components to Migrate

Components that likely need updating:
```
src/components/
  ├── analytics/           (if has export buttons)
  ├── dashboard/          (if has export buttons)
  ├── reports/            (if exists)
  ├── finance/            (if exists)
  └── features/
      ├── analytics/      (if has export)
      ├── customers/      (if has export)
      └── projects/       (if has export)
```

Find components with export functionality:
```bash
# Find components using html2canvas
grep -r "html2canvas" src/components --include="*.jsx" --include="*.js"

# Find components using jsPDF
grep -r "jsPDF\|jspdf" src/components --include="*.jsx" --include="*.js"

# Find components using XLSX
grep -r "XLSX\|xlsx" src/components --include="*.jsx" --include="*.js"
```

### Step 2: Basic Migration Template

For each component found, follow this template:

```javascript
// STEP 1: Replace imports
// BEFORE:
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import XLSX from 'xlsx'
import { useState } from 'react'

// AFTER:
import { useExportManager } from '@/hooks/useExportManager'
import { useRef } from 'react'

// STEP 2: Remove manual state management
// BEFORE:
const [exporting, setExporting] = useState(false)
const [error, setError] = useState(null)
const [progress, setProgress] = useState(0)

// AFTER:
// Get state from hook
const { isExporting, exportError, progress } = useExportManager()

// STEP 3: Replace export handler
// BEFORE:
const handleExport = async () => {
  setExporting(true)
  try {
    const canvas = await html2canvas(elementRef.current)
    // ... manual processing
    setExporting(false)
  } catch (err) {
    setError(err)
    setExporting(false)
  }
}

// AFTER:
const { exportToImage } = useExportManager()
const handleExport = async () => {
  await exportToImage(elementRef.current, 'filename')
}

// STEP 4: Update JSX
// BEFORE:
<button disabled={exporting}>{exporting ? 'Exporting...' : 'Export'}</button>
{error && <p>{error.message}</p>}

// AFTER:
<button disabled={isExporting}>{isExporting ? 'Exporting...' : 'Export'}</button>
{exportError && <p>{exportError.message}</p>}
```

### Step 3: Handle Complex Cases

#### Case 1: Multi-format Export (Image + PDF)
```javascript
import { useExportManager } from '@/hooks/useExportManager'
import { useRef } from 'react'

export function MultiFormatExport() {
  const contentRef = useRef(null)
  const { exportToImage, exportToPDF, isExporting } = useExportManager()

  return (
    <div>
      <div ref={contentRef}>Content to export</div>
      
      <button 
        onClick={() => exportToImage(contentRef.current, 'export', 'png')}
        disabled={isExporting}
      >
        Export as Image
      </button>
      
      <button 
        onClick={() => exportToPDF(contentRef.current, 'export')}
        disabled={isExporting}
      >
        Export as PDF
      </button>
    </div>
  )
}
```

#### Case 2: Conditional Exports
```javascript
import { useExportManager } from '@/hooks/useExportManager'

export function ConditionalExport({ data, exportFormat }) {
  const { exportToImage, exportToPDF, exportToExcel, isExporting } = useExportManager()

  const handleExport = async () => {
    switch (exportFormat) {
      case 'image':
        return await exportToImage(elementRef.current, 'export', 'png')
      case 'pdf':
        return await exportToPDF(elementRef.current, 'export')
      case 'excel':
        return await exportToExcel(data, 'export')
      default:
        console.warn('Unknown format:', exportFormat)
    }
  }

  return (
    <button onClick={handleExport} disabled={isExporting}>
      {isExporting ? 'Exporting...' : 'Export'}
    </button>
  )
}
```

#### Case 3: With Cleanup (for unmount)
```javascript
import { useExportManager } from '@/hooks/useExportManager'
import { useEffect } from 'react'

export function ExportWithCleanup() {
  const { cleanup } = useExportManager()

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  // Rest of component
  return <div>Export component</div>
}
```

#### Case 4: With Success Feedback
```javascript
import { useExportManager } from '@/hooks/useExportManager'
import { useState } from 'react'

export function ExportWithFeedback() {
  const [success, setSuccess] = useState(false)
  const { exportToImage, isExporting, exportError } = useExportManager()

  const handleExport = async () => {
    setSuccess(false)
    const result = await exportToImage(elementRef.current, 'export')
    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <div>
      <button onClick={handleExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export'}
      </button>
      {success && <p className="success">Export completed!</p>}
      {exportError && <p className="error">{exportError.message}</p>}
    </div>
  )
}
```

---

## Common Patterns and Solutions

### Pattern A: Chart Export (Recharts)
```javascript
import { useExportManager } from '@/hooks/useExportManager'
import { useRef } from 'react'
import { LineChart, Line, XAxis, YAxis } from 'recharts'

export function ChartWithExport({ data }) {
  const chartRef = useRef(null)
  const { exportToImage, exportToPDF, isExporting, progress } = useExportManager()

  return (
    <div>
      <div ref={chartRef}>
        <LineChart data={data} width={500} height={300}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line type="monotone" dataKey="value" />
        </LineChart>
      </div>

      {isExporting && <p>Exporting: {progress}%</p>}

      <button onClick={() => exportToImage(chartRef.current, 'chart', 'png')} disabled={isExporting}>
        Export Chart
      </button>
      
      <button onClick={() => exportToPDF(chartRef.current, 'report')} disabled={isExporting}>
        Export PDF
      </button>
    </div>
  )
}
```

### Pattern B: Table Export
```javascript
import { useExportManager } from '@/hooks/useExportManager'

export function TableWithExport({ rows, columns }) {
  const { exportToExcel, isExporting } = useExportManager()

  const handleExportTable = async () => {
    // Convert table to array format
    const data = [
      columns.map(c => c.header),
      ...rows.map(row => columns.map(col => row[col.key]))
    ]
    
    await exportToExcel(data, 'table-export', 'Data')
  }

  return (
    <div>
      <table>
        <thead>
          <tr>
            {columns.map(col => <th key={col.key}>{col.header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(col => <td key={col.key}>{row[col.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleExportTable} disabled={isExporting}>
        Export to Excel
      </button>
    </div>
  )
}
```

### Pattern C: Dashboard Multi-Export
```javascript
import { useExportManager } from '@/hooks/useExportManager'
import { useRef } from 'react'

export function Dashboard() {
  const dashboardRef = useRef(null)
  const chartRef = useRef(null)
  const tableRef = useRef(null)

  const { exportToImage, exportToPDF, exportToExcel, isExporting } = useExportManager()

  return (
    <div>
      <div ref={dashboardRef}>
        <div ref={chartRef}>Chart goes here</div>
        <div ref={tableRef}>Table goes here</div>
      </div>

      <div className="export-controls">
        <button onClick={() => exportToImage(dashboardRef.current, 'dashboard')} disabled={isExporting}>
          Snapshot
        </button>

        <button onClick={() => exportToPDF(dashboardRef.current, 'report')} disabled={isExporting}>
          PDF Report
        </button>

        <button onClick={() => exportToImage(chartRef.current, 'chart', 'png')} disabled={isExporting}>
          Chart PNG
        </button>

        <button onClick={() => exportToExcel(tableData, 'export')} disabled={isExporting}>
          Excel Data
        </button>
      </div>
    </div>
  )
}
```

---

## Testing After Migration

### Unit Test Template
```javascript
import { renderHook, act } from '@testing-library/react'
import { useExportManager } from '@/hooks/useExportManager'

describe('ExportedComponent', () => {
  it('should export successfully after migration', async () => {
    const { result } = renderHook(() => useExportManager())
    const element = document.createElement('div')
    element.innerHTML = '<p>Test</p>'

    let response
    await act(async () => {
      response = await result.current.exportToImage(element, 'test')
    })

    expect(response.success).toBe(true)
  })
})
```

### Manual Testing Checklist
- [ ] Export button appears and is clickable
- [ ] Export starts when button clicked
- [ ] Progress indicator shows (if applicable)
- [ ] Export completes successfully
- [ ] File downloads with correct name
- [ ] Content in export matches source
- [ ] Error messages display correctly
- [ ] Can retry after error
- [ ] Export can be cancelled during progress
- [ ] Multiple exports in succession work

---

## Verification Checklist

For each migrated component:

- [ ] Removed direct html2canvas import
- [ ] Removed direct jsPDF import
- [ ] Removed direct XLSX import
- [ ] Added useExportManager import
- [ ] Removed manual state (exporting, error, progress)
- [ ] Using hook state instead
- [ ] Export handler simplified
- [ ] JSX updated for hook state
- [ ] Error handling in place
- [ ] Tests updated
- [ ] Component tested manually
- [ ] No console warnings
- [ ] Bundle size analysis passed

---

## Rollback Plan

If issues occur, rollback is straightforward:

1. Keep original component files in git
2. Revert using: `git checkout -- src/components/...`
3. Investigate issue
4. Fix and retry migration

---

## Summary

Migration to `useExportManager` provides:
- Cleaner, more maintainable code
- Automatic error handling
- Progress tracking
- Lazy-loaded libraries (198 KB savings)
- Consistent API across all exports
- Better TypeScript support (if used)

**Time Estimate**: 5-10 minutes per component
**Risk Level**: Low (backward compatible, no breaking changes)
**Rollback**: Easy (just revert git changes)

---

## Next Steps

1. Identify all components with export functionality
2. Migrate components following the patterns above
3. Test each migrated component
4. Run full test suite
5. Deploy to production
6. Monitor export success metrics

---

**Migration Ready**: April 19, 2026
