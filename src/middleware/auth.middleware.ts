import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/lib/jwt.js";
import {
  ForbiddenException,
  UnauthorizedException,
} from "@/exceptions/app-exceptions.js";

type AccountType = "user" | "rider";

function createAuthMiddleware(allowedTypes?: AccountType[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Authentication required");
    }

    const token = header.slice("Bearer ".length).trim();

    if (!token) {
      throw new UnauthorizedException("Authentication required");
    }

    const payload = verifyToken(token);

    if (allowedTypes && !allowedTypes.includes(payload.type)) {
      throw new ForbiddenException("Access denied for this account type");
    }

    req.user = { id: payload.sub, type: payload.type };
    next();
  };
}

export const requireAuth = createAuthMiddleware();
export const requireUser = createAuthMiddleware(["user"]);
export const requireRider = createAuthMiddleware(["rider"]);
