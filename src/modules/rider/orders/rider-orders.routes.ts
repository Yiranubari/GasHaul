import { Router } from "express";
import { requireRider } from "@/middleware/auth.middleware.js";
import { validate } from "@/middleware/validate.middleware.js";
import { riderOrdersController } from "@/modules/rider/orders/rider-orders.controller.js";
import { submitReceiptSchema } from "@/modules/rider/orders/rider-orders.schema.js";

export const riderOrdersRouter = Router();

riderOrdersRouter.get(
  "/available",
  requireRider,
  riderOrdersController.listAvailable,
);

riderOrdersRouter.get("/mine", requireRider, riderOrdersController.listMine);

riderOrdersRouter.post("/:id/claim", requireRider, riderOrdersController.claim);

riderOrdersRouter.post("/:id/drop", requireRider, riderOrdersController.drop);

riderOrdersRouter.post(
  "/:id/receipt",
  requireRider,
  validate(submitReceiptSchema),
  riderOrdersController.submitReceipt,
);

riderOrdersRouter.post(
  "/:id/refilling",
  requireRider,
  riderOrdersController.refilling,
);

riderOrdersRouter.post(
  "/:id/on-the-way",
  requireRider,
  riderOrdersController.onTheWay,
);
