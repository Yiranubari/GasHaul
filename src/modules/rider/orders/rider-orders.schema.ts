import { z } from "zod";

export const submitReceiptSchema = z.object({
  cylinderSerial: z
    .string()
    .trim()
    .min(1, { message: "Cylinder serial is required." })
    .max(50, { message: "Cylinder serial must be at most 50 characters." }),
  weightBeforeKg: z
    .number()
    .positive({ message: "Weight before must be a positive number." })
    .min(0.1, { message: "Weight before must be at least 0.1 kg." })
    .max(100, { message: "Weight before must be at most 100 kg." }),
  photoUrl: z.url({ message: "Photo URL must be a valid URL." }),
});

export type SubmitReceiptInput = z.infer<typeof submitReceiptSchema>;
