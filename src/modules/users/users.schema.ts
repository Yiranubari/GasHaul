import { z } from "zod";

export const addressSchema = z.object({
  streetAddress: z
    .string()
    .trim()
    .min(2, "Street address must be at least 2 characters")
    .max(200, "Street address must be at most 200 characters"),
  area: z
    .string()
    .trim()
    .min(2, "Area must be at least 2 characters")
    .max(100, "Area must be at most 100 characters"),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(100, "City must be at most 100 characters"),
  landmark: z
    .string()
    .trim()
    .max(200, "Landmark must be at most 200 characters")
    .optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
