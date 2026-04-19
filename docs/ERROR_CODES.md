# SolarTrack Pro - Error Codes Reference

**Complete list of application error codes**

## Authentication Errors (AUTH_)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| AUTH_001 | Invalid credentials | Email/password incorrect | Check credentials and retry |
| AUTH_002 | Account not approved | Admin hasn't approved account yet | Wait for approval or contact admin |
| AUTH_003 | Session expired | JWT token expired | Logout and login again |
| AUTH_004 | Email not verified | User hasn't verified email | Click link in verification email |
| AUTH_005 | Account locked | Too many failed login attempts | Request account unlock via email |
| AUTH_006 | Password too weak | Password doesn't meet requirements | Use stronger password (8+, mixed case, number, special char) |
| AUTH_007 | Email already exists | Another account uses this email | Try different email or use password reset |
| AUTH_008 | OAuth provider error | OAuth provider (Google, etc.) error | Try again or contact support |
| AUTH_009 | Verification token expired | Email verification token older than 24h | Request new verification email |

## Validation Errors (VALIDATION_)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| VALIDATION_001 | Invalid input | One or more fields invalid | Check field errors in form |
| VALIDATION_002 | Required field missing | Required field is empty | Fill in required fields |
| VALIDATION_003 | Invalid email format | Email doesn't match email regex | Enter valid email address |
| VALIDATION_004 | Invalid phone format | Phone number format incorrect | Enter valid phone number |
| VALIDATION_005 | Value out of range | Number outside acceptable range | Enter value within range |
| VALIDATION_006 | String too long | Text exceeds max length | Reduce text length |
| VALIDATION_007 | Invalid date | Date format incorrect or in past | Enter valid future date |
| VALIDATION_008 | Duplicated value | Value already exists | Use unique value |

## Permission Errors (PERMISSION_)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| PERMISSION_001 | Access denied | User lacks permission | Contact admin or project owner |
| PERMISSION_002 | Not project member | User not member of project | Request to be added to project |
| PERMISSION_003 | Insufficient role | User role doesn't allow action | Contact admin for higher permissions |
| PERMISSION_004 | Cannot delete | Cannot delete this resource | Resource may be in use |
| PERMISSION_005 | Read-only access | Cannot modify in current state | Check resource status |

## Resource Errors (RESOURCE_)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| RESOURCE_001 | Not found | Resource doesn't exist | Check ID and try again |
| RESOURCE_002 | Customer not found | Customer ID invalid | Select valid customer |
| RESOURCE_003 | Project not found | Project ID invalid | Select valid project |
| RESOURCE_004 | Invoice not found | Invoice ID invalid | Check invoice number |
| RESOURCE_005 | Already exists | Resource already created | No need to create again |
| RESOURCE_006 | Cannot delete | Resource in use | Check dependencies |

## Data Errors (DATA_)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| DATA_001 | Inconsistent data | Data structure invalid | Contact support |
| DATA_002 | Missing reference | Foreign key doesn't exist | Ensure referenced resource exists |
| DATA_003 | Concurrent modification | Resource changed by another user | Refresh and retry |
| DATA_004 | Large file | File too large | Use file under size limit |
| DATA_005 | Invalid file type | File type not allowed | Use correct file format |
| DATA_006 | Storage full | Exceeded storage quota | Delete unused files |

## Business Logic Errors (BUSINESS_)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| BUSINESS_001 | Invalid status transition | Cannot change status this way | Check current status |
| BUSINESS_002 | Cannot invoice | Project not ready for invoice | Complete required steps first |
| BUSINESS_003 | Amount mismatch | Amounts don't match | Verify invoice amounts |
| BUSINESS_004 | Date conflict | Dates are invalid | Ensure start < end |
| BUSINESS_005 | Missing information | Required info not provided | Fill in all required fields |
| BUSINESS_006 | Duplicate transaction | Same transaction attempted twice | Check if already processed |

## Network Errors (NETWORK_)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| NETWORK_001 | No internet connection | Offline or network down | Check internet connection |
| NETWORK_002 | Server unreachable | Cannot reach Supabase | Check internet, try again |
| NETWORK_003 | Request timeout | Request took too long | Slow connection or large data |
| NETWORK_004 | Too many requests | Rate limited | Wait before retrying |
| NETWORK_005 | Connection lost | Connection dropped mid-request | Retry operation |

