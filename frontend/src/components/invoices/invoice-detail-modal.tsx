'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  Calculator,
  Brain,
  Download,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { apiClient, type Invoice, type ReconciliationReport } from '@/lib/api'

interface InvoiceDetailModalProps {
  invoiceId: string | null
  isOpen: boolean
  onClose: () => void
}

export function InvoiceDetailModal({ invoiceId, isOpen, onClose }: InvoiceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'reconciliation' | 'line-items'>('details')

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null
      const response = await apiClient.getInvoice(invoiceId)
      if (response.error) throw new Error(response.error)
      return response.data
    },
    enabled: !!invoiceId && isOpen,
  })

  const { data: reconciliationReport, isLoading: reportLoading } = useQuery({
    queryKey: ['reconciliation-report', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null
      const response = await apiClient.getReconciliationReport(invoiceId)
      if (response.error) return null // Some invoices may not have reports yet
      return response.data
    },
    enabled: !!invoiceId && isOpen,
  })

  const handleApprove = async () => {
    if (!invoiceId) return
    try {
      await apiClient.approveInvoice(invoiceId)
      // In a real app, you'd refetch the invoice list or update the cache
      onClose()
    } catch (error) {
      console.error('Failed to approve invoice:', error)
    }
  }

  const handleReject = async () => {
    if (!invoiceId) return
    try {
      await apiClient.rejectInvoice(invoiceId, 'Manual review required')
      // In a real app, you'd refetch the invoice list or update the cache
      onClose()
    } catch (error) {
      console.error('Failed to reject invoice:', error)
    }
  }

  if (!isOpen || !invoice) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reconciled': return 'success'
      case 'approved': return 'success'
      case 'flagged': return 'warning'
      case 'rejected': return 'destructive'
      case 'pending': return 'secondary'
      default: return 'secondary'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'warning'
      case 'medium': return 'warning'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <FileText className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-semibold">{invoice.invoiceNumber}</h2>
              <p className="text-sm text-muted-foreground">{invoice.vendor?.name}</p>
            </div>
            <Badge variant={getStatusColor(invoice.status) as any}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'details'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Invoice Details
          </button>
          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'reconciliation'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Brain className="h-4 w-4 inline mr-1" />
            AI Reconciliation
          </button>
          <button
            onClick={() => setActiveTab('line-items')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'line-items'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Line Items
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Invoice Overview */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Invoice Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice Number:</span>
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice Date:</span>
                      <span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File:</span>
                      <span className="text-sm">{invoice.fileName}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Amount Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>${invoice.subtotal.toLocaleString()}</span>
                    </div>
                    {invoice.taxAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax:</span>
                        <span>${invoice.taxAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${invoice.totalAmount.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vendor Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Vendor Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{invoice.vendor?.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Business Type:</span>
                      <p>{invoice.vendor?.businessDescription || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={invoice.vendor?.active ? 'success' : 'secondary'}>
                        {invoice.vendor?.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'reconciliation' && (
            <div className="space-y-6">
              {reportLoading ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center space-x-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Loading reconciliation report...</span>
                  </div>
                </div>
              ) : reconciliationReport ? (
                <>
                  {/* AI Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Brain className="h-5 w-5" />
                        <span>AI Reconciliation Summary</span>
                      </CardTitle>
                      <CardDescription>
                        Processed by {reconciliationReport.metadata?.aiModel || 'Claude 3.5 Sonnet'} 
                        {reconciliationReport.metadata?.processingTime && 
                          ` in ${reconciliationReport.metadata.processingTime}s`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted rounded-lg p-4">
                        <p className="text-sm leading-relaxed">{reconciliationReport.rationaleText}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Discrepancies */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        {reconciliationReport.hasDiscrepancies ? (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <span>Discrepancies Found</span>
                        {reconciliationReport.hasDiscrepancies && (
                          <Badge variant="warning">
                            ${reconciliationReport.totalDiscrepancyAmount.toLocaleString()} total
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {reconciliationReport.discrepancies.length === 0 ? (
                        <div className="text-center py-4 text-green-600">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                          <p>No discrepancies found - invoice matches contract terms</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reconciliationReport.discrepancies.map((discrepancy, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <Badge variant={getPriorityColor(discrepancy.priority) as any}>
                                    {discrepancy.priority.toUpperCase()}
                                  </Badge>
                                  <span className="font-medium">{discrepancy.type.replace('_', ' ')}</span>
                                </div>
                                <Badge variant="destructive">
                                  ${discrepancy.amount.toLocaleString()}
                                </Badge>
                              </div>
                              <p className="text-sm mb-3">{discrepancy.description}</p>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Expected:</span>
                                  <p className="font-medium">${discrepancy.expectedValue.toLocaleString()}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Actual:</span>
                                  <p className="font-medium">${discrepancy.actualValue.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Checklist */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Validation Checklist</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {reconciliationReport.checklist.map((item, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            {item.passed ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{item.item}</span>
                                <Badge variant="secondary">
                                  {Math.round(item.confidence * 100)}% confidence
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{item.details}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No reconciliation report available yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The AI reconciliation process may still be running
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'line-items' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>Detailed breakdown of invoice items</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoice.lineItems.map((item, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{item.description}</h4>
                          <span className="font-semibold">${item.total.toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span>Quantity:</span>
                            <p className="font-medium text-foreground">{item.quantity}</p>
                          </div>
                          <div>
                            <span>Unit:</span>
                            <p className="font-medium text-foreground">{item.unit}</p>
                          </div>
                          <div>
                            <span>Rate:</span>
                            <p className="font-medium text-foreground">${item.rate.toLocaleString()}</p>
                          </div>
                          <div>
                            <span>Total:</span>
                            <p className="font-medium text-foreground">${item.total.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/30">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View Original
            </Button>
          </div>
          
          {(invoice.status === 'flagged' || invoice.status === 'pending') && (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleReject}
                className="text-red-600 hover:text-red-700"
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button 
                size="sm"
                onClick={handleApprove}
                className="bg-green-600 hover:bg-green-700"
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}