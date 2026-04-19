# AGENT IMPLEMENTATION BLUEPRINT
## Customer-First Workflow for SolarTrack Pro
**Status:** Ready for Autonomous Agent Execution  
**Last Updated:** April 19, 2026

---

## EXECUTIVE SUMMARY FOR AGENTS

This is a **complete, self-contained implementation guide**. Agents should execute sequentially without human input.

### Core Requirement
**Customers MUST be created before projects. Every project MUST link to a customer.**

### Files Already Created
✅ `CUSTOMER_FIRST_WORKFLOW_IMPLEMENTATION.md` - Complete implementation specs  
✅ `CUSTOMER_FIRST_WORKFLOW_SCHEMA.sql` - Database changes  
✅ `src/lib/customerService.ENHANCED.js` - Enhanced customer service  
✅ `src/lib/projectService.ENHANCED.js` - Enhanced project service  
✅ `src/components/customers/CustomerSelector.jsx` - Customer dropdown  
✅ `src/components/customers/CustomerCreationModal.jsx` - Customer creation form  
✅ `src/components/guards/ProjectCreationGuard.jsx` - Route protection

### Files to Create/Modify (Agent Tasks)
- [ ] **PHASE 1:** Apply database schema (`CUSTOMER_FIRST_WORKFLOW_SCHEMA.sql`)
- [ ] **PHASE 2:** Replace service files with ENHANCED versions
- [ ] **PHASE 3:** Update routing in `App.jsx` to add ProjectCreationGuard
- [ ] **PHASE 4:** Update `CreateProject.jsx` to include CustomerSelector
- [ ] **PHASE 5:** Update `Customers.jsx` to show project statistics
- [ ] **PHASE 6:** Run validation tests

---

## PHASE 1: DATABASE SCHEMA EXECUTION

### Agent Task: Apply Database Schema
**Executor:** Database Agent  
**Tool:** Supabase SQL Console or PostgreSQL client  
**Duration:** < 2 minutes

**Steps:**
1. Read: `/sessions/compassionate-happy-maxwell/mnt/solar_backup/CUSTOMER_FIRST_WORKFLOW_SCHEMA.sql`
2. Execute all SQL statements in Supabase
3. Verify with validation queries at end of file
4. Log success: "✅ Database schema applied"

**Verification Queries to Run:**
```sql
-- Check NOT NULL constraint
SELECT column_name, is_nullable FROM information_schema.columns
WHERE table_name = 'projects' AND column_name = 'customer_id';

-- Check triggers exist
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'projects' OR event_object_table = 'project_customers';

-- Check indexes exist
SELECT indexname FROM pg_indexes
WHERE tablename IN ('projects', 'project_customers');
```

**Success Criteria:**
- ✅ NOT NULL constraint on projects.customer_id
- ✅ 2 triggers created (projects_customer_validation, prevent_customer_deletion)
- ✅ 4+ indexes created
- ✅ 2 views created (customer_project_summary, projects_with_customers)

---

## PHASE 2: SERVICE LAYER REPLACEMENT

### Agent Task: Replace Service Files

**Executor:** Code Agent  
**Tool:** Edit tool or Bash

#### 2.1 Replace customerService.js
```bash
# Backup original
cp src/lib/customerService.js src/lib/customerService.js.backup

# Replace with enhanced version
cp src/lib/customerService.ENHANCED.js src/lib/customerService.js
```

**Verify:** Run tests
```bash
npm test -- src/lib/__tests__/customerService.test.js
```

#### 2.2 Replace projectService.js
```bash
# Backup original
cp src/lib/projectService.js src/lib/projectService.js.backup

# Replace with enhanced version
cp src/lib/projectService.ENHANCED.js src/lib/projectService.js
```

**Verify:** Run tests
```bash
npm test -- src/lib/__tests__/projectService.test.js
```

**Success Criteria:**
- ✅ Services accept customer_id as required parameter
- ✅ createProject() throws error if customer_id missing
- ✅ validateCustomerExists() function exists
- ✅ getProjectsByCustomer() function exists

---

## PHASE 3: ROUTING & GUARDS INTEGRATION

### Agent Task: Update App.jsx Routes

**File:** `src/App.jsx`

**Changes to Make:**

1. **Add imports at top:**
```javascript
import { ProjectCreationGuard } from './components/guards/ProjectCreationGuard'
```

2. **Find route for `/projects/new` and wrap with guard:**

**BEFORE:**
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

**AFTER:**
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

