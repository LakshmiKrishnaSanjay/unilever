'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/lib/use-workflow';
import { StatCard } from '@/components/stat-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Eye, FileText, Shield, Activity } from 'lucide-react';
import Link from 'next/link';

export default function ViewerDashboard() {
  const { mocs = [], ptws = [] } = useWorkflow();

  const activeMOCs = (mocs ?? []).filter(
    (m) => m.status === 'APPROVED' && new Date(m.expiry_date) > new Date()
  );
  const activePTWs = (ptws ?? []).filter((p) => p.status === 'ACTIVE');
  const totalMOCs = (mocs ?? []).length;
  const totalPTWs = (ptws ?? []).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Viewer Dashboard</h1>
          <p className="text-muted-foreground">
            Read-only access to system information
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total MOCs"
            value={totalMOCs}
            description={`${activeMOCs.length} currently active`}
            icon={FileText}
          />
          <StatCard
            title="Total PTWs"
            value={totalPTWs}
            description={`${activePTWs.length} currently active`}
            icon={Shield}
          />
          <StatCard
            title="Active Work"
            value={activePTWs.length}
            description="In progress permits"
            icon={Activity}
          />
          <StatCard
            title="View Access"
            value="Read-Only"
            description="No editing permissions"
            icon={Eye}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active MOCs</CardTitle>
                <Badge variant="secondary">{activeMOCs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {activeMOCs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No active MOCs</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>MOC ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeMOCs.slice(0, 5).map((moc) => (
                      <TableRow key={moc.id}>
                        <TableCell className="font-medium">{moc.id}</TableCell>
                        <TableCell>{moc.title}</TableCell>
                        <TableCell>
                          <Badge
                            variant={moc.priority === 'CRITICAL' ? 'destructive' : 'secondary'}
                          >
                            {moc.priority}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Button variant="outline" asChild className="mt-4 w-full bg-transparent">
                <Link href="/moc">View All MOCs</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Work</CardTitle>
                <Badge variant="secondary">{activePTWs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {activePTWs.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No active work</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permit ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activePTWs.slice(0, 5).map((ptw) => (
                      <TableRow key={ptw.id}>
                        <TableCell className="font-medium">{ptw.id}</TableCell>
                        <TableCell>{ptw.title}</TableCell>
                        <TableCell>{ptw.location}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <Button variant="outline" asChild className="mt-4 w-full bg-transparent">
                <Link href="/permits">View All Permits</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Available Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="outline" asChild>
                <Link href="/moc">
                  <FileText className="mr-2 h-4 w-4" />
                  View MOCs
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/permits">
                  <Shield className="mr-2 h-4 w-4" />
                  View PTWs
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

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader>
            <CardTitle className="text-yellow-900">Access Notice</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-900">
              You have read-only access to this system. You can view all MOCs, permits, and activity
              logs, but you cannot create, edit, or approve any items. If you need additional
              permissions, please contact your system administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
