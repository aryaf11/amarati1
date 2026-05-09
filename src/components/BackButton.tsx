"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeftIcon } from "@/components/LandingIcons";
import type { AppLocale } from "@/lib/locale";

const HIDE_ON: Set<string> = new Set(["/", "/login", "/signup", "/register"]);

export function BackButton({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const [canGoBack, setCanGoBack] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanGoBack(window.history.length > 1);
    }
  }, [pathname]);

  if (HIDE_ON.has(pathname)) return null;
  if (!canGoBack) return null;

  const label = locale === "en" ? "Back" : "رجوع";

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label={label}
      title={label}
      className="inline-flex items-center justify-center rounded-full border p-2 shadow-sm backdrop-blur transition hover:shadow"
      style={{
        backgroundColor: "color-mix(in srgb, var(--card) 80%, transparent)",
        borderColor: "var(--card-border)",
        color: "var(--accent)",
      }}
    >
      <span className="rtl:[transform:scaleX(-1)] inline-flex">
        <ChevronLeftIcon />
      </span>
    </button>
  );
}
