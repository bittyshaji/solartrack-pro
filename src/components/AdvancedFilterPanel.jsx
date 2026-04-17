/**
 * AdvancedFilterPanel Component
 * Side panel with dynamic filter options based on search type
 */

import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, ChevronDown } from 'lucide-react';
import { getSearchFilters, getFilterPresets } from '../lib/filterService';
import './AdvancedFilterPanel.css';

const AdvancedFilterPanel = ({
  searchType = 'projects',
  onApplyFilters,
  onSaveFilter,
  isOpen = false,
  onClose,
}) => {
  const [filters, setFilters] = useState({});
  const [presets, setPresets] = useState([]);
  const [availableFilters, setAvailableFilters] = useState({});
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load filter options on mount or when searchType changes
  useEffect(() => {
    loadFilterOptions();
  }, [searchType]);

  const loadFilterOptions = async () => {
    try {
      setIsLoading(true);
      const filterOptions = await getSearchFilters(searchType);
      const filterPresets = getFilterPresets(searchType);
      setAvailableFilters(filterOptions);
      setPresets(filterPresets);
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle filter changes based on search type
  const handleFilterChange = (filterKey, value) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  // Handle multi-select toggle
  const handleMultiSelectToggle = (filterKey, value) => {
    setFilters(prev => {
      const current = Array.isArray(prev[filterKey]) ? prev[filterKey] : [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return {
        ...prev,
        [filterKey]: updated,
      };
    });
  };

  // Handle date range changes
  const handleDateRangeChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [type]: value,
      },
    }));
  };

  // Handle numeric range changes
  const handleNumericRangeChange = (rangeKey, rangeType, value) => {
    setFilters(prev => ({
      ...prev,
      [rangeKey]: {
        ...prev[rangeKey],
        [rangeType]: value ? parseFloat(value) : null,
      },
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    onApplyFilters?.(filters);
    onClose?.();
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({});
  };

  // Save filter as preset
  const handleSaveFilter = async () => {
    if (!saveFilterName.trim()) return;

    try {
      onSaveFilter?.(saveFilterName, filters);
      setSaveFilterName('');
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Error saving filter:', error);
    }
  };

  // Apply preset filter
  const handleApplyPreset = (preset) => {
    setFilters(preset.config);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="filter-panel-overlay" onClick={onClose} />

      {/* Panel */}
      <div className="advanced-filter-panel">
        <div className="filter-panel-header">
          <h2>Advanced Filters</h2>
          <button
            onClick={onClose}
            className="close-button"
            aria-label="Close filter panel"
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="filter-panel-content">
          {isLoading ? (
            <div className="loading-state">Loading filter options...</div>
          ) : (
            <>
              {/* Project filters */}
              {searchType === 'projects' && (
                <>
                  {/* Status filter */}
                  {availableFilters.status && (
                    <div className="filter-group">
                      <label className="filter-label">Project Status</label>
                      <div className="filter-checkboxes">
                        {availableFilters.status.map(status => (
                          <label key={status} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={Array.isArray(filters.status) && filters.status.includes(status)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleFilterChange('status', [
                                    ...(Array.isArray(filters.status) ? filters.status : []),
                                    status,
                                  ]);
                                } else {
                                  handleFilterChange('status', (filters.status || []).filter(s => s !== status));
                                }
                              }}
                            />
                            <span>{status === 'EST' ? 'Estimated' : status === 'NEG' ? 'Negotiation' : 'Executed'}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Customer filter */}
                  {availableFilters.customer && availableFilters.customer.length > 0 && (
                    <div className="filter-group">
                      <label htmlFor="customer-select" className="filter-label">Customer</label>
                      <select
                        id="customer-select"
                        value={filters.customer || ''}
                        onChange={(e) => handleFilterChange('customer', e.target.value || null)}
                        className="filter-select"
                      >
                        <option value="">All Customers</option>
                        {availableFilters.customer.map(customer => (
                          <option key={customer} value={customer}>{customer}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Date range filter */}
                  {availableFilters.dateRange && (
                    <div className="filter-group">
                      <label className="filter-label">Created Date Range</label>
                      <div className="date-range-inputs">
                        <input
                          type="date"
                          value={filters.dateRange?.start || ''}
                          onChange={(e) => handleDateRangeChange('start', e.target.value)}
                          className="date-input"
                          placeholder="Start date"
                        />
                        <span className="date-separator">to</span>
                        <input
                          type="date"
                          value={filters.dateRange?.end || ''}
                          onChange={(e) => handleDateRangeChange('end', e.target.value)}
                          className="date-input"
                          placeholder="End date"
                        />
                      </div>
                    </div>
                  )}

                  {/* Value range filter */}
                  {availableFilters.valueRange && (
                    <div className="filter-group">
                      <label className="filter-label">Estimated Value</label>
                      <div className="range-inputs">
                        <input
                          type="number"
                          value={filters.valueRange?.min || ''}
                          onChange={(e) => handleNumericRangeChange('valueRange', 'min', e.target.value)}
                          placeholder="Min"
                          className="range-input"
                        />
                        <span className="range-separator">-</span>
                        <input
                          type="number"
                          value={filters.valueRange?.max || ''}
                          onChange={(e) => handleNumericRangeChange('valueRange', 'max', e.target.value)}
                          placeholder="Max"
                          className="range-input"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Customer filters */}
              {searchType === 'customers' && (
                <>
                  {/* City filter */}
                  {availableFilters.city && availableFilters.city.length > 0 && (
                    <div className="filter-group">
                      <label htmlFor="city-select" className="filter-label">City</label>
                      <select
                        id="city-select"
                        value={filters.city || ''}
                        onChange={(e) => handleFilterChange('city', e.target.value || null)}
                        className="filter-select"
                      >
                        <option value="">All Cities</option>
                        {availableFilters.city.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* State filter */}
                  {availableFilters.state && availableFilters.state.length > 0 && (
                    <div className="filter-group">
                      <label htmlFor="state-select" className="filter-label">State</label>
                      <select
                        id="state-select"
                        value={filters.state || ''}
                        onChange={(e) => handleFilterChange('state', e.target.value || null)}
                        className="filter-select"
                      >
                        <option value="">All States</option>
                        {availableFilters.state.map(state => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Active status filter */}
                  {availableFilters.activeStatus && (
                    <div className="filter-group">
                      <label className="filter-label">Status</label>
                      <div className="filter-checkboxes">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.activeStatus === true}
                            onChange={(e) => handleFilterChange('activeStatus', e.target.checked ? true : null)}
                          />
                          <span>Active Only</span>
                        </label>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={filters.activeStatus === false}
                            onChange={(e) => handleFilterChange('activeStatus', e.target.checked ? false : null)}
                          />
                          <span>Inactive Only</span>
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Invoice filters */}
              {searchType === 'invoices' && (
                <>
                  {/* Status filter */}
                  {availableFilters.status && (
                    <div className="filter-group">
                      <label className="filter-label">Invoice Status</label>
                      <div className="filter-checkboxes">
                        {availableFilters.status.map(status => (
                          <label key={status} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={Array.isArray(filters.status) && filters.status.includes(status)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  handleFilterChange('status', [
                                    ...(Array.isArray(filters.status) ? filters.status : []),
                                    status,
                                  ]);
                                } else {
                                  handleFilterChange('status', (filters.status || []).filter(s => s !== status));
                                }
                              }}
                            />
                            <span>{status}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date range filter */}
                  {availableFilters.dateRange && (
                    <div className="filter-group">
                      <label className="filter-label">Invoice Date Range</label>
                      <div className="date-range-inputs">
                        <input
                          type="date"
                          value={filters.dateRange?.start || ''}
                          onChange={(e) => handleDateRangeChange('start', e.target.value)}
                          className="date-input"
                        />
                        <span className="date-separator">to</span>
                        <input
                          type="date"
                          value={filters.dateRange?.end || ''}
                          onChange={(e) => handleDateRangeChange('end', e.target.value)}
                          className="date-input"
                        />
                      </div>
                    </div>
                  )}

                  {/* Amount range filter */}
                  {availableFilters.amountRange && (
                    <div className="filter-group">
                      <label className="filter-label">Amount Range</label>
                      <div className="range-inputs">
                        <input
                          type="number"
                          value={filters.amountRange?.min || ''}
                          onChange={(e) => handleNumericRangeChange('amountRange', 'min', e.target.value)}
                          placeholder="Min"
                          className="range-input"
                        />
                        <span className="range-separator">-</span>
                        <input
                          type="number"
                          value={filters.amountRange?.max || ''}
                          onChange={(e) => handleNumericRangeChange('amountRange', 'max', e.target.value)}
                          placeholder="Max"
                          className="range-input"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Presets */}
              {presets.length > 0 && (
                <div className="filter-group">
                  <label className="filter-label">Quick Presets</label>
                  <div className="presets-list">
                    {presets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => handleApplyPreset(preset)}
                        className="preset-button"
                        type="button"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="filter-panel-footer">
          <button
            onClick={handleClearFilters}
            className="footer-button secondary"
            type="button"
          >
            <Trash2 size={16} />
            Clear All
          </button>

          <div className="footer-buttons-right">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="footer-button secondary"
              type="button"
            >
              <Save size={16} />
              Save Filter
            </button>

            <button
              onClick={handleApplyFilters}
              className="footer-button primary"
              type="button"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Save filter dialog */}
      {showSaveDialog && (
        <div className="save-filter-dialog-overlay">
          <div className="save-filter-dialog">
            <h3>Save Filter</h3>
            <input
              type="text"
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              placeholder="Filter name"
              className="filter-name-input"
              autoFocus
            />
            <div className="dialog-buttons">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="dialog-button secondary"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFilter}
                className="dialog-button primary"
                disabled={!saveFilterName.trim()}
                type="button"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdvancedFilterPanel;
