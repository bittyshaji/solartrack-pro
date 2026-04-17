# 🔄 Multiple Proposals Per State - Feature Guide

**Status**: ✅ Implemented
**Date**: March 25, 2026

---

## Overview

Your system now supports creating **multiple proposals** at each workflow state (Estimation, Negotiation, Execution) for the same project. This allows you to:

1. Create multiple EST proposals with different configurations
2. Choose which EST to base a NEG proposal on
3. Create multiple NEG proposals based on different EST proposals
4. Create multiple EXE proposals based on different NEG proposals

---

## How It Works

### Scenario Example

**Project: "Solar Install - 5KW"**

#### Step 1: Estimation (Multiple Options)
```
EST-20260325-0001  (Stage 1,3,4)  ₹12,000 - Option A
EST-20260325-0002  (Stage 1,2,3)  ₹15,000 - Option B
EST-20260325-0003  (Stage 2,4,5)  ₹18,000 - Option C
```

#### Step 2: Move to Negotiation
When clicking "Move to Negotiation", a **Proposal Selector Modal** appears:

```
┌─────────────────────────────────┐
│ Select Parent Proposal          │
│                                 │
│ Choose which Estimation         │
│ to base the new Negotiation on  │
├─────────────────────────────────┤
│ ✓ EST-20260325-0001             │ ← Selected
│   ₹12,000 (Created Mar 25)      │
│                                 │
│   EST-20260325-0002             │
│   ₹15,000 (Created Mar 25)      │
│                                 │
│   EST-20260325-0003             │
│   ₹18,000 (Created Mar 25)      │
├─────────────────────────────────┤
│ [Cancel]  [Use Selected] ✓      │
└─────────────────────────────────┘
```

#### Step 3: Negotiation (Multiple Options)
```
NEG-20260325-0001  (Based on EST-0001)  ₹14,000
NEG-20260325-0002  (Based on EST-0001)  ₹13,500
NEG-20260325-0003  (Based on EST-0002)  ₹16,000
NEG-20260325-0004  (Based on EST-0003)  ₹19,000
```

#### Step 4: Move to Execution
Again, a modal appears to select which NEG proposal to use:

```
┌─────────────────────────────────┐
│ Select Parent Proposal          │
│                                 │
│ Choose which Negotiation        │
│ to base the new Execution on    │
├─────────────────────────────────┤
│   NEG-20260325-0001             │
│   ₹14,000 (Created Mar 25)      │
│                                 │
│   NEG-20260325-0002             │
│   ₹13,500 (Created Mar 25)      │
│                                 │
│ ✓ NEG-20260325-0003             │ ← Selected
│   ₹16,000 (Created Mar 25)      │
│                                 │
│   NEG-20260325-0004             │
│   ₹19,000 (Created Mar 25)      │
├─────────────────────────────────┤
│ [Cancel]  [Use Selected] ✓      │
└─────────────────────────────────┘
```

#### Step 5: Execution (Final Proposals)
```
EXE-20260325-0001  (Based on NEG-0003)  ₹16,000
EXE-20260325-0002  (Based on NEG-0003)  ₹16,200 (Adjusted)
```

---

## User Workflow

### Creating Multiple EST Proposals

1. In **Estimation** panel:
   ```
   Stage 1: Edit tasks → Set quantities
   Stage 3: Edit tasks → Set quantities
   Click "Generate Proposal" → EST-0001 created
   
   Edit different tasks
   Click "Generate Proposal" → EST-0002 created
   
   Edit more tasks
   Click "Generate Proposal" → EST-0003 created
   ```

2. All proposals show in "Previous Estimations" section

### Selecting Parent When Moving States

1. Click "Move to Negotiation" button
2. If multiple EST proposals exist → **Selector modal appears**
3. Select desired EST proposal from list
4. Click "Use Selected"
5. Project moves to Negotiation with that EST as parent

### Key Rules

