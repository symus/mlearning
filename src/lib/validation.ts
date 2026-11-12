import { z } from "zod";
import { allowedBirthYears } from "./age";
import { brand } from "@/config/brand";

export const COUNTRIES = [
  { code: "GB", name: "United Kingdom" },
  { code: "PL", name: "Poland" },
  { code: "IE", name: "Ireland" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "AU", name: "Australia" },
  { code: "OTHER", name: "Other" },
] as const;

const countryCodes = COUNTRIES.map((c) => c.code) as [string, ...string[]];

export const INTERESTS = [
  { id: "space", label: "Space", emoji: "🚀" },
  { id: "animals", label: "Animals", emoji: "🦊" },
  { id: "dinosaurs", label: "Dinosaurs", emoji: "🦕" },
  { id: "ocean", label: "Ocean", emoji: "🐙" },
  { id: "sport", label: "Sport", emoji: "⚽" },
  { id: "music", label: "Music", emoji: "🎵" },
  { id: "building", label: "Building", emoji: "🧱" },
  { id: "art", label: "Art", emoji: "🖍️" },
  { id: "robots", label: "Robots", emoji: "🤖" },
  { id: "nature", label: "Nature", emoji: "🌿" },
] as const;
const interestIds = INTERESTS.map((i) => i.id) as [string, ...string[]];

export const AVATAR_CHARACTERS = ["fox", "owl", "bear", "cat", "dragon", "robot"] as const;
export const AVATAR_COLOURS = ["sun", "coral", "leaf", "sky", "berry", "sand"] as const;

export const avatarSchema = z.object({
  character: z.enum(AVATAR_CHARACTERS),
  colour: z.enum(AVATAR_COLOURS),
});
export type Avatar = z.infer<typeof avatarSchema>;

const password = z
  .string()
  .min(10, { message: "Use at least 10 characters." })
  .max(128, { message: "That password is too long." })
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), { message: "Include at least one letter and one number." });

const pin = z.string().regex(/^\d{4}$/, { message: "PIN must be exactly 4 digits." });

export const signupSchema = z.object({
  displayName: z.string().trim().min(2, { message: "Please enter your name." }).max(60),
  email: z.string().trim().toLowerCase().email({ message: "Enter a valid email address." }),
  password,
  pin,
  country: z.enum(countryCodes, { message: "Choose your country." }),
  parentalConsent: z.literal("on", { message: "Please confirm you are the parent or legal guardian." }),
  terms: z.literal("on", { message: "Please accept the terms and privacy notice." }),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Enter your password." }),
});

export const childSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(1, { message: "Please enter a nickname." })
    .max(20, { message: "Keep it to 20 characters." })
    .regex(/^[\p{L}\p{N} '-]+$/u, { message: "Letters, numbers, spaces and - only." }),
  birthYear: z.coerce
    .number({ message: "Choose a birth year." })
    .int()
    .refine((y) => allowedBirthYears().includes(y), { message: `${brand.name} is for ages 3–12.` }),
  dailyGoalMinutes: z.coerce.number().int().refine((m) => [10, 15, 20, 30].includes(m), {
    message: "Choose a daily goal.",
  }),
  interests: z.array(z.enum(interestIds)).max(5, { message: "Pick up to 5 interests." }).default([]),
  narration: z.boolean().default(true),
});

export const pinSchema = z.object({ pin });
export const changePinSchema = z.object({ currentPassword: z.string().min(1, { message: "Enter your password." }), pin });

export type FieldErrors = Record<string, string[] | undefined>;
export type FormState = { ok?: boolean; message?: string; errors?: FieldErrors; values?: Record<string, string> } | undefined;

export function fieldErrors(error: z.ZodError): FieldErrors {
  return z.flattenError(error).fieldErrors as FieldErrors;
}
