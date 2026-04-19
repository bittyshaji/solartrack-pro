/**
 * Phase 2: Component Code Splitting Strategy
 * Lazy load large components to reduce initial bundle
 */

import React, { Suspense } from 'react'

/**
 * Smart component splitter - wraps components in lazy loading
 * Usage: const LazyComponent = splitComponent(() => import('./Heavy.jsx'))
 */
export const splitComponent = (importFn, fallback = null) => {
  const Component = React.lazy(importFn)

  return (props) => (
    <Suspense fallback={fallback || <div>Loading...</div>}>
      <Component {...props} />
    </Suspense>
  )
}

/**
 * Routes that benefit from code splitting (Phase 2)
 * These are large components that aren't needed on initial load
 */
export const PHASE_2_SPLIT_TARGETS = {
  // Analytics Dashboard (heavy charts)
  AnalyticsDashboard: () => import('@/components/analytics/AnalyticsDashboard.jsx'),

  // Project Management (forms, workflows)
  ProjectForm: () => import('@/components/projects/ProjectForm/ProjectForm.jsx'),
  ProjectDetailView: () => import('@/components/projects/ProjectDetailView.jsx'),

  // Reports & Exports (heavy processing)
  ReportGenerator: () => import('@/components/reports/ReportGenerator.jsx'),
  BatchExportWizard: () => import('@/components/batch/BatchExportWizard.jsx'),

  // Settings & Configuration
  SettingsPanel: () => import('@/components/settings/SettingsPanel.jsx'),
  UserPreferences: () => import('@/components/user/UserPreferences.jsx'),

  // Modals & Dialogs (heavy content)
  DetailModal: () => import('@/components/modals/DetailModal.jsx'),
  ConfigurationWizard: () => import('@/components/wizards/ConfigurationWizard.jsx'),
}

/**
 * Lazy load routes in React Router
 * Usage in router config: component: splitComponent(() => import('./Page.jsx'))
 */
export const createLazyRoute = (importFn) => {
  const Component = React.lazy(importFn)
  return () => (
    <Suspense fallback={<div>Loading page...</div>}>
      <Component />
    </Suspense>
  )
}

/**
 * Prefetch components for better UX
 * Call this when user hovers over a link to that component
 */
export const prefetchComponent = (importFn) => {
  importFn().catch(() => {
    // Silently fail if prefetch doesn't work
  })
}
