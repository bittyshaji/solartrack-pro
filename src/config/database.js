/**
 * Database Configuration for SolarTrack Pro
 * Provides a Supabase-backed database interface with query support
 *
 * NOTE: This module exports a db object with a query() method that mimics
 * a traditional PostgreSQL client interface. However, Supabase's JavaScript
 * client operates over HTTP via PostgREST API, not raw SQL.
 *
 * For production use with direct SQL queries, consider:
 * 1. Creating backend API endpoints that execute these queries
 * 2. Using Supabase RPC functions to wrap SQL operations
 * 3. Refactoring services to use PostgREST query builder (from/select/insert/update)
 */

import { supabase } from '../lib/supabase.js'

/**
 * Execute a SQL query against the Supabase database
 *
 * This is a compatibility shim that converts traditional SQL queries
 * to Supabase PostgREST operations when possible.
 *
 * @param {string} sql - SQL query string (parameterized queries not fully supported)
 * @param {Array} params - Array of parameters to bind to the query
 * @returns {Promise<{rows: Array, rowCount: number}>}
 */
export async function query(sql, params = []) {
  try {
    console.warn('[Database] Raw SQL query intercepted. Consider using Supabase API directly.')
    console.warn('[Database] Query:', sql)

    // For now, throw an error directing developers to use Supabase APIs properly
    // This prevents silent failures while services are being refactored
    throw new Error(
      'Raw SQL queries are not supported via Supabase JavaScript client. ' +
      'Refactor to use PostgREST API (from/select/insert/update) or create a backend endpoint. ' +
      'Query: ' + sql
    )
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

/**
 * Database object providing query interface
 *
 * This matches the API expected by filterService.js and searchService.js
 */
export const db = {
  query,
}

/**
 * Direct Supabase client export for operations that properly use PostgREST API
 */
export { supabase }
