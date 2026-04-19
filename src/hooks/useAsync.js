import { useEffect, useState, useCallback, useRef } from 'react';
import { logger } from '../lib/logger';

/**
 * Custom hook for handling async operations
 * Manages loading, error, and data states automatically
 *
 * @param {Function} asyncFunction - Async function to execute
 * @param {boolean} immediate - Execute immediately on mount (default: true)
 * @param {Array} dependencies - Dependencies array for re-execution
 * @returns {Object} { data, loading, error, execute, reset }
 *
 * @example
 * const { data, loading, error } = useAsync(fetchProjects);
 * const { data, loading, error, execute } = useAsync(fetchProjects, false);
 * execute(filterId); // Manual execution with arguments
 */
export function useAsync(asyncFunction, immediate = true, dependencies = []) {
  const [state, setState] = useState({
    data: null,
    loading: immediate,
    error: null,
  });

  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);

  const execute = useCallback(
    async (...args) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        const result = await asyncFunction(...args);

        if (isMounted.current && !abortControllerRef.current.signal.aborted) {
          setState((prev) => ({
            ...prev,
            data: result,
            loading: false,
          }));
        }

        return result;
      } catch (error) {
        // Don't update state if request was aborted or component unmounted
        if (!isMounted.current || abortControllerRef.current?.signal.aborted) {
          return;
        }

        logger.error('useAsync error', error, { function: asyncFunction.name });

        setState((prev) => ({
          ...prev,
          error,
          loading: false,
        }));

        throw error;
      }
    },
    [asyncFunction],
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    isMounted.current = true;

    if (immediate) {
      execute();
    }

    return () => {
      isMounted.current = false;
      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [execute, immediate, ...dependencies]);

  return { ...state, execute, reset };
}

export default useAsync;
