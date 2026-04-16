/**
 * Search Service for SolarTrack Pro
 * Handles full-text search, filters, and autocomplete functionality
 * Supports searching projects, customers, invoices
 */

import { db } from '../config/database.js';

/**
 * Perform full-text search across specified content types
 * @param {string} searchTerm - The search query
 * @param {string} searchType - 'projects', 'customers', 'invoices', 'all'
 * @param {object} filters - Additional filters to apply
 * @returns {Promise<{results: Array, totalCount: number, executionTime: number}>}
 */
export async function performFullTextSearch(searchTerm, searchType = 'all', filters = {}) {
  const startTime = performance.now();

  try {
    // Validate search term
    if (!searchTerm || searchTerm.trim().length === 0) {
      return { results: [], totalCount: 0, executionTime: 0 };
    }

    const cleanTerm = searchTerm.trim();
    let results = [];

    // Execute search based on type
    switch (searchType) {
      case 'projects':
        results = await performProjectSearch(cleanTerm, filters);
        break;
      case 'customers':
        results = await performCustomerSearch(cleanTerm, filters);
        break;
      case 'invoices':
        results = await performInvoiceSearch(cleanTerm, filters);
        break;
      case 'all':
        const [projects, customers, invoices] = await Promise.all([
          performProjectSearch(cleanTerm, filters),
          performCustomerSearch(cleanTerm, filters),
          performInvoiceSearch(cleanTerm, filters),
        ]);
        results = [
          ...projects.map(p => ({ ...p, type: 'project' })),
          ...customers.map(c => ({ ...c, type: 'customer' })),
          ...invoices.map(i => ({ ...i, type: 'invoice' })),
        ];
        break;
      default:
        return { results: [], totalCount: 0, executionTime: 0 };
    }

    const executionTime = performance.now() - startTime;

    return {
      results,
      totalCount: results.length,
      executionTime: Math.round(executionTime),
    };
  } catch (error) {
    console.error('Full-text search error:', error);
    return { results: [], totalCount: 0, executionTime: 0, error: error.message };
  }
}

/**
 * Search projects by name, customer, description
 * @param {string} searchTerm - Search query
 * @param {object} filters - {status, customer, dateRange, minValue}
 * @returns {Promise<Array>}
 */
export async function performProjectSearch(searchTerm, filters = {}) {
  try {
    let query = `
      SELECT
        p.id,
        p.name,
        c.name AS customer_name,
        p.description,
        p.status,
        p.estimated_value,
        p.created_at,
        ts_rank(p.search_vector, plainto_tsquery('english', $1)) AS relevance,
        p.search_vector
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.search_vector @@ plainto_tsquery('english', $1)
    `;

    const params = [searchTerm];
    let paramCount = 1;

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      paramCount++;
      query += ` AND p.status = ANY($${paramCount})`;
      params.push(filters.status);
    }

    // Apply customer filter
    if (filters.customer) {
      paramCount++;
      query += ` AND p.customer_id = $${paramCount}`;
      params.push(filters.customer);
    }

    // Apply date range filter
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        paramCount++;
        query += ` AND p.created_at >= $${paramCount}`;
        params.push(filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        paramCount++;
        query += ` AND p.created_at <= $${paramCount}`;
        params.push(filters.dateRange.end);
      }
    }

    // Apply minimum value filter
    if (filters.minValue) {
      paramCount++;
      query += ` AND p.estimated_value >= $${paramCount}`;
      params.push(filters.minValue);
    }

    // Apply maximum value filter
    if (filters.maxValue) {
      paramCount++;
      query += ` AND p.estimated_value <= $${paramCount}`;
      params.push(filters.maxValue);
    }

    query += ` ORDER BY relevance DESC, p.created_at DESC`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      customerName: row.customer_name,
      description: row.description,
      status: row.status,
      estimatedValue: row.estimated_value,
      createdAt: row.created_at,
      matchedField: 'name/description',
      preview: row.description?.substring(0, 100) || '',
      relevanceScore: Math.round(row.relevance * 100) / 100,
    }));
  } catch (error) {
    console.error('Project search error:', error);
    return [];
  }
}

/**
 * Search customers by name, email, phone, company
 * @param {string} searchTerm - Search query
 * @param {object} filters - {city, state, activeStatus}
 * @returns {Promise<Array>}
 */
