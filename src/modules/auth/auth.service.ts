import { BaseService } from "@/core/base-service.js";
import { type User, OtpPurpose } from "@prisma/client";
import { hashPassword, verifyPassword } from "@/lib/password.js";
import { signToken } from "@/lib/jwt.js";
import { otpService } from "./otp.service.js";
import {
  type SignUpInput,
  type SignInInput,
  type VerifyOtpInput,
  type ResendOtpInput,
} from "./auth.schema.js";
import { type PublicUser } from "@/types/auth.js";
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from "@/exceptions/app-exceptions.js";
import { env } from "@/config/env.js";

class AuthService extends BaseService {
  async signup(
    input: SignUpInput,
  ): Promise<{ phone: string; message: string; debugOtp?: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        phone: input.phone,
      },
    });

    if (existingUser) {
      throw new ConflictException("Phone number is already registered");
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: {
        fullName: input.fullName,
        phone: input.phone,
        passwordHash: hashedPassword,
        phoneVerified: false,
        smsNotifications: true,
      },
    });
    const code = await otpService.issueCode({
      userId: user.id,
      phone: user.phone,
      purpose: OtpPurpose.PHONE_VERIFICATION,
    });
    return {
      phone: user.phone,
      message: "OTP sent successfully",
      ...(env.ENABLE_DEBUG_OTP && { debugOtp: code }),
    };
  }

  async verifyOtp(
    input: VerifyOtpInput,
  ): Promise<{ token: string; user: PublicUser }> {
    const user = await this.prisma.user.findUnique({
      where: { phone: input.phone },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    } else if (user.phoneVerified) {
      throw new BadRequestException("Phone number is already verified");
    }

    await otpService.verifyCode({
      userId: user.id,
      code: input.code,
      purpose: OtpPurpose.PHONE_VERIFICATION,
    });

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true },
    });

    const token = signToken({ sub: user.id, type: "user" });
    return { token, user: toPublicUser(updatedUser) };
  }

  async resendOtp(input: ResendOtpInput): Promise<{ debugOtp?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { phone: input.phone },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    } else if (user.phoneVerified) {
      throw new BadRequestException("Phone number is already verified");
    }

    const code = await otpService.issueCode({
      userId: user.id,
      phone: user.phone,
      purpose: OtpPurpose.PHONE_VERIFICATION,
    });
    return env.ENABLE_DEBUG_OTP ? { debugOtp: code } : {};
  }

  async signin(
    input: SignInInput,
  ): Promise<{ token: string; user: PublicUser }> {
    const user = await this.prisma.user.findUnique({
      where: { phone: input.phone },
    });

    const passwordMatches = await verifyPassword(
      input.password,
      user?.passwordHash ?? "",
    );
    if (!user || !passwordMatches) {
      throw new UnauthorizedException("Invalid phone number or password");
    }

    if (!user.phoneVerified) {
      throw new UnauthorizedException("Phone number is not verified");
    }

    const token = signToken({ sub: user.id, type: "user" });
    return { token, user: toPublicUser(user) };
  }
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    phoneVerified: user.phoneVerified,
  };
}

export const authService = new AuthService();
