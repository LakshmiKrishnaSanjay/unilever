'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWorkflow } from '@/lib/use-workflow';
import type { MOCRecord } from '@/src/types/moc';
import { useEffect, useState } from 'react';
import {
  FileText,
  ClipboardCheck,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';

export default function HSEDashboardPage() {
  const { ptws = [] } = useWorkflow();
  const [mocs, setMocs] = useState<MOCRecord[]>([]);

  // Load MOCs from storage

  useEffect(() => {
  loadDashboardData();
}, []);

const loadDashboardData = async () => {
  try {

    const { data, error } = await supabase
      .from("mocs")
      .select("*");

    if (error) throw error;

    setMocs(data || []);

  } catch (error) {
    console.error("Dashboard load error:", error);
  }
};


  const stats = {
    pendingMOCs: mocs.filter((m) => m.status === 'SUBMITTED' || m.status === 'STAKEHOLDER_SIGNED' || m.status === 'CONTRACTOR_SUBMITTED').length,
    approvedMOCs: mocs.filter((m) => m.status === 'APPROVED').length,
    ptwsInReview: (ptws ?? []).filter((p) => p.status === 'PENDING_HSE_APPROVAL').length,
    activePTWs: (ptws ?? []).filter((p) => p.status === 'ACTIVE').length,
    pendingClosure: (ptws ?? []).filter((p) => p.status === 'WORK_FINISHED').length,
    totalThisMonth: (ptws ?? []).length,
  };

  const pendingMOCs = mocs.filter((m) => m.status === 'SUBMITTED' || m.status === 'STAKEHOLDER_SIGNED' || m.status === 'CONTRACTOR_SUBMITTED');
  const mocsAwaitingContractor = mocs.filter((m) => (m.status === 'SUBMITTED' || m.status === 'STAKEHOLDER_SIGNED') && !m.contractorGate?.acknowledged);
  const ptwsForReview = (ptws ?? []).filter((p) => p.status === 'PENDING_HSE_APPROVAL');
  const ptwsForClosure = (ptws ?? []).filter((p) => p.status === 'WORK_FINISHED');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">HSE Dashboard</h1>
          <p className="text-muted-foreground">Monitor and approve MOCs and PTWs</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending MOCs</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingMOCs}</div>
              <p className="text-xs text-muted-foreground">Awaiting HSE approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PTWs in Review</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ptwsInReview}</div>
              <p className="text-xs text-muted-foreground">Final HSE review required</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Closure</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingClosure}</div>
              <p className="text-xs text-muted-foreground">Jobs awaiting closure</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved MOCs</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedMOCs}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active PTWs</CardTitle>
              <FileText className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePTWs}</div>
              <p className="text-xs text-muted-foreground">Work in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalThisMonth}</div>
              <p className="text-xs text-muted-foreground">Total PTWs issued</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Items */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending MOC Approvals */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>MOC Status Overview</CardTitle>
                <Badge variant="outline">{pendingMOCs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {pendingMOCs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending MOCs</p>
              ) : (
                <div className="space-y-3">
                  {pendingMOCs.slice(0, 3).map((moc) => {
                    const awaitingContractor = (moc.status === 'SUBMITTED' || moc.status === 'STAKEHOLDER_SIGNED') && !moc.contractorGate?.acknowledged;
                    return (
                      <Link key={moc.id} href={`/moc/${moc.id}`}>
                        <div className="flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-muted">
                          <div className="flex-1">
                            <p className="font-medium">{moc.title}</p>
                            <p className="text-sm text-muted-foreground">{moc.id}</p>
                            {awaitingContractor && (
                              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                <Clock className="inline h-3 w-3 mr-1" />
                                Awaiting contractor acknowledgement
                              </p>
                            )}
                            {moc.status === 'CONTRACTOR_SUBMITTED' && (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                <Clock className="inline h-3 w-3 mr-1" />
                                Ready for Facilities review
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={
                              moc.status === 'CONTRACTOR_SUBMITTED' ? 'default' : 'secondary'
                            }
                          >
                            {moc.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                  {pendingMOCs.length > 3 && (
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href="/moc">View All MOCs</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* PTW Final Review Queue */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Final Review Queue</CardTitle>
                <Badge variant="outline">{ptwsForReview.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {ptwsForReview.length === 0 ? (
                <p className="text-sm text-muted-foreground">No PTWs awaiting review</p>
              ) : (
                <div className="space-y-3">
                  {ptwsForReview.slice(0, 3).map((ptw) => (
                    <div
                      key={ptw.id}
                      className="flex items-start justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{ptw.title}</p>
                        <p className="text-sm text-muted-foreground">{ptw.id}</p>
                      </div>
                      <Badge>{ptw.permit_type}</Badge>
                    </div>
                  ))}
                  {ptwsForReview.length > 3 && (
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href="/hse/queue">View Review Queue</Link>
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job Closure Queue */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Jobs Ready for Closure</CardTitle>
                <Badge variant="outline">{ptwsForClosure.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {ptwsForClosure.length === 0 ? (
                <p className="text-sm text-muted-foreground">No jobs awaiting closure</p>
              ) : (
                <div className="space-y-3">
                  {ptwsForClosure.map((ptw) => (
                    <div
                      key={ptw.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{ptw.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {ptw.id} • {ptw.location}
                        </p>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/hse/closure?ptwId=${ptw.id}`}>Close Job</Link>
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
