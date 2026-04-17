/**
 * SearchSuggestions Component
 * Displays autocomplete suggestions and recent searches in a dropdown menu
 */

import React from 'react';
import { Search, Clock, TrendingUp } from 'lucide-react';

const SearchSuggestions = ({
  suggestions = [],
  recentSearches = [],
  onSuggestionClick,
  onRecentClick,
  isLoading = false,
  searchTerm = ''
}) => {
  if (!suggestions.length && !recentSearches.length && !searchTerm) {
    return (
      <div className="search-suggestions-empty">
        <p className="text-gray-500 text-sm">Start typing to see suggestions</p>
      </div>
    );
  }

  return (
    <div className="search-suggestions-container">
      {/* Autocomplete Suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions-group">
          <div className="suggestions-header">
            <TrendingUp size={14} />
            <span>Suggestions</span>
          </div>
          <ul className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <li key={index}>
                <button
                  onClick={() => onSuggestionClick?.(suggestion)}
                  className="suggestion-item"
                  type="button"
                >
                  <Search size={14} />
                  <span>{suggestion}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && searchTerm.length < 2 && (
        <div className="suggestions-group">
          <div className="suggestions-header">
            <Clock size={14} />
            <span>Recent</span>
          </div>
          <ul className="recent-list">
            {recentSearches.map((recent, index) => (
              <li key={index}>
                <button
                  onClick={() => onRecentClick?.(recent)}
                  className="recent-item"
                  type="button"
                >
                  <div className="recent-info">
                    <span className="recent-term">{recent.searchTerm}</span>
                    <span className="recent-type">{recent.searchType}</span>
                  </div>
                  <span className="recent-count">{recent.resultCount || 0}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoading && (
        <div className="suggestions-loading">
          <div className="spinner" />
          <span>Searching...</span>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
