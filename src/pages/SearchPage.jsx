/**
 * SearchPage Component
 * Full-page search interface with results, filters, and pagination
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import GlobalSearchBar from '../components/GlobalSearchBar';
import AdvancedFilterPanel from '../components/AdvancedFilterPanel';
import SearchResultsCard from '../components/SearchResultsCard';
import SavedFiltersList from '../components/SavedFiltersList';
import { performFullTextSearch, saveSearch } from '../lib/searchService';
import { createSavedFilter } from '../lib/filterService';
import './SearchPage.css';

const SearchPage = ({ userId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [executionTime, setExecutionTime] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('results');

  // Perform search
  const performSearch = useCallback(async (term, type = searchType, appliedFilters = filters) => {
    if (!term || !term.trim()) {
      setResults([]);
      setTotalCount(0);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const response = await performFullTextSearch(term, type, appliedFilters);

      setResults(response.results);
      setTotalCount(response.totalCount);
      setExecutionTime(response.executionTime);
      setSearchTerm(term);
      setSearchType(type);

      // Save to search history
      if (userId) {
        await saveSearch(userId, term, type, response.totalCount);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('An error occurred while searching. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters, searchType, userId]);

  // Handle search from search bar
  const handleSearch = (term, type) => {
    performSearch(term, type, filters);
  };

  // Handle filter apply
  const handleApplyFilters = (appliedFilters) => {
    setFilters(appliedFilters);
    performSearch(searchTerm, searchType, appliedFilters);
    setFilterPanelOpen(false);
  };

  // Handle save filter
  const handleSaveFilter = async (filterName, filterConfig) => {
    try {
      await createSavedFilter(userId, filterName, searchType, filterConfig);
      setShowSavedFilters(true);
    } catch (err) {
      console.error('Error saving filter:', err);
      setError('Failed to save filter');
    }
  };

  // Handle result click
  const handleResultClick = (result) => {
    const routes = {
      project: `/projects/${result.id}`,
      customer: `/customers/${result.id}`,
      invoice: `/invoices/${result.id}`,
    };

    const route = routes[result.type];
    if (route) {
      window.location.href = route;
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalCount / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const paginatedResults = results.slice(startIndex, endIndex);

  return (
    <div className="search-page">
      {/* Search bar */}
      <div className="search-page-header">
        <GlobalSearchBar
          onSearch={handleSearch}
          onFilterClick={() => setFilterPanelOpen(true)}
          userId={userId}
        />
      </div>

      <div className="search-page-container">
        {/* Main content */}
        <div className="search-page-main">
          {/* Results section */}
          <div className={`search-results-section ${activeTab === 'results' ? 'active' : ''}`}>
            {/* Results info */}
            {searchTerm && (
              <div className="results-info">
                <div className="results-header">
                  <h2>Search Results</h2>
                  <span className="result-count">
                    {totalCount} result{totalCount !== 1 ? 's' : ''}
                    {executionTime > 0 && (
                      <span className="execution-time"> in {executionTime}ms</span>
                    )}
                  </span>
                </div>

                {/* Applied filters display */}
                {Object.keys(filters).length > 0 && (
                  <div className="applied-filters">
                    <span className="filters-label">Filters applied:</span>
                    <div className="filter-tags">
                      {Object.entries(filters).map(([key, value]) => (
                        <span key={key} className="filter-tag">
                          {key}: {JSON.stringify(value).substring(0, 30)}...
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="loading-state">
                <div className="spinner" />
                <p>Searching...</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="error-state">
                <p className="error-message">{error}</p>
                <button
                  onClick={() => performSearch(searchTerm, searchType)}
                  className="retry-button"
                  type="button"
                >
                  Try again
                </button>
              </div>
            )}

            {/* No search term */}
            {!searchTerm && !isLoading && (
              <div className="empty-state">
                <Clock size={48} />
                <h3>Start searching</h3>
                <p>Enter a search term to find projects, customers, or invoices</p>
              </div>
            )}

            {/* No results */}
            {searchTerm && !isLoading && totalCount === 0 && !error && (
              <div className="no-results-state">
                <h3>No results found</h3>
                <p>Try a different search term or adjust your filters</p>
                <button
                  onClick={() => setFilterPanelOpen(true)}
                  className="modify-filters-button"
                  type="button"
                >
                  Modify Filters
                </button>
              </div>
            )}

            {/* Results list */}
            {searchTerm && !isLoading && totalCount > 0 && !error && (
              <>
                <div className="results-list">
                  {paginatedResults.map(result => (
                    <SearchResultsCard
                      key={`${result.type}-${result.id}`}
                      result={result}
                      onClick={() => handleResultClick(result)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="pagination-button"
                      aria-label="Previous page"
                      type="button"
                    >
                      <ChevronLeft size={18} />
                      Previous
                    </button>

                    <div className="pagination-info">
                      <span>Page {currentPage} of {totalPages}</span>
                      <span className="page-range">
                        ({startIndex + 1}-{endIndex} of {totalCount})
                      </span>
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="pagination-button"
                      aria-label="Next page"
                      type="button"
                    >
                      Next
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Saved filters section */}
          <div className={`saved-filters-section ${activeTab === 'filters' ? 'active' : ''}`}>
            <SavedFiltersList
              userId={userId}
              onLoadFilter={(filter) => {
                setFilters(filter.config);
                performSearch(searchTerm, searchType, filter.config);
                setActiveTab('results');
              }}
              onDeleteFilter={() => {}}
              filterType={searchType !== 'all' ? searchType : null}
            />
          </div>
        </div>

        {/* Sidebar - Mobile toggle hidden */}
        {/* Tabs for mobile */}
        {totalCount > 0 && (
          <div className="search-page-tabs">
            <button
              onClick={() => setActiveTab('results')}
              className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
              type="button"
            >
              Results ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('filters')}
              className={`tab-button ${activeTab === 'filters' ? 'active' : ''}`}
              type="button"
            >
              Saved Filters
            </button>
          </div>
        )}
      </div>

      {/* Filter panel */}
      <AdvancedFilterPanel
        searchType={searchType}
        onApplyFilters={handleApplyFilters}
        onSaveFilter={handleSaveFilter}
        isOpen={filterPanelOpen}
        onClose={() => setFilterPanelOpen(false)}
      />
    </div>
  );
};

export default SearchPage;
