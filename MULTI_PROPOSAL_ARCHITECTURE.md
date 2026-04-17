# Multi-Proposal Architecture Plan

## Current Issue
The app treats each project as having a single proposal at each stage. We need to support:
- **Multiple Estimation Proposals** per project (client can request different quotes)
- **Multiple Negotiation Proposals** per estimation (negotiate different options)
- **Unique reference numbers** for each proposal
- **Only selected tasks** carry forward through the workflow

---

## Database Schema Changes Required

### 1. Create `proposal_references` Table
Tracks unique proposals with reference numbers

```sql
CREATE TABLE IF NOT EXISTS public.proposal_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  proposal_number TEXT UNIQUE NOT NULL,
  proposal_type TEXT NOT NULL CHECK (proposal_type IN ('Estimation', 'Negotiation', 'Execution')),
  parent_proposal_id UUID REFERENCES public.proposal_references(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX idx_proposal_refs_project_id ON public.proposal_references(project_id);
CREATE INDEX idx_proposal_refs_type ON public.proposal_references(proposal_type);
```

### 2. Modify `project_estimates` Table
Store selected stages and link to proposal reference

```sql
ALTER TABLE public.project_estimates
ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposal_references(id),
ADD COLUMN IF NOT EXISTS selected_stage_ids TEXT; -- JSON array of stage IDs

-- Example: selected_stage_ids = "[1, 2, 3, 5]"
```

### 3. Modify `project_invoices` Table
Link invoices to proposal references

```sql
ALTER TABLE public.project_invoices
ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposal_references(id);
```

---

## Data Flow - Multi-Proposal System

```
PROJECT
  ├─ Estimation Proposal #1 (EST-20260324-0001)
  │  ├─ Selected Stages: [1, 2, 3]
  │  ├─ Grand Total: ₹50,000
  │  └─ Stage → Negotiation Proposal #1 (NEG-20260324-0001)
  │     ├─ Parent: EST-20260324-0001
  │     ├─ Modified Stages: [1, 2, 3] (with edits)
  │     ├─ Grand Total: ₹45,000
  │     └─ Stage → Execution/Invoice
  │
  └─ Estimation Proposal #2 (EST-20260324-0002)
     ├─ Selected Stages: [1, 2, 3, 4, 5]
     ├─ Grand Total: ₹75,000
     └─ Stage → (Can be negotiated separately)
```

---

## Implementation Steps

### Step 1: Update Database Schema
```sql
-- Create proposal_references table
CREATE TABLE IF NOT EXISTS public.proposal_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  proposal_number TEXT UNIQUE NOT NULL,
  proposal_type TEXT NOT NULL CHECK (proposal_type IN ('Estimation', 'Negotiation', 'Execution')),
  parent_proposal_id UUID REFERENCES public.proposal_references(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

CREATE INDEX idx_proposal_refs_project_id ON public.proposal_references(project_id);
CREATE INDEX idx_proposal_refs_type ON public.proposal_references(proposal_type);

-- Update project_estimates
ALTER TABLE public.project_estimates
ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposal_references(id),
ADD COLUMN IF NOT EXISTS selected_stage_ids TEXT;

-- Update project_invoices
ALTER TABLE public.project_invoices
ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.proposal_references(id);

-- Update projects table to remove old state tracking (optional)
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS project_state;
-- ALTER TABLE public.projects DROP COLUMN IF EXISTS stage;
```

### Step 2: Create Proposal Reference Service
File: `src/lib/proposalReferenceService.js`

