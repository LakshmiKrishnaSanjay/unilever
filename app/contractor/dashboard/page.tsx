'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/lib/use-workflow';
import type { MOCRecord } from '@/src/types/moc';
import { useEffect, useState } from 'react';
import {
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';

type DashboardMOC = MOCRecord & {
  contractors?: {
    companyName?: string;
  } | null;
  contractorGate?: {
    acknowledged?: boolean | null;
  }[] | {
    acknowledged?: boolean | null;
  } | null;
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

export default function ContractorDashboardPage() {
  const { ptws, contractorDocuments, currentUser } = useWorkflow();
  const [mocs, setMocs] = useState<DashboardMOC[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncMOCsFromDatabase = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const contractorRef = currentUser.contractor_id ?? currentUser.id;

        const { data, error } = await supabase
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
          .or(`contractor_id.eq.${contractorRef},contractorCompany.eq.${contractorRef}`)
          .order('created_at', { ascending: false });

        if (error) throw error;

        console.log('Fetched MOCs:', data);
        console.log('currentUser.id:', currentUser?.id);
        console.log('currentUser.contractor_id:', currentUser?.contractor_id);

        setMocs((data as DashboardMOC[]) || []);
      } catch (error) {
        console.error('Error fetching MOCs:', error);
      } finally {
        setLoading(false);
      }
    };

    syncMOCsFromDatabase();
  }, [currentUser]);

  const contractorRef = currentUser?.contractor_id ?? currentUser?.id;

  const myPTWs = (ptws ?? []).filter(
    (p) => p.contractor_id === contractorRef || p.contractor_id === currentUser?.id
  );

  const myDocs = (contractorDocuments ?? []).filter(
    (d) => d.contractor_id === contractorRef || d.contractor_id === currentUser?.id
  );

  const stats = {
    activeMOCs: mocs.filter((m) => m.status === 'APPROVED').length,
    pendingMOCs: mocs.filter((m) =>
      ['SUBMITTED', 'STAKEHOLDER_SIGNED', 'CONTRACTOR_SUBMITTED'].includes(m.status)
    ).length,
    activePTWs: myPTWs.filter((p) => p.status === 'ACTIVE').length,
    pendingPTWs: myPTWs.filter((p) =>
      [
        'PENDING_SECURITY_REVIEW',
        'PENDING_FACILITIES_REVIEW',
        'PENDING_EFS_REVIEW',
        'PENDING_HSE_APPROVAL',
      ].includes(p.status)
    ).length,
    sentBackPTWs: myPTWs.filter((p) =>
      ['REJECTED', 'SENT_BACK'].includes(p.status)
    ).length,
    pendingDocs: myDocs.filter((d) => d.status === 'PENDING').length,
  };

  const sentBackPTWs = myPTWs.filter((p) =>
    ['REJECTED', 'SENT_BACK'].includes(p.status)
  );

  const mocsNeedingAcknowledgement = mocs.filter((m) => {
    const needsAck =
      m.status === 'SUBMITTED' || m.status === 'STAKEHOLDER_SIGNED';

    const acknowledged = Array.isArray(m.contractorGate)
      ? m.contractorGate[0]?.acknowledged
      : m.contractorGate?.acknowledged;

    return needsAck && !acknowledged;
  });

  const filteredMOCs = mocs.filter((m) => {
    const q = search.toLowerCase();

    return (
      (m.title ?? '').toLowerCase().includes(q) ||
      (m.id ?? '').toLowerCase().includes(q) ||
      (m.description ?? '').toLowerCase().includes(q) ||
      ((m as any).area ?? '').toLowerCase().includes(q)
    );
  });

  console.log('Current User Details:', currentUser);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Contractor Dashboard</h1>
            <p className="text-muted-foreground">Manage your MOCs, PTWs, and documents</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/permits/new">
                <Plus className="mr-2 h-4 w-4" />
                New PTW
              </Link>
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
                  <p className="text-xs text-muted-foreground">Action required</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Documents</CardTitle>
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingDocs}</div>
                  <p className="text-xs text-muted-foreground">Awaiting approval</p>
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
                              You must acknowledge this MOC and submit the required MOC pack before PTWs can be created.
                            </p>
                          </div>
                          <Button size="sm" asChild>
                            <Link href={`/moc/${moc.id}`}>View & Acknowledge</Link>
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
                        <div key={ptw.id} className="rounded-lg border border-destructive/50 p-3">
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
                              <Link href={`/permits/${ptw.id}/resubmit`}>Fix & Resubmit</Link>
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
                  <CardTitle>My MOCs</CardTitle>
                  <Button size="sm" asChild>
                    <Link href="/moc">View All</Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {filteredMOCs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No MOCs for your company yet</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredMOCs.slice(0, 3).map((moc) => (
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
                <CardHeader>
                  <CardTitle>Recent PTWs</CardTitle>
                </CardHeader>
                <CardContent>
                  {myPTWs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No PTWs yet</p>
                  ) : (
                    <div className="space-y-3">
                      {myPTWs.slice(0, 3).map((ptw) => (
                        <Link key={ptw.id} href="/permits">
                          <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted">
                            <div>
                              <p className="font-medium">{ptw.title}</p>
                              <p className="text-sm text-muted-foreground">{ptw.id}</p>
                            </div>
                            <Badge
                              variant={ ptw.status === 'SENT_BACK' ? 'destructive' : 'secondary'}
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