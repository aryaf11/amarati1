import { prisma } from "./prisma";
import { readSessionUserId } from "./session";

export async function getCurrentUser() {
  const id = await readSessionUserId();
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    include: { companyProfile: true },
  });
}

export function isPlatformAdmin(email: string | null | undefined) {
  if (!email) return false;
  const raw = process.env.PLATFORM_ADMIN_EMAILS ?? "";
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
