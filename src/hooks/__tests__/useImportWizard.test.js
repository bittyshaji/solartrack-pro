/**
 * Tests for useImportWizard hook
 */

import { renderHook, act } from '@testing-library/react';
import useImportWizard from '../useImportWizard';

describe('useImportWizard', () => {
  const STEPS = useImportWizard().STEPS;

  describe('initialization', () => {
    it('should initialize with FILE_UPLOAD step', () => {
      const { result } = renderHook(() => useImportWizard());
      expect(result.current.currentStep).toBe(STEPS.FILE_UPLOAD);
    });

    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useImportWizard());
      expect(result.current.file).toBeNull();
      expect(result.current.parsedData).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should initialize with projects import type', () => {
      const { result } = renderHook(() => useImportWizard());
      expect(result.current.importType).toBe('projects');
    });
  });

  describe('file validation', () => {
    it('should reject non-CSV/XLSX files', () => {
      const { result } = renderHook(() => useImportWizard());
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      act(() => {
        result.current.handleFileSelect(invalidFile);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.file).toBeNull();
    });

    it('should reject files over 50MB', () => {
      const { result } = renderHook(() => useImportWizard());
      const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large.csv', {
        type: 'text/csv'
      });

      act(() => {
        result.current.handleFileSelect(largeFile);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.file).toBeNull();
    });

    it('should accept valid CSV files', () => {
      const { result } = renderHook(() => useImportWizard());
      const validFile = new File(['test'], 'test.csv', { type: 'text/csv' });

      act(() => {
        result.current.handleFileSelect(validFile);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.file).toBe(validFile);
    });
  });

  describe('import type switching', () => {
    it('should switch between projects and customers', () => {
      const { result } = renderHook(() => useImportWizard());

      expect(result.current.importType).toBe('projects');

      act(() => {
        result.current.setImportType('customers');
      });

      expect(result.current.importType).toBe('customers');
    });
  });

  describe('header mapping', () => {
    it('should update header mapping', () => {
      const { result } = renderHook(() => useImportWizard());

      act(() => {
        result.current.updateHeaderMapping('csv_name', 'name');
      });

      expect(result.current.headerMapping.csv_name).toBe('name');
    });

    it('should allow removing header mappings', () => {
      const { result } = renderHook(() => useImportWizard());

      act(() => {
        result.current.updateHeaderMapping('csv_name', 'name');
        result.current.updateHeaderMapping('csv_name', '');
      });

      expect(result.current.headerMapping.csv_name).toBe('');
    });
  });

  describe('navigation', () => {
    it('should navigate to next step', () => {
      const { result } = renderHook(() => useImportWizard());
      const validFile = new File(['test'], 'test.csv', { type: 'text/csv' });

      act(() => {
        result.current.handleFileSelect(validFile);
      });

      expect(result.current.getStepIndex()).toBe(0);
    });

    it('should navigate to previous step', () => {
      const { result } = renderHook(() => useImportWizard());

      act(() => {
        result.current.setCurrentStep(STEPS.DATA_PREVIEW);
      });

      expect(result.current.currentStep).toBe(STEPS.DATA_PREVIEW);

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(STEPS.FILE_UPLOAD);
    });

    it('should not navigate before first step', () => {
      const { result } = renderHook(() => useImportWizard());

      act(() => {
        result.current.prevStep();
      });

      expect(result.current.currentStep).toBe(STEPS.FILE_UPLOAD);
    });
  });

  describe('reset', () => {
    it('should reset wizard to initial state', () => {
      const { result } = renderHook(() => useImportWizard());
      const testFile = new File(['test'], 'test.csv', { type: 'text/csv' });

      act(() => {
        result.current.handleFileSelect(testFile);
        result.current.setImportType('customers');
      });

      expect(result.current.file).toBe(testFile);
      expect(result.current.importType).toBe('customers');

      act(() => {
        result.current.reset();
      });

      expect(result.current.file).toBeNull();
      expect(result.current.importType).toBe('projects');
      expect(result.current.currentStep).toBe(STEPS.FILE_UPLOAD);
      expect(result.current.error).toBeNull();
    });
  });

  describe('step index', () => {
    it('should return correct step index', () => {
      const { result } = renderHook(() => useImportWizard());

      expect(result.current.getStepIndex()).toBe(0);

      act(() => {
        result.current.setCurrentStep(STEPS.DATA_PREVIEW);
      });

      expect(result.current.getStepIndex()).toBe(1);

      act(() => {
        result.current.setCurrentStep(STEPS.RESULTS);
      });

      expect(result.current.getStepIndex()).toBe(5);
    });
  });

  describe('dry run', () => {
    it('should toggle dry run mode', () => {
      const { result } = renderHook(() => useImportWizard());

      expect(result.current.isDryRun).toBe(false);

      act(() => {
        result.current.setIsDryRun(true);
      });

      expect(result.current.isDryRun).toBe(true);
    });
  });
});
