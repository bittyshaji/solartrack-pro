# Phase 3: Migration Guide
## Step-by-Step Guide for Updating Import Paths

---

## Quick Reference

### New Import Structure

```
@/services/projects          → Project management services
@/services/customers         → Customer management services
@/services/emails            → Email services
@/services/invoices          → Invoice generation and management
@/services/materials         → Material management
@/services/proposals         → Proposal and certificate services
@/services/operations        → General operations (batch, export, filtering, etc.)
@/services/operations/batch  → Batch operation services
@/services/operations/export → Data export services
@/services/site-survey       → Site survey services
@/services/kseb              → KSEB-related services
@/services/finance           → Finance and payment services
@/services/staff             → Staff management services
@/services/notifications     → Notification services
@/services/photos            → Photo management services
@/services/tasks             → Task management services
@/services/teams             → Team management services
@/services/warranty          → Warranty services
@/lib/logger                 → Logger and error tracking
```

---

## Step 1: Update Service Imports

### Projects Service

**OLD CODE:**
```javascript
import { 
  createProject, 
  updateProject, 
  getProject,
  PROJECT_STAGES 
} from '../lib/projectService'
```

**NEW CODE:**
```javascript
import { 
  createProject, 
  updateProject, 
  getProject,
  PROJECT_STAGES 
} from '@/services/projects'
```

### Customers Service

**OLD CODE:**
```javascript
import { 
  createCustomer, 
  getAllCustomers, 
  updateCustomer 
} from '../../lib/customerService'
```

**NEW CODE:**
```javascript
import { 
  createCustomer, 
  getAllCustomers, 
  updateCustomer 
} from '@/services/customers'
```

### Email Service

**OLD CODE:**
```javascript
import { 
  sendEmail, 
  getEmailLogs 
} from '../lib/emailService'
```

**NEW CODE:**
```javascript
import { 
  sendEmail, 
  getEmailLogs 
} from '@/services/emails'
```

### Invoice Services

**OLD CODE:**
```javascript
import { 
  createInvoice, 
  getInvoices 
} from '../lib/invoiceService'
import { 
  downloadInvoice 
} from '../lib/invoiceDownloadService'
```

**NEW CODE:**
```javascript
import { 
  createInvoice, 
  getInvoices,
  downloadInvoice 
} from '@/services/invoices'
```

### Material Service

**OLD CODE:**
```javascript
import { 
  getMaterials, 
  createMaterial 
} from '../lib/materialService'
```

**NEW CODE:**
```javascript
import { 
  getMaterials, 
  createMaterial 
} from '@/services/materials'
```

---

## Step 2: Update Proposal Services

### Multiple Proposal Services

**OLD CODE:**
```javascript
import { downloadProposal } from '../lib/proposalDownloadService'
import { createProposalReference } from '../lib/proposalReferenceService'
import { getProposalData } from '../lib/proposalDataService'
import { createCompletionCertificate } from '../lib/completionCertificateService'
```

**NEW CODE:**
```javascript
import { 
  downloadProposal,
  createProposalReference,
  getProposalData,
  createCompletionCertificate 
} from '@/services/proposals'
```

---

## Step 3: Update Operations Services

### Batch Operations

**OLD CODE:**
```javascript
import { 
  getBatchOperationStatus, 
  createBatchOperation 
} from '../lib/batchOperationsService'
```

**NEW CODE:**
```javascript
import { 
  getBatchOperationStatus, 
  createBatchOperation 
} from '@/services/operations/batch'
```

### Export Services

**OLD CODE:**
```javascript
import { exportToCSV } from '../lib/exportService'
import { batchExport } from '../lib/batchExportService'
```

**NEW CODE:**
```javascript
import { 
  exportToCSV,
  batchExport 
} from '@/services/operations/export'
```

### General Operations

**OLD CODE:**
```javascript
import { getSearchFilters } from '../lib/filterService'
import { performSearch } from '../lib/searchService'
import { getAnalytics } from '../lib/analyticsService'
```

**NEW CODE:**
```javascript
import { 
  getSearchFilters,
  performSearch,
  getAnalytics 
} from '@/services/operations'
```

---

## Step 4: Update Specialized Services

### Site Survey Service

**OLD CODE:**
```javascript
import { createSiteSurvey } from '../lib/siteSurveyService'
```

**NEW CODE:**
```javascript
import { createSiteSurvey } from '@/services/site-survey'
```

### KSEB Services

**OLD CODE:**
```javascript
import { checkFeasibility } from '../lib/ksebFeasibilityService'
import { processEnergisation } from '../lib/ksebEnergisationService'
```

**NEW CODE:**
```javascript
import { 
  checkFeasibility,
  processEnergisation 
} from '@/services/kseb'
```

### Finance Services

**OLD CODE:**
```javascript
import { createEstimate } from '../lib/estimateService'
import { processPayment } from '../lib/paymentWorkflowService'
```

