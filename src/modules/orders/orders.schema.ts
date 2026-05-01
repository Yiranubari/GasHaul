import { z } from "zod";
import { CylinderSize } from "@prisma/client";

export const placeOrderSchema = z.object({
  vendorId: z.cuid(),
  cylinderSize: z.nativeEnum(CylinderSize),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
