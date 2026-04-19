/**
 * Dynamic import loaders for large libraries
 * Phase 4: Optimization - Lazy-loaded only when needed to reduce initial bundle size
 * Phase 1: HTML2Canvas optimization - Lazy load for image exports (~198KB savings)
 * Expected savings: HTML2Canvas (198KB) + jsPDF (280KB) + XLSX (450KB) = 928KB from initial bundle
 */

// Cache loaded modules to avoid re-importing
const loadedModules = {}

/**
 * Lazy load jsPDF for PDF generation
 * Only imported when generating PDFs to avoid bloating the main bundle
 * ~280KB savings by lazy loading
 * @returns {Promise<{jsPDF}>}
 */
export async function loadjsPDF() {
  if (loadedModules.jsPDF) {
    return loadedModules.jsPDF
  }

  try {
    const { default: jsPDF } = await import('jspdf')
    await import('jspdf-autotable')
    loadedModules.jsPDF = { jsPDF }
    return loadedModules.jsPDF
  } catch (error) {
    console.error('Failed to load jsPDF:', error)
    throw new Error(`Failed to load PDF library: ${error.message}`)
  }
}

/**
 * Lazy load HTML2Canvas for screenshot/image exports
 * Only imported when generating image exports or PDFs with charts
 * ~198KB savings by lazy loading
 * @returns {Promise<{default: html2canvas}>}
 * @throws {Error} If html2canvas fails to load (network issues, module not found, etc.)
 *
 * @example
 * const { default: html2canvas } = await loadHTML2Canvas()
 * const canvas = await html2canvas(element)
 * const image = canvas.toDataURL('image/png')
 */
export async function loadHTML2Canvas() {
  if (loadedModules.html2canvas) {
    return loadedModules.html2canvas
  }

  try {
    const html2canvas = await import('html2canvas')
    loadedModules.html2canvas = html2canvas
    return loadedModules.html2canvas
  } catch (error) {
    console.error('Failed to load HTML2Canvas:', error)
    throw new Error(
      `Failed to load HTML2Canvas library: ${error.message}. ` +
      'This feature requires the html2canvas package to be installed.'
    )
  }
}

/**
 * Lazy load XLSX for Excel operations
 * Only imported when importing/exporting Excel files
 * ~450KB savings by lazy loading
 * @returns {Promise<XLSX>}
 */
export async function loadXLSX() {
  if (loadedModules.xlsx) {
    return loadedModules.xlsx
  }

  try {
    const XLSX = await import('xlsx')
    loadedModules.xlsx = XLSX
    return loadedModules.xlsx
  } catch (error) {
    console.error('Failed to load XLSX:', error)
    throw new Error(`Failed to load Excel library: ${error.message}`)
  }
}

/**
 * Lazy load xlsx-populate for advanced Excel operations
 * Only imported when creating complex Excel files
 * @returns {Promise<XLSXPopulate>}
 */
export async function loadXLSXPopulate() {
  if (loadedModules.xlsxPopulate) {
    return loadedModules.xlsxPopulate
  }

  try {
    const XLSXPopulate = await import('xlsx-populate')
    loadedModules.xlsxPopulate = XLSXPopulate
    return loadedModules.xlsxPopulate
  } catch (error) {
    console.error('Failed to load xlsx-populate:', error)
    throw new Error(`Failed to load advanced Excel library: ${error.message}`)
  }
}

/**
 * Preload large libraries before they're needed
 * Useful for critical paths like PDF generation that users expect quickly
 * Call from route components' useEffect on mount
 * @param {string} library - 'jspdf' | 'xlsx' | 'xlsx-populate' | 'html2canvas'
 * @returns {Promise<boolean>} - true if successful, false if failed
 *
 * @example
 * // In a component's useEffect
 * useEffect(() => {
 *   preloadLibrary('html2canvas')
 * }, [])
 */
export async function preloadLibrary(library) {
  try {
    switch (library) {
      case 'jspdf':
        await loadjsPDF()
        return true
      case 'xlsx':
        await loadXLSX()
        return true
      case 'xlsx-populate':
        await loadXLSXPopulate()
        return true
      case 'html2canvas':
        await loadHTML2Canvas()
        return true
      default:
        console.warn(`Unknown library to preload: ${library}`)
        return false
    }
  } catch (error) {
    console.error(`Failed to preload ${library}:`, error)
    return false
  }
}

/**
 * Preload multiple libraries in parallel
 * @param {Array<string>} libraries - Array of library names to preload
 * @returns {Promise<Object>} - Object mapping library names to success status
 */
