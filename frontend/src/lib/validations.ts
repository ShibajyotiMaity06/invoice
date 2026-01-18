import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter'),
  firstName: z.string().max(50, 'First name cannot exceed 50 characters').optional(),
  lastName: z.string().max(50, 'Last name cannot exceed 50 characters').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const businessProfileSchema = z.object({
  name: z
    .string()
    .min(1, 'Business name is required')
    .max(100, 'Business name cannot exceed 100 characters'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone number cannot exceed 20 characters').optional().or(z.literal('')),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  taxId: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  invoicePrefix: z.string().max(10, 'Invoice prefix cannot exceed 10 characters').optional(),
  defaultCurrency: z.string().length(3, 'Currency must be a 3-letter code').optional(),
  defaultPaymentTerms: z.coerce.number().min(0).max(365).optional(),
  defaultFooterNote: z.string().max(500, 'Footer note cannot exceed 500 characters').optional(),
});

export const clientSchema = z.object({
  name: z
    .string()
    .min(1, 'Client name is required')
    .max(100, 'Client name cannot exceed 100 characters'),
  email: z
    .string()
    .email('Please enter a valid email')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional()
    .or(z.literal('')),
  address: z.object({
    street: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    state: z.string().optional().or(z.literal('')),
    zipCode: z.string().optional().or(z.literal('')),
    country: z.string().optional().or(z.literal('')),
  }).optional(),
  notes: z
    .string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
});

// Invoice validation schema
export const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  rate: z.coerce.number().min(0, 'Rate must be 0 or greater'),
  taxRate: z.coerce.number().min(0).max(100).optional().default(0),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  discountType: z.enum(['percentage', 'fixed']).optional().default('fixed'),
  discountValue: z.coerce.number().min(0).optional().default(0),
  notes: z.string().max(1000).optional(),
  currency: z.string().length(3).optional().default('USD'),
});

export type LineItemFormData = z.infer<typeof lineItemSchema>;
export type InvoiceFormDataSchema = z.infer<typeof invoiceSchema>;

export type SignupFormData = z.infer<typeof signupSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;
export type ClientFormData = z.infer<typeof clientSchema>;