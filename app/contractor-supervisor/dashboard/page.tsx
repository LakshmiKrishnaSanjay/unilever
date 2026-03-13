'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/lib/use-workflow';
import type { MOCRecord } from '@/src/types/moc';
import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';

type DashboardMOC = MOCRecord & {
  contractors?: {
    companyName?: string;
  } | null;
  contractorGate?:
    | {
        acknowledged?: boolean | null;
      }[]
    | {
        acknowledged?: boolean | null;
      }
    | null;
};

type DashboardPTW = {
  id: string;
  title: string | null;
  status: string;
  contractor_id?: string | null;
  sent_back_reason?: string | null;
  sent_back_from_stage?: string | null;
  created_at?: string | null;
};

type SupervisorRequest = {
  id: string;
  moc_id: string;
  contractor_id?: string | null;
  email: string;
  status: string;
};

const sentBackStageLabels: Record<string, string> = {
  PENDING_SECURITY_REVIEW: 'Security',
  PENDING_FACILITIES_REVIEW: 'Facilities',
  PENDING_EFS_REVIEW: 'EFS',
  PENDING_HSE_APPROVAL: 'HSE',
  PENDING_FACILITIES_CLOSURE: 'Facilities Closure',
  PENDING_STAKEHOLDER_CLOSURE: 'Stakeholder Closure',
  PENDING_HSE_CLOSURE: 'HSE Closure',
};

