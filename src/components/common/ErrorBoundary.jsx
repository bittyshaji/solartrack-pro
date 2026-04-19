import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '../../lib/logger';

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the application and displays a fallback UI
 *
 * @component
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  /**
   * Create an ErrorBoundary
   * @param {Object} props - Component props
   */
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      isRecovering: false,
    };
  }

  /**
   * Update state so the next render will show the fallback UI
   * @static
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state
   */
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  /**
   * Log error details
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Error info from React
   */
  componentDidCatch(error, errorInfo) {
    const errorCount = this.state.errorCount + 1;

    this.setState({
      error,
      errorInfo,
      errorCount,
    });

    // Log error with context
    logger.exception(error, {
      errorBoundaryCount: errorCount,
      componentStack: errorInfo?.componentStack,
      source: 'ErrorBoundary',
    });

    // Auto-reset after a delay to avoid infinite loops
    // Only reset if error count is below threshold (3)
    if (errorCount < 3) {
      this.resetErrorTimer = setTimeout(() => {
        if (this.state.hasError && this.state.errorCount === errorCount) {
          this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
          });
        }
      }, 30000); // 30 seconds
    }
  }

  /**
   * Clear reset timer on unmount
   */
  componentWillUnmount() {
    if (this.resetErrorTimer) {
      clearTimeout(this.resetErrorTimer);
    }
  }

  /**
   * Handle manual page reload
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      isRecovering: true,
    });

    // Reload after a brief delay to allow state to update
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  /**
   * Navigate to home page
   */
  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });

    window.location.href = '/';
  };

  /**
   * Copy error to clipboard for support
   */
  handleCopyError = async () => {
    const errorText = `
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
URL: ${window.location.href}
Time: ${new Date().toISOString()}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      alert('Error details copied to clipboard');
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  /**
   * Render error UI
   */
  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      const errorMessage = this.state.error?.message || 'An unexpected error occurred';
      const errorCount = this.state.errorCount;

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-red-100 p-4">
                <AlertTriangle className="text-red-600" size={48} strokeWidth={1.5} />
              </div>
            </div>

            {/* Error Heading */}
            <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Something went wrong
            </h1>

            {/* Error Description */}
            <p className="text-gray-600 text-center mb-4">
              We're sorry for the inconvenience. Our team has been notified of this error.
              {errorCount > 1 && (
                <span className="block text-xs mt-2 text-orange-600">
                  (Error occurred {errorCount} times)
                </span>
              )}
            </p>

            {/* Development Error Details */}
            {isDev && this.state.errorInfo && (
              <details className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <summary className="font-semibold cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                  Error Details (Dev Mode)
                </summary>
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-mono bg-gray-100 p-2 rounded overflow-auto max-h-40 text-red-600">
                    <p className="font-bold mb-1">Error Message:</p>
                    <p className="break-words">{errorMessage}</p>
                  </div>

                  {this.state.errorInfo.componentStack && (
                    <div className="text-xs font-mono bg-gray-100 p-2 rounded overflow-auto max-h-32 text-gray-700">
                      <p className="font-bold mb-1">Component Stack:</p>
                      <pre className="whitespace-pre-wrap break-words">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                disabled={this.state.isRecovering}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
              >
                <RefreshCw size={18} />
                {this.state.isRecovering ? 'Reloading...' : 'Reload Page'}
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
              >
                <Home size={18} />
                Go to Home
              </button>

              {isDev && (
                <button
                  onClick={this.handleCopyError}
                  className="text-xs text-gray-600 hover:text-gray-800 py-1.5 px-3 rounded border border-gray-300 hover:border-gray-400 transition-colors"
                >
                  Copy Error Details
                </button>
              )}
            </div>

            {/* Footer Help Text */}
            <p className="text-xs text-gray-500 text-center mt-6">
              If this problem persists, please contact{' '}
              <a href="mailto:support@solartrack.com" className="text-blue-600 hover:underline">
                support@solartrack.com
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
