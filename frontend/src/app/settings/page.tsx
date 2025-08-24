'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Mail, 
  Globe,
  Zap,
  Save,
  RefreshCw
} from 'lucide-react'

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [discrepancyThreshold, setDiscrepancyThreshold] = useState('100')
  const [autoApproval, setAutoApproval] = useState(false)
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:3001')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your platform preferences and system settings
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>
            Manage your account information and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Full Name</label>
              <Input defaultValue="John Smith" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input defaultValue="john.smith@company.com" type="email" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Organization</label>
            <Input defaultValue="Healthcare Partners LLC" />
          </div>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email Notifications</div>
              <div className="text-sm text-muted-foreground">
                Receive email alerts for flagged invoices and discrepancies
              </div>
            </div>
            <Button 
              variant={emailNotifications ? "default" : "outline"}
              size="sm"
              onClick={() => setEmailNotifications(!emailNotifications)}
            >
              {emailNotifications ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Real-time Alerts</div>
              <div className="text-sm text-muted-foreground">
                Show browser notifications for urgent issues
              </div>
            </div>
            <Button variant="outline" size="sm">
              Configure
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Weekly Digest</div>
              <div className="text-sm text-muted-foreground">
                Summary of reconciliation activity and savings
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* AI Reconciliation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            AI Reconciliation Settings
          </CardTitle>
          <CardDescription>
            Configure automated invoice processing and AI behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Discrepancy Threshold (USD)
            </label>
            <div className="flex items-center space-x-2">
              <Input 
                type="number" 
                value={discrepancyThreshold}
                onChange={(e) => setDiscrepancyThreshold(e.target.value)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">
                Flag invoices with discrepancies above this amount
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto-Approval</div>
              <div className="text-sm text-muted-foreground">
                Automatically approve invoices with no discrepancies
              </div>
            </div>
            <Button 
              variant={autoApproval ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoApproval(!autoApproval)}
            >
              {autoApproval ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">
              AI Confidence Threshold
            </label>
            <div className="flex items-center space-x-2">
              <Input type="number" defaultValue="0.85" step="0.01" min="0" max="1" className="w-24" />
              <span className="text-sm text-muted-foreground">
                Minimum confidence level for automated processing
              </span>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Processing Model</label>
            <div className="flex items-center space-x-2">
              <Badge variant="info">Claude 3.5 Sonnet</Badge>
              <span className="text-sm text-muted-foreground">
                Current AI model for invoice reconciliation
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage security preferences and access controls
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </div>
            </div>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Session Timeout</div>
              <div className="text-sm text-muted-foreground">
                Automatically log out after inactivity
              </div>
            </div>
            <Badge variant="secondary">8 hours</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">API Access</div>
              <div className="text-sm text-muted-foreground">
                Manage API keys and third-party integrations
              </div>
            </div>
            <Button variant="outline" size="sm">
              Manage Keys
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            System Settings
          </CardTitle>
          <CardDescription>
            Configure system-wide settings and integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">API Endpoint</label>
            <div className="flex items-center space-x-2">
              <Input 
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4" />
                Test
              </Button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Data Retention</div>
              <div className="text-sm text-muted-foreground">
                How long to keep processed invoices and reports
              </div>
            </div>
            <Badge variant="secondary">2 years</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Backup Schedule</div>
              <div className="text-sm text-muted-foreground">
                Automated backup frequency
              </div>
            </div>
            <Badge variant="success">Daily</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">System Status</div>
              <div className="text-sm text-muted-foreground">
                Overall platform health
              </div>
            </div>
            <Badge variant="success">All Systems Operational</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Integration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Integrations
          </CardTitle>
          <CardDescription>
            Connect with external systems and services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Mail className="h-6 w-6" />
                <div>
                  <div className="font-medium">Email Provider</div>
                  <div className="text-sm text-muted-foreground">SendGrid</div>
                </div>
              </div>
              <Badge variant="success">Connected</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="h-6 w-6" />
                <div>
                  <div className="font-medium">Document Storage</div>
                  <div className="text-sm text-muted-foreground">AWS S3</div>
                </div>
              </div>
              <Badge variant="success">Connected</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Zap className="h-6 w-6" />
                <div>
                  <div className="font-medium">ERP System</div>
                  <div className="text-sm text-muted-foreground">SAP Integration</div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}