export async function performCustomerSearch(searchTerm, filters = {}) {
  try {
    let query = `
      SELECT
        c.id,
        c.name,
        c.email,
        c.phone,
        c.company,
        c.city,
        c.state,
        c.is_active,
        c.created_at,
        ts_rank(c.search_vector, plainto_tsquery('english', $1)) AS relevance
      FROM customers c
      WHERE c.search_vector @@ plainto_tsquery('english', $1)
    `;

    const params = [searchTerm];
    let paramCount = 1;

    // Apply city filter
    if (filters.city) {
      paramCount++;
      query += ` AND c.city = $${paramCount}`;
      params.push(filters.city);
    }

    // Apply state filter
    if (filters.state) {
      paramCount++;
      query += ` AND c.state = $${paramCount}`;
      params.push(filters.state);
    }

    // Apply active status filter
    if (filters.activeStatus !== undefined) {
      paramCount++;
      query += ` AND c.is_active = $${paramCount}`;
      params.push(filters.activeStatus);
    }

    query += ` ORDER BY relevance DESC, c.created_at DESC`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      city: row.city,
      state: row.state,
      isActive: row.is_active,
      createdAt: row.created_at,
      matchedField: 'name/email/phone/company',
      preview: `${row.company || ''} ${row.city || ''}`.trim(),
      relevanceScore: Math.round(row.relevance * 100) / 100,
    }));
  } catch (error) {
    console.error('Customer search error:', error);
    return [];
  }
}

/**
 * Search invoices by number, project name, customer name
 * @param {string} searchTerm - Search query
 * @param {object} filters - {status, dateRange, amountRange}
 * @returns {Promise<Array>}
 */
export async function performInvoiceSearch(searchTerm, filters = {}) {
  try {
    let query = `
      SELECT
        i.id,
        i.invoice_number,
        p.name AS project_name,
        c.name AS customer_name,
        i.status,
        i.total_amount,
        i.created_at,
        ts_rank(i.search_vector, plainto_tsquery('english', $1)) AS relevance
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.search_vector @@ plainto_tsquery('english', $1)
    `;

    const params = [searchTerm];
    let paramCount = 1;

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      paramCount++;
      query += ` AND i.status = ANY($${paramCount})`;
      params.push(filters.status);
    }

    // Apply date range filter
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        paramCount++;
        query += ` AND i.created_at >= $${paramCount}`;
        params.push(filters.dateRange.start);
      }
      if (filters.dateRange.end) {
        paramCount++;
        query += ` AND i.created_at <= $${paramCount}`;
        params.push(filters.dateRange.end);
      }
    }

    // Apply amount range filter
    if (filters.amountRange) {
      if (filters.amountRange.min) {
        paramCount++;
        query += ` AND i.total_amount >= $${paramCount}`;
        params.push(filters.amountRange.min);
      }
      if (filters.amountRange.max) {
        paramCount++;
        query += ` AND i.total_amount <= $${paramCount}`;
        params.push(filters.amountRange.max);
      }
    }

    query += ` ORDER BY relevance DESC, i.created_at DESC`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      projectName: row.project_name,
      customerName: row.customer_name,
      status: row.status,
      totalAmount: row.total_amount,
      createdAt: row.created_at,
      matchedField: 'invoice_number/project/customer',
      preview: `${row.invoice_number} - $${row.total_amount.toFixed(2)}`,
      relevanceScore: Math.round(row.relevance * 100) / 100,
    }));
  } catch (error) {
    console.error('Invoice search error:', error);
    return [];
  }
}

/**
 * Retrieve user's search history
 * @param {string} userId - User ID
 * @param {number} limit - Number of searches to retrieve
 * @returns {Promise<Array>}
 */
export async function getSearchHistory(userId, limit = 20) {
  try {
    const result = await db.query(
      `SELECT search_term, search_type, result_count, created_at
       FROM search_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => ({
      searchTerm: row.search_term,
      searchType: row.search_type,
      resultCount: row.result_count,
      timestamp: row.created_at,
    }));
  } catch (error) {
    console.error('Search history retrieval error:', error);
    return [];
  }
}

/**
 * Save search to history
 * @param {string} userId - User ID
 * @param {string} searchTerm - Search query
 * @param {string} searchType - Type of search
 * @param {number} resultCount - Number of results
 * @returns {Promise<void>}
 */
export async function saveSearch(userId, searchTerm, searchType, resultCount) {
  try {
    await db.query(
      `INSERT INTO search_logs (user_id, search_term, search_type, result_count, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId, searchTerm, searchType, resultCount || 0]
    );
  } catch (error) {
    console.error('Search save error:', error);
  }
}

