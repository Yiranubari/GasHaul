import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  logger.error("Request error", { err, path: req.path, method: req.method });

  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}
