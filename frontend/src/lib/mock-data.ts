import { Vendor, Contract, Invoice, ReconciliationReport } from './api'

// Mock data for development and testing
export const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'MedSupply Co.',
    canonicalName: 'MedSupply Company LLC',
    businessDescription: 'Medical Supplies',
    active: true,
    totalInvoices: 15,
    totalDiscrepancies: 2,
    totalSavings: 8245,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: '2',
    name: 'CleanCorp',
    canonicalName: 'Clean Corporation Services',
    businessDescription: 'Cleaning Services',
    active: true,
    totalInvoices: 8,
    totalDiscrepancies: 1,
    totalSavings: 5123,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-01-18T00:00:00Z',
  },
  {
    id: '3',
    name: 'FoodService Plus',
    canonicalName: 'Food Service Plus Inc',
    businessDescription: 'Food Vendor',
    active: true,
    totalInvoices: 22,
    totalDiscrepancies: 3,
    totalSavings: 3890,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-22T00:00:00Z',
  },
  {
    id: '4',
    name: 'TechServices LLC',
    canonicalName: 'Technology Services Limited Liability Company',
    businessDescription: 'IT Services',
    active: true,
    totalInvoices: 5,
    totalDiscrepancies: 0,
    totalSavings: 2456,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '5',
    name: 'Office Depot',
    canonicalName: 'Office Depot Business Solutions',
    businessDescription: 'Office Supplies',
    active: false,
    totalInvoices: 12,
    totalDiscrepancies: 1,
    totalSavings: 1234,
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
]

