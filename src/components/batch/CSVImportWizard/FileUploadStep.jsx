/**
 * FileUploadStep Component
 * Handles file selection and import type selection
 */

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import './styles.css';

/**
 * FileUploadStep
 * @component
 * @param {string} importType - Current import type ('projects' or 'customers')
 * @param {Function} onImportTypeChange - Callback when import type changes
 * @param {Function} onFileSelect - Callback when file is selected
 * @param {Object} file - Currently selected file
 * @param {string} error - Error message, if any
 * @returns {JSX.Element}
 */
const FileUploadStep = ({
  importType,
  onImportTypeChange,
  onFileSelect,
  file,
  error
}) => {
  const fileInputRef = useRef(null);

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
      onFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
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
            onChange={(e) => onImportTypeChange(e.target.value)}
          />
          <span>Import Projects</span>
        </label>
        <label>
          <input
            type="radio"
            value="customers"
            checked={importType === 'customers'}
            onChange={(e) => onImportTypeChange(e.target.value)}
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
          onChange={handleFileInputChange}
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
};

FileUploadStep.propTypes = {
  importType: PropTypes.oneOf(['projects', 'customers']).isRequired,
  onImportTypeChange: PropTypes.func.isRequired,
  onFileSelect: PropTypes.func.isRequired,
  file: PropTypes.shape({
    name: PropTypes.string,
    size: PropTypes.number
  }),
  error: PropTypes.string
};

FileUploadStep.defaultProps = {
  file: null,
  error: null
};

export default FileUploadStep;
