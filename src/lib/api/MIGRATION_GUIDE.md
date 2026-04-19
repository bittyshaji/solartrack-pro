# API Layer Migration Guide

This guide helps developers migrate from direct Supabase calls to the new centralized API abstraction layer.

## Overview

The new API layer provides:
- Unified error handling with standardized error codes
- Automatic retry logic with exponential backoff
- Request/response logging and validation
- Type-safe interfaces compatible with future TypeScript migration
- Reduced code duplication across services

## Quick Migration Checklist

- [ ] Review the examples in this guide
- [ ] Update imports in your service file
- [ ] Replace direct Supabase calls with API client calls
- [ ] Update error handling to use standardized error codes
- [ ] Test the migrated functions
- [ ] Remove error-handling boilerplate
- [ ] Remove retry logic (handled automatically)
- [ ] Update logging calls (handled by interceptors)

## Migration Examples

### Example 1: Simple SELECT

**Before:**
```javascript
import { supabase } from './supabase'

export async function getProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching projects:', err)
    return []
  }
}
```

**After:**
```javascript
import { query } from './api/client'

export async function getProjects() {
  try {
    return await query('projects')
      .orderBy('created_at', 'desc')
      .execute()
  } catch (err) {
    console.error('Error fetching projects:', err)
    return []
  }
}
```

**Benefits:**
- Cleaner, more readable code
- Automatic retry on network failures
- Standardized error handling
- Built-in logging (can be toggled with interceptors)

### Example 2: SELECT with Filters

**Before:**
```javascript
export async function getActiveProjects(status) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', status)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching projects:', err)
    return []
  }
}
```

**After:**
```javascript
export async function getActiveProjects(status) {
  try {
    return await query('projects')
      .filter('status', 'eq', status)
      .filter('is_active', 'eq', true)
      .orderBy('name', 'asc')
      .execute()
  } catch (err) {
    console.error('Error fetching projects:', err)
    return []
  }
}
```

### Example 3: INSERT

**Before:**
```javascript
export async function createProject(projectData) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        name: projectData.name,
        status: projectData.status || 'Planning',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Error creating project:', err)
    return { success: false, error: err.message }
  }
}
```

**After:**
```javascript
export async function createProject(projectData) {
  try {
    const data = await insert('projects', {
      name: projectData.name,
      status: projectData.status || 'Planning',
      created_at: new Date().toISOString()
    })
    return { success: true, data }
  } catch (err) {
    console.error('Error creating project:', err)
    return { success: false, error: err.message }
  }
}
```

### Example 4: UPDATE

**Before:**
```javascript
export async function updateProject(id, updates) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Error updating project:', err)
    return { success: false, error: err.message }
  }
}
```

**After:**
```javascript
export async function updateProject(id, updates) {
  try {
    const data = await update('projects', updates, { 'id__eq': id })
    return { success: true, data: data?.[0] }
  } catch (err) {
    console.error('Error updating project:', err)
    return { success: false, error: err.message }
  }
}
```

### Example 5: DELETE

**Before:**
```javascript
export async function deleteProject(id) {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Error deleting project:', err)
    return { success: false, error: err.message }
  }
}
```

**After:**
```javascript
import { delete: deleteRecord } from './api/client'

export async function deleteProject(id) {
  try {
    await deleteRecord('projects', { 'id__eq': id })
    return { success: true }
  } catch (err) {
    console.error('Error deleting project:', err)
    return { success: false, error: err.message }
  }
}
```

### Example 6: Error Handling

**Before:**
```javascript
export async function getProject(id) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.message.includes('not found')) {
        return null
      }
      throw error
    }
    return data
  } catch (err) {
    console.error('Unexpected error:', err)
    throw err
  }
}
```

