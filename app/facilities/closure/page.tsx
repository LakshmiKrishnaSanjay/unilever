'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflow, useWorkflowActions } from '@/lib/use-workflow';
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

export default function FacilitiesClosurePage() {
  const { ptws } = useWorkflow();
  const workflowActions = useWorkflowActions();
  const [selectedPTW, setSelectedPTW] = useState<PTW | null>(null);
  const [notes, setNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // PTWs waiting for facilities closure review
  const pendingClosurePTWs = ptws.filter(
    (p) => p.status === 'PENDING_FACILITIES_CLOSURE'
  );

  const formatDateTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleApprove = () => {
    if (!selectedPTW) return;

    if (!notes.trim()) {
      toast.error('Please provide closure review notes');
      return;
    }

    const result = workflowActions.approveFacilitiesClosure(selectedPTW.id, notes);
    if (result.success) {
      toast.success('Closure approved - Sent to HSE for final approval');
      setSelectedPTW(null);
      setNotes('');
    } else {
      toast.error(result.error || 'Failed to approve closure');
    }
  };

  const handleReject = () => {
    if (!selectedPTW) return;

    if (!rejectReason.trim()) {
      toast.error('Please provide rejection reason');
      return;
    }

    const result = workflowActions.rejectFacilitiesClosure(selectedPTW.id, rejectReason);
    if (result.success) {
      toast.success('Closure rejected - Returned to supervisor');
      setSelectedPTW(null);
      setShowRejectDialog(false);
      setRejectReason('');
      setNotes('');
    } else {
      toast.error(result.error || 'Failed to reject closure');
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
            <h1 className="text-3xl font-semibold">Job Closure Reviews</h1>
            <p className="text-muted-foreground">Review completed work and approve job closures</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <CardTitle>
                Pending Closure Review ({pendingClosurePTWs.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {pendingClosurePTWs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No jobs pending closure review</p>
                <p className="text-sm text-muted-foreground">
                  Completed jobs will appear here for review
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
                    <TableHead>Status</TableHead>
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
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Pending Facilities Closure</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => setSelectedPTW(ptw)}>
                          Review & Approve
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

      <Dialog open={!!selectedPTW && !showRejectDialog} onOpenChange={() => setSelectedPTW(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Facilities Closure Review</DialogTitle>
            <DialogDescription>
              Review supervisor closure checklist and approve for HSE final review
            </DialogDescription>
          </DialogHeader>
          {selectedPTW && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">{selectedPTW.title}</h4>
                <p className="text-sm text-muted-foreground">ID: {selectedPTW.id}</p>
                <p className="text-sm text-muted-foreground">Location: {selectedPTW.location}</p>
                <p className="text-sm text-muted-foreground">
                  Completed: {selectedPTW.work_completed_date ? formatDateTime(selectedPTW.work_completed_date) : '-'}
                </p>
                {selectedPTW.supervisorClosureCompletedBy && (
                  <p className="text-sm text-muted-foreground">
                    Supervisor: {selectedPTW.supervisorClosureCompletedBy}
                  </p>
                )}
                {selectedPTW.supervisorClosureNotes && (
                  <div className="mt-2 rounded bg-muted p-2">
                    <p className="text-sm font-medium">Supervisor Notes:</p>
                    <p className="text-sm text-muted-foreground">{selectedPTW.supervisorClosureNotes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Facilities Review Notes *</Label>
                <Textarea
                  placeholder="Provide facilities closure review notes, observations, and approval remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button 
              variant="destructive" 
              onClick={() => {
                setShowRejectDialog(true);
              }}
            >
              <X className="mr-1 h-4 w-4" />
              Reject
            </Button>
            <Button variant="outline" onClick={() => setSelectedPTW(null)}>
              Cancel
            </Button>
            <Button onClick={handleApprove}>Approve & Send to HSE</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Closure</DialogTitle>
            <DialogDescription>
              Provide reason for rejecting the closure - will return to supervisor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Rejection Reason *</Label>
            <Textarea
              placeholder="Explain why the closure is being rejected and what needs to be addressed..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Closure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
