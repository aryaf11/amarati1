/**
 * يضمن أعمدة User الاختيارية (idempotent) — يُشغَّل على Vercel بعد migrate deploy.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const statements = [
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "visibleInResidents" BOOLEAN NOT NULL DEFAULT true`,
];

try {
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
  console.log("ensure-user-columns: ok");
} finally {
  await prisma.$disconnect();
}
