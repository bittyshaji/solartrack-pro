/**
 * ConfirmStep Component
 * Shows import confirmation details
 */

import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import './styles.css';

/**
 * ConfirmStep
 * @component
 * @param {Object} validationResults - Validation results summary
 * @param {string} importType - Type of import (projects or customers)
 * @param {boolean} isDryRun - Whether this is a dry run
 * @param {Function} onDryRunChange - Callback for dry run toggle
 * @returns {JSX.Element}
 */
const ConfirmStep = ({
  validationResults,
  importType,
  isDryRun,
  onDryRunChange
}) => {
  if (!validationResults) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="wizard-step confirmation-step"
    >
      <h2>Confirm Import</h2>

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

      <div className="confirmation-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isDryRun}
            onChange={(e) => onDryRunChange(e.target.checked)}
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
};

ConfirmStep.propTypes = {
  validationResults: PropTypes.shape({
    valid: PropTypes.arrayOf(PropTypes.object),
    invalid: PropTypes.arrayOf(PropTypes.object)
  }),
  importType: PropTypes.oneOf(['projects', 'customers']).isRequired,
  isDryRun: PropTypes.bool,
  onDryRunChange: PropTypes.func.isRequired
};

ConfirmStep.defaultProps = {
  validationResults: null,
  isDryRun: false
};

export default ConfirmStep;
