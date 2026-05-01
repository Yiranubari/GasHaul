import { Router } from "express";
import { requireUser } from "@/middleware/auth.middleware.js";
import { vendorsController } from "@/modules/vendors/vendors.controller.js";

export const vendorsRouter = Router();

vendorsRouter.get("/", requireUser, vendorsController.list);
