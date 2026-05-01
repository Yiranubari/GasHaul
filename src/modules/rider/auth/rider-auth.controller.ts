import type { Request, Response } from "express";
import { BaseController } from "@/core/base-controller.js";
import { riderAuthService } from "@/modules/rider/auth/rider-auth.service.js";

class RiderAuthController extends BaseController {
  signin = async (req: Request, res: Response) => {
    const result = await riderAuthService.signin(req.body);
    this.ok(res, result);
  };
}

export const riderAuthController = new RiderAuthController();
