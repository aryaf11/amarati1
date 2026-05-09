import { cookies } from "next/headers";
import { cache } from "react";

export type AppLocale = "ar" | "en";

export const getLocale = cache(async (): Promise<AppLocale> => {
  const c = (await cookies()).get("locale")?.value;
  return c === "en" ? "en" : "ar";
});
