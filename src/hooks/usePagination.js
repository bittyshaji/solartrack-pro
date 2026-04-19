import { useState, useCallback, useMemo } from 'react';
import { PAGINATION } from '../config/constants';

/**
 * Custom hook for pagination logic
 * Manages current page, page size, and pagination calculations
 *
 * @param {Array} items - Array of items to paginate
 * @param {number} initialPageSize - Initial page size (default: 25)
 * @param {number} initialPage - Initial page number (default: 1)
 * @returns {Object} Pagination state and methods
 *
 * @example
 * const {
 *   currentPage,
 *   pageSize,
 *   paginatedItems,
 *   totalPages,
 *   goToPage,
 *   nextPage,
 *   prevPage,
 *   setPageSize,
 * } = usePagination(allItems, 25);
 */
export function usePagination(
  items = [],
  initialPageSize = PAGINATION.DEFAULT_PAGE_SIZE,
  initialPage = 1,
) {
  const [currentPage, setCurrentPage] = useState(
    Math.max(1, Math.min(initialPage, Math.ceil(items.length / initialPageSize))),
  );
  const [pageSize, setPageSizeState] = useState(
    Math.max(PAGINATION.MIN_PAGE_SIZE, Math.min(initialPageSize, PAGINATION.MAX_PAGE_SIZE)),
  );

  /**
   * Calculate total pages
   */
  const totalPages = useMemo(() => {
    return Math.ceil(items.length / pageSize);
  }, [items.length, pageSize]);

  /**
   * Get current page items
   */
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, pageSize]);

  /**
   * Get pagination info
   */
  const paginationInfo = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, items.length);

    return {
      startIndex: items.length > 0 ? startIndex : 0,
      endIndex,
      totalItems: items.length,
      totalPages,
      currentPage,
      pageSize,
    };
  }, [currentPage, pageSize, items.length, totalPages]);

  /**
   * Go to specific page
   */
  const goToPage = useCallback(
    (page) => {
      const pageNum = Math.max(1, Math.min(page, totalPages));
      setCurrentPage(pageNum);
    },
    [totalPages],
  );

  /**
   * Go to next page
   */
  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  /**
   * Go to previous page
   */
  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  /**
   * Set page size and reset to first page
   */
  const setPageSize = useCallback(
    (newSize) => {
      const validSize = Math.max(PAGINATION.MIN_PAGE_SIZE, Math.min(newSize, PAGINATION.MAX_PAGE_SIZE));
      setPageSizeState(validSize);
      setCurrentPage(1);
    },
    [],
  );

  /**
   * Check if on first page
   */
  const isFirstPage = currentPage === 1;

  /**
   * Check if on last page
   */
  const isLastPage = currentPage === totalPages;

  /**
   * Reset to first page
   */
  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    // State
    currentPage,
    pageSize,
    totalPages,
    paginatedItems,

    // Info
    ...paginationInfo,
    isFirstPage,
    isLastPage,

    // Methods
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    reset,
  };
}

export default usePagination;
