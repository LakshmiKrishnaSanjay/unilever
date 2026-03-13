import { HotWorkForm, type HotWorkFormData } from './hot-work-form';
import { WorkAtHeightForm, type WorkAtHeightFormData } from './work-at-height-form';
import { ConfinedSpaceForm, type ConfinedSpaceFormData } from './confined-space-form';
import { ExcavationForm, type ExcavationFormData } from './excavation-form';
import { ElectricalIsolationForm, type ElectricalIsolationFormData } from './electrical-isolation-form';
import { PipeworkIsolationForm, type PipeworkIsolationFormData } from './pipework-isolation-form';
import type { PermitType } from '@/lib/types';

export type SupportingPermitData =
  | HotWorkFormData
  | WorkAtHeightFormData
  | ConfinedSpaceFormData
  | ExcavationFormData
  | ElectricalIsolationFormData
  | PipeworkIsolationFormData;

export interface SupportingPermit {
  type: PermitType;
  data: SupportingPermitData;
}

interface PermitFormComponentProps {
  data: SupportingPermitData;
  onChange: (data: SupportingPermitData) => void;
  readOnly?: boolean;
}

export const PERMIT_FORMS: Record<PermitType, React.ComponentType<PermitFormComponentProps> | null> = {
  MASTER: null, // Master permit doesn't have a supporting form
  HOT_WORK: HotWorkForm as React.ComponentType<PermitFormComponentProps>,
  WORK_AT_HEIGHT: WorkAtHeightForm as React.ComponentType<PermitFormComponentProps>,
  CONFINED_SPACE: ConfinedSpaceForm as React.ComponentType<PermitFormComponentProps>,
  EXCAVATION: ExcavationForm as React.ComponentType<PermitFormComponentProps>,
  ELECTRICAL_ISOLATION: ElectricalIsolationForm as React.ComponentType<PermitFormComponentProps>,
  PIPEWORK_ISOLATION: PipeworkIsolationForm as React.ComponentType<PermitFormComponentProps>,
};

export const PERMIT_FORM_NAMES: Record<PermitType, string> = {
  MASTER: 'Master Permit to Work',
  HOT_WORK: 'Hot Work Permit (Form B1)',
  WORK_AT_HEIGHT: 'Work at Height Permit (Form B2)',
  CONFINED_SPACE: 'Confined Space Entry Permit (Form B3)',
  EXCAVATION: 'Excavation/Demolition Permit (Form B4)',
  ELECTRICAL_ISOLATION: 'Power/Electrical Isolation Certificate (Form B5)',
  PIPEWORK_ISOLATION: 'Pipework Isolation Certificate (Form B6)',
};

export {
  HotWorkForm,
  WorkAtHeightForm,
  ConfinedSpaceForm,
  ExcavationForm,
  ElectricalIsolationForm,
  PipeworkIsolationForm,
};

export type {
  HotWorkFormData,
  WorkAtHeightFormData,
  ConfinedSpaceFormData,
  ExcavationFormData,
  ElectricalIsolationFormData,
  PipeworkIsolationFormData,
};
