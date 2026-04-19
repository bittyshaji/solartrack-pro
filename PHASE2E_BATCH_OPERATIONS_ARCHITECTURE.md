# Phase 2E Batch Operations Architecture

## Overview
This document outlines the architecture for CSV/XLSX import and bulk export functionality, enabling administrators to efficiently manage large datasets through file-based operations.

## File Parsing Strategy

### CSV Parsing
- **Library**: Papa Parse (papaparse)
- **Approach**: Streaming parser for large files
- **Features**:
  - Automatic header detection
  - Dynamic type inference
  - Error recovery
  - Chunk-based processing
- **Chunk Size**: 100 records per chunk
- **Memory**: Stream-based to prevent loading entire file

### XLSX Parsing
- **Library**: XLSX (SheetJS)
- **Approach**: Workbook-based parsing with sheet selection
- **Features**:
  - Multiple sheet support
  - Formula evaluation
  - Cell type detection
  - Formatted value extraction
- **Processing**: Load sheet, convert to array, process in chunks

### Parsing Error Handling
- Invalid file format detection
- Character encoding detection (UTF-8, UTF-16, ISO-8859-1)
- BOM (Byte Order Mark) handling
- Empty file validation
- File size limits (50MB max)

## Validation Approach

### Schema Validation
Projects:
```
- name: string, required, min 3 chars, max 255 chars
- customer_id: string, required, must exist in database
- estimated_cost: number, required, positive, max 2 decimals
- state: string, required, enum: ['draft', 'active', 'completed', 'archived']
```

Customers:
```
- customer_id: string, required, unique, alphanumeric, max 20 chars
- name: string, required, min 2 chars, max 255 chars
- email: string, required, valid email format, unique
- phone: string, optional, valid phone format
- address: string, optional, max 500 chars
- city: string, optional, max 100 chars
- state: string, optional, enum US states
- postal_code: string, optional, valid ZIP format
- company: string, optional, max 255 chars
```

Invoices:
```
- project_id: string, required, must exist in database
- amount: number, required, positive, max 2 decimals
- due_date: date, required, valid date, future date preferred
- tax_rate: number, optional, 0-100 decimal range
```

### Constraint Validation
- Unique constraints (email, customer_id)
- Referential integrity (FK checks)
- Type coercion (string to number, date parsing)
- Format validation (email, phone, ZIP)
- Range validation (amounts > 0, tax_rate 0-100)
- Not-null constraints
- Enum constraints

### Validation Pipeline
1. Check data types
2. Check required fields
3. Check field constraints (length, pattern, range)
4. Check format (email, date, phone)
5. Check uniqueness
6. Check referential integrity
7. Generate validation errors with line numbers

### Error Reporting
- Line number reference (Excel row number)
- Field name
- Value that failed
- Specific error reason
- Suggestion for fix (when possible)

## Processing Strategy

### Chunked Processing
- Process 100 records at a time
- Each chunk committed as atomic transaction
- Pause between chunks (100ms) for UI responsiveness
- Allows concurrent UI updates and user cancellation

### Async Processing
- Use worker thread for file parsing
- Use background task queue for import processing
- Non-blocking database operations with await
- Stream progress events to client via WebSocket/SSE

### Transaction Management
- Atomic operations per chunk
- Rollback on validation failure
- Partial success handling (continue on individual errors)
- Atomic database commits per 100-record chunk

### Memory Management
- Stream file instead of loading entirely
- Delete temporary files after processing
- Clear parsed data chunks after processing
- Monitor memory during large imports

## Progress Tracking

### UI Updates
- Real-time progress bar (0-100%)
- Counter: "500 of 1000 records processed"
- Counter: "12 errors encountered"
- Time elapsed
- Estimated time remaining (ETA)
- Throughput: records/second

### Database Progress
- BatchOperation record with:
  - status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  - records_total: number
  - records_processed: number
  - records_failed: number
  - errors_count: number
  - progress_percentage: number
  - started_at: timestamp
  - completed_at: timestamp
  - estimated_completion: timestamp
  - created_by: userId

