import type { Request, Response, NextFunction } from "express";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: "Not Found" });
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err?.status || 500;
  const message = err?.message || "Internal Server Error";
  if (status >= 500) {
    console.error("[ERROR]", err);
  }
  res.status(status).json({ error: message });
}
