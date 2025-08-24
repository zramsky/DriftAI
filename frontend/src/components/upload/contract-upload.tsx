'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ContractUploadProps {
  onUploadComplete: (result: {
    vendorName: string
    contractId: string
    fileName: string
  }) => void
}

export function ContractUpload({ onUploadComplete }: ContractUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [vendorName, setVendorName] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: true
  } as any)

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!vendorName.trim() || files.length === 0) return

    setIsUploading(true)
    setUploadStatus('processing')

    // Simulate contract processing with AI
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Simulate successful processing
      const contractId = `CON-${Date.now().toString().slice(-6)}`
      
      setUploadStatus('success')
      
      setTimeout(() => {
        onUploadComplete({
          vendorName,
          contractId,
          fileName: files[0].name
        })
      }, 1500)
      
    } catch (error) {
      setUploadStatus('error')
    } finally {
      setIsUploading(false)
    }
  }

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'processing':
        return 'Analyzing contract with Claude AI...'
      case 'success':
        return 'Contract processed successfully!'
      case 'error':
        return 'Upload failed. Please try again.'
      default:
        return ''
    }
  }

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'processing':
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
          <FileText className="h-5 w-5" />
          Upload Contract
        </CardTitle>
        <CardDescription>
          Upload contract files to create vendor profiles and enable invoice reconciliation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vendor Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor-name">Vendor Name *</Label>
            <Input
              id="vendor-name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g., MedSupply Co."
              disabled={isUploading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="business-desc">Business Description</Label>
            <Textarea
              id="business-desc"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="e.g., Medical supplies and equipment"
              disabled={isUploading}
              rows={2}
            />
          </div>
        </div>

        {/* File Upload Area */}
        <div className="space-y-4">
          <Label>Contract Files *</Label>
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
              {isDragActive ? 'Drop files here...' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, or TXT files (max 10MB each)
            </p>
          </div>
        </div>

        {/* Uploaded Files List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Files</Label>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Status */}
        {uploadStatus !== 'idle' && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {getStatusIcon()}
            <span className="text-sm">{getStatusMessage()}</span>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={!vendorName.trim() || files.length === 0 || isUploading}
          className="w-full"
          size="lg"
        >
          {isUploading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              Processing Contract...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload & Process Contract
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}