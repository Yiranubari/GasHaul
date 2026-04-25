import rateLimit, { type Options } from "express-rate-limit";
import { TooManyRequestsException } from "@/exceptions/app-exceptions.js";

/**
 * Factory for creating rate limit middleware with consistent error handling.
 *
 * Uses express-rate-limit under the hood. When a client exceeds the limit,
 * it throws a TooManyRequestsException which the global error middleware
 * formats into the standard error response shape.
 *
 * Defaults are conservative; override per-route as needed.
 *
 * Example:
 *   router.post('/signup', rateLimit({ max: 5, windowMs: 60_000 }), ...);
 */
export function createRateLimit(options: Partial<Options> = {}) {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window per IP
    standardHeaders: "draft-7", // RateLimit-* headers (RFC draft)
    legacyHeaders: false, // disable X-RateLimit-* (older convention)
    handler: (_req, _res, next) => {
      next(
        new TooManyRequestsException(
          "Too many requests, please try again later",
        ),
      );
    },
    ...options,
  });
}

/**
 * Strict limiter for sensitive auth endpoints (signup, signin, OTP request).
 * 5 requests per 15 minutes per IP.
 */
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (_req, _res, next) => {
    next(
      new TooManyRequestsException(
        "Too many attempts, please try again in a few minutes",
      ),
    );
  },
});

/**
 * Default API limiter for general endpoints.
 * 100 requests per 15 minutes per IP.
 */
export const apiRateLimit = createRateLimit();
