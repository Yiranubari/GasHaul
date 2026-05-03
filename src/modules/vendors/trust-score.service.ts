import { BaseService } from "@/core/base-service.js";
import { OrderStatus, Prisma } from "@prisma/client";

class TrustScoreService extends BaseService {
  async recompute(
    vendorId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;

    const completed = await client.feedback.count({
      where: {
        order: { is: { vendorId, status: OrderStatus.DELIVERED } },
      },
    });

    const withIssues = await client.feedback.count({
      where: {
        order: { is: { vendorId, status: OrderStatus.DELIVERED } },
        OR: [{ cylinderFull: false }, { hadIssues: true }],
      },
    });

    const trustScore =
      completed < 5
        ? null
        : Math.round(((completed - withIssues) / completed) * 100);
    const flaggedForReview = trustScore !== null && trustScore < 60;

    await client.vendor.update({
      where: { id: vendorId },
      data: {
        completedOrdersWithFeedback: completed,
        ordersWithIssues: withIssues,
        trustScore,
        flaggedForReview,
      },
    });
  }
}

export const trustScoreService = new TrustScoreService();
