import { Router } from "express";
import { requireUser } from "@/middleware/auth.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { ordersController } from "@/modules/orders/orders.controller.js";
import {
  placeOrderSchema,
  cancelOrderSchema,
  submitFeedbackSchema,
} from "@/modules/orders/orders.schema.js";

export const ordersRouter = Router();

ordersRouter.post(
  "/",
  requireUser,
  validate(placeOrderSchema),
  ordersController.place,
);

ordersRouter.get("/", requireUser, ordersController.listMine);

ordersRouter.get("/:id", requireUser, ordersController.get);

ordersRouter.get("/:id/receipt", requireUser, ordersController.getReceipt);

ordersRouter.post(
  "/:id/feedback",
  requireUser,
  validate(submitFeedbackSchema),
  ordersController.submitFeedback,
);

ordersRouter.post(
  "/:id/cancel",
  requireUser,
  validate(cancelOrderSchema),
  ordersController.cancel,
);

ordersRouter.post(
  "/:id/confirm-delivery",
  requireUser,
  ordersController.confirmDelivery,
);

ordersRouter.post(
  "/:id/confirm-receipt",
  requireUser,
  ordersController.confirmReceipt,
);
