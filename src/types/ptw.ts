import { z } from "zod";

export const PtwFormSchema = z.object({
  title: z.string().min(3, "Title is required"),
  location: z.string().min(1, "Location is required"),
  workDescription: z.string().min(10, "Work description is required"),

  workType: z.enum(["Hot Work", "Cold Work", "Confined Space", "Working at Height", "Electrical", "Lifting"]).default("Cold Work"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),

  ppeConfirmed: z.boolean().refine((v) => v === true, "PPE confirmation is required"),
  toolboxTalkDone: z.boolean().refine((v) => v === true, "Toolbox talk confirmation is required"),

  // Example – extend with exact Unilever PTW checklist fields from your repo
  hazards: z.array(z.string()).min(1, "Select at least 1 hazard"),
  controls: z.array(z.string()).min(1, "Select at least 1 control"),
});

export type PtwFormValues = z.infer<typeof PtwFormSchema>;
