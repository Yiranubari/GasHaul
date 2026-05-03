import { BaseService } from "@/core/base-service.js";
import {
  type Address,
  type CylinderReceipt,
  type Feedback,
  OrderStatus,
  CylinderSize,
  Prisma,
} from "@prisma/client";
import {
  type PlaceOrderInput,
  type CancelOrderInput,
  type SubmitFeedbackInput,
} from "./orders.schema.js";
import { canTransition } from "./order-status.machine.js";
import { trustScoreService } from "@/modules/vendors/trust-score.service.js";
import {
  BadRequestException,
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "@/exceptions/app-exceptions.js";

export type OrderResponse = {
  id: string;
  reference: string;
  status: OrderStatus;
  cylinderSize: CylinderSize;
  priceKoboLocked: number;
  deliveryAddress: string;
  vendor: { id: string; name: string };
  placedAt: Date;
  riderAssignedAt: Date | null;
  pickedUpAt: Date | null;
  refillingAt: Date | null;
  onTheWayAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
};

export type ReceiptResponse = {
  id: string;
  orderId: string;
  cylinderSerial: string;
  weightBeforeKg: number;
  photoUrl: string;
  loggedAt: Date;
  userConfirmedAt: Date | null;
};

export type FeedbackResponse = {
  id: string;
  orderId: string;
  cylinderFull: boolean;
  hadIssues: boolean;
  issueDetails: string | null;
  submittedAt: Date;
};

type OrderWithIncludes = Prisma.OrderGetPayload<{ include: { vendor: true } }>;

class OrdersService extends BaseService {
  async placeOrder(
    userId: string,
    input: PlaceOrderInput,
  ): Promise<OrderResponse> {
    const address = await this.prisma.address.findUnique({
      where: { userId },
    });

    if (!address) {
      throw new BadRequestException(
        "Please add a delivery address before ordering",
      );
    }

    const vendor = await this.prisma.vendor.findFirst({
      where: { id: input.vendorId, isActive: true },
      include: {
        pricing: { where: { cylinderSize: input.cylinderSize } },
      },
    });

    if (!vendor) {
      throw new NotFoundException("Vendor not found");
    }

    const [pricing] = vendor.pricing;
    if (!pricing) {
      throw new NotFoundException(
        "This vendor doesn't offer the selected cylinder size",
      );
    }

    const priceKoboLocked = pricing.priceKobo;
    const deliveryAddress = buildAddressSnapshot(address);

    let createdOrder: OrderWithIncludes | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const reference = generateReferenceCode();

      try {
        createdOrder = await this.prisma.order.create({
          data: {
            reference,
            userId,
            vendorId: vendor.id,
            cylinderSize: input.cylinderSize,
            priceKoboLocked,
            deliveryAddress,
          },
          include: { vendor: true },
        });
        break;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          continue;
        }
        throw err;
      }
    }

    if (!createdOrder) {
      throw new InternalServerException(
        "Failed to generate a unique order reference",
      );
    }

    return toOrderResponse(createdOrder);
  }

  async listMyOrders(userId: string): Promise<OrderResponse[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { vendor: true },
      orderBy: { createdAt: "desc" },
    });

    return orders.map((order) => toOrderResponse(order));
  }

  async getOrder(userId: string, orderId: string): Promise<OrderResponse> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { vendor: true },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return toOrderResponse(order);
  }

  async getReceipt(userId: string, orderId: string): Promise<ReceiptResponse> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { receipt: true },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (!order.receipt) {
      throw new NotFoundException("Receipt not yet submitted");
    }

    return toReceiptResponse(order.receipt);
  }

  async confirmReceipt(
    userId: string,
    orderId: string,
  ): Promise<ReceiptResponse> {
    const { count } = await this.prisma.cylinderReceipt.updateMany({
      where: {
        orderId,
        userConfirmedAt: null,
        order: { is: { userId } },
      },
      data: { userConfirmedAt: new Date() },
    });

    if (count === 0) {
      throw new ConflictException("Cannot confirm this receipt");
    }

    const receipt = await this.prisma.cylinderReceipt.findFirst({
      where: { orderId, order: { is: { userId } } },
    });

    if (!receipt) {
      throw new InternalServerException("Receipt is no longer available");
    }

    return toReceiptResponse(receipt);
  }

  async submitFeedback(
    userId: string,
    orderId: string,
    input: SubmitFeedbackInput,
  ): Promise<FeedbackResponse> {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, userId, status: OrderStatus.DELIVERED },
      });

      if (!order) {
        throw new BadRequestException("Cannot submit feedback for this order");
      }

      let feedback;
      try {
        feedback = await tx.feedback.create({
          data: {
            orderId,
            cylinderFull: input.cylinderFull,
            hadIssues: input.hadIssues,
            ...(input.issueDetails !== undefined && {
              issueDetails: input.issueDetails,
            }),
          },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          throw new ConflictException(
            "Feedback already submitted for this order",
          );
        }
        throw err;
      }

      await trustScoreService.recompute(order.vendorId, tx);

      return toFeedbackResponse(feedback);
    });
  }

  async cancelOrder(
    userId: string,
    orderId: string,
    input: CancelOrderInput,
  ): Promise<OrderResponse> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { vendor: true },
    });

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    if (!canTransition(order.status, OrderStatus.CANCELLED)) {
      throw new BadRequestException("This order can no longer be cancelled");
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
        ...(input.reason !== undefined && {
          cancellationReason: input.reason,
        }),
      },
      include: { vendor: true },
    });

    return toOrderResponse(updated);
  }

  async confirmDelivery(
    userId: string,
    orderId: string,
  ): Promise<OrderResponse> {
    const { count } = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        userId: userId,
        status: OrderStatus.ON_THE_WAY,
      },
      data: {
        status: OrderStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });

    if (count === 0) {
      throw new ConflictException("Cannot confirm delivery for this order");
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { vendor: true },
    });

    if (!order) {
      throw new InternalServerException("Order is no longer available");
    }

    return toOrderResponse(order);
  }
}

