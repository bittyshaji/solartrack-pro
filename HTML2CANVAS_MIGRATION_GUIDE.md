# HTML2Canvas Lazy Loading - Migration Guide

This guide provides step-by-step instructions for integrating the new lazy-loaded HTML2Canvas functionality into your components.

## Quick Start

### 1. Basic Image Export

```javascript
import { useExportManager } from '@/hooks/useExportManager'
import { useRef } from 'react'

export function MyChart() {
  const chartRef = useRef(null)
  const { exportToImage, isExporting, exportError } = useExportManager()

  const handleExport = async () => {
    const result = await exportToImage(chartRef.current, 'my-chart')
    if (!result.success) {
      console.error('Export failed:', result.error)
    }
  }

  return (
    <div>
      <div ref={chartRef}>
        {/* Your chart or content here */}
      </div>
      <button onClick={handleExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export as Image'}
      </button>
      {exportError && <p className="error">{exportError.message}</p>}
    </div>
  )
}
```

### 2. PDF Export from Element

```javascript
import { useExportManager } from '@/hooks/useExportManager'
import { useRef } from 'react'

export function ReportComponent() {
  const reportRef = useRef(null)
  const { exportToPDF, isExporting, progress } = useExportManager()

  const handleExportPDF = async () => {
    const result = await exportToPDF(reportRef.current, 'report', {
      pdfOptions: { orientation: 'landscape', format: 'a4' },
      canvasOptions: { scale: 2 },
    })
    if (result.success) {
      console.log('PDF exported successfully')
    }
  }

  return (
    <div>
      <div ref={reportRef}>
        {/* Your report content */}
      </div>
      <button onClick={handleExportPDF} disabled={isExporting}>
        {isExporting ? `Exporting ${progress}%...` : 'Export as PDF'}
      </button>
    </div>
  )
}
```

### 3. Excel Export

```javascript
import { useExportManager } from '@/hooks/useExportManager'

export function DataTable({ data }) {
  const { exportToExcel, isExporting } = useExportManager()

  const handleExportExcel = async () => {
    // Convert table to array format
    const excelData = [
      ['Name', 'Age', 'City'],
      ...data.map(row => [row.name, row.age, row.city])
    ]
    
    const result = await exportToExcel(excelData, 'data', 'Sheet1')
    if (result.success) {
      console.log('Excel exported successfully')
    }
  }

  return (
    <div>
      <table>{/* your table content */}</table>
      <button onClick={handleExportExcel} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Export as Excel'}
      </button>
    </div>
  )
}
```

## API Reference

### `useExportManager()`

Custom React hook for managing exports with lazy-loaded libraries.

**Returns:**
```typescript
{
  isExporting: boolean              // True while export is in progress
  exportError: Error | null         // Error from last failed export
  progress: number                  // Export progress 0-100
  exportToPDF: Function            // Export element to PDF
  exportToImage: Function          // Export element to image
  exportToExcel: Function          // Export data to Excel
  cancelExport: Function           // Cancel ongoing export
  clearError: Function             // Clear error state
}
```

### `exportToImage(element, filename, format, options)`

Export a DOM element as an image file.

**Parameters:**
- `element` (HTMLElement, required): DOM element to export
- `filename` (string, optional, default: 'export'): Output filename without extension
- `format` (string, optional, default: 'png'): 'png' | 'jpeg' | 'webp'
- `options` (Object, optional):
  - `scale` (number, default: 2): Canvas scale for resolution
  - `backgroundColor` (string, default: '#ffffff'): Background color
  - `useCORS` (boolean, default: true): Allow cross-origin images
  - `allowTaint` (boolean, default: false): Allow tainted canvas
  - `logging` (boolean, default: false): Log html2canvas debug info
  - `autoDownload` (boolean, default: true): Auto-download or return blob

**Returns:**
```javascript
Promise<{
  success: boolean,
  blob?: Blob,
  error?: string
}>
```

**Example - Return blob instead of downloading:**
```javascript
const { blob } = await exportToImage(element, 'chart', 'png', {
  autoDownload: false
})
if (blob) {
  // Do something with blob
  const url = URL.createObjectURL(blob)
}
```

### `exportToPDF(element, filename, options)`

Export a DOM element as a PDF file.

**Parameters:**
- `element` (HTMLElement, required): DOM element to export
- `filename` (string, optional, default: 'export'): Output filename without .pdf
- `options` (Object, optional):
  - `pdfOptions` (Object): jsPDF configuration
    - `orientation` (string): 'portrait' | 'landscape'
    - `format` (string): 'a4' | 'letter' | 'a3' | etc.
    - `unit` (string): 'mm' | 'px' | 'in' | 'pt'
  - `canvasOptions` (Object): HTML2Canvas options (see above)

