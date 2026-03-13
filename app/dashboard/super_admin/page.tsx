'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkflow } from '@/lib/use-workflow';
import { Users, FileText, Shield, Activity, Building, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function SuperAdminDashboard() {
  const { mocs = [], ptws = [], users = [], contractors = [], stakeholders = [] } = useWorkflow();

  const stats = {
    totalUsers: users.length,
    totalMOCs: mocs.length,
    totalPTWs: ptws.length,
    activePTWs: ptws.filter((p) => p.status === 'ACTIVE').length,
    pendingApprovals: ptws.filter((p) => 
      ['PENDING_SECURITY_REVIEW', 'PENDING_FACILITIES_REVIEW', 'PENDING_EFS_REVIEW', 'PENDING_HSE_APPROVAL'].includes(p.status)
    ).length,
    contractors: contractors.length,
    stakeholders: stakeholders.length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">System-wide overview and management</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">System users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total MOCs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMOCs}</div>
              <p className="text-xs text-muted-foreground">Management of Change records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total PTWs</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPTWs}</div>
              <p className="text-xs text-muted-foreground">Permits to work</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active PTWs</CardTitle>
              <Activity className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePTWs}</div>
              <p className="text-xs text-muted-foreground">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <TrendingUp className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contractors</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contractors}</div>
              <p className="text-xs text-muted-foreground">Registered contractors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stakeholders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stakeholders}</div>
              <p className="text-xs text-muted-foreground">Registered stakeholders</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent MOCs</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/moc">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mocs.slice(0, 5).map((moc) => (
                  <Link key={moc.id} href={`/moc/${moc.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted">
                      <div>
                        <p className="font-medium">{moc.title}</p>
                        <p className="text-sm text-muted-foreground">{moc.id}</p>
                      </div>
                      <Badge variant="outline">{moc.status.replace(/_/g, ' ')}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent PTWs</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/permits">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ptws.slice(0, 5).map((ptw) => (
                  <Link key={ptw.id} href={`/permits/${ptw.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted">
                      <div>
                        <p className="font-medium">{ptw.title}</p>
                        <p className="text-sm text-muted-foreground">{ptw.id}</p>
                      </div>
                      <Badge variant="outline">{ptw.status.replace(/_/g, ' ')}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