/**
 * Clear all search history for user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export async function clearSearchHistory(userId) {
  try {
    await db.query(
      `DELETE FROM search_logs WHERE user_id = $1`,
      [userId]
    );
    return true;
  } catch (error) {
    console.error('Clear search history error:', error);
    return false;
  }
}

/**
 * Get autocomplete suggestions based on partial input
 * @param {string} partial - Partial search term
 * @param {string} searchType - Type filter ('all', 'projects', 'customers', 'invoices')
 * @param {number} limit - Number of suggestions
 * @returns {Promise<Array>}
 */
export async function getAutocompleteSuggestions(partial, searchType = 'all', limit = 5) {
  try {
    if (!partial || partial.trim().length < 2) {
      return [];
    }

    const cleanPartial = partial.trim();
    let query = `
      SELECT search_term, COUNT(*) as frequency
      FROM search_logs
      WHERE search_term ILIKE $1
    `;

    const params = [`${cleanPartial}%`];

    if (searchType !== 'all') {
      query += ` AND search_type = $2`;
      params.push(searchType);
    }

    query += `
      GROUP BY search_term
      ORDER BY frequency DESC, search_term ASC
      LIMIT $${params.length + 1}
    `;
    params.push(limit);

    const result = await db.query(query, params);
    return result.rows.map(row => row.search_term);
  } catch (error) {
    console.error('Autocomplete suggestions error:', error);
    return [];
  }
}

/**
 * Get available filters for a search type
 * @param {string} searchType - Type of search ('projects', 'customers', 'invoices')
 * @returns {object}
 */
export async function getSearchFilters(searchType) {
  try {
    const filterConfigs = {
      projects: {
        status: ['EST', 'NEG', 'EXE'],
        customer: [], // Populated dynamically
        dateRange: true,
        valueRange: true,
      },
      customers: {
        city: [], // Populated dynamically
        state: [], // Populated dynamically
        activeStatus: [true, false],
      },
      invoices: {
        status: ['Paid', 'Pending', 'Overdue'],
        dateRange: true,
        amountRange: true,
      },
    };

    if (searchType === 'projects') {
      const customers = await db.query(`SELECT DISTINCT name FROM customers ORDER BY name`);
      filterConfigs.projects.customer = customers.rows.map(r => r.name);
    } else if (searchType === 'customers') {
      const cities = await db.query(`SELECT DISTINCT city FROM customers WHERE city IS NOT NULL ORDER BY city`);
      const states = await db.query(`SELECT DISTINCT state FROM customers WHERE state IS NOT NULL ORDER BY state`);
      filterConfigs.customers.city = cities.rows.map(r => r.city);
      filterConfigs.customers.state = states.rows.map(r => r.state);
    }

    return filterConfigs[searchType] || {};
  } catch (error) {
    console.error('Search filters error:', error);
    return {};
  }
}

/**
 * Perform advanced search with complex configuration
 * @param {object} config - {type, term, filters, sortBy, limit, offset}
 * @returns {Promise<{results: Array, totalCount: number, page: number, pageSize: number}>}
 */
export async function advancedSearch(config = {}) {
  const {
    type = 'all',
    term = '',
    filters = {},
    sortBy = 'relevance',
    limit = 20,
    offset = 0,
  } = config;

  try {
    const results = await performFullTextSearch(term, type, filters);

    // Sort results
    let sorted = [...results.results];
    if (sortBy === 'relevance') {
      sorted.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    } else if (sortBy === 'date') {
      sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    // Paginate
    const paginatedResults = sorted.slice(offset, offset + limit);
    const totalCount = sorted.length;
    const page = Math.floor(offset / limit) + 1;

    return {
      results: paginatedResults,
      totalCount,
      page,
      pageSize: limit,
    };
  } catch (error) {
    console.error('Advanced search error:', error);
    return {
      results: [],
      totalCount: 0,
      page: 1,
      pageSize: limit,
      error: error.message,
    };
  }
}
