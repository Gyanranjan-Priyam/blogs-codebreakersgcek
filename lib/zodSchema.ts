import { z } from "zod";

export const userSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(100, { message: "Name must be at most 100 characters long" }),
  email: z.string().email({ message: "Invalid email address" }),
  emailVerified: z.boolean().default(false),
  image: z.string().url({ message: "Invalid image URL" }).optional(),
  role: z.string().optional(),
  banned: z.boolean().default(false).optional(),
  banReason: z.string().optional(),
  banExpires: z.date().optional(),
});

export const sessionSchema = z.object({
  token: z.string().min(1, { message: "Token is required" }),
  expiresAt: z.date({ message: "Expiration date is required" }),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  userId: z.string().min(1, { message: "User ID is required" }),
  impersonatedBy: z.string().optional(),
});

export const accountSchema = z.object({
  accountId: z.string().min(1, { message: "Account ID is required" }),
  providerId: z.string().min(1, { message: "Provider ID is required" }),
  userId: z.string().min(1, { message: "User ID is required" }),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  idToken: z.string().optional(),
  accessTokenExpiresAt: z.date().optional(),
  refreshTokenExpiresAt: z.date().optional(),
  scope: z.string().optional(),
  password: z.string().optional(),
});

export const verificationSchema = z.object({
  identifier: z.string().min(1, { message: "Identifier is required" }),
  value: z.string().min(1, { message: "Value is required" }),
  expiresAt: z.date({ message: "Expiration date is required" }),
});

// Announcement constants and schemas
export const announcementCategories = [
  "EMERGENCY",
  "GENERAL", 
  "EVENT_UPDATE",
  "WORKSHOP",
  "LOGISTICS"
] as const;

export const announcementPriorities = [
  "NORMAL",
  "IMPORTANT", 
  "URGENT"
] as const;

export const announcementAudiences = [
  "PUBLIC",
  "PARTICIPANTS_ONLY",
  "VOLUNTEERS_ONLY", 
  "ORGANIZERS_ONLY"
] as const;

export const recurrenceTypes = [
  "NONE",
  "HOURLY",
  "DAILY",
  "WEEKLY"
] as const;

export const announcementSchema = z.object({
  // Auto-generated slugId (optional for form input)
  slugId: z.string().optional(),
  
  // Basic Information
  title: z
    .string()
    .min(5, { message: "Title must be at least 5 characters long" })
    .max(200, { message: "Title must be at most 200 characters long" }),
  description: z
    .string()
    .min(20, { message: "Description must be at least 20 characters long" })
    .max(10000, { message: "Description must be at most 10000 characters long" }),
  category: z.enum(announcementCategories, { message: "Please select a valid category" }),
  priority: z.enum(announcementPriorities, { message: "Please select a valid priority" }).default("NORMAL"),

  // Media & Attachments  
  attachmentKeys: z
    .array(z.string())
    .default([])
    .refine(arr => arr.length <= 10, { message: "Maximum 10 attachments allowed" }),
  imageKeys: z
    .array(z.string()) 
    .default([])
    .refine(arr => arr.length <= 5, { message: "Maximum 5 images allowed" }),

  // Visibility & Control
  audience: z.enum(announcementAudiences, { message: "Please select a valid audience" }).default("PUBLIC"),
  sendNotifications: z.boolean().default(false),
  isPinned: z.boolean().default(false),
  showInHomeBanner: z.boolean().default(false),

  // Scheduling
  publishDate: z.coerce.date({ message: "Publish date is required" }),
  expiryDate: z.coerce.date().optional().nullable(),

  // Recurring options
  isRecurring: z.boolean().default(false),
  recurrenceType: z.enum(recurrenceTypes, { message: "Please select a valid recurrence type" }).default("NONE"),
  recurrenceInterval: z.coerce
    .number()
    .min(1, { message: "Interval must be at least 1" })
    .max(168, { message: "Interval cannot exceed 168 hours" })
    .optional()
    .nullable(),
}).refine(
  (data) => {
    // If expiry date is provided, it should be after publish date
    if (data.expiryDate && data.publishDate) {
      return data.expiryDate > data.publishDate;
    }
    return true;
  },
  {
    message: "Expiry date must be after publish date",
    path: ["expiryDate"],
  }
).refine(
  (data) => {
    // If recurring is enabled, recurrence type should not be NONE
    if (data.isRecurring && data.recurrenceType === "NONE") {
      return false;
    }
    return true;
  },
  {
    message: "Recurrence type is required when recurring is enabled",
    path: ["recurrenceType"],
  }
).refine(
  (data) => {
    // If recurring is enabled with HOURLY type, interval is required
    if (data.isRecurring && data.recurrenceType === "HOURLY" && !data.recurrenceInterval) {
      return false;
    }
    return true;
  },
  {
    message: "Interval is required for hourly recurrence",
    path: ["recurrenceInterval"],
  }
);

export type AnnouncementSchemaType = z.infer<typeof announcementSchema>;

export const formSchema = z.object({
  profileImageKey: z.string().optional(),
  username: z.string().min(2, "Username must be at least 2 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  middleName: z.string().optional(),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  whatsappNumber: z
    .string()
    .min(10, "WhatsApp number must be at least 10 digits"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  aadhaarNumber: z
    .string()
    .min(12, "Aadhaar number must be at least 12 digits"),
  registration: z.string().min(2, "Registration number is required"),
  rollNumber: z.string().min(2, "Roll number is required"),
  branch: z.string().min(1, "Please select a branch"),
  admissionYear: z.string().min(1, "Please select admission year"),
  collegeName: z.string().min(1, "Please select a college"),
  collegeAddress: z.string().min(5, "College address is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  postOffice: z.string().min(1, "Post Office is required"),
  policeStation: z.string().min(1, "Police Station is required"),
  block: z.string().min(1, "Block is required"),
  pinCode: z.string().min(4, "Pin Code is required"),
  state: z.string().min(1, "Please select a state"),
  district: z.string().min(1, "Please select a district"),
});

export type FormValues = z.infer<typeof formSchema>;