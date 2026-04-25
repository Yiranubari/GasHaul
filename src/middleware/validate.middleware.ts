import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny, ZodError } from "zod";
import { ValidationException } from "@/exceptions/app-exceptions.js";

type RequestPart = "body" | "query" | "params";

export function validate(schema: ZodTypeAny, part: RequestPart = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);

    if (!result.success) {
      return next(
        new ValidationException("Invalid input", result.error as ZodError),
      );
    }

    req[part] = result.data;
    next();
  };
}
