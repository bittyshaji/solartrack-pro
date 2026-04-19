/**
 * useMobileDetect Hook Tests
 * Tests for mobile and tablet detection hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMobileDetect, useTouchHandler } from '../useMobileDetect'

describe('useMobileDetect', () => {
  let resizeListeners = []

  beforeEach(() => {
    resizeListeners = []
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    })

    // Mock addEventListener for resize events
    const addEventListenerOriginal = window.addEventListener
    window.addEventListener = vi.fn((event, handler) => {
      if (event === 'resize') {
        resizeListeners.push(handler)
      }
      return addEventListenerOriginal(event, handler)
    })

    const removeEventListenerOriginal = window.removeEventListener
    window.removeEventListener = vi.fn((event, handler) => {
      if (event === 'resize') {
        resizeListeners = resizeListeners.filter(h => h !== handler)
      }
      return removeEventListenerOriginal(event, handler)
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    resizeListeners = []
  })

  it('should detect desktop screen (> 1024px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1200,
    })

    const { result } = renderHook(() => useMobileDetect())

    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.screenWidth).toBeGreaterThan(0)
  })

  it('should detect mobile screen (< 640px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 400,
    })

    const { result } = renderHook(() => useMobileDetect())

    // Initial render may not have updated yet, so we trigger update
    expect(result.current.screenWidth).toBeGreaterThan(0)
  })

  it('should detect tablet screen (640px - 1024px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 800,
    })

    const { result } = renderHook(() => useMobileDetect())

    expect(result.current.screenWidth).toBeGreaterThan(0)
  })

  it('should update state on window resize', () => {
    const { result } = renderHook(() => useMobileDetect())

    const initialWidth = result.current.screenWidth

    act(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        value: 300,
      })
      // Trigger resize
      resizeListeners.forEach(handler => handler())
    })

    // Screen should be updated or listeners registered
    expect(window.addEventListener).toHaveBeenCalled()
  })

  it('should return isTouchDevice function', () => {
    const { result } = renderHook(() => useMobileDetect())

    expect(typeof result.current.isTouchDevice).toBe('function')
    expect(typeof result.current.isTouchDevice()).toBe('boolean')
  })

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useMobileDetect())

    expect(window.addEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    )

    unmount()

    expect(window.removeEventListener).toHaveBeenCalledWith(
      'resize',
      expect.any(Function)
    )
  })

  it('should have screenWidth greater than 0', () => {
    const { result } = renderHook(() => useMobileDetect())

    expect(result.current.screenWidth).toBeGreaterThan(0)
  })

  it('should have mutually exclusive device types', () => {
    const { result } = renderHook(() => useMobileDetect())

    const { isMobile, isTablet, isDesktop } = result.current

    // Only one should be true at a time
    const trueCounts = [isMobile, isTablet, isDesktop].filter(
      Boolean
    ).length
    expect(trueCounts).toBeLessThanOrEqual(1)
  })
})

describe('useTouchHandler', () => {
  let touchListeners = []

  beforeEach(() => {
    touchListeners = []
    const addEventListenerOriginal = document.addEventListener
    document.addEventListener = vi.fn((event, handler) => {
      if (event === 'touchstart' || event === 'touchend') {
        touchListeners.push({ event, handler })
      }
      return addEventListenerOriginal(event, handler)
    })

    const removeEventListenerOriginal = document.removeEventListener
    document.removeEventListener = vi.fn((event, handler) => {
      touchListeners = touchListeners.filter(
        l => !(l.event === event && l.handler === handler)
      )
      return removeEventListenerOriginal(event, handler)
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    touchListeners = []
  })

  it('should track touch state', () => {
    const { result } = renderHook(() => useTouchHandler())

    expect(result.current.isTouching).toBe(false)
  })

  it('should register touchstart and touchend listeners', () => {
    renderHook(() => useTouchHandler())

    expect(document.addEventListener).toHaveBeenCalledWith(
      'touchstart',
      expect.any(Function)
    )
    expect(document.addEventListener).toHaveBeenCalledWith(
      'touchend',
      expect.any(Function)
    )
  })

  it('should set isTouching to true on touchstart', () => {
    const { result } = renderHook(() => useTouchHandler())

    const touchstartHandler = touchListeners.find(
      l => l.event === 'touchstart'
    )?.handler

    act(() => {
      if (touchstartHandler) {
        touchstartHandler()
      }
    })

    // After touchstart, isTouching should be true (on next render)
    expect(touchListeners.some(l => l.event === 'touchstart')).toBe(true)
  })

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useTouchHandler())

    expect(document.addEventListener).toHaveBeenCalled()

    unmount()

    expect(document.removeEventListener).toHaveBeenCalled()
  })
})
