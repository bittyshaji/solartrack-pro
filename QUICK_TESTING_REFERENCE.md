# Quick Testing Reference Card
**Last Updated**: March 27, 2026

---

## 🚀 START HERE - 5-MINUTE TEST

Open any project and try this quick test sequence:

### Test Sequence (5 minutes)
```
1. EST STATE:
   - Add Material: name="Test", qty=5, cost=1000
   - See total = 5000 ✓
   - Create Proposal
   - Download PDF ✓

2. MOVE TO NEG:
   - Verify material still there ✓
   - Edit quantity to 10
   - Create Proposal
   - Download PDF (should show all stages) ✓

3. MOVE TO EXE:
   - Verify material updated to 10 ✓
   - Create Proposal
   - Create Invoice (select proposal from dropdown)
   - Download Invoice PDF ✓
   - Record Payment: ₹5000 (half of total)

4. CHECK:
   - Paid amount = ₹5000 ✓
   - Outstanding = ₹5000 ✓
```

**⏱️ Time**: 5-10 minutes
**✅ Pass if**: All items have checkmarks

---

## 📋 DETAILED TEST CHECKLIST

### Material Delivery (8 tests)
- [ ] Add material in EST
- [ ] Add multiple materials
- [ ] Edit material quantity
- [ ] Delete material with confirmation
- [ ] Material persists EST → NEG
- [ ] Edit material in NEG
- [ ] Material persists NEG → EXE
- [ ] Delete in EXE, verify persistence after refresh

### Full Workflow (7 tests)
- [ ] EST: Create proposal, download PDF with selected stages
- [ ] NEG: Edit quantities, create proposal, download PDF with all stages
- [ ] EXE: Create proposal, download PDF with all stages
- [ ] Create invoice linked to EXE proposal
- [ ] Download invoice PDF with project specs and stage breakdown
- [ ] Record payment (partial + full)
- [ ] Create multiple invoices for different proposals

### Mobile & Edge Cases (5 tests)
- [ ] Material operations work on mobile (375px view)
- [ ] Proposal operations work on mobile
- [ ] Error handling for invalid inputs
- [ ] Network error handling
- [ ] No duplicate records on double-click

---

## 🎯 WHAT TO TEST TODAY

### If you have 30 minutes:
1. Create new project
2. Add 2-3 materials in EST
3. Move to NEG, edit materials
4. Move to EXE
5. Create invoice and record payment
6. Download all PDFs

**Result**: Validates Material Delivery + Basic Workflow

### If you have 1 hour:
1. Follow 30-minute test
2. Test PDF content accuracy
3. Test mobile view (mobile view in DevTools)
4. Test error cases (negative numbers, empty fields)
5. Test double-clicking buttons

**Result**: Comprehensive feature validation

### If you have 2+ hours:
1. Complete PHASE4_TESTING_GUIDE.md all tests
2. Document any issues found
3. Create bug reports for failed tests
4. Note any UI/UX improvements needed

**Result**: Production-ready feature validation

---

## 🔴 CRITICAL ISSUES TO CHECK

| Issue | How to Test | Expected | Red Flag |
|-------|------------|----------|----------|
| Material doesn't persist across states | Add in EST, move to NEG, should still exist | Material visible | Material disappeared |
| PDF downloads corrupt | Download PDF, try to open | Opens and readable | Won't open or blank |
| Invoice amounts wrong | Create invoice, check total | Matches proposal total | Amounts don't match |
| Duplicate records | Double-click create button | One record | Multiple records |
| Mobile broken | View on 375px width | All clickable, readable | Overlapping, unclickable |

---

## ✅ PASS CRITERIA

### Material Delivery ✅
- [x] Can add, edit, delete materials
- [x] Quantities are whole numbers only
- [x] Total cost calculated correctly
- [x] Materials persist across EST → NEG → EXE

### Workflow ✅
- [x] Can create proposals in each state
- [x] PDFs download with correct data
- [x] Can create invoices linked to proposals
- [x] Can record payments

### Quality ✅
- [x] No console errors
- [x] Toast notifications for actions
- [x] Error messages are clear
- [x] Works on mobile

---

## 🐛 FOUND A BUG?

### Quick Bug Report Template
```
### Bug: [One-line title]

**Steps to Reproduce**:
1. Do this...
2. Then this...
3. Click this...

**Expected**: [What should happen]

**Actual**: [What actually happened]

**Error Message**: [If any]

**Screenshots/Video**: [If applicable]

**Environment**:
- Browser: Chrome/Firefox/Safari
- Screen: Desktop/Mobile
- State: EST/NEG/EXE
```

