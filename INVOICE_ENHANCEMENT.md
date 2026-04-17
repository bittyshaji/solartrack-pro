# Enhanced Invoice PDF Format
**Date**: March 27, 2026
**Feature**: Comprehensive invoice with project specs and stage breakdown
**Status**: ✅ Complete

---

## What's Included in Invoice PDF

### 1. **Project Information**
- Project name and code
- Capacity (kW)
- Location
- Project description

### 2. **Customer Billing Information**
- Customer name
- Contact number
- Email address

### 3. **Stage-Wise Breakdown** ✨ NEW
For each stage with tasks:
- **Stage Name** (with light background header)
- **Tasks in that stage:**
  - Task name
  - Quantity × Unit Cost = Total Cost
- **Stage subtotal**

Example:
```
SITE SURVEY
  • Site Survey: 1 × ₹5,000 = ₹5,000
  • Soil Testing: 1 × ₹10,000 = ₹10,000
  • Measurement & Design: 1 × ₹8,000 = ₹8,000
Stage Total: ₹23,000

KSEB APPLICATION
  • KSEB Documentation: 1 × ₹2,000 = ₹2,000
  • Form Submission: 1 × ₹1,500 = ₹1,500
Stage Total: ₹3,500
```

### 4. **Payment Summary**
- Total Invoice Amount
- Amount Already Paid
- Outstanding Balance

### 5. **Payment Terms**
- Payment deadline (7 days)
- Bank transfer instructions reference
- Late payment policy
- GST information
- Invoice reference for payment

### 6. **Professional Formatting**
- Blue header with invoice number and date
- Color-coded sections (light backgrounds)
- Proper spacing and alignment
- Page breaks for long documents
- Footer with company details and generation date

---

## How to Download

### Step 1: Move to Execution State
```
Go to Project → Click "Move to Execution" button → EXE state
```

### Step 2: Create Execution Proposal
```
1. Confirm project details
2. Click "Generate Proposal"
3. System creates execution proposal
```

### Step 3: Create Invoice
```
1. Scroll to bottom of EXE panel
2. Click "Create Invoice" button
3. System generates invoice number (INV-YYYYMMDD-XXXX)
```

### Step 4: Download Invoice
```
1. Find the invoice in "Invoices" section
2. Click blue "Download" button
3. PDF file downloads as: Invoice_[InvoiceNumber]_[Date].pdf
```

---

## Invoice PDF Structure

```
┌─────────────────────────────────────┐
│         INVOICE HEADER              │
│  Invoice #: INV-20260327-0001       │
│  Date: 27/03/2026                   │
└─────────────────────────────────────┘

PROJECT INFORMATION
  • Project Name: Solar Panel Installation
  • Project Code: SOL-001
  • Capacity: 10 kW
  • Location: Kochi, Kerala
  • Description: Grid-connected solar installation

BILL TO
  • Name: John Doe
  • Contact: +91 9876543210
  • Email: john@example.com

PROJECT STAGES & SERVICES BREAKDOWN

STAGE 1: SITE SURVEY
  • Site Survey: 1 × ₹5,000 = ₹5,000
  • Measurement: 1 × ₹3,000 = ₹3,000
Stage Total: ₹8,000

STAGE 2: KSEB APPLICATION
  • Documentation: 1 × ₹2,000 = ₹2,000
Stage Total: ₹2,000

... (all stages)

PAYMENT SUMMARY
  Total Amount:      ₹500,000
  Paid Amount:       ₹200,000
  Outstanding:       ₹300,000

PAYMENT TERMS & CONDITIONS
  • Payment within 7 days
  • Bank transfer details provided separately
  • Late payment charges apply
  • GST included in total
  • Include invoice number in reference

Footer: Invoice number, generation date
```

---

## Features

| Feature | Details |
|---------|---------|
| **Project Details** | Name, code, capacity, location, description |
| **Customer Info** | Name, contact, email |
| **Stage Breakdown** | Each stage with all its tasks |
| **Task Details** | Quantity, unit cost, line total |
| **Stage Totals** | Subtotal for each stage |
| **Payment Info** | Total, paid, outstanding amounts |
| **Professional Look** | Color-coded headers, proper spacing |
| **Multi-page** | Automatic page breaks for long invoices |
| **Date Tracking** | Invoice generation date |
| **Reference** | Invoice number in filename and footer |

---

## Example Invoice

When you download an invoice for a 10 kW solar project with 10 stages, you'll get:

**File Name**: `Invoice_INV-20260327-0001_20260327.pdf`

**Content**:
- Header: Professional blue background with invoice details
- Project info: Name, code, 10 kW capacity, location, description
- Customer: Billing address and contact
- Breakdown: All 10 stages with their tasks:
  - Stage 1: Site Survey (11 tasks)
  - Stage 2: KSEB Application (10 tasks)
  - ... up to Stage 10: Commissioning (12 tasks)
- Each stage shows:
  - Task names with quantities and costs
  - Stage subtotal
- Summary: Total invoice amount, paid, outstanding
- Terms: Payment terms and conditions
- Professional footer with details

---

## Testing Checklist

- [ ] Go to a project in EXE state
- [ ] Create execution proposal
- [ ] Create invoice
- [ ] Click "Download" button
- [ ] Open downloaded PDF
- [ ] Verify project specs are shown
- [ ] Verify all stages are listed
- [ ] Verify each stage has its tasks
- [ ] Verify costs are calculated correctly
- [ ] Verify payment summary matches
- [ ] Verify footer has invoice number and date

---

## Summary

The invoice now includes:
✅ Complete project specifications
✅ Detailed stage-wise breakdown
✅ All tasks with quantities and costs
✅ Stage subtotals
✅ Professional formatting
✅ Payment summary
✅ Terms and conditions

**Next**: Test the enhanced invoice and let me know if you'd like any modifications!

