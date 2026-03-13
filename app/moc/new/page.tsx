'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MocFormSchema, type MocFormValues, type MOCRecord } from '@/src/types/moc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { upsertRecord, pushActivity } from '@/src/demo/storage';
import { useWorkflow, useWorkflowActions } from '@/lib/use-workflow';
import { Save, Send, Upload, FileText, X, AlertTriangle, Building2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import Link from 'next/link';
import { workflowStore } from '@/lib/workflow-store';

const DRAFT_KEY = 'moc-create-draft';

function generateMOCId(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `MOC-${num}`;
}

export default function MOCNewPage() {
  const router = useRouter();
  const workflow = useWorkflowActions();
  const workflowStore = useWorkflowActions();
  const { currentUser, users, contractors  } = useWorkflow();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [requiresIsolation, setRequiresIsolation] = useState(false); // Declare the variable here

  const isStakeholder = currentUser?.role === 'stakeholder';
  const isHSEManager = currentUser?.role === 'hse_manager';

  // Get list of contractors from users
  // const contractorUsers  = users.filter(
  //   user => user.role === 'contractor_admin' || user.role === 'contractor_supervisor'
  // );


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
      contractorCompany: '',
      requiresStakeholderApproval: false,
      stakeholderName: '',
      stakeholderEmail: '',
      attachments: [],
      stakeholderSignature: '',
      stakeholderSignedAt: '',
    },
  });

  const requiresStakeholderApproval = form.watch('requiresStakeholderApproval');

  // Load draft on mount
  useEffect(() => {

    workflowStore.syncFromDatabase();
    if (typeof window === 'undefined') return;
    
    const draftData = sessionStorage.getItem(DRAFT_KEY);
    if (draftData) {
      try {
        const parsed = JSON.parse(draftData);
        form.reset(parsed);
        if (parsed.attachments) {
          setUploadedFiles(parsed.attachments.map((a: any) => a.filename));
        }
      } catch (err) {
        console.error('Failed to load draft:', err);
      }
    }
  }, [form]);

  // Save draft
  const handleSaveDraft = () => {
    const values = form.getValues();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
      toast.success('Draft saved successfully');
    }
  };

  // Mock file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).map(f => f.name);
      const updated = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updated);
      
      const attachments = updated.map(filename => ({ filename }));
      form.setValue('attachments', attachments);
      
      toast.success(`${newFiles.length} file(s) added`);
    }
  };

  const removeFile = (filename: string) => {
    const updated = uploadedFiles.filter(f => f !== filename);
    setUploadedFiles(updated);
    form.setValue('attachments', updated.map(f => ({ filename: f })));
    toast.info('File removed');
  };

  // Submit form
const onSubmit = async (values: MocFormValues) => {
  console.log("MOC SUBMIT values", values);

  try {
    const mocId = generateMOCId();
    const now = new Date().toISOString();

    let status: MOCRecord["status"];
    let createdByRole: string;

    if (isStakeholder) {
      status = "STAKEHOLDER_SIGNED";
      createdByRole = "stakeholder";

      values.stakeholderSignature = currentUser?.name || "Stakeholder";
      values.stakeholderSignedAt = now;
    } else if (isHSEManager) {
      status = "SUBMITTED";
      createdByRole = "hse_manager";
    } else {
      toast.error("Unauthorized role for MOC creation");
      return;
    }

    const mocRecord: MOCRecord = {
      ...values,
      id: mocId,
      status,
      createdAt: now,
      createdByRole,
      createdBy: currentUser?.name || currentUser?.role || "Unknown",
    };

    console.log("Saving MOC record", mocRecord);

    // ⭐ IMPORTANT → Use workflow store action
    const workflow = useWorkflowActions();
    const result = await workflow.createMOC({
  ...mocRecord
} as any);

    if (!result.success) {
      toast.error(result.error || "Database save failed");
      return;
    }

    // Clear draft
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(DRAFT_KEY);
    }

    setIsSubmitted(true);

    toast.success(
      isStakeholder
        ? "MOC initiated successfully! Waiting for HSE Manager to complete submission."
        : "MOC submitted successfully!"
    );

    setTimeout(() => {
      router.push(`/moc/${mocId}?submitted=1`);
    }, 1500);

  } catch (e: any) {
    console.error("MOC SUBMIT FAILED", e);
    toast.error(e?.message || "Failed to submit MOC. Please try again.");
  }
};

