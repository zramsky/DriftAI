'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, Search, FileText, Calendar, AlertCircle } from 'lucide-react'
import { apiClient, type Contract, type Vendor } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useContractPolling } from '@/hooks/use-polling'

export default function ContractsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [lastUploadedContractId, setLastUploadedContractId] = useState<string | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { startPolling } = useContractPolling(lastUploadedContractId)

  const { data: contracts, isLoading, error } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const response = await apiClient.getContracts()
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

  const uploadContractMutation = useMutation({
    mutationFn: ({ vendorId, file }: { vendorId: string; file: File }) => 
      apiClient.uploadContract(vendorId, file),
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
          description: `Contract uploaded successfully! Job ID: ${response.data?.jobId}`,
        })
        
        // Start polling for the uploaded contract
        if (response.data?.contractId) {
          setLastUploadedContractId(response.data.contractId)
          startPolling()
        }
        
        queryClient.invalidateQueries({ queryKey: ['contracts'] })
        resetUploadForm()
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to upload contract. Please try again.',
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

    uploadContractMutation.mutate({ vendorId: selectedVendorId, file: selectedFile })
  }

  const filteredContracts = contracts?.filter(contract =>
    contract.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.vendor?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const getStatusBadge = (status: Contract['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'needs_review':
        return <Badge variant="warning">Needs Review</Badge>
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <Button disabled>
            <Upload className="mr-2 h-4 w-4" />
            Upload Contract
          </Button>
        </div>
        <div className="text-center py-12">Loading contracts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <Button disabled>
            <Upload className="mr-2 h-4 w-4" />
            Upload Contract
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-red-600">
              Error loading contracts. Please check your backend connection.
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
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground">
            Manage vendor contracts and monitor their status
          </p>
        </div>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Contract
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upload Contract</DialogTitle>
              <DialogDescription>
                Upload a PDF contract for a specific vendor.
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
                <Label htmlFor="file">Contract File *</Label>
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
                disabled={uploadContractMutation.isPending}
              >
                {uploadContractMutation.isPending ? 'Uploading...' : 'Upload Contract'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contracts?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts?.filter(c => c.status === 'active').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts?.filter(c => c.status === 'needs_review').length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contracts?.filter(c => {
                if (!c.endDate) return false
                const endDate = new Date(c.endDate)
                const thirtyDaysFromNow = new Date()
                thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
                return endDate <= thirtyDaysFromNow
              }).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Management</CardTitle>
          <CardDescription>View and manage all vendor contracts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Effective Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {contracts?.length === 0 ? 'No contracts found. Upload your first contract to get started.' : 'No contracts match your search criteria.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredContracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contract.fileName}</div>
                        <div className="text-sm text-muted-foreground">
                          Uploaded {formatDate(contract.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contract.vendor?.name || 'Unknown'}</div>
                        <div className="text-sm text-muted-foreground">
                          {contract.vendor?.businessDescription || 'No description'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(contract.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(contract.effectiveDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {contract.endDate ? formatDate(contract.endDate) : 'No end date'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          Download
                        </Button>
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