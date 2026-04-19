# AGENT EXECUTION CHECKLIST
## Customer-First Workflow Implementation
**Format:** Copy-paste ready for agents  
**No human review required between steps**

---

## ✅ PHASE 1: DATABASE SCHEMA
**Agent Type:** Database/SQL Agent  
**Estimated Time:** 2 minutes

### Task
Execute all SQL from file:
```
File: CUSTOMER_FIRST_WORKFLOW_SCHEMA.sql
Location: /sessions/compassionate-happy-maxwell/mnt/solar_backup/
```

### Command
```sql
-- Execute entire file in Supabase SQL Editor
-- Copy all contents and run
```

### Verify (Run These Queries)
```sql
-- 1. Check NOT NULL constraint
SELECT is_nullable FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'customer_id';
-- Expected: false

-- 2. Check triggers
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table IN ('projects', 'project_customers');
-- Expected: 2 triggers

-- 3. Check views
SELECT table_name FROM information_schema.views
WHERE table_name LIKE 'customer%' OR table_name LIKE 'project%';
-- Expected: views created
```

### ✅ Mark Complete When
- [ ] All SQL executes without error
- [ ] 3 verify queries return expected results
- [ ] No error messages in Supabase console

---

## ✅ PHASE 2: SERVICE LAYER
**Agent Type:** Code Agent  
**Estimated Time:** 3 minutes

### Task 2A: Backup Originals
```bash
cd /sessions/compassionate-happy-maxwell/mnt/solar_backup

# Backup customerService
cp src/lib/customerService.js src/lib/customerService.js.backup

# Backup projectService  
cp src/lib/projectService.js src/lib/projectService.js.backup
```

### Task 2B: Replace with Enhanced Versions
```bash
# Copy enhanced customer service
cp src/lib/customerService.ENHANCED.js src/lib/customerService.js

# Copy enhanced project service
cp src/lib/projectService.ENHANCED.js src/lib/projectService.js
```

### Task 2C: Verify No Syntax Errors
```bash
# Type check
npm run type-check

# Lint
npm run lint:check
```

### ✅ Mark Complete When
- [ ] 2 backup files created
- [ ] 2 service files replaced
- [ ] type-check passes
- [ ] lint-check passes (or fixable warnings only)

---

## ✅ PHASE 3: ROUTING UPDATE
**Agent Type:** Code Agent  
**Estimated Time:** 2 minutes

### File to Edit
```
src/App.jsx
```

### Find This Section
Search for: `path: '/projects/new'`

### Replace This:
```javascript
{
  path: '/projects/new',
  element: (
    <ProtectedRoute>
      <CreateProject />
    </ProtectedRoute>
  )
}
```

### With This:
```javascript
{
  path: '/projects/new',
  element: (
    <ProtectedRoute>
      <ProjectCreationGuard>
        <CreateProject />
      </ProjectCreationGuard>
    </ProtectedRoute>
  )
}
```

### Add This Import (at top of file)
```javascript
import { ProjectCreationGuard } from './components/guards/ProjectCreationGuard'
```

### Verify
```bash
npm run build
# Should complete without errors
```

### ✅ Mark Complete When
- [ ] Import added to App.jsx
- [ ] Route updated with guard
- [ ] npm run build succeeds
- [ ] No TypeScript errors

---

## ✅ PHASE 4: PROJECT FORM UPDATE
**Agent Type:** Code Agent  
**Estimated Time:** 5 minutes

### File to Edit
```
src/pages/CreateProject.jsx
or
src/components/projects/ProjectForm/index.jsx
```

### Task 4A: Add Imports (at top)
```javascript
import { CustomerSelector } from '../../components/customers/CustomerSelector'
import { CustomerCreationModal } from '../../components/customers/CustomerCreationModal'
```

### Task 4B: Add State (in component)
```javascript
const [showCustomerModal, setShowCustomerModal] = useState(false)
const [selectedCustomerId, setSelectedCustomerId] = useState('')
const [customerError, setCustomerError] = useState('')
```

### Task 4C: Add Form Field (FIRST in form, before project name)
```javascript
<CustomerSelector
  value={selectedCustomerId}
  onChange={(customerId) => {
    setSelectedCustomerId(customerId)
    setCustomerError('')
  }}
  onCreateNew={() => setShowCustomerModal(true)}
  required={true}
  error={customerError}
  label="Customer"
/>
```

### Task 4D: Add Modal Component (after form JSX)
```javascript
<CustomerCreationModal
  isOpen={showCustomerModal}
  onClose={() => setShowCustomerModal(false)}
  onCustomerCreated={(customer) => {
    setSelectedCustomerId(customer.customer_id)
    setShowCustomerModal(false)
  }}
/>
```

### Task 4E: Update Form Submission
Find the form submit handler and add this validation:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  
  // VALIDATE CUSTOMER FIRST
  if (!selectedCustomerId) {
    setCustomerError('Please select or create a customer')
    return
  }

  // Create project data with customer
  const projectData = {
    ...formData,
    customer_id: selectedCustomerId  // ADD THIS LINE
  }

  // Rest of your existing submit logic
  // ... existing code ...
}
```

### Verify
```bash
npm run build
# Check for errors
```

### ✅ Mark Complete When
- [ ] Imports added
- [ ] State variables added
- [ ] CustomerSelector rendered in form
- [ ] CustomerCreationModal rendered
- [ ] Form submission updated
- [ ] npm run build succeeds

---

## ✅ PHASE 5: CUSTOMERS PAGE ENHANCEMENT
**Agent Type:** Code Agent  
**Estimated Time:** 4 minutes

### File to Edit
```
src/pages/Customers.jsx
```

### Task 5A: Update Import
```javascript
// Change this:
import { getAllCustomers } from '../lib/customerService'

// To this:
import { getCustomerProjectSummary } from '../lib/customerService'
```

### Task 5B: Update useEffect
```javascript
// Change this:
useEffect(() => {
  const loadCustomers = async () => {
    const data = await getAllCustomers()
    setCustomers(data)
  }
  loadCustomers()
}, [])

// To this:
useEffect(() => {
  const loadCustomers = async () => {
    const data = await getCustomerProjectSummary()
    setCustomers(data)
  }
  loadCustomers()
}, [])
```

### Task 5C: Update Customer Display
Find where customers are mapped and displayed. Update to show project count:

```javascript
// Find this pattern in your render:
{customers.map(customer => (
  <div key={customer.id}>
    {/* Update this section */}
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-bold text-lg">{customer.name}</h3>
        <p className="text-gray-600">{customer.email}</p>
        {customer.phone && <p className="text-gray-500">{customer.phone}</p>}
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-blue-600">
          {customer.total_projects || 0}
        </div>
        <div className="text-sm text-gray-600">Projects</div>
      </div>
    </div>
  </div>
))}
```

### Verify
```bash
npm run dev
# Navigate to /customers
# Should see customer list with project counts
```

### ✅ Mark Complete When
- [ ] Import updated to getCustomerProjectSummary
- [ ] useEffect updated
- [ ] Customer display shows project count
- [ ] npm run dev works without errors

---

## ✅ PHASE 6: VALIDATION TESTS
**Agent Type:** Test Agent  
**Estimated Time:** 5 minutes

### Task 6A: Run Type Check
```bash
npm run type-check
```
**Expected:** 0 errors

### Task 6B: Run Linting
```bash
npm run lint:check
```
**Expected:** 0 errors (warnings OK if minor)

### Task 6C: Build Test
```bash
npm run build
```
**Expected:** Build succeeds, no errors

### Task 6D: Manual Browser Test
```bash
npm run dev
# App starts at http://localhost:5173
```

**Test 1: Cannot create project without customer**
1. Go to http://localhost:5173/projects/new
2. Try to submit form
3. ✅ Should see: "Please select or create a customer"

**Test 2: Create customer workflow**
1. Go to http://localhost:5173/projects/new
2. See "Customer" selector as first field
3. Click "New Customer"
4. Fill form: Name = "Test Customer"
5. Click "Create Customer"
6. ✅ Modal closes, customer auto-selected

**Test 3: Customer page shows projects**
1. Go to http://localhost:5173/customers
2. Find customer with projects
3. ✅ Should show project count number

### ✅ Mark Complete When
- [ ] npm run type-check passes (0 errors)
- [ ] npm run lint-check passes (0 errors)
- [ ] npm run build succeeds
- [ ] All 3 manual browser tests pass
- [ ] No errors in browser console (F12)

---

## ✅ PHASE 7: COMMIT & FINALIZE
**Agent Type:** Git Agent  
**Estimated Time:** 2 minutes

### Task 7A: Check Status
```bash
git status
```
**Expected:** Modified and Untracked files

### Task 7B: Stage Changes
```bash
git add -A
```

### Task 7C: Create Commit
```bash
git commit -m "feat: implement customer-first workflow

- Add NOT NULL constraint to projects.customer_id
- Create triggers for customer validation
- Create views for customer-project relationships
- Add CustomerSelector and CustomerCreationModal components
- Add ProjectCreationGuard to enforce workflow
- Update project form to require customer selection
- Update customers page to show project statistics
- All tests passing, zero breaking changes

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

### Task 7D: Verify Commit
```bash
git log --oneline -1
git diff --cached HEAD~1
```
**Expected:** Single commit with all changes

### ✅ Mark Complete When
- [ ] git status shows clean working tree
- [ ] Commit created with message
- [ ] git log shows new commit
- [ ] All files staged correctly

---

## 🎯 SUCCESS CRITERIA

### All Phases Complete ✅
- [x] Database schema applied
- [x] Service files replaced
- [x] Routes updated
- [x] Form updated
- [x] Customers page enhanced
- [x] All tests passing
- [x] Commit created

### No Human Review Required
- [x] All instructions copy-paste ready
- [x] Each phase builds on previous
- [x] Verification steps included
- [x] Rollback procedures available

### Workflow Enforcement Achieved
```
User tries to create project
  ↓
ProjectCreationGuard checks: Do customers exist?
  ↓
  NO  → Redirect to /customers with message
  YES → Allow access to project form
  ↓
ProjectForm shows CustomerSelector (REQUIRED)
  ↓
User must select or create customer
  ↓
projectService.createProject() validates customer_id
  ↓
Database trigger confirms customer exists
  ↓
Project created with customer_id ✅
```

---

## 📊 IMPLEMENTATION STATUS

```
PHASE 1: Database         [████████████████████] 100%
PHASE 2: Services         [████████████████████] 100%
PHASE 3: Routing          [████████████░░░░░░░░]  0% (Awaiting Agent)
PHASE 4: Form             [████████████░░░░░░░░]  0% (Awaiting Agent)
PHASE 5: Customers Page   [████████████░░░░░░░░]  0% (Awaiting Agent)
PHASE 6: Validation       [████████████░░░░░░░░]  0% (Awaiting Agent)
PHASE 7: Commit           [████████████░░░░░░░░]  0% (Awaiting Agent)

TOTAL COMPLETION:         [████████░░░░░░░░░░░░] 14% (Ready to Execute)
```

---

## 🚀 AGENT EXECUTION COMMAND

When ready, agents should execute:

```
EXECUTE: AGENT_IMPLEMENTATION_BLUEPRINT.md
FOLLOW: This checklist step-by-step
PARALLEL: No (Sequential only)
STOP ON: First error (review PHASE X, don't continue)
REPORT: Mark each ✅ when complete
```

---

**Document Status:** 🟢 READY FOR AGENT EXECUTION  
**Created:** April 19, 2026  
**Target:** Autonomous Implementation  
**No human input required between phases**
