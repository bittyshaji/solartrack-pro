import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing localStorage with React state
 * Automatically syncs state with localStorage and handles serialization
 *
 * @param {string} key - The localStorage key to use
 * @param {*} initialValue - Initial value if key doesn't exist in localStorage
 * @returns {Array} [storedValue, setValue, removeValue]
 *
 * @example
 * const [name, setName, removeName] = useLocalStorage('userName', 'Guest');
 *
 * // Gets from localStorage if it exists, otherwise uses 'Guest'
 * // Updates localStorage automatically when setValue is called
 * // removeName() clears the value from localStorage
 *
 * @example
 * // With complex objects
 * const [user, setUser] = useLocalStorage('user', { name: '', email: '' });
 * setUser({ name: 'John', email: 'john@example.com' });
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Check if localStorage is available
      if (typeof window === 'undefined') {
        return initialValue;
      }

      const item = window.localStorage.getItem(key);

      // If item exists, parse and return it
      if (item) {
        return JSON.parse(item);
      }

      // Otherwise return initial value
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = useCallback(
    (value) => {
      try {
        // Allow value to be a function like useState
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        // Save to localStorage
        if (typeof window !== 'undefined') {
          if (valueToStore === null || valueToStore === undefined) {
            window.localStorage.removeItem(key);
          } else {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  // Function to remove the value from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(null);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key]);

  // Listen for storage changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing storage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for session storage with the same API as useLocalStorage
 *
 * @param {string} key - The sessionStorage key to use
 * @param {*} initialValue - Initial value if key doesn't exist
 * @returns {Array} [storedValue, setValue, removeValue]
 *
 * @example
 * const [tempData, setTempData, removeTempData] = useSessionStorage('tempData', {});
 */
export function useSessionStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }

      const item = window.sessionStorage.getItem(key);

      if (item) {
        return JSON.parse(item);
      }

      return initialValue;
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          if (valueToStore === null || valueToStore === undefined) {
            window.sessionStorage.removeItem(key);
          } else {
            window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
          }
        }
      } catch (error) {
        console.error(`Error setting sessionStorage key "${key}":`, error);
      }
    },
    [key, storedValue],
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(null);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;
