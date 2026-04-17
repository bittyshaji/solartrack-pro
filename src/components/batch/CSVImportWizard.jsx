/**
 * CSV/XLSX Import Wizard Component
 * Multi-step wizard for importing data from CSV/XLSX files
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  parseCSVFile,
  parseXLSXFile,
  validateProjectImport,
  validateCustomerImport,
  importProjects,
  importCustomers
} from '@/lib/batchOperationsService';
import ImportPreview from './ImportPreview';
import BatchOperationStatus from './BatchOperationStatus';
import './CSVImportWizard.css';

const STEPS = {
  FILE_UPLOAD: 'file_upload',
  DATA_PREVIEW: 'data_preview',
  VALIDATION: 'validation',
  CONFIRMATION: 'confirmation',
  PROCESSING: 'processing',
  RESULTS: 'results'
};

const stepLabels = {
  file_upload: 'Upload File',
  data_preview: 'Preview Data',
  validation: 'Validation',
  confirmation: 'Confirm',
  processing: 'Processing',
  results: 'Results'
};

export default function CSVImportWizard() {
  const fileInputRef = useRef(null);
  const [currentStep, setCurrentStep] = useState(STEPS.FILE_UPLOAD);
  const [file, setFile] = useState(null);
  const [importType, setImportType] = useState('projects'); // 'projects' or 'customers'
  const [parsedData, setParsedData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [headerMapping, setHeaderMapping] = useState({});
  const [validationResults, setValidationResults] = useState(null);
  const [processingProgress, setProcessingProgress] = useState({});
  const [batchId, setBatchId] = useState(null);
  const [error, setError] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [isDryRun, setIsDryRun] = useState(false);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((selectedFile) => {
    const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a CSV or XLSX file');
      return;
    }

    if (selectedFile.size > maxSize) {
      setError('File size exceeds 50MB limit');
      return;
    }

    setFile(selectedFile);
    setError(null);
  }, []);

  /**
   * Handle drag and drop
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-active');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-active');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-active');

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  /**
   * Parse uploaded file
   */
  const parseFile = async () => {
    try {
      setError(null);
      let data;

      if (file.type === 'text/csv') {
        data = await parseCSVFile(file);
      } else {
        data = await parseXLSXFile(file);
      }

      if (data.length === 0) {
        setError('File contains no data');
        return;
      }

      setParsedData(data);
      setHeaders(Object.keys(data[0]));

      // Initialize header mapping (auto-match if possible)
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
    }
  };

  /**
   * Handle header mapping change
   */
  const updateHeaderMapping = (fromHeader, toField) => {
    setHeaderMapping(prev => ({
      ...prev,
      [fromHeader]: toField
    }));
  };

  /**
   * Validate parsed data
   */
  const performValidation = () => {
    try {
      setError(null);

      // Remap headers based on mapping
      const remappedData = parsedData.map(record => {
        const remapped = {};
        Object.entries(headerMapping).forEach(([from, to]) => {
          if (to) {
            remapped[to] = record[from];
          }
        });
        return remapped;
      });

      // Run validation based on import type
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
  };

  /**
   * Process import (execute or dry-run)
   */
  const startImport = async () => {
    try {
      setError(null);
      setCurrentStep(STEPS.PROCESSING);

      if (!validationResults) {
        setError('No validation results available');
        return;
      }

      const validRecords = validationResults.valid.map(v => v.data);

      const onProgress = (progress) => {
        setProcessingProgress(progress);

        // Estimate remaining time
        const processed = progress.processedCount;
        const total = progress.totalRecords || parsedData.length;
        const elapsed = Date.now() - (progress.startedAt || Date.now());
        const rate = processed / (elapsed / 1000); // records per second
        const remaining = Math.ceil((total - processed) / rate);

        setProcessingProgress(prev => ({
          ...prev,
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
    }
  };

  /**
   * Handle step navigation
   */
  const nextStep = () => {
    if (currentStep === STEPS.FILE_UPLOAD && file) {
      parseFile();
    } else if (currentStep === STEPS.DATA_PREVIEW) {
      performValidation();
    } else if (currentStep === STEPS.VALIDATION) {
      setCurrentStep(STEPS.CONFIRMATION);
    } else if (currentStep === STEPS.CONFIRMATION) {
      startImport();
    }
  };

  const prevStep = () => {
    const stepOrder = Object.values(STEPS);
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const reset = () => {
    setCurrentStep(STEPS.FILE_UPLOAD);
    setFile(null);
    setParsedData([]);
    setValidationResults(null);
    setError(null);
    setWarnings([]);
  };

  /**
   * Render file upload step
   */
  const renderFileUpload = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="wizard-step file-upload-step"
    >
      <h2>Upload CSV or XLSX File</h2>

      <div className="import-type-selector">
        <label>
          <input
            type="radio"
            value="projects"
            checked={importType === 'projects'}
            onChange={(e) => setImportType(e.target.value)}
          />
          <span>Import Projects</span>
        </label>
        <label>
          <input
            type="radio"
            value="customers"
            checked={importType === 'customers'}
            onChange={(e) => setImportType(e.target.value)}
          />
          <span>Import Customers</span>
        </label>
      </div>

      <div
        className="dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="dropzone-content">
          <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 2v20M2 12h20M7 7l5-5 5 5M7 17l5 5 5-5" />
          </svg>
          <h3>Drag and drop your file here</h3>
          <p>or click to select from your computer</p>
          <p className="file-info">CSV or XLSX, up to 50MB</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          style={{ display: 'none' }}
        />
      </div>

      {file && (
        <div className="file-info-box">
          <p>
            <strong>Selected:</strong> {file.name}
          </p>
          <p>
            <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </motion.div>
  );

  /**
   * Render data preview step
   */
  const renderDataPreview = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="wizard-step data-preview-step"
    >
      <h2>Preview and Map Columns</h2>

      <div className="header-mapping">
        <h3>Column Mapping</h3>
        <p>Map CSV columns to data fields (or leave blank to skip)</p>
        <div className="mapping-grid">
          {headers.map(header => (
            <div key={header} className="mapping-row">
              <label>{header}</label>
              <input
                type="text"
                value={headerMapping[header] || ''}
                onChange={(e) => updateHeaderMapping(header, e.target.value)}
                placeholder="Field name (or leave blank)"
              />
            </div>
          ))}
        </div>
      </div>

      <ImportPreview data={parsedData.slice(0, 10)} headers={headers} />

      {error && <div className="error-message">{error}</div>}
    </motion.div>
  );

  /**
   * Render validation step
   */
  const renderValidation = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="wizard-step validation-step"
    >
      <h2>Validation Results</h2>

      {validationResults && (
        <div className="validation-summary">
          <div className="summary-stat valid">
            <span className="count">{validationResults.valid.length}</span>
            <span className="label">Valid Records</span>
          </div>
          <div className="summary-stat invalid">
            <span className="count">{validationResults.invalid.length}</span>
            <span className="label">Invalid Records</span>
          </div>
        </div>
      )}

      {validationResults?.invalid.length > 0 && (
        <div className="errors-section">
          <h3>Validation Errors</h3>
          <div className="errors-list">
            {validationResults.invalid.slice(0, 20).map((inv, idx) => (
              <div key={idx} className="error-item">
                <strong>Row {inv.row}:</strong>
                {inv.errors.map((err, errIdx) => (
                  <div key={errIdx} className="error-detail">
                    <span className="field">{err.field}</span>
                    <span className="message">{err.message}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {validationResults.invalid.length > 20 && (
            <p className="more-errors">
              ... and {validationResults.invalid.length - 20} more errors
            </p>
          )}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="warnings-section">
          {warnings.map((warning, idx) => (
            <div key={idx} className="warning-message">{warning}</div>
          ))}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}
    </motion.div>
  );

  /**
   * Render confirmation step
   */
  const renderConfirmation = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="wizard-step confirmation-step"
    >
      <h2>Confirm Import</h2>

      {validationResults && (
        <div className="confirmation-details">
          <div className="detail-row">
            <span className="label">Records to import:</span>
            <span className="value">{validationResults.valid.length}</span>
          </div>
          <div className="detail-row">
            <span className="label">Invalid records:</span>
            <span className="value invalid">{validationResults.invalid.length}</span>
          </div>
          <div className="detail-row">
            <span className="label">Import type:</span>
            <span className="value">{importType}</span>
          </div>
          <div className="detail-row">
            <span className="label">Duplicate detection:</span>
            <span className="value">Enabled</span>
          </div>
        </div>
      )}

      <div className="confirmation-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isDryRun}
            onChange={(e) => setIsDryRun(e.target.checked)}
          />
          <span>Dry run (preview without importing)</span>
        </label>
      </div>

      <p className="confirmation-text">
        Click "Start Import" to proceed with importing the valid records.
        Invalid records will be skipped and reported.
      </p>
    </motion.div>
  );

  /**
   * Render processing step
   */
  const renderProcessing = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="wizard-step processing-step"
    >
      <BatchOperationStatus
        batchId={batchId}
        progress={processingProgress}
        onCancel={() => setCurrentStep(STEPS.RESULTS)}
      />
    </motion.div>
  );

  /**
   * Render results step
   */
  const renderResults = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="wizard-step results-step"
    >
      <h2>Import Complete</h2>

      {processingProgress.status === 'completed' && (
        <div className="results-summary">
          <div className="result-stat success">
            <span className="count">{processingProgress.successCount}</span>
            <span className="label">Imported Successfully</span>
          </div>
          <div className="result-stat error">
            <span className="count">{processingProgress.failedCount}</span>
            <span className="label">Failed</span>
          </div>
        </div>
      )}

      {processingProgress.errors && processingProgress.errors.length > 0 && (
        <div className="errors-report">
          <h3>Errors</h3>
          <div className="errors-list">
            {processingProgress.errors.map((err, idx) => (
              <div key={idx} className="error-item">
                {err.row && <strong>Row {err.row}:</strong>}
                <span>{err.message || err.field}</span>
              </div>
            ))}
          </div>
          <a href="#" className="download-link">
            Download Full Error Report
          </a>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="results-actions">
        <button onClick={reset} className="btn btn-primary">
          Import Another File
        </button>
        <button onClick={() => window.location.href = '/admin/batch-operations'} className="btn btn-secondary">
          View All Operations
        </button>
      </div>
    </motion.div>
  );

  /**
   * Render current step
   */
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.FILE_UPLOAD:
        return renderFileUpload();
      case STEPS.DATA_PREVIEW:
        return renderDataPreview();
      case STEPS.VALIDATION:
        return renderValidation();
      case STEPS.CONFIRMATION:
        return renderConfirmation();
      case STEPS.PROCESSING:
        return renderProcessing();
      case STEPS.RESULTS:
        return renderResults();
      default:
        return null;
    }
  };

  /**
   * Get step index
   */
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

  const stepIndex = getStepIndex();
  const totalSteps = 6;

  return (
    <div className="csv-import-wizard">
      <div className="wizard-container">
        {/* Progress indicators */}
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
          <div className="step-indicators">
            {Object.values(STEPS).map((step, idx) => (
              <div
                key={step}
                className={`step-indicator ${idx <= stepIndex ? 'active' : ''} ${step === currentStep ? 'current' : ''}`}
                title={stepLabels[step]}
              >
                {idx + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="wizard-content">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        {currentStep !== STEPS.RESULTS && currentStep !== STEPS.PROCESSING && (
          <div className="wizard-navigation">
            <button
              onClick={prevStep}
              disabled={stepIndex === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>

            <button
              onClick={reset}
              className="btn btn-tertiary"
            >
              Cancel
            </button>

            <button
              onClick={nextStep}
              disabled={
                (currentStep === STEPS.FILE_UPLOAD && !file) ||
                (currentStep === STEPS.DATA_PREVIEW && parsedData.length === 0)
              }
              className="btn btn-primary"
            >
              {currentStep === STEPS.CONFIRMATION ? 'Start Import' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
