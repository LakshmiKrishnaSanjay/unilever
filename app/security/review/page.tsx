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
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import type { PTW } from '@/lib/types';
import { formatDate } from '@/lib/format';
import Link from 'next/link';

export default function SecurityReviewPage() {
  const { ptws } = useWorkflow();
  const workflowActions = useWorkflowActions();
  const [selectedPTW, setSelectedPTW] = useState<PTW | null>(null);
  const [action, setAction] = useState<'approve' | 'send_back' | null>(null);
  const [comments, setComments] = useState('');

  const pendingPTWs = ptws.filter((p) => p.status === 'PENDING_SECURITY_REVIEW');

const handleApprove = async () => {
  if (!selectedPTW) return;

  console.log("Selected PTW ID:", selectedPTW.id);  // Log the selected PTW ID before the approval action
  
  const result = await workflowActions.approveReviewStep(selectedPTW.id);  // Call backend function

  // Log the result from the backend
  console.log("Approval Result:", result);  

  if (result?.success === false) {
    console.error("Approval failed:", result.error || "Unknown error");
    toast.error(result.error || "Approval failed");
    return;
  }

  toast.success("PTW approved - moving to next review stage");
  
  setSelectedPTW(null);
  setComments("");
  setAction(null);
};

const handleSendBack = async () => {
  if (!selectedPTW || !comments.trim()) {
    toast.error("Please provide a reason for sending back");
    return;
  }

const result = await workflowActions.sendBackPTW(
  selectedPTW.id,
  'contractor_admin',
  comments
);

  if (result?.success === false) {
    toast.error(result.error || "Send back failed");
    return;
  }

  toast.success("PTW sent back to contractor");
  setSelectedPTW(null);
  setComments("");
  setAction(null);
};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Security Review Queue</h1>
          <p className="text-muted-foreground">
            Review and approve permits awaiting security clearance
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Reviews ({pendingPTWs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingPTWs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No pending reviews</p>
                <p className="text-sm text-muted-foreground">All permits have been reviewed</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPTWs.map((ptw) => (
                    <TableRow key={ptw.id}>
                      <TableCell className="font-medium">{ptw.id}</TableCell>
                      <TableCell>{ptw.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ptw.permit_type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>{ptw.location}</TableCell>
                      <TableCell>{ptw.status}</TableCell>

                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/permits/${ptw.id}`}>
                              <Eye className="mr-1 h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPTW(ptw);
                              setAction('approve');
                            }}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPTW(ptw);
                              setAction('send_back');
                            }}
                          >
                            <XCircle className="mr-1 h-4 w-4" />
                            Send Back
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedPTW} onOpenChange={() => setSelectedPTW(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'Approve Permit' : 'Send Back Permit'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? 'This will move the permit to the next review stage.'
                : 'Provide details on what needs to be corrected.'}
            </DialogDescription>
          </DialogHeader>
          {selectedPTW && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">{selectedPTW.title}</h4>
                <p className="text-sm text-muted-foreground">ID: {selectedPTW.id}</p>
                <p className="text-sm text-muted-foreground">Location: {selectedPTW.location}</p>
                <p className="text-sm text-muted-foreground">
                  Type: {selectedPTW.permit_type.replace('_', ' ')}
                </p>
              </div>

              {action === 'send_back' && (
                <div className="space-y-2">
                  <Label>Reason for Sending Back *</Label>
                  <Textarea
                    placeholder="Describe what needs to be corrected..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {action === 'approve' && (
                <div className="space-y-2">
                  <Label>Comments (optional)</Label>
                  <Textarea
                    placeholder="Add any review comments..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedPTW(null)}>
              Cancel
            </Button>
            {action === 'approve' ? (
              <Button onClick={handleApprove}>Approve & Continue</Button>
            ) : (
              <Button variant="destructive" onClick={handleSendBack}>
                Send Back
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
