/**
 * MappingStep Component
 * Shows validation results and errors
 */

import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import './styles.css';

/**
 * MappingStep
 * @component
 * @param {Object} validationResults - Validation results with valid/invalid records
 * @param {Array} warnings - Warning messages
 * @param {string} error - Error message, if any
 * @returns {JSX.Element}
 */
const MappingStep = ({ validationResults, warnings, error }) => {
  if (!validationResults) {
    return null;
  }

  const { valid = [], invalid = [] } = validationResults;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="wizard-step validation-step"
    >
      <h2>Validation Results</h2>

      <div className="validation-summary">
        <div className="summary-stat valid">
          <span className="count">{valid.length}</span>
          <span className="label">Valid Records</span>
        </div>
        <div className="summary-stat invalid">
          <span className="count">{invalid.length}</span>
          <span className="label">Invalid Records</span>
        </div>
      </div>

      {invalid.length > 0 && (
        <div className="errors-section">
          <h3>Validation Errors</h3>
          <div className="errors-list">
            {invalid.slice(0, 20).map((inv, idx) => (
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
          {invalid.length > 20 && (
            <p className="more-errors">
              ... and {invalid.length - 20} more errors
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
};

MappingStep.propTypes = {
  validationResults: PropTypes.shape({
    valid: PropTypes.arrayOf(PropTypes.object),
    invalid: PropTypes.arrayOf(PropTypes.object)
  }),
  warnings: PropTypes.arrayOf(PropTypes.string),
  error: PropTypes.string
};

MappingStep.defaultProps = {
  validationResults: null,
  warnings: [],
  error: null
};

export default MappingStep;
