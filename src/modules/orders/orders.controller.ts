import type { Request, Response } from "express";
import { BaseController } from "@/core/base-controller.js";
import { UnauthorizedException } from "@/exceptions/app-exceptions.js";
import { ordersService } from "@/modules/orders/orders.service.js";

class OrdersController extends BaseController {
  place = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await ordersService.placeOrder(req.user.id, req.body);
    this.created(res, result);
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await ordersService.listMyOrders(req.user.id);
    this.ok(res, result);
  };

  get = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await ordersService.getOrder(
      req.user.id,
      req.params.id as string,
    );
    this.ok(res, result);
  };

  getReceipt = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await ordersService.getReceipt(
      req.user.id,
      req.params.id as string,
    );
    this.ok(res, result);
  };

  confirmReceipt = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await ordersService.confirmReceipt(
      req.user.id,
      req.params.id as string,
    );
    this.ok(res, result);
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await ordersService.cancelOrder(
      req.user.id,
      req.params.id as string,
      req.body,
    );
    this.ok(res, result);
  };

  confirmDelivery = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await ordersService.confirmDelivery(
      req.user.id,
      req.params.id as string,
    );
    this.ok(res, result);
  };
}

export const ordersController = new OrdersController();
