import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const paItems = [
  {
    title: "Standard Memorial PA Package",
    description: "Clear audio package for announcements, hymns, and speeches during service.",
    price: 18000,
    imageUrl:
      "https://i.pinimg.com/1200x/03/a5/c2/03a5c2680c42b8749977c81f0530f3dd.jpg",
  },
  {
    title: "Premium Outdoor Sound System",
    description: "High-power PA setup for larger outdoor gatherings and processions.",
    price: 32000,
    imageUrl:
      "https://i.pinimg.com/1200x/0a/b4/a6/0ab4a640718edec84d8b815569d0c4ab.jpg",
  },
  {
    title: "Portable Ceremony Audio Kit",
    description: "Portable speakers and microphones for quick setup at church or graveside.",
    price: 14500,
    imageUrl:
      "https://i.pinimg.com/736x/b2/c0/e7/b2c0e76d53a6b738d8e21198c249e8ef.jpg",
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
    where: { name: "PA Systems" },
    update: {},
    create: { name: "PA Systems" },
    select: { id: true, name: true },
  });

  let created = 0;
  let skipped = 0;

  for (const item of paItems) {
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
        metadata: { source: "import-pa-systems-script", category: category.name },
      },
    });

    created += 1;
  }

  console.log(
    `PA systems import complete. Created: ${created}, Skipped(existing): ${skipped}, Category: ${category.name}, Admin: ${admin.email}`
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
