/**
 * Batch Operations Service
 * Handles CSV/XLSX import and bulk export operations
 * Supports projects, customers, and invoices
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import Joi from 'joi';

const BATCH_OPERATIONS_DIR = '/tmp/batch-operations';
const CHUNK_SIZE = 100;
const CHUNK_DELAY = 100; // ms between chunks

/**
 * Create batch operations directory if it doesn't exist
 */
function ensureBatchDir(batchId) {
  const batchDir = path.join(BATCH_OPERATIONS_DIR, batchId);
  if (!fs.existsSync(batchDir)) {
    fs.mkdirSync(batchDir, { recursive: true });
  }
  return batchDir;
}

/**
 * Parse CSV file using Papa Parse
 * @param {File} file - CSV file object
 * @returns {Promise<Array>} - Array of parsed records
 */
export async function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const result = Papa.parse(csv, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim().toLowerCase(),
          error: (error) => {
            reject(new Error(`CSV parsing error: ${error.message}`));
          }
        });

        if (result.errors.length > 0) {
          console.warn('Papa Parse warnings:', result.errors);
        }

        resolve(result.data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsText(file);
  });
}

/**
 * Parse XLSX file using XLSX library
 * @param {File} file - XLSX file object
 * @returns {Promise<Array>} - Array of parsed records
 */
export async function parseXLSXFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });

        // Use first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const records = XLSX.utils.sheet_to_json(worksheet, {
          header: 1 // Get as array first
        });

        if (records.length < 2) {
          reject(new Error('XLSX file must contain headers and at least one data row'));
          return;
        }

        // Convert to object array with lowercase headers
        const headers = records[0].map(h => String(h).trim().toLowerCase());
        const data_rows = records.slice(1).map(row => {
          const obj = {};
          headers.forEach((header, idx) => {
            obj[header] = row[idx];
          });
          return obj;
        });

        resolve(data_rows);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validation schemas
 */
const projectSchema = Joi.object({
  name: Joi.string().required().min(3).max(255).trim(),
  customer_id: Joi.string().required().alphanum().max(20),
  estimated_cost: Joi.number().required().positive().precision(2),
  state: Joi.string().required().valid('draft', 'active', 'completed', 'archived')
});

const customerSchema = Joi.object({
  customer_id: Joi.string().required().alphanum().max(20),
  name: Joi.string().required().min(2).max(255).trim(),
  email: Joi.string().required().email(),
  phone: Joi.string().optional().allow('').pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/),
  address: Joi.string().optional().allow('').max(500),
  city: Joi.string().optional().allow('').max(100),
  state: Joi.string().optional().allow('').valid('AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'),
  postal_code: Joi.string().optional().allow('').pattern(/^[0-9]{5}(-[0-9]{4})?$/),
  company: Joi.string().optional().allow('').max(255)
});

const invoiceSchema = Joi.object({
  project_id: Joi.string().required(),
  amount: Joi.number().required().positive().precision(2),
  due_date: Joi.date().required(),
  tax_rate: Joi.number().optional().min(0).max(100).precision(2)
});

/**
 * Validate project records against schema
 * @param {Array} records - Array of project records
 * @returns {Object} - { valid: [], invalid: [] }
 */
export function validateProjectImport(records) {
  const valid = [];
  const invalid = [];

  records.forEach((record, index) => {
    const { error, value } = projectSchema.validate(record, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      invalid.push({
        row: index + 2, // +2 for header row and 0-based index
        record,
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
          value: d.context.value
        }))
      });
    } else {
      valid.push({ row: index + 2, data: value });
    }
  });

  return { valid, invalid };
}

/**
 * Validate customer records against schema
 * @param {Array} records - Array of customer records
 * @returns {Object} - { valid: [], invalid: [] }
 */
