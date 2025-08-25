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
import { Plus, Search, Building2, FileText, DollarSign } from 'lucide-react'
import { apiClient, type Vendor } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function VendorsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false)
  const [newVendor, setNewVendor] = useState({
    name: '',
    canonicalName: '',
    businessDescription: '',
    active: true,
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: vendors, isLoading, error } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await apiClient.getVendors()
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data || []
    },
  })

  const createVendorMutation = useMutation({
    mutationFn: (vendor: typeof newVendor) => apiClient.createVendor(vendor),
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
          description: 'Vendor created successfully!',
        })
        queryClient.invalidateQueries({ queryKey: ['vendors'] })
        setIsAddVendorOpen(false)
        setNewVendor({
          name: '',
          canonicalName: '',
          businessDescription: '',
          active: true,
        })
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create vendor. Please try again.',
        variant: 'destructive',
      })
    },
  })

  const handleCreateVendor = () => {
    if (!newVendor.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Vendor name is required.',
        variant: 'destructive',
      })
      return
    }
    
    // Auto-generate canonical name if not provided
    const vendorToCreate = {
      ...newVendor,
      canonicalName: newVendor.canonicalName || newVendor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    }
    
    createVendorMutation.mutate(vendorToCreate)
  }

  const filteredVendors = vendors?.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.businessDescription?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
        <div className="text-center py-12">Loading vendors...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Vendor
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-red-600">
              Error loading vendors. Please check your backend connection.
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
          <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
          <p className="text-muted-foreground">
            Manage your vendor relationships and contracts
          </p>
        </div>
        <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Vendor</DialogTitle>
              <DialogDescription>
                Create a new vendor to manage contracts and invoices.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter vendor name"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="canonicalName">Canonical Name</Label>
                <Input
                  id="canonicalName"
                  placeholder="Auto-generated from name if empty"
                  value={newVendor.canonicalName}
                  onChange={(e) => setNewVendor({ ...newVendor, canonicalName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="businessDescription">Business Description</Label>
                <Input
                  id="businessDescription"
                  placeholder="Optional description of the business"
                  value={newVendor.businessDescription}
                  onChange={(e) => setNewVendor({ ...newVendor, businessDescription: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddVendorOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateVendor} 
                disabled={createVendorMutation.isPending}
              >
                {createVendorMutation.isPending ? 'Creating...' : 'Create Vendor'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendors?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {vendors?.filter(v => v.active).length || 0} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendors?.reduce((sum, v) => sum + v.totalInvoices, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all vendors
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${vendors?.reduce((sum, v) => sum + Number(v.totalSavings), 0).toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Identified through reconciliation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor Directory</CardTitle>
          <CardDescription>Search and manage your vendor relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Business Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contracts</TableHead>
                <TableHead>Total Savings</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {vendors?.length === 0 ? 'No vendors found. Add your first vendor to get started.' : 'No vendors match your search criteria.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-sm text-muted-foreground">{vendor.canonicalName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{vendor.businessDescription || 'Not specified'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.active ? 'success' : 'secondary'}>
                        {vendor.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{vendor.totalInvoices} invoices</div>
                        <div className="text-muted-foreground">
                          ${Number(vendor.totalDiscrepancies).toLocaleString()} discrepancies
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-green-600">
                        ${Number(vendor.totalSavings).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
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