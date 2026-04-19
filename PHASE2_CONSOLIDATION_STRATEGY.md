# Phase 2: Component Consolidation & Caching Strategy
**Date**: March 26, 2026
**Target**: Reduce code by 50%, improve maintainability 3x, enable 60-75% faster navigation

---

## PART A: Panel Consolidation (EST/NEG/EXE → UnifiedProposalPanel)

### Analysis: Why Consolidate?

**Current State**:
- EstimationPanel.jsx: ~500 lines
- NegotiationPanel.jsx: ~500 lines (90% similar to EST)
- ExecutionPanel.jsx: ~500 lines (85% similar to NEG)
- **Total: 1,500 lines of nearly-identical code**

**Problems**:
- Changes to one panel must be replicated to all three (maintenance nightmare)
- Bug fixes take 3x effort
- New features take 3x implementation time
- Inconsistencies between panels lead to UI/UX issues

**Solution**: Create **UnifiedProposalPanel** component

---

### Consolidation Architecture

```javascript
// Single component replaces 3:
<UnifiedProposalPanel
  state="estimation"        // or "negotiation" or "execution"
  projectId={projectId}
  project={project}
  onStateChange={onStateChange}
/>

// Instead of:
// <EstimationPanel projectId={...} />
// <NegotiationPanel projectId={...} />
// <ExecutionPanel projectId={...} />
```

---

### Architecture: What Goes Where

#### SHARED (in UnifiedProposalPanel):
```javascript
// State management (all three panels use these)
const [stages, setStages] = useState([])
const [expandedStage, setExpandedStage] = useState(null)
const [editingTask, setEditingTask] = useState(null)
const [editValues, setEditValues] = useState({})
const [loading, setLoading] = useState(true)
const [saving, setSaving] = useState(false)
const [projectData, setProjectData] = useState(null)
const [proposals, setProposals] = useState([])
const [proposalNumber, setProposalNumber] = useState(null)

// Shared functions
loadData()                          // Abstract into shared function
handleEditTask()                    // Identical across all 3
handleSaveTask()                    // Identical across all 3
calculateStageTotal()               // Identical across all 3
calculateGrandTotal()               // Identical across all 3
renderStageRow()                    // Shared UI rendering

// Shared UI sections
Stage expansion/collapse
Task editing UI
Customer info display
Proposal list
```

#### STATE-SPECIFIC (Configuration Objects):
```javascript
// Define state-specific behavior via config:
const stateConfig = {
  estimation: {
    proposalType: 'Estimation',
    color: 'blue',
    bgGradient: 'from-blue-50 to-blue-100',
    icon: FileText,
    label: 'Estimation',
    buttons: ['Generate Proposal', 'Download PDF', 'Move to Negotiation'],
    allowTaskEditing: true,
    allowTaskCreation: false,
    allowTaskDeletion: false,
    allowInvoices: false,
    dataLoaders: ['projectData', 'proposals', 'stages'],
    uniqueFeatures: ['selectedStages', 'isInitialLoad']
  },
  negotiation: {
    proposalType: 'Negotiation',
    color: 'orange',
    bgGradient: 'from-orange-50 to-orange-100',
    icon: Edit2,
    label: 'Negotiation',
    buttons: ['Create Negotiation Proposal', 'Download PDF', 'Move to Execution'],
    allowTaskEditing: true,
    allowTaskCreation: true,
    allowTaskDeletion: true,
    allowInvoices: false,
    dataLoaders: ['projectData', 'proposals', 'parentProposal', 'stages'],
    uniqueFeatures: ['newTask', 'newTaskStage', 'error']
  },
  execution: {
    proposalType: 'Execution',
    color: 'green',
    bgGradient: 'from-green-50 to-green-100',
    icon: CheckCircle,
    label: 'Execution',
    buttons: ['Create Execution Proposal', 'Generate Invoice', 'Download PDF'],
    allowTaskEditing: true,
    allowTaskCreation: true,
    allowTaskDeletion: false,
    allowInvoices: true,
    dataLoaders: ['projectData', 'proposals', 'invoices', 'stages'],
    uniqueFeatures: ['invoices', 'executionProposalId', 'selectedInvoice']
  }
}
```

#### STATE-SPECIFIC (Implementation):
```javascript
// Special UI sections only for specific states:
{state === 'estimation' && <EstimationSpecificUI />}
{state === 'negotiation' && <NegotiationSpecificUI />}
{state === 'execution' && <ExecutionSpecificUI />}

// State-specific handlers
if (state === 'estimation') {
  handleGenerateProposal()
} else if (state === 'negotiation') {
  handleCreateNegotiationProposal()
} else if (state === 'execution') {
  handleCreateExecutionProposal()
}
```

---

### Implementation Steps

