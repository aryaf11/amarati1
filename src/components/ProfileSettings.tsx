"use client";

import { useEffect, useState } from "react";
import { toggleVisibleInResidentsAction } from "@/actions/auth";
import type { AppLocale } from "@/lib/locale";
import {
  BellIcon,
  BellOffIcon,
  EyeIcon,
  EyeOffIcon,
  MoonIcon,
  SunIcon,
} from "@/components/LandingIcons";

const THEME_KEY = "amarati-theme";
const NOTIFY_KEY = "amarati-notifications";

type ThemeMode = "light" | "dark";

type Labels = {
  themeLabel: string;
  themeToggle: string;
  residentsVisibilityLabel: string;
  residentsVisibleOn: string;
  residentsVisibleOff: string;
  notificationsLabel: string;
  notificationsOn: string;
  notificationsOff: string;
  notificationsHint: string;
};

export function ProfileSettings({
  locale: _locale,
  visibleInResidents,
  t,
}: {
  locale: AppLocale;
  visibleInResidents: boolean;
  t: Labels;
}) {
  void _locale;
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [notifyOn, setNotifyOn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark") setTheme("dark");
    else setTheme("light");
    setNotifyOn(localStorage.getItem(NOTIFY_KEY) === "1");
  }, []);

  function applyTheme(next: ThemeMode) {
    const root = document.documentElement;
    localStorage.setItem(THEME_KEY, next);
    if (next === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    setTheme(next);
  }

  function toggleTheme() {
    applyTheme(theme === "light" ? "dark" : "light");
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

  const iconRound =
    "inline-flex size-11 items-center justify-center rounded-full border shadow-sm backdrop-blur transition hover:shadow";
  const iconInactive = {
    backgroundColor: "var(--card)",
    borderColor: "var(--card-border)",
    color: "var(--accent)",
  } as const;
  const iconActive = {
    backgroundColor: "var(--accent)",
    color: "var(--accent-foreground)",
    borderColor: "var(--accent)",
  } as const;

  const notifyInactive =
    "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium shadow-sm transition";
  const notifyActive =
    "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold shadow-md";

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted">{t.themeLabel}</p>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={t.themeToggle}
          title={t.themeToggle}
          className={iconRound}
          style={iconActive}
        >
          {theme === "light" ? (
            <SunIcon className="size-5 shrink-0" />
          ) : (
            <MoonIcon className="size-5 shrink-0" />
          )}
        </button>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold tracking-wide text-muted">
          {t.residentsVisibilityLabel}
        </p>
        <form action={toggleVisibleInResidentsAction}>
          <button
            type="submit"
            aria-pressed={visibleInResidents}
            className={iconRound}
            style={visibleInResidents ? iconActive : iconInactive}
            title={visibleInResidents ? t.residentsVisibleOn : t.residentsVisibleOff}
          >
            {visibleInResidents ? (
              <EyeIcon className="size-5 shrink-0" />
            ) : (
              <EyeOffIcon className="size-5 shrink-0" />
            )}
          </button>
          <p className="mt-2 text-xs text-muted">
            {visibleInResidents ? t.residentsVisibleOn : t.residentsVisibleOff}
          </p>
        </form>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold" style={{ color: "var(--accent)" }}>
          {t.notificationsLabel}
        </p>
        <button
          type="button"
          onClick={toggleNotifications}
          aria-pressed={notifyOn}
          className={notifyOn ? notifyActive : notifyInactive}
          style={
            notifyOn
              ? {
                  backgroundColor: "var(--accent)",
                  color: "var(--accent-foreground)",
                }
              : {
                  backgroundColor: "var(--card)",
                  borderColor: "var(--card-border)",
                  color: "var(--accent)",
                }
          }
        >
          {notifyOn ? <BellIcon /> : <BellOffIcon />}
          <span>{notifyOn ? t.notificationsOn : t.notificationsOff}</span>
        </button>
        {t.notificationsHint.trim() ? (
          <p className="mt-2 text-xs text-muted">{t.notificationsHint}</p>
        ) : null}
      </div>
    </div>
  );
}
