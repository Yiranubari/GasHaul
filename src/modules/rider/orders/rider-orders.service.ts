import { BaseService } from "@/core/base-service.js";
import {
  toOrderResponse,
  type OrderResponse,
} from "@/modules/orders/orders.service.js";
import { OrderStatus, Prisma } from "@prisma/client";
import {
  ConflictException,
  InternalServerException,
} from "@/exceptions/app-exceptions.js";

class RiderOrdersService extends BaseService {
  async listAvailable(): Promise<OrderResponse[]> {
    const orders = await this.prisma.order.findMany({
      where: { status: OrderStatus.ORDER_PLACED, riderId: null },
      include: { vendor: true },
      orderBy: { createdAt: "asc" },
    });
    return orders.map((order) => toOrderResponse(order));
  }

  async listMine(riderId: string): Promise<OrderResponse[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        riderId: riderId,
        status: {
          in: [
            OrderStatus.RIDER_ASSIGNED,
            OrderStatus.CYLINDER_PICKED_UP,
            OrderStatus.REFILLING_IN_PROGRESS,
            OrderStatus.ON_THE_WAY,
          ],
        },
      },
      include: { vendor: true },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((order) => toOrderResponse(order));
  }

  async claim(riderId: string, orderId: string): Promise<OrderResponse> {
    const { count } = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        status: OrderStatus.ORDER_PLACED,
        riderId: null,
      },
      data: {
        status: OrderStatus.RIDER_ASSIGNED,
        riderId: riderId,
        riderAssignedAt: new Date(),
      },
    });

    if (count === 0) {
      throw new ConflictException("Order is no longer available");
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

  async drop(riderId: string, orderId: string): Promise<OrderResponse> {
    const { count } = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        riderId: riderId,
        status: OrderStatus.RIDER_ASSIGNED,
      },
      data: {
        status: OrderStatus.ORDER_PLACED,
        riderId: null,
      },
    });

    if (count === 0) {
      throw new ConflictException("Cannot drop this order");
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

  async refilling(riderId: string, orderId: string): Promise<OrderResponse> {
    return this.transition(
      riderId,
      orderId,
      OrderStatus.CYLINDER_PICKED_UP,
      OrderStatus.REFILLING_IN_PROGRESS,
      "refillingAt",
    );
  }

  async onTheWay(riderId: string, orderId: string): Promise<OrderResponse> {
    return this.transition(
      riderId,
      orderId,
      OrderStatus.REFILLING_IN_PROGRESS,
      OrderStatus.ON_THE_WAY,
      "onTheWayAt",
    );
  }

  private async transition(
    riderId: string,
    orderId: string,
    fromStatus: OrderStatus,
    toStatus: OrderStatus,
    timestampField: "pickedUpAt" | "refillingAt" | "onTheWayAt" | "deliveredAt",
  ): Promise<OrderResponse> {
    const { count } = await this.prisma.order.updateMany({
      where: {
        id: orderId,
        riderId: riderId,
        status: fromStatus,
      },
      data: {
        status: toStatus,
        [timestampField]: new Date(),
      } as Prisma.OrderUpdateInput,
    });

    if (count === 0) {
      throw new ConflictException("Cannot update this order");
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

export const riderOrdersService = new RiderOrdersService();
