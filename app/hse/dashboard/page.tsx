'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MOCRecord } from '@/src/types/moc';
import { useEffect, useMemo, useState } from 'react';
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
import type { PTW } from '@/lib/types';

export default function HSEDashboardPage() {
  const [mocs, setMocs] = useState<MOCRecord[]>([]);
  const [ptws, setPtws] = useState<PTW[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [mocsRes, ptwsRes] = await Promise.all([
        supabase.from('mocs').select('*').order('created_at', { ascending: false }),
        supabase.from('ptws').select('*').order('created_at', { ascending: false }),
      ]);

      if (mocsRes.error) throw mocsRes.error;
      if (ptwsRes.error) throw ptwsRes.error;

      setMocs((mocsRes.data || []) as MOCRecord[]);
      setPtws((ptwsRes.data || []) as PTW[]);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

const stats = useMemo(() => {
  return {
    pendingMOCs: mocs.filter((m) => m.status !== 'APPROVED').length,
    approvedMOCs: mocs.filter((m) => m.status === 'APPROVED').length,

    ptwsInReview: ptws.filter((p) => p.status === 'PENDING_HSE_APPROVAL').length,
    activePTWs: ptws.filter((p) => p.status === 'ACTIVE').length,
    pendingClosure: ptws.filter((p) => p.status === 'PENDING_HSE_CLOSURE').length,
    totalThisMonth: ptws.length,
  };
}, [mocs, ptws]);

const pendingMOCs = useMemo(
  () => (mocs ?? []).filter((m) => m.status !== 'APPROVED'),
  [mocs]
);

  const ptwsForReview = useMemo(
    () => ptws.filter((p) => p.status === 'PENDING_HSE_APPROVAL'),
    [ptws]
  );

  const ptwsForClosure = useMemo(
    () => ptws.filter((p) => p.status === 'PENDING_HSE_CLOSURE'),
    [ptws]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">HSE Dashboard</h1>
          <p className="text-muted-foreground">Monitor and approve MOCs and PTWs</p>
        </div>

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
              <p className="text-xs text-muted-foreground">Jobs awaiting final HSE closure</p>
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

        <div className="grid gap-6 lg:grid-cols-2">
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>MOC Status Overview</CardTitle>
      <Badge variant="outline">{pendingMOCs.length}</Badge>
    </div>
  </CardHeader>
  <CardContent>
    {loading ? (
      <p className="text-sm text-muted-foreground">Loading...</p>
    ) : pendingMOCs.length === 0 ? (
      <p className="text-sm text-muted-foreground">No pending MOCs</p>
    ) : (
      <div className="space-y-3">
        {pendingMOCs.slice(0, 3).map((moc: any) => {
          const awaitingContractor =
            (moc.status === 'SUBMITTED' || moc.status === 'STAKEHOLDER_SIGNED') &&
            !moc.contractorGate?.acknowledged;

          const isFacilitiesReview =
            moc.status === 'CONTRACTOR_SUBMITTED';

          const isStakeholderReview =
            moc.status === 'PENDING_STAKEHOLDER_APPROVAL';

          const isHSEReview =
            moc.status === 'PENDING_HSE_APPROVAL' ||
            moc.status === 'PENDING_HSE_FINAL';

          const isChangesRequested =
            moc.status === 'FACILITIES_CHANGES_REQUESTED';

          return (
            <Link key={moc.id} href={`/moc/${moc.id}`}>
              <div className="flex items-start justify-between rounded-lg border p-3 transition-colors hover:bg-muted">
                <div className="flex-1">
                  <p className="font-medium">{moc.title}</p>
                  <p className="text-sm text-muted-foreground">{moc.id}</p>

                  {awaitingContractor && (
                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                      <Clock className="mr-1 inline h-3 w-3" />
                      Awaiting contractor acknowledgement
                    </p>
                  )}

                  {isFacilitiesReview && (
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      <Clock className="mr-1 inline h-3 w-3" />
                      Ready for Facilities review
                    </p>
                  )}

                  {isStakeholderReview && (
                    <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                      <Clock className="mr-1 inline h-3 w-3" />
                      Awaiting stakeholder approval
                    </p>
                  )}

                  {isHSEReview && (
                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                      <Clock className="mr-1 inline h-3 w-3" />
                      Awaiting HSE approval
                    </p>
                  )}

                  {isChangesRequested && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                      <Clock className="mr-1 inline h-3 w-3" />
                      Changes requested by Facilities
                    </p>
                  )}
                </div>

                <Badge
                  variant={
                    moc.status === 'CONTRACTOR_SUBMITTED' ||
                    moc.status === 'PENDING_HSE_APPROVAL' ||
                    moc.status === 'PENDING_HSE_FINAL'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {String(moc.status).replace(/_/g, ' ')}
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

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Final Review Queue</CardTitle>
                <Badge variant="outline">{ptwsForReview.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : ptwsForReview.length === 0 ? (
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

          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Jobs Ready for Closure</CardTitle>
                <Badge variant="outline">{ptwsForClosure.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : ptwsForClosure.length === 0 ? (
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