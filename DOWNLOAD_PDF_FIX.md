# Download PDF Button Fix
**Date**: March 27, 2026
**Status**: ✅ Fixed

---

## Issue Identified

The "Download PDF" button on the project detail page was not working because it was calling the PDF generation function with incorrect parameters.

### Root Cause

**File**: `src/components/UnifiedProposalPanel.jsx`

The download button was calling:
```javascript
onClick={() => downloadProposalPDF(proposalNumber, projectData)}
```

But the `downloadProposalPDF` function signature requires **4 parameters**:
```javascript
export function downloadProposalPDF(project, selectedStageIds, stages, grandTotal)
```

**Problem**: Only 2 arguments were provided, and the first argument `proposalNumber` (a string) was being passed instead of the `project` object.

---

## Fixes Applied

### Fix 1: UnifiedProposalPanel.jsx (Lines 241-249)

**Added helper function** to determine which stages to include in the PDF:

```javascript
const getStageIdsForDownload = () => {
  // In estimation state, use selected stages
  // In negotiation/execution, use all stages that have tasks
  if (normalizedState === 'estimation') {
    return Array.from(selectedStages)
  } else {
    return stages.filter(s => s.tasks && s.tasks.length > 0).map(s => s.id)
  }
}
```

**Updated download button** (3 instances for EST, NEG, EXE states):

```javascript
onClick={() => downloadProposalPDF(projectData, getStageIdsForDownload(), stages, calculateGrandTotal())}
```

**What this does:**
- Passes the correct `projectData` object instead of proposal number
- Gets the appropriate stage IDs based on the current state
- Passes all loaded stages with their tasks
- Calculates and passes the grand total

---

### Fix 2: ProposalDownloadList.jsx (Lines 12-14, 38-83)

**Added imports** for loading proposal data:
```javascript
import { loadParentProposalData } from '../lib/proposalDataService'
import { getAllStageTasksGrouped, calculateStageTotalCost } from '../lib/stageTaskService'
import { PROJECT_STAGES } from '../lib/projectService'
```

**Rewrote handleDownload function** to properly fetch and prepare data:

```javascript
const handleDownload = async (proposal) => {
  // Load the proposal data with stages and total
  const proposalData = await loadParentProposalData(projectId, proposal.proposal_type)

  // Load all stages for the project
  const groupedTasks = await getAllStageTasksGrouped(projectId)

  // Build stages array with tasks
  const stagesWithTasks = PROJECT_STAGES.map(stage => ({
    ...stage,
    tasks: groupedTasks[stage.id] || [],
    total: calculateStageTotalCost(groupedTasks[stage.id] || [])
  }))

  // Calculate grand total
  const grandTotal = stagesWithTasks.reduce((sum, stage) => {
    const stageTotal = (stage.tasks || []).reduce((s, task) => s + (task.quantity * task.unit_cost), 0)
    return sum + stageTotal
  }, 0)

  // Get stage IDs that have tasks
  const stageIdsWithTasks = stagesWithTasks
    .filter(s => s.tasks && s.tasks.length > 0)
    .map(s => s.id)

  // Call with correct parameters
  downloadProposalPDF(project, stageIdsWithTasks, stagesWithTasks, grandTotal)
}
```

**What this does:**
- Loads the actual proposal data from the database
- Fetches all stages and their tasks
- Calculates the correct grand total
- Passes all required parameters to the PDF generation function

---

## How It Works Now

### Estimation State
1. User creates a proposal with selected stages
2. User clicks "Download PDF"
3. Button passes selected stage IDs to PDF generator
4. PDF includes only the selected stages with their tasks and costs

### Negotiation State
1. User creates a negotiation proposal
2. User clicks "Download PDF"
3. Button passes all stages with tasks to PDF generator
4. PDF includes all stages with current tasks and costs

### Execution State
1. User creates an execution proposal
2. User clicks "Download PDF"
3. Button passes all stages with tasks to PDF generator
4. PDF includes all stages with execution-phase tasks

---

## Testing the Fix

### Quick Test
1. Open a project in the app
2. Go to Estimation panel
3. Select some stages and create a proposal
4. Click "Download PDF" button
5. File should download as `Proposal_[ProjectName]_[Date].pdf`

### Verify Download Content
The PDF should contain:
- ✅ Project information (name, code, capacity, etc.)
- ✅ Selected stages with tasks
- ✅ Quantities and unit costs
- ✅ Calculated totals per stage
- ✅ Grand total at bottom
- ✅ Professional formatting with blue header
- ✅ Terms & conditions
- ✅ Next steps

### From Proposal History
1. Go to a project
2. Scroll to "All Proposals" section
3. Click "Download" on any proposal
4. File should download with correct data

---

## Files Modified

- ✅ `src/components/UnifiedProposalPanel.jsx` - Added helper function, fixed download calls
- ✅ `src/components/ProposalDownloadList.jsx` - Added imports, rewrote handleDownload logic

## What Changed

**Before**: Download button was broken due to wrong function parameters
**After**: Download button now correctly passes all required data to PDF generator

---

## Status

✅ **Ready for Testing**

The download PDF functionality should now work correctly across all three project states:
- Estimation (EST)
- Negotiation (NEG)
- Execution (EXE)

---

**Note**: If you encounter any issues with the PDF download, check the browser console (F12) for error messages.
