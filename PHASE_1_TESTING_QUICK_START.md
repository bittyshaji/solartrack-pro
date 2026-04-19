# SolarTrack Pro Phase 1 - Testing Quick Start Guide

**For**: Developers implementing Phase 1 optimizations  
**Time Required**: 2-3 hours total  
**Difficulty**: Moderate

---

## TL;DR - Essential Commands

```bash
# 1. BASELINE CAPTURE (before any changes)
npm clean-install
npm run build
ls -lh dist/js/*.js  # Note the sizes
lighthouse http://localhost:5173 --output=json > baseline.json

# 2. IMPLEMENT OPTIMIZATION
# [Make code changes]
git add .
git commit -m "optimization: [name]"

# 3. TEST & MEASURE
npm run build
npm run test
npm run type-check
npm run lint:check
lighthouse http://localhost:5173 --output=json > optimized.json

# 4. COMPARE
# Compare before/after sizes and metrics
# Update PHASE_1_METRICS_COMPARISON_TEMPLATE.md
```

---

## 1-Minute Setup

```bash
# 1. Navigate to project
cd /path/to/solar_backup

# 2. Install dependencies
npm clean-install

# 3. Verify environment
node --version    # Should be 18+
npm --version     # Should be 9+

# 4. Create results directory
mkdir -p performance-results/{baseline,optimized,lighthouse}

# 5. Ready to test!
echo "Setup complete. Ready for testing."
```

---

## Step 1: Capture Baseline (30 minutes)

### Before Making ANY Optimization Changes

```bash
# 1. Ensure clean state
npm clean-install
rm -rf dist/

# 2. Build
npm run build

# 3. Measure bundle sizes
echo "=== JavaScript Files ===" > performance-results/baseline/SIZES.txt
ls -lh dist/js/*.js | awk '{print $9, $5}' >> performance-results/baseline/SIZES.txt

echo "=== CSS Files ===" >> performance-results/baseline/SIZES.txt
ls -lh dist/css/*.css | awk '{print $9, $5}' >> performance-results/baseline/SIZES.txt

cat performance-results/baseline/SIZES.txt

# 4. Run Lighthouse
npm run dev &
sleep 5
lighthouse http://localhost:5173 \
  --output=json \
  --output-path=./performance-results/lighthouse/baseline.json
killall node
```

**Save These Baseline Values!**
```
main.js: ____ KB
vendor-charts.js: ____ KB
Total CSS: ____ KB
Total gzipped: ____ KB
Lighthouse Performance: ____ /100
```

---

## Step 2: Implement Optimization (Varies)

### For Recharts Optimization (1-2 hours)

```bash
# 1. Find all Recharts imports
grep -r "from 'recharts'" src/

# 2. Remove unused chart types
# Edit vite.config.js to enable tree-shaking

# 3. Convert to dynamic imports
# Example change:
# BEFORE: import { LineChart } from 'recharts';
# AFTER: const LineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })));

# 4. Test
npm run type-check
npm run lint:check
npm run test
```

### For HTML2Canvas Optimization (30 minutes)

```bash
# 1. Find html2canvas import
grep -r "html2canvas" src/

# 2. Remove static import
# Delete: import html2canvas from 'html2canvas';

# 3. Create dynamic loader
# Create file: src/lib/lazy-html2canvas.ts
# Export function: loadHtml2Canvas() -> dynamic import

# 4. Update all export functions
# Find all export calls and use lazy loader

# 5. Test
npm run type-check
npm run test
```

### For CSS Optimization (1 hour)

```bash
# 1. Enable Tailwind PurgeCSS
# Edit tailwind.config.js to include all template files

# 2. Test unused class removal
npm run build

# 3. Verify visual appearance
npm run dev
# Open app in browser, check all pages look correct
```

### For React.memo Optimization (1 hour)

```bash
# 1. Identify expensive components
# Open React DevTools Profiler
# Record interactions, note components with many re-renders

# 2. Wrap with React.memo
# Edit each component to export: const Comp = React.memo(function Comp() { ... });

# 3. Add custom comparison if needed
# For components with complex props

# 4. Test
npm run type-check
npm run test
```

