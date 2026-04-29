import { z } from "zod";
import { IncidentType } from "@/types/ticket";

// --- Validation Schemas ---

export const ReportTypeSchema = z.object({
  type: z.enum(["Website", "SMS", "WhatsApp", "Email"] as const),
});

const commonFields = {
  summary: z
    .string()
    .min(1, "Required: Please describe the chronology of events")
    .min(10, "Minimum 10 characters for chronology")
    .max(2000),
  incidentDate: z.string().min(1, "Required: Please select the time of occurrence"),
};

export const IncidentSchemas = {
  SMS: z.object({
    type: z.literal("SMS"),
    ...commonFields,
    url: z
      .string()
      .min(1, "Required: Enter the website link/URL")
      .regex(/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i, "Invalid format. Example: example.com"),
    senderNumbers: z
      .string()
      .min(1, "Required: Enter sender number")
      .regex(/^[0-9+,\s]+$/, "Invalid format. Use numbers or +62. Separate with commas.")
      .min(10, "Phone number minimum 10 digits"),
  }),
  WhatsApp: z.object({
    type: z.literal("WhatsApp"),
    ...commonFields,
    url: z
      .string()
      .min(1, "Required: Enter the website link/URL")
      .regex(/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i, "Invalid format. Example: example.com"),
    senderNumbers: z
      .string()
      .min(1, "Required: Enter WhatsApp number")
      .regex(/^[0-9+,\s]+$/, "Invalid format. Use numbers or +62. Separate with commas.")
      .min(10, "Phone number minimum 10 digits"),
  }),
  Email: z.object({
    type: z.literal("Email"),
    ...commonFields,
    url: z
      .string()
      .optional()
      .refine((val: string | undefined) => !val || /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i.test(val), {
        message: "Invalid format. Example: example.com",
      }),
    senderNumbers: z
      .string()
      .min(1, "Required: Enter sender email")
      .email("Invalid email format. Example: example@gmail.com"),
  }),
  Website: z.object({
    type: z.literal("Website"),
    ...commonFields,
    url: z
      .string()
      .min(1, "Required: Enter the fake website URL")
      .regex(/^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i, "Invalid format. Example: example.com"),
    senderNumbers: z.string().optional(), // Make optional to match ReportFormData
  }),
};

export const EvidenceSchema = z.object({
  screenshots: z.any().optional(),
  attachments: z.any().optional(),
});