function generateReferenceCode(): string {
  const digits = Math.floor(Math.random() * 90000) + 10000;
  return `GH-${digits}`;
}

function buildAddressSnapshot(address: Address): string {
  const base = `${address.streetAddress}, ${address.area}, ${address.city}`;
  return address.landmark ? `${base} (${address.landmark})` : base;
}

export function toOrderResponse(order: OrderWithIncludes): OrderResponse {
  return {
    id: order.id,
    reference: order.reference,
    status: order.status,
    cylinderSize: order.cylinderSize,
    priceKoboLocked: order.priceKoboLocked,
    deliveryAddress: order.deliveryAddress,
    vendor: { id: order.vendor.id, name: order.vendor.name },
    placedAt: order.placedAt,
    riderAssignedAt: order.riderAssignedAt,
    pickedUpAt: order.pickedUpAt,
    refillingAt: order.refillingAt,
    onTheWayAt: order.onTheWayAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    cancellationReason: order.cancellationReason,
  };
}

export function toReceiptResponse(receipt: CylinderReceipt): ReceiptResponse {
  return {
    id: receipt.id,
    orderId: receipt.orderId,
    cylinderSerial: receipt.cylinderSerial,
    weightBeforeKg: receipt.weightBeforeKg,
    photoUrl: receipt.photoUrl,
    loggedAt: receipt.loggedAt,
    userConfirmedAt: receipt.userConfirmedAt,
  };
}

export function toFeedbackResponse(feedback: Feedback): FeedbackResponse {
  return {
    id: feedback.id,
    orderId: feedback.orderId,
    cylinderFull: feedback.cylinderFull,
    hadIssues: feedback.hadIssues,
    issueDetails: feedback.issueDetails,
    submittedAt: feedback.submittedAt,
  };
}

export const ordersService = new OrdersService();
