import type { Request, Response } from "express";

import { BaseController } from "@/core/base-controller.js";
import { authService } from "@/modules/auth/auth.service.js";

class AuthController extends BaseController {
  signup = async (req: Request, res: Response): Promise<void> => {
    const result = await authService.signup(req.body);
    this.created(res, result);
  };

  verifyOtp = async (req: Request, res: Response): Promise<void> => {
    const result = await authService.verifyOtp(req.body);
    this.ok(res, result);
  };

  resendOtp = async (req: Request, res: Response): Promise<void> => {
    const result = await authService.resendOtp(req.body);
    this.ok(res, result);
  };

  signin = async (req: Request, res: Response): Promise<void> => {
    const result = await authService.signin(req.body);
    this.ok(res, result);
  };
}

export const authController = new AuthController();
