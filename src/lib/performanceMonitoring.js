/**
 * Performance monitoring for SolarTrack Pro
 * Phase 4: Optimization - Tracks Core Web Vitals and custom metrics
 * Measures improvements from bundle optimization
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {}
    this.startTime = performance.now()
    this.initialized = false
    this.metricsLog = [] // Store metrics for analysis
    this.routeMetrics = {} // Track per-route performance
  }

  /**
   * Initialize performance monitoring
   */
  initialize() {
    if (this.initialized) return
    this.initialized = true

    // Track Core Web Vitals
    this.trackCoreWebVitals()

    // Track custom metrics
    this.trackCustomMetrics()

    // Track bundle loading performance
    this.trackBundleMetrics()

    // Track dynamic imports
    this.trackDynamicImports()

    // Log initial metrics
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance] Monitoring initialized')
    }
  }

  /**
   * Track Core Web Vitals (LCP, FID, CLS)
   * These are Google's key metrics for user experience
   */
  trackCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    // Measures when the largest visible element is rendered
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.metrics.lcp = {
            value: lastEntry.renderTime || lastEntry.loadTime,
            rating: this.rateLCP(lastEntry.renderTime || lastEntry.loadTime)
          }
          this.sendMetricToAnalytics('lcp', this.metrics.lcp)
        })
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
      } catch (e) {
        console.warn('LCP observer failed:', e)
      }

      // First Input Delay (FID)
      // Measures responsiveness to user interactions
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          entries.forEach((entry) => {
            this.metrics.fid = {
              value: entry.processingDuration,
              rating: this.rateFID(entry.processingDuration)
            }
            this.sendMetricToAnalytics('fid', this.metrics.fid)
          })
        })
        fidObserver.observe({ type: 'first-input', buffered: true })
      } catch (e) {
        console.warn('FID observer failed:', e)
      }

      // Cumulative Layout Shift (CLS)
      // Measures visual stability
      try {
        let clsScore = 0
        const clsObserver = new PerformanceObserver((entryList) => {
          entryList.getEntries().forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsScore += entry.value
              this.metrics.cls = {
                value: clsScore,
                rating: this.rateCLS(clsScore)
              }
              this.sendMetricToAnalytics('cls', this.metrics.cls)
            }
          })
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })
      } catch (e) {
        console.warn('CLS observer failed:', e)
      }
    }
  }

  /**
   * Track custom metrics specific to SolarTrack Pro
   */
  trackCustomMetrics() {
    // Time to Interactive (TTI)
    // Marks when the page is fully interactive
    window.addEventListener('load', () => {
      this.metrics.tti = {
        value: performance.now() - this.startTime,
        rating: this.rateTTI(performance.now() - this.startTime)
      }
      this.sendMetricToAnalytics('tti', this.metrics.tti)
    })

    // Track route changes
    if (window.history) {
      const originalPushState = window.history.pushState
      window.history.pushState = (...args) => {
        originalPushState.apply(window.history, args)
        this.trackRouteLoad()
      }
    }
  }

  /**
   * Track bundle loading performance
   */
  trackBundleMetrics() {
    // First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = {
                value: entry.startTime,
                rating: this.rateFCP(entry.startTime)
              }
              this.sendMetricToAnalytics('fcp', this.metrics.fcp)
            }
          })
        })
        fcpObserver.observe({ type: 'paint', buffered: true })
      } catch (e) {
        console.warn('FCP observer failed:', e)
      }
    }

    // Navigation timing
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        const timing = window.performance.timing
        this.metrics.navTiming = {
          dns: timing.domainLookupEnd - timing.domainLookupStart,
          tcp: timing.connectEnd - timing.connectStart,
          request: timing.responseStart - timing.requestStart,
          response: timing.responseEnd - timing.responseStart,
          dom: timing.domInteractive - timing.responseEnd,
          load: timing.loadEventEnd - timing.loadEventStart,
          total: timing.loadEventEnd - timing.navigationStart
        }
        this.sendMetricToAnalytics('navTiming', this.metrics.navTiming)
      })
    }
  }

  /**
   * Track performance when routes load
   */
  trackRouteLoad() {
    const navigationStart = performance.now()

    requestAnimationFrame(() => {
      const navigationEnd = performance.now()
      this.metrics.lastRouteLoad = navigationEnd - navigationStart
    })
  }

  /**
   * Track dynamic imports for optimization validation
   * Monitors lazy-loaded libraries (jsPDF, XLSX)
   */
  trackDynamicImports() {
    const originalImport = window.import

    // Track individual dynamic imports via performance API
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          entries.forEach((entry) => {
            if (entry.name.includes('jspdf') || entry.name.includes('xlsx')) {
              this.metrics.dynamicImports = this.metrics.dynamicImports || []
              this.metrics.dynamicImports.push({
                name: entry.name,
                duration: entry.duration,
                timestamp: entry.startTime
              })
            }
          })
        })
        resourceObserver.observe({ type: 'resource', buffered: true })
      } catch (e) {
        console.warn('Resource observer failed:', e)
      }
    }
  }

  /**
   * Track performance for a specific route
   * @param {string} routeName - Name of the route
   * @param {number} duration - How long the route took to load
   */
  trackRouteMetric(routeName, duration) {
    if (!this.routeMetrics[routeName]) {
      this.routeMetrics[routeName] = []
    }
    this.routeMetrics[routeName].push({
      duration,
      timestamp: new Date().toISOString()
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] Route ${routeName}: ${Math.round(duration)}ms`)
    }
  }

  /**
   * Track dynamic import load time
   * @param {string} libraryName - Name of the dynamic import
   * @param {number} loadTime - Time it took to load
   */
  trackDynamicImportLoad(libraryName, loadTime) {
    if (!this.metrics.dynamicImportMetrics) {
      this.metrics.dynamicImportMetrics = {}
    }
    this.metrics.dynamicImportMetrics[libraryName] = {
      loadTime,
      timestamp: new Date().toISOString()
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] Dynamic import ${libraryName}: ${Math.round(loadTime)}ms`)
    }
  }

  /**
   * Rate LCP performance (good < 2500ms, needs improvement < 4000ms)
   */
  rateLCP(value) {
    if (value < 2500) return 'good'
    if (value < 4000) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Rate FID performance (good < 100ms, needs improvement < 300ms)
   */
  rateFID(value) {
    if (value < 100) return 'good'
    if (value < 300) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Rate CLS performance (good < 0.1, needs improvement < 0.25)
   */
  rateCLS(value) {
    if (value < 0.1) return 'good'
    if (value < 0.25) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Rate FCP performance
   */
  rateFCP(value) {
    if (value < 1800) return 'good'
    if (value < 3000) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Rate TTI performance
   */
  rateTTI(value) {
    if (value < 2000) return 'good'
    if (value < 3500) return 'needs-improvement'
    return 'poor'
  }

  /**
   * Send metrics to analytics service
   * Override this to integrate with your analytics platform
   */
  sendMetricToAnalytics(metricName, data) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${metricName}:`, data)
    }

    // Send to analytics endpoint (e.g., Google Analytics, Mixpanel, etc.)
    if (window.gtag) {
      window.gtag('event', `perf_${metricName}`, {
        value: data.value,
        rating: data.rating
      })
    }
  }

  /**
   * Get all collected metrics
   */
  getMetrics() {
    return { ...this.metrics }
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const routeMetricsSummary = Object.entries(this.routeMetrics).reduce((acc, [route, metrics]) => {
      const durations = metrics.map(m => m.duration)
      acc[route] = {
        count: durations.length,
        avg: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        min: Math.round(Math.min(...durations)),
        max: Math.round(Math.max(...durations))
      }
      return acc
    }, {})

    return {
      coreWebVitals: {
        lcp: this.metrics.lcp,
        fid: this.metrics.fid,
        cls: this.metrics.cls,
        fcp: this.metrics.fcp
      },
      customMetrics: {
        tti: this.metrics.tti,
        navTiming: this.metrics.navTiming,
        dynamicImportMetrics: this.metrics.dynamicImportMetrics
      },
      routeMetrics: routeMetricsSummary,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Export metrics for analytics
   * @returns {Object} - All collected metrics
   */
  exportMetrics() {
    return {
      metrics: this.metrics,
      routeMetrics: this.routeMetrics,
      summary: this.getSummary(),
      exportDate: new Date().toISOString()
    }
  }

  /**
   * Clear metrics
   */
  reset() {
    this.metrics = {}
    this.routeMetrics = {}
    this.startTime = performance.now()
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor()

export default performanceMonitor
export { PerformanceMonitor }