## Server Errors (SERVER_)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| SERVER_001 | Internal server error | Unexpected error on server | Contact support, check status page |
| SERVER_002 | Service unavailable | Supabase service down | Wait and retry, check status |
| SERVER_003 | Database error | Database operation failed | Retry or contact support |
| SERVER_004 | File storage error | Cannot access file storage | Check file exists, retry |
| SERVER_005 | Email service error | Cannot send email | Check email address, retry |

## File Upload Errors (UPLOAD_)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| UPLOAD_001 | File too large | File exceeds 5MB limit | Use smaller file (< 5MB) |
| UPLOAD_002 | Invalid file type | Only images allowed | Use JPEG, PNG, or WebP |
| UPLOAD_003 | Upload failed | Network or server error | Retry upload |
| UPLOAD_004 | Storage full | Quota exceeded | Delete unused files |
| UPLOAD_005 | Virus detected | File flagged as malicious | Use different file |

## Export/Import Errors (IMPORT_)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| IMPORT_001 | Invalid file format | CSV/Excel structure incorrect | Check file format |
| IMPORT_002 | Duplicate records | Records already exist | Skip duplicates or update mode |
| IMPORT_003 | Missing columns | Required columns missing | Add all required columns |
| IMPORT_004 | Invalid data | Cell values invalid | Fix data in CSV/Excel |
| IMPORT_005 | Partial import | Some records failed | Check error report |

## PDF Generation Errors (PDF_)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| PDF_001 | Generation failed | PDF library error | Try again or use simpler format |
| PDF_002 | Large document | Document too large for PDF | Split into multiple documents |
| PDF_003 | Font not available | Required font unavailable | Use standard fonts |

## Mapping/Location Errors (LOCATION_)

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| LOCATION_001 | Invalid address | Address cannot be geocoded | Verify address is valid |
| LOCATION_002 | Location not found | Coordinates invalid | Check location format |
| LOCATION_003 | Map service down | Google Maps service error | Try again later |

---

## How to Use Error Codes

### In Error Messages

```javascript
throw new ApiError(
  'User account not approved',
  'AUTH_002',
  403
)
```

### In Error Handling

```javascript
catch (error) {
  if (error.code === 'AUTH_002') {
    showMessage('Your account is pending approval')
  } else if (error.code === 'PERMISSION_001') {
    showMessage('You do not have access')
  }
}
```

### In Logging

```javascript
logger.error('Operation failed', {
  code: error.code,
  message: error.message,
  context: { projectId, userId },
})
```

---

## Error Code Patterns

### Format

```
CATEGORY_###

CATEGORY:   2-5 letter prefix
###:        3-digit number (001-999)
```

### Examples

- `AUTH_001` - First authentication error
- `VALIDATION_002` - Second validation error
- `PERMISSION_005` - Fifth permission error

### New Error Codes

When adding new errors:

1. Choose appropriate category
2. Use next available number
3. Document here
4. Update error handler if needed

---

## Status Codes

HTTP status codes used:

| Code | Usage |
|------|-------|
| 400 | Bad request (validation error) |
| 401 | Unauthorized (auth error) |
| 403 | Forbidden (permission error) |
| 404 | Not found (resource error) |
| 409 | Conflict (data error) |
| 429 | Rate limited (too many requests) |
| 500 | Internal server error |
| 503 | Service unavailable |

---

## Testing Error Codes

```javascript
// Unit test for error handling
describe('Error handling', () => {
  it('throws AUTH_001 for invalid credentials', async () => {
    expect(() => {
      login('bad@email.com', 'wrong')
    }).toThrow(AuthenticationError)
  })
})
```

---

## Support

When reporting errors:

1. Include error code (e.g., `AUTH_002`)
2. Include error message
3. Include steps to reproduce
4. Include timestamp from logs

Example: "Getting error `AUTH_003: Session expired` when trying to save project at 3:45 PM"

---

Last updated: April 2026