**NEW CODE:**
```javascript
import { 
  createEstimate,
  processPayment 
} from '@/services/finance'
```

### Staff Services

**OLD CODE:**
```javascript
import { recordAttendance } from '../lib/staffAttendanceService'
```

**NEW CODE:**
```javascript
import { recordAttendance } from '@/services/staff'
```

### Notification Services

**OLD CODE:**
```javascript
import { 
  sendNotification,
  getNotificationPreferences 
} from '../lib/notificationService'
```

**NEW CODE:**
```javascript
import { 
  sendNotification,
  getNotificationPreferences 
} from '@/services/notifications'
```

### Photo Services

**OLD CODE:**
```javascript
import { uploadPhoto } from '../lib/photoService'
import { getOfflinePhotos } from '../lib/photoOfflineService'
```

**NEW CODE:**
```javascript
import { 
  uploadPhoto,
  getOfflinePhotos 
} from '@/services/photos'
```

### Task Services

**OLD CODE:**
```javascript
import { createTask } from '../lib/taskService'
import { getStageTask } from '../lib/stageTaskService'
import { getChecklist } from '../lib/stageChecklistService'
```

**NEW CODE:**
```javascript
import { 
  createTask,
  getStageTask,
  getChecklist 
} from '@/services/tasks'
```

### Team Services

**OLD CODE:**
```javascript
import { createTeam } from '../lib/teamService'
```

**NEW CODE:**
```javascript
import { createTeam } from '@/services/teams'
```

### Warranty Services

**OLD CODE:**
```javascript
import { createWarranty } from '../lib/warrantyService'
```

**NEW CODE:**
```javascript
import { createWarranty } from '@/services/warranty'
```

---

## Step 5: Update Logger Imports

### Logger

**OLD CODE:**
```javascript
import { logger, logMessage } from '../lib/logger'
```

**NEW CODE:**
```javascript
import { logger, logMessage } from '@/lib/logger'
```

### Error Tracking

**OLD CODE:**
```javascript
import { trackError } from '../lib/errorTracking'
```

**NEW CODE:**
```javascript
import { trackError } from '@/lib/logger'
```

### Log Storage

**OLD CODE:**
```javascript
import { getLogs, clearLogs } from '../lib/storage/logStorage'
```

**NEW CODE:**
```javascript
import { getLogs, clearLogs } from '@/lib/logger/storage'
```

---

## Step 6: Update Configuration Imports

### Constants

**OLD CODE:**
```javascript
import { PROJECT_STATUSES } from '../config/constants'
```

**NEW CODE:**
```javascript
import { PROJECT_STATUSES } from '@/config/constants'
```

### Environment

**OLD CODE:**
```javascript
import { env } from '../config/environment'
```

**NEW CODE:**
```javascript
import { env } from '@/config/environment'
```

---

## Migration Workflow

### For Each Component/Page File:

1. **Identify all imports from src/lib/**
   ```bash
   grep -n "from.*lib/" your-file.jsx
   ```

2. **Map to new locations using quick reference above**

3. **Update imports to use @/ aliases**

4. **Remove relative path complexity**
   - Before: `import { foo } from '../../lib/barService'`
   - After: `import { foo } from '@/services/bar'`

5. **Test the file**
   - Run `npm run dev` and check for errors
   - Verify functionality works

6. **Verify no deprecation warnings in console**
   - If you see "DEPRECATION WARNING", check your imports

---

## Common Patterns

### Pattern 1: Multiple Related Services

```javascript
// OLD
import { createProject } from '../lib/projectService'
import { createEstimate } from '../lib/estimateService'
import { downloadProposal } from '../lib/proposalDownloadService'

// NEW
import { createProject } from '@/services/projects'
import { createEstimate } from '@/services/finance'
import { downloadProposal } from '@/services/proposals'
```

### Pattern 2: Utility & Service Mix

```javascript
// OLD
import { logger } from '../lib/logger'
import { createProject } from '../lib/projectService'
import { PROJECT_STAGES } from '../lib/projectService'
import { env } from '../config/environment'

// NEW
import { logger } from '@/lib/logger'
import { createProject, PROJECT_STAGES } from '@/services/projects'
import { env } from '@/config/environment'
```

### Pattern 3: Nested Operations

```javascript
// OLD
import { getBatchStatus } from '../lib/batchOperationsService'
import { exportData } from '../lib/batchExportService'

// NEW
import { getBatchStatus } from '@/services/operations/batch'
import { exportData } from '@/services/operations/export'
```

---

## File-by-File Examples

### Example 1: CustomerManagement.jsx

**BEFORE:**
```javascript
import React, { useState, useEffect } from 'react'
import { 
  createCustomer, 
  getAllCustomers, 
  updateCustomer, 
  deactivateCustomer, 
  searchCustomers 
} from '../lib/customerService'
import { logger } from '../lib/logger'
import { CUSTOMER_STATUS } from '../config/constants'

export default function CustomerManagement() {
  // ... component code
}
```

**AFTER:**
```javascript
import React, { useState, useEffect } from 'react'
import { 
  createCustomer, 
  getAllCustomers, 
  updateCustomer, 
  deactivateCustomer, 
  searchCustomers 
} from '@/services/customers'
import { logger } from '@/lib/logger'
import { CUSTOMER_STATUS } from '@/config/constants'

export default function CustomerManagement() {
  // ... component code (unchanged)
}
```

### Example 2: ProjectPanel.jsx

**BEFORE:**
```javascript
import { 
  createProject, 
  updateProjectState, 
  getProjectWithCustomer,
  PROJECT_STAGES 
} from '../../lib/projectService'
import { 
  getAllStageTasksGrouped,
  updateStageTask 
} from '../../lib/stageTaskService'
import { createEstimate } from '../../lib/estimateService'
import { downloadProposalPDF } from '../../lib/proposalDownloadService'
import { logger } from '../../lib/logger'

export default function ProjectPanel() {
  // ... component code
}
```

**AFTER:**
```javascript
import { 
  createProject, 
  updateProjectState, 
  getProjectWithCustomer,
  PROJECT_STAGES 
} from '@/services/projects'
import { 
  getAllStageTasksGrouped,
  updateStageTask 
} from '@/services/tasks'
import { createEstimate } from '@/services/finance'
import { downloadProposalPDF } from '@/services/proposals'
import { logger } from '@/lib/logger'

export default function ProjectPanel() {
  // ... component code (unchanged)
}
```

---

## Verification Checklist

After updating imports in a file:

- [ ] No "from '../lib/" imports remain
- [ ] No "from '../../lib/" imports remain  
- [ ] All imports use @/ aliases where applicable
- [ ] No console errors when running `npm run dev`
- [ ] No "DEPRECATION WARNING" messages in console
- [ ] Component/page functionality still works
- [ ] All imports are resolvable

---

## Deprecation Warning Reference

If you see this warning in the console:

```
DEPRECATION WARNING: Importing from src/lib/projectService is deprecated. 
Please update to import from @/services/projects instead.
```

It means:
1. You are using an old import path
2. The code still works (compatibility layer)
3. You should update the import path to the new location
4. After updating, the warning will go away

---

## IDE Support

### VS Code
- IntelliSense will auto-complete @/ paths
- Hover over imports to see file paths
- Cmd/Ctrl+Click to jump to imported files

### WebStorm
- Alt+Enter to auto-fix imports
- Cmd/Ctrl+B to go to definition
- Search and Replace to update multiple files

---

## Batch Migration Tools

### Find & Replace (VS Code)

**Find services:**
```
Find: from ['"](\.\.\/)*lib\/(\w+Service)['"](;)?
Replace: from '@/services/$2'
```

**Find logger:**
```
Find: from ['"](\.\.\/)*lib\/(logger|errorTracking)['"](;)?
Replace: from '@/lib/logger'
```

---

## Testing After Migration

### Development Server
```bash
npm run dev
# Check browser console for errors/warnings
```

### Build Test
```bash
npm run build
# Should complete without errors
```

### Type Checking
```bash
npm run type-check
# Should pass all checks
```

### Tests
```bash
npm run test
# Should pass all tests
```

---

## Questions & Troubleshooting

### Q: File is not found even after updating import
**A:** Make sure the import path matches the export in the new location. Use exact case (imports are case-sensitive).

### Q: Getting "Cannot find module" error
**A:** Check that the @ alias is properly configured in vite.config.js. Restart dev server if you updated vite.config.js.

### Q: Still seeing deprecation warning
**A:** You may have another import in the same file using the old path. Search file for all "lib/" imports.

### Q: Multiple services in one category
**A:** All services in a category are exported from that category's index.js. Import from the category.

---

## Timeline Recommendations

### Week 1
- Review this guide
- Update 5-10 high-traffic files
- Test thoroughly

### Week 2
- Continue with 10-15 more files
- Share tips with team

### Week 3
- Finish remaining files
- Run full test suite
- Verify no warnings in console

### Week 4
- Code review all migration PRs
- Prepare for cleanup phase

---

## Support & Questions

For specific migration questions:
1. Check this guide
2. Review PHASE_3_MIGRATION_REPORT.md
3. Look at the Quick Reference section at the top
4. Check the import examples in this guide

---

## Before & After Summary

| Aspect | Before | After |
|--------|--------|-------|
| Relative Paths | `../lib/projectService` | `@/services/projects` |
| Nesting Level | Deep (../, ../../) | Flat (@ prefix) |
| Organization | Flat lib/ folder | Logical domains |
| Index Files | None | 19 organized indices |
| Compatibility | N/A | Full backward compat |
| Deprecation | N/A | Warnings on old paths |
| IDE Support | Limited | Full autocomplete |

---

End of Migration Guide
