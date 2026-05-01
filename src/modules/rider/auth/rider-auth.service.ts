import { BaseService } from "@/core/base-service.js";
import { UnauthorizedException } from "@/exceptions/app-exceptions.js";
import { signToken } from "@/lib/jwt.js";
import { type Rider } from "@prisma/client";
import { verifyPassword } from "@/lib/password.js";
import { type RiderSignInInput } from "./rider-auth.schema.js";
import type { PublicRider } from "@/types/auth.js";

class RiderAuthService extends BaseService {
  async signin(
    input: RiderSignInInput,
  ): Promise<{ token: string; rider: PublicRider }> {
    const rider = await this.prisma.rider.findUnique({
      where: { phone: input.phone },
    });

    const passwordMatches = await verifyPassword(
      input.password,
      rider?.passwordHash || "",
    );

    if (!rider || !passwordMatches) {
      throw new UnauthorizedException("Invalid phone or password");
    }

    if (!rider.isActive) {
      throw new UnauthorizedException("Rider account is inactive");
    }

    const token = signToken({
      sub: rider.id,
      type: "rider",
    });

    return {
      token,
      rider: toPublicRider(rider),
    };
  }
}

function toPublicRider(rider: Rider): PublicRider {
  return {
    id: rider.id,
    fullName: rider.fullName,
    phone: rider.phone,
  };
}

export const riderAuthService = new RiderAuthService();
