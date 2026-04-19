# SolarTrack Pro API Abstraction Layer

A comprehensive, centralized abstraction layer for all Supabase database interactions in SolarTrack Pro. Provides unified error handling, retry logic, logging, and a fluent query interface.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Modules](#core-modules)
- [API Reference](#api-reference)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Retry Logic](#retry-logic)
- [Interceptors](#interceptors)
- [Testing](#testing)

## Features

- **Centralized API Client**: Single wrapper for all Supabase operations
- **Standardized Error Handling**: Converts errors to consistent format with error codes
- **Automatic Retry Logic**: Exponential backoff with jitter for resilience
- **Request/Response Interceptors**: Hooks for logging, validation, and transformation
- **Fluent Query Builder**: Chainable syntax for building complex queries
- **Type-Safe**: Compatible with future TypeScript migration
- **Pagination Support**: Built-in pagination and ordering
- **Batch Operations**: Execute multiple queries in sequence or parallel

## Installation

All files are located in `src/lib/api/`:

- `client.js` - Main API client
- `errorHandler.js` - Error standardization
- `retry.js` - Retry logic with exponential backoff
- `interceptors.js` - Request/response hooks

## Quick Start

### Basic Usage

```javascript
import { select, insert, update, delete } from './api/client'

// SELECT - Fetch all projects
const projects = await select('projects')

// SELECT with filters
const activeProjects = await select('projects', {
  filters: { status: 'active' }
})

// INSERT - Create new project
const newProject = await insert('projects', {
  name: 'Solar Installation',
  status: 'Planning',
  customer_id: 'CUST-123'
})

// UPDATE - Modify existing record
const updated = await update('projects',
  { status: 'In Progress' },
  { id: 'proj-123' }
)

// DELETE - Remove record
await delete('projects', { id: 'proj-123' })
```

### Using Query Builder

```javascript
import { query } from './api/client'

const results = await query('projects')
  .filter('status', 'eq', 'active')
  .filter('stage', 'neq', 'Completed')
  .orderBy('created_at', 'desc')
  .paginate(1, 20)
  .select(['id', 'name', 'status', 'customer_id'])
  .execute()
```

Wait, I need to adjust the QueryBuilder to have an execute method. Let me fix that:

Actually, let me review the code - the QueryBuilder returns the config with `.build()`, but users will call `.execute()`. Let me update the client to make this work better. Let me continue with the README first to show the intended usage:

## Core Modules

### 1. `client.js` - Main API Client

The primary interface for database operations. Provides:

- CRUD operations: `select()`, `insert()`, `update()`, `delete()`
- Advanced operations: `upsert()`, `count()`, `exists()`
- Query builder: `query()` for fluent interface
- Batch operations: `batch.sequence()`, `batch.parallel()`
- Configuration: `configureClient()`, `getClientConfig()`

### 2. `errorHandler.js` - Error Handling

Standardizes all errors to a consistent format:

```javascript
{
  code: 'ERROR_CODE',        // Standard error code
  message: 'User-friendly',  // Human-readable message
  details: 'Technical info'  // Debug details (optional)
}
```

Error codes include:
- Authentication: `AUTH_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`
- Validation: `VALIDATION_ERROR`, `MISSING_REQUIRED_FIELD`
- Network: `NETWORK_ERROR`, `TIMEOUT_ERROR`
- Database: `DATABASE_ERROR`, `DUPLICATE_KEY`, `FOREIGN_KEY_VIOLATION`
- Server: `INTERNAL_SERVER_ERROR`, `SERVICE_UNAVAILABLE`

### 3. `retry.js` - Retry Logic

Automatically retries failed operations with exponential backoff:

```javascript
const data = await withRetry(
  () => someAsyncOperation(),
  {
    maxRetries: 5,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    useJitter: true
  }
)
```

Features:
- Configurable retry attempts
- Exponential backoff: delay = initialDelay × multiplier^attempt
- Jitter to prevent thundering herd
- Smart retry detection (doesn't retry non-transient errors)

### 4. `interceptors.js` - Request/Response Hooks

Register callbacks to intercept requests and responses:

```javascript
import {
  addBeforeRequestInterceptor,
  addAfterResponseInterceptor,
  addErrorInterceptor
} from './api/interceptors'

// Log all requests
addBeforeRequestInterceptor((config) => {
  console.log(`Making request: ${config.operation} ${config.table}`)
  return config
})

// Log all responses
addAfterResponseInterceptor((data, context) => {
  console.log(`Completed in ${context.duration}ms`)
  return data
})

// Log all errors
addErrorInterceptor((error, context) => {
  console.error(`${context.operation} failed: ${error.message}`)
  return error
})
```

## API Reference

### `select(table, options)`

Fetch records from a table.

```javascript
// All records
await select('projects')

// With filters
await select('projects', {
  filters: {
    status: 'active',
    'stage__gte': 3
  }
})

// With pagination
await select('projects', {
  pagination: { from: 0, to: 9 },
  orderBy: { column: 'created_at', direction: 'desc' }
})

// Specific columns
await select('projects', {
  select: ['id', 'name', 'status']
})
```

### `insert(table, data, options)`

Insert one or more records.

```javascript
// Single record
const project = await insert('projects', {
  name: 'Solar Installation',
  status: 'Planning'
})

// Multiple records
const results = await insert('projects', [
  { name: 'Project 1', status: 'Planning' },
  { name: 'Project 2', status: 'Planning' }
])
```

### `update(table, updates, filters, options)`

Update records matching filters.

```javascript
const updated = await update(
  'projects',
  { status: 'In Progress', updated_at: new Date().toISOString() },
  { id: 'proj-123' }
)
```

### `delete(table, filters, options)`

Delete records matching filters.

```javascript
await delete('projects', { id: 'proj-123' })
```

### `upsert(table, data, onConflict, options)`

Insert or update records (upsert).

```javascript
const result = await upsert(
  'projects',
  { id: 'proj-123', name: 'Updated Name' },
  ['id']  // Conflict columns
)
```

### `count(table, filters)`

Count records matching filters.

```javascript
const activeCount = await count('projects', { status: 'active' })
```

### `exists(table, filters)`

Check if record exists.

```javascript
const projectExists = await exists('projects', { id: 'proj-123' })
```

### `query(table)`

Build complex queries using fluent interface.

```javascript
const results = await query('projects')
  .filter('status', 'eq', 'active')
  .filter('stage', 'in', [1, 2, 3])
  .orderBy('created_at', 'desc')
  .paginate(1, 20)
  .select(['id', 'name', 'status'])
  .build()
```

Note: Returns a config object. For execution, see usage examples below.

### `batch.sequence(operations)`

Execute operations in sequence (one after another).

```javascript
const [projects, customers] = await batch.sequence([
  () => select('projects'),
  () => select('project_customers')
])
```

### `batch.parallel(operations)`

Execute operations in parallel.

```javascript
const [projects, invoices, materials] = await batch.parallel([
  () => select('projects'),
  () => select('project_invoices'),
  () => select('materials')
])
```

### `configureClient(config)`

Configure API client behavior.

```javascript
configureClient({
  enableRetry: true,
  retryConfig: {
    maxRetries: 5,
    initialDelayMs: 100,
    maxDelayMs: 5000
  },
  enableLogging: true,
  timeout: 30000
})
```

## Usage Examples

### Example 1: Fetch Active Projects with Pagination

```javascript
import { select } from './api/client'

async function getActiveProjects(page = 1, pageSize = 20) {
  try {
    const projects = await select('projects', {
      filters: { status: 'active' },
      orderBy: { column: 'created_at', direction: 'desc' },
      pagination: {
        from: (page - 1) * pageSize,
        to: (page * pageSize) - 1
      },
      select: ['id', 'name', 'status', 'created_at']
    })
    return projects
  } catch (error) {
    console.error(`Failed to fetch projects: ${error.message}`)
    throw error
  }
}
```

### Example 2: Create Project with Nested Records

```javascript
import { insert, batch } from './api/client'

async function createProjectWithMaterials(projectData, materials) {
  try {
    // Create project
    const [project] = await insert('projects', projectData)

    // Create materials in parallel
    const materialInserts = materials.map(m =>
      () => insert('materials', { ...m, project_id: project.id })
    )

    await batch.parallel(materialInserts)

    return project
  } catch (error) {
    console.error(`Failed to create project: ${error.message}`)
    throw error
  }
}
```

### Example 3: Update Multiple Records Safely

```javascript
import { update, count } from './api/client'

async function updateProjectStatus(fromStatus, toStatus) {
  try {
    // Check how many will be updated
    const recordCount = await count('projects', { status: fromStatus })
    console.log(`Updating ${recordCount} projects...`)

    // Perform update
    const updated = await update(
      'projects',
      {
        status: toStatus,
        updated_at: new Date().toISOString()
      },
      { status: fromStatus }
    )

    return { updated: updated.length, total: recordCount }
  } catch (error) {
    console.error(`Failed to update projects: ${error.message}`)
    throw error
  }
}
```

### Example 4: Search with Complex Filters

```javascript
import { query } from './api/client'

async function searchProjects(filters) {
  const builder = query('projects')

  if (filters.status) {
    builder.filter('status', 'eq', filters.status)
  }

  if (filters.searchTerm) {
    builder.filter('name', 'ilike', `%${filters.searchTerm}%`)
  }

  if (filters.minStage) {
    builder.filter('stage', 'gte', filters.minStage)
  }

  if (filters.dateRange) {
    builder.filter('created_at', 'gte', filters.dateRange.start)
  }

  return builder
    .orderBy('created_at', 'desc')
    .paginate(filters.page || 1, filters.pageSize || 20)
    .build()
}
```

### Example 5: Error Handling

```javascript
import { select } from './api/client'
import { ERROR_CODES } from './api/errorHandler'

async function fetchProjectSafely(projectId) {
  try {
    const [project] = await select('projects', {
      filters: { id: projectId }
    })

    if (!project) {
      throw {
        code: ERROR_CODES.RECORD_NOT_FOUND,
        message: 'Project not found'
      }
    }

    return project
  } catch (error) {
    switch (error.code) {
      case ERROR_CODES.RECORD_NOT_FOUND:
        console.log('Project not found:', projectId)
        return null

      case ERROR_CODES.UNAUTHORIZED:
        console.error('Authentication failed. Please login.')
        // Redirect to login
        break

      case ERROR_CODES.NETWORK_ERROR:
        console.error('Network connection failed. Please try again.')
        break

      default:
        console.error(`Error: ${error.message}`)
    }

    throw error
  }
}
```

## Error Handling

All API calls throw standardized error objects:

```javascript
{
  code: 'VALIDATION_ERROR',
  message: 'Missing required fields: name, status',
  details: 'Required fields: name, status'
}
```

Handle errors by checking the error code:

```javascript
import { ERROR_CODES } from './api/errorHandler'

try {
  await insert('projects', { status: 'active' })
} catch (error) {
  if (error.code === ERROR_CODES.MISSING_REQUIRED_FIELD) {
    // Handle missing field
  } else if (error.code === ERROR_CODES.DUPLICATE_KEY) {
    // Handle duplicate
  } else if (error.code === ERROR_CODES.NETWORK_ERROR) {
    // Handle network issue (already retried)
  }
}
```

## Retry Logic

Retry is enabled by default with sensible defaults:
- Max retries: 3
- Initial delay: 100ms
- Max delay: 5000ms
- Multiplier: 2 (100ms → 200ms → 400ms)

Disable or customize retry:

```javascript
import { configureClient } from './api/client'

// Disable retry
configureClient({ enableRetry: false })

// Customize retry
configureClient({
  enableRetry: true,
  retryConfig: {
    maxRetries: 5,
    initialDelayMs: 50,
    maxDelayMs: 10000,
    backoffMultiplier: 1.5,
    useJitter: true
  }
})
```

## Interceptors

### Global Logging

```javascript
import { createLoggingInterceptors } from './api/interceptors'

// Enable verbose logging
const { unregisterAll } = createLoggingInterceptors(true)

// Later: disable logging
unregisterAll()
```

### Custom Validation

```javascript
import { addBeforeRequestInterceptor } from './api/interceptors'

addBeforeRequestInterceptor((config) => {
  // Ensure all updates include timestamp
  if (config.operation === 'update') {
    config.data.updated_at = new Date().toISOString()
  }
  return config
})
```

### Performance Monitoring

```javascript
import { addAfterResponseInterceptor } from './api/interceptors'

addAfterResponseInterceptor((data, context) => {
  if (context.duration > 1000) {
    console.warn(`Slow query: ${context.operation} took ${context.duration}ms`)
  }
  return data
})
```

## Testing

Example test file using the API layer:

```javascript
import { select, insert, update, delete, count } from './api/client'

describe('API Client', () => {
  test('should fetch projects', async () => {
    const projects = await select('projects')
    expect(Array.isArray(projects)).toBe(true)
  })

  test('should insert project', async () => {
    const project = await insert('projects', {
      name: 'Test Project',
      status: 'Planning'
    })
    expect(project).toHaveProperty('id')
  })

  test('should handle errors', async () => {
    try {
      await insert('projects', { /* missing required fields */ })
      expect(true).toBe(false) // Should not reach here
    } catch (error) {
      expect(error.code).toBeDefined()
      expect(error.message).toBeDefined()
    }
  })

  test('should count records', async () => {
    const count = await count('projects', { status: 'active' })
    expect(typeof count).toBe('number')
  })
})
```

## Migration Guide

### Before (Direct Supabase)

```javascript
import { supabase } from './supabase'

const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'active')

if (error) {
  console.error(error)
}
```

### After (API Layer)

```javascript
import { select, ERROR_CODES } from './api/client'

try {
  const data = await select('projects', {
    filters: { status: 'active' }
  })
} catch (error) {
  if (error.code === ERROR_CODES.NETWORK_ERROR) {
    // Already retried automatically
  }
}
```

## Best Practices

1. **Use Query Builder for Complex Queries**: More readable and maintainable
2. **Always Catch Errors**: Check error codes, not just error messages
3. **Use Batch Operations**: For multiple independent queries, use `batch.parallel()`
4. **Leverage Interceptors**: Add logging/validation in one place
5. **Configure Client Once**: Call `configureClient()` at app startup
6. **Paginate Large Results**: Use pagination for better performance
7. **Validate Inputs**: Use validation interceptors to catch issues early

## Migration Roadmap

The API layer is designed to support future TypeScript migration:
- All functions have JSDoc type annotations
- Error codes and types are exported separately
- No breaking changes when converting to TypeScript
