import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const coffinItems = [
  {
    title: "Classic Mahogany Coffin",
    description: "Elegant polished mahogany coffin suitable for dignified family services.",
    price: 85000,
    imageUrl:
      "https://i.pinimg.com/1200x/a5/33/6e/a5336e0daeb79667f31df27393248ed0.jpg",
  },
  {
    title: "Premium Gold-Trim Coffin",
    description: "Premium high-finish coffin with gold-tone trims for a refined memorial presentation.",
    price: 98000,
    imageUrl:
      "https://i.pinimg.com/1200x/83/5a/d3/835ad3a716bca47b146474bc30f1b1ef.jpg",
  },
  {
    title: "Gracewood Family Coffin",
    description: "Gracewood model with smooth interior lining and durable ceremonial build quality.",
    price: 76000,
    imageUrl:
      "https://i.pinimg.com/736x/61/59/96/615996c0d0b883f1b9a604ab30fae68a.jpg",
  },
  {
    title: "Royal Heritage Coffin",
    description: "Royal heritage design made for high-honor farewell services and celebrations of life.",
    price: 105000,
    imageUrl:
      "https://i.pinimg.com/1200x/76/cd/c4/76cdc48b43c93834ad2563963643ad9a.jpg",
  },
  {
    title: "Serenity Oak Coffin",
    description: "Solid oak-style coffin balancing timeless appearance and practical transport handling.",
    price: 82000,
    imageUrl:
      "https://i.pinimg.com/1200x/0e/36/25/0e3625ce49d6a7b951726d0db2cdb6db.jpg",
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
    where: { name: "Caskets & Coffins" },
    update: {},
    create: { name: "Caskets & Coffins" },
    select: { id: true, name: true },
  });

  let created = 0;
  let skipped = 0;

  for (const item of coffinItems) {
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
        vendorName: "Kenfuse Memorial Supplies",
        title: item.title,
        description: item.description,
        price: item.price,
        currency: "KES",
        imageUrl: item.imageUrl,
        status: "ACTIVE",
      },
      select: { id: true, title: true },
    });

    await prisma.activity.create({
      data: {
        userId: admin.id,
        type: "ADMIN_LISTING_CREATED",
        entityType: "MARKETPLACE_LISTING",
        entityId: listing.id,
        metadata: { source: "import-coffins-script", category: category.name },
      },
    });

    created += 1;
  }

  console.log(
    `Coffin import complete. Created: ${created}, Skipped(existing): ${skipped}, Category: ${category.name}, Admin: ${admin.email}`
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
