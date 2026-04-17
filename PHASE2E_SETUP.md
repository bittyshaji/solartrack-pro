# Phase 2E Setup Guide: Batch Operations

## Overview

This guide covers the setup and configuration of the Phase 2E Batch Operations system, which enables bulk import and export functionality for projects, customers, and invoices.

## Dependencies

### Frontend Libraries

```bash
npm install papaparse xlsx xlsx-populate uuid framer-motion
```

**Library Versions:**
- `papaparse`: ^5.4.1 - CSV parsing with streaming support
- `xlsx`: ^0.18.5 - Excel file reading/writing
- `xlsx-populate`: ^1.21.2 - Advanced XLSX formatting
- `uuid`: ^9.0.0 - Unique ID generation
- `framer-motion`: ^10.16.4 - Animations

### Backend Libraries

```bash
npm install joi multer cors express-fileupload
```

**Library Versions:**
- `joi`: ^17.11.0 - Schema validation
- `multer`: ^1.4.5-lts.1 - File upload handling
- `cors`: ^2.8.5 - CORS middleware
- `express-fileupload`: ^1.5.0 - Alternative file upload

### Optional (for job queue support)

```bash
npm install bullmq redis ioredis
```

For large-scale imports, use BullMQ for background job processing.

## File Structure

```
src/
├── lib/
│   ├── batchOperationsService.js      # Core batch operations
│   ├── batchExportService.js          # XLSX export functionality
│   └── batchValidationSchemas.js      # Validation schemas (optional)
├── components/
│   ├── batch/
│   │   ├── CSVImportWizard.jsx        # Multi-step import wizard
│   │   ├── ImportPreview.jsx          # Data preview/edit component
│   │   ├── BatchOperationStatus.jsx   # Real-time status display
│   │   ├── CSVImportWizard.css        # Wizard styling
│   │   ├── ImportPreview.css          # Preview styling
│   │   └── BatchOperationStatus.css   # Status styling
├── pages/
│   ├── BatchOperationsPage.jsx        # Admin dashboard
│   └── BatchOperationsPage.css        # Dashboard styling
├── api/
│   ├── batch/
│   │   ├── routes.js                  # API endpoints
│   │   ├── middleware.js              # Auth/validation middleware
│   │   └── controllers.js             # Request handlers
└── data/
    └── samples/
        ├── projects_sample.csv        # Sample projects CSV
        ├── customers_sample.csv       # Sample customers CSV
        └── invoices_sample.csv        # Sample invoices CSV

/tmp/batch-operations/                # Temporary file storage
├── {batchId}/
│   ├── upload/                        # Uploaded files
│   ├── parsed/                        # Parsed data chunks
│   ├── errors/                        # Error reports
│   └── export/                        # Generated exports
```

## Configuration

### Environment Variables

```bash
# .env
BATCH_OPERATIONS_DIR=/tmp/batch-operations
CHUNK_SIZE=100
CHUNK_DELAY_MS=100
MAX_FILE_SIZE=52428800  # 50MB
TEMP_FILE_RETENTION_DAYS=7
MAX_CONCURRENT_OPERATIONS=10
MAX_OPERATIONS_PER_USER=3

# Email notifications (optional)
BATCH_NOTIFICATIONS_ENABLED=true
BATCH_NOTIFICATION_EMAIL=admin@example.com

# Job queue (optional)
REDIS_URL=redis://localhost:6379
ENABLE_JOB_QUEUE=false
```

### Database Schema

#### BatchOperations Table

```sql
CREATE TABLE batch_operations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  operation_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  records_total INTEGER,
  records_processed INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_completion TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

CREATE TABLE batch_errors (
  id UUID PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES batch_operations(id),
  row_number INTEGER,
  field_name VARCHAR(100),
  value TEXT,
  error_message TEXT,
  severity VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_batch_id (batch_id)
);
```

## File Upload Configuration

### Express Setup

```javascript
// server/middleware/fileUpload.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const batchDir = path.join(
      process.env.BATCH_OPERATIONS_DIR,
      req.params.batchId || uuidv4(),
      'upload'
    );
    
    // Create directory if not exists
    fs.mkdirSync(batchDir, { recursive: true });
    cb(null, batchDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV and XLSX allowed.'));
  }
};

export const uploadBatchFile = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024
  }
});
```

