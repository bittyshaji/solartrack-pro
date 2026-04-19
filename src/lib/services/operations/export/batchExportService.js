/**
 * Batch Export Service
 * Handles generation and formatting of XLSX export files
 * Phase 4: Uses dynamic imports for XLSX to reduce bundle size
 */

import { loadXLSX, loadXLSXPopulate } from '../dynamicImports';

/**
 * Format workbook with styling and formatting
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Column headers
 * @param {Object} options - Formatting options
 * @returns {Promise<Workbook>} - Formatted XLSX workbook
 */
export async function formatXLSXWorkbook(data, headers, options = {}) {
  const XLSX = await loadXLSX();
  const {
    sheetName = 'Data',
    headerStyle = {},
    dataStyle = {},
    columnWidths = {},
    freezeRows = 1
  } = options;

  // Create workbook
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });

  // Set column widths
  const colWidths = headers.map((header) => {
    return columnWidths[header] || { wch: Math.max(10, header.length + 2) };
  });
  ws['!cols'] = colWidths;

  // Set freeze panes
  ws['!freeze'] = { xSplit: 0, ySplit: freezeRows };

  // Apply header styling
  headers.forEach((header, idx) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: idx });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        fill: { fgColor: { rgb: '4472C4' } },
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
      };
    }
  });

  // Apply data row styling
  const rowCount = data.length;
  for (let i = 1; i <= rowCount; i++) {
    // Alternate row colors
    const bgColor = i % 2 === 0 ? 'F2F2F2' : 'FFFFFF';

    headers.forEach((header, idx) => {
      const cellRef = XLSX.utils.encode_cell({ r: i, c: idx });
      if (ws[cellRef]) {
        ws[cellRef].s = {
          fill: { fgColor: { rgb: bgColor } },
          alignment: { horizontal: 'left', vertical: 'center' }
        };

        // Apply number formatting for amounts/currency
        if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('cost') ||
            header.toLowerCase().includes('price') || header.toLowerCase().includes('total')) {
          ws[cellRef].z = '$#,##0.00';
        }

        // Apply date formatting
        if (header.toLowerCase().includes('date') || header.toLowerCase().includes('_at')) {
          ws[cellRef].z = 'yyyy-mm-dd';
        }
      }
    });
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  return wb;
}

/**
 * Create summary sheet with statistics
 * @param {Array} data - Data array
 * @param {string} dataType - Type of data (projects, customers, invoices)
 * @returns {Array} - Summary data for sheet
 */
function createSummarySheet(data, dataType) {
  const summary = {
    'Export Summary': '',
    'Data Type': dataType,
    'Total Records': data.length,
    'Export Date': new Date().toISOString(),
    'Export Time': new Date().toLocaleTimeString(),
    '': '',
    'Statistics': ''
  };

  if (dataType === 'projects') {
    const states = {};
    let totalCost = 0;

    data.forEach(proj => {
      states[proj.state || 'unknown'] = (states[proj.state || 'unknown'] || 0) + 1;
      totalCost += proj.estimated_cost || 0;
    });

    summary['Total Estimated Cost'] = `$${totalCost.toFixed(2)}`;
    Object.entries(states).forEach(([state, count]) => {
      summary[`Projects - ${state}`] = count;
    });
  }

  if (dataType === 'customers') {
    summary['Active Customers'] = data.length;
  }

  if (dataType === 'invoices') {
    let totalAmount = 0;
    let paidCount = 0;
    let overdueCount = 0;

    data.forEach(inv => {
      totalAmount += inv.amount || 0;
      if (inv.status === 'paid') paidCount++;
      if (inv.status === 'overdue') overdueCount++;
    });

    summary['Total Amount'] = `$${totalAmount.toFixed(2)}`;
    summary['Paid Invoices'] = paidCount;
    summary['Overdue Invoices'] = overdueCount;
  }

  return summary;
}

/**
 * Generate projects XLSX export
 * @param {Array} projects - Project records
 * @param {Object} filters - Applied filters
 * @returns {Blob} - XLSX file blob
 */
