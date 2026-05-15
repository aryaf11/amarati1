"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AppLocale } from "@/lib/locale";
import { navT } from "@/lib/nav-dict";
import {
  BellIcon,
  BellOffIcon,
  GlobeIcon,
  MoonIcon,
  SunIcon,
} from "@/components/LandingIcons";

const THEME_KEY = "amarati-theme";
const NOTIFY_KEY = "amarati-notifications";

type ThemeMode = "light" | "dark";

export function NavToolbar({
  locale,
  loggedIn,
}: {
  locale: AppLocale;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const t = navT(locale);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [notifyOn, setNotifyOn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark") setTheme("dark");
    else setTheme("light");
    setNotifyOn(localStorage.getItem(NOTIFY_KEY) === "1");
  }, []);

  function cycleTheme() {
    const root = document.documentElement;
    const next: ThemeMode = theme === "light" ? "dark" : "light";
    localStorage.setItem(THEME_KEY, next);
    if (next === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
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

  const themeIcon = theme === "dark" ? <MoonIcon /> : <SunIcon />;
  const themeLabel = theme === "dark" ? t.themeDark : t.themeLight;

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
        onClick={cycleTheme}
        className={iconBtn}
        style={iconBtnStyle}
        title={`${t.theme} — ${themeLabel}`}
        aria-label={`${t.theme} — ${themeLabel}`}
      >
        {themeIcon}
      </button>
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
      {loggedIn ? (
        <button
          type="button"
          onClick={toggleNotifications}
          className={iconBtn}
          style={iconBtnStyle}
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