- ✅ Multiple proposals can exist at each state
- ✅ Each proposal must have unique number (auto-generated)
- ✅ Child proposal must have parent (tracks chain)
- ✅ Only qty > 0 tasks included in proposals
- ✅ Quantities persist through parent-child chain
- ⚠️ One proposal selected per move (can't merge EST proposals)

---

## Database Impact

### proposal_references table

```
| id  | project_id | proposal_type | proposal_number  | parent_id | created_at |
|-----|-----------|---------------|------------------|-----------|------------|
| 100 | proj_1    | Estimation    | EST-20260325-0001| NULL      | 2026-03-25 |
| 101 | proj_1    | Estimation    | EST-20260325-0002| NULL      | 2026-03-25 |
| 102 | proj_1    | Estimation    | EST-20260325-0003| NULL      | 2026-03-25 |
| 103 | proj_1    | Negotiation   | NEG-20260325-0001| 100       | 2026-03-25 |
| 104 | proj_1    | Negotiation   | NEG-20260325-0002| 100       | 2026-03-25 |
| 105 | proj_1    | Negotiation   | NEG-20260325-0003| 101       | 2026-03-25 |
| 106 | proj_1    | Execution     | EXE-20260325-0001| 105       | 2026-03-25 |
```

**Key**: parent_id NULL for EST proposals, points to parent proposal for NEG/EXE

---

## Components Modified

### New Component
- **ProposalSelector.jsx** - Modal for selecting parent proposal

### Updated Components
- **EstimationPanel.jsx** - Shows selector when moving to NEG
- **NegotiationPanel.jsx** - Shows selector when moving to EXE

### Unchanged
- **ExecutionPanel.jsx** - Final state, no moving to next state

---

## Testing the Feature

### Test Case: Multiple EST Proposals

1. Create project "Test-Multi-EST"
2. Go to Estimation
3. Add tasks to Stage 1, set qty=2
4. Click "Generate Proposal" → EST-0001 created
5. Edit Stage 1 task, set qty=3
6. Add tasks to Stage 2, set qty=1
7. Click "Generate Proposal" → EST-0002 created
8. Verify "Previous Estimations" shows both:
   ```
   EST-20260325-0001 - Created Mar 25
   EST-20260325-0002 - Created Mar 25
   ```

### Test Case: Proposal Selector

1. Still in Estimation with 2+ EST proposals
2. Click "Move to Negotiation"
3. **Proposal Selector Modal appears**
4. Verify all EST proposals listed
5. Select EST-0002
6. Click "Use Selected"
7. Project moves to Negotiation (based on EST-0002)

### Test Case: Multiple NEG Proposals

1. In Negotiation (from EST-0002)
2. Edit tasks, create NEG-0001
3. Edit more tasks, create NEG-0002
4. Click "Move to Execution"
5. **Proposal Selector appears with NEG-0001 and NEG-0002**
6. Select NEG-0002
7. Move to Execution based on NEG-0002

---

## Expected Behavior

| Action | Single Proposal | Multiple Proposals |
|--------|-----------------|-------------------|
| Create 1st proposal | Direct move button works | Button still works |
| Create 2nd proposal | - | Button still works |
| Click "Move" button | Moves directly | Shows selector modal |
| Select parent | N/A | Choose from list |
| Cancel selector | N/A | Stay in current state |

---

## Benefits

1. **Flexibility**: Create multiple options for customers
2. **Comparison**: Compare different configurations side-by-side
3. **Iteration**: Try different approaches without losing previous ones
4. **Control**: Choose exactly which proposal to advance
5. **History**: Full audit trail of all proposals created

---

## Common Use Cases

### Use Case 1: A/B Testing
- EST-0001: Budget option (smaller system)
- EST-0002: Premium option (larger system)
- Customer chooses EST-0001
- Proceed with EST-0001 to Negotiation

### Use Case 2: Customer Iterations
- EST-0001: Initial estimate
- Customer requests changes
- EST-0002: First revision
- Customer requests more changes
- EST-0003: Second revision
- Customer approves EST-0003
- Move to Negotiation with EST-0003

### Use Case 3: Budget Scenarios
- EST-0001: Full system (₹50,000)
- EST-0002: Reduced system (₹35,000)
- EST-0003: Minimal system (₹25,000)
- Sales team presents all three to customer
- Customer chooses EST-0002
- Negotiate on EST-0002

---

## Limitations

1. Can't merge proposals (can only select one parent)
2. Parent proposal locked once NEG created (can't change parent of existing NEG)
3. Can't copy/clone proposals (must create fresh)
4. Selector only shows if 2+ proposals exist (single proposal skips selector)

---

## Files Changed

- ✅ `/src/components/ProposalSelector.jsx` - NEW
- ✅ `/src/components/EstimationPanel.jsx` - UPDATED
- ✅ `/src/components/NegotiationPanel.jsx` - UPDATED

---

## Ready to Test? 🚀

1. Start dev server: `npm run dev`
2. Create a project
3. Go to Estimation
4. Create multiple EST proposals (at least 2)
5. Click "Move to Negotiation"
6. Verify Proposal Selector Modal appears
7. Select one and confirm

**Report back with results!**
