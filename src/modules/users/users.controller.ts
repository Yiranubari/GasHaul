import type { Request, Response } from "express";
import { BaseController } from "@/core/base-controller.js";
import { usersService } from "@/modules/users/users.service.js";
import { UnauthorizedException } from "@/exceptions/app-exceptions.js";

class UsersController extends BaseController {
  getMe = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await usersService.getMe(req.user.id);
    this.ok(res, result);
  };

  saveAddress = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw new UnauthorizedException();
    const result = await usersService.saveAddress(req.user.id, req.body);
    this.ok(res, result);
  };
}

export const usersController = new UsersController();
