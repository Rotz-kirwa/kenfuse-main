import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (users.length === 0) {
    console.log("No users found.");
    return;
  }

  for (const user of users) {
    console.log(`${user.email} | ${user.fullName} | ${user.role} | ${user.createdAt.toISOString()}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
