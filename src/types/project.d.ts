/**
 * Project Type Definitions
 * Core project domain types for SolarTrack Pro
 */

/**
 * Project status values
 */
export type ProjectStatus = 'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled'

/**
 * Project state/workflow phase
 */
export type ProjectState = 'Estimation' | 'Negotiation' | 'Execution'

/**
 * Project stage definitions
 */
export interface ProjectStage {
  id: number
  name: string
  description?: string
  order?: number
}

/**
 * Standard project stages
 */
export const DEFAULT_PROJECT_STAGES: ProjectStage[] = [
  { id: 1, name: 'Site Survey' },
  { id: 2, name: 'KSEB Application' },
  { id: 3, name: 'Mounting Work' },
  { id: 4, name: 'Panel Installation' },
  { id: 5, name: 'Wiring & Inverter' },
  { id: 6, name: 'Earthing & Safety' },
  { id: 7, name: 'KSEB Inspection' },
  { id: 8, name: 'Net Meter' },
  { id: 9, name: 'Commissioning' },
  { id: 10, name: 'Completed' }
]

/**
 * Basic project information
 */
export interface Project {
  id: string
  name: string
  status: ProjectStatus
  state: ProjectState
  stage: number | string
  customerId: string
  customerName?: string
  assignedTo?: string
  description?: string | null
  estimate?: number | null
  actualCost?: number | null
  estimatedCost?: number | null
  startDate?: string | null
  endDate?: string | null
  completionDate?: string | null
  progressPercentage?: number
  latitude?: number | null
  longitude?: number | null
  address?: string | null
  city?: string | null
  state_province?: string | null
  postalCode?: string | null
  isActive?: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string
  [key: string]: any
}

/**
 * Project detail with all related information
 */
export interface ProjectDetail extends Project {
  // Estimation stage data
  estimate?: {
    systemSize: string
    estimatedSavings: number
    roofType: string
    roofArea: number
  }

  // Negotiation stage data
  proposal?: {
    id: string
    status: string
    quotedPrice: number
    discountPercent?: number
    finalPrice: number
    validUntil: string
  }

  // Execution stage data
  checklist?: Array<{
    id: string
    name: string
    completed: boolean
    completedAt?: string
  }>
  photos?: ProjectPhoto[]
  tasks?: ProjectTask[]
  documents?: ProjectDocument[]
  invoice?: ProjectInvoice
}

/**
 * Project creation request
 */
export interface CreateProjectRequest {
  name: string
  customerId: string
  status?: ProjectStatus
  state?: ProjectState
  stage?: number | string
  description?: string
  estimatedCost?: number
  startDate?: string
  address?: string
  city?: string
  state?: string
  postalCode?: string
  latitude?: number
  longitude?: number
  metadata?: Record<string, any>
}

/**
 * Project update request
 */
export interface UpdateProjectRequest {
  name?: string
  status?: ProjectStatus
  state?: ProjectState
  stage?: number | string
  customerId?: string
  description?: string
  estimatedCost?: number
  actualCost?: number
  endDate?: string
  completionDate?: string
  progressPercentage?: number
  assignedTo?: string
  [key: string]: any
}

/**
 * Project photo
 */
export interface ProjectPhoto {
  id: string
  projectId: string
  url: string
  description?: string
  stage?: number
  uploadedAt: string
  uploadedBy?: string
  metadata?: Record<string, any>
}

/**
 * Project task
 */
export interface ProjectTask {
  id: string
  projectId: string
  title: string
  description?: string
  assignedTo?: string
  status: 'pending' | 'in-progress' | 'completed' | 'blocked'
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  completedAt?: string
  estimatedHours?: number
  actualHours?: number
  createdAt: string
  updatedAt: string
}

/**
 * Project document
 */
export interface ProjectDocument {
  id: string
  projectId: string
  type: 'estimate' | 'proposal' | 'invoice' | 'certificate' | 'handover' | 'other'
  name: string
  url: string
  uploadedAt: string
  uploadedBy?: string
  size?: number
  mimeType?: string
}

/**
 * Project invoice
 */
export interface ProjectInvoice {
  id: string
  projectId: string
  invoiceNumber: string
  amount: number
  issuedAt: string
  dueAt: string
  paidAt?: string
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue'
  url?: string
}

/**
 * Project filter/query criteria
 */
export interface ProjectFilterCriteria {
  status?: ProjectStatus[]
  state?: ProjectState[]
  stage?: number[]
  customerId?: string
  assignedTo?: string
  dateRange?: {
    startDate: string | Date
    endDate: string | Date
  }
  searchTerm?: string
  isActive?: boolean
  minCost?: number
  maxCost?: number
}

/**
 * Project statistics
 */
export interface ProjectStats {
  totalProjects: number
  byStatus: Record<ProjectStatus, number>
  byState: Record<ProjectState, number>
  totalRevenue: number
  averageProjectValue: number
  averageCompletionDays: number
  completionRate: number
}

/**
 * Project milestone
 */
export interface ProjectMilestone {
  id: string
  projectId: string
  name: string
  description?: string
  targetDate: string
  completedDate?: string
  status: 'pending' | 'completed' | 'missed'
  deliverables?: string[]
}

/**
 * Stage progress information
 */
export interface StageProgress {
  stageId: number
  stageName: string
  startDate?: string
  completionDate?: string
  status: 'pending' | 'in-progress' | 'completed'
  checklist?: Array<{
    id: string
    item: string
    completed: boolean
    completedAt?: string
  }>
  progressPercent: number
}

/**
 * Project timeline entry
 */
export interface ProjectTimelineEntry {
  id: string
  projectId: string
  eventType: string
  description: string
  timestamp: string
  actor?: string
  metadata?: Record<string, any>
}

/**
 * Project bulk operation result
 */
export interface ProjectBulkOperationResult {
  successful: string[]
  failed: Array<{
    projectId: string
    error: string
  }>
  totalProcessed: number
  successCount: number
  failureCount: number
}

/**
 * Project search result
 */
export interface ProjectSearchResult extends Project {
  matchedFields?: string[]
  relevanceScore?: number
}

/**
 * Project export format
 */
export interface ProjectExportData {
  project: Project
  details?: ProjectDetail
  timeline?: ProjectTimelineEntry[]
  documents?: ProjectDocument[]
  statistics?: ProjectStats
}
