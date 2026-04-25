import { OtpPurpose } from "@prisma/client";
import { BaseService } from "@/core/base-service.js";
import { hashPassword, verifyPassword } from "@/lib/password.js";
import { randomInt } from "node:crypto";
import { smsProvider } from "@/lib/sms/index.js";
import {
  TooManyRequestsException,
  BadRequestException,
  NotFoundException,
} from "@/exceptions/app-exceptions.js";
import { logger } from "@/utils/logger.js";

const OTP_CODE_LENGTH = 4;
const OTP_TTL_MINUTES = 10;
const OTP_MAX_VERIFY_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_SECONDS = 30;
const OTP_MAX_REQUESTS_PER_HOUR = 3;

class OtpService extends BaseService {
  async issueCode(input: {
    userId: string;
    phone: string;
    purpose: OtpPurpose;
  }): Promise<void> {
    const { userId, phone, purpose } = input;

    await this.enforceRateLimits(userId, purpose);

    await this.prisma.otpCode.updateMany({
      where: { userId, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const code = generateNumericCode(OTP_CODE_LENGTH);
    const codeHash = await hashPassword(code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await this.prisma.otpCode.create({
      data: { userId, codeHash, purpose, expiresAt },
    });

    await smsProvider.send({
      to: phone,
      message: `Your Gashaul verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    });

    logger.info("OTP issued", { userId, purpose });
  }

  async verifyCode(input: {
    userId: string;
    code: string;
    purpose: OtpPurpose;
  }): Promise<void> {
    const { userId, code, purpose } = input;

    const otp = await this.prisma.otpCode.findFirst({
      where: { userId, purpose, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      throw new NotFoundException(
        "No active verification code. Request a new one.",
      );
    }

    if (otp.expiresAt < new Date()) {
      throw new BadRequestException(
        "Verification code has expired. Request a new one.",
      );
    }

    if (otp.attempts >= OTP_MAX_VERIFY_ATTEMPTS) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { consumedAt: new Date() },
      });
      throw new BadRequestException(
        "Too many failed attempts. Request a new code.",
      );
    }

    const matches = await verifyPassword(code, otp.codeHash);

    if (!matches) {
      const attempts = otp.attempts + 1;
      const exhausted = attempts >= OTP_MAX_VERIFY_ATTEMPTS;

      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: {
          attempts,
          ...(exhausted && { consumedAt: new Date() }),
        },
      });

      throw new BadRequestException(
        exhausted
          ? "Too many failed attempts. Request a new code."
          : "Invalid verification code.",
      );
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });

    logger.info("OTP verified", { userId, purpose });
  }

  private async enforceRateLimits(
    userId: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const cooldownThreshold = new Date(
      now.getTime() - OTP_RESEND_COOLDOWN_SECONDS * 1000,
    );

    const mostRecent = await this.prisma.otpCode.findFirst({
      where: { userId, purpose },
      orderBy: { createdAt: "desc" },
    });

    if (mostRecent && mostRecent.createdAt > cooldownThreshold) {
      const secondsRemaining = Math.ceil(
        (mostRecent.createdAt.getTime() +
          OTP_RESEND_COOLDOWN_SECONDS * 1000 -
          now.getTime()) /
          1000,
      );
      throw new TooManyRequestsException(
        `Please wait ${secondsRemaining}s before requesting another code.`,
      );
    }

    const hourlyCount = await this.prisma.otpCode.count({
      where: { userId, purpose, createdAt: { gte: oneHourAgo } },
    });

    if (hourlyCount >= OTP_MAX_REQUESTS_PER_HOUR) {
      throw new TooManyRequestsException(
        "Hourly verification code limit reached. Try again later.",
      );
    }
  }
}

function generateNumericCode(length: number): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += randomInt(0, 10).toString();
  }
  return result;
}

export const otpService = new OtpService();
