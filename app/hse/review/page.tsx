'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { CheckCircle, XCircle, Award, Eye } from 'lucide-react';
import type { PTW } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { useWorkflow } from '@/lib/use-workflow';
import { supabase } from '@/lib/supabase-client';

export default function HSEReviewPage() {
  const router = useRouter();
  const { currentUser } = useWorkflow();

  const [ptws, setPtws] = useState<PTW[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedPTW, setSelectedPTW] = useState<PTW | null>(null);
  const [action, setAction] = useState<'approve' | 'send_back' | null>(null);
  const [comments, setComments] = useState('');

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  };

  const loadPTWs = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const res = await fetch('/api/ptw?status=PENDING_HSE_APPROVAL', {
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
    } catch (e) {
      console.error(e);
      toast.error('Failed to load PTWs');
      setPtws([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPTWs();
  }, []);

  const pendingPTWs = ptws;

  const handleApprove = async () => {
    if (!selectedPTW) return;

    try {
      const token = await getToken();

      const res = await fetch(`/api/ptw/${selectedPTW.id}/hse-approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          role: currentUser?.role,
          comments: comments?.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      console.log('HSE approve:', res.status, data);

      if (!res.ok || data?.success === false) {
        toast.error(data?.error || 'Approval failed');
        return;
      }

      toast.success('Permit fully approved and ready for entry');

      setSelectedPTW(null);
      setAction(null);
      setComments('');

      await loadPTWs();
    } catch (e) {
      console.error(e);
      toast.error('Approval request failed');
    }
  };

  const handleSendBack = async () => {
    if (!selectedPTW || !comments.trim()) {
      toast.error('Please provide reason');
      return;
    }

    try {
      const token = await getToken();

      const res = await fetch(`/api/ptw/${selectedPTW.id}/hse-sendback`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: comments.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      console.log('HSE sendback:', res.status, data);

      if (!res.ok || data?.success === false) {
        toast.error(data?.error || 'Send back failed');
        return;
      }

      toast.success('PTW sent back');

      setSelectedPTW(null);
      setComments('');
      setAction(null);

      await loadPTWs();
    } catch (e) {
      console.error(e);
      toast.error('Send back request failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">HSE Final Review Queue</h1>
          <p className="text-muted-foreground">
            Final safety review before permit activation
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pending Final Reviews ({pendingPTWs.length})</CardTitle>

              <Badge variant="secondary" className="gap-1">
                <Award className="h-3 w-3" />
                Final Authority
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="py-10 text-center text-muted-foreground">
                Loading queue...
              </p>
            ) : pendingPTWs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No pending reviews</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Start Date</TableHead>
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
                          {ptw.permit_type?.replace?.('_', ' ') || ptw.permit_type}
                        </Badge>
                      </TableCell>

                      <TableCell>{ptw.location}</TableCell>
                      <TableCell>{formatDateTime(ptw.start_datetime)}</TableCell>

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
                              setComments('');
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
                              setComments('');
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
        open={!!selectedPTW}
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
              {action === 'approve' ? 'Final Approval' : 'Send Back Permit'}
            </DialogTitle>

            <DialogDescription>
              {action === 'approve'
                ? 'This will complete the final HSE review and move the permit to Ready for Entry.'
                : 'Provide HSE safety concern reason.'}
            </DialogDescription>
          </DialogHeader>

          {selectedPTW && (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto">
              <div className="rounded-lg border bg-muted/50 p-4">
                <h4 className="mb-2 text-lg font-medium">{selectedPTW.title}</h4>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>PTW ID: {selectedPTW.id}</div>
                  <div>
                    Type:{' '}
                    {selectedPTW.permit_type?.replace?.('_', ' ') ||
                      selectedPTW.permit_type}
                  </div>
                  <div>Location: {selectedPTW.location}</div>
                  <div>MOC: {selectedPTW.moc_id}</div>
                  <div>Start: {formatDateTime(selectedPTW.start_datetime)}</div>
                  <div>End: {formatDateTime(selectedPTW.end_datetime)}</div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <p className="mb-2 text-sm font-medium">
                  Workers ({selectedPTW.worker_list?.length || 0})
                </p>

                <div className="space-y-1">
                  {(selectedPTW.worker_list || []).map((w, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{w.name}</span>
                      <span className="text-muted-foreground">{w.role}</span>
                    </div>
                  ))}
                </div>
              </div>



              <div className="space-y-2">
                <Label>
                  {action === 'send_back' ? 'Reason *' : 'Comments (optional)'}
                </Label>

                <Textarea
                  placeholder={
                    action === 'send_back'
                      ? 'Describe HSE safety concerns...'
                      : 'Add final review comments...'
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
              <Button onClick={handleApprove}>Final Approve</Button>
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