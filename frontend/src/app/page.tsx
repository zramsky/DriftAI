'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  FileText, 
  Building2, 
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your contract and invoice reconciliation activity
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24,567</div>
            <p className="text-xs text-muted-foreground">
              +18.2% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground">
              +3 new this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest processed invoices and contracts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <CheckCircle className="h-5 w-5 text-success" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Invoice <span className="font-mono text-xs bg-muted px-1 rounded">INV-2024-001</span> reconciled</p>
                  <p className="text-xs text-muted-foreground">MedSupply Co. - 2 minutes ago</p>
                </div>
                <Badge variant="success">Approved</Badge>
              </div>
              
              <div className="flex items-center space-x-4">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Contract rate discrepancy detected</p>
                  <p className="text-xs text-muted-foreground">CleanCorp - 15 minutes ago</p>
                </div>
                <Badge variant="warning">Flagged</Badge>
              </div>
              
              <div className="flex items-center space-x-4">
                <FileText className="h-5 w-5 text-info" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">New contract <span className="font-mono text-xs bg-muted px-1 rounded">CON-2024-089</span> uploaded</p>
                  <p className="text-xs text-muted-foreground">FoodService Plus - 1 hour ago</p>
                </div>
                <Badge variant="info">Processing</Badge>
              </div>
              
              <div className="flex items-center space-x-4">
                <XCircle className="h-5 w-5 text-destructive" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">Invoice <span className="font-mono text-xs bg-muted px-1 rounded">INV-2024-045</span> rejected</p>
                  <p className="text-xs text-muted-foreground">TechServices LLC - 2 hours ago</p>
                </div>
                <Badge variant="destructive">Rejected</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Vendors by Savings */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors by Savings</CardTitle>
            <CardDescription>Vendors with highest identified savings this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">MedSupply Co.</p>
                  <p className="text-xs text-muted-foreground">Medical Supplies</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success">$8,245</p>
                  <p className="text-xs text-muted-foreground">15 invoices</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">CleanCorp</p>
                  <p className="text-xs text-muted-foreground">Cleaning Services</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success">$5,123</p>
                  <p className="text-xs text-muted-foreground">8 invoices</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">FoodService Plus</p>
                  <p className="text-xs text-muted-foreground">Food Vendor</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success">$3,890</p>
                  <p className="text-xs text-muted-foreground">22 invoices</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">TechServices LLC</p>
                  <p className="text-xs text-muted-foreground">IT Services</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success">$2,456</p>
                  <p className="text-xs text-muted-foreground">5 invoices</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <button className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition-colors">
              <Building2 className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium">Add Vendor</span>
            </button>
            
            <button className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition-colors">
              <FileText className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium">Upload Contract</span>
            </button>
            
            <button className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition-colors">
              <CheckCircle className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium">Process Invoice</span>
            </button>
            
            <button className="flex flex-col items-center justify-center p-4 border rounded-lg hover:bg-accent transition-colors">
              <TrendingUp className="h-8 w-8 mb-2 text-primary" />
              <span className="text-sm font-medium">View Analytics</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
