"use client";

import { useRouter } from "next/navigation";
import type { AppLocale } from "@/lib/locale";
import { navT } from "@/lib/nav-dict";
import { GlobeIcon } from "@/components/LandingIcons";

/** شريط علوي: لغة العرض فقط — المظهر والإشعارات في إعدادات «الحساب». */
export function NavToolbar({
  locale,
}: {
  locale: AppLocale;
  /** @deprecated */
  loggedIn?: boolean;
}) {
  const router = useRouter();
  const t = navT(locale);

  function toggleLocale() {
    const next: AppLocale = locale === "ar" ? "en" : "ar";
    document.cookie = `locale=${next};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  }

  const iconBtn =
    "inline-flex items-center justify-center rounded-full border p-2 shadow-sm backdrop-blur transition hover:shadow";
  const iconBtnStyle = {
    backgroundColor: "color-mix(in srgb, var(--card) 80%, transparent)",
    borderColor: "var(--card-border)",
    color: "var(--accent)",
  } as const;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggleLocale}
        className={iconBtn}
        style={iconBtnStyle}
        title={t.language}
        aria-label={t.language}
      >
        <GlobeIcon />
      </button>
    </div>
  );
}

