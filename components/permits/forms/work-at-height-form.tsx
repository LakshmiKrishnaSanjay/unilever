'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

export interface WorkAtHeightFormData {
  workDescription?: string;
  workingHeightMeters?: number;
  expectedDurationHours?: number;
  equipmentAccessMethod?: string;
  hazards?: string[];
  safetyPrecautions?: string[];
  authorizedPersonnel?: string[];
  extensionTime?: string;
  authorizedBy?: string;
}

interface WorkAtHeightFormProps {
  data: WorkAtHeightFormData;
  onChange: (data: WorkAtHeightFormData) => void;
  readOnly?: boolean;
}

const hazardsList = [
  'Fall from height',
  'Falling objects',
  'Unstable work surface',
  'Weather conditions',
  'Overhead power lines',
  'Inadequate lighting',
  'Fragile roof surfaces',
];

const safetyPrecautionsList = [
  'Scaffolding inspected and tagged',
  'Fall arrest system in use',
  'Safety harness and lanyard checked',
  'Tool tethering in place',
  'Exclusion zone established below',
  'Rescue plan in place',
  'Weather conditions monitored',
  'Competent person supervising',
];

export function WorkAtHeightForm({ data, onChange, readOnly = false }: WorkAtHeightFormProps) {
  const [newPersonnel, setNewPersonnel] = useState('');

  const updateField = (field: keyof WorkAtHeightFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const toggleHazard = (hazard: string) => {
    const current = data.hazards || [];
    const updated = current.includes(hazard)
      ? current.filter((h) => h !== hazard)
      : [...current, hazard];
    updateField('hazards', updated);
  };

  const toggleSafetyPrecaution = (precaution: string) => {
    const current = data.safetyPrecautions || [];
    const updated = current.includes(precaution)
      ? current.filter((p) => p !== precaution)
      : [...current, precaution];
    updateField('safetyPrecautions', updated);
  };

  const addPersonnel = () => {
    if (!newPersonnel.trim()) return;
    const current = data.authorizedPersonnel || [];
    updateField('authorizedPersonnel', [...current, newPersonnel.trim()]);
    setNewPersonnel('');
  };

  const removePersonnel = (index: number) => {
    const current = data.authorizedPersonnel || [];
    updateField('authorizedPersonnel', current.filter((_, i) => i !== index));
  };

  if (readOnly) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Work at Height Permit Details (Form B2)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Work Description</p>
              <p className="mt-1 whitespace-pre-wrap">{data.workDescription || 'Not specified'}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Working Height (meters)</p>
                <p className="mt-1">{data.workingHeightMeters || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expected Duration (hours)</p>
                <p className="mt-1">{data.expectedDurationHours || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Equipment/Access Method</p>
                <p className="mt-1">{data.equipmentAccessMethod || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hazard Identification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hazardsList.map((hazard) => (
                <div key={hazard} className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${(data.hazards || []).includes(hazard) ? 'bg-primary border-primary' : 'border-input'}`}>
                    {(data.hazards || []).includes(hazard) && (
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">{hazard}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Safety Precautions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {safetyPrecautionsList.map((precaution) => (
                <div key={precaution} className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${(data.safetyPrecautions || []).includes(precaution) ? 'bg-primary border-primary' : 'border-input'}`}>
                    {(data.safetyPrecautions || []).includes(precaution) && (
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">{precaution}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {(data.authorizedPersonnel && data.authorizedPersonnel.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Authorized Personnel</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {data.authorizedPersonnel.map((person, index) => (
                  <li key={index} className="text-sm">{person}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {(data.extensionTime || data.authorizedBy) && (
          <Card>
            <CardHeader>
              <CardTitle>Permit Extension</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.extensionTime && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Extension Time</p>
                  <p className="mt-1">{data.extensionTime}</p>
                </div>
              )}
              {data.authorizedBy && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Authorized By</p>
                  <p className="mt-1">{data.authorizedBy}</p>
                </div>
              )}
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
          <CardTitle>Work at Height Permit Details (Form B2)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Work Description *</Label>
            <Textarea
              value={data.workDescription}
              onChange={(e) => updateField('workDescription', e.target.value)}
              placeholder="Describe the work to be performed at height"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Working Height (meters) *</Label>
              <Input
                type="number"
                value={data.workingHeightMeters}
                onChange={(e) => updateField('workingHeightMeters', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                step="0.1"
                min="0"
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

            <div className="space-y-2">
              <Label>Equipment/Access Method *</Label>
              <Input
                value={data.equipmentAccessMethod}
                onChange={(e) => updateField('equipmentAccessMethod', e.target.value)}
                placeholder="e.g., Scaffolding, ladder"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hazard Identification *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hazardsList.map((hazard) => (
              <div key={hazard} className="flex items-center space-x-2">
                <Checkbox
                  id={hazard}
                  checked={(data.hazards || []).includes(hazard)}
                  onCheckedChange={() => toggleHazard(hazard)}
                />
                <Label htmlFor={hazard} className="font-normal cursor-pointer">
                  {hazard}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Safety Precautions *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {safetyPrecautionsList.map((precaution) => (
              <div key={precaution} className="flex items-center space-x-2">
                <Checkbox
                  id={precaution}
                  checked={(data.safetyPrecautions || []).includes(precaution)}
                  onCheckedChange={() => toggleSafetyPrecaution(precaution)}
                />
                <Label htmlFor={precaution} className="font-normal cursor-pointer">
                  {precaution}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Authorized Personnel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newPersonnel}
              onChange={(e) => setNewPersonnel(e.target.value)}
              placeholder="Enter person name"
              onKeyPress={(e) => e.key === 'Enter' && addPersonnel()}
            />
            <Button type="button" onClick={addPersonnel} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {(data.authorizedPersonnel && data.authorizedPersonnel.length > 0) && (
            <div className="space-y-2">
              {data.authorizedPersonnel.map((person, index) => (
                <div key={index} className="flex items-center justify-between rounded-lg border p-2">
                  <span className="text-sm">{person}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePersonnel(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permit Extension (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Extension Time</Label>
              <Input
                type="time"
                value={data.extensionTime}
                onChange={(e) => updateField('extensionTime', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Authorized By</Label>
              <Input
                value={data.authorizedBy}
                onChange={(e) => updateField('authorizedBy', e.target.value)}
                placeholder="Name of authorizing person"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
