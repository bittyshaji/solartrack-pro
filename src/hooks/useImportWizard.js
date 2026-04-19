/**
 * Custom Hook: useImportWizard
 * Manages state and logic for CSV/XLSX import wizard
 */

import { useState, useCallback } from 'react';
import {
  parseCSVFile,
  parseXLSXFile,
  validateProjectImport,
  validateCustomerImport,
  importProjects,
  importCustomers
} from '@/lib/batchOperationsService';

const STEPS = {
  FILE_UPLOAD: 'file_upload',
  DATA_PREVIEW: 'data_preview',
  VALIDATION: 'validation',
  CONFIRMATION: 'confirmation',
  PROCESSING: 'processing',
  RESULTS: 'results'
};

/**
 * useImportWizard hook
 * Manages wizard state, file parsing, validation, and import logic
 *
 * @returns {Object} Wizard state and handlers
 */
export const useImportWizard = () => {
  const [currentStep, setCurrentStep] = useState(STEPS.FILE_UPLOAD);
  const [file, setFile] = useState(null);
  const [importType, setImportType] = useState('projects');
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [headerMapping, setHeaderMapping] = useState({});
  const [validationResults, setValidationResults] = useState(null);
  const [processingProgress, setProcessingProgress] = useState({});
  const [batchId, setBatchId] = useState(null);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [isDryRun, setIsDryRun] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validate file type and size
   */
  const validateFile = useCallback((selectedFile) => {
    const validTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(selectedFile.type)) {
      return { valid: false, error: 'Please upload a CSV or XLSX file' };
    }

    if (selectedFile.size > maxSize) {
      return { valid: false, error: 'File size exceeds 50MB limit' };
    }

    return { valid: true };
  }, []);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((selectedFile) => {
    const validation = validateFile(selectedFile);

    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setFile(selectedFile);
    setError(null);
  }, [validateFile]);

  /**
   * Parse uploaded file
   */
  const parseFile = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      if (!file) {
        setError('No file selected');
        return;
      }

      let data;
      if (file.type === 'text/csv') {
        data = await parseCSVFile(file);
      } else {
        data = await parseXLSXFile(file);
      }

      if (!data || data.length === 0) {
        setError('File contains no data');
        return;
      }

      setParsedData(data);
      setHeaders(Object.keys(data[0]));

      // Auto-map headers if possible
      const mapping = {};
      const expectedHeaders = importType === 'projects'
        ? ['name', 'customer_id', 'estimated_cost', 'state']
        : ['customer_id', 'name', 'email', 'phone', 'address', 'city', 'state', 'postal_code', 'company'];

      Object.keys(data[0]).forEach(key => {
        if (expectedHeaders.includes(key)) {
          mapping[key] = key;
        }
      });

      setHeaderMapping(mapping);
      setCurrentStep(STEPS.DATA_PREVIEW);
    } catch (err) {
      setError(`Failed to parse file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [file, importType]);

  /**
   * Update header mapping
   */
  const updateHeaderMapping = useCallback((fromHeader, toField) => {
    setHeaderMapping(prev => ({
      ...prev,
      [fromHeader]: toField
    }));
  }, []);

  /**
   * Validate parsed data
   */
  const performValidation = useCallback(() => {
    try {
      setError(null);

      // Remap headers
      const remappedData = parsedData.map(record => {
        const remapped = {};
        Object.entries(headerMapping).forEach(([from, to]) => {
          if (to) {
            remapped[to] = record[from];
          }
        });
        return remapped;
      });

      // Validate
      const results = importType === 'projects'
        ? validateProjectImport(remappedData)
        : validateCustomerImport(remappedData);

      setValidationResults(results);

      // Check for warnings
      const warningsList = [];
      if (results.invalid.length > 0) {
        warningsList.push(`${results.invalid.length} records have validation errors`);
      }
      if (results.valid.length === 0) {
        warningsList.push('No valid records to import');
      }

      setWarnings(warningsList);
      setCurrentStep(STEPS.VALIDATION);
    } catch (err) {
      setError(`Validation failed: ${err.message}`);
    }
  }, [parsedData, headerMapping, importType]);

  /**
   * Start import process
   */
  const startImport = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);
      setCurrentStep(STEPS.PROCESSING);

      if (!validationResults) {
        setError('No validation results available');
        return;
      }

      const validRecords = validationResults.valid.map(v => v.data);

      const onProgress = (progress) => {
        const processed = progress.processedCount;
        const total = progress.totalRecords || parsedData.length;
        const elapsed = Date.now() - (progress.startedAt || Date.now());
        const rate = processed / (elapsed / 1000);
        const remaining = Math.ceil((total - processed) / rate);

        setProcessingProgress(prev => ({
          ...prev,
          ...progress,
          estimatedRemaining: remaining
        }));
      };

      const results = importType === 'projects'
        ? await importProjects('current-user-id', validRecords, { onProgress })
        : await importCustomers('current-user-id', validRecords, onProgress);

      setBatchId(results.batchId);
      setProcessingProgress({
        successCount: results.successCount,
        failedCount: results.failedCount,
        totalRecords: results.totalRecords,
        errors: results.errors,
        status: 'completed'
      });

      setCurrentStep(STEPS.RESULTS);
    } catch (err) {
      setError(`Import failed: ${err.message}`);
      setCurrentStep(STEPS.RESULTS);
    } finally {
      setIsLoading(false);
    }
  }, [validationResults, parsedData.length, importType]);

  /**
   * Navigation handlers
   */
  const nextStep = useCallback(() => {
    if (currentStep === STEPS.FILE_UPLOAD && file) {
      parseFile();
    } else if (currentStep === STEPS.DATA_PREVIEW) {
      performValidation();
    } else if (currentStep === STEPS.VALIDATION) {
      setCurrentStep(STEPS.CONFIRMATION);
    } else if (currentStep === STEPS.CONFIRMATION) {
      startImport();
    }
  }, [currentStep, file, parseFile, performValidation, startImport]);

  const prevStep = useCallback(() => {
    const stepOrder = Object.values(STEPS);
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  }, [currentStep]);

  const reset = useCallback(() => {
    setCurrentStep(STEPS.FILE_UPLOAD);
    setFile(null);
    setParsedData([]);
    setValidationResults(null);
    setError(null);
    setWarnings([]);
    setIsDryRun(false);
    setProcessingProgress({});
    setBatchId(null);
  }, []);

  const getStepIndex = () => {
    const stepList = [
      STEPS.FILE_UPLOAD,
      STEPS.DATA_PREVIEW,
      STEPS.VALIDATION,
      STEPS.CONFIRMATION,
      STEPS.PROCESSING,
      STEPS.RESULTS
    ];
    return stepList.indexOf(currentStep);
  };

  return {
    // State
    currentStep,
    file,
    importType,
    parsedData,
    headers,
    headerMapping,
    validationResults,
    processingProgress,
    batchId,
    error,
    warnings,
    isDryRun,
    isLoading,

    // Handlers
    setImportType,
    handleFileSelect,
    parseFile,
    updateHeaderMapping,
    performValidation,
    startImport,
    nextStep,
    prevStep,
    reset,
    setIsDryRun,
    setCurrentStep,

    // Helpers
    getStepIndex,
    validateFile,
    STEPS
  };
};

export default useImportWizard;
