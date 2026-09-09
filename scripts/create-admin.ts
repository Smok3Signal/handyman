import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 12);

  const existing = await prisma.adminUser.findUnique({
    where: { username: "admin" },
  });

  if (existing) {
    console.log("Admin already exists!");
    return;
  }

  const admin = await prisma.adminUser.create({
    data: { username: "admin", password },
  });

  console.log("Admin created:", admin.username);
  console.log("Password: admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