export async function preloadLibraries(libraries) {
  const results = {}
  await Promise.all(
    libraries.map(async (lib) => {
      results[lib] = await preloadLibrary(lib)
    })
  )
  return results
}

/**
 * Clear cached modules (for testing or memory management)
 * @param {string} library - Optional: specific library to clear. If omitted, clears all.
 */
export function clearModuleCache(library) {
  if (library) {
    delete loadedModules[library]
  } else {
    Object.keys(loadedModules).forEach(key => {
      delete loadedModules[key]
    })
  }
}

/**
 * Lazy load Recharts components on demand
 * Saves ~148KB from initial bundle by lazy loading chart libraries
 * Each chart component is imported only when needed
 *
 * @async
 * @function loadRecharts
 * @param {Object} config - Configuration object for which modules to load
 * @param {boolean} [config.BarChart=false] - Load BarChart component
 * @param {boolean} [config.LineChart=false] - Load LineChart component
 * @param {boolean} [config.AreaChart=false] - Load AreaChart component
 * @param {boolean} [config.PieChart=false] - Load PieChart component
 * @param {boolean} [config.ScatterChart=false] - Load ScatterChart component
 * @param {boolean} [config.RadarChart=false] - Load RadarChart component
 * @param {boolean} [config.ComposedChart=false] - Load ComposedChart component
 * @param {boolean} [config.basic=true] - Load basic components (XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer)
 * @returns {Promise<Object>} Object containing dynamically loaded Recharts modules
 * @throws {Error} If module import fails
 *
 * @example
 * // Load only what you need for a line chart
 * const { LineChart, Line, XAxis, YAxis } = await loadRecharts({
 *   LineChart: true,
 *   Line: true,
 *   basic: true
 * });
 *
 * @example
 * // Load multiple chart types
 * const charts = await loadRecharts({
 *   BarChart: true,
 *   LineChart: true,
 *   PieChart: true,
 *   basic: true
 * });
 */
export async function loadRecharts(config = {}) {
  if (loadedModules.recharts) {
    return loadedModules.recharts
  }

  try {
    const modules = {}
    const { basic = true, ...chartTypes } = config

    // List of all available chart components
    const chartComponents = [
      'BarChart',
      'LineChart',
      'AreaChart',
      'PieChart',
      'ScatterChart',
      'RadarChart',
      'ComposedChart',
      'Bar',
      'Line',
      'Area',
      'Pie',
      'Scatter',
      'Radar',
      'Cell',
      'Reference',
      'ReferenceLine',
      'ReferenceArea',
      'ReferenceEllipse',
    ]

    // List of basic components needed for most charts
    const basicComponents = [
      'XAxis',
      'YAxis',
      'CartesianGrid',
      'Tooltip',
      'Legend',
      'ResponsiveContainer',
    ]

    // Determine which components to load
    const componentsToLoad = new Set()

    // Add basic components if requested
    if (basic) {
      basicComponents.forEach(comp => componentsToLoad.add(comp))
    }

    // Add specific chart types requested
    Object.keys(chartTypes).forEach(key => {
      if (chartTypes[key] && chartComponents.includes(key)) {
        componentsToLoad.add(key)
      }
    })

    // Import recharts once and extract all components
    if (componentsToLoad.size > 0) {
      const rechartsModule = await import('recharts')

      for (const component of componentsToLoad) {
        if (rechartsModule[component]) {
          modules[component] = rechartsModule[component]
        } else {
          console.warn(
            `Recharts component "${component}" not found in module`
          )
        }
      }
    }

    loadedModules.recharts = modules
    return modules
  } catch (error) {
    console.error('Error in loadRecharts:', error)
    throw new Error(
      `Failed to load Recharts modules: ${error.message}`
    )
  }
}

/**
 * Pre-load commonly used Recharts modules
 * Call this on app initialization to warm up the cache
 * Useful for reducing jank on first chart render
 *
 * @async
 * @function preloadCommonCharts
 * @returns {Promise<void>}
 * @throws {Error} If preload fails (non-fatal warning)
 *
 * @example
 * // On app initialization
 * import { preloadCommonCharts } from '@lib/services/operations/dynamicImports';
 * preloadCommonCharts().catch(err => console.error('Preload failed:', err));
 */
export async function preloadCommonCharts() {
  try {
    await loadRecharts({
      LineChart: true,
      BarChart: true,
      PieChart: true,
      AreaChart: true,
      basic: true,
    })
    console.log('Common Recharts modules preloaded successfully')
  } catch (error) {
    console.warn(
      'Failed to preload common Recharts modules:',
      error.message
    )
    // Non-fatal error - app continues but charts may load slower
  }
}
