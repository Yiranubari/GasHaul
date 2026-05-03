import { z } from "zod";
import { CylinderSize } from "@prisma/client";

export const placeOrderSchema = z.object({
  vendorId: z.cuid(),
  cylinderSize: z.nativeEnum(CylinderSize),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export const submitFeedbackSchema = z.object({
  cylinderFull: z.boolean(),
  hadIssues: z.boolean(),
  issueDetails: z.string().trim().max(150).optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
