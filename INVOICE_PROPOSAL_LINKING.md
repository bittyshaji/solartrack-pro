# Invoice-Proposal Linking
**Date**: March 27, 2026
**Feature**: Link invoices to Execution (EXE) proposals via dropdown
**Status**: ✅ Complete

---

## What Changed

### 1. **Proposal Selection Dropdown**
When generating an invoice in EXE state, you now see:
```
[Select EXE Proposal ▼]  [Generate Invoice]
```

The dropdown shows all available Execution proposals with their proposal numbers:
- EXE-001
- EXE-002
- EXE-003
- etc.

### 2. **Invoice-Proposal Linking**
When you select a proposal and click "Generate Invoice":
- Invoice is created and linked to that specific proposal
- `proposal_id` is stored in the invoice record
- The link is displayed in the invoice list

### 3. **Invoice Display**
Each invoice now shows:
```
Invoice Number: INV-20260327-0001
Linked to: EXE-001 | Amount: ₹500,000 | Paid: ₹200,000
```

The "Linked to:" field shows which proposal this invoice is connected to.

---

## How to Use

### Step 1: Create Execution Proposal
```
1. Go to project → EXE state
2. Click "Create Execution Proposal"
3. Confirm project details
4. System creates proposal (e.g., EXE-001)
```

### Step 2: Generate Invoice
```
1. Scroll down to invoice section
2. Click "Select EXE Proposal" dropdown
3. Choose which proposal to link to (e.g., EXE-001)
4. Click "Generate Invoice"
5. Invoice is created with proposal link
```

### Step 3: View Linked Invoice
```
Invoices section shows:
[INV-20260327-0001]
Linked to: EXE-001 | Amount: ₹500,000 | Paid: ₹200,000

[Download] [Record Payment]
```

---

## Features

| Feature | Details |
|---------|---------|
| **Dropdown** | Shows all EXE proposals for selection |
| **Linking** | Invoice stored with proposal_id reference |
| **Display** | Shows proposal number in invoice list |
| **Disabled State** | Generate button disabled until proposal is selected |
| **Flexibility** | Can create multiple invoices linked to different proposals |
| **Traceability** | Each invoice tracks which proposal it came from |

---

## Database Structure

### Invoices Table
```
{
  id: "UUID",
  invoice_number: "INV-20260327-0001",
  project_id: "project-id",
  proposal_id: "EXE-001",        ← NEW: Linked proposal
  total_amount: 500000,
  paid_amount: 200000,
  payment_status: "Partial",
  invoice_date: "2026-03-27"
}
```

---

## Benefits

✅ **Clear Traceability** - Know which proposal each invoice is for
✅ **Multi-Invoice Support** - Create invoices for different proposals
✅ **Better Organization** - Invoices grouped by proposal
✅ **Audit Trail** - Complete record of proposal-to-invoice path
✅ **Professional** - Shows invoice linking in PDF

---

## Invoice PDF Enhancement

The invoice PDF now includes proposal reference:
```
INVOICE DETAILS
  Invoice Number: INV-20260327-0001
  Linked Proposal: EXE-001
  Invoice Date: 27/03/2026
  Project Name: Solar Panel Installation
  ...
```

---

## Workflow Example

### Scenario: Multiple Projects with Multiple Invoices

**Project A**
```
Execution Proposals:
  • EXE-001 (10 kW, $500k)
  • EXE-002 (5 kW, $250k)

Invoices:
  • INV-A-001 → Linked to EXE-001 ($500k)
  • INV-A-002 → Linked to EXE-002 ($250k)
```

**Project B**
```
Execution Proposals:
  • EXE-003 (15 kW, $750k)

Invoices:
  • INV-B-001 → Linked to EXE-003 ($750k)
```

Each invoice clearly shows which proposal it's connected to!

---

## Technical Details

### Changes Made

1. **UnifiedProposalPanel.jsx**
   - Added proposal selection dropdown
   - Shows only EXE proposals
   - Dropdown before "Generate Invoice" button
   - Button disabled until proposal selected
   - Updated invoice display to show linked proposal

2. **invoiceService.js** (existing)
   - Already accepts proposal_id parameter
   - Stores link in database

3. **Invoice Display**
   - Shows proposal_number in invoice list
   - Uses proposal lookup to display reference

---

## Testing Checklist

- [ ] Go to project in EXE state
- [ ] See proposal dropdown (shows EXE proposals)
- [ ] Create multiple EXE proposals
- [ ] Select different proposal from dropdown
- [ ] Click "Generate Invoice"
- [ ] Check invoice appears with "Linked to: EXE-XXX"
- [ ] Download invoice PDF
- [ ] Verify PDF shows linked proposal
- [ ] Create another invoice with different proposal
- [ ] Verify both invoices show correct linked proposals

---

## Summary

✅ Invoices are now **linked to specific Execution proposals**
✅ User selects proposal from **dropdown before generating invoice**
✅ Invoice displays **which proposal it's linked to**
✅ PDF includes **proposal reference information**
✅ Supports **multiple invoices per project** with different proposals

**Next**: Test the dropdown and invoice linking in your app!