**Returns:**
```javascript
Promise<{
  success: boolean,
  error?: string
}>
```

**Example - Landscape A3 PDF:**
```javascript
await exportToPDF(element, 'report', {
  pdfOptions: {
    orientation: 'landscape',
    format: 'a3',
    unit: 'mm'
  },
  canvasOptions: {
    scale: 2,
    useCORS: true
  }
})
```

### `exportToExcel(data, filename, sheetName)`

Export data to an Excel workbook.

**Parameters:**
- `data` (Array|Object, required): Data to export
  - Array of arrays: `[['Name', 'Age'], ['John', 30]]`
  - Array of objects: `[{ name: 'John', age: 30 }]`
  - Custom sheets object: `{ sheets: { Sheet1: [...], Sheet2: [...] } }`
- `filename` (string, optional, default: 'export'): Output filename without .xlsx
- `sheetName` (string, optional, default: 'Sheet1'): Name of the sheet

**Returns:**
```javascript
Promise<{
  success: boolean,
  error?: string
}>
```

**Example - Multiple sheets:**
```javascript
const data = {
  sheets: {
    'Summary': [['Total', '1000']],
    'Details': [['Item', 'Price'], ['A', 100]]
  }
}
await exportToExcel(data, 'report')
```

### `cancelExport()`

Cancel an ongoing export operation.

```javascript
const { cancelExport, isExporting } = useExportManager()

// In a cancel button handler
if (isExporting) {
  cancelExport()
}
```

### `clearError()`

Clear the current error state.

```javascript
const { exportError, clearError } = useExportManager()

// Clear error after handling
if (exportError) {
  clearError()
}
```

## Advanced Usage

### Export with Error Handling and Progress

```javascript
import { useExportManager } from '@/hooks/useExportManager'
import { useState } from 'react'

export function AdvancedExportComponent() {
  const { exportToImage, isExporting, progress, exportError, clearError } = 
    useExportManager()
  const [exportSuccess, setExportSuccess] = useState(false)

  const handleExport = async (element) => {
    setExportSuccess(false)
    clearError()

    try {
      const result = await exportToImage(element, 'chart', 'png', {
        scale: 2,
        quality: 0.95
      })

      if (result.success) {
        setExportSuccess(true)
        setTimeout(() => setExportSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
    }
  }

  return (
    <div>
      {isExporting && (
        <div className="progress-bar">
          <div style={{ width: `${progress}%` }} />
          <span>{progress}%</span>
        </div>
      )}
      
      {exportError && (
        <div className="error-message">
          <p>{exportError.message}</p>
          <button onClick={clearError}>Dismiss</button>
        </div>
      )}

      {exportSuccess && (
        <div className="success-message">Chart exported successfully!</div>
      )}

      <button onClick={() => handleExport(elementRef.current)}>
        {isExporting ? 'Exporting...' : 'Export Chart'}
      </button>
    </div>
  )
}
```

### Preload Libraries for Instant Export

For components that users will definitely use for exports, preload the libraries:

```javascript
import { preloadLibrary } from '@/lib/services/operations/dynamicImports'
import { useEffect } from 'react'

export function ExportDashboard() {
  useEffect(() => {
    // Preload html2canvas when dashboard mounts
    // Users will get instant export without loading delay
    preloadLibrary('html2canvas')
  }, [])

  // Rest of component
}
```

### Custom Canvas Options for Better Quality

```javascript
// For high-quality exports
const highQualityOptions = {
  scale: 3,           // Higher resolution
  useCORS: true,      // Load cross-origin images
  logging: false,     // No console spam
  backgroundColor: '#ffffff',
}

const result = await exportToImage(element, 'hq-chart', 'png', highQualityOptions)
```

### Handle Large Exports Gracefully

```javascript
// For very large elements, reduce scale
const largeElementOptions = {
  scale: 1,           // Normal resolution
  backgroundColor: '#f5f5f5',
}

const result = await exportToImage(largeElement, 'large', 'png', largeElementOptions)

// For multiple sheet exports
const largeDatasets = [
  [/* Sheet 1 data: 1000 rows */],
  [/* Sheet 2 data: 500 rows */],
]

// Export separately to avoid memory issues
for (const [index, data] of largeDatasets.entries()) {
  await exportToExcel([data], `export-part-${index + 1}`)
}
```

