import { Router } from "express";
import { authRateLimit } from "@/middleware/rate-limit.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { riderAuthController } from "@/modules/rider/auth/rider-auth.controller.js";
import { riderSignInSchema } from "@/modules/rider/auth/rider-auth.schema.js";

export const riderAuthRouter = Router();

riderAuthRouter.post(
  "/auth/signin",
  authRateLimit,
  validate(riderSignInSchema),
  riderAuthController.signin,
);
