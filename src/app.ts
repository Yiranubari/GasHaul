import express, { type Express } from "express";
import { errorMiddleware } from "@/middleware/error.middleware.js";

export function buildApp(): Express {
  const app = express();

  // core middleware
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // routes
  // app.use('/auth', authRoutes);
  // app.use('/vendors', vendorRoutes);
  // app.use('/orders', orderRoutes);

  // error handler must be last
  app.use(errorMiddleware);

  return app;
}