### Cleanup in Component Unmount

```javascript
import { useEffect } from 'react'
import { useExportManager } from '@/hooks/useExportManager'

export function ComponentWithExport() {
  const { cleanup } = useExportManager()

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      cleanup()
    }
  }, [cleanup])

  // Rest of component
}
```

## Testing

### Unit Test Example

```javascript
import { renderHook, act, waitFor } from '@testing-library/react'
import { useExportManager } from '@/hooks/useExportManager'

describe('useExportManager', () => {
  it('should export image successfully', async () => {
    const { result } = renderHook(() => useExportManager())
    const element = document.createElement('div')
    element.innerHTML = '<p>Test content</p>'

    let response
    await act(async () => {
      response = await result.current.exportToImage(element, 'test')
    })

    expect(response.success).toBe(true)
    expect(response.blob).toBeDefined()
  })

  it('should handle export errors', async () => {
    const { result } = renderHook(() => useExportManager())

    await act(async () => {
      const response = await result.current.exportToImage(null, 'test')
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })
  })

  it('should track export progress', async () => {
    const { result } = renderHook(() => useExportManager())
    const element = document.createElement('div')

    act(() => {
      result.current.exportToImage(element, 'test')
    })

    await waitFor(() => {
      expect(result.current.progress).toBeGreaterThan(0)
    })
  })

  it('should cancel export', async () => {
    const { result } = renderHook(() => useExportManager())
    const element = document.createElement('div')

    const exportPromise = result.current.exportToImage(element, 'test')

    act(() => {
      result.current.cancelExport()
    })

    const response = await exportPromise
    expect(response.success).toBe(false)
    expect(response.error).toContain('cancelled')
  })
})
```

### Integration Test Example

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ChartWithExport } from '@/components/ChartWithExport'

describe('ChartWithExport', () => {
  it('should export chart on button click', async () => {
    const { container } = render(<ChartWithExport />)
    const exportBtn = screen.getByRole('button', { name: /export/i })

    fireEvent.click(exportBtn)

    await waitFor(() => {
      // Check that download was triggered or blob was created
      expect(screen.queryByText(/exporting/i)).not.toBeInTheDocument()
    }, { timeout: 5000 })
  })
})
```

## PDF Generation Testing

### Test PDF Output Quality

```javascript
// Test file: __tests__/pdf-generation.test.js
import { loadHTML2Canvas, loadjsPDF } from '@/lib/services/operations/dynamicImports'

