import type { Membership } from "@prisma/client";
import { prisma } from "./prisma";

export async function getMembership(
  userId: string,
  buildingId: string
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

export async function listMyBuildings(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    include: {
      unit: { include: { building: true } },
    },
    orderBy: { id: "asc" },
  });
}

export function canAddTenants(kind: string, isSupervisor: boolean) {
  return kind === "OWNER" || isSupervisor;
}
