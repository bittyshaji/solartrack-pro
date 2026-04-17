/**
 * SearchResultsCard Component
 * Display single search result with metadata and navigation
 */

import React from 'react';
import { ChevronRight, FileText, User, Receipt, Calendar, DollarSign } from 'lucide-react';
import './SearchResultsCard.css';

const SearchResultsCard = ({ result, onClick }) => {
  const getTypeIcon = () => {
    switch (result.type) {
      case 'project':
        return <FileText size={20} className="result-icon project-icon" />;
      case 'customer':
        return <User size={20} className="result-icon customer-icon" />;
      case 'invoice':
        return <Receipt size={20} className="result-icon invoice-icon" />;
      default:
        return <FileText size={20} className="result-icon" />;
    }
  };

  const getTypeBadge = () => {
    const typeLabels = {
      project: 'Project',
      customer: 'Customer',
      invoice: 'Invoice',
    };
    return typeLabels[result.type] || 'Result';
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getMetadata = () => {
    const metadata = [];

    if (result.createdAt) {
      metadata.push({
        icon: <Calendar size={14} />,
        label: formatDate(result.createdAt),
      });
    }

    switch (result.type) {
      case 'project':
        if (result.estimatedValue) {
          metadata.push({
            icon: <DollarSign size={14} />,
            label: `$${result.estimatedValue.toLocaleString()}`,
          });
        }
        if (result.status) {
          const statusLabel = result.status === 'EST' ? 'Estimated'
            : result.status === 'NEG' ? 'Negotiation' : 'Executed';
          metadata.push({
            label: statusLabel,
            className: `status-${result.status.toLowerCase()}`,
          });
        }
        break;

      case 'invoice':
        if (result.totalAmount) {
          metadata.push({
            icon: <DollarSign size={14} />,
            label: `$${result.totalAmount.toFixed(2)}`,
          });
        }
        if (result.status) {
          metadata.push({
            label: result.status,
            className: `status-${result.status.toLowerCase()}`,
          });
        }
        break;

      case 'customer':
        if (result.company) {
          metadata.push({
            label: result.company,
          });
        }
        if (result.city) {
          metadata.push({
            label: `${result.city}${result.state ? ', ' + result.state : ''}`,
          });
        }
        break;

      default:
        break;
    }

    return metadata;
  };

  const metadata = getMetadata();

  return (
    <div className="search-results-card" onClick={onClick} role="article" tabIndex={0}>
      <div className="card-content">
        <div className="card-header">
          <div className="header-left">
            {getTypeIcon()}
            <div className="header-text">
              <h3 className="result-name">{result.name}</h3>
              <span className="result-type-badge">{getTypeBadge()}</span>
            </div>
          </div>
          <div className="relevance-score">
            {result.relevanceScore && (
              <span className="score-badge">{Math.round(result.relevanceScore * 100)}%</span>
            )}
          </div>
        </div>

        {/* Matched field highlight */}
        {result.matchedField && (
          <div className="matched-field">
            <span className="label">Matched:</span>
            <span className="value">{result.matchedField}</span>
          </div>
        )}

        {/* Preview */}
        {result.preview && (
          <p className="result-preview">{result.preview}</p>
        )}

        {/* Metadata */}
        {metadata.length > 0 && (
          <div className="result-metadata">
            {metadata.map((item, index) => (
              <div key={index} className={`metadata-item ${item.className || ''}`}>
                {item.icon && <span className="metadata-icon">{item.icon}</span>}
                <span className="metadata-label">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card-action">
        <ChevronRight size={20} />
      </div>
    </div>
  );
};

export default SearchResultsCard;
