# How to Use Project Features

## Feature 1: Change Project Status (Planning → In Progress → etc.)

### Steps:
1. **Open a project** from the Projects list (click on project name)
2. **Click "Edit Project"** button (top right)
3. **Change the Status dropdown:**
   - Planning
   - In Progress ✅ (now available!)
   - On Hold
   - Completed
   - Cancelled
4. **Click "Save"** to save the change

**When to use**: When the overall project progress changes (started work, paused work, etc.)

---

## Feature 2: Move Through Workflow States (Estimation → Negotiation → Execution)

This is DIFFERENT from status! Workflow states define the project phase.

### The Workflow States:
```
Estimation (Initial)
    ↓
Negotiation (After creating estimate)
    ↓
Execution (After negotiation)
```

### How It Works:

#### Phase 1: ESTIMATION (Initial State)
1. **Project starts in "Estimation" state**
2. You see the **Estimation Panel** with:
   - Option to create estimation proposals
   - Edit quantities and costs
   - See selected tasks

3. **To move to next phase:**
   - Create at least ONE estimation proposal
   - Click **"Move to Negotiation →"** button
   - Button is DISABLED until you create an estimate

#### Phase 2: NEGOTIATION
1. **After moving to Negotiation state**
2. You see the **Negotiation Panel** with:
   - Review estimation proposals
   - Create negotiation proposals
   - Compare different estimation options

3. **To move to next phase:**
   - Create a negotiation proposal
   - Click **"Move to Execution →"** button

#### Phase 3: EXECUTION
1. **After moving to Execution state**
2. You see the **Execution Panel** with:
   - Track project progress
   - Update work completion
   - Final delivery status

---

## Step-by-Step: Complete Workflow

### Step 1: Create a Project ✅
```
Go to /projects/create
Fill in project details
Project starts in: Status = "Planning", State = "Estimation"
```

### Step 2: Create an Estimation Proposal
1. **Open the project** you just created
2. **Look for the Estimation Panel** section
3. **Select tasks** from the 10 available stages
4. **Enter quantities and unit costs** for each task
5. **Click "Create Estimation Proposal"**
   - Generates proposal number: EST-20260324-XXXX

### Step 3: Enable "Move to Negotiation" Button
1. Once estimation proposal is created
2. **"Move to Negotiation →" button becomes ACTIVE** (green/orange)
3. **Click it** to transition to Negotiation phase

### Step 4: Negotiation Phase
1. **Review** the estimation proposal
2. **Create negotiation proposal** based on the estimation
3. **Compare different options** if needed
4. **Click "Move to Execution →"** button

### Step 5: Execution Phase
1. **Track project progress**
2. **Update completion** of tasks
3. **Mark project as complete**

---

## Troubleshooting

### "Move to Negotiation" Button is Disabled
**Cause**: No estimation proposal created yet

**Fix**:
1. Create an estimation proposal first
2. Select at least one task
3. Enter quantities and costs
4. Click "Create Estimation"
5. Button will become enabled

### Status Dropdown Shows Empty
**Cause**: Data not loaded

**Fix**:
1. Refresh the page
2. Click "Edit Project" again
3. Status should now show options

### Can't Save Project Status
**Cause**: Invalid status value

**Fix**:
1. Make sure you selected from dropdown (not typed)
2. Valid values are: Planning, In Progress, On Hold, Completed, Cancelled
3. Try again with a dropdown value

---

## Quick Reference

| Feature | Where | How | Purpose |
|---------|-------|-----|---------|
| **Status** | Project Detail → Edit | Dropdown select | Track overall project stage |
| **Workflow** | Project Detail → Workflow section | Buttons in panels | Progress through phases |
| **Estimation** | Estimation Panel | Create estimate button | Initial proposal |
| **Negotiation** | Negotiation Panel | Create proposal button | Refined proposal |
| **Execution** | Execution Panel | Update progress | Track completion |

---

## Example Timeline

```
Day 1: Create Project
├─ Status: Planning
└─ State: Estimation

Day 1-2: Estimation Phase
├─ Create estimation proposal
├─ Review with client
└─ Status can be changed to "In Progress"

Day 3-4: Negotiation Phase
├─ Click "Move to Negotiation →"
├─ Create negotiation proposal
├─ Finalize pricing
└─ Status: In Progress

Day 5+: Execution Phase
├─ Click "Move to Execution →"
├─ Start work
├─ Update progress
└─ Status: In Progress or Completed
```

---

## Pro Tips

✅ **Best Practices:**
- Create estimates before moving to negotiation
- Update project status as work progresses
- Use proposal history to track all versions
- Download PDFs of proposals for records
- Change status to "Completed" when project is done

❌ **Avoid:**
- Moving states without creating proposals
- Forgetting to update project status
- Creating multiple proposals for the same phase without reviewing
