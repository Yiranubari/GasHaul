import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import {
  HttpException,
  ValidationException,
} from "../exceptions/app-exceptions.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  // Convert raw ZodErrors (e.g., from validate middleware) into our typed exception
  if (err instanceof ZodError) {
    err = new ValidationException("Invalid input", err);
  }

  if (err instanceof HttpException) {
    // Operational errors: log at warn, no stack trace in response
    if (err.isOperational) {
      logger.warn(`${err.name}: ${err.message}`, {
        path: req.path,
        method: req.method,
        statusCode: err.statusCode,
      });
    } else {
      logger.error(`${err.name}: ${err.message}`, {
        path: req.path,
        method: req.method,
        err,
      });
    }

    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err instanceof ValidationException && err.errors
        ? { errors: formatZodErrors(err.errors) }
        : {}),
    });
  }

  // Unknown error — bug. Log full details, return generic message.
  logger.error("Unhandled error", {
    path: req.path,
    method: req.method,
    err,
  });

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
    // include stack in dev only
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

function formatZodErrors(errors: ValidationException["errors"]) {
  if (errors instanceof ZodError) {
    // Flatten to { field: [messages] } shape, easier for clients to consume
    return errors.flatten().fieldErrors;
  }
  return errors;
}
