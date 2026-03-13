'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ConfinedSpaceFormData {
  confinedSpaceLocation?: string;
  spaceDescription?: string;
  purposeOfEntry?: string;
  expectedDurationHours?: number;
  safetyRequirements?: Record<string, 'YES' | 'NO'>;
  oxygenResult?: string;
  lelResult?: string;
  coResult?: string;
  h2sResult?: string;
  toxicGasesResult?: string;
  testTime?: string;
  testedBy?: string;
  breathingApparatusRequired?: string;
  ventilationEquipment?: string;
  airFlowRateCfm?: number;
  monitoringFrequencyMinutes?: number;
  electricalIsolationCertNo?: string;
  pipeworkIsolationCertNo?: string;
  mechanicalIsolationCertNo?: string;
  otherIsolationCertNo?: string;
  entryAuthorization?: string;
  exitConfirmation?: string;
}

interface ConfinedSpaceFormProps {
  data: ConfinedSpaceFormData;
  onChange: (data: ConfinedSpaceFormData) => void;
  readOnly?: boolean;
}

const safetyRequirementsList = [
  'Atmospheric testing completed',
  'Ventilation system operational',
  'Emergency rescue equipment available',
  'Communication system established',
  'Entry supervisor designated',
  'Standby person assigned',
  'Training records verified',
  'All isolations confirmed',
];

