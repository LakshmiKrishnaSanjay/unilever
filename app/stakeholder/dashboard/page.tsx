'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import { useWorkflow } from '@/lib/use-workflow';
import { FileText, CheckCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { workflowStore } from '@/lib/workflow-store';

export default function StakeholderDashboardPage() {
  const { currentUser, mocs } = useWorkflow();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await workflowStore.syncMOCsFromDatabase();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const myEmail = (currentUser?.email || '').toLowerCase();

const myStakeholderMocs = useMemo(() => {
  return (mocs || []).filter((m: any) => {
    const stakeholders = Array.isArray(m.stakeholders) ? m.stakeholders : [];

    return stakeholders.some((s: any) => {
      const email = (s?.stakeholder_email || s?.email || "").toLowerCase();
      return email === myEmail;
    });
  });
}, [mocs, myEmail]);

const pendingMOCApprovals = useMemo(() => {
  return (mocs || []).filter((m: any) => {
    if (m.status !== "PENDING_STAKEHOLDER_APPROVAL") return false;

    const stakeholders = Array.isArray(m.stakeholders) ? m.stakeholders : [];

    return stakeholders.some((s: any) => {
      const email = (s?.stakeholder_email || s?.email || "").toLowerCase();
      return email === myEmail && s?.status === "PENDING";
    });
  });
}, [mocs, myEmail]);

const approvedMOCs = useMemo(() => {
  return (mocs || []).filter((m: any) => {
    const stakeholders = Array.isArray(m.stakeholders) ? m.stakeholders : [];

    return stakeholders.some((s: any) => {
      const email = (s?.stakeholder_email || s?.email || "").toLowerCase();
      return email === myEmail && s?.status === "APPROVED";
    });
  });
}, [mocs, myEmail]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Stakeholder Dashboard</h1>
          <p className="text-muted-foreground">Review and approve MOCs and job closures</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Pending MOC Sign-offs"
            value={pendingMOCApprovals.length}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Approved MOCs"
            value={approvedMOCs.length}
            icon={CheckCircle}
            variant="success"
          />
          <StatCard
            title="Total MOCs"
            value={myStakeholderMocs.length}
            icon={FileText}
            variant="info"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending MOC Sign-offs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading MOCs...
              </p>
            ) : pendingMOCApprovals.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No pending MOC approvals
              </p>
            ) : (
              <div className="space-y-3">
                {pendingMOCApprovals.slice(0, 10).map((moc: any) => (
                  <div
                    key={moc.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{moc.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {moc.id} - {moc.area}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                      <Button size="sm" asChild>
                        <Link href={`/moc/${moc.id}`}>Review</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}