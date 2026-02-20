import { Prisma } from "@prisma/client";
import { createSafeRouter } from "../lib/safe-router.js";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../lib/activity.js";

const router = createSafeRouter();

const legacyPlanSchema = z.object({
  wishes: z.string().max(10000).optional(),
  instructions: z.string().max(10000).optional(),
  assets: z.array(z.record(z.unknown())).optional(),
  beneficiaries: z.array(z.record(z.unknown())).optional(),
});

router.use(requireAuth);

router.get("/me", async (req, res) => {
  const legacyPlan = await prisma.legacyPlan.findUnique({
    where: { userId: req.auth!.userId },
  });

  return res.json({ legacyPlan });
});

router.put("/me", async (req, res, next) => {
  try {
    const body = legacyPlanSchema.parse(req.body);
    const payload = {
      wishes: body.wishes,
      instructions: body.instructions,
      assets: body.assets as Prisma.InputJsonValue | undefined,
      beneficiaries: body.beneficiaries as Prisma.InputJsonValue | undefined,
    };

    const legacyPlan = await prisma.legacyPlan.upsert({
      where: { userId: req.auth!.userId },
      update: payload,
      create: {
        userId: req.auth!.userId,
        ...payload,
      },
    });

    await logActivity({
      userId: req.auth!.userId,
      type: "LEGACY_PLAN_UPDATED",
      entityType: "LEGACY_PLAN",
      entityId: legacyPlan.id,
    });

    return res.json({ legacyPlan });
  } catch (error) {
    return next(error);
  }
});

export default router;
