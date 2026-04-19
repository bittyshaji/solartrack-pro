# React.memo Implementation Guide - SolarTrack Pro

## Table of Contents

1. [Overview](#overview)
2. [When to Use What](#when-to-use-what)
3. [Step-by-Step Implementation](#step-by-step-implementation)
4. [Code Patterns](#code-patterns)
5. [Performance Profiling](#performance-profiling)
6. [Testing Memoized Components](#testing-memoized-components)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)
9. [Common Pitfalls](#common-pitfalls)

---

## Overview

React memoization prevents unnecessary re-renders when component props haven't changed. This is critical for:

- **Large component trees** - Prevents cascading re-renders
- **Expensive components** - Charts, large lists, animations
- **Frequently updated parents** - Child components benefit from prop stability

### The Three Memoization Tools

| Tool | Use Case | Impact |
|------|----------|--------|
| **React.memo** | Prevent component re-renders | High (component level) |
| **useMemo** | Cache expensive computations | High (computation level) |
| **useCallback** | Stabilize function references | Medium (with memo) |

---

## When to Use What

### React.memo ✓ Use When:

```javascript
// GOOD: Component receives stable props
<AdvancedMetricsCard
  title="Revenue"
  value={1000}
  icon={DollarSign}
  color="orange"
/>

// GOOD: Props rarely change
<SearchResultsCard item={item} onSelect={handleSelect} />

// GOOD: Component is expensive to render
<RevenueChart data={data} config={config} />
```

### React.memo ✗ Don't Use When:

```javascript
// BAD: Props change on every render
const MyComponent = () => {
  return <MemoChild handler={() => handleClick()} />; // New function every time
};

// BAD: Dynamic object creation
const MyComponent = () => {
  return <MemoChild config={{ theme: 'dark' }} />; // New object every time
};

// BAD: Component has no expensive operations
const SimpleButton = ({ label }) => <button>{label}</button>;
```

### useMemo ✓ Use When:

```javascript
// GOOD: Expensive filtering/sorting
const filtered = useMemo(() => {
  return items
    .filter(item => item.category === category)
    .sort((a, b) => a.name.localeCompare(b.name));
}, [items, category]);

// GOOD: Complex object creation
const config = useMemo(() => ({
  colors: generateColorPalette(theme),
  layout: calculateLayout(width, height),
  animations: buildAnimationSequence()
}), [theme, width, height]);

// GOOD: Derived state
const userInitials = useMemo(() => {
  const [first, last] = user.name.split(' ');
  return (first[0] + last[0]).toUpperCase();
}, [user.name]);
```

### useMemo ✗ Don't Use When:

```javascript
// BAD: Caching primitive values
const memoized = useMemo(() => value, [value]); // Just use value

// BAD: Simple computations
const doubled = useMemo(() => number * 2, [number]); // Too simple

// BAD: No dependencies
const timestamp = useMemo(() => Date.now(), []); // Never updates
```

### useCallback ✓ Use When:

```javascript
// GOOD: Callback passed to memoized child
const MemoizedChild = React.memo(Child);

function Parent() {
  const handleClick = useCallback((id) => {
    // Do something with id
  }, [dependency]);

  return <MemoizedChild onClick={handleClick} />;
}

// GOOD: Callback in dependency array
const MemoizedList = React.memo(List);

function Parent() {
  const handleSort = useCallback((key) => {
    setSortKey(key);
  }, []);

  return <MemoizedList onSort={handleSort} />;
}
```

### useCallback ✗ Don't Use When:

```javascript
// BAD: Event handler not passed to children
function Component() {
  const handleChange = useCallback((e) => {
    setState(e.target.value);
  }, []); // Unnecessary

  return <input onChange={handleChange} />;
}

// BAD: Handler passed to non-memoized child
function Parent() {
  const handleClick = useCallback(() => {}, []);
  return <NonMemoChild onClick={handleClick} />; // Child re-renders anyway
}
```

---

## Step-by-Step Implementation

### Step 1: Import Utilities

```javascript
import {
  createMemoComponent,
  useMemoProps,
  useCallbackMemo,
  useMemoComputation,
  comparators
} from '../lib/optimization/memoizationPatterns';
```

### Step 2: Identify Component Type

Determine if your component:
- Receives stable props → Use React.memo
- Performs expensive computations → Use useMemo
- Has callbacks passed to children → Use useCallback

### Step 3: Apply Appropriate Memoization

#### Option A: Simple Component with React.memo

```javascript
// Before
export default function AdvancedMetricsCard({
  title, value, icon: Icon, change, trend, format, color
}) {
  // ... component logic
}

// After
const AdvancedMetricsCard = React.memo(function AdvancedMetricsCard({
  title, value, icon: Icon, change, trend, format, color
}) {
  // ... component logic
});

export default AdvancedMetricsCard;

// Or using helper
export default createMemoComponent(AdvancedMetricsCard);
```

#### Option B: Component with Callbacks

```javascript
// Before
export default function FilterPanel({ filters, onFilterChange, onApply }) {
  const handleChange = (key, value) => {
    onFilterChange(key, value);
  };

  return (
    <div>
      {/* ... */}
      <button onClick={onApply}>Apply</button>
    </div>
  );
}

// After
const FilterPanel = React.memo(function FilterPanel({
  filters, onFilterChange, onApply
}) {
  const handleChange = useCallback((key, value) => {
    onFilterChange(key, value);
  }, [onFilterChange]);

  return (
    <div>
      {/* ... */}
      <button onClick={onApply}>Apply</button>
    </div>
  );
});

export default FilterPanel;
```

#### Option C: Component with Expensive Computations

```javascript
// Before
export default function SearchResults({ items, searchTerm, sortBy }) {
  const filtered = items
    .filter(i => i.title.includes(searchTerm))
    .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));

  return (
    <div>
      {filtered.map(item => <ResultCard key={item.id} item={item} />)}
    </div>
  );
}

// After
const SearchResults = React.memo(function SearchResults({
  items, searchTerm, sortBy
}) {
  const filtered = useMemoComputation(() => {
    return items
      .filter(i => i.title.includes(searchTerm))
      .sort((a, b) => a[sortBy].localeCompare(b[sortBy]));
  }, [items, searchTerm, sortBy]);

  return (
    <div>
      {filtered.map(item => <ResultCard key={item.id} item={item} />)}
    </div>
  );
});

export default SearchResults;
```

#### Option D: Custom Prop Comparison

```javascript
// Use custom comparison to ignore callbacks
const MemoizedChart = React.memo(
  function Chart({ data, config, onDataClick }) {
    return <div>{/* chart */}</div>;
  },
  (prevProps, nextProps) => {
    // Props are equal if data and config are the same
    // Ignore onDataClick changes
    return (
      JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
      JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config)
    );
  }
);

export default MemoizedChart;

// Or using helper
export default createMemoComponent(
  Chart,
  comparators.ignoreKeys(['onDataClick'])
);
```

### Step 4: Update Parent Component

```javascript
// Parent must stabilize props passed to memoized children
function Dashboard() {
  const [filters, setFilters] = useState({});

  // Stabilize callbacks
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Stabilize objects
  const chartConfig = useMemo(() => ({
    responsive: true,
    animation: true,
    colors: ['#FF6B6B', '#4ECDC4']
  }), []); // Empty deps if static

  return (
    <>
      <MemoizedFilterPanel
        onFilterChange={handleFilterChange}
      />
      <MemoizedChart
        config={chartConfig}
      />
    </>
  );
}
```

### Step 5: Test and Measure

Use React DevTools Profiler to verify:
1. Memoized component doesn't re-render unnecessarily
2. Parent changes don't trigger child re-renders
3. Performance improvement is measurable

---

## Code Patterns

### Pattern 1: List Items (Common Case)

```javascript
// Item component - memoized
const ListItem = React.memo(function ListItem({ item, onSelect, onDelete }) {
  const handleSelect = useCallback(() => {
    onSelect(item.id);
  }, [item.id, onSelect]);

  const handleDelete = useCallback(() => {
    onDelete(item.id);
  }, [item.id, onDelete]);

  return (
    <div>
      <span onClick={handleSelect}>{item.name}</span>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
});

// Parent component
function List({ items, onItemSelect, onItemDelete }) {
  const handleSelect = useCallback((id) => {
    onItemSelect(id);
  }, [onItemSelect]);

  const handleDelete = useCallback((id) => {
    onItemDelete(id);
  }, [onItemDelete]);

  return (
    <div>
      {items.map(item => (
        <ListItem
          key={item.id}
          item={item}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
```

### Pattern 2: Complex Data Transformation

```javascript
const DataTable = React.memo(function DataTable({
  data, filters, sortBy, sortDirection
}) {
  const processedData = useMemoComputation(() => {
    let result = [...data];

    // Apply filters
    if (filters.search) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];

      const comparison = typeof aVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [data, filters, sortBy, sortDirection]);

  return (
    <table>
      <tbody>
        {processedData.map(row => (
          <tr key={row.id}>
            <td>{row.name}</td>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});

export default DataTable;
```

### Pattern 3: Form Component with Event Handlers

```javascript
const FormField = React.memo(function FormField({
  name, value, onChange, onBlur, error
}) {
  const handleChange = useCallback((e) => {
    onChange(name, e.target.value);
  }, [name, onChange]);

  const handleBlur = useCallback(() => {
    onBlur(name);
  }, [name, onBlur]);

  return (
    <div className="field">
      <input
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {error && <span className="error">{error}</span>}
    </div>
  );
});

// Parent
function MyForm() {
  const [formData, setFormData] = useState({});

  const handleChange = useCallback((name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleBlur = useCallback((name) => {
    // Validate field
  }, []);

  return (
    <form>
      <FormField
        name="email"
        value={formData.email || ''}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </form>
  );
}
```

### Pattern 4: Card Components in Grid

```javascript
const MetricCard = React.memo(function MetricCard({
  title, value, trend, color, onClick
}) {
  const formatValue = useCallback(() => {
    return Number(value).toLocaleString('en-US');
  }, [value]);

  return (
    <div className={`card card-${color}`} onClick={onClick}>
      <h3>{title}</h3>
      <p className="value">{formatValue()}</p>
      {trend && <span className={`trend trend-${trend}`}>{trend}</span>}
    </div>
  );
});

// Parent with multiple cards
function Dashboard() {
  const [selectedMetric, setSelectedMetric] = useState(null);

  const handleCardClick = useCallback((metricId) => {
    setSelectedMetric(metricId);
  }, []);

  const metrics = useMemoComputation(() => [
    { id: 1, title: 'Revenue', value: data.revenue, trend: 'up' },
    { id: 2, title: 'Customers', value: data.customers, trend: 'flat' },
    // ... more metrics
  ], [data]);

  return (
    <div className="grid">
      {metrics.map(metric => (
        <MetricCard
          key={metric.id}
          title={metric.title}
          value={metric.value}
          trend={metric.trend}
          onClick={() => handleCardClick(metric.id)}
        />
      ))}
    </div>
  );
}
```

---

## Performance Profiling

### Using React DevTools Profiler

1. **Open React DevTools** (Chrome DevTools > Components)

2. **Go to Profiler Tab**

3. **Start Recording** by clicking the record button

4. **Interact with your app** - perform actions that trigger re-renders

5. **Stop Recording** to see profiling results

6. **Analyze Results:**
   - **Render duration** - How long the component took to render
   - **Re-renders** - How many times component rendered
   - **Rank by render duration** - Sort by slowest components

### Reading the Profiler

```
Component Name            Render Count    Render Duration
─────────────────────────────────────────────────────────
AdvancedMetricsCard              5         12.4ms    ← High count = good memo candidate
RevenueChart                     2         45.2ms    ← Expensive = good memo candidate
FilterPanel                      12        8.3ms     ← Very high count = critical
```

### Performance Checklist

- [ ] Memoized component renders less frequently after memoization
- [ ] Component renders same number of times as props change
- [ ] Render time is reduced (especially for expensive components)
- [ ] No unnecessary re-renders from parent
- [ ] Performance gains outweigh memoization overhead

---

## Testing Memoized Components

### Unit Tests

```javascript
import { render, screen } from '@testing-library/react';
import AdvancedMetricsCard from './AdvancedMetricsCard';

describe('AdvancedMetricsCard', () => {
  it('renders with correct data', () => {
    render(
      <AdvancedMetricsCard
        title="Revenue"
        value={1000}
        format="currency"
        color="orange"
      />
    );
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
  });

  it('does not re-render with same props', () => {
    const { rerender } = render(
      <AdvancedMetricsCard
        title="Revenue"
        value={1000}
        format="currency"
        color="orange"
      />
    );

    // Track render count manually or with a spy
    const renderSpy = jest.fn();

    rerender(
      <AdvancedMetricsCard
        title="Revenue"
        value={1000}
        format="currency"
        color="orange"
      />
    );

    // Should not re-render if props are identical
  });
});
```

### Integration Tests

```javascript
it('list items do not re-render when parent updates', () => {
  const { rerender } = render(
    <List
      items={[
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]}
    />
  );

  const items = screen.getAllByTestId('list-item');
  expect(items).toHaveLength(2);

  // Parent state change shouldn't re-render children
  rerender(
    <List
      items={[
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]}
    />
  );

  // Items should still be in DOM without re-render
  expect(screen.getAllByTestId('list-item')).toHaveLength(2);
});
```

### Performance Tests

```javascript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('memoized component improves performance', async () => {
  const start = performance.now();

  const { rerender } = render(
    <Dashboard
      data={largeDataset}
      filters={{}}
    />
  );

  const initialRender = performance.now() - start;

  const updateStart = performance.now();

  rerender(
    <Dashboard
      data={largeDataset}
      filters={{ category: 'solar' }}
    />
  );

  const updateRender = performance.now() - updateStart;

  // Update should be faster than initial render
  expect(updateRender).toBeLessThan(initialRender);
});
```

---

## Troubleshooting

### Issue 1: Component Still Re-renders

**Cause:** Props are changing on every render

```javascript
// ❌ BAD - New object created every render
<MemoChild config={{ theme: 'dark' }} />

// ✅ GOOD - Stable reference with useMemo
const config = useMemo(() => ({ theme: 'dark' }), []);
<MemoChild config={config} />
```

### Issue 2: No Performance Improvement

**Causes:**
1. Component is already fast (memoization overhead > benefit)
2. Props always change (memoization ineffective)
3. Parent still re-renders child

**Solution:**
- Check if component is actually expensive to render
- Verify props don't change on every render
- Use Profiler to confirm re-render count

### Issue 3: Callbacks Not Triggering

**Cause:** useCallback dependency array missing required values

```javascript
// ❌ BAD - handleClick doesn't see updated userId
const handleClick = useCallback(() => {
  api.call(userId); // userId is stale
}, []); // Missing userId

// ✅ GOOD - Includes all dependencies
const handleClick = useCallback(() => {
  api.call(userId);
}, [userId]); // userId included
```

### Issue 4: Memory Leaks

**Cause:** Memoized callbacks holding references to large objects

```javascript
// ❌ BAD - Keeps largeData in memory
const handleProcess = useCallback(() => {
  processData(largeData);
}, [largeData]); // largeData never garbage collected

// ✅ GOOD - Only keep essential references
const dataId = useMemo(() => largeData.id, [largeData.id]);
const handleProcess = useCallback(() => {
  api.process(dataId);
}, [dataId]); // Only id kept in memory
```

---

## Best Practices

### 1. Profile Before Optimizing

```javascript
// Always use Profiler to identify actual bottlenecks
// Don't guess which components are slow
```

### 2. Prefer Simple Components

```javascript
// ✅ GOOD - Simplest form possible
const Button = ({ onClick, label }) => (
  <button onClick={onClick}>{label}</button>
);

// ❌ BAD - Over-engineered for memoization
const Button = React.memo(({ onClick, label }) => (
  <button onClick={onClick}>{label}</button>
));
```

### 3. Keep Dependencies Minimal

```javascript
// ✅ GOOD - Only necessary dependencies
const handleClick = useCallback(() => {
  process(id);
}, [id]);

// ❌ BAD - Too many dependencies
const handleClick = useCallback(() => {
  process(id);
}, [id, data, config, user, theme, ...]);
```

### 4. Use Profiler Regularly

```javascript
// Add performance checks to your testing
// Measure before/after memoization
// Document improvements
```

### 5. Document Memoization Decisions

```javascript
/**
 * Memoized to prevent re-renders when parent updates
 * without changing filters. Expected improvement: 30%
 * 
 * @memo Dependencies: filters prop stability required
 */
const FilterPanel = React.memo(function FilterPanel({ filters }) {
  // ...
});
```

---

## Common Pitfalls

### Pitfall 1: Memoizing Too Much

```javascript
// ❌ BAD - Every component memoized
export default createMemoComponent(SimpleButton);
export default createMemoComponent(Spacer);
export default createMemoComponent(Label);

// ✅ GOOD - Only expensive components
export default createMemoComponent(RevenueChart);
export default createMemoComponent(DataTable);
```

### Pitfall 2: Forgetting useCallback with Callbacks

```javascript
// ❌ BAD - New callback every render defeats React.memo
const MemoChild = React.memo(Child);
function Parent({ onSelect }) {
  return <MemoChild onSelect={(id) => onSelect(id)} />;
}

// ✅ GOOD - Stable callback reference
function Parent({ onSelect }) {
  const handleSelect = useCallback((id) => onSelect(id), [onSelect]);
  return <MemoChild onSelect={handleSelect} />;
}
```

### Pitfall 3: Complex Object Props

```javascript
// ❌ BAD - New object every render
<MemoChart
  config={{ colors: colors, animation: true, width: w }}
/>

// ✅ GOOD - Memoized object
const config = useMemo(
  () => ({ colors, animation: true, width: w }),
  [colors, w]
);
<MemoChart config={config} />
```

### Pitfall 4: Incorrect Dependency Arrays

```javascript
// ❌ BAD - Missing dependency
const result = useMemo(() => {
  return expensiveCalculation(data);
}, []); // data not in dependencies!

// ✅ GOOD - All dependencies included
const result = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);
```

### Pitfall 5: Premature Optimization

```javascript
// ❌ BAD - No evidence this is slow
const TrivialComponent = React.memo(({ text }) => <span>{text}</span>);

// ✅ GOOD - Profile shows it's a bottleneck
const ExpensiveChart = React.memo(RevenueChart);
```

---

## Summary Checklist

- [ ] Identified expensive components with Profiler
- [ ] Implemented React.memo for appropriate components
- [ ] Added useCallback for callbacks passed to memoized children
- [ ] Used useMemo for expensive computations
- [ ] Stabilized object and array props with useMemo
- [ ] Verified reduced re-renders with Profiler
- [ ] Added tests to prevent performance regressions
- [ ] Documented memoization decisions
- [ ] Measured performance improvements
- [ ] Avoided over-memoization

---

## Further Reading

- [React.memo - React Docs](https://react.dev/reference/react/memo)
- [useMemo - React Docs](https://react.dev/reference/react/useMemo)
- [useCallback - React Docs](https://react.dev/reference/react/useCallback)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
- [The 2 Types of Prop Comparison](https://react.dev/reference/react/memo#specifying-a-custom-comparison-function)
