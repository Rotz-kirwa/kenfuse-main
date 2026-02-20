import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cateringItems = [
  {
    title: "Family Buffet Catering Package",
    description: "Balanced buffet menu package suitable for family gatherings after service.",
    price: 32000,
    imageUrl:
      "https://i.pinimg.com/736x/a7/08/a5/a708a52b6cba97ff2396c02cc7ce5c47.jpg",
  },
  {
    title: "Premium Event Catering Service",
    description: "Full-service catering with attendants, setup, and coordinated meal service.",
    price: 48000,
    imageUrl:
      "https://i.pinimg.com/736x/b8/07/65/b8076559645dc255fb9a0b4a09cdaa92.jpg",
  },
  {
    title: "Tea & Snacks Hospitality Package",
    description: "Light refreshments and snacks package for memorial visitors and guests.",
    price: 22000,
    imageUrl:
      "https://i.pinimg.com/736x/80/e5/c5/80e5c59d5862c18e2c7aa3778d23fcb6.jpg",
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
    where: { name: "Catering" },
    update: {},
    create: { name: "Catering" },
    select: { id: true, name: true },
  });

  let created = 0;
  let skipped = 0;

  for (const item of cateringItems) {
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
        vendorName: "Kenfuse Catering Services",
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
        metadata: { source: "import-catering-script", category: category.name },
      },
    });

    created += 1;
  }

  console.log(
    `Catering import complete. Created: ${created}, Skipped(existing): ${skipped}, Category: ${category.name}, Admin: ${admin.email}`
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
