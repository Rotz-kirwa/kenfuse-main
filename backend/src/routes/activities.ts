import { Router } from "express";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const activities = await prisma.activity.findMany({
    where: { userId: req.auth!.userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return res.json({ activities });
});

router.get("/feed", async (_req, res) => {
  const activities = await prisma.activity.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return res.json({ activities });
});

export default router;
