import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // SMS provider
  SMS_PROVIDER: z.enum(["console", "termii"]).default("console"),
  TERMII_API_KEY: z.string().optional(),
  TERMII_SENDER_ID: z.string().default("Gashaul"),

  // CORS
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000,http://localhost:5173"),

  // OTP
  ENABLE_DEBUG_OTP: z
    .string()
    .transform((v) => v === "true")
    .default(false),
});

export const env = envSchema.parse(process.env);
