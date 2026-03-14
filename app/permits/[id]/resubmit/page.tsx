'use client';

import { use, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkflow, useWorkflowActions } from '@/lib/use-workflow';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, Clock, MapPin, Users, AlertCircle, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PERMIT_FORMS } from '@/components/permits/forms';
import type { Worker } from '@/lib/types';

const statusColors: Record<string, string> = {
  DRAFT: 'secondary',
  SUBMITTED: 'secondary',
  PENDING_SECURITY_REVIEW: 'outline',
  PENDING_FACILITIES_REVIEW: 'outline',
  PENDING_EFS_REVIEW: 'outline',
  PENDING_HSE_APPROVAL: 'outline',
  READY_FOR_ENTRY: 'default',
  ACTIVE: 'default',
  WORK_COMPLETED: 'secondary',
  WAITING_SUPERVISOR_FINISH: 'secondary',
  WORK_FINISHED: 'secondary',
  PENDING_FACILITIES_CLOSURE: 'outline',
  PENDING_STAKEHOLDER_CLOSURE: 'outline',
  PENDING_HSE_CLOSURE: 'outline',
  CLOSED: 'secondary',
  REJECTED: 'destructive',
  SENT_BACK: 'destructive',
};

const stageLabels: Record<string, string> = {
  PENDING_SECURITY_REVIEW: 'Security',
  PENDING_FACILITIES_REVIEW: 'Facilities',
  PENDING_EFS_REVIEW: 'EFS',
  PENDING_HSE_APPROVAL: 'HSE',
  PENDING_FACILITIES_CLOSURE: 'Facilities Closure',
  PENDING_STAKEHOLDER_CLOSURE: 'Stakeholder Closure',
  PENDING_HSE_CLOSURE: 'HSE Closure',
};

const defaultResubmitStage = 'PENDING_SECURITY_REVIEW';

function formatDateTime(date: string | null | undefined): string {
  if (!date) return '-';
  return format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
}

