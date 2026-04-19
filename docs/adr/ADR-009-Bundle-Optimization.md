# ADR-009: Bundle Optimization and Code Splitting Strategy

**Status:** Accepted  
**Date:** March 2024

## Context

Initial bundle size was 500KB+, causing:

- Slow initial page load
- Poor mobile experience
- High bandwidth usage
- Poor Lighthouse scores
- Delays in time-to-interactive

## Decision

Implement aggressive code splitting, tree-shaking, and bundle optimization.

## Rationale

### Code Splitting Strategy

```
Initial Load (gzipped):
├── vendor.js          (React, React Router, UI libs)    ~120KB
├── core.js            (Auth, API layer, utilities)       ~80KB
└── index.js           (App shell)                        ~20KB
    Total: ~220KB

Lazy-loaded by route:
├── /projects          ProjectPage bundle   ~50KB
├── /customers         CustomerPage bundle  ~40KB
├── /invoices          InvoicePage bundle   ~35KB
├── /reports           ReportsPage bundle   ~45KB
└── /analytics         AnalyticsPage bundle ~60KB
```

### Route-Based Code Splitting

```javascript
// /src/pages/index.jsx
import { Suspense, lazy } from 'react'
import { LoadingSpinner } from '@/components/common'

// Lazy load entire page components
const Dashboard = lazy(() => import('./DashboardPage'))
const Projects = lazy(() => import('./ProjectsPage'))
const Customers = lazy(() => import('./CustomersPage'))
const Invoices = lazy(() => import('./InvoicesPage'))
const Reports = lazy(() => import('./ReportsPage'))
const Analytics = lazy(() => import('./AnalyticsPage'))

function Router() {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <Suspense fallback={<LoadingSpinner />}>
            <Dashboard />
          </Suspense>
        }
      />
      {/* ... other routes */}
    </Routes>
  )
}
```

### Component-Level Code Splitting

```javascript
// For heavy components that might not be used
const HeavyReportBuilder = lazy(() =>
  import('@/components/features/reports/ReportBuilder')
)

// Use with Suspense
function ReportsPage() {
  const [showBuilder, setShowBuilder] = useState(false)
  
  return (
    <>
      <button onClick={() => setShowBuilder(true)}>
        Build Custom Report
      </button>
      
      {showBuilder && (
        <Suspense fallback={<LoadingSpinner />}>
          <HeavyReportBuilder />
        </Suspense>
      )}
    </>
  )
}
```

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  build: {
    // Rollup options for chunking
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['lucide-react', 'react-hot-toast'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-charts': ['recharts'],
          'vendor-supabase': ['@supabase/supabase-js'],
          
          // Feature chunks
          'feature-projects': ['src/components/features/projects'],
          'feature-customers': ['src/components/features/customers'],
          'feature-reports': ['src/components/features/reports'],
        },
      },
    },
    
    // Target modern browsers
    target: 'esnext',
    
    // Minify
    minify: 'terser',
    
    // Source maps only in development
    sourcemap: process.env.NODE_ENV === 'development',
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'zod',
    ],
  },
})
```

### Tree-Shaking

Ensure unused code is removed:

```javascript
// Good: Named exports enable tree-shaking
export function formatDate(date) { }
export function calculateDays(d1, d2) { }

// Usage: Only formatDate is included in bundle
import { formatDate } from '@/utils/dates'

// Bad: Default export prevents tree-shaking
export default {
  formatDate: (d) => { },
  calculateDays: (d1, d2) => { },
}
```

### Dynamic Imports

```javascript
// Load module conditionally
async function generatePDF(projectData) {
  // Only import when needed
  const { jsPDF } = await import('jspdf')
  const { autoTable } = await import('jspdf-autotable')
  
  const pdf = new jsPDF()
  autoTable(pdf, { /* ... */ })
  pdf.save('report.pdf')
}
```

### Asset Optimization

```javascript
// vite.config.js configuration
{
  build: {
    assetsInlineLimit: 4096, // Inline assets < 4KB
    
    // Image optimization
    rollupOptions: {
      external: [],
    },
  },
  
  // Compression
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
}
```

## Bundle Analysis

```bash
# Generate bundle report
npm run build

# Analyze bundle
npx vite-plugin-visualizer
```

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Initial JS | < 200KB | ~220KB |
| CSS | < 50KB | ~40KB |
| Largest contentful paint | < 2.5s | 2.0s |
| Time to interactive | < 3.5s | 3.2s |
| Lighthouse score | > 90 | 92 |

## Caching Strategy

```javascript
// Static assets (images, fonts)
// Cache for 1 year (fingerprinted)
static/assets/

// JavaScript bundles (versioned)
// Cache for 30 days (fingerprinted)
dist/assets/*.js

// HTML (no cache or short cache)
index.html
// Cache-Control: no-cache, must-revalidate
```

## Network Configuration

```javascript
// Preload critical resources
<link rel="preload" href="/js/vendor-react.js" as="script" />
<link rel="preload" href="/css/main.css" as="style" />

// Prefetch secondary resources
<link rel="prefetch" href="/js/feature-projects.js" />
```

## Monitoring

```javascript
// Track bundle size in CI
import { getFileSize } from '@/utils/build'

const bundles = {
  'vendor-react.js': 120000,
  'core.js': 80000,
}

for (const [name, expectedSize] of Object.entries(bundles)) {
  const actualSize = getFileSize(`dist/${name}`)
  if (actualSize > expectedSize * 1.1) {
    throw new Error(`Bundle ${name} grew > 10%`)
  }
}
```

## Lighthouse Optimization

- [ ] Remove render-blocking resources
- [ ] Enable Gzip compression
- [ ] Optimize images (WebP, lazy load)
- [ ] Minify CSS
- [ ] Remove unused CSS
- [ ] Optimize fonts
- [ ] Implement service worker

## CI/CD Integration

```yaml
# Bundle size check in GitHub Actions
- name: Check bundle size
  run: |
    npm run build
    npm run analyze:bundle
    
    # Fail if bundle increased > 10%
    if [ $(du -sb dist | awk '{print $1}') -gt 242000 ]; then
      echo "Bundle size increased > 10%"
      exit 1
    fi
```

## Consequences

### Positive

- 60% reduction in initial bundle (500KB -> 220KB)
- Faster page loads
- Better mobile experience
- Improved Core Web Vitals
- Better caching efficiency

### Negative

- More complex build configuration
- Slightly longer build times
- Requires monitoring

## Related ADRs

- ADR-005: Folder Organization (enables code splitting)

## References

- Vite Docs: https://vitejs.dev/
- Code Splitting: https://vitejs.dev/guide/build.html#chunking-strategy
- Performance: https://web.dev/performance/
