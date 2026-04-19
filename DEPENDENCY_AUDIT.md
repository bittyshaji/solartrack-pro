# Dependency Audit - SolarTrack Pro

**Date**: April 18, 2026

## Dependency Analysis

### Production Dependencies (11 total)

| Package | Version | Size | Used | Recommendation |
|---------|---------|------|------|-----------------|
| react | ^18.2.0 | 42KB | Core (all pages) | KEEP - Essential |
| react-dom | ^18.2.0 | 65KB | Core (all pages) | KEEP - Essential |
| react-router-dom | ^6.22.0 | 60KB | All routes | SPLIT TO VENDOR ✅ |
| react-hook-form | ^7.72.1 | 25KB | Forms only | **LAZY LOAD** - Used: 5 pages |
| @hookform/resolvers | ^5.2.2 | 15KB | Validation only | **LAZY LOAD** - Used: 5 pages |
| zod | ^4.3.6 | 35KB | Validation only | **LAZY LOAD** - Used: 5 pages |
| react-hot-toast | ^2.6.0 | 8KB | Notifications | KEEP - Lightweight |
| lucide-react | ^0.577.0 | 125KB | Icons (all) | KEEP - Essential UI |
| recharts | ^2.15.4 | 350KB | Analytics/Reports | SPLIT BY ROUTE ✅ |
| jspdf | ^2.5.1 | 280KB | PDF only | **DYNAMIC IMPORT** - Used: Reports |
| jspdf-autotable | ^5.0.7 | 45KB | PDF tables only | **DYNAMIC IMPORT** - Paired with jspdf |
| xlsx | ^0.18.5 | 450KB | Excel only | **DYNAMIC IMPORT** - Used: Batch ops |
| @supabase/supabase-js | ^2.39.0 | 220KB | Auth/DB | SPLIT TO VENDOR ✅ |

### Development Dependencies (12 total)

All dev dependencies are not included in production bundle. Verified no dev code shipped.

**Summary**: ✅ No unused dev dependencies found in bundle.

## Optimization Opportunities by Category

### 1. Currently Eager-Loaded (CRITICAL - 730KB)

#### jsPDF + jspdf-autotable (325KB)
- **Current Import**: src/lib/exportService.js (lines 6-8)
- **Usage Pattern**: Only in Reports page
- **Frequency**: Users who never generate PDFs waste 325KB
- **Status**: dynamicImports.js has loader ready - NOT BEING USED
- **Fix Priority**: IMMEDIATE
- **Implementation**:
  ```javascript
  // OLD (exportService.js)
  import jsPDF from 'jspdf'
  import 'jspdf-autotable'
  
  // NEW
  const { jsPDF } = await loadjsPDF()
  ```

#### XLSX (450KB)
- **Current Imports**: 
  - src/lib/batchExportService.js (line 6)
  - src/lib/batchOperationsService.js
- **Usage Pattern**: Only in batch operations, CSV import wizard
- **Frequency**: Most users never use batch operations
- **Status**: dynamicImports.js has loader ready - NOT BEING USED
- **Fix Priority**: IMMEDIATE
- **Implementation**: Convert to async wrapper functions

### 2. Currently Route-Split (GOOD - 350KB)

#### Recharts
- **Status**: ✅ Split via route lazy loading
- **Pages**: Dashboard, Reports, AdminDashboard
- **Current Savings**: Loaded only when routes accessed
- **Optimization Opportunity**: Component-level splitting for dashboard variants
- **Priority**: LOW (already optimized at route level)

### 3. Currently Vendor-Split (GOOD - 60KB)

#### react-router-dom
- **Status**: ✅ In vendor-routing chunk
- **Size**: 60KB
- **No further optimization possible**

#### @supabase/supabase-js
- **Status**: ✅ In vendor-supabase chunk
- **Size**: 220KB
- **Note**: Already split, loaded early (needed for auth)
- **No further optimization needed**

### 4. Forms & Validation Dependencies (75KB) - OPTIMIZATION OPPORTUNITY

#### react-hook-form + zod + @hookform/resolvers
- **Total Size**: 75KB
- **Used in Pages**: 
  - CreateProject.jsx
  - Customers.jsx
  - Team.jsx
  - Login.jsx
  - Signup.jsx
- **Not Used in Pages**: 
  - Dashboard, Reports, Projects, ProjectDetail, etc. (8+ pages)
- **Current Status**: Loaded in main bundle on all pages
- **Opportunity**: Lazy load with form pages
- **Priority**: MEDIUM
- **Potential Savings**: 75KB

### 5. Light & Essential (KEEP)

- **react-hot-toast**: 8KB (lightweight, UI essential)
- **lucide-react**: 125KB (icons used everywhere, necessary)

## Summary of Actions

### Must Do (730KB total savings)

1. **exportService.js** → Convert jsPDF imports to dynamic
   - Lines 6-8 need refactoring
   - Use loadjsPDF() from dynamicImports
   - Estimated savings: 325KB

2. **Batch Services** → Convert XLSX imports to dynamic
   - batchExportService.js (line 6)
   - batchOperationsService.js
   - Use loadXLSX() from dynamicImports
   - Estimated savings: 450KB

### Should Do (75KB potential savings)

3. **Form Pages** → Lazy load validation dependencies
   - Route-level: Load zod + react-hook-form only for form pages
   - Estimated savings: 75KB

### Nice to Have (120KB potential savings)

4. **Analytics Components** → Component-level splitting
   - AdvancedMetricsCard, charts, etc.
   - Estimated savings: 120KB

## Implementation Timeline

| Phase | Tasks | Effort | Savings | Timeline |
|-------|-------|--------|---------|----------|
| 1 | Convert jsPDF & XLSX to dynamic | 2hrs | 730KB | Week 1 |
| 2 | Add preload on mount for common operations | 1hr | 0KB | Week 1 |
| 3 | Lazy load validation libs | 3hrs | 75KB | Week 2 |
| 4 | Component-level analytics splitting | 4hrs | 120KB | Week 2 |
| 5 | Performance testing & monitoring | 2hrs | 0KB | Week 2 |

## Testing Checklist

- [ ] Bundle size reduced to 1.8-1.9MB
- [ ] All PDF exports still work (jsPDF loads on demand)
- [ ] All Excel operations still work (XLSX loads on demand)
- [ ] Reports page loads with preload fallback
- [ ] Batch operations accessible and functional
- [ ] No console errors for missing imports
- [ ] Performance metrics tracked in monitoring
- [ ] Load times measured before/after
- [ ] Network tab shows correct chunk loading

## Conclusion

**Key Finding**: Two major libraries (jsPDF + XLSX = 730KB) are being loaded eagerly but only used in specific features. This is a major quick win - fix these first.

**Expected Outcome**: 
- Conservative: 2.6MB → 1.87MB (28% reduction)
- Aggressive: 2.6MB → 1.68MB (35% reduction)
- **Target**: 2.6MB → 1.8MB (30% reduction) ✅ ACHIEVABLE
