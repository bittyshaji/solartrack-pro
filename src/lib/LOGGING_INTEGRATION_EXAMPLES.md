# Logging Integration Examples

This document shows how to integrate the new logging system into 5 key SolarTrack Pro services.

## 1. analyticsService.js - Revenue Metrics

### Before Integration
```javascript
export async function getRevenueMetrics(startDate, endDate, groupBy = 'monthly') {
  try {
    const { data, error } = await supabase
      .from('project_invoices')
      .select('amount, created_at, payment_status')
      .eq('payment_status', 'Paid')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true })

    if (error) throw error
    // ... processing logic ...
  } catch (err) {
    console.error('Revenue metrics error:', err)
    return { data: [], total: 0, average: 0, growth: 0, count: 0 }
  }
}
```

### After Integration
```javascript
import { logger } from './logger'
import { errorTracking } from './errorTracking'

export async function getRevenueMetrics(startDate, endDate, groupBy = 'monthly') {
  const metricsLogger = logger.child({
    feature: 'analytics',
    action: 'getRevenueMetrics'
  })

  metricsLogger.debug('Fetching revenue metrics', {
    startDate,
    endDate,
    groupBy
  })

  try {
    const startTime = performance.now()

    const { data, error } = await supabase
      .from('project_invoices')
      .select('amount, created_at, payment_status')
      .eq('payment_status', 'Paid')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true })

    if (error) throw error

    if (!data || data.length === 0) {
      metricsLogger.warn('No revenue data found', {
        dateRange: `${startDate} to ${endDate}`
      })
      return { data: [], total: 0, average: 0, growth: 0, count: 0 }
    }

    // ... processing logic ...

    const duration = performance.now() - startTime

    metricsLogger.info('Revenue metrics fetched successfully', {
      recordCount: data.length,
      duration: Math.round(duration),
      total,
      average,
      growth
    })

    return {
      data: groupedData,
      total,
      average,
      growth,
      count: data.length,
    }
  } catch (err) {
    metricsLogger.exception(err, {
      startDate,
      endDate,
      groupBy,
      errorType: errorTracking.categorizeError(err)
    })

    return { data: [], total: 0, average: 0, growth: 0, count: 0 }
  }
}
```

### Key Changes
- Added child logger for feature tracking
- Log start of operation with parameters
- Track query performance
- Log success with result metrics
- Exception logging with error categorization
- No sensitive data exposed

---

## 2. projectService.js - Project Operations

### Integration Pattern
```javascript
import { logger } from './logger'

export async function createProject(projectData) {
  const projectLogger = logger.child({
    feature: 'projects',
    action: 'createProject'
  })

  projectLogger.debug('Creating project', {
    customerName: projectData.customer_name,
    estimatedValue: projectData.estimated_value
  })

  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([projectData])
      .select()

    if (error) throw error

    projectLogger.info('Project created successfully', {
      projectId: data[0].id,
      customerId: data[0].customer_id,
      status: data[0].status
    })

    return data[0]
  } catch (err) {
    projectLogger.exception(err, {
      customer_name: projectData.customer_name,
      action: 'insert'
    })
    throw err
  }
}

export async function updateProjectStatus(projectId, newStatus) {
  const projectLogger = logger.child({
    feature: 'projects',
    action: 'updateProjectStatus'
  })

  projectLogger.debug('Updating project status', {
    projectId,
    newStatus,
    previousStatus: 'unknown' // Could fetch if needed
  })

  try {
    const { data, error } = await supabase
      .from('projects')
      .update({ status: newStatus, updated_at: new Date() })
      .eq('id', projectId)
      .select()

    if (error) throw error

    projectLogger.info('Project status updated', {
      projectId,
      newStatus,
      updatedAt: data[0].updated_at
    })

    return data[0]
  } catch (err) {
    projectLogger.exception(err, {
      projectId,
      newStatus
    })
    throw err
  }
}

export async function getProjectDetails(projectId) {
  const projectLogger = logger.child({
    feature: 'projects',
    action: 'getProjectDetails'
  })

  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        customers(*),
        estimates(*),
        invoices(*)
      `)
      .eq('id', projectId)
      .single()

    if (error) throw error

    projectLogger.info('Project details retrieved', {
      projectId,
      estimateCount: data.estimates?.length || 0,
      invoiceCount: data.invoices?.length || 0
    })

    return data
  } catch (err) {
    projectLogger.exception(err, { projectId })
    throw err
  }
}
```

### Best Practices
- Log parameters without sensitive data
- Track record IDs for auditing
- Log counts of related records
- Include timestamps when operations span time

---

## 3. estimateService.js - Estimates & Quotes

### Integration Pattern
```javascript
import { logger } from './logger'

