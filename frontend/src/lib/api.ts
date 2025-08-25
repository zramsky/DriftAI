import { type ClassValue, clsx } from "clsx"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface Vendor {
  id: string;
  name: string;
  canonicalName: string;
  businessDescription?: string;
  active: boolean;
  totalInvoices: number;
  totalDiscrepancies: number;
  totalSavings: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  vendorId: string;
  vendor?: Vendor;
  fileName: string;
  fileUrl: string;
  effectiveDate: string;
  renewalDate?: string;
  endDate?: string;
  status: 'active' | 'inactive' | 'needs_review' | 'expired';
  terms?: any;
  extractedText?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  vendorId: string;
  vendor?: Vendor;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'reconciled' | 'flagged' | 'approved' | 'rejected';
  totalAmount: number;
  subtotal: number;
  taxAmount?: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    unit: string;
    total: number;
  }>;
  fees?: Array<{
    type: 'percent' | 'fixed';
    description: string;
    amount: number;
  }>;
  extractedText?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ReconciliationReport {
  id: string;
  invoiceId: string;
  contractId: string;
  hasDiscrepancies: boolean;
  totalDiscrepancyAmount: number;
  discrepancies: Array<{
    type: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    expectedValue: any;
    actualValue: any;
    amount: number;
    lineItemIndex?: number;
  }>;
  checklist: Array<{
    item: string;
    passed: boolean;
    details: string;
    confidence: number;
  }>;
  rationaleText: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${API_PREFIX}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        return {
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'An error occurred',
        status: 0,
      };
    }
  }

  // Vendor API
  async getVendors(): Promise<ApiResponse<Vendor[]>> {
    return this.request<Vendor[]>('/vendors');
  }

  async getVendor(id: string): Promise<ApiResponse<Vendor>> {
    return this.request<Vendor>(`/vendors/${id}`);
  }

  async createVendor(vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt' | 'totalInvoices' | 'totalDiscrepancies' | 'totalSavings'>): Promise<ApiResponse<Vendor>> {
    return this.request<Vendor>('/vendors', {
      method: 'POST',
      body: JSON.stringify(vendor),
    });
  }

  async updateVendor(id: string, vendor: Partial<Vendor>): Promise<ApiResponse<Vendor>> {
    return this.request<Vendor>(`/vendors/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(vendor),
    });
  }

  async deleteVendor(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/vendors/${id}`, {
      method: 'DELETE',
    });
  }

  async getVendorStats(id: string): Promise<ApiResponse<{
    totalInvoices: number;
    totalContracts: number;
    totalDiscrepancies: number;
    totalSavings: number;
    averageSavingsPerInvoice: number;
  }>> {
    return this.request(`/vendors/${id}/stats`);
  }

  // Contract API
  async getContracts(vendorId?: string, status?: string): Promise<ApiResponse<Contract[]>> {
    const params = new URLSearchParams();
    if (vendorId) params.append('vendorId', vendorId);
    if (status) params.append('status', status);
    
    return this.request<Contract[]>(`/contracts${params.toString() ? `?${params.toString()}` : ''}`);
  }

  async getContract(id: string): Promise<ApiResponse<Contract>> {
    return this.request<Contract>(`/contracts/${id}`);
  }

  async uploadContract(vendorId: string, file: File): Promise<ApiResponse<{ contractId: string; jobId: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}${API_PREFIX}/contracts/upload?vendorId=${vendorId}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        return {
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Upload failed',
        status: 0,
      };
    }
  }

  async updateContractStatus(id: string, status: Contract['status']): Promise<ApiResponse<Contract>> {
    return this.request<Contract>(`/contracts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Invoice API
  async getInvoices(vendorId?: string, status?: string): Promise<ApiResponse<Invoice[]>> {
    const params = new URLSearchParams();
    if (vendorId) params.append('vendorId', vendorId);
    if (status) params.append('status', status);
    
    return this.request<Invoice[]>(`/invoices${params.toString() ? `?${params.toString()}` : ''}`);
  }

  async getInvoice(id: string): Promise<ApiResponse<Invoice>> {
    return this.request<Invoice>(`/invoices/${id}`);
  }

  async uploadInvoice(vendorId: string, file: File): Promise<ApiResponse<{ invoiceId: string; jobId: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${this.baseURL}${API_PREFIX}/invoices/upload?vendorId=${vendorId}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        return {
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      const data = await response.json();
      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Upload failed',
        status: 0,
      };
    }
  }

  async getReconciliationReport(invoiceId: string): Promise<ApiResponse<ReconciliationReport>> {
    return this.request<ReconciliationReport>(`/invoices/${invoiceId}/reconciliation`);
  }

  async approveInvoice(id: string): Promise<ApiResponse<Invoice>> {
    return this.request<Invoice>(`/invoices/${id}/approve`, {
      method: 'PATCH',
    });
  }

  async rejectInvoice(id: string, reason: string): Promise<ApiResponse<Invoice>> {
    return this.request<Invoice>(`/invoices/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async getInvoiceStats(vendorId?: string): Promise<ApiResponse<{
    total: number;
    pending: number;
    reconciled: number;
    flagged: number;
    approved: number;
    rejected: number;
    totalAmount: number;
    totalDiscrepancies: number;
    totalSavings: number;
  }>> {
    const params = vendorId ? `?vendorId=${vendorId}` : '';
    return this.request(`/invoices/stats${params}`);
  }
}

export const apiClient = new ApiClient();