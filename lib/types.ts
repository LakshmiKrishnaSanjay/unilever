export type Role =
  | 'super_admin'
  | 'hse_manager'
  | 'stakeholder'
  | 'facilities'
  | 'efs'
  | 'security'
  | 'supervisor'
  | 'contractor_admin'
  | 'contractor_supervisor'
  | 'viewer';

export type MOCStatus =
  | 'DRAFT'
  | 'PENDING_STAKEHOLDER_SIGNOFF'
  | 'PENDING_CONTRACTOR_GATE'
  | 'PENDING_FACILITIES_REVIEW'
  | 'PENDING_STAKEHOLDER_REVIEW'
  | 'PENDING_HSE_APPROVAL'
  | 'APPROVED'
  | 'REJECTED';

export type PTWStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_SECURITY_REVIEW'
  | 'PENDING_FACILITIES_REVIEW'
  | 'PENDING_EFS_REVIEW'
  | 'PENDING_HSE_APPROVAL'
  | 'READY_FOR_ENTRY'
  | 'ACTIVE'
  | 'WORK_COMPLETED'
  | 'WAITING_SUPERVISOR_FINISH'
  | 'WORK_FINISHED'
  | 'PENDING_FACILITIES_CLOSURE'
  | 'PENDING_STAKEHOLDER_CLOSURE'
  | 'PENDING_HSE_CLOSURE'
  | 'CLOSED'
  | 'SENT_BACK';

  export type PTWWorkLog = {
  id: string;
  ptw_id: string;
  logged_by?: string | null;
  current_status: string;
  remarks: string;
  photo_url?: string | null;
  created_at: string | Date;
  updated_at?: string | Date;

    ptws?: {
    id: string;
    title: string;
    location: string;
    status: string;
  } | null;
  
};

export type AttendanceMode = 'DAILY' | 'JOB_WISE';

export type PermitType =
  | 'MASTER'
  | 'HOT_WORK'
  | 'WORK_AT_HEIGHT'
  | 'CONFINED_SPACE'
  | 'EXCAVATION'
  | 'ELECTRICAL_ISOLATION'
  | 'PIPEWORK_ISOLATION';

export interface User {
  contractor_id: any;
  id: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  is_active: boolean;
  createdAt: Date;
}

export interface Contractor {
  id: string;
  companyName: string;
  contactName: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  createdAt: Date;
}

export interface Stakeholder {
  id: string;
  name: string;
  department?: string;
  email?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimelineEntry {
  id: string;
  timestamp: Date;
  user: string;
  role: Role;
  action: string;
  status?: string;
  remarks?: string;
}

export interface StakeholderApproval {
  // OLD (keep)
  stakeholder_role?: string;

  // NEW (assigned stakeholder)
  stakeholder_id?: string;
  name?: string;
  email?: string;

  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  approved_by?: string;
  approved_at?: Date | string;
}

export interface MOCPackDocument {
  type: 'company_certificate' | 'supervisor_details' | 'method_statement' | 'risk_assessment' | 'project_plan';
  file_name?: string;
  uploaded_at?: Date;
  status: 'PENDING' | 'UPLOADED' | 'APPROVED' | 'REJECTED';
}

export interface MOCGate {
  acknowledged: boolean;
  acknowledged_at?: Date;
  acknowledged_by?: string;
  moc_pack_documents: MOCPackDocument[];
  moc_pack_status: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  hse_reviewed_by?: string;
  hse_reviewed_at?: Date;
  hse_remarks?: string;
}

export interface MOC {
  id: string;

  title: string;
  reasonForChange: string | null;
  scope: string | null;
  description: string | null;

  area: string | null;
  exactLocation: string | null;
  riskSummary: string | null;
  contractorCompany: string | null;

  contractor_id?: string | null;

  requester_role: 'HSE' | 'STAKEHOLDER' | null;
  requester_id: string | null;

  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  estimated_cost: number | null;

  startDate: string | null;
  endDate: string | null;

  attendance_mode: AttendanceMode | null;
  status: MOCStatus | null;

  stakeholders: StakeholderApproval[] | null;
  moc_gate: MOCGate | null;
  timeline: TimelineEntry[] | null;

  before_images: string[] | null;
  after_images: string[] | null;

  created_at: string | null;
  updated_at: string | null;
}


export interface Worker {
  name: string;
  badge: string;
  role: string;
  contact?: string;
  badgeId?: string;
  badge_id?: string;
  idPassport?: string;
  entryStatus?: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED';
  entryChecklist?: { id: string; label: string; required: boolean; checked: boolean }[];
  checkedInAt?: string;
}

export interface WorkerBadge {
  badge_id: string;
  worker_name: string;
  company: string;
  role: string;
  ptw_id: string;
  moc_id: string;
  validity_start: Date;
  validity_end: Date;
  qr_code: string;
  generated_at: Date;
}

export interface SupportingPermit {
  type: PermitType;
  data: Record<string, any>;
}

export interface PTW {
  sent_back_from_stage: string;
  id: string;

