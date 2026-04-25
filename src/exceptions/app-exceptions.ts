import type { ZodError } from "zod";

/**
 * @fileoverview Custom HTTP exception classes for consistent error handling.
 *
 * Each exception extends HttpException, which carries a message, status code,
 * and an `isOperational` flag distinguishing expected errors (e.g., 404, 422)
 * from programming bugs. The error middleware uses these to format responses
 * and decide what to log.
 *
 * Throw from controllers or services:
 *   throw new NotFoundException('User not found');
 *   throw new UnauthorizedException('Invalid token');
 *   throw new ConflictException('Phone number already registered');
 *   throw new ValidationException('Invalid input', zodError);
 *   throw new TooManyRequestsException('OTP request limit exceeded');
 */

/**
 * Base class for all HTTP-aware exceptions.
 */
export class HttpException extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 — malformed or semantically invalid input that isn't a schema failure.
 * Use ValidationException for Zod errors instead.
 */
export class BadRequestException extends HttpException {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}

/**
 * 401 — authentication is missing, expired, or invalid.
 */
export class UnauthorizedException extends HttpException {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

/**
 * 403 — authenticated, but the action is not permitted.
 */
export class ForbiddenException extends HttpException {
  constructor(message = "Access denied") {
    super(message, 403);
  }
}

/**
 * 404 — resource not found.
 */
export class NotFoundException extends HttpException {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

/**
 * 409 — business logic conflict (e.g., phone already registered, duplicate order).
 */
export class ConflictException extends HttpException {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}

/**
 * 422 — schema or input validation failure.
 */
export class ValidationException extends HttpException {
  public readonly errors?: ZodError | Record<string, string[]> | string[];

  constructor(
    message = "Validation failed",
    errors?: ZodError | Record<string, string[]> | string[],
  ) {
    super(message, 422);
    if (errors !== undefined) {
      this.errors = errors;
    }
  }
}

/**
 * 429 — rate limit exceeded.
 */
export class TooManyRequestsException extends HttpException {
  constructor(message = "Too many requests") {
    super(message, 429);
  }
}

/**
 * 500 — explicit internal server error. Rare; usually you throw a plain
 * Error and let the middleware coerce it to 500. Use this when you want
 * the type to be explicit at the throw site.
 */
export class InternalServerException extends HttpException {
  constructor(message = "Internal server error") {
    super(message, 500, false); // not operational — these are bugs
  }
}