export function validateCustomerImport(records) {
  const valid = [];
  const invalid = [];
  const emails = new Set();
  const customerIds = new Set();

  records.forEach((record, index) => {
    const { error, value } = customerSchema.validate(record, {
      abortEarly: false,
      stripUnknown: true
    });

    let hasUniqueError = false;

    // Check unique constraints
    if (emails.has(value.email)) {
      invalid.push({
        row: index + 2,
        record,
        errors: [{ field: 'email', message: 'Email must be unique', value: value.email }]
      });
      hasUniqueError = true;
    }

    if (customerIds.has(value.customer_id)) {
      invalid.push({
        row: index + 2,
        record,
        errors: [{ field: 'customer_id', message: 'Customer ID must be unique', value: value.customer_id }]
      });
      hasUniqueError = true;
    }

    if (error) {
      invalid.push({
        row: index + 2,
        record,
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
          value: d.context.value
        }))
      });
    } else if (!hasUniqueError) {
      emails.add(value.email);
      customerIds.add(value.customer_id);
      valid.push({ row: index + 2, data: value });
    }
  });

  return { valid, invalid };
}

/**
 * Create batch operation record in database
 * @param {string} userId - User ID
 * @param {string} operationType - 'import_projects', 'import_customers', etc.
 * @param {number} totalRecords - Total records to process
 * @returns {Promise<Object>} - Batch operation record
 */
export async function createBatchOperation(userId, operationType, totalRecords) {
  const batchId = uuidv4();

  const batchOp = {
    id: batchId,
    user_id: userId,
    operation_type: operationType,
    status: 'pending',
    records_total: totalRecords,
    records_processed: 0,
    records_failed: 0,
    errors_count: 0,
    progress_percentage: 0,
    started_at: null,
    completed_at: null,
    estimated_completion: null,
    created_at: new Date(),
    updated_at: new Date()
  };

  // In production: await db.batchOperations.create(batchOp);

  return batchOp;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Process records in chunks with progress tracking
 * @param {Array} records - Records to process
 * @param {string} batchId - Batch operation ID
 * @param {Function} processChunk - Function to process each chunk
 * @param {Function} onProgress - Callback for progress updates
 */
async function processInChunks(records, batchId, processChunk, onProgress) {
  const totalChunks = Math.ceil(records.length / CHUNK_SIZE);
  const errors = [];
  let processedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, records.length);
    const chunk = records.slice(start, end);

    try {
      const result = await processChunk(chunk);

      processedCount += result.successCount || chunk.length;
      failedCount += result.failedCount || 0;

      if (result.errors) {
        errors.push(...result.errors);
      }

      // Update progress
      const progress = Math.round((processedCount / records.length) * 100);
      onProgress({
        batchId,
        processedCount,
        failedCount,
        progress,
        errors: errors.slice(0, 10), // Top 10 errors
        totalErrors: errors.length,
        estimatedRemaining: Math.ceil((records.length - processedCount) / 10) // seconds
      });

      // Delay between chunks to prevent UI blocking
      if (i < totalChunks - 1) {
        await sleep(CHUNK_DELAY);
      }
    } catch (error) {
      errors.push({
        chunk: i,
        error: error.message,
        chunkRecords: chunk
      });
      failedCount += chunk.length;
    }
  }

  return { processedCount, failedCount, errors };
}

/**
 * Import projects from CSV/XLSX data
 * @param {string} userId - User ID
 * @param {Array} csvData - Parsed CSV/XLSX data
 * @param {Object} options - { onProgress, existingCustomerIds }
 * @returns {Promise<Object>} - Import results
 */
