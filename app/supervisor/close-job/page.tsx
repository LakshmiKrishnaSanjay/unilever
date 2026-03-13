'use client';

import { useMemo, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, FileCheck } from 'lucide-react';
import type { PTW } from '@/lib/types';

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

function formatDateTime(date?: string | Date | null): string {
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

function getNextStageLabel(ptw: PTW | null): string {
  if (!ptw) return 'Closure Review';

  if (ptw.sent_back_from_stage === 'PENDING_HSE_CLOSURE') {
    return 'HSE Closure';
  }

  if (ptw.sent_back_from_stage === 'PENDING_FACILITIES_CLOSURE') {
    return 'Facilities Closure';
  }

  if (ptw.sent_back_from_stage === 'PENDING_EFS_CLOSURE') {
    return 'EFS Closure';
  }

  if (ptw.requires_facilities_review) return 'Facilities Closure';
  if (ptw.requires_efs_review) return 'EFS Closure';
  return 'HSE Closure';
}

function getReturnedByLabel(ptw: PTW | null): string | null {
  if (!ptw || ptw.status !== 'WORK_COMPLETED' || ptw.sent_back_to_role !== 'supervisor') {
    return null;
  }

  if (ptw.sent_back_from_stage === 'PENDING_HSE_CLOSURE') {
    return 'Returned by HSE';
  }

  if (ptw.sent_back_from_stage === 'PENDING_FACILITIES_CLOSURE') {
    return 'Returned by Facilities';
  }

  if (ptw.sent_back_from_stage === 'PENDING_EFS_CLOSURE') {
    return 'Returned by EFS';
  }

  return 'Returned for Correction';
}

function showSendBackReason(ptw: PTW | null): boolean {
  if (!ptw) return false;

  return (
    ptw.status === 'WORK_COMPLETED' &&
    ptw.sent_back_to_role === 'supervisor' &&
    !!ptw.sent_back_reason?.trim()
  );
}

export default function CloseJobPage() {
  const { ptws, currentUser } = useWorkflow();

  const [selectedPTW, setSelectedPTW] = useState<PTW | null>(null);
  const [finalNotes, setFinalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItems>(defaultChecklist);

  const completedPTWs = useMemo(() => {
    return (ptws || []).filter((p) => p.status === 'WORK_COMPLETED');
  }, [ptws]);

  const resetForm = () => {
    setSelectedPTW(null);
    setFinalNotes('');
    setChecklistItems(defaultChecklist);
    setSubmitting(false);
  };

  const handleCloseJob = async () => {
    if (!selectedPTW) return;

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

      const res = await fetch(`/api/ptw/${selectedPTW.id}/supervisor-close`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checklistItems,
          finalNotes: finalNotes.trim(),
          completedBy: currentUser?.name || 'Supervisor',
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        toast.error(json?.error || 'Failed to submit supervisor closure');
        setSubmitting(false);
        return;
      }

      toast.success(
        `Closure checklist completed - Sent to ${json?.nextStageLabel || 'next reviewer'}`
      );

      window.location.reload();
    } catch (error: any) {
      toast.error(error?.message || 'Unexpected error');
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Job Closure</h1>
          <p className="text-muted-foreground">
            Review completed work permits and route them to the next closure stage
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              <CardTitle>Pending Supervisor Closure ({completedPTWs.length})</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            {completedPTWs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No jobs pending closure</p>
                <p className="text-sm text-muted-foreground">
                  All completed work has already been submitted to the next closure stage
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
                    <TableHead>Next Stage</TableHead>
                    <TableHead>Returned</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {completedPTWs.map((ptw) => (
                    <TableRow key={ptw.id}>
                      <TableCell className="font-medium">{ptw.id}</TableCell>
                      <TableCell>{ptw.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ptw.permit_type.replace(/_/g, ' ')}</Badge>
                      </TableCell>
                      <TableCell>{ptw.location}</TableCell>
                      <TableCell>
                        {ptw.work_completed_date ? formatDateTime(ptw.work_completed_date) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge>{getNextStageLabel(ptw)}</Badge>
                      </TableCell>
                      <TableCell>
                        {showSendBackReason(ptw) ? (
                          <Badge variant="destructive">
                            {getReturnedByLabel(ptw) || 'Sent Back'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">New</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => setSelectedPTW(ptw)}>
                          <FileCheck className="mr-1 h-4 w-4" />
                          Complete Checklist
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

      <Dialog open={!!selectedPTW} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
          <div className="flex max-h-[90vh] flex-col">
            <DialogHeader className="border-b px-6 pt-6 pb-4">
              <DialogTitle>Supervisor Closure Checklist</DialogTitle>
              <DialogDescription>
                Complete the checklist and submit this PTW to the next closure stage automatically
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {selectedPTW && (
                <div className="space-y-6">
                  {showSendBackReason(selectedPTW) && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="mb-2 flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <p className="font-medium">
                          {getReturnedByLabel(selectedPTW) || 'Returned for Correction'}
                        </p>
                      </div>
                      <p className="text-sm text-red-700">
                        <span className="font-medium">Reason:</span> {selectedPTW.sent_back_reason}
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg border p-4">
                    <h4 className="mb-2 font-medium">{selectedPTW.title}</h4>
                    <p className="text-sm text-muted-foreground">ID: {selectedPTW.id}</p>
                    <p className="text-sm text-muted-foreground">Location: {selectedPTW.location}</p>
                    <p className="text-sm text-muted-foreground">
                      Completed On:{' '}
                      {selectedPTW.work_completed_date
                        ? formatDateTime(selectedPTW.work_completed_date)
                        : '-'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Next Stage: {getNextStageLabel(selectedPTW)}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base">Closure Checklist</Label>
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
                          All work activities have been completed as specified
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
                          Work area has been cleaned and cleared of debris
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
                          All tools and equipment have been removed from site
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
                          Safety hazards have been eliminated or controlled
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
                          All required documentation is complete and accurate
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pb-2">
                    <Label>Final Closure Notes *</Label>
                    <Textarea
                      placeholder="Provide summary of work completed, observations, and handover notes..."
                      value={finalNotes}
                      onChange={(e) => setFinalNotes(e.target.value)}
                      rows={5}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <Button variant="outline" onClick={resetForm} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleCloseJob} disabled={submitting}>
                {submitting ? 'Submitting...' : `Submit to ${getNextStageLabel(selectedPTW)}`}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}