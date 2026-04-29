import { Router } from "express";
import { requireUser } from "@/middleware/auth.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { usersController } from "@/modules/users/users.controller.js";
import { addressSchema } from "@/modules/users/users.schema.js";

export const usersRouter = Router();

usersRouter.get("/me", requireUser, usersController.getMe);

usersRouter.post(
  "/me/address",
  requireUser,
  validate(addressSchema),
  usersController.saveAddress,
);
