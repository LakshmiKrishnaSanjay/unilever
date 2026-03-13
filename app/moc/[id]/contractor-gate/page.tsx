'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import type { MOCRecord } from '@/src/types/moc';
import { useWorkflow } from '@/lib/use-workflow';
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { workflowStore } from '@/lib/workflow-store';

type MocPackDocument = {
  id?: string;
  moc_gate_id?: string;
  type: string;
  file_name?: string | null;
  uploaded_at?: string | null;
  status?: string | null;
};

type MocGateRow = {
  id: string;
  acknowledged?: boolean;
  acknowledged_at?: string | null;
  acknowledged_by?: string | null;
  contractor_id?: string | null;
  moc_pack_status?: string | null;
  supervisor_name?: string | null;
  supervisor_phone?: string | null;
  supervisor_email?: string | null;
  supervisor_id?: string | null;
  moc_pack_documents?: MocPackDocument[];
};

type MOCWithGate = MOCRecord & {
  moc_gates?: MocGateRow[];
  facilities_approval?: {
    status?: string;
    signedAt?: string;
    signedBy?: string;
    changesRequested?: string;
    signature?: string;
  } | null;
  facilitiesApproval?: {
    status?: string;
    signedAt?: string;
    signedBy?: string;
    changesRequested?: string;
    signature?: string;
  } | null;
};

export default function ContractorGatePage() {
  const router = useRouter();
  const params = useParams();
  const { currentUser } = useWorkflow();
  const mocId = params.id as string;

  const [moc, setMoc] = useState<MOCWithGate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [acknowledged, setAcknowledged] = useState(false);
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorPhone, setSupervisorPhone] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [supervisorId, setSupervisorId] = useState('');

  const [certFile, setCertFile] = useState('');
  const [mosFile, setMosFile] = useState('');
  const [raFile, setRaFile] = useState('');
  const [planFile, setPlanFile] = useState('');

  const [userSignature, setUserSignature] = useState<string | null>(null);

