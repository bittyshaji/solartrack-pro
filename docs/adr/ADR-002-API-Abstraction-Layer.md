# ADR-002: Centralized API Abstraction Layer

**Status:** Accepted  
**Date:** March 2024

## Context

The application requires direct interaction with Supabase for authentication, database operations, and file storage. Initially, components were calling Supabase client directly, leading to:

- Scattered business logic across components
- Difficulty in changing database providers
- Inconsistent error handling
- Repeated code for common operations
- Hard to test components in isolation

## Decision

Create a centralized API abstraction layer (`/src/lib/api/client.js`) that all database operations flow through, combined with domain-specific service classes.

## Rationale

### Layered Architecture Benefits

```
Components
    |
    v
Hooks (useService, useQuery, useMutation)
    |
    v
Service Layer (ProjectService, CustomerService, etc.)
    |
    v
API Client Layer (Supabase wrapper with error handling, retry logic)
    |
    v
Supabase / Database
```

### Advantages

1. **Single Source of Truth**
   - All database interactions go through one client
   - Consistent error handling and logging
   - Easy to implement cross-cutting concerns

2. **Testability**
   - Mock API client for unit tests
   - Test services in isolation
   - Integration tests with real database

3. **Flexibility**
   - Could replace Supabase with different backend
   - Easy to add caching layer
   - Centralized retry/circuit breaker logic

4. **Maintainability**
   - Clear separation of concerns
   - Easier to find where data operations happen
   - Simplified debugging

5. **Performance**
   - Centralized place for query optimization
   - Easy to add request batching
   - Connection pooling management

### Implementation Structure

```javascript
// API Client (lowest level)
class SupabaseClient {
  from(table)
  select(columns)
  insert(data)
  update(data)
  delete()
  // ... query builders
}

// Service Layer (business logic)
class ProjectService {
  constructor(apiClient) {
    this.api = apiClient
  }
  
  async getProjects(filters) { }
  async createProject(data) { }
  async updateProject(id, data) { }
}

// Hooks (for React components)
function useProjects(filters) {
  const [data, setData] = useState(null)
  // Use ProjectService internally
}
```

## Consequences

### Positive

- Loose coupling between components and database
- Consistent error handling patterns
- Easy to add logging/monitoring
- Clear code organization
- Easier testing and mocking

### Negative

- Additional abstraction layers (learning curve)
- Slight performance overhead (negligible)
- More files to maintain

## Alternatives Considered

### GraphQL with Apollo Client
- Rejected: Overkill for current scale; Supabase RLS already provides filtering

### Direct component-level Supabase calls
- Rejected: Leads to unmaintainable code

## Current Implementation

- **API Client**: `/src/lib/api/client.js`
- **Error Handler**: `/src/lib/api/errorHandler.js`
- **Retry Logic**: `/src/lib/api/retry.js`
- **Services**: `/src/lib/services/{domain}/`
- **Hooks**: `/src/hooks/useService.js` pattern

## Related ADRs

- ADR-004: Testing Strategy
- ADR-006: Error Handling Strategy
- ADR-007: Logging Approach

## Future Enhancements

- [ ] Request batching
- [ ] GraphQL query generation
- [ ] Automatic caching layer
- [ ] Real-time subscription management
