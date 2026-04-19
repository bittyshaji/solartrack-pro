/**
 * React Memoization Patterns and Utilities
 * Provides helpers for implementing React.memo, useMemo, and useCallback
 *
 * This module helps prevent unnecessary re-renders by:
 * 1. Memoizing components that receive complex props
 * 2. Memoizing expensive computations with useMemo
 * 3. Stabilizing callback functions with useCallback
 * 4. Implementing custom prop comparison logic
 */

import React, { useMemo, useCallback } from 'react';

/**
 * createMemoComponent - Create a memoized component with optional custom comparison
 *
 * @param {React.ComponentType} Component - The component to memoize
 * @param {Function} propsComparator - Optional custom comparison function
 *                                     Default: shallow equality comparison
 * @returns {React.MemoExoticComponent} Memoized component
 *
 * @example
 * // Basic memoization with shallow equality
 * const MemoizedButton = createMemoComponent(Button);
 *
 * // Custom comparison for specific props
 * const MemoizedCard = createMemoComponent(
 *   Card,
 *   (prevProps, nextProps) => {
 *     return (
 *       prevProps.id === nextProps.id &&
 *       prevProps.title === nextProps.title
 *       // ignore other props
 *     );
 *   }
 * );
 */
export function createMemoComponent(Component, propsComparator = null) {
  const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
    if (propsComparator) {
      return propsComparator(prevProps, nextProps);
    }

    // Default shallow equality comparison
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length !== nextKeys.length) {
      return false;
    }

    return prevKeys.every(key => prevProps[key] === nextProps[key]);
  });

  MemoizedComponent.displayName = `Memo(${Component.displayName || Component.name || 'Component'})`;

  return MemoizedComponent;
}

/**
 * useMemoProps - Hook for comparing expensive object props
 *
 * Use this when a component receives complex objects as props and you want
 * to memoize them to prevent child re-renders
 *
 * @param {Object} props - The props object to memoize
 * @param {Array<string>} dependencyKeys - Keys to watch for changes
 * @returns {Object} Memoized props object
 *
 * @example
 * function MyComponent({ user, config, data }) {
 *   const memoizedProps = useMemoProps(
 *     { user, config, data },
 *     ['user.id', 'config.theme', 'data.length']
 *   );
 *
 *   return <ChildComponent {...memoizedProps} />;
 * }
 */
export function useMemoProps(props, dependencyKeys = []) {
  return useMemo(() => {
    return props;
  }, dependencyKeys.length > 0
    ? dependencyKeys.map(key => {
        const keys = key.split('.');
        let value = props;
        for (const k of keys) {
          value = value?.[k];
        }
        return value;
      })
    : [JSON.stringify(props)]
  );
}

/**
 * useCallbackMemo - Memoized callback factory for event handlers
 *
 * Prevents child components from re-rendering due to callback reference changes
 *
 * @param {Function} callback - The callback function
 * @param {Array} dependencies - Dependency array
 * @returns {Function} Memoized callback
 *
 * @example
 * function DataTable({ onRowClick, onSort }) {
 *   const handleRowClick = useCallbackMemo(
 *     (row) => {
 *       console.log('Row clicked:', row);
 *       onRowClick(row);
 *     },
 *     [onRowClick]
 *   );
 *
 *   return <Table onRowClick={handleRowClick} />;
 * }
 */
export function useCallbackMemo(callback, dependencies = []) {
  return useCallback(callback, dependencies);
}

/**
 * useMemoComputation - Memoize expensive computations
 *
 * Use this for:
 * - Data transformations (filtering, sorting, mapping)
 * - Complex calculations
 * - Large array/object operations
 *
 * @param {Function} computeFn - Function that performs the computation
 * @param {Array} dependencies - Dependency array
 * @returns {any} Memoized computation result
 *
 * @example
 * function UserList({ users, searchTerm, sortBy }) {
 *   const filteredUsers = useMemoComputation(() => {
 *     return users
 *       .filter(u => u.name.includes(searchTerm))
 *       .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
 *   }, [users, searchTerm, sortBy]);
 *
 *   return <div>{filteredUsers.map(u => <UserRow key={u.id} user={u} />)}</div>;
 * }
 */
export function useMemoComputation(computeFn, dependencies = []) {
  return useMemo(computeFn, dependencies);
}

/**
 * useArrayMemo - Optimize arrays that trigger re-renders
 *
 * Prevents re-renders when the array content hasn't changed
 *
 * @param {Array} array - The array to memoize
 * @param {string} compareKey - Optional key to compare for object arrays
 * @returns {Array} Memoized array
 *
 * @example
 * function FilteredList({ items }) {
 *   const memoizedItems = useArrayMemo(items, 'id');
 *   return <List items={memoizedItems} />;
 * }
 */
export function useArrayMemo(array, compareKey = null) {
  return useMemo(() => {
    if (!Array.isArray(array)) return [];
    return array;
  }, [
    compareKey
      ? array.length + array.map(item => item[compareKey]).join(',')
      : JSON.stringify(array)
  ]);
}

