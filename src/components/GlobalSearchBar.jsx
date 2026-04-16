/**
 * GlobalSearchBar Component
 * Header search input with autocomplete, type selector, and recent searches
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { getAutocompleteSuggestions, getSearchHistory, saveSearch } from '../lib/searchService';
import './GlobalSearchBar.css';

const GlobalSearchBar = ({ onSearch, onFilterClick, userId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const searchTypes = [
    { value: 'all', label: 'All' },
    { value: 'projects', label: 'Projects' },
    { value: 'customers', label: 'Customers' },
    { value: 'invoices', label: 'Invoices' },
  ];

  // Load recent searches on mount
  useEffect(() => {
    if (userId) {
      loadRecentSearches();
    }
  }, [userId]);

  // Handle keyboard shortcut (/ to focus search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch autocomplete suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const sug = await getAutocompleteSuggestions(searchTerm, searchType, 5);
        setSuggestions(sug);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, searchType]);

  const loadRecentSearches = async () => {
    try {
      const history = await getSearchHistory(userId, 5);
      setRecentSearches(history);
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const handleSearch = async (term = searchTerm) => {
    if (!term.trim()) return;

    setIsLoading(true);
    try {
      // Save search to history
      if (userId) {
        // Note: actual result count would come from search results
        await saveSearch(userId, term, searchType, 0);
        loadRecentSearches();
      }

      // Call parent handler
      onSearch?.(term, searchType);
      setShowDropdown(false);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    handleSearch(suggestion);
  };

  const handleRecentClick = (recent) => {
    setSearchTerm(recent.searchTerm);
    setSearchType(recent.searchType);
    handleSearch(recent.searchTerm);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSuggestions([]);
    searchInputRef.current?.focus();
  };

  const displaySuggestions = suggestions.length > 0 || (searchTerm.length >= 2 && recentSearches.length === 0);

  return (
    <div className="global-search-bar">
      <div className="search-container">
        <div className="search-input-wrapper" ref={dropdownRef}>
          <div className="search-input-group">
            <Search className="search-icon" size={18} />

            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search projects, customers, invoices... (press / to focus)"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowDropdown(true)}
              className="search-input"
              disabled={isLoading}
              aria-label="Search"
              aria-describedby="search-type-selector"
            />

            {searchTerm && (
              <button
                onClick={handleClear}
                className="clear-button"
                aria-label="Clear search"
                type="button"
              >
                <X size={18} />
              </button>
            )}

            <div className="search-type-selector" id="search-type-selector">
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="type-select"
                aria-label="Search type"
              >
                {searchTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>
          </div>

          {/* Dropdown menu */}
          {showDropdown && (
            <div className="search-dropdown">
              {/* Autocomplete suggestions */}
              {displaySuggestions && (
                <div className="dropdown-section">
                  <div className="section-header">Suggestions</div>
                  <ul className="suggestions-list">
                    {suggestions.length > 0 ? (
                      suggestions.map((suggestion, index) => (
                        <li key={index}>
                          <button
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="suggestion-item"
                            type="button"
                          >
                            <Search size={14} />
                            <span>{suggestion}</span>
                          </button>
                        </li>
                      ))
                    ) : (
                      <li className="empty-state">
                        Type at least 2 characters for suggestions
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Recent searches */}
              {searchTerm.length < 2 && recentSearches.length > 0 && (
                <div className="dropdown-section">
                  <div className="section-header">Recent Searches</div>
                  <ul className="recent-list">
                    {recentSearches.map((recent, index) => (
                      <li key={index}>
                        <button
                          onClick={() => handleRecentClick(recent)}
                          className="recent-item"
                          type="button"
                        >
                          <div className="recent-content">
                            <span className="recent-term">{recent.searchTerm}</span>
                            <span className="recent-type">{recent.searchType}</span>
                          </div>
                          <span className="recent-count">{recent.resultCount} results</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Help text */}
              {searchTerm.length < 2 && suggestions.length === 0 && recentSearches.length === 0 && (
                <div className="dropdown-section">
                  <div className="help-text">
                    <p>Start typing to search across all records</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => handleSearch()}
          className="search-button"
          disabled={!searchTerm.trim() || isLoading}
          aria-label="Search"
          type="button"
        >
          {isLoading ? (
            <span className="spinner" />
          ) : (
            <Search size={18} />
          )}
        </button>

        <button
          onClick={onFilterClick}
          className="filter-button"
          aria-label="Open filters"
          title="Advanced Filters"
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
        </button>
      </div>

      {/* Loading indicator */}
      {isLoading && <div className="search-loading">Searching...</div>}
    </div>
  );
};

export default GlobalSearchBar;
