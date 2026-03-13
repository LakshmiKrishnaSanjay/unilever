'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkflow } from '@/lib/use-workflow';
import { Users, FileText, Shield, Activity, Building, TrendingUp, CheckCircle, BarChart3 } from 'lucide-react';
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

          <Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Closed Jobs</CardTitle>
    <CheckCircle className="h-4 w-4 text-success" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
      {ptws.filter((p) => p.status === 'CLOSED').length}
    </div>
    <p className="text-xs text-muted-foreground">Successfully closed PTWs</p>
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

                          <Card>
          <CardHeader>
            <CardTitle>System Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Button variant="outline" asChild>
                <Link href="/moc">
                  <FileText className="mr-2 h-4 w-4" />
                  Manage MOCs
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/permits">
                  <Shield className="mr-2 h-4 w-4" />
                  View All PTWs
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/reports">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reports
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/activity">
                  <Activity className="mr-2 h-4 w-4" />
                  Activity Log
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">MOC Approval Rate</p>
                </div>
                <p className="mt-2 text-2xl font-semibold">
                  {mocs.length > 0
                    ? `${((mocs.filter((m) => m.status === 'APPROVED').length / mocs.length) * 100).toFixed(0)}%`
                    : '0%'}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">PTW Completion Rate</p>
                </div>
                <p className="mt-2 text-2xl font-semibold">
                  {ptws.length > 0
                    ? `${((ptws.filter((p) => p.status === 'CLOSED').length / ptws.length) * 100).toFixed(0)}%`
                    : '0%'}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                </div>
                <p className="mt-2 text-2xl font-semibold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
      </div>
    </DashboardLayout>
  );
}
