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
  resendOtpSchema,
} from "./auth.schema.js";
import { PublicUser } from "@/types/auth.js";
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from "@/exceptions/app-exceptions.js";

export class AuthService extends BaseService {
  async signup(
    input: SignUpInput,
  ): Promise<{ phone: string; message: string }> {
    const phone = await this.prisma.user.findUnique({
      where: {
        phone: input.phone,
      },
    });

    if (phone?.phoneVerified) {
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
    const otp = await otpService.issueCode({
      userId: user.id,
      phone: user.phone,
      purpose: OtpPurpose.PHONE_VERIFICATION,
    });
    return { phone: user.phone, message: "OTP sent successfully" };
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

    const otp = await otpService.verifyCode({
      userId: user.id,
      code: input.code,
      purpose: "PHONE_VERIFICATION",
    });

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true },
    });

    const token = signToken({ sub: user.id, type: "user" });
    return { token, user: new PublicUser(updatedUser) };
  }

  async resendOtp(input: ResendOtpInput): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { phone: input.phone },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    } else if (user.phoneVerified) {
      throw new BadRequestException("Phone number is already verified");
    }

    await otpService.issueCode({
      userId: user.id,
      phone: user.phone,
      purpose: "PHONE_VERIFICATION",
    });
  }
}
