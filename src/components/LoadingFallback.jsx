import React from 'react'
import { Loader } from 'lucide-react'

/**
 * Loading fallback component for lazy-loaded routes
 * Displays a spinner while route component is being loaded
 *
 * OPTIMIZATION: Memoized stateless component to prevent re-renders during suspense
 */
function LoadingFallbackComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader className="w-12 h-12 text-blue-600 animate-spin" />
          <div className="absolute inset-0 bg-blue-600 rounded-full opacity-10 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-700">Loading page...</p>
          <p className="text-sm text-slate-500 mt-1">Please wait while we prepare your content</p>
        </div>
      </div>
    </div>
  )
}

// Memoize as it has no props and should never re-render
export const LoadingFallback = React.memo(LoadingFallbackComponent)
LoadingFallback.displayName = 'LoadingFallback'

/**
 * Lightweight fallback for faster perceived performance
 *
 * OPTIMIZATION: Memoized minimal loading component
 */
function MinimalLoadingFallbackComponent() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  )
}

// Memoize minimal loader
export const MinimalLoadingFallback = React.memo(MinimalLoadingFallbackComponent)
MinimalLoadingFallback.displayName = 'MinimalLoadingFallback'
