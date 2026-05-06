"use client";

import { useRouter } from "next/navigation";
import { GlobeIcon } from "./LandingIcons";

type Locale = "ar" | "en";

export function LandingLangSwitcher({
  label,
  nextLocale,
}: {
  label: string;
  nextLocale: Locale;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        document.cookie = `locale=${nextLocale};path=/;max-age=31536000;SameSite=Lax`;
        router.refresh();
      }}
      className="inline-flex items-center gap-2 rounded-full border border-[#157083]/40 bg-white/80 px-4 py-2 text-sm font-medium text-[#157083] shadow-sm backdrop-blur-sm transition hover:bg-white hover:shadow"
    >
      <GlobeIcon className="shrink-0 opacity-90" />
      {label}
    </button>
  );
}
