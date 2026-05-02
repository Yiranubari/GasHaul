import express, { type Express } from "express";
import { errorMiddleware } from "@/middleware/error.middleware.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { vendorsRouter } from "./modules/vendors/vendors.routes.js";
import { riderAuthRouter } from "@/modules/rider/auth/rider-auth.routes.js";
import { ordersRouter } from "@/modules/orders/orders.routes.js";
import { env } from "./config/env.js";
import cors from "cors";
import { riderOrdersRouter } from "@/modules/rider/orders/rider-orders.routes.js";

export function buildApp(): Express {
  const app = express();

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: env.CORS_ORIGINS.split(",").map((s) => s.trim()),
      credentials: true,
    }),
  );

  // core middleware
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // routes
  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/vendors", vendorsRouter);
  app.use("/rider", riderAuthRouter);
  app.use("/rider/orders", riderOrdersRouter);
  app.use("/orders", ordersRouter);

  // error handler must be last
  app.use(errorMiddleware);

  return app;
}
