import { Prisma } from "@prisma/client";
import { prisma } from "./db.js";

export const ADMIN_SERVICE_ACTIVITY_TYPE = "ADMIN_SERVICE_UPDATED";
const SERVICE_ENTITY_TYPE = "SERVICE";

const serviceNames = [
  "Administration of Estate",
  "Air Freight (Repatriation)",
  "Air Freight (Within Kenya)",
  "Anatomical Donation",
  "Associations - Professional",
  "Autopsy Services",
  "Body Reconstruction",
  "Burial Permit",
  "Catering",
  "Church/Chapel Service",
  "Coffin Perfume",
  "Coffin/Casket Dealers",
  "Condolences Books",
  "Cremation Service",
  "Crosses",
  "Death Certificate",
  "Death Notification",
  "Death Records Retrieval",
  "DNA Retrieval/Preservation",
  "Embalming Services",
  "Eulogy Writing Services",
  "Exhumation Services",
  "First Aid Services",
  "Flowers/Wreaths",
  "Funeral Directors",
  "Funeral Home/Mortuary",
  "Funeral Insurance Cover",
  "Funeral Keepsakes",
  "Funeral Programme Design",
  "Funeral Programme Printing",
  "Funeral Wear",
  "Grave Diggers/Construction",
  "Grave Maintenance",
  "Grave Reservation",
  "Grief/Bereavement Counselling",
  "Headstone/Tombstone",
  "Hearse",
  "Hospice Care",
  "Implants Recovery",
  "Mausoleum Design/Construction",
  "Meeting Venues",
  "Memorial Boards",
  "Memorial Jewelry",
  "Mobile Toilets",
  "Mortuary Cosmetologist",
  "Mortuary Science Colleges",
  "Obituaries - Newspapers",
  "Obituaries - Radio",
  "Palliative Care",
  "Personalized Memorial Items",
  "Pet Funerals",
  "Photography",
  "Public Address System",
  "Sympathy Cards",
  "Tents/Seats",
  "Transportation/Car Hire Services",
  "Trust Registration",
  "Urns",
  "Video & Streaming Services",
  "Wills/Estate Planning",
];

function toServiceId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const SERVICE_DEFINITIONS = serviceNames.map((title, index) => ({
  id: toServiceId(title),
  title,
  sortOrder: index,
}));

export interface ServiceItem {
  id: string;
  title: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string | null;
}

function parseServiceMetadata(metadata: Prisma.JsonValue | null | undefined) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {
      title: undefined,
      imageUrl: undefined,
      isActive: undefined,
      sortOrder: undefined,
    };
  }

  const source = metadata as Record<string, unknown>;
  return {
    title: typeof source.title === "string" ? source.title : undefined,
    imageUrl:
      source.imageUrl === null
        ? null
        : typeof source.imageUrl === "string"
          ? source.imageUrl
          : undefined,
    isActive: typeof source.isActive === "boolean" ? source.isActive : undefined,
    sortOrder: typeof source.sortOrder === "number" ? source.sortOrder : undefined,
  };
}

export async function listServices(includeInactive = false): Promise<ServiceItem[]> {
  const updates = await prisma.activity.findMany({
    where: {
      type: ADMIN_SERVICE_ACTIVITY_TYPE,
      entityType: SERVICE_ENTITY_TYPE,
    },
    orderBy: { createdAt: "desc" },
  });

  const latestById = new Map<string, { createdAt: Date; metadata: Prisma.JsonValue | null }>();
  for (const item of updates) {
    if (!latestById.has(item.entityId)) {
      latestById.set(item.entityId, { createdAt: item.createdAt, metadata: item.metadata });
    }
  }

  const merged = SERVICE_DEFINITIONS.map((definition) => {
    const latest = latestById.get(definition.id);
    const parsed = parseServiceMetadata(latest?.metadata);
    return {
      id: definition.id,
      title: parsed.title ?? definition.title,
      imageUrl: parsed.imageUrl ?? null,
      isActive: parsed.isActive ?? true,
      sortOrder: parsed.sortOrder ?? definition.sortOrder,
      updatedAt: latest ? latest.createdAt.toISOString() : null,
    } satisfies ServiceItem;
  }).sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

  return includeInactive ? merged : merged.filter((item) => item.isActive);
}

export function getServiceDefinitionById(id: string) {
  return SERVICE_DEFINITIONS.find((item) => item.id === id);
}
