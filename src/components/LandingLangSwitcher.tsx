"use client";

import { useRouter } from "next/navigation";

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M2 12h20M12 2c3 4 3 8 0 12M12 2c-3 4-3 8 0 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
