import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const eventItems = [
  {
    title: "Memorial Program Coordination",
    description: "End-to-end coordination of timeline, speakers, seating, and service flow.",
    price: 35000,
    imageUrl:
      "https://i.pinimg.com/1200x/6b/d0/5e/6bd05e85477e1de00d848b67e75710ec.jpg",
  },
  {
    title: "Full Funeral Event Management",
    description: "Comprehensive event management with logistics support and on-ground supervision.",
    price: 52000,
    imageUrl:
      "https://i.pinimg.com/1200x/fc/8c/71/fc8c71e8e6ece91d6fc67c18c7a05ba0.jpg",
  },
  {
    title: "Ceremony Flow & Guest Support",
    description: "Structured ceremony management with guest assistance and host briefing.",
    price: 28000,
    imageUrl:
      "https://i.pinimg.com/736x/c1/07/12/c107127a628b0d34973910e15261e141.jpg",
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
    where: { name: "Event Coordination" },
    update: {},
    create: { name: "Event Coordination" },
    select: { id: true, name: true },
  });

  let created = 0;
  let skipped = 0;

  for (const item of eventItems) {
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
        vendorName: "Kenfuse Event Coordination",
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
        metadata: { source: "import-event-coordination-script", category: category.name },
      },
    });

    created += 1;
  }

  console.log(
    `Event coordination import complete. Created: ${created}, Skipped(existing): ${skipped}, Category: ${category.name}, Admin: ${admin.email}`
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
