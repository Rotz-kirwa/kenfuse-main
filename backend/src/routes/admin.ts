import { ListingStatus, FundraiserStatus } from "@prisma/client";
import { createSafeRouter } from "../lib/safe-router.js";
import { z } from "zod";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/require-admin.js";
import { logActivity } from "../lib/activity.js";
import { ADMIN_SERVICE_ACTIVITY_TYPE, getServiceDefinitionById, listServices } from "../lib/services-catalog.js";
import { getListingContactMap, LISTING_CONTACT_ACTIVITY_TYPE } from "../lib/listing-contacts.js";

const router = createSafeRouter();

router.use(requireAuth, requireAdmin);

router.get("/overview", async (_req, res) => {
  const [
    users,
    legacyPlans,
    activeFundraisers,
    totalRaised,
    memorials,
    activeListings,
    activities,
    recentActivities,
    fundraiserList,
    memorialList,
    listingList,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.legacyPlan.count(),
    prisma.fundraiser.count({ where: { status: "ACTIVE" } }),
    prisma.fundraiser.aggregate({ _sum: { totalRaised: true } }),
    prisma.memorial.count(),
    prisma.marketplaceListing.count({ where: { status: "ACTIVE" } }),
    prisma.activity.count(),
    prisma.activity.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.fundraiser.findMany({
      include: { owner: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.memorial.findMany({
      include: { owner: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.marketplaceListing.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const listingContacts = await getListingContactMap(listingList.map((item) => item.id));

  return res.json({
    stats: {
      users,
      legacyPlans,
      activeFundraisers,
      totalRaised: totalRaised._sum.totalRaised ?? 0,
      memorials,
      activeListings,
      activities,
    },
    recentActivities,
    fundraiserList,
    memorialList,
    listingList: listingList.map((item) => ({
      ...item,
      vendorContact: listingContacts.get(item.id) ?? null,
    })),
    usersList: await prisma.user.findMany({
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    rolesSummary: {
      admin: await prisma.user.count({ where: { role: "ADMIN" } }),
      user: await prisma.user.count({ where: { role: "USER" } }),
    },
  });
});

const fundraiserStatusSchema = z.object({
  status: z.nativeEnum(FundraiserStatus),
});

router.patch("/fundraisers/:id/status", async (req, res, next) => {
  try {
    const body = fundraiserStatusSchema.parse(req.body);

    const updated = await prisma.fundraiser.update({
      where: { id: req.params.id },
      data: { status: body.status },
    });

    await logActivity({
      userId: req.auth!.userId,
      type: "ADMIN_FUNDRAISER_STATUS_UPDATED",
      entityType: "FUNDRAISER",
      entityId: updated.id,
      metadata: { status: body.status },
    });

    return res.json({ fundraiser: updated });
  } catch (error) {
    return next(error);
  }
});

const listingStatusSchema = z.object({
  status: z.nativeEnum(ListingStatus),
});

const listingImageSchema = z.object({
  imageUrl: z.union([z.string().url(), z.null()]),
});

const listingContactSchema = z.object({
  vendorContact: z.string().min(7).max(40),
});

const createListingSchema = z.object({
  categoryId: z.string().uuid(),
  vendorName: z.string().min(2).max(120),
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(5000),
  price: z.number().int().positive(),
  currency: z.string().length(3).default("KES"),
  imageUrl: z.string().url().optional(),
  vendorContact: z.string().min(7).max(40).optional(),
});

router.patch("/listings/:id/status", async (req, res, next) => {
  try {
    const body = listingStatusSchema.parse(req.body);

    const updated = await prisma.marketplaceListing.update({
      where: { id: req.params.id },
      data: { status: body.status },
    });

    await logActivity({
      userId: req.auth!.userId,
      type: "ADMIN_LISTING_STATUS_UPDATED",
      entityType: "MARKETPLACE_LISTING",
      entityId: updated.id,
      metadata: { status: body.status },
    });

    return res.json({ listing: updated });
  } catch (error) {
    return next(error);
  }
});

router.post("/listings", async (req, res, next) => {
  try {
    const body = createListingSchema.parse(req.body);

    const category = await prisma.marketplaceCategory.findUnique({
      where: { id: body.categoryId },
      select: { id: true },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const listing = await prisma.marketplaceListing.create({
      data: {
        categoryId: body.categoryId,
        vendorName: body.vendorName,
        title: body.title,
        description: body.description,
        price: body.price,
        currency: body.currency.toUpperCase(),
        imageUrl: body.imageUrl,
      } as never,
    });

    await logActivity({
      userId: req.auth!.userId,
      type: "ADMIN_LISTING_CREATED",
      entityType: "MARKETPLACE_LISTING",
      entityId: listing.id,
    });

    if (body.vendorContact) {
      await logActivity({
        userId: req.auth!.userId,
        type: LISTING_CONTACT_ACTIVITY_TYPE,
        entityType: "MARKETPLACE_LISTING",
        entityId: listing.id,
        metadata: { vendorContact: body.vendorContact.trim() },
      });
    }

    return res.status(201).json({ listing });
  } catch (error) {
    return next(error);
  }
});

router.patch("/listings/:id/image", async (req, res, next) => {
  try {
    const body = listingImageSchema.parse(req.body);

    const updated = await prisma.marketplaceListing.update({
      where: { id: req.params.id },
      data: { imageUrl: body.imageUrl } as never,
    });

    await logActivity({
      userId: req.auth!.userId,
      type: "ADMIN_LISTING_IMAGE_UPDATED",
      entityType: "MARKETPLACE_LISTING",
      entityId: updated.id,
      metadata: { imageUrl: body.imageUrl },
    });

    return res.json({ listing: updated });
  } catch (error) {
    return next(error);
  }
});

router.patch("/listings/:id/contact", async (req, res, next) => {
  try {
    const body = listingContactSchema.parse(req.body);
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: req.params.id },
      select: { id: true },
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    await logActivity({
      userId: req.auth!.userId,
      type: LISTING_CONTACT_ACTIVITY_TYPE,
      entityType: "MARKETPLACE_LISTING",
      entityId: listing.id,
      metadata: { vendorContact: body.vendorContact.trim() },
    });

    return res.json({
      listing: {
        id: listing.id,
        vendorContact: body.vendorContact.trim(),
      },
    });
  } catch (error) {
    return next(error);
  }
});

const memorialVisibilitySchema = z.object({
  isPublic: z.boolean(),
});

router.patch("/memorials/:id/visibility", async (req, res, next) => {
  try {
    const body = memorialVisibilitySchema.parse(req.body);

    const updated = await prisma.memorial.update({
      where: { id: req.params.id },
      data: { isPublic: body.isPublic },
    });

    await logActivity({
      userId: req.auth!.userId,
      type: "ADMIN_MEMORIAL_VISIBILITY_UPDATED",
      entityType: "MEMORIAL",
      entityId: updated.id,
      metadata: { isPublic: body.isPublic },
    });

    return res.json({ memorial: updated });
  } catch (error) {
    return next(error);
  }
});

const updateServiceSchema = z
  .object({
    title: z.string().min(2).max(180).optional(),
    imageUrl: z.string().url().nullable().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
  });

router.get("/services", async (_req, res) => {
  const services = await listServices(true);
  return res.json({ services });
});

router.patch("/services/:id", async (req, res, next) => {
  try {
    const serviceId = req.params.id;
    const definition = getServiceDefinitionById(serviceId);
    if (!definition) {
      return res.status(404).json({ error: "Service not found" });
    }

    const body = updateServiceSchema.parse(req.body);
    const current = (await listServices(true)).find((item) => item.id === serviceId);
    if (!current) {
      return res.status(404).json({ error: "Service not found" });
    }

    const payload = {
      title: body.title ?? current.title,
      imageUrl: body.imageUrl !== undefined ? body.imageUrl : current.imageUrl,
      isActive: body.isActive ?? current.isActive,
      sortOrder: body.sortOrder ?? current.sortOrder,
    };

    await logActivity({
      userId: req.auth!.userId,
      type: ADMIN_SERVICE_ACTIVITY_TYPE,
      entityType: "SERVICE",
      entityId: serviceId,
      metadata: payload,
    });

    return res.json({
      service: {
        id: serviceId,
        ...payload,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
