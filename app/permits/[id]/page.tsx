'use client';

import { use, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWorkflow, useWorkflowActions } from '@/lib/use-workflow';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Pencil,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { BadgeCard } from '@/components/badge-card';
import { toast } from 'sonner';
import { PERMIT_FORMS } from '@/components/permits/forms';

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

export default function PermitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const badgeCardsRef = useRef<HTMLDivElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClearingDraft, setIsClearingDraft] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  const { ptws = [], mocs = [], contractors = [], currentUser } = useWorkflow();
  const workflowActions = useWorkflowActions();

  const ptw = ptws.find((p) => p.id === resolvedParams.id);
  const moc = mocs.find((m) => m.id === ptw?.moc_id);
  const contractor = contractors.find((c) => c.id === ptw?.contractor_id);

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

  const canManageDraft =
    currentUser?.role === 'contractor_admin' && ptw?.status === 'DRAFT';

  const canResubmit =
    currentUser?.role === 'contractor_admin' && ptw?.status === 'SENT_BACK';

  const canMarkWorkComplete =
    currentUser?.role === 'contractor_admin' && ptw?.status === 'ACTIVE';

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

  const handleMarkWorkComplete = async () => {
    if (!ptw) return;

    if (ptw.status !== 'ACTIVE') {
      toast.error('Can only mark ACTIVE PTWs as completed');
      return;
    }

    try {
      setIsMarkingComplete(true);
      await workflowActions.markWorkCompleted(ptw.id);
      toast.success('Work marked as completed. Notifications sent to reviewers.');
      router.refresh();
    } catch (error) {
      console.error('Mark work complete failed:', error);
      toast.error('Failed to mark work as completed');
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const handleSubmitPermit = async () => {
    if (!ptw) return;

    try {
      setIsSubmitting(true);

      const res = await workflowActions.submitPTW(ptw.id);
      if (!res.success) {
        toast.error(res.error || 'Submit failed');
        return;
      }

      toast.success('Permit submitted to Security Review');
      router.refresh();
    } catch (error) {
      console.error('Submit permit failed:', error);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1">
            <h1 className="text-3xl font-semibold">{ptw.title || 'Untitled Permit'}</h1>
            <p className="text-sm text-muted-foreground">{ptw.id}</p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {canManageDraft && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/permits/${ptw.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Draft
                  </Link>
                </Button>

                <Button
                  variant="destructive"
                  onClick={handleClearDraft}
                  disabled={isClearingDraft}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isClearingDraft ? 'Clearing...' : 'Clear Draft'}
                </Button>

                <Button onClick={handleSubmitPermit} disabled={isSubmitting}>
                  <FileText className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit Permit'}
                </Button>
              </>
            )}

            {canResubmit && (
              <Button asChild>
                <Link href={`/permits/${ptw.id}/resubmit`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Resubmit Permit
                </Link>
              </Button>
            )}

            {canMarkWorkComplete && (
              <Button onClick={handleMarkWorkComplete} disabled={isMarkingComplete}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {isMarkingComplete ? 'Updating...' : 'Mark Work Complete'}
              </Button>
            )}

            <Badge
              variant={statusColors[ptw.status] ?? 'secondary'}
              className="text-sm"
            >
              {ptw.status.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
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
            <Card>
              <CardHeader>
                <CardTitle>Permit Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Permit Type</p>
                    <p className="mt-1">{ptw.permit_type?.replace(/_/g, ' ') || '-'}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Revision</p>
                    <p className="mt-1">Rev {ptw.revision_number ?? 0}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <div className="mt-1 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p>{ptw.location || '-'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contractor</p>
                    <p className="mt-1">{contractor?.companyName  || 'Unknown'}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Start Date & Time</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p>{formatDateTime(ptw.start_datetime)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">End Date & Time</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <p>{formatDateTime(ptw.end_datetime)}</p>
                    </div>
                  </div>
                </div>

                {ptw.submission_date && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Submitted On</p>
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
                  {(() => {
                    const FormComponent = PERMIT_FORMS[ptw.permit_type];
                    if (!FormComponent) {
                      return (
                        <p className="text-sm text-muted-foreground">
                          Form not available
                        </p>
                      );
                    }

                    return (
                      <FormComponent
                        data={ptw.supporting_permit.data}
                        onChange={() => {}}
                        readOnly={true}
                      />
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <CardTitle>Worker List</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {(ptw.worker_list ?? []).length > 0 ? (
                  <div className="space-y-2">
                    {(ptw.worker_list ?? []).map((worker, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">{worker.name || '-'}</p>
                          <p className="text-sm text-muted-foreground">
                            {worker.role || 'Worker'}
                          </p>

                          {(worker.badge_id || worker.badgeId) && (
                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                              Badge: {worker.badge_id || worker.badgeId}
                            </p>
                          )}
                        </div>

                        <Badge variant="outline">{worker.badge || '-'}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No workers listed</p>
                )}
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
                        contractorCompany={contractor?.companyName  || 'Contractor'}
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
                  ].map((step, index, arr) => {
                    const statuses = arr.map((item) => item.status);
                    const currentIndex = statuses.indexOf(ptw.status);
                    const stepIndex = statuses.indexOf(step.status);

                    if (
                      step.status === 'PENDING_FACILITIES_REVIEW' &&
                      !ptw.requires_facilities_review
                    ) {
                      return null;
                    }

                    if (
                      step.status === 'PENDING_EFS_REVIEW' &&
                      !ptw.requires_efs_review
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}