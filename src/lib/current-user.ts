import { cache } from "react";
import { prisma } from "./prisma";
import { readSessionUserId } from "./session";

/**
 * Cached for the duration of a single request — Layout + Page that both call
 * `getCurrentUser` will share the same result and avoid duplicate DB hits.
 */
export const getCurrentUser = cache(async () => {
  const id = await readSessionUserId();
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
  });
});
