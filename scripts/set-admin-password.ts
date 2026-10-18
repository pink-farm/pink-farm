import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "pinkfarmofficial@gmail.com";
  const newPassword = process.env.ADMIN_PASSWORD || "Pinkfarm@123";
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  const existing = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (existing) {
    const updated = await prisma.adminUser.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log("Admin user password updated successfully for:", updated.email);
  } else {
    const created = await prisma.adminUser.create({
      data: {
        email,
        password: hashedPassword,
        name: "Pink Farm Admin",
      },
    });
    console.log("Admin user created successfully with email:", created.email);
  }

  // Verify
  const user = await prisma.adminUser.findUnique({ where: { email } });
  const matches = await bcrypt.compare(newPassword, user?.password || "");
  console.log("Verification bcrypt.compare with 'Pinkfarm@123':", matches);
}

main()
  .catch((e) => {
    console.error("Error setting admin password:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
