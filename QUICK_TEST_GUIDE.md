# Quick Testing Guide - Critical Fixes

## What Was Fixed

✅ **Fix #1:** Download button in ProposalHistory now works
✅ **Fix #2:** ProposalHistory loads complete estimate & invoice data
✅ **Fix #3:** Invoices now linked to execution proposals
✅ **Fix #4:** ProposalHistory auto-refreshes after state changes

---

## 5-Minute Test Workflow

### Step 1: Create Estimation Proposal
1. Go to a project → Estimation panel
2. Edit task quantities (set at least one > 0)
3. Click **"Generate Proposal"**
4. Click **"Download PDF"** → Should download successfully ✅

### Step 2: Move to Negotiation
1. Click **"Move to Negotiation"** → Select parent proposal
2. Modify task quantities/costs
3. Click **"Generate Proposal"**
4. Expand proposal in history → Should see Estimate Details ✅

### Step 3: Move to Execution
1. Click **"Move to Execution"** → Select parent proposal
2. Keep default quantities or modify them
3. Click **"Generate Proposal"**
4. Click **"Generate Invoice"** → Should create and show in history ✅

### Step 4: Verify History
1. Scroll to **"Proposal History"** section
2. You should see all 3 proposals (EST, NEG, EXE)
3. Expand each one → Should see:
   - Estimate Details with Grand Total ✅
   - Invoice Details with Amount & Status (for EXE) ✅
4. Click **"Download PDF"** on any proposal → Should work ✅

### Step 5: Go Back and Modify
1. Click **"← Back to Negotiation"**
2. Modify a task quantity
3. Click **"Move to Execution"** again
4. ProposalHistory should show new NEG proposal ✅

---

## Expected Results

### ProposalHistory Should Display:

**For Estimation Proposal:**
- Type badge: Blue "Estimation"
- Proposal number (e.g., EST-20260325-0001)
- Status badge (e.g., "Draft")
- Expand to see: Estimate Details, Grand Total, Selected Stages

**For Negotiation Proposal:**
- Type badge: Orange "Negotiation"
- Proposal number (e.g., NEG-20260325-0002)
- Expand to see: Estimate Details, Modified amounts

**For Execution Proposal:**
- Type badge: Green "Execution"
- Proposal number (e.g., EXE-20260325-0003)
- Expand to see: Estimate Details + Invoice Details
- Invoice showing: Number, Amount, Payment Status

---

## Common Issues & Solutions

### Issue: "No estimate data found" when downloading
**Cause:** Proposal doesn't have related estimate data
**Solution:** Ensure you created the proposal (didn't skip the generation step)

### Issue: Invoice doesn't appear in history
**Cause:** Database column `proposal_id` doesn't exist in `project_invoices`
**Solution:** Run migration:
```sql
ALTER TABLE project_invoices
ADD COLUMN proposal_id UUID REFERENCES proposal_references(id);
```

### Issue: History shows old data after state change
**Cause:** Component didn't re-render
**Solution:** Manual refresh - Click **"Refresh Proposals"** button at bottom of history

### Issue: Download button looks disabled
**Cause:** Still generating PDF
**Solution:** Wait for "Generating..." to change back to "Download PDF"

---

## Data Relationships Verified ✅

```
Project
  ├── Proposal (EST-0001)
  │    └── Estimate
  │         └── Selected Stages
  │
  ├── Proposal (NEG-0001)
  │    ├── Parent: EST-0001
  │    └── Estimate
  │         └── Modified Stages/Costs
  │
  └── Proposal (EXE-0001)
       ├── Parent: NEG-0001
       ├── Estimate
       └── Invoice  ← Now linked via proposal_id ✅
            └── Payment Status
```

---

## File Checklist for Deployment

Verify these files are updated in your repository:

- [ ] `src/components/ProposalHistory.jsx` - Download handler added
- [ ] `src/lib/proposalReferenceService.js` - Enhanced getProposalHierarchy
- [ ] `src/lib/invoiceService.js` - Updated createInvoice signature
- [ ] `src/components/ExecutionPanel.jsx` - Proposal ID state + invoice linking
- [ ] `src/pages/ProjectDetail.jsx` - Auto-refresh history

---

## Success Criteria

All tests pass if:

1. ✅ Download button in ProposalHistory works for all proposals
2. ✅ Estimate details display with correct amounts
3. ✅ Invoice details appear for execution proposals
4. ✅ Payment status updates correctly
5. ✅ History auto-refreshes after state transitions
6. ✅ Can navigate back and modify without issues
7. ✅ All data persists correctly in database

---

## Need Help?

If tests fail:
1. Check browser console (F12) for errors
2. Check server logs for database errors
3. Verify database schema matches expectations
4. Review error toast messages for specific issues

**All 4 fixes are now live and ready for testing!** 🚀
