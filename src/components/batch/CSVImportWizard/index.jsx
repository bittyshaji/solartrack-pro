/**
 * CSVImportWizard Component
 * Multi-step wizard for importing CSV/XLSX data
 * Orchestrates sub-components and manages state through custom hook
 */

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import useImportWizard from '../../../hooks/useImportWizard';
import BatchOperationStatus from '../BatchOperationStatus';
import FileUploadStep from './FileUploadStep';
import PreviewStep from './PreviewStep';
import MappingStep from './MappingStep';
import ConfirmStep from './ConfirmStep';
import ResultsStep from './ResultsStep';
import './styles.css';

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

/**
 * CSVImportWizard
 * @component
 * Main wizard component for CSV/XLSX imports
 * @returns {JSX.Element}
 */
const CSVImportWizard = () => {
  const wizard = useImportWizard();

  const {
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
    setImportType,
    handleFileSelect,
    updateHeaderMapping,
    nextStep,
    prevStep,
    reset,
    setIsDryRun,
    getStepIndex
  } = wizard;

  const stepIndex = getStepIndex();
  const totalSteps = 6;

  /**
   * Render appropriate step content
   */
  const renderStep = () => {
    switch (currentStep) {
      case STEPS.FILE_UPLOAD:
        return (
          <FileUploadStep
            importType={importType}
            onImportTypeChange={setImportType}
            onFileSelect={handleFileSelect}
            file={file}
            error={error}
          />
        );
      case STEPS.DATA_PREVIEW:
        return (
          <PreviewStep
            headers={headers}
            headerMapping={headerMapping}
            onHeaderMappingChange={updateHeaderMapping}
            parsedData={parsedData}
            error={error}
          />
        );
      case STEPS.VALIDATION:
        return (
          <MappingStep
            validationResults={validationResults}
            warnings={warnings}
            error={error}
          />
        );
      case STEPS.CONFIRMATION:
        return (
          <ConfirmStep
            validationResults={validationResults}
            importType={importType}
            isDryRun={isDryRun}
            onDryRunChange={setIsDryRun}
          />
        );
      case STEPS.PROCESSING:
        return (
          <BatchOperationStatus
            batchId={batchId}
            progress={processingProgress}
            onCancel={() => {}}
          />
        );
      case STEPS.RESULTS:
        return (
          <ResultsStep
            processingProgress={processingProgress}
            error={error}
            onImportAnother={reset}
            onViewOperations={() => {
              window.location.href = '/admin/batch-operations';
            }}
          />
        );
      default:
        return null;
    }
  };

  /**
   * Check if next button is disabled
   */
  const isNextDisabled = () => {
    if (currentStep === STEPS.FILE_UPLOAD && !file) return true;
    if (currentStep === STEPS.DATA_PREVIEW && parsedData.length === 0) return true;
    return isLoading;
  };

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
                className={`step-indicator ${idx <= stepIndex ? 'active' : ''} ${
                  step === currentStep ? 'current' : ''
                }`}
                title={stepLabels[step]}
              >
                {idx + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="wizard-content">
          <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
        </div>

        {/* Navigation buttons */}
        {currentStep !== STEPS.RESULTS &&
          currentStep !== STEPS.PROCESSING && (
          <div className="wizard-navigation">
            <button
              onClick={prevStep}
              disabled={stepIndex === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>

            <button onClick={reset} className="btn btn-tertiary">
              Cancel
            </button>

            <button
              onClick={nextStep}
              disabled={isNextDisabled()}
              className="btn btn-primary"
            >
              {currentStep === STEPS.CONFIRMATION ? 'Start Import' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVImportWizard;
