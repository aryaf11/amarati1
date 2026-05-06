"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AppLocale } from "@/lib/locale";
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
const accent = "var(--accent)";

type ThemeMode = "light" | "dark" | "system";

type Labels = {
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  languageLabel: string;
  notificationsLabel: string;
  notificationsOn: string;
  notificationsOff: string;
  notificationsHint: string;
};

export function ProfileSettings({
  locale,
  t,
}: {
  locale: AppLocale;
  t: Labels;
}) {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [notifyOn, setNotifyOn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark") setTheme("dark");
    else if (stored === "light") setTheme("light");
    else setTheme("system");
    setNotifyOn(localStorage.getItem(NOTIFY_KEY) === "1");
  }, []);

  function applyTheme(next: ThemeMode) {
    const root = document.documentElement;
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

  function changeLocale() {
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

  const themeOptions: { id: ThemeMode; icon: React.ReactNode; label: string }[] = [
    { id: "light", icon: <SunIcon />, label: t.themeLight },
    { id: "dark", icon: <MoonIcon />, label: t.themeDark },
    { id: "system", icon: <MonitorIcon />, label: t.themeSystem },
  ];

  const activeBtn =
    "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold shadow-md";
  const inactiveBtn =
    "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium shadow-sm transition";
  const activeStyle = {
    backgroundColor: "var(--accent)",
    color: "var(--accent-foreground)",
  } as const;
  const inactiveStyle = {
    backgroundColor: "var(--card)",
    borderColor: "var(--card-border)",
    color: "var(--accent)",
  } as const;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold" style={{ color: accent }}>
          {t.themeLabel}
        </p>
        <div className="flex flex-wrap gap-2">
          {themeOptions.map((opt) => {
            const active = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => applyTheme(opt.id)}
                aria-pressed={active}
                className={active ? activeBtn : inactiveBtn}
                style={active ? activeStyle : inactiveStyle}
              >
                <span aria-hidden>{opt.icon}</span>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold" style={{ color: accent }}>
          {t.languageLabel}
        </p>
        <button
          type="button"
          onClick={changeLocale}
          className={inactiveBtn}
          style={inactiveStyle}
        >
          <GlobeIcon />
          <span>{locale === "ar" ? "English" : "عربي"}</span>
        </button>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold" style={{ color: accent }}>
          {t.notificationsLabel}
        </p>
        <button
          type="button"
          onClick={toggleNotifications}
          aria-pressed={notifyOn}
          className={notifyOn ? activeBtn : inactiveBtn}
          style={notifyOn ? activeStyle : inactiveStyle}
        >
          {notifyOn ? <BellIcon /> : <BellOffIcon />}
          <span>{notifyOn ? t.notificationsOn : t.notificationsOff}</span>
        </button>
        <p className="mt-2 text-xs text-muted">{t.notificationsHint}</p>
      </div>
    </div>
  );
}
