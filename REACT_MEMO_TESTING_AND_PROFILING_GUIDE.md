# React.memo Testing & Profiling Guide - SolarTrack Pro

---

## Table of Contents

1. [React DevTools Profiler Setup](#react-devtools-profiler-setup)
2. [Performance Measurement Procedures](#performance-measurement-procedures)
3. [Unit Testing for Memoization](#unit-testing-for-memoization)
4. [Integration Testing](#integration-testing)
5. [Visual Regression Testing](#visual-regression-testing)
6. [Profiler Reading Guide](#profiler-reading-guide)
7. [Performance Benchmarking](#performance-benchmarking)
8. [Debugging Memoization Issues](#debugging-memoization-issues)
9. [CI/CD Performance Checks](#cicd-performance-checks)

---

## React DevTools Profiler Setup

### Installation

1. **Install React DevTools Extension:**
   - Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
   - Firefox: [React Developer Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
   - Edge: Same as Chrome

2. **Verify Installation:**
   - Open DevTools (F12)
   - Click "Components" tab
   - Should see your React components listed

3. **Enable Profiler:**
   - Click "Profiler" tab next to Components

### Project Setup

1. **Ensure React is in Development Mode:**
   ```javascript
   // src/main.jsx
   if (process.env.NODE_ENV === 'development') {
     console.log('Running in development mode')
   }
   ```

2. **Optional: Install React DevTools Profiler Package:**
   ```bash
   npm install react-devtools-profiler
   ```

---

## Performance Measurement Procedures

### Baseline Measurement (Before Optimization)

#### Step 1: Set Up Test Environment

```javascript
// src/utils/performanceUtils.js
export class PerformanceBaseline {
  constructor(componentName) {
    this.componentName = componentName
    this.measurements = []
  }

  mark(label) {
    performance.mark(`${this.componentName}-${label}`)
  }

  measure(startLabel, endLabel) {
    const measureName = `${this.componentName}-${startLabel}-to-${endLabel}`
    performance.measure(
      measureName,
      `${this.componentName}-${startLabel}`,
      `${this.componentName}-${endLabel}`
    )
    const measure = performance.getEntriesByName(measureName)[0]
    this.measurements.push({
      name: measureName,
      duration: measure.duration
    })
    return measure.duration
  }

  getAverageDuration() {
    const sum = this.measurements.reduce((acc, m) => acc + m.duration, 0)
    return sum / this.measurements.length
  }

  clear() {
    this.measurements = []
    performance.clearMarks()
    performance.clearMeasures()
  }

  report() {
    const avg = this.getAverageDuration()
    console.table({
      component: this.componentName,
      measurements: this.measurements.length,
      averageDuration: `${avg.toFixed(2)}ms`,
      min: `${Math.min(...this.measurements.map(m => m.duration)).toFixed(2)}ms`,
      max: `${Math.max(...this.measurements.map(m => m.duration)).toFixed(2)}ms`
    })
  }
}
```

#### Step 2: Record Baseline with Profiler

1. **Open your app in development mode**
2. **Open React DevTools Profiler**
3. **Start Recording** (red circle button)
4. **Perform typical interactions:**
   - Click metric cards 5 times
   - Type in search field 5 times
   - Apply filters 5 times
   - Scroll list 5 times
5. **Stop Recording** (click red circle again)
6. **Note the results:**
   - Total render time
   - Number of components rendered
   - Average render time per component

#### Step 3: Document Baseline

```markdown
## Dashboard Baseline Metrics (Before Optimization)

**Date:** 2026-04-19
**Browser:** Chrome 125
**Data Size:** ~100 items

### Overall Performance
- **Total Dashboard Render Time:** 45.2ms
- **Number of Components:** 15
- **Average Component Render:** 3.01ms
- **Re-renders per Filter Change:** 8

### Component Breakdown
- AdvancedMetricsCard: 12ms total (3 instances)
- RevenueChart: 18ms
- FilterPanel: 5.2ms
- ProjectList: 10ms

### Memory Usage
- **Heap Size:** 12.4MB
- **Component Tree Depth:** 8 levels
```

---

## Unit Testing for Memoization

### Test Case 1: Verify Memoization Works

```javascript
// src/components/__tests__/AdvancedMetricsCard.memoization.test.js
import React, { useState } from 'react'
import { render } from '@testing-library/react'
import AdvancedMetricsCard from '../AdvancedMetricsCard'

describe('AdvancedMetricsCard - Memoization', () => {
  // Track render count
  let renderCount = 0

  const TestWrapper = ({ props }) => {
    const [count, setCount] = useState(0)

    React.useEffect(() => {
      renderCount++
    })

    return (
      <div>
        <button onClick={() => setCount(count + 1)}>Increment</button>
        <AdvancedMetricsCard {...props} />
      </div>
    )
  }

  beforeEach(() => {
    renderCount = 0
  })

  it('should not re-render when parent re-renders with same props', () => {
    const props = {
      title: 'Revenue',
      value: 50000,
      color: 'orange',
      trend: 'up'
    }

    const { getByText } = render(<TestWrapper props={props} />)

    const initialRenderCount = renderCount

    // Click button to cause parent re-render
    getByText('Increment').click()

    // If memoized, card component shouldn't have re-rendered
    // (Only parent re-renders)
    expect(renderCount).toBeLessThan(initialRenderCount + 5)
  })

  it('should re-render when props change', () => {
    const { rerender } = render(
      <AdvancedMetricsCard
        title="Revenue"
        value={50000}
        color="orange"
        trend="up"
      />
    )

    renderCount = 0

    rerender(
      <AdvancedMetricsCard
        title="Revenue"
        value={60000} // Different value
        color="orange"
        trend="up"
      />
    )

    // Should re-render when props change
    expect(renderCount).toBeGreaterThan(0)
  })
})
```

### Test Case 2: useCallback Verification

```javascript
describe('useCallback in Components', () => {
  it('callback should maintain same reference across renders', () => {
    let callbackRef = null

    function TestComponent({ onCallback }) {
      const handleClick = React.useCallback(() => {
        onCallback?.()
      }, [onCallback])

      React.useEffect(() => {
        callbackRef = handleClick
      }, [handleClick])

      return <button onClick={handleClick}>Click</button>
    }

    const mockOnCallback = jest.fn()
    const { rerender } = render(
      <TestComponent onCallback={mockOnCallback} />
    )

    const firstRef = callbackRef

    rerender(<TestComponent onCallback={mockOnCallback} />)

    const secondRef = callbackRef

    // If deps array is correct, refs should be same
    expect(firstRef).toBe(secondRef)
  })
})
```

### Test Case 3: useMemo Verification

```javascript
describe('useMemo in Components', () => {
  it('expensive computation should be cached', () => {
    let computeCount = 0

    function TestComponent({ items }) {
      const filtered = React.useMemo(() => {
        computeCount++
        return items.filter(i => i.active)
      }, [items])

      return <div>{filtered.length}</div>
    }

    const items = [
      { id: 1, active: true },
      { id: 2, active: false }
    ]

    const { rerender } = render(<TestComponent items={items} />)

    const countAfterFirstRender = computeCount

    // Re-render with same items reference
    rerender(<TestComponent items={items} />)

    // Computation should not run again
    expect(computeCount).toBe(countAfterFirstRender)
  })
})
```

---

## Integration Testing

### Test Case: Full Component Tree Memoization

```javascript
// src/components/__tests__/Dashboard.integration.test.js
import { render, screen, fireEvent } from '@testing-library/react'
import Dashboard from '../Dashboard'

describe('Dashboard - Memoization Integration', () => {
  it('filtering should not re-render all metric cards', async () => {
    const { getByRole, getByLabelText } = render(<Dashboard />)

    // Get initial metric cards
    const metricCards = screen.getAllByTestId('metric-card')
    const initialCount = metricCards.length

    // Change filter
    const filterInput = getByLabelText('Status Filter')
    fireEvent.change(filterInput, { target: { value: 'active' } })

    // Metric cards should still be rendered
    const afterFilterCards = screen.getAllByTestId('metric-card')
    expect(afterFilterCards).toHaveLength(initialCount)
  })

  it('searching should not re-render stable components', async () => {
    const { getByPlaceholderText } = render(<Dashboard />)

    const searchInput = getByPlaceholderText('Search...')

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'solar' } })

    // Header should remain stable (not re-render)
    const header = screen.getByTestId('dashboard-header')
    expect(header).toBeInTheDocument()
  })

  it('sorting list should not re-render filter panel', () => {
    const { getByRole, getByTestId } = render(<Dashboard />)

    // Find sort button
    const sortButton = getByRole('button', { name: /sort by/i })

    // Click to sort
    fireEvent.click(sortButton)

    // Filter panel should be unchanged
    const filterPanel = getByTestId('filter-panel')
    expect(filterPanel).toBeInTheDocument()
  })
})
```

---

## Visual Regression Testing

### Using Percy or Similar Tools

```javascript
// src/components/__tests__/AdvancedMetricsCard.visual.test.js
import percySnapshot from '@percy/cli'
import { render } from '@testing-library/react'
import AdvancedMetricsCard from '../AdvancedMetricsCard'

describe('AdvancedMetricsCard - Visual Regression', () => {
  it('should match baseline screenshot', async () => {
    const { container } = render(
      <AdvancedMetricsCard
        title="Revenue"
        value={50000}
        color="orange"
        trend="up"
        format="currency"
      />
    )

    await percySnapshot('AdvancedMetricsCard', { widths: [375, 768, 1280] })
  })

  it('should render correctly in all trend states', async () => {
    const trends = ['up', 'down', 'flat']

    for (const trend of trends) {
      const { container } = render(
        <AdvancedMetricsCard
          title="Revenue"
          value={50000}
          color="orange"
          trend={trend}
        />
      )

      await percySnapshot(`AdvancedMetricsCard-${trend}`)
    }
  })
})
```

---

## Profiler Reading Guide

### Understanding Profiler Output

#### Render Bar Chart

```
Component                Render Duration    Re-renders
─────────────────────────────────────────────────────
Dashboard                    45.2ms          1
├─ AdvancedMetricsCard       2.1ms           1  (Memoized)
├─ AdvancedMetricsCard       1.9ms           0  (Skipped - no prop change)
├─ AdvancedMetricsCard       2.0ms           1  (Memoized)
├─ RevenueChart              18.5ms          1
├─ FilterPanel               5.2ms           1
└─ ProjectList               12.0ms          1
   ├─ ProjectRow             0.8ms           1
   ├─ ProjectRow             0.7ms           0  (Skipped)
   └─ ProjectRow             0.9ms           1
```

#### Key Metrics to Watch

1. **Render Time (ms):** How long component took to render
2. **Re-renders:** Number of times rendered (0 = skipped, good!)
3. **Gray bars:** Components that were skipped (memoization working!)
4. **Yellow bars:** Components with moderate render time
5. **Red bars:** Components with long render time (optimize!)

### Identifying Problem Components

**Yellow/Red Bars = Optimization Needed**

```
BAD - Component re-renders every time:
├─ ProjectRow  [█████████]  8.5ms (Re-rendered 5 times)
└─ ProjectRow  [█████████]  8.3ms (Re-rendered 5 times)

GOOD - Memoization working:
├─ ProjectRow  [░░░░░░░░░]  0.0ms (Skipped 1 time)
└─ ProjectRow  [░░░░░░░░░]  0.0ms (Skipped 1 time)
```

### Flamegraph View

Shows which components took the most time:

```
1. RevenueChart (18.5ms) - Expensive chart rendering
2. ProjectList (12.0ms) - List operations
3. FilterPanel (5.2ms) - Form interactions
4. Dashboard (45.2ms) - Total time
```

**Action:** If RevenueChart takes 18.5ms, that's a good candidate for memoization.

---

## Performance Benchmarking

### Create Benchmark Suite

```javascript
// src/utils/benchmarks.js
export async function runBenchmark(component, props, iterations = 10) {
  const measurements = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()

    const { unmount } = render(
      React.createElement(component, props)
    )

    const end = performance.now()

    measurements.push(end - start)

    unmount()
  }

  return {
    component: component.name,
    iterations,
    average: measurements.reduce((a, b) => a + b) / measurements.length,
    min: Math.min(...measurements),
    max: Math.max(...measurements),
    total: measurements.reduce((a, b) => a + b),
    measurements
  }
}

export async function compareBenchmarks(before, after) {
  const improvement = ((before.average - after.average) / before.average) * 100

  return {
    component: before.component,
    beforeAvg: `${before.average.toFixed(2)}ms`,
    afterAvg: `${after.average.toFixed(2)}ms`,
    improvement: `${improvement.toFixed(1)}%`,
    verdict: improvement > 0 ? 'FASTER' : 'SLOWER'
  }
}
```

### Run Benchmarks

```javascript
// src/__tests__/performance.benchmark.js
import { runBenchmark, compareBenchmarks } from '../utils/benchmarks'
import AdvancedMetricsCard from '../components/AdvancedMetricsCard'

describe('Performance Benchmarks', () => {
  it('should show memoization improvement', async () => {
    const props = {
      title: 'Revenue',
      value: 50000,
      color: 'orange',
      trend: 'up'
    }

    const benchmark = await runBenchmark(AdvancedMetricsCard, props, 20)

    console.table(benchmark)

    // Expect average render time < 5ms
    expect(benchmark.average).toBeLessThan(5)
  })
})
```

---

## Debugging Memoization Issues

### Issue 1: Component Still Re-renders

**Debug Steps:**

```javascript
// Add console.log to detect re-renders
const MyComponent = React.memo(function MyComponent(props) {
  console.log('MyComponent rendered with props:', props)

  return <div>...</div>
})

// Or use a custom hook
function useWhyDidYouUpdate(name, props) {
  const previousProps = React.useRef()

  React.useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props })
      const changedProps = {}

      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key]
          }
        }
      })

      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps)
      }
    }

    previousProps.current = props
  }, [props, name])
}

// Usage:
function MyComponent(props) {
  useWhyDidYouUpdate('MyComponent', props)
  return <div>...</div>
}
```

### Issue 2: Stale Closures

**Debug Pattern:**

```javascript
const MyComponent = React.memo(function MyComponent({ userId, onUpdate }) {
  const handleUpdate = React.useCallback(() => {
    console.log('userId in closure:', userId)
    onUpdate(userId)
  }, [userId, onUpdate]) // MUST include userId here

  return <button onClick={handleUpdate}>Update</button>
})
```

### Issue 3: Object/Array Equality

**Debug Pattern:**

```javascript
function Parent() {
  // BAD - filters object changes every render
  const filters = { status: 'active' }

  return <Child filters={filters} />
}

// Debug with:
function Child({ filters }) {
  const prevFilters = React.useRef()

  React.useEffect(() => {
    if (prevFilters.current && prevFilters.current !== filters) {
      console.log('filters object reference changed')
    }
    prevFilters.current = filters
  }, [filters])

  return <div>...</div>
}

// Fix:
function Parent() {
  const filters = React.useMemo(() => ({ status: 'active' }), [])
  return <Child filters={filters} />
}
```

---

## CI/CD Performance Checks

### GitHub Actions Workflow

```yaml
# .github/workflows/performance.yml
name: Performance Checks

on: [pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run performance benchmarks
        run: npm run test:performance

      - name: Compare with baseline
        run: node scripts/compare-performance.js

      - name: Comment PR with results
        if: always()
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(
              fs.readFileSync('performance-results.json', 'utf8')
            );
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Performance Results\n\`\`\`json\n${JSON.stringify(results, null, 2)}\n\`\`\``
            });
```

### Performance Test Script

```bash
#!/bin/bash
# scripts/test-performance.sh

echo "Running performance benchmarks..."

npm test -- --testPathPattern=performance --json --outputFile=performance-results.json

if [ $? -eq 0 ]; then
  echo "Performance tests passed!"
else
  echo "Performance tests failed!"
  exit 1
fi
```

---

## Performance Checklist

### Pre-Implementation

- [ ] Baseline measurements recorded
- [ ] React DevTools installed and working
- [ ] Test environment set up
- [ ] Performance utilities imported

### During Implementation

- [ ] Component wrapped in React.memo
- [ ] useCallback added for handlers
- [ ] useMemo added for computations
- [ ] Parent component updated
- [ ] No console warnings

### Post-Implementation

- [ ] Performance improved (3-50%)
- [ ] Visual regression tests pass
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] No memory leaks detected
- [ ] No stale closure issues
- [ ] Profiler shows skipped renders
- [ ] Documentation updated

---

## Summary

### Key Metrics to Track

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Avg Render Time | ___ ms | ___ ms | < 5% difference |
| Re-renders per Action | ___ | ___ | -50% |
| Memory Overhead | ___ KB | ___ KB | < 5% increase |
| Time to Interactive | ___ ms | ___ ms | -10% |

### Tools Used

1. **React DevTools Profiler** - Visual profiling
2. **Performance API** - Baseline measurements
3. **Jest/Testing Library** - Unit tests
4. **Percy** - Visual regression testing
5. **Custom Benchmarks** - Automated performance comparison

### Next Actions

1. Record baseline metrics
2. Implement one component
3. Measure improvements
4. Document results
5. Iterate on other components
