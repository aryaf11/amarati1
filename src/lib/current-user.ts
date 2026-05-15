import { cache } from "react";
import { prisma } from "./prisma";
import { readSessionUserId } from "./session";

/**
 * Cached for the duration of a single request — Layout + Page that both call
 * `getCurrentUser` will share the same result and avoid duplicate DB hits.
 */
export const getCurrentUser = cache(async () => {
  try {
    const id = await readSessionUserId();
    if (!id) return null;
    return await prisma.user.findUnique({
      where: { id },
    });
  } catch {
    /** قاعدة البيانات غير متاحة أو جلسة تالفة — لا تُفجّر كل الصفحة */
    return null;
  }
});