export function ConfinedSpaceForm({ data, onChange, readOnly = false }: ConfinedSpaceFormProps) {
  const updateField = (field: keyof ConfinedSpaceFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const updateSafetyRequirement = (requirement: string, value: 'YES' | 'NO') => {
    const current = data.safetyRequirements || {};
    updateField('safetyRequirements', { ...current, [requirement]: value });
  };

  if (readOnly) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Confined Space Entry Permit (Form B3)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Confined Space Location</p>
              <p className="mt-1">{data.confinedSpaceLocation || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Space Description</p>
              <p className="mt-1 whitespace-pre-wrap">{data.spaceDescription || 'Not specified'}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Purpose of Entry</p>
                <p className="mt-1">{data.purposeOfEntry || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expected Duration (hours)</p>
                <p className="mt-1">{data.expectedDurationHours || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Safety Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {safetyRequirementsList.map((req) => {
                const value = data.safetyRequirements?.[req] || 'NO';
                return (
                  <div key={req} className="flex items-center justify-between rounded-lg border p-2">
                    <span className="text-sm">{req}</span>
                    <span className={`text-sm font-medium ${value === 'YES' ? 'text-green-600' : 'text-red-600'}`}>
                      {value}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atmospheric Testing Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Oxygen (19.5-23.5%)</p>
                <p className="mt-1">{data.oxygenResult || 'Not tested'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">LEL ({'<'}10%)</p>
                <p className="mt-1">{data.lelResult || 'Not tested'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">CO ({'<'}35 ppm)</p>
                <p className="mt-1">{data.coResult || 'Not tested'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">H2S ({'<'}10 ppm)</p>
                <p className="mt-1">{data.h2sResult || 'Not tested'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Toxic Gases</p>
                <p className="mt-1">{data.toxicGasesResult || 'Not tested'}</p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Test Time</p>
                <p className="mt-1">{data.testTime || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tested By</p>
                <p className="mt-1">{data.testedBy || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Breathing Apparatus & Ventilation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Breathing Apparatus Required</p>
                <p className="mt-1">{data.breathingApparatusRequired || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ventilation Equipment</p>
                <p className="mt-1">{data.ventilationEquipment || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Air Flow Rate (CFM)</p>
                <p className="mt-1">{data.airFlowRateCfm || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monitoring Frequency (Minutes)</p>
                <p className="mt-1">{data.monitoringFrequencyMinutes || 15}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Isolation Certificate Numbers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.electricalIsolationCertNo && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Electrical Isolation</p>
                <p className="mt-1">{data.electricalIsolationCertNo}</p>
              </div>
            )}
            {data.pipeworkIsolationCertNo && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pipework Isolation</p>
                <p className="mt-1">{data.pipeworkIsolationCertNo}</p>
              </div>
            )}
            {data.mechanicalIsolationCertNo && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Mechanical Isolation</p>
                <p className="mt-1">{data.mechanicalIsolationCertNo}</p>
              </div>
            )}
            {data.otherIsolationCertNo && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Other Isolation</p>
                <p className="mt-1">{data.otherIsolationCertNo}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Confined Space Entry Permit (Form B3)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Confined Space Location *</Label>
            <Input
              value={data.confinedSpaceLocation}
              onChange={(e) => updateField('confinedSpaceLocation', e.target.value)}
              placeholder="Specify exact location of confined space"
            />
          </div>

          <div className="space-y-2">
            <Label>Space Description *</Label>
            <Textarea
              value={data.spaceDescription}
              onChange={(e) => updateField('spaceDescription', e.target.value)}
              placeholder="Describe the confined space (dimensions, access points, hazards)"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Purpose of Entry *</Label>
              <Input
                value={data.purposeOfEntry}
                onChange={(e) => updateField('purposeOfEntry', e.target.value)}
                placeholder="Why entry is required"
              />
            </div>

            <div className="space-y-2">
              <Label>Expected Duration (hours) *</Label>
              <Input
                type="number"
                value={data.expectedDurationHours}
                onChange={(e) => updateField('expectedDurationHours', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                step="0.5"
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Safety Requirements *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {safetyRequirementsList.map((requirement) => (
              <div key={requirement} className="flex items-center justify-between rounded-lg border p-3">
                <span className="text-sm">{requirement}</span>
                <Select
                  value={data.safetyRequirements?.[requirement] || 'NO'}
                  onValueChange={(v) => updateSafetyRequirement(requirement, v as 'YES' | 'NO')}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YES">YES</SelectItem>
                    <SelectItem value="NO">NO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atmospheric Testing Results *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Oxygen % (Safe: 19.5-23.5%)</Label>
              <Input
                value={data.oxygenResult}
                onChange={(e) => updateField('oxygenResult', e.target.value)}
                placeholder="e.g., 20.9%"
              />
            </div>

            <div className="space-y-2">
              <Label>LEL % (Safe: {'<'}10%)</Label>
              <Input
                value={data.lelResult}
                onChange={(e) => updateField('lelResult', e.target.value)}
                placeholder="e.g., 0%"
              />
            </div>

            <div className="space-y-2">
              <Label>CO ppm (Safe: {'<'}35 ppm)</Label>
              <Input
                value={data.coResult}
                onChange={(e) => updateField('coResult', e.target.value)}
                placeholder="e.g., 0 ppm"
              />
            </div>

            <div className="space-y-2">
              <Label>H2S ppm (Safe: {'<'}10 ppm)</Label>
              <Input
                value={data.h2sResult}
                onChange={(e) => updateField('h2sResult', e.target.value)}
                placeholder="e.g., 0 ppm"
              />
            </div>

            <div className="space-y-2">
              <Label>Toxic Gases</Label>
              <Input
                value={data.toxicGasesResult}
                onChange={(e) => updateField('toxicGasesResult', e.target.value)}
                placeholder="List any toxic gases detected"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Test Time *</Label>
              <Input
                type="time"
                value={data.testTime}
                onChange={(e) => updateField('testTime', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tested By *</Label>
              <Input
                value={data.testedBy}
                onChange={(e) => updateField('testedBy', e.target.value)}
                placeholder="Name of tester"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Breathing Apparatus & Air Moving Equipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Breathing Apparatus Required *</Label>
              <Select
                value={data.breathingApparatusRequired}
                onValueChange={(v) => updateField('breathingApparatusRequired', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YES">YES - Required</SelectItem>
                  <SelectItem value="NO">NO - Not Required</SelectItem>
                  <SelectItem value="STANDBY">STANDBY - Available if needed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ventilation Equipment</Label>
              <Input
                value={data.ventilationEquipment}
                onChange={(e) => updateField('ventilationEquipment', e.target.value)}
                placeholder="e.g., Blower fan, exhaust fan"
              />
            </div>

            <div className="space-y-2">
              <Label>Air Flow Rate (CFM)</Label>
              <Input
                type="number"
                value={data.airFlowRateCfm}
                onChange={(e) => updateField('airFlowRateCfm', parseInt(e.target.value) || 0)}
                placeholder="Cubic feet per minute"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Monitoring Frequency (Minutes)</Label>
              <Input
                type="number"
                value={data.monitoringFrequencyMinutes || 15}
                onChange={(e) => updateField('monitoringFrequencyMinutes', parseInt(e.target.value) || 15)}
                min="5"
                max="60"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Isolation Certificate Numbers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Electrical Isolation Cert No.</Label>
              <Input
                value={data.electricalIsolationCertNo}
                onChange={(e) => updateField('electricalIsolationCertNo', e.target.value)}
                placeholder="Certificate number"
              />
            </div>

            <div className="space-y-2">
              <Label>Pipework Isolation Cert No.</Label>
              <Input
                value={data.pipeworkIsolationCertNo}
                onChange={(e) => updateField('pipeworkIsolationCertNo', e.target.value)}
                placeholder="Certificate number"
              />
            </div>

            <div className="space-y-2">
              <Label>Mechanical Isolation Cert No.</Label>
              <Input
                value={data.mechanicalIsolationCertNo}
                onChange={(e) => updateField('mechanicalIsolationCertNo', e.target.value)}
                placeholder="Certificate number"
              />
            </div>

            <div className="space-y-2">
              <Label>Other Isolation Cert No.</Label>
              <Input
                value={data.otherIsolationCertNo}
                onChange={(e) => updateField('otherIsolationCertNo', e.target.value)}
                placeholder="Certificate number"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
