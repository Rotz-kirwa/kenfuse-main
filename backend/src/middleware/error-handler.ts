import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Validation error",
      details: error.flatten(),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021") {
      return res.status(503).json({
        error: "Database schema not initialized",
        code: error.code,
        hint: "Run `npx prisma db push` against the production DATABASE_URL.",
      });
    }

    return res.status(500).json({
      error: "Database request failed",
      code: error.code,
    });
  }

  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
}