export async function importProjects(userId, csvData, options = {}) {
  const { onProgress = () => {}, existingCustomerIds = [] } = options;

  const batchOp = await createBatchOperation(userId, 'import_projects', csvData.length);
  const batchId = batchOp.id;

  // Validate all records
  const { valid, invalid } = validateProjectImport(csvData);

  // Check customer references
  const validatedRecords = [];
  const referenceErrors = [];

  for (const validRecord of valid) {
    if (!existingCustomerIds.includes(validRecord.data.customer_id)) {
      referenceErrors.push({
        row: validRecord.row,
        field: 'customer_id',
        message: `Customer ID '${validRecord.data.customer_id}' does not exist`,
        value: validRecord.data.customer_id
      });
    } else {
      validatedRecords.push(validRecord.data);
    }
  }

  all Errors.push(...referenceErrors);
  const allErrors = [...invalid.flatMap(i => i.errors.map(e => ({ ...e, row: i.row }))), ...referenceErrors];

  // Process valid records in chunks
  const processChunk = async (chunk) => {
    try {
      // In production: await db.projects.createMany(chunk);
      return {
        successCount: chunk.length,
        failedCount: 0
      };
    } catch (error) {
      return {
        successCount: 0,
        failedCount: chunk.length,
        errors: [{ message: error.message }]
      };
    }
  };

  const results = await processInChunks(validatedRecords, batchId, processChunk, onProgress);

  return {
    batchId,
    status: 'completed',
    successCount: results.processedCount,
    failedCount: results.failedCount + referenceErrors.length + invalid.length,
    totalRecords: csvData.length,
    errors: allErrors,
    summary: `Successfully imported ${results.processedCount} projects. ${results.failedCount} records failed.`
  };
}

/**
 * Import customers from CSV/XLSX data
 * @param {string} userId - User ID
 * @param {Array} csvData - Parsed CSV/XLSX data
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - Import results
 */
export async function importCustomers(userId, csvData, onProgress = () => {}) {
  const batchOp = await createBatchOperation(userId, 'import_customers', csvData.length);
  const batchId = batchOp.id;

  // Validate all records
  const { valid, invalid } = validateCustomerImport(csvData);

  const allErrors = invalid.flatMap(i => i.errors.map(e => ({ ...e, row: i.row })));

  // Process valid records in chunks
  const processChunk = async (chunk) => {
    try {
      // In production: await db.customers.createMany(chunk);
      return {
        successCount: chunk.length,
        failedCount: 0
      };
    } catch (error) {
      return {
        successCount: 0,
        failedCount: chunk.length,
        errors: [{ message: error.message }]
      };
    }
  };

  const results = await processInChunks(valid.map(v => v.data), batchId, processChunk, onProgress);

  return {
    batchId,
    status: 'completed',
    successCount: results.processedCount,
    failedCount: results.failedCount + invalid.length,
    totalRecords: csvData.length,
    errors: allErrors,
    summary: `Successfully imported ${results.processedCount} customers. ${results.failedCount} records failed.`
  };
}

/**
 * Bulk create invoices from template
 * @param {Array} projectIds - Project IDs to create invoices for
 * @param {Object} templateData - { amount, dueDate, taxRate }
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} - Creation results
 */
export async function batchCreateInvoices(projectIds, templateData, onProgress = () => {}) {
  const batchOp = await createBatchOperation('system', 'batch_create_invoices', projectIds.length);
  const batchId = batchOp.id;

  // Create invoice records from template
  const invoiceRecords = projectIds.map(projectId => ({
    project_id: projectId,
    amount: templateData.amount,
    due_date: templateData.dueDate,
    tax_rate: templateData.taxRate || 0
  }));

  const { valid, invalid } = invoiceRecords.reduce((acc, record, idx) => {
    const { error, value } = invoiceSchema.validate(record);
    if (error) {
      acc.invalid.push({ row: idx + 2, record, errors: error.details });
    } else {
      acc.valid.push({ row: idx + 2, data: value });
    }
    return acc;
  }, { valid: [], invalid: [] });

  const processChunk = async (chunk) => {
    try {
      // In production: await db.invoices.createMany(chunk);
      return { successCount: chunk.length, failedCount: 0 };
    } catch (error) {
      return { successCount: 0, failedCount: chunk.length, errors: [{ message: error.message }] };
    }
  };

  const results = await processInChunks(valid.map(v => v.data), batchId, processChunk, onProgress);

  return {
    batchId,
    successCount: results.processedCount,
    failedCount: results.failedCount + invalid.length,
    totalRecords: projectIds.length,
    errors: invalid.flatMap(i => i.errors.map(e => ({ ...e, row: i.row })))
  };
}

