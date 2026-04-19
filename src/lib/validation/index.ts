/**
 * Form Validation Index
 * Central export point for all validation schemas and utilities
 */

// Authentication Schemas
export {
  loginSchema,
  signupSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  changePasswordSchema,
  emailVerificationSchema,
  setupTwoFactorSchema,
  verifyTwoFactorSchema,
  accountUnlockSchema,
  oauthConnectionSchema,
  type LoginData,
  type SignupData,
  type PasswordResetRequestData,
  type PasswordResetConfirmData,
  type ChangePasswordData,
  type EmailVerificationData,
  type SetupTwoFactorData,
  type VerifyTwoFactorData,
  type AccountUnlockData,
  type OAuthConnectionData,
} from './authSchema';

// Project Schemas
export {
  ProjectStatus,
  baseProjectSchema,
  createProjectSchema,
  updateProjectSchema,
  projectFilterSchema,
  projectBulkOperationSchema,
  updateProjectStatusSchema,
  projectWithSiteSurveySchema,
  siteSurveySchema,
  updateSiteSurveySchema,
  type ProjectStatus,
  type CreateProjectData,
  type UpdateProjectData,
  type ProjectFilterOptions,
  type ProjectBulkOperation,
  type UpdateProjectStatusData,
  type SiteSurveyData,
  type ProjectWithSiteSurvey,
} from './projectSchema';

// Customer Schemas
export {
  baseCustomerSchema,
  createCustomerSchema,
  updateCustomerSchema,
  customerFilterSchema,
  customerCommunicationSchema,
  updateCustomerContactSchema,
  bulkCustomerImportSchema,
  emailUniqueSchema,
  addressSchema,
  type CreateCustomerData,
  type UpdateCustomerData,
  type CustomerFilterOptions,
  type CustomerCommunicationPrefs,
  type UpdateCustomerContactData,
  type BulkCustomerImportData,
  type Address,
} from './customerSchema';

// Invoice Schemas
export {
  InvoiceStatus,
  baseInvoiceSchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  invoicePaymentSchema,
  invoiceSendSchema,
  invoiceFilterSchema,
  invoiceBulkOperationSchema,
  invoiceTotalsSchema,
  invoiceLineItemSchema,
  type InvoiceStatus,
  type CreateInvoiceData,
  type UpdateInvoiceData,
  type InvoicePaymentData,
  type InvoiceSendData,
  type InvoiceFilterOptions,
  type InvoiceBulkOperation,
  type InvoiceTotals,
  type InvoiceLineItem,
} from './invoiceSchema';

// Estimate Schemas
export {
  EstimateStatus,
  baseEstimateSchema,
  createEstimateSchema,
  updateEstimateSchema,
  estimateSendSchema,
  convertEstimateToInvoiceSchema,
  estimateFilterSchema,
  estimateComparisonSchema,
  systemDesignSchema,
  equipmentSpecSchema,
  estimateServiceItemSchema,
  type EstimateStatus,
  type CreateEstimateData,
  type UpdateEstimateData,
  type EstimateSendData,
  type EstimateFilterOptions,
  type EstimateComparisonData,
  type SystemDesign,
  type EquipmentSpec,
  type EstimateServiceItem,
  type ConvertEstimateToInvoiceData,
} from './estimateSchema';

// Material Schemas
export {
  MaterialType,
  MaterialUnit,
  baseMaterialSchema,
  createMaterialSchema,
  updateMaterialSchema,
  materialStockAdjustmentSchema,
  materialUsageRecordSchema,
  materialReorderSchema,
  materialFilterSchema,
  materialComparisonSchema,
  bulkMaterialImportSchema,
  type MaterialType,
  type MaterialUnit,
  type CreateMaterialData,
  type UpdateMaterialData,
  type MaterialStockAdjustment,
  type MaterialUsageRecord,
  type MaterialReorderData,
  type MaterialFilterOptions,
  type MaterialComparisonData,
  type BulkMaterialImportData,
} from './materialSchema';

// Utility Functions
export {
  getFieldError,
  getFormErrors,
  formatValidationError,
  createAsyncValidator,
  validateField,
  zodErrorToFormErrors,
  sanitizeInput,
  isValidPhoneNumber,
  isValidUrl,
  passwordsMatch,
} from './utils';
