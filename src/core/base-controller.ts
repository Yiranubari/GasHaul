import type { Response } from "express";

/**
 * Base class for all controllers.
 *
 * Provides standard response helpers that wrap Express responses in a
 * consistent envelope: { status: 'success', data: <T> }.
 *
 * Concrete controllers should extend this class and use the protected
 * helpers (this.ok, this.created, etc.) inside their handler methods.
 *
 * Example:
 *   class AuthController extends BaseController {
 *     signup = async (req: Request, res: Response) => {
 *       const result = await authService.signup(req.body);
 *       return this.ok(res, result);
 *     };
 *   }
 */
export abstract class BaseController {
  protected ok<T>(res: Response, data: T): void {
    res.status(200).json({ status: "success", data });
  }

  protected created<T>(res: Response, data: T): void {
    res.status(201).json({ status: "success", data });
  }

  protected noContent(res: Response): void {
    res.status(204).send();
  }
}
