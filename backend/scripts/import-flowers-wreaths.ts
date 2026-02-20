import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const flowerItems = [
  {
    title: "Classic Sympathy Wreath",
    description: "Fresh floral wreath arrangement for respectful memorial and burial ceremonies.",
    price: 8500,
    imageUrl:
      "https://i.pinimg.com/1200x/1a/e5/e1/1ae5e1caa74fc140e2d94d3d73a89129.jpg",
  },
  {
    title: "Premium Standing Wreath",
    description: "Premium standing wreath with layered flowers for tribute displays and church services.",
    price: 12500,
    imageUrl:
      "https://i.pinimg.com/736x/fb/97/1b/fb971b2b01a88a80edc52d4ccc1ac1bb.jpg",
  },
  {
    title: "Family Tribute Flower Set",
    description: "Curated flower set for family tribute area with coordinated color themes.",
    price: 9800,
    imageUrl:
      "https://i.pinimg.com/1200x/f6/34/90/f634904b5dc19d912e7125dcd45838c6.jpg",
  },
];

async function main() {
  const adminEmail = process.argv[2]?.trim().toLowerCase() || "kenfuse88@gmail.com";

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true, email: true, role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    console.error(`Admin user not found or not ADMIN: ${adminEmail}`);
    process.exit(1);
  }

  const category = await prisma.marketplaceCategory.upsert({
    where: { name: "Flowers & Wreaths" },
    update: {},
    create: { name: "Flowers & Wreaths" },
    select: { id: true, name: true },
  });

  let created = 0;
  let skipped = 0;

  for (const item of flowerItems) {
    const existing = await prisma.marketplaceListing.findFirst({
      where: {
        categoryId: category.id,
        title: item.title,
        imageUrl: item.imageUrl,
      },
      select: { id: true },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    const listing = await prisma.marketplaceListing.create({
      data: {
        categoryId: category.id,
        vendorName: "Kenfume Memorials",
        title: item.title,
        description: item.description,
        price: item.price,
        currency: "KES",
        imageUrl: item.imageUrl,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    await prisma.activity.create({
      data: {
        userId: admin.id,
        type: "ADMIN_LISTING_CREATED",
        entityType: "MARKETPLACE_LISTING",
        entityId: listing.id,
        metadata: { source: "import-flowers-wreaths-script", category: category.name },
      },
    });

    created += 1;
  }

  console.log(
    `Flowers import complete. Created: ${created}, Skipped(existing): ${skipped}, Category: ${category.name}, Admin: ${admin.email}`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
