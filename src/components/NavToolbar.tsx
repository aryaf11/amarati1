"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AppLocale } from "@/lib/locale";
import { navT } from "@/lib/nav-dict";
import {
  BellIcon,
  BellOffIcon,
  GlobeIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
} from "@/components/LandingIcons";

const THEME_KEY = "amarati-theme";
const NOTIFY_KEY = "amarati-notifications";

type ThemeMode = "light" | "dark" | "system";

export function NavToolbar({
  locale,
  loggedIn,
}: {
  locale: AppLocale;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const t = navT(locale);
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [notifyOn, setNotifyOn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark") setTheme("dark");
    else if (stored === "light") setTheme("light");
    else setTheme("system");
    setNotifyOn(localStorage.getItem(NOTIFY_KEY) === "1");
  }, []);

  function cycleTheme() {
    const root = document.documentElement;
    let next: ThemeMode;
    if (theme === "light") next = "dark";
    else if (theme === "dark") next = "system";
    else next = "light";

    if (next === "system") {
      localStorage.removeItem(THEME_KEY);
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.classList.add("dark");
      else root.classList.remove("dark");
    } else {
      localStorage.setItem(THEME_KEY, next);
      if (next === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    }
    setTheme(next);
  }

  function toggleLocale() {
    const next: AppLocale = locale === "ar" ? "en" : "ar";
    document.cookie = `locale=${next};path=/;max-age=31536000;SameSite=Lax`;
    router.refresh();
  }

  async function toggleNotifications() {
    const next = !notifyOn;
    localStorage.setItem(NOTIFY_KEY, next ? "1" : "0");
    setNotifyOn(next);
    if (next && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        try {
          await Notification.requestPermission();
        } catch {
          /* ignore */
        }
      }
    }
  }

  const themeIcon =
    theme === "dark" ? <MoonIcon /> : theme === "light" ? <SunIcon /> : <MonitorIcon />;
  const themeLabel =
    theme === "dark" ? t.themeDark : theme === "light" ? t.themeLight : t.themeSystem;

  const iconBtn =
    "inline-flex items-center justify-center rounded-full border border-[#157083]/25 bg-white/80 p-2 text-[#157083] shadow-sm backdrop-blur transition hover:bg-white hover:shadow dark:border-teal-700/40 dark:bg-slate-900/70 dark:text-teal-200 dark:hover:bg-slate-900";

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={cycleTheme}
        className={iconBtn}
        title={`${t.theme} — ${themeLabel}`}
        aria-label={`${t.theme} — ${themeLabel}`}
      >
        {themeIcon}
      </button>
      <button
        type="button"
        onClick={toggleLocale}
        className={iconBtn}
        title={t.language}
        aria-label={t.language}
      >
        <GlobeIcon />
      </button>
      {loggedIn ? (
        <button
          type="button"
          onClick={toggleNotifications}
          className={iconBtn}
          title={t.notifications}
          aria-label={t.notifications}
          aria-pressed={notifyOn}
        >
          {notifyOn ? <BellIcon /> : <BellOffIcon />}
        </button>
      ) : null}
    </div>
  );
}
