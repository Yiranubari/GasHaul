import { prisma } from "../config/prisma.js";
import type { PrismaClient } from "@prisma/client";

/**
 * Base class for all services.
 *
 * Provides shared access to the Prisma client via this.prisma. Services
 * that need other shared dependencies (logger, etc.) can be extended here
 * later without touching every concrete service.
 *
 * Example:
 *   class AuthService extends BaseService {
 *     async signup(input: SignupInput) {
 *       return this.prisma.user.create({ data: { ... } });
 *     }
 *   }
 */
export abstract class BaseService {
  protected readonly prisma: PrismaClient = prisma;
}
