# Logging System Implementation Checklist

Complete guide for integrating the logging system into SolarTrack Pro.

## Phase 1: Core System Setup (Completed)

- [x] Create `logger.js` - Main Logger class
- [x] Create `errorTracking.js` - Error tracking and Sentry
- [x] Create `storage/logStorage.js` - Local storage persistence
- [x] Create `logger.test.js` - Comprehensive tests
- [x] Create `LOGGING_GUIDE.md` - User documentation
- [x] Create `README.md` - System documentation
- [x] Create integration examples

## Phase 2: Service Integration

### Service: analyticsService.js
Location: `src/lib/analyticsService.js`

Tasks:
- [ ] Add `import { logger } from './logger'` at top
- [ ] Add child logger in `getRevenueMetrics()`
  - [ ] Add debug log on entry
  - [ ] Add info log on success with metrics
  - [ ] Replace console.error with logger.exception()
- [ ] Add child logger in `getProjectMetrics()`
  - [ ] Log query parameters (without sensitive data)
  - [ ] Log result metrics
  - [ ] Exception handling with categorization
- [ ] Add child logger in `getCustomerMetrics()`
  - [ ] Debug entry with filters
  - [ ] Info success with counts
  - [ ] Exception logging
- [ ] Remove all `console.error` calls
- [ ] Test with DEBUG level
- [ ] Verify logs appear in localStorage

### Service: projectService.js
Location: `src/lib/projectService.js`

Tasks:
- [ ] Add `import { logger } from './logger'` at top
- [ ] Add child logger in `createProject()`
- [ ] Add child logger in `updateProjectStatus()`
- [ ] Add child logger in `getProjectDetails()`
- [ ] Add child logger in `deleteProject()`
- [ ] Add child logger in `listProjects()`
- [ ] Replace console.error with exceptions
- [ ] Remove console.log statements or convert to debug
- [ ] Verify sensitive data redaction
- [ ] Test error scenarios

### Service: estimateService.js
Location: `src/lib/estimateService.js`

Tasks:
- [ ] Add `import { logger } from './logger'` at top
- [ ] Add child logger in `generateEstimate()`
  - [ ] Log item count, not items
  - [ ] Log amount without raw calculation
- [ ] Add child logger in `sendEstimate()`
  - [ ] Log domain, not full email
  - [ ] Log delivery status
- [ ] Add child logger in `validateEstimate()`
  - [ ] Log validation results
  - [ ] Warn on validation failure
- [ ] Add child logger in `updateEstimate()`
- [ ] Add exception handling
- [ ] Test with sample data
- [ ] Verify no PII in logs

### Service: invoiceService.js
Location: `src/lib/invoiceService.js`

Tasks:
- [ ] Add `import { logger } from './logger'` at top
- [ ] Add child logger in `createInvoice()`
- [ ] Add child logger in `processPayment()`
  - [ ] Log amount, method (not card details)
  - [ ] Log transaction ID
  - [ ] Warn on payment failure
- [ ] Add child logger in `getInvoiceStats()`
  - [ ] Log aggregated amounts
  - [ ] Log record counts
- [ ] Add child logger in `sendInvoice()`
- [ ] Exception handling for all operations
- [ ] Test payment workflows
- [ ] Verify financial data safety

### Service: customerService.js
Location: `src/lib/customerService.js`

Tasks:
- [ ] Add `import { logger } from './logger'` at top
- [ ] Add child logger in `createCustomer()`
- [ ] Add child logger in `searchCustomers()`
  - [ ] Log search type (not query)
  - [ ] Log result count
- [ ] Add child logger in `updateCustomer()`
  - [ ] Log changed fields
  - [ ] Log field count
- [ ] Add child logger in `deleteCustomer()`
  - [ ] Warn before deletion
  - [ ] Check dependencies
- [ ] Exception handling throughout
- [ ] Test deletion safeguards
- [ ] Verify no email/phone in logs

## Phase 3: Component Integration

### Dashboard Components

- [ ] `components/dashboard/RevenueChart.jsx`
  - [ ] Add context on mount
  - [ ] Log data load
  - [ ] Catch and log errors

- [ ] `components/dashboard/ProjectsOverview.jsx`
  - [ ] Add context on mount
  - [ ] Log filter changes
  - [ ] Exception handling

