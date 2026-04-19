/**
 * Filter Service for SolarTrack Pro
 * Handles filter creation, application, and management
 */

import { db } from '../config/database.js';

/**
 * Create a saved filter
 * @param {string} userId - User ID
 * @param {string} filterName - Name of the filter
 * @param {string} filterType - 'projects', 'customers', 'invoices'
 * @param {object} filterConfig - Filter configuration
 * @returns {Promise<{id: string, name: string, type: string, config: object}>}
 */
export async function createSavedFilter(userId, filterName, filterType, filterConfig) {
  try {
    // Validate filter config
    const validation = validateFilterConfig(filterConfig);
    if (!validation.valid) {
      throw new Error(`Invalid filter config: ${validation.errors.join(', ')}`);
    }

    const result = await db.query(
      `INSERT INTO saved_filters (user_id, name, type, config, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, name, type, config`,
      [userId, filterName, filterType, JSON.stringify(filterConfig)]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      config: JSON.parse(row.config),
    };
  } catch (error) {
    console.error('Create saved filter error:', error);
    throw error;
  }
}

/**
 * Get all saved filters for a user
 * @param {string} userId - User ID
 * @param {string} filterType - Optional filter type to narrow results
 * @returns {Promise<Array>}
 */
export async function getSavedFilters(userId, filterType = null) {
  try {
    let query = `
      SELECT id, name, type, config, is_default, created_at
      FROM saved_filters
      WHERE user_id = $1
    `;
    const params = [userId];

    if (filterType) {
      query += ` AND type = $2`;
      params.push(filterType);
    }

    query += ` ORDER BY is_default DESC, created_at DESC`;

    const result = await db.query(query, params);

    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      config: JSON.parse(row.config),
      isDefault: row.is_default,
      createdAt: row.created_at,
    }));
  } catch (error) {
    console.error('Get saved filters error:', error);
    return [];
  }
}

/**
 * Update a saved filter
 * @param {string} filterId - Filter ID
 * @param {object} filterConfig - Updated filter configuration
 * @param {string} userId - User ID (for verification)
 * @returns {Promise<object>}
 */
export async function updateSavedFilter(filterId, filterConfig, userId) {
  try {
    // Verify user owns filter
    const ownership = await db.query(
      `SELECT id FROM saved_filters WHERE id = $1 AND user_id = $2`,
      [filterId, userId]
    );

    if (ownership.rows.length === 0) {
      throw new Error('Filter not found or access denied');
    }

    // Validate filter config
    const validation = validateFilterConfig(filterConfig);
    if (!validation.valid) {
      throw new Error(`Invalid filter config: ${validation.errors.join(', ')}`);
    }

    const result = await db.query(
      `UPDATE saved_filters
       SET config = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, name, type, config`,
      [JSON.stringify(filterConfig), filterId]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      config: JSON.parse(row.config),
    };
  } catch (error) {
    console.error('Update saved filter error:', error);
    throw error;
  }
}

/**
 * Delete a saved filter
 * @param {string} filterId - Filter ID
 * @param {string} userId - User ID (for verification)
 * @returns {Promise<boolean>}
 */
export async function deleteSavedFilter(filterId, userId) {
  try {
    const result = await db.query(
      `DELETE FROM saved_filters
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [filterId, userId]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error('Delete saved filter error:', error);
    throw error;
  }
}

/**
 * Set a filter as default (auto-applied)
 * @param {string} userId - User ID
 * @param {string} filterId - Filter ID
 * @returns {Promise<boolean>}
 */
export async function setDefaultFilter(userId, filterId) {
  try {
    // Clear other defaults for this user
    await db.query(
      `UPDATE saved_filters SET is_default = false WHERE user_id = $1`,
      [userId]
    );

    // Set new default
    const result = await db.query(
      `UPDATE saved_filters
       SET is_default = true
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [filterId, userId]
    );

    return result.rows.length > 0;
  } catch (error) {
    console.error('Set default filter error:', error);
    throw error;
  }
}

