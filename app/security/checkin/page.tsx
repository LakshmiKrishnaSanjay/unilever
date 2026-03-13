'use client';

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { UserCheck, LogOut, Clock, Scan, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { PTW, Worker } from '@/lib/types';
import { workflowStore } from '@/lib/workflow-store';

type EntryChecklistItem = {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
};

export default function SecurityCheckinPage() {
  const { ptws, currentUser } = useWorkflow();

  const [selectedPTW, setSelectedPTW] = useState<PTW | null>(null);
  const [action, setAction] = useState<'checkin' | 'checkout' | null>(null);
  const [badgeScanInput, setBadgeScanInput] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [workerChecklist, setWorkerChecklist] = useState<EntryChecklistItem[]>([]);
  const [notes, setNotes] = useState('');

  const readyPTWs = ptws.filter((p) => p.status === 'READY_FOR_ENTRY');
  const activePTWs = ptws.filter((p) => p.status === 'ACTIVE');

  const getEntryProgress = (ptw: any) =>
    ptw?.entryProgress || ptw?.entry_progress || null;

  const getBadgeValue = (worker: any) =>
    worker?.badge_id || worker?.badgeId || worker?.badge || '-';

  const getStartDateTime = (ptw: any) =>
    ptw?.startDatetime || ptw?.start_datetime || null;

  const handleBadgeScan = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPTW || !badgeScanInput.trim()) return;

    const worker = await workflowStore.scanWorkerByBadge(
      selectedPTW.id,
      badgeScanInput.trim()
    );

    if (!worker) {
      toast.error('Badge not found in worker list');
      return;
    }

    if (worker.entryStatus === 'PASSED') {
      toast.info(`${worker.name} already checked in`);
      setBadgeScanInput('');
      return;
    }

    setSelectedWorker(worker);
    setWorkerChecklist(worker.entryChecklist || []);
    setBadgeScanInput('');
  };

  const handleSaveChecklist = async () => {
    if (!selectedPTW || !selectedWorker) return;

    const badge =
      selectedWorker.badge_id ||
      selectedWorker.badgeId ||
      selectedWorker.badge ||
      '';

    await workflowStore.updateWorkerChecklist(
      selectedPTW.id,
      badge,
      workerChecklist
    );

    const allRequiredChecked = workerChecklist
      .filter((item) => item.required)
      .every((item) => item.checked);

    if (allRequiredChecked) {
      toast.success(`${selectedWorker.name} entry passed!`);
    } else {
      toast.info(`${selectedWorker.name} checklist saved`);
    }

    setSelectedWorker(null);
    setWorkerChecklist([]);

    await workflowStore.syncFromDatabase();

    const updatedPTW = workflowStore.getState().ptws.find(
      (p) => p.id === selectedPTW.id
    );

    if (updatedPTW) {
      setSelectedPTW(updatedPTW);
    }
  };

  const handleApproveEntry = async () => {
    if (!selectedPTW || !currentUser) return;

    const success = await workflowStore.approveEntry(
      selectedPTW.id,
      currentUser.name
    );

    if (success) {
      toast.success('Entry approved. PTW is now ACTIVE.');
      setSelectedPTW(null);
      setAction(null);
      setBadgeScanInput('');
    } else {
      toast.error('Cannot approve: not all workers have passed entry checks');
    }
  };

  const handleCheckout = async () => {
    if (!selectedPTW || !currentUser) return;

    const result = await workflowStore.confirmSecurityCheckout(
      selectedPTW.id,
      currentUser.name,
      notes
    );

    if (result.success) {
      toast.success('Security check-out confirmed successfully');
      setSelectedPTW(null);
      setAction(null);
      setNotes('');
    } else {
      toast.error(result.error || 'Failed to confirm check-out');
    }
  };

  const openCheckinDialog = (ptw: PTW) => {
    setSelectedPTW(ptw);
    setAction('checkin');
    setBadgeScanInput('');
  };

  const getEntryStatusBadge = (status?: string) => {
    switch (status) {
      case 'PASSED':
        return (
          <Badge className="bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Passed
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge variant="outline">
            <AlertCircle className="mr-1 h-3 w-3" />
            In Progress
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatDateTime = (date: string | Date | null | undefined) => {
    if (!date) return '-';

    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedEntryProgress = selectedPTW ? getEntryProgress(selectedPTW) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Security Check-in/Check-out</h1>
          <p className="text-muted-foreground">
            Verify workers and manage site access control
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              <CardTitle>Ready for Entry Check-in ({readyPTWs.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {readyPTWs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No permits ready for entry check-in
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Entry Progress</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readyPTWs.map((ptw) => {
                    const progress = getEntryProgress(ptw);

                    return (
                      <TableRow key={ptw.id}>
                        <TableCell className="font-medium">{ptw.id}</TableCell>
                        <TableCell>{ptw.title}</TableCell>
                        <TableCell>{ptw.location}</TableCell>
                        <TableCell>
                          {progress ? (
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  progress.passed === progress.total
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {progress.passed}/{progress.total} Passed
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="outline">
                              {ptw.worker_list?.length || 0} workers
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDateTime(getStartDateTime(ptw))}</TableCell>
                        <TableCell>
                          <Button size="sm" onClick={() => openCheckinDialog(ptw)}>
                            <Scan className="mr-1 h-4 w-4" />
                            Scan Badges
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Active Work ({activePTWs.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {activePTWs.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">
                No active work in progress
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Permit ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activePTWs.map((ptw) => (
                    <TableRow key={ptw.id}>
                      <TableCell className="font-medium">{ptw.id}</TableCell>
                      <TableCell>{ptw.title}</TableCell>
                      <TableCell>{ptw.location}</TableCell>
                      <TableCell>
                        <Badge>Active</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPTW(ptw);
                            setAction('checkout');
                          }}
                        >
                          <LogOut className="mr-1 h-4 w-4" />
                          Check-out Workers
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
        open={action === 'checkin'}
        onOpenChange={() => {
          setSelectedPTW(null);
          setSelectedWorker(null);
          setBadgeScanInput('');
          setAction(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Security Entry Check-in</DialogTitle>
            <DialogDescription>
              Scan worker badges and complete entry checklist before allowing site access
            </DialogDescription>
          </DialogHeader>

          {selectedPTW && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="mb-2 font-medium">{selectedPTW.title}</h4>
                <p className="text-sm text-muted-foreground">ID: {selectedPTW.id}</p>
                <p className="text-sm text-muted-foreground">Location: {selectedPTW.location}</p>
                {selectedEntryProgress && (
                  <p className="mt-2 text-sm font-medium">
                    Entry Progress: {selectedEntryProgress.passed}/{selectedEntryProgress.total} Workers Passed
                  </p>
                )}
              </div>

              <form onSubmit={handleBadgeScan} className="space-y-2">
                <Label htmlFor="badge-scan" className="text-base">
                  Scan Worker Badge
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="badge-scan"
                    placeholder="Scan or enter badge ID..."
                    value={badgeScanInput}
                    onChange={(e) => setBadgeScanInput(e.target.value)}
                    autoFocus
                  />
                  <Button type="submit">
                    <Scan className="mr-1 h-4 w-4" />
                    Scan
                  </Button>
                </div>
              </form>

              <div className="space-y-3">
                <Label className="text-base">Workers</Label>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Badge ID</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Entry Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPTW.worker_list?.map((worker, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{worker.name}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {getBadgeValue(worker)}
                          </TableCell>
                          <TableCell>{worker.role || 'Worker'}</TableCell>
                          <TableCell>{getEntryStatusBadge(worker.entryStatus)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {selectedEntryProgress &&
                selectedEntryProgress.passed === selectedEntryProgress.total &&
                selectedEntryProgress.total > 0 && (
                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      onClick={handleApproveEntry}
                      size="lg"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Approve Entry / Activate PTW
                    </Button>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPTW(null);
                setAction(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={selectedWorker !== null}
        onOpenChange={() => {
          setSelectedWorker(null);
          setWorkerChecklist([]);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Worker Entry Checklist</DialogTitle>
            <DialogDescription>
              Complete all required checks before approving entry
            </DialogDescription>
          </DialogHeader>

          {selectedWorker && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3 bg-muted/50">
                <p className="font-medium">{selectedWorker.name}</p>
                <p className="text-sm text-muted-foreground">
                  Badge: {getBadgeValue(selectedWorker)}
                </p>
              </div>

              <div className="space-y-3">
                {workerChecklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <Checkbox
                      id={item.id}
                      checked={item.checked}
                      onCheckedChange={(checked) => {
                        setWorkerChecklist(
                          workerChecklist.map((c) =>
                            c.id === item.id
                              ? { ...c, checked: checked as boolean }
                              : c
                          )
                        );
                      }}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={item.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {item.label}
                        {item.required && (
                          <span className="ml-1 text-red-500">*</span>
                        )}
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-sm text-muted-foreground">
                * Required checks must be completed
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedWorker(null);
                setWorkerChecklist([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveChecklist}>Save Checklist</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={action === 'checkout'}
        onOpenChange={() => {
          setSelectedPTW(null);
          setAction(null);
          setNotes('');
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Security Check-out</DialogTitle>
            <DialogDescription>
              Confirm all workers have left the site and work area is secure
            </DialogDescription>
          </DialogHeader>

          {selectedPTW && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-medium">{selectedPTW.title}</h4>
                <p className="text-sm text-muted-foreground">ID: {selectedPTW.id}</p>
                <p className="text-sm text-muted-foreground">Location: {selectedPTW.location}</p>
              </div>

              <div className="space-y-2">
                <Label>Check-out Notes (optional)</Label>
                <Textarea
                  placeholder="Confirm site status and any observations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
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
                setNotes('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCheckout}>Confirm Check-out</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}