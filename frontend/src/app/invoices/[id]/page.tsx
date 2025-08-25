'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowLeft, 
  FileText, 
  DollarSign,
  Clock,
  Eye
} from 'lucide-react'
import { apiClient, type Invoice, type ReconciliationReport } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoices', invoiceId],
    queryFn: async () => {
      const response = await apiClient.getInvoice(invoiceId)
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data
    },
  })

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['reconciliation-report', invoiceId],
    queryFn: async () => {
      const response = await apiClient.getReconciliationReport(invoiceId)
      if (response.error) {
        // Report might not exist yet, which is okay
        return null
      }
      return response.data
    },
    enabled: !!invoice && (invoice.status === 'flagged' || invoice.status === 'reconciled'),
  })

  const approveMutation = useMutation({
    mutationFn: () => apiClient.approveInvoice(invoiceId),
    onSuccess: (response) => {
      if (response.error) {
        toast({
          title: 'Error',
          description: response.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'Invoice approved successfully!',
        })
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        queryClient.invalidateQueries({ queryKey: ['invoices', invoiceId] })
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to approve invoice. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => apiClient.rejectInvoice(invoiceId, reason),
    onSuccess: (response) => {
      if (response.error) {
        toast({
          title: 'Error',
          description: response.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Success',
          description: 'Invoice rejected successfully!',
        })
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        queryClient.invalidateQueries({ queryKey: ['invoices', invoiceId] })
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to reject invoice. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'flagged':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Flagged</Badge>
      case 'reconciled':
        return <Badge variant="secondary">Reconciled</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return 'text-red-600'
      case 'high':
        return 'text-orange-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  if (invoiceLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Invoice not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-muted-foreground">
              {invoice.vendor?.name} • {formatDate(invoice.invoiceDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusBadge(invoice.status)}
          {invoice.status === 'flagged' && (
            <>
              <Button 
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => rejectMutation.mutate('Manual rejection from detail page')}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(invoice.totalAmount)}</div>
            {invoice.subtotal !== invoice.totalAmount && (
              <p className="text-xs text-muted-foreground">
                Subtotal: {formatCurrency(invoice.subtotal)}
                {invoice.taxAmount && ` + Tax: ${formatCurrency(invoice.taxAmount)}`}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Date</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {invoice.dueDate ? formatDate(invoice.dueDate) : 'Not specified'}
            </div>
            {invoice.dueDate && (
              <p className="text-xs text-muted-foreground">
                {new Date(invoice.dueDate) < new Date() ? 'Overdue' : 'Upcoming'}
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Line Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoice.lineItems?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">File</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{invoice.fileName}</div>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <a href={invoice.fileUrl} target="_blank" rel="noopener noreferrer">
                View PDF
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      {invoice.lineItems && invoice.lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Detailed breakdown of invoice items</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.lineItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{formatCurrency(item.rate)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Reconciliation Report */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span>Reconciliation Report</span>
            </CardTitle>
            <CardDescription>
              {report.hasDiscrepancies 
                ? `${report.discrepancies?.length || 0} discrepancies found totaling ${formatCurrency(report.totalDiscrepancyAmount)}`
                : 'No discrepancies found'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Discrepancies */}
            {report.discrepancies && report.discrepancies.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Discrepancies</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Expected</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.discrepancies.map((discrepancy, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{discrepancy.type}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPriorityColor(discrepancy.priority)}>
                            {discrepancy.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{discrepancy.description}</TableCell>
                        <TableCell>{String(discrepancy.expectedValue)}</TableCell>
                        <TableCell>{String(discrepancy.actualValue)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(discrepancy.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Checklist */}
            {report.checklist && report.checklist.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Validation Checklist</h4>
                <div className="space-y-2">
                  {report.checklist.map((item, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-md bg-gray-50">
                      {item.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{item.item}</div>
                        <div className="text-sm text-muted-foreground">{item.details}</div>
                        <div className="text-xs text-muted-foreground">
                          Confidence: {Math.round(item.confidence * 100)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rationale */}
            {report.rationaleText && (
              <div>
                <h4 className="font-semibold mb-3">AI Analysis</h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm">{report.rationaleText}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Show loading state for reconciliation report */}
      {reportLoading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              Loading reconciliation report...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}