---

## Step 3: Verify & Measure (20 minutes)

```bash
# 1. Build
npm run build

# 2. Verify quality
npm run type-check
npm run lint:check
npm run test

# 3. Measure new bundle size
echo "=== After Optimization ===" > performance-results/optimized/SIZES.txt
ls -lh dist/js/*.js | awk '{print $9, $5}' >> performance-results/optimized/SIZES.txt
cat performance-results/optimized/SIZES.txt

# 4. Quick calculation
echo "Calculating savings..."
# main.js baseline: X KB → now: Y KB = Z KB saved

# 5. Run Lighthouse
npm run dev &
sleep 5
lighthouse http://localhost:5173 \
  --output=json \
  --output-path=./performance-results/lighthouse/optimized.json
killall node

# 6. Extract metrics
echo "Performance Score in optimized.json:"
cat performance-results/lighthouse/optimized.json | grep -o '"performance":[^,]*' || echo "Check JSON manually"
```

---

## Step 4: Document Results (10 minutes)

### Record in Spreadsheet Format

Create `performance-results/RESULTS.csv`:

```csv
Optimization,Metric,Baseline,After,Savings,% Change,Status
Recharts,vendor-charts.js,120KB,95KB,-25KB,-21%,✓
Recharts,TTI,2500ms,2300ms,-200ms,-8%,✓
HTML2Canvas,main.js,60KB,42KB,-18KB,-30%,✓
HTML2Canvas,FCP,1800ms,1630ms,-170ms,-9%,✓
CSS,main.css,25KB,20KB,-5KB,-20%,✓
CSS,Lighthouse,72/100,81/100,+9,+12%,✓
React.memo,TTI,2300ms,1700ms,-600ms,-26%,✓
React.memo,Re-renders,50 avg,12 avg,-38,-76%,✓
```

### Update Main Template

Edit `PHASE_1_METRICS_COMPARISON_TEMPLATE.md`:
- Fill in all measured values
- Calculate improvements
- Mark as "Complete"

---

## Step 5: Code Quality Check (5 minutes)

```bash
# Ensure no regressions
npm run type-check
# Expected: "No errors found"

npm run lint:check
# Expected: "No linting errors"

npm run test
# Expected: "All tests passing"

npm run test:coverage
# Expected: ">80% coverage maintained"
```

---

## Troubleshooting

### Bundle Size Didn't Change

```bash
# 1. Verify code was actually changed
git diff src/

# 2. Check tree-shaking is enabled
cat vite.config.js | grep -i "tree\|shake"

# 3. Clean build
rm -rf dist/ && npm run build

# 4. Verify bundle analysis
open dist/bundle-analysis.html
# Check if problematic code is still there
```

### Lighthouse Scores Inconsistent

```bash
# This is normal! Run 3 times and average:
lighthouse http://localhost:5173 --output=json > audit1.json
sleep 10
lighthouse http://localhost:5173 --output=json > audit2.json
sleep 10
lighthouse http://localhost:5173 --output=json > audit3.json

# Average the three results manually
```

### Tests Failing After Optimization

```bash
# 1. See what failed
npm run test

# 2. Fix the issue
# Usually: import statement mismatch or mock setup

# 3. Verify tests pass
npm run test

# 4. If still failing, revert optimization and debug
git diff src/
```

---

## Key Files to Edit

### For Recharts
- `src/components/Dashboard/ChartRenderer.jsx` (dynamic imports)
- `vite.config.js` (tree-shaking settings)

### For HTML2Canvas
- `src/lib/lazy-html2canvas.ts` (new file)
- `src/features/export/ExportPanel.jsx` (use lazy loader)

### For CSS
- `tailwind.config.js` (contentPath, purge settings)
- `postcss.config.js` (if needed)

### For React.memo
- All expensive components (add `React.memo()` wrapper)

---

## Verification Checklist

Before considering optimization "done":