export async function generateEstimate(projectId, estimateData) {
  const estimateLogger = logger.child({
    feature: 'estimates',
    action: 'generateEstimate'
  })

  estimateLogger.debug('Generating estimate', {
    projectId,
    itemCount: estimateData.items?.length || 0,
    estimatedTotal: estimateData.total_amount
  })

  try {
    // Validate estimate data
    if (!estimateData.items || estimateData.items.length === 0) {
      estimateLogger.warn('Estimate has no items', { projectId })
    }

    const { data, error } = await supabase
      .from('estimates')
      .insert([{
        ...estimateData,
        project_id: projectId,
        created_at: new Date()
      }])
      .select()

    if (error) throw error

    estimateLogger.info('Estimate generated successfully', {
      estimateId: data[0].id,
      projectId,
      itemCount: estimateData.items.length,
      totalAmount: data[0].total_amount,
      status: data[0].status
    })

    return data[0]
  } catch (err) {
    estimateLogger.exception(err, {
      projectId,
      itemCount: estimateData.items?.length || 0
    })
    throw err
  }
}

export async function validateEstimate(estimate) {
  const validationLogger = logger.child({
    feature: 'estimates',
    action: 'validateEstimate'
  })

  const errors = []

  // Validate items
  if (!estimate.items || estimate.items.length === 0) {
    errors.push('No items in estimate')
  }

  // Validate amounts
  estimate.items?.forEach((item, index) => {
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index}: Invalid quantity`)
    }
    if (!item.unit_price || item.unit_price < 0) {
      errors.push(`Item ${index}: Invalid price`)
    }
  })

  if (errors.length > 0) {
    validationLogger.warn('Estimate validation failed', {
      estimateId: estimate.id,
      errorCount: errors.length,
      errors: errors.slice(0, 5) // Log first 5 errors
    })
    return false
  }

  validationLogger.debug('Estimate validation passed', {
    estimateId: estimate.id,
    itemCount: estimate.items.length
  })

  return true
}

export async function sendEstimate(estimateId, recipientEmail) {
  const emailLogger = logger.child({
    feature: 'estimates',
    action: 'sendEstimate'
  })

  emailLogger.debug('Sending estimate', {
    estimateId,
    recipientDomain: recipientEmail.split('@')[1] // Log domain, not full email
  })

  try {
    // Email sending logic
    const response = await sendEmail({
      to: recipientEmail,
      subject: `Estimate ${estimateId}`,
      template: 'estimate'
    })

    emailLogger.info('Estimate sent successfully', {
      estimateId,
      status: response.status,
      messageId: response.messageId
    })

    return response
  } catch (err) {
    emailLogger.exception(err, {
      estimateId,
      recipientDomain: recipientEmail.split('@')[1]
    })
    throw err
  }
}
```

### Key Points
- Log item counts instead of full item details
- Extract domain from email instead of logging full email
- Validation failures are WARN level (expected)
- Exceptions include context for debugging

---

## 4. invoiceService.js - Invoicing & Payments

### Integration Pattern
```javascript
import { logger } from './logger'

export async function createInvoice(projectId, invoiceData) {
  const invoiceLogger = logger.child({
    feature: 'invoices',
    action: 'createInvoice'
  })

  invoiceLogger.debug('Creating invoice', {
    projectId,
    amount: invoiceData.amount,
    dueDate: invoiceData.due_date
  })

  try {
    const { data, error } = await supabase
      .from('project_invoices')
      .insert([{
        ...invoiceData,
        project_id: projectId,
        created_at: new Date(),
        payment_status: 'Pending'
      }])
      .select()

    if (error) throw error

    invoiceLogger.info('Invoice created successfully', {
      invoiceId: data[0].id,
      projectId,
      amount: data[0].amount,
      dueDate: data[0].due_date,
      status: data[0].payment_status
    })

    return data[0]
  } catch (err) {
    invoiceLogger.exception(err, {
      projectId,
      amount: invoiceData.amount
    })
    throw err
  }
}

export async function processPayment(invoiceId, paymentData) {
  const paymentLogger = logger.child({
    feature: 'invoices',
    action: 'processPayment'
  })

  paymentLogger.debug('Processing payment', {
    invoiceId,
    amount: paymentData.amount,
    method: paymentData.payment_method
  })

  try {
    // Process payment with payment gateway
    const paymentResult = await processPaymentWithGateway(paymentData)

    if (!paymentResult.success) {
      paymentLogger.warn('Payment processing failed', {
        invoiceId,
        amount: paymentData.amount,
        reason: paymentResult.reason
      })
      return { success: false, error: paymentResult.reason }
    }

    // Update invoice status
    const { data, error } = await supabase
      .from('project_invoices')
      .update({
        payment_status: 'Paid',
        payment_date: new Date(),
        transaction_id: paymentResult.transactionId
      })
      .eq('id', invoiceId)
      .select()

    if (error) throw error

    paymentLogger.info('Payment processed successfully', {
      invoiceId,
      amount: paymentData.amount,
      transactionId: paymentResult.transactionId,
      method: paymentData.payment_method
    })

    return { success: true, invoice: data[0] }
  } catch (err) {
    paymentLogger.exception(err, {
      invoiceId,
      amount: paymentData.amount,
      method: paymentData.payment_method
    })
    throw err
  }
}

export async function getInvoiceStats() {
  const statsLogger = logger.child({
    feature: 'invoices',
    action: 'getInvoiceStats'
  })

  statsLogger.debug('Calculating invoice statistics')

  try {
    const { data: paidInvoices, error: err1 } = await supabase
      .from('project_invoices')
      .select('amount')
      .eq('payment_status', 'Paid')

    const { data: pendingInvoices, error: err2 } = await supabase
      .from('project_invoices')
      .select('amount')
      .eq('payment_status', 'Pending')

    if (err1 || err2) throw err1 || err2

    const totalPaid = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0)
    const totalPending = pendingInvoices.reduce((sum, i) => sum + (i.amount || 0), 0)

    statsLogger.info('Invoice statistics calculated', {
      paidCount: paidInvoices.length,
      pendingCount: pendingInvoices.length,
      totalPaid,
      totalPending,
      totalRevenue: totalPaid + totalPending
    })

    return {
      paid: { count: paidInvoices.length, total: totalPaid },
      pending: { count: pendingInvoices.length, total: totalPending }
    }
  } catch (err) {
    statsLogger.exception(err, { action: 'calculateStats' })
    throw err
  }
}
```

### Sensitive Data Handling
- Don't log full card numbers (automatically redacted anyway)
- Log payment method name, not sensitive details
- Log transaction IDs for auditing
- Log amounts for financial tracking

---

## 5. customerService.js - Customer Management

### Integration Pattern
```javascript
import { logger } from './logger'

export async function createCustomer(customerData) {
  const customerLogger = logger.child({
    feature: 'customers',
    action: 'createCustomer'
  })

  customerLogger.debug('Creating customer', {
    name: customerData.name,
    city: customerData.city,
    state: customerData.state
  })

  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        ...customerData,
        created_at: new Date()
      }])
      .select()

    if (error) throw error

    customerLogger.info('Customer created successfully', {
      customerId: data[0].id,
      name: data[0].name,
      location: `${data[0].city}, ${data[0].state}`,
      type: data[0].customer_type || 'residential'
    })

    return data[0]
  } catch (err) {
    customerLogger.exception(err, {
      name: customerData.name,
      action: 'insert'
    })
    throw err
  }
}

export async function searchCustomers(query) {
  const searchLogger = logger.child({
    feature: 'customers',
    action: 'searchCustomers'
  })

  searchLogger.debug('Searching customers', {
    queryLength: query.length,
    queryType: /^\d+$/.test(query) ? 'phone' : /[@]/.test(query) ? 'email' : 'name'
  })

  try {
    let q = supabase
      .from('customers')
      .select('id, name, phone, email, city, state')

    // Search by different fields
    if (/^\d+$/.test(query)) {
      q = q.ilike('phone', `%${query}%`)
    } else if (/@/.test(query)) {
      q = q.ilike('email', `%${query}%`)
    } else {
      q = q.ilike('name', `%${query}%`)
    }

    const { data, error } = await q.limit(20)

    if (error) throw error

    searchLogger.info('Customer search completed', {
      queryLength: query.length,
      resultCount: data.length
    })

    return data
  } catch (err) {
    searchLogger.exception(err, {
      queryLength: query.length
    })
    return []
  }
}

export async function updateCustomer(customerId, updates) {
  const customerLogger = logger.child({
    feature: 'customers',
    action: 'updateCustomer'
  })

  const changedFields = Object.keys(updates).filter(
    key => updates[key] !== undefined
  )

  customerLogger.debug('Updating customer', {
    customerId,
    fieldCount: changedFields.length,
    fields: changedFields
  })

  try {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', customerId)
      .select()

    if (error) throw error

    customerLogger.info('Customer updated successfully', {
      customerId,
      fieldsModified: changedFields.length,
      fields: changedFields
    })

    return data[0]
  } catch (err) {
    customerLogger.exception(err, {
      customerId,
      fieldCount: changedFields.length,
      fields: changedFields
    })
    throw err
  }
}

export async function deleteCustomer(customerId) {
  const customerLogger = logger.child({
    feature: 'customers',
    action: 'deleteCustomer'
  })

  customerLogger.warn('Attempting to delete customer', {
    customerId
  })

  try {
    // Check for related records first
    const { data: projects } = await supabase
      .from('projects')
      .select('id')
      .eq('customer_id', customerId)

    if (projects && projects.length > 0) {
      customerLogger.warn('Cannot delete customer with associated projects', {
        customerId,
        projectCount: projects.length
      })
      throw new Error('Customer has associated projects')
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId)

    if (error) throw error

    customerLogger.info('Customer deleted successfully', {
      customerId
    })
  } catch (err) {
    customerLogger.exception(err, { customerId })
    throw err
  }
}
```

### Special Considerations
- Log location (city/state) not sensitive
- Don't log phone numbers or email addresses fully
- Log field names that changed for audit trail
- Warn before destructive operations
- Check dependencies before deletion

---

## Implementation Checklist

- [ ] Add `import { logger } from './logger'` to each service
- [ ] Add child logger at service function start
- [ ] Add debug log at function entry with parameters
- [ ] Add try-catch around Supabase queries
- [ ] Add info log on success with key metrics
- [ ] Add exception log on error
- [ ] Remove old console.error statements
- [ ] Review logs for sensitive data (should be none)
- [ ] Test in development with DEBUG level
- [ ] Test in production with INFO level
- [ ] Verify local storage logs appear
- [ ] Check Sentry integration if configured

---

## Common Patterns Summary

### Function Entry
```javascript
const logger = logger.child({ feature: 'name', action: 'functionName' })
logger.debug('Starting action', { param1, param2 })
```

### Success
```javascript
logger.info('Action completed', { resultId, metric1, metric2 })
```

### Validation Failure
```javascript
logger.warn('Validation failed', { reason, field })
```

### Exception
```javascript
logger.exception(error, { context1, context2 })
```

### Query Results
```javascript
logger.debug('Query result', {
  recordCount: data.length,
  totalSize: calculateSize(data)
})
```
