'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getRecord, upsertRecord, pushActivity } from '@/src/demo/storage';
import type { MOCRecord, ContractorGate } from '@/src/types/moc';
import { useWorkflow } from '@/lib/use-workflow';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  FileCheck,
  ClipboardCheck
} from 'lucide-react';

// Form validation schema
const GateFormSchema = z.object({
  acknowledged: z.boolean().refine((val) => val === true, {
    message: "You must acknowledge the MOC requirements",
  }),
  signature: z.string().min(2, "Signature is required (min 2 characters)"),
  
  // Project Supervisor Details
  supervisorName: z.string().min(2, "Supervisor name is required"),
  supervisorPhone: z.string().min(1, "Supervisor phone is required"),
  supervisorEmail: z.string().email("Valid email is required"),
  
  // Document uploads (we'll track filenames)
  companyCertificates: z.string().min(1, "Company certificates are required"),
  methodStatement: z.string().min(1, "Method statement (MOS) is required"),
  riskAssessment: z.string().min(1, "Risk assessment (RA) is required"),
  projectPlan: z.string().min(1, "Project plan/schedule is required"),
});

type GateFormValues = z.infer<typeof GateFormSchema>;

export default function MOCGatePage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useWorkflow();
  const [moc, setMoc] = useState<MOCRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});

  const form = useForm<GateFormValues>({
    resolver: zodResolver(GateFormSchema),
    defaultValues: {
      acknowledged: false,
      signature: '',
      supervisorName: '',
      supervisorPhone: '',
      supervisorEmail: '',
      companyCertificates: '',
      methodStatement: '',
      riskAssessment: '',
      projectPlan: '',
    },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const id = params.id as string;
    const record = getRecord<MOCRecord>('moc', id);
    
    setMoc(record);
    setLoading(false);
  }, [params.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading MOC gate...</p>
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

  const isContractorAdmin = currentUser?.role === 'contractor_admin';
  const canAccess = isContractorAdmin && (moc.status === 'SUBMITTED' || moc.status === 'STAKEHOLDER_SIGNED');

  if (!isContractorAdmin) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                Only Contractor Admins can access the MOC Gate process.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push(`/moc/${moc.id}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to MOC Detail
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!canAccess || moc.contractorGate?.acknowledged) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6 p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle>MOC Gate Already Completed</CardTitle>
              </div>
              <CardDescription>
                The MOC acknowledgement and pack submission has already been completed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {moc.contractorGate && (
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="font-semibold">Acknowledged by:</span> {moc.contractorGate.acknowledgedBy}
                  </p>
                  <p>
                    <span className="font-semibold">Submitted at:</span>{' '}
                    {moc.contractorGate.submittedAt && new Date(moc.contractorGate.submittedAt).toLocaleString()}
                  </p>
                </div>
              )}
              <Button onClick={() => router.push(`/moc/${moc.id}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to MOC Detail
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleFileUpload = (fieldName: keyof typeof uploadedFiles, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.pdf')) {
        toast.error('Only PDF files are allowed');
        return;
      }
      
      setUploadedFiles({ ...uploadedFiles, [fieldName]: file.name });
      form.setValue(fieldName as keyof GateFormValues, file.name);
      toast.success(`${file.name} uploaded`);
    }
  };

  const onSubmit = (data: GateFormValues) => {
    const contractorGate: ContractorGate = {
      acknowledged: true,
      acknowledgedBy: currentUser?.name || 'Contractor Admin',
      acknowledgedAt: new Date().toISOString(),
      signature: data.signature,
      supervisorName: data.supervisorName,
      supervisorPhone: data.supervisorPhone,
      supervisorEmail: data.supervisorEmail,
      documents: {
        companyCertificates: data.companyCertificates,
        methodStatement: data.methodStatement,
        riskAssessment: data.riskAssessment,
        projectPlan: data.projectPlan,
      },
      submittedAt: new Date().toISOString(),
    };

    // Update MOC with contractor gate data and change status
    const updatedMOC: MOCRecord = {
      ...moc,
      contractorGate,
      status: 'CONTRACTOR_SUBMITTED',
    };

    upsertRecord('moc', updatedMOC);

    // Push activity
    pushActivity({
      type: 'moc_contractor_submitted',
      title: 'MOC Pack Submitted',
      description: `${currentUser?.name || 'Contractor'} submitted MOC acknowledgement and pack for "${moc.title}"`,
      timestamp: new Date().toISOString(),
      userName: currentUser?.name || 'Contractor Admin',
      userRole: currentUser?.role || 'contractor_admin',
      metadata: {
        mocId: moc.id,
        mocTitle: moc.title,
      },
    });

    toast.success('MOC acknowledgement and pack submitted successfully!');
    
    setTimeout(() => {
      router.push(`/moc/${moc.id}`);
    }, 1500);
  };

  return (
    <DashboardLayout>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-4xl mx-auto space-y-6 p-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold">MOC Gate - Contractor Acknowledgement</h1>
          <p className="text-muted-foreground">
            MOC: {moc.title} ({moc.id})
          </p>
        </div>

        {/* Important Notice */}
        <Alert className="border-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-700">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
          <AlertDescription>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Important: Complete all sections to proceed
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              You must acknowledge the MOC, provide project supervisor details, and upload all required documents before PTW creation is enabled.
            </p>
          </AlertDescription>
        </Alert>

        {/* Section 1: MOC Acknowledgement */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <CardTitle>1. MOC Acknowledgement</CardTitle>
            </div>
            <CardDescription>Confirm you have reviewed and understood the MOC requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-3 text-sm">
              <p className="font-semibold">MOC Summary:</p>
              <p><span className="font-medium">Area:</span> {moc.area} - {moc.exactLocation}</p>
              <p><span className="font-medium">Duration:</span> {new Date(moc.startDate).toLocaleDateString()} to {new Date(moc.endDate).toLocaleDateString()}</p>
              <p><span className="font-medium">Description:</span> {moc.description}</p>
            </div>

            <Separator />

            <div className="flex items-start space-x-3">
              <Checkbox
                id="acknowledged"
                checked={form.watch('acknowledged')}
                onCheckedChange={(checked) => form.setValue('acknowledged', checked === true)}
              />
              <label htmlFor="acknowledged" className="text-sm leading-relaxed">
                I acknowledge that I have thoroughly reviewed this Management of Change (MOC), understand the scope of work, safety requirements, and compliance obligations. I confirm that our company has the necessary resources, qualifications, and documentation to execute this work safely and in accordance with all applicable regulations and site requirements.
              </label>
            </div>
            {form.formState.errors.acknowledged && (
              <p className="text-sm text-red-500">{form.formState.errors.acknowledged.message}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="signature">Digital Signature (Full Name) *</Label>
              <Input
                id="signature"
                {...form.register('signature')}
                placeholder="Enter your full name as signature"
              />
              {form.formState.errors.signature && (
                <p className="text-sm text-red-500">{form.formState.errors.signature.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Project Supervisor Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>2. Project Supervisor Details</CardTitle>
            </div>
            <CardDescription>Provide contact information for the on-site project supervisor</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supervisorName">Supervisor Full Name *</Label>
              <Input
                id="supervisorName"
                {...form.register('supervisorName')}
                placeholder="John Doe"
              />
              {form.formState.errors.supervisorName && (
                <p className="text-sm text-red-500">{form.formState.errors.supervisorName.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="supervisorPhone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="supervisorPhone"
                    {...form.register('supervisorPhone')}
                    placeholder="+1 (555) 123-4567"
                    className="pl-9"
                  />
                </div>
                {form.formState.errors.supervisorPhone && (
                  <p className="text-sm text-red-500">{form.formState.errors.supervisorPhone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorEmail">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="supervisorEmail"
                    {...form.register('supervisorEmail')}
                    type="email"
                    placeholder="supervisor@company.com"
                    className="pl-9"
                  />
                </div>
                {form.formState.errors.supervisorEmail && (
                  <p className="text-sm text-red-500">{form.formState.errors.supervisorEmail.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Contractor Pack Upload */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              <CardTitle>3. Contractor Pack Documents (PDF Required)</CardTitle>
            </div>
            <CardDescription>Upload all required compliance and planning documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Company Certificates */}
            <div className="space-y-2">
              <Label htmlFor="companyCertificates">Company Certificates / Compliance Documents *</Label>
              <p className="text-xs text-muted-foreground">Valid licenses, insurance certificates, safety certifications</p>
              <div className="flex items-center gap-2">
                <Input
                  id="companyCertificates"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload('companyCertificates', e)}
                  className="flex-1"
                />
                {uploadedFiles.companyCertificates && (
                  <Badge variant="default" className="shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                )}
              </div>
              {form.formState.errors.companyCertificates && (
                <p className="text-sm text-red-500">{form.formState.errors.companyCertificates.message}</p>
              )}
            </div>

            <Separator />

            {/* Method Statement */}
            <div className="space-y-2">
              <Label htmlFor="methodStatement">Method Statement (MOS) *</Label>
              <p className="text-xs text-muted-foreground">Step-by-step work procedures and methodology</p>
              <div className="flex items-center gap-2">
                <Input
                  id="methodStatement"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload('methodStatement', e)}
                  className="flex-1"
                />
                {uploadedFiles.methodStatement && (
                  <Badge variant="default" className="shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                )}
              </div>
              {form.formState.errors.methodStatement && (
                <p className="text-sm text-red-500">{form.formState.errors.methodStatement.message}</p>
              )}
            </div>

            <Separator />

            {/* Risk Assessment */}
            <div className="space-y-2">
              <Label htmlFor="riskAssessment">Risk Assessment (RA) *</Label>
              <p className="text-xs text-muted-foreground">Hazard identification, risk analysis, and control measures</p>
              <div className="flex items-center gap-2">
                <Input
                  id="riskAssessment"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload('riskAssessment', e)}
                  className="flex-1"
                />
                {uploadedFiles.riskAssessment && (
                  <Badge variant="default" className="shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                )}
              </div>
              {form.formState.errors.riskAssessment && (
                <p className="text-sm text-red-500">{form.formState.errors.riskAssessment.message}</p>
              )}
            </div>

            <Separator />

            {/* Project Plan */}
            <div className="space-y-2">
              <Label htmlFor="projectPlan">Project Plan / Schedule *</Label>
              <p className="text-xs text-muted-foreground">Timeline, resources, milestones, and deliverables</p>
              <div className="flex items-center gap-2">
                <Input
                  id="projectPlan"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload('projectPlan', e)}
                  className="flex-1"
                />
                {uploadedFiles.projectPlan && (
                  <Badge variant="default" className="shrink-0">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Uploaded
                  </Badge>
                )}
              </div>
              {form.formState.errors.projectPlan && (
                <p className="text-sm text-red-500">{form.formState.errors.projectPlan.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <Button 
            type="submit" 
            className="flex-1"
            disabled={!form.watch('acknowledged')}
          >
            <Upload className="mr-2 h-4 w-4" />
            Submit MOC Acknowledgement & Pack
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push(`/moc/${moc.id}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
