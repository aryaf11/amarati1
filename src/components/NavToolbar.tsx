"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AppLocale } from "@/lib/locale";
import { navT } from "@/lib/nav-dict";

const THEME_KEY = "amarati-theme";

export function NavToolbar({ locale }: { locale: AppLocale }) {
  const router = useRouter();
  const t = navT(locale);
  const [themeHint, setThemeHint] = useState<string>(t.themeSystem);

  useEffect(() => {
    const sync = () => {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "dark") setThemeHint(t.themeDark);
      else if (stored === "light") setThemeHint(t.themeLight);
      else setThemeHint(t.themeSystem);
    };
    sync();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [t.themeDark, t.themeLight, t.themeSystem]);

  function cycleTheme() {
    const root = document.documentElement;
    const stored = localStorage.getItem(THEME_KEY);
    let next: "light" | "dark" | "system";
    if (stored === "light") next = "dark";
    else if (stored === "dark") next = "system";
    else next = "light";

    if (next === "system") {
      localStorage.removeItem(THEME_KEY);
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.classList.add("dark");
      else root.classList.remove("dark");
      setThemeHint(t.themeSystem);
    } else {
      localStorage.setItem(THEME_KEY, next);
      if (next === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
      setThemeHint(next === "dark" ? t.themeDark : t.themeLight);
    }
  }

  function toggleLocale() {
    const next: AppLocale = locale === "ar" ? "en" : "ar";
    document.cookie = `locale=${next};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  }

  async function notificationPrefs() {
    const on = localStorage.getItem("amarati-notifications") === "1";
    const next = !on;
    localStorage.setItem("amarati-notifications", next ? "1" : "0");
    if (next && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") await Notification.requestPermission();
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-s border-slate-200 ps-2 dark:border-slate-800">
      <button
        type="button"
        onClick={cycleTheme}
        className="rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-900"
        title={t.theme}
      >
        {themeHint}
      </button>
      <button
        type="button"
        onClick={toggleLocale}
        className="rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-900"
        title={t.language}
      >
        {locale === "ar" ? "EN" : "عربي"}
      </button>
      <button
        type="button"
        onClick={notificationPrefs}
        className="rounded-lg px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-900"
        title={t.notifications}
      >
        🔔
      </button>
    </div>
  );
}
