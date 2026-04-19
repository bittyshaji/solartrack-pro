/**
 * SavedFiltersList Component
 * Display and manage user's saved filters
 */

import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Play, Star, Search } from 'lucide-react';
import { getSavedFilters, deleteSavedFilter, setDefaultFilter } from '../lib/filterService';
import './SavedFiltersList.css';

const SavedFiltersList = ({
  userId,
  onLoadFilter,
  onDeleteFilter,
  onEditFilter,
  filterType = null,
}) => {
  const [filters, setFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadFilters();
    }
  }, [userId, filterType]);

  const loadFilters = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const savedFilters = await getSavedFilters(userId, filterType);
      setFilters(savedFilters);
    } catch (err) {
      console.error('Error loading filters:', err);
      setError('Failed to load saved filters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFilter = async (filterId) => {
    if (!window.confirm('Are you sure you want to delete this filter?')) {
      return;
    }

    try {
      const success = await deleteSavedFilter(filterId, userId);
      if (success) {
        setFilters(filters.filter(f => f.id !== filterId));
        onDeleteFilter?.(filterId);
      }
    } catch (err) {
      console.error('Error deleting filter:', err);
      setError('Failed to delete filter');
    }
  };

  const handleSetDefault = async (filterId) => {
    try {
      const success = await setDefaultFilter(userId, filterId);
      if (success) {
        setFilters(filters.map(f => ({
          ...f,
          isDefault: f.id === filterId,
        })));
      }
    } catch (err) {
      console.error('Error setting default filter:', err);
      setError('Failed to set default filter');
    }
  };

  const handleLoadFilter = (filter) => {
    onLoadFilter?.(filter);
  };

  const filteredFilters = filters.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="saved-filters-list">
      <div className="filters-header">
        <h2>Saved Filters</h2>
      </div>

      {/* Search box */}
      <div className="filters-search">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search filters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="loading-state">Loading filters...</div>
      ) : (
        <>
          {/* Filters list */}
          {filteredFilters.length > 0 ? (
            <div className="filters-grid">
              {filteredFilters.map(filter => (
                <div key={filter.id} className={`filter-card ${filter.isDefault ? 'default' : ''}`}>
                  <div className="filter-card-header">
                    <div className="filter-info">
                      <h3 className="filter-name">{filter.name}</h3>
                      <span className="filter-type">{filter.type}</span>
                    </div>
                    {filter.isDefault && (
                      <div className="default-badge">
                        <Star size={14} className="star-icon" />
                        Default
                      </div>
                    )}
                  </div>

                  {/* Filter config preview */}
                  <div className="filter-preview">
                    <code>
                      {JSON.stringify(filter.config).substring(0, 100)}...
                    </code>
                  </div>

                  {/* Timestamp */}
                  <div className="filter-timestamp">
                    Created {formatDate(filter.createdAt)}
                  </div>

                  {/* Actions */}
                  <div className="filter-actions">
                    <button
                      onClick={() => handleLoadFilter(filter)}
                      className="action-button load"
                      title="Load this filter"
                      type="button"
                    >
                      <Play size={16} />
                      Load
                    </button>

                    <button
                      onClick={() => onEditFilter?.(filter)}
                      className="action-button edit"
                      title="Edit filter"
                      type="button"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>

                    <button
                      onClick={() => handleSetDefault(filter.id)}
                      className={`action-button default ${filter.isDefault ? 'active' : ''}`}
                      title={filter.isDefault ? 'Remove as default' : 'Set as default'}
                      type="button"
                    >
                      <Star size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteFilter(filter.id)}
                      className="action-button delete"
                      title="Delete filter"
                      type="button"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              {searchTerm ? (
                <>
                  <p>No filters match your search</p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="clear-search-button"
                    type="button"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  <p>No saved filters yet</p>
                  <p className="empty-hint">Create your first filter to get started</p>
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Info footer */}
      {filters.length > 0 && (
        <div className="filters-footer">
          {filteredFilters.length} of {filters.length} filters
        </div>
      )}
    </div>
  );
};

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'today';
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      }).format(date);
    }
  } catch {
    return 'unknown';
  }
}

export default SavedFiltersList;
