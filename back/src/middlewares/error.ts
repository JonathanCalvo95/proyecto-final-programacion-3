import { Request, Response, NextFunction } from "express";
import { logError } from "../utils/logger";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logError(err);
  const status = err.status || 500;
  res
    .status(status)
    .json({ error: err.message || "Error interno del servidor" });
}
