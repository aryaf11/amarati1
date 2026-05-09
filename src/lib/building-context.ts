import { cache } from "react";
import { getMembership } from "@/lib/access";
import { prisma } from "@/lib/prisma";

/**
 * Cached per request: layout + page both call this with the same args, but
 * the underlying DB queries only run once.
 */
export const loadBuildingContext = cache(
  async (buildingId: string, userId: string) => {
    const [building, m] = await Promise.all([
      prisma.building.findUnique({
        where: { id: buildingId },
        include: {
          creator: true,
          units: { include: { memberships: { include: { user: true } } } },
        },
      }),
      getMembership(userId, buildingId),
    ]);
    return { building, membership: m };
  },
);
