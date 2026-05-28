import type { Membership } from "@prisma/client";
import { prisma } from "./prisma";

export async function getMembership(
  userId: string,
  buildingId: string,
): Promise<
  (Membership & {
    unit: { id: string; label: string; buildingId: string };
  }) | null
> {
  return prisma.membership.findFirst({
    where: { userId, unit: { buildingId } },
    include: { unit: true },
  });
}

/** عضوية المستخدم — المنتج يفترض مبنى واحد لكل حساب. */
export async function getMyMembership(userId: string) {
  return prisma.membership.findFirst({
    where: { userId },
    include: {
      unit: { include: { building: true } },
    },
    orderBy: { id: "asc" },
  });
}

/** هل المستخدم مرتبط بمبنى آخر غير buildingId؟ */
export async function userLockedToOtherBuilding(
  userId: string,
  buildingId: string,
): Promise<boolean> {
  const m = await getMyMembership(userId);
  if (!m) return false;
  return m.unit.buildingId !== buildingId;
}
