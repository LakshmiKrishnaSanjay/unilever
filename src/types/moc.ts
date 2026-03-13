import { z } from "zod";

// Full MOC Form Schema
export const MocFormSchema = z.object({
  // Basic Info
  title: z.string().min(3, "MOC title is required (min 3 characters)"),
  area: z.string().min(1, "Area/Site is required"),
  exactLocation: z.string().min(1, "Exact location is required"),
  description: z.string().min(10, "Description/Change summary is required (min 10 characters)"),
  reasonForChange: z.string().min(10, "Reason for change is required (min 10 characters)"),
  riskSummary: z.string().min(10, "Risk summary is required (min 10 characters)"),
  
  // Dates
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  
  // Contractor
  contractorCompany: z.string().min(1, "Contractor company is required"),
  
  // Stakeholder
  requiresStakeholderApproval: z.boolean(),
  stakeholderName: z.string().optional(),
  stakeholderEmail: z.string().optional(),
  
  // Attachments
  attachments: z.array(z.object({
    filename: z.string(),
  })).optional(),
  
  // For stakeholder initiation
  stakeholderSignature: z.string().optional(),
  stakeholderSignedAt: z.string().optional(),
});

export type MocFormValues = z.infer<typeof MocFormSchema>;

// Contractor Gate (Acknowledgement + MOC Pack)
export interface ContractorGate {
  id: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  signature?: string;
  
  // Project Supervisor Details
  supervisorName?: string;
  supervisorPhone?: string;
  supervisorEmail?: string;
  supervisorIdPassport?: string;
  
  // MOC Pack Documents
  documents?: {
    companyCertificates?: string; // filename
    methodStatement?: string; // MOS
    riskAssessment?: string; // RA
    projectPlan?: string; // schedule
  };
  
  submittedAt?: string;
}

// Facilities Approval
export interface FacilitiesApproval {
  status: "APPROVED" | "CHANGES_REQUESTED";
  signature?: string;
  signedAt?: string;
  signedBy?: string;
  notes?: string;
  changesRequested?: string;
}

// Stakeholder Approval
export interface StakeholderApproval {
  signature?: string;
  signedAt?: string;
  signedBy?: string;
}

// HSE Final Approval
export interface HSEApproval {
  signature?: string;
  signedAt?: string;
  signedBy?: string;
}

// User Profile with Signature
export interface UserProfile {
  userId: string;
  signature?: string; // dataURL
  signatureUpdatedAt?: string;
}

// MOC Record structure for storage
export interface MOCRecord extends MocFormValues {
  stakeholders: any;
  contractors: any;
  expiry_date: string | number | Date;
  start_date: string | number | Date;
  id: string;
  status: "STAKEHOLDER_SIGNED" | "PENDING_STAKEHOLDER_APPROVAL" | "PENDING_HSE_APPROVAL" | "PENDING_HSE_FINAL" | "SUBMITTED" | "CONTRACTOR_SUBMITTED" | "FACILITIES_APPROVED" | "FACILITIES_CHANGES_REQUESTED" | "STAKEHOLDER_APPROVED" | "APPROVED" | "REJECTED";
  created_at: string;
  createdByRole: string;
  createdBy?: string;
  contractorGate?: ContractorGate;
  facilities_approval?: FacilitiesApproval;
  stakeholderApproval?: StakeholderApproval;
  hseApproval?: HSEApproval;
}
