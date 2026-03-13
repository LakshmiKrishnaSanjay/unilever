'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
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
import { CheckCircle, XCircle } from 'lucide-react';
import type { PTW } from '@/lib/types';

export default function FacilitiesReviewPage() {

  const [ptws, setPtws] = useState<PTW[]>([]);
  const router = useRouter();
  // const { currentUser } = useWorkflow();
  const [selectedPTW, setSelectedPTW] = useState<PTW | null>(null);
  const [action, setAction] = useState<'approve' | 'send_back' | null>(null);
  const [comments, setComments] = useState('');

  const { currentUser } = useWorkflow();

  // ⭐ Queue Loader Function (Important)
  const loadPTWs = async () => {
    try {
      const res = await fetch(
        "/api/ptw?status=PENDING_FACILITIES_REVIEW"
      );

      if (!res.ok) {
        setPtws([]);
        return;
      }

      const data = await res.json();
      setPtws(data || []);

    } catch (error) {
      console.error("Fetch PTW error:", error);
      setPtws([]);
    }
  };

  useEffect(() => {
    loadPTWs();
  }, []);

  const pendingPTWs = ptws;

  // ⭐ APPROVE
  const handleApprove = async (ptwId: string) => {
    try {

      const response = await fetch(`/api/ptw/${ptwId}/facilities-approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: currentUser.role,
        }),
      });

      const result = await response.json();

      if (result.success) {

        toast.success("PTW successfully moved to next stage!");

        setSelectedPTW(null);

        await loadPTWs(); // ⭐ refresh queue

      } else {
        toast.error(result.error || "Approval failed");
      }

    } catch (error) {
      console.error("Error during approval:", error);
      toast.error("Something went wrong!");
    }
  };

  // ⭐ SEND BACK
  const handleSendBack = async () => {

    if (!selectedPTW || !comments.trim()) {
      toast.error("Please provide a reason");
      return;
    }

    try {

      const res = await fetch(
        `/api/ptw/${selectedPTW.id}/facilities-sendback`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: comments }),
        }
      );

      const data = await res.json();

      if (data.success) {

        toast.success("PTW sent back to contractor");

        setSelectedPTW(null);
        setComments("");

        await loadPTWs(); // ⭐ refresh queue

      } else {
        toast.error(data.error || "Send back failed");
      }

    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-semibold">Facilities Review Queue</h1>
          <p className="text-muted-foreground">
            Review permits for facility availability and compliance
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
                <p className="text-sm text-muted-foreground">
                  All permits have been reviewed
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {pendingPTWs.map((ptw) => (
                    <TableRow key={ptw.id}>
                      <TableCell className="font-medium">{ptw.id}</TableCell>
                      <TableCell>{ptw.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ptw.permit_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{ptw.location}</TableCell>

                      <TableCell>
                        <div className="flex gap-2">

                              <Button
      size="sm"
      variant="secondary"
      onClick={() => router.push(`/permits/${ptw.id}`)}
    >
      <Eye className="mr-1 h-4 w-4" />
      View
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
                : 'Provide details on quality or facility concerns.'}
            </DialogDescription>
          </DialogHeader>

          {selectedPTW && (

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">

              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="mb-2 font-medium text-lg">
                  {selectedPTW.title}
                </h4>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>PTW ID: {selectedPTW.id}</div>
                  <div>Type: {selectedPTW.permit_type.replace('_', ' ')}</div>
                  <div>Location: {selectedPTW.location}</div>
                  <div>MOC: {selectedPTW.moc_id}</div>
                  <div>
                    Start:
                    {new Date(selectedPTW.start_datetime).toLocaleString()}
                  </div>
                  <div>
                    End:
                    {new Date(selectedPTW.end_datetime).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium mb-2">
                  Workers ({selectedPTW.worker_list.length})
                </p>

                <div className="space-y-1">
                  {selectedPTW.worker_list.map((w, i) => (
                    <div key={i} className="text-sm flex justify-between">
                      <span>{w.name}</span>
                      <span className="text-muted-foreground">{w.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedPTW.form_data && (
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium mb-2">Form Data</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedPTW.form_data, null, 2)}
                  </pre>
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  {action === 'send_back' ? 'Reason *' : 'Comments (optional)'}
                </Label>

                <Textarea
                  placeholder={
                    action === 'send_back'
                      ? 'Describe quality/facility concerns...'
                      : 'Add review comments...'
                  }
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
              </div>

            </div>
          )}

          <DialogFooter>

            <Button variant="outline" onClick={() => setSelectedPTW(null)}>
              Cancel
            </Button>

            {action === 'approve' ? (
              <Button
                onClick={() => selectedPTW && handleApprove(selectedPTW.id)}
              >
                Approve & Continue
              </Button>
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