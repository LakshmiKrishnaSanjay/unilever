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
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';
import type { PTW } from '@/lib/types';
import { useWorkflow } from '@/lib/use-workflow';

export default function EFSReviewPage() {

  const { currentUser } = useWorkflow();

  const [ptws, setPtws] = useState<PTW[]>([]);
  const [selectedPTW, setSelectedPTW] = useState<PTW | null>(null);
  const [action, setAction] = useState<'approve' | 'send_back' | null>(null);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Fetch Queue
  const loadPTWs = async () => {
    try {

      setLoading(true);

      const res = await fetch(
        "/api/ptw?status=PENDING_EFS_REVIEW"
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      setPtws(data || []);

    } catch {
      toast.error("Failed to load PTWs");
      setPtws([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPTWs();
  }, []);

  const pendingPTWs = ptws;

  // ✅ Approve
  const handleApprove = async () => {

    if (!selectedPTW) return;

    try {

      const res = await fetch(
        `/api/ptw/${selectedPTW.id}/efs-approve`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: currentUser.role
          })
        }
      );

      const result = await res.json();

      if (result.success) {

        toast.success("PTW approved - moving to HSE final review");

        setSelectedPTW(null);
        setComments("");
        setAction(null);

        await loadPTWs();
      }

    } catch {
      toast.error("Approval failed");
    }
  };

  // ✅ Send Back
  const handleSendBack = async () => {

    if (!selectedPTW || !comments.trim()) {
      toast.error("Please provide reason");
      return;
    }

    try {

      const res = await fetch(
        `/api/ptw/${selectedPTW.id}/efs-sendback`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: comments
          })
        }
      );

      const data = await res.json();

      if (data.success) {

        toast.success("PTW sent back to contractor");

        setSelectedPTW(null);
        setComments("");
        setAction(null);

        await loadPTWs();
      }

    } catch {
      toast.error("Send back failed");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-semibold">
            EFS Team Review Queue
          </h1>

          <p className="text-muted-foreground">
            Review permits for engineering and fire safety
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              Pending Reviews ({pendingPTWs.length})
            </CardTitle>
          </CardHeader>

          <CardContent>

            {loading ? (
              <p className="text-center py-10 text-muted-foreground">
                Loading queue...
              </p>
            ) : pendingPTWs.length === 0 ? (
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

                      <TableCell className="font-medium">
                        {ptw.id}
                      </TableCell>

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

<Dialog
  open={selectedPTW !== null}
  onOpenChange={(open) => {
    if (!open) {
      setSelectedPTW(null);
      setAction(null);
      setComments('');
    }
  }}
>
  <DialogContent>

    <DialogHeader>
      <DialogTitle>
        {action === 'approve'
          ? 'Approve Permit'
          : 'Send Back Permit'}
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
            {action === 'send_back'
              ? 'Reason *'
              : 'Comments (optional)'}
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

      <Button
        variant="outline"
        onClick={() => {
          setSelectedPTW(null);
          setAction(null);
          setComments('');
        }}
      >
        Cancel
      </Button>

      {action === 'approve' ? (
        <Button
          onClick={() =>
            selectedPTW && handleApprove(selectedPTW.id)
          }
        >
          Approve & Continue
        </Button>
      ) : (
        <Button
          variant="destructive"
          onClick={handleSendBack}
        >
          Send Back
        </Button>
      )}

    </DialogFooter>

  </DialogContent>
</Dialog>

    </DashboardLayout>
  );
}