import type { Request, Response } from "express";
import { BaseController } from "@/core/base-controller.js";
import { UnauthorizedException } from "@/exceptions/app-exceptions.js";
import { riderOrdersService } from "@/modules/rider/orders/rider-orders.service.js";

class RiderOrdersController extends BaseController {
  listAvailable = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await riderOrdersService.listAvailable();
    this.ok(res, result);
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await riderOrdersService.listMine(req.user.id);
    this.ok(res, result);
  };

  claim = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await riderOrdersService.claim(
      req.user.id,
      req.params.id as string,
    );
    this.ok(res, result);
  };

  drop = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await riderOrdersService.drop(
      req.user.id,
      req.params.id as string,
    );
    this.ok(res, result);
  };

  refilling = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await riderOrdersService.refilling(
      req.user.id,
      req.params.id as string,
    );
    this.ok(res, result);
  };

  onTheWay = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await riderOrdersService.onTheWay(
      req.user.id,
      req.params.id as string,
    );
    this.ok(res, result);
  };
}

export const riderOrdersController = new RiderOrdersController();