/**
 * Apply a filter to data (client-side)
 * @param {Array} data - Array of objects to filter
 * @param {object} filterConfig - Filter configuration
 * @returns {Array}
 */
export function applyFilter(data, filterConfig) {
  if (!filterConfig || !Array.isArray(data)) {
    return data;
  }

  return data.filter(item => {
    if (Array.isArray(filterConfig)) {
      // Multiple filters (AND logic)
      return filterConfig.every(config => applyFilterCondition(item, config));
    } else {
      // Single filter
      return applyFilterCondition(item, filterConfig);
    }
  });
}

/**
 * Apply a single filter condition to an item
 * @param {object} item - Data item
 * @param {object} condition - Filter condition
 * @returns {boolean}
 */
function applyFilterCondition(item, condition) {
  const { field, operator, value } = condition;
  const itemValue = getNestedValue(item, field);

  switch (operator) {
    case 'equals':
      return itemValue === value;
    case 'notEquals':
      return itemValue !== value;
    case 'contains':
      return String(itemValue).toLowerCase().includes(String(value).toLowerCase());
    case 'startsWith':
      return String(itemValue).toLowerCase().startsWith(String(value).toLowerCase());
    case 'endsWith':
      return String(itemValue).toLowerCase().endsWith(String(value).toLowerCase());
    case 'gte':
      return Number(itemValue) >= Number(value);
    case 'lte':
      return Number(itemValue) <= Number(value);
    case 'gt':
      return Number(itemValue) > Number(value);
    case 'lt':
      return Number(itemValue) < Number(value);
    case 'between':
      return Number(itemValue) >= Number(value.min) && Number(itemValue) <= Number(value.max);
    case 'in':
      return Array.isArray(value) && value.includes(itemValue);
    case 'notIn':
      return Array.isArray(value) && !value.includes(itemValue);
    case 'isEmpty':
      return !itemValue || String(itemValue).trim() === '';
    case 'isNotEmpty':
      return itemValue && String(itemValue).trim() !== '';
    default:
      return true;
  }
}

/**
 * Get nested value from object by field path
 * @param {object} obj - Object
 * @param {string} path - Dot notation path
 * @returns {any}
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

/**
 * Validate filter configuration
 * @param {object} filterConfig - Filter configuration
 * @returns {{valid: boolean, errors: Array}}
 */
