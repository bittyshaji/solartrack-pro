/**
 * ErrorBoundary Component Tests
 * Tests for error handling and recovery
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

// Suppress console.error during error boundary tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = vi.fn()
})

afterAll(() => {
  console.error = originalConsoleError
})

// Component that throws an error
const ThrowError = () => {
  throw new Error('Test error')
}

// Component that works normally
const WorkingComponent = () => <div>Working content</div>

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Working content')).toBeInTheDocument()
  })

  it('should catch and display errors', () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(container.textContent).toContain('Error')
  })

  it('should display error message', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('should provide retry functionality', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const retryButton = screen.getByRole('button', { name: /try again/i })
    expect(retryButton).toBeInTheDocument()
  })

  it('should handle multiple errors', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(console.error).toHaveBeenCalled()

    rerender(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Working content')).toBeInTheDocument()
  })

  it('should reset error state', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/error/i)).toBeInTheDocument()

    rerender(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Working content')).toBeInTheDocument()
  })

  it('should call onError callback when provided', () => {
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalled()
  })

  it('should accept custom fallback UI', () => {
    const CustomFallback = () => <div>Custom error UI</div>

    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error UI')).toBeInTheDocument()
  })

  it('should handle async errors', async () => {
    const AsyncComponent = () => {
      const [error, setError] = React.useState(false)

      React.useEffect(() => {
        setError(true)
      }, [])

      if (error) throw new Error('Async error')

      return <div>Async content</div>
    }

    const { container } = render(
      <ErrorBoundary>
        <AsyncComponent />
      </ErrorBoundary>
    )

    await screen.findByText(/error/i)
    expect(container.textContent).toContain('Error')
  })

  it('should display error details in development', () => {
    render(
      <ErrorBoundary showDetails={true}>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('should log errors to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(console.error).toHaveBeenCalled()
  })
})