```javascript
import { supabase } from './supabase'

function generateProposalNumber(proposalType) {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000)
  const typeCode = proposalType === 'Estimation' ? 'EST' :
                   proposalType === 'Negotiation' ? 'NEG' : 'EXE'
  return `${typeCode}-${year}${month}${day}-${String(random).padStart(4, '0')}`
}

export async function createProposalReference(projectId, proposalType, parentProposalId = null) {
  try {
    const proposalNumber = generateProposalNumber(proposalType)

    const { data, error } = await supabase
      .from('proposal_references')
      .insert([{
        project_id: projectId,
        proposal_number: proposalNumber,
        proposal_type: proposalType,
        parent_proposal_id: parentProposalId,
        status: 'Draft',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Error creating proposal reference:', err)
    return { success: false, error: err.message }
  }
}

export async function getProposalsByProject(projectId) {
  try {
    const { data, error } = await supabase
      .from('proposal_references')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching proposals:', err)
    return []
  }
}
```

### Step 3: Update EstimationPanel
- Create proposal reference when generating proposal
- Store selected_stage_ids in project_estimates
- Pass proposal_id when moving to negotiation

### Step 4: Update NegotiationPanel
- Load from specific estimation proposal
- Show parent proposal reference
- Link to parent when creating negotiation proposal
- Add PDF download with proposal number

### Step 5: Update ExecutionPanel
- Load from negotiation proposal
- Show full proposal hierarchy
- Add PDF download

### Step 6: Create Proposal History Component
Show all proposals for a project:
- EST-20260324-0001 (₹50,000) → NEG-20260324-0001 (₹45,000)
- EST-20260324-0002 (₹75,000) → [No negotiation yet]

---

## Key Changes to Components

### EstimationPanel.jsx
```javascript
// When generating proposal
const handleGenerateProposal = async () => {
  // Create proposal reference
  const proposalRef = await createProposalReference(projectId, 'Estimation')

  // Create estimate with selected stages and proposal reference
  const estimate = await createEstimate({
    project_id: projectId,
    proposal_id: proposalRef.data.id,
    selected_stage_ids: JSON.stringify([...selectedStages]),
    state: 'Estimation',
    grand_total: grandTotal
  })

  // PDF download includes proposal reference number
  downloadProposalPDF({
    ...project,
    proposal_number: proposalRef.data.proposal_number,
    selected_stages: selectedStages
  }, selectedStages, stages, grandTotal)
}

// When moving to negotiation
const handleMoveToNegotiation = async () => {
  // Create new negotiation proposal reference (child of current)
  const negotiationRef = await createProposalReference(
    projectId,
    'Negotiation',
    estimate.proposal_id  // Parent proposal ID
  )

  // Create new estimate in Negotiation state
  await createEstimate({
    project_id: projectId,
    proposal_id: negotiationRef.data.id,
    selected_stage_ids: estimate.selected_stage_ids, // Inherit from parent
    state: 'Negotiation',
    grand_total: grandTotal
  })
}
```

### NegotiationPanel.jsx
- Load tasks only for selected stages from proposal
- Show parent proposal info
- PDF download includes proposal number and parent reference

### ExecutionPanel.jsx
- Show proposal chain: EST → NEG → EXE
- PDF download includes full proposal hierarchy
- Invoice links to proposal reference

---

## Summary of Changes

| Feature | Before | After |
|---------|--------|-------|
| Proposals per project | 1 | Multiple |
| Task selection | All tasks always | Only selected stages carried forward |
| Proposal tracking | Only current state | Full proposal history with references |
| PDF reference | Invoice number only | Unique proposal reference (EST-xxx, NEG-xxx, EXE-xxx) |
| Proposal hierarchy | N/A | Parent-child relationships tracked |

---

## Implementation Priority

1. ✅ Database schema (create proposal_references table)
2. ✅ Proposal reference service (generate unique numbers)
3. ⏳ Update EstimationPanel (create references, store selections)
4. ⏳ Update NegotiationPanel (load from parent, create child refs)
5. ⏳ Update ExecutionPanel (show hierarchy, download PDFs)
6. ⏳ Create proposal history view

---

## Benefits

✅ Users can create multiple quotes for different scopes
✅ Proposals are tracked with unique reference numbers
✅ Full audit trail of proposal evolution
✅ Clean separation between proposals
✅ Easy to compare different estimates
✅ Professional PDF with proposal tracking
