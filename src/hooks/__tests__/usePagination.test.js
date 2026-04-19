/**
 * Tests for usePagination hook
 */

import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  const mockData = Array.from({ length: 50 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

  describe('initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.totalItems).toBe(50);
      expect(result.current.totalPages).toBe(5);
    });

    it('should initialize with custom page size', () => {
      const { result } = renderHook(() => usePagination(mockData, 25));

      expect(result.current.pageSize).toBe(25);
      expect(result.current.totalPages).toBe(2);
    });

    it('should calculate correct total pages', () => {
      const { result } = renderHook(() => usePagination(mockData, 15));

      expect(result.current.totalPages).toBe(4); // 50 / 15 = 3.33, rounded up to 4
    });
  });

  describe('getCurrentPageData', () => {
    it('should return first page data initially', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      const pageData = result.current.getCurrentPageData();

      expect(pageData).toHaveLength(10);
      expect(pageData[0].id).toBe(1);
      expect(pageData[9].id).toBe(10);
    });

    it('should return correct data for different pages', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.goToPage(2);
      });

      const pageData = result.current.getCurrentPageData();

      expect(pageData).toHaveLength(10);
      expect(pageData[0].id).toBe(11);
      expect(pageData[9].id).toBe(20);
    });

    it('should return correct data for last page with partial data', () => {
      const { result } = renderHook(() => usePagination(mockData, 15));

      act(() => {
        result.current.goToPage(4);
      });

      const pageData = result.current.getCurrentPageData();

      expect(pageData).toHaveLength(5); // 50 % 15 = 5
      expect(pageData[0].id).toBe(46);
      expect(pageData[4].id).toBe(50);
    });
  });

  describe('navigation', () => {
    it('should go to next page', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      expect(result.current.currentPage).toBe(1);

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);
    });

    it('should go to previous page', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.currentPage).toBe(3);

      act(() => {
        result.current.prevPage();
      });

      expect(result.current.currentPage).toBe(2);
    });

    it('should go to specific page', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.goToPage(4);
      });

      expect(result.current.currentPage).toBe(4);
    });

    it('should not go beyond total pages', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.nextPage(); // page 2
        result.current.nextPage(); // page 3
        result.current.nextPage(); // page 4
        result.current.nextPage(); // page 5
        result.current.nextPage(); // try page 6, but should stay at 5
      });

      expect(result.current.currentPage).toBe(5);
    });

    it('should not go below page 1', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.prevPage(); // should stay at 1
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('should not go to invalid page number', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.goToPage(10); // should stay at 1
      });

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset to first page', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      act(() => {
        result.current.goToPage(3);
      });

      expect(result.current.currentPage).toBe(3);

      act(() => {
        result.current.reset();
      });

      expect(result.current.currentPage).toBe(1);
    });
  });

  describe('hasNextPage and hasPrevPage', () => {
    it('should indicate if next page exists', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      expect(result.current.hasNextPage).toBe(true);

      act(() => {
        result.current.goToPage(5);
      });

      expect(result.current.hasNextPage).toBe(false);
    });

    it('should indicate if previous page exists', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      expect(result.current.hasPrevPage).toBe(false);

      act(() => {
        result.current.goToPage(2);
      });

      expect(result.current.hasPrevPage).toBe(true);
    });
  });

  describe('getPageNumbers', () => {
    it('should return array of page numbers', () => {
      const { result } = renderHook(() => usePagination(mockData, 10));

      const pageNumbers = result.current.getPageNumbers();

      expect(pageNumbers).toEqual([1, 2, 3, 4, 5]);
    });

    it('should handle window parameter for large page counts', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
      const { result } = renderHook(() => usePagination(largeData, 10));

      const pageNumbers = result.current.getPageNumbers(2);

      // Should return pages around current page (1) with window of 2
      expect(pageNumbers.length).toBeLessThanOrEqual(5);
      expect(pageNumbers).toContain(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty data', () => {
      const { result } = renderHook(() => usePagination([], 10));

      expect(result.current.totalPages).toBe(0);
      expect(result.current.getCurrentPageData()).toEqual([]);
    });

    it('should handle single page', () => {
      const singlePageData = Array.from({ length: 5 }, (_, i) => ({ id: i + 1 }));
      const { result } = renderHook(() => usePagination(singlePageData, 10));

      expect(result.current.totalPages).toBe(1);
      expect(result.current.getCurrentPageData()).toHaveLength(5);
    });

    it('should handle data with size equal to page size', () => {
      const exactData = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));
      const { result } = renderHook(() => usePagination(exactData, 10));

      expect(result.current.totalPages).toBe(1);
      expect(result.current.getCurrentPageData()).toHaveLength(10);
    });
  });

  describe('reactive updates', () => {
    it('should update when data changes', () => {
      const { result, rerender } = renderHook(
        ({ data, pageSize }) => usePagination(data, pageSize),
        {
          initialProps: { data: mockData, pageSize: 10 },
        },
      );

      expect(result.current.totalItems).toBe(50);

      const newData = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
      rerender({ data: newData, pageSize: 10 });

      expect(result.current.totalItems).toBe(100);
      expect(result.current.totalPages).toBe(10);
    });

    it('should update when page size changes', () => {
      const { result, rerender } = renderHook(
        ({ data, pageSize }) => usePagination(data, pageSize),
        {
          initialProps: { data: mockData, pageSize: 10 },
        },
      );

      expect(result.current.pageSize).toBe(10);
      expect(result.current.totalPages).toBe(5);

      rerender({ data: mockData, pageSize: 25 });

      expect(result.current.pageSize).toBe(25);
      expect(result.current.totalPages).toBe(2);
    });
  });
});
