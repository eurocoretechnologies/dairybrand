import { z } from "zod";
import { MAX_QUANTITY } from "@/lib/cart/logic";
import { PINCODE_PATTERN, normalizePincode } from "@/lib/pincode";
import type { DeliverySlot } from "@/types/database";

/** Indian states and union territories, for the address form. */
export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export const DELIVERY_SLOTS: { value: DeliverySlot; label: string; time: string }[] = [
  { value: "morning", label: "Early morning", time: "6:00 – 9:00 am" },
  { value: "daytime", label: "Daytime", time: "11:00 am – 3:00 pm" },
  { value: "evening", label: "Evening", time: "5:00 – 8:00 pm" },
];

/**
 * Accepts what people type ("+91 98765 43210", "098765-43210") and returns
 * the 10-digit number, or the input unchanged if it can't be normalised.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits || input;
}

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `Enter your ${label}`).max(max, `Keep ${label} under ${max} characters`);

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `Keep ${label} under ${max} characters`)
    .optional()
    .transform((v) => v || undefined);

export const orderItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_QUANTITY),
  /** The price the customer saw, in paise. Compared with the database. */
  expectedPricePaise: z.number().int().positive(),
});

export const orderRequestSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, "Add at least one product to your order")
    .max(30, "That's too many different products for one order"),
  customerName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(80, "Keep your name under 80 characters"),
  phone: z
    .string()
    .transform(normalizePhone)
    .pipe(z.string().regex(/^[6-9][0-9]{9}$/, "Enter a 10-digit mobile number")),
  whatsappOk: z.boolean(),
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.email("Enter a valid email address").optional()),
  addressLine1: requiredText("flat or house number", 120),
  addressLine2: requiredText("street or area", 120),
  landmark: optionalText(120, "the landmark"),
  pincode: z
    .string()
    .transform(normalizePincode)
    .pipe(z.string().regex(PINCODE_PATTERN, "Enter a valid 6-digit pincode")),
  city: requiredText("city", 120),
  state: z.enum(INDIAN_STATES, "Choose your state"),
  slot: z.enum(["morning", "daytime", "evening"], "Choose a delivery time"),
  note: optionalText(500, "the note"),
  consent: z.literal(true, "Please agree so we can contact you about this order"),
  /** Honeypot: hidden from people, filled in by bots. */
  website: z.string().max(0).optional(),
});

export type OrderRequestInput = z.input<typeof orderRequestSchema>;
export type OrderRequest = z.output<typeof orderRequestSchema>;

/** Form fields, in display order, used to map validation errors. */
export type OrderField = Exclude<keyof OrderRequestInput, "website">;

export type FieldErrors = Partial<Record<OrderField, string>>;

export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as OrderField | undefined;
    if (field && !out[field]) out[field] = issue.message;
  }
  return out;
}
