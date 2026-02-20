import { FundraiserStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../lib/activity.js";

const router = Router();

const fundraiserCreateSchema = z.object({
  title: z.string().min(3).max(120),
  story: z.string().min(10).max(8000),
  targetAmount: z.number().int().positive(),
  currency: z.string().length(3).default("KES"),
});

router.get("/", async (req, res) => {
  const statusParam = req.query.status;

  const status =
    typeof statusParam === "string" && statusParam in FundraiserStatus
      ? (statusParam as FundraiserStatus)
      : undefined;

  const fundraisers = await prisma.fundraiser.findMany({
    where: status ? { status } : undefined,
    include: {
      owner: {
        select: { id: true, fullName: true },
      },
      _count: {
        select: { contributions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ fundraisers });
});

router.get("/:id", async (req, res) => {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: req.params.id },
    include: {
      owner: {
        select: { id: true, fullName: true },
      },
      contributions: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!fundraiser) {
    return res.status(404).json({ error: "Fundraiser not found" });
  }

  return res.json({ fundraiser });
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = fundraiserCreateSchema.parse(req.body);

    const fundraiser = await prisma.fundraiser.create({
      data: {
        ownerId: req.auth!.userId,
        title: body.title,
        story: body.story,
        targetAmount: body.targetAmount,
        currency: body.currency.toUpperCase(),
      },
    });

    await logActivity({
      userId: req.auth!.userId,
      type: "FUNDRAISER_CREATED",
      entityType: "FUNDRAISER",
      entityId: fundraiser.id,
    });

    return res.status(201).json({ fundraiser });
  } catch (error) {
    return next(error);
  }
});

const contributionSchema = z.object({
  contributorName: z.string().min(2).max(120),
  contributorEmail: z.string().email().optional(),
  amount: z.number().int().positive(),
  message: z.string().max(1000).optional(),
});

router.post("/:id/contributions", async (req, res, next) => {
  try {
    const body = contributionSchema.parse(req.body);

    const fundraiser = await prisma.fundraiser.findUnique({ where: { id: req.params.id } });

    if (!fundraiser || fundraiser.status !== "ACTIVE") {
      return res.status(404).json({ error: "Active fundraiser not found" });
    }

    const contribution = await prisma.$transaction(async (tx) => {
      const created = await tx.fundraiserContribution.create({
        data: {
          fundraiserId: req.params.id,
          contributorName: body.contributorName,
          contributorEmail: body.contributorEmail,
          amount: body.amount,
          message: body.message,
        },
      });

      await tx.fundraiser.update({
        where: { id: req.params.id },
        data: { totalRaised: { increment: body.amount } },
      });

      return created;
    });

    await logActivity({
      type: "FUNDRAISER_CONTRIBUTION_CREATED",
      entityType: "FUNDRAISER_CONTRIBUTION",
      entityId: contribution.id,
      metadata: { fundraiserId: req.params.id, amount: body.amount },
    });

    return res.status(201).json({ contribution });
  } catch (error) {
    return next(error);
  }
});

export default router;
