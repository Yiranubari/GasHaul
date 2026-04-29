import { BaseService } from "@/core/base-service.js";
import { NotFoundException } from "@/exceptions/app-exceptions.js";
import type { Address } from "@prisma/client";
import type { AddressInput } from "./users.schema.js";

type AddressResponse = Omit<Address, "createdAt" | "updatedAt">;

type MeResponse = {
  id: string;
  fullName: string;
  phone: string;
  phoneVerified: boolean;
  address: AddressResponse | null;
};

class UsersService extends BaseService {
  async getMe(userId: string): Promise<MeResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { address: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      address: user.address ? toAddressResponse(user.address) : null,
    };
  }

  async saveAddress(
    userId: string,
    input: AddressInput,
  ): Promise<AddressResponse> {
    const landmarkPart =
      input.landmark !== undefined ? { landmark: input.landmark } : {};

    const savedAddress = await this.prisma.address.upsert({
      where: { userId },
      create: {
        user: { connect: { id: userId } },
        streetAddress: input.streetAddress,
        area: input.area,
        city: input.city,
        ...landmarkPart,
      },
      update: {
        streetAddress: input.streetAddress,
        area: input.area,
        city: input.city,
        ...landmarkPart,
      },
    });

    return toAddressResponse(savedAddress);
  }
}

function toAddressResponse(address: Address): AddressResponse {
  const { createdAt, updatedAt, ...rest } = address;
  return rest;
}

export const usersService = new UsersService();
