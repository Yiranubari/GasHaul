import type { Request, Response } from "express";
import { BaseController } from "@/core/base-controller.js";
import { UnauthorizedException } from "@/exceptions/app-exceptions.js";
import { vendorsService } from "@/modules/vendors/vendors.service.js";

class VendorsController extends BaseController {
  list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await vendorsService.listVendors(req.user.id);
    this.ok(res, result);
  };
}

export const vendorsController = new VendorsController();
