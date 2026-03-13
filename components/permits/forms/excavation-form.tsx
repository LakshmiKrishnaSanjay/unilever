'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ExcavationFormData {
  excavationLocation?: string;
  plannedDepthMeters?: number;
  lengthMeters?: number;
  widthMeters?: number;
  purposeOfExcavation?: string;
  equipmentToBeUsed?: string;
  undergroundCableSurvey?: 'YES' | 'NO';
  undergroundServicesSurvey?: 'YES' | 'NO';
  shoringSupportRequired?: string;
  dewateringRequired?: string;
  barricadingFencing?: string;
  accessEgressPoints?: string;
  spoilDisposalMethod?: string;
}

interface ExcavationFormProps {
  data: ExcavationFormData;
  onChange: (data: ExcavationFormData) => void;
  readOnly?: boolean;
}

export function ExcavationForm({ data, onChange, readOnly = false }: ExcavationFormProps) {
  const updateField = (field: keyof ExcavationFormData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  if (readOnly) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Excavation/Demolition Permit (Form B4)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Excavation Location</p>
              <p className="mt-1">{data.excavationLocation || 'Not specified'}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Planned Depth (meters)</p>
                <p className="mt-1">{data.plannedDepthMeters || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Length (meters)</p>
                <p className="mt-1">{data.lengthMeters || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Width (meters)</p>
                <p className="mt-1">{data.widthMeters || 'Not specified'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Purpose of Excavation</p>
              <p className="mt-1 whitespace-pre-wrap">{data.purposeOfExcavation || 'Not specified'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground">Equipment to be Used</p>
              <p className="mt-1">{data.equipmentToBeUsed || 'Not specified'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Underground Surveys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Underground Cable Survey Completed</span>
              <span className={`text-sm font-medium ${data.undergroundCableSurvey === 'YES' ? 'text-green-600' : 'text-red-600'}`}>
                {data.undergroundCableSurvey || 'NO'}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Underground Services Survey Completed</span>
              <span className={`text-sm font-medium ${data.undergroundServicesSurvey === 'YES' ? 'text-green-600' : 'text-red-600'}`}>
                {data.undergroundServicesSurvey || 'NO'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Excavation Safety Measures</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Shoring/Support Required</p>
              <p className="mt-1">{data.shoringSupportRequired || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Dewatering Required</p>
              <p className="mt-1">{data.dewateringRequired || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Barricading/Fencing</p>
              <p className="mt-1">{data.barricadingFencing || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Access/Egress Points</p>
              <p className="mt-1">{data.accessEgressPoints || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Spoil Disposal Method</p>
              <p className="mt-1">{data.spoilDisposalMethod || 'Not specified'}</p>
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
          <CardTitle>Excavation/Demolition Permit (Form B4)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Excavation Location *</Label>
            <Input
              value={data.excavationLocation}
              onChange={(e) => updateField('excavationLocation', e.target.value)}
              placeholder="Specify exact location of excavation"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Planned Depth (meters) *</Label>
              <Input
                type="number"
                value={data.plannedDepthMeters}
                onChange={(e) => updateField('plannedDepthMeters', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                step="0.1"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Length (meters) *</Label>
              <Input
                type="number"
                value={data.lengthMeters}
                onChange={(e) => updateField('lengthMeters', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                step="0.1"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Width (meters) *</Label>
              <Input
                type="number"
                value={data.widthMeters}
                onChange={(e) => updateField('widthMeters', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                step="0.1"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Purpose of Excavation *</Label>
            <Textarea
              value={data.purposeOfExcavation}
              onChange={(e) => updateField('purposeOfExcavation', e.target.value)}
              placeholder="Describe the purpose and scope of excavation work"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Equipment to be Used *</Label>
            <Input
              value={data.equipmentToBeUsed}
              onChange={(e) => updateField('equipmentToBeUsed', e.target.value)}
              placeholder="e.g., Excavator, backhoe, manual tools"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Underground Surveys *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="font-normal">Underground Cable Survey Completed</Label>
            <Select
              value={data.undergroundCableSurvey || 'NO'}
              onValueChange={(v) => updateField('undergroundCableSurvey', v as 'YES' | 'NO')}
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

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label className="font-normal">Underground Services Survey Completed</Label>
            <Select
              value={data.undergroundServicesSurvey || 'NO'}
              onValueChange={(v) => updateField('undergroundServicesSurvey', v as 'YES' | 'NO')}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Excavation Safety Measures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Shoring/Support Required</Label>
            <Textarea
              value={data.shoringSupportRequired}
              onChange={(e) => updateField('shoringSupportRequired', e.target.value)}
              placeholder="Describe shoring/support systems if required"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Dewatering Required</Label>
            <Textarea
              value={data.dewateringRequired}
              onChange={(e) => updateField('dewateringRequired', e.target.value)}
              placeholder="Describe dewatering methods if required"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Barricading/Fencing *</Label>
            <Input
              value={data.barricadingFencing}
              onChange={(e) => updateField('barricadingFencing', e.target.value)}
              placeholder="Describe barriers and safety fencing"
            />
          </div>

          <div className="space-y-2">
            <Label>Access/Egress Points *</Label>
            <Input
              value={data.accessEgressPoints}
              onChange={(e) => updateField('accessEgressPoints', e.target.value)}
              placeholder="Describe safe access and exit routes"
            />
          </div>

          <div className="space-y-2">
            <Label>Spoil Disposal Method *</Label>
            <Input
              value={data.spoilDisposalMethod}
              onChange={(e) => updateField('spoilDisposalMethod', e.target.value)}
              placeholder="How will excavated material be disposed"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
