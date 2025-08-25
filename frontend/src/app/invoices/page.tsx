'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Search, Receipt, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { apiClient, type Invoice, type Vendor } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useInvoicePolling } from '@/hooks/use-polling'

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [lastUploadedInvoiceId, setLastUploadedInvoiceId] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { startPolling } = useInvoicePolling(lastUploadedInvoiceId)

  const { data: invoices, isLoading, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await apiClient.getInvoices()
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data || []
    },
  })

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await apiClient.getVendors()
      if (response.error) {
        return []
      }
      return response.data || []
    },
  })

  const uploadInvoiceMutation = useMutation({
    mutationFn: ({ vendorId, file }: { vendorId: string; file: File }) => 
      apiClient.uploadInvoice(vendorId, file),
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
          description: `Invoice uploaded successfully! Job ID: ${response.data?.jobId}`,
        })
        
        // Start polling for the uploaded invoice
        if (response.data?.invoiceId) {
          setLastUploadedInvoiceId(response.data.invoiceId)
          startPolling()
        }
        
        queryClient.invalidateQueries({ queryKey: ['invoices'] })
        resetUploadForm()
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to upload invoice. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const resetUploadForm = () => {
    setIsUploadOpen(false)
    setSelectedVendorId('')
    setSelectedFile(null)
  }

  const handleUpload = () => {
    if (!selectedVendorId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a vendor.',
        variant: 'destructive',
      })
      return
    }

    if (!selectedFile) {
      toast({
        title: 'Validation Error',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      })
      return
    }

    if (selectedFile.type !== 'application/pdf') {
      toast({
        title: 'Validation Error',
        description: 'Only PDF files are allowed.',
        variant: 'destructive',
      })
      return
    }

    uploadInvoiceMutation.mutate({ vendorId: selectedVendorId, file: selectedFile })
  }

  const filteredInvoices = invoices?.filter(invoice =>
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      case 'flagged':
        return <Badge variant="warning">Flagged</Badge>
      case 'reconciled':
        return <Badge variant="secondary">Reconciled</Badge>
      case 'pending':
        return <Badge variant="outline">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'flagged':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'reconciled':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-600" />
      default:
        return <Receipt className="h-4 w-4 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <Button disabled>
            <Upload className="mr-2 h-4 w-4" />
            Upload Invoice
          </Button>
        </div>
        <div className="text-center py-12">Loading invoices...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <Button disabled>
            <Upload className="mr-2 h-4 w-4" />
            Upload Invoice
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-red-600">
              Error loading invoices. Please check your backend connection.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Process and reconcile vendor invoices against contracts
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Invoice</DialogTitle>
              <DialogDescription>
                Upload a PDF invoice for a specific vendor.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="vendor">Select Vendor *</Label>
                <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors?.map((vendor: Vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="file">Invoice File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    setSelectedFile(file || null)
                  }}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetUploadForm}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={uploadInvoiceMutation.isPending}
              >
                {uploadInvoiceMutation.isPending ? 'Uploading...' : 'Upload Invoice'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices?.filter(i => i.status === 'pending').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices?.filter(i => i.status === 'flagged').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices?.filter(i => i.status === 'approved').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(invoices?.reduce((sum, i) => sum + i.totalAmount, 0) || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Processing</CardTitle>
          <CardDescription>Review and reconcile vendor invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {invoices?.length === 0 ? 'No invoices found. Upload your first invoice to get started.' : 'No invoices match your search criteria.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(invoice.status)}
                        <div>
                          <div className="font-medium">{invoice.invoiceNumber}</div>
                          <div className="text-sm text-muted-foreground">{invoice.fileName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{invoice.vendor?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.vendor?.businessDescription || 'No description'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(invoice.invoiceDate)}
                        {invoice.dueDate && (
                          <div className="text-muted-foreground">
                            Due: {formatDate(invoice.dueDate)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {formatCurrency(invoice.totalAmount)}
                      </div>
                      {invoice.taxAmount && (
                        <div className="text-xs text-muted-foreground">
                          Tax: {formatCurrency(invoice.taxAmount)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/invoices/${invoice.id}`}>
                            View
                          </Link>
                        </Button>
                        {invoice.status === 'flagged' && (
                          <>
                            <Button variant="outline" size="sm">
                              Approve
                            </Button>
                            <Button variant="outline" size="sm">
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}