# SolarTrack Pro - Best Practices

**Do's and don'ts, patterns, and recommendations**

## Code Quality

### Do's

- Keep functions small and focused
- Use meaningful variable names
- Write tests as you code
- Follow the single responsibility principle
- Keep dependencies minimal
- Use TypeScript for new code
- Validate input with Zod schemas
- Handle errors explicitly
- Use error boundaries for React components
- Log important operations and errors

### Don'ts

- Don't ignore errors (always catch)
- Don't use `any` type in TypeScript
- Don't commit console.log statements
- Don't hardcode values (use constants)
- Don't create functions > 30 lines
- Don't mutate state directly
- Don't use array index as React key
- Don't declare components inside functions
- Don't use async on useEffect
- Don't nest components too deeply

## React Patterns

### Do's

```javascript
// Good: Memoize expensive components
const ProjectCard = React.memo(({ project }) => {
  return <div>{project.title}</div>
})

// Good: Use hooks for reusable logic
function useProjectForm() {
  const [data, setData] = useState()
  // ...
  return { data, setData }
}

// Good: Controlled components
function Input({ value, onChange }) {
  return <input value={value} onChange={onChange} />
}

// Good: Destructure in parameters
function ProjectCard({ project, onEdit, onDelete }) {
  // ...
}
```

### Don'ts

```javascript
// Bad: Inline objects recreated every render
<Child style={{ color: 'red' }} />

// Bad: Declare components inside render
function Parent() {
  function Child() { return <div /> }
  return <Child />
}

// Bad: Index as key
{items.map((item, i) => <Item key={i} />)}

// Bad: Call hooks conditionally
if (condition) {
  const [state, setState] = useState()
}
```

## Performance

### Do's

- Use `React.memo()` for expensive components
- Use `useCallback()` for event handlers passed to children
- Use `useMemo()` for expensive computations
- Lazy load route components
- Code split by feature
- Optimize bundle size
- Use virtual scrolling for long lists
- Cache API responses appropriately
- Monitor performance metrics

### Don'ts

- Don't over-optimize prematurely
- Don't use `useMemo()` for cheap operations
- Don't create new objects in render
- Don't load all data upfront
- Don't store large objects in React state
- Don't update state too frequently
- Don't forget to cleanup subscriptions
- Don't make synchronous API calls in components

## Error Handling

### Do's

```javascript
// Good: Structured error handling
try {
  const result = await service.save(data)
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation
  } else if (error instanceof AuthError) {
    // Handle auth
  } else {
    // Handle generic
  }
}

// Good: User-friendly messages
toast.error('Unable to save project. Please try again.')

// Good: Log with context
logger.error('Save failed', {
  projectId: project.id,
  error: error.message,
  userId: user.id,
})
```

### Don'ts

```javascript
// Bad: Swallow errors silently
try {
  await saveProject(data)
} catch (error) {
  // Nothing!
}

// Bad: Expose internal errors to user
toast.error(error.message) // Might leak implementation details

// Bad: No context in logs
console.error(error)
```

## State Management

### Do's

- Keep state as close to usage as possible
- Use Context for truly global state
- Lift state when shared by siblings
- Use custom hooks for state logic
- Separate UI state from data state
- Make state immutable

### Don'ts

- Don't over-use Context
- Don't put all state in one place
- Don't store derived data
- Don't mutate state directly
- Don't mix concerns in Context

## API and Data

### Do's

```javascript
// Good: Parameterized queries prevent SQL injection
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('status', userInput) // Safe

// Good: Validate all inputs
const result = schema.parse(userInput)

// Good: Cache appropriate responses
const projects = useQuery('projects', () => api.getProjects())

// Good: Handle loading and error states
if (loading) return <Spinner />
if (error) return <ErrorMessage />
return <ProjectList data={projects} />
```

### Don'ts

