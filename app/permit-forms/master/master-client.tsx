'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getRecord, upsertRecord } from '@/src/demo/storage';
import { Save, Send, Plus, X, Upload, FileText } from 'lucide-react';

// Zod Schema for Master PTW Form
const masterPTWSchema = z.object({
  // A1: Basic PTW Info
  ptwTitle: z.string().min(3, 'PTW title is required (min 3 characters)'),
  site: z.string().min(1, 'Site/Area is required'),
  exactLocation: z.string().min(1, 'Exact location is required'),
  contractorCompany: z.string().min(1, 'Contractor company is required'),
  contractorSupervisor: z.string().min(1, 'Contractor supervisor name is required'),
  supervisorPhone: z.string().min(1, 'Supervisor phone is required'),
  supervisorEmail: z.string().email('Valid email is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  workDescription: z.string().min(10, 'Work description is required (min 10 characters)'),
  
  // A2: Permit Types
  permitTypes: z.object({
    hotWork: z.boolean(),
    workAtHeight: z.boolean(),
    confinedSpace: z.boolean(),
    excavation: z.boolean(),
    electricalIsolation: z.boolean(),
    pipeworkIsolation: z.boolean(),
  }).refine(data => Object.values(data).some(v => v), {
    message: 'At least one permit type must be selected',
  }),
  
  // A3: Workers List
  workers: z.array(z.object({
    name: z.string().min(1, 'Worker name is required'),
    idPassport: z.string().min(1, 'ID/Passport is required'),
    role: z.string().min(1, 'Role is required'),
    contact: z.string().min(1, 'Contact is required'),
  })).min(1, 'At least one worker is required'),
  
  // A4: Tools/Equipment List
  toolsEquipment: z.array(z.object({
    item: z.string().min(1, 'Tool/Equipment name is required'),
  })).min(1, 'At least one tool/equipment is required'),
  
  // A5: Isolation/LOTO
  requiresIsolation: z.boolean(),
  isolationDetails: z.string().optional(),
  
  // A6: PPE Checklist
  ppe: z.object({
    hardHat: z.boolean(),
    safetyGlasses: z.boolean(),
    safetyShoes: z.boolean(),
    gloves: z.boolean(),
    highVisVest: z.boolean(),
    hearingProtection: z.boolean(),
    respirator: z.boolean(),
    fallProtection: z.boolean(),
    other: z.string().optional(),
  }),
  
  // A7: Emergency Info
  musterPoint: z.string().min(1, 'Muster point is required'),
  emergencyContact: z.string().min(1, 'Emergency contact is required'),
  firstAidLocation: z.string().min(1, 'First aid location is required'),
  fireExtinguisherLocation: z.string().min(1, 'Fire extinguisher location is required'),
  
  // A8: Risk Controls
  riskControls: z.object({
    areaBarricaded: z.boolean(),
    signagePosted: z.boolean(),
    fireExtinguisherAvailable: z.boolean(),
    fireWatchAssigned: z.boolean(),
    emergencyPlanReviewed: z.boolean(),
    toolboxTalkCompleted: z.boolean(),
  }),
  riskControlComments: z.string().optional(),
  
  // A9: Attachments
  attachments: z.array(z.object({
    filename: z.string(),
  })).optional(),
  
  // A10: Declaration
  contractorDeclaration: z.boolean().refine(val => val === true, {
    message: 'Contractor declaration must be accepted',
  }),
  contractorDeclarationName: z.string().min(1, 'Contractor name is required for declaration'),
});

type MasterPTWFormValues = z.infer<typeof masterPTWSchema>;

const DRAFT_KEY = 'master-ptw-draft';

export default function MasterClient() {
  const router = useRouter();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedPTWId, setSubmittedPTWId] = useState<string | null>(null);

  const form = useForm<MasterPTWFormValues>({
    resolver: zodResolver(masterPTWSchema),
    defaultValues: {
      ptwTitle: '',
      site: '',
      exactLocation: '',
      contractorCompany: '',
      contractorSupervisor: '',
      supervisorPhone: '',
      supervisorEmail: '',
      startDate: '',
      endDate: '',
      workDescription: '',
      permitTypes: {
        hotWork: false,
        workAtHeight: false,
        confinedSpace: false,
        excavation: false,
        electricalIsolation: false,
        pipeworkIsolation: false,
      },
      workers: [{ name: '', idPassport: '', role: '', contact: '' }],
      toolsEquipment: [{ item: '' }],
      requiresIsolation: false,
      isolationDetails: '',
      ppe: {
        hardHat: false,
        safetyGlasses: false,
        safetyShoes: false,
        gloves: false,
        highVisVest: false,
        hearingProtection: false,
        respirator: false,
        fallProtection: false,
        other: '',
      },
      musterPoint: '',
      emergencyContact: '',
      firstAidLocation: '',
      fireExtinguisherLocation: '',
      riskControls: {
        areaBarricaded: false,
        signagePosted: false,
        fireExtinguisherAvailable: false,
        fireWatchAssigned: false,
        emergencyPlanReviewed: false,
        toolboxTalkCompleted: false,
      },
      riskControlComments: '',
      attachments: [],
      contractorDeclaration: false,
      contractorDeclarationName: '',
    },
  });

  const { fields: workerFields, append: appendWorker, remove: removeWorker } = useFieldArray({
    control: form.control,
    name: 'workers',
  });

  const { fields: toolFields, append: appendTool, remove: removeTool } = useFieldArray({
    control: form.control,
    name: 'toolsEquipment',
  });

  const { fields: attachmentFields, append: appendAttachment, remove: removeAttachment } = useFieldArray({
    control: form.control,
    name: 'attachments',
  });

  // Load draft on mount
  useEffect(() => {
    const draft = getRecord<any>('ptw', DRAFT_KEY);
    if (draft && draft.status === 'DRAFT') {
      setIsSubmitted(false);
      form.reset(draft.formData);
      toast.info('Draft loaded');
    } else if (draft && draft.status === 'SUBMITTED') {
      setIsSubmitted(true);
      setSubmittedPTWId(draft.ptwId);
      form.reset(draft.formData);
    }
  }, []);

  const handleSaveDraft = () => {
    const formData = form.getValues();
    upsertRecord('ptw', {
      id: DRAFT_KEY,
      status: 'DRAFT',
      formData,
      savedAt: new Date().toISOString(),
    });
    toast.success('Draft saved successfully');
  };

  const handleSubmit = form.handleSubmit((data) => {
    // Generate PTW ID
    const ptwId = `PTW-${Math.floor(Math.random() * 9000) + 1000}`;
    const now = new Date();
    
    // Convert workers to proper format
    const workerList = data.workers.map((w, idx) => ({
      name: w.name,
      badge: `W${String(idx + 1).padStart(3, '0')}`,
      role: w.role,
    }));

    // Create PTW record in workflow store format
    const ptwRecord = {
      id: ptwId,
      permit_type: 'MASTER' as const,
      title: data.ptwTitle,
      location: data.exactLocation,
      startDatetime: new Date(data.startDate),
      end_datetime: new Date(data.endDate),
      moc_id: 'MOC-001', // Default MOC
      contractor_id: 'u7', // Default contractor
      requires_facilities_review: false,
      requires_efs_review: false,
      requires_stakeholder_closure: false,
      status: 'SUBMITTED' as const,
      revision_number: 1,
      worker_list: workerList,
      submission_date: now,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: now,
          user: data.contractorCompany,
          role: 'contractor_admin' as const,
          action: 'Created Master PTW',
          status: 'DRAFT' as const,
        },
        {
          id: `tl-${Date.now() + 1}`,
          timestamp: now,
          user: data.contractorCompany,
          role: 'contractor_admin' as const,
          action: 'Submitted Master PTW',
          status: 'SUBMITTED' as const,
        },
      ],
      created_at: now,
      updated_at: now,
      // Store full form data in metadata
      _masterFormData: data,
    };

    // Save PTW record to ptw table
    upsertRecord('ptw', ptwRecord);

    // Update draft record
    upsertRecord('ptw', {
      id: DRAFT_KEY,
      status: 'SUBMITTED',
      ptwId: ptwId,
      formData: data,
      submittedAt: now.toISOString(),
    });

    setIsSubmitted(true);
    setSubmittedPTWId(ptwId);
    toast.success('Master PTW submitted successfully');
    
    // Redirect to PTW detail page
    setTimeout(() => {
      router.push(`/ptw/${ptwId}`);
    }, 1500);
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        appendAttachment({ filename: file.name });
      });
      toast.success(`${files.length} file(s) added`);
    }
  };

  const isReadOnly = isSubmitted;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-8">
      <div>
        <h1 className="text-3xl font-semibold">Master Permit to Work (PTW)</h1>
        <p className="text-muted-foreground">Complete all sections below. Save draft to continue later.</p>
        {isSubmitted && (
          <div className="mt-2 rounded-lg border border-green-500 bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
            This permit has been submitted and is now read-only. Redirecting to PTW details...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* A1: Basic PTW Info */}
        <Card>
          <CardHeader>
            <CardTitle>A1. Basic PTW Information</CardTitle>
            <CardDescription>Provide general information about the permit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ptwTitle">PTW Title *</Label>
                <Input
                  id="ptwTitle"
                  {...form.register('ptwTitle')}
                  disabled={isReadOnly}
                />
                {form.formState.errors.ptwTitle && (
                  <p className="text-sm text-destructive">{form.formState.errors.ptwTitle.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="site">Site/Area *</Label>
                <Input
                  id="site"
                  {...form.register('site')}
                  disabled={isReadOnly}
                />
                {form.formState.errors.site && (
                  <p className="text-sm text-destructive">{form.formState.errors.site.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="exactLocation">Exact Location *</Label>
              <Input
                id="exactLocation"
                {...form.register('exactLocation')}
                disabled={isReadOnly}
              />
              {form.formState.errors.exactLocation && (
                <p className="text-sm text-destructive">{form.formState.errors.exactLocation.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractorCompany">Contractor Company *</Label>
              <Input
                id="contractorCompany"
                {...form.register('contractorCompany')}
                disabled={isReadOnly}
              />
              {form.formState.errors.contractorCompany && (
                <p className="text-sm text-destructive">{form.formState.errors.contractorCompany.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="contractorSupervisor">Contractor Supervisor Name *</Label>
                <Input
                  id="contractorSupervisor"
                  {...form.register('contractorSupervisor')}
                  disabled={isReadOnly}
                />
                {form.formState.errors.contractorSupervisor && (
                  <p className="text-sm text-destructive">{form.formState.errors.contractorSupervisor.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorPhone">Supervisor Phone *</Label>
                <Input
                  id="supervisorPhone"
                  {...form.register('supervisorPhone')}
                  disabled={isReadOnly}
                />
                {form.formState.errors.supervisorPhone && (
                  <p className="text-sm text-destructive">{form.formState.errors.supervisorPhone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="supervisorEmail">Supervisor Email *</Label>
                <Input
                  id="supervisorEmail"
                  type="email"
                  {...form.register('supervisorEmail')}
                  disabled={isReadOnly}
                />
                {form.formState.errors.supervisorEmail && (
                  <p className="text-sm text-destructive">{form.formState.errors.supervisorEmail.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...form.register('startDate')}
                  disabled={isReadOnly}
                />
                {form.formState.errors.startDate && (
                  <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...form.register('endDate')}
                  disabled={isReadOnly}
                />
                {form.formState.errors.endDate && (
                  <p className="text-sm text-destructive">{form.formState.errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workDescription">Work Description/Scope *</Label>
              <Textarea
                id="workDescription"
                {...form.register('workDescription')}
                disabled={isReadOnly}
                rows={4}
                placeholder="Provide detailed description of work to be performed..."
              />
              {form.formState.errors.workDescription && (
                <p className="text-sm text-destructive">{form.formState.errors.workDescription.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* A2: Permit Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>A2. Permit Type Selection</CardTitle>
            <CardDescription>Select all applicable permit types for this work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hotWork"
                  checked={form.watch('permitTypes.hotWork')}
                  onCheckedChange={(checked) => form.setValue('permitTypes.hotWork', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="hotWork" className="font-normal">Hot Work</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="workAtHeight"
                  checked={form.watch('permitTypes.workAtHeight')}
                  onCheckedChange={(checked) => form.setValue('permitTypes.workAtHeight', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="workAtHeight" className="font-normal">Work at Height</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confinedSpace"
                  checked={form.watch('permitTypes.confinedSpace')}
                  onCheckedChange={(checked) => form.setValue('permitTypes.confinedSpace', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="confinedSpace" className="font-normal">Confined Space</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="excavation"
                  checked={form.watch('permitTypes.excavation')}
                  onCheckedChange={(checked) => form.setValue('permitTypes.excavation', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="excavation" className="font-normal">Excavation</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="electricalIsolation"
                  checked={form.watch('permitTypes.electricalIsolation')}
                  onCheckedChange={(checked) => form.setValue('permitTypes.electricalIsolation', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="electricalIsolation" className="font-normal">Electrical Isolation</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pipeworkIsolation"
                  checked={form.watch('permitTypes.pipeworkIsolation')}
                  onCheckedChange={(checked) => form.setValue('permitTypes.pipeworkIsolation', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="pipeworkIsolation" className="font-normal">Pipework Isolation</Label>
              </div>
            </div>
            {form.formState.errors.permitTypes && (
              <p className="text-sm text-destructive">{form.formState.errors.permitTypes.message}</p>
            )}
          </CardContent>
        </Card>

        {/* A3: Workers List */}
        <Card>
          <CardHeader>
            <CardTitle>A3. Workers List</CardTitle>
            <CardDescription>Add all workers involved in this permit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workerFields.map((field, index) => (
              <div key={field.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Worker {index + 1}</Label>
                  {!isReadOnly && workerFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeWorker(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`workers.${index}.name`}>Name *</Label>
                    <Input
                      id={`workers.${index}.name`}
                      {...form.register(`workers.${index}.name`)}
                      disabled={isReadOnly}
                    />
                    {form.formState.errors.workers?.[index]?.name && (
                      <p className="text-sm text-destructive">{form.formState.errors.workers[index]?.name?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`workers.${index}.idPassport`}>ID/Passport *</Label>
                    <Input
                      id={`workers.${index}.idPassport`}
                      {...form.register(`workers.${index}.idPassport`)}
                      disabled={isReadOnly}
                    />
                    {form.formState.errors.workers?.[index]?.idPassport && (
                      <p className="text-sm text-destructive">{form.formState.errors.workers[index]?.idPassport?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`workers.${index}.role`}>Role *</Label>
                    <Input
                      id={`workers.${index}.role`}
                      {...form.register(`workers.${index}.role`)}
                      disabled={isReadOnly}
                    />
                    {form.formState.errors.workers?.[index]?.role && (
                      <p className="text-sm text-destructive">{form.formState.errors.workers[index]?.role?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`workers.${index}.contact`}>Contact *</Label>
                    <Input
                      id={`workers.${index}.contact`}
                      {...form.register(`workers.${index}.contact`)}
                      disabled={isReadOnly}
                    />
                    {form.formState.errors.workers?.[index]?.contact && (
                      <p className="text-sm text-destructive">{form.formState.errors.workers[index]?.contact?.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {!isReadOnly && (
              <Button
                type="button"
                variant="outline"
                onClick={() => appendWorker({ name: '', idPassport: '', role: '', contact: '' })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Worker
              </Button>
            )}

            {form.formState.errors.workers && typeof form.formState.errors.workers === 'object' && !Array.isArray(form.formState.errors.workers) && (
              <p className="text-sm text-destructive">{form.formState.errors.workers.message}</p>
            )}
          </CardContent>
        </Card>

        {/* A4: Tools/Equipment List */}
        <Card>
          <CardHeader>
            <CardTitle>A4. Tools & Equipment</CardTitle>
            <CardDescription>List all tools and equipment to be used</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {toolFields.map((field, index) => (
              <div key={field.id} className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`toolsEquipment.${index}.item`}>Tool/Equipment {index + 1} *</Label>
                  <Input
                    id={`toolsEquipment.${index}.item`}
                    {...form.register(`toolsEquipment.${index}.item`)}
                    disabled={isReadOnly}
                    placeholder="e.g., Angle grinder, Scaffold, Welding machine"
                  />
                  {form.formState.errors.toolsEquipment?.[index]?.item && (
                    <p className="text-sm text-destructive">{form.formState.errors.toolsEquipment[index]?.item?.message}</p>
                  )}
                </div>

                {!isReadOnly && toolFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTool(index)}
                    className="mt-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {!isReadOnly && (
              <Button
                type="button"
                variant="outline"
                onClick={() => appendTool({ item: '' })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tool/Equipment
              </Button>
            )}

            {form.formState.errors.toolsEquipment && typeof form.formState.errors.toolsEquipment === 'object' && !Array.isArray(form.formState.errors.toolsEquipment) && (
              <p className="text-sm text-destructive">{form.formState.errors.toolsEquipment.message}</p>
            )}
          </CardContent>
        </Card>

        {/* A5: Isolation/LOTO */}
        <Card>
          <CardHeader>
            <CardTitle>A5. Isolation & Lock Out/Tag Out (LOTO)</CardTitle>
            <CardDescription>Specify if isolation is required</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresIsolation"
                checked={form.watch('requiresIsolation')}
                onCheckedChange={(checked) => form.setValue('requiresIsolation', checked as boolean)}
                disabled={isReadOnly}
              />
              <Label htmlFor="requiresIsolation" className="font-normal">
                This work requires isolation (LOTO)
              </Label>
            </div>

            {form.watch('requiresIsolation') && (
              <div className="space-y-2">
                <Label htmlFor="isolationDetails">Isolation Details</Label>
                <Textarea
                  id="isolationDetails"
                  {...form.register('isolationDetails')}
                  disabled={isReadOnly}
                  rows={3}
                  placeholder="Describe isolation points, lock numbers, tag numbers, etc."
                />
                {form.formState.errors.isolationDetails && (
                  <p className="text-sm text-destructive">{form.formState.errors.isolationDetails.message}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* A6: PPE Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>A6. Personal Protective Equipment (PPE)</CardTitle>
            <CardDescription>Check all required PPE for this work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hardHat"
                  checked={form.watch('ppe.hardHat')}
                  onCheckedChange={(checked) => form.setValue('ppe.hardHat', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="hardHat" className="font-normal">Hard Hat</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="safetyGlasses"
                  checked={form.watch('ppe.safetyGlasses')}
                  onCheckedChange={(checked) => form.setValue('ppe.safetyGlasses', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="safetyGlasses" className="font-normal">Safety Glasses</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="safetyShoes"
                  checked={form.watch('ppe.safetyShoes')}
                  onCheckedChange={(checked) => form.setValue('ppe.safetyShoes', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="safetyShoes" className="font-normal">Safety Shoes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gloves"
                  checked={form.watch('ppe.gloves')}
                  onCheckedChange={(checked) => form.setValue('ppe.gloves', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="gloves" className="font-normal">Gloves</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="highVisVest"
                  checked={form.watch('ppe.highVisVest')}
                  onCheckedChange={(checked) => form.setValue('ppe.highVisVest', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="highVisVest" className="font-normal">High Visibility Vest</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hearingProtection"
                  checked={form.watch('ppe.hearingProtection')}
                  onCheckedChange={(checked) => form.setValue('ppe.hearingProtection', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="hearingProtection" className="font-normal">Hearing Protection</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="respirator"
                  checked={form.watch('ppe.respirator')}
                  onCheckedChange={(checked) => form.setValue('ppe.respirator', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="respirator" className="font-normal">Respirator/Face Mask</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fallProtection"
                  checked={form.watch('ppe.fallProtection')}
                  onCheckedChange={(checked) => form.setValue('ppe.fallProtection', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="fallProtection" className="font-normal">Fall Protection/Harness</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ppeOther">Other PPE</Label>
              <Input
                id="ppeOther"
                {...form.register('ppe.other')}
                disabled={isReadOnly}
                placeholder="Specify any other required PPE"
              />
            </div>
          </CardContent>
        </Card>

        {/* A7: Emergency Information */}
        <Card>
          <CardHeader>
            <CardTitle>A7. Emergency Information</CardTitle>
            <CardDescription>Emergency contacts and locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="musterPoint">Muster Point *</Label>
                <Input
                  id="musterPoint"
                  {...form.register('musterPoint')}
                  disabled={isReadOnly}
                  placeholder="e.g., Main gate parking area"
                />
                {form.formState.errors.musterPoint && (
                  <p className="text-sm text-destructive">{form.formState.errors.musterPoint.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact Number *</Label>
                <Input
                  id="emergencyContact"
                  {...form.register('emergencyContact')}
                  disabled={isReadOnly}
                  placeholder="e.g., +1234567890"
                />
                {form.formState.errors.emergencyContact && (
                  <p className="text-sm text-destructive">{form.formState.errors.emergencyContact.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstAidLocation">First Aid Kit Location *</Label>
                <Input
                  id="firstAidLocation"
                  {...form.register('firstAidLocation')}
                  disabled={isReadOnly}
                  placeholder="e.g., Security office"
                />
                {form.formState.errors.firstAidLocation && (
                  <p className="text-sm text-destructive">{form.formState.errors.firstAidLocation.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fireExtinguisherLocation">Fire Extinguisher Location *</Label>
                <Input
                  id="fireExtinguisherLocation"
                  {...form.register('fireExtinguisherLocation')}
                  disabled={isReadOnly}
                  placeholder="e.g., Near entrance, on wall"
                />
                {form.formState.errors.fireExtinguisherLocation && (
                  <p className="text-sm text-destructive">{form.formState.errors.fireExtinguisherLocation.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* A8: Risk Controls */}
        <Card>
          <CardHeader>
            <CardTitle>A8. Risk Controls & Safety Measures</CardTitle>
            <CardDescription>Confirm all required safety controls are in place</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="areaBarricaded"
                  checked={form.watch('riskControls.areaBarricaded')}
                  onCheckedChange={(checked) => form.setValue('riskControls.areaBarricaded', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="areaBarricaded" className="font-normal">Work area barricaded/cordoned off</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="signagePosted"
                  checked={form.watch('riskControls.signagePosted')}
                  onCheckedChange={(checked) => form.setValue('riskControls.signagePosted', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="signagePosted" className="font-normal">Warning signage posted</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fireExtinguisherAvailable"
                  checked={form.watch('riskControls.fireExtinguisherAvailable')}
                  onCheckedChange={(checked) => form.setValue('riskControls.fireExtinguisherAvailable', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="fireExtinguisherAvailable" className="font-normal">Fire extinguisher available</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fireWatchAssigned"
                  checked={form.watch('riskControls.fireWatchAssigned')}
                  onCheckedChange={(checked) => form.setValue('riskControls.fireWatchAssigned', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="fireWatchAssigned" className="font-normal">Fire watch assigned (if required)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emergencyPlanReviewed"
                  checked={form.watch('riskControls.emergencyPlanReviewed')}
                  onCheckedChange={(checked) => form.setValue('riskControls.emergencyPlanReviewed', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="emergencyPlanReviewed" className="font-normal">Emergency plan reviewed with team</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="toolboxTalkCompleted"
                  checked={form.watch('riskControls.toolboxTalkCompleted')}
                  onCheckedChange={(checked) => form.setValue('riskControls.toolboxTalkCompleted', checked as boolean)}
                  disabled={isReadOnly}
                />
                <Label htmlFor="toolboxTalkCompleted" className="font-normal">Toolbox talk completed</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskControlComments">Additional Risk Control Measures</Label>
              <Textarea
                id="riskControlComments"
                {...form.register('riskControlComments')}
                disabled={isReadOnly}
                rows={3}
                placeholder="Describe any additional safety measures or controls..."
              />
            </div>
          </CardContent>
        </Card>

        {/* A9: Attachments */}
        <Card>
          <CardHeader>
            <CardTitle>A9. Attachments</CardTitle>
            <CardDescription>Upload related documents (JSA, drawings, certifications, etc.)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isReadOnly && (
              <div className="space-y-2">
                <Label htmlFor="fileUpload">Upload Files</Label>
                <Input
                  id="fileUpload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isReadOnly}
                  className="cursor-pointer"
                />
              </div>
            )}

            {attachmentFields && attachmentFields.length > 0 && (
              <div className="space-y-2">
                <Label>Attached Files:</Label>
                <div className="space-y-2">
                  {attachmentFields.map((field, index) => (
                    <div key={field.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{form.watch(`attachments.${index}.filename`)}</span>
                      </div>
                      {!isReadOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
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

        {/* A10: Contractor Declaration */}
        <Card>
          <CardHeader>
            <CardTitle>A10. Contractor Declaration</CardTitle>
            <CardDescription>Contractor must confirm and sign below</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted p-4 text-sm">
              <p className="mb-3">
                I, the undersigned contractor representative, hereby declare that:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>All information provided in this permit is accurate and complete</li>
                <li>All workers are trained and competent for the assigned tasks</li>
                <li>Required PPE and safety equipment are available and in good condition</li>
                <li>All workers have been briefed on the work scope and safety requirements</li>
                <li>I understand and will comply with all Unilever safety rules and procedures</li>
              </ul>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="contractorDeclaration"
                checked={form.watch('contractorDeclaration')}
                onCheckedChange={(checked) => form.setValue('contractorDeclaration', checked as boolean)}
                disabled={isReadOnly}
                className="mt-1"
              />
              <Label htmlFor="contractorDeclaration" className="font-normal">
                I agree to the above declaration and confirm all information is correct *
              </Label>
            </div>
            {form.formState.errors.contractorDeclaration && (
              <p className="text-sm text-destructive">{form.formState.errors.contractorDeclaration.message}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="contractorDeclarationName">Contractor Representative Name *</Label>
              <Input
                id="contractorDeclarationName"
                {...form.register('contractorDeclarationName')}
                disabled={isReadOnly}
                placeholder="Enter your full name"
              />
              {form.formState.errors.contractorDeclarationName && (
                <p className="text-sm text-destructive">{form.formState.errors.contractorDeclarationName.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* A11: Approval Placeholders */}
        <Card>
          <CardHeader>
            <CardTitle>A11. Approvals</CardTitle>
            <CardDescription>This section will be completed by reviewers after submission</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Security Review</span>
                <span className="font-medium">Pending</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>Facilities Review (if required)</span>
                <span className="font-medium">Pending</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>EFS Review (if required)</span>
                <span className="font-medium">Pending</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <span>HSE Final Approval</span>
                <span className="font-medium">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isReadOnly && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleSaveDraft}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>

              <Button type="submit">
                <Send className="mr-2 h-4 w-4" />
                Submit Permit
              </Button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