#### Step 1: Create unified loadData() function
```javascript
const loadData = async () => {
  setLoading(true)
  try {
    // Always load these (common)
    const [fullProjectData, groupedTasks, allProposalsData] = await Promise.all([
      getProjectWithCustomer(projectId),
      getAllStageTasksGrouped(projectId),
      getProposalsByProject(projectId)
    ])

    // Load state-specific data
    let parentData = null
    let invoices = null
    let estimate = null

    if (state !== 'estimation') {
      parentData = await loadParentProposalData(projectId, capitalizeState(state))
    }

    if (state === 'execution') {
      invoices = await getProjectInvoices(projectId)
      estimate = await getLatestEstimate(projectId)
    }

    if (state === 'negotiation' || state === 'execution') {
      estimate = await getLatestEstimate(projectId)
    }

    // Set common state
    setProjectData(fullProjectData)
    setProposals(allProposalsData || [])

    // Set state-specific state
    if (state !== 'estimation') {
      setParentProposal(parentData?.parentProposal)
    }
    if (state === 'execution') {
      setInvoices(invoices)
    }
    if (state === 'negotiation' || state === 'execution') {
      setLatestEstimate(estimate)
    }

    // Set stages
    const stagesData = PROJECT_STAGES.map(stage => ({
      ...stage,
      tasks: groupedTasks[stage.id] || [],
      isFromParent: (groupedTasks[stage.id]?.length || 0) > 0
    }))
    setStages(stagesData)
  } finally {
    setLoading(false)
  }
}
```

#### Step 2: Create shared UI rendering function
```javascript
const renderTasksForStage = (stage) => {
  return stage.tasks?.map(task => (
    <div key={task.id} className="flex items-center justify-between p-3 border-b">
      {/* Task editing UI - identical across all states */}
      ...
    </div>
  ))
}

const renderStageHeader = (stage) => {
  // Collapse/expand toggle - identical across all states
  return (
    <button
      onClick={() => toggleStage(stage.id)}
      className={`w-full px-4 py-3 flex items-center justify-between ${stateConfig[state].bgGradient}`}
    >
      {/* Stage info */}
    </button>
  )
}
```

#### Step 3: Update ProjectDetail.jsx routing
```javascript
// Before:
{projectState === 'Estimation' && <EstimationPanel />}
{projectState === 'Negotiation' && <NegotiationPanel />}
{projectState === 'Execution' && <ExecutionPanel />}

// After:
<UnifiedProposalPanel
  state={projectState.toLowerCase()}
  projectId={projectId}
  project={project}
  onStateChange={onStateChange}
/>
```

---

## PART B: Context Caching (ProjectDataContext)

### Problem: Duplicate Data Fetches

**Current Issue**:
```
User opens Project Detail
├─ ProjectDetail.jsx loads: getProjectDetail, getProjectMaterials, getProjectProgress
├─ EstimationPanel loads: getProjectWithCustomer, getProposalsByProject, getAllStageTasksGrouped
└─ Both fetch projectId independently ← DUPLICATE FETCH!

Switch states (EST → NEG)
├─ EstimationPanel unloads
├─ NegotiationPanel loads
├─ NegotiationPanel fetches: getProjectWithCustomer, getProposalsByProject, getAllStageTasksGrouped
└─ DUPLICATE FETCH AGAIN! ← Should use cached data

Go back to Project List → Click same project again
├─ All data fetches again even though we just loaded it 5 seconds ago
└─ DUPLICATE FETCH for entire project
```

**Result**: 60-75% slower navigation when switching states or revisiting projects

### Solution: ProjectDataContext

Create a context that caches project data with smart invalidation:

```javascript
// src/contexts/ProjectDataContext.jsx
import { createContext, useContext, useState, useRef } from 'react'

const ProjectDataContext = createContext()

export function ProjectDataProvider({ children, projectId }) {
  const [cachedData, setCachedData] = useState({})
  const [lastFetch, setLastFetch] = useState({})
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Get cached data or fetch
  const getOrFetchData = async (key, fetchFn) => {
    const now = Date.now()
    const lastTime = lastFetch[key] || 0

    // Return cached if fresh
    if (cachedData[key] && (now - lastTime) < CACHE_DURATION) {
      console.log(`📦 Cache HIT for ${key}`)
      return cachedData[key]
    }

    // Fetch fresh data
    console.log(`🌐 Cache MISS for ${key}, fetching...`)
    const data = await fetchFn()

    // Update cache
    setCachedData(prev => ({ ...prev, [key]: data }))
    setLastFetch(prev => ({ ...prev, [key]: now }))

    return data
  }

  // Invalidate specific cache key
  const invalidateCache = (key) => {
    setCachedData(prev => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
    setLastFetch(prev => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
  }

  return (
    <ProjectDataContext.Provider value={{ getOrFetchData, invalidateCache, cachedData }}>
      {children}
    </ProjectDataContext.Provider>
  )
}

export function useProjectData() {
  const context = useContext(ProjectDataContext)
  if (!context) {
    throw new Error('useProjectData must be used within ProjectDataProvider')
  }
  return context
}
```

