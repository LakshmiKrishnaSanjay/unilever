'use client';

import { TableCell } from "@/components/ui/table";
import { TableBody } from "@/components/ui/table";
import { TableHead } from "@/components/ui/table";
import { TableRow } from "@/components/ui/table";
import { TableHeader } from "@/components/ui/table";
import { Table } from "@/components/ui/table";
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/lib/use-workflow';
import { Activity, FileText, Users, Shield, BarChart3, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { formatTime } from '@/lib/format';
import { StatCard } from '@/components/stat-card';

export default function AdminDashboard() {
  const { mocs = [], ptws = [], users = [], activityLog = [] } = useWorkflow();

  const nonApprovedMOCs = (mocs ?? []).filter(
    (m) => m.status && m.status !== 'APPROVED'
  );

  const activePTWs = (ptws ?? []).filter((p) => p.status === 'ACTIVE');

  const recentActivity = [...(activityLog ?? [])]
    .sort(
      (a, b) =>
        new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
    )
    .slice(0, 10);

    console.log("activityLog from hook:", activityLog);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* <div>
          <h1 className="text-3xl font-semibold">System Administrator Dashboard</h1>
          <p className="text-muted-foreground">
            System-wide oversight and management
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total MOCs"
            value={mocs.length}
            description={`${nonApprovedMOCs.length} not approved`}
            icon={FileText}
          />
          <StatCard
            title="Total PTWs"
            value={ptws.length}
            description={`${activePTWs.length} currently active`}
            icon={Shield}
          />
          <StatCard
            title="System Users"
            value={users.length}
            description="Across all roles"
            icon={Users}
          />
          <StatCard
            title="Activities"
            value={(activityLog ?? []).length}
            description="Total system events"
            icon={Activity}
          />
        </div> */}

        {/* <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>MOCs Not Approved</CardTitle>
                <Badge variant="secondary">{nonApprovedMOCs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {nonApprovedMOCs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  All MOCs are approved
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>MOC ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonApprovedMOCs.slice(0, 5).map((moc) => (
                      <TableRow key={moc.id}>
                        <TableCell className="font-medium">{moc.id}</TableCell>
                        <TableCell>{moc.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {moc.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {nonApprovedMOCs.length > 0 && (
                <Button asChild className="mt-4 w-full">
                  <Link href="/moc">View All MOCs</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent System Activity</CardTitle>
                <Badge variant="outline">{recentActivity.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground">
                    No activity found
                  </p>
                ) : (
                  recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 text-sm">
                      <Activity className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.details || `${activity.module} activity`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.username} • {formatTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button variant="outline" asChild className="mt-4 w-full bg-transparent">
                <Link href="/activity">View All Activity</Link>
              </Button>
            </CardContent>
          </Card>
        </div> */}

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