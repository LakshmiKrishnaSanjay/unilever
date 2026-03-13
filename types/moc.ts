import { z } from "zod";

export const MocStatus = z.enum([
  "DRAFT",
  "PENDING_STAKEHOLDER_SIGNOFF",
  "SENT_TO_CONTRACTOR",
  "PENDING_GATE",
  "GATE_SUBMITTED",
  "PENDING_GATE_APPROVAL",
  "MOC_APPROVED",
  "REJECTED",
  "SENT_BACK",
]);

export type MocStatus = z.infer<typeof MocStatus>;

export const MocGateDocsSchema = z.object({
  companyCertificates: z.string().min(1, "Company Certificates PDF required"),
  supervisorDetails: z.string().min(1, "Supervisor Details PDF required"),
  methodStatement: z.string().min(1, "Method Statement PDF required"),
  riskAssessment: z.string().min(1, "Risk Assessment / JSA PDF required"),
  projectPlan: z.string().min(1, "Project Plan / Schedule PDF required"),
});

export const MocFormSchema = z.object({
  title: z.string().min(3, "Title is required"),
  location: z.string().min(2, "Location is required"),
  description: z.string().min(10, "Description is required"),

  initiatedBy: z.enum(["HSE", "STAKEHOLDER"]).default("HSE"),
  stakeholderRequired: z.boolean().default(false),

  plannedstartDate: z.string().min(1, "Start date required"),
  plannedEndDate: z.string().min(1, "End date required"),

  gate: z.object({
    acknowledged: z.boolean().default(false),
    acknowledgementName: z.string().optional(),
    docs: MocGateDocsSchema.partial().default({}),
  }).default({ acknowledged: false, docs: {} }),
});

export type MocFormValues = z.infer<typeof MocFormSchema>;