- [ ] Build successful: `npm run build` ✓
- [ ] No TypeScript errors: `npm run type-check` ✓
- [ ] No linting errors: `npm run lint:check` ✓
- [ ] All tests pass: `npm run test` ✓
- [ ] Bundle measured and compared
- [ ] Lighthouse audit run
- [ ] Metrics recorded in CSV/JSON
- [ ] Code review approved
- [ ] Git commit made with clear message

---

## Performance Targets Checklist

As you complete each optimization, verify against targets:

### Recharts (Expected: -25 KB gzipped, -8% TTI)
- [ ] vendor-charts.js reduced by 15-25 KB
- [ ] TTI improved by 5-10%
- [ ] All chart features work

### HTML2Canvas (Expected: -18 KB raw, -9% FCP)
- [ ] main.js reduced by 15-20 KB
- [ ] Initial load improved
- [ ] First export ~150ms acceptable

### CSS (Expected: -5 KB CSS, -10% FCP)
- [ ] main.css reduced by 3-5 KB
- [ ] All styles intact
- [ ] No layout shifts

### React.memo (Expected: 3-6% runtime, -30% re-renders)
- [ ] Re-renders reduced 50-80%
- [ ] Interactions responsive
- [ ] TTI improved 5-10%

---

## Quick Reference: Essential Commands

| Task | Command | Time |
|------|---------|------|
| Setup | `npm clean-install` | 2 min |
| Build | `npm run build` | 1 min |
| Type check | `npm run type-check` | 30s |
| Lint | `npm run lint:check` | 30s |
| Test | `npm run test` | 2 min |
| Lighthouse | `lighthouse http://localhost:5173 --output=json > audit.json` | 2 min |
| Bundle size | `ls -lh dist/js/*.js` | 5s |
| View bundle | `open dist/bundle-analysis.html` | 5s |

---

## Success Indicators

You'll know you're on track if:

✓ Bundle size decreases with each optimization  
✓ Lighthouse score goes up (target: 75+)  
✓ TTI improves with each change  
✓ All tests pass  
✓ App functions identically  
✓ No visual changes  

---

## When to Get Help

Ask for help if:

- [ ] Bundle size increases after optimization
- [ ] Lighthouse score decreases significantly
- [ ] Tests start failing and you can't fix them
- [ ] Components don't render correctly
- [ ] Export features are broken
- [ ] Unsure which optimization to apply next

**Contact**: [Team Lead] or [Performance Engineer]

---

## Expected Timeline

| Phase | Duration | Task |
|-------|----------|------|
| Setup | 5 min | Environment setup |
| Baseline | 30 min | Capture metrics |
| Recharts | 1-2 hrs | Implementation + testing |
| HTML2Canvas | 30 min | Implementation + testing |
| CSS | 1 hr | Implementation + testing |
| React.memo | 1 hr | Implementation + testing |
| Validation | 30 min | Final testing + documentation |
| **TOTAL** | **4-6 hrs** | Complete Phase 1 |

---

## Final Checklist

- [ ] All 4 optimizations implemented
- [ ] All tests passing
- [ ] All metrics measured
- [ ] Bundle size reduced 15-20% (target)
- [ ] Lighthouse improved 10+ points
- [ ] TTI improved 15-20%
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Ready for deployment

**Status**: ⬜ Not Started / 🟡 In Progress / 🟢 COMPLETE

---

## Next Steps After Completion

1. Commit changes with clear message
2. Submit for code review
3. Get performance lead sign-off
4. Merge to main branch
5. Tag release: `v1-phase-1-optimized`
6. Plan Phase 2 optimizations
7. Implement continuous monitoring

---

**Need help?** See full documentation in:
- `PHASE_1_PERFORMANCE_TESTING.md` - Detailed testing guide
- `PERFORMANCE_MEASUREMENT_PROCEDURES.md` - Step-by-step procedures
- `PERFORMANCE_MEASUREMENT_COMMANDS.md` - All measurement commands
- `PHASE_1_METRICS_COMPARISON_TEMPLATE.md` - Results template
