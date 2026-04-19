import { useCallback, useRef, useState } from 'react'
import { loadHTML2Canvas, loadjsPDF, loadXLSX } from '../lib/services/operations/dynamicImports'
import { logger } from '../lib/logger'

/**
 * Custom hook for managing PDF, image, and Excel exports
 * Handles lazy loading of export libraries, loading/error states, and cleanup
 *
 * @returns {Object} Object containing:
 *   - isExporting: {boolean} True if export is in progress
 *   - exportError: {Error|null} Error from last failed export
 *   - progress: {number} Export progress 0-100 (mainly for image exports)
 *   - exportToPDF: {Function} Async function to export to PDF
 *   - exportToImage: {Function} Async function to export element to image
 *   - exportToExcel: {Function} Async function to export data to Excel
 *   - cancelExport: {Function} Cancel ongoing export
 *   - clearError: {Function} Clear error state
 *
 * @example
 * // Basic usage
 * const { isExporting, exportError, exportToPDF } = useExportManager()
 *
 * // Export an element to image
 * const { exportToImage } = useExportManager()
 * const imageBlob = await exportToImage(elementRef.current)
 *
 * // With error handling
 * const { isExporting, exportError, exportToImage, clearError } = useExportManager()
 * const handleExport = async () => {
 *   try {
 *     await exportToImage(element)
 *   } catch (err) {
 *     console.error('Export failed:', err)
 *   } finally {
 *     clearError()
 *   }
 * }
 */