export default function ContractorSupervisorDashboardPage() {
  const { currentUser } = useWorkflow();

  const [mocs, setMocs] = useState<DashboardMOC[]>([]);
  const [ptws, setPtws] = useState<DashboardPTW[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // 1) Find approved supervisor requests for logged-in supervisor
        const supervisorReqRes = await supabase
          .from('supervisor_requests')
          .select(`
            id,
            moc_id,
            contractor_id,
            email,
            status
          `)
          .eq('email', currentUser.email)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        if (supervisorReqRes.error) throw supervisorReqRes.error;

        const supervisorRequests = (supervisorReqRes.data as SupervisorRequest[]) || [];

        console.log('currentUser:', currentUser);
        console.log('supervisorRequests:', supervisorRequests);

        if (supervisorRequests.length === 0) {
          setMocs([]);
          setPtws([]);
          return;
        }

        const mocIds = [...new Set(supervisorRequests.map((r) => r.moc_id).filter(Boolean))];
        const contractorIds = [...new Set(supervisorRequests.map((r) => r.contractor_id).filter(Boolean))];
        const contractorId = contractorIds[0] || null;

        console.log('mocIds:', mocIds);
        console.log('contractorIds:', contractorIds);
        console.log('selected contractorId:', contractorId);

        // 2) Fetch MOCs only assigned to this supervisor
        const mocsRes =
          mocIds.length > 0
            ? await supabase
                .from('mocs')
                .select(`
                  *,
                  contractors:contractorCompany (
                    companyName
                  ),
                  contractorGate:moc_gates (
                    acknowledged
                  )
                `)
                .in('id', mocIds)
                .order('created_at', { ascending: false })
            : { data: [], error: null };

        if (mocsRes.error) throw mocsRes.error;

        // 3) Fetch PTWs for contractor company linked to supervisor request
        const ptwsRes =
          contractorId
            ? await supabase
                .from('ptws')
                .select(`
                  id,
                  title,
                  status,
                  contractor_id,
                  sent_back_reason,
                  sent_back_from_stage,
                  created_at
                `)
                .eq('contractor_id', contractorId)
                .order('created_at', { ascending: false })
            : { data: [], error: null };

        if (ptwsRes.error) throw ptwsRes.error;

        console.log('mocsRes:', mocsRes.data);
        console.log('ptwsRes:', ptwsRes.data);

        setMocs((mocsRes.data as DashboardMOC[]) || []);
        setPtws((ptwsRes.data as DashboardPTW[]) || []);
      } catch (error: any) {
        console.error('Error loading contractor supervisor dashboard:', {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          raw: error,
        });
        setMocs([]);
        setPtws([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser]);

  const stats = useMemo(() => {
    return {
      activeMOCs: mocs.filter((m) => m.status === 'APPROVED').length,
      pendingMOCs: mocs.filter((m) =>
        ['SUBMITTED', 'STAKEHOLDER_SIGNED', 'CONTRACTOR_SUBMITTED'].includes(m.status)
      ).length,
      activePTWs: ptws.filter((p) => p.status === 'ACTIVE').length,
      pendingPTWs: ptws.filter((p) =>
        [
          'PENDING_SECURITY_REVIEW',
          'PENDING_FACILITIES_REVIEW',
          'PENDING_EFS_REVIEW',
          'PENDING_HSE_APPROVAL',
        ].includes(p.status)
      ).length,
      sentBackPTWs: ptws.filter((p) =>
        ['REJECTED', 'SENT_BACK'].includes(p.status)
      ).length,
    };
  }, [mocs, ptws]);

  const sentBackPTWs = useMemo(
    () => ptws.filter((p) => ['REJECTED', 'SENT_BACK'].includes(p.status)),
    [ptws]
  );

  const mocsNeedingAcknowledgement = useMemo(() => {
    return mocs.filter((m) => {
      const needsAck =
        m.status === 'SUBMITTED' || m.status === 'STAKEHOLDER_SIGNED';

      const acknowledged = Array.isArray(m.contractorGate)
        ? m.contractorGate[0]?.acknowledged
        : m.contractorGate?.acknowledged;

      return needsAck && !acknowledged;
    });
  }, [mocs]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              Contractor Supervisor Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor your assigned MOCs and related PTWs
            </p>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/permits">View PTWs</Link>
            </Button>
          </div>
        </div>

        {loading && (
          <Card>
            <CardContent className="py-6">
              <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
            </CardContent>
          </Card>
        )}

        {!loading && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active MOCs</CardTitle>
                  <CheckCircle className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeMOCs}</div>
                  <p className="text-xs text-muted-foreground">Approved and active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending MOCs</CardTitle>
                  <Clock className="h-4 w-4 text-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingMOCs}</div>
                  <p className="text-xs text-muted-foreground">Under review</p>
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
                  <CardTitle className="text-sm font-medium">PTWs in Review</CardTitle>
                  <Clock className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingPTWs}</div>
                  <p className="text-xs text-muted-foreground">Awaiting approval</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Corrections Required</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.sentBackPTWs}</div>
                  <p className="text-xs text-muted-foreground">Needs supervisor action</p>
                </CardContent>
              </Card>
            </div>

            {mocsNeedingAcknowledgement.length > 0 && (
              <Card className="border-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-700">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-amber-900 dark:text-amber-100">
                      MOC Acknowledgement Required
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mocsNeedingAcknowledgement.map((moc) => (
                      <div
                        key={moc.id}
                        className="rounded-lg border border-amber-600/50 bg-background p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{moc.title}</p>
                            <p className="text-sm text-muted-foreground">{moc.id}</p>
                            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                              This MOC must be acknowledged and completed before related PTWs can proceed.
                            </p>
                          </div>
                          <Button size="sm" asChild>
                            <Link href={`/moc/${moc.id}`}>View MOC</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {sentBackPTWs.length > 0 && (
              <Card className="border-destructive">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <CardTitle className="text-destructive">Corrections Required</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sentBackPTWs.map((ptw) => {
                      const sentBackBy =
                        sentBackStageLabels[ptw.sent_back_from_stage || ''] || 'Security';

                      return (
                        <div
                          key={ptw.id}
                          className="rounded-lg border border-destructive/50 p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{ptw.title}</p>
                              <p className="text-sm text-muted-foreground">{ptw.id}</p>
                              <p className="mt-2 text-sm text-destructive">
                                Sent back by {sentBackBy}
                                {ptw.sent_back_reason ? `: ${ptw.sent_back_reason}` : ''}
                              </p>
                            </div>
                            <Button size="sm" asChild>
                              <Link href={`/permits/${ptw.id}/resubmit`}>
                                Review & Resubmit
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Assigned MOCs</CardTitle>
                  <Button size="sm" asChild>
                    <Link href="/moc">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {mocs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No assigned MOCs found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {mocs.slice(0, 3).map((moc) => (
                        <Link key={moc.id} href={`/moc/${moc.id}`}>
                          <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted">
                            <div>
                              <p className="font-medium">{moc.title}</p>
                              <p className="text-sm text-muted-foreground">{moc.id}</p>
                            </div>
                            <Badge
                              variant={
                                moc.status === 'APPROVED'
                                  ? 'default'
                                  : moc.status === 'REJECTED'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {moc.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent PTWs</CardTitle>
                  <Button size="sm" asChild>
                    <Link href="/permits">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {ptws.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No PTWs found</p>
                  ) : (
                    <div className="space-y-3">
                      {ptws.slice(0, 3).map((ptw) => (
                        <Link key={ptw.id} href={`/permits/${ptw.id}`}>
                          <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted">
                            <div>
                              <p className="font-medium">{ptw.title}</p>
                              <p className="text-sm text-muted-foreground">{ptw.id}</p>
                            </div>
                            <Badge
                              variant={
                                ptw.status === 'SENT_BACK' || ptw.status === 'REJECTED'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {ptw.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}