import { prisma } from "./prisma";
import { readSessionUserId } from "./session";

export async function getCurrentUser() {
  const id = await readSessionUserId();
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
  });
}