**After:**
```javascript
import { select, ERROR_CODES } from './api/client'

export async function getProject(id) {
  try {
    const results = await select('projects', {
      filters: { 'id__eq': id }
    })
    return results?.[0] || null
  } catch (err) {
    if (err.code === ERROR_CODES.RECORD_NOT_FOUND) {
      return null
    }
    console.error('Unexpected error:', err.message)
    throw err
  }
}
```

### Example 7: Complex Queries with Pagination

**Before:**
```javascript
export async function searchProjects(filters, page = 1, pageSize = 20) {
  try {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('projects')
      .select('id, name, status, created_at')

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.searchTerm) {
      // Client-side search (not ideal for large datasets)
      const { data, error } = await query
      if (error) throw error
      return data.filter(p =>
        p.name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    }

    query = query
      .range(from, to)
      .order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error searching projects:', err)
    return []
  }
}
```

**After:**
```javascript
export async function searchProjects(filters, page = 1, pageSize = 20) {
  try {
    const builder = query('projects')
      .select(['id', 'name', 'status', 'created_at'])
      .orderBy('created_at', 'desc')

    if (filters.status) {
      builder.filter('status', 'eq', filters.status)
    }

    if (filters.searchTerm) {
      builder.filter('name', 'ilike', `%${filters.searchTerm}%`)
    }

    return await builder
      .paginate(page, pageSize)
      .execute()
  } catch (err) {
    console.error('Error searching projects:', err)
    return []
  }
}
```

## Filter Operators Reference

The API layer supports the following filter operators using the `filter__operator` syntax:

| Operator | Syntax | Description | Example |
|----------|--------|-------------|---------|
| Equal | `eq` | Exact match | `.filter('status', 'eq', 'active')` |
| Not Equal | `neq` | Not equal | `.filter('status', 'neq', 'deleted')` |
| Greater Than | `gt` | Greater than | `.filter('stage', 'gt', 5)` |
| Greater or Equal | `gte` | Greater than or equal | `.filter('stage', 'gte', 3)` |
| Less Than | `lt` | Less than | `.filter('stage', 'lt', 10)` |
| Less or Equal | `lte` | Less than or equal | `.filter('stage', 'lte', 8)` |
| In List | `in` | Value in array | `.filter('status', 'in', ['active', 'pending'])` |
| Contains | `contains` | Contains substring | `.filter('name', 'contains', 'solar')` |
| Like | `like` | Pattern match (case-sensitive) | `.filter('name', 'like', '%installation%')` |
| ILike | `ilike` | Pattern match (case-insensitive) | `.filter('name', 'ilike', '%installation%')` |
| Is | `is` | Is null/true/false | `.filter('deleted_at', 'is', null)` |

## Error Codes Reference

When errors occur, they include a standardized `code` field:

| Code | Description | When to Use |
|------|-------------|-------------|
| `AUTH_ERROR` | Authentication failed | Session expired |
| `UNAUTHORIZED` | Not authorized | No permission |
| `FORBIDDEN` | Access denied | User not allowed |
| `VALIDATION_ERROR` | Invalid input | Data doesn't meet requirements |
| `MISSING_REQUIRED_FIELD` | Required field missing | Incomplete data |
| `INVALID_INPUT` | Invalid field value | Wrong data type |
| `NETWORK_ERROR` | Network connection failed | No internet |
| `TIMEOUT_ERROR` | Request timed out | Slow network |
| `DATABASE_ERROR` | Database operation failed | Server issue |
| `DUPLICATE_KEY` | Duplicate record | Primary key exists |
| `RECORD_NOT_FOUND` | Record doesn't exist | Invalid ID |
| `FOREIGN_KEY_VIOLATION` | Relationship constraint violated | Dependent records exist |
| `INTERNAL_SERVER_ERROR` | Server error | Database crash |
| `SERVICE_UNAVAILABLE` | Service down | Maintenance |

## Configuration

Configure the API client at application startup:

```javascript
import { configureClient } from './api/client'

configureClient({
  enableRetry: true,
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    useJitter: true
  },
  enableLogging: true,
  timeout: 30000
})
```

## Logging

