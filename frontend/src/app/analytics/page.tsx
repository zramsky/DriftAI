'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle,
  PieChart,
  Activity
} from 'lucide-react'
import { apiClient } from '@/lib/api'

export default function AnalyticsPage() {
  const { data: invoiceStats, isLoading: loadingInvoices } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: async () => {
      const response = await apiClient.getInvoiceStats()
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data
    },
  })

  const { data: vendors, isLoading: loadingVendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await apiClient.getVendors()
      if (response.error) {
        throw new Error(response.error)
      }
      return response.data || []
    },
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%'
    return `${((value / total) * 100).toFixed(1)}%`
  }

  const topVendorsBySavings = vendors
    ?.filter(v => v.totalSavings > 0)
    ?.sort((a, b) => Number(b.totalSavings) - Number(a.totalSavings))
    ?.slice(0, 10) || []

  const riskVendors = vendors
    ?.filter(v => v.totalDiscrepancies > 1000)
    ?.sort((a, b) => Number(b.totalDiscrepancies) - Number(a.totalDiscrepancies))
    ?.slice(0, 5) || []

  if (loadingInvoices || loadingVendors) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Insights and performance metrics for your reconciliation platform
          </p>
        </div>
        <div className="text-center py-12">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Insights and performance metrics for your reconciliation platform
        </p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(invoiceStats?.totalSavings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {invoiceStats?.total || 0} invoices processed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoiceStats?.total ? formatPercentage(
                (invoiceStats.reconciled + invoiceStats.approved), 
                invoiceStats.total
              ) : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              Invoices successfully processed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discrepancy Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoiceStats?.total ? formatPercentage(invoiceStats.flagged, invoiceStats.total) : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoiceStats?.flagged || 0} invoices flagged
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoiceStats?.total ? formatCurrency((invoiceStats.totalSavings || 0) / invoiceStats.total) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Per invoice processed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Invoice Status Breakdown</span>
            </CardTitle>
            <CardDescription>Distribution of invoice processing status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Approved</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{invoiceStats?.approved || 0}</span>
                  <span className="text-xs text-muted-foreground">
                    ({invoiceStats?.total ? formatPercentage(invoiceStats.approved, invoiceStats.total) : '0%'})
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Reconciled</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{invoiceStats?.reconciled || 0}</span>
                  <span className="text-xs text-muted-foreground">
                    ({invoiceStats?.total ? formatPercentage(invoiceStats.reconciled, invoiceStats.total) : '0%'})
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Flagged</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{invoiceStats?.flagged || 0}</span>
                  <span className="text-xs text-muted-foreground">
                    ({invoiceStats?.total ? formatPercentage(invoiceStats.flagged, invoiceStats.total) : '0%'})
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{invoiceStats?.pending || 0}</span>
                  <span className="text-xs text-muted-foreground">
                    ({invoiceStats?.total ? formatPercentage(invoiceStats.pending, invoiceStats.total) : '0%'})
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Rejected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{invoiceStats?.rejected || 0}</span>
                  <span className="text-xs text-muted-foreground">
                    ({invoiceStats?.total ? formatPercentage(invoiceStats.rejected, invoiceStats.total) : '0%'})
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Risk Vendors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>High Risk Vendors</span>
            </CardTitle>
            <CardDescription>Vendors with significant discrepancies</CardDescription>
          </CardHeader>
          <CardContent>
            {riskVendors.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No high-risk vendors identified
              </div>
            ) : (
              <div className="space-y-4">
                {riskVendors.map((vendor) => (
                  <div key={vendor.id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{vendor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {vendor.businessDescription || 'No description'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">
                        {formatCurrency(Number(vendor.totalDiscrepancies))}
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        High Risk
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Vendors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Top Vendors by Savings Identified</span>
          </CardTitle>
          <CardDescription>Vendors where we've identified the most cost savings</CardDescription>
        </CardHeader>
        <CardContent>
          {topVendorsBySavings.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No savings data available yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Business Type</TableHead>
                  <TableHead>Total Savings</TableHead>
                  <TableHead>Invoices Processed</TableHead>
                  <TableHead>Avg Savings per Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topVendorsBySavings.map((vendor, index) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="font-medium">{vendor.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{vendor.businessDescription || 'Not specified'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        {formatCurrency(Number(vendor.totalSavings))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{vendor.totalInvoices}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {vendor.totalInvoices > 0 
                          ? formatCurrency(Number(vendor.totalSavings) / vendor.totalInvoices)
                          : '$0'
                        }
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}