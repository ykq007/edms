import type { NextFunction, Request, Response } from "express";
import { isHttpError } from "../errors/httpError";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  if (res.headersSent) {
    return next(error);
  }

  if (isHttpError(error)) {
    const payload: Record<string, unknown> = { error: error.message };
    if (error.details !== undefined) {
      payload.details = error.details;
    }

    return res.status(error.statusCode).json(payload);
  }

  console.error("Unhandled error while processing request", error);
  return res.status(500).json({ error: "Internal Server Error" });
};