useEffect(() => {
  async function loadMoc() {
    try {
      const data = await workflowStore.getMOCById(mocId);

      if (!data) {
        setError('MOC not found');
        return;
      }

      setMoc(data);

      const existingGate = data.contractorGate;

      if (existingGate) {
        setAcknowledged(!!existingGate.acknowledged);
        setSupervisorName(existingGate.supervisorName || '');
        setSupervisorPhone(existingGate.supervisorPhone || '');
        setSupervisorEmail(existingGate.supervisorEmail || '');
        setSupervisorId(existingGate.supervisorIdPassport || '');

        setCertFile(existingGate.documents?.companyCertificates || '');
        setMosFile(existingGate.documents?.methodStatement || '');
        setRaFile(existingGate.documents?.riskAssessment || '');
        setPlanFile(existingGate.documents?.projectPlan || '');
      }
    } catch (err) {
      console.error(err);
      setError('MOC not found');
    } finally {
      setLoading(false);
    }
  }

  loadMoc();
}, [mocId]);
  useEffect(() => {
    async function loadSignature() {
      if (!currentUser) return;

      const { data } = await supabase
        .from('user_signatures')
        .select('signature_url')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (data?.signature_url) {
        setUserSignature(data.signature_url);
      }
    }

    loadSignature();
  }, [currentUser]);

  const handleSystemFileUpload = async (
    setter: (url: string) => void,
    label: string
  ) => {
    try {
      return new Promise<void>((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';

        input.onchange = async (e: any) => {
          try {
            const file = e.target.files[0];
            if (!file) return reject('No file selected');

            const fileExt = file.name.split('.').pop();
            const fileName = `${label}_${Date.now()}.${fileExt}`;

            const { error } = await supabase.storage
              .from('moc-documents')
              .upload(fileName, file);

            if (error) throw error;

            const { data } = supabase.storage
              .from('moc-documents')
              .getPublicUrl(fileName);

            setter(data.publicUrl);
            resolve();
          } catch (err) {
            reject(err);
          }
        };

        input.click();
      });
    } catch (err: any) {
      console.error('Upload Error:', err?.message);
      setError('File upload failed');
    }
  };

  const handleSubmit = async () => {
    if (!acknowledged) {
      setError('You must acknowledge the MOC before submitting');
      return;
    }

    if (!supervisorName || !supervisorPhone || !supervisorEmail || !supervisorId) {
      setError('All supervisor details are required');
      return;
    }

    if (!certFile || !mosFile || !raFile || !planFile) {
      setError('All required documents must be uploaded');
      return;
    }

    if (!userSignature) {
      setError('Signature not found. Please add your signature in Profile Settings.');
      return;
    }

    if (!moc || !currentUser) return;

    setSubmitting(true);
    setError('');

    try {
      let gateId: string;

      if (moc.contractorGate?.id) {
        gateId = moc.contractorGate.id;

        const { error: gateUpdateError } = await supabase
          .from('moc_gates')
          .update({
            acknowledged: true,
            acknowledged_at: new Date().toISOString(),
            acknowledged_by: currentUser.id,
            contractor_id: currentUser.id,
            moc_pack_status: 'SUBMITTED',
            supervisor_name: supervisorName,
            supervisor_phone: supervisorPhone,
            supervisor_email: supervisorEmail,
            supervisor_id: supervisorId,
          })
          .eq('id', gateId);

        if (gateUpdateError) throw gateUpdateError;
      } else {
        const { data: gate, error: gateError } = await supabase
          .from('moc_gates')
          .insert({
            moc_id: mocId,
            acknowledged: true,
            acknowledged_at: new Date().toISOString(),
            acknowledged_by: currentUser.id,
            contractor_id: currentUser.id,
            moc_pack_status: 'SUBMITTED',
            supervisor_name: supervisorName,
            supervisor_phone: supervisorPhone,
            supervisor_email: supervisorEmail,
            supervisor_id: supervisorId,
          })
          .select()
          .single();

        if (gateError || !gate) throw gateError;
        gateId = gate.id;
      }

      const documents = [
        { type: 'company_certificate', file_name: certFile },
        { type: 'method_statement', file_name: mosFile },
        { type: 'risk_assessment', file_name: raFile },
        { type: 'project_plan', file_name: planFile },
      ];

      await Promise.all(
        documents.map(async (doc) => {
          const { error: docError } = await supabase
            .from('moc_pack_documents')
            .upsert(
              {
                moc_gate_id: gateId,
                type: doc.type,
                file_name: doc.file_name,
                uploaded_at: new Date().toISOString(),
                status: 'SUBMITTED',
              },
              {
                onConflict: 'moc_gate_id,type',
              }
            );

          if (docError) throw docError;
        })
      );

      const { error: timelineError } = await supabase.from('moc_timeline').insert({
        moc_id: mocId,
        user_id: currentUser.id,
        action: 'MOC Pack submitted by Contractor',
        status: 'CONTRACTOR_SUBMITTED',
        remarks: 'Supervisor and documents submitted',
      });

      if (timelineError) throw timelineError;

      const { error: mocUpdateError } = await supabase
        .from('mocs')
        .update({
          status: 'CONTRACTOR_SUBMITTED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', mocId);

      if (mocUpdateError) throw mocUpdateError;

      // create supervisor approval request for admin
await supabase.from('supervisor_requests').insert({
  moc_id: mocId,
  contractor_id: currentUser.id,
  name: supervisorName,
  id_passport: supervisorId,
  phone: supervisorPhone,
  email: supervisorEmail,
  role: 'contractor_supervisor',
  status: 'pending'
});

      router.push(`/moc/${mocId}?submittedGate=1`);
    } catch (err) {
      console.error(err);
      setError('Failed to submit. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p>Loading...</p>
      </div>
    );
  }

  if (error && !moc) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!moc) return null;

  const isResubmit = moc.status === 'FACILITIES_CHANGES_REQUESTED';

  const facilitiesChangeReason =
    moc.facilities_approval?.changesRequested ||
    moc.facilitiesApproval?.changesRequested ||
    '';

  const facilitiesChangeBy =
    moc.facilities_approval?.signedBy ||
    moc.facilitiesApproval?.signedBy ||
    '';

  const facilitiesChangeAt =
    moc.facilities_approval?.signedAt ||
    moc.facilitiesApproval?.signedAt ||
    '';

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isResubmit ? 'Update & Re-submit MOC Pack' : 'Acknowledge MOC & Submit MOC Pack'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {moc.id} - {moc.title}
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href={`/moc/${mocId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to MOC
          </Link>
        </Button>
      </div>

      {isResubmit && facilitiesChangeReason && (
        <Alert className="border-amber-600 bg-amber-50 dark:bg-amber-950/50">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertDescription>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Changes Requested by Facilities
            </p>
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
              {facilitiesChangeReason}
            </p>
            {(facilitiesChangeBy || facilitiesChangeAt) && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                {facilitiesChangeBy ? `Requested by ${facilitiesChangeBy}` : ''}
                {facilitiesChangeBy && facilitiesChangeAt ? ' on ' : ''}
                {facilitiesChangeAt ? new Date(facilitiesChangeAt).toLocaleString() : ''}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!userSignature && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-semibold">Signature Required</p>
            <p className="mt-1 text-sm">
              You must add your signature in Profile Settings before you can submit this form.
            </p>
            <Button size="sm" variant="outline" className="mt-2 bg-transparent" asChild>
              <Link href="/profile/settings">Go to Profile Settings</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contractor Acknowledgement & MOC Pack Submission</CardTitle>
          <CardDescription>
            Complete all sections to acknowledge this MOC and submit the required documentation.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Acknowledgement</h3>
            <div className="flex items-start gap-3 rounded-lg border p-4">
              <Checkbox
                id="acknowledge"
                checked={acknowledged}
                onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="acknowledge" className="cursor-pointer text-base">
                  I acknowledge that I have reviewed and understood the MOC requirements
                </Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  By checking this box, you confirm that your team has reviewed the Management of
                  Change requirements and will comply with all safety protocols and procedures
                  outlined in this MOC.
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. Project Supervisor Details</h3>
            <p className="text-sm text-muted-foreground">
              Provide contact information for the on-site project supervisor who will be responsible
              for this work.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supervisorName">Full Name *</Label>
                <Input
                  id="supervisorName"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorId">ID / Passport Number *</Label>
                <Input
                  id="supervisorId"
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  placeholder="ID123456"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorPhone">Phone Number *</Label>
                <Input
                  id="supervisorPhone"
                  type="tel"
                  value={supervisorPhone}
                  onChange={(e) => setSupervisorPhone(e.target.value)}
                  placeholder="+1 555-0123"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorEmail">Email Address *</Label>
                <Input
                  id="supervisorEmail"
                  type="email"
                  value={supervisorEmail}
                  onChange={(e) => setSupervisorEmail(e.target.value)}
                  placeholder="supervisor@company.com"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">3. Required Documents</h3>
            <p className="text-sm text-muted-foreground">
              Upload all required MOC pack documents. All documents must be in PDF format.
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Company Certificates / Compliance Documents *</p>
                    {certFile && <p className="text-xs text-green-600 break-all">{certFile}</p>}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={certFile ? 'outline' : 'default'}
                  onClick={() => handleSystemFileUpload(setCertFile, 'Company_Certificates')}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {certFile ? 'Replace' : 'Upload'}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Method of Statement (MOS) *</p>
                    {mosFile && <p className="text-xs text-green-600 break-all">{mosFile}</p>}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={mosFile ? 'outline' : 'default'}
                  onClick={() => handleSystemFileUpload(setMosFile, 'Method_Statement')}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {mosFile ? 'Replace' : 'Upload'}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Risk Assessment (RA) *</p>
                    {raFile && <p className="text-xs text-green-600 break-all">{raFile}</p>}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={raFile ? 'outline' : 'default'}
                  onClick={() => handleSystemFileUpload(setRaFile, 'Risk_Assessment')}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {raFile ? 'Replace' : 'Upload'}
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Project Plan / Schedule *</p>
                    {planFile && <p className="text-xs text-green-600 break-all">{planFile}</p>}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={planFile ? 'outline' : 'default'}
                  onClick={() => handleSystemFileUpload(setPlanFile, 'Project_Plan')}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {planFile ? 'Replace' : 'Upload'}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {userSignature && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">4. Your Signature</h3>
              <div className="rounded-lg border bg-muted/30 p-4">
                <img
                  src={userSignature || '/placeholder.svg'}
                  alt="Signature"
                  className="h-24 border-b border-foreground/20"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  Your signature will be attached to this submission.
                </p>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" asChild disabled={submitting}>
              <Link href={`/moc/${mocId}`}>Cancel</Link>
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !userSignature}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {submitting ? 'Submitting...' : isResubmit ? 'Re-submit MOC Pack' : 'Submit MOC Pack'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}