import { BaseService } from "@/core/base-service.js";
import { haversineKm, type LatLng } from "@/lib/geo.js";
import { CylinderSize } from "@prisma/client";

type VendorListItem = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  trustScore: number | null;
  completedOrdersWithFeedback: number;
  flaggedForReview: boolean;
  pricing: Array<{ cylinderSize: CylinderSize; priceKobo: number }>;
};

const cylinderSizeOrder: CylinderSize[] = [
  CylinderSize.KG_3,
  CylinderSize.KG_5,
  CylinderSize.KG_12_5,
  CylinderSize.KG_50,
];

class VendorsService extends BaseService {
  async listVendors(userId: string): Promise<VendorListItem[]> {
    const address = await this.prisma.address.findUnique({
      where: { userId },
    });

    const vendors = await this.prisma.vendor.findMany({
      where: { isActive: true },
      include: { pricing: true },
      orderBy: [
        { trustScore: { sort: "desc", nulls: "last" } },
        { name: "asc" },
      ],
    });

    const userLocation: LatLng | null =
      address?.latitude != null && address?.longitude != null
        ? { lat: address.latitude, lng: address.longitude }
        : null;

    return vendors.map((vendor) => {
      const distanceKm = userLocation
        ? haversineKm(userLocation, {
            lat: vendor.latitude,
            lng: vendor.longitude,
          })
        : null;

      const pricing = [...vendor.pricing]
        .sort(
          (left, right) =>
            cylinderSizeOrder.indexOf(left.cylinderSize) -
            cylinderSizeOrder.indexOf(right.cylinderSize),
        )
        .map((price) => ({
          cylinderSize: price.cylinderSize,
          priceKobo: price.priceKobo,
        }));

      return {
        id: vendor.id,
        name: vendor.name,
        latitude: vendor.latitude,
        longitude: vendor.longitude,
        distanceKm,
        trustScore: vendor.trustScore,
        completedOrdersWithFeedback: vendor.completedOrdersWithFeedback,
        flaggedForReview: vendor.flaggedForReview,
        pricing,
      };
    });
  }
}

export const vendorsService = new VendorsService();