**Success Criteria:**
- ✅ ProjectCreationGuard wraps CreateProject route
- ✅ App.jsx compiles without errors
- ✅ Router tree is valid

---

## PHASE 4: PROJECT FORM UPDATES

### Agent Task: Update CreateProject.jsx & ProjectForm

**File:** `src/pages/CreateProject.jsx` or `src/components/projects/ProjectForm/index.jsx`

**Changes:**

1. **Add imports:**
```javascript
import { CustomerSelector } from '../../components/customers/CustomerSelector'
import { CustomerCreationModal } from '../../components/customers/CustomerCreationModal'
```

2. **Add state in component:**
```javascript
const [showCustomerModal, setShowCustomerModal] = useState(false)
const [selectedCustomerId, setSelectedCustomerId] = useState('')
const [customerError, setCustomerError] = useState('')
```

3. **Add form field (FIRST FIELD before project name):**
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

4. **Add modal component after form:**
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

5. **Update form submission to include customer_id:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault()
  
  // Validate customer selection
  if (!selectedCustomerId) {
    setCustomerError('Please select or create a customer')
    return
  }

  const projectData = {
    ...formData,
    customer_id: selectedCustomerId  // ADD THIS
  }

  // Rest of submission logic
}
```

**Success Criteria:**
- ✅ CustomerSelector renders in form
- ✅ CustomerCreationModal opens when "New Customer" clicked
- ✅ Selected customer is included in project submission
- ✅ Form validation requires customer selection
- ✅ No errors in browser console

---

## PHASE 5: CUSTOMERS PAGE ENHANCEMENTS

### Agent Task: Update Customers.jsx Page

**File:** `src/pages/Customers.jsx`

**Changes:**

1. **Update customer list display to show project count:**

**BEFORE:**
```javascript
{customers.map(customer => (
  <div key={customer.id}>
    <h3>{customer.name}</h3>
    <p>{customer.email}</p>
  </div>
))}
```

**AFTER:**
```javascript
{customers.map(customer => (
  <div key={customer.id} className="border rounded-lg p-4">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-bold text-lg">{customer.name}</h3>
        <p className="text-gray-600">{customer.email}</p>
        {customer.phone && <p className="text-gray-500">{customer.phone}</p>}
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-blue-600">
          {customer.projectCount || 0}
        </div>
        <div className="text-sm text-gray-600">Projects</div>
      </div>
    </div>
  </div>
))}
```

2. **Import enhanced getCustomerProjectSummary:**
```javascript
import { getCustomerProjectSummary } from '../lib/customerService'
```

3. **Load customer data with stats:**
```javascript
useEffect(() => {
  const loadCustomers = async () => {
    const data = await getCustomerProjectSummary()
    setCustomers(data)
  }
  loadCustomers()
}, [])
```

**Success Criteria:**
- ✅ Customers list shows project counts
- ✅ Project counts update when projects added
- ✅ No API errors
- ✅ Page renders correctly

---

## PHASE 6: VALIDATION & TESTING

### Agent Task: Run Validation Tests

**Executor:** Test Agent  
**Tool:** npm test / Vitest

#### 6.1 Unit Tests
```bash
# Run all tests
npm test

# Run specific tests
npm test -- customerService
npm test -- projectService
```

#### 6.2 Integration Tests (Manual Browser Testing)

**Test Scenario 1: Cannot create project without customer**
```
1. Navigate to /projects/new
2. Try to submit form without selecting customer
3. ✅ Should show error: "Please select or create a customer"
4. ✅ Project should NOT be created
```

**Test Scenario 2: Create customer, then project**
```
1. Navigate to /projects/new
2. See "Customer" dropdown as first required field
3. Click "New Customer"
4. Fill customer form: Name = "Test Company"
5. Submit → See success message
6. Customer dropdown auto-fills with "Test Company"
7. Fill project details and submit
8. ✅ Project created with correct customer_id
```

**Test Scenario 3: Cannot deactivate customer with active projects**
```
1. Go to Customers page
2. Find customer with active projects
3. Try to deactivate
4. ✅ Should show error: "Cannot deactivate customer with X active project(s)"
```

**Test Scenario 4: Database constraint enforcement**
```
1. Create project normally (passes validation)
2. Try to manually update project with invalid customer_id (via direct SQL)
3. ✅ Should fail: "Referenced customer does not exist or is inactive"
```

#### 6.3 Performance Tests
```bash
# Check build size
npm run build

