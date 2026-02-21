import { createSafeRouter } from "../lib/safe-router.js";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/require-admin.js";
import { logActivity } from "../lib/activity.js";
import { getListingContactMap, LISTING_CONTACT_ACTIVITY_TYPE } from "../lib/listing-contacts.js";

const router = createSafeRouter();
const VENDOR_APPLICATION_SUBMITTED_TYPE = "VENDOR_APPLICATION_SUBMITTED";
const VENDOR_APPLICATION_ENTITY_TYPE = "VENDOR_APPLICATION";

router.get("/categories", async (_req, res) => {
  const categories = await prisma.marketplaceCategory.findMany({
    orderBy: { name: "asc" },
  });

  return res.json({ categories });
});

router.get("/listings", async (req, res) => {
  const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;

  const listings = await prisma.marketplaceListing.findMany({
    where: {
      status: "ACTIVE",
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const contacts = await getListingContactMap(listings.map((item) => item.id));

  return res.json({
    listings: listings.map((item) => ({
      ...item,
      vendorContact: contacts.get(item.id) ?? null,
    })),
  });
});

const listingSchema = z.object({
  categoryId: z.string().uuid(),
  vendorName: z.string().min(2).max(120),
  title: z.string().min(3).max(140),
  description: z.string().min(10).max(5000),
  price: z.number().int().positive(),
  currency: z.string().length(3).default("KES"),
  vendorContact: z.string().min(7).max(40).optional(),
});

router.post("/listings", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = listingSchema.parse(req.body);

    const category = await prisma.marketplaceCategory.findUnique({ where: { id: body.categoryId } });

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
      },
      include: {
        category: true,
      },
    });

    await logActivity({
      userId: req.auth!.userId,
      type: "MARKETPLACE_LISTING_CREATED",
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

const vendorApplicationSchema = z.object({
  businessName: z.string().min(2).max(160),
  businessType: z.enum(["INDIVIDUAL", "REGISTERED_BUSINESS", "COMPANY"]),
  ownerFullName: z.string().min(2).max(160),
  email: z.string().email(),
  phoneNumber: z.string().min(7).max(40),
  whatsappNumber: z.string().min(7).max(40).optional(),
  idOrRegistrationNumber: z.string().min(3).max(120),
  businessCategory: z.string().min(2).max(120),
  businessDescription: z.string().min(10).max(4000),
  county: z.string().min(2).max(120),
  physicalAddress: z.string().min(2).max(240).optional(),
  offersDelivery: z.boolean(),
  yearsInBusiness: z.number().int().min(0).max(100),
});

router.post("/vendor-applications", async (req, res, next) => {
  try {
    const body = vendorApplicationSchema.parse(req.body);
    const applicationId = randomUUID();

    await prisma.activity.create({
      data: {
        userId: req.auth?.userId ?? null,
        type: VENDOR_APPLICATION_SUBMITTED_TYPE,
        entityType: VENDOR_APPLICATION_ENTITY_TYPE,
        entityId: applicationId,
        metadata: {
          ...body,
          status: "PENDING",
        },
      },
    });

    return res.status(201).json({
      applicationId,
      status: "PENDING",
      message: "Vendor application submitted successfully.",
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
