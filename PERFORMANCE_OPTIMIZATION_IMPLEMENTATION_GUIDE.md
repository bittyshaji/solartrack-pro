# Performance Optimization - Implementation Guide

## Phase 1: Quick Wins (Week 1)

### Task 1.1: Lazy-Load Recharts

**Location:** `/src/lib/services/operations/dynamicImports.js`

**Add this function:**
```javascript
/**
 * Lazy load Recharts for analytics and reports
 * Only imported when rendering charts to avoid bloating the main bundle
 * ~148KB savings by lazy loading
 * @returns {Promise<recharts>}
 */
export async function loadRecharts() {
  if (loadedModules.recharts) {
    return loadedModules.recharts
  }

  try {
    const {
      BarChart, Bar, LineChart, Line, AreaChart, Area,
      PieChart, Pie, FunnelChart, Funnel, ComposedChart,
      XAxis, YAxis, CartesianGrid, Tooltip, Legend,
      ResponsiveContainer, Cell
    } = await import('recharts')
    
    loadedModules.recharts = {
      BarChart, Bar, LineChart, Line, AreaChart, Area,
      PieChart, Pie, FunnelChart, Funnel, ComposedChart,
      XAxis, YAxis, CartesianGrid, Tooltip, Legend,
      ResponsiveContainer, Cell
    }
    return loadedModules.recharts
  } catch (error) {
    console.error('Failed to load Recharts:', error)
    throw new Error(`Failed to load charting library: ${error.message}`)
  }
}
```

**Files to Update:**
- `src/components/analytics/CustomerLifetimeValue.jsx`
- `src/components/analytics/CustomerSegmentationChart.jsx`
- `src/components/analytics/MonthlyTrendsChart.jsx`
- `src/components/analytics/PipelineForecatingChart.jsx`
- `src/components/analytics/ProjectCompletionFunnel.jsx`
- `src/components/analytics/RevenueChart.jsx`
- `src/components/analytics/TeamPerformanceChart.jsx`
- `src/components/reports/FinancialDashboard.jsx`
- `src/components/reports/ProjectAnalytics.jsx`
- `src/components/reports/TeamPerformance.jsx`

**Example Refactoring (CustomerLifetimeValue.jsx):**

**Before:**
```javascript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function CustomerLifetimeValue({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="ltv" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

**After:**
```javascript
import { useEffect, useState } from 'react'
import { loadRecharts } from '@/lib/services/operations/dynamicImports'

export default function CustomerLifetimeValue({ data }) {
  const [Charts, setCharts] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadRecharts()
      .then(charts => setCharts(charts))
      .catch(err => {
        console.error('Failed to load charts:', err)
        setError(err)
      })
  }, [])

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700">Failed to load chart</div>
  }

  if (!Charts) {
    return <div className="p-4 bg-gray-100 animate-pulse">Loading chart...</div>
  }

  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } = Charts

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="ltv" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

**Alternative Approach (Recommended):**
Create a wrapper component to handle lazy loading:

**File: `src/components/charts/LazyChart.jsx`**
```javascript
import { Suspense, lazy } from 'react'

const chartCache = {}

export function createLazyChart(importPath, ChartComponent) {
  const LazyComponent = lazy(() => 
    import(importPath).then(module => ({ 
      default: module.ChartComponent 
    }))
  )

  return (props) => (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

function ChartLoadingFallback() {
  return (
    <div className="p-4 bg-gray-100 rounded animate-pulse h-64 flex items-center justify-center">
      <span className="text-gray-500">Loading chart...</span>
    </div>
  )
}

// Usage in analytics pages:
export const LazyCustomerLifetimeValue = createLazyChart(
  './CustomerLifetimeValue',
  'CustomerLifetimeValue'
)
```

---

### Task 1.2: Lazy-Load HTML2Canvas

**Location:** `/src/lib/services/operations/dynamicImports.js`

**Add this function:**
```javascript
/**
 * Lazy load html2canvas for screenshot/canvas rendering
 * Only imported when generating screenshot exports
 * ~198KB savings by lazy loading
 * @returns {Promise<html2canvas>}
 */
export async function loadHtml2Canvas() {
  if (loadedModules.html2canvas) {
    return loadedModules.html2canvas
  }

  try {
    const { default: html2canvas } = await import('html2canvas')
    loadedModules.html2canvas = html2canvas
    return loadedModules.html2canvas
  } catch (error) {
    console.error('Failed to load html2canvas:', error)
    throw new Error(`Failed to load screenshot library: ${error.message}`)
  }
}
```

