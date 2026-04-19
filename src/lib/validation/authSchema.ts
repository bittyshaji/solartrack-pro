/**
 * Authentication Validation Schema
 * Validates login, signup, password reset, and account management
 */

import { z } from 'zod';

/**
 * Password validation rules
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)');

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .describe('User email address'),

  password: z
    .string()
    .min(1, 'Password is required')
    .describe('User password'),

  rememberMe: z
    .boolean()
    .optional()
    .default(false)
    .describe('Remember this device for future logins'),
});

/**
 * Signup schema
 */
export const signupSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must not exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
      .describe('User first name'),

    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must not exceed 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
      .describe('User last name'),

    email: z
      .string()
      .email('Please enter a valid email address')
      .describe('User email address'),

    password: passwordSchema.describe('User password'),

    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password')
      .describe('Password confirmation'),

    companyName: z
      .string()
      .min(1, 'Company name is required')
      .max(100, 'Company name must not exceed 100 characters')
      .describe('Company or organization name'),

    phone: z
      .string()
      .regex(
        /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
        'Please enter a valid phone number'
      )
      .describe('Contact phone number'),

    acceptTerms: z
      .boolean()
      .refine((value) => value === true, 'You must accept the terms and conditions')
      .describe('Accept terms and conditions'),

    acceptPrivacy: z
      .boolean()
      .refine((value) => value === true, 'You must accept the privacy policy')
      .describe('Accept privacy policy'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .describe('Email address associated with the account'),
});

/**
 * Password reset confirm schema
 */
export const passwordResetConfirmSchema = z
  .object({
    token: z
      .string()
      .min(1, 'Reset token is required')
      .describe('Password reset token from email'),

    password: passwordSchema.describe('New password'),

    confirmPassword: z
      .string()
      .min(1, 'Please confirm your password')
      .describe('Password confirmation'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Change password schema - for authenticated users
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .describe('User current password for verification'),

    newPassword: passwordSchema.describe('New password'),

    confirmPassword: z
      .string()
      .min(1, 'Please confirm your new password')
      .describe('New password confirmation'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

/**
 * Email verification schema
 */
export const emailVerificationSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .describe('Email to verify'),

  verificationCode: z
    .string()
    .min(6, 'Verification code must be at least 6 characters')
    .max(10, 'Verification code must not exceed 10 characters')
    .describe('Verification code sent to email'),
});

/**
 * Two-factor authentication setup schema
 */
export const setupTwoFactorSchema = z.object({
  method: z
    .enum(['totp', 'sms', 'email'])
    .describe('Two-factor authentication method'),

  phone: z
    .string()
    .regex(
      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
      'Please enter a valid phone number'
    )
    .optional()
    .describe('Phone number for SMS method'),

  verificationCode: z
    .string()
    .min(6, 'Verification code must be at least 6 characters')
    .optional()
    .describe('Code for verifying the 2FA setup'),
});

/**
 * Two-factor verification schema
 */
export const verifyTwoFactorSchema = z.object({
  code: z
    .string()
    .min(6, 'Verification code must be at least 6 characters')
    .describe('Two-factor authentication code'),

  rememberDevice: z
    .boolean()
    .optional()
    .default(false)
    .describe('Remember this device for 30 days'),
});

/**
 * Account unlock schema
 */
export const accountUnlockSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .describe('Email address of locked account'),

  unlockToken: z
    .string()
    .min(1, 'Unlock token is required')
    .describe('Token sent to email for account unlock'),
});

/**
 * OAuth/SSO connection schema
 */
export const oauthConnectionSchema = z.object({
  provider: z
    .enum(['google', 'microsoft', 'github', 'linkedin'])
    .describe('OAuth provider'),

  code: z
    .string()
    .min(1, 'Authorization code is required')
    .describe('Authorization code from OAuth provider'),

  state: z
    .string()
    .optional()
    .describe('State parameter for CSRF protection'),

  redirectUri: z
    .string()
    .url('Invalid redirect URI')
    .optional()
    .describe('Redirect URI used in OAuth flow'),
});

// Type exports for TypeScript
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>;
export type PasswordResetConfirmData = z.infer<typeof passwordResetConfirmSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type EmailVerificationData = z.infer<typeof emailVerificationSchema>;
export type SetupTwoFactorData = z.infer<typeof setupTwoFactorSchema>;
export type VerifyTwoFactorData = z.infer<typeof verifyTwoFactorSchema>;
export type AccountUnlockData = z.infer<typeof accountUnlockSchema>;
export type OAuthConnectionData = z.infer<typeof oauthConnectionSchema>;
