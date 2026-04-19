/**
 * Customer Type Definitions
 * Represents customers and their profiles in the system
 */

/**
 * Basic customer information
 */
export interface Customer {
  id?: string | number
  customer_id: string // Format: CUST-YYYYMMDD-XXXX
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  company?: string | null
  notes?: string | null
  is_active: boolean
  created_at: string
  updated_at?: string
}

/**
 * Extended customer profile with additional details
 */
export interface CustomerProfile extends Customer {
  gstNumber?: string | null
  panNumber?: string | null
  aadharNumber?: string | null
  contactPerson?: string | null
  alternateEmail?: string | null
  alternatePhone?: string | null
  websiteUrl?: string | null
  industry?: string | null
  roofType?: string | null
  roofArea?: number | null
  powerConsumption?: number | null
  electricityBillAmount?: number | null
  electricityBillFrequency?: string | null
  metadata?: Record<string, any>
  customFields?: Record<string, any>
}

/**
 * Customer contact information
 */
export interface CustomerContact {
  email: string | null
  phone: string | null
  alternateEmail?: string | null
  alternatePhone?: string | null
  address: string | null
  city: string | null
  state: string | null
  postalCode: string | null
}

/**
 * Customer creation request
 */
export interface CreateCustomerRequest {
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  company?: string
  notes?: string
  gstNumber?: string
  panNumber?: string
}

/**
 * Customer update request
 */
export interface UpdateCustomerRequest {
  name?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  company?: string
  notes?: string
  is_active?: boolean
  [key: string]: any
}

/**
 * Customer search query
 */
export interface CustomerSearchQuery {
  searchTerm?: string
  city?: string
  state?: string
  company?: string
  isActive?: boolean
  limit?: number
  offset?: number
}

/**
 * Customer statistics
 */
export interface CustomerStats {
  totalCount: number
  activeCount: number
  projectsPerCustomer: number
  averageProjectValue: number
  topCustomers: CustomerWithProjectCount[]
}

/**
 * Customer with project count
 */
export interface CustomerWithProjectCount extends Customer {
  projectCount: number
  totalProjectValue: number
}

/**
 * Customer portal data
 */
export interface CustomerPortalData {
  customer: Customer
  projects: Array<{
    id: string
    name: string
    status: string
    stage: string
    startDate: string
    completionDate?: string
    estimatedCost: number
    actualCost?: number
  }>
  documents: Array<{
    id: string
    name: string
    type: string
    url: string
    uploadedAt: string
  }>
  estimatedSavings?: number
  systemSize?: string
  performance?: {
    energyGenerated?: number
    carbonOffset?: number
  }
}

/**
 * Customer bulk import item
 */
export interface CustomerBulkImportItem {
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  company?: string
  notes?: string
  [key: string]: any
}

/**
 * Customer bulk import result
 */
export interface CustomerBulkImportResult {
  successful: Customer[]
  failed: Array<{
    row: number
    data: CustomerBulkImportItem
    error: string
  }>
  totalProcessed: number
  successCount: number
  failureCount: number
}

/**
 * Customer communication history
 */
export interface CustomerCommunication {
  id: string
  customerId: string
  type: 'email' | 'phone' | 'sms' | 'visit' | 'note'
  subject?: string
  message?: string
  sentBy?: string
  sentAt: string
  status?: 'sent' | 'read' | 'replied' | 'pending'
}

/**
 * Customer document
 */
export interface CustomerDocument {
  id: string
  customerId: string
  documentType: 'estimate' | 'proposal' | 'invoice' | 'contract' | 'other'
  fileName: string
  url: string
  uploadedAt: string
  uploadedBy?: string
  metadata?: Record<string, any>
}

/**
 * Customer preference settings
 */
export interface CustomerPreferences {
  customerId: string
  preferredContactMethod: 'email' | 'phone' | 'sms'
  receiveUpdates: boolean
  receivePromotions: boolean
  language?: string
  timezone?: string
  customFields?: Record<string, any>
}
