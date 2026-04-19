# SolarTrack Pro - Coding Standards

**Version:** 1.0  
**Last Updated:** April 2026

## Table of Contents

1. [JavaScript/React](#javascriptreact)
2. [Naming Conventions](#naming-conventions)
3. [Component Structure](#component-structure)
4. [Functions and Methods](#functions-and-methods)
5. [Error Handling](#error-handling)
6. [Comments and Documentation](#comments-and-documentation)
7. [Testing](#testing)
8. [Code Organization](#code-organization)
9. [Performance](#performance)
10. [Accessibility](#accessibility)

---

## JavaScript/React

### Use Modern JavaScript

```javascript
// Good: ES6+ features
const items = array.map(item => item.value)
const name = user?.profile?.name ?? 'Unknown'

// Avoid: Old patterns
var items = array.map(function(item) { return item.value })
```

### Use const by default

```javascript
// Good
const name = 'John'

// Use let for reassignable
let count = 0
count++

// Avoid
var name = 'John'
```

### Object and Array Destructuring

```javascript
// Good
const { user, loading, error } = useAuth()
const [first, second] = array

// Avoid
const user = state.user
const loading = state.loading
const first = array[0]
const second = array[1]
```

### Arrow Functions for Callbacks

```javascript
// Good
const handleClick = () => {
  setCount(count + 1)
}

// Use regular function for methods
class ProjectService {
  getProjects() {
    // ...
  }
}
```

---

## Naming Conventions

### Variables and Functions

```javascript
// camelCase
const userName = 'John'
const isLoading = true
function calculateProjectSavings() { }

// Avoid
const user_name = 'John'
const IsLoading = true
const UserName = 'John' // Only for components
```

### Components

```javascript
// PascalCase
function ProjectForm() { }
export function ProjectCard() { }
const Dashboard = () => { }

// Avoid
function projectForm() { }
const projectCard = () => { }
```

### Constants

```javascript
// UPPER_SNAKE_CASE
const MAX_PROJECTS = 100
const API_TIMEOUT = 5000
const DEFAULT_THEME = 'light'

// Avoid
const maxProjects = 100
const max_projects = 100
```

### Booleans

Start with `is`, `has`, `can`, `should`:

```javascript
const isLoading = true
const hasError = false
const canDelete = user.role === 'admin'
const shouldShowModal = !isHidden
```

### Hooks

Start with `use`:

```javascript
function useAuth() { }
function useProjectForm() { }
function useAsync(fn) { }
```

### Event Handlers

Prefix with `handle`:

```javascript
const handleClick = () => { }
const handleSubmit = (data) => { }
const handleError = (error) => { }
```

---

## Component Structure

### Functional Component Template

```javascript
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks'
import { ProjectService } from '@/lib/services'
import './ProjectForm.css'

/**
 * ProjectForm - Edit or create a project
 * @param {Object} props
 * @param {Project} props.project - Project to edit (undefined for create)
 * @param {Function} props.onSubmit - Callback on successful submit
 */
export function ProjectForm({ project, onSubmit }) {
  // 1. Hooks
  const { user } = useAuth()
  const [formData, setFormData] = useState(project || {})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // 2. Effects
  useEffect(() => {
    if (project) {
      setFormData(project)
    }
  }, [project])
  
  // 3. Event handlers
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const result = project
        ? await ProjectService.update(project.id, formData)
        : await ProjectService.create(formData)
      
      onSubmit(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  
  // 4. Render
  return (
    <form onSubmit={handleSubmit}>
      <input
        name="title"
        value={formData.title || ''}
        onChange={handleChange}
      />
      
      {error && <div className="error">{error}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}

export default ProjectForm
```

### Order in Components

1. **Imports** - Dependencies at top
2. **Types/Interfaces** - TypeScript types
3. **Component function** - Main component
4. **Hooks** - All hooks first
5. **Effects** - useEffect hooks
6. **Event handlers** - Click, submit, etc.
7. **Return/JSX** - Component render
8. **Exports** - Component export

---

## Functions and Methods

### Keep Functions Pure

```javascript
// Good: Pure function (no side effects)
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// Avoid: Side effects
function calculateTotal(items) {
  console.log('Calculating...') // OK in logs
  localStorage.setItem('items', JSON.stringify(items)) // Side effect!
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

### Keep Functions Small

```javascript
// Good: Focused, readable
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Avoid: Too much logic
function processUserSignup(email, password, firstName, lastName, company, phone, acceptTerms) {
  // 50 lines of logic...
}
```

### Use Default Parameters

```javascript
// Good
function getUserProjects(userId, limit = 20, offset = 0) {
  // ...
}

// Avoid
function getUserProjects(userId, limit, offset) {
  limit = limit || 20
  offset = offset || 0
}
```

---

## Error Handling

### Always Catch Errors

```javascript
// Good
async function loadProjects() {
  try {
    const data = await ProjectService.list()
    setProjects(data)
  } catch (error) {
    logger.error('Failed to load projects', { error })
    toast.error('Failed to load projects')
  }
}

// Avoid
async function loadProjects() {
  const data = await ProjectService.list() // What if fails?
  setProjects(data)
}
```

### Use Specific Error Types

```javascript
// Good
catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation
  } else if (error instanceof AuthenticationError) {
    // Handle auth
  } else {
    // Handle generic error
  }
}

// Avoid
catch (error) {
  console.log(error) // Too generic
}
```

### Provide Context in Error Logs

```javascript
// Good
logger.error('Project update failed', {
  projectId: project.id,
  error: error.message,
  userId: user.id,
})

// Avoid
logger.error(error) // No context
```

---

## Comments and Documentation

### JSDoc for Functions

```javascript
/**
 * Calculate annual solar savings
 * @param {number} capacity - Solar capacity in kW
 * @param {number} rate - Electricity rate per kWh (USD)
 * @returns {number} Annual savings in dollars
 * @throws {Error} If capacity or rate is negative
 */
function calculateSavings(capacity, rate) {
  if (capacity < 0 || rate < 0) {
    throw new Error('Capacity and rate must be positive')
  }
  return capacity * 365 * 24 * rate
}
```

### Comment Complex Logic

```javascript
// Good: Explains "why" not "what"
// Retry with exponential backoff to handle rate limiting
const delay = Math.pow(2, attemptNumber) * 1000

// Avoid: Obvious comments
// Increment i
i++
```

### Use `//` for Comments

```javascript
// Good
// User can only delete own projects
if (project.createdBy !== user.id) {
  throw new Error('Access denied')
}

// Avoid
/*
 * User can only delete own projects
 */
if (project.createdBy !== user.id) {
  throw new Error('Access denied')
}
```

---

## Testing

### Test File Naming

```javascript
// Good
ProjectForm.test.jsx
useProjectForm.test.js
ProjectService.test.js

// Avoid
test.jsx
test-project-form.jsx
ProjectFormTest.jsx
```

### Test Structure

```javascript
describe('ProjectForm', () => {
  describe('Rendering', () => {
    it('renders form fields', () => {
      // ...
    })
  })
  
  describe('User Interactions', () => {
    it('updates title on input change', () => {
      // ...
    })
  })
  
  describe('Validation', () => {
    it('shows error for empty title', () => {
      // ...
    })
  })
})
```

### Test Descriptions

```javascript
// Good: Describes behavior
it('submits form with valid data', () => { })
it('shows validation error for empty title', () => { })
it('disables submit button while loading', () => { })

// Avoid: Describes implementation
it('calls useState hook', () => { })
it('renders form element', () => { })
```

---

## Code Organization

### Keep Related Code Together

```javascript
// Good: Co-location
src/components/features/projects/
├── ProjectForm.jsx
├── ProjectForm.css
├── ProjectForm.test.jsx
└── useProjectForm.js

// Avoid: Scattered
src/components/ProjectForm.jsx
src/styles/project-form.css
src/tests/ProjectForm.test.jsx
src/hooks/useProjectForm.js
```

### Extract Duplicated Code

```javascript
// Bad: Repeated
const handleProjectDelete = async () => {
  try {
    await ProjectService.delete(id)
    toast.success('Project deleted')
  } catch {
    toast.error('Delete failed')
  }
}

const handleCustomerDelete = async () => {
  try {
    await CustomerService.delete(id)
    toast.success('Customer deleted')
  } catch {
    toast.error('Delete failed')
  }
}

// Good: Extracted
const handleDelete = async (service, resource, id) => {
  try {
    await service.delete(id)
    toast.success(`${resource} deleted`)
  } catch {
    toast.error(`Delete failed`)
  }
}
```

---

## Performance

### Avoid Unnecessary Re-renders

```javascript
// Good: Memoize expensive component
const ProjectCard = React.memo(({ project, onEdit }) => {
  return (
    <div>
      <h3>{project.title}</h3>
      <button onClick={() => onEdit(project.id)}>Edit</button>
    </div>
  )
})

// Avoid: Re-renders on every parent update
function ProjectCard({ project, onEdit }) {
  return (
    <div>
      <h3>{project.title}</h3>
      <button onClick={() => onEdit(project.id)}>Edit</button>
    </div>
  )
}
```

### Use useCallback for Event Handlers

```javascript
// Good
const handleEdit = useCallback((id) => {
  // ...
}, [])

// Avoid
const handleEdit = (id) => {
  // New function every render!
}
```

### Lazy Load Heavy Components

```javascript
// Good: Load only when needed
const HeavyReport = lazy(() => import('./HeavyReport'))

// Use with Suspense
<Suspense fallback={<Spinner />}>
  <HeavyReport />
</Suspense>

// Avoid: Load everything
import HeavyReport from './HeavyReport'
```

---

## Accessibility

### Use Semantic HTML

```javascript
// Good
<button onClick={handleDelete}>Delete</button>
<a href="/projects">Projects</a>

// Avoid
<div onClick={handleDelete}>Delete</div>
<div onClick={() => navigate('/projects')}>Projects</div>
```

### Include Alt Text

```javascript
// Good
<img src="project.jpg" alt="Solar installation project" />

// Avoid
<img src="project.jpg" />
<img src="project.jpg" alt="image" />
```

### Use ARIA Labels

```javascript
// Good
<button aria-label="Open navigation menu">
  <MenuIcon />
</button>

// Avoid
<button>
  <MenuIcon />
</button>
```

### Keyboard Navigation

```javascript
// Good: Works with keyboard
<button onClick={handleAction}>Action</button>

// Avoid: Only mouse
<div onClick={handleAction}>Action</div>
```

---

## Code Style

### Use Prettier for Formatting

```bash
npm run format
```

- Single quotes
- 2 space indentation
- Max line length 80
- Trailing commas

### ESLint Rules

All rules enforced via ESLint. Check with:

```bash
npm run lint
```

Fix automatically:

```bash
npm run lint -- --fix
```

---

## Patterns to Avoid

### Don't Mutate State

```javascript
// Bad
state.user.name = 'John'

// Good
setState({ ...state, user: { ...state.user, name: 'John' } })
```

### Don't Use Index as Key

```javascript
// Bad
{items.map((item, index) => <Item key={index} />)}

// Good
{items.map((item) => <Item key={item.id} />)}
```

### Don't Declare Components Inside Components

```javascript
// Bad
function Parent() {
  function Child() { return <div /> }
  return <Child />
}

// Good
function Child() { return <div /> }
function Parent() { return <Child /> }
```

### Don't Use async on useEffect

```javascript
// Bad
useEffect(async () => {
  await fetchData()
}, [])

// Good
useEffect(() => {
  const loadData = async () => {
    await fetchData()
  }
  loadData()
}, [])
```

---

## Useful References

- [React Best Practices](https://react.dev/learn/render-and-commit)
- [JavaScript.info](https://javascript.info/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Google Style Guide](https://google.github.io/styleguide/tsguide.html)