### Client Updates
- WebSocket events (preferred, real-time)
- Fallback: Server-Sent Events (SSE)
- Polling endpoint: GET /api/batch/:batchId/status (30-second intervals)
- Update UI every 500ms or per 5% progress change

### ETA Calculation
```
elapsed_time = current_time - started_at
records_processed = current_progress
avg_time_per_record = elapsed_time / records_processed
remaining_records = total_records - records_processed
estimated_remaining = avg_time_per_record * remaining_records
estimated_completion = current_time + estimated_remaining
```

## Error Handling and Reporting

### Error Collection
- Don't stop batch on individual record errors
- Collect errors in structured array
- Include row number, field name, value, error reason
- Track error severity (critical, warning, info)

### Error Categories
- **Parse Errors**: File parsing failures
- **Validation Errors**: Schema/constraint violations
- **Database Errors**: Constraint violations, foreign key failures
- **Transformation Errors**: Type coercion failures
- **Referential Integrity Errors**: Missing referenced records

### Error Report Format
```json
{
  "batchId": "batch_12345",
  "totalRecords": 1000,
  "successCount": 985,
  "errorCount": 15,
  "errors": [
    {
      "row": 42,
      "field": "email",
      "value": "invalid-email",
      "error": "Invalid email format",
      "severity": "error"
    }
  ],
  "summary": "15 records failed validation. 985 successfully imported."
}
```

### Error Report Delivery
- Display top 10 errors in UI
- Allow download of complete error report (CSV/JSON)
- Email error report to user on completion
- Store error report in database for history

### User Recovery
- Show exact errors with line numbers
- Allow fixing errors and re-importing
- Support partial retry (failed records only)
- Preserve successful records (no rollback)

## Rollback Strategy

### Atomic Transactions
- Each 100-record chunk: atomic transaction
- All-or-nothing per chunk
- If validation fails: entire chunk rolled back
- If database error: entire chunk rolled back

### Rollback on Critical Errors
- Parse errors: abort entire batch
- Schema validation errors: continue with valid records
- Referential integrity errors: skip record, continue batch
- Database constraint errors: skip record, continue batch

### Data Consistency
- Use database transactions (BEGIN, COMMIT, ROLLBACK)
- Foreign key constraints enabled
- Unique constraints enforced
- Check constraints enforced

### Partial Success Handling
- Successful records committed
- Failed records tracked separately
- User notified of partial success
- Can download report and retry failed records

### Recovery Options
- Resume interrupted import from last successful chunk
- Retry failed records only
- Roll back entire batch (admin action)
- Archive batch for audit trail

## Rate Limiting for Large Imports

### Processing Rate Limits
- 100 records per chunk (user-configurable 50-500)
- 100ms delay between chunks
- 10 concurrent batch operations per system
- 3 concurrent batch operations per user
- Max file size: 50MB

### Database Rate Limits
- Batch insert: 100 records max
- Database connection pooling (max 20 connections)
- Query timeout: 30 seconds per chunk
- Overall operation timeout: 4 hours

### Backpressure Handling
- Queue pending imports
- Pause on high database load
- Monitor memory usage
- Throttle on high CPU utilization

### User Throttling
- Rate limit: 5 imports per hour per user
- Rate limit: 2 exports per hour per user
- Admin can schedule off-peak imports
- API endpoints: X-RateLimit-* headers

## Storage of Temporary Files

### Temporary File Location
- Server: `/tmp/batch-operations/${batchId}/`
- Subdirectories:
  - `/upload/` - uploaded files
  - `/parsed/` - parsed data (JSON chunks)
  - `/errors/` - error reports
  - `/export/` - generated export files

### File Lifecycle
1. Upload → Store in `/upload/`
2. Parse → Store chunks in `/parsed/`
3. Process → Delete `/upload/` and `/parsed/`
4. Export → Store in `/export/`
5. Download → Keep for 7 days
6. Cleanup → Delete after 7 days or on user delete request

