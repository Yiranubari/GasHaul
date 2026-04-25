import { prisma } from "@/config/prisma.js";
import type { PrismaClient } from "@prisma/client";

export abstract class BaseService {
  protected readonly prisma: PrismaClient = prisma;
}
