import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categoryNames = [
  "Caskets & Coffins",
  "Urns",
  "Flowers & Wreaths",
  "Memorial Frames",
  "Tents & Chairs",
  "PA Systems",
  "Printed Programs",
  "Banners",
  "Hearse Hire",
  "Mortuary Services",
  "Body Transport",
  "Grave Services",
  "Event Coordination",
  "Catering",
  "Live Streaming",
  "Tribute Videos",
];

async function main() {
  await prisma.marketplaceCategory.createMany({
    data: categoryNames.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const hearse = await prisma.marketplaceCategory.findUnique({ where: { name: "Hearse Hire" } });

  if (hearse) {
    await prisma.marketplaceListing.createMany({
      data: [
        {
          categoryId: hearse.id,
          vendorName: "Nairobi Dignity Transport",
          title: "Executive Hearse Package",
          description: "Premium hearse service within Nairobi county.",
          price: 25000,
          currency: "KES",
        },
        {
          categoryId: hearse.id,
          vendorName: "Peaceful Journey Services",
          title: "Standard Hearse Package",
          description: "Reliable inter-county body transport and hearse support.",
          price: 18000,
          currency: "KES",
        },
      ],
      skipDuplicates: true,
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