useEffect(() => {
  console.log("Contractors loaded →", contractors);
}, [contractors]);

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
          {/* Section 1: Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Provide core details about this Management of Change</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">MOC Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Equipment upgrade for Production Line 3"
                  {...form.register('title')}
                  disabled={isSubmitted}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="area">Area/Site *</Label>
                  <Input
                    id="area"
                    placeholder="e.g., Production Building A"
                    {...form.register('area')}
                    disabled={isSubmitted}
                  />
                  {form.formState.errors.area && (
                    <p className="text-sm text-red-500">{form.formState.errors.area.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exactLocation">Exact Location *</Label>
                  <Input
                    id="exactLocation"
                    placeholder="e.g., Line 3, Station B12"
                    {...form.register('exactLocation')}
                    disabled={isSubmitted}
                  />
                  {form.formState.errors.exactLocation && (
                    <p className="text-sm text-red-500">{form.formState.errors.exactLocation.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description / Change Summary *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the change being proposed..."
                  rows={4}
                  {...form.register('description')}
                  disabled={isSubmitted}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasonForChange">Reason for Change *</Label>
                <Textarea
                  id="reasonForChange"
                  placeholder="Explain why this change is necessary..."
                  rows={3}
                  {...form.register('reasonForChange')}
                  disabled={isSubmitted}
                />
                {form.formState.errors.reasonForChange && (
                  <p className="text-sm text-red-500">{form.formState.errors.reasonForChange.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="riskSummary">Risk Summary *</Label>
                <Textarea
                  id="riskSummary"
                  placeholder="Summarize potential risks associated with this change..."
                  rows={3}
                  {...form.register('riskSummary')}
                  disabled={isSubmitted}
                />
                {form.formState.errors.riskSummary && (
                  <p className="text-sm text-red-500">{form.formState.errors.riskSummary.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Contractor Selection */}
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
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                        No contractors found
                      </p>
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
                  <Label htmlFor="contractorCompany">Contractor Company *</Label>
                  <Select
                    value={form.watch('contractorCompany')}
                    onValueChange={(value) => {
                      form.setValue('contractorCompany', value);
                    }}
                    disabled={isSubmitted}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contractor company" />
                    </SelectTrigger>
<SelectContent>
  {contractors.map((contractor) => (
    <SelectItem
      key={contractor.id}
      value={contractor.companyName}
    >
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
                  <Input
                    id="startDate"
                    type="date"
                    {...form.register('startDate')}
                    disabled={isSubmitted}
                  />
                  {form.formState.errors.startDate && (
                    <p className="text-sm text-red-500">{form.formState.errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...form.register('endDate')}
                    disabled={isSubmitted}
                  />
                  {form.formState.errors.endDate && (
                    <p className="text-sm text-red-500">{form.formState.errors.endDate.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Stakeholder Involvement */}
          <Card>
            <CardHeader>
              <CardTitle>Stakeholder Involvement</CardTitle>
              <CardDescription>Identify if additional stakeholder approval is required</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requiresStakeholderApproval"
                  checked={form.watch('requiresStakeholderApproval')}
                  onCheckedChange={(checked) => {
                    form.setValue('requiresStakeholderApproval', checked as boolean);
                  }}
                  disabled={isSubmitted}
                />
                <Label htmlFor="requiresStakeholderApproval" className="cursor-pointer">
                  This MOC requires stakeholder approval
                </Label>
              </div>

              {requiresStakeholderApproval && (
                <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                  <div className="space-y-2">
                    <Label htmlFor="stakeholderName">Stakeholder Name</Label>
                    <Input
                      id="stakeholderName"
                      placeholder="Full name of stakeholder"
                      {...form.register('stakeholderName')}
                      disabled={isSubmitted}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stakeholderEmail">Stakeholder Email</Label>
                    <Input
                      id="stakeholderEmail"
                      type="email"
                      placeholder="stakeholder@unilever.com"
                      {...form.register('stakeholderEmail')}
                      disabled={isSubmitted}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 5: Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
              <CardDescription>Upload supporting documents (mock upload for demo)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isSubmitted}
                  className="flex-1"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                />
                <Button type="button" variant="outline" disabled={isSubmitted}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files ({uploadedFiles.length})</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((filename, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border p-3 bg-muted/20"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{filename}</span>
                        </div>
                        {!isSubmitted && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(filename)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 6: Declaration (for Stakeholder) */}
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

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitted}
                >
                  Cancel
                </Button>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isSubmitted}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>

                  <Button
                    type="submit"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={isSubmitted || form.formState.isSubmitting}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {form.formState.isSubmitting 
                      ? 'Submitting...' 
                      : isStakeholder ? 'Submit Sign-off' : 'Submit MOC'}
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