export function useExportManager() {
  const [state, setState] = useState({
    isExporting: false,
    exportError: null,
    progress: 0,
  })

  // AbortController to handle cancellations
  const abortControllerRef = useRef(null)
  const timeoutRef = useRef(null)

  /**
   * Update state safely
   * @private
   */
  const updateState = useCallback((updates) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    updateState({ exportError: null })
  }, [updateState])

  /**
   * Cancel ongoing export
   */
  const cancelExport = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    updateState({ isExporting: false, progress: 0 })
  }, [updateState])

  /**
   * Export element to PDF
   * @param {HTMLElement} element - Element to export
   * @param {string} filename - PDF filename (without .pdf extension)
   * @param {Object} options - jsPDF options
   * @returns {Promise<{success: boolean, error?: string}>}
   *
   * @example
   * const result = await exportToPDF(chartElement, 'chart-report', {
   *   orientation: 'landscape',
   *   format: 'a4'
   * })
   */
  const exportToPDF = useCallback(
    async (element, filename = 'export', options = {}) => {
      abortControllerRef.current = new AbortController()
      updateState({ isExporting: true, exportError: null, progress: 10 })

      try {
        if (!element) {
          throw new Error('Element to export is required')
        }

        // Step 1: Load HTML2Canvas (25% progress)
        updateState({ progress: 25 })
        const html2canvasModule = await loadHTML2Canvas()
        const html2canvas = html2canvasModule.default

        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Export cancelled by user')
        }

        // Step 2: Convert element to canvas (50% progress)
        updateState({ progress: 50 })
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          ...options.canvasOptions,
        })

        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Export cancelled by user')
        }

        // Step 3: Load jsPDF (60% progress)
        updateState({ progress: 60 })
        const { jsPDF } = await loadjsPDF()

        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Export cancelled by user')
        }

        // Step 4: Generate PDF (80% progress)
        updateState({ progress: 80 })
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          ...options.pdfOptions,
        })

        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = pdf.internal.pageSize.getHeight()
        const imgWidth = pdfWidth - 20
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
        pdf.save(`${filename}.pdf`)

        updateState({ isExporting: false, progress: 100 })
        logger.info(`PDF exported successfully: ${filename}.pdf`)

        return { success: true }
      } catch (error) {
        if (error.name === 'AbortError' || error.message.includes('cancelled')) {
          logger.warn('PDF export cancelled by user')
          return { success: false, error: 'Export cancelled' }
        }

        logger.error('PDF export failed', error, { filename })
        const errorMessage =
          error.message || 'Failed to export PDF. Please try again.'
        updateState({
          isExporting: false,
          exportError: error,
          progress: 0,
        })
        return { success: false, error: errorMessage }
      }
    },
    [updateState]
  )

  /**
   * Export element to image
   * @param {HTMLElement} element - Element to export
   * @param {string} filename - Image filename (without extension)
   * @param {string} format - Image format: 'png' | 'jpeg' | 'webp'
   * @param {Object} options - html2canvas options
   * @returns {Promise<{success: boolean, blob?: Blob, error?: string}>}
   *
   * @example
   * const { blob } = await exportToImage(chartElement, 'chart', 'png', {
   *   scale: 2,
   *   backgroundColor: '#fff'
   * })
   * if (blob) {
   *   const url = URL.createObjectURL(blob)
   *   const a = document.createElement('a')
   *   a.href = url
   *   a.download = 'chart.png'
   *   a.click()
   * }
   */
  const exportToImage = useCallback(
    async (element, filename = 'export', format = 'png', options = {}) => {
      abortControllerRef.current = new AbortController()
      updateState({ isExporting: true, exportError: null, progress: 10 })

      try {
        if (!element) {
          throw new Error('Element to export is required')
        }

        // Validate format
        const validFormats = ['png', 'jpeg', 'webp']
        if (!validFormats.includes(format.toLowerCase())) {
          throw new Error(`Invalid format: ${format}. Must be png, jpeg, or webp`)
        }

        // Load HTML2Canvas
        updateState({ progress: 30 })
        const html2canvasModule = await loadHTML2Canvas()
        const html2canvas = html2canvasModule.default

        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Export cancelled by user')
        }

        // Convert element to canvas
        updateState({ progress: 60 })
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          ...options,
        })

        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Export cancelled by user')
        }

        // Convert to blob
        updateState({ progress: 90 })
        const mimeType =
          format.toLowerCase() === 'jpeg' ? 'image/jpeg' : `image/${format}`
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error('Failed to convert canvas to blob'))
              }
            },
            mimeType,
            format.toLowerCase() === 'jpeg' ? 0.95 : 1
          )
        })

        // Optional: Auto-download
        if (options.autoDownload !== false) {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${filename}.${format.toLowerCase()}`
          link.click()
          URL.revokeObjectURL(url)
        }

        updateState({ isExporting: false, progress: 100 })
        logger.info(`Image exported successfully: ${filename}.${format}`)

        return { success: true, blob }
      } catch (error) {
        if (error.name === 'AbortError' || error.message.includes('cancelled')) {
          logger.warn('Image export cancelled by user')
          return { success: false, error: 'Export cancelled' }
        }

        logger.error('Image export failed', error, { filename, format })
        const errorMessage =
          error.message || 'Failed to export image. Please try again.'
        updateState({
          isExporting: false,
          exportError: error,
          progress: 0,
        })
        return { success: false, error: errorMessage }
      }
    },
    [updateState]
  )

  /**
   * Export data to Excel
   * @param {Array<Array>|Object} data - Data to export (array of arrays or workbook object)
   * @param {string} filename - Excel filename (without .xlsx extension)
   * @param {string} sheetName - Sheet name in workbook
   * @returns {Promise<{success: boolean, error?: string}>}
   *
   * @example
   * const data = [
   *   ['Name', 'Age', 'City'],
   *   ['John', 30, 'NYC'],
   *   ['Jane', 25, 'LA']
   * ]
   * await exportToExcel(data, 'people', 'People')
   */
  const exportToExcel = useCallback(
    async (data, filename = 'export', sheetName = 'Sheet1') => {
      abortControllerRef.current = new AbortController()
      updateState({ isExporting: true, exportError: null, progress: 10 })

      try {
        if (!data) {
          throw new Error('Data to export is required')
        }

        // Load XLSX
        updateState({ progress: 30 })
        const XLSX = await loadXLSX()

        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Export cancelled by user')
        }

        // Create workbook
        updateState({ progress: 60 })
        const workbook = XLSX.utils.book_new()

        // Handle array of arrays
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const sheet = XLSX.utils.aoa_to_sheet(data)
          XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
        }
        // Handle array of objects
        else if (Array.isArray(data) && typeof data[0] === 'object') {
          const sheet = XLSX.utils.json_to_sheet(data)
          XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
        }
        // Handle custom workbook object
        else if (typeof data === 'object' && data.sheets) {
          Object.entries(data.sheets).forEach(([name, sheetData]) => {
            if (Array.isArray(sheetData)) {
              const sheet = XLSX.utils.aoa_to_sheet(sheetData)
              XLSX.utils.book_append_sheet(workbook, sheet, name)
            }
          })
        } else {
          throw new Error('Invalid data format for Excel export')
        }

        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Export cancelled by user')
        }

        // Write file
        updateState({ progress: 90 })
        XLSX.writeFile(workbook, `${filename}.xlsx`)

        updateState({ isExporting: false, progress: 100 })
        logger.info(`Excel exported successfully: ${filename}.xlsx`)

        return { success: true }
      } catch (error) {
        if (error.name === 'AbortError' || error.message.includes('cancelled')) {
          logger.warn('Excel export cancelled by user')
          return { success: false, error: 'Export cancelled' }
        }

        logger.error('Excel export failed', error, { filename })
        const errorMessage =
          error.message || 'Failed to export to Excel. Please try again.'
        updateState({
          isExporting: false,
          exportError: error,
          progress: 0,
        })
        return { success: false, error: errorMessage }
      }
    },
    [updateState]
  )

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    cancelExport()
  }, [cancelExport])

  return {
    isExporting: state.isExporting,
    exportError: state.exportError,
    progress: state.progress,
    exportToPDF,
    exportToImage,
    exportToExcel,
    cancelExport,
    clearError,
    cleanup, // For cleanup in useEffect return
  }
}

export default useExportManager
