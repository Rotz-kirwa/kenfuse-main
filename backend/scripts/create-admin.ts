import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const password = process.argv[3];
  const fullName = process.argv[4] ?? "Kenfuse Admin";

  if (!email || !password) {
    console.error("Usage: npm run admin:create -- <email> <password> [fullName]");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      passwordHash,
      role: "ADMIN",
    },
    create: {
      email,
      fullName,
      passwordHash,
      role: "ADMIN",
    },
    select: {
      email: true,
      role: true,
      fullName: true,
    },
  });

  console.log(`Admin account ready: ${user.email} (${user.role})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
