'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, FileCheck } from 'lucide-react';
import type { PTW } from '@/lib/types';
import { useWorkflow } from '@/lib/use-workflow';
import { supabase } from '@/lib/supabase-client';

type ExtendedPTW = PTW & {
  supervisor_closure_completed_by?: string | null;
  supervisor_closure_notes?: string | null;
  supervisor_closure_checklist?: Record<string, boolean> | null;
  facilities_closure_completed_by?: string | null;
  facilities_closure_notes?: string | null;
  efs_closure_completed_by?: string | null;
  efs_closure_notes?: string | null;
};

type ChecklistItems = {
  work_completed: boolean;
  area_cleaned: boolean;
  tools_removed: boolean;
  safety_verified: boolean;
  documentation_complete: boolean;
};

const defaultChecklist: ChecklistItems = {
  work_completed: false,
  area_cleaned: false,
  tools_removed: false,
  safety_verified: false,
  documentation_complete: false,
};

function formatDateTime(date?: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '-';

  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRejectReturnLabel(): string {
  return 'Supervisor';
}

export default function HSEClosurePage() {
  const { currentUser } = useWorkflow();

  const [ptws, setPtws] = useState<ExtendedPTW[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPTW, setSelectedPTW] = useState<ExtendedPTW | null>(null);
  const [finalNotes, setFinalNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItems>(defaultChecklist);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  };

  const loadPTWs = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const res = await fetch('/api/ptw?status=PENDING_HSE_CLOSURE', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('loadPTWs failed:', res.status, text);
        setPtws([]);
        return;
      }

      const data = await res.json();
      setPtws(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch PTW error:', err);
      toast.error('Failed to load PTWs');
      setPtws([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPTWs();
  }, []);

  const completedPTWs = useMemo(() => ptws, [ptws]);

  const resetDialogState = () => {
    setSelectedPTW(null);
    setFinalNotes('');
    setRejectReason('');
    setShowRejectDialog(false);
    setSubmitting(false);
    setChecklistItems(defaultChecklist);
  };

  const handleCloseJob = async () => {
    if (!selectedPTW || !currentUser) return;

    const allChecked = Object.values(checklistItems).every(Boolean);
    if (!allChecked) {
      toast.error('Please complete all checklist items');
      return;
    }

    if (!finalNotes.trim()) {
      toast.error('Please provide closure notes');
      return;
    }

    try {
      setSubmitting(true);
      const token = await getToken();

      const res = await fetch(`/api/ptw/${selectedPTW.id}/hse-close`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          notes: finalNotes.trim(),
          checklistItems,
          completedBy: currentUser.name || 'HSE Manager',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        toast.error(data?.error || 'Failed to close PTW');
        setSubmitting(false);
        return;
      }

      toast.success('PTW closed successfully');
      resetDialogState();
      await loadPTWs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to close PTW');
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
      const token = await getToken();

      const res = await fetch(`/api/ptw/${selectedPTW.id}/hse-close/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason: rejectReason.trim(),
          rejectedBy: currentUser?.name || 'HSE Manager',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        toast.error(data?.error || 'Failed to reject closure');
        setSubmitting(false);
        return;
      }

      toast.success(`Closure rejected - Returned to ${data?.returnStageLabel || 'Supervisor'}`);
      resetDialogState();
      await loadPTWs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject closure');
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">HSE Job Closure</h1>
          <p className="text-muted-foreground">
            Review and approve final PTW closures
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              <CardTitle>Pending HSE Final Approval ({completedPTWs.length})</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="py-10 text-center text-muted-foreground">Loading queue...</p>
            ) : completedPTWs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No jobs pending closure</p>
                <p className="text-sm text-muted-foreground">
                  All completed work has been closed
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Completed On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {completedPTWs.map((ptw) => (
                    <TableRow key={ptw.id}>
                      <TableCell className="font-medium">{ptw.id}</TableCell>
                      <TableCell>{ptw.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ptw.permit_type?.replace?.(/_/g, ' ') || ptw.permit_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{ptw.location}</TableCell>
                      <TableCell>
                        {ptw.work_completed_date ? formatDateTime(ptw.work_completed_date) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => setSelectedPTW(ptw)}>
                          <FileCheck className="mr-1 h-4 w-4" />
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
          if (!open && !submitting) resetDialogState();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
          <div className="flex max-h-[90vh] flex-col">
            <DialogHeader className="border-b px-6 pt-6 pb-4">
              <DialogTitle>HSE Job Closure Approval</DialogTitle>
              <DialogDescription>
                Complete the checklist and provide final HSE closure approval
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
                      Completed: {selectedPTW.work_completed_date ? formatDateTime(selectedPTW.work_completed_date) : '-'}
                    </p>

                    {selectedPTW.supervisor_closure_completed_by && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        Supervisor: {selectedPTW.supervisor_closure_completed_by}
                      </p>
                    )}

                    {selectedPTW.supervisor_closure_notes && (
                      <div className="mt-2 rounded bg-muted p-3">
                        <p className="text-sm font-medium">Supervisor Notes</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPTW.supervisor_closure_notes}
                        </p>
                      </div>
                    )}

                    {selectedPTW.facilities_closure_completed_by && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Facilities: {selectedPTW.facilities_closure_completed_by}
                      </p>
                    )}

                    {selectedPTW.facilities_closure_notes && (
                      <div className="mt-2 rounded bg-muted p-3">
                        <p className="text-sm font-medium">Facilities Notes</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPTW.facilities_closure_notes}
                        </p>
                      </div>
                    )}

                    {selectedPTW.efs_closure_completed_by && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        EFS: {selectedPTW.efs_closure_completed_by}
                      </p>
                    )}

                    {selectedPTW.efs_closure_notes && (
                      <div className="mt-2 rounded bg-muted p-3">
                        <p className="text-sm font-medium">EFS Notes</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedPTW.efs_closure_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base">HSE Closure Checklist</Label>

                    <div className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="work_completed"
                          checked={checklistItems.work_completed}
                          onCheckedChange={(checked) =>
                            setChecklistItems((prev) => ({
                              ...prev,
                              work_completed: checked === true,
                            }))
                          }
                        />
                        <Label htmlFor="work_completed" className="font-normal">
                          All work activities completed as per PTW scope
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="area_cleaned"
                          checked={checklistItems.area_cleaned}
                          onCheckedChange={(checked) =>
                            setChecklistItems((prev) => ({
                              ...prev,
                              area_cleaned: checked === true,
                            }))
                          }
                        />
                        <Label htmlFor="area_cleaned" className="font-normal">
                          Work area cleaned and restored to original condition
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="tools_removed"
                          checked={checklistItems.tools_removed}
                          onCheckedChange={(checked) =>
                            setChecklistItems((prev) => ({
                              ...prev,
                              tools_removed: checked === true,
                            }))
                          }
                        />
                        <Label htmlFor="tools_removed" className="font-normal">
                          All tools, equipment, and materials removed from site
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="safety_verified"
                          checked={checklistItems.safety_verified}
                          onCheckedChange={(checked) =>
                            setChecklistItems((prev) => ({
                              ...prev,
                              safety_verified: checked === true,
                            }))
                          }
                        />
                        <Label htmlFor="safety_verified" className="font-normal">
                          No outstanding safety hazards or concerns
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="documentation_complete"
                          checked={checklistItems.documentation_complete}
                          onCheckedChange={(checked) =>
                            setChecklistItems((prev) => ({
                              ...prev,
                              documentation_complete: checked === true,
                            }))
                          }
                        />
                        <Label htmlFor="documentation_complete" className="font-normal">
                          All required documentation and records complete
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pb-2">
                    <Label>HSE Closure Notes *</Label>
                    <Textarea
                      placeholder="Provide HSE closure summary, observations, and final approval notes..."
                      value={finalNotes}
                      onChange={(e) => setFinalNotes(e.target.value)}
                      rows={5}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t px-6 py-4 gap-2">
              <Button
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={submitting}
              >
                Reject
              </Button>

              <Button variant="outline" onClick={resetDialogState} disabled={submitting}>
                Cancel
              </Button>

              <Button onClick={handleCloseJob} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Approve & Close PTW'}
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
              <DialogTitle>Reject HSE Closure</DialogTitle>
              <DialogDescription>
                Provide reason for rejection. It will return to {getRejectReturnLabel()}.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-4">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">
                    On rejection, this PTW will go back to {getRejectReturnLabel()}.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pb-2">
                <Label>Rejection Reason *</Label>
                <Textarea
                  placeholder="Explain why the closure is being rejected and what needs to be addressed..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)} disabled={submitting}>
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