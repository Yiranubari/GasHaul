import { Router } from "express";
import { requireRider } from "@/middleware/auth.middleware.js";
import { riderOrdersController } from "@/modules/rider/orders/rider-orders.controller.js";

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
  "/:id/refilling",
  requireRider,
  riderOrdersController.refilling,
);

riderOrdersRouter.post(
  "/:id/on-the-way",
  requireRider,
  riderOrdersController.onTheWay,
);
