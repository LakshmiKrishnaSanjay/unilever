'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface PipeworkIsolationFormData {
  certificateNumber?: string;
  supportsMasterPermitNo?: string;
  pipeSystemDescription?: string;
  pipeContent?: string;
  isolationMethod?: string;
  pipeDrained?: boolean;
  pipeCleanedFlushed?: boolean;
  pipeVentedDepressurized?: boolean;
  hydrotestRequired?: 'YES' | 'NO';
  hydrotestCertificateRef?: string;
  restoredBy?: string;
  restoreTime?: string;
}

interface PipeworkIsolationFormProps {
  data: PipeworkIsolationFormData;
  onChange: (data: PipeworkIsolationFormData) => void;
  readOnly?: boolean;
}

const isolationMethods = [
  'Double Block & Bleed',
  'Spectacle Blind',
  'Spade/Slip Plate',
  'Line Blanking',
  'Valve Isolation with Lock',
  'Other',
];

export function PipeworkIsolationForm({ data, onChange, readOnly = false }: PipeworkIsolationFormProps) {
  const updateField = (field: keyof PipeworkIsolationFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  if (readOnly) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipework Isolation Certificate (Form B6)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Certificate Number</p>
                <p className="mt-1 font-mono">{data.certificateNumber || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supports Master Permit No.</p>
                <p className="mt-1">{data.supportsMasterPermitNo || 'Not specified'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Pipe System Description</p>
              <p className="mt-1">{data.pipeSystemDescription || 'Not specified'}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pipe Content</p>
                <p className="mt-1">{data.pipeContent || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Isolation Method</p>
                <p className="mt-1">{data.isolationMethod || 'Not specified'}</p>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              <p className="text-sm font-medium">Isolation Checks</p>
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${data.pipeDrained ? 'bg-primary border-primary' : 'border-input'}`}>
                    {data.pipeDrained && (
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">Pipe Drained</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${data.pipeCleanedFlushed ? 'bg-primary border-primary' : 'border-input'}`}>
                    {data.pipeCleanedFlushed && (
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">Pipe Cleaned/Flushed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${data.pipeVentedDepressurized ? 'bg-primary border-primary' : 'border-input'}`}>
                    {data.pipeVentedDepressurized && (
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">Pipe Vented/Depressurized</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hydrotest Required</p>
                <p className={`mt-1 font-medium ${data.hydrotestRequired === 'YES' ? 'text-orange-600' : 'text-muted-foreground'}`}>
                  {data.hydrotestRequired || 'Not specified'}
                </p>
              </div>
              {data.hydrotestRequired === 'YES' && data.hydrotestCertificateRef && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Hydrotest Certificate Ref</p>
                  <p className="mt-1 font-mono">{data.hydrotestCertificateRef}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {(data.restoredBy || data.restoreTime) && (
          <Card>
            <CardHeader>
              <CardTitle>Restoration/Cancellation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {data.restoredBy && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Restored By</p>
                    <p className="mt-1">{data.restoredBy}</p>
                  </div>
                )}
                {data.restoreTime && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Restore Time</p>
                    <p className="mt-1">{data.restoreTime}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pipework Isolation Certificate (Form B6)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Certificate Number *</Label>
              <Input
                value={data.certificateNumber}
                onChange={(e) => updateField('certificateNumber', e.target.value)}
                placeholder="e.g., PIC-2025-001"
              />
            </div>

            <div className="space-y-2">
              <Label>Supports Master Permit No.</Label>
              <Input
                value={data.supportsMasterPermitNo}
                onChange={(e) => updateField('supportsMasterPermitNo', e.target.value)}
                placeholder="Master PTW reference"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Pipe System Description *</Label>
            <Input
              value={data.pipeSystemDescription}
              onChange={(e) => updateField('pipeSystemDescription', e.target.value)}
              placeholder="e.g., Cooling water line, Steam header"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Pipe Content *</Label>
              <Input
                value={data.pipeContent}
                onChange={(e) => updateField('pipeContent', e.target.value)}
                placeholder="e.g., Water, Steam, Gas, Chemical"
              />
            </div>

            <div className="space-y-2">
              <Label>Isolation Method *</Label>
              <Select value={data.isolationMethod} onValueChange={(v) => updateField('isolationMethod', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {isolationMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Isolation Verification *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="pipeDrained"
              checked={data.pipeDrained || false}
              onCheckedChange={(checked) => updateField('pipeDrained', checked as boolean)}
            />
            <Label htmlFor="pipeDrained" className="font-normal cursor-pointer">
              Pipe Drained
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pipeCleanedFlushed"
              checked={data.pipeCleanedFlushed || false}
              onCheckedChange={(checked) => updateField('pipeCleanedFlushed', checked as boolean)}
            />
            <Label htmlFor="pipeCleanedFlushed" className="font-normal cursor-pointer">
              Pipe Cleaned/Flushed
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pipeVentedDepressurized"
              checked={data.pipeVentedDepressurized || false}
              onCheckedChange={(checked) => updateField('pipeVentedDepressurized', checked as boolean)}
            />
            <Label htmlFor="pipeVentedDepressurized" className="font-normal cursor-pointer">
              Pipe Vented/Depressurized
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hydrotest Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Hydrotest Required *</Label>
            <Select
              value={data.hydrotestRequired || 'NO'}
              onValueChange={(v) => updateField('hydrotestRequired', v as 'YES' | 'NO')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YES">YES - Hydrotest Required</SelectItem>
                <SelectItem value="NO">NO - Not Required</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {data.hydrotestRequired === 'YES' && (
            <div className="space-y-2">
              <Label>Hydrotest Certificate Reference</Label>
              <Input
                value={data.hydrotestCertificateRef}
                onChange={(e) => updateField('hydrotestCertificateRef', e.target.value)}
                placeholder="Certificate reference number"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restoration/Cancellation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Restored By</Label>
              <Input
                value={data.restoredBy}
                onChange={(e) => updateField('restoredBy', e.target.value)}
                placeholder="Name of person restoring"
              />
            </div>

            <div className="space-y-2">
              <Label>Restore Date & Time</Label>
              <Input
                type="datetime-local"
                value={data.restoreTime}
                onChange={(e) => updateField('restoreTime', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
