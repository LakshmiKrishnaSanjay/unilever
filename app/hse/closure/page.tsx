'use client';

import { useEffect, useState } from 'react';
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
import { CheckCircle, FileCheck } from 'lucide-react';
import type { PTW } from '@/lib/types';
import { useWorkflow } from '@/lib/use-workflow';
import { supabase } from '@/lib/supabase-client';

function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HSEClosurePage() {
  const { currentUser } = useWorkflow();

  const [ptws, setPtws] = useState<PTW[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPTW, setSelectedPTW] = useState<PTW | null>(null);
  const [finalNotes, setFinalNotes] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [checklistItems, setChecklistItems] = useState({
    work_completed: false,
    area_cleaned: false,
    tools_removed: false,
    safety_verified: false,
    documentation_complete: false,
  });

  // ✅ token helper (for secured APIs)
  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  };

  // ✅ fetch from real DB by status
  const loadPTWs = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const res = await fetch('/api/ptw?status=PENDING_HSE_CLOSURE', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const t = await res.text().catch(() => '');
        console.error('loadPTWs failed:', res.status, t);
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

  const completedPTWs = ptws; // already filtered by API

  const resetDialogState = () => {
    setSelectedPTW(null);
    setFinalNotes('');
    setRejectReason('');
    setShowRejectDialog(false);
    setChecklistItems({
      work_completed: false,
      area_cleaned: false,
      tools_removed: false,
      safety_verified: false,
      documentation_complete: false,
    });
  };

  // ⭐ Approve & Close Job (call your API)
  const handleCloseJob = async () => {
    if (!selectedPTW || !currentUser) return;

    const allChecked = Object.values(checklistItems).every((v) => v);
    if (!allChecked) {
      toast.error('Please complete all checklist items');
      return;
    }

    if (!finalNotes.trim()) {
      toast.error('Please provide closure notes');
      return;
    }

    try {
      const token = await getToken();

      // ✅ Make sure you have this route:
      // /api/ptw/[id]/hse-closure-approve  (or change to your real route)
      const res = await fetch(`/api/ptw/${selectedPTW.id}/hse-closure-approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          notes: finalNotes.trim(),
          checklist: checklistItems,
        }),
      });

      const data = await res.json().catch(() => ({}));
      console.log('HSE closure approve:', res.status, data);

      if (!res.ok || data?.success === false) {
        toast.error(data?.error || 'Failed to close job');
        return;
      }

      toast.success('PTW Closed - Contractor notified');
      resetDialogState();
      await loadPTWs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to close job');
    }
  };

  // ⭐ Reject Closure (call your API)
  const handleReject = async () => {
    if (!selectedPTW) return;

    if (!rejectReason.trim()) {
      toast.error('Please provide rejection reason');
      return;
    }

    try {
      const token = await getToken();

      // ✅ Make sure you have this route:
      // /api/ptw/[id]/hse-closure-reject (or change to your real route)
      const res = await fetch(`/api/ptw/${selectedPTW.id}/hse-closure-reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          reason: rejectReason.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      console.log('HSE closure reject:', res.status, data);

      if (!res.ok || data?.success === false) {
        toast.error(data?.error || 'Failed to reject closure');
        return;
      }

      toast.success('Closure rejected - Returned to Facilities');
      resetDialogState();
      await loadPTWs();
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject closure');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">HSE Job Closure</h1>
          <p className="text-muted-foreground">
            Review and approve job closures as HSE Manager
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              <CardTitle>
                Pending HSE Final Approval ({completedPTWs.length})
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-center py-10 text-muted-foreground">
                Loading queue...
              </p>
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
                          {ptw.permit_type?.replace?.('_', ' ') || ptw.permit_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{ptw.location}</TableCell>
                      <TableCell>
                        {ptw.work_completed_date
                          ? formatDateTime(ptw.work_completed_date)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => setSelectedPTW(ptw)}>
                          <FileCheck className="mr-1 h-4 w-4" />
                          Close Job
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

      {/* Main Dialog */}
      <Dialog
        open={!!selectedPTW}
        onOpenChange={(open) => {
          if (!open) resetDialogState();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>HSE Job Closure Approval</DialogTitle>
            <DialogDescription>
              Complete the closure checklist and provide final HSE approval
            </DialogDescription>
          </DialogHeader>

          {selectedPTW && (
            <div className="space-y-6">
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">{selectedPTW.title}</h4>
                <p className="text-sm text-muted-foreground">ID: {selectedPTW.id}</p>
                <p className="text-sm text-muted-foreground">
                  Location: {selectedPTW.location}
                </p>
                <p className="text-sm text-muted-foreground">
                  Completed:{' '}
                  {selectedPTW.work_completed_date
                    ? formatDateTime(selectedPTW.work_completed_date)
                    : '-'}
                </p>

                {selectedPTW.supervisorClosureCompletedBy && (
                  <p className="text-sm text-muted-foreground">
                    Supervisor: {selectedPTW.supervisorClosureCompletedBy}
                  </p>
                )}

                {selectedPTW.facilitiesClosureApprovedBy && (
                  <p className="text-sm text-muted-foreground">
                    Facilities Approved By: {selectedPTW.facilitiesClosureApprovedBy}
                  </p>
                )}

                {selectedPTW.supervisorClosureNotes && (
                  <div className="mt-2 rounded bg-muted p-2">
                    <p className="text-sm font-medium">Supervisor Notes:</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPTW.supervisorClosureNotes}
                    </p>
                  </div>
                )}

                {selectedPTW.facilitiesClosureNotes && (
                  <div className="mt-2 rounded bg-muted p-2">
                    <p className="text-sm font-medium">Facilities Notes:</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPTW.facilitiesClosureNotes}
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
                        setChecklistItems({
                          ...checklistItems,
                          work_completed: checked as boolean,
                        })
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
                        setChecklistItems({
                          ...checklistItems,
                          area_cleaned: checked as boolean,
                        })
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
                        setChecklistItems({
                          ...checklistItems,
                          tools_removed: checked as boolean,
                        })
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
                        setChecklistItems({
                          ...checklistItems,
                          safety_verified: checked as boolean,
                        })
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
                        setChecklistItems({
                          ...checklistItems,
                          documentation_complete: checked as boolean,
                        })
                      }
                    />
                    <Label htmlFor="documentation_complete" className="font-normal">
                      All required documentation and records complete
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
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

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Reject
            </Button>

            <Button variant="outline" onClick={resetDialogState}>
              Cancel
            </Button>

            <Button onClick={handleCloseJob}>Approve & Close PTW</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject HSE Closure</DialogTitle>
            <DialogDescription>
              Provide reason for rejection - will return to Facilities for review
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