export const mockContracts: Contract[] = [
  {
    id: 'CON-2024-001',
    vendorId: '1',
    vendor: mockVendors[0],
    fileName: 'medsupply-annual-contract-2024.pdf',
    fileUrl: '/contracts/medsupply-annual-contract-2024.pdf',
    effectiveDate: '2024-01-01T00:00:00Z',
    renewalDate: '2024-12-31T00:00:00Z',
    endDate: '2025-01-01T00:00:00Z',
    status: 'active',
    terms: {
      paymentTerms: 'Net 30',
      discountPercent: 5,
      minimumOrder: 1000,
      bulkDiscounts: [
        { threshold: 5000, discount: 0.02 },
        { threshold: 10000, discount: 0.05 }
      ]
    },
    extractedText: 'Medical supplies contract with standard terms...',
    metadata: { pages: 15, confidence: 0.95 },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'CON-2024-002',
    vendorId: '2',
    vendor: mockVendors[1],
    fileName: 'cleancorp-service-agreement.pdf',
    fileUrl: '/contracts/cleancorp-service-agreement.pdf',
    effectiveDate: '2024-02-01T00:00:00Z',
    renewalDate: '2025-02-01T00:00:00Z',
    status: 'active',
    terms: {
      paymentTerms: 'Net 15',
      serviceFrequency: 'weekly',
      hourlyRate: 25,
      emergencyRate: 37.50
    },
    extractedText: 'Cleaning services contract with weekly schedule...',
    metadata: { pages: 8, confidence: 0.92 },
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    id: 'CON-2024-089',
    vendorId: '3',
    vendor: mockVendors[2],
    fileName: 'foodservice-catering-contract.pdf',
    fileUrl: '/contracts/foodservice-catering-contract.pdf',
    effectiveDate: '2024-03-01T00:00:00Z',
    renewalDate: '2024-12-31T00:00:00Z',
    status: 'needs_review',
    terms: {
      paymentTerms: 'Net 45',
      mealRate: 12.50,
      minimumDaily: 50,
      specialEventSurcharge: 0.15
    },
    extractedText: 'Food service contract needs review for pricing terms...',
    metadata: { pages: 12, confidence: 0.88 },
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
]

export const mockInvoices: Invoice[] = [
  {
    id: 'INV-2024-001',
    vendorId: '1',
    vendor: mockVendors[0],
    invoiceNumber: 'MS240115001',
    invoiceDate: '2024-01-15T00:00:00Z',
    dueDate: '2024-02-14T00:00:00Z',
    fileName: 'medsupply-invoice-january.pdf',
    fileUrl: '/invoices/medsupply-invoice-january.pdf',
    status: 'reconciled',
    totalAmount: 4567.89,
    subtotal: 4334.18,
    taxAmount: 233.71,
    lineItems: [
      {
        description: 'Surgical Masks - Box of 50',
        quantity: 100,
        rate: 15.99,
        unit: 'box',
        total: 1599.00
      },
      {
        description: 'Latex Gloves - Box of 100',
        quantity: 50,
        rate: 12.50,
        unit: 'box',
        total: 625.00
      },
      {
        description: 'Hand Sanitizer - 1L Bottle',
        quantity: 75,
        rate: 8.99,
        unit: 'bottle',
        total: 674.25
      }
    ],
    fees: [],
    extractedText: 'Invoice for medical supplies delivered January 15, 2024...',
    metadata: { pages: 2, confidence: 0.97 },
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
  },
  {
    id: 'INV-2024-002',
    vendorId: '2',
    vendor: mockVendors[1],
    invoiceNumber: 'CC240120001',
    invoiceDate: '2024-01-20T00:00:00Z',
    dueDate: '2024-02-04T00:00:00Z',
    fileName: 'cleancorp-weekly-service.pdf',
    fileUrl: '/invoices/cleancorp-weekly-service.pdf',
    status: 'flagged',
    totalAmount: 1250.00,
    subtotal: 1250.00,
    lineItems: [
      {
        description: 'Weekly Cleaning Service - January',
        quantity: 4,
        rate: 312.50,
        unit: 'week',
        total: 1250.00
      }
    ],
    fees: [],
    extractedText: 'Weekly cleaning service invoice for January 2024...',
    metadata: { pages: 1, confidence: 0.94 },
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-21T00:00:00Z',
  },
  {
    id: 'INV-2024-045',
    vendorId: '4',
    vendor: mockVendors[3],
    invoiceNumber: 'TS240125001',
    invoiceDate: '2024-01-25T00:00:00Z',
    dueDate: '2024-02-24T00:00:00Z',
    fileName: 'techservices-consulting.pdf',
    fileUrl: '/invoices/techservices-consulting.pdf',
    status: 'rejected',
    totalAmount: 5000.00,
    subtotal: 5000.00,
    lineItems: [
      {
        description: 'IT Consulting Services',
        quantity: 40,
        rate: 125.00,
        unit: 'hour',
        total: 5000.00
      }
    ],
    fees: [],
    extractedText: 'IT consulting services invoice - rate exceeds contract terms...',
    metadata: { pages: 1, confidence: 0.91 },
    createdAt: '2024-01-25T00:00:00Z',
    updatedAt: '2024-01-26T00:00:00Z',
  },
  {
    id: 'INV-2024-003',
    vendorId: '3',
    vendor: mockVendors[2],
    invoiceNumber: 'FS240201001',
    invoiceDate: '2024-02-01T00:00:00Z',
    dueDate: '2024-03-17T00:00:00Z',
    fileName: 'foodservice-february.pdf',
    fileUrl: '/invoices/foodservice-february.pdf',
    status: 'pending',
    totalAmount: 3750.00,
    subtotal: 3750.00,
    lineItems: [
      {
        description: 'Daily Meal Service - February',
        quantity: 28,
        rate: 133.93,
        unit: 'day',
        total: 3750.00
      }
    ],
    fees: [],
    extractedText: 'February meal service invoice awaiting reconciliation...',
    metadata: { pages: 2, confidence: 0.89 },
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
]

export const mockReconciliationReports: ReconciliationReport[] = [
  {
    id: 'RPT-2024-001',
    invoiceId: 'INV-2024-001',
    contractId: 'CON-2024-001',
    hasDiscrepancies: false,
    totalDiscrepancyAmount: 0,
    discrepancies: [],
    checklist: [
      {
        item: 'Invoice total matches line item sum',
        passed: true,
        details: 'Calculated total: $4567.89, Invoice total: $4567.89',
        confidence: 0.99
      },
      {
        item: 'Unit rates match contract terms',
        passed: true,
        details: 'All rates within contracted pricing',
        confidence: 0.95
      },
      {
        item: 'Payment terms compliance',
        passed: true,
        details: 'Net 30 terms match contract',
        confidence: 0.98
      }
    ],
    rationaleText: 'Invoice has been successfully reconciled against contract CON-2024-001. All line items, rates, and terms match the agreed contract. No discrepancies found.',
    metadata: { processingTime: 2.3, aiModel: 'claude-3.5-sonnet' },
    createdAt: '2024-01-16T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
  },
  {
    id: 'RPT-2024-002',
    invoiceId: 'INV-2024-002',
    contractId: 'CON-2024-002',
    hasDiscrepancies: true,
    totalDiscrepancyAmount: 150.00,
    discrepancies: [
      {
        type: 'rate_discrepancy',
        priority: 'medium',
        description: 'Hourly rate exceeds contracted amount',
        expectedValue: 25.00,
        actualValue: 31.25,
        amount: 150.00,
        lineItemIndex: 0
      }
    ],
    checklist: [
      {
        item: 'Invoice total matches line item sum',
        passed: true,
        details: 'Calculated total: $1250.00, Invoice total: $1250.00',
        confidence: 0.99
      },
      {
        item: 'Unit rates match contract terms',
        passed: false,
        details: 'Rate $31.25/hour exceeds contract rate $25.00/hour',
        confidence: 0.96
      }
    ],
    rationaleText: 'Invoice shows rate discrepancy. The hourly rate of $31.25 exceeds the contracted rate of $25.00 by $6.25 per hour. Over 4 weeks (24 hours total), this results in $150.00 overcharge. Recommend vendor correction or contract amendment.',
    metadata: { processingTime: 3.1, aiModel: 'claude-3.5-sonnet' },
    createdAt: '2024-01-21T00:00:00Z',
    updatedAt: '2024-01-21T00:00:00Z',
  }
]

// Mock API responses with delays to simulate real API
export const mockApiDelay = (ms: number = 800) => 
  new Promise(resolve => setTimeout(resolve, ms))

export const mockApiClient = {
  async getVendors() {
    await mockApiDelay()
    return { data: mockVendors, status: 200 }
  },

  async getVendor(id: string) {
    await mockApiDelay()
    const vendor = mockVendors.find(v => v.id === id)
    return vendor 
      ? { data: vendor, status: 200 }
      : { error: 'Vendor not found', status: 404 }
  },

  async getContracts(vendorId?: string) {
    await mockApiDelay()
    let contracts = mockContracts
    if (vendorId) {
      contracts = contracts.filter(c => c.vendorId === vendorId)
    }
    return { data: contracts, status: 200 }
  },

  async getContract(id: string) {
    await mockApiDelay()
    const contract = mockContracts.find(c => c.id === id)
    return contract
      ? { data: contract, status: 200 }
      : { error: 'Contract not found', status: 404 }
  },

  async getInvoices(vendorId?: string, status?: string) {
    await mockApiDelay()
    let invoices = mockInvoices
    if (vendorId) {
      invoices = invoices.filter(i => i.vendorId === vendorId)
    }
    if (status) {
      invoices = invoices.filter(i => i.status === status)
    }
    return { data: invoices, status: 200 }
  },

  async getInvoice(id: string) {
    await mockApiDelay()
    const invoice = mockInvoices.find(i => i.id === id)
    return invoice
      ? { data: invoice, status: 200 }
      : { error: 'Invoice not found', status: 404 }
  },

  async getReconciliationReport(invoiceId: string) {
    await mockApiDelay()
    const report = mockReconciliationReports.find(r => r.invoiceId === invoiceId)
    return report
      ? { data: report, status: 200 }
      : { error: 'Report not found', status: 404 }
  },

  async getInvoiceStats() {
    await mockApiDelay()
    return {
      data: {
        total: mockInvoices.length,
        pending: mockInvoices.filter(i => i.status === 'pending').length,
        reconciled: mockInvoices.filter(i => i.status === 'reconciled').length,
        flagged: mockInvoices.filter(i => i.status === 'flagged').length,
        approved: mockInvoices.filter(i => i.status === 'approved').length,
        rejected: mockInvoices.filter(i => i.status === 'rejected').length,
        totalAmount: mockInvoices.reduce((sum, i) => sum + i.totalAmount, 0),
        totalDiscrepancies: mockReconciliationReports.reduce((sum, r) => sum + r.totalDiscrepancyAmount, 0),
        totalSavings: mockVendors.reduce((sum, v) => sum + v.totalSavings, 0),
      },
      status: 200
    }
  },

  async approveInvoice(id: string) {
    await mockApiDelay()
    const invoice = mockInvoices.find(i => i.id === id)
    if (invoice) {
      invoice.status = 'approved'
      return { data: invoice, status: 200 }
    }
    return { error: 'Invoice not found', status: 404 }
  },

  async rejectInvoice(id: string, reason: string) {
    await mockApiDelay()
    const invoice = mockInvoices.find(i => i.id === id)
    if (invoice) {
      invoice.status = 'rejected'
      return { data: invoice, status: 200 }
    }
    return { error: 'Invoice not found', status: 404 }
  }
}