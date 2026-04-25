import type { Response } from "express";

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
