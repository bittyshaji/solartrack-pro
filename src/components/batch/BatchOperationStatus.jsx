/**
 * Batch Operation Status Component
 * Displays real-time progress and status of batch operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getBatchOperationStatus } from '@/lib/batchOperationsService';
import './BatchOperationStatus.css';

export default function BatchOperationStatus({
  batchId,
  progress = {},
  onCancel = () => {},
  pollInterval = 1000
}) {
  const [status, setStatus] = useState(progress || {});
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  /**
   * Format time in seconds to HH:MM:SS
   */
  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }, []);

  /**
   * Poll batch status from server
   */
  useEffect(() => {
    if (!batchId || status.status === 'completed' || status.status === 'cancelled') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const data = await getBatchOperationStatus(batchId);
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch batch status:', error);
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [batchId, pollInterval, status.status]);

  /**
   * Update elapsed time
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  /**
   * Calculate progress percentage
   */
  const progressPercent = status.progress_percentage || 0;
  const processedCount = status.records_processed || 0;
  const totalRecords = status.records_total || 0;
  const failedCount = status.records_failed || 0;
  const estimatedRemaining = status.estimated_remaining || 0;

  /**
   * Determine status color
   */
  const getStatusColor = () => {
    switch (status.status) {
      case 'processing':
        return 'processing';
      case 'completed':
        return failedCount > 0 ? 'completed-with-errors' : 'completed';
      case 'cancelled':
        return 'cancelled';
      case 'failed':
        return 'failed';
      default:
        return 'pending';
    }
  };

  /**
   * Get status label
   */
  const getStatusLabel = () => {
    const labels = {
      pending: 'Pending...',
      processing: 'Processing...',
      completed: 'Completed',
      cancelled: 'Cancelled',
      failed: 'Failed'
    };
    return labels[status.status] || 'Unknown';
  };

  /**
   * Get throughput (records per second)
   */
  const getThroughput = () => {
    if (elapsedTime === 0) return 0;
    return (processedCount / elapsedTime).toFixed(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`batch-operation-status ${getStatusColor()}`}
    >
      {/* Header */}
      <div className="status-header">
        <h2>Batch Import in Progress</h2>
        <span className={`status-badge ${getStatusColor()}`}>
          {getStatusLabel()}
        </span>
      </div>

      {/* Main progress section */}
      <div className="progress-section">
        {/* Circular progress indicator */}
        <div className="progress-circle-container">
          <svg className="progress-circle" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              opacity="0.2"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${2 * Math.PI * 54 * (1 - progressPercent / 100)}`}
              strokeLinecap="round"
              initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - progressPercent / 100) }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="progress-text">
            <div className="percentage">{progressPercent}%</div>
            <div className="label">Complete</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="linear-progress">
          <div className="progress-bar-container">
            <motion.div
              className="progress-bar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="progress-text">
            <span>{processedCount} of {totalRecords} records</span>
          </div>
        </div>
      </div>

      {/* Statistics grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Processed</div>
          <div className="stat-value">{processedCount}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Failed</div>
          <div className={`stat-value ${failedCount > 0 ? 'error' : ''}`}>
            {failedCount}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Throughput</div>
          <div className="stat-value">{getThroughput()} rec/s</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Elapsed</div>
          <div className="stat-value">{formatTime(elapsedTime)}</div>
        </div>

        {status.status === 'processing' && (
          <div className="stat-card">
            <div className="stat-label">Remaining</div>
            <div className="stat-value">{formatTime(estimatedRemaining)}</div>
          </div>
        )}

        {status.estimated_completion && status.status === 'processing' && (
          <div className="stat-card">
            <div className="stat-label">Est. Complete</div>
            <div className="stat-value">
              {new Date(status.estimated_completion).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Error summary */}
      {status.errors && status.errors.length > 0 && (
        <div className="errors-section">
          <h3>Recent Errors ({status.errors.length} total)</h3>
          <div className="errors-list">
            {status.errors.slice(0, 10).map((error, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="error-item"
              >
                {error.row && <strong>Row {error.row}:</strong>}
                <span className="error-message">
                  {error.message || error.field}
                </span>
              </motion.div>
            ))}
          </div>
          {status.errors.length > 10 && (
            <p className="more-errors">
              ... and {status.errors.length - 10} more errors
            </p>
          )}
        </div>
      )}

      {/* Control buttons */}
      <div className="status-controls">
        {status.status === 'processing' && (
          <>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="btn btn-secondary"
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={onCancel}
              className="btn btn-danger"
            >
              Cancel
            </button>
          </>
        )}

        {status.status === 'completed' && (
          <>
            <button
              onClick={() => window.location.href = '/admin/batch-operations'}
              className="btn btn-primary"
            >
              View Details
            </button>
            <button
              onClick={() => window.location.href = '/admin/batch-operations/new'}
              className="btn btn-secondary"
            >
              New Import
            </button>
          </>
        )}
      </div>

      {/* Status animation */}
      {status.status === 'processing' && (
        <div className="processing-indicator">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="pulse"
          />
          Processing...
        </div>
      )}
    </motion.div>
  );
}