- [ ] `components/dashboard/MetricsCard.jsx`
  - [ ] Log metric loads
  - [ ] Handle data errors

### Project Components

- [ ] `components/projects/ProjectForm.jsx`
  - [ ] Add logger context
  - [ ] Log form submissions
  - [ ] Validation error logging

- [ ] `components/projects/ProjectList.jsx`
  - [ ] Log list loads
  - [ ] Log filter applications
  - [ ] Error handling

### Estimate Components

- [ ] `components/estimates/EstimateForm.jsx`
  - [ ] Log submission
  - [ ] Log validation
  - [ ] Exception handling

- [ ] `components/estimates/EstimateViewer.jsx`
  - [ ] Log load
  - [ ] Log export
  - [ ] Handle errors

### Invoice Components

- [ ] `components/invoicing/InvoiceForm.jsx`
  - [ ] Log creation
  - [ ] Log submission
  - [ ] Validation logging

- [ ] `components/invoicing/PaymentProcessor.jsx`
  - [ ] Log payment attempts
  - [ ] Log processing status
  - [ ] Error handling

## Phase 4: API Integration

### API Call Wrapper

- [ ] Create `lib/apiClient.js` (or update existing)
  - [ ] Wrap fetch calls with logging
  - [ ] Log request/response
  - [ ] Track performance
  - [ ] Handle errors uniformly

Example:
```javascript
export async function apiCall(endpoint, options = {}) {
  const apiLogger = logger.child({ feature: 'api' })
  const startTime = performance.now()

  apiLogger.debug('API call', {
    endpoint,
    method: options.method || 'GET'
  })

  try {
    const response = await fetch(endpoint, options)
    const duration = performance.now() - startTime

    if (!response.ok) {
      apiLogger.warn('API error', {
        endpoint,
        status: response.status,
        duration
      })
      throw new Error(`API ${response.status}`)
    }

    apiLogger.debug('API success', {
      endpoint,
      status: response.status,
      duration
    })

    return await response.json()
  } catch (error) {
    apiLogger.exception(error, {
      endpoint,
      duration: performance.now() - startTime
    })
    throw error
  }
}
```

## Phase 5: Testing

### Unit Tests

- [ ] Run existing logger tests
  ```bash
  npm test -- src/lib/logger.test.js
  ```

- [ ] Verify test coverage
  ```bash
  npm test -- --coverage src/lib/logger.test.js
  ```

- [ ] Add service-specific tests
  - [ ] Test logger integration
  - [ ] Test error handling
  - [ ] Test sensitive data redaction

### Integration Tests

- [ ] Test log storage
  - [ ] Add multiple logs
  - [ ] Verify rotation
  - [ ] Query functionality

- [ ] Test error tracking
  - [ ] Error categorization
  - [ ] Stack trace parsing
  - [ ] User context

- [ ] Test component logging
  - [ ] Mount/unmount
  - [ ] User actions
  - [ ] Error scenarios

### Manual Testing

- [ ] Development logging
  ```javascript
  logger.setLevel('DEBUG')
  // Check console output
  ```

- [ ] Production logging
  ```javascript
  logger.setLevel('INFO')
  // Check minimal output
  ```

- [ ] Local storage
  ```javascript
  localStorage.getItem('solartrack_logs')
  // Verify structure
  ```

- [ ] Export functionality
  ```javascript
  logStorage.downloadLogs('json')
  logStorage.downloadLogs('csv')
  ```

## Phase 6: Environment Setup

### Development Environment

- [ ] Verify `NODE_ENV=development` in `.env.local`
- [ ] Log level defaults to DEBUG
- [ ] Console output is colored
- [ ] All logs visible

### Production Environment

- [ ] Set `NODE_ENV=production` in `.env.production`
- [ ] Log level defaults to INFO
- [ ] Console output is minimal
- [ ] Only WARN/ERROR stored locally

### Sentry Setup (Optional)

- [ ] Create Sentry account at sentry.io
- [ ] Get project DSN
- [ ] Add `VITE_SENTRY_DSN` to environment
- [ ] Install Sentry SDK if needed
  ```bash
  npm install @sentry/react @sentry/tracing
  ```
- [ ] Include Sentry script in HTML
- [ ] Test error capture

## Phase 7: Documentation

