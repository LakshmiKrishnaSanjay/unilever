'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/lib/use-workflow';
import { Settings, Database, RefreshCw } from 'lucide-react';
import { workflowStore } from '@/lib/workflow-store';
import { toast } from 'sonner';
import { useState } from 'react';

export default function SystemSettingsPage() {
  const { currentUser } = useWorkflow();
  const [resetting, setResetting] = useState(false);

  // Check authorization
  if (currentUser?.role !== 'super_admin') {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">You do not have permission to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This action cannot be undone.')) {
      setResetting(true);
      try {
        workflowStore.resetState();
        toast.success('System data has been reset to defaults');
        // Reload the page after a short delay
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 1500);
      } catch (error) {
        toast.error('Failed to reset data');
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">System Settings</h1>
          <p className="text-muted-foreground">Manage system configuration and data</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>General Settings</CardTitle>
              </div>
              <CardDescription>
                System-wide configuration options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                General system settings will be available in future updates.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                <CardTitle>Data Management</CardTitle>
              </div>
              <CardDescription>
                Manage system data and storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="font-medium">Reset System Data</p>
                  <p className="text-sm text-muted-foreground">
                    Reset all data to default demo values. This will clear all users, MOCs, PTWs, contractors, and stakeholders.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleResetData}
                  disabled={resetting}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${resetting ? 'animate-spin' : ''}`} />
                  {resetting ? 'Resetting...' : 'Reset Data'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
