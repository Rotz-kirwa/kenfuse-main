import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const graveItems = [
  {
    title: "Standard Grave Preparation",
    description: "Professional grave site preparation with timely setup for burial service.",
    price: 15000,
    imageUrl:
      "https://i.pinimg.com/1200x/54/ea/f0/54eaf07c87c6ecdabd274b3df074af9a.jpg",
  },
  {
    title: "Premium Grave Finishing",
    description: "Grave finishing service with neat edging, leveling, and post-service cleanup.",
    price: 24000,
    imageUrl:
      "https://i.pinimg.com/1200x/ce/af/b8/ceafb885f54aea650cb419ec588abd49.jpg",
  },
  {
    title: "Family Burial Ground Setup",
    description: "Complete family plot setup and coordination for dignified burial arrangements.",
    price: 32000,
    imageUrl:
      "https://i.pinimg.com/1200x/c8/74/99/c874997edd2844004c55531c54eef94b.jpg",
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
    where: { name: "Grave Services" },
    update: {},
    create: { name: "Grave Services" },
    select: { id: true, name: true },
  });

  let created = 0;
  let skipped = 0;

  for (const item of graveItems) {
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
        metadata: { source: "import-grave-services-script", category: category.name },
      },
    });

    created += 1;
  }

  console.log(
    `Grave services import complete. Created: ${created}, Skipped(existing): ${skipped}, Category: ${category.name}, Admin: ${admin.email}`
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