function toInputDateTimeValue(date: string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function PermitResubmitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { ptws = [], mocs = [], contractors = [], currentUser } = useWorkflow();
  const workflowActions = useWorkflowActions();

  const ptw = (ptws ?? []).find((p) => p.id === resolvedParams.id);
  const moc = (mocs ?? []).find((m) => m.id === ptw?.moc_id);
  const contractor = contractors.find((c) => c.id === ptw?.contractor_id);

  const [startDateTime, setStartDateTime] = useState(
    ptw ? toInputDateTimeValue(ptw.start_datetime) : ''
  );
  const [endDateTime, setEndDateTime] = useState(
    ptw ? toInputDateTimeValue(ptw.end_datetime) : ''
  );
  const [workerList, setWorkerList] = useState<Worker[]>(ptw?.worker_list ?? []);
  const [saving, setSaving] = useState(false);

  const canResubmit =
    currentUser?.role === 'contractor_admin' &&
    ptw?.status === 'SENT_BACK';

  const showSentBackReason = useMemo(() => {
    return !!ptw?.sent_back_reason;
  }, [ptw]);

  const sentBackStage = ptw?.sent_back_from_stage || defaultResubmitStage;
  const sentBackStageLabel = stageLabels[sentBackStage] || 'Security';

  const addWorker = () => {
    setWorkerList((prev) => [
      ...prev,
      {
        name: '',
        badge: '',
        role: '',
      },
    ]);
  };

  const updateWorker = (index: number, field: keyof Worker, value: string) => {
    setWorkerList((prev) =>
      prev.map((worker, i) =>
        i === index ? { ...worker, [field]: value } : worker
      )
    );
  };

  const removeWorker = (index: number) => {
    setWorkerList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAndResubmit = async () => {
    if (!ptw) return;

    if (!startDateTime || !endDateTime) {
      toast.error('Please enter start and end date/time');
      return;
    }

    if (workerList.length === 0) {
      toast.error('Please add at least one worker');
      return;
    }

    const invalidWorker = workerList.some(
      (worker) => !worker.name?.trim() || !worker.badge?.trim() || !worker.role?.trim()
    );

    if (invalidWorker) {
      toast.error('Please complete all worker details');
      return;
    }

    setSaving(true);

    try {
      const updateRes = await workflowActions.updatePTW(ptw.id, {
        start_datetime: new Date(startDateTime).toISOString(),
        end_datetime: new Date(endDateTime).toISOString(),
        worker_list: workerList,
        sent_back_reason: null,
        sent_back_to_role: null,
        sent_back_from_stage: null,
        status: sentBackStage,
        revision_number: (ptw.revision_number || 0) + 1,
      });

      if (!updateRes.success) {
        toast.error(updateRes.error || 'Failed to update permit');
        setSaving(false);
        return;
      }

      toast.success('Permit updated and resubmitted');
      router.push(`/permits/${ptw.id}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to resubmit permit');
    } finally {
      setSaving(false);
    }
  };

  if (!ptw) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">Permit not found</p>
          <Button className="mt-4" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!canResubmit) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">This permit cannot be resubmitted</p>
          <Button className="mt-4" asChild>
            <Link href={`/permits/${ptw.id}`}>Back to Permit</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const FormComponent = ptw.supporting_permit ? PERMIT_FORMS[ptw.permit_type] : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/permits/${ptw.id}`}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="flex-1">
            <h1 className="text-3xl font-semibold">Resubmit Permit</h1>
            <p className="text-sm text-muted-foreground">
              {ptw.title} · {ptw.id}
            </p>
          </div>

          <Badge variant={statusColors[ptw.status] as any} className="text-sm">
            {ptw.status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {showSentBackReason && (
          <Alert className="border-destructive bg-destructive/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">
                {sentBackStageLabel} sent this permit back for correction
              </p>
              <p className="mt-1 text-sm">{ptw.sent_back_reason}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Returned from stage: {sentBackStageLabel}
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Permit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Permit Type</p>
                    <p className="mt-1">{ptw.permit_type.replace(/_/g, ' ')}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revision</p>
                    <p className="mt-1">Rev {(ptw.revision_number || 0) + 1}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <div className="mt-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p>{ptw.location}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contractor</p>
                    <p className="mt-1">{contractor?.companyName  || 'Unknown'}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_datetime">Start Date & Time</Label>
                    <Input
                      id="start_datetime"
                      type="datetime-local"
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_datetime">End Date & Time</Label>
                    <Input
                      id="end_datetime"
                      type="datetime-local"
                      value={endDateTime}
                      onChange={(e) => setEndDateTime(e.target.value)}
                    />
                  </div>
                </div>

                {ptw.submission_date && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Last Submitted On</p>
                      <p className="mt-1">{formatDateTime(ptw.submission_date)}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Related MOC</CardTitle>
              </CardHeader>
              <CardContent>
                {moc ? (
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{moc.title}</p>
                        <p className="text-sm text-muted-foreground">{moc.id}</p>
                      </div>
                      <Badge
                        variant={moc.priority === 'CRITICAL' ? 'destructive' : 'secondary'}
                      >
                        {moc.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{moc.scope}</p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/moc/${moc.id}`}>View MOC Details</Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">MOC not found</p>
                )}
              </CardContent>
            </Card>

            {ptw.supporting_permit && ptw.permit_type !== 'MASTER' && (
              <Card>
                <CardHeader>
                  <CardTitle>Supporting Permit Form</CardTitle>
                </CardHeader>
                <CardContent>
                  {FormComponent ? (
                    <FormComponent
                      data={ptw.supporting_permit.data}
                      onChange={() => {}}
                      readOnly={true}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Form not available</p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle>Worker List</CardTitle>
                  </div>

                  <Button type="button" size="sm" variant="outline" onClick={addWorker}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Worker
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {workerList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No workers added</p>
                ) : (
                  workerList.map((worker, index) => (
                    <div key={index} className="rounded-lg border p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Worker {index + 1}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removeWorker(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input
                            value={worker.name || ''}
                            onChange={(e) => updateWorker(index, 'name', e.target.value)}
                            placeholder="Worker name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Badge</Label>
                          <Input
                            value={worker.badge || ''}
                            onChange={(e) => updateWorker(index, 'badge', e.target.value)}
                            placeholder="Badge number"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Role</Label>
                          <Input
                            value={worker.role || ''}
                            onChange={(e) => updateWorker(index, 'role', e.target.value)}
                            placeholder="Worker role"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Security Review</span>
                  <Badge variant="outline">Required</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Facilities Review</span>
                  <Badge variant={ptw.requires_facilities_review ? 'outline' : 'secondary'}>
                    {ptw.requires_facilities_review ? 'Required' : 'Not Required'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">EFS Review</span>
                  <Badge variant={ptw.requires_efs_review ? 'outline' : 'secondary'}>
                    {ptw.requires_efs_review ? 'Required' : 'Not Required'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">HSE Final Review</span>
                  <Badge variant="outline">Required</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Workflow Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { status: 'DRAFT', label: 'Draft' },
                    { status: 'SUBMITTED', label: 'Submitted' },
                    { status: 'PENDING_SECURITY_REVIEW', label: 'Security Review' },
                    { status: 'PENDING_FACILITIES_REVIEW', label: 'Facilities Review' },
                    { status: 'PENDING_EFS_REVIEW', label: 'EFS Review' },
                    { status: 'PENDING_HSE_APPROVAL', label: 'HSE Final Review' },
                    { status: 'READY_FOR_ENTRY', label: 'Ready for Entry' },
                    { status: 'ACTIVE', label: 'Active Work' },
                    { status: 'WORK_COMPLETED', label: 'Work Completed' },
                    { status: 'CLOSED', label: 'Closed' },
                  ].map((step, index) => {
                    const statuses = [
                      'DRAFT',
                      'SUBMITTED',
                      'PENDING_SECURITY_REVIEW',
                      'PENDING_FACILITIES_REVIEW',
                      'PENDING_EFS_REVIEW',
                      'PENDING_HSE_APPROVAL',
                      'READY_FOR_ENTRY',
                      'ACTIVE',
                      'WORK_COMPLETED',
                      'CLOSED',
                    ];

                    const currentIndex = statuses.indexOf(ptw.status);
                    const isPast = index < currentIndex;
                    const isCurrent = step.status === ptw.status;

                    if (step.status === 'PENDING_FACILITIES_REVIEW' && !ptw.requires_facilities_review)
                      return null;
                    if (step.status === 'PENDING_EFS_REVIEW' && !ptw.requires_efs_review)
                      return null;

                    return (
                      <div key={step.status} className="flex items-center gap-3">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            isCurrent
                              ? 'bg-primary'
                              : isPast
                                ? 'bg-primary/50'
                                : 'bg-muted-foreground/30'
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            isCurrent
                              ? 'font-medium'
                              : isPast
                                ? 'text-muted-foreground'
                                : 'text-muted-foreground/50'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}

                                    {ptw.status === 'SENT_BACK' && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-sm font-medium text-destructive">
                        Sent Back for Correction
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleUpdateAndResubmit}
                  disabled={saving}
                >
                  {saving ? 'Resubmitting...' : 'Update & Resubmit'}
                </Button>

                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/permits/${ptw.id}`}>Cancel</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Original Submission Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-medium text-muted-foreground">Start Date & Time</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p>{formatDateTime(ptw.start_datetime)}</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-muted-foreground">End Date & Time</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p>{formatDateTime(ptw.end_datetime)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}