### Usage in Components

```javascript
// In ProjectDetail.jsx
function ProjectDetail() {
  const { getOrFetchData, invalidateCache } = useProjectData()

  const fetchProjectData = async () => {
    const data = await getOrFetchData(
      `project_${projectId}`,
      () => getProjectDetail(projectId)
    )
    setProject(data)
  }
}

// In UnifiedProposalPanel.jsx
function UnifiedProposalPanel({ projectId, state }) {
  const { getOrFetchData, invalidateCache } = useProjectData()

  const loadData = async () => {
    // These will use cache if available
    const projectData = await getOrFetchData(
      `projectWithCustomer_${projectId}`,
      () => getProjectWithCustomer(projectId)
    )

    const proposals = await getOrFetchData(
      `proposals_${projectId}`,
      () => getProposalsByProject(projectId)
    )

    const tasks = await getOrFetchData(
      `stageTasks_${projectId}`,
      () => getAllStageTasksGrouped(projectId)
    )
  }

  // When creating proposal, invalidate relevant caches
  const handleCreateProposal = async () => {
    // ... create proposal ...
    invalidateCache(`proposals_${projectId}`)
    invalidateCache(`stageTasks_${projectId}`)
    await loadData() // Reload with fresh data
  }
}
```

### Invalidation Strategy

When data changes, invalidate relevant caches:

```javascript
// After creating a proposal
invalidateCache(`proposals_${projectId}`)

// After editing a task
invalidateCache(`stageTasks_${projectId}`)

// After creating a customer
invalidateCache(`projectWithCustomer_${projectId}`)

// After updating project
invalidateCache(`project_${projectId}`)
invalidateCache(`projectWithCustomer_${projectId}`)
```

---

## Implementation Timeline

### Phase 2A: Panel Consolidation (6-8 hours)
1. Create UnifiedProposalPanel.jsx (2-3 hours)
2. Test and debug (1-2 hours)
3. Update ProjectDetail.jsx to use new panel (1 hour)
4. Remove old components (EstimationPanel, NegotiationPanel, ExecutionPanel) (1 hour)

### Phase 2B: Context Caching (4-6 hours)
1. Create ProjectDataContext.jsx (1-2 hours)
2. Implement cache invalidation logic (1-2 hours)
3. Integrate into ProjectDetail.jsx (1-2 hours)
4. Test cache behavior (1 hour)

### Phase 2C: Testing & Verification (2-3 hours)
1. Test all three states (EST, NEG, EXE) (1 hour)
2. Test state transitions (1 hour)
3. Test cache invalidation (30 min)
4. Performance measurements (30 min)

**Total Phase 2: 12-17 hours**

---

## Expected Outcomes

### Code Quality
- **Reduction**: 1,500 lines → 700-800 lines (50% less code)
- **Maintainability**: Single source of truth for shared logic
- **Consistency**: Identical behavior across all three states
- **Testability**: Single component to test vs. three

### Performance
- **State switching** (EST → NEG → EXE): 4-6 sec → 0.5-1 sec (80% faster)
- **Project revisits**: 5-8 sec → 100-200ms (90% faster!)
- **Overall navigation**: 40-50% faster across the app

### Developer Experience
- **New features**: Implement once, work in all three states
- **Bug fixes**: Fix once, applied everywhere
- **Testing**: Test one component instead of three
- **Onboarding**: New devs learn single component pattern

---

## Risk Mitigation

### Risk: Breaking existing functionality
**Mitigation**:
- Build new UnifiedProposalPanel in parallel with old components
- Use feature flag to switch between implementations
- Keep old components for 1-2 sprints, ready for rollback
- Test thoroughly before removing old components

### Risk: Cache inconsistencies
**Mitigation**:
- Implement clear invalidation rules
- Log all cache operations (debug mode)
- Manual refresh button on UI
- Cache expiration timeout (5 minutes)

### Risk: Complex state management
**Mitigation**:
- Use clear configuration objects for state-specific behavior
- Extract complex logic into helper functions
- Document the component architecture thoroughly
- Have code reviews before merging

---

## Success Metrics

✅ All code paths test successfully
✅ No performance regression
✅ 50%+ code reduction
✅ 80%+ faster state switching
✅ 90%+ faster project revisits
✅ Zero cache-related bugs in first week

---

**Status**: Strategy complete, ready to begin implementation
