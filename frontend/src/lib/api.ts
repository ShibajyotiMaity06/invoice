import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // You can add auth token from localStorage if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        // Clear any stored auth data
        localStorage.removeItem('token');
        // Redirect to login if not already there
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  signup: (data: { email: string; password: string; firstName?: string; lastName?: string }) =>
    api.post('/auth/signup', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  logout: () => api.post('/auth/logout'),
  
  getMe: () => api.get('/auth/me'),
  
  updateMe: (data: { firstName?: string; lastName?: string }) =>
    api.put('/auth/me', data),
};

// Business Profile API
export const businessProfileApi = {
  get: () => api.get('/business-profile'),
  
  create: (formData: FormData) =>
    api.post('/business-profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  update: (formData: FormData) =>
    api.put('/business-profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  deleteLogo: () => api.delete('/business-profile/logo'),
};

// Clients API
export interface ClientsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'name' | 'email' | 'createdAt' | 'totalInvoiced';
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
}

export const clientsApi = {
  getAll: (params?: ClientsQueryParams) =>
    api.get('/clients', { params }),
  
  getOne: (id: string) =>
    api.get(`/clients/${id}`),
  
  create: (data: {
    name: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    notes?: string;
  }) => api.post('/clients', data),
  
  update: (id: string, data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    notes?: string;
    isActive?: boolean;
  }) => api.put(`/clients/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/clients/${id}`),
  
  getStats: () =>
    api.get('/clients/stats'),
};

// Invoices API
export interface InvoicesQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  clientId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const invoicesApi = {
  getAll: (params?: InvoicesQueryParams) =>
    api.get('/invoices', { params }),

  getOne: (id: string) =>
    api.get(`/invoices/${id}`),

  create: (data: {
    clientId: string;
    issueDate?: string;
    dueDate: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      rate: number;
      taxRate?: number;
    }>;
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
    notes?: string;
    currency?: string;
    status?: string;
  }) => api.post('/invoices', data),

  update: (id: string, data: any) =>
    api.put(`/invoices/${id}`, data),

  delete: (id: string) =>
    api.delete(`/invoices/${id}`),

  getStats: () =>
    api.get('/invoices/stats'),
  getPublic: (token: string) =>
  api.get(`/invoices/public/${token}`),
};



export default api;