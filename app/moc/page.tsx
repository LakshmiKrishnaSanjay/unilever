'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkflow } from '@/lib/use-workflow';
import Link from 'next/link';
import { Plus, Search, FileText, CheckCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { workflowStore } from '@/lib/workflow-store';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  SUBMITTED: 'secondary',
  STAKEHOLDER_SIGNED: 'secondary',
  CONTRACTOR_SUBMITTED: 'outline',
  FACILITIES_APPROVED: 'default',
  FACILITIES_CHANGES_REQUESTED: 'destructive',
  PENDING_STAKEHOLDER_APPROVAL: 'secondary',
  PENDING_HSE_APPROVAL: 'secondary',
  PENDING_HSE_FINAL: 'secondary',
  STAKEHOLDER_APPROVED: 'default',
  APPROVED: 'default',
  REJECTED: 'destructive',
};

export default function MOCPage() {
  const { mocs, ptws = [], currentUser } = useWorkflow();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        await workflowStore.syncMOCsFromDatabase();
      } catch (error) {
        console.error('Failed to load MOCs:', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const isContractorAdmin = currentUser?.role === 'contractor_admin';
  const isHSEManager = currentUser?.role === 'hse_manager';
  const isStakeholder = currentUser?.role === 'stakeholder';
  const canCreateMOC = isHSEManager;

  const filteredMOCs = mocs
    .filter((m) => {
      if (isContractorAdmin) {
        return m.contractorCompany === currentUser?.contractor_id;
      }

      if (isStakeholder) {
        return (
          m.requiresStakeholderApproval &&
          Array.isArray(m.stakeholders) &&
          m.stakeholders.some((s: any) => s.email === currentUser?.email)
        );
      }

      return true;
    })
    .filter((m) => {
      const q = search.toLowerCase().trim();

      if (!q) return true;

      return (
        m.title?.toLowerCase().includes(q) ||
        m.id?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.area?.toLowerCase().includes(q)
      );
    });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Management of Change (MOC)</h1>
            <p className="text-muted-foreground">
              {isContractorAdmin
                ? 'Manage your MOCs and create PTWs'
                : isStakeholder
                ? 'View your assigned MOCs'
                : 'View all MOCs'}
            </p>
          </div>

          {canCreateMOC && (
            <Button asChild>
              <Link href="/moc/create">
                <Plus className="mr-2 h-4 w-4" />
                New MOC
              </Link>
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search MOCs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <p className="text-muted-foreground">Loading MOCs...</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MOC ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Contractor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredMOCs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No MOCs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMOCs.map((moc) => {
                      const isApproved = String(moc.status).trim() === 'APPROVED';

                      const ptwExists = ptws.some(
                        (p: any) => String(p.moc_id) === String(moc.id)
                      );

                      const canCreatePTW = isContractorAdmin && isApproved && !ptwExists;

                      return (
                        <TableRow key={moc.id}>
                          <TableCell className="font-medium">{moc.id}</TableCell>

                          <TableCell>
                            <div className="max-w-[220px]">
                              <p className="truncate font-medium">{moc.title}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {moc.description}
                              </p>
                            </div>
                          </TableCell>

                          <TableCell>{moc.area}</TableCell>

                          <TableCell className="text-sm">
                            {moc.contractors?.companyName || '-'}
                          </TableCell>

                          <TableCell>
                            <Badge variant={statusColors[moc.status] || 'secondary'}>
                              {isApproved && <CheckCircle className="mr-1 h-3 w-3" />}
                              {String(moc.status).replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-sm text-muted-foreground">
                            {moc.created_at
                              ? new Date(moc.created_at).toLocaleDateString()
                              : '-'}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button size="sm" variant="outline" asChild>
                                <Link href={`/moc/${moc.id}`}>View</Link>
                              </Button>

                              {canCreatePTW && (
                                <Button size="sm" asChild>
                                  <Link href={`/permits/new?mocId=${moc.id}`}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Create PTW
                                  </Link>
                                </Button>
                              )}

                              {isContractorAdmin && isApproved && ptwExists && (
                                <Button size="sm" variant="secondary" disabled>
                                  PTW Already Created
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}