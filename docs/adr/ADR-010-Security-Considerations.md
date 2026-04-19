# ADR-010: Security Considerations and Data Protection

**Status:** Accepted  
**Date:** March 2024

## Context

SolarTrack Pro handles sensitive customer and project data requiring:

- Authentication and authorization
- Data protection in transit and at rest
- Protection against common web vulnerabilities
- Compliance with data privacy regulations
- Secure credential management

## Decision

Implement multi-layered security approach with database-level, API-level, and client-level protections.

## Rationale

### Authentication & Authorization

**Database Level - Row Level Security (RLS)**

```sql
-- Projects: Users access only their projects
CREATE POLICY "User access own projects"
  ON projects
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR auth.uid() IN (
      SELECT user_id FROM project_members WHERE project_id = projects.id
    )
  )

-- Customers: Users access customers they created
CREATE POLICY "Users access own customers"
  ON customers
  FOR SELECT
  USING (created_by = auth.uid())

-- Materials: Users access materials they created
CREATE POLICY "Users access own materials"
  ON materials
  FOR SELECT
  USING (created_by = auth.uid())
```

**API Level - Authorization Checks**

```javascript
// Service layer validates access before returning data
class ProjectService {
  static async getProjectById(projectId) {
    const user = await getCurrentUser()
    const project = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
    
    // RLS prevents query if unauthorized
    // This is safety net for API security
    if (!project) {
      throw new AuthorizationError('Cannot access project')
    }
    
    return project
  }
}
```

**Client Level - UI Safety**

```javascript
// Hide features from unauthorized users
function ProjectActions({ project }) {
  const { user } = useAuth()
  const canEdit = project.created_by === user.id || user.role === 'admin'
  
  return (
    <>
      <button>View</button>
      {canEdit && <button>Edit</button>}
      {canEdit && <button>Delete</button>}
    </>
  )
}
```

### Password Security

```javascript
// Strong password requirements enforced by Zod
const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 characters')
  .regex(/[A-Z]/, 'Must include uppercase')
  .regex(/[a-z]/, 'Must include lowercase')
  .regex(/[0-9]/, 'Must include number')
  .regex(/[!@#$%^&*]/, 'Must include special character')

// Passwords hashed by Supabase Auth (bcrypt with 12 rounds)
// Never transmitted or stored in plaintext
```

### Data Protection in Transit

```javascript
// All API calls use HTTPS (enforced by Supabase)
const supabaseUrl = 'https://...' // Always HTTPS

// Request headers include security info
const headers = {
  'Authorization': `Bearer ${session.access_token}`,
  'X-Correlation-ID': correlationId,
  'Content-Type': 'application/json',
}

// Never send sensitive data in URL params
// Bad: /api/projects?apiKey=secret
// Good: Headers with Bearer token
```

### Data Protection at Rest

```javascript
// Supabase PostgreSQL uses:
// - Encryption at rest
// - Regular backups with encryption
// - Point-in-time recovery
// - Managed by Supabase infrastructure

// Sensitive fields can use column-level encryption
// (Implementation depends on requirements)
```

### File Upload Security

```javascript
// /src/lib/storage/index.js
export async function uploadProjectPhoto(projectId, file) {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type')
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large')
  }
  
  // Create unique path to prevent overwrite
  const fileName = `${projectId}/${Date.now()}_${sanitizeFilename(file.name)}`
  
  // Upload with access control
  const { data, error } = await supabase.storage
    .from('project-photos')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })
  
  if (error) throw error
  
  return {
    path: data.path,
    url: getSignedUrl(data.path),
  }
}

// Sanitize filename to prevent directory traversal
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9._-]/gi, '_')
    .substring(0, 50)
}
```

### CORS Configuration

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_SUPABASE_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

// Supabase handles CORS headers
// Only allow requests from whitelisted origins
```

### XSS Prevention

```javascript
// React auto-escapes JSX content
// Safe (auto-escaped)
<div>{userInput}</div>

// Unsafe (don't do this)
<div dangerousInnerHTML={{ __html: userInput }} />

// For user-generated content, use sanitize library
import DOMPurify from 'dompurify'

function UserComment({ comment }) {
  return (
    <div
      dangerousInnerHTML={{
        __html: DOMPurify.sanitize(comment.text)
      }}
    />
  )
}
```

### CSRF Protection

```javascript
// Next.js/Express patterns (if implementing backend)
// Supabase handles CSRF for their endpoints

// For custom endpoints:
// 1. Use SameSite cookie attribute
// 2. Validate origin header
// 3. Use CSRF tokens for state-changing operations
```

### SQL Injection Prevention

```javascript
// Parameterized queries (always use)
// Safe - no SQL injection
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('status', userInput)

// Never concatenate user input into queries
// Unsafe - vulnerable to SQL injection
const { data } = await supabase
  .from('projects')
  .select('*')
  .filter('status', 'eq', `${userInput}`) // Never do this
```

### Sensitive Data Logging

```javascript
// Never log sensitive information
logger.error('Auth failed', {
  email: user.email,
  // Bad: never log passwords or tokens
  // password: user.password,
  // token: authToken,
})

// Sanitize before logging
logger.info('API request', {
  endpoint: '/users/123',
  // Bad: exposes email
  // email: user.email,
  // Good: safe identifier
  userId: user.id,
})
```

### Environment Variables

```bash
# .env.local (NEVER commit)
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...

# .env.production.example (safe to commit)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### Session Management

```javascript
// Supabase auth automatically handles:
// - JWT token expiration (1 hour)
// - Refresh token rotation (7 days)
// - Secure token storage (localStorage + httpOnly cookies)

// Client-side session check
function useProtectedRoute() {
  const { user, loading } = useAuth()
  
  useEffect(() => {
    // Refresh session on mount
    supabase.auth.refreshSession().catch(error => {
      console.error('Session refresh failed', error)
      // Redirect to login
    })
  }, [])
  
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" />
  
  return <DashboardPage />
}
```

### Error Message Security

```javascript
// Don't expose implementation details
// Bad: reveals database schema
throw new Error('User with email john@example.com not found')

// Good: generic message
throw new Error('Invalid email or password')

// For debugging, use error codes and logging
logger.error('User lookup failed', {
  code: 'USER_NOT_FOUND',
  email: sanitizedEmail,
})
```

### Security Headers (Nginx/Vercel configuration)

```nginx
# HTTPS enforced
ssl_protocols TLSv1.2 TLSv1.3;

# Security headers
add_header X-Content-Type-Options nosniff;
add_header X-Frame-Options SAMEORIGIN;
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy strict-origin-when-cross-origin;
add_header Permissions-Policy "geolocation=(), camera=()";
```

## Security Checklist

- [x] Use HTTPS everywhere
- [x] Strong password requirements
- [x] Row Level Security policies
- [x] Authorization checks in services
- [x] File upload validation
- [x] Input validation with Zod
- [x] XSS prevention (React auto-escape)
- [x] SQL injection prevention (parameterized queries)
- [x] Session management
- [x] Environment variable protection
- [ ] OWASP dependency scanning
- [ ] Regular security audits
- [ ] Penetration testing
- [ ] DDoS protection (via Supabase)

## Compliance Considerations

- GDPR: User data export/deletion capability
- CCPA: Privacy policy and opt-out
- PCI DSS: No credit card storage (payment processor handles)
- SOC 2: Audit logs and access controls

## Related ADRs

- ADR-002: API Abstraction Layer
- ADR-006: Error Handling Strategy
- ADR-007: Logging Approach

## References

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Supabase Security: https://supabase.com/docs/guides/auth
- Web.dev Security: https://web.dev/security/
