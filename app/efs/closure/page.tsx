'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflow } from '@/lib/use-workflow';
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
import { CheckCircle, FileText, ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import type { PTW } from '@/lib/types';

type ExtendedPTW = PTW & {
  supervisor_closure_completed_by?: string | null;
  supervisor_closure_notes?: string | null;
  supervisor_closure_checklist?: Record<string, boolean> | null;
  facilities_closure_completed_by?: string | null;
  facilities_closure_notes?: string | null;
};

function formatDateTime(date?: string | Date | null) {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '-';

  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function EFSClosurePage() {
  const { ptws, currentUser } = useWorkflow();
  const router = useRouter();

  const [selectedPTW, setSelectedPTW] = useState<ExtendedPTW | null>(null);
  const [notes, setNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pendingClosurePTWs = useMemo(() => {
    return (ptws as ExtendedPTW[]).filter(
      (p) => p.status === 'PENDING_EFS_CLOSURE'
    );
  }, [ptws]);

  const resetAll = () => {
    setSelectedPTW(null);
    setNotes('');
    setRejectReason('');
    setShowRejectDialog(false);
    setSubmitting(false);
  };

  const handleApprove = async () => {
    if (!selectedPTW) return;

    if (!notes.trim()) {
      toast.error('Please provide EFS closure review notes');
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`/api/ptw/${selectedPTW.id}/efs-close`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notes.trim(),
          completedBy: currentUser?.name || 'EFS Engineer',
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        toast.error(json?.error || 'Failed to approve EFS closure');
        setSubmitting(false);
        return;
      }

      toast.success('EFS closure approved - Sent to HSE Closure');
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.message || 'Unexpected error');
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPTW) return;

    if (!rejectReason.trim()) {
      toast.error('Please provide rejection reason');
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(`/api/ptw/${selectedPTW.id}/efs-close/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: rejectReason.trim(),
          rejectedBy: currentUser?.name || 'EFS Engineer',
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        toast.error(json?.error || 'Failed to reject EFS closure');
        setSubmitting(false);
        return;
      }

      toast.success('EFS closure rejected - Returned to supervisor');
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.message || 'Unexpected error');
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold">EFS Closure Reviews</h1>
            <p className="text-muted-foreground">
              Review completed work and move PTWs to HSE closure
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <CardTitle>
                Pending EFS Closure ({pendingClosurePTWs.length})
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            {pendingClosurePTWs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No jobs pending EFS closure</p>
                <p className="text-sm text-muted-foreground">
                  PTWs awaiting EFS closure review will appear here
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Next Stage After Approval</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingClosurePTWs.map((ptw) => (
                    <TableRow key={ptw.id}>
                      <TableCell className="font-medium">{ptw.id}</TableCell>
                      <TableCell>{ptw.title}</TableCell>
                      <TableCell>{ptw.location}</TableCell>
                      <TableCell>
                        {ptw.work_completed_date
                          ? formatDateTime(ptw.work_completed_date)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">HSE Closure</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => setSelectedPTW(ptw)}>
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedPTW && !showRejectDialog}
        onOpenChange={(open) => {
          if (!open && !submitting) resetAll();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
          <div className="flex max-h-[90vh] flex-col">
            <DialogHeader className="border-b px-6 pt-6 pb-4">
              <DialogTitle>EFS Closure Review</DialogTitle>
              <DialogDescription>
                Review previous closure details and move this PTW to HSE closure
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {selectedPTW && (
                <div className="space-y-6">
                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-medium">{selectedPTW.title}</h4>
                    <p className="text-sm text-muted-foreground">ID: {selectedPTW.id}</p>
                    <p className="text-sm text-muted-foreground">Location: {selectedPTW.location}</p>
                    <p className="text-sm text-muted-foreground">
                      Completed: {formatDateTime(selectedPTW.work_completed_date)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Next Stage After Approval: HSE Closure
                    </p>

                    {selectedPTW.supervisor_closure_completed_by && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Supervisor: {selectedPTW.supervisor_closure_completed_by}
                      </p>
                    )}

                    {selectedPTW.supervisor_closure_notes && (
                      <div className="mt-3 rounded bg-muted p-3">
                        <p className="text-sm font-medium">Supervisor Notes</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPTW.supervisor_closure_notes}
                        </p>
                      </div>
                    )}

                    {selectedPTW.supervisor_closure_checklist &&
                      Object.keys(selectedPTW.supervisor_closure_checklist).length > 0 && (
                        <div className="mt-3 rounded bg-muted p-3">
                          <p className="mb-2 text-sm font-medium">Supervisor Checklist</p>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            {Object.entries(selectedPTW.supervisor_closure_checklist).map(
                              ([key, value]) => (
                                <div key={key}>
                                  {key.replace(/_/g, ' ')}: {value ? 'Yes' : 'No'}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    {selectedPTW.facilities_closure_completed_by && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Facilities: {selectedPTW.facilities_closure_completed_by}
                      </p>
                    )}

                    {selectedPTW.facilities_closure_notes && (
                      <div className="mt-3 rounded bg-muted p-3">
                        <p className="text-sm font-medium">Facilities Notes</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPTW.facilities_closure_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pb-2">
                    <Label>EFS Review Notes *</Label>
                    <Textarea
                      placeholder="Provide EFS closure review notes, observations, and approval remarks..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={5}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={submitting}
              >
                <X className="mr-1 h-4 w-4" />
                Reject
              </Button>

              <Button variant="outline" onClick={resetAll} disabled={submitting}>
                Cancel
              </Button>

              <Button onClick={handleApprove} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Approve & Send to HSE Closure'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRejectDialog}
        onOpenChange={(open) => {
          if (!open && !submitting) setShowRejectDialog(false);
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden p-0">
          <div className="flex max-h-[85vh] flex-col">
            <DialogHeader className="border-b px-6 pt-6 pb-4">
              <DialogTitle>Reject EFS Closure</DialogTitle>
              <DialogDescription>
                Provide a reason for rejecting this closure. It will return to supervisor.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-2 pb-2">
                <Label>Rejection Reason *</Label>
                <Textarea
                  placeholder="Explain why the closure is being rejected and what needs to be corrected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>

              <Button variant="destructive" onClick={handleReject} disabled={submitting}>
                {submitting ? 'Rejecting...' : 'Reject Closure'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}