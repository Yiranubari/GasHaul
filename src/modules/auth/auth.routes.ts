import { Router } from "express";

import { authController } from "@/modules/auth/auth.controller.js";
import {
  resendOtpSchema,
  signInSchema,
  signUpSchema,
  verifyOtpSchema,
} from "@/modules/auth/auth.schema.js";
import { authRateLimit } from "@/middleware/rate-limit.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";

export const authRouter = Router();

authRouter.post(
  "/signup",
  authRateLimit,
  validate(signUpSchema),
  authController.signup,
);
authRouter.post(
  "/verify-otp",
  authRateLimit,
  validate(verifyOtpSchema),
  authController.verifyOtp,
);
authRouter.post(
  "/resend-otp",
  authRateLimit,
  validate(resendOtpSchema),
  authController.resendOtp,
);
authRouter.post(
  "/signin",
  authRateLimit,
  validate(signInSchema),
  authController.signin,
);
