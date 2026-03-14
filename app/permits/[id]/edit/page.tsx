'use client';

import { use, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BadgeCard } from '@/components/badge-card';
import { PERMIT_FORMS } from '@/components/permits/forms';
import { useWorkflow, useWorkflowActions } from '@/lib/use-workflow';
import type { PermitType } from '@/lib/types';

import {
  ChevronLeft,
  Clock,
  MapPin,
  FileText,
  Users,
  IdCard,
  Printer,
  Download,
  CheckCircle,
  Trash2,
  Save,
  Send,
  Plus,
} from 'lucide-react';

type EditableWorker = {
  name: string;
  role: string;
  badge: string;
  contact: string;
  idPassport: string;
  badge_id?: string | null;
  badgeId?: string | null;
};

const permitTypes: PermitType[] = [
  'MASTER',
  'HOT_WORK',
  'WORK_AT_HEIGHT',
  'CONFINED_SPACE',
  'EXCAVATION',
  'ELECTRICAL_ISOLATION',
  'PIPEWORK_ISOLATION',
];

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
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
  SENT_BACK: 'destructive',
  REJECTED: 'destructive',
};

function formatDateTime(date: string | null | undefined): string {
  if (!date) return '-';
  return format(new Date(date), 'yyyy-MM-dd HH:mm:ss');
}

function createEmptyWorker(index: number): EditableWorker {
  return {
    name: '',
    role: '',
    badge: `W${String(index + 1).padStart(3, '0')}`,
    contact: '',
    idPassport: '',
  };
}

