'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Upload, Receipt, X, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { apiClient, type Vendor } from '@/lib/api'

interface InvoiceUploadProps {
  onUploadComplete: (result: {
    invoiceId: string
    vendorId: string
    fileName: string
    reconciliationStatus: 'processing' | 'completed' | 'flagged'
  }) => void
}

export function InvoiceUpload({ onUploadComplete }: InvoiceUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'reconciling' | 'success' | 'error'>('idle')
  const [reconciliationResults, setReconciliationResults] = useState<any>(null)

  // Fetch available vendors
  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await apiClient.getVendors()
      return response.data || []
    }
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    maxFiles: 1
  } as any)

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!selectedVendorId || files.length === 0) return

    setIsUploading(true)
    setUploadStatus('processing')

    try {
      // Step 1: Extract invoice data
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setUploadStatus('reconciling')
      
      // Step 2: AI Reconciliation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Simulate reconciliation results
      const hasDiscrepancies = Math.random() > 0.7
      const invoiceId = `INV-${Date.now().toString().slice(-6)}`
      
      const results = {
        invoiceId,
        totalAmount: 2850.00,
        discrepancies: hasDiscrepancies ? [
          {
            type: 'Rate Mismatch',
            description: 'Invoice rate $125/hr exceeds contract rate $95/hr',
            expectedValue: 95,
            actualValue: 125,
            amount: 150.00,
            priority: 'high' as const
          }
        ] : [],
        confidence: hasDiscrepancies ? 85 : 98,
        status: hasDiscrepancies ? 'flagged' as const : 'completed' as const
      }
      
      setReconciliationResults(results)
      setUploadStatus('success')
      
      setTimeout(() => {
        onUploadComplete({
          invoiceId,
          vendorId: selectedVendorId,
          fileName: files[0].name,
          reconciliationStatus: results.status
        })
      }, 2000)
      
    } catch (error) {
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'processing':
        return 'Extracting invoice data with OCR...'
      case 'reconciling':
        return 'Running AI reconciliation with Claude...'
      case 'success':
        return 'Invoice processed and reconciled!'
      case 'error':
        return 'Processing failed. Please try again.'
      default:
        return ''
    }
  }

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'processing':
      case 'reconciling':
        return <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Upload Invoice
        </CardTitle>
        <CardDescription>
          Upload invoice files for automatic reconciliation against vendor contracts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vendor Selection */}
        <div className="space-y-2">
          <Label htmlFor="vendor-select">Select Vendor *</Label>
          <Select value={selectedVendorId} onValueChange={setSelectedVendorId} disabled={isUploading || vendorsLoading}>
            <SelectTrigger>
              <SelectValue placeholder={vendorsLoading ? "Loading vendors..." : "Choose a vendor"} />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((vendor: Vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{vendor.name}</span>
                    {vendor.businessDescription && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {vendor.businessDescription}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Invoice Number */}
        <div className="space-y-2">
          <Label htmlFor="invoice-number">Invoice Number</Label>
          <Input
            id="invoice-number"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="e.g., INV-2024-001 (optional - will be auto-detected)"
            disabled={isUploading}
          />
        </div>

        {/* File Upload Area */}
        <div className="space-y-4">
          <Label>Invoice File *</Label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
              ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input {...getInputProps()} disabled={isUploading} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              {isDragActive ? 'Drop invoice here...' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, JPG, PNG, CSV, or XLSX files (max 10MB)
            </p>
          </div>
        </div>

        {/* Uploaded File */}
        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Invoice</Label>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{files[0].name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(files[0].size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(0)}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Processing Status */}
        {uploadStatus !== 'idle' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              {getStatusIcon()}
              <span className="text-sm">{getStatusMessage()}</span>
            </div>

            {/* Reconciliation Results */}
            {reconciliationResults && uploadStatus === 'success' && (
              <div className="p-4 bg-card border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    AI Reconciliation Results
                  </h4>
                  <Badge variant={reconciliationResults.status === 'flagged' ? 'destructive' : 'success'}>
                    {reconciliationResults.status === 'flagged' ? 'Issues Found' : 'Clean'}
                  </Badge>
                </div>
                
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-medium">${reconciliationResults.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence Score:</span>
                    <span className="font-medium">{reconciliationResults.confidence}%</span>
                  </div>
                </div>

                {reconciliationResults.discrepancies.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-destructive">Discrepancies Found:</h5>
                    {reconciliationResults.discrepancies.map((disc: any, index: number) => (
                      <div key={index} className="text-sm p-2 bg-destructive/10 rounded border-l-2 border-destructive">
                        <div className="font-medium">{disc.type}</div>
                        <div className="text-xs text-muted-foreground">{disc.description}</div>
                        <div className="text-xs mt-1">
                          Impact: <span className="font-medium">${disc.amount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!selectedVendorId || files.length === 0 || isUploading}
          className="w-full"
          size="lg"
        >
          {isUploading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              {uploadStatus === 'reconciling' ? 'Running AI Reconciliation...' : 'Processing Invoice...'}
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Upload & Reconcile Invoice
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}