export function validateFilterConfig(filterConfig) {
  const errors = [];

  if (!filterConfig) {
    return { valid: false, errors: ['Filter config is required'] };
  }

  const validOperators = [
    'equals', 'notEquals', 'contains', 'startsWith', 'endsWith',
    'gte', 'lte', 'gt', 'lt', 'between', 'in', 'notIn',
    'isEmpty', 'isNotEmpty'
  ];

  if (Array.isArray(filterConfig)) {
    filterConfig.forEach((config, index) => {
      if (!config.field) {
        errors.push(`Filter ${index}: field is required`);
      }
      if (!config.operator || !validOperators.includes(config.operator)) {
        errors.push(`Filter ${index}: invalid operator`);
      }
      if (config.value === undefined && !['isEmpty', 'isNotEmpty'].includes(config.operator)) {
        errors.push(`Filter ${index}: value is required`);
      }
    });
  } else {
    if (!filterConfig.field) {
      errors.push('Field is required');
    }
    if (!filterConfig.operator || !validOperators.includes(filterConfig.operator)) {
      errors.push('Invalid operator');
    }
    if (filterConfig.value === undefined && !['isEmpty', 'isNotEmpty'].includes(filterConfig.operator)) {
      errors.push('Value is required');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Build SQL WHERE clause from filter configuration
 * @param {object} filterConfig - Filter configuration
 * @returns {string}
 */
export function buildFilterQuery(filterConfig) {
  if (!filterConfig) {
    return '';
  }

  const conditions = [];

  if (Array.isArray(filterConfig)) {
    filterConfig.forEach((config, index) => {
      conditions.push(buildSingleFilterQuery(config, index));
    });
    return conditions.join(' AND ');
  } else {
    return buildSingleFilterQuery(filterConfig, 0);
  }
}

/**
 * Build SQL for single filter condition
 * @param {object} condition - Single filter condition
 * @param {number} paramIndex - Parameter index for SQL
 * @returns {string}
 */
function buildSingleFilterQuery(condition, paramIndex) {
  const { field, operator, value } = condition;
  const paramNum = paramIndex + 1;

  switch (operator) {
    case 'equals':
      return `${field} = $${paramNum}`;
    case 'notEquals':
      return `${field} != $${paramNum}`;
    case 'contains':
      return `${field} ILIKE '%' || $${paramNum} || '%'`;
    case 'startsWith':
      return `${field} ILIKE $${paramNum} || '%'`;
    case 'endsWith':
      return `${field} ILIKE '%' || $${paramNum}`;
    case 'gte':
      return `${field} >= $${paramNum}`;
    case 'lte':
      return `${field} <= $${paramNum}`;
    case 'gt':
      return `${field} > $${paramNum}`;
    case 'lt':
      return `${field} < $${paramNum}`;
    case 'between':
      return `${field} BETWEEN $${paramNum}::jsonb->>'min' AND $${paramNum}::jsonb->>'max'`;
    case 'in':
      return `${field} = ANY($${paramNum})`;
    case 'notIn':
      return `${field} != ALL($${paramNum})`;
    case 'isEmpty':
      return `(${field} IS NULL OR ${field} = '')`;
    case 'isNotEmpty':
      return `(${field} IS NOT NULL AND ${field} != '')`;
    default:
      return '';
  }
}

/**
 * Get common filter presets for a type
 * @param {string} filterType - Type of search
 * @returns {Array}
 */
export function getFilterPresets(filterType) {
  const presets = {
    projects: [
      {
        name: 'All Active Projects',
        config: { field: 'status', operator: 'notEquals', value: 'EXE' },
      },
      {
        name: 'In Negotiation',
        config: { field: 'status', operator: 'equals', value: 'NEG' },
      },
      {
        name: 'Estimated Only',
        config: { field: 'status', operator: 'equals', value: 'EST' },
      },
      {
        name: 'High Value (>$50k)',
        config: { field: 'estimated_value', operator: 'gte', value: 50000 },
      },
    ],
    customers: [
      {
        name: 'All Active Customers',
        config: { field: 'is_active', operator: 'equals', value: true },
      },
      {
        name: 'Inactive Customers',
        config: { field: 'is_active', operator: 'equals', value: false },
      },
      {
        name: 'Customers with Email',
        config: { field: 'email', operator: 'isNotEmpty' },
      },
    ],
    invoices: [
      {
        name: 'Paid Invoices',
        config: { field: 'status', operator: 'equals', value: 'Paid' },
      },
      {
        name: 'Pending Invoices',
        config: { field: 'status', operator: 'equals', value: 'Pending' },
      },
      {
        name: 'Overdue Invoices',
        config: { field: 'status', operator: 'equals', value: 'Overdue' },
      },
      {
        name: 'High Amount (>$10k)',
        config: { field: 'total_amount', operator: 'gte', value: 10000 },
      },
    ],
  };

  return presets[filterType] || [];
}

/**
 * Combine multiple filters with AND logic
 * @param {Array} filters - Array of filter configurations
 * @returns {object|Array}
 */
export function combineFilters(filters = []) {
  if (!Array.isArray(filters) || filters.length === 0) {
    return null;
  }

  if (filters.length === 1) {
    return filters[0];
  }

  // Return array of filters (AND logic)
  return filters.filter(f => f && Object.keys(f).length > 0);
}

/**
 * Get default filter for user and type
 * @param {string} userId - User ID
 * @param {string} filterType - Filter type
 * @returns {Promise<object|null>}
 */
export async function getDefaultFilter(userId, filterType) {
  try {
    const result = await db.query(
      `SELECT config FROM saved_filters
       WHERE user_id = $1 AND type = $2 AND is_default = true
       LIMIT 1`,
      [userId, filterType]
    );

    return result.rows.length > 0 ? JSON.parse(result.rows[0].config) : null;
  } catch (error) {
    console.error('Get default filter error:', error);
    return null;
  }
}

/**
 * Clone a filter
 * @param {string} filterId - Original filter ID
 * @param {string} userId - User ID
 * @param {string} newName - Name for cloned filter
 * @returns {Promise<object>}
 */
export async function cloneFilter(filterId, userId, newName) {
  try {
    // Get original filter
    const original = await db.query(
      `SELECT type, config FROM saved_filters
       WHERE id = $1 AND user_id = $2`,
      [filterId, userId]
    );

    if (original.rows.length === 0) {
      throw new Error('Filter not found');
    }

    const { type, config } = original.rows[0];

    // Create new filter with same config
    return await createSavedFilter(userId, newName, type, JSON.parse(config));
  } catch (error) {
    console.error('Clone filter error:', error);
    throw error;
  }
}

/**
 * Export filter configuration for sharing
 * @param {string} filterId - Filter ID
 * @returns {Promise<string>}
 */
export async function exportFilter(filterId) {
  try {
    const result = await db.query(
      `SELECT name, type, config FROM saved_filters WHERE id = $1`,
      [filterId]
    );

    if (result.rows.length === 0) {
      throw new Error('Filter not found');
    }

    const filter = result.rows[0];
    return JSON.stringify({
      name: filter.name,
      type: filter.type,
      config: JSON.parse(filter.config),
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Export filter error:', error);
    throw error;
  }
}

/**
 * Import filter configuration
 * @param {string} userId - User ID
 * @param {string} filterJson - JSON string of filter
 * @returns {Promise<object>}
 */
export async function importFilter(userId, filterJson) {
  try {
    const filter = JSON.parse(filterJson);

    if (!filter.name || !filter.type || !filter.config) {
      throw new Error('Invalid filter format');
    }

    // Ensure unique name
    let name = filter.name;
    let counter = 1;
    while (true) {
      const existing = await db.query(
        `SELECT id FROM saved_filters WHERE user_id = $1 AND name = $2`,
        [userId, name]
      );
      if (existing.rows.length === 0) break;
      name = `${filter.name} (${++counter})`;
    }

    return await createSavedFilter(userId, name, filter.type, filter.config);
  } catch (error) {
    console.error('Import filter error:', error);
    throw error;
  }
}

/**
 * Get available search filters for UI
 * @param {string} filterType - Type of search (projects, customers, invoices)
 * @returns {Array}
 */
export function getSearchFilters(filterType) {
  // Return filter options for the advanced filter panel UI
  const filterOptions = {
    projects: [
      { field: 'name', label: 'Project Name', operators: ['contains', 'startsWith', 'equals'] },
      { field: 'status', label: 'Status', operators: ['equals', 'notEquals'], values: ['EST', 'NEG', 'EXE'] },
      { field: 'estimated_value', label: 'Estimated Value', operators: ['gte', 'lte', 'between'] },
      { field: 'created_at', label: 'Created Date', operators: ['gte', 'lte', 'between'] },
    ],
    customers: [
      { field: 'name', label: 'Customer Name', operators: ['contains', 'startsWith', 'equals'] },
      { field: 'email', label: 'Email', operators: ['contains', 'equals', 'isEmpty', 'isNotEmpty'] },
      { field: 'phone', label: 'Phone', operators: ['contains', 'equals'] },
      { field: 'is_active', label: 'Active', operators: ['equals'], values: [true, false] },
    ],
    invoices: [
      { field: 'invoice_number', label: 'Invoice Number', operators: ['contains', 'equals'] },
      { field: 'status', label: 'Status', operators: ['equals'], values: ['Pending', 'Paid', 'Overdue'] },
      { field: 'total_amount', label: 'Amount', operators: ['gte', 'lte', 'between'] },
      { field: 'due_date', label: 'Due Date', operators: ['gte', 'lte', 'between'] },
    ],
  };

  return filterOptions[filterType] || [];
}
