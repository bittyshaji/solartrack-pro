# ADR-003: React Context API over Redux

**Status:** Accepted  
**Date:** March 2024

## Context

SolarTrack Pro requires global state management for:

- User authentication and profile
- Project data and filters
- User preferences
- Notifications

We evaluated Redux vs React Context API.

## Decision

Use React Context API for global state, combined with custom hooks and local component state for feature-specific state.

## Rationale

### Why React Context API

1. **Simplicity**
   - No additional dependencies
   - Smaller bundle size (~0 vs ~30KB Redux)
   - Easier to understand and debug
   - Native React solution

2. **Adequate for Scale**
   - Current feature complexity doesn't require Redux's advanced features
   - Context sufficient for 3-4 global providers
   - Can add Redux later if needed

3. **Developer Experience**
   - Less boilerplate
   - Easier onboarding
   - Custom hooks are more intuitive

4. **Performance**
   - With proper optimization, equal performance
   - useCallback and useMemo prevent unnecessary rerenders
   - Context splitting keeps scope narrow

### Architecture

```
AuthContext
├── User data
├── Auth methods (signIn, signOut, etc.)
└── Auth state (loading, error)

ProjectDataContext
├── Projects list
├── Selected project
├── Filters
└── Data fetching state

Local Component State
├── Form data
├── UI state (modals, dropdowns)
└── Temporary selections
```

### Hooks Pattern

```javascript
// Global state
function useAuth() {
  return useContext(AuthContext)
}

// Feature-specific hooks with local state
function useProjectForm(initialData) {
  const [formData, setFormData] = useState(initialData)
  // ... form logic
}
```

## Consequences

### Positive

- Smaller bundle size
- Simpler codebase
- Easier to learn
- Less boilerplate
- Faster development

### Negative

- Context re-renders can be inefficient if not careful
- No built-in dev tools
- No time-travel debugging
- Limited for very complex state

### Performance Optimization

```javascript
// Split contexts to minimize re-renders
const AuthStateContext = createContext()
const AuthDispatchContext = createContext()

// Use selector pattern when reading state
const user = useContext(AuthStateContext).user

// Memoize expensive components
const ProjectCard = React.memo(({ project }) => ...)
```

## Alternatives Considered

### Redux
- Rejected: Overkill for current complexity; 30KB+ bundle overhead

### Zustand
- Rejected: Another dependency; Context is already available

### Apollo Client (for state management)
- Rejected: Would require GraphQL refactoring

## Migration Path

If complexity grows requiring Redux:

1. Context provides familiar patterns
2. Redux DevTools similar to current debugging
3. Incremental adoption possible
4. Custom hooks can transition to Redux hooks

## Related ADRs

- ADR-002: API Abstraction Layer
- ADR-001: TypeScript Adoption

## Best Practices

1. **Context Splitting**: Create separate contexts for unrelated state
2. **Memoization**: Use useMemo/useCallback to prevent unnecessary renders
3. **Custom Hooks**: Encapsulate context usage in hooks
4. **Local State**: Keep component state local when possible
5. **Prop Drilling**: Use Context only when >2 levels of prop passing

## Examples

```javascript
// Create context
const ThemeContext = createContext()

// Create provider component
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Create custom hook
function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be in ThemeProvider')
  return context
}

// Use in component
function Header() {
  const { theme, setTheme } = useTheme()
  return <header style={{ background: theme === 'dark' ? '#000' : '#fff' }} />
}
```
