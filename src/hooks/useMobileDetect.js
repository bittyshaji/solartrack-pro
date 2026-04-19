/**
 * Mobile Detection Hook
 * Detects mobile device and provides mobile-specific utilities
 */

import { useState, useEffect } from 'react'

export function useMobileDetect() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  )

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    // Mobile: < 640px (Tailwind sm)
    // Tablet: 640px - 1024px (Tailwind sm-lg)
    // Desktop: > 1024px (Tailwind lg)
    setIsMobile(screenWidth < 640)
    setIsTablet(screenWidth >= 640 && screenWidth < 1024)
  }, [screenWidth])

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    screenWidth,
    isTouchDevice: () => {
      return (
        typeof window !== 'undefined' &&
        (('ontouchstart' in window) ||
          (navigator.maxTouchPoints > 0) ||
          (navigator.msMaxTouchPoints > 0))
      )
    },
  }
}

/**
 * Hook to handle touch and mobile interactions
 */
export function useTouchHandler() {
  const [isTouching, setIsTouching] = useState(false)

  const handleTouchStart = () => {
    setIsTouching(true)
  }

  const handleTouchEnd = () => {
    setIsTouching(false)
  }

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  return { isTouching }
}