Enable logging with interceptors:

```javascript
import { createLoggingInterceptors } from './api/interceptors'

// Verbose logging
const { unregisterAll } = createLoggingInterceptors(true)

// Later: disable logging
unregisterAll()
```

## Testing

The API layer is designed to be testable. See `__tests__/client.test.js` for examples.

Key testing patterns:

1. **Mock the Supabase client**: Tests shouldn't hit the real database
2. **Test filter building**: Verify query builder logic
3. **Test error handling**: Ensure errors are standardized
4. **Test interceptors**: Verify before/after hooks work
5. **Integration tests**: Run against test database

## Common Pitfalls

### Pitfall 1: Forgetting Array Index

**Wrong:**
```javascript
const results = await select('projects')
// results is an array, use results[0] or first()
console.log(results.name) // undefined
```

**Right:**
```javascript
const results = await select('projects')
console.log(results[0].name) // correct
```

### Pitfall 2: Using Old Syntax

**Wrong:**
```javascript
const { data, error } = await select('projects')
// select doesn't return {data, error}, it returns data or throws
```

**Right:**
```javascript
try {
  const data = await select('projects')
  console.log(data)
} catch (error) {
  console.error(error.code, error.message)
}
```

### Pitfall 3: Forgetting Filter Operator

**Wrong:**
```javascript
.filter('status', 'active') // missing operator
```

**Right:**
```javascript
.filter('status', 'eq', 'active') // operator specified
```

### Pitfall 4: Not Handling Pagination Correctly

**Wrong:**
```javascript
.paginate(0, 20) // Pages are 1-indexed
```

**Right:**
```javascript
.paginate(1, 20) // First page
```

## Troubleshooting

### Issue: "Cannot find module './api/client'"

**Solution:** Ensure you're importing from the correct path:
```javascript
// Correct
import { select } from './api/client'

// Wrong - missing './api'
import { select } from './client'
```

### Issue: Queries returning empty array

**Solution:** Check your filters:
```javascript
// Make sure filter key syntax is correct
.filter('status', 'eq', 'active') // correct
.filter('status', 'active') // wrong - missing operator
```

### Issue: Slow queries

**Solution:** 
1. Enable logging to see query performance
2. Use pagination for large result sets
3. Select only needed columns
4. Add database indexes for filtered fields

### Issue: "User not authenticated" errors

**Solution:** Ensure Supabase authentication is set up before making API calls:
```javascript
import { supabase } from './supabase'

// Check auth status
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  console.log('User not authenticated')
}
```

## Rollback Plan

If you need to rollback to direct Supabase calls:

1. The old direct Supabase client is still available via `import { supabase } from './supabase'`
2. Keep the original service implementation in version control
3. The API layer is additive - it doesn't replace the Supabase client

Example fallback:
```javascript
import { select } from './api/client'
import { supabase } from './supabase'

export async function getProjects() {
  try {
    // Try new API layer first
    return await select('projects')
  } catch (error) {
    // Fallback to direct Supabase (temporary)
    console.warn('API layer failed, using direct Supabase')
    const { data, error: dbError } = await supabase
      .from('projects')
      .select('*')

    if (dbError) throw dbError
    return data || []
  }
}
```

## Performance Considerations

The API layer adds minimal overhead:

- **Serialization**: ~1ms for typical operations
- **Interceptors**: ~0.5ms each (disable if not needed)
- **Retry logic**: Only activates on errors
- **Logging**: Can be disabled with `configureClient({ enableLogging: false })`

## Next Steps

1. Start with one service and migrate completely
2. Run tests to ensure functionality
3. Monitor error logs for new error codes
4. Gradually migrate remaining services
5. Remove old direct Supabase calls
6. Configure logging/monitoring in production

## Support

For questions or issues:
1. Check this migration guide
2. Review example tests in `__tests__/`
3. Check the API README for detailed examples
4. Review source code comments in client.js, errorHandler.js, etc.
