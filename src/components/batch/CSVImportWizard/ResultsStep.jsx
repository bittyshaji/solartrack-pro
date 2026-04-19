/**
 * ResultsStep Component
 * Shows import results and errors
 */

import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import './styles.css';

/**
 * ResultsStep
 * @component
 * @param {Object} processingProgress - Import progress and results
 * @param {string} error - Error message, if any
 * @param {Function} onImportAnother - Callback to import another file
 * @param {Function} onViewOperations - Callback to view all operations
 * @returns {JSX.Element}
 */
const ResultsStep = ({
  processingProgress,
  error,
  onImportAnother,
  onViewOperations
}) => {
  const {
    successCount = 0,
    failedCount = 0,
    errors = [],
    status = ''
  } = processingProgress;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="wizard-step results-step"
    >
      <h2>Import Complete</h2>

      {status === 'completed' && (
        <div className="results-summary">
          <div className="result-stat success">
            <span className="count">{successCount}</span>
            <span className="label">Imported Successfully</span>
          </div>
          <div className="result-stat error">
            <span className="count">{failedCount}</span>
            <span className="label">Failed</span>
          </div>
        </div>
      )}

      {errors && errors.length > 0 && (
        <div className="errors-report">
          <h3>Errors</h3>
          <div className="errors-list">
            {errors.map((err, idx) => (
              <div key={idx} className="error-item">
                {err.row && <strong>Row {err.row}:</strong>}
                <span>{err.message || err.field}</span>
              </div>
            ))}
          </div>
          {errors.length > 10 && (
            <p className="more-errors">
              ... and {errors.length - 10} more errors
            </p>
          )}
          <a href="#" className="download-link">
            Download Full Error Report
          </a>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="results-actions">
        <button onClick={onImportAnother} className="btn btn-primary">
          Import Another File
        </button>
        <button onClick={onViewOperations} className="btn btn-secondary">
          View All Operations
        </button>
      </div>
    </motion.div>
  );
};

ResultsStep.propTypes = {
  processingProgress: PropTypes.shape({
    successCount: PropTypes.number,
    failedCount: PropTypes.number,
    errors: PropTypes.arrayOf(PropTypes.object),
    status: PropTypes.string
  }),
  error: PropTypes.string,
  onImportAnother: PropTypes.func.isRequired,
  onViewOperations: PropTypes.func.isRequired
};

ResultsStep.defaultProps = {
  processingProgress: {},
  error: null
};

export default ResultsStep;