describe('PDF Generation', () => {
  it('should generate readable PDF', async () => {
    const element = document.createElement('div')
    element.innerHTML = `
      <h1>Test Report</h1>
      <p>This is a test paragraph.</p>
    `
    document.body.appendChild(element)

    const html2canvasModule = await loadHTML2Canvas()
    const html2canvas = html2canvasModule.default
    const canvas = await html2canvas(element)

    // Verify canvas was created
    expect(canvas.width).toBeGreaterThan(0)
    expect(canvas.height).toBeGreaterThan(0)

    // Verify image data is present
    const imageData = canvas.toDataURL('image/png')
    expect(imageData).toMatch(/^data:image\/png/)

    document.body.removeChild(element)
  })
})
```

### Test Image Export Quality

```javascript
describe('Image Export', () => {
  it('should generate image with correct dimensions', async () => {
    const element = document.createElement('div')
    element.style.width = '400px'
    element.style.height = '300px'
    element.innerHTML = '<p>Test</p>'
    document.body.appendChild(element)

    const { exportToImage } = renderHook(() => useExportManager()).result.current
    const { blob } = await exportToImage(element, 'test', 'png', {
      autoDownload: false,
      scale: 1
    })

    // Verify blob
    expect(blob).toBeDefined()
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBeGreaterThan(0)

    document.body.removeChild(element)
  })
})
```

## Troubleshooting Guide

### "Failed to load HTML2Canvas" Error

**Problem:** Export button doesn't work, console shows "Failed to load HTML2Canvas"

**Solutions:**
1. Verify `html2canvas` is installed:
   ```bash
   npm list html2canvas
   # or
   yarn why html2canvas
   ```

2. Check if bundle contains html2canvas:
   ```bash
   npm run build
   # Check dist for html2canvas bundle
   ```

3. Clear cache and rebuild:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

### Image Export Shows Blank Canvas

**Problem:** Exported image is blank or cut off

**Solutions:**
1. Add loading delay (DOM needs time to render):
   ```javascript
   setTimeout(() => exportToImage(element), 500)
   ```

2. Increase canvas scale:
   ```javascript
   exportToImage(element, 'chart', 'png', { scale: 2 })
   ```

3. Ensure CORS for external images:
   ```javascript
   exportToImage(element, 'chart', 'png', { useCORS: true })
   ```

4. Check for visibility issues:
   ```javascript
   // Ensure element is visible during export
   element.style.display = 'block' // Not 'none'
   element.offsetWidth // Force layout calculation
   ```

### PDF Export Too Slow

**Problem:** PDF export takes 5+ seconds

**Solutions:**
1. Reduce canvas scale:
   ```javascript
   exportToPDF(element, 'report', {
     canvasOptions: { scale: 1 }
   })
   ```

2. Reduce element size (export sections):
   ```javascript
   // Export only visible area
   const visibleElement = element.getBoundingClientRect()
   // Export just that region
   ```

3. Remove heavy styling:
   ```javascript
   // Disable shadows, gradients during export
   element.style.boxShadow = 'none'
   const result = await exportToPDF(element)
   element.style.boxShadow = 'initial'
   ```

4. Preload libraries:
   ```javascript
   useEffect(() => {
     preloadLibrary('html2canvas')
   }, [])
   ```

### Memory Error During Export

**Problem:** Browser crashes with "Out of memory" error

**Solutions:**
1. Reduce canvas resolution:
   ```javascript
   exportToImage(element, 'chart', 'png', { scale: 1 })
   ```

2. Export smaller regions:
   ```javascript
   // Create temporary container with smaller element
   const small = element.cloneNode(true)
   small.style.width = '800px' // Smaller size
   exportToImage(small, 'chart')
   ```

3. Export as JPEG instead (compressed):
   ```javascript
   exportToImage(element, 'chart', 'jpeg', { scale: 1 })
   ```

4. Split large data:
   ```javascript
   // Export in chunks
   const data = largeArray
   const chunkSize = 1000
   for (let i = 0; i < data.length; i += chunkSize) {
     await exportToExcel(data.slice(i, i + chunkSize), `export-${i}`)
   }
   ```

## Performance Tips

1. **Preload for critical paths:**
   ```javascript
   // In dashboards where users will export
   useEffect(() => {
     preloadLibrary('html2canvas')
   }, [])
   ```

2. **Use appropriate formats:**
   - PNG: Best quality, larger file size
   - JPEG: Good compression, smaller file size
   - WebP: Best compression (newer browsers only)

3. **Optimize element rendering:**
   ```javascript
   // Hide unnecessary elements during export
   const elementsToHide = document.querySelectorAll('.no-export')
   elementsToHide.forEach(el => el.style.display = 'none')
   
   await exportToImage(container)
   
   elementsToHide.forEach(el => el.style.display = '')
   ```

4. **Monitor progress for large exports:**
   ```javascript
   const { progress, isExporting } = useExportManager()
   
   // Show progress bar
   {isExporting && <ProgressBar value={progress} />}
   ```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- iOS Safari 14+
- Chrome Android

For older browsers, provide fallback:
```javascript
try {
  const result = await exportToImage(element)
  if (!result.success) {
    showFallbackUI()
  }
} catch {
  showUnsupportedBrowserMessage()
}
```

## FAQ

**Q: Why is the first export slow?**
A: The first export loads the HTML2Canvas library (~198KB). Subsequent exports use the cached module.

**Q: Can I export to different formats?**
A: Yes! PNG (default), JPEG, and WebP are supported.

**Q: How do I export just part of the page?**
A: Create a ref to the element and pass it: `<div ref={partRef}>{...}</div>`

**Q: Can I customize the PDF layout?**
A: Yes, use the `pdfOptions` parameter with jsPDF settings.

**Q: What about very large tables?**
A: Export in multiple sheets or reduce the scale.

**Q: Is there a size limit for exports?**
A: Browser memory limit (~500MB). Large exports may require chunking.

**Q: Can I cancel an export?**
A: Yes, call `cancelExport()` while export is in progress.

**Q: How do I handle errors?**
A: Check the `success` property and `error` field in the response.

**Q: Can I preload all libraries?**
A: Yes: `preloadLibraries(['html2canvas', 'jspdf', 'xlsx'])`

## Getting Help

For issues or questions:
1. Check this migration guide
2. Review PHASE_1_HTML2CANVAS_IMPLEMENTATION.md
3. Check browser console for error messages
4. Enable html2canvas logging: `{ logging: true }`
5. Report issues with reproducible examples