```javascript
// Bad: String concatenation allows injection
const query = `SELECT * FROM projects WHERE status = '${userInput}'`

// Bad: No validation
function processData(data) { } // What format? What constraints?

// Bad: No error handling
const data = await api.getProjects()

// Bad: Ignoring loading state
const [projects] = useProjects()
```

## Testing

### Do's

- Write tests for business logic
- Test behavior, not implementation
- Use descriptive test names
- Keep tests focused
- Mock external dependencies
- Test error cases
- Aim for 70%+ coverage
- Use test-driven development (TDD)

### Don'ts

- Don't test library behavior
- Don't test implementation details
- Don't make brittle tests
- Don't skip async testing
- Don't hardcode test data
- Don't use unreliable timing (flaky tests)
- Don't test everything (diminishing returns)

## Code Review

### For Authors

```javascript
// Good: Clear, focused changes
// PR changes only validation schema
// One logical change per commit
// Follows coding standards

// Bad: Large PR with many unrelated changes
// Mixed refactoring with features
// Inconsistent formatting
```

### For Reviewers

```javascript
// Good: Constructive feedback
"Consider extracting this into a helper function for reusability"

// Bad: Nitpicky
"I would have named this 'projectForm' not 'ProjectForm'"
```

## Security

### Do's

- Never log passwords or tokens
- Validate on both client and server
- Use HTTPS everywhere
- Keep dependencies updated
- Use environment variables for secrets
- Sanitize user input
- Use parameterized queries
- Check authorization on server
- Implement proper authentication
- Use strong password requirements

### Don'ts

- Don't commit `.env.local`
- Don't hardcode API keys
- Don't trust client-side validation alone
- Don't send passwords in plaintext
- Don't log sensitive data
- Don't use eval() or similar
- Don't disable security warnings
- Don't use deprecated libraries
- Don't expose internal errors
- Don't store sensitive data unencrypted

## Performance Tips

### Bundle Size

- Tree-shake unused code
- Lazy load routes
- Use code splitting
- Minimize dependencies
- Use dynamic imports
- Monitor bundle size in CI

### Runtime Performance

- Avoid unnecessary renders
- Use key prop correctly
- Implement pagination
- Virtualize long lists
- Debounce/throttle expensive operations
- Use Web Workers for heavy computation

### Database

- Use indexes on frequently queried columns
- Implement pagination
- Select only needed columns
- Cache appropriately
- Monitor slow queries
- Use efficient filters

## Accessibility

### Do's

- Use semantic HTML
- Add alt text to images
- Use ARIA labels
- Support keyboard navigation
- Test with screen readers
- Provide good color contrast
- Avoid relying on color alone
- Use proper heading hierarchy

### Don'ts

- Don't hide content with `display: none` from screen readers
- Don't use placeholder as label
- Don't auto-play audio/video
- Don't use flashing content
- Don't require mouse-only interaction
- Don't use unsemantic divs for buttons

## Documentation

### Do's

- Document complex algorithms
- Write JSDoc for public APIs
- Keep README updated
- Document architectural decisions (ADRs)
- Add comments for "why", not "what"
- Link related documentation
- Include code examples
- Document error cases

### Don'ts

- Don't over-comment obvious code
- Don't let documentation get stale
- Don't write novels in comments
- Don't duplicate information
- Don't document what code already says

## Team Communication

### Do's

- Ask questions when blocked
- Share knowledge in team
- Review others' code promptly
- Document decisions
- Update team on progress
- Discuss before major changes
- Accept feedback gracefully
- Help others learn

### Don'ts

- Don't work in isolation
- Don't hoard knowledge
- Don't be defensive about feedback
- Don't make decisions alone
- Don't go silent when stuck
- Don't blame others
- Don't ignore suggestions
- Don't interrupt code reviews

---

## Quick Reference Checklist

Before pushing code:

- [ ] Tests written and passing
- [ ] Code follows standards
- [ ] Linter passes (`npm run lint`)
- [ ] TypeScript strict mode passes
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Secrets not committed
- [ ] Documentation updated
- [ ] PR description clear
- [ ] Code reviewed by myself first

