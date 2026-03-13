'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function StakeholderClosurePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Job Closure Review</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve job closures requiring stakeholder sign-off
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Closure Reviews</CardTitle>
            <CardDescription>PTW closures requiring your approval</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Job closure review functionality will be integrated with the PTW workflow. 
                Stakeholders will be notified when PTWs require closure sign-off.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
