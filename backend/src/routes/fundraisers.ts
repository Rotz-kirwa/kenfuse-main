import { FundraiserStatus, Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { verifyToken } from "../lib/auth.js";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { logActivity } from "../lib/activity.js";

const router = Router();
type InviteVisibility = "PUBLIC" | "LINK_ONLY" | "PRIVATE";
const INVITE_ACTIVITY_TYPE = "FUNDRAISER_INVITE_CONFIG";

const fundraiserCreateSchema = z.object({
  title: z.string().min(3).max(120),
  story: z.string().min(10).max(8000),
  targetAmount: z.number().int().positive(),
  currency: z.string().length(3).default("KES"),
  visibilityType: z.enum(["PUBLIC", "LINK_ONLY", "PRIVATE"]).default("PUBLIC"),
});

function normalizeInviteCode(value: string | undefined) {
  if (!value) return "";
  return value.trim().toUpperCase();
}

function getOptionalAuthUserId(header: string | undefined) {
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  try {
    return verifyToken(token).userId;
  } catch {
    return null;
  }
}

async function generateUniqueInviteCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const code = `KF${Math.random().toString(36).slice(2, 6).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const existing = await prisma.activity.findFirst({
      where: {
        type: INVITE_ACTIVITY_TYPE,
        metadata: {
          path: ["inviteCode"],
          equals: code,
        },
      },
      select: { id: true },
    });
    if (!existing) {
      return code;
    }
  }

  throw new Error("Failed to generate unique invite code");
}

function canAccessFundraiser(args: {
  ownerId: string;
  requesterId: string | null;
  visibilityType: InviteVisibility;
  providedCode?: string;
  inviteCode?: string | null;
}) {
  const { ownerId, requesterId, visibilityType, providedCode, inviteCode } = args;

  if (requesterId && requesterId === ownerId) {
    return true;
  }

  if (visibilityType === "PUBLIC") {
    return true;
  }

  const normalizedProvided = normalizeInviteCode(providedCode);
  const normalizedSaved = normalizeInviteCode(inviteCode ?? undefined);
  return normalizedProvided.length > 0 && normalizedProvided === normalizedSaved;
}

function extractInviteConfig(metadata: Prisma.JsonValue | null | undefined) {
  const fallback = { visibilityType: "PUBLIC" as InviteVisibility, inviteCode: "" };
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return fallback;
  }

  const source = metadata as Record<string, unknown>;
  const visibilityCandidate = source.visibilityType;
  const inviteCodeCandidate = source.inviteCode;

  const visibilityType: InviteVisibility =
    visibilityCandidate === "LINK_ONLY" || visibilityCandidate === "PRIVATE" || visibilityCandidate === "PUBLIC"
      ? visibilityCandidate
      : "PUBLIC";
  const inviteCode = typeof inviteCodeCandidate === "string" ? inviteCodeCandidate : "";

  return { visibilityType, inviteCode };
}

async function getInviteConfigs(fundraiserIds: string[]) {
  if (fundraiserIds.length === 0) {
    return new Map<string, { visibilityType: InviteVisibility; inviteCode: string }>();
  }

  const rows = await prisma.activity.findMany({
    where: {
      type: INVITE_ACTIVITY_TYPE,
      entityType: "FUNDRAISER",
      entityId: { in: fundraiserIds },
    },
    orderBy: { createdAt: "desc" },
  });

  const map = new Map<string, { visibilityType: InviteVisibility; inviteCode: string }>();

  for (const row of rows) {
    if (map.has(row.entityId)) continue;
    map.set(row.entityId, extractInviteConfig(row.metadata));
  }

  return map;
}

async function getFundraiserInviteConfig(fundraiserId: string) {
  const row = await prisma.activity.findFirst({
    where: {
      type: INVITE_ACTIVITY_TYPE,
      entityType: "FUNDRAISER",
      entityId: fundraiserId,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row) {
    return { visibilityType: "PUBLIC" as InviteVisibility, inviteCode: "" };
  }

  return extractInviteConfig(row.metadata);
}

router.get("/", async (req, res) => {
  const statusParam = req.query.status;
  const requesterId = getOptionalAuthUserId(req.headers.authorization);

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

  const inviteConfigs = await getInviteConfigs(fundraisers.map((item) => item.id));

  const filtered = fundraisers
    .filter((item) => {
      if (requesterId && requesterId === item.ownerId) {
        return true;
      }

      const config = inviteConfigs.get(item.id);
      const visibility = config?.visibilityType ?? "PUBLIC";
      return visibility === "PUBLIC";
    })
    .map((item) => {
      const config = inviteConfigs.get(item.id);
      if (requesterId && requesterId === item.ownerId) {
        return {
          ...item,
          visibilityType: config?.visibilityType ?? "PUBLIC",
          inviteCode: config?.inviteCode ?? "",
        };
      }

      return {
        ...item,
        visibilityType: config?.visibilityType ?? "PUBLIC",
      };
    });

  return res.json({ fundraisers: filtered });
});

router.get("/:id", async (req, res) => {
  const requesterId = getOptionalAuthUserId(req.headers.authorization);
  const inviteCodeFromQuery = typeof req.query.inviteCode === "string" ? req.query.inviteCode : undefined;

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

  const inviteConfig = await getFundraiserInviteConfig(fundraiser.id);

  const canAccess = canAccessFundraiser({
    ownerId: fundraiser.ownerId,
    requesterId,
    visibilityType: inviteConfig.visibilityType,
    providedCode: inviteCodeFromQuery,
    inviteCode: inviteConfig.inviteCode,
  });

  if (!canAccess) {
    return res.status(403).json({ error: "Invite code required to view this fundraiser" });
  }

  return res.json({
    fundraiser: {
      ...fundraiser,
      visibilityType: inviteConfig.visibilityType,
      ...(requesterId && requesterId === fundraiser.ownerId ? { inviteCode: inviteConfig.inviteCode } : {}),
    },
  });
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = fundraiserCreateSchema.parse(req.body);
    const inviteCode = await generateUniqueInviteCode();

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
      type: INVITE_ACTIVITY_TYPE,
      entityType: "FUNDRAISER",
      entityId: fundraiser.id,
      metadata: {
        visibilityType: body.visibilityType,
        inviteCode,
      },
    });

    await logActivity({
      userId: req.auth!.userId,
      type: "FUNDRAISER_CREATED",
      entityType: "FUNDRAISER",
      entityId: fundraiser.id,
    });

    return res.status(201).json({
      fundraiser: {
        ...fundraiser,
        visibilityType: body.visibilityType,
        inviteCode,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id/invite", requireAuth, async (req, res) => {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: req.params.id },
    select: { id: true, ownerId: true, title: true },
  });

  if (!fundraiser) {
    return res.status(404).json({ error: "Fundraiser not found" });
  }

  if (fundraiser.ownerId !== req.auth!.userId) {
    return res.status(403).json({ error: "Only the fundraiser owner can manage invite access" });
  }

  let inviteConfig = await getFundraiserInviteConfig(fundraiser.id);
  if (!inviteConfig.inviteCode) {
    inviteConfig = { ...inviteConfig, inviteCode: await generateUniqueInviteCode() };
    await logActivity({
      userId: req.auth!.userId,
      type: INVITE_ACTIVITY_TYPE,
      entityType: "FUNDRAISER",
      entityId: fundraiser.id,
      metadata: inviteConfig,
    });
  }

  const inviteLinkPath = `/fundraiser?fundraiserId=${encodeURIComponent(fundraiser.id)}&inviteCode=${encodeURIComponent(inviteConfig.inviteCode)}`;

  return res.json({
    invite: {
      fundraiserId: fundraiser.id,
      title: fundraiser.title,
      visibilityType: inviteConfig.visibilityType,
      inviteCode: inviteConfig.inviteCode,
      inviteLinkPath,
    },
  });
});

router.post("/:id/invite-code/regenerate", requireAuth, async (req, res, next) => {
  try {
    const fundraiser = await prisma.fundraiser.findUnique({
      where: { id: req.params.id },
      select: { id: true, ownerId: true, title: true },
    });

    if (!fundraiser) {
      return res.status(404).json({ error: "Fundraiser not found" });
    }

    if (fundraiser.ownerId !== req.auth!.userId) {
      return res.status(403).json({ error: "Only the fundraiser owner can regenerate invite code" });
    }

    const inviteCode = await generateUniqueInviteCode();
    const current = await getFundraiserInviteConfig(fundraiser.id);
    await logActivity({
      userId: req.auth!.userId,
      type: INVITE_ACTIVITY_TYPE,
      entityType: "FUNDRAISER",
      entityId: fundraiser.id,
      metadata: { ...current, inviteCode },
    });

    await logActivity({
      userId: req.auth!.userId,
      type: "FUNDRAISER_INVITE_CODE_REGENERATED",
      entityType: "FUNDRAISER",
      entityId: fundraiser.id,
      metadata: { inviteCode },
    });

    const inviteLinkPath = `/fundraiser?fundraiserId=${encodeURIComponent(fundraiser.id)}&inviteCode=${encodeURIComponent(inviteCode)}`;

    return res.json({
      invite: {
        fundraiserId: fundraiser.id,
        title: fundraiser.title,
        inviteCode,
        inviteLinkPath,
      },
    });
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
    const requesterId = getOptionalAuthUserId(req.headers.authorization);
    const inviteCodeFromQuery = typeof req.query.inviteCode === "string" ? req.query.inviteCode : undefined;

    const fundraiser = await prisma.fundraiser.findUnique({ where: { id: req.params.id } });

    if (!fundraiser || fundraiser.status !== "ACTIVE") {
      return res.status(404).json({ error: "Active fundraiser not found" });
    }

    const inviteConfig = await getFundraiserInviteConfig(fundraiser.id);

    const canAccess = canAccessFundraiser({
      ownerId: fundraiser.ownerId,
      requesterId,
      visibilityType: inviteConfig.visibilityType,
      providedCode: inviteCodeFromQuery,
      inviteCode: inviteConfig.inviteCode,
    });

    if (!canAccess) {
      return res.status(403).json({ error: "Invite code required to contribute to this fundraiser" });
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
