'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Request = {
  id: string;
  moc_id: string;
  name: string;
  id_passport: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
};

export default function SupervisorRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [approveDialog, setApproveDialog] = useState(false);
  const [selectedReq, setSelectedReq] = useState<Request | null>(null);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const loadRequests = async () => {
    const { data, error } = await supabase
      .from('supervisor_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('LOAD REQUESTS ERROR:', error.message);
      setRequests([]);
      return;
    }

    setRequests(data || []);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const openApproveDialog = (req: Request) => {
    setSelectedReq(req);
    setPassword('');
    setApproveDialog(true);
  };

const approveRequest = async () => {
  if (!selectedReq) return;

  if (!password.trim()) {
    alert('Please enter a password');
    return;
  }

  setSaving(true);

  try {
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw sessionErr;

    const token = sessionData.session?.access_token;
    if (!token) {
      console.error('Not authenticated');
      setSaving(false);
      return;
    }

    const username =
      selectedReq.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9._-]/g, '') ||
      `user_${Date.now()}`;

    const res = await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username,
        name: selectedReq.name,
        email: selectedReq.email,
        role: 'contractor_supervisor',
        is_active: true,
        password,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      console.error('CREATE USER ERROR:', json?.error || 'Failed to create user');
      setSaving(false);
      return;
    }

    await supabase
      .from('supervisor_requests')
      .update({ status: 'approved' })
      .eq('id', selectedReq.id);

    setApproveDialog(false);
    setSelectedReq(null);
    setPassword('');
    await loadRequests();
  } catch (err) {
    console.error('APPROVE ERROR:', err);
  } finally {
    setSaving(false);
  }
};

  const rejectRequest = async (id: string) => {
    const { error } = await supabase
      .from('supervisor_requests')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      console.error('REJECT ERROR:', error.message);
      return;
    }

    loadRequests();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Supervisor Requests</h1>

        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MOC</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No pending supervisor requests
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>{req.moc_id}</TableCell>
                      <TableCell>{req.name}</TableCell>
                      <TableCell>{req.id_passport}</TableCell>
                      <TableCell>{req.phone}</TableCell>
                      <TableCell>{req.email}</TableCell>

                      <TableCell className="flex gap-2">
                        <Button size="sm" onClick={() => openApproveDialog(req)}>
                          Approve
                        </Button>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectRequest(req.id)}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Contractor Supervisor</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={selectedReq?.name || ''} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={selectedReq?.email || ''} readOnly />
              </div>

              <div className="space-y-2">
                <Label>ID / Passport</Label>
                <Input value={selectedReq?.id_passport || ''} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={selectedReq?.phone || ''} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter temporary password"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setApproveDialog(false);
                  setSelectedReq(null);
                  setPassword('');
                }}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button onClick={approveRequest} disabled={saving}>
                {saving ? 'Creating...' : 'Approve & Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}