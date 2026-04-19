/**
 * Phase 2: Lazy-loaded routes
 * Replace heavy components in your router with these lazy versions
 */

import React from 'react'
import { createLazyRoute } from '@/lib/services/operations/componentSplitting'

// Heavy pages that should be code-split
export const LazyRoutes = {
  // Dashboard
  Dashboard: React.lazy(() => import('@/pages/Dashboard.jsx')),

  // Analytics
  Analytics: React.lazy(() => import('@/pages/Analytics.jsx')),
  Reports: React.lazy(() => import('@/pages/Reports.jsx')),

  // Projects
  ProjectList: React.lazy(() => import('@/pages/Projects/List.jsx')),
  ProjectDetail: React.lazy(() => import('@/pages/Projects/Detail.jsx')),
  ProjectCreate: React.lazy(() => import('@/pages/Projects/Create.jsx')),

  // Admin
  Settings: React.lazy(() => import('@/pages/Settings.jsx')),
  Users: React.lazy(() => import('@/pages/Users.jsx')),
  Audit: React.lazy(() => import('@/pages/Audit.jsx')),
}

/**
 * Example: How to use in your router
 *
 * <Route path="/dashboard" element={
 *   <Suspense fallback={<LoadingScreen />}>
 *     <LazyRoutes.Dashboard />
 *   </Suspense>
 * } />
 */
