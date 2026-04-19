# React.memo Step-by-Step Migration Guide - SolarTrack Pro
## Actionable Implementation Instructions

---

## Table of Contents

1. [Quick Start Checklist](#quick-start-checklist)
2. [Pattern 1: Simple Component Memoization](#pattern-1-simple-component-memoization)
3. [Pattern 2: Component with Event Handlers](#pattern-2-component-with-event-handlers)
4. [Pattern 3: Component with Expensive Computations](#pattern-3-component-with-expensive-computations)
5. [Pattern 4: List Items with Keys](#pattern-4-list-items-with-keys)
6. [Pattern 5: Parent Component Setup](#pattern-5-parent-component-setup)
7. [Testing & Verification](#testing--verification)
8. [Performance Profiling](#performance-profiling)
9. [Common Mistakes & Fixes](#common-mistakes--fixes)
10. [Rollback Procedures](#rollback-procedures)

---

## Quick Start Checklist

Before implementing React.memo:

- [ ] Install React DevTools browser extension
- [ ] Read the REACT_MEMO_IMPLEMENTATION_GUIDE.md
- [ ] Understand the component's props structure
- [ ] Identify if component has expensive operations
- [ ] Plan parent component updates
- [ ] Create a git branch for changes
- [ ] Set up baseline performance measurements

---

## Pattern 1: Simple Component Memoization

### Scenario
You have a simple component that receives stable props and doesn't need optimization beyond preventing unnecessary re-renders.

### Before Code

```javascript
// src/components/analytics/AdvancedMetricsCard.jsx
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function AdvancedMetricsCard({
  title,
  value,
  icon: Icon,
  change = 0,
  trend = 'flat',
  format = 'number',
  color = 'orange',
  loading = false,
  onClick,
}) {
  // Component logic...
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{formatValue()}</p>
        </div>
        <Icon className="w-8 h-8" />
      </div>
    </div>
  )
}
```

### Step 1: Import React.memo

```javascript
import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
```

### Step 2: Wrap Component in React.memo

```javascript
const AdvancedMetricsCard = React.memo(function AdvancedMetricsCard({
  title,
  value,
  icon: Icon,
  change = 0,
  trend = 'flat',
  format = 'number',
  color = 'orange',
  loading = false,
  onClick,
}) {
  // Component logic...
  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold">{formatValue()}</p>
        </div>
        <Icon className="w-8 h-8" />
      </div>
    </div>
  )
})

export default AdvancedMetricsCard
```

### Alternative: Using Helper Function

```javascript
import { createMemoComponent } from '../lib/optimization/memoizationPatterns'

function AdvancedMetricsCard({
  title,
  value,
  icon: Icon,
  change = 0,
  trend = 'flat',
  format = 'number',
  color = 'orange',
  loading = false,
  onClick,
}) {
  // Component logic...
}

export default createMemoComponent(AdvancedMetricsCard)
```

### Step 3: Update Parent to Stabilize Props

The key is ensuring props don't change on every render. Here's what the parent should look like:

```javascript
// Before (BAD - props change every render)
function Dashboard() {
  const metrics = [
    { title: 'Revenue', value: 50000, color: 'orange' },
    { title: 'Customers', value: 150, color: 'blue' }
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map(metric => (
        <AdvancedMetricsCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          color={metric.color}
          onClick={() => handleMetricClick(metric.title)} // NEW FUNCTION EVERY RENDER!
        />
      ))}
    </div>
  )
}

// After (GOOD - props are stable)
import { useCallback } from 'react'

function Dashboard() {
  const metrics = useMemo(() => [
    { title: 'Revenue', value: 50000, color: 'orange' },
    { title: 'Customers', value: 150, color: 'blue' }
  ], []) // Empty deps because data is static

  const handleMetricClick = useCallback((title) => {
    console.log('Metric clicked:', title)
    // Handle click logic
  }, [])

  return (
    <div className="grid grid-cols-2 gap-4">
      {metrics.map(metric => (
        <AdvancedMetricsCard
          key={metric.title}
          title={metric.title}
          value={metric.value}
          color={metric.color}
          onClick={handleMetricClick}
        />
      ))}
    </div>
  )
}
```

### Verification

After implementing, verify in React DevTools:
1. Open React DevTools Profiler
2. Record an interaction
3. Look for AdvancedMetricsCard in the components tree
4. Should render once when props change, not on every parent re-render

---

## Pattern 2: Component with Event Handlers

### Scenario
Your component receives callback functions as props and passes them to child elements.

### Before Code

```javascript
// src/components/SearchResultsCard.jsx
export default function SearchResultsCard({
  item,
  onSelect,
  onDelete,
  onUpdate
}) {
  return (
    <div className="p-4 border rounded">
      <h3 onClick={() => onSelect(item.id)}>{item.title}</h3>
      <button onClick={() => onDelete(item.id)}>Delete</button>
      <button onClick={() => onUpdate(item.id)}>Update</button>
    </div>
  )
}
```

**Problem:** Even if parent callbacks don't change, inline arrow functions create new references, defeating memoization.

### Solution: Add useCallback

```javascript
import React, { useCallback } from 'react'

const SearchResultsCard = React.memo(function SearchResultsCard({
  item,
  onSelect,
  onDelete,
  onUpdate
}) {
  // Step 1: Memoize callbacks that reference props
  const handleSelect = useCallback(() => {
    onSelect(item.id)
  }, [item.id, onSelect])

  const handleDelete = useCallback(() => {
    onDelete(item.id)
  }, [item.id, onDelete])

  const handleUpdate = useCallback(() => {
    onUpdate(item.id)
  }, [item.id, onUpdate])

  // Step 2: Use the memoized callbacks
  return (
    <div className="p-4 border rounded">
      <h3 onClick={handleSelect}>{item.title}</h3>
      <button onClick={handleDelete}>Delete</button>
      <button onClick={handleUpdate}>Update</button>
    </div>
  )
})

export default SearchResultsCard
```

### Key Points

1. **Dependencies are critical:** `useCallback` depends on `item.id` because we use it in the function
2. **Pass parent callback as dependency:** `onSelect`, `onDelete`, `onUpdate` must be in deps array
3. **Memoize the component:** `React.memo` wraps the whole component
4. **Parent must memoize its callbacks:**

```javascript
// Parent component
import { useCallback } from 'react'

function SearchResults({ items }) {
  const handleSelect = useCallback((id) => {
    console.log('Selected:', id)
    // Do something
  }, []) // Empty because this callback doesn't depend on anything

  const handleDelete = useCallback((id) => {
    // Delete logic
  }, [])

  const handleUpdate = useCallback((id) => {
    // Update logic
  }, [])

  return (
    <div>
      {items.map(item => (
        <SearchResultsCard
          key={item.id}
          item={item}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  )
}
```

---

## Pattern 3: Component with Expensive Computations

### Scenario
Your component does heavy filtering, sorting, or calculations on the data.

### Before Code

```javascript
// src/components/analytics/FilteredMetrics.jsx
export default function FilteredMetrics({
  metrics,
  filters,
  sortBy = 'value'
}) {
  // This runs on EVERY render, even if metrics/filters haven't changed
  const filtered = metrics
    .filter(m => {
      if (filters.category && m.category !== filters.category) return false
      if (filters.minValue && m.value < filters.minValue) return false
      if (filters.maxValue && m.value > filters.maxValue) return false
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'value') return a.value - b.value
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      return 0
    })

  return (
    <div>
      {filtered.map(m => (
        <div key={m.id}>{m.name}: {m.value}</div>
      ))}
    </div>
  )
}
```

### Solution: Use useMemo

```javascript
import React, { useMemo } from 'react'

const FilteredMetrics = React.memo(function FilteredMetrics({
  metrics,
  filters,
  sortBy = 'value'
}) {
  // Step 1: Move expensive computation into useMemo
  const filtered = useMemo(() => {
    return metrics
      .filter(m => {
        if (filters.category && m.category !== filters.category) return false
        if (filters.minValue && m.value < filters.minValue) return false
        if (filters.maxValue && m.value > filters.maxValue) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'value') return a.value - b.value
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        return 0
      })
  }, [metrics, filters, sortBy]) // Step 2: Add dependencies

  // Step 3: Render using memoized data
  return (
    <div>
      {filtered.map(m => (
        <div key={m.id}>{m.name}: {m.value}</div>
      ))}
    </div>
  )
})

export default FilteredMetrics
```

### Or Using Helper Function

```javascript
import React, { useMemo } from 'react'
import { useMemoComputation } from '../lib/optimization/memoizationPatterns'

const FilteredMetrics = React.memo(function FilteredMetrics({
  metrics,
  filters,
  sortBy = 'value'
}) {
  // Same result, cleaner syntax
  const filtered = useMemoComputation(() => {
    return metrics
      .filter(m => {
        if (filters.category && m.category !== filters.category) return false
        if (filters.minValue && m.value < filters.minValue) return false
        if (filters.maxValue && m.value > filters.maxValue) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'value') return a.value - b.value
        if (sortBy === 'name') return a.name.localeCompare(b.name)
        return 0
      })
  }, [metrics, filters, sortBy])

  return (
    <div>
      {filtered.map(m => (
        <div key={m.id}>{m.name}: {m.value}</div>
      ))}
    </div>
  )
})

export default FilteredMetrics
```

### Parent Component Setup

```javascript
import { useMemo, useCallback } from 'react'

function MetricsDashboard() {
  const [filterState, setFilterState] = useState({})
  const [sortBy, setSortBy] = useState('value')

  // Step 1: Memoize filters object so it's stable
  const filters = useMemo(() => ({
    category: filterState.category,
    minValue: filterState.minValue,
    maxValue: filterState.maxValue
  }), [filterState.category, filterState.minValue, filterState.maxValue])

  // Step 2: Use actual metrics (usually from API/state)
  const metrics = useMemo(() => [
    { id: 1, name: 'Revenue', value: 50000, category: 'financial' },
    // ... more metrics
  ], []) // Empty if static

  return (
    <FilteredMetrics
      metrics={metrics}
      filters={filters}
      sortBy={sortBy}
    />
  )
}
```

---

## Pattern 4: List Items with Keys

### Scenario
You have a list where each item is memoized, and the parent handles item interactions.

### Before Code

```javascript
// src/components/ProjectRow.jsx
export default function ProjectRow({ project, onSelect, onDelete }) {
  return (
    <tr>
      <td onClick={() => onSelect(project.id)}>{project.name}</td>
      <td>{project.status}</td>
      <td>${project.budget}</td>
      <td>
        <button onClick={() => onDelete(project.id)}>Delete</button>
      </td>
    </tr>
  )
}

// src/components/ProjectList.jsx
export default function ProjectList({ projects, onSelectProject, onDeleteProject }) {
  return (
    <table>
      <tbody>
        {projects.map(project => (
          <ProjectRow
            key={project.id}
            project={project}
            onSelect={() => onSelectProject(project.id)} // NEW FUNCTION EVERY TIME!
            onDelete={() => onDeleteProject(project.id)} // NEW FUNCTION EVERY TIME!
          />
        ))}
      </tbody>
    </table>
  )
}
```

### Solution: Memoize Both Components

```javascript
import React, { useCallback } from 'react'

// Step 1: Memoize the item component
const ProjectRow = React.memo(function ProjectRow({
  project,
  onSelect,
  onDelete
}) {
  // Step 2: Create stable callbacks for this item
  const handleSelect = useCallback(() => {
    onSelect(project.id)
  }, [project.id, onSelect])

  const handleDelete = useCallback(() => {
    onDelete(project.id)
  }, [project.id, onDelete])

  return (
    <tr>
      <td onClick={handleSelect}>{project.name}</td>
      <td>{project.status}</td>
      <td>${project.budget}</td>
      <td>
        <button onClick={handleDelete}>Delete</button>
      </td>
    </tr>
  )
})

export default ProjectRow

// Step 3: Update parent to pass stable callbacks
import { useCallback } from 'react'

const ProjectList = React.memo(function ProjectList({
  projects,
  onSelectProject,
  onDeleteProject
}) {
  // Step 4: Memoize parent callbacks
  const handleSelect = useCallback((id) => {
    onSelectProject(id)
  }, [onSelectProject])

  const handleDelete = useCallback((id) => {
    onDeleteProject(id)
  }, [onDeleteProject])

  return (
    <table>
      <tbody>
        {projects.map(project => (
          <ProjectRow
            key={project.id}
            project={project}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
        ))}
      </tbody>
    </table>
  )
})

export default ProjectList
```

### Critical: Key Prop

**Always use a stable, unique identifier as the key:**

```javascript
// GOOD - Unique ID that won't change
{projects.map(project => (
  <ProjectRow key={project.id} {...} />
))}

// BAD - Index changes when list is reordered
{projects.map((project, index) => (
  <ProjectRow key={index} {...} />
))}

// BAD - Generated ID changes every render
{projects.map(project => (
  <ProjectRow key={Math.random()} {...} />
))}
```

---

## Pattern 5: Parent Component Setup

### Complete Parent Setup Example

```javascript
import React, { useState, useCallback, useMemo } from 'react'
import AdvancedMetricsCard from './analytics/AdvancedMetricsCard'
import FilterPanel from './AdvancedFilterPanel'
import ProjectList from './ProjectList'

function Dashboard() {
  // State
  const [filters, setFilters] = useState({})
  const [selectedProject, setSelectedProject] = useState(null)

  // Step 1: Memoize stable data structures
  const metrics = useMemo(() => [
    { title: 'Revenue', value: 50000, color: 'orange', trend: 'up' },
    { title: 'Customers', value: 150, color: 'blue', trend: 'flat' },
    { title: 'Growth', value: 25, color: 'green', trend: 'up' }
  ], []) // Empty array because this data is static

  // Step 2: Memoize complex objects (like filters)
  const filterConfig = useMemo(() => ({
    status: filters.status || 'all',
    category: filters.category || 'all',
    dateRange: filters.dateRange || null
  }), [filters.status, filters.category, filters.dateRange])

  // Step 3: Memoize callbacks
  const handleMetricClick = useCallback((title) => {
    console.log('Metric clicked:', title)
    // Handle metric interaction
  }, []) // Empty because no dependencies

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
  }, []) // Empty because setFilters is stable

  const handleSelectProject = useCallback((projectId) => {
    setSelectedProject(projectId)
  }, []) // Empty because setSelectedProject is stable

  const handleDeleteProject = useCallback((projectId) => {
    // API call to delete
    console.log('Delete project:', projectId)
  }, []) // Empty if no dependencies

  // Step 4: Memoize filtered data
  const filteredProjects = useMemo(() => {
    // Simulate getting projects from state/API
    const allProjects = [
      { id: 1, name: 'Solar Installation A', status: 'active', budget: 50000 },
      { id: 2, name: 'Solar Installation B', status: 'completed', budget: 75000 }
    ]

    return allProjects.filter(p => {
      if (filterConfig.status !== 'all' && p.status !== filterConfig.status) {
        return false
      }
      return true
    })
  }, [filterConfig])

  return (
    <div className="p-6">
      {/* Metrics Grid - Each card is memoized */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {metrics.map(metric => (
          <AdvancedMetricsCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            color={metric.color}
            trend={metric.trend}
            onClick={handleMetricClick}
          />
        ))}
      </div>

      {/* Filter Panel - Memoized */}
      <FilterPanel
        filters={filterConfig}
        onChange={handleFilterChange}
      />

      {/* Project List - Memoized */}
      <ProjectList
        projects={filteredProjects}
        onSelectProject={handleSelectProject}
        onDeleteProject={handleDeleteProject}
      />
    </div>
  )
}

export default Dashboard
```

### Key Principles

1. **Memoize data that doesn't change:**
   ```javascript
   const staticMetrics = useMemo(() => [...], [])
   ```

2. **Memoize objects passed to memoized children:**
   ```javascript
   const config = useMemo(() => ({...}), [dependencies])
   ```

3. **Memoize callbacks passed to memoized children:**
   ```javascript
   const handler = useCallback(() => {...}, [dependencies])
   ```

4. **Dependency arrays must be correct:**
   - Include all values from closure
   - Don't include unnecessary values
   - Use ESLint rule: `exhaustive-deps`

---

## Testing & Verification

### Unit Test Example

```javascript
// src/components/__tests__/AdvancedMetricsCard.test.jsx
import { render } from '@testing-library/react'
import AdvancedMetricsCard from '../AdvancedMetricsCard'

describe('AdvancedMetricsCard', () => {
  it('does not re-render with same props', () => {
    const props = {
      title: 'Revenue',
      value: 1000,
      color: 'orange',
      trend: 'up'
    }

    const { rerender } = render(
      <AdvancedMetricsCard {...props} />
    )

    // Add render spy if needed
    const initialRenderCount = 1

    // Re-render with identical props
    rerender(
      <AdvancedMetricsCard {...props} />
    )

    // Component should not have re-rendered
    // (Verify with React DevTools or spy)
  })

  it('re-renders when props change', () => {
    const { rerender } = render(
      <AdvancedMetricsCard
        title="Revenue"
        value={1000}
        color="orange"
        trend="up"
      />
    )

    rerender(
      <AdvancedMetricsCard
        title="Revenue"
        value={2000} // Changed value
        color="orange"
        trend="up"
      />
    )

    // Component should re-render
  })
})
```

### Visual Regression Test

```javascript
import { render, screen } from '@testing-library/react'

it('renders correctly after memoization', () => {
  render(
    <AdvancedMetricsCard
      title="Revenue"
      value={50000}
      color="orange"
      trend="up"
      format="currency"
    />
  )

  expect(screen.getByText('Revenue')).toBeInTheDocument()
  expect(screen.getByText('$50,000')).toBeInTheDocument()
})
```

---

## Performance Profiling

### Step 1: Open React DevTools

1. Install React DevTools browser extension
2. Open DevTools (F12)
3. Click "Profiler" tab

### Step 2: Record Performance

1. Click red circle to start recording
2. Interact with your component (click, type, etc.)
3. Click red circle again to stop
4. Analyze the results

### Step 3: Read the Results

Look for:
- **Render Count:** Should be lower after memoization
- **Render Time:** Should be faster (less ms)
- **Which components rendered:** Only those with changed props

### Example Profiler Output

```
Before Memoization:
├─ Dashboard (15ms)
│  ├─ AdvancedMetricsCard (2ms) [RE-RENDER 1]
│  ├─ AdvancedMetricsCard (2ms) [RE-RENDER 2]
│  ├─ AdvancedMetricsCard (2ms) [RE-RENDER 3]
│  └─ ProjectList (8ms)
│     ├─ ProjectRow (1ms) [RE-RENDER 1]
│     └─ ProjectRow (1ms) [RE-RENDER 2]

After Memoization:
├─ Dashboard (12ms)
│  ├─ AdvancedMetricsCard (0ms) [SKIPPED]
│  ├─ AdvancedMetricsCard (0ms) [SKIPPED]
│  ├─ AdvancedMetricsCard (0ms) [SKIPPED]
│  └─ ProjectList (9ms)
│     ├─ ProjectRow (0ms) [SKIPPED]
│     └─ ProjectRow (0ms) [SKIPPED]

Result: 20% faster!
```

---

## Common Mistakes & Fixes

### Mistake 1: Object Props Change Every Render

```javascript
// BAD
function Parent() {
  return <Child config={{ theme: 'dark' }} /> // New object every render!
}

// GOOD
function Parent() {
  const config = useMemo(() => ({ theme: 'dark' }), [])
  return <Child config={config} />
}
```

### Mistake 2: Missing Dependency in useCallback

```javascript
// BAD - user is stale
const handleSave = useCallback(() => {
  api.save(user) // Using old user!
}, []) // Missing user in deps

// GOOD
const handleSave = useCallback(() => {
  api.save(user)
}, [user])
```

### Mistake 3: Inline Functions in JSX

```javascript
// BAD
<button onClick={() => handleClick(item.id)}>Click</button>

// GOOD
const handleClick = useCallback(() => {
  // ...
}, [item.id])

<button onClick={handleClick}>Click</button>
```

### Mistake 4: Array/Object Equality in Dependency

```javascript
// BAD - filters object changes every render
function Component({ filters }) {
  const handleFilter = useCallback(() => {
    applyFilters(filters)
  }, [filters]) // This changes every render!
}

// GOOD - parent stabilizes filters
function Parent() {
  const filters = useMemo(() => ({...}), [deps])
  return <Component filters={filters} />
}
```

### Mistake 5: Memoizing Too Much

```javascript
// BAD - Unnecessary memoization of simple components
const Spacer = React.memo(() => <div className="h-4" />)
const Label = React.memo(({ text }) => <span>{text}</span>)

// GOOD - Only memoize expensive components
const RevenueChart = React.memo(ExpensiveChart)
const DataTable = React.memo(HeavyTable)
```

---

## Rollback Procedures

### If Performance Doesn't Improve

1. **Remove React.memo:**
   ```javascript
   // Remove this
   export default React.memo(MyComponent)
   
   // Back to this
   export default MyComponent
   ```

2. **Remove useCallback/useMemo:**
   ```javascript
   // Revert to original computation
   const data = expensiveOperation() // Direct call
   ```

3. **Re-baseline performance:**
   - Use Profiler to measure again
   - May need different components to optimize
   - Document learnings

### If Bugs Are Introduced

1. **Check dependency arrays:**
   - Use ESLint rule `exhaustive-deps`
   - Manually verify all used values are included

2. **Check custom comparators:**
   - Shallow equality might be too strict
   - Try removing custom comparator

3. **Use React DevTools:**
   - Highlight re-renders to see what changed
   - Check if component should actually re-render

4. **Test in React.StrictMode:**
   - Catches common issues
   - Run in development

### Git Workflow

```bash
# Create a feature branch
git checkout -b feat/react-memo-metrics-card

# Make changes
# Test thoroughly
# Commit
git add src/components/analytics/AdvancedMetricsCard.jsx
git commit -m "feat: memoize AdvancedMetricsCard component"

# If issues found, revert
git revert HEAD

# Or reset completely
git reset --hard origin/main
```

---

## Summary

### Implementation Checklist for Each Component

- [ ] Import React and required hooks
- [ ] Wrap component in React.memo or createMemoComponent()
- [ ] Add useCallback for event handlers (if needed)
- [ ] Add useMemo for expensive computations (if needed)
- [ ] Update parent to stabilize props
- [ ] Test with React DevTools Profiler
- [ ] Verify no behavioral changes
- [ ] Document performance improvement
- [ ] Create PR and get code review

### Expected Improvements

- Simple components: 5-15% improvement
- Components with lists: 15-30% improvement
- Complex components: 20-50% improvement
- Overall dashboard: 3-6% cumulative improvement

### Next Steps

1. Start with Pattern 1 (Simple Memoization)
2. Move to Pattern 2 (Event Handlers)
3. Tackle Pattern 3 (Expensive Computations)
4. Optimize list items (Pattern 4)
5. Verify parent setup (Pattern 5)
