import { OrderStatus } from "@prisma/client";

export const orderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.ORDER_PLACED]: [
    OrderStatus.RIDER_ASSIGNED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.RIDER_ASSIGNED]: [
    OrderStatus.CYLINDER_PICKED_UP,
    OrderStatus.ORDER_PLACED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.CYLINDER_PICKED_UP]: [OrderStatus.REFILLING_IN_PROGRESS],
  [OrderStatus.REFILLING_IN_PROGRESS]: [OrderStatus.ON_THE_WAY],
  [OrderStatus.ON_THE_WAY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return orderStatusTransitions[from].includes(to);
}