- [ ] Review `LOGGING_GUIDE.md`
- [ ] Review `src/lib/README.md`
- [ ] Review `LOGGING_INTEGRATION_EXAMPLES.md`
- [ ] Create internal wiki/documentation
- [ ] Add logging notes to coding standards
- [ ] Document context requirements
- [ ] Document error handling patterns

## Phase 8: Monitoring & Maintenance

### Weekly Tasks

- [ ] Check error logs
  ```javascript
  const stats = logStorage.getStats()
  console.log(stats)
  ```

- [ ] Review error patterns
- [ ] Monitor storage usage
- [ ] Check Sentry (if enabled)

### Monthly Tasks

- [ ] Archive old logs
- [ ] Review redaction patterns
- [ ] Update documentation
- [ ] Performance review
- [ ] Storage cleanup

### Quarterly Tasks

- [ ] Major version updates
- [ ] Feature additions to logging
- [ ] Redaction pattern updates
- [ ] Sentry configuration review
- [ ] Capacity planning

## Service Integration Template

Use this template for each service:

```javascript
/**
 * [Service Name] with Logging
 * Features: [list main functions]
 */

import { supabase } from './supabase'
import { logger } from './logger'
import { errorTracking } from './errorTracking'

/**
 * [Function description]
 * @param {type} param - param description
 * @returns {Promise<type>}
 */
export async function functionName(param) {
  const serviceLogger = logger.child({
    feature: 'serviceName',
    action: 'functionName'
  })

  serviceLogger.debug('Starting operation', {
    paramKey: param.key
  })

  try {
    // Operation code
    const result = await performOperation(param)

    serviceLogger.info('Operation succeeded', {
      resultMetric: result.count || result.id,
      timestamp: new Date().toISOString()
    })

    return result
  } catch (error) {
    serviceLogger.exception(error, {
      param: param.id,
      errorCategory: errorTracking.categorizeError(error)
    })
    throw error
  }
}
```

## Verification Checklist

After integration, verify:

- [ ] No console.log/console.error remain
- [ ] All services use logger
- [ ] Logger context set in components
- [ ] Errors use logger.exception()
- [ ] No sensitive data in logs
- [ ] Logs appear in localStorage
- [ ] Export functionality works
- [ ] Tests pass
- [ ] No breaking changes
- [ ] Documentation updated

## Performance Checklist

- [ ] Logging doesn't impact response times
- [ ] Redaction is efficient (< 50ms)
- [ ] Storage queries are fast (< 5ms)
- [ ] Console output minimal in production
- [ ] No memory leaks
- [ ] Sentry doesn't block

## Security Checklist

- [ ] No passwords logged
- [ ] No tokens logged
- [ ] No API keys logged
- [ ] No credit cards logged
- [ ] No SSNs logged
- [ ] No full emails logged
- [ ] No phone numbers logged
- [ ] Context is minimal
- [ ] Redaction works
- [ ] Storage is private

## Go-Live Checklist

- [ ] All services integrated
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Team trained
- [ ] Environment configured
- [ ] Sentry configured (if used)
- [ ] Monitoring setup
- [ ] Error alert configured
- [ ] Backup/archive plan
- [ ] Rollback plan

## Timeline Estimate

- Phase 1 (Core): 2-3 hours (DONE)
- Phase 2 (Services): 4-6 hours
- Phase 3 (Components): 3-4 hours
- Phase 4 (API): 1-2 hours
- Phase 5 (Testing): 3-4 hours
- Phase 6 (Environment): 1 hour
- Phase 7 (Documentation): 1-2 hours
- Phase 8 (Monitoring): Ongoing

**Total: 16-22 hours**

## Notes

- Logging is production-safe by default
- Redaction is automatic and comprehensive
- Storage cleanup is automatic (24-hour expiry)
- Sentry integration is optional
- All changes are non-breaking
- Can be integrated service by service
- Tests validate all functionality

## Support & Issues

For issues or questions:

1. Check `LOGGING_GUIDE.md`
2. Review service examples
3. Check test cases for patterns
4. Enable DEBUG logging
5. Inspect localStorage
6. Review error categorization

## References

- Main Logger: `src/lib/logger.js`
- Error Tracking: `src/lib/errorTracking.js`
- Log Storage: `src/lib/storage/logStorage.js`
- Tests: `src/lib/logger.test.js`
- Guide: `LOGGING_GUIDE.md`
- Examples: `LOGGING_INTEGRATION_EXAMPLES.md`
