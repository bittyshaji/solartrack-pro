/**
 * Batch Operations Page
 * Admin dashboard for managing imports, exports, and operation history
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CSVImportWizard from '@/components/batch/CSVImportWizard';
import BatchOperationStatus from '@/components/batch/BatchOperationStatus';
import {
  exportProjects,
  exportCustomers,
  exportInvoices
} from '@/lib/batchOperationsService';
import './BatchOperationsPage.css';

const TABS = {
  IMPORT: 'import',
  EXPORT: 'export',
  HISTORY: 'history'
};

export default function BatchOperationsPage() {
  const [activeTab, setActiveTab] = useState(TABS.IMPORT);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [operationHistory, setOperationHistory] = useState([]);
  const [currentOperation, setCurrentOperation] = useState(null);

  // Export state
  const [exportType, setExportType] = useState('projects');
  const [exportFilters, setExportFilters] = useState({});
  const [isExporting, setIsExporting] = useState(false);

  // Import state
  const [showImportWizard, setShowImportWizard] = useState(false);

  /**
   * Check admin access
   */
  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // In production: const response = await fetch('/api/auth/me');
        // const user = await response.json();
        // setIsAdmin(user.role === 'admin');

        setIsAdmin(true); // Mock for demo
        loadOperationHistory();
      } catch (error) {
        console.error('Failed to check admin access:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, []);

  /**
   * Load batch operation history
   */
  const loadOperationHistory = async () => {
    try {
      // In production: const response = await fetch('/api/batch/operations');
      // const data = await response.json();
      // setOperationHistory(data);

      // Mock data
      setOperationHistory([
        {
          id: 'batch_001',
          type: 'import_projects',
          status: 'completed',
          total_records: 150,
          successful_records: 148,
          failed_records: 2,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          created_by: 'admin@example.com',
          duration: 45000
        },
        {
          id: 'batch_002',
          type: 'import_customers',
          status: 'completed',
          total_records: 350,
          successful_records: 345,
          failed_records: 5,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          created_by: 'admin@example.com',
          duration: 120000
        },
        {
          id: 'batch_003',
          type: 'export_projects',
          status: 'completed',
          total_records: 425,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          created_by: 'admin@example.com',
          file_name: 'projects_20260414_143022_admin.xlsx'
        }
      ]);
    } catch (error) {
      console.error('Failed to load operation history:', error);
    }
  };

  /**
   * Handle export
   */
  const handleExport = async () => {
    try {
      setIsExporting(true);

      const generateXLSX = async (config) => {
        // In production, this would call a proper XLSX generation function
        console.log('Exporting:', config);
        return new Blob([''], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      };

      let result;
      switch (exportType) {
        case 'projects':
          result = await exportProjects(exportFilters, generateXLSX);
          break;
        case 'customers':
          result = await exportCustomers(exportFilters, generateXLSX);
          break;
        case 'invoices':
          result = await exportInvoices(exportFilters, generateXLSX);
          break;
        default:
          throw new Error('Unknown export type');
      }

      // Trigger download
      const url = URL.createObjectURL(result);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportType}_${Date.now()}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      // Refresh history
      await loadOperationHistory();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Format duration
   */
  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status) => {
    const colors = {
      pending: 'pending',
      processing: 'processing',
      completed: 'completed',
      failed: 'failed',
      cancelled: 'cancelled'
    };
    return colors[status] || 'pending';
  };

  /**
   * Render import tab
   */
  const renderImportTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content import-content"
    >
      <div className="import-section">
        <h2>Import Data</h2>
        <p className="section-description">
          Bulk import projects, customers, or invoices from CSV or XLSX files
        </p>

        {!showImportWizard ? (
          <div className="import-options">
            <div className="option-card">
              <h3>Projects</h3>
              <p>Import project data with costs and states</p>
              <button
                onClick={() => {
                  setExportType('projects');
                  setShowImportWizard(true);
                }}
                className="btn btn-primary"
              >
                Import Projects
              </button>
            </div>

            <div className="option-card">
              <h3>Customers</h3>
              <p>Import customer information and contacts</p>
              <button
                onClick={() => {
                  setExportType('customers');
                  setShowImportWizard(true);
                }}
                className="btn btn-primary"
              >
                Import Customers
              </button>
            </div>

            <div className="option-card">
              <h3>Invoices</h3>
              <p>Bulk create invoices from template</p>
              <button
                onClick={() => {
                  setExportType('invoices');
                  setShowImportWizard(true);
                }}
                className="btn btn-primary"
              >
                Create Invoices
              </button>
            </div>
          </div>
        ) : (
          <div className="import-wizard-container">
            <button
              onClick={() => setShowImportWizard(false)}
              className="btn btn-secondary btn-sm back-btn"
            >
              ← Back
            </button>
            <CSVImportWizard />
          </div>
        )}
      </div>
    </motion.div>
  );

  /**
   * Render export tab
   */
  const renderExportTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content export-content"
    >
      <div className="export-section">
        <h2>Export Data</h2>
        <p className="section-description">
          Export data to XLSX with formatting and filters
        </p>

        <div className="export-form">
          <div className="form-group">
            <label>Data Type</label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              className="form-input"
            >
              <option value="projects">Projects</option>
              <option value="customers">Customers</option>
              <option value="invoices">Invoices</option>
            </select>
          </div>

          {/* Status filter for projects/invoices */}
          {(exportType === 'projects' || exportType === 'invoices') && (
            <div className="form-group">
              <label>Status</label>
              <select
                value={exportFilters.status || ''}
                onChange={(e) => setExportFilters({ ...exportFilters, status: e.target.value })}
                className="form-input"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}

          {/* Date range filter */}
          <div className="form-group">
            <label>Date Range</label>
            <div className="date-range">
              <input
                type="date"
                value={exportFilters.dateFrom || ''}
                onChange={(e) => setExportFilters({ ...exportFilters, dateFrom: e.target.value })}
                className="form-input"
              />
              <span className="date-separator">to</span>
              <input
                type="date"
                value={exportFilters.dateTo || ''}
                onChange={(e) => setExportFilters({ ...exportFilters, dateTo: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="btn btn-primary btn-lg"
            >
              {isExporting ? 'Exporting...' : `Export ${exportType}`}
            </button>
          </div>
        </div>

        <div className="export-info">
          <h3>Export Information</h3>
          <ul>
            <li>All exports include headers and timestamps</li>
            <li>Formats include summary sheet with statistics</li>
            <li>Currency values formatted as currency</li>
            <li>Dates formatted as YYYY-MM-DD</li>
            <li>Files are XLSX format (Excel compatible)</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );

  /**
   * Render history tab
   */
  const renderHistoryTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="tab-content history-content"
    >
      <div className="history-section">
        <div className="history-header">
          <h2>Operation History</h2>
          <button
            onClick={loadOperationHistory}
            className="btn btn-secondary btn-sm"
          >
            Refresh
          </button>
        </div>

        {operationHistory.length === 0 ? (
          <div className="no-operations">
            <p>No operations yet</p>
          </div>
        ) : (
          <div className="operations-table-container">
            <table className="operations-table">
              <thead>
                <tr>
                  <th>Operation ID</th>
                  <th>Type</th>
                  <th>Records</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Created</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {operationHistory.map(op => (
                  <motion.tr
                    key={op.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td className="operation-id">{op.id}</td>
                    <td>
                      <span className="operation-type">
                        {op.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="record-count">
                        <span className="total">{op.total_records}</span>
                        {op.successful_records && (
                          <>
                            <span className="success">{op.successful_records}✓</span>
                            {op.failed_records > 0 && (
                              <span className="error">{op.failed_records}✗</span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(op.status)}`}>
                        {op.status}
                      </span>
                    </td>
                    <td>
                      {op.duration && formatDuration(op.duration)}
                    </td>
                    <td>{formatDate(op.created_at)}</td>
                    <td>{op.created_by}</td>
                    <td>
                      <button
                        onClick={() => setCurrentOperation(op)}
                        className="btn btn-secondary btn-sm"
                      >
                        Details
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="batch-operations-page loading">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="batch-operations-page error">
        <h1>Access Denied</h1>
        <p>Only administrators can access batch operations</p>
      </div>
    );
  }

  return (
    <div className="batch-operations-page">
      <div className="page-header">
        <h1>Batch Operations</h1>
        <p className="page-description">
          Manage bulk imports and exports of projects, customers, and invoices
        </p>
      </div>

      {currentOperation && (
        <div className="operation-detail-modal">
          <div className="modal-backdrop" onClick={() => setCurrentOperation(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="modal-content"
          >
            <div className="modal-header">
              <h2>Operation Details</h2>
              <button
                onClick={() => setCurrentOperation(null)}
                className="close-btn"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-group">
                <label>Operation ID:</label>
                <span>{currentOperation.id}</span>
              </div>
              <div className="detail-group">
                <label>Type:</label>
                <span>{currentOperation.type.replace(/_/g, ' ')}</span>
              </div>
              <div className="detail-group">
                <label>Total Records:</label>
                <span>{currentOperation.total_records}</span>
              </div>
              {currentOperation.successful_records && (
                <>
                  <div className="detail-group">
                    <label>Successful:</label>
                    <span className="success">{currentOperation.successful_records}</span>
                  </div>
                  <div className="detail-group">
                    <label>Failed:</label>
                    <span className="error">{currentOperation.failed_records}</span>
                  </div>
                </>
              )}
              <div className="detail-group">
                <label>Status:</label>
                <span className={`status-badge ${getStatusColor(currentOperation.status)}`}>
                  {currentOperation.status}
                </span>
              </div>
              <div className="detail-group">
                <label>Created:</label>
                <span>{formatDate(currentOperation.created_at)}</span>
              </div>
              <div className="detail-group">
                <label>Created By:</label>
                <span>{currentOperation.created_by}</span>
              </div>
              {currentOperation.duration && (
                <div className="detail-group">
                  <label>Duration:</label>
                  <span>{formatDuration(currentOperation.duration)}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === TABS.IMPORT ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.IMPORT)}
        >
          <span>📥 Import</span>
        </button>
        <button
          className={`tab-button ${activeTab === TABS.EXPORT ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.EXPORT)}
        >
          <span>📤 Export</span>
        </button>
        <button
          className={`tab-button ${activeTab === TABS.HISTORY ? 'active' : ''}`}
          onClick={() => setActiveTab(TABS.HISTORY)}
        >
          <span>📋 History</span>
        </button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === TABS.IMPORT && renderImportTab()}
        {activeTab === TABS.EXPORT && renderExportTab()}
        {activeTab === TABS.HISTORY && renderHistoryTab()}
      </AnimatePresence>
    </div>
  );
}
