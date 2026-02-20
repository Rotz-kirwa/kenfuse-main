import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const LISTING_CONTACT_ACTIVITY_TYPE = "ADMIN_LISTING_CONTACT_UPDATED";

const categoryNames = [
  "Caskets & Coffins",
  "Funeral Transport",
  "Catering",
  "Event Coordination",
  "Flowers & Wreaths",
  "Grave Services",
  "PA Systems",
];

const starterListings = [
  {
    category: "Caskets & Coffins",
    vendorName: "Kenfuse Memorial Supplies",
    vendorContact: "+254700101101",
    title: "Classic Mahogany Coffin",
    description: "Quality mahogany coffin with elegant interior finish.",
    imageUrl: "https://i.pinimg.com/1200x/a5/33/6e/a5336e0daeb79667f31df27393248ed0.jpg",
    price: 85000,
    currency: "KES",
  },
  {
    category: "Funeral Transport",
    vendorName: "Kenfuse Transport Services",
    vendorContact: "+254700202202",
    title: "Executive Funeral Hearse",
    description: "Premium hearse transport service for city and inter-county coverage.",
    imageUrl: "https://i.pinimg.com/1200x/a3/5e/75/a35e7504a18f0c9acf815e872ead3710.jpg",
    price: 25000,
    currency: "KES",
  },
  {
    category: "Catering",
    vendorName: "Kenfuse Catering Services",
    vendorContact: "+254700303303",
    title: "Memorial Catering Package",
    description: "Professional catering for memorial and funeral gatherings.",
    imageUrl: "https://i.pinimg.com/736x/a7/08/a5/a708a52b6cba97ff2396c02cc7ce5c47.jpg",
    price: 45000,
    currency: "KES",
  },
  {
    category: "Event Coordination",
    vendorName: "Kenfuse Event Coordination",
    vendorContact: "+254700404404",
    title: "Funeral Event Coordination",
    description: "End-to-end ceremony coordination and venue logistics support.",
    imageUrl: "https://i.pinimg.com/1200x/6b/d0/5e/6bd05e85477e1de00d848b67e75710ec.jpg",
    price: 60000,
    currency: "KES",
  },
  {
    category: "Flowers & Wreaths",
    vendorName: "Kenfume Memorials",
    vendorContact: "+254700101101",
    title: "Premium Sympathy Wreath",
    description: "Fresh floral wreath arrangement for respectful tributes.",
    imageUrl: "https://i.pinimg.com/1200x/1a/e5/e1/1ae5e1caa74fc140e2d94d3d73a89129.jpg",
    price: 12500,
    currency: "KES",
  },
];

async function ensureAdminFromEnv() {
  const email = process.env.DEFAULT_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.DEFAULT_ADMIN_PASSWORD?.trim();
  const fullName = process.env.DEFAULT_ADMIN_NAME?.trim() || "Kenfuse Admin";

  if (!email || !password) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: "ADMIN" },
      });
      console.log(`Promoted existing user to ADMIN: ${email}`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      fullName,
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`Created default ADMIN user: ${email}`);
}

async function ensureCategories() {
  await prisma.marketplaceCategory.createMany({
    data: categoryNames.map((name) => ({ name })),
    skipDuplicates: true,
  });
}

async function ensureListings() {
  for (const item of starterListings) {
    const category = await prisma.marketplaceCategory.findUnique({
      where: { name: item.category },
      select: { id: true },
    });
    if (!category) continue;

    const existing = await prisma.marketplaceListing.findFirst({
      where: {
        title: item.title,
        vendorName: item.vendorName,
      },
      select: { id: true },
    });

    if (existing) continue;

    const listing = await prisma.marketplaceListing.create({
      data: {
        categoryId: category.id,
        vendorName: item.vendorName,
        title: item.title,
        description: item.description,
        imageUrl: item.imageUrl,
        price: item.price,
        currency: item.currency,
      },
      select: { id: true },
    });

    await prisma.activity.create({
      data: {
        type: LISTING_CONTACT_ACTIVITY_TYPE,
        entityType: "MARKETPLACE_LISTING",
        entityId: listing.id,
        metadata: { vendorContact: item.vendorContact },
      },
    });
  }
}

async function main() {
  await ensureAdminFromEnv();
  await ensureCategories();
  await ensureListings();
  console.log("Render bootstrap complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
