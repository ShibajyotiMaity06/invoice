export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  emailVerified: boolean;
  plan: 'free' | 'starter' | 'pro' | 'team';
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'none';
  activeWorkspace?: string | Workspace;
  referralCode: string;
  createdAt: string;
}

export interface Workspace {
  _id: string;
  owner: string;
  name: string;
  email?: string;
  phone?: string;
  logo?: {
    url: string;
    publicId: string;
  };
  address?: Address;
  taxId?: string;
  website?: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  defaultCurrency: string;
  defaultPaymentTerms: number;
  defaultFooterNote?: string;
  brandColors: {
    primary: string;
    secondary: string;
  };
  bankDetails?: BankDetails;
  stripeConnectedAccountId?: string;
  stripeOnboardingComplete: boolean;
  settings: WorkspaceSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface BankDetails {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
}

export interface WorkspaceSettings {
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  reminderDaysAfter: number[];
  lateFeeEnabled: boolean;
  lateFeePercentage: number;
  autoSendReminders: boolean;
}

// Client types
export interface Client {
  _id: string;
  workspace: string;
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  taxId?: string;
  defaultCurrency: string;
  defaultPaymentTerms: number;
  notes?: string;
  tags?: string[];
  totalInvoiced: number;
  totalPaid: number;
  invoiceCount: number;
  isActive: boolean;
  fullAddress?: string;
  outstandingBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  notes?: string;
}

export interface ClientsResponse {
  clients: Client[];
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ClientStats {
  totalClients: number;
  activeClients: number;
  totalInvoiced: number;
  totalPaid: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ msg: string; param?: string }>;
}

export interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Invoice types
export interface LineItem {
  _id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount?: number;
  taxRate?: number;
  taxAmount?: number;
}

export interface Invoice {
  _id: string;
  workspace: string | Workspace;
  client: Client | string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  subtotal: number;
  taxTotal: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  notes?: string;
  paymentTerms?: string;
  sentAt?: string;
  viewedAt?: string[];
  paidAt?: string;
  accessToken?: string;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFormData {
  clientId: string;
  issueDate: string;
  dueDate: string;
  lineItems: LineItem[];
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  notes?: string;
  currency?: string;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  pagination: Pagination;
}

export interface InvoiceStats {
  draft: { count: number; total: number };
  sent: { count: number; total: number };
  viewed: { count: number; total: number };
  paid: { count: number; total: number };
  overdue: { count: number; total: number };
  cancelled: { count: number; total: number };
}