### File Security
- Store in inaccessible directory (not public)
- Filename encryption: `${uuid}.enc`
- File ownership: userId
- Access control: owner + admins only
- Delete on completion and error

### Disk Management
- Monitor disk space
- Cleanup old temporary files (>7 days)
- Limit concurrent temporary files
- Stream to database instead of temp files when possible

### Large File Handling
- Files > 10MB: Stream to disk first
- Files > 50MB: Reject with user message
- Progress tracking during upload
- Resumable upload support

## Export File Formatting

### XLSX Format
- **Workbook Structure**:
  - Sheet 1: Data
  - Sheet 2: Summary
  - Sheet 3: Metadata

- **Data Sheet**:
  - Headers: Bold, blue background, white text
  - Columns: Auto-sized
  - Rows: Alternating background (white, light gray)
  - Numbers: Right-aligned, formatted with commas
  - Dates: Format "YYYY-MM-DD"
  - Currency: Format "$#,##0.00"
  - Frozen header row

- **Summary Sheet**:
  - Export date and time
  - Total records count
  - Filters applied
  - Record counts by status
  - Min/max values
  - Aggregate statistics

- **Metadata Sheet**:
  - Generated by (user name)
  - Generated at (timestamp)
  - Export type (projects/customers/invoices)
  - Filters applied
  - Data version
  - Schema version

### Export Filtering
- By status (active, archived, completed)
- By date range (created, updated, due date)
- By amount range (min, max)
- By customer (single or multiple)
- By project (single or multiple)
- By user/owner
- Combination of filters (AND logic)

### Export Columns
**Projects Export**:
- project_id, name, customer_id, customer_name
- estimated_cost, actual_cost, state
- created_at, updated_at, created_by

**Customers Export**:
- customer_id, name, email, phone
- address, city, state, postal_code, company
- created_at, updated_at, project_count

**Invoices Export**:
- invoice_id, project_id, project_name
- amount, tax_rate, total_with_tax
- due_date, status, paid_date, created_at

### File Naming
- Format: `{type}_{timestamp}_{userId}.xlsx`
- Example: `projects_20260415_153045_user123.xlsx`
- Include date in filename for sorting

### Browser Download
- Stream XLSX as blob
- Trigger browser download dialog
- Filename from server
- Support resume on download failure

## Implementation Phases

### Phase 1: Foundation
- Batch operations service core
- CSV/XLSX parsing
- Validation framework
- Database schema

### Phase 2: UI Components
- Import wizard (multi-step)
- Import preview with editing
- Batch status display
- Error reporting

### Phase 3: Refinement
- Export functionality
- Progress tracking websockets
- Error recovery
- Admin dashboard

### Phase 4: Production
- Performance optimization
- Comprehensive testing
- Monitoring and logging
- User documentation

## Technical Stack

### Frontend
- React 18+
- Papa Parse (CSV)
- XLSX library (Excel)
- React Hook Form (validation)
- Framer Motion (animations)

### Backend
- Node.js + Express
- PostgreSQL (transactions)
- BullMQ (job queue)
- WebSocket (real-time updates)

### Libraries
- Joi or Zod (schema validation)
- Multer (file upload)
- Archiver (ZIP files)
- XLSX-populate (XLSX generation)

## Security Considerations

### File Upload Security
- Whitelist file types (CSV, XLSX only)
- Validate MIME types
- Scan for malware
- Limit file size
- Validate file structure

### Data Security
- Encrypt files at rest
- HTTPS for uploads/downloads
- Secure temporary file storage
- Validate all imported data
- Audit all batch operations

### Access Control
- Admin-only operations
- User can only view own batch operations
- Role-based permissions
- Audit logging for all operations

### Data Privacy
- Remove PII from error reports (when possible)
- Don't expose validation logic details
- Secure error messages
- GDPR compliance for exports
