'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { getRecord, updateRecord, listRecords } from '@/src/demo/storage';
import type { MOCRecord } from '@/src/types/moc';
import { useWorkflow } from '@/lib/use-workflow';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Download,
  Printer,
  Building2,
  XCircle,
  Edit3,
} from 'lucide-react';
import { workflowStore } from '@/lib/workflow-store';
import { supabase } from '@/lib/supabase-client';

export default function MOCDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {ptws = [], currentUser } = useWorkflow();
  const [moc, setMoc] = useState<MOCRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSignature, setUserSignature] = useState<string | null>(null);
  const [contractorCompanyName, setContractorCompanyName] = useState('');
  const ptwExistsForMoc = ptws.some((p) => p.moc_id === moc?.id);

  // Dialog states
  const [showFacilitiesApprovalDialog, setShowFacilitiesApprovalDialog] = useState(false);
  const [showChangesRequestDialog, setShowChangesRequestDialog] = useState(false);
  const [showStakeholderApprovalDialog, setShowStakeholderApprovalDialog] = useState(false);
  const [showHSEApprovalDialog, setShowHSEApprovalDialog] = useState(false);
  const [changesNotes, setChangesNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const showSubmittedBanner = searchParams.get('submitted') === '1';
  const showGateSubmittedBanner = searchParams.get('submittedGate') === '1';

  useEffect(() => {
    async function loadUserSignature() {
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('user_signatures')
        .select('signature_url')
        .eq('user_id', currentUser.id)
        .single();

      if (error) {
        console.log('No signature found');
        return;
      }

      if (data?.signature_url) {
        setUserSignature(data.signature_url);
      }
    }

    loadUserSignature();
  }, [currentUser]);

  useEffect(() => {
    async function loadMoc() {
      try {
        const id = params.id as string;
        const data = await workflowStore.getMOCById(id);

        console.log('MOC DATA:', data);
        console.log('ACKNOWLEDGED BY:', data?.contractorGate?.acknowledgedBy);

        setMoc(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadMoc();
  }, [params.id]);

  // Refresh MOC data
  const refreshMoc = async () => {
    const updated = await workflowStore.getMOCById(params.id as string);
    setMoc(updated);
  };


  useEffect(() => {
  async function loadContractorCompany() {
    if (!moc?.contractorCompany) return;

    const { data, error } = await supabase
      .from('contractors')
      .select('companyName')
      .eq('id', moc.contractorCompany)
      .single();

    console.log('contractorCompany id:', moc.contractorCompany);
    console.log('contractor row:', data);
    console.log('contractor error:', error);

    if (error) return;

    setContractorCompanyName(data?.companyName || '');
  }

  loadContractorCompany();
}, [moc?.contractorCompany]);

  // Facilities Approve
  const handleFacilitiesApprove = async () => {
    if (!moc || !userSignature || !currentUser) return;

    setSubmitting(true);

    try {
      const hasStakeholders =
        Array.isArray(moc.stakeholders) && moc.stakeholders.length > 0;

      const nextStatus = hasStakeholders
        ? 'PENDING_STAKEHOLDER_APPROVAL'
        : 'PENDING_HSE_APPROVAL';

      const approval = {
        status: 'APPROVED',
        signedAt: new Date().toISOString(),
        signedBy: currentUser.name,
        signature: userSignature,
        changesRequested: null,
      };

      const { error } = await supabase
        .from('mocs')
        .update({
          facilities_approval: approval,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', moc.id);

      if (error) throw error;

      const updated = await workflowStore.getMOCById(moc.id);
      setMoc(updated);
      setShowFacilitiesApprovalDialog(false);
    } catch (err) {
      console.error('Facilities approval error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Facilities Request Changes
  const handleFacilitiesRequestChanges = async () => {
    if (!moc || !changesNotes.trim()) return;

    setSubmitting(true);

    try {
      const approval = {
        status: 'CHANGES_REQUESTED',
        signedAt: new Date().toISOString(),
        signedBy: currentUser?.name,
        changesRequested: changesNotes,
      };

      // Save approval info
      await supabase
        .from('mocs')
        .update({
          facilities_approval: approval,
          updated_at: new Date().toISOString(),
        })
        .eq('id', moc.id);

      // Workflow status change
      await supabase.rpc('update_moc_workflow', {
        p_moc_id: moc.id,
        p_action: 'FACILITY_REQUEST_CHANGES',
      });

      await refreshMoc();

      setShowChangesRequestDialog(false);
      setChangesNotes('');
    } catch (error) {
      console.error('Request changes failed', error);
    }

    setSubmitting(false);
  };

  // Stakeholder Approve
const handleStakeholderApprove = async () => {
  if (!moc || !userSignature || !currentUser) return;

  setSubmitting(true);

  try {
    const now = new Date().toISOString();

    const approvalPayload = {
      moc_id: moc.id,
      stakeholder_role: currentUser.role,
      status: 'APPROVED',
      remarks: null,
      approved_by: currentUser.id,
      approved_at: now,
      signature: userSignature,
      signed_at: now,
      signed_by: currentUser.name,
    };

    const { data: approvalData, error: approvalError } = await supabase
      .from('moc_stakeholder_approvals')
      .insert([approvalPayload])
      .select();

    console.log('STAKEHOLDER INSERT:', approvalData);
    console.log('STAKEHOLDER INSERT ERROR:', approvalError);

    if (approvalError) throw approvalError;

    const updatedStakeholders = (moc.stakeholders || []).map((s: any) => {
      const matchesCurrentUser =
        s.email === currentUser.email ||
        s.name === currentUser.name ||
        s.stakeholder_id === currentUser.id;

      if (!matchesCurrentUser) return s;

      return {
        ...s,
        status: 'APPROVED',
        remarks: null,
        approved_at: now,
        approved_by: currentUser.name,
        stakeholder_id: currentUser.id,
        signature: userSignature,
      };
    });

    const { data: mocUpdateData, error: mocUpdateError } = await supabase
      .from('mocs')
      .update({
        stakeholders: updatedStakeholders,
         status: 'PENDING_HSE_FINAL',
        updated_at: now,
      })
      .eq('id', moc.id)
      .select();

    console.log('MOC STAKEHOLDERS UPDATE:', mocUpdateData);
    console.log('MOC STAKEHOLDERS UPDATE ERROR:', mocUpdateError);

    if (mocUpdateError) throw mocUpdateError;

    const { error: workflowError } = await supabase.rpc('update_moc_workflow', {
      p_moc_id: moc.id,
      p_action: 'STAKEHOLDER_APPROVE',
    });

    console.log('STAKEHOLDER WORKFLOW ERROR:', workflowError);

    if (workflowError) throw workflowError;

    const updated = await workflowStore.getMOCById(moc.id);
    setMoc(updated);
    setShowStakeholderApprovalDialog(false);
  } catch (err) {
    console.error('Stakeholder approval error:', err);
  } finally {
    setSubmitting(false);
  }
};

  // HSE Final Approve
  const handleHSEFinalApprove = async () => {
    if (!moc || !userSignature || !currentUser) return;

    setSubmitting(true);

    try {
      const approval = {
        signature: userSignature,
        signedAt: new Date().toISOString(),
        signedBy: currentUser.name,
      };

      // Save HSE final approval
      const { error: approvalError } = await supabase
        .from('mocs')
        .update({
          hseApproval: approval,
          updated_at: new Date().toISOString(),
        })
        .eq('id', moc.id);

      if (approvalError) throw approvalError;

      // Update MOC status to approved
      const { error: statusError } = await supabase
        .from('mocs')
        .update({
          status: 'APPROVED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', moc.id);

      if (statusError) throw statusError;

      const updated = await workflowStore.getMOCById(moc.id);
      setMoc(updated);
      setShowHSEApprovalDialog(false);
    } catch (err) {
      console.error('HSE final approval error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading MOC details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!moc) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>MOC Not Found</CardTitle>
              <CardDescription>
                The Management of Change record you're looking for doesn't exist.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/moc')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to MOC List
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const isSubmitted = moc.status === 'SUBMITTED';
  const isStakeholderSigned = moc.status === 'STAKEHOLDER_SIGNED';
  const isContractorSubmitted = moc.status === 'CONTRACTOR_SUBMITTED';
  const isFacilitiesApproved =
    moc.status === 'FACILITIES_APPROVED' ||
    moc.status === 'PENDING_STAKEHOLDER_APPROVAL' ||
    moc.status === 'PENDING_HSE_APPROVAL' ||
    moc.status === 'PENDING_HSE_FINAL' ||
    moc.status === 'APPROVED';
  const isFacilitiesChangesRequested = moc.status === 'FACILITIES_CHANGES_REQUESTED';
  const isPendingStakeholderApproval = moc.status === 'PENDING_STAKEHOLDER_APPROVAL';
const isPendingHSEApproval = moc.status === 'PENDING_HSE_APPROVAL' || moc.status === 'PENDING_HSE_FINAL';
  const isStakeholderApproved =
    !!moc.stakeholderApproval ||
    moc.status === 'STAKEHOLDER_APPROVED' ||
    moc.status === 'PENDING_HSE_APPROVAL' ||
    moc.status === 'PENDING_HSE_FINAL' ||
    moc.status === 'APPROVED';
  const isApproved = moc.status === 'APPROVED';
  const isRejected = moc.status === 'REJECTED';

  const isContractorAdmin = currentUser?.role === 'contractor_admin';
  const isFacilities = currentUser?.role === 'facilities';
  const isStakeholder = currentUser?.role === 'stakeholder';
  const isHSEManager = currentUser?.role === 'hse_manager';

  // Determine which actions are available
  const canContractorAcknowledge =
    isContractorAdmin &&
    (isSubmitted || isStakeholderSigned) &&
    !moc.contractorGate?.acknowledged;

  const canContractorResubmit =
    isContractorAdmin &&
    isFacilitiesChangesRequested;

  const canFacilitiesReview =
    isFacilities &&
    (isContractorSubmitted || isFacilitiesChangesRequested);

  const canStakeholderApprove =
    isStakeholder &&
    isFacilitiesApproved &&
    isPendingStakeholderApproval &&
    moc.requiresStakeholderApproval &&
    !moc.stakeholderApproval;

  const canHSEFinalApprove =
    isHSEManager &&
    isPendingHSEApproval &&
    !moc.hseApproval;

  const getStatusColor = () => {
    if (isApproved) return 'default';
    if (isRejected || isFacilitiesChangesRequested) return 'destructive';
    if (isFacilitiesApproved || isStakeholderApproved) return 'default';
    return 'secondary';
  };

  const getStatusIcon = () => {
    if (isApproved) return <CheckCircle className="h-4 w-4" />;
    if (isRejected || isFacilitiesChangesRequested) return <XCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const approvedStakeholder = Array.isArray(moc.stakeholders)
  ? moc.stakeholders.find((s: any) => s.status === 'APPROVED')
  : null;

  console.log('DETAIL PAGE STATUS:', moc?.status);
console.log('DETAIL PAGE ROLE:', currentUser?.role);
console.log('SHOW CREATE PTW:', moc?.status === 'APPROVED' && currentUser?.role === 'contractor_admin');

console.log('contractorGate:', moc?.contractorGate);
console.log('contractor signature:', moc?.contractorGate?.signature);
  

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold">{moc.title}</h1>
              <Badge variant={getStatusColor()} className="flex items-center gap-1">
                {getStatusIcon()}
                {moc.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-muted-foreground">MOC ID - {moc.id}</p>
            <p className="text-sm text-muted-foreground">
              Created by {moc.createdBy || moc.createdByRole} on {new Date(moc.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-3">

            {isApproved && isContractorAdmin && !ptwExistsForMoc && (
              <Button onClick={() => router.push(`/permits/new?mocId=${moc.id}`)}>
                <FileText className="mr-2 h-4 w-4" />
                Create PTW
                </Button>
              )}

            <Button variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Success Banners */}
        {showSubmittedBanner && (
          <Alert className="border-green-600 bg-green-50 dark:bg-green-950/50 dark:border-green-700">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
            <AlertDescription>
              <p className="font-semibold text-green-900 dark:text-green-100">
                MOC submitted successfully.
              </p>
              <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                Your MOC has been submitted for review.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {showGateSubmittedBanner && (
          <Alert className="border-green-600 bg-green-50 dark:bg-green-950/50 dark:border-green-700">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
            <AlertDescription>
              <p className="font-semibold text-green-900 dark:text-green-100">
                MOC Pack submitted successfully!
              </p>
              <p className="mt-1 text-sm text-green-800 dark:text-green-200">
                Your acknowledgement and MOC pack documents have been submitted. Awaiting Facilities review.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Contractor Action Required */}
        {(canContractorAcknowledge || canContractorResubmit) && (
          <Alert className="border-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-700">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            <AlertDescription>
              <p className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                Action Required: {canContractorResubmit ? 'Update & Re-submit MOC Pack' : 'Acknowledge MOC & Submit MOC Pack'}
              </p>
              {isFacilitiesChangesRequested && moc.facilities_approval?.changesRequested && (
                <div className="mt-2 rounded border bg-white p-3 dark:bg-gray-800">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Changes Requested:
                  </p>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                    {moc.facilities_approval.changesRequested}
                  </p>
                  <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                    Requested by {moc.facilities_approval.signedBy} on{' '}
                    {moc.facilities_approval.signedAt &&
                      new Date(moc.facilities_approval.signedAt).toLocaleString()}
                  </p>
                </div>
              )}
              <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                Before PTWs can be created for this MOC, you must acknowledge and submit required documents.
              </p>
              <div className="mt-3">
                <Button asChild size="sm" className="bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-700">
                  <Link href={`/moc/${moc.id}/contractor-gate`}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {canContractorResubmit ? 'Update & Re-submit MOC Pack' : 'Acknowledge MOC & Submit MOC Pack'}
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Facilities Review Action */}
        {canFacilitiesReview && (
          <Alert className="border-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-700">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            <AlertDescription>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Action Required: Review MOC Pack
              </p>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                Contractor has submitted the MOC pack. Review the documents and supervisor details below.
              </p>
              <div className="mt-3 flex gap-2">
                {userSignature ? (
                  <Button size="sm" onClick={() => setShowFacilitiesApprovalDialog(true)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve (Sign)
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/profile/settings">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Add Signature First
                    </Link>
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setShowChangesRequestDialog(true)}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Request Changes
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stakeholder Approval Action */}
        {canStakeholderApprove && (
          <Alert className="border-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-700">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            <AlertDescription>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Action Required: Stakeholder Sign-off
              </p>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                Facilities has approved the MOC pack. Your sign-off is required to proceed.
              </p>
              <div className="mt-3">
                {userSignature ? (
                  <Button size="sm" onClick={() => setShowStakeholderApprovalDialog(true)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Sign Off
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/profile/settings">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Add Signature First
                    </Link>
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* HSE Final Approval Action */}
        {canHSEFinalApprove && (
          <Alert className="border-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-700">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            <AlertDescription>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Action Required: Final HSE Approval
              </p>
              <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                All required approvals have been completed. Provide final HSE sign-off to activate this MOC.
              </p>
              <div className="mt-3">
                {userSignature ? (
                  <Button size="sm" onClick={() => setShowHSEApprovalDialog(true)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Final Approve MOC (Sign)
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/profile/settings">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Add Signature First
                    </Link>
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Info waiting messages for non-actor roles */}
        {!canContractorAcknowledge && !canFacilitiesReview && !canStakeholderApprove && !canHSEFinalApprove && (
          <>
            {(isSubmitted || isStakeholderSigned) && !moc.contractorGate?.acknowledged && (
              <Alert className="border-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-700">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                <AlertDescription>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Awaiting contractor acknowledgement + MOC pack submission
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {isContractorSubmitted && isFacilities && (
              <Alert className="border-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-700">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                <AlertDescription>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Awaiting Facilities review
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {isPendingStakeholderApproval && moc.requiresStakeholderApproval && !isStakeholder && (
              <Alert className="border-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-700">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                <AlertDescription>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Awaiting stakeholder sign-off
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {isPendingHSEApproval && !isHSEManager && (
              <Alert className="border-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:border-blue-700">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                <AlertDescription>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    Awaiting final HSE approval
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* MOC Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{moc.description}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reason for Change</p>
                <p className="text-sm">{moc.reasonForChange}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Risk Summary</p>
                <p className="text-sm">{moc.riskSummary}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location & Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Area</p>
                  <p className="text-sm text-muted-foreground">{moc.area}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Exact Location</p>
                  <p className="text-sm text-muted-foreground">{moc.exactLocation}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Timeline</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(moc.start_date).toLocaleDateString()} - {new Date(moc.expiry_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Contractor Company</p>
                  <p className="text-sm text-muted-foreground">{contractorCompanyName || 'Not available'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contractor Gate Status */}
        {moc.contractorGate?.acknowledged && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle>Contractor Acknowledgement</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  MOC Acknowledged & Pack Submitted
                </p>
                <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                  Acknowledged by {moc.contractorGate.acknowledgedBy} on{' '}
                  {moc.contractorGate.submittedAt && new Date(moc.contractorGate.submittedAt).toLocaleString()}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Project Supervisor</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{moc.contractorGate.supervisorName}</p>
                    <p className="text-muted-foreground">{moc.contractorGate.supervisorPhone}</p>
                    <p className="text-muted-foreground">{moc.contractorGate.supervisorEmail}</p>
                    <p className="text-xs text-muted-foreground">ID: {moc.contractorGate.supervisorIdPassport}</p>
                  </div>
                </div>

                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Submitted Documents</h4>
                  <div className="space-y-1 text-sm">
                    {moc.contractorGate.documents?.companyCertificates && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Company Certificate :
                        <a
                          href={moc.contractorGate.documents.companyCertificates}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 underline hover:text-blue-800"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                    {moc.contractorGate.documents?.methodStatement && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Methord Statement :
                        <a
                          href={moc.contractorGate.documents.methodStatement}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 underline hover:text-blue-800"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                    {moc.contractorGate.documents?.riskAssessment && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Risk Assessment :
                        <a
                          href={moc.contractorGate.documents.riskAssessment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 underline hover:text-blue-800"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                    {moc.contractorGate.documents?.projectPlan && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        project Plan :
                        <a
                          href={moc.contractorGate.documents.projectPlan}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 underline hover:text-blue-800"
                        >
                          View Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {moc.contractorGate.signature && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Contractor Signature</h4>
                  <img src={moc.contractorGate.signature || '/placeholder.svg'} alt="Contractor Signature" className="h-16 border-b border-foreground/20" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Facilities Approval Status */}
        {moc.facilities_approval && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                {moc.facilities_approval.status === 'APPROVED' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <CardTitle>Facilities Review</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {moc.facilities_approval.status === 'APPROVED' ? (
                <>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      Approved by Facilities
                    </p>
                    <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                      Signed by {moc.facilities_approval.signedBy} on{' '}
                      {moc.facilities_approval.signedAt && new Date(moc.facilities_approval.signedAt).toLocaleString()}
                    </p>
                  </div>
                  {moc.facilities_approval.signature && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Facilities Signature</h4>
                      <img src={moc.facilities_approval.signature || '/placeholder.svg'} alt="Facilities Signature" className="h-16 border-b border-foreground/20" />
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/20">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Changes Requested
                  </p>
                  <p className="mt-1 text-xs text-red-700 dark:text-red-300">
                    By {moc.facilities_approval.signedBy} on{' '}
                    {moc.facilities_approval.signedAt && new Date(moc.facilities_approval.signedAt).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-red-800 dark:text-red-200">
                    {moc.facilities_approval.changesRequested}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stakeholder Approval Status */}
{approvedStakeholder && (
  <Card>
    <CardHeader>
      <div className="flex items-center gap-2">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <CardTitle>Stakeholder Sign-off</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
        <p className="text-sm font-medium text-green-900 dark:text-green-100">
          Approved by Stakeholder
        </p>
        <p className="mt-1 text-xs text-green-700 dark:text-green-300">
          Signed by {approvedStakeholder.approved_by} on{' '}
          {approvedStakeholder.approved_at &&
            new Date(approvedStakeholder.approved_at).toLocaleString()}
        </p>
      </div>

      {approvedStakeholder.signature && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
            Stakeholder Signature
          </h4>
          <img
            src={approvedStakeholder.signature || '/placeholder.svg'}
            alt="Stakeholder Signature"
            className="h-16 border-b border-foreground/20"
          />
        </div>
      )}
    </CardContent>
  </Card>
)}

        {/* HSE Final Approval Status */}
        {moc.hseApproval && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle>HSE Final Approval</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  MOC Approved - Ready for Implementation
                </p>
                <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                  Final approval by {moc.hseApproval.signedBy} on{' '}
                  {moc.hseApproval.signedAt && new Date(moc.hseApproval.signedAt).toLocaleString()}
                </p>
              </div>
              {moc.hseApproval.signature && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">HSE Manager Signature</h4>
                  <img src={moc.hseApproval.signature || '/placeholder.svg'} alt="HSE Signature" className="h-16 border-b border-foreground/20" />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/moc')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to MOC List
          </Button>

        </div>
      </div>

      {/* Facilities Approval Dialog */}
      <Dialog open={showFacilitiesApprovalDialog} onOpenChange={setShowFacilitiesApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve MOC Pack</DialogTitle>
            <DialogDescription>
              Confirm that you have reviewed all contractor documents and approve this MOC to proceed.
            </DialogDescription>
          </DialogHeader>
          {userSignature && (
            <div className="space-y-2">
              <Label>Your Signature</Label>
              <img src={userSignature || '/placeholder.svg'} alt="Your Signature" className="h-16 border-b border-foreground/20" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFacilitiesApprovalDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleFacilitiesApprove} disabled={submitting}>
              {submitting ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Facilities Changes Request Dialog */}
      <Dialog open={showChangesRequestDialog} onOpenChange={setShowChangesRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Describe what changes are needed from the contractor before approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="changes">Changes Required *</Label>
            <Textarea
              id="changes"
              placeholder="Please provide detailed information about what needs to be corrected or updated..."
              value={changesNotes}
              onChange={(e) => setChangesNotes(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangesRequestDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleFacilitiesRequestChanges} disabled={submitting || !changesNotes.trim()}>
              {submitting ? 'Sending...' : 'Request Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stakeholder Approval Dialog */}
      <Dialog open={showStakeholderApprovalDialog} onOpenChange={setShowStakeholderApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stakeholder Sign-off</DialogTitle>
            <DialogDescription>
              Confirm that you approve this Management of Change as the stakeholder.
            </DialogDescription>
          </DialogHeader>
          {userSignature && (
            <div className="space-y-2">
              <Label>Your Signature</Label>
              <img src={userSignature || '/placeholder.svg'} alt="Your Signature" className="h-16 border-b border-foreground/20" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStakeholderApprovalDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleStakeholderApprove} disabled={submitting}>
              {submitting ? 'Signing...' : 'Sign Off'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HSE Final Approval Dialog */}
      <Dialog open={showHSEApprovalDialog} onOpenChange={setShowHSEApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Final HSE Approval</DialogTitle>
            <DialogDescription>
              Provide final approval to activate this MOC. Contractors will be able to create PTWs after your approval.
            </DialogDescription>
          </DialogHeader>
          {userSignature && (
            <div className="space-y-2">
              <Label>Your Signature</Label>
              <img src={userSignature || '/placeholder.svg'} alt="Your Signature" className="h-16 border-b border-foreground/20" />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHSEApprovalDialog(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleHSEFinalApprove} disabled={submitting}>
              {submitting ? 'Approving...' : 'Final Approve MOC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}