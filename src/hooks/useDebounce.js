import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing values
 * Delays updates to a value until the specified delay has passed without changes
 *
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500)
 * @returns {*} The debounced value
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 *
 * // debouncedSearchTerm updates 300ms after user stops typing
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     searchAPI(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timer if the effect is re-run before the delay expires
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Alternative hook that returns both the debounced value and a manual trigger
 *
 * @param {*} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Object} { debouncedValue, trigger }
 *
 * @example
 * const { debouncedValue, trigger } = useDebounceFn(searchTerm, 300);
 * // Manual trigger: trigger(newValue)
 */
export function useDebounceFn(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setIsRunning(true);
    const handler = setTimeout(() => {
      setDebouncedValue(value);
      setIsRunning(false);
    }, delay);

    return () => {
      clearTimeout(handler);
      setIsRunning(false);
    };
  }, [value, delay]);

  const trigger = (newValue) => {
    setDebouncedValue(newValue);
    setIsRunning(false);
  };

  return { debouncedValue, trigger, isRunning };
}

export default useDebounce;
