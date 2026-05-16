import dotenv from "dotenv";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { supabaseDirectUrl } from "./supabase-direct-url.mjs";

dotenv.config({ path: ".env.vercel.production", override: true });

process.env.DIRECT_URL = supabaseDirectUrl(process.env.DATABASE_URL);

const FAILED = "20260515220000_simplify_building_optional_email_phone_unique";
const prisma = new PrismaClient();

const failed = await prisma.$queryRaw`
  SELECT migration_name, finished_at
  FROM _prisma_migrations
  WHERE migration_name = ${FAILED} AND finished_at IS NULL
`;
if (failed.length > 0) {
  console.log("Resolving failed migration as rolled back...");
  execSync(`npx prisma migrate resolve --rolled-back ${FAILED}`, {
    stdio: "inherit",
    env: process.env,
  });
}

await prisma.$executeRaw`
  UPDATE "User"
  SET phone = 'legacy-' || id
  WHERE phone IS NULL OR trim(COALESCE(phone, '')) = ''
`;

const dupes = await prisma.$queryRaw`
  SELECT phone, COUNT(*)::int AS c
  FROM "User"
  GROUP BY phone
  HAVING COUNT(*) > 1
`;

if (dupes.length > 0) {
  const rows = await prisma.$queryRaw`
    SELECT id, phone, "createdAt"
    FROM "User"
    WHERE phone IN (SELECT phone FROM "User" GROUP BY phone HAVING COUNT(*) > 1)
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
      console.log(`dedupe: ${u.id} -> ${newPhone}`);
    }
  }
}

await prisma.$disconnect();

console.log("Running prisma migrate deploy...");
execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
console.log("Production migrations complete.");
