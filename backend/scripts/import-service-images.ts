import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_SERVICE_ACTIVITY_TYPE = "ADMIN_SERVICE_UPDATED";

function toServiceId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const serviceImageByTitle: Record<string, string> = {
  "Air Freight (Repatriation)": "https://i.pinimg.com/736x/61/95/60/6195600017c2af60fed97d1c90107ca2.jpg",
  "Air Freight (Within Kenya)": "https://i.pinimg.com/736x/2c/37/77/2c377711af810836efeb664a8ae3a9e9.jpg",
  "Anatomical Donation": "https://i.pinimg.com/1200x/2d/f7/a7/2df7a7e00b5d515a16a5aab5906ca908.jpg",
  "Associations - Professional": "https://i.pinimg.com/1200x/ed/9b/97/ed9b971903440df8b608a705cf5e4ecf.jpg",
  "Autopsy Services": "https://i.pinimg.com/1200x/9c/a3/bd/9ca3bdf1cffbcaf25183bf2522587dab.jpg",
  "Body Reconstruction": "https://i.pinimg.com/1200x/30/b0/01/30b001221e49c3148b28b47b2c3b950a.jpg",
  "Burial Permit": "https://i.pinimg.com/1200x/8a/e9/2b/8ae92b0da44f9d490b7aa37b03176609.jpg",
  "Church/Chapel Service": "https://i.pinimg.com/1200x/b4/e8/02/b4e8029c0cee744cca9537a2d7debcb6.jpg",
  "Coffin Perfume": "https://i.pinimg.com/736x/6f/5a/e6/6f5ae6e28333245621d75ffecd41870c.jpg",
  "Coffin/Casket Dealers": "https://i.pinimg.com/1200x/0e/36/25/0e3625ce49d6a7b951726d0db2cdb6db.jpg",
  "Condolences Books": "https://i.pinimg.com/736x/4c/69/2d/4c692d17943796c67d6402e63946c0a4.jpg",
  "Cremation Service": "https://i.pinimg.com/1200x/fd/76/19/fd76198449615024d4ddfcdbca635933.jpg",
  "Death Certificate": "https://i.pinimg.com/1200x/c2/18/70/c21870e830becc7e7b24a40c58f56185.jpg",
  "DNA Retrieval/Preservation": "https://i.pinimg.com/1200x/4b/71/8a/4b718ab8db36244aac834e81c055798e.jpg",
  "Eulogy Writing Services": "https://i.pinimg.com/736x/a0/93/26/a09326ec79abea8b97a231ee1a04fb08.jpg",
  "Exhumation Services": "https://i.pinimg.com/736x/3d/48/86/3d4886e207af51f050af17c0b360c211.jpg",
  "Wills/Estate Planning": "https://i.pinimg.com/736x/f0/67/87/f067879f699014cec2569c491bdd7387.jpg",
  "Video & Streaming Services": "https://i.pinimg.com/1200x/55/18/36/551836f9c9a047358f9be1e556f0a7d0.jpg",
  "Mortuary Cosmetologist": "https://i.pinimg.com/736x/15/9d/14/159d14fc20bcd7e99c8cdc7bbd72d240.jpg",
};

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

  let updated = 0;
  for (const [title, imageUrl] of Object.entries(serviceImageByTitle)) {
    const serviceId = toServiceId(title);

    await prisma.activity.create({
      data: {
        userId: admin.id,
        type: ADMIN_SERVICE_ACTIVITY_TYPE,
        entityType: "SERVICE",
        entityId: serviceId,
        metadata: {
          title,
          imageUrl,
          isActive: true,
        },
      },
    });
    updated += 1;
  }

  console.log(`Service image import complete. Updated: ${updated}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