function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EditPermitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const badgeCardsRef = useRef<HTMLDivElement>(null);

  const { ptws = [], mocs = [], users = [], currentUser } = useWorkflow();
  const workflowActions = useWorkflowActions();

  const ptw = useMemo(
    () => ptws.find((p) => p.id === resolvedParams.id),
    [ptws, resolvedParams.id]
  );

  const moc = useMemo(
    () => mocs.find((m) => m.id === ptw?.moc_id),
    [mocs, ptw?.moc_id]
  );

  const contractor = useMemo(
    () => users.find((u) => u.id === ptw?.contractor_id),
    [users, ptw?.contractor_id]
  );

  const approvedMocs = useMemo(
    () => mocs.filter((m) => m.status === 'APPROVED'),
    [mocs]
  );

  const [title, setTitle] = useState('');
  const [mocId, setMocId] = useState('');
  const [permitType, setPermitType] = useState<PermitType>('MASTER');
  const [location, setLocation] = useState('');
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');
  const [requiresFacilitiesReview, setRequiresFacilitiesReview] = useState(false);
  const [requiresEfsReview, setRequiresEfsReview] = useState(false);
  const [requiresStakeholderClosure, setRequiresStakeholderClosure] = useState(false);
  const [workers, setWorkers] = useState<EditableWorker[]>([]);
  const [supportingPermitData, setSupportingPermitData] = useState<any>({});

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearingDraft, setIsClearingDraft] = useState(false);

  useEffect(() => {
    if (!ptw) return;

    setTitle(ptw.title || '');
    setMocId(ptw.moc_id || '');
    setPermitType((ptw.permit_type as PermitType) || 'MASTER');
    setLocation(ptw.location || '');
    setStartDatetime(toDatetimeLocal(ptw.start_datetime));
    setEndDatetime(toDatetimeLocal(ptw.end_datetime));
    setRequiresFacilitiesReview(!!ptw.requires_facilities_review);
    setRequiresEfsReview(!!ptw.requires_efs_review);
    setRequiresStakeholderClosure(!!ptw.requires_stakeholder_closure);
    setSupportingPermitData(ptw.supporting_permit?.data || {});

    const mappedWorkers =
      Array.isArray(ptw.worker_list) && ptw.worker_list.length > 0
        ? ptw.worker_list.map((worker: any, index: number) => ({
            name: worker?.name || '',
            role: worker?.role || '',
            badge: worker?.badge || `W${String(index + 1).padStart(3, '0')}`,
            contact: worker?.contact || '',
            idPassport: worker?.idPassport || '',
            badge_id: worker?.badge_id ?? null,
            badgeId: worker?.badgeId ?? null,
          }))
        : [createEmptyWorker(0)];

    setWorkers(mappedWorkers);
  }, [ptw]);

  const hasBadges = ptw?.worker_list?.some((w: any) => w.badge_id || w.badgeId);
  const isApproved =
    ptw?.status === 'READY_FOR_ENTRY' ||
    ptw?.status === 'ACTIVE' ||
    ptw?.status === 'WORK_COMPLETED';

  const showBadges =
    !!hasBadges &&
    !!isApproved &&
    !!ptw?.worker_list &&
    ptw.worker_list.length > 0;

  const canEdit =
    currentUser?.role === 'contractor_admin' &&
    (ptw?.status === 'DRAFT' || ptw?.status === 'SENT_BACK');

  const FormComponent = PERMIT_FORMS[permitType];

  const updateWorker = (
    index: number,
    field: keyof EditableWorker,
    value: string
  ) => {
    setWorkers((prev) =>
      prev.map((worker, i) =>
        i === index ? { ...worker, [field]: value } : worker
      )
    );
  };

  const addWorker = () => {
    setWorkers((prev) => [...prev, createEmptyWorker(prev.length)]);
  };

  const removeWorker = (index: number) => {
    setWorkers((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [createEmptyWorker(0)];
    });
  };

  const buildPayload = () => ({
    id: ptw?.id,
    moc_id: mocId || null,
    title: title || null,
    permit_type: permitType || null,
    location: location || null,
    start_datetime: startDatetime ? new Date(startDatetime).toISOString() : null,
    end_datetime: endDatetime ? new Date(endDatetime).toISOString() : null,
    requires_facilities_review: requiresFacilitiesReview,
    requires_efs_review: requiresEfsReview,
    requires_stakeholder_closure: requiresStakeholderClosure,
    worker_list: workers.map((worker, index) => ({
      ...worker,
      badge: worker.badge?.trim() || `W${String(index + 1).padStart(3, '0')}`,
    })),
    supporting_permit:
      permitType !== 'MASTER'
        ? {
            type: permitType,
            data: supportingPermitData || {},
          }
        : null,
  });

  const handleSaveDraft = async () => {
    if (!ptw) return;

    try {
      setIsSaving(true);

      const res = await workflowActions.savePTWDraft(buildPayload());

      if (!res.success) {
        toast.error(res.error || 'Failed to save draft');
        return;
      }

      toast.success('Draft saved successfully');
      router.push(`/permits/${ptw.id}`);
      router.refresh();
    } catch (error) {
      console.error('Save draft failed:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!ptw) return;

    try {
      setIsSubmitting(true);

      const saveRes = await workflowActions.savePTWDraft(buildPayload());
      if (!saveRes.success) {
        toast.error(saveRes.error || 'Failed to save changes before submit');
        return;
      }

      const submitRes = await workflowActions.submitPTW(ptw.id);
      if (!submitRes.success) {
        toast.error(submitRes.error || 'Submit failed');
        return;
      }

      toast.success('Permit submitted successfully');
      router.push(`/permits/${ptw.id}`);
      router.refresh();
    } catch (error) {
      console.error('Submit failed:', error);
      toast.error('Submit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearDraft = async () => {
    if (!ptw) return;

    const confirmed = window.confirm(
      'Are you sure you want to clear this draft? This action cannot be undone.'
    );

    if (!confirmed) return;

    try {
      setIsClearingDraft(true);

      const res = await workflowActions.clearPTWDraft(ptw.id);
      if (!res.success) {
        toast.error(res.error || 'Failed to clear draft');
        return;
      }

      toast.success('Draft cleared successfully');
      router.push('/permits');
      router.refresh();
    } catch (error) {
      console.error('Clear draft failed:', error);
      toast.error('Failed to clear draft');
    } finally {
      setIsClearingDraft(false);
    }
  };

  const handlePrintBadges = () => {
    const printContent = badgeCardsRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Gate Pass - ${resolvedParams.id}</title>
          <style>
            @media print {
              @page { size: A4; margin: 10mm; }
              body { margin: 0; padding: 10mm; }
              .no-print { display: none !important; }
            }
            body { font-family: system-ui, -apple-system, sans-serif; }
          </style>
          ${document.head.querySelector('style')?.outerHTML || ''}
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadPDF = async () => {
    const element = badgeCardsRef.current;
    if (!element) {
      toast.error('Badge cards not found');
      return;
    }

    try {
      toast.info('Generating PDF...');

      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF({
        orientation: imgHeight > imgWidth ? 'portrait' : 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      pdf.save(`GatePass-${resolvedParams.id}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast.error('Failed to generate PDF');
    }
  };

  if (!ptw) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">Permit not found</p>
          <Button className="mt-4" onClick={() => router.push('/permits')}>
            Back to Permits
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!canEdit) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Alert>
            <AlertDescription>
              This permit cannot be edited. Only contractor draft or sent-back permits can be updated.
            </AlertDescription>
          </Alert>

          <Button asChild variant="outline">
            <Link href={`/permits/${ptw.id}`}>Back to Permit</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <h1 className="text-3xl font-semibold">{title || 'Untitled Permit'}</h1>
            <p className="text-sm text-muted-foreground">{ptw.id}</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">


            <Badge
              variant={statusColors[ptw.status] ?? 'secondary'}
              className="text-sm"
            >
              {ptw.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        {ptw.status === 'SENT_BACK' && ptw.sent_back_reason && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Corrections Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{ptw.sent_back_reason}</p>
              {ptw.sent_back_to_role && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Sent back to: {ptw.sent_back_to_role}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Permit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Permit Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter permit title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="permitType">Permit Type</Label>
                    <select
                      id="permitType"
                      value={permitType}
                      onChange={(e) => {
                        const next = e.target.value as PermitType;
                        setPermitType(next);

                        if (next === 'MASTER') {
                          setSupportingPermitData({});
                        } else if (
                          ptw.supporting_permit?.type !== next
                        ) {
                          setSupportingPermitData({});
                        }
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {permitTypes.map((type) => (
                        <option key={type} value={type}>
                          {type.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

<div className="space-y-2 md:col-span-2">
  <Label>Related MOC</Label>

  <div className="flex h-10 w-full items-center rounded-md border bg-muted/30 px-3 text-sm">
    {moc ? `${moc.title}` : 'No MOC linked'}
  </div>
</div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter work location"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDatetime">Start Date & Time</Label>
                    <Input
                      id="startDatetime"
                      type="datetime-local"
                      value={startDatetime}
                      onChange={(e) => setStartDatetime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDatetime">End Date & Time</Label>
                    <Input
                      id="endDatetime"
                      type="datetime-local"
                      value={endDatetime}
                      onChange={(e) => setEndDatetime(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Review Requirements</h3>

                  <div className="flex flex-col gap-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="requiresFacilitiesReview"
                        checked={requiresFacilitiesReview}
                        onCheckedChange={(checked) =>
                          setRequiresFacilitiesReview(checked === true)
                        }
                      />
                      <Label htmlFor="requiresFacilitiesReview">
                        Requires Facilities Review
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="requiresEfsReview"
                        checked={requiresEfsReview}
                        onCheckedChange={(checked) =>
                          setRequiresEfsReview(checked === true)
                        }
                      />
                      <Label htmlFor="requiresEfsReview">
                        Requires EFS Review
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="requiresStakeholderClosure"
                        checked={requiresStakeholderClosure}
                        onCheckedChange={(checked) =>
                          setRequiresStakeholderClosure(checked === true)
                        }
                      />
                      <Label htmlFor="requiresStakeholderClosure">
                        Requires Stakeholder Closure
                      </Label>
                    </div>
                  </div>
                </div>

                {(startDatetime || endDatetime || ptw.submission_date) && (
                  <>
                    <Separator />

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Preview Start</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <p>
                            {startDatetime
                              ? formatDateTime(new Date(startDatetime).toISOString())
                              : '-'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Preview End</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <p>
                            {endDatetime
                              ? formatDateTime(new Date(endDatetime).toISOString())
                              : '-'}
                          </p>
                        </div>
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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{moc.title}</p>
                        <p className="text-sm text-muted-foreground">{moc.id}</p>
                      </div>

                      <Badge
                        variant={moc.priority === 'CRITICAL' ? 'destructive' : 'secondary'}
                      >
                        {moc.priority || 'N/A'}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">{moc.scope || '-'}</p>

                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/moc/${moc.id}`}>View MOC Details</Link>
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">MOC not found</p>
                )}
              </CardContent>
            </Card>

            {permitType !== 'MASTER' && (
              <Card>
                <CardHeader>
                  <CardTitle>Supporting Permit Form</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const SelectedFormComponent = PERMIT_FORMS[permitType];
                    if (!SelectedFormComponent) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          Form not available
                        </p>
                      );
                    }

                    return (
                      <SelectedFormComponent
                        data={supportingPermitData}
                        onChange={(next: any) => setSupportingPermitData(next)}
                        readOnly={false}
                      />
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <CardTitle>Worker List</CardTitle>
                </div>

                <Button type="button" variant="outline" onClick={addWorker}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Worker
                </Button>
              </CardHeader>

              <CardContent className="space-y-4">
                {workers.map((worker, index) => (
                  <div key={index} className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Worker {index + 1}</h4>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeWorker(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={worker.name}
                          onChange={(e) => updateWorker(index, 'name', e.target.value)}
                          placeholder="Worker name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Input
                          value={worker.role}
                          onChange={(e) => updateWorker(index, 'role', e.target.value)}
                          placeholder="Worker role"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Badge</Label>
                        <Input
                          value={worker.badge}
                          onChange={(e) => updateWorker(index, 'badge', e.target.value)}
                          placeholder="Badge code"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Contact</Label>
                        <Input
                          value={worker.contact}
                          onChange={(e) => updateWorker(index, 'contact', e.target.value)}
                          placeholder="Phone or contact"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label>ID / Passport</Label>
                        <Input
                          value={worker.idPassport}
                          onChange={(e) => updateWorker(index, 'idPassport', e.target.value)}
                          placeholder="ID or passport number"
                        />
                      </div>

                      {(worker.badge_id || worker.badgeId) && (
                        <div className="md:col-span-2">
                          <p className="text-xs text-muted-foreground font-mono">
                            Existing badge ID: {worker.badge_id || worker.badgeId}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {showBadges && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <IdCard className="h-5 w-5" />
                      <CardTitle>Gate Pass / Badge Cards</CardTitle>
                    </div>

                    <div className="no-print flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handlePrintBadges}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print All
                      </Button>

                      <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Alert className="mb-6 border-green-600 bg-green-50 dark:bg-green-950/50">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription>
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        Badge IDs generated - Ready for entry
                      </p>
                      <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                        Workers can use these badges for site access during the permitted period.
                      </p>
                    </AlertDescription>
                  </Alert>

                  <div ref={badgeCardsRef} className="grid gap-6 md:grid-cols-2">
                    {ptw.worker_list.map((worker: any, index: number) => (
                      <BadgeCard
                        key={index}
                        worker={worker}
                        ptwId={ptw.id}
                        mocId={ptw.moc_id || 'N/A'}
                        location={ptw.location || 'Site Location'}
                        validityStart={new Date(ptw.start_datetime)}
                        validityEnd={new Date(ptw.end_datetime)}
                        contractorCompany={contractor?.name || 'Contractor'}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSaving || isSubmitting}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>

                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={isSaving || isSubmitting}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Submitting...' : 'Save & Submit'}
                </Button>

                <Button
                  className="w-full"
                  variant="destructive"
                  onClick={handleClearDraft}
                  disabled={isClearingDraft}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isClearingDraft ? 'Clearing...' : 'Clear Draft'}
                </Button>

                <Button className="w-full" variant="ghost" asChild>
                  <Link href={`/permits/${ptw.id}`}>Cancel</Link>
                </Button>
              </CardContent>
            </Card>

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
                  <Badge variant={requiresFacilitiesReview ? 'outline' : 'secondary'}>
                    {requiresFacilitiesReview ? 'Required' : 'Not Required'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">EFS Review</span>
                  <Badge variant={requiresEfsReview ? 'outline' : 'secondary'}>
                    {requiresEfsReview ? 'Required' : 'Not Required'}
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
                    { status: 'PENDING_SECURITY_REVIEW', label: 'Security Review' },
                    { status: 'PENDING_FACILITIES_REVIEW', label: 'Facilities Review' },
                    { status: 'PENDING_EFS_REVIEW', label: 'EFS Review' },
                    { status: 'PENDING_HSE_APPROVAL', label: 'HSE Final Review' },
                    { status: 'READY_FOR_ENTRY', label: 'Ready for Entry' },
                    { status: 'ACTIVE', label: 'Active Work' },
                    { status: 'WORK_COMPLETED', label: 'Work Completed' },
                    { status: 'CLOSED', label: 'Closed' },
                  ].map((step, _index, arr) => {
                    const statuses = arr.map((item) => item.status);
                    const currentIndex = statuses.indexOf(ptw.status);
                    const stepIndex = statuses.indexOf(step.status);

                    if (
                      step.status === 'PENDING_FACILITIES_REVIEW' &&
                      !requiresFacilitiesReview
                    ) {
                      return null;
                    }

                    if (
                      step.status === 'PENDING_EFS_REVIEW' &&
                      !requiresEfsReview
                    ) {
                      return null;
                    }

                    const isPast = currentIndex > -1 && stepIndex < currentIndex;
                    const isCurrent = step.status === ptw.status;

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
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Draft save allows partial data.</p>
                <p>Submit will validate all required fields.</p>
                <p>Complete permit details, supporting form, and worker information before submission.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}