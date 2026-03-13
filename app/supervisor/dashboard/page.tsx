'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflow, useWorkflowActions } from '@/lib/use-workflow';
import { StatCard } from '@/components/stat-card';
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
import { Input } from '@/components/ui/input';
import { CheckCircle, Clock, FileText, AlertCircle, Plus, Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { PTW, MOC } from '@/lib/types';
import { supabase } from '@/lib/supabase-client';

export default function SupervisorDashboard() {
  const { ptws = [] } = useWorkflow();
  const workflowActions = useWorkflowActions();

  const [selectedPTW, setSelectedPTW] = useState<PTW | null>(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [dbPtws, setDbPtws] = useState<PTW[]>([]);
  const [dbMocs, setDbMocs] = useState<MOC[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Keep Active Work from workflow store because that part already works fine
  const activeWork = (ptws ?? []).filter((p) => p.status === 'ACTIVE');

  // Fetch other dashboard data from Supabase
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);

        const [ptwRes, mocRes] = await Promise.all([
          supabase.from('ptws').select('*').order('created_at', { ascending: false }),
          supabase.from('mocs').select('*').order('created_at', { ascending: false }),
        ]);

        if (ptwRes.error) throw ptwRes.error;
        if (mocRes.error) throw mocRes.error;

        setDbPtws((ptwRes.data || []) as PTW[]);
        setDbMocs((mocRes.data || []) as MOC[]);
      } catch (error) {
        console.error('Failed to fetch supervisor dashboard data:', error);
        toast.error('Failed to load latest dashboard data');
      } finally {
        setLoadingStats(false);
      }
    };

    fetchDashboardData();
  }, []);

  // These now come from Supabase
  const completedWork = (dbPtws ?? []).filter((p) => p.status === 'WORK_COMPLETED');
  const totalPTWs = (dbPtws ?? []).length;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleAddWorkLog = async () => {
    if (!selectedPTW) return;

    if (!currentStatus.trim()) {
      toast.error('Current status is required');
      return;
    }

    if (!remarks.trim()) {
      toast.error('Remarks are required');
      return;
    }

    if (!selectedFile) {
      toast.error('Photo evidence is required');
      return;
    }

    try {
      const uploadResult = await workflowActions.uploadPTWWorkLogPhoto(
        selectedFile,
        selectedPTW.id
      );

      if (!uploadResult.success || !uploadResult.url) {
        toast.error(uploadResult.error || 'Photo upload failed');
        return;
      }

      const saveResult = await workflowActions.addPTWWorkLog(
        selectedPTW.id,
        currentStatus.trim(),
        remarks.trim(),
        uploadResult.url
      );

      if (!saveResult.success) {
        toast.error(saveResult.error || 'Failed to save work log');
        return;
      }

      toast.success('Work log added successfully');

      setSelectedPTW(null);
      setCurrentStatus('');
      setRemarks('');
      setSelectedFile(null);
      setImagePreview(null);
    } catch (error) {
      console.error(error);
      toast.error('Failed to add work log');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Supervisor Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor active work and manage job closures
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Work"
            value={activeWork.length}
            description="Currently in progress"
            icon={Clock}
          />
          <StatCard
            title="Pending Closure"
            value={loadingStats ? '...' : completedWork.length}
            description="Awaiting supervisor review"
            icon={FileText}
          />
          <StatCard
            title="Total PTWs"
            value={loadingStats ? '...' : totalPTWs}
            description="All time permits"
            icon={CheckCircle}
          />
<StatCard
  title="Closed Jobs"
  value={loadingStats ? '...' : dbPtws.filter((p) => p.status === 'CLOSED').length}
  description="Fully closed permits"
  icon={AlertCircle}
/>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Work</CardTitle>
                <Badge variant="secondary">{activeWork.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {activeWork.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No active work</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permit ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeWork.slice(0, 5).map((ptw) => (
                      <TableRow key={ptw.id}>
                        <TableCell className="font-medium">{ptw.id}</TableCell>
                        <TableCell>{ptw.title}</TableCell>
                        <TableCell>{ptw.location}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => setSelectedPTW(ptw)}>
                            <Plus className="mr-1 h-3 w-3" />
                            Add Log
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {activeWork.length > 5 && (
                <Button variant="ghost" size="sm" asChild className="mt-4 w-full">
                  <Link href="/permits">View All Active Work</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Closure</CardTitle>
                <Badge variant="secondary">{loadingStats ? '...' : completedWork.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <p className="text-center text-sm text-muted-foreground">Loading...</p>
              ) : completedWork.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No jobs pending closure
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permit ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {completedWork.slice(0, 5).map((ptw) => (
                      <TableRow key={ptw.id}>
                        <TableCell className="font-medium">{ptw.id}</TableCell>
                        <TableCell>{ptw.title}</TableCell>
                        <TableCell>{formatDate(ptw.work_completed_date)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!loadingStats && completedWork.length > 0 && (
                <Button asChild className="mt-4 w-full">
                  <Link href="/supervisor/close-job">Review & Close Jobs</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <Button variant="outline" asChild>
                <Link href="/permits">
                  <FileText className="mr-2 h-4 w-4" />
                  View All Permits
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/supervisor/close-job">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Close Jobs
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/activity">
                  <Clock className="mr-2 h-4 w-4" />
                  Activity Log
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={!!selectedPTW}
        onOpenChange={() => {
          setSelectedPTW(null);
          setCurrentStatus('');
          setRemarks('');
          setSelectedFile(null);
          setImagePreview(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Hourly Work Log</DialogTitle>
            <DialogDescription>
              Record progress update for active PTW
            </DialogDescription>
          </DialogHeader>
          {selectedPTW && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <p className="font-medium">{selectedPTW.title}</p>
                <p className="text-sm text-muted-foreground">PTW ID: {selectedPTW.id}</p>
                <p className="text-sm text-muted-foreground">Location: {selectedPTW.location}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Current Status *</Label>
                <Input
                  id="status"
                  placeholder="e.g., 50% complete, installing pipes"
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks *</Label>
                <Textarea
                  id="remarks"
                  placeholder="Describe work progress, observations, any issues..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Photo Evidence *</Label>
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!imagePreview ? (
                  <label
                    htmlFor="file-upload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 transition-colors hover:border-muted-foreground/50 hover:bg-muted"
                  >
                    <Camera className="mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                      Upload progress photos
                    </p>
                    <Button type="button" size="sm" variant="outline">
                      Upload
                    </Button>
                  </label>
                ) : (
                  <div className="relative rounded-lg border">
                    <img
                      src={imagePreview}
                      alt="Work progress preview"
                      className="h-48 w-full rounded-lg object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={handleRemovePhoto}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <label htmlFor="file-upload">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="absolute bottom-2 right-2"
                        asChild
                      >
                        <span>Retake</span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPTW(null);
                setCurrentStatus('');
                setRemarks('');
                setSelectedFile(null);
                setImagePreview(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddWorkLog}
              disabled={!currentStatus.trim() || !remarks.trim() || !selectedFile}
            >
              Save Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}