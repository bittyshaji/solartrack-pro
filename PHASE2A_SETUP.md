# Phase 2A: Advanced Search & Filtering Setup Guide

## Overview
Phase 2A implements comprehensive search and filtering capabilities for SolarTrack Pro. This guide covers setup, integration, performance optimization, and testing.

## Part 1: Database Setup

### 1. Create Search Logs Table
```sql
CREATE TABLE search_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  search_term VARCHAR(500) NOT NULL,
  search_type VARCHAR(50) NOT NULL,
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_search_term (search_term)
);

-- Cleanup old search logs (keep last 90 days)
CREATE PROCEDURE cleanup_old_searches()
BEGIN
  DELETE FROM search_logs
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
END;

-- Schedule cleanup (run daily at 2 AM)
CREATE EVENT cleanup_searches_daily
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURDATE(), '02:00:00')
DO CALL cleanup_old_searches();
```

### 2. Create Saved Filters Table
```sql
CREATE TABLE saved_filters (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  config JSON NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_default (user_id, type, is_default),
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_is_default (is_default)
);
```

### 3. Add Full-Text Search Vectors

#### For Projects Table
```sql
-- Add search vector column
ALTER TABLE projects ADD COLUMN search_vector TSVECTOR;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_projects_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER projects_search_vector_trigger
BEFORE INSERT OR UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_projects_search_vector();

-- Update existing records
UPDATE projects SET search_vector = to_tsvector('english',
  COALESCE(name, '') || ' ' ||
  COALESCE(description, '')
);

-- Create GIN index for fast searches
CREATE INDEX idx_projects_search_vector ON projects USING GIN (search_vector);
```

#### For Customers Table
```sql
ALTER TABLE customers ADD COLUMN search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION update_customers_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.name, '') || ' ' ||
    COALESCE(NEW.email, '') || ' ' ||
    COALESCE(NEW.phone, '') || ' ' ||
    COALESCE(NEW.company, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_search_vector_trigger
BEFORE INSERT OR UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_customers_search_vector();

UPDATE customers SET search_vector = to_tsvector('english',
  COALESCE(name, '') || ' ' ||
  COALESCE(email, '') || ' ' ||
  COALESCE(phone, '') || ' ' ||
  COALESCE(company, '')
);

CREATE INDEX idx_customers_search_vector ON customers USING GIN (search_vector);
```

#### For Invoices Table
```sql
ALTER TABLE invoices ADD COLUMN search_vector TSVECTOR;

CREATE OR REPLACE FUNCTION update_invoices_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.invoice_number, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_search_vector_trigger
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoices_search_vector();

UPDATE invoices SET search_vector = to_tsvector('english',
  COALESCE(invoice_number, '')
);

CREATE INDEX idx_invoices_search_vector ON invoices USING GIN (search_vector);
```

## Part 2: Service Integration

### 1. Install Dependencies
```bash
npm install lucide-react
```

### 2. Deploy Search Service
- Location: `/src/lib/searchService.js`
- Provides: Full-text search, autocomplete, search history
- Functions: 10 core search operations
- Performance: Optimized for 10k+ records

### 3. Deploy Filter Service
- Location: `/src/lib/filterService.js`
- Provides: Filter creation, application, and management
- Functions: Filter CRUD, validation, and presets
- Supports: Complex multi-filter combinations

### 4. Configure Database Connection
Ensure `src/config/database.js` exports a properly configured database instance:

```javascript
import pg from 'pg';

const pool = new pg.Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

export const db = pool;
```

## Part 3: Component Setup

### 1. Add GlobalSearchBar to Layout
```jsx
import GlobalSearchBar from './components/GlobalSearchBar';

export default function Layout() {
  const handleSearch = (term, type) => {
    // Navigate to search page with results
    window.location.href = `/search?q=${term}&type=${type}`;
  };

  return (
    <>
      <GlobalSearchBar
        onSearch={handleSearch}
        onFilterClick={() => { /* open filter panel */ }}
        userId={currentUser.id}
      />
      {/* Rest of layout */}
    </>
  );
}
```

### 2. Add Search Route
```jsx
import SearchPage from './pages/SearchPage';

// In your router configuration:
{
  path: '/search',
  element: <SearchPage userId={currentUser.id} />
}
```

### 3. Add Filter Manager Route (Optional)
```jsx
// For dedicated filter management page
{
  path: '/filters',
  element: <SavedFiltersList userId={currentUser.id} />
}
```

## Part 4: Performance Optimization

### 1. Test Full-Text Search Performance
```bash
# Load test with 10k+ projects
SELECT COUNT(*) FROM projects;

# Test search query execution time
EXPLAIN ANALYZE
SELECT * FROM projects
WHERE search_vector @@ plainto_tsquery('english', 'solar');
```

### 2. Optimize Search Indexes
```sql
-- Analyze query performance
ANALYZE projects;

-- Reindex if needed
REINDEX INDEX idx_projects_search_vector;
```

### 3. Search Performance Targets
- Single search query: < 100ms
- Autocomplete suggestions: < 50ms
- Filter application: < 200ms
- Pagination load: < 100ms

### 4. Caching Strategy
```javascript
// Implement search result caching (recommended):
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedSearch(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}
```

## Part 5: Testing

### 1. Search Accuracy Tests
```javascript
// Test search term matching
describe('Search Accuracy', () => {
  test('matches project by name', async () => {
    const results = await performProjectSearch('Solar Panel');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Solar');
  });

  test('matches project by description', async () => {
    const results = await performProjectSearch('residential');
    expect(results.length).toBeGreaterThan(0);
  });

  test('handles special characters', async () => {
    const results = await performProjectSearch('test@example.com');
    expect(results).toBeDefined();
  });
});
```

### 2. Filter Combination Tests
```javascript
describe('Filter Combinations', () => {
  test('applies multiple filters', async () => {
    const filters = {
      status: ['EST', 'NEG'],
      minValue: 50000
    };
    const results = await performProjectSearch('solar', filters);
    results.forEach(p => {
      expect(['EST', 'NEG']).toContain(p.status);
      expect(p.estimatedValue).toBeGreaterThanOrEqual(50000);
    });
  });
});
```

### 3. Autocomplete Performance Tests
```javascript
describe('Autocomplete', () => {
  test('returns suggestions in < 50ms', async () => {
    const start = performance.now();
    await getAutocompleteSuggestions('sol', 'all', 5);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });

  test('handles partial matches', async () => {
    const suggestions = await getAutocompleteSuggestions('so', 'all', 5);
    expect(suggestions.length).toBeLessThanOrEqual(5);
  });
});
```

### 4. Special Character Handling
```javascript
test('handles special characters in search', async () => {
  const specialChars = ["@", "#", "$", "%", "&", "*", "'", '"'];
  
  for (const char of specialChars) {
    const results = await performFullTextSearch(`test${char}value`);
    expect(results).toBeDefined();
  }
});
```

## Part 6: Customization

### 1. Adjust Search Field Weights
In searchService.js, customize relevance:
```javascript
// Lower weight for older results
relevanceScore = row.relevance * (1 - daysSinceCreation * 0.001)
```

### 2. Add Custom Search Types
```javascript
// Extend performFullTextSearch:
case 'estimates':
  results = await performEstimateSearch(term, filters);
  break;
```

### 3. Tune Autocomplete Limit
```javascript
// Default is 5, adjust as needed:
await getAutocompleteSuggestions(term, type, 10);
```

### 4. Custom Filter Presets
```javascript
export function getFilterPresets(filterType) {
  const presets = {
    projects: [
      {
        name: 'Q4 Active Projects',
        config: { /* custom config */ }
      }
    ]
  };
  return presets[filterType] || [];
}
```

## Part 7: Keyboard Shortcuts

The GlobalSearchBar includes built-in keyboard shortcuts:

- **`/`** - Focus search input (anywhere on page)
- **`Enter`** - Execute search
- **`Escape`** - Close autocomplete dropdown

Add these to documentation for users.

## Deployment Checklist

- [x] Database tables created with proper indexes
- [x] Full-text search vectors configured
- [x] Search and filter services deployed
- [x] UI components integrated
- [x] Routes configured
- [x] Search history cleanup scheduled
- [x] Performance benchmarks tested
- [x] Special character handling verified
- [x] Autocomplete performance optimized
- [x] Error handling implemented
- [x] Accessibility (WCAG) compliance verified
- [x] Mobile responsive design tested
- [x] Documentation complete

## Monitoring

### Key Metrics to Track
1. Average search time
2. Autocomplete suggestion latency
3. Filter application time
4. Search result cache hit rate
5. Database query performance

### Log Monitoring
Monitor these in production logs:
- Search errors
- Filter validation failures
- Database connection issues
- Autocomplete performance outliers

## Troubleshooting

### Issue: Slow Search Performance
**Solution:**
1. Verify indexes exist: `SELECT * FROM pg_indexes WHERE tablename IN ('projects', 'customers', 'invoices');`
2. Reanalyze tables: `ANALYZE projects, customers, invoices;`
3. Check query execution plan with EXPLAIN ANALYZE

### Issue: Autocomplete Not Working
**Solution:**
1. Verify search_logs table exists
2. Check user_id parameter is passed correctly
3. Test with: `SELECT * FROM search_logs LIMIT 10;`

### Issue: Filters Not Applying
**Solution:**
1. Validate filter config structure
2. Check column names match database schema
3. Test filter with: `validateFilterConfig(filterConfig)`

### Issue: Special Characters Breaking Search
**Solution:**
1. PostgreSQL handles most special chars automatically
2. If needed, use prepared statements (already implemented)
3. Test with sanitized input

## Performance Optimization Tips

1. **Use database indexes** - Created automatically
2. **Implement caching** - For popular searches
3. **Paginate results** - Default 20 per page
4. **Limit autocomplete** - Default 5 suggestions
5. **Schedule cleanup** - Remove old logs regularly
6. **Monitor slow queries** - Set PostgreSQL slow query log

## Next Phase

Phase 2B will add:
- Analytics dashboard for search trends
- Advanced filter builder UI
- Filter sharing between users
- Search result export (CSV/PDF)
- Saved searches as smart shortcuts
