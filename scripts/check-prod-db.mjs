import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.vercel.production", override: true });
const prisma = new PrismaClient();

const failed = await prisma.$queryRaw`
  SELECT migration_name, finished_at, rolled_back_at, logs
  FROM _prisma_migrations
  WHERE migration_name LIKE '%20260515220000%' OR finished_at IS NULL
`;
console.log("failed/pending:", failed);

const nullPhones = await prisma.$queryRaw`
  SELECT id, email, phone FROM "User" WHERE phone IS NULL OR trim(phone) = ''
`;
console.log("null phones:", nullPhones);

const dupes = await prisma.$queryRaw`
  SELECT phone, COUNT(*)::int AS c FROM "User" WHERE phone IS NOT NULL GROUP BY phone HAVING COUNT(*) > 1
`;
console.log("dupes:", dupes);

await prisma.$disconnect();
