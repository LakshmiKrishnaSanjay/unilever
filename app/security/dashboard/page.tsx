'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/lib/use-workflow';
import Link from 'next/link';
import { Shield, Clock, CheckCircle, Activity } from 'lucide-react';

export default function SecurityDashboardPage() {
  const { ptws, securityLogs } = useWorkflow();

  const stats = {
    pendingReviews: ptws.filter((p) => p.status === 'PENDING_SECURITY_REVIEW').length,
    activePTWs: ptws.filter((p) => p.status === 'ACTIVE').length,
    readyToStart: ptws.filter((p) => p.status === 'READY_FOR_ENTRY').length,
    totalLogs: (securityLogs ?? []).length,
  };

  const pendingPTWs = ptws.filter((p) => p.status === 'PENDING_SECURITY_REVIEW');
  const activePTWs = ptws.filter((p) => p.status === 'ACTIVE');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Security Dashboard</h1>
          <p className="text-muted-foreground">Review permits and monitor active work</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingReviews}</div>
              <p className="text-xs text-muted-foreground">Awaiting security review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active PTWs</CardTitle>
              <Activity className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePTWs}</div>
              <p className="text-xs text-muted-foreground">Work in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ready to Start</CardTitle>
              <CheckCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.readyToStart}</div>
              <p className="text-xs text-muted-foreground">Awaiting check-in</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Logs</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs}</div>
              <p className="text-xs text-muted-foreground">Check-in records</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Reviews</CardTitle>
                <Badge variant="outline">{pendingPTWs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pendingPTWs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending reviews</p>
              ) : (
                <div className="space-y-3">
                  {pendingPTWs.slice(0, 4).map((ptw) => (
                    <div
                      key={ptw.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{ptw.title}</p>
                        <p className="text-sm text-muted-foreground">{ptw.id}</p>
                      </div>
                      <Badge>{ptw.permit_type}</Badge>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href="/security/review">View All Reviews</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Work</CardTitle>
                <Badge variant="outline">{activePTWs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {activePTWs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active work</p>
              ) : (
                <div className="space-y-3">
                  {activePTWs.map((ptw) => (
                    <div
                      key={ptw.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{ptw.title}</p>
                        <p className="text-sm text-muted-foreground">{ptw.location}</p>
                      </div>
                      <Button size="sm" asChild>
                        <Link href="/security/progress">Monitor</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
