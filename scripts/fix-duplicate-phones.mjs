import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: process.argv[2] || ".env.vercel.production" });

const prisma = new PrismaClient();

const dupes = await prisma.$queryRaw`
  SELECT phone, COUNT(*)::int AS c
  FROM "User"
  GROUP BY phone
  HAVING COUNT(*) > 1
`;

console.log("Duplicate phones:", dupes);

if (process.argv.includes("--fix")) {
  const rows = await prisma.$queryRaw`
    SELECT id, phone, email, name, "createdAt"
    FROM "User"
    WHERE phone IN (
      SELECT phone FROM "User" GROUP BY phone HAVING COUNT(*) > 1
    )
    ORDER BY phone, "createdAt"
  `;
  const byPhone = new Map();
  for (const row of rows) {
    const list = byPhone.get(row.phone) ?? [];
    list.push(row);
    byPhone.set(row.phone, list);
  }
  for (const [phone, users] of byPhone) {
    const [, ...rest] = users;
    for (const u of rest) {
      const newPhone = `dup-${u.id.slice(0, 8)}-${phone}`.slice(0, 24);
      await prisma.$executeRaw`UPDATE "User" SET phone = ${newPhone} WHERE id = ${u.id}`;
      console.log(`Updated ${u.id}: ${phone} -> ${newPhone}`);
    }
  }
}

await prisma.$disconnect();
