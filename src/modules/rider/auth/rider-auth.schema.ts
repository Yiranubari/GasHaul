import { z } from "zod";

const phoneSchema = z
  .string()
  .regex(/^\+234[789][01]\d{8}$/, "Invalid Nigerian phone number");

export const riderSignInSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Password is required"),
});

export type RiderSignInInput = z.infer<typeof riderSignInSchema>;
