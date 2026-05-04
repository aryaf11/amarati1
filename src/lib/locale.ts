import { cookies } from "next/headers";

export type AppLocale = "ar" | "en";

export async function getLocale(): Promise<AppLocale> {
  const c = (await cookies()).get("locale")?.value;
  return c === "en" ? "en" : "ar";
}
