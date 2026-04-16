# Production Build Configuration Guide

---

## 1. VITE BUILD OPTIMIZATION SETTINGS

### Recommended vite.config.js for Production

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Output directory
    outDir: 'dist',
    
    // Minification and optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      },
      format: {
        comments: false
      }
    },
    
    // Chunk size warnings
    chunkSizeWarningLimit: 500, // 500 KB
    
    // Sourcemap configuration (disable in production)
    sourcemap: false,
    
    // Module preload polyfill
    modulePreload: true,
    
    // Rollup options for better chunking
    rollupOptions: {
      output: {
        // Code splitting strategy
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['lucide-react', 'react-hot-toast', 'recharts'],
          'data': ['@supabase/supabase-js', 'jspdf', 'xlsx']
        },
        // Asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|gif|svg/.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          } else if (/woff|woff2|eot|ttf|otf/.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          } else if (ext === 'css') {
            return `assets/css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        // Entry file names
        entryFileNames: 'assets/[name]-[hash].js',
        // Chunk file names
        chunkFileNames: 'assets/[name]-[hash].js'
      }
    },
    
    // CSS code split
    cssCodeSplit: true,
    
    // Report compressed size
    reportCompressedSize: true
  },
  
  // Production environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
```

---

## 2. ENVIRONMENT-SPECIFIC CONFIGURATIONS

### Development (vite.config.dev.js)
- Source maps enabled: easier debugging
- Console logs visible: development convenience
- No minification: faster build times
- Hot reload: rapid iteration

### Staging (vite.config.staging.js)
- Source maps enabled (but not deployed): debugging capability
- Minification enabled: performance testing
- All security headers configured
- Uses staging credentials

### Production (vite.config.prod.js)
- Source maps disabled: security + performance
- Minification enabled: optimization
- Code splitting enabled: better caching
- All security headers required

### Configuration Switching
```bash
# Development
npm run build -- --config vite.config.dev.js

# Staging
npm run build -- --config vite.config.staging.js

# Production (default)
npm run build -- --config vite.config.prod.js
# or simply: npm run build
```

---

## 3. BUNDLE SIZE ANALYSIS

### Pre-Build Size Analysis
```bash
# Install webpack-bundle-analyzer
npm install --save-dev webpack-bundle-analyzer

# Analyze build
npm run build
npm run analyze  # If added to scripts
```

### Target Bundle Sizes
| Chunk | Target Size | Warning Level | Critical Level |
|-------|------------|---------------|-----------------|
| vendor | 200 KB | 250 KB | 300 KB |
| ui | 150 KB | 200 KB | 250 KB |
| data | 100 KB | 150 KB | 200 KB |
| main | 100 KB | 150 KB | 200 KB |
| Total | 550 KB | 700 KB | 900 KB |

### Bundle Size Optimization Tips
1. Remove unused dependencies
2. Lazy load routes (React Router)
3. Tree-shake unused exports
4. Use dynamic imports for optional features
5. Compress images and assets
6. Enable CSS code splitting

### Size Report Command
```bash
# After build
du -sh dist/
du -sh dist/assets/
find dist -name "*.js" -exec ls -lh {} \; | sort -k5 -hr | head -10
```

---

## 4. PERFORMANCE OPTIMIZATION RECOMMENDATIONS

### Core Web Vitals Targets
| Metric | Target | Good | Needs Improvement |
|--------|--------|------|-------------------|
| Largest Contentful Paint (LCP) | < 2.5s | < 2.5s | > 4s |
| First Input Delay (FID) | < 100ms | < 100ms | > 300ms |
| Cumulative Layout Shift (CLS) | < 0.1 | < 0.1 | > 0.25 |

### Optimization Strategies

#### 1. Code Splitting
```javascript
// Use React.lazy for route-based code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'))
const Projects = React.lazy(() => import('./pages/Projects'))

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/projects" element={<Projects />} />
  </Routes>
</Suspense>
```

#### 2. Image Optimization
- Use WebP format with fallbacks
- Implement lazy loading with `loading="lazy"`
- Use responsive images with `srcset`
- Compress images: `imagemin`, `tinypng`

#### 3. Caching Strategy
```javascript
// Cache busting with content hash
// Vite automatically handles this with [hash]

// Service worker caching strategy
// Cache static assets (js, css, fonts)
// Network-first for API calls
// Cache-first for images
```

#### 4. Font Optimization
- Limit font variants (bold, italic only if needed)
- Use `font-display: swap` for faster rendering
- Preload critical fonts:
```html
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
```

#### 5. JavaScript Performance
- Defer non-critical JavaScript
- Use dynamic imports for optional features
- Implement request batching for API calls
- Use Web Workers for heavy computations

#### 6. CSS Performance
- Minimize CSS bundle size
- Remove unused CSS (PurgeCSS / Tailwind)
- Inline critical CSS
- Defer non-critical CSS

### Performance Monitoring
```javascript
// Measure Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

getCLS(console.log)
getFID(console.log)
getFCP(console.log)
getLCP(console.log)
getTTFB(console.log)
```

---

## 5. SECURITY HEADERS CONFIGURATION

### NGINX Configuration (Production)
```nginx
# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.resend.com https://*.supabase.co; frame-ancestors 'none';" always;

# X-Frame-Options
add_header X-Frame-Options "DENY" always;

# X-Content-Type-Options
add_header X-Content-Type-Options "nosniff" always;

# X-XSS-Protection
add_header X-XSS-Protection "1; mode=block" always;

# Referrer-Policy
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Permissions-Policy (formerly Feature-Policy)
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()" always;

# Strict-Transport-Security (enable after HTTPS verified)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

### CORS Headers Configuration
```nginx
# CORS headers for production domain
map $http_origin $cors_origin {
    ~^https?://(www\.)?solartrack\.com$ $http_origin;
    ~^https?://(app\.)?solartrack\.com$ $http_origin;
    default "";
}

add_header Access-Control-Allow-Origin $cors_origin always;
add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
add_header Access-Control-Max-Age 3600 always;
```

### Web Server Configuration (Apache)
```apache
<IfModule mod_headers.c>
  Header set X-UA-Compatible "IE=edge"
  Header set X-Frame-Options "DENY"
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>

# Enable HTTPS redirect
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Cache static assets
<FilesMatch "\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$">
  Header set Cache-Control "max-age=31536000, public"
</FilesMatch>

# Cache HTML only for short period
<FilesMatch "\.html$">
  Header set Cache-Control "max-age=3600, public"
</FilesMatch>
```

---

## 6. BUILD VERIFICATION CHECKLIST

Before deploying to production, verify:

```bash
# 1. Clean build
rm -rf dist node_modules
npm install
npm run build

# 2. Bundle size
ls -lh dist/assets/

# 3. Check for console.log (should be 0)
grep -r "console\." dist/ | wc -l

# 4. Verify source maps disabled
ls dist/assets/*.map 2>/dev/null | wc -l
# Should output: 0

# 5. Check file permissions
ls -la dist/ | head -5

# 6. Test server
npm run preview
# Visit http://localhost:4173 and test features

# 7. Performance metrics
curl -I http://localhost:4173
```

---

## 7. CI/CD BUILD CONFIGURATION

### GitHub Actions Example
```yaml
name: Production Build

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_RESEND_API_KEY: ${{ secrets.VITE_RESEND_API_KEY }}
          VITE_EMAIL_FROM: ${{ secrets.VITE_EMAIL_FROM }}
      
      - name: Analyze bundle size
        run: |
          echo "=== Bundle Size Analysis ==="
          du -sh dist/
          find dist/assets -name "*.js" -exec du -sh {} \;
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: production-build
          path: dist/
          retention-days: 30
```

---

## 8. PRODUCTION DEPLOYMENT CHECKLIST

- [ ] All environment variables configured
- [ ] Source maps disabled
- [ ] Console.log statements removed
- [ ] Bundle size within limits
- [ ] Security headers configured
- [ ] HTTPS enabled and redirects working
- [ ] CORS properly configured
- [ ] CDN cache headers set
- [ ] Health check endpoint working
- [ ] Monitoring and logging configured

---

**Last Updated:** 2026-04-16
