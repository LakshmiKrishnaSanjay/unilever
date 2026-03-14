'use client';

import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWorkflow, useWorkflowActions } from '@/lib/use-workflow';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { PTW } from '@/lib/types';

const statusColors: Record<string, string> = {
  DRAFT: 'secondary',
  SUBMITTED: 'secondary',
  PENDING_SECURITY_REVIEW: 'outline',
  PENDING_FACILITIES_REVIEW: 'outline',
  PENDING_EFS_REVIEW: 'outline',
  PENDING_HSE_APPROVAL: 'outline',
  READY_FOR_ENTRY: 'default',
  ACTIVE: 'default',
  WORK_COMPLETED: 'secondary',
  WAITING_SUPERVISOR_FINISH: 'secondary',
  WORK_FINISHED: 'secondary',
  PENDING_FACILITIES_CLOSURE: 'outline',
  PENDING_STAKEHOLDER_CLOSURE: 'outline',
  PENDING_HSE_CLOSURE: 'outline',
  CLOSED: 'secondary',
  REJECTED: 'destructive',
};

export default function PermitsPage() {
  const { ptws = [], currentUser } = useWorkflow();
  const workflowActions = useWorkflowActions();

  const [search, setSearch] = useState('');
  const [resubmitDialog, setResubmitDialog] = useState<PTW | null>(null);
  const [corrections, setCorrections] = useState('');

  const isContractor =
    currentUser?.role === 'contractor_admin' ||
    currentUser?.role === 'contractor_supervisor';

  /**
   * IMPORTANT:
   * DB: ptws.contractor_id references contractors(id)
   * So we must filter using the contractor id, not users.id.
   *
   * Your currentUser might carry contractor_id / contractorId depending on your profile shape.
   * If it doesn't exist yet, we skip filtering to avoid hiding everything.
   */
  const currentContractorId =
    (currentUser as any)?.contractor_id ??
    (currentUser as any)?.contractorId ??
    null;

  const displayPTWs = useMemo(() => {
    if (!isContractor) return ptws ?? [];

    if (!currentContractorId) {
      // No contractor id available in currentUser (avoid breaking list)
      return ptws ?? [];
    }

    return (ptws ?? []).filter((p) => p.contractor_id === currentContractorId);
  }, [ptws, isContractor, currentContractorId]);

  const filteredPTWs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return displayPTWs ?? [];

    return (displayPTWs ?? []).filter((p) => {
      const title = (p.title ?? '').toLowerCase();
      const id = (p.id ?? '').toLowerCase();
      const location = (p.location ?? '').toLowerCase();

      return title.includes(q) || id.includes(q) || location.includes(q);
    });
  }, [displayPTWs, search]);

  const handleResubmit = () => {
    if (!resubmitDialog) return;

    // Optional: you are collecting `corrections` but not saving it.
    // If you want to store it, you need an API route + DB column.
    workflowActions.resubmitPTW(resubmitDialog.id);

    toast.success('PTW resubmitted successfully');
    setResubmitDialog(null);
    setCorrections('');
  };

  const handleMarkWorkCompleted = (id: string) => {
    workflowActions.markWorkCompleted(id);
    toast.success('Work marked as completed');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Permits to Work</h1>
            <p className="text-muted-foreground">
              {isContractor ? 'Manage your permits' : 'View all permits'}
            </p>
          </div>

          {isContractor && (
            <Button asChild>
              {/* Requirement: PTW must be created from APPROVED MOC.
                  So send user to MOC list page, where they click Create PTW after approval. */}
              <Link href="/moc">
                <Plus className="mr-2 h-4 w-4" />
                New Permit
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
                  placeholder="Search permits..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permit ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rev</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredPTWs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No permits found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPTWs.map((ptw) => (
                    <TableRow key={ptw.id}>
                      <TableCell className="font-medium">{ptw.id}</TableCell>
                      <TableCell>{ptw.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(ptw.permit_type ?? '').replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{ptw.location}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[ptw.status] as any}>
                          {(ptw.status ?? '').replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{ptw.revision_number}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {ptw.status === 'SENT_BACK' &&
                            ptw.sent_back_to_role === 'contractor_admin' && (
                              <Button size="sm" onClick={() => setResubmitDialog(ptw)}>
                                Resubmit
                              </Button>
                            )}

                          {ptw.status === 'ACTIVE' && isContractor && (
                            <Button size="sm" onClick={() => handleMarkWorkCompleted(ptw.id)}>
                              Mark Complete
                            </Button>
                          )}

                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/permits/${ptw.id}`}>View</Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!resubmitDialog} onOpenChange={() => setResubmitDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resubmit Permit</DialogTitle>
            <DialogDescription>
              This permit was sent back for corrections. Please address the issues and resubmit.
            </DialogDescription>
          </DialogHeader>

          {resubmitDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-destructive/10 p-3">
                <p className="text-sm font-medium text-destructive">Correction Required:</p>
                <p className="text-sm text-muted-foreground">
                  {resubmitDialog.sent_back_reason}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Corrections Made (optional)</Label>
                <Textarea
                  placeholder="Describe the corrections you made..."
                  value={corrections}
                  onChange={(e) => setCorrections(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setResubmitDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleResubmit}>Resubmit Permit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}