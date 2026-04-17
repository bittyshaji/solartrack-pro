/**
 * Import Preview Component
 * Displays a preview of parsed CSV/XLSX data with editing capabilities
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import './ImportPreview.css';

export default function ImportPreview({
  data = [],
  headers = [],
  errors = [],
  onEdit = () => {},
  onSort = () => {},
  onFilter = () => {}
}) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterText, setFilterText] = useState('');
  const [selectedRows, setSelectedRows] = useState(new Set());

  /**
   * Handle cell editing
   */
  const startEdit = (rowIndex, column, value) => {
    setEditingCell({ row: rowIndex, column });
    setEditValue(value || '');
  };

  const saveEdit = (rowIndex, column) => {
    onEdit(rowIndex, column, editValue);
    setEditingCell(null);
  };

  /**
   * Handle column sorting
   */
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    onSort(column, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  /**
   * Check if cell has error
   */
  const getCellError = (rowIndex, column) => {
    if (!errors || errors.length === 0) return null;
    const rowErrors = errors.find(e => e.row === rowIndex + 2); // +2 for header and 0-based
    if (!rowErrors) return null;
    return rowErrors.errors.find(e => e.field === column);
  };

  /**
   * Sort and filter data
   */
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filter
    if (filterText) {
      result = result.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(filterText.toLowerCase())
        )
      );
    }

    // Apply sort
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn] || '';
        const bVal = b[sortColumn] || '';

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return result;
  }, [data, sortColumn, sortDirection, filterText]);

  /**
   * Handle row selection
   */
  const toggleRowSelection = (rowIndex) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(rowIndex)) {
      newSelection.delete(rowIndex);
    } else {
      newSelection.add(rowIndex);
    }
    setSelectedRows(newSelection);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === processedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(processedData.map((_, idx) => idx)));
    }
  };

  /**
   * Export invalid rows to CSV
   */
  const exportInvalidRows = () => {
    if (!errors || errors.length === 0) return;

    const invalidRows = processedData.filter((_, idx) =>
      errors.some(e => e.row === idx + 2)
    );

    const csv = [
      headers.join(','),
      ...invalidRows.map(row =>
        headers.map(h => {
          const val = row[h];
          if (typeof val === 'string' && val.includes(',')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val || '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invalid_rows_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Calculate statistics
   */
  const stats = useMemo(() => {
    const errorRows = new Set(errors?.map(e => e.row) || []);
    const validCount = processedData.length - errorRows.size;
    const invalidCount = errorRows.size;

    return {
      total: data.length,
      valid: validCount,
      invalid: invalidCount,
      filtered: processedData.length
    };
  }, [data, processedData, errors]);

  if (data.length === 0) {
    return (
      <div className="import-preview empty">
        <p>No data to preview</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="import-preview"
    >
      {/* Statistics bar */}
      <div className="preview-stats">
        <div className="stat">
          <span className="label">Total records:</span>
          <span className="value">{stats.total}</span>
        </div>
        <div className="stat valid">
          <span className="label">Valid:</span>
          <span className="value">{stats.valid}</span>
        </div>
        {stats.invalid > 0 && (
          <div className="stat invalid">
            <span className="label">Invalid:</span>
            <span className="value">{stats.invalid}</span>
          </div>
        )}
        {stats.filtered !== stats.total && (
          <div className="stat">
            <span className="label">Showing:</span>
            <span className="value">{stats.filtered} of {stats.total}</span>
          </div>
        )}
      </div>

      {/* Filter and export bar */}
      <div className="preview-toolbar">
        <div className="filter-input">
          <input
            type="text"
            placeholder="Filter data..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          {stats.invalid > 0 && (
            <button
              onClick={exportInvalidRows}
              className="btn btn-secondary btn-sm"
              title="Export rows with validation errors"
            >
              Export Invalid Rows
            </button>
          )}
        </div>
      </div>

      {/* Data table */}
      <div className="preview-table-container">
        <table className="preview-table">
          <thead>
            <tr>
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedRows.size === processedData.length && processedData.length > 0}
                  onChange={toggleAllRows}
                />
              </th>
              {headers.map(header => (
                <th
                  key={header}
                  onClick={() => handleSort(header)}
                  className={`sortable ${sortColumn === header ? `sort-${sortDirection}` : ''}`}
                >
                  <div className="header-content">
                    <span>{header}</span>
                    {sortColumn === header && (
                      <span className="sort-icon">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {processedData.map((row, rowIndex) => {
              const rowErrors = errors?.find(e => e.row === rowIndex + 2);
              const hasErrors = !!rowErrors;

              return (
                <motion.tr
                  key={rowIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`
                    data-row
                    ${selectedRows.has(rowIndex) ? 'selected' : ''}
                    ${hasErrors ? 'has-errors' : ''}
                  `}
                >
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIndex)}
                      onChange={() => toggleRowSelection(rowIndex)}
                    />
                  </td>

                  {headers.map(header => {
                    const cellError = getCellError(rowIndex, header);
                    const isEditing = editingCell?.row === rowIndex && editingCell?.column === header;

                    return (
                      <td
                        key={`${rowIndex}-${header}`}
                        className={`${cellError ? 'cell-error' : ''}`}
                        title={cellError ? cellError.message : ''}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => saveEdit(rowIndex, header)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(rowIndex, header);
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                            autoFocus
                            className="cell-input"
                          />
                        ) : (
                          <div
                            className="cell-content"
                            onClick={() => startEdit(rowIndex, header, row[header])}
                          >
                            <span>{row[header]}</span>
                            {cellError && (
                              <span className="error-indicator" title={cellError.message}>
                                ⚠
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Error details */}
      {stats.invalid > 0 && (
        <div className="preview-errors">
          <h4>Validation Issues</h4>
          <div className="error-items">
            {errors?.slice(0, 5).map((error, idx) => (
              <div key={idx} className="error-item">
                <strong>Row {error.row}:</strong>
                {error.errors?.map((err, errIdx) => (
                  <div key={errIdx} className="error-detail">
                    <span className="field">{err.field}</span>
                    <span className="message">{err.message}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          {errors && errors.length > 5 && (
            <p className="more-errors">
              ... and {errors.length - 5} more issues
            </p>
          )}
        </div>
      )}

      {/* No results message */}
      {processedData.length === 0 && filterText && (
        <div className="no-results">
          <p>No records match your filter</p>
          <button
            onClick={() => setFilterText('')}
            className="btn btn-secondary btn-sm"
          >
            Clear Filter
          </button>
        </div>
      )}
    </motion.div>
  );
}
