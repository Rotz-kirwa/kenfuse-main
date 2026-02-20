import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/db.js";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.auth;

  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, role: true },
  });

  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  if (user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }

  return next();
}
