import { z } from "zod";

const phoneSchema = z
  .string()
  .regex(/^\+234[789][01]\d{8}$/, "Invalid Nigerian phone number");

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters"),
  phone: phoneSchema,
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z
    .string()
    .length(4, "OTP must be 4 characters long")
    .regex(/^\d{4}$/, "OTP must be numeric"),
});

export const resendOtpSchema = z.object({
  phone: phoneSchema,
});

export const signInSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