export function generateProjectsXLSX(projects = [], filters = {}) {
  const headers = ['ID', 'Name', 'Customer ID', 'Customer', 'Estimated Cost', 'Status', 'Created', 'Updated'];

  const data = projects.map(proj => ({
    'ID': proj.id,
    'Name': proj.name,
    'Customer ID': proj.customer_id,
    'Customer': proj.customer_name || '',
    'Estimated Cost': proj.estimated_cost || 0,
    'Status': proj.state || '',
    'Created': new Date(proj.created_at).toISOString().split('T')[0],
    'Updated': new Date(proj.updated_at).toISOString().split('T')[0]
  }));

  const columnWidths = {
    'ID': { wch: 15 },
    'Name': { wch: 30 },
    'Customer ID': { wch: 15 },
    'Customer': { wch: 25 },
    'Estimated Cost': { wch: 15 },
    'Status': { wch: 15 },
    'Created': { wch: 12 },
    'Updated': { wch: 12 }
  };

  const wb = formatXLSXWorkbook(data, headers, {
    sheetName: 'Projects',
    columnWidths,
    freezeRows: 1
  });

  // Add summary sheet
  const summary = createSummarySheet(projects, 'projects');
  const summarySheet = XLSX.utils.json_to_sheet([summary]);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Add metadata sheet
  const metadata = {
    'Export Metadata': '',
    'Generated At': new Date().toISOString(),
    'Data Type': 'Projects',
    'Total Records': projects.length,
    'Filters Applied': JSON.stringify(filters),
    'Schema Version': '1.0'
  };
  const metadataSheet = XLSX.utils.json_to_sheet([metadata]);
  XLSX.utils.book_append_sheet(wb, metadataSheet, 'Metadata');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

/**
 * Generate customers XLSX export
 * @param {Array} customers - Customer records
 * @param {Object} filters - Applied filters
 * @returns {Blob} - XLSX file blob
 */
export function generateCustomersXLSX(customers = [], filters = {}) {
  const headers = ['ID', 'Customer ID', 'Name', 'Email', 'Phone', 'Address', 'City', 'State', 'ZIP', 'Company', 'Created'];

  const data = customers.map(cust => ({
    'ID': cust.id,
    'Customer ID': cust.customer_id,
    'Name': cust.name,
    'Email': cust.email,
    'Phone': cust.phone || '',
    'Address': cust.address || '',
    'City': cust.city || '',
    'State': cust.state || '',
    'ZIP': cust.postal_code || '',
    'Company': cust.company || '',
    'Created': new Date(cust.created_at).toISOString().split('T')[0]
  }));

  const columnWidths = {
    'ID': { wch: 15 },
    'Customer ID': { wch: 15 },
    'Name': { wch: 25 },
    'Email': { wch: 25 },
    'Phone': { wch: 15 },
    'Address': { wch: 30 },
    'City': { wch: 15 },
    'State': { wch: 8 },
    'ZIP': { wch: 12 },
    'Company': { wch: 20 },
    'Created': { wch: 12 }
  };

  const wb = formatXLSXWorkbook(data, headers, {
    sheetName: 'Customers',
    columnWidths,
    freezeRows: 1
  });

  // Add summary sheet
  const summary = createSummarySheet(customers, 'customers');
  const summarySheet = XLSX.utils.json_to_sheet([summary]);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Add metadata sheet
  const metadata = {
    'Export Metadata': '',
    'Generated At': new Date().toISOString(),
    'Data Type': 'Customers',
    'Total Records': customers.length,
    'Filters Applied': JSON.stringify(filters),
    'Schema Version': '1.0'
  };
  const metadataSheet = XLSX.utils.json_to_sheet([metadata]);
  XLSX.utils.book_append_sheet(wb, metadataSheet, 'Metadata');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

/**
 * Generate invoices XLSX export
 * @param {Array} invoices - Invoice records
 * @param {Object} filters - Applied filters
 * @returns {Blob} - XLSX file blob
 */
export function generateInvoicesXLSX(invoices = [], filters = {}) {
  const headers = ['ID', 'Project ID', 'Project', 'Amount', 'Tax Rate', 'Total with Tax', 'Due Date', 'Status', 'Paid Date', 'Created'];

  const data = invoices.map(inv => {
    const amount = inv.amount || 0;
    const taxRate = (inv.tax_rate || 0) / 100;
    const totalWithTax = amount * (1 + taxRate);

    return {
      'ID': inv.id,
      'Project ID': inv.project_id,
      'Project': inv.project_name || '',
      'Amount': amount,
      'Tax Rate': `${inv.tax_rate || 0}%`,
      'Total with Tax': totalWithTax,
      'Due Date': new Date(inv.due_date).toISOString().split('T')[0],
      'Status': inv.status || '',
      'Paid Date': inv.paid_date ? new Date(inv.paid_date).toISOString().split('T')[0] : '',
      'Created': new Date(inv.created_at).toISOString().split('T')[0]
    };
  });

  const columnWidths = {
    'ID': { wch: 15 },
    'Project ID': { wch: 15 },
    'Project': { wch: 25 },
    'Amount': { wch: 15 },
    'Tax Rate': { wch: 12 },
    'Total with Tax': { wch: 15 },
    'Due Date': { wch: 12 },
    'Status': { wch: 12 },
    'Paid Date': { wch: 12 },
    'Created': { wch: 12 }
  };

  const wb = formatXLSXWorkbook(data, headers, {
    sheetName: 'Invoices',
    columnWidths,
    freezeRows: 1
  });

  // Add summary sheet
  const summary = createSummarySheet(invoices, 'invoices');
  const summarySheet = XLSX.utils.json_to_sheet([summary]);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Add metadata sheet
  const metadata = {
    'Export Metadata': '',
    'Generated At': new Date().toISOString(),
    'Data Type': 'Invoices',
    'Total Records': invoices.length,
    'Filters Applied': JSON.stringify(filters),
    'Schema Version': '1.0'
  };
  const metadataSheet = XLSX.utils.json_to_sheet([metadata]);
  XLSX.utils.book_append_sheet(wb, metadataSheet, 'Metadata');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

/**
 * Download file to browser
 * @param {Uint8Array} fileData - File data
 * @param {string} filename - Filename for download
 */
export function downloadFile(fileData, filename) {
  const blob = new Blob([fileData], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Create error report XLSX
 * @param {Array} errors - Error records
 * @returns {Blob} - XLSX file blob
 */
export function generateErrorReportXLSX(errors = []) {
  const headers = ['Row Number', 'Field', 'Value', 'Error Message', 'Severity'];

  const data = errors.map(err => ({
    'Row Number': err.row,
    'Field': err.field,
    'Value': err.value || '',
    'Error Message': err.message,
    'Severity': err.severity || 'error'
  }));

  const columnWidths = {
    'Row Number': { wch: 12 },
    'Field': { wch: 20 },
    'Value': { wch: 25 },
    'Error Message': { wch: 40 },
    'Severity': { wch: 12 }
  };

  const wb = formatXLSXWorkbook(data, headers, {
    sheetName: 'Errors',
    columnWidths,
    freezeRows: 1
  });

  // Add summary
  const summary = {
    'Error Report': '',
    'Generated At': new Date().toISOString(),
    'Total Errors': errors.length,
    '': '',
    'By Severity': ''
  };

  const severities = {};
  errors.forEach(err => {
    const sev = err.severity || 'error';
    severities[sev] = (severities[sev] || 0) + 1;
  });

  Object.entries(severities).forEach(([sev, count]) => {
    summary[sev] = count;
  });

  const summarySheet = XLSX.utils.json_to_sheet([summary]);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

export default {
  formatXLSXWorkbook,
  generateProjectsXLSX,
  generateCustomersXLSX,
  generateInvoicesXLSX,
  downloadFile,
  generateErrorReportXLSX
};