### Example
```
### Bug: Material doesn't persist after moving to NEG

**Steps**:
1. Create project in EST state
2. Add material "Panels", qty=10, cost=50000
3. Verify total shows 500000
4. Click "Move to Negotiation"
5. Scroll to Material Delivery section

**Expected**: Material still shows with same quantity and total

**Actual**: Material section is empty, total is 0

**Error Message**: None visible

**Environment**: Chrome on Windows Desktop
```

---

## 📞 COMMON QUESTIONS

**Q: My material didn't save. What should I do?**
A:
1. Check browser console (F12) for errors
2. Check network tab to see if save API call succeeded
3. Try again - might be temporary network issue
4. If persists, document and report as bug

**Q: Invoice PDF is blank**
A:
1. Check invoice was created successfully (see in list)
2. Try downloading again
3. Try different browser
4. Document and report if issue persists

**Q: Material quantity showing as decimal (e.g., 1.5)**
A:
1. Should only accept whole numbers
2. If you see decimal, report as bug
3. Workaround: Clear field and re-enter whole number

**Q: Mobile view looks wrong**
A:
1. Check you're using mobile view (375px width)
2. Try different mobile sizes (iOS, Android)
3. Check both portrait and landscape
4. Document which size has issues

---

## 🎯 SUCCESS INDICATOR

**Test is SUCCESSFUL when:**
- ✅ Add/edit/delete materials work across all states
- ✅ Full EST → NEG → EXE → Invoice workflow completes
- ✅ All PDFs download and display correctly
- ✅ Payment recording works
- ✅ No console errors
- ✅ Mobile view is usable
- ✅ All toast notifications appear

**Test is INCOMPLETE if:**
- ❌ Any feature doesn't work
- ❌ Errors in console
- ❌ PDFs don't download or open
- ❌ Mobile view is broken

---

## 📊 TESTING TIME ESTIMATES

| Test | Time | Priority |
|------|------|----------|
| Quick 5-min test | 5 min | **HIGH** |
| Material Delivery detailed | 20 min | **HIGH** |
| Full Workflow detailed | 30 min | **HIGH** |
| Mobile testing | 15 min | MEDIUM |
| Error cases | 15 min | MEDIUM |
| **Total** | **95 min** | |

---

## 💡 TIPS FOR TESTING

1. **Use fresh project**: Create new project for each major test to avoid contaminated data
2. **Clear console**: Start testing with clean console (DevTools open)
3. **Check network**: Verify API calls in Network tab if issues occur
4. **Test on real device**: If possible, test actual mobile device, not just DevTools simulation
5. **Take screenshots**: Document any issues with screenshots for bug reports
6. **Test edge cases**: Try negative numbers, very large numbers, special characters
7. **Verify PDFs**: Open downloaded PDFs to ensure content is correct
8. **Check calculations**: Manually verify all cost calculations match

---

## 🔧 TROUBLESHOOTING

### If app goes blank:
1. Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. Clear browser cache
3. Check console for errors
4. Restart dev server: Stop and npm run dev

### If API calls fail:
1. Check Supabase connection: View Network tab
2. Verify .env.local has correct credentials
3. Check Supabase dashboard for table status
4. Restart dev server

### If PDF won't download:
1. Check browser console for errors
2. Try incognito/private window
3. Try different browser
4. Check browser download settings

### If mobile view broken:
1. Make sure you're in mobile view (DevTools Device Toolbar)
2. Try different breakpoints (iPhone 12, Pixel 5, iPad)
3. Try landscape and portrait
4. Zoom to 100% (not zoomed out)

---

## 📝 TEST LOG TEMPLATE

```
Date: [Today's date]
Tester: [Your name]
Duration: [How long you tested]

QUICK TEST (5 min): PASS / FAIL
Material Delivery Tests: ___ / 8 passed
Full Workflow Tests: ___ / 7 passed
Mobile Tests: ___ / 2 passed
Edge Case Tests: ___ / 3 passed

CRITICAL ISSUES FOUND: ___
MINOR ISSUES FOUND: ___

Overall Result: ✅ READY / ⚠️ NEEDS FIXES

Issues to Fix:
1. [Issue]
2. [Issue]

Next Steps:
- [ ] Fix critical issues
- [ ] Retest after fixes
- [ ] Proceed to Priority 2 (Customer Banner redesign)
```

---

## ✨ NEXT AFTER TESTING

If all tests pass ✅:
→ Proceed to **Priority 2: Customer Information Banner Redesign**

If some tests fail ⚠️:
→ Document bugs and create **BUG_FIXES_REQUIRED.md**

If critical failures ❌:
→ Debug and fix before proceeding

