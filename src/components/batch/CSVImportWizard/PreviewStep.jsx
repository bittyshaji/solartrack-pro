/**
 * PreviewStep Component
 * Shows data preview and column mapping
 */

import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import ImportPreview from '../ImportPreview';
import './styles.css';

/**
 * PreviewStep
 * @component
 * @param {Array} headers - Column headers from CSV
 * @param {Object} headerMapping - Current header to field mapping
 * @param {Function} onHeaderMappingChange - Callback for header mapping changes
 * @param {Array} parsedData - Preview data rows
 * @param {string} error - Error message, if any
 * @returns {JSX.Element}
 */
const PreviewStep = ({
  headers,
  headerMapping,
  onHeaderMappingChange,
  parsedData,
  error
}) => {
  return (
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
                onChange={(e) => onHeaderMappingChange(header, e.target.value)}
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
};

PreviewStep.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  headerMapping: PropTypes.objectOf(PropTypes.string).isRequired,
  onHeaderMappingChange: PropTypes.func.isRequired,
  parsedData: PropTypes.arrayOf(PropTypes.object).isRequired,
  error: PropTypes.string
};

PreviewStep.defaultProps = {
  error: null
};

export default PreviewStep;
