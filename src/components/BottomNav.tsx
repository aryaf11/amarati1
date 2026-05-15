"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, UserCircleIcon, VoteIcon, WrenchIcon } from "@/components/LandingIcons";
import type { AppLocale } from "@/lib/locale";
import { navT } from "@/lib/nav-dict";

export function BottomNav({
  locale,
  fallbackBuildingId,
}: {
  locale: AppLocale;
  fallbackBuildingId: string | null;
}) {
  const t = navT(locale);
  const pathname = usePathname() || "";

  const buildingMatch = pathname.match(/^\/building\/([^/]+)/);
  const pathBuildingId = buildingMatch?.[1] ?? null;
  const buildingId = pathBuildingId ?? fallbackBuildingId;

  const hasBuilding = Boolean(buildingId);
  const homeHref = buildingId
    ? `/dashboard?open=${encodeURIComponent(buildingId)}`
    : "/dashboard";
  const maintenanceHref = buildingId ? `/building/${buildingId}/maintenance` : "/dashboard";
  const votesHref = buildingId ? `/building/${buildingId}/votes` : "/dashboard";

  const onProfile = pathname.startsWith("/profile");
  const onHome = pathname === "/dashboard";
  const onMaintenance = /^\/building\/[^/]+\/maintenance/.test(pathname);
  const onVotes = /^\/building\/[^/]+\/votes/.test(pathname);

  const items: {
    key: string;
    href: string;
    label: string;
    icon: React.ReactNode;
    active: boolean;
    needsBuilding: boolean;
  }[] = [
    {
      key: "home",
      href: homeHref,
      label: t.home,
      icon: <HomeIcon className="size-6" />,
      active: onHome,
      needsBuilding: false,
    },
    {
      key: "maintenance",
      href: maintenanceHref,
      label: t.maintenance,
      icon: <WrenchIcon className="size-6" />,
      active: onMaintenance,
      needsBuilding: true,
    },
    {
      key: "votes",
      href: votesHref,
      label: t.votes,
      icon: <VoteIcon className="size-6" />,
      active: onVotes,
      needsBuilding: true,
    },
    {
      key: "profile",
      href: "/profile",
      label: t.profile,
      icon: <UserCircleIcon className="size-6" />,
      active: onProfile,
      needsBuilding: false,
    },
  ];

  return (
    <nav
      aria-label={t.bottomNav}
      className="fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur-md"
      style={{
        backgroundColor: "color-mix(in srgb, var(--card) 88%, transparent)",
        borderColor: "var(--card-border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-4">
        {items.map((it) => {
          const dimmed = it.needsBuilding && !hasBuilding;
          const inner = (
            <span
              className="flex flex-col items-center justify-center gap-1 px-2 py-2.5 text-[10px] font-medium transition"
              style={{
                color: it.active ? "var(--accent)" : "var(--muted)",
                opacity: dimmed ? 0.55 : 1,
              }}
            >
              <span
                className={`inline-flex size-10 items-center justify-center rounded-2xl transition ${
                  it.active ? "shadow-sm" : ""
                }`}
                style={{
                  backgroundColor: it.active ? "var(--accent-soft)" : "transparent",
                }}
              >
                {it.icon}
              </span>
              <span className="truncate">{it.label}</span>
            </span>
          );
          return (
            <li key={it.key}>
              <Link
                href={it.href}
                className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                aria-current={it.active ? "page" : undefined}
                aria-label={it.label}
                title={dimmed ? `${it.label} — ${homeHrefHint(locale)}` : it.label}
              >
                {inner}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function homeHrefHint(locale: AppLocale) {
  return locale === "en" ? "Pick a building first" : "اختر مبنى أولاً";
}