  permit_type: PermitType;
  title: string;
  location: string;

  start_datetime: string; // Supabase returns ISO string
  end_datetime: string;

  moc_id: string | null;
  contractor_id: string | null;

  requires_facilities_review: boolean;
  requires_efs_review: boolean;
  requires_stakeholder_closure: boolean;

  status: PTWStatus;
  revision_number: number;

  sent_back_to_role: Role | null;
  sent_back_reason: string | null;

  submission_date: string | null;
  work_completed_date: string | null;

  created_at: string;
  updated_at: string;

  worker_list: Worker[];
  timeline: TimelineEntry[];

  supporting_permit: SupportingPermit | null;

  created_by_auth_id: string | null;

  // ---- UI-only fields (NOT in DB). Keep optional.
  worker_badges?: WorkerBadge[];
  form_data?: Record<string, any>;
  entryApprovedAt?: string;
  entryApprovedBy?: string;
  entryProgress?: { passed: number; total: number };
  entryLogs?: {
    at: string;
    by: string;
    action: string;
    workerBadge?: string;
    workerName?: string;
  }[];
  workLogs?: {
  id: string;
  at: string;
  by: string;
  currentStatus: string;
  note: string;
  photoUrl?: string | null;
}[];

  workCompletedBy?: string;
  supervisorClosureCompletedAt?: string;
  supervisorClosureCompletedBy?: string;
  supervisorClosureNotes?: string;
  facilitiesClosureApprovedAt?: string;
  facilitiesClosureApprovedBy?: string;
  facilitiesClosureNotes?: string;
  hseClosureApprovedAt?: string;
  hseClosureApprovedBy?: string;
  hseClosureNotes?: string;
}

export interface SecurityLog {
  ptw_id: string;
  check_in_time?: Date;
  check_in_checklist?: Record<string, boolean>;
  progress_logs: ProgressLog[];
  check_out_time?: Date;
  check_out_verified_by?: string;
}

export interface ProgressLog {
  id: string;
  timestamp: Date;
  user: string;
  remarks: string;
  photo?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  user: string;
  role: Role;
  module: 'MOC' | 'PTW' | 'SECURITY' | 'CONTRACTOR' | 'SYSTEM';
  action: string;
  status?: string;
  details: string;
}

export interface ContractorDocument {
  id: string;
  contractor_id: string;
  folder: string;
  file_name: string;
  uploaded_at: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by?: string;
  reviewed_at?: Date;
  remarks?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: Date;
  link?: string;
}

export interface WorkflowState {
  users: User[];
  currentUser: User | null;
  contractors: Contractor[];
  stakeholders: Stakeholder[];
  mocs: MOC[];
  ptws: PTW[];
  securityLogs: SecurityLog[];
  activityLog: ActivityLog[];
  contractorDocuments: ContractorDocument[];
  notifications: Notification[];
}


import { z } from "zod";

export type MOCRecordStatus =
  | "DRAFT"
  | "PENDING_STAKEHOLDER_SIGNOFF"
  | "PENDING_CONTRACTOR_GATE"
  | "PENDING_FACILITIES_REVIEW"
  | "PENDING_STAKEHOLDER_REVIEW"
  | "PENDING_HSE_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "SUBMITTED"
  | "STAKEHOLDER_SIGNED";

export type StakeholderJSON = {
  stakeholder_id: string; // stakeholders.id
  stakeholder_name: string;
  stakeholder_email: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  remarks?: string;
  approved_by?: string;
  approved_at?: string;
};

export type MocAttachment = {
  filename: string;
  path: string;
  publicUrl?: string;
  uploadedAt?: string;
};

export const MocFormSchema = z.object({
  title: z.string().min(2, "Title is required"),
  area: z.string().min(1, "Area is required"),
  exactLocation: z.string().min(1, "Exact location is required"),

  description: z.string().min(1, "Description is required"),
  reasonForChange: z.string().min(1, "Reason for change is required"),
  riskSummary: z.string().min(1, "Risk summary is required"),

  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),

  // Contractor selection
  contractorCompany: z.string().min(1, "Contractor company is required"), // contractorCompany stores contractor id
  contractor_id: z.string().nullable().optional(),

  // Stakeholder flow
  requiresStakeholderApproval: z.boolean().default(false),
  stakeholderId: z.string().optional().default(""),
  stakeholderName: z.string().optional().default(""),
  stakeholderEmail: z.string().optional().default(""),

  // Uploads
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        path: z.string().optional(),
        publicUrl: z.string().optional(),
        uploadedAt: z.string().optional(),
      })
    )
    .default([]),

  stakeholderSignature: z.string().optional().default(""),
  stakeholderSignedAt: z.string().optional().default(""),
});

export type MocFormValues = z.infer<typeof MocFormSchema>;
export type MOCRecord = any; // keep if you already have a DB type elsewhere