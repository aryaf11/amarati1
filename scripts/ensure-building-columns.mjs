/**
 * يضمن أعمدة العنوان الوطني على Building (idempotent) — يُشغَّل على Vercel بعد migrate deploy.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "region" TEXT`,
  `ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "district" TEXT`,
  `ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "streetName" TEXT`,
  `ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "buildingNumber" TEXT`,
  `ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "additionalNumber" TEXT`,
  `ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "postalCode" TEXT`,
  `ALTER TABLE "Building" ADD COLUMN IF NOT EXISTS "shortAddressCode" TEXT`,
];

try {
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
  console.log("ensure-building-columns: ok");
} finally {
  await prisma.$disconnect();
}