### Route Handler

```javascript
// server/api/batch/routes.js
import express from 'express';
import { uploadBatchFile } from '@/middleware/fileUpload';
import { authenticateUser, requireAdmin } from '@/middleware/auth';
import {
  parseCSVFile,
  parseXLSXFile,
  validateProjectImport,
  importProjects
} from '@/lib/batchOperationsService';

const router = express.Router();

router.post(
  '/import',
  authenticateUser,
  requireAdmin,
  uploadBatchFile.single('file'),
  async (req, res) => {
    try {
      const { importType } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Parse file
      let parsedData;
      if (file.mimetype === 'text/csv') {
        parsedData = await parseCSVFile(file);
      } else {
        parsedData = await parseXLSXFile(file);
      }

      // Validate data
      const validationResults = importType === 'projects'
        ? validateProjectImport(parsedData)
        : validateCustomerImport(parsedData);

      // Return validation results
      res.json({
        success: true,
        data: parsedData.slice(0, 10),
        validationResults,
        totalRecords: parsedData.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;
```

## Temporary File Storage

### Memory Optimization

For files larger than 10MB:

```javascript
// Stream to disk instead of memory
const fs = require('fs').promises;

async function streamLargeFile(filePath, onChunk) {
  const chunkSize = 1024 * 1024; // 1MB chunks
  let position = 0;

  while (position < fileSize) {
    const chunk = await fs.read(filePath, { position, length: chunkSize });
    await onChunk(chunk);
    position += chunkSize;
  }
}
```

### Cleanup Strategy

```javascript
// Clean up old temporary files every hour
setInterval(async () => {
  const batchDir = process.env.BATCH_OPERATIONS_DIR;
  const dirs = await fs.promises.readdir(batchDir);
  const retentionMs = parseInt(process.env.TEMP_FILE_RETENTION_DAYS) * 86400000;

  for (const dir of dirs) {
    const fullPath = path.join(batchDir, dir);
    const stats = await fs.promises.stat(fullPath);
    
    if (Date.now() - stats.mtime.getTime() > retentionMs) {
      await fs.promises.rm(fullPath, { recursive: true, force: true });
    }
  }
}, 60 * 60 * 1000); // Run hourly
```

## Browser Compatibility

### Tested Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills Required

For older browsers, add polyfills for:
- `fetch` API
- `Blob` and `URL.createObjectURL`
- `Promise`

```html
<script src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3/dist/fetch.umd.js"></script>
```

## Memory Management

### Large File Handling

```javascript
// Process CSV in chunks using streams
import { Transform } from 'stream';
import Papa from 'papaparse';

export async function processLargeCSV(filePath, onChunk) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    
    const csvParser = new Transform({
      transform(chunk, encoding, callback) {
        const csv = chunk.toString();
        const parsed = Papa.parse(csv, {
          header: true,
          skipEmptyLines: true
        });
        
        onChunk(parsed.data);
        callback();
      }
    });

    fileStream
      .pipe(csvParser)
      .on('finish', resolve)
      .on('error', reject);
  });
}
```

### Memory Monitoring

```javascript
// Monitor memory usage during import
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory usage:');
  for (let key in used) {
    console.log(`${key} ${Math.round(used[key] / 1024 / 1024)} MB`);
  }
  
  // Trigger GC if memory exceeds threshold
  if (used.heapUsed / used.heapTotal > 0.9) {
    console.warn('Memory usage high, consider pausing imports');
  }
}, 30000); // Check every 30 seconds
```

## Testing Data

### Sample Projects CSV

```csv
name,customer_id,estimated_cost,state
Solar Panel Installation,CUST001,15000.00,active
Roof Repair,CUST002,5000.00,draft
System Upgrade,CUST001,8500.00,completed
```

### Sample Customers CSV

