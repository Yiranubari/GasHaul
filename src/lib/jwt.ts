import jwt from "jsonwebtoken";
import { env } from "@/config/env.js";
import { UnauthorizedException } from "@/exceptions/app-exceptions.js";
import type { JwtPayload } from "@/types/auth.js";

export function signToken(payload: {
  sub: string;
  type: "user" | "rider";
}): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] & string,
  });
}

export function verifyToken(token: string): JwtPayload {
  let decoded: unknown;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedException("Token expired");
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedException("Invalid token");
    }
    throw new UnauthorizedException("Authentication failed");
  }

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    typeof (decoded as JwtPayload).sub !== "string" ||
    ((decoded as JwtPayload).type !== "user" &&
      (decoded as JwtPayload).type !== "rider")
  ) {
    throw new UnauthorizedException("Invalid token payload");
  }

  return decoded as JwtPayload;
}
