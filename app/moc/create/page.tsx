'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MocFormSchema, type MocFormValues } from '@/src/types/moc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useWorkflow, useWorkflowActions } from '@/lib/use-workflow';
import { Save, Send, Upload, FileText, X, AlertTriangle, Building2, User as UserIcon } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';  // ✅ use your existing client

const DRAFT_KEY = 'moc-create-draft';
const STORAGE_BUCKET = 'moc-attachments';

type UploadedFileRef = {
  name: string;
  path: string;
  url: string | null;
  size: number | null;
  type: string | null;
  uploaded_at: string;
};

export default function MOCNewPage() {
  const router = useRouter();
  const workflow = useWorkflowActions();
  const { currentUser, contractors, stakeholders } = useWorkflow();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileRef[]>([]);

  const isStakeholder = currentUser?.role === 'stakeholder';
  const isHSEManager = currentUser?.role === 'hse_manager';

  const form = useForm<MocFormValues>({
    resolver: zodResolver(MocFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      title: '',
      area: '',
      exactLocation: '',
      description: '',
      reasonForChange: '',
      riskSummary: '',
      startDate: '',
      endDate: '',

      // IMPORTANT: We'll store contractorCompany as the contractor uuid (matches DB "contractorCompany")
      contractorCompany: '',
      contractor_id: null,

      requiresStakeholderApproval: false,
      stakeholderName: '',
      stakeholderEmail: '',
      stakeholderSignature: '',
      stakeholderSignedAt: '',

      attachments: [], // keep your existing schema field if you already have it in zod/types
    },
  });

  const requiresStakeholderApproval = form.watch('requiresStakeholderApproval');

  useEffect(() => {
    workflow.syncFromDatabase();

    if (typeof window === 'undefined') return;
    const draftData = sessionStorage.getItem(DRAFT_KEY);
    if (draftData) {
      try {
        const parsed = JSON.parse(draftData);
        form.reset(parsed);

        // restore uploadedFiles if saved
        if (parsed.__uploadedFiles && Array.isArray(parsed.__uploadedFiles)) {
          setUploadedFiles(parsed.__uploadedFiles);
        }
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveDraft = () => {
    const values = form.getValues();
    if (typeof window !== 'undefined') {
      // keep your old draft + add uploadedFiles safely
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ ...values, __uploadedFiles: uploadedFiles })
      );
      toast.success('Draft saved successfully');
    }
  };

  const removeFile = async (file: UploadedFileRef) => {
    try {
      // Optional: also remove from storage
      // await supabase.storage.from(STORAGE_BUCKET).remove([file.path]);

      const updated = uploadedFiles.filter(f => f.path !== file.path);
      setUploadedFiles(updated);

      toast.info('File removed');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to remove file');
    }
  };

  // ✅ Real upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const uploaded: UploadedFileRef[] = [];

      for (const file of Array.from(files)) {
        const cleanName = file.name.replace(/\s+/g, '_');
        const path = `mocs/tmp/${crypto.randomUUID()}_${cleanName}`;

        const { error: upErr } = await supabase
          .storage
          .from(STORAGE_BUCKET)
          .upload(path, file, { upsert: false, contentType: file.type });

        if (upErr) throw upErr;

        const { data: pub } = supabase
          .storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(path);

        uploaded.push({
          name: file.name,
          path,
          url: pub?.publicUrl ?? null,
          size: file.size ?? null,
          type: file.type ?? null,
          uploaded_at: new Date().toISOString(),
        });
      }

      const updated = [...uploadedFiles, ...uploaded];
      setUploadedFiles(updated);

      // keep your old attachments field for UI if needed
      form.setValue(
        'attachments',
        updated.map(f => ({ filename: f.name }))
      );

      toast.success(`${files.length} file(s) uploaded`);
      e.target.value = '';
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Upload failed');
    }
  };

  const onSubmit = async (values: MocFormValues) => {
    try {
      const now = new Date().toISOString();

      let status: string;
      if (isStakeholder) {
        status = "STAKEHOLDER_SIGNED";
        values.stakeholderSignature = currentUser?.name || "Stakeholder";
        values.stakeholderSignedAt = now;
      } else if (isHSEManager) {
        status = "SUBMITTED";
      } else {
        toast.error("Unauthorized role for MOC creation");
        return;
      }

      // ✅ Build stakeholders jsonb to match your mocs.stakeholders column
const stakeholdersJson =
  values.requiresStakeholderApproval && values.stakeholderName
    ? [{
        stakeholder_id: values.stakeholderId || null,
        name: values.stakeholderName,
        email: values.stakeholderEmail || null,
        status: "PENDING",
        remarks: null,
        approved_by: null,
        approved_at: null,
      }]
    : [];

      // ✅ Save uploads into before_images jsonb (since schema has no attachments)
      const beforeImagesJson = uploadedFiles.map(f => ({
        name: f.name,
        path: f.path,
        url: f.url,
        size: f.size,
        type: f.type,
        uploaded_at: f.uploaded_at,
      }));

const payload = {
  title: values.title,
  area: values.area,
  exactLocation: values.exactLocation,
  description: values.description,
  reasonForChange: values.reasonForChange,
  riskSummary: values.riskSummary,

  contractorCompany: values.contractorCompany || null,
  contractor_id: values.contractor_id ?? null,

startDate: values.startDate || null,
endDate: values.endDate || null,

  // ✅ NEW FIELD
  requiresStakeholderApproval: values.requiresStakeholderApproval,

  stakeholders: stakeholdersJson,
  before_images: beforeImagesJson,

  status,
};

      const result = await workflow.createMOC(payload as any);

      if (!result.success) {
        toast.error(result.error || "Database save failed");
        return;
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem(DRAFT_KEY);
      }

      setIsSubmitted(true);
      toast.success(isStakeholder
        ? "MOC initiated successfully! Waiting for HSE Manager to complete submission."
        : "MOC submitted successfully!"
      );

      router.push(`/moc/${result.id}`);
    } catch (e: any) {
      console.error("MOC SUBMIT FAILED", e);
      toast.error(e?.message || "Failed to submit MOC. Please try again.");
    }
  };

  if (isSubmitted) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-green-600">MOC Submitted Successfully!</CardTitle>
              <CardDescription>Redirecting to MOC details...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-6">

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold">
              {isStakeholder ? 'Initiate Management of Change' : 'Create Management of Change'}
            </h1>

            {isStakeholder && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                Stakeholder Initiation
              </Badge>
            )}
            {isHSEManager && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                HSE Manager Creation
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {isStakeholder
              ? 'Fill in basic MOC information and provide your sign-off. HSE Manager will complete the submission.'
              : 'Complete the full MOC form and submit for approval.'}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Section 1 */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Provide core details about this Management of Change</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">MOC Title *</Label>
                <Input id="title" placeholder="e.g., Equipment upgrade for Production Line 3" {...form.register('title')} />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="area">Area/Site *</Label>
                  <Input id="area" placeholder="e.g., Production Building A" {...form.register('area')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exactLocation">Exact Location *</Label>
                  <Input id="exactLocation" placeholder="e.g., Line 3, Station B12" {...form.register('exactLocation')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description / Change Summary *</Label>
                <Textarea id="description" rows={4} {...form.register('description')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasonForChange">Reason for Change *</Label>
                <Textarea id="reasonForChange" rows={3} {...form.register('reasonForChange')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskSummary">Risk Summary *</Label>
                <Textarea id="riskSummary" rows={3} {...form.register('riskSummary')} />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Contractor Selection (FIXED) */}
          <Card>
            <CardHeader>
              <CardTitle>Contractor Information</CardTitle>
              <CardDescription>Select the contractor company responsible for this MOC</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contractors.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">No contractors found</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        You need to add contractor companies before creating an MOC.
                      </p>
                      <Link href="/admin/settings" className="inline-block">
                        <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                          <Building2 className="mr-2 h-4 w-4" />
                          Go to Settings → Contractors
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Contractor Company *</Label>

                  {/* contractorCompany stores contractor UUID (matches DB "contractorCompany") */}
                  <Select
                    value={form.watch('contractorCompany') || ''}
                    onValueChange={(contractorId) => {
                      const selected = contractors.find(c => c.id === contractorId);
                      form.setValue('contractorCompany', contractorId);
                      // optional: keep a friendly label somewhere else if needed
                      // form.setValue('contractorCompanyLabel', selected?.companyName ?? '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contractor company" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractors.map((contractor) => (
                        <SelectItem key={contractor.id} value={contractor.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {contractor.companyName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {form.formState.errors.contractorCompany && (
                    <p className="text-sm text-red-500">{form.formState.errors.contractorCompany.message}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Specify when this change will be implemented</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input id="startDate" type="date" {...form.register('startDate')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input id="endDate" type="date" {...form.register('endDate')} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Stakeholder Dropdown + Auto Email */}
          <Card>
            <CardHeader>
              <CardTitle>Stakeholder Involvement</CardTitle>
              <CardDescription>Identify if additional stakeholder approval is required</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresStakeholderApproval"
                  checked={requiresStakeholderApproval}
                  onCheckedChange={(checked) => form.setValue('requiresStakeholderApproval', checked as boolean)}
                />
                <Label htmlFor="requiresStakeholderApproval" className="cursor-pointer">
                  This MOC requires stakeholder approval
                </Label>
              </div>

              {requiresStakeholderApproval && (
                <div className="space-y-4 rounded-lg border p-4 bg-muted/30">

                  {/* Dropdown */}
                  <div className="space-y-2">
                    <Label>Select Stakeholder</Label>
                    <Select
                      value={(form.watch('stakeholderId') as any) || ''}
                      onValueChange={(stakeholderId) => {
                        const s = stakeholders.find(st => st.id === stakeholderId);
                        form.setValue('stakeholderId' as any, stakeholderId);

                        form.setValue('stakeholderName', s?.name ?? '');
                        form.setValue('stakeholderEmail', s?.email ?? '');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stakeholder" />
                      </SelectTrigger>
                      <SelectContent>
                        {stakeholders.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <UserIcon className="h-4 w-4 text-muted-foreground" />
                              {s.name}{s.department ? ` — ${s.department}` : ''}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stakeholderName">Stakeholder Name</Label>
                    <Input id="stakeholderName" {...form.register('stakeholderName')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stakeholderEmail">Stakeholder Email</Label>
                    <Input id="stakeholderEmail" type="email" {...form.register('stakeholderEmail')} />
                  </div>

                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 5: Attachments (REAL UPLOAD + saved in DB via before_images) */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>Upload supporting documents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <Button type="button" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files ({uploadedFiles.length})</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((f) => (
                      <div
                        key={f.path}
                        className="flex items-center justify-between rounded-lg border p-3 bg-muted/20"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{f.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(f)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 6: Stakeholder Sign-off */}
          {isStakeholder && (
            <Card className="border-blue-600">
              <CardHeader>
                <CardTitle>Stakeholder Sign-off</CardTitle>
                <CardDescription>
                  By submitting this form, you are providing your initial sign-off for this Management of Change
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>Note:</strong> After your sign-off, this MOC will be forwarded to the HSE Manager
                    to complete the submission process. You will be notified of any updates.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={handleSaveDraft}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>

                  {/* IMPORTANT: no extra onClick handleSubmit; form already handles submit */}
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    <Send className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting ? 'Submitting...' : isStakeholder ? 'Submit Sign-off' : 'Submit MOC'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </form>
      </div>
    </DashboardLayout>
  );
}