# Should be similar or smaller than before (same-sized changes)
```

**Success Criteria - All Tests Pass:**
- ✅ 0 compilation errors
- ✅ 0 test failures
- ✅ All 4 scenarios work as expected
- ✅ Database constraints enforced
- ✅ UI properly guides user

---

## QUICK REFERENCE: File Status

### ✅ COMPLETED (Ready to Deploy)
- `CUSTOMER_FIRST_WORKFLOW_IMPLEMENTATION.md`
- `CUSTOMER_FIRST_WORKFLOW_SCHEMA.sql`
- `src/lib/customerService.ENHANCED.js`
- `src/lib/projectService.ENHANCED.js`
- `src/components/customers/CustomerSelector.jsx`
- `src/components/customers/CustomerCreationModal.jsx`
- `src/components/guards/ProjectCreationGuard.jsx`

### 🔄 PENDING (Agent Must Execute)
- Database schema application
- Service file replacement
- App.jsx route updates
- ProjectForm updates
- Customers page enhancements
- Validation tests

### 📋 ROLLBACK PLAN
If issues occur:
```bash
# Restore backups
cp src/lib/customerService.js.backup src/lib/customerService.js
cp src/lib/projectService.js.backup src/lib/projectService.js

# Revert App.jsx and CreateProject.jsx to git
git checkout src/App.jsx
git checkout src/pages/CreateProject.jsx

# Remove new components
rm src/components/customers/CustomerSelector.jsx
rm src/components/customers/CustomerCreationModal.jsx
rm src/components/guards/ProjectCreationGuard.jsx

# Re-apply latest git changes
git pull
```

---

## EXECUTION WORKFLOW FOR AGENTS

**SEQUENTIAL EXECUTION (No parallelization):**

```
START
  ↓
[Agent 1] PHASE 1: Apply Database Schema
  ↓ (VERIFY SUCCESS)
[Agent 2] PHASE 2: Replace Service Files
  ↓ (VERIFY SUCCESS)
[Agent 3] PHASE 3: Update App.jsx Routes
  ↓ (VERIFY SUCCESS)
[Agent 4] PHASE 4: Update Project Form
  ↓ (VERIFY SUCCESS)
[Agent 5] PHASE 5: Enhance Customers Page
  ↓ (VERIFY SUCCESS)
[Agent 6] PHASE 6: Run Validation Tests
  ↓ (ALL PASS)
[Agent 7] Commit & Create PR
  ↓
END ✅
```

---

## ERROR HANDLING FOR AGENTS

### If Database Schema Fails
**Action:** Don't proceed. Contact logs.
**Recovery:** 
```sql
-- List what was applied
SELECT * FROM information_schema.triggers WHERE event_object_schema = 'public';
-- Manually apply missing pieces
```

### If Service Tests Fail
**Action:** Review test output
**Recovery:**
```bash
# Check imports
grep -r "customerService" src/lib/__tests__/
# Verify exports match
grep "export" src/lib/customerService.js
```

### If Route Updates Break App
**Action:** Revert App.jsx
**Recovery:**
```bash
git diff src/App.jsx
git checkout src/App.jsx
# Manually verify imports
```

### If Validation Tests Fail
**Action:** Check browser console
**Recovery:**
```bash
# Clear cache
rm -rf node_modules/.vite
# Rebuild
npm run build
```

---

## TOKEN OPTIMIZATION

**Total Token Budget Estimate:**
- Database execution: ~500 tokens
- Service replacement: ~2,000 tokens
- UI component integration: ~3,000 tokens
- Testing & validation: ~1,500 tokens
- **Total: ~7,000 tokens** (efficient)

**Minimization strategies used:**
✅ Reuse existing patterns  
✅ Copy-paste ready code  
✅ No exploratory work  
✅ Direct agent instructions  
✅ Pre-created components  

---

## SUCCESS METRICS

When all phases complete:
1. ✅ Projects require customer_id (enforced at DB + service + UI)
2. ✅ No orphaned projects possible
3. ✅ UI flow guides user: Customer → Project
4. ✅ All tests pass
5. ✅ No breaking changes to existing code
6. ✅ Customers page shows project statistics

---

## DEPLOYMENT CHECKLIST

- [ ] All 6 phases completed
- [ ] All tests passing
- [ ] No console errors
- [ ] Database migrations verified
- [ ] Rollback tested
- [ ] Commit created with message: "feat: implement customer-first workflow"
- [ ] Pull request ready

---

**Generated:** April 19, 2026  
**For:** Autonomous Agent Execution  
**Status:** 🟢 READY TO DEPLOY
