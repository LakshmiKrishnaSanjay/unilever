'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ElectricalIsolationFormData {
  certificateNumber?: string;
  supportsMasterPermitNo?: string;
  equipmentSystemToBeIsolated?: string;
  location?: string;
  voltage?: string;
  isolationMethod?: string;
  isolatedBy?: string;
  isolationTime?: string;
  requestedBy?: string;
  restoreTime?: string;
}

interface ElectricalIsolationFormProps {
  data: ElectricalIsolationFormData;
  onChange: (data: ElectricalIsolationFormData) => void;
  readOnly?: boolean;
}

const voltageOptions = [
  'Low Voltage (LV) - <1000V',
  'Medium Voltage (MV) - 1kV to 35kV',
  'High Voltage (HV) - >35kV',
];

export function ElectricalIsolationForm({ data, onChange, readOnly = false }: ElectricalIsolationFormProps) {
  const updateField = (field: keyof ElectricalIsolationFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  if (readOnly) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Power/Electrical Isolation Certificate (Form B5)</CardTitle>
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
              <p className="text-sm font-medium text-muted-foreground">Equipment/System to be Isolated</p>
              <p className="mt-1">{data.equipmentSystemToBeIsolated || 'Not specified'}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="mt-1">{data.location || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Voltage</p>
                <p className="mt-1">{data.voltage || 'Not specified'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Isolation Method</p>
              <p className="mt-1 whitespace-pre-wrap">{data.isolationMethod || 'Not specified'}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Isolated By</p>
                <p className="mt-1">{data.isolatedBy || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Isolation Time</p>
                <p className="mt-1">{data.isolationTime || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(data.requestedBy || data.restoreTime) && (
          <Card>
            <CardHeader>
              <CardTitle>Restoration Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {data.requestedBy && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Requested By</p>
                    <p className="mt-1">{data.requestedBy}</p>
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
          <CardTitle>Power/Electrical Isolation Certificate (Form B5)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Certificate Number *</Label>
              <Input
                value={data.certificateNumber}
                onChange={(e) => updateField('certificateNumber', e.target.value)}
                placeholder="e.g., EIC-2025-001"
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
            <Label>Equipment/System to be Isolated *</Label>
            <Input
              value={data.equipmentSystemToBeIsolated}
              onChange={(e) => updateField('equipmentSystemToBeIsolated', e.target.value)}
              placeholder="e.g., Main distribution board, Motor control panel"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input
                value={data.location}
                onChange={(e) => updateField('location', e.target.value)}
                placeholder="Equipment location"
              />
            </div>

            <div className="space-y-2">
              <Label>Voltage *</Label>
              <Select value={data.voltage} onValueChange={(v) => updateField('voltage', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select voltage" />
                </SelectTrigger>
                <SelectContent>
                  {voltageOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Isolation Method *</Label>
            <Textarea
              value={data.isolationMethod}
              onChange={(e) => updateField('isolationMethod', e.target.value)}
              placeholder="Describe isolation steps: lockout/tagout procedures, isolation points, verification methods"
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Isolated By *</Label>
              <Input
                value={data.isolatedBy}
                onChange={(e) => updateField('isolatedBy', e.target.value)}
                placeholder="Authorized electrician name"
              />
            </div>

            <div className="space-y-2">
              <Label>Isolation Date & Time *</Label>
              <Input
                type="datetime-local"
                value={data.isolationTime}
                onChange={(e) => updateField('isolationTime', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restoration Request</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Restoration Requested By</Label>
              <Input
                value={data.requestedBy}
                onChange={(e) => updateField('requestedBy', e.target.value)}
                placeholder="Work requestor name"
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
