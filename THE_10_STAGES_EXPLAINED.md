# ☀️ The 10 Stages of Your Solar Project

These are the 10 workflow stages in your solar installation system. Each stage has multiple tasks that need to be estimated, negotiated, and executed.

---

## Stage Breakdown

### 1️⃣ **Site Survey**
- Initial assessment of the property
- Solar potential evaluation
- Structural checks
- Example tasks: Site inspection, measurements, photography

### 2️⃣ **KSEB Application**
- Kerala State Electricity Board application
- Documentation and permits
- Example tasks: Form filing, document submission, approval follow-up

### 3️⃣ **Mounting Work**
- Install metal frames/structures
- Roof preparation
- Example tasks: Frame fabrication, roof mounting, weatherproofing

### 4️⃣ **Panel Installation**
- Install solar panels on mounts
- Electrical connections between panels
- Example tasks: Panel placement, wiring connections, testing

### 5️⃣ **Wiring & Inverter**
- Complete electrical wiring
- Install inverter (converts DC to AC)
- Example tasks: Wire routing, inverter installation, connections

### 6️⃣ **Earthing & Safety**
- Ground the system
- Install safety switches and breakers
- Example tasks: Earthing electrode, lightning protection, safety switches

### 7️⃣ **KSEB Inspection**
- Utility board inspection
- Final approval from KSEB
- Example tasks: Schedule inspection, coordinate with KSEB, get approval

### 8️⃣ **Net Meter**
- Install net metering equipment
- Measure export/import of electricity
- Example tasks: Net meter installation, calibration, setup

### 9️⃣ **Commissioning**
- Final system startup and testing
- Training and handover to customer
- Example tasks: System testing, performance checks, customer training

### 🔟 **Completed**
- Project finished and approved
- Warranty and ongoing monitoring
- Example tasks: Final documentation, warranty setup, monitoring tools

---

## Why All 10 Stages Always Visible?

**Your requirement:**
> "ALL STAGES ARE VISIBLE but with quantities and values"

**What this means:**
1. When you create an **Estimation** proposal, you add tasks to certain stages (e.g., Site Survey, Mounting Work)
2. When you move to **Negotiation**, ALL 10 stages appear
   - Stages with tasks show those tasks with their quantities
   - Stages without tasks show with quantity = 0
3. When you move to **Execution**, ALL 10 stages appear again
   - You can see and modify everything
   - Quantities from Negotiation carry forward

---

## Visual Example

### You Create Estimation with:
```
Stage 1 (Site Survey):
  - Task A: Quantity = 2, Cost = ₹5000
  - Task B: Quantity = 0, Cost = ₹3000

Stage 3 (Mounting Work):
  - Task C: Quantity = 1, Cost = ₹2000
```

### In Negotiation, You See ALL 10 Stages:
```
✅ Stage 1 (Site Survey)
   - Task A: Quantity = 2 ← From Estimation
   - Task B: Quantity = 0

✅ Stage 2 (KSEB Application)
   - Task D: Quantity = 0
   - Task E: Quantity = 0

✅ Stage 3 (Mounting Work)
   - Task C: Quantity = 1 ← From Estimation
   - Task F: Quantity = 0

✅ Stage 4 (Panel Installation)
   - All tasks: Quantity = 0

✅ Stage 5 (Wiring & Inverter)
   - All tasks: Quantity = 0

✅ Stage 6 (Earthing & Safety)
   - All tasks: Quantity = 0

✅ Stage 7 (KSEB Inspection)
   - All tasks: Quantity = 0

✅ Stage 8 (Net Meter)
   - All tasks: Quantity = 0

✅ Stage 9 (Commissioning)
   - All tasks: Quantity = 0

✅ Stage 10 (Completed)
   - All tasks: Quantity = 0
```

**Key Point:** You can now:
- Edit quantities in existing stages
- Add new tasks to any stage (including Stage 2, 4, 5, etc.)
- Only tasks with Quantity > 0 go in the proposal

---

## Testing with All 10 Stages

### Test Checklist:
- [ ] Create Estimation with tasks in stages 1 and 3
- [ ] Move to Negotiation
- [ ] Verify you see **all 10 stages** on the left
- [ ] Edit Stage 1: Change quantity from 2 to 3
- [ ] Edit Stage 2: Add a new task with quantity 1
- [ ] Create Negotiation proposal
- [ ] Move to Execution
- [ ] Verify you see **all 10 stages** again
- [ ] Verify Stage 1 shows qty=3 (from NEG, not 2 from EST)
- [ ] Verify Stage 2 shows the new task you added

---

## File Locations in Code

```
/src/lib/projectService.js (lines 31-42)
├─ PROJECT_STAGES array
├─ 10 stages defined
└─ Each with id and name
```

---

## Important Note

Previously, the system was filtering stages. So if you created an EST proposal with only stages 1 and 3, the Negotiation panel would show **only stages 1 and 3** (missing 2, 4, 5, 6, 7, 8, 9, 10).

**Now fixed:** All 10 stages always visible, regardless of which ones had quantities in the previous state!

---

**Ready to test? Follow the guide in: TESTING_CORRECTED_MODEL.md**