```csv
customer_id,name,email,phone,address,city,state,postal_code,company
CUST001,John Smith,john@example.com,555-0101,123 Main St,Denver,CO,80202,ABC Corp
CUST002,Jane Doe,jane@example.com,555-0102,456 Oak Ave,Boulder,CO,80301,XYZ Inc
CUST003,Bob Wilson,bob@example.com,555-0103,789 Pine Rd,Fort Collins,CO,80524,123 Ltd
```

### Sample Invoices CSV

```csv
project_id,amount,due_date,tax_rate
proj_001,15000.00,2026-05-15,9.00
proj_002,5000.00,2026-04-30,9.00
proj_003,8500.00,2026-06-01,9.00
```

Download sample files from: `/data/samples/`

## Performance Optimization

### Chunk Processing

- Default chunk size: 100 records
- Configurable via `CHUNK_SIZE` env variable
- Increase for powerful servers, decrease for limited resources

### Database Optimization

```sql
-- Add indexes for faster lookups
CREATE INDEX idx_customer_email ON customers(email);
CREATE INDEX idx_customer_id ON customers(customer_id);
CREATE INDEX idx_project_customer ON projects(customer_id);
CREATE INDEX idx_project_state ON projects(state);

-- Create partial indexes for common filters
CREATE INDEX idx_projects_active ON projects(id) WHERE state = 'active';
CREATE INDEX idx_invoices_unpaid ON invoices(id) WHERE status != 'paid';
```

### API Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const importLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 imports per hour
  keyGenerator: (req) => req.user.id
});

router.post('/import', importLimiter, async (req, res) => {
  // Handle import
});
```

## Security Considerations

### File Validation

- Validate file type (MIME type + extension)
- Scan uploaded files for malware
- Limit file size to 50MB
- Check file structure before parsing

### Data Security

- Encrypt files at rest
- Use HTTPS for all transfers
- Validate all imported data
- Sanitize error messages
- Log all batch operations

### Access Control

```javascript
// Require admin role for all batch operations
export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}

// Verify user owns the batch operation
export async function verifyBatchOwnership(req, res, next) {
  const batch = await db.batchOperations.findById(req.params.batchId);
  if (batch.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  next();
}
```

## Monitoring and Logging

### Activity Logging

```javascript
// Log all batch operations
async function logBatchOperation(operation) {
  await db.auditLog.create({
    user_id: operation.user_id,
    action: 'batch_operation',
    operation_type: operation.operation_type,
    records_processed: operation.records_processed,
    errors: operation.records_failed,
    timestamp: new Date(),
    ip_address: getClientIP()
  });
}
```

### Error Tracking

```javascript
// Send errors to monitoring service
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// In error handler
catch (error) {
  Sentry.captureException(error, {
    tags: {
      batch_id: batchId,
      operation_type: operationType
    }
  });
}
```

## Troubleshooting

### Common Issues

**Issue: Out of memory during large imports**
- Solution: Reduce `CHUNK_SIZE` to 50 or less
- Enable job queue with Redis for background processing
- Process in multiple smaller batches

**Issue: Validation fails silently**
- Solution: Check browser console for errors
- Verify schema definitions match data
- Test with sample files first

**Issue: Exports are slow**
- Solution: Use async generation with streaming
- Create database indexes on filtered columns
- Consider pagination for very large exports

**Issue: Files not cleaning up**
- Solution: Check file permissions on temp directory
- Verify cleanup interval is running
- Manually remove `/tmp/batch-operations` if needed

## Deployment Checklist

- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables configured
- [ ] Database tables created
- [ ] Temporary file directory created (`/tmp/batch-operations`)
- [ ] File upload endpoint tested
- [ ] Import/export workflows tested with sample data
- [ ] Error handling verified
- [ ] Rate limiting configured
- [ ] Monitoring/logging configured
- [ ] Documentation reviewed
- [ ] Sample files accessible
- [ ] Admin role verification working

## Next Steps

1. Install dependencies: `npm install papaparse xlsx framer-motion`
2. Configure environment variables
3. Create database tables
4. Add routes to your API
5. Test with sample CSV files
6. Deploy to staging
7. Conduct user acceptance testing
8. Deploy to production

## Support

For issues or questions:
- Check troubleshooting section above
- Review browser console for errors
- Check server logs for API errors
- Verify file format matches samples
- Test with smaller files first
