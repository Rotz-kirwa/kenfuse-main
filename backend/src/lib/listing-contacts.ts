import { Prisma } from "@prisma/client";
import { prisma } from "./db.js";

export const LISTING_CONTACT_ACTIVITY_TYPE = "ADMIN_LISTING_CONTACT_UPDATED";

function parseContact(metadata: Prisma.JsonValue | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }
  const source = metadata as Record<string, unknown>;
  const value = source.vendorContact;
  return typeof value === "string" ? value : "";
}

export async function getListingContactMap(listingIds: string[]) {
  if (listingIds.length === 0) {
    return new Map<string, string>();
  }

  const rows = await prisma.activity.findMany({
    where: {
      type: LISTING_CONTACT_ACTIVITY_TYPE,
      entityType: "MARKETPLACE_LISTING",
      entityId: { in: listingIds },
    },
    orderBy: { createdAt: "desc" },
  });

  const map = new Map<string, string>();
  for (const row of rows) {
    if (map.has(row.entityId)) continue;
    const contact = parseContact(row.metadata);
    if (contact) {
      map.set(row.entityId, contact);
    }
  }
  return map;
}

export async function getListingContact(listingId: string) {
  const row = await prisma.activity.findFirst({
    where: {
      type: LISTING_CONTACT_ACTIVITY_TYPE,
      entityType: "MARKETPLACE_LISTING",
      entityId: listingId,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row) return "";
  return parseContact(row.metadata);
}