/**
 * Export projects to XLSX
 * @param {Object} filters - { status, dateRange, customerId }
 * @param {Function} generateXLSX - XLSX generation function
 * @returns {Promise<Blob>} - XLSX file blob
 */
export async function exportProjects(filters = {}, generateXLSX) {
  // In production: const projects = await db.projects.find(filters);
  const projects = [];

  const headers = ['ID', 'Name', 'Customer ID', 'Customer', 'Estimated Cost', 'Status', 'Created', 'Updated'];
  const filename = `projects_${Date.now()}.xlsx`;

  return generateXLSX({
    data: projects,
    headers,
    sheetName: 'Projects',
    filename
  });
}

/**
 * Export customers to XLSX
 * @param {Object} filters - Filter options
 * @param {Function} generateXLSX - XLSX generation function
 * @returns {Promise<Blob>} - XLSX file blob
 */
export async function exportCustomers(filters = {}, generateXLSX) {
  // In production: const customers = await db.customers.find(filters);
  const customers = [];

  const headers = ['ID', 'Name', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP', 'Company', 'Created'];
  const filename = `customers_${Date.now()}.xlsx`;

  return generateXLSX({
    data: customers,
    headers,
    sheetName: 'Customers',
    filename
  });
}

/**
 * Export invoices to XLSX
 * @param {Object} filters - { dateRange, status, projectId }
 * @param {Function} generateXLSX - XLSX generation function
 * @returns {Promise<Blob>} - XLSX file blob
 */
export async function exportInvoices(filters = {}, generateXLSX) {
  // In production: const invoices = await db.invoices.find(filters);
  const invoices = [];

  const headers = ['ID', 'Project', 'Amount', 'Tax Rate', 'Total', 'Due Date', 'Status', 'Created'];
  const filename = `invoices_${Date.now()}.xlsx`;

  return generateXLSX({
    data: invoices,
    headers,
    sheetName: 'Invoices',
    filename
  });
}

/**
 * Get batch operation status
 * @param {string} batchId - Batch ID
 * @returns {Promise<Object>} - Batch operation details
 */
export async function getBatchOperationStatus(batchId) {
  // In production: return db.batchOperations.findById(batchId);
  return {
    id: batchId,
    status: 'processing',
    progress_percentage: 45,
    records_processed: 450,
    records_total: 1000,
    records_failed: 5,
    estimated_completion: new Date(Date.now() + 60000)
  };
}

/**
 * Cancel batch operation
 * @param {string} batchId - Batch ID
 * @returns {Promise<Object>} - Updated batch operation
 */
export async function cancelBatchOperation(batchId) {
  // In production:
  // const batchOp = await db.batchOperations.findById(batchId);
  // batchOp.status = 'cancelled';
  // await batchOp.save();

  return {
    id: batchId,
    status: 'cancelled',
    cancelled_at: new Date()
  };
}

/**
 * Get error report for batch operation
 * @param {string} batchId - Batch ID
 * @returns {Promise<Object>} - Error report
 */
export async function getBatchErrorReport(batchId) {
  // In production: const errors = await db.batchErrors.find({ batch_id: batchId });
  const errors = [];

  return {
    batchId,
    totalErrors: errors.length,
    errors: errors.slice(0, 100),
    downloadUrl: `/api/batch/${batchId}/errors/download`
  };
}

/**
 * Cleanup temporary files for batch operation
 * @param {string} batchId - Batch ID
 */
export async function cleanupBatchFiles(batchId) {
  const batchDir = path.join(BATCH_OPERATIONS_DIR, batchId);

  if (fs.existsSync(batchDir)) {
    fs.rmSync(batchDir, { recursive: true, force: true });
  }
}

export default {
  parseCSVFile,
  parseXLSXFile,
  validateProjectImport,
  validateCustomerImport,
  createBatchOperation,
  importProjects,
  importCustomers,
  batchCreateInvoices,
  exportProjects,
  exportCustomers,
  exportInvoices,
  getBatchOperationStatus,
  cancelBatchOperation,
  getBatchErrorReport,
  cleanupBatchFiles
};
