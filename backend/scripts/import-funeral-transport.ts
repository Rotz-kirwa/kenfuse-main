import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const transportItems = [
  {
    title: "City Funeral Van Transfer",
    description: "Dependable city transfer service with respectful handling and trained crew.",
    price: 18000,
    imageUrl:
      "https://i.pinimg.com/736x/6b/00/20/6b0020c86463a9e66ccf7a54441ff20d.jpg",
  },
  {
    title: "Family Hearse Escort Package",
    description: "Coordinated hearse and escort support for smooth movement between venues.",
    price: 26000,
    imageUrl:
      "https://i.pinimg.com/736x/85/4f/6f/854f6f3c8f78220ca3ce4d97fdeb7495.jpg",
  },
  {
    title: "Inter-County Body Transport",
    description: "Long-distance transfer service with route planning and timing coordination.",
    price: 34000,
    imageUrl:
      "https://i.pinimg.com/1200x/a3/5e/75/a35e7504a18f0c9acf815e872ead3710.jpg",
  },
  {
    title: "Premium Funeral Transport Fleet",
    description: "Premium fleet option for high-attendance services and formal processions.",
    price: 42000,
    imageUrl:
      "https://i.pinimg.com/1200x/49/4e/0f/494e0f5134cdc610b7cd7fa1acbd2ee8.jpg",
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
    where: { name: "Body Transport" },
    update: {},
    create: { name: "Body Transport" },
    select: { id: true, name: true },
  });

  let created = 0;
  let skipped = 0;

  for (const item of transportItems) {
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
        vendorName: "Kenfuse Transport Services",
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
        metadata: { source: "import-funeral-transport-script", category: category.name },
      },
    });

    created += 1;
  }

  console.log(
    `Funeral transport import complete. Created: ${created}, Skipped(existing): ${skipped}, Category: ${category.name}, Admin: ${admin.email}`
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
