/**
 * useOfflineStatus Hook
 * Detects online/offline status and updates component when status changes
 */

import { useState, useEffect } from 'react'
import { subscribeToOnlineStatus } from '../lib/pwaService'

/**
 * Hook to track online/offline status
 * Returns: { isOnline: boolean, isOffline: boolean }
 */
export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = subscribeToOnlineStatus(setIsOnline)

    // Cleanup on unmount
    return () => {
      unsubscribe()
    }
  }, [])

  return {
    isOnline,
    isOffline: !isOnline,
  }
}

/**
 * Component to show offline banner
 */
export function OfflineIndicator({ position = 'top' }) {
  const { isOffline } = useOfflineStatus()

  if (!isOffline) {
    return null
  }

  const baseClasses = 'fixed left-0 right-0 bg-red-500 text-white py-2 px-4 text-center text-sm'
  const positionClasses = position === 'top' ? 'top-0 z-50' : 'bottom-0 z-40'

  return (
    <div className={`${baseClasses} ${positionClasses}`}>
      <span>📡 Offline Mode - Changes will sync when you're back online</span>
    </div>
  )
}

/**
 * Wrapper component that adds offline indicator
 */
export function WithOfflineIndicator({ children, position = 'top' }) {
  return (
    <>
      <OfflineIndicator position={position} />
      {children}
    </>
  )
}
