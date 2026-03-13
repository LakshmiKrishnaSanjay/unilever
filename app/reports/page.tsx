'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkflow } from '@/lib/use-workflow';
import { BarChart3, FileText, TrendingUp, Clock, Download } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ReportsPage() {
  const { mocs = [], ptws = [] } = useWorkflow();
  const [dateRange, setDateRange] = useState('30');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));

  // MOC Statistics
  const mocStats = {
    total: (mocs ?? []).length,
    approved: (mocs ?? []).filter((m) => m.status === 'APPROVED').length,
    pending: (mocs ?? []).filter((m) =>
      ['DRAFT', 'PENDING_HSE_APPROVAL', 'PENDING_STAKEHOLDER_REVIEW', 'PENDING_CONTRACTOR_GATE', 'PENDING_FACILITIES_REVIEW'].includes(m.status)
    ).length,
    expired: (mocs ?? []).filter((m) => new Date(m.expiry_date) < new Date()).length,
  };

  // PTW Statistics
  const ptwStats = {
    total: (ptws ?? []).length,
    active: (ptws ?? []).filter((p) => p.status === 'ACTIVE').length,
    pending_review: (ptws ?? []).filter((p) =>
      ['PENDING_SECURITY_REVIEW', 'PENDING_FACILITIES_REVIEW', 'PENDING_EFS_REVIEW', 'PENDING_HSE_APPROVAL'].includes(p.status)
    ).length,
    completed: (ptws ?? []).filter((p) => p.status === 'CLOSED').length,
    rejected: (ptws ?? []).filter((p) => p.status === 'REJECTED').length,
  };

  // Recent PTWs in date range
  const recentPTWs = (ptws ?? []).filter(
    (p) =>
      p.submission_date && new Date(p.submission_date) >= cutoffDate
  );

  // Permit type breakdown
  const permitTypeBreakdown = ptws.reduce(
    (acc, ptw) => {
      acc[ptw.permit_type] = (acc[ptw.permit_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Average review time (mock calculation)
  const avgReviewTime = '2.3 days';

  const exportReport = (type: string) => {
    // In a real app, this would generate and download a CSV/PDF
    alert(`Exporting ${type} report...`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Reports & Analytics</h1>
            <p className="text-muted-foreground">
              System-wide statistics and insights
            </p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total MOCs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{mocStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {mocStats.approved} approved, {mocStats.pending} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total PTWs</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{ptwStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {ptwStats.active} active, {ptwStats.completed} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{ptwStats.pending_review}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval across all stages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Review Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{avgReviewTime}</div>
              <p className="text-xs text-muted-foreground">From submission to approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Permit Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Permit Type Distribution</CardTitle>
            <CardDescription>Breakdown of all permits by type</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permit Type</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(permitTypeBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <TableRow key={type}>
                      <TableCell className="font-medium">{type.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                      <TableCell className="text-right">
                        {((count / ptwStats.total) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent PTW Activity</CardTitle>
                <CardDescription>Last {dateRange} days</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportReport('ptw_activity')}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                  <p className="mt-1 text-2xl font-semibold">{recentPTWs.length}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-muted-foreground">Sent Back</p>
                  <p className="mt-1 text-2xl font-semibold">{ptwStats.sent_back}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="mt-1 text-2xl font-semibold">{ptwStats.completed}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MOC Status Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>MOC Status Overview</CardTitle>
                <CardDescription>Current state of all MOCs</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => exportReport('moc_status')}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Approved</p>
                  <Badge>Active</Badge>
                </div>
                <p className="mt-2 text-2xl font-semibold">{mocStats.approved}</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <Badge variant="outline">Review</Badge>
                </div>
                <p className="mt-2 text-2xl font-semibold">{mocStats.pending}</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Expired</p>
                  <Badge variant="destructive">Inactive</Badge>
                </div>
                <p className="mt-2 text-2xl font-semibold">{mocStats.expired}</p>
              </div>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <Badge variant="secondary">All</Badge>
                </div>
                <p className="mt-2 text-2xl font-semibold">{mocStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Reports</CardTitle>
            <CardDescription>Download detailed reports for offline analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Button variant="outline" onClick={() => exportReport('full_moc')}>
                <Download className="mr-2 h-4 w-4" />
                Export All MOCs
              </Button>
              <Button variant="outline" onClick={() => exportReport('full_ptw')}>
                <Download className="mr-2 h-4 w-4" />
                Export All PTWs
              </Button>
              <Button variant="outline" onClick={() => exportReport('activity_log')}>
                <Download className="mr-2 h-4 w-4" />
                Export Activity Log
              </Button>
              <Button variant="outline" onClick={() => exportReport('compliance')}>
                <Download className="mr-2 h-4 w-4" />
                Export Compliance Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