/**
 * useObjectMemo - Optimize objects that trigger re-renders
 *
 * Prevents re-renders when object properties haven't changed
 *
 * @param {Object} obj - The object to memoize
 * @param {Array<string>} keys - Keys to watch for changes
 * @returns {Object} Memoized object
 *
 * @example
 * function UserCard({ user }) {
 *   const memoizedUser = useObjectMemo(user, ['id', 'name', 'email']);
 *   return <Card user={memoizedUser} />;
 * }
 */
export function useObjectMemo(obj, keys = []) {
  return useMemo(() => {
    return obj;
  }, [
    keys.length > 0
      ? keys.map(k => obj?.[k]).join('|')
      : JSON.stringify(obj)
  ]);
}

/**
 * useEventCallbackFactory - Create stable event handlers
 *
 * Useful for event handlers that need to access current state/props
 * without triggering re-renders
 *
 * @param {Function} handler - The event handler function
 * @param {Array} dependencies - Values to watch
 * @returns {Function} Stable callback reference
 *
 * @example
 * function SearchInput({ onSearch }) {
 *   const handleChange = useEventCallbackFactory(
 *     (e) => {
 *       const value = e.target.value;
 *       onSearch(value);
 *     },
 *     [onSearch]
 *   );
 *
 *   return <input onChange={handleChange} />;
 * }
 */
export function useEventCallbackFactory(handler, dependencies = []) {
  return useCallback(handler, dependencies);
}

/**
 * usePropsMemo - Deep memoization of complex props structure
 *
 * Use when you have deeply nested objects/arrays in props
 *
 * @param {Object} props - Props to memoize
 * @param {Array<string>} paths - Dot notation paths to watch (e.g., ['user.profile.avatar'])
 * @returns {Object} Memoized props
 *
 * @example
 * function ComplexComponent({ data }) {
 *   const memoized = usePropsMemo(
 *     { data },
 *     ['data.user.id', 'data.config.theme']
 *   );
 * }
 */
export function usePropsMemo(props, paths = []) {
  return useMemo(() => props, [
    ...paths.map(path => {
      const keys = path.split('.');
      let value = props;
      for (const key of keys) {
        value = value?.[key];
      }
      return value;
    })
  ]);
}

/**
 * createSelectionMemo - Memoize selector function results
 *
 * Use when deriving data from props/state with a selector function
 *
 * @param {Function} selector - Function that selects/derives data
 * @param {Array} dependencies - Dependency array
 * @returns {any} Memoized selected value
 *
 * @example
 * function UserProfile({ user }) {
 *   const userInitials = createSelectionMemo(
 *     () => {
 *       const [first, last] = user.name.split(' ');
 *       return (first[0] + last[0]).toUpperCase();
 *     },
 *     [user.name]
 *   );
 *
 *   return <Avatar initials={userInitials} />;
 * }
 */
export function createSelectionMemo(selector, dependencies = []) {
  // This should be called within a component with useMemo
  // Returning a factory function
  return useMemo(selector, dependencies);
}

/**
 * Performance Profiling Helper
 * Track render performance of memoized components
 *
 * @example
 * const MemoizedComponent = createMemoComponent(MyComponent);
 * enablePerformanceTracking(MemoizedComponent, 'MyComponent');
 */
export function enablePerformanceTracking(Component, componentName = 'Component') {
  if (process.env.NODE_ENV === 'development') {
    const originalRender = Component.render || Component;

    return (props) => {
      const startTime = performance.now();
      const result = originalRender(props);
      const endTime = performance.now();

      console.debug(
        `[Render] ${componentName} took ${(endTime - startTime).toFixed(2)}ms`,
        { props }
      );

      return result;
    };
  }
  return Component;
}

/**
 * Comparison utilities for custom propsComparator
 */
export const comparators = {
  /**
   * Shallow equality - compares object keys and values one level deep
   */
  shallow: (prevProps, nextProps) => {
    const keys = Object.keys(prevProps);
    return (
      keys.length === Object.keys(nextProps).length &&
      keys.every(key => prevProps[key] === nextProps[key])
    );
  },

  /**
   * Deep equality - compares entire object structure
   */
  deep: (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  },

  /**
   * Select specific keys for comparison
   */
  selectKeys: (keys) => (prevProps, nextProps) => {
    return keys.every(key => prevProps[key] === nextProps[key]);
  },

  /**
   * Ignore specific keys in comparison
   */
  ignoreKeys: (keysToIgnore) => (prevProps, nextProps) => {
    const allKeys = new Set([
      ...Object.keys(prevProps),
      ...Object.keys(nextProps)
    ]);

    return Array.from(allKeys)
      .filter(key => !keysToIgnore.includes(key))
      .every(key => prevProps[key] === nextProps[key]);
  }
};

/**
 * Export default patterns for common use cases
 */
export default {
  createMemoComponent,
  useMemoProps,
  useCallbackMemo,
  useMemoComputation,
  useArrayMemo,
  useObjectMemo,
  useEventCallbackFactory,
  usePropsMemo,
  createSelectionMemo,
  enablePerformanceTracking,
  comparators
};