**Files to Update:**
- `src/lib/services/proposals/proposalDownloadService.js`
- `src/lib/services/invoices/invoiceDownloadService.js`

**Example Refactoring:**

**Before (proposalDownloadService.js):**
```javascript
import html2canvas from 'html2canvas'

export async function exportProposalAsImage(elementId) {
  const element = document.getElementById(elementId)
  const canvas = await html2canvas(element)
  // ... rest of logic
}
```

**After:**
```javascript
import { loadHtml2Canvas } from './dynamicImports'

export async function exportProposalAsImage(elementId) {
  const html2canvas = await loadHtml2Canvas()
  const element = document.getElementById(elementId)
  const canvas = await html2canvas(element)
  // ... rest of logic
}
```

---

### Task 1.3: Optimize CSS Bundle

**Current Status:** 72 KB (11.73 KB gzipped)

**Analysis:**
- Component-specific CSS files: 5+ files found
- Tailwind utilities: Can be optimized with purging
- Unused CSS: Likely present

**Implementation:**

**File: `tailwind.config.js`** (IMPROVED)
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  theme: {
    extend: {
      // Add custom colors if needed
      colors: {},
      // Add other custom utilities
    },
  },
  
  plugins: [],
  
  // Purging configuration
  safelist: [
    // List critical classes that might be conditionally applied
    // e.g., if using [&.active]:text-blue-500
  ],
  
  // Production settings
  corePlugins: {
    preflight: true, // Keep full reset in production
  },
}
```

**Consolidate CSS files into Tailwind utilities:**

**Before (AdvancedFilterPanel.css):**
```css
.filter-panel {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.filter-button {
  padding: 0.5rem 1rem;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  cursor: pointer;
}

.filter-button:hover {
  background-color: #f3f4f6;
}

.filter-button.active {
  background-color: #3b82f6;
  color: white;
}
```

**After (Use Tailwind classes):**
```javascript
// AdvancedFilterPanel.jsx
export function AdvancedFilterPanel({ filters, onFilterChange }) {
  return (
    <div className="flex gap-4 p-4 bg-gray-50 border border-gray-200 rounded">
      {/* Remove CSS file import */}
      {/* Instead use Tailwind classes */}
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`
            px-4 py-2 rounded border transition-colors
            ${filter.active 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-white border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
```

**Remove CSS imports:**
- Remove `import './AdvancedFilterPanel.css'` from component files
- Remove these files if no longer referenced:
  - `/src/components/AdvancedFilterPanel.css`
  - `/src/components/batch/CSVImportWizard/styles.css`
  - `/src/components/GlobalSearchBar.css`
  - `/src/components/projects/ProjectForm/styles.css`
  - `/src/components/SavedFiltersList.css`

**Expected Savings:** 20-30 KB (28-42% of CSS)

---

### Task 1.4: Verify Performance Improvements

**After completing Tasks 1.1-1.3:**

```bash
# Build and measure
npm run build

# Expected results:
# - Main bundle: 2.0 MB → ~1.7-1.8 MB (10-15% reduction)
# - Gzipped: 537 KB → ~470-480 KB (12-15% reduction)
# - CSS: 72 KB → 50-55 KB (25-30% reduction)
```

---

## Phase 2: React Memoization (Week 2)

### Task 2.1: Identify High-Render Components

**Run this analysis:**
```bash
# Search for components that render lists
grep -r "map(" src/components --include="*.jsx" | grep "render\|return"

# Search for frequently used components
grep -r "export default" src/components --include="*.jsx" | wc -l
```

**High-Priority Memoization Candidates:**

1. **ProjectCard.jsx** - Renders in lists of 10-100+
2. **CustomerRow.jsx** - Renders in tables of 20-200+
3. **Dashboard widgets** - Render on every data update
4. **Chart wrappers** - Re-render with parent component
5. **Form fields** - Re-render with parent form updates

### Task 2.2: Add React.memo

**Example: ProjectCard.jsx**

**Before:**
```javascript
export default function ProjectCard({ project, onSelect, isSelected }) {
  return (
    <div onClick={() => onSelect(project.id)}>
      <h3>{project.name}</h3>
      <p>{project.status}</p>
      <p>{project.location}</p>
    </div>
  )
}
```

**After:**
```javascript
export default React.memo(
  function ProjectCard({ project, onSelect, isSelected }) {
    return (
      <div onClick={() => onSelect(project.id)}>
        <h3>{project.name}</h3>
        <p>{project.status}</p>
        <p>{project.location}</p>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip render)
    return (
      prevProps.project.id === nextProps.project.id &&
      prevProps.isSelected === nextProps.isSelected
    )
  }
)
```

---

## Phase 3: Service Lazy Loading (Week 3)

### Task 3.1: Create Service Registry

**File: `src/lib/services/registry.js`** (NEW)

```javascript
/**
 * Service Registry for lazy-loaded optional services
 * Reduces initial bundle by loading services on-demand
 */

const serviceRegistry = {
  // Services that are conditionally used
  email: () => import('./emails/emailService'),
  finance: () => import('./finance/financeService'),
  analytics: () => import('./operations/analyticsService'),
  batch: () => import('./operations/batch/batchOperationsService'),
  
  // Cache loaded services
  _cache: {},
}

/**
 * Load a service by name
 * @param {string} serviceName - Name of service to load
 * @returns {Promise} - Loaded service module
 */
export async function getService(serviceName) {
  if (!serviceRegistry[serviceName]) {
    throw new Error(`Unknown service: ${serviceName}`)
  }

  if (serviceRegistry._cache[serviceName]) {
    return serviceRegistry._cache[serviceName]
  }

  try {
    const service = await serviceRegistry[serviceName]()
    serviceRegistry._cache[serviceName] = service
    return service
  } catch (error) {
    console.error(`Failed to load service ${serviceName}:`, error)
    throw new Error(`Service loading failed: ${error.message}`)
  }
}

/**
 * Preload multiple services in parallel
 */
export async function preloadServices(serviceNames) {
  return Promise.all(
    serviceNames.map(name => getService(name))
  )
}
```

### Task 3.2: Update Service Usage

**Example: Email Service Usage**

**Before:**
```javascript
import emailService from '@/lib/services/emails/emailService'

// In component
const sendEmail = async (recipient, subject, body) => {
  await emailService.send({ recipient, subject, body })
}
```

**After:**
```javascript
import { getService } from '@/lib/services/registry'

// In component
const sendEmail = async (recipient, subject, body) => {
  const { emailService } = await getService('email')
  await emailService.send({ recipient, subject, body })
}

// Or with preloading on route mount:
useEffect(() => {
  if (location.pathname.includes('email')) {
    getService('email') // Preload silently
  }
}, [location.pathname])
```

---

## Phase 4: Component Code Splitting (Week 4-5)

### Task 4.1: Identify Splittable Components

**Large Components to Split:**
1. CompletionCertificatePanel.jsx (1,097 lines)
2. WarrantyPanel.jsx (1,056 lines)
3. UnifiedProposalPanel.jsx (1,024 lines)

### Task 4.2: Refactoring Pattern

**Example: CompletionCertificatePanel.jsx**

**Current Structure:**
```javascript
export default function CompletionCertificatePanel({ project }) {
  // 1097 lines of code
  // - Form rendering
  // - Validation logic
  // - Download logic
  // - Preview rendering
  // - Certificate generation
}
```

**After Splitting:**
```javascript
// New file structure:
src/components/panels/CompletionCertificate/
  ├── index.jsx (main component)
  ├── CertificateForm.jsx (form fields)
  ├── CertificatePreview.jsx (preview display)
  ├── CertificateGenerator.jsx (generation logic)
  └── useCertificateLogic.js (shared hooks)
```

**Implementation:**

**File: `src/components/panels/CompletionCertificate/index.jsx`**
```javascript
import { lazy, Suspense, useState } from 'react'

const CertificateForm = lazy(() => import('./CertificateForm'))
const CertificatePreview = lazy(() => import('./CertificatePreview'))

export default function CompletionCertificatePanel({ project }) {
  const [formData, setFormData] = useState({})
  const [showPreview, setShowPreview] = useState(false)

  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="p-4 bg-gray-100 animate-pulse">Loading form...</div>}>
        <CertificateForm 
          data={formData} 
          onChange={setFormData}
          project={project}
        />
      </Suspense>

      {showPreview && (
        <Suspense fallback={<div className="p-4 bg-gray-100 animate-pulse">Loading preview...</div>}>
          <CertificatePreview 
            data={formData}
            project={project}
          />
        </Suspense>
      )}

      <button onClick={() => setShowPreview(!showPreview)}>
        {showPreview ? 'Hide Preview' : 'Show Preview'}
      </button>
    </div>
  )
}
```

---

## Phase 5: Advanced Runtime Optimizations (Week 6-7)

### Task 5.1: Virtual Scrolling for Lists

**Installation:**
```bash
npm install react-window
```

**Example: Projects List**

**Before:**
```javascript
import { useState, useEffect } from 'react'
import ProjectCard from './ProjectCard'

export default function ProjectsList() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    // Load projects
    fetchProjects().then(setProjects)
  }, [])

  return (
    <div className="grid grid-cols-3 gap-4">
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  )
}
```

**After:**
```javascript
import { useState, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import ProjectCard from './ProjectCard'

export default function ProjectsList() {
  const [projects, setProjects] = useState([])

  useEffect(() => {
    fetchProjects().then(setProjects)
  }, [])

  const Row = ({ index, style }) => (
    <div style={style}>
      <ProjectCard project={projects[index]} />
    </div>
  )

  return (
    <List
      height={600}
      itemCount={projects.length}
      itemSize={200}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

### Task 5.2: Implement Caching Strategy

**File: `src/lib/caching/dataCache.js`** (NEW)

```javascript
/**
 * Simple data caching with TTL support
 */
export class DataCache {
  constructor(defaultTtl = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map()
    this.timers = new Map()
    this.defaultTtl = defaultTtl
  }

  get(key) {
    return this.cache.get(key)
  }

  set(key, value, ttl = this.defaultTtl) {
    // Clear existing timer
    this.clear(key)

    // Store value
    this.cache.set(key, value)

    // Set expiration
    const timer = setTimeout(() => {
      this.cache.delete(key)
      this.timers.delete(key)
    }, ttl)

    this.timers.set(key, timer)
  }

  has(key) {
    return this.cache.has(key)
  }

  clear(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
    this.cache.delete(key)
  }

  clearAll() {
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.cache.clear()
  }
}

// Create global cache instances
export const apiCache = new DataCache(5 * 60 * 1000) // 5 min
export const userPreferencesCache = new DataCache(30 * 60 * 1000) // 30 min
```

**Usage in API Client:**

```javascript
import { apiCache } from '@/lib/caching/dataCache'

export async function getProjects() {
  const cacheKey = 'projects_list'

  // Check cache first
  if (apiCache.has(cacheKey)) {
    return apiCache.get(cacheKey)
  }

  // Fetch from API
  const response = await fetch('/api/projects')
  const data = await response.json()

  // Cache result
  apiCache.set(cacheKey, data)

  return data
}
```

---

## Testing & Validation Checklist

After each phase, run these tests:

```bash
# Build and analyze bundle
npm run build
# Review dist/bundle-analysis.html

# Test all routes load
npm run dev
# Manually test all 20 routes

# Measure performance
# Use Lighthouse in Chrome DevTools
# Check Performance > Metrics

# Check for errors
# Look at browser console for warnings/errors

# Validate lazy loading
# Open DevTools Network tab
# Navigate between routes
# Verify chunks load on demand
```

---

## Monitoring After Implementation

**Key Metrics to Track:**
- Main bundle size
- Gzipped bundle size
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Route load times
- Dynamic import load times
- Cache hit rates

**Use existing performance monitoring:**
```javascript
// Already implemented in src/lib/performanceMonitoring.js
import performanceMonitor from '@/lib/performanceMonitoring'

// Get metrics
const metrics = performanceMonitor.getMetrics()
const summary = performanceMonitor.getSummary()
```

---

See PERFORMANCE_AUDIT_REPORT.md for complete analysis and recommendations.
