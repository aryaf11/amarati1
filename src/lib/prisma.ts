import "@/lib/server-env-bootstrap";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function trimUrl(s: string | undefined): string | undefined {
  const t = s?.trim();
  if (!t) return undefined;
  if (t.length >= 2) {
    const q = t[0];
    if ((q === '"' || q === "'") && t[t.length - 1] === q) {
      return t.slice(1, -1).trim() || undefined;
    }
  }
  return t;
}

const dbUrl = trimUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(
    dbUrl
      ? {
          datasources: {
            db: { url: dbUrl },
          },
        }
      : undefined,
  );

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
