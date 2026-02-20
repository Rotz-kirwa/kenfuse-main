import { Router } from "express";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../lib/activity.js";

const router = Router();

const memorialSchema = z.object({
  fullName: z.string().min(3).max(140),
  shortTagline: z.string().max(180).optional(),
  description: z.string().max(10000).optional(),
  coverImage: z.string().url().optional(),
  visibilityType: z.enum(["PUBLIC", "PRIVATE", "LINK_ONLY"]).default("PUBLIC"),
  dateOfBirth: z.string().datetime().optional(),
  dateOfPassing: z.string().datetime().optional(),
  location: z.string().max(160).optional(),
  relationshipToCreator: z.string().max(80).optional(),
  highlights: z.array(z.string().max(120)).optional(),
  valuesLegacy: z.string().max(5000).optional(),
  serviceMode: z.enum(["PUBLISH_NOW", "ADD_NOW"]).default("PUBLISH_NOW"),
  serviceDetails: z.record(z.unknown()).optional(),
  media: z.record(z.unknown()).optional(),
  settings: z.record(z.unknown()).optional(),
});

router.get("/", async (_req, res) => {
  const memorials = await prisma.memorial.findMany({
    where: { isPublic: true },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
        },
      },
      _count: {
        select: { tributes: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json({ memorials });
});

router.get("/:id", async (req, res) => {
  const memorial = await prisma.memorial.findUnique({
    where: { id: req.params.id },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
        },
      },
      tributes: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!memorial) {
    return res.status(404).json({ error: "Memorial not found" });
  }

  return res.json({ memorial });
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = memorialSchema.parse(req.body);
    const visibilityType = body.visibilityType;
    const isPublic = visibilityType === "PUBLIC";
    const inviteCode = visibilityType === "PUBLIC" ? null : crypto.randomUUID().slice(0, 10);

    const memorial = await prisma.memorial.create({
      data: {
        ownerId: req.auth!.userId,
        title: body.fullName,
        description: body.description,
        coverImage: body.coverImage,
        isPublic,
        visibilityType,
        inviteCode,
        metadata: {
          shortTagline: body.shortTagline,
          dateOfBirth: body.dateOfBirth,
          dateOfPassing: body.dateOfPassing,
          location: body.location,
          relationshipToCreator: body.relationshipToCreator,
          highlights: body.highlights ?? [],
          valuesLegacy: body.valuesLegacy,
          serviceMode: body.serviceMode,
          serviceDetails: body.serviceDetails ?? {},
          media: body.media ?? {},
          settings: body.settings ?? {},
        },
      } as never,
    });

    await logActivity({
      userId: req.auth!.userId,
      type: "MEMORIAL_CREATED",
      entityType: "MEMORIAL",
      entityId: memorial.id,
    });

    return res.status(201).json({ memorial });
  } catch (error) {
    return next(error);
  }
});

const tributeSchema = z.object({
  authorName: z.string().min(2).max(120),
  message: z.string().min(3).max(2000),
});

router.post("/:id/tributes", async (req, res, next) => {
  try {
    const body = tributeSchema.parse(req.body);

    const memorial = await prisma.memorial.findUnique({ where: { id: req.params.id } });

    if (!memorial) {
      return res.status(404).json({ error: "Memorial not found" });
    }

    if (!memorial.isPublic) {
      return res.status(403).json({ error: "Tributes are disabled for private memorials" });
    }

    const tribute = await prisma.memorialTribute.create({
      data: {
        memorialId: req.params.id,
        authorName: body.authorName,
        message: body.message,
      },
    });

    await logActivity({
      type: "MEMORIAL_TRIBUTE_CREATED",
      entityType: "MEMORIAL_TRIBUTE",
      entityId: tribute.id,
      metadata: { memorialId: req.params.id },
    });

    return res.status(201).json({ tribute });
  } catch (error) {
    return next(error);
  }
});

export default router;
