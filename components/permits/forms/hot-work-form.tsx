'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface HotWorkFormData {
  typeOfHotWork?: string;
  equipmentBeingUsed?: string;
  exactWorkLocation?: string;
  startTime?: string;
  expectedFinishTime?: string;
  firePrevention?: string[];
  fireWatchPersonName?: string;
  fireWatchContactNumber?: string;
  fireWatchDurationPostWorkMinutes?: number;
  emergencyContactNumber?: string;
  fireAssemblyPoint?: string;
  additionalEmergencyNotes?: string;
}

interface HotWorkFormProps {
  data: HotWorkFormData;
  onChange: (data: HotWorkFormData) => void;
  readOnly?: boolean;
}

const hotWorkTypes = [
  'Welding',
  'Grinding',
  'Cutting',
  'Brazing',
  'Soldering',
  'Other',
];

const firePreventionChecks = [
  'Area cleared of combustible materials',
  'Fire extinguisher available',
  'Fire blanket available',
  'Hot work shield/screen in place',
  'Ventilation adequate',
  'Adjacent areas protected',
  'Permit posted at work location',
];

export function HotWorkForm({ data, onChange, readOnly = false }: HotWorkFormProps) {
  const updateField = (field: keyof HotWorkFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const toggleFirePreventionCheck = (check: string) => {
    const current = data.firePrevention || [];
    const updated = current.includes(check)
      ? current.filter((c) => c !== check)
      : [...current, check];
    updateField('firePrevention', updated);
  };

  if (readOnly) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hot Work Permit Details (Form B1)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type of Hot Work</p>
                <p className="mt-1">{data.typeOfHotWork || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Equipment Being Used</p>
                <p className="mt-1">{data.equipmentBeingUsed || 'Not specified'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Exact Work Location</p>
                <p className="mt-1">{data.exactWorkLocation || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Start Time</p>
                <p className="mt-1">{data.startTime || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expected Finish Time</p>
                <p className="mt-1">{data.expectedFinishTime || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fire Prevention Precautions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {firePreventionChecks.map((check) => (
                <div key={check} className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${(data.firePrevention || []).includes(check) ? 'bg-primary border-primary' : 'border-input'}`}>
                    {(data.firePrevention || []).includes(check) && (
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">{check}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fire Watch Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fire Watch Person Name</p>
                <p className="mt-1">{data.fireWatchPersonName || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                <p className="mt-1">{data.fireWatchContactNumber || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duration Post Work (Minutes)</p>
                <p className="mt-1">{data.fireWatchDurationPostWorkMinutes || 60}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emergency Response</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emergency Contact Number</p>
                <p className="mt-1">{data.emergencyContactNumber || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fire Assembly Point</p>
                <p className="mt-1">{data.fireAssemblyPoint || 'Not specified'}</p>
              </div>
              {data.additionalEmergencyNotes && (
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Additional Emergency Notes</p>
                  <p className="mt-1 whitespace-pre-wrap">{data.additionalEmergencyNotes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hot Work Permit Details (Form B1)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Type of Hot Work *</Label>
              <Select value={data.typeOfHotWork ?? "" } onValueChange={(v) => updateField('typeOfHotWork', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {hotWorkTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Equipment Being Used *</Label>
              <Input
                value={data.equipmentBeingUsed ?? ""}
                onChange={(e) => updateField('equipmentBeingUsed', e.target.value)}
                placeholder="e.g., Arc welder, Angle grinder"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Exact Work Location *</Label>
              <Input
                value={data.exactWorkLocation ?? "" }
                onChange={(e) => updateField('exactWorkLocation', e.target.value)}
                placeholder="Specify exact location"
              />
            </div>

            <div className="space-y-2">
              <Label>Start Time *</Label>
              <Input
                type="time"
                value={data.startTime ?? ""}
                onChange={(e) => updateField('startTime', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Finish Time *</Label>
              <Input
                type="time"
                value={data.expectedFinishTime ?? ""}
                onChange={(e) => updateField('expectedFinishTime', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fire Prevention Precautions *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {firePreventionChecks.map((check) => (
              <div key={check} className="flex items-center space-x-2">
                <Checkbox
                  id={check}
                  checked={(data.firePrevention || []).includes(check)}
                  onCheckedChange={() => toggleFirePreventionCheck(check)}
                />
                <Label htmlFor={check} className="font-normal cursor-pointer">
                  {check}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fire Watch Requirements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Fire Watch Person Name *</Label>
              <Input
                value={data.fireWatchPersonName ?? ""}
                onChange={(e) => updateField('fireWatchPersonName', e.target.value)}
                placeholder="Full name"
              />
            </div>

            <div className="space-y-2">
              <Label>Fire Watch Contact Number *</Label>
              <Input
                value={data.fireWatchContactNumber ?? ""}
                onChange={(e) => updateField('fireWatchContactNumber', e.target.value)}
                placeholder="+234 xxx xxx xxxx"
              />
            </div>

            <div className="space-y-2">
              <Label>Fire Watch Duration Post Work (Minutes)</Label>
<Input
  type="number"
  value={data.fireWatchDurationPostWorkMinutes ?? 60}
  onChange={(e) => {
    const v = e.target.value;
    updateField(
      "fireWatchDurationPostWorkMinutes",
      v === "" ? undefined : Number(v)
    );
  }}
  min={30}
  max={240}
/>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Response</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Emergency Contact Number *</Label>
              <Input
                value={data.emergencyContactNumber ?? ""}
                onChange={(e) => updateField('emergencyContactNumber', e.target.value)}
                placeholder="Emergency hotline"
              />
            </div>

            <div className="space-y-2">
              <Label>Fire Assembly Point *</Label>
              <Input
                value={data.fireAssemblyPoint ?? ""}
                onChange={(e) => updateField('fireAssemblyPoint', e.target.value)}
                placeholder="Assembly point location"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Additional Emergency Notes</Label>
              <Textarea
                value={data.additionalEmergencyNotes ?? ""}
                onChange={(e) => updateField('additionalEmergencyNotes', e.target.value)}
                placeholder="Any additional emergency procedures or